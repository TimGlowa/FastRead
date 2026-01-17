# RSVP Reader Component

## Overview

The core speed reading display that shows words one at a time using Rapid Serial Visual Presentation (RSVP).

## Requirements

### Display
- Single word display centered on screen
- ORP (Optimal Recognition Point) highlighting - the letter where eyes naturally focus
- Configurable font size: small, medium, large, xlarge
- Theme support: light, dark, sepia

### Controls
- Play/Pause toggle
- Speed adjustment (WPM: 100-1000, default 300)
- Skip forward/back by word, sentence, or paragraph
- Progress indicator showing position in document

### Pause Behavior
- Auto-pause on punctuation (configurable duration):
  - Period/Question/Exclamation: 1.5x normal word time
  - Comma/Semicolon: 1.2x normal word time
  - Paragraph break: 2x normal word time

### Context Window (Optional)
- Show N words before and after current word
- Helps maintain reading context
- Toggle on/off in settings

## Technical Notes

- Use `requestAnimationFrame` for smooth timing
- Store reading position in Zustand for persistence
- Integrate with tokenizer from `src/lib/text-processor/`
