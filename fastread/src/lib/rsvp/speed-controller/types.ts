/**
 * Speed Controller Types
 *
 * Defines interfaces for the three speed control modes:
 * - Fixed: User-controlled constant speed
 * - Training: Adaptive ramp with strain detection
 * - Demo: Aggressive ramp for demos/onboarding
 */

// ============================================================================
// Core Types
// ============================================================================

export type SpeedControlMode = 'fixed' | 'training' | 'demo';

export type RampPhase =
  | 'idle' // Not started or fixed mode
  | 'stabilization' // Training: slow initial increase
  | 'acceleration' // Training: faster increase
  | 'plateau' // At max speed
  | 'cooldown'; // After strain detected (training only)

export type SpeedChangeReason =
  | 'ramp' // Automatic ramping
  | 'user_manual' // User changed speed
  | 'strain_adapt' // Behavioral adaptation (training)
  | 'phase_change' // Phase transition
  | 'reset'; // Controller reset

// ============================================================================
// Controller State
// ============================================================================

export interface SpeedControllerState {
  mode: SpeedControlMode;
  currentSpeed: number;
  startSpeed: number;
  maxSpeed: number;
  phase: RampPhase;
  wordsRead: number;
  isRunning: boolean;
  isPaused: boolean;
}

// ============================================================================
// Callbacks
// ============================================================================

export interface SpeedControllerCallbacks {
  onSpeedChange: (newSpeed: number, reason: SpeedChangeReason) => void;
  onPhaseChange?: (phase: RampPhase) => void;
  onMaxReached?: () => void;
  onStrainDetected?: () => void;
}

// ============================================================================
// Controller Interface
// ============================================================================

export interface SpeedController {
  // State getters
  getMode(): SpeedControlMode;
  getCurrentSpeed(): number;
  getPhase(): RampPhase;
  getState(): Readonly<SpeedControllerState>;
  getProgress(): number; // 0-100, progress through ramp

  // Lifecycle
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  reset(): void;

  // Word progression (called by timing engine)
  onWordRead(word: string, isSentenceEnd: boolean): void;

  // User behavior tracking (for strain detection)
  onUserPause(durationMs: number): void;
  onUserRewind(wordCount: number): void;

  // Manual speed control
  setUserSpeed(speed: number): void;
}

// ============================================================================
// Mode-Specific Configurations
// ============================================================================

export interface FixedModeConfig {
  speed: number; // 100-1000 WPM
}

export interface TrainingRampConfig {
  startSpeed: number; // Default: 300
  maxSpeed: number; // 700-900 typical

  // Phase durations (in words read)
  stabilizationWords: number; // Default: 200 words
  accelerationWords: number; // Default: 500 words

  // Ramp rates (WPM increase per 100 words)
  stabilizationRate: number; // Default: 5 WPM/100 words (slow)
  accelerationRate: number; // Default: 15 WPM/100 words (faster)

  // Behavioral adaptation
  strainDropback: number; // WPM to drop on strain (default: 50)
  strainCooldownWords: number; // Words to hold before resuming ramp (default: 100)

  // Strain detection thresholds
  pauseThresholdMs: number; // Pause duration to trigger strain (default: 3000)
  rewindThresholdWords: number; // Rewind count to trigger strain (default: 20)
}

export interface DemoRampConfig {
  startSpeed: number; // Default: 350
  maxSpeed: number; // 900-1200

  // Ramp timing
  rampDurationSeconds: number; // 30-45 seconds to reach max

  // Punctuation adjustments at high speed
  reducePunctuationPauses: boolean; // Default: true
  punctuationReductionFactor: number; // 0.5 = half pauses at max speed
}

// ============================================================================
// Combined Config Type
// ============================================================================

export type SpeedControllerConfig =
  | { mode: 'fixed'; config: FixedModeConfig }
  | { mode: 'training'; config: TrainingRampConfig }
  | { mode: 'demo'; config: DemoRampConfig };

// ============================================================================
// Default Configurations
// ============================================================================

export const DEFAULT_FIXED_CONFIG: FixedModeConfig = {
  speed: 300,
};

export const DEFAULT_TRAINING_CONFIG: TrainingRampConfig = {
  startSpeed: 300,
  maxSpeed: 700,
  stabilizationWords: 200,
  accelerationWords: 500,
  stabilizationRate: 5, // WPM per 100 words
  accelerationRate: 15, // WPM per 100 words
  strainDropback: 50,
  strainCooldownWords: 100,
  pauseThresholdMs: 3000,
  rewindThresholdWords: 20,
};

export const DEFAULT_DEMO_CONFIG: DemoRampConfig = {
  startSpeed: 350,
  maxSpeed: 1000,
  rampDurationSeconds: 35,
  reducePunctuationPauses: true,
  punctuationReductionFactor: 0.5,
};
