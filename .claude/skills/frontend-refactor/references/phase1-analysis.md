# 第一阶段 — 深度分析指南

## 目标

产出四份结构化文档，共同描述源项目的每一个有意义的方面。这些文档将成为所有后续阶段的契约。

## 按项目规模选择分析策略

### 小型项目（≤ 30 个源文件）

按顺序阅读每个文件。边读边构建四份文档。单次分析即可完成——无需使用子代理。

### 大型项目（> 30 个源文件）

派发 **4 个子代理**，每个负责一个领域。每个代理会收到明确的指令，说明要分析哪些文件以及输出什么内容。

#### 代理 1：页面与视图

```
分析源项目中的所有页面级和视图级组件。

待分析文件：<来自 Glob 的文件列表>

对每个文件，输出：
1. 组件名称和文件路径
2. 完整的 props 接口
3. 内部状态（useState/useReducer/data/watch）
4. 它所渲染的子组件列表
5. 交互表：

   | ID | 元素 | 触发器 | 行为 | 状态 | 条件分支 |
   |----|------|--------|------|------|----------|
   | P1 | <元素描述> | onClick/onChange/... | 发生什么 | normal/hover/disabled/... | 何时渲染？ |

   覆盖每一个 onClick、onChange、onSubmit、onFocus、onBlur、onKeyDown、
   onScroll，以及任何自定义事件处理器。包括定时器（setTimeout、
   setInterval）和异步操作。

6. 条件渲染表：

   | ID | 条件 | 为真时渲染 | 为假时渲染 | 备注 |
   |----|------|-----------|------------|------|

7. 组件状态机：
   描述组件可能处于的所有状态：
   - 加载中 / 错误 / 空数据 / 正常 / 边界情况
   - 什么触发状态之间的转换
```

#### 代理 2：数据层

```
分析源项目的数据层。

待分析文件：<类型文件、数据文件、状态仓库、API 服务的列表>

对每个类型定义文件，输出：
1. 每个 interface/type/enum 及其完整定义
2. 类型之间的关系（extends、引用）

对每个数据文件，输出：
1. 每个导出的常量/数组/对象
2. 每个模拟数据实体的结构（以第一个元素为例展示）

对每个状态管理文件（store/context），输出：
1. 状态结构
2. 每个 action/mutation/getter
3. 哪些组件消费此状态

对每个 API 服务文件，输出：
1. 每个端点调用（方法、URL、参数、响应结构）
2. 错误处理模式
```

#### 代理 3：入口与路由

```
分析入口点、路由和布局结构。

待分析文件：<列表：App.tsx、main.tsx、路由配置、布局组件>

输出：
1. 入口点：
   - 应用如何挂载？（createRoot、createApp 等）
   - 哪些 Provider 包裹着应用？
   - 加载的全局样式/脚本

2. 路由：
   - 路由类型（基于文件、基于配置、手动 useState 等）
   - 完整路由表：路径 → 组件 → 参数
   - 导航方式（Link、navigate()、router.push 等）
   - 路由守卫/中间件
   - 标签页/嵌套/并行路由

3. 布局：
   - 持久化布局组件（导航栏、侧边栏、页脚）
   - 哪些路由共享哪些布局
   - 布局状态（侧边栏折叠、当前激活标签等）

4. 全局状态：
   - 提升到 App/根级别的状态
   - 通过 props 传递 vs context vs store
   - 认证状态管理模式
```

#### 代理 4：基础 UI 与样式

```
分析基础 UI 组件、主题和样式系统。

待分析文件：<列表：ui/*.tsx、*.css、主题配置>

输出：
1. UI 组件库：
   对每个基础组件，输出其完整接口（props、变体、尺寸）

2. 设计令牌：
   提取确切数值：
   - 调色板（色值、角色、使用场景）
   - 间距体系（px 值，各用在何处）
   - 圆角体系
   - 字号 + 字重 + 行高
   - 阴影定义
   - 过渡/动画时长
   - 断点（如有响应式设计）
   - Z-index 层级

3. 样式模式：
   - 常用布局模式（flex、grid 组合方式）
   - 响应式模式
   - 暗色模式支持
   - CSS-in-JS vs CSS Modules vs 原子类

4. 图标：
   - 使用的图标库
   - 自定义图标组件

5. 🆕 平台默认样式（仅跨平台迁移时）：
   对每个表单元素（button、input、textarea、select）检查：
   - 是否有显式的 outline 声明？
   - 是否有显式的 -webkit-appearance 声明？
   - 是否有显式的 box-sizing 声明？
   - 是否有显式的 min-height 声明？
   - 是否有显式的 line-height 声明？
   如果源代码未显式声明 → 记录为"依赖平台默认值"，标记差异风险。
   对全局文本元素检查：
   - 源项目是否依赖了浏览器的默认 line-height？
   - 源项目的 CSS reset / normalize 是否已覆盖了 box-sizing？
```

## 合并分析结果

所有子代理返回后，将其输出合并为四份文档。

### 文档 1：骨架地图

```markdown
# 项目骨架：<项目名称>

## 技术栈摘要
| 层级 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript |
| 样式 | Tailwind 4.1 + 内联样式对象（混合） |
| 路由 | 手动 useState<ViewState>（8 个视图） |
| 状态 | 无全局 store；user + view 在 App 级别 |
| UI 组件库 | Radix UI 原语 + MUI 图标 |
| 构建工具 | Vite 6 |
| 数据 | 静态模拟数组 |

## 目录树（带注释）
├── src/main.tsx                    → 入口：ReactDOM.createRoot
├── src/app/App.tsx                 → 根组件：状态 + 视图路由 + BottomNav
├── src/app/components/
│   ├── BottomNav.tsx                → 3 标签页底部导航
│   ├── HomeView.tsx                 → 搜索 + 每日一词 + 单词列表
│   ├── WordDetailView.tsx           → 单词详情（图片 + 核心 + 扩展 + 搭配）
│   ├── LibrariesView.tsx            → 词库列表 + 词库单词子视图
│   ├── ProfileView.tsx              → 未登录引导 / 已登录中心（含管理入口）
│   ├── AuthView.tsx                 → 登录/注册标签切换 + 表单验证
│   ├── AdminView.tsx                → 管理面板（概览 + CRUD 词库 + CRUD 单词 + 用户）
│   └── PhysicalImage.tsx            → 8 个 SVG 实景图片插画
├── src/app/data/
│   ├── types.ts                     → 6 个接口 + ViewState 可辨识联合类型
│   └── mockData.ts                  → 静态数据数组
└── src/styles/                      → 5 个 CSS 文件

## 依赖关系图
<Mermaid 或 ASCII 图，展示哪些文件导入了哪些文件>
```

### 文档 2：交互清单

这是最重要的产出。每个交互都分配一个唯一 ID。

```markdown
# 交互清单

## 页面：<页面名称>

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| <唯一ID> | <人工描述> | <事件类型> | <发生什么> | <状态> | <何时可见> |

### 示例：

## 页面：HomeView
| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| H1 | 搜索输入框 | onChange | setQuery → 实时筛选 | 输入中/聚焦/失焦 | 始终 |
| H2 | 搜索输入框 | onFocus | 边框 → 蓝色，背景 → 白色 | 聚焦 | 始终 |
| H3 | 搜索输入框 | onBlur | 边框 → 透明，背景 → 灰色 | 失焦 | 始终 |
| H4 | 搜索结果卡片 | onClick | navigate(wordDetail, wordId) | 普通/悬停 | query 非空 |
| H5 | 空状态提示 | — | 显示"未找到相关单词" | 空数据 | results.length===0 && query |
| H6 | 每日一词卡片 | onClick | navigate(wordDetail, todayWord.id) | 普通 | query 为空 |
| H7 | "查看完整解析"链接 | onClick | 同 H6 | — | 在每日一词卡片内 |
| H8 | 单词列表项 | onClick | navigate(wordDetail, word.id) | 普通 | query 为空 |
| H9 | 词库标签徽章 | — | 显示词库名称 | — | 该单词存在所属词库 |

## 页面：AuthView
| A1 | 登录标签按钮 | onClick | setTab('login')，清除错误 | 激活/未激活 | 始终 |
| A2 | 注册标签按钮 | onClick | setTab('register')，清除错误 | 激活/未激活 | 始终 |
| A3 | 密码可见性切换 | onClick | 切换 showPassword | 显示/隐藏 | 始终 |
| A4 | 提交按钮 | onClick | handleSubmit() | 普通/加载中 | 始终 |
| A5 | 提交按钮加载状态 | — | 显示"处理中..."文字 | 加载中 | loading===true |
| A6 | 错误消息卡片 | — | 显示红色错误卡片 | 可见 | error !== '' |
| A7 | 返回按钮 | onClick | navigate('home') | — | 始终 |
| A8 | 演示提示区域 | — | 静态展示 | — | tab==='login' |
| A9 | 手机号输入框 | onChange | 设置手机号（仅数字） | — | 始终（maxLength=11） |
| A10 | 密码输入框回车 | onKeyDown | key===Enter → handleSubmit | — | 始终 |
| A11 | 用户名输入框 | onChange | 设置用户名 | — | tab==='register' |
```

格式规则：
- ID 按页面使用前缀：H=首页, W=单词详情, L=词库, P=个人中心, A=认证, AD=管理, B=底部导航
- 每个 onClick、onChange、onSubmit、onFocus、onBlur、onKeyDown、onScroll = 一行
- 每个条件渲染（if/&&/三元表达式）= 条件列中的一行
- 依赖状态的 UI 变化 = 在状态列中描述

### 文档 3：数据流图

```markdown
# 数据流

## 状态所有权树
App.tsx
├── user: AuthUser | null          → ProfileView、AuthView、AdminView
├── view: ViewState                → 所有视图（控制渲染哪个）
├── AdminView（局部状态）
│   ├── section: AdminSection      → 概览、词库、单词、用户
│   ├── libraries: WordLibrary[]   → CRUD 局部状态
│   └── words: Word[]              → CRUD 局部状态
├── HomeView（局部状态）
│   └── query: string              → 搜索筛选
├── AuthView（局部状态）
│   ├── tab: 'login'|'register'   → 表单模式
│   ├── phone/password/username   → 表单字段
│   └── error/loading             → 表单状态
└── ...

## 数据源
| 数据 | 来源 | 消费者 |
|------|------|--------|
| mockWords[] | mockData.ts | HomeView、WordDetailView、LibrariesView、AdminView |
| mockLibraries[] | mockData.ts | LibrariesView、AdminView |
| mockUsers[] | mockData.ts | AuthView（登录）、AdminView（用户） |
| AI_GENERATED_TEMPLATES | mockData.ts | AdminView.generateAIContent() |

## Props 流向
<对每个组件，列出它接收哪些 props 以及来自何处>

## 回调流向
<对每个回调 prop，追踪它在何处定义以及它做什么>
```

### 文档 4：设计令牌

```markdown
# 设计令牌

## 调色板
| 令牌 | 色值 | 用途 |
|------|------|------|
| primary | #2563EB | 按钮、链接、激活标签、强调色 |
| primary-dark | #1D4ED8 | 渐变起始色 |
| primary-light | #3B82F6 | 渐变结束色 |
| primary-bg | #EFF6FF | 标签背景、高亮 |
| bg-page | #F7F9FC | 页面背景 |
| bg-card | #FFFFFF | 卡片背景 |
| text-primary | #111827 | 标题、正文 |
| text-secondary | #6B7280 | 描述文字 |
| text-tertiary | #9CA3AF | 标签、占位符 |
| error | #DC2626 | 错误文字、删除按钮 |
| error-bg | #FEF2F2 | 错误背景 |
| success | #16A34A | 成功指示器 |
| success-bg | #F0FDF4 | 成功背景 |
| warning | #D97706 | 警告指示器 |
| warning-bg | #FFFBEB | 警告背景 |

## 间距
| 令牌 | px | 用途 |
|------|----|------|
| page-px | 24px | 页面水平内边距 |
| page-pt | 52-56px | 顶部安全区域 |
| card-p | 16-24px | 卡片内边距 |
| gap-sm | 8-10px | 小元素间距 |
| gap-md | 12-16px | 中等元素间距 |
| section-gap | 20-24px | 区块间距 |

## 圆角
| 令牌 | px | 用途 |
|------|----|------|
| radius-sm | 8-10px | 小元素 |
| radius-md | 12-14px | 输入框、小卡片 |
| radius-lg | 16px | 按钮、卡片项 |
| radius-xl | 20px | 中等卡片 |
| radius-2xl | 24px | 大卡片、主视觉区域 |
| radius-full | 9999px | 标签、切屑 |

## 字体排版
| 令牌 | 字号/字重 | 用途 |
|------|----------|------|
| hero | 42px/800 | 详情页单词展示 |
| h1 | 26px/700 | 页面标题 |
| h2 | 22px/700 | 子页面标题 |
| h3 | 17-18px/700 | 卡片标题、单词名称 |
| body-lg | 16px/500 | 正文、输入框文字 |
| body | 14-15px | 描述文字 |
| caption | 12-13px | 次要信息 |
| label | 11px/600 | 区块标签（大写） |

## 阴影
| 令牌 | 值 | 用途 |
|------|----|------|
| card | 0 2px 12-20px rgba(0,0,0,0.04-0.07) | 普通卡片 |
| elevated | 0 8px 32px rgba(37,99,235,0.25) | 主视觉/特色卡片 |
| subtle | 0 1px 4px rgba(0,0,0,0.08) | 标签按钮 |

## 渐变
| 令牌 | 值 | 用途 |
|------|----|------|
| primary-gradient | linear-gradient(135deg, #1D4ED8, #2563EB, #3B82F6) | 主视觉卡片、管理横幅 |
| admin-gradient | linear-gradient(135deg, #4C1D95, #7C3AED) | 管理用户卡片 |

## 特效
| 令牌 | 值 | 用途 |
|------|----|------|
| blur-header | backdropFilter: blur(16px) | 吸顶标题栏 |
| blur-bottom-nav | backdropFilter: blur(20px) | 底部导航 |
| header-bg | rgba(247,249,252,0.92) | 半透明 header 背景 |
| bottom-nav-bg | rgba(255,255,255,0.88) | 半透明底部导航背景 |
| transition-default | 0.2s | 默认过渡时间 |

## 平台默认样式（跨平台迁移专用）🆕

> **适用条件**：仅当源平台与目标平台不同时（如 Web → 小程序、React → uni-app），
> 此类别为必需。源平台 = 目标平台时跳过。

某些 CSS 属性的默认值在不同平台（浏览器 H5、微信小程序、支付宝小程序、App）
之间存在差异。如果在源代码中这些属性是依赖浏览器默认值而不显式声明的，
迁移到目标平台后会出现视觉偏差——因为目标平台的默认值不同。

以下属性属于"平台默认值敏感"类别，必须在分析阶段检查源代码是否**隐式依赖**
了浏览器默认值：

| CSS 属性 | Web 浏览器默认值 | 小程序 `<view>` 默认值 | 小程序 `<text>` 默认值 | 风险 |
|---------|----------------|---------------------|---------------------|------|
| `outline` | 各浏览器不同（如 Chrome 蓝色焦点环） | 无 `outline` 概念 | — | 🟡 表单元素焦点轮廓可能在小程序中不显示，需显式声明 `outline: none` |
| `line-height` | `normal`（~1.2，因字体而异） | `normal`（可能为 1.4-1.6） | 小程序 `<text>` 有独立行高算法 | 🔴 行高差异是最隐蔽的视觉偏差来源——同样字号下文本间距完全不同 |
| `-webkit-appearance` | `button` / `searchfield` 等（浏览器原生外观） | 不适用 | — | 🟡 按钮、输入框在小程序中无原生外观，需显式声明所有样式属性 |
| `box-sizing` | `content-box` | `border-box`（部分小程序默认） | — | 🔴 padding/border 计算方式不同导致元素实际尺寸偏差 |
| `min-height` on form elements | 0（由内容撑开） | `auto`（flex 子项特殊行为） | — | 🟡 空表单区域在小程序中可能不显示或高度异常 |
| `overflow` | `visible` | `hidden`（scroll-view 子元素） | — | 🔴 内容可能在小程序中被意外裁剪 |
| `white-space` | `normal` | 可能为 `nowrap`（某些容器） | `normal`（但 text 组件行为不同） | 🟡 文本换行行为差异 |
| `user-select` | `auto` | 不支持此属性 | — | 🟢 轻微：文本选择行为差异 |

### 检查方法

对于源文件中的每个交互元素（button、input、textarea、select），执行以下检查：

1. **显式声明检查**：该 CSS 属性是否在源代码中有显式值？如果没有，标记为"依赖平台默认值"
2. **隐含样式检查**：源元素是否通过 CSS reset / normalize 被覆盖？如果用了 reset，标记为"已处理"
3. **表单元素专项检查**：button、input、textarea、select 是否有完整的样式声明？
   - 源代码中是否有 `-webkit-appearance: none`？
   - 源代码中是否有 `box-sizing` 声明？
   - 源代码中是否有 `outline` 声明？
   - 源代码中是否有显式的 `line-height` 声明？

### 提取格式

```markdown
## 平台默认样式审计

| 源文件 | 元素/CSS 类 | 属性 | 源平台默认行为 | 目标平台默认行为 | 差异风险 | 处理方式 |
|--------|-----------|------|-------------|---------------|---------|---------|
| HomeView.tsx | `<input>` 搜索框 | outline | 浏览器默认 focus 轮廓 | 小程序无 outline | 🟡 中等 | 目标中显式声明 `outline: none` |
| HomeView.tsx | `<input>` 搜索框 | line-height | ~1.2（浏览器默认） | ~1.5（小程序） | 🔴 高 | 在目标中显式设置 `line-height: 1.4` |
| AuthView.tsx | `<button>` 提交按钮 | -webkit-appearance | 浏览器原生按钮外观 | 小程序无原生外观 | 🔴 高 | 必须在目标中显式声明所有按钮样式 |
| App.tsx 全局 | 所有文本元素 | line-height | ~1.2（浏览器默认） | 1.4-1.6（小程序） | 🔴 高 | 必须在目标 App.vue 全局样式中显式设置 `line-height` |
| App.tsx 全局 | 所有块级元素 | box-sizing | content-box（浏览器默认） | border-box（部分小程序） | 🔴 高 | 必须在目标中全局声明 `box-sizing: border-box` 并统一计算 |
| App.tsx 全局 | 所有容器 | overflow | visible | hidden（scroll-view 子元素） | 🔴 高 | scroll-view 的子元素需显式 `overflow: visible` |
```

> **注意**：提取格式中"处理方式"列的值将直接作为 Phase 3 Agent 的全局样式约束
> 和 Phase 4 的审计依据。

### 设计令牌审计元信息（关键）

每个被多个页面/组件共享的设计令牌，必须附带以下审计元信息，
用于 Phase 3（确保生成 Agent 知道值）和 Phase 4（自动检测遗漏）。

| 令牌 | 值 | 审计 Grep 模式 | 必须覆盖的文件 |
|------|----|---------------|--------------|
| blur-header | backdropFilter: blur(16px) | `backdrop-filter:\s*blur` | 所有含吸顶 header 的页面 |
| header-bg | rgba(247,249,252,0.92) | `rgba\(247,\s*249,\s*252` | 所有页面的 .header 类 |
| page-pt | 52-56px (104-112rpx) | `padding:\s*\d+rpx` | 所有页面的 .header 类 |
| primary | #2563EB | `#2563EB\|25[6,6]3EB` | 全局，至少出现在 App.vue 或 uni.scss |
| font-family | Inter, system-ui... | `font-family` | App.vue 全局样式 |

> 如果设计令牌在分析阶段没有填写"审计 Grep 模式"和"必须覆盖的文件"，
> Phase 4 将无法自动检测样式遗漏——只能靠人工肉眼审计。样式遗漏
> （如 backdrop-filter、header 背景色）是最常见的保真度损失来源。
```

### 文档 5：图标资产清单 🆕

图标是最容易被 Phase 3 Agent 用 emoji 糊弄过去的模块——比颜色、间距更隐蔽。
必须单独建立清单，不给 Agent 留发挥空间。

```markdown
# 图标资产清单

## 图标使用的逐文件统计

| 源文件 | 使用的图标 | 数量 |
|--------|----------|------|
| HomeView.tsx | Search, ArrowRight, Sparkles | 3 |
| WordDetailView.tsx | ArrowLeft, ChevronRight | 2 |
| LibrariesView.tsx | BookOpen, ArrowRight | 2 |
| ProfileView.tsx | User, Settings, Shield, LogOut, ChevronRight, BookOpen, Target | 7 |
| AuthView.tsx | ArrowLeft, Eye, EyeOff | 3 |
| AdminView.tsx | Plus, Trash2, RefreshCw, Loader, Check, X, Type, Users, Search, ArrowLeft, ... | 12+ |
| BottomNav.tsx | Search, BookOpen, User | 3 |

## 每类图标的属性规格

| 源图标 (lucide-react) | 尺寸 | 颜色 | 使用位置 | 语义角色 |
|----------------------|------|------|---------|---------|
| Search | 16-18px | #9CA3AF | HomeView 搜索框内 | 输入框前缀图标 |
| ArrowRight | 14-16px | #D1D5DB | 列表项尾部引导箭头 | 导航暗示 |
| ArrowLeft | 18px | #6B7280 | 返回导航 | 返回操作 |
| Sparkles | 14px | #2563EB | "今日一词"标签 | 装饰强调 |
| BookOpen | 16-20px | 渐变色 | 词库卡片、统计入口 | 功能性图标 |
| User | 20-36px | #CBD5E1 / #fff | 头像占位、Tab 导航 | 用户标识 |
| Eye / EyeOff | 18px | #9CA3AF | 密码可见性切换 | 状态切换指示 |
| Check | 15px | #fff | AI 生成完成标记 | 完成状态 |
| X | 14-15px | #DC2626 | 删除操作 | 关闭/删除 |
| Shield | 20px | #7C3AED | 管理后台入口 | 安全/管理员 |
| LogOut | 16px | #DC2626 | 退出按钮 | 退出操作 |
| Settings | 16px | #6B7280 | 设置入口 | 设置 |
| Target | 18px | #16A34A | 学习目标 | 统计/进度 |
| Plus | 14-16px | #fff / #6B7280 | 新增按钮 | 新增操作 |
| RefreshCw | 13px | #374151 | 重新生成 | 刷新操作 |
| Loader | 15px | #fff | 加载中动画 | 加载状态 |
| Type | 20px | #16A34A | 单词管理入口 | 文字/类型 |
| Users | 20px | #7C3AED | 用户管理入口 | 用户组 |
| ChevronRight | 14-18px | #D1D5DB / #2563EB | EvolutionArrow、菜单项 | 展开导航 |

## 图标的目标框架实现方案（关键）

> **红线：任何情况下都不允许使用 emoji 替代图标。**

| 实现方案 | 适用平台 | 优点 | 缺点 | 推荐场景 |
|---------|---------|------|------|---------|
| SVG sprite / 内联 SVG | H5 | 像素完美，颜色可控 | 小程序不支持 | H5 条件编译保留 |
| uni-icons | uni-app 全端 | 官方组件，跨端兼容 | 覆盖图标有限（~30 个） | 能用则用 |
| iconfont 字体图标 | uni-app 全端 | 一次性生成，覆盖全部图标 | 需要构建步骤 | **推荐默认方案** |
| PNG/SVG 静态图片 | 小程序 | 简单直接 | 尺寸固定，修改颜色需多份 | 物理意象图等复杂图形 |
| `<image>` + SVG 文件 | uni-app | 简单 | 无法动态改色 | 颜色固定的小图标 |

### 推荐策略

1. **优先 iconfont**：将所有需要的图标制作成一个 iconfont 字体文件，放在 `src/static/fonts/`，
   在 `App.vue` 的全局样式中 `@font-face` 引入。每个图标通过 `<text class="icon-xxx">` 使用。

2. **图标字符映射表**（供 Phase 3 Agent 直接使用）：
   ```
   search     → <text class="iconfont">&#xe001;</text>
   arrow-right→ <text class="iconfont">&#xe002;</text>
   arrow-left → <text class="iconfont">&#xe003;</text>
   user       → <text class="iconfont">&#xe004;</text>
   ...（为每个源图标生成一个编码）
   ```

3. **回退策略**（H5 条件编译保留 SVG）：
   ```
   /* #ifdef H5 */
   <svg>原始 SVG path</svg>
   /* #endif */
   /* #ifdef MP-WEIXIN */
   <text class="iconfont">&#xe001;</text>
   /* #endif */
   ```

4. **emoji 禁用声明**：在 Phase 3 每个 Agent 的 prompt 中明确声明：
   "禁止使用任何 emoji 字符（如 🔍 ✨ 📖 👤 🛡 ⚙ 🎯 🚪）替代图标。图标必须使用上述方案之一实现。"
```

> **说明**：如果在 Phase 1 中未建立图标资产清单，Phase 3 的 Agent 将自行决定图标实现方式，
> 最常见的退化行为是用 emoji 替代——这是最难在 Phase 4 修复的保真度损失。
> 图标资产清单是 Phase 2 图标迁移策略和 Phase 3 图标约束的数据来源。

### 文档 6：API 资产清单 🆕

> **适用条件**：仅当 SKILL.md 决策树步骤 4k 检测到源项目有真实 API 对接时生成此文档。
> 纯静态/纯 mock 项目跳过。

API 层是最容易被 Phase 3 Agent 遗漏的模块——Agent 擅长生成 UI 和样式，但 API 客户端配置、
认证 Token 管理、请求拦截器等"看不见"的基础设施层容易被忽略。必须单独建立清单。

```markdown
# API 资产清单

## API 客户端配置

| 配置项 | 源值 | 说明 |
|--------|------|------|
| 基础 URL | `https://api.example.com/v1` | 或 `import.meta.env.VITE_API_BASE` |
| HTTP 客户端 | `axios` / `fetch` / `ky` | 源使用的 HTTP 库 |
| 超时设置 | `10000ms` | |
| 重试策略 | 3 次 / 无 | |

## 认证机制

| 维度 | 源实现 | 目标可行性 |
|------|--------|----------|
| Token 存储 | `localStorage.getItem('token')` | H5 ✅ / 小程序 ⚠️ 需改为 `uni.getStorageSync` |
| Token 传递 | `Authorization: Bearer ${token}` Header | 全平台 ✅ |
| Token 刷新 | 响应拦截器 401 → `/refresh` → 重试 | 需保留逻辑 |
| 角色权限 | `user.role === 'admin'` 前端判断 | 同源保留 |
| Cookie-based session | 浏览器自动管理 | 小程序 ❌ 不支持 Cookie → 必须改为 Token Header |

## API 端点清单

| ID | 方法 | 路径 | 参数 | 响应类型 | 调用位置 | 错误处理 |
|----|------|------|------|---------|---------|---------|
| API-01 | GET | `/words?q={query}` | query: string | `Word[]` | HomeView.tsx:42 | toast "搜索失败" |
| API-02 | GET | `/words/{id}` | id: string | `WordDetail` | WordDetailView.tsx:18 | 404 → 显示"单词不存在" |
| API-03 | POST | `/auth/login` | {phone, password} | `{token, user}` | AuthView.tsx:55 | toast 错误信息 |
| ... | ... | ... | ... | ... | ... | ... |

## 请求/响应拦截器

| 拦截器类型 | 源逻辑 | 目标实现 |
|-----------|--------|---------|
| 请求拦截器 | 自动附加 `Authorization` Header | 同逻辑，适配目标 HTTP 客户端 API |
| 响应拦截器 | 401 → 清除 token → 跳转登录页 | 同逻辑 |
| 响应拦截器 | 网络错误 → toast "网络不可用" | 同逻辑 |
| 响应拦截器 | 500 → toast "服务器错误" | 同逻辑 |
```

> **说明**：API 资产清单是 Phase 2 第七类映射（API 与服务端）和 Phase 4 Step 4.3h（API 层验证）的数据来源。

---

## 进入第二阶段前的验证

在进入第二阶段之前，请验证：

- [ ] 每个源文件都在骨架地图中有记录
- [ ] 每个可交互元素在交互清单中都有一条记录
- [ ] 每个条件渲染分支都有文档记录
- [ ] 每个 type/interface 都在数据流图中有记录
- [ ] 项目中使用的每种颜色/间距/圆角/字体/特效都在设计令牌中有记录
- [ ] 每个跨页面共享的设计令牌都填写了"审计 Grep 模式"和"必须覆盖的文件"
- [ ] **🆕 图标资产清单已生成：含逐文件统计、属性规格、目标实现方案、字符映射表**
- [ ] **🆕 如果源平台与目标平台不同，平台默认样式类别已审计：每个表单元素和文本元素的
      line-height、box-sizing、outline、-webkit-appearance、min-height 是否依赖平台默认值**
- [ ] 用户已审阅并确认全部五份文档
