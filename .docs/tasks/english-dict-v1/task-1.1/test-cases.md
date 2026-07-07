# 测试用例 — Task 1.1: 数据库表创建与 Migration

> 基于 [Task 详情](./task.md)、[Schema 设计](../../../schema.md) 和 [后端 ADR §3](../../../adr/server.md)（MongoDB + Mongoose）生成。
>
> **技术背景说明**：ADR 选定 MongoDB + Mongoose（非关系型数据库），因此不存在传统 SQL Migration 脚本。本 Task 的"Migration"等价于：Mongoose 连接配置 → Model 定义（含 Schema 约束和索引）→ 自动创建集合 + 索引初始化。`extendedMeanings` 和 `collocations` 为 Word 的内嵌子文档/数组，非独立集合。

---

## 测试范围说明

| 维度 | 说明 |
|------|------|
| 功能测试 | 验证 Mongoose 连接配置、Model 定义、索引创建、Seed 脚本功能 |
| 边界测试 | 连接超时/断开、环境变量缺失、必填字段校验、枚举值约束 |
| 异常测试 | 无效连接字符串、重复索引创建、唯一约束冲突 |
| 集成测试 | Mongoose Model 与 Schema 文档一致性、内嵌子文档行为 |

---

## 测试用例

### TC-001: MongoDB 连接配置与连接管理
- **类型**: 功能测试
- **关联验收标准**: 数据库连接配置完成（`.env` 中的 MONGODB_URI 等）
- **前置条件**:
  - `server/.env` 已配置 `MONGODB_URI`
  - Mongoose 已安装为项目依赖
- **输入**:
  - 环境变量 `MONGODB_URI=mongodb://localhost:27017/english-dictionary`
- **执行步骤**:
  1. 检查 `server/.env` 中存在 `MONGODB_URI` 配置项
  2. 检查 `server/src/config/index.ts` 中读取 `MONGODB_URI` 的代码
  3. 启动服务（`npm run dev`），观察控制台是否有 MongoDB 连接成功日志
  4. 检查连接池配置：默认 minPoolSize/maxPoolSize 是否符合 Mongoose 默认值（或无特殊配置时使用默认值）
- **预期输出**:
  - `MONGODB_URI` 通过环境变量读取，不硬编码在源码中
  - MongoDB 连接成功，控制台打印连接成功信息（如 `MongoDB connected successfully`）
  - 若连接失败，服务启动时报错并给出明确提示
  - 连接超时设置合理（默认 30s）
- **清理**: 断开连接，关闭服务

### TC-002: Mongoose 连接失败处理
- **类型**: 异常测试
- **关联验收标准**: 数据库连接配置完成
- **前置条件**: MongoDB 服务未启动，或 `MONGODB_URI` 指向不可达地址
- **输入**:
  - 环境变量 `MONGODB_URI=mongodb://localhost:27019/nonexistent`（无效端口）
- **执行步骤**:
  1. 修改 `.env` 中 `MONGODB_URI` 为无效地址
  2. 启动服务
  3. 观察服务启动行为和错误日志
- **预期输出**:
  - 服务启动时检测到连接失败，打印明确错误信息（含 `MongoServerSelectionError` 或类似信息）
  - 进程应以非零退出码退出（或优雅降级，重新抛出错误）
  - 错误信息包含连接 URI（脱敏后）
- **清理**: 恢复正确的 `MONGODB_URI`，重启 MongoDB 服务

### TC-003: User Model 定义与 users 集合创建
- **类型**: 功能测试
- **关联验收标准**: Migration 脚本覆盖核心表 — users
- **前置条件**:
  - MongoDB 可连接
  - `server/src/models/User.ts` 已定义 Mongoose Model
- **输入**:
  - 无显式输入；首次插入 User 文档时触发集合创建
- **执行步骤**:
  1. 确认 `server/src/models/User.ts` 文件存在，导出 `User` Mongoose Model
  2. 在 Node.js 脚本中导入 User Model，执行 `User.create({ username: 'test', phone: '13800000001', passwordHash: 'hash', role: 'user' })`
  3. 连接 MongoDB shell 或 Compass，检查 `users` 集合是否创建
  4. 检查文档字段是否与 Schema 一致：`username`, `phone`, `passwordHash`, `role`, `learnedWords`, `favoriteWords`, `createdAt`, `updatedAt`
- **预期输出**:
  - `users` 集合自动创建
  - 文档包含所有 8 个字段（含 timestamps 自动生成的 `createdAt` 和 `updatedAt`）
  - `learnedWords` 默认值为 `[]`（空数组）
  - `favoriteWords` 默认值为 `[]`（空数组）
  - `role` 默认值为 `'user'`
- **清理**: 删除测试文档 `User.deleteMany({ phone: '13800000001' })`

### TC-004: WordBank Model 定义与 wordbanks 集合创建
- **类型**: 功能测试
- **关联验收标准**: Migration 脚本覆盖核心表 — wordbanks
- **前置条件**: MongoDB 可连接
- **输入**:
  - `{ name: '基础高频', description: '日常高频词汇', gradient: undefined }`
- **执行步骤**:
  1. 确认 `server/src/models/WordBank.ts` 文件存在，导出 `WordBank` Mongoose Model
  2. 创建 WordBank 文档（不传 `gradient`）
  3. 检查文档字段完整性
  4. 验证 `gradient` 默认值
- **预期输出**:
  - `wordbanks` 集合自动创建
  - 文档包含：`name`, `description`, `gradient`, `createdAt`, `updatedAt`
  - `gradient` 自动填充为默认渐变色 `"linear-gradient(135deg, #667eea 0%, #764ba2 100%)"`
  - `name` 字段标注 unique 约束后，重复插入同名文档抛出 `MongoServerError` (E11000)
- **清理**: 删除测试文档

### TC-005: Word Model 定义与 words 集合创建（含内嵌子文档）
- **类型**: 功能测试
- **关联验收标准**: Migration 脚本覆盖核心表 — words、extended_meanings（内嵌）、collocations（内嵌数组）
- **前置条件**:
  - MongoDB 可连接
  - `server/src/models/Word.ts` 已定义，含 `ExtendedMeaningSchema` 子文档
- **输入**:
  ```json
  {
    "word": "flow",
    "wordbankId": "<valid-objectid>",
    "phonetic": "/floʊ/",
    "coreMeaning": "沿最小阻力路径持续运动",
    "coreExampleEn": "The river flows to the sea.",
    "coreExampleZh": "河流向大海流动。",
    "physicalImageType": "flow",
    "physicalImageDescription": "液体沿最小阻力路径持续流动",
    "extendedMeanings": [
      {
        "evolutionDescription": "流体流动 → 语言连贯",
        "meaning": "（语言/思想）连贯流畅",
        "partOfSpeech": "adj",
        "exampleEn": "She speaks fluent English.",
        "exampleZh": "她英语说得很流利。"
      }
    ],
    "collocations": ["flow rate", "go with the flow"]
  }
  ```
- **执行步骤**:
  1. 确认 `server/src/models/Word.ts` 文件存在，导出 `Word` Mongoose Model
  2. 创建 Word 文档（含 1 个 ExtendedMeaning 子文档 + 2 个 collocations）
  3. 检查文档顶层字段完整性（共 12 个字段：word, wordbankId, phonetic, coreMeaning, coreExampleEn, coreExampleZh, physicalImageType, physicalImageDescription, extendedMeanings, collocations, createdAt, updatedAt）
  4. 检查 `extendedMeanings` 内嵌子文档是否包含 5 个字段 + `_id`
  5. 检查 `collocations` 是否为字符串数组
- **预期输出**:
  - `words` 集合自动创建
  - Word 文档完整，`extendedMeanings` 为内嵌子文档数组（非独立集合）
  - 每个 ExtendedMeaning 子文档有独立的 `_id`
  - `collocations` 为 `["flow rate", "go with the flow"]` 字符串数组
  - `phonetic` 为可选字段，可不传
- **清理**: 删除测试文档

### TC-006: 枚举值约束校验
- **类型**: 边界测试
- **关联验收标准**: 所有…约束正确建立（Mongoose enum 约束等效）
- **前置条件**: User、Word Model 已定义
- **输入**:
  - 分别尝试传入非法值：`User.role = 'superadmin'`、`Word.physicalImageType = 'invalid'`、`ExtendedMeaning.partOfSpeech = 'gerund'`
- **执行步骤**:
  1. 尝试创建 role 为 `'superadmin'` 的 User 文档
  2. 尝试创建 physicalImageType 为 `'invalid'` 的 Word 文档
  3. 尝试创建 partOfSpeech 为 `'gerund'` 的 ExtendedMeaning（内嵌于 Word）
  4. 观察 Mongoose 校验结果
- **预期输出**:
  - `role` 不在 `['user', 'admin']` 内 → Mongoose `ValidationError`，消息包含 "is not a valid enum value"
  - `physicalImageType` 不在 8 种枚举值内 → `ValidationError`
  - `partOfSpeech` 不在 8 种词性枚举内 → `ValidationError`
  - 所有非法文档未被写入数据库
- **清理**: 无

### TC-007: 必填字段校验
- **类型**: 边界测试
- **关联验收标准**: 默认值和 NOT NULL 约束正确（Mongoose required 等效）
- **前置条件**: User、WordBank、Word Model 已定义
- **输入**:
  - 分别创建缺少必填字段的文档：
    - User：缺少 `username`
    - WordBank：缺少 `description`
    - Word：缺少 `coreMeaning`
- **执行步骤**:
  1. 尝试创建 `User({ phone: '13900000001', passwordHash: 'hash' })` 缺 username
  2. 尝试创建 `WordBank({ name: 'test' })` 缺 description
  3. 尝试创建 `Word({ word: 'test', wordbankId: validId, physicalImageType: 'flow', physicalImageDescription: 'desc', coreExampleEn: 'a', coreExampleZh: '啊' })` 缺 coreMeaning
- **预期输出**:
  - 缺 `username` → `ValidationError: Path 'username' is required`
  - 缺 `description` → `ValidationError: Path 'description' is required`
  - 缺 `coreMeaning` → `ValidationError: Path 'coreMeaning' is required`
- **清理**: 无

### TC-008: 索引创建与验证
- **类型**: 功能测试
- **关联验收标准**: 所有…约束正确建立（索引等效）+ 数据库表结构与 Schema 设计文档一致
- **前置条件**:
  - MongoDB 可连接
  - 所有 Mongoose Model 已定义（含 Schema 级索引声明）
  - 索引初始化脚本已执行
- **输入**:
  - 执行索引创建命令（如 `npm run db:init` 或通过 Mongoose `autoIndex` 自动创建）
- **执行步骤**:
  1. 执行索引初始化
  2. 通过 MongoDB shell 或 `db.collection.getIndexes()` 检查各集合索引
  3. 核对 `users` 集合索引：`phone` (unique)
  4. 核对 `wordbanks` 集合索引：`name` (unique)
  5. 核对 `words` 集合索引：`word` (normal), `wordbankId` (normal), `coreMeaning` (text)
- **预期输出**:
  - `users` 含 `_id` (默认) + `phone` 唯一索引共 2 个索引
  - `wordbanks` 含 `_id` (默认) + `name` 唯一索引共 2 个索引
  - `words` 含 `_id` (默认) + `word` 普通索引 + `wordbankId` 普通索引 + `coreMeaning` 文本索引共 4 个索引
  - 所有索引类型与 [Schema 文档 §5](../../../schema.md) 一致
- **清理**: 无

### TC-009: 唯一约束冲突处理
- **类型**: 异常测试
- **关联验收标准**: 所有…约束正确建立
- **前置条件**: 索引已创建
- **输入**:
  - 先创建 phone='13800000001' 的 User
  - 再次创建 phone='13800000001' 的 User
- **执行步骤**:
  1. 创建第一个 User（phone='13800000001'）
  2. 尝试创建第二个 User（phone='13800000001'）
- **预期输出**:
  - 第二次创建抛出 `MongoServerError: E11000 duplicate key error`
  - 错误信息中包含 `phone_1 dup key` 字样
  - 数据库中仅存在第一条记录
- **清理**: 删除测试 User

### TC-010: 手机号格式校验
- **类型**: 边界测试
- **关联验收标准**: 所有…约束正确建立
- **前置条件**: User Model 已定义，phone 字段有 `match` 校验
- **输入**:
  - 合法手机号: `'13812345678'`
  - 非法手机号: `'1234'`, `'12345678901'`（12位）, `'23812345678'`（非1[3-9]开头）
- **执行步骤**:
  1. 用合法手机号创建 User → 应成功
  2. 用 `'1234'` 创建 User → 应失败
  3. 用 `'12345678901'` (12位) 创建 User → 应失败
  4. 用 `'23812345678'` (2开头) 创建 User → 应失败
  5. 确认 phone 字段类型为 `String`（非 `Number`）
- **预期输出**:
  - 合法手机号 → 创建成功
  - 非法格式 → `ValidationError`，消息提及正则匹配失败
  - `phone` schema 类型为 `String`（避免前导零丢失或数字溢出）
- **清理**: 删除合法手机号测试数据

### TC-011: 默认值正确性
- **类型**: 边界测试
- **关联验收标准**: 默认值和 NOT NULL 约束正确
- **前置条件**: User、WordBank、Word Model 已定义
- **输入**:
  - 创建 User 不传 `role`、`learnedWords`、`favoriteWords`
  - 创建 WordBank 不传 `gradient`
  - 创建 Word 不传 `extendedMeanings`、`collocations`、`phonetic`
- **执行步骤**:
  1. 创建最小字段 User → 检查 `role` 默认值、`learnedWords`/`favoriteWords` 默认值
  2. 创建最小字段 WordBank → 检查 `gradient` 默认值
  3. 创建最小字段 Word → 检查 `extendedMeanings`、`collocations` 默认值，确认 `phonetic` 为 `undefined`/null
- **预期输出**:
  - `role` 默认 `'user'`
  - `learnedWords` 默认 `[]`
  - `favoriteWords` 默认 `[]`
  - `gradient` 默认 `"linear-gradient(135deg, #667eea 0%, #764ba2 100%)"`
  - `extendedMeanings` 默认 `[]`
  - `collocations` 默认 `[]`
  - `createdAt`/`updatedAt` 由 Mongoose timestamps 自动填充（ISO 日期格式）
- **清理**: 删除测试数据

### TC-012: npm scripts 可执行性
- **类型**: 功能测试
- **关联验收标准**: `npm run db:migrate` 或等效命令可成功执行；`npm run db:rollback` 或等效命令可回滚
- **前置条件**: 项目依赖已安装（`npm install`）
- **输入**:
  - `npm run db:init`（或等效的初始化命令）
  - `npm run db:seed`（如已创建 seed 脚本）
- **执行步骤**:
  1. 检查 `server/package.json` 中是否定义了 `db:init` 或相关脚本
  2. 执行初始化命令
  3. 检查命令执行结果：连接成功日志、索引创建成功日志
  4. 检查命令退出码
- **预期输出**:
  - `package.json` 的 `scripts` 中包含数据库初始化相关命令（如 `db:init`）
  - 命令执行 exit code = 0
  - 控制台输出集合/索引创建成功的确认信息
  - 对于 MongoDB：提供 `db:drop-indexes` 等回滚等效命令（索引重建/删除），或说明 MongoDB 中回滚的含义
- **清理**: 无

### TC-013: Word.wordbankId 引用完整性（应用层）
- **类型**: 集成测试
- **关联验收标准**: 所有外键约束正确建立（MongoDB 引用等效）
- **前置条件**: WordBank Model 和 Word Model 已定义
- **输入**:
  - 创建一个 WordBank 文档，获取其 `_id`
  - 创建一个 Word 文档，`wordbankId` 指向该 `_id`
  - 尝试创建一个 Word 文档，`wordbankId` 指向不存在的 ObjectId
- **执行步骤**:
  1. 创建 WordBank A
  2. 创建 Word，`wordbankId` = A._id → 应成功
  3. 创建 Word，`wordbankId` = 随机未使用的 ObjectId → 应成功（MongoDB 不强制引用完整性）
  4. 验证 `user` 的 `learnedWords` 数组可存储不存在的 Word ID（同样不强制）
- **预期输出**:
  - Word 可成功创建，即使 `wordbankId` 指向不存在的词库（MongoDB 无外键强制约束）
  - `Word.populate('wordbankId')` 在引用不存在时返回 `null`
  - `Word.wordbankId` 字段在 Schema 中声明 `ref: 'WordBank'`，支持 `populate()`
- **清理**: 删除测试数据

### TC-014: Mongoose 全局配置正确性
- **类型**: 边界测试
- **关联验收标准**: 数据库连接配置完成
- **前置条件**: 连接模块已实现
- **输入**:
  - 检查连接模块源码
- **执行步骤**:
  1. 检查 `mongoose.connect()` 调用参数
  2. 确认是否配置 `dbName`（如 URI 中未指定）
  3. 确认是否关闭 `autoIndex`（生产环境推荐关闭，开发环境可开启）
  4. 确认是否启用 Mongoose debug 模式（开发环境可选）
  5. 检查连接事件监听：`connected`, `error`, `disconnected` 是否有日志输出
- **预期输出**:
  - 使用 `mongoose.connect(uri)` 或带 options 的调用
  - 数据库名称为 `english-dictionary`（来自 URI 路径）
  - 连接事件（open/error/disconnected）有对应日志或错误处理
  - `strictQuery` 等全局配置有合理设置（或使用默认值）
- **清理**: 无

### TC-015: Seed 数据脚本（初始数据）
- **类型**: 功能测试
- **关联验收标准**: （隐含需求）数据库可快速填充初始/测试数据
- **前置条件**: MongoDB 可连接，所有 Model 已定义
- **输入**:
  - 执行 `npm run db:seed`（或等效种子数据命令）
- **执行步骤**:
  1. 确认 `server/src/seed/` 目录存在 seed 脚本
  2. 执行种子数据脚本
  3. 检查 `wordbanks` 集合是否包含初始词库（如"基础高频"、"商务英语"等）
  4. 检查 `words` 集合是否包含初始单词（如 flow、grasp、break 等）
  5. 检查 `users` 集合是否包含初始管理员账户
- **预期输出**:
  - 种子脚本执行成功，exit code = 0
  - `wordbanks` 至少含 3-4 个初始词库
  - `words` 至少含 5-10 个初始单词
  - `users` 至少含 1 个管理员账户
  - 种子脚本可重复执行不报错（幂等，upsert 或先清理再插入）
  - 每个 Word 包含完整的 ExtendedMeaning 子文档
- **清理**: 可选 — 提供清理命令 `npm run db:clean`

### TC-016: Mongoose Model 与 Schema 设计文档一致性
- **类型**: 集成测试
- **关联验收标准**: 数据库表结构与 Schema 设计文档一致
- **前置条件**: Schema 文档 (`.docs/schema.md`) 与 Model 代码均已就绪
- **输入**:
  - 审查对象：`server/src/models/User.ts`、`WordBank.ts`、`Word.ts`
- **执行步骤**:
  1. 对比 User Model 字段与 Schema 文档 §3.1：`username`, `phone`, `passwordHash`, `role`, `learnedWords`, `favoriteWords`, `createdAt`
  2. 对比 WordBank Model 字段与 §3.2：`name`, `description`, `gradient`, `createdAt`
  3. 对比 Word Model 字段与 §3.3：`word`, `wordbankId`, `phonetic`, `coreMeaning`, `coreExampleEn`, `coreExampleZh`, `physicalImageType`, `physicalImageDescription`, `extendedMeanings`, `collocations`, `createdAt`
  4. 对比 ExtendedMeaning 子文档字段与 §3.4：`evolutionDescription`, `meaning`, `partOfSpeech`, `exampleEn`, `exampleZh`
  5. 对比索引定义与 §5：`phone` (unique), `name` (unique), `word` (normal), `wordbankId` (normal), `coreMeaning` (text)
- **预期输出**:
  - 所有 Model 字段名、类型、约束与 Schema 文档完全一致
  - 无遗漏字段
  - 无多余字段
  - 枚举值与 §4 一致：
    - `User.role`: `['user', 'admin']`
    - `Word.physicalImageType`: `['flow', 'grasp', 'break', 'bear', 'drive', 'light', 'leverage', 'yield']`
    - `ExtendedMeaning.partOfSpeech`: `['noun', 'verb', 'adj', 'adv', 'prep', 'conj', 'pron', 'other']`
- **清理**: 无

---

## 测试用例统计

| 类型 | 数量 | 编号 |
|------|------|------|
| 功能测试 | 6 | TC-001, TC-003, TC-004, TC-005, TC-008, TC-012, TC-015 |
| 边界测试 | 5 | TC-006, TC-007, TC-010, TC-011, TC-014 |
| 异常测试 | 2 | TC-002, TC-009 |
| 集成测试 | 2 | TC-013, TC-016 |
| **合计** | **16** | |

> **注意**：
> 1. 本 Task 采用 **MongoDB + Mongoose**，不存在传统 SQL 的 DDL Migration、外键约束、回滚脚本。测试用例中的约束校验（TC-006/007/009/010）通过 Mongoose Schema 定义在应用层实现。
> 2. TC-012（npm scripts）的 `db:init`/`db:seed`/`db:clean` 为 MongoDB 语境下的等效初始化命令。
> 3. TC-015（Seed 数据）为本次 Task 的核心产出之一，确保数据库可快速填充初始数据供前后端联调。
