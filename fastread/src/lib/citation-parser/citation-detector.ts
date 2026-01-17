/**
 * Citation Detector for Academic Papers
 *
 * Detects common citation patterns:
 * - APA: (Smith, 2020), (Smith & Jones, 2020), (Smith et al., 2020)
 * - Harvard: (Smith 2020), (Smith and Jones 2020)
 * - Numeric: [1], [1,2,3], [1-5]
 * - Superscript-style: indicated by context (1, 2, 3)
 */

import type { DetectedCitation } from '@/types';

export type CitationStyle = 'apa' | 'harvard' | 'numeric' | 'unknown';

interface CitationMatch {
  fullMatch: string;
  startIndex: number;
  endIndex: number;
  style: CitationStyle;
  authors: string[];
  year: number | null;
  pages?: string;
}

/**
 * Regex patterns for different citation styles
 */
const CITATION_PATTERNS = {
  // APA style: (Smith, 2020), (Smith & Jones, 2020), (Smith et al., 2020)
  // Also matches: (Smith, 2020, p. 45), (Smith, 2020, pp. 45-50)
  apa: /\(([A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.)?),\s*(\d{4})(?:,\s*pp?\.\s*(\d+(?:-\d+)?))?\)/g,

  // Harvard style: (Smith 2020), (Smith and Jones 2020)
  harvard: /\(([A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.)?)\s+(\d{4})(?:,\s*pp?\.\s*(\d+(?:-\d+)?))?\)/g,

  // Multiple authors APA: (Smith, Jones, & Williams, 2020)
  apaMultiple: /\(([A-Z][a-z]+(?:,\s+[A-Z][a-z]+)*(?:,?\s*&\s*[A-Z][a-z]+)?),\s*(\d{4})(?:,\s*pp?\.\s*(\d+(?:-\d+)?))?\)/g,

  // Numeric citations: [1], [1,2,3], [1-5], [1, 2, 3]
  numeric: /\[(\d+(?:[-,]\s*\d+)*)\]/g,

  // Year only in context: as shown by Smith (2020)
  yearInContext: /([A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.)?)\s*\((\d{4})\)/g,
};

/**
 * Parse author string into array of author names
 */
function parseAuthors(authorStr: string): string[] {
  // Handle "et al."
  if (authorStr.includes('et al.')) {
    const mainAuthor = authorStr.replace(/\s+et\s+al\./, '').trim();
    return [mainAuthor, 'et al.'];
  }

  // Split by common separators
  const authors = authorStr
    .split(/(?:,\s*|\s+(?:&|and)\s+)/)
    .map((a) => a.trim())
    .filter((a) => a.length > 0);

  return authors;
}

/**
 * Parse numeric citation range (e.g., "1-5" -> [1,2,3,4,5])
 */
function parseNumericCitation(numStr: string): number[] {
  const parts = numStr.split(/[,\s]+/);
  const numbers: number[] = [];

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let i = start; i <= end; i++) {
        numbers.push(i);
      }
    } else {
      const num = parseInt(part, 10);
      if (!isNaN(num)) {
        numbers.push(num);
      }
    }
  }

  return numbers;
}

/**
 * Find all citations in text using APA pattern
 */
function findAPACitations(text: string): CitationMatch[] {
  const matches: CitationMatch[] = [];

  // Reset regex
  CITATION_PATTERNS.apa.lastIndex = 0;
  CITATION_PATTERNS.apaMultiple.lastIndex = 0;

  // Standard APA
  let match: RegExpExecArray | null;
  while ((match = CITATION_PATTERNS.apa.exec(text)) !== null) {
    matches.push({
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length - 1,
      style: 'apa',
      authors: parseAuthors(match[1]),
      year: parseInt(match[2], 10),
      pages: match[3],
    });
  }

  // Multiple authors APA (check for non-overlapping)
  let multiMatch: RegExpExecArray | null;
  while ((multiMatch = CITATION_PATTERNS.apaMultiple.exec(text)) !== null) {
    const isDuplicate = matches.some(
      (m) => m.startIndex === multiMatch!.index || (multiMatch!.index >= m.startIndex && multiMatch!.index <= m.endIndex)
    );
    if (!isDuplicate) {
      matches.push({
        fullMatch: multiMatch[0],
        startIndex: multiMatch.index,
        endIndex: multiMatch.index + multiMatch[0].length - 1,
        style: 'apa',
        authors: parseAuthors(multiMatch[1]),
        year: parseInt(multiMatch[2], 10),
        pages: multiMatch[3],
      });
    }
  }

  return matches;
}

/**
 * Find all citations in text using Harvard pattern
 */
function findHarvardCitations(text: string): CitationMatch[] {
  const matches: CitationMatch[] = [];

  CITATION_PATTERNS.harvard.lastIndex = 0;

  let match;
  while ((match = CITATION_PATTERNS.harvard.exec(text)) !== null) {
    matches.push({
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length - 1,
      style: 'harvard',
      authors: parseAuthors(match[1]),
      year: parseInt(match[2], 10),
      pages: match[3],
    });
  }

  return matches;
}

/**
 * Find all numeric citations in text
 */
function findNumericCitations(text: string): CitationMatch[] {
  const matches: CitationMatch[] = [];

  CITATION_PATTERNS.numeric.lastIndex = 0;

  let match;
  while ((match = CITATION_PATTERNS.numeric.exec(text)) !== null) {
    const numbers = parseNumericCitation(match[1]);
    matches.push({
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length - 1,
      style: 'numeric',
      authors: numbers.map((n) => `[${n}]`),
      year: null,
    });
  }

  return matches;
}

/**
 * Find in-context citations (e.g., "Smith (2020) found that...")
 */
function findInContextCitations(text: string): CitationMatch[] {
  const matches: CitationMatch[] = [];

  CITATION_PATTERNS.yearInContext.lastIndex = 0;

  let match;
  while ((match = CITATION_PATTERNS.yearInContext.exec(text)) !== null) {
    matches.push({
      fullMatch: match[0],
      startIndex: match.index,
      endIndex: match.index + match[0].length - 1,
      style: 'apa',
      authors: parseAuthors(match[1]),
      year: parseInt(match[2], 10),
    });
  }

  return matches;
}

/**
 * Detect the predominant citation style in a document
 */
export function detectCitationStyle(text: string): CitationStyle {
  const apaCount = findAPACitations(text).length;
  const harvardCount = findHarvardCitations(text).length;
  const numericCount = findNumericCitations(text).length;

  const total = apaCount + harvardCount + numericCount;
  if (total === 0) return 'unknown';

  if (numericCount > apaCount && numericCount > harvardCount) {
    return 'numeric';
  }
  if (harvardCount > apaCount) {
    return 'harvard';
  }
  return 'apa';
}

/**
 * Find all citations in text
 */
export function findAllCitations(text: string): CitationMatch[] {
  const allMatches: CitationMatch[] = [];

  // Collect all matches
  allMatches.push(...findAPACitations(text));
  allMatches.push(...findHarvardCitations(text));
  allMatches.push(...findNumericCitations(text));
  allMatches.push(...findInContextCitations(text));

  // Sort by position and remove duplicates
  allMatches.sort((a, b) => a.startIndex - b.startIndex);

  // Remove overlapping citations (keep the longer/more specific one)
  const filtered: CitationMatch[] = [];
  for (const match of allMatches) {
    const overlapping = filtered.findIndex(
      (m) =>
        (match.startIndex >= m.startIndex && match.startIndex <= m.endIndex) ||
        (match.endIndex >= m.startIndex && match.endIndex <= m.endIndex)
    );

    if (overlapping === -1) {
      filtered.push(match);
    } else if (match.fullMatch.length > filtered[overlapping].fullMatch.length) {
      // Replace with longer match
      filtered[overlapping] = match;
    }
  }

  return filtered;
}

/**
 * Convert citation matches to DetectedCitation objects
 */
export function detectCitations(text: string): DetectedCitation[] {
  const matches = findAllCitations(text);

  return matches.map((match, index) => ({
    id: `citation-${index}`,
    rawText: match.fullMatch,
    startIndex: match.startIndex,
    endIndex: match.endIndex,
    pattern: match.style,
    parsed: {
      authors: match.authors,
      year: match.year || 0,
      pages: match.pages,
    },
  }));
}

/**
 * Get citation indices in tokenized word array
 * Useful for highlighting citations during RSVP reading
 */
export function getCitationWordIndices(
  text: string,
  citations: DetectedCitation[]
): Map<number, DetectedCitation> {
  const citationMap = new Map<number, DetectedCitation>();

  // Build character-to-word index mapping
  const words = text.split(/\s+/);
  let charIndex = 0;
  const wordPositions: { start: number; end: number }[] = [];

  for (const word of words) {
    const start = text.indexOf(word, charIndex);
    const end = start + word.length - 1;
    wordPositions.push({ start, end });
    charIndex = end + 1;
  }

  // Map citations to word indices
  for (const citation of citations) {
    for (let i = 0; i < wordPositions.length; i++) {
      const pos = wordPositions[i];
      if (
        (citation.startIndex >= pos.start && citation.startIndex <= pos.end) ||
        (citation.endIndex >= pos.start && citation.endIndex <= pos.end) ||
        (citation.startIndex <= pos.start && citation.endIndex >= pos.end)
      ) {
        citationMap.set(i, citation);
      }
    }
  }

  return citationMap;
}
