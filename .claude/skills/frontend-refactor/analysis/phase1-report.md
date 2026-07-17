# Phase 1 深度分析报告 — 英语母语者词典 APP

> **分析日期**：2026-07-15（重新分析，从源码逐行提取）
> **源项目路径**：`figma-prototype/`
> **源框架**：React 18.3.1 + TypeScript + Vite 6.3.5
> **样式方案**：100% 内联 `style={{}}` 对象（Tailwind v4 已安装但实际未使用）
> **目标技术栈**：uni-app（Vue 3 Composition API + `<script setup>` + scoped SCSS）
> **目标平台**：H5 + 微信小程序（全端）
> **源核心文件总数**：13 个

---

## 文档一：项目骨架图 (Skeleton Map)

### 1.1 技术栈详表

| 层级 | 技术 | 版本 | 实际使用情况 |
|------|------|------|-------------|
| 框架 | React | 18.3.1 (peerDep) | 函数组件 + Hooks |
| 渲染 | react-dom | 18.3.1 (peerDep) | `createRoot(...).render(<App />)` |
| 语言 | TypeScript | — | 6 interface + 1 type (ViewState 判别联合) + AdminTab |
| 构建 | Vite | 6.3.5 | react + tailwindcss 插件 + figmaAssetResolver + `@` 别名 |
| 样式 | **内联 `style={{}}`** | — | **100%** 内联样式。Tailwind 类名零使用、shadcn CSS 变量零使用 |
| 路由 | **手动 `useState<ViewState>`** | — | 9 视图条件渲染，react-router 已安装未用 |
| 状态管理 | React `useState` | — | App 级：view + user；组件级：各自局部 |
| 图标 | lucide-react | 0.487.0 | **18 种图标**，覆盖所有视图 |
| 数据 | 静态 mock | — | 4 词库 + 8 单词 + 5 用户 |
| 弹窗 | `window.confirm()` | — | AdminView 删除确认（同步阻塞） |
| 异步模拟 | `setTimeout` | — | 800ms 登录、1800ms AI 生成、500ms 图片切换 |
| 物理意象图片 | 8 个内联 JSX SVG | — | 8 个独立 SVG 组件 + 1 回退 GenericImage |
| 字体 | Google Fonts Inter | — | CSS @import（300-700 字重） |

### 1.2 目录树（按职责标注）

```
figma-prototype/
├── index.html                          → 🌐 HTML 入口：viewport meta + #root + 内联 style 重置
├── package.json                        → 📦 依赖声明（65 deps，实际仅使用 lucide-react + react/react-dom）
├── vite.config.ts                      → ⚙️ Vite：react + tailwindcss + figmaAssetResolver + @ 别名
├── postcss.config.mjs                  → ⚙️ PostCSS（空壳：空对象导出）
├── pnpm-workspace.yaml                 → ⚙️ pnpm workspace
├── src/
│   ├── main.tsx                        → 🚀 JS 入口：createRoot + render <App /> + import styles/index.css
│   ├── styles/
│   │   ├── index.css                   → 🔗 汇总入口：fonts.css → tailwind.css → theme.css
│   │   ├── tailwind.css                → 🎨 Tailwind v4 @import + @source（实际未使用）
│   │   ├── theme.css                   → 🎨 shadcn CSS 变量 + @theme inline（实际未使用）
│   │   ├── fonts.css                   → 🔤 Google Fonts Inter @import
│   │   └── globals.css                 → 📄 空文件
│   └── app/
│       ├── App.tsx                     → 🌐 根：user+view state, navigate, login/logout, tabChange, BottomNav
│       ├── data/
│       │   ├── types.ts                → 📐 6 interface + 1 discriminated union + 1 type
│       │   └── mockData.ts             → 📦 mockLibraries(4) + mockWords(8) + mockUsers(5) + AI templates(5)
│       └── components/
│           ├── HomeView.tsx            → 🏠 主页：搜索 + 今日一词 + 全部词汇
│           ├── WordDetailView.tsx      → 📖 单词详情：sticky header + 物理意象 + 核心义 + 引申义 + 搭配
│           ├── LibrariesView.tsx       → 📚 词库列表 + LibraryWordsView（同文件，2 组件）
│           ├── ProfileView.tsx         → 👤 个人中心：未登录/已登录 + 管理员/普通用户 + MenuRow 内嵌
│           ├── AuthView.tsx            → 🔐 登录/注册：Tab 切换 + 表单验证 + loading + 演示提示
│           ├── AdminView.tsx           → ⚙️ 管理后台（763行）：Overview + LibraryManager + WordEditForm +
│           │                              WordManager + UserManager + 3 内嵌工具组件 (PageHeader/SLabel/PrimaryBtn)
│           ├── BottomNav.tsx           → 🧭 底部导航：3 Tab + 毛玻璃 + active 态
│           ├── PhysicalImage.tsx       → 🎨 8 SVG 组件 (Flow/Grasp/Break/Bear/Drive/Light/Leverage/Yield) +
│           │                              GenericImage + imageMap
│           └── figma/
│               └── ImageWithFallback.tsx → 🖼️ 未被引用（废弃）
├── src/app/components/ui/ (48 .tsx)    → 🧩 shadcn/ui 预生成，100% 未使用
└── guidelines/Guidelines.md            → 📋 空模板（无有效内容）
```

### 1.3 依赖关系图

```
main.tsx
 └─► styles/index.css → fonts.css → tailwind.css → theme.css
 └─► App.tsx (view, user, navigate, handleLogin, handleLogout, handleTabChange)
      ├─► types.ts (所有类型)
      ├─► BottomNav.tsx (Search, BookOpen, User — lucide-react)
      │    └─► view === 'admin' 时不渲染 BottomNav
      ├─► HomeView.tsx ← mockData (mockWords, mockLibraries)
      │    └─► lucide: Search, ArrowRight, Sparkles
      ├─► WordDetailView.tsx ← mockData (mockWords, mockLibraries)
      │    ├─► PhysicalImage.tsx ← 8 SVG 组件
      │    └─► lucide: ArrowLeft, ChevronRight
      ├─► LibrariesView.tsx (含 LibraryWordsView) ← mockData
      │    └─► lucide: BookOpen, ArrowRight
      ├─► ProfileView.tsx ← mockUsers (间接，未直接 import)
      │    ├─► MenuRow (内嵌同文件)
      │    └─► lucide: User, Settings, Shield, LogOut, ChevronRight, BookOpen, Target
      ├─► AuthView.tsx ← mockData (mockUsers)
      │    └─► lucide: ArrowLeft, Eye, EyeOff
      └─► AdminView.tsx ← mockData (全部) + PhysicalImage
           ├─► 内嵌：PageHeader, SLabel, PrimaryBtn, Overview
           ├─► 内嵌：LibraryManager, WordEditForm, WordManager, UserManager
           └─► lucide: BookOpen, Type, Users, Plus, Trash2, ArrowLeft, RefreshCw, Loader,
                       ChevronRight, Check, X, ArrowRight, Search
```

### 1.4 核心文件清单（13 个）

| # | 文件 | 行数 | 职责 | 类型 |
|---|------|------|------|------|
| 1 | `src/app/data/types.ts` | 59 | 6 interface + ViewState + AdminTab | 数据 |
| 2 | `src/app/data/mockData.ts` | 364 | Mock 数据 + AI 模板 | 数据 |
| 3 | `src/main.tsx` | 7 | JS 入口：createRoot + styles | 入口 |
| 4 | `src/app/App.tsx` | 76 | 根组件：路由 + 认证 + BottomNav | 入口/路由 |
| 5 | `src/app/components/HomeView.tsx` | 234 | 主页：搜索 + 今日一词 + 全部词汇 | 页面 |
| 6 | `src/app/components/WordDetailView.tsx` | 247 | 单词详情：4 区 + EvolutionArrow | 页面 |
| 7 | `src/app/components/LibrariesView.tsx` | 190 | 词库列表(105行) + LibraryWordsView(85行) | 页面 |
| 8 | `src/app/components/ProfileView.tsx` | 221 | 未登录/已登录/admin/user + MenuRow | 页面 |
| 9 | `src/app/components/AuthView.tsx` | 241 | 登录/注册 + Tab + 表单验证 + demo | 页面 |
| 10 | `src/app/components/AdminView.tsx` | 763 | 管理后台：4 section + 3 工具组件 + 5 功能组件 | 页面 |
| 11 | `src/app/components/BottomNav.tsx` | 65 | 底部 3 Tab 导航 + 毛玻璃 | UI |
| 12 | `src/app/components/PhysicalImage.tsx` | 279 | 8 个内联 SVG + GenericImage | UI |
| 13 | `src/styles/` (5 文件) | ~82 | 样式入口 + 变量（实际未用） | 样式 |

---

## 文档二：交互清单 (Interaction Inventory)

> 每条交互分配唯一 ID。格式 `INT-XXX`。
> ID 前缀：H=HomeView, W=WordDetailView, L=LibrariesView/LibraryWordsView,
> P=ProfileView, A=AuthView, AD=AdminView, B=BottomNav, APP=App.tsx

### 2.0 App.tsx — 根路由控制

#### 交互表

| ID | 元素 | 触发器 | 行为 | 状态 | 条件分支 |
|----|------|--------|------|------|----------|
| APP-001 | BottomNav Tab (搜索) | onClick → handleTabChange('home') | navigate({ name: 'home' }) | active: currentTab==='home' | view.name !== 'admin' |
| APP-002 | BottomNav Tab (词库) | onClick → handleTabChange('libraries') | navigate({ name: 'libraries' }) | active: currentTab==='libraries' | view.name !== 'admin' |
| APP-003 | BottomNav Tab (我的) | onClick → handleTabChange('profile') | navigate({ name: 'profile' }) | active: currentTab==='profile' | view.name !== 'admin' |

#### 条件渲染表（App.tsx）

| ID | 条件 | 为真时渲染 | 为假时渲染 |
|----|------|-----------|------------|
| C-APP-001 | `view.name === 'admin'` | `<AdminView>` 全屏（无 BottomNav） | 常规视图 + BottomNav |
| C-APP-002 | `view.name === 'home'` | `<HomeView>` | — |
| C-APP-003 | `view.name === 'wordDetail'` | `<WordDetailView wordId={view.wordId}>` | — |
| C-APP-004 | `view.name === 'libraries'` | `<LibrariesView>` | — |
| C-APP-005 | `view.name === 'libraryWords'` | `<LibraryWordsView libraryId={view.libraryId}>` | — |
| C-APP-006 | `view.name === 'profile'` | `<ProfileView user={user}>` | — |
| C-APP-007 | `view.name === 'login'` | `<AuthView mode="login">` | — |
| C-APP-008 | `view.name === 'register'` | `<AuthView mode="register">` | — |

#### App.tsx 状态机

- 初始状态：`view = { name: 'home' }`, `user = null`
- 登录成功 → `user = AuthUser` → admin 跳 `{ name: 'admin', tab: 'overview' }`，user 跳 `{ name: 'profile' }`
- 登出 → `user = null`, view → `{ name: 'home' }`

#### tabFromView() 映射

| ViewState.name | 返回 Tab |
|---------------|----------|
| 'home' / 'wordDetail' | 'home' |
| 'libraries' / 'libraryWords' | 'libraries' |
| 'profile' / 'login' / 'register' | 'profile' |
| 'admin' | (不渲染 BottomNav) |

---

### 2.1 HomeView.tsx — 主页

#### 交互表

| ID | 元素 | 触发器 | 行为 | 状态 | 条件分支 |
|----|------|--------|------|------|----------|
| H-001 | 搜索输入框 | onChange → setQuery(e.target.value) | 更新搜索词 → 实时过滤 results | default (受控) | 始终渲染 |
| H-002 | 搜索输入框 | onFocus | e.target.style.borderColor='#2563EB', e.target.style.background='#fff' | focused | 始终渲染 |
| H-003 | 搜索输入框 | onBlur | e.target.style.borderColor='transparent', e.target.style.background='#F1F5F9' | blurred | 始终渲染 |
| H-004 | 搜索结果列表项 | onClick | navigate({ name: 'wordDetail', wordId: word.id }) | default | query.trim() 非空 && results.length > 0 |
| H-005 | 今日一词卡片（完整卡片） | onClick | navigate({ name: 'wordDetail', wordId: todayWord.id }) | default | query.trim() === '' |
| H-006 | "查看完整解析"文字 | 无独立事件（由 H-005 覆盖） | — | — | 在今日一词卡片内 |
| H-007 | 全部词汇列表项 | onClick | navigate({ name: 'wordDetail', wordId: word.id }) | default | query.trim() === '' |

#### 条件渲染表（HomeView.tsx）

| ID | 条件 | 为真时渲染 | 为假时渲染 |
|----|------|-----------|------------|
| C-H-001 | `query.trim()` 非空 | 搜索结果区 | — |
| C-H-002 | `query.trim() && results.length === 0` | "未找到相关单词" + 副提示 | — |
| C-H-003 | `query.trim() && results.length > 0` | 搜索结果卡片列表 | — |
| C-H-004 | `!query.trim()` | 今日一词卡片 + 全部词汇列表 | — |
| C-H-005 | `lib` 存在（词库查找） | 词库名标签 span | — |

#### 状态变量

| 变量 | 类型 | 来源 |
|------|------|------|
| `query` | `string` | useState('') — 受控输入 |
| `results` | `Word[]` | 派生：query非空 ? mockWords.filter(...) : [] |
| `featuredWord` | `Word` | 固定：mockWords.find(w=>w.id==='w1')! |
| `todayWord` | `Word` | 派生：mockWords[Math.floor(Date.now()/86400000) % mockWords.length] |

---

### 2.2 WordDetailView.tsx — 单词详情

#### 交互表

| ID | 元素 | 触发器 | 行为 | 状态 | 条件分支 |
|----|------|--------|------|------|----------|
| W-001 | 返回按钮 | onClick | navigate({ name: 'home' }) | default | word 存在时渲染 |
| W-002 | "单词不存在"页返回按钮 | onClick | navigate({ name: 'home' }) | default | word === undefined 时渲染 |
| W-003 | 词库标签（右上角） | 纯展示 | — | — | library 存在时渲染 |

#### 条件渲染表（WordDetailView.tsx）

| ID | 条件 | 为真时渲染 | 为假时渲染 |
|----|------|-----------|------------|
| C-W-001 | `!word` | "单词不存在" + 返回按钮（居中） | — |
| C-W-002 | `word` 存在 | 完整详情页 | — |
| C-W-003 | `library` 存在 | 右上角词库名标签 | — |

#### WordDetailView 状态机

- word 不存在 → 错误页：居中文字 + 返回首页按钮
- word 存在 → 渲染：sticky header(返回+词库标签) + 单词展示区(h1+音标) + 物理意象区 + 核心义卡片(含例句) + 引申义列表 + 常见搭配

#### 状态变量

| 变量 | 类型 | 来源 |
|------|------|------|
| `word` | `Word \| undefined` | 派生：mockWords.find(w=>w.id===wordId) |
| `library` | `WordLibrary \| undefined` | 派生：mockLibraries.find(l=>l.id===word.libraryId) |

---

### 2.3 LibrariesView.tsx — 词库列表 + 库内单词

#### LibrariesView 交互表

| ID | 元素 | 触发器 | 行为 | 状态 | 条件分支 |
|----|------|--------|------|------|----------|
| L-001 | 词库卡片 | onClick | navigate({ name: 'libraryWords', libraryId: lib.id }) | default/hover | 每个 mockLibrary |
| L-002 | BookOpen 图标（卡片内） | 无独立事件 | 纯展示 | — | 始终渲染 |

#### LibraryWordsView 交互表

| ID | 元素 | 触发器 | 行为 | 状态 | 条件分支 |
|----|------|--------|------|------|----------|
| L-010 | 返回按钮（"词库列表"） | onClick | navigate({ name: 'libraries' }) | default | 始终渲染 |
| L-011 | 库内单词列表项 | onClick | navigate({ name: 'wordDetail', wordId: word.id }) | default | words.length > 0 |
| L-012 | 空状态区域 | 纯展示 | — | — | words.length === 0 |

#### 条件渲染表（LibrariesView.tsx）

| ID | 条件 | 为真时渲染 | 为假时渲染 |
|----|------|-----------|------------|
| C-L-001 | `wordsInLib.length > 0` | "已收录 N 个" 标签 | — |
| C-L-002 | `words.length === 0`（LibraryWordsView） | "该词库暂无单词" + BookOpen 图标 | 单词列表 |
| C-L-003 | `words.length > 0`（LibraryWordsView） | 单词列表 | — |

#### 状态变量

| 变量 | 类型 | 来源 |
|------|------|------|
| `libraryColors[]` | 局部常量 | 4 组颜色对象 (bg, accent, border) |
| `wordsInLib` (LibrariesView) | `Word[]` | 派生：mockWords.filter(w=>w.libraryId===lib.id) |
| `library` (LibraryWordsView) | `WordLibrary \| undefined` | 派生：mockLibraries.find(l=>l.id===libraryId) |
| `words` (LibraryWordsView) | `Word[]` | 派生：mockWords.filter(w=>w.libraryId===libraryId) |

---

### 2.4 ProfileView.tsx — 个人中心

#### 交互表

| ID | 元素 | 触发器 | 行为 | 状态 | 条件分支 |
|----|------|--------|------|------|----------|
| P-001 | 登录按钮 | onClick | navigate({ name: 'login' }) | default | user === null |
| P-002 | 注册按钮 | onClick | navigate({ name: 'register' }) | default | user === null |
| P-003 | 管理后台入口按钮 | onClick | navigate({ name: 'admin', tab: 'overview' }) | default | user && user.role === 'admin' |
| P-004 | 设置菜单行 | onClick | 预留未实现（空函数） | default | user 已登录 |
| P-005 | 退出登录按钮 | onClick | onLogout() → App.handleLogout | default | user 已登录 |
| P-006 | 统计卡片—已学单词 | 纯展示 | — | — | user && user.role !== 'admin' |
| P-007 | 统计卡片—今日目标 | 纯展示 | — | — | user && user.role !== 'admin' |

#### 条件渲染表（ProfileView.tsx）

| ID | 条件 | 为真时渲染 | 为假时渲染 |
|----|------|-----------|------------|
| C-P-001 | `!user`（未登录） | 大头像占位 + 标题 + 描述 + 登录/注册按钮 | — |
| C-P-002 | `user` 已登录 | 含 header blur 的个人中心 | — |
| C-P-003 | `isAdmin === true` | 紫色渐变用户卡片 + 管理后台入口 | — |
| C-P-004 | `isAdmin === false` | 蓝色渐变用户卡片 + 2 格学习统计 | — |

#### ProfileView 状态机

- `user === null` → 未登录态：灰色大头像 + "登录后开始学习" + 登录按钮 + 注册按钮
- `user.role === 'admin'` → 管理员态：紫色渐变卡片 + 管理员标签 + 管理后台入口 + 设置 + 退出
- `user.role === 'user'` → 普通用户态：蓝色渐变卡片 + 普通用户标签 + 已学单词/今日目标 + 设置 + 退出

#### 状态变量

| 变量 | 类型 | 来源 |
|------|------|------|
| `user` | `AuthUser \| null` | Props from App.tsx |
| `isAdmin` | `boolean` | 派生：user?.role === 'admin' |

---

### 2.5 AuthView.tsx — 登录/注册

#### 交互表

| ID | 元素 | 触发器 | 行为 | 状态 | 条件分支 |
|----|------|--------|------|------|----------|
| A-001 | 返回按钮 | onClick | navigate({ name: 'home' }) | default | 始终渲染 |
| A-002 | Tab 切换（登录） | onClick | setTab('login'), setError('') | active: tab==='login' | 始终渲染 |
| A-003 | Tab 切换（注册） | onClick | setTab('register'), setError('') | active: tab==='register' | 始终渲染 |
| A-004 | 用户名输入框 | onChange | setUsername(e.target.value) | default/focus/blur | tab==='register' |
| A-005 | 用户名输入框 | onFocus | e.target.style.borderColor='#2563EB' | focused | 始终 |
| A-006 | 用户名输入框 | onBlur | e.target.style.borderColor='#E5E7EB' | blurred | 始终 |
| A-007 | 手机号输入框 | onChange | setPhone(e.target.value) | default | 始终（maxLength=11，inputMode="numeric"） |
| A-008 | 手机号输入框 | onFocus | e.target.style.borderColor='#2563EB' | focused | — |
| A-009 | 手机号输入框 | onBlur | e.target.style.borderColor='#E5E7EB' | blurred | — |
| A-010 | 密码输入框 | onChange | setPassword(e.target.value) | default | 始终 |
| A-011 | 密码输入框 | onFocus | e.target.style.borderColor='#2563EB' | focused | — |
| A-012 | 密码输入框 | onBlur | e.target.style.borderColor='#E5E7EB' | blurred | — |
| A-013 | 密码输入框 | onKeyDown (key==='Enter') | handleSubmit() | — | 始终 |
| A-014 | 密码可见性切换按钮 | onClick | setShowPassword(v=>!v) | showPassword true/false | 始终 |
| A-015 | 提交按钮 | onClick → handleSubmit | 验证→setLoading(true)→setTimeout(800ms)→onAuth | normal/loading/disabled | 始终 |
| A-016 | 提交按钮 disabled 态 | 纯样式 | 背景 #93C5FD, cursor default, 无指针事件 | loading===true | — |
| A-017 | setTimeout 800ms | 异步回调 | 登录：match mockUsers / 注册：new user → onAuth | loading→done | — |

#### 条件渲染表（AuthView.tsx）

| ID | 条件 | 为真时渲染 | 为假时渲染 |
|----|------|-----------|------------|
| C-A-001 | `tab === 'register'` | 用户名输入框行 | — |
| C-A-002 | `tab === 'login'` | 演示账号提示框（黄色） | — |
| C-A-003 | `error` 非空 | 红色错误提示条 | — |
| C-A-004 | `loading === true` | "处理中..." 文字 + 按钮 disabled | 正常按钮文字 |
| C-A-005 | `showPassword === true` | EyeOff 图标 + input type="text" | Eye 图标 + input type="password" |
| C-A-006 | `tab === 'login'` | placeholder "输入密码（演示：123456）" | placeholder "至少6位密码" |

#### AuthView 状态机

- 初始：tab=mode prop, phone='', password='', username='', showPassword=false, error='', loading=false
- loading: loading=true → 按钮禁用 + 文字 "处理中..."；800ms 后 → loading=false + onAuth
- error: 验证失败或登录失败 → error 文字 + 红色提示条
- Tab 切换 → error 被清空
- 登录成功 → onAuth(user) → App.handleLogin → setUser + navigate
- 注册成功 → onAuth({id:'new', username, phone, role:'user'})

#### 状态变量

| 变量 | 类型 | 来源 |
|------|------|------|
| `tab` | `'login' \| 'register'` | useState(mode) — 可切换 |
| `phone` | `string` | useState('') |
| `password` | `string` | useState('') |
| `username` | `string` | useState('') |
| `showPassword` | `boolean` | useState(false) |
| `error` | `string` | useState('') |
| `loading` | `boolean` | useState(false) |

#### 验证逻辑

1. 空字段检查 → "请填写所有必填字段"
2. 手机号格式（isValidPhone: /^1[3-9]\d{9}$/）→ "请输入有效的手机号"
3. 注册模式用户名 → "请填写用户名"
4. 登录：mockUsers.find(u=>u.phone===cleanPhone) + password==='123456' → onAuth
5. 注册：直接 onAuth(new user)

---

### 2.6 BottomNav.tsx — 底部导航

#### 交互表

| ID | 元素 | 触发器 | 行为 | 状态 | 条件分支 |
|----|------|--------|------|------|----------|
| B-001 | Tab "搜索" | onClick | onTabChange('home') | active: color=#2563EB, strokeWidth=2.5, fontWeight=600 | — |
| B-002 | Tab "词库" | onClick | onTabChange('libraries') | active: color=#2563EB, strokeWidth=2.5, fontWeight=600 | — |
| B-003 | Tab "我的" | onClick | onTabChange('profile') | active: color=#2563EB, strokeWidth=2.5, fontWeight=600 | — |

#### BottomNav 状态

- Tab active 态：color=#2563EB, fontWeight=600, 图标 strokeWidth=2.5
- Tab default 态：color=#9CA3AF, fontWeight=400, 图标 strokeWidth=1.8
- 容器：position fixed, bottom 0, maxWidth 430px, left 50%+translateX(-50%)
- 毛玻璃：background rgba(255,255,255,0.88), backdropFilter blur(20px), WebkitBackdropFilter blur(20px)
- 安全区：paddingBottom env(safe-area-inset-bottom, 0)
- 顶部线：borderTop 1px solid rgba(0,0,0,0.06)

---

### 2.7 AdminView.tsx — 管理后台（763行）

> AdminView 包含 5 个功能子视图 + 3 个工具组件（PageHeader/SLabel/PrimaryBtn）。
> 主组件通过 `useState<AdminSection>` 控制 4 个子视图切换。

#### 2.7.0 AdminView 主组件交互

| ID | 元素 | 触发器 | 行为 | 状态 |
|----|------|--------|------|------|
| AD-000 | section 状态切换 | setSection(s) | 切换渲染 Overview/LibraryManager/WordManager/UserManager | — |

#### 2.7.1 Overview 子视图

| ID | 元素 | 触发器 | 行为 | 状态 | 条件分支 |
|----|------|--------|------|------|----------|
| AD-101 | 词库管理入口卡片 | onClick | onNavigate('libraries') | default/hover | 始终 |
| AD-102 | 单词管理入口卡片 | onClick | onNavigate('words') | default/hover | 始终 |
| AD-103 | 用户管理入口卡片 | onClick | onNavigate('users') | default/hover | 始终 |
| AD-104 | 退出管理按钮 | onClick | onExit() → navigate({ name: 'profile' }) | default | 始终 |

#### 2.7.2 LibraryManager 子视图

| ID | 元素 | 触发器 | 行为 | 状态 | 条件分支 |
|----|------|--------|------|------|----------|
| AD-201 | 新增按钮（右上角） | onClick | openNew() → setEditTarget('new') | default | 列表模式 |
| AD-202 | 词库卡片编辑按钮 | onClick | openEdit(lib) → setEditTarget(lib) | default | 列表模式 |
| AD-203 | 词库卡片删除按钮 | onClick | onDelete(lib.id) → window.confirm | default | 列表模式 |
| AD-204 | 词库名称 input | onChange | setName(e.target.value) | default/focus/blur | 编辑模式 |
| AD-205 | 词库描述 textarea | onChange | setDesc(e.target.value) | default/focus/blur | 编辑模式 |
| AD-206 | 词库编辑保存按钮 | onClick | handleSave() → onAdd/onEdit | disabled: !name.trim() | 编辑模式 |
| AD-207 | 词库编辑取消按钮 | onClick | setEditTarget(null) | default | 编辑模式 |
| AD-208 | 编辑模式返回按钮 | onClick | setEditTarget(null) | default | 编辑模式 |
| AD-209 | 词库列表返回按钮 | onClick | onBack() → setSection('overview') | default | 列表模式 |
| AD-210 | 编辑模式 input onFocus | onFocus | (e.target).style.borderColor='#2563EB'; .style.background='#fff' | focused | 编辑模式 |
| AD-211 | 编辑模式 input onBlur | onBlur | (e.target).style.borderColor='transparent'; .style.background='#F1F5F9' | blurred | 编辑模式 |

#### 2.7.3 WordManager 子视图

| ID | 元素 | 触发器 | 行为 | 状态 | 条件分支 |
|----|------|--------|------|------|----------|
| AD-301 | 搜索 input | onChange | setQuery(e.target.value) | default/focus/blur | 列表模式 |
| AD-302 | 搜索 input onFocus | onFocus | border→#2563EB, bg→#fff | focused | — |
| AD-303 | 搜索 input onBlur | onBlur | border→transparent, bg→#F1F5F9 | blurred | — |
| AD-304 | 搜索清除按钮(X) | onClick | setQuery('') | default | query 非空时渲染 |
| AD-305 | 新增按钮（右上角） | onClick | setEditWord({ id: genId() }) | default | 列表模式 |
| AD-306 | 单词编辑按钮 | onClick | setEditWord(word) | default | 列表模式 |
| AD-307 | 单词删除按钮 | onClick | onDelete(word.id) → window.confirm | default | 列表模式 |
| AD-308 | 编辑模式返回按钮 | onClick | setEditWord(null) | default | 编辑模式 |

#### 2.7.4 WordEditForm 子组件交互

| ID | 元素 | 触发器 | 行为 | 状态 | 条件分支 |
|----|------|--------|------|------|----------|
| AD-401 | 单词 input（AI 区） | onChange | set('word', e.target.value); setAiDone(false) | default/focus/blur | 始终 |
| AD-402 | AI 生成按钮 | onClick | handleAI() → setAiLoading(true) → setTimeout(1800ms) | aiLoading/aiDone/default | 始终 |
| AD-403 | 词库 select | onChange | set('libraryId', e.target.value) | default/focus/blur | 始终 |
| AD-404 | 音标 input | onChange | set('phonetic', e.target.value) | default/focus/blur | 始终 |
| AD-405 | 核心义描述 textarea | onChange | set('coreMeaning', e.target.value) | default/focus/blur | 始终 |
| AD-406 | 核心义例句 textarea | onChange | set('coreExampleSentence', e.target.value) | default/focus/blur | 始终 |
| AD-407 | 例句翻译 textarea | onChange | set('coreExampleTranslation', e.target.value) | default/focus/blur | 始终 |
| AD-408 | 重新生成图片按钮 | onClick | handleRegenImg() → setImgLoading(true) → setTimeout(500ms) | imgLoading/default | 始终 |
| AD-409 | 引申义逻辑演化 input | onChange | updateExt(i, 'logicalEvolution', e.target.value) | default/focus/blur | 每个引申义 |
| AD-410 | 引申义描述 input | onChange | updateExt(i, 'meaning', e.target.value) | default/focus/blur | 每个引申义 |
| AD-411 | 引申义词性 select | onChange | updateExt(i, 'partOfSpeech', e.target.value) | default | 每个引申义 |
| AD-412 | 引申义例句 textarea | onChange | updateExt(i, 'exampleSentence', e.target.value) | default/focus/blur | 每个引申义 |
| AD-413 | 引申义例句翻译 textarea | onChange | updateExt(i, 'exampleTranslation', e.target.value) | default/focus/blur | 每个引申义 |
| AD-414 | 引申义删除按钮(X) | onClick | removeExt(i) | default | !isNew |
| AD-415 | 添加引申义按钮 | onClick | addExt() → 追加空对象 | default | !isNew |
| AD-416 | 搭配 textarea | onChange | setColInput(e.target.value) | default/focus/blur | 始终 |
| AD-417 | 保存单词按钮 | onClick | handleSave() → onSave(word) | disabled: !word \|\| !libraryId | 始终 |
| AD-418 | 取消按钮 | onClick | onCancel() | default | !isNew |

**WordEditForm 条件渲染**：
| ID | 条件 | 为真时渲染 |
|----|------|-----------|
| C-AD-001 | `(form.extendedMeanings \|\| []).length === 0 && isNew` | "点击上方 AI 按钮后自动填充" 空状态 |
| C-AD-002 | `!isNew` | 引申义删除按钮 + 添加引申义按钮 + 取消按钮 |

**WordEditForm 状态机**：
- AI 按钮：aiLoading=false, aiDone=false → 点击 → aiLoading=true → 1800ms → aiDone=true, fill form
- 重新生成图片：imgLoading=false → 点击 → imgLoading=true → 500ms → cycle coreImageType
- 保存：验证 word + libraryId → onSave

#### 2.7.5 UserManager 子视图

| ID | 元素 | 触发器 | 行为 | 状态 |
|----|------|--------|------|------|
| AD-501 | 返回按钮 | onClick | onBack() → setSection('overview') | default |

（UserManager 为只读列表，无其他交互）

---

## 文档三：数据流图 (Data Flow)

### 3.1 状态所有权树

```
App.tsx
├── view: ViewState                         → 控制全部分视图渲染
│   └── navigate(newView)                   → setView(newView)
├── user: AuthUser | null                   → ProfileView, AuthView, AdminView
│   ├── handleLogin(u)                      → setUser + navigate
│   ├── handleLogout()                      → setUser(null) + navigate('home')
│   └── handleTabChange(tab)               → navigate(tab)
│
├── HomeView (局部状态)
│   └── query: string                       → 搜索过滤
│
├── AuthView (局部状态)
│   ├── tab: 'login'|'register'            → 表单模式
│   ├── phone, password, username           → 表单字段
│   ├── showPassword: boolean               → 密码可见性
│   ├── error: string                       → 验证错误信息
│   └── loading: boolean                    → 提交状态
│
├── LibrariesView (局部状态) — 无状态，纯渲染
│
├── LibraryWordsView (局部状态) — 无状态，纯渲染
│
└── AdminView (局部状态)
    ├── section: AdminSection               → 4 子视图切换
    ├── libraries: WordLibrary[]            → CRUD 局部副本
    ├── words: Word[]                       → CRUD 局部副本
    ├── LibraryManager (局部状态)
    │   ├── editTarget: WordLibrary | 'new' | null
    │   ├── name, desc: string
    ├── WordManager (局部状态)
    │   ├── editWord: Partial<Word> | null
    │   ├── query: string (搜索)
    └── WordEditForm (局部状态)
        ├── form: Partial<Word>
        ├── aiLoading, imgLoading, aiDone: boolean
        └── colInput: string
```

### 3.2 数据源

| 数据 | 来源文件 | 消费者 |
|------|---------|--------|
| `mockWords[]` (8) | mockData.ts | HomeView, WordDetailView, LibrariesView, LibraryWordsView, AdminView.WordManager, AdminView.WordEditForm |
| `mockLibraries[]` (4) | mockData.ts | LibrariesView, LibraryWordsView, AdminView.LibraryManager, AdminView.WordEditForm |
| `mockUsers[]` (5) | mockData.ts | AuthView (登录验证), AdminView.UserManager |
| `AI_GENERATED_TEMPLATES` (5) | mockData.ts | AdminView.generateAIContent() |
| `IMAGE_TYPES` (8) | AdminView.tsx (局部) | AdminView.WordEditForm |

### 3.3 Props 流向

| 目标组件 | Props | 来源 |
|---------|-------|------|
| HomeView | navigate: (view: ViewState) => void | App.tsx |
| WordDetailView | wordId: string, navigate | App.tsx (view.wordId) |
| LibrariesView | navigate | App.tsx |
| LibraryWordsView | libraryId: string, navigate | App.tsx (view.libraryId) |
| ProfileView | user: AuthUser\|null, navigate, onLogout | App.tsx |
| AuthView | mode: 'login'\|'register', navigate, onAuth | App.tsx |
| AdminView | navigate, user: AuthUser\|null | App.tsx |
| BottomNav | currentTab: Tab, onTabChange | App.tsx (tabFromView) |
| PhysicalImage | type: string | WordDetailView, AdminView.WordEditForm |
| PageHeader (Admin 内嵌) | onBack, backLabel, right?, children? | Overview/LibraryManager/WordManager/UserManager |
| SLabel (Admin 内嵌) | children | Overview/LibraryManager/WordManager |
| PrimaryBtn (Admin 内嵌) | children, onClick, disabled?, loading?, ghost? | LibraryManager/WordEditForm |
| Overview | libraries[], words[], onNavigate, onExit | AdminView |
| LibraryManager | libraries[], words[], onAdd, onEdit, onDelete, onBack | AdminView |
| WordManager | words[], libraries[], onAdd, onEdit, onDelete, onBack | AdminView |
| WordEditForm | word, libraries[], isNew, onSave, onCancel | WordManager |
| UserManager | onBack | AdminView |

### 3.4 回调流向

| 回调 | 定义位置 | 触发位置 | 效果 |
|------|---------|---------|------|
| navigate | App.tsx useState setter | 所有视图组件 | 切换 view → 切换渲染 |
| onLogout | App.tsx handleLogout | ProfileView 退出按钮 | setUser(null) + navigate('home') |
| onAuth | App.tsx handleLogin | AuthView submit | setUser + navigate |
| onTabChange | App.tsx handleTabChange | BottomNav tabs | 根据 tab 名称 navigate |
| onBack (admin) | AdminView setSection('overview') | 各子视图返回按钮 | 回到 overview |
| onNavigate (admin) | AdminView setSection | Overview 入口卡片 | 切换 admin 子视图 |
| onAdd/onEdit/onDelete | AdminView setLibraries/setWords | LibraryManager/WordManager | CRUD 局部数据 |

---

## 文档四：设计令牌 (Design Tokens)

### 4.1 调色板

| 令牌 | 色值 | 使用场景 |
|------|------|---------|
| `color-primary` | `#2563EB` | 按钮 bg, 链接, active Tab, 搜索 focus border |
| `color-primary-dark` | `#1D4ED8` | 渐变起始色 |
| `color-primary-light` | `#3B82F6` | 渐变结束色 |
| `color-primary-disabled` | `#93C5FD` | loading/disabled 按钮 bg |
| `color-primary-bg` | `#EFF6FF` | 标签背景, 高亮区 |
| `color-primary-border` | `#BFDBFE` | ghost 按钮 border, AI 卡片 border |
| `color-bg-page` | `#F7F9FC` | 全局页面背景 |
| `color-bg-card` | `#FFFFFF` / `#fff` | 卡片背景 |
| `color-bg-input` | `#F1F5F9` | 输入框 blur 态背景 (INPUT-A) |
| `color-bg-input-focus` | `#FFFFFF` | 输入框 focus 态背景 (INPUT-A) |
| `color-bg-light` | `#F8FAFC` | 例句/演化背景区 |
| `color-bg-gray` | `#F3F4F6` | 设置图标 bg, 标签 bg |
| `color-text-primary` | `#111827` | 标题、正文、单词名 |
| `color-text-secondary` | `#374151` | 次要文字、搭配文字 |
| `color-text-tertiary` | `#6B7280` | 描述文字、例句翻译、label |
| `color-text-placeholder` | `#9CA3AF` | 占位符、弱化文字、section label |
| `color-border` | `#E5E7EB` | input blur border (INPUT-B) |
| `color-border-light` | `#D1D5DB` | ArrowRight 颜色、分割线 |
| `color-success` | `#16A34A` / `#059669` / `#10B981` | 成功状态、AI done 按钮 |
| `color-success-bg` | `#F0FDF4` | 成功/目标卡片背景 |
| `color-success-text` | `#065F46` | 例句文字 |
| `color-warning` | `#D97706` | SVG 颜色 |
| `color-warning-bg` | `#FFFBEB` | demo 提示背景 |
| `color-warning-text` | `#92400E` | demo 提示文字 |
| `color-warning-border` | `#FDE68A` | demo 提示边框 |
| `color-error` | `#DC2626` | 错误文字、删除按钮、退出按钮 |
| `color-error-bg` | `#FEF2F2` | 错误提示背景、退出按钮背景 |
| `color-admin` | `#7C3AED` | 管理后台图标/标签色 |
| `color-admin-bg` | `#FAF5FF` | 管理入口图标背景、用户标签背景 |
| `tab-active` | `#2563EB` | BottomNav active 色 |
| `tab-inactive` | `#9CA3AF` | BottomNav default 色 |

### 4.2 间距体系

| 令牌 | px 值 | 使用场景 |
|------|-------|---------|
| `page-px` | `24px` | 页面左右 padding（所有页面一致） |
| `page-pt-home` | `56px` | HomeView header padding-top |
| `page-pt-standard` | `52px` | 所有其他页面 header padding-top |
| `header-pb` | `16-24px` | header padding-bottom |
| `card-p-lg` | `24px` | 大卡片 padding（核心义、词库卡片） |
| `card-p-md` | `20px` | 中等卡片 padding（引申义、管理列表） |
| `card-p-sm` | `16-18px` | 小卡片/列表项 padding |
| `card-p-input` | `13-14px` | 输入框 padding（上下各 13-14px） |
| `gap-xs` | `3-6px` | Tab 内间距、图标-文字间距 |
| `gap-sm` | `8-10px` | 列表项内部 gap |
| `gap-md` | `12-14px` | 表单/卡片间 gap |
| `gap-lg` | `16px` | 统计卡片 grid gap |
| `section-gap` | `20-24px` | section 间 margin-bottom |

### 4.3 圆角体系

| 令牌 | px 值 | 使用场景 |
|------|-------|---------|
| `radius-xs` | `6px` | 词库标签 |
| `radius-sm` | `8px` | MenuRow 图标容器 |
| `radius-md` | `10-12px` | 设置图标容器、引申义演化背景、搭配标签 |
| `radius-lg` | `14px` | 输入框 (INPUT-B)、AI 按钮 |
| `radius-xl` | `16px` | 按钮、列表项、搜索框 (INPUT-A) |
| `radius-2xl` | `20px` | 引申义卡片、管理入口卡片、统计卡片 |
| `radius-3xl` | `24px` | 词库卡片、今日一词、核心义卡片、常见搭配 |
| `radius-full` | `9999px` / `50%` | POS 标签、用户角色标签、头像 |

### 4.4 字体排版

| 令牌 | 字号 | 字重 | 行高 | 使用场景 |
|------|------|------|------|---------|
| `hero` | `42px` | `800` | `1.1` | WordDetailView 单词大标题 |
| `hero-2` | `34px` | `800` | — | 今日一词卡片单词 |
| `stat` | `30px` | `800` | — | Overview 统计数字 |
| `h1` | `26px` | `700` | `1.3` | 页面标题 |
| `h2` | `22px` | `700` | — | 管理子页面标题、词库内标题 |
| `h3` | `17-18px` | `700` | — | 词库卡片标题、单词列表项单词名 |
| `body-lg` | `16px` | `500-600` | 1.5-1.6 | 正文、输入框文字、按钮文字 |
| `body` | `14-15px` | `400-500` | 1.5-1.6 | 描述文字、例句、菜单 label |
| `body-sm` | `13px` | `400-500` | — | 次要信息、表单 label、辅助文字 |
| `caption` | `12px` | `400-600` | — | 词库副信息、音标、演化编号 |
| `label` | `11px` | `600` | — | 区块标签（大写 uppercase） |
| `label-tiny` | `9-10px` | `400` | — | SVG 内部标签文字 |

### 4.5 阴影

| 令牌 | 值 | 使用场景 |
|------|----|---------|
| `shadow-card-sm` | `0 2px 12px rgba(0,0,0,0.04)` | 全部词汇列表项、统计卡片 |
| `shadow-card-md` | `0 2px 16px rgba(0,0,0,0.04)` | 词库卡片、引申义卡片、设置卡片 |
| `shadow-card-lg` | `0 2px 16px rgba(0,0,0,0.05)` | 搜索结果、管理入口、管理列表 |
| `shadow-card-xl` | `0 2px 20px rgba(0,0,0,0.05)` | 核心义卡片、常见搭配 |
| `shadow-image` | `0 4px 24px rgba(0,0,0,0.07)` | 物理意象图片容器 |
| `shadow-featured` | `0 8px 32px rgba(37,99,235,0.25)` | 今日一词卡片 |
| `shadow-admin` | `0 8px 32px rgba(37,99,235,0.22)` | Overview 统计 banner |
| `shadow-admin-purple` | `0 8px 32px rgba(124,58,237,0.25)` | 管理员用户卡片 |
| `shadow-tab-active` | `0 1px 4px rgba(0,0,0,0.08)` | Tab switcher active |
| `shadow-logo` | `0 4px 16px rgba(37,99,235,0.3)` | Auth/登录页 Logo 图标 |

### 4.6 渐变

| 令牌 | 值 | 使用场景 |
|------|----|---------|
| `gradient-primary` | `linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%)` | 今日一词卡片 |
| `gradient-admin-banner` | `linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #3B82F6 100%)` | Overview 统计 banner |
| `gradient-admin-user` | `linear-gradient(135deg, #4C1D95, #7C3AED)` | 管理员用户卡片 |
| `gradient-user` | `linear-gradient(135deg, #1D4ED8, #2563EB)` | 普通用户卡片 |
| `gradient-logo` | `linear-gradient(135deg, #1D4ED8, #3B82F6)` | Auth 页 Logo 图标 |
| `gradient-avatar-admin` | `linear-gradient(135deg, #7C3AED, #8B5CF6)` | 管理员头像 |
| `gradient-avatar-user` | `linear-gradient(135deg, #2563EB, #3B82F6)` | 普通用户头像 |
| `gradient-ai-card` | `linear-gradient(135deg, #EFF6FF, #DBEAFE)` | AI 生成卡片背景 |
| `gradient-evolution-arrow` | `linear-gradient(to right, #E5E7EB, #2563EB)` | 引申义演化箭头 |

### 4.7 词库卡片颜色（4 组）

| 索引 | 背景渐变 | accent 色 | border 色 |
|------|---------|----------|----------|
| 0 | `linear-gradient(135deg, #EFF6FF, #DBEAFE)` | `#2563EB` | `#BFDBFE` |
| 1 | `linear-gradient(135deg, #F0FDF4, #DCFCE7)` | `#16A34A` | `#BBF7D0` |
| 2 | `linear-gradient(135deg, #FFF7ED, #FED7AA)` | `#D97706` | `#FDE68A` |
| 3 | `linear-gradient(135deg, #FAF5FF, #EDE9FE)` | `#7C3AED` | `#DDD6FE` |

### 4.8 POS (词性) 标签颜色（6 组）

| 词性 | 背景色 | 文字色 |
|------|--------|--------|
| `n.` | `#EFF6FF` | `#1D4ED8` |
| `v.` | `#F0FDF4` | `#166534` |
| `adj.` | `#FFF7ED` | `#C2410C` |
| `adv.` | `#FAF5FF` | `#7E22CE` |
| `v./n.` | `#ECFDF5` | `#065F46` |
| `adj./adv.` | `#FFF1F2` | `#9F1239` |

### 4.9 特效

| 令牌 | 值 | 使用场景 |
|------|----|---------|
| `blur-header` | `backdrop-filter: blur(16px)` | 所有页面吸顶 header |
| `blur-bottom-nav` | `backdrop-filter: blur(20px)` + `-webkit-backdrop-filter: blur(20px)` | BottomNav |
| `header-bg-home` | `rgba(255, 255, 255, 0.9)` | Home/Libraries/LibraryWords/Profile header |
| `header-bg-word` | `rgba(247, 249, 252, 0.92)` | WordDetailView header |
| `header-bg-admin` | `rgba(247, 249, 252, 0.94)` | AdminView PageHeader（所有子视图） |
| `header-bg-profile` | `rgba(255, 255, 255, 0.9)` | ProfileView (logged-in) header |
| `bottom-nav-bg` | `rgba(255, 255, 255, 0.88)` | BottomNav 背景 |
| `bottom-nav-border` | `1px solid rgba(0, 0, 0, 0.06)` | BottomNav 顶部分割线 |
| `transition-default` | `0.2s` | 输入框 border-color/background 过渡 |
| `transition-button` | `0.2s` / `0.25s` | 按钮/标签切换 |
| `spin-animation` | `@keyframes spin` (1s linear infinite) | Loader 图标 |

### 4.10 输入框样式模式

| 模式 | blur border | blur bg | focus border | focus bg | 出现位置 | 出现次数 |
|------|-----------|---------|-------------|---------|---------|---------|
| **INPUT-A** | `transparent` | `#F1F5F9` | `#2563EB` | `#FFFFFF` | HomeView 搜索框, AdminView 全部 input/textarea/select | 8+ |
| **INPUT-B** | `#E5E7EB` | `#FFFFFF` | `#2563EB` | `#FFFFFF` (不变) | AuthView 用户名/手机号/密码 | 3 |

- INPUT-A padding: `13-14px` 上下, `14-16px` 左右
- INPUT-B padding: `14px 16px`
- 共用: `font-size: 15-16px`, `border-radius: 14-16px`, `outline: none`, `box-sizing: border-box`

---

## 文档五：图标资产清单 (Icon Asset Inventory)

### 5.1 逐文件使用统计

| 源文件 | 使用的图标 (lucide-react) | 数量 |
|--------|--------------------------|------|
| HomeView.tsx | Search, ArrowRight, Sparkles | 3 |
| WordDetailView.tsx | ArrowLeft, ChevronRight (EvolutionArrow 内) | 2 |
| LibrariesView.tsx | BookOpen, ArrowRight | 2 |
| ProfileView.tsx | User, Settings, Shield, LogOut, ChevronRight, BookOpen, Target | 7 |
| AuthView.tsx | ArrowLeft, Eye, EyeOff | 3 |
| AdminView.tsx | BookOpen, Type, Users, Plus, Trash2, ArrowLeft, RefreshCw, Loader, ChevronRight, Check, X, ArrowRight, Search | 13 |
| BottomNav.tsx | Search, BookOpen, User | 3 |
| **总计** | **18 种图标** | — |

### 5.2 图标属性规格

| 图标 | 尺寸 | 颜色 | 使用位置 | 语义角色 |
|------|------|------|---------|---------|
| Search | 16-18px | #9CA3AF | HomeView 搜索框(18), AdminWordManager 搜索框(16), BottomNav(20) | 搜索前缀 / Tab 图标 |
| ArrowRight | 14-16px | #D1D5DB / accent色 / opacity 0.8 | HomeView 列表项(16/15), 今日一词(14), LibrariesView(16) | 导航暗示 |
| ArrowLeft | 18px | #6B7280 | WordDetail 返回(18), Auth 返回(18), Admin 返回(18) | 返回导航 |
| Sparkles | 14px | #2563EB | 今日一词标签装饰 | 装饰强调 |
| BookOpen | 18-20px | accent色 / opacity 0.4 | LibrariesView 词库卡片(18), LibraryWords 空状态(32), Profile 统计(18), BottomNav(20), Admin 入口(20), LibraryManager 空状态(32) | 词库标识 |
| User | 20-36px | #CBD5E1 / #fff | Profile 未登录头像(36), 已登录头像(24), BottomNav(20), Admin 入口(20) | 用户标识 |
| Eye | 18px | #9CA3AF | Auth 密码可见性切换 | 密码可见 |
| EyeOff | 18px | #9CA3AF | Auth 密码可见性切换 | 密码隐藏 |
| Settings | 16px | #6B7280 | Profile 设置菜单 | 设置入口 |
| Shield | 20px | #7C3AED | Profile 管理后台入口 | 管理员标识 |
| LogOut | 16px | #DC2626 | Profile 退出按钮 | 退出操作 |
| ChevronRight | 14-18px | #D1D5DB / #2563EB | WordDetail EvolutionArrow(14#2563EB), Profile MenuRow(16#D1D5DB), Profile 管理入口(18#D1D5DB) | 展开/导航箭头 |
| Target | 18px | #16A34A | Profile 今日目标统计 | 统计/进度 |
| Plus | 14-16px | #fff / #6B7280 | Admin 新增按钮(14#fff), 添加引申义(16#6B7280) | 新增操作 |
| Trash2 | — | #DC2626 | Admin 删除按钮 | 删除操作 |
| RefreshCw | 13px | #374151 | Admin 重新生成图片按钮 | 刷新操作 |
| Loader | 15px | #fff / #2563EB | Admin AI 按钮 loading 态, 保存按钮 loading 态 | 加载状态 (CSS spin) |
| Check | 15px | #fff (#059669 bg) | Admin AI 完成按钮 | 完成标记 |
| X | 14-15px | #DC2626 / #9CA3AF | Admin 引申义删除(14#DC2626), 搜索清除(15#9CA3AF) | 清除/删除 |
| Type | 20px | #16A34A | Admin 单词管理入口 | 文字/类型标识 |
| Users | 20px | #7C3AED | Admin 用户管理入口 | 用户组标识 |

### 5.3 图标特殊行为

| 图标 | 特殊行为 |
|------|---------|
| Eye/EyeOff | 点击切换 showPassword 状态 |
| Loader | CSS `@keyframes spin` (`transform: rotate(0deg)→rotate(360deg)`) 无限旋转 |
| RefreshCw | loading 时同样使用 spin 动画 |
| ArrowRight (LibraryWordsView) | `transform: rotate(180deg)` 变成左箭头用作返回 |
| Search | 输入框内绝对定位：left 16px / 14px, top 50% + translateY(-50%) |
| ArrowRight (BottomNav 内的 Search) | 间接：BottomNav 使用 Search 图标作为 Tab "搜索" |

---

## 文档六：平台默认样式审计 (Platform Default Style Audit)

> **适用**：源平台 = Web (React)，目标平台 = uni-app (H5 + 微信小程序)

### 6.1 逐元素审计

| 源文件 | 元素/CSS 类 | 属性 | 源平台行为 | 目标平台行为 | 差异风险 | 处理方式 |
|--------|-----------|------|----------|------------|---------|---------|
| HomeView.tsx | `<input>` 搜索框 | outline | `outline: none` — ✅ 已显式声明 | 小程序无 outline | ✅ 无风险 |
| HomeView.tsx | `<input>` 搜索框 | line-height | 未声明 → 依赖浏览器默认 (~1.2) | 小程序 ~1.5 | 🔴 高 | 目标显式设置 |
| HomeView.tsx | `<input>` 搜索框 | box-sizing | `box-sizing: border-box` — ✅ 已声明 | — | ✅ 无风险 |
| HomeView.tsx | `<input>` 搜索框 | transition | `transition: border-color 0.2s, background 0.2s` | 小程序原生 input 不支持 | 🔴 高 | `/* #ifdef H5 */` 包裹 |
| HomeView.tsx | `<input>` 搜索框 | onFocus/onBlur | `e.target.style.xxx = '...'` DOM 操作 | 小程序不可用 | 🔴 高 | 改为 `:class` 绑定 + composable |
| AuthView.tsx | `<input>` ×3 | 同上 | 同上 | 同上 | 同上 | 同上 |
| AuthView.tsx | `<input>` 密码框 | box-sizing | `box-sizing: border-box` — ✅ | — | ✅ |
| AuthView.tsx | `<input>` 密码框 | transition | `transition: border-color 0.2s` | 小程序不支持 | 🔴 | `/* #ifdef H5 */` 包裹 |
| AdminView.tsx | `<input>` / `<textarea>` / `<select>` ×9+ | onFocus/onBlur | DOM 操作 + transition | 小程序不支持 | 🔴 | 改为 class 绑定 + 条件编译 transition |
| AdminView.tsx | `<textarea>` | resize | `resize: vertical` | 小程序不支持 | 🔴 | 移除 resize，用 `auto-height` |
| AdminView.tsx | `<select>` ×3 | 原生 HTML select | `<select>` 原生下拉 | 小程序不支持 | 🔴 | 改用 `<picker>` |
| App.tsx (全局) | 所有文本 | line-height | 各组件各有声明（部分未声明） | 小程序 ~1.5 | 🔴 | 全局显式设置 |
| App.tsx (全局) | 根容器 | box-sizing | 未全局声明 | 小程序可能为 border-box | 🟡 | 全局声明 |
| PhysicalImage.tsx | SVG 容器 | overflow | `overflow: hidden` | 裁剪原生渲染层 | 🔴 NC-05 | `/* #ifdef H5 */` 包裹 |
| PhysicalImage.tsx | 内联 SVG | — | 浏览器直接渲染 SVG | 小程序不支持内联 SVG | 🔴 | H5 条件编译保留 SVG，小程序用 image/PNG |
| BottomNav.tsx | 容器 | position | `position: fixed` | 小程序不支持 fixed 叠加原生 tabBar | 🔴 | 改用 `pages.json` 原生 tabBar |
| BottomNav.tsx | 容器 | backdropFilter | `blur(20px)` + `-webkit-` | 小程序不支持 | 🔴 | 原生 tabBar 自带半透明 |
| HomeView.tsx | header | backdropFilter | `blur(16px)` | 小程序不支持 | 🔴 | `/* #ifdef H5 */` 保留 |
| WordDetailView.tsx | header | backdropFilter | `blur(16px)` + `position: sticky` | 小程序不支持 sticky + backdrop-filter | 🔴 | 条件编译 |
| LibrariesView.tsx | header | backdropFilter | `blur(16px)` | 小程序不支持 | 🔴 | 条件编译 |
| ProfileView.tsx (logged-in) | header | backdropFilter | `blur(16px)` | 小程序不支持 | 🔴 | 条件编译 |
| AdminView.tsx | PageHeader | backdropFilter | `blur(16px)` + `position: sticky` | 同上 | 🔴 | 条件编译 |
| App.tsx (全局) | 根容器 | minHeight | `minHeight: '100vh'` | 小程序用 rpx/vh 不同 | 🟡 | 改用 `100vh` / `min-height: 100vh` |

### 6.2 汇总

| 风险等级 | 数量 | 说明 |
|---------|------|------|
| 🔴 高 | 14 | backdrop-filter ×5, DOM 操作 ×1, transition ×2, 内联 SVG ×1, select ×1, sticky ×1, position fixed ×1, line-height ×1, overflow ×1 |
| 🟡 中 | 3 | box-sizing, minHeight, resize |
| ✅ 已处理 | 2 | outline (已声明), box-sizing on inputs (已声明) |

---

## 验证清单

- [x] 每个源文件都在骨架地图中有记录 — 13/13
- [x] 每个可交互元素在交互清单中都有记录 — 72+ 条
- [x] 每个条件渲染分支都有文档记录 — 30+ 条
- [x] 每个 type/interface 都在数据流图中有记录 — 6 interface + ViewState + AdminTab
- [x] 所有颜色/间距/圆角/字体/特效都在设计令牌中有记录
- [x] 图标资产清单已生成 — 18 种图标，逐文件统计 + 属性规格
- [x] 平台默认样式审计已完成 — 19 项风险点

---

> **下一步**：将本报告提交给用户确认。确认后进入 Phase 2（迁移映射）。
