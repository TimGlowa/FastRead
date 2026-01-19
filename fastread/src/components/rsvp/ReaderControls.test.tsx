import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { useReaderStore } from '@/stores';

import { ReaderControls } from './ReaderControls';

describe('ReaderControls', () => {
  beforeEach(() => {
    useReaderStore.getState().reset();
  });

  describe('rendering', () => {
    it('renders all control buttons', () => {
      render(<ReaderControls />);

      expect(screen.getByTestId('play-pause-btn')).toBeInTheDocument();
      expect(screen.getByTestId('increase-speed-btn')).toBeInTheDocument();
      expect(screen.getByTestId('decrease-speed-btn')).toBeInTheDocument();
      expect(screen.getByTestId('skip-forward-btn')).toBeInTheDocument();
      expect(screen.getByTestId('skip-back-btn')).toBeInTheDocument();
      expect(screen.getByTestId('go-to-start-btn')).toBeInTheDocument();
    });

    it('displays current speed', () => {
      render(<ReaderControls />);
      expect(screen.getByTestId('speed-display')).toHaveTextContent('300');
    });

    it('shows WPM label', () => {
      render(<ReaderControls />);
      expect(screen.getByText('wpm')).toBeInTheDocument();
    });

    it('has accessibility role', () => {
      render(<ReaderControls />);
      expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Reader controls');
    });
  });

  describe('disabled state', () => {
    it('disables play button when no words loaded', () => {
      render(<ReaderControls />);
      expect(screen.getByTestId('play-pause-btn')).toBeDisabled();
    });

    it('disables skip buttons when no words loaded', () => {
      render(<ReaderControls />);
      expect(screen.getByTestId('skip-forward-btn')).toBeDisabled();
      expect(screen.getByTestId('skip-back-btn')).toBeDisabled();
    });

    it('disables go to start when no words loaded', () => {
      render(<ReaderControls />);
      expect(screen.getByTestId('go-to-start-btn')).toBeDisabled();
    });

    it('enables buttons when words are loaded', () => {
      useReaderStore.getState().setWords(['hello', 'world']);
      render(<ReaderControls />);

      expect(screen.getByTestId('play-pause-btn')).not.toBeDisabled();
      expect(screen.getByTestId('skip-forward-btn')).not.toBeDisabled();
      expect(screen.getByTestId('skip-back-btn')).not.toBeDisabled();
    });

    it('speed buttons are always enabled', () => {
      render(<ReaderControls />);
      expect(screen.getByTestId('increase-speed-btn')).not.toBeDisabled();
      expect(screen.getByTestId('decrease-speed-btn')).not.toBeDisabled();
    });
  });

  describe('play/pause functionality', () => {
    beforeEach(() => {
      useReaderStore.getState().setWords(['hello', 'world']);
    });

    it('shows play icon when paused', () => {
      render(<ReaderControls />);
      expect(screen.getByTestId('play-pause-btn')).toHaveAttribute('aria-label', 'Play');
    });

    it('toggles to pause when clicked', () => {
      render(<ReaderControls />);
      fireEvent.click(screen.getByTestId('play-pause-btn'));

      expect(useReaderStore.getState().isPlaying).toBe(true);
      expect(screen.getByTestId('play-pause-btn')).toHaveAttribute('aria-label', 'Pause');
    });

    it('toggles back to play when clicked again', () => {
      render(<ReaderControls />);
      fireEvent.click(screen.getByTestId('play-pause-btn'));
      fireEvent.click(screen.getByTestId('play-pause-btn'));

      expect(useReaderStore.getState().isPlaying).toBe(false);
      expect(screen.getByTestId('play-pause-btn')).toHaveAttribute('aria-label', 'Play');
    });
  });

  describe('speed controls', () => {
    it('increases speed when plus clicked', () => {
      render(<ReaderControls />);
      fireEvent.click(screen.getByTestId('increase-speed-btn'));

      expect(useReaderStore.getState().speed).toBe(325);
      expect(screen.getByTestId('speed-display')).toHaveTextContent('325');
    });

    it('decreases speed when minus clicked', () => {
      render(<ReaderControls />);
      fireEvent.click(screen.getByTestId('decrease-speed-btn'));

      expect(useReaderStore.getState().speed).toBe(275);
      expect(screen.getByTestId('speed-display')).toHaveTextContent('275');
    });

    it('does not exceed max speed', () => {
      useReaderStore.getState().setSpeed(1000);
      render(<ReaderControls />);
      fireEvent.click(screen.getByTestId('increase-speed-btn'));

      expect(useReaderStore.getState().speed).toBe(1000);
    });

    it('does not go below min speed', () => {
      useReaderStore.getState().setSpeed(100);
      render(<ReaderControls />);
      fireEvent.click(screen.getByTestId('decrease-speed-btn'));

      expect(useReaderStore.getState().speed).toBe(100);
    });
  });

  describe('navigation controls', () => {
    beforeEach(() => {
      useReaderStore.getState().setWords(['one', 'two', 'three', 'four', 'five']);
      useReaderStore.getState().setCurrentWordIndex(2);
    });

    it('skips forward by default amount', () => {
      render(<ReaderControls />);
      fireEvent.click(screen.getByTestId('skip-forward-btn'));

      // Default skip is 10, but only 5 words, so should be at end (index 4)
      expect(useReaderStore.getState().currentWordIndex).toBe(4);
    });

    it('skips backward by default amount', () => {
      render(<ReaderControls />);
      fireEvent.click(screen.getByTestId('skip-back-btn'));

      // Default skip is 10, but from index 2, should be at 0
      expect(useReaderStore.getState().currentWordIndex).toBe(0);
    });

    it('uses custom skip amount', () => {
      useReaderStore.getState().setWords(Array(20).fill('word'));
      useReaderStore.getState().setCurrentWordIndex(10);
      render(<ReaderControls skipAmount={5} />);

      fireEvent.click(screen.getByTestId('skip-forward-btn'));
      expect(useReaderStore.getState().currentWordIndex).toBe(15);
    });

    it('goes to start when reset clicked', () => {
      render(<ReaderControls />);
      fireEvent.click(screen.getByTestId('go-to-start-btn'));

      expect(useReaderStore.getState().currentWordIndex).toBe(0);
    });
  });

  describe('accessibility', () => {
    it('has correct aria-labels for speed buttons', () => {
      render(<ReaderControls />);
      expect(screen.getByTestId('increase-speed-btn')).toHaveAttribute(
        'aria-label',
        'Increase speed (pauses reading)'
      );
      expect(screen.getByTestId('decrease-speed-btn')).toHaveAttribute(
        'aria-label',
        'Decrease speed (pauses reading)'
      );
    });

    it('has correct aria-labels for skip buttons', () => {
      render(<ReaderControls skipAmount={10} />);
      expect(screen.getByTestId('skip-forward-btn')).toHaveAttribute(
        'aria-label',
        'Skip forward 10 words'
      );
      expect(screen.getByTestId('skip-back-btn')).toHaveAttribute(
        'aria-label',
        'Skip back 10 words'
      );
    });

    it('updates skip aria-labels with custom amount', () => {
      render(<ReaderControls skipAmount={5} />);
      expect(screen.getByTestId('skip-forward-btn')).toHaveAttribute(
        'aria-label',
        'Skip forward 5 words'
      );
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      const { container } = render(<ReaderControls className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
