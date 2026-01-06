# Zeabur 502 错误故障排查指南

## 🔍 问题症状

访问部署的网站时出现：
- 502 Bad Gateway
- `/favicon.ico` 返回 502
- 网站无法加载

---

## ✅ 解决步骤（按顺序执行）

### 步骤 1：检查 Zeabur 部署日志

1. 登录 [Zeabur 控制台](https://zeabur.com)
2. 选择 `Moment-Sharing` 项目
3. 点击你的服务（通常叫 `moment-sharing` 或 `web`）
4. 点击 **"Logs"** 标签页
5. 查找以下错误信息：

#### 常见错误类型：

**错误 A：环境变量缺失**
```
❌ Supabase URL is missing. Please check your .env.local file.
❌ Supabase Anon Key is missing. Please check your .env.local file.
```
**→ 解决方法：** 跳到 [步骤 2](#步骤-2配置环境变量)

**错误 B：端口占用**
```
Error: listen EADDRINUSE: address already in use
```
**→ 解决方法：** 跳到 [步骤 3](#步骤-3手动重启)

**错误 C：构建失败**
```
npm ERR! code ELIFECYCLE
```
**→ 解决方法：** 跳到 [步骤 4](#步骤-4本地测试构建)

---

### 步骤 2：配置环境变量

#### 2.1 获取 Supabase 凭证

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 左侧菜单：**Settings** → **API**
4. 复制以下内容：
   - **Project URL**: 类似 `https://xxxxxxxx.supabase.co`
   - **anon/public key**: 一长串 JWT token

#### 2.2 在 Zeabur 添加环境变量

1. 在 Zeabur 项目页面
2. 点击 **"Variables"** 或 **"Environment Variables"**
3. 点击 **"Add Variable"** 或 **"New Variable"**
4. 添加两个环境变量：

```bash
# 变量 1
Name: VITE_SUPABASE_URL
Value: https://sqfapzkqtiyivrrhmwhu.supabase.co

# 变量 2
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（完整的 anon key）
```

**⚠️ 重要提示：**
- 变量名必须以 `VITE_` 开头（大写）
- Value 不要有引号
- 确保没有多余的空格

#### 2.3 重新部署

1. 保存环境变量后
2. 点击 **"Redeploy"** 或 **"Restart"**
3. 等待 2-3 分钟

---

### 步骤 3：手动重启

如果环境变量已配置但仍然 502：

1. 在 Zeabur 控制台
2. 点击服务名称
3. 点击右上角 **"..."** 菜单
4. 选择 **"Restart"**
5. 等待重启完成（约 1-2 分钟）

---

### 步骤 4：本地测试构建

在本地执行以下命令，确保构建成功：

```bash
# 1. 清理旧的构建
rm -rf dist

# 2. 执行构建
npm run build

# 3. 检查 dist 目录是否存在
ls dist
```

应该看到：
```
dist/index.html
dist/assets/
```

如果构建失败，提交问题前先解决本地构建错误。

---

### 步骤 5：检查 Zeabur 服务状态

在 Zeabur 控制台检查：

- [ ] 服务状态是 **"Running"**（不是 "Crashed" 或 "Stopped"）
- [ ] 有一个绿色的 ✅ 健康检查标记
- [ ] CPU 和内存使用正常（不是 0% 或 100%）
- [ ] 端口显示正确（应该是 Zeabur 自动分配的端口）

---

### 步骤 6：查看部署配置

确认 Zeabur 的部署配置：

1. 点击服务 → **"Settings"**
2. 检查以下配置：

| 配置项 | 应该的值 |
|--------|---------|
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Environment Variables | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY |
| Port | 自动（不要手动设置） |

---

## 🔧 高级排查

### 检查 Docker 镜像大小

如果镜像很大（>500MB），可能导致部署超时：

```bash
# 在本地查看镜像大小
docker images | grep moment-sharing
```

**优化方法：**
- 确保 `.dockerignore` 文件存在
- 排除不必要的文件（node_modules, .git 等）

### 检查构建时间

如果构建超过 10 分钟，可能会超时：

```bash
# 本地测试构建时间
time npm run build
```

应该在 **2-5 分钟**内完成。

---

## 📋 快速检查清单

使用此清单快速排查问题：

- [ ] 环境变量 `VITE_SUPABASE_URL` 已配置
- [ ] 环境变量 `VITE_SUPABASE_ANON_KEY` 已配置
- [ ] 两个环境变量的值都正确（没有拼写错误）
- [ ] 在 Zeabur 执行了重新部署
- [ ] 等待了至少 3 分钟让服务启动
- [ ] 本地构建成功（`npm run build`）
- [ ] Zeabur 日志中没有错误
- [ ] 服务状态是 "Running"
- [ ] 健康检查通过（绿色 ✅）

---

## 🆘 仍然无法解决？

### 收集以下信息：

1. **Zeabur 日志**（完整的错误日志）
2. **服务状态**（截图或文本）
3. **环境变量配置**（变量名，不要泄露值）
4. **本地构建结果**（`npm run build` 的输出）

### 提交问题时包含：

```markdown
## 问题描述
[描述你看到的具体错误]

## 已尝试的步骤
- [ ] 配置了环境变量
- [ ] 重新部署了服务
- [ ] 本地构建成功
- [ ] 查看了日志

## Zeabur 日志
[粘贴日志内容]

## 本地环境
- Node 版本: [运行 node -v]
- npm 版本: [运行 npm -v]
- 操作系统: [Windows/Mac/Linux]
```

---

## 📚 相关文档

- [Zeabur 官方文档](https://zeabur.com/docs)
- [Supabase 环境变量配置](SUPABASE_README.md)
- [Dockerfile 配置说明](../Dockerfile)

---

## 🎯 预防措施

为避免未来的 502 错误：

1. ✅ **使用 `.zeabur.example` 文档化环境变量**
2. ✅ **在 README 中明确列出必需的环境变量**
3. ✅ **本地测试构建后再推送**
4. ✅ **使用 CI/CD 自动检测构建问题**
5. ✅ **定期更新依赖包**

---

**最后更新：** 2025-01-07
**适用版本：** Moment-Sharing v1.0+
