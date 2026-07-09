# Coding Prompt — Task 6.3: API 文档与安全配置

## 1. 任务目标

为后端 API 集成 OpenAPI/Swagger 交互式文档，配置生产环境安全策略（Helmet 安全头、CORS 白名单、Rate Limit 限流），完善环境变量配置并执行安全审计。

## 2. 技术上下文

- **语言/框架**: Node.js 18+ / Express 4.21 + TypeScript 5.5
- **现有安全设施**: `cors` 中间件（已有，支持 env 区分环境）、JWT 认证中间件、全局错误处理
- **现有路由**: auth, wordbank, word, ai, daily-word, dashboard, user（均挂载在 `/api/v1`）
- **外部依赖**（需安装）:
  - `swagger-jsdoc` — 从 JSDoc 注释生成 OpenAPI spec
  - `swagger-ui-express` — 托管 Swagger UI 页面
  - `helmet` — HTTP 安全头
  - `express-rate-limit` — 请求速率限制
- **类型定义**（devDependencies）:
  - `@types/swagger-jsdoc`
  - `@types/swagger-ui-express`
  - `@types/express-rate-limit`

### 涉及文件

| 操作 | 路径 | 说明 |
|------|------|------|
| **新建** | `server/src/config/swagger.ts` | OpenAPI 定义（所有端点、Schema、认证标注） |
| **新建** | `server/src/middleware/rateLimit.ts` | 登录限流器 + AI 限流器 |
| **修改** | `server/src/app.ts` | 挂载 Swagger UI、Helmet、Rate Limit、增强 CORS |
| **修改** | `server/src/middleware/index.ts` | 导出 rateLimit 中间件 |
| **修改** | `server/.env.example` | 完整环境变量列表 |
| **修改** | `.env.example` (根目录) | 补充缺失变量 |
| **修改** | `server/package.json` | 新增 4 个依赖 + 3 个 dev 依赖 |

## 3. 实现要求

### 3.1 SUB-6.3.1: Swagger/OpenAPI 文档

#### 3.1.1 安装依赖

```bash
cd server
npm install swagger-jsdoc swagger-ui-express
npm install -D @types/swagger-jsdoc @types/swagger-ui-express
```

#### 3.1.2 新建文件 `server/src/config/swagger.ts`

- **职责**: 定义 OpenAPI 3.0 规范，包含所有 API 端点
- **导出**: `swaggerSpec: object` — 已初始化的 OpenAPI spec 对象

**结构规范**:
```typescript
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "英语母语者词典 API",
      version: "1.0.0",
      description: "面向中文母语者的认知语言学英语词典后端 API",
    },
    servers: [
      { url: "http://localhost:3001", description: "开发环境" },
      { url: "https://english-dictionary.onrender.com", description: "生产环境" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // 见下方 Schema 定义
      },
    },
    security: [], // 默认无需认证，端点可按需覆盖
  },
  apis: ["./src/routes/*.ts"], // 从路由文件 JSDoc 注释提取
};

export const swaggerSpec = swaggerJsdoc(options);
```

**注意**: 为避免 `apis` glob 解析失败（tsx 环境），同时采用在 `swagger.ts` 中**内联定义所有路径**的方式，不使用 JSDoc 注释扫描。即在 `definition` 中直接写入 `paths: { ... }`。

##### 内联路径定义（paths）

必须覆盖以下全部端点 Group，按 Tag 分类：

**Tag: Auth**
- `POST /api/v1/auth/register` — 用户注册
  - security: `[]`
  - requestBody: `{ username: string, email: string, password: string }`
  - responses: 201 `{ token, user }` / 409 邮箱已注册
- `POST /api/v1/auth/login` — 用户登录
  - security: `[]`
  - requestBody: `{ email: string, password: string }`
  - responses: 200 `{ token, user }` / 401 认证失败

**Tag: Users**
- `GET /api/v1/users/me` — 当前用户信息
  - security: `[{ bearerAuth: [] }]`
  - responses: 200 `User` / 401
- `GET /api/v1/users/stats` — 用户学习统计
  - security: `[{ bearerAuth: [] }]`
  - responses: 200 `{ learnedWords, studiedDays, favorites }`
- `GET /api/v1/users/favorites` — 用户收藏列表
  - security: `[{ bearerAuth: [] }]`
  - responses: 200 `Word[]`
- `GET /api/v1/users/learning-records` — 学习记录列表
  - security: `[{ bearerAuth: [] }]`
  - responses: 200 `LearningRecord[]`

**Tag: Wordbanks**
- `GET /api/v1/wordbanks` — 词库列表（公开）
  - security: `[]`
  - parameters: 分页（page, limit）
  - responses: 200 `{ data: WordBank[], pagination }`
- `GET /api/v1/wordbanks/{id}` — 词库详情（公开）
  - security: `[]`
  - parameters: id (path, string)
  - responses: 200 `WordBank` / 404
- `GET /api/v1/wordbanks/{id}/words` — 词库下单词列表（公开）
  - security: `[]`
  - parameters: id (path, string), 分页
  - responses: 200 `{ data: Word[], pagination }`
- `POST /api/v1/wordbanks` — 新增词库（Admin）
  - security: `[{ bearerAuth: [] }]`
  - requestBody: `{ name, description?, gradient? }`
  - responses: 201 `WordBank` / 401 / 403
- `PUT /api/v1/wordbanks/{id}` — 编辑词库（Admin）
  - security: `[{ bearerAuth: [] }]`
  - responses: 200 `WordBank` / 401 / 403 / 404
- `DELETE /api/v1/wordbanks/{id}` — 删除词库（Admin）
  - security: `[{ bearerAuth: [] }]`
  - responses: 200 `{ message }` / 401 / 403 / 404

**Tag: Words**
- `GET /api/v1/words` — 单词列表（公开，支持搜索）
  - security: `[]`
  - parameters: page, limit, search?, wordbankId?
  - responses: 200 `{ data: Word[], pagination }`
- `GET /api/v1/words/{id}` — 单词详情（公开）
  - security: `[]`
  - responses: 200 `Word` / 404
- `POST /api/v1/words` — 新增单词（Admin）
  - security: `[{ bearerAuth: [] }]`
  - requestBody: Word 对象（含嵌套 extendedMeanings、collocations）
  - responses: 201 `Word` / 401 / 403
- `PUT /api/v1/words/{id}` — 编辑单词（Admin）
  - security: `[{ bearerAuth: [] }]`
  - responses: 200 `Word` / 401 / 403 / 404
- `DELETE /api/v1/words/{id}` — 删除单词（Admin）
  - security: `[{ bearerAuth: [] }]`
  - responses: 200 `{ message }` / 401 / 403 / 404
- `POST /api/v1/words/{id}/learn` — 记录学习（需登录）
  - security: `[{ bearerAuth: [] }]`
  - responses: 200 `{ message }` / 401 / 404
- `POST /api/v1/words/{id}/favorite` — 收藏单词（需登录）
  - security: `[{ bearerAuth: [] }]`
  - responses: 200 `{ message }` / 401 / 404
- `DELETE /api/v1/words/{id}/favorite` — 取消收藏（需登录）
  - security: `[{ bearerAuth: [] }]`
  - responses: 200 `{ message }` / 401 / 404

**Tag: AI**
- `POST /api/v1/words/generate` — AI 词条生成（Admin）
  - security: `[{ bearerAuth: [] }]`
  - requestBody: `{ word: string }`
  - responses: 200 `Word` / 401 / 403 / 429
- `POST /api/v1/words/generate/stream` — AI 词条生成 SSE 流式（Admin）
  - security: `[{ bearerAuth: [] }]`
  - requestBody: `{ word: string }`
  - responses: 200 (text/event-stream) / 401 / 403 / 429

**Tag: Daily Word**
- `GET /api/v1/daily-word` — 今日一词（公开）
  - security: `[]`
  - responses: 200 `{ word: Word, isPinned }`
- `POST /api/v1/daily-word/pin` — 置顶今日一词（Admin）
  - security: `[{ bearerAuth: [] }]`
  - responses: 200 / 401 / 403

**Tag: Dashboard**
- `GET /api/v1/admin/dashboard` — 管理后台数据概览（Admin）
  - security: `[{ bearerAuth: [] }]`
  - responses: 200 `{ wordbankCount, wordCount, userCount, recentWords, ... }`

**Tag: Health**
- `GET /api/v1/health` — 健康检查（公开）
  - security: `[]`
  - responses: 200 `{ status: "ok", timestamp }`

##### Components > Schemas 定义

在 `components.schemas` 中定义以下 Schema，路径定义中通过 `$ref` 引用：

- **User**: `{ username, email, role, createdAt }`
- **WordBank**: `{ id, name, description, gradient, wordCount?, createdAt }`
- **Word**: `{ id, word, phonetic, coreMeaning, coreExampleEn, coreExampleZh, physicalImageType, physicalImageDescription, extendedMeanings[], collocations[], wordbankId, createdAt }`
- **ExtendedMeaning**: `{ evolutionDescription, meaning, partOfSpeech, exampleEn, exampleZh }`
- **Error**: `{ error: { code: string, message: string } }`
- **Pagination**: `{ page, limit, total, totalPages }`

#### 3.1.3 修改文件 `server/src/app.ts` — 挂载 Swagger UI

在 `createApp()` 函数中，**在所有路由之前**添加：

```typescript
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

// Swagger API 文档
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "英语母语者词典 API 文档",
}));

// 同时提供 JSON 格式的 spec（方便导入 Postman/Insomnia）
app.get("/api/docs/json", (_req, res) => {
  res.json(swaggerSpec);
});
```

**重要**: Swagger UI 静态资源挂载需放在 Helmet 之后但在 routes 之前，确保 CSP 不阻止 Swagger UI 的 CSS/JS 加载。

### 3.2 SUB-6.3.2: 安全策略配置

#### 3.2.1 安装依赖

```bash
cd server
npm install helmet express-rate-limit
npm install -D @types/express-rate-limit
```

#### 3.2.2 新建文件 `server/src/middleware/rateLimit.ts`

- **职责**: 提供登录接口和 AI 接口的限流中间件

```typescript
import rateLimit from "express-rate-limit";

// 登录接口限流：10 次/分钟/IP
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 分钟窗口
  max: 10,                    // 最多 10 次
  standardHeaders: true,      // 返回 RateLimit-* 头
  legacyHeaders: false,       // 禁用 X-RateLimit-* 头
  message: {
    error: {
      code: "RATE_LIMIT",
      message: "登录请求过于频繁，请稍后再试",
    },
  },
  keyGenerator: (req) => {
    // 基于 IP（信任 X-Forwarded-For，因为 Render 有反向代理）
    return req.ip || req.socket.remoteAddress || "unknown";
  },
});

// AI 生成接口限流：5 次/分钟/用户
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMIT",
      message: "AI 生成请求过于频繁，请稍后再试",
    },
  },
  keyGenerator: (req) => {
    // 基于用户 ID（从 JWT 解析的 req.user 获取），未认证则退化为 IP
    const userId = (req as any).user?.id;
    return userId || req.ip || "unknown";
  },
});
```

#### 3.2.3 修改文件 `server/src/middleware/index.ts`

在现有 export 中添加：

```typescript
export { loginLimiter, aiLimiter } from "./rateLimit";
```

**注意**: 如果 `rateLimit.ts` 尚不存在，此步在创建文件后执行。

#### 3.2.4 修改文件 `server/src/app.ts` — 集成安全中间件

对 `createApp()` 进行以下修改（**按顺序**）：

1. **Helmet**（最优先，在 cors 之前）:

```typescript
import helmet from "helmet";

// Helmet 安全头 — 注意 CSP 需放行 Swagger UI
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "data:"],
      },
    },
  })
);
```

`'unsafe-inline'` 和 `'unsafe-eval'` 仅用于开发环境 Swagger UI。生产环境可收紧：

```typescript
const isDev = process.env.NODE_ENV !== "production";
app.use(
  helmet({
    ...(isDev ? {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "data:"],
        },
      },
    } : {}),
  })
);
```

2. **增强 CORS 配置**（替换现有的简化版）:

```typescript
import cors from "cors";

// CORS — 通过环境变量扩展白名单域名
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
  : ["http://localhost:10086", "http://localhost:3001"];

// 生产环境额外允许部署域名
if (process.env.NODE_ENV === "production") {
  ALLOWED_ORIGINS.push("https://english-dictionary.vercel.app");
}

app.use(
  cors({
    origin: (origin, callback) => {
      // 开发工具（curl/Postman）无 origin → 放行
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false); // 拒绝但返回 200，浏览器端 CORS 报错
      }
    },
    credentials: true,
  })
);
```

3. **在路由挂载前应用 Rate Limit**:

```typescript
import { loginLimiter, aiLimiter } from "./middleware";

// 登录接口限流 — 通过 path 匹配，在路由前应用
app.use("/api/v1/auth/login", loginLimiter);

// AI 生成接口限流
app.use("/api/v1/words/generate", aiLimiter);
```

**注意**: `app.use(path, middleware)` 会同时匹配 path 及其子路径。`/api/v1/words/generate` 也会匹配 `/api/v1/words/generate/stream`，这符合预期（两者共用 AI 限流配额）。

4. **信任代理**（在 express.json() 之前，Rate Limit 之后）:

Render 部署时有反向代理，需设置：

```typescript
app.set("trust proxy", 1);
```

### 3.3 SUB-6.3.3: 环境变量与安全检查

#### 3.3.1 修改文件 `server/.env.example`

**完整重写**，包含所有必需和可选环境变量，标注分组和说明：

```
# ============================================
# English Dictionary Server — 环境变量配置
# ============================================
# 使用方式：
#   cp .env.example .env
#   编辑 .env 填入真实值
# ============================================

# ---- 基础配置 ----
PORT=3001                          # 服务端口
NODE_ENV=development               # 运行环境: development | production

# ---- 数据库 ----
MONGODB_URI=mongodb://localhost:27017/english-dictionary
DB_MAX_POOL_SIZE=10                # 连接池最大连接数（可选）
DB_IDLE_TIMEOUT_MS=30000           # 空闲连接超时 ms（可选）
DB_CONNECT_TIMEOUT_MS=10000        # 连接超时 ms（可选）

# ---- JWT 认证 ----
# ⚠️ 生产环境必须修改为安全随机字符串！
# 生成方式：node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=2h                  # Access Token 有效期
JWT_REFRESH_EXPIRES_IN=7d          # Refresh Token 有效期

# ---- AI 词条生成（DeepSeek）----
DEEPSEEK_API_KEY=your-api-key      # DeepSeek API 密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# ---- CORS ----
# 多个域名用英文逗号分隔（可选，默认允许 localhost:10086 和 localhost:3001）
# CORS_ORIGINS=http://localhost:10086,http://localhost:3001,https://your-frontend.vercel.app

# ---- 缓存 ----
CACHE_ENABLED=true                 # 是否启用缓存
CACHE_TTL_DAILY_WORD=86400         # 今日一词缓存 TTL（秒）
CACHE_TTL_WORDBANK_LIST=300        # 词库列表缓存 TTL
CACHE_TTL_WORDBANK_DETAIL=300      # 词库详情缓存 TTL
CACHE_TTL_WORD_DETAIL=600          # 单词详情缓存 TTL
CACHE_TTL_WORD_LIST=300            # 单词列表缓存 TTL
```

#### 3.3.2 修改文件 `.env.example` (根目录)

与 `server/.env.example` 保持同步，确保**两个文件内容一致**。根目录的 `.env.example` 已较完整，确保补充 `CORS_ORIGINS` 变量说明。

#### 3.3.3 安全审计 — `.gitignore` 验证

检查以下文件/目录已在 `.gitignore` 或 `server/.gitignore` 中排除：
- `.env` ✅（根目录 + server 均已配置）
- `.env.local` ✅（根目录已配置）
- `dist/` ✅（根目录 + server 均已配置）
- `node_modules/` ✅
- IDE 配置 (`.vscode/`, `.idea/`) ✅
- 日志文件 (`*.log`) ✅
- `coverage/` ✅

**无需修改**，当前 `.gitignore` 配置完整。

#### 3.3.4 安全审计 — 硬编码敏感信息检查

在 `server/src/` 目录中执行检查，确认：
- 无硬编码的 `JWT_SECRET`、API Key、数据库密码
- 所有密钥通过 `process.env.*` 或 `config` 模块读取
- `config/index.ts` 中的 fallback 默认值仅用于开发环境

## 4. 代码规范要求

- 使用 TypeScript 类型标注，禁止 `any`（除非 express-rate-limit 的 req 扩展字段）
- 遵循现有的错误格式 `{ error: { code: string, message: string } }`
- import 顺序：第三方库 → 项目内模块（相对路径）
- 命名：中间件使用 camelCase（`loginLimiter`, `aiLimiter`）
- Swagger spec 中 tag 名称与路由分组一致：Auth, Users, Wordbanks, Words, AI, Daily Word, Dashboard, Health
- 服务端入口 `index.ts` **不需要修改**，所有中间件在 `app.ts` 中配置

## 5. 测试要求

代码必须能通过 [test-cases.md](./test-cases.md) 中的测试用例：

| 测试编号 | 测试内容 | 关键要求 |
|----------|----------|----------|
| TC-001 | API 文档页面可访问 | `/api/docs` 返回 200，渲染 Swagger UI |
| TC-002 | 所有端点均在文档中列出 | 8 个 Tag 分组 + 全部端点 |
| TC-003 | 端点标注请求/响应 Schema | register/wordbanks/words 有完整 Schema |
| TC-004 | 认证端点标注清晰 | 区分公开/需登录/Admin 三种级别 |
| TC-005 | CORS 开发环境允许本地 | `Origin: localhost:10086` → 允许 |
| TC-006 | CORS 生产环境拒绝非白名单 | 非白名单 Origin → CORS 拒绝 |
| TC-007 | CORS 生产环境允许白名单 | Vercel 域名 → 允许 |
| TC-008 | 登录 Rate Limit | 11 次/分钟 → 第 11 次 429 |
| TC-009 | AI Rate Limit | 6 次/分钟 → 第 6 次 429 |
| TC-010 | Rate Limit 区分用户 | 用户 A 超限不影响用户 B |
| TC-011 | Helmet 安全头 | X-Content-Type-Options, X-Frame-Options 等 |
| TC-012 | Swagger UI 不被 CSP 阻止 | 正常渲染 + "Try it out" 可用 |
| TC-013 | .env.example 完整 | 所有变量有说明 |
| TC-014 | .env 在 .gitignore | 无 .env 被 Git 追踪 |
| TC-015 | dist/ 未提交 | 无构建产物被 Git 追踪 |
| TC-016 | 无硬编码密钥 | 所有敏感值来自 process.env |
| TC-017 | .env.example 安全提示 | JWT_SECRET 默认值为 change-me |
| TC-018 | 异常路径 404 | 结构化错误 + 安全头存在 |
| TC-019 | 生产环境不泄露细节 | 500 不暴露堆栈 |
| TC-020 | 文档端点不限流 | 20 次请求均 200 |

## 6. 实施步骤（按顺序执行）

1. 安装依赖：`npm install swagger-jsdoc swagger-ui-express helmet express-rate-limit` + `npm install -D @types/swagger-jsdoc @types/swagger-ui-express @types/express-rate-limit`
2. 创建 `server/src/config/swagger.ts` — 完整 OpenAPI 定义（内联 paths，不使用 JSDoc 扫描）
3. 创建 `server/src/middleware/rateLimit.ts` — loginLimiter + aiLimiter
4. 修改 `server/src/middleware/index.ts` — 导出新中间件
5. 修改 `server/src/app.ts` — 按顺序集成 Helmet → CORS → trust proxy → Rate Limit → Swagger UI → routes
6. 修改 `server/.env.example` — 完整重写
7. 修改 `.env.example` — 与 server 版本同步
8. 验证：运行 `npm run dev`，访问 `/api/docs` 确认文档正常渲染
9. 验证：重复请求 `/api/v1/auth/login` 11 次，确认第 11 次返回 429

## 7. 注意事项

- **顺序敏感**：Helmet 必须最先注册；trust proxy 必须在 rate-limit 之前；Swagger UI 必须在路由之前
- **Helmet + Swagger UI**：Helmet 默认 CSP 阻止 inline script/style，必须配置 CSP directives 放行 `'unsafe-inline'`，否则 Swagger UI 白屏
- **trust proxy**：Render 部署时有 Nginx 反向代理，不加 `trust proxy` 会导致 `req.ip` 返回 127.0.0.1，Rate Limit 基于 IP 将失效
- **express-rate-limit v7+**：`keyGenerator` 用于自定义限流键（AI 按用户 ID），`standardHeaders`/`legacyHeaders` 控制响应头格式
- **Swagger spec 内联**：由于 tsx 运行时 JSDoc 注释可能丢失，采用 swagger.ts 中内联定义所有路径的方式，不使用 `apis` glob 扫描
- **两个 `.env.example`**：根目录和 server/ 下各有一个，需要同时更新保持一致。根目录的是给开发者看的概览，server 的是 Docker/部署用的详细版
- **仅修改后端**：本 Task 不涉及前端代码修改
