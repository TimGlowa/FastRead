# FastRead Implementation Plan

Generated: Initial plan

## Completed
- [x] Project setup with Next.js 16, React 19, TypeScript
- [x] Basic tokenizer for RSVP text processing (src/lib/text-processor/tokenizer.ts)
- [x] Tokenizer tests (src/lib/text-processor/tokenizer.test.ts)
- [x] Type definitions for documents, sessions, settings (src/types/index.ts)
- [x] Supabase client setup (src/lib/supabase/)
- [x] PWA registration setup (src/lib/pwa/)
- [x] Base layout with fonts (src/app/layout.tsx)

## In Progress
- [ ] None

## Up Next
- [ ] Create Zustand store for reader state (src/stores/reader-store.ts)
- [ ] Create RSVP display component (src/components/rsvp/RSVPDisplay.tsx)
- [ ] Add ORP calculation utility (src/lib/text-processor/orp.ts)
- [ ] Create reader controls component (src/components/rsvp/ReaderControls.tsx)
- [ ] Add timing engine with requestAnimationFrame (src/lib/rsvp/timing-engine.ts)
- [ ] Implement punctuation pause logic in timing engine
- [ ] Create PDF upload component (src/components/pdf/PDFUpload.tsx)
- [ ] Add PDF text extraction service (src/lib/pdf/extract-text.ts)

## Backlog
- [ ] Section detection for academic papers
- [ ] Citation detection regex patterns
- [ ] Interactive citation mode UI
- [ ] Saved citations Supabase integration
- [ ] Settings page with reader preferences
- [ ] Reading session persistence
- [ ] Auto-speed increase feature
- [ ] Context window display
- [ ] Keyboard shortcuts
- [ ] Mobile gesture controls
