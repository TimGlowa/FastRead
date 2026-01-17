# FastRead - Claude Code Instructions

## Project Overview

FastRead is an RSVP (Rapid Serial Visual Presentation) speed reading application for academic papers.

**Tech Stack:**
- Next.js 16 with App Router
- React 19, TypeScript 5
- Tailwind CSS 4
- Supabase (auth + database)
- Vitest for unit tests, Playwright for e2e
- pdfjs-dist for PDF parsing
- Zustand for state management

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run test         # Run tests
npm run test:watch   # Tests in watch mode
npm run format       # Prettier format
```

## Project Structure

```
src/
  app/           # Next.js App Router pages
  components/    # React components
  lib/           # Shared utilities
    text-processor/  # Tokenizer for RSVP
    supabase/        # Database client
    pwa/             # Service worker registration
  stores/        # Zustand stores
  types/         # TypeScript type definitions
```

## Quality Gates

Before any task is complete:
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] No lint errors (`npm run lint`)
- [ ] Tests pass (`npm run test`)

---

# Core Rules

## Rule 1: One Task at a Time

- Implement ONLY ONE task per iteration
- Do not skip ahead to other tasks
- Do not refactor unrelated code
- All tests must pass before committing

## Rule 2: Verify Before Commit

Run this verification command before every commit:
```bash
npm run type-check && npm run lint && npm run test
```

If verification fails:
1. Read the error output carefully
2. Fix the specific issue
3. Re-run verification
4. Repeat until all checks pass

Do not commit failing code.

## Rule 3: Conventional Commits

Use conventional commit format:
- `feat: add RSVP display component`
- `fix: handle empty PDF text`
- `test: add tokenizer edge cases`
- `refactor: simplify timing engine`
- `docs: update README`

## Rule 4: Exit After Completion

After completing ONE task:
1. Commit the changes
2. Update IMPLEMENTATION_PLAN.md
3. Exit immediately

Do not start the next task in the same session.

---

# Feature Specifications

## Speed Reader (RSVP Engine)

### Word Display
- Display single word at center of screen
- Highlight ORP (Optimal Recognition Point):
  - Words 1-3 chars: highlight 1st letter
  - Words 4-6 chars: highlight 2nd letter
  - Words 7-9 chars: highlight 3rd letter
  - Words 10+ chars: highlight 4th letter

### Speed Control
- Default: 300 WPM
- Range: 100-1000 WPM
- Increments: 25 WPM steps
- Keyboard: Up/Down arrows

### Punctuation Pauses
- Comma: +50ms
- Semicolon/colon: +100ms
- Period/question/exclamation: +150ms
- Paragraph break: +300ms

### Controls
| Control | Keyboard | Touch |
|---------|----------|-------|
| Play/Pause | Space | Tap center |
| Speed up | Up or ] | Swipe up |
| Speed down | Down or [ | Swipe down |
| Skip forward | Right | Swipe right |
| Skip back | Left | Swipe left |

### Performance Requirements
- 60fps animation
- Timing precision ±10ms
- Use requestAnimationFrame

---

## PDF Parsing

### Requirements
- Accept PDFs up to 50MB
- Client-side extraction with pdf.js
- Detect two-column layouts
- Parse page-by-page, left column then right

### Noise Filtering (Auto-remove)
- Page headers/footers (repeated text)
- Page numbers
- DOIs: `10\.\d{4,}/[^\s]+`
- URLs, emails
- Figure/table captions
- License text

### Section Detection
Detect: Abstract, Introduction, Methods, Results, Discussion, Conclusion, References, Appendix

### Text Cleaning
- Normalize whitespace
- Fix hyphenation: "meth-\nod" → "method"
- Preserve paragraph breaks

---

## Citation Handling

### Detection Patterns
- `(Smith, 2020)` - parenthetical
- `(Smith & Jones, 2020)` - multiple authors
- `(Smith et al., 2020)` - et al
- `Smith (2020)` - author with year
- `[1]`, `[2,3]`, `[1-5]` - numbered

### Citation Modes
1. **Skip Citations**: Remove from reading flow
2. **Read Citations**: Include as normal text
3. **Interactive**: Pause at each, offer Save/Skip/Read

### Citation Collection
- Store saved citations
- Export: plain text, markdown, BibTeX
- Sync across devices

---

## UI Design

### Themes
- Dark (default): #0a0a0a background, #ffffff text
- Light: #ffffff background, #1a1a1a text
- Sepia: #f4ecd8 background, #433422 text

### Typography
- Display font: Inter
- Reading font: Literata (default), Inter, OpenDyslexic, Atkinson Hyperlegible
- Font sizes: Small (24-36px), Medium (32-48px), Large (40-64px), X-Large (48-80px)

### Touch Targets
- Minimum 44x44px
- 8px minimum spacing

### Accessibility
- WCAG AA contrast
- Keyboard fully navigable
- Screen reader support
- Reduced motion respected

---

## User Auth & Sync

### Authentication (Supabase)
- Email/password
- Google OAuth
- Magic link (passwordless)
- Guest mode (full functionality, local storage)

### Sync Strategy
- Optimistic updates
- Debounce syncs (5 seconds)
- Offline-first: queue changes, sync when online
- Conflict resolution: newest timestamp wins

### What Syncs
- Document metadata and parsed text
- Reading position (real-time)
- User settings
- Saved citations

---

# Data Models

```typescript
interface ReadingSession {
  id: string;
  documentId: string;
  userId: string;
  currentWordIndex: number;
  currentSpeed: number;
  autoSpeedEnabled: boolean;
}

interface ReaderSettings {
  defaultSpeed: number;
  chunkSize: 1 | 2 | 3;
  showContextWindow: boolean;
  pauseOnPunctuation: boolean;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  theme: 'light' | 'dark' | 'sepia';
  orpHighlightColor: string;
}

interface ParsedDocument {
  id: string;
  title: string | null;
  sections: Section[];
  cleanedText: string;
  citations: Citation[];
  parsingConfidence: number;
}

interface SavedCitation {
  id: string;
  documentId: string;
  rawText: string;
  authors: string[];
  year: number;
  context: string;
  savedAt: Date;
}
```

---

# Implementation Plan Reference

Current status is tracked in `fastread/ralph-specs/IMPLEMENTATION_PLAN.md`

## Completed
- Project setup with Next.js 16, React 19, TypeScript
- Basic tokenizer for RSVP text processing
- Type definitions for documents, sessions, settings
- Supabase client setup
- PWA registration setup
- Base layout with fonts

## Up Next
1. Create Zustand store for reader state
2. Create RSVP display component
3. Add ORP calculation utility
4. Create reader controls component
5. Add timing engine with requestAnimationFrame
6. Implement punctuation pause logic
7. Create PDF upload component
8. Add PDF text extraction service

---

# Workflow

## Planning Mode
1. Read specs in `fastread/ralph-specs/specs/`
2. Read current implementation plan
3. Analyze codebase
4. Update `IMPLEMENTATION_PLAN.md`
5. Exit

## Build Mode
1. Read `IMPLEMENTATION_PLAN.md`
2. Find next incomplete task
3. Implement ONE task
4. Run `npm run type-check && npm run lint && npm run test`
5. If fails, fix and re-run
6. If passes, commit
7. Update plan, mark task complete
8. Exit
