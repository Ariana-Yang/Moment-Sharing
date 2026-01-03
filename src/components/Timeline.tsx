import { useState, useEffect, useRef, useCallback } from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';
import type { Memory } from '../db/db';
import type { ImageWithUrl } from '../types';

interface TimelineProps {
  memories: Memory[];
  loading: boolean;
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
  onImageClick: (memoryId: string, photoIndex: number) => void;
  getPhotosByMemoryId: (memoryId: string) => Promise<Array<{
    id: string;
    blob: Blob;
    mimeType: string;
    createdAt: number;
  }>>;
}

export const Timeline = ({ 
  memories, 
  loading, 
  onEdit, 
  onDelete, 
  onImageClick,
  getPhotosByMemoryId
}: TimelineProps) => {
  // 存储每个记忆的图片URL
  const [imageUrls, setImageUrls] = useState<Record<string, ImageWithUrl[]>>({});
  // 存储已创建的URL引用，用于清理
  const urlRefs = useRef<Record<string, string[]>>({});
  // 存储IntersectionObserver实例
  const observerRef = useRef<IntersectionObserver | null>(null);
  // 存储记忆卡片的ref
  const memoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 处理图片加载
  const loadImages = useCallback(async (memoryId: string) => {
    try {
      // 先清理旧的URL，防止内存泄漏
      if (urlRefs.current[memoryId]) {
        urlRefs.current[memoryId].forEach(url => URL.revokeObjectURL(url));
      }
      
      const photos = await getPhotosByMemoryId(memoryId);
      const photosWithUrls = photos.map(photo => {
        const url = URL.createObjectURL(photo.blob);
        return {
          ...photo,
          url
        };
      });

      // 存储新的URL引用，用于后续清理
      urlRefs.current[memoryId] = photosWithUrls.map(photo => photo.url);
      
      // 更新图片URLs状态
      setImageUrls(prev => ({
        ...prev,
        [memoryId]: photosWithUrls
      }));
    } catch (error) {
      console.error('加载图片失败:', error);
    }
  }, [getPhotosByMemoryId]);

  // 当记忆列表变化时，重新加载所有图片
  useEffect(() => {
    // 当记忆列表变化时，重新加载所有图片，确保图片URL有效
    memories.forEach(memory => {
      loadImages(memory.id);
    });
  }, [memories, loadImages]);

  // 组件卸载时清理所有URL资源
  useEffect(() => {
    return () => {
      // 清理所有URL资源，防止内存泄漏
      Object.values(urlRefs.current).forEach(urls => {
        urls.forEach(url => URL.revokeObjectURL(url));
      });
    };
  }, []);

  // 为后续加载的记忆卡片设置IntersectionObserver
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const memoryId = entry.target.id.replace('memory-', '');
            loadImages(memoryId);
          }
        });
      },
      {
        rootMargin: '200px 0px', // 提前200px加载
        threshold: 0.1 // 10%可见时开始加载
      }
    );

    // 观察所有记忆卡片
    Object.values(memoryRefs.current).forEach(ref => {
      if (ref) {
        observerRef.current?.observe(ref);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [loadImages]);

  // 清理URL资源
  useEffect(() => {
    return () => {
      // 清理所有已创建的URL
      Object.values(imageUrls).forEach(photos => {
        photos.forEach(photo => {
          URL.revokeObjectURL(photo.url);
        });
      });
    };
  }, [imageUrls]);

  // 更新ref
  const updateRef = useCallback((memoryId: string, ref: HTMLDivElement | null) => {
    memoryRefs.current[memoryId] = ref;
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <h3 className="text-xl font-semibold mb-2">还没有记忆</h3>
        <p>点击右下角的 + 按钮开始添加你的第一个记忆吧！</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {memories.map(memory => (
        <div
          key={memory.id}
          id={`memory-${memory.id}`}
          ref={(ref) => updateRef(memory.id, ref)}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-4 md:p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-800">
                  {new Date(memory.date).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
                <p className="text-gray-600 mt-1">{memory.note}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(memory)}
                  className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                  title="编辑"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => onDelete(memory.id)}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="删除"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* 图片网格 */}
            {memory.photoIds.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {imageUrls[memory.id]?.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative group"
                  >
                    <img
                      src={photo.url}
                      alt={`记忆图片 ${index + 1}`}
                      className="w-full h-40 md:h-56 object-cover rounded-md cursor-pointer transition-transform duration-300 group-hover:scale-105"
                      onClick={() => onImageClick(memory.id, index)}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                      <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
