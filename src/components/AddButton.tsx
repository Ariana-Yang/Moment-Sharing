import { Plus } from 'lucide-react';

interface AddButtonProps {
  onAdd: () => void;
}

export const AddButton = ({ onAdd }: AddButtonProps) => {
  return (
    <button
      onClick={onAdd}
      className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-110 z-50"
      title="添加记忆"
    >
      <Plus size={24} />
    </button>
  );
};
