'use client';

import { useMemo } from 'react';

import { useReaderStore } from '@/stores';

export interface ContextWindowProps {
  /** Number of words to show before current word */
  wordsBefore?: number;
  /** Number of words to show after current word */
  wordsAfter?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ContextWindow displays surrounding words around the current RSVP word
 * to help readers maintain context while speed reading.
 */
export function ContextWindow({
  wordsBefore = 5,
  wordsAfter = 5,
  className = '',
}: ContextWindowProps) {
  const currentWordIndex = useReaderStore((state) => state.currentWordIndex);
  const words = useReaderStore((state) => state.words);
  const settings = useReaderStore((state) => state.settings);

  const contextWords = useMemo(() => {
    if (words.length === 0) return { before: [], current: '', after: [] };

    const startIndex = Math.max(0, currentWordIndex - wordsBefore);
    const endIndex = Math.min(words.length, currentWordIndex + wordsAfter + 1);

    const before = words.slice(startIndex, currentWordIndex);
    const current = words[currentWordIndex] || '';
    const after = words.slice(currentWordIndex + 1, endIndex);

    return { before, current, after };
  }, [words, currentWordIndex, wordsBefore, wordsAfter]);

  // Don't render if context window is disabled or no words
  if (!settings.showContextWindow || words.length === 0) {
    return null;
  }

  return (
    <div
      className={`bg-bg-secondary/50 rounded-lg px-4 py-3 ${className}`}
      role="region"
      aria-label="Reading context"
      data-testid="context-window"
    >
      <div className="flex flex-wrap justify-center items-baseline gap-x-2 gap-y-1 text-sm leading-relaxed">
        {/* Words before current */}
        {contextWords.before.map((word, index) => {
          const actualIndex = currentWordIndex - contextWords.before.length + index;
          // Fade effect: words further from current are more faded
          const distance = contextWords.before.length - index;
          const opacity = Math.max(0.3, 1 - distance * 0.15);

          return (
            <span
              key={`before-${actualIndex}`}
              className="text-text-secondary transition-opacity duration-150"
              style={{ opacity }}
              data-testid={`context-word-before-${index}`}
            >
              {word}
            </span>
          );
        })}

        {/* Current word - highlighted */}
        <span
          className="text-text-primary font-semibold px-1.5 py-0.5 bg-accent-primary/20 rounded"
          data-testid="context-word-current"
        >
          {contextWords.current}
        </span>

        {/* Words after current */}
        {contextWords.after.map((word, index) => {
          const actualIndex = currentWordIndex + 1 + index;
          // Fade effect: words further from current are more faded
          const distance = index + 1;
          const opacity = Math.max(0.3, 1 - distance * 0.15);

          return (
            <span
              key={`after-${actualIndex}`}
              className="text-text-secondary transition-opacity duration-150"
              style={{ opacity }}
              data-testid={`context-word-after-${index}`}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* Visual indicator for position in context */}
      <div className="mt-2 flex justify-center" aria-hidden="true">
        <div className="flex gap-0.5">
          {Array.from({ length: wordsBefore + 1 + wordsAfter }).map((_, i) => {
            const isCurrent = i === wordsBefore;
            const isVisible =
              (i < wordsBefore && i >= wordsBefore - contextWords.before.length) ||
              isCurrent ||
              (i > wordsBefore && i <= wordsBefore + contextWords.after.length);

            return (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  isCurrent
                    ? 'bg-accent-primary'
                    : isVisible
                      ? 'bg-text-tertiary'
                      : 'bg-transparent'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ContextWindow;
