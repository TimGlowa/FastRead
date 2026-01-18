# Citation Handling

## Overview

Interactive citation management during speed reading.

## Requirements

### Citation Modes
1. **Skip** - Skip over citations entirely during reading
2. **Read** - Read citations as normal text
3. **Interactive** - Pause on citation, allow user to save or skip

### Interactive Mode
- When citation detected, pause reading
- Show citation text prominently
- Options:
  - Save citation (stores for later reference)
  - Skip (continue reading)
  - Auto-skip after timeout (configurable)
- Haptic/sound feedback option

### Saved Citations
- Store in Supabase linked to document
- Include:
  - Raw citation text
  - Parsed author/year
  - Surrounding context (sentence)
  - Position in document
- Export saved citations (BibTeX, plain text)

## Technical Notes

- Citation detection regex patterns in tokenizer
- Zustand store for citation state during reading
- Supabase table: `saved_citations`
