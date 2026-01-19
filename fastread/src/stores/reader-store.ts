import { create } from 'zustand';

import type {
  ReaderSettings,
  ParsedDocument,
  CitationMode,
  SpeedControlMode,
  RampPhase,
  SpeedModeConfig,
} from '@/types';

export interface ReaderState {
  // Document
  document: ParsedDocument | null;
  words: string[];

  // Reading position
  currentWordIndex: number;
  isPlaying: boolean;

  // Speed settings
  speed: number; // WPM
  minSpeed: number;
  maxSpeed: number;
  speedStep: number;

  // Settings
  settings: ReaderSettings;
  citationMode: CitationMode;

  // Speed control mode
  speedControlMode: SpeedControlMode;
  speedModeConfig: SpeedModeConfig | null;
  rampPhase: RampPhase;
  isRamping: boolean;
  isRampPaused: boolean; // Ramp paused but playback continues

  // Actions - Document
  setDocument: (document: ParsedDocument | null) => void;
  setWords: (words: string[]) => void;

  // Actions - Playback
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;

  // Actions - Navigation
  setCurrentWordIndex: (index: number) => void;
  nextWord: () => void;
  previousWord: () => void;
  skipForward: (count: number) => void;
  skipBackward: (count: number) => void;
  goToStart: () => void;
  goToEnd: () => void;

  // Actions - Speed
  setSpeed: (speed: number) => void;
  increaseSpeed: () => void;
  decreaseSpeed: () => void;

  // Actions - Settings
  setSettings: (settings: Partial<ReaderSettings>) => void;
  setCitationMode: (mode: CitationMode) => void;

  // Actions - Speed Mode
  setSpeedControlMode: (mode: SpeedControlMode, config?: SpeedModeConfig) => void;
  setSpeedModeConfig: (config: SpeedModeConfig) => void;
  setRampPhase: (phase: RampPhase) => void;
  setIsRamping: (ramping: boolean) => void;
  setIsRampPaused: (paused: boolean) => void;
  toggleRampPaused: () => void;

  // Actions - Reset
  reset: () => void;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  defaultSpeed: 300,
  chunkSize: 1,
  showContextWindow: false,
  pauseOnPunctuation: true,
  fontFamily: 'Literata',
  fontSize: 'medium',
  theme: 'dark',
  orpHighlightColor: '#ef4444',
};

const initialState = {
  document: null,
  words: [],
  currentWordIndex: 0,
  isPlaying: false,
  speed: 300,
  minSpeed: 100,
  maxSpeed: 1000,
  speedStep: 25,
  settings: DEFAULT_SETTINGS,
  citationMode: 'skip' as CitationMode,
  // Speed control mode defaults
  speedControlMode: 'fixed' as SpeedControlMode,
  speedModeConfig: null as SpeedModeConfig | null,
  rampPhase: 'idle' as RampPhase,
  isRamping: false,
  isRampPaused: false,
};

export const useReaderStore = create<ReaderState>((set, get) => ({
  ...initialState,

  // Document actions
  setDocument: (document) => set({ document, currentWordIndex: 0 }),
  setWords: (words) => set({ words, currentWordIndex: 0 }),

  // Playback actions
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),

  // Navigation actions
  setCurrentWordIndex: (index) => {
    const { words } = get();
    const clampedIndex = Math.max(0, Math.min(index, words.length - 1));
    set({ currentWordIndex: clampedIndex });
  },

  nextWord: () => {
    const { currentWordIndex, words, isPlaying } = get();
    if (currentWordIndex < words.length - 1) {
      set({ currentWordIndex: currentWordIndex + 1 });
    } else if (isPlaying) {
      set({ isPlaying: false });
    }
  },

  previousWord: () => {
    const { currentWordIndex } = get();
    if (currentWordIndex > 0) {
      set({ currentWordIndex: currentWordIndex - 1 });
    }
  },

  skipForward: (count) => {
    const { currentWordIndex, words } = get();
    const newIndex = Math.min(currentWordIndex + count, words.length - 1);
    set({ currentWordIndex: newIndex });
  },

  skipBackward: (count) => {
    const { currentWordIndex } = get();
    const newIndex = Math.max(currentWordIndex - count, 0);
    set({ currentWordIndex: newIndex });
  },

  goToStart: () => set({ currentWordIndex: 0 }),

  goToEnd: () => {
    const { words } = get();
    set({ currentWordIndex: Math.max(0, words.length - 1) });
  },

  // Speed actions
  setSpeed: (speed) => {
    const { minSpeed, maxSpeed } = get();
    const clampedSpeed = Math.max(minSpeed, Math.min(speed, maxSpeed));
    set({ speed: clampedSpeed });
  },

  increaseSpeed: () => {
    const { speed, speedStep, maxSpeed } = get();
    const newSpeed = Math.min(speed + speedStep, maxSpeed);
    set({ speed: newSpeed });
  },

  decreaseSpeed: () => {
    const { speed, speedStep, minSpeed } = get();
    const newSpeed = Math.max(speed - speedStep, minSpeed);
    set({ speed: newSpeed });
  },

  // Settings actions
  setSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  setCitationMode: (mode) => set({ citationMode: mode }),

  // Speed mode actions
  setSpeedControlMode: (mode, config) =>
    set({
      speedControlMode: mode,
      speedModeConfig: config ?? null,
      rampPhase: 'idle',
      isRamping: false,
    }),

  setSpeedModeConfig: (config) => set({ speedModeConfig: config }),

  setRampPhase: (phase) => set({ rampPhase: phase }),

  setIsRamping: (ramping) => set({ isRamping: ramping }),

  setIsRampPaused: (paused) => set({ isRampPaused: paused }),

  toggleRampPaused: () =>
    set((state) => {
      // Only toggle if we're in a ramp mode (not fixed)
      if (state.speedControlMode === 'fixed') return {};
      return { isRampPaused: !state.isRampPaused };
    }),

  // Reset
  reset: () => set(initialState),
}));
