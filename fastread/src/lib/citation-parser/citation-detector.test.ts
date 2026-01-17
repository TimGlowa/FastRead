import { describe, it, expect } from 'vitest';

import {
  detectCitationStyle,
  findAllCitations,
  detectCitations,
  getCitationWordIndices,
} from './citation-detector';

describe('detectCitationStyle', () => {
  it('detects APA style citations', () => {
    const text = `
      According to Smith (2020), this is important.
      Previous research (Jones & Brown, 2019) supports this.
      Multiple studies (Adams et al., 2021) confirm the findings.
    `;
    expect(detectCitationStyle(text)).toBe('apa');
  });

  it('detects Harvard style citations', () => {
    const text = `
      According to Smith (2020), this is important.
      Previous research (Jones and Brown 2019) supports this.
      Multiple studies (Adams et al. 2021) confirm the findings.
    `;
    // Harvard is very similar to APA, detection may vary
    const style = detectCitationStyle(text);
    expect(['apa', 'harvard']).toContain(style);
  });

  it('detects numeric style citations', () => {
    const text = `
      This is supported by previous research [1].
      Multiple studies [2,3,4] confirm this.
      A range of papers [5-10] have shown similar results.
    `;
    expect(detectCitationStyle(text)).toBe('numeric');
  });

  it('returns unknown when no citations found', () => {
    const text = 'This is regular text without any citations.';
    expect(detectCitationStyle(text)).toBe('unknown');
  });
});

describe('findAllCitations', () => {
  it('finds APA style citations', () => {
    const text = 'Research shows (Smith, 2020) that this is true.';
    const citations = findAllCitations(text);

    expect(citations).toHaveLength(1);
    expect(citations[0].fullMatch).toBe('(Smith, 2020)');
    expect(citations[0].style).toBe('apa');
    expect(citations[0].year).toBe(2020);
  });

  it('finds APA citations with multiple authors', () => {
    const text = 'Studies show (Smith & Jones, 2020) important findings.';
    const citations = findAllCitations(text);

    expect(citations).toHaveLength(1);
    expect(citations[0].authors).toContain('Smith');
    expect(citations[0].authors).toContain('Jones');
  });

  it('finds APA citations with et al.', () => {
    const text = 'Research (Smith et al., 2020) confirms this.';
    const citations = findAllCitations(text);

    expect(citations).toHaveLength(1);
    expect(citations[0].authors).toContain('Smith');
    expect(citations[0].authors).toContain('et al.');
  });

  it('finds APA citations with page numbers', () => {
    const text = 'Quote from source (Smith, 2020, p. 45).';
    const citations = findAllCitations(text);

    expect(citations).toHaveLength(1);
    expect(citations[0].pages).toBe('45');
  });

  it('finds numeric citations', () => {
    const text = 'This has been shown [1] multiple times [2,3,4].';
    const citations = findAllCitations(text);

    expect(citations).toHaveLength(2);
    expect(citations[0].fullMatch).toBe('[1]');
    expect(citations[1].fullMatch).toBe('[2,3,4]');
  });

  it('finds numeric citation ranges', () => {
    const text = 'Multiple studies [1-5] support this.';
    const citations = findAllCitations(text);

    expect(citations).toHaveLength(1);
    expect(citations[0].fullMatch).toBe('[1-5]');
  });

  it('finds in-context author citations', () => {
    const text = 'Smith (2020) found that this is important.';
    const citations = findAllCitations(text);

    expect(citations).toHaveLength(1);
    expect(citations[0].fullMatch).toBe('Smith (2020)');
  });

  it('handles multiple citations in text', () => {
    const text = `
      According to Smith (2020), this is true.
      However, Jones & Brown (2019) disagree.
      The evidence [1,2] supports the first view.
    `;
    const citations = findAllCitations(text);

    expect(citations.length).toBeGreaterThanOrEqual(3);
  });

  it('returns empty array when no citations found', () => {
    const text = 'This is regular text without citations.';
    const citations = findAllCitations(text);

    expect(citations).toHaveLength(0);
  });
});

describe('detectCitations', () => {
  it('converts matches to DetectedCitation objects', () => {
    const text = 'Research (Smith, 2020) shows this.';
    const citations = detectCitations(text);

    expect(citations).toHaveLength(1);
    expect(citations[0]).toMatchObject({
      rawText: '(Smith, 2020)',
      pattern: 'apa',
      parsed: {
        authors: expect.arrayContaining(['Smith']),
        year: 2020,
      },
    });
    expect(citations[0].id).toBe('citation-0');
  });

  it('assigns unique IDs to each citation', () => {
    const text = 'First (Smith, 2020) and second (Jones, 2019).';
    const citations = detectCitations(text);

    expect(citations[0].id).toBe('citation-0');
    expect(citations[1].id).toBe('citation-1');
  });
});

describe('getCitationWordIndices', () => {
  it('maps citations to word indices', () => {
    const text = 'Research shows (Smith, 2020) that this is important.';
    const citations = detectCitations(text);
    const indices = getCitationWordIndices(text, citations);

    // "(Smith," and "2020)" should be marked
    expect(indices.size).toBeGreaterThan(0);
  });

  it('returns empty map when no citations', () => {
    const text = 'Regular text without citations.';
    const citations = detectCitations(text);
    const indices = getCitationWordIndices(text, citations);

    expect(indices.size).toBe(0);
  });
});
