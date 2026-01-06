# Supabase 连接验证指南

**目的**: 验证 Supabase 是否正确配置和连接

---

## 🔍 步骤1：查看初始化日志

### 操作方法

1. **刷新浏览器页面**
   - 按 F5 或 Ctrl+R 刷新
   - 清除之前的日志

2. **打开开发者工具**
   - 按 F12
   - 切换到 **Console（控制台）** 标签

3. **查找以下日志**

### ✅ 成功的标志

您应该看到：

```
✅ Supabase client initialized successfully
📋 Project URL: https://xxxxxxxx.supabase.co
🔑 Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**说明**：
- ✅ 看到 `✅` = 初始化成功
- ✅ 显示了您的 Project URL
- ✅ 显示了 Anon Key 的前20个字符

### ❌ 失败的标志

如果看到：

```
❌ Supabase URL is missing. Please check your .env.local file.
```

**说明**：环境变量未配置

**解决方法**：
```bash
# 检查 .env.local 文件
cat .env.local

# 如果不存在，创建它
cp .env.local.example .env.local

# 编辑填入您的 Supabase 凭据
```

---

## 🔍 步骤2：验证用户认证

### 操作方法

1. **在应用中输入密码登录**
   - 查看密码：`view123`
   - 编辑密码：`edit123`

2. **观察控制台日志**

### ✅ 成功的标志

应该看到：

```
🔐 开始初始化用户...
📝 创建默认用户...
  邮箱: user@moment-sharing.com
  查看密码: view123
  编辑密码: edit123
✅ 用户初始化成功
```

**如果用户已存在**：
```
🔐 开始初始化用户...
✅ 用户已存在: user@moment-sharing.com
```

### ❌ 可能的错误

**错误1**: `User not logged in`
- **原因**: Supabase 认证失败
- **解决**: 检查 Supabase 控制台的项目状态

**错误2**: `Permission denied`
- **原因**: 数据库权限问题
- **解决**: 检查 RLS（Row Level Security）策略

---

## 🔍 步骤3：验证数据库连接

### 操作方法

1. **创建一个记忆**
   - 点击"添加记忆"按钮
   - 选择日期
   - 输入备注
   - 点击保存

2. **观察控制台日志**

### ✅ 成功的标志

应该看到：

```
📝 创建记忆: { date: "2026-01-05", note: "测试记忆" }
  用户ID: xxx-xxx-xxx
✅ 记忆创建成功, ID: xxx-xxx-xxx
```

### ❌ 失败的标志

如果看到：

```
❌ 创建记忆异常: ...
```

**常见原因**：
1. **数据库表不存在**
   - 检查：Supabase 控制台 → Table Editor → 是否有 `memories` 表
   - 解决：运行 SQL 脚本创建表

2. **权限不足**
   - 检查：Supabase 控制台 → Authentication → Policies
   - 解决：添加适当的 RLS 策略

---

## 🔍 步骤4：验证照片上传

### 操作方法

1. **上传一张照片**
   - 在记忆中点击"添加照片"
   - 选择图片文件
   - 点击上传

2. **观察控制台日志**

### ✅ 成功的标志

应该看到完整的上传过程：

```
📤 上传照片...
  记忆ID: xxx-xxx-xxx
  文件名: photo.jpg
  文件大小: 123.45 KB
  生成文件名: xxx-xxx-xxx.jpg
  文件上传成功: user-id/memory-id/xxx.jpg
  公共URL: https://xxx.supabase.co/storage/v1/...
  图片尺寸: 1920 x 1080
💾 创建照片记录...
✅ 照片记录创建成功, ID: xxx-xxx-xxx
✅ 照片上传完成!
```

### ❌ 失败的标志

**错误1**: `Storage permission denied`
- **原因**: Storage 桶未创建或权限配置错误
- **解决**:
  1. 检查 Supabase 控制台 → Storage → 是否有 `photos` 桶
  2. 检查 Policies 是否正确配置

**错误2**: `Bucket not found`
- **原因**: 存储桶不存在
- **解决**: 在 Storage 中创建 `photos` 桶

**错误3**: `File too large`
- **原因**: 文件超过大小限制
- **解决**: 检查桶的文件大小限制设置

---

## 🔍 步骤5：在 Supabase 控制台验证

### 验证数据库数据

1. **登录 Supabase Dashboard**
   - 访问 https://supabase.com/dashboard

2. **选择您的项目**
   - 项目名：`moment-sharing`

3. **检查数据库**
   - 点击左侧 **Table Editor**
   - 查看以下表是否有数据：
     - ✅ `users` 表：至少1条记录
     - ✅ `memories` 表：您创建的记忆
     - ✅ `photos` 表：您上传的照片

### 验证存储文件

1. **检查存储桶**
   - 点击左侧 **Storage**
   - 查看 `photos` 桶是否存在

2. **查看上传的文件**
   - 点击 `photos` 桶
   - 应该能看到您上传的照片

3. **测试公共URL**
   - 点击任意照片
   - 复制 **Public URL**
   - 在浏览器新标签中打开
   - **应该能看到图片** ✅

---

## 📊 完整验证检查清单

### 本地环境

- [ ] ✅ 控制台显示 "Supabase client initialized successfully"
- [ ] ✅ 没有 "URL is missing" 或 "Anon Key is missing" 错误
- [ ] ✅ 可以成功登录（使用 view123）
- [ ] ✅ 可以创建记忆
- [ ] ✅ 可以上传照片
- [ ] ✅ 照片显示正常

### Supabase 控制台

- [ ] ✅ `users` 表有数据
- [ ] ✅ `memories` 表有数据
- [ ] ✅ `photos` 表有数据
- [ ] ✅ `photos` 存储桶有文件
- [ ] ✅ 照片的 Public URL 可以访问

---

## 🐛 常见问题排查

### 问题1：环境变量未生效

**症状**：
```
❌ Supabase URL is missing
```

**排查步骤**：
1. 检查 `.env.local` 文件是否存在
   ```bash
   ls -la .env.local
   ```

2. 检查文件内容
   ```bash
   cat .env.local
   ```
   应该看到：
   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   ```

3. 如果缺少，填入正确的值

4. **重启开发服务器**
   ```bash
   # 按 Ctrl+C 停止
   npm run dev
   ```

### 问题2：数据库连接失败

**症状**：创建记忆时出错

**排查步骤**：
1. 检查 Supabase 控制台的项目状态
   - 应该显示 "Active" 绿色状态

2. 检查 API 密钥是否正确
   - Settings → API → 复制新的 URL 和 key
   - 更新 `.env.local`

3. 检查数据库表是否存在
   - Table Editor → 是否有 `users`, `memories`, `photos` 表

### 问题3：照片上传失败

**症状**：上传照片时出错

**排查步骤**：
1. 检查存储桶是否存在
   - Storage → 是否有 `photos` 桶

2. 检查存储桶是否为 Public
   - 点击 `photos` 桶 → Configuration
   - 应该勾选 "Public bucket"

3. 检查 Policies
   - Storage → Policies
   - 应该有 "Public Access" 策略

### 问题4：跨域问题（CORS）

**症状**：浏览器控制台有 CORS 错误

**解决**：
Supabase 默认配置 CORS，一般不会出现此问题。如果出现：
1. 检查 Project URL 是否正确
2. 清除浏览器缓存
3. 尝试无痕模式

---

## ✅ 验证成功！

如果您：

1. ✅ 看到了 "Supabase client initialized successfully"
2. ✅ 能够成功创建记忆
3. ✅ 能够成功上传照片
4. ✅ 在 Supabase 控制台看到了数据
5. ✅ 照片的 Public URL 可以访问

**恭喜！您的 Supabase 集成完全成功！** 🎉

---

## 📞 仍有问题？

如果按照以上步骤仍然有问题：

1. **复制完整的错误信息**
   - 控制台的所有错误日志
   - Network 标签的请求失败记录

2. **提供以下信息**：
   - `.env.local` 内容（隐藏密钥中间部分）
   - Supabase 控制台的项目状态截图
   - 浏览器控制台的完整日志

我会帮您进一步排查！🔍
