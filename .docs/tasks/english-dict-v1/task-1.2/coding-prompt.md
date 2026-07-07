# Coding Prompt — Task 1.2: ORM 模型定义

## 1. 任务目标

基于已有 3 个核心模型（User、WordBank、Word），新增 Collocation、UserFavorite、LearningRecord 三个独立模型，并更新 `models/index.ts` 统一导出。

## 2. 技术上下文

- **语言/框架**: Node.js + Express + TypeScript + Mongoose
- **ODM**: Mongoose 7.x（Schema 泛型约束 `new Schema<IXxx>(...)`）
- **已有模型**: User、WordBank、Word（含 ExtendedMeaning 子文档）— 已在 `server/src/models/` 下
- **代码风格**: 每个模型一个文件，接口 `IXxx extends Document`，Schema 泛型 `Schema<IXxx>`，`timestamps: true`
- **涉及文件**:
  - **(新建)** `server/src/models/Collocation.ts` — 搭配独立模型
  - **(新建)** `server/src/models/UserFavorite.ts` — 用户收藏关联模型
  - **(新建)** `server/src/models/LearningRecord.ts` — 学习记录模型
  - **(修改)** `server/src/models/index.ts` — 新增 3 个模型的导出
  - **(修改)** `server/src/seed/index.ts` — 为新模型添加清空逻辑（幂等）
- **数据库**: MongoDB（通过 Mongoose 操作，无需 Migration）
- **外部依赖**: 无

## 3. 实现要求

### 3.1 (新建) `server/src/models/Collocation.ts`

**职责**: 独立存储详细搭配信息（短语、中文释义、例句），通过 `wordId` 外键关联 Word。

**接口定义**:

```typescript
export interface ICollocation extends Document {
  _id: Types.ObjectId;
  phrase: string;
  meaningCn: string;
  exampleEn: string;
  exampleZh: string;
  wordId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

**Schema 定义**:

| 字段 | 类型 | 必填 | 其他约束 |
|------|------|------|---------|
| `phrase` | String | required | — |
| `meaningCn` | String | required | — |
| `exampleEn` | String | required | — |
| `exampleZh` | String | required | — |
| `wordId` | ObjectId | required, index | `ref: "Word"` |
| `timestamps` | — | — | `{ timestamps: true }` |

**关键逻辑**:
1. `wordId` 建立与 Word 模型的外键关联
2. 启用 Mongoose timestamps 自动管理 createdAt/updatedAt

**导出**: `ICollocation`（接口）、`Collocation`（Model）

### 3.2 (新建) `server/src/models/UserFavorite.ts`

**职责**: 记录用户收藏的单词，`userId + wordId` 组合唯一防止重复收藏。

**接口定义**:

```typescript
export interface IUserFavorite extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  wordId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

**Schema 定义**:

| 字段 | 类型 | 必填 | 其他约束 |
|------|------|------|---------|
| `userId` | ObjectId | required | `ref: "User"` |
| `wordId` | ObjectId | required | `ref: "Word"` |
| `timestamps` | — | — | `{ timestamps: true }` |

**复合唯一索引**: `UserFavoriteSchema.index({ userId: 1, wordId: 1 }, { unique: true })`

**关键逻辑**:
1. 组合唯一索引确保同一用户不会重复收藏同一单词
2. 两个外键分别关联 User 和 Word

**导出**: `IUserFavorite`（接口）、`UserFavorite`（Model）

### 3.3 (新建) `server/src/models/LearningRecord.ts`

**职责**: 记录用户对每个单词的学习次数和最近学习时间。

**接口定义**:

```typescript
export interface ILearningRecord extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  wordId: Types.ObjectId;
  learnCount: number;
  lastLearnedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Schema 定义**:

| 字段 | 类型 | 必填 | 默认值 | 其他约束 |
|------|------|------|--------|---------|
| `userId` | ObjectId | required | — | `ref: "User"` |
| `wordId` | ObjectId | required | — | `ref: "Word"` |
| `learnCount` | Number | required | `0` | — |
| `lastLearnedAt` | Date | optional | `null` | 记录最近一次学习时间 |
| `timestamps` | — | — | — | `{ timestamps: true }` |

**复合唯一索引**: `LearningRecordSchema.index({ userId: 1, wordId: 1 }, { unique: true })`

**关键逻辑**:
1. `learnCount` 默认 0，每次学习 +1
2. `lastLearnedAt` 初始 null，每次学习更新为当前时间
3. 组合唯一索引确保每个用户对每个单词只有一条学习记录

**导出**: `ILearningRecord`（接口）、`LearningRecord`（Model）

### 3.4 (修改) `server/src/models/index.ts`

**修改内容**: 在现有导出基础上，新增以下导出：

```typescript
export { Collocation } from "./Collocation";
export type { ICollocation } from "./Collocation";
export { UserFavorite } from "./UserFavorite";
export type { IUserFavorite } from "./UserFavorite";
export { LearningRecord } from "./LearningRecord";
export type { ILearningRecord } from "./LearningRecord";
```

**注意**: 保持原有风格——模型类不加 type 前缀导出，接口加 `type` 前缀导出。

### 3.5 (修改) `server/src/seed/index.ts`

**修改位置**: seed 函数中 "Clearing old data..." 部分

**修改内容**: 新增 3 个模型的清空操作，按外键依赖顺序（先删引用方，再删被引用方）：

```typescript
// 在 Word.deleteMany({}) 之前添加：
await LearningRecord.deleteMany({});
await UserFavorite.deleteMany({});
await Collocation.deleteMany({});
```

**完整清空顺序应为**:
1. LearningRecord（引用 User + Word）
2. UserFavorite（引用 User + Word）
3. Collocation（引用 Word）
4. Word（引用 WordBank）
5. WordBank
6. User

同时在文件顶部 import 新模型：
```typescript
import { Collocation } from "../models/Collocation";
import { UserFavorite } from "../models/UserFavorite";
import { LearningRecord } from "../models/LearningRecord";
```

## 4. 代码规范要求

- 遵循已有代码风格：接口 `IXxx extends Document` → Schema `new Schema<IXxx>({...}, opts)` → `mongoose.model<IXxx>("Xxx", schema)`
- TypeScript 类型安全：Schema 使用泛型参数，不使用 `any`
- 文件命名与模型名一致：`Collocation.ts`、`UserFavorite.ts`、`LearningRecord.ts`
- 导出规范：`export { ModelName }` + `export type { IModelName }`
- 所有模型启用 `timestamps: true`
- 数据库集合名由 Mongoose 自动推断（`UserFavorite` → `userfavorites`），无需手动指定

## 5. 测试要求

代码必须能通过以下测试用例（详见 [test-cases.md](./test-cases.md)）：

| 测试用例 | 测试内容 |
|---------|---------|
| TC-005 | Collocation 独立模型字段完整性（phrase, meaningCn, exampleEn, exampleZh, wordId） |
| TC-006 | UserFavorite 模型定义 + userId/wordId 复合唯一索引 |
| TC-007 | LearningRecord 模型定义 + learnCount 默认值 0 |
| TC-008 | 模型关联关系验证（所有 ref 引用正确性） |
| TC-009 | models/index.ts 统一导出 6 个模型 |
| TC-010 | TypeScript 类型安全（无 any，泛型约束完整） |
| TC-012 | 必填字段校验（各模型 required 字段） |
| TC-013 | Seed 脚本与新模型兼容（清空逻辑不阻塞 seed 流程） |

## 6. 注意事项

- **Word 模型的 `collocations` 字段保持不变**：Word.ts 中已有 `collocations: [{ type: String }]`（简单字符串数组），这是 Word 内嵌的轻量搭配列表，与新增的独立 Collocation 模型并存不冲突。Collocation 独立模型用于存储带详细释义和例句的搭配条目。
- **LearningRecord 和 UserFavorite 的复合唯一索引使用 Mongoose `schema.index()` 方法**，不要在字段定义中使用 `unique: true`（因为需要跨字段组合唯一）。
- **Seed 脚本的 `deleteMany` 顺序**很重要：先删引用外部集合的模型，再删被引用的核心模型，避免外键约束问题（MongoDB 不强制外键但语义上应遵循）。
- **MODEL NAME（传给 `mongoose.model` 的第一个参数）**：Collocation 用 `"Collocation"`、UserFavorite 用 `"UserFavorite"`、LearningRecord 用 `"LearningRecord"`，确保与已有代码风格一致且 ref 能正确解析。
- **不要修改已有模型文件**（User.ts、WordBank.ts、Word.ts），它们已完成且符合要求。
