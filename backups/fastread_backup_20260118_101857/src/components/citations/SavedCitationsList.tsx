'use client';

import { useCitationStore } from '@/stores/citation-store';
import type { SavedCitation } from '@/types';

export interface SavedCitationsListProps {
  className?: string;
  onCitationClick?: (citation: SavedCitation) => void;
}

export function SavedCitationsList({ className = '', onCitationClick }: SavedCitationsListProps) {
  const savedCitations = useCitationStore((state) => state.savedCitations);
  const removeSavedCitation = useCitationStore((state) => state.removeSavedCitation);
  const clearSavedCitations = useCitationStore((state) => state.clearSavedCitations);

  if (savedCitations.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <svg
          className="w-12 h-12 mx-auto text-text-tertiary mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
        <p className="text-text-secondary text-sm">No saved citations yet</p>
        <p className="text-text-tertiary text-xs mt-1">
          Use interactive mode to save citations while reading
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-primary">
          Saved Citations ({savedCitations.length})
        </h3>
        <button
          onClick={clearSavedCitations}
          className="text-xs text-text-secondary hover:text-red-500 transition-colors"
          aria-label="Clear all saved citations"
        >
          Clear all
        </button>
      </div>

      {/* List */}
      <div className="space-y-3" role="list" aria-label="Saved citations">
        {savedCitations.map((citation) => (
          <div
            key={citation.id}
            className="bg-bg-secondary rounded-lg p-3 border border-border-primary"
            role="listitem"
            data-testid={`saved-citation-${citation.id}`}
          >
            <div className="flex items-start justify-between gap-2">
              <button
                onClick={() => onCitationClick?.(citation)}
                className="text-left flex-1 hover:opacity-80 transition-opacity"
              >
                <p className="text-citation-highlight font-medium text-sm">{citation.rawText}</p>
                <p className="text-xs text-text-tertiary mt-1">
                  {citation.authors.join(', ')}
                  {citation.year > 0 && ` (${citation.year})`}
                </p>
              </button>
              <button
                onClick={() => removeSavedCitation(citation.id)}
                className="p-1 text-text-tertiary hover:text-red-500 transition-colors"
                aria-label={`Remove citation ${citation.rawText}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Context preview */}
            {citation.context && (
              <p className="text-xs text-text-secondary mt-2 line-clamp-2 italic">
                &ldquo;{citation.context}&rdquo;
              </p>
            )}

            {/* Timestamp */}
            <p className="text-xs text-text-tertiary mt-2">
              Saved {formatTimestamp(citation.savedAt)}
            </p>
          </div>
        ))}
      </div>

      {/* Export button */}
      <button
        onClick={() => exportCitations(savedCitations)}
        className="w-full mt-4 px-4 py-2 bg-bg-secondary text-text-primary rounded-lg
                 border border-border-primary hover:bg-bg-tertiary transition-colors
                 text-sm font-medium flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Export Citations
      </button>
    </div>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString();
}

function exportCitations(citations: SavedCitation[]): void {
  // Generate BibTeX-style export
  const lines = citations.map((c, i) => {
    const key = `cite${i + 1}`;
    const authors = c.authors.join(' and ');
    return `@article{${key},
  author = {${authors}},
  year = {${c.year}},
  note = {${c.rawText}}
}`;
  });

  const content = lines.join('\n\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'saved-citations.bib';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default SavedCitationsList;
