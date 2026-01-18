import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  getReadingProgress,
  saveReadingProgress,
  deleteReadingProgress,
} from '@/lib/supabase/reading-progress';
import { useReaderStore } from '@/stores';

import { useReadingSession } from './useReadingSession';

// Mock supabase reading progress service
vi.mock('@/lib/supabase/reading-progress', () => ({
  getReadingProgress: vi.fn(),
  saveReadingProgress: vi.fn(),
  deleteReadingProgress: vi.fn(),
  calculateReadingStats: vi.fn(() => ({
    percentComplete: 50,
    wordsRemaining: 500,
    estimatedTimeRemaining: 1.5,
  })),
}));

const mockGetReadingProgress = vi.mocked(getReadingProgress);
const mockSaveReadingProgress = vi.mocked(saveReadingProgress);
const mockDeleteReadingProgress = vi.mocked(deleteReadingProgress);

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useReadingSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    useReaderStore.getState().reset();

    // Set up some words in the store
    useReaderStore.getState().setWords(['word1', 'word2', 'word3', 'word4', 'word5']);
  });

  it('loads progress on mount when userId and documentId are provided', async () => {
    const mockProgress = {
      id: 'progress-1',
      userId: 'user-1',
      documentId: 'doc-1',
      wordIndex: 2,
      speed: 350,
      deviceId: 'device-1',
      updatedAt: new Date(),
    };

    mockGetReadingProgress.mockResolvedValue(mockProgress);

    const { result } = renderHook(() =>
      useReadingSession({
        userId: 'user-1',
        documentId: 'doc-1',
      })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetReadingProgress).toHaveBeenCalledWith('user-1', 'doc-1');
    expect(result.current.progress).toEqual(mockProgress);
    expect(useReaderStore.getState().currentWordIndex).toBe(2);
    expect(useReaderStore.getState().speed).toBe(350);
  });

  it('does not load progress when userId is null', () => {
    renderHook(() =>
      useReadingSession({
        userId: null,
        documentId: 'doc-1',
      })
    );

    expect(mockGetReadingProgress).not.toHaveBeenCalled();
  });

  it('does not load progress when documentId is null', () => {
    renderHook(() =>
      useReadingSession({
        userId: 'user-1',
        documentId: null,
      })
    );

    expect(mockGetReadingProgress).not.toHaveBeenCalled();
  });

  it('saves progress manually', async () => {
    mockGetReadingProgress.mockResolvedValue(null);
    mockSaveReadingProgress.mockResolvedValue({
      id: 'new-progress',
      userId: 'user-1',
      documentId: 'doc-1',
      wordIndex: 3,
      speed: 300,
      deviceId: 'device-1',
      updatedAt: new Date(),
    });

    // Set current position
    useReaderStore.getState().setCurrentWordIndex(3);

    const { result } = renderHook(() =>
      useReadingSession({
        userId: 'user-1',
        documentId: 'doc-1',
        autoSave: false,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.saveProgress();
    });

    expect(mockSaveReadingProgress).toHaveBeenCalledWith('user-1', 'doc-1', 3, 300);
    expect(result.current.lastSaved).not.toBeNull();
  });

  it('resets progress', async () => {
    // Return progress on first call, null after (simulating deletion)
    mockGetReadingProgress
      .mockResolvedValueOnce({
        id: 'progress-1',
        userId: 'user-1',
        documentId: 'doc-1',
        wordIndex: 3,
        speed: 300,
        deviceId: 'device-1',
        updatedAt: new Date(),
      })
      .mockResolvedValue(null); // Subsequent calls return null

    mockDeleteReadingProgress.mockResolvedValue(undefined);

    useReaderStore.getState().setCurrentWordIndex(3);

    const { result } = renderHook(() =>
      useReadingSession({
        userId: 'user-1',
        documentId: 'doc-1',
        autoSave: false,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear all mocks and set fresh behavior before reset
    localStorageMock.clear();

    await act(async () => {
      await result.current.resetProgress();
    });

    expect(mockDeleteReadingProgress).toHaveBeenCalledWith('user-1', 'doc-1');
    expect(result.current.progress).toBeNull();
    expect(useReaderStore.getState().currentWordIndex).toBe(0);
  });

  it('calculates reading stats correctly', async () => {
    mockGetReadingProgress.mockResolvedValue(null);

    useReaderStore.getState().setCurrentWordIndex(2);

    const { result } = renderHook(() =>
      useReadingSession({
        userId: 'user-1',
        documentId: 'doc-1',
        autoSave: false,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 2 out of 5 words = 40%
    expect(result.current.percentComplete).toBe(40);
    expect(result.current.wordsRemaining).toBe(3);
  });
});
