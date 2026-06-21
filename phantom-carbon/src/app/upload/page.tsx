'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { UploadDropzone } from '@/components/upload/UploadDropzone';
import { ReceiptAnalysisResult } from '@/components/upload/ReceiptAnalysisResult';
import type { CarbonExtraction, ReceiptItem } from '@/types';

interface UploadResult {
  extraction: CarbonExtraction;
  items: ReceiptItem[];
  fileName?: string;
  saved?: boolean;
  logId?: string;
}

// Vercel serverless limit is 4.5MB — target 3MB after compression
const TARGET_SIZE_BYTES = 3 * 1024 * 1024;

/**
 * Compress an image file using the browser Canvas API.
 * Returns a new File with reduced size, or the original if already small enough.
 * PDFs are returned unchanged.
 */
async function compressImageForUpload(file: File): Promise<File> {
  if (file.type === 'application/pdf') return file;
  if (file.size <= TARGET_SIZE_BYTES) return file;

  return new Promise((resolve) => {
    const img  = new Image();
    const url  = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas  = document.createElement('canvas');
      const MAX_DIM = 2000;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);

      const tryQuality = (quality: number) => {
        canvas.toBlob((blob) => {
          if (!blob) { resolve(file); return; }
          if (blob.size > TARGET_SIZE_BYTES && quality > 0.35) {
            tryQuality(quality - 0.15);
            return;
          }
          const out = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
          console.info(`[Upload] ${(file.size / 1024 / 1024).toFixed(1)}MB → ${(out.size / 1024 / 1024).toFixed(1)}MB`);
          resolve(out);
        }, 'image/jpeg', quality);
      };
      tryQuality(0.7);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export default function UploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);
  const [result,  setResult]  = useState<UploadResult | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  // ─── Step 1: Analyze receipt (does NOT save to DB) ──────────────────────────
  async function handleUpload(file: File) {
    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      let uploadFile = file;
      if (file.type !== 'application/pdf' && file.size > TARGET_SIZE_BYTES) {
        setCompressing(true);
        uploadFile = await compressImageForUpload(file);
        setCompressing(false);
      }

      const formData = new FormData();
      formData.append('file', uploadFile);

      const res  = await fetch('/api/carbon/upload', { method: 'POST', body: formData });
      const json = await res.json();

      if (!res.ok) {
        setError(res.status === 413
          ? 'Image too large. Try a smaller photo (under 5MB).'
          : (json.error ?? 'Failed to analyze receipt. Please try again.'));
        return;
      }

      setResult({
        extraction: json.data.extraction,
        items:      json.data.items,
        fileName:   json.data.fileName,
      });
    } catch {
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
      setCompressing(false);
    }
  }

  // ─── Step 2: Save to DB only when user confirms ──────────────────────────────
  async function handleSave() {
    if (!result) return;
    setIsSaving(true);
    setError(null);

    try {
      const res  = await fetch('/api/carbon/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName:      result.fileName,
          inputType:     'RECEIPT',
          surfaceCarbon: result.extraction.surfaceCarbon,
          shadowCarbon:  result.extraction.shadowCarbon,
          ghostCarbon:   result.extraction.ghostCarbon,
          totalCarbon:   result.extraction.totalCarbon,
          breakdown:     result.extraction.breakdown,
          sources:       result.extraction.sources,
          confidence:    result.extraction.confidence,
          topAction:     result.extraction.topAction,
          summary:       result.extraction.summary,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Failed to save. Please try again.');
        return;
      }

      setResult({ ...result, saved: true, logId: json.data.logId });
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
  }

  const loadingLabel = compressing ? 'Optimizing image…' : 'Analyzing receipt with AI…';

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <Navbar />

      <main id="main-content" className="pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Receipt Upload</h1>
            <p className="text-gray-500 mt-1">
              Upload a receipt photo or PDF — Vision AI reads each item, then you review before saving
            </p>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" aria-live="assertive" className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <span aria-hidden="true">⚠️</span>
              {error}
            </div>
          )}

          {/* Compressing notice */}
          {compressing && (
            <div role="status" aria-live="polite" className="mb-6 p-4 bg-blue-900/20 border border-blue-700/40 rounded-xl text-blue-400 text-sm flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" aria-hidden="true" />
              Optimizing image size for upload…
            </div>
          )}

          {/* Saved confirmation */}
          {result?.saved && (
            <div role="status" aria-live="polite" className="mb-6 p-4 bg-green-900/30 border border-green-700/40 rounded-xl text-green-400 text-sm flex items-center gap-2">
              <span aria-hidden="true">✅</span>
              Saved to your carbon log — redirecting to dashboard…
            </div>
          )}

          {!result ? (
            <>
              <UploadDropzone onUpload={handleUpload} isUploading={isUploading} loadingLabel={loadingLabel} />

              <div className="mt-6 p-4 bg-gray-900/30 border border-gray-800 rounded-xl">
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">How it works</p>
                <ol className="space-y-1 text-xs text-gray-600 list-decimal list-inside">
                  <li>Upload your receipt photo or PDF</li>
                  <li>AI reads and classifies every item</li>
                  <li>Review the carbon analysis</li>
                  <li>Click <span className="text-gray-400">Save to carbon log</span> to confirm</li>
                </ol>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                {[
                  { icon: '🍕', title: 'Food & Dining', desc: 'Restaurant & delivery receipts' },
                  { icon: '👕', title: 'Fashion',       desc: 'Shadow carbon calculation' },
                  { icon: '🛒', title: 'E-commerce',    desc: 'Ghost supply chain inference' },
                ].map((info) => (
                  <div key={info.title} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
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
              logId={result.logId ?? ''}
              onSave={result.saved ? undefined : handleSave}
              onReset={handleReset}
              isSaving={isSaving}
            />
          )}
        </div>
      </main>
    </div>
  );
}
