# FastRead - Ralph Specifications

This folder contains all specifications and configuration files for building FastRead using the Ralph Wiggum AI development methodology.

## What is FastRead?

A speed reading web application optimized for academic articles, featuring:

- RSVP (Rapid Serial Visual Presentation) word-by-word display
- Academic PDF parsing (handles two-column layouts, removes noise)
- Citation management (skip, read, or interactively save citations)
- Auto-speed increase option
- Cross-device sync with user accounts
- Works on phone, tablet, and desktop (PWA)

## File Structure

```
ralph-specs/
├── README.md               # This file
├── AGENTS.md               # Tech stack, commands, project structure
├── IMPLEMENTATION_PLAN.md  # Task list (managed by Ralph)
├── PROMPT_plan.md          # Planning mode prompt
├── PROMPT_build.md         # Build mode prompt
├── loop.sh                 # Bash loop for continuous operation
└── specs/
    ├── pdf-parsing.md      # PDF extraction requirements
    ├── speed-reader.md     # RSVP engine requirements
    ├── citation-handling.md # Citation system requirements
    ├── user-auth-sync.md   # Auth & sync requirements
    └── ui-design.md        # UI/UX design system
```

## How to Use with Ralph

### Prerequisites

- Claude CLI installed and configured
- Node.js 18+ installed
- Git initialized in project folder

### Step 1: Plan First

Run planning mode to analyze specs and create/update the implementation plan:

```bash
cd ralph-specs
./loop.sh plan
```

This will:

- Read all specs
- Analyze gaps between specs and code
- Update `IMPLEMENTATION_PLAN.md` with prioritized tasks

Run planning once at start, then again whenever you want to reassess.

### Step 2: Build Loop

Run build mode to implement features one task at a time:

```bash
cd ralph-specs
./loop.sh build
```

This will:

- Pick the next task from the plan
- Implement it
- Run tests
- Commit if passing
- Loop to next task

Let it run continuously. Press Ctrl+C to stop.

### Step 3: Manual Override

If you need to direct Ralph to a specific task, edit `IMPLEMENTATION_PLAN.md`:

- Update the "Current Focus" section
- Or reorder tasks

Ralph will pick up the change on next iteration.

## Tech Stack (Summary)

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth & DB**: Supabase
- **PDF Parsing**: pdf.js (client-side)
- **State**: Zustand
- **Testing**: Vitest + Playwright

See `AGENTS.md` for full details.

## Quick Reference

### Key Commands

```bash
npm run dev          # Start dev server
npm run type-check   # TypeScript validation
npm run lint         # ESLint
npm run test         # Run tests
npm run build        # Production build
```

### Quality Gates

Before any task is "done":

- [ ] TypeScript compiles
- [ ] No lint errors
- [ ] Tests pass
- [ ] Works in browser

### Spec Priority

When in doubt, the specs are the source of truth:

1. `specs/*.md` defines WHAT to build
2. `AGENTS.md` defines HOW to build
3. `IMPLEMENTATION_PLAN.md` defines WHEN to build

## Troubleshooting

### Ralph keeps failing on same task

- Check if dependencies are actually complete
- May need to break task into smaller pieces
- Run planning mode to reassess

### Tests failing

- Don't skip - fix them
- May indicate spec ambiguity
- Add clarification to spec if needed

### Claude running out of context

- Tasks may be too large
- Break into smaller tasks in plan
- Each task should be < 1000 lines of code change

## Support

This project uses the Ralph Wiggum methodology.
Learn more: https://github.com/ghuntley/how-to-ralph-wiggum
