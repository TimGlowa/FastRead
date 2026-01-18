'use client';

import { useCallback, useState, useRef } from 'react';

import { extractTextFromPDF, isPDFFile, formatFileSize } from '@/lib/pdf/extract-text';
import { tokenize } from '@/lib/text-processor';
import { useReaderStore } from '@/stores';

import type { ParsedDocument } from '@/types';

export interface PDFUploadProps {
  className?: string;
  onUploadStart?: () => void;
  onUploadComplete?: (document: ParsedDocument) => void;
  onError?: (error: string) => void;
}

type UploadStatus = 'idle' | 'dragging' | 'processing' | 'error';

export function PDFUpload({
  className = '',
  onUploadStart,
  onUploadComplete,
  onError,
}: PDFUploadProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setDocument = useReaderStore((state) => state.setDocument);
  const setWords = useReaderStore((state) => state.setWords);

  const processFile = useCallback(
    async (file: File) => {
      // Validate file type
      if (!isPDFFile(file)) {
        const errorMsg = 'Please upload a PDF file';
        setError(errorMsg);
        setStatus('error');
        onError?.(errorMsg);
        return;
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        const errorMsg = `File too large. Maximum size is 50MB, got ${formatFileSize(file.size)}`;
        setError(errorMsg);
        setStatus('error');
        onError?.(errorMsg);
        return;
      }

      setStatus('processing');
      setError(null);
      setProgress('Extracting text from PDF...');
      onUploadStart?.();

      try {
        // Extract text from PDF
        const result = await extractTextFromPDF(file);

        if (!result.text.trim()) {
          throw new Error('No text content found in PDF. The file may be scanned or image-based.');
        }

        setProgress('Processing text...');

        // Tokenize the extracted text
        const tokens = tokenize(result.text);

        if (tokens.length === 0) {
          throw new Error('Could not extract any words from the PDF');
        }

        // Create parsed document
        const document: ParsedDocument = {
          id: crypto.randomUUID(),
          originalFileName: file.name,
          title: result.metadata.title || file.name.replace(/\.pdf$/i, ''),
          authors: result.metadata.author ? [result.metadata.author] : null,
          sections: [
            {
              type: 'other',
              title: 'Full Document',
              content: result.text,
              startIndex: 0,
              endIndex: tokens.length - 1,
              included: true,
            },
          ],
          rawText: result.text,
          cleanedText: result.text,
          citations: [],
          parsingConfidence: 0.8,
          createdAt: new Date(),
        };

        // Update store
        setDocument(document);
        setWords(tokens.map((t) => t.word));

        setStatus('idle');
        setProgress('');
        onUploadComplete?.(document);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to process PDF';
        setError(errorMsg);
        setStatus('error');
        onError?.(errorMsg);
      }
    },
    [setDocument, setWords, onUploadStart, onUploadComplete, onError]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus('dragging');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus('idle');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setStatus('idle');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [processFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const isProcessing = status === 'processing';
  const isDragging = status === 'dragging';
  const hasError = status === 'error';

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload PDF file"
        aria-disabled={isProcessing}
        onClick={!isProcessing ? handleClick : undefined}
        onKeyDown={!isProcessing ? handleKeyDown : undefined}
        onDragOver={!isProcessing ? handleDragOver : undefined}
        onDragLeave={!isProcessing ? handleDragLeave : undefined}
        onDrop={!isProcessing ? handleDrop : undefined}
        className={`
          relative flex flex-col items-center justify-center
          min-h-[200px] p-8 rounded-lg border-2 border-dashed
          transition-colors duration-200 cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border-primary'}
          ${hasError ? 'border-red-500 bg-red-500/5' : ''}
          ${isProcessing ? 'cursor-wait opacity-75' : 'hover:border-primary hover:bg-primary/5'}
        `}
        data-testid="pdf-upload-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="sr-only"
          aria-hidden="true"
          disabled={isProcessing}
        />

        {/* Icon */}
        <svg
          className={`w-12 h-12 mb-4 ${hasError ? 'text-red-500' : 'text-text-secondary'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        {/* Text content */}
        {isProcessing ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg
                className="animate-spin h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-text-primary font-medium">Processing...</span>
            </div>
            <p className="text-sm text-text-secondary">{progress}</p>
          </div>
        ) : hasError ? (
          <div className="text-center">
            <p className="text-red-500 font-medium mb-1">Upload failed</p>
            <p className="text-sm text-red-400">{error}</p>
            <p className="text-sm text-text-secondary mt-2">Click or drag to try again</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-text-primary font-medium mb-1">
              {isDragging ? 'Drop PDF here' : 'Upload a PDF'}
            </p>
            <p className="text-sm text-text-secondary">Drag and drop or click to select</p>
            <p className="text-xs text-text-secondary mt-2">Maximum file size: 50MB</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PDFUpload;
