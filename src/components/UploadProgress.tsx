/**
 * 上传进度条组件
 *
 * 显示上传进度:
 * - 整体进度百分比
 * - 当前上传的文件名
 * - 已完成/总数
 * - 当前阶段(压缩/上传)
 */

import { Loader2 } from 'lucide-react';

interface UploadProgressProps {
  current: number;      // 当前上传数量
  total: number;        // 总数
  fileName: string;     // 当前文件名
  stage?: 'compressing' | 'uploading'; // 当前阶段
}

export const UploadProgress = ({
  current,
  total,
  fileName,
  stage = 'uploading'
}: UploadProgressProps) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50
                    bg-white dark:bg-gallery-midnight-light
                    rounded-xl shadow-2xl p-4 min-w-[320px] max-w-md
                    border border-gray-200 dark:border-gray-700
                    animate-fade-in">
      {/* 进度标题 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="font-medium text-gray-900 dark:text-white">
            {stage === 'compressing' ? '压缩中...' : '上传中...'}
          </span>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {current} / {total}
        </span>
      </div>

      {/* 进度条 */}
      <div className="mb-3">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-out ${
              stage === 'compressing'
                ? 'bg-gradient-to-r from-orange-500 to-yellow-500 animate-pulse'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-right text-xs text-gray-600 dark:text-gray-400 mt-1">
          {percentage}%
        </div>
      </div>

      {/* 当前文件名 */}
      {fileName && (
        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
          {stage === 'compressing' ? '正在压缩' : '正在上传'}: <span className="font-medium">{fileName}</span>
        </div>
      )}

      {/* 阶段说明 */}
      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
        {stage === 'compressing'
          ? '正在优化图片大小，请稍候...'
          : current < total
          ? `预计还需 ${Math.ceil((total - current) * 2)} 秒...`
          : '即将完成...'}
      </div>
    </div>
  );
};
