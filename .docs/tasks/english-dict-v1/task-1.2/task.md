# Task 1.2: ORM 模型定义

| 属性 | 值 |
|------|-----|
| ID | 1.2 |
| 状态 | done |
| 优先级 | P0 |
| 依赖 | Task 1.1 |
| 阶段 | 阶段1: 数据层 |
| 预估工时 | 2-3 小时 |

## 描述

在代码中定义所有数据库表的 ORM 模型（Model/Entity），包含字段映射、关联关系、类型定义。确保 TypeScript 类型安全，模型与服务层接口对清晰。

## 验收标准

- [ ] 所有核心表对应的 ORM 模型定义完成：User、WordBank、Word、ExtendedMeaning、Collocation
- [ ] 功能表模型定义完成：UserFavorite、LearningRecord
- [ ] 模型间关联关系正确（如 WordBank hasMany Words）
- [ ] TypeScript 类型推导正常，无 `any` 类型
- [ ] 模型文件的目录结构合理（如 `server/src/models/` 下每个模型一个文件）
- [ ] 模型可被 import 且通过编译

## 子任务

### SUB-1.2.1: 核心实体模型定义
- **描述**: 定义 User、WordBank、Word 三个核心模型的 ORM 映射
- **验收标准**:
  - [ ] User 模型包含 id, phone, email, password_hash, nickname, avatar, role, created_at, updated_at
  - [ ] WordBank 模型包含 id, name, slug, description, cover_image, is_public, created_by, word_count, created_at, updated_at
  - [ ] Word 模型包含 id, name, phonetic, physical_image, physical_image_svg, core_meaning, wordbank_id, created_at, updated_at

### SUB-1.2.2: 关联实体模型定义
- **描述**: 定义 ExtendedMeaning、Collocation 等关联模型的 ORM 映射
- **验收标准**:
  - [ ] ExtendedMeaning 模型包含 meaning_order, logic_evolution, extended_meaning, pos, example_en, example_cn
  - [ ] Collocation 模型包含 phrase, meaning_cn, example_en, example_cn

### SUB-1.2.3: 功能实体模型定义
- **描述**: 定义 UserFavorite、LearningRecord 等功能模型的 ORM 映射
- **验收标准**:
  - [ ] UserFavorite 关联 user_id + word_id，唯一约束
  - [ ] LearningRecord 关联 user_id + word_id，包含学习次数和时间

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
