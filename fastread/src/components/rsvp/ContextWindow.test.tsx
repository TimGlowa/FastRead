import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { useReaderStore } from '@/stores';

import { ContextWindow } from './ContextWindow';

describe('ContextWindow', () => {
  beforeEach(() => {
    useReaderStore.getState().reset();
  });

  it('renders nothing when context window is disabled', () => {
    useReaderStore.getState().setWords(['one', 'two', 'three', 'four', 'five']);
    useReaderStore.getState().setCurrentWordIndex(2);
    useReaderStore.getState().setSettings({ showContextWindow: false });

    const { container } = render(<ContextWindow />);

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no words are loaded', () => {
    useReaderStore.getState().setSettings({ showContextWindow: true });

    const { container } = render(<ContextWindow />);

    expect(container.firstChild).toBeNull();
  });

  it('renders context window when enabled with words', () => {
    useReaderStore.getState().setWords(['one', 'two', 'three', 'four', 'five']);
    useReaderStore.getState().setCurrentWordIndex(2);
    useReaderStore.getState().setSettings({ showContextWindow: true });

    render(<ContextWindow />);

    expect(screen.getByTestId('context-window')).toBeInTheDocument();
  });

  it('displays current word highlighted', () => {
    useReaderStore.getState().setWords(['one', 'two', 'three', 'four', 'five']);
    useReaderStore.getState().setCurrentWordIndex(2);
    useReaderStore.getState().setSettings({ showContextWindow: true });

    render(<ContextWindow />);

    const currentWord = screen.getByTestId('context-word-current');
    expect(currentWord).toHaveTextContent('three');
  });

  it('displays words before current word', () => {
    useReaderStore.getState().setWords(['one', 'two', 'three', 'four', 'five']);
    useReaderStore.getState().setCurrentWordIndex(2);
    useReaderStore.getState().setSettings({ showContextWindow: true });

    render(<ContextWindow wordsBefore={2} />);

    expect(screen.getByTestId('context-word-before-0')).toHaveTextContent('one');
    expect(screen.getByTestId('context-word-before-1')).toHaveTextContent('two');
  });

  it('displays words after current word', () => {
    useReaderStore.getState().setWords(['one', 'two', 'three', 'four', 'five']);
    useReaderStore.getState().setCurrentWordIndex(2);
    useReaderStore.getState().setSettings({ showContextWindow: true });

    render(<ContextWindow wordsAfter={2} />);

    expect(screen.getByTestId('context-word-after-0')).toHaveTextContent('four');
    expect(screen.getByTestId('context-word-after-1')).toHaveTextContent('five');
  });

  it('handles beginning of document correctly', () => {
    useReaderStore.getState().setWords(['one', 'two', 'three', 'four', 'five']);
    useReaderStore.getState().setCurrentWordIndex(0);
    useReaderStore.getState().setSettings({ showContextWindow: true });

    render(<ContextWindow wordsBefore={3} wordsAfter={3} />);

    // No words before
    expect(screen.queryByTestId('context-word-before-0')).not.toBeInTheDocument();

    // Current word
    expect(screen.getByTestId('context-word-current')).toHaveTextContent('one');

    // Words after
    expect(screen.getByTestId('context-word-after-0')).toHaveTextContent('two');
    expect(screen.getByTestId('context-word-after-1')).toHaveTextContent('three');
    expect(screen.getByTestId('context-word-after-2')).toHaveTextContent('four');
  });

  it('handles end of document correctly', () => {
    useReaderStore.getState().setWords(['one', 'two', 'three', 'four', 'five']);
    useReaderStore.getState().setCurrentWordIndex(4);
    useReaderStore.getState().setSettings({ showContextWindow: true });

    render(<ContextWindow wordsBefore={3} wordsAfter={3} />);

    // Words before
    expect(screen.getByTestId('context-word-before-0')).toHaveTextContent('two');
    expect(screen.getByTestId('context-word-before-1')).toHaveTextContent('three');
    expect(screen.getByTestId('context-word-before-2')).toHaveTextContent('four');

    // Current word
    expect(screen.getByTestId('context-word-current')).toHaveTextContent('five');

    // No words after
    expect(screen.queryByTestId('context-word-after-0')).not.toBeInTheDocument();
  });

  it('respects custom wordsBefore and wordsAfter props', () => {
    const words = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    useReaderStore.getState().setWords(words);
    useReaderStore.getState().setCurrentWordIndex(5); // 'f'
    useReaderStore.getState().setSettings({ showContextWindow: true });

    render(<ContextWindow wordsBefore={2} wordsAfter={3} />);

    // Should show 2 words before
    expect(screen.getByTestId('context-word-before-0')).toHaveTextContent('d');
    expect(screen.getByTestId('context-word-before-1')).toHaveTextContent('e');
    expect(screen.queryByTestId('context-word-before-2')).not.toBeInTheDocument();

    // Current word
    expect(screen.getByTestId('context-word-current')).toHaveTextContent('f');

    // Should show 3 words after
    expect(screen.getByTestId('context-word-after-0')).toHaveTextContent('g');
    expect(screen.getByTestId('context-word-after-1')).toHaveTextContent('h');
    expect(screen.getByTestId('context-word-after-2')).toHaveTextContent('i');
    expect(screen.queryByTestId('context-word-after-3')).not.toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    useReaderStore.getState().setWords(['one', 'two', 'three']);
    useReaderStore.getState().setCurrentWordIndex(1);
    useReaderStore.getState().setSettings({ showContextWindow: true });

    render(<ContextWindow />);

    const contextWindow = screen.getByTestId('context-window');
    expect(contextWindow).toHaveAttribute('role', 'region');
    expect(contextWindow).toHaveAttribute('aria-label', 'Reading context');
  });

  it('applies opacity fade to distant words', () => {
    useReaderStore.getState().setWords(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    useReaderStore.getState().setCurrentWordIndex(3); // 'd'
    useReaderStore.getState().setSettings({ showContextWindow: true });

    render(<ContextWindow wordsBefore={3} wordsAfter={3} />);

    // Words further from current should have lower opacity
    const beforeWord0 = screen.getByTestId('context-word-before-0');
    const beforeWord2 = screen.getByTestId('context-word-before-2');

    // First word (furthest) should have lower opacity than closest word
    const opacity0 = parseFloat(beforeWord0.style.opacity);
    const opacity2 = parseFloat(beforeWord2.style.opacity);

    expect(opacity0).toBeLessThan(opacity2);
  });

  it('applies custom className', () => {
    useReaderStore.getState().setWords(['one', 'two', 'three']);
    useReaderStore.getState().setCurrentWordIndex(1);
    useReaderStore.getState().setSettings({ showContextWindow: true });

    render(<ContextWindow className="custom-class" />);

    const contextWindow = screen.getByTestId('context-window');
    expect(contextWindow).toHaveClass('custom-class');
  });
});
