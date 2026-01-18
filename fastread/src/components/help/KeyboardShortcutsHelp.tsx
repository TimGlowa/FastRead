'use client';

import { useState } from 'react';

export interface KeyboardShortcutsHelpProps {
  className?: string;
}

const SHORTCUTS = [
  { key: 'Space', description: 'Play / Pause' },
  { key: '←', description: 'Previous word (paused) / Skip back (playing)' },
  { key: '→', description: 'Next word (paused) / Skip forward (playing)' },
  { key: '↑', description: 'Increase speed' },
  { key: '↓', description: 'Decrease speed' },
  { key: 'Home', description: 'Go to start' },
  { key: 'End', description: 'Go to end' },
  { key: 'Esc', description: 'Pause' },
  { key: 'R', description: 'Reset to start' },
  { key: '[', description: 'Decrease speed' },
  { key: ']', description: 'Increase speed' },
];

/**
 * Component that displays available keyboard shortcuts
 * Can be shown as a modal or inline help section
 */
export function KeyboardShortcutsHelp({ className = '' }: KeyboardShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Help button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 rounded-lg text-text-secondary hover:text-text-primary
                   hover:bg-bg-secondary transition-colors ${className}`}
        aria-label="Keyboard shortcuts"
        data-testid="shortcuts-help-button"
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
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
          data-testid="shortcuts-modal"
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
              <h2 id="shortcuts-title" className="text-lg font-semibold text-text-primary">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-bg-tertiary transition-colors"
                aria-label="Close"
                data-testid="shortcuts-close-button"
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

            {/* Shortcuts list */}
            <div className="px-6 py-4">
              <div className="space-y-3">
                {SHORTCUTS.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-4"
                    data-testid={`shortcut-${index}`}
                  >
                    <span className="text-sm text-text-secondary">{shortcut.description}</span>
                    <kbd
                      className="px-2 py-1 bg-bg-tertiary rounded text-xs font-mono text-text-primary
                                 border border-border-primary min-w-[2.5rem] text-center"
                    >
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer tip */}
            <div className="px-6 py-3 bg-bg-tertiary/50 border-t border-border-primary">
              <p className="text-xs text-text-tertiary text-center">
                Press <kbd className="px-1 bg-bg-tertiary rounded text-text-secondary">?</kbd> to
                toggle this help
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default KeyboardShortcutsHelp;
