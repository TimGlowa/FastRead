import { describe, it, expect, vi, beforeEach } from 'vitest';

import { calculateReadingStats, getDeviceId } from './reading-progress';
import type { ReadingProgress } from './reading-progress';

// Mock supabase client
vi.mock('./client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
  },
}));

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

describe('reading-progress service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('getDeviceId', () => {
    it('generates a new device ID if none exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const deviceId = getDeviceId();

      expect(deviceId).toMatch(/^device_\d+_[a-z0-9]+$/);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'fastread_device_id',
        expect.any(String)
      );
    });

    it('returns existing device ID if stored', () => {
      const existingId = 'device_123_abc123';
      localStorageMock.getItem.mockReturnValue(existingId);

      const deviceId = getDeviceId();

      expect(deviceId).toBe(existingId);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('calculateReadingStats', () => {
    it('calculates stats correctly', () => {
      const progress: ReadingProgress = {
        id: 'progress-1',
        userId: 'user-1',
        documentId: 'doc-1',
        wordIndex: 500,
        speed: 300,
        deviceId: null,
        updatedAt: new Date(),
      };

      const stats = calculateReadingStats(progress, 1000);

      expect(stats.percentComplete).toBe(50);
      expect(stats.wordsRemaining).toBe(500);
      expect(stats.estimatedTimeRemaining).toBeCloseTo(1.7, 1); // 500 words / 300 WPM
    });

    it('handles zero total words', () => {
      const progress: ReadingProgress = {
        id: 'progress-1',
        userId: 'user-1',
        documentId: 'doc-1',
        wordIndex: 0,
        speed: 300,
        deviceId: null,
        updatedAt: new Date(),
      };

      const stats = calculateReadingStats(progress, 0);

      expect(stats.percentComplete).toBe(0);
      expect(stats.wordsRemaining).toBe(0);
      expect(stats.estimatedTimeRemaining).toBe(0);
    });

    it('handles zero speed', () => {
      const progress: ReadingProgress = {
        id: 'progress-1',
        userId: 'user-1',
        documentId: 'doc-1',
        wordIndex: 500,
        speed: 0,
        deviceId: null,
        updatedAt: new Date(),
      };

      const stats = calculateReadingStats(progress, 1000);

      expect(stats.percentComplete).toBe(50);
      expect(stats.wordsRemaining).toBe(500);
      expect(stats.estimatedTimeRemaining).toBe(0);
    });

    it('caps percent complete at 100', () => {
      const progress: ReadingProgress = {
        id: 'progress-1',
        userId: 'user-1',
        documentId: 'doc-1',
        wordIndex: 1500, // Past the end
        speed: 300,
        deviceId: null,
        updatedAt: new Date(),
      };

      const stats = calculateReadingStats(progress, 1000);

      expect(stats.percentComplete).toBe(100);
      expect(stats.wordsRemaining).toBe(0);
    });

    it('rounds percent to one decimal place', () => {
      const progress: ReadingProgress = {
        id: 'progress-1',
        userId: 'user-1',
        documentId: 'doc-1',
        wordIndex: 333,
        speed: 300,
        deviceId: null,
        updatedAt: new Date(),
      };

      const stats = calculateReadingStats(progress, 1000);

      expect(stats.percentComplete).toBe(33.3);
    });
  });
});
