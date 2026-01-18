/**
 * Auto-Speed Increase Service
 *
 * Automatically increases reading speed as the user progresses through text.
 * Helps users gradually build up reading speed while maintaining comprehension.
 */

import type { AutoSpeedSettings } from '@/types';

export const DEFAULT_AUTO_SPEED_SETTINGS: AutoSpeedSettings = {
  enabled: false,
  increaseEveryWords: 100,
  increaseAmount: 25, // WPM
  maxSpeed: 600,
};

export interface AutoSpeedState {
  /** Words read since last speed increase */
  wordsSinceIncrease: number;
  /** Total words read in session */
  totalWordsRead: number;
  /** Number of speed increases applied */
  increasesApplied: number;
  /** Current calculated speed (base + increases) */
  currentSpeed: number;
  /** Base speed before any auto increases */
  baseSpeed: number;
}

export interface AutoSpeedCallbacks {
  /** Called when speed should be increased */
  onSpeedIncrease: (newSpeed: number, increasesApplied: number) => void;
  /** Called when max speed is reached */
  onMaxSpeedReached?: () => void;
}

/**
 * AutoSpeed controller class
 * Tracks word progression and triggers speed increases at configured intervals
 */
export class AutoSpeedController {
  private settings: AutoSpeedSettings;
  private callbacks: AutoSpeedCallbacks;
  private state: AutoSpeedState;

  constructor(
    baseSpeed: number,
    settings: AutoSpeedSettings = DEFAULT_AUTO_SPEED_SETTINGS,
    callbacks: AutoSpeedCallbacks
  ) {
    this.settings = settings;
    this.callbacks = callbacks;
    this.state = {
      wordsSinceIncrease: 0,
      totalWordsRead: 0,
      increasesApplied: 0,
      currentSpeed: baseSpeed,
      baseSpeed: baseSpeed,
    };
  }

  /**
   * Record that a word was read
   * Returns true if speed was increased
   */
  recordWordRead(): boolean {
    if (!this.settings.enabled) {
      return false;
    }

    this.state.wordsSinceIncrease++;
    this.state.totalWordsRead++;

    // Check if we should increase speed
    if (this.state.wordsSinceIncrease >= this.settings.increaseEveryWords) {
      return this.tryIncreaseSpeed();
    }

    return false;
  }

  /**
   * Attempt to increase speed if not at max
   */
  private tryIncreaseSpeed(): boolean {
    const newSpeed = this.state.currentSpeed + this.settings.increaseAmount;

    // Check if we've reached max speed
    if (newSpeed >= this.settings.maxSpeed) {
      if (this.state.currentSpeed < this.settings.maxSpeed) {
        // Set to exactly max speed
        this.state.currentSpeed = this.settings.maxSpeed;
        this.state.increasesApplied++;
        this.state.wordsSinceIncrease = 0;
        this.callbacks.onSpeedIncrease(this.state.currentSpeed, this.state.increasesApplied);
        this.callbacks.onMaxSpeedReached?.();
        return true;
      }
      // Already at max speed
      this.state.wordsSinceIncrease = 0;
      return false;
    }

    // Apply speed increase
    this.state.currentSpeed = newSpeed;
    this.state.increasesApplied++;
    this.state.wordsSinceIncrease = 0;
    this.callbacks.onSpeedIncrease(this.state.currentSpeed, this.state.increasesApplied);
    return true;
  }

  /**
   * Get current state
   */
  getState(): Readonly<AutoSpeedState> {
    return { ...this.state };
  }

  /**
   * Get progress toward next speed increase (0-100)
   */
  getProgressToNextIncrease(): number {
    if (!this.settings.enabled || this.state.currentSpeed >= this.settings.maxSpeed) {
      return 100;
    }
    return Math.round((this.state.wordsSinceIncrease / this.settings.increaseEveryWords) * 100);
  }

  /**
   * Get remaining words until next speed increase
   */
  getWordsUntilNextIncrease(): number {
    if (!this.settings.enabled || this.state.currentSpeed >= this.settings.maxSpeed) {
      return 0;
    }
    return Math.max(0, this.settings.increaseEveryWords - this.state.wordsSinceIncrease);
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<AutoSpeedSettings>): void {
    this.settings = { ...this.settings, ...settings };

    // If max speed was lowered below current speed, cap it
    if (this.state.currentSpeed > this.settings.maxSpeed) {
      this.state.currentSpeed = this.settings.maxSpeed;
      this.callbacks.onSpeedIncrease(this.state.currentSpeed, this.state.increasesApplied);
    }
  }

  /**
   * Update base speed (e.g., if user manually changes speed)
   */
  setBaseSpeed(speed: number): void {
    this.state.baseSpeed = speed;
    this.state.currentSpeed = speed;
    this.state.increasesApplied = 0;
    this.state.wordsSinceIncrease = 0;
  }

  /**
   * Reset progress tracking but keep settings
   */
  resetProgress(): void {
    this.state.wordsSinceIncrease = 0;
    this.state.totalWordsRead = 0;
    this.state.increasesApplied = 0;
    this.state.currentSpeed = this.state.baseSpeed;
  }

  /**
   * Check if auto-speed is enabled
   */
  isEnabled(): boolean {
    return this.settings.enabled;
  }

  /**
   * Check if max speed has been reached
   */
  isAtMaxSpeed(): boolean {
    return this.state.currentSpeed >= this.settings.maxSpeed;
  }
}

/**
 * Calculate the projected final speed after reading a number of words
 */
export function calculateProjectedSpeed(
  baseSpeed: number,
  totalWords: number,
  settings: AutoSpeedSettings
): number {
  if (!settings.enabled) {
    return baseSpeed;
  }

  const numberOfIncreases = Math.floor(totalWords / settings.increaseEveryWords);
  const projectedSpeed = baseSpeed + numberOfIncreases * settings.increaseAmount;

  return Math.min(projectedSpeed, settings.maxSpeed);
}

/**
 * Calculate words needed to reach target speed
 */
export function calculateWordsToReachSpeed(
  currentSpeed: number,
  targetSpeed: number,
  settings: AutoSpeedSettings
): number {
  if (!settings.enabled || currentSpeed >= targetSpeed) {
    return 0;
  }

  const speedDifference = targetSpeed - currentSpeed;
  const increasesNeeded = Math.ceil(speedDifference / settings.increaseAmount);

  return increasesNeeded * settings.increaseEveryWords;
}

/**
 * Create an auto-speed controller instance
 */
export function createAutoSpeedController(
  baseSpeed: number,
  settings: AutoSpeedSettings,
  callbacks: AutoSpeedCallbacks
): AutoSpeedController {
  return new AutoSpeedController(baseSpeed, settings, callbacks);
}
