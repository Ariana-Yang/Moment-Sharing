// 修改App.tsx，添加对已有图片的处理和删除逻辑
import { useState, useCallback } from 'react';
import { useMemories } from './hooks/useMemories';
import { Timeline } from './components/Timeline';
import { AddButton } from './components/AddButton';
import { EditorModal } from './components/EditorModal';
import { ImageViewer } from './components/ImageViewer';
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
  }>>([]);

  // 要删除的记忆ID
  const [memoryIdToDelete, setMemoryIdToDelete] = useState<string>('');

  // 处理添加记忆
  const handleAddClick = useCallback(() => {
    setInitialFiles([]);
    setEditingMemory(undefined);
    setExistingPhotos([]);
    setIsEditorOpen(true);
  }, []);

  // 处理编辑记忆
  const handleEditClick = useCallback(async (memory: Memory) => {
    setEditingMemory(memory);
    setInitialFiles([]);
    // 获取已有图片
    const photos = await getPhotosByMemoryId(memory.id);
    setExistingPhotos(photos);
    setIsEditorOpen(true);
  }, [getPhotosByMemoryId]);

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
    setMemoryIdToDelete(id);
    setIsDeleteConfirmOpen(true);
  }, []);

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
      const photos = await getPhotosByMemoryId(memoryId);
      const photosWithUrls = photos.map(photo => {
        const url = URL.createObjectURL(photo.blob);
        return {
          ...photo,
          url
        };
      });

      setViewerPhotos(photosWithUrls);
      setCurrentPhotoIndex(photoIndex);
      setIsImageViewerOpen(true);
    } catch (err) {
      console.error('加载图片失败:', err);
    }
  }, [getPhotosByMemoryId]);

  // 关闭图片查看器
  const handleCloseImageViewer = useCallback(() => {
    // 清理URL资源
    viewerPhotos.forEach(photo => URL.revokeObjectURL(photo.url));
    setIsImageViewerOpen(false);
    setViewerPhotos([]);
  }, [viewerPhotos]);



  return (
    <div className="min-h-screen bg-gray-50">
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
        />
      </main>

      {/* 添加按钮 */}
      <AddButton onAdd={handleAddClick} />

      {/* 编辑器模态框 */}
      <EditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveMemory}
        initialMemory={editingMemory}
        initialFiles={initialFiles}
        existingPhotos={existingPhotos}
      />

      {/* 图片查看器 */}
      <ImageViewer
        isOpen={isImageViewerOpen}
        onClose={handleCloseImageViewer}
        images={viewerPhotos}
        currentIndex={currentPhotoIndex}
        onIndexChange={setCurrentPhotoIndex}
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
    </div>
  );
}

export default App;