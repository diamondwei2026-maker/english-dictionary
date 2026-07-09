# 英语母语者词典 — 部署指南

---

## 环境要求

| 方式 | 依赖 |
|------|------|
| Docker 部署 | Docker 24+、Docker Compose v2 |
| 本地开发 | Node.js 18+、MongoDB 7+ |

---

## 快速启动（Docker）

### 1. 克隆项目

```bash
git clone <repo-url> && cd english-dictionary
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，至少修改 `JWT_SECRET` 为安全的随机字符串：

```bash
# 生成安全随机字符串
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. 一键启动

```bash
docker compose up -d
```

首次启动会自动构建后端镜像（约 1-2 分钟），后续启动直接使用已有镜像。

### 4. 验证服务

```bash
curl http://localhost:3001/api/v1/health
```

预期响应：

```json
{"status":"ok","timestamp":"2026-07-09T12:00:00.000Z"}
```

### 5. 停止服务

```bash
# 停止并保留数据
docker compose down

# 停止并删除数据库数据（⚠️ 数据不可恢复）
docker compose down -v
```

### 6. 查看日志

```bash
# 所有服务
docker compose logs -f

# 仅 API 服务
docker compose logs -f app
```

---

## 本地开发（非 Docker）

### 1. 确保 MongoDB 运行中

```bash
# 如使用 Docker 仅运行 MongoDB
docker run -d --name mongo-dev -p 27017:27017 mongo:7
```

### 2. 安装依赖并启动

```bash
cd server
npm install
cp ../.env.example .env   # 按需修改配置
npm run dev                 # tsx watch 热重载，监听文件变更
```

服务默认运行在 `http://localhost:3001`。

### 3. 运行测试

```bash
npm test
```

### 4. 代码检查

```bash
npm run lint
```

---

## 生产部署

### 环境变量清单（生产必填）

| 变量 | 说明 |
|------|------|
| `JWT_SECRET` | **必须修改**，使用 `crypto.randomBytes(64)` 生成 |
| `MONGODB_URI` | 生产 MongoDB 连接字符串（Atlas 或其他） |
| `DEEPSEEK_API_KEY` | AI 词条生成功能所需 |

### Render 部署

1. 在 Render Dashboard 创建 **Web Service**
2. 选择 Docker 部署方式
3. 设置环境变量（见 `.env.example`）
4. Render 自动检测 `server/Dockerfile` 并构建部署

### Vercel 部署（前端）

前端（`client/`）已有独立的 Vercel 部署配置，不受本轮 Docker 化影响。

---

## 常见问题

### 端口冲突

修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "3002:3001"   # 改为 3002
```

### MongoDB 连接失败

```bash
# 检查 MongoDB 容器是否健康
docker compose ps mongodb

# 检查 app 日志
docker compose logs app | grep -i mongo
```

常见原因：
- MongoDB 容器尚未健康就绪 — 等待 30 秒后重试
- `MONGODB_URI` 使用了 `localhost` 而非 Docker 服务名 `mongodb`

### 首次 build 很慢

Docker 会缓存各构建层。首次较慢（~2 分钟），后续若未修改 `package.json` 则依赖安装层被缓存，大幅加速。

### Docker 镜像占用空间大

```bash
# 清理悬空镜像
docker image prune

# 查看所有构建缓存
docker builder prune
```

---

## 目录结构（部署相关）

```
english-dictionary/
├── .env.example              # 环境变量模板
├── docker-compose.yml        # Docker Compose 编排
├── DEPLOY.md                 # 本文件
├── .github/workflows/
│   └── ci.yml                # CI 流水线
└── server/
    ├── Dockerfile            # 多阶段构建
    └── .dockerignore         # 构建排除
```
