'use client';

import { useCitationStore } from '@/stores/citation-store';

import type { CitationMode } from '@/types';

export interface CitationModeSelectorProps {
  className?: string;
  compact?: boolean;
}

interface ModeOption {
  value: CitationMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const MODES: ModeOption[] = [
  {
    value: 'skip',
    label: 'Skip',
    description: 'Skip over citations',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 5l7 7-7 7M5 5l7 7-7 7"
        />
      </svg>
    ),
  },
  {
    value: 'read',
    label: 'Read',
    description: 'Read citations normally',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ),
  },
  {
    value: 'interactive',
    label: 'Interactive',
    description: 'Pause and offer to save',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
        />
      </svg>
    ),
  },
];

export function CitationModeSelector({
  className = '',
  compact = false,
}: CitationModeSelectorProps) {
  const citationMode = useCitationStore((state) => state.citationMode);
  const setCitationMode = useCitationStore((state) => state.setCitationMode);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <label className="text-sm text-text-secondary" htmlFor="citation-mode-select">
          Citations:
        </label>
        <select
          id="citation-mode-select"
          value={citationMode}
          onChange={(e) => setCitationMode(e.target.value as CitationMode)}
          className="bg-bg-secondary text-text-primary text-sm rounded-lg px-3 py-1.5
                   border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          data-testid="citation-mode-select"
        >
          {MODES.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-text-primary mb-3">Citation Mode</label>
      <div className="space-y-2" role="radiogroup" aria-label="Citation mode selection">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setCitationMode(mode.value)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors
              ${
                citationMode === mode.value
                  ? 'border-primary bg-primary/10 text-text-primary'
                  : 'border-border-primary bg-bg-secondary text-text-secondary hover:border-border-secondary hover:bg-bg-tertiary'
              }`}
            role="radio"
            aria-checked={citationMode === mode.value}
            data-testid={`citation-mode-${mode.value}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center
              ${citationMode === mode.value ? 'bg-primary text-white' : 'bg-bg-tertiary text-text-secondary'}`}
            >
              {mode.icon}
            </div>
            <div className="text-left">
              <div className="font-medium">{mode.label}</div>
              <div className="text-xs text-text-tertiary">{mode.description}</div>
            </div>
            {citationMode === mode.value && (
              <svg
                className="w-5 h-5 text-primary ml-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CitationModeSelector;
