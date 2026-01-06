# 🔧 Zeabur 502错误排查与修复指南

## ❌ 502 SERVICE_UNAVAILABLE 错误原因

### 常见原因：
1. **环境变量未配置** - Supabase URL和密钥未设置
2. **启动命令错误** - Zeabur不知道如何启动Vite应用
3. **端口配置问题** - 服务未监听正确的端口
4. **构建失败** - 应用编译错误但服务仍在运行

## ✅ 已修复的配置

### 1. Vite配置 (vite.config.ts)
```typescript
server: {
  host: '0.0.0.0', // 监听所有网络接口（Zeabur要求）
  port: 5173,
  strictPort: false,
}
```

### 2. 启动命令 (package.json)
```json
"scripts": {
  "start": "vite --host 0.0.0.0 --port 5173"
}
```

## 📋 Zeabur部署步骤

### 步骤1: 推送代码到GitHub

```bash
git add .
git commit -m "fix: 修复Zeabur部署配置"
git push origin main
```

### 步骤2: 在Zeabur中配置

#### 2.1 创建/重新部署服务

1. 登录 [Zeabur Dashboard](https://dash.zeabur.com/)
2. 进入你的项目
3. 如果已有服务，点击 **Redeploy** 重新部署
4. 如果没有服务，点击 **Create Service**

#### 2.2 配置环境变量（关键！）

1. 在服务页面点击 **Variables** 标签
2. 添加以下环境变量：

```bash
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的匿名密钥
```

获取方式：
- 登录 [Supabase Dashboard](https://supabase.com/dashboard)
- 选择你的项目
- 左侧菜单 → **Settings** → **API**
- 复制以下内容：
  - **Project URL** → `VITE_SUPABASE_URL`
  - **anon public** key → `VITE_SUPABASE_ANON_KEY`

#### 2.3 配置启动命令

在 **Settings** 标签中设置：

- **Build Command**:
  ```bash
  npm run build
  ```

- **Start Command**:
  ```bash
  npm run start
  ```

### 步骤3: 验证部署

1. 等待部署完成（通常需要1-2分钟）
2. 访问Zeabur提供的域名
3. 应该能看到应用界面

## 🔍 排查部署日志

### 查看实时日志

1. 在Zeabur项目中，点击 **Logs** 标签
2. 查找错误信息：
   ```
   ✅ 正常启动日志：
   VITE v5.4.21 ready in xxx ms
   ➜  Local: http://localhost:5173/

   ❌ 错误日志：
   Error: Cannot find module 'xxx'
   VITE_SUPABASE_URL is not defined
   ```

### 常见错误及修复

#### 错误1: `VITE_SUPABASE_URL is not defined`
**原因**: 环境变量未设置
**修复**:
- 检查环境变量名称是否正确（必须有 `VITE_` 前缀）
- 在Zeabur中重新设置环境变量
- 重启服务

#### 错误2: `Cannot find module '@supabase/supabase-js'`
**原因**: 依赖未安装
**修复**:
- 确认 `package.json` 中有 `@supabase/supabase-js`
- 删除 `node_modules` 和 `package-lock.json`
- 重新提交代码触发构建

#### 错误3: 端口被占用
**原因**: Vite默认端口配置问题
**修复**:
- 已在 `vite.config.ts` 中添加 `host: '0.0.0.0'`
- 已在 `package.json` 中添加 `start` 命令

## 🚀 快速修复方案

### 方案A: 使用Zeabur预设模板（最简单）

如果上述方法仍然失败，可以：

1. 在Zeabur中创建新服务
2. 选择 **Vite** 模板
3. 然后手动复制你的代码文件

### 方案B: 使用Docker部署（更稳定）

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "start"]
```

然后在Zeabur中选择 **Docker** 部署方式。

### 方案C: 检查Supabase连接

在本地测试环境变量：

1. 创建 `.env.local` 文件：
```bash
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的匿名密钥
```

2. 本地运行测试：
```bash
npm run dev
```

3. 如果本地正常，说明配置正确，问题在Zeabur
4. 查看Zeabur日志，对比本地配置

## 📞 仍然无法解决？

### 收集诊断信息

在Zeabur Dashboard中：

1. **Deployment** 标签 - 查看构建日志
2. **Logs** 标签 - 查看运行时日志
3. **Metrics** 标签 - 查看资源使用情况

### 提供支持所需信息

如果需要帮助，请提供：

1. Zeabur项目的 **Deployment日志**（完整输出）
2. Zeabur项目的 **Runtime日志**（完整输出）
3. 环境变量配置（截图或文字，隐藏密钥）
4. package.json 内容
5. vite.config.ts 内容

## ✅ 成功部署的标志

当你看到以下日志时，说明部署成功：

```
➜  Local: http://localhost:5173/
➜  Network: use --host to expose
✓ built in xxx s
```

然后访问Zeabur提供的域名，应该能看到应用界面。

## 🎯 部署成功后测试清单

- [ ] 页面能正常打开
- [ ] 控制台没有Supabase连接错误
- [ ] 能设置密码（首次使用）
- [ ] 能上传照片
- [ ] 照片能正常显示
- [ ] 大图查看功能正常
- [ ] 编辑和删除功能正常

如果以上所有测试通过，恭喜你部署成功！🎉
