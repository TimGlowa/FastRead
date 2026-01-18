'use client';

import { useEffect, useCallback, useRef, useMemo, useState } from 'react';

import { useReaderStore } from '@/stores';

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
}

export interface UseKeyboardShortcutsOptions {
  /** Whether keyboard shortcuts are enabled */
  enabled?: boolean;
  /** Custom skip word count for arrow keys */
  skipWordCount?: number;
  /** Callback when a shortcut is triggered */
  onShortcutTriggered?: (key: string, description: string) => void;
}

export interface UseKeyboardShortcutsReturn {
  /** List of all available shortcuts */
  shortcuts: KeyboardShortcut[];
  /** Whether shortcuts are currently enabled */
  isEnabled: boolean;
  /** Enable keyboard shortcuts */
  enable: () => void;
  /** Disable keyboard shortcuts */
  disable: () => void;
}

/**
 * Hook for handling keyboard shortcuts in the RSVP reader
 *
 * Shortcuts:
 * - Space: Play/Pause
 * - Left Arrow: Previous word (when paused) or skip back 10 words (when playing)
 * - Right Arrow: Next word (when paused) or skip forward 10 words (when playing)
 * - Up Arrow: Increase speed
 * - Down Arrow: Decrease speed
 * - Home: Go to start
 * - End: Go to end
 * - Escape: Pause
 * - R: Reset to start
 * - [ : Decrease speed
 * - ] : Increase speed
 */
export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions = {}
): UseKeyboardShortcutsReturn {
  const { enabled = true, skipWordCount = 10, onShortcutTriggered } = options;

  const enabledRef = useRef(enabled);
  // Track enabled state for return value
  const [isEnabledState, setIsEnabledState] = useState(enabled);

  // Keep ref in sync with prop changes
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Get store actions
  const togglePlayPause = useReaderStore((state) => state.togglePlayPause);
  const pause = useReaderStore((state) => state.pause);
  const nextWord = useReaderStore((state) => state.nextWord);
  const previousWord = useReaderStore((state) => state.previousWord);
  const skipForward = useReaderStore((state) => state.skipForward);
  const skipBackward = useReaderStore((state) => state.skipBackward);
  const goToStart = useReaderStore((state) => state.goToStart);
  const goToEnd = useReaderStore((state) => state.goToEnd);
  const increaseSpeed = useReaderStore((state) => state.increaseSpeed);
  const decreaseSpeed = useReaderStore((state) => state.decreaseSpeed);
  const isPlaying = useReaderStore((state) => state.isPlaying);

  // Memoize shortcuts to prevent recreating on every render
  const shortcuts = useMemo<KeyboardShortcut[]>(
    () => [
      {
        key: 'Space',
        description: 'Play/Pause',
        action: togglePlayPause,
      },
      {
        key: 'ArrowLeft',
        description: isPlaying ? `Skip back ${skipWordCount} words` : 'Previous word',
        action: () => (isPlaying ? skipBackward(skipWordCount) : previousWord()),
      },
      {
        key: 'ArrowRight',
        description: isPlaying ? `Skip forward ${skipWordCount} words` : 'Next word',
        action: () => (isPlaying ? skipForward(skipWordCount) : nextWord()),
      },
      {
        key: 'ArrowUp',
        description: 'Increase speed',
        action: increaseSpeed,
      },
      {
        key: 'ArrowDown',
        description: 'Decrease speed',
        action: decreaseSpeed,
      },
      {
        key: 'Home',
        description: 'Go to start',
        action: goToStart,
      },
      {
        key: 'End',
        description: 'Go to end',
        action: goToEnd,
      },
      {
        key: 'Escape',
        description: 'Pause',
        action: pause,
      },
      {
        key: 'r',
        description: 'Reset to start',
        action: () => {
          pause();
          goToStart();
        },
      },
      {
        key: '[',
        description: 'Decrease speed',
        action: decreaseSpeed,
      },
      {
        key: ']',
        description: 'Increase speed',
        action: increaseSpeed,
      },
    ],
    [
      togglePlayPause,
      isPlaying,
      skipWordCount,
      skipBackward,
      previousWord,
      skipForward,
      nextWord,
      increaseSpeed,
      decreaseSpeed,
      goToStart,
      goToEnd,
      pause,
    ]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabledRef.current) return;

      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Get current playing state from store
      const currentIsPlaying = useReaderStore.getState().isPlaying;

      // Find matching shortcut
      let shortcut: KeyboardShortcut | undefined;

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          shortcut = shortcuts.find((s) => s.key === 'Space');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          // Need to recalculate action based on current state
          if (currentIsPlaying) {
            skipBackward(skipWordCount);
            onShortcutTriggered?.('ArrowLeft', `Skip back ${skipWordCount} words`);
          } else {
            previousWord();
            onShortcutTriggered?.('ArrowLeft', 'Previous word');
          }
          return;
        case 'ArrowRight':
          event.preventDefault();
          if (currentIsPlaying) {
            skipForward(skipWordCount);
            onShortcutTriggered?.('ArrowRight', `Skip forward ${skipWordCount} words`);
          } else {
            nextWord();
            onShortcutTriggered?.('ArrowRight', 'Next word');
          }
          return;
        case 'ArrowUp':
          event.preventDefault();
          shortcut = shortcuts.find((s) => s.key === 'ArrowUp');
          break;
        case 'ArrowDown':
          event.preventDefault();
          shortcut = shortcuts.find((s) => s.key === 'ArrowDown');
          break;
        case 'Home':
          event.preventDefault();
          shortcut = shortcuts.find((s) => s.key === 'Home');
          break;
        case 'End':
          event.preventDefault();
          shortcut = shortcuts.find((s) => s.key === 'End');
          break;
        case 'Escape':
          shortcut = shortcuts.find((s) => s.key === 'Escape');
          break;
        default:
          // Check for key character
          if (event.key === 'r' || event.key === 'R') {
            shortcut = shortcuts.find((s) => s.key === 'r');
          } else if (event.key === '[') {
            shortcut = shortcuts.find((s) => s.key === '[');
          } else if (event.key === ']') {
            shortcut = shortcuts.find((s) => s.key === ']');
          }
      }

      if (shortcut) {
        shortcut.action();
        onShortcutTriggered?.(shortcut.key, shortcut.description);
      }
    },
    [
      skipWordCount,
      onShortcutTriggered,
      shortcuts,
      skipBackward,
      skipForward,
      previousWord,
      nextWord,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  const enable = useCallback(() => {
    enabledRef.current = true;
    setIsEnabledState(true);
  }, []);

  const disable = useCallback(() => {
    enabledRef.current = false;
    setIsEnabledState(false);
  }, []);

  return {
    shortcuts,
    isEnabled: isEnabledState,
    enable,
    disable,
  };
}

export default useKeyboardShortcuts;
