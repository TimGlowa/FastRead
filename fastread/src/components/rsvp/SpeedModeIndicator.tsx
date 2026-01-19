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
// Mode Icons (SVG paths for minimal icons)
// ============================================================================

const ModeIcon = ({ mode, className = '' }: { mode: SpeedControlMode; className?: string }) => {
  switch (mode) {
    case 'fixed':
      // Dash icon - represents constant speed
      return (
        <svg
          className={className}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="4" y1="8" x2="12" y2="8" />
        </svg>
      );

    case 'training':
      // Gradual arrow - represents adaptive ramp
      return (
        <svg
          className={className}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12 L12 4" />
          <path d="M7 4 L12 4 L12 9" />
        </svg>
      );

    case 'demo':
      // Lightning bolt - represents aggressive ramp
      return (
        <svg className={className} viewBox="0 0 16 16" fill="currentColor">
          <path d="M9 2L4 9h4l-1 5 5-7H8l1-5z" />
        </svg>
      );
  }
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

  // Store state
  const speedControlMode = useReaderStore((state) => state.speedControlMode);
  const rampPhase = useReaderStore((state) => state.rampPhase);
  const isPlaying = useReaderStore((state) => state.isPlaying);
  const setSpeedControlMode = useReaderStore((state) => state.setSpeedControlMode);
  const pause = useReaderStore((state) => state.pause);

  // Handle mode selection
  const handleModeSelect = useCallback(
    (mode: SpeedControlMode) => {
      // Pause when changing modes
      if (isPlaying) {
        pause();
      }

      setSpeedControlMode(mode);
      onModeChange?.(mode);
      setIsExpanded(false);
    },
    [isPlaying, pause, setSpeedControlMode, onModeChange]
  );

  // Toggle expansion
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Very discrete button styling
  const indicatorButtonClass =
    'relative p-1.5 rounded text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/30 transition-colors';

  const modeButtonClass = (mode: SpeedControlMode) =>
    `px-2 py-1 rounded text-xs transition-colors ${
      speedControlMode === mode
        ? 'text-neutral-300 bg-neutral-800/50'
        : 'text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/30'
    }`;

  return (
    <div className={`relative ${className}`}>
      {/* Indicator button - always visible but minimal */}
      <button
        type="button"
        onClick={toggleExpanded}
        className={indicatorButtonClass}
        aria-label={`Speed mode: ${speedControlMode}. Click to change.`}
        aria-expanded={isExpanded}
        data-testid="speed-mode-indicator"
      >
        <ModeIcon mode={speedControlMode} className="w-4 h-4" />
        <PhaseIndicator phase={rampPhase} />
      </button>

      {/* Expanded mode selector */}
      {isExpanded && (
        <div
          className="absolute bottom-full left-0 mb-2 p-1 rounded-md bg-neutral-900/95 border border-neutral-800 shadow-lg"
          role="menu"
        >
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => handleModeSelect('fixed')}
              className={modeButtonClass('fixed')}
              role="menuitem"
              aria-label="Fixed speed mode"
              data-testid="mode-fixed-btn"
            >
              <span className="flex items-center gap-1.5">
                <ModeIcon mode="fixed" className="w-3 h-3" />
                <span>Fixed</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSelect('training')}
              className={modeButtonClass('training')}
              role="menuitem"
              aria-label="Training ramp mode"
              data-testid="mode-training-btn"
            >
              <span className="flex items-center gap-1.5">
                <ModeIcon mode="training" className="w-3 h-3" />
                <span>Train</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSelect('demo')}
              className={modeButtonClass('demo')}
              role="menuitem"
              aria-label="Demo ramp mode"
              data-testid="mode-demo-btn"
            >
              <span className="flex items-center gap-1.5">
                <ModeIcon mode="demo" className="w-3 h-3" />
                <span>Demo</span>
              </span>
            </button>
          </div>

          {/* Mode description - very subtle */}
          <div className="mt-1 px-1 text-[10px] text-neutral-600">
            {speedControlMode === 'fixed' && 'Constant speed'}
            {speedControlMode === 'training' && 'Gradual adaptive ramp'}
            {speedControlMode === 'demo' && 'Fast demo ramp'}
          </div>
        </div>
      )}
    </div>
  );
}

export default SpeedModeIndicator;
