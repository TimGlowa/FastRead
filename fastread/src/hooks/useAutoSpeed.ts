'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  type AutoSpeedController,
  DEFAULT_AUTO_SPEED_SETTINGS,
  createAutoSpeedController,
} from '@/lib/rsvp/auto-speed';
import { useReaderStore } from '@/stores';

import type { AutoSpeedSettings } from '@/types';

export interface UseAutoSpeedOptions {
  /** Initial auto-speed settings */
  settings?: AutoSpeedSettings;
  /** Callback when speed increases */
  onSpeedIncrease?: (newSpeed: number, increasesApplied: number) => void;
  /** Callback when max speed is reached */
  onMaxSpeedReached?: () => void;
}

export interface UseAutoSpeedReturn {
  /** Whether auto-speed is enabled */
  isEnabled: boolean;
  /** Current auto-speed settings */
  settings: AutoSpeedSettings;
  /** Progress toward next speed increase (0-100) */
  progressToNextIncrease: number;
  /** Words remaining until next increase */
  wordsUntilNextIncrease: number;
  /** Total words read in session */
  totalWordsRead: number;
  /** Number of speed increases applied */
  increasesApplied: number;
  /** Whether max speed has been reached */
  isAtMaxSpeed: boolean;

  /** Enable auto-speed */
  enable: () => void;
  /** Disable auto-speed */
  disable: () => void;
  /** Toggle auto-speed */
  toggle: () => void;
  /** Update auto-speed settings */
  updateSettings: (settings: Partial<AutoSpeedSettings>) => void;
  /** Reset progress tracking */
  resetProgress: () => void;
  /** Record that a word was read (call from timing loop) */
  recordWordRead: () => boolean;
}

export function useAutoSpeed(options: UseAutoSpeedOptions = {}): UseAutoSpeedReturn {
  const {
    settings: initialSettings = DEFAULT_AUTO_SPEED_SETTINGS,
    onSpeedIncrease,
    onMaxSpeedReached,
  } = options;

  const [settings, setSettings] = useState<AutoSpeedSettings>(initialSettings);
  const [progressToNextIncrease, setProgressToNextIncrease] = useState(0);
  const [wordsUntilNextIncrease, setWordsUntilNextIncrease] = useState(
    initialSettings.increaseEveryWords
  );
  const [totalWordsRead, setTotalWordsRead] = useState(0);
  const [increasesApplied, setIncreasesApplied] = useState(0);
  const [isAtMaxSpeed, setIsAtMaxSpeed] = useState(false);

  const speed = useReaderStore((state) => state.speed);
  const setSpeed = useReaderStore((state) => state.setSpeed);

  const controllerRef = useRef<AutoSpeedController | null>(null);

  // Initialize controller
  useEffect(() => {
    const handleSpeedIncrease = (newSpeed: number, increases: number) => {
      setSpeed(newSpeed);
      setIncreasesApplied(increases);
      onSpeedIncrease?.(newSpeed, increases);
    };

    const handleMaxSpeedReached = () => {
      setIsAtMaxSpeed(true);
      onMaxSpeedReached?.();
    };

    controllerRef.current = createAutoSpeedController(speed, settings, {
      onSpeedIncrease: handleSpeedIncrease,
      onMaxSpeedReached: handleMaxSpeedReached,
    });

    return () => {
      controllerRef.current = null;
    };
  }, []); // Only initialize once

  // Sync settings changes to controller
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.updateSettings(settings);
      setWordsUntilNextIncrease(controllerRef.current.getWordsUntilNextIncrease());
    }
  }, [settings]);

  // Update controller callbacks when they change
  useEffect(() => {
    if (controllerRef.current) {
      // Need to recreate controller to update callbacks
      const state = controllerRef.current.getState();

      const handleSpeedIncrease = (newSpeed: number, increases: number) => {
        setSpeed(newSpeed);
        setIncreasesApplied(increases);
        onSpeedIncrease?.(newSpeed, increases);
      };

      const handleMaxSpeedReached = () => {
        setIsAtMaxSpeed(true);
        onMaxSpeedReached?.();
      };

      controllerRef.current = createAutoSpeedController(state.baseSpeed, settings, {
        onSpeedIncrease: handleSpeedIncrease,
        onMaxSpeedReached: handleMaxSpeedReached,
      });

      // Restore state
      for (let i = 0; i < state.totalWordsRead; i++) {
        controllerRef.current.recordWordRead();
      }
    }
  }, [onSpeedIncrease, onMaxSpeedReached, setSpeed, settings]);

  const enable = useCallback(() => {
    setSettings((prev) => ({ ...prev, enabled: true }));
  }, []);

  const disable = useCallback(() => {
    setSettings((prev) => ({ ...prev, enabled: false }));
  }, []);

  const toggle = useCallback(() => {
    setSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AutoSpeedSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const resetProgress = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.resetProgress();
      setProgressToNextIncrease(0);
      setWordsUntilNextIncrease(settings.increaseEveryWords);
      setTotalWordsRead(0);
      setIncreasesApplied(0);
      setIsAtMaxSpeed(false);
    }
  }, [settings.increaseEveryWords]);

  const recordWordRead = useCallback((): boolean => {
    if (!controllerRef.current) return false;

    const increased = controllerRef.current.recordWordRead();
    const state = controllerRef.current.getState();

    setProgressToNextIncrease(controllerRef.current.getProgressToNextIncrease());
    setWordsUntilNextIncrease(controllerRef.current.getWordsUntilNextIncrease());
    setTotalWordsRead(state.totalWordsRead);

    return increased;
  }, []);

  return {
    isEnabled: settings.enabled,
    settings,
    progressToNextIncrease,
    wordsUntilNextIncrease,
    totalWordsRead,
    increasesApplied,
    isAtMaxSpeed,
    enable,
    disable,
    toggle,
    updateSettings,
    resetProgress,
    recordWordRead,
  };
}

export default useAutoSpeed;
