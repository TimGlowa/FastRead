/**
 * Word Tokenizer for RSVP Speed Reading
 *
 * Handles:
 * - Splitting text into words
 * - Preserving punctuation attached to words
 * - Handling hyphenated words
 * - Fixing line-break hyphenation (e.g., "meth-\nod" → "method")
 */

export interface Token {
  word: string;
  originalIndex: number;
  hasPunctuation: boolean;
  punctuationType: PunctuationType | null;
  isHyphenated: boolean;
}

export type PunctuationType =
  | 'comma'
  | 'semicolon'
  | 'colon'
  | 'period'
  | 'question'
  | 'exclamation'
  | 'paragraph';

/**
 * Detect the type of trailing punctuation
 */
function detectPunctuation(word: string): PunctuationType | null {
  const lastChar = word.slice(-1);
  switch (lastChar) {
    case ',':
      return 'comma';
    case ';':
      return 'semicolon';
    case ':':
      return 'colon';
    case '.':
      return 'period';
    case '?':
      return 'question';
    case '!':
      return 'exclamation';
    default:
      return null;
  }
}

/**
 * Fix hyphenation from line breaks in PDFs
 * "meth-\nod" → "method"
 * "self-driving" → "self-driving" (preserved)
 */
function fixLineBreakHyphenation(text: string): string {
  // Match hyphen followed by newline and continuation
  return text.replace(/-\n\s*/g, '');
}

/**
 * Normalize whitespace
 * Multiple spaces → single space
 * Normalize line endings
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Split text into paragraphs
 */
function splitIntoParagraphs(text: string): string[] {
  return text.split(/\n\n+/).filter((p) => p.trim().length > 0);
}

/**
 * Tokenize a single paragraph into words
 */
function tokenizeParagraph(
  paragraph: string,
  startIndex: number
): { tokens: Token[]; nextIndex: number } {
  const tokens: Token[] = [];
  // Split on whitespace but keep punctuation attached
  const words = paragraph.split(/\s+/).filter((w) => w.length > 0);

  let currentIndex = startIndex;

  for (const word of words) {
    const punctuation = detectPunctuation(word);
    const isHyphenated = word.includes('-') && !word.startsWith('-');

    tokens.push({
      word,
      originalIndex: currentIndex,
      hasPunctuation: punctuation !== null,
      punctuationType: punctuation,
      isHyphenated,
    });

    currentIndex++;
  }

  return { tokens, nextIndex: currentIndex };
}

/**
 * Main tokenizer function
 * Converts raw text into an array of tokens for the speed reader
 */
export function tokenize(text: string): Token[] {
  // Step 1: Fix line-break hyphenation
  let processed = fixLineBreakHyphenation(text);

  // Step 2: Normalize whitespace
  processed = normalizeWhitespace(processed);

  // Step 3: Split into paragraphs
  const paragraphs = splitIntoParagraphs(processed);

  // Step 4: Tokenize each paragraph
  const allTokens: Token[] = [];
  let currentIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const { tokens, nextIndex } = tokenizeParagraph(
      paragraphs[i],
      currentIndex
    );
    allTokens.push(...tokens);
    currentIndex = nextIndex;

    // Add paragraph break marker (except for last paragraph)
    if (i < paragraphs.length - 1 && tokens.length > 0) {
      // Mark the last token of the paragraph as having a paragraph break
      const lastToken = allTokens[allTokens.length - 1];
      if (lastToken) {
        lastToken.punctuationType = 'paragraph';
        lastToken.hasPunctuation = true;
      }
    }
  }

  return allTokens;
}

/**
 * Get word count from tokens
 */
export function getWordCount(tokens: Token[]): number {
  return tokens.length;
}

/**
 * Get estimated reading time in minutes at given WPM
 */
export function getReadingTime(tokens: Token[], wpm: number): number {
  return tokens.length / wpm;
}

/**
 * Format reading time for display
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) {
    return 'Less than 1 min';
  }
  const roundedMinutes = Math.ceil(minutes);
  return `${roundedMinutes} min`;
}
