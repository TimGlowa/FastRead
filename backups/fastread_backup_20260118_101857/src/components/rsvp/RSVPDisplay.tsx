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

/**
 * Font size mappings for different settings
 */
const FONT_SIZES = {
  small: 'text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px]',
  medium: 'text-[32px] sm:text-[36px] md:text-[42px] lg:text-[48px]',
  large: 'text-[40px] sm:text-[48px] md:text-[56px] lg:text-[64px]',
  xlarge: 'text-[48px] sm:text-[56px] md:text-[68px] lg:text-[80px]',
} as const;

export interface RSVPDisplayProps {
  className?: string;
}

export function RSVPDisplay({ className = '' }: RSVPDisplayProps) {
  const currentWordIndex = useReaderStore((state) => state.currentWordIndex);
  const words = useReaderStore((state) => state.words);
  const settings = useReaderStore((state) => state.settings);

  const currentWord = words[currentWordIndex] || '';
  const orpIndex = calculateORP(currentWord);

  const beforeORP = currentWord.slice(0, orpIndex);
  const orpChar = currentWord[orpIndex] || '';
  const afterORP = currentWord.slice(orpIndex + 1);

  const fontSizeClass = FONT_SIZES[settings.fontSize];

  if (words.length === 0) {
    return (
      <div
        className={`flex items-center justify-center min-h-[200px] ${className}`}
        role="status"
        aria-label="No document loaded"
      >
        <p className="text-text-secondary text-lg">Upload a document to start reading</p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[200px] select-none ${className}`}
      role="region"
      aria-label="Speed reader display"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* ORP guide line */}
      <div className="w-px h-4 bg-orp-highlight mb-2" aria-hidden="true" />

      {/* Word display */}
      <div className={`font-reading ${fontSizeClass} tracking-wide`} data-testid="rsvp-word">
        <span className="text-text-primary">{beforeORP}</span>
        <span className="text-orp-highlight font-bold" data-testid="rsvp-orp-char">
          {orpChar}
        </span>
        <span className="text-text-primary">{afterORP}</span>
      </div>

      {/* ORP guide line */}
      <div className="w-px h-4 bg-orp-highlight mt-2" aria-hidden="true" />

      {/* Progress indicator */}
      <div
        className="mt-6 text-sm text-text-secondary"
        aria-label={`Word ${currentWordIndex + 1} of ${words.length}`}
      >
        {currentWordIndex + 1} / {words.length}
      </div>
    </div>
  );
}

export default RSVPDisplay;
