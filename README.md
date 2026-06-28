# Dify Chatbot 聊天机器人

基于 Dify API 构建的 React 网页聊天机器人，支持流式对话、会话管理、思维链展示、消息反馈等功能。

## 功能特性

- 💬 **流式对话** — 实时打字动画展示 AI 回复
- 🧠 **思维链展示** — 自动解析并折叠显示 DeepSeek R1 推理过程
- 📋 **会话管理** — 新建 / 切换 / 重命名 / 删除会话
- ⏹ **停止生成** — 一键中止 AI 回复
- 👍 **消息反馈** — 对 AI 回复点赞 / 点踩
- 📜 **历史消息** — 加载会话历史记录
- 🎯 **开场白与推荐问题** — 自动展示应用配置的开场白

## 技术栈

- React 18 + Vite 6
- Dify API（对话应用 advanced-chat 模式）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API Key

复制 `.env.example` 为 `.env`，填入你的 Dify API Key：

```bash
cp .env.example .env
```

```env
VITE_DIFY_API_KEY=app-your-api-key-here
VITE_DIFY_BASE_URL=/dify-api
```

> 获取 API Key：Dify 应用 → 访问 API → 创建 API 密钥

### 3. 启动开发服务器

```bash
npm run dev
```

浏览器打开 http://localhost:5173 即可使用。

### 4. 构建生产版本

```bash
npm run build
```

## 项目结构

```
src/
├── difyApi.js              # Dify API 服务模块（端点封装）
├── utils.js                # 思维链解析工具
├── App.jsx                 # 主应用（状态管理 + 事件处理）
├── App.css                 # 完整样式
└── components/
    ├── Sidebar.jsx         # 会话列表侧边栏
    ├── ChatArea.jsx        # 聊天主区域
    └── MessageBubble.jsx   # 消息气泡组件
```

## Dify API 端点

| 功能 | 端点 |
|------|------|
| 发送消息（流式） | `POST /chat-messages` (streaming) |
| 会话列表 | `GET /conversations` |
| 历史消息 | `GET /messages` |
| 重命名会话 | `POST /conversations/{id}/name` |
| 删除会话 | `DELETE /conversations/{id}` |
| 停止生成 | `POST /chat-messages/{task_id}/stop` |
| 消息反馈 | `POST /messages/{id}/feedbacks` |
| 应用参数 | `GET /parameters` |
| 应用信息 | `GET /meta` |

## License

MIT
