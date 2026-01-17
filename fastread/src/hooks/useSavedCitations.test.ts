import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

import { useSavedCitations } from './useSavedCitations';
import { useCitationStore } from '@/stores/citation-store';

// Mock supabase citations service
vi.mock('@/lib/supabase/citations', () => ({
  getSavedCitations: vi.fn(),
  getSavedCitationsForDocument: vi.fn(),
  saveCitation: vi.fn(),
  deleteCitation: vi.fn(),
  deleteAllCitations: vi.fn(),
  citationExists: vi.fn(),
  exportAsBibTeX: vi.fn((citations) =>
    citations.map((c: { rawText: string }) => `@article{${c.rawText}}`).join('\n')
  ),
  exportAsText: vi.fn((citations) =>
    citations.map((c: { rawText: string }) => c.rawText).join('\n')
  ),
}));

import {
  getSavedCitations,
  saveCitation as saveCitationToDb,
  deleteCitation as deleteCitationFromDb,
  deleteAllCitations,
  citationExists,
} from '@/lib/supabase/citations';

const mockGetSavedCitations = vi.mocked(getSavedCitations);
const mockSaveCitationToDb = vi.mocked(saveCitationToDb);
const mockDeleteCitationFromDb = vi.mocked(deleteCitationFromDb);
const mockDeleteAllCitations = vi.mocked(deleteAllCitations);
const mockCitationExists = vi.mocked(citationExists);

describe('useSavedCitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCitationStore.getState().reset();
  });

  it('loads citations on mount when userId is provided', async () => {
    const mockCitations = [
      {
        id: 'citation-1',
        documentId: 'doc-1',
        rawText: '(Smith, 2020)',
        authors: ['Smith'],
        year: 2020,
        context: 'Context',
        savedAt: new Date(),
        position: 0,
      },
    ];

    mockGetSavedCitations.mockResolvedValue(mockCitations);

    const { result } = renderHook(() =>
      useSavedCitations({ userId: 'user-1', autoSync: true })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetSavedCitations).toHaveBeenCalledWith('user-1');
    expect(result.current.citations).toHaveLength(1);
  });

  it('does not load citations when userId is null', () => {
    renderHook(() => useSavedCitations({ userId: null }));

    expect(mockGetSavedCitations).not.toHaveBeenCalled();
  });

  it('saves citation to store when no userId', async () => {
    const { result } = renderHook(() =>
      useSavedCitations({ userId: null, autoSync: false })
    );

    const newCitation = {
      documentId: 'doc-1',
      rawText: '(Test, 2024)',
      authors: ['Test'],
      year: 2024,
      context: 'Test context',
      position: 50,
    };

    await act(async () => {
      await result.current.saveCitation(newCitation);
    });

    expect(mockSaveCitationToDb).not.toHaveBeenCalled();
    expect(result.current.citations).toHaveLength(1);
    expect(result.current.citations[0].rawText).toBe('(Test, 2024)');
  });

  it('saves citation to Supabase when userId is provided', async () => {
    mockCitationExists.mockResolvedValue(false);
    mockSaveCitationToDb.mockResolvedValue({
      id: 'new-citation',
      documentId: 'doc-1',
      rawText: '(Test, 2024)',
      authors: ['Test'],
      year: 2024,
      context: 'Test context',
      savedAt: new Date(),
      position: 50,
    });

    const { result } = renderHook(() =>
      useSavedCitations({ userId: 'user-1', autoSync: false })
    );

    await act(async () => {
      await result.current.saveCitation({
        documentId: 'doc-1',
        rawText: '(Test, 2024)',
        authors: ['Test'],
        year: 2024,
        context: 'Test context',
        position: 50,
      });
    });

    expect(mockSaveCitationToDb).toHaveBeenCalled();
    expect(result.current.citations).toHaveLength(1);
  });

  it('prevents duplicate citations', async () => {
    mockCitationExists.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useSavedCitations({ userId: 'user-1', autoSync: false })
    );

    await act(async () => {
      const saved = await result.current.saveCitation({
        documentId: 'doc-1',
        rawText: '(Duplicate, 2024)',
        authors: ['Duplicate'],
        year: 2024,
        context: 'Duplicate context',
        position: 50,
      });
      expect(saved).toBeNull();
    });

    expect(result.current.error).toBe('Citation already saved');
  });

  it('removes citation from store and Supabase', async () => {
    mockDeleteCitationFromDb.mockResolvedValue(undefined);

    // First add a citation to the store
    useCitationStore.getState().saveCitation({
      id: 'citation-to-remove',
      documentId: 'doc-1',
      rawText: '(ToRemove, 2024)',
      authors: ['ToRemove'],
      year: 2024,
      context: 'Context',
      savedAt: new Date(),
      position: 0,
    });

    const { result } = renderHook(() =>
      useSavedCitations({ userId: 'user-1', autoSync: false })
    );

    expect(result.current.citations).toHaveLength(1);

    await act(async () => {
      await result.current.removeCitation('citation-to-remove');
    });

    expect(mockDeleteCitationFromDb).toHaveBeenCalledWith('citation-to-remove', 'user-1');
    expect(result.current.citations).toHaveLength(0);
  });

  it('clears all citations', async () => {
    mockDeleteAllCitations.mockResolvedValue(undefined);

    // Add some citations
    useCitationStore.getState().saveCitation({
      id: 'c1',
      documentId: 'doc-1',
      rawText: '(A, 2024)',
      authors: ['A'],
      year: 2024,
      context: '',
      savedAt: new Date(),
      position: 0,
    });
    useCitationStore.getState().saveCitation({
      id: 'c2',
      documentId: 'doc-1',
      rawText: '(B, 2024)',
      authors: ['B'],
      year: 2024,
      context: '',
      savedAt: new Date(),
      position: 0,
    });

    const { result } = renderHook(() =>
      useSavedCitations({ userId: 'user-1', autoSync: false })
    );

    expect(result.current.citations).toHaveLength(2);

    await act(async () => {
      await result.current.clearAll();
    });

    expect(mockDeleteAllCitations).toHaveBeenCalledWith('user-1');
    expect(result.current.citations).toHaveLength(0);
  });

  it('exports citations as BibTeX', () => {
    useCitationStore.getState().saveCitation({
      id: 'c1',
      documentId: 'doc-1',
      rawText: '(Export, 2024)',
      authors: ['Export'],
      year: 2024,
      context: '',
      savedAt: new Date(),
      position: 0,
    });

    const { result } = renderHook(() =>
      useSavedCitations({ userId: null, autoSync: false })
    );

    const bibtex = result.current.exportBibTeX();
    expect(bibtex).toContain('(Export, 2024)');
  });
});
