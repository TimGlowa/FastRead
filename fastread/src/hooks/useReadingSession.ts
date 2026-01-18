'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getReadingProgress,
  saveReadingProgress,
  deleteReadingProgress,
  calculateReadingStats,
  type ReadingProgress,
} from '@/lib/supabase/reading-progress';
import { useReaderStore } from '@/stores';

export interface UseReadingSessionOptions {
  userId: string | null;
  documentId: string | null;
  autoSave?: boolean;
  saveInterval?: number; // ms between auto-saves
}

export interface UseReadingSessionReturn {
  // State
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved: Date | null;
  progress: ReadingProgress | null;

  // Stats
  percentComplete: number;
  wordsRemaining: number;
  estimatedTimeRemaining: number;

  // Actions
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  resetProgress: () => Promise<void>;
}

const DEFAULT_SAVE_INTERVAL = 5000; // 5 seconds

export function useReadingSession({
  userId,
  documentId,
  autoSave = true,
  saveInterval = DEFAULT_SAVE_INTERVAL,
}: UseReadingSessionOptions): UseReadingSessionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);

  const currentWordIndex = useReaderStore((state) => state.currentWordIndex);
  const speed = useReaderStore((state) => state.speed);
  const words = useReaderStore((state) => state.words);
  const setCurrentWordIndex = useReaderStore((state) => state.setCurrentWordIndex);
  const setSpeed = useReaderStore((state) => state.setSpeed);
  const isPlaying = useReaderStore((state) => state.isPlaying);

  const lastSavedIndexRef = useRef<number>(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef<boolean>(false);

  // Calculate stats
  const totalWords = words.length;
  const stats = progress
    ? calculateReadingStats(progress, totalWords)
    : { percentComplete: 0, wordsRemaining: totalWords, estimatedTimeRemaining: 0 };

  // Update stats based on current position
  const currentStats =
    totalWords > 0
      ? {
          percentComplete: Math.min(100, Math.round((currentWordIndex / totalWords) * 1000) / 10),
          wordsRemaining: Math.max(0, totalWords - currentWordIndex),
          estimatedTimeRemaining:
            speed > 0 ? Math.round(((totalWords - currentWordIndex) / speed) * 10) / 10 : 0,
        }
      : stats;

  // Load progress from Supabase
  const loadProgress = useCallback(async () => {
    if (!userId || !documentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const savedProgress = await getReadingProgress(userId, documentId);

      if (savedProgress) {
        setProgress(savedProgress);
        setCurrentWordIndex(savedProgress.wordIndex);
        setSpeed(savedProgress.speed);
        lastSavedIndexRef.current = savedProgress.wordIndex;
      }
      hasLoadedRef.current = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load progress';
      setError(message);
      console.error('Failed to load reading progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, documentId, setCurrentWordIndex, setSpeed]);

  // Save progress to Supabase
  const saveProgress = useCallback(async () => {
    if (!userId || !documentId) return;

    // Don't save if nothing changed
    if (currentWordIndex === lastSavedIndexRef.current) return;

    setIsSaving(true);
    setError(null);

    try {
      const savedProgress = await saveReadingProgress(userId, documentId, currentWordIndex, speed);

      setProgress(savedProgress);
      setLastSaved(new Date());
      lastSavedIndexRef.current = currentWordIndex;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save progress';
      setError(message);
      console.error('Failed to save reading progress:', err);
    } finally {
      setIsSaving(false);
    }
  }, [userId, documentId, currentWordIndex, speed]);

  // Reset progress
  const resetProgress = useCallback(async () => {
    if (!userId || !documentId) return;

    setIsLoading(true);
    setError(null);

    try {
      await deleteReadingProgress(userId, documentId);
      setProgress(null);
      setCurrentWordIndex(0);
      lastSavedIndexRef.current = 0;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset progress';
      setError(message);
      console.error('Failed to reset reading progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, documentId, setCurrentWordIndex]);

  // Load progress on mount
  useEffect(() => {
    if (userId && documentId) {
      loadProgress();
    }
  }, [userId, documentId, loadProgress]);

  // Auto-save when reading position changes
  useEffect(() => {
    if (!autoSave || !userId || !documentId) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Don't auto-save while playing (too frequent)
    // Instead, save when paused or at intervals
    if (!isPlaying && currentWordIndex !== lastSavedIndexRef.current) {
      saveTimeoutRef.current = setTimeout(() => {
        saveProgress();
      }, 1000); // Save 1 second after pausing
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [autoSave, userId, documentId, currentWordIndex, isPlaying, saveProgress]);

  // Periodic save while playing
  useEffect(() => {
    if (!autoSave || !userId || !documentId || !isPlaying) return;

    const intervalId = setInterval(() => {
      if (currentWordIndex !== lastSavedIndexRef.current) {
        saveProgress();
      }
    }, saveInterval);

    return () => clearInterval(intervalId);
  }, [autoSave, userId, documentId, isPlaying, saveInterval, currentWordIndex, saveProgress]);

  // Save on unmount or document change
  useEffect(() => {
    return () => {
      // Attempt to save on cleanup (may not always work)
      if (userId && documentId && currentWordIndex !== lastSavedIndexRef.current) {
        // Use sync localStorage as backup
        const key = `reading_progress_${documentId}`;
        localStorage.setItem(
          key,
          JSON.stringify({
            wordIndex: currentWordIndex,
            speed,
            updatedAt: new Date().toISOString(),
          })
        );
      }
    };
  }, [userId, documentId, currentWordIndex, speed]);

  // Restore from localStorage on load (backup) - only on initial mount before Supabase load
  useEffect(() => {
    // Only restore from localStorage if we haven't loaded from Supabase yet
    if (!documentId || progress || hasLoadedRef.current) return;

    const key = `reading_progress_${documentId}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.wordIndex > currentWordIndex) {
          setCurrentWordIndex(data.wordIndex);
          if (data.speed) setSpeed(data.speed);
        }
        // Clear localStorage backup after restoring
        localStorage.removeItem(key);
      } catch {
        // Ignore parse errors
      }
    }
  }, [documentId, progress, currentWordIndex, setCurrentWordIndex, setSpeed]);

  return {
    isLoading,
    isSaving,
    error,
    lastSaved,
    progress,
    percentComplete: currentStats.percentComplete,
    wordsRemaining: currentStats.wordsRemaining,
    estimatedTimeRemaining: currentStats.estimatedTimeRemaining,
    saveProgress,
    loadProgress,
    resetProgress,
  };
}

export default useReadingSession;
