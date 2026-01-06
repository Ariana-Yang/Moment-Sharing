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
    publicUrl?: string;
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

  // 点击背景关闭（点击图片区域不关闭）
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 检查点击是否来自按钮或其后代元素
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        return; // 点击按钮，不关闭模态框
      }

      // 检查点击是否来自图片或图片容器
      if (target.tagName === 'IMG' || target.closest('img')) {
        return; // 点击图片区域，不关闭模态框
      }

      // 检查点击是否来自模态框内容区域
      if (modalRef.current && modalRef.current.contains(target)) {
        return; // 点击在内容区域内，不关闭模态框
      }

      // 点击背景，关闭模态框
      onClose();
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

      // 从 publicUrl 下载图片数据
      if (!currentImage.publicUrl) {
        throw new Error('图片 URL 不存在');
      }

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

      // 从 publicUrl 获取实际的图片数据
      const response = await fetch(currentImage.publicUrl);
      if (!response.ok) {
        throw new Error(`下载失败: ${response.statusText}`);
      }

      const blob = await response.blob();
      const mimeType = blob.type || currentImage.mimeType || 'image/jpeg';
      const extension = mimeType.split('/')[1] || 'jpg';
      const fileName = `moment-sharing-${currentIndex + 1}-${new Date().toISOString().split('T')[0]}.${extension}`;

      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
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
    <div className="fixed inset-0 bg-gallery-midnight/95 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
      {/* 关闭按钮 - 编辑杂志风格 */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-gallery-cream hover:text-gallery-coral p-3 z-20 transition-all duration-300 hover:scale-110 rounded-full hover:bg-white/10"
        title="关闭"
      >
        <X size={32} />
      </button>

      {/* 左箭头 - 编辑杂志风格 */}
      <button
        onClick={() => onIndexChange((currentIndex - 1 + images.length) % images.length)}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gallery-cream hover:text-gallery-coral p-3 z-20 transition-all duration-300 hover:scale-110 rounded-full hover:bg-white/10"
        title="上一张"
      >
        <ChevronLeft size={36} />
      </button>

      {/* 右箭头 - 编辑杂志风格 */}
      <button
        onClick={() => onIndexChange((currentIndex + 1) % images.length)}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gallery-cream hover:text-gallery-coral p-3 z-20 transition-all duration-300 hover:scale-110 rounded-full hover:bg-white/10"
        title="下一张"
      >
        <ChevronRight size={36} />
      </button>

      {/* 操作工具栏 - 编辑杂志风格 */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-3 flex items-center space-x-2 z-20 shadow-dramatic border border-white/20">
        {/* 缩放控制 */}
        <button
          onClick={handleZoomOut}
          className="p-2.5 text-gallery-cream hover:text-gallery-coral hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110"
          title="缩小"
        >
          <span className="text-xl font-black">-</span>
        </button>

        <button
          onClick={handleResetZoom}
          className="p-2.5 text-gallery-cream hover:text-gallery-coral hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110"
          title="重置缩放"
        >
          <RotateCcw size={20} />
        </button>

        <button
          onClick={handleZoomIn}
          className="p-2.5 text-gallery-cream hover:text-gallery-coral hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110"
          title="放大"
        >
          <span className="text-xl font-black">+</span>
        </button>

        {/* 分隔线 */}
        <div className="w-px h-6 bg-white/30 mx-1"></div>

        {/* 下载按钮 */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${
            downloading ? 'opacity-50 cursor-not-allowed' : 'text-gallery-cream hover:text-gallery-coral hover:bg-white/10'
          }`}
          title="下载原图"
        >
          <Download size={20} />
        </button>
      </div>

      {/* 记忆信息显示 - 编辑杂志风格，固定在工具栏下方 */}
      <div className="absolute top-[100px] left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-xl text-gallery-cream px-5 py-3 rounded-2xl text-center max-w-[90vw] md:max-w-2xl z-20 pointer-events-none shadow-dramatic border border-white/20">
        <h3 className="text-lg md:text-xl font-black mb-1 break-words">{new Date(currentImage.memoryDate).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</h3>
        {currentImage.memoryNote && (
          <p className="text-sm md:text-base opacity-90 font-medium break-words whitespace-pre-wrap leading-relaxed">{currentImage.memoryNote}</p>
        )}
      </div>

      {/* 图片容器 */}
      <div
        className="relative max-w-[90vw] max-h-[90vh]"
      >

        {/* 图片内容区域 */}
        <div
          ref={modalRef}
          className="relative w-full h-full flex items-center justify-center p-8"
        >
          <div
            className="relative"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseDown={handleMouseDown}
          >
            {/* 关键修复点1: 使用max-w-[90vw] max-h-[90vh]确保图片完整显示在视口内 */}
            {/* 关键修复点2: objectFit设置为contain确保图片保持原始比例 */}
            {/* 关键修复点3: objectPosition设置为center确保图片居中显示 */}
            <img
              ref={imageRef}
              src={currentImage.url}
              alt={`图片 ${currentIndex + 1}/${images.length}`}
              className="object-contain transition-transform duration-200"
              style={{
                transform: `scale(${scale})`,
                cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default',
                // 关键修复：使用maxWidth和maxHeight确保图片完整显示
                maxWidth: '90vw',
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto',
                // 关键修复：objectFit: contain确保图片保持原始比例，不会被裁切
                objectFit: 'contain',
                // 关键修复：objectPosition: center确保图片居中显示
                objectPosition: 'center',
                display: 'block'
              }}
              // 点击图片不关闭弹窗，点击背景才会关闭
              onMouseDown={handleMouseDown}
              onLoad={(e) => {
                // 关键修复点4: 获取图片原始尺寸，确保容器适配图片比例
                const img = e.target as HTMLImageElement;
                if (img && img.naturalWidth && img.naturalHeight) {
                  // 计算图片的宽高比
                  const aspectRatio = img.naturalWidth / img.naturalHeight;

                  // 横向长图：宽度大于高度
                  // 纵向长图：高度大于宽度
                  // 方形图：宽度等于高度

                  // 对于横向长图，确保宽度优先适配
                  // 对于纵向长图，确保高度优先适配
                  if (aspectRatio > 1) {
                    // 横向长图，按宽度适配
                    const targetWidth = Math.min(window.innerWidth * 0.9, img.naturalWidth);
                    const targetHeight = targetWidth / aspectRatio;

                    // 如果高度超出视口，按高度重新计算
                    if (targetHeight > window.innerHeight * 0.9) {
                      const adjustedHeight = window.innerHeight * 0.9;
                      const adjustedWidth = adjustedHeight * aspectRatio;
                      // 设置图片容器的尺寸
                      (img as any)._displayWidth = adjustedWidth;
                      (img as any)._displayHeight = adjustedHeight;
                    } else {
                      (img as any)._displayWidth = targetWidth;
                      (img as any)._displayHeight = targetHeight;
                    }
                  } else {
                    // 纵向长图或方形图，按高度适配
                    const targetHeight = Math.min(window.innerHeight * 0.9, img.naturalHeight);
                    const targetWidth = targetHeight * aspectRatio;

                    // 如果宽度超出视口，按宽度重新计算
                    if (targetWidth > window.innerWidth * 0.9) {
                      const adjustedWidth = window.innerWidth * 0.9;
                      const adjustedHeight = adjustedWidth / aspectRatio;
                      (img as any)._displayWidth = adjustedWidth;
                      (img as any)._displayHeight = adjustedHeight;
                    } else {
                      (img as any)._displayWidth = targetWidth;
                      (img as any)._displayHeight = targetHeight;
                    }
                  }
                }
              }}
            />
          </div>

          {/* 图片计数 - 编辑杂志风格 */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-xl text-gallery-cream px-5 py-2.5 rounded-full text-base font-semibold z-10 pointer-events-none border border-white/20">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      </div>

      {/* 下载进度提示 - 编辑杂志风格 */}
      {downloading && (
        <div className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-xl text-gallery-cream p-5 rounded-2xl z-20 max-w-sm shadow-dramatic border border-white/20">
          <div className="flex items-center mb-3">
            <Download size={24} className="mr-3 animate-pulse text-gallery-coral" />
            <span className="font-bold text-lg">正在下载...</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-primary h-3 rounded-full transition-all duration-300 shadow-dramatic"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
          <div className="text-sm font-semibold text-gallery-coral">{downloadProgress}%</div>
        </div>
      )}

      {/* 下载成功提示 - 编辑杂志风格 */}
      {downloadStatus === 'success' && (
        <div className="absolute bottom-6 right-6 bg-gallery-coral/90 backdrop-blur-xl text-white p-5 rounded-2xl z-20 max-w-sm flex items-center shadow-dramatic animate-scale-in">
          <CheckCircle2 size={24} className="mr-3" />
          <span className="font-bold text-lg">下载成功！</span>
        </div>
      )}

      {/* 下载错误提示 - 编辑杂志风格 */}
      {downloadStatus === 'error' && (
        <div className="absolute bottom-6 right-6 bg-red-500/90 backdrop-blur-xl text-white p-5 rounded-2xl z-20 max-w-sm shadow-dramatic">
          <div className="flex items-center mb-3">
            <AlertCircle size={24} className="mr-3" />
            <span className="font-bold text-lg">下载失败</span>
          </div>
          <div className="text-sm mb-3 font-medium">{downloadError}</div>
          <button
            onClick={handleDownload}
            className="text-sm bg-white bg-opacity-20 px-4 py-2 rounded-xl hover:bg-opacity-30 transition-all font-semibold"
          >
            重试
          </button>
        </div>
      )}
    </div>
  );
};
