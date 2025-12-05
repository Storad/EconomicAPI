import { Request, Response, NextFunction } from 'express';
import db from '../config/database';
import { hashApiKey, validateKeyFormat } from '../utils/apiKey';

export interface ApiKeyInfo {
  id: number;
  userId: string;
  subscriptionId: string | null;
  name: string;
  rateLimit: number;
  rateLimitWindow: number;
}

export interface AuthenticatedRequest extends Request {
  apiKey?: ApiKeyInfo;
}

interface ApiKeyRecord {
  id: number;
  user_id: string;
  subscription_id: string | null;
  name: string;
  status: string;
  rate_limit_requests: number;
  rate_limit_window: number;
  expires_at: string | null;
}

/**
 * Middleware to validate API keys on protected routes
 */
export function apiKeyAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Extract API key from header or query param
  const apiKey = (req.headers['x-api-key'] as string) || (req.query.api_key as string);

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: 'API key required',
      message: 'Please provide an API key via X-API-Key header or api_key query parameter',
      docs: 'https://economicapi.com/docs',
    });
    return;
  }

  // Validate format
  if (!validateKeyFormat(apiKey)) {
    res.status(401).json({
      success: false,
      error: 'Invalid API key format',
    });
    return;
  }

  // Hash and lookup
  const keyHash = hashApiKey(apiKey);

  const keyRecord = db.prepare(`
    SELECT id, user_id, subscription_id, name, status,
           rate_limit_requests, rate_limit_window, expires_at
    FROM api_keys
    WHERE key_hash = ?
  `).get(keyHash) as ApiKeyRecord | undefined;

  if (!keyRecord) {
    res.status(401).json({
      success: false,
      error: 'Invalid API key',
    });
    return;
  }

  // Check status
  if (keyRecord.status !== 'active') {
    res.status(403).json({
      success: false,
      error: `API key is ${keyRecord.status}`,
      message:
        keyRecord.status === 'suspended'
          ? 'Your subscription may have lapsed. Please check your billing status.'
          : `This API key has been ${keyRecord.status}.`,
    });
    return;
  }

  // Check expiration
  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    res.status(403).json({
      success: false,
      error: 'API key expired',
    });
    return;
  }

  // Attach key info to request
  req.apiKey = {
    id: keyRecord.id,
    userId: keyRecord.user_id,
    subscriptionId: keyRecord.subscription_id,
    name: keyRecord.name,
    rateLimit: keyRecord.rate_limit_requests,
    rateLimitWindow: keyRecord.rate_limit_window,
  };

  // Update last used timestamp and request count (async, don't wait)
  setImmediate(() => {
    try {
      db.prepare(`
        UPDATE api_keys
        SET last_used_at = CURRENT_TIMESTAMP,
            total_requests = total_requests + 1
        WHERE id = ?
      `).run(keyRecord.id);
    } catch (err) {
      console.error('Failed to update API key usage:', err);
    }
  });

  next();
}

/**
 * Middleware to validate internal requests from Next.js frontend
 */
export function internalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const internalKey = req.headers['x-internal-key'] as string;
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!expectedKey) {
    console.warn('INTERNAL_API_KEY not configured');
    res.status(500).json({ success: false, error: 'Server configuration error' });
    return;
  }

  if (!internalKey || internalKey !== expectedKey) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  next();
}
