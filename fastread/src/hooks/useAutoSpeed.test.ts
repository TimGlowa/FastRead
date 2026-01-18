import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useReaderStore } from '@/stores';

import { useAutoSpeed } from './useAutoSpeed';

import type { AutoSpeedSettings } from '@/types';

describe('useAutoSpeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useReaderStore.getState().reset();
  });

  it('initializes with default settings', () => {
    const { result } = renderHook(() => useAutoSpeed());

    expect(result.current.isEnabled).toBe(false);
    expect(result.current.settings.increaseEveryWords).toBe(100);
    expect(result.current.settings.increaseAmount).toBe(25);
    expect(result.current.settings.maxSpeed).toBe(600);
    expect(result.current.progressToNextIncrease).toBe(0);
    expect(result.current.totalWordsRead).toBe(0);
    expect(result.current.increasesApplied).toBe(0);
  });

  it('initializes with custom settings', () => {
    const customSettings: AutoSpeedSettings = {
      enabled: true,
      increaseEveryWords: 50,
      increaseAmount: 10,
      maxSpeed: 500,
    };

    const { result } = renderHook(() => useAutoSpeed({ settings: customSettings }));

    expect(result.current.isEnabled).toBe(true);
    expect(result.current.settings.increaseEveryWords).toBe(50);
    expect(result.current.settings.increaseAmount).toBe(10);
    expect(result.current.settings.maxSpeed).toBe(500);
  });

  it('enables auto-speed', () => {
    const { result } = renderHook(() => useAutoSpeed());

    expect(result.current.isEnabled).toBe(false);

    act(() => {
      result.current.enable();
    });

    expect(result.current.isEnabled).toBe(true);
  });

  it('disables auto-speed', () => {
    const { result } = renderHook(() =>
      useAutoSpeed({
        settings: { enabled: true, increaseEveryWords: 100, increaseAmount: 25, maxSpeed: 600 },
      })
    );

    expect(result.current.isEnabled).toBe(true);

    act(() => {
      result.current.disable();
    });

    expect(result.current.isEnabled).toBe(false);
  });

  it('toggles auto-speed', () => {
    const { result } = renderHook(() => useAutoSpeed());

    expect(result.current.isEnabled).toBe(false);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isEnabled).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isEnabled).toBe(false);
  });

  it('updates settings', () => {
    const { result } = renderHook(() => useAutoSpeed());

    act(() => {
      result.current.updateSettings({ increaseEveryWords: 75, maxSpeed: 800 });
    });

    expect(result.current.settings.increaseEveryWords).toBe(75);
    expect(result.current.settings.maxSpeed).toBe(800);
  });

  it('records words and updates progress', () => {
    const { result } = renderHook(() =>
      useAutoSpeed({
        settings: { enabled: true, increaseEveryWords: 100, increaseAmount: 25, maxSpeed: 600 },
      })
    );

    // Record 50 words
    act(() => {
      for (let i = 0; i < 50; i++) {
        result.current.recordWordRead();
      }
    });

    expect(result.current.totalWordsRead).toBe(50);
    expect(result.current.progressToNextIncrease).toBe(50);
    expect(result.current.wordsUntilNextIncrease).toBe(50);
  });

  it('increases speed after configured words', () => {
    const onSpeedIncrease = vi.fn();

    const { result } = renderHook(() =>
      useAutoSpeed({
        settings: { enabled: true, increaseEveryWords: 100, increaseAmount: 25, maxSpeed: 600 },
        onSpeedIncrease,
      })
    );

    // Record 100 words to trigger increase
    act(() => {
      for (let i = 0; i < 100; i++) {
        result.current.recordWordRead();
      }
    });

    expect(result.current.increasesApplied).toBe(1);
    expect(onSpeedIncrease).toHaveBeenCalledWith(325, 1);
  });

  it('calls onMaxSpeedReached when max is hit', () => {
    const onMaxSpeedReached = vi.fn();

    // Start at 375 to reach 400 quickly
    useReaderStore.getState().setSpeed(375);

    const { result } = renderHook(() =>
      useAutoSpeed({
        settings: { enabled: true, increaseEveryWords: 50, increaseAmount: 50, maxSpeed: 400 },
        onMaxSpeedReached,
      })
    );

    // Record enough words to reach max
    act(() => {
      for (let i = 0; i < 50; i++) {
        result.current.recordWordRead();
      }
    });

    expect(result.current.isAtMaxSpeed).toBe(true);
    expect(onMaxSpeedReached).toHaveBeenCalled();
  });

  it('resets progress correctly', () => {
    const { result } = renderHook(() =>
      useAutoSpeed({
        settings: { enabled: true, increaseEveryWords: 100, increaseAmount: 25, maxSpeed: 600 },
      })
    );

    // Record some words
    act(() => {
      for (let i = 0; i < 150; i++) {
        result.current.recordWordRead();
      }
    });

    expect(result.current.totalWordsRead).toBe(150);
    expect(result.current.increasesApplied).toBe(1);

    // Reset
    act(() => {
      result.current.resetProgress();
    });

    expect(result.current.totalWordsRead).toBe(0);
    expect(result.current.increasesApplied).toBe(0);
    expect(result.current.progressToNextIncrease).toBe(0);
    expect(result.current.isAtMaxSpeed).toBe(false);
  });

  it('does not increase speed when disabled', () => {
    const { result } = renderHook(() =>
      useAutoSpeed({
        settings: { enabled: false, increaseEveryWords: 100, increaseAmount: 25, maxSpeed: 600 },
      })
    );

    const initialSpeed = useReaderStore.getState().speed;

    // Record 200 words
    act(() => {
      for (let i = 0; i < 200; i++) {
        result.current.recordWordRead();
      }
    });

    // Speed should not have changed
    expect(useReaderStore.getState().speed).toBe(initialSpeed);
    expect(result.current.increasesApplied).toBe(0);
  });
});
