-- =====================================================
-- Moment-Sharing 完整数据库迁移脚本
-- =====================================================
-- 执行此脚本以添加所有缺失的字段
-- 在 Supabase 控制台的 SQL Editor 中执行
-- =====================================================

-- 1. 添加 original_storage_path 字段 (原图存储路径)
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS original_storage_path TEXT;

-- 2. 添加 original_public_url 字段 (原图公共URL)
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS original_public_url TEXT;

-- 3. 添加 original_file_size 字段 (原图文件大小)
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS original_file_size BIGINT;

-- 4. 添加 display_order 字段 (显示顺序)
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- 5. 添加 thumbnail_url 字段 (缩略图URL，如果还没有的话)
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 6. 创建索引以提高排序性能
CREATE INDEX IF NOT EXISTS idx_photos_display_order
  ON photos(memory_id, display_order);

-- 7. 添加字段注释
COMMENT ON COLUMN photos.original_storage_path IS '原图存储路径';
COMMENT ON COLUMN photos.original_public_url IS '原图公共URL';
COMMENT ON COLUMN photos.original_file_size IS '原图文件大小(字节)';
COMMENT ON COLUMN photos.display_order IS '显示顺序(按上传时间排序)';
COMMENT ON COLUMN photos.thumbnail_url IS '缩略图URL';

-- =====================================================
-- 验证迁移
-- =====================================================

-- 查看表结构，验证所有字段已添加
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'photos'
ORDER BY ordinal_position;

-- 应该看到以下字段：
-- - id
-- - memory_id
-- - user_id
-- - storage_path
-- - public_url
-- - mime_type
-- - file_size
-- - width
-- - height
-- - created_at
-- - original_storage_path      ← 新增
-- - original_public_url        ← 新增
-- - original_file_size         ← 新增
-- - display_order              ← 新增
-- - thumbnail_url              ← 新增

-- =====================================================
-- 迁移完成
-- =====================================================
