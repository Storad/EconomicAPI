const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-fcfcb.up.railway.app';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

export interface ApiKeyData {
  id: number;
  maskedKey: string;
  name: string;
  status: string;
  rateLimit: {
    requests: number;
    windowSeconds: number;
  };
  usage: {
    totalRequests: number;
    lastUsedAt: string | null;
  };
  createdAt: string;
  expiresAt: string | null;
}

export interface GeneratedKey {
  id: number;
  key: string;
  keyPrefix: string;
  keySuffix: string;
  name: string;
  message: string;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Key': INTERNAL_API_KEY || '',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

export async function generateApiKey(
  userId: string,
  subscriptionId?: string,
  name?: string
): Promise<GeneratedKey> {
  const response = await apiRequest<{ success: boolean; data: GeneratedKey }>(
    '/api/keys/generate',
    {
      method: 'POST',
      body: JSON.stringify({ userId, subscriptionId, name }),
    }
  );
  return response.data;
}

export async function getUserApiKeys(userId: string): Promise<ApiKeyData[]> {
  const response = await apiRequest<{ success: boolean; data: ApiKeyData[] }>(
    `/api/keys/user/${userId}`
  );
  return response.data;
}

export async function revokeApiKey(
  keyId: number,
  userId: string
): Promise<void> {
  await apiRequest(`/api/keys/${keyId}`, {
    method: 'DELETE',
    body: JSON.stringify({ userId }),
  });
}

export async function updateApiKeyName(
  keyId: number,
  userId: string,
  name: string
): Promise<void> {
  await apiRequest(`/api/keys/${keyId}`, {
    method: 'PATCH',
    body: JSON.stringify({ userId, name }),
  });
}

export async function suspendUserKeys(
  userId: string,
  subscriptionId?: string
): Promise<void> {
  await apiRequest('/api/keys/suspend', {
    method: 'POST',
    body: JSON.stringify({ userId, subscriptionId }),
  });
}

export async function reactivateUserKeys(
  userId: string,
  subscriptionId?: string
): Promise<void> {
  await apiRequest('/api/keys/reactivate', {
    method: 'POST',
    body: JSON.stringify({ userId, subscriptionId }),
  });
}
