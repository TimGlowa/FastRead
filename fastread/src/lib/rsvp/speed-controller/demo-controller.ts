/**
 * Demo Speed Controller
 *
 * Implements aggressive speed ramping for demo/onboarding purposes.
 *
 * Features:
 * - Time-based ramping (reaches max in ~30-45 seconds)
 * - Smooth ease-out curve for natural feel
 * - No behavioral adaptation - user must manually pause
 * - Reduced punctuation pauses at high speeds
 * - Speed indicators can be hidden for immersive experience
 */

import type {
  SpeedController,
  SpeedControllerState,
  SpeedControllerCallbacks,
  DemoRampConfig,
  RampPhase,
  SpeedControlMode,
} from './types';
import { DEFAULT_DEMO_CONFIG } from './types';

export class DemoController implements SpeedController {
  private state: SpeedControllerState;
  private callbacks: SpeedControllerCallbacks;
  private config: DemoRampConfig;

  // Time tracking
  private startTime: number = 0;
  private pausedTime: number = 0;
  private pauseStartTime: number = 0;

  constructor(config: Partial<DemoRampConfig> = {}, callbacks: SpeedControllerCallbacks) {
    this.config = { ...DEFAULT_DEMO_CONFIG, ...config };
    this.callbacks = callbacks;

    this.state = {
      mode: 'demo',
      currentSpeed: this.config.startSpeed,
      startSpeed: this.config.startSpeed,
      maxSpeed: this.config.maxSpeed,
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
    return 'demo';
  }

  getCurrentSpeed(): number {
    return this.state.currentSpeed;
  }

  getPhase(): RampPhase {
    return this.state.phase;
  }

  getState(): Readonly<SpeedControllerState> {
    return { ...this.state };
  }

  getProgress(): number {
    if (this.state.phase === 'idle') return 0;
    if (this.state.phase === 'plateau') return 100;

    const elapsedSeconds = this.getElapsedSeconds();
    return Math.min(100, Math.round((elapsedSeconds / this.config.rampDurationSeconds) * 100));
  }

  /**
   * Get the punctuation pause scale factor based on current speed.
   * Returns a value between 1.0 (full pauses) and punctuationReductionFactor (reduced pauses).
   */
  getPunctuationScale(): number {
    if (!this.config.reducePunctuationPauses) return 1.0;
    if (this.state.phase === 'idle') return 1.0;

    // Linear interpolation from 1.0 at startSpeed to reductionFactor at maxSpeed
    const range = this.config.maxSpeed - this.config.startSpeed;
    if (range <= 0) return this.config.punctuationReductionFactor;

    const progress = (this.state.currentSpeed - this.config.startSpeed) / range;
    return 1.0 - progress * (1.0 - this.config.punctuationReductionFactor);
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  start(): void {
    if (this.state.isRunning) return;

    this.state.isRunning = true;
    this.state.isPaused = false;
    this.state.phase = 'acceleration'; // Demo goes straight to acceleration
    this.startTime = performance.now();
    this.pausedTime = 0;

    this.callbacks.onPhaseChange?.('acceleration');
  }

  stop(): void {
    this.state.isRunning = false;
    this.state.isPaused = false;
  }

  pause(): void {
    if (!this.state.isPaused) {
      this.state.isPaused = true;
      this.pauseStartTime = performance.now();
    }
  }

  resume(): void {
    if (this.state.isPaused) {
      this.state.isPaused = false;
      // Track total paused time to subtract from elapsed time
      this.pausedTime += performance.now() - this.pauseStartTime;
    }
  }

  reset(): void {
    this.state.wordsRead = 0;
    this.state.currentSpeed = this.config.startSpeed;
    this.state.phase = 'idle';
    this.state.isRunning = false;
    this.state.isPaused = false;
    this.startTime = 0;
    this.pausedTime = 0;

    this.callbacks.onSpeedChange(this.config.startSpeed, 'reset');
    this.callbacks.onPhaseChange?.('idle');
  }

  // ============================================================================
  // Time Tracking
  // ============================================================================

  private getElapsedSeconds(): number {
    if (this.startTime === 0) return 0;

    const now = this.state.isPaused ? this.pauseStartTime : performance.now();
    const elapsed = now - this.startTime - this.pausedTime;
    return elapsed / 1000;
  }

  // ============================================================================
  // Word Progression
  // ============================================================================

  onWordRead(_word: string, _isSentenceEnd: boolean): void {
    if (!this.state.isRunning || this.state.isPaused) return;

    this.state.wordsRead++;

    // Calculate speed based on elapsed time
    const newSpeed = this.calculateTimeBasedSpeed();

    if (newSpeed !== this.state.currentSpeed) {
      this.state.currentSpeed = newSpeed;
      this.callbacks.onSpeedChange(newSpeed, 'ramp');
    }

    // Check if we've reached plateau
    if (newSpeed >= this.config.maxSpeed && this.state.phase !== 'plateau') {
      this.state.phase = 'plateau';
      this.callbacks.onPhaseChange?.('plateau');
      this.callbacks.onMaxReached?.();
    }
  }

  // ============================================================================
  // Speed Calculation
  // ============================================================================

  private calculateTimeBasedSpeed(): number {
    const elapsedSeconds = this.getElapsedSeconds();

    // Calculate progress (0 to 1) with ease-out curve
    const linearProgress = Math.min(elapsedSeconds / this.config.rampDurationSeconds, 1);
    // Ease-out: 1 - (1 - x)^2
    const easedProgress = 1 - Math.pow(1 - linearProgress, 2);

    // Calculate speed
    const range = this.config.maxSpeed - this.config.startSpeed;
    const targetSpeed = this.config.startSpeed + range * easedProgress;

    return Math.round(targetSpeed);
  }

  // ============================================================================
  // User Behavior (No-ops for demo mode)
  // ============================================================================

  onUserPause(_durationMs: number): void {
    // Demo mode ignores user behavior for adaptation
    // User must manually pause to stop
  }

  onUserRewind(_wordCount: number): void {
    // Demo mode ignores rewinds for adaptation
    // Ramp continues unaffected
  }

  // ============================================================================
  // Manual Speed Control
  // ============================================================================

  setUserSpeed(speed: number): void {
    const clampedSpeed = Math.max(this.config.startSpeed, Math.min(speed, this.config.maxSpeed));

    if (clampedSpeed !== this.state.currentSpeed) {
      this.state.currentSpeed = clampedSpeed;
      this.callbacks.onSpeedChange(clampedSpeed, 'user_manual');

      // In demo mode, user speed changes don't pause the ramp
      // The time-based calculation will continue from current state
    }
  }
}

/**
 * Factory function
 */
export function createDemoController(
  config: Partial<DemoRampConfig> = {},
  callbacks: SpeedControllerCallbacks
): DemoController {
  return new DemoController(config, callbacks);
}
