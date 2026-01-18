import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { extractTextFromPDF, isPDFFile } from '@/lib/pdf/extract-text';
import { useReaderStore } from '@/stores';

import { PDFUpload } from './PDFUpload';

// Mock PDF extraction
vi.mock('@/lib/pdf/extract-text', () => ({
  extractTextFromPDF: vi.fn(),
  isPDFFile: vi.fn((file: File) => file.type === 'application/pdf'),
  formatFileSize: vi.fn((bytes: number) => `${bytes} bytes`),
}));

// Get mocked functions
const mockExtractTextFromPDF = vi.mocked(extractTextFromPDF);
const mockIsPDFFile = vi.mocked(isPDFFile);

describe('PDFUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useReaderStore.getState().reset();
  });

  it('renders upload dropzone', () => {
    render(<PDFUpload />);

    expect(screen.getByTestId('pdf-upload-dropzone')).toBeInTheDocument();
    expect(screen.getByText('Upload a PDF')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop or click to select')).toBeInTheDocument();
  });

  it('shows drag state when file is dragged over', () => {
    render(<PDFUpload />);

    const dropzone = screen.getByTestId('pdf-upload-dropzone');

    fireEvent.dragOver(dropzone);

    expect(screen.getByText('Drop PDF here')).toBeInTheDocument();
  });

  it('rejects non-PDF files', async () => {
    const onError = vi.fn();
    mockIsPDFFile.mockReturnValue(false);

    render(<PDFUpload onError={onError} />);

    const dropzone = screen.getByTestId('pdf-upload-dropzone');
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Please upload a PDF file');
    });
  });

  it('processes valid PDF files', async () => {
    const onUploadStart = vi.fn();
    const onUploadComplete = vi.fn();

    mockIsPDFFile.mockReturnValue(true);
    mockExtractTextFromPDF.mockResolvedValue({
      text: 'Hello world this is a test document with some words.',
      pageCount: 1,
      metadata: {
        title: 'Test Document',
        author: 'Test Author',
        subject: null,
        creator: null,
        creationDate: null,
      },
    });

    render(<PDFUpload onUploadStart={onUploadStart} onUploadComplete={onUploadComplete} />);

    const dropzone = screen.getByTestId('pdf-upload-dropzone');
    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(onUploadStart).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalled();
    });

    // Check that the store was updated
    const state = useReaderStore.getState();
    expect(state.document).not.toBeNull();
    expect(state.document?.title).toBe('Test Document');
    expect(state.words.length).toBeGreaterThan(0);
  });

  it('handles extraction errors', async () => {
    const onError = vi.fn();

    mockIsPDFFile.mockReturnValue(true);
    mockExtractTextFromPDF.mockRejectedValue(new Error('PDF parsing failed'));

    render(<PDFUpload onError={onError} />);

    const dropzone = screen.getByTestId('pdf-upload-dropzone');
    const file = new File(['invalid'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('PDF parsing failed');
    });

    expect(screen.getByText('Upload failed')).toBeInTheDocument();
  });

  it('handles empty PDF content', async () => {
    const onError = vi.fn();

    mockIsPDFFile.mockReturnValue(true);
    mockExtractTextFromPDF.mockResolvedValue({
      text: '',
      pageCount: 1,
      metadata: {
        title: null,
        author: null,
        subject: null,
        creator: null,
        creationDate: null,
      },
    });

    render(<PDFUpload onError={onError} />);

    const dropzone = screen.getByTestId('pdf-upload-dropzone');
    const file = new File(['empty pdf'], 'empty.pdf', { type: 'application/pdf' });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        'No text content found in PDF. The file may be scanned or image-based.'
      );
    });
  });

  it('is accessible with keyboard', () => {
    render(<PDFUpload />);

    const dropzone = screen.getByTestId('pdf-upload-dropzone');

    expect(dropzone).toHaveAttribute('role', 'button');
    expect(dropzone).toHaveAttribute('tabIndex', '0');
    expect(dropzone).toHaveAttribute('aria-label', 'Upload PDF file');
  });

  it('shows processing state during upload', async () => {
    mockIsPDFFile.mockReturnValue(true);
    mockExtractTextFromPDF.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<PDFUpload />);

    const dropzone = screen.getByTestId('pdf-upload-dropzone');
    const file = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });
});
