import { describe, expect, it } from 'vitest';

import { formatReadingTime, getReadingTime, getWordCount, tokenize } from './tokenizer';

describe('tokenize', () => {
  it('should split simple text into tokens', () => {
    const tokens = tokenize('Hello world');
    expect(tokens).toHaveLength(2);
    expect(tokens[0].word).toBe('Hello');
    expect(tokens[1].word).toBe('world');
  });

  it('should preserve punctuation attached to words', () => {
    const tokens = tokenize('Hello, world!');
    expect(tokens).toHaveLength(2);
    expect(tokens[0].word).toBe('Hello,');
    expect(tokens[0].hasPunctuation).toBe(true);
    expect(tokens[0].punctuationType).toBe('comma');
    expect(tokens[1].word).toBe('world!');
    expect(tokens[1].punctuationType).toBe('exclamation');
  });

  it('should detect different punctuation types', () => {
    const tokens = tokenize('one. two? three! four, five; six:');
    expect(tokens[0].punctuationType).toBe('period');
    expect(tokens[1].punctuationType).toBe('question');
    expect(tokens[2].punctuationType).toBe('exclamation');
    expect(tokens[3].punctuationType).toBe('comma');
    expect(tokens[4].punctuationType).toBe('semicolon');
    expect(tokens[5].punctuationType).toBe('colon');
  });

  it('should fix line-break hyphenation', () => {
    const tokens = tokenize('meth-\nod');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].word).toBe('method');
  });

  it('should preserve intentional hyphenated words', () => {
    const tokens = tokenize('self-driving car');
    expect(tokens).toHaveLength(2);
    expect(tokens[0].word).toBe('self-driving');
    expect(tokens[0].isHyphenated).toBe(true);
  });

  it('should handle multiple paragraphs', () => {
    const tokens = tokenize('First paragraph.\n\nSecond paragraph.');
    expect(tokens).toHaveLength(4);
    // First paragraph last word should have paragraph marker
    expect(tokens[1].punctuationType).toBe('paragraph');
  });

  it('should normalize whitespace', () => {
    const tokens = tokenize('  multiple   spaces   here  ');
    expect(tokens).toHaveLength(3);
    expect(tokens[0].word).toBe('multiple');
  });

  it('should assign sequential originalIndex', () => {
    const tokens = tokenize('one two three');
    expect(tokens[0].originalIndex).toBe(0);
    expect(tokens[1].originalIndex).toBe(1);
    expect(tokens[2].originalIndex).toBe(2);
  });

  it('should handle empty string', () => {
    const tokens = tokenize('');
    expect(tokens).toHaveLength(0);
  });

  it('should handle string with only whitespace', () => {
    const tokens = tokenize('   \n\n   ');
    expect(tokens).toHaveLength(0);
  });
});

describe('getWordCount', () => {
  it('should return correct word count', () => {
    const tokens = tokenize('Hello world');
    expect(getWordCount(tokens)).toBe(2);
  });

  it('should return 0 for empty tokens', () => {
    expect(getWordCount([])).toBe(0);
  });
});

describe('getReadingTime', () => {
  it('should calculate reading time correctly', () => {
    const tokens = tokenize('word '.repeat(300).trim());
    expect(getReadingTime(tokens, 300)).toBe(1); // 300 words at 300 WPM = 1 min
  });

  it('should handle fractional minutes', () => {
    const tokens = tokenize('word '.repeat(150).trim());
    expect(getReadingTime(tokens, 300)).toBe(0.5); // 150 words at 300 WPM = 0.5 min
  });
});

describe('formatReadingTime', () => {
  it('should format minutes correctly', () => {
    expect(formatReadingTime(5)).toBe('5 min');
    expect(formatReadingTime(1)).toBe('1 min');
  });

  it('should handle less than 1 minute', () => {
    expect(formatReadingTime(0.5)).toBe('Less than 1 min');
  });

  it('should round up fractional minutes', () => {
    expect(formatReadingTime(2.3)).toBe('3 min');
  });
});
