import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  TimingEngine,
  createTimingEngine,
  wpmToMs,
  getPunctuationPause,
  isParagraphBreak,
  getWordDisplayTime,
  DEFAULT_PUNCTUATION_PAUSES,
} from './timing-engine';

describe('wpmToMs', () => {
  it('converts 300 WPM to 200ms', () => {
    expect(wpmToMs(300)).toBe(200);
  });

  it('converts 100 WPM to 600ms', () => {
    expect(wpmToMs(100)).toBe(600);
  });

  it('converts 600 WPM to 100ms', () => {
    expect(wpmToMs(600)).toBe(100);
  });

  it('converts 1000 WPM to 60ms', () => {
    expect(wpmToMs(1000)).toBe(60);
  });
});

describe('getPunctuationPause', () => {
  it('returns 50ms for comma', () => {
    expect(getPunctuationPause('word,')).toBe(50);
  });

  it('returns 100ms for semicolon', () => {
    expect(getPunctuationPause('word;')).toBe(100);
  });

  it('returns 100ms for colon', () => {
    expect(getPunctuationPause('word:')).toBe(100);
  });

  it('returns 150ms for period', () => {
    expect(getPunctuationPause('word.')).toBe(150);
  });

  it('returns 150ms for question mark', () => {
    expect(getPunctuationPause('word?')).toBe(150);
  });

  it('returns 150ms for exclamation mark', () => {
    expect(getPunctuationPause('word!')).toBe(150);
  });

  it('returns 0 for no punctuation', () => {
    expect(getPunctuationPause('word')).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(getPunctuationPause('')).toBe(0);
  });

  it('uses custom pauses when provided', () => {
    const customPauses = {
      ...DEFAULT_PUNCTUATION_PAUSES,
      comma: 100,
    };
    expect(getPunctuationPause('word,', customPauses)).toBe(100);
  });
});

describe('isParagraphBreak', () => {
  it('returns true for double newline', () => {
    expect(isParagraphBreak('\n\n')).toBe(true);
  });

  it('returns true for pilcrow symbol', () => {
    expect(isParagraphBreak('¶')).toBe(true);
  });

  it('returns true for [PARA] token', () => {
    expect(isParagraphBreak('[PARA]')).toBe(true);
  });

  it('returns false for regular word', () => {
    expect(isParagraphBreak('word')).toBe(false);
  });

  it('returns false for single newline', () => {
    expect(isParagraphBreak('\n')).toBe(false);
  });
});

describe('getWordDisplayTime', () => {
  it('returns base time when punctuation pause disabled', () => {
    expect(getWordDisplayTime('word,', 300, false)).toBe(200);
  });

  it('adds punctuation pause when enabled', () => {
    expect(getWordDisplayTime('word,', 300, true)).toBe(250); // 200 + 50
  });

  it('adds period pause when enabled', () => {
    expect(getWordDisplayTime('end.', 300, true)).toBe(350); // 200 + 150
  });

  it('adds paragraph pause for paragraph breaks', () => {
    expect(getWordDisplayTime('\n\n', 300, true)).toBe(500); // 200 + 300
  });

  it('returns base time for word without punctuation', () => {
    expect(getWordDisplayTime('word', 300, true)).toBe(200);
  });
});

describe('TimingEngine', () => {
  let mockOnTick: () => void;
  let mockOnComplete: () => void;
  let engine: TimingEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnTick = vi.fn() as unknown as () => void;
    mockOnComplete = vi.fn() as unknown as () => void;

    // Mock requestAnimationFrame
    let frameId = 0;
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        frameId++;
        setTimeout(() => callback(performance.now()), 16); // ~60fps
        return frameId;
      })
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    engine = createTimingEngine({
      wpm: 300,
      pauseOnPunctuation: true,
      onTick: mockOnTick,
      onComplete: mockOnComplete,
    });
  });

  afterEach(() => {
    engine.stop();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('creates engine with correct initial state', () => {
    expect(engine.getIsRunning()).toBe(false);
    expect(engine.getWpm()).toBe(300);
  });

  it('starts the timing loop', () => {
    engine.start();
    expect(engine.getIsRunning()).toBe(true);
    expect(requestAnimationFrame).toHaveBeenCalled();
  });

  it('stops the timing loop', () => {
    engine.start();
    engine.stop();
    expect(engine.getIsRunning()).toBe(false);
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('does not start twice', () => {
    engine.start();
    engine.start();
    // Should only have one RAF call from first start
    expect(engine.getIsRunning()).toBe(true);
  });

  it('updates WPM', () => {
    engine.setWpm(500);
    expect(engine.getWpm()).toBe(500);
  });

  it('calls onTick after interval elapses', () => {
    engine.start();

    // Advance time past the 200ms interval (300 WPM)
    vi.advanceTimersByTime(250);

    expect(mockOnTick).toHaveBeenCalled();
  });

  it('calls onComplete when complete is called', () => {
    engine.start();
    engine.complete();

    expect(mockOnComplete).toHaveBeenCalled();
    expect(engine.getIsRunning()).toBe(false);
  });

  it('respects punctuation pause for current word', () => {
    engine.setCurrentWord('word.');
    engine.start();

    // Base interval is 200ms, plus 150ms for period = 350ms
    // After 200ms, should not have ticked yet
    vi.advanceTimersByTime(250);
    expect(mockOnTick).not.toHaveBeenCalled();

    // After 350ms, should have ticked
    vi.advanceTimersByTime(150);
    expect(mockOnTick).toHaveBeenCalled();
  });
});

describe('createTimingEngine', () => {
  it('creates a TimingEngine instance', () => {
    const engine = createTimingEngine({
      wpm: 300,
      pauseOnPunctuation: true,
      onTick: () => {},
    });

    expect(engine).toBeInstanceOf(TimingEngine);
  });

  it('accepts custom punctuation pauses', () => {
    const customPauses = {
      ...DEFAULT_PUNCTUATION_PAUSES,
      period: 500,
    };

    const engine = createTimingEngine(
      {
        wpm: 300,
        pauseOnPunctuation: true,
        onTick: () => {},
      },
      customPauses
    );

    expect(engine).toBeInstanceOf(TimingEngine);
  });
});
