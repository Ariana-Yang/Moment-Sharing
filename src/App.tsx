// 修改App.tsx，添加对已有图片的处理和删除逻辑
import { useState, useCallback, useEffect } from 'react';
import { useMemories } from './hooks/useMemories';
import { Timeline } from './components/Timeline';
import { AddButton } from './components/AddButton';
import { EditorModal } from './components/EditorModal';
import { ImageViewer } from './components/ImageViewer';
import { PasswordModal } from './components/PasswordModal';
import { hasPassword } from './db/db';
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
    getPhotosByMemoryId
  } = useMemories();

  // 密码验证状态
  const [isPasswordValidated, setIsPasswordValidated] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // 模态框状态
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

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



  return (
    <div className="min-h-screen bg-gray-50">
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
          {/* 顶部导航 */}
          <header className="bg-white shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-800">Moment-Sharing</h1>
            </div>
          </header>

          {/* 主内容 */}
          <main className="max-w-4xl mx-auto px-4 py-8">
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            {/* 时间轴组件 */}
            <Timeline
              memories={memories}
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

          {/* 删除确认对话框 */}
          {isDeleteConfirmOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">确认删除</h3>
                  <p className="text-gray-600 mb-4">
                    您确定要删除这条记忆吗？此操作不可恢复，相关的所有图片也将被删除。
                  </p>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
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
    </div>
  );
}

export default App;