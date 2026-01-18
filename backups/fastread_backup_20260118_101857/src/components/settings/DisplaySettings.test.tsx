import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { DisplaySettings } from './DisplaySettings';
import { useReaderStore } from '@/stores';

describe('DisplaySettings', () => {
  beforeEach(() => {
    useReaderStore.getState().reset();
  });

  it('renders theme options', () => {
    render(<DisplaySettings />);

    expect(screen.getByTestId('theme-dark')).toBeInTheDocument();
    expect(screen.getByTestId('theme-light')).toBeInTheDocument();
    expect(screen.getByTestId('theme-sepia')).toBeInTheDocument();
  });

  it('changes theme when option is clicked', () => {
    render(<DisplaySettings />);

    fireEvent.click(screen.getByTestId('theme-light'));

    expect(useReaderStore.getState().settings.theme).toBe('light');
  });

  it('renders font size options', () => {
    render(<DisplaySettings />);

    expect(screen.getByTestId('font-size-small')).toBeInTheDocument();
    expect(screen.getByTestId('font-size-medium')).toBeInTheDocument();
    expect(screen.getByTestId('font-size-large')).toBeInTheDocument();
    expect(screen.getByTestId('font-size-xlarge')).toBeInTheDocument();
  });

  it('changes font size when option is clicked', () => {
    render(<DisplaySettings />);

    fireEvent.click(screen.getByTestId('font-size-large'));

    expect(useReaderStore.getState().settings.fontSize).toBe('large');
  });

  it('renders ORP color options', () => {
    render(<DisplaySettings />);

    expect(screen.getByTestId('orp-color-red')).toBeInTheDocument();
    expect(screen.getByTestId('orp-color-blue')).toBeInTheDocument();
    expect(screen.getByTestId('orp-color-green')).toBeInTheDocument();
  });

  it('changes ORP color when option is clicked', () => {
    render(<DisplaySettings />);

    fireEvent.click(screen.getByTestId('orp-color-blue'));

    expect(useReaderStore.getState().settings.orpHighlightColor).toBe('#3b82f6');
  });

  it('renders context window toggle', () => {
    render(<DisplaySettings />);

    const toggle = screen.getByTestId('context-window-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'false'); // default is false
  });

  it('toggles context window', () => {
    render(<DisplaySettings />);

    const toggle = screen.getByTestId('context-window-toggle');
    fireEvent.click(toggle);

    expect(useReaderStore.getState().settings.showContextWindow).toBe(true);
  });
});
