'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { UploadDropzone } from '@/components/upload/UploadDropzone';
import { ReceiptAnalysisResult } from '@/components/upload/ReceiptAnalysisResult';
import type { CarbonExtraction, ReceiptItem } from '@/types';

interface UploadResult {
  logId: string;
  extraction: CarbonExtraction;
  items: ReceiptItem[];
}

export default function UploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/carbon/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Failed to analyze receipt. Please try again.');
        return;
      }

      setResult(json.data as UploadResult);
    } catch {
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navbar />

      <main id="main-content" className="pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Receipt Upload</h1>
            <p className="text-gray-500 mt-1">
              Upload a receipt photo or PDF — AI automatically classifies each item and calculates carbon
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-400 text-sm flex items-center gap-2"
            >
              <span aria-hidden="true">⚠️</span>
              {error}
            </div>
          )}

          {!result ? (
            <>
              <UploadDropzone onUpload={handleUpload} isUploading={isUploading} />

              {/* Info cards */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { icon: '🏪', title: 'Grocery stores', desc: 'Packaged food carbon' },
                  { icon: '👕', title: 'Fashion stores', desc: 'Shadow carbon calculation' },
                  { icon: '🛒', title: 'E-commerce', desc: 'Ghost supply chain inference' },
                ].map((info) => (
                  <div
                    key={info.title}
                    className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center"
                  >
                    <div className="text-2xl mb-2" aria-hidden="true">{info.icon}</div>
                    <div className="text-sm font-medium text-white">{info.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{info.desc}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <ReceiptAnalysisResult
              extraction={result.extraction}
              items={result.items}
              logId={result.logId}
              onSave={() => router.push('/dashboard')}
              onReset={handleReset}
            />
          )}
        </div>
      </main>
    </div>
  );
}
