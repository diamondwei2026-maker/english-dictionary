# Coding Prompt — Task 1.2: 实现 Quiz API 路由、控制器与校验

> 基于对项目代码的完整探查生成。所有签名、模式、导入路径均已与实际代码确认。

---

## 1. 任务目标

将 Task 1.1 的 `quiz.service.ts` 核心服务通过 Express 路由公开为 REST API，包括控制器、输入校验、路由定义和 Swagger 文档。

---

## 2. 技术上下文

- **语言/框架**: Node.js + Express + TypeScript (ESM, `"type": "module"`)
- **路由前缀**: `/api/v1`（由 `app.ts` 统一挂载，路由文件中**不要**写 `/api/v1` 前缀）
- **数据库**: MongoDB Atlas + Mongoose（控制器不直接操作 DB，调用 Service 层）
- **认证**: JWT — `authMiddleware`（强制） / `optionalAuth`（可选，无效 Token 静默放行）
- **错误处理**: `AppError(statusCode, code, message, errors?)` + Express `errorHandler` 中间件
- **异步包装**: `asyncHandler(fn)` 包裹所有 controller 函数

### 涉及文件

| 操作 | 路径 | 说明 |
|------|------|------|
| **新建** | `server/src/controllers/quiz.controller.ts` | 4 个 controller 函数（该路径不存在 ✅） |
| **新建** | `server/src/validators/quiz.validator.ts` | 3 组校验函数（该路径不存在 ✅） |
| **新建** | `server/src/routes/quiz.routes.ts` | 路由定义 + 中间件组合（该路径不存在 ✅） |
| **修改** | `server/src/routes/index.ts` | 挂载 quizRoutes |
| **修改** | `server/src/controllers/index.ts` | 导出 quiz controller |
| **修改** | `server/src/config/swagger.ts` | 新增 Quiz tag + 4 个 API 路径定义 |

### 已有代码探查结果 🔴

- ✅ **依赖 Task 1.1**：`server/src/services/quiz.service.ts`（已读取完整内容）
  - `generateQuiz(direction: "zh2en" | "en2zh", wordId?: string, userId?: string): Promise<IQuizQuestion[]>`
  - `judgeAnswer(questionId: string, userInput: string, userId?: string): Promise<QuizResult>`
  - `getHistory(userId: string, page?: number, limit?: number): Promise<{ data: Array<...>, pagination: {...} }>`
  - `getStats(userId: string): Promise<{ totalQuestions: number, correctRate: number, recentTrend: number[] }>`
  - `QuizResult = { correct: boolean, score: number, matched: string[], missing: string[], analysis: string }`
  - `judgeAnswer` 内部已做 `ObjectId.isValid` 校验（抛 `AppError(400, "INVALID_ID")`）和 `findById` 查无结果（抛 `AppError(404, "NOT_FOUND")`）
  - 已从 `services/index.ts` 导出：`export * from "./quiz.service.js"`
- ✅ **中间件**：`optionalAuth` — Token 存在且有效时设 `req.user`，不存在或无效时设为 `undefined` 后放行
- ✅ **中间件**：`authMiddleware` — 无/无效 Token 时抛 `AppError(401, "UNAUTHORIZED"/"INVALID_TOKEN")`
- ✅ **Express 类型**：`req.user?: { userId: string; role: "user" | "admin" }`
- ✅ **路由挂载位置**：`routes/index.ts` 使用 `routes.use("/quiz", quizRoutes)` 模式
- ✅ **项目不使用 express-validator**：Grep 确认无任何文件引用此包。所有现有 validator（`auth.validator.ts`, `ai.validator.ts` 等）使用自定义校验函数 + `AppError` 抛错模式
- ✅ **swagger.ts**：使用内联定义方式（`apis: []`，全部内容在 `paths` 中手写），已有 `tags` 数组和 `Pagination` schema

---

## 3. 代码规范要求

1. **ESM 导入**：使用 `.js` 扩展名（如 `import { ... } from "../utils/asyncHandler.js"`）
2. **async/await**：所有异步操作用 async/await，不用 Promise.then
3. **Controller 模式**：每个 handler 是 `export const fn = asyncHandler(async (req, res, _next) => { ... })` 形式的具名导出
4. **Validator 模式**：自定义函数，接收 `body: unknown` 或 `query: unknown`，在发现错误时 `throw new AppError(400, "VALIDATION_ERROR", "消息")`，不在路由中使用 express-validator 中间件链
5. **Controller 不调用 req.user!**：`/questions` 和 `/submit` 使用 optionalAuth，`req.user` 可能为 `undefined`。使用 `req.user?.userId` 传递
6. **错误格式**：统一为 `{ error: { code: string, message: string } }`
7. **响应信封**：列表数据用 `{ data: [...], pagination: {...} }`、统计用 `{ totalQuestions, correctRate, recentTrend }`、题目用 `{ data: [...] }`
8. **RESTful 命名**：小写复数路径，`/api/v1/quiz/questions`、`/api/v1/quiz/submit`、`/api/v1/quiz/history`、`/api/v1/quiz/stats`

---

## 4. 实现要求

### 4.1 文件 `server/src/validators/quiz.validator.ts`（新建）

**遵循现有 validator 模式**（参考 `ai.validator.ts` 和 `auth.validator.ts`）：

```typescript
// 模式示例（具体实现自行编写）:
import { AppError } from "../utils/errors.js";

export function validateGetQuestionsQuery(query: unknown): { direction: string; wordId?: string } {
  // 校验 direction 为必填，且值必须是 "zh2en" 或 "en2zh"
  // wordId 为可选字符串
  // 失败时 throw new AppError(400, "VALIDATION_ERROR", "消息")
}

export function validateSubmitAnswerBody(body: unknown): { questionId: string; userInput: string } {
  // 校验 questionId 为必填字符串
  // 校验 userInput: trim 后非空 + 长度 ≤ 2000
  // questionId 的 ObjectId 格式校验留给 Service 层（judgeAnswer 已处理）
}

export function validateHistoryQuery(query: unknown): { page?: number; limit?: number } {
  // page/limit 为可选数字，默认值由 controller 提供
  // 如果提供了但无法解析为数字，抛 VALIDATION_ERROR
}
```

**具体要求**：
- `validateGetQuestionsQuery`：direction 必填，枚举 `"zh2en"` / `"en2zh"`，非法值 → `400 VALIDATION_ERROR`。wordId 可选字符串
- `validateSubmitAnswerBody`：questionId 必填 + userInput 必填（trim 后非空） + userInput ≤ 2000 字。**不做** ObjectId 格式校验（Service 层 `judgeAnswer` 已用 `mongoose.Types.ObjectId.isValid` 校验）
- `validateHistoryQuery`：page 和 limit 可选，传了则解析为正整数，非法值 → 400

### 4.2 文件 `server/src/controllers/quiz.controller.ts`（新建）

**遵循现有 controller 模式**（参考 `notes.controller.ts`）：

需要创建 4 个具名导出函数，全部用 `asyncHandler` 包裹：

#### `getQuestions`
- **方法/路径**: `GET /quiz/questions?direction=zh2en&wordId=`
- **认证**: `optionalAuth`
- **逻辑**:
  1. 调用 `validateGetQuestionsQuery(req.query)` 校验参数
  2. 从 `req.user?.userId` 获取 userId（可能为 undefined）
  3. 调用 `quizService.generateQuiz(direction, wordId, userId)`
  4. 返回 `res.json({ data: questions })`

#### `submitAnswer`
- **方法/路径**: `POST /quiz/submit`
- **认证**: `optionalAuth`
- **逻辑**:
  1. 调用 `validateSubmitAnswerBody(req.body)` 校验
  2. 从 `req.user?.userId` 获取 userId
  3. 调用 `quizService.judgeAnswer(questionId, userInput, userId)`
  4. 返回 `res.json(result)`（QuizResult 结构）

#### `getHistory`
- **方法/路径**: `GET /quiz/history?page=1&limit=20`
- **认证**: `authMiddleware`（强制）
- **逻辑**:
  1. 调用 `validateHistoryQuery(req.query)` 校验
  2. page 默认 1，limit 默认 20
  3. 调用 `quizService.getHistory(req.user!.userId, page, limit)`
  4. 返回 `res.json({ data, pagination })`

#### `getStats`
- **方法/路径**: `GET /quiz/stats`
- **认证**: `authMiddleware`（强制）
- **逻辑**:
  1. 调用 `quizService.getStats(req.user!.userId)`
  2. 返回 `res.json({ totalQuestions, correctRate, recentTrend })`

### 4.3 文件 `server/src/routes/quiz.routes.ts`（新建）

**遵循现有路由模式**（参考 `notes.routes.ts`）：

```typescript
import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware, optionalAuth } from "../middleware/index.js";
import * as quizController from "../controllers/quiz.controller.js";

const router = Router();

// GET /quiz/questions — 获取题目（可选认证）
router.get("/questions", optionalAuth, quizController.getQuestions);

// POST /quiz/submit — 提交判分（可选认证）
router.post("/submit", optionalAuth, quizController.submitAnswer);

// GET /quiz/history — 答题历史（需认证）
router.get("/history", authMiddleware, quizController.getHistory);

// GET /quiz/stats — 训练统计（需认证）
router.get("/stats", authMiddleware, quizController.getStats);

export const quizRoutes: RouterType = router;
```

**关键约定**：
- 路由路径**不含** `/api/v1` 前缀（由 `app.ts` 统一添加）
- 路由路径**不含** `/quiz` 前缀（由 `routes/index.ts` 挂载时添加）
- 使用 `as RouterType` 类型断言（与项目现有路由一致）
- `optionalAuth` 在 `authMiddleware` 之前执行的路由线

### 4.4 文件 `server/src/routes/index.ts`（修改）

**当前内容**（第 1-29 行）已读取确认。

在 import 区域添加：
```typescript
import { quizRoutes } from "./quiz.routes.js";
```

在路由挂载区域（`routes.use(...)` 调用附近，建议在 `notesRoutes` 挂载之后）添加：
```typescript
routes.use("/quiz", quizRoutes);
```

**注意**：不要删除或修改现有的兜底 404 处理器（`routes.all("*", ...)`）。

### 4.5 文件 `server/src/controllers/index.ts`（修改）

**当前内容**（仅一行注释）：
```
// Controller layer — request handlers
```

在注释下方添加：
```typescript
export * from "./quiz.controller.js";
```

### 4.6 文件 `server/src/config/swagger.ts`（修改）

需要在两个位置添加内容：

#### A. `tags` 数组

在现有 tags 数组中（约第 142-151 行），添加到合适位置（建议在 "Health" 之前）：
```typescript
{ name: "Quiz", description: "短句翻译训练 — 出题、判分、答题历史与统计" },
```

#### B. `paths` 对象

在 `paths` 对象内（约第 152 行开始），添加 4 个端点定义。参考现有端点的格式（如 `"/api/v1/health"`），添加：

1. **`GET /api/v1/quiz/questions`** — 获取题目
   - tags: ["Quiz"]
   - security: []（公开接口，可选认证）
   - parameters: direction (required, enum zh2en/en2zh), wordId (optional)
   - responses: 200（`{ data: [...] }`）, 400（VALIDATION_ERROR）

2. **`POST /api/v1/quiz/submit`** — 提交判分
   - tags: ["Quiz"]
   - security: []
   - requestBody: questionId (required), userInput (required)
   - responses: 200（quiz result）, 400, 404

3. **`GET /api/v1/quiz/history`** — 答题历史
   - tags: ["Quiz"]
   - security: [{ bearerAuth: [] }]
   - parameters: page, limit
   - responses: 200（`{ data, pagination }`）, 401

4. **`GET /api/v1/quiz/stats`** — 训练统计
   - tags: ["Quiz"]
   - security: [{ bearerAuth: [] }]
   - responses: 200（`{ totalQuestions, correctRate, recentTrend }`）, 401

**Swagger Schema 定义**（可选但推荐）：在 `components.schemas` 中添加 `QuizQuestion` 和 `QuizResult` schema，方便文档引用。

---

## 5. 测试要求

代码必须能通过以下测试用例（详见 [test-cases.md](./test-cases.md)）：

### 功能测试
- **TC-101 ~ TC-104** — GET /questions 各场景（zh2en 出题、wordId 筛选、已登录排除、en2zh 空数组）
- **TC-201 ~ TC-204** — POST /submit 各场景（正确答案、错误答案、已登录保存记录、匿名不保存）
- **TC-301 ~ TC-303** — GET /history 各场景（基本分页、自定义分页、无记录空数组）
- **TC-401 ~ TC-402** — GET /stats 各场景（有数据统计、无数据零值）

### 校验与异常测试 🔴
- **TC-501** — direction 非法 → 400
- **TC-502** — direction 缺失 → 400
- **TC-503** — userInput 空字符串 → 400
- **TC-504** — userInput 纯空格 → 400
- **TC-505** — userInput > 2000 字 → 400
- **TC-506** — userInput 恰好 2000 字 → 200（通过校验）
- **TC-507** — questionId 缺失 → 400
- **TC-508** — questionId 格式非法 → 400（由 Service 层返回 INVALID_ID）
- **TC-509** — questionId 不存在 → 404（由 Service 层返回 NOT_FOUND）

### 认证测试 🔴
- **TC-601** — /history 无 Token → 401
- **TC-602** — /history 无效 Token → 401
- **TC-603** — /stats 无 Token → 401
- **TC-604** — /questions 无效 Token → 200（静默忽略）
- **TC-605** — /submit 无效 Token → 200（静默忽略）

### 集成测试 🔴（跨 Task — 依赖 Task 1.1）
- **I-001** — 已登录用户完整答题闭环（出题 → 判分×2 → 历史 → 统计 → 排除已答）
- **I-002** — 匿名用户完整流程（出题 → 判分 → history/stats 401）
- **I-003** — Swagger 文档可访问 + Quiz 模块可见

---

## 6. 集成验证指令 🔴

> 代码写完后，执行以下验证确保与 Task 1.1 正确集成：

### 自检清单
1. [ ] Controller 调用的是 `quizService.generateQuiz`（非 mock）
2. [ ] `/questions` 和 `/submit` 使用 `optionalAuth`（非 `authMiddleware`）
3. [ ] `/history` 和 `/stats` 使用 `authMiddleware`
4. [ ] Controller 函数不直接操作 Mongoose Model（仅通过 Service 层）
5. [ ] `tsc --noEmit` 编译零错误

### 链路验证（I 系列用例核心步骤）

**前提**：确保 MongoDB 连接正常 + 种子数据已执行（Task 0.2）+ 服务已启动

```bash
# 1. 匿名获取题目（无需 Token）
curl -s http://localhost:<PORT>/api/v1/quiz/questions?direction=zh2en | jq ".data | length"
# 期望: 10（或可用的最大数量）

# 2. 匿名提交判分（用第一题的 reference 作为答案）
# 先获取 questionId: curl -s ... | jq ".data[0]._id"
curl -s -X POST http://localhost:<PORT>/api/v1/quiz/submit \
  -H "Content-Type: application/json" \
  -d '{"questionId":"<ID>","userInput":"<reference>"}' | jq ".correct"
# 期望: true

# 3. 登录获取 Token
curl -s -X POST http://localhost:<PORT>/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"test123"}'

# 4. 带 Token 获取历史（应 401 或空数据，取决于之前是否有记录）
curl -s http://localhost:<PORT>/api/v1/quiz/history \
  -H "Authorization: Bearer <TOKEN>" | jq ".pagination.total"

# 5. 带 Token 获取统计
curl -s http://localhost:<PORT>/api/v1/quiz/stats \
  -H "Authorization: Bearer <TOKEN>" | jq ".totalQuestions"

# 6. 校验测试 — direction 非法
curl -s http://localhost:<PORT>/api/v1/quiz/questions?direction=invalid | jq ".error.code"
# 期望: "VALIDATION_ERROR"

# 7. 校验测试 — userInput 为空
curl -s -X POST http://localhost:<PORT>/api/v1/quiz/submit \
  -H "Content-Type: application/json" \
  -d '{"questionId":"<ID>","userInput":""}' | jq ".error.code"
# 期望: "VALIDATION_ERROR"

# 8. Swagger JSON 包含 Quiz tag
curl -s http://localhost:<PORT>/api/docs/json | jq '.tags[] | select(.name=="Quiz")'
# 期望: 返回 Quiz tag 对象

# 9. Swagger paths 包含 4 个 quiz 端点
curl -s http://localhost:<PORT>/api/docs/json | jq '.paths | keys | map(select(startswith("/api/v1/quiz")))'
# 期望: 4 个路径
```

---

## 7. 注意事项

1. **Validator 一致性**：项目**不使用** `express-validator` 包。所有校验逻辑用自定义函数 + `AppError` 抛错。不要安装或引入 `express-validator`。
2. **Controller 不重复校验**：`questionId` 的 ObjectId 格式校验由 Service 层 `judgeAnswer` 的 `mongoose.Types.ObjectId.isValid` 处理。Controller 层只做基本的必填/类型/长度校验。Service 层抛的 `AppError` 会由 `asyncHandler` 自动转发给 `errorHandler`，无需 controller 用 try-catch 包裹。
3. **optionalAuth 的 req.user**：在 `/questions` 和 `/submit` 的 controller 中，使用 `req.user?.userId` 而非 `req.user!.userId`（后者会在无 Token 时 crash）。
4. **authMiddleware 的 req.user**：在 `/history` 和 `/stats` 的 controller 中，使用 `req.user!.userId` 是安全的（authMiddleware 已确保 `req.user` 存在）。
5. **service/index.ts 已就绪**：Task 1.1 完成后 `services/index.ts` 已包含 `export * from "./quiz.service.js"`，controller 可直接 `import * as quizService from "../services/quiz.service.js"` 或具名导入。
6. **兜底 404 路由**：`routes/index.ts` 末尾有 `routes.all("*", ...)` 兜底处理器。新增的 quizRoutes 必须在此行**之前**挂载。
7. **编译检查**：开发完成后务必运行 `npx tsc --noEmit`（在 `server/` 目录下），确保零 TypeScript 错误。
