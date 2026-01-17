# PDF Parser

## Overview

Extract text from uploaded PDF files, handling academic paper structure.

## Requirements

### Text Extraction
- Use pdfjs-dist to extract text from PDFs
- Preserve paragraph structure
- Handle multi-column layouts (common in academic papers)
- Fix line-break hyphenation (already in tokenizer)

### Section Detection
- Identify common academic sections:
  - Abstract
  - Introduction
  - Methods/Methodology
  - Results
  - Discussion
  - Conclusion
  - References
- Allow users to include/exclude sections for reading

### Citation Detection
- Detect inline citations: (Author, Year), (Author et al., Year), [1], [1-3]
- Store citation positions for interactive handling
- Support multiple citation formats

### Metadata Extraction
- Extract title (usually largest text on first page)
- Extract authors (text below title)
- Calculate confidence score for parsing quality

## Technical Notes

- Use Web Workers for PDF parsing to avoid blocking UI
- Cache parsed documents in IndexedDB
- Integrate with types from `src/types/index.ts`
