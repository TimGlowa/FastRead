'use client';

import { useReaderStore } from '@/stores';

/**
 * Calculate the Optimal Recognition Point (ORP) index for a word.
 * ORP is the letter where eyes naturally focus when reading.
 *
 * Rules:
 * - Words 1-3 chars: highlight 1st letter (index 0)
 * - Words 4-6 chars: highlight 2nd letter (index 1)
 * - Words 7-9 chars: highlight 3rd letter (index 2)
 * - Words 10+ chars: highlight 4th letter (index 3)
 */
export function calculateORP(word: string): number {
  const len = word.length;
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  if (len <= 9) return 2;
  return 3;
}

export interface RSVPDisplayProps {
  className?: string;
  /** Show the upcoming word preview (only when paused) */
  showPreview?: boolean;
  /** Show WPM display (only when paused) */
  showWPM?: boolean;
}

/**
 * RSVP Display with Vertically Framed Reading Stage
 *
 * Design principles:
 * - Stage defined by TOP and BOTTOM horizontal boundaries only (no side walls)
 * - Fixed anchor point at constant X coordinate (visual center)
 * - Center ticks near top and bottom aligned with anchor
 * - Word rendered as: left (right-aligned) + anchor char (fixed) + right (left-aligned)
 * - Anchor character occupies fixed width to prevent jitter
 * - Stage never moves, resizes, or animates
 */
export function RSVPDisplay({
  className = '',
  showPreview = true,
  showWPM = true,
}: RSVPDisplayProps) {
  const currentWordIndex = useReaderStore((state) => state.currentWordIndex);
  const words = useReaderStore((state) => state.words);
  const speed = useReaderStore((state) => state.speed);
  const isPlaying = useReaderStore((state) => state.isPlaying);

  const currentWord = words[currentWordIndex] || '';
  const nextWord = words[currentWordIndex + 1] || '';
  const orpIndex = calculateORP(currentWord);

  const beforeORP = currentWord.slice(0, orpIndex);
  const orpChar = currentWord[orpIndex] || '';
  const afterORP = currentWord.slice(orpIndex + 1);

  // Hide controls during reading
  const showControls = !isPlaying;

  // Fixed dimensions for the anchor character (prevents jitter)
  const anchorWidth = '0.65em';

  if (words.length === 0) {
    return (
      <div
        className={`relative flex items-center justify-center min-h-[400px] bg-neutral-950 ${className}`}
        role="status"
        aria-label="No document loaded"
      >
        <p className="text-neutral-500 text-lg font-sans font-normal">
          Upload a document to start reading
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col bg-neutral-950 ${className}`}
      role="region"
      aria-label="Speed reader display"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Vertically Framed Reading Stage */}
      <div
        className="flex-1 flex items-center justify-center min-h-[400px] select-none"
        data-testid="rsvp-stage"
      >
        {/* Stage container with top/bottom boundaries only */}
        <div className="relative flex flex-col items-center">
          {/* Top boundary line */}
          <div
            className="w-full flex justify-center mb-8"
            aria-hidden="true"
          >
            <div className="w-[600px] h-px bg-neutral-800" />
          </div>

          {/* Top center tick - aligned with anchor */}
          <div
            className="absolute top-0 left-1/2 h-4 w-px bg-neutral-700"
            style={{ transform: 'translateX(-50%)' }}
            data-testid="rsvp-tick-top"
            aria-hidden="true"
          />

          {/* Word display area */}
          <div
            className="relative flex items-center justify-center"
            style={{ height: '1.5em' }}
            data-testid="rsvp-word"
          >
            {/*
              Anchored Word Rendering:
              - Left part: right-aligned, flows toward anchor
              - Anchor (ORP): fixed position, fixed width
              - Right part: left-aligned, flows away from anchor
            */}

            {/* Left part - right-aligned to anchor point */}
            <span
              className="text-white font-sans font-normal text-5xl tracking-normal text-right"
              style={{
                width: '280px',
                display: 'inline-block',
              }}
              data-testid="rsvp-left"
            >
              {beforeORP}
            </span>

            {/* ORP character - THE FIXED ANCHOR POINT */}
            {/* This character sits in the same pixel position for every word */}
            <span
              className="text-red-500 font-sans font-normal text-5xl tracking-normal"
              data-testid="rsvp-orp-char"
              style={{
                display: 'inline-block',
                textAlign: 'center',
                width: anchorWidth,
                minWidth: anchorWidth,
                maxWidth: anchorWidth,
              }}
            >
              {orpChar}
            </span>

            {/* Right part - left-aligned from anchor point */}
            <span
              className="text-white font-sans font-normal text-5xl tracking-normal text-left"
              style={{
                width: '280px',
                display: 'inline-block',
              }}
              data-testid="rsvp-right"
            >
              {afterORP}
            </span>
          </div>

          {/* Bottom center tick - aligned with anchor */}
          <div
            className="absolute bottom-0 left-1/2 h-4 w-px bg-neutral-700"
            style={{ transform: 'translateX(-50%)' }}
            data-testid="rsvp-tick-bottom"
            aria-hidden="true"
          />

          {/* Bottom boundary line */}
          <div
            className="w-full flex justify-center mt-8"
            aria-hidden="true"
          >
            <div className="w-[600px] h-px bg-neutral-800" />
          </div>
        </div>
      </div>

      {/* Controls area - only visible when paused */}
      {showControls && (
        <div
          className="absolute bottom-4 right-4 flex items-center gap-4 transition-opacity duration-150"
          style={{ opacity: showControls ? 1 : 0 }}
        >
          {/* WPM display */}
          {showWPM && (
            <div
              className="text-neutral-600 font-sans font-normal text-sm"
              aria-label={`Current speed: ${speed} words per minute`}
            >
              {speed} wpm
            </div>
          )}

          {/* Upcoming word preview */}
          {showPreview && nextWord && (
            <div
              className="text-neutral-600 font-sans font-normal text-xs px-2 py-1 border border-neutral-800 rounded"
              aria-label={`Next word: ${nextWord}`}
            >
              {nextWord}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RSVPDisplay;
