/**
 * Text Cleaner for Academic PDFs
 *
 * Removes non-essential content:
 * - URLs and links
 * - Copyright notices
 * - Publisher codes and DOIs
 * - Table descriptions
 * - Page numbers and headers/footers
 * - Formats citations to (Author et al, Year)
 */

/**
 * Remove URLs from text
 */
function removeURLs(text: string): string {
  // Match http/https URLs
  const urlPattern = /https?:\/\/[^\s]+/gi;
  // Match www URLs
  const wwwPattern = /www\.[^\s]+/gi;
  // Match doi.org links
  const doiPattern = /doi\.org\/[^\s]+/gi;

  return text
    .replace(urlPattern, '')
    .replace(wwwPattern, '')
    .replace(doiPattern, '');
}

/**
 * Remove copyright notices
 */
function removeCopyrightNotices(text: string): string {
  const patterns = [
    // ProQuest/library database copyright watermarks
    /reproduced\s+with\s+permission\s+of\s+the\s+copyright\s+owner\.?\s*further\s+reproduction\s+prohibited\s+without\s+permission\.?/gi,
    // Copyright symbol patterns
    /©\s*\d{4}[^.]*\./gi,
    /\(c\)\s*\d{4}[^.]*\./gi,
    /copyright\s*©?\s*\d{4}[^.]*\./gi,
    // All rights reserved
    /all\s+rights\s+reserved\.?/gi,
    // License statements
    /licensed\s+under[^.]+\./gi,
    /creative\s+commons[^.]+\./gi,
    // Permission statements
    /permission\s+to\s+copy[^.]+\./gi,
    /reprinted\s+with\s+permission[^.]+\./gi,
  ];

  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern, '');
  }
  return result;
}

/**
 * Remove publisher codes and identifiers
 */
function removePublisherCodes(text: string): string {
  const patterns = [
    // DOI patterns
    /doi:\s*[\d./\-a-z]+/gi,
    /https?:\/\/doi\.org\/[\d./\-a-z]+/gi,
    // ISBN/ISSN
    /isbn[:\s]*[\d\-x]+/gi,
    /issn[:\s]*[\d\-x]+/gi,
    // arXiv
    /arxiv[:\s]*[\d.]+/gi,
    // Publisher IDs
    /pmid[:\s]*\d+/gi,
    /pmcid[:\s]*pmc\d+/gi,
    // ACM/IEEE identifiers
    /acm\s+\d+/gi,
    /ieee\s+\d+/gi,
    // Page ranges like "pp. 123-456"
    /pp?\.\s*\d+\s*[-–]\s*\d+/gi,
    // Volume/Issue patterns like "Vol. 1, No. 2"
    /vol\.?\s*\d+,?\s*no\.?\s*\d+/gi,
  ];

  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern, '');
  }
  return result;
}

/**
 * Remove table and figure descriptions
 */
function removeTableDescriptions(text: string): string {
  const patterns = [
    // Table captions
    /table\s+\d+[.:]\s*[^.]+\./gi,
    // Figure captions
    /figure\s+\d+[.:]\s*[^.]+\./gi,
    /fig\.?\s+\d+[.:]\s*[^.]+\./gi,
    // "See Table X" references
    /see\s+table\s+\d+/gi,
    /see\s+figure\s+\d+/gi,
    /see\s+fig\.?\s+\d+/gi,
    // Algorithm descriptions
    /algorithm\s+\d+[.:]\s*[^.]+\./gi,
  ];

  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern, '');
  }
  return result;
}

/**
 * Remove page numbers and headers/footers
 */
function removePageArtifacts(text: string): string {
  const patterns = [
    // Standalone page numbers
    /^\s*\d+\s*$/gm,
    // "Page X of Y"
    /page\s+\d+\s+of\s+\d+/gi,
    // Page numbers at end of lines
    /\s+\d+\s*$/gm,
  ];

  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern, '');
  }
  return result;
}

/**
 * Format citations to (Author et al, Year) format
 * Converts various citation formats to a standardized short form
 */
export function formatCitations(text: string): string {
  // Pattern for citations with full author names and year in parentheses
  // e.g., (Smith, John and Jones, Jane, 2023) -> (Smith et al., 2023)
  // e.g., (Blow, Joe and Smith, Sally "Title...", Journal, 2023) -> (Blow et al., 2023)

  const citationPattern = /\(([^)]+,\s*\d{4}[^)]*)\)/g;

  return text.replace(citationPattern, (match, content) => {
    // Extract year (4 digits)
    const yearMatch = content.match(/\b(19|20)\d{2}\b/);
    if (!yearMatch) return match;
    const year = yearMatch[0];

    // Extract first author's last name
    // Look for the first word that looks like a name (capitalized)
    const words = content.split(/[\s,]+/);
    let firstAuthor = '';

    for (const word of words) {
      // Skip common words and look for capitalized names
      const cleanWord = word.replace(/["""']/g, '').trim();
      if (
        cleanWord.length > 1 &&
        /^[A-Z][a-z]+$/.test(cleanWord) &&
        !['The', 'And', 'For', 'In', 'On', 'Of', 'To', 'A', 'An'].includes(cleanWord)
      ) {
        firstAuthor = cleanWord;
        break;
      }
    }

    if (!firstAuthor) return match;

    // Check if there are multiple authors (contains "and" or multiple commas before year)
    const hasMultipleAuthors =
      content.toLowerCase().includes(' and ') ||
      content.split(',').length > 2 ||
      content.includes('et al');

    if (hasMultipleAuthors) {
      return `(${firstAuthor} et al., ${year})`;
    } else {
      return `(${firstAuthor}, ${year})`;
    }
  });
}

/**
 * Remove email addresses
 */
function removeEmails(text: string): string {
  return text.replace(/[\w.-]+@[\w.-]+\.\w+/gi, '');
}

/**
 * Remove common academic boilerplate
 */
function removeBoilerplate(text: string): string {
  const patterns = [
    // Acknowledgments section markers
    /acknowledgments?\.?/gi,
    // Funding statements
    /this\s+work\s+was\s+(?:supported|funded)[^.]+\./gi,
    /this\s+research\s+was\s+(?:supported|funded)[^.]+\./gi,
    // Author contribution statements
    /author\s+contributions?[^.]+\./gi,
    // Conflict of interest
    /(?:no\s+)?conflict(?:s)?\s+of\s+interest[^.]*\./gi,
    // Received/Accepted dates
    /received:?\s*\d{1,2}\s+\w+\s+\d{4}/gi,
    /accepted:?\s*\d{1,2}\s+\w+\s+\d{4}/gi,
    /published:?\s*\d{1,2}\s+\w+\s+\d{4}/gi,
  ];

  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern, '');
  }
  return result;
}

/**
 * Clean up excessive whitespace
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Fix PDF character spacing issues
 * PDF.js sometimes extracts text with spaces between characters due to:
 * - Ligature rendering (fi, fl, ff, ffi, ffl)
 * - Kerning/tracking in the PDF
 * - Font encoding issues
 *
 * This function runs multiple passes to catch complex patterns like:
 * - "ent r epreneurship" (multiple single-letter splits)
 * - "f i" (ligature splits)
 * - "rms," (letters before punctuation)
 */
export function fixLigatures(text: string): string {
  let result = text;

  // Pass 1: Fix explicit ligature patterns first
  result = result
    // Multi-character ligatures first (order matters!)
    .replace(/f\s+f\s+i/g, 'ffi')
    .replace(/f\s+f\s+l/g, 'ffl')
    .replace(/f\s+f/g, 'ff')
    // Single ligatures
    .replace(/f\s+i/g, 'fi')
    .replace(/f\s+l/g, 'fl');

  // Pass 2: Iteratively fix single-letter splits
  // Run multiple times to catch chains like "ent r epreneurship"
  // Each pass joins adjacent single-letter splits
  for (let i = 0; i < 5; i++) {
    const before = result;

    // Fix: letter(s) + space + single letter + space + letter(s)
    // "ent r epreneur" → "entrepreneur"
    result = result.replace(
      /([a-zA-Z]+)\s+([a-zA-Z])\s+([a-zA-Z])/g,
      (match, p1, p2, p3) => {
        // Don't join if p1 is a standalone word at a word boundary
        const standaloneWords = ['a', 'i', 'to', 'in', 'is', 'it', 'of', 'or', 'an', 'as', 'at', 'be', 'by', 'do', 'go', 'he', 'if', 'me', 'my', 'no', 'on', 'so', 'up', 'us', 'we'];
        if (standaloneWords.includes(p1.toLowerCase()) && p1.length <= 2) {
          return match;
        }
        return p1 + p2 + p3;
      }
    );

    // Fix: single letter + space + letter(s) at word boundaries
    // "r ms" → "rms"
    result = result.replace(
      /\b([a-zA-Z])\s+([a-zA-Z]{2,})\b/g,
      '$1$2'
    );

    // Fix: letter(s) + space + single letter at word boundaries (before punctuation too)
    // "firm s" → "firms", "rms ," won't match but "rm s" → "rms"
    result = result.replace(
      /\b([a-zA-Z]{2,})\s+([a-zA-Z])(?=[\s,.:;!?]|$)/g,
      '$1$2'
    );

    // If no changes, break early
    if (result === before) break;
  }

  // Pass 3: Fix remaining two-character splits with smarter detection
  result = result.replace(
    /\b([a-zA-Z]{1,3})\s+([a-zA-Z]{1,3})\b/g,
    (match, p1, p2) => {
      const standaloneWords = [
        'a', 'an', 'as', 'at', 'be', 'by', 'do', 'go', 'he', 'i', 'if', 'in',
        'is', 'it', 'me', 'my', 'no', 'of', 'on', 'or', 'so', 'to', 'up', 'us',
        'we', 'am', 'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all',
        'can', 'her', 'was', 'one', 'our', 'out', 'has', 'had', 'its', 'let',
        'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did',
        'get', 'him', 'his', 'how', 'man', 'own', 'say', 'she', 'too', 'use'
      ];

      const p1Lower = p1.toLowerCase();
      const p2Lower = p2.toLowerCase();

      // If both are common standalone words, don't join
      if (standaloneWords.includes(p1Lower) && standaloneWords.includes(p2Lower)) {
        return match;
      }

      // If first part is a common word at sentence start (capital), don't join
      if (standaloneWords.includes(p1Lower) && /^[A-Z]/.test(p1)) {
        return match;
      }

      // If first part is a common word and second is capitalized (new sentence), don't join
      if (standaloneWords.includes(p1Lower) && /^[A-Z]/.test(p2)) {
        return match;
      }

      // Join them
      return p1 + p2;
    }
  );

  // Pass 4: Clean up any remaining single-letter islands
  // "a b c" patterns that are clearly broken characters
  result = result.replace(
    /\b([a-zA-Z])\s+([a-zA-Z])\s+([a-zA-Z])\b/g,
    (match, p1, p2, p3) => {
      // Check if this looks like initials (all caps)
      if (/^[A-Z]$/.test(p1) && /^[A-Z]$/.test(p2) && /^[A-Z]$/.test(p3)) {
        return match; // Keep as separate initials
      }
      return p1 + p2 + p3;
    }
  );

  // Pass 5: Final cleanup - join any remaining adjacent single letters
  result = result.replace(
    /\b([a-zA-Z])\s+([a-zA-Z])\b/g,
    (match, p1, p2) => {
      // Don't join single-letter words like "I" or articles "a"
      if ((p1.toLowerCase() === 'i' || p1.toLowerCase() === 'a') && /^[a-z]/.test(p2)) {
        return match;
      }
      // Don't join if second letter starts a capitalized word
      if (/^[A-Z]$/.test(p2)) {
        return match;
      }
      return p1 + p2;
    }
  );

  return result;
}

/**
 * Fix em-dash and en-dash extraction
 * Em-dashes should attach to the preceding word, not be separate
 */
export function fixEmDashes(text: string): string {
  return text
    // "word — next" → "word— next" (em-dash attaches to previous word)
    .replace(/\s+—\s*/g, '— ')
    // Also handle en-dash
    .replace(/\s+–\s*/g, '– ');
}

/**
 * Fix punctuation spacing issues from PDF extraction
 * Handles split apostrophes and other punctuation
 */
export function fixPunctuationSpacing(text: string): string {
  return text
    // Fix split apostrophes: "founder ' s" → "founder's"
    .replace(/(\w)\s+'\s+(\w)/g, "$1'$2")
    // Fix split possessives: "owner 's" → "owner's"
    .replace(/(\w)\s+'s\b/g, "$1's")
    // Fix stray apostrophes at word boundaries
    .replace(/\s+'/g, "'")
    .replace(/'\s+/g, "'")
    // Fix split quotes
    .replace(/"\s+(\w)/g, '"$1')
    .replace(/(\w)\s+"/g, '$1"');
}

/**
 * Extract body content from academic PDFs
 * Keeps title and authors, removes metadata junk and references
 * Does NOT remove content before abstract - that's where title/authors are
 */
export function extractBodyContent(text: string): string {
  let result = text;

  // Remove references section and everything after
  const referencesMatch = result.match(/\n\s*(References|REFERENCES|Bibliography|BIBLIOGRAPHY|Works Cited)\s*\n/i);
  if (referencesMatch && referencesMatch.index !== undefined) {
    result = result.slice(0, referencesMatch.index);
  }

  // Remove footnotes (lines starting with numbers that are short)
  result = result.replace(/^\d{1,2}\s+[^.]{0,150}$/gm, '');

  // Remove common metadata patterns (but keep title/authors)
  const metadataPatterns = [
    // Journal header patterns
    /^[A-Z][a-z]+\s+Journal\s+of[^\n]+\n/gim,
    // Volume/Issue lines
    /^Volume\s+\d+[^\n]*\n/gim,
    /^Issue\s+\d+[^\n]*\n/gim,
    // Article type markers
    /^Research\s+Article\s*$/gim,
    /^Original\s+Research\s*$/gim,
    /^Review\s+Article\s*$/gim,
    // Download/access info
    /^Downloaded\s+from[^\n]+\n/gim,
    /^Accessed\s+\d{1,2}[^\n]+\n/gim,
    // Submission/acceptance dates
    /^Received:?\s+\d{1,2}[^\n]+\n/gim,
    /^Accepted:?\s+\d{1,2}[^\n]+\n/gim,
    /^Published:?\s+\d{1,2}[^\n]+\n/gim,
    // Article ID patterns
    /^Article\s+ID:?\s*\d+[^\n]*\n/gim,
    // DOI on its own line
    /^DOI:?\s*10\.[^\n]+\n/gim,
    /^https?:\/\/doi\.org\/[^\n]+\n/gim,
    // Open Access statements (multi-line)
    /Open\s+Access\s+Statement[:\s]*[^]*?(?=\n\n|\n[A-Z])/gim,
    // License statements
    /This\s+work\s+is\s+(?:licensed|©|0)\s+[^]*?(?=\n\n|\n[A-Z])/gim,
    /Creative\s+Commons[^]*?(?=\n\n|\n[A-Z])/gim,
    /You\s+are\s+free\s+to\s+download[^]*?(?=\n\n|\n[A-Z])/gim,
    // Keywords line
    /^Keywords\s*[:\s•][^\n]*\n/gim,
    /^Key\s*words\s*[:\s•][^\n]*\n/gim,
    // Supplemental material
    /^Supplemental?\s+Material[:\s][^\n]*\n/gim,
    /The\s+online\s+appendix\s+is\s+available[^\n]*\n/gim,
    // Copyright lines
    /^Copyright\s+[^\n]*\n/gim,
    /^©\s*\d{4}[^\n]*\n/gim,
    // License URLs
    /used\s+under\s+a\s+[^\n]*licenses?[^\n]*/gim,
    /org\/licenses\/[^\s]+/gi,
  ];

  for (const pattern of metadataPatterns) {
    result = result.replace(pattern, '');
  }

  return result;
}

export interface CleanTextOptions {
  fixLigatures?: boolean;
  fixEmDashes?: boolean;
  fixPunctuationSpacing?: boolean;
  extractBody?: boolean;
  removeUrls?: boolean;
  removeCopyright?: boolean;
  removePublisherInfo?: boolean;
  removeTableFigureDescriptions?: boolean;
  removePageNumbers?: boolean;
  formatCitationsShort?: boolean;
  removeEmails?: boolean;
  removeBoilerplate?: boolean;
}

const DEFAULT_OPTIONS: CleanTextOptions = {
  fixLigatures: true,
  fixEmDashes: true,
  fixPunctuationSpacing: true,
  extractBody: true,
  removeUrls: true,
  removeCopyright: true,
  removePublisherInfo: true,
  removeTableFigureDescriptions: true,
  removePageNumbers: true,
  formatCitationsShort: true,
  removeEmails: true,
  removeBoilerplate: true,
};

/**
 * Main text cleaning function
 * Removes non-essential content from academic PDFs
 *
 * Processing order matters:
 * 1. Fix ligatures FIRST (before other processing)
 * 2. Fix punctuation spacing (apostrophes, etc.)
 * 3. Fix em-dashes
 * 4. Extract body content (remove metadata, references)
 * 5. Remove URLs, copyright, publisher codes, etc.
 * 6. Final cleanup
 */
export function cleanAcademicText(text: string, options: CleanTextOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let result = text;

  // Step 1: Fix ligatures FIRST (before other processing)
  if (opts.fixLigatures) {
    result = fixLigatures(result);
  }

  // Step 2: Fix punctuation spacing (apostrophes, etc.)
  if (opts.fixPunctuationSpacing) {
    result = fixPunctuationSpacing(result);
  }

  // Step 3: Fix em-dashes
  if (opts.fixEmDashes) {
    result = fixEmDashes(result);
  }

  // Step 4: Extract body content (remove metadata, references)
  if (opts.extractBody) {
    result = extractBodyContent(result);
  }

  // Step 5: Existing cleaning functions
  if (opts.removeUrls) {
    result = removeURLs(result);
  }

  if (opts.removeCopyright) {
    result = removeCopyrightNotices(result);
  }

  if (opts.removePublisherInfo) {
    result = removePublisherCodes(result);
  }

  if (opts.removeTableFigureDescriptions) {
    result = removeTableDescriptions(result);
  }

  if (opts.removePageNumbers) {
    result = removePageArtifacts(result);
  }

  if (opts.removeEmails) {
    result = removeEmails(result);
  }

  if (opts.removeBoilerplate) {
    result = removeBoilerplate(result);
  }

  if (opts.formatCitationsShort) {
    result = formatCitations(result);
  }

  // Step 6: Always normalize whitespace at the end
  result = normalizeWhitespace(result);

  return result;
}

/**
 * Extract document metadata from text
 */
export interface ExtractedMetadata {
  title: string | null;
  authors: string[] | null;
  abstract: string | null;
  journalCitation: string | null;
}

export function extractMetadata(text: string, pdfMetadata?: { title?: string | null; author?: string | null }): ExtractedMetadata {
  const lines = text.split('\n').filter((l) => l.trim());

  // Try to extract title (usually first non-empty line, capitalized)
  let title = pdfMetadata?.title || null;
  if (!title && lines.length > 0) {
    // First substantial line that's not all caps and not too long
    for (const line of lines.slice(0, 5)) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && trimmed.length < 200 && !/^[A-Z\s]+$/.test(trimmed)) {
        title = trimmed;
        break;
      }
    }
  }

  // Extract authors
  let authors: string[] | null = null;
  if (pdfMetadata?.author) {
    authors = pdfMetadata.author.split(/[,;&]/).map((a) => a.trim()).filter(Boolean);
  }

  // Try to extract abstract
  let abstract: string | null = null;
  const abstractMatch = text.match(/abstract[:\s]*\n?([\s\S]*?)(?=\n\s*(?:introduction|keywords|1\.?\s|background))/i);
  if (abstractMatch) {
    abstract = abstractMatch[1].trim();
    // Limit abstract length
    if (abstract.length > 2000) {
      abstract = abstract.slice(0, 2000) + '...';
    }
  }

  // Build journal citation if we have title and authors
  let journalCitation: string | null = null;
  if (title && authors && authors.length > 0) {
    const firstAuthor = authors[0].split(/\s+/).pop() || authors[0]; // Get last name
    if (authors.length > 1) {
      journalCitation = `${firstAuthor} et al.`;
    } else {
      journalCitation = firstAuthor;
    }
  }

  return {
    title,
    authors,
    abstract,
    journalCitation,
  };
}
