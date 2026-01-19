'use client';

import { useState, useCallback } from 'react';

import { useReaderStore } from '@/stores';
import type { SpeedControlMode, RampPhase } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface SpeedModeIndicatorProps {
  className?: string;
  onModeChange?: (mode: SpeedControlMode) => void;
}

// ============================================================================
// Mode Labels
// ============================================================================

const modeLabels: Record<SpeedControlMode, string> = {
  fixed: 'Fixed',
  training: 'Auto',
  demo: 'Demo',
};

const modeDescriptions: Record<SpeedControlMode, string> = {
  fixed: 'Constant speed - adjust manually',
  training: 'Gradually increases to max speed',
  demo: 'Fast ramp for demonstrations',
};

// ============================================================================
// Phase Indicator (subtle dot)
// ============================================================================

const PhaseIndicator = ({ phase }: { phase: RampPhase }) => {
  if (phase === 'idle') return null;

  const colors: Record<RampPhase, string> = {
    idle: '',
    stabilization: 'bg-blue-500/50',
    acceleration: 'bg-amber-500/50',
    plateau: 'bg-green-500/50',
    cooldown: 'bg-red-500/50',
  };

  return (
    <span
      className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${colors[phase]}`}
      title={phase}
    />
  );
};

// ============================================================================
// Component
// ============================================================================

export function SpeedModeIndicator({ className = '', onModeChange }: SpeedModeIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [maxSpeed, setMaxSpeed] = useState(700);

  // Store state
  const speedControlMode = useReaderStore((state) => state.speedControlMode);
  const rampPhase = useReaderStore((state) => state.rampPhase);
  const isPlaying = useReaderStore((state) => state.isPlaying);
  const speed = useReaderStore((state) => state.speed);
  const setSpeedControlMode = useReaderStore((state) => state.setSpeedControlMode);
  const pause = useReaderStore((state) => state.pause);

  // Handle mode selection
  const handleModeSelect = useCallback(
    (mode: SpeedControlMode) => {
      // Pause when changing modes
      if (isPlaying) {
        pause();
      }

      // Pass config with maxSpeed for training/demo modes
      if (mode === 'training') {
        setSpeedControlMode(mode, {
          startSpeed: speed,
          maxSpeed: maxSpeed,
          stabilizationWords: 200,
          accelerationWords: 500,
          stabilizationRate: 5,
          accelerationRate: 15,
          strainDropback: 50,
          strainCooldownWords: 100,
          pauseThresholdMs: 3000,
          rewindThresholdWords: 20,
        });
      } else if (mode === 'demo') {
        setSpeedControlMode(mode, {
          startSpeed: speed,
          maxSpeed: maxSpeed,
          rampDurationSeconds: 35,
          reducePunctuationPauses: true,
          punctuationReductionFactor: 0.5,
        });
      } else {
        setSpeedControlMode(mode, { speed });
      }

      onModeChange?.(mode);
    },
    [isPlaying, pause, setSpeedControlMode, onModeChange, speed, maxSpeed]
  );

  // Handle max speed change
  const handleMaxSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = parseInt(e.target.value, 10);
    if (!isNaN(newMax) && newMax >= 200 && newMax <= 1500) {
      setMaxSpeed(newMax);
    }
  }, []);

  // Toggle expansion
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Close panel
  const closePanel = useCallback(() => {
    setIsExpanded(false);
  }, []);

  // Button styling
  const indicatorButtonClass =
    'relative px-2 py-1 rounded text-xs text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 transition-colors border border-neutral-700/50';

  const modeButtonClass = (mode: SpeedControlMode) =>
    `flex-1 px-3 py-2 rounded text-sm transition-colors ${
      speedControlMode === mode
        ? 'text-white bg-neutral-700'
        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
    }`;

  return (
    <div className={`relative ${className}`}>
      {/* Indicator button - shows current mode clearly */}
      <button
        type="button"
        onClick={toggleExpanded}
        className={indicatorButtonClass}
        aria-label={`Speed mode: ${modeLabels[speedControlMode]}. Click to change.`}
        aria-expanded={isExpanded}
        data-testid="speed-mode-indicator"
      >
        <span className="flex items-center gap-1">
          <span>{modeLabels[speedControlMode]}</span>
          {speedControlMode !== 'fixed' && (
            <span className="text-neutral-600">→{maxSpeed}</span>
          )}
          <PhaseIndicator phase={rampPhase} />
        </span>
      </button>

      {/* Expanded settings panel */}
      {isExpanded && (
        <>
          {/* Backdrop to close */}
          <div
            className="fixed inset-0 z-10"
            onClick={closePanel}
            aria-hidden="true"
          />

          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-lg bg-neutral-900 border border-neutral-700 shadow-xl z-20 min-w-[220px]"
            role="dialog"
            aria-label="Speed mode settings"
          >
            {/* Mode selector */}
            <div className="mb-3">
              <div className="text-xs text-neutral-500 mb-2">Speed Mode</div>
              <div className="flex gap-1">
                {(['fixed', 'training', 'demo'] as SpeedControlMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleModeSelect(mode)}
                    className={modeButtonClass(mode)}
                    aria-label={modeDescriptions[mode]}
                    data-testid={`mode-${mode}-btn`}
                  >
                    {modeLabels[mode]}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode description */}
            <div className="text-xs text-neutral-500 mb-3">
              {modeDescriptions[speedControlMode]}
            </div>

            {/* Max speed setting - only for auto modes */}
            {speedControlMode !== 'fixed' && (
              <div className="border-t border-neutral-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="max-speed" className="text-xs text-neutral-500">
                    Max Speed
                  </label>
                  <span className="text-sm text-neutral-300">{maxSpeed} wpm</span>
                </div>
                <input
                  id="max-speed"
                  type="range"
                  min="200"
                  max="1500"
                  step="50"
                  value={maxSpeed}
                  onChange={handleMaxSpeedChange}
                  className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-neutral-400"
                  data-testid="max-speed-slider"
                />
                <div className="flex justify-between text-[10px] text-neutral-600 mt-1">
                  <span>200</span>
                  <span>1500</span>
                </div>
              </div>
            )}

            {/* Apply button for auto modes */}
            {speedControlMode !== 'fixed' && (
              <button
                type="button"
                onClick={() => {
                  handleModeSelect(speedControlMode);
                  closePanel();
                }}
                className="w-full mt-3 px-3 py-1.5 rounded text-sm text-neutral-300 bg-neutral-700 hover:bg-neutral-600 transition-colors"
                data-testid="apply-speed-settings-btn"
              >
                Apply
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default SpeedModeIndicator;
