# 使用官方Node.js镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口(Zeabur会通过环境变量PORT动态分配)
EXPOSE 5173

# 设置环境变量
ENV NODE_ENV=production

# 设置健康检查(使用动态PORT)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD sh -c "node -e \"require('http').get('http://localhost:' + (process.env.PORT || 5173), (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""

# 启动应用
CMD ["npm", "start"]
