# 测试用例 — Task 0.2: 数据库 Schema 设计

> 基于 [PRD](../../../prd/prd.md) 业务模型和 [后端 ADR](../../../adr/server.md) 技术选型（MongoDB + Mongoose）生成。

---

## 测试范围说明

本 Task 为 Schema **设计**阶段，产出为 `.docs/schema.md`（或 `server/docs/schema.md`）文档。测试用例以"文档评审检查"方式验证 Schema 设计的完整性与正确性，部分用例可直接转化为后续 Task 1.1（数据库表创建与 Migration）的自动化测试。

| 维度 | 说明 |
|------|------|
| 功能测试 | 验证 Schema 文档是否覆盖所有业务实体及其字段 |
| 边界测试 | 验证字段类型、约束、默认值是否合理定义 |
| 异常测试 | 验证缺失、错误设计是否被排除 |
| 集成测试 | 验证 Schema 与 ADR 技术选型的一致性 |

---

## 测试用例

### TC-001: 核心实体覆盖 — User 实体
- **类型**: 功能测试
- **关联验收标准**: 覆盖所有 PRD 中涉及的业务实体：用户、词库、单词、引申义、搭配、学习记录、收藏
- **前置条件**: 已读取 PRD §5（功能需求）和 ADR §6（数据模型）
- **输入**:
  - 审查对象：`.docs/schema.md` 中的 User 相关定义
- **执行步骤**:
  1. 打开 Schema 文档
  2. 确认存在 User 实体定义
  3. 逐字段核对是否包含：`username`, `phone`, `passwordHash`, `role`, `learnedWords`, `createdAt`
  4. 核对 `role` 字段是否限定为枚举值 `'user' | 'admin'`
  5. 核对 `learnedWords` 是否为 ObjectId 数组（引用 Word）
- **预期输出**:
  - User 实体完整定义，字段与 ADR §6.2 一致
  - `role` 有明确的枚举约束（user / admin）
  - `learnedWords` 类型为 `[ObjectId]`（引用 Word 集合）
- **清理**: 无

### TC-002: 核心实体覆盖 — WordBank 实体
- **类型**: 功能测试
- **关联验收标准**: 覆盖所有 PRD 中涉及的业务实体
- **前置条件**: 已读取 PRD §5（词库浏览功能 F-04）和 ADR §6.2
- **输入**:
  - 审查对象：`.docs/schema.md` 中的 WordBank 相关定义
- **执行步骤**:
  1. 确认存在 WordBank 实体定义
  2. 逐字段核对是否包含：`name`, `description`, `gradient`, `createdAt`
  3. 核对 `name` 是否有唯一约束标识
  4. 核对 `gradient` 字段是否允许存储 CSS 渐变色字符串
- **预期输出**:
  - WordBank 实体完整定义，字段与 ADR §6.2 一致
  - `name` 标注唯一索引
  - `gradient` 类型为 String（可存储 CSS gradient 值）
- **清理**: 无

### TC-003: 核心实体覆盖 — Word 实体（含嵌套子文档）
- **类型**: 功能测试
- **关联验收标准**: 覆盖所有 PRD 中涉及的业务实体：单词、引申义、搭配
- **前置条件**: 已读取 PRD §5（单词详情 F-03）和 ADR §6.2
- **输入**:
  - 审查对象：`.docs/schema.md` 中的 Word 实体及 ExtendedMeaning / Collocation 子文档定义
- **执行步骤**:
  1. 确认存在 Word 实体定义
  2. 核对顶层字段：`word`, `wordbankId`, `phonetic`, `coreMeaning`, `coreExampleEn`, `coreExampleZh`, `physicalImageType`, `physicalImageDescription`, `extendedMeanings`, `collocations`, `createdAt`
  3. 核对 `physicalImageType` 是否限定为 8 种枚举值之一：flow / grasp / break / bear / drive / light / leverage / yield
  4. 核对 `extendedMeanings` 子文档字段：`evolutionDescription`, `meaning`, `partOfSpeech`, `exampleEn`, `exampleZh`
  5. 核对 `partOfSpeech` 是否有词性枚举约束（noun/verb/adj/adv/prep 等）
  6. 核对 `collocations` 是否为字符串数组
- **预期输出**:
  - Word 实体完整定义，字段与 ADR §6.2 一致
  - `physicalImageType` 有 8 种枚举限制
  - `extendedMeanings` 内嵌子文档结构完整，`partOfSpeech` 有词性枚举
  - `collocations` 定义为 `[String]`
- **清理**: 无

### TC-004: 收藏功能实体设计（UserFavorites）
- **类型**: 功能测试
- **关联验收标准**: 覆盖所有 PRD 中涉及的业务实体：收藏
- **前置条件**: 已读取 PRD §9.3（后续版本规划中包含"单词收藏功能"）
- **输入**:
  - 审查对象：`.docs/schema.md` 中是否定义了收藏相关数据结构
- **执行步骤**:
  1. 确认 Schema 文档中是否有收藏功能的实体设计
  2. 如在 User 中以 `favoriteWords: [ObjectId]` 字段实现，确认其存在
  3. 如以独立集合 `user_favorites` 实现，确认其字段完整性（userId + wordId + createdAt）
  4. 确认与 User 和 Word 实体的引用关系
- **预期输出**:
  - 收藏功能有明确的数据模型设计（嵌入 User 或独立集合均可）
  - 引用关系清晰（指向 User 和 Word）
- **清理**: 无

### TC-005: 学习记录实体设计（LearningRecords）
- **类型**: 功能测试
- **关联验收标准**: 覆盖所有 PRD 中涉及的业务实体：学习记录
- **前置条件**: 已读取 PRD §5（F-06 个人中心"已学单词数"）和 ADR §6.2（User.learnedWords）
- **输入**:
  - 审查对象：`.docs/schema.md` 中学习记录的数据模型设计
- **执行步骤**:
  1. 确认学习记录的数据模型是否存在
  2. 如复用 User.learnedWords（`[ObjectId]`），确认字段说明充分（记录已学单词 ID 列表）
  3. 如需独立集合（记录学习次数、日期等），确认字段完整性
  4. 核对是否可支持"已学单词数"和"学习天数统计"两个查询场景
- **预期输出**:
  - 学习记录有明确的数据模型设计
  - User.learnedWords 字段说明清晰，或独立集合定义完整
  - 支持"已学单词计数"查询
- **清理**: 无

### TC-006: 实体关系映射验证
- **类型**: 集成测试
- **关联验收标准**: 主键、外键关系定义清晰
- **前置条件**: Schema 文档中所有实体已定义
- **输入**:
  - 审查对象：实体间引用关系（WordBank ↔ Word ↔ ExtendedMeaning/Collocation ↔ User）
- **执行步骤**:
  1. 确认 Word.wordbankId → WordBank 的引用关系（外键等效）
  2. 确认 Word.extendedMeanings 为 Word 的内嵌子文档（非独立引用）
  3. 确认 Word.collocations 为 Word 的内嵌数组（非独立引用）
  4. 确认 User.learnedWords → Word 的引用关系
  5. 绘制或验证 ER 关系图
- **预期输出**:
  - WordBank 1:N Word（通过 wordbankId）
  - Word 1:N ExtendedMeaning（内嵌子文档）
  - Word 1:N Collocation（内嵌数组）
  - User M:N Word（通过 learnedWords 数组，实际为 M:N 的简化实现）
  - ER 图清晰表达上述关系
- **清理**: 无

### TC-007: 索引策略 — users 集合
- **类型**: 边界测试
- **关联验收标准**: 合理定义索引（唯一索引、查询索引、外键索引）
- **前置条件**: 已读取 ADR §6.3 索引策略
- **输入**:
  - 审查对象：`.docs/schema.md` 中 users 集合的索引定义
- **执行步骤**:
  1. 确认 `phone` 字段标注为唯一索引（unique）
  2. 确认唯一索引标识明确（如 `unique: true`）
  3. 如需邮箱字段，确认 `email` 唯一索引（如适用）
- **预期输出**:
  - `phone` 标注为 unique 索引
  - 索引类型明确标注
- **清理**: 无

### TC-008: 索引策略 — wordbanks 集合
- **类型**: 边界测试
- **关联验收标准**: 合理定义索引
- **前置条件**: 已读取 ADR §6.3 索引策略
- **输入**:
  - 审查对象：`.docs/schema.md` 中 wordbanks 集合的索引定义
- **执行步骤**:
  1. 确认 `name` 字段标注为唯一索引
  2. 确认 slug 字段（如有）的索引定义
- **预期输出**:
  - `name` 标注为 unique 索引
- **清理**: 无

### TC-009: 索引策略 — words 集合
- **类型**: 边界测试
- **关联验收标准**: 合理定义索引（唯一索引、查询索引、外键索引）+ 高频查询字段建有索引
- **前置条件**: 已读取 ADR §6.3 索引策略
- **输入**:
  - 审查对象：`.docs/schema.md` 中 words 集合的索引定义
- **执行步骤**:
  1. 确认 `word` 字段有普通索引（搜索按单词名查询）
  2. 确认 `wordbankId` 字段有普通索引（按词库查询单词列表）
  3. 确认 `coreMeaning` 字段有文本索引（全文搜索，MongoDB text index）
- **预期输出**:
  - `word` — normal index
  - `wordbankId` — normal index
  - `coreMeaning` — text index（MongoDB）
- **清理**: 无

### TC-010: 命名规范一致性检查
- **类型**: 边界测试
- **关联验收标准**: 表名和字段名命名统一规范（snake_case 或 camelCase，与 ORM 约定一致）
- **前置条件**: Schema 文档中所有字段名已定义
- **输入**:
  - 审查对象：所有集合名和字段名的命名风格
- **执行步骤**:
  1. 检查集合名命名风格（如 `users` / `wordbanks` / `words` 等）
  2. 检查字段名是否统一使用 camelCase（Mongoose 默认惯例）
  3. 检查是否存在混合命名（如 `wordbank_id` 与 `wordbankId` 混用）
  4. 检查内嵌子文档字段命名是否与外层一致
- **预期输出**:
  - 集合名：小写复数（users, wordbanks, words）
  - 字段名：统一 camelCase（与 Mongoose/JavaScript 惯例一致）
  - 无 snake_case 与 camelCase 混用
- **清理**: 无

### TC-011: 字段类型与 ADR 技术选型一致性
- **类型**: 集成测试
- **关联验收标准**: Schema 设计经 ADR 确认的技术栈复核
- **前置条件**: 已读取 ADR §3（技术选型：MongoDB + Mongoose）
- **输入**:
  - 审查对象：`.docs/schema.md` 中各字段的类型定义与 MongoDB/Mongoose 能力对齐
- **执行步骤**:
  1. 确认 ID 字段使用 ObjectId（MongoDB 原生类型）
  2. 确认内嵌子文档（extendedMeanings）使用 Mongoose Subdocument 而非独立集合引用
  3. 确认数组字段（collocations, learnedWords）使用 MongoDB 原生数组类型
  4. 确认日期字段使用 Date 类型（非字符串时间戳）
  5. 确认无 SQL 特有概念混入（如 VARCHAR(n)、AUTO_INCREMENT、JOIN 表）
- **预期输出**:
  - 所有字段类型与 MongoDB/Mongoose 能力一致
  - 无 SQL 特有概念（VARCHAR、AUTO_INCREMENT 等）
  - 嵌套文档使用 Mongoose Subdocument Schema
- **清理**: 无

### TC-012: 字段必填与默认值完整性
- **类型**: 边界测试
- **关联验收标准**: 每张表明确字段名、类型、长度、是否可空、默认值、注释
- **前置条件**: Schema 文档中所有字段已定义
- **输入**:
  - 审查对象：每个实体的字段约束定义
- **执行步骤**:
  1. 检查 User 模型：哪些字段 required（如 phone、passwordHash、role），role 默认值是否为 'user'
  2. 检查 WordBank 模型：name 是否 required，gradient 是否有默认渐变色
  3. 检查 Word 模型：word、wordbankId、coreMeaning 是否 required
  4. 检查 createdAt 字段是否有默认值（`default: Date.now` 或 Mongoose timestamps）
  5. 检查可选字段（如 phonetic、collocations）是否标记为 optional
- **预期输出**:
  - 每个字段明确 required / optional
  - `role` 默认值为 `'user'`
  - `createdAt` 有自动时间戳机制（Mongoose timestamps 或 default）
  - 可选字段有明确标注
- **清理**: 无

### TC-013: physicalImageType 枚举值边界验证
- **类型**: 边界测试
- **关联验收标准**: 每张表明确字段类型、约束
- **前置条件**: 已读取 PRD BR-06 规则（8 种物理意象类型）
- **输入**:
  - 审查对象：Word 模型中 physicalImageType 的约束定义
- **执行步骤**:
  1. 确认 physicalImageType 有 enum 约束
  2. 枚举值完整列表是否为：flow, grasp, break, bear, drive, light, leverage, yield（共 8 种）
  3. 确认不允许未定义的枚举值
- **预期输出**:
  - `physicalImageType` 有 `enum: ['flow', 'grasp', 'break', 'bear', 'drive', 'light', 'leverage', 'yield']` 约束
  - 共 8 种，无遗漏，无多余
- **清理**: 无

### TC-014: 手机号格式约束验证
- **类型**: 边界测试
- **关联验收标准**: 合理定义索引（唯一索引）
- **前置条件**: 已读取 PRD BR-01 规则（手机号格式 `^1[3-9]\d{9}$`）
- **输入**:
  - 审查对象：User.phone 字段的约束定义
- **执行步骤**:
  1. 确认 phone 字段有格式验证规则（如 Mongoose `match` 或 `validate`）
  2. 确认正则表达式为 `^1[3-9]\d{9}$`
  3. 确认 phone 字段类型为 String（非 Number，避免前导零丢失）
- **预期输出**:
  - `phone` 类型为 String
  - 有正则格式验证 `^1[3-9]\d{9}$`
  - 标注 unique 索引
- **清理**: 无

### TC-015: Schema 文档完整性与可执行性
- **类型**: 功能测试
- **关联验收标准**: 输出完整的 ER 图或表结构文档（存放在 `.docs/schema.md` 或 `server/docs/schema.md`）
- **前置条件**: Schema 文档已编写完成
- **输入**:
  - 审查对象：Schema 文档的文件位置和内容结构
- **执行步骤**:
  1. 确认文档文件存在（`.docs/schema.md` 或 `server/docs/schema.md`）
  2. 确认文档包含 ER 关系图（ASCII 图、Mermaid 图、或结构化关系描述）
  3. 确认文档包含每张表/集合的完整字段清单（表格形式）
  4. 确认文档包含索引策略汇总表
  5. 确认文档开头标注关联的 PRD 和 ADR 版本
- **预期输出**:
  - 文档文件存在于指定路径
  - ER 图可读、关系清晰
  - 每张集合有完整字段表（字段名 | 类型 | 必填 | 默认值 | 说明）
  - 索引策略独立汇总
- **清理**: 无

### TC-016: 无遗漏 PRD 业务实体检查
- **类型**: 功能测试
- **关联验收标准**: 覆盖所有 PRD 中涉及的业务实体
- **前置条件**: 完整阅读 PRD §5 所有功能描述
- **输入**:
  - PRD 中出现的实体候选 vs Schema 文档中已定义的实体
- **执行步骤**:
  1. 从 PRD 中提取所有名词性实体：
     - 用户 (User) — F-05 用户认证
     - 词库 (WordBank) — F-04 词库浏览
     - 单词 (Word) — F-03 单词详情
     - 引申义 (ExtendedMeaning) — F-03 单词详情（内嵌于 Word）
     - 搭配 (Collocation) — F-03 单词详情（内嵌于 Word）
     - 学习记录 — F-06 个人中心（PRD 提及已学单词数）
     - 收藏 (UserFavorites) — §9.3 后续版本规划 P1
  2. 逐一核查 Schema 文档是否覆盖
  3. 确认内嵌实体（ExtendedMeaning、Collocation）是否作为子文档明确定义
- **预期输出**:
  - 7 个业务实体全部有对应设计（独立集合或内嵌子文档）
  - 不遗漏也不冗余（无 PRD 未涉及的实体）
- **清理**: 无

---

## 测试用例统计

| 类型 | 数量 | 编号 |
|------|------|------|
| 功能测试 | 5 | TC-001, TC-002, TC-003, TC-004, TC-005, TC-015, TC-016 |
| 边界测试 | 6 | TC-007, TC-008, TC-009, TC-010, TC-012, TC-013, TC-014 |
| 集成测试 | 2 | TC-006, TC-011 |
| 异常测试 | 0 | 本阶段为文档设计，无运行时异常场景 |
| **合计** | **16** | |

> **注意**：本任务为纯设计阶段，测试用例是文档评审检查清单。部分用例（TC-007~009 索引、TC-012 约束、TC-013 枚举、TC-014 手机号格式）可直接转化为 Task 1.1（数据库建表与 Migration）的自动化测试。
