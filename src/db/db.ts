import Dexie, { type Table } from 'dexie';

// 记忆接口
export interface Memory {
  id: string;
  date: string;
  note: string;
  photoIds: string[];
  createdAt: number;
  updatedAt: number;
}

// 图片接口
export interface Photo {
  id: string;
  memoryId: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
  publicUrl?: string; // Supabase存储的压缩图公共URL
  originalPublicUrl?: string; // Supabase存储的原图公共URL
  thumbnailUrl?: string; // 缩略图URL
}

// 密码配置接口
interface PasswordConfig {
  id: number;
  viewPassword: string; // 加密后的查看密码
  editPassword: string; // 加密后的编辑密码
  updatedAt: number;
}

// 分享配置接口
export interface ShareConfig {
  id: number; // 固定为1
  mode: 'unlimited' | 'range'; // 无限制模式 或 区间模式
  startDate?: string; // 区间开始日期 (YYYY-MM-DD)
  endDate?: string; // 区间结束日期 (YYYY-MM-DD)
  createdAt: number;
  updatedAt: number;
}

// 扩展数据库接口，添加密码配置表和分享配置表
export interface MomentDB extends Dexie {
  memories: Table<Memory>;
  photos: Table<Photo>;
  passwordConfig: Table<PasswordConfig>;
  shareConfig: Table<ShareConfig>;
}

// 数据库配置
export const db = new Dexie('momentDB') as MomentDB;

db.version(4).stores({
  memories: 'id, date, createdAt, updatedAt',
  photos: 'id, memoryId, createdAt',
  passwordConfig: 'id',
  shareConfig: 'id'
});

// 简单的加密函数（用于存储密码）
export const encryptPassword = (password: string): string => {
  // 使用简单的Base64编码（实际项目中建议使用更安全的加密方式）
  return btoa(password);
};

// 解密函数
export const decryptPassword = (encryptedPassword: string): string => {
  return atob(encryptedPassword);
};

// 密码验证函数
export const validatePassword = async (password: string, type: 'view' | 'edit'): Promise<boolean> => {
  try {
    const config = await db.passwordConfig.get(1);
    if (!config) return false;
    
    const decryptedPassword = decryptPassword(type === 'view' ? config.viewPassword : config.editPassword);
    return decryptedPassword === password;
  } catch (error) {
    console.error('密码验证失败:', error);
    return false;
  }
};

// 设置密码函数
export const setPassword = async (viewPassword: string, editPassword: string): Promise<void> => {
  try {
    const encryptedViewPassword = encryptPassword(viewPassword);
    const encryptedEditPassword = encryptPassword(editPassword);
    
    await db.passwordConfig.put({
      id: 1,
      viewPassword: encryptedViewPassword,
      editPassword: encryptedEditPassword,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('设置密码失败:', error);
    throw error;
  }
};

// 检查是否已设置密码
export const hasPassword = async (): Promise<boolean> => {
  try {
    const config = await db.passwordConfig.get(1);
    return !!config;
  } catch (error) {
    console.error('检查密码设置失败:', error);
    return false;
  }
};

// 获取分享配置
export const getShareConfig = async (): Promise<ShareConfig | undefined> => {
  try {
    const config = await db.shareConfig.get(1);
    return config;
  } catch (error) {
    console.error('获取分享配置失败:', error);
    return undefined;
  }
};

// 设置分享配置
export const setShareConfig = async (config: Omit<ShareConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    const existingConfig = await db.shareConfig.get(1);
    const now = Date.now();

    await db.shareConfig.put({
      id: 1,
      ...config,
      createdAt: existingConfig?.createdAt || now,
      updatedAt: now
    });
  } catch (error) {
    console.error('设置分享配置失败:', error);
    throw error;
  }
};

// 删除分享配置
export const deleteShareConfig = async (): Promise<void> => {
  try {
    await db.shareConfig.delete(1);
  } catch (error) {
    console.error('删除分享配置失败:', error);
    throw error;
  }
};