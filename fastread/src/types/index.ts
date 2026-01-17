// FastRead Type Definitions

export interface ParsedDocument {
  id: string;
  originalFileName: string;
  title: string | null;
  authors: string[] | null;
  sections: Section[];
  rawText: string;
  cleanedText: string;
  citations: DetectedCitation[];
  parsingConfidence: number;
  createdAt: Date;
}

export interface Section {
  type:
    | 'abstract'
    | 'introduction'
    | 'methods'
    | 'results'
    | 'discussion'
    | 'conclusion'
    | 'references'
    | 'appendix'
    | 'other';
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
  included: boolean;
}

export interface DetectedCitation {
  id: string;
  rawText: string;
  startIndex: number;
  endIndex: number;
  pattern: string;
  parsed: {
    authors: string[];
    year: number;
    pages?: string;
  };
}

export interface SavedCitation {
  id: string;
  documentId: string;
  rawText: string;
  authors: string[];
  year: number;
  pageNumber?: string;
  context: string;
  savedAt: Date;
  position: number;
}

export interface ReadingSession {
  id: string;
  documentId: string;
  userId: string;
  currentWordIndex: number;
  currentSpeed: number;
  autoSpeedEnabled: boolean;
  autoSpeedSettings: AutoSpeedSettings;
  startedAt: Date;
  lastActiveAt: Date;
  wordsRead: number;
  totalPauseTime: number;
}

export interface AutoSpeedSettings {
  enabled: boolean;
  increaseEveryWords: number;
  increaseAmount: number;
  maxSpeed: number;
}

export interface ReaderSettings {
  defaultSpeed: number;
  chunkSize: 1 | 2 | 3;
  showContextWindow: boolean;
  pauseOnPunctuation: boolean;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  theme: 'light' | 'dark' | 'sepia';
  orpHighlightColor: string;
}

export interface CitationSettings {
  defaultMode: 'skip' | 'read' | 'interactive';
  interactiveTimeout: number;
  highlightColor: string;
  hapticFeedback: boolean;
  soundFeedback: boolean;
}

export type CitationMode = 'skip' | 'read' | 'interactive';
