/**
 * Strain Detector
 *
 * Monitors user behavior to detect reading strain in Training mode.
 * Triggers cooldown when user shows signs of difficulty:
 * - Pauses for > 3 seconds
 * - Rewinds > 20 words
 */

export interface StrainDetectorConfig {
  /** Pause duration threshold (ms) - default 3000 */
  pauseThresholdMs: number;
  /** Rewind word count threshold - default 20 */
  rewindThresholdWords: number;
}

export interface StrainDetectorCallbacks {
  /** Called when strain is detected */
  onStrainDetected: (reason: StrainReason) => void;
}

export type StrainReason = 'pause' | 'rewind';

export class StrainDetector {
  private config: StrainDetectorConfig;
  private callbacks: StrainDetectorCallbacks;
  private enabled: boolean = false;

  constructor(config: StrainDetectorConfig, callbacks: StrainDetectorCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  // ============================================================================
  // Control
  // ============================================================================

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Called when user pauses playback
   * @param durationMs How long the user paused
   */
  onUserPause(durationMs: number): boolean {
    if (!this.enabled) return false;

    if (durationMs >= this.config.pauseThresholdMs) {
      this.callbacks.onStrainDetected('pause');
      return true;
    }

    return false;
  }

  /**
   * Called when user rewinds
   * @param wordCount How many words the user rewound
   */
  onUserRewind(wordCount: number): boolean {
    if (!this.enabled) return false;

    if (wordCount >= this.config.rewindThresholdWords) {
      this.callbacks.onStrainDetected('rewind');
      return true;
    }

    return false;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  updateConfig(config: Partial<StrainDetectorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): Readonly<StrainDetectorConfig> {
    return { ...this.config };
  }
}

/**
 * Factory function
 */
export function createStrainDetector(
  config: StrainDetectorConfig,
  callbacks: StrainDetectorCallbacks
): StrainDetector {
  return new StrainDetector(config, callbacks);
}
