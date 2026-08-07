# Task 3.1: 英译中方向扩展

| 属性 | 值 |
|------|-----|
| ID | 3.1 |
| 状态 | pending |
| 优先级 | P1 |
| 依赖 | Task 2.1（前端 API 集成完成后才能解锁） |
| 被依赖 | 无 |
| 阶段 | 阶段3: 英译中 (后续) |
| 预估工时 | 2-3 小时 |
| 所属集成 Gate | [阶段 3 集成验收清单](../../../tasks.md) |

## 描述

解锁 `client/src/pages/training/training.vue` 中「短句英译中」卡片（当前为禁用态 + "即将上线" 标签）。需要：
1. 为 en2zh 方向补充至少 10 道预置题目（种子脚本）
2. 启用服务端 en2zh 判分逻辑（`quizEngine.ts` 中已预留字符 bigram 重合度算法但未实际启用，需在 `quiz.service.ts` 中实现）
3. 前端 training.vue 解除 disabled 态和相关 CSS（opacity 0.55、cursor default、「即将上线」标签）

en2zh 判分说明：用户给出中文翻译，与参考答案做字符 bigram 重合度比较（参考 `quizEngine.ts` 的 `direction === 'en2zh'` 分支）。

## 验收标准

- [ ] 种子数据新增至少 10 道 en2zh 方向题目（英文短句 → 中文翻译）
- [ ] `quiz.service.ts` 的 `judgeAnswer()` 支持 direction=en2zh（字符 bigram 重合度算法）
- [ ] `client/src/pages/training/training.vue` 解除「短句英译中」的禁用态：
  - 移除 opacity 0.55
  - cursor 改为 pointer
  - 移除「即将上线」标签
  - 点击跳转到答题页（direction='en2zh'）
- [ ] 英译中答题流程正常：获取题目 → 输入中文翻译 → 提交判分 → 查看反馈 → 完成页
- [ ] 前后端 en2zh 方向逻辑串通，不报错
- [ ] 训练首页两个卡片入口均可正常工作

## 子任务

### SUB-3.1.1: 补充 en2zh 题目种子数据
- **描述**: 创建 10+ 道英译中题目（英文短句 → 要求用户输入中文翻译），写入种子脚本。题目可参考现有中译英题目的英文原文（如 flow/submit/impact 相关的英文句子）。
- **验收标准**:
  - [ ] 至少 10 道 en2zh 方向题目写入 QuizQuestion 集合
  - [ ] 题目字段完整（prompt 为英文，reference 为中文参考译文）

### SUB-3.1.2: 启用服务端 en2zh 判分
- **描述**: 在 `quiz.service.ts` 的 `judgeAnswer()` 中实现 en2zh 方向的字符 bigram 重合度判分。逻辑已在 `quizEngine.ts` 中预留（取两个字符串的去重字符集合，计算重合比例 × 100）。
- **验收标准**:
  - [ ] direction=en2zh 时使用 bigram 重合度算法
  - [ ] 判分结果包含 score/correct/matched/missing/analysis

### SUB-3.1.3: 前端 training.vue 解锁
- **描述**: 移除「短句英译中」卡片的禁用 UI 和逻辑限制，使其与「短句中译英」卡片一样可点击。同时验证 quiz.vue 的 en2zh 方向答题体验。
- **验收标准**:
  - [ ] 卡片不再有 opacity 0.55 和 disabled cursor
  - [ ] 移除「即将上线」标签
  - [ ] 点击进入答题页，direction=en2zh
  - [ ] 答题流程完整可用

## 关联文件

- 测试用例：[test-cases.md](./test-cases.md)
- Coding Prompt：[coding-prompt.md](./coding-prompt.md)
