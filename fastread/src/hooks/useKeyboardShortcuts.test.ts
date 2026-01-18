import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useReaderStore } from '@/stores';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useReaderStore.getState().reset();
    useReaderStore.getState().setWords(['one', 'two', 'three', 'four', 'five']);
  });

  afterEach(() => {
    // Clean up any event listeners
    vi.restoreAllMocks();
  });

  const dispatchKeyEvent = (code: string, key?: string) => {
    const event = new KeyboardEvent('keydown', {
      code,
      key: key || code,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  it('returns list of shortcuts', () => {
    const { result } = renderHook(() => useKeyboardShortcuts());

    expect(result.current.shortcuts).toHaveLength(11);
    expect(result.current.shortcuts.map((s) => s.key)).toContain('Space');
    expect(result.current.shortcuts.map((s) => s.key)).toContain('ArrowLeft');
    expect(result.current.shortcuts.map((s) => s.key)).toContain('ArrowRight');
  });

  it('toggles play/pause with Space', () => {
    renderHook(() => useKeyboardShortcuts());

    expect(useReaderStore.getState().isPlaying).toBe(false);

    act(() => {
      dispatchKeyEvent('Space', ' ');
    });

    expect(useReaderStore.getState().isPlaying).toBe(true);

    act(() => {
      dispatchKeyEvent('Space', ' ');
    });

    expect(useReaderStore.getState().isPlaying).toBe(false);
  });

  it('navigates to previous word with ArrowLeft when paused', () => {
    useReaderStore.getState().setCurrentWordIndex(2);

    renderHook(() => useKeyboardShortcuts());

    act(() => {
      dispatchKeyEvent('ArrowLeft');
    });

    expect(useReaderStore.getState().currentWordIndex).toBe(1);
  });

  it('navigates to next word with ArrowRight when paused', () => {
    useReaderStore.getState().setCurrentWordIndex(2);

    renderHook(() => useKeyboardShortcuts());

    act(() => {
      dispatchKeyEvent('ArrowRight');
    });

    expect(useReaderStore.getState().currentWordIndex).toBe(3);
  });

  it('skips back with ArrowLeft when playing', () => {
    const words = Array.from({ length: 20 }, (_, i) => `word${i}`);
    useReaderStore.getState().setWords(words);
    useReaderStore.getState().setCurrentWordIndex(15);
    useReaderStore.getState().play();

    renderHook(() => useKeyboardShortcuts({ skipWordCount: 10 }));

    act(() => {
      dispatchKeyEvent('ArrowLeft');
    });

    expect(useReaderStore.getState().currentWordIndex).toBe(5);
  });

  it('skips forward with ArrowRight when playing', () => {
    const words = Array.from({ length: 30 }, (_, i) => `word${i}`);
    useReaderStore.getState().setWords(words);
    useReaderStore.getState().setCurrentWordIndex(5);
    useReaderStore.getState().play();

    renderHook(() => useKeyboardShortcuts({ skipWordCount: 10 }));

    act(() => {
      dispatchKeyEvent('ArrowRight');
    });

    expect(useReaderStore.getState().currentWordIndex).toBe(15);
  });

  it('increases speed with ArrowUp', () => {
    const initialSpeed = useReaderStore.getState().speed;

    renderHook(() => useKeyboardShortcuts());

    act(() => {
      dispatchKeyEvent('ArrowUp');
    });

    expect(useReaderStore.getState().speed).toBeGreaterThan(initialSpeed);
  });

  it('decreases speed with ArrowDown', () => {
    useReaderStore.getState().setSpeed(400);
    const initialSpeed = useReaderStore.getState().speed;

    renderHook(() => useKeyboardShortcuts());

    act(() => {
      dispatchKeyEvent('ArrowDown');
    });

    expect(useReaderStore.getState().speed).toBeLessThan(initialSpeed);
  });

  it('goes to start with Home', () => {
    useReaderStore.getState().setCurrentWordIndex(3);

    renderHook(() => useKeyboardShortcuts());

    act(() => {
      dispatchKeyEvent('Home');
    });

    expect(useReaderStore.getState().currentWordIndex).toBe(0);
  });

  it('goes to end with End', () => {
    renderHook(() => useKeyboardShortcuts());

    act(() => {
      dispatchKeyEvent('End');
    });

    expect(useReaderStore.getState().currentWordIndex).toBe(4); // last word index
  });

  it('pauses with Escape', () => {
    useReaderStore.getState().play();
    expect(useReaderStore.getState().isPlaying).toBe(true);

    renderHook(() => useKeyboardShortcuts());

    act(() => {
      dispatchKeyEvent('Escape');
    });

    expect(useReaderStore.getState().isPlaying).toBe(false);
  });

  it('resets to start with R', () => {
    useReaderStore.getState().setCurrentWordIndex(3);
    useReaderStore.getState().play();

    renderHook(() => useKeyboardShortcuts());

    act(() => {
      dispatchKeyEvent('KeyR', 'r');
    });

    expect(useReaderStore.getState().currentWordIndex).toBe(0);
    expect(useReaderStore.getState().isPlaying).toBe(false);
  });

  it('decreases speed with [', () => {
    useReaderStore.getState().setSpeed(400);
    const initialSpeed = useReaderStore.getState().speed;

    renderHook(() => useKeyboardShortcuts());

    act(() => {
      dispatchKeyEvent('BracketLeft', '[');
    });

    expect(useReaderStore.getState().speed).toBeLessThan(initialSpeed);
  });

  it('increases speed with ]', () => {
    const initialSpeed = useReaderStore.getState().speed;

    renderHook(() => useKeyboardShortcuts());

    act(() => {
      dispatchKeyEvent('BracketRight', ']');
    });

    expect(useReaderStore.getState().speed).toBeGreaterThan(initialSpeed);
  });

  it('does not trigger shortcuts when disabled', () => {
    const { result } = renderHook(() => useKeyboardShortcuts({ enabled: false }));

    expect(useReaderStore.getState().isPlaying).toBe(false);

    act(() => {
      dispatchKeyEvent('Space', ' ');
    });

    expect(useReaderStore.getState().isPlaying).toBe(false);
    expect(result.current.isEnabled).toBe(false);
  });

  it('calls onShortcutTriggered callback', () => {
    const onShortcutTriggered = vi.fn();

    renderHook(() => useKeyboardShortcuts({ onShortcutTriggered }));

    act(() => {
      dispatchKeyEvent('Space', ' ');
    });

    expect(onShortcutTriggered).toHaveBeenCalledWith('Space', 'Play/Pause');
  });

  it('ignores keydown events on input elements', () => {
    renderHook(() => useKeyboardShortcuts());

    // Create an input element and dispatch event on it
    const input = document.createElement('input');
    document.body.appendChild(input);

    const event = new KeyboardEvent('keydown', {
      code: 'Space',
      key: ' ',
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: input });

    expect(useReaderStore.getState().isPlaying).toBe(false);

    act(() => {
      input.dispatchEvent(event);
    });

    // Should still be false because input was focused
    expect(useReaderStore.getState().isPlaying).toBe(false);

    document.body.removeChild(input);
  });

  it('uses custom skipWordCount', () => {
    const words = Array.from({ length: 50 }, (_, i) => `word${i}`);
    useReaderStore.getState().setWords(words);
    useReaderStore.getState().setCurrentWordIndex(25);
    useReaderStore.getState().play();

    renderHook(() => useKeyboardShortcuts({ skipWordCount: 5 }));

    act(() => {
      dispatchKeyEvent('ArrowLeft');
    });

    expect(useReaderStore.getState().currentWordIndex).toBe(20);
  });
});
