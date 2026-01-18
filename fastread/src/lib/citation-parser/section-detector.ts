/**
 * Section Detector for Academic Papers
 *
 * Detects common sections in academic papers:
 * - Abstract
 * - Introduction
 * - Methods/Methodology
 * - Results
 * - Discussion
 * - Conclusion
 * - References/Bibliography
 * - Appendix
 */

import type { Section } from '@/types';

export type SectionType = Section['type'];

interface SectionPattern {
  type: SectionType;
  patterns: RegExp[];
}

/**
 * Section header patterns for academic papers
 * Matches numbered sections (1. Introduction) and unnumbered (Introduction)
 */
const SECTION_PATTERNS: SectionPattern[] = [
  {
    type: 'abstract',
    patterns: [/^(?:\d+\.?\s*)?abstract\s*$/i, /^(?:\d+\.?\s*)?summary\s*$/i],
  },
  {
    type: 'introduction',
    patterns: [
      /^(?:\d+\.?\s*)?introduction\s*$/i,
      /^(?:\d+\.?\s*)?background\s*$/i,
      /^(?:\d+\.?\s*)?overview\s*$/i,
    ],
  },
  {
    type: 'methods',
    patterns: [
      /^(?:\d+\.?\s*)?methods?\s*$/i,
      /^(?:\d+\.?\s*)?methodology\s*$/i,
      /^(?:\d+\.?\s*)?materials?\s+and\s+methods?\s*$/i,
      /^(?:\d+\.?\s*)?experimental\s+(?:setup|design|methods?)\s*$/i,
      /^(?:\d+\.?\s*)?procedures?\s*$/i,
      /^(?:\d+\.?\s*)?approach\s*$/i,
    ],
  },
  {
    type: 'results',
    patterns: [
      /^(?:\d+\.?\s*)?results?\s*$/i,
      /^(?:\d+\.?\s*)?findings?\s*$/i,
      /^(?:\d+\.?\s*)?results?\s+and\s+(?:discussion|analysis)\s*$/i,
      /^(?:\d+\.?\s*)?experimental\s+results?\s*$/i,
    ],
  },
  {
    type: 'discussion',
    patterns: [
      /^(?:\d+\.?\s*)?discussion\s*$/i,
      /^(?:\d+\.?\s*)?analysis\s*$/i,
      /^(?:\d+\.?\s*)?interpretation\s*$/i,
    ],
  },
  {
    type: 'conclusion',
    patterns: [
      /^(?:\d+\.?\s*)?conclusions?\s*$/i,
      /^(?:\d+\.?\s*)?concluding\s+remarks?\s*$/i,
      /^(?:\d+\.?\s*)?summary\s+and\s+conclusions?\s*$/i,
      /^(?:\d+\.?\s*)?final\s+remarks?\s*$/i,
      /^(?:\d+\.?\s*)?future\s+work\s*$/i,
    ],
  },
  {
    type: 'references',
    patterns: [
      /^(?:\d+\.?\s*)?references?\s*$/i,
      /^(?:\d+\.?\s*)?bibliography\s*$/i,
      /^(?:\d+\.?\s*)?works?\s+cited\s*$/i,
      /^(?:\d+\.?\s*)?literature\s+cited\s*$/i,
    ],
  },
  {
    type: 'appendix',
    patterns: [
      /^(?:\d+\.?\s*)?appendi(?:x|ces)\s*[a-z]?\s*$/i,
      /^(?:\d+\.?\s*)?supplementary\s+(?:materials?|information)\s*$/i,
      /^(?:\d+\.?\s*)?supporting\s+information\s*$/i,
    ],
  },
];

/**
 * Detect section type from a header line
 */
export function detectSectionType(headerLine: string): SectionType | null {
  const trimmed = headerLine.trim();

  for (const { type, patterns } of SECTION_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(trimmed)) {
        return type;
      }
    }
  }

  return null;
}

/**
 * Check if a line looks like a section header
 * Headers are typically short, may be numbered, and often in all caps or title case
 */
export function isSectionHeader(line: string): boolean {
  const trimmed = line.trim();

  // Empty or too long
  if (!trimmed || trimmed.length > 100) {
    return false;
  }

  // Check if it matches a known section type
  if (detectSectionType(trimmed)) {
    return true;
  }

  // Check for numbered section patterns (e.g., "1. Some Header", "2.1 Subsection")
  // Matches: "1. Intro", "2.1 Data", "3.2.1 Analysis"
  const numberedPattern = /^\d+(?:\.\d+)*\.?\s+[A-Z]/;
  if (numberedPattern.test(trimmed) && trimmed.length < 80) {
    return true;
  }

  // Check for all caps headers (common in some papers)
  const isAllCaps = trimmed === trimmed.toUpperCase() && /^[A-Z\s\d.]+$/.test(trimmed);
  if (isAllCaps && trimmed.length < 50 && trimmed.length > 3) {
    return true;
  }

  return false;
}

interface DetectedSection {
  type: SectionType;
  title: string;
  startLine: number;
  endLine: number;
}

/**
 * Detect sections in text by analyzing line patterns
 */
export function detectSections(text: string): DetectedSection[] {
  const lines = text.split('\n');
  const sections: DetectedSection[] = [];
  let currentSection: DetectedSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isSectionHeader(line)) {
      // Close previous section
      if (currentSection) {
        currentSection.endLine = i - 1;
        sections.push(currentSection);
      }

      // Start new section
      const type = detectSectionType(line) || 'other';
      currentSection = {
        type,
        title: line.trim(),
        startLine: i,
        endLine: lines.length - 1, // Will be updated when next section starts
      };
    }
  }

  // Push the last section
  if (currentSection) {
    currentSection.endLine = lines.length - 1;
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Parse text into Section objects for the ParsedDocument
 */
export function parseTextIntoSections(text: string): Section[] {
  const lines = text.split('\n');
  const detectedSections = detectSections(text);

  // If no sections detected, return entire text as 'other'
  if (detectedSections.length === 0) {
    return [
      {
        type: 'other',
        title: 'Full Document',
        content: text,
        startIndex: 0,
        endIndex: text.length - 1,
        included: true,
      },
    ];
  }

  // Convert detected sections to Section objects
  const sections: Section[] = [];
  let charIndex = 0;

  // Handle content before first section (if any)
  if (detectedSections.length > 0 && detectedSections[0].startLine > 0) {
    const prefaceLines = lines.slice(0, detectedSections[0].startLine);
    const prefaceContent = prefaceLines.join('\n').trim();
    if (prefaceContent) {
      sections.push({
        type: 'other',
        title: 'Preface',
        content: prefaceContent,
        startIndex: 0,
        endIndex: prefaceContent.length - 1,
        included: true,
      });
      charIndex = prefaceContent.length + 1;
    }
  }

  // Process each detected section
  for (const detected of detectedSections) {
    const sectionLines = lines.slice(detected.startLine, detected.endLine + 1);
    const content = sectionLines.join('\n').trim();

    // Skip header line for content (first line is the header)
    const contentWithoutHeader = sectionLines.slice(1).join('\n').trim();

    const startIndex = charIndex;
    const endIndex = startIndex + content.length - 1;

    sections.push({
      type: detected.type,
      title: detected.title,
      content: contentWithoutHeader,
      startIndex,
      endIndex,
      // References and appendix are excluded by default
      included: detected.type !== 'references' && detected.type !== 'appendix',
    });

    charIndex = endIndex + 2; // +2 for newline between sections
  }

  return sections;
}

/**
 * Get sections that should be included in reading
 */
export function getIncludedSections(sections: Section[]): Section[] {
  return sections.filter((s) => s.included);
}

/**
 * Get combined text from included sections
 */
export function getIncludedText(sections: Section[]): string {
  return getIncludedSections(sections)
    .map((s) => s.content)
    .join('\n\n');
}
