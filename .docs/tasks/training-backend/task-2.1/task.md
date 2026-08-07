# Task 2.1: 前端 Quiz API 集成

| 属性 | 值 |
|------|-----|
| ID | 2.1 |
| 状态 | done |
| 优先级 | P0 |
| 依赖 | Task 1.2（需要 Quiz API 可用） |
| 被依赖 | Task 3.1（英译中扩展依赖前端集成完成） |
| 阶段 | 阶段2: 前端集成 |
| 预估工时 | 3-4 小时 |
| 所属集成 Gate | [阶段 2 集成验收清单](../../../tasks.md) |

## 描述

将前端训练模块从"纯本地 mock 模式"切换为"真实 API 驱动模式"。核心改动点：

1. **新增 `client/src/api/quiz.ts`** — 封装 Quiz API 调用（fetchQuestions, submitAnswer, fetchHistory, fetchStats），遵循现有 `client/src/api/` 目录的编码风格（uni.request + camelCase 适配）
2. **改造 `client/src/data/quizEngine.ts`** — `generateQuiz()` 改为调用 `fetchQuestions()` API；`judgeAnswer()` 改为调用 `submitAnswer()` API；保留本地回退逻辑以备网络异常时的降级体验
3. **调整 `client/src/pages/quiz/quiz.vue`** — 添加 loading 状态和错误处理；登录用户答题后自动保存记录
4. **`client/src/pages/training/training.vue`** — 无需大改，仅确保 API 切换后行为一致

关键约束：未登录用户体验不应退化 — 训练页无需登录，与之前纯前端模式一致（API 使用 optionalAuth，不登录时不保存记录）。

## 验收标准

- [ ] `client/src/api/quiz.ts` 创建，导出 fetchQuestions, submitAnswer, fetchHistory, fetchStats
- [ ] `client/src/data/quizEngine.ts` 的 `generateQuiz()` 改为调用 API（`fetchQuestions`），失败时降级使用本地 mock
- [ ] `client/src/data/quizEngine.ts` 的 `judgeAnswer()` 改为调用 API（`submitAnswer`），失败时降级使用本地判分
- [ ] `client/src/pages/quiz/quiz.vue` 正确处理 loading 状态（首次获取题目时显示加载中）
- [ ] `client/src/pages/quiz/quiz.vue` 正确处理 API 错误（网络异常时显示提示，不白屏）
- [ ] 训练首页「短句中译英」点击后行为不变
- [ ] 单词详情页「用 X 造句练习」入口行为不变
- [ ] 已登录用户的答题记录在服务端持久化
- [ ] 未登录用户仍可正常使用训练功能
- [ ] 通过 `tsc --noEmit`（client/ 端类型检查）

## 子任务

### SUB-2.1.1: 创建 quiz API 模块
- **描述**: 在 `client/src/api/quiz.ts` 中封装 4 个 API 调用。遵循现有 `api/` 编码风格（uni.request 封装、camelCase 字段适配、错误处理）。Vercel 代理 `/api/*` 到 Render 后端。
- **验收标准**:
  - [ ] fetchQuestions(direction, wordId?) — GET /api/v1/quiz/questions
  - [ ] submitAnswer(questionId, userInput) — POST /api/v1/quiz/submit
  - [ ] fetchHistory(page?, limit?) — GET /api/v1/quiz/history
  - [ ] fetchStats() — GET /api/v1/quiz/stats
  - [ ] request.ts 的 401 处理不受影响（训练页无关登录态）

### SUB-2.1.2: 改造 quizEngine.ts
- **描述**: 将 `generateQuiz()` 和 `judgeAnswer()` 改为异步函数，优先调用 API，失败时降级使用本地 mock。保持函数签名兼容（quiz.vue 调用方式最小改动）。
- **验收标准**:
  - [ ] generateQuiz 优先调用 fetchQuestions，失败时回退 mockQuizItems
  - [ ] judgeAnswer 优先调用 submitAnswer，失败时回退本地判分
  - [ ] 降级逻辑对 quiz.vue 透明（不改变调用方代码）

### SUB-2.1.3: 调整 quiz.vue 和 training.vue
- **描述**: quiz.vue 添加 loading/error 状态处理；用户登录后答题自动记录（quizEngine 内部处理，页面不感知）。training.vue 确认 API 切换后行为一致。
- **验收标准**:
  - [ ] 题目加载中显示 loading 状态
  - [ ] API 错误时显示 toast/提示
  - [ ] 答题完成后已登录用户的记录写入后端
  - [ ] training.vue 入口点击正常跳转到答题页

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
