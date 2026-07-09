# 英语母语者词典 — 后端架构决策记录

| 属性 | 值 |
|------|-----|
| 版本 | v1.1 |
| 状态 | 已实现 |
| 最后更新 | 2026-07-09 |
| 作者 | Claude (ADR Architect) |
| 日期 | 2026-07-07 |
| 关联文档 | [前端 ADR](./client.md)（待生成） |

## 1. 需求概述

面向中文母语者的认知语言学英语词典 APP。前端已有 Taro 3.6 + React 18 + TypeScript 完整实现（mock 数据）。本轮构建后端 API + 数据库，替换 mock 数据，接入真实 AI 词条生成。

### 核心功能

| 优先级 | 功能 |
|--------|------|
| P0 | 用户认证（手机号+密码）、首页搜索、单词详情、管理后台（词库/单词 CRUD） |
| P1 | 今日一词、词库浏览、AI 词条生成 |
| P2 | 用户学习记录 |

## 2. 跨切面决策

### 2.1 API 风格

- **选定方案**：RESTful
- **候选方案**：GraphQL
- **选择理由**：典型 CRUD 项目天然匹配 RESTful；前端现有 mock 数据结构转为 REST 调用成本最低；小程序对 REST 支持更好
- **影响范围**：后端路由使用资源导向设计，前端用 fetch/axios 调用

### 2.2 认证授权

- **选定方案**：JWT（Bearer Token）
- **候选方案**：Session + Cookie
- **选择理由**：无状态免 Redis、H5+小程序跨端通用、前端改造量小；短有效期（2h）+ Refresh Token 覆盖主动失效需求
- **影响范围**：后端 — JWT 签发/验证中间件 + 角色权限守卫；前端 — 请求拦截器自动附加 Token + 登录后 Token 持久化

### 2.3 跨域处理

- **选定方案**：Express `cors` 中间件，白名单允许 Vercel 域名
- **选择理由**：前后端分离部署（Vercel + Render），跨域不可避免；开发环境额外允许 `localhost:10086`
- **影响范围**：后端 app.ts 配置 cors origin；前端无需处理

## 3. 技术选型

### 3.1 编程语言与框架

- **选定方案**：Node.js + Express + TypeScript
- **候选方案**：Python + FastAPI / Go + Gin
- **选择理由**：全栈 TypeScript — 前后端可共享类型定义（Word、WordBank、User 等）；Express 生态最成熟，中间件丰富；AI 词条生成为远程 LLM API 调用，Node.js 完全胜任
- **运行时**：Node.js 18+ LTS

### 3.2 数据库

- **选定方案**：MongoDB Atlas（云托管）
- **候选方案**：PostgreSQL / MySQL
- **选择理由**：数据天然为文档结构（单词含内嵌引申义数组 + 搭配数组），MongoDB 嵌套文档与前端 JSON 结构一一对应；Schema 灵活，物理意象类型后续可扩展；云托管免运维

### 3.3 ODM / 数据访问层

- **选定方案**：Mongoose
- **候选方案**：Prisma / 原生 MongoDB Driver
- **选择理由**：MongoDB + Node.js 社区标配，Schema 校验匹配嵌套文档结构，Hooks 自动处理关联清理，TypeScript 支持完善

### 3.4 AI 词条生成

- **选定方案**：DeepSeek
- **候选方案**：OpenAI (GPT-4o) / Anthropic Claude
- **选择理由**：国内访问无需代理、费用低、英文能力满足认知语言学词条生成需求；支持 JSON 结构化输出；抽象 Provider 层方便未来切换
- **影响范围**：后端 — LLM Provider 抽象层 + Prompt 模板 + 生成结果缓存（相同单词不重复生成）

### 3.5 部署架构

- **选定方案**：前后端分离部署 — 前端 Vercel，后端 Render
- **项目目录**：Monorepo（client/ + server/），开发时 pnpm workspace
- **选择理由**：Vercel H5 静态托管免费额度充裕、Render 支持 Express 一键部署 + 环境变量管理、免运维
- **影响范围**：需配置 CORS；Vercel 需 `vercel.json`，Render 需 `render.yaml` 或 Dockerfile

## 4. 架构设计

### 4.1 分层架构

```
┌─────────────────────────────────┐
│         HTTP Layer               │  Express routes + middleware
├─────────────────────────────────┤
│         Service Layer            │  业务逻辑（auth, wordbank, word, ai 模块）
├─────────────────────────────────┤
│         Data Access Layer        │  Mongoose Models + Query helpers
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
│   ├── index.ts              # 入口，Express 启动
│   ├── app.ts                # Express 配置（中间件、路由挂载、Swagger）
│   ├── config/
│   │   ├── index.ts          # 环境变量 + 配置
│   │   ├── database.ts       # MongoDB 连接池管理
│   │   └── swagger.ts        # Swagger/OpenAPI 规范定义
│   ├── middleware/
│   │   ├── auth.ts           # JWT 验证 + optionalAuth + adminMiddleware
│   │   ├── rateLimit.ts      # 登录限流 + AI 生成限流
│   │   └── index.ts          # 导出 + errorHandler
│   ├── models/
│   │   ├── User.ts
│   │   ├── WordBank.ts
│   │   ├── Word.ts
│   │   ├── Collocation.ts
│   │   ├── UserFavorite.ts
│   │   ├── LearningRecord.ts
│   │   ├── DailyWord.ts
│   │   └── index.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── wordbank.routes.ts
│   │   ├── word.routes.ts
│   │   ├── ai.routes.ts
│   │   ├── user.routes.ts
│   │   ├── daily-word.routes.ts
│   │   ├── dashboard.routes.ts
│   │   └── index.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── wordbank.controller.ts
│   │   ├── word.controller.ts
│   │   ├── ai.controller.ts
│   │   ├── user.controller.ts
│   │   ├── learning.controller.ts
│   │   ├── daily-word.controller.ts
│   │   ├── dashboard.controller.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── wordbank.service.ts
│   │   ├── word.service.ts
│   │   ├── ai.service.ts
│   │   ├── ai-stream.service.ts    # SSE 流式响应
│   │   ├── daily-word.service.ts
│   │   ├── dashboard.service.ts
│   │   ├── favorite.service.ts
│   │   ├── learning.service.ts
│   │   └── index.ts
│   ├── providers/
│   │   ├── llm.ts            # LLM Provider 抽象层
│   │   └── deepseek.ts       # DeepSeek 实现
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── word.validator.ts
│   │   ├── wordbank.validator.ts
│   │   └── ai.validator.ts
│   ├── cache/
│   │   ├── cache.ts          # LRU 内存缓存
│   │   └── index.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── errors.ts
│   │   ├── asyncHandler.ts
│   │   └── index.ts
│   ├── types/
│   │   └── express.d.ts      # Express 类型扩展
│   └── seed/
│       └── index.ts          # mock 数据迁移脚本
```

### 4.3 模块职责

| 模块 | 职责 |
|------|------|
| auth | 注册、登录、JWT 签发、手机号格式校验、密码 bcrypt 加密 |
| wordbank | 词库 CRUD、按词库查询单词列表、用户词库收藏 |
| word | 单词 CRUD、搜索（单词名 + 核心义模糊匹配）、详情（含引申义/搭配）、分页 |
| ai | 词条生成（DeepSeek）、Prompt 模板渲染、结果缓存（LRU）、SSE 流式响应 |
| user | 用户列表查看（管理后台）、当前用户信息 |
| learning | 学习记录（标记已学、学习统计、连续天数） |
| favorite | 单词收藏/取消收藏、收藏列表查询 |
| daily-word | 今日一词推荐算法（加权随机，避免重复）、强制刷新 |
| dashboard | 管理后台数据概览（词库/单词/用户/收藏/学习记录实时统计） |

## 5. 接口设计

### 5.1 命名规范

- 前缀：`/api/v1`
- RESTful 资源命名：小写复数（`/wordbanks`, `/words`, `/users`）
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
| GET | /api/v1/wordbanks | 词库列表 | 无 |
| GET | /api/v1/wordbanks/:id | 词库详情 | 无 |
| GET | /api/v1/wordbanks/:id/words | 词库下单词列表 | 无 |
| POST | /api/v1/wordbanks | 新增词库 | Admin |
| PUT | /api/v1/wordbanks/:id | 编辑词库 | Admin |
| DELETE | /api/v1/wordbanks/:id | 删除词库 | Admin |

#### 单词

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/v1/words | 单词列表（支持 `?search=` 搜索） | 无 |
| GET | /api/v1/words/:id | 单词详情（含引申义+搭配） | 无 |
| POST | /api/v1/words | 新增单词 | Admin |
| PUT | /api/v1/words/:id | 编辑单词 | Admin |
| DELETE | /api/v1/words/:id | 删除单词 | Admin |

#### AI

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/v1/words/generate | AI 词条生成（传入单词名，返回完整词条 JSON） | Admin |
| POST | /api/v1/words/generate-stream | AI 词条生成（SSE 流式响应） | Admin |

#### 今日一词

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/v1/daily-word | 获取今日一词（加权随机推荐） | 无 |
| POST | /api/v1/daily-word/refresh | 强制刷新今日一词 | Admin |

#### 学习记录

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/v1/words/:id/learn | 标记单词为已学 | User |
| GET | /api/v1/users/me/learning | 学习记录列表 | User |
| GET | /api/v1/users/me/stats | 学习统计（已学数、连续天数） | User |

#### 收藏

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/v1/words/:id/favorite | 收藏单词 | User |
| DELETE | /api/v1/words/:id/favorite | 取消收藏 | User |
| GET | /api/v1/users/me/favorites | 收藏列表 | User |

#### 用户/管理

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/v1/users | 用户列表 | Admin |
| GET | /api/v1/users/me | 当前用户信息 | User |
| GET | /api/v1/admin/dashboard | 数据概览（词库/单词/用户/收藏/学习记录统计） | Admin |

## 6. 数据模型

### 6.1 核心实体关系

```
WordBank (词库)
  └── Word (单词，一对多，内嵌 ExtendedMeaning[] 和 Collocation[])
        └── ExtendedMeaning (引申义，嵌套文档)
        └── Collocation (搭配，嵌套字符串数组)

User (用户)
  ├── UserFavorite (收藏，用户-单词多对多关联)
  ├── LearningRecord (学习记录，记录已学单词和时间)
  └── DailyWord (今日一词，记录每日推荐单词)
```

### 6.2 Mongoose Schema 设计

#### User

```typescript
{
  username: string;         // 用户名
  phone: string;            // 手机号（唯一索引）
  passwordHash: string;     // bcrypt 加密
  role: 'user' | 'admin';  // 角色
  learnedWords: ObjectId[]; // 已学单词引用
  createdAt: Date;
}
```

#### WordBank

```typescript
{
  name: string;             // 词库名称（唯一索引）
  description: string;      // 词库描述
  gradient: string;         // 卡片渐变色（如 "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"）
  createdAt: Date;
}
```

#### Word

```typescript
{
  word: string;                     // 单词名（索引）
  wordbankId: ObjectId;             // 所属词库
  phonetic: string;                 // 音标
  // 核心义
  coreMeaning: string;              // 核心义描述
  coreExampleEn: string;            // 核心义英文例句
  coreExampleZh: string;            // 核心义中文翻译
  // 物理意象
  physicalImageType: string;        // 8种之一：flow/grasp/break/bear/drive/light/leverage/yield
  physicalImageDescription: string; // 物理意象描述
  // 引申义（嵌套数组）
  extendedMeanings: [{
    evolutionDescription: string;   // 逻辑演化描述
    meaning: string;                // 引申义
    partOfSpeech: string;           // 词性 (noun/verb/adj/adv/prep)
    exampleEn: string;              // 英文例句
    exampleZh: string;              // 中文翻译
  }];
  // 搭配（嵌套数组）
  collocations: string[];           // 常见搭配
  createdAt: Date;
}
```

#### UserFavorite

```typescript
{
  userId: ObjectId;            // 用户引用
  wordId: ObjectId;            // 单词引用
  createdAt: Date;
}
// 联合唯一索引：(userId, wordId)
```

#### LearningRecord

```typescript
{
  userId: ObjectId;            // 用户引用
  wordId: ObjectId;            // 单词引用
  learnedAt: Date;             // 学习时间
}
// 索引：userId + learnedAt（用于学习统计和时间范围查询）
```

#### DailyWord

```typescript
{
  wordId: ObjectId;            // 今日推荐单词引用
  date: Date;                  // 推荐日期（唯一索引）
  reason: string;              // 推荐理由
}
```

### 6.3 索引策略

| 集合 | 索引 | 类型 |
|------|------|------|
| users | `phone` | unique |
| wordbanks | `name` | unique |
| words | `word` | normal (搜索) |
| words | `wordbankId` | normal (按词库查询) |
| words | `coreMeaning` | text (全文搜索) |
| userfavorites | `(userId, wordId)` | unique compound |
| learningrecords | `(userId, learnedAt)` | compound |
| dailywords | `date` | unique |

## 7. 非功能性设计

### 安全

- **Helmet**：HTTP 安全头（CSP、X-Frame-Options、HSTS 等），开发环境放行 unsafe-inline/eval 供 Swagger UI 使用
- **密码**：bcrypt + salt（10 rounds）加密存储
- **JWT**：Access Token 2h 有效期，无 Refresh Token（当前版本）
- **手机号校验**：`^1[3-9]\d{9}$` 正则 + 长度校验
- **CORS**：白名单限 Vercel 域名 + 开发 localhost:10086
- **请求限流**：`express-rate-limit`，登录接口 15min/10次，AI 生成接口按用户 1min/10次
- **输入验证**：express-validator 校验所有写操作输入

### 性能

- MongoDB 连接池：maxPoolSize 可配置，默认 10，idleTimeout 30s
- AI 生成结果缓存：LRU 内存缓存（max 500 条），相同单词 24h 内不重复调用
- 搜索：优先精确匹配单词名索引，其次正则模糊匹配，分页默认 20 条/页
- 数据库查询优化：`lean()` 查询返回普通 JS 对象，减少 Mongoose 开销

### 可扩展性

- 无状态服务：JWT 认证确保实例可水平扩展
- LLM Provider 抽象层：`providers/llm.ts` 定义接口，切换模型只需新增 Provider 实现
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
| DeepSeek API 不稳定/输出格式波动 | AI 生成失败 | 中 | 重试机制（3次）+ 降级返回模板数据 |
| MongoDB Atlas 免费层 512MB 不够 | 需升级付费层 | 低 | 定期清理无用数据，缓存策略减少读取 |
| Render 免费层冷启动（50s 不活动） | 首次请求慢 | 中 | 考虑 UptimeRobot 定时 ping 保活 |
| 前端 mock 数据到 MongoDB 迁移遗漏 | 字段缺失 | 低 | Seed 脚本逐字段校验，冗余字段容错 |

### 权衡记录

- **选择 MongoDB 而非 PostgreSQL**：获得了嵌套文档的简洁性，放弃了关系型 JOIN 和事务能力 — 本项目不需要复杂事务
- **选择 JWT 而非 Session**：获得了无状态和水平扩展能力，放弃了服务端强制失效的便利 — 短有效期 + Refresh Token 弥补
- **选择 DeepSeek 而非 OpenAI/Claude**：获得了国内直连和低成本，放弃了一流的英文理解深度 — 本项目认知语言学内容偏结构化，对模型英文"文采"要求不高

## 9. 实施建议

### 实际实施阶段（已完成）

| 阶段 | 内容 | 实际产出 |
|------|------|---------|
| 0 | 架构决策 + 项目脚手架 | ADR 确认、Express 启动、MongoDB 连接、配置管理 |
| 1 | 数据层 | 7 个 Model（User/WordBank/Word/Collocation/UserFavorite/LearningRecord/DailyWord）+ Seed 脚本 |
| 2 | 用户认证 | 注册/登录接口 + JWT 中间件 + adminMiddleware + 登录限流 |
| 3 | 词库/单词 CRUD | 完整 CRUD API + 搜索 + 分页 + 输入验证 |
| 4 | AI 词条生成 | DeepSeek Provider + Prompt 模板 + LRU 缓存 + SSE 流式响应 |
| 5 | 增强功能 | 学习记录 + 收藏 + 今日一词推荐算法 + 管理后台概览 |
| 6 | 优化与上线 | 缓存 + Docker + CI/CD + Swagger API 文档 + Helmet 安全配置 |

### 实施依赖链

```
阶段0 (ADR+脚手架) → 阶段1 (数据层) → 阶段2 (认证)
                                           ├─→ 阶段3 (CRUD) → 阶段4 (AI)
                                           └─→ 阶段5 (增强功能) → 阶段6 (优化上线)
```
