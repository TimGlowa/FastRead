'use client';

import { useEffect, useRef } from 'react';

import { PDFUpload } from '@/components/pdf';
import { RSVPDisplay, ReaderControls } from '@/components/rsvp';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { createTimingEngine, type TimingEngine } from '@/lib/rsvp/timing-engine';
import { useReaderStore } from '@/stores';

export default function Home() {
  const words = useReaderStore((state) => state.words);
  const currentWordIndex = useReaderStore((state) => state.currentWordIndex);
  const isPlaying = useReaderStore((state) => state.isPlaying);
  const speed = useReaderStore((state) => state.speed);
  const settings = useReaderStore((state) => state.settings);
  const nextWord = useReaderStore((state) => state.nextWord);
  const pause = useReaderStore((state) => state.pause);

  const hasDocument = words.length > 0;
  const engineRef = useRef<TimingEngine | null>(null);

  // Enable keyboard shortcuts
  useKeyboardShortcuts({ enabled: hasDocument });

  // Enable touch gestures
  useTouchGestures({ enabled: hasDocument });

  // Timing engine for word progression
  useEffect(() => {
    if (!isPlaying || !hasDocument) {
      if (engineRef.current) {
        engineRef.current.stop();
        engineRef.current = null;
      }
      return;
    }

    const engine = createTimingEngine({
      wpm: speed,
      pauseOnPunctuation: settings.pauseOnPunctuation,
      onTick: () => {
        const state = useReaderStore.getState();
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

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, [isPlaying, speed, settings.pauseOnPunctuation, hasDocument, nextWord, pause]);

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

  return (
    <div className="min-h-screen bg-black flex flex-col" data-theme="dark">
      {/* Main content area */}
      <main className="flex-1 flex flex-col">
        {hasDocument ? (
          <>
            {/* Reader display */}
            <RSVPDisplay className="flex-1" showPreview={true} showWPM={true} />

            {/* Controls */}
            <div className="bg-black border-t border-gray-800 p-6">
              <ReaderControls />
            </div>
          </>
        ) : (
          /* Upload state */
          <div className="flex-1 flex items-center justify-center p-8">
            <PDFUpload className="max-w-xl w-full" />
          </div>
        )}
      </main>
    </div>
  );
}
