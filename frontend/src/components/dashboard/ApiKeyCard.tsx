'use client';

import { useState } from 'react';
import { Copy, Trash2, Check, Eye, EyeOff } from 'lucide-react';
import type { ApiKeyData } from '@/lib/api';

interface ApiKeyCardProps {
  apiKey: ApiKeyData;
  onRevoke: (keyId: number) => Promise<void>;
}

export function ApiKeyCard({ apiKey, onRevoke }: ApiKeyCardProps) {
  const [isRevoking, setIsRevoking] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey.maskedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }
    setIsRevoking(true);
    try {
      await onRevoke(apiKey.id);
    } finally {
      setIsRevoking(false);
    }
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    revoked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    expired: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400',
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg">{apiKey.name}</h3>
          <span
            className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${statusColors[apiKey.status]}`}
          >
            {apiKey.status}
          </span>
        </div>
        {apiKey.status === 'active' && (
          <button
            onClick={handleRevoke}
            disabled={isRevoking}
            className="p-2 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
            title="Revoke key"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-md p-3 mb-4">
        <div className="flex items-center justify-between">
          <code className="text-sm font-mono">{apiKey.maskedKey}</code>
          <button
            onClick={handleCopy}
            className="p-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Rate Limit</span>
          <p className="font-medium">
            {apiKey.rateLimit.requests.toLocaleString()} / hour
          </p>
        </div>
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Total Requests</span>
          <p className="font-medium">
            {apiKey.usage.totalRequests.toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Created</span>
          <p className="font-medium">
            {new Date(apiKey.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Last Used</span>
          <p className="font-medium">
            {apiKey.usage.lastUsedAt
              ? new Date(apiKey.usage.lastUsedAt).toLocaleDateString()
              : 'Never'}
          </p>
        </div>
      </div>
    </div>
  );
}
