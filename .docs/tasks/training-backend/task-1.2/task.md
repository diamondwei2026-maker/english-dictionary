# Task 1.2: 实现 Quiz API 路由、控制器与校验

| 属性 | 值 |
|------|-----|
| ID | 1.2 |
| 状态 | done |
| 优先级 | P0 |
| 依赖 | Task 1.1（需要 quiz.service.ts） |
| 被依赖 | Task 2.1（前端集成依赖 API 可用） |
| 阶段 | 阶段1: Quiz API |
| 预估工时 | 2-3 小时 |
| 所属集成 Gate | [阶段 1 集成验收清单](../../../tasks.md) |

## 描述

将 Task 1.1 的 Quiz 服务层通过 Express 路由公开为 REST API。需要创建：
- **Controller** — 请求解析、参数提取、调用 Service、响应格式化
- **Validator** — express-validator 校验链（direction 枚举、userInput 非空 ≤2000 字）
- **Routes** — 路由定义及中间件组合
- 在 `routes/index.ts` 中挂载

关键设计要点：训练页无需登录即可使用（`optionalAuth` — 参考 `notes.routes.ts` 中公开笔记 API 的 optionalAuth 用法）。`GET /questions` 和 `POST /submit` 使用 optionalAuth；`GET /history` 和 `GET /stats` 需要认证。

## 验收标准

- [ ] `server/src/controllers/quiz.controller.ts` — 4 个 controller 函数（getQuestions, submitAnswer, getHistory, getStats）
- [ ] `server/src/validators/quiz.validator.ts` — express-validator 校验链（direction 必须为 'zh2en'/'en2zh'；userInput trim 后非空且 ≤2000 字）
- [ ] `server/src/routes/quiz.routes.ts` — 路由定义：
  - `GET /api/v1/quiz/questions?direction=zh2en&wordId=` → optionalAuth → getQuestions
  - `POST /api/v1/quiz/submit` → optionalAuth → validateSubmitAnswer → submitAnswer
  - `GET /api/v1/quiz/history?page=&limit=` → auth → getHistory
  - `GET /api/v1/quiz/stats` → auth → getStats
- [ ] `server/src/routes/index.ts` — 挂载 quizRoutes
- [ ] 更新 `config/swagger.ts` — 新增 `/api/v1/quiz/*` 相关 OpenAPI 文档
- [ ] `server/src/controllers/index.ts` 和 `server/src/services/index.ts` 导出完整
- [ ] direction 非法 → 400 + `{ error: { code: "VALIDATION_ERROR", message: "..." } }`
- [ ] userInput 为空 → 400
- [ ] userInput > 2000 字 → 400
- [ ] optionalAuth：无 Token 时 userId = null，服务层不保存 QuizAttempt
- [ ] 通过 `tsc --noEmit` 编译检查

## 子任务

### SUB-1.2.1: 创建 Controller + Validator
- **描述**: 创建 `quiz.controller.ts`（4 个函数）和 `quiz.validator.ts`（2 组校验链）。Controller 调用 Service 层，Service 返回的纯数据由 Controller 格式化为 JSON 响应。Validator 遵循现有 `validators/` 目录的 express-validator 风格。
- **验收标准**:
  - [ ] getQuestions: 解析 query params (direction, wordId)，调用 quizService.generateQuiz
  - [ ] submitAnswer: 解析 body (questionId, userInput)，调用 quizService.judgeAnswer
  - [ ] getHistory: 解析 query params (page, limit)，调用 quizService.getHistory
  - [ ] getStats: 调用 quizService.getStats
  - [ ] validator 校验 direction / userInput

### SUB-1.2.2: 创建 Routes + 集成到主路由
- **描述**: 创建 `quiz.routes.ts`，通过 `server/src/routes/index.ts` 挂载（参考现有 `notes.routes.ts` 的挂载方式）。optionalAuth 用法参考 `notes.routes.ts` 中 `GET /public` 的处理。
- **验收标准**:
  - [ ] 路由正确注册到 `/api/v1/quiz/...`
  - [ ] optionalAuth 正确工作（登录态可选传递 userId）
  - [ ] `/api/v1/health` 不受影响

### SUB-1.2.3: 更新 Swagger 文档
- **描述**: 在 `server/src/config/swagger.ts` 中新增 quiz 模块的 OpenAPI 文档
- **验收标准**:
  - [ ] Swagger UI 中可见 Quiz 模块
  - [ ] 4 个 API 端点均有文档说明

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
