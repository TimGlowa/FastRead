import { describe, it, expect, vi, beforeEach } from 'vitest';

import { exportAsBibTeX, exportAsText } from './citations';

import type { SavedCitation } from '@/types';

// Mock supabase client
vi.mock('./client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('citations service', () => {
  const mockCitations: SavedCitation[] = [
    {
      id: 'citation-1',
      documentId: 'doc-1',
      rawText: '(Smith, 2020)',
      authors: ['Smith'],
      year: 2020,
      context: 'This is the context around the citation.',
      savedAt: new Date('2024-01-15'),
      position: 100,
    },
    {
      id: 'citation-2',
      documentId: 'doc-1',
      rawText: '(Jones & Brown, 2019, p. 45)',
      authors: ['Jones', 'Brown'],
      year: 2019,
      pageNumber: '45',
      context: 'Another context for this citation.',
      savedAt: new Date('2024-01-16'),
      position: 200,
    },
    {
      id: 'citation-3',
      documentId: 'doc-1',
      rawText: '[1]',
      authors: ['[1]'],
      year: 0,
      context: 'Numeric citation context.',
      savedAt: new Date('2024-01-17'),
      position: 300,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportAsBibTeX', () => {
    it('exports citations in BibTeX format', () => {
      const result = exportAsBibTeX(mockCitations);

      expect(result).toContain('@article{cite1,');
      expect(result).toContain('author = {Smith}');
      expect(result).toContain('year = {2020}');
      expect(result).toContain('note = {(Smith, 2020)}');

      expect(result).toContain('@article{cite2,');
      expect(result).toContain('author = {Jones and Brown}');
      expect(result).toContain('year = {2019}');
    });

    it('handles citations without year', () => {
      const result = exportAsBibTeX(mockCitations);

      expect(result).toContain('@article{cite3,');
      expect(result).toContain('year = {n.d.}');
    });

    it('returns empty string for empty array', () => {
      const result = exportAsBibTeX([]);
      expect(result).toBe('');
    });
  });

  describe('exportAsText', () => {
    it('exports citations in plain text format', () => {
      const result = exportAsText(mockCitations);

      expect(result).toContain('1. Smith (2020)');
      expect(result).toContain('(Smith, 2020)');
      expect(result).toContain('Context: "This is the context around the citation."');

      expect(result).toContain('2. Jones, Brown (2019)');
      expect(result).toContain('(Jones & Brown, 2019, p. 45)');
    });

    it('handles citations without year', () => {
      const result = exportAsText(mockCitations);

      expect(result).toContain('3. [1]');
      expect(result).not.toContain('3. [1] ()'); // No empty year parens
    });

    it('returns empty string for empty array', () => {
      const result = exportAsText([]);
      expect(result).toBe('');
    });
  });
});
