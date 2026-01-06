/**
 * 数据服务层
 *
 * 处理所有Supabase数据库操作：
 * - 记忆管理（增删改查）
 * - 照片管理
 * - 用户管理
 */

import { supabase, TABLES, BUCKETS } from '@/lib/supabase';
import type { Memory } from '@/db/db';
import { getCurrentUser } from '@/services/authService';
import { generateImageVersions } from '@/utils/imageCompression';

// ========== 类型定义 ==========

/**
 * 用户信息类型
 */
export interface User {
  id: string;
  email: string;
  username?: string;
  view_password_hash: string;
  edit_password_hash: string;
  created_at: string;
  updated_at: string;
}

/**
 * 记忆类型（数据库）
 */
export interface MemoryDB {
  id: string;
  user_id: string;
  date: string;
  note: string | null;
  photo_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * 照片类型（数据库）
 */
export interface PhotoDB {
  id: string;
  memory_id: string;
  user_id: string;
  storage_path: string;
  original_storage_path: string | null; // 原图路径
  public_url: string;
  original_public_url: string | null; // 原图URL
  thumbnail_url: string | null;
  mime_type: string | null;
  file_size: number | null;
  original_file_size: number | null; // 原图大小
  width: number | null;
  height: number | null;
  display_order: number | null; // 显示顺序
  created_at: string;
}

/**
 * 照片类型（应用）
 */
export interface Photo {
  id: string;
  memoryId: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
  publicUrl?: string;
  thumbnailUrl?: string;
}

// ========== 记忆管理 ==========

/**
 * 获取用户的所有记忆
 */
export const getMemories = async (): Promise<Memory[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.MEMORIES)
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('获取记忆失败:', error);
      throw error;
    }

    // 转换数据格式
    return data.map((item: MemoryDB) => ({
      id: item.id,
      date: item.date,
      note: item.note || '',
      photoIds: [], // 将从照片表加载
      createdAt: new Date(item.created_at).getTime(),
      updatedAt: new Date(item.updated_at).getTime(),
    }));
  } catch (error) {
    console.error('获取记忆异常:', error);
    throw error;
  }
};

/**
 * 获取单个记忆（包含照片）
 */
export const getMemoryWithPhotos = async (memoryId: string): Promise<Memory & { photos: Photo[] }> => {
  try {
    // 获取记忆
    const { data: memory, error: memoryError } = await supabase
      .from(TABLES.MEMORIES)
      .select('*')
      .eq('id', memoryId)
      .single();

    if (memoryError) {
      throw memoryError;
    }

    // 获取照片
    const { data: photos, error: photosError } = await supabase
      .from(TABLES.PHOTOS)
      .select('*')
      .eq('memory_id', memoryId)
      .order('created_at', { ascending: true });

    if (photosError) {
      throw photosError;
    }

    // 转换格式
    const memoryFormatted: Memory = {
      id: memory.id,
      date: memory.date,
      note: memory.note || '',
      photoIds: photos.map(p => p.id),
      createdAt: new Date(memory.created_at).getTime(),
      updatedAt: new Date(memory.updated_at).getTime(),
    };

    const photosFormatted: Photo[] = photos.map(p => ({
      id: p.id,
      memoryId: p.memory_id,
      blob: new Blob([], { type: p.mime_type || 'image/jpeg' }), // 占位，实际从URL加载
      mimeType: p.mime_type || 'image/jpeg',
      createdAt: new Date(p.created_at).getTime(),
      // 附加云存储信息
      publicUrl: p.public_url,
      thumbnailUrl: p.thumbnail_url || undefined,
    }));

    return {
      ...memoryFormatted,
      photos: photosFormatted,
    };
  } catch (error) {
    console.error('获取记忆详情失败:', error);
    throw error;
  }
};

/**
 * 创建记忆
 */
export const createMemory = async (
  date: string,
  note: string
): Promise<string> => {
  try {
    console.log('📝 创建记忆:', { date, note });

    // 获取当前用户（从localStorage）
    const user = getCurrentUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    console.log('  用户ID:', user.id);

    const { data, error } = await supabase
      .from(TABLES.MEMORIES)
      .insert({
        user_id: user.id,
        date,
        note,
        photo_count: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.error('  创建失败:', error);
      throw error;
    }

    console.log('✅ 记忆创建成功, ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ 创建记忆异常:', error);
    throw error;
  }
};

/**
 * 更新记忆
 */
export const updateMemory = async (
  memoryId: string,
  date: string,
  note: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from(TABLES.MEMORIES)
      .update({
        date,
        note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memoryId);

    if (error) {
      console.error('更新记忆失败:', error);
      throw error;
    }
  } catch (error) {
    console.error('更新记忆异常:', error);
    throw error;
  }
};

/**
 * 删除记忆（级联删除照片）
 */
export const deleteMemory = async (memoryId: string): Promise<void> => {
  try {
    // 先获取该记忆的所有照片
    const { data: photos } = await supabase
      .from(TABLES.PHOTOS)
      .select('storage_path, thumbnail_url')
      .eq('memory_id', memoryId);

    // 删除存储中的照片文件
    if (photos && photos.length > 0) {
      const filesToDelete = photos
        .map(p => [p.storage_path, p.thumbnail_url])
        .flat()
        .filter(Boolean) as string[];

      if (filesToDelete.length > 0) {
        await supabase
          .storage
          .from(BUCKETS.PHOTOS)
          .remove(filesToDelete);
      }
    }

    // 删除记忆记录（照片会因为外键级联自动删除）
    const { error } = await supabase
      .from(TABLES.MEMORIES)
      .delete()
      .eq('id', memoryId);

    if (error) {
      console.error('删除记忆失败:', error);
      throw error;
    }
  } catch (error) {
    console.error('删除记忆异常:', error);
    throw error;
  }
};

// ========== 照片管理 ==========

/**
 * 获取记忆的所有照片(按显示顺序排序)
 */
export const getPhotos = async (memoryId: string): Promise<Photo[]> => {
  try {
    console.log('📷 获取照片, Memory ID:', memoryId);

    const { data, error } = await supabase
      .from(TABLES.PHOTOS)
      .select('*')
      .eq('memory_id', memoryId)
      .order('display_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('  获取照片失败:', error);
      throw error;
    }

    console.log('  从数据库获取到', data?.length || 0, '张照片');

    const photos = data.map((p: PhotoDB, index: number) => {
      console.log(`  照片 ${index + 1} (${p.id}):`, {
        displayOrder: p.display_order,
        publicUrl: p.public_url?.substring(0, 80) + '...',
        hasOriginal: !!p.original_public_url,
      });

      return {
        id: p.id,
        memoryId: p.memory_id,
        blob: new Blob([], { type: p.mime_type || 'image/jpeg' }), // 占位，实际使用publicUrl
        mimeType: p.mime_type || 'image/jpeg',
        createdAt: new Date(p.created_at).getTime(),
        publicUrl: p.public_url,
        originalPublicUrl: p.original_public_url || undefined,
        thumbnailUrl: p.thumbnail_url || undefined,
      };
    });

    console.log('✅ 照片数据转换完成,已按display_order排序');
    return photos;
  } catch (error) {
    console.error('获取照片异常:', error);
    throw error;
  }
};

/**
 * 上传单张照片(双版本:原图+压缩图)
 */
export const uploadPhoto = async (
  memoryId: string,
  file: File,
  userId: string,
  displayOrder: number
): Promise<Photo> => {
  try {
    console.log('📤 上传照片...');
    console.log('  记忆ID:', memoryId);
    console.log('  文件名:', file.name);
    console.log('  原始大小:', (file.size / 1024).toFixed(2), 'KB');
    console.log('  显示顺序:', displayOrder);

    // 1. 生成三个版本:原图、预览图、缩略图
    console.log('🔄 生成图片版本...');
    const { preview: compressedFile, thumbnail } = await generateImageVersions(file);
    console.log('  预览图大小:', (compressedFile.size / 1024).toFixed(2), 'KB');
    console.log('  缩略图大小:', (thumbnail.size / 1024).toFixed(2), 'KB');

    // 2. 生成唯一文件名
    const photoId = crypto.randomUUID();
    const originalFileName = `${photoId}_original.jpg`;
    const previewFileName = `${photoId}_preview.jpg`;
    const thumbnailFileName = `${photoId}_thumbnail.jpg`;

    console.log('  生成文件名:', previewFileName);

    // 3. 并发上传原图、预览图和缩略图
    console.log('📤 并发上传原图、预览图和缩略图...');
    const [originalUpload, previewUpload, thumbnailUpload] = await Promise.all([
      supabase.storage.from(BUCKETS.PHOTOS).upload(`${userId}/${memoryId}/${originalFileName}`, file),
      supabase.storage.from(BUCKETS.PHOTOS).upload(`${userId}/${memoryId}/${previewFileName}`, compressedFile),
      supabase.storage.from(BUCKETS.PHOTOS).upload(`${userId}/${memoryId}/${thumbnailFileName}`, thumbnail)
    ]);

    // 检查上传错误
    if (originalUpload.error) {
      console.error('  原图上传失败:', originalUpload.error);
      throw originalUpload.error;
    }
    if (previewUpload.error) {
      console.error('  预览图上传失败:', previewUpload.error);
      throw previewUpload.error;
    }
    if (thumbnailUpload.error) {
      console.error('  缩略图上传失败:', thumbnailUpload.error);
      throw thumbnailUpload.error;
    }

    console.log('  原图上传成功:', originalUpload.data.path);
    console.log('  预览图上传成功:', previewUpload.data.path);
    console.log('  缩略图上传成功:', thumbnailUpload.data.path);

    // 4. 获取公共URL
    const originalUrlData = supabase.storage.from(BUCKETS.PHOTOS).getPublicUrl(originalUpload.data.path);
    const previewUrlData = supabase.storage.from(BUCKETS.PHOTOS).getPublicUrl(previewUpload.data.path);
    const thumbnailUrlData = supabase.storage.from(BUCKETS.PHOTOS).getPublicUrl(thumbnailUpload.data.path);

    const originalPublicUrl = originalUrlData.publicUrl;
    const previewPublicUrl = previewUrlData.publicUrl;
    const thumbnailPublicUrl = thumbnailUrlData.publicUrl;

    console.log('  原图URL:', originalPublicUrl.substring(0, 80) + '...');
    console.log('  预览图URL:', previewPublicUrl.substring(0, 80) + '...');
    console.log('  缩略图URL:', thumbnailPublicUrl.substring(0, 80) + '...');

    // 5. 获取图片尺寸
    const dimensions = await getImageDimensions(compressedFile);
    console.log('  图片尺寸:', dimensions.width, 'x', dimensions.height);

    // 6. 创建照片记录
    console.log('💾 创建照片记录...');
    const { data: photoData, error: photoError } = await supabase
      .from(TABLES.PHOTOS)
      .insert({
        memory_id: memoryId,
        user_id: userId,
        storage_path: previewUpload.data.path,
        original_storage_path: originalUpload.data.path,
        public_url: previewPublicUrl,
        original_public_url: originalPublicUrl,
        thumbnail_url: thumbnailPublicUrl,
        mime_type: compressedFile.type,
        file_size: compressedFile.size,
        original_file_size: file.size,
        width: dimensions.width,
        height: dimensions.height,
        display_order: displayOrder,
      })
      .select()
      .single();

    if (photoError) {
      console.error('  创建记录失败:', photoError);
      throw photoError;
    }

    console.log('✅ 照片记录创建成功, ID:', photoData.id);
    console.log('  记录了显示顺序:', displayOrder);

    // 7. 更新记忆的照片计数
    // 先获取当前计数
    const { data: memoryData } = await supabase
      .from(TABLES.MEMORIES)
      .select('photo_count')
      .eq('id', memoryId)
      .single();

    const newCount = (memoryData?.photo_count || 0) + 1;

    await supabase
      .from(TABLES.MEMORIES)
      .update({ photo_count: newCount })
      .eq('id', memoryId);

    console.log('✅ 照片上传完成!');

    return {
      id: photoData.id,
      memoryId: photoData.memory_id,
      blob: compressedFile,
      mimeType: photoData.mime_type || compressedFile.type,
      createdAt: new Date(photoData.created_at).getTime(),
      publicUrl: photoData.public_url,
      originalPublicUrl: photoData.original_public_url || undefined,
    };
  } catch (error) {
    console.error('❌ 上传照片异常:', error);
    throw error;
  }
};

/**
 * 批量并发上传照片
 */
export const uploadPhotos = async (
  memoryId: string,
  files: File[],
  userId: string,
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<Photo[]> => {
  try {
    console.log('📤 开始批量并发上传', files.length, '张照片...');

    // 并发上传所有照片
    const uploadPromises = files.map((file, index) => {
      onProgress?.(index + 1, files.length, file.name);
      return uploadPhoto(memoryId, file, userId, index);
    });

    const results = await Promise.all(uploadPromises);

    console.log('✅ 批量上传完成!');
    return results;
  } catch (error) {
    console.error('❌ 批量上传异常:', error);
    throw error;
  }
};

// ========== 照片管理 ==========

/**
 * 删除照片(包括原图和压缩图)
 */
export const deletePhoto = async (photoId: string): Promise<void> => {
  try {
    // 获取照片信息
    const { data: photo } = await supabase
      .from(TABLES.PHOTOS)
      .select('memory_id, storage_path, original_storage_path, thumbnail_url')
      .eq('id', photoId)
      .single();

    if (!photo) {
      throw new Error('照片不存在');
    }

    // 删除存储文件(预览图、原图、缩略图)
    const filesToDelete = [
      photo.storage_path,
      photo.original_storage_path,
      photo.thumbnail_url,
    ].filter(Boolean) as string[];

    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase
        .storage
        .from(BUCKETS.PHOTOS)
        .remove(filesToDelete);

      if (storageError) {
        console.error('删除存储文件失败:', storageError);
      }
    }

    // 删除数据库记录
    const { error: dbError } = await supabase
      .from(TABLES.PHOTOS)
      .delete()
      .eq('id', photoId);

    if (dbError) {
      console.error('删除照片记录失败:', dbError);
      throw dbError;
    }

    // 更新记忆的照片计数
    // 先获取当前计数
    const { data: memoryData } = await supabase
      .from(TABLES.MEMORIES)
      .select('photo_count')
      .eq('id', photo.memory_id)
      .single();

    const newCount = Math.max(0, (memoryData?.photo_count || 0) - 1);

    await supabase
      .from(TABLES.MEMORIES)
      .update({ photo_count: newCount })
      .eq('id', photo.memory_id);
  } catch (error) {
    console.error('删除照片异常:', error);
    throw error;
  }
};

// ========== 辅助函数 ==========

/**
 * 获取图片尺寸
 */
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

export default {
  getMemories,
  getMemoryWithPhotos,
  createMemory,
  updateMemory,
  deleteMemory,
  getPhotos,
  uploadPhoto,
  uploadPhotos,
  deletePhoto,
};
