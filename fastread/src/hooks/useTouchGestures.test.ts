import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useTouchGestures } from './useTouchGestures';
import { useReaderStore } from '@/stores';

describe('useTouchGestures', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    useReaderStore.getState().reset();
    useReaderStore.getState().setWords(Array.from({ length: 50 }, (_, i) => `word${i}`));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createTouchEvent = (
    type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel',
    clientX: number,
    clientY: number
  ): TouchEvent => {
    const touch = {
      clientX,
      clientY,
      identifier: 0,
      target: document.body,
    } as Touch;

    return new TouchEvent(type, {
      touches: type === 'touchend' || type === 'touchcancel' ? [] : [touch],
      changedTouches: [touch],
      bubbles: true,
    });
  };

  it('returns list of gestures', () => {
    const { result } = renderHook(() => useTouchGestures());

    expect(result.current.gestures).toHaveLength(7);
    expect(result.current.gestures.map((g) => g.type)).toContain('tap');
    expect(result.current.gestures.map((g) => g.type)).toContain('double-tap');
    expect(result.current.gestures.map((g) => g.type)).toContain('swipe-left');
    expect(result.current.gestures.map((g) => g.type)).toContain('swipe-right');
  });

  it('toggles play/pause on tap', async () => {
    const onGesture = vi.fn();
    renderHook(() => useTouchGestures({ onGesture, doubleTapThreshold: 100 }));

    expect(useReaderStore.getState().isPlaying).toBe(false);

    // Simulate tap
    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 100, 100));
      document.dispatchEvent(createTouchEvent('touchend', 100, 100));
    });

    // Wait for double tap timeout
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(useReaderStore.getState().isPlaying).toBe(true);
    expect(onGesture).toHaveBeenCalledWith(expect.objectContaining({ type: 'tap' }));
  });

  it('resets on double tap', () => {
    useReaderStore.getState().setCurrentWordIndex(20);
    useReaderStore.getState().play();

    const onGesture = vi.fn();
    renderHook(() => useTouchGestures({ onGesture, doubleTapThreshold: 300 }));

    // First tap
    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 100, 100));
      document.dispatchEvent(createTouchEvent('touchend', 100, 100));
    });

    // Second tap (double tap) - within threshold
    act(() => {
      vi.advanceTimersByTime(100);
      document.dispatchEvent(createTouchEvent('touchstart', 100, 100));
      document.dispatchEvent(createTouchEvent('touchend', 100, 100));
    });

    expect(useReaderStore.getState().currentWordIndex).toBe(0);
    expect(useReaderStore.getState().isPlaying).toBe(false);
    expect(onGesture).toHaveBeenCalledWith(expect.objectContaining({ type: 'double-tap' }));
  });

  it('skips forward on swipe right', () => {
    useReaderStore.getState().setCurrentWordIndex(10);

    const onGesture = vi.fn();
    renderHook(() => useTouchGestures({ onGesture, swipeThreshold: 50, skipWordCount: 5 }));

    // Simulate swipe right
    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 100, 100));
      document.dispatchEvent(createTouchEvent('touchmove', 200, 100));
      document.dispatchEvent(createTouchEvent('touchend', 200, 100));
    });

    expect(useReaderStore.getState().currentWordIndex).toBe(15);
    expect(onGesture).toHaveBeenCalledWith(expect.objectContaining({ type: 'swipe-right' }));
  });

  it('skips backward on swipe left', () => {
    useReaderStore.getState().setCurrentWordIndex(20);

    const onGesture = vi.fn();
    renderHook(() => useTouchGestures({ onGesture, swipeThreshold: 50, skipWordCount: 5 }));

    // Simulate swipe left
    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 200, 100));
      document.dispatchEvent(createTouchEvent('touchmove', 100, 100));
      document.dispatchEvent(createTouchEvent('touchend', 100, 100));
    });

    expect(useReaderStore.getState().currentWordIndex).toBe(15);
    expect(onGesture).toHaveBeenCalledWith(expect.objectContaining({ type: 'swipe-left' }));
  });

  it('increases speed on swipe up', () => {
    const initialSpeed = useReaderStore.getState().speed;

    const onGesture = vi.fn();
    renderHook(() => useTouchGestures({ onGesture, swipeThreshold: 50 }));

    // Simulate swipe up
    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 100, 200));
      document.dispatchEvent(createTouchEvent('touchmove', 100, 100));
      document.dispatchEvent(createTouchEvent('touchend', 100, 100));
    });

    expect(useReaderStore.getState().speed).toBeGreaterThan(initialSpeed);
    expect(onGesture).toHaveBeenCalledWith(expect.objectContaining({ type: 'swipe-up' }));
  });

  it('decreases speed on swipe down', () => {
    useReaderStore.getState().setSpeed(400);
    const initialSpeed = useReaderStore.getState().speed;

    const onGesture = vi.fn();
    renderHook(() => useTouchGestures({ onGesture, swipeThreshold: 50 }));

    // Simulate swipe down
    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 100, 100));
      document.dispatchEvent(createTouchEvent('touchmove', 100, 200));
      document.dispatchEvent(createTouchEvent('touchend', 100, 200));
    });

    expect(useReaderStore.getState().speed).toBeLessThan(initialSpeed);
    expect(onGesture).toHaveBeenCalledWith(expect.objectContaining({ type: 'swipe-down' }));
  });

  it('pauses on long press', () => {
    useReaderStore.getState().play();
    expect(useReaderStore.getState().isPlaying).toBe(true);

    const onGesture = vi.fn();
    renderHook(() => useTouchGestures({ onGesture, longPressThreshold: 500 }));

    // Start touch
    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 100, 100));
    });

    // Wait for long press threshold
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(useReaderStore.getState().isPlaying).toBe(false);
    expect(onGesture).toHaveBeenCalledWith(expect.objectContaining({ type: 'long-press' }));
  });

  it('cancels long press on movement', () => {
    useReaderStore.getState().play();

    const onGesture = vi.fn();
    renderHook(() => useTouchGestures({ onGesture, longPressThreshold: 500 }));

    // Start touch
    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 100, 100));
    });

    // Move before long press threshold
    act(() => {
      vi.advanceTimersByTime(200);
      document.dispatchEvent(createTouchEvent('touchmove', 150, 100));
    });

    // Wait past long press threshold
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // Long press should not have triggered
    expect(useReaderStore.getState().isPlaying).toBe(true);
    expect(onGesture).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'long-press' }));
  });

  it('does not trigger gestures when disabled', () => {
    const onGesture = vi.fn();
    renderHook(() => useTouchGestures({ enabled: false, onGesture }));

    // Simulate tap
    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 100, 100));
      document.dispatchEvent(createTouchEvent('touchend', 100, 100));
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(onGesture).not.toHaveBeenCalled();
  });

  it('ignores swipes that are too slow', () => {
    useReaderStore.getState().setCurrentWordIndex(20);
    const initialIndex = useReaderStore.getState().currentWordIndex;

    const onGesture = vi.fn();
    renderHook(() => useTouchGestures({ onGesture, swipeTimeLimit: 300 }));

    // Start touch
    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 100, 100));
    });

    // Wait longer than swipe time limit
    act(() => {
      vi.advanceTimersByTime(400);
    });

    // End touch
    act(() => {
      document.dispatchEvent(createTouchEvent('touchend', 200, 100));
    });

    // Should not have triggered swipe
    expect(useReaderStore.getState().currentWordIndex).toBe(initialIndex);
    expect(onGesture).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'swipe-right' }));
  });

  it('uses custom skipWordCount', () => {
    useReaderStore.getState().setCurrentWordIndex(10);

    renderHook(() => useTouchGestures({ swipeThreshold: 50, skipWordCount: 15 }));

    // Simulate swipe right
    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 100, 100));
      document.dispatchEvent(createTouchEvent('touchend', 200, 100));
    });

    expect(useReaderStore.getState().currentWordIndex).toBe(25);
  });

  it('cancels on touchcancel event', () => {
    const onGesture = vi.fn();
    renderHook(() => useTouchGestures({ onGesture, longPressThreshold: 500 }));

    // Start touch
    act(() => {
      document.dispatchEvent(createTouchEvent('touchstart', 100, 100));
    });

    // Cancel touch
    act(() => {
      document.dispatchEvent(createTouchEvent('touchcancel', 100, 100));
    });

    // Wait past long press threshold
    act(() => {
      vi.advanceTimersByTime(600);
    });

    // Long press should not have triggered
    expect(onGesture).not.toHaveBeenCalled();
  });
});
