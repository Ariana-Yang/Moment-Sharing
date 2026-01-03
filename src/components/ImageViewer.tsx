import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Download, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{
    id: string;
    blob: Blob;
    mimeType: string;
    url: string;
    memoryDate: string;
    memoryNote: string;
    memoryId: string;
  }>;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onMemoryChange?: (memory: {
    date: string;
    note: string;
  }) => void;
}

export const ImageViewer = ({ 
  isOpen, 
  onClose, 
  images, 
  currentIndex, 
  onIndexChange,
  onMemoryChange
}: ImageViewerProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // 图片交互状态
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // 下载状态
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [downloadError, setDownloadError] = useState('');

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
        case '=':
        case '+':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          handleResetZoom();
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
      // 检查点击是否来自按钮或其后代元素
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        return; // 点击按钮，不关闭模态框
      }
      
      // 检查点击是否来自模态框内容
      if (modalRef.current && !modalRef.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // 重置缩放和位置
  useEffect(() => {
    handleResetZoom();
    
    // 当图片索引变化时，如果提供了onMemoryChange，则更新记忆信息
    if (onMemoryChange && images.length > 0 && currentIndex >= 0 && currentIndex < images.length) {
      const currentImage = images[currentIndex];
      onMemoryChange({
        date: currentImage.memoryDate,
        note: currentImage.memoryNote
      });
    }
  }, [currentIndex, images, onMemoryChange]);

  // 点击关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      handleResetZoom();
      setDownloadStatus('idle');
      setDownloadError('');
    }
  }, [isOpen]);

  // 缩放功能
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // 拖拽功能
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale === 1) return; // 只有缩放后才能拖拽
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 下载功能
  const handleDownload = async () => {
    if (downloading) return;
    
    try {
      setDownloading(true);
      setDownloadProgress(0);
      setDownloadStatus('idle');
      setDownloadError('');
      
      const currentImage = images[currentIndex];
      const blob = currentImage.blob;
      
      // 模拟下载进度
      const simulateProgress = () => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setDownloadProgress(Math.min(progress, 90));
          if (progress >= 90) {
            clearInterval(interval);
          }
        }, 100);
        return interval;
      };
      
      const progressInterval = simulateProgress();
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 设置文件名
      const mimeType = blob.type || 'image/jpeg';
      const extension = mimeType.split('/')[1] || 'jpg';
      const fileName = `moment-sharing-${currentIndex + 1}-${new Date().toISOString().split('T')[0]}.${extension}`;
      link.download = fileName;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理URL
      URL.revokeObjectURL(url);
      
      // 完成下载
      clearInterval(progressInterval);
      setDownloadProgress(100);
      setDownloadStatus('success');
      
      // 3秒后隐藏成功提示
      setTimeout(() => {
        setDownloadStatus('idle');
        setDownloadProgress(0);
      }, 3000);
    } catch (error) {
      console.error('下载失败:', error);
      setDownloadStatus('error');
      setDownloadError(error instanceof Error ? error.message : '下载失败，请重试');
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;
  
  // 如果没有图片，显示提示信息
  if (images.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">没有图片</h3>
          <p className="text-gray-600 mb-4">当前没有可查看的图片</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[100] p-4">
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 z-20 transition-colors"
        title="关闭"
      >
        <X size={28} />
      </button>

      {/* 左箭头 */}
      <button
        onClick={() => onIndexChange((currentIndex - 1 + images.length) % images.length)}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-2 z-20 transition-colors"
        title="上一张"
      >
        <ChevronLeft size={32} />
      </button>

      {/* 右箭头 */}
      <button
        onClick={() => onIndexChange((currentIndex + 1) % images.length)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-2 z-20 transition-colors"
        title="下一张"
      >
        <ChevronRight size={32} />
      </button>

      {/* 操作工具栏 */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 rounded-full p-2 flex space-x-2 z-20">
        {/* 缩放控制 */}
        <button
          onClick={handleZoomOut}
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          title="缩小"
        >
          <span className="text-lg font-bold">-</span>
        </button>
        
        <button
          onClick={handleResetZoom}
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          title="重置缩放"
        >
          <RotateCcw size={18} />
        </button>
        
        <button
          onClick={handleZoomIn}
          className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          title="放大"
        >
          <span className="text-lg font-bold">+</span>
        </button>
        
        {/* 下载按钮 */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`p-2 rounded-full transition-all ${downloading ? 'opacity-70 cursor-not-allowed' : 'text-white hover:bg-white hover:bg-opacity-20'}`}
          title="下载原图"
        >
          <Download size={18} />
        </button>
      </div>

      {/* 图片容器 */}
      <div 
        className="relative max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* 记忆信息显示 */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-center max-w-2xl z-20">
          <h3 className="text-lg font-semibold mb-1">{new Date(currentImage.memoryDate).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</h3>
          {currentImage.memoryNote && (
            <p className="text-sm opacity-90">{currentImage.memoryNote}</p>
          )}
        </div>
        
        {/* 可滚动的图片容器 */}
        <div 
          ref={modalRef} 
          className="relative w-full h-[90vh] overflow-auto flex items-center justify-center"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.3) transparent'
          }}
        >
          {/* 自定义滚动条样式 */}
          <style>{`
            /* Webkit browsers (Chrome, Safari, Edge) */
            div::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            div::-webkit-scrollbar-track {
              background: transparent;
            }
            div::-webkit-scrollbar-thumb {
              background-color: rgba(255,255,255,0.3);
              border-radius: 4px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background-color: rgba(255,255,255,0.5);
            }
          `}</style>
          
          <div 
            className="relative p-8"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'zoom-in'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseDown={handleMouseDown}
          >
            <img
              ref={imageRef}
              src={currentImage.url}
              alt={`图片 ${currentIndex + 1}/${images.length}`}
              className="object-contain transition-transform duration-200"
              style={{
                transform: `scale(${scale})`,
                cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'zoom-in',
                maxWidth: '90vw',
                maxHeight: '80vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                objectPosition: 'center',
                display: 'block'
              }}
              onClick={handleZoomIn}
              onMouseDown={handleMouseDown}
              onLoad={(e) => {
                // 当图片加载完成后，计算初始缩放比例以适应视口
                const img = e.target as HTMLImageElement;
                if (img && scale === 1) {
                  // 计算适合视口的初始缩放比例
                  const containerWidth = window.innerWidth * 0.9;
                  const containerHeight = window.innerHeight * 0.8;
                  const imgRatio = img.naturalWidth / img.naturalHeight;
                  const containerRatio = containerWidth / containerHeight;
                  
                  let initialScale = 1;
                  if (imgRatio > containerRatio) {
                    // 图片更宽，按宽度缩放
                    initialScale = containerWidth / img.naturalWidth;
                  } else {
                    // 图片更高，按高度缩放
                    initialScale = containerHeight / img.naturalHeight;
                  }
                  
                  // 确保初始缩放不超过1（原始大小）
                  initialScale = Math.min(initialScale, 1);
                  setScale(initialScale);
                }
              }}
            />
          </div>

          {/* 图片计数 */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-1 rounded-full text-sm z-10">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      </div>

      {/* 下载进度提示 */}
      {downloading && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg z-20 max-w-sm">
          <div className="flex items-center mb-2">
            <Download size={20} className="mr-2 animate-pulse" />
            <span className="font-medium">正在下载...</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-300">{downloadProgress}%</div>
        </div>
      )}

      {/* 下载成功提示 */}
      {downloadStatus === 'success' && (
        <div className="absolute bottom-4 right-4 bg-green-600 bg-opacity-90 text-white p-4 rounded-lg z-20 max-w-sm flex items-center">
          <CheckCircle2 size={20} className="mr-2" />
          <span>下载成功！</span>
        </div>
      )}

      {/* 下载错误提示 */}
      {downloadStatus === 'error' && (
        <div className="absolute bottom-4 right-4 bg-red-600 bg-opacity-90 text-white p-4 rounded-lg z-20 max-w-sm">
          <div className="flex items-center mb-2">
            <AlertCircle size={20} className="mr-2" />
            <span className="font-medium">下载失败</span>
          </div>
          <div className="text-sm mb-2">{downloadError}</div>
          <button
            onClick={handleDownload}
            className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded hover:bg-opacity-30 transition-colors"
          >
            重试
          </button>
        </div>
      )}
    </div>
  );
};
