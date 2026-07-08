# 测试用例 — Task 1.3: Seed 数据脚本与连接池配置

> 生成日期：2026-07-07 | 关联 Task：[task.md](./task.md)

---

## 测试范围说明

本任务涉及两个独立模块的测试：(A) Seed 数据脚本（从 mock 数据迁移到 MongoDB），(B) 数据库连接池配置。测试用例按模块和验收标准组织。

---

## A. Seed 数据脚本

### TC-A01: `db:seed` 命令一键导入所有种子数据
- **类型**: 功能测试
- **关联验收标准**: `npm run db:seed` 命令可一键导入所有种子数据
- **前置条件**: MongoDB 服务已启动，数据库为空（无任何 collection）
- **输入**:
  - 命令：`npm run db:seed`
- **执行步骤**:
  1. 确保 MongoDB 无 `wordbanks`、`words`、`collocations`、`userfavorites`、`learningrecords`、`users` 六个 collection
  2. 在 `server/` 目录执行 `npm run db:seed`
  3. 观察控制台输出日志
- **预期输出**:
  - 脚本执行成功，退出码为 0
  - 控制台输出包含各实体插入数量（如 `Inserted 4 wordbanks.`、`Inserted 8 words.`、`Inserted 1 users.`）
  - 控制台输出 `Seed completed successfully!`
- **清理**: 执行 `npm run db:clean` 或在 MongoDB 中手动删除所有 collection

### TC-A02: WordBank 种子数据校验（含字段映射）
- **类型**: 功能测试
- **关联验收标准**: Seed 脚本可从 mock 数据文件读取词库和单词数据并写入数据库
- **前置条件**: 已执行 `npm run db:seed`，导入成功
- **输入**:
  - 查询 `db.wordbanks.find().sort({name: 1})`
- **执行步骤**:
  1. 连接 MongoDB，切换到 `english-dictionary` 数据库
  2. 查询所有 wordbanks 文档
  3. 逐一验证每条数据与 `client/src/data/mockData.ts` 中 `mockLibraries` 的映射关系
- **预期输出**:
  - 共 4 个 wordbank 文档
  - `name` 字段映射正确：`mockLibraries[].name` → `WordBank.name`（如 "基础高频词汇"）
  - `description` 字段映射正确：`mockLibraries[].description` → `WordBank.description`
  - `gradient` 字段已设置默认值（因 mock 数据无此字段）
  - 每个文档有 `_id`、`createdAt`、`updatedAt`
- **清理**: 无（查询操作）

### TC-A03: Word 种子数据校验（含引申义子文档和搭配）
- **类型**: 功能测试
- **关联验收标准**: 单词、引申义、搭配 mock 数据正确导入（含关联关系）
- **前置条件**: 已执行 `npm run db:seed`，导入成功
- **输入**:
  - 查询 `db.words.find({word: "flow"}).limit(1)`
- **执行步骤**:
  1. 查询 word="flow" 的文档
  2. 验证字段映射：`mockWords[].word` → `Word.word`、`mockWords[].phonetic` → `Word.phonetic`、`mockWords[].coreMeaning` → `Word.coreMeaning`、`mockWords[].coreImageType` → `Word.physicalImageType`
  3. 验证 `wordbankId` 字段正确关联到对应 WordBank 的 _id
  4. 验证 `extendedMeanings` 子文档数组正确映射：
     - `mockWords[].extendedMeanings[].logicalEvolution` → `IExtendedMeaning.evolutionDescription`
     - `mockWords[].extendedMeanings[].meaning` → `IExtendedMeaning.meaning`
     - `mockWords[].extendedMeanings[].partOfSpeech` → `IExtendedMeaning.partOfSpeech`
     - `mockWords[].extendedMeanings[].exampleSentence` → `IExtendedMeaning.exampleEn`
     - `mockWords[].extendedMeanings[].exampleTranslation` → `IExtendedMeaning.exampleZh`
  5. 验证 `collocations` 字段为字符串数组
- **预期输出**:
  - 共 8 个 word 文档
  - "flow" 文档有 4 条 extendedMeanings（与 mockData 中一致）
  - "flow" 文档有 ≥5 条 collocations
  - 所有 extendedMeaning 子文档有 `_id` 字段
- **清理**: 无（查询操作）

### TC-A04: 默认管理员用户创建
- **类型**: 功能测试
- **关联验收标准**: 创建默认管理员用户
- **前置条件**: 已执行 `npm run db:seed`，导入成功
- **输入**:
  - 查询 `db.users.find({role: "admin"})`
- **执行步骤**:
  1. 查询 role="admin" 的用户
  2. 验证 admin 用户字段
- **预期输出**:
  - 至少 1 个 role="admin" 的用户
  - `username` 为 "admin"
  - `phone` 字段存在
  - `passwordHash` 字段存在（已哈希，非明文）
- **清理**: 无（查询操作）

### TC-A05: Seed 脚本幂等性 — 重复执行不产生重复数据
- **类型**: 功能测试
- **关联验收标准**: Seed 脚本可重复执行而不产生重复数据（upsert / 先清空再插入）
- **前置条件**: 已执行过一次 `npm run db:seed`
- **输入**:
  - 再次执行 `npm run db:seed`
- **执行步骤**:
  1. 记录第一次 seed 后的 wordbanks 和 words 数量
  2. 再次执行 `npm run db:seed`
  3. 查询 wordbanks 和 words 数量
- **预期输出**:
  - 第二次执行成功后，wordbanks 数量与第一次相同（4 条）
  - words 数量与第一次相同（8 条）
  - 无重复 name 的 wordbank
  - 无重复 word+wordbankId 组合的 word
- **清理**: 执行 `npm run db:clean`

### TC-A06: Seed 脚本幂等性 — 数据更新后重复执行覆盖旧数据
- **类型**: 功能测试
- **关联验收标准**: Seed 脚本可重复执行而不产生重复数据
- **前置条件**: 已执行过一次 `npm run db:seed`，然后手动修改了某个 wordbank 的 description
- **输入**:
  - 手动修改 "基础高频词汇" 的 description 为 "已修改的描述"
  - 再次执行 `npm run db:seed`
- **执行步骤**:
  1. 执行 `npm run db:seed`（第一次）
  2. 通过 MongoDB 手动更新一条 wordbank 的 description
  3. 再次执行 `npm run db:seed`（第二次）
  4. 查询该 wordbank 的 description
- **预期输出**:
  - 第二次执行后，该 wordbank 的 description 恢复为 mock 数据中的原始值（先清空再插入策略会覆盖）
- **清理**: 执行 `npm run db:clean`

### TC-A07: Seed 脚本错误处理 — MongoDB 未启动
- **类型**: 异常测试
- **关联验收标准**: Seed 脚本可从 mock 数据文件读取词库和单词数据并写入数据库
- **前置条件**: MongoDB 服务未启动
- **输入**:
  - 命令：`npm run db:seed`
- **执行步骤**:
  1. 停止 MongoDB 服务
  2. 执行 `npm run db:seed`
- **预期输出**:
  - 脚本执行失败，退出码不为 0
  - 控制台输出明确的错误信息（如 "MongoDB connection failed:" 或 "Seed failed:"）
  - 不会静默退出
- **清理**: 启动 MongoDB 服务

### TC-A08: Seed 脚本错误处理 — 数据文件中缺少必填字段
- **类型**: 异常测试
- **关联验收标准**: Seed 脚本可从 mock 数据文件读取词库和单词数据并写入数据库
- **前置条件**: 临时修改 mockData.ts，将某个 word 的 `word` 字段删除
- **输入**:
  - 修改后的 mockData 文件
  - 命令：`npm run db:seed`
- **执行步骤**:
  1. 临时修改 mockData.ts，移除某 word 的 `word` 字段
  2. 执行 `npm run db:seed`
- **预期输出**:
  - 脚本执行失败，退出码不为 0
  - 控制台输出明确的验证错误信息（Mongoose ValidationError）
- **清理**: 恢复 mockData.ts，执行 `npm run db:clean`

### TC-A09: 不同环境数据库配置切换
- **类型**: 集成测试
- **关联验收标准**: 环境变量区分开发/生产数据库配置
- **前置条件**: 两个不同名称的 MongoDB 数据库可用
- **输入**:
  - `NODE_ENV=development` → 连接 `english-dictionary-dev`
  - `NODE_ENV=production` → 连接 `english-dictionary`
- **执行步骤**:
  1. 设置 `MONGODB_URI=mongodb://localhost:27017/english-dictionary-dev` 和 `NODE_ENV=development`
  2. 执行 `npm run db:seed`
  3. 验证数据写入 `english-dictionary-dev` 数据库
  4. 设置 `MONGODB_URI=mongodb://localhost:27017/english-dictionary` 和 `NODE_ENV=production`
  5. 执行 `npm run db:seed`
  6. 验证数据写入 `english-dictionary` 数据库
- **预期输出**:
  - 两个数据库分别有独立的种子数据，互不影响
  - 脚本根据 `MONGODB_URI` 环境变量连接正确的数据库
- **清理**: 删除两个测试数据库

---

## B. 数据库连接池配置

### TC-B01: 连接池最大连接数配置
- **类型**: 功能测试
- **关联验收标准**: 连接池配置合理：最大连接数、空闲超时、连接超时等参数
- **前置条件**: MongoDB 服务已启动，服务器已配置连接池参数
- **输入**:
  - 环境变量 `DB_MAX_POOL_SIZE=20`
- **执行步骤**:
  1. 设置 `DB_MAX_POOL_SIZE=20`
  2. 启动服务器 `npm run dev`
  3. 通过 `mongoose.connection` 或驱动内部属性检查连接池配置
- **预期输出**:
  - `mongoose.connect()` 调用时传入了 `maxPoolSize: 20`
  - 日志中可见连接池配置信息
- **清理**: 停止服务器

### TC-B02: 连接池空闲超时配置
- **类型**: 功能测试
- **关联验收标准**: 连接池配置合理：最大连接数、空闲超时、连接超时等参数
- **前置条件**: MongoDB 服务已启动
- **输入**:
  - 环境变量 `DB_IDLE_TIMEOUT_MS=30000`
- **执行步骤**:
  1. 设置 `DB_IDLE_TIMEOUT_MS=30000`
  2. 启动服务器
  3. 检查 mongoose 连接配置中的 `maxIdleTimeMS`
- **预期输出**:
  - 空闲连接在 30 秒后被回收
- **清理**: 停止服务器

### TC-B03: 连接超时配置
- **类型**: 功能测试
- **关联验收标准**: 连接池配置合理：最大连接数、空闲超时、连接超时等参数
- **前置条件**: 配置 server 连接到一个不可达的 MongoDB 地址
- **输入**:
  - 环境变量 `DB_CONNECT_TIMEOUT_MS=5000`、`MONGODB_URI=mongodb://10.255.255.1:27017/test`（不可达 IP）
- **执行步骤**:
  1. 设置 `DB_CONNECT_TIMEOUT_MS=5000`
  2. 设置 `MONGODB_URI` 为不可达地址
  3. 执行 `npm run db:seed` 或启动服务器
  4. 计时从连接到报错的时间
- **预期输出**:
  - 约 5 秒后脚本/服务器因连接超时报错退出（不可达地址不会等很久）
  - 报错信息明确提示连接超时
- **清理**: 恢复正确的 `MONGODB_URI`

### TC-B04: 连接池参数默认值
- **类型**: 边界测试
- **关联验收标准**: 连接池配置合理
- **前置条件**: 未设置任何连接池相关的环境变量
- **输入**:
  - 不设置 `DB_MAX_POOL_SIZE`、`DB_IDLE_TIMEOUT_MS`、`DB_CONNECT_TIMEOUT_MS`
- **执行步骤**:
  1. 确保 `.env` 中无连接池相关变量
  2. 启动服务器
  3. 检查 mongoose 默认连接池配置
- **预期输出**:
  - 使用合理默认值（如 `maxPoolSize: 10`、`connectTimeoutMS: 10000`）
  - 服务器正常启动
- **清理**: 停止服务器

### TC-B05: 无效连接池参数处理
- **类型**: 异常测试
- **关联验收标准**: 连接池配置合理
- **前置条件**: MongoDB 服务已启动
- **输入**:
  - 环境变量 `DB_MAX_POOL_SIZE=invalid`
- **执行步骤**:
  1. 设置 `DB_MAX_POOL_SIZE=invalid`（非数字字符串）
  2. 启动服务器
- **预期输出**:
  - 服务器优雅降级，使用默认值或报明确错误
  - 不应崩溃（`parseInt("invalid")` 返回 `NaN`，应有兜底逻辑）
- **清理**: 移除无效环境变量，停止服务器

### TC-B06: `getDB()` 或等效接口可用性
- **类型**: 功能测试
- **关联验收标准**: 数据库连接模块提供单例或依赖注入方式给服务层使用
- **前置条件**: 服务器已启动，数据库已连接
- **输入**:
  - 在 service 层调用 `getDB()` 或等效接口
- **执行步骤**:
  1. 在某个 service 文件中 import 数据库连接模块
  2. 调用提供的 `getDB()`（或等效导出）
  3. 验证返回的连接实例状态
- **预期输出**:
  - `getDB()` 返回 mongoose 连接实例（或 `mongoose.connection` 对象）
  - 返回实例的 `readyState === 1`（已连接）
  - 多次调用返回同一实例（单例模式）
- **清理**: 无

---

## C. 配置文件

### TC-C01: `.env.example` 包含所有连接池参数
- **类型**: 功能测试
- **关联验收标准**: 连接池参数可通过环境变量配置
- **前置条件**: 查看 `server/.env.example` 文件
- **输入**:
  - 无
- **执行步骤**:
  1. 打开 `server/.env.example`
  2. 检查是否包含连接池相关环境变量注释
- **预期输出**:
  - 包含 `DB_MAX_POOL_SIZE`（或等效名称）及注释说明
  - 包含 `DB_IDLE_TIMEOUT_MS`（或等效名称）及注释说明
  - 包含 `DB_CONNECT_TIMEOUT_MS`（或等效名称）及注释说明
  - 包含 `MONGODB_URI` 及注释说明（区分开发/生产）
- **清理**: 无

### TC-C02: `config` 模块包含所有连接池参数
- **类型**: 功能测试
- **关联验收标准**: 连接池参数可通过环境变量配置
- **前置条件**: 查看 `server/src/config/index.ts`
- **输入**:
  - 无
- **执行步骤**:
  1. 打开 `server/src/config/index.ts`
  2. 检查 config 对象是否导出连接池相关字段
- **预期输出**:
  - 包含 `dbMaxPoolSize`（默认值如 10）
  - 包含 `dbIdleTimeoutMs`（默认值如 30000）
  - 包含 `dbConnectTimeoutMs`（默认值如 10000）
  - 以上字段均从环境变量读取，有合理默认值
- **清理**: 无

---

## 测试用例统计

| 类型 | 数量 |
|------|------|
| 功能测试 | 14 |
| 边界测试 | 1 |
| 异常测试 | 3 |
| 集成测试 | 1 |
| **合计** | **19** |

| 验收标准 | 覆盖用例 |
|----------|---------|
| Seed 脚本可从 mock 数据文件读取数据并写入数据库 | TC-A02, TC-A03, TC-A07, TC-A08 |
| `npm run db:seed` 命令可一键导入 | TC-A01 |
| Seed 脚本可重复执行不产生重复数据 | TC-A05, TC-A06 |
| 连接池配置合理 | TC-B01, TC-B02, TC-B03, TC-B04, TC-B05 |
| 数据库连接模块提供单例/DI | TC-B06 |
| 环境变量区分开发/生产配置 | TC-A09, TC-C01, TC-C02 |
