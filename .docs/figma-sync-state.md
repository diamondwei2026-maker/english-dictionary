# Figma 同步状态

| 属性 | 值 |
|------|-----|
| 同步结果 | HAS-GAP-DESIGN |
| 最后同步 | 2026-08-06 |
| 已处理计划 | app-whimsical-tiger.md, app-piped-torvalds.md, immutable-snacking-bear.md, app-app-ai-apple-linear-notion-inter-24-bubbly-hamming.md, app-app-apple-linear-notion-inter-24px-gentle-axolotl.md |
| 新需求标识 | training-backend |

## 差异摘要

### GAP-UI（已直接实施）
（无 — 所有 Figma 原型 UI 均已在 uni-app 项目中实现）

### GAP-DESIGN（PRD/ADR 已更新，待 ai-master 接管开发）

| # | 功能模块 | 前端现状 | 后端缺失 | 建议方案 |
|---|---------|---------|---------|---------|
| 1 | 短句翻译训练（中译英） | `pages/quiz/quiz.vue`（完整答题 UI）+ `data/quizEngine.ts`（20 条硬编码 mock 题目 + 本地判分引擎） | 无 quiz 路由/控制器/服务/模型；无答题记录持久化；API 层无 quiz 模块 | 新建 QuizResult 模型 + 题目池管理 API + 判分 API；前端 quizEngine.ts 改造对接真实 API |
| 2 | 英译中训练入口 | `pages/training/training.vue`（disabled + "Coming Soon" 占位） | 同上，依赖 #1 基础设施就绪后解除 disabled | #1 完成后，扩展题目池 en2zh 方向，解除前端 disabled |

### GAP-DIFF（已随对应分类处理）

（无）

## 同步步骤完成状态
- [x] 阶段 1：差异发现与分类
- [x] 阶段 2：PRD + ADR 更新（训练模块后端 API 需 ADR 决策）
- [ ] 阶段 3：代码实施（GAP-DESIGN 项需 ai-master 接管开发）
- [x] 阶段 4：文档收尾 + 构建验证

## 本次同步说明

经 4 维度差异分析（数据层/UI 层/路由状态 API 层/实现完整度），NotesView 和社区笔记功能均已在前端和后端完整实现。但**短句翻译训练模块**存在后端盲区：

- 前端 `quiz.vue` + `training.vue` + `quizEngine.ts` 已完整实现 UI 和交互逻辑
- `quizEngine.ts` 明确标注"纯前端判分引擎（本地模拟版）"、"后续接 Supabase/LLM 时只需替换"
- 但 `server/src/` 中**完全不存在** quiz/training 相关的路由、控制器、服务、模型
- 答题结果页面离开即丢失，无持久化

标记为 **HAS-GAP-DESIGN**（而非 NO-GAPS），需 ai-master 重新规划，生成后端开发 Task（slug: `training-backend`）。
