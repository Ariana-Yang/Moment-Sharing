# 清空现有数据 - 使用新功能

## 🎯 为什么要清空?

新功能需要新的数据库字段:
- `original_storage_path` - 原图路径
- `original_public_url` - 原图URL
- `original_file_size` - 原图大小
- `display_order` - 显示顺序

**旧照片没有这些字段,会导致:**
- ❌ 无法下载原图
- ❌ 排序可能混乱
- ❌ 功能不完整

---

## 📋 清空步骤

### 方法 1: 通过 Supabase 控制台(推荐)

#### 1. 删除所有照片记录

在 Supabase SQL Editor 执行:

```sql
-- 删除所有照片记录
DELETE FROM photos;

-- 重置序列(如果需要)
TRUNCATE TABLE photos RESTART IDENTITY CASCADE;

-- 验证
SELECT COUNT(*) FROM photos;
-- 应该返回 0
```

#### 2. 清空存储桶

**方式 A: 在 Supabase 控制台**
1. 左侧菜单点击 **Storage**
2. 选择 `photos` 桶
3. 点击桶名旁边的三个点
4. 选择 **Empty bucket**
5. 确认删除

**方式 B: 使用 SQL**

```sql
-- 注意: 这个操作可能需要一点时间
-- 因为需要逐个删除文件

-- 如果文件不多,可以在控制台手动删除
-- 如果文件很多,联系 Supabase 支持
```

#### 3. (可选)删除所有记忆

```sql
-- 如果也想清空记忆记录
DELETE FROM memories;
TRUNCATE TABLE memories RESTART IDENTITY CASCADE;

-- 验证
SELECT COUNT(*) FROM memories;
-- 应该返回 0
```

---

### 方法 2: 重建项目(最干净)

如果想完全重新开始:

1. **在 Supabase 创建新项目**
   - 登录 https://supabase.com
   - 点击 **New Project**
   - 选择组织和区域
   - 设置密码
   - 等待初始化(约 2 分钟)

2. **执行初始化 SQL**
   ```sql
   -- 创建用户表
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     email TEXT UNIQUE,
     username TEXT,
     view_password_hash TEXT,
     edit_password_hash TEXT,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- 创建记忆表
   CREATE TABLE memories (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     date TEXT NOT NULL,
     note TEXT,
     photo_count INTEGER DEFAULT 0,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- 创建照片表(带新字段)
   CREATE TABLE photos (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     storage_path TEXT NOT NULL,
     original_storage_path TEXT,
     public_url TEXT NOT NULL,
     original_public_url TEXT,
     thumbnail_url TEXT,
     mime_type TEXT,
     file_size BIGINT,
     original_file_size BIGINT,
     width INTEGER,
     height INTEGER,
     display_order INTEGER,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- 创建索引
   CREATE INDEX idx_memories_date ON memories(date DESC);
   CREATE INDEX idx_photos_memory ON photos(memory_id);
   CREATE INDEX idx_photos_display_order ON photos(memory_id, display_order);
   ```

3. **更新环境变量**
   - 复制新的 `VITE_SUPABASE_URL`
   - 复制新的 `VITE_SUPABASE_ANON_KEY`
   - 在 Zeabur 环境变量中更新

---

## ✅ 验证清空成功

执行以下 SQL 验证:

```sql
-- 检查表是否为空
SELECT 'memories' as table_name, COUNT(*) as count FROM memories
UNION ALL
SELECT 'photos', COUNT(*) FROM photos;

-- 应该返回:
-- memories | 0
-- photos   | 0
```

---

## 🎉 清空后就可以直接使用了!

**不需要数据库迁移**,新代码会自动:
- ✅ 上传双版本(原图+压缩图)
- ✅ 设置 display_order
- ✅ 并发上传
- ✅ 正确排序

直接上传新照片即可!
