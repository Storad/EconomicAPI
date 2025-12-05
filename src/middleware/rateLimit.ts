import { Response, NextFunction } from 'express';
import db from '../config/database';
import { AuthenticatedRequest } from './apiKeyAuth';

interface RateLimitRecord {
  request_count: number;
}

/**
 * Rate limiting middleware using sliding window algorithm
 * Limits requests based on API key's configured rate limit
 */
export function rateLimiter(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.apiKey) {
    res.status(500).json({
      success: false,
      error: 'Rate limiter requires authenticated request',
    });
    return;
  }

  const { id, rateLimit, rateLimitWindow } = req.apiKey;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % rateLimitWindow);

  // Get current request count for this window
  const record = db.prepare(`
    SELECT request_count
    FROM rate_limit_cache
    WHERE key_hash = (SELECT key_hash FROM api_keys WHERE id = ?)
      AND window_start = ?
  `).get(id, windowStart) as RateLimitRecord | undefined;

  const currentCount = record?.request_count || 0;

  // Check if rate limit exceeded
  if (currentCount >= rateLimit) {
    const resetTime = windowStart + rateLimitWindow;
    const retryAfter = resetTime - now;

    res.set({
      'X-RateLimit-Limit': rateLimit.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': resetTime.toString(),
      'Retry-After': retryAfter.toString(),
    });

    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: `You have exceeded ${rateLimit} requests per ${rateLimitWindow / 60} minutes. Please wait ${retryAfter} seconds.`,
      retryAfter,
    });
    return;
  }

  // Increment request count
  try {
    db.prepare(`
      INSERT INTO rate_limit_cache (key_hash, window_start, request_count)
      VALUES ((SELECT key_hash FROM api_keys WHERE id = ?), ?, 1)
      ON CONFLICT(key_hash, window_start) DO UPDATE SET request_count = request_count + 1
    `).run(id, windowStart);
  } catch (err) {
    console.error('Failed to update rate limit cache:', err);
    // Don't block the request if rate limit tracking fails
  }

  // Set rate limit headers
  const remaining = Math.max(0, rateLimit - currentCount - 1);
  const resetTime = windowStart + rateLimitWindow;

  res.set({
    'X-RateLimit-Limit': rateLimit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetTime.toString(),
  });

  next();
}

/**
 * Clean up old rate limit cache entries
 * Should be run periodically (e.g., every hour)
 */
export function cleanupRateLimitCache(): void {
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - 7200; // Remove entries older than 2 hours

  try {
    const result = db.prepare(`
      DELETE FROM rate_limit_cache
      WHERE window_start < ?
    `).run(cutoff);

    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} old rate limit cache entries`);
    }
  } catch (err) {
    console.error('Failed to cleanup rate limit cache:', err);
  }
}
