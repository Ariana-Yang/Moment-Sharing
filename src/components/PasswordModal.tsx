import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Lock, Sparkles } from 'lucide-react';
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

    // 新增：检查两个密码是否相同
    if (viewPassword === editPassword) {
      setError('查看密码和编辑密码不能相同，请使用不同的密码');
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

    // 新增：检查两个密码是否相同
    if (viewPassword === editPassword) {
      setError('查看密码和编辑密码不能相同，请使用不同的密码');
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
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* 豪华保险箱风格背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e14] via-[#0F1419] to-[#1a1f2e] animate-pulse-slow"></div>

      {/* 多层装饰性渐变背景 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 顶部金色光晕 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-gallery-gold/10 via-gallery-gold/5 to-transparent blur-3xl animate-float-gentle"></div>

        {/* 底部珊瑚光晕 */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-gallery-coral/8 via-gallery-coral/4 to-transparent blur-3xl animate-float-gentle" style={{animationDelay: '2s'}}></div>

        {/* 右上角霓虹粉光晕 */}
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-gradient-radial from-gallery-neon-pink/8 via-gallery-neon-pink/3 to-transparent blur-3xl animate-float-gentle" style={{animationDelay: '4s'}}></div>

        {/* 流动的光带装饰 */}
        <div className="absolute top-[10%] left-0 w-full h-px bg-gradient-to-r from-transparent via-gallery-gold/30 to-transparent animate-shimmer"></div>
        <div className="absolute top-[30%] left-0 w-full h-px bg-gradient-to-r from-transparent via-gallery-coral/20 to-transparent animate-shimmer" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-[30%] left-0 w-full h-px bg-gradient-to-r from-transparent via-gallery-neon-pink/20 to-transparent animate-shimmer" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-[10%] left-0 w-full h-px bg-gradient-to-r from-transparent via-gallery-gold/30 to-transparent animate-shimmer" style={{animationDelay: '3s'}}></div>

        {/* 宝石装饰点 */}
        <div className="absolute top-[15%] left-[15%] w-2 h-2 bg-gallery-gold rounded-full animate-sparkle"></div>
        <div className="absolute top-[25%] right-[20%] w-1.5 h-1.5 bg-gallery-coral rounded-full animate-sparkle" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-[20%] left-[25%] w-2 h-2 bg-gallery-neon-pink rounded-full animate-sparkle" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-[35%] right-[15%] w-1.5 h-1.5 bg-gallery-gold rounded-full animate-sparkle" style={{animationDelay: '3s'}}></div>

        {/* 对角线装饰线 */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-br from-transparent via-gallery-gold/10 to-transparent transform rotate-12 origin-top-left"></div>
        <div className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-tl from-transparent via-gallery-coral/10 to-transparent transform -rotate-12 origin-bottom-right"></div>
      </div>

      {/* 主卡片 - 豪华保险箱设计 */}
      <div className="relative max-w-md w-full animate-scale-in-luxury">
        {/* 外层金属边框 */}
        <div className="absolute -inset-[1px] bg-gradient-to-br from-gallery-gold/50 via-gallery-coral/30 to-gallery-gold/40 rounded-[2rem] blur-sm opacity-60"></div>

        {/* 内层卡片 */}
        <div className="relative bg-gradient-to-br from-[#1a2028] via-[#151a22] to-[#0f1319] rounded-[1.9rem] overflow-hidden border border-gallery-gold/20 shadow-luxury">
          {/* 顶部金属光泽条 */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-gallery-gold/60 to-transparent"></div>
          <div className="h-[1px] bg-gradient-to-r from-transparent via-gallery-coral/40 to-transparent"></div>

          {/* 顶部装饰线 */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gallery-gold/60 via-gallery-coral/50 to-gallery-gold/60"></div>

          {/* 头部 */}
          <div className="relative flex justify-between items-center p-8 border-b border-white/5">
            <div className="flex items-center space-x-4">
              {/* 豪华锁图标 */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary rounded-2xl blur-lg opacity-40 animate-pulse-slow"></div>
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-gallery-gold/30 to-gallery-coral/30 backdrop-blur-sm flex items-center justify-center border border-gallery-gold/30 shadow-glow-gold">
                  <Lock className="w-7 h-7 text-gallery-gold" strokeWidth={2.5} />
                </div>
                {/* 光泽点 */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gallery-coral rounded-full animate-sparkle"></div>
              </div>

              <div>
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gallery-gold via-gallery-cream to-gallery-gold tracking-tight animate-gradient-x">
                  {isFirstTimeSetup ? '开启记忆之旅' : isSettingMode ? '修改钥匙' : '验证身份'}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <Sparkles className="w-3 h-3 text-gallery-coral" />
                  <p className="text-xs text-gallery-cream-dark/70 uppercase tracking-widest font-semibold">
                    {isFirstTimeSetup ? 'First Setup' : isSettingMode ? 'Change Keys' : 'Verify Access'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 text-gallery-cream-dark hover:text-gallery-coral transition-all duration-300 hover:scale-110 rounded-xl hover:bg-white/5 border border-transparent hover:border-gallery-coral/20"
            >
              <X size={24} />
            </button>
          </div>

          {/* 内容 */}
          <div className="relative p-8">
            {/* 首次设置密码 */}
            {isFirstTimeSetup ? (
              <div>
                <div className="mb-8 text-center">
                  <p className="text-lg text-gallery-cream leading-relaxed">
                    为您的珍贵记忆设置两把独特的钥匙
                  </p>
                  <div className="flex items-center justify-center space-x-3 mt-3">
                    <span className="text-gallery-gold font-semibold text-sm">查看钥匙</span>
                    <div className="w-px h-4 bg-gallery-cream-dark/30"></div>
                    <span className="text-gallery-coral font-semibold text-sm">编辑钥匙</span>
                  </div>
                </div>

                {/* 查看密码 */}
                <div className="mb-5">
                  <label htmlFor="firstViewPassword" className="block text-sm font-bold text-gallery-cream mb-2 tracking-wide uppercase flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-gallery-gold mr-2"></span>
                    查看密码
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-gallery-gold/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="firstViewPassword"
                      value={viewPassword}
                      onChange={(e) => setViewPassword(e.target.value)}
                      className="relative w-full px-5 py-4 pr-12 bg-white/5 border-2 border-gallery-gold/30 rounded-xl text-gallery-cream placeholder-gallery-cream-dark/40 focus:outline-none focus:border-gallery-gold/60 focus:bg-white/10 focus:shadow-glow-gold transition-all duration-300 font-medium"
                      placeholder="输入查看密码（至少4位）"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gallery-cream-dark hover:text-gallery-gold transition-all duration-300 hover:scale-110"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* 编辑密码 */}
                <div className="mb-6">
                  <label htmlFor="firstEditPassword" className="block text-sm font-bold text-gallery-cream mb-2 tracking-wide uppercase flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-gallery-coral mr-2"></span>
                    编辑密码
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-gallery-coral/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="firstEditPassword"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="relative w-full px-5 py-4 pr-12 bg-white/5 border-2 border-gallery-coral/30 rounded-xl text-gallery-cream placeholder-gallery-cream-dark/40 focus:outline-none focus:border-gallery-coral/60 focus:bg-white/10 focus:shadow-glow-coral transition-all duration-300 font-medium"
                      placeholder="输入编辑密码（至少4位）"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gallery-cream-dark hover:text-gallery-coral transition-all duration-300 hover:scale-110"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* 错误信息 */}
                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-400 rounded-r-xl font-medium animate-shake flex items-center">
                    <span className="mr-2">⚠️</span>
                    {error}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSetFirstPassword}
                    className="group relative px-8 py-4 bg-gradient-primary text-white rounded-xl overflow-hidden transition-all duration-300 font-bold shadow-glow-coral hover:shadow-glow-coral-lg hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="relative flex items-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      保存并开始
                    </span>
                  </button>
                </div>
              </div>
            ) : isSettingMode ? (
              /* 修改密码模式 */
              <div>
                {/* 当前编辑密码 */}
                <div className="mb-5">
                  <label htmlFor="currentPassword" className="block text-sm font-bold text-gallery-cream mb-2 tracking-wide uppercase flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-gallery-gold mr-2"></span>
                    当前编辑密码
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-gallery-gold/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="currentPassword"
                      value={password}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="relative w-full px-5 py-4 pr-12 bg-white/5 border-2 border-gallery-gold/30 rounded-xl text-gallery-cream placeholder-gallery-cream-dark/40 focus:outline-none focus:border-gallery-gold/60 focus:bg-white/10 focus:shadow-glow-gold transition-all duration-300 font-medium"
                      placeholder="输入当前编辑密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gallery-cream-dark hover:text-gallery-gold transition-all duration-300 hover:scale-110"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* 新查看密码 */}
                <div className="mb-5">
                  <label htmlFor="newViewPassword" className="block text-sm font-bold text-gallery-cream mb-2 tracking-wide uppercase flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-gallery-gold mr-2"></span>
                    新查看密码
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-gallery-gold/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="newViewPassword"
                      value={viewPassword}
                      onChange={(e) => setViewPassword(e.target.value)}
                      className="relative w-full px-5 py-4 pr-12 bg-white/5 border-2 border-gallery-gold/30 rounded-xl text-gallery-cream placeholder-gallery-cream-dark/40 focus:outline-none focus:border-gallery-gold/60 focus:bg-white/10 focus:shadow-glow-gold transition-all duration-300 font-medium"
                      placeholder="输入新查看密码（至少4位）"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gallery-cream-dark hover:text-gallery-gold transition-all duration-300 hover:scale-110"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* 新编辑密码 */}
                <div className="mb-6">
                  <label htmlFor="newEditPassword" className="block text-sm font-bold text-gallery-cream mb-2 tracking-wide uppercase flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-gallery-coral mr-2"></span>
                    新编辑密码
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-gallery-coral/20 to-transparent rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="newEditPassword"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="relative w-full px-5 py-4 pr-12 bg-white/5 border-2 border-gallery-coral/30 rounded-xl text-gallery-cream placeholder-gallery-cream-dark/40 focus:outline-none focus:border-gallery-coral/60 focus:bg-white/10 focus:shadow-glow-coral transition-all duration-300 font-medium"
                      placeholder="输入新编辑密码（至少4位）"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gallery-cream-dark hover:text-gallery-coral transition-all duration-300 hover:scale-110"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* 错误信息 */}
                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-400 rounded-r-xl font-medium animate-shake flex items-center">
                    <span className="mr-2">⚠️</span>
                    {error}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsSettingMode(false)}
                    className="px-6 py-3 border-2 border-gallery-cream-dark/30 text-gallery-cream rounded-xl hover:bg-white/5 transition-all duration-300 font-semibold"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleChangePassword}
                    className="group relative px-8 py-3 bg-gradient-primary text-white rounded-xl overflow-hidden transition-all duration-300 font-bold shadow-glow-coral hover:shadow-glow-coral-lg hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="relative flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      保存修改
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* 密码验证模式 */
              <div>
                {/* 密码模式切换 */}
                <div className="mb-8">
                  <div className="flex rounded-2xl p-1.5 bg-white/5 border border-gallery-cream-dark/20 shadow-soft backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setMode('view')}
                      className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-300 relative overflow-hidden ${
                        mode === 'view'
                          ? 'text-white'
                          : 'text-gallery-cream-dark hover:text-gallery-cream'
                      }`}
                    >
                      {mode === 'view' && (
                        <div className="absolute inset-0 bg-gradient-primary shadow-glow-gold"></div>
                      )}
                      <span className="relative flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-gallery-gold mr-2"></span>
                        查看模式
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('edit')}
                      className={`flex-1 py-3 px-4 text-sm font-bold rounded-xl transition-all duration-300 relative overflow-hidden ${
                        mode === 'edit'
                          ? 'text-white'
                          : 'text-gallery-cream-dark hover:text-gallery-cream'
                      }`}
                    >
                      {mode === 'edit' && (
                        <div className="absolute inset-0 bg-gradient-primary shadow-glow-coral"></div>
                      )}
                      <span className="relative flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-gallery-coral mr-2"></span>
                        编辑模式
                      </span>
                    </button>
                  </div>
                </div>

                {/* 密码输入 */}
                <div className="mb-6">
                  <label htmlFor="password" className="block text-sm font-bold text-gallery-cream mb-2 tracking-wide uppercase flex items-center">
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${mode === 'view' ? 'bg-gallery-gold' : 'bg-gallery-coral'}`}></span>
                    请输入{mode === 'view' ? '查看' : '编辑'}密码
                  </label>
                  <div className="relative group">
                    <div className={`absolute inset-0 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                      mode === 'view' ? 'bg-gradient-to-r from-gallery-gold/20 to-transparent' : 'bg-gradient-to-r from-gallery-coral/20 to-transparent'
                    }`}></div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className={`relative w-full px-5 py-4 pr-12 bg-white/5 border-2 rounded-xl text-gallery-cream placeholder-gallery-cream-dark/40 focus:outline-none focus:bg-white/10 transition-all duration-300 font-medium text-lg ${
                        mode === 'view'
                          ? 'border-gallery-gold/30 focus:border-gallery-gold/60 focus:shadow-glow-gold'
                          : 'border-gallery-coral/30 focus:border-gallery-coral/60 focus:shadow-glow-coral'
                      }`}
                      placeholder={`输入${mode === 'view' ? '查看' : '编辑'}密码`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleValidatePassword();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 hover:scale-110 ${
                        mode === 'view'
                          ? 'text-gallery-cream-dark hover:text-gallery-gold'
                          : 'text-gallery-cream-dark hover:text-gallery-coral'
                      }`}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* 错误信息 */}
                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-400 rounded-r-xl font-medium animate-shake flex items-center">
                    <span className="mr-2">⚠️</span>
                    {error}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setIsSettingMode(true)}
                    className="px-5 py-3 text-gallery-cream-dark hover:text-gallery-cream transition-all duration-300 font-medium flex items-center space-x-2 hover:bg-white/5 rounded-xl"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>修改密码</span>
                  </button>
                  <button
                    onClick={handleValidatePassword}
                    className={`group relative px-8 py-4 bg-gradient-primary text-white rounded-xl overflow-hidden transition-all duration-300 font-bold hover:scale-105 ${
                      mode === 'view' ? 'shadow-glow-gold hover:shadow-glow-gold-lg' : 'shadow-glow-coral hover:shadow-glow-coral-lg'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span className="relative flex items-center">
                      <Lock className="w-5 h-5 mr-2" />
                      {mode === 'view' ? '浏览回忆' : '管理记忆'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 底部装饰线 */}
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gallery-coral/30 to-transparent"></div>
          <div className="absolute bottom-[1px] left-0 w-full h-px bg-gradient-to-r from-transparent via-gallery-gold/20 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};
