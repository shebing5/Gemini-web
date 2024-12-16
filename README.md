# React TypeScript 聊天应用

一个使用 React、TypeScript 和 Vite 构建的现代聊天应用。

## 功能特点

- 使用 TypeScript 的 React 18
- 使用 Vite 实现快速开发和构建
- 使用 Tailwind CSS 进行样式设计
- 支持 Markdown 和 KaTeX 数学公式
- 代码块语法高亮
- 实时聊天功能

## 环境要求

- Node.js 20.x 或更高版本
- npm 9.x 或更高版本
- Docker 和 Docker Compose（用于 Docker 部署）

## 本地开发

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

应用将在 `http://localhost:5173` 上运行

3. 构建生产环境版本（生成优化后的静态文件）：
```bash
npm run build
```

4. 在本地预览生产环境版本（用于测试构建结果）：
```bash
npm run preview
```

## Docker 部署

### 使用 Docker Compose（推荐）

1. 构建并启动应用：
```bash
docker-compose up --build
```

2. 后台运行（分离模式）：
```bash
docker-compose up -d
```

3. 停止应用：
```bash
docker-compose down
```

应用将在 `http://localhost:4555` 上运行

### 手动 Docker 命令

1. 构建 Docker 镜像：
```bash
docker build -t chat-app .
```

2. 运行容器：
```bash
docker run -d -p 4555:4555 chat-app
```

3. 停止容器：
```bash
docker stop $(docker ps -q --filter ancestor=chat-app)
```

## 项目结构

```
.
├── src/
│   ├── components/     # React 组件
│   ├── services/       # API 和服务函数
│   └── store/         # 状态管理
├── public/            # 静态资源
├── Dockerfile         # Docker 配置
├── docker-compose.yml # Docker Compose 配置
└── nginx.conf        # 用于 Docker 的 Nginx 配置
```

## API 密钥

本应用需要以下 API 密钥才能运行：

1. **Gemini API 密钥**：用于 Gemini 语言模型
   - 从 [Google AI Studio](https://makersuite.google.com/app/apikey) 获取你的 API 密钥
   - 在应用设置面板中输入你的 Gemini API 密钥

2. **XAI API 密钥**：用于 XAI 功能
   - 在应用设置面板中输入你的 XAI API 密钥

你的 API 密钥将安全地存储在浏览器的本地存储中，并且不会发送到我们的服务器。

## 环境变量

当前，基本设置不需要环境变量。

## 贡献

1. Fork 仓库
2. 创建你的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个拉取请求

## 许可证

本项目使用 MIT 许可证。
