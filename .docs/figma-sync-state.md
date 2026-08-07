# Figma 同步状态

| 属性 | 值 |
|------|-----|
| 同步结果 | HAS-GAP-DESIGN |
| 最后同步 | 2026-08-07 |
| 已处理计划 | app-whimsical-tiger.md, app-piped-torvalds.md, immutable-snacking-bear.md, app-app-ai-apple-linear-notion-inter-24-bubbly-hamming.md, app-app-apple-linear-notion-inter-24px-gentle-axolotl.md, app-flickering-alpaca.md |
| 新需求标识 | training-backend, figma-sync-20260807 |

## 差异摘要

### GAP-UI（已直接实施）

| # | 计划 | 描述 | 涉及文件 |
|---|------|------|---------|
| 1 | app-flickering-alpaca | 数据层：types.ts 移除 `Word.libraryId`、WordLibrary 新增 `wordIds: string[]` | `client/src/data/types.ts` |
| 2 | app-flickering-alpaca | 适配器：adaptWord 移除 libraryId 映射、adaptWordbank 新增 wordIds 占位 | `client/src/api/adapters.ts` |
| 3 | app-flickering-alpaca | API 类型：CreateWordInput/ai 函数 wordbankId 改可选 | `client/src/api/words.ts`, `client/src/api/ai.ts` |
| 4 | app-flickering-alpaca | admin/words.vue：移除"所属词库"选择器及相关逻辑 | `client/src/pages/admin/words.vue` |
| 5 | app-flickering-alpaca | home.vue：词库名称查找从 FK 改为 wordIds 匹配 | `client/src/pages/home/home.vue` |
| 6 | app-flickering-alpaca | word-detail.vue：词库名称查找从 fetchWordbankById 改为 wordIds 匹配 | `client/src/pages/word-detail/word-detail.vue` |
| 7 | app-flickering-alpaca | admin/libraries.vue：新增"管理单词"功能（已收录单词管理 + 全库搜索添加） | `client/src/pages/admin/libraries.vue` |
| 8 | app-flickering-alpaca | libraries.vue：wordCount 显示改为 wordIds.length | `client/src/pages/libraries/libraries.vue` |

### GAP-DESIGN（PRD/ADR 已更新，待 ai-master 接管开发）

| # | 功能模块 | 前端现状 | 后端缺失 | 建议方案 |
|---|---------|---------|---------|---------|
| 1 | 短句翻译训练（中译英） | `pages/quiz/quiz.vue`（完整答题 UI）+ `data/quizEngine.ts`（20 条硬编码 mock 题目 + 本地判分引擎） | 无 quiz 路由/控制器/服务/模型 | 新建 QuizResult 模型 + 题目池管理 API + 判分 API（slug: `training-backend`） |
| 2 | 英译中训练入口 | `pages/training/training.vue`（disabled + "Coming Soon" 占位） | 同上 | #1 完成后扩展题目池 en2zh 方向 |
| 3 | Word ↔ WordLibrary M:N 关系（后端） | `client/src/api/adapters.ts` 中 `adaptWordbank` 的 `wordIds: []` 占位 | WordBank Model 缺 `wordIds` 字段；无管理 wordIds 的 API 端点 | WordBank Model 新增 `wordIds: ObjectId[]` + PUT/DELETE `/api/v1/wordbanks/:id/words`（slug: `figma-sync-20260807`） |

### GAP-DIFF（已随对应分类处理）

（无）

## 同步步骤完成状态
- [x] 阶段 1：差异发现与分类
- [x] 阶段 2：PRD + ADR 更新
- [x] 阶段 3：代码实施（app-flickering-alpaca 前端已完成；training-backend 待 ai-master）
- [x] 阶段 4：文档收尾 + 构建验证
