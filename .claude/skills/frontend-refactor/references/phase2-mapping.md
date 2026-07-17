# 第二阶段 — 迁移映射指南

## 目标

生成一份逐文件的迁移蓝图，将每个源产物映射到目标产物，并附带明确的规则。该蓝图必须不留任何歧义——子代理在阅读后应能够生成目标文件，而无需自行做出任何结构性决策。

---

## 步骤 1：检测源框架与目标框架

从第一阶段的骨架图（源）和用户请求（目标）中提取。

将名称规范化为与 `references/frameworks/<name>.md` 和
`references/migrations/<src>→<tgt>.md` 匹配的格式：

- `react`、`vue2`、`vue3`、`angular`、`svelte`、`nextjs`、`nuxt`
- `taro`（Taro 多端）、`miniprogram`（原生微信小程序）、`uniapp`
- `html`（原生 HTML/CSS/JS）

## 步骤 2：加载或生成迁移规则

### 情况 A：迁移对已存在

加载 `references/migrations/<src>→<tgt>.md`。这是一个预置的知识库，包含经过实战检验的映射规则。将其作为基础，但需根据第一阶段中发现的源项目具体模式进行调整。

### 情况 B：迁移对不存在

从头生成映射规则：

1. **阅读目标框架指南**：`references/frameworks/<target>.md`
   如果不存在，通过以下方式创建一份精简版：
   - 阅读目标项目的现有代码（如果用户有的话）
   - 使用 `npx ctx7@latest library <target-framework> "getting started project structure"` 获取最新文档

2. **在六个类别中推导映射规则**：

#### 组件模型映射

```
对于每个源组件模式，定义其目标等价物：

源                                → 目标
<div>                             → <View>（小程序）/ <div>（Web 框架）
<span>                            → <Text>（小程序）/ <span>（Web 框架）
<img>                             → <Image>（小程序）/ <img>（Web 框架）
<input>                           → <Input>（小程序）/ <input>（Web 框架）
<button>                          → <Button>（小程序）/ <button>（Web 框架）
<ul>/<ol>                         → <ScrollView> + map（小程序）
<React.Fragment>                  → <template v-if> / <block> / <> 等价物
Portals                           → 目标等价物或说明限制
```

#### 事件系统映射

```
源                                → 目标
onClick                           → onClick / @click / onTap
onChange                          → onChange / @change / onInput
onSubmit                          → @submit / form bindsubmit
onFocus / onBlur                  → 检查目标是否支持；如不支持则标记
onKeyDown                         → 在小程序中通常不可用；注明替代方案
onScroll                          → onScroll / bindscroll
被动事件                            → 检查目标语法
事件冒泡控制                         → .stop / .prevent / catch 修饰符
```

#### 样式系统映射

```
源系统                              → 目标系统策略

Tailwind                           → 如果目标支持 Tailwind：保留，调整前缀
                                   → 如果不支持：提取为 CSS Modules 或 scoped 样式
内联 style 对象                      → CSS Modules（推荐）或 scoped <style>
styled-components / Emotion         → CSS Modules 或目标 CSS-in-JS 等价物
CSS Modules                        → 通常可直接移植
Sass/SCSS                          → 目标等价预处理器
全局 CSS                            → 应用级样式表

需注意：
- backdropFilter：小程序中通常不支持
- position: fixed：小程序中的行为有所不同
- CSS 变量：检查目标支持情况
- :hover/:focus/:active：在纯触控平台上不可用
- @media 查询：使用目标的响应式机制
```

#### 路由与导航映射

```
源                                  → 目标

React Router                         → Vue Router / Next.js App Router / @tarojs/router
文件系统路由                           → 映射到目标的路由约定
手动 useState 路由                     → 必须转换为目标路由（不要保留手动路由）
Tab 导航                              → 目标的标签栏 API
堆栈导航                              → 目标的 navigateTo / navigateBack
模态页面                              → 目标的 modal/page 类型
URL 参数                              → 目标的等价物（query 参数、route 参数）
导航守卫                              → 目标的 beforeEach / middleware
```

#### 状态管理映射

```
源                                  → 目标

React Context                        → provide/inject / Pinia store / Redux
useState + props                     → ref/reactive + props / data + props
Redux                                → Pinia / Vuex / Zustand
Zustand                              → Pinia / reactive store
局部组件状态                           → ref/reactive / data
派生状态（useMemo）                    → computed
副作用（useEffect）                    → watch / onMounted / 生命周期钩子
```

#### 数据获取映射

```
源                                  → 目标

直接 mock 导入                        → 相同（保留 mock）或保持相同数据结构的 API 调用
fetch / axios                        → 目标的 HTTP 客户端或保留
React Query / SWR                    → 目标的数据获取等价物
静态生成                              → 目标的 SSG/构建时等价物
```

#### 图标迁移策略 🆕（独立于六大类别）

图标迁移比颜色/间距更隐蔽——Agent 很容易用 emoji 糊弄过去。
必须作为独立的第七个映射维度处理，与六大类别同等重要。

> **📖 完整策略文档**：`references/icons.md` 是图标迁移的权威参考，包含：
> - SVG 支持矩阵（Web / 小程序 / RN / Flutter / 桌面端）
> - 策略决策树（7 种策略 A-G）
> - 各策略详细实施步骤
> - iconfont 基础设施标准模板
> - 12+ 常见图标库的迁移映射表
> - 各阶段集成说明与检查清单
>
> 以下为本步骤的核心流程摘要，详细实施请对照 icons.md。

##### 从 Phase 1 图标资产清单中获取数据

Phase 1 的"文档 5：图标资产清单"提供了：
- 逐文件图标使用统计
- 每类图标的规格（尺寸、颜色、语义角色）
- 推荐的目标实现方案

##### 决策树：根据目标平台选择图标方案

详见 `references/icons.md` 第二节。快速摘要：

```
源项目的图标方案是？
├── 图标库（lucide-react 等）
│   ├── 纯 Web 目标        → 策略 A（同名库迁移）或 B（等价库替换）
│   ├── uni-app             → 策略 D（uni-icons + iconfont）
│   ├── Taro                → 策略 E（Taro Icons / iconfont）
│   ├── React Native        → 策略 F（react-native-vector-icons）
│   └── Flutter             → 策略 G（Material Icons + flutter_svg）
├── 内联 SVG / SVG 文件
│   ├── 纯 Web 目标        → ✅ 直接保留
│   └── 小程序 / RN         → ❌ 必须替换为 iconfont 或等价方案
└── iconfont                → ✅ 全平台可直接保留
```

##### 图标映射表格式（必须精确到每个图标）

```markdown
## 图标迁移映射

| 源图标 (lucide-react) | 目标实现 | 代码片段 | 适用平台 |
|----------------------|---------|---------|---------|
| Search | uni-icons | `<uni-icons type="search" size="16" color="#9CA3AF" />` | 全端 |
| ArrowRight | iconfont | `<text class="iconfont icon-arrow-right">` | 全端 |
| ArrowLeft | iconfont | `<text class="iconfont icon-arrow-left">` | 全端 |
| Sparkles | iconfont | `<text class="iconfont icon-sparkles">` | 全端 |
| BookOpen | iconfont | `<text class="iconfont icon-book-open">` | 全端 |
| User | iconfont | `<text class="iconfont icon-user">` | 全端 |
| Eye / EyeOff | 条件切换 | `v-if="showPassword"` 切换两个 iconfont 字符 | 全端 |
| Shield | iconfont | `<text class="iconfont icon-shield">` | 全端 |
| LogOut | iconfont | `<text class="iconfont icon-log-out">` | 全端 |
| Settings | iconfont | `<text class="iconfont icon-settings">` | 全端 |
| Target | iconfont | `<text class="iconfont icon-target">` | 全端 |
| Plus | iconfont | `<text class="iconfont icon-plus">` | 全端 |
| RefreshCw | iconfont | `<text class="iconfont icon-refresh-cw">` | 全端 |
| Loader | CSS animation | `<view class="spinner">`（CSS @keyframes spin） | 全端 |
| Check | iconfont | `<text class="iconfont icon-check">` | 全端 |
| X | iconfont | `<text class="iconfont icon-x">` | 全端 |
| Type | iconfont | `<text class="iconfont icon-type">` | 全端 |
| Users | iconfont | `<text class="iconfont icon-users">` | 全端 |
| ChevronRight | iconfont | `<text class="iconfont icon-chevron-right">` | 全端 |
```

> 更多图标库映射（heroicons、Tabler Icons、Phosphor 等）→ 见 `references/icons.md` 第六章。

##### iconfont 基础设施规划

如果决策树选择了 iconfont 方案，必须在 Phase 2 规划以下基础设施（完整模板见 `references/icons.md` 第四章）：

1. **字体文件位置**：`src/static/fonts/iconfont.ttf`（或 .woff2）
2. **全局引入**：在 `App.vue` 非 scoped style 中 `@font-face` 声明
3. **字符编码**：为每个图标分配一个 Unicode 码点（如 `\e001`, `\e002`...）
4. **工具类**：全局 CSS 中定义 `.iconfont { font-family: 'iconfont'; }`

##### 🔴 红线：禁止 emoji

在 Phase 2 映射蓝图中明确声明以下约束，该约束将写入 Phase 3 **每个** Agent 的 prompt：

> **绝对禁止使用任何 emoji 字符替代图标。** 包括但不限于：
> 🔍 ✨ 📖 👤 🛡 ⚙ 🎯 🚪 📭 ❌ ✅ ➕ 🔄 💡 ← → × ✓
> 图标必须使用本映射表中指定的方案实现（iconfont / uni-icons / CSS 绘制 / 图标库组件）。
> 如果某个图标没有对应的 iconfont 码点，用占位符 `<view class="icon-placeholder">` 并在注释中标注"待补充图标"。

##### 输出到 Phase 3 的格式

图标映射表必须转化为**可直接注入 Agent prompt 的文本块**（完整模板见 `references/icons.md` 第七章 Phase 3 段）：

```
## 图标约束（Icon Constraints）

⚠️ 红线：本文件禁止使用任何 emoji 字符替代图标。

本文件需要的图标及其实施方式：

| 图标用途 | 实施方式 | 代码 |
|---------|---------|------|
| 搜索图标 | uni-icons | `<uni-icons type="search" size="16" color="#9CA3AF" />` |
| 列表项右箭头 | iconfont | `<text class="iconfont icon-arrow-right">&#xe002;</text>` |
| 今日一词装饰 | iconfont | `<text class="iconfont icon-sparkles">&#xe003;</text>` |
| ... | ... | ... |

请严格按照上表实现图标，不要自行决定使用其他方式（尤其是 emoji）。
```

## 步骤 3：构建逐文件映射表

逐一检查第一阶段骨架图中的每个源文件。对每个文件，决定：

1. **它是否需要目标文件？** 某些文件（配置、构建脚本）可能不需要移植。
2. **它是否拆分或合并？** 一个大型源文件可能变成 2 个以上目标文件。若干小型源文件可能合并为一个目标文件。
   **🔴 强制拆分规则**：任何源文件 > 200 行，必须在映射表中**显式标注其内部子模块的拆分决策**。
   不能以"1 文件 → 1 文件"的方式映射超大源文件而不说明其内部子结构。
   
   拆分标注格式（追加在映射表"关键说明"列）：
   ```
   | 21a | AdminView.tsx:137-222 (Overview)         | admin.vue              | 🟡 中 | 子模块1/4：概览页面 |
   | 21b | AdminView.tsx:224-326 (LibraryManager)    | admin/libraries.vue    | 🟡 中 | 子模块2/4：词库CRUD |
   | 21c | AdminView.tsx:328-683 (WordManager+Form)  | admin/words.vue        | 🔴 高 | 子模块3/4：单词管理+AI表单 |
   | 21d | AdminView.tsx:685-730 (UserManager)       | admin/users.vue        | 🟢 低 | 子模块4/4：用户列表 |
   ```
   
   如果选择合并在一个文件（不拆分），必须在映射表中说明原因：
   "已评估拆分：子模块 A（N 行）/ B（M 行）/ C（K 行），因 <原因> 选择合并在同一目标文件"
   
   > 📋 **实战教训**：某 React → uni-app 迁移中，AdminView.tsx（760 行）映射为单文件 admin.vue，
   > Phase 3 Prompt 仅覆盖了 Overview 子模块（86 行/11%），其余三个子模块被标记为 stub。
   > 若映射表强制拆分，每个子模块会生成独立的 Agent Prompt，不会遗漏。
3. **难度如何？** 低（机械翻译）、中（需要一些适配）、高（复杂的交互 + 样式迁移）、关键（入口点、路由）。

输出格式：

```markdown
## 文件映射表

| # | 源文件 | 目标文件 | 难度 | 关键说明 |
|---|------------|-------------|------------|-----------|
| 1 | src/main.tsx | src/app.tsx | 低 | 入口点；Taro 使用不同的启动方式 |
| 2 | src/app/App.tsx | src/app.tsx | 关键 | 路由重写：useState → Taro router |
| 3 | src/app/data/types.ts | src/data/types.ts | 低 | 类型大多可移植；剥离 React 特有类型 |
| 4 | src/app/data/mockData.ts | src/data/mockData.ts | 中 | 相同数据结构；适配目标平台的 Date/Math 用法 |
| 5 | src/app/components/HomeView.tsx | src/pages/home/index.tsx | 中 | 搜索+列表+事件；Taro input 事件有所不同 |
| 6 | src/app/components/WordDetailView.tsx | src/pages/word-detail/index.tsx | 高 | 复杂布局；SVG → CSS/Canvas；滚动行为 |
| ... | ... | ... | ... | ... |

## 不移植的文件
| 源文件 | 原因 |
|-------------|--------|
| vite.config.ts | 由 Taro 配置替代 |
| postcss.config.mjs | 由 Taro 配置替代 |
```

## 步骤 4：记录关键映射规则

针对六个类别，分别写出适用于本次迁移的具体规则。要具体——使用源项目中的实际代码模式示例。

```markdown
## 事件映射规则

| 源模式 | 目标模式 |
|---------------|----------------|
| onClick={() => navigate({name:'wordDetail', wordId: w.id})} | onClick={() => Taro.navigateTo({url:`/pages/word-detail/index?id=${w.id}`})} |
| onChange={e => setQuery(e.target.value)} | onInput={e => setQuery(e.detail.value)}（Taro Input） |
| onKeyDown={e => e.key==='Enter' && handleSubmit()} | onConfirm={handleSubmit}（Taro Input 确认事件） |

## 样式映射规则

| 源模式 | 目标模式 |
|---------------|----------------|
| style={{padding:'16px 24px',background:'#fff',borderRadius:'16px'}} | 提取到 index.module.scss：`.card { padding: 16px 24px; background: #fff; border-radius: 16px; }` |
| backdropFilter:'blur(16px)' | 小程序构建中移除；H5 构建中保留 CSS |
| position:'fixed', bottom:0 | 使用 Taro <View fixed> 或结合 Taro 安全区域处理的 CSS |
| 带动态值的 style 对象 | 转换为 CSS 自定义属性或内联样式（如果简单的话） |

## 路由映射规则

| 源模式 | 目标模式 |
|---------------|----------------|
| setView({name:'home'}) | Taro.switchTab({url:'/pages/home/index'}) |
| setView({name:'wordDetail',wordId:id}) | Taro.navigateTo({url:`/pages/word-detail/index?id=${id}`}) |
| 基于 Tab 的导航（BottomNav） | app.config.ts 中的 Taro tabBar 配置 |
```

## 步骤 4b：输入框 focus/blur 样式模式分类 🆕（表单迁移专项）

> **触发条件**：源项目中存在任何使用 `onFocus`/`onBlur` 事件修改元素样式的模式时，
> 必须执行此步骤。这是跨平台迁移中最容易出错的模式之一——不同页面可能有不同的
> blur 态默认样式，Phase 3 Agent 如果不知道这些差异，会统一使用错误的默认值。

### 4b-0. 技术栈适配决策树 🆕（按源→目标组合选择处理方式）

**问题本身是通用的**——任何源项目中，不同页面的输入框可能有不同的 blur 态默认样式，
如果不在 Phase 2 显式分类，Phase 3 的多个 Agent 会各自猜测。但**解决方案的格式**
取决于源框架的样式管理方式和目标框架的平台能力：

```
源框架的 input 样式管理方式？
├── 内联 style 对象 / DOM 操作 (React inline-style, vanilla JS)
│   └── 目标框架？
│       ├── uni-app / Taro (小程序端原生组件)
│       │   → 完整执行 Step 4b：INPUT-A/B 模式分类 + D8 决策 + G14/G15 + Step 2g
│       │   → SCSS mixin 封装模式，useInputFocus composable，transition 条件编译
│       │
│       ├── Vue 3 / Nuxt (纯 Web)
│       │   → 执行 Step 4b 简化版：INPUT-A/B 模式分类 + CSS class 封装
│       │   → 不需要 G12(transition 条件编译)、D8、G9-G11、G13
│       │   → focus 管理使用 Vue 的 :class 绑定或 v-focus 指令
│       │
│       ├── React / Next.js (纯 Web)
│       │   → 执行 Step 4b 简化版：INPUT-A/B 模式分类
│       │   → 不需要 composable——React 用 CSS classes + useState 即可
│       │   → 不需要条件编译——纯 Web 无原生组件陷阱
│       │
│       └── Svelte / Solid / 其他纯 Web
│           → 执行 Step 4b 简化版：仅做模式分类表
│           → 按目标框架的样式管理习惯实现（Svelte: scoped style + class:directive）
│
├── CSS Modules / Tailwind (声明式)
│   → 源项目已有显式的 CSS class 管理 focus/blur 样式
│   → **跳过 Step 4b**：模式已在源项目的 CSS class 中显式定义
│   → 仅需在 Phase 2 样式映射中确认 Tailwind class → 目标 class 的对应关系
│
└── 统一组件库 (Ant Design, Element Plus, MUI 等)
    → 输入框样式由组件库统一管理，不存在跨页面模式差异
    → **跳过 Step 4b**：在 Phase 2 组件映射中处理 <Input> → <ElInput> 即可
    → 但如果源项目在不同页面覆写了组件库的默认样式 → 仍需执行 Step 4b
```

**关键判断标准**：如果以下三个条件同时满足，必须执行完整 Step 4b：

1. ✅ 源项目使用**命令式 DOM 操作**管理 focus/blur 样式（`e.target.style.xxx = '...'`）
2. ✅ 源项目中**不同页面有不同的 blur 态默认值**
3. ✅ 目标框架要求**声明式样式管理**（CSS class / scoped style / conditional compilation）

三个条件中任一不满足，可跳过或使用简化版。详见下表：

| 源 → 目标组合 | 条件1 | 条件2 | 条件3 | Step 4b 等级 | 需要 D8 | 需要 G14 | 需要 G15 | 需要 Step 2g |
|-------------|-------|-------|-------|------------|---------|---------|---------|------------|
| React inline-style → uni-app/Taro | ✅ | ✅ | ✅ | **完整** | ✅ | ✅ | ✅ | ✅ |
| React inline-style → Vue 3 (Web) | ✅ | ✅ | ✅ | **简化** | ❌ | ✅ | ✅ | ✅ |
| React inline-style → Next.js (Web) | ✅ | ✅ | ❌ | **简化** | ❌ | ✅ | ❌ | ✅ |
| React inline-style → React 重构 | ✅ | ✅ | ❌ | **最小** | ❌ | ✅ | ❌ | 🟢 可选 |
| Vue 2 → Vue 3 (统一模式) | ❌ | ❌ | — | **跳过** | ❌ | ❌ | ❌ | ❌ |
| CSS Modules → CSS Modules | ❌ | ❌ | — | **跳过** | ❌ | ❌ | ❌ | ❌ |
| 组件库 → 组件库（无覆写） | ❌ | ❌ | — | **跳过** | ❌ | ❌ | ❌ | ❌ |

> **简化版** = 仅做模式分类表（4b-1），不生成 mixin/条件编译/原生组件合规规则。
> **最小版** = 仅做模式分类表，Phase 3 中以注释形式提醒 Agent 注意模式差异。

### 4b-1. 枚举源项目中的所有输入框样式模式

遍历 Phase 1 交互清单中所有 onFocus/onBlur 交互，按 blur 态的 border-color 和
background 值进行分组：

```markdown
## 输入框样式模式分类

| 模式 ID | blur 态 border-color | blur 态 background | 出现位置 | 出现次数 |
|---------|---------------------|-------------------|---------|---------|
| INPUT-A | `transparent` | `#F1F5F9` | HomeView 搜索框, AdminView 全部输入框 | 8+ |
| INPUT-B | `#E5E7EB` | `#fff` | AuthView 全部输入框 | 3 |
| INPUT-C | `<自定义>` | `<自定义>` | `<其他位置>` | N |
```

### 4b-2. 为每种模式生成目标框架的等价实现

```markdown
## 输入框样式模式 → 目标实现

### INPUT-A（透明边框 + 灰色背景 → focus 蓝色边框 + 白色背景）
适用文件：home, admin（及所有使用此模式的子组件）
SCSS 实现：
  @mixin input-pattern-a {
    border: 3rpx solid transparent;
    background: #F1F5F9;
  }
  @mixin input-pattern-a-focused {
    border-color: #2563EB;
    background: #fff;
  }

### INPUT-B（灰色边框 + 白色背景 → focus 蓝色边框）
适用文件：auth
SCSS 实现：
  @mixin input-pattern-b {
    border: 3rpx solid #E5E7EB;
    background: #fff;
  }
  @mixin input-pattern-b-focused {
    border-color: #2563EB;
  }
```

### 4b-3. 产出物

| 产出物 | 格式 | 用途 |
|--------|------|------|
| 输入框样式模式分类表 | 上述 Markdown 表格 | 注入 Phase 3 每个涉及页面的 Agent Prompt 第五节 |
| 对应 SCSS mixin 定义 | SCSS 代码块 | 写入 `uni.scss` 或目标全局样式文件 |
| 模式 → 文件映射 | `<文件路径> → INPUT-A / INPUT-B` | Phase 4 Step 2g 审计的基准 |

### 4b-4. 为什么此步骤不可或缺

没有此步骤时：
- Phase 3 的多个 Agent 各自定义 input 样式——home 的 Agent 写一套，auth 的
  Agent 写另一套，admin 的 Agent 又写一套
- 值都正确（border-color 都是 `#2563EB`），但来源分散在 5+ 个文件中
- 如果要改一个值（如 `#E5E7EB` → `#D1D5DB`），需要改 5 个文件——而如果用
  mixin，只需改 `uni.scss` 一处

> 📋 **真实案例**：某 React → uni-app 迁移中，input focus 样式在 home.vue、
> auth.vue、WordEditForm.vue、LibraryManager.vue、WordManager.vue 五个文件中
> 独立定义，完全相同的 CSS 属性组合被复制了 5 次。后续一个颜色调整需要改 5 个文件。

---

## 步骤 5：识别并处理"无法"映射的情况

某些源模式没有直接的等价物。对每种情况：

```markdown
## 不可移植的特性

| 源特性 | 问题 | 替代方案 | 保真度差距 |
|---------------|---------|------------|--------------|
| SVG PhysicalImage 插图 | 小程序不支持内联 SVG | 转换为 CSS 绘制的形状或 Canvas | 10% 视觉差异 |
| 头部 backdropFilter 模糊效果 | 小程序不支持 | 使用半透明纯色背景作为降级方案 | 明显但可接受 |
| focus/blur 上的 CSS transition | 小程序中没有 :focus | 移除或使用 tap 事件切换 class | 轻微 |
| position:fixed 的 BottomNav | 小程序有自己的 tabBar | 改用原生 tabBar 配置 | 更好（原生体验） |
```

## 步骤 5a：设计决策的多平台影响评估 🆕（跨平台迁移专用）

> **适用条件**：源平台与目标平台不同时，此步骤为必需。源平台 = 目标平台时，
> 使用简化的单环境版本（见 5a-2）。

当 Phase 2 做出"移除某属性"、"改变某值"、"用原生组件替代"等设计决策时，
不能仅做单一评估（如"更好——原生全屏体验"）。同一决策在不同平台上可能有完全
相反的后果——H5 桌面端需要 max-width 限制宽度，但小程序端不需要。

### 5a-1. 完整多平台影响矩阵（跨平台）

对步骤 5 中每个"不可移植的特性"，补充以下多平台影响矩阵：

```markdown
## 设计决策多平台影响矩阵

### 决策 D1：移除页面级 maxWidth 限制，改为原生全屏宽度

| 评估维度 | H5（桌面浏览器） | H5（移动端） | 微信小程序 | 支付宝小程序 | App |
|---------|----------------|------------|-----------|------------|-----|
| **视觉影响** | 🔴 严重：宽屏上内容拉伸到 1920px，阅读体验差，卡片失去视觉焦点 | 🟢 无影响：手机屏幕宽度天然接近设计稿 | 🟢 无影响 | 🟢 无影响 | 🟢 无影响 |
| **交互影响** | 🔴 严重：搜索框、卡片等元素在宽屏上过度拉伸 | 🟢 无影响 | 🟢 无影响 | 🟢 无影响 | 🟢 无影响 |
| **用户预期** | 🔴 桌面端用户预期"中央窄栏 + 两侧留白"布局 | 🟢 移动端用户预期全屏 | 🟢 移动端用户预期全屏 | 🟢 移动端用户预期全屏 | 🟢 移动端用户预期全屏 |
| **总体判定** | 🔴 不可接受 — 必须条件编译保留 maxWidth | 🟢 可接受 | 🟢 可接受 | 🟢 可接受 | 🟢 可接受 |

**决策修正**：不能简单"移除 maxWidth"。正确方案：
- H5 平台：保留 `max-width: 860rpx; margin: 0 auto`（条件编译）
- 小程序/App：无限制（或同样设置 max-width 以保持一致性）
- 实施方式：
  ```
  /* #ifdef H5 */
  .page-container { max-width: 860rpx; margin: 0 auto; }
  /* #endif */
  ```

### 决策 D2：用原生 tabBar 替代自定义 BottomNav 组件

| 评估维度 | H5 | 微信小程序 | App |
|---------|----|-----------|-----|
| **视觉一致性** | 🟡 H5 上 tabBar 实现与原 BottomNav 视觉接近 | 🟢 原生 tabBar，体验完美 | 🟢 原生 tabBar |
| **功能完整性** | 🟢 可完全复制 3 个 tab 的导航目标 | 🟢 原生 tabBar 天然支持 | 🟢 原生 tabBar |
| **可定制性** | 🟡 样式可定制但需要额外 CSS | 🟡 原生 tabBar 有样式限制（如无 blur 背景） | 🟡 同小程序 |
| **总体判定** | 🟡 可接受，需额外 CSS | 🟢 可接受 | 🟢 可接受 |

### 决策 D3：header 的 backdrop-filter blur 效果替换为纯色半透明背景

| 评估维度 | H5 | 微信小程序 | App |
|---------|----|-----------|-----|
| **视觉影响** | 🔴 严重：H5 上完全可以保留 blur，替换后视觉降级 | 🟡 小程序不支持 blur，纯色背景是可接受替代 | 🟡 同小程序 |
| **总体判定** | 🔴 不可接受 — 用条件编译保留 | 🟡 可接受 | 🟡 可接受 |

**决策修正**：H5 条件编译保留 blur：
```
/* #ifdef H5 */
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
/* #endif */
```

### 决策 D4：移除 React 的 :hover/:focus 伪类样式

| 评估维度 | H5（桌面端） | H5（移动端） | 微信小程序 | App |
|---------|-----------|-----------|-----------|-----|
| **视觉影响** | 🔴 桌面端失去 hover/focus 交互反馈 | 🟢 移动端 hover/focus 不可用 | 🟢 小程序无此概念 | 🟢 同 |
| **总体判定** | 🔴 严重 — 用条件编译在 H5 中保留 | 🟢 可接受 | 🟢 可接受 | 🟢 可接受 |

**决策修正**：H5 条件编译保留 `:hover` 和 `:focus` 伪类样式。

### 决策 D8 🆕：小程序端 input focus 放弃 CSS transition，改用背景色突变

> 📋 **真实案例**：某 React → uni-app 迁移中，5 个页面的 input 都保留了
> `transition: border-color 0.2s, background 0.2s`，H5 端正常但小程序端
> input 点击无响应——原生组件层与 WebView CSS transition 产生重绘冲突（NC-04）。

| 评估维度 | H5（桌面端） | H5（移动端） | 微信小程序 | App |
|---------|-----------|-----------|-----------|-----|
| **视觉影响** | 🟢 保留 transition，平滑过渡 | 🟢 保留 transition | 🟡 原生组件不支持 CSS transition，改用 `background` 突变表达 focus 状态 | 🟡 同小程序 |
| **交互影响** | 🟢 无 | 🟢 无 | 🟡 视觉反馈不如 H5 平滑，但 focus 态仍然可见（通过 `:class` 切换的背景色突变） | 🟡 同小程序 |
| **总体判定** | 🟢 保留 | 🟢 保留 | 🟡 可接受 | 🟡 可接受 |

**决策**：
- H5 端：用 `/* #ifdef H5 */` 包裹 `transition` 属性，保留平滑过渡
- 小程序端：依靠 `:class` 切换（`input-pattern-a` → `input-pattern-a-focused`）
  通过 `background` 突变表达 focus 状态——不需要 transition 就能看到变化
- 共用 `useInputFocus` composable，各平台通过 CSS 差异实现不同效果
```
/* 在 scoped CSS 中 */
.my-input {
  border: 3rpx solid transparent;
  background: #F1F5F9;
  /* #ifdef H5 */
  transition: border-color 0.2s, background 0.2s;
  /* #endif */
}
.my-input.input-focused {
  border-color: #2563EB;
  background: #fff;
}
```

**影响范围**：所有使用 `useInputFocus` composable 的 input（home.vue、auth.vue、
WordEditForm.vue、LibraryManager.vue、WordManager.vue）。

### 汇总：H5 专属条件编译属性清单

基于上述影响矩阵，以下属性必须在 H5 平台用条件编译保留：

| 属性 | 条件编译语法 | 影响决策 |
|------|------------|----------|
| `max-width` + `margin: 0 auto` | `/* #ifdef H5 */` | D1 |
| `backdrop-filter` + `-webkit-backdrop-filter` | `/* #ifdef H5 */` | D3 |
| `:hover` / `:focus` 伪类 | `/* #ifdef H5 */` | D4 |
| `transition`（在原生组件上） | `/* #ifdef H5 */` | D8 🆕 |
| `outline` | H5 中显式声明的 `outline`（如有）在非 H5 中不需要 | — |
| `cursor: pointer` | `/* #ifdef H5 */` | — |
```

### 5a-2. 简化单环境影响评估（源平台 = 目标平台时）

当源平台与目标平台相同时（如 React → React 重构、Vue 2 → Vue 3 升级），
使用以下简化格式替代完整矩阵：

```markdown
## 设计决策影响评估（单平台）

| 决策 ID | 决策描述 | 影响评估 | 判定 |
|---------|---------|---------|------|
| D1 | <决策内容> | <在所有目标环境中的影响> | 🟢/🟡/🔴 |
```

### 5a-3. 输出到 Phase 3

多平台影响评估的结论必须转化为 Phase 3 Agent Prompt 中**精确的条件编译片段**。
不能笼统地说"注意平台差异"——必须给出具体的 `/* #ifdef H5 */` 代码块。
这些代码块通过 Phase 3 Prompt 模板的"第四节 b：跨文件上下文 — 设计决策部分"
注入到每个页面 Agent 的 Prompt 中。

### 5a-4. 增强步骤 5 的"不可移植特性"表

在步骤 5 的"不可移植的特性"表中增加一列 `多平台影响`，链接到对应的 D1/D2/D3 决策项：

| 源特性 | 问题 | 替代方案 | 保真度差距 | 多平台影响 |
|--------|------|---------|-----------|-----------|
| ... | ... | ... | ... | 见 D1 |
| ... | ... | ... | ... | 见 D3 |

## 步骤 6：生成全局样式强制规则表（关键）

这是 Phase 2 容易被忽略但至关重要的产出物。Phase 1 提取的设计 Token 中，
有一部分是**跨页面共享的样式规则**（如 header 的 backdrop-filter、背景色、
安全区 padding 等）。这些规则不属于任何一个具体文件，因此在 Phase 3 逐文件
生成时很容易被 Agent 遗漏。

必须在 Phase 2 结束时生成如下清单：

```markdown
## 全局样式强制规则（Phase 3 每个页面 Agent 都必须收到）

以下规则适用于所有页面/组件文件。生成每个页面的 Agent 时，必须将此清单作为
Prompt 的固定前置段落注入。

| 规则 ID | 描述 | 实施方式 | 对应设计 Token | 适用文件 |
|---------|------|---------|---------------|---------|
| G1 | 吸顶 header 必须有 H5 条件编译的 backdrop-filter | `/* #ifdef H5 */ backdrop-filter: blur(32rpx); /* #endif */` | blur-header | 所有有 .header 类的页面组件 |
| G2 | 吸顶 header 背景必须是半透明色 | `background: rgba(247,249,252,0.94)` | header-bg | 所有有 .header 类的页面组件 |
| G3 | 页面顶部 padding 必须包含安全区 | padding-top 至少 104rpx（H5 52px 安全区 + 内容 padding） | page-pt | 所有页面组件 |
| G4 | 有条件渲染的 header 不得丢失背景 | 未登录/空数据等状态如果 header 仍显示，不能因条件分支丢失背景样式 | header-bg | profile 等有条件渲染的页面 |
| G5 | 全局字体必须在 App.vue 中设置 | `font-family: system-ui, -apple-system, 'Inter', sans-serif` | font-family | App.vue |

### 规则的产生方式

全局样式强制规则从 Phase 1 的设计 Token 审计元信息自动推导：
1. 遍历设计 Token 表中所有标记了"审计 Grep 模式"和"必须覆盖的文件"的条目
2. 将其转换为"规则 ID + 描述 + 实施方式 + 适用文件"的格式
3. 该表作为 Phase 3 每个生成 Agent Prompt 的第五节（全局样式约束）

### 为什么此步骤至关重要

Phase 3 的每个 Agent 只看到："这是源文件 X，迁移为目标文件 Y"。
Agent 自然会关注源文件中的颜色、间距、字体等显式值，但以下类型容易遗漏：
- **条件编译包裹的属性**（如 H5 专属的 backdrop-filter）
- **源文件中有但 Agent 认为"不重要"的属性**（如 blur 特效）
- **跨文件一致性约束**（如所有 header 有相同的 blur 效果）

全局样式强制规则表解决了这个问题：它不是"建议"，而是每个 Agent 必须响应的
硬性约束，与交互清单同等地位。
```

## 步骤 6b：设计 Token 数值交叉验证 🆕（关键 — 防止系统性数值偏差）

> **适用范围**：当目标项目使用任何形式的样式变量/设计 Token 体系时执行此步骤。
> 包括但不限于：SCSS 变量、Less 变量、CSS 自定义属性（`--*`）、Tailwind theme、
> styled-components theme、Style Dictionary token。如果目标项目不使用变量体系
> （如纯 CSS Modules 硬编码值），跳过此步骤，直接依赖 Phase 4 值级审计。

Phase 3 的 Agent 会用语义相近的变量代替原型中的精确值——例如看到原型 `padding: 20px`，
Agent 可能选用项目中已定义的"大卡片内边距"变量。但该变量的定义值可能与原型值
存在系统性偏移，而这种偏移在 Phase 4 的存在性审计中**完全不可见**——属性存在，只是值错了。

此步骤必须在 Phase 2 完成——在变量被 Agent 使用之前验证其数值正确性。

### 6b-1. 决策树：根据目标样式系统选择验证策略

```
目标项目使用什么样式变量体系？
├── SCSS/Less 变量 ($xxx)        → 验证变量定义文件中的值
├── CSS 自定义属性 (--xxx)        → 验证 :root / 主题文件中的声明值
├── Tailwind theme.extend         → 验证 tailwind.config.* 中 spacing/fontSize/borderRadius 的值
├── Style Dictionary / tokens.json → 验证 token 定义文件中的 value 字段
├── styled-components ThemeProvider → 验证 theme 对象中的属性值
└── 不使用变量体系                 → 跳过此步骤
```

### 6b-2. 验证流程（以 SCSS 为例，其他体系同理）

**Step 1 — 提取对比项**：

从 Phase 1 设计 Token 表中提取每条精确值，找到 Phase 2 步骤 7b 中定义的对应变量。
如果某个原型值没有对应的变量，说明该值将在 Phase 3 以硬编码方式使用，无需交叉验证。

**Step 2 — 构建数值对照表**：

```markdown
## 样式变量 × 原型值 交叉验证

| 变量名 | 定义值 | 原型原始值 | 原型来源 | 偏差 | 判定 |
|--------|--------|-----------|---------|------|------|
| <var-name> | <定义值> | <原型 px 值> → <目标单位换算值> | <文件名:行号 — 使用场景> | ±Δ | 🟢/🟡/🔴 |
```

> **注意**：表格中的"定义值"和"原型原始值"单位可能不同（如 SCSS 用 `rpx`，原型用 `px`，
> Tailwind 用 `rem`）。必须统一换算为同一单位后再对比。换算规则由 Phase 2
> 步骤 4 的样式映射规则确定（如 `1px = 2rpx` 或 `1rem = 16px`）。

**Step 3 — 判定与处理**：

| 偏差范围 | 判定 | 处理 |
|---------|------|------|
| ≤ 2 最小单位 | 🟢 可接受 | 保持变量定义值不变 |
| 3-8 最小单位 | 🟡 偏差 | 修正变量定义值使其精确匹配原型，或记录为已知偏差并说明理由 |
| > 8 最小单位 | 🔴 需修正 | 必须修正变量定义值。这种偏差在视觉上已明显可辨 |

> "最小单位"取决于目标体系：SCSS/rpx → 1rpx；Tailwind/rem → 0.0625rem (1px)；
> CSS 自定义属性/px → 1px。简单判断：偏差像素值 ≤ 2px 为可接受。

**Step 4 — 修正策略**：

- **一变量对应一个原型值** → 修改变量定义值使两者一致
- **一变量对应多个不同的原型值** → 拆分为多个更细粒度的变量（如 `--space-card-sm`、`--space-card`、`--space-card-lg`），每个对应一个精确原型值
- **变量语义与原型值完全不匹配** → 删除该变量，让 Agent 使用精确值。不要保留"语义近似但数值错误"的变量

> **原则：数值精确优先于命名美观。** 一个名叫 `--space-md: 14px` 的变量
> 比名叫 `--space-card-body: 18px` 但实际应该用 14px 的变量更好。

### 6b-3. 产出物

1. **修正后的变量/Token 定义文件**：所有变量值已与原型对齐
2. **设计 Token 数值对照表**（含修正标记）：直接作为 Phase 4 Step 2e 值级审计的基准
3. **已知偏差清单**：标记为 🟢 可接受的微小偏差及原因

### 6b-4. 为什么此步骤不可或缺

没有交叉验证时，变量定义由 Phase 2 从"语义近似"角度自由选择——"看起来像大卡片
的 padding"给了某个值，但原型实际是另一个值。Phase 3 的所有 Agent 都忠实地使用
这个偏差的变量，Phase 4 的存在性审计全部通过——因为属性确实存在，只是值错了。
这是**最隐蔽的保真度损失**：没有编译错误、没有遗漏属性、但视觉就是不对。

> 📋 **真实案例**：某 React → uni-app 迁移中，4 个 SCSS 变量的定义值与原型存在
> 4-8rpx 的偏差（`$card-p-lg`、`$card-p`、`$gap-md`、`$radius-card`），全部在
> Phase 4 存在性审计中漏过，直到人工对比原型截图才发现。

### 6b-5. 🔴 变量定义强制格式：原型来源注释 🆕（P1-A）

**每个 SCSS 变量 / CSS 自定义属性 / Tailwind token 在定义时，必须附带原型来源注释。**
不在此格式的变量定义视为"未验证"——Phase 4 无法审计其正确性，Agent 无法判断是否
可以信任该变量。

**标准格式**：

```scss
// ✅ 正确格式：值 + 原型来源
$font-label: 24rpx;  /* Phase1(src): HomeView.tsx:37 L1=12px, LibrariesView.tsx:26 L2=12px
                         WordDetailView.tsx:105 L3=11px → ⚠️ L3 conflicts, use L1/L2 majority,
                         L3 page must override with font-size:22rpx */

$header-pb: 32rpx;   /* Phase1(src): AdminView.tsx:88 padding-bottom=16px → 32rpx
                         ⚠️ LibrariesView/ProfileView/WordDetailView use 20px→40rpx —
                         these pages MUST override with padding-bottom:40rpx */

$card-p: 40rpx;      /* Phase1(src): AdminView.tsx:192 CARD padding=20px → 40rpx
                         WordDetailView.tsx:121 padding=24px→48rpx — diff page, diff var */

// ❌ 错误格式：无原型来源 → Phase 4 不可审计
$font-label: 22rpx;
$header-pb: 32rpx;
```

**注释中必须包含的信息**：
1. `Phase1(src):` — 标记数据来源
2. 文件名:行号 — 每个使用该值的源文件位置
3. 原始 px 值 → rpx 换算 — 明确换算过程
4. `⚠️` — 如果多个原型值不同（冲突），标记并说明决策（取多数/取最大/需页面覆盖）

**Phase 4 消费方式**：
- audit-phase4.sh 的 `--values` 模式读取此注释中的预期值
- verify-component.sh 在 Layer 2 验证关中也读取此格式
- 如果变量缺少此注释 → Phase 4 标记为 🟡 "变量值不可追溯"

**产出物补充**（增加至 6b-3）：
4. **变量原型来源清单**：每个变量的定义行 + 原型注释 → 直接注入 Phase 3 Agent Prompt 第五节 b

### 6b-5. 🔴 SCSS 变量定义值 × 源提取值 机器交叉验证 🆕（P1-B 防线）

**触发条件**：目标项目使用 SCSS 变量（`uni.scss` 等）时，此步骤为强制。
跳过此步骤 = 接受所有变量定义值与源精确值之间未经检验的偏差。

**执行方式**：

```bash
# 验证 uni.scss 中每个变量定义值是否与源精确值一致
node .claude/skills/frontend-refactor/scripts/validate-scss-vars.cjs \
  --scss <目标项目>/src/uni.scss \
  --design-values phase2-output/design-values.json \
  --output phase2-output/scss-var-validation.json
```

**脚本检查逻辑**：
1. 解析 `uni.scss`，提取每个 `$var-name: value;` 定义及其原型来源注释
2. 在 `design-values.json` 中搜索同属性、同语义的源提取值
3. 对比变量定义值 vs 源精确值（统一换算为 rpx 后）
4. 偏差 ≤ 2rpx → 🟢 通过；偏差 > 2rpx → 🔴 标记

**验证失败时的处理**：

| 偏差范围 | 判定 | 处理 |
|---------|------|------|
| ≤ 2rpx | 🟢 可接受 | 变量定义值不变 |
| 3-8rpx | 🔴 需修正 | **修正变量定义值使其等于源精确值**。不要保留"语义相近但数值偏差"的变量——Agent 无法区分"变量值正确"和"变量值碰巧接近" |
| > 8rpx | 🔴 需修正 | 同上。这种偏差在视觉上已明显可见 |

**🆕 变量值偏差 ≠ 可以接受的原因**：
Agent 在 Phase 3 收到两套数据源——SCSS 变量定义值（来自 `uni.scss`）和精确数值表（来自 `design-values.json`）——当两者冲突时，Agent 默认优先使用 SCSS 变量。如果 SCSS 变量本身就有偏差，Agent 百分百产出偏离的 CSS 值。

> 📋 **真实案例**：`$font-label: 22rpx`（11px×2）vs 源 `12px→24rpx`，偏差 2rpx(1px)。
> Phase 3 的 6 个 Agent 全部输出了 22rpx 而非 24rpx。Phase 4 审计无法发现——
> "font-size 属性存在"审计通过，但值偏了 2rpx。只有机器交叉验证能捕捉。

**产出物**：
- `phase2-output/scss-var-validation.json` — 每个变量的验证结果
- 修正后的 `uni.scss` — 所有偏差变量已被修正为源精确值

**🔴 阻断规则**：`scss-var-validation.json` 中任何 🔴 标记未清零前，
禁止启动 Phase 3 Layer 0。这是阻止"系统性数值偏差传播到所有页面"的唯一防线。

---

## 步骤 6c：逐文件 CSS 精确值提取 🆕（阻断步骤 — P0-D 防线）

> **触发条件**：决策树步骤 4g 命中（Phase 3 使用并行 Agent 生成页面）。
> 串行 LLM 模式跳过此步骤，因为 LLM 可直接逐行比对源文件。

Phase 3 的并行 Agent 不"猜测"CSS 值的唯一数据来源。产出 `design-values.json`——
它同时是 Phase 3 Agent Prompt §5b 的输入、Phase 4 `--values` 审计的基准、
Phase 4 Step 4.0b 差异化比对脚本的基准。

### 6c-1. 提取流程

```bash
# 从 React inline-style 源文件提取所有 CSS 属性-值对
node .claude/skills/frontend-refactor/scripts/extract-inline-styles.cjs \
  <source-dir>/src/ > phase2-output/raw-styles.json
```

脚本从每个 `style={{...}}` 对象中提取：
- `file` — 源文件路径
- `line` — 行号
- `element` — 渲染该样式的 JSX 元素（如 `<div>`, `<input>`, `<button>`）
- `properties` — 完整的 CSS 属性-值映射 `{ "padding": "16px 24px", "fontSize": "26px" }`

支持的源样式系统：
- **React inline-style**：`style={{padding:'16px', fontSize:'14px'}}` — 完全支持
- **Vue inline-style**：`:style="{padding:'16px'}"` — 支持（正则适配）
- **CSS Modules / Tailwind**：不适用——class 引用的值无法从 inline style 提取
  → 跳过此脚本，改为 Phase 4 Step 4.0b 降级路径（从目标文件反向提取）

### 6c-2. 构建 per-file CSS 精确值表

将 `raw-styles.json` 按 Phase 2 文件映射表分组，合并按目标文件组织的精确 CSS 数值约束表，
写入 `phase2-output/design-values.json`：

```json
{
  "pages/home/home.vue": {
    "source": "HomeView.tsx",
    "values": [
      {
        "cssProp": "padding",
        "sourceValue": "56px 24px 24px",
        "sourceLine": 29,
        "targetValue": "112rpx 48rpx 48rpx",
        "targetElement": ".home-page__header",
        "note": "header top area"
      },
      {
        "cssProp": "font-size",
        "sourceValue": "26px",
        "sourceLine": 39,
        "targetValue": "52rpx",
        "targetElement": ".home-page__title",
        "note": "h1 title"
      },
      {
        "cssProp": "box-shadow",
        "sourceValue": "0 2px 12px rgba(0,0,0,0.04)",
        "sourceLine": 197,
        "targetValue": "0 4rpx 24rpx rgba(0,0,0,0.04)",
        "targetElement": ".word-card--default",
        "note": "全部词汇卡片阴影"
      }
    ]
  }
}
```

### 6c-3. 产出物清单

| 产出物 | 格式 | 用途 |
|--------|------|------|
| `phase2-output/raw-styles.json` | 全量提取结果 | 可追溯——每个目标值都能回到源文件行号 |
| `phase2-output/design-values.json` | 按目标文件分组的格式 | Phase 3 Agent Prompt §5b + Phase 4 `--values` + Phase 4 Step 4.0b 差异比对 |

### 6c-4. 🔴 阻断规则

`design-values.json` 未产出前：
- Phase 3 不得启动任何页面 Agent
- Phase 4 Step 4.0b 无法执行（降级为反向提取模式）

这是 Phase 3 Agent Prompt §5b 的唯一数据来源。没有它，Agent 只有"语义近似 SCSS 变量"
和"自身常识估算"两个选择，两者都是系统性数值偏差的根因。

> 📋 **真实案例**：2026-07-16 迁移中，`design-values.json` 不存在，
> 12 个 Agent 各自从 SCSS 变量或自身推算 rpx 值，导致 7 个页面出现
> 不同程度的 padding/font-size/shadow 偏差——全部在 Phase 4 存在性审计中漏过。

---

## 步骤 7：复用分析 — 提取共享抽象（关键）

步骤 1-6 完成了 1:1 的逐文件映射。但只做 1:1 映射会导致大量重复代码——每个
页面 Agent 独立生成各自的 header、搜索栏、空状态提示，产生多套略有差异的实现。
Phase 2 必须在进入代码生成之前，识别跨文件的重复模式并规划共享抽象。

### 为什么复用分析必须放在 Phase 2

Phase 3 的每个生成 Agent 只看到一份源文件和一份目标路径。Agent 没有全局视野，
不知道其他 Agent 也在生成相同的 header、相同的搜索栏、相同的空状态。
**复用分析是唯一能打破这个信息壁垒的步骤**——它在所有 Agent 启动之前，
把跨文件的共同模式识别出来，转化为共享组件，然后告诉每个 Agent"用这个，别手写"。

### 7a. 组件复用分析

遍历 Phase 1 骨架图中所有页面，识别跨页面重复出现的 UI 模块：

```markdown
## 组件复用分析

### 分析方法
1. 列出每个页面组件的 JSX/模板结构（从 Phase 1 分析报告中提取）
2. 找出结构和样式相同或高度相似的 UI 区块
3. 评估：提取后能减少多少重复代码？提取是否会增加不必要的抽象复杂度？

### 识别结果

| 复用模式 | 出现次数 | 出现位置 | 变体差异 | 建议 |
|---------|---------|---------|---------|------|
| 页头（半透明背景 + 模糊 + 标题区 + 可选返回按钮 + 可选右侧操作） | 7/7 | home, libraries, profile, word-detail, library-words, auth, admin | 仅返回按钮、标题内容不同 | 🟢 提取为 `<PageHeader>` |
| 空状态提示（图标 + 标题文字 + 副标题） | 4 | home, libraries, library-words, admin | 仅文案不同 | 🟢 提取为 `<EmptyState>` |
| 搜索栏（搜索图标 + 输入框 + focus/blur 边框切换） | 3 | home, admin/单词管理, admin/用户管理 | 宽度和 placeholder 不同 | 🟡 提取为 `<SearchBar>` |
| 单词列表项（单词名 + 音标 + 含义摘要 + 箭头） | 3 | home(全部词汇), home(搜索结果), library-words | 是否显示词库标签不同 | 🟡 提取为 `<WordListItem>` |

### 决策原则
- **出现 ≥ 3 次** → 必须提取为共享组件
- **出现 2 次但逻辑复杂** → 评估提取
- **出现 1 次但可能在 Phase 3 被其他 Agent 手写** → 标记为"候选"，在生成时告知 Agent 优先查找已有组件
```

### 7a-补充：差异化参数清单（Differentiation Parameter Checklist）🆕

> **关键**：复用分析只记录"实例之间有什么共同点"是不够的。当 N 个实例被提取为
> 1 个共享组件时，必须同步记录"实例之间有什么不同"。否则共享组件的默认值只能
> 从其中一个实例取值，导致其他实例迁移后视觉错误。

**分析方法**：

对每个被识别为可复用的 UI 模式，遍历其所有出现位置，提取差异化参数：

1. 列出该模式在所有出现位置中的**完整属性集合**（颜色、尺寸、文案、行为）
2. 对每个属性，检查是否在所有出现位置中**值都相同**
3. 值不同的属性 → 必须作为组件的 **props 参数**
4. 值相同的属性 → 可硬编码在组件内部，但须注释说明"已验证 N 个实例值一致"

**差异化参数提取表**：

```markdown
## 差异化参数清单 — <共享组件名称>

### 模式：<模式描述，如"页头 — 半透明背景 + 模糊 + 标题区">

| 属性维度 | 出现位置 | 值 | 判定 |
|---------|---------|---|------|
| 背景色 | home | rgba(255,255,255,0.9)（白色毛玻璃） | 🔴 不一致 — 需作为 prop |
| 背景色 | libraries | rgba(255,255,255,0.9)（白色毛玻璃） | — |
| 背景色 | profile（已登录） | rgba(255,255,255,0.9)（白色毛玻璃） | — |
| 背景色 | profile（未登录） | transparent（无 header） | 🔴 不一致 |
| 背景色 | word-detail | rgba(247,249,252,0.92)（灰色毛玻璃） | 🔴 不一致 |
| 背景色 | library-words | rgba(255,255,255,0.9) | — |
| 背景色 | auth | transparent（无 header 背景） | 🔴 不一致 |
| 背景色 | admin | rgba(247,249,252,0.94)（灰色毛玻璃） | 🔴 不一致 |
| 标题文字 | home | "认知英语词典" / "用物理意象读懂英语" | 🔴 不一致 — 需作为 prop/slot |
| 标题文字 | libraries | "词库" / "选择词库" | 🔴 不一致 |
| 标题文字 | profile | "我的" / "个人中心" | 🔴 不一致 |
| 标题文字 | word-detail | 动态（单词名称） | 🔴 不一致 |
| 标题文字 | library-words | 动态（库名称） | 🔴 不一致 |
| 标题文字 | auth | "登录" / "注册" | 🔴 不一致 |
| 标题文字 | admin | "管理后台" | 🔴 不一致 |
| 是否有返回按钮 | home | 无 | — |
| 是否有返回按钮 | libraries | 无 | — |
| 是否有返回按钮 | profile | 无 | — |
| 是否有返回按钮 | word-detail | 有（← 返回） | 🔴 不一致 — 需作为 prop |
| 是否有返回按钮 | library-words | 有（← "词库列表"） | 🔴 不一致 |
| 是否有返回按钮 | auth | 有（← 返回） | 🔴 不一致 |
| 是否有返回按钮 | admin | 有（← 返回） | 🔴 不一致 |
| 右侧是否有操作 | admin | 有（新增按钮等） | 🔴 不一致 — 需作为 slot |

### 🆕 维度：children/slot 内容在 DOM 树中的位置

> **来源**：2026-07-17 `figma-prototype` → `english-dict-uni` 迁移实战。PageHeader 组件
> 在 home.vue 的搜索框垂直间距消失——根因是 Agent 把 `<slot />` 放在了标题 wrapper 的
> **内部**（子节点），而源文件的 HomeView 中搜索栏是标题 wrapper 的**外部兄弟节点**。
> 这个偏差不涉及任何 CSS 属性值的差异——所有属性的存在性和精确值全部正确——
> 纯属 DOM 结构偏差。Phase 4 的 7 组审计全部无法发现此问题。

**背景**：共享组件通过 `<slot />` 或 children prop 接收内容时，该内容在组件内部 DOM 树中的
位置（兄弟 vs 子节点）直接影响布局。这个决策在 Phase 3 由共享组件 Agent 独立做出——
而 Agent 通常只看到 AdminView 一个源实例——如果该实例中 children 恰好在标题内部，
Agent 就会把 slot 放在标题 wrapper 内。但另一个实例（如 HomeView）的搜索栏在源文件中
是标题 wrapper 的兄弟节点，这就导致目标中搜索栏紧贴标题文字下方，丢失了源文件中的
20px 垂直间距。

**分析方法**：

对每个通过 slot/children 接收内容的共享组件，遍历其所有使用实例，提取源文件中该内容的
DOM 位置模式：

```markdown
## children/slot 位置差异化清单 — <共享组件名称>

### 模式：PageHeader 的 children/slot 内容位置

| 实例 | 源文件中 content 的父容器 | 与标题区的 DOM 关系 | 源文件证据 |
|------|------------------------|-------------------|----------|
| home | header div（PageHeader 的根容器） | **兄弟节点**——标题 wrapper 和搜索栏是两个独立的 div | HomeView.tsx:35-80 — `<div style="marginBottom:20px">...</div>` + `<div style="position:relative">...</div>` |
| libraries | header div（根容器） | —（无 children/slot 内容使用） | LibrariesView.tsx:19-32 |
| word-detail | header div（根容器） | —（无 children/slot 内容使用——仅 right slot） | WordDetailView.tsx:48-89 |
| admin/overview | header div（根容器） | **子节点**——subtitle + title 文本直接在 children 中，与标题同一 wrapper | AdminView.tsx:151-156 — `<PageHeader><p>...</p><h1>...</h1></PageHeader>` |

### 判定

| 判定项 | 结论 |
|--------|------|
| 是否存在 ≥1 个实例的 content 是标题 wrapper 的**兄弟节点**？ | ✅ 是（home） |
| 是否存在 ≥1 个实例的 content 是标题 wrapper 的**子节点**？ | ✅ 是（admin/overview） |
| **决策** | <slot /> 必须放在标题 wrapper 的**外部**（兄弟位置）。标题 wrapper 使用 `margin-bottom` 提供间距（默认值取多数实例值）。子节点场景（admin）通过把纯文本内容写在 `<PageHeader>` 的 children 中实现——文本自然位于标题 wrapper 内部 |
```

### 判定规则

| 情况 | 处理 |
|------|------|
| **所有实例的 content 都是兄弟节点** → | `<slot />` 放在标题 wrapper 外部 + 标题 wrapper 有 `margin-bottom`（值 = 多数实例的共同值或 Prop） |
| **所有实例的 content 都是子节点** → | `<slot />` 放在标题 wrapper 内部（当前默认行为） |
| **混合场景（部分兄弟 + 部分子节点）** → | `<slot />` 放在外部（兄弟）。子节点场景通过把内容直接写在组件 children 中实现（不通过 slot），或在 slot 外加 wrapper 控制 |
| **存在任何实例的 content 是兄弟节点 + 无 margin 声明** → | 🔴 高风险——Agent 必须在共享组件模板中显式添加标题 wrapper 的 margin-bottom，并通过 prop 控制值 |

### 为什么这个维度必须独立于 CSS 属性交叉验证

CSS 属性交叉验证检查的是"值是否相同"（如 `padding-top` 在各个实例中分别是 104rpx / 112rpx）。
children 位置检查的是**结构关系**——元素 A 是元素 B 的父节点还是兄弟节点。
两者是不同维度的东西。在当前技能中，CSS 属性交叉验证已经完善（步骤 6b~6c），
但 children 位置没有任何分析步骤，导致 Agent 自由决策 slot 位置。

**这个维度必须在 Phase 2 完成的原因**：
- Phase 2 是唯一能同时看到所有实例的阶段
- 如果 Phase 2 不分析，Layer 2 组件 Agent 只看到一个源实例的 DOM 结构
- Phase 4 的审计脚本无法比对 DOM 树（需要语义理解，纯 Grep 不行）
- 唯一的防线就是 Phase 2 的事前分析 → Phase 3 Agent Prompt 强制指定 slot 位置

### 🆕 7a-补充2：共享组件内部固定子元素的 DOM 位置交叉验证（P1-B 防线）

> **来源**：2026-07-17 React→uni-app 迁移实战。PM-M10：PageHeader 的标题区在
> home 页面是 header 的直接子节点，在 admin 页面是 PageHeader children 内的内容。
> Agent 将标题放入一个不必要渲染的 flex bar 内，导致标题与搜索框未左对齐——偏差 60rpx。
>
> 现有的 children/slot 位置分析只覆盖了 `<slot />`，没有覆盖组件自身固定子元素。

**触发条件**：任何共享组件存在 ≥1 个**非 slot 的固定子元素**（如标题区、描述区、
图标区），且该元素在 ≥2 个源实例中位于不同的 DOM 位置。

**分析方法**：

对每个共享组件，除了分析 `<slot />` 位置外，还要分析组件模板中的每个固定子元素：

1. 列出组件的所有非 slot 直接子元素（如 PageHeader 的 titles 区）
2. 对每个固定子元素，回溯到每个源实例中该元素的源 DOM 位置
3. 如果所有实例中该元素都位于同一 DOM 路径 → 可安全地硬编码在组件模板中
4. 如果该元素在部分实例中不存在/位置不同 → 需要条件渲染或 props 控制

**交叉验证表格式**：

```markdown
## 固定子元素位置交叉验证 — <共享组件名称>

| 固定子元素 | 实例 1 中的源位置 | 实例 2 中的源位置 | 实例 N 中的源位置 | 判定 |
|-----------|-----------------|-----------------|-----------------|------|
| 标题区 (titles) | home: header div 直接子节点 | admin: children 内（由父组件传入） | libraries: header div 直接子节点 | 🔴 不一致 — 标题区不能放在条件渲染的 bar 内 |
| 副标题 (subtitle) | home: 存在 | admin: 存在 | word-detail: 不存在 | ✅ OK — 由 v-if 控制 |
```

**判定规则**：

| 情况 | 处理 |
|------|------|
| **所有实例中固定子元素都在同一 DOM 路径** → | 硬编码在组件模板中，位置固定 |
| **固定子元素在部分实例中不存在** → | 用 `v-if` 条件渲染，props 控制 |
| **固定子元素在 ≥2 个实例中位于不同 DOM 位置** → | 🔴 必须在 Phase 3 Agent Prompt 中**精确指定**该元素在模板中的位置（第几个子节点、在 slot 之前还是之后）。Agent 不允许自行决定 |
| **固定子元素在部分实例中是父组件的 children 传进来的** → | 考虑是否应该从固定子元素改为 slot，或保持固定在模板中但确保位置与所有实例一致 |

**与 slot 位置分析的关系**：

```
children/slot 位置差异化（现有）  → 回答: <slot /> 放在模板中的什么位置？
固定子元素位置交叉验证（新增）     → 回答: 非 slot 的固定子元素放在模板中的什么位置？
                                       这些元素在所有实例中的源位置是否一致？
```

**🔴 阻断规则**：固定子元素位置交叉验证矩阵未产出前，该共享组件的 Agent 不得启动。
此规则与 slot 位置差异化同等重要——两个维度任一未完成都不能启动 Layer 2。

> 📋 **真实案例（PM-M10）**：PageHeader 的标题区在 home 页面中是 header div 的直接
> 子节点（无 bar），在 admin 页面中是 PageHeader children 内部（有 bar）。这个差异
> 在 Phase 2 未被识别 → Agent 自由选择把标题放 bar 内 → 无返回按钮的页面也渲染了
> spacer → 标题与搜索框偏差 60rpx。如果在 Phase 2 执行了固定子元素交叉验证，
> 就会发现"标题区在所有实例中都在 header 根层级、bar 外部"，强制 Agent 把标题
> 放在 bar 外部——不会发生偏差。

### 🆕 7a-补充3：基础 CSS 属性差异化 — 尺寸/间距维度（P0-B 防线）

> **来源**：2026-07-17 React→uni-app 迁移实战。PM-M9：PrimaryButton 的 padding
> 和 font-size 在 auth（32rpx）和 admin（30rpx）之间有差异，但 Phase 2 差异化
> 参数表只覆盖了"语义属性"（variant, loading, disabled），遗漏了"基础 CSS 属性"。
> 组件硬编码 30rpx → auth 按钮偏小 2rpx。

**触发条件**：任何共享组件。

**问题本质**：

差异化参数清单的现有维度是"语义驱动"的——关注"这个按钮是什么颜色""这个空状态
显示什么图标"。但以下基础 CSS 属性在不同实例之间也可能有不同值：

| 属性类别 | 具体属性 | 容易遗漏的原因 |
|---------|---------|-------------|
| 盒模型 | padding, margin, width, height | 被认为是"组件内部固定样式"而非差异化参数 |
| 排版 | font-size, font-weight, line-height, letter-spacing | 同上 |
| 圆角 | border-radius | 同上 |
| 边框 | border-width, border-style | 同上 |

> 📋 **真实案例（PM-M9）**：PrimaryButton 的 padding 在源文件中有 3 种值（16px/15px/14px），
> 但差异化参数表没有"padding"这一行 → 组件用了统一的 30rpx → auth 页按钮偏小。

**分析方法**（在现有差异化参数表后追加）：

```markdown
## 基础 CSS 属性差异化 — <共享组件名称>

对每个直接渲染可见内容的非 slot 子元素，提取其基础 CSS 属性在所有实例中的值：

| 子元素 | CSS 属性 | 实例 1 值 | 实例 2 值 | 实例 3 值 | 判定 |
|--------|---------|----------|----------|----------|------|
| 按钮本体 | padding | 32rpx (auth) | 30rpx (admin-save) | 28rpx (AI-btn) | 🔴 不一致 → size prop |
| 按钮本体 | font-size | 32rpx (auth) | 30rpx (admin) | 30rpx (admin) | 🔴 不一致 → size prop |
| 按钮本体 | border-radius | 32rpx (全部) | 32rpx (全部) | 32rpx (全部) | 🟢 全部相同 → 硬编码 |
```

**提取方法**：

对每个共享组件，遍历其源实例，提取以下基础 CSS 属性的源值：
- `padding`（含四个方向）
- `font-size`
- `border-radius`
- `height` / `min-height`
- `width` / `max-width`

如果任何属性在 ≥2 个实例之间有**不同值**（偏差 > 2 最小单位），该属性必须转化为 prop 或变体参数。

**判定规则**：

| 偏差范围 | 判定 | 处理 |
|---------|------|------|
| ≤ 2 最小单位 | 🟢 可接受 — 硬编码 | 取多数值作为默认值 |
| > 2 最小单位 | 🔴 需转化为 prop | 增加 prop（如 `size`, `padding`, `fontSize`）或变体参数 |

**默认值选择**：

- **多数一致 + 少数例外** → 默认值 = 多数实例的公共值
- **各实例值完全不同** → **不设默认值**，标记为必填 prop
- **呈阶梯分布**（如 `16px/15px/14px`）→ 提取为枚举型 prop（如 `size: 'lg'|'md'|'sm'`）

**产出物**：

- 基础 CSS 属性差异化表（追加到差异化参数清单的 Markdown 表格中）
- 对应的 props 接口更新（`shared-component-instances.json` 的 `propsSchema` 增加新字段）

**🔴 阻断规则**：基础 CSS 属性差异化表未产出前，Layer 2 共享组件 Agent 不得启动。
此表是差异化参数清单的一部分——不是独立步骤。

### 汇总：<共享组件名称> 的 Props 接口

基于上表，推导出组件的 props 接口：

| Prop | 类型 | 默认值 | 说明 | 来源（哪些实例需要此值） |
|------|------|--------|------|------------------------|
| <prop-name> | <type> | <默认值或必填> | <说明> | <实例列表> |
```

**默认值选择原则**：

- **多数一致 + 少数例外** → 默认值 = 多数实例的公共值。例外的实例通过 prop 覆盖。
  **禁止**从单一实例取默认值而不检查其他实例——例如从 home 页取 `backgroundColor: transparent` 作为 PageHeader 的默认值，会导致所有需要背景的页面视觉错误。
- **各实例值完全不同** → **不设默认值**，标记为必填 prop。
  例如 `title` — 每个页面都不同，必须设为必填。
- **各实例值有 2-3 种不同值** → 提取为枚举类型 prop 或自定义值 prop。
  在 props 注释中列出所有已知值。

**输出到 Phase 3 复用约束的格式增强**：

差异化参数清单的结论必须**直接注入**每个页面 Agent 的 Prompt。
格式从笼统的"必须使用 PageHeader"升级为精确到本页面的 props 配置：

```
复用约束 — <共享组件名称> 使用规范：
- ✅ 必须使用 <PageHeader> 组件
- ⚠️ 必须设置以下 props（根据本页面的实际值）：
  - title: "单词库"（本页面的标题）
  - showBack: false（本页面不需要返回按钮）
  - backgroundColor: "rgba(247,249,252,0.94)"（本页面需要半透明背景）
- ❌ 本页面不需要的 props：
  - rightSlot（本页面无右侧操作区）
- 🚫 禁止手写替代实现
```

**每个页面 Agent 收到的是**：从差异化参数清单中筛选出的"本页面专属片段"——不是整个清单。

### 为什么差异化参数清单不可或缺

没有此步骤时：
- 共享组件的默认值来自"第一个被分析的实例"或 Phase 2 的随意选择
- 例如 PageHeader 的 `backgroundColor` 如果从 home 页取了 `transparent`，
  则 profile、libraries 等页面全部失去 header 背景色
- Phase 4 的存在性审计全部通过（PageHeader 组件确实被使用了），
  但视觉已严重偏差——这是**最隐蔽的保真度损失**之一

> 📋 **真实案例**：某 React → uni-app 迁移中，PageHeader 组件在 7 个页面中使用，
> 但硬编码的背景色只匹配 3/7 的页面。其余 4 个页面的 header 背景色全部错误。
> 所有审计步骤均未发现此问题——复用审计只检查"是否用了 PageHeader"，
> 不检查"PageHeader 在每个页面中是否正确配置了差异化参数"。

### 7a-输出增强 🆕：差异化参数 → 机器可读 JSON（P0-C 阻断）

差异化参数清单的 Markdown 表格**必须同时产出 JSON 格式**。
Phase 3 Layer 2 交叉验证矩阵和每个页面 Agent 的 Prompt §6（复用约束）将引用此 JSON。

```json
{
  "PageHeader": {
    "importPath": "@/components/PageHeader.vue",
    "instances": {
      "pages/home/home.vue": {
        "props": { "title": "用物理意象\n读懂英语", "subtitle": "认知英语词典", "bgType": "page", "paddingTop": 112, "showBack": false },
        "sourceEvidence": "HomeView.tsx:29 — padding-top:56px, background:rgba(255,255,255,0.9)"
      },
      "pages/libraries/libraries.vue": {
        "props": { "title": "选择词库", "subtitle": "词库", "bgType": "white", "paddingTop": 104, "showBack": false },
        "sourceEvidence": "LibrariesView.tsx:20 — padding:52px 24px 20px"
      },
      "pages/profile/profile.vue": {
        "props": { "title": "个人中心", "subtitle": "我的", "bgType": "white", "paddingTop": 104, "showBack": false },
        "sourceEvidence": "ProfileView.tsx:69 — padding:52px 24px 20px, bg:rgba(255,255,255,0.9)"
      }
    },
    "propsSchema": {
      "title": { "type": "string", "required": true },
      "subtitle": { "type": "string", "default": "" },
      "showBack": { "type": "boolean", "default": false },
      "backLabel": { "type": "string", "default": "返回" },
      "bgType": { "type": "'white'|'page'|'none'", "default": "white" },
      "paddingTop": { "type": "number", "default": 104 }
    }
  }
}
```

**输出路径**：`phase2-output/shared-component-instances.json`

**🔴 阻断规则**：此 JSON 未产出前，Layer 2 共享组件 Agent 不得启动。
这是交叉验证矩阵的唯一数据来源——没有它，Agent 就只能基于"第一个看到的实例"
设置默认值，导致其余实例值错误。

Phase 3 每个页面 Agent 的 Prompt 将拿到它专属的 props 配置片段——
不是整个 JSON，而是该页面在 `instances` 中对应的那一条。

### 7b. 样式复用分析

遍历 Phase 1 设计 Token 和所有页面的样式定义，识别重复的 CSS 属性组合：

```markdown
## 样式复用分析

### 识别结果

| 复用模式 | 出现次数 | 值 | 建议 |
|---------|---------|---|------|
| header padding + 背景 | 6 | `padding: 104rpx 48rpx; background: rgba(255,255,255,0.9)` | 提取为 SCSS 变量 `$header-padding` + `$header-bg` |
| 吸顶 header blur | 5 | `position: sticky; top: 0; z-index: 10; backdrop-filter: blur(32rpx)` | 提取为 SCSS mixin `@mixin sticky-header` |
| section 标签 | 8+ | `font-size: 22rpx; font-weight: 600; color: #9CA3AF; letter-spacing: 4rpx; text-transform: uppercase` | 提取为全局 CSS 类 `.section-label` |
| 卡片阴影 | 10+ | `background: #fff; border-radius: 32-48rpx; box-shadow: 0 4rpx 24-32rpx rgba(0,0,0,0.04-0.05)` | 提取为 SCSS mixin `@mixin card` |
| 主按钮 | 8+ | `background: #2563EB; color: #fff; border-radius: 32rpx; font-weight: 600; padding: 28-32rpx` | 提取为全局 CSS 类 `.btn-primary` |
| focus 输入框样式 | 5+ | `border-color: #2563EB; background: #fff` | 提取为全局 CSS 类 `.input-focused` |
| 返回按钮 | 4 | `color: #6B7280; font-size: 28rpx; display: flex; align-items: center; gap: 12rpx` | 合并到 PageHeader 组件内部 |

### 实施方式
- 提取为 SCSS 变量 → 写入 `uni.scss` 或目标框架的全局变量文件
- 提取为 mixin → 写入全局样式文件，各页面 `@include`
- 提取为全局 CSS 类 → 写入 App.vue 的非 scoped style 或全局样式文件
```

### 7c. 逻辑复用分析

遍历 Phase 1 交互清单和数据流图，识别跨页面重复的业务逻辑：

```markdown
## 逻辑复用分析

### 识别结果

| 复用模式 | 出现次数 | 出现位置 | 建议 |
|---------|---------|---------|------|
| `navigateTo({name:'wordDetail', wordId})` | 6+ | home, libraries, library-words, word-detail, admin | 已由 router.ts 封装 ✅ |
| `mockWords.find(w => w.id === wordId)` | 3 | word-detail, admin, home | 提取为 `utils/helpers.ts` → `getWordById(id)` |
| `mockLibraries.find(l => l.id === libraryId)` | 4 | word-detail, home, libraries, admin | 提取为 `utils/helpers.ts` → `getLibraryById(id)` |
| `getPosColor(pos)` | 2 | word-detail, admin/WordEditForm | 提取为 `utils/helpers.ts` → `getPosColor(pos)` |
| focus/blur 边框切换 | 6+ | home, auth, admin 各表单 | 提取为 composable `useInputFocus()` |
| 搜索过滤 `words.filter(w => w.word.includes(q) \|\| w.coreMeaning.includes(q))` | 2 | home, admin/WordManager | 提取为 `utils/helpers.ts` → `filterWords(query, words)` |

### 实施方式
- 纯函数 → 提取到 `utils/helpers.ts`
- 有状态的逻辑（如 focus 切换）→ 提取为 composable/hook
- 已在 router.ts 中封装的 → 确认所有页面都已使用，无内联绕过
```

### 7d. 复用分析产出物

复用分析完成后，需要产出以下内容，直接进入 Phase 3 的生成流程：

1. **更新目标项目目录结构**：在 Phase 2 的文件映射表中增加新的共享组件行
2. **更新依赖拓扑排序**：共享组件提升到 Level 2（基础 UI 组件层），先于页面生成
3. **生成"复用约束"清单**：Phase 3 每个页面 Agent 的 Prompt 中必须包含：
   ```
   复用约束（优先使用已有共享抽象，禁止手写重复代码）：
   - 页头：必须使用 <PageHeader> 组件，不要手写 .header 样式
   - 空状态：必须使用 <EmptyState> 组件，不要手写空状态 div
   - section 标签：必须使用全局 CSS 类 .section-label，不要手写内联 style
   - 卡片的 box-shadow 和 border-radius：使用 SCSS mixin @include card
   - header padding-top 和背景色：使用 SCSS 变量 $header-padding, $header-bg
   - focus 输入框：使用 .input-focused 类绑定，不要手写 onFocus/onBlur 内联 style
   ```
4. **新增目标文件**：`utils/helpers.ts`、composable 文件等

### 7e. 复用分析的局限性

复用分析是 Phase 2 的最佳努力——它基于 Phase 1 的静态分析结果。
- 如果 Phase 1 未完整记录所有页面的结构，可能会遗漏
- 如果两个模式的相似度在 80-90% 之间，可能需要人工判断是否合并
- 过度抽象也有成本——如果提取后组件接口过于复杂，反而降低可维护性
- **原则：有疑问时宁可提取**——Phase 3 的 Agent 收到"用 X"的指令但 X 不适用时
  会自行判断回退；但如果没收到指令，就一定会手写


### 7f. 静态资源清单（Phase 3 构建前置条件）

Phase 3 的代码 Agent 生成 .vue / .ts / .scss 文件，但以下静态资源不在 Agent 能力范围内——它们需要用户手动提供（图标字体、tabBar 图标、PNG 回退图）。如果 Phase 2 不提前规划这些资源的占位需求，Phase 3 生成的 SCSS 引用会指向不存在的文件，npm run build CSS 编译阶段直接失败。

#### 资源来源分类

| 来源 | 文件类型 | 示例 | 谁提供 |
|------|---------|------|-------|
| 图标方案 | .ttf/.woff2 | iconfont.ttf | 用户 |
| tabBar 替代 | .png | pages.json 引用的 tab 图标 | 用户 |
| 平台回退 | .png | PhysicalImage SVG到PNG 回退 | 用户 |

#### 清单输出格式

在 Phase 2 映射蓝图中追加此表：

| 资源文件 | 用途 | 引用位置 | 占位方案 |
|---------|------|---------|---------|
| src/static/fonts/iconfont.ttf | 图标字体 | uni.scss @font-face | 最小合法 TTF 占位 |
| src/static/images/tab-*.png | tabBar 图标 | pages.json tabBar.list | 1x1 透明 PNG 占位 |
| src/static/images/type.png | PhysicalImage 回退 | PhysicalImage.vue 条件编译 | 1x1 透明 PNG 占位 |

#### 接续到 Phase 3/4

| 阶段 | 动作 |
|------|------|
| Phase 3 Layer 2.5 | 为清单每项创建最小占位文件 |
| Phase 4 Step 1a-1 | 构建报 file-not-found 时回此清单补占位 |
| 最终报告 | 列出待用户补充的静态资源 |

> 实战教训：某迁移中 npm install 和 npm run dev 均通过（Vite 按需编译），但 npm run build 报 Cannot find module iconfont.ttf——生产构建全量编译所有 SCSS。Layer 2.5 占位文件即可防止此问题。

## 步骤 8：框架必备文件校验 🆕（防漏保底）

Phase 2 的逐文件映射表是 Phase 3 代码生成的**唯一依据**——不在表上的文件不会被生成。
但某些文件是目标框架的硬性要求，不来自任何源文件的映射（如 uni-app 的 `index.html`）。
如果在映射表中遗漏这些文件，Phase 3 结束后项目会因为缺少入口文件而无法启动。

### 8a. 校验流程

1. 打开 `references/frameworks/<目标框架>.md`，找到"目标框架必备文件清单"章节
2. 逐一检查每个 🔴 必备文件是否出现在逐文件映射表的"目标文件"列中
3. 对不在映射表中的必备文件，**显式追加**一行映射：

```markdown
| N+1 | — (框架要求) | <必备文件路径> | 🟢 低 | **[REQUIRED]** 框架必备文件。内容参考框架模板生成 |
```

4. 必备文件追加完毕后，**将该文件补充到依赖拓扑排序中**（通常放在 Level 6/7/8 配置层级）

### 8b. 校验输出格式

```markdown
## 框架必备文件校验结果

| 必备文件 | 在映射表中？ | 处理 |
|---------|----------|------|
| index.html | ❌ 缺失 | ✅ 已追加到映射表 #N |
| pages.json | ✅ #21 | — |
| manifest.json | ✅ #22 | — |
| main.js | ✅ #17 | — |
| App.vue | ✅ #18 | — |
| uni.scss | ✅ #23 | — |
| vite.config.ts | ✅ #20 | — |
| package.json | ✅ #19 | — |
| tsconfig.json | ❌ 缺失 | ✅ 已追加到映射表 #N+1 |

校验结果：2 个文件追加，现在映射表完整覆盖所有框架必备文件。
```

### 8c. 为什么这一步不可或缺

Phase 3 的 Agent 只知道映射表里的文件。Agent 没有"项目全局观"，
不会主动创建框架要求的入口文件。缺少 `index.html` → 服务器 404；
缺少 `pages.json` → uni-app 编译失败。这些文件不会从任何源文件映射而来，
只能靠这个校验步骤保证不遗漏。

---
	
## 进入第三阶段前的验证

提交给用户之前：

- [ ] 每个源文件都有目标文件分配（或明确的"不移植"原因）
- [ ] 第一阶段中的每个交互 ID 至少有一个目标文件负责它
- [ ] 所有六个映射类别都有带代码示例的具体规则
- [ ] 无法映射的情况都有文档化的替代方案
- [ ] **全局样式强制规则表已生成，包含审计 Grep 模式和适用文件**
- [ ] **复用分析已完成：组件复用、样式复用、逻辑复用三类均有识别结果**
- [ ] **复用分析产出了"复用约束"清单，可直接注入 Phase 3 Agent Prompt**
- [ ] **复用分析新增的共享组件已加入依赖拓扑排序**
- [ ] **🔴 框架必备文件校验已通过：所有 🔴 必备文件都在映射表中**
- [ ] **🆕 CSS block pre-generation 已完成（当决策树 4i 命中时）**
- [ ] **🆕 import 白名单 JSON 已生成**
- [ ] 目标项目结构遵循目标框架的约定（而非源框架的约定）

---

## 步骤 8：CSS Block Pre-generation 🆕（P0-G）

> **触发条件**：决策树步骤 4i 命中（源项目使用内联 style 对象）。
> CSS Modules / Tailwind / 组件库源项目跳过此步骤。

### 8a. 为什么 LLM Agent 不能可靠地生成精确 CSS

这是两次 React → uni-app 迁移实战中最关键的教训。第一次 463 处 CSS diff，
第二次同样有大量 CSS 偏差。即便 `design-values.json` 已生成并注入 Agent Prompt §5b，
且 §5b 写了"禁止通过 SCSS 变量间接引用，使用精确值"——Agent 仍然输出偏离的 CSS 值。

LLM 生成 CSS 的内在行为模式：
1. 识别语义模式（"这是一个卡片"）→ 2. 匹配已知变量（"卡片用 $card-p"）→ 3. 填充值
步骤 2 天然倾向于"语义近似"而非"数值精确"。**给 Agent 看精确值表不能阻止它估算——**
**只有不给它估算的机会。**

### 8b. 执行方式

```bash
node .claude/skills/frontend-refactor/scripts/generate-css-blocks.cjs \
  --design-values <Phase2产出>/design-values.json \
  --file-mapping <Phase2产出>/file-mapping.json \
  --target-framework <目标框架> \
  --output <Phase2产出>/css-blocks/
```

### 8c. 产出格式

每个目标文件一个 `.css-block`：包含该文件所有静态 CSS 声明（class 定义、px→rpx 换算后的
精确值、条件编译包裹）。Agent 的职责从"编写 CSS"简化为"粘贴 CSS 块"。

### 8d. 产出物 + 阻断规则

**🔴 阻断**：`css-blocks/` 目录未产出前，Layer 3 页面 Agent 不得启动。
仅当决策树 4i 命中时需要。

---

## 步骤 9：Per-File Import Whitelist Generation 🆕（P0-F 防线前置）

> **来源**：2026-07-17 迁移实战。auth.vue 模板使用 `<PrimaryButton>` 但 script 忘记
> `import PrimaryButton`。构建/TS/Console 三者均不报错 → 按钮完全消失。
> 唯一有效防线：Phase 2 预生成每文件的 import 白名单，Agent 自我核对。

### 9a. 生成逻辑

从 Phase 2 映射表为每个目标文件推导所需的全部 import 语句：
模板中 PascalCase 标签 → 对应组件 import、脚本中工具函数/composable/store 调用 → 对应 import、
框架生命周期钩子 → 从框架包 import。

### 9b. 产出格式

```json
// <Phase2产出>/import-whitelists.json
{
  "pages/auth/auth.vue": {
    "mandatoryImports": [
      { "name": "PrimaryButton", "statement": "import PrimaryButton from '@/components/PrimaryButton.vue'", "usedIn": "template: <PrimaryButton>" },
      { "name": "onLoad", "statement": "import { onLoad } from '@dcloudio/uni-app'", "usedIn": "script: onLoad(...)" }
    ]
  }
}
```

### 9c. 注入 Phase 3 Agent Prompt

此 JSON 直接写入 Agent Prompt 第四节 b-2。Agent 返回前必须逐条自检。缺少任何一条 = 拒绝提交。
- [ ] 生成的依赖顺序可以从映射表中推算出来
