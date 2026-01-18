/**
 * Supabase Citations Service
 *
 * Handles CRUD operations for saved citations in Supabase.
 */

import { supabase, type Database } from './client';

import type { SavedCitation } from '@/types';

type SavedCitationRow = Database['public']['Tables']['saved_citations']['Row'];
type SavedCitationInsert = Database['public']['Tables']['saved_citations']['Insert'];

/**
 * Convert database row to SavedCitation type
 */
function rowToSavedCitation(row: SavedCitationRow): SavedCitation {
  // Parse the citation text to extract authors and year
  const parsed = parseCitationText(row.citation_text);

  return {
    id: row.id,
    documentId: row.document_id,
    rawText: row.citation_text,
    authors: parsed.authors,
    year: parsed.year,
    pageNumber: parsed.pages,
    context: row.context || '',
    savedAt: new Date(row.created_at),
    position: row.position || 0,
  };
}

/**
 * Parse citation text to extract structured data
 */
function parseCitationText(text: string): { authors: string[]; year: number; pages?: string } {
  // Try to parse APA-style citation: (Smith, 2020) or (Smith & Jones, 2020, p. 45)
  const apaMatch = text.match(/\(([^,]+)(?:,\s*(\d{4}))(?:,\s*pp?\.\s*(\d+(?:-\d+)?))?\)/);

  if (apaMatch) {
    const authorStr = apaMatch[1];
    const year = parseInt(apaMatch[2], 10);
    const pages = apaMatch[3];

    const authors = authorStr
      .split(/(?:,\s*|\s+(?:&|and)\s+)/)
      .map((a) => a.trim())
      .filter((a) => a.length > 0 && a !== 'et al.');

    if (authorStr.includes('et al.')) {
      authors.push('et al.');
    }

    return { authors, year, pages };
  }

  // Try numeric citation: [1] or [1,2,3]
  const numericMatch = text.match(/\[(\d+(?:[-,]\s*\d+)*)\]/);
  if (numericMatch) {
    return { authors: [text], year: 0 };
  }

  // Fallback - return raw text as author
  return { authors: [text], year: 0 };
}

/**
 * Convert SavedCitation to database insert format
 */
function savedCitationToInsert(
  citation: Omit<SavedCitation, 'id' | 'savedAt'>,
  userId: string
): SavedCitationInsert {
  return {
    user_id: userId,
    document_id: citation.documentId,
    citation_text: citation.rawText,
    context: citation.context || null,
    position: citation.position || null,
  };
}

/**
 * Get all saved citations for a user
 */
export async function getSavedCitations(userId: string): Promise<SavedCitation[]> {
  const { data, error } = await supabase
    .from('saved_citations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved citations:', error);
    throw new Error(`Failed to fetch saved citations: ${error.message}`);
  }

  return (data || []).map(rowToSavedCitation);
}

/**
 * Get saved citations for a specific document
 */
export async function getSavedCitationsForDocument(
  userId: string,
  documentId: string
): Promise<SavedCitation[]> {
  const { data, error } = await supabase
    .from('saved_citations')
    .select('*')
    .eq('user_id', userId)
    .eq('document_id', documentId)
    .order('position', { ascending: true });

  if (error) {
    console.error('Error fetching document citations:', error);
    throw new Error(`Failed to fetch document citations: ${error.message}`);
  }

  return (data || []).map(rowToSavedCitation);
}

/**
 * Save a new citation
 */
export async function saveCitation(
  citation: Omit<SavedCitation, 'id' | 'savedAt'>,
  userId: string
): Promise<SavedCitation> {
  const insert = savedCitationToInsert(citation, userId);

  const { data, error } = await supabase.from('saved_citations').insert(insert).select().single();

  if (error) {
    console.error('Error saving citation:', error);
    throw new Error(`Failed to save citation: ${error.message}`);
  }

  return rowToSavedCitation(data);
}

/**
 * Save multiple citations at once
 */
export async function saveCitations(
  citations: Omit<SavedCitation, 'id' | 'savedAt'>[],
  userId: string
): Promise<SavedCitation[]> {
  const inserts = citations.map((c) => savedCitationToInsert(c, userId));

  const { data, error } = await supabase.from('saved_citations').insert(inserts).select();

  if (error) {
    console.error('Error saving citations:', error);
    throw new Error(`Failed to save citations: ${error.message}`);
  }

  return (data || []).map(rowToSavedCitation);
}

/**
 * Delete a saved citation
 */
export async function deleteCitation(citationId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_citations')
    .delete()
    .eq('id', citationId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting citation:', error);
    throw new Error(`Failed to delete citation: ${error.message}`);
  }
}

/**
 * Delete all citations for a document
 */
export async function deleteCitationsForDocument(
  documentId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('saved_citations')
    .delete()
    .eq('document_id', documentId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting document citations:', error);
    throw new Error(`Failed to delete document citations: ${error.message}`);
  }
}

/**
 * Delete all citations for a user
 */
export async function deleteAllCitations(userId: string): Promise<void> {
  const { error } = await supabase.from('saved_citations').delete().eq('user_id', userId);

  if (error) {
    console.error('Error deleting all citations:', error);
    throw new Error(`Failed to delete all citations: ${error.message}`);
  }
}

/**
 * Check if a citation already exists (to prevent duplicates)
 */
export async function citationExists(
  userId: string,
  documentId: string,
  citationText: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('saved_citations')
    .select('id')
    .eq('user_id', userId)
    .eq('document_id', documentId)
    .eq('citation_text', citationText)
    .limit(1);

  if (error) {
    console.error('Error checking citation existence:', error);
    return false;
  }

  return (data?.length || 0) > 0;
}

/**
 * Get citation count for a user
 */
export async function getCitationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('saved_citations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('Error getting citation count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Export citations as BibTeX format
 */
export function exportAsBibTeX(citations: SavedCitation[]): string {
  return citations
    .map((c, i) => {
      const key = `cite${i + 1}`;
      const authors = c.authors.join(' and ');
      const year = c.year || 'n.d.';

      return `@article{${key},
  author = {${authors}},
  year = {${year}},
  note = {${c.rawText}}
}`;
    })
    .join('\n\n');
}

/**
 * Export citations as plain text
 */
export function exportAsText(citations: SavedCitation[]): string {
  return citations
    .map((c, i) => {
      const authors = c.authors.join(', ');
      const year = c.year ? ` (${c.year})` : '';
      return `${i + 1}. ${authors}${year}\n   ${c.rawText}\n   Context: "${c.context}"`;
    })
    .join('\n\n');
}
