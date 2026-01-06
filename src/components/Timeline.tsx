import { useState, useEffect, useRef, useCallback } from 'react';
import { Edit, Trash2, Eye, Download, CheckSquare, Square, X } from 'lucide-react';
import JSZip from 'jszip';
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
    publicUrl?: string;
    thumbnailUrl?: string;
  }>>;
  isEditMode: boolean;
}

export const Timeline = ({
  memories,
  loading,
  onEdit,
  onDelete,
  onImageClick,
  getPhotosByMemoryId,
  isEditMode
}: TimelineProps) => {
  // 存储每个记忆的图片URL
  const [imageUrls, setImageUrls] = useState<Record<string, ImageWithUrl[]>>({});
  // 存储已创建的URL引用，用于清理
  const urlRefs = useRef<Record<string, string[]>>({});
  // 存储IntersectionObserver实例
  const observerRef = useRef<IntersectionObserver | null>(null);
  // 存储记忆卡片的ref
  const memoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 批量下载相关状态
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // 处理图片加载
  const loadImages = useCallback(async (memoryId: string) => {
    try {
      console.log('🖼️ [Timeline] 加载图片, Memory ID:', memoryId);
      const photos = await getPhotosByMemoryId(memoryId);

      console.log('  [Timeline] 获取到', photos.length, '张照片');

      if (photos.length === 0) {
        console.warn('  [Timeline] ⚠️ 没有照片数据！');
        return;
      }

      const photosWithUrls = photos.map((photo, index) => {
        // 优先使用publicUrl，如果没有才从blob创建
        const url = photo.publicUrl || URL.createObjectURL(photo.blob);

        console.log(`  [Timeline] 照片 ${index + 1}:`, {
          id: photo.id,
          hasPublicUrl: !!photo.publicUrl,
          urlType: photo.publicUrl ? 'publicUrl' : 'blob',
          url: url.substring(0, 80) + '...'
        });

        return {
          ...photo,
          url
        };
      });

      console.log('  [Timeline] photosWithUrls准备就绪，数量:', photosWithUrls.length);
      console.log('  [Timeline] 第一个照片的URL:', photosWithUrls[0]?.url?.substring(0, 100) + '...');

      // 存储新的URL引用，用于后续清理（只存储从blob创建的URL）
      urlRefs.current[memoryId] = photosWithUrls
        .filter(photo => !photo.publicUrl)
        .map(photo => photo.url);

      // 更新图片URLs状态
      setImageUrls(prev => {
        const newState = {
          ...prev,
          [memoryId]: photosWithUrls
        };
        console.log('  [Timeline] 更新imageUrls状态，memoryId:', memoryId);
        console.log('  [Timeline] imageUrls[memoryId]数量:', newState[memoryId]?.length);
        return newState;
      });

      console.log('✅ [Timeline] 图片加载完成');
    } catch (error) {
      console.error('❌ [Timeline] 加载图片失败:', error);
    }
  }, [getPhotosByMemoryId]);

  // 当记忆列表变化时，重新加载所有图片并清理旧记忆的URL
  useEffect(() => {
    // 获取当前所有记忆的ID
    const currentMemoryIds = new Set(memories.map(memory => memory.id));
    
    // 清理已移除记忆的URL资源
    Object.keys(urlRefs.current).forEach(memoryId => {
      if (!currentMemoryIds.has(memoryId)) {
        // 清理旧记忆的URL
        urlRefs.current[memoryId].forEach(url => URL.revokeObjectURL(url));
        // 从引用记录中删除
        delete urlRefs.current[memoryId];
      }
    });
    
    // 重新加载所有当前记忆的图片
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



  // 更新ref
  const updateRef = useCallback((memoryId: string, ref: HTMLDivElement | null) => {
    memoryRefs.current[memoryId] = ref;
  }, []);

  // 批量下载功能函数
  const togglePhotoSelection = useCallback((photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  }, []);

  const selectAllPhotos = useCallback(() => {
    const allPhotoIds = memories.flatMap(memory =>
      (imageUrls[memory.id] || []).map(photo => photo.id)
    );
    setSelectedPhotos(new Set(allPhotoIds));
  }, [memories, imageUrls]);

  const clearSelection = useCallback(() => {
    setSelectedPhotos(new Set());
  }, []);

  const handleBatchDownload = useCallback(async () => {
    if (selectedPhotos.size === 0 || downloading) return;

    try {
      setDownloading(true);
      setDownloadProgress(0);

      const zip = new JSZip();
      let processedCount = 0;
      const totalCount = selectedPhotos.size;

      // 遍历所有记忆，找到选中的图片
      for (const memory of memories) {
        const photos = imageUrls[memory.id] || [];
        for (const photo of photos) {
          if (selectedPhotos.has(photo.id)) {
            try {
              // 从 publicUrl 下载图片数据
              if (!photo.publicUrl) {
                console.error('图片 URL 不存在:', photo.id);
                continue;
              }

              const response = await fetch(photo.publicUrl);
              if (!response.ok) {
                console.error('下载图片失败:', photo.id, response.statusText);
                continue;
              }

              const blob = await response.blob();

              // 生成文件名：日期_序号.扩展名
              const dateStr = memory.date.replace(/-/g, '');
              const mimeType = blob.type || photo.mimeType || 'image/jpeg';
              const extension = mimeType.split('/')[1] || 'jpg';
              const photoIndex = photos.findIndex(p => p.id === photo.id) + 1;
              const fileName = `${dateStr}_${photoIndex}.${extension}`;

              // 添加到 ZIP
              zip.file(fileName, blob);

              processedCount++;
              setDownloadProgress(Math.round((processedCount / totalCount) * 100));
            } catch (error) {
              console.error('处理图片失败:', photo.id, error);
            }
          }
        }
      }

      // 生成 ZIP 文件
      const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setDownloadProgress(Math.round(metadata.percent));
      });

      // 下载 ZIP 文件
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `moment-sharing-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 退出批量模式
      setIsBatchMode(false);
      setSelectedPhotos(new Set());
    } catch (error) {
      console.error('批量下载失败:', error);
      alert('批量下载失败，请重试');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  }, [selectedPhotos, downloading, memories, imageUrls]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        {/* 编辑杂志风格加载动画 */}
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gallery-sand rounded-full"></div>
          <div className="absolute top-0 left-0 w-20 h-20 border-4 border-gallery-coral rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-gallery-coral rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="text-center py-24 px-4">
        {/* 编辑杂志风格空状态 */}
        <div className="max-w-lg mx-auto animate-scale-in">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-2xl bg-gradient-primary transform rotate-3 opacity-20"></div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-primary transform -rotate-3 opacity-30"></div>
            <div className="relative w-full h-full rounded-2xl bg-gradient-primary flex items-center justify-center shadow-dramatic">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
          <h3 className="text-4xl font-black text-gallery-deep-teal dark:text-gallery-cream mb-4">还没有记忆</h3>
          <p className="text-lg text-gallery-teal dark:text-gallery-cream-dark leading-relaxed mb-8">
            点击右下角的 <span className="text-gallery-coral dark:text-gallery-neon-pink font-black text-2xl mx-1">+</span> 按钮开始添加你的第一个记忆吧！
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24">
      {/* 批量下载工具栏 - 编辑杂志风格 */}
      {!loading && memories.length > 0 && (
        <div className="sticky top-20 z-10 glass-card dark:glass-card-dark shadow-dramatic rounded-2xl p-5 animate-slide-down">
          {!isBatchMode ? (
            <div className="flex justify-between items-center">
              <span className="text-gallery-deep-teal dark:text-gallery-cream font-bold text-lg">批量下载照片</span>
              <button
                onClick={() => setIsBatchMode(true)}
                className="flex items-center px-6 py-3 bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded-xl transition-all duration-300 shadow-dramatic hover:shadow-dramatic-lg transform hover:scale-105 font-semibold"
              >
                <Download size={20} className="mr-2" />
                批量下载
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gallery-deep-teal dark:text-gallery-cream font-bold text-lg">
                已选择 <span className="text-gallery-coral dark:text-gallery-neon-pink">{selectedPhotos.size}</span> 张照片
              </span>
              <button
                onClick={selectAllPhotos}
                className="flex items-center px-4 py-2.5 bg-gallery-cream-dark/20 dark:bg-gallery-midnight-light/30 text-gallery-deep-teal dark:text-gallery-cream rounded-xl hover:bg-gallery-cream-dark/30 dark:hover:bg-gallery-midnight-light/50 transition-all duration-300 font-semibold"
              >
                <CheckSquare size={18} className="mr-2" />
                全选
              </button>
              <button
                onClick={clearSelection}
                className="flex items-center px-4 py-2.5 bg-gallery-cream-dark/20 dark:bg-gallery-midnight-light/30 text-gallery-deep-teal dark:text-gallery-cream rounded-xl hover:bg-gallery-cream-dark/30 dark:hover:bg-gallery-midnight-light/50 transition-all duration-300 font-semibold"
              >
                <Square size={18} className="mr-2" />
                清空
              </button>
              <div className="flex-1"></div>
              <button
                onClick={() => {
                  setIsBatchMode(false);
                  setSelectedPhotos(new Set());
                }}
                className="flex items-center px-4 py-2.5 text-gallery-teal dark:text-gallery-cream-dark hover:text-gallery-deep-teal dark:hover:text-gallery-cream transition-colors font-medium"
              >
                <X size={20} className="mr-2" />
                取消
              </button>
              <button
                onClick={handleBatchDownload}
                disabled={selectedPhotos.size === 0 || downloading}
                className={`flex items-center px-6 py-3 rounded-xl transition-all duration-300 font-semibold ${
                  selectedPhotos.size === 0 || downloading
                    ? 'bg-gallery-cream-dark/40 dark:bg-gallery-midnight-light/40 text-gallery-teal/50 dark:text-gallery-cream-dark/50 cursor-not-allowed'
                    : 'bg-gradient-primary hover:bg-gradient-primary-hover text-white shadow-dramatic hover:shadow-dramatic-lg transform hover:scale-105'
                }`}
              >
                <Download size={20} className="mr-2" />
                {downloading ? `打包中 (${downloadProgress}%)` : '下载选中'}
              </button>
            </div>
          )}
        </div>
      )}

      {memories.map((memory, index) => (
        <div
          key={memory.id}
          id={`memory-${memory.id}`}
          ref={(ref) => updateRef(memory.id, ref)}
          className="glass-card dark:glass-card-dark rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-500 overflow-hidden transform hover:-translate-y-2 animate-slide-up group"
          style={{
            animationDelay: `${index * 0.1}s`,
            animationFillMode: 'both'
          }}
        >
          <div className="p-6 md:p-8">
            {/* 日期和操作栏 - 编辑杂志风格 */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                {/* 戏剧化的日期标签 */}
                <div className="inline-flex items-center px-5 py-2.5 rounded-2xl bg-gradient-primary text-white shadow-dramatic transform group-hover:scale-105 transition-transform duration-300 mb-4">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-bold text-base">
                    {new Date(memory.date).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {/* 备注文本 */}
                <p className="text-lg text-gallery-deep-teal dark:text-gallery-cream leading-relaxed font-medium">
                  {memory.note}
                </p>
              </div>

              {/* 编辑和删除按钮 - 编辑杂志风格 */}
              {isEditMode && (
                <div className="flex space-x-2 ml-6">
                  <button
                    onClick={() => onEdit(memory)}
                    className="p-3 text-gallery-teal dark:text-gallery-cream-dark hover:text-gallery-coral dark:hover:text-gallery-neon-pink hover:bg-gallery-cream-dark/20 dark:hover:bg-gallery-midnight-light/30 rounded-xl transition-all duration-300 transform hover:scale-110"
                    title="编辑"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => onDelete(memory.id)}
                    className="p-3 text-gallery-teal dark:text-gallery-cream-dark hover:text-gallery-coral dark:hover:text-gallery-neon-pink hover:bg-gallery-cream-dark/20 dark:hover:bg-gallery-midnight-light/30 rounded-xl transition-all duration-300 transform hover:scale-110"
                    title="删除"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* 图片网格 - 编辑杂志风格 */}
            {imageUrls[memory.id] && imageUrls[memory.id].length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imageUrls[memory.id]?.map((photo, index) => (
                  <div
                    key={photo.id}
                    className={`relative group/photo rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 shadow-soft hover:shadow-dramatic ${
                      isBatchMode ? 'ring-2 ring-transparent hover:ring-gallery-coral' : 'hover:-translate-y-2'
                    } ${
                      isBatchMode && selectedPhotos.has(photo.id)
                        ? 'ring-4 ring-gallery-coral dark:ring-gallery-neon-pink shadow-dramatic'
                        : ''
                    }`}
                    onClick={() => {
                      if (isBatchMode) {
                        togglePhotoSelection(photo.id);
                      } else {
                        onImageClick(memory.id, index);
                      }
                    }}
                  >
                    {/* 图片容器 - 添加悬停效果 */}
                    <div className="img-hover-zoom aspect-square">
                      <img
                        src={photo.url}
                        alt={`记忆图片 ${index + 1}`}
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          isBatchMode && selectedPhotos.has(photo.id)
                            ? 'opacity-100'
                            : isBatchMode
                            ? 'opacity-60 hover:opacity-100'
                            : 'opacity-100'
                        }`}
                        onClick={(e) => {
                          if (isBatchMode) {
                            e.stopPropagation();
                          }
                        }}
                        onLoad={() => {
                          console.log(`✅ [Timeline] 图片加载成功: ${photo.id}`);
                        }}
                        onError={(e) => {
                          console.error(`❌ [Timeline] 图片加载失败: ${photo.id}`, {
                            url: photo.url?.substring(0, 100) + '...',
                            error: e
                          });
                        }}
                      />
                    </div>

                    {/* 批量模式复选框 - 编辑杂志风格 */}
                    {isBatchMode && (
                      <div className="absolute top-3 left-3 z-10">
                        <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-soft ${
                          selectedPhotos.has(photo.id)
                            ? 'bg-gradient-primary border-gallery-coral'
                            : 'bg-white/90 dark:bg-gallery-midnight-light/90 border-gallery-cream-dark dark:border-gallery-midnight-light'
                        }`}>
                          {selectedPhotos.has(photo.id) && (
                            <CheckSquare size={16} className="text-white" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* 非批量模式：悬停显示眼睛图标 - 编辑杂志风格 */}
                    {!isBatchMode && (
                      <div className="absolute inset-0 bg-gradient-to-t from-gallery-deep-teal/70 via-transparent to-transparent opacity-0 group-hover/photo:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                          <Eye className="text-white" size={22} />
                        </div>
                      </div>
                    )}
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
