# FastRead Development Log

## Versioning Guidelines

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR (x.0.0)**: Breaking changes, incompatible API changes, major rewrites
- **MINOR (0.x.0)**: New features, backward-compatible functionality additions
- **PATCH (0.0.x)**: Bug fixes, minor improvements, documentation updates

**Every change must increment the version.** Update `package.json` accordingly.

---

## 2026-01-31 - v1.2.0: OCR Support for Scanned PDFs

### Summary
Added automatic OCR for scanned/image-based PDFs using Tesseract.js. PDFs that contain only copyright watermarks (no searchable text) now get OCR'd to extract actual content.

### Changes Made

**`src/lib/pdf/extract-text.ts`:**
- Added `extractTextWithOCR()` function using Tesseract.js
- Auto-detects scanned PDFs by checking if only copyright watermark exists
- Renders each PDF page to canvas at 2x scale for better OCR accuracy
- Dynamically imports Tesseract only when needed (lazy loading)

**`src/lib/text-processor/tokenizer.ts`:**
- Added `splitConcatenatedWords()` to handle OCR artifacts
- Splits words that get stuck together (e.g., "andamatrix" → "and a matrix")
- Preserves legitimate words like "organization", "examination"

**`package.json`:**
- Added tesseract.js dependency
- Version bump to 0.2.0

### Technical Notes
- OCR is slow (~2-5 seconds per page) but runs only for scanned PDFs
- Uses canvas rendering at 2x viewport scale for better OCR accuracy
- Tesseract worker is terminated after use to free memory

### Files Modified
- `src/lib/pdf/extract-text.ts`
- `src/lib/text-processor/tokenizer.ts`
- `package.json`

---

## 2026-01-31 - v0.1.1: Detect Image-Only PDFs

### Summary
Fixed issue where scanned/image-based PDFs (common from ProQuest and library databases) would show only a copyright watermark repeated endlessly instead of article content.

### Root Cause
PDFs from academic databases like ProQuest are often scanned images converted with tools like `image2pdf`. These contain no searchable text layer - only a copyright watermark overlay:
> "Reproduced with permission of the copyright owner. Further reproduction prohibited without permission."

PDF.js extracts only this watermark, leading to the same sentence displayed on loop.

### Changes Made

**`src/components/pdf/PDFUpload.tsx`:**
- Added detection for image-only PDFs that contain only copyright watermark
- Shows clear error message explaining the PDF needs OCR or a text-based version

**`src/lib/text-processor/text-cleaner.ts`:**
- Added ProQuest copyright watermark pattern to `removeCopyrightNotices()`
- Ensures watermarks are stripped from PDFs that do have real content

### Files Modified
- `src/components/pdf/PDFUpload.tsx`
- `src/lib/text-processor/text-cleaner.ts`
- `package.json` (version bump to 0.1.1)

---

## 2026-01-27 - Azure Deployment Lessons Learned (from BuzzBuilder)

### Summary
Reference notes from deploying BuzzBuilder to Azure App Service (Jan 8-9, 2026). These lessons apply directly to FastRead's upcoming Azure deployment. The BuzzBuilder deploy consumed 20+ commits before the app was live due to invisible failures. Documenting here so we don't repeat these mistakes.

### Problem Chain 1: Oryx Build System Interference
Azure App Service has a built-in build system called Oryx that auto-detects Node.js apps and tries to manage the build/start process. Even with a custom startup command (`node server.js`), Oryx was:
- Detecting an old `oryx-manifest.toml` left in `/home/site/wwwroot`
- Ignoring the `WEBSITE_STARTUP_COMMAND` setting
- Extracting its own `node_modules.tar.gz` and running `npm start` instead

**Fix:** SSH into Kudu console, delete `oryx-manifest.toml` and `node_modules.tar.gz`. Set env vars:
```
ENABLE_ORYX_BUILD=false
SCM_DO_BUILD_DURING_DEPLOYMENT=false
```

### Problem Chain 2: Hidden .next Folder Not Copied
GitHub Actions workflow used `cp -r .next/standalone/* ./deploy/` to package the standalone build. In Bash, `*` does not match hidden files/directories (those starting with `.`). The `.next` folder inside `standalone/` (which contains the critical `BUILD_ID` file) was silently skipped.

The app deployed but Next.js crashed with: `Error: Could not find a production build in the './.next' directory`

**Fix:** Add `shopt -s dotglob` before the copy command to make `*` include hidden files.

### Problem Chain 3: .next Folder Overwritten
After fixing dotglob, a subsequent line ran `mkdir -p ./deploy/.next` before copying static files. This replaced the existing `.next` folder (correctly copied from standalone), destroying `BUILD_ID` and server files.

**Fix:** Remove `mkdir -p` and copy static files directly into the existing folder:
```bash
cp -r .next/static ./deploy/.next/
```

### Problem Chain 4: OAuth Post-Deployment Issues
After the app was live, auth issues cascaded:
- Auth.js v5 requires `trustHost: true` behind reverse proxies like Azure App Service
- OAuth callback URLs need to be registered for the production domain (not just localhost)
- JWT callback must persist email from the provider for session lookups
- React Hooks ordering violations (useState/useEffect after early returns) caused Error #310

### Prevention Checklist for FastRead Azure Deploy

1. **Test standalone build locally first:**
   ```bash
   npm run build
   node .next/standalone/server.js
   ```

2. **Use a Dockerfile** - Removes Oryx entirely. You control exactly what's copied and how the app starts.

3. **Pre-deployment checklist for new platforms:**
   - Register all production OAuth callback URLs
   - Set `trustHost: true` for apps behind reverse proxies
   - Verify all environment variables are set
   - Test auth flows end-to-end on the production URL

4. **Validate deployment package in CI:**
   ```yaml
   - name: Verify deployment package
     run: |
       echo "Checking for required files..."
       test -f ./deploy/server.js || (echo "MISSING: server.js" && exit 1)
       test -f ./deploy/.next/BUILD_ID || (echo "MISSING: .next/BUILD_ID" && exit 1)
       test -d ./deploy/.next/static || (echo "MISSING: .next/static" && exit 1)
       ls -la ./deploy/.next/
   ```

5. **Bash glob awareness:** Always use `shopt -s dotglob` or explicit copies for dotfiles.

### Core Lesson
Most time was lost to invisible failures -- commands that succeeded but didn't do what was expected (silent glob misses, Oryx silently taking over, `mkdir -p` silently replacing a directory). Add explicit verification steps after each operation.

---

## 2026-01-19 09:35 - Increased Word Display Area

### Summary
Increased the reading stage dimensions to accommodate longer words that were spilling over.

### Changes Made
- Increased left/right word part widths from 220px to 280px each
- Increased top/bottom boundary lines from w-80 (320px) to 600px
- Total word display area now ~600px wide (280 + anchor + 280)

### Files Modified
- `src/components/rsvp/RSVPDisplay.tsx`

### Test Results
- Build succeeds

---

## 2026-01-19 09:30 - Mode Icon Simplification

### Summary
Simplified mode icon display - removed pulsing dot, now shows up arrow when speed is increasing.

### Changes Made
- Removed pulsing amber dot (unnecessary visual distraction)
- Mode icon now changes to up arrow (↗) when speed is actively ramping
- When not ramping, shows the mode icon:
  - **Fixed mode (—)**: Horizontal dash
  - **Training mode (↗)**: Up arrow
  - **Demo mode (⚡)**: Lightning bolt

### Behavior
- Fixed mode: Always shows dash (—)
- Training/Demo mode when idle: Shows mode icon (↗ or ⚡)
- Training/Demo mode when ramping: Shows up arrow (↗) to indicate speed is increasing

### Files Modified
- `src/components/rsvp/ReaderControls.tsx`

### Test Results
- Build succeeds

---

## 2026-01-19 09:25 - Mode Icon & Character Spacing Fix

### Summary
Added mode indicator icon next to WPM display and enhanced character spacing fix for PDF text extraction.

### Changes Made

#### 1. Mode Icon Next to WPM Display (`ReaderControls.tsx`)
- Added mode indicator icon that always appears next to WPM (e.g., "357 wpm —")
- **Fixed mode (—)**: Horizontal dash icon
- **Training mode (↗)**: Up arrow icon
- **Demo mode (⚡)**: Lightning bolt icon
- SpeedModeIndicator button remains as settings trigger

#### 2. Enhanced Character Spacing (`text-cleaner.ts`)
- Rewrote `fixLigatures()` with 5-pass approach:
  - Pass 1: Explicit ligature patterns (ffi, ffl, ff, fi, fl)
  - Pass 2: Iterative fix for single-letter splits (up to 5 iterations)
  - Pass 3: Two-character splits with expanded word list
  - Pass 4: Single-letter island cleanup
  - Pass 5: Final adjacent single letter cleanup
- Now catches complex patterns like "ent r epreneurship" → "entrepreneurship"

### Files Modified
- `src/components/rsvp/ReaderControls.tsx` - Mode icon next to WPM
- `src/lib/text-processor/text-cleaner.ts` - Enhanced fixLigatures()

### Test Results
- All 325 tests passing
- Build succeeds

---

## 2026-01-19 09:10 - Implementation Complete (No API)

### Status
PDF text extraction improvements complete using **regex-based approach only**. No external API integration.

### Approach Decision
Chose regex-based text cleaning instead of AI API for:
- **Zero latency** - Instant processing
- **No API costs** - Free to run
- **Works offline** - No network required
- **No dependencies** - Self-contained
- **Privacy** - Text never leaves device

### Note
OpenAI API integration was considered but deferred. The regex-based fixes should handle most PDF extraction issues. If edge cases emerge that regex can't handle, AI-assisted cleaning can be added later.

---

## 2026-01-19 09:05 - PDF Text Extraction Improvements

### Summary
Fixed multiple issues with PDF text processing for RSVP reading. Implemented ligature fixing, em-dash handling, punctuation attachment, improved hyphenation detection, enhanced body content extraction, and changed text color to white.

### Issues Fixed

1. **Ligature Extraction** - PDF.js renders ligatures (fi, fl, ff, ffi, ffl) as separate characters with spaces. Added `fixLigatures()` to rejoin them.

2. **Em-Dash Handling** - Em-dashes were appearing as separate words. Added `fixEmDashes()` to attach them to the preceding word.

3. **Punctuation Spacing** - Apostrophes and punctuation were getting separated from words (e.g., "founder ' s"). Added `fixPunctuationSpacing()` to fix this.

4. **Hyphenation** - Words split across PDF lines (e.g., "iden- tify") weren't being rejoined properly. Enhanced `fixLineBreakHyphenation()` with better heuristics to distinguish broken words from compound words.

5. **Body Extraction** - Added `extractBodyContent()` to remove metadata before abstract and content after references section. Also removes journal headers, download info, and other first-page artifacts.

6. **Text Color** - Changed word display from gray (`text-neutral-400`) to white (`text-white`) for better contrast. ORP character remains red.

### Files Modified

- `src/lib/text-processor/text-cleaner.ts`:
  - Added `fixLigatures()` function
  - Added `fixEmDashes()` function
  - Added `fixPunctuationSpacing()` function
  - Added `extractBodyContent()` function
  - Updated `cleanAcademicText()` with correct processing order
  - Updated `CleanTextOptions` interface

- `src/lib/text-processor/tokenizer.ts`:
  - Enhanced `fixLineBreakHyphenation()` with compound word detection

- `src/lib/text-processor/index.ts`:
  - Added exports for new functions

- `src/components/rsvp/RSVPDisplay.tsx`:
  - Changed text color from `text-neutral-400` to `text-white`

### Processing Order
The text cleaning now follows this order (order matters!):
1. Fix ligatures (before other processing)
2. Fix punctuation spacing
3. Fix em-dashes
4. Extract body content
5. Existing cleaning functions (URLs, copyright, etc.)
6. Final whitespace normalization

### Test Results
- All 325 tests passing
- Build succeeds

---

## 2026-01-19 08:49 - Session Checkpoint

### Summary
Session checkpoint after speed control modes implementation. All features verified working, tests passing, build successful. Creating backup.

### Status
- Speed control modes (Fixed, Training, Demo) fully implemented
- Spacebar ramp pause/resume working
- Discrete ramp indicator with blinking animation working
- All 325 tests passing
- Build succeeds

### Git
- Commit: `6f053e7` - feat: add speed control modes with ramp pause/resume
- Pushed to remote

---

## 2026-01-19 08:40 - Speed Control Modes Implementation

### Summary
Implemented three speed control modes for the RSVP reader: Fixed (constant speed), Training (adaptive ramp with strain detection), and Demo (aggressive time-based ramp). Added discrete UI with spacebar ramp pause/resume and visual ramp indicator.

### Features Implemented

#### 1. Speed Control Modes (`src/lib/rsvp/speed-controller/`)

**Fixed Mode** (`fixed-controller.ts`):
- User-controlled constant speed
- No automatic ramping
- Punctuation pauses still apply

**Training Mode** (`training-controller.ts`):
- Adaptive ramp from start speed to max speed
- State machine: IDLE → STABILIZATION → ACCELERATION → PLATEAU (with COOLDOWN)
- Strain detection: pauses >3s or rewinds >20 words trigger cooldown
- Speed increases only at sentence boundaries
- Drops back 50 WPM on strain, resumes after 100 words

**Demo Mode** (`demo-controller.ts`):
- Aggressive time-based ramp (~35 seconds to max)
- Ease-out curve for natural feel
- No behavioral adaptation - user must manually pause
- Reduced punctuation pauses at high speeds

#### 2. Spacebar Ramp Pause/Resume
- Pressing spacebar while ramping pauses at current speed
- Pressing spacebar again resumes ramp from current speed
- Works in both Training and Demo modes

#### 3. Discrete Ramp Indicator
- Shows up arrow (↑) next to WPM when ramping
- Arrow blinks 3 times when ramp starts
- No arrow shown when holding at constant speed
- Speed display fades in Demo mode during active ramp

#### 4. Strain Detector (`strain-detector.ts`)
- Monitors user pauses and rewinds
- Triggers cooldown on strain signals
- Configurable thresholds

### Files Created
- `src/lib/rsvp/speed-controller/types.ts` - All interfaces and types
- `src/lib/rsvp/speed-controller/fixed-controller.ts` - Fixed mode controller
- `src/lib/rsvp/speed-controller/training-controller.ts` - Training mode controller
- `src/lib/rsvp/speed-controller/demo-controller.ts` - Demo mode controller
- `src/lib/rsvp/speed-controller/strain-detector.ts` - Behavioral strain detection
- `src/lib/rsvp/speed-controller/index.ts` - Module exports
- `src/hooks/useSpeedController.ts` - React hook for speed controller
- `src/components/rsvp/SpeedModeIndicator.tsx` - Discrete mode selector UI

### Files Modified
- `src/types/index.ts` - Added SpeedControlMode, RampPhase, config types
- `src/stores/reader-store.ts` - Added speed mode state and actions
- `src/components/rsvp/ReaderControls.tsx` - Integrated mode indicator, pause-on-change, ramp indicator
- `src/components/rsvp/index.ts` - Export new component
- `src/hooks/index.ts` - Export new hook
- `src/app/page.tsx` - Wired up speed controller to timing engine

### UX Behavior
- **Pause-on-change**: Adjusting speed (+/-) pauses reading; user must press play to resume
- **Mode switching**: Changing modes pauses reading
- **Spacebar toggle**: Pauses/resumes ramp without stopping reading
- **Visual feedback**: Blinking arrow on ramp start, steady arrow during ramp, no arrow when holding

### Test Results
- All 325 tests passing
- Build succeeds

---

## 2026-01-18 19:45 - Content Cleaning & UI Improvements

### Summary
Major update to improve content quality and UI discreteness. PDF text is now cleaned to remove non-essential content, citations are reformatted to short form, and controls are redesigned to be less invasive.

### Features Implemented

#### 1. Text Cleaning (`src/lib/text-processor/text-cleaner.ts`)
New utility to clean academic PDF content:
- **Remove URLs** - http/https links, www, doi.org
- **Remove copyright notices** - ©, (c), "all rights reserved", license statements
- **Remove publisher codes** - DOI, ISBN, ISSN, arXiv, PMID, page ranges
- **Remove table/figure descriptions** - "Table 1:", "Figure 2:", etc.
- **Remove page artifacts** - page numbers, headers/footers
- **Remove boilerplate** - acknowledgments, funding statements, author contributions
- **Remove emails** - user@domain.com patterns

#### 2. Citation Formatting
Citations are automatically reformatted to short form:
- `(Blow, Joe and Smith, Sally "Title...", Journal, 2023)` → `(Blow et al., 2023)`
- Single author: `(Smith, 2023)`
- Multiple authors: `(Smith et al., 2023)`

#### 3. Discrete Controls (`ReaderControls.tsx`)
Redesigned controls to be minimal and non-invasive:
- **Muted colors** - `neutral-500/600` instead of bold colors
- **Outline play button** - Border only, no filled background
- **Simple +/- icons** - Clean line icons for speed control
- **Auto-speed toggle** - Button to enable automatic speed increase every X words
- **Transcript button** - Opens full text view for debugging

#### 4. Journal Citation Display
- Shows document title/citation at top of reader
- Uses discrete `neutral-600` color to match overall design

#### 5. Transcript Modal
- Full-screen modal showing cleaned document text
- Shows word count, current position, estimated reading time
- Allows user to review what content was extracted

### Files Created
- `src/lib/text-processor/text-cleaner.ts` - Text cleaning utilities

### Files Modified
- `src/lib/text-processor/index.ts` - Export new functions
- `src/components/pdf/PDFUpload.tsx` - Integrate text cleaning
- `src/components/rsvp/ReaderControls.tsx` - Discrete styling, auto-speed, transcript button
- `src/app/page.tsx` - Journal citation header, transcript modal
- `src/types/index.ts` - Add journalCitation, abstract fields

### Test Results
- All 325 tests passing
- Build succeeds

---

## 2026-01-18 19:30 - Implementation Complete

### Summary
Vertically framed reading stage implemented and verified. All tests passing.

### Implementation Status

#### Completed
- [x] Vertically framed stage with top/bottom boundaries (no side walls)
- [x] Center ticks aligned with anchor point
- [x] Fixed-width ORP character (0.65em with width/minWidth/maxWidth)
- [x] Three-part word rendering (left right-aligned, anchor fixed, right left-aligned)
- [x] Fixed 220px width for left/right parts
- [x] Controls hidden during playback
- [x] All 325 tests passing

#### Visual Layout
```
               ─────────────────────────
                         │

         [left]         [R]         [right]

                         │
               ─────────────────────────
```

#### Key Design Decisions
1. **No side walls** - Stage defined only by horizontal boundaries
2. **Fixed anchor width** - `0.65em` prevents jitter between words
3. **Fixed part widths** - `220px` for left/right ensures consistent layout
4. **Muted colors** - `neutral-400` text, `red-500` ORP, `neutral-950` background

---

## 2026-01-18 19:28 - Vertically Framed Reading Stage

### Summary
Implemented proper RSVP reader design with vertically framed stage as specified.

### Changes Made

**RSVPDisplay.tsx** - Complete redesign with:
1. **Vertically framed stage** - Top and bottom horizontal boundaries only (no side walls)
2. **Center ticks** - Vertical tick marks at top and bottom aligned with anchor point
3. **Fixed anchor positioning** - ORP character sits in the same pixel position for every word
4. **Three-part word rendering**:
   - Left part: right-aligned, flows toward anchor (fixed 220px width)
   - Anchor (ORP): fixed position, fixed width (0.65em)
   - Right part: left-aligned, flows away from anchor (fixed 220px width)
5. **Fixed-width ORP character** - Uses `width`, `minWidth`, and `maxWidth` all set to same value to prevent jitter

### Test Results
- All 325 tests passing
- Added 2 new tests for stage design verification

---

## 2026-01-18 19:00 - UX Corrections Checklist

### Summary
PDF loading works but the RSVP display UX needs significant corrections to match proper speed reader behavior.

### Critical Issue: ORP Anchoring is Wrong

**Current behavior:** Word is centered, then one letter is colored red.
**Correct behavior:** The red ORP letter is pinned to an absolute pixel position. The word is constructed around that fixed point.

### Implementation Checklist

#### 1. ORP Positioning (Non-negotiable - Fix First)
- [ ] Choose fixed X coordinate (e.g., 50% viewport width)
- [ ] Render red letter exactly at that coordinate
- [ ] Render left substring with right-alignment to anchor
- [ ] Render right substring with left-alignment from anchor
- [ ] The red letter must NEVER move, not even 1 pixel

Visual layout:
```
[left letters][ RED ][right letters]
               ^
          fixed pixel position
```

#### 2. Typography Corrections
- [ ] Use one font weight only (regular or medium)
- [ ] No bold anywhere
- [ ] No kerning tricks or font smoothing effects
- [ ] Sans-serif font (Inter, Helvetica, SF Pro)
- [ ] Normal letter spacing (do not adjust)
- [ ] The reader should look "boring and calm"

#### 3. Color Usage
- [ ] Main text: dark gray, not pure black or white
- [ ] Red letter: muted red, not bright alert red
- [ ] Background: flat and neutral
- [ ] Avoid pure black text, high-saturation red, shadows/glow

#### 4. Word Transitions
- [ ] Words replace each other instantly (no slide/bounce/easing)
- [ ] Use instant swap OR ultra-fast fade (20-40ms max)
- [ ] No movement on X or Y axis
- [ ] Lock layout dimensions

#### 5. Timing Logic (Variable Cadence)
Base speed example: 300 WPM, then adjust:
- [ ] Short words (1-3 chars): faster
- [ ] Long words (8+ chars): slower
- [ ] Commas: +30-50ms pause
- [ ] Periods: +120-200ms pause
- [ ] Paragraph breaks: noticeable pause

#### 6. ORP Calculation Rules
- Word length 1-3: ORP = first character (index 0)
- Word length 4-6: ORP = second character (index 1)
- Word length 7-9: ORP = third character (index 2)
- Long words: ORP slightly right of center (index 3+)

#### 7. Screen Composition
During reading:
- [ ] One word only
- [ ] One red letter
- [ ] Nothing else visible

Controls:
- [ ] Appear on pause
- [ ] Fade out on play
- [ ] Never move the word container

#### 8. Micro-jitter Prevention
- [ ] Use fixed-width measurements for red letter
- [ ] Snap anchor position to whole pixels
- [ ] Avoid auto layout recalculation on each word
- [ ] Test: record screen, step frame-by-frame, red letter must not move

#### 9. Optional Enhancement
- [ ] Sentence rewind on pause: show previous 3-5 words faintly
- [ ] Keep ORP fixed during rewind display

### Final Checklist
1. The red letter never moves by even one pixel
2. The word does not slide, bounce, or ease
3. Typography is boring and calm
4. Color is restrained
5. Timing varies naturally
6. Controls disappear during reading
7. Screen has no distractions
8. ORP is centered, not the word

---

## 2026-01-18 18:40 - PDF Loading Fix (Safari Compatibility)

### Summary
Fixed PDF upload functionality that was failing in Safari due to browser compatibility issues with pdfjs-dist.

### Root Cause
Safari doesn't support `Promise.withResolvers()` which is an ES2024 feature. pdfjs-dist v4 and v5 use this internally, causing uploads to fail with "undefined is not a function" errors.

### Solution
1. **Downgraded pdfjs-dist from v5.4.530 to v3.11.174** - v3 is stable and doesn't use modern ES2024 features
2. **Added Promise.withResolvers polyfill** - For future compatibility when we upgrade
3. **Updated worker file** - Changed from `.mjs` to `.js` extension for v3

### Changes Made
1. **package.json:**
   - `pdfjs-dist`: `^5.4.530` → `3.11.174`

2. **src/lib/pdf/extract-text.ts:**
   - Added `Promise.withResolvers` polyfill at top of file
   - Changed worker path from `/pdf.worker.min.mjs` to `/pdf.worker.min.js`

3. **src/app/layout.tsx:**
   - Added `<Script src="/polyfills.js" strategy="beforeInteractive" />` to load polyfills before other JS

4. **public/polyfills.js:** (new file)
   - Contains `Promise.withResolvers` polyfill for Safari

5. **public/pdf.worker.min.js:**
   - Copied from node_modules for v3 compatibility

### Testing
- Verified PDF loading works in Node.js with test PDF (26 pages, 1.3MB)
- Successfully extracts text content from academic paper

---

## 2026-01-18 16:45 - Code Review & UI Updates

### Summary
Reviewed codebase against specifications and updated UI to match design screenshots. Fixed all TypeScript and ESLint errors.

### Changes Made

#### Bug Fixes
1. **TypeScript Errors Fixed:**
   - Added missing `beforeEach` import in `AutoSpeedSettings.test.tsx`
   - Added missing Touch interface properties in `useTouchGestures.test.ts`

2. **ESLint Errors Fixed:**
   - Fixed ref access during render in `useKeyboardShortcuts.ts` and `useTouchGestures.ts`
   - Reordered callbacks in `CitationOverlay.tsx` to define before use
   - Removed unused `speed` variable in `SpeedSettings.tsx`
   - Fixed import ordering in multiple test files

3. **SSR Build Fix:**
   - Changed `pdfjs-dist` from static import to dynamic import in `extract-text.ts`
   - Prevents "DOMMatrix is not defined" error during Next.js build

#### UI Updates (Matching Design Screenshots)
1. **RSVPDisplay.tsx:**
   - Black background with frame borders
   - White text with red ORP character highlight
   - Vertical guide lines above/below word
   - WPM display in bottom right (italic, gray)
   - Upcoming word preview box in bottom right corner
   - Increased font sizes for better readability

2. **Main Page (page.tsx):**
   - Replaced default Next.js template with actual reader
   - Integrated timing engine for word progression
   - Keyboard shortcuts and touch gestures enabled
   - Dark theme by default

### Test Results
- All 322 tests passing
- Build succeeds
- Only 1 ESLint warning remaining (acceptable)

---

## 2026-01-17 10:30 - Project Setup & Initial Ralph Iterations

### Summary
Set up FastRead project using Ralph Wiggum AI development methodology. Completed Phase 1 (Project Foundation) and began Phase 2 (Core Reader Engine).

### Completed Tasks (7 total)
1. **Initialize Next.js 14 project with TypeScript** - Created app with App Router, Tailwind CSS
2. **Configure Tailwind CSS with custom theme** - Added light/dark/sepia themes per UI spec
3. **Set up ESLint and Prettier** - Code formatting configured
4. **Configure Supabase project and client** - Typed database schema, server/client helpers
5. **Create base folder structure** - src/lib, components, hooks, store, types directories
6. **Set up testing framework** - Vitest + Playwright configured
7. **Configure PWA manifest and service worker** - Offline support, installable app

### In Progress
- **Create word tokenizer utility** - DONE, committed. Handles punctuation, hyphenation, paragraph breaks. 17 tests passing.

### Next Up (Phase 2 remaining)
- Implement ORP (Optimal Recognition Point) calculator
- Build timing engine with requestAnimationFrame
- Create ReaderStore (Zustand) for reading state
- Implement punctuation pause timing
- Build word chunking logic (1/2/3 word modes)

### Technical Stack
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS v4
- Supabase (auth + database)
- pdf.js (client-side PDF parsing)
- Zustand (state management)
- Vitest + Playwright (testing)

### Git Commits
- `99c4599` - Configure Tailwind CSS v4 with light, dark, and sepia themes
- `0714f18` - Configure Supabase client with typed database schema
- `b6219d4` - Configure PWA manifest and service worker
- `cfca8ca` - Create word tokenizer utility with tests

### Blockers
- Ralph iteration process requires `--dangerously-skip-permissions` flag or manual approval for each file write. Need to run Ralph in separate terminal with proper flags for autonomous operation.

### Files Created
```
fastread/
├── ralph-specs/
│   ├── AGENTS.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── PROMPT_build.md
│   ├── PROMPT_plan.md
│   ├── README.md
│   ├── loop.sh
│   └── specs/
│       ├── citation-handling.md
│       ├── pdf-parsing.md
│       ├── speed-reader.md
│       ├── ui-design.md
│       └── user-auth-sync.md
├── src/
│   ├── lib/
│   │   ├── supabase/ (client.ts, server.ts, index.ts)
│   │   ├── text-processor/ (tokenizer.ts, tokenizer.test.ts, index.ts)
│   │   └── pwa/ (register-sw.ts, index.ts)
│   └── types/index.ts
├── public/
│   ├── manifest.json
│   └── sw.js
├── vitest.config.ts
└── vitest.setup.ts
```

### Next Session
To continue Ralph iterations autonomously, run:
```bash
cd fastread/ralph-specs
claude --dangerously-skip-permissions
# Then paste PROMPT_build.md contents
```

Or use the loop script with permissions flag added.
