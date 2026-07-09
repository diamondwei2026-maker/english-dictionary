# Coding Prompt — Task 6.2: Docker 容器化与部署配置

> 生成日期：2026-07-09 | 关联 Task：[task.md](./task.md) | 测试用例：[test-cases.md](./test-cases.md)

---

## 1. 任务目标

为 Node.js + Express + TypeScript 后端服务实现 Docker 容器化、docker-compose 编排、CI/CD 配置和部署文档，使项目可通过 `docker-compose up` 一键启动完整开发/生产环境。

---

## 2. 技术上下文

- **后端运行时**: Node.js 18+ LTS，Express 4.21 + TypeScript 5.5
- **包管理**: pnpm（Monorepo 根目录），server 目录独立用 npm install（Docker 内使用）
- **数据库**: MongoDB（Mongoose 9.7），Docker 内使用 `mongo:7` 官方镜像
- **构建工具**: tsc（TypeScript Compiler），输出目录 `dist/`
- **测试框架**: Jest 29 + ts-jest
- **Lint**: ESLint 8
- **部署目标**: Render（后端）+ Vercel（前端），分阶段先实现 Docker 化
- **现有文件**:
  - [server/package.json](../../../server/package.json) — scripts: `dev`, `build`, `start`, `test`, `db:seed`
  - [server/tsconfig.json](../../../server/tsconfig.json) — `outDir: "./dist"`, `rootDir: "./src"`, target ES2020, module commonjs
  - [server/src/config/index.ts](../../../server/src/config/index.ts) — 环境变量配置（PORT, MONGODB_URI, JWT_SECRET, DEEPSEEK_API_KEY 等）
  - [server/src/app.ts](../../../server/src/app.ts) — 已实现 `GET /api/v1/health` 健康检查（第 25 行）
  - [server/src/index.ts](../../../server/src/index.ts) — 入口文件，调用 connectDatabase() + createApp().listen()

**重要**：`server/src/index.ts` 中使用的 `connectDatabase` 是从 `./config/database` 导入的，请先确认该文件存在及其导出签名。

---

## 3. 实现要求

### 3.1 新建 `server/Dockerfile` — 多阶段构建

```
阶段 1 (builder):
  基于 node:18-alpine
  拷贝 package.json + package-lock.json（如存在），执行 npm ci
  拷贝 tsconfig.json + src/，执行 npm run build（tsc）
  ⚠️ server 目录通过 pnpm workspace 管理，package.json 中依赖可能声明在根目录的 pnpm-workspace.yaml。
     构建时 server/package.json 中的 dependencies 在 npm 视角是完整的（npm install 可直接安装），
     无需处理 pnpm workspace 协议。

阶段 2 (production):
  基于 node:18-alpine
  仅拷贝 package.json + package-lock.json，执行 npm ci --omit=dev（仅生产依赖）
  从 builder 拷贝 dist/ 目录
  创建非 root 用户 node（alpine 镜像已内置）
  EXPOSE 3001
  CMD ["node", "dist/index.js"]
```

**关键约束**:
- 必须使用 `.dockerignore` 排除 `node_modules`、`.env`、`dist`（见 3.3）
- 生产镜像不应包含 `src/`、`tsconfig.json`、devDependencies
- 构建失败时的错误信息应通过 Docker build 输出清晰可见

**可选增强**（P2）：
- 添加 `HEALTHCHECK` 指令：`HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health || exit 1`
- 使用 `npm ci --omit=dev` 而非 `--production`（npm 10+ 推荐）

### 3.2 新建 `docker-compose.yml`（项目根目录）

定义两个服务：

| 服务 | 镜像 | 端口 | 关键配置 |
|------|------|------|---------|
| `mongodb` | `mongo:7` | 内部 27017 | named volume: `mongo-data:/data/db` |
| `app` | 构建自 `server/Dockerfile` | `3001:3001` | depends_on mongodb（含 healthcheck 条件） |

```yaml
# 关键结构
services:
  mongodb:
    image: mongo:7
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    depends_on:
      mongodb:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/english-dictionary
      - JWT_SECRET=${JWT_SECRET:-change-me-in-production}
    restart: unless-stopped

volumes:
  mongo-data:
```

**关键约束**:
- `app` 服务的 `MONGODB_URI` 必须使用 Docker DNS 名称 `mongodb`（非 localhost）
- `app` 必须等待 `mongodb` healthcheck 通过后才启动（condition: service_healthy）
- `JWT_SECRET` 通过 `${JWT_SECRET:-fallback}` 语法支持外部传入
- app 服务添加 `restart: unless-stopped` 异常退出后自动重启
- 使用 named volume 持久化 MongoDB 数据

**可选增强**（P2）：
- 添加 `redis` 服务（如项目后续引入 Redis 缓存）
- 添加 `networks` 自定义网络
- 提供 `docker-compose.dev.yml` 覆盖开发模式（挂载源码 + tsx watch）

### 3.3 新建 `server/.dockerignore`

排除以下内容（示例，按实际项目调整）：

```
node_modules
dist
.env
.env.*
.git
*.md
!README.md
coverage
.gitignore
.eslintrc*
.prettierrc*
jest.config.*
```

### 3.4 新建 `.env.example`（项目根目录）

列出 `server/src/config/index.ts` 中引用的所有环境变量，标注必填/可选：

| 变量 | 示例值 | 必填 | 说明 |
|------|--------|------|------|
| `PORT` | `3001` | 否 | 服务端口，默认 3001 |
| `NODE_ENV` | `production` | 否 | 运行环境 |
| `MONGODB_URI` | `mongodb://localhost:27017/english-dictionary` | **是** | MongoDB 连接字符串 |
| `JWT_SECRET` | `your-secret-key-change-me` | **生产必填** | JWT 签名密钥 |
| `JWT_EXPIRES_IN` | `7d` | 否 | Access Token 有效期 |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | 否 | Refresh Token 有效期 |
| `DEEPSEEK_API_KEY` | `sk-xxx` | 否 | DeepSeek API 密钥（AI 生成功能需要） |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com/v1` | 否 | DeepSeek API 地址 |
| `CACHE_ENABLED` | `true` | 否 | 是否启用结果缓存 |

**格式规范**:
- 每个变量一行 `KEY=value` 或 `KEY=`（留空）
- 每个变量前有注释 `# 用途说明`
- 文件末尾标注：`# ⚠️ 生产环境请务必修改 JWT_SECRET 为安全的随机字符串`

### 3.5 新建 `.github/workflows/ci.yml` — CI/CD 配置

```yaml
# 触发：push 到 main/develop 分支 + Pull Request
# Node.js 版本：18.x, 20.x（矩阵测试）
# Job 顺序：
#   lint → test → build（串行，失败则停止）
#   build 阶段：npm ci → npm run build（tsc 编译验证）
```

**关键约束**:
- 工作目录为 `server/`（使用 `defaults.run.working-directory` 或在每个 step 指定）
- pnpm workspace 场景下：CI 直接 cd server && npm ci 即可（server 的 package.json 完整）
- `build` job 依赖 `test` job 通过（`needs: test`）
- Node.js 版本矩阵：`[18, 20]`
- 缓存 npm 依赖加速构建：`actions/cache@v3` 或 `actions/setup-node` 自带缓存
- **安全**：不要在 CI 文件中硬编码任何密钥，敏感值通过 `${{ secrets.XXX }}` 引用

**可选增强**（P2）：
- 添加 Docker 镜像构建 job（`docker/build-push-action`）
- 添加 `docker-compose up` 集成测试 job

### 3.6 新建 `DEPLOY.md`（项目根目录）— 部署文档

内容覆盖：

```markdown
# 部署指南

## 环境要求
- Docker 24+ & Docker Compose v2
- Node.js 18+（本地开发）

## 快速启动（Docker）
### 1. 克隆项目
### 2. 配置环境变量：cp .env.example .env，编辑 .env 填写必需值
### 3. 启动：docker-compose up -d
### 4. 验证：curl http://localhost:3001/api/v1/health
### 5. 停止：docker-compose down

## 本地开发（非 Docker）
### 1. 确保 MongoDB 运行中
### 2. cd server && npm install
### 3. 配置 .env
### 4. npm run dev  # tsx watch 热重载
### 5. npm test     # 运行测试

## 生产部署
### Render 部署
- 选择 Docker 部署方式
- 设置环境变量（见 .env.example）
- 自动检测 Dockerfile 并构建

### Vercel 部署（前端）
- 暂不涉及（client/ 已有独立部署配置）

## 常见问题
- 端口占用：修改 docker-compose.yml 中的端口映射
- MongoDB 连接失败：检查 MONGODB_URI 和网络配置
```

**关键约束**:
- 文档必须覆盖 Docker 启动 + 本地开发两种方式
- 包含如何验证部署成功的命令（`curl /api/v1/health`）
- 包含常见问题排查
- 提及生产环境安全配置（修改 JWT_SECRET、启用 HTTPS）

---

## 4. 代码规范要求

- Dockerfile 遵循 [Docker 官方最佳实践](https://docs.docker.com/develop/dev-best-practices/)：
  - 多阶段构建减少镜像体积
  - 合并 RUN 指令减少层数
  - 使用 `.dockerignore` 排除无关文件
  - 以非 root 用户运行（node 镜像内置 `node` 用户）
- CI 配置使用 GitHub Actions 官方 action（`actions/checkout@v4`、`actions/setup-node@v4`）
- YAML 文件使用 2 空格缩进
- 文档用中文撰写，命令用英文
- 所有文件末尾保留一个空行

---

## 5. 测试要求

代码必须能通过以下测试用例（详见 [test-cases.md](./test-cases.md)）：

| 用例 | 验收项 | 验证方式 |
|------|--------|---------|
| TC-001 | Dockerfile 含 2+ 阶段，builder 含 devDependencies | 读取 Dockerfile 检查 FROM 指令 |
| TC-002 | 生产镜像不含 src/ 和 devDependencies | `docker build` + `docker run --rm <image> ls /app` |
| TC-003 | docker-compose 含 app + mongodb 服务，depends_on | 读取 yml 检查 services |
| TC-004 | `docker-compose up -d` 后 `/api/v1/health` 返回 200 | 端到端启动 + curl |
| TC-005 | `/api/v1/health` 响应格式 `{"status":"ok","timestamp":"..."}` | curl 请求检查响应 |
| TC-006 | MongoDB 不可达时服务不崩溃，健康检查反映异常状态 | 错误 MONGODB_URI 启动 |
| TC-007 | `.env.example` 包含所有 `config/index.ts` 引用的变量 | 逐变量比对 |
| TC-009 | MongoDB volume 持久化数据 | `docker-compose down && up` 后数据仍存在 |
| TC-010 | CI 包含 lint + test + build 三个步骤，Node.js >= 18 | 读取 CI 配置 |
| TC-011 | CI 无硬编码密钥，`.dockerignore` 排除 `.env` | 读取文件检查 |
| TC-012 | 部署文档覆盖 6 个要点 | 读取文档检查 |
| TC-013 | `.dockerignore` 排除 node_modules、.env、.git 等 | 读取文件检查 |

---

## 6. 注意事项

1. **pnpm workspace 与 Docker 不冲突**：Dockerfile 构建上下文为 `server/`，直接 `npm install` 即可，无需 pnpm。`server/package.json` 是自包含的，dependencies 完整列出。

2. **MongoDB 容器 DNS**：docker-compose 中 MongoDB 服务名为 `mongodb`，app 连接字符串必须用 `mongodb://mongodb:27017/...`，不能是 `localhost`。

3. **健康检查已实现**：`server/src/app.ts` 第 25 行已有 `/api/v1/health` 端点，无需新建。但需验证 MongoDB 连接失败时该端点是否仍返回正确状态（当前实现不检查 DB 连接 — 如测试用例 TC-006 要求，可考虑增强健康检查以包含 DB 状态，但此为 P2 可选改动）。

4. **Dockerfile 构建上下文**：docker-compose 中 `build.context: ./server` 意味着 `.dockerignore` 应放在 `server/` 目录，COPY 指令的路径相对于 `server/`。

5. **GitHub Actions 工作目录**：CI steps 需要明确工作目录为 `server/`，或在每个命令前加 `cd server &&`。推荐使用 job 级别的 `defaults.run.working-directory: ./server`。

6. **环境变量安全性**：`.env.example` 中的 JWT_SECRET 示例值必须明确标注"请修改"，CI 配置中的 JWT_SECRET 测试用可使用 `test-secret-for-ci`（不含特殊字符）。

7. **镜像大小目标**：合理预期 — node:18-alpine 基础约 120MB + 生产依赖约 10-20MB + dist 产出约 1MB，总计 < 200MB。若不达预期，检查是否误拷贝了 node_modules 或 src 目录。
