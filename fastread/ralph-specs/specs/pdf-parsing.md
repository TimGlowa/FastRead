# PDF Parsing Specification

## Job to Be Done

As a student reading academic articles, I want to upload a PDF and have the tool automatically extract only the readable core text, so I can speed-read the content without being distracted by headers, URLs, codes, or formatting artifacts.

## Problem Context

Academic PDFs are messy:

- Two-column layouts with text that flows column-by-column
- Headers/footers on every page (journal name, page numbers, download timestamps)
- DOIs, ISSNs, URLs scattered throughout
- Figure captions, table data, equations
- Reference sections with dense citation formatting
- Author affiliations, correspondence emails
- Creative Commons license text

## User Flow

1. User uploads PDF file (drag-drop or file picker)
2. System shows upload progress
3. System parses PDF and extracts text
4. System applies cleaning rules to remove noise
5. System presents cleaned text preview with:
   - Detected sections highlighted
   - Option to include/exclude sections
   - Warning if parsing confidence is low
6. User confirms and proceeds to reader

## Functional Requirements

### FR-PDF-1: File Upload

- Accept PDF files up to 50MB
- Show upload progress indicator
- Validate file is actually a PDF (check magic bytes, not just extension)
- Store original file for re-processing if needed

### FR-PDF-2: Text Extraction

- Use pdf.js for client-side extraction
- Extract text with position data (x, y coordinates)
- Preserve paragraph boundaries
- Handle multi-page documents

### FR-PDF-3: Two-Column Detection

- Analyze text position data to detect column layout
- If two columns detected:
  - Find column boundary (typically page center)
  - Reorder text: left column first, then right column
  - Process page-by-page
- Handle mixed layouts (some pages single column, some double)

### FR-PDF-4: Noise Filtering

Remove the following automatically:

| Noise Type       | Detection Method                                | Example                                  |
| ---------------- | ----------------------------------------------- | ---------------------------------------- |
| Page headers     | Same text appearing at top of multiple pages    | "Organization Science, Vol. 34, No. 1"   |
| Page footers     | Same text appearing at bottom of multiple pages | "Downloaded from informs.org..."         |
| Page numbers     | Isolated numbers at page edges                  | "485", "486"                             |
| DOIs             | Regex: `10\.\d{4,}/[^\s]+`                      | "https://doi.org/10.1287/orsc.2022.1592" |
| URLs             | Regex for http/https links                      | "https://pubsonline.informs.org"         |
| Email addresses  | Regex for email pattern                         | "tristan.botelho@yale.edu"               |
| ISSN/ISBN        | Regex: `ISSN \d{4}-\d{4}`                       | "ISSN 1047-7039"                         |
| Figure captions  | Text starting with "Figure \d" or "Fig. \d"     | "Figure 1. Theoretical Mechanisms..."    |
| Table captions   | Text starting with "Table \d"                   | "Table 3. Descriptive Statistics"        |
| Footnote markers | Superscript numbers in isolation                |                                          |
| License text     | Contains "Creative Commons" or "CC BY"          |                                          |

### FR-PDF-5: Section Detection

Detect common academic sections:

- Abstract
- Introduction
- Literature Review / Background
- Methods / Methodology
- Results / Findings
- Discussion
- Conclusion
- References / Bibliography
- Appendix

Rules:

- Section headers are typically bold or larger font
- Section headers often appear on their own line
- Keywords: "Abstract", "Introduction", "Method", "Results", etc.

### FR-PDF-6: Content Filtering Options

User can choose to include/exclude:

- [ ] Abstract (default: include)
- [ ] Main body (default: include)
- [ ] References section (default: exclude)
- [ ] Appendices (default: exclude)
- [ ] Tables as text (default: exclude)

### FR-PDF-7: Text Cleaning

After extraction:

- Normalize whitespace (multiple spaces → single space)
- Fix hyphenation from line breaks ("meth-\nod" → "method")
- Preserve paragraph breaks (double newline)
- Remove orphan punctuation
- Handle special characters (em-dashes, smart quotes)

### FR-PDF-8: Parsing Confidence Score

Calculate confidence based on:

- Column detection certainty
- Percentage of text classified as noise
- Section detection success
- Character encoding issues

Display warning if confidence < 70%

## Non-Functional Requirements

### NFR-PDF-1: Performance

- Parse typical 25-page academic article in < 5 seconds
- Show progress indicator for longer documents
- Don't block UI during parsing (use Web Workers)

### NFR-PDF-2: Privacy

- All parsing happens client-side
- Original PDF never uploaded to server
- Only extracted text sent to server (for sync)

### NFR-PDF-3: Error Handling

- Graceful failure for corrupted PDFs
- Fallback to basic extraction if advanced parsing fails
- Clear error messages for unsupported formats

## Data Model

```typescript
interface ParsedDocument {
  id: string;
  originalFileName: string;
  title: string | null;
  authors: string[] | null;
  sections: Section[];
  rawText: string;
  cleanedText: string;
  citations: Citation[];
  parsingConfidence: number;
  createdAt: Date;
}

interface Section {
  type:
    | 'abstract'
    | 'introduction'
    | 'methods'
    | 'results'
    | 'discussion'
    | 'conclusion'
    | 'references'
    | 'appendix'
    | 'other';
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
  included: boolean; // user can toggle
}
```

## Edge Cases

1. **Scanned PDFs (image-only)**: Display error "This PDF contains images only. Please use a text-based PDF."
2. **Password-protected PDFs**: Display error "This PDF is password protected."
3. **Non-English text**: Support UTF-8, may have reduced accuracy for section detection
4. **Malformed PDFs**: Attempt basic extraction, warn user of potential issues
5. **Very long documents (100+ pages)**: Warn user, offer to process in chunks

## Acceptance Criteria

- [ ] Can upload PDF via drag-drop and file picker
- [ ] Two-column academic articles parse in correct reading order
- [ ] Headers/footers removed from all pages
- [ ] DOIs and URLs not included in reading text
- [ ] Sections correctly identified for sample academic article
- [ ] Parsing completes in under 5 seconds for 25-page article
- [ ] Clear preview of extracted text before reading
- [ ] User can toggle sections on/off
