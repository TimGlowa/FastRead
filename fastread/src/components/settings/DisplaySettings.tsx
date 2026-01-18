'use client';

import { useReaderStore } from '@/stores';

import type { ReaderSettings } from '@/types';

export interface DisplaySettingsProps {
  className?: string;
}

const FONT_SIZES: { value: ReaderSettings['fontSize']; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra Large' },
];

const THEMES: { value: ReaderSettings['theme']; label: string; colors: string }[] = [
  { value: 'dark', label: 'Dark', colors: 'bg-[#0A0A0A] border-gray-700' },
  { value: 'light', label: 'Light', colors: 'bg-white border-gray-300' },
  { value: 'sepia', label: 'Sepia', colors: 'bg-[#F4ECD8] border-amber-300' },
];

const ORP_COLORS = [
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#a855f7', label: 'Purple' },
];

export function DisplaySettings({ className = '' }: DisplaySettingsProps) {
  const settings = useReaderStore((state) => state.settings);
  const setSettings = useReaderStore((state) => state.setSettings);

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-lg font-semibold text-text-primary">Display Settings</h3>

      {/* Theme */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Theme</label>
        <div className="flex gap-3">
          {THEMES.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setSettings({ theme: theme.value })}
              className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                settings.theme === theme.value
                  ? 'border-primary'
                  : 'border-border-primary hover:border-border-secondary'
              }`}
              data-testid={`theme-${theme.value}`}
            >
              <div className={`w-full h-8 rounded ${theme.colors} border`} />
              <span className="text-sm text-text-primary">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">Font Size</label>
        <div className="grid grid-cols-4 gap-2">
          {FONT_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => setSettings({ fontSize: size.value })}
              className={`py-2 px-3 rounded-lg border transition-colors text-sm ${
                settings.fontSize === size.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border-primary bg-bg-secondary text-text-secondary hover:border-border-secondary'
              }`}
              data-testid={`font-size-${size.value}`}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* ORP Highlight Color */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          Focus Point Color
        </label>
        <div className="flex gap-2 flex-wrap">
          {ORP_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => setSettings({ orpHighlightColor: color.value })}
              className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${
                settings.orpHighlightColor === color.value
                  ? 'border-white scale-110'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: color.value }}
              aria-label={`Set focus point color to ${color.label}`}
              data-testid={`orp-color-${color.label.toLowerCase()}`}
            />
          ))}
        </div>
        <p className="text-xs text-text-tertiary mt-2">
          The color used to highlight the optimal recognition point
        </p>
      </div>

      {/* Context Window */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-text-primary">Show Context Window</label>
          <p className="text-xs text-text-tertiary">
            Display surrounding words for better comprehension
          </p>
        </div>
        <button
          onClick={() => setSettings({ showContextWindow: !settings.showContextWindow })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            settings.showContextWindow ? 'bg-primary' : 'bg-bg-tertiary'
          }`}
          role="switch"
          aria-checked={settings.showContextWindow}
          data-testid="context-window-toggle"
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
              settings.showContextWindow ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default DisplaySettings;
