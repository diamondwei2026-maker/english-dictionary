# 测试用例 — Task 1.2: 实现 Quiz API 路由、控制器与校验

> 依赖 Task 1.1（quiz.service.ts）已完成 — I 系列集成用例使用真实服务层调用。

---

## 一、功能测试 — GET /api/v1/quiz/questions

### TC-101: 基本出题 — 匿名用户 + zh2en 方向
- **类型**: 功能测试
- **关联验收标准**: getQuestions 解析 query params，调用 quizService.generateQuiz
- **前置条件**: 数据库有 20 条 zh2en 种子题目
- **输入**:
  - 请求: `GET /api/v1/quiz/questions?direction=zh2en`
  - Header: 无 Authorization
- **执行步骤**:
  1. 发送 GET 请求
  2. 检查响应状态码
  3. 检查响应体结构
- **预期输出**:
  - HTTP 状态码: 200
  - 响应体: `{ data: [...] }`，data 为数组，length 为 10（或可用的最大数量）
  - 每个元素包含 `_id`, `prompt`, `hint`, `direction`, `reference`, `keywords`, `analysis`
  - 所有元素的 `direction` 均为 `"zh2en"`
- **清理**: 无

### TC-102: 出题 + wordId 筛选
- **类型**: 功能测试
- **关联验收标准**: getQuestions 解析 wordId 参数
- **前置条件**: 数据库有 flow 相关题目（wordId 已知）
- **输入**:
  - 请求: `GET /api/v1/quiz/questions?direction=zh2en&wordId=<flow 的 wordId>`
- **执行步骤**:
  1. 先查一个有效 wordId（如 flow 对应的 Word 文档 `_id`）
  2. 发送带 wordId 的 GET 请求
  3. 检查返回的题目是否优先属于该 wordId
- **预期输出**:
  - HTTP 状态码: 200
  - data 数组前 3 题（flow 的题目数）的 `wordId` 匹配传入值
  - data 总长度 ≤ 10
- **清理**: 无

### TC-103: 出题 — 已登录用户排除 24h 已答题目
- **类型**: 功能测试
- **关联验收标准**: getQuestions 解析 userId（来自 optionalAuth）；service 排除 24h 已答
- **前置条件**: 有效 JWT Token
- **输入**:
  - 请求: `GET /api/v1/quiz/questions?direction=zh2en`
  - Header: `Authorization: Bearer <valid_token>`
- **执行步骤**:
  1. 先用该用户提交 3 道题的答案（POST /submit），记录已回答的 questionId
  2. 再 GET /questions
  3. 检查返回的 10 题中不含已回答的 3 题
- **预期输出**:
  - HTTP 状态码: 200
  - data 中不包含已提交过的 questionId
- **清理**: 测试后可删除该用户的 QuizAttempt 记录

### TC-104: 出题 — en2zh 方向（无数据）
- **类型**: 边界测试
- **关联验收标准**: direction 参数正确传递给 service
- **前置条件**: 数据库中无 en2zh 方向题目
- **输入**:
  - 请求: `GET /api/v1/quiz/questions?direction=en2zh`
- **预期输出**:
  - HTTP 状态码: 200
  - `{ data: [] }` — 空数组，不抛异常
- **清理**: 无

---

## 二、功能测试 — POST /api/v1/quiz/submit

### TC-201: 提交判分 — 正确答案
- **类型**: 功能测试
- **关联验收标准**: submitAnswer 调用 quizService.judgeAnswer；返回判分结果
- **前置条件**: 通过 GET /questions 拿到一个有效 questionId
- **输入**:
  - 请求: `POST /api/v1/quiz/submit`
  - Body: `{ "questionId": "<valid_id>", "userInput": "<该题的 reference 原文>" }`
- **执行步骤**:
  1. 先 GET /questions 取第一题
  2. 用该题的 reference 作为 userInput 提交
- **预期输出**:
  - HTTP 状态码: 200
  - 响应体包含: `correct: true`, `score` ≈ 90-100, `matched` 含所有关键词, `missing: []`, `analysis` 字符串
- **清理**: 无

### TC-202: 提交判分 — 错误答案
- **类型**: 功能测试
- **关联验收标准**: 判分结果正确返回
- **前置条件**: 有效 questionId
- **输入**:
  - Body: `{ "questionId": "<valid_id>", "userInput": "a completely wrong answer" }`
- **预期输出**:
  - HTTP 状态码: 200
  - `correct: false`, `score` < 70, `missing` 非空
- **清理**: 无

### TC-203: 提交判分 — 已登录用户自动保存记录
- **类型**: 集成测试
- **关联验收标准**: optionalAuth 传递 userId → service 保存 QuizAttempt
- **前置条件**: 有效 JWT Token + 有效 questionId
- **输入**:
  - Header: `Authorization: Bearer <valid_token>`
  - Body: `{ "questionId": "<valid_id>", "userInput": "test answer" }`
- **执行步骤**:
  1. 提交判分（带 Token）
  2. 直接查 MongoDB QuizAttempt 集合，验证新增了记录
- **预期输出**:
  - HTTP 状态码: 200
  - DB 中新增一条 QuizAttempt，userId 匹配 Token 用户
- **清理**: 删除该测试产生的 QuizAttempt 记录

### TC-204: 提交判分 — 匿名用户不保存记录
- **类型**: 功能测试
- **关联验收标准**: 无 Token 时 userId = null，服务层不保存 QuizAttempt
- **前置条件**: 有效 questionId
- **输入**:
  - 无 Authorization Header
  - Body: `{ "questionId": "<valid_id>", "userInput": "test answer" }`
- **执行步骤**:
  1. 提交判分（不带 Token）
  2. 查 MongoDB QuizAttempt，确认该 questionId + 该输入**没有**新增记录（或使用独立验证：查 count 不变）
- **预期输出**:
  - HTTP 状态码: 200（判分结果正常返回）
  - DB 中无新增匿名用户的 QuizAttempt 记录
- **清理**: 无

---

## 三、功能测试 — GET /api/v1/quiz/history

### TC-301: 答题历史 — 基本分页查询
- **类型**: 功能测试
- **关联验收标准**: getHistory 调用 quizService.getHistory；返回分页元数据
- **前置条件**: 有效 JWT Token + 已至少提交 2 次判分
- **输入**:
  - Header: `Authorization: Bearer <valid_token>`
  - 请求: `GET /api/v1/quiz/history`
- **执行步骤**:
  1. 先提交 2 次判分（带 Token）
  2. GET /history
- **预期输出**:
  - HTTP 状态码: 200
  - 响应体: `{ data: [...], pagination: { total, page, limit, totalPages } }`
  - data 按 `submittedAt` 降序排列（最新在前）
  - pagination: page=1, limit=20（默认值）, total ≥ 2
  - data 每条包含 `questionId`, `prompt`, `direction`, `userInput`, `score`, `correct`, `reference`, `submittedAt`
- **清理**: 删除测试 QuizAttempt 记录

### TC-302: 答题历史 — 自定义分页
- **类型**: 功能测试
- **关联验收标准**: getHistory 支持 page/limit 参数
- **前置条件**: 有效 JWT Token + 至少 3 条答题记录
- **输入**:
  - 请求: `GET /api/v1/quiz/history?page=1&limit=2`
- **预期输出**:
  - HTTP 状态码: 200
  - data 长度 = 2
  - pagination.totalPages = ceil(total / 2)
  - pagination.limit = 2
- **清理**: 无

### TC-303: 答题历史 — 无历史记录
- **类型**: 边界测试
- **关联验收标准**: 无记录时不抛异常
- **前置条件**: 一个没有任何答题记录的用户 Token
- **输入**:
  - Header: `Authorization: Bearer <token_of_user_with_no_attempts>`
  - 请求: `GET /api/v1/quiz/history`
- **预期输出**:
  - HTTP 状态码: 200
  - `{ data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } }`
- **清理**: 无

---

## 四、功能测试 — GET /api/v1/quiz/stats

### TC-401: 训练统计 — 有数据
- **类型**: 功能测试
- **关联验收标准**: getStats 调用 quizService.getStats
- **前置条件**: 有效 JWT Token + 至少 2 条答题记录（1 对 1 错）
- **输入**:
  - Header: `Authorization: Bearer <valid_token>`
  - 请求: `GET /api/v1/quiz/stats`
- **预期输出**:
  - HTTP 状态码: 200
  - 响应体: `{ totalQuestions: N, correctRate: M, recentTrend: [7个数字] }`
  - correctRate 为整数百分比（0-100）
  - recentTrend 长度固定为 7
- **清理**: 无

### TC-402: 训练统计 — 无数据
- **类型**: 边界测试
- **关联验收标准**: 无记录时返回零值
- **前置条件**: 无答题记录的用户 Token
- **输入**:
  - Header: `Authorization: Bearer <token_of_new_user>`
  - 请求: `GET /api/v1/quiz/stats`
- **预期输出**:
  - HTTP 状态码: 200
  - `{ totalQuestions: 0, correctRate: 0, recentTrend: [0,0,0,0,0,0,0] }`
- **清理**: 无

---

## 五、校验与异常测试

### TC-501: direction 参数非法
- **类型**: 异常测试
- **关联验收标准**: direction 非法 → 400 VALIDATION_ERROR
- **输入**:
  - 请求: `GET /api/v1/quiz/questions?direction=invalid`
- **预期输出**:
  - HTTP 状态码: 400
  - `{ error: { code: "VALIDATION_ERROR", message: "..." } }`
- **清理**: 无

### TC-502: direction 参数缺失
- **类型**: 异常测试
- **关联验收标准**: 必填参数校验
- **输入**:
  - 请求: `GET /api/v1/quiz/questions`（无 direction）
- **预期输出**:
  - HTTP 状态码: 400
  - `{ error: { code: "VALIDATION_ERROR" } }`
- **清理**: 无

### TC-503: userInput 为空字符串
- **类型**: 异常测试
- **关联验收标准**: userInput 为空 → 400
- **输入**:
  - 请求: `POST /api/v1/quiz/submit`
  - Body: `{ "questionId": "<valid_id>", "userInput": "" }`
- **预期输出**:
  - HTTP 状态码: 400
  - `{ error: { code: "VALIDATION_ERROR" } }`
- **清理**: 无

### TC-504: userInput 纯空格
- **类型**: 边界测试
- **关联验收标准**: userInput trim 后为空 → 400
- **输入**:
  - Body: `{ "questionId": "<valid_id>", "userInput": "     " }`
- **预期输出**:
  - HTTP 状态码: 400
- **清理**: 无

### TC-505: userInput 超过 2000 字
- **类型**: 边界测试
- **关联验收标准**: userInput > 2000 字 → 400
- **输入**:
  - Body: `{ "questionId": "<valid_id>", "userInput": "<2001 个字符的字符串>" }`
- **预期输出**:
  - HTTP 状态码: 400
  - `{ error: { code: "VALIDATION_ERROR" } }`
- **清理**: 无

### TC-506: userInput 恰好 2000 字
- **类型**: 边界测试
- **关联验收标准**: userInput ≤ 2000 字应通过
- **输入**:
  - Body: `{ "questionId": "<valid_id>", "userInput": "<2000 个字符的字符串>" }`
- **预期输出**:
  - HTTP 状态码: 200（校验通过，服务层正常判分）
- **清理**: 无

### TC-507: questionId 缺失
- **类型**: 异常测试
- **关联验收标准**: 必填参数校验
- **输入**:
  - Body: `{ "userInput": "test" }`（无 questionId）
- **预期输出**:
  - HTTP 状态码: 400
  - `{ error: { code: "VALIDATION_ERROR" } }`
- **清理**: 无

### TC-508: questionId 格式非法
- **类型**: 异常测试
- **关联验收标准**: Service 层校验 `mongoose.Types.ObjectId.isValid`
- **输入**:
  - Body: `{ "questionId": "not-an-object-id", "userInput": "test" }`
- **预期输出**:
  - HTTP 状态码: 400
  - `{ error: { code: "INVALID_ID" } }`
- **清理**: 无

### TC-509: questionId 不存在
- **类型**: 异常测试
- **关联验收标准**: Service 层 findById → null → 404 NOT_FOUND
- **输入**:
  - Body: `{ "questionId": "000000000000000000000000", "userInput": "test" }`
- **预期输出**:
  - HTTP 状态码: 404
  - `{ error: { code: "NOT_FOUND" } }`
- **清理**: 无

---

## 六、认证测试

### TC-601: /history 无 Token → 401
- **类型**: 异常测试
- **关联验收标准**: /history 需要 authMiddleware
- **输入**:
  - 请求: `GET /api/v1/quiz/history`（无 Authorization Header）
- **预期输出**:
  - HTTP 状态码: 401
  - `{ error: { code: "UNAUTHORIZED" } }`
- **清理**: 无

### TC-602: /history 无效 Token → 401
- **类型**: 异常测试
- **关联验收标准**: authMiddleware 校验 Token 有效性
- **输入**:
  - Header: `Authorization: Bearer invalid_token_xxx`
- **预期输出**:
  - HTTP 状态码: 401
  - `{ error: { code: "INVALID_TOKEN" } }`
- **清理**: 无

### TC-603: /stats 无 Token → 401
- **类型**: 异常测试
- **关联验收标准**: /stats 需要 authMiddleware
- **输入**:
  - 请求: `GET /api/v1/quiz/stats`（无 Authorization Header）
- **预期输出**:
  - HTTP 状态码: 401
- **清理**: 无

### TC-604: /questions 无效 Token → 200（optionalAuth 静默忽略）
- **类型**: 功能测试
- **关联验收标准**: /questions 使用 optionalAuth，无效 Token 不阻断请求
- **输入**:
  - 请求: `GET /api/v1/quiz/questions?direction=zh2en`
  - Header: `Authorization: Bearer invalid_token_xxx`
- **预期输出**:
  - HTTP 状态码: 200
  - 正常返回题目（行为与匿名用户一致）
- **清理**: 无

### TC-605: /submit 无效 Token → 200（optionalAuth 静默忽略）
- **类型**: 功能测试
- **关联验收标准**: /submit 使用 optionalAuth，无效 Token 不阻断请求
- **输入**:
  - Header: `Authorization: Bearer invalid_token_xxx`
  - Body: `{ "questionId": "<valid_id>", "userInput": "test" }`
- **预期输出**:
  - HTTP 状态码: 200
  - 正常判分，但不保存 QuizAttempt（userId = null）
- **清理**: 无

---

## 七、集成测试 🔴（跨 Task — 依赖 Task 1.1）

### I-001: 完整链路 — 认证用户答题全流程
- **类型**: 集成测试（跨 Task）
- **关联依赖**: Task 1.2 ← 依赖 Task 1.1
- **前置条件**:
  - Task 1.1 quiz.service.ts 已完成
  - Task 0.2 种子数据已完成（20 条 zh2en 题目入库）
  - 有效 JWT Token（可通过 /api/v1/auth/login 获取）
- **集成链路**: Controller → Task 1.1 Service → MongoDB（QuizQuestion + QuizAttempt）
- **执行步骤**:
  1. GET /api/v1/quiz/questions?direction=zh2en（带 Token）→ 获取 10 题 → 验证 200 + data.length=10
  2. POST /api/v1/quiz/submit（带 Token，用第 1 题的 reference 作为答案）→ 验证 correct=true, score≥90
  3. POST /api/v1/quiz/submit（带 Token，用错误答案 "xyz"）→ 验证 correct=false
  4. GET /api/v1/quiz/history（带 Token）→ 验证 data.length=2，按时间降序
  5. GET /api/v1/quiz/stats（带 Token）→ 验证 totalQuestions=2，correctRate=50
  6. GET /api/v1/quiz/questions?direction=zh2en（带 Token）→ 验证已回答的题被排除（前 2 题不出现）
- **预期输出**: 所有步骤均返回 200/正确数据，MongoDB QuizAttempt 有 2 条记录
- **清理**: 删除该用户的所有 QuizAttempt 记录

### I-002: 匿名用户完整流程（无 Token）
- **类型**: 集成测试（跨 Task）
- **关联依赖**: Task 1.2 ← 依赖 Task 1.1
- **前置条件**: 种子数据就绪
- **集成链路**: Controller (optionalAuth → userId=null) → Service → MongoDB
- **执行步骤**:
  1. GET /api/v1/quiz/questions?direction=zh2en（无 Token）→ 200 + 10 题
  2. POST /api/v1/quiz/submit（无 Token，用 reference 答案）→ 200 + correct=true
  3. POST /api/v1/quiz/submit（无 Token，错误答案）→ 200 + correct=false
  4. GET /api/v1/quiz/history（无 Token）→ 401
  5. GET /api/v1/quiz/stats（无 Token）→ 401
- **预期输出**:
  - 步骤 1-3: 200 正常返回
  - 步骤 4-5: 401（需要登录）
  - MongoDB QuizAttempt 无匿名用户记录
- **清理**: 无

### I-003: Swagger 文档可访问 + Quiz 模块可见
- **类型**: 集成测试
- **关联验收标准**: Swagger UI 中可见 Quiz 模块，4 个端点有文档
- **前置条件**: 服务已启动
- **执行步骤**:
  1. GET /api-docs（或 Swagger JSON endpoint）→ 200
  2. 在 Swagger spec 中搜索 "Quiz" tag
  3. 验证 4 个路径存在: `/api/v1/quiz/questions`, `/api/v1/quiz/submit`, `/api/v1/quiz/history`, `/api/v1/quiz/stats`
- **预期输出**:
  - swaggerSpec 中 `tags` 数组包含 `{ name: "Quiz", description: "..." }`
  - `paths` 中包含上述 4 个路径的定义
- **清理**: 无

---

## 八、阶段 E2E 场景（供 ai-master 阶段集成 Gate 使用）

> 以下场景在阶段 1（Task 1.1 + 1.2）全部完成后，由 ai-master 执行端到端验证。
> 同时也属于 tasks.md 中「阶段 1 集成验收清单」所列的验证项。

### E2E-01: 已登录用户完整答题闭环
- **涉及 Task**: Task 1.1, Task 1.2
- **用户故事**: 作为已登录用户，我想打开训练页获取题目、逐题作答、查看历史记录和统计数据，以便跟踪训练进度。
- **执行步骤**:
  1. [Task 1.2] `GET /api/v1/quiz/questions?direction=zh2en` (带 JWT) → 10 题
  2. [Task 1.1+1.2] 逐题 `POST /api/v1/quiz/submit` (带 JWT) → 每题返回 score/correct/matched/missing/analysis
  3. [Task 1.1+1.2] `GET /api/v1/quiz/history` (带 JWT) → 返回 10 条记录，含分页
  4. [Task 1.1+1.2] `GET /api/v1/quiz/stats` (带 JWT) → totalQuestions=10, correctRate 计算正确, recentTrend 今日有非零值
  5. [Task 1.1+1.2] 再次 `GET /api/v1/quiz/questions?direction=zh2en` (带 JWT) → 24h 内已答题目被排除
- **通过标准**:
  - [ ] 所有 HTTP 响应为 200
  - [ ] 判分逻辑与前端 quizEngine.ts 算法一致（可用种子数据 q1 的 reference 验证 score=100）
  - [ ] 历史记录按时间降序排列
  - [ ] 统计的 correctRate 为整数百分比
  - [ ] 24h 去重生效
- **失败时涉及模块**: quiz.service.ts / quiz.controller.ts / quiz.validator.ts / auth middleware

### E2E-02: 匿名用户答题 + 认证边界
- **涉及 Task**: Task 1.1, Task 1.2
- **用户故事**: 作为未登录用户，我想直接体验答题功能，不需要注册即可训练；但历史记录和统计需要登录。
- **执行步骤**:
  1. [Task 1.2] `GET /api/v1/quiz/questions?direction=zh2en` (无 Token) → 200 + 10 题
  2. [Task 1.1+1.2] `POST /api/v1/quiz/submit` (无 Token, 用 reference 答案) → 200 + correct=true
  3. [Task 1.2] `GET /api/v1/quiz/history` (无 Token) → 401
  4. [Task 1.2] `GET /api/v1/quiz/stats` (无 Token) → 401
  5. [Task 1.2] 使用无效 Token 访问 `/questions` 和 `/submit` → 200（不阻断）
- **通过标准**:
  - [ ] 匿名用户可以获取题目 + 提交判分
  - [ ] 匿名用户无法访问 /history 和 /stats（401）
  - [ ] optionalAuth 对无效 Token 静默忽略
- **失败时涉及模块**: quiz.routes.ts / auth middleware / quiz.controller.ts

### E2E-03: 输入校验与异常处理
- **涉及 Task**: Task 1.1, Task 1.2
- **用户故事**: 作为前端开发者，我需要 API 对非法输入返回明确的错误码和描述，以便展示友好的用户提示。
- **执行步骤**:
  1. `GET /api/v1/quiz/questions?direction=invalid` → 400 VALIDATION_ERROR
  2. `GET /api/v1/quiz/questions` (无 direction) → 400 VALIDATION_ERROR
  3. `POST /api/v1/quiz/submit` body `{ userInput: "" }` → 400 VALIDATION_ERROR
  4. `POST /api/v1/quiz/submit` body `{ questionId: "not-an-id", userInput: "test" }` → 400 INVALID_ID
  5. `POST /api/v1/quiz/submit` body `{ questionId: "000000000000000000000000", userInput: "test" }` → 404 NOT_FOUND
  6. `POST /api/v1/quiz/submit` body `{ questionId: "<valid_id>", userInput: "<2001 chars>" }` → 400 VALIDATION_ERROR
- **通过标准**:
  - [ ] 所有异常输入均返回对应错误码
  - [ ] 错误响应格式统一为 `{ error: { code, message } }`
  - [ ] 正常输入不受影响（200 正常返回）
- **失败时涉及模块**: quiz.validator.ts / quiz.controller.ts / error handler middleware
