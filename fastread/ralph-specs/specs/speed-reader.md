# Speed Reader Specification

## Job to Be Done

As a student with lots of reading, I want to read academic articles faster using RSVP (Rapid Serial Visual Presentation), so I can get through my reading assignments in less time while maintaining comprehension.

## What is RSVP?

RSVP displays one word (or small chunk) at a time in a fixed position. The eye doesn't need to move, eliminating saccades (eye jumps) and reducing subvocalization. This allows reading speeds of 300-1000+ WPM vs typical 200-250 WPM.

## Reference: SwiftRead PRO

The target experience is similar to SwiftRead PRO:

- Single word displayed at screen center
- ORP (Optimal Recognition Point) highlighted - the letter your eye should focus on
- Clean, distraction-free interface
- Smooth progression through text

## User Flow

1. User has document loaded (from PDF parser)
2. User sees reading interface with:
   - Large central word display
   - Progress bar
   - WPM indicator
   - Play/pause button
   - Speed controls
3. User taps play or presses space
4. Words appear one at a time at set WPM
5. User can pause anytime
6. User can adjust speed while reading
7. User can skip forward/back
8. Reading position saved automatically

## Functional Requirements

### FR-SR-1: Word Display

- Display single word at center of screen
- Word should be large and highly readable
- Highlight the ORP (Optimal Recognition Point):
  - For words 1-3 chars: highlight 1st letter
  - For words 4-6 chars: highlight 2nd letter
  - For words 7-9 chars: highlight 3rd letter
  - For words 10+ chars: highlight 4th letter
- ORP letter in different color (e.g., red on black text)

### FR-SR-2: Speed Control

- Default speed: 300 WPM
- Adjustable range: 100 WPM to 1000 WPM
- Speed increments: 25 WPM steps
- Display current WPM prominently
- Keyboard shortcuts: ↑ increase, ↓ decrease

### FR-SR-3: Auto-Speed Increase (Toggle Feature)

When enabled:

- Speed automatically increases by configurable amount
- Increase interval: every N words read (default: 500 words)
- Increase amount: configurable (default: 25 WPM)
- Maximum speed cap: user-defined (default: 600 WPM)
- Visual indicator when speed increases
- Can be toggled on/off anytime

Settings for auto-speed:

- [ ] Enable auto-speed increase
- Increase every: [500] words
- Increase by: [25] WPM
- Maximum speed: [600] WPM

### FR-SR-4: Playback Controls

| Control      | Keyboard | Touch            | Action             |
| ------------ | -------- | ---------------- | ------------------ |
| Play/Pause   | Space    | Tap center       | Toggle reading     |
| Speed up     | ↑ or ]   | Swipe up         | +25 WPM            |
| Speed down   | ↓ or [   | Swipe down       | -25 WPM            |
| Skip forward | →        | Swipe right      | Next sentence      |
| Skip back    | ←        | Swipe left       | Previous sentence  |
| Jump forward | Shift+→  | Double-tap right | Next paragraph     |
| Jump back    | Shift+←  | Double-tap left  | Previous paragraph |

### FR-SR-5: Progress Tracking

- Progress bar at bottom of screen
- Shows: current position / total words
- Shows: estimated time remaining at current speed
- Clickable/tappable to jump to position
- Chapter/section markers on progress bar (if sections detected)

### FR-SR-6: Word Chunking (Advanced)

Option to display multiple words at once:

- 1 word (default)
- 2 words
- 3 words

Chunking rules:

- Keep short function words with following word ("the cat", "in a")
- Don't break across sentence boundaries
- Don't break across clause boundaries (commas, semicolons)

### FR-SR-7: Pause on Punctuation

Automatically add brief pauses:

- Comma: +50ms
- Semicolon/colon: +100ms
- Period/question/exclamation: +150ms
- Paragraph break: +300ms

These create natural reading rhythm.

### FR-SR-8: Context Window (Optional)

Toggle to show surrounding context:

- Previous word (faded, left)
- Current word (prominent, center)
- Next word (faded, right)

Helps with comprehension at higher speeds.

### FR-SR-9: Reading Position Memory

- Auto-save position every 5 seconds
- Save position on pause
- Save position on page close/refresh
- Resume from saved position on return
- Option to "Start Over" if desired

### FR-SR-10: Focus Mode

Full-screen mode with:

- No browser chrome
- No app navigation
- Just the word and minimal controls
- Escape or swipe down to exit

## Non-Functional Requirements

### NFR-SR-1: Timing Precision

- Word display timing must be precise to ±10ms
- Use `requestAnimationFrame` for smooth updates
- Pre-calculate word intervals
- No visible jitter or stutter

### NFR-SR-2: Performance

- 60fps animation
- No dropped frames
- Instant response to pause command (<16ms)
- Works smoothly on mid-range phones

### NFR-SR-3: Accessibility

- Sufficient color contrast (WCAG AA)
- Support for reduced motion preference (disable ORP animation)
- Screen reader announces current word on pause
- Keyboard fully navigable

### NFR-SR-4: Battery Efficiency

- Minimize CPU usage during reading
- No unnecessary re-renders
- Pause internal timers when tab not visible

## Data Model

```typescript
interface ReadingSession {
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

interface AutoSpeedSettings {
  enabled: boolean;
  increaseEveryWords: number;
  increaseAmount: number;
  maxSpeed: number;
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
```

## Visual Design Reference

```
┌──────────────────────────────────────┐
│                                      │
│                                      │
│                                      │
│           orga|n|izations            │
│              ^ORP highlighted        │
│                                      │
│                                      │
│   ◄◄        ▶ | ||        ►►        │
│                                      │
│  [====|================] 15%         │
│  324 / 2,156 words • 6 min left     │
│                                      │
│           ⚡ 350 WPM                  │
│           [−] [+]                    │
└──────────────────────────────────────┘
```

## Edge Cases

1. **Very long words**: Scale font to fit, or hyphenate
2. **Numbers and symbols**: Display as-is, count as one "word"
3. **Hyphenated words**: Display together ("well-known")
4. **End of document**: Show completion screen with stats
5. **Tab becomes hidden**: Pause reading, resume when visible
6. **Network disconnect**: Continue reading (content already loaded)
7. **Screen rotation**: Maintain position, adjust layout

## Acceptance Criteria

- [ ] Words display one at a time at center of screen
- [ ] ORP letter highlighted for each word
- [ ] Speed adjustable from 100-1000 WPM
- [ ] Play/pause works with space bar and tap
- [ ] Skip forward/back works with arrows and swipes
- [ ] Progress bar shows accurate position
- [ ] Auto-speed increase toggles on/off correctly
- [ ] Position saved and restored on return
- [ ] Smooth 60fps performance on mobile
- [ ] Focus mode hides all UI except word
