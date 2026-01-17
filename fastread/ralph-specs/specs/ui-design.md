# UI Design Specification

## Job to Be Done

As a user of FastRead, I want a clean, distraction-free interface that works beautifully on my phone, tablet, and desktop, so I can focus entirely on reading without UI friction.

## Design Principles

1. **Focus First**: The reading experience should dominate. UI elements fade away during reading.
2. **Mobile Native**: Design for phone first, scale up to desktop. Touch targets 44px minimum.
3. **Accessible**: WCAG AA compliance, works with screen readers.
4. **Fast Perception**: UI should feel instant. Animations short and purposeful.
5. **Familiar Patterns**: Use conventions users already know (swipe, tap, etc.)

## Reference: SwiftRead PRO

Study the SwiftRead PRO interface for inspiration:

- Dark mode by default
- High contrast word display
- Minimal chrome
- Progress bar always visible
- Speed controls accessible but not prominent

## Color Themes

### Light Theme

```css
--background: #ffffff --surface: #f5f5f5 --text-primary: #1a1a1a --text-secondary: #666666
  --accent: #3b82f6 --orp-highlight: #ef4444 --success: #22c55e --warning: #f59e0b --error: #ef4444;
```

### Dark Theme (Default)

```css
--background: #0a0a0a --surface: #1a1a1a --text-primary: #ffffff --text-secondary: #a0a0a0
  --accent: #60a5fa --orp-highlight: #f87171 --success: #4ade80 --warning: #fbbf24 --error: #f87171;
```

### Sepia Theme

```css
--background: #f4ecd8 --surface: #e8dcc8 --text-primary: #433422 --text-secondary: #6b5b4a
  --accent: #8b6914 --orp-highlight: #c45500;
```

## Typography

### Font Stack

```css
--font-display: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-reading: 'Literata', 'Georgia', serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Reading Font Options (User Selectable)

- **Literata** (default) - Designed for long-form reading
- **Inter** - Clean sans-serif
- **OpenDyslexic** - Accessibility option
- **Atkinson Hyperlegible** - High legibility

### Font Sizes (Reading View)

| Size    | Mobile | Tablet | Desktop |
| ------- | ------ | ------ | ------- |
| Small   | 24px   | 32px   | 36px    |
| Medium  | 32px   | 40px   | 48px    |
| Large   | 40px   | 52px   | 64px    |
| X-Large | 48px   | 64px   | 80px    |

## Page Layouts

### 1. Home / Library Page

```
┌─────────────────────────────────────────┐
│ ☰  FastRead                    [Avatar] │
├─────────────────────────────────────────┤
│                                         │
│  Your Library                           │
│  ─────────────────                      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📄 The Evaluation of Founder... │   │
│  │    15% • 2,156 words remaining  │   │
│  │    Last read: 2 hours ago       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 📄 Organizational Behavior...   │   │
│  │    Done ✓                       │   │
│  │    Read: Yesterday              │   │
│  └─────────────────────────────────┘   │
│                                         │
│           ┌───────────────┐            │
│           │   + Upload    │            │
│           │     PDF       │            │
│           └───────────────┘            │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Upload / Preview Page

```
┌─────────────────────────────────────────┐
│ ←  Document Preview                     │
├─────────────────────────────────────────┤
│                                         │
│  The Evaluation of Founder Failure...   │
│  ──────────────────────────────────────│
│  2,156 words • 7 min at 300 WPM        │
│  12 citations detected                  │
│                                         │
│  Sections to include:                   │
│  ☑ Abstract                            │
│  ☑ Introduction                        │
│  ☑ Methods                             │
│  ☑ Results                             │
│  ☑ Discussion                          │
│  ☐ References                          │
│                                         │
│  Citation mode:                         │
│  ○ Skip citations                       │
│  ○ Read citations                       │
│  ● Interactive (Save/Skip each)         │
│                                         │
│         ┌───────────────────┐          │
│         │   Start Reading   │          │
│         │       →           │          │
│         └───────────────────┘          │
└─────────────────────────────────────────┘
```

### 3. Reading View (Active)

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│                                         │
│                                         │
│          orga|n|izations                │
│                                         │
│                                         │
│                                         │
│                                         │
│                                         │
│  ════════════════════════════════════  │
│  ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░ 15%  │
│                                         │
│           ⚡ 350 WPM                    │
└─────────────────────────────────────────┘

Tap center: pause
Swipe up/down: speed
Swipe left/right: skip
```

### 4. Reading View (Paused)

```
┌─────────────────────────────────────────┐
│ ×                              ⚙️       │
├─────────────────────────────────────────┤
│                                         │
│          orga|n|izations                │
│                                         │
│   "...how organizations evaluate        │
│    entrepreneurial human capital..."    │
│                                         │
│         ┌─────────────────┐            │
│         │      ▶ Play     │            │
│         └─────────────────┘            │
│                                         │
│  ◀◀ Sentence    Paragraph ▶▶           │
│                                         │
│  ════════════════════════════════════  │
│  ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░ 15%  │
│                                         │
│    [−]  ⚡ 350 WPM  [+]                 │
│                                         │
│  📖 12/2156 words • 6:12 remaining     │
└─────────────────────────────────────────┘
```

### 5. Citation Prompt (Interactive Mode)

```
┌─────────────────────────────────────────┐
│                                         │
│    "...theories suggest that..."        │
│                                         │
│    ┌─────────────────────────────┐     │
│    │                             │     │
│    │   (Smith et al., 2020)      │     │
│    │                             │     │
│    └─────────────────────────────┘     │
│                                         │
│   ┌─────┐   ┌─────┐   ┌─────┐         │
│   │ 💾  │   │ ⏭  │   │ 📖  │         │
│   │Save │   │Skip │   │Read │         │
│   └─────┘   └─────┘   └─────┘         │
│                                         │
│   ──────────────────────────────       │
│   Saved: 3 citations                    │
│                                         │
└─────────────────────────────────────────┘
```

### 6. Settings Page

```
┌─────────────────────────────────────────┐
│ ←  Settings                             │
├─────────────────────────────────────────┤
│                                         │
│  READING                                │
│  ───────                                │
│  Default Speed         [300] WPM       │
│  Font                  [Literata ▼]    │
│  Font Size             [Medium ▼]      │
│  Theme                 [Dark ▼]        │
│                                         │
│  AUTO SPEED                             │
│  ──────────                             │
│  Enable                    [━━━●]      │
│  Increase every       [500] words      │
│  Increase by           [25] WPM        │
│  Maximum              [600] WPM        │
│                                         │
│  CITATIONS                              │
│  ─────────                              │
│  Default Mode      [Interactive ▼]     │
│  Pause Timeout          [Off ▼]        │
│                                         │
│  ACCOUNT                                │
│  ───────                                │
│  Email            tim@example.com       │
│  [Change Password]                      │
│  [Export Data]                          │
│  [Delete Account]                       │
│                                         │
└─────────────────────────────────────────┘
```

## Components

### Button Styles

```
Primary:   [  Start Reading  ]  - filled, accent color
Secondary: [    Cancel       ]  - outlined
Danger:    [    Delete       ]  - filled, error color
Ghost:     [    Skip         ]  - text only, subtle
Icon:      [ ⚙️ ]              - icon only, circular
```

### Touch Targets

- Minimum 44x44px for all interactive elements
- Adequate spacing between targets (8px minimum)
- Visual feedback on tap (ripple or scale)

### Loading States

- Skeleton screens for content loading
- Spinner for actions (upload, sync)
- Progress bar for parsing

### Empty States

```
┌─────────────────────────────────────────┐
│                                         │
│              📚                         │
│                                         │
│       Your library is empty             │
│                                         │
│   Upload a PDF to start speed reading   │
│                                         │
│         [  Upload PDF  ]                │
│                                         │
└─────────────────────────────────────────┘
```

### Error States

```
┌─────────────────────────────────────────┐
│                                         │
│              ⚠️                         │
│                                         │
│     Couldn't parse this PDF             │
│                                         │
│   The document may be image-based       │
│   or have an unsupported format.        │
│                                         │
│       [  Try Again  ]                   │
│       [  Upload Different File  ]       │
│                                         │
└─────────────────────────────────────────┘
```

## Animations

### Reading Word Transition

- Duration: instant (no animation on word change)
- ORP highlight: subtle pulse on word change (optional, toggleable)

### Page Transitions

- Duration: 200ms
- Easing: ease-out
- Direction: slide left/right for navigation

### Button Press

- Scale: 0.95 on press
- Duration: 100ms

### Modals/Sheets

- Slide up from bottom (mobile)
- Fade + scale (desktop)
- Duration: 250ms

## Responsive Breakpoints

```css
/* Mobile first */
@media (min-width: 640px) {
  /* sm - large phone */
}
@media (min-width: 768px) {
  /* md - tablet */
}
@media (min-width: 1024px) {
  /* lg - desktop */
}
@media (min-width: 1280px) {
  /* xl - large desktop */
}
```

### Layout Adaptations

| Element      | Mobile      | Tablet      | Desktop            |
| ------------ | ----------- | ----------- | ------------------ |
| Library grid | 1 column    | 2 columns   | 3 columns          |
| Reading view | Full screen | Full screen | Centered max-width |
| Settings     | Full page   | Modal       | Side panel         |
| Navigation   | Bottom bar  | Side bar    | Top bar            |

## Accessibility Requirements

### WCAG AA Compliance

- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Color contrast ratio ≥ 3:1 for UI elements
- [ ] Focus indicators visible
- [ ] Keyboard navigation complete
- [ ] Screen reader labels for all elements
- [ ] Reduced motion option respected
- [ ] Touch targets ≥ 44px

### Screen Reader Support

- Announce word changes on pause (not during reading)
- Announce progress milestones
- Announce citation prompts
- All buttons labeled

### Keyboard Shortcuts (Desktop)

| Key    | Action                        |
| ------ | ----------------------------- |
| Space  | Play/Pause                    |
| Escape | Exit reading                  |
| ↑ / ]  | Speed up                      |
| ↓ / [  | Speed down                    |
| →      | Next sentence                 |
| ←      | Previous sentence             |
| F      | Toggle fullscreen             |
| S      | Save citation (when prompted) |
| K      | Skip citation (when prompted) |

## PWA Requirements

### Install Prompt

Show after second session:

```
┌─────────────────────────────────────────┐
│                                         │
│   Install FastRead for quick access?    │
│                                         │
│   [  Not Now  ]  [  Install  ]         │
│                                         │
└─────────────────────────────────────────┘
```

### Icons

- 192x192 PNG
- 512x512 PNG
- Apple touch icon
- Favicon

### Splash Screen

- App icon centered
- Background matches theme
- "FastRead" text below icon

## Acceptance Criteria

- [ ] Works on iPhone SE (smallest common screen)
- [ ] Works on iPad
- [ ] Works on desktop browsers
- [ ] Dark/Light/Sepia themes working
- [ ] All fonts loading correctly
- [ ] Touch targets ≥ 44px verified
- [ ] Keyboard navigation complete
- [ ] Screen reader tested
- [ ] PWA installable
- [ ] Lighthouse accessibility score ≥ 90
