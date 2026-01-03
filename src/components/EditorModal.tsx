// 修复EditorModal组件中的无限循环问题
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
  }>;
}

export const EditorModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialMemory,
  initialFiles = [],
  existingPhotos = []
}: EditorModalProps) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [newFiles, setNewFiles] = useState<File[]>(initialFiles);
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
        setNewFiles(initialFiles);
        setRemovedPhotoIds([]);
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setNote('');
        setNewFiles([]);
        setRemovedPhotoIds([]);
      }
    }
  }, [isOpen, initialMemory, initialFiles]);

  // 生成预览URL - 修复无限循环问题
  useEffect(() => {
    // 生成新文件的URL
    const newFileUrls = newFiles.map(file => ({
      id: `new-${Math.random().toString(36).substr(2, 9)}`,
      url: URL.createObjectURL(file),
      isExisting: false
    }));

    // 生成已有文件的URL
    const existingPhotoUrls = existingPhotos.map(photo => ({
      id: photo.id,
      url: URL.createObjectURL(photo.blob),
      isExisting: true
    }));

    const allUrls = [...existingPhotoUrls, ...newFileUrls];
    setPreviewUrls(allUrls);

    // 清理URL资源 - 只清理当前批次创建的URL
    return () => {
      allUrls.forEach(item => URL.revokeObjectURL(item.url));
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
    if (item.isExisting) {
      // 如果是已有文件，记录要删除的ID
      setRemovedPhotoIds(prev => [...prev, item.id]);
    } else {
      // 如果是新文件，从newFiles中移除
      setNewFiles(prev => prev.filter((_, i) => i !== index - existingPhotos.length));
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {initialMemory ? '编辑记忆' : '添加记忆'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-4">
          {/* 日期选择 */}
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              日期
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min="2020-01-01"
              max="2029-12-31"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 备注输入 */}
          <div className="mb-4">
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
              备注
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="记录一下当时的心情或故事..."
            ></textarea>
          </div>

          {/* 图片预览 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                图片 ({previewUrls.length - removedPhotoIds.length}张)
              </label>
              <label
                htmlFor="fileInput"
                className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 cursor-pointer text-sm font-medium transition-colors"
              >
                <Plus size={16} />
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {previewUrls.map((item, index) => (
                  // 跳过已删除的图片
                  !item.isExisting || !removedPhotoIds.includes(item.id) ? (
                    <div key={item.id} className="relative group">
                      <img
                        src={item.url}
                        alt={`预览 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : null
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center text-gray-500">
                <p>点击添加图片或拖拽图片到此处</p>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
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