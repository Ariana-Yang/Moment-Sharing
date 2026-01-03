import { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { hasPassword, validatePassword, setPassword } from '../db/db';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordValidated: (isEditMode: boolean) => void;
  onPasswordSet: () => void;
}

export const PasswordModal = ({ 
  isOpen, 
  onClose, 
  onPasswordValidated,
  onPasswordSet
}: PasswordModalProps) => {
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPasswordInput] = useState('');
  const [viewPassword, setViewPassword] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [error, setError] = useState('');
  const [isSettingMode, setIsSettingMode] = useState(false);

  // 检查是否是首次设置密码
  useEffect(() => {
    if (isOpen) {
      checkFirstTimeSetup();
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setMode('view');
    setShowPassword(false);
    setPasswordInput('');
    setViewPassword('');
    setEditPassword('');
    setError('');
    setIsSettingMode(false);
  };

  const checkFirstTimeSetup = async () => {
    const hasPwd = await hasPassword();
    setIsFirstTimeSetup(!hasPwd);
  };

  // 处理密码验证
  const handleValidatePassword = async () => {
    setError('');
    
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    try {
      const isValid = await validatePassword(password, mode);
      if (isValid) {
        onPasswordValidated(mode === 'edit');
        onClose();
      } else {
        setError('密码错误');
      }
    } catch (err) {
      setError('密码验证失败');
      console.error(err);
    }
  };

  // 处理首次设置密码
  const handleSetFirstPassword = async () => {
    setError('');
    
    if (!viewPassword.trim() || !editPassword.trim()) {
      setError('请输入查看密码和编辑密码');
      return;
    }

    if (viewPassword.length < 4 || editPassword.length < 4) {
      setError('密码长度不能少于4位');
      return;
    }

    try {
      await setPassword(viewPassword, editPassword);
      onPasswordSet();
      onClose();
    } catch (err) {
      setError('密码设置失败');
      console.error(err);
    }
  };

  // 处理修改密码
  const handleChangePassword = async () => {
    setError('');
    
    if (!password.trim()) {
      setError('请输入当前编辑密码');
      return;
    }

    if (!viewPassword.trim() || !editPassword.trim()) {
      setError('请输入新的查看密码和编辑密码');
      return;
    }

    if (viewPassword.length < 4 || editPassword.length < 4) {
      setError('密码长度不能少于4位');
      return;
    }

    try {
      // 验证当前编辑密码
      const isValid = await validatePassword(password, 'edit');
      if (!isValid) {
        setError('当前编辑密码错误');
        return;
      }

      // 设置新密码
      await setPassword(viewPassword, editPassword);
      setIsSettingMode(false);
      setError('密码修改成功');
    } catch (err) {
      setError('密码修改失败');
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {isFirstTimeSetup ? '设置密码' : isSettingMode ? '修改密码' : '请输入密码'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {/* 首次设置密码 */}
          {isFirstTimeSetup ? (
            <div>
              <h3 className="text-lg font-medium mb-4">欢迎使用 Moment-Sharing</h3>
              <p className="text-gray-600 mb-4">请设置您的查看密码和编辑密码</p>
              
              {/* 查看密码 */}
              <div className="mb-4">
                <label htmlFor="firstViewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  查看密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="firstViewPassword"
                    value={viewPassword}
                    onChange={(e) => setViewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入查看密码（至少4位）"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 编辑密码 */}
              <div className="mb-4">
                <label htmlFor="firstEditPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  编辑密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="firstEditPassword"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入编辑密码（至少4位）"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 错误信息 */}
              {error && (
                <div className="text-red-500 text-sm mb-4">{error}</div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-end">
                <button
                  onClick={handleSetFirstPassword}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          ) : isSettingMode ? (
            /* 修改密码模式 */
            <div>
              {/* 当前编辑密码 */}
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  当前编辑密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="currentPassword"
                    value={password}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入当前编辑密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 新查看密码 */}
              <div className="mb-4">
                <label htmlFor="newViewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  新查看密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newViewPassword"
                    value={viewPassword}
                    onChange={(e) => setViewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入新查看密码（至少4位）"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 新编辑密码 */}
              <div className="mb-4">
                <label htmlFor="newEditPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  新编辑密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newEditPassword"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="输入新编辑密码（至少4位）"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 错误信息 */}
              {error && (
                <div className="text-red-500 text-sm mb-4">{error}</div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsSettingMode(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleChangePassword}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          ) : (
            /* 密码验证模式 */
            <div>
              {/* 密码模式切换 */}
              <div className="mb-4">
                <div className="flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setMode('view')}
                    className={`flex-1 py-2 px-4 text-sm font-medium ${mode === 'view' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    查看模式
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('edit')}
                    className={`flex-1 py-2 px-4 text-sm font-medium ${mode === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    编辑模式
                  </button>
                </div>
              </div>

              {/* 密码输入 */}
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  请输入{mode === 'view' ? '查看' : '编辑'}密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`输入${mode === 'view' ? '查看' : '编辑'}密码`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* 错误信息 */}
              {error && (
                <div className="text-red-500 text-sm mb-4">{error}</div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsSettingMode(true)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  修改密码
                </button>
                <button
                  onClick={handleValidatePassword}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  {mode === 'view' ? '查看' : '编辑'}照片
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
