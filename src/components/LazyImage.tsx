/**
 * 懒加载图片组件
 *
 * 优化性能:
 * - 滚动到视口才加载图片
 * - 支持缩略图预览
 * - 渐进式加载体验
 */

import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyImageProps {
  src: string;           // 图片URL
  thumbnailSrc?: string; // 缩略图URL
  alt: string;
  className?: string;
  onClick?: () => void;
}

export const LazyImage = ({
  src,
  thumbnailSrc,
  alt,
  className = '',
  onClick
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer检测图片是否进入视口
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect(); // 进入视口后停止观察
        }
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 图片加载完成
  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* 加载中占位 */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700
                        flex items-center justify-center animate-pulse">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      )}

      {/* 缩略图预览(如果有) */}
      {isInView && thumbnailSrc && !isLoaded && (
        <img
          src={thumbnailSrc}
          alt={alt}
          className="w-full h-full object-cover blur-sm scale-110"
          style={{ filter: 'blur(10px)' }}
        />
      )}

      {/* 实际图片 */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onClick={onClick}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${onClick ? 'cursor-pointer hover:opacity-90' : ''}`}
        />
      )}
    </div>
  );
};
