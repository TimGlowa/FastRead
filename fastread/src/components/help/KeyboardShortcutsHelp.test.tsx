import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

describe('KeyboardShortcutsHelp', () => {
  it('renders help button', () => {
    render(<KeyboardShortcutsHelp />);

    expect(screen.getByTestId('shortcuts-help-button')).toBeInTheDocument();
  });

  it('opens modal when button is clicked', () => {
    render(<KeyboardShortcutsHelp />);

    expect(screen.queryByTestId('shortcuts-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('shortcuts-help-button'));

    expect(screen.getByTestId('shortcuts-modal')).toBeInTheDocument();
  });

  it('displays keyboard shortcuts title', () => {
    render(<KeyboardShortcutsHelp />);

    fireEvent.click(screen.getByTestId('shortcuts-help-button'));

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('displays all shortcuts', () => {
    render(<KeyboardShortcutsHelp />);

    fireEvent.click(screen.getByTestId('shortcuts-help-button'));

    // Check for key shortcuts
    expect(screen.getByText('Space')).toBeInTheDocument();
    expect(screen.getByText('←')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
    expect(screen.getByText('↑')).toBeInTheDocument();
    expect(screen.getByText('↓')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('End')).toBeInTheDocument();
    expect(screen.getByText('Esc')).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument();
  });

  it('displays shortcut descriptions', () => {
    render(<KeyboardShortcutsHelp />);

    fireEvent.click(screen.getByTestId('shortcuts-help-button'));

    expect(screen.getByText('Play / Pause')).toBeInTheDocument();
    // There are multiple shortcuts for speed control (arrows and brackets)
    expect(screen.getAllByText('Increase speed')).toHaveLength(2);
    expect(screen.getAllByText('Decrease speed')).toHaveLength(2);
    expect(screen.getByText('Go to start')).toBeInTheDocument();
    expect(screen.getByText('Go to end')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    render(<KeyboardShortcutsHelp />);

    fireEvent.click(screen.getByTestId('shortcuts-help-button'));
    expect(screen.getByTestId('shortcuts-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('shortcuts-close-button'));
    expect(screen.queryByTestId('shortcuts-modal')).not.toBeInTheDocument();
  });

  it('closes modal when backdrop is clicked', () => {
    render(<KeyboardShortcutsHelp />);

    fireEvent.click(screen.getByTestId('shortcuts-help-button'));
    expect(screen.getByTestId('shortcuts-modal')).toBeInTheDocument();

    // Click the backdrop (the outer container with the click handler)
    const modal = screen.getByTestId('shortcuts-modal');
    const backdrop = modal.querySelector('[aria-hidden="true"]');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(screen.queryByTestId('shortcuts-modal')).not.toBeInTheDocument();
  });

  it('has correct aria attributes', () => {
    render(<KeyboardShortcutsHelp />);

    fireEvent.click(screen.getByTestId('shortcuts-help-button'));

    const modal = screen.getByTestId('shortcuts-modal');
    expect(modal).toHaveAttribute('role', 'dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'shortcuts-title');
  });

  it('applies custom className', () => {
    render(<KeyboardShortcutsHelp className="custom-class" />);

    const button = screen.getByTestId('shortcuts-help-button');
    expect(button).toHaveClass('custom-class');
  });
});
