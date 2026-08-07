# 测试用例 — Task 1.1: 实现 Quiz 核心服务与判分引擎

> 关联 Task: [task.md](./task.md)
> 依赖 Task: 0.1（QuizQuestion / QuizAttempt 模型）、0.2（20 条种子题目）

---

## 测试环境准备

所有测试用例的前置条件：

1. MongoDB 已连接，种子数据已执行（`npm run seed`），QuizQuestion 集合含 20 条 zh2en 方向题目
2. QuizQuestion / QuizAttempt 模型已在 `models/index.ts` 中导出
3. 测试通过直接调用 `quiz.service.ts` 导出的纯函数执行（服务层不依赖 Express request/response）

---

## 一、generateQuiz 测试用例

### TC-001: 基本方向过滤 — zh2en
- **类型**: 功能测试
- **关联验收标准**: generateQuiz — 传入 direction=zh2en 返回 zh2en 方向题目
- **前置条件**: 种子数据已写入 20 条 zh2en 题目
- **输入**:
  - `direction = "zh2en"`
  - 不传 wordId / userId
- **执行步骤**:
  1. 调用 `generateQuiz("zh2en")`
  2. 检查返回数组的 length 和各元素属性
- **预期输出**:
  - 返回 10 条 QuizQuestion
  - 每条题目 `direction === "zh2en"`
  - 每条包含完整字段: `_id`, `prompt`, `hint`, `reference`, `keywords`, `analysis`
- **清理**: 无（纯查询，不写数据）

### TC-002: 基本方向过滤 — en2zh（边界：题目不足）
- **类型**: 边界测试
- **关联验收标准**: generateQuiz — 题目不足 10 道时返回可用的最大数量
- **前置条件**: 种子数据目前仅含 20 条 zh2en 题目，无 en2zh 题目
- **输入**:
  - `direction = "en2zh"`
  - 不传 wordId / userId
- **执行步骤**:
  1. 调用 `generateQuiz("en2zh")`
  2. 检查返回结果
- **预期输出**:
  - 返回空数组 `[]`（无 en2zh 方向题目）
  - 不抛异常
- **清理**: 无

### TC-003: wordId 优先匹配
- **类型**: 功能测试
- **关联验收标准**: generateQuiz — 传入 wordId 返回优先该单词的题目
- **前置条件**: 种子数据中 "flow" (wordId) 对应 3 条题目（q1, q2, q3）
- **输入**:
  - `direction = "zh2en"`
  - `wordId = <flow 的 ObjectId>`
- **执行步骤**:
  1. 先从 QuizQuestion 集合查询 wordId 为 flow 的题目数（应为 3 条）
  2. 调用 `generateQuiz("zh2en", wordId)`
  3. 检查返回题目中 flow 题目的占比
- **预期输出**:
  - 返回 10 条题目（3 条 flow + 7 条从通用池补齐）
  - 前 3 条题目全为 flow 的题目（优先排列），其余从其他单词/通用池补齐
  - 无重复题目
- **清理**: 无

### TC-004: userId 排除 24h 内已答题目
- **类型**: 功能测试
- **关联验收标准**: generateQuiz — 传入 userId 排除 24h 内已答题目
- **前置条件**:
  - 存在一个有效 userId（如种子管理员用户）
  - 为该用户手动创建一条 QuizAttempt（某题的答题记录，submittedAt 在 1 小时内）
- **输入**:
  - `direction = "zh2en"`
  - `userId = <管理员用户 ObjectId>`
- **执行步骤**:
  1. 在 QuizAttempt 集合中插入一条记录: userId, questionId（某题）, submittedAt = now - 1h
  2. 调用 `generateQuiz("zh2en", undefined, userId)`
  3. 检查返回结果中是否排除了该题
- **预期输出**:
  - 返回的 10 条题目中不包含已答过的那道题
  - 如果全部 20 道题都已在 24h 内答过 → 返回空数组或可用最大数量
- **清理**: 删除本次测试插入的 QuizAttempt 记录

### TC-005: 题目全部答完时的降级策略
- **类型**: 边界测试
- **关联验收标准**: generateQuiz — 题目不足 10 道时返回可用的最大数量
- **前置条件**: 20 条种子题目，需要模拟"用户把全部题目都答过了"
- **输入**:
  - `direction = "zh2en"`
  - `userId = <测试用户>`
  - 该用户对全部 20 条题目都有 24h 内的 QuizAttempt
- **执行步骤**:
  1. 为测试用户插入 20 条 QuizAttempt（覆盖全部题目，submittedAt 在 24h 内）
  2. 调用 `generateQuiz("zh2en", undefined, userId)`
- **预期输出**:
  - 返回空数组 `[]`（无可用的新题目）
  - 不抛异常
- **清理**: 删除本次测试插入的 QuizAttempt 记录

### TC-006: 匿名用户（不带 userId）正常出题
- **类型**: 功能测试
- **关联验收标准**: generateQuiz — 不传 userId 时不执行去重逻辑
- **前置条件**: 种子数据就绪
- **输入**:
  - `direction = "zh2en"`
  - 不传 userId
- **执行步骤**:
  1. 调用 `generateQuiz("zh2en")` 两次
  2. 对比两次返回的题目
- **预期输出**:
  - 两次调用均返回 10 条题目
  - 每次返回的题目经过随机洗牌，可能不同
- **清理**: 无

---

## 二、judgeAnswer 测试用例

### TC-101: 完全匹配的完美答案
- **类型**: 功能测试
- **关联验收标准**: judgeAnswer — 关键词命中率计算正确
- **前置条件**: 种子数据中 q1 的 keywords = `["healthy", "cash", "flow", "lifeblood"]`
- **输入**:
  - `questionId = <q1 的 ObjectId>`
  - `userInput = "Healthy cash flow is the lifeblood of a business."`（与 reference 完全一致）
- **执行步骤**:
  1. 调用 `judgeAnswer(questionId, userInput)`
  2. 检查返回的 score, correct, matched, missing
- **预期输出**:
  - `matched` 包含全部 4 个关键词: `["healthy", "cash", "flow", "lifeblood"]`
  - `missing` 为空 `[]`
  - `score` ≈ 100（关键词 70% 全中 + LCS 30% 全匹配）
  - `correct === true`
- **清理**: 如传了 userId → 删除自动创建的 QuizAttempt；否则 无

### TC-102: 部分匹配
- **类型**: 功能测试
- **关联验收标准**: judgeAnswer — 关键词命中率 + LCS 序列相似度综合计算
- **前置条件**: 同上 q1
- **输入**:
  - `questionId = <q1 的 ObjectId>`
  - `userInput = "Cash flow is important."`（只命中 cash 和 flow）
- **执行步骤**:
  1. 调用 `judgeAnswer(questionId, userInput)`
  2. 检查返回
- **预期输出**:
  - `matched` = `["cash", "flow"]`（2/4 匹配）
  - `missing` = `["healthy", "lifeblood"]`
  - `score` 在 35~65 之间（keywords 2/4 × 70 = 35 + LCS 贡献部分）
  - `correct === false`（score < 70）
- **清理**: 无

### TC-103: 空输入
- **类型**: 边界测试
- **关联验收标准**: judgeAnswer — 空输入返回 score=0
- **前置条件**: 种子数据就绪
- **输入**:
  - `questionId = <任意题目>`
  - `userInput = ""`
- **执行步骤**:
  1. 调用 `judgeAnswer(questionId, "")`
- **预期输出**:
  - `correct === false`
  - `score === 0`
  - `matched === []`
  - `missing` = 该题全部 keywords
  - analysis 包含 "还没有输入答案" 提示
- **清理**: 无

### TC-104: 纯空格输入
- **类型**: 边界测试
- **关联验收标准**: judgeAnswer — 空/空白输入统一处理
- **输入**:
  - `userInput = "   "`
- **预期输出**:
  - `score === 0`, `correct === false`
  - 与 TC-103 行为一致（normalize 后为空）
- **清理**: 无

### TC-105: 大小写不敏感匹配
- **类型**: 功能测试
- **关联验收标准**: judgeAnswer — normalize 后大小写统一
- **前置条件**: 种子 q1
- **输入**:
  - `userInput = "HEALTHY CASH FLOW IS GOOD"`
- **执行步骤**:
  1. 调用 `judgeAnswer(questionId, userInput)`
  2. 对比 TC-101 的结果
- **预期输出**:
  - `matched` 至少包含 `["healthy", "cash", "flow"]`（三项大小写 normalize 后匹配）
  - 结果与全小写输入一致
- **清理**: 无

### TC-106: 后缀变体匹配（s/es/ed/ing）
- **类型**: 功能测试
- **关联验收标准**: judgeAnswer — variantMatches 处理常见后缀变体
- **前置条件**: 种子 q1 keywords 含 `["healthy", "cash", "flow", "lifeblood"]`
- **输入**:
  - `userInput = "Cash flows healthily."`（flows → flow, healthily 不含 healthy 前缀匹配？）
  - 注: variantMatches 仅去 s/es/ed/ing，所以 "flows" → "flow" 能匹配，"healthily" 去掉 ing → "healthily" / "health" → 不匹配
- **执行步骤**:
  1. 调用 `judgeAnswer(questionId, userInput)`
- **预期输出**:
  - `matched` 包含 `"flow"`（flows → 去 s → flow）
  - `matched` 包含 `"cash"`
  - `matched` 不包含 `"healthy"`（healthily 去后缀后不是 healthy）
- **清理**: 无

### TC-107: 带标点符号的输入
- **类型**: 边界测试
- **关联验收标准**: judgeAnswer — normalize 去除末尾标点
- **前置条件**: 种子 q1
- **输入**:
  - `userInput = "Healthy cash flow is the lifeblood."`
  - (以句号结尾)
- **执行步骤**:
  1. 调用 judgeAnswer，检查 matched
- **预期输出**:
  - `matched` 包含全部 4 个关键词（末尾标点被 normalize 去除）
- **清理**: 无

### TC-108: 已登录用户自动保存 QuizAttempt
- **类型**: 功能测试
- **关联验收标准**: judgeAnswer — userId 存在时自动保存 QuizAttempt 记录
- **前置条件**: 存在一个种子用户
- **输入**:
  - `questionId = <q1>`
  - `userInput = "Healthy cash flow is the lifeblood."`
  - `userId = <管理员用户>`
- **执行步骤**:
  1. 调用 `judgeAnswer(questionId, userInput, userId)`
  2. 查询 QuizAttempt 集合，按 userId + questionId 查询
- **预期输出**:
  - QuizAttempt 集合中新增一条记录
  - 记录包含: `userId`, `questionId`, `userInput`, `score`, `correct`, `matched`, `missing`, `submittedAt`
  - `correct === true`, `score` ≈ 100
- **清理**: 删除本次测试产生的 QuizAttempt 记录

### TC-109: 匿名用户不保存 QuizAttempt
- **类型**: 功能测试
- **关联验收标准**: judgeAnswer — 不传 userId 时不保存记录
- **输入**:
  - `questionId = <q1>`
  - `userInput = "Some answer."`
  - 不传 userId
- **执行步骤**:
  1. 调用 `judgeAnswer(questionId, userInput)`（无 userId）
  2. 查询 QuizAttempt 集合
- **预期输出**:
  - 判决结果正常返回（score / matched / missing）
  - QuizAttempt 集合中无新增记录（与本测试无关的旧记录不受影响）
- **清理**: 无

### TC-110: 判分阈值 — 刚好 70 分判对
- **类型**: 边界测试
- **关联验收标准**: judgeAnswer — ≥70 判对
- **前置条件**: 构造一个恰好得 70 分的场景
- **输入**:
  - 选取 keywords 较少的题目（或构造 userInput 恰使 score = 70）
- **执行步骤**:
  1. 调用 judgeAnswer
  2. 检查 correct 字段
- **预期输出**:
  - `score === 70` → `correct === true`
  - `score === 69` → `correct === false`
- **清理**: 无

### TC-111: 不存在的 questionId
- **类型**: 异常测试
- **关联验收标准**: judgeAnswer — 服务层参数校验
- **输入**:
  - `questionId = "000000000000000000000000"`（合法 ObjectId 但不存在的题目）
- **执行步骤**:
  1. 调用 `judgeAnswer(questionId, userInput)`
- **预期输出**:
  - 抛出 AppError（404 / NOT_FOUND），message 包含 "题目不存在"
- **清理**: 无

---

## 三、getHistory 测试用例

### TC-201: 返回答题历史，按时间降序
- **类型**: 功能测试
- **关联验收标准**: getHistory — 按 submittedAt 降序返回
- **前置条件**: 为测试用户在 QuizAttempt 中插入 3 条记录，submittedAt 分别为 `now-1h`, `now-2h`, `now-3h`
- **输入**:
  - `userId = <测试用户>`
- **执行步骤**:
  1. 插入 3 条 QuizAttempt
  2. 调用 `getHistory(userId)`
  3. 检查返回的 data 数组顺序
- **预期输出**:
  - `pagination.total === 3`
  - `data[0].submittedAt > data[1].submittedAt > data[2].submittedAt`（最新在前）
  - 每条记录含 questionId, score, correct, submittedAt
- **清理**: 删除本次测试插入的 3 条 QuizAttempt

### TC-202: 默认分页参数
- **类型**: 功能测试
- **关联验收标准**: getHistory — 支持 page/limit 分页
- **前置条件**: 为测试用户插入 25 条 QuizAttempt
- **输入**:
  - `userId = <测试用户>`
  - 不传 page / limit（使用默认值）
- **执行步骤**:
  1. 调用 `getHistory(userId)`
- **预期输出**:
  - 返回默认 limit 条记录（如 20 或 10，取决于服务层默认值）
  - `pagination.total === 25`
  - `pagination.page === 1`
- **清理**: 删除测试数据

### TC-203: 自定义分页
- **类型**: 功能测试
- **关联验收标准**: getHistory — 分页元数据正确
- **前置条件**: 同 TC-202（25 条记录）
- **输入**:
  - `userId = <测试用户>`, `page = 2`, `limit = 10`
- **执行步骤**:
  1. 调用 `getHistory(userId, 2, 10)`
- **预期输出**:
  - `data.length === 10`（第二页 10 条）
  - `pagination.total === 25`, `pagination.page === 2`, `pagination.totalPages === 3`
- **清理**: 删除测试数据

### TC-204: 新用户无答题历史
- **类型**: 边界测试
- **关联验收标准**: getHistory — 空结果优雅返回
- **前置条件**: 使用不存在的 userId
- **输入**:
  - `userId = "000000000000000000000000"`（不存在的用户）
- **预期输出**:
  - `data === []`
  - `pagination.total === 0`
- **清理**: 无

---

## 四、getStats 测试用例

### TC-301: 完整统计指标
- **类型**: 功能测试
- **关联验收标准**: getStats — 返回 totalQuestions, correctRate, recentTrend
- **前置条件**: 为测试用户插入答题记录：
  - 5 条正确（score ≥ 70）
  - 3 条错误（score < 70）
  - 其中 4 条的 submittedAt 在过去 7 天内分布（如 day-1: 2条, day-3: 1条, day-5: 1条）
- **输入**:
  - `userId = <测试用户>`
- **执行步骤**:
  1. 调用 `getStats(userId)`
- **预期输出**:
  - `totalQuestions === 8`
  - `correctRate` ≈ 62.5（5/8 × 100，取整或保留小数）
  - `recentTrend` 为长度 7 的数组（最近 7 天每日答题数）
  - `recentTrend` 中对应日期有非零值
- **清理**: 删除测试数据

### TC-302: 新用户统计为空
- **类型**: 边界测试
- **关联验收标准**: getStats — 无数据时返回零值
- **输入**:
  - `userId = "000000000000000000000000"`（无记录用户）
- **预期输出**:
  - `totalQuestions === 0`
  - `correctRate === 0`（不是 NaN 或抛异常）
  - `recentTrend` = `[0, 0, 0, 0, 0, 0, 0]`
- **清理**: 无

### TC-303: correctRate 精确到整数百分比
- **类型**: 功能测试
- **关联验收标准**: getStats — correctRate 为合理百分比值
- **前置条件**: 1 条正确 + 2 条错误 → 1/3 ≈ 33.33%
- **预期输出**:
  - `correctRate` 为数值（如 33 或 Math.round(100/3)）
  - 不是浮点精度问题（如 33.3333333）
- **清理**: 删除测试数据

---

## 五、集成测试（跨 Task）🔴

### I-001: 完整答题链路 — generateQuiz → judgeAnswer → getHistory → getStats
- **类型**: 集成测试（跨 Task）
- **关联依赖**: Task 1.1 ← Task 0.1（Model） + Task 0.2（种子数据）
- **前置条件**:
  - Task 0.1: QuizQuestion / QuizAttempt 模型注册就绪
  - Task 0.2: 20 条种子题目写入 MongoDB
  - 存在一个有效 userId（种子管理员用户）
- **集成链路**:
  1. QuizQuestion 集合（Task 0.2 种子数据）→ `generateQuiz()` → 获取题目
  2. QuizQuestion（查题） + QuizAttempt（存记录）→ `judgeAnswer()` → 判分保存
  3. QuizAttempt 集合 → `getHistory()` → 查询历史
  4. QuizAttempt 集合 → `getStats()` → 聚合统计
- **执行步骤**:
  1. 调用 `generateQuiz("zh2en")` — 获取 10 道题目
  2. 取第 1 题，调用 `judgeAnswer(questionId, userInput, userId)` — 用正确参考答案作为输入
  3. 取第 2 题，调用 `judgeAnswer(questionId, "wrong answer", userId)` — 故意答错
  4. 调用 `getHistory(userId)` — 应返回 2 条记录
  5. 调用 `getStats(userId)` — totalQuestions=2, correctRate=50, recentTrend 含今日数据
- **预期输出**:
  - 步骤 1: 返回 10 条题目 ✅
  - 步骤 2: correct=true, score≈100, QuizAttempt 有记录 ✅
  - 步骤 3: correct=false, score<70, QuizAttempt 有记录 ✅
  - 步骤 4: data.length=2, 降序排列 ✅
  - 步骤 5: totalQuestions=2, correctRate=50 ✅
- **清理**: 删除本次测试产生的 2 条 QuizAttempt 记录

### I-002: 种子数据驱动的判分正确性
- **类型**: 集成测试（跨 Task）
- **关联依赖**: Task 1.1 ← Task 0.2（种子数据内容）
- **前置条件**: Task 0.2 种子数据就绪，已知 q2 的 keywords = `["traffic", "flows", "smoothly", "highway"]`
- **集成链路**: QuizQuestion 集合（种子数据）→ `judgeAnswer()` → 验证种子 keywords 被正确识别
- **执行步骤**:
  1. 从 QuizQuestion 集合查询 prompt=="新高速公路上的车流很顺畅。" 获取 questionId
  2. 调用 `judgeAnswer(questionId, "Traffic flows smoothly on the highway.")`
  3. 检查 matched 是否包含所有 4 个关键词
- **预期输出**:
  - `matched = ["traffic", "flows", "smoothly", "highway"]`
  - `score ≈ 100`
  - `correct === true`
- **清理**: 无（无 userId，不写记录）

---

## 六、阶段 E2E 场景（供 ai-master 阶段集成 Gate 使用）

> 以下场景在阶段 1（Task 1.1 + Task 1.2）全部完成后，由 ai-master 执行端到端验证。

### E2E-01: 匿名用户完整训练流程（zh2en）
- **涉及 Task**: Task 1.1（服务层）、Task 1.2（API 路由+校验）
- **用户故事**: 作为未登录访客，我想通过中译英短句训练提升翻译能力，以便在不注册的情况下体验产品核心功能
- **执行步骤**:
  1. `GET /api/v1/quiz/questions?direction=zh2en` → 获取 10 道题目 — 来自 Task 1.1 generateQuiz
  2. 从返回结果取第一题，构造 userInput → `POST /api/v1/quiz/submit { questionId, userInput }` — 来自 Task 1.1 judgeAnswer
  3. 重复步骤 2 完成剩余 9 题
- **通过标准**:
  - [ ] 步骤 1 返回 200 + 10 道题目（含 prompt/hint/reference/keywords）
  - [ ] 步骤 2 返回 200 + score/correct/matched/missing/analysis
  - [ ] 每道题判分结果合理（正确答案 correct=true，错误答案 correct=false）
  - [ ] 匿名用户不保存 QuizAttempt（不传 Authorization header）
- **失败时涉及模块**: quiz.service（generateQuiz / judgeAnswer）、quiz.controller、quiz.route、Joi 校验中间件

### E2E-02: 已登录用户答题 + 历史 + 统计
- **涉及 Task**: Task 1.1（服务层所有四个函数）、Task 1.2（API 路由）
- **用户故事**: 作为已登录用户，我想在训练后查看自己的答题历史和统计数据，以便追踪学习进度
- **执行步骤**:
  1. `POST /api/v1/auth/login` 获取 JWT token
  2. `GET /api/v1/quiz/questions?direction=zh2en` (带 Authorization) → 获取题目
  3. `POST /api/v1/quiz/submit` (带 Authorization) → 提交多题答案
  4. `GET /api/v1/quiz/history` (带 Authorization) → 查历史 — 来自 Task 1.1 getHistory
  5. `GET /api/v1/quiz/stats` (带 Authorization) → 查统计 — 来自 Task 1.1 getStats
- **通过标准**:
  - [ ] 步骤 2 排除 24h 内已答题目（用户已答过的题不再出现）
  - [ ] 步骤 3 自动保存 QuizAttempt（userId 关联正确）
  - [ ] 步骤 4 返回答题历史列表，含分页元数据
  - [ ] 步骤 5 返回 totalQuestions / correctRate / recentTrend
- **失败时涉及模块**: quiz.service、quiz.controller、auth 中间件、JWT 校验

### E2E-03: API 参数校验与错误处理
- **涉及 Task**: Task 1.1（服务层）、Task 1.2（路由校验）
- **用户故事**: 作为前端开发者，我期望 API 对非法请求返回明确的错误信息，以便给用户友好提示
- **执行步骤**:
  1. `GET /api/v1/quiz/questions?direction=invalid` → 期望 400
  2. `POST /api/v1/quiz/submit { questionId: "", userInput: "" }` → 期望 400
  3. `GET /api/v1/quiz/history` 不带 Authorization → 期望 401（若路由要求登录）
  4. `POST /api/v1/quiz/submit { questionId: "badObjectId", userInput: "test" }` → 期望 400
- **通过标准**:
  - [ ] direction=invalid → 400 + 含 "direction" 的 message
  - [ ] 空 questionId / userInput → 400 + 含对应字段名的 message
  - [ ] 无 Authorization 访问需登录路由 → 401
  - [ ] 非法 ObjectId → 400 或 422（参数格式错误）
- **失败时涉及模块**: Joi 校验 schema、quiz.route、quiz.controller、auth 中间件
