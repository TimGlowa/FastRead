'use client';

import { useState, useCallback } from 'react';

import type { AutoSpeedSettings as AutoSpeedSettingsType } from '@/types';

export interface AutoSpeedSettingsProps {
  settings: AutoSpeedSettingsType;
  onSettingsChange: (settings: AutoSpeedSettingsType) => void;
}

const WORD_INTERVAL_OPTIONS = [50, 75, 100, 150, 200];
const SPEED_INCREMENT_OPTIONS = [10, 15, 20, 25, 50];
const MAX_SPEED_OPTIONS = [400, 500, 600, 700, 800, 1000];

export function AutoSpeedSettings({ settings, onSettingsChange }: AutoSpeedSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(settings.enabled);
  const [increaseEveryWords, setIncreaseEveryWords] = useState(settings.increaseEveryWords);
  const [increaseAmount, setIncreaseAmount] = useState(settings.increaseAmount);
  const [maxSpeed, setMaxSpeed] = useState(settings.maxSpeed);

  const updateSettings = useCallback(
    (updates: Partial<AutoSpeedSettingsType>) => {
      const newSettings: AutoSpeedSettingsType = {
        enabled: updates.enabled ?? isEnabled,
        increaseEveryWords: updates.increaseEveryWords ?? increaseEveryWords,
        increaseAmount: updates.increaseAmount ?? increaseAmount,
        maxSpeed: updates.maxSpeed ?? maxSpeed,
      };
      onSettingsChange(newSettings);
    },
    [isEnabled, increaseEveryWords, increaseAmount, maxSpeed, onSettingsChange]
  );

  const handleEnabledChange = (checked: boolean) => {
    setIsEnabled(checked);
    updateSettings({ enabled: checked });
  };

  const handleIntervalChange = (value: number) => {
    setIncreaseEveryWords(value);
    updateSettings({ increaseEveryWords: value });
  };

  const handleIncrementChange = (value: number) => {
    setIncreaseAmount(value);
    updateSettings({ increaseAmount: value });
  };

  const handleMaxSpeedChange = (value: number) => {
    setMaxSpeed(value);
    updateSettings({ maxSpeed: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary mb-4">Auto-Speed</h3>
        <p className="text-sm text-text-secondary mb-4">
          Automatically increase reading speed as you progress through the text.
        </p>
      </div>

      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-text-primary">Enable Auto-Speed</label>
          <p className="text-xs text-text-tertiary mt-0.5">
            Gradually increase speed while reading
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={() => handleEnabledChange(!isEnabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-accent-primary' : 'bg-bg-tertiary'
          }`}
          data-testid="auto-speed-toggle"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Word Interval */}
      <div className={`space-y-2 ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className="text-sm font-medium text-text-primary">Increase Every</label>
        <div className="flex flex-wrap gap-2">
          {WORD_INTERVAL_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleIntervalChange(option)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                increaseEveryWords === option
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
              }`}
              data-testid={`interval-${option}`}
            >
              {option} words
            </button>
          ))}
        </div>
      </div>

      {/* Speed Increment */}
      <div className={`space-y-2 ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className="text-sm font-medium text-text-primary">Speed Increase Amount</label>
        <div className="flex flex-wrap gap-2">
          {SPEED_INCREMENT_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleIncrementChange(option)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                increaseAmount === option
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
              }`}
              data-testid={`increment-${option}`}
            >
              +{option} WPM
            </button>
          ))}
        </div>
      </div>

      {/* Max Speed */}
      <div className={`space-y-2 ${!isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <label className="text-sm font-medium text-text-primary">Maximum Speed</label>
        <div className="flex flex-wrap gap-2">
          {MAX_SPEED_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleMaxSpeedChange(option)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                maxSpeed === option
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
              }`}
              data-testid={`max-speed-${option}`}
            >
              {option} WPM
            </button>
          ))}
        </div>
      </div>

      {/* Preview Info */}
      {isEnabled && (
        <div className="bg-bg-tertiary rounded-lg p-4 text-sm">
          <p className="text-text-secondary">
            Starting at 300 WPM, you&apos;ll reach{' '}
            <span className="font-medium text-text-primary">{maxSpeed} WPM</span> after reading{' '}
            <span className="font-medium text-text-primary">
              {Math.ceil((maxSpeed - 300) / increaseAmount) * increaseEveryWords}
            </span>{' '}
            words (~
            {Math.round(
              (Math.ceil((maxSpeed - 300) / increaseAmount) * increaseEveryWords) / 250
            )}{' '}
            pages).
          </p>
        </div>
      )}
    </div>
  );
}

export default AutoSpeedSettings;
