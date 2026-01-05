import { useState, useEffect, useCallback } from 'react';
import { db, type Memory, type Photo } from '../db/db';
import imageCompression from 'browser-image-compression';

// 图片压缩配置 - 保持原始质量，不压缩
const compressionOptions = {
  maxSizeMB: 50,          // 提高到50MB（基本不会触发压缩）
  maxWidthOrHeight: 8192, // 提高到8192px（8K分辨率）
  useWebWorker: true,
  alwaysKeepResolution: true, // 保持原始分辨率
};

// 生成UUID
const generateId = (): string => {
  return crypto.randomUUID();
};

// 将Blob转换为Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// 将Base64转换为Blob
const base64ToBlob = (base64: string): Blob => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const useMemories = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载记忆列表
  const loadMemories = useCallback(async () => {
    setLoading(true);
    try {
      const memoryList = await db.memories.orderBy('date').reverse().toArray();
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

  // 压缩图片（保持原始质量）
  const compressImage = useCallback(async (file: File): Promise<File> => {
    try {
      // 如果文件小于限制，直接返回原文件
      if (file.size <= compressionOptions.maxSizeMB * 1024 * 1024) {
        return file;
      }
      // 只有超过50MB的图片才会压缩（极少情况）
      const compressed = await imageCompression(file, compressionOptions);
      console.log(`图片压缩: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressed.size / 1024 / 1024).toFixed(2)}MB`);
      return compressed;
    } catch (err) {
      console.error('图片处理失败:', err);
      return file;
    }
  }, []);

  // 创建记忆
  const createMemory = useCallback(async (
    date: string,
    note: string,
    files: File[]
  ): Promise<void> => {
    setLoading(true);
    try {
      const now = Date.now();
      const photoIds: string[] = [];

      // 检查是否已存在相同日期的记忆
      const existingMemory = await db.memories.where('date').equals(date).first();

      let memoryId: string;
      let existingPhotoIds: string[] = [];

      if (existingMemory) {
        // 如果存在，使用现有记忆ID
        memoryId = existingMemory.id;
        existingPhotoIds = existingMemory.photoIds;
      } else {
        // 如果不存在，创建新记忆ID
        memoryId = generateId();
      }

      // 压缩并保存图片
      for (const file of files) {
        const compressedFile = await compressImage(file);
        const photoId = generateId();

        await db.photos.add({
          id: photoId,
          memoryId,
          blob: new Blob([await compressedFile.arrayBuffer()], { type: compressedFile.type }),
          mimeType: compressedFile.type,
          createdAt: now,
        });

        photoIds.push(photoId);
      }

      // 合并现有照片ID和新照片ID
      const allPhotoIds = [...existingPhotoIds, ...photoIds];

      if (existingMemory) {
        // 更新现有记忆
        await db.memories.update(memoryId, {
          note: note || existingMemory.note, // 如果有新备注则更新，否则保持原备注
          photoIds: allPhotoIds,
          updatedAt: now,
        });
      } else {
        // 创建新记忆
        await db.memories.add({
          id: memoryId,
          date,
          note,
          photoIds: allPhotoIds,
          createdAt: now,
          updatedAt: now,
        });
      }

      // 重新加载记忆列表
      await loadMemories();
      setError(null);
    } catch (err) {
      setError('创建记忆失败');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [compressImage, loadMemories]);

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
      const memory = await db.memories.get(id);
      if (!memory) throw new Error('记忆不存在');

      const now = Date.now();
      const updatedPhotoIds = memory.photoIds.filter(id => !removedPhotoIds.includes(id));

      // 处理新增图片
      for (const file of newFiles) {
        const compressedFile = await compressImage(file);
        const photoId = generateId();
        
        await db.photos.add({
          id: photoId,
          memoryId: id,
          blob: new Blob([await compressedFile.arrayBuffer()], { type: compressedFile.type }),
          mimeType: compressedFile.type,
          createdAt: now,
        });
        
        updatedPhotoIds.push(photoId);
      }

      // 处理移除的图片
      if (removedPhotoIds.length > 0) {
        await db.photos.where('id').anyOf(removedPhotoIds).delete();
      }

      // 更新记忆
      await db.memories.update(id, {
        date,
        note,
        photoIds: updatedPhotoIds,
        updatedAt: now,
      });

      // 重新加载记忆列表
      await loadMemories();
      setError(null);
    } catch (err) {
      setError('更新记忆失败');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [compressImage, loadMemories]);

  // 删除记忆（级联删除关联图片）
  const deleteMemory = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    try {
      const memory = await db.memories.get(id);
      if (!memory) throw new Error('记忆不存在');

      // 级联删除关联图片
      await db.photos.where('memoryId').equals(id).delete();
      
      // 删除记忆
      await db.memories.delete(id);

      // 重新加载记忆列表
      await loadMemories();
      setError(null);
    } catch (err) {
      setError('删除记忆失败');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadMemories]);

  // 根据记忆ID获取图片
  const getPhotosByMemoryId = useCallback(async (memoryId: string): Promise<Photo[]> => {
    try {
      return await db.photos.where('memoryId').equals(memoryId).toArray();
    } catch (err) {
      console.error('获取图片失败:', err);
      return [];
    }
  }, []);

  // 获取单个图片
  const getPhoto = useCallback(async (photoId: string): Promise<Photo | undefined> => {
    try {
      return await db.photos.get(photoId);
    } catch (err) {
      console.error('获取图片失败:', err);
      return undefined;
    }
  }, []);

  // 导出数据
  const exportData = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      // 获取所有记忆和图片
      const allMemories = await db.memories.toArray();
      const allPhotos = await db.photos.toArray();

      // 将Blob转换为Base64
      const photosWithBase64 = await Promise.all(
        allPhotos.map(async (photo) => {
          const base64 = await blobToBase64(photo.blob);
          return {
            ...photo,
            blob: base64, // 替换为Base64字符串
          };
        })
      );

      // 组装导出数据
      const exportData = {
        version: '1.0',
        exportedAt: Date.now(),
        memories: allMemories,
        photos: photosWithBase64,
      };

      // 创建下载链接
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `moment-sharing-export-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      setError(null);
    } catch (err) {
      setError('导出数据失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 导入数据
  const importData = useCallback(async (file: File): Promise<void> => {
    setLoading(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // 开始事务
      await db.transaction('rw', [db.memories, db.photos], async () => {
        // 清空现有数据
        await db.memories.clear();
        await db.photos.clear();

        // 将Base64转换为Blob并保存图片
        const savedPhotos = await Promise.all(
          (importData.photos || []).map(async (photo: any) => {
            const blob = base64ToBlob(photo.blob);
            return {
              ...photo,
              blob,
            };
          })
        );

        // 批量保存图片
        await db.photos.bulkAdd(savedPhotos);

        // 批量保存记忆
        await db.memories.bulkAdd(importData.memories || []);
      });

      // 重新加载记忆列表
      await loadMemories();
      setError(null);
    } catch (err) {
      setError('导入数据失败');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadMemories]);

  return {
    memories,
    loading,
    error,
    createMemory,
    updateMemory,
    deleteMemory,
    getPhotosByMemoryId,
    getPhoto,
    exportData,
    importData,
    loadMemories,
  };
};
