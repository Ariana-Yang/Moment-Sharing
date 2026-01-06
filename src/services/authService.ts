/**
 * 认证服务
 *
 * 处理用户认证和双密码系统（查看密码 + 编辑密码）
 * 注意：此服务不使用Supabase Auth，仅使用Supabase Database
 */

import { supabase, TABLES } from '@/lib/supabase';

/**
 * 用户信息类型
 */
export interface User {
  id: string;
  email: string;
  username?: string;
  view_password_hash: string;
  edit_password_hash: string;
  created_at: string;
  updated_at: string;
}

/**
 * 密码验证结果
 */
export interface PasswordValidationResult {
  isValid: boolean;
  mode: 'view' | 'edit' | null;
  user?: User;
}

/**
 * 生成UUID
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * 密码哈希（使用SHA-256）
 */
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * 验证密码
 */
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

/**
 * 用户注册/初始化
 *
 * 创建用户记录并设置双密码
 */
export const registerUser = async (
  email: string,
  viewPassword: string,
  editPassword: string
): Promise<User> => {
  try {
    console.log('📝 注册用户...');

    // 1. 检查是否已有用户（单用户系统）
    const { data: existingUsers, error: checkError } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ 检查用户失败:', checkError);
      throw checkError;
    }

    if (existingUsers && existingUsers.length > 0) {
      throw new Error('系统已有用户，请先登录');
    }

    // 2. 生成新的用户ID
    const userId = generateUUID();
    console.log('✅ 生成用户ID:', userId);

    // 3. 哈希密码
    const viewPasswordHash = await hashPassword(viewPassword);
    const editPasswordHash = await hashPassword(editPassword);

    // 4. 创建用户记录
    const { data: newUser, error: createError } = await supabase
      .from(TABLES.USERS)
      .insert({
        id: userId,
        email,
        view_password_hash: viewPasswordHash,
        edit_password_hash: editPasswordHash,
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ 创建用户失败:', createError);
      throw createError;
    }

    // 5. 保存到 localStorage
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('authMode', 'view');

    console.log('✅ 用户注册成功');
    return newUser;
  } catch (error) {
    console.error('❌ 注册失败:', error);
    throw error;
  }
};

/**
 * 用户登录（验证查看密码）
 */
export const loginUser = async (
  email: string,
  viewPassword: string
): Promise<PasswordValidationResult> => {
  try {
    console.log('🔐 用户登录...');

    // 1. 查询用户记录（不依赖Supabase Auth）
    const { data: userData, error: dbError } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('email', email)
      .single();

    if (dbError || !userData) {
      console.log('❌ 用户不存在:', email);
      return {
        isValid: false,
        mode: null,
      };
    }

    // 2. 验证查看密码
    const isValid = await verifyPassword(viewPassword, userData.view_password_hash);

    if (!isValid) {
      console.log('❌ 查看密码错误');
      return {
        isValid: false,
        mode: null,
      };
    }

    // 3. 保存到 localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('authMode', 'view');

    console.log('✅ 登录成功, 模式: view');
    return {
      isValid: true,
      mode: 'view',
      user: userData,
    };
  } catch (error) {
    console.error('❌ 登录失败:', error);
    return {
      isValid: false,
      mode: null,
    };
  }
};

/**
 * 验证编辑密码（切换到编辑模式）
 */
export const validateEditPassword = async (
  editPassword: string
): Promise<PasswordValidationResult> => {
  try {
    // 1. 获取当前用户
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('用户未登录');
    }

    const user: User = JSON.parse(userStr);

    // 2. 验证编辑密码
    const isValid = await verifyPassword(editPassword, user.edit_password_hash);

    if (!isValid) {
      return {
        isValid: false,
        mode: null,
      };
    }

    // 3. 更新认证模式
    localStorage.setItem('authMode', 'edit');

    return {
      isValid: true,
      mode: 'edit',
      user,
    };
  } catch (error) {
    console.error('验证编辑密码失败:', error);
    return {
      isValid: false,
      mode: null,
    };
  }
};

/**
 * 登出
 */
export const logout = async (): Promise<void> => {
  try {
    // 不使用Supabase Auth登出，只清除本地存储
    localStorage.removeItem('user');
    localStorage.removeItem('authMode');
    console.log('✅ 用户已登出');
  } catch (error) {
    console.error('❌ 登出失败:', error);
    throw error;
  }
};

/**
 * 获取当前用户
 */
export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return null;
  }
};

/**
 * 获取当前认证模式
 */
export const getAuthMode = (): 'view' | 'edit' | null => {
  const mode = localStorage.getItem('authMode');
  return (mode === 'view' || mode === 'edit') ? mode : null;
};

/**
 * 检查是否已登录
 */
export const isAuthenticated = (): boolean => {
  return !!getCurrentUser();
};

/**
 * 检查是否为编辑模式
 */
export const isEditMode = (): boolean => {
  return getAuthMode() === 'edit';
};

/**
 * 检查是否为查看模式
 */
export const isViewMode = (): boolean => {
  return getAuthMode() === 'view';
};

/**
 * 检查数据库中是否已有用户
 */
export const checkUserExists = async (): Promise<boolean> => {
  try {
    console.log('🔍 检查数据库中是否有用户...');

    const { data: existingUsers, error: checkError } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ 检查用户失败:', checkError);
      return false;
    }

    const hasUser = existingUsers && existingUsers.length > 0;
    console.log('  数据库中已有用户:', hasUser);

    return hasUser;
  } catch (error) {
    console.error('❌ 检查用户失败:', error);
    return false;
  }
};

/**
 * 初始化用户（首次使用时自动创建）
 */
export const initializeUser = async (): Promise<User | null> => {
  try {
    console.log('🔐 开始初始化用户...');

    // 1. 检查是否已有用户
    const { data: existingUsers, error: checkError } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .limit(1);

    if (checkError) {
      // 如果表不存在或权限错误，返回null让用户手动注册
      console.log('⚠️ 无法查询用户表，可能需要初始化:', checkError);
      return null;
    }

    // 2. 如果有用户，不自动登录（需要密码验证）
    if (existingUsers && existingUsers.length > 0) {
      console.log('ℹ️ 数据库中已有用户，需要密码验证');
      return null; // 返回null，让用户通过密码验证
    }

    // 3. 没有用户，返回null让用户进行首次设置
    console.log('ℹ️ 系统未初始化，等待用户设置密码');
    return null;
  } catch (error) {
    console.error('❌ 初始化用户失败:', error);
    // 不抛出异常，返回null让用户手动注册
    return null;
  }
};

/**
 * 更新密码
 */
export const updatePassword = async (
  currentPassword: string,
  newViewPassword: string,
  newEditPassword: string
): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('用户未登录');
    }

    // 验证当前密码
    const isViewValid = await verifyPassword(currentPassword, user.view_password_hash);
    const isEditValid = await verifyPassword(currentPassword, user.edit_password_hash);

    if (!isViewValid && !isEditValid) {
      throw new Error('当前密码错误');
    }

    // 哈希新密码
    const viewPasswordHash = await hashPassword(newViewPassword);
    const editPasswordHash = await hashPassword(newEditPassword);

    // 更新数据库
    const { error } = await supabase
      .from(TABLES.USERS)
      .update({
        view_password_hash: viewPasswordHash,
        edit_password_hash: editPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }

    // 更新本地存储
    const updatedUser: User = {
      ...user,
      view_password_hash: viewPasswordHash,
      edit_password_hash: editPasswordHash,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    console.log('密码更新成功');
  } catch (error) {
    console.error('更新密码失败:', error);
    throw error;
  }
};

export default {
  registerUser,
  loginUser,
  validateEditPassword,
  logout,
  getCurrentUser,
  getAuthMode,
  isAuthenticated,
  isEditMode,
  isViewMode,
  initializeUser,
  updatePassword,
};
