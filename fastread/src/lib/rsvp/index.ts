export {
  TimingEngine,
  createTimingEngine,
  wpmToMs,
  getPunctuationPause,
  isParagraphBreak,
  getWordDisplayTime,
  DEFAULT_PUNCTUATION_PAUSES,
} from './timing-engine';
export type { TimingEngineConfig, PunctuationPauses } from './timing-engine';

export {
  AutoSpeedController,
  createAutoSpeedController,
  calculateProjectedSpeed,
  calculateWordsToReachSpeed,
  DEFAULT_AUTO_SPEED_SETTINGS,
} from './auto-speed';
export type { AutoSpeedState, AutoSpeedCallbacks } from './auto-speed';
