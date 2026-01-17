import { describe, it, expect, beforeEach } from 'vitest';

import { useReaderStore } from './reader-store';

describe('useReaderStore', () => {
  beforeEach(() => {
    useReaderStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have correct default values', () => {
      const state = useReaderStore.getState();

      expect(state.document).toBeNull();
      expect(state.words).toEqual([]);
      expect(state.currentWordIndex).toBe(0);
      expect(state.isPlaying).toBe(false);
      expect(state.speed).toBe(300);
      expect(state.minSpeed).toBe(100);
      expect(state.maxSpeed).toBe(1000);
      expect(state.speedStep).toBe(25);
      expect(state.citationMode).toBe('skip');
    });

    it('should have correct default settings', () => {
      const { settings } = useReaderStore.getState();

      expect(settings.defaultSpeed).toBe(300);
      expect(settings.chunkSize).toBe(1);
      expect(settings.showContextWindow).toBe(false);
      expect(settings.pauseOnPunctuation).toBe(true);
      expect(settings.fontFamily).toBe('Literata');
      expect(settings.fontSize).toBe('medium');
      expect(settings.theme).toBe('dark');
    });
  });

  describe('playback actions', () => {
    it('should play', () => {
      useReaderStore.getState().play();
      expect(useReaderStore.getState().isPlaying).toBe(true);
    });

    it('should pause', () => {
      useReaderStore.getState().play();
      useReaderStore.getState().pause();
      expect(useReaderStore.getState().isPlaying).toBe(false);
    });

    it('should toggle play/pause', () => {
      const store = useReaderStore.getState();

      store.togglePlayPause();
      expect(useReaderStore.getState().isPlaying).toBe(true);

      useReaderStore.getState().togglePlayPause();
      expect(useReaderStore.getState().isPlaying).toBe(false);
    });
  });

  describe('navigation actions', () => {
    beforeEach(() => {
      useReaderStore.getState().setWords(['one', 'two', 'three', 'four', 'five']);
    });

    it('should set current word index', () => {
      useReaderStore.getState().setCurrentWordIndex(2);
      expect(useReaderStore.getState().currentWordIndex).toBe(2);
    });

    it('should clamp index to valid range', () => {
      useReaderStore.getState().setCurrentWordIndex(-5);
      expect(useReaderStore.getState().currentWordIndex).toBe(0);

      useReaderStore.getState().setCurrentWordIndex(100);
      expect(useReaderStore.getState().currentWordIndex).toBe(4);
    });

    it('should go to next word', () => {
      useReaderStore.getState().nextWord();
      expect(useReaderStore.getState().currentWordIndex).toBe(1);
    });

    it('should not go past last word', () => {
      useReaderStore.getState().setCurrentWordIndex(4);
      useReaderStore.getState().nextWord();
      expect(useReaderStore.getState().currentWordIndex).toBe(4);
    });

    it('should auto-pause when reaching end while playing', () => {
      useReaderStore.getState().setCurrentWordIndex(4);
      useReaderStore.getState().play();
      useReaderStore.getState().nextWord();
      expect(useReaderStore.getState().isPlaying).toBe(false);
    });

    it('should go to previous word', () => {
      useReaderStore.getState().setCurrentWordIndex(2);
      useReaderStore.getState().previousWord();
      expect(useReaderStore.getState().currentWordIndex).toBe(1);
    });

    it('should not go before first word', () => {
      useReaderStore.getState().previousWord();
      expect(useReaderStore.getState().currentWordIndex).toBe(0);
    });

    it('should skip forward', () => {
      useReaderStore.getState().skipForward(3);
      expect(useReaderStore.getState().currentWordIndex).toBe(3);
    });

    it('should skip backward', () => {
      useReaderStore.getState().setCurrentWordIndex(4);
      useReaderStore.getState().skipBackward(2);
      expect(useReaderStore.getState().currentWordIndex).toBe(2);
    });

    it('should go to start', () => {
      useReaderStore.getState().setCurrentWordIndex(3);
      useReaderStore.getState().goToStart();
      expect(useReaderStore.getState().currentWordIndex).toBe(0);
    });

    it('should go to end', () => {
      useReaderStore.getState().goToEnd();
      expect(useReaderStore.getState().currentWordIndex).toBe(4);
    });
  });

  describe('speed actions', () => {
    it('should set speed', () => {
      useReaderStore.getState().setSpeed(450);
      expect(useReaderStore.getState().speed).toBe(450);
    });

    it('should clamp speed to min', () => {
      useReaderStore.getState().setSpeed(50);
      expect(useReaderStore.getState().speed).toBe(100);
    });

    it('should clamp speed to max', () => {
      useReaderStore.getState().setSpeed(2000);
      expect(useReaderStore.getState().speed).toBe(1000);
    });

    it('should increase speed by step', () => {
      useReaderStore.getState().increaseSpeed();
      expect(useReaderStore.getState().speed).toBe(325);
    });

    it('should decrease speed by step', () => {
      useReaderStore.getState().decreaseSpeed();
      expect(useReaderStore.getState().speed).toBe(275);
    });

    it('should not increase beyond max', () => {
      useReaderStore.getState().setSpeed(1000);
      useReaderStore.getState().increaseSpeed();
      expect(useReaderStore.getState().speed).toBe(1000);
    });

    it('should not decrease below min', () => {
      useReaderStore.getState().setSpeed(100);
      useReaderStore.getState().decreaseSpeed();
      expect(useReaderStore.getState().speed).toBe(100);
    });
  });

  describe('settings actions', () => {
    it('should update partial settings', () => {
      useReaderStore.getState().setSettings({ theme: 'light', fontSize: 'large' });

      const { settings } = useReaderStore.getState();
      expect(settings.theme).toBe('light');
      expect(settings.fontSize).toBe('large');
      expect(settings.fontFamily).toBe('Literata'); // unchanged
    });

    it('should set citation mode', () => {
      useReaderStore.getState().setCitationMode('interactive');
      expect(useReaderStore.getState().citationMode).toBe('interactive');
    });
  });

  describe('document actions', () => {
    it('should set words and reset index', () => {
      useReaderStore.getState().setCurrentWordIndex(5);
      useReaderStore.getState().setWords(['a', 'b', 'c']);

      expect(useReaderStore.getState().words).toEqual(['a', 'b', 'c']);
      expect(useReaderStore.getState().currentWordIndex).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      // Modify state
      useReaderStore.getState().setWords(['a', 'b', 'c']);
      useReaderStore.getState().setCurrentWordIndex(2);
      useReaderStore.getState().play();
      useReaderStore.getState().setSpeed(500);
      useReaderStore.getState().setSettings({ theme: 'sepia' });

      // Reset
      useReaderStore.getState().reset();

      const state = useReaderStore.getState();
      expect(state.words).toEqual([]);
      expect(state.currentWordIndex).toBe(0);
      expect(state.isPlaying).toBe(false);
      expect(state.speed).toBe(300);
      expect(state.settings.theme).toBe('dark');
    });
  });
});
