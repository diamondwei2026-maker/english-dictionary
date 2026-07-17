# Phase 1 分析报告：英语母语者词典APP

> 源项目：`figma-prototype` | 目标：Vue 3 + uni-app + uni-ui + Vite + Formily
> 分析日期：2026-07-16

---

## 文档 1：骨架图谱

### 技术栈摘要

| 层级 | 技术 |
|------|------|
| 框架 | React 18 (peer) + TypeScript |
| 样式系统 | **内联 style 对象**（主导） + Tailwind CSS 4（仅 ui/ 组件用到 className） |
| 路由 | **手动 useState<ViewState>**（9 个视图状态，无 URL 路由）
| 状态管理 | 无全局 store；`user` + `view` 在 App.tsx 根组件 `useState` |
| UI 组件库 | shadcn/ui（Radix UI 原语，49个文件）+ MUI icons（仅少量使用） |
| 图标库 | **lucide-react** v0.487.0（21 个图标实例） |
| 构建工具 | Vite 6.3.5 + @vitejs/plugin-react |
| 包管理器 | pnpm |
| 数据层 | 静态 mock 数组（mockData.ts），无 API 调用 |

### 目录树（带文件职责标注）

```
figma-prototype/
├── index.html                          → HTML 入口，含 <script type="module" src="/src/main.tsx">
├── package.json                        → 依赖声明（React/MUI/Radix/lucide/Tailwind）
├── vite.config.ts                      → Vite 配置：React + Tailwind 插件 + figma:asset 解析器
├── postcss.config.mjs                  → PostCSS 配置（Tailwind）
├── pnpm-workspace.yaml                 → pnpm workspace
├── default_shadcn_theme.css            → shadcn/ui 默认主题变量（备查）
├── guidelines/Guidelines.md            → 空模板
├── README.md                           → 项目说明
└── src/
    ├── main.tsx                        → 🔴 入口：ReactDOM.createRoot → render <App/>
    ├── styles/
    │   ├── index.css                   → 样式入口：@import fonts.css + tailwind.css + theme.css
    │   ├── fonts.css                   → 字体声明
    │   ├── tailwind.css                → Tailwind 指令
    │   ├── theme.css                   → shadcn/ui CSS 变量（light/dark）
    │   └── globals.css                 → 空文件
    └── app/
        ├── App.tsx                     → 🔴 根组件：view + user 状态 + 视图调度 + BottomNav
        ├── data/
        │   ├── types.ts                → 6 个接口 + ViewState 可辨识联合 + AdminTab
        │   └── mockData.ts             → 8 个单词 + 4 个词库 + 5 个用户 + AI 模板
        └── components/
            ├── BottomNav.tsx           → 3 标签底部导航（搜索/词库/我的）
            ├── HomeView.tsx            → 搜索 + 今日一词 + 全部词汇列表
            ├── WordDetailView.tsx      → 物理意象图 + 核心义 + 引申义 + 搭配
            ├── LibrariesView.tsx       → 词库列表 + LibraryWordsView 子视图
            ├── ProfileView.tsx         → 未登录引导 / 已登录中心（含管理入口）
            ├── AuthView.tsx            → 登录/注册标签切换 + 手机号+密码表单
            ├── AdminView.tsx           → 管理面板（概览+词库CRUD+单词CRUD+用户列表）
            ├── PhysicalImage.tsx       → 8 个 SVG 物理意象插图
            ├── figma/
            │   └── ImageWithFallback.tsx → 图片加载失败兜底组件
            └── ui/                     → 49 个 shadcn/ui 组件（Radix 封装，本迁移用 uni-ui 替代）
```

### 依赖关系图

```
src/main.tsx
  └─→ App.tsx
        ├─→ types.ts (ViewState, AuthUser)
        ├─→ BottomNav.tsx (lucide: Search, BookOpen, User)
        ├─→ HomeView.tsx (lucide: Search, ArrowRight, Sparkles)
        │     └─→ mockData.ts (mockWords, mockLibraries)
        ├─→ WordDetailView.tsx (lucide: ArrowLeft, ChevronRight)
        │     ├─→ mockData.ts (mockWords, mockLibraries)
        │     └─→ PhysicalImage.tsx (8 个 SVG 组件)
        ├─→ LibrariesView.tsx (lucide: BookOpen, ArrowRight)
        │     └─→ mockData.ts (mockWords, mockLibraries)
        ├─→ ProfileView.tsx (lucide: User, Settings, Shield, LogOut, ChevronRight, BookOpen, Target)
        ├─→ AuthView.tsx (lucide: ArrowLeft, Eye, EyeOff)
        │     └─→ mockData.ts (mockUsers)
        └─→ AdminView.tsx (lucide: Plus, Trash2, ArrowLeft, RefreshCw, Loader, Check, X, ArrowRight, Search, BookOpen, Type, Users)
              ├─→ mockData.ts (mockWords, mockLibraries, mockUsers, AI_GENERATED_TEMPLATES)
              └─→ PhysicalImage.tsx
```

---

## 文档 2：交互清单

### 页面：HomeView（首页搜索）

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| H1 | 搜索输入框 | onChange | setQuery → 控制输入值 | 输入中 | 始终 |
| H2 | 搜索输入框 | onFocus | e.target.style → borderColor=#2563EB, background=#fff | 聚焦 | 始终 |
| H3 | 搜索输入框 | onBlur | e.target.style → borderColor=transparent, background=#F1F5F9 | 失焦 | 始终 |
| H4 | 搜索结果卡片 | onClick | navigate({name:'wordDetail', wordId}) | hover/active | query.trim() 非空 |
| H5 | 空状态提示 | — | 显示"未找到相关单词" | 空数据 | results.length===0 && query.trim() |
| H6 | 今日一词卡片 | onClick | navigate({name:'wordDetail', wordId: todayWord.id}) | hover | query 为空 |
| H7 | "查看完整解析"按钮 | onClick | 同 H6 | hover | query 为空（在今日一词卡片内） |
| H8 | 全部词汇列表项 | onClick | navigate({name:'wordDetail', wordId}) | hover | query 为空 |
| H9 | 词库标签徽章 | — | 静态展示蓝色词库名标签 | — | word.libraryId 存在对应 lib |

**状态机**：`query` 空 → 显示今日一词 + 全部词汇 | `query` 非空 + results > 0 → 显示搜索结果 | `query` 非空 + results=0 → 显示空状态

### 页面：WordDetailView（单词详情）

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| W1 | 返回按钮 | onClick | navigate({name:'home'}) | hover | 始终 |
| W2 | 词库标签 | — | 显示所属词库名称（蓝色标签） | — | library 存在 |
| W3 | 单词不存在提示 | — | 显示"单词不存在" + 返回首页按钮 | 不存在 | word === undefined |
| W4 | 存在时的返回首页按钮 | onClick | navigate({name:'home'}) | — | word === undefined |

**状态机**：word 存在 → 正常渲染详情 | word 不存在 → 错误提示页面

### 页面：LibrariesView / LibraryWordsView（词库）

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| L1 | 词库卡片 | onClick | navigate({name:'libraryWords', libraryId}) | hover | 始终 |
| L2 | 返回词库列表按钮 | onClick | navigate({name:'libraries'}) | hover | 始终（LibraryWordsView） |
| L3 | 词库单词列表项 | onClick | navigate({name:'wordDetail', wordId}) | hover | words.length > 0 |
| L4 | 空词库状态 | — | 显示 BookOpen 图标 + "该词库暂无单词" | 空数据 | words.length === 0 |

**状态机**：LibrariesView 始终正常 | LibraryWordsView: words.length > 0 → 列表 | words.length === 0 → 空状态

### 页面：ProfileView（个人中心）

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| P1 | 登录按钮 | onClick | navigate({name:'login'}) | hover | user === null |
| P2 | 注册按钮 | onClick | navigate({name:'register'}) | hover | user === null |
| P3 | 管理后台入口按钮 | onClick | navigate({name:'admin', tab:'overview'}) | hover | user !== null && user.role === 'admin' |
| P4 | 设置菜单项 | onClick | （无操作，占位） | hover | user !== null |
| P5 | 退出登录按钮 | onClick | onLogout() → setUser(null) + navigate('home') | hover | user !== null |

**状态机**：user=null → 未登录引导页面 | user ≠ null + role='admin' → 管理卡片 + 退出 | user ≠ null + role='user' → 学习统计卡片 + 退出

### 页面：AuthView（登录/注册）

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| A1 | 登录标签按钮 | onClick | setTab('login') + setError('') | active/inactive | 始终 |
| A2 | 注册标签按钮 | onClick | setTab('register') + setError('') | active/inactive | 始终 |
| A3 | 用户名输入框 | onChange | setUsername | — | tab==='register' |
| A4 | 用户名输入框 | onFocus/onBlur | 边框色切换 #2563EB ↔ #E5E7EB | 聚焦/失焦 | tab==='register' |
| A5 | 手机号输入框 | onChange | setPhone（maxLength=11, inputMode=numeric） | — | 始终 |
| A6 | 手机号输入框 | onFocus/onBlur | 边框色切换 #2563EB ↔ #E5E7EB | 聚焦/失焦 | 始终 |
| A7 | 密码输入框 | onChange | setPassword | — | 始终 |
| A8 | 密码输入框 | onFocus/onBlur | 边框色切换 #2563EB ↔ #E5E7EB | 聚焦/失焦 | 始终 |
| A9 | 密码输入框 | onKeyDown | key==='Enter' → handleSubmit() | — | 始终 |
| A10 | 密码可见性切换按钮 | onClick | toggle showPassword | 显示/隐藏 | 始终 |
| A11 | 提交按钮 | onClick | handleSubmit() | normal/loading | 始终 |
| A12 | 错误消息 | — | 红色背景错误卡片 | 可见 | error !== '' |
| A13 | 返回按钮 | onClick | navigate({name:'home'}) | hover | 始终 |
| A14 | 演示提示区域 | — | 静态展示测试账号信息 | — | tab==='login' |
| A15 | 提交按钮加载态 | — | disabled + 文字变为"处理中..." | loading | loading===true |

**状态机**：
- tab: login / register（切换时清除 error）
- 表单状态: idle → validating（点击提交）→ loading（验证通过）→ success（onAuth 回调）| error（验证失败或密码错误）
- loading 时按钮 disabled + 文字改变

### 页面：AdminView（管理后台）

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| AD1 | 概览-词库入口 | onClick | setSection('libraries') | hover | section==='overview' |
| AD2 | 概览-单词入口 | onClick | setSection('words') | hover | section==='overview' |
| AD3 | 概览-用户入口 | onClick | setSection('users') | hover | section==='overview' |
| AD4 | 退出管理按钮 | onClick | navigate({name:'profile'}) | hover | section==='overview' |
| AD5 | 新增词库按钮 | onClick | openNew() → editTarget='new' | hover | section==='libraries' |
| AD6 | 词库编辑按钮 | onClick | openEdit(lib) → editTarget=lib | hover | section==='libraries' |
| AD7 | 词库删除按钮 | onClick | window.confirm → deleteLib | hover | section==='libraries' |
| AD8 | 新增单词按钮 | onClick | setEditWord({id: genId()}) | hover | section==='words' |
| AD9 | 单词编辑按钮 | onClick | setEditWord(word) | hover | section==='words' |
| AD10 | 单词删除按钮 | onClick | window.confirm → deleteWord | hover | section==='words' |
| AD11 | 单词搜索输入框 | onChange | setQuery → 实时筛选 | 输入中/聚焦/失焦 | section==='words' |
| AD12 | 单词搜索清除按钮 | onClick | setQuery('') | hover | query 非空 |
| AD13 | 词库/单词编辑-返回按钮 | onClick | setEditTarget(null) / setEditWord(null) | hover | 编辑模式 |
| AD14 | AI 生成按钮 | onClick | handleAI() → 模拟1.8s后填充表单 | normal/loading/done | WordEditForm 中始终 |
| AD15 | 重新生成图片按钮 | onClick | handleRegenImg() → 轮换 coreImageType | normal/loading | WordEditForm 中始终 |
| AD16 | 添加引申义按钮 | onClick | addExt() | hover | isNew===false |
| AD17 | 删除引申义按钮 | onClick | removeExt(i) | hover | isNew===false |
| AD18 | 保存单词按钮 | onClick | handleSave() → onAdd/onEdit | normal | form.word && form.libraryId |
| AD19 | 词库名称输入框 | onChange | setName | — | 编辑模式 |
| AD20 | 词库描述输入框 | onChange | setDesc | — | 编辑模式 |
| AD21 | 所有表单输入框/textarea/select | onFocus | borderColor=#2563EB, background=#fff | 聚焦 | 编辑模式 |
| AD22 | 所有表单输入框/textarea/select | onBlur | borderColor=transparent, background=#F1F5F9 | 失焦 | 编辑模式 |

**状态机**：
- section: overview / libraries / words / users
- 编辑子状态: null（列表）| 'new'（新建词库）| WordLibrary（编辑词库）| Partial<Word>（编辑/新建单词）
- AI 生成状态（WordEditForm）: idle → loading（1.8s）→ done

### 页面：BottomNav（底部导航）

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| B1 | 搜索标签 | onClick | onTabChange('home') | active/inactive | 始终 |
| B2 | 词库标签 | onClick | onTabChange('libraries') | active/inactive | 始终 |
| B3 | 我的标签 | onClick | onTabChange('profile') | active/inactive | 始终 |

---

## 文档 3：数据流图

### 状态所有权树

```
App.tsx (根组件)
├── view: ViewState                      → 控制渲染哪个视图
├── user: AuthUser | null                → 认证用户
├── navigate(newView)                    → setView(newView)
├── handleLogin(u)                       → setUser(u) + navigate
├── handleLogout()                       → setUser(null) + navigate('home')
├── handleTabChange(tab)                 → navigate 到对应主页
│
├── HomeView（无全局影响的状态）
│   └── query: string                    → 搜索筛选词
│
├── WordDetailView（纯展示，无内部状态）
│   └── word: Word | undefined          → mockWords.find()
│
├── AuthView（复杂表单状态）
│   ├── tab: 'login' | 'register'       → 表单模式
│   ├── phone: string                   → 手机号
│   ├── password: string                → 密码
│   ├── username: string                → 用户名（仅注册）
│   ├── showPassword: boolean           → 密码可见性
│   ├── error: string                   → 错误消息
│   └── loading: boolean                → 提交中
│
├── AdminView（局部 CRUD 状态）
│   ├── section: AdminSection           → 当前管理区块
│   ├── libraries: WordLibrary[]        → 可编辑词库列表
│   ├── words: Word[]                   → 可编辑单词列表
│   └── 内部编辑状态（多组件各自管理）:
│       ├── LibraryManager: editTarget | name/desc
│       ├── WordManager: editWord | query
│       └── WordEditForm: form(Partial<Word>) | aiLoading | imgLoading | aiDone | colInput
│
└── BottomNav（纯展示，无内部状态）
```

### 数据源

| 数据 | 来源 | 消费者 |
|------|------|--------|
| mockWords[] (8个) | mockData.ts 静态导出 | HomeView, WordDetailView, LibrariesView, AdminView |
| mockLibraries[] (4个) | mockData.ts 静态导出 | LibrariesView, AdminView, HomeView（取lib名称） |
| mockUsers[] (5个) | mockData.ts 静态导出 | AuthView（登录验证）, AdminView（用户列表） |
| AI_GENERATED_TEMPLATES | mockData.ts 静态导出 | AdminView.generateAIContent() |

### Props 流向

| 组件 | 接收 Props | 来自 |
|------|-----------|------|
| HomeView | navigate: (ViewState)=>void | App.tsx |
| WordDetailView | wordId: string, navigate | App.tsx（view.wordId） |
| LibrariesView | navigate | App.tsx |
| LibraryWordsView | libraryId: string, navigate | LibrariesView 内部 |
| ProfileView | user: AuthUser\|null, navigate, onLogout | App.tsx |
| AuthView | mode: 'login'\|'register', navigate, onAuth | App.tsx |
| AdminView | navigate, user: AuthUser\|null | App.tsx |
| BottomNav | currentTab: Tab, onTabChange | App.tsx |

### 回调流向

```
handleLogin (App.tsx)
  ← AuthView.onAuth(user)
  → setUser(user) + navigate(admin|profile)

handleLogout (App.tsx)
  ← ProfileView.onLogout()
  → setUser(null) + navigate('home')

handleTabChange (App.tsx)
  ← BottomNav.onTabChange(tab)
  → navigate(home|libraries|profile)
```

### 导航图

```
home ──→ wordDetail ──→ home
  │
  ├──→ libraries ──→ libraryWords ──→ wordDetail
  │                    └──→ libraries
  │
  ├──→ profile ──→ login ──→ profile (after login)
  │    │            └──→ register ──→ profile (after register)
  │    │
  │    └──→ admin ──→ overview
  │                  ├──→ libraries (CRUD) ──→ overview
  │                  ├──→ words (CRUD) ──→ overview
  │                  └──→ users ──→ overview
  │
  └──→ (BottomNav: home | libraries | profile)
```

---

## 文档 4：设计 Token

### 调色板

| 令牌 | 色值 | 用途 |
|------|------|------|
| primary | #2563EB | 按钮、链接、激活标签、图标强调 |
| primary-dark | #1D4ED8 | 渐变起始色（主页卡片、管理横幅） |
| primary-light | #3B82F6 | 渐变结束色 |
| primary-bg | #EFF6FF | 标签背景、词库标签、高亮区域 |
| bg-page | #F7F9FC | 全局页面背景 |
| bg-card | #FFFFFF | 卡片、列表项背景 |
| bg-input | #F1F5F9 | 输入框默认背景 |
| bg-input-focus | #FFFFFF | 输入框聚焦时背景 |
| text-primary | #111827 | 标题、正文 |
| text-secondary | #6B7280 | 描述文字、次要信息 |
| text-tertiary | #9CA3AF | 标签、占位符 |
| border-input | #E5E7EB | 输入框默认边框（AuthView 模式） |
| border-input-transparent | transparent | 输入框默认边框（HomeView/AdminView 模式） |
| error | #DC2626 | 错误文字、删除按钮文字 |
| error-bg | #FEF2F2 | 错误消息背景、删除按钮背景 |
| success | #16A34A / #059669 | 成功指示器、AI 完成按钮 |
| success-bg | #F0FDF4 | 成功相关背景 |
| warning | #D97706 / #92400E | 警告文字 |
| warning-bg | #FFFBEB | 演示提示背景 |
| admin-accent | #7C3AED / #4C1D95 | 管理员专属色 |
| admin-bg-light | #FAF5FF | 管理员浅色背景 |
| border-light | #BFDBFE | 词库卡片边框、幽灵按钮边框 |

### 间距体系

| 令牌 | px 值 | 用途 |
|------|-------|------|
| page-pt | 52-56px | 页面顶部安全区域 padding-top |
| page-px | 24px | 页面水平内边距 |
| page-pb | 24-40px | 页面底部内边距 |
| content-pt | 20px | 内容区 top padding |
| card-p-lg | 24px | 大卡片内边距 |
| card-p-md | 20px | 中等卡片内边距 |
| card-p-sm | 16px | 小卡片/列表项内边距 |
| gap-xs | 3-6px | 极小间距 |
| gap-sm | 8-10px | 小元素间距 |
| gap-md | 12-16px | 中等间距 |
| gap-lg | 20-24px | 区块间距 |
| input-px | 14-16px | 输入框水平内边距 |
| input-py | 13-14px | 输入框垂直内边距 |
| bottom-nav-height | 60px | 底部导航栏高度 |
| bottom-padding | 80px | 主内容区底部 padding（为 BottomNav 留空间） |

### 圆角体系

| 令牌 | px | 用途 |
|------|----|------|
| radius-sm | 6-8px | 标签、token badge |
| radius-md | 10-12px | 小元素、图标容器 |
| radius-lg | 14-16px | 输入框、按钮、列表项卡片 |
| radius-xl | 20px | 中等卡片、用户卡片 |
| radius-2xl | 24px | 大卡片、主视觉区域 |
| radius-full | 9999px / 50% | 标签 badge、头像 |

### 字体排版

| 令牌 | 字号/字重/行高 | 用途 |
|------|-------------|------|
| hero | 42px / 800 / 1.1 | 详情页单词大标题 |
| h1 | 26px / 700 / 1.3 | 页面主标题 |
| h2 | 22px / 700 | 子页面标题 |
| h3 | 17-18px / 700 | 卡片标题、单词名 |
| body-lg | 16px / 400-600 / 1.5-1.7 | 正文、输入框 |
| body | 14-15px / 400-500 | 描述文字、例句 |
| caption | 12-13px / 400-500 | 次要信息 |
| label | 11px / 600 | 区块标签（字母间距 2px + 大写） |
| small | 10-11px | 极小文字 |

### 阴影

| 令牌 | CSS 值 | 用途 |
|------|--------|------|
| card-default | 0 2px 12-20px rgba(0,0,0,0.04-0.07) | 普通卡片投影 |
| card-search | 0 2px 16px rgba(0,0,0,0.05) | 搜索结果卡片 |
| elevated-primary | 0 8px 32px rgba(37,99,235,0.25) | 今日一词/管理横幅 |
| elevated-admin | 0 8px 32px rgba(124,58,237,0.25) | 管理员卡片 |
| subtle | 0 1px 4px rgba(0,0,0,0.08) | 标签切换按钮 |

### 渐变

| 令牌 | CSS 值 | 用途 |
|------|--------|------|
| primary-gradient | linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%) | 今日一词、管理横幅 |
| admin-gradient | linear-gradient(135deg, #4C1D95, #7C3AED) | 管理员用户卡片 |
| auth-logo-gradient | linear-gradient(135deg, #1D4ED8, #3B82F6) | 登录页 logo 方块 |
| lib-blue | linear-gradient(135deg, #EFF6FF, #DBEAFE) | 蓝色词库卡片 |
| lib-green | linear-gradient(135deg, #F0FDF4, #DCFCE7) | 绿色词库卡片 |
| lib-orange | linear-gradient(135deg, #FFF7ED, #FED7AA) | 橙色词库卡片 |
| lib-purple | linear-gradient(135deg, #FAF5FF, #EDE9FE) | 紫色词库卡片 |
| ai-card | linear-gradient(135deg, #EFF6FF, #DBEAFE) | AI 生成卡片 |
| evolution-arrow | linear-gradient(to right, #E5E7EB, #2563EB) | 演化箭头渐变线 |

### 特效

| 令牌 | CSS 值 | 涉及文件 | 审计 Grep 模式 |
|------|--------|---------|---------------|
| blur-header | backdrop-filter: blur(16px) | HomeView, LibrariesView, LibraryWordsView, ProfileView(已登录), WordDetailView, AdminView(PageHeader) | `backdrop-filter:\s*blur` |
| blur-bottom-nav | backdrop-filter: blur(20px) + -webkit-backdrop-filter: blur(20px) | BottomNav | `backdrop-filter:\s*blur\(20px\)` |
| header-bg-light | rgba(255,255,255,0.9) | HomeView, LibrariesView, LibraryWordsView, ProfileView | `rgba\(255,\s*255,\s*255` |
| header-bg-page | rgba(247,249,252,0.92-0.94) | WordDetailView, AdminView(PageHeader) | `rgba\(247,\s*249,\s*252` |
| bottom-nav-bg | rgba(255,255,255,0.88) | BottomNav | `rgba\(255,\s*255,\s*255,\s*0\.88\)` |
| transition-default | 0.2s | 全局输入框、按钮、标签切换 | `transition:\s*.*0\.2s` |
| sticky-header | position: sticky, top: 0, zIndex: 10 | WordDetailView, AdminView(PageHeader) | `position:\s*sticky` |
| fixed-bottom-nav | position: fixed, bottom: 0, zIndex: 100 | BottomNav | `position:\s*fixed` |

### 输入框样式模式（Phase 2 Step 4b 输入）🆕

> **来源**：源项目使用命令式 DOM 操作（`e.target.style.xxx = '...'`）管理 focus/blur。

源项目存在 **两种不同的** 输入框 blur 态默认样式：

| 模式 | blur 态 border-color | blur 态 background | focus 态 border-color | focus 态 background | 使用文件 |
|------|---------------------|-------------------|----------------------|--------------------|---------|
| 模式 A（搜索型） | transparent | #F1F5F9 | #2563EB | #FFFFFF | HomeView, AdminView |
| 模式 B（表单型） | #E5E7EB | #FFFFFF | #2563EB | #FFFFFF（不变） | AuthView |

**关键差异**：模式 A 的 background 在 focus/blur 时切换（灰↔白），模式 B 的 background 始终为白色，仅 border-color 切换。两种模式不可混淆。

### 平台默认样式审计（跨平台迁移专用）🆕

> 源平台：Web（React 浏览器渲染） → 目标平台：uni-app（H5 + 小程序）

| 源文件 | 元素 | 属性 | 源平台行为 | 目标平台风险 | 处理方式 |
|--------|-----|------|----------|------------|---------|
| HomeView.tsx | `<input>` 搜索框 | outline | 浏览器默认 focus 轮廓 | 🔴 小程序原生 input 无 outline | 目标 `outline: none` |
| HomeView.tsx | `<input>` 搜索框 | line-height | 浏览器默认 ~1.2 | 🔴 小程序 text 行高不同 | 显式 `line-height: 1.4` |
| HomeView.tsx | `<input>` 搜索框 | box-sizing | content-box（通过 style 设了 border-box） | ✅ 已显式声明 |
| HomeView.tsx | `<input>` 搜索框 | -webkit-appearance | 浏览器默认 | 🟡 小程序无原生外观 | 不需要（uni-app 处理） |
| AuthView.tsx | `<input>` 表单 | outline | 浏览器默认 | 🔴 同上 | 显式 `outline: none` |
| AuthView.tsx | `<input>` 表单 | box-sizing | ✅ 已声明 border-box | — | — |
| AuthView.tsx | `<input type="tel">` | inputMode | 浏览器支持 | 🟡 小程序可能忽略 | 保留，H5 端生效 |
| AdminView.tsx | `<select>` | 原生下拉 | 浏览器默认 | 🔴 小程序无 select → 用 picker 替代 | 映射为 `<picker>` mode='selector' |
| AdminView.tsx | `<textarea>` | resize | ✅ 已声明 vertical | ✅ | — |
| AdminView.tsx | 所有 `<input>` | line-height | l.5（已声明） | ✅ | — |
| App.tsx 全局 | 所有文本元素 | line-height | 浏览器默认 ~1.2 | 🔴 小程序默认 ~1.5 | App.vue 全局设置 |
| App.tsx 全局 | 所有块元素 | box-sizing | content-box（未全局声明） | 🔴 小程序部分默认 border-box | App.vue 全局 `*,*::before,*::after{box-sizing:border-box}` |
| App.tsx 全局 | font-family | Inter, system-ui | 浏览器可用 | 🔴 小程序无 Inter 字体 | 降级为系统默认，H5 条件编译保留 Inter |
| App.tsx 全局 | 容器 overflow | visible（默认） | 正常 | 🔴 scroll-view 子元素默认 hidden | 显式设置 |

### 设计 Token 审计元信息

| 令牌 | 值 | 审计 Grep 模式 | 必须覆盖的文件 |
|------|----|---------------|--------------|
| blur-header | backdrop-filter: blur(16px) | `backdrop-filter:\s*blur` | 所有含 header 的页面（≥5个） |
| header-bg-light | rgba(255,255,255,0.9) | `rgba\(255,\s*255,\s*255,\s*0\.9\)` | HomeView, LibrariesView, LibraryWordsView, ProfileView |
| header-bg-page | rgba(247,249,252,0.92) | `rgba\(247,\s*249,\s*252` | WordDetailView, AdminView |
| page-pt | 52-56px (104-112rpx) | `padding:\s*\d+rpx` | 所有页面 header |
| primary | #2563EB | `#2563EB\|#[23]?[56]?[6]?3EB` | 全局（uni.scss + 各页面） |
| font-family | Inter | `font-family` | App.vue 全局样式 |
| bg-page | #F7F9FC | `#[Ff]7[Ff]9[Ff][Cc]` | 所有页面容器 |
| radius-2xl | 24px (48rpx) | `border-radius:\s*48rpx` | 所有卡片组件 |
| safe-area-bottom | env(safe-area-inset-bottom) | `safe-area-inset-bottom` | BottomNav |
| box-sizing | border-box | `box-sizing` | App.vue 全局 |

---

## 文档 5：图标资产清单

### 图标使用的逐文件统计

| 源文件 | 使用的图标（lucide-react） | 数量 |
|--------|--------------------------|------|
| HomeView.tsx | Search, ArrowRight, Sparkles | 3 |
| WordDetailView.tsx | ArrowLeft, ChevronRight | 2 |
| LibrariesView.tsx | BookOpen, ArrowRight | 2 |
| ProfileView.tsx | User, Settings, Shield, LogOut, ChevronRight, BookOpen, Target | 7 |
| AuthView.tsx | ArrowLeft, Eye, EyeOff | 3 |
| AdminView.tsx | BookOpen, Type, Users, Plus, Trash2, ArrowLeft, RefreshCw, Loader, Check, X, ArrowRight, Search | 12 |
| BottomNav.tsx | Search, BookOpen, User | 3 |
| **总计（去重）** | **20 个独特图标** | |

### 图标属性规格（完整）

| 源图标 (lucide-react) | 尺寸 | 颜色 | 使用位置 | 语义角色 |
|----------------------|------|------|---------|---------|
| Search | 16-20px | #9CA3AF / active:#2563EB | HomeView搜索框、AdminView搜索、BottomNav | 搜索/查找 |
| ArrowRight | 14-16px | #D1D5DB / #2563EB(lib) | 列表项尾部、今日一词、词库卡片 | 导航暗示 |
| ArrowLeft | 18px | #6B7280 | 详情页/管理后台返回、AuthView返回 | 返回操作 |
| Sparkles | 14px | #2563EB | "今日一词"标签装饰 | 装饰强调 |
| BookOpen | 16-32px | 词库色系/ #2563EB | 词库卡片、统计入口、空状态 | 词库/学习 |
| User | 20-36px | #CBD5E1 / #fff / #2563EB | 头像占位、Tab 导航 | 用户标识 |
| Eye | 18px | #9CA3AF | 密码可见切换（显示） | 状态切换 |
| EyeOff | 18px | #9CA3AF | 密码可见切换（隐藏） | 状态切换 |
| Check | 15px | #fff | AI 生成完成标记 | 完成状态 |
| X | 14-15px | #DC2626 / #9CA3AF | 删除引申义、清除搜索 | 关闭/清除 |
| Shield | 20px | #7C3AED | 管理后台入口 | 安全/管理员 |
| LogOut | 16px | #DC2626 | 退出登录按钮 | 退出操作 |
| Settings | 16px | #6B7280 | 设置入口（占位） | 设置 |
| Target | 18px | #16A34A | 学习目标统计 | 统计/进度 |
| Plus | 14-16px | #fff / #6B7280 | 新增按钮 | 新增操作 |
| Trash2 | — | （未直接渲染，仅 import） | — | 删除（未使用） |
| RefreshCw | 13px | #374151 | 重新生成图片 | 刷新操作 |
| Loader | 15px | #fff | 加载中旋转动画 | 加载状态 |
| Type | 20px | #16A34A | 单词管理入口 | 文字/类型 |
| Users | 20px | #7C3AED | 用户管理入口 | 用户组 |
| ChevronRight | 14-18px | #D1D5DB / #2563EB | EvolutionArrow、菜单项 | 展开导航 |

### 图标目标实现方案

**推荐方案：iconfont 字体图标**

- 20 个图标覆盖完整，uni-icons 内置图标不足以覆盖
- 生成 iconfont 字体文件放入 `src/static/fonts/`
- App.vue 全局 `@font-face` 引入
- 每个图标通过 `<text class="iconfont icon-xxx">` 使用

**图标字符映射表（供 Phase 3 Agent 使用）：**

```
search       → \e001    arrow-right  → \e002    arrow-left   → \e003
sparkles     → \e004    book-open    → \e005    user         → \e006
eye          → \e007    eye-off      → \e008    check        → \e009
x            → \e00a    shield       → \e00b    log-out      → \e00c
settings     → \e00d    target       → \e00e    plus         → \e00f
refresh-cw   → \e010    loader       → \e011    type         → \e012
users        → \e013    chevron-right→ \e014
```

**🔴 红线：禁止使用 emoji（如 🔍 ✨ 📖 👤 🛡 ⚙ 🎯 ➕ 🔄 ⏳ ✏️ ❌）替代图标。**

---

## 验证清单

- [x] 每个源文件都在骨架地图中有记录
- [x] 每个可交互元素在交互清单中都有一条记录（共 62 个交互 ID）
- [x] 每个条件渲染分支都有文档记录
- [x] 每个 type/interface 都在数据流图中有记录
- [x] 项目中使用的每种颜色/间距/圆角/字体/特效都在设计 Token 中有记录
- [x] 跨页面共享的设计 Token 都填写了审计 Grep 模式和必须覆盖的文件
- [x] 图标资产清单已生成：含逐文件统计、属性规格、目标实现方案、字符映射表
- [x] 平台默认样式已审计：7 项风险（2🔴 高风险、5🟡 中等风险、2✅ 已处理）
- [x] 输入框样式模式已分类：模式 A（搜索型）vs 模式 B（表单型）
