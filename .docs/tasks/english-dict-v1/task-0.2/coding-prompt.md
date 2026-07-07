# Coding Prompt — Task 0.2: 数据库 Schema 设计

### 1. 任务目标

基于 ADR 已确认的 MongoDB + Mongoose 技术选型，生成完整的数据库 Schema 设计文档 `.docs/schema.md`，覆盖所有 PRD 业务实体及其字段、约束、索引和关系。

### 2. 技术上下文

- **数据库**: MongoDB Atlas（云托管）
- **ODM**: Mongoose
- **语言/框架**: Node.js + Express + TypeScript
- **Schema 来源**: 后端 ADR（`.docs/adr/server.md`）§6 数据模型
- **涉及文件**:
  - (新建) `.docs/schema.md` — 数据库 Schema 设计文档
- **外部依赖**: 无

### 3. 实现要求

#### 3.1 文件 `.docs/schema.md`

创建完整的 Schema 设计文档，包含以下章节：

**文档头部元信息**：
- 版本、创建日期、关联 PRD 和 ADR 链接

**第 1 章：概述**
- 简述数据库选型（MongoDB + Mongoose）和文档结构设计思路
- 说明为何采用嵌套文档（ExtendedMeaning 内嵌于 Word）而非关系型 JOIN

**第 2 章：ER 关系图**
- 使用 Mermaid `erDiagram` 语法绘制实体关系图
- 实体包括：User、WordBank、Word（含 ExtendedMeaning 子文档、Collocation 子文档数组）
- 标注关系：WordBank 1:N Word、Word 1:N ExtendedMeaning（内嵌）、Word 1:N Collocation（内嵌数组）、User M:N Word（通过 learnedWords）

**第 3 章：集合详细设计**

为每个集合（User、WordBank、Word）提供完整字段表格，表格格式：

| 字段名 | 类型 | 必填 | 默认值 | 索引 | 说明 |
|--------|------|------|--------|------|------|

##### 3.1 users 集合

字段清单（来自 ADR §6.2）：

| 字段名 | 类型 | 必填 | 默认值 | 索引 | 说明 |
|--------|------|------|--------|------|------|
| `_id` | ObjectId | 是 | 自动 | PK | MongoDB 自动生成 |
| `username` | String | 是 | — | — | 用户名 |
| `phone` | String | 是 | — | **unique** | 手机号，正则校验 `^1[3-9]\d{9}$` |
| `passwordHash` | String | 是 | — | — | bcrypt 加密后的密码哈希 |
| `role` | String | 是 | `'user'` | — | 枚举 `'user'` \| `'admin'` |
| `learnedWords` | [ObjectId] | 否 | `[]` | — | 已学单词 ID 列表，引用 Word 集合 |
| `createdAt` | Date | 是 | `Date.now` | — | 创建时间（Mongoose timestamps） |

##### 3.2 wordbanks 集合

| 字段名 | 类型 | 必填 | 默认值 | 索引 | 说明 |
|--------|------|------|--------|------|------|
| `_id` | ObjectId | 是 | 自动 | PK | MongoDB 自动生成 |
| `name` | String | 是 | — | **unique** | 词库名称 |
| `description` | String | 是 | — | — | 词库描述 |
| `gradient` | String | 否 | 见说明 | — | CSS 渐变色字符串，默认 `"linear-gradient(135deg, #667eea 0%, #764ba2 100%)"` |
| `createdAt` | Date | 是 | `Date.now` | — | 创建时间 |

##### 3.3 words 集合

| 字段名 | 类型 | 必填 | 默认值 | 索引 | 说明 |
|--------|------|------|--------|------|------|
| `_id` | ObjectId | 是 | 自动 | PK | MongoDB 自动生成 |
| `word` | String | 是 | — | **normal** | 单词名 |
| `wordbankId` | ObjectId | 是 | — | **normal** | 所属词库，引用 WordBank |
| `phonetic` | String | 否 | — | — | 音标 |
| `coreMeaning` | String | 是 | — | **text** | 核心义描述 |
| `coreExampleEn` | String | 是 | — | — | 核心义英文例句 |
| `coreExampleZh` | String | 是 | — | — | 核心义中文翻译 |
| `physicalImageType` | String | 是 | — | — | 物理意象类型，枚举 8 种 |
| `physicalImageDescription` | String | 是 | — | — | 物理意象描述 |
| `extendedMeanings` | [SubDocument] | 否 | `[]` | — | 引申义子文档数组 |
| `collocations` | [String] | 否 | `[]` | — | 常见搭配字符串数组 |
| `createdAt` | Date | 是 | `Date.now` | — | 创建时间 |

##### 3.4 extendedMeanings 子文档（内嵌于 Word）

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `evolutionDescription` | String | 是 | — | 逻辑演化描述（物理义→引申义） |
| `meaning` | String | 是 | — | 引申义 |
| `partOfSpeech` | String | 是 | — | 词性，枚举 `noun` \| `verb` \| `adj` \| `adv` \| `prep` \| `conj` \| `pron` \| `other` |
| `exampleEn` | String | 是 | — | 英文例句 |
| `exampleZh` | String | 是 | — | 中文翻译 |

##### 3.5 收藏与学习记录

说明收藏功能和学���记录的数据模型设计（来自 ADR §6.1）：

- **收藏功能**：在 User 模型中增加 `favoriteWords: [ObjectId]` 字段，引用 Word 集合。无需独立集合。
- **学习记录**：复用 `User.learnedWords: [ObjectId]` 字段，记录已学单词 ID 列表。支持"已学单词数"查询。如需记录学习日期详情，后续可扩展为独立 `learning_records` 集合（`{ userId, wordId, learnedAt }`）。

**第 4 章：约束与枚举汇总**

汇总所有枚举和约束：

| 约束类型 | 字段 | 定义 |
|----------|------|------|
| 角色枚举 | `User.role` | `'user'` \| `'admin'` |
| 物理意象枚举 | `Word.physicalImageType` | `'flow'` \| `'grasp'` \| `'break'` \| `'bear'` \| `'drive'` \| `'light'` \| `'leverage'` \| `'yield'` |
| 词性枚举 | `ExtendedMeaning.partOfSpeech` | `'noun'` \| `'verb'` \| `'adj'` \| `'adv'` \| `'prep'` \| `'conj'` \| `'pron'` \| `'other'` |
| 手机号格式 | `User.phone` | 正则 `^1[3-9]\d{9}$` |
| 唯一约束 | `User.phone` | unique index |
| 唯一约束 | `WordBank.name` | unique index |

**第 5 章：索引策略汇总**

| 集合 | 字段 | 索引类型 | 用途 |
|------|------|----------|------|
| `users` | `phone` | unique | 登录查询、注册去重 |
| `wordbanks` | `name` | unique | 词库名去重 |
| `words` | `word` | normal | 按单词名搜索 |
| `words` | `wordbankId` | normal | 按词库查询单词列表 |
| `words` | `coreMeaning` | text (MongoDB) | 全文搜索核心义描述 |

**第 6 章：命名规范**

- 集合名：小写复数（`users`、`wordbanks`、`words`）
- 字段名：统一 camelCase（`wordbankId`、`coreMeaning`、`physicalImageType`）
- 引用字段：以 `Id` 后缀标识（`wordbankId`）
- 数组字段：复数命名（`extendedMeanings`、`collocations`、`learnedWords`）
- 布尔字段：无（当前 Schema 中无布尔类型字段）
- 日期字段：以 `At` 后缀标识（`createdAt`）

### 4. 代码规范要求

- 文档使用 Markdown 格式，中文为主要语言
- Mermaid 图使用 `erDiagram` 语法
- 所有字段表格对齐、可读
- 关联文档使用相对路径链接（`../prd/prd.md`、`../adr/server.md`）
- 在文档末尾注明：本文档为 Schema 设计文档，实际 Mongoose Model 代码在 Task 1.2 中实现

### 5. 测试要求

代码（Schema 文档）必须能满足以下测试用例（详见 `test-cases.md`）：

- **TC-001**: User 实体覆盖 — username, phone, passwordHash, role, learnedWords, createdAt 齐全
- **TC-002**: WordBank 实体覆盖 — name, description, gradient, createdAt 齐全
- **TC-003**: Word 实体覆盖 — 10+ 顶层字段 + extendedMeanings 子文档 + collocations 数组齐全
- **TC-004**: 收藏功能数据模型设计（User.favoriteWords）
- **TC-005**: 学习记录数据模型设计（User.learnedWords）
- **TC-006**: 实体关系映射验证（ER 图表达清晰）
- **TC-007~009**: 索引策略覆盖 users、wordbanks、words 三个集合
- **TC-010**: 命名规范一致性（camelCase 统一，无 snake_case 混用）
- **TC-011**: 字段类型与 MongoDB/Mongoose 能力一致（无 SQL 概念混入）
- **TC-012**: 字段必填与默认值完整性
- **TC-013**: physicalImageType 枚举 8 种值
- **TC-014**: 手机号 String 类型 + 正则 `^1[3-9]\d{9}$`
- **TC-015**: Schema 文档完整性（存在、含 ER 图、字段表、索引汇总）
- **TC-016**: 全部 7 个业务实体覆盖（User、WordBank、Word、ExtendedMeaning、Collocation、Favorites、LearningRecords）

### 6. 注意事项

1. **此任务产出的是文档，不是代码**：`.docs/schema.md` 是设计文档，实际的 Mongoose Model 代码（`server/src/models/*.ts`）在 Task 1.2 中实现。
2. **所有 Schema 信息已在 ADR §6 中定义**：直接引用 ADR 中的字段定义，不要自行增减字段。
3. **MongoDB 特有概念**：使用 `ObjectId`、`SubDocument`、`[String]` 等 MongoDB 原生类型，不要出现 `VARCHAR`、`AUTO_INCREMENT`、`FOREIGN KEY` 等 SQL 概念。
4. **嵌套 vs 引用**：`extendedMeanings` 是内嵌子文档（非独立集合），`wordbankId` 是引用字段（指向 WordBank 集合），需在文档中区分清楚。
5. **Mermaid ER 图**：Mermaid 的 `erDiagram` 对 MongoDB 嵌套文档支持有限，内嵌关系可在注释中说明，图中主要展示集合间的引用关系。
6. **favoriteWords**：ADR 未明确提及该字段，但 PRD §9.3 明确收藏是 P1 需求。在 User Schema 中增加此字段（与 learnedWords 同类型 `[ObjectId]`），同时在 ADR 的"后续扩展"语境下列出。
