# 第三阶段 — 代码生成指南

## 目标

生成目标项目的每一个文件，最终得到一个完整、可运行的应用程序，其交互、样式和导航与源项目的匹配度达到 95% 以上。

---

## 核心原则：按依赖顺序生成

文件必须按照依赖顺序生成。一个文件只有在它导入的所有文件都生成完毕后才能被生成。这一点不可妥协，因为每个 agent 都需要其依赖项的确切接口/类型作为输入上下文。

## 步骤 1：计算生成层级

根据第二阶段文件映射表，计算依赖图：

```
对于每个目标文件：
  - 列出它需要的所有导入
  - 这些导入定义了它所依赖的文件
  - 层级 = max(依赖层级) + 1
```

### 标准层级分配

| 层级 | 内容 | 依赖项 | 🔴 执行模式 |
|-------|---------|-------------|-----------|
| 0 | 类型定义（`types.ts`、接口、枚举） | 无 | 可并行 |
| 1 | 常量、模拟数据、工具函数 | 层级 0 | 可并行 |
| 2 | 基础 UI 组件（Button、Card、Input 等） | 层级 0，可能含层级 1 | **🔴 必须串行**（见下方规则） |
| **2.5** 🆕 | **静态资源占位**（iconfont、tabBar 图标、图片回退） | — | **在 Layer 3 生成前必须就位** |
| 3 | 叶子页面组件（没有子页面的页面） | 层级 0-2 | 可并行（须 Layer 2 锁定后） |
| 4 | 组合页面组件（使用其他页面的页面） | 层级 0-3 | 可并行（须 Layer 3 完成后） |
| 5 | 应用入口、路由配置、布局 | 层级 0-4 | 串行 |
| 6 | 配置文件（package.json、构建配置、全局样式） | — | 可并行（使用已验证模板） |

### 🔴 层级 2 执行规则（不可违反）

共享组件是单点故障源——一个组件的错误会传播到所有引用它的页面。层级 2 不适用
"同层可并行"规则。

### 🔴 生成前步骤：共享组件交叉验证矩阵（P0-C）

**在生成任何一个共享组件之前**，必须基于 Phase 2 的 `shared-component-instances.json`
和 `design-values.json` 产出交叉验证矩阵。

对每个共享组件：
1. 从 `shared-component-instances.json` 提取所有实例的精确 props 值
2. 从 `design-values.json` 提取每个实例涉及的 CSS 属性-值对
3. 逐属性比对所有实例 → 构建交叉验证矩阵：

```
PageHeader 交叉验证矩阵：

| CSS 属性 | home | libraries | profile(已登录) | word-detail | admin | 判定 |
|----------|------|-----------|----------------|-------------|-------|------|
| padding-top | 112rpx(56px) | 104rpx(52px) | 104rpx(52px) | 104rpx(52px) | 104rpx(52px) | 多数=104rpx → 默认值104rpx，home传112 |
| background | rgba(255,255,255,0.9) | rgba(255,255,255,0.9) | rgba(255,255,255,0.9) | rgba(247,249,252,0.92) | rgba(247,249,252,0.94) | 2种值 → 必须作为prop，禁止默认值 |
| backdrop-filter blur | 16px | 16px | 16px | 16px | 16px | 全部相同 → 硬编码 |
```

判定规则：
- **全部实例值相同** → 硬编码在组件内部
- **多数实例值相同，少数例外** → 默认值取多数值，例外通过 prop 覆盖
- **各实例值完全不同（≥ 2 种值）** → **禁止设默认值**，标记为必填 prop

**交叉验证矩阵未产出前，禁止启动 Layer 2 任一 Agent。**

1. **串行生成**：每个层级 2 组件 Agent 使用 `run_in_background: false`（同步等待返回）
2. **生成后立即验证**：组件生成后，读取文件并 Grep 检查关键 CSS 值是否与交叉验证矩阵
   一致（字号、背景色、布局方向、padding）
3. **全实例覆盖验证**：逐个检查 `shared-component-instances.json` 中的每个实例——
   该实例的精确值是否可以通过 props 正确配置到此组件？
3. **🆕 全实例 DOM 结构清单（P0-G — slot/children 位置验证）**：对于通过 `<slot />` 或
   children 接收内容的共享组件，**必须**在生成代码之前完成以下步骤：

   a. 从 Phase 2 的"children/slot 位置差异化清单"（`phase2-mapping.md` 步骤 7a-补充）
      中提取该组件的每个实例的源 DOM 结构——**内容在源文件中的父容器是什么，
      与标题区的 DOM 关系是兄弟还是子节点**。
   b. 判定 slot 应该放在组件模板的标题 wrapper **内部**（子节点）还是**外部**（兄弟）：
      - 所有实例 content 都是兄弟节点 → slot 放在外部
      - 所有实例 content 都是子节点 → slot 放在内部
      - **混合场景** → slot 放在外部（兄弟），子节点场景通过直接写在 children 中实现
   c. 如果 slot 放在外部，必须在标题 wrapper 上显式声明 `margin-bottom`——
      值从多数实例的共同值中提取，例外实例通过 prop 覆盖。
   d. **此清单必须在 Layer 2 Agent Prompt 中明确给出**——Agent 不能自行推断 slot 位置。

   > **来源**：2026-07-17 迁移中，PageHeader 的 `<slot />` 被 Agent 放在标题 wrapper 内部
   > （Agent 只看到 AdminView 实例中的 children=子节点语义）。但 HomeView 的搜索栏
   > 在源文件是标题 wrapper 的兄弟节点。结果搜索框紧贴标题文字下方——间距消失。
   > 全部 CSS 属性值正确、Phase 4 7 组审计全部通过、人眼才发现问题。
4. **锁定清单**：所有组件通过后，提取"锁定清单"——每个组件的导入路径、完整 props
   签名（名称、类型、默认值、来源实例列表）、已内置的固定行为
5. **锁定清单注入**：锁定清单写入层级 3 页面 Agent Prompt 的第四节 b

锁定清单格式（增强——含来源实例）：

```
## 已锁定共享组件清单（层级 3 Agent 必须据此使用）

| 组件 | 导入路径 | 关键 Props | 默认值 | 已内置行为（禁止重复实现） |
|------|---------|-----------|--------|------------------------|
| PageHeader | @/components/PageHeader.vue | title/subtitle/showBack/backLabel/backgroundColor/hasBlur | bg=rgba(255,255,255,0.9), hasBlur=true | sticky 定位, z-index, H5 条件编译 backdrop-filter, 返回按钮 |
| EmptyState | @/components/EmptyState.vue | icon/text/subText/iconSize/iconColor/padding | icon='info', padding='120rpx 0' | 居中 flex 列布局, 图标 opacity:0.3 |
| WordCard | @/components/WordCard.vue | word/showLibraryTag/truncateLength/variant | variant='default', truncateLength=0 | search: flex row+右箭头; default: column+可选 badge |
```

---

## 步骤 2：Agent 提示词模板

对于每个文件，启动一个子 agent。提示词包含九个部分（前三部分是核心上下文，第四到八部分是约束注入，第九部分是输出规范）：

### 第一节：角色与任务

```
你是一名资深的 <target-framework> 开发者。你的任务是将单个源文件移植到目标框架，
保持 100% 的视觉和行为保真度。
```

### 第二节：源代码

```
以下是要移植的完整源文件：

```<language>
<逐字复制的源文件内容>
```

请特别注意：
- 每个事件处理函数（onClick、onChange、onSubmit 等）
- 每个条件渲染（if、&&、三元表达式）
- 每个内联样式对象（颜色、间距、排版）
- 每个状态变量及其变化方式
```

### 🔴 第二节补充：反虚构约束（Anti-Fabrication — P0）

以下规则是强制性的，违反任一条 = Phase 4 🔴 Blocker：

1. **每个 DOM 元素必须有源对应** — 你在目标模板中创建的每一个 `<view>`、`<text>`、
   `<image>`、`<input>` 元素，必须在源文件的 JSX 中存在对应的元素。
   禁止添加源中不存在的 wrapper 层、装饰元素、或"看起来更好"的额外结构。

2. **每个 CSS 属性必须有源对应** — 你在 scoped style 中写的每一条 CSS 声明，
   必须在源文件的 `style={{}}` 对象中存在对应的属性和值。
   值必须精确（允许的单位换算：px→rpx ×2，特殊情况见 §5b 换算规则）。
   禁止添加源中不存在的 margin、padding、gap 或任何"微调"属性。

3. **每个文本内容必须有源对应** — 每个 `<text>` 节点的文本内容必须与源中
   对应元素的文本/children 完全一致。禁止添加"提示"、"说明"、"占位"文字。

违反示例（基于真实迁移案例）：
- ❌ 源空状态：纯文本"未找到相关单词" → 目标凭空加了 `&#xe006;` User 图标
- ❌ 源 header：padding-top:56px → 目标默认值：52px（组件默认值覆盖了精确值）
- ❌ 源卡片阴影：`0 2px 12px rgba(0,0,0,0.04)` → 目标用了 WordCard 的硬编码
  `0 4rpx 24rpx rgba(0,0,0,0.04)` — blur 偏了 0（巧合对），但同一组件另一个
  实例阴影 `0 2px 16px rgba(0,0,0,0.05)` → 正确 `0 4rpx 32rpx`，实际产物
  `0 4rpx 24rpx` — blur 偏了 8rpx。

### 第二节半：源文件 DOM 树清单（生成前自检 — 🔴 不可跳过）

在开始写目标代码之前，你必须完成以下清单。此清单的输出将作为
Phase 4 DOM 结构审计的基准。

逐行阅读源文件 JSX，列出每个渲染的元素及其嵌套关系：

```
元素清单（示例）：
1. <div> (line X) — 根容器，minHeight:100vh, background:#F7F9FC
   ├── <div> (line Y) — header 区域，padding:56px 24px 24px, backdropFilter:blur(16px)
   │   ├── <p>  (line Z) — 副标题文本: "认知英语词典"，fontSize:12px, color:#9CA3AF, letterSpacing:2px
   │   ├── <h1> (line W) — 主标题文本: "用物理意象\n读懂英语"，fontSize:26px, fontWeight:700
   │   └── <div> (line V) — 搜索栏容器，position:relative
   │       ├── <SearchIcon /> (line U) — 搜索图标，size=18px, color:#9CA3AF
   │       └── <input> (line T) — 搜索输入框，onChange/onFocus/onBlur
   ├── <div> (line S) — 搜索结果区域 (条件: query.trim() 非空)
   │   ├── <div> (空状态) — 条件: results.length===0
   │   │   ├── <p> — "未找到相关单词"
   │   │   └── <p> — "可在管理后台添加新词汇"
   │   └── <div> (结果列表) — 条件: results.length>0
   │       └── <button> × N — 搜索结果卡片
   └── <div> (line R) — 默认内容 (条件: !query.trim())
       ├── <div> (今日一词区域)
       │   ├── <div> (标签行: Sparkles icon + "今日一词")
       │   └── <button> (渐变卡片: 核心物理意象 + word + phonetic + meaning + 查看完整解析)
       └── <div> (全部词汇区域)
           ├── <div> (标题行: "全部词汇" + "N 个")
           └── <div> (列表)
               └── <button> × N — 单词卡片 (word + phonetic + meaning + library badge + ArrowRight)
```

此清单是你写模板时的唯一参照——**不要在清单之外添加任何元素**。
如果某个元素在源文件中不存在，就不要在目标中创建它。

### 🔴 第二节半-共享组件：全实例 DOM 结构清单（Layer 2 Agent 专用，P0-G）

> **来源**：2026-07-17 `figma-prototype` → `english-dict-uni` 迁移实战。PageHeader 的
> `<slot />` 被 Agent 放在标题 wrapper 内部——因为 Agent 只看到 AdminView 实例中 children
> 是子节点。但 HomeView 的搜索栏是标题 wrapper 的兄弟节点。slot 位置错误导致 home.vue
> 的搜索框紧贴标题文字下方——间距消失。**CSS 值全部正确，7 组审计全部通过，但布局已**
> **静默偏离。** 此清单是预防此类"slot 位置致死"问题的唯一手段。

Agent 在生成共享组件之前，必须完成以下清单。

#### 适用范围

**仅适用于通过 `<slot />`、具名 slot 或 children prop 接收内容的共享组件**。
纯展示组件（如 SectionLabel）不需要此清单。

#### 步骤

1. **从 Phase 2 的 `shared-component-instances.json` 提取所有实例的信息**。
   对于需要验证的共享组件，该文件中的每个实例应包括：
   - 目标文件路径
   - 传递给该组件的 props 值
   - `sourceEvidence`（源文件行号和上下文）

2. **从源文件中逐实例提取 children/slot 内容的 DOM 位置**：
   对于每个使用该组件的页面，在源 JSX 中找到组件使用位置，提取其 children 所在的
   父容器及其与标题/其他子组件的 DOM 关系：

   ```
   PageHeader 全实例 DOM 结构清单（示例）：

   实例 1: home (HomeView.tsx:28-80)
     使用方式: <PageHeader> 等价 — inline header div
     children 内容: SearchBar (搜索栏)
     children 的父容器: header 根 div ← 与标题 wrapper 同层级
     与标题的 DOM 关系: 🔴 兄弟节点
     间距来源: 标题 wrapper 的 marginBottom:20px (40rpx)
     源证据:
       <div style="...header...">
         <div style="marginBottom:20px">          ← 标题 wrapper
           <p>认知英语词典</p>
           <h1>用物理意象...</h1>
         </div>
         <div style="position:relative">           ← 搜索栏 = 兄弟节点
           <Search/> <input/>
         </div>
       </div>

   实例 2: admin/overview (AdminView.tsx:151-156)
     使用方式: <PageHeader><p/><h1/></PageHeader>
     children 内容: 纯文本（subtitle 段落 + 标题 h1）
     children 的父容器: PageHeader 内部 — 与标题 wrapper 同内容
     与标题的 DOM 关系: 🟢 子节点（文本自然位于 wrapper 内）
     源证据:
       <PageHeader>
         <p>管理后台</p>
         <h1>数据概览</h1>
       </PageHeader>

   实例 3: libraries (LibrariesView.tsx:19-32)
     ...（逐一列出所有实例）
   ```

3. **判定**：

   | 判定条件 | 结论 | slot 放置位置 |
   |---------|------|-------------|
   | 任何实例的 content 是标题 wrapper 的**兄弟节点** | 混合场景 | `<slot />` 必须放在标题 wrapper 的**外部**（兄弟位置）。标题 wrapper 显式声明 `margin-bottom` 提供间距 |
   | 全部实例的 content 都是子节点 | 一致场景 | `<slot />` 放在标题 wrapper 内部 |

4. **写入 Agent Prompt**：
   上述判定结论必须**明确写入 Layer 2 Agent 的 Prompt**——Agent 不能自行推断。
   Prompt 中应包含：
   - "你的 `<slot />` 必须放在标题 wrapper 的**外部**（兄弟位置），因为 HomeView 实例的搜索栏是兄弟节点。标题区 wrapper 需要显式 `margin-bottom` 来提供 slot 前的间距。"
   - 或： "你的 `<slot />` 应放在标题 wrapper 内部，所有实例的 children 都是标题的子节点。"

5. **标记组件 Props 接口影响**：
   如果 slot 放在外部且需要 `margin-bottom`，应从多数实例的共同值中提取默认值，
   并增加一个 prop（如 `contentGap`）允许例外实例覆盖。

6. **此清单产出写入锁定清单**：
   锁定清单中共享组件的"已内置行为"列需追加此决策。
   例如 PageHeader 的锁定清单：`已内置行为: sticky, z-index, backdrop-filter, 返回按钮, **slot 在标题 wrapper 外部（兄弟位置），标题 wrapper 有 margin-bottom:40rpx**`

#### 为什么此清单不可或缺

| Agent 的默认行为 | 在什么条件下会错 | 后果 |
|-----------------|---------------|------|
| 从 AdminView 的 PageHeader 源定义看，children 是子节点 → Agent 把 `<slot />` 放在标题 wrapper 内部 | HomeView 的搜索栏在源中是兄弟节点——但 Layer 2 Agent 不知道 HomeView 的用法 | 搜索栏紧贴标题文字，丢失 20px 垂直间距。CSS 属性存在性/值精确性/组件注册完整性 → **全部通过审计** |

**这是"信息壁垒致死"的典型案例**——Layer 2 Agent 只知道共享组件的内部定义（AdminView），
不知道其他页面如何使用它。此清单用 Phase 2 的数据（全实例分析）打破这个壁垒。

### 第三节：本文件的迁移规则

```
应用以下具体的映射规则：

组件映射：
- <源模式> → <目标模式>
- ...

事件映射：
- <源事件> → <目标事件>
- ...

样式映射：
- <源样式方案> → <目标样式方案>
- ...

路由：
- <源导航方式> → <目标导航方式>
- ...

数据：
- <源数据访问方式> → <目标数据访问方式>
- ...
```

### 第三节 b：DOM 结构保持约束 🆕（Structural Fidelity）

```
⚠️ 关键约束：目标文件的 DOM 层级结构必须与源文件保持一一对应。

CSS 属性值的精确性可以通过 Phase 4 审计发现和修复，但 DOM 结构偏差
（元素嵌套层级、兄弟顺序、flex/grid 对齐方式）无法通过 Grep 审计发现。

规则：
1. **元素父子关系必须保持**：源文件中元素 A 是元素 B 的父节点，
   则目标文件中 A 必须是 B 的父节点。不要合并层级或展平嵌套。
2. **兄弟顺序必须保持**：源文件中元素 A 在元素 B 之前，目标中也必须如此。
   不要重新排列同一层级的元素顺序。
3. **布局方向必须保持**：
   - 源文件的 flex-direction: row → 目标的 flex-direction 必须为 row
   - 源文件的 flex-direction: column → 目标的 flex-direction 必须为 column
4. **对齐方式必须保持**：
   - 源文件的 align-items: flex-start → 目标为 align-items: flex-start
   - 源文件的 align-items: center → 目标为 align-items: center
   - 不要因为"看起来更整齐"而改变对齐方式
5. **🆕 HTML 元素 → `<text>` 的 display 映射**（仅适用于 uni-app/Taro 目标）：
	   - 将源 HTML 元素映射为 `<text>` 时，**display 值必须与源元素的实际 display 值一致**：
	     • 源 `<p>`/`<h1>`~`<h6>`（block）→ CSS 显式 `display: block`
	     • 源 `<span>` 无显式 display（inline）→ 不写 display 属性
	     • 源 `<span style="display:inline-block">` → CSS 显式 `display: inline-block`
	   - 🔴 禁止对源为 inline/inline-block 的元素写入 `display: block`——NC-14 反向陷阱（PM-M8）
	   - 理由：`<text>` 默认 `display: inline`，与 `<p>`/`<h1>` 的 `block` 不同。
	     缺少 `display: block` 会导致：(a) nowrap+ellipsis 截断失效
	     (b) 后续兄弟元素不换行——挤在同一行 (c) margin-top/bottom 不生效
	     但多余的 `display: block`（对 inline 元素）同样有害——元素从内容宽度变为父容器全宽
6. **避免不必要的嵌套层级**：
   - 源文件中只有一个容器包裹内容 → 目标也只有一个容器
   - 不要在目标中增加额外的 wrapper 层（如 .page-body 包裹 .content 再包裹实际内容）
   - 如果目标框架要求额外层级（如 <scroll-view>），必须在代码注释中说明
7. **原生组件闭合约束 🆕**（仅适用于 uni-app/Taro 等跨平台目标）：
   - `<input>` / `<Input>` 必须使用闭合标签 `<input ...></input>`，
     不得使用自闭合 `<input ... />`（NC-02）
   - `<textarea>` / `<Textarea>` 必须有 `auto-height` 属性（NC-03）
   - 所有原生组件（input/textarea）必须有显式 `height` 或 `min-height`（NC-01/NC-06）
   - 违反以上任一条 = 小程序端静默失效，H5 端无任何错误提示


反面示例：
  源：<div style={{display:'flex', alignItems:'flex-start'}}>
        <span>word</span>
        <span>phonetic</span>
        <span style={{marginTop:'6px', display:'inline-block'}}>badge</span>
      </div>
  ❌ 错误迁移：把 badge 从独立行移到了第一行的 flex 容器内
  ✅ 正确迁移：badge 保持独立行，在释义下方渲染

如果在写作过程中发现某种结构在目标框架中确实无法实现，必须用
/* STRUCTURE-DEVIATION: <原因> — <原型结构> → <目标替代结构> */
注释标记，并在 Phase 4 被审计。
```

### 第四节：项目上下文

```
项目中可用的类型（已生成）：
```typescript
<层级 0 types.ts 的内容>
```

可供导入的共享组件：
| 组件 | 导入路径 | Props |
|-----------|------------|-------|
| <名称> | <路径> | <接口摘要> |
...

其他已生成的上下文文件：
- <层级 1 的数据文件及其结构>
```

### 第四节 b：自动锁定清单 🔴（P0-C — 机器生成，禁止人工整理）

```
以下共享组件已在更早层级生成并锁定。此清单**由 verify-component.sh 脚本自动生成**
（component-lock.json），精确到每个 prop 的类型和默认值。不是人工整理的近似清单。

你只能使用这些组件——这是强制要求，不是建议。如果组件默认值与你的页面需求冲突，
通过 props 覆盖——不要手写 CSS 绕过组件。

<从 component-lock.json 提取的本文件需用的组件条目>
```

### 第四节 b-2：Import 声明完整性清单 🔴（P0-F — 防止组件静默消失）

> **来源**：2026-07-17 `figma-prototype` → `english-dict-uni` 迁移实战。auth.vue
> 的模板中使用了 `<PrimaryButton>`，但 `<script setup>` 中忘记 `import PrimaryButton`。
> 构建通过（Vite 不校验组件注册）、TypeScript 不报错（tsc 不检查 .vue 模板）、
> 运行时无异常（Vue 将未知组件渲染为空 HTMLUnknownElement）→ 按钮在页面上完全消失。
> 此问题是 **三道防线同时失效** 的典型案例，无法被任何现有 Phase 4 审计发现。

```
⚠️ 在生成最终代码之前，请逐条核对以下 import 声明。
本清单中列出的每个组件、工具函数、composable、store 在本文件中被使用时，
**必须在 <script setup> 中存在对应的 import 语句**。

🔴 以下 import 声明是强制性的——本文件模板引用了它们：

| 导入内容 | 强制 import 语句 | 被使用的证据（模板/脚本位置） |
|---------|-----------------|--------------------------|
| <组件/函数> | <完整 import 语句> | <模板中 `<Component>` 或脚本中 `fn()` 调用> |

示例（React → uni-app，auth.vue）：
| 导入内容 | 强制 import 语句 | 被使用的证据 |
|---------|-----------------|------------|
| PrimaryButton | `import PrimaryButton from '@/components/PrimaryButton.vue'` | 模板 218 行 `<PrimaryButton>` |
| userStore | `import { userStore } from '@/store/user'` | 脚本 90 行 `userStore.user = u` |
| mockUsers | `import { mockUsers } from '@/data/mockData'` | 脚本 87 行 `mockUsers.find(...)` |
| ref | `import { ref, computed } from 'vue'` | 脚本中 7 处 `ref()` 调用 |
| onLoad | `import { onLoad } from '@dcloudio/uni-app'` | 脚本 16 行 `onLoad((options) => ...)` |

🔴 自检规则（返回前必须逐条核对）：
1. 在你的 `<script setup>` 中搜索每个 import —— 是否与上表逐行匹配？
2. 对于每个模板中的 PascalCase 标签（如 `<PageHeader>`），script 中有对应的 import 吗？
3. 对于每个 `@/store/xxx` 或 `@/utils/xxx` 调用，script 中有对应的 import 吗？
4. 生命周期钩子（onLoad/onShow 等）——是否从 `@dcloudio/uni-app` 显式 import 了？
5. 如果某条不适用，在回答末尾注明 "N/A: <项目> — <原因>"，不要留空。

违反后果（来自实战）：
- 缺少组件 import → 构建通过、页面正常加载、组件区域为空 — 人眼才能发现
- 缺少 onLoad import → 构建通过、页面正常加载、运行时 ReferenceError — 需打开 Console 才能发现
- 缺少 store import → 构建通过、运行时 TypeError: Cannot read properties of undefined
```

### 第四节 c：跨文件上下文 — 根容器约束与共享组件锁定细节 🆕

```
以下信息描述了你当前文件**看不到**但会**影响**你输出的其他文件中的决策和约束。
这些信息来自 Phase 2 的分析——你的源文件不会提到它们，但忽略它们会导致
跨文件不一致。在生成代码前仔细阅读本节。

#### 1. 根容器/布局约束（来自 App 入口或根布局文件）

源项目的入口文件可能定义了全局容器约束。你在生成页面时，必须考虑这些约束——
目标项目中没有"全局 wrapper 自动包裹"每个页面，你需要自行实现等价约束。

| 约束项 | 源位置 | 源值 | 目标实施方式 |
|--------|--------|------|------------|
| <约束描述> | <App.tsx 行号或选择器> | <源精确值> | <条件编译片段或精确 CSS> |

示例（React → uni-app 迁移）：
| 约束项 | 源位置 | 源值 | 目标实施方式 |
|--------|--------|------|------------|
| 页面最大宽度 | App.tsx root container | `max-width: 430px; margin: 0 auto` | H5: `max-width: 860rpx; margin: 0 auto`。小程序: 不设限制 |
| 页面底部安全区 | App.tsx root container | `padding-bottom: calc(env(safe-area-inset-bottom, 0) + 80px)` | 页面底部 `padding-bottom: env(safe-area-inset-bottom)` |
| 全局字体 | App.tsx global style | `font-family: Inter, system-ui` | 已在 App.vue 全局设置，页面无需重复 |
| 全局盒模型 | 浏览器默认或 CSS reset | `box-sizing: border-box`（隐式） | 必须在 App.vue 显式声明 `* { box-sizing: border-box; }` |
| 全局 line-height | 浏览器默认 ~1.2 | 无显式声明 | 必须在 App.vue 显式声明 `body { line-height: 1.5; }` |

#### 2. 共享组件锁定实现细节（来自 Phase 2 组件复用分析）

以下共享组件已在更早的层级生成并**锁定**——你可以 import 它们，但**不能修改**。
以下是它们的实现细节——即它们**已经做了什么**，以及你需要通过 props/slots
**告诉它们什么**：

| 共享组件 | 已实现的固定功能（你不需要重复） | 你需要通过 props/slots 提供 | 注意事项 |
|---------|------------------------------|---------------------------|---------|
| <组件名> | <其内部已实现的样式/行为> | <需要传的 props 和 slot> | <容易被忽略的默认值或行为> |

示例：
| 共享组件 | 已实现的固定功能 | 你需要提供 | 注意事项 |
|---------|---------------|----------|---------|
| `<PageHeader>` | 半透明背景、H5 条件编译 backdrop-filter、sticky 定位、padding | `title`（必填）、`showBack`、`backLabel`、`backgroundColor`（选填）、`#right` slot | 🔴 默认背景色是灰色。如果你的页面需要白色/透明背景，必须显式传 `backgroundColor` |
| `<WordCard>` | 白色背景卡片、圆角、阴影、word+phonetic 行、ArrowRight 箭头 | `word`（必填）、`showLibraryBadge`（选填）、`@click` 事件处理 | — |
| `<SectionLabel>` | 11px/600/uppercase/letter-spacing 样式 | 默认 slot（标签文字） | — |
| `<EmptyState>` | 居中 flex 布局、图标 + 标题 + 副标题、默认间距 | `icon`、`text`、`subText`（选填）、`variant`（选填） | — |
| `<PrimaryButton>` | 蓝色渐变背景、白色文字、圆角、padding | `@click`、`loading`、`disabled`、`ghost`、默认 slot（按钮文字） | — |

#### 3. Phase 2 设计决策 — 影响本页面的部分

以下设计决策来自 Phase 2 分析，可能与源文件的行为不同。这些决策**已经被决定**，
你在生成代码时直接遵循，不需要重新评估：

| 决策 ID | 决策描述 | 影响本页面的方式 | 实施要求 |
|---------|---------|---------------|---------|
| <D1/D2/...> | <决策简述> | <本页面如何受影响> | <精确的实施方式，含条件编译代码片段> |

示例：
| 决策 ID | 决策描述 | 影响本页面 | 实施要求 |
|---------|---------|----------|---------|
| D1 | 移除页面级 maxWidth 限制 | H5 平台需要条件编译保留 max-width | 在页面根容器加 `/* #ifdef H5 */ max-width: 860rpx; margin: 0 auto; /* #endif */` |
| D3 | header blur 用条件编译保留 | 本页面如有 sticky header | 使用 `<PageHeader>` 组件即可（已内置），或手写时加条件编译 |
| D4 | 移除 :hover/:focus | H5 平台需要条件编译保留 focus 样式 | 如果有输入框，在 H5 中保留 `.input-focused` 类 + `:focus` 伪类 |

#### 4. 为什么本节必要

在 Phase 3 逐文件生成模式下，每个 Agent 只看到自己的源文件和目标路径。
Agent 不知道：
- App.tsx 中定义的 maxWidth——所以不知道 H5 上需要条件编译保留它
- 已锁定共享组件的默认值是什么——所以可能传了错误的 prop 造成视觉偏差
- Phase 2 已经决定了"H5 保留 maxWidth"——Agent 如果不知道这决定，可能再次移除

本节弥补了这个**信息壁垒**——把其他文件中的关键约束和决策，直接注入到你需要的上下文中。
```

### 第五节：全局样式约束（每个文件必须遵守）

```
以下是适用于所有页面/组件文件的全局样式规则。无论该文件的具体功能是什么，
都必须遵守这些约束。请不要因为源文件中未显式出现就忽略。

| 规则 ID | 描述 | 实施方式 |
|---------|------|---------|
| G1 | 吸顶 header 必须有 backdrop-filter（H5条件编译） | `/* #ifdef H5 */ backdrop-filter: blur(32rpx); /* #endif */` |
| G2 | 吸顶 header 背景必须是半透明色 | `background: rgba(255,255,255,0.9)` 或 `rgba(247,249,252,0.94)` |
| G3 | 未登录态 header 也要有背景色 | 不得通过条件样式移除未登录态的 header 背景 |
| G4 | 页面顶部 padding 必须包含安全区 | 至少 104rpx（52px × 2）的 padding-top |
| G5 | 所有文本必须使用 `<text>` 组件 | 小程序兼容性要求 |
| G6 | 所有 px 值必须转换为 rpx | 1px = 2rpx，但字体大小可保持 px（H5 兼容） |
| G7 | H5 专用 CSS 必须用条件编译包裹 | `/* #ifdef H5 */ ... /* #endif */` |
| G8 | 全局字体设置必须在 App.vue 中 | 在 App.vue 的非 scoped style 中设置 font-family |
| G9 🆕 | 所有 input 显式高度 | input CSS 必须含 `height: <计算值>`（NC-01）— 见 cross-platform-pitfalls.md §1 |
| G10 🆕 | input 闭合标签 | 模板中 `<input>` 用 `></input>` 闭合，非 `/>` （NC-02） |
| G11 🆕 | textarea auto-height | `<textarea>` 必须含 `auto-height` 属性（NC-03） |
| G12 🆕 | transition 条件编译 | 原生组件相关 CSS 的 transition 必须用 `/* #ifdef H5 */` 包裹（NC-04） |
| G13 🆕 | overflow 条件编译 | 原生组件父容器的 `overflow: hidden` 必须用 `/* #ifdef H5 */` 包裹（NC-05） |
| G14 🆕 | input focus/blur 样式使用模式标注 | 源文件属于 INPUT-A 模式（blur: transparent + #F1F5F9）还是 INPUT-B 模式（blur: #E5E7EB + #fff）？必须使用 Phase 2 指定的 mixin，并在 CSS 中加 `/* INPUT-PATTERN: A */` 注释 |
| G15 🆕 | focus/blur 必须使用 useInputFocus composable | 所有 input 的 focus/blur 状态管理通过 `import { useInputFocus } from '@/composables/useInputFocus'`，在模板中用 `:class="{ 'input-focused': xxx.focused }"` 绑定。禁止手写独立 ref 管理 focus 状态。 |

特别注意：G1 是最容易被遗漏的规则。如果页面有粘性（sticky/fixed）header，
必须用 G1 的条件编译写法添加 backdrop-filter。

特别注意 G9-G13 🆕：这些规则只影响小程序端——H5 开发服务器上一切正常。
如果遗漏，真机测试时输入框/文本域将无法编辑。验证方法见
`cross-platform-pitfalls.md` §2 检测命令集。

特别注意 G14-G15 🆕：input 样式是跨文件一致性最薄弱的环节。G14 阻止 Agent
选用错误的 blur 态样式模式（AuthView 和 AdminView 的默认样式不同）；G15 阻止
Agent 用独立的 ref 管理 focus 而非统一的 composable（导致 5+ 个文件各自维护
完全相同的 focus 切换逻辑）。违反 G14 的常见表现：auth.vue 的 input 用
了 AdminView 的 blur 态样式（或反过来）。违反 G15 的常见表现：WordEditForm
内部出现 `const focused = ref(false)` 而非 `useInputFocus()`。
```

### 第五节 b：CSS 样式块 🆕（P0-G — 直接粘贴，禁止自己写 CSS）

```
🔴 本节是你的 <style scoped> 块的全部内容。以下 CSS 已由脚本从源文件精确提取并
完成 px→rpx 换算、条件编译包裹——你不需要编写任何 CSS。

⚠️ 你的任务：
1. 将以下 CSS 块**原样复制**到你的 `<style scoped lang="scss">` 中
2. 不要修改任何数值——所有 padding/font-size/border-radius/box-shadow/gradient
   已在 Phase 2 被脚本精确验证
3. 不要用 SCSS 变量替换精确值——CSS 块中的值就是最终值
4. 不要添加 CSS 块中没有的 CSS 声明
5. 如果 CSS 块中某个 class 缺少某个属性，不要自行补充——它本就不应在那里

🔴 仅动态值（在不同状态下值不同的属性）由你在 <template> 中用 :style 绑定处理。
CSS 块末尾的 "Dynamic values" 清单列出了需要动态处理的属性。

<完整的 CSS 块内容，从 css-blocks/<本文件>.css-block 复制>
```

**降级模式**（当 CSS block pre-generation 未执行时——源用 CSS Modules/Tailwind）：

```
⚠️ 本节是本文件最重要的约束之一。以下数值从 Phase 2 的 `design-values.json`
直接提取——不是建议，不是近似。

🔴 硬性规则：以下六类 CSS 属性禁止通过 SCSS 变量间接引用：
  font-size, padding, margin, border, color, background
如果某个 SCSS 变量定义值与下表精确值冲突，以精确值为准。

| CSS 属性 | 精确值 | 适用元素/类 | 原型来源 |
|---------|--------|-----------|---------|
| padding-top | 112rpx | .home-page__header | HomeView.tsx:29 (56px) |
...
```
（此模式保留原有精确值表格式——见本文件历史版本）

示例（React → uni-app）：
| CSS 属性 | 精确值 | 适用元素/类 | 原型来源 |
|---------|--------|-----------|---------|
| padding-top | 112rpx | .home-page__header | HomeView.tsx:29 (56px) |
| background | rgba(255,255,255,0.9) | .home-page__search-area | HomeView.tsx:30 |
| font-size | 68rpx | .home-page__today-card-word | HomeView.tsx:157 (34px) |
| font-size | 34rpx | .word-card__word (default) | HomeView.tsx:203 (17px) |
| font-size | 24rpx | .word-card__phonetic (default) | HomeView.tsx:204 (12px) |
| box-shadow | 0 4rpx 24rpx rgba(0,0,0,0.04) | .word-card--default | HomeView.tsx:197 (0 2px 12px rgba(0,0,0,0.04)) |
| padding | 28rpx 32rpx 28rpx 92rpx | .search-bar__input | HomeView.tsx:61 (14px 16px 14px 46px) |
| border-radius | 40rpx | POS badge / library badge | WordDetailView.tsx:84 (20px) |

请注意：
1. 上表中的精确值优先于任何 SCSS 变量——如果变量定义值不同，用精确值。
2. 换算规则：px → rpx 乘以 2，rem → px 乘以 16 再乘以 2。
3. 颜色值（#xxx, rgba()）必须逐字符精确匹配——#2563EB ≠ #2563eb。
4. box-shadow / text-shadow / gradient 的值必须包含所有参数的精确匹配。
5. 如果某个元素的 CSS 值不在上述表中，从源文件内联 style 中提取原始值，
   按同样的换算规则自行推导——不要从语义近似的 SCSS 变量中取值。
6. 🔴 如果你在本节中找不到某个 CSS 属性的精确值，从下面的源文件中
   **逐行提取每个 `style={{}}` 对象**——不要从 SCSS 变量中"推断"，
   不要从"常识"中"估算"。如果 SCSS 变量值与精确值冲突，以精确值为准，
   并在代码注释中标注"变量值需修正：<var-name> 定义为 <var-value>，
   原型为 <exact-value>"。
```

### 第六节：复用约束（强制 API）

组件——禁止手写替代实现：
- ❌ 手写 .header / .top-bar 样式块 → ✅ 必须用 <PageHeader>
- ❌ 手写空状态 div → ✅ 必须用 <EmptyState>
- ❌ 手写 section 标签（11px/600/uppercase） → ✅ 必须用 <SectionLabel>
- ❌ 手写蓝色大按钮 → ✅ 必须用 <PrimaryButton>
- ❌ 手写单词卡片列表项 → ✅ 必须用 <WordCard>
- ❌ 手写物理意象图 → ✅ 必须用 <PhysicalImage>

样式——禁止手写替代实现：
- ❌ 手写 header 的 sticky + blur + 半透明背景组合 → ✅ 用 <PageHeader> 组件（已内置）
- ❌ 手写卡片阴影+圆角组合 → ✅ 用 SCSS mixin @include card
- ❌ 手写 section label 的内联 style → ✅ 用 <SectionLabel> 组件（已内置 22rpx/600/uppercase/4rpx letter-spacing）
- ❌ 手写 input focus 边框切换的独立 ref → ✅ 用 useInputFocus() composable（G15）
- ❌ 手写 input blur 态样式（border-color + background 组合）→ ✅ 使用 Phase 2 指定的 INPUT-A/INPUT-B mixin（G14）

逻辑——禁止内联绕过：
- ❌ mockWords.find(w => w.id === xxx) → ✅ import { filterWords } from '@/utils/helpers'
- ❌ 直接调用 uni.navigateTo / uni.switchTab / uni.navigateBack → ✅ import { useRouter } from '@/composables/useRouter'
- ❌ 通过 props 层层传递 user → ✅ import { useUser } from '@/store/user'
- ❌ 手写 genId() / isValidPhone() → ✅ import from '@/utils/helpers'

📋 与本文件相关的 Phase 2 设计决策（直接遵循，不需要重新评估）：
| 决策 ID | 决策内容 | 本文件实施要求 |
|---------|---------|-------------|
| D3 | header blur H5 条件编译保留 | 使用 <PageHeader>（已内置）或手写时用 `/* #ifdef H5 */` 包裹 |
| D8 | input transition H5 条件编译保留 | input CSS 中 `transition` 必须用 `/* #ifdef H5 */` 包裹 |
```

逻辑复用：
- ❌ 禁止内联 mockWords.find → ✅ 使用 utils/helpers.ts 的 getWordById(id)
- ❌ 禁止内联 mockLibraries.find → ✅ 使用 utils/helpers.ts 的 getLibraryById(id)
- ❌ 禁止内联词性颜色查找 → ✅ 使用 utils/helpers.ts 的 getPosColor(pos)
- ❌ 禁止手写搜索过滤 → ✅ 使用 utils/helpers.ts 的 filterWords(query, words)
- ❌ 禁止手写 focus/blur 状态切换 → ✅ 使用 useInputFocus() composable

如果某个共享抽象确实不适用于你的场景（例如需要额外的自定义行为），
可以回退为手写，但必须在代码注释中说明原因。不要默默跳过。
```

### 第七节：图标约束 🆕（Icon Constraints）

> **📖 图标策略的完整上下文见 `references/icons.md`**——SVG 支持矩阵、策略决策树、
> 各方案详细实施指南、iconfont 基础设施模板、常见图标库迁移映射表。

```
⚠️ 红线：本文件严禁使用任何 emoji 字符替代图标。

本文件需要的图标及其实施方式（从 Phase 2 图标映射表提取）：

| 图标用途 | 实施方式 | 代码 |
|---------|---------|------|
| <用途1> | <方案> | <精确代码片段> |
| <用途2> | <方案> | <精确代码片段> |

规则：
1. 严格按照上表实现图标，不得自行决定使用其他方式
2. 绝对禁止使用 emoji（🔍 ✨ 📖 👤 🛡 ⚙ 🎯 🚪 📭 等）替代
3. 不要用 Unicode 符号（× ✓ →）替代功能图标——这些不是图标方案
4. 如果某个图标在表中没有映射，在代码中放置占位符 <view class="icon-placeholder">
   并在注释中标注 "TODO: 需补充图标 — <图标用途>"
5. iconfont 使用时确保正确的 CSS 类名和 Unicode 码点（码点定义见 icons.md 第四章）
6. uni-icons 使用时注意 size 和 color prop 必须与 Phase 1 清单值一致
7. 不同平台可能需要不同的图标方案——检查 Phase 2 的条件编译要求
```

### 第七节 b：复用约束 — 强制 API（Mandatory）

```
以下共享组件/变量/mixin 已经存在并锁定。你必须使用它们——这是强制要求，不是建议。

组件——禁止手写替代实现：
❌ 手写 .header → ✅ 必须用 <PageHeader>
❌ 手写空状态 div → ✅ 必须用 <EmptyState>
❌ 手写 section 标签 → ✅ 必须用 <SectionLabel>
❌ 手写主按钮 → ✅ 必须用 <PrimaryButton>
❌ 手写单词卡片 → ✅ 必须用 <WordCard>

样式——禁止手写替代实现：
❌ 手写 header 的 padding/背景/blur → ✅ 用 SCSS mixin @include sticky-header 或 PageHeader 组件
❌ 手写卡片阴影+圆角组合 → ✅ 用 SCSS mixin @include card
❌ 手写 11px/600/uppercase/2px letter-spacing → ✅ 用 .section-label 全局类
❌ 手写 focus 边框色切换的内联 style → ✅ 用 .input-focused 类 + :class 绑定

逻辑——禁止内联绕过：
❌ 手写 mockWords.find(...) → ✅ import { getWordById } from 'utils/helpers'
❌ 手写 mockLibraries.find(...) → ✅ import { getLibraryById } from 'utils/helpers'
❌ 直接调用 uni.navigateTo → ✅ import { useRouter } from 'composables/useRouter'
❌ 通过 props 传递 user → ✅ import { useUser } from 'composables/useUser'

如果某个共享抽象确实完全不适用于你的场景，允许回退为手写，但必须在代码中
以 /* REUSE-EXCEPTION: <原因> */ 注释明确说明。没有此注释的手写实现将
在 Phase 4 被标记为违规并强制替换。
```

### 第八节：交互检查清单（关键）

```
以下交互必须出现在生成的文件中。
在返回之前逐一验证。

| ID | 元素 | 触发方式 | 行为 | 状态 | 条件 |
|----|---------|---------|----------|--------|-----------|
| <ID> | <描述> | <事件> | <行为> | <状态> | <条件> |
...

对于每个交互 ID：
1. 在源代码中找到它
2. 在目标代码中实现完全等效的逻辑
3. 在写完文件后，在脑中逐步走一遍交互流程以确认其正确性
```

### 第九节：输出规范

```
在 <target path> 输出完整的文件。

要求：
1. 文件必须能与现有项目一起编译/类型检查
2. 所有导入必须引用已存在的文件（来自上述项目上下文）
3. 遵循 <target-framework> 的惯例（而非源框架的惯例）
4. 使用目标框架的原生样式系统（适当地转换内联样式）
5. 包含源代码中的所有条件分支
6. 检查清单中的每个交互都必须实现
7. 复用约束中的每一条都必须遵守——用共享组件/变量而非手写
8. 在文件顶部添加注释："// Ported from <source-file>"
9. 🆕 DOM 层级结构必须与源文件一致——元素父子关系、兄弟顺序、布局方向、
   对齐方式不得改变（详见第三节 b）
10. 🆕 所有 CSS 数值必须精确匹配原型值，不得因"语义近似"而替换为其他变量值。
    使用 SCSS 变量时，必须验证变量的定义值与原型的原始值一致。
    如果找不到匹配的变量，使用精确数值而非近似变量。
11. 🆕 跨平台目标的原生组件合规（仅适用于 uni-app/Taro 等）：
    - 所有 `<input>` 有显式 `height` 且使用 `></input>` 闭合标签（G9, G10, NC-01, NC-02）
    - 所有 `<textarea>` 有 `auto-height` 属性（G11, NC-03）
    - 所有 `transition` 属性在原生组件相关 CSS 中用 `/* #ifdef H5 */ ... /* #endif */` 包裹（G12, NC-04）
    - 所有 `overflow: hidden` 在原生组件父容器上用条件编译包裹（G13, NC-05）
    - 承载 border/背景的 input 包裹容器有 `min-height`（NC-06）
    - 需要自动换行的内容块使用 `<view>` 而非 `<text>`（NC-07）
    - 违规 = H5 正常，小程序端静默失效。修复模板见 `cross-platform-pitfalls.md` §1
```

### 第十节：已知反模式自检清单 🔴（返回前必须逐条自检）

```
⚠️ 本节是最后一道防线。以下每条是从实战迁移中提取的已知陷阱。
在提交生成的代码之前，逐条检查。任一条命中 → 立即修复后再提交。

| # | 反模式 | 检测方法 | 正确写法 | 来源 |
|---|--------|---------|---------|------|
| AF1 | useInputFocus 返回值未解构 | 搜索 `= useInputFocus()` — 如果左侧不是 `{ focused, onFocus, onBlur }` 解构形式 | `const { focused, onFocus, onBlur } = useInputFocus()`。不能写成 `const xxx = useInputFocus()` 后访问 `xxx.focused` — Vue 3 模板不自动 unwrap 对象属性上的 Ref，Ref 对象始终 truthy，导致 `--focused` class 永远存在 | 2026-07-16 React→uni-app 迁移：SearchBar 始终显示 focus 态 |
| AF2 | scoped style 中 `@use '@/uni.scss'` | Grep `@use '@/uni.scss'` — 出现即违规 | 删除此行。`vite.config.ts` 的 `additionalData` 已通过 `@import` 注入了 `uni.scss`，`@use` 规则必须出现在所有其他规则之前 — 与注入位置冲突导致 Sass 构建失败 | 2026-07-16 React→uni-app 迁移：6 个文件 Sass 编译错误 |
| AF3 | `<input>` 缺显式 `height` | 搜索 `<input`，检查其 CSS 类是否有 `height: ...rpx` | 添加 `height: 104rpx`（NC-01 公式：padding-top + line-height×font-size + padding-bottom） | 2026-07-15 React→uni-app 迁移：uni-input-wrapper 高度为 0 |
| AF3b | input 包裹容器缺 `min-height` | 搜索 class 中含 `wrap` 且内部含 `<input>` 的容器，检查 CSS 是否有 `min-height` | 添加 `min-height: 104rpx; display: flex; align-items: center`（NC-06）。包裹容器承载 border/背景 — 容器塌陷则整个输入区不可见/不可点击 | 2026-07-16 React→uni-app 迁移：auth.vue phone-wrap/password-wrap 塌陷 |
| AF4 | `<textarea>` 缺 `auto-height` | 搜索 `<textarea`，检查标签是否有 `auto-height` 属性 | 添加 `auto-height` 属性（NC-03） | 2026-07-15 React→uni-app 迁移 |
| AF5 | `textarea` CSS 中有 `resize` | Grep `resize:` — 出现即违规 | 删除 `resize` 声明（NC-08）。小程序 textarea 不支持 resize，由 `auto-height` 替代 | 2026-07-15 React→uni-app 迁移 |
| AF6 | `transition:` 未 H5 条件编译 | 搜索 `transition:` — 检查其所在 CSS 块是否被 `/* #ifdef H5 */` 包裹 | 包裹：`/* #ifdef H5 */ transition: ...; /* #endif */`。原生组件上的 transition 触发重绘冲突（NC-04） | 2026-07-15 React→uni-app 迁移 |
| AF7 | SCSS 变量被用于关键 CSS 数值 | 搜索 `font-size: \$`、`padding: \$`、`margin: \$`、`color: \$`、`background: \$`、`border: \$` — 这六类属性禁止通过变量间接引用 | 替换为 §5b 精确数值表中的值。SCSS 变量仅允许用于非用户可见的辅助属性（z-index、opacity、动画参数）。**变量定义值可能与源精确值有系统性偏差，即使语义相同** | 2026-07-16 React→uni-app 迁移：$font-label:22rpx vs 源 12px→24rpx |
| AF8 | `<text>` 有 nowrap+ellipsis 但缺 `display: block` | 搜索 `white-space:\s*nowrap`，向上查找 `<text` 元素，确认其 CSS 类有 `display: block` | 添加 `display: block`（NC-14）。`<text>` 默认 `display: inline`，宽度由内容撑开，`text-overflow` 需要块级盒模型 | 2026-07-15 React→uni-app 迁移 |
| AF9 | 使用了 emoji 字符替代图标 | 搜索 `[\x{1F300}-\x{1F9FF}]` 等 emoji Unicode 范围 | 替换为 iconfont 字符（`&#xeXXX;`）或 uni-icons 组件。emoji 在小程序中显示不一致 | 2026-07-15 React→uni-app 迁移 |
| AF10 | 凭空添加源中不存在的 DOM 元素/CSS 属性 | 对照 §2.5 源 DOM 树清单：模板中每个元素是否有源对应？scoped style 中每条声明是否有源对应？ | 删除源中不存在的元素和属性。如空状态应只显示文字，不应加 User 图标 | 2026-07-16 React→uni-app 迁移：EmptyState 凭空加了 &#xe006; |
| AF11 | `ref` 从 `@dcloudio/uni-app` 导入 | Grep `import.*ref.*from '@dcloudio/uni-app'` | `ref`/`reactive`/`computed`/`watch` 从 `vue` 导入。`@dcloudio/uni-app` 只导出 uni 特有 API（`onLoad`、`onShow` 等） | 2026-07-15 React→uni-app 迁移（PM-M1） |
| AF12 | 生命周期钩子（onLoad 等）未显式 import | 搜索 `onLoad(` — 如果 `<script setup>` 中没有对应的 import 语句 | 添加 `import { onLoad } from '@dcloudio/uni-app'`。这些钩子在 `<script setup>` 中不会自动可用，缺少 import 不会在编译时报错，运行时抛出 `ReferenceError` | 2026-07-15 React→uni-app 迁移 |
| AF13 | 模板中使用了共享组件但缺少 import | 🔴 **不可跳过**：对照第四节 b-2 的 Import 声明完整性清单，逐条核对 `<script setup>` 中是否有对应的 `import` 语句。特别检查：(a) 模板中的每个 PascalCase 标签（如 `<PageHeader>`）→ script 中有 `import PageHeader from ...` 吗？(b) 每个 `useInputFocus()` 调用 → script 中有 `import { useInputFocus } from ...` 吗？(c) 每个 `genId()` / `getWordById()` 调用 → script 中有对应 import 吗？ | 补充缺失的 import 语句。**违反后果**：构建通过、TS 不报错、Console 无异常 → 组件渲染为空白区域 → 只能人眼发现。这是所有防线中唯一一道针对"组件静默消失"的防范 | 2026-07-17 React→uni-app 迁移：auth.vue 忘记 import PrimaryButton → 登录按钮完全不可见 |

如果某条不适用于当前文件（如纯展示页无 input），在代码注释中标注 "// AFx: N/A — <原因>"。
不能有任何一条被跳过而不做检查。
```

---

## 步骤 3：执行策略

### 🆕 层级 3/4 页面：生成后验证

层级 3 和层级 4 的每个页面 Agent 完成后，**必须**运行逐文件 CSS 精确值验证：

```bash
# 对每个生成的页面文件立即验证
node .claude/skills/frontend-refactor/scripts/verify-page-values.cjs \
  <生成的文件路径> \
  <Phase2产出>/design-values.json

# 脚本行为：
# - 退出码 0: 所有关键 CSS 属性存在且值偏差 ≤ 2rpx → 通过
# - 退出码 1: 存在偏差 > 2rpx 的 CSS 属性 → 输出差异清单 → Agent 修复 → 重新验证
# - 退出码 2: 文件/参数错误
```

**脚本检查的维度**：
1. 关键 CSS 属性存在性（padding、font-size、border-radius、box-shadow、background、color、margin、gap）
2. 值精确匹配（偏差 ≤ 2rpx 为通过，> 2rpx 为需修复）
3. 跨平台合规标记存在性（H5 条件编译、input height、textarea auto-height）

**🔴 阻断规则**：每个页面 Agent 提交前必须通过 verify-page-values 验证（退出码 0）。
未通过验证的页面不得标记为"已完成"。

> **为什么此步骤必需**：Phase 4 审计是事后发现——能发现偏差但修复成本高。
> 生成后立即验证可以在 Agent 上下文还活跃时修复，避免后续反复编辑。

### 🔴 层级 2（共享组件）：必须串行

所有共享组件 Agent 使用 `run_in_background: false`，逐个同步执行。
每个组件完成后立即验证（Grep 关键 CSS 值），发现偏差立即修复。
所有组件通过后提取锁定清单。**锁定清单未生成前，禁止启动任何层级 3 Agent。**

### 同一层级内（层级 0-1 和层级 3-4 和层级 6）：可并行

同一层级的所有文件可以并行生成。它们彼此之间没有依赖。

```
层级 3：同时启动 home、auth、word-detail、libraries、library-words 页面 Agent
```

### 层级之间：串行

等待层级 N 的所有 agent 完成之后，再开始层级 N+1。

```
层级 2 完成（5/5 个文件已生成 + 已验证 + 已锁定）
→ 层级 2.5 静态资源就位
→ 读取每个层级 2 文件以提取其导出内容（供层级 3 上下文使用）
→ 层级 3 Agent Prompt 注入锁定清单
→ 开始层级 3
```

### 进度报告

每完成一个层级后：

```
✅ 层级 0：types.ts — 1/1
✅ 层级 1：mockData.ts、constants.ts — 2/2
✅ 层级 2：Button、Card、Input、Modal、NavBar — 5/5
⏳ 层级 3：HomeView（已完成）、WordDetail（已完成）、LibrariesView（生成中...）、AuthView（排队中）
```

---

## 步骤 4：特殊情况

### 大型源文件 → 拆分为多个目标文件

```
源文件：AdminView.tsx（760 行，5 个子区域）

目标文件：
- src/pages/admin/overview/index.tsx     （Overview 区域）
- src/pages/admin/libraries/index.tsx    （LibraryManager）
- src/pages/admin/words/index.tsx        （WordManager + WordEditForm）
- src/pages/admin/users/index.tsx        （UserManager）

提示词策略：作为独立的 agent 分别生成，但将完整的源代码传给每个 agent，
以便它们理解共享的模式和样式令牌。
```

### 多个源文件 → 合并为一个目标文件

```
源文件：HomeView.tsx + BottomNav.tsx → 目标文件：src/pages/home/index.tsx

提示词策略：传入两个源文件。标注哪些部分来自哪个源文件。
```

### 配置文件生成（层级 6）

配置文件（package.json、vite.config、tsconfig 等）最后生成，因为它们需要了解项目中使用的所有依赖项。手动生成这些文件（而非通过子 agent），方法是：
1. 列出所有已生成文件中使用的所有导入
2. 构建 package.json 的依赖列表
3. 使用 `npx ctx7@latest library <target-framework> "project setup configuration"` 获取正确的配置格式

#### 🔴 Layer 2.5：静态资源占位 🆕

**在 Layer 3（共享组件）生成之前必须执行。** Phase 2 的复用分析会规划
`iconfont.ttf`、tabBar 图标、PhysicalImage 回退 PNG 等静态资源。
这些文件不由代码 Agent 生成，但 SCSS（如 `uni.scss` 的 `@font-face`）和
模板（如 `PhysicalImage.vue` 的 `/* #ifdef MP-WEIXIN */` 分支）会引用它们。
如果引用时文件不存在 → `npm run build` 失败。

Layer 2.5 创建最小占位文件以消除构建错误：

| 资源类型 | 目标路径 | 占位内容 | 说明 |
|---------|---------|---------|------|
| 图标字体 | `src/static/fonts/iconfont.ttf` | 最小合法 TTF 文件（约 60 字节 header） | 构建通过，运行时图标不显示但不会报错 |
| tabBar 图标 × N | `src/static/images/tab-*.png` | 1×1 像素透明 PNG | pages.json tabBar list 中引用的每个 iconPath / selectedIconPath 都需要 |
| PhysicalImage 回退图 × M | `src/static/images/<type>.png` | 1×1 像素透明 PNG | PhysicalImage.vue 小程序端 `<image>` 引用的每个图片 |

**占位文件不会进入最终发布** — Phase 4 的差异报告中会单独列出"待补充的静态资源清单"，
用户需替换为真实资源后重新构建。

> 📋 **实战教训**：某 React → uni-app 迁移中，`npm install` 通过了（版本号修正后），
> 但 `npm run build` 报 `Cannot find module 'iconfont.ttf'`——因为 `uni.scss` 的
> `@font-face { src: url('~@/static/fonts/iconfont.ttf') }` 在 CSS 编译阶段就会
> 检查文件是否存在。如果没有 Layer 2.5，这个错误会延迟到 Phase 4 才发现。

#### 🔴 package.json 版本号验证

如果目标框架的依赖使用 **alpha/beta/rc 预发布版本号**（如 uni-app 的
`@dcloudio/*` 包），则 Phase 3 不能从迁移规则文档中复制固定版本号——
预发布版本的存续周期很短，文档中的版本号大概率已过期。

生成 `package.json` 的步骤如下：

```
1. 确定需要哪些 @scope/* 包（从框架必备文件清单中提取）
2. 运行 `npm view <pkg> versions --json` 获取最新版本列表
3. 从列表中选择最新的 alpha 版本号
4. 验证该版本号下所有必需的兄弟包都存在
   （如 uni-app 要求 uni-h5, uni-mp-weixin 等都用同一版本号）
5. 将验证通过的版本号写入 package.json
```

> 📋 **实战教训**：`package.json` 中的 `@dcloudio/uni-app: "3.0.0-alpha-4020420240924001"`
> 在生成后仅 4 天即失效——npm registry 中已无此版本。原因是 alpha tag 的时间戳
> 部分由 CI 构建时间生成，人工无法推算。必须运行时查询。

---

## 步骤 5：处理 Agent 失败

如果子 agent 产生无效的输出：

1. **编译错误**：读取错误信息，读取生成的文件，然后使用增强后的提示词重新启动 agent："你生成的文件存在以下错误：<error>。请修复并重新生成。"
2. **缺少交互**：重新启动并提示："交互检查清单中的项目 <ID> 在你的输出中缺失。它应该：<behavior>。请补充。"
3. **导入错误**：通过调整导入路径以匹配项目结构来自动修复。无需为此重新启动 agent —— 直接使用 Edit 修改文件即可。
