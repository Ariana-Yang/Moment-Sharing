import { useState, useEffect, useCallback } from 'react';
import type { Memory, Photo } from '../db/db';
import {
  getMemories,
  createMemory as createMemoryDB,
  updateMemory as updateMemoryDB,
  deleteMemory as deleteMemoryDB,
  getPhotos,
  uploadPhotos,
  deletePhoto
} from '../services/dataService';
import { getCurrentUser } from '../services/authService';

export const useMemories = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载记忆列表
  const loadMemories = useCallback(async () => {
    setLoading(true);
    try {
      const memoryList = await getMemories();
      setMemories(memoryList);
      setError(null);
    } catch (err) {
      setError('加载记忆失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  // 创建记忆
  const createMemory = useCallback(async (
    date: string,
    note: string,
    files: File[]
  ): Promise<void> => {
    setLoading(true);
    try {
      console.log('📝 创建记忆:', { date, note, filesCount: files.length });

      // 1. 创建记忆记录
      const memoryId = await createMemoryDB(date, note);
      console.log('✅ 记忆记录创建成功, ID:', memoryId);

      // 2. 并发上传照片
      const user = getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      console.log('📤 开始并发上传', files.length, '张照片');
      await uploadPhotos(memoryId, files, user.id);
      console.log('✅ 所有照片上传完成');

      // 3. 重新加载记忆列表
      await loadMemories();
      setError(null);
      console.log('✅ 记忆创建完成');
    } catch (err) {
      setError('创建记忆失败');
      console.error('❌ 创建记忆异常:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadMemories]);

  // 更新记忆
  const updateMemory = useCallback(async (
    id: string,
    date: string,
    note: string,
    newFiles: File[] = [],
    removedPhotoIds: string[] = []
  ): Promise<void> => {
    setLoading(true);
    try {
      console.log('📝 更新记忆:', { id, date, note, newFilesCount: newFiles.length, removedPhotoIds });

      // 1. 更新记忆记录
      await updateMemoryDB(id, date, note);
      console.log('✅ 记忆记录更新成功');

      // 2. 并发上传新照片
      const user = getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      if (newFiles.length > 0) {
        console.log('📤 开始并发上传', newFiles.length, '张新照片');
        await uploadPhotos(id, newFiles, user.id);
        console.log('✅ 所有新照片上传完成');
      }

      // 3. 删除指定的照片
      for (const id of removedPhotoIds) {
        console.log('🗑️ 删除照片:', id);
        await deletePhoto(id);
      }

      // 4. 重新加载记忆列表
      await loadMemories();
      setError(null);
      console.log('✅ 记忆更新完成');
    } catch (err) {
      setError('更新记忆失败');
      console.error('❌ 更新记忆异常:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadMemories]);

  // 删除记忆（级联删除关联图片）
  const deleteMemory = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    try {
      console.log('🗑️ 删除记忆:', id);
      await deleteMemoryDB(id);
      console.log('✅ 记忆删除成功');

      // 重新加载记忆列表
      await loadMemories();
      setError(null);
    } catch (err) {
      setError('删除记忆失败');
      console.error('❌ 删除记忆异常:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadMemories]);

  // 根据记忆ID获取图片
  const getPhotosByMemoryId = useCallback(async (memoryId: string): Promise<Photo[]> => {
    try {
      console.log('📷 [useMemories] 获取记忆的照片:', memoryId);
      const photos = await getPhotos(memoryId);

      console.log('✅ [useMemories] 获取到', photos.length, '张照片');
      photos.forEach((photo, index) => {
        console.log(`  照片 ${index + 1}:`, {
          id: photo.id,
          hasPublicUrl: !!photo.publicUrl,
          hasBlob: !!photo.blob,
          publicUrl: photo.publicUrl?.substring(0, 80) + '...'
        });
      });

      return photos;
    } catch (err) {
      console.error('❌ [useMemories] 获取图片失败:', err);
      return [];
    }
  }, []);

  // 获取单个图片（从Supabase不支持直接获取单个photo，但保留接口兼容性）
  const getPhoto = useCallback(async (_photoId: string): Promise<Photo | undefined> => {
    try {
      // Supabase版本暂不支持此功能，返回undefined
      console.warn('⚠️ getPhoto功能在Supabase版本中暂不支持');
      return undefined;
    } catch (err) {
      console.error('❌ 获取图片失败:', err);
      return undefined;
    }
  }, []);

  return {
    memories,
    loading,
    error,
    createMemory,
    updateMemory,
    deleteMemory,
    getPhotosByMemoryId,
    getPhoto,
    loadMemories,
  };
};
