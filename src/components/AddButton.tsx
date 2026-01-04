import { Plus } from 'lucide-react';

interface AddButtonProps {
  onAdd: () => void;
}

export const AddButton = ({ onAdd }: AddButtonProps) => {
  return (
    <button
      onClick={onAdd}
      className="fixed bottom-8 right-8 z-50 group"
      title="添加记忆"
    >
      {/* 外圈光晕效果 - 编辑杂志风格 */}
      <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-0 group-hover:opacity-30 group-hover:scale-150 transition-all duration-500 blur-2xl"></div>

      {/* 主按钮 - 编辑杂志风格 */}
      <div className="relative bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded-full w-16 h-16 flex items-center justify-center shadow-dramatic-lg transform transition-all duration-300 hover:scale-115 hover:shadow-dramatic-lg ripple">
        {/* 内圈装饰 */}
        <div className="absolute inset-1.5 rounded-full border-2 border-white/30"></div>

        {/* 图标 */}
        <Plus
          size={28}
          className="relative z-10 transform transition-transform duration-300 group-hover:rotate-90"
          strokeWidth={3}
        />
      </div>

      {/* 提示文字 - 编辑杂志风格 */}
      <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gallery-deep-teal dark:bg-gallery-cream text-gallery-cream dark:text-gallery-deep-teal text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-dramatic transform translate-y-2 group-hover:translate-y-0">
        添加记忆
        {/* 小三角 - 编辑杂志风格 */}
        <div className="absolute top-full right-5 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gallery-deep-teal dark:border-t-gallery-cream"></div>
      </div>
    </button>
  );
};
