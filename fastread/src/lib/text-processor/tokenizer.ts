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
 * "iden- tify" → "identify" (space instead of newline)
 * "self-driving" → "self-driving" (preserved - compound word)
 */
function fixLineBreakHyphenation(text: string): string {
  // Match hyphen followed by newline and continuation
  let result = text.replace(/-\n\s*/g, '');

  // Match hyphen at end of word followed by space and lowercase continuation
  // This catches PDF extraction where line breaks become spaces
  // "iden- tify" → "identify" (broken word)
  // "self-driving" → preserved (compound word, capitalized or longer suffix)
  result = result.replace(
    /(\w{2,})-\s+([a-z]{2,})/g,
    (match, prefix, suffix) => {
      // Heuristics to determine if this is a broken word or compound:
      // 1. If suffix starts with uppercase, it's likely a compound (keep hyphen)
      // 2. If suffix is a common word by itself, it might be a compound
      // 3. Short prefixes with short suffixes are likely broken words

      // Common compound word suffixes to preserve
      const compoundSuffixes = [
        'based', 'driven', 'related', 'oriented', 'specific', 'like',
        'free', 'style', 'type', 'level', 'time', 'term', 'year',
        'old', 'new', 'up', 'down', 'out', 'off', 'on', 'in',
      ];

      if (compoundSuffixes.includes(suffix.toLowerCase())) {
        return match; // Keep hyphen for compound words
      }

      // If the combined word would be a common pattern, join them
      return prefix + suffix;
    }
  );

  return result;
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
 * Split concatenated words that OCR may have stuck together
 * Uses pattern matching to find common word boundaries
 * e.g., "andamatrix" → "and a matrix"
 */
function splitConcatenatedWords(text: string): string {
  let result = text;

  // Common word endings followed by 'a' followed by common word starts
  // "anda" pattern: words ending in consonant + 'a' + word starting with consonant
  // e.g., "andamatrix" → "and a matrix"
  result = result.replace(
    /\b(and|or|but|the|for|with|from|that|this|which|has|have|had|was|were|been|are|is|be|can|may|will|would|should|could|must|shall|not|all|some|any|each|every|no|one|two)a([b-df-hj-np-tv-z][a-z]{2,})\b/gi,
    '$1 a $2'
  );

  // Same but for capital A starting a word after another word
  // "Aset" at start of concatenation - check if preceded by word ending
  result = result.replace(
    /\b([a-z]{2,})A([a-z]{2,})\b/g,
    (match, before, after) => {
      // Check if 'before' ends like a complete word
      const wordEndings = ['ed', 'ing', 'tion', 'sion', 'ness', 'ment', 'able', 'ible', 'ous', 'ive', 'al', 'ly', 'er', 'or', 'ist', 'ism', 'ty', 'ry'];
      const endsLikeWord = wordEndings.some(e => before.endsWith(e)) || before.length >= 3;
      if (endsLikeWord && after.length >= 2) {
        return before + ' A' + after;
      }
      return match;
    }
  );

  return result;
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

  // Step 3: Split concatenated words (common in OCR output)
  processed = splitConcatenatedWords(processed);

  // Step 4: Split into paragraphs
  const paragraphs = splitIntoParagraphs(processed);

  // Step 5: Tokenize each paragraph
  const allTokens: Token[] = [];
  let currentIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const { tokens, nextIndex } = tokenizeParagraph(paragraphs[i], currentIndex);
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
