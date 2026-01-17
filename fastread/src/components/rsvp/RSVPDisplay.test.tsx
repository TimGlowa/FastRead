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

  it('displays correct progress', () => {
    useReaderStore.getState().setWords(['one', 'two', 'three']);
    render(<RSVPDisplay />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('updates when word index changes', () => {
    useReaderStore.getState().setWords(['first', 'second', 'third']);
    render(<RSVPDisplay />);

    expect(screen.getByTestId('rsvp-word')).toHaveTextContent('first');

    act(() => {
      useReaderStore.getState().setCurrentWordIndex(1);
    });

    expect(screen.getByTestId('rsvp-word')).toHaveTextContent('second');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
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
});
