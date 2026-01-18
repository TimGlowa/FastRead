'use client';

import { useReaderStore } from '@/stores';

export interface SpeedSettingsProps {
  className?: string;
}

export function SpeedSettings({ className = '' }: SpeedSettingsProps) {
  const minSpeed = useReaderStore((state) => state.minSpeed);
  const maxSpeed = useReaderStore((state) => state.maxSpeed);
  const setSpeed = useReaderStore((state) => state.setSpeed);
  const settings = useReaderStore((state) => state.settings);
  const setSettings = useReaderStore((state) => state.setSettings);

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-lg font-semibold text-text-primary">Speed Settings</h3>

      {/* Default Speed */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Default Speed (WPM)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={minSpeed}
            max={maxSpeed}
            step={25}
            value={settings.defaultSpeed}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              setSettings({ defaultSpeed: value });
              setSpeed(value);
            }}
            className="flex-1 h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            data-testid="speed-slider"
          />
          <span className="w-20 text-right text-text-primary font-mono">
            {settings.defaultSpeed} WPM
          </span>
        </div>
        <div className="flex justify-between text-xs text-text-tertiary mt-1">
          <span>{minSpeed} WPM</span>
          <span>{maxSpeed} WPM</span>
        </div>
      </div>

      {/* Pause on Punctuation */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-text-primary">Pause on Punctuation</label>
          <p className="text-xs text-text-tertiary">Briefly pause after periods, commas, etc.</p>
        </div>
        <button
          onClick={() => setSettings({ pauseOnPunctuation: !settings.pauseOnPunctuation })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            settings.pauseOnPunctuation ? 'bg-primary' : 'bg-bg-tertiary'
          }`}
          role="switch"
          aria-checked={settings.pauseOnPunctuation}
          data-testid="pause-punctuation-toggle"
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
              settings.pauseOnPunctuation ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Chunk Size */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Words per Display
        </label>
        <div className="flex gap-2">
          {([1, 2, 3] as const).map((size) => (
            <button
              key={size}
              onClick={() => setSettings({ chunkSize: size })}
              className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                settings.chunkSize === size
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border-primary bg-bg-secondary text-text-secondary hover:border-border-secondary'
              }`}
              data-testid={`chunk-size-${size}`}
            >
              {size} {size === 1 ? 'word' : 'words'}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-tertiary mt-2">
          Display multiple words at once for faster reading
        </p>
      </div>
    </div>
  );
}

export default SpeedSettings;
