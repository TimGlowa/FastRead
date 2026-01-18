'use client';

import { useReaderStore } from '@/stores';

export interface ReaderControlsProps {
  className?: string;
  skipAmount?: number;
}

export function ReaderControls({ className = '', skipAmount = 10 }: ReaderControlsProps) {
  const isPlaying = useReaderStore((state) => state.isPlaying);
  const speed = useReaderStore((state) => state.speed);
  const words = useReaderStore((state) => state.words);
  const togglePlayPause = useReaderStore((state) => state.togglePlayPause);
  const increaseSpeed = useReaderStore((state) => state.increaseSpeed);
  const decreaseSpeed = useReaderStore((state) => state.decreaseSpeed);
  const skipForward = useReaderStore((state) => state.skipForward);
  const skipBackward = useReaderStore((state) => state.skipBackward);
  const goToStart = useReaderStore((state) => state.goToStart);

  const hasWords = words.length > 0;

  return (
    <div
      className={`flex flex-col items-center gap-4 ${className}`}
      role="group"
      aria-label="Reader controls"
    >
      {/* Speed display */}
      <div className="text-center" aria-live="polite">
        <span className="text-2xl font-mono text-text-primary" data-testid="speed-display">
          {speed}
        </span>
        <span className="text-sm text-text-secondary ml-1">WPM</span>
      </div>

      {/* Main controls row */}
      <div className="flex items-center gap-2">
        {/* Skip backward */}
        <button
          type="button"
          onClick={() => skipBackward(skipAmount)}
          disabled={!hasWords}
          className="min-w-[44px] min-h-[44px] p-2 rounded-lg bg-surface text-text-primary hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed btn-press transition-colors"
          aria-label={`Skip back ${skipAmount} words`}
          data-testid="skip-back-btn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
            aria-hidden="true"
          >
            <path d="M9.195 18.44c1.25.713 2.805-.19 2.805-1.629V7.189c0-1.439-1.555-2.342-2.805-1.629L2.89 9.37a1.875 1.875 0 000 3.26l6.305 3.81zm8.305 0c1.25.713 2.805-.19 2.805-1.629V7.189c0-1.439-1.555-2.342-2.805-1.629L11.39 9.37a1.875 1.875 0 000 3.26l6.11 3.81z" />
          </svg>
        </button>

        {/* Decrease speed */}
        <button
          type="button"
          onClick={decreaseSpeed}
          className="min-w-[44px] min-h-[44px] p-2 rounded-lg bg-surface text-text-primary hover:bg-accent/20 btn-press transition-colors"
          aria-label="Decrease speed"
          data-testid="decrease-speed-btn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm3 10.5a.75.75 0 000-1.5H9a.75.75 0 000 1.5h6z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          type="button"
          onClick={togglePlayPause}
          disabled={!hasWords}
          className="min-w-[56px] min-h-[56px] p-3 rounded-full bg-accent text-white hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed btn-press transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          data-testid="play-pause-btn"
        >
          {isPlaying ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8"
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
              className="w-8 h-8"
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
          onClick={increaseSpeed}
          className="min-w-[44px] min-h-[44px] p-2 rounded-lg bg-surface text-text-primary hover:bg-accent/20 btn-press transition-colors"
          aria-label="Increase speed"
          data-testid="increase-speed-btn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 9a.75.75 0 00-1.5 0v2.25H9a.75.75 0 000 1.5h2.25V15a.75.75 0 001.5 0v-2.25H15a.75.75 0 000-1.5h-2.25V9z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Skip forward */}
        <button
          type="button"
          onClick={() => skipForward(skipAmount)}
          disabled={!hasWords}
          className="min-w-[44px] min-h-[44px] p-2 rounded-lg bg-surface text-text-primary hover:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed btn-press transition-colors"
          aria-label={`Skip forward ${skipAmount} words`}
          data-testid="skip-forward-btn"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
            aria-hidden="true"
          >
            <path d="M5.055 7.06C3.805 6.347 2.25 7.25 2.25 8.69v6.621c0 1.44 1.555 2.342 2.805 1.629L11.36 13.13a1.875 1.875 0 000-3.26L5.055 7.06zm8.305 0c-1.25-.713-2.805.19-2.805 1.63v6.621c0 1.44 1.555 2.342 2.805 1.629l6.305-3.81a1.875 1.875 0 000-3.26L13.36 7.06z" />
          </svg>
        </button>
      </div>

      {/* Reset to start */}
      <button
        type="button"
        onClick={goToStart}
        disabled={!hasWords}
        className="text-sm text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Go to start"
        data-testid="go-to-start-btn"
      >
        Reset to start
      </button>
    </div>
  );
}

export default ReaderControls;
