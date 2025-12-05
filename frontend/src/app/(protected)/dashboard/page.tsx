'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Plus, Key, BookOpen, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { ApiKeyCard } from '@/components/dashboard/ApiKeyCard';
import { NewKeyModal } from '@/components/dashboard/NewKeyModal';
import type { ApiKeyData } from '@/lib/api';

export default function DashboardPage() {
  const { user } = useUser();
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchApiKeys();
    }
  }, [user?.id]);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch(`/api/keys?userId=${user?.id}`);
      const data = await response.json();
      if (data.success) {
        setApiKeys(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateKey = async (name: string): Promise<string> => {
    const response = await fetch('/api/keys/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate key');
    }

    await fetchApiKeys();
    return data.data.key;
  };

  const handleRevokeKey = async (keyId: number) => {
    const response = await fetch(`/api/keys/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyId }),
    });

    if (response.ok) {
      await fetchApiKeys();
    }
  };

  const activeKeys = apiKeys.filter((k) => k.status === 'active');

  return (
    <div className="py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage your API keys and monitor usage
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/docs"
            className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            <BookOpen className="h-8 w-8 text-zinc-600 dark:text-zinc-400" />
            <div>
              <h3 className="font-semibold">Documentation</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Learn how to use the API
              </p>
            </div>
            <ExternalLink className="h-4 w-4 ml-auto text-zinc-400" />
          </Link>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'https://web-production-fcfcb.up.railway.app'}/api`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            <Key className="h-8 w-8 text-zinc-600 dark:text-zinc-400" />
            <div>
              <h3 className="font-semibold">API Reference</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                View available endpoints
              </p>
            </div>
            <ExternalLink className="h-4 w-4 ml-auto text-zinc-400" />
          </a>
        </div>

        {/* API Keys Section */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">API Keys</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {activeKeys.length} of 5 keys active
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={activeKeys.length >= 5}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            New Key
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100 mx-auto"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <Key className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No API keys yet</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Generate your first API key to start using the Economic API
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Plus className="h-4 w-4" />
              Generate Key
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apiKeys.map((key) => (
              <ApiKeyCard
                key={key.id}
                apiKey={key}
                onRevoke={handleRevokeKey}
              />
            ))}
          </div>
        )}

        <NewKeyModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onGenerate={handleGenerateKey}
        />
      </div>
    </div>
  );
}
