/**
 * RSVP Timing Engine
 *
 * Uses requestAnimationFrame for precise word timing with ±10ms accuracy.
 * Supports punctuation-based pauses for natural reading rhythm.
 */

export interface TimingEngineConfig {
  /** Words per minute (100-1000) */
  wpm: number;
  /** Enable punctuation-based pauses */
  pauseOnPunctuation: boolean;
  /** Callback when next word should be displayed */
  onTick: () => void;
  /** Callback when playback completes */
  onComplete?: () => void;
}

export interface PunctuationPauses {
  comma: number;
  semicolon: number;
  colon: number;
  period: number;
  question: number;
  exclamation: number;
  paragraph: number;
}

/**
 * Default punctuation pause durations in milliseconds
 * Based on spec: comma +50ms, semicolon/colon +100ms, period/question/exclamation +150ms, paragraph +300ms
 */
export const DEFAULT_PUNCTUATION_PAUSES: PunctuationPauses = {
  comma: 50,
  semicolon: 100,
  colon: 100,
  period: 150,
  question: 150,
  exclamation: 150,
  paragraph: 300,
};

/**
 * Calculate the base interval between words in milliseconds from WPM
 */
export function wpmToMs(wpm: number): number {
  // WPM = words per minute, so ms per word = 60000 / WPM
  return Math.round(60000 / wpm);
}

/**
 * Calculate additional pause time based on word's ending punctuation
 */
export function getPunctuationPause(
  word: string,
  pauses: PunctuationPauses = DEFAULT_PUNCTUATION_PAUSES
): number {
  if (!word || word.length === 0) return 0;

  const lastChar = word[word.length - 1];

  switch (lastChar) {
    case ',':
      return pauses.comma;
    case ';':
      return pauses.semicolon;
    case ':':
      return pauses.colon;
    case '.':
      return pauses.period;
    case '?':
      return pauses.question;
    case '!':
      return pauses.exclamation;
    default:
      return 0;
  }
}

/**
 * Check if a word represents a paragraph break
 * (typically indicated by special token or multiple newlines)
 */
export function isParagraphBreak(word: string): boolean {
  return word === '\n\n' || word === '¶' || word === '[PARA]';
}

/**
 * Calculate total display time for a word including punctuation pause
 */
export function getWordDisplayTime(
  word: string,
  wpm: number,
  pauseOnPunctuation: boolean,
  pauses: PunctuationPauses = DEFAULT_PUNCTUATION_PAUSES
): number {
  const baseTime = wpmToMs(wpm);

  if (!pauseOnPunctuation) {
    return baseTime;
  }

  if (isParagraphBreak(word)) {
    return baseTime + pauses.paragraph;
  }

  return baseTime + getPunctuationPause(word, pauses);
}

export class TimingEngine {
  private config: TimingEngineConfig;
  private rafId: number | null = null;
  private lastTickTime: number = 0;
  private accumulatedTime: number = 0;
  private currentWord: string = '';
  private isRunning: boolean = false;
  private pauses: PunctuationPauses;

  constructor(config: TimingEngineConfig, pauses: PunctuationPauses = DEFAULT_PUNCTUATION_PAUSES) {
    this.config = config;
    this.pauses = pauses;
  }

  /**
   * Start the timing loop
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTickTime = performance.now();
    this.accumulatedTime = 0;
    this.scheduleNextFrame();
  }

  /**
   * Stop the timing loop
   */
  stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Update WPM while running
   */
  setWpm(wpm: number): void {
    this.config.wpm = wpm;
  }

  /**
   * Update the current word (for punctuation pause calculation)
   */
  setCurrentWord(word: string): void {
    this.currentWord = word;
  }

  /**
   * Check if engine is currently running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get current WPM setting
   */
  getWpm(): number {
    return this.config.wpm;
  }

  /**
   * Signal that playback has completed (end of document)
   */
  complete(): void {
    this.stop();
    this.config.onComplete?.();
  }

  private scheduleNextFrame(): void {
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  private tick(currentTime: number): void {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTickTime;
    this.lastTickTime = currentTime;
    this.accumulatedTime += deltaTime;

    const targetInterval = getWordDisplayTime(
      this.currentWord,
      this.config.wpm,
      this.config.pauseOnPunctuation,
      this.pauses
    );

    if (this.accumulatedTime >= targetInterval) {
      // Reset accumulated time, keeping any overflow for precision
      this.accumulatedTime -= targetInterval;

      // Trigger the tick callback
      this.config.onTick();
    }

    // Schedule next frame
    this.scheduleNextFrame();
  }
}

/**
 * Create a timing engine instance
 */
export function createTimingEngine(
  config: TimingEngineConfig,
  pauses?: PunctuationPauses
): TimingEngine {
  return new TimingEngine(config, pauses);
}
