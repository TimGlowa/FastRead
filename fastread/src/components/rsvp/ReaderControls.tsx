'use client';

import { useCallback, useEffect, useState } from 'react';

import { useReaderStore } from '@/stores';
import { SpeedModeIndicator } from './SpeedModeIndicator';

export interface ReaderControlsProps {
  className?: string;
  skipAmount?: number;
  onShowTranscript?: () => void;
}

export function ReaderControls({
  className = '',
  skipAmount = 10,
  onShowTranscript,
}: ReaderControlsProps) {
  const isPlaying = useReaderStore((state) => state.isPlaying);
  const speed = useReaderStore((state) => state.speed);
  const words = useReaderStore((state) => state.words);
  const speedControlMode = useReaderStore((state) => state.speedControlMode);
  const rampPhase = useReaderStore((state) => state.rampPhase);
  const isRamping = useReaderStore((state) => state.isRamping);
  const isRampPaused = useReaderStore((state) => state.isRampPaused);
  const togglePlayPause = useReaderStore((state) => state.togglePlayPause);
  const increaseSpeed = useReaderStore((state) => state.increaseSpeed);
  const decreaseSpeed = useReaderStore((state) => state.decreaseSpeed);
  const pause = useReaderStore((state) => state.pause);
  const skipForward = useReaderStore((state) => state.skipForward);
  const skipBackward = useReaderStore((state) => state.skipBackward);
  const goToStart = useReaderStore((state) => state.goToStart);

  // Track when ramp starts for blinking animation
  const [isBlinking, setIsBlinking] = useState(false);
  const [prevIsRamping, setPrevIsRamping] = useState(false);

  // Trigger blink animation when ramp starts
  useEffect(() => {
    if (isRamping && !prevIsRamping && !isRampPaused) {
      setIsBlinking(true);
      // Stop blinking after 3 blinks (1.5 seconds at 500ms per blink)
      const timer = setTimeout(() => {
        setIsBlinking(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
    setPrevIsRamping(isRamping);
  }, [isRamping, prevIsRamping, isRampPaused]);

  // Also blink when resuming ramp
  useEffect(() => {
    if (isRamping && !isRampPaused) {
      setIsBlinking(true);
      const timer = setTimeout(() => {
        setIsBlinking(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isRampPaused, isRamping]);

  const hasWords = words.length > 0;

  // Pause-on-change: Speed changes pause playback
  const handleIncreaseSpeed = useCallback(() => {
    if (isPlaying) {
      pause();
    }
    increaseSpeed();
  }, [isPlaying, pause, increaseSpeed]);

  const handleDecreaseSpeed = useCallback(() => {
    if (isPlaying) {
      pause();
    }
    decreaseSpeed();
  }, [isPlaying, pause, decreaseSpeed]);

  // Discrete button style - muted colors, no bold backgrounds
  const discreteButtonClass =
    'min-w-[40px] min-h-[40px] p-2 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors';

  // Play button - slightly more visible but still discrete
  const playButtonClass =
    'min-w-[48px] min-h-[48px] p-2.5 rounded-full border border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors';

  // Determine if speed display should be hidden (demo mode while ramping)
  const hideSpeedDisplay = speedControlMode === 'demo' && isPlaying && rampPhase !== 'idle';

  // Determine if we should show the ramp arrow
  const showRampArrow =
    speedControlMode !== 'fixed' &&
    isRamping &&
    !isRampPaused &&
    rampPhase !== 'idle' &&
    rampPhase !== 'plateau';

  return (
    <div
      className={`flex flex-col items-center gap-3 ${className}`}
      role="group"
      aria-label="Reader controls"
    >
      {/* Speed display with ramp indicator */}
      <div
        className={`text-center transition-opacity ${hideSpeedDisplay ? 'opacity-20' : ''}`}
        aria-live="polite"
      >
        <span
          className="text-xl font-mono text-neutral-500"
          data-testid="speed-display"
        >
          {speed}
        </span>
        <span className="text-xs text-neutral-600 ml-1 uppercase tracking-wide">wpm</span>
        {/* Ramp indicator arrow - shows when ramping, hidden when paused or at plateau */}
        {speedControlMode !== 'fixed' && (
          <span
            className={`inline-block ml-1.5 text-neutral-500 transition-opacity ${
              showRampArrow ? 'opacity-100' : 'opacity-0'
            } ${isBlinking ? 'animate-blink' : ''}`}
            title={isRampPaused ? 'Ramp paused (press space to resume)' : 'Speed increasing'}
            aria-label={showRampArrow ? 'Speed increasing' : 'Speed holding'}
          >
            <svg
              className="inline w-3 h-3"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9V3M3 5l3-3 3 3" />
            </svg>
          </span>
        )}
      </div>

      {/* Main controls row - all discrete styling */}
      <div className="flex items-center gap-1">
        {/* Skip backward */}
        <button
          type="button"
          onClick={() => skipBackward(skipAmount)}
          disabled={!hasWords}
          className={discreteButtonClass}
          aria-label={`Skip back ${skipAmount} words`}
          data-testid="skip-back-btn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path d="M9.195 18.44c1.25.713 2.805-.19 2.805-1.629V7.189c0-1.439-1.555-2.342-2.805-1.629L2.89 9.37a1.875 1.875 0 000 3.26l6.305 3.81zm8.305 0c1.25.713 2.805-.19 2.805-1.629V7.189c0-1.439-1.555-2.342-2.805-1.629L11.39 9.37a1.875 1.875 0 000 3.26l6.11 3.81z" />
          </svg>
        </button>

        {/* Decrease speed */}
        <button
          type="button"
          onClick={handleDecreaseSpeed}
          className={discreteButtonClass}
          aria-label="Decrease speed (pauses reading)"
          data-testid="decrease-speed-btn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M5 12h14" />
          </svg>
        </button>

        {/* Play/Pause - discrete border style */}
        <button
          type="button"
          onClick={togglePlayPause}
          disabled={!hasWords}
          className={playButtonClass}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          data-testid="play-pause-btn"
        >
          {isPlaying ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Increase speed */}
        <button
          type="button"
          onClick={handleIncreaseSpeed}
          className={discreteButtonClass}
          aria-label="Increase speed (pauses reading)"
          data-testid="increase-speed-btn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
        </button>

        {/* Skip forward */}
        <button
          type="button"
          onClick={() => skipForward(skipAmount)}
          disabled={!hasWords}
          className={discreteButtonClass}
          aria-label={`Skip forward ${skipAmount} words`}
          data-testid="skip-forward-btn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <path d="M5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v6.621c0 1.44 1.555 2.342 2.805 1.629L11.36 13.13a1.875 1.875 0 000-3.26L5.055 7.06zm8.305 0c-1.25-.713-2.805.19-2.805 1.63v6.621c0 1.44 1.555 2.342 2.805 1.629l6.305-3.81a1.875 1.875 0 000-3.26L13.36 7.06z" />
          </svg>
        </button>
      </div>

      {/* Secondary row - reset and speed mode indicator */}
      <div className="flex items-center gap-4">
        {/* Reset to start */}
        <button
          type="button"
          onClick={goToStart}
          disabled={!hasWords}
          className="text-xs text-neutral-600 hover:text-neutral-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Go to start"
          data-testid="go-to-start-btn"
        >
          Reset
        </button>

        {/* Speed Mode Indicator - very discrete */}
        <SpeedModeIndicator />

        {/* Transcript button */}
        {onShowTranscript && (
          <button
            type="button"
            onClick={onShowTranscript}
            className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
            aria-label="Show transcript"
            data-testid="transcript-btn"
          >
            Transcript
          </button>
        )}
      </div>
    </div>
  );
}

export default ReaderControls;
