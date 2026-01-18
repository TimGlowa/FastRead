/**
 * PDF Text Extraction Service
 *
 * Uses pdfjs-dist to extract text from PDF files.
 * Handles:
 * - Text extraction from all pages
 * - Preserving paragraph structure
 * - Basic metadata extraction
 */

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

// Lazy load pdfjs-dist to avoid SSR issues
let pdfjsModule: typeof import('pdfjs-dist') | null = null;

async function getPdfjs() {
  if (pdfjsModule) return pdfjsModule;

  // Only load in browser environment
  if (typeof window === 'undefined') {
    throw new Error('PDF extraction is only available in the browser');
  }

  pdfjsModule = await import('pdfjs-dist');
  pdfjsModule.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  return pdfjsModule;
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
  // Dynamically load pdfjs to avoid SSR issues
  const pdfjsLib = await getPdfjs();

  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Load PDF document
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

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
