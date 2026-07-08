# Coding Prompt — Task 1.3: Seed 数据脚本与连接池配置

> 生成日期：2026-07-08 | 关联文档：[task.md](./task.md) | [test-cases.md](./test-cases.md)

---

## 1. 任务目标

重构 Seed 脚本，从 `client/src/data/mockData.ts` 读取前端 mock 数据（而非硬编码），迁移到 MongoDB；同时为数据库连接模块增加连接池参数配置和 `getDB()` 单例接口。

---

## 2. 技术上下文

- **语言/框架**: Node.js 18+ / Express 4 + TypeScript 5.5 / Mongoose 9.7
- **涉及文件**:
  - (重写) `server/src/seed/index.ts` — 种子数据导入脚本，改为从 mockData.ts 读取
  - (修改) `server/src/config/index.ts` — 新增连接池配置项
  - (修改) `server/src/config/database.ts` — 接入连接池参数 + 导出 `getDB()`
  - (修改) `server/.env.example` — 新增连接池环境变量说明
- **外部数据源**: `client/src/data/mockData.ts`（仅读取，不修改）
- **数据库表**: `wordbanks`、`words`、`users`、`collocations`、`userfavorites`、`learningrecords`

---

## 3. 实现要求

### 3.1 文件 `server/src/config/index.ts` — 新增连接池配置项

在现有 `config` 对象中新增以下字段：

```typescript
// 连接池配置
dbMaxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || "10", 10),
dbIdleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT_MS || "30000", 10),
dbConnectTimeoutMs: parseInt(process.env.DB_CONNECT_TIMEOUT_MS || "10000", 10),
```

**要求**:
- 每个字段从环境变量读取，提供合理默认值
- `parseInt` 返回值可能为 `NaN`（当环境变量为非数字字符串时）——需增加兜底逻辑：使用 `isNaN()` 检测，若为 `NaN` 则回退到默认值
- 新增字段均需导出（`config` 对象中）

**兜底示例**:
```typescript
const maxPoolSize = parseInt(process.env.DB_MAX_POOL_SIZE || "", 10);
dbMaxPoolSize: isNaN(maxPoolSize) ? 10 : maxPoolSize,
```

### 3.2 文件 `server/src/config/database.ts` — 接入连接池参数 + 导出 `getDB()`

**修改 1：`connectDatabase()` 函数**

在 `mongoose.connect()` 调用中传入连接池选项：

```typescript
await mongoose.connect(config.mongodbUri, {
  maxPoolSize: config.dbMaxPoolSize,
  maxIdleTimeMS: config.dbIdleTimeoutMs,
  connectTimeoutMS: config.dbConnectTimeoutMs,
});
```

在 `connected` 事件回调中，增加一行日志输出连接池配置信息：
```
MongoDB connected — pool: max=${config.dbMaxPoolSize}, idleTimeout=${config.dbIdleTimeoutMs}ms, connectTimeout=${config.dbConnectTimeoutMs}ms
```

**修改 2：新增 `getDB()` 导出**

在文件末尾新增导出函数：

```typescript
/**
 * 获取当前 mongoose 连接实例（单例模式），供服务层使用依赖注入。
 * 返回 mongoose.Connection 对象，调用方可检查 readyState。
 */
export function getDB(): mongoose.Connection {
  return mongoose.connection;
}
```

- Mongoose 内部维护单一默认连接，多次调用 `getDB()` 返回同一 `mongoose.connection` 实例
- 此函数是未来服务层解耦的连接点（便于测试 mock）

### 3.3 文件 `server/.env.example` — 新增连接池环境变量

在现有内容末尾新增以下注释块：

```bash
# MongoDB Connection Pool
DB_MAX_POOL_SIZE=10
DB_IDLE_TIMEOUT_MS=30000
DB_CONNECT_TIMEOUT_MS=10000
```

保持与现有格式一致（每行 `KEY=value`，按功能分组加注释）。

### 3.4 文件 `server/src/seed/index.ts` — 重写为从 mockData.ts 读取

**核心职责**: 从 `client/src/data/mockData.ts` 读取数据 → 按正确字段映射写入 MongoDB → 幂等可重复执行。

#### 3.4.1 导入

从 `client/src/data/mockData.ts` 导入 `mockLibraries` 和 `mockWords`（`mockUsers` 仅取 admin 用户）。由于跨包引用（server → client），路径使用相对路径：

```typescript
import { mockLibraries, mockWords } from "../../../client/src/data/mockData";
```

> **注意**: `client/src/data/mockData.ts` 可能依赖 `./types` 中定义的 TypeScript 类型。确保 `server/tsconfig.json` 的 `include` 或 `paths` 配置不妨碍跨目录引用。如遇编译问题，可在 `tsconfig.json` 中添加 `"include": ["src/**/*", "../client/src/data/**/*"]`。

#### 3.4.2 连接与清理

使用 `config.mongodbUri` 连接数据库（不重复 `database.ts` 的连接池逻辑——seed 脚本是一次性脚本，直接 `mongoose.connect` 即可）。

幂等策略：**先清空再插入**（`deleteMany({})`），删除顺序严格遵守外键依赖（先删子表，再删主表）：

```
LearningRecord → Collocation → UserFavorite → Word → WordBank → User
```

#### 3.4.3 WordBank 映射

从 `mockLibraries` 读取，按如下字段映射插入：

| mockLibraries 字段 | WordBank 字段 | 说明 |
|---|---|---|
| `name` | `name` | 直接映射 |
| `description` | `description` | 直接映射 |
| （无） | `gradient` | **无此字段，使用默认值** |

每条 wordbank 的 `gradient` 使用以下固定默认值：
```typescript
"linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
```

插入后构建 ID 映射表供 Word 使用（Word 需要 `wordbankId` 引用）：

```typescript
// 构建: mockLibrary.id ("lib1") → 数据库 name → inserted WordBank._id
const libraryIdToName = new Map(mockLibraries.map(l => [l.id, l.name]));
const nameToWordBankId = new Map(wordbanks.map(wb => [wb.name, wb._id]));
```

#### 3.4.4 Word 映射

从 `mockWords` 读取，按如下字段映射插入：

| mockWords 字段 | Word 字段 | 说明 |
|---|---|---|
| `word` | `word` | 直接映射 |
| `libraryId` → 查表 | `wordbankId` | 通过 ID 映射表查 DB _id |
| `phonetic` | `phonetic` | 直接映射 |
| `coreMeaning` | `coreMeaning` | 直接映射 |
| `coreImageType` | `physicalImageType` | 直接映射 |
| `coreExampleSentence` | `coreExampleEn` | 字段重命名 |
| `coreExampleTranslation` | `coreExampleZh` | 字段重命名 |
| （无） | `physicalImageDescription` | **无此字段**，根据 `coreImageType` 生成默认描述 |

**`physicalImageDescription` 默认值**：Mock 数据中没有此字段（DB 中 required），需根据 `physicalImageType`（即 `coreImageType`）提供一个默认英文描述。使用以下映射表：

```typescript
const DEFAULT_IMAGE_DESCRIPTIONS: Record<string, string> = {
  flow: "Liquid (water) moving continuously along the path of least resistance",
  grasp: "Fingers closing around an object to securely hold and control it",
  break: "External force exceeding structural integrity, causing separation into pieces",
  bear: "Body or structure supporting weight from above without collapsing",
  drive: "Applying sustained force to move an object in a specific direction",
  light: "Light source emitting photons to make darkness visible",
  leverage: "Using a lever's mechanical advantage to amplify force",
  yield: "Material deforming permanently when stress exceeds elastic limit",
};
```

若 `coreImageType` 不在映射表中，默认值取 `"Physical image of ${coreImageType}"`。

**引申义（extendedMeanings）映射**：

| mock extendedMeanings 字段 | DB IExtendedMeaning 字段 |
|---|---|
| `logicalEvolution` | `evolutionDescription` |
| `meaning` | `meaning` |
| `partOfSpeech` | `partOfSpeech` |
| `exampleSentence` | `exampleEn` |
| `exampleTranslation` | `exampleZh` |

**搭配（collocations）映射**: 直接映射（`string[]` → `string[]`）。

#### 3.4.5 管理员用户创建

从 mockData 中筛选 `role: "admin"` 的用户（`mockUsers.filter(u => u.role === 'admin')`），映射到 User 模型：

| mockUsers 字段 | User 字段 | 说明 |
|---|---|---|
| `username` | `username` | 直接映射 |
| `phone` | `phone` | 直接映射 |
| `role` | `role` | 直接映射 |
| （无） | `passwordHash` | **占位值**，因密码哈希由 Task 2.2 的 bcrypt 实现，此处用固定占位 `$2b$10$placeholder` |

#### 3.4.6 日志输出

脚本执行过程中的输出格式（每步至少打印一条）：

```
Connecting to MongoDB...
Connected.
Clearing old data...
Old data cleared.
Seeding wordbanks...
Inserted 4 wordbanks.
Seeding words...
Inserted 8 words.
Seeding admin user...
Inserted 1 users.
Seed completed successfully!
```

#### 3.4.7 错误处理

- `mongoose.connect()` 失败 → catch 后 `console.error("Seed failed:", err.message 或 err)` → `process.exit(1)`
- 任何 `insertMany` 失败（如 Mongoose ValidationError）→ 被外层 `catch` 捕获，打印错误信息并 `process.exit(1)`

---

## 4. 代码规范要求

- 使用 `async/await` 而非 `Promise.then`
- TypeScript 严格模式，所有函数参数和返回值标注类型
- 错误信息使用英文（与现有代码库保持一致），日志格式参考现有 `database.ts` 风格
- 导出命名遵循现有约定：函数用 `export function`，类型用 `export type`
- 不修改 `client/src/data/` 目录下的任何文件
- 环境变量名使用大写蛇形命名（`DB_MAX_POOL_SIZE`），与现有 `.env.example` 风格一致
- `parseInt` 兜底逻辑必须用 `isNaN()` 检测，不可依赖隐式转换

---

## 5. 测试要求

代码必须能通过以下测试用例（详见 [test-cases.md](./test-cases.md)）：

| 用例 | 要点 |
|------|------|
| TC-A01 | `npm run db:seed` 一键执行成功，退出码 0 |
| TC-A02 | WordBank 字段映射正确（name/description/gradient 默认值） |
| TC-A03 | Word + extendedMeanings + collocations 完整映射 |
| TC-A04 | 管理员用户已创建 |
| TC-A05 | 重复执行不产生重复数据 |
| TC-A06 | 重复执行覆盖手动修改的数据 |
| TC-A07 | MongoDB 未启动时优雅报错 |
| TC-A08 | 必填字段缺失时报 ValidationError |
| TC-B01 | 连接池 maxPoolSize 可配置 |
| TC-B02 | 连接池 idleTimeout 可配置 |
| TC-B03 | 连接超时可配置 |
| TC-B04 | 连接池参数有合理默认值 |
| TC-B05 | 无效连接池参数优雅降级 |
| TC-B06 | `getDB()` 返回连接实例 |
| TC-C01 | `.env.example` 包含所有连接池参数 |
| TC-C02 | `config` 模块导出所有连接池参数 |

---

## 6. 注意事项

- **跨包导入路径**: `client/src/data/mockData.ts` 在 `client/` 目录下，server 的 seed 脚本使用 `../../../client/src/data/mockData` 相对路径导入。如果 TypeScript 编译报错，可能需要调整 `server/tsconfig.json` 的 `include` 范围。但 seed 脚本通过 `tsx` 直接运行（`package.json` 中已有 `"db:seed": "tsx src/seed/index.ts"`），`tsx` 使用 esbuild 处理跨目录导入，通常不需要额外配置。
- **`physicalImageDescription` 必填**: DB Model 中此字段为 `required: true`，但 mock 数据不包含它。必须按 3.4.4 节的映射表生成默认值，否则 `insertMany` 会因 Mongoose ValidationError 失败。
- **`mockData.ts` 是只读的**: 不要修改 `client/src/data/mockData.ts`，Seed 脚本只从它读取。
- **清理顺序**: `User.deleteMany` 放最后（因为 Word 依赖 WordBank，而 User 引用 Word 的 learnedWords，但是 User 先删除不会引起约束问题）——实际先清空 `LearningRecord → UserFavorite → Collocation → Word → WordBank → User`，确保依赖关系不阻断删除。
- **Mock 用户数据中的 `learnedWords` 是数字而非 ID 数组**: `mockUsers[].learnedWords` 是已学单词数量（number），不是 MongoDB ObjectId 数组。Seed 时忽略此字段（User.learnedWords 默认空数组 `[]`）。同理 `mockUsers[].joinedAt` → `User.createdAt` 由 Mongoose timestamps 自动管理。
