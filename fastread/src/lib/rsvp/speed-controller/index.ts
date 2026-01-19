/**
 * Speed Controller Module
 *
 * Exports all speed controller types, classes, and factory functions.
 */

// Types
export type {
  SpeedControlMode,
  RampPhase,
  SpeedChangeReason,
  SpeedControllerState,
  SpeedControllerCallbacks,
  SpeedController,
  FixedModeConfig,
  TrainingRampConfig,
  DemoRampConfig,
  SpeedControllerConfig,
} from './types';

export {
  DEFAULT_FIXED_CONFIG,
  DEFAULT_TRAINING_CONFIG,
  DEFAULT_DEMO_CONFIG,
} from './types';

// Controllers
export { FixedController, createFixedController } from './fixed-controller';
export { TrainingController, createTrainingController } from './training-controller';
export { DemoController, createDemoController } from './demo-controller';

// Strain Detector
export { StrainDetector, createStrainDetector } from './strain-detector';
export type { StrainDetectorConfig, StrainDetectorCallbacks, StrainReason } from './strain-detector';

// Factory function to create any controller
import type { SpeedControllerConfig, SpeedControllerCallbacks, SpeedController } from './types';
import { createFixedController } from './fixed-controller';
import { createTrainingController } from './training-controller';
import { createDemoController } from './demo-controller';

export function createSpeedController(
  config: SpeedControllerConfig,
  callbacks: SpeedControllerCallbacks
): SpeedController {
  switch (config.mode) {
    case 'fixed':
      return createFixedController(config.config, callbacks);

    case 'training':
      return createTrainingController(config.config, callbacks);

    case 'demo':
      return createDemoController(config.config, callbacks);

    default:
      return createFixedController({ speed: 300 }, callbacks);
  }
}
