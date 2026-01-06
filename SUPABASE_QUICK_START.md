# Supabase 快速开始指南

**项目**: Moment-Sharing 照片分享应用
**技术栈**: React + TypeScript + Supabase
**预计完成时间**: 20分钟

---

## 🎯 为什么选择 Supabase？

✅ **配置简单**：比腾讯云TCB简单10倍
✅ **零运维**：不需要配置云函数、数据库、CORS
✅ **自动生成API**：数据库表自动生成RESTful API
✅ **免费额度**：500MB数据库 + 1GB文件存储
✅ **现代化**：基于PostgreSQL，功能强大
✅ **实时同步**：数据变化自动推送

---

## 📋 目录

1. [注册Supabase](#步骤1注册supabase-2分钟)
2. [创建项目](#步骤2创建项目-2分钟)
3. [创建数据库表](#步骤3创建数据库表-5分钟)
4. [配置存储](#步骤4配置存储-3分钟)
5. [获取API密钥](#步骤5获取api密钥-1分钟)
6. [本地配置](#步骤6本地配置-2分钟)
7. [安装依赖](#步骤7安装依赖-1分钟)
8. [测试连接](#步骤8测试连接-2分钟)
9. [数据迁移](#步骤9数据迁移可选-30分钟)

---

## 步骤1：注册Supabase（2分钟）

1. **访问官网**
   打开浏览器，访问 https://supabase.com/

2. **注册账号**
   - 点击右上角 "Start your project"
   - 使用 GitHub 账号登录（推荐）
   - 或使用邮箱注册

3. **创建组织**
   - 首次登录会提示创建组织
   - 组织名称：`personal` 或随意填写
   - 点击 "Create organization"

---

## 步骤2：创建项目（2分钟）

1. **新建项目**
   - 登录后会自动跳转到Dashboard
   - 点击 "New Project"

2. **填写项目信息**
   ```
   项目名称: moment-sharing
   数据库密码: [设置一个强密码，请记住！]
   区域: Southeast Asia (Singapore)
         // 选择距离最近的区域
         // Northeast Asia (Seoul) 离中国也近
   ```

3. **等待创建**
   - 点击 "Create new project"
   - 等待1-2分钟，项目创建中...
   - 创建成功后会自动跳转到项目Dashboard

---

## 步骤3：创建数据库表（5分钟）

### 方式1：使用SQL编辑器（推荐）

1. **打开SQL编辑器**
   - 在左侧菜单点击 "SQL Editor"
   - 点击 "New query"

2. **创建表**
   复制以下SQL代码并粘贴到编辑器：

   ```sql
   -- 1. 用户表
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT auth.uid(),
     email TEXT NOT NULL,
     username TEXT,
     view_password_hash TEXT NOT NULL,
     edit_password_hash TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- 2. 记忆表
   CREATE TABLE memories (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     date DATE NOT NULL,
     note TEXT,
     photo_count INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- 3. 照片表
   CREATE TABLE photos (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     memory_id UUID NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     storage_path TEXT NOT NULL,
     public_url TEXT NOT NULL,
     thumbnail_url TEXT,
     mime_type TEXT,
     file_size BIGINT,
     width INTEGER,
     height INTEGER,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- 4. 创建索引
   CREATE INDEX idx_memories_user_date ON memories(user_id, date DESC);
   CREATE INDEX idx_photos_memory ON photos(memory_id);
   ```

3. **执行SQL**
   - 点击右下角 "Run" 按钮
   - 等待执行完成
   - 看到绿色 "Success" 提示即为成功

### 方式2：使用Table Editor（图形界面）

1. **打开Table Editor**
   - 在左侧菜单点击 "Table Editor"

2. **创建users表**
   - 点击 "New table"
   - 表名：`users`
   - 添加列：
     - `id` (UUID, primary key)
     - `email` (text, not null)
     - `username` (text)
     - `view_password_hash` (text, not null)
     - `edit_password_hash` (text, not null)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

3. **创建memories表和photos表**
   - 重复上述步骤

---

## 步骤4：配置存储（3分钟）

1. **打开Storage**
   - 在左侧菜单点击 "Storage"

2. **创建存储桶**
   - 点击 "Create a new bucket"
   - 名称：`photos`
   - Public bucket: ✅ 勾选（设为公开，方便访问图片）
   - File size limit: 5MB
   - Allowed MIME types: image/*

3. **配置Bucket策略**
   - 点击 "Policies"
   - 添加以下策略：

   **策略1：公开读取（允许任何人查看照片）**
   ```sql
   CREATE POLICY "Public Access"
   ON storage.objects
   FOR SELECT
   USING ( bucket_id = 'photos' );
   ```

   **策略2： authenticated 用户可以上传**
   ```sql
   CREATE POLICY "Authenticated Upload"
   ON storage.objects
   FOR INSERT
   TO authenticated
   WITH CHECK ( bucket_id = 'photos' );
   ```

   **策略3： authenticated 用户可以删除自己的文件**
   ```sql
   CREATE POLICY "Authenticated Delete"
   ON storage.objects
   FOR DELETE
   TO authenticated
   USING ( bucket_id = 'photos' );
   ```

4. **点击 "Save" 保存策略**

---

## 步骤5：获取API密钥（1分钟）

1. **打开项目设置**
   - 在左侧菜单点击 ⚙️ (Settings)
   - 选择 "API"

2. **复制以下信息**
   ```
   Project URL: https://xxxxxxxx.supabase.co
   anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **保存这些信息**，下一步会用到！

---

## 步骤6：本地配置（2分钟）

1. **创建环境配置文件**
   ```bash
   # 在项目根目录执行
   cp .env.local.example .env.local
   ```

2. **编辑 .env.local 文件**
   ```bash
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   将上面复制的Project URL和anon key填入对应位置

3. **保存文件**

---

## 步骤7：安装依赖（1分钟）

1. **安装Supabase SDK**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **等待安装完成**
   - 看到类似 `added 23 packages` 即为成功

---

## 步骤8：测试连接（2分钟）

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **打开浏览器**
   - 访问 http://localhost:5173
   - 按F12打开开发者工具
   - 查看Console标签

3. **验证连接**
   应该看到以下信息（没有错误）：
   ```
   ✓ Supabase client initialized successfully
   ```

4. **测试基本功能**
   - 创建一个记忆
   - 上传一张照片
   - 查看照片是否正常显示

---

## 步骤9：数据迁移（可选，30分钟）

**重要！迁移前务必备份！**

### 前置条件

- ✅ Supabase项目已创建
- ✅ 数据库表已创建
- ✅ 本地有IndexedDB数据需要迁移

### 迁移步骤

1. **首次访问应用**
   - 应用会自动检测本地IndexedDB数据
   - 弹出迁移确认对话框

2. **确认迁移**
   - 点击"确定"开始迁移
   - 观察控制台日志和进度提示

3. **等待完成**
   - 迁移时间取决于数据量
   - 100张照片约需10-15分钟

4. **验证数据**
   - 在Supabase控制台查看数据
   - Table Editor → 查看表记录数
   - Storage → 查看上传的文件

### 回滚方案

如果迁移失败，可以从备份恢复：

```javascript
// 在浏览器控制台运行
const backup = await fetch('/path/to/backup.json').then(r => r.json());
// 恢复数据...
```

---

## ✅ 验证检查清单

### 基础功能

- [ ] 开发服务器正常启动
- [ ] 浏览器控制台无错误
- [ ] Supabase连接成功
- [ ] 可以创建记忆
- [ ] 可以上传照片
- [ ] 照片显示正常

### 数据库验证

- [ ] 在Supabase控制台可以看到users表
- [ ] 可以看到memories表
- [ ] 可以看到photos表
- [ ] 数据正确插入

### 存储验证

- [ ] 在Storage中可以看到photos桶
- [ ] 上传的文件存在
- [ ] 可以访问公共URL

### 跨设备同步

- [ ] 电脑端创建数据
- [ ] 手机端登录（相同密码）
- [ ] 可以看到电脑端的数据

---

## 💰 成本说明

### 免费额度（每月）

| 资源 | 免费额度 | 说明 |
|------|---------|------|
| 数据库 | 500MB | 约250-500张照片 |
| 文件存储 | 1GB | 约100-1000张照片 |
| 带宽 | 2GB | 约100次照片查看 |
| 并发连接 | 500M | 足够个人使用 |
| **总计** | **$0/月** | **完全免费** |

### 付费计划（超出免费额度后）

```
Pro Plan: $25/月起
- 数据库: 8GB
- 存储: 100GB
- 带宽: 50GB
- 无限并发连接
```

**实际成本估算**：

假设存储1000张照片（5GB）：
- 超出免费存储: 4GB × $0.021/GB = $0.084/月
- 超出免费带宽: 假设很少
- **总计**: 约 $0.10/月

---

## 🚀 部署到生产环境

### 使用Zeabur部署

1. **构建项目**
   ```bash
   npm run build
   ```

2. **部署到Zeabur**
   - 登录 https://zeabur.com
   - 创建新项目
   - 连接GitHub仓库
   - 添加环境变量：
     ```bash
     VITE_SUPABASE_URL=your-project-url
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```
   - 点击"部署"

3. **访问应用**
   - 部署成功后会获得一个域名
   - 如: https://moment-sharing.zeabur.app

---

## 📚 常见问题

### Q1: 数据库连接失败

**错误**: `Database connection failed`

**解决**:
1. 检查 `.env.local` 配置是否正确
2. 确认Supabase项目状态为"Active"
3. 检查网络连接

### Q2: 照片上传失败

**错误**: `Storage permission denied`

**解决**:
1. 确认存储桶已创建
2. 检查Storage Policies配置
3. 确认用户已认证（authenticated）

### Q3: CORS错误

**错误**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**解决**:
Supabase默认配置CORS，一般不会出现此问题。如果出现：
1. 检查项目URL是否正确
2. 清除浏览器缓存重试

### Q4: 数据同步慢

**原因**: Supabase服务器在海外

**解决**:
- 选择亚洲区域（Singapore或Seoul）
- 使用CDN加速
- 优化图片大小

### Q5: 免费额度用完

**症状**: 提示超出免费额度

**解决**:
1. 在Supabase控制台查看用量
2. 清理不需要的数据
3. 或升级到Pro计划（$25/月）

---

## 🎉 下一步

### 增强功能

1. **实时同步**
   - 启用Supabase Realtime
   - 数据变化自动推送

2. **行级安全（RLS）**
   - 配置Row Level Security
   - 增强数据安全性

3. **认证增强**
   - 集成Google登录
   - 集成GitHub登录

4. **性能优化**
   - 实现图片CDN
   - 添加本地缓存

---

## 📞 获取帮助

- **Supabase文档**: https://supabase.com/docs
- **Supabase Discord**: https://discord.gg/supabase
- **GitHub Issues**: https://github.com/supabase/supabase/issues

---

**恭喜！** 🎉

您的 Moment-Sharing 应用已经成功集成Supabase！

现在支持：
- ✅ 云端永久存储
- ✅ 多设备自动同步
- ✅ 现代化PostgreSQL数据库
- ✅ 零运维，自动扩容
- ✅ 免费额度充足

**开始享受您的照片回忆吧！** 📸✨
