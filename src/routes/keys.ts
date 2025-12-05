import { Router, Request, Response } from 'express';
import db from '../config/database';
import { generateApiKey, maskApiKey } from '../utils/apiKey';

const router = Router();

interface ApiKeyRecord {
  id: number;
  key_prefix: string;
  key_suffix: string;
  name: string;
  user_id: string;
  subscription_id: string | null;
  status: string;
  rate_limit_requests: number;
  rate_limit_window: number;
  total_requests: number;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

/**
 * Generate a new API key for a user
 * POST /api/keys/generate
 */
router.post('/generate', (req: Request, res: Response) => {
  const { userId, subscriptionId, name = 'Default Key', environment = 'live' } = req.body;

  if (!userId) {
    res.status(400).json({
      success: false,
      error: 'userId is required',
    });
    return;
  }

  try {
    // Check how many active keys the user has
    const activeKeys = db.prepare(`
      SELECT COUNT(*) as count FROM api_keys
      WHERE user_id = ? AND status = 'active'
    `).get(userId) as { count: number };

    if (activeKeys.count >= 5) {
      res.status(400).json({
        success: false,
        error: 'Maximum API keys reached',
        message: 'You can have up to 5 active API keys. Please revoke an existing key first.',
      });
      return;
    }

    // Generate new key
    const keyData = generateApiKey(environment as 'live' | 'test');

    // Insert into database
    const result = db.prepare(`
      INSERT INTO api_keys (
        key_hash, key_prefix, key_suffix, name, user_id, subscription_id,
        rate_limit_requests, rate_limit_window
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      keyData.keyHash,
      keyData.keyPrefix,
      keyData.keySuffix,
      name,
      userId,
      subscriptionId || null,
      1000, // Default rate limit
      3600  // 1 hour window
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        key: keyData.fullKey, // Only returned once!
        keyPrefix: keyData.keyPrefix,
        keySuffix: keyData.keySuffix,
        name,
        message: 'Store this key securely. It will not be shown again.',
      },
    });
  } catch (err) {
    console.error('Failed to generate API key:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key',
    });
  }
});

/**
 * List all API keys for a user
 * GET /api/keys/user/:userId
 */
router.get('/user/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const keys = db.prepare(`
      SELECT id, key_prefix, key_suffix, name, status,
             rate_limit_requests, rate_limit_window, total_requests,
             last_used_at, created_at, expires_at
      FROM api_keys
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId) as ApiKeyRecord[];

    res.json({
      success: true,
      data: keys.map(key => ({
        id: key.id,
        maskedKey: `${key.key_prefix}...${key.key_suffix}`,
        name: key.name,
        status: key.status,
        rateLimit: {
          requests: key.rate_limit_requests,
          windowSeconds: key.rate_limit_window,
        },
        usage: {
          totalRequests: key.total_requests,
          lastUsedAt: key.last_used_at,
        },
        createdAt: key.created_at,
        expiresAt: key.expires_at,
      })),
    });
  } catch (err) {
    console.error('Failed to list API keys:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to list API keys',
    });
  }
});

/**
 * Revoke an API key
 * DELETE /api/keys/:keyId
 */
router.delete('/:keyId', (req: Request, res: Response) => {
  const { keyId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({
      success: false,
      error: 'userId is required',
    });
    return;
  }

  try {
    const result = db.prepare(`
      UPDATE api_keys
      SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ? AND status = 'active'
    `).run(keyId, userId);

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        error: 'API key not found or already revoked',
      });
      return;
    }

    res.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (err) {
    console.error('Failed to revoke API key:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key',
    });
  }
});

/**
 * Suspend all API keys for a user (on subscription lapse)
 * POST /api/keys/suspend
 */
router.post('/suspend', (req: Request, res: Response) => {
  const { userId, subscriptionId } = req.body;

  if (!userId) {
    res.status(400).json({
      success: false,
      error: 'userId is required',
    });
    return;
  }

  try {
    let result;
    if (subscriptionId) {
      result = db.prepare(`
        UPDATE api_keys
        SET status = 'suspended'
        WHERE user_id = ? AND subscription_id = ? AND status = 'active'
      `).run(userId, subscriptionId);
    } else {
      result = db.prepare(`
        UPDATE api_keys
        SET status = 'suspended'
        WHERE user_id = ? AND status = 'active'
      `).run(userId);
    }

    res.json({
      success: true,
      message: `Suspended ${result.changes} API key(s)`,
      suspended: result.changes,
    });
  } catch (err) {
    console.error('Failed to suspend API keys:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to suspend API keys',
    });
  }
});

/**
 * Reactivate suspended API keys for a user (on payment success)
 * POST /api/keys/reactivate
 */
router.post('/reactivate', (req: Request, res: Response) => {
  const { userId, subscriptionId } = req.body;

  if (!userId) {
    res.status(400).json({
      success: false,
      error: 'userId is required',
    });
    return;
  }

  try {
    let result;
    if (subscriptionId) {
      result = db.prepare(`
        UPDATE api_keys
        SET status = 'active'
        WHERE user_id = ? AND subscription_id = ? AND status = 'suspended'
      `).run(userId, subscriptionId);
    } else {
      result = db.prepare(`
        UPDATE api_keys
        SET status = 'active'
        WHERE user_id = ? AND status = 'suspended'
      `).run(userId);
    }

    res.json({
      success: true,
      message: `Reactivated ${result.changes} API key(s)`,
      reactivated: result.changes,
    });
  } catch (err) {
    console.error('Failed to reactivate API keys:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to reactivate API keys',
    });
  }
});

/**
 * Update API key name
 * PATCH /api/keys/:keyId
 */
router.patch('/:keyId', (req: Request, res: Response) => {
  const { keyId } = req.params;
  const { userId, name } = req.body;

  if (!userId || !name) {
    res.status(400).json({
      success: false,
      error: 'userId and name are required',
    });
    return;
  }

  try {
    const result = db.prepare(`
      UPDATE api_keys
      SET name = ?
      WHERE id = ? AND user_id = ?
    `).run(name, keyId, userId);

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        error: 'API key not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'API key updated successfully',
    });
  } catch (err) {
    console.error('Failed to update API key:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update API key',
    });
  }
});

export default router;
