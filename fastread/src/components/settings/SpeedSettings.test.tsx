import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { useReaderStore } from '@/stores';

import { SpeedSettings } from './SpeedSettings';

describe('SpeedSettings', () => {
  beforeEach(() => {
    useReaderStore.getState().reset();
  });

  it('renders speed slider', () => {
    render(<SpeedSettings />);

    expect(screen.getByTestId('speed-slider')).toBeInTheDocument();
    expect(screen.getByText('300 WPM')).toBeInTheDocument();
  });

  it('updates speed when slider changes', () => {
    render(<SpeedSettings />);

    const slider = screen.getByTestId('speed-slider');
    fireEvent.change(slider, { target: { value: '400' } });

    expect(screen.getByText('400 WPM')).toBeInTheDocument();
    expect(useReaderStore.getState().settings.defaultSpeed).toBe(400);
  });

  it('renders pause on punctuation toggle', () => {
    render(<SpeedSettings />);

    const toggle = screen.getByTestId('pause-punctuation-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'true'); // default is true
  });

  it('toggles pause on punctuation', () => {
    render(<SpeedSettings />);

    const toggle = screen.getByTestId('pause-punctuation-toggle');
    fireEvent.click(toggle);

    expect(useReaderStore.getState().settings.pauseOnPunctuation).toBe(false);
  });

  it('renders chunk size options', () => {
    render(<SpeedSettings />);

    expect(screen.getByTestId('chunk-size-1')).toBeInTheDocument();
    expect(screen.getByTestId('chunk-size-2')).toBeInTheDocument();
    expect(screen.getByTestId('chunk-size-3')).toBeInTheDocument();
  });

  it('changes chunk size when option is clicked', () => {
    render(<SpeedSettings />);

    fireEvent.click(screen.getByTestId('chunk-size-2'));

    expect(useReaderStore.getState().settings.chunkSize).toBe(2);
  });
});
