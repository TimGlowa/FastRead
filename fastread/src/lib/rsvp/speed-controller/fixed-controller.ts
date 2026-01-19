/**
 * Fixed Speed Controller
 *
 * Simplest controller - maintains a constant user-set speed.
 * No automatic ramping, no behavioral adaptation.
 * This is the "baseline" and control condition for all other modes.
 */

import type {
  SpeedController,
  SpeedControllerState,
  SpeedControllerCallbacks,
  FixedModeConfig,
  RampPhase,
  SpeedControlMode,
} from './types';
import { DEFAULT_FIXED_CONFIG } from './types';

export class FixedController implements SpeedController {
  private state: SpeedControllerState;
  private callbacks: SpeedControllerCallbacks;
  private config: FixedModeConfig;

  constructor(
    config: Partial<FixedModeConfig> = {},
    callbacks: SpeedControllerCallbacks
  ) {
    this.config = { ...DEFAULT_FIXED_CONFIG, ...config };
    this.callbacks = callbacks;

    this.state = {
      mode: 'fixed',
      currentSpeed: this.config.speed,
      startSpeed: this.config.speed,
      maxSpeed: this.config.speed, // In fixed mode, max = current
      phase: 'idle',
      wordsRead: 0,
      isRunning: false,
      isPaused: false,
    };
  }

  // ============================================================================
  // State Getters
  // ============================================================================

  getMode(): SpeedControlMode {
    return 'fixed';
  }

  getCurrentSpeed(): number {
    return this.state.currentSpeed;
  }

  getPhase(): RampPhase {
    return 'idle'; // Fixed mode is always idle (no ramping)
  }

  getState(): Readonly<SpeedControllerState> {
    return { ...this.state };
  }

  getProgress(): number {
    return 100; // Fixed mode is always "complete" - no progression
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  start(): void {
    this.state.isRunning = true;
    this.state.isPaused = false;
  }

  stop(): void {
    this.state.isRunning = false;
    this.state.isPaused = false;
  }

  pause(): void {
    this.state.isPaused = true;
  }

  resume(): void {
    this.state.isPaused = false;
  }

  reset(): void {
    this.state.wordsRead = 0;
    this.state.isRunning = false;
    this.state.isPaused = false;
    // Speed stays at user-set value
  }

  // ============================================================================
  // Word Progression
  // ============================================================================

  onWordRead(_word: string, _isSentenceEnd: boolean): void {
    // Fixed mode: just count words, no speed changes
    if (this.state.isRunning && !this.state.isPaused) {
      this.state.wordsRead++;
    }
  }

  // ============================================================================
  // User Behavior (no-ops for fixed mode)
  // ============================================================================

  onUserPause(_durationMs: number): void {
    // No behavioral adaptation in fixed mode
  }

  onUserRewind(_wordCount: number): void {
    // No behavioral adaptation in fixed mode
  }

  // ============================================================================
  // Manual Speed Control
  // ============================================================================

  setUserSpeed(speed: number): void {
    const clampedSpeed = Math.max(100, Math.min(speed, 1000));

    if (clampedSpeed !== this.state.currentSpeed) {
      this.state.currentSpeed = clampedSpeed;
      this.state.startSpeed = clampedSpeed;
      this.state.maxSpeed = clampedSpeed;
      this.config.speed = clampedSpeed;

      this.callbacks.onSpeedChange(clampedSpeed, 'user_manual');
    }
  }
}

/**
 * Factory function
 */
export function createFixedController(
  config: Partial<FixedModeConfig> = {},
  callbacks: SpeedControllerCallbacks
): FixedController {
  return new FixedController(config, callbacks);
}
