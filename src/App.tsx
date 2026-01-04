// 修改App.tsx，添加对已有图片的处理和删除逻辑
import { useState, useCallback, useEffect } from 'react';
import { useMemories } from './hooks/useMemories';
import { Timeline } from './components/Timeline';
import { AddButton } from './components/AddButton';
import EditorModal from './components/EditorModal';
import { ImageViewer } from './components/ImageViewer';
import { PasswordModal } from './components/PasswordModal';
import { SettingsModal } from './components/SettingsModal';
import { ShareSettingsModal } from './components/ShareSettingsModal';
import { hasPassword, getShareConfig, type ShareConfig } from './db/db';
import { Settings, Share2, Moon, Sun } from 'lucide-react';
import type { Memory } from './db/db';

function App() {
  // 使用自定义Hook获取记忆数据
  const {
    memories,
    loading,
    error,
    createMemory,
    updateMemory,
    deleteMemory,
    getPhotosByMemoryId,
    exportData,
    importData
  } = useMemories();

  // 深色模式状态
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 从localStorage读取用户偏好
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // 密码验证状态
  const [isPasswordValidated, setIsPasswordValidated] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // 模态框状态
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareSettingsOpen, setIsShareSettingsOpen] = useState(false);

  // 分享配置状态
  const [shareConfig, setShareConfigState] = useState<ShareConfig | null>(null);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);

  // 编辑状态
  const [editingMemory, setEditingMemory] = useState<Memory | undefined>();
  const [initialFiles, setInitialFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<Array<{
    id: string;
    blob: Blob;
    mimeType: string;
    createdAt: number;
  }>>([]);

  // 图片查看器状态
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [viewerPhotos, setViewerPhotos] = useState<Array<{
    id: string;
    blob: Blob;
    mimeType: string;
    createdAt: number;
    url: string;
    memoryId: string;
    memoryDate: string;
    memoryNote: string;
  }>>([]);

  // 要删除的记忆ID
  const [memoryIdToDelete, setMemoryIdToDelete] = useState<string>('');

  // 切换深色模式
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev: boolean) => {
      const newValue = !prev;
      // 保存到localStorage
      localStorage.setItem('darkMode', JSON.stringify(newValue));
      // 切换html的class
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newValue;
    });
  }, []);

  // 初始化深色模式
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 检查密码状态
  useEffect(() => {
    const checkPasswordStatus = async () => {
      await hasPassword(); // 调用hasPassword检查是否已设置密码
      // 无论是否已设置密码，都显示密码模态框
      // 如果未设置密码，模态框会显示设置密码界面
      setIsPasswordModalOpen(true);
    };
    checkPasswordStatus();
  }, []);

  // 加载分享配置并过滤记忆
  useEffect(() => {
    const loadShareConfig = async () => {
      const config = await getShareConfig();
      setShareConfigState(config || null);

      if (config) {
        filterMemories(config);
      } else {
        setFilteredMemories(memories);
      }
    };
    loadShareConfig();
  }, [memories]);

  // 处理密码验证
  const handlePasswordValidated = useCallback((isEditMode: boolean) => {
    setIsPasswordValidated(true);
    setIsEditMode(isEditMode);
    setIsPasswordModalOpen(false);
  }, []);

  // 处理密码设置
  const handlePasswordSet = useCallback(() => {
    setIsPasswordValidated(true);
    setIsEditMode(true);
    setIsPasswordModalOpen(false);
  }, []);

  // 处理添加记忆
  const handleAddClick = useCallback(() => {
    if (!isPasswordValidated || !isEditMode) {
      setIsPasswordModalOpen(true);
      return;
    }
    setInitialFiles([]);
    setEditingMemory(undefined);
    setExistingPhotos([]);
    setIsEditorOpen(true);
  }, [isPasswordValidated, isEditMode]);

  // 处理编辑记忆
  const handleEditClick = useCallback(async (memory: Memory) => {
    if (!isPasswordValidated || !isEditMode) {
      setIsPasswordModalOpen(true);
      return;
    }
    setEditingMemory(memory);
    setInitialFiles([]);
    // 获取已有图片
    const photos = await getPhotosByMemoryId(memory.id);
    setExistingPhotos(photos);
    setIsEditorOpen(true);
  }, [getPhotosByMemoryId, isPasswordValidated, isEditMode]);

  // 处理保存记忆
  const handleSaveMemory = useCallback(async (date: string, note: string, files: File[], removedPhotoIds: string[] = []) => {
    try {
      if (editingMemory) {
        // 更新记忆
        await updateMemory(editingMemory.id, date, note, files, removedPhotoIds);
      } else {
        // 创建新记忆
        await createMemory(date, note, files);
      }
    } catch (err) {
      console.error('保存记忆失败:', err);
    }
  }, [editingMemory, createMemory, updateMemory]);

  // 处理删除记忆
  const handleDeleteClick = useCallback((id: string) => {
    if (!isPasswordValidated || !isEditMode) {
      setIsPasswordModalOpen(true);
      return;
    }
    setMemoryIdToDelete(id);
    setIsDeleteConfirmOpen(true);
  }, [isPasswordValidated, isEditMode]);

  // 确认删除记忆
  const handleConfirmDelete = useCallback(async () => {
    try {
      await deleteMemory(memoryIdToDelete);
    } catch (err) {
      console.error('删除记忆失败:', err);
    } finally {
      setIsDeleteConfirmOpen(false);
      setMemoryIdToDelete('');
    }
  }, [memoryIdToDelete, deleteMemory]);

  // 处理图片点击
  const handleImageClick = useCallback(async (memoryId: string, photoIndex: number) => {
    try {
      // 创建全局图片列表，包含所有记忆的图片
      const allPhotos = await Promise.all(
        memories.map(async (memory) => {
          const photos = await getPhotosByMemoryId(memory.id);
          return photos.map(photo => ({
            ...photo,
            memoryId: memory.id,
            memoryDate: memory.date,
            memoryNote: memory.note
          }));
        })
      );
      
      // 扁平化为一维数组并按创建时间排序
      const flatPhotos = allPhotos.flat().sort((a, b) => a.createdAt - b.createdAt);
      
      // 查找当前点击的图片在全局列表中的索引
      const targetPhoto = await getPhotosByMemoryId(memoryId);
      const targetGlobalIndex = flatPhotos.findIndex(photo => photo.id === targetPhoto[photoIndex].id);
      
      // 为所有图片创建URL
      const photosWithUrls = flatPhotos.map(photo => ({
        ...photo,
        url: URL.createObjectURL(photo.blob)
      }));

      setViewerPhotos(photosWithUrls);
      setCurrentPhotoIndex(targetGlobalIndex);
      setIsImageViewerOpen(true);
    } catch (err) {
      console.error('加载图片失败:', err);
    }
  }, [getPhotosByMemoryId, memories]);

  // 关闭图片查看器
  const handleCloseImageViewer = useCallback(() => {
    // 清理URL资源
    viewerPhotos.forEach(photo => URL.revokeObjectURL(photo.url));
    setIsImageViewerOpen(false);
    setViewerPhotos([]);
  }, [viewerPhotos]);

  // 根据分享配置过滤记忆
  const filterMemories = useCallback((config: ShareConfig) => {
    if (config.mode === 'unlimited') {
      // 无限制模式：显示所有记忆
      setFilteredMemories(memories);
    } else if (config.mode === 'range' && config.startDate && config.endDate) {
      // 区间模式：只显示指定时间段内的记忆
      const startDate = new Date(config.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(config.endDate);
      endDate.setHours(23, 59, 59, 999);

      const filtered = memories.filter(memory => {
        const memoryDate = new Date(memory.date);
        return memoryDate >= startDate && memoryDate <= endDate;
      });

      setFilteredMemories(filtered);
    } else {
      setFilteredMemories(memories);
    }
  }, [memories]);

  // 处理分享配置保存
  const handleShareConfigSave = useCallback((config: ShareConfig) => {
    setShareConfigState(config);
    filterMemories(config);
  }, [filterMemories]);



  return (
    <div className="min-h-screen bg-gallery-cream dark:bg-gallery-midnight transition-colors duration-500 noise-bg">
      {/* 密码模态框 - 始终显示在最上层 */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          // 如果已经验证密码，允许关闭模态框
          // 否则不允许关闭，重新显示模态框
          if (isPasswordValidated) {
            setIsPasswordModalOpen(false);
          }
        }}
        onPasswordValidated={handlePasswordValidated}
        onPasswordSet={handlePasswordSet}
      />

      {/* 只有在密码验证通过后才显示内容 */}
      {isPasswordValidated && (
        <>
          {/* 顶部导航 - 编辑杂志风格 */}
          <header className="sticky top-0 z-40 glass dark:glass-dark shadow-soft animate-slide-down">
            <div className="max-w-6xl mx-auto px-4 py-5">
              <div className="flex justify-between items-center">
                {/* Logo - 戏剧化设计 */}
                <div className="flex items-center space-x-3 group">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-dramatic">
                      <span className="text-white font-black text-xl">M</span>
                    </div>
                    {/* 装饰性圆点 */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gallery-coral rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-2xl font-black text-gallery-deep-teal dark:text-gallery-cream tracking-tight">
                      Moments
                    </h1>
                    <span className="text-xs text-gallery-teal dark:text-gallery-cream-dark font-medium tracking-widest uppercase">
                      Gallery
                    </span>
                  </div>
                </div>

                {/* 右侧按钮组 - 编辑杂志风格 */}
                <div className="flex items-center space-x-3">
                  {/* 深色模式切换按钮 */}
                  <button
                    onClick={toggleDarkMode}
                    className="p-2.5 text-gallery-deep-teal dark:text-gallery-cream hover:text-gallery-coral dark:hover:text-gallery-neon-pink hover:bg-gallery-cream-dark dark:hover:bg-gallery-midnight-light rounded-xl transition-all duration-300 focus-visible-ring"
                    title={isDarkMode ? '切换到浅色模式' : '切换到深色模式'}
                  >
                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </button>

                  {/* 分享设置按钮 - 只在编辑模式下显示 */}
                  {isEditMode && (
                    <button
                      onClick={() => setIsShareSettingsOpen(true)}
                      className="flex items-center space-x-2 px-4 py-2.5 text-gallery-deep-teal dark:text-gallery-cream hover:text-gallery-coral dark:hover:text-gallery-neon-pink hover:bg-gallery-cream-dark dark:hover:bg-gallery-midnight-light rounded-xl transition-all duration-300 focus-visible-ring font-medium"
                      title="查看模式设置"
                    >
                      <Share2 size={18} />
                      <span className="hidden sm:inline">查看</span>
                    </button>
                  )}

                  {/* 设置按钮 */}
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2.5 text-gallery-deep-teal dark:text-gallery-cream hover:text-gallery-coral dark:hover:text-gallery-neon-pink hover:bg-gallery-cream-dark dark:hover:bg-gallery-midnight-light rounded-xl transition-all duration-300 focus-visible-ring font-medium"
                    title="设置"
                  >
                    <Settings size={18} />
                    <span className="hidden sm:inline">设置</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* 主内容 */}
          <main className="max-w-6xl mx-auto px-4 py-10">
            {/* 错误提示 - 编辑杂志风格 */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-gallery-coral dark:border-gallery-neon-pink text-gallery-deep-teal dark:text-gallery-cream px-6 py-4 rounded-r-xl mb-8 animate-slide-down shadow-soft">
                <div className="flex items-center">
                  <span className="font-semibold text-lg">{error}</span>
                </div>
              </div>
            )}

            {/* 时间轴组件 */}
            <Timeline
              // 编辑模式下显示所有记忆，查看模式下根据分享配置过滤
              memories={isEditMode ? memories : filteredMemories}
              loading={loading}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onImageClick={handleImageClick}
              getPhotosByMemoryId={getPhotosByMemoryId}
              isEditMode={isEditMode}
            />
          </main>

          {/* 添加按钮 - 只在编辑模式下显示 */}
          {isEditMode && <AddButton onAdd={handleAddClick} />}

          {/* 编辑器模态框 */}
          <EditorModal
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            onSave={handleSaveMemory}
            initialMemory={editingMemory}
            initialFiles={initialFiles}
            existingPhotos={existingPhotos}
          />

          {/* 删除确认对话框 - 编辑杂志风格 */}
          {isDeleteConfirmOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white dark:bg-gallery-midnight-light rounded-2xl shadow-dramatic-lg max-w-md w-full animate-scale-in">
                <div className="p-8">
                  <h3 className="text-2xl font-black text-gallery-deep-teal dark:text-gallery-cream mb-3">确认删除</h3>
                  <p className="text-gallery-teal dark:text-gallery-cream-dark mb-8 leading-relaxed">
                    您确定要删除这条记忆吗？此操作不可恢复，相关的所有图片也将被删除。
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      className="px-6 py-3 border-2 border-gallery-cream-dark dark:border-gallery-midnight rounded-xl text-gallery-deep-teal dark:text-gallery-cream hover:bg-gallery-cream-dark/10 dark:hover:bg-gallery-midnight/50 transition-all font-semibold"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="px-6 py-3 bg-gradient-primary text-white rounded-xl hover:bg-gradient-primary-hover transition-all font-semibold shadow-dramatic hover:shadow-dramatic-lg transform hover:scale-105"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 图片查看器 - 始终渲染，根据isOpen状态决定是否显示 */}
      <ImageViewer
        isOpen={isImageViewerOpen}
        onClose={handleCloseImageViewer}
        images={viewerPhotos}
        currentIndex={currentPhotoIndex}
        onIndexChange={setCurrentPhotoIndex}
      />

      {/* 设置模态框 */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onExport={exportData}
        onImport={importData}
        loading={loading}
      />

      {/* 分享设置模态框 */}
      <ShareSettingsModal
        isOpen={isShareSettingsOpen}
        onClose={() => setIsShareSettingsOpen(false)}
        onSave={handleShareConfigSave}
        memories={memories}
      />
    </div>
  );
}

export default App;