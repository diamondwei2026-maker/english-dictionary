# 英语母语者词典 — 后端架构决策记录

| 属性 | 值 |
|------|-----|
| 版本 | v1.5 |
| 状态 | 已实现 |
| 最后更新 | 2026-08-07 |
| 作者 | Claude (ADR Architect) |
| 日期 | 2026-07-07 |
| 关联文档 | [前端 ADR](./client.md) |

## 1. 需求概述

面向中文母语者的认知语言学英语词典 APP。后端提供 REST API + MongoDB 持久化，前端为 uni-app (Vue 3) H5 应用，另有 Figma 独立原型应用 (Vite + React + shadcn/ui)。

### 核心功能

| 优先级 | 功能 | 状态 |
|--------|------|------|
| P0 | 用户认证（手机号+密码） + 忘记密码、首页搜索、单词详情、管理后台（词库/单词 CRUD + AI 生成 + 数据概览 + 用户查看） | ✅ |
| P0 | 我的笔记（二级导航 + 单词详情页内嵌笔记） | ✅ |
| P1 | 今日一词（加权随机推荐 + 管理员置顶）、词库浏览、AI 词条生成（DeepSeek 双模型两阶段管线 + SSE 流式）、学习记录、单词收藏 | ✅ |
| P2 | Docker 容器化、Swagger API 文档、CI/CD | ✅ |

## 2. 跨切面决策

### 2.1 API 风格

- **选定方案**：RESTful
- **候选方案**：GraphQL
- **选择理由**：典型 CRUD 项目天然匹配 RESTful；前端 uni-app 对 REST 支持更好
- **影响范围**：后端路由使用资源导向设计，前端用 fetch 调用

### 2.2 认证授权

- **选定方案**：JWT（Bearer Token），7d 有效期
- **候选方案**：Session + Cookie
- **选择理由**：无状态免 Redis、H5 + 小程序跨端通用；7d 有效期兼顾便利性，无 Refresh Token（当前版本）
- **影响范围**：后端 — JWT 签发/验证中间件 + 角色权限守卫（authMiddleware / adminMiddleware）；前端 — 请求拦截器自动附加 Token + localStorage 持久化

### 2.3 跨域处理

- **选定方案**：Express `cors` 中间件，白名单通过环境变量 `CORS_ORIGINS` 配置
- **选择理由**：前后端分离部署（Vercel + Render），跨域不可避免；开发环境额外允许 `localhost:10086`
- **影响范围**：后端 app.ts 配置 cors origin；前端无需处理

## 3. 技术选型

### 3.1 编程语言与框架

- **选定方案**：Node.js + Express + TypeScript
- **候选方案**：Python + FastAPI / Go + Gin
- **选择理由**：全栈 TypeScript — 前后端可共享类型定义；Express 生态最成熟，中间件丰富；AI 词条生成为远程 LLM API 调用，Node.js 完全胜任
- **运行时**：Node.js 18+ LTS，ESM 模块 (`"type": "module"`)

### 3.2 数据库

- **选定方案**：MongoDB Atlas（云托管）
- **候选方案**：PostgreSQL / MySQL
- **选择理由**：数据天然为文档结构（单词含内嵌引申义数组 + 搭配数组），MongoDB 嵌套文档与前端 JSON 结构一一对应；Schema 灵活

### 3.3 ODM / 数据访问层

- **选定方案**：Mongoose
- **候选方案**：Prisma / 原生 MongoDB Driver
- **选择理由**：MongoDB + Node.js 社区标配，Schema 校验匹配嵌套文档结构，Hooks 自动处理关联清理，TypeScript 支持完善

### 3.4 AI 词条生成

- **选定方案**：DeepSeek 双模型两阶段管线
  - **Phase 1**：DeepSeek V4 Pro（非流式，JSON 结构化输出）— 生成完整词条（IPA 音标、物理意象、核心义、引申义链、搭配）
  - **Phase 2**：DeepSeek V4 Flash — 流式文本生成（SSE 推送）+ 独立 SVG 图片生成（`regenerateImage`）
- **双 API Key 策略**：`DEEPSEEK_PRO_API_KEY`（V4 Pro）+ `DEEPSEEK_API_KEY`（V4 Flash），均通过环境变量注入
- **候选方案**：OpenAI (GPT-4o) / Anthropic Claude
- **选择理由**：V4 Pro 输出质量更高（JSON 结构化），V4 Flash 延迟更低（流式 + SVG）；国内访问无需代理；抽象 Provider 层方便未来切换
- **影响范围**：后端 — LLM Provider 抽象层 + Prompt 模板（含 SVG 专用 Prompt）+ 两阶段生成管线

### 3.5 部署架构

- **选定方案**：前后端分离部署 — 前端 Vercel，后端 Render
- **项目目录**：Monorepo（server/ + client/ + figma/）
- **选择理由**：Vercel H5 静态托管免费额度充裕、Render 支持 Express 一键部署 + 环境变量管理、免运维
- **影响范围**：需配置 CORS；Vercel 需 `vercel.json`（含 API 代理重写），Render 需 `render.yaml` 或 Dockerfile

### 3.6 缓存策略

- **选定方案**：内存缓存（MemoryCache），基于 `Map` 实现，带 TTL 过期 + 定时清理（60s）
- **接口抽象**：`CacheStore` 接口 — `get` / `set` / `del` / `delByPrefix` / `clear`，全部异步（为将来切换 Redis 预留）
- **TTL 配置**：今日一词 86400s / 词库列表 300s / 词库详情 300s / 单词详情 600s / 单词列表 300s
- **降级策略**：缓存故障静默降级（`tryCacheGet` / `tryCacheSet` / `tryCacheDel`），不影响业务
- **环境变量控制**：`CACHE_ENABLED` 可全局关闭缓存

## 4. 架构设计

### 4.1 分层架构

```
┌─────────────────────────────────┐
│         HTTP Layer               │  Express routes + middleware + validators
├─────────────────────────────────┤
│         Controller Layer         │  请求解析、响应格式化、调用 Service
├─────────────────────────────────┤
│         Service Layer            │  业务逻辑（auth, wordbank, word, ai, notes 等模块）
├─────────────────────────────────┤
│         Data Access Layer        │  Mongoose Models + Cache Store
├─────────────────────────────────┤
│         MongoDB Atlas            │  云端托管数据库
└─────────────────────────────────┘
```

### 4.2 目录结构

```
server/
├── package.json
├── tsconfig.json
├── .env.example
├── Dockerfile
├── .dockerignore
├── src/
│   ├── index.ts                  # 入口，Express 启动
│   ├── app.ts                    # Express 配置（中间件、路由挂载、Swagger）
│   ├── config/
│   │   ├── index.ts              # 环境变量 + 配置（含缓存 TTL、CORS、Rate Limit）
│   │   ├── database.ts           # MongoDB 连接池管理
│   │   └── swagger.ts            # Swagger/OpenAPI 规范定义
│   ├── middleware/
│   │   ├── auth.ts               # JWT 验证 + optionalAuth + adminMiddleware
│   │   ├── rateLimit.ts          # 登录限流 + AI 生成限流
│   │   └── index.ts              # 导出 + errorHandler
│   ├── models/
│   │   ├── User.ts               # 用户（phone 唯一索引, learnedWords + favoriteWords 数组）
│   │   ├── WordBank.ts           # 词库（name 唯一索引, slug, gradient, is_public）
│   │   ├── Word.ts               # 单词（含 coreImageSvg 字段, physicalImageType 可为空）
│   │   ├── Collocation.ts        # 搭配独立模型（phrase, meaningCn, exampleEn/Zh, wordId 引用）
│   │   ├── Note.ts               # 笔记（userId + wordId 复合索引, content ≤5000字）
│   │   ├── UserFavorite.ts       # 收藏（userId + wordId 复合唯一索引）
│   │   ├── LearningRecord.ts     # 学习记录
│   │   ├── DailyWord.ts          # 今日一词（含 isPinned/pinnedBy/pinnedAt）
│   │   └── index.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── wordbank.routes.ts
│   │   ├── word.routes.ts        # 含收藏子路由 (/:id/favorite) + 学习记录 (/:id/learn)
│   │   ├── ai.routes.ts          # /words/generate + /words/generate/stream
│   │   ├── user.routes.ts        # 用户信息 + 学习统计 + 收藏列表 + 学习记录
│   │   ├── notes.routes.ts       # 笔记 CRUD
│   │   ├── daily-word.routes.ts
│   │   ├── dashboard.routes.ts
│   │   └── index.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── wordbank.controller.ts
│   │   ├── word.controller.ts    # 含 favorite/unfavorite
│   │   ├── ai.controller.ts
│   │   ├── user.controller.ts
│   │   ├── learning.controller.ts # 含 getStats/getFavorites/getLearningRecords
│   │   ├── notes.controller.ts
│   │   ├── daily-word.controller.ts
│   │   ├── dashboard.controller.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── wordbank.service.ts
│   │   ├── word.service.ts
│   │   ├── ai.service.ts         # 非流式生成 + SVG 再生（regenerateImage）
│   │   ├── ai-stream.service.ts  # SSE 流式响应（两阶段管线）
│   │   ├── notes.service.ts
│   │   ├── favorite.service.ts
│   │   ├── learning.service.ts
│   │   ├── daily-word.service.ts
│   │   ├── dashboard.service.ts
│   │   └── index.ts
│   ├── providers/
│   │   ├── llm.ts                # LLM Provider 抽象层（LLMProvider 接口 + SSEChunk 类型）
│   │   └── deepseek.ts           # DeepSeek 实现（generateWordEntry + generateWordEntryStream + regenerateImage）
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── word.validator.ts
│   │   ├── wordbank.validator.ts
│   │   └── ai.validator.ts
│   ├── cache/
│   │   ├── cache.ts              # CacheStore 接口 + MemoryCache 实现（60s 定时清理）
│   │   └── index.ts              # 导出 + tryCacheGet/Set/Del 辅助函数
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── errors.ts
│   │   ├── asyncHandler.ts
│   │   └── index.ts
│   ├── types/
│   │   └── express.d.ts          # Express 类型扩展
│   └── seed/
│       ├── index.ts              # mock 数据迁移脚本
│       └── insert-admin.ts       # 管理员种子脚本
```

### 4.3 模块职责

| 模块 | 职责 |
|------|------|
| auth | 手机号注册、登录、JWT 签发、手机号格式校验、密码 bcrypt (10 rounds) 加密 |
| wordbank | 词库 CRUD、按词库查询单词列表、slug 自动生成、公开/私有限定 |
| word | 单词 CRUD、搜索（单词名 + 核心义模糊匹配）、详情（含引申义/搭配）、分页、收藏/取消收藏、学习记录 |
| ai | 词条生成（DeepSeek 双模型两阶段管线）、Prompt 模板渲染、SSE 流式响应、SVG 图片再生、限流 |
| notes | 笔记 CRUD（按用户+单词维度）、所有权校验（仅所有者可删）、内容 ≤5000 字 |
| user | 当前用户信息、用户列表（Admin） |
| learning | 学习记录（标记已学、学习统计、连续天数） |
| favorite | 单词收藏/取消收藏、收藏列表查询 |
| daily-word | 今日一词推荐算法（公开词库池、排除 7 天冷却窗口内单词、已登录用户优先未学单词、兜底取最久未推荐）、管理员置顶 |
| dashboard | 管理后台数据概览（词库/单词/用户/收藏/学习记录实时统计） |

## 5. 接口设计

### 5.1 命名规范

- 前缀：`/api/v1`
- RESTful 资源命名：小写复数（`/wordbanks`, `/words`, `/users`, `/notes`）
- 请求/响应：JSON
- 错误格式：`{ error: { code: string, message: string } }`

### 5.2 核心接口列表

#### 认证

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/v1/auth/register | 手机号注册 | 无 |
| POST | /api/v1/auth/login | 手机号登录 | 无 |

#### 词库

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/v1/wordbanks | 词库列表（支持 page/limit） | 无 |
| GET | /api/v1/wordbanks/:id | 词库详情 | 无 |
| GET | /api/v1/wordbanks/:id/words | 词库下单词列表 | 无 |
| POST | /api/v1/wordbanks | 新增词库 | Admin |
| PUT | /api/v1/wordbanks/:id | 编辑词库 | Admin |
| DELETE | /api/v1/wordbanks/:id | 删除词库 | Admin |

#### 单词

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/v1/words | 单词列表（`?search=` 搜索, `?wordbankId=` 筛选, page/limit） | 无 |
| GET | /api/v1/words/:id | 单词详情（含引申义+搭配+SVG） | 无 |
| POST | /api/v1/words | 新增单词 | Admin |
| PUT | /api/v1/words/:id | 编辑单词 | Admin |
| DELETE | /api/v1/words/:id | 删除单词 | Admin |
| POST | /api/v1/words/:id/learn | 标记已学 | User |
| POST | /api/v1/words/:id/favorite | 收藏单词 | User |
| DELETE | /api/v1/words/:id/favorite | 取消收藏 | User |

#### AI

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/v1/words/generate | AI 词条生成（非流式，两阶段管线，结果不持久化） | Admin |
| POST | /api/v1/words/generate/stream | AI 词条生成（SSE 流式：thinking → content* → done） | Admin |
| POST | /api/v1/words/generate/image | 仅重新生成核心义 SVG 图片 | Admin |

#### 今日一词

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/v1/daily-word | 获取今日一词（加权随机推荐，24h 缓存） | 无 |
| POST | /api/v1/daily-word/pin | 管理员置顶今日一词（当天有效） | Admin |

#### 笔记

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/v1/notes | 当前用户所有笔记（按更新时间降序） | User |
| POST | /api/v1/notes | 创建笔记（content ≤5000字，需 wordId） | User |
| DELETE | /api/v1/notes/:id | 删除笔记（仅所有者可删） | User |

#### 用户/学习/收藏

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/v1/users/me | 当前用户信息 | User |
| GET | /api/v1/users/stats | 学习统计（已学数/学习天数/收藏数） | User |
| GET | /api/v1/users/favorites | 收藏单词列表 | User |
| GET | /api/v1/users/learning-records | 学习记录列表（含分页） | User |
| GET | /api/v1/users | 用户列表（含学习数据） | Admin |

#### 管理后台

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/v1/admin/dashboard | 数据概览（词库/单词/用户实时统计） | Admin |

#### 健康检查

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/v1/health | 服务状态 + 时间戳 | 无 |

## 6. 数据模型

### 6.1 核心实体关系

```
WordBank (词库)
  └── Word (单词，一对多，内嵌 ExtendedMeaning[] 和 collocations: string[])
        └── ExtendedMeaning (引申义，嵌套子文档)
        └── Collocation (搭配独立模型，wordId 引用回 Word)
        └── Note (笔记，userId + wordId 双索引)

User (用户)
  ├── learnedWords (已学单词 ID 数组)
  ├── favoriteWords (收藏单词 ID 数组)
  ├── UserFavorite (收藏关联模型，userId + wordId 复合唯一索引)
  ├── Note → userId + wordId
  ├── LearningRecord (学习记录，userId + wordId)
  └── DailyWord (今日一词，date 唯一索引，支持 isPinned)
```

### 6.2 核心 Schema 设计

#### User

```typescript
{
  username: string;                   // 用户名
  phone: string;                      // 手机号（唯一索引，正则 /^1[3-9]\d{9}$/）
  passwordHash: string;               // bcrypt 加密（10 rounds）
  role: 'user' | 'admin';            // 角色
  learnedWords: ObjectId[];           // 已学单词引用
  favoriteWords: ObjectId[];          // 收藏单词引用
  createdAt: Date;
  updatedAt: Date;
}
```

#### WordBank

```typescript
{
  name: string;                       // 词库名称（唯一索引）
  slug: string;                       // URL 友好标识
  description: string;                // 词库描述
  cover_image: string;                // 封面图 URL
  gradient: string;                   // 卡片渐变色
  is_public: boolean;                 // 是否公开（默认 true）
  wordIds: ObjectId[];                // 🆕 2026-08-07 前端已先行（M:N 关系），后端待实现
  createdAt: Date;
  updatedAt: Date;
}
```

> **计划变更（2026-08-07）**：Word ↔ WordBank 关系从 1:N（Word 持有 `wordbankId`）改为 M:N（WordBank 持有 `wordIds: ObjectId[]`）。
> 前端已移除 `Word.libraryId` 并在 `WordLibrary` 新增 `wordIds: string[]`，管理后台新增"管理单词"功能。
> 后端需同步：WordBank Model 新增 `wordIds` 字段、新增 `/api/v1/wordbanks/:id/words` 的 PUT/DELETE 端点（管理 wordIds 数组）、逐步废弃 Word 文档的 `wordbankId` 字段。

#### Word

```typescript
{
  word: string;                       // 单词名
  wordbankId: ObjectId;               // 所属词库（联合唯一索引 wordbankId+word）
  phonetic?: string;                  // 音标
  // 核心义
  coreMeaning: string;
  coreExampleEn: string;
  coreExampleZh: string;
  // 物理意象（可为空字符串 — 功能词无物理意象）
  physicalImageType: 'flow' | 'grasp' | 'break' | 'bear' | 'drive' | 'light' | 'leverage' | 'yield' | '';
  physicalImageDescription: string;   // 物理意象描述（可为空）
  coreImageSvg?: string;              // AI 生成的 SVG 图示
  // 引申义（嵌套子文档数组）
  extendedMeanings: [{
    evolutionDescription: string;
    meaning: string;
    partOfSpeech: 'noun' | 'verb' | 'adj' | 'adv' | 'prep' | 'conj' | 'pron' | 'other';
    exampleEn: string;
    exampleZh: string;
  }];
  // 搭配（嵌入字符串数组，另有独立 Collocation 模型）
  collocations: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Collocation（独立模型）

```typescript
{
  phrase: string;                     // 搭配短语
  meaningCn: string;                  // 中文释义
  exampleEn: string;                  // 英文例句
  exampleZh: string;                  // 中文翻译
  wordId: ObjectId;                   // 所属单词引用
  createdAt: Date;
  updatedAt: Date;
}
```

#### Note

```typescript
{
  userId: ObjectId;                   // 用户引用
  wordId: ObjectId;                   // 单词引用
  content: string;                    // 笔记内容（trim, max 5000）
  likedBy: ObjectId[];                // 点赞用户 ID 数组（引用 User 集合）
  createdAt: Date;
  updatedAt: Date;
}
// 索引：userId, wordId, (userId + wordId) 复合索引
```

#### UserFavorite

```typescript
{
  userId: ObjectId;                   // 用户引用
  wordId: ObjectId;                   // 单词引用
  createdAt: Date;
  updatedAt: Date;
}
// 联合唯一索引：(userId, wordId)
```

#### LearningRecord

```typescript
{
  userId: ObjectId;                   // 用户引用
  wordId: ObjectId;                   // 单词引用
  learnedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### DailyWord

```typescript
{
  wordId: ObjectId;                   // 今日推荐单词引用
  date: Date;                         // 推荐日期（唯一索引）
  isPinned: boolean;                  // 是否管理员置顶
  pinnedBy: ObjectId;                 // 置顶管理员 ID
  pinnedAt: Date;                     // 置顶时间
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.3 索引策略

| 集合 | 索引 | 类型 |
|------|------|------|
| users | `phone` | unique |
| wordbanks | `name` | unique |
| words | `(wordbankId, word)` | unique compound |
| words | `word` | normal (搜索) |
| words | `wordbankId` | normal (按词库查询) |
| words | `coreMeaning` | text (全文搜索) |
| collocations | `wordId` | normal |
| notes | `userId` | normal |
| notes | `wordId` | normal |
| notes | `(userId, wordId)` | compound |
| userfavorites | `(userId, wordId)` | unique compound |
| learningrecords | `(userId, learnedAt)` | compound |
| dailywords | `date` | unique |

## 7. 非功能性设计

### 安全

- **Helmet**：HTTP 安全头（CSP、X-Frame-Options、HSTS 等），开发环境放行 unsafe-inline/eval 供 Swagger UI 使用
- **密码**：bcrypt + salt（10 rounds）加密存储
- **JWT**：7d 有效期，环境变量 `JWT_SECRET` + `JWT_EXPIRES_IN` 可配置
- **手机号校验**：`^1[3-9]\d{9}$` 正则（前后端双重校验）
- **CORS**：白名单通过 `CORS_ORIGINS` 环境变量配置
- **请求限流**：`express-rate-limit`，登录 15min/10 次，AI 生成按用户 1min/10 次（环境变量可配置）
- **输入验证**：express-validator 校验所有写操作输入
- **笔记所有权**：删除笔记校验 `userId`，禁止越权操作
- **SVG 安全清洗**：移除 `<script>`、`on*` 事件属性、`<foreignObject>`，防止 XSS

### 性能

- MongoDB 连接池：maxPoolSize 默认 10，idleTimeout 30s，connectTimeout 10s（环境变量可配置）
- 缓存：MemoryCache 内存缓存（Map + TTL + 60s 定时清理），今日一词 24h、单词详情 10min、列表类 5min
- 缓存降级：缓存故障静默忽略，回退到 DB 查询（`tryCacheGet` / `tryCacheSet`）
- 搜索：优先精确匹配单词名索引，其次正则模糊匹配，分页默认 20 条/页
- 数据库查询优化：`lean()` 查询返回普通 JS 对象，减少 Mongoose 开销
- AI 生成：流式响应独立 AbortController 60s 超时

### 可扩展性

- 无状态服务：JWT 认证确保实例可水平扩展
- LLM Provider 抽象层：`LLMProvider` 接口 + `createLLMProvider` 工厂，切换模型只需新增 Provider 实现
- 缓存抽象层：`CacheStore` 接口，替换为 Redis 只需实现相同接口
- API 版本前缀 `/api/v1`：后续可引入 v2 不改动旧路由
- Controller-Service-Route 三层分离：业务逻辑集中在 Service 层

### 可观测性

- 日志：`morgan` HTTP 请求日志（dev/combined 模式）
- 健康检查：`GET /api/v1/health` 返回状态 + 时间戳
- API 文档：Swagger UI（`/api/docs`）+ OpenAPI JSON Spec（`/api/docs/json`）
- 开发调试：`mongoose.set('debug', true)` 输出查询日志

## 8. 风险与权衡

| 风险 | 影响 | 概率 | 应对 |
|------|------|------|------|
| DeepSeek API 不稳定/输出格式波动 | AI 生成失败 | 中 | 重试机制 + SVG 生成失败降级（仅无图） |
| MongoDB Atlas 免费层 512MB 不够 | 需升级付费层 | 低 | 定期清理无用数据，缓存策略减少读取 |
| Render 免费层冷启动（50s 不活动） | 首次请求慢 | 中 | 考虑 UptimeRobot 定时 ping 保活 |
| SSE 流式响应中断 | 客户端收到不完整数据 | 低 | 三处根因已修复（AbortController 超时 + 解析容错 + buffer 边界） |

### 权衡记录

- **选择 MongoDB 而非 PostgreSQL**：获得了嵌套文档的简洁性，放弃了关系型 JOIN 和事务能力 — 本项目不需要复杂事务
- **选择 JWT 而非 Session**：获得了无状态和水平扩展能力，放弃了服务端强制失效的便利 — 7d 有效期平衡便利与安全
- **选择 DeepSeek V4 Pro + V4 Flash 双模型而非单一模型**：获得了 JSON 结构化输出质量 + 流式低延迟的组合优势，付出双 API Key 管理复杂度
- **选择内存缓存而非 Redis**：获得了零运维成本，放弃了跨实例缓存共享 — 单实例部署下无影响
- **物理意象可选化**：功能词（如 for, of, if）`physicalImageType` 为空字符串，AI 不再强行编造物理意象 — 保证了认知语言学内容的严谨性

## 9. 实施建议

### 实施阶段（已完成）

| 阶段 | 内容 | 实际产出 |
|------|------|---------|
| 0 | 架构决策 + 项目脚手架 | ADR 确认、Express 启动、MongoDB 连接、配置管理 |
| 1 | 数据层 | 8 个 Model（User/WordBank/Word/Collocation/Note/UserFavorite/LearningRecord/DailyWord）+ Seed 脚本 |
| 2 | 用户认证 | 注册/登录接口 + JWT 中间件 + adminMiddleware + 登录限流 |
| 3 | 词库/单词 CRUD | 完整 CRUD API + 搜索 + 分页 + 输入验证 + 收藏/学习记录 |
| 4 | AI 词条生成 | DeepSeek 双模型两阶段管线 + SSE 流式 + SVG 再生 + 限流 |
| 5 | 增强功能 | 笔记 CRUD + 今日一词推荐算法（加权随机+置顶）+ 管理后台概览 + 忘记密码 |
| 6 | 优化与上线 | 缓存（MemoryCache）+ Docker + CI/CD + Swagger + Helmet + ESM 兼容性修复 |

### 实施依赖链

```
阶段0 (ADR+脚手架) → 阶段1 (数据层) → 阶段2 (认证)
                                           ├─→ 阶段3 (CRUD) → 阶段4 (AI)
                                           └─→ 阶段5 (增强功能) → 阶段6 (优化上线)
```
