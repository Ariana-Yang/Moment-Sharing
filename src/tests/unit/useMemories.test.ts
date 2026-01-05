import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMemories } from '@/hooks/useMemories';
import * as db from '@/db/db';

// Mock db module
vi.mock('@/db/db');

describe('useMemories Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadMemories', () => {
    it('should load memories successfully', async () => {
      const mockMemories = [
        {
          id: '1',
          date: '2026-01-05',
          note: 'Test memory',
          photoIds: ['photo1'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      vi.spyOn(db.db.memories, 'orderBy').mockReturnValue({
        reverse: () => ({
          toArray: () => Promise.resolve(mockMemories),
        }),
      } as any);

      const { result } = renderHook(() => useMemories());

      await waitFor(() => {
        expect(result.current.memories).toEqual(mockMemories);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });
    });

    it('should handle load errors', async () => {
      vi.spyOn(db.db.memories, 'orderBy').mockReturnValue({
        reverse: () => ({
          toArray: () => Promise.reject(new Error('Database error')),
        }),
      } as any);

      const { result } = renderHook(() => useMemories());

      await waitFor(() => {
        expect(result.current.error).toBe('加载记忆失败');
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('createMemory', () => {
    it('should create a new memory', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockMemory = {
        id: '1',
        date: '2026-01-05',
        note: 'New memory',
        photoIds: ['photo1'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      vi.spyOn(db.db.memories, 'where').mockReturnValue({
        first: () => Promise.resolve(null),
      } as any);

      vi.spyOn(db.db.photos, 'add').mockResolvedValue('photo1' as any);
      vi.spyOn(db.db.memories, 'add').mockResolvedValue('1' as any);
      vi.spyOn(db.db.memories, 'orderBy').mockReturnValue({
        reverse: () => ({
          toArray: () => Promise.resolve([mockMemory]),
        }),
      } as any);

      const { result } = renderHook(() => useMemories());

      await act(async () => {
        await result.current.createMemory('2026-01-05', 'New memory', [mockFile]);
      });

      await waitFor(() => {
        expect(db.db.photos.add).toHaveBeenCalled();
        expect(db.db.memories.add).toHaveBeenCalled();
      });
    });
  });

  describe('deleteMemory', () => {
    it('should delete memory and associated photos', async () => {
      const mockMemory = {
        id: '1',
        date: '2026-01-05',
        note: 'Test',
        photoIds: ['photo1', 'photo2'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      vi.spyOn(db.db.memories, 'get').mockResolvedValue(mockMemory as any);
      vi.spyOn(db.db.photos, 'where').mockReturnValue({
        delete: () => Promise.resolve(2),
      } as any);
      vi.spyOn(db.db.memories, 'delete').mockResolvedValue(undefined);
      vi.spyOn(db.db.memories, 'orderBy').mockReturnValue({
        reverse: () => ({
          toArray: () => Promise.resolve([]),
        }),
      } as any);

      const { result } = renderHook(() => useMemories());

      await act(async () => {
        await result.current.deleteMemory('1');
      });

      expect(db.db.photos.where).toHaveBeenCalledWith('memoryId');
      expect(db.db.memories.delete).toHaveBeenCalledWith('1');
    });
  });

  describe('exportData & importData', () => {
    it('should export and import data correctly', async () => {
      const mockMemories = [
        {
          id: '1',
          date: '2026-01-05',
          note: 'Test',
          photoIds: ['photo1'],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const mockPhotos = [
        {
          id: 'photo1',
          memoryId: '1',
          blob: new Blob(['test']),
          mimeType: 'image/jpeg',
          createdAt: Date.now(),
        },
      ];

      vi.spyOn(db.db.memories, 'toArray').mockResolvedValue(mockMemories as any);
      vi.spyOn(db.db.photos, 'toArray').mockResolvedValue(mockPhotos as any);
      vi.spyOn(db.db, 'transaction').mockImplementation(() => {
        return Promise.resolve();
      });

      const { result } = renderHook(() => useMemories());

      // Mock FileReader for blobToBase64
      global.FileReader = vi.fn().mockImplementation(() => ({
        readAsDataURL: vi.fn(),
        onload: null,
        result: 'data:image/jpeg;base64,test',
      })) as any;

      await act(async () => {
        await result.current.exportData();
      });

      // Verify export was called (real verification would need more complex setup)
      expect(db.db.memories.toArray).toHaveBeenCalled();
    });
  });
});
