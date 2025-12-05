import crypto from 'crypto';

export interface GeneratedApiKey {
  fullKey: string;
  keyHash: string;
  keyPrefix: string;
  keySuffix: string;
}

/**
 * Generate a new API key with prefix and hash
 * Format: econ_live_ + 32 random bytes as base64url (~55 chars total)
 */
export function generateApiKey(environment: 'live' | 'test' = 'live'): GeneratedApiKey {
  const prefix = environment === 'live' ? 'econ_live_' : 'econ_test_';
  const randomBytes = crypto.randomBytes(32);
  const randomPart = randomBytes.toString('base64url');
  const fullKey = `${prefix}${randomPart}`;

  return {
    fullKey,
    keyHash: hashApiKey(fullKey),
    keyPrefix: fullKey.substring(0, 12),
    keySuffix: fullKey.slice(-4),
  };
}

/**
 * Hash an API key using SHA-256
 * Only the hash is stored in the database, never the raw key
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Validate API key format
 */
export function validateKeyFormat(key: string): boolean {
  if (!key || typeof key !== 'string') return false;

  const validPrefixes = ['econ_live_', 'econ_test_'];
  const hasValidPrefix = validPrefixes.some(p => key.startsWith(p));

  // Prefix (10) + base64url of 32 bytes (43) = 53 chars
  const minLength = 50;
  const maxLength = 60;

  return hasValidPrefix && key.length >= minLength && key.length <= maxLength;
}

/**
 * Mask an API key for display (show prefix and last 4 chars only)
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 20) return '****';
  return `${key.substring(0, 12)}...${key.slice(-4)}`;
}
