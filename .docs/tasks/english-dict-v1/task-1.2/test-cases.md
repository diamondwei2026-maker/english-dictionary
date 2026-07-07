# 测试用例 — Task 1.2: ORM 模型定义

> 项目使用 Mongoose (MongoDB ODM)，模型即 Schema 定义，无需 Migration。

## 测试范围

| 维度 | 覆盖内容 |
|------|---------|
| 功能测试 | 模型文件存在、字段定义正确、TypeScript 类型推导 |
| 边界测试 | 必填字段缺失、枚举值校验、唯一约束 |
| 异常测试 | 无效数据类型、无效枚举值 |
| 集成测试 | 模型关联关系（ref/populate）、import 与编译 |

---

## TC-001: User 模型字段完整性

- **类型**: 功能测试
- **关联验收标准**: SUB-1.2.1 — User 模型包含 id, phone, email, password_hash, nickname, avatar, role, created_at, updated_at
- **前置条件**: 项目可正常编译
- **输入**:
  - 无
- **执行步骤**:
  1. 检查 `server/src/models/User.ts` 文件存在
  2. 读取 User Schema 定义
  3. 逐一检查以下字段在 Schema 中定义：
     - `username` (String, required)
     - `phone` (String, required, unique, 正则匹配手机号)
     - `passwordHash` (String, required)
     - `role` (String, enum ["user", "admin"], default "user")
     - `learnedWords` ([ObjectId], ref: "Word")
     - `favoriteWords` ([ObjectId], ref: "Word")
  4. 检查 `timestamps: true` 启用了 createdAt/updatedAt
- **预期输出**:
  - 所有字段均在 Schema 中正确定义
  - `timestamps` 选项为 `true`
  - IUser 接口导出且类型正确
- **清理**: 无

---

## TC-002: WordBank 模型字段完整性

- **类型**: 功能测试
- **关联验收标准**: SUB-1.2.1 — WordBank 模型包含 id, name, slug, description, cover_image, is_public, created_by, word_count, created_at, updated_at
- **前置条件**: 项目可正常编译
- **输入**:
  - 无
- **执行步骤**:
  1. 检查 `server/src/models/WordBank.ts` 文件存在
  2. 读取 WordBank Schema 定义
  3. 检查以下字段：
     - `name` (String, required, unique)
     - `description` (String, required)
     - `gradient` (String, default 值)
  4. 检查 `timestamps: true`
- **预期输出**:
  - 核心字段（name, description）正确定义
  - `timestamps` 选项为 `true`
  - IWordBank 接口导出且包含所有字段
- **清理**: 无

---

## TC-003: Word 模型字段完整性

- **类型**: 功能测试
- **关联验收标准**: SUB-1.2.1 — Word 模型包含 id, name, phonetic, physical_image, physical_image_svg, core_meaning, wordbank_id, created_at, updated_at
- **前置条件**: 项目可正常编译
- **输入**:
  - 无
- **执行步骤**:
  1. 检查 `server/src/models/Word.ts` 文件存在
  2. 读取 Word Schema 定义
  3. 检查以下字段：
     - `word` (String, required, indexed)
     - `wordbankId` (ObjectId, ref: "WordBank", required, indexed)
     - `phonetic` (String, optional)
     - `coreMeaning` (String, required)
     - `coreExampleEn` (String, required)
     - `coreExampleZh` (String, required)
     - `physicalImageType` (String, required, enum)
     - `physicalImageDescription` (String, required)
     - `extendedMeanings` ([ExtendedMeaningSchema])
     - `collocations` ([String])
  4. 检查文本索引和 `timestamps: true`
- **预期输出**:
  - 所有字段正确定义
  - extendedMeanings 使用 ExtendedMeaning 子文档 Schema
  - 文本索引定义在 coreMeaning 字段上
  - IWord / IExtendedMeaning 接口导出
- **清理**: 无

---

## TC-004: ExtendedMeaning 子文档模型定义

- **类型**: 功能测试
- **关联验收标准**: SUB-1.2.2 — ExtendedMeaning 模型包含 meaning_order, logic_evolution, extended_meaning, pos, example_en, example_cn
- **前置条件**: Word 模型文件存在
- **输入**:
  - 无
- **执行步骤**:
  1. 读取 `server/src/models/Word.ts` 中的 ExtendedMeaningSchema
  2. 检查字段：
     - `evolutionDescription` (String, required)
     - `meaning` (String, required)
     - `partOfSpeech` (String, required, enum)
     - `exampleEn` (String, required)
     - `exampleZh` (String, required)
  3. 检查 `_id: true`（Mongoose 子文档默认生成 _id）
- **预期输出**:
  - ExtendedMeaning 作为 Mongoose 子文档 Schema 正确定义
  - IExtendedMeaning 接口正确导出
  - _id 字段自动生成
- **清理**: 无

---

## TC-005: Collocation 独立模型定义

- **类型**: 功能测试
- **关联验收标准**: SUB-1.2.2 — Collocation 模型包含 phrase, meaning_cn, example_en, example_cn
- **前置条件**: 项目可正常编译
- **输入**:
  - 无
- **执行步骤**:
  1. 检查 `server/src/models/Collocation.ts` 文件存在
  2. 读取 Collocation Schema 定义
  3. 检查字段：
     - `phrase` (String, required)
     - `meaningCn` (String, required)
     - `exampleEn` (String, required)
     - `exampleZh` (String, required)
     - `wordId` (ObjectId, ref: "Word", required, indexed)
  4. 检查 `timestamps: true`
- **预期输出**:
  - Collocation 作为独立模型（非子文档）正确定义
  - wordId 外键关联 Word 模型
  - ICollocation 接口导出
- **清理**: 无

---

## TC-006: UserFavorite 模型定义

- **类型**: 功能测试
- **关联验收标准**: SUB-1.2.3 — UserFavorite 关联 user_id + word_id，唯一约束
- **前置条件**: 项目可正常编译
- **输入**:
  - 无
- **执行步骤**:
  1. 检查 `server/src/models/UserFavorite.ts` 文件存在
  2. 读取 UserFavorite Schema 定义
  3. 检查字段：
     - `userId` (ObjectId, ref: "User", required)
     - `wordId` (ObjectId, ref: "Word", required)
  4. 检查 `userId + wordId` 组合唯一索引
  5. 检查 `timestamps: true`
- **预期输出**:
  - UserFavorite 模型正确定义
  - userId + wordId 组合唯一约束防止重复收藏
  - IUserFavorite 接口导出
- **清理**: 无

---

## TC-007: LearningRecord 模型定义

- **类型**: 功能测试
- **关联验收标准**: SUB-1.2.3 — LearningRecord 关联 user_id + word_id，包含学习次数和时间
- **前置条件**: 项目可正常编译
- **输入**:
  - 无
- **执行步骤**:
  1. 检查 `server/src/models/LearningRecord.ts` 文件存在
  2. 读取 LearningRecord Schema 定义
  3. 检查字段：
     - `userId` (ObjectId, ref: "User", required)
     - `wordId` (ObjectId, ref: "Word", required)
     - `learnCount` (Number, default 0)
     - `lastLearnedAt` (Date)
  4. 检查 `userId + wordId` 组合唯一索引
  5. 检查 `timestamps: true`
- **预期输出**:
  - LearningRecord 模型正确定义
  - learnCount 默认值为 0
  - lastLearnedAt 记录最近学习时间
  - ILearningRecord 接口导出
- **清理**: 无

---

## TC-008: 模型关联关系验证

- **类型**: 集成测试
- **关联验收标准**: 模型间关联关系正确（如 WordBank hasMany Words）
- **前置条件**: 所有模型文件已创建
- **输入**:
  - 无
- **执行步骤**:
  1. 读取 `server/src/models/index.ts`
  2. 验证以下关联关系：
     - Word.wordbankId → ref: "WordBank"
     - User.learnedWords / favoriteWords → ref: "Word"
     - Collocation.wordId → ref: "Word"（如果 Collocation 为独立模型）
     - UserFavorite.userId → ref: "User"
     - UserFavorite.wordId → ref: "Word"
     - LearningRecord.userId → ref: "User"
     - LearningRecord.wordId → ref: "Word"
  3. 执行 `npx tsc --noEmit` 检查编译
- **预期输出**:
  - 所有 ref 引用指向正确的模型名
  - TypeScript 编译通过，无类型错误
- **清理**: 无

---

## TC-009: 模型统一导出

- **类型**: 功能测试
- **关联验收标准**: 模型可被 import 且通过编译
- **前置条件**: 所有模型文件已创建
- **输入**:
  - 导入语句：`import { User, WordBank, Word, Collocation, UserFavorite, LearningRecord } from "./models"`
- **执行步骤**:
  1. 读取 `server/src/models/index.ts`
  2. 检查是否导出所有 6 个模型 + 对应 TypeScript 接口
  3. 编写临时测试脚本 `import` 所有模型和接口
  4. 运行 `npx tsc --noEmit`
- **预期输出**:
  - index.ts 导出 User, WordBank, Word, Collocation, UserFavorite, LearningRecord 及其接口
  - 编译无错误
  - 所有导出的类均为 mongoose.Model 类型
- **清理**: 删除临时测试脚本（如有）

---

## TC-010: TypeScript 类型安全验证

- **类型**: 边界测试
- **关联验收标准**: TypeScript 类型推导正常，无 `any` 类型
- **前置条件**: 所有模型文件存在
- **输入**:
  - 在 `models/` 目录下执行类型检查
- **执行步骤**:
  1. 对所有模型文件运行 `npx tsc --noEmit`
  2. 搜索代码中是否使用了 `any` 类型（排除 node_modules）
  3. 验证泛型类型参数完整（如 `Schema<IUser>`）
- **预期输出**:
  - 编译无 any 类型警告（排除 node_modules）
  - 所有 Schema 构造函数使用泛型约束
  - Document 接口正确继承 Mongoose Document
- **清理**: 无

---

## TC-011: 枚举值约束验证

- **类型**: 边界测试
- **关联验收标准**: SUB-1.2.1 — Word.physicalImageType 枚举正确
- **前置条件**: Word 模型文件存在
- **输入**:
  - 创建一个 Word 实例，分别使用有效和无效的 physicalImageType
- **执行步骤**:
  1. 验证 PHYSICAL_IMAGE_TYPES 包含 8 个物理意象类型：flow, grasp, break, bear, drive, light, leverage, yield
  2. 验证 PART_OF_SPEECH_TYPES 包含：noun, verb, adj, adv, prep, conj, pron, other
  3. 验证 User.role 枚举值为 ["user", "admin"]
  4. 尝试创建使用无效枚举值的文档，确认 Mongoose 校验失败
- **预期输出**:
  - 有效枚举值可正常创建
  - 无效枚举值抛出 ValidationError
  - 枚举常量作为 named export 可被外部引用
- **清理**: 删除测试创建的文档

---

## TC-012: 必填字段校验

- **类型**: 异常测试
- **关联验收标准**: 所有模型 required 字段校验生效
- **前置条件**: 数据库连接可用
- **输入**:
  - 缺失必填字段的文档创建请求
- **执行步骤**:
  1. User：尝试创建无 username / phone / passwordHash 的文档
  2. WordBank：尝试创建无 name / description 的文档
  3. Word：尝试创建无 word / wordbankId / coreMeaning 的文档
  4. Collocation：尝试创建无 phrase 的文档
  5. UserFavorite：尝试创建无 userId 的文档
  6. LearningRecord：尝试创建无 userId 的文档
- **预期输出**:
  - 每个缺失必填字段的创建请求均抛出 ValidationError
  - 错误信息指明缺失字段名
- **清理**: 无（不会产生脏数据）

---

## TC-013: Seed 脚本与新模型兼容性

- **类型**: 集成测试
- **关联验收标准**: 新模型不影响已有 seed 脚本
- **前置条件**: 数据库连接可用，新模型已定义
- **输入**:
  - 运行 `npm run db:seed`
- **执行步骤**:
  1. 运行种子脚本
  2. 验证 User、WordBank、Word 表数据正常插入
  3. 验证新的 Collocation、UserFavorite、LearningRecord 模型不阻塞 seed 流程
  4. 检查 seed 输出日志确认成功
- **预期输出**:
  - Seed 脚本正常执行完成
  - 所有已实现模型的集合可正常写入
  - 如果 seed 涉及新模型，数据写入正确
- **清理**: 运行 `npm run db:clean` 清理测试数据

---

## 用例概览

| 编号 | 名称 | 类型 | 关联子任务 |
|------|------|------|-----------|
| TC-001 | User 模型字段完整性 | 功能测试 | SUB-1.2.1 |
| TC-002 | WordBank 模型字段完整性 | 功能测试 | SUB-1.2.1 |
| TC-003 | Word 模型字段完整性 | 功能测试 | SUB-1.2.1 |
| TC-004 | ExtendedMeaning 子文档模型 | 功能测试 | SUB-1.2.2 |
| TC-005 | Collocation 独立模型 | 功能测试 | SUB-1.2.2 |
| TC-006 | UserFavorite 模型 | 功能测试 | SUB-1.2.3 |
| TC-007 | LearningRecord 模型 | 功能测试 | SUB-1.2.3 |
| TC-008 | 模型关联关系验证 | 集成测试 | 全局 |
| TC-009 | 模型统一导出 | 功能测试 | 全局 |
| TC-010 | TypeScript 类型安全 | 边界测试 | 全局 |
| TC-011 | 枚举值约束验证 | 边界测试 | SUB-1.2.1 |
| TC-012 | 必填字段校验 | 异常测试 | 全局 |
| TC-013 | Seed 脚本兼容性 | 集成测试 | 全局 |

**生成统计**: 13 个测试用例（功能 7 / 边界 2 / 异常 1 / 集成 3）
