# Task 0.2: 种子数据 — 迁移 20 条 mock 题目入库

| 属性 | 值 |
|------|-----|
| ID | 0.2 |
| 状态 | done |
| 优先级 | P0 |
| 依赖 | Task 0.1（需要 QuizQuestion Model 定义） |
| 被依赖 | Task 1.1（Quiz 服务需要可查询的题目数据） |
| 阶段 | 阶段0: 数据模型+种子 |
| 预估工时 | 1-2 小时 |
| 所属集成 Gate | [阶段 0 集成验收清单](../../../tasks.md) |

## 描述

将 `client/src/data/quizEngine.ts` 中的 `mockQuizItems` 数组（20 条中译英短句题目）迁移为 MongoDB 种子数据。需要在 `server/src/seed/index.ts` 中新增 quiz 种子逻辑，使用 upsert（按 prompt+reference 去重避免重复插入），并在插入后关联 wordId 和 wordbankId（如果对应单词和词库已在数据库中）。

额外要求：预留 en2zh 方向能力，确保数据模型和种子逻辑支持该方向（即使当前种子只写入 zh2en 题目）。

## 验收标准

- [ ] `server/src/seed/` 新增 quiz 种子函数 `seedQuizQuestions()`
- [ ] 20 条题目（从 `quizEngine.ts` `mockQuizItems` 提取）成功写入 MongoDB
- [ ] 每条题目正确映射字段：prompt, hint, direction, reference, keywords, analysis
- [ ] 如果数据库中已有对应单词（按 wordId 字符串匹配 word 集合），自动关联 wordId 和 wordbankId
- [ ] 使用 upsert 逻辑——重复执行种子脚本不会创建重复题目
- [ ] 种子脚本纳入 `server/src/seed/index.ts` 主流程，按顺序在 wordbank/word 种子之后执行
- [ ] `npm run seed` 可正常执行

## 子任务

### SUB-0.2.1: 编写题目种子数据
- **描述**: 从 `client/src/data/quizEngine.ts` 的 `mockQuizItems` 提取 20 条题目数据，创建为种子写入逻辑。使用 upsert（按 prompt 匹配去重）。每条题目需要尽量关联已有单词（如 mock 中 w1=flow, w2=submit, w3=impact 等对应在数据库中的实际单词）。
- **验收标准**:
  - [ ] 20 条题目全部写入 QuizQuestion 集合
  - [ ] 重复执行不产生重复记录

### SUB-0.2.2: 集成到主种子流程
- **描述**: 在 `server/src/seed/index.ts` 中调用 `seedQuizQuestions()`，放在 wordbank/word 种子之后执行（因为 quiz questions 可能引用 word）
- **验收标准**:
  - [ ] `npm run seed` 可执行且成功写入题目
  - [ ] 种子执行顺序正确

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
