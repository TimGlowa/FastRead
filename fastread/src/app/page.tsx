'use client';

import { useEffect, useRef, useState } from 'react';

import { PDFUpload } from '@/components/pdf';
import { RSVPDisplay, ReaderControls } from '@/components/rsvp';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { useSpeedController } from '@/hooks/useSpeedController';
import { createTimingEngine, type TimingEngine } from '@/lib/rsvp/timing-engine';
import { useReaderStore } from '@/stores';

export default function Home() {
  const words = useReaderStore((state) => state.words);
  const currentWordIndex = useReaderStore((state) => state.currentWordIndex);
  const isPlaying = useReaderStore((state) => state.isPlaying);
  const speed = useReaderStore((state) => state.speed);
  const settings = useReaderStore((state) => state.settings);
  const document = useReaderStore((state) => state.document);
  const nextWord = useReaderStore((state) => state.nextWord);
  const pause = useReaderStore((state) => state.pause);

  const [showTranscript, setShowTranscript] = useState(false);

  const hasDocument = words.length > 0;
  const engineRef = useRef<TimingEngine | null>(null);

  // Enable keyboard shortcuts
  useKeyboardShortcuts({ enabled: hasDocument });

  // Enable touch gestures
  useTouchGestures({ enabled: hasDocument });

  // Speed controller hook
  const { onWordRead, start: startController, stop: stopController } = useSpeedController();

  // Timing engine for word progression
  useEffect(() => {
    if (!isPlaying || !hasDocument) {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
      stopController();
      return;
    }

    const engine = createTimingEngine({
      wpm: speed,
      pauseOnPunctuation: settings.pauseOnPunctuation,
      onTick: () => {
        const state = useReaderStore.getState();
        const currentWord = state.words[state.currentWordIndex] || '';
        const isSentenceEnd = /[.!?]["']?\s*$/.test(currentWord);

        // Notify speed controller about word read
        onWordRead(currentWord, isSentenceEnd);

        if (state.currentWordIndex >= state.words.length - 1) {
          pause();
        } else {
          nextWord();
        }
      },
      onComplete: pause,
    });

    engineRef.current = engine;
    engine.start();
    startController();

    return () => {
      engine.stop();
      engineRef.current = null;
      stopController();
    };
  }, [isPlaying, speed, settings.pauseOnPunctuation, hasDocument, nextWord, pause, onWordRead, startController, stopController]);

  // Update engine's current word when it changes for punctuation pauses
  useEffect(() => {
    if (engineRef.current && words[currentWordIndex]) {
      engineRef.current.setCurrentWord(words[currentWordIndex]);
    }
  }, [currentWordIndex, words]);

  // Update engine WPM when speed changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setWpm(speed);
    }
  }, [speed]);

  // Build journal citation display
  const journalCitation = document?.journalCitation || document?.title || null;

  return (
    <div className="min-h-screen bg-black flex flex-col" data-theme="dark">
      {/* Main content area */}
      <main className="flex-1 flex flex-col">
        {hasDocument ? (
          <>
            {/* Journal citation at top - discrete */}
            {journalCitation && (
              <div className="px-4 py-2 text-center">
                <span className="text-xs text-neutral-600 font-sans">
                  {journalCitation}
                </span>
              </div>
            )}

            {/* Reader display */}
            <RSVPDisplay className="flex-1" showPreview={true} showWPM={true} />

            {/* Controls */}
            <div className="bg-black border-t border-neutral-900 p-4">
              <ReaderControls onShowTranscript={() => setShowTranscript(true)} />
            </div>
          </>
        ) : (
          /* Upload state */
          <div className="flex-1 flex items-center justify-center p-8">
            <PDFUpload className="max-w-xl w-full" />
          </div>
        )}
      </main>

      {/* Transcript Modal */}
      {showTranscript && document && (
        <div
          className="fixed inset-0 bg-black/90 z-50 overflow-auto"
          onClick={() => setShowTranscript(false)}
        >
          <div
            className="max-w-4xl mx-auto p-8 min-h-screen"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg text-neutral-300 font-sans">
                  {document.title || 'Transcript'}
                </h2>
                {document.authors && document.authors.length > 0 && (
                  <p className="text-sm text-neutral-500 mt-1">
                    {document.authors.join(', ')}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowTranscript(false)}
                className="text-neutral-500 hover:text-neutral-300 transition-colors p-2"
                aria-label="Close transcript"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mb-6 text-xs text-neutral-600">
              <span>{words.length.toLocaleString()} words</span>
              <span>Position: {currentWordIndex + 1}/{words.length}</span>
              <span>~{Math.ceil(words.length / speed)} min at {speed} wpm</span>
            </div>

            {/* Transcript content */}
            <div className="text-neutral-400 font-sans text-sm leading-relaxed whitespace-pre-wrap">
              {document.cleanedText}
            </div>

            {/* Close button at bottom */}
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowTranscript(false)}
                className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors px-4 py-2 border border-neutral-800 rounded"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
