import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AutoSpeedSettings } from './AutoSpeedSettings';

import type { AutoSpeedSettings as AutoSpeedSettingsType } from '@/types';

describe('AutoSpeedSettings', () => {
  const defaultSettings: AutoSpeedSettingsType = {
    enabled: false,
    increaseEveryWords: 100,
    increaseAmount: 25,
    maxSpeed: 600,
  };

  const mockOnSettingsChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component', () => {
    render(
      <AutoSpeedSettings settings={defaultSettings} onSettingsChange={mockOnSettingsChange} />
    );

    expect(screen.getByText('Auto-Speed')).toBeInTheDocument();
    expect(screen.getByTestId('auto-speed-toggle')).toBeInTheDocument();
  });

  it('renders toggle in correct state', () => {
    render(
      <AutoSpeedSettings settings={defaultSettings} onSettingsChange={mockOnSettingsChange} />
    );

    const toggle = screen.getByTestId('auto-speed-toggle');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('renders enabled state correctly', () => {
    const enabledSettings: AutoSpeedSettingsType = {
      ...defaultSettings,
      enabled: true,
    };

    render(
      <AutoSpeedSettings settings={enabledSettings} onSettingsChange={mockOnSettingsChange} />
    );

    const toggle = screen.getByTestId('auto-speed-toggle');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles enabled state', () => {
    render(
      <AutoSpeedSettings settings={defaultSettings} onSettingsChange={mockOnSettingsChange} />
    );

    const toggle = screen.getByTestId('auto-speed-toggle');
    fireEvent.click(toggle);

    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      ...defaultSettings,
      enabled: true,
    });
  });

  it('renders word interval options', () => {
    render(
      <AutoSpeedSettings settings={defaultSettings} onSettingsChange={mockOnSettingsChange} />
    );

    expect(screen.getByTestId('interval-50')).toBeInTheDocument();
    expect(screen.getByTestId('interval-75')).toBeInTheDocument();
    expect(screen.getByTestId('interval-100')).toBeInTheDocument();
    expect(screen.getByTestId('interval-150')).toBeInTheDocument();
    expect(screen.getByTestId('interval-200')).toBeInTheDocument();
  });

  it('changes word interval', () => {
    const enabledSettings: AutoSpeedSettingsType = {
      ...defaultSettings,
      enabled: true,
    };

    render(
      <AutoSpeedSettings settings={enabledSettings} onSettingsChange={mockOnSettingsChange} />
    );

    fireEvent.click(screen.getByTestId('interval-50'));

    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      ...enabledSettings,
      increaseEveryWords: 50,
    });
  });

  it('renders speed increment options', () => {
    render(
      <AutoSpeedSettings settings={defaultSettings} onSettingsChange={mockOnSettingsChange} />
    );

    expect(screen.getByTestId('increment-10')).toBeInTheDocument();
    expect(screen.getByTestId('increment-15')).toBeInTheDocument();
    expect(screen.getByTestId('increment-20')).toBeInTheDocument();
    expect(screen.getByTestId('increment-25')).toBeInTheDocument();
    expect(screen.getByTestId('increment-50')).toBeInTheDocument();
  });

  it('changes speed increment', () => {
    const enabledSettings: AutoSpeedSettingsType = {
      ...defaultSettings,
      enabled: true,
    };

    render(
      <AutoSpeedSettings settings={enabledSettings} onSettingsChange={mockOnSettingsChange} />
    );

    fireEvent.click(screen.getByTestId('increment-50'));

    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      ...enabledSettings,
      increaseAmount: 50,
    });
  });

  it('renders max speed options', () => {
    render(
      <AutoSpeedSettings settings={defaultSettings} onSettingsChange={mockOnSettingsChange} />
    );

    expect(screen.getByTestId('max-speed-400')).toBeInTheDocument();
    expect(screen.getByTestId('max-speed-500')).toBeInTheDocument();
    expect(screen.getByTestId('max-speed-600')).toBeInTheDocument();
    expect(screen.getByTestId('max-speed-700')).toBeInTheDocument();
    expect(screen.getByTestId('max-speed-800')).toBeInTheDocument();
    expect(screen.getByTestId('max-speed-1000')).toBeInTheDocument();
  });

  it('changes max speed', () => {
    const enabledSettings: AutoSpeedSettingsType = {
      ...defaultSettings,
      enabled: true,
    };

    render(
      <AutoSpeedSettings settings={enabledSettings} onSettingsChange={mockOnSettingsChange} />
    );

    fireEvent.click(screen.getByTestId('max-speed-800'));

    expect(mockOnSettingsChange).toHaveBeenCalledWith({
      ...enabledSettings,
      maxSpeed: 800,
    });
  });

  it('shows preview info when enabled', () => {
    const enabledSettings: AutoSpeedSettingsType = {
      ...defaultSettings,
      enabled: true,
    };

    render(
      <AutoSpeedSettings settings={enabledSettings} onSettingsChange={mockOnSettingsChange} />
    );

    expect(screen.getByText(/Starting at 300 WPM/)).toBeInTheDocument();
    // Check for the preview text that mentions reaching the max speed
    expect(screen.getByText(/you'll reach/)).toBeInTheDocument();
  });

  it('does not show preview info when disabled', () => {
    render(
      <AutoSpeedSettings settings={defaultSettings} onSettingsChange={mockOnSettingsChange} />
    );

    expect(screen.queryByText(/Starting at 300 WPM/)).not.toBeInTheDocument();
  });

  it('highlights selected options', () => {
    const settings: AutoSpeedSettingsType = {
      enabled: true,
      increaseEveryWords: 100,
      increaseAmount: 25,
      maxSpeed: 600,
    };

    render(<AutoSpeedSettings settings={settings} onSettingsChange={mockOnSettingsChange} />);

    const interval100 = screen.getByTestId('interval-100');
    const increment25 = screen.getByTestId('increment-25');
    const maxSpeed600 = screen.getByTestId('max-speed-600');

    expect(interval100).toHaveClass('bg-accent-primary');
    expect(increment25).toHaveClass('bg-accent-primary');
    expect(maxSpeed600).toHaveClass('bg-accent-primary');
  });
});
