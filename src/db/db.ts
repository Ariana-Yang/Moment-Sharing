import Dexie, { type Table } from 'dexie';

// 数据模型定义
export interface Photo {
  id: string;
  memoryId: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

export interface Memory {
  id: string;
  date: string;
  note: string;
  photoIds: string[];
  createdAt: number;
  updatedAt: number;
}

// 数据库配置
export class MomentDB extends Dexie {
  memories!: Table<Memory>;
  photos!: Table<Photo>;

  constructor() {
    super('momentDB');
    
    // 数据库版本和表结构
    this.version(1).stores({
      memories: 'id, date, createdAt, updatedAt',
      photos: 'id, memoryId, createdAt',
    });
    
    // 为memoryId添加索引，优化查询性能
    this.version(2).stores({
      photos: 'id, memoryId, createdAt',
    });
  }
}

// 导出数据库实例
export const db = new MomentDB();