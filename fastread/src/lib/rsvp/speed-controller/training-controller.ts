/**
 * Training Speed Controller
 *
 * Implements adaptive speed ramping with behavioral strain detection.
 *
 * State Machine:
 * IDLE → STABILIZATION → ACCELERATION → PLATEAU
 *            ↓                ↓
 *         COOLDOWN ←──────────┘
 *
 * Features:
 * - Gradual speed increase within user-defined range
 * - Speed only increases at sentence boundaries
 * - Strain detection pauses ramping and drops back 50 WPM
 * - Three phases: stabilization (slow), acceleration (faster), plateau (hold)
 */

import type {
  SpeedController,
  SpeedControllerState,
  SpeedControllerCallbacks,
  TrainingRampConfig,
  RampPhase,
  SpeedControlMode,
} from './types';
import { DEFAULT_TRAINING_CONFIG } from './types';
import { StrainDetector, createStrainDetector } from './strain-detector';

export class TrainingController implements SpeedController {
  private state: SpeedControllerState;
  private callbacks: SpeedControllerCallbacks;
  private config: TrainingRampConfig;
  private strainDetector: StrainDetector;

  // Track words read in each phase
  private phaseWordsRead: number = 0;
  private cooldownWordsRead: number = 0;
  private preStrainPhase: RampPhase = 'stabilization';
  private preStrainSpeed: number = 0;

  constructor(
    config: Partial<TrainingRampConfig> = {},
    callbacks: SpeedControllerCallbacks
  ) {
    this.config = { ...DEFAULT_TRAINING_CONFIG, ...config };
    this.callbacks = callbacks;

    this.state = {
      mode: 'training',
      currentSpeed: this.config.startSpeed,
      startSpeed: this.config.startSpeed,
      maxSpeed: this.config.maxSpeed,
      phase: 'idle',
      wordsRead: 0,
      isRunning: false,
      isPaused: false,
    };

    // Create strain detector
    this.strainDetector = createStrainDetector(
      {
        pauseThresholdMs: this.config.pauseThresholdMs,
        rewindThresholdWords: this.config.rewindThresholdWords,
      },
      {
        onStrainDetected: (reason) => this.handleStrainDetected(reason),
      }
    );
  }

  // ============================================================================
  // State Getters
  // ============================================================================

  getMode(): SpeedControlMode {
    return 'training';
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

    // Calculate progress based on speed range
    const range = this.config.maxSpeed - this.config.startSpeed;
    if (range <= 0) return 100;

    const current = this.state.currentSpeed - this.config.startSpeed;
    return Math.min(100, Math.round((current / range) * 100));
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  start(): void {
    if (this.state.isRunning) return;

    this.state.isRunning = true;
    this.state.isPaused = false;
    this.state.phase = 'stabilization';
    this.phaseWordsRead = 0;

    // Enable strain detection
    this.strainDetector.enable();

    this.callbacks.onPhaseChange?.('stabilization');
  }

  stop(): void {
    this.state.isRunning = false;
    this.state.isPaused = false;
    this.strainDetector.disable();
  }

  pause(): void {
    this.state.isPaused = true;
  }

  resume(): void {
    this.state.isPaused = false;
  }

  reset(): void {
    this.state.wordsRead = 0;
    this.state.currentSpeed = this.config.startSpeed;
    this.state.phase = 'idle';
    this.state.isRunning = false;
    this.state.isPaused = false;
    this.phaseWordsRead = 0;
    this.cooldownWordsRead = 0;
    this.strainDetector.disable();

    this.callbacks.onSpeedChange(this.config.startSpeed, 'reset');
    this.callbacks.onPhaseChange?.('idle');
  }

  // ============================================================================
  // Word Progression
  // ============================================================================

  onWordRead(word: string, isSentenceEnd: boolean): void {
    if (!this.state.isRunning || this.state.isPaused) return;

    this.state.wordsRead++;
    this.phaseWordsRead++;

    // Handle cooldown phase separately
    if (this.state.phase === 'cooldown') {
      this.cooldownWordsRead++;
      if (this.cooldownWordsRead >= this.config.strainCooldownWords) {
        this.exitCooldown();
      }
      return;
    }

    // Only consider speed increase at sentence boundaries
    if (!isSentenceEnd) return;

    // Check if we should increase speed based on current phase
    const newSpeed = this.calculateSpeedIncrease();

    if (newSpeed > this.state.currentSpeed) {
      this.applySpeedChange(newSpeed);
    }

    // Check for phase transitions
    this.checkPhaseTransition();
  }

  // ============================================================================
  // Speed Calculation
  // ============================================================================

  private calculateSpeedIncrease(): number {
    const { phase } = this.state;

    // No increase if at or above max
    if (this.state.currentSpeed >= this.config.maxSpeed) {
      return this.state.currentSpeed;
    }

    // Calculate rate based on phase
    let rate: number;
    switch (phase) {
      case 'stabilization':
        rate = this.config.stabilizationRate;
        break;
      case 'acceleration':
        rate = this.config.accelerationRate;
        break;
      default:
        return this.state.currentSpeed;
    }

    // Rate is WPM per 100 words, calculate increase based on words read in phase
    // We apply a small increase every 25 words to make it smooth
    const wordsPerIncrement = 25;
    const incrementsCompleted = Math.floor(this.phaseWordsRead / wordsPerIncrement);
    const incrementAmount = (rate / 100) * wordsPerIncrement;

    const targetSpeed = this.config.startSpeed + incrementsCompleted * incrementAmount;

    // Account for phase offset in acceleration
    if (phase === 'acceleration') {
      // Add the speed gained during stabilization
      const stabilizationGain =
        (this.config.stabilizationRate / 100) * this.config.stabilizationWords;
      return Math.min(
        this.config.maxSpeed,
        this.config.startSpeed + stabilizationGain + incrementsCompleted * incrementAmount
      );
    }

    return Math.min(this.config.maxSpeed, targetSpeed);
  }

  private applySpeedChange(newSpeed: number): void {
    // Round to nearest integer
    const roundedSpeed = Math.round(newSpeed);

    if (roundedSpeed !== this.state.currentSpeed) {
      this.state.currentSpeed = roundedSpeed;
      this.callbacks.onSpeedChange(roundedSpeed, 'ramp');
    }
  }

  // ============================================================================
  // Phase Transitions
  // ============================================================================

  private checkPhaseTransition(): void {
    const { phase } = this.state;

    // Check if we've reached max speed
    if (this.state.currentSpeed >= this.config.maxSpeed) {
      if (phase !== 'plateau') {
        this.transitionTo('plateau');
        this.callbacks.onMaxReached?.();
      }
      return;
    }

    // Check stabilization → acceleration transition
    if (phase === 'stabilization' && this.phaseWordsRead >= this.config.stabilizationWords) {
      this.transitionTo('acceleration');
      return;
    }

    // Check acceleration → plateau transition (if acceleration phase completes)
    if (phase === 'acceleration') {
      const totalWordsForAcceleration =
        this.config.stabilizationWords + this.config.accelerationWords;
      if (this.state.wordsRead >= totalWordsForAcceleration) {
        this.transitionTo('plateau');
        this.callbacks.onMaxReached?.();
      }
    }
  }

  private transitionTo(newPhase: RampPhase): void {
    this.state.phase = newPhase;
    this.phaseWordsRead = 0;

    this.callbacks.onPhaseChange?.(newPhase);

    // If transitioning to plateau, set speed to max
    if (newPhase === 'plateau' && this.state.currentSpeed < this.config.maxSpeed) {
      this.state.currentSpeed = this.config.maxSpeed;
      this.callbacks.onSpeedChange(this.config.maxSpeed, 'phase_change');
    }
  }

  // ============================================================================
  // Strain Handling
  // ============================================================================

  private handleStrainDetected(_reason: string): void {
    // Don't trigger cooldown if already in cooldown or plateau
    if (this.state.phase === 'cooldown' || this.state.phase === 'idle') {
      return;
    }

    // Save current state for recovery
    this.preStrainPhase = this.state.phase;
    this.preStrainSpeed = this.state.currentSpeed;

    // Drop back speed
    const newSpeed = Math.max(
      this.config.startSpeed,
      this.state.currentSpeed - this.config.strainDropback
    );

    this.state.currentSpeed = newSpeed;
    this.state.phase = 'cooldown';
    this.cooldownWordsRead = 0;

    this.callbacks.onSpeedChange(newSpeed, 'strain_adapt');
    this.callbacks.onPhaseChange?.('cooldown');
    this.callbacks.onStrainDetected?.();
  }

  private exitCooldown(): void {
    // Return to previous phase
    this.state.phase = this.preStrainPhase;
    this.phaseWordsRead = 0;
    this.cooldownWordsRead = 0;

    this.callbacks.onPhaseChange?.(this.preStrainPhase);
  }

  // ============================================================================
  // User Behavior
  // ============================================================================

  onUserPause(durationMs: number): void {
    this.strainDetector.onUserPause(durationMs);
  }

  onUserRewind(wordCount: number): void {
    this.strainDetector.onUserRewind(wordCount);
  }

  // ============================================================================
  // Manual Speed Control
  // ============================================================================

  setUserSpeed(speed: number): void {
    const clampedSpeed = Math.max(this.config.startSpeed, Math.min(speed, this.config.maxSpeed));

    if (clampedSpeed !== this.state.currentSpeed) {
      this.state.currentSpeed = clampedSpeed;
      this.callbacks.onSpeedChange(clampedSpeed, 'user_manual');

      // User override pauses ramping temporarily
      // They can resume by continuing to read
      this.state.isPaused = true;
    }
  }
}

/**
 * Factory function
 */
export function createTrainingController(
  config: Partial<TrainingRampConfig> = {},
  callbacks: SpeedControllerCallbacks
): TrainingController {
  return new TrainingController(config, callbacks);
}
