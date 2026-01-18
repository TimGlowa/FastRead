'use client';

import { useEffect, useCallback, useRef } from 'react';

import { useCitationStore } from '@/stores/citation-store';
import { useReaderStore } from '@/stores';
import type { DetectedCitation, SavedCitation } from '@/types';

export interface CitationOverlayProps {
  className?: string;
  onSave?: (citation: SavedCitation) => void;
  onSkip?: () => void;
}

export function CitationOverlay({ className = '', onSave, onSkip }: CitationOverlayProps) {
  const activeCitation = useCitationStore((state) => state.activeCitation);
  const isOverlayVisible = useCitationStore((state) => state.isOverlayVisible);
  const interactiveTimeout = useCitationStore((state) => state.interactiveTimeout);
  const hideOverlay = useCitationStore((state) => state.hideOverlay);
  const saveCitation = useCitationStore((state) => state.saveCitation);

  const document = useReaderStore((state) => state.document);
  const currentWordIndex = useReaderStore((state) => state.currentWordIndex);
  const play = useReaderStore((state) => state.play);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Auto-continue after timeout
  useEffect(() => {
    if (!isOverlayVisible || interactiveTimeout <= 0) return;

    // Start progress animation
    if (progressRef.current) {
      progressRef.current.style.transition = `width ${interactiveTimeout}ms linear`;
      progressRef.current.style.width = '0%';
    }

    timeoutRef.current = setTimeout(() => {
      handleSkip();
    }, interactiveTimeout);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOverlayVisible, interactiveTimeout]);

  const handleSave = useCallback(() => {
    if (!activeCitation || !document) return;

    // Cancel auto-continue timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const savedCitation: SavedCitation = {
      id: `saved-${Date.now()}`,
      documentId: document.id,
      rawText: activeCitation.rawText,
      authors: activeCitation.parsed.authors,
      year: activeCitation.parsed.year,
      pageNumber: activeCitation.parsed.pages,
      context: getContextAroundCitation(activeCitation),
      savedAt: new Date(),
      position: currentWordIndex,
    };

    saveCitation(savedCitation);
    onSave?.(savedCitation);
    hideOverlay();
    play();
  }, [activeCitation, document, currentWordIndex, saveCitation, hideOverlay, play, onSave]);

  const handleSkip = useCallback(() => {
    // Cancel auto-continue timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    hideOverlay();
    onSkip?.();
    play();
  }, [hideOverlay, play, onSkip]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOverlayVisible) return;

      if (e.key === 's' || e.key === 'S' || e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        handleSkip();
      }
    },
    [isOverlayVisible, handleSave, handleSkip]
  );

  // Keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Get surrounding context for the citation
  function getContextAroundCitation(citation: DetectedCitation): string {
    if (!document) return citation.rawText;

    const text = document.rawText;
    const start = Math.max(0, citation.startIndex - 50);
    const end = Math.min(text.length, citation.endIndex + 50);

    let context = text.slice(start, end);
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';

    return context;
  }

  if (!isOverlayVisible || !activeCitation) {
    return null;
  }

  const { authors, year, pages } = activeCitation.parsed;
  const authorDisplay = authors.join(', ');

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm ${className}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="citation-title"
      data-testid="citation-overlay"
    >
      <div className="bg-bg-primary border border-border-primary rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Progress bar */}
        {interactiveTimeout > 0 && (
          <div className="h-1 bg-border-primary">
            <div
              ref={progressRef}
              className="h-full bg-primary w-full"
              style={{ transition: `width ${interactiveTimeout}ms linear` }}
            />
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-citation-highlight/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-citation-highlight"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            </div>
            <div>
              <h2 id="citation-title" className="text-lg font-semibold text-text-primary">
                Citation Found
              </h2>
              <p className="text-sm text-text-secondary">Save for later reference?</p>
            </div>
          </div>

          {/* Citation details */}
          <div className="bg-bg-secondary rounded-lg p-4 mb-6">
            <p className="text-citation-highlight font-medium mb-2" data-testid="citation-text">
              {activeCitation.rawText}
            </p>
            <div className="space-y-1 text-sm text-text-secondary">
              {authorDisplay && (
                <p>
                  <span className="text-text-tertiary">Authors:</span> {authorDisplay}
                </p>
              )}
              {year > 0 && (
                <p>
                  <span className="text-text-tertiary">Year:</span> {year}
                </p>
              )}
              {pages && (
                <p>
                  <span className="text-text-tertiary">Pages:</span> {pages}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-medium
                       hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                       focus:ring-offset-bg-primary transition-colors"
              data-testid="save-citation-btn"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                Save
              </span>
              <span className="text-xs opacity-75 block mt-1">Press S or Enter</span>
            </button>
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-3 bg-bg-secondary text-text-primary rounded-lg font-medium
                       hover:bg-bg-tertiary focus:outline-none focus:ring-2 focus:ring-border-primary focus:ring-offset-2
                       focus:ring-offset-bg-primary transition-colors"
              data-testid="skip-citation-btn"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
                Skip
              </span>
              <span className="text-xs opacity-75 block mt-1">Press Space or Esc</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CitationOverlay;
