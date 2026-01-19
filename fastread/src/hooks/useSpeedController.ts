'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useReaderStore } from '@/stores';
import type { SpeedControlMode, RampPhase, SpeedModeConfig } from '@/types';
import type { SpeedController, SpeedControllerCallbacks } from '@/lib/rsvp/speed-controller/types';
import { createFixedController } from '@/lib/rsvp/speed-controller/fixed-controller';
import { createTrainingController } from '@/lib/rsvp/speed-controller/training-controller';
import { createDemoController } from '@/lib/rsvp/speed-controller/demo-controller';

// ============================================================================
// Types
// ============================================================================

export interface UseSpeedControllerOptions {
  /** Called when speed changes (for any reason) */
  onSpeedChange?: (speed: number, reason: string) => void;
  /** Called when ramp phase changes */
  onPhaseChange?: (phase: RampPhase) => void;
  /** Called when max speed is reached */
  onMaxReached?: () => void;
}

export interface UseSpeedControllerReturn {
  // Current state
  currentSpeed: number;
  mode: SpeedControlMode;
  phase: RampPhase;
  isRamping: boolean;
  isRampPaused: boolean;
  progress: number;

  // Lifecycle controls
  start: () => void;
  stop: () => void;
  pauseController: () => void;
  resumeController: () => void;
  reset: () => void;

  // Word events (to be called by timing engine)
  onWordRead: (word: string, isSentenceEnd: boolean) => void;

  // User behavior events (for strain detection)
  onUserPause: (durationMs: number) => void;
  onUserRewind: (wordCount: number) => void;

  // Manual speed control
  setUserSpeed: (speed: number) => void;

  // Mode switching
  setMode: (mode: SpeedControlMode, config?: SpeedModeConfig) => void;
}

// ============================================================================
// Default Configs
// ============================================================================

const DEFAULT_FIXED_CONFIG = { speed: 300 };

const DEFAULT_TRAINING_CONFIG = {
  startSpeed: 300,
  maxSpeed: 700,
  stabilizationWords: 200,
  accelerationWords: 500,
  stabilizationRate: 5,
  accelerationRate: 15,
  strainDropback: 50,
  strainCooldownWords: 100,
  pauseThresholdMs: 3000,
  rewindThresholdWords: 20,
};

const DEFAULT_DEMO_CONFIG = {
  startSpeed: 350,
  maxSpeed: 1000,
  rampDurationSeconds: 35,
  reducePunctuationPauses: true,
  punctuationReductionFactor: 0.5,
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSpeedController(
  options: UseSpeedControllerOptions = {}
): UseSpeedControllerReturn {
  const { onSpeedChange, onPhaseChange, onMaxReached } = options;

  // Store state
  const speed = useReaderStore((state) => state.speed);
  const speedControlMode = useReaderStore((state) => state.speedControlMode);
  const speedModeConfig = useReaderStore((state) => state.speedModeConfig);
  const rampPhase = useReaderStore((state) => state.rampPhase);
  const isRamping = useReaderStore((state) => state.isRamping);
  const isRampPaused = useReaderStore((state) => state.isRampPaused);

  // Store actions
  const setSpeed = useReaderStore((state) => state.setSpeed);
  const setSpeedControlMode = useReaderStore((state) => state.setSpeedControlMode);
  const setRampPhase = useReaderStore((state) => state.setRampPhase);
  const setIsRamping = useReaderStore((state) => state.setIsRamping);
  const setIsRampPaused = useReaderStore((state) => state.setIsRampPaused);

  // Controller ref
  const controllerRef = useRef<SpeedController | null>(null);

  // Progress state (0-100)
  const [progress, setProgress] = useState(0);

  // Create callbacks for controller
  const callbacks: SpeedControllerCallbacks = {
    onSpeedChange: (newSpeed, reason) => {
      setSpeed(newSpeed);
      onSpeedChange?.(newSpeed, reason);
    },
    onPhaseChange: (phase) => {
      setRampPhase(phase);
      onPhaseChange?.(phase);
    },
    onMaxReached: () => {
      setIsRamping(false);
      onMaxReached?.();
    },
  };

  // Create/recreate controller when mode changes
  useEffect(() => {
    const mode = speedControlMode;
    const config = speedModeConfig;

    // Create appropriate controller based on mode
    switch (mode) {
      case 'fixed': {
        const fixedConfig =
          config && 'speed' in config ? config : DEFAULT_FIXED_CONFIG;
        controllerRef.current = createFixedController(fixedConfig, callbacks);
        break;
      }

      case 'training': {
        const trainingConfig =
          config && 'stabilizationWords' in config ? config : DEFAULT_TRAINING_CONFIG;
        controllerRef.current = createTrainingController(trainingConfig, callbacks);
        break;
      }

      case 'demo': {
        const demoConfig =
          config && 'rampDurationSeconds' in config ? config : DEFAULT_DEMO_CONFIG;
        controllerRef.current = createDemoController(demoConfig, callbacks);
        break;
      }

      default:
        controllerRef.current = createFixedController(DEFAULT_FIXED_CONFIG, callbacks);
    }

    setProgress(controllerRef.current.getProgress());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speedControlMode, speedModeConfig]);

  // ============================================================================
  // Lifecycle Controls
  // ============================================================================

  const start = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.start();
      if (speedControlMode !== 'fixed') {
        setIsRamping(true);
        setIsRampPaused(false); // Reset ramp pause state on start
      }
    }
  }, [speedControlMode, setIsRamping, setIsRampPaused]);

  const stop = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.stop();
      setIsRamping(false);
    }
  }, [setIsRamping]);

  const pauseController = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.pause();
    }
  }, []);

  const resumeController = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.resume();
    }
  }, []);

  const reset = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.reset();
      setProgress(0);
      setRampPhase('idle');
      setIsRamping(false);
    }
  }, [setRampPhase, setIsRamping]);

  // ============================================================================
  // Word Events
  // ============================================================================

  const onWordRead = useCallback(
    (word: string, isSentenceEnd: boolean) => {
      if (controllerRef.current) {
        // If ramp is paused, don't notify controller (keeps speed constant)
        if (!isRampPaused) {
          controllerRef.current.onWordRead(word, isSentenceEnd);
        }
        setProgress(controllerRef.current.getProgress());
      }
    },
    [isRampPaused]
  );

  // ============================================================================
  // User Behavior Events
  // ============================================================================

  const onUserPause = useCallback((durationMs: number) => {
    if (controllerRef.current) {
      controllerRef.current.onUserPause(durationMs);
    }
  }, []);

  const onUserRewind = useCallback((wordCount: number) => {
    if (controllerRef.current) {
      controllerRef.current.onUserRewind(wordCount);
    }
  }, []);

  // ============================================================================
  // Manual Speed Control
  // ============================================================================

  const setUserSpeed = useCallback((newSpeed: number) => {
    if (controllerRef.current) {
      controllerRef.current.setUserSpeed(newSpeed);
    }
  }, []);

  // ============================================================================
  // Mode Switching
  // ============================================================================

  const setMode = useCallback(
    (mode: SpeedControlMode, config?: SpeedModeConfig) => {
      // Stop current controller
      if (controllerRef.current) {
        controllerRef.current.stop();
      }

      // Get default config for mode if not provided
      let finalConfig = config;
      if (!finalConfig) {
        switch (mode) {
          case 'fixed':
            finalConfig = { speed };
            break;
          case 'training':
            finalConfig = { ...DEFAULT_TRAINING_CONFIG, startSpeed: speed };
            break;
          case 'demo':
            finalConfig = { ...DEFAULT_DEMO_CONFIG, startSpeed: speed };
            break;
        }
      }

      // Update store (this triggers controller recreation via useEffect)
      setSpeedControlMode(mode, finalConfig);
    },
    [speed, setSpeedControlMode]
  );

  // ============================================================================
  // Return
  // ============================================================================

  return {
    currentSpeed: speed,
    mode: speedControlMode,
    phase: rampPhase,
    isRamping,
    isRampPaused,
    progress,

    start,
    stop,
    pauseController,
    resumeController,
    reset,

    onWordRead,
    onUserPause,
    onUserRewind,

    setUserSpeed,
    setMode,
  };
}
