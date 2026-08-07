# 测试用例 — Task 2.1: 前端 Quiz API 集成

> 生成日期: 2026-08-06
> 关联依赖: Task 1.2（Quiz API 已就绪）

---

## 测试环境说明

| 项目 | 说明 |
|------|------|
| 后端 API | `http://localhost:3000/api/v1/quiz/*`（Task 1.2 产出，需先启动 server） |
| 前端 | uni-app H5 模式，`npm run dev:h5` 启动 |
| 认证 | 需准备一个已注册用户（username: testuser / phone: 13800000001），通过 `/api/v1/auth/login` 获取 JWT |
| 数据库 | MongoDB，种子数据 20 条 zh2en 方向题目已入库（Task 0.2） |
| 降级测试 | 通过关闭后端服务或断开网络模拟 API 不可用 |

---

## 功能测试

### TC-001: fetchQuestions — 正常获取题目
- **类型**: 功能测试
- **关联验收标准**: `client/src/api/quiz.ts` 创建，导出 fetchQuestions
- **前置条件**: 后端服务运行中，种子数据已入库
- **输入**:
  - 参数: `direction = "zh2en"`
- **执行步骤**:
  1. 在浏览器 console 或测试代码中调用 `import { fetchQuestions } from "@/api/quiz"; await fetchQuestions("zh2en")`
  2. 查看返回结果
  3. 检查 HTTP 请求 URL 为 `GET /api/v1/quiz/questions?direction=zh2en`
- **预期输出**:
  - 返回数组，长度 ≤ 10
  - 每项包含: `_id` / `prompt` / `hint` / `reference` / `keywords` / `analysis` / `direction: "zh2en"`
  - 无 401 错误（该端点使用 optionalAuth，无需登录）
- **清理**: 无

### TC-002: fetchQuestions — 指定 wordId 获取单词专项题目
- **类型**: 功能测试
- **关联验收标准**: fetchQuestions(direction, wordId?) — GET /api/v1/quiz/questions
- **前置条件**: 种子数据中存在 wordId 对应的题目
- **输入**:
  - 参数: `direction = "zh2en", wordId = "<某已知 wordId>"`
- **执行步骤**:
  1. 先调用 `fetchQuestions("zh2en")` 获取任意 10 题，记录第一题的 wordId
  2. 调用 `fetchQuestions("zh2en", recordedWordId)`
  3. 检查返回题目是否全部或优先包含该 wordId
- **预期输出**:
  - URL 包含 `wordId=xxx` 查询参数
  - 返回题目中优先排列该单词相关题目
- **清理**: 无

### TC-003: submitAnswer — 提交答案并获取判分
- **类型**: 功能测试
- **关联验收标准**: submitAnswer(questionId, userInput) — POST /api/v1/quiz/submit
- **前置条件**: 已通过 fetchQuestions 获取到题目
- **输入**:
  - 参数: `questionId = "<某题 _id>", userInput = "完全匹配 reference 的英文句子"`
- **执行步骤**:
  1. 从 fetchQuestions 结果中取一题，记录其 `_id` 和 `reference`
  2. 调用 `await submitAnswer(questionId, reference)`（用标准答案提交）
  3. 检查 HTTP 请求为 `POST /api/v1/quiz/submit`，body 为 `{ questionId, userInput }`
- **预期输出**:
  - 返回对象包含: `correct`（应为 true）、`score`（应为 100）、`matched`、`missing`（应为空数组）、`analysis`
- **清理**: 无

### TC-004: submitAnswer — 错误答案判分
- **类型**: 功能测试
- **关联验收标准**: judgeAnswer 改为调用 submitAnswer API
- **前置条件**: 已获取题目
- **输入**:
  - 参数: `questionId = "<某题 _id>", userInput = "completely wrong answer"`
- **执行步骤**:
  1. 调用 `await submitAnswer(questionId, "completely wrong answer")`
- **预期输出**:
  - `correct: false`, `score < 70`, `matched` 为空或极少, `missing` 包含大部分 keywords
- **清理**: 无

### TC-005: fetchHistory — 已登录用户获取答题历史
- **类型**: 功能测试
- **关联验收标准**: fetchHistory(page?, limit?) — GET /api/v1/quiz/history
- **前置条件**: 已登录用户（JWT token 已存储在 uni.storage），且该用户至少答过 1 题
- **输入**:
  - 参数: `page = 1, limit = 10`
- **执行步骤**:
  1. 确保用户已登录（token 可用）
  2. 调用 `await fetchHistory(1, 10)`
  3. 检查 HTTP 请求为 `GET /api/v1/quiz/history?page=1&limit=10`，带 `Authorization: Bearer <token>` 头
- **预期输出**:
  - 返回对象包含 `data`（数组）和 `pagination`（`{ total, page, limit, totalPages }`）
  - data 中每项包含: `questionId` / `prompt` / `direction` / `userInput` / `score` / `correct` / `reference` / `submittedAt`
  - 按 `submittedAt` 降序排列
- **清理**: 无

### TC-006: fetchStats — 已登录用户获取训练统计
- **类型**: 功能测试
- **关联验收标准**: fetchStats() — GET /api/v1/quiz/stats
- **前置条件**: 已登录用户，且该用户有过答题记录
- **输入**: 无参数
- **执行步骤**:
  1. 调用 `await fetchStats()`
  2. 检查 HTTP 请求为 `GET /api/v1/quiz/stats`，带认证头
- **预期输出**:
  - 返回对象包含: `totalQuestions`（number）、`correctRate`（0-100）、`recentTrend`（长度为 7 的 number 数组）
- **清理**: 无

### TC-007: quizEngine.generateQuiz — 优先调用 API，成功时使用服务端数据
- **类型**: 功能测试
- **关联验收标准**: generateQuiz 优先调用 fetchQuestions，失败时回退 mockQuizItems
- **前置条件**: 后端服务运行中
- **输入**:
  - 参数: `direction = "zh2en"`
- **执行步骤**:
  1. 在 quiz.vue 正常流程中进入答题页，或直接调用 `generateQuiz("zh2en")`
  2. 确认实际发起了网络请求到 `/api/v1/quiz/questions`
  3. 检查返回的题目数据
- **预期输出**:
  - 返回 `QuizItem[]`（10 题或可用最大数量）
  - 数据来自服务端（可通过题目 ID 与服务端种子数据比对确认）
  - 前端 `QuizItem` 接口字段完整映射（id ← _id, prompt, hint, reference, keywords, analysis）
- **清理**: 无

### TC-008: quizEngine.generateQuiz — API 失败时降级为本地 mock
- **类型**: 功能测试（降级逻辑）
- **关联验收标准**: generateQuiz 失败时降级使用本地 mock
- **前置条件**: 后端服务不可用（关闭 server 或断网）
- **输入**:
  - 参数: `direction = "zh2en"`
- **执行步骤**:
  1. 关闭后端服务
  2. 调用 `generateQuiz("zh2en")`
  3. 检查返回数据
- **预期输出**:
  - 无异常抛出（不 crash）
  - 返回 `QuizItem[]`，数据来自本地 mockQuizItems（20 题中随机 10 题）
  - 行为与 API 集成前一致
- **清理**: 重新启动后端服务

### TC-009: quizEngine.judgeAnswer — 优先调用 API，成功时使用服务端判分
- **类型**: 功能测试
- **关联验收标准**: judgeAnswer 改为调用 submitAnswer API，失败时降级使用本地判分
- **前置条件**: 后端服务运行中，已通过 generateQuiz 获取题目
- **输入**:
  - 参数: `item = <某 QuizItem>, userInput = "英文翻译", direction = "zh2en"`
- **执行步骤**:
  1. 在答题页完成一次提交，或直接调用 `judgeAnswer(item, userInput, direction)`
  2. 确认实际发起了 POST 到 `/api/v1/quiz/submit`
  3. 检查返回的判分结果
- **预期输出**:
  - 返回 `QuizResult`（correct, score, matched, missing, analysis）
  - 数据来自服务端判分
  - 评分逻辑与服务端一致（关键词 70% + LCS 30%）
- **清理**: 无

### TC-010: quizEngine.judgeAnswer — API 失败时降级为本地判分
- **类型**: 功能测试（降级逻辑）
- **关联验收标准**: judgeAnswer 失败时降级使用本地判分
- **前置条件**: 后端服务不可用
- **输入**:
  - 参数: 同 TC-009
- **执行步骤**:
  1. 关闭后端服务
  2. 调用 `judgeAnswer(item, userInput, direction)`
- **预期输出**:
  - 无异常抛出
  - 返回 `QuizResult`，使用本地判分算法（与 API 集成前一致）
  - 降级后不保存答题记录（无法连接后端）
- **清理**: 重新启动后端服务

### TC-011: quiz.vue — 题目加载中显示 loading 状态
- **类型**: 功能测试
- **关联验收标准**: 题目加载中显示 loading 状态
- **前置条件**: 后端服务运行中（可正常响应）
- **输入**: 进入答题页（从训练首页点击"中译英"入口）
- **执行步骤**:
  1. 打开训练首页
  2. 点击"短句中译英"入口
  3. 观察页面从进入到题目显示的过程
- **预期输出**:
  - 题目加载期间（API 请求 pending 中）页面显示 loading 状态（如加载中文字或骨架屏）
  - 题目加载完成后 loading 消失，显示题目内容
  - 不出现白屏
- **清理**: 无

### TC-012: quiz.vue — API 错误时显示提示，不白屏
- **类型**: 功能测试
- **关联验收标准**: API 错误时显示 toast/提示
- **前置条件**: 后端服务不可用（关闭 server）
- **输入**: 进入答题页
- **执行步骤**:
  1. 关闭后端服务
  2. 从训练首页进入答题页
  3. 观察页面表现
- **预期输出**:
  - 页面不白屏、不崩溃
  - 显示错误提示（如 toast "网络请求失败，已切换到离线模式"）
  - 降级使用本地 mock 数据，答题流程仍可用
- **清理**: 重新启动后端服务

### TC-013: quiz.vue — 已登录用户答题后记录保存
- **类型**: 功能测试
- **关联验收标准**: 答题完成后已登录用户的记录写入后端
- **前置条件**: 用户已登录，后端服务运行中
- **输入**: 完成一轮 10 题答题
- **执行步骤**:
  1. 用户登录
  2. 进入答题页，完成 10 题（每题提交判分）
  3. 完成页出现后，检查后端数据库
- **预期输出**:
  - 数据库 QuizAttempt 集合新增 10 条记录，userId 对应当前登录用户
  - 每条记录包含 questionId / userInput / score / correct / matched / missing / submittedAt
- **清理**: 删除测试产生的 QuizAttempt 记录

### TC-014: quiz.vue — 未登录用户可正常训练
- **类型**: 功能测试
- **关联验收标准**: 未登录用户仍可正常使用训练功能
- **前置条件**: 清除 token（未登录状态），后端服务运行中
- **输入**: 完成一轮答题
- **执行步骤**:
  1. 清除 uni.storage 中的 token
  2. 进入答题页，完成一轮答题
  3. 检查整个流程是否正常
  4. 检查后端数据库
- **预期输出**:
  - 答题流程正常：题目加载 → 提交判分 → 完成页
  - API 请求不带 Authorization 头（或 optionalAuth 允许无 token）
  - 数据库 QuizAttempt 集合**不**新增记录（未登录用户不保存）
- **清理**: 无

### TC-015: training.vue — "短句中译英"入口行为不变
- **类型**: 功能测试
- **关联验收标准**: 训练首页「短句中译英」点击后行为不变
- **前置条件**: 前端运行中
- **输入**: 点击训练首页"短句中译英"
- **执行步骤**:
  1. 打开训练首页 `/pages/training/training`
  2. 点击"短句中译英"入口
  3. 观察跳转行为
- **预期输出**:
  - 跳转到答题页 `/pages/quiz/quiz?direction=zh2en`
  - 答题页正常加载（API 获取题目）
- **清理**: 无

### TC-016: 单词详情页 "用 X 造句练习" 入口行为不变
- **类型**: 功能测试
- **关联验收标准**: 单词详情页「用 X 造句练习」入口行为不变
- **前置条件**: 前端运行中，存在一个已知单词
- **输入**: 从单词详情页点击训练入口
- **执行步骤**:
  1. 打开某个单词的详情页
  2. 点击"用 X 造句练习"入口
  3. 观察跳转行为
- **预期输出**:
  - 跳转到答题页 `/pages/quiz/quiz?direction=zh2en&wordId=<wordId>`
  - 答题页加载的题目优先包含该单词相关题目
- **清理**: 无

### TC-017: TypeScript 编译无错误
- **类型**: 功能测试
- **关联验收标准**: 通过 `tsc --noEmit`（client/ 端类型检查）
- **前置条件**: 代码变更完成
- **输入**: 运行编译检查
- **执行步骤**:
  1. 执行 `cd client && npx tsc --noEmit`
- **预期输出**:
  - 无类型错误
  - 退出码 0
- **清理**: 无

---

## 边界测试

### TC-018: API 返回空题目列表（用户 24h 内已答完所有题）
- **类型**: 边界测试
- **关联验收标准**: 降级逻辑对 quiz.vue 透明
- **前置条件**: 已登录用户，且该用户在过去 24h 内已答完所有题目
- **输入**:
  - 参数: `direction = "zh2en"`
- **执行步骤**:
  1. 模拟：已登录用户在 24h 内答完所有 20 题
  2. 再次进入答题页
- **预期输出**:
  - API 返回空数组 `{ data: [] }`
  - 前端降级使用本地 mock 数据（或显示"暂无新题，请稍后再来"的提示）
  - 页面不崩溃
- **清理**: 删除测试产生的所有 QuizAttempt 记录

### TC-019: API 返回 401 访问 /history 或 /stats
- **类型**: 边界测试
- **关联验收标准**: request.ts 的 401 处理不受影响（训练页无关登录态）
- **前置条件**: 未登录状态（无 token）
- **输入**: 调用 `fetchHistory()` 或 `fetchStats()`
- **执行步骤**:
  1. 清除 token
  2. 调用 `fetchHistory()` 或 `fetchStats()`
- **预期输出**:
  - 抛出 `ApiRequestError`，`statusCode = 401`，`code = "UNAUTHORIZED"`
  - **不影响答题页主流程**（这些 API 不在答题流程中调用，仅可能在其他页面调用）
  - 不触发全局 401 跳转（因为无 token 时不走 clearAuthAndRedirect 逻辑）
- **清理**: 无

### TC-020: 网络超时 → 降级
- **类型**: 边界测试
- **关联验收标准**: 降级逻辑对 quiz.vue 透明
- **前置条件**: 后端服务响应极慢或网络不佳
- **输入**: 进入答题页
- **执行步骤**:
  1. 模拟网络超时（可通过浏览器 DevTools 网络节流或关闭后端）
  2. 进入答题页
- **预期输出**:
  - 一定时间后自动降级到本地 mock
  - 页面显示加载中 → 降级提示 → 本地题目
- **清理**: 恢复网络

---

## 异常测试

### TC-021: direction=invalid → 400 错误处理
- **类型**: 异常测试
- **关联验收标准**: API 错误时显示 toast/提示
- **前置条件**: 后端服务运行中
- **输入**: 调用 `fetchQuestions("invalid" as any)`
- **执行步骤**:
  1. 在代码中调用 `fetchQuestions("invalid" as any)`
  2. 观察错误处理
- **预期输出**:
  - 抛出 `ApiRequestError`，`statusCode = 400`
  - 错误消息包含校验失败信息
  - 如果发生在 quiz.vue 中，应降级使用本地 mock 或显示友好提示
- **清理**: 无

### TC-022: userInput 为空 → 400 错误处理
- **类型**: 异常测试
- **关联验收标准**: API 错误时显示 toast/提示
- **前置条件**: 后端服务运行中
- **输入**: `submitAnswer(questionId, "")`
- **执行步骤**:
  1. 调用 `submitAnswer(questionId, "")` 或 `submitAnswer(questionId, "   ")`
- **预期输出**:
  - 抛出 `ApiRequestError` 或前端降级处理
  - 前端降级时：本地判分应返回 score=0, correct=false（与 API 集成前一致）
- **清理**: 无

### TC-023: Server 500 错误 → 降级
- **类型**: 异常测试
- **关联验收标准**: API 错误时显示 toast/提示
- **前置条件**: 模拟后端 500 错误（可通过 mock server 或修改后端代码临时抛出）
- **输入**: 正常答题流程
- **执行步骤**:
  1. 使后端 API 返回 500 错误
  2. 进入答题页并提交答案
- **预期输出**:
  - 前端降级到本地判分
  - 显示友好错误提示（不显示原始 500 错误）
  - 页面不崩溃
- **清理**: 恢复后端正常

### TC-024: 后端返回非预期数据格式 → 降级
- **类型**: 异常测试
- **关联验收标准**: API 错误时显示 toast/提示
- **前置条件**: 后端返回了不符合协议的数据（如 `{ data: null }` 或缺少字段）
- **输入**: 正常答题流程
- **执行步骤**:
  1. 模拟后端返回 `{ data: null }`（可通过 Charles/whistle 代理篡改）
  2. 进入答题页
- **预期输出**:
  - 前端不应崩溃
  - 应降级到本地 mock 或显示"数据异常，已切换到离线模式"
- **清理**: 恢复代理

---

## 集成测试（跨 Task）

### I-001: 完整答题 API 链路 🔴
- **类型**: 集成测试（跨 Task）
- **关联依赖**: Task 2.1 ← Task 1.2
- **前置条件**: Task 1.2 的 Quiz API 已部署，种子数据 20 题已入库
- **集成链路**: `GET /quiz/questions` → `POST /quiz/submit` × 10
- **输入**: 匿名用户进入答题
- **执行步骤**:
  1. 调用 `fetchQuestions("zh2en")` → 获取 10 题（验证来自 Task 1.2 的服务端数据）
  2. 逐题调用 `submitAnswer(questionId, userInput)` → 每题获取判分结果（验证 Task 1.1 的判分引擎）
  3. 完成 10 题后检查结果汇总
- **预期输出**:
  - 10 题全部通过 API 获取（非本地 mock）
  - 10 题全部通过 API 判分（非本地判分）
  - 每道题的判分结果格式与 `QuizResult` 接口一致
  - 无网络错误、无降级触发
- **清理**: 无（匿名用户不产生持久记录）

### I-002: 已登录用户完整链路（答题 → 历史 → 统计）🔴
- **类型**: 集成测试（跨 Task）
- **关联依赖**: Task 2.1 ← Task 1.2
- **前置条件**: 已登录用户（有 JWT token）
- **集成链路**: 登录 → 答题 → 查历史 → 查统计
- **输入**: 完整用户旅程
- **执行步骤**:
  1. 用户登录：通过 `/api/v1/auth/login` 获取 token 并存到 uni.storage
  2. 进入答题页：调用 `fetchQuestions("zh2en")` 获取 10 题
  3. 完成 3 题：每题调用 `submitAnswer`，自动保存 QuizAttempt
  4. 离开答题页（不完成全部）
  5. 调用 `fetchHistory(1, 10)` 检查答题历史
  6. 调用 `fetchStats()` 检查统计数据
- **预期输出**:
  - 步骤 2：返回 10 题（排除 24h 内已答题目）
  - 步骤 3：每题判分正常，数据库 QuizAttempt 新增记录
  - 步骤 5：`fetchHistory` 返回刚答的 3 题记录，含 `userInput` / `score` / `correct` / `reference`
  - 步骤 6：`fetchStats` 中 `totalQuestions = 3`, `correctRate` 与实际正确数一致, `recentTrend` 含今日答题数
- **清理**: 删除测试产生的 QuizAttempt 记录

### I-003: 未登录用户链路 — API 判分但不持久化 🔴
- **类型**: 集成测试（跨 Task）
- **关联依赖**: Task 2.1 ← Task 1.2
- **前置条件**: 未登录（无 token）
- **集成链路**: 答题 → 判分 → 验证无记录
- **输入**: 匿名用户完成 2 题
- **执行步骤**:
  1. 清除 token，确认未登录
  2. 进入答题页，完成 2 题（调用 API 判分）
  3. 检查请求是否不带 Authorization 头（验证 optionalAuth 生效）
  4. 检查后端数据库 QuizAttempt 集合
- **预期输出**:
  - 答题流程完全正常，体验与登录用户一致
  - API 请求不带 Authorization 头但返回正常
  - 数据库 QuizAttempt 中**无**该用户的记录（userId 为空时服务层不调用 saveAttemptSilently）
- **清理**: 无

---

## 阶段 E2E 场景（供 ai-master 阶段集成 Gate 使用）

> 以下场景在阶段 2 内所有 Task 完成后，由 ai-master 执行端到端验证。

### E2E-01: 完整答题流程（训练首页 → 答题 → 完成 → 查看结果）
- **涉及 Task**: Task 2.1
- **用户故事**: 作为用户，我想从训练首页进入中译英训练，完成 10 道翻译题，看到我的正确率
- **执行步骤**:
  1. 打开训练首页 `/pages/training/training` — 来自 Task 2.1 (training.vue)
  2. 点击"短句中译英"入口 → 跳转到答题页 — 来自 Task 2.1 (training.vue → quiz.vue)
  3. 页面显示 loading → 加载 10 道题目（API 获取） — 来自 Task 2.1 (quiz API + quizEngine)
  4. 逐题输入英文翻译并提交（API 判分） — 来自 Task 2.1 (quizEngine API submit)
  5. 每题显示判分反馈（correct/score/analysis） — 来自 Task 2.1 (quiz.vue)
  6. 完成 10 题 → 显示完成页，正确率统计 — 来自 Task 2.1 (quiz.vue done page)
- **通过标准**:
  - [ ] 入口"短句中译英"可点击，跳转到答题页
  - [ ] 题目通过 API 加载（非本地 mock 模式），10 题全部加载成功
  - [ ] 每道题判分通过 API 获取（非本地判分），反馈卡片正确显示
  - [ ] 完成页显示正确率，数据正确
  - [ ] 全程无白屏、无崩溃、无 5xx 错误
- **失败时涉及模块**: `client/src/api/quiz.ts`, `client/src/data/quizEngine.ts`, `client/src/pages/quiz/quiz.vue`, `client/src/pages/training/training.vue`, 后端 Quiz API

### E2E-02: 网络异常降级体验
- **涉及 Task**: Task 2.1
- **用户故事**: 作为用户，当后端服务不可用时，我仍能使用本地模式进行训练，不应看到白屏或崩溃
- **执行步骤**:
  1. 关闭后端服务 — 模拟网络不可用
  2. 打开训练首页 → 点击"短句中译英" — 来自 Task 2.1
  3. 观察题目加载行为 — API 失败，降级到本地 mock — 来自 Task 2.1 (quizEngine 降级)
  4. 完成 2 题提交 — API 判分失败，降级到本地判分 — 来自 Task 2.1 (quizEngine 降级)
  5. 完成页正常显示正确率
- **通过标准**:
  - [ ] 页面不白屏、不崩溃
  - [ ] 显示错误/降级提示（如"已切换到离线模式"）
  - [ ] 题目从本地 mock 加载，数量正确
  - [ ] 判分使用本地算法，结果正确
  - [ ] 完成页正常显示
- **失败时涉及模块**: `client/src/data/quizEngine.ts`（降级逻辑）, `client/src/pages/quiz/quiz.vue`（错误处理）

### E2E-03: 已登录用户持久化验证
- **涉及 Task**: Task 2.1
- **用户故事**: 作为已登录用户，我答过的题应保存到服务端，下次查看历史时可以看到
- **执行步骤**:
  1. 用户登录（获取 JWT token 存入 uni.storage） — 前置条件
  2. 进入答题页，完成 3 题（API 判分 + 自动保存） — 来自 Task 2.1
  3. 离开答题页
  4. 调用 `fetchHistory(1, 10)` — 来自 Task 2.1
  5. 调用 `fetchStats()` — 来自 Task 2.1
  6. 检查数据库 QuizAttempt 集合 — 验证记录已持久化
- **通过标准**:
  - [ ] 数据库 QuizAttempt 中有 3 条新记录，userId 正确
  - [ ] fetchHistory 返回刚答的 3 题，数据完整
  - [ ] fetchStats 中 totalQuestions ≥ 3，correctRate 正确，recentTrend 含今日数据
- **失败时涉及模块**: `client/src/api/quiz.ts`, `client/src/data/quizEngine.ts`, 后端 Quiz API (Task 1.2), 认证中间件
