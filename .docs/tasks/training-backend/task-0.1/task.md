# Task 0.1: 创建 QuizQuestion / QuizAttempt 数据模型

| 属性 | 值 |
|------|-----|
| ID | 0.1 |
| 状态 | done |
| 优先级 | P0 |
| 依赖 | 无 |
| 被依赖 | Task 0.2（种子数据迁移依赖本 Task 的 Model 定义） |
| 阶段 | 阶段0: 数据模型+种子 |
| 预估工时 | 1-2 小时 |
| 所属集成 Gate | [阶段 0 集成验收清单](../../../tasks.md) |

## 描述

为短句翻译训练模块创建两个 MongoDB 数据模型。前端 `client/src/data/quizEngine.ts` 已有 20 条硬编码 mock 题目（`mockQuizItems` 数组），需要将其结构化为两个 Mongoose Schema：

1. **QuizQuestion** — 题目模型，存储预置的中译英/英译中短句题目。每条题目包含：中文题干 (prompt)、认知意象提示 (hint)、方向 (direction)、参考答案 (reference)、判分关键词 (keywords)、中文意象分析 (analysis)，以及可选关联的单词和词库引用。
2. **QuizAttempt** — 答题记录模型，记录用户每次答题的输入、判分结果和时间。用于后续训练统计和历史回顾。

模型设计需遵循现有代码库的 Mongoose 模式约定（参考 `server/src/models/Word.ts`、`Note.ts`）。

## 验收标准

- [ ] `server/src/models/QuizQuestion.ts` — Schema 包含所有必要字段：prompt, hint, direction (枚举 'zh2en'|'en2zh'), reference, keywords (string[]), analysis, wordId (可选 ObjectId ref Word), wordbankId (可选 ObjectId ref WordBank)，timestamps
- [ ] `server/src/models/QuizAttempt.ts` — Schema 包含：userId (ObjectId ref User，可选，支持匿名用户), questionId (ObjectId ref QuizQuestion), userInput (string), score (number), correct (boolean), matched (string[]), missing (string[]), submittedAt (Date)，timestamps
- [ ] 索引：QuizQuestion.direction、QuizQuestion.wordId、QuizAttempt.userId、QuizAttempt (userId + questionId) 复合索引
- [ ] `server/src/models/index.ts` — 导出 QuizQuestion 和 QuizAttempt
- [ ] TypeScript 类型定义完整，通过 `tsc --noEmit` 编译检查
- [ ] 符合现有 ADR 中的 Mongoose 规范和命名约定（ESM export、IQuizQuestion interface 等）

## 子任务

### SUB-0.1.1: 定义 QuizQuestion Schema
- **描述**: 参考 `client/src/data/quizEngine.ts` 中 `mockQuizItems` 的数据结构，创建 `QuizQuestion` Mongoose 模型。direction 字段使用 enum 约束 ('zh2en', 'en2zh')，wordId/wordbankId 为可选引用。
- **验收标准**:
  - [ ] Schema 包含 prompt, hint, direction, reference, keywords, analysis, wordId?, wordbankId? 字段
  - [ ] direction 为 enum 类型
  - [ ] wordId 和 wordbankId 为 ObjectId ref 类型
  - [ ] 包含 timestamps

### SUB-0.1.2: 定义 QuizAttempt Schema
- **描述**: 创建 `QuizAttempt` 模型用于记录每次答题。userId 为可选（匿名用户不保存记录时可能不传），questionId 必填。注意 score 和 matched/missing 字段基于前端 quizEngine `judgeAnswer()` 的返回结构。
- **验收标准**:
  - [ ] Schema 包含 userId?, questionId, userInput, score, correct, matched, missing, submittedAt 字段
  - [ ] (userId + questionId) 复合索引（非 unique，允许重复答题）
  - [ ] 包含 timestamps

### SUB-0.1.3: 注册到 models/index.ts
- **描述**: 在 `server/src/models/index.ts` 中导出 QuizQuestion 和 QuizAttempt，与其他 Model 保持一致
- **验收标准**:
  - [ ] index.ts 新增 `export { QuizQuestion }` 和 `export { QuizAttempt }`
  - [ ] tsc 编译无错误

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
