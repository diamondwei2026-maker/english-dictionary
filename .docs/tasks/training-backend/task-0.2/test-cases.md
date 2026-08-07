# 测试用例 — Task 0.2: 种子数据 — 迁移 20 条 mock 题目入库

---

## TC-001: 种子脚本成功写入 20 条题目
- **类型**: 功能测试
- **关联验收标准**: AC-1 (seedQuizQuestions), AC-2 (20 条题目写入), AC-6 (npm run seed 可执行)
- **前置条件**: MongoDB 已连接，WordBank/Word 种子数据已就绪
- **输入**: 执行 `npm run seed`
- **执行步骤**:
  1. 确保 MongoDB 中已有 WordBank 和 Word 数据（由现有种子逻辑插入）
  2. 执行 `npm run seed`
  3. 查询 `QuizQuestion` 集合中文档总数
- **预期输出**:
  - 种子脚本执行成功，控制台输出类似 "Inserted 20 quiz questions"
  - `QuizQuestion.countDocuments()` = 20
- **清理**: 重新执行 `npm run seed` 恢复初始状态

---

## TC-002: 题目字段映射正确
- **类型**: 功能测试
- **关联验收标准**: AC-3 (字段映射: prompt, hint, direction, reference, keywords, analysis)
- **前置条件**: 种子数据已写入
- **输入**: 查询第 1 条题目 (prompt = "健康的现金流是企业的生命线。")
- **执行步骤**:
  1. 执行 `npm run seed`
  2. 查询 `QuizQuestion.findOne({ prompt: "健康的现金流是企业的生命线。" })`
  3. 验证各字段
- **预期输出**:
  - `direction` = `"zh2en"`
  - `hint` = `"flow · 资金沿渠道持续移动"`
  - `reference` = `"Healthy cash flow is the lifeblood of a business."`
  - `keywords` = `["healthy", "cash", "flow", "lifeblood"]`
  - `analysis` = `"现金周转"的"转"容易让人想到 turn；这里英语锚定的是液体沿渠道持续移动的意象，因此用 cash flow。`
  - `createdAt` / `updatedAt` 为有效时间戳
- **清理**: 无

---

## TC-003: 题目关联 wordId（同名字符串匹配）
- **类型**: 功能测试
- **关联验收标准**: AC-4 (按 wordId 字符串匹配 word 集合，自动关联 wordId 和 wordbankId)
- **前置条件**: Word 集合中存在 word="flow" 的文档
- **输入**: 查询 wordId="w1" (对应 flow) 的题目
- **执行步骤**:
  1. 执行 `npm run seed`
  2. 查询 `QuizQuestion.find({})`，筛选 prompt 中包含 "flow" 关键意象的题目（q1, q2, q3 的 wordId 均为 w1）
  3. 对每条题目，验证 `wordId` 字段为非空 ObjectId
  4. 用该 ObjectId 查询 Word 集合，验证 `word` 字段为 "flow"
  5. 验证 `wordbankId` 字段与 flow 所属 WordBank 的 `_id` 一致
- **预期输出**:
  - q1/q2/q3 的 `wordId` 指向 Word 集合中 `word="flow"` 的文档
  - q1/q2/q3 的 `wordbankId` 指向正确的 WordBank 文档
- **清理**: 无

---

## TC-004: 题目关联所有 8 个单词
- **类型**: 功能测试
- **关联验收标准**: AC-4 (全部 wordId 正确关联)
- **前置条件**: Word 集合中存在 w1-w8 对应的单词: flow, submit, impact, framework, evidence, assess, joint, build
- **输入**: 验证所有 20 条题目
- **执行步骤**:
  1. 执行 `npm run seed`
  2. 查询 `QuizQuestion.find({}).populate('wordId')`
  3. 按 wordId 分组统计
- **预期输出**:
  - 8 个唯一的 `wordId`，分别对应 flow(3题), submit(3题), impact(3题), framework(3题), evidence(2题), assess(2题), joint(2题), build(2题)
  - 所有 `wordId` 均可 populate 出有效的 Word 文档
- **清理**: 无

---

## TC-005: upsert 去重 — 重复执行不产生重复记录
- **类型**: 边界测试
- **关联验收标准**: AC-5 (upsert 逻辑，重复执行不创建重复题目)
- **前置条件**: 种子数据已写入一次
- **输入**: 再次执行 `npm run seed`
- **执行步骤**:
  1. 第一次执行 `npm run seed`，记录 `QuizQuestion.countDocuments()` 为 N
  2. 第二次执行 `npm run seed`
  3. 查询 `QuizQuestion.countDocuments()`
  4. 查询 `QuizQuestion.find({}).sort({ prompt: 1 })` 验证无重复 prompt+reference 组合
- **预期输出**:
  - `QuizQuestion.countDocuments()` 仍为 N（20，如果 insertion 前的 clear 不清除 QuizQuestion）
  - 或 `QuizQuestion.countDocuments()` 仍为 20（如果 clear 逻辑清除了 quiz 数据后重新插入）
  - 关键：不存在 prompt + reference 完全相同的两条记录
- **清理**: 无

---

## TC-006: 种子执行顺序正确 — quiz 在 wordbank/word 之后
- **类型**: 功能测试
- **关联验收标准**: AC-6 (种子脚本纳入主流程，在 wordbank/word 种子之后执行)
- **前置条件**: MongoDB 为空
- **输入**: 执行 `npm run seed`
- **执行步骤**:
  1. 清空所有集合
  2. 执行 `npm run seed`，捕获控制台日志
  3. 验证日志输出顺序
- **预期输出**:
  - 日志顺序: "Seeding wordbanks..." → "Seeding words..." → (quiz seed 的日志)
  - Quiz 种子在 Word 种子之后执行
  - 如果 quiz 种子在 Word 之前执行，部分题目的 wordId 关联会失败
- **清理**: 无

---

## TC-007: 所有 20 题均为 zh2en 方向
- **类型**: 功能测试
- **关联验收标准**: AC-3 (方向字段), 额外要求 (预留 en2zh 方向能力)
- **前置条件**: 种子数据已写入
- **输入**: 查询 direction 分布
- **执行步骤**:
  1. 执行 `npm run seed`
  2. 查询 `QuizQuestion.distinct('direction')`
  3. 查询 `QuizQuestion.countDocuments({ direction: 'en2zh' })`
- **预期输出**:
  - `distinct('direction')` 返回 `["zh2en"]`（当前种子仅 zh2en）
  - `countDocuments({ direction: 'en2zh' })` = 0
  - 但数据模型支持 `en2zh`，为后续扩展预留
- **清理**: 无

---

## TC-008: 种子数据中 keyword 数组非空且为英文
- **类型**: 边界测试
- **关联验收标准**: AC-3 (keywords 字段)
- **前置条件**: 种子数据已写入
- **输入**: 验证所有 20 条题目
- **执行步骤**:
  1. 执行 `npm run seed`
  2. 查询 `QuizQuestion.find({})`
  3. 逐条验证 `keywords` 字段
- **预期输出**:
  - 每条题目的 `keywords` 为 `string[]`
  - `keywords.length` ≥ 1
  - 所有 keyword 均为英文小写单词（无中文）
- **清理**: 无

---

## I-001: 端到端 — 种子数据经 QuizQuestion Model 写入后可被查询 🔴
- **类型**: 集成测试（跨 Task）
- **关联依赖**: Task 0.2 ← 依赖 Task 0.1 (QuizQuestion Model)
- **前置条件**: Task 0.1 的 QuizQuestion Model 定义已完成并导出
- **集成链路**: QuizQuestion Model (Task 0.1) → `seedQuizQuestions()` 使用 Model 写入 (Task 0.2) → MongoDB query 验证
- **输入**: 执行 `npm run seed` 后通过 Mongoose 查询
- **执行步骤**:
  1. 导入 `QuizQuestion` Model: `import { QuizQuestion } from '../models/index.js'`
  2. 执行 `npm run seed`
  3. 在 Node.js 脚本中执行 `QuizQuestion.find({}).lean()`
  4. 验证返回数据包含所有 Mongoose Schema 定义的字段
  5. 验证 `QuizQuestion` Model 的 `direction` 枚举约束生效（非法 direction 无法插入）
- **预期输出**:
  - `QuizQuestion.find({})` 返回 20 条文档
  - 每条文档类型为 `IQuizQuestion`，包含 `_id`, `prompt`, `hint`, `direction`, `reference`, `keywords`, `analysis`, `wordId`, `wordbankId`, `createdAt`, `updatedAt`
  - 尝试插入 `direction="invalid"` 的文档 → Mongoose ValidationError
- **清理**: 无

---

## I-002: 端到端 — wordId 关联 Word 集合的真实数据 🔴
- **类型**: 集成测试（跨 Task）
- **关联依赖**: Task 0.2 ← 依赖 Task 0.1 (QuizQuestion) + 现有 Word 种子逻辑
- **前置条件**: Word 集合中已存在 flow/submit/impact/framework/evidence/assess/joint/build 文档（由现有 seed 逻辑插入）
- **集成链路**: mockWord 数据 (现有种子逻辑) → Word 集合 → `seedQuizQuestions()` 按 wordId 字符串匹配 → QuizQuestion.wordId
- **输入**: 执行 `npm run seed` 后，对每条 quiz 题目 populate wordId
- **执行步骤**:
  1. 执行 `npm run seed`
  2. 查询 `QuizQuestion.find({}).populate('wordId').lean()`
  3. 对每条记录，验证 `wordId` 字段指向的 Word 文档的 `word` 字段值与 mockQuizItems 中 wordId 的预期映射一致
  4. 验证 `wordbankId` 指向的 WordBank 文档与对应 Word 的 `wordbankId` 一致
- **预期输出**:
  - 20 条题目全部 `wordId` 非 null
  - populate 出的 Word 文档包含正确的 `word` 字段（如 w1→"flow", w2→"submit", ...）
  - 如果某个 wN 在 Word 集合中找不到匹配，该题目 `wordId` 为 null（不阻塞种子执行）
- **清理**: 无

---

## 阶段 E2E 场景（供 ai-master 阶段集成 Gate 使用）

> 以下场景在阶段 0 内所有 Task (0.1 + 0.2) 完成后，由 ai-master 执行端到端验证。

### E2E-01: 数据模型 + 种子数据完整链路
- **涉及 Task**: Task 0.1, Task 0.2
- **用户故事**: 作为开发者，我希望执行 `npm run seed` 后，QuizQuestion 和 QuizAttempt 集合中存在可查询的结构化数据，且题目与已有单词正确关联。
- **执行步骤**:
  1. 清空 MongoDB 所有集合
  2. 执行 `npm run seed`
  3. 查询 `QuizQuestion.countDocuments()` — 来自 Task 0.2
  4. 查询 `QuizQuestion.findOne({}).lean()` 验证字段结构 — 来自 Task 0.1
  5. 对任意一条题目执行 populate wordId，验证关联 — 来自 Task 0.1 + 0.2
  6. 尝试插入非法 direction → 验证 Mongoose 枚举校验 — 来自 Task 0.1
  7. 再次 `npm run seed` → 验证 upsert 去重 — 来自 Task 0.2
- **通过标准**:
  - [ ] `QuizQuestion.countDocuments()` = 20
  - [ ] 字段结构符合 QuizQuestionSchema 定义
  - [ ] `wordId` populate 成功，指向正确 Word 文档
  - [ ] 非法 direction 插入被 Mongoose 拒绝
  - [ ] 重复执行 seed 不产生重复题目
- **失败时涉及模块**: QuizQuestion Model, seed/index.ts, Word Model, MongoDB 连接

### E2E-02: 种子脚本异常容错
- **涉及 Task**: Task 0.1, Task 0.2
- **用户故事**: 作为开发者，当 seed 过程中 Word 集合为空（wordbank/word 种子跳过或失败）时，quiz 种子应优雅降级（wordId 为 null），不阻塞整体流程。
- **执行步骤**:
  1. 清空 MongoDB 所有集合
  2. **不**插入任何 Word 数据
  3. 直接执行 `seedQuizQuestions()`（独立调用）
  4. 验证 20 条题目成功写入
  5. 验证所有 wordId 和 wordbankId 为 null
- **通过标准**:
  - [ ] 20 条题目成功写入，无异常抛出
  - [ ] `wordId` / `wordbankId` 均为 null
  - [ ] `npm run seed` 整体 exit code 为 0
- **失败时涉及模块**: seed/index.ts, QuizQuestion Model, Word Model
