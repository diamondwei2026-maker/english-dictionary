# Task 1.1: 实现 Quiz 核心服务与判分引擎

| 属性 | 值 |
|------|-----|
| ID | 1.1 |
| 状态 | done |
| 优先级 | P0 |
| 依赖 | Task 0.2（需要可查询的题目数据） |
| 被依赖 | Task 1.2（控制器和路由依赖服务层） |
| 阶段 | 阶段1: Quiz API |
| 预估工时 | 3-4 小时 |
| 所属集成 Gate | [阶段 1 集成验收清单](../../../tasks.md) |

## 描述

实现 `server/src/services/quiz.service.ts`，包含训练模块的全部核心业务逻辑。关键实现要点：

1. **题目生成** (`generateQuiz`)：从 QuizQuestion 集合中按策略选取 10 题。逻辑参考前端 `quizEngine.ts` 的 `generateQuiz()` — 有 wordId 时优先取该单词题目，不足用同词库补齐，再无则从通用池随机。新增"已做过的题 24h 内避免重复"以提升训练体验。
2. **判分引擎** (`judgeAnswer`)：将前端 `judgeAnswer()` 的算法（关键词命中率 70% + LCS 序列相似度 30%）迁移到 Node.js 服务端。保持算法完全一致（normalize/words/variantMatches/lcs），用纯函数实现。
3. **答题历史** (`getHistory`)：按 userId 查询 QuizAttempt 集合，支持分页，按 submittedAt 降序。
4. **训练统计** (`getStats`)：聚合查询 — 总题数、正确率、最近 7 天每日答题数趋势。

服务层需遵循现有 ADR 的分层架构约定（Service → Controller → Route）。

## 验收标准

- [ ] `server/src/services/quiz.service.ts` 创建，导出 `generateQuiz`, `judgeAnswer`, `getHistory`, `getStats` 四个函数
- [ ] `generateQuiz(direction, wordId?, userId?)`: 返回 10 道 QuizQuestion；有 wordId 优先该单词题目；有 userId 时排除 24h 内已答题目
- [ ] `judgeAnswer(questionId, userInput)`: 纯函数实现，算分逻辑与前端 `quizEngine.ts` 的 `judgeAnswer()` 一致（关键词 70% + LCS 30%，≥70 判对）
- [ ] `judgeAnswer` 在 userId 存在时自动保存 QuizAttempt 记录
- [ ] `getHistory(userId, page?, limit?)`: 返回答题历史，含分页元数据
- [ ] `getStats(userId)`: 返回 totalQuestions, correctRate, recentTrend (最近 7 天)
- [ ] 服务层不依赖 Express request/response 对象（纯业务逻辑）
- [ ] `server/src/services/index.ts` 导出 quiz 相关函数
- [ ] 通过 `tsc --noEmit` 编译检查

## 子任务

### SUB-1.1.1: 实现 generateQuiz
- **描述**: 题目生成逻辑。从 QuizQuestion 集合查询，优先 wordId → 同词库 → 通用池随机洗牌；已登录用户排除 24h 内已答题目（通过 QuizAttempt 查重）。返回最多 10 题且方向匹配。
- **验收标准**:
  - [ ] 传入 direction=zh2en 返回 zh2en 方向题目
  - [ ] 传入 wordId 返回优先该单词的题目
  - [ ] 传入 userId 排除 24h 内已答题目
  - [ ] 题目不足 10 道时返回可用的最大数量

### SUB-1.1.2: 实现 judgeAnswer（判分引擎）
- **描述**: 服务端判分逻辑。实现 normalize/words/variantMatches/lcs 四个纯函数，得分计算与前端一致（关键词 70% + LCS 30%，≥70 判对）。判分后如 userId 存在，保存 QuizAttempt 记录。
- **验收标准**:
  - [ ] 关键词命中率计算正确
  - [ ] LCS 序列相似度计算正确
  - [ ] 空输入返回 score=0
  - [ ] 已登录用户自动保存 QuizAttempt

### SUB-1.1.3: 实现 getHistory + getStats
- **描述**: 答题历史查询（按 userId，支持分页）+ 训练统计聚合
- **验收标准**:
  - [ ] getHistory 返回按提交时间降序排列的记录
  - [ ] getHistory 支持 page/limit 分页
  - [ ] getStats 返回 totalQuestions, correctRate, recentTrend[7]

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
