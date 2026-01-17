import { create } from 'zustand';

import type { DetectedCitation, SavedCitation, CitationMode } from '@/types';

export interface CitationState {
  // Detected citations in current document
  citations: DetectedCitation[];
  citationWordIndices: Map<number, DetectedCitation>;

  // Current citation being displayed (interactive mode)
  activeCitation: DetectedCitation | null;
  isOverlayVisible: boolean;

  // Saved citations
  savedCitations: SavedCitation[];

  // Settings
  citationMode: CitationMode;
  interactiveTimeout: number; // ms before auto-continuing
  highlightColor: string;

  // Actions - Citations
  setCitations: (citations: DetectedCitation[]) => void;
  setCitationWordIndices: (indices: Map<number, DetectedCitation>) => void;
  setActiveCitation: (citation: DetectedCitation | null) => void;

  // Actions - Overlay
  showOverlay: (citation: DetectedCitation) => void;
  hideOverlay: () => void;

  // Actions - Saved
  saveCitation: (citation: SavedCitation) => void;
  removeSavedCitation: (id: string) => void;
  clearSavedCitations: () => void;

  // Actions - Settings
  setCitationMode: (mode: CitationMode) => void;
  setInteractiveTimeout: (timeout: number) => void;
  setHighlightColor: (color: string) => void;

  // Actions - Queries
  isCitationAtIndex: (wordIndex: number) => boolean;
  getCitationAtIndex: (wordIndex: number) => DetectedCitation | undefined;

  // Actions - Reset
  reset: () => void;
}

const initialState = {
  citations: [] as DetectedCitation[],
  citationWordIndices: new Map<number, DetectedCitation>(),
  activeCitation: null as DetectedCitation | null,
  isOverlayVisible: false,
  savedCitations: [] as SavedCitation[],
  citationMode: 'skip' as CitationMode,
  interactiveTimeout: 3000,
  highlightColor: '#fbbf24', // amber-400
};

export const useCitationStore = create<CitationState>((set, get) => ({
  ...initialState,

  // Citations
  setCitations: (citations) => set({ citations }),
  setCitationWordIndices: (indices) => set({ citationWordIndices: indices }),
  setActiveCitation: (citation) => set({ activeCitation: citation }),

  // Overlay
  showOverlay: (citation) =>
    set({
      activeCitation: citation,
      isOverlayVisible: true,
    }),

  hideOverlay: () =>
    set({
      isOverlayVisible: false,
    }),

  // Saved citations
  saveCitation: (citation) =>
    set((state) => ({
      savedCitations: [...state.savedCitations, citation],
    })),

  removeSavedCitation: (id) =>
    set((state) => ({
      savedCitations: state.savedCitations.filter((c) => c.id !== id),
    })),

  clearSavedCitations: () => set({ savedCitations: [] }),

  // Settings
  setCitationMode: (mode) => set({ citationMode: mode }),
  setInteractiveTimeout: (timeout) => set({ interactiveTimeout: timeout }),
  setHighlightColor: (color) => set({ highlightColor: color }),

  // Queries
  isCitationAtIndex: (wordIndex) => {
    const { citationWordIndices } = get();
    return citationWordIndices.has(wordIndex);
  },

  getCitationAtIndex: (wordIndex) => {
    const { citationWordIndices } = get();
    return citationWordIndices.get(wordIndex);
  },

  // Reset
  reset: () => set(initialState),
}));
