---
name: frontend-refactor
description: >
  通用前端重构技能。当用户想要将前端项目从一个框架或技术栈迁移、重构、重写或转换到另一个时使用
  ——即使用户没有使用"重构"这个精确词。触发短语包括"把这个项目改成小程序"、
  "从 React 改成 Vue"、"重构前端代码"、"转换技术栈"、"migrate to Next.js"、
  "rewrite in Svelte"、"把这套代码改成 Taro"、"根据这个原型新建项目"、
  "基于这个代码重构一个 XX 项目"，或者任何需要用不同框架/技术栈重建前端代码库并
  保留相同 UI 和交互的请求。该技能保证 UI、交互、页面导航和所有按钮行为达到 95% 以上还原度。
---

# Frontend Refactor — 通用前端重构

## 🌐 语言要求（CRITICAL）

**与用户的所有交流必须使用中文。** 包括但不限于：分析报告、迁移蓝图、
进度汇报、确认提示、错误说明、最终交付报告。代码和代码注释可使用英文，
但面向用户的文字说明一律用中文。Subagent 的 Prompt 可以用英文编写，
但 subagent 产出的面向用户的分析结果应当用中文呈现。

---

将任意前端项目按指定技术栈重建，保留每一个交互、页面流程、视觉细节和条件状态。

## ⚠️ 破坏性操作警告

这个 Skill 会生成**全新的目标项目**。在 Phase 3（代码生成）之前，
必须让用户明确确认 Phase 1 的分析报告和 Phase 2 的迁移蓝图。
绝不跳过这些确认关。

---

## 快速决策树

```
用户说："把 X 项目改成 Y 框架"

1. 源项目是什么技术栈？  → 检测框架 + 构建工具 + 样式系统
2. 目标技术栈是什么？     → 从用户话中提取，或主动询问
3. 源文件 > 30 个？        → 是：多 Agent 并行分析
                            → 否：单 Agent 串行分析
4. 迁移对是否存在？        → 检查 references/migrations/<源>→<目标>.md
                            → 存在：直接加载
                            → 不存在：从零生成迁移规则
4a. 目标是否跨平台框架？    → uni-app / Taro / Flutter / React Native → 加载 cross-platform-pitfalls.md
                           │  🔴 特别关注 NC-14：<text> 默认 display:inline——即使纯 H5 也受影响（不同于其他 NC 陷阱仅限小程序）
                           → 单一 Web 平台 → 跳过
4b. 图标方案是否需要切换？  🆕 → 源用内联 SVG / 图标库（lucide-react 等）
                           → 目标平台不支持 SVG（小程序/RN/nvue）→ 加载 references/icons.md 决策树选择方案
                           → 源=目标且图标方案兼容（纯 Web→Web / iconfont→小程序）→ 跳过
4c. 源项目是否用命令式 DOM 操作管理输入框 focus/blur？ 🆕
                           → `e.target.style.xxx = '...'` / 内联 style 对象切换
                           → 是 → 在 Phase 2 执行 Step 4b（输入框样式模式分类）
                           │      并根据源→目标组合选择处理等级（完整/简化/最小）
                           → 否（CSS class / Tailwind / 组件库统一管理）→ 跳过 Step 4b
4d. 源项目是否包含移动端选择器/下拉交互？ 🆕
                           → 检测命令：grep -rn '<picker\|<select\|Dropdown\|ActionSheet\|Picker\|Combobox' src/
                           → 是 → 在 Phase 1 将这些交互标记为"类别 11: 平台自适应选择"
                           │      在 Phase 2 Step 2.4c 规划自适应组件（Select + Drawer 组合）
                           │      加载 cross-platform-pitfalls.md NC-13 修复模板
                           → 否（无选择器交互）→ 跳过
4e. iconfont TT**F 文件是否完整？** 🆕 🔴 → **仅当目标使用 iconfont 方案时检查**
                           → 检测命令：`wc -c < src/static/fonts/iconfont.ttf`
                           → < 1KB（特别是 38 字节）→ 字体文件损坏，仅保留 TTF 头无字形数据
                           │  → 执行本地生成流水线（icons.md §4b）重建
                           │  → 构建通过但图标空白是经典故障模式（PM-M5）
                           → ≥ 3KB → 正常
4f. 源项目 iconfont 是否存在渲染模式 bugs？ 🆕
                           → 检测命令：
                           │  `grep -rn ':class=\"icon\"' src/components/ src/pages/ --include=\"*.vue\"`
                           │  `grep -rn \"'&#x\" src/ --include=\"*.vue\"`
                           → 命中 → Pattern B (:class 绑 unicode) / Pattern C/D (JS 中 HTML entity)
                           │  → 这些在字体损坏时不可见，字体修复后会暴露（PM-M6）
                           │  → Phase 3 必须修复为正确的渲染模式
                           → 零命中 → 跳过
4g. Phase 3 是否使用并行 Agent 生成页面？ 🆕 🔴
                           → 是（项目 > 5 个页面且使用 Agent 并行生成）→ Phase 2 必须产出
                           │  `design-values.json`（步骤 6c — 逐文件 CSS 精确值提取）。
                           │  该文件是 Phase 3 每个 Agent Prompt §5b 的唯一数据来源——
                           │  没有它，Agent 就会自行"估算" CSS 值，导致系统性数值偏差。
                           │  同时 Phase 2 必须产出差异化参数 JSON（步骤 7a-输出增强）。
                           → 否（项目 ≤ 5 个页面，串行生成，LLM 可直接逐行比对源文件）→ 跳过
4h. 目标项目是否有共享组件（≥ 3 页面复用同一 UI 模式）？ 🆕 🔴
                           → 是 → Phase 2 Layer 2 生成前，必须执行共享组件交叉验证矩阵
                           │  （步骤 6c-4）——逐实例比对源文件精确 CSS 值，确定哪些属性
                           │  硬编码、哪些作为 props、默认值取什么。
                           │  🔴 交叉验证必须覆盖三个维度：
                           │    1. CSS 属性值（步骤 6c-4）
                           │    2. 基础 CSS 属性差异化 — padding/font-size/border-radius（§7a-补充3）
                           │    3. 固定子元素 DOM 位置（§7a-补充2）— 标题区等非 slot 子元素
                           │       在不同实例中的源位置是否一致
                           │  禁止不做交叉验证就启动 Layer 2 Agent——默认值错误的共享组件
                           │  会污染所有引用它的页面。
                           → 否（无共享组件）→ 跳过
4i. 源项目的样式系统是什么？ 🆕 🔴
                           → 内联 style 对象（React `style={{}}` / Vue `:style=""` / 原生 DOM style）
                           │  → Phase 2 必须产出 **pre-generated CSS scoped blocks**（详见 §2.8）。
                           │    这是防止 Agent "估算" CSS 值的唯一手段——将 CSS 精确值直接
                           │    写为目标框架的 scoped style 块，Agent 只需粘贴。
                           │    没有此步骤 → Agent 看到精确值表但优先 "估算" → 系统性 CSS 偏差。
                           │    两次迁移实战均验证：即便 design-values.json 存在，
                           │    Agent 仍然用近似 SCSS 变量替代精确值。
                           → CSS Modules / Tailwind / 组件库样式
                           │  → 跳过 CSS block pre-generation。样式由 class 引用，
                           │    Agent 只需复制 class 名。
4j. Phase 3 Layer 3-4 页面是否需要并行 Agent？ 🆕 🔴
                           → 是 → Layer 3 的每个 Agent 完成后**必须立即**运行逐文件验证脚本
                           │  （verify-page-values.cjs），偏差 > 2rpx 立即修复。
                           │  **不在 Layer 3 通过前启动 Layer 4。**
                           → 否（串行 LLM 生成）→ 跳过逐文件验证，Phase 4 统一审计
4k. 源项目是否对接了服务端？ 🆕
                           → 检测命令：
                             grep -rn "fetch\|axios\|request\|api\.\|baseURL\|httpClient\|useQuery\|useSWR\|useMutation" src/ --include="*.ts" --include="*.tsx" --include="*.js"
                             grep -rn "Authorization\|Bearer\|x-access-token\|Cookie.*token\|getStorageSync.*token" src/
                           → 命中 > 0 → 源项目有真实 API 对接
                           → 零命中 → 源项目为纯静态/纯 mock 项目 → 跳过 API 迁移流程
                           有真实 API 对接时，必须向用户确认三个问题：
                           ① 目标项目是否继续对接同一个后端服务？
                              → 是 → 保留 API 基础 URL 配置，仅迁移客户端代码
                              → 否 → 需要新的 API 基础 URL
                           ② 是否需要 mock 模式让目标项目可独立运行？
                              → 是 → Phase 3 同时生成 mock 数据 + 真实 API 服务文件，通过环境变量切换
                              → 否 → 仅生成真实 API 服务文件
                           ③ 认证方式在目标平台是否需要适配？
                              → Web → 小程序：Cookie 不支持 → 改为 Token Header 方式
                              → Web → App：检查安全存储方案
                              → 纯 Web → Web：通常直接保留
4.5 🆕 目标项目放哪里？       → 🔴 Phase 1 检测技术栈后立即询问用户目标项目根目录路径
                            → 用户指定 → 写入 .target-project-path（后续不可更改）
                            → 用户未指定 → 询问：① 放在源项目内部（子目录） ② 放在源项目外部（默认兄弟目录）
                            → 🔴 禁止不询问就直接创建目标项目目录
5. 执行 Phase 1 → 确认 → Phase 2 → 确认 → Phase 3 → Step 3.4 自检 → Phase 4 → Phase 5
5a. 🔴 入口文件生成规则：Phase 3 Layer 5-6 的入口文件（index.html、main.ts、
    vite.config.ts、pages.json、package.json）必须使用 `references/frameworks/<目标>.md`
    中的已验证模板，**禁止 Agent 自由发挥**。这些文件的正确写法无法从源项目推导——
    只能从已验证的框架模板获取。本次 react→uniapp 迁移中 5 个文件位置/内容错误
    导致 ~90 分钟白屏试错。详见 SKILL.md Phase 3 Step 3.4。
```

---

## 四阶段流程

每个阶段产出具体交付物。**禁止跳过任何阶段。** 在用户明确确认当前阶段的产出物之前，
绝不进入下一阶段。

> 🔴 第五阶段（Phase 5）在 Phase 4 全部审计通过后执行——它不产生用户可见的交付物，
> 而是将本次迁移的试错经验持久化到参考文件中，防止后续迁移重复踩坑。

### Phase 1 — 深度分析（产出: 分析报告 + 交互清单）

目标：彻底理解源项目，确保没有任何遗漏。

**Step 1.1 — 检测技术栈**

读取 `package.json`、配置文件（`vite.config.*`、`next.config.*`、`tsconfig.json`），
扫描文件扩展名来确定：

- 框架（React / Vue 2/3 / Angular / Svelte / Next.js / Nuxt / 小程序 / ...）
- 语言（TypeScript / JavaScript）
- 样式系统（Tailwind / CSS Modules / styled-components / Emotion / Sass / inline-style / ...）
- 路由方案（react-router / vue-router / Next.js App Router / useState 手动路由 / ...）
- 状态管理（Redux / Zustand / Pinia / Vuex / Context / 无状态库 / ...）
- UI 组件库（MUI / Radix / Ant Design / Element Plus / shadcn / 自定义 / 无）
- 构建工具（Vite / Webpack / Turbopack）

**Step 1.2 — 理解源框架的编码模式**

读取 `references/frameworks/<源框架>.md` —— 每个框架指南说明如何识别该框架中的
组件、页面、数据流、路由和样式模式。如果该文件不存在，直接从源码分析。

**Step 1.3 — 执行分析**

对于 **> 30 个源文件**的项目，按职责域分派子 Agent，每个 Agent 处理约 5-15 个文件：

| Agent | 职责范围 | 典型文件 |
|-------|---------|---------|
| A1 | 页面与视图 | `*View.tsx`、`*Page.tsx`、页面级组件 |
| A2 | 数据层 | `types.ts`、`mockData.ts`、API service、store |
| A3 | 入口与路由 | `App.tsx`、`main.tsx`、router 配置、布局组件 |
| A4 | 基础 UI 与样式 | `ui/*.tsx`、全局 CSS、主题配置、共享组件 |

对于 **≤ 30 个文件**的项目，串行分析 —— 逐个读取源文件，逐步构建报告。

**每个分析子 Agent 必须产出：**
1. 组件树及 props 接口定义
2. 每个交互元素（onClick、onChange、onSubmit、onFocus 等）—— 编号列表
3. 每个条件渲染分支（角色检查、认证状态、空/加载中/错误状态）
4. 组件的状态机（存在哪些状态、什么触发状态转换）

**Step 1.4 — 合并四份产出文档**

读取 `references/phase1-analysis.md` 获取完整格式规范。产出：

1. **骨架图谱** — 带文件职责标注的目录树、依赖关系图
2. **交互清单** — 每个交互元素分配唯一 ID、触发器、行为、状态、条件分支。这是 Phase 3 和 Phase 4 的共同契约。
3. **数据流图** — 状态归属、props 传递路径、数据来源、API 调用点
4. **设计 Token** — 提取的色板、间距体系、圆角体系、字体体系、阴影、渐变、特效、🆕 平台默认样式（跨平台迁移时）

**将合并后的报告提交给用户并等待确认。** 用户可能会说"跳过管理后台部分"、
"保留登录流程但要简化"等。根据反馈更新报告后再继续。

### Phase 2 — 迁移映射（产出: 逐文件映射蓝图）

目标：产出一份逐文件映射蓝图，确保代码生成阶段没有任何歧义。

详细说明见 `references/phase2-mapping.md`。

**Step 2.1 — 加载或生成迁移规则**

检查 `references/migrations/<源>→<目标>.md`：
- **存在** → 直接加载；这是经过实战检验的迁移指南
- **不存在** → 从零生成迁移规则：
  1. 读取 `references/frameworks/<目标>.md`（或直接分析目标框架）
  2. 使用 `npx ctx7@latest library <目标框架> "getting started"` 获取最新文档
  3. 推导以下类别的映射规则：组件模型、事件系统、样式系统、路由、状态管理、数据获取

**Step 2.2 — 构建逐文件映射表**

对 Phase 1 中识别出的每个源文件，生成一行映射：

```
| # | 源文件 | 目标文件 | 难度 | 映射说明 |
```

**Step 2.3 — 记录关键映射规则**

六大类别必须逐项明确映射：

| 类别 | 需要回答的问题 |
|------|--------------|
| 组件模型 | `<div>` → `<View>`？Fragment → ？插槽 → ？ |
| 事件系统 | onClick → @click / onTap？事件修饰符？.stop/.prevent？ |
| 样式映射 | 内联 style → CSS Module？Tailwind → ？backdropFilter 支持？ |
| 路由 | useState 路由 → 文件路由？URL 参数？TabBar？ |
| 状态管理 | Context → provide/inject？Redux → Pinia？ |
| 数据获取 | 直接 import → API 调用？Mock → 真实接口？ |

**Step 2.4 — 标记"不可直接映射"的特性**

某些源模式在目标框架中可能没有直接等价物。对每一项：
- 明确标记
- 提出替代方案
- 评估视觉/行为差异程度

**Step 2.4a — 多平台影响评估 🆕**

对于每个设计决策（移除某属性、改变某值、用原生组件替代），在跨平台迁移时必须
构建逐平台影响矩阵——同一决策在 H5 桌面端和小程序端可能有完全相反的后果。
评估产出 H5 条件编译属性清单。单平台迁移使用简化版。详见
`references/phase2-mapping.md` 步骤 5a。

**Step 2.4c — 平台自适应选择器映射 🆕**

> **来源**：2026-07-15 uni-app → React (shadcn/ui) 迁移。迁移后 `<select>` 在移动端
> 仍显示 Web 下拉而非 uni-app `<picker>` 的底部弹出——这是"移动端选择器交互丢失"的典型案例。
> 只要源项目有移动端选择器交互，就必须在 Phase 2 规划自适应组件。

**触发条件**：决策树步骤 4d 命中（源项目包含 `<picker>` / `<select>` / `<Dropdown>` 等选择器）

**处理流程**：

1. **清单编制**：从 Phase 1 交互清单中提取所有"类别 11: 平台自适应选择"交互
2. **数据格式标准化**：统一每个选择器的 `options: {label, value}[]` 格式
3. **组件方案选择**：

   | 目标框架 | 方案 | 已有构建块（检查是否存在） |
   |---------|------|------------------------|
   | React (shadcn/ui) | `AdaptiveSelect` = `useIsMobile()` + `<Select>` + `<Drawer>` | `select.tsx`, `drawer.tsx`, `use-mobile.ts` |
   | React (MUI) | `AdaptiveSelect` = `useMediaQuery` + `<Select>` + `<Drawer>` | `@mui/material` |
   | React (Ant Design) | `AdaptiveSelect` = `useBreakpoint` + `<Select>` + `<Popup>` | `antd` |
   | Vue 3 (Vant) | `AdaptiveSelect` = `<van-action-sheet>` + `<van-dropdown-menu>` | `vant` |
   | Vue 3 (Element Plus) | 自定义 `<AdaptiveSelect>` 组合 `el-select` + 手写 Drawer | `element-plus` |
   | 纯 Web | `matchMedia('(max-width: 767px)')` + 条件渲染 | 无（需手写） |

4. **关键决策记录**：

   ```
   | # | 源文件 | 选择器用途 | 选项数 | 目标组件 | 备注 |
   |---|-------|----------|--------|---------|------|
   | S1 | AdminView.tsx:441 | 词库选择 | N个 | AdaptiveSelect | <select> → AdaptiveSelect |
   | S2 | AdminView.tsx:520 | 词性选择 | 7个 | AdaptiveSelect | 同上 |
   ```

5. **注入 Phase 3 Agent Prompt**：
   - 第六节（复用约束）：如果项目已有 Drawer + Select，强制要求复用
   - 第八节（交互清单）：标注 S1/S2 为"平台自适应选择"，携带完整 options schema
   - 第九节（输出规范）：禁止使用原生 `<select>`，必须用 AdaptiveSelect

**输出**：
- 选择器映射决策表（上述 # 表）
- AdaptiveSelect 组件规格（props interface + 行为描述）
- Phase 3 Layer 2 共享组件列表中追加 `AdaptiveSelect`

**Step 2.5 — 复用分析 🆕**

在逐文件映射完成后，必须进行跨文件复用分析。Phase 3 的每个生成 Agent 只看到
自己的源文件和目标路径——它们不知道其他 Agent 也在生成相同的 header、搜索栏、
空状态。复用分析是打破这个信息壁垒的关键步骤。

分析三个维度：
- **组件复用**：跨页面重复的 UI 模块 → 提取为共享组件
- **样式复用**：跨页面重复的 CSS 属性组合 → 提取为 SCSS 变量/mixin/全局类
- **逻辑复用**：跨页面重复的业务逻辑 → 提取为工具函数/composable

产出"复用约束"清单，在 Phase 3 注入每个生成 Agent 的 Prompt。详见
`references/phase2-mapping.md` 步骤 7。

**Step 2.5b — 差异化参数清单 🆕**

对每个提取的共享组件，必须记录各实例之间**不同的**属性值（如 PageHeader 在
7 个页面中有 3 种不同的背景色）。推导正确的 props 接口和默认值——防止共享组件
硬编码了错误的值导致其他实例视觉偏差。详见 `references/phase2-mapping.md` 步骤 7a-补充。

**Step 2.6 — SCSS 变量交叉验证 🆕**

当目标项目使用 SCSS 变量体系（如 uni.scss）时，Phase 2 定义的每个变量必须
与 Phase 1 提取的原型字面值进行交叉验证。这是防止"语义偏差"的唯一防线：

- 将每个 SCSS 变量定义值与原型中对应的原始 px 值对比
- 构建对比矩阵，标记偏差 > 2rpx 的变量
- 对于偏差变量，要么修正变量定义值使其匹配原型，要么记录为"已知偏差"并说明原因
- 产出"设计 Token 数值对照表"，在 Phase 4 值级审计时用作基准

详细流程见 `references/phase2-mapping.md` 步骤 6b。

**Step 2.7 — 🔴 逐文件 CSS 精确值提取 + 差异化参数 JSON 🆕（P0-D 防线）**

> **触发条件**：决策树步骤 4g 命中（Phase 3 使用并行 Agent 生成页面）。串行 LLM 生成跳过。

这是 Phase 3 Agent 不"猜测"CSS 值的唯一数据来源。产出两份 JSON：

**产出 1：`design-values.json`** — 逐文件 CSS 精确值表

从源文件每个 `style={{}}` 对象中提取 CSS 属性-值对，按目标文件分组：

```bash
# 从 React inline-style 源文件提取所有 CSS 属性-值对
node .claude/skills/frontend-refactor/scripts/extract-inline-styles.cjs \
  <source-dir>/src/ > phase2-output/raw-styles.json
```

格式：每个目标文件 → 该文件需要的所有 CSS 精确值（padding、font-size、border-radius、box-shadow、gradient 等），含源行号可追溯。

**产出 2：`shared-component-instances.json`** — 共享组件差异化参数

从 Phase 2 差异化参数清单中提取，描述每个共享组件在每个页面实例中的精确 props 值：

```json
{
  "PageHeader": {
    "instances": {
      "pages/home/home.vue": {
        "props": { "title": "...", "bgType": "page", "paddingTop": 112 },
        "sourceEvidence": "HomeView.tsx:29 — padding-top:56px"
      }
    }
  }
}
```

**🔴 阻断规则**：`design-values.json` 未产出前，Phase 3 不得启动任何页面 Agent。
`shared-component-instances.json` 未产出前，Layer 2 不得启动任何共享组件 Agent。

详细流程见 `references/phase2-mapping.md` 步骤 6c + 步骤 7a-输出增强。

**Step 2.8 — 🔴 CSS Block Pre-generation 🆕（P0-G — 防止 Agent CSS 偏差的最高防线）**

> **触发条件**：决策树步骤 4i 命中（源项目使用内联 style 对象管理样式）。
> **来源**：两次 React (inline-style) → uni-app 迁移实战。第一次 463 处 CSS diff，
> 第二次同样有大量 CSS 偏差。即便 `design-values.json` 存在、Prompt §5b 包含精确
> 值表、§5b 写了"禁止通过 SCSS 变量间接引用"——Agent 仍然优先使用 SCSS 变量和
> 自身"常识"估算值。**给 Agent 看精确值表不能阻止它估算——只有不给它估算的机会。**

**LLM Agent 对 CSS 精确值的系统性弱点**：

这是 LLM 的固有特性，不因框架组合而异。Agent 在做"生成完整 CSS"这个任务时，
它的行为模式是：(a) 识别语义模式（"这是一个卡片"）→ (b) 匹配已知变量
（"卡片用 `$card-p`"）→ (c) 填充值。步骤 (b) 天然倾向于"语义近似"而非"数值精确"。
即使 Prompt 中精确值表就在眼前，Agent 仍会优先选择自己"认识"的变量。

**唯一切实可行的解决方案**：不要求 Agent "根据精确值表写 CSS"——
而是给 Agent **已经写好的完整 CSS 块**，要求它原样粘贴。

**执行方式**：

```bash
# 从 design-values.json 为每个目标文件生成完整的 scoped CSS 块
node .claude/skills/frontend-refactor/scripts/generate-css-blocks.cjs \
  --design-values <Phase2产出>/design-values.json \
  --file-mapping <Phase2产出>/file-mapping.json \
  --target-framework <目标框架> \
  --output <Phase2产出>/css-blocks/
```

**脚本为每个目标文件产出**：
- `<target-file>.css-block` — 该文件所需的完整 `<style scoped>` 内容
- 包含所有静态 CSS 属性-值对（从源文件精确提取 + 单位换算）
- 包含条件编译标记（`/* #ifdef H5 */` 等）
- Agent 只需将此内容**原样复制**到目标文件的 `<style scoped>` 块中

**Agent 的新职责**：
- `<template>`：负责编写（这恰是 LLM 擅长的语义映射任务）
- `<script setup>`：负责编写
- `<style scoped>`：**不负责编写——从 css-blocks 文件粘贴**

**Phase 3 Agent Prompt §5b 的变更**：
- 旧：注入精确值表 → Agent 自己写 CSS → 偏差
- 新：注入完整 CSS 块文本 → Agent 粘贴 → 精确

**产出物**：
- `<Phase2产出>/css-blocks/` 目录，每个目标文件一个 `.css-block` 文件

**🔴 阻断规则**：`css-blocks/` 目录未产出前，Layer 3 页面 Agent 不得启动。
**仅当决策树 4i 命中时需要**；CSS Modules / Tailwind / 组件库源项目跳过此步骤。

**将映射蓝图提交给用户并等待确认。**

### Phase 3 — 代码生成（产出: 完整的可运行目标项目）

目标：按依赖顺序生成目标项目的每一个文件。

详细说明见 `references/phase3-generation.md`。

**Step 3.0 — 🔴 创建目标项目根目录（不可跳过 — 阻止 Agent 路径漂移）**

> **来源**：2026-07-17 `english-dictionary` (Taro+React) → `english-dict-uni` (uni-app)
> 迁移实战。2 个 Agent 将文件写到源项目目录下（`english-dictionary/src/`、
> `english-dictionary/pages/`）而非目标项目目录（`english-dict-uni/src/`）。
> 根因：Agent Prompt 中只给了相对路径（`pages/home/home.vue`），Agent 默认基于
> 工作目录写入文件。**Agent 不知道目标项目在哪。**

**执行规则**：

```
1. 目标项目根目录命名规则（优先级从高到低）：
   a. 🆕 用户指定路径（Phase 1 检测技术栈后询问 → 写入 .target-project-path）
      例：用户说"放在项目内部的 client-uni/" → 写入 <源项目根目录>/client-uni/
      例：用户说"放在 /workspace/my-target/" → 直接使用
   b. 用户未指定 → 再次询问，给两个选项：
      ① 源项目内部子目录（如 <源项目根目录>/<框架名>-client/）
      ② 源项目外部（默认：<源项目父目录>/<源项目名>-<目标框架缩写>/）
   c. 用户选择后写入 .target-project-path
   🔴 禁止跳过询问环节直接创建目录。

2. Phase 2 确认后、Phase 3 启动前：
   a. 从 .target-project-path 读取目标项目根目录
   b. 创建目标项目根目录（含完整的 src/ 子目录结构）

3. 写入后即时验证：
   bash: cat .claude/skills/frontend-refactor/.target-project-path
   预期输出：完整绝对路径（如 /workspace/english-dict-uni）

4. Phase 3 所有 Agent Prompt 的第九节（输出规范），模板从：
   "在 <target path> 输出完整的文件"
   强制改为：
   "🔴 使用 Write 工具输出文件。file_path 必须为完整绝对路径：
    <绝对路径>/src/pages/xxx/xxx.vue
    禁止使用相对路径——相对路径会导致文件写入错误的项目目录。"

5. 🔴 Phase 3 所有 Agent Prompt 的第九节末尾，追加一条硬性要求：
   "文件生成后，在回答末尾用 Bash 验证：ls <完整绝对路径>
    如果文件不在预期位置，立即用 Write 工具重新写入正确路径。"

6. Agent 返回后，宿主（LLM）立即验证：
   bash: ls <目标项目根目录>/src/pages/<预期文件名>
   不存在 → Agent 写错了位置 → 从 Agent 输出中定位实际路径 → 复制到正确位置
   → 🔴 记录该 Agent 的路径偏差，Phase 5 写入迁移对 Post-Mortem
```

**🔴 阻断规则**：`.target-project-path` 文件未创建或内容为空前，Phase 3 任何
Agent 不得启动。入口文件（Layer 5-6）同样适用——这些文件必须写入目标项目
根目录，而非源项目目录。

**Step 3.1 — 拓扑排序**

基于 Phase 2 映射表计算依赖关系图，分层生成：

```
第 0 层：类型定义（无依赖）
第 1 层：常量、Mock 数据、工具函数
第 2 层：共享组件（PageHeader、SectionLabel、PrimaryButton、WordCard、EmptyState
         — 这些是复用分析识别的共享组件，必须先于页面锁定）
第 3 层：叶子页面组件（不依赖其他页面）
第 4 层：组合页面组件（依赖第 3 层页面）
第 5 层：应用入口、路由配置、导航（依赖所有页面）
第 6 层：配置文件 + 框架必备文件（package.json、构建配置、全局样式、index.html 等）
```

**🔴 关键：第 2 层共享组件必须在所有页面 Agent 启动之前生成完毕并锁定。**
锁定意味着后续页面 Agent 的 prompt 中不写"建议使用"，而是写"这些组件已经存在，
你只能使用它们，禁止手写替代实现"。详细 Prompt 格式见 `references/phase3-generation.md`。

**Step 3.2 — 生成执行规则（🔴 不可违反的层级串行约束）**

```
层级 0 (types/工具函数)：可并行 — 无相互依赖
层级 1 (mock数据/composable)：可并行 — 仅依赖层级 0
═══════════════════════════════════════════════════════════════
🔴 层级 2 (共享组件)：必须串行 — 每个组件 Agent 必须使用
   run_in_background: false (同步等待返回)
═══════════════════════════════════════════════════════════════
层级 3 (叶子页面)：可并行 — 但必须在层级 2 全部锁定后启动
层级 4 (组合页面)：可并行 — 但必须在层级 3 全部完成后启动
层级 5 (入口文件)：串行 — App.vue → main.ts
层级 6 (配置文件)：可并行 — 使用已验证模板，禁止 Agent 自由发挥
```

> 🔴 **为什么层级 2 必须串行**：共享组件是单点故障源。PageHeader 的 h1 字号如果
> 错了（44rpx 而非 52rpx），引用它的 6 个页面全部出错。如果层级 2 和层级 3 的
> Agent 同时启动，它们各自独立决策——生成 PageHeader 的 Agent 不知道 WordCard 的
> default 变体需要 flex row + 箭头图标，生成 HomeView 的 Agent 不知道 PageHeader
> 已经实现了 backdrop-filter。结果：共享组件接口不一致、页面绕过复用约束手写替代。
> **只有串行执行 + 组件锁定验证关，才能保证一致性。**

### 🔴 Layer 2 前置步骤：共享组件交叉验证矩阵 🆕（P0-C — 任一 Agent 启动前必须完成）

在生成**任何一个**共享组件之前，必须对每个共享组件执行交叉验证：

1. 从 Phase 2 的 `shared-component-instances.json` 提取该组件的全部实例
2. 从 Phase 2 的 `design-values.json` 提取每个实例的精确 CSS 值
3. 逐属性比对所有实例 → 构建交叉验证矩阵：

```
| CSS 属性   | instance-1  | instance-2  | instance-3  | 判定                        |
|-----------|-------------|-------------|-------------|----------------------------|
| padding-top | 112rpx     | 104rpx     | 104rpx     | 多数=104rpx, 例外传 prop     |
| background  | rgba(A)    | rgba(B)    | rgba(A)    | 2 种值 → 必须作为 prop，禁止默认值 |
| blur        | 16px       | 16px       | 16px       | 全部相同 → 硬编码            |
```

4. 判定矩阵 → 推导 Props 接口
5. **交叉验证矩阵未产出前，禁止启动 Layer 2 任一 Agent**

**Step 3.2.5 — 🔴 层级 2 生成后验证关（脚本阻断 + 自动锁定清单）**

层级 2 的每个共享组件 Agent 完成后，**必须**运行验证脚本。
**脚本退出码为 1 时禁止启动下一个组件的 Agent。**

脚本除了验证 CSS 精确值外，还**自动产出机器可读的锁定清单**——
这是 Layer 3 Agent Prompt §4b 的唯一数据来源。

```
对每个层级 2 共享组件：
1. Agent 生成 <ComponentName>.vue
2. 立即运行验证脚本：
   bash .claude/skills/frontend-refactor/scripts/verify-component.sh \
     <目标项目>/src/components/<ComponentName>.vue \
     <Phase2产出>/shared-component-instances.json \
     <ComponentName> \
     --output-lock <Phase2产出>/component-lock.json

3. 脚本检查项：
   - 结构完整性（defineProps/defineEmits 存在、scoped style 存在）
   - 关键 CSS 属性值是否与 shared-component-instances.json 一致
   - Props 接口是否覆盖差异化参数清单中的所有维度
   - 🆕 全实例 props 覆盖验证：每个实例的精确值可否通过 props 正确配置

4. 脚本产出（PASS 时自动生成）：
   component-lock.json — 机器可读的锁定清单：
   {
     "PageHeader": {
       "importPath": "@/components/PageHeader.vue",
       "props": {
         "bgType": { "type": "'white'|'page'|'admin'", "default": "white" },
         "paddingTop": { "type": "number", "default": 104 }
       },
       "builtinBehaviors": ["sticky top:0 z-index:10", "H5 backdrop-filter:blur(32rpx)"],
       "usageExample": "<PageHeader bgType=\"page\" :paddingTop=\"112\" showBack>...</PageHeader>"
     }
   }

5. 退出码判定：
   - 0 (PASS) → ✅ 组件已锁定 + lock JSON 已更新 → 继续下一个
   - 1 (FAIL) → ❌ 脚本输出具体偏差项 → Agent 修复 → 重新运行 → 循环直到 PASS
   - 2 (ERROR) → ⚠️ 检查文件路径和参数

6. 全部组件通过后 → component-lock.json 即为锁定清单。
   🔴 此文件由脚本自动生成，禁止人工手动整理。
```

**🔴 脚本产出的 component-lock.json 是 Layer 3 每个 Agent Prompt §4b 的唯一数据来源。**

**Step 3.2.6 — 🔴 逐层验证关 🆕（P0-H — Layer 3/4 每个 Agent 完成后强制执行）**

> **来源**：两次 React → uni-app 迁移实战。第一次 463 处 diff，第二次同样有大量
> CSS 偏差。全部在 Phase 4 一次性发现，此时 38 个文件已全量生成，修复成本巨大。
> **Phase 4 后置发现 = 最多只能补救。逐层即时验证 = 偏差在源头消灭。**

**执行规则**：

```
Layer 3 每个页面 Agent 完成后 → 立即运行逐文件验证 → 通过后才标记"已完成"
Layer 4 每个页面 Agent 完成后 → 立即运行逐文件验证 → 通过后才标记"已完成"

逐层验证命令：
  node .claude/skills/frontend-refactor/scripts/verify-page-values.cjs \
    <目标文件路径> \
    <Phase2产出>/design-values.json \
    --tolerance 4rpx

  退出码 0 = PASS, 1 = FAIL（输出差异清单）, 2 = ERROR
```

**脚本检查项**：
1. 关键 CSS 属性存在性（padding、font-size、border-radius、box-shadow、background、color、margin、gap）
2. 值精确匹配（偏差 ≤ 4rpx 为通过）
3. 跨平台合规标记存在性（H5 条件编译、input height、textarea auto-height）

**FAIL 处理流程**（最多循环 3 次）：
```
脚本退出码 1 → 读取差异清单 → Agent 逐项 Edit 修复 → 重新运行脚本
→ 仍 FAIL？→ 再修复 → 循环
→ 3 次后仍 FAIL → 标记文件，继续下一个（不阻塞整层）
```

**🔴 阻断规则**：
- Layer 3 全部通过（或最多 2 个文件标记为"待后续修复"）后 → 才能启动 Layer 4
- Layer 4 同理 → 全部通过或最多 2 个标记后 → 才能启动 Layer 5

**为什么 Phase 4 发现太晚**：
- Phase 4 时 38 文件全部生成完毕 → 修复 1 个 CSS 值需跨文件搜索影响范围
- Layer 3 时只有 5 个页面 → 修复只影响当前文件，Agent 上下文还活跃
- 时间差：后置修复 ~90 分钟 vs 即时修复 ~5 分钟

**Step 3.3 — 通过子 Agent 生成层级 3+ 文件**

对每个目标文件（层级 3 以上），派生子 Agent。**每次调用 Agent 前，必须通过以下 prompt 核查清单：**

### Phase 3 Agent Prompt 核查清单

在发送每个 Agent 调用之前，逐项确认以下内容已包含在 Prompt 中：

- [ ] **第一节 — 角色与任务**：明确目标框架 + 100% 保真度要求
- [ ] **第二节 — 源文件**：完整的源文件内容（逐字复制）
- [ ] **第三节 — 迁移规则**：该文件适用的六类映射规则（从 Phase 2 提取）
- [ ] **第三节 b — DOM 结构保持约束 🆕**：元素父子关系、兄弟顺序、flex 方向/对齐必须与源文件一致
- [ ] **第四节 — 项目上下文**：已生成的 types.ts + 可 import 的共享组件列表
- [ ] **第四节 b — 自动锁定清单 (🔴 层级 3+ 强制)** 🆕：**从 `component-lock.json`（Step 3.2.5 脚本自动产出）提取**本文件需要的共享组件。包含精确 import 路径、props 签名、默认值、使用示例。**禁止人工手动整理此清单**——人工整理不精确，且费时。
- [ ] **第四节 b-2 — Import 声明完整性清单 🔴（P0-F）** 🆕：列出本文件模板中引用的每个共享组件/工具函数/composable/store 名称及其**强制的 import 语句**。Agent 返回前必须逐条自检 `<script setup>` 中是否包含表中每一行 import。**缺少 import → 组件静默消失——构建/TS/Console 三者均不报错**。
- [ ] **第四节 c — 跨文件上下文**：根容器约束、Phase 2 设计决策影响、条件编译要求
- [ ] **第五节 — 全局样式约束**：从 Phase 2 全局样式强制规则表中提取
- [ ] **第五节 b — 🔴 预生成 CSS 块 🆕（P0-G，当决策树 4i 命中时强制）**：**从 `css-blocks/<本文件>.css-block` 读取完整 `<style scoped>` 内容，原样粘贴到目标文件。**Agent 不负责编写 CSS——CSS 块已由脚本精确生成。仅当决策树 4i 未命中（源用 CSS Modules/Tailwind）时，才回退到原有的"精确数值表"模式。
- [ ] **第六节 — 复用约束（强制 API）**：使用"❌ 禁止手写 → ✅ 必须用"格式
- [ ] **第七节 — 图标约束**：从 Phase 2 图标映射表提取，精确到代码片段，加 🚫 emoji 禁止声明
- [ ] **第八节 — 交互清单**：Phase 1 中该文件相关的所有交互 ID 列表
- [ ] **第二节半 — 🔴 源 DOM 树清单 🆕**：Agent 逐行列出源 JSX 元素嵌套关系树，模板中不添加清单外元素
- [ ] **第八节半 — 🔴 文本内容保持 🆕**：硬编码 UI 文本（标题、按钮、标签、占位符、提示语、空状态文案、section 标题、toast 消息等）**必须从源文件逐字复制，保持源语言不变**。源是中文写中文，源是英文写英文，**禁止**自行翻译、改写或用另一种语言重新表达。这是红线——违反此项的输出视为不合格。参见 `references/phase3-generation.md` §9b
- [ ] **🔴 反虚构自检 🆕**（Agent 返回前逐项自问）：模板元素是否有源对应？CSS 声明是否有源对应？文本是否有源对应且语言一致？
- [ ] **第九节 — 输出规范**：🔴 **完整绝对路径**（禁止相对路径——从 `.target-project-path` 文件读取）+ 12 条质量要求（含 DOM 结构一致 + CSS 从 CSS-block 粘贴 + 反虚构 + 🆕 生成后用 Bash `ls` 验证文件存在于目标目录）

**严禁跳过任何一节。** 如果某节在当前文件不适用，写"N/A"并注明原因，不得留空。

Prompt 完整模板（九节 + 新增子节）见 `references/phase3-generation.md`。

同一层的 Agent 可并行执行。第 N+1 层必须等待第 N 层全部完成。

**Step 3.3 — 进度汇报**

每层完成后，向用户报告：
- "第 2 层完成：PageHeader、SectionLabel、PrimaryButton、WordCard、EmptyState — 5/5 已锁定"
- "第 3 层完成：HomeView、WordDetail、Libraries、LibraryWords、Profile、Auth — 6/6 页面"

**Step 3.4 — 🔴 Layer 5-6 构建自检（阻断验证关）**

> **来源**：2026-07-14 `figma-prototype` (React) → uni-app 迁移。Layer 5-6 的入口文件
> 全部生成完毕，`uni build` 输出 `DONE Build complete`，但 `dist/` 中零 JS 文件、HTML 中
> 零 `<script>` 标签——浏览器打开白屏。根因是 `index.html` 缺 `<script>` 标签、
> `main.ts` 未自挂载、`vite.config.ts` 位置错误。这三个问题**任何 TypeScript 编译或
> lint 都无法发现**——只有检查 dist 产物才能暴露。

Layer 5-6 全部文件生成完毕后，**必须**在进入 Phase 4 之前运行以下自检：

```bash
cd <target-project>
npm install --legacy-peer-deps 2>&1 | tail -3
npx <build-command> 2>&1 | tail -5

# 🔴 关键检查（不可跳过）
echo "=== JS files in dist ==="
find dist -name "*.js" | wc -l          # 预期 >= 10

echo "=== Script tags in HTML ==="
grep -c '<script' dist/build/h5/index.html  # 预期 >= 1

echo "=== CSS files in dist ==="
find dist -name "*.css" | wc -l          # 预期 >= 5
```

**判定规则**（基于本次实战故障录）：

| 症状 | 根因 | 修复 |
|------|------|------|
| JS 文件数 = 0 | `index.html` 缺 `<script type="module" src="./src/main.ts">` | 补齐 script 标签 |
| JS 文件数 = 1-2 | `vite.config.ts` 位置错误 → uni/Vue 插件未加载 → `.vue` 不编译 | 移到根目录 |
| npm install 失败 | `package.json` 中框架版本号是编造的（alpha 版本含 CI 时间戳） | 从 `npm view` 获取真实版本号 |
| 构建报 ENOENT pages.json | `pages.json` 放根目录而非 `src/` | 移到 `src/` 下 |
| SCSS 变量 undefined | `vite.config.ts` 的 `additionalData` 路径不对或未配置 | 检查 `@` 别名和 `@use` 路径 |

> 🔴 **严重性**：这些问题的共同特征是"构建成功但页面白屏"——构建工具不报错，
> 因为从构建工具视角看一切正常（找不到入口文件 = 零输入 = 零输出，不是错误）。
> Phase 4 的 TypeScript 编译、lint、交互审计全部无法发现这类问题。
> **只有检查 dist 产物才能暴露。** 此自检关是唯一的防线。

如果自检失败：
- 最多自动修复 3 次
- 3 次后仍失败 → 回退到 Phase 2 的框架必备文件映射，检查是否引用了 `references/frameworks/<target>.md` 中的已验证模板
- 框架模板文件（`index.html`、`main.ts`、`vite.config.ts`）**必须使用已验证模板，禁止 Agent 自由发挥** — 模板来源：`references/frameworks/<目标框架>.md` 中的"已验证文件模板"章节

### Phase 4 — 验证与修复（产出: 差异报告 + 自动修复）

目标：证明生成的目标项目与源项目一致，修复所有不一致项。

详细说明见 `references/phase4-verification.md`。

**🔴 Phase 4 核心理念**：Phase 4 的机械检查全部交给脚本——LLM 的职责是
**消费脚本输出的结构化报告、执行脚本标记项的修复、执行脚本覆盖不到的交互验证**。
脚本先行，LLM 补漏。不要 LLM 逐条手敲 Grep。

**Phase 4 执行流程（顺序不可变）**：

```
Step 4.0   → 运行 audit-phase4.sh               （脚本 — 6 组机械审计）
Step 4.0b  → 运行 diff-source-target.cjs          （脚本 — 逐文件源→目标比对）
Step 4.1   → npm install + build + tsc            （手动 — 依赖+构建+编译）
Step 4.2   → 启动开发服务器 + 逐路由验证           （采用 Skill("run") 启动目标项目）
             🆕 如果目标项目已对接 API，追加 Step 4.3h API 端点联通性验证
Step 4.3   → 交互清单审计                          （LLM — 脚本覆盖不到的语义验证）
Step 4.4   → 结构完整性检查                        （手动 — 计数验证）
Step 4.5   → 阻断式回退（如触发阈值）               （回退 Phase 3 重生成）
Step 4.6   → 重新运行 4.0 + 4.0b 确认清零           （脚本 — 验证修复）
Step 4.7   → 输出差异报告                          （LLM — 汇总）
```

**LLM 在 Phase 4 的职责边界**：

| 职责 | 工具 | 做什么 |
|------|------|--------|
| 消费脚本输出 | Read（读审计输出）+ 分析 | 区分真问题与脚本误报（如跨行 grep 漏检），决定修复优先级 |
| 执行修复 | Edit + Bash | 对脚本标记的每个问题：读文件 → Edit 修正 → 重新运行脚本确认 |
| 交互验证 | Read + Grep | 脚本覆盖不到的语义验证：事件处理器、条件渲染、状态流转 |
| 输出报告 | 文字输出 | 汇总所有修复项、已知差异、验证结果 |

**LLM 在 Phase 4 不应该做的**：
- ❌ 逐条手敲 Grep 命令审计每个文件的 CSS 值——`diff-source-target.cjs` 已覆盖
- ❌ 手敲 Grep 检查 emoji——`audit-phase4.sh` 第 3 组已覆盖
- ❌ 手敲 Grep 检查 NC-01~NC-13——`audit-phase4.sh` 第 1 组已覆盖
- ❌ 手敲 Grep 检查复用违规——`audit-phase4.sh` 第 4 组已覆盖

**脚本审计的 7 个检查组**：
| 组 | 检查内容 | 典型发现 |
|----|---------|---------|
| 1 | 跨平台原生组件合规（NC-01~NC-13） | input 缺 height、textarea 缺 auto-height |
| 2 | 样式关键属性（G1, cursor） | backdrop-filter 未条件编译 |
| 3 | Emoji 零容忍扫描 | 🔍 ✨ 等 emoji 替代图标 |
| 4 | 复用审计（共享组件使用率） | 页面手写 .header 而不用 PageHeader |
| 5 | 结构完整性（文件/页面计数） | 页面数不匹配 |
| 6 | 值级审计（--values 模式） | CSS 值偏差 > 2rpx |
| **7 🆕** | **组件注册完整性（P0-F）** | **模板引用 `<PrimaryButton>` 但 script 缺 import** |

**脚本误报处理规则**：审计脚本基于行级 grep，无法跨越多行识别条件编译包裹和
HTML 标签属性。脚本退出码 ≠ 0 时，LLM 必须逐项验证：

```bash
# 验证 textarea auto-height（跨行匹配 — 脚本 grep -A2 无法覆盖）
grep -A10 '<textarea' src/ --include="*.vue" -rn | grep 'auto-height'

# 验证 transition 条件编译（grep -v '#ifdef H5' 无法识别跨行包裹）
grep -B2 -A2 'transition:' src/ --include="*.vue" -rn
```

**脚本确诊率**：NC-02（input 自闭合）≈ 100%，Emoji 扫描 ≈ 95%，NC-03（auto-height）≈ 60%。
不清楚的项用上述跨行验证命令确认。

**Step 4.0b — 🔴 逐文件源→目标差异化比对 🆕（阻断关 — P0-D 防线）**

> **来源**：2026-07-16 `figma-prototype` (React) → `english-dict-uni` (Vue 3 + uni-app)
> 迁移实战。12 个并行 Agent 生成完毕后，CSS 属性存在性审计全部 PASS，
> 但用户反馈"页面样式与源项目不一致"。根因是现有审计只检查"属性是否存在"
> （existential check）——不检查"属性值是否精确"（value accuracy）。
> 而 Phase 4.3e 值级审计依赖 LLM 逐项 Grep 比对，12 文件 × 30+ 属性 = 360 次
> 手动操作，不可靠。必须在 Step 4.0 脚本审计后增加一个脚本驱动的逐文件 Diff 关。

**触发条件**：所有迁移项目。Phase 3 使用了 Agent 并行生成时**必须执行**；
即使串行生成，也应在 Step 4.0 之后执行此步骤作为第二道防线。

**执行方式**：

```bash
# 1. 如果有 Phase 2 产出的 design-values.json（推荐路径）
node .claude/skills/frontend-refactor/scripts/diff-source-target.cjs \
  --mapping <Phase2产出>/file-mapping.json \
  --design-values <Phase2产出>/design-values.json \
  --target-dir <目标项目目录> \
  --output phase4-output/diff-report.json

# 2. 如果没有 design-values.json（降级路径 — 从源文件实时提取）
node .claude/skills/frontend-refactor/scripts/extract-inline-styles.cjs \
  <源项目>/src/ > phase4-output/source-values.json
node .claude/skills/frontend-refactor/scripts/diff-source-target.cjs \
  --source-values phase4-output/source-values.json \
  --target-dir <目标项目目录> \
  --output phase4-output/diff-report.json
```

**Diff 脚本检查 6 个维度**：

| 维度 | 检测方法 | 典型发现 |
|------|---------|---------|
| CSS 属性缺失 | 源有目标无 | `backdrop-filter` 丢了、`padding-top:56px` 漏了 |
| CSS 值偏差 | px→rpx 换算不一致 | `font-size: 52rpx` 应为 `68rpx`(34px×2) |
| 多余 DOM 元素 | 目标有源无 | 空状态凭空加了 `&#xe006;` User 图标 |
| 缺失 DOM 内容 | 源有目标无 | 词库标签 badge 被漏掉 |
| 文本内容差异 | 文本不一致 | 标题文字被 Agent 改写或增减 |
| DOM 结构差异 | 嵌套层级/兄弟顺序 | badge 跑到了标题行内联而非释义下方独立行 |

**脚本退出码**：
- `0` — 零差异 → 直接进入 Step 4.1
- `1` — 存在差异 → LLM 消费 `diff-report.json`，逐项修复后重新运行脚本
- `2` — 参数/文件错误 → 检查路径

**LLM 消费 diff-report.json 后**：
- 🟢 0 差异 → 跳过该文件
- 🟡 CSS 值偏差 ≤ 4rpx(2px) → 自动 Edit 修复
- 🔴 CSS 值偏差 > 4rpx 或结构/元素差异 → 逐项修复后标记到 diff-report.json
- 全部修复后重新运行脚本 → 确认退出码为 0 → 才能进入 Step 4.1

**🔴 阻断规则**：diff-report.json 中任何 🔴 差异未清零前，禁止进入 Step 4.1。
此关是"源 vs 目标"逐属性精度验证的**最后一道防线**——跳过它，
接下来的 TypeScript 编译、lint、启动验证全部无法发现 CSS 值偏差。

**Step 4.1 — 静态验证**

对上一步脚本通过的项目，执行以下检查（**顺序不可变，失败自动修复**）：

```bash
# 1. 依赖安装（🔴 不可跳过 — npm install 失败则项目不可用）
npm install --legacy-peer-deps

# 2. 生产构建（验证项目可编译）
npm run build

# 3. TypeScript 编译
npx tsc --noEmit
```

> 🔴 **Step 4.1 前置规则**：`npm install` 必须在所有验证之前执行。
> 如果 `npm install` 失败（版本号不存在、依赖冲突等），不回退到逐文件 Edit——
> 回退到 Phase 3 Layer 8 重新生成 `package.json`。
> 详见 `references/phase4-verification.md` Step 1a-0。

**Step 4.2 — 启动验证 🔴 关键步骤**

构建通过 ≠ 能跑起来。必须实际启动目标项目的开发服务器，验证：

1. 依赖能成功安装
2. 服务能成功启动（无运行时错误）
3. 首页能正常访问（HTTP 200）
4. 所有页面路由可访问（无 404、无白屏）
5. 控制台无致命错误

详细流程见 `references/phase4-verification.md` Step 1d。
如果启动失败，最多自动重试 3 次；3 次后仍失败标记为 🔴 Blocker。

**Step 4.3 — 交互清单审计**

用 Phase 1 的交互清单逐项核对：

- Grep 搜索对应的事件处理器
- 验证依赖的状态变量是否存在
- 验证条件分支是否保留
- 验证组件 props 是否包含必要的回调

任何缺失的交互 → 自动重新生成该文件，Prompt 中明确指出缺失项。

**Step 4.3b — 样式关键属性审计**

从 Phase 2 的全局样式强制规则表中提取审计项，逐文件逐规则检查：

- 用 Grep 检查每个适用文件是否包含目标样式属性
- 特别关注：backdrop-filter（H5 条件编译）、半透明 header 背景色、
  安全区 padding、条件分支中的样式丢失
- 构建审计矩阵：每个规则 × 每个文件 → ✅/❌
- 对 ❌ 项：读取文件 → 定位缺失属性的 CSS 块 → Edit 插入
- 修复后重新审计，确保 100% 通过

**Step 4.3c — 复用审计**

验证目标项目是否真正使用了 Phase 2 规划的共享抽象，而非各页面手写重复代码：

- 对每条复用约束，检查适用页面是否确实 import/使用了共享组件/变量/mixin
- Grep 检查是否存在被禁止的手写模式（如页面中存在 `.header` 类但未使用 `<PageHeader>`）
- 存在即标记为 ❌，自动 Edit 替换为共享抽象
- 这步不仅验证复用，也是一个**自动重构**机会——把 Phase 3 不小心手写的重复代码替换为标准组件

> 🔴 **脚本已覆盖**：Step 4.3c 的第 3 个检查点（手写 header 违规）已被审计脚本
> 的第 4 组覆盖。脚本输出中存在 `复用违规: 手写 .header` 即表示需要修复。
> LLM 在此步骤的职责是**执行修复**（用 PageHeader 替换手写实现），而非重新扫描。

**Step 4.3d — Emoji 零容忍扫描**

审计脚本的第 3 组已覆盖。脚本输出中存在 Emoji 命中 = 🔴 Blocker，必须在报告前全部替换。

**Step 4.3e — 设计 Token 值级审计**

这是**审计脚本覆盖不到的部分**——脚本只检查"属性是否存在"和"模式是否正确"，
不检查"值是否精确"。值级审计必须由 LLM 执行：

从 Phase 2 的"设计 Token 数值对照表"中提取每个关键数值对
（padding、gap、border-radius、font-size、line-height 等），逐文件 Grep 提取
目标项目中的实际值，与原型基准值对比。偏差 > 2rpx 标记为 🟡，偏差 > 8rpx 标记为 🔴。

覆盖两类属性：**微观值**（padding、gap、border-radius、font-size）和
**容器级布局属性**（max-width、margin:auto、overflow、box-sizing、display、
flex-direction、align-items、justify-content、min-height、position）。

详细流程见 `references/phase4-verification.md` Step 2e。

**Step 4.3f — DOM 结构审计**

某些视觉偏差的根因不是 CSS 属性值错误，而是 DOM 结构偏差——元素的嵌套层级、
兄弟顺序、flex/grid 对齐方式与原型不同。此步骤对每个关键 UI 区块进行结构比对：
- 元素在原型中的父容器 vs 目标中的父容器
- flexbox/grid 的对齐方式（align-items、justify-content、flex-direction）
- 是否存在双层嵌套导致的 padding/margin 叠加
详细流程见 `references/phase4-verification.md` Step 2f。

**Step 4.3g — 图标字体完整性审计 🆕**（仅当目标使用 iconfont 方案）

审计脚本覆盖不到的部分——脚本只检查文件是否存在，不检查文件内容是否有效。
38 字节的空 TTF 文件会通过所有审计（构建成功、@font-face 存在、CSS class 正常），
但图标全部不可见。此步骤检查：

1. `wc -c src/static/fonts/iconfont.ttf` — 必须 ≥ 1KB（正常 ≥ 3KB）
2. 构建产物 `@font-face` 中 base64 内容长度 — 必须 > 200 字符
3. iconfont 渲染模式 — `:class="icon"` 和 JS 中 `'&#x` HTML entity 零命中

详细检测命令和修复流程见 `references/icons.md` §7（Phase 4 集成）和 §8（陷阱 7、8）。

**Step 4.4 — 结构完整性检查**

```
源项目视图/页面数 vs 目标项目页面数
源项目组件数 vs 目标项目组件数
源项目数据类型数 vs 目标项目类型数
未映射的源文件数（应为 0）
框架必备文件数（应等于框架必备文件清单的 🔴 文件数）
🆕 目标项目文件全部在 <目标项目根目录>/ 下？（应 100%；不应有文件散落在源项目目录或其他位置）
🆕 从 .target-project-path 读取目标根目录 → ls 递归验证所有 .vue/.ts/.scss 文件均在此目录下
```

**Step 4.5 — 阻断式审计与回退**

当某个审计规则的失败率超过阈值时（样式 >30%、复用 >40%），不回退到逐文件 Edit
修复，而是回退到 Phase 3 重新生成相关文件——增强 Prompt 后重试。每个文件最多
回退 2 次。详细阈值和流程见 `references/phase4-verification.md` Step 2d。

**Step 4.6 — 重新运行审计脚本（验证修复）**

所有 Step 4.3~4.5 修复完成后，**必须**重新运行审计脚本确认退出码为 0：

```bash
# 基础审计
bash .claude/skills/frontend-refactor/scripts/audit-phase4.sh <目标项目目录>

# 🆕 如果 Phase 2 产出了 design-values.json，必须加 --values
bash .claude/skills/frontend-refactor/scripts/audit-phase4.sh <目标项目目录> \
  --values <Phase2产出>/design-values.json

# 期望输出: "判定: 通过 — 所有关键检查均已通过"
# 期望退出码: 0
```

> 🆕 **注意**：如果步骤 4.3e（值级审计）发现并修复了 CSS 数值偏差，
> 必须在重新运行时带上 `--values` 参数——否则值级修复无法被脚本验证。

**Step 4.7 — 输出差异报告**

分类标准：

| 严重性 | 标准 | 处理方式 |
|--------|------|---------|
| 🔴 阻塞 | 页面缺失、路由断裂、构建失败、启动失败、Emoji 图标替代 | 报告前自动修复 |
| 🟡 重要 | 交互缺失、样式明显偏离、分支遗漏 | 自动修复并告知用户 |
| 🟢 轻微 | 细微样式差异、动画时间 | 记录到 known-issues.md |

**向用户展示最终报告（用中文）：**

```
## 重构完成

目标项目：<路径>
源文件：N → 目标文件：M

### 审计脚本结果
- 退出码：0 ✅ / 1 ❌
- 总检查数：N
- 通过：N  |  Minor：N  |  Major：N  |  Blocker：N

### 验证结果
- TypeScript 编译：✅ / ❌（已修复 N 个错误）
- 构建：✅ / ❌
- 启动验证：✅ / ❌（开发服务器启动成功，N 个页面全部可访问）
- 交互还原度：X/Y（Z%）— 已自动修复 N 项
- 样式关键属性审计：N/M 通过（已修复 K 项）
- Emoji 扫描：✅ 0 命中 / ❌ N 命中（已全部替换）
- 复用审计：N/M 通过（已修复 K 项）
- Input Focus 行为审计 🆕：N 文件审计，X 通过 / Y 失败（已修复 Z 项）

### 回退重生成记录（如有）
| 回退轮次 | 触发规则 | 失败率 | 涉及文件 | 结果 |
|---------|---------|--------|---------|------|
| ... | ... | ... | ... | ... |

### 已知差异（🟢 轻微）
- <用户可以自行调整的细微差异列表>
```

---

### Phase 5 — 经验持久化（产出: 更新参考文件）

> 此阶段在 Phase 4 全部审计通过后执行。它不产生用户可见的交付物——
> 而是把本次迁移中试错发现的规则写回 `references/` 目录下的两个文件，
> 防止后续迁移重复踩坑。已修复过的问题不应该在下一次迁移中再次出现。

**Step 5.1 — 汇总试错发现**

从本次迁移的 Phase 3 Step 3.4 构建自检修复记录和 Phase 4 审计报告中提取每个故障的：
现象（用户看到什么）、根因（哪个文件哪行错了）、修复（正确做法）。

**Step 5.2 — 写入两个参考文件**

| 写入目标 | 写入内容 | 作用 |
|---------|---------|------|
| `references/frameworks/<目标框架>.md` | 文件位置速查表、已验证模板（`index.html`、`main.ts`、`vite.config.ts`）、构建自检命令 | Phase 3 入口文件 Agent 直接使用，禁止自由发挥 |
| `references/migrations/<源>→<目标>.md` | Post-Mortem 故障录（现象→根因→修复→检测命令）、检查清单新项 | Phase 2 加载后注入 Phase 3 Agent Prompt |

**写入格式约束**：
- 每个故障使用标准四段格式：现象 → 根因 → 修复 → 检测命令
- 文件位置速查表：`| 文件 | 正确位置 | ❌ 常见错误 |`
- 已验证模板：完整可复制的代码块，红线用 `> 🔴` 标注
- 检查清单新项：加 `[x]` 标记为已验证规则

**Step 5.3 — 验证写入**

```bash
grep -c "Post-Mortem\|已验证模板\|文件位置速查" \
  references/frameworks/<目标框架>.md \
  references/migrations/<源>→<目标>.md
```

**Phase 5 完成标准**：
- [ ] 本次所有"试错发现"的规则都已写入目标框架文件
- [ ] 本次所有入口文件模板都固化为已验证模板
- [ ] 本次所有文件位置规则都在速查表中
- [ ] 迁移对文件的检查清单中新增了本次发现的所有检查项

**Step 5.4 — 🔴 输出 ai-master 交接信息 🆕**

> Phase 5 最终报告中必须包含以下交接信息块，供 ai-master 自动消费以执行功能级验证。

```markdown
### 🤖 ai-master 交接信息

目标项目路径：<绝对路径>
目标框架：<框架名>
构建命令：<npm run dev/build>
开发服务器端口：<端口>

核心用户故事（供 ai-master 冒烟验证）：
1. <故事1> — 对应路由: <URL>，涉及 API: <端点清单>
2. <故事2> — 对应路由: <URL>，涉及 API: <端点清单>
3. <故事3> — 对应路由: <URL>，涉及 API: <端点清单>

API 端点清单（供 ai-master 集成验证）：
| API ID | 方法 | 路径 | 目标实现文件 |
|--------|------|------|------------|
| API-01 | GET | /api/words | src/utils/request.ts → getWords() |
| ... | ... | ... | ... |

> 执行 ai-master 继续推进项目以进行功能级验证。
```

**Phase 5 完成标准 追加 🆕**：
- [ ] **ai-master 交接信息块已包含在最终报告中**

---

## 核心原则

### 为什么分析必须先行

不经过彻底分析就生成代码属于猜测。交互清单是唯一的事实来源——如果某个交互
不在清单里，它就不会出现在生成的代码中。这就是 Phase 1 必须穷尽的原因。

### 为什么阶段必须顺序执行

每个阶段验证前一个阶段。分析错了，映射就错了。映射错了，生成的代码就错了。
不要并行化阶段——只在阶段内部并行。

### 为什么需要人工确认关

用户比任何分析都更了解自己的项目。他们可能想跳过某些部分、改变目标架构、
或者覆盖迁移规则。确认关是捕捉这些需求的唯一机会。

### 🔴 为什么入口文件问题是迁移中最隐蔽的陷阱 🆕

> **来源**：2026-07-14 `figma-prototype` (React inline-style) → uni-app 迁移，
> 花费 ~90 分钟修复 5 个入口文件问题导致的白屏。后续每次迁移都可能重演。

入口文件（`index.html`、`main.ts`、`vite.config.ts`、`pages.json`）的问题有三个
"无法发现"的特性：

1. **构建工具不报错**：Vite 找不到入口 JS → 零输入 = 零输出 = 构建成功。
   `DONE Build complete` 但 `dist/` 中零 `.js` 文件。
2. **TypeScript 编译不报错**：`main.ts` 导出 `createApp()` 但从不调用——类型完全合法，
   但运行时不渲染任何组件。
3. **lint / IDE 不报错**：文件位置错误（`vite.config.ts` 放 `src/` 而非根目录）——
   IDE TypeScript service 正常工作，所有 import 解析正确，只是构建工具找不到。

这三个特性叠加意味着：**从所有开发工具视角看一切正常，但浏览器中一片空白。**
Phase 4 的交互审计、样式审计、复用审计全部无法发现——因为根本没有产物可以审计。

**唯一有效的检测手段**：Phase 3 Layer 5-6 完成后立即运行构建自检，检查 `dist/` 中
是否有 JS/CSS 文件、HTML 中是否有 `<script>` 标签。这是 Phase 3 Step 3.4 的职责。

**防止重演**：
- Phase 3 入口文件必须使用 `references/frameworks/<target>.md` 中的已验证模板，禁止 Agent 自由发挥
- Phase 4 完成后执行 Phase 5 将本次试错经验写回迁移参考文件
- 下次迁移时 Phase 2 加载迁移对参考文件→Phase 3 Agent 直接拿到正确模板

### 为什么交互还原度是最难的指标

视觉相似性相对容易——颜色、间距、字体都是机械搬运。但交互隐藏在事件处理器、
条件分支和状态转换中，静态渲染时是不可见的。这就是为什么交互清单必须枚举
每一项，Phase 4 必须审计每一项。

### 为什么样式也容易出错 🆕

虽然颜色、间距等显式值确实容易搬运，但以下类型特别容易被遗漏：
- **特效属性**（如 `backdrop-filter`、`mix-blend-mode`）——它们不属于颜色/间距/字体家族
- **条件编译包裹的属性**——Agent 可能完全跳过而非添加 `/* #ifdef H5 */` 包裹
- **跨文件一致性约束**——"所有页面 header 都要有 blur"不是任何一个文件能表达的
- **条件分支中的样式丢失**——Vue `:style` 绑定的条件分支可能清空样式

这就是为什么 Phase 1 设计 Token 必须填写审计元信息，
Phase 2 必须产出全局样式强制规则表，Phase 4 必须包含样式关键属性审计。
样式审计要与交互审计同等对待——两者都通过 Grep 逐项验证。

### 为什么值级精度比属性存在性更难保证 🆕

Phase 4.3b 的样式关键属性审计只检查"属性是否存在"（existential check）——例如
"header 有没有 backdrop-filter"。但它**不检查属性的值是否正确**——例如
"padding 是 48rpx 还是 40rpx"、"gap 是 24rpx 还是 28rpx"。这导致以下系统性偏差：

- **SCSS 变量引入的偏差**：Phase 3 Agent 使用语义相近的 SCSS 变量（如 `$card-p-lg`）
  代替原型中的精确值（如 `20px`），但变量定义值与原型值之间存在系统性偏移。
  Phase 2 定义了变量但从未交叉验证其数值是否与原型一致。
- **布局属性值的偏差**：`align-items: center` vs `flex-start`、
  `flex-direction: column` vs `row`——属性存在，但值错误，Grep 审计无法发现。
- **DOM 结构偏差**：元素的嵌套层级、兄弟顺序在 Phase 3 由 Agent 自由决策，
  没有强制要求保持与原型一致的 DOM 树结构。这导致 badge 从释义下方独立行
  跑到了标题行内联——视觉位置完全改变，但没有任何审计步骤能发现。
- **双重嵌套偏差**：两个层级的容器各自添加 padding，每层单独看都正确，
  但叠加后的实际值远超原型——这属于结构性偏差，不是单属性偏差。

这就是为什么 Phase 2 必须增加 **SCSS 变量交叉验证**步骤，
Phase 3 Agent Prompt 必须增加 **DOM 结构保持约束**，
Phase 4 必须增加 **值级审计**和 **DOM 结构审计**步骤。

### 为什么复用必须显式分析 🆕

1:1 逐文件迁移会导致大量重复代码。Phase 3 的每个 Agent 只知道自己的源文件和
目标路径——Agent A 在生成 home.vue 时不知道 Agent B 也在为 libraries.vue 生成
完全相同的 header。这种信息壁垒的后果：
- 7 个页面有 7 套独立维护的 header 实现
- 同一段 CSS 在 N 个文件中 copy-paste
- 同一个工具函数在多个文件中内联定义
- 共享组件被提取后只被 1/7 的页面使用

这就是为什么 Phase 2 必须包含复用分析——在所有 Agent 启动之前识别跨文件重复
模式并规划共享抽象，然后把"复用约束"注入每个 Agent 的 Prompt。
Phase 4 的复用审计则确保这些约束真正被遵守。

### 为什么逐文件差异化比对是最后一道防线 🆕

> **来源**：2026-07-16 `figma-prototype` (React inline-style) → `english-dict-uni`
> 迁移实战。12 个 Agent 并行生成全部 28 个文件，`uni build` 通过，审计脚本
> 退出码 1（均为已知 grep 跨行误报）。但用户反馈"页面样式与源项目不一致"。

根本原因：**现有 Phase 4 的所有审计都是"存在性检查"（existential check）**——
检查属性是否存在。没有一步检查"属性值是否精确等于源值的换算值"。结果：

| 偏差类型 | 存在性审计 | 值级审计(手写Grep) | 差异化比对脚本 |
|---------|----------|------------------|-------------|
| `backdrop-filter: blur(32rpx)` 存在 | ✅ PASS | ✅ PASS | ✅ PASS |
| `padding-top: 104rpx` 应为 `112rpx` | ✅ 属性存在 | ❌ 需 12 文件×每个 header 行比对 | ✅ 脚本一秒发现 |
| 空状态凭空加了个 User 图标 | ✅ 图标存在 | ❌ 不在 Grep 规则里 | ✅ 脚本发现元素数量不一致 |
| "全部词汇"行被 SectionLabel 拆断 | ✅ 两个元素各自存在 | ❌ Grep 不检查布局 | ⚠️ 需 DOM 树对比模式 |

**只有脚本驱动的逐文件差异化比对，才能 100% 覆盖所有 CSS 属性-值对的精确性验证。**
LLM 逐条 Grep 的方式有两个致命缺陷：(1) 360+ 次手动操作，必然漏；(2) Grep 只查
"有没有"不查"对不对"。脚本在 2 秒内完成全部 6 个维度的逐文件比对，然后 LLM 
消费结构化差异报告，逐项修复——这才是可靠的闭环。

**Phase 4 Step 4.0b 是这个闭环的承载者**——它在审计脚本之后立即执行，
用脚本提取 + diff 确保零遗漏。没有 Step 4.0b 的 Phase 4，本质上只是
"抽查了某几类已知高频问题的专项审计"，不是"源 vs 目标的完整性验证"。
n### 为什么跨平台迁移需要额外的原生组件审计 🆕

跨平台框架（uni-app、Taro 等）在非 H5 端使用原生组件渲染 input/textarea 等元素。
原生组件与 Web 组件有三点根本区别：
1. **不自动计算盒模型** — 没有显式 height 则 wrapper 高度为 0
2. **不支持 CSS transition/animation** — 会导致闪烁或无响应
3. **不允许 overflow: hidden** — 会裁剪原生渲染层

这些问题的共同特征是：**H5 端完全正常，小程序端静默失效**。
交互审计（Step 2）和样式存在性审计（Step 2a）都无法发现这类问题，
因为没有缺失任何属性——属性都在，只是在某些平台上"不起作用"。

这就是为什么需要原生组件合规审计——检查的不是"属性是否存在"，
而是"模式是否安全"。
详见 `references/cross-platform-pitfalls.md`。

### 为什么表单/输入框是迁移中最顽固的问题 🆕

在 3 次 React → uni-app 迁移实战中，输入框 focus/blur 行为始终是用户反馈最多的
问题。不是因为实现复杂，而是因为**三个独立维度的问题会同时出现，且每个维度属于不同的流程步骤**：

1. **样式模式分散（Phase 2 问题）**：不同页面有不同的 blur 态默认样式——
   HomeView/AdminView 用 `transparent + #F1F5F9`，AuthView 用 `#E5E7EB + #fff`。
   如果 Phase 2 没有显式分类这些模式，Phase 3 的多个 Agent 会各自猜测——
   结果 auth.vue 可能用了 AdminView 的样式，或 home.vue 的 input 突然有了
   AuthView 的灰色边框。

2. **focus 管理机制重复（Phase 3 问题）**：每个 Agent 独立创建 `const isFocused = ref(false)` 
   而非使用统一的 `useInputFocus()` composable——导致 5+ 个文件维护完全相同的
   `@focus="isFocused = true"` `@blur="isFocused = false"` 模板代码。
   当 WordEditForm 有 15+ 个字段时，这个模式还会升级为动态 map 与顶层 composable
   并存的两套机制冲突。

3. **小程序端静默失效（跨平台问题）**：CSS `transition` 在原生 input 组件上触发
   重绘冲突（NC-04）。H5 端一切正常→开发过程中发现不了→真机测试时才暴露。
   这种"H5 正常、小程序不可用"的模式无法被 TypeScript 编译或 Web 构建发现。

这三个维度的共同特征是：**无法被单一的 Phase 4 审计步骤覆盖**。交互审计（Step 2）
只检查事件是否存在、值级审计（Step 2e）只检查值是否正确、样式关键属性审计
（Step 2a）只检查属性是否存在——但 input 的问题需要**审计 blur 态的样式模式、
审计 composable 的使用方式、审计 transition 的条件编译状态**三者同时检查。

这就是为什么 Phase 2 必须增加**步骤 4b（输入框样式模式分类）**、Phase 3 必须
增加 **G14/G15 全局样式规则**、Phase 4 必须增加**独立的 Step 2g（Input Focus
行为审计）**。三个步骤环环相扣——Phase 2 分类模式、Phase 3 强制执行、
Phase 4 逐项验证。


---

## 参考文件（按需加载）

以下文件按需加载——不要一次性全部读取：

- `references/phase1-analysis.md` — 深度分析流程与产出格式
- `references/phase2-mapping.md` — 迁移映射策略与规则推导方法
- `references/phase3-generation.md` — Agent Prompt 模板与排序策略
- `references/phase4-verification.md` — 验证脚本与差异报告格式
- `references/interaction-taxonomy.md` — 交互分类方法与文档规范
- `references/style-fidelity.md` — 设计 Token 提取与样式映射陷阱
- `references/frameworks/*.md` — 各框架分析指南
- `references/migrations/*.md` — 各迁移对映射规则
- `references/icons.md` 🆕 — 通用全技术栈图标迁移策略（SVG 兼容矩阵、决策树、各策略实施指南、iconfont 模板）
- `references/cross-platform-pitfalls.md` 🆕 — 原生组件跨平台陷阱（NC-01~NC-08）与修复模板
- `scripts/analyze.sh` — 自动化项目元信息提取
