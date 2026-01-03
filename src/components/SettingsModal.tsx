import React, { useRef } from 'react';
import { X, Download, Upload, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  loading: boolean;
}

export const SettingsModal = ({ 
  isOpen, 
  onClose, 
  onExport, 
  onImport,
  loading
}: SettingsModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-2">
            <Settings size={20} className="text-gray-600" />
            <h2 className="text-xl font-semibold">设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          <div className="space-y-4">
            {/* 导出数据 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">导出数据</h3>
              <p className="text-sm text-gray-600 mb-4">
                将所有记忆和图片导出为JSON文件，可用于备份或迁移到其他设备。
              </p>
              <button
                onClick={onExport}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed w-full justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <Download size={16} />
                )}
                <span>{loading ? '导出中...' : '导出数据'}</span>
              </button>
            </div>

            {/* 导入数据 */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">导入数据</h3>
              <p className="text-sm text-gray-600 mb-4">
                从JSON文件导入数据，将替换现有所有内容。
              </p>
              <div className="flex space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed w-full justify-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <Upload size={16} />
                  )}
                  <span>{loading ? '导入中...' : '选择文件'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
