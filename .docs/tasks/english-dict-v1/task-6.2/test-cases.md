# 测试用例 — Task 6.2: Docker 容器化与部署配置

> 生成日期：2026-07-09 | 关联 Task：[task.md](./task.md)

---

## 测试范围说明

| 维度 | 覆盖内容 |
|------|---------|
| 功能测试 | Dockerfile 构建、docker-compose 编排、健康检查、环境变量注入、CI 流程 |
| 边界测试 | 镜像大小上限、构建缓存失效、端口冲突、数据库连接失败重试 |
| 异常测试 | 缺少必需环境变量、MongoDB 不可达、健康检查超时、构建阶段失败 |
| 集成测试 | App ↔ MongoDB 通信、docker-compose 服务编排顺序、CI 多步骤联动 |

---

### TC-001: Dockerfile 多阶段构建 — 开发阶段包含 devDependencies
- **类型**: 功能测试
- **关联验收标准**: `server/Dockerfile` — 多阶段构建
- **前置条件**: 项目根目录存在 `server/Dockerfile`
- **输入**:
  - 项目源码（含 `package.json`、`tsconfig.json`、`src/`）
- **执行步骤**:
  1. 读取 `server/Dockerfile`，确认包含至少两个 `FROM` 指令（多阶段）
  2. 确认第一阶段（builder）执行 `npm install`（非 `--production`），包含 devDependencies
  3. 确认第一阶段执行 `npm run build`（tsc 编译）
  4. 确认第二阶段（production）使用更精简的 base image（如 `node:18-alpine`）
  5. 确认第二阶段仅拷贝 `dist/`、`package.json`，执行 `npm ci --production`
- **预期输出**:
  - Dockerfile 至少含 2 个构建阶段
  - builder 阶段安装 devDependencies 并执行 `tsc`
  - 生产阶段不含 devDependencies，不含 `src/` 源码
- **清理**: 无

---

### TC-002: Dockerfile 多阶段构建 — 生产镜像精简
- **类型**: 边界测试
- **关联验收标准**: `server/Dockerfile` — 生产镜像精简
- **前置条件**: `server/Dockerfile` 已编写
- **输入**:
  - 执行 `docker build -t english-dict-server:test -f server/Dockerfile server/`
- **执行步骤**:
  1. 构建完成后执行 `docker images english-dict-server:test --format "{{.Size}}"`
  2. 检查最终镜像不包含 `src/` 目录
  3. 检查最终镜像中 `node_modules` 不含 devDependencies（无 `typescript`、`tsx`、`jest`、`eslint` 等）
- **预期输出**:
  - 生产镜像大小 < 500MB（合理预期，含 node:18-alpine + 生产依赖）
  - 镜像内无 `.ts` 源文件
  - `node_modules` 中不存在 `typescript`、`eslint`、`jest` 目录
- **清理**: `docker rmi english-dict-server:test`

---

### TC-003: docker-compose.yml 编排 App + MongoDB
- **类型**: 功能测试
- **关联验收标准**: `docker-compose.yml` — 编排 app + 数据库
- **前置条件**: 项目根目录存在 `docker-compose.yml`
- **输入**:
  - `docker-compose.yml` 文件
- **执行步骤**:
  1. 检查文件定义了两个 service：`app` 和 `mongodb`（或 `mongo`）
  2. 检查 `app` 服务有 `depends_on: [mongodb]` 或等效依赖声明
  3. 检查 `mongodb` 服务暴露端口或使用内部网络通信
  4. 检查 `app` 服务的 `environment` 或 `env_file` 配置了 `MONGODB_URI`
  5. 检查是否存在自定义网络让两服务互通
- **预期输出**:
  - 至少包含 `app` + `mongodb` 两个服务
  - `app` 依赖 `mongodb`（通过 depends_on 或 healthcheck 条件）
  - `MONGODB_URI` 指向 `mongodb://mongodb:27017/english-dictionary`
  - 服务间通过 Docker 内部 DNS 通信
- **清理**: 无

---

### TC-004: docker-compose up 一键启动
- **类型**: 集成测试
- **关联验收标准**: `docker-compose up` 一键启动完整环境
- **前置条件**: Docker 环境已安装，`docker-compose.yml` 已编写
- **输入**:
  - 执行 `docker-compose up -d`
- **执行步骤**:
  1. 在项目根目录执行 `docker-compose up -d`
  2. 等待服务启动（约 30 秒）
  3. 执行 `docker-compose ps` 确认所有服务状态为 `Up`
  4. 执行 `curl http://localhost:3001/api/v1/health`
  5. 执行 `docker-compose down` 清理
- **预期输出**:
  - `docker-compose ps` 显示 `app` 和 `mongodb` 服务均为 `Up`
  - `curl /api/v1/health` 返回 `{"status":"ok","timestamp":"..."}`，HTTP 200
  - `docker-compose down` 后无残留容器
- **清理**: `docker-compose down -v`

---

### TC-005: 健康检查端点可用性
- **类型**: 功能测试
- **关联验收标准**: 健康检查端点 `GET /api/health` 返回服务状态
- **前置条件**: 服务已在 docker-compose 中启动（或本地运行 `npm run dev`）
- **输入**:
  - `GET http://localhost:3001/api/v1/health`
- **执行步骤**:
  1. 发送 GET 请求到 `/api/v1/health`
  2. 检查响应状态码
  3. 检查响应体结构
- **预期输出**:
  - HTTP 状态码：200
  - 响应体包含 `status` 字段，值为 `"ok"`
  - 响应体包含 `timestamp` 字段，为 ISO 8601 格式时间字符串
  - **注意**：本端点已在 [app.ts](../../../../server/src/app.ts) 中实现（第 25 行），此测试仅验证容器环境中可正常访问
- **清理**: 无（GET 无副作用）

---

### TC-006: docker-compose 健康检查 — MongoDB 不可达时服务状态
- **类型**: 异常测试
- **关联验收标准**: 健康检查端点 — 应反映真实服务状态
- **前置条件**: 修改 docker-compose 仅启动 app（不启动 mongodb），或 MongoDB 连接配置错误
- **输入**:
  - 错误的 `MONGODB_URI`（如 `mongodb://nonexistent:27017/xxx`）
- **执行步骤**:
  1. 以错误 MongoDB URI 启动 app 容器
  2. 尝试访问 `/api/v1/health`
  3. 观察容器日志和健康检查响应
- **预期输出**:
  - 健康检查应返回服务异常状态（建议：`{"status":"error"}` 或 503）
  - 容器不应被标记为 healthy（如 docker-compose 配置了 healthcheck）
  - 服务不应崩溃退出（应有重试或优雅降级机制）
- **清理**: 恢复正确配置后重启容器

---

### TC-007: 环境变量注入 — .env.example 模板文件
- **类型**: 功能测试
- **关联验收标准**: `.env.example` 或 `.env.production` 模板文件
- **前置条件**: 无
- **输入**:
  - `.env.example` 文件（项目根目录或 `server/` 目录下）
- **执行步骤**:
  1. 检查 `.env.example` 文件是否存在
  2. 列出文件中所有环境变量键名
  3. 与 [config/index.ts](../../../../server/src/config/index.ts) 中 `config` 对象的字段进行比对
- **预期输出**:
  - 文件存在，至少包含以下变量键名（值可为示例或留空）：
    - `PORT`
    - `NODE_ENV`
    - `MONGODB_URI`
    - `JWT_SECRET`
    - `JWT_EXPIRES_IN`
    - `JWT_REFRESH_EXPIRES_IN`
    - `DEEPSEEK_API_KEY`
    - `DEEPSEEK_BASE_URL`
    - `CACHE_ENABLED`
  - 每个变量有中文或英文注释说明用途
  - 敏感值（JWT_SECRET、API_KEY）不能为真实密钥
- **清理**: 无

---

### TC-008: .env.example 缺失必需变量时的启动行为
- **类型**: 异常测试
- **关联验收标准**: 环境变量模板覆盖所有必需配置
- **前置条件**: 复制 `.env.example` 为 `.env`，故意删除 `JWT_SECRET`
- **输入**:
  - 缺少 `JWT_SECRET` 的 `.env` 文件
- **执行步骤**:
  1. 使用不完整的 `.env` 启动应用
  2. 观察启动日志
- **预期输出**:
  - 应用应能启动（当前实现使用 fallback `dev-secret`）
  - 控制台输出 `[WARN] JWT_SECRET not set, using default 'dev-secret' — this is insecure in production`
  - `.env.example` 应标注 `JWT_SECRET` 为**生产必填**
- **清理**: 无

---

### TC-009: docker-compose 数据持久化 — MongoDB volume
- **类型**: 功能测试
- **关联验收标准**: docker-compose 编排 app + 数据库
- **前置条件**: `docker-compose.yml` 已编写
- **输入**:
  - docker-compose.yml 中 mongodb 服务的 volumes 配置
- **执行步骤**:
  1. 检查 `mongodb` 服务是否声明了 named volume 或 bind mount
  2. 执行 `docker-compose up -d`
  3. 通过 app API 创建一条数据（如注册用户）
  4. 执行 `docker-compose down` 后再次 `docker-compose up -d`
  5. 查询该数据是否仍存在
- **预期输出**:
  - `mongodb` 服务有持久化 volume 配置（如 `mongo-data:/data/db`）
  - 重启后数据不丢失
- **清理**: `docker-compose down -v`（清理 volume）

---

### TC-010: CI/CD 配置 — Lint + Test + Build 流程
- **类型**: 功能测试
- **关联验收标准**: CI/CD 配置 — 代码推送 → 自动测试 → 构建镜像
- **前置条件**: CI 配置文件存在（如 `.github/workflows/ci.yml`）
- **输入**:
  - CI 配置文件内容
- **执行步骤**:
  1. 检查 CI 配置文件存在（GitHub Actions、GitLab CI 或其他）
  2. 确认至少包含以下 job/stage：
     - `lint`：执行 ESLint 检查
     - `test`：执行 `npm test`（Jest）
     - `build`：执行 `npm run build`（tsc 编译）或 Docker 镜像构建
  3. 确认触发条件为 `push` 到 `main`/`develop` 分支，以及 PR
  4. 确认使用了正确的 Node.js 版本（>=18）
- **预期输出**:
  - CI 配置文件存在
  - 包含 lint、test、build 三个关键步骤
  - Node.js 版本 >= 18
  - 触发条件覆盖 push 和 pull_request
- **清理**: 无

---

### TC-011: CI/CD 环境变量安全
- **类型**: 异常测试
- **关联验收标准**: CI/CD 配置
- **前置条件**: CI 配置文件已编写
- **输入**:
  - CI 配置文件内容
- **执行步骤**:
  1. 检查 CI 文件中是否有硬编码的密钥或数据库连接字符串
  2. 确认敏感值使用 CI secrets 变量引用（如 `${{ secrets.JWT_SECRET }}`）
  3. 确认 `.env` 文件不在 `COPY` 指令中（Dockerfile）
  4. 确认 `.dockerignore` 排除了 `.env` 文件
- **预期输出**:
  - 无硬编码密钥
  - 敏感值通过 secrets 注入
  - `.dockerignore` 包含 `.env`（或 `.env*`）
- **清理**: 无

---

### TC-012: 部署文档完整性
- **类型**: 功能测试
- **关联验收标准**: 部署文档（简要说明部署步骤）
- **前置条件**: 无
- **输入**:
  - 部署文档文件（如 `DEPLOY.md`、`docs/deploy.md` 或 README 中的部署章节）
- **执行步骤**:
  1. 检查部署文档是否存在
  2. 验证文档包含以下内容：
     - 环境要求（Docker 版本、Node.js 版本）
     - 环境变量配置说明（引用 `.env.example`）
     - `docker-compose up` 启动步骤
     - 如何验证服务启动成功（`curl /api/v1/health`）
     - 如何停止服务（`docker-compose down`）
     - SSL/HTTPS 配置说明（生产环境）
- **预期输出**:
  - 部署文档存在，内容覆盖上述 6 个要点
  - 步骤清晰可执行，新手可按文档完成部署
- **清理**: 无

---

### TC-013: .dockerignore 排除不必要文件
- **类型**: 功能测试
- **关联验收标准**: Dockerfile 生产镜像精简（隐含）
- **前置条件**: `server/.dockerignore` 或 `server/Dockerfile` 已编写
- **输入**:
  - `.dockerignore` 文件
- **执行步骤**:
  1. 检查 `.dockerignore` 存在
  2. 确认排除列表包含：
     - `node_modules`（构建阶段重新安装）
     - `dist`（构建阶段重新编译）
     - `.env` / `.env.*`（避免密钥泄露）
     - `.git`
     - `*.md`
     - `coverage/`
     - `test/` 或 `__tests__/`
- **预期输出**:
  - `.dockerignore` 文件存在
  - 排除了 `node_modules`、`.env`、`.git` 等无关/敏感文件
- **清理**: 无

---

## 测试用例统计

| 类型 | 数量 |
|------|------|
| 功能测试 | 8 |
| 边界测试 | 1 |
| 异常测试 | 3 |
| 集成测试 | 1 |
| **合计** | **13** |

---

## 测试执行顺序建议

1. TC-007 + TC-008 → 先验证环境变量模板
2. TC-001 + TC-002 + TC-013 → 再验证 Dockerfile 构建
3. TC-003 + TC-009 → 检查 docker-compose 编排
4. TC-004 + TC-005 → 一键启动 + 健康检查
5. TC-006 → 异常场景
6. TC-010 + TC-011 → CI/CD 配置
7. TC-012 → 部署文档
