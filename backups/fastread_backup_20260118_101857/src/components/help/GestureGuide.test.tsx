import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { GestureGuide } from './GestureGuide';

describe('GestureGuide', () => {
  it('renders guide button', () => {
    render(<GestureGuide />);

    expect(screen.getByTestId('gesture-guide-button')).toBeInTheDocument();
  });

  it('opens modal when button is clicked', () => {
    render(<GestureGuide />);

    expect(screen.queryByTestId('gesture-guide-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('gesture-guide-button'));

    expect(screen.getByTestId('gesture-guide-modal')).toBeInTheDocument();
  });

  it('displays touch gestures title', () => {
    render(<GestureGuide />);

    fireEvent.click(screen.getByTestId('gesture-guide-button'));

    expect(screen.getByText('Touch Gestures')).toBeInTheDocument();
  });

  it('displays all gestures', () => {
    render(<GestureGuide />);

    fireEvent.click(screen.getByTestId('gesture-guide-button'));

    expect(screen.getByText('Tap')).toBeInTheDocument();
    expect(screen.getByText('Double Tap')).toBeInTheDocument();
    expect(screen.getByText('Swipe Left')).toBeInTheDocument();
    expect(screen.getByText('Swipe Right')).toBeInTheDocument();
    expect(screen.getByText('Swipe Up')).toBeInTheDocument();
    expect(screen.getByText('Swipe Down')).toBeInTheDocument();
    expect(screen.getByText('Long Press')).toBeInTheDocument();
  });

  it('displays gesture descriptions', () => {
    render(<GestureGuide />);

    fireEvent.click(screen.getByTestId('gesture-guide-button'));

    expect(screen.getByText('Play / Pause')).toBeInTheDocument();
    expect(screen.getByText('Reset to start')).toBeInTheDocument();
    expect(screen.getByText('Skip backward')).toBeInTheDocument();
    expect(screen.getByText('Skip forward')).toBeInTheDocument();
    expect(screen.getByText('Increase speed')).toBeInTheDocument();
    expect(screen.getByText('Decrease speed')).toBeInTheDocument();
    expect(screen.getByText('Pause reading')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(<GestureGuide />);

    fireEvent.click(screen.getByTestId('gesture-guide-button'));
    expect(screen.getByTestId('gesture-guide-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('gesture-guide-close-button'));
    expect(screen.queryByTestId('gesture-guide-modal')).not.toBeInTheDocument();
  });

  it('closes modal when backdrop is clicked', () => {
    render(<GestureGuide />);

    fireEvent.click(screen.getByTestId('gesture-guide-button'));
    expect(screen.getByTestId('gesture-guide-modal')).toBeInTheDocument();

    // Click the backdrop
    const modal = screen.getByTestId('gesture-guide-modal');
    const backdrop = modal.querySelector('[aria-hidden="true"]');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(screen.queryByTestId('gesture-guide-modal')).not.toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    render(<GestureGuide />);

    fireEvent.click(screen.getByTestId('gesture-guide-button'));

    const modal = screen.getByTestId('gesture-guide-modal');
    expect(modal).toHaveAttribute('role', 'dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'gesture-guide-title');
  });

  it('applies custom className', () => {
    render(<GestureGuide className="custom-class" />);

    const button = screen.getByTestId('gesture-guide-button');
    expect(button).toHaveClass('custom-class');
  });
});
