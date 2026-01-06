/**
 * 数据迁移工具 - 从 IndexedDB 迁移到 Supabase
 *
 * 功能:
 * - 检测本地数据
 * - 迁移记忆和照片到云端
 * - 显示迁移进度
 * - 清除本地数据（可选）
 */

import { db } from '@/db/db';
import { initializeUser } from '@/services/authService';
import { uploadPhoto } from '@/services/dataService';

/**
 * 迁移进度回调
 */
export interface MigrationProgress {
  stage: string; // 当前阶段
  current: number; // 当前进度
  total: number; // 总数
  message: string; // 提示信息
}

type ProgressCallback = (progress: MigrationProgress) => void;

/**
 * 执行数据迁移
 */
export async function migrateToSupabase(
  onProgress?: ProgressCallback
): Promise<{ success: boolean; error?: string; stats?: MigrationStats }> {
  try {
    console.log('🚀 开始数据迁移到 Supabase...');

    // 1. 初始化用户
    onProgress?.({
      stage: '初始化用户',
      current: 0,
      total: 1,
      message: '正在创建用户...',
    });

    const user = await initializeUser();

    if (!user) {
      throw new Error('用户初始化失败');
    }

    console.log('✅ 用户初始化完成:', user.email);

    // 2. 读取本地记忆数据
    onProgress?.({
      stage: '读取本地数据',
      current: 0,
      total: 1,
      message: '正在读取本地记忆...',
    });

    const memories = await db.memories.orderBy('date').reverse().toArray();
    console.log(`📦 读取到 ${memories.length} 条记忆`);

    if (memories.length === 0) {
      return {
        success: true,
        stats: {
          memoriesMigrated: 0,
          photosMigrated: 0,
          totalSize: 0,
        },
      };
    }

    // 3. 读取所有照片（预先统计）
    onProgress?.({
      stage: '统计照片数量',
      current: 0,
      total: 1,
      message: '正在统计照片...',
    });

    const allPhotos: Array<{
      photo: any;
      memoryIndex: number;
    }> = [];

    for (let i = 0; i < memories.length; i++) {
      const photos = await db.photos
        .where('memoryId')
        .equals(memories[i].id!)
        .toArray();

      photos.forEach((photo) => {
        allPhotos.push({
          photo,
          memoryIndex: i,
        });
      });
    }

    const totalPhotos = allPhotos.length;
    console.log(`📷 共 ${totalPhotos} 张照片需要上传`);

    let photosMigrated = 0;
    let totalSize = 0;

    // 4. 逐个迁移记忆
    for (let i = 0; i < memories.length; i++) {
      const memory = memories[i];

      onProgress?.({
        stage: '迁移记忆',
        current: i + 1,
        total: memories.length,
        message: `正在迁移记忆 ${i + 1}/${memories.length}: ${memory.date}`,
      });

      // 4.1 在云端创建记忆（延迟导入以避免循环依赖）
      const { createMemory } = await import('@/services/dataService');
      const cloudMemoryId = await createMemory(memory.date, memory.note || '');
      console.log(`✅ 记忆 ${memory.date} 已创建，ID: ${cloudMemoryId}`);

      // 4.2 读取该记忆的所有照片
      const photos = await db.photos
        .where('memoryId')
        .equals(memory.id!)
        .toArray();

      console.log(`📷 记忆 ${memory.date} 有 ${photos.length} 张照片`);

      // 4.3 上传照片到云存储
      for (let j = 0; j < photos.length; j++) {
        const photo = photos[j];
        const photoNumber = photosMigrated + 1;

        onProgress?.({
          stage: '上传照片',
          current: photoNumber,
          total: totalPhotos,
          message: `正在上传第 ${photoNumber}/${totalPhotos} 张照片 (${memory.date})...`,
        });

        // 将 Blob 转换为 File
        const file = new File([photo.blob], `photo_${j}.jpg`, {
          type: photo.mimeType || 'image/jpeg',
        });

        console.log(`📤 上传照片 ${j + 1}/${photos.length}, 大小: ${file.size} bytes`);

        try {
          // 上传照片
          await uploadPhoto(cloudMemoryId, file, user.id, j, undefined);
          totalSize += file.size;
          photosMigrated++;

          console.log(`✅ 照片 ${j + 1} 上传成功`);
        } catch (error) {
          console.error(`❌ 照片 ${j + 1} 上传失败:`, error);
          // 继续上传下一张，不中断整个迁移过程
        }
      }
    }

    // 5. 迁移完成
    onProgress?.({
      stage: '完成',
      current: 1,
      total: 1,
      message: `数据迁移完成！共迁移 ${memories.length} 条记忆，${photosMigrated} 张照片`,
    });

    console.log('🎉 数据迁移完成！');
    console.log(`📊 统计: ${memories.length} 条记忆, ${photosMigrated} 张照片, ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    return {
      success: true,
      stats: {
        memoriesMigrated: memories.length,
        photosMigrated,
        totalSize,
      },
    };
  } catch (err) {
    console.error('❌ 数据迁移失败:', err);

    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 迁移统计数据
 */
export interface MigrationStats {
  memoriesMigrated: number;
  photosMigrated: number;
  totalSize: number; // bytes
}

/**
 * 清除本地数据（迁移成功后调用）
 */
export async function clearLocalData(): Promise<void> {
  try {
    console.log('🧹 清除本地数据...');

    const memoriesCount = await db.memories.count();
    const photosCount = await db.photos.count();

    console.log(`📊 即将删除: ${memoriesCount} 条记忆, ${photosCount} 张照片`);

    await db.memories.clear();
    await db.photos.clear();

    console.log('✅ 本地数据已清除');
  } catch (error) {
    console.error('❌ 清除本地数据失败:', error);
    throw error;
  }
}

/**
 * 检查是否需要迁移
 */
export async function needsMigration(): Promise<boolean> {
  try {
    const localMemories = await db.memories.toArray();
    return localMemories.length > 0;
  } catch (error) {
    console.error('检查迁移状态失败:', error);
    return false;
  }
}

/**
 * 获取本地数据统计信息
 */
export async function getLocalDataStats(): Promise<{
  memoriesCount: number;
  photosCount: number;
  totalSize: number;
}> {
  try {
    const memories = await db.memories.toArray();
    const photos = await db.photos.toArray();

    let totalSize = 0;
    for (const photo of photos) {
      if (photo.blob) {
        totalSize += photo.blob.size;
      }
    }

    return {
      memoriesCount: memories.length,
      photosCount: photos.length,
      totalSize,
    };
  } catch (error) {
    console.error('获取本地数据统计失败:', error);
    return {
      memoriesCount: 0,
      photosCount: 0,
      totalSize: 0,
    };
  }
}

/**
 * 导出本地数据为 JSON
 */
export async function exportLocalData(): Promise<string> {
  try {
    console.log('📤 导出本地数据...');

    const memories = await db.memories.toArray();
    const photos = [];

    for (const photo of await db.photos.toArray()) {
      // 将 Blob 转换为 Base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(photo.blob);
      });

      photos.push({
        ...photo,
        base64,
        blob: undefined, // 移除 blob 对象，只保留 base64
      });
    }

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      memories,
      photos,
    };

    const json = JSON.stringify(exportData, null, 2);

    console.log(`✅ 数据导出完成: ${(json.length / 1024).toFixed(2)} KB`);

    return json;
  } catch (error) {
    console.error('❌ 导出本地数据失败:', error);
    throw error;
  }
}

/**
 * 下载本地数据备份文件
 */
export async function downloadLocalBackup(): Promise<void> {
  try {
    const json = await exportLocalData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `moment-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    console.log('✅ 备份文件下载完成');
  } catch (error) {
    console.error('❌ 下载备份文件失败:', error);
    throw error;
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export default {
  migrateToSupabase,
  clearLocalData,
  needsMigration,
  getLocalDataStats,
  exportLocalData,
  downloadLocalBackup,
  formatFileSize,
};
