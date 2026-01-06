/**
 * Supabase 客户端初始化和配置
 *
 * 提供：
 * - supabase: Supabase客户端实例
 * - 数据库操作
 * - 认证功能
 * - 文件存储
 */

import { createClient } from '@supabase/supabase-js';

// Supabase 环境配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 验证必需的环境变量
if (!supabaseUrl) {
  console.error('❌ Supabase URL is missing. Please check your .env.local file.');
}

if (!supabaseAnonKey) {
  console.error('❌ Supabase Anon Key is missing. Please check your .env.local file.');
}

// 初始化 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 使用 localStorage 持久化会话
    storage: window.localStorage,
    // 自动刷新token
    autoRefreshToken: true,
    // 检测会话变化
    detectSessionInUrl: true,
    // 保持会话
    persistSession: true,
  },
});

// 调试日志：验证初始化
if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Supabase client initialized successfully');
  console.log('📋 Project URL:', supabaseUrl);
  console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
} else {
  console.error('❌ Supabase client initialization failed');
}

/**
 * 数据库表名常量
 */
export const TABLES = {
  USERS: 'users',
  MEMORIES: 'memories',
  PHOTOS: 'photos',
  SHARE_SETTINGS: 'share_settings',
} as const;

/**
 * 存储桶名常量
 */
export const BUCKETS = {
  PHOTOS: 'photos',
} as const;

/**
 * Supabase 服务状态检查
 */
export const isSupabaseReady = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey;
};

/**
 * 获取当前用户
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('获取用户失败:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('获取用户异常:', error);
    return null;
  }
};

/**
 * 获取当前会话
 */
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('获取会话失败:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('获取会话异常:', error);
    return null;
  }
};

/**
 * 检查是否已登录
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return !!user;
};

/**
 * 登出
 */
export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('登出失败:', error);
      throw error;
    }

    console.log('用户已登出');
  } catch (error) {
    console.error('登出异常:', error);
    throw error;
  }
};

/**
 * 监听认证状态变化
 */
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

export default supabase;
