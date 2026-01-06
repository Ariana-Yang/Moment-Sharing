// 修改App.tsx，添加对已有图片的处理和删除逻辑
import { useState, useCallback, useEffect } from 'react';
import { useMemories } from './hooks/useMemories';
import { Timeline } from './components/Timeline';
import { AddButton } from './components/AddButton';
import { TimelineSidebar } from './components/TimelineSidebar';
import EditorModal from './components/EditorModal';
import { ImageViewer } from './components/ImageViewer';
import { UploadProgress } from './components/UploadProgress';
import { PasswordModal } from './components/PasswordModal';
import { SettingsModal } from './components/SettingsModal';
import { ShareSettingsModal } from './components/ShareSettingsModal';
import { getShareConfig, type ShareConfig } from './db/db';
import { Settings, Share2, Moon, Sun, Calendar } from 'lucide-react';
import type { Memory } from './db/db';
import { getCurrentUser, checkUserExists } from './services/authService';

// 导入 Supabase 以验证配置（这会触发初始化日志）
import './lib/supabase';

function App() {
  // 使用自定义Hook获取记忆数据
  const {
    memories,
    loading,
    error,
    uploadProgress,
    createMemory,
    updateMemory,
    deleteMemory,
    getPhotosByMemoryId
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

  // 用户状态
  const [hasUserInDb, setHasUserInDb] = useState<boolean | null>(null);

  // 分享配置状态
  const [shareConfig, setShareConfigState] = useState<ShareConfig | null>(null);
  const [filteredMemories, setFilteredMemories] = useState<Memory[]>([]);

  // 时间轴状态
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>();

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

  // 初始化用户（Supabase）
  useEffect(() => {
    const initUser = async () => {
      try {
        console.log('🔐 检查用户状态...');
        const user = getCurrentUser();

        if (!user) {
          console.log('📝 用户未初始化，检查数据库...');
          // 检查数据库中是否已有用户
          const hasUser = await checkUserExists();
          setHasUserInDb(hasUser);

          if (hasUser) {
            console.log('ℹ️ 数据库中已有用户，需要密码验证');
          } else {
            console.log('ℹ️ 系统未初始化，等待用户设置密码');
          }
        } else {
          console.log('✅ 用户已存在:', user.email);
          setHasUserInDb(true); // localStorage有用户，数据库肯定有
        }
      } catch (err) {
        console.error('❌ 用户初始化失败:', err);
      }
    };

    initUser();
  }, []);

  // 检查密码状态
  useEffect(() => {
    const checkPasswordStatus = async () => {
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

  // 根据时间轴选择过滤记忆
  useEffect(() => {
    if (selectedYear !== undefined && selectedMonth !== undefined) {
      const filtered = memories.filter((memory) => {
        const date = new Date(memory.date);
        return date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth;
      });
      setFilteredMemories(filtered);
    } else {
      // 如果没有选择时间轴，使用分享配置过滤
      if (shareConfig) {
        filterMemories(shareConfig);
      } else {
        setFilteredMemories(memories);
      }
    }
  }, [selectedYear, selectedMonth, memories, shareConfig]);

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
      console.log('🖼️ [App] 点击图片, Memory ID:', memoryId, 'Photo Index:', photoIndex);

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

      console.log('  [App] 所有照片数量:', flatPhotos.length);

      // 查找当前点击的图片在全局列表中的索引
      const targetPhoto = await getPhotosByMemoryId(memoryId);
      const targetGlobalIndex = flatPhotos.findIndex(photo => photo.id === targetPhoto[photoIndex].id);

      console.log('  [App] 目标照片索引:', targetGlobalIndex);

      // 为所有图片创建URL - 优先使用publicUrl
      const photosWithUrls = flatPhotos.map((photo, index) => {
        // 优先使用publicUrl，如果没有才从blob创建
        const url = (photo as any).publicUrl || URL.createObjectURL(photo.blob);

        console.log(`  [App] 照片 ${index + 1}:`, {
          id: photo.id,
          hasPublicUrl: !!(photo as any).publicUrl,
          urlType: (photo as any).publicUrl ? 'publicUrl' : 'blob',
          url: url.substring(0, 80) + '...'
        });

        return {
          ...photo,
          url
        };
      });

      setViewerPhotos(photosWithUrls);
      setCurrentPhotoIndex(targetGlobalIndex);
      setIsImageViewerOpen(true);

      console.log('✅ [App] 图片查看器已打开');
    } catch (err) {
      console.error('❌ [App] 加载图片失败:', err);
    }
  }, [getPhotosByMemoryId, memories]);

  // 关闭图片查看器
  const handleCloseImageViewer = useCallback(() => {
    // 清理URL资源 - 只清理从blob创建的URL
    viewerPhotos.forEach(photo => {
      // 如果没有publicUrl，说明是blob创建的URL，需要清理
      if (!(photo as any).publicUrl) {
        URL.revokeObjectURL(photo.url);
      }
    });
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

  // 处理时间轴年月选择
  const handleYearMonthSelect = useCallback((year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    // 在移动端选择后自动关闭侧边栏
    if (window.innerWidth < 1024) {
      setIsTimelineOpen(false);
    }
  }, []);

  // 清除时间轴选择（显示所有）
  const handleClearTimelineSelection = useCallback(() => {
    setSelectedYear(undefined);
    setSelectedMonth(undefined);
  }, []);


  return (
    <div className="min-h-screen bg-gallery-cream dark:bg-gallery-midnight transition-colors duration-500 noise-bg">
      {/* 上传进度条 */}
      {uploadProgress && (
        <UploadProgress
          current={uploadProgress.current}
          total={uploadProgress.total}
          fileName={uploadProgress.fileName}
          stage={uploadProgress.stage}
        />
      )}

      {/* 密码模态框 - 始终显示在最上层 */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        hasUserInDb={hasUserInDb}
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

                  {/* 时间轴按钮 - 只在密码验证通过后显示 */}
                  {isPasswordValidated && (
                    <button
                      onClick={() => setIsTimelineOpen(!isTimelineOpen)}
                      className={`flex items-center space-x-2 px-4 py-2.5 transition-all duration-300 focus-visible-ring font-medium rounded-xl ${
                        isTimelineOpen
                          ? 'bg-gallery-coral text-white dark:bg-gallery-neon-pink shadow-glow-coral'
                          : 'text-gallery-deep-teal dark:text-gallery-cream hover:text-gallery-coral dark:hover:text-gallery-neon-pink hover:bg-gallery-cream-dark dark:hover:bg-gallery-midnight-light'
                      }`}
                      title={isTimelineOpen ? '收起时间轴' : '展开时间轴'}
                    >
                      <Calendar size={18} />
                      <span className="hidden lg:inline">{isTimelineOpen ? '收起' : '时间轴'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* 主内容 */}
          <main className={`max-w-7xl mx-auto px-4 py-10 transition-all duration-500 ${isTimelineOpen ? 'lg:pr-96' : ''}`}>
            {/* 时间轴过滤提示 */}
            {selectedYear !== undefined && selectedMonth !== undefined && (
              <div className="bg-gallery-gold/10 dark:bg-gallery-gold/5 border-l-4 border-gallery-gold text-gallery-deep-teal dark:text-gallery-cream px-6 py-4 rounded-r-xl mb-8 animate-slide-down shadow-soft">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar size={20} className="text-gallery-gold" />
                    <span className="font-semibold">
                      当前筛选：{selectedYear}年 {selectedMonth}月
                    </span>
                    <span className="text-sm text-gallery-teal dark:text-gallery-cream-dark">
                      （共 {filteredMemories.length} 条记忆）
                    </span>
                  </div>
                  <button
                    onClick={handleClearTimelineSelection}
                    className="px-4 py-2 bg-gallery-coral dark:bg-gallery-neon-pink text-white rounded-lg hover:bg-gallery-coral/80 dark:hover:bg-gallery-neon-pink/80 transition-all text-sm font-semibold"
                  >
                    清除筛选
                  </button>
                </div>
              </div>
            )}

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
              // 时间轴选择优先，然后是分享配置过滤
              memories={
                selectedYear !== undefined && selectedMonth !== undefined
                  ? filteredMemories
                  : isEditMode
                  ? memories
                  : filteredMemories
              }
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
        onExport={() => {
          // Supabase版本不支持导出功能
          alert('数据已存储在云端，无需导出');
        }}
        onImport={() => {
          // Supabase版本不支持导入功能
          alert('数据已存储在云端，无需导入');
        }}
        loading={loading}
      />

      {/* 分享设置模态框 */}
      <ShareSettingsModal
        isOpen={isShareSettingsOpen}
        onClose={() => setIsShareSettingsOpen(false)}
        onSave={handleShareConfigSave}
        memories={memories}
      />

      {/* 时间轴侧边栏 - 只在密码验证通过后才显示 */}
      {isPasswordValidated && (
        <TimelineSidebar
          memories={memories}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearMonthSelect={handleYearMonthSelect}
          isOpen={isTimelineOpen}
          onToggle={() => setIsTimelineOpen(!isTimelineOpen)}
        />
      )}
    </div>
  );
}

export default App;