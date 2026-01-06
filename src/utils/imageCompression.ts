/**
 * 图片压缩工具
 *
 * 优化上传速度：
 * - 自动压缩到合理大小
 * - 保持视觉质量
 * - 支持进度回调
 */

import imageCompression from 'browser-image-compression';

/**
 * 压缩配置
 */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5, // 最大500KB
  maxWidthOrHeight: 1920, // 最大尺寸
  useWebWorker: true, // 使用Web Worker避免阻塞UI
  fileType: 'image/jpeg', // 统一转为JPEG
  quality: 0.85, // 质量85%
} as const;

/**
 * 压缩单个图片
 */
export const compressImage = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<File> => {
  try {
    console.log('🔧 开始压缩图片...');
    console.log('  原始大小:', (file.size / 1024).toFixed(2), 'KB');

    const startTime = Date.now();

    // 如果文件已经很小,不需要压缩
    if (file.size < 200 * 1024) {
      console.log('  文件已足够小,跳过压缩');
      return file;
    }

    // 压缩图片
    const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);

    const duration = Date.now() - startTime;
    const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1);

    console.log('✅ 压缩完成!');
    console.log('  压缩后大小:', (compressedFile.size / 1024).toFixed(2), 'KB');
    console.log('  压缩率:', reduction + '%');
    console.log('  耗时:', duration, 'ms');

    onProgress?.(100);

    return compressedFile;
  } catch (error) {
    console.error('❌ 压缩失败:', error);
    // 压缩失败时返回原文件
    return file;
  }
};

/**
 * 批量压缩图片
 */
export const compressImages = async (
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<File[]> => {
  console.log('🔧 开始批量压缩', files.length, '张图片...');

  const compressedFiles: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`\n[${i + 1}/${files.length}] 压缩:`, file.name);

    const compressed = await compressImage(file);
    compressedFiles.push(compressed);

    onProgress?.(i + 1, files.length);
  }

  console.log('\n✅ 批量压缩完成!');
  return compressedFiles;
};

/**
 * 获取压缩后预估大小
 */
export const estimateCompressedSize = (originalSize: number): number => {
  // 通常可以压缩到原大小的20-30%
  return originalSize * 0.25;
};

/**
 * 判断是否需要压缩
 */
export const needsCompression = (file: File): boolean => {
  return file.size > 200 * 1024; // 大于200KB
};

export default {
  compressImage,
  compressImages,
  estimateCompressedSize,
  needsCompression,
};
