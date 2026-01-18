import { describe, it, expect } from 'vitest';

import {
  detectSectionType,
  isSectionHeader,
  detectSections,
  parseTextIntoSections,
  getIncludedSections,
  getIncludedText,
} from './section-detector';

describe('detectSectionType', () => {
  it('detects abstract sections', () => {
    expect(detectSectionType('Abstract')).toBe('abstract');
    expect(detectSectionType('ABSTRACT')).toBe('abstract');
    expect(detectSectionType('1. Abstract')).toBe('abstract');
    expect(detectSectionType('Summary')).toBe('abstract');
  });

  it('detects introduction sections', () => {
    expect(detectSectionType('Introduction')).toBe('introduction');
    expect(detectSectionType('1. Introduction')).toBe('introduction');
    expect(detectSectionType('Background')).toBe('introduction');
  });

  it('detects methods sections', () => {
    expect(detectSectionType('Methods')).toBe('methods');
    expect(detectSectionType('Methodology')).toBe('methods');
    expect(detectSectionType('Materials and Methods')).toBe('methods');
    expect(detectSectionType('2. Experimental Setup')).toBe('methods');
  });

  it('detects results sections', () => {
    expect(detectSectionType('Results')).toBe('results');
    expect(detectSectionType('Findings')).toBe('results');
    expect(detectSectionType('3. Results and Discussion')).toBe('results');
  });

  it('detects discussion sections', () => {
    expect(detectSectionType('Discussion')).toBe('discussion');
    expect(detectSectionType('4. Analysis')).toBe('discussion');
  });

  it('detects conclusion sections', () => {
    expect(detectSectionType('Conclusion')).toBe('conclusion');
    expect(detectSectionType('Conclusions')).toBe('conclusion');
    expect(detectSectionType('5. Concluding Remarks')).toBe('conclusion');
    expect(detectSectionType('Future Work')).toBe('conclusion');
  });

  it('detects references sections', () => {
    expect(detectSectionType('References')).toBe('references');
    expect(detectSectionType('Bibliography')).toBe('references');
    expect(detectSectionType('Works Cited')).toBe('references');
  });

  it('detects appendix sections', () => {
    expect(detectSectionType('Appendix')).toBe('appendix');
    expect(detectSectionType('Appendix A')).toBe('appendix');
    expect(detectSectionType('Supplementary Materials')).toBe('appendix');
  });

  it('returns null for non-section headers', () => {
    expect(detectSectionType('This is regular text')).toBeNull();
    expect(detectSectionType('Some other heading')).toBeNull();
  });
});

describe('isSectionHeader', () => {
  it('identifies known section types as headers', () => {
    expect(isSectionHeader('Introduction')).toBe(true);
    expect(isSectionHeader('Methods')).toBe(true);
    expect(isSectionHeader('References')).toBe(true);
  });

  it('identifies numbered sections as headers', () => {
    expect(isSectionHeader('1. Introduction')).toBe(true);
    expect(isSectionHeader('2.1 Data Collection')).toBe(true);
    expect(isSectionHeader('3. Results')).toBe(true);
  });

  it('identifies all-caps headers', () => {
    expect(isSectionHeader('INTRODUCTION')).toBe(true);
    expect(isSectionHeader('METHODS AND MATERIALS')).toBe(true);
  });

  it('rejects regular text', () => {
    expect(isSectionHeader('This is a regular sentence.')).toBe(false);
    expect(isSectionHeader('')).toBe(false);
  });

  it('rejects very long lines', () => {
    const longLine = 'A'.repeat(150);
    expect(isSectionHeader(longLine)).toBe(false);
  });
});

describe('detectSections', () => {
  it('detects multiple sections in text', () => {
    const text = `Abstract

This is the abstract content.

Introduction

This is the introduction content.

Methods

This is the methods section.

Results

These are the results.

References

Smith, J. (2020). A paper title.`;

    const sections = detectSections(text);

    expect(sections).toHaveLength(5);
    expect(sections[0].type).toBe('abstract');
    expect(sections[1].type).toBe('introduction');
    expect(sections[2].type).toBe('methods');
    expect(sections[3].type).toBe('results');
    expect(sections[4].type).toBe('references');
  });

  it('returns empty array for text without sections', () => {
    const text = 'This is just regular text without any section headers.';
    const sections = detectSections(text);
    expect(sections).toHaveLength(0);
  });
});

describe('parseTextIntoSections', () => {
  it('creates Section objects from text', () => {
    const text = `Introduction

This is the introduction.

Methods

This is the methods section.`;

    const sections = parseTextIntoSections(text);

    expect(sections).toHaveLength(2);
    expect(sections[0].type).toBe('introduction');
    expect(sections[0].title).toBe('Introduction');
    expect(sections[0].included).toBe(true);
    expect(sections[1].type).toBe('methods');
  });

  it('returns full document as other when no sections found', () => {
    const text = 'This is regular text without sections.';
    const sections = parseTextIntoSections(text);

    expect(sections).toHaveLength(1);
    expect(sections[0].type).toBe('other');
    expect(sections[0].title).toBe('Full Document');
  });

  it('excludes references and appendix by default', () => {
    const text = `Introduction

Content here.

References

1. Smith, 2020

Appendix A

Extra data.`;

    const sections = parseTextIntoSections(text);

    const refs = sections.find((s) => s.type === 'references');
    const appendix = sections.find((s) => s.type === 'appendix');

    expect(refs?.included).toBe(false);
    expect(appendix?.included).toBe(false);
  });
});

describe('getIncludedSections', () => {
  it('filters out excluded sections', () => {
    const sections = [
      {
        type: 'introduction' as const,
        title: 'Intro',
        content: 'a',
        startIndex: 0,
        endIndex: 10,
        included: true,
      },
      {
        type: 'references' as const,
        title: 'Refs',
        content: 'b',
        startIndex: 11,
        endIndex: 20,
        included: false,
      },
    ];

    const included = getIncludedSections(sections);

    expect(included).toHaveLength(1);
    expect(included[0].type).toBe('introduction');
  });
});

describe('getIncludedText', () => {
  it('combines text from included sections', () => {
    const sections = [
      {
        type: 'introduction' as const,
        title: 'Intro',
        content: 'Hello',
        startIndex: 0,
        endIndex: 10,
        included: true,
      },
      {
        type: 'methods' as const,
        title: 'Methods',
        content: 'World',
        startIndex: 11,
        endIndex: 20,
        included: true,
      },
      {
        type: 'references' as const,
        title: 'Refs',
        content: 'Skip',
        startIndex: 21,
        endIndex: 30,
        included: false,
      },
    ];

    const text = getIncludedText(sections);

    expect(text).toBe('Hello\n\nWorld');
    expect(text).not.toContain('Skip');
  });
});
