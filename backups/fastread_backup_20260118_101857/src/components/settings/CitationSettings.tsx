'use client';

import { useCitationStore } from '@/stores/citation-store';
import { CitationModeSelector } from '@/components/citations';

export interface CitationSettingsProps {
  className?: string;
}

export function CitationSettings({ className = '' }: CitationSettingsProps) {
  const interactiveTimeout = useCitationStore((state) => state.interactiveTimeout);
  const setInteractiveTimeout = useCitationStore((state) => state.setInteractiveTimeout);
  const highlightColor = useCitationStore((state) => state.highlightColor);
  const setHighlightColor = useCitationStore((state) => state.setHighlightColor);

  const CITATION_COLORS = [
    { value: '#fbbf24', label: 'Amber' },
    { value: '#22c55e', label: 'Green' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#a855f7', label: 'Purple' },
    { value: '#ec4899', label: 'Pink' },
  ];

  const TIMEOUT_OPTIONS = [
    { value: 0, label: 'No timeout' },
    { value: 2000, label: '2 seconds' },
    { value: 3000, label: '3 seconds' },
    { value: 5000, label: '5 seconds' },
    { value: 10000, label: '10 seconds' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-lg font-semibold text-text-primary">Citation Settings</h3>

      {/* Citation Mode */}
      <CitationModeSelector />

      {/* Interactive Timeout */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Auto-continue Timeout
        </label>
        <select
          value={interactiveTimeout}
          onChange={(e) => setInteractiveTimeout(parseInt(e.target.value, 10))}
          className="w-full bg-bg-secondary text-text-primary rounded-lg px-4 py-2.5
                   border border-border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          data-testid="timeout-select"
        >
          {TIMEOUT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-text-tertiary mt-2">
          In interactive mode, auto-skip citation after this duration
        </p>
      </div>

      {/* Citation Highlight Color */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Citation Highlight Color
        </label>
        <div className="flex gap-2 flex-wrap">
          {CITATION_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => setHighlightColor(color.value)}
              className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${
                highlightColor === color.value ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color.value }}
              aria-label={`Set citation color to ${color.label}`}
              data-testid={`citation-color-${color.label.toLowerCase()}`}
            />
          ))}
        </div>
        <p className="text-xs text-text-tertiary mt-2">
          Color used to highlight citations during reading
        </p>
      </div>
    </div>
  );
}

export default CitationSettings;
