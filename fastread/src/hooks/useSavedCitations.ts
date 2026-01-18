'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  getSavedCitations,
  getSavedCitationsForDocument,
  saveCitation as saveCitationToDb,
  deleteCitation as deleteCitationFromDb,
  deleteAllCitations,
  citationExists,
  exportAsBibTeX,
  exportAsText,
} from '@/lib/supabase/citations';
import { useCitationStore } from '@/stores/citation-store';

import type { SavedCitation } from '@/types';

export interface UseSavedCitationsOptions {
  userId: string | null;
  documentId?: string;
  autoSync?: boolean;
}

export interface UseSavedCitationsReturn {
  // State
  citations: SavedCitation[];
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;

  // Actions
  saveCitation: (citation: Omit<SavedCitation, 'id' | 'savedAt'>) => Promise<SavedCitation | null>;
  removeCitation: (citationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;

  // Export
  exportBibTeX: () => string;
  exportText: () => string;
  downloadBibTeX: (filename?: string) => void;
  downloadText: (filename?: string) => void;
}

export function useSavedCitations({
  userId,
  documentId,
  autoSync = true,
}: UseSavedCitationsOptions): UseSavedCitationsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const savedCitations = useCitationStore((state) => state.savedCitations);
  const storeSaveCitation = useCitationStore((state) => state.saveCitation);
  const storeRemoveCitation = useCitationStore((state) => state.removeSavedCitation);
  const storeClearCitations = useCitationStore((state) => state.clearSavedCitations);

  // Load citations from Supabase on mount
  const loadCitations = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const citations = documentId
        ? await getSavedCitationsForDocument(userId, documentId)
        : await getSavedCitations(userId);

      // Sync with store
      storeClearCitations();
      citations.forEach((c) => storeSaveCitation(c));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load citations';
      setError(message);
      console.error('Failed to load citations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, documentId, storeClearCitations, storeSaveCitation]);

  // Auto-load on mount if autoSync is enabled
  useEffect(() => {
    if (autoSync && userId) {
      loadCitations();
    }
  }, [autoSync, userId, loadCitations]);

  // Save citation to both store and Supabase
  const saveCitation = useCallback(
    async (citation: Omit<SavedCitation, 'id' | 'savedAt'>): Promise<SavedCitation | null> => {
      if (!userId) {
        // No user - only save to store
        const localCitation: SavedCitation = {
          ...citation,
          id: `local-${Date.now()}`,
          savedAt: new Date(),
        };
        storeSaveCitation(localCitation);
        return localCitation;
      }

      setIsSyncing(true);
      setError(null);

      try {
        // Check for duplicates
        const exists = await citationExists(userId, citation.documentId, citation.rawText);
        if (exists) {
          setError('Citation already saved');
          return null;
        }

        // Save to Supabase
        const saved = await saveCitationToDb(citation, userId);

        // Update store
        storeSaveCitation(saved);

        return saved;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save citation';
        setError(message);
        console.error('Failed to save citation:', err);
        return null;
      } finally {
        setIsSyncing(false);
      }
    },
    [userId, storeSaveCitation]
  );

  // Remove citation from both store and Supabase
  const removeCitation = useCallback(
    async (citationId: string): Promise<void> => {
      // Always remove from store first
      storeRemoveCitation(citationId);

      if (!userId || citationId.startsWith('local-')) {
        // No user or local citation - already removed from store
        return;
      }

      setIsSyncing(true);
      setError(null);

      try {
        await deleteCitationFromDb(citationId, userId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete citation';
        setError(message);
        console.error('Failed to delete citation:', err);
        // Note: citation is already removed from store
      } finally {
        setIsSyncing(false);
      }
    },
    [userId, storeRemoveCitation]
  );

  // Clear all citations
  const clearAll = useCallback(async (): Promise<void> => {
    storeClearCitations();

    if (!userId) return;

    setIsSyncing(true);
    setError(null);

    try {
      await deleteAllCitations(userId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear citations';
      setError(message);
      console.error('Failed to clear citations:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [userId, storeClearCitations]);

  // Export functions
  const exportBibTeX = useCallback(() => {
    return exportAsBibTeX(savedCitations);
  }, [savedCitations]);

  const exportText = useCallback(() => {
    return exportAsText(savedCitations);
  }, [savedCitations]);

  const downloadBibTeX = useCallback(
    (filename = 'citations.bib') => {
      const content = exportBibTeX();
      downloadFile(content, filename, 'text/plain');
    },
    [exportBibTeX]
  );

  const downloadText = useCallback(
    (filename = 'citations.txt') => {
      const content = exportText();
      downloadFile(content, filename, 'text/plain');
    },
    [exportText]
  );

  return {
    citations: savedCitations,
    isLoading,
    error,
    isSyncing,
    saveCitation,
    removeCitation,
    clearAll,
    refresh: loadCitations,
    exportBibTeX,
    exportText,
    downloadBibTeX,
    downloadText,
  };
}

// Helper function to download file
function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default useSavedCitations;
