# 数据库迁移说明

## 需要执行的操作

### 1. 在 Supabase 控制台执行以下 SQL

在 Supabase 控制台的 SQL Editor 中执行:

```sql
-- 添加新字段到 photos 表
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS original_storage_path TEXT;
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS original_public_url TEXT;
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS original_file_size BIGINT;
ALTER TABLE photos
  ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- 为 display_order 创建索引以提高排序性能
CREATE INDEX IF NOT EXISTS idx_photos_display_order
  ON photos(memory_id, display_order);

-- 添加注释
COMMENT ON COLUMN photos.original_storage_path IS '原图存储路径';
COMMENT ON COLUMN photos.original_public_url IS '原图公共URL';
COMMENT ON COLUMN photos.original_file_size IS '原图文件大小(字节)';
COMMENT ON COLUMN photos.display_order IS '显示顺序(按上传时间排序)';
```

### 2. 验证迁移

执行以下 SQL 查询验证:

```sql
-- 查看表结构
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'photos'
ORDER BY ordinal_position;
```

应该看到新增的字段:
- `original_storage_path`
- `original_public_url`
- `original_file_size`
- `display_order`

### 3. 注意事项

- ✅ 迁移是向后兼容的,旧数据不会丢失
- ✅ 旧照片的 `display_order` 为 NULL,会按 `created_at` 排序
- ✅ 新上传的照片会有 `display_order` 值
- ⚠️ 建议在非高峰时段执行迁移

### 4. 回滚方案(如需要)

```sql
ALTER TABLE photos
  DROP COLUMN IF EXISTS original_storage_path;
ALTER TABLE photos
  DROP COLUMN IF EXISTS original_public_url;
ALTER TABLE photos
  DROP COLUMN IF EXISTS original_file_size;
ALTER TABLE photos
  DROP COLUMN IF EXISTS display_order;

DROP INDEX IF EXISTS idx_photos_display_order;
```
