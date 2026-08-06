---
name: figma-sync
description: >
  当 Figma 原型有更新时，自动检测差异，将更新内容增量迁移到实际 uni-app 项目中，
  并同步更新 PRD、ADR 等文档。触发短语包括"Figma原型有更新"、"检查Figma差异"、
  "同步Figma"、"把Figma的改动迁移过来"、"检查原型和实际项目的差异"等。
  该技能保证：差异发现无遗漏、ADR 合规、已有业务不受影响、
  文档与代码一致、公共组件/方法/样式自动提取消除重复。
---

# Figma Sync — Figma 原型增量同步

## 🌐 语言要求（CRITICAL）

**与用户的所有交流必须使用中文。** 包括但不限于：差异报告、ADR 问题、
PRD 更新内容、实施进度、验证结果、最终摘要。代码和代码注释可使用英文。

---

将 Figma 原型（`figma/` React 应用）的新增功能增量迁移到实际项目
（`client/` uni-app Vue 3 + `server/` Express），并同步更新所有相关文档。

## ⚠️ 核心原则

1. **PRD 先于代码** — PRD 更新确认后，才能开始写代码
2. **ADR 合规** — 涉及模型/API 变更的设计变更必须先更新 ADR
3. **增量不破坏** — 修改已有文件时只做增量 Edit，不重写已有业务逻辑
4. **文档代码一致** — 收尾阶段逐项核对 PRD 描述与最终实现
5. **提取消除重复** — 实施完成后扫描公共组件/方法/样式并提取

---

## 与 frontend-refactor 的区别

| 维度 | frontend-refactor | figma-sync |
|------|-------------------|------------|
| 场景 | 全量技术栈迁移 | 增量功能迁移 |
| 源-目标 | 源项目整体重建为目标技术栈 | Figma 的新增内容合并到已有项目 |
| 产出 | 全新的目标项目 | 对已有项目的增量修改 + 文档同步 |
| 规模 | 30+ 文件全量重写 | 2~5 文件增量修改 |
| 文档 | 可选 | 强制（PRD + ADR 同步更新） |

---

## 四阶段流程

### 阶段 1 — 差异发现与分类

**触发源**：`figma/plans/` 目录下的 `.md` 文件（Figma 原型更新说明）。

**Step 1.1 — 读取 Figma 原型更新内容**

读取最新 plan 文件，解析每个功能模块，标注：
- 涉及的数据模型变更（types.ts 新增/修改字段）
- 涉及的 UI 组件变更（新增/修改组件、新增路由）
- 涉及的状态管理变更（useState → store）

**Step 1.2 — 执行差异分析（4 个并行 Agent）**

| Agent | 对比维度 | 产出 |
|-------|---------|------|
| A — 数据层 | `figma/.../types.ts` + `figma/.../mockData.ts` ↔ `client/src/data/types.ts` + `server/src/models/` | 类型/模型差异表 |
| B — UI 层 | `figma/.../components/` ↔ `client/src/pages/` + `client/src/components/` | 组件差异表（新增/修改/缺失） |
| C — 路由/状态/API | `figma/.../App.tsx` ↔ `client/src/pages.json` + `client/src/store/` + `server/src/routes/` | 路由/状态/API 差异表 |
| D — 实现完整度 | `client/src/` 代码实现质量 ↔ `server/src/` 后端覆盖 | mock/stub/占位/API 缺失检测 |

**Agent A 具体检查项**：
- `figma/.../types.ts` 中每个 interface 的字段 vs `client/src/data/types.ts` 同名字段
- `figma/.../mockData.ts` 中新增的 mock 数据结构 vs `server/src/models/` 对应 Schema
- `client/src/api/` 中是否已有对应 API 函数

**Agent B 具体检查项**：
- `figma/.../components/*.tsx` 每个文件 vs `client/src/pages/*/*.vue` 按文件名映射
- 每个 Figma 组件的 inline style 值 → 是否在对应 .vue 的 SCSS 中匹配（px→rpx 换算）
- 每个 Figma 组件的交互事件（onClick、onChange、onSubmit）→ 是否在 .vue 中实现

**Agent C 具体检查项**：
- `figma/.../App.tsx` 中 `ViewState` 的所有 `name` 值 → `client/src/pages.json` 的 pages 列表
- `figma/.../App.tsx` 中 `useState` 变量 → `client/src/store/` 对应状态
- `figma/.../App.tsx` 中调用的 API 函数 → `server/src/routes/` 对应端点

**Agent D 具体检查项** — 实现完整度（堵住"文件存在但功能 mock"的盲区）：

Agent D 的核心任务是判断一个功能是否 **真正实现**（而不仅仅是文件存在）。检查四个维度：

**D1 — Mock 数据检测**：
- 扫描 `client/src/` 中 `.ts`/`.vue` 文件，搜索以下信号：
  - 硬编码大数组赋值（如 `const mockQuizItems: QuizItem[] = [`）
  - `setTimeout(() => {...}, N)` 用于模拟 API 响应延迟
  - 注释标记：`本地模拟版`、`mock`、`local only`、`纯前端`、`后续接`
- 命中任意信号 → 确认该功能在 `server/src/` 是否有对应实现（grep 功能关键词）
  - 后端有对应 API → **GAP-UI**（前端已 mock 但可对接真实 API）
  - 后端无对应 API → **GAP-DESIGN**（需要新建后端 + 前端对接改造）

**D2 — API 对接完整性**：
- 对 figma plan 中描述的每个功能模块，反向检查：
  - 前端是否有对应的 `client/src/api/<module>.ts` 模块？
  - 前端页面是否 `import` 了该 API 模块并实际调用？
  - 后端 `server/src/routes/` 是否有对应路由注册？
- 判定矩阵：
  - Figma 功能 → 前端无 UI → 不是本 skill 范围（可能未开始实施）
  - Figma 功能 → 前端有 UI → 无 `api/` 调用 → **GAP-UI**（前端使用 mock/本地数据）
  - Figma 功能 → 前端有 UI → 有 `api/` 调用 → 后端无路由 → **GAP-DESIGN**
  - Figma 功能 → 前端有 UI → 有 `api/` 调用 → 后端有路由 → ✅ 已完整实现

**D3 — 前端 stub/placeholder 检测**：
- 扫描以下信号：
  - 禁用态 UI：`disabled`、`opacity: 0.XX`、`cursor: default`、`pointer-events: none`
  - 占位文案：`即将上线`、`敬请期待`、`coming soon`、`TODO`、`FIXME`
  - 无事件绑定：组件存在但缺少 `@click` / `@tap` 等交互
- Figma plan 描述为完整功能但前端标记为占位 → **GAP-UI**

**D4 — 脚本/基础设施可用性**：
- 检查 `server/src/seed/`、`server/scripts/` 中的脚本 `import`/`require` 路径指向的文件是否存在
- 检查 `docker-compose.yml`、`Dockerfile` 等基础设施文件引用的路径是否有效
- 引用不存在 → **GAP-DIFF**（基础设施缺陷）

**Agent D 差异汇总**：

```
Agent D 发现 = D1(mock) + D2(API缺失) + D3(占位) + D4(基础设施)
  → 合并去重
  → 按以下规则分类：

  发现 mock 数据 + 后端有对应 API → GAP-UI（前端待对接，纯前端工作）
  发现 mock 数据 + 后端无对应 API → GAP-DESIGN（需新建后端 + 前端对接）
  发现 stub/占位 + Figma 描述为完整功能 → GAP-UI
  发现 import 路径不存在 → GAP-DIFF
  全部通过 → 无新增差异（此维度）
```

**Step 1.3 — 差异汇总分类（合并 4 个 Agent 输出）**

将 Agent A/B/C/D 四个维度的差异清单合并，按功能模块去重后统一分类。

> 注意：同一功能可能在多个 Agent 中都有发现。例如训练模块：Agent B 发现文件存在且样式匹配，Agent D 发现 quizEngine 使用 mock 数据 — 以 **Agent D 的结论为准**（实现不完整），合并后定为 GAP-DESIGN。合并优先级：GAP-DESIGN > GAP-UI > GAP-DIFF。同一功能取最高严重等级。

```
═══════════════════════════════════════════════════════════════
                      Figma 原型差异报告
═══════════════════════════════════════════════════════════════

🔴 GAP-UI（实现遗漏 — 后端就绪，前端缺失）
  ─────────────────────────────────────────
  1. 收藏页面              FavoritesView.tsx  →  无 pages/favorites/
  2. 详情页收藏按钮         WordDetailView.tsx:128-151 → word-detail.vue 缺失
  3. 个人中心收藏入口        ProfileView.tsx:184-191 → profile.vue 缺失

🔴 GAP-DESIGN（设计变更 — 需要 ADR+PRD 决策）
  ─────────────────────────────────────────
  4. 社区笔记公开可见        WordDetailView.tsx:296-478 → 当前仅登录可见
  5. 笔记点赞功能           Heart + likedBy  → 后端无此模型
  6. 笔记作者名显示          authorName → Note 模型无此字段

🟡 GAP-DIFF（实现偏差 — 两边都有但值不同）
  ─────────────────────────────────────────
  7. Note 类型字段差异       likedBy:string[] → client Note 接口无此字段
═══════════════════════════════════════════════════════════════

GAP-UI: 3 项 — 可直接执行（纯前端补课）
GAP-DESIGN: 3 项 — 需先 ADR 决策
GAP-DIFF: 1 项 — 随 GAP-DESIGN 同步修复
```

**🔴 提交差异报告给用户并等待确认。** 用户可能会说"社区笔记先不做"等。

---

### 阶段 2 — ADR 对齐 + PRD 更新 + 迁移方案

**Step 2.1 — ADR 交叉验证**

对每个 `GAP-DESIGN` 项检查 ADR 覆盖情况：

| GAP-DESIGN | 需检查的 ADR 章节 | 覆盖？ | 动作 |
|-----------|-----------------|:---:|------|
| 社区笔记公开可见 | server.md §6.2 Note Schema, §5.2 笔记 API | 未覆盖 | 提出 ADR 更新项 |
| 笔记点赞功能 | server.md §6.2 Note Schema likedBy 字段 | 未覆盖 | 提出 ADR 更新项 |
| 笔记作者名显示 | server.md §6.2 — 通过 populate 不必冗余存储 | 需确认 | 提出 ADR 决策问题 |

对未覆盖项，输出 ADR 决策问题清单让用户确认：

```
### 需确认的 ADR 决策

1. Note 模型是否新增 likedBy 字段？
   → A: 内嵌 ObjectId[]（与 User.learnedWords 模式一致）
   → B: 独立 NoteLike 关联模型（与 UserFavorite 模式一致）
   → 建议: A — 点赞是笔记附属属性，无独立查询需求

2. 社区笔记是否对未登录用户可见？
   → A: 是 — GET /api/v1/notes/public 无需认证
   → B: 否 — 保持现有 authMiddleware
   → 建议: A — Figma 原型设计意图是"社区化"

3. 笔记排序规则？
   → A: 按 likedBy.length 降序（Figma 原型）
   → B: 按更新时间降序（当前实现）
   → 建议: A — 对齐原型，社区笔记以热度和质量排序
```

**🔴 用户确认 ADR 决策后，进入 PRD 更新。**

**Step 2.2 — 🔴 PRD 增量更新（不可跳过）**

> PRD 是代码实现的唯一需求来源。PRD 滞后会导致代码实现与需求文档不一致。
> **此步骤必须在任何代码写入之前完成并确认。**

**Step 2.2.1 — 判定 PRD 更新范围**

从阶段 1 的差异清单出发，逐项判定 PRD 各章节需要更新的内容。

使用 `references/prd-update-template.md` 中的完整检查清单，逐章逐条判定。

**判定逻辑**：

```
差异项 → PRD 章节影响分析:

  "收藏功能 UI 缺失" →
    §5.1 功能清单: 新增 F-10 "我的收藏"
    §5.2 功能详细说明: 新增 F-10 完整条目（前置条件、流程、异常处理）
    §4.1 核心用户旅程: 新增"收藏单词"旅程
    §4.2 用户故事: 新增 US-15 "作为用户，我希望收藏单词以便复习"
    §6.1 业务规则: 新增 BR-13 "收藏切换"
    §6.2 状态流转: 路由图新增 favorites 节点
    §7.1 验收标准: 新增 AC-19~AC-20
    §9.2→§9.3: 收藏从"本期不包含"移至"已完成"

  "社区笔记+点赞" →
    §5.1 功能清单: F-03 "单词详情页"描述修改
    §5.2 F-03: 重写笔记区描述（我的笔记→社区笔记，新增Tab/点赞/排序）
    §4.1 核心用户旅程: 在"每日学词"旅程中补充社区笔记交互
    §4.2 用户故事: 新增 US-16 "社区笔记浏览" + US-17 "笔记点赞"
    §6.1 业务规则: 新增 BR-14 "社区笔记可见性" + BR-15 "点赞切换"
    §6.2 状态流转: 更新笔记区访问规则
    §7.1 验收标准: 新增 AC-21~AC-24
    §9.4→§9.3: "笔记增强"从后续规划移至已完成
```

**Step 2.2.2 — PRD 逐章修改执行**

按 `references/prd-update-template.md` 中的章节顺序，对每个需要更新的章节执行 Edit。

**PRD 修改规则**：

| 规则 | 说明 |
|------|------|
| 新增条目 | 编号递增，不覆盖已有编号 |
| 修改已有条目 | 仅改变化的段落，保留原始结构和措辞风格 |
| 版本号 | `v1.x → v1.y`，最后更新日期改为当前日期 |
| 归档已完成项 | §9.2 "本期不包含" → §9.3 "已完成"，补充实现说明 |
| 验收标准编号连续 | 新增 AC 接续当前最大编号 |

**Step 2.2.3 — ADR 同步更新**（如涉及架构变更）

对确认的 ADR 决策，更新对应 ADR 文件：

```
server.md:
  §6.2 Note Schema: 新增 likedBy: [ObjectId]
  §5.2 核心接口: 新增 GET /notes/public, POST /notes/:id/like
  §6.3 索引策略: 如需要新增索引

client.md:
  §1 功能覆盖表: 新增社区笔记行；更新收藏行（去"缺页面"标记）
  §3.5 页面结构: 新增 favorites 页面
  §8 风险: 移除"收藏缺页面"风险项
```

**🔴 PRD+ADR 更新完成后，提交变更摘要给用户并等待确认。**

**Step 2.3 — 迁移映射生成**

对每个 `GAP-UI` 项产出精确映射：

```
| # | Figma 源 | 目标 | 类型 | 关键转换 |
|---|---------|------|:---:|---------|
| 1 | FavoritesView.tsx:1-100 | pages/favorites/favorites.vue | 🆕新建 | ViewState→pages.json, mockWords→fetchFavorites API |
| 2 | WordDetailView.tsx:119-151 | pages/word-detail/word-detail.vue | 📝修改 | 添加收藏按钮: lucide Bookmark→SVG组件, onClick→@click |
| 3 | ProfileView.tsx:171-194 | pages/profile/profile.vue | 📝修改 | 添加收藏入口: MenuRow替换为共用组件 |
```

**Step 2.4 — 技术映射规则加载**

从 `references/mapping-rules.md` 加载当前项目的已验证映射规则：

| 映射维度 | Figma (React) | 目标 (uni-app Vue 3) |
|---------|---------------|---------------------|
| 组件模型 | React 函数组件 + props | Vue SFC + `<script setup>` + `defineProps` |
| 样式 | inline `style={{}}` (px) | scoped SCSS (rpx = px × 2) |
| 图标 | `lucide-react` 组件 | 内联 SVG 组件（优先）/ iconfont / PNG |
| 路由 | `ViewState` discriminated union + `setView` | `pages.json` + `uni.navigateTo` |
| 状态 | `useState` in `App.tsx` | `store/user.ts` reactive + 页面级 `ref` |
| 数据 | `mockData.ts` 直接 import | REST API (`client/src/api/` + `adapters.ts`) |

**Step 2.5 — 执行顺序编排**

```
依赖 DAG:
  types.ts 扩展          ← 无依赖                         [Layer 0]
  api/notes.ts 扩展      ← 依赖 types.ts                   [Layer 1]
  BookmarkIcon.vue       ← 无依赖                         [Layer 1]
  favorites.vue          ← 依赖 api/favorites + types      [Layer 2]
  word-detail.vue (按钮) ← 依赖 BookmarkIcon               [Layer 2]
  word-detail.vue (笔记) ← 依赖 api/notes + types          [Layer 2]
  profile.vue (入口)     ← 依赖 MenuRow + BookmarkIcon      [Layer 2]
  pages.json             ← 依赖 favorites.vue 存在          [Layer 3]
  server/ Note Model     ← 依赖 ADR 确认                   [Layer S]
  server/ Service/Router ← 依赖 Model                       [Layer S+1]
```

**🔴 提交迁移方案给用户并等待确认。**

---

### 阶段 3 — 增量实施

**Step 3.1 — 新建文件**

对每个新建文件（新页面/新组件），严格遵循：
- DOM 结构与 Figma 源文件一致（元素嵌套、兄弟顺序）
- CSS 精确值映射（px→rpx×2，源行号注释：`/* Phase1(src): <文件名>:<行号> — <px值> → <rpx值> */`）
- Props → `defineProps`，Events → `defineEmits`，路由跳转 → `uni.navigateTo`
- 图标：用内联 SVG 组件替代 `lucide-react`
- 数据：用 API 函数调用替代 `mockData` 直接 import

**Step 3.2 — 修改已有文件**

- 使用 `Edit` 工具做精确插入或替换
- **纯增量修改**：新增 slot、新增区块、新增 import、新增 SCSS 块
- **不重写已有逻辑**：不删除已有 `v-if`、不改变已有事件处理器签名
- 每次 Edit 后验证文件完整性

**Step 3.3 — 后端同步**（GAP-DESIGN 项，ADR 确认后）

- Model 字段扩展：`Edit` 添加新字段到 Schema
- Service 新增函数：追加到已有文件末尾
- Controller 新增导出：追加到已有文件末尾
- Route 新增端点：在现有 router 文件中追加

**Step 3.4 — 路由/导出注册**

- `pages.json`：按字母序插入新路由条目
- `api/index.ts`：追加新导出
- `server/src/routes/index.ts`：如需要追加

**Step 3.5 — 🔴 公共组件/方法/样式提取**

实施完成后，必须执行提取扫描。检测规则见 `references/extraction-checklist.md`。

提取优先级：

| 优先级 | 检测模式 | 检测方法 | 阈值 | 提取为 |
|--------|---------|---------|------|--------|
| 🔴 | 内联 SVG path 重复 | `grep "d=\"M19 21l"` 等 | ≥2 处 | `components/icons/<IconName>.vue` |
| 🔴 | 硬编码 Toast 消息 | `grep "uni.showToast.*加载失败"` | ≥2 处 | `utils/helpers.ts` TOAST 常量 |
| 🔴 | 页面卡片不复用 | 手写 word-row+meaning+badge 结构 | ≥1 处 | 改用共享组件 + slot |
| 🟡 | 菜单行模式重复 | 同一文件 icon+label+desc+chevron | ≥3 处 | `components/MenuRow.vue` |

**提取约束**：
- 提取公共组件时，已有页面的 SCSS 作用域变化（`scoped` 属性）需一并迁移
- 提取为时，原组件添加 slot 不改变已有使用者的渲染结果（slot 是 opt-in）
- 提取后必须立即 build 验证，确认所有引用文件编译通过

**Step 3.6 — 验证**
```bash
cd client && pnpm run build:h5    # 前端 H5 构建 → 必须 DONE Build complete
npx tsc --noEmit                    # 服务端 TypeScript → 必须零错误
```

---

### 阶段 4 — 文档收尾

**Step 4.1 — PRD 终版确认**

回读阶段 2 更新的每个 PRD 章节，与最终代码实现逐项核对：
- 验收标准编号连续、所有新增 AC 均有对应实现
- 功能清单与实际 pages 列表对应
- 业务规则编号连续

**Step 4.2 — ADR 终版确认**

- server.md/client.md 中更新的章节与最终代码一致

**Step 4.3 — 变更摘要输出**

```markdown
## Figma 同步完成

### 同步的功能
- ✅ <功能1> — <涉及文件数> 文件
- ✅ <功能2> — <涉及文件数> 文件

### PRD 变更
- 新增: US-XX~US-XX / F-XX / BR-XX~BR-XX / AC-XX~AC-XX
- 修改: §5.2 F-XX <描述>
- 归档: <功能名> 从 §9.X 移至 §9.3

### ADR 变更
- server.md §6.2: <变更描述>
- client.md §1: <变更描述>

### 代码变更
- 🆕 新建: <文件清单>
- 📝 修改: <文件清单>
- 📦 后端: <文件清单>

### 公共提取
- 🧩 新建: <组件清单>
- 📝 修改: <已提取到的共享组件>

### 构建验证
- client H5 build: ✅
- server tsc: ✅

### 集成状态
- 合约文件: .docs/figma-sync-state.md ✅ 已写入
- 同步结果: <GAP-UI-ONLY / HAS-GAP-DESIGN / NO-GAPS>
```

**Step 4.4 — 写入集成状态文件（ai-master 合约）** 🆕

> 此步骤是 figma-sync 与 ai-master 的集成合约。
> figma-sync 写入状态文件；ai-master 读取状态文件并据此决定下一步路由。
> figma-sync 本身不需要知道 ai-master 的存在——只需要忠实地写入合约文件。

执行时机：阶段 4 所有文档收尾工作完成后，作为最后一个操作执行。

1. 判定同步结果：
   - 差异清单中只有 GAP-UI（无 GAP-DESIGN）→ `GAP-UI-ONLY`
   - 差异清单中有任何 GAP-DESIGN → `HAS-GAP-DESIGN`
   - 差异清单完全为空 → `NO-GAPS`

2. 如果是 `HAS-GAP-DESIGN`：
   - 生成新需求标识（slug）：格式为 `figma-sync-YYYYMMDD`
     （如本轮执行日期为 2026-08-06，则 slug = `figma-sync-20260806`）
   - 如果 PRD 中已有需求标识，优先使用 PRD 中的标识

3. 收集已处理的计划文件列表：
   - 从阶段 1 读取的所有 plan 文件名

4. 写入 `.docs/figma-sync-state.md`，结构如下：

```markdown
# Figma 同步状态

| 属性 | 值 |
|------|-----|
| 同步结果 | <GAP-UI-ONLY / HAS-GAP-DESIGN / NO-GAPS> |
| 最后同步 | <当前日期时间> |
| 已处理计划 | <本次处理的 plan 文件名，逗号分隔> |
| 新需求标识 | <slug>（HAS-GAP-DESIGN 时必填；其他分支填 —） |

## 差异摘要

### GAP-UI（已直接实施）
| # | 描述 | 涉及文件 |
|---|------|---------|
| ... | ... | ... |

### GAP-DESIGN（PRD/ADR 已更新，待 ai-master 接管开发）
| # | 描述 | ADR 变更 | PRD 变更 |
|---|------|---------|---------|
| ... | ... | ... | ... |

### GAP-DIFF（已随对应分类处理）
| # | 描述 | 处理方式 | 涉及分类 |
|---|------|---------|---------|
| ... | ... | ... | ... |

## 同步步骤完成状态
- [x] 阶段 1：差异发现与分类
- [x] 阶段 2：PRD + ADR 更新
- [x] 阶段 3：代码实施（GAP-UI 项）
- [x] 阶段 4：文档收尾 + 构建验证
```

注意事项：
- 「差异摘要」中的三个子表格直接从阶段 1 的差异报告提取
- GAP-UI 表格的「涉及文件」从阶段 3 的实施记录中提取
- GAP-DESIGN 表格的「ADR 变更」和「PRD 变更」从阶段 2 的更新记录中提取
- GAP-DIFF 表格标注每条属于哪个分类（GAP-UI 或 GAP-DESIGN），以及处理方式
- 「同步步骤完成状态」全部勾选（只有 figma-sync 全部完成才会执行到此步骤）

---

## 参考文件（按需加载）

以下文件按需加载——不要一次性全部读取：

- `references/mapping-rules.md` — Figma React ↔ uni-app Vue 3 已验证技术映射速查表
- `references/extraction-checklist.md` — 公共组件/方法/样式提取检测规则 + 实施模板
- `references/prd-update-template.md` — PRD 逐章修改检查清单（§2.4~§9.4）
