import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { CitationOverlay } from './CitationOverlay';
import { useCitationStore } from '@/stores/citation-store';
import { useReaderStore } from '@/stores';

describe('CitationOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCitationStore.getState().reset();
    useReaderStore.getState().reset();

    // Set up a mock document
    useReaderStore.getState().setDocument({
      id: 'test-doc',
      originalFileName: 'test.pdf',
      title: 'Test Document',
      authors: ['Test Author'],
      sections: [],
      rawText: 'This is some text with a citation (Smith, 2020) in it.',
      cleanedText: 'This is some text with a citation (Smith, 2020) in it.',
      citations: [],
      parsingConfidence: 1,
      createdAt: new Date(),
    });
  });

  it('does not render when overlay is not visible', () => {
    render(<CitationOverlay />);
    expect(screen.queryByTestId('citation-overlay')).not.toBeInTheDocument();
  });

  it('renders when overlay is visible with active citation', () => {
    const citation = {
      id: 'test-citation',
      rawText: '(Smith, 2020)',
      startIndex: 35,
      endIndex: 47,
      pattern: 'apa',
      parsed: {
        authors: ['Smith'],
        year: 2020,
      },
    };

    useCitationStore.getState().showOverlay(citation);

    render(<CitationOverlay />);

    expect(screen.getByTestId('citation-overlay')).toBeInTheDocument();
    expect(screen.getByText('Citation Found')).toBeInTheDocument();
    expect(screen.getByTestId('citation-text')).toHaveTextContent('(Smith, 2020)');
  });

  it('displays citation details correctly', () => {
    const citation = {
      id: 'test-citation',
      rawText: '(Jones & Brown, 2019, p. 45)',
      startIndex: 0,
      endIndex: 27,
      pattern: 'apa',
      parsed: {
        authors: ['Jones', 'Brown'],
        year: 2019,
        pages: '45',
      },
    };

    useCitationStore.getState().showOverlay(citation);

    render(<CitationOverlay />);

    expect(screen.getByText('Jones, Brown')).toBeInTheDocument();
    expect(screen.getByText('2019')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('calls onSkip and hides overlay when skip button is clicked', () => {
    const onSkip = vi.fn();
    const citation = {
      id: 'test-citation',
      rawText: '(Smith, 2020)',
      startIndex: 0,
      endIndex: 12,
      pattern: 'apa',
      parsed: {
        authors: ['Smith'],
        year: 2020,
      },
    };

    useCitationStore.getState().showOverlay(citation);

    render(<CitationOverlay onSkip={onSkip} />);

    fireEvent.click(screen.getByTestId('skip-citation-btn'));

    expect(onSkip).toHaveBeenCalled();
    expect(useCitationStore.getState().isOverlayVisible).toBe(false);
  });

  it('saves citation and calls onSave when save button is clicked', () => {
    const onSave = vi.fn();
    const citation = {
      id: 'test-citation',
      rawText: '(Smith, 2020)',
      startIndex: 0,
      endIndex: 12,
      pattern: 'apa',
      parsed: {
        authors: ['Smith'],
        year: 2020,
      },
    };

    useCitationStore.getState().showOverlay(citation);

    render(<CitationOverlay onSave={onSave} />);

    fireEvent.click(screen.getByTestId('save-citation-btn'));

    expect(onSave).toHaveBeenCalled();
    expect(useCitationStore.getState().savedCitations).toHaveLength(1);
    expect(useCitationStore.getState().isOverlayVisible).toBe(false);
  });

  it('responds to keyboard shortcuts', () => {
    const onSkip = vi.fn();
    const citation = {
      id: 'test-citation',
      rawText: '(Smith, 2020)',
      startIndex: 0,
      endIndex: 12,
      pattern: 'apa',
      parsed: {
        authors: ['Smith'],
        year: 2020,
      },
    };

    useCitationStore.getState().showOverlay(citation);

    render(<CitationOverlay onSkip={onSkip} />);

    // Press Escape to skip
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onSkip).toHaveBeenCalled();
  });
});
