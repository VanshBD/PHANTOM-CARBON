import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '404 — Page Not Found' };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-4">
      <main id="main-content" className="text-center">
        <div className="text-7xl mb-6" aria-hidden="true">👻</div>
        <h1 className="text-4xl font-bold text-white mb-3">404</h1>
        <h2 className="text-xl text-gray-400 mb-6">This page has gone phantom</h2>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e1a]"
        >
          ← Back to home
        </Link>
      </main>
    </div>
  );
}
