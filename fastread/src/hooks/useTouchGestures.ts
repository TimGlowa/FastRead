'use client';

import { useEffect, useCallback, useRef, useState } from 'react';

import { useReaderStore } from '@/stores';

export interface TouchGesture {
  type:
    | 'tap'
    | 'swipe-left'
    | 'swipe-right'
    | 'swipe-up'
    | 'swipe-down'
    | 'double-tap'
    | 'long-press';
  description: string;
}

export interface UseTouchGesturesOptions {
  /** Whether touch gestures are enabled */
  enabled?: boolean;
  /** Element ref to attach gestures to (defaults to document) */
  targetRef?: React.RefObject<HTMLElement>;
  /** Minimum distance for swipe detection in pixels */
  swipeThreshold?: number;
  /** Maximum time for swipe gesture in ms */
  swipeTimeLimit?: number;
  /** Time threshold for long press in ms */
  longPressThreshold?: number;
  /** Time threshold for double tap in ms */
  doubleTapThreshold?: number;
  /** Number of words to skip on swipe */
  skipWordCount?: number;
  /** Callback when a gesture is detected */
  onGesture?: (gesture: TouchGesture) => void;
}

export interface UseTouchGesturesReturn {
  /** List of available gestures */
  gestures: TouchGesture[];
  /** Whether gestures are enabled */
  isEnabled: boolean;
  /** Enable touch gestures */
  enable: () => void;
  /** Disable touch gestures */
  disable: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  isLongPress: boolean;
  longPressTimer: NodeJS.Timeout | null;
}

/**
 * Hook for handling touch gestures on mobile devices
 *
 * Gestures:
 * - Tap: Play/Pause
 * - Double Tap: Reset to start
 * - Swipe Left: Skip backward
 * - Swipe Right: Skip forward
 * - Swipe Up: Increase speed
 * - Swipe Down: Decrease speed
 * - Long Press: Show settings/help
 */
export function useTouchGestures(options: UseTouchGesturesOptions = {}): UseTouchGesturesReturn {
  const {
    enabled = true,
    targetRef,
    swipeThreshold = 50,
    swipeTimeLimit = 300,
    longPressThreshold = 500,
    doubleTapThreshold = 300,
    skipWordCount = 10,
    onGesture,
  } = options;

  const enabledRef = useRef(enabled);
  const [isEnabledState, setIsEnabledState] = useState(enabled);

  // Keep ref in sync with prop changes
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const touchStateRef = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isLongPress: false,
    longPressTimer: null,
  });

  const lastTapTimeRef = useRef<number>(0);

  // Get store actions
  const togglePlayPause = useReaderStore((state) => state.togglePlayPause);
  const pause = useReaderStore((state) => state.pause);
  const skipForward = useReaderStore((state) => state.skipForward);
  const skipBackward = useReaderStore((state) => state.skipBackward);
  const goToStart = useReaderStore((state) => state.goToStart);
  const increaseSpeed = useReaderStore((state) => state.increaseSpeed);
  const decreaseSpeed = useReaderStore((state) => state.decreaseSpeed);

  // Define gestures
  const gestures: TouchGesture[] = [
    { type: 'tap', description: 'Play / Pause' },
    { type: 'double-tap', description: 'Reset to start' },
    { type: 'swipe-left', description: 'Skip backward' },
    { type: 'swipe-right', description: 'Skip forward' },
    { type: 'swipe-up', description: 'Increase speed' },
    { type: 'swipe-down', description: 'Decrease speed' },
    { type: 'long-press', description: 'Pause reading' },
  ];

  const clearLongPressTimer = useCallback(() => {
    if (touchStateRef.current.longPressTimer) {
      clearTimeout(touchStateRef.current.longPressTimer);
      touchStateRef.current.longPressTimer = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!enabledRef.current) return;

      const touch = event.touches[0];
      touchStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isLongPress: false,
        longPressTimer: null,
      };

      // Set up long press detection
      touchStateRef.current.longPressTimer = setTimeout(() => {
        touchStateRef.current.isLongPress = true;
        pause();
        onGesture?.({ type: 'long-press', description: 'Pause reading' });
      }, longPressThreshold);
    },
    [longPressThreshold, pause, onGesture]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!enabledRef.current) return;

      const touch = event.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStateRef.current.startX);
      const deltaY = Math.abs(touch.clientY - touchStateRef.current.startY);

      // Cancel long press if user moves finger
      if (deltaX > 10 || deltaY > 10) {
        clearLongPressTimer();
      }
    },
    [clearLongPressTimer]
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!enabledRef.current) return;

      clearLongPressTimer();

      // Ignore if long press was triggered
      if (touchStateRef.current.isLongPress) {
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStateRef.current.startX;
      const deltaY = touch.clientY - touchStateRef.current.startY;
      const deltaTime = Date.now() - touchStateRef.current.startTime;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Check for swipe gesture
      if (
        deltaTime < swipeTimeLimit &&
        (absDeltaX > swipeThreshold || absDeltaY > swipeThreshold)
      ) {
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > 0) {
            // Swipe right - skip forward
            skipForward(skipWordCount);
            onGesture?.({ type: 'swipe-right', description: 'Skip forward' });
          } else {
            // Swipe left - skip backward
            skipBackward(skipWordCount);
            onGesture?.({ type: 'swipe-left', description: 'Skip backward' });
          }
        } else {
          // Vertical swipe
          if (deltaY < 0) {
            // Swipe up - increase speed
            increaseSpeed();
            onGesture?.({ type: 'swipe-up', description: 'Increase speed' });
          } else {
            // Swipe down - decrease speed
            decreaseSpeed();
            onGesture?.({ type: 'swipe-down', description: 'Decrease speed' });
          }
        }
        return;
      }

      // Check for tap gesture (no significant movement)
      if (absDeltaX < 10 && absDeltaY < 10) {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTimeRef.current;

        if (timeSinceLastTap < doubleTapThreshold) {
          // Double tap - reset to start
          pause();
          goToStart();
          onGesture?.({ type: 'double-tap', description: 'Reset to start' });
          lastTapTimeRef.current = 0; // Reset to prevent triple tap
        } else {
          // Single tap - play/pause
          lastTapTimeRef.current = now;
          // Use setTimeout to allow for double tap detection
          setTimeout(() => {
            if (Date.now() - lastTapTimeRef.current >= doubleTapThreshold) {
              togglePlayPause();
              onGesture?.({ type: 'tap', description: 'Play / Pause' });
            }
          }, doubleTapThreshold);
        }
      }
    },
    [
      clearLongPressTimer,
      swipeThreshold,
      swipeTimeLimit,
      doubleTapThreshold,
      skipWordCount,
      skipForward,
      skipBackward,
      increaseSpeed,
      decreaseSpeed,
      togglePlayPause,
      pause,
      goToStart,
      onGesture,
    ]
  );

  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer();
    touchStateRef.current.isLongPress = false;
  }, [clearLongPressTimer]);

  useEffect(() => {
    if (!enabled) return;

    const target = targetRef?.current || document;

    target.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    target.addEventListener('touchmove', handleTouchMove as EventListener, { passive: true });
    target.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });
    target.addEventListener('touchcancel', handleTouchCancel as EventListener);

    return () => {
      clearLongPressTimer();
      target.removeEventListener('touchstart', handleTouchStart as EventListener);
      target.removeEventListener('touchmove', handleTouchMove as EventListener);
      target.removeEventListener('touchend', handleTouchEnd as EventListener);
      target.removeEventListener('touchcancel', handleTouchCancel as EventListener);
    };
  }, [
    enabled,
    targetRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
    clearLongPressTimer,
  ]);

  const enable = useCallback(() => {
    enabledRef.current = true;
    setIsEnabledState(true);
  }, []);

  const disable = useCallback(() => {
    enabledRef.current = false;
    setIsEnabledState(false);
  }, []);

  return {
    gestures,
    isEnabled: isEnabledState,
    enable,
    disable,
  };
}

export default useTouchGestures;
