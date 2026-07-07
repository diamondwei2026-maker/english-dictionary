# Task 0.2: 数据库 Schema 设计

| 属性 | 值 |
|------|-----|
| ID | 0.2 |
| 状态 | ✅ done |
| 优先级 | P0 |
| 依赖 | Task 0.1 |
| 阶段 | 阶段0: 架构决策与项目初始化 |
| 预估工时 | 2-3 小时 |

## 描述

基于 PRD 业务模型和 ADR 数据库选型，设计完整的数据库 Schema。需要覆盖用户、词库、单词、引申义、搭配、收藏、学习记录等核心实体，明确表结构、字段类型、约束和索引。

## 验收标准

- [ ] 输出完整的 ER 图或表结构文档（存放在 `.docs/schema.md` 或 `server/docs/schema.md`）
- [ ] 覆盖所有 PRD 中涉及的业务实体：用户、词库、单词、引申义、搭配、学习记录、收藏
- [ ] 每张表明确字段名、类型、长度、是否可空、默认值、注释
- [ ] 主键、外键关系定义清晰
- [ ] 合理定义索引（唯一索引、查询索引、外键索引）
- [ ] 表名和字段名命名统一规范（snake_case 或 camelCase，与 ORM 约定一致）
- [ ] Schema 设计经 ADR 确认的技术栈复核（如 PostgreSQL 的 UUID 类型 vs VARCHAR）

## 子任务

### SUB-0.2.1: 核心实体建模
- **描述**: 梳理 PRD 中所有业务实体及其关系，输出 ER 草图
- **验收标准**:
  - [ ] 识别所有核心实体（users, wordbanks, words, extended_meanings, collocations, user_favorites, learning_records）
  - [ ] 明确实体间关系（1:1, 1:N, N:M）

### SUB-0.2.2: 表结构详细设计
- **描述**: 为每张表定义完整字段清单，包括类型、约束、默认值
- **验收标准**:
  - [ ] 每张表字段清单完整，注释清晰
  - [ ] 外键关系映射正确

### SUB-0.2.3: 索引策略设计
- **描述**: 分析核心查询场景，设计合理的索引策略
- **验收标准**:
  - [ ] 高频查询字段建有索引（如 wordbanks.slug, words.name, users.phone）
  - [ ] 唯一约束定义正确（如 users.phone, users.email）
  - [ ] 复合索引按需要定义（如 word_id + meaning_order）

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
