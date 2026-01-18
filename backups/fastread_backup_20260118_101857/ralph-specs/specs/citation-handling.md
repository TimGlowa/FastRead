# Citation Handling Specification

## Job to Be Done

As a student reading academic articles, I want control over whether to read citations or skip them, so I can either focus on the core argument without interruption OR carefully note sources I might want to reference later.

## Problem Context

Academic articles contain frequent inline citations:

- `(Smith, 2020)`
- `(Author et al., 2019)`
- `(Smith & Jones, 2018)`
- `Author (2020)`
- `(see Smith 2020; Jones 2019)`
- `(Smith, 2020, p. 45)`
- Numbered references: `[1]`, `[2,3,4]`, `[1-5]`

These citations:

- Interrupt reading flow if you don't need them
- Contain valuable source information if you're researching
- Are NOT the same as the References section (which lists full citations)

## User Flow

### Reading Mode Selection (Before Reading)

User chooses citation mode:

1. **Skip Citations** (default): Citations removed from reading flow entirely
2. **Read Citations**: Citations included as normal text
3. **Interactive Mode**: Pause at each citation, let user choose to save or skip

### Interactive Mode Flow

1. Reader reaches a citation
2. Reading pauses automatically
3. Citation displayed with options:
   - "Save" - adds to citation collection
   - "Skip" - continue without saving
   - "Read Aloud" - include in reading flow this time
4. User taps choice
5. Reading continues

### Citation Collection

- Saved citations appear in sidebar/panel
- Can be exported (copy to clipboard, download as text/BibTeX)
- Synced across devices

## Functional Requirements

### FR-CIT-1: Citation Detection

Detect citations matching these patterns:

| Pattern                   | Example                    | Regex                                            |
| ------------------------- | -------------------------- | ------------------------------------------------ |
| Parenthetical author-year | (Smith, 2020)              | `\([A-Z][a-z]+,?\s*\d{4}\)`                      |
| Multiple authors          | (Smith & Jones, 2020)      | `\([A-Z][a-z]+\s*[&,]\s*[A-Z][a-z]+,?\s*\d{4}\)` |
| Et al.                    | (Smith et al., 2020)       | `\([A-Z][a-z]+\s+et\s+al\.?,?\s*\d{4}\)`         |
| Author with year          | Smith (2020)               | `[A-Z][a-z]+\s*\(\d{4}\)`                        |
| Multiple citations        | (Smith, 2020; Jones, 2019) | `\([^)]*\d{4}[^)]*;\s*[^)]*\d{4}[^)]*\)`         |
| Page numbers              | (Smith, 2020, p. 45)       | `\([^)]+\d{4}[^)]+p\.\s*\d+\)`                   |
| Numbered                  | [1], [2,3], [1-5]          | `\[\d+(?:[,-]\s*\d+)*\]`                         |
| IEEE style                | [1], [2]                   | `\[\d+\]`                                        |

Priority: Match longer/more specific patterns first to avoid partial matches.

### FR-CIT-2: Citation Modes

**Mode: Skip Citations**

- Remove detected citations from word stream
- Track removed citations for reference
- Show citation count in UI: "12 citations skipped"
- Option to view skipped citations list

**Mode: Read Citations**

- Include citations as normal words
- Highlight citation text differently (subtle background)
- No special pause behavior

**Mode: Interactive**

- Pause reading when citation reached
- Display citation with context (previous 5 words)
- Show buttons: [Save] [Skip] [Read]
- Track decision for analytics
- If "Save": add to collection, continue
- If "Skip": continue without saving
- If "Read": read citation text aloud/display, then continue

### FR-CIT-3: Citation Collection

```typescript
interface SavedCitation {
  id: string;
  documentId: string;
  rawText: string; // "(Smith et al., 2020)"
  authors: string[]; // ["Smith"]
  year: number; // 2020
  pageNumber?: string; // "p. 45"
  context: string; // "...theories suggest that (Smith et al., 2020) the..."
  savedAt: Date;
  position: number; // word index in document
}
```

### FR-CIT-4: Citation Export

Export formats:

- **Plain text**: List of citations, one per line
- **Markdown**: Formatted list with context
- **BibTeX**: Best-effort conversion (limited without full reference data)
- **Copy to clipboard**: One-click copy

Export includes:

- Citation text
- Context (optional)
- Position in document (page/section if available)

### FR-CIT-5: Citation Settings

User preferences:

- Default citation mode (Skip/Read/Interactive)
- Interactive mode timeout (auto-skip after N seconds)
- Highlight style for citations
- Sound/haptic feedback for citation pause

### FR-CIT-6: Citation Analytics

Track per document:

- Total citations detected
- Citations saved
- Citations skipped
- Most frequent authors cited
- Year range of citations

## Non-Functional Requirements

### NFR-CIT-1: Detection Accuracy

- False positive rate < 5% (text incorrectly flagged as citation)
- False negative rate < 10% (citations missed)
- Handle edge cases gracefully (unusual formatting)

### NFR-CIT-2: Performance

- Citation detection runs during parsing, not reading
- Pre-process all citations before reading starts
- No perceptible delay in Interactive mode

### NFR-CIT-3: Storage

- Store citations locally (IndexedDB)
- Sync to server when online
- Export works offline

## Data Model

```typescript
interface CitationSettings {
  defaultMode: 'skip' | 'read' | 'interactive';
  interactiveTimeout: number; // seconds, 0 = no timeout
  highlightColor: string;
  hapticFeedback: boolean;
  soundFeedback: boolean;
}

interface DocumentCitations {
  documentId: string;
  citations: DetectedCitation[];
  saved: SavedCitation[];
  analytics: CitationAnalytics;
}

interface DetectedCitation {
  id: string;
  rawText: string;
  startIndex: number; // word index
  endIndex: number;
  pattern: string; // which regex matched
  parsed: {
    authors: string[];
    year: number;
    pages?: string;
  };
}

interface CitationAnalytics {
  totalDetected: number;
  totalSaved: number;
  totalSkipped: number;
  totalRead: number;
  topAuthors: { author: string; count: number }[];
  yearRange: { min: number; max: number };
}
```

## UI Mockup: Interactive Mode

```
┌──────────────────────────────────────┐
│                                      │
│         ...theories suggest          │
│                                      │
│    ┌──────────────────────────┐     │
│    │  (Smith et al., 2020)    │     │
│    └──────────────────────────┘     │
│                                      │
│    [💾 Save]  [⏭ Skip]  [📖 Read]   │
│                                      │
│    ────────────────────────────     │
│    Saved: 3 │ Skipped: 7            │
└──────────────────────────────────────┘
```

## Edge Cases

1. **Ambiguous text**: "In 2020, we found..." - not a citation, don't flag
2. **Authors in text**: "Smith argues that..." - not a parenthetical citation
3. **Year ranges**: "(2019-2020)" - probably not a citation
4. **Non-English names**: Handle unicode in author names
5. **Corporate authors**: "(World Health Organization, 2020)"
6. **No year**: "(Smith, n.d.)" - still a citation
7. **Nested parentheses**: Handle gracefully
8. **Citation in footnote**: Treat same as body text

## Acceptance Criteria

- [ ] Citations detected with >90% accuracy on sample article
- [ ] Skip mode removes citations from reading flow
- [ ] Read mode includes citations as normal text
- [ ] Interactive mode pauses at each citation
- [ ] Save button adds citation to collection
- [ ] Citation collection persists across sessions
- [ ] Export to plain text works correctly
- [ ] Settings persist per user
- [ ] Citation count displayed during reading
