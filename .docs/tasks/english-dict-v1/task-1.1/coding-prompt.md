# Coding Prompt — Task 1.1: 数据库表创建与 Migration

> **技术背景**：ADR 选定 MongoDB + Mongoose。不存在传统 SQL Migration 脚本。本 Task 的"Migration"等价于：安装 Mongoose → 数据库连接模块 → Mongoose Model 定义（含 Schema 约束和索引）→ npm scripts（db:init / db:seed / db:clean）→ 应用启动时自动连接。

---

## 1. 任务目标

安装 Mongoose 依赖，创建数据库连接模块和 3 个核心 Mongoose Model（User / WordBank / Word），配置 npm scripts 实现数据库初始化、种子数据填充和清理。

---

## 2. 技术上下文

- **语言/框架**：Node.js 18+ / Express / TypeScript / Mongoose 8.x
- **数据库**：MongoDB（本地开发 `mongodb://localhost:27017/english-dictionary`）
- **已有基础设施**：`server/src/config/index.ts` 已定义 `config.mongodbUri`，`server/.env.example` 已有 `MONGODB_URI` 占位
- **编码规范**：camelCase 字段命名，引用字段以 `Id` 结尾，日期字段以 `At` 结尾，枚举值小写字符串

### 涉及文件

| 操作 | 文件 | 说明 |
|------|------|------|
| 修改 | `server/package.json` | 添加 mongoose 依赖 + db scripts |
| **新建** | `server/src/config/database.ts` | Mongoose 连接管理模块 |
| 修改 | `server/src/config/index.ts` | （可选）按需调整 mongodbUri 默认值 |
| **新建** | `server/src/models/User.ts` | User Mongoose Model |
| **新建** | `server/src/models/WordBank.ts` | WordBank Mongoose Model |
| **新建** | `server/src/models/Word.ts` | Word Mongoose Model（含 ExtendedMeaning 子文档 Schema） |
| 修改 | `server/src/models/index.ts` | 统一导出所有 Model |
| 修改 | `server/src/index.ts` | 启动时连接数据库 |
| **新建** | `server/src/seed/index.ts` | 种子数据脚本 |
| **新建** | `server/.env` | 从 `.env.example` 复制并填入真实配置 |

---

## 3. 实现要求

### 3.1 安装 Mongoose 依赖

在 `server/` 目录下安装：

```bash
npm install mongoose
```

同时确保 `.env` 文件存在（复制 `.env.example` 或手动创建），`MONGODB_URI` 指向可用的 MongoDB 实例。

---

### 3.2 `server/src/config/database.ts`（新建）— 数据库连接模块

**职责**：封装 Mongoose 连接、断开、事件监听。

**函数签名**：

```typescript
export async function connectDatabase(): Promise<void>;
export async function disconnectDatabase(): Promise<void>;
```

**关键逻辑**：

1. `connectDatabase()` 调用 `mongoose.connect(config.mongodbUri)`，不传 `dbName`（数据库名已在 URI path 中指定 `english-dictionary`）
2. 监听连接事件：
   - `mongoose.connection.on('connected')` → `console.log('MongoDB connected successfully')`
   - `mongoose.connection.on('error')` → `console.error('MongoDB connection error:', err.message)`，然后 `process.exit(1)`
   - `mongoose.connection.on('disconnected')` → `console.log('MongoDB disconnected')`
3. 开发环境可启用 `mongoose.set('debug', true)`（按 `NODE_ENV` 判断）
4. `disconnectDatabase()` 调用 `mongoose.disconnect()`，用于脚本执行后优雅退出
5. 不在本模块中调用 `connectDatabase()`——由 `index.ts` 启动时调用

**错误处理**：

- 连接失败时打印明确错误信息（含 `MongoServerSelectionError` 等），进程以非零退出码退出
- 不静默吞掉连接错误

---

### 3.3 `server/src/models/User.ts`（新建）— User Model

**Schema 字段**（严格遵循 [Schema 文档 §3.1](../../../schema.md)）：

| 字段 | Schema 配置 |
|------|------------|
| `username` | `{ type: String, required: true }` |
| `phone` | `{ type: String, required: true, unique: true, match: /^1[3-9]\d{9}$/ }` |
| `passwordHash` | `{ type: String, required: true }` |
| `role` | `{ type: String, required: true, enum: ['user', 'admin'], default: 'user' }` |
| `learnedWords` | `[{ type: Schema.Types.ObjectId, ref: 'Word' }]`（默认 `[]`） |
| `favoriteWords` | `[{ type: Schema.Types.ObjectId, ref: 'Word' }]`（默认 `[]`） |

**Schema 选项**：`{ timestamps: true }` — 自动管理 `createdAt` / `updatedAt`

**索引**：`phone` 通过 `unique: true` 自动创建唯一索引，无需额外 `index()` 调用。

**导出**：`export const User = mongoose.model<IUser>('User', UserSchema);`

> 类型 `IUser` 在 Model 文件中用 TypeScript interface 定义（字段名与 Schema 一致，`_id` 类型为 `Types.ObjectId`，`learnedWords`/`favoriteWords` 为 `Types.ObjectId[]`）。

---

### 3.4 `server/src/models/WordBank.ts`（新建）— WordBank Model

**Schema 字段**（严格遵循 [Schema 文档 §3.2](../../../schema.md)）：

| 字段 | Schema 配置 |
|------|------------|
| `name` | `{ type: String, required: true, unique: true }` |
| `description` | `{ type: String, required: true }` |
| `gradient` | `{ type: String, default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }` |

**Schema 选项**：`{ timestamps: true }`

**导出**：`export const WordBank = mongoose.model<IWordBank>('WordBank', WordBankSchema);`

---

### 3.5 `server/src/models/Word.ts`（新建）— Word Model（含内嵌子文档）

先定义 **ExtendedMeaning 子文档 Schema**（不导出为独立 Model）：

| 字段 | Schema 配置 |
|------|------------|
| `evolutionDescription` | `{ type: String, required: true }` |
| `meaning` | `{ type: String, required: true }` |
| `partOfSpeech` | `{ type: String, required: true, enum: ['noun', 'verb', 'adj', 'adv', 'prep', 'conj', 'pron', 'other'] }` |
| `exampleEn` | `{ type: String, required: true }` |
| `exampleZh` | `{ type: String, required: true }` |

**子文档选项**：`{ _id: true }` — 每个引申义有独立 `_id`，方便前端精确定位

再定义 **Word Schema**（严格遵循 [Schema 文档 §3.3](../../../schema.md)）：

| 字段 | Schema 配置 |
|------|------------|
| `word` | `{ type: String, required: true, index: true }` |
| `wordbankId` | `{ type: Schema.Types.ObjectId, ref: 'WordBank', required: true, index: true }` |
| `phonetic` | `{ type: String }`（可选，无 `required`） |
| `coreMeaning` | `{ type: String, required: true }` |
| `coreExampleEn` | `{ type: String, required: true }` |
| `coreExampleZh` | `{ type: String, required: true }` |
| `physicalImageType` | `{ type: String, required: true, enum: PHYSICAL_IMAGE_TYPES }` |
| `physicalImageDescription` | `{ type: String, required: true }` |
| `extendedMeanings` | `[ExtendedMeaningSchema]`（默认 `[]`） |
| `collocations` | `[{ type: String }]`（默认 `[]`） |

**枚举常量**：在文件顶部定义 `PHYSICAL_IMAGE_TYPES` 常量数组：
```typescript
const PHYSICAL_IMAGE_TYPES = ['flow', 'grasp', 'break', 'bear', 'drive', 'light', 'leverage', 'yield'] as const;
```

**额外索引**（在 Schema 定义之后、`mongoose.model()` 之前）：
```typescript
WordSchema.index({ coreMeaning: 'text' });  // MongoDB 全文索引
```

`word` 和 `wordbankId` 的普通索引已通过字段级 `index: true` 声明。

**Schema 选项**：`{ timestamps: true }`

**导出**：
```typescript
export const Word = mongoose.model<IWord>('Word', WordSchema);
export { PHYSICAL_IMAGE_TYPES };
```

> 同时导出 `IExtendedMeaning` 和 `IWord` TypeScript 接口。

---

### 3.6 `server/src/models/index.ts`（修改）— 统一导出

替换占位内容，改为：
```typescript
export { User } from './User';
export type { IUser } from './User';
export { WordBank } from './WordBank';
export type { IWordBank } from './WordBank';
export { Word, PHYSICAL_IMAGE_TYPES } from './Word';
export type { IWord, IExtendedMeaning } from './Word';
```

---

### 3.7 `server/src/index.ts`（修改）— 启动时连接数据库

在 `import { createApp } from './app'` 之后、`app.listen()` 之前，添加数据库连接调用：

```typescript
import { connectDatabase } from './config/database';

async function main(): Promise<void> {
  await connectDatabase();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
```

> 将原来顶层的 `const app = createApp(); app.listen(...)` 替换为上述 `main()` 函数，确保数据库连接成功后才启动 HTTP Server。

---

### 3.8 `server/src/seed/index.ts`（新建）— 种子数据脚本

**职责**：连接数据库 → 清理旧数据 → 插入初始数据 → 断开连接。可重复执行不报错（幂等）。

**执行方式**：`npx tsx src/seed/index.ts`（通过 npm script 调用）

**初始数据内容**（基于 PRD 中的 mock 数据）：

1. **WordBank（词库）— 至少 4 个**：
   - `{ name: '基础高频', description: '日常高频核心词汇，适合初学者' }`
   - `{ name: '商务英语', description: '职场商务场景常用词汇' }`
   - `{ name: '学术词汇', description: '学术写作与阅读高频词汇' }`
   - `{ name: '短语动词', description: '常用动词短语与搭配' }`

2. **Word（单词）— 至少 8 个**，关联到"基础高频"词库：
   - `flow` — physicalImageType: `'flow'`
   - `grasp` — physicalImageType: `'grasp'`
   - `break` — physicalImageType: `'break'`
   - `bear` — physicalImageType: `'bear'`
   - `drive` — physicalImageType: `'drive'`
   - `light` — physicalImageType: `'light'`
   - `leverage` — physicalImageType: `'leverage'`
   - `yield` — physicalImageType: `'yield'`
   
   每个单词包含完整的 `coreMeaning`、`coreExampleEn`、`coreExampleZh`、`physicalImageDescription`，以及 1-2 个 `extendedMeanings`（含完整的子文档字段）和 2-3 个 `collocations`。

3. **User（用户）— 1 个管理员**：
   - `{ username: 'admin', phone: '13800000000', passwordHash: '<bcrypt_hash_of_admin123>', role: 'admin' }`
   - 由于此阶段尚未实现 auth 模块，passwordHash 可先用占位字符串 `'$2b$10$placeholder'`（后续 Task 2.1 替换为真实 bcrypt hash）

**幂等策略**：执行时先 `deleteMany({})` 清空各集合，再 `insertMany()`，确保可重复执行。

---

### 3.9 npm scripts（修改 `server/package.json`）

在 `scripts` 中添加：

```json
{
  "db:init": "tsx src/seed/index.ts",
  "db:seed": "tsx src/seed/index.ts",
  "db:clean": "tsx -e \"const mongoose = require('mongoose'); require('dotenv').config(); mongoose.connect(process.env.MONGODB_URI).then(() => Promise.all([mongoose.connection.dropCollection('users'), mongoose.connection.dropCollection('words'), mongoose.connection.dropCollection('wordbanks')])).then(() => { console.log('All collections dropped'); process.exit(0); }).catch((err) => { console.error(err.message); process.exit(1); })\""
}
```

> 说明：
> - `db:init` 和 `db:seed` 指向同一个脚本（种子脚本同时完成集合创建 + 初始数据插入）
> - `db:clean` 删除所有集合（用于测试后清理）
> - 对于 MongoDB，不存在传统 DDL rollback，"回滚"等效于 `db:clean` 后重新 `db:init`

---

## 4. 代码规范要求

1. **TypeScript 严格模式**：所有字段、参数、返回值有明确类型，不使用 `any`
2. **async/await**：所有数据库操作使用 `async/await`，不用 `.then()` / `.catch()` 链
3. **camelCase 命名**：所有 JS/TS 变量和方法 camelCase，文件名 PascalCase（与已有代码风格一致）
4. **`mongoose.model()` 注册时机**：Model 文件被 import 时即注册，注意避免循环引用。`Word` 引用 `WordBank` 通过 `ref: 'WordBank'` 字符串，不直接 import Model
5. **环境变量**：`MONGODB_URI` 从 `config` 模块读取（已有 `config.mongodbUri`），不在 Model 或 seed 脚本中直接 `process.env`
6. **错误信息**：所有 `console.error` 输出包含足够的上下文（哪个操作失败、原因是什么）
7. **Schema 一致性**：Model 字段名、类型、约束与 `.docs/schema.md` 完全一致，不遗漏、不多余

---

## 5. 测试要求

代码必须满足以下测试用例（详见 [test-cases.md](./test-cases.md)）：

| 编号 | 类型 | 内容 |
|------|------|------|
| TC-001 | 功能 | MongoDB 连接配置与连接管理（`connectDatabase` 成功日志、URI 不硬编码） |
| TC-002 | 异常 | 连接失败处理（无效 URI 时明确报错，进程非零退出） |
| TC-003 | 功能 | User Model 定义与 `users` 集合自动创建（8 字段 + 默认值） |
| TC-004 | 功能 | WordBank Model 定义与 `wordbanks` 集合自动创建（含 gradient 默认值） |
| TC-005 | 功能 | Word Model 定义与 `words` 集合自动创建（12 字段，含内嵌 ExtendedMeaning） |
| TC-006 | 边界 | 枚举值约束校验（非法 role/physicalImageType/partOfSpeech 抛出 ValidationError） |
| TC-007 | 边界 | 必填字段校验（缺 username/description/coreMeaning 抛出 ValidationError） |
| TC-008 | 功能 | 索引创建与验证（users 2 个、wordbanks 2 个、words 4 个索引） |
| TC-009 | 异常 | 唯一约束冲突（重复 phone → E11000） |
| TC-010 | 边界 | 手机号格式校验（合法/非法格式、String 类型） |
| TC-011 | 边界 | 默认值正确性（role/user, gradient, extendedMeanings/collocations = []） |
| TC-012 | 功能 | npm scripts 可执行性（`db:init` exit 0，输出集合创建确认） |
| TC-013 | 集成 | Word.wordbankId 引用完整性（`ref: 'WordBank'`，`populate()` 可用） |
| TC-014 | 边界 | Mongoose 全局配置正确性（连接事件日志、debug 模式条件启用） |
| TC-015 | 功能 | Seed 数据脚本（至少 4 词库 + 8 单词 + 1 管理员，幂等可重复） |
| TC-016 | 集成 | Model 与 Schema 文档一致性（字段/类型/约束/枚举完全匹配） |

---

## 6. 注意事项

1. **Mongoose 版本**：使用 Mongoose 8.x（当前最新稳定版），注意 TypeScript 类型导出方式与旧版可能不同
2. **`.env` 文件**：需用户手动创建 `.env`（从 `.env.example` 复制），确保 `MONGODB_URI` 指向可用的 MongoDB 实例。Coding Prompt 执行时提醒用户确认
3. **MongoDB 连接字符串**：数据库名在 URI path 中指定（`/english-dictionary`），不需要在 `mongoose.connect()` options 中额外传 `dbName`
4. **`_id` 类型**：Schema 中用 `Schema.Types.ObjectId`，TypeScript interface 中用 `Types.ObjectId`（从 `mongoose` 导入 `Types`）
5. **循环引用**：`Word` 通过 `ref: 'WordBank'` 字符串引用 WordBank 模型，**不要** import WordBank Model 到 Word.ts 中（避免循环依赖）
6. **Text 索引**：MongoDB text 索引一个集合最多 1 个，`coreMeaning` 的 text 索引支持中文全文搜索
7. **Auto-index**：开发环境使用默认的 `autoIndex: true`（Mongoose 默认），生产环境在后续 Task 中关闭
8. **Seed 数据中的 passwordHash**：当前阶段用占位值，真实 bcrypt hash 在 Task 2.1 实现
9. **`tsx` watch**：开发模式 `npm run dev` 使用 `tsx watch`，Model 文件变更会自动重启。Seed 脚本手动执行，不纳入 watch
10. **`server/src/index.ts` 当前可能只是顶层 `app.listen()` 调用**，需要重构为 `async main()` 包装，确保 DB 连接先于 HTTP 启动。重构时保留已有的 `import` 和 `createApp()` 调用方式
