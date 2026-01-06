/**
 * 上传进度条组件
 *
 * 显示上传进度:
 * - 整体进度百分比
 * - 当前上传的文件名
 * - 已完成/总数
 */

import { Loader2 } from 'lucide-react';

interface UploadProgressProps {
  current: number;      // 当前上传数量
  total: number;        // 总数
  fileName: string;     // 当前文件名
  isUploading?: boolean; // 是否正在上传
}

export const UploadProgress = ({
  current,
  total,
  fileName,
  isUploading = true
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
          {isUploading && (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          )}
          <span className="font-medium text-gray-900 dark:text-white">
            {isUploading ? '上传中...' : '上传完成'}
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
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500
                           transition-all duration-300 ease-out
                           animate-pulse"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-right text-xs text-gray-600 dark:text-gray-400 mt-1">
          {percentage}%
        </div>
      </div>

      {/* 当前文件名 */}
      {isUploading && fileName && (
        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
          正在上传: <span className="font-medium">{fileName}</span>
        </div>
      )}

      {/* 预计剩余时间(可选) */}
      {current > 0 && current < total && (
        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          预计还需 {Math.ceil((total - current) * 3)} 秒...
        </div>
      )}
    </div>
  );
};
