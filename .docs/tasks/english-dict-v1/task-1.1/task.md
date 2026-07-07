# Task 1.1: 数据库表创建与 Migration

| 属性 | 值 |
|------|-----|
| ID | 1.1 |
| 状态 | done |
| 优先级 | P0 |
| 依赖 | Task 0.2 |
| 阶段 | 阶段1: 数据层 |
| 预估工时 | 2-3 小时 |

## 描述

根据 Task 0.2 设计的 Schema，使用 ORM（Prisma / Drizzle / TypeORM，以 ADR 决策为准）编写数据库 Migration 脚本，在开发数据库中创建所有表结构。需要确保 Migration 可回滚、可重复执行。

## 验收标准

- [ ] 数据库连接配置完成（`.env` 中的 DATABASE_URL 等）
- [ ] 首版 Migration 脚本覆盖所有核心表：users、wordbanks、words、extended_meanings、collocations
- [ ] Migration 脚本覆盖功能表：user_favorites、learning_records
- [ ] `npm run db:migrate` 或等效命令可成功执行 Migration
- [ ] `npm run db:rollback` 或等效命令可回滚 Migration
- [ ] 所有外键约束正确建立
- [ ] 数据库表结构与 Schema 设计文档一致

## 子任务

### SUB-1.1.1: 配置数据库连接
- **描述**: 在 `server/.env` 中配置数据库连接字符串，编写数据库连接模块
- **验收标准**:
  - [ ] 开发数据库（SQLite/PostgreSQL）可连接
  - [ ] 连接字符串通过环境变量管理，不硬编码

### SUB-1.1.2: 编写 Migration 脚本
- **描述**: 按 Schema 设计编写 Migration，包含所有表、字段、约束
- **验收标准**:
  - [ ] 所有表成功创建
  - [ ] 外键关系生效
  - [ ] 默认值和 NOT NULL 约束正确

### SUB-1.1.3: 验证 Migration 完整性
- **描述**: 执行 Migration → 检查数据库 → 回滚 → 再执行，确保幂等
- **验收标准**:
  - [ ] Migration 可重复执行不报错
  - [ ] 回滚后数据库恢复 Migration 前状态

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
