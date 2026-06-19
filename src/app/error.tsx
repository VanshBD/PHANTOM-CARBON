'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to monitoring in production
    console.error('[GlobalError]', error.message, error.digest);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4">
      <main id="main-content" className="text-center max-w-md">
        <div className="text-6xl mb-4" aria-hidden="true">⚠️</div>
        <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
        <p className="text-gray-500 mb-6 text-sm">
          An unexpected error occurred. Your data is safe — this is a temporary issue.
        </p>
        {error.digest && (
          <p className="text-xs text-gray-700 mb-4 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-green-600 hover:bg-green-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-green-400"
            aria-label="Try loading the page again"
          >
            Try again
          </button>
          <a
            href="/"
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-5 py-2.5 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-gray-500"
          >
            Go home
          </a>
        </div>
      </main>
    </div>
  );
}
