# Coding Prompt — Task 0.1: 创建 QuizQuestion / QuizAttempt 数据模型

> 生成日期：2026-08-06
> 生成者：coding-prompt-generator
> 所属阶段：阶段 0 — 数据模型 + 种子数据

---

## 1. 任务目标

为短句翻译训练模块创建两个 MongoDB 数据模型：**QuizQuestion**（题目）和 **QuizAttempt**（答题记录），遵循现有 Mongoose 代码约定，并在 `models/index.ts` 中导出。

---

## 2. 技术上下文

- **语言/框架**: Node.js + TypeScript (ESM, `"type": "module"`) + Mongoose
- **涉及文件**:
  - (新建) `server/src/models/QuizQuestion.ts` — 题目模型（已确认该路径不存在 ✅）
  - (新建) `server/src/models/QuizAttempt.ts` — 答题记录模型（已确认该路径不存在 ✅）
  - (修改) `server/src/models/index.ts` — 新增两个模型和类型导出（已读取当前内容）
- **数据库表**: `quizquestions`、`quizattempts`（Mongoose 自动命名）
- **外部依赖**: 无（本 Task 无依赖）
- **已有代码探查结果**: 🔴
  - 参考 Model：[Word.ts](server/src/models/Word.ts#L1-L111) — ESM import + `IWord extends Document` + `new Schema<IWord>({...}, { timestamps: true })` + `mongoose.model<IWord>("Word", ...)`
  - 参考 Model：[Note.ts](server/src/models/Note.ts#L1-L44) — 复合索引写法：`NoteSchema.index({ userId: 1, wordId: 1 })`
  - 导出模式：[index.ts](server/src/models/index.ts#L1-L16) — `export { Xxx } from "./Xxx.js"` + `export type { IXxx } from "./Xxx.js"`
  - 前端数据结构：[quizEngine.ts](client/src/data/quizEngine.ts#L13-L34) — `mockQuizItems` 数组，每条的字段：id, wordId, direction, prompt, hint, reference, keywords, analysis
  - 前端类型定义：[types.ts](client/src/data/types.ts#L67-L84) — `QuizDirection = 'zh2en' | 'en2zh'`、`QuizItem`、`QuizResult`

---

## 3. 已有代码当前内容

### 3.1 `server/src/models/index.ts`（修改前）

```typescript
export { User } from "./User.js";
export type { IUser } from "./User.js";
export { WordBank } from "./WordBank.js";
export type { IWordBank } from "./WordBank.js";
export { Word, PHYSICAL_IMAGE_TYPES, PART_OF_SPEECH_TYPES } from "./Word.js";
export type { IWord, IExtendedMeaning } from "./Word.js";
export { Collocation } from "./Collocation.js";
export type { ICollocation } from "./Collocation.js";
export { UserFavorite } from "./UserFavorite.js";
export type { IUserFavorite } from "./UserFavorite.js";
export { LearningRecord } from "./LearningRecord.js";
export type { ILearningRecord } from "./LearningRecord.js";
export { DailyWord } from "./DailyWord.js";
export type { IDailyWord } from "./DailyWord.js";
export { Note } from "./Note.js";
export type { INote } from "./Note.js";
```

### 3.2 现有 Mongoose 约定总结（从 Word.ts / Note.ts 提取）

| 约定 | 示例 |
|------|------|
| Import | `import mongoose, { Schema, Types, Document } from "mongoose"` |
| Interface | `export interface IXxx extends Document { ... }` |
| 必填字段 | `{ type: String, required: true }` |
| 可选字段 | `{ type: String }` 或 `{ type: Schema.Types.ObjectId, ref: "Word" }`（不带 required） |
| 枚举 | `{ type: String, required: true, enum: ['a', 'b'] }` |
| 数组 | `{ type: [String], default: [] }` 或 `keywords: [{ type: String }]` |
| 引用 | `{ type: Schema.Types.ObjectId, ref: "Word", index: true }` |
| timestamps | 第二个参数 `{ timestamps: true }` — 自动生成 `createdAt`/`updatedAt` |
| 单字段索引 | 字段定义中 `index: true` |
| 复合索引 | `Schema.index({ field1: 1, field2: 1 })` |
| Export | `export const Xxx = mongoose.model<IXxx>("Xxx", XxxSchema)` |

---

## 4. 实现要求

### 4.1 文件 `server/src/models/QuizQuestion.ts`（新建）

**接口定义：**

```typescript
export interface IQuizQuestion extends Document {
  _id: Types.ObjectId;
  prompt: string;
  hint: string;
  direction: 'zh2en' | 'en2zh';
  reference: string;
  keywords: string[];
  analysis: string;
  wordId?: Types.ObjectId;
  wordbankId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

**Schema 定义：**

| 字段 | 类型 | 必填 | 约束/默认值 | 索引 |
|------|------|------|------------|------|
| prompt | String | ✅ required | trim | — |
| hint | String | ✅ required | trim | — |
| direction | String | ✅ required | enum: `['zh2en', 'en2zh']` | ✅ index |
| reference | String | ✅ required | trim | — |
| keywords | [String] | ✅ 非空数组 | 每个元素 trim | — |
| analysis | String | ✅ required | trim | — |
| wordId | ObjectId | ❌ 可选 | ref: `'Word'` | ✅ index |
| wordbankId | ObjectId | ❌ 可选 | ref: `'WordBank'` | — |

- Schema 第二个参数 `{ timestamps: true }`
- **不要**在 keywords 上使用 `default: []`（按验收标准 keywords 为必填，不用默认值）
- 使用与 Word.ts / Note.ts 一致的 ESM import 风格
- 最终 `export const QuizQuestion = mongoose.model<IQuizQuestion>("QuizQuestion", QuizQuestionSchema)`

**数据对应关系**（从 quizEngine.ts `mockQuizItems` 到 QuizQuestion Schema）：

| mockQuizItems 字段 | QuizQuestion 字段 | 说明 |
|-------------------|-------------------|------|
| `id: 'q1'` | `_id` (MongoDB 自动) | 旧 ID 不保留 |
| `wordId: 'w1'` | `wordId` (ObjectId ref) | 种子脚本会映射 `'w1'` → 真实 Word._id |
| `direction: 'zh2en'` | `direction` | 直传 |
| `prompt` | `prompt` | 直传 |
| `hint` | `hint` | 直传 |
| `reference` | `reference` | 直传 |
| `keywords` | `keywords` | 直传 |
| `analysis` | `analysis` | 直传 |

### 4.2 文件 `server/src/models/QuizAttempt.ts`（新建）

**接口定义：**

```typescript
export interface IQuizAttempt extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  questionId: Types.ObjectId;
  userInput: string;
  score: number;
  correct: boolean;
  matched: string[];
  missing: string[];
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Schema 定义：**

| 字段 | 类型 | 必填 | 约束/默认值 | 索引 |
|------|------|------|------------|------|
| userId | ObjectId | ❌ 可选 | ref: `'User'` | ✅ index（见下方复合索引） |
| questionId | ObjectId | ✅ required | ref: `'QuizQuestion'` | ✅（见下方复合索引） |
| userInput | String | ✅ required | trim | — |
| score | Number | ✅ required | min: 0, max: 100 | — |
| correct | Boolean | ✅ required | — | — |
| matched | [String] | 默认 `[]` | — | — |
| missing | [String] | 默认 `[]` | — | — |
| submittedAt | Date | 默认 `Date.now` | — | — |

**索引：**
- `userId` 单字段索引（用于查询某用户的所有答题记录）
- `{ userId: 1, questionId: 1 }` 复合索引（非 unique — 同一用户可以多次答同一题）

```typescript
QuizAttemptSchema.index({ userId: 1, questionId: 1 });
```

- Schema 第二个参数 `{ timestamps: true }`
- `submittedAt` 用 `default: Date.now`，与 `createdAt` 意义不同（前者是业务时间，后者是 MongoDB 自动时间）
- 最终 `export const QuizAttempt = mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema)`

**数据对应关系**（从 quizEngine.ts `judgeAnswer()` 返回的 `QuizResult` 到 QuizAttempt Schema）：

| QuizResult 字段 | QuizAttempt 字段 | 说明 |
|----------------|-------------------|------|
| (输入参数 `userInput`) | `userInput` | 用户原始输入 |
| (输入参数 `item.id`) | `questionId` | 关联题目 |
| `correct` | `correct` | 直传 |
| `score` | `score` | 直传 |
| `matched` | `matched` | 直传 |
| `missing` | `missing` | 直传 |
| (调用时间) | `submittedAt` | `new Date()` |
| (认证用户 ID) | `userId` | 可选，匿名用户不传 |

### 4.3 文件 `server/src/models/index.ts`（修改）

**修改内容**：在现有导出列表末尾（`Note` 导出之后）新增 4 行：

```typescript
export { QuizQuestion } from "./QuizQuestion.js";
export type { IQuizQuestion } from "./QuizQuestion.js";
export { QuizAttempt } from "./QuizAttempt.js";
export type { IQuizAttempt } from "./QuizAttempt.js";
```

**修改位置**：在 [index.ts:16](server/src/models/index.ts#L16) 之后。

**影响检查**：
- ✅ 纯新增导出，不影响现有导入
- ✅ 其他文件暂未引用 QuizQuestion/QuizAttempt（本项目无代码引用它们），无回归风险

---

## 5. 代码规范要求

1. **ESM 导入语法**：`import mongoose, { Schema, Types, Document } from "mongoose"`（与 Word.ts / Note.ts 一致）
2. **接口命名**：`IXxx extends Document`，export
3. **Schema 命名**：`XxxSchema`，使用 `new Schema<IXxx>({...}, { timestamps: true })`
4. **Model 命名**：PascalCase，`mongoose.model<IXxx>("Xxx", XxxSchema)`
5. **导出约定**：`export const` + `export type`（index.ts 中用 `.js` 扩展名）
6. **TypeScript**：不要使用 `any`，所有字段有明确类型
7. **不使用 default export**：项目统一 named export
8. **枚举约束**：direction 严格使用 `enum: ['zh2en', 'en2zh']`（字面量数组，不使用变量引用）
9. **timestamps**：使用 Mongoose 内置 `timestamps: true`，不手动定义 createdAt/updatedAt

---

## 6. 测试要求

代码必须能通过 `test-cases.md` 中的以下测试用例：

### 功能测试
- **TC-001**: 创建完整 QuizQuestion（含所有必填字段）→ 所有字段值正确 ✅
- **TC-002**: 创建 QuizQuestion 带 wordId + wordbankId → populate 可获取关联数据 ✅
- **TC-003**: 创建不带可选字段的 QuizQuestion → wordId/wordbankId 为空 ✅
- **TC-004**: 创建完整 QuizAttempt → 所有字段值正确，submittedAt 自动填充 ✅
- **TC-005**: 创建匿名 QuizAttempt（无 userId）→ userId 为空 ✅
- **TC-006**: score 边界值 0 和 100 → 均可创建成功 ✅

### 校验测试
- **TC-007**: direction 合法枚举值 `'zh2en'` 和 `'en2zh'` → 创建成功 ✅
- **TC-008**: direction 非法值 → 抛出 ValidationError ✅
- **TC-009**: prompt 缺失 → 抛出 ValidationError (required) ✅
- **TC-010**: questionId 缺失 → 抛出 ValidationError (required) ✅
- **TC-011**: keywords 非数组 → 抛出 CastError ✅

### 索引测试
- **TC-012**: QuizQuestion.direction 索引 → `listIndexes()` 包含 `direction_1` ✅
- **TC-013**: QuizQuestion.wordId 索引 → `listIndexes()` 包含 `wordId_1` ✅
- **TC-014**: QuizAttempt.userId 索引 → `listIndexes()` 包含 `userId_1` ✅
- **TC-015**: QuizAttempt (userId + questionId) 复合索引 → `listIndexes()` 包含复合索引 ✅

### 编译测试
- **TC-016**: `npx tsc --noEmit` 无类型错误 → 退出码 0 ✅

### 导出测试
- **TC-017**: `import { QuizQuestion }` + `import type { IQuizQuestion }` → 无报错 ✅
- **TC-018**: `import { QuizAttempt }` + `import type { IQuizAttempt }` → 无报错 ✅

---

## 7. 集成验证指令 🔴

> 本 Task 无依赖，集成验证在阶段 Gate 时执行（与 Task 0.2 联测）。

开发完成后，执行以下自检：

1. **编译检查**：
   ```bash
   cd server && npx tsc --noEmit
   ```
   确认退出码 0，无类型错误。

2. **导入检查**：在 `server/src/` 下任意位置临时 import 验证：
   ```typescript
   import { QuizQuestion, QuizAttempt } from './models/index.js'
   import type { IQuizQuestion, IQuizAttempt } from './models/index.js'
   console.log(QuizQuestion.modelName) // → "QuizQuestion"
   console.log(QuizAttempt.modelName)  // → "QuizAttempt"
   ```

3. **索引检查**（连接 MongoDB 后）：
   ```typescript
   await QuizQuestion.collection.getIndexes()  // 应包含 direction_1, wordId_1
   await QuizAttempt.collection.getIndexes()   // 应包含 userId_1, userId_1_questionId_1
   ```

4. **阶段 E2E 预检**（开发完成后手动执行，或等阶段 Gate）：
   ```bash
   # 连接 MongoDB，创建一条测试题目
   # 验证 quizquestions 集合可读写
   # 创建一条测试答题记录
   # 验证 quizattempts 集合可读写
   ```

---

## 8. 注意事项

1. **E**SM 扩展名**：index.ts 中导入路径必须带 `.js` 后缀（`"./QuizQuestion.js"` 而非 `"./QuizQuestion"`），这是 Node.js ESM 规范要求，TS + tsx 均支持。
2. **keywords 校验**：Mongoose 默认不对数组元素做 trim。如需严格校验非空关键字，可在 keywords 字段上添加 `validate` 验证器：非空数组且每个元素非空字符串。**如果现有项目 Word.ts / Note.ts 中未使用此类数组校验，则保持与项目风格一致，不做额外校验。**
3. **submittedAt vs createdAt**：`submittedAt` 是业务时间（答题提交时间），`createdAt` 是 MongoDB 记录创建时间。二者不同的原因：如果未来支持"保存草稿"功能，`createdAt` 是草稿创建时间，`submittedAt` 是正式提交时间。当前版本可接受 `submittedAt` 默认 `Date.now`。
4. **direction 枚举值**：当前题库只有 `zh2en` 方向的 20 条题目，但 Schema 需预留 `en2zh` 枚举（用于阶段 3 的英译中扩展）。
5. **匿名用户**：`QuizAttempt.userId` 为可选——未登录用户答题后不保存记录（前端 quizEngine 当前也不持久化），但 Schema 需支持登录用户保存记录（为 Task 1.1/1.2 做准备）。
6. **不要修改 quizEngine.ts**：本 Task 只管后端数据模型，前端的 `client/src/data/quizEngine.ts` 不在本次变更范围内。
