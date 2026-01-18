'use client';

import { useState } from 'react';

export interface GestureGuideProps {
  className?: string;
}

const GESTURES = [
  { icon: '👆', gesture: 'Tap', description: 'Play / Pause' },
  { icon: '👆👆', gesture: 'Double Tap', description: 'Reset to start' },
  { icon: '👈', gesture: 'Swipe Left', description: 'Skip backward' },
  { icon: '👉', gesture: 'Swipe Right', description: 'Skip forward' },
  { icon: '👆', gesture: 'Swipe Up', description: 'Increase speed' },
  { icon: '👇', gesture: 'Swipe Down', description: 'Decrease speed' },
  { icon: '✋', gesture: 'Long Press', description: 'Pause reading' },
];

/**
 * Component that displays available touch gestures for mobile users
 */
export function GestureGuide({ className = '' }: GestureGuideProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Help button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 rounded-lg text-text-secondary hover:text-text-primary
                   hover:bg-bg-secondary transition-colors ${className}`}
        aria-label="Touch gestures guide"
        data-testid="gesture-guide-button"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
          />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gesture-guide-title"
          data-testid="gesture-guide-modal"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Modal content */}
          <div className="relative bg-bg-secondary rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-auto border border-border-primary">
            {/* Header */}
            <div className="sticky top-0 bg-bg-secondary px-6 py-4 border-b border-border-primary flex items-center justify-between">
              <h2 id="gesture-guide-title" className="text-lg font-semibold text-text-primary">
                Touch Gestures
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-bg-tertiary transition-colors"
                aria-label="Close"
                data-testid="gesture-guide-close-button"
              >
                <svg
                  className="w-5 h-5 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Gestures list */}
            <div className="px-6 py-4">
              <div className="space-y-4">
                {GESTURES.map((gesture, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4"
                    data-testid={`gesture-${index}`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-bg-tertiary rounded-lg text-2xl">
                      {gesture.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-text-primary">{gesture.gesture}</div>
                      <div className="text-sm text-text-secondary">{gesture.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer tip */}
            <div className="px-6 py-3 bg-bg-tertiary/50 border-t border-border-primary">
              <p className="text-xs text-text-tertiary text-center">
                Touch gestures work best on the reading area
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GestureGuide;
