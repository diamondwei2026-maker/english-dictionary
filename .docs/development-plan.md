# 短句翻译训练模块后端 — 开发计划

| 属性 | 值 |
|------|-----|
| 版本 | v1.0 |
| 创建日期 | 2026-08-06 |
| 需求标识 | training-backend |
| 关联 PRD | [PRD](../.docs/prd/prd.md) (F-11 短句翻译训练) |
| 关联 ADR | [后端](../.docs/adr/server.md) / [前端](../.docs/adr/client.md) |
| 来源 | Figma 同步差异分析 (HAS-GAP-DESIGN) |

## 1. 项目概述

为英语词典 APP 的**短句翻译训练模块**开发后端 API。前端（client/）已完成完整的训练 UI（训练首页 + 答题页 + 判分反馈），但使用 20 条硬编码 mock 题目 + 纯前端判分引擎。本轮开发将其升级为真实 API 驱动的训练模块：题目从数据库获取、判分由服务端执行、答题记录持久化。

## 2. 技术栈概要

| 层次 | 选型 |
|------|------|
| 后端 | Node.js + Express + TypeScript (ESM) |
| 数据库 | MongoDB Atlas + Mongoose |
| 认证 | JWT (optionalAuth — 训练页无需登录亦可访问) |
| 部署 | Render (server/) |

## 3. 现状分析

| 层次 | 现状 |
|------|------|
| 前端 UI | ✅ 已完成：`pages/training/training.vue`（训练首页）、`pages/quiz/quiz.vue`（答题页）、底部导航「训练」Tab |
| 题目数据 | ⚠️ `data/quizEngine.ts` 含 20 条硬编码 mock 题目（`mockQuizItems`） |
| 判分逻辑 | ⚠️ `data/quizEngine.ts` 纯前端 `judgeAnswer()`：关键词命中率 70% + LCS 30% |
| 后端 API | ❌ 无 quiz/training 相关路由、控制器、服务、模型 |
| 答题记录 | ❌ 无持久化，结果页离开即丢失 |

## 4. 开发阶段

### 阶段 0：数据模型 + 种子数据

**目标**：建立 QuizQuestion 和 QuizAttempt 两个 MongoDB 模型，将 20 条 mock 题目迁移入库

**预计产出**：
- [x] `server/src/models/QuizQuestion.ts` — 题目模型（prompt, hint, direction, reference, keywords, analysis, wordId, wordbankId）
- [x] `server/src/models/QuizAttempt.ts` — 答题记录模型（userId, questionId, userInput, score, correct, matched, missing, submittedAt; userId + questionId 复合索引）
- [x] `server/src/models/index.ts` — 导出新模型
- [x] `server/src/seed/` — 更新种子脚本，写入 20 条预置题目（从 client/src/data/quizEngine.ts 迁移）
- [x] DB 索引：`QuizQuestion.wordId`、`QuizQuestion.direction`、`QuizAttempt.userId`

**集成验收 Gate** 🔴：
- [x] MongoDB 连接正常，两个新集合可读写
- [ ] 种子脚本执行后 20 条题目可查询（含 zh2en 和 en2zh 方向各 N 条）

### 阶段 1：Quiz API + 服务端判分

**目标**：提供生成题目、提交判分、查询历史三个核心 API

**预计产出**：
- [x] `server/src/services/quiz.service.ts` — 核心逻辑：
  - `generateQuiz(direction, wordId?, userId?)` — 题目生成（有 wordId 优先该单词 → 同词库补齐 → 通用池随机；已做过的题 24h 内避免重复）
  - `judgeAnswer(questionId, userInput)` — 服务端判分（关键词命中率 70% + LCS 30%，与前端逻辑一致但后端执行）
  - `getHistory(userId)` — 用户答题历史（含分页）
  - `getStats(userId)` — 用户训练统计（总题数、正确率、最近 7 天趋势）
- [x] `server/src/controllers/quiz.controller.ts` — 请求解析 + 响应格式化
- [x] `server/src/validators/quiz.validator.ts` — 输入校验（direction 枚举、userInput 非空 ≤2000 字）
- [x] `server/src/routes/quiz.routes.ts` — 路由定义：
  - `GET /api/v1/quiz/questions?direction=zh2en&wordId=` → 生成题目（optionalAuth）
  - `POST /api/v1/quiz/submit` → 提交判分（optionalAuth，传 questionId + userInput）
  - `GET /api/v1/quiz/history` → 用户答题历史（需认证）
  - `GET /api/v1/quiz/stats` → 用户训练统计（需认证）
- [x] `server/src/routes/index.ts` — 挂载 quizRoutes
- [x] 更新 Swagger/OpenAPI spec（`config/swagger.ts`）

**集成验收 Gate** 🔴：
- [x] 端到端链路 1：`GET /quiz/questions?direction=zh2en` → 返回 10 道题目（不登录可用）
- [x] 端到端链路 2：`POST /quiz/submit` → 传入答案 → 返回判分结果（score, correct, matched, missing, analysis）
- [x] 端到端链路 3：已登录用户 `GET /quiz/history` → 返回已答题目列表（含分页）
- [x] 端到端链路 4：已登录用户 `GET /quiz/stats` → 返回正确率和趋势数据
- [x] 单词详情页专项练习：`GET /quiz/questions?direction=zh2en&wordId=<id>` → 题目围绕该单词生成
- [x] 输入校验：direction 非法 → 400；userInput 为空 → 400；userInput > 2000 字 → 400

### 阶段 2：前端 API 集成

**目标**：将 client/src/data/quizEngine.ts 从本地 mock 替换为真实 API 调用

**预计产出**：
- [x] `client/src/api/quiz.ts` — 新增 API 模块（fetchQuestions, submitAnswer, fetchHistory, fetchStats）
- [x] `client/src/data/quizEngine.ts` — `generateQuiz()` 改为调用 API；`judgeAnswer()` 改为调用 API（或保留本地回退以备网络异常）
- [x] `client/src/pages/quiz/quiz.vue` — 适配 API 调用模式（loading 状态、错误处理、已登录用户的答题记录保存）
- [x] `client/src/pages/training/training.vue` — 保持现有 UI 不变（仅确保 API 切换后行为一致）
- [x] Vercel `vercel.json` — 确认 `/api/*` 代理规则覆盖 `/api/v1/quiz/*`

**集成验收 Gate** 🔴：
- [x] 核心用户故事 1：打开训练首页 → 点击「短句中译英」→ 服务端返回 10 题 → 逐题作答 → 服务端判分 → 完成页显示正确率
- [x] 核心用户故事 2（已登录）：从单词详情页进入「用 X 造句练习」→ 题目围绕该单词生成 → 答题 → 答题记录保存到服务端 → 返回单词详情页
- [x] 核心用户故事 3（已登录）：个人中心可查看训练统计 → 进入答题历史页面查看过往记录
- [x] 训练页无需登录：未登录用户可正常使用训练功能（仅不保存记录）
- [x] 网络异常降级：API 不可用时前端提示错误，不白屏崩溃

### 阶段 3：英译中方向扩展（可选/后续）

**目标**：解锁 training.vue 中「短句英译中」的禁用态（当前为 "Coming Soon" 占位）

**预计产出**：
- [ ] 为 en2zh 方向补充至少 10 道预置题目（种子脚本）
- [ ] 服务端 en2zh 判分逻辑（字符 bigram 重合度，quizEngine.ts 中已预留但未启用）
- [ ] 前端 training.vue 解除 disabled 态

## 5. 里程碑

| 里程碑 | 阶段 | 验收标准 | 预计完成 |
|--------|------|---------|---------|
| M1 | 阶段 0 | 数据模型就绪，20 题入库可查 | — |
| M2 | 阶段 1 | Quiz API 全部可调用，端到端链路通 | — |
| M3 | 阶段 2 | 前端替换为真实 API，用户体验不变 | — |
| M4 | 阶段 3 | 英译中方向可用 | — |

## 6. 风险与假设

| 风险/假设 | 影响 | 应对 |
|-----------|------|------|
| 题目池不足（20 题全部用完，用户无新题可做） | 低 | 已做题目 24h 冷却+洗牌兜底；后续可通过管理后台扩充题库 |
| 前端 quizEngine.ts 替换 API 后用户体验退化（增加网络延迟） | 中 | 前端预加载题目（进入页面即 fetch）；判分返回< 500ms（LCS 在 Node.js 中比浏览器更快） |
| 未登录用户训练数据无法追溯 | 低 | 训练页使用 optionalAuth — 已登录保存记录，未登录纯匿名体验 |
| 判分逻辑从纯前端迁移到后端，算法一致性 | 低 | 关键函数（normalize/words/lcs/variantMatches）用纯函数实现，前后端逻辑一致 |
