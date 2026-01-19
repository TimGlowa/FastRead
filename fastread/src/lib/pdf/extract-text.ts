/**
 * PDF Text Extraction Service
 *
 * Uses pdfjs-dist to extract text from PDF files.
 * Handles:
 * - Text extraction from all pages
 * - Preserving paragraph structure
 * - Basic metadata extraction
 */

// Polyfill for Promise.withResolvers (Safari doesn't support it yet)
if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function <T>(): {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
  } {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
  };
}

import type {
  PDFDocumentProxy,
  TextItem,
  TextMarkedContent,
} from 'pdfjs-dist/types/src/display/api';

export interface PDFExtractionResult {
  text: string;
  pageCount: number;
  metadata: PDFMetadata;
}

export interface PDFMetadata {
  title: string | null;
  author: string | null;
  subject: string | null;
  creator: string | null;
  creationDate: Date | null;
}

// Store references to loaded functions
let getDocumentFn: typeof import('pdfjs-dist').getDocument | null = null;
let workerConfigured = false;

async function getPdfjs() {
  if (getDocumentFn && workerConfigured) {
    return { getDocument: getDocumentFn };
  }

  // Only load in browser environment
  if (typeof window === 'undefined') {
    throw new Error('PDF extraction is only available in the browser');
  }

  // Import named exports directly
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');

  console.log('[PDF] Module loaded, getDocument type:', typeof getDocument);
  console.log('[PDF] GlobalWorkerOptions:', GlobalWorkerOptions);

  // Configure worker (v3 uses .js, not .mjs)
  if (!workerConfigured) {
    GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    workerConfigured = true;
    console.log('[PDF] Worker configured:', GlobalWorkerOptions.workerSrc);
  }

  getDocumentFn = getDocument;
  return { getDocument };
}

/**
 * Check if a TextContent item is a TextItem (has 'str' property)
 */
function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return 'str' in item;
}

/**
 * Extract text from a single PDF page
 */
async function extractPageText(pdf: PDFDocumentProxy, pageNum: number): Promise<string> {
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent();

  let lastY: number | null = null;
  const lines: string[] = [];
  let currentLine = '';

  for (const item of textContent.items) {
    if (!isTextItem(item)) continue;

    const { str, transform } = item;
    const y = transform[5];

    // Detect new line based on Y position change
    if (lastY !== null && Math.abs(y - lastY) > 5) {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      currentLine = str;
    } else {
      // Same line - append with space if needed
      if (currentLine && !currentLine.endsWith(' ') && !str.startsWith(' ')) {
        currentLine += ' ';
      }
      currentLine += str;
    }

    lastY = y;
  }

  // Push the last line
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines.join('\n');
}

/**
 * Parse PDF metadata date string
 */
function parsePDFDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;

  // PDF dates are in format: D:YYYYMMDDHHmmSSOHH'mm'
  const match = dateStr.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
  if (!match) return null;

  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );
}

/**
 * Extract text and metadata from a PDF file
 */
export async function extractTextFromPDF(file: File): Promise<PDFExtractionResult> {
  console.log('[PDF] Starting extraction for:', file.name, 'size:', file.size);

  // Dynamically load pdfjs to avoid SSR issues
  let getDocument: typeof import('pdfjs-dist').getDocument;
  try {
    console.log('[PDF] Loading pdfjs-dist...');
    const pdfjs = await getPdfjs();
    getDocument = pdfjs.getDocument;
    console.log('[PDF] pdfjs-dist loaded, getDocument:', typeof getDocument);
  } catch (err) {
    console.error('[PDF] Failed to load pdfjs-dist:', err);
    throw err;
  }

  // Convert File to ArrayBuffer
  console.log('[PDF] Converting file to ArrayBuffer...');
  const arrayBuffer = await file.arrayBuffer();
  console.log('[PDF] ArrayBuffer size:', arrayBuffer.byteLength);

  // Load PDF document
  console.log('[PDF] Loading PDF document...');
  let pdf;
  try {
    // Pass data as Uint8Array for better compatibility
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log('[PDF] Created Uint8Array, length:', uint8Array.length);

    const loadingTask = getDocument({ data: uint8Array });
    console.log('[PDF] Loading task created:', loadingTask);
    pdf = await loadingTask.promise;
    console.log('[PDF] PDF loaded, pages:', pdf.numPages);
  } catch (err) {
    console.error('[PDF] Failed to load PDF document:', err);
    throw err;
  }

  // Extract metadata
  const metadataObj = await pdf.getMetadata();
  const info = metadataObj.info as Record<string, unknown>;

  const metadata: PDFMetadata = {
    title: (info?.Title as string) || null,
    author: (info?.Author as string) || null,
    subject: (info?.Subject as string) || null,
    creator: (info?.Creator as string) || null,
    creationDate: parsePDFDate((info?.CreationDate as string) || null),
  };

  // Extract text from all pages
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const pageText = await extractPageText(pdf, i);
    if (pageText.trim()) {
      pageTexts.push(pageText);
    }
  }

  // Join pages with double newline (paragraph separator)
  const fullText = pageTexts.join('\n\n');

  return {
    text: fullText,
    pageCount: pdf.numPages,
    metadata,
  };
}

/**
 * Validate that a file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
