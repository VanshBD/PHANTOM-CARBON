'use client';

import { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';

interface UploadDropzoneProps {
  onUpload: (_file: File) => void;
  isUploading?: boolean;
  loadingLabel?: string;
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg':  ['.jpg', '.jpeg'],
  'image/png':   ['.png'],
  'image/webp':  ['.webp'],
  'image/heic':  ['.heic'],
  'image/heif':  ['.heif'],
  'image/gif':   ['.gif'],
  'image/bmp':   ['.bmp'],
  'image/avif':  ['.avif'],
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function UploadDropzone({ onUpload, isUploading = false, loadingLabel = 'Analyzing receipt…' }: UploadDropzoneProps) {
  const [fileError, setFileError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setFileError(null);

      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0];
        if (err.message.includes('size')) {
          setFileError('File too large. Maximum size is 5MB.');
        } else {
          setFileError('Unsupported file type. Please upload PDF, JPEG, PNG, or WEBP.');
        }
        return;
      }

      if (acceptedFiles[0]) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled: isUploading,
  });

  const currentFile = acceptedFiles[0];

  return (
    <div className="w-full">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
          ${isDragActive
            ? 'border-green-500 bg-green-900/20'
            : 'border-gray-700 hover:border-gray-600 bg-gray-900/30'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none
        `}
        role="button"
        aria-label="Upload receipt — click to browse or drag and drop a PDF, JPEG, PNG, or WEBP file"
        aria-describedby="dropzone-description"
        aria-invalid={fileError ? true : undefined}
        aria-errormessage={fileError ? 'dropzone-error' : undefined}
        tabIndex={0}
      >
        <input
          {...getInputProps()}
          aria-hidden="true"
        />

        <div className="flex flex-col items-center gap-4">
          <div
            className={`text-5xl transition-transform ${isDragActive ? 'scale-110' : ''}`}
            aria-hidden="true"
          >
            {isDragActive ? '📂' : currentFile ? '✅' : '📄'}
          </div>

          {isDragActive ? (
            <p className="text-green-400 font-semibold text-lg">Drop it here</p>
          ) : currentFile ? (
            <div>
              <p className="text-white font-semibold">{currentFile.name}</p>
              <p className="text-gray-500 text-sm mt-1">
                {(currentFile.size / 1024).toFixed(1)} KB · {currentFile.type}
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-white font-semibold text-lg">Drop your receipt here</p>
                <p className="text-gray-500 mt-1">or click to browse files</p>
              </div>
              <p id="dropzone-description" className="text-sm text-gray-600">
                Supports PDF, JPEG, PNG, WEBP · Max 5MB
              </p>
            </>
          )}

          {isUploading && (
            <div
              className="flex items-center gap-2 text-green-400 text-sm"
              aria-live="polite"
              aria-label={loadingLabel}
            >
              <span className="w-4 h-4 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" aria-hidden="true" />
              {loadingLabel}
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {fileError && (
        <p
          id="dropzone-error"
          className="mt-3 text-sm text-red-400 flex items-center gap-2"
          role="alert"
          aria-live="assertive"
        >
          <span aria-hidden="true">⚠️</span>
          {fileError}
        </p>
      )}

      {/* Accepted formats info */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center" aria-label="Accepted file formats">
        {['PDF', 'JPEG', 'PNG', 'WEBP', 'HEIC', 'BMP'].map((fmt) => (
          <span key={fmt} className="text-xs bg-gray-800 text-gray-500 border border-gray-700 rounded px-2 py-1">
            .{fmt.toLowerCase()}
          </span>
        ))}
      </div>
    </div>
  );
}
