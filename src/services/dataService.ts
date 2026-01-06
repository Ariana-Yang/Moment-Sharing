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
  public_url: string;
  thumbnail_url: string | null;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
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
 * 获取记忆的所有照片
 */
export const getPhotos = async (memoryId: string): Promise<Photo[]> => {
  try {
    console.log('📷 获取照片, Memory ID:', memoryId);

    const { data, error } = await supabase
      .from(TABLES.PHOTOS)
      .select('*')
      .eq('memory_id', memoryId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('  获取照片失败:', error);
      throw error;
    }

    console.log('  从数据库获取到', data?.length || 0, '张照片');

    const photos = data.map((p: PhotoDB) => {
      console.log(`  照片 ${p.id}:`, {
        publicUrl: p.public_url?.substring(0, 80) + '...',
        storagePath: p.storage_path
      });

      return {
        id: p.id,
        memoryId: p.memory_id,
        blob: new Blob([], { type: p.mime_type || 'image/jpeg' }), // 占位，实际使用publicUrl
        mimeType: p.mime_type || 'image/jpeg',
        createdAt: new Date(p.created_at).getTime(),
        publicUrl: p.public_url,
        thumbnailUrl: p.thumbnail_url || undefined,
      };
    });

    console.log('✅ 照片数据转换完成');
    return photos;
  } catch (error) {
    console.error('获取照片异常:', error);
    throw error;
  }
};

/**
 * 上传照片
 */
export const uploadPhoto = async (
  memoryId: string,
  file: File,
  userId: string
): Promise<Photo> => {
  try {
    console.log('📤 上传照片...');
    console.log('  记忆ID:', memoryId);
    console.log('  文件名:', file.name);
    console.log('  文件大小:', (file.size / 1024).toFixed(2), 'KB');

    // 1. 生成唯一文件名
    const photoId = crypto.randomUUID();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${photoId}.${fileExt}`;

    console.log('  生成文件名:', fileName);

    // 2. 上传原图
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(BUCKETS.PHOTOS)
      .upload(`${userId}/${memoryId}/${fileName}`, file);

    if (uploadError) {
      console.error('  上传失败:', uploadError);
      throw uploadError;
    }

    console.log('  文件上传成功:', uploadData.path);

    // 3. 获取公共URL
    const { data: urlData } = supabase
      .storage
      .from(BUCKETS.PHOTOS)
      .getPublicUrl(uploadData.path);

    const publicUrl = urlData.publicUrl;
    console.log('  公共URL:', publicUrl);

    // 4. 获取图片尺寸
    const dimensions = await getImageDimensions(file);
    console.log('  图片尺寸:', dimensions.width, 'x', dimensions.height);

    // 5. 创建照片记录
    console.log('💾 创建照片记录...');
    const { data: photoData, error: photoError } = await supabase
      .from(TABLES.PHOTOS)
      .insert({
        memory_id: memoryId,
        user_id: userId,
        storage_path: uploadData.path,
        public_url: publicUrl,
        thumbnail_url: null, // 暂时没有缩略图
        mime_type: file.type,
        file_size: file.size,
        width: dimensions.width,
        height: dimensions.height,
      })
      .select()
      .single();

    if (photoError) {
      console.error('  创建记录失败:', photoError);
      throw photoError;
    }

    console.log('✅ 照片记录创建成功, ID:', photoData.id);

    // 6. 更新记忆的照片计数
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
      blob: file,
      mimeType: photoData.mime_type || file.type,
      createdAt: new Date(photoData.created_at).getTime(),
      publicUrl: photoData.public_url,
    };
  } catch (error) {
    console.error('❌ 上传照片异常:', error);
    throw error;
  }
};

/**
 * 删除照片
 */
export const deletePhoto = async (photoId: string): Promise<void> => {
  try {
    // 获取照片信息
    const { data: photo } = await supabase
      .from(TABLES.PHOTOS)
      .select('memory_id, storage_path')
      .eq('id', photoId)
      .single();

    if (!photo) {
      throw new Error('照片不存在');
    }

    // 删除存储文件
    const { error: storageError } = await supabase
      .storage
      .from(BUCKETS.PHOTOS)
      .remove([photo.storage_path]);

    if (storageError) {
      console.error('删除存储文件失败:', storageError);
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
  deletePhoto,
};
