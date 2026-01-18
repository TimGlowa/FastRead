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
  small: 'text-[36px] sm:text-[42px] md:text-[48px] lg:text-[56px]',
  medium: 'text-[48px] sm:text-[56px] md:text-[64px] lg:text-[72px]',
  large: 'text-[56px] sm:text-[64px] md:text-[80px] lg:text-[96px]',
  xlarge: 'text-[64px] sm:text-[80px] md:text-[96px] lg:text-[120px]',
} as const;

export interface RSVPDisplayProps {
  className?: string;
  /** Show the upcoming word preview in bottom right */
  showPreview?: boolean;
  /** Show WPM display */
  showWPM?: boolean;
}

export function RSVPDisplay({
  className = '',
  showPreview = true,
  showWPM = true,
}: RSVPDisplayProps) {
  const currentWordIndex = useReaderStore((state) => state.currentWordIndex);
  const words = useReaderStore((state) => state.words);
  const settings = useReaderStore((state) => state.settings);
  const speed = useReaderStore((state) => state.speed);

  const currentWord = words[currentWordIndex] || '';
  const nextWord = words[currentWordIndex + 1] || '';
  const orpIndex = calculateORP(currentWord);

  const beforeORP = currentWord.slice(0, orpIndex);
  const orpChar = currentWord[orpIndex] || '';
  const afterORP = currentWord.slice(orpIndex + 1);

  const fontSizeClass = FONT_SIZES[settings.fontSize];

  if (words.length === 0) {
    return (
      <div
        className={`relative flex items-center justify-center min-h-[400px] bg-black ${className}`}
        role="status"
        aria-label="No document loaded"
      >
        <p className="text-gray-500 text-lg font-reading">Upload a document to start reading</p>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col bg-black ${className}`}
      role="region"
      aria-label="Speed reader display"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Top border/frame line */}
      <div className="h-px bg-gray-800" aria-hidden="true" />

      {/* Main display area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] select-none relative">
        {/* Top guide line */}
        <div className="w-px h-16 bg-gray-800 mb-4" aria-hidden="true" />

        {/* Word display */}
        <div
          className={`font-reading ${fontSizeClass} tracking-wider leading-none`}
          data-testid="rsvp-word"
        >
          <span className="text-white">{beforeORP}</span>
          <span className="text-red-500" data-testid="rsvp-orp-char">
            {orpChar}
          </span>
          <span className="text-white">{afterORP}</span>
        </div>

        {/* Bottom guide line */}
        <div className="w-px h-16 bg-gray-800 mt-4" aria-hidden="true" />
      </div>

      {/* Bottom border/frame line */}
      <div className="h-px bg-gray-800" aria-hidden="true" />

      {/* Bottom info area */}
      <div className="h-24 flex items-center justify-end px-8 relative">
        {/* WPM display - positioned on the right */}
        {showWPM && (
          <div
            className="text-gray-600 font-reading text-2xl italic"
            aria-label={`Current speed: ${speed} words per minute`}
          >
            {speed} wpm
          </div>
        )}

        {/* Upcoming word preview - small box in bottom right corner */}
        {showPreview && nextWord && (
          <div
            className="absolute bottom-2 right-2 bg-gray-900 border border-gray-700 rounded px-3 py-1 text-xs text-gray-400 font-reading"
            aria-label={`Next word: ${nextWord}`}
          >
            {nextWord}
          </div>
        )}
      </div>
    </div>
  );
}

export default RSVPDisplay;
