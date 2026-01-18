import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  AutoSpeedController,
  DEFAULT_AUTO_SPEED_SETTINGS,
  calculateProjectedSpeed,
  calculateWordsToReachSpeed,
  createAutoSpeedController,
} from './auto-speed';

import type { AutoSpeedSettings } from '@/types';

describe('AutoSpeedController', () => {
  const mockOnSpeedIncrease = vi.fn();
  const mockOnMaxSpeedReached = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('initializes with default settings when disabled', () => {
      const controller = new AutoSpeedController(300, DEFAULT_AUTO_SPEED_SETTINGS, {
        onSpeedIncrease: mockOnSpeedIncrease,
      });

      const state = controller.getState();
      expect(state.baseSpeed).toBe(300);
      expect(state.currentSpeed).toBe(300);
      expect(state.wordsSinceIncrease).toBe(0);
      expect(state.totalWordsRead).toBe(0);
      expect(state.increasesApplied).toBe(0);
    });

    it('initializes with custom settings', () => {
      const settings: AutoSpeedSettings = {
        enabled: true,
        increaseEveryWords: 50,
        increaseAmount: 10,
        maxSpeed: 500,
      };

      const controller = new AutoSpeedController(300, settings, {
        onSpeedIncrease: mockOnSpeedIncrease,
      });

      expect(controller.isEnabled()).toBe(true);
    });
  });

  describe('recordWordRead', () => {
    it('does not increase speed when disabled', () => {
      const controller = new AutoSpeedController(
        300,
        { ...DEFAULT_AUTO_SPEED_SETTINGS, enabled: false },
        { onSpeedIncrease: mockOnSpeedIncrease }
      );

      // Read 200 words
      for (let i = 0; i < 200; i++) {
        controller.recordWordRead();
      }

      expect(controller.getState().currentSpeed).toBe(300);
      expect(mockOnSpeedIncrease).not.toHaveBeenCalled();
    });

    it('increases speed after configured number of words', () => {
      const settings: AutoSpeedSettings = {
        enabled: true,
        increaseEveryWords: 100,
        increaseAmount: 25,
        maxSpeed: 600,
      };

      const controller = new AutoSpeedController(300, settings, {
        onSpeedIncrease: mockOnSpeedIncrease,
      });

      // Read 99 words - no increase yet
      for (let i = 0; i < 99; i++) {
        controller.recordWordRead();
      }
      expect(controller.getState().currentSpeed).toBe(300);
      expect(mockOnSpeedIncrease).not.toHaveBeenCalled();

      // Read 100th word - should trigger increase
      controller.recordWordRead();
      expect(controller.getState().currentSpeed).toBe(325);
      expect(mockOnSpeedIncrease).toHaveBeenCalledWith(325, 1);
    });

    it('increases speed multiple times', () => {
      const settings: AutoSpeedSettings = {
        enabled: true,
        increaseEveryWords: 50,
        increaseAmount: 20,
        maxSpeed: 600,
      };

      const controller = new AutoSpeedController(300, settings, {
        onSpeedIncrease: mockOnSpeedIncrease,
      });

      // Read 150 words - should trigger 3 increases
      for (let i = 0; i < 150; i++) {
        controller.recordWordRead();
      }

      expect(controller.getState().currentSpeed).toBe(360); // 300 + 3*20
      expect(controller.getState().increasesApplied).toBe(3);
      expect(mockOnSpeedIncrease).toHaveBeenCalledTimes(3);
    });

    it('stops increasing at max speed', () => {
      const settings: AutoSpeedSettings = {
        enabled: true,
        increaseEveryWords: 50,
        increaseAmount: 50,
        maxSpeed: 400,
      };

      const controller = new AutoSpeedController(300, settings, {
        onSpeedIncrease: mockOnSpeedIncrease,
        onMaxSpeedReached: mockOnMaxSpeedReached,
      });

      // Read enough words to exceed max speed
      for (let i = 0; i < 200; i++) {
        controller.recordWordRead();
      }

      expect(controller.getState().currentSpeed).toBe(400); // Capped at max
      expect(controller.isAtMaxSpeed()).toBe(true);
      expect(mockOnMaxSpeedReached).toHaveBeenCalled();
    });

    it('caps speed exactly at max even if increase would exceed it', () => {
      const settings: AutoSpeedSettings = {
        enabled: true,
        increaseEveryWords: 50,
        increaseAmount: 75, // Would go from 300 to 375 to 450, but max is 400
        maxSpeed: 400,
      };

      const controller = new AutoSpeedController(300, settings, {
        onSpeedIncrease: mockOnSpeedIncrease,
        onMaxSpeedReached: mockOnMaxSpeedReached,
      });

      // First increase
      for (let i = 0; i < 50; i++) {
        controller.recordWordRead();
      }
      expect(controller.getState().currentSpeed).toBe(375);

      // Second increase - should cap at max
      for (let i = 0; i < 50; i++) {
        controller.recordWordRead();
      }
      expect(controller.getState().currentSpeed).toBe(400);
      expect(mockOnMaxSpeedReached).toHaveBeenCalled();
    });
  });

  describe('getProgressToNextIncrease', () => {
    it('returns correct progress percentage', () => {
      const settings: AutoSpeedSettings = {
        enabled: true,
        increaseEveryWords: 100,
        increaseAmount: 25,
        maxSpeed: 600,
      };

      const controller = new AutoSpeedController(300, settings, {
        onSpeedIncrease: mockOnSpeedIncrease,
      });

      expect(controller.getProgressToNextIncrease()).toBe(0);

      // Read 50 words
      for (let i = 0; i < 50; i++) {
        controller.recordWordRead();
      }
      expect(controller.getProgressToNextIncrease()).toBe(50);

      // Read 25 more words
      for (let i = 0; i < 25; i++) {
        controller.recordWordRead();
      }
      expect(controller.getProgressToNextIncrease()).toBe(75);
    });

    it('returns 100 when at max speed', () => {
      const settings: AutoSpeedSettings = {
        enabled: true,
        increaseEveryWords: 50,
        increaseAmount: 100,
        maxSpeed: 400,
      };

      const controller = new AutoSpeedController(300, settings, {
        onSpeedIncrease: mockOnSpeedIncrease,
      });

      // Reach max speed
      for (let i = 0; i < 100; i++) {
        controller.recordWordRead();
      }

      expect(controller.getProgressToNextIncrease()).toBe(100);
    });
  });

  describe('getWordsUntilNextIncrease', () => {
    it('returns correct remaining words', () => {
      const settings: AutoSpeedSettings = {
        enabled: true,
        increaseEveryWords: 100,
        increaseAmount: 25,
        maxSpeed: 600,
      };

      const controller = new AutoSpeedController(300, settings, {
        onSpeedIncrease: mockOnSpeedIncrease,
      });

      expect(controller.getWordsUntilNextIncrease()).toBe(100);

      // Read 30 words
      for (let i = 0; i < 30; i++) {
        controller.recordWordRead();
      }
      expect(controller.getWordsUntilNextIncrease()).toBe(70);
    });

    it('returns 0 when at max speed', () => {
      const settings: AutoSpeedSettings = {
        enabled: true,
        increaseEveryWords: 50,
        increaseAmount: 100,
        maxSpeed: 400,
      };

      const controller = new AutoSpeedController(300, settings, {
        onSpeedIncrease: mockOnSpeedIncrease,
      });

      // Reach max speed
      for (let i = 0; i < 100; i++) {
        controller.recordWordRead();
      }

      expect(controller.getWordsUntilNextIncrease()).toBe(0);
    });
  });

  describe('updateSettings', () => {
    it('updates settings correctly', () => {
      const settings: AutoSpeedSettings = {
        enabled: true,
        increaseEveryWords: 100,
        increaseAmount: 25,
        maxSpeed: 600,
      };

      const controller = new AutoSpeedController(300, settings, {
        onSpeedIncrease: mockOnSpeedIncrease,
      });

      controller.updateSettings({ increaseEveryWords: 50 });

      // Read 50 words - should now trigger increase
      for (let i = 0; i < 50; i++) {
        controller.recordWordRead();
      }

      expect(controller.getState().currentSpeed).toBe(325);
    });

    it('caps current speed if max is lowered', () => {
      const settings: AutoSpeedSettings = {
        enabled: true,
        increaseEveryWords: 50,
        increaseAmount: 50,
        maxSpeed: 600,
      };

      const controller = new AutoSpeedController(300, settings, {
        onSpeedIncrease: mockOnSpeedIncrease,
      });

      // Increase speed to 400
      for (let i = 0; i < 100; i++) {
        controller.recordWordRead();
      }
      expect(controller.getState().currentSpeed).toBe(400);

      // Lower max speed to 350
      controller.updateSettings({ maxSpeed: 350 });
      expect(controller.getState().currentSpeed).toBe(350);
    });
  });

  describe('setBaseSpeed', () => {
    it('resets speed and progress', () => {
      const settings: AutoSpeedSettings = {
        enabled: true,
        increaseEveryWords: 50,
        increaseAmount: 25,
        maxSpeed: 600,
      };

      const controller = new AutoSpeedController(300, settings, {
        onSpeedIncrease: mockOnSpeedIncrease,
      });

      // Read some words and increase speed
      for (let i = 0; i < 100; i++) {
        controller.recordWordRead();
      }
      expect(controller.getState().currentSpeed).toBe(350);
      expect(controller.getState().increasesApplied).toBe(2);

      // Set new base speed
      controller.setBaseSpeed(400);

      const state = controller.getState();
      expect(state.baseSpeed).toBe(400);
      expect(state.currentSpeed).toBe(400);
      expect(state.increasesApplied).toBe(0);
      expect(state.wordsSinceIncrease).toBe(0);
    });
  });

  describe('resetProgress', () => {
    it('resets progress but keeps base speed', () => {
      const settings: AutoSpeedSettings = {
        enabled: true,
        increaseEveryWords: 50,
        increaseAmount: 25,
        maxSpeed: 600,
      };

      const controller = new AutoSpeedController(300, settings, {
        onSpeedIncrease: mockOnSpeedIncrease,
      });

      // Read some words
      for (let i = 0; i < 100; i++) {
        controller.recordWordRead();
      }

      controller.resetProgress();

      const state = controller.getState();
      expect(state.baseSpeed).toBe(300);
      expect(state.currentSpeed).toBe(300);
      expect(state.wordsSinceIncrease).toBe(0);
      expect(state.totalWordsRead).toBe(0);
      expect(state.increasesApplied).toBe(0);
    });
  });
});

describe('calculateProjectedSpeed', () => {
  it('returns base speed when disabled', () => {
    const settings: AutoSpeedSettings = {
      enabled: false,
      increaseEveryWords: 100,
      increaseAmount: 25,
      maxSpeed: 600,
    };

    expect(calculateProjectedSpeed(300, 1000, settings)).toBe(300);
  });

  it('calculates projected speed correctly', () => {
    const settings: AutoSpeedSettings = {
      enabled: true,
      increaseEveryWords: 100,
      increaseAmount: 25,
      maxSpeed: 600,
    };

    // 500 words = 5 increases = 125 WPM increase
    expect(calculateProjectedSpeed(300, 500, settings)).toBe(425);
  });

  it('caps at max speed', () => {
    const settings: AutoSpeedSettings = {
      enabled: true,
      increaseEveryWords: 100,
      increaseAmount: 50,
      maxSpeed: 500,
    };

    // 1000 words = 10 increases = 500 WPM increase, but capped at 500
    expect(calculateProjectedSpeed(300, 1000, settings)).toBe(500);
  });
});

describe('calculateWordsToReachSpeed', () => {
  it('returns 0 when disabled', () => {
    const settings: AutoSpeedSettings = {
      enabled: false,
      increaseEveryWords: 100,
      increaseAmount: 25,
      maxSpeed: 600,
    };

    expect(calculateWordsToReachSpeed(300, 400, settings)).toBe(0);
  });

  it('returns 0 when already at or above target', () => {
    const settings: AutoSpeedSettings = {
      enabled: true,
      increaseEveryWords: 100,
      increaseAmount: 25,
      maxSpeed: 600,
    };

    expect(calculateWordsToReachSpeed(400, 400, settings)).toBe(0);
    expect(calculateWordsToReachSpeed(500, 400, settings)).toBe(0);
  });

  it('calculates words needed correctly', () => {
    const settings: AutoSpeedSettings = {
      enabled: true,
      increaseEveryWords: 100,
      increaseAmount: 25,
      maxSpeed: 600,
    };

    // Need 100 WPM increase = 4 increases at 25 each = 400 words
    expect(calculateWordsToReachSpeed(300, 400, settings)).toBe(400);
  });

  it('rounds up for partial increases', () => {
    const settings: AutoSpeedSettings = {
      enabled: true,
      increaseEveryWords: 100,
      increaseAmount: 30,
      maxSpeed: 600,
    };

    // Need 50 WPM increase = 2 increases at 30 each (60 total) = 200 words
    expect(calculateWordsToReachSpeed(300, 350, settings)).toBe(200);
  });
});

describe('createAutoSpeedController', () => {
  it('creates controller instance', () => {
    const controller = createAutoSpeedController(300, DEFAULT_AUTO_SPEED_SETTINGS, {
      onSpeedIncrease: vi.fn(),
    });

    expect(controller).toBeInstanceOf(AutoSpeedController);
    expect(controller.getState().baseSpeed).toBe(300);
  });
});
