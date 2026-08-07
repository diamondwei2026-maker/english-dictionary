# 测试用例 — Task 0.1: 创建 QuizQuestion / QuizAttempt 数据模型

> 生成日期：2026-08-06
> 生成者：test-case-generator
> 测试环境：本地 MongoDB（同开发环境），Node.js + TypeScript + Mongoose

---

## 测试范围概述

| 维度 | 用例数 | 说明 |
|------|--------|------|
| 功能测试 | 6 | 模型创建、字段读写、CRUD |
| 校验测试 | 5 | 必填字段、枚举约束、类型检查 |
| 索引测试 | 4 | 单字段索引 + 复合索引 |
| 编译测试 | 1 | TypeScript tsc --noEmit |
| 导出测试 | 2 | models/index.ts 导出 |
| 阶段 E2E | 1 | 阶段 0 跨 Task 端到端场景 |
| **合计** | **19** | |

> ℹ️ 本 Task 无依赖，不生成 I 系列集成用例。阶段集成验证与 Task 0.2 联测（由阶段 Gate 覆盖）。

---

## 测试用例

### TC-001: 创建完整 QuizQuestion 记录

- **类型**: 功能测试
- **关联验收标准**: QuizQuestion Schema 包含所有必要字段
- **前置条件**: MongoDB 连接正常，QuizQuestion 模型已注册
- **输入**:
  ```js
  await QuizQuestion.create({
    prompt: '健康的现金流是企业的生命线。',
    hint: 'flow · 资金沿渠道持续移动',
    direction: 'zh2en',
    reference: 'Healthy cash flow is the lifeblood of a business.',
    keywords: ['healthy', 'cash', 'flow', 'lifeblood'],
    analysis: '"现金周转"的"转"容易让人想到 turn；这里英语锚定的是液体沿渠道持续移动的意象，因此用 cash flow。',
  })
  ```
- **执行步骤**:
  1. 连接 MongoDB
  2. 用上述数据创建一条 QuizQuestion 文档
  3. 查询该文档验证所有字段值
- **预期输出**:
  - 返回的文档包含 `_id`（自动生成）
  - `prompt` = 输入的中文题干
  - `hint` = 输入的提示文本
  - `direction` = `'zh2en'`
  - `reference` = 输入的英文参考答案
  - `keywords` = `['healthy', 'cash', 'flow', 'lifeblood']`
  - `analysis` = 输入的中文意象分析
  - `createdAt` 和 `updatedAt` 自动填充（Date 类型）
- **数据库状态**: `quizquestions` 集合新增 1 条文档
- **清理**: `QuizQuestion.deleteMany({})`

### TC-002: 创建带可选字段 (wordId + wordbankId) 的 QuizQuestion

- **类型**: 功能测试
- **关联验收标准**: wordId 和 wordbankId 为可选 ObjectId ref 类型
- **前置条件**: Word 集合中有一条测试记录，WordBank 集合中有一条测试记录
- **输入**:
  ```js
  // 先创建测试 Word 和 WordBank
  const word = await Word.create({ word: 'flow', wordbankId: wordbank._id, ... });
  const question = await QuizQuestion.create({
    prompt: '...',
    hint: '...',
    direction: 'zh2en',
    reference: '...',
    keywords: ['flow'],
    analysis: '...',
    wordId: word._id,
    wordbankId: wordbank._id,
  })
  ```
- **执行步骤**:
  1. 创建一条 Word 记录
  2. 创建一条 WordBank 记录
  3. 创建 QuizQuestion 并传入 wordId 和 wordbankId
  4. 查询并 populate wordId 字段
- **预期输出**:
  - QuizQuestion 文档保存成功
  - `wordId` 为 Word 记录的 ObjectId
  - `wordbankId` 为 WordBank 记录的 ObjectId
  - populate 后可拿到 Word/WordBank 的完整数据
- **数据库状态**: quizquestions / words / wordbanks 各新增 1 条
- **清理**: 删除创建的所有记录

### TC-003: 创建不带可选字段的 QuizQuestion

- **类型**: 功能测试
- **关联验收标准**: wordId 和 wordbankId 为可选，不传不报错
- **前置条件**: MongoDB 连接正常
- **输入**:
  ```js
  await QuizQuestion.create({
    prompt: '新高速公路上的车流很顺畅。',
    hint: 'flow · 交通如液体持续移动',
    direction: 'zh2en',
    reference: 'Traffic flows smoothly on the new highway.',
    keywords: ['traffic', 'flows', 'smoothly', 'highway'],
    analysis: '把车流看成沿通道不断移动的液体，英语自然使用 flow。',
  })
  ```
- **执行步骤**:
  1. 创建一条不传 wordId / wordbankId 的 QuizQuestion
  2. 查询该文档
- **预期输出**:
  - 创建成功，无报错
  - `wordId` 为 `undefined` 或 `null`
  - `wordbankId` 为 `undefined` 或 `null`
- **数据库状态**: quizquestions 集合新增 1 条文档
- **清理**: `QuizQuestion.deleteMany({})`

### TC-004: 创建完整 QuizAttempt 记录

- **类型**: 功能测试
- **关联验收标准**: QuizAttempt Schema 包含所有字段：userId, questionId, userInput, score, correct, matched, missing, submittedAt
- **前置条件**: QuizQuestion 和 User 集合各有一条测试记录
- **输入**:
  ```js
  await QuizAttempt.create({
    userId: user._id,
    questionId: question._id,
    userInput: 'Healthy cash flow is the lifeblood of a business.',
    score: 100,
    correct: true,
    matched: ['healthy', 'cash', 'flow', 'lifeblood'],
    missing: [],
  })
  ```
- **执行步骤**:
  1. 创建 User 和 QuizQuestion 记录
  2. 创建 QuizAttempt 记录
  3. 查询并验证所有字段
- **预期输出**:
  - 返回的文档包含所有传入字段
  - `userId` = User 的 ObjectId
  - `questionId` = QuizQuestion 的 ObjectId
  - `score` = 100, `correct` = true
  - `matched` = `['healthy', 'cash', 'flow', 'lifeblood']`
  - `missing` = `[]`
  - `submittedAt` 自动填充
  - `createdAt` 和 `updatedAt` 自动填充
- **数据库状态**: quizattempts 集合新增 1 条文档
- **清理**: 删除创建的 User / QuizQuestion / QuizAttempt

### TC-005: 创建匿名用户的 QuizAttempt（无 userId）

- **类型**: 功能测试
- **关联验收标准**: userId 为可选字段（支持匿名用户答题）
- **前置条件**: QuizQuestion 有测试记录
- **输入**:
  ```js
  await QuizAttempt.create({
    questionId: question._id,
    userInput: 'some answer',
    score: 50,
    correct: false,
    matched: ['some'],
    missing: ['cash', 'flow'],
  })
  ```
- **执行步骤**:
  1. 创建不传 userId 的 QuizAttempt
  2. 查询该记录
- **预期输出**:
  - 创建成功，无报错
  - `userId` 为 `undefined` 或不存在
- **数据库状态**: quizattempts 集合新增 1 条记录（无 userId 字段）
- **清理**: 删除创建的所有记录

### TC-006: QuizAttempt 中 score 的边界值（0 和 100）

- **类型**: 边界测试
- **关联验收标准**: score 为 number 类型
- **前置条件**: QuizQuestion 存在
- **输入**:
  ```js
  // 最小值 0
  await QuizAttempt.create({ questionId: q._id, userInput: '', score: 0, correct: false, matched: [], missing: ['a','b'] })
  // 最大值 100
  await QuizAttempt.create({ questionId: q._id, userInput: 'perfect', score: 100, correct: true, matched: ['a','b'], missing: [] })
  ```
- **执行步骤**:
  1. 创建 score=0 的记录并验证
  2. 创建 score=100 的记录并验证
- **预期输出**:
  - 两条记录均创建成功
  - score=0: `correct` 为 false
  - score=100: `correct` 为 true
- **清理**: `QuizAttempt.deleteMany({})`

---

### TC-007: direction 枚举 — 合法值 'zh2en' 和 'en2zh'

- **类型**: 校验测试
- **关联验收标准**: direction 字段使用 enum 约束 ('zh2en', 'en2zh')
- **前置条件**: MongoDB 连接正常
- **输入**:
  ```js
  await QuizQuestion.create({ prompt:'...', hint:'...', direction:'zh2en', reference:'...', keywords:[], analysis:'...' })
  await QuizQuestion.create({ prompt:'...', hint:'...', direction:'en2zh', reference:'...', keywords:[], analysis:'...' })
  ```
- **执行步骤**:
  1. 创建 direction='zh2en' 的题目
  2. 创建 direction='en2zh' 的题目
- **预期输出**:
  - 两条均创建成功
  - direction 值分别为 'zh2en' 和 'en2zh'
- **清理**: `QuizQuestion.deleteMany({})`

### TC-008: direction 枚举 — 非法值抛出 ValidationError

- **类型**: 校验测试（异常）
- **关联验收标准**: direction 为 enum 类型
- **前置条件**: MongoDB 连接正常
- **输入**:
  ```js
  await QuizQuestion.create({
    prompt: '测试',
    hint: '测试',
    direction: 'invalid-direction',  // 非法枚举
    reference: 'test',
    keywords: [],
    analysis: '测试',
  })
  ```
- **执行步骤**:
  1. 尝试创建 direction 为非法的题目
- **预期输出**:
  - **抛出 `ValidationError`**
  - 错误信息包含 `direction`、`enum` 等关键字
  - 数据库中无对应记录
- **清理**: 无需清理（数据未成功写入）

### TC-009: 必填字段缺失 — prompt 为空

- **类型**: 校验测试（异常）
- **关联验收标准**: Schema 中 prompt 为 required
- **前置条件**: MongoDB 连接正常
- **输入**:
  ```js
  await QuizQuestion.create({
    // prompt 缺失
    hint: 'hint',
    direction: 'zh2en',
    reference: 'ref',
    keywords: [],
    analysis: 'analysis',
  })
  ```
- **执行步骤**:
  1. 尝试创建缺少 prompt 的题目
- **预期输出**:
  - **抛出 `ValidationError`**
  - 错误信息包含 `prompt`、`required` 关键字
- **清理**: 无需清理

### TC-010: 必填字段缺失 — QuizAttempt 无 questionId

- **类型**: 校验测试（异常）
- **关联验收标准**: questionId 为必填字段
- **前置条件**: MongoDB 连接正常
- **输入**:
  ```js
  await QuizAttempt.create({
    userInput: 'answer',
    score: 0,
    correct: false,
    matched: [],
    missing: [],
  })
  ```
- **执行步骤**:
  1. 尝试创建无 questionId 的 QuizAttempt
- **预期输出**:
  - **抛出 `ValidationError`**
  - 错误信息包含 `questionId`、`required` 关键字
- **清理**: 无需清理

### TC-011: keywords 字段为 string 数组

- **类型**: 校验测试
- **关联验收标准**: keywords 为 string[] 类型
- **前置条件**: MongoDB 连接正常
- **输入**:
  ```js
  // 测试非数组输入被 Mongoose 转换或拒绝
  await QuizQuestion.create({
    prompt: '测试',
    hint: '测试',
    direction: 'zh2en',
    reference: 'test',
    keywords: 'not-an-array',  // 应为 string[] 但传入 string
    analysis: '测试',
  })
  ```
- **执行步骤**:
  1. 尝试创建 keywords 为非数组的题目
- **预期输出**:
  - Mongoose 可能自动转为 `['not-an-array']` 或抛出 CastError
  - **预期行为**：抛出 CastError（数组类型不匹配）
- **清理**: 无需清理（如创建成功则清理）

---

### TC-012: 验证 QuizQuestion.direction 索引存在

- **类型**: 索引测试
- **关联验收标准**: QuizQuestion.direction 有索引
- **前置条件**: 模型已编译注册
- **输入**: 无（通过模型元数据检查）
- **执行步骤**:
  1. 执行 `QuizQuestion.collection.getIndexes()`（或 `listIndexes()`）
  2. 检查返回的索引列表
- **预期输出**:
  - 索引列表包含 `direction_1`（或包含 direction 字段的索引）
- **清理**: 无

### TC-013: 验证 QuizQuestion.wordId 索引存在

- **类型**: 索引测试
- **关联验收标准**: QuizQuestion.wordId 有索引
- **前置条件**: 模型已编译注册
- **输入**: 无
- **执行步骤**:
  1. 执行 `QuizQuestion.collection.getIndexes()`
  2. 检查索引列表
- **预期输出**:
  - 索引列表包含 `wordId_1`（或包含 wordId 字段的索引）
- **清理**: 无

### TC-014: 验证 QuizAttempt.userId 索引存在

- **类型**: 索引测试
- **关联验收标准**: QuizAttempt.userId 有索引
- **前置条件**: 模型已编译注册
- **输入**: 无
- **执行步骤**:
  1. 执行 `QuizAttempt.collection.getIndexes()`
  2. 检查索引列表
- **预期输出**:
  - 索引列表包含 `userId_1`（或包含 userId 字段的索引）
- **清理**: 无

### TC-015: 验证 QuizAttempt (userId + questionId) 复合索引存在

- **类型**: 索引测试
- **关联验收标准**: QuizAttempt 有 (userId + questionId) 复合索引
- **前置条件**: 模型已编译注册
- **输入**: 无
- **执行步骤**:
  1. 执行 `QuizAttempt.collection.getIndexes()`
  2. 检查索引列表
- **预期输出**:
  - 索引列表包含同时含 `userId` 和 `questionId` 的复合索引
- **清理**: 无

---

### TC-016: TypeScript 编译检查 — tsc --noEmit

- **类型**: 编译测试
- **关联验收标准**: TypeScript 类型定义完整，通过 tsc --noEmit 编译检查
- **前置条件**: server/ 目录下 tsconfig.json 配置正常
- **输入**: 无（执行编译命令）
- **执行步骤**:
  1. 在 `server/` 目录执行 `npx tsc --noEmit`
  2. 检查退出码和编译输出
- **预期输出**:
  - 退出码 0
  - 无类型错误
  - 新模型文件无 TS 类型报错
- **清理**: 无

---

### TC-017: models/index.ts 导出 QuizQuestion 和 IQuizQuestion

- **类型**: 导出测试
- **关联验收标准**: index.ts 新增 export { QuizQuestion } 和 export { IQuizQuestion }
- **前置条件**: QuizQuestion.ts 文件已创建
- **输入**:
  ```js
  import { QuizQuestion } from './models/index.js'
  import type { IQuizQuestion } from './models/index.js'
  ```
- **执行步骤**:
  1. 从 `server/src/models/index.ts` 导入 QuizQuestion 和 IQuizQuestion
  2. 验证导入值类型
- **预期输出**:
  - `QuizQuestion` 为 Mongoose Model 类型
  - `IQuizQuestion` 为 TypeScript interface（仅编译时存在）
  - 导入无报错
- **清理**: 无

### TC-018: models/index.ts 导出 QuizAttempt 和 IQuizAttempt

- **类型**: 导出测试
- **关联验收标准**: index.ts 新增 export { QuizAttempt } 和 export { IQuizAttempt }
- **前置条件**: QuizAttempt.ts 文件已创建
- **输入**:
  ```js
  import { QuizAttempt } from './models/index.js'
  import type { IQuizAttempt } from './models/index.js'
  ```
- **执行步骤**:
  1. 从 models/index.ts 导入 QuizAttempt 和 IQuizAttempt
  2. 验证导入值类型
- **预期输出**:
  - 导入无报错
  - `QuizAttempt` 为 Mongoose Model 类型
- **清理**: 无

---

## 阶段 E2E 场景（供 ai-master 阶段集成 Gate 使用）

> 以下场景在阶段 0 所有 Task 完成后，由 ai-master 执行端到端验证。

### E2E-01: 数据模型 → 种子数据 → 查询验证

- **涉及 Task**: Task 0.1, Task 0.2
- **用户故事**: 作为开发者，我需要在 MongoDB 中建立 QuizQuestion 和 QuizAttempt 集合，并通过种子脚本灌入 20 条预置题目，以便后续的 Quiz API 可以直接从数据库读取题目。
- **执行步骤**:
  1. 启动 server → 确认 MongoDB 连接成功（Task 0.1）
  2. 通过 MongoDB Compass 或 Mongoose 查询确认 `quizquestions` 集合可读写（Task 0.1）
  3. 确认 `quizattempts` 集合可读写（Task 0.1）
  4. 执行种子脚本 → 验证 20 条题目全量写入 `quizquestions` 集合（Task 0.2）
  5. 通过 `QuizQuestion.countDocuments()` 确认题目总数 = 20（Task 0.2）
  6. 通过 `QuizQuestion.distinct('direction')` 确认包含 `zh2en` 方向题目（Task 0.2）
- **通过标准**:
  - [ ] MongoDB 连接正常，无连接错误日志
  - [ ] `quizquestions` 和 `quizattempts` 集合可通过 Mongoose 正常查询
  - [ ] 种子脚本执行后 `QuizQuestion.countDocuments()` = 20
  - [ ] 20 条题目中 direction='zh2en' 的题目数 ≥ 1
  - [ ] 所有题目含 prompt / hint / reference / keywords / analysis 字段
  - [ ] 所有索引（direction, wordId, userId, userId+questionId）已创建
- **失败时涉及模块**: `server/src/models/QuizQuestion.ts`、`server/src/models/QuizAttempt.ts`、`server/src/models/index.ts`、`server/src/seed/`、MongoDB 连接配置

---

## 测试执行清单

| 编号 | 用例 | 类型 | 快速通过标准 |
|------|------|------|-------------|
| TC-001 | 创建完整 QuizQuestion | 功能 | 文档创建成功，所有字段值正确 |
| TC-002 | QuizQuestion 带 wordId + wordbankId | 功能 | populate 可获取关联数据 |
| TC-003 | QuizQuestion 不带可选字段 | 功能 | 创建成功，wordId/wordbankId 为 undefined |
| TC-004 | 创建完整 QuizAttempt | 功能 | 所有字段值正确，submittedAt 自动填充 |
| TC-005 | QuizAttempt 匿名（无 userId） | 功能 | 创建成功，userId 为 undefined |
| TC-006 | score 边界值 0/100 | 边界 | 两条记录均创建成功 |
| TC-007 | direction 合法枚举 | 校验 | zh2en 和 en2zh 均可创建 |
| TC-008 | direction 非法枚举 | 异常 | 抛出 ValidationError |
| TC-009 | prompt 缺失 | 异常 | 抛出 ValidationError (required) |
| TC-010 | questionId 缺失 | 异常 | 抛出 ValidationError (required) |
| TC-011 | keywords 非数组 | 异常 | 抛出 CastError |
| TC-012 | direction 索引 | 索引 | listIndexes 含 direction_1 |
| TC-013 | wordId 索引 | 索引 | listIndexes 含 wordId_1 |
| TC-014 | userId 索引 | 索引 | listIndexes 含 userId_1 |
| TC-015 | 复合索引 (userId+questionId) | 索引 | listIndexes 含复合索引 |
| TC-016 | tsc --noEmit | 编译 | 退出码 0，无类型错误 |
| TC-017 | index.ts 导出 QuizQuestion | 导出 | import 无报错 |
| TC-018 | index.ts 导出 QuizAttempt | 导出 | import 无报错 |
| E2E-01 | 模型→种子→查询 | 阶段 E2E | 20 题入库可查，索引完整 |
