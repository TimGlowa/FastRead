import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { useReaderStore } from '@/stores';

import { RSVPDisplay, calculateORP } from './RSVPDisplay';

describe('calculateORP', () => {
  it('returns index 0 for words 1-3 chars', () => {
    expect(calculateORP('a')).toBe(0);
    expect(calculateORP('at')).toBe(0);
    expect(calculateORP('the')).toBe(0);
  });

  it('returns index 1 for words 4-6 chars', () => {
    expect(calculateORP('word')).toBe(1);
    expect(calculateORP('hello')).toBe(1);
    expect(calculateORP('simple')).toBe(1);
  });

  it('returns index 2 for words 7-9 chars', () => {
    expect(calculateORP('reading')).toBe(2);
    expect(calculateORP('academic')).toBe(2);
    expect(calculateORP('computing')).toBe(2);
  });

  it('returns index 3 for words 10+ chars', () => {
    expect(calculateORP('university')).toBe(3);
    expect(calculateORP('acceleration')).toBe(3);
    expect(calculateORP('internationalization')).toBe(3);
  });

  it('handles empty string', () => {
    expect(calculateORP('')).toBe(0);
  });
});

describe('RSVPDisplay', () => {
  beforeEach(() => {
    useReaderStore.getState().reset();
  });

  it('shows upload message when no words loaded', () => {
    render(<RSVPDisplay />);
    expect(screen.getByText('Upload a document to start reading')).toBeInTheDocument();
  });

  it('displays the current word', () => {
    useReaderStore.getState().setWords(['hello', 'world']);
    render(<RSVPDisplay />);
    expect(screen.getByTestId('rsvp-word')).toHaveTextContent('hello');
  });

  it('highlights the ORP character', () => {
    useReaderStore.getState().setWords(['hello']);
    render(<RSVPDisplay />);
    const orpChar = screen.getByTestId('rsvp-orp-char');
    expect(orpChar).toHaveTextContent('e'); // 5-char word, ORP at index 1
  });

  it('displays WPM indicator when paused', () => {
    useReaderStore.getState().setWords(['one', 'two', 'three']);
    // Ensure paused state (controls visible)
    useReaderStore.getState().pause();
    render(<RSVPDisplay showWPM={true} />);
    expect(screen.getByText(/300/)).toBeInTheDocument();
    expect(screen.getByText(/wpm/)).toBeInTheDocument();
  });

  it('hides controls when playing', () => {
    useReaderStore.getState().setWords(['one', 'two', 'three']);
    useReaderStore.getState().play();
    render(<RSVPDisplay showWPM={true} showPreview={true} />);
    // Controls should be hidden during playback
    expect(screen.queryByText(/wpm/)).not.toBeInTheDocument();
  });

  it('displays next word preview when paused', () => {
    useReaderStore.getState().setWords(['first', 'second', 'third']);
    useReaderStore.getState().pause();
    render(<RSVPDisplay showPreview={true} />);
    // Should show next word "second" in preview
    expect(screen.getByLabelText(/Next word: second/)).toBeInTheDocument();
  });

  it('updates when word index changes', () => {
    useReaderStore.getState().setWords(['first', 'second', 'third']);
    useReaderStore.getState().pause();
    render(<RSVPDisplay />);

    expect(screen.getByTestId('rsvp-word')).toHaveTextContent('first');

    act(() => {
      useReaderStore.getState().setCurrentWordIndex(1);
    });

    expect(screen.getByTestId('rsvp-word')).toHaveTextContent('second');
    // Next word preview should now show "third"
    expect(screen.getByLabelText(/Next word: third/)).toBeInTheDocument();
  });

  it('has accessibility attributes', () => {
    useReaderStore.getState().setWords(['test']);
    render(<RSVPDisplay />);

    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-label', 'Speed reader display');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('applies custom className', () => {
    useReaderStore.getState().setWords(['test']);
    const { container } = render(<RSVPDisplay className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('correctly splits word around ORP for short word', () => {
    useReaderStore.getState().setWords(['go']); // 2 chars, ORP at 0
    render(<RSVPDisplay />);
    const orpChar = screen.getByTestId('rsvp-orp-char');
    expect(orpChar).toHaveTextContent('g');
  });

  it('correctly splits word around ORP for long word', () => {
    useReaderStore.getState().setWords(['magnificent']); // 11 chars, ORP at 3
    render(<RSVPDisplay />);
    const orpChar = screen.getByTestId('rsvp-orp-char');
    expect(orpChar).toHaveTextContent('n'); // mag[n]ificent
  });

  it('renders vertically framed stage with center ticks', () => {
    useReaderStore.getState().setWords(['hello']);
    render(<RSVPDisplay />);

    // Stage should exist
    expect(screen.getByTestId('rsvp-stage')).toBeInTheDocument();

    // Center ticks should be present
    expect(screen.getByTestId('rsvp-tick-top')).toBeInTheDocument();
    expect(screen.getByTestId('rsvp-tick-bottom')).toBeInTheDocument();
  });

  it('renders word parts with fixed-width anchor', () => {
    useReaderStore.getState().setWords(['testing']); // 7 chars, ORP at index 2
    render(<RSVPDisplay />);

    const leftPart = screen.getByTestId('rsvp-left');
    const orpChar = screen.getByTestId('rsvp-orp-char');
    const rightPart = screen.getByTestId('rsvp-right');

    expect(leftPart).toHaveTextContent('te'); // before ORP
    expect(orpChar).toHaveTextContent('s'); // ORP char
    expect(rightPart).toHaveTextContent('ting'); // after ORP

    // ORP char should have fixed width styling
    expect(orpChar).toHaveStyle({ width: '0.65em' });
  });
});
