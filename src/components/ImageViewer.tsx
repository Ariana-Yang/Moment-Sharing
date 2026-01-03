import { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{
    id: string;
    blob: Blob;
    mimeType: string;
    url: string;
  }>;
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export const ImageViewer = ({ 
  isOpen, 
  onClose, 
  images, 
  currentIndex, 
  onIndexChange 
}: ImageViewerProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onIndexChange((currentIndex - 1 + images.length) % images.length);
          break;
        case 'ArrowRight':
          onIndexChange((currentIndex + 1) % images.length);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, images.length, currentIndex, onIndexChange]);

  // 点击背景关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-10 transition-colors"
      >
        <X size={28} />
      </button>

      {/* 左箭头 */}
      <button
        onClick={() => onIndexChange((currentIndex - 1 + images.length) % images.length)}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-2 z-10 transition-colors"
      >
        <ChevronLeft size={32} />
      </button>

      {/* 图片容器 */}
      <div ref={modalRef} className="relative max-w-5xl max-h-[90vh]">
        <img
          src={currentImage.url}
          alt={`图片 ${currentIndex + 1}/${images.length}`}
          className="max-w-full max-h-[90vh] object-contain"
        />

        {/* 图片计数 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* 右箭头 */}
      <button
        onClick={() => onIndexChange((currentIndex + 1) % images.length)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-2 z-10 transition-colors"
      >
        <ChevronRight size={32} />
      </button>
    </div>
  );
};
