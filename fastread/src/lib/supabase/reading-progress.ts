/**
 * Reading Progress Service
 *
 * Handles persistence of reading sessions to Supabase.
 * Supports cross-device sync of reading position.
 */

import { supabase, type Database } from './client';

type ReadingProgressRow = Database['public']['Tables']['reading_progress']['Row'];
type ReadingProgressInsert = Database['public']['Tables']['reading_progress']['Insert'];

export interface ReadingProgress {
  id: string;
  userId: string;
  documentId: string;
  wordIndex: number;
  speed: number;
  deviceId: string | null;
  updatedAt: Date;
}

/**
 * Convert database row to ReadingProgress type
 */
function rowToReadingProgress(row: ReadingProgressRow): ReadingProgress {
  return {
    id: row.id,
    userId: row.user_id,
    documentId: row.document_id,
    wordIndex: row.word_index,
    speed: row.speed,
    deviceId: row.device_id,
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Generate a unique device ID for this browser/device
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';

  let deviceId = localStorage.getItem('fastread_device_id');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('fastread_device_id', deviceId);
  }
  return deviceId;
}

/**
 * Get reading progress for a document
 */
export async function getReadingProgress(
  userId: string,
  documentId: string
): Promise<ReadingProgress | null> {
  const { data, error } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('document_id', documentId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    console.error('Error fetching reading progress:', error);
    throw new Error(`Failed to fetch reading progress: ${error.message}`);
  }

  return rowToReadingProgress(data);
}

/**
 * Get all reading progress for a user
 */
export async function getAllReadingProgress(userId: string): Promise<ReadingProgress[]> {
  const { data, error } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching all reading progress:', error);
    throw new Error(`Failed to fetch reading progress: ${error.message}`);
  }

  return (data || []).map(rowToReadingProgress);
}

/**
 * Save or update reading progress
 */
export async function saveReadingProgress(
  userId: string,
  documentId: string,
  wordIndex: number,
  speed: number
): Promise<ReadingProgress> {
  const deviceId = getDeviceId();

  // Check if progress exists for this document
  const existing = await getReadingProgress(userId, documentId);

  if (existing) {
    // Update existing progress
    const { data, error } = await supabase
      .from('reading_progress')
      .update({
        word_index: wordIndex,
        speed,
        device_id: deviceId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reading progress:', error);
      throw new Error(`Failed to update reading progress: ${error.message}`);
    }

    return rowToReadingProgress(data);
  } else {
    // Create new progress
    const insert: ReadingProgressInsert = {
      user_id: userId,
      document_id: documentId,
      word_index: wordIndex,
      speed,
      device_id: deviceId,
    };

    const { data, error } = await supabase
      .from('reading_progress')
      .insert(insert)
      .select()
      .single();

    if (error) {
      console.error('Error creating reading progress:', error);
      throw new Error(`Failed to create reading progress: ${error.message}`);
    }

    return rowToReadingProgress(data);
  }
}

/**
 * Delete reading progress for a document
 */
export async function deleteReadingProgress(userId: string, documentId: string): Promise<void> {
  const { error } = await supabase
    .from('reading_progress')
    .delete()
    .eq('user_id', userId)
    .eq('document_id', documentId);

  if (error) {
    console.error('Error deleting reading progress:', error);
    throw new Error(`Failed to delete reading progress: ${error.message}`);
  }
}

/**
 * Delete all reading progress for a user
 */
export async function deleteAllReadingProgress(userId: string): Promise<void> {
  const { error } = await supabase.from('reading_progress').delete().eq('user_id', userId);

  if (error) {
    console.error('Error deleting all reading progress:', error);
    throw new Error(`Failed to delete reading progress: ${error.message}`);
  }
}

/**
 * Calculate reading stats from progress
 */
export function calculateReadingStats(
  progress: ReadingProgress,
  totalWords: number
): {
  percentComplete: number;
  wordsRemaining: number;
  estimatedTimeRemaining: number; // in minutes
} {
  const percentComplete = totalWords > 0 ? (progress.wordIndex / totalWords) * 100 : 0;
  const wordsRemaining = Math.max(0, totalWords - progress.wordIndex);
  const estimatedTimeRemaining = progress.speed > 0 ? wordsRemaining / progress.speed : 0;

  return {
    percentComplete: Math.min(100, Math.round(percentComplete * 10) / 10),
    wordsRemaining,
    estimatedTimeRemaining: Math.round(estimatedTimeRemaining * 10) / 10,
  };
}
