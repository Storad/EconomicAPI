'use client';

import { useState } from 'react';
import { X, Copy, Check, AlertTriangle } from 'lucide-react';

interface NewKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (name: string) => Promise<string>;
}

export function NewKeyModal({ isOpen, onClose, onGenerate }: NewKeyModalProps) {
  const [name, setName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!name.trim()) {
      setError('Please enter a name for this API key');
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      const key = await onGenerate(name.trim());
      setGeneratedKey(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate key');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedKey) {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName('');
    setGeneratedKey(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />
      <div className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">
          {generatedKey ? 'API Key Generated' : 'Generate New API Key'}
        </h2>

        {generatedKey ? (
          <div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-4">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Make sure to copy your API key now. You won&apos;t be able to see
                  it again!
                </p>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-md p-4 mb-6">
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono break-all">
                  {generatedKey}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex-shrink-0"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-2 px-4 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2">
              Key Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production, Development"
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 mb-4"
            />

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-2 px-4 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 py-2 px-4 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
