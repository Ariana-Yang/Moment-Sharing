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
}

// 密码配置接口
interface PasswordConfig {
  id: number;
  viewPassword: string; // 加密后的查看密码
  editPassword: string; // 加密后的编辑密码
  updatedAt: number;
}

// 扩展数据库接口，添加密码配置表
export interface MomentDB extends Dexie {
  memories: Table<Memory>;
  photos: Table<Photo>;
  passwordConfig: Table<PasswordConfig>;
}

// 数据库配置
export const db = new Dexie('momentDB') as MomentDB;

db.version(3).stores({
  memories: 'id, date, createdAt, updatedAt',
  photos: 'id, memoryId, createdAt',
  passwordConfig: 'id'
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