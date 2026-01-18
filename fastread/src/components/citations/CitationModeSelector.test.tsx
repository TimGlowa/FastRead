import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { useCitationStore } from '@/stores/citation-store';

import { CitationModeSelector } from './CitationModeSelector';

describe('CitationModeSelector', () => {
  beforeEach(() => {
    useCitationStore.getState().reset();
  });

  it('renders all mode options', () => {
    render(<CitationModeSelector />);

    expect(screen.getByTestId('citation-mode-skip')).toBeInTheDocument();
    expect(screen.getByTestId('citation-mode-read')).toBeInTheDocument();
    expect(screen.getByTestId('citation-mode-interactive')).toBeInTheDocument();
  });

  it('shows skip mode as selected by default', () => {
    render(<CitationModeSelector />);

    const skipButton = screen.getByTestId('citation-mode-skip');
    expect(skipButton).toHaveAttribute('aria-checked', 'true');
  });

  it('changes mode when option is clicked', () => {
    render(<CitationModeSelector />);

    fireEvent.click(screen.getByTestId('citation-mode-interactive'));

    expect(useCitationStore.getState().citationMode).toBe('interactive');
    expect(screen.getByTestId('citation-mode-interactive')).toHaveAttribute('aria-checked', 'true');
  });

  it('renders compact version with select dropdown', () => {
    render(<CitationModeSelector compact />);

    expect(screen.getByTestId('citation-mode-select')).toBeInTheDocument();
    expect(screen.queryByTestId('citation-mode-skip')).not.toBeInTheDocument();
  });

  it('compact version changes mode on select', () => {
    render(<CitationModeSelector compact />);

    const select = screen.getByTestId('citation-mode-select');
    fireEvent.change(select, { target: { value: 'interactive' } });

    expect(useCitationStore.getState().citationMode).toBe('interactive');
  });
});
