// EditorModal组件 - 编辑杂志风格
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Memory } from '../db/db';

interface EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string, note: string, files: File[], removedPhotoIds: string[]) => void;
  initialMemory?: Memory;
  initialFiles?: File[];
  existingPhotos?: Array<{
    id: string;
    blob: Blob;
    mimeType: string;
    createdAt: number;
    publicUrl?: string;
    thumbnailUrl?: string;
  }>;
}

const EditorModal = ({
  isOpen,
  onClose,
  onSave,
  initialMemory,
  initialFiles,
  existingPhotos
}: EditorModalProps) => {
  // 获取当天日期并格式化为 YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState<string>(getTodayDate());
  const [note, setNote] = useState<string>('');
  const [newFiles, setNewFiles] = useState<File[]>(initialFiles || []);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Array<{
    id: string;
    url: string;
    isExisting: boolean;
  }>>([]);

  // 初始化表单数据
  useEffect(() => {
    if (isOpen) {
      if (initialMemory) {
        setDate(initialMemory.date);
        setNote(initialMemory.note);
        setNewFiles(initialFiles || []);
        setRemovedPhotoIds([]);
      } else {
        // 每次打开时重新获取当天日期
        setDate(getTodayDate());
        setNote('');
        setNewFiles([]);
        setRemovedPhotoIds([]);
      }
    }
  }, [isOpen, initialMemory, initialFiles]);

  // 生成预览URL - 修复无限循环问题
  useEffect(() => {
    const existing = existingPhotos || [];

    console.log('🖼️ 生成预览URL...');
    console.log('  已有照片数量:', existing.length);
    console.log('  新文件数量:', newFiles.length);

    // 生成新文件的URL
    const newFileUrls = newFiles.map(file => ({
      id: `new-${Math.random().toString(36).substr(2, 9)}`,
      url: URL.createObjectURL(file),
      isExisting: false
    }));

    // 生成已有文件的URL - 优先使用publicUrl
    const existingPhotoUrls = existing.map(photo => {
      // 如果有publicUrl，直接使用；否则从blob创建
      const url = photo.publicUrl || URL.createObjectURL(photo.blob);

      console.log(`  照片 ${photo.id}:`, {
        hasPublicUrl: !!photo.publicUrl,
        hasBlob: !!photo.blob,
        url: url.substring(0, 100) + '...'
      });

      return {
        id: photo.id,
        url: url,
        isExisting: true
      };
    });

    const allUrls = [...existingPhotoUrls, ...newFileUrls];
    console.log('✅ 生成预览URL完成，总数:', allUrls.length);
    setPreviewUrls(allUrls);

    // 清理URL资源 - 只清理从blob创建的URL
    return () => {
      allUrls.forEach(item => {
        // 只清理blob创建的URL，不清理publicUrl
        if (!item.isExisting || !existing.find(p => p.id === item.id && p.publicUrl)) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [newFiles, existingPhotos]);

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setNewFiles(prev => [...prev, ...files]);
    }
  };

  // 移除文件
  const removeFile = (index: number) => {
    const item = previewUrls[index];
    const existing = existingPhotos || [];
    if (item.isExisting) {
      // 如果是已有文件，记录要删除的ID
      setRemovedPhotoIds(prev => [...prev, item.id]);
    } else {
      // 如果是新文件，从newFiles中移除
      setNewFiles(prev => prev.filter((_, i) => i !== index - existing.length));
    }
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 确保至少有一张图片
    if (!date || (previewUrls.length - removedPhotoIds.length) === 0) return;
    onSave(date, note, newFiles, removedPhotoIds);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gallery-midnight-light rounded-2xl shadow-dramatic-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* 头部 - 编辑杂志风格 */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gallery-cream-dark/20">
          <h2 className="text-2xl font-black text-gallery-deep-teal dark:text-gallery-cream tracking-tight">
            {initialMemory ? '编辑记忆' : '添加记忆'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gallery-teal dark:text-gallery-cream-dark hover:text-gallery-coral dark:hover:text-gallery-neon-pink hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 rounded-xl"
          >
            <X size={24} />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* 日期选择 */}
          <div className="mb-5">
            <label htmlFor="date" className="block text-sm font-bold text-gallery-deep-teal dark:text-gallery-cream mb-2 tracking-wide uppercase">
              日期
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min="2020-01-01"
              max="2029-12-31"
              className="w-full px-4 py-3 border-2 border-gallery-cream-dark/30 dark:border-gallery-cream-dark/30 rounded-xl text-gallery-deep-teal dark:text-gallery-cream bg-white dark:bg-white/5 focus:outline-none focus:border-gallery-gold dark:focus:border-gallery-gold transition-all duration-300 font-medium"
              required
            />
          </div>

          {/* 备注输入 */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="note" className="block text-sm font-bold text-gallery-deep-teal dark:text-gallery-cream tracking-wide uppercase">
                备注
              </label>
              <span className={`text-xs font-bold ${
                note.length > 120
                  ? 'text-red-500 dark:text-red-400'
                  : note.length > 100
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-gray-500 dark:text-gallery-cream-dark'
              }`}>
                {note.length}/128
              </span>
            </div>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={128}
              className="w-full px-4 py-3 border-2 border-gallery-cream-dark/30 dark:border-gallery-cream-dark/30 rounded-xl text-gallery-deep-teal dark:text-gallery-cream bg-white dark:bg-white/5 focus:outline-none focus:border-gallery-coral dark:focus:border-gallery-coral transition-all duration-300 resize-none placeholder:text-gray-400 dark:placeholder:text-gallery-cream-dark/50"
              placeholder="记录一下当时的心情或故事..."
            ></textarea>
          </div>

          {/* 图片预览 */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-gallery-deep-teal dark:text-gallery-cream tracking-wide uppercase">
                图片 ({previewUrls.length - removedPhotoIds.length}张)
              </label>
              <label
                htmlFor="fileInput"
                className="flex items-center space-x-2 text-gallery-teal dark:text-gallery-cream-dark hover:text-gallery-coral dark:hover:text-gallery-neon-pink cursor-pointer text-sm font-bold transition-all duration-300 hover:scale-105"
              >
                <Plus size={18} />
                <span>添加图片</span>
              </label>
              <input
                id="fileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* 图片网格 */}
            {(previewUrls.length - removedPhotoIds.length) > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {previewUrls.map((item, index) => (
                  // 跳过已删除的图片
                  !item.isExisting || !removedPhotoIds.includes(item.id) ? (
                    <div key={item.id} className="relative group">
                      <div className="aspect-square rounded-xl overflow-hidden shadow-soft">
                        <img
                          src={item.url}
                          alt={`预览 ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-gallery-midnight/90 backdrop-blur-sm rounded-xl shadow-dramatic text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : null
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gallery-cream-dark/30 dark:border-gallery-cream-dark/30 rounded-2xl p-10 text-center text-gallery-teal dark:text-gallery-cream-dark bg-gallery-cream/30 dark:bg-white/5 transition-all duration-300">
                <p className="font-medium">点击添加图片或拖拽图片到此处</p>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-5 border-t border-gray-200 dark:border-gallery-cream-dark/20">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gallery-cream-dark/30 dark:border-gallery-cream-dark/30 text-gallery-deep-teal dark:text-gallery-cream rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 font-semibold"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-primary text-white rounded-xl hover:bg-gradient-primary-hover transition-all duration-300 font-bold shadow-dramatic hover:shadow-dramatic-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={(previewUrls.length - removedPhotoIds.length) === 0}
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditorModal;
