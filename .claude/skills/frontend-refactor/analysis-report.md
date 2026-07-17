# Phase 1 分析报告：英语母语者词典APP（figma-prototype）

> **重新分析日期**：2026-07-15
> **目标技术栈变更**：Vue 3 + uni-app + **uni-ui**（替代原 iconfont 方案）

---

## 文档 1：骨架图谱

### 技术栈摘要

| 层级 | 源技术 | 目标技术 |
|------|--------|---------|
| 框架 | React 18 + TypeScript | Vue 3 (Composition API `<script setup>`) + uni-app |
| 样式 | Tailwind CSS 4.1 + 内联 style 对象（**以内联为主**） | SCSS (scoped) + uni.scss 全局变量 |
| 路由 | 手动 `useState<ViewState>`，共 9 个视图 | `pages.json` 声明式路由 + uni API |
| 状态管理 | 无全局 store；`user` + `view` 提升至 App.tsx | provide/inject + ref/reactive |
| UI 组件库 | shadcn/ui (Radix UI) + MUI Icons + lucide-react | **uni-ui** (uni-icons, uni-nav-bar, uni-search-bar, uni-card, uni-section, uni-easyinput, uni-data-select, uni-forms) |
| 构建工具 | Vite 6.3 | Vite + @dcloudio/vite-plugin-uni |
| 包管理器 | pnpm | npm |
| 数据来源 | 100% 静态 mock 数组（无 API 调用） | 直接移植 mock 数据 |
| 目标平台 | — | uni-app 跨平台：**H5 + 微信小程序** |

### 目录树（带文件职责标注）

```
figma-prototype/
├── index.html                         → HTML 入口，viewport 设置
├── package.json                       → React 18.3 依赖定义
├── vite.config.ts                     → Vite：React + Tailwind 插件
├── postcss.config.mjs                 → PostCSS（目标项目中不需要）
├── pnpm-workspace.yaml                → pnpm workspace（目标项目中不需要）
└── src/
    ├── main.tsx                        → ReactDOM.createRoot，渲染 <App />
    ├── styles/ (5 个 CSS)
    │   ├── index.css / fonts.css / tailwind.css / theme.css / globals.css
    └── app/
        ├── App.tsx                     → 根组件：状态管理 + 视图路由 + BottomNav 条件渲染
        ├── data/
        │   ├── types.ts                → 6 个接口 + ViewState 可辨识联合（9 种视图）
        │   └── mockData.ts             → 4 个词库、8 个单词、5 个用户、AI 模板
        └── components/
            ├── BottomNav.tsx            → 3 标签页底部导航 → **目标：pages.json tabBar**
            ├── HomeView.tsx             → 搜索页 + 今日一词 + 单词列表
            ├── WordDetailView.tsx       → 单词详情：物理意象图 + 核心义 + 引申义 + 搭配
            ├── LibrariesView.tsx        → 词库列表 + LibraryWordsView（内嵌子视图）
            ├── ProfileView.tsx          → 未登录引导 / 已登录面板（含管理入口）
            ├── AuthView.tsx             → 登录/注册：标签切换 + 表单验证 + 演示账号提示
            ├── AdminView.tsx            → 管理后台：概览 + 词库CRUD + 单词CRUD + 用户列表
            ├── PhysicalImage.tsx        → 8 个内联 SVG 物理意象插画 + 1 个通用占位图
            └── ui/ (30+ 文件)           → shadcn/ui 标准组件库 → **目标按需手写或用 uni-ui 替代**
```

### 依赖关系图

```
main.tsx
  └── App.tsx
        ├── types.ts
        ├── BottomNav.tsx        → lucide-react (Search, BookOpen, User)
        ├── HomeView.tsx         → types, mockData, lucide-react (Search, ArrowRight, Sparkles)
        ├── WordDetailView.tsx   → types, mockData, PhysicalImage, lucide-react (ArrowLeft, ChevronRight)
        ├── LibrariesView.tsx    → types, mockData, lucide-react (BookOpen, ArrowRight)
        ├── ProfileView.tsx      → types, lucide-react (User, Settings, Shield, LogOut, ChevronRight, BookOpen, Target)
        ├── AuthView.tsx         → types, mockData, lucide-react (ArrowLeft, Eye, EyeOff)
        └── AdminView.tsx        → types, mockData, PhysicalImage,
                                    lucide-react (BookOpen, Type, Users, Plus, Trash2, ArrowLeft,
                                    RefreshCw, Loader, ChevronRight, Check, X, ArrowRight, Search)
```

### 源文件统计

- 业务组件：8 个文件
- 数据层：2 个文件 (types.ts, mockData.ts)
- 入口/样式：6 个文件 (main.tsx, App.tsx, 4 个 CSS)
- 工具组件：1 个文件 (ImageWithFallback.tsx — 未使用)
- shadcn/ui：30+ 文件（标准库，不逐个迁移）
- **总计：17 个分析源文件（不含 shadcn/ui）**

---

## 文档 2：交互清单

### 视图路由系统（App.tsx）

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| R1 | view state | setView(newView) | 切换渲染对应视图组件 | — | view.name 决定渲染 |
| R2 | Admin 视图 | view.name === 'admin' | 占据全屏，隐藏 BottomNav | admin | view.name === 'admin' |
| R3 | 底部导航 | onTabChange | navigate 到对应首页视图 | — | view.name !== 'admin' |
| R4 | 登录成功 | handleLogin | 设置 user + 管理员→admin，普通用户→profile | — | user.role === 'admin' |
| R5 | 退出登录 | handleLogout | user=null + navigate('home') | — | 始终 |

### 页面：HomeView

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| H1 | 搜索输入框 | @input (onChange) | setQuery → 实时筛选 | 输入中 | 始终 |
| H2 | 搜索输入框 | @focus | 边框色→#2563EB，背景→#fff | 聚焦 | 始终 |
| H3 | 搜索输入框 | @blur | 边框色→transparent，背景→#F1F5F9 | 失焦 | 始终 |
| H4 | 搜索结果为空 | — | 显示"未找到相关单词"+ 提示文字 | 空数据 | query.trim() && results.length===0 |
| H5 | 搜索结果列表 | — | 显示匹配的单词卡片 | 有结果 | query.trim() && results.length>0 |
| H6 | 搜索结果卡片 | @click | navigate(wordDetail, wordId) | hover | 搜索结果中 |
| H7 | 今日一词区域 | — | 显示渐变卡片 + todayWord 信息 | — | !query.trim() |
| H8 | 今日一词卡片 | @click | navigate(wordDetail, todayWord.id) | hover | !query.trim() |
| H9 | "查看完整解析"链接 | @click | 同 H8（卡片整体可点击） | — | 今日一词卡片内 |
| H10 | 全部词汇列表 | — | 显示所有 mockWords（8 个） | — | !query.trim() |
| H11 | 全部词汇列表项 | @click | navigate(wordDetail, wordId) | hover | !query.trim() |
| H12 | 词库标签徽章 | — | 显示词库名（蓝色标签） | — | word.libraryId 存在对应 lib |
| H13 | todayWord 计算 | 计算 | Math.floor(Date.now()/86400000) % mockWords.length | — | 每次渲染 |

### 页面：WordDetailView

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| W1 | 返回按钮 | @click | navigate('home') | — | 始终 |
| W2 | 词库标签 | — | 显示所属词库名（蓝色圆角标签） | — | library 存在 |
| W3 | 单词不存在 | — | 显示"单词不存在"+ 返回首页按钮 | 错误 | !word |
| W4 | 返回首页按钮（错误状态） | @click | navigate('home') | — | !word |
| W5 | 物理意象图 | — | PhysicalImage 组件渲染 SVG | — | 始终 |
| W6 | 核心义卡片 | — | 蓝色左边框例句卡片 | — | 始终 |
| W7 | 引申义列表 | — | 遍历 extendedMeanings 渲染 | — | 始终 |
| W8 | 词性标签 | — | POS_COLORS 对应颜色 | — | 根据 partOfSpeech |
| W9 | 常见搭配列表 | — | 遍历 collocations 渲染标签 | — | 始终 |
| W10 | Sticky header | — | 吸顶导航栏（backdrop-filter blur） | — | 始终 |

### 页面：LibrariesView

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| L1 | 词库卡片 | @click | navigate('libraryWords', libraryId) | hover | 始终 |
| L2 | 已收录单词数 | — | 显示 wordsInLib.length | — | wordsInLib.length > 0 |

### 页面：LibraryWordsView（内嵌于 LibrariesView.tsx）

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| LW1 | 返回按钮 | @click | navigate('libraries') | — | 始终 |
| LW2 | 词库为空 | — | BookOpen 图标 + "该词库暂无单词" | 空数据 | words.length === 0 |
| LW3 | 单词列表项 | @click | navigate('wordDetail', wordId) | hover | words.length > 0 |

### 页面：ProfileView（未登录）

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| P1 | 未登录头像占位 | — | 灰色圆形 + User 图标 | — | !user |
| P2 | 未登录引导文案 | — | "登录后开始学习" + 说明 | — | !user |
| P3 | 登录按钮 | @click | navigate('login') | — | !user |
| P4 | 注册按钮 | @click | navigate('register') | — | !user |

### 页面：ProfileView（已登录）

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| P5 | 用户信息卡片 | — | 渐变背景 + 头像 + 用户名 + 手机号 + 角色 | — | user 存在 |
| P6 | 管理员卡片样式 | — | 紫色渐变 #4C1D95→#7C3AED | — | user.role === 'admin' |
| P7 | 普通用户卡片样式 | — | 蓝色渐变 #1D4ED8→#2563EB | — | user.role !== 'admin' |
| P8 | 管理后台入口 | @click | navigate('admin', tab:'overview') | — | user.role === 'admin' |
| P9 | 普通用户统计 | — | "已学单词 156 个" + "今日目标 3/5 个" | — | user.role !== 'admin' |
| P10 | 设置菜单项 | @click | 无实际操作（仅展示） | — | user 存在 |
| P11 | 退出登录 | @click | onLogout() | — | user 存在 |

### 页面：AuthView

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| A1 | 登录标签按钮 | @click | setTab('login') + 清错误 | active/inactive | 始终 |
| A2 | 注册标签按钮 | @click | setTab('register') + 清错误 | active/inactive | 始终 |
| A3 | 用户名输入框 | @input | setUsername | — | tab === 'register' |
| A4 | 用户名输入框 | @focus | borderColor→#2563EB | 聚焦 | tab === 'register' |
| A5 | 用户名输入框 | @blur | borderColor→#E5E7EB | 失焦 | tab === 'register' |
| A6 | 手机号输入框 | @input | setPhone（tel，maxLength=11） | — | 始终 |
| A7 | 手机号输入框 | @focus | borderColor→#2563EB | 聚焦 | 始终 |
| A8 | 手机号输入框 | @blur | borderColor→#E5E7EB | 失焦 | 始终 |
| A9 | 密码输入框 | @input | setPassword | — | 始终 |
| A10 | 密码输入框 | @focus | borderColor→#2563EB | 聚焦 | 始终 |
| A11 | 密码输入框 | @blur | borderColor→#E5E7EB | 失焦 | 始终 |
| A12 | 密码输入框 | @confirm | key==='Enter' → handleSubmit | — | 始终 |
| A13 | 密码可见性切换 | @click | toggle showPassword | 显示/隐藏 | 始终 |
| A14 | 密码可见性图标 | — | showPassword ? EyeOff : Eye | — | 始终 |
| A15 | 提交按钮 | @click | handleSubmit() | 普通 | !loading |
| A16 | 提交按钮加载态 | — | "处理中..."，disabled，背景变淡 | loading | loading===true |
| A17 | 错误消息卡片 | — | 红色错误提示 #DC2626 + #FEF2F2 | 可见 | error !== '' |
| A18 | 表单验证 | handleSubmit | 校验手机号/必填/用户名 | 错误 | 验证失败 |
| A19 | 登录模拟 | setTimeout 800ms | mockUsers.find → 密码 '123456' | — | tab==='login' |
| A20 | 注册模拟 | setTimeout 800ms | 直接创建新用户 (role='user') | — | tab==='register' |
| A21 | 演示账号提示 | — | 管理员/普通用户账号密码 | — | tab==='login' |
| A22 | 返回按钮 | @click | navigate('home') | — | 始终 |
| A23 | Logo 区域 | — | 蓝色渐变方块 + "E" | — | 始终 |
| A24 | 欢迎文案 | — | "欢迎回来" vs "创建账号" | — | tab 切换 |
| A25 | 占位符文字 | — | login: "输入密码（演示：123456）" / register: "至少6位密码" | — | tab 切换 |

### 页面：AdminView

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| AD1 | Section 导航 | setSection | overview/libraries/words/users 切换 | — | section state |
| AD2 | 退出管理 | @click | navigate('profile') | — | 始终 |
| AD3 | 功能入口卡片 | @click | setSection(sectionId) | hover | section==='overview' |
| AD4 | 统计横幅 | — | 词库/单词/用户 数量 | — | section==='overview' |
| AD5 | 新增词库按钮 | @click | 切换到新增词库编辑表单 | — | section==='libraries' |
| AD6 | 编辑词库按钮 | @click | 切换到编辑词库表单 | — | section==='libraries' |
| AD7 | 删除词库按钮 | @click | window.confirm → deleteLib | — | section==='libraries' |
| AD8 | 词库表单输入框 | @focus/@blur | 边框色切换 | 聚焦/失焦 | 编辑模式 |
| AD9 | 新增单词按钮 | @click | setEditWord({ id: genId() }) | — | section==='words' |
| AD10 | 编辑单词按钮 | @click | setEditWord(word) | — | section==='words' |
| AD11 | 删除单词按钮 | @click | window.confirm → deleteWord | — | section==='words' |
| AD12 | 单词搜索框 | @input | setQuery → 实时筛选 | 输入中 | section==='words' |
| AD13 | 单词搜索框 | @focus/@blur | 边框色切换 | 聚焦/失焦 | section==='words' |
| AD14 | 清除搜索 | @click | setQuery('') | — | query !== '' |
| AD15 | AI 生成按钮 | @click | handleAI → setTimeout 1.8s → 填充 | loading/done/默认 | section==='words' 编辑模式 |
| AD16 | AI 生成加载态 | — | Loader 旋转 + "正在生成..." | loading | aiLoading |
| AD17 | AI 生成完成态 | — | 绿色背景 + Check 图标 + "已生成" | done | aiDone |
| AD18 | 重新生成图片 | @click | 循环切换 IMAGE_TYPES | loading | 编辑单词模式 |
| AD19 | 添加引申义 | @click | addExt → push 空 ExtendedMeaning | — | !isNew |
| AD20 | 删除引申义 | @click | removeExt(i) → splice | — | !isNew |
| AD21 | 词库下拉选择 | @change | set('libraryId', value) | — | 编辑单词模式 |
| AD22 | 保存单词 | @click | handleSave → onAdd/onEdit | disabled | !form.word \|\| !form.libraryId |
| AD23 | 取消按钮 | @click | onCancel | — | !isNew |
| AD24 | 用户列表 | — | 显示 mockUsers 信息 | — | section==='users' |

### 页面：BottomNav → pages.json tabBar

| ID | 元素 | 触发器 | 行为 | 状态 | 条件 |
|----|------|--------|------|------|------|
| B1 | 搜索标签 | @click | onTabChange('home') → switchTab | active/inactive | 始终 |
| B2 | 词库标签 | @click | onTabChange('libraries') → switchTab | active/inactive | 始终 |
| B3 | 我的标签 | @click | onTabChange('profile') → switchTab | active/inactive | 始终 |
| B4 | 标签激活态 | — | 蓝色文字 + 粗体 | active | currentTab===id |
| B5 | 标签非激活态 | — | 灰色文字 + 正常字重 | inactive | currentTab!==id |

---

## 文档 3：数据流图

### 状态所有权树

```
App.tsx / App.vue (顶层)
├── view: ViewState              → pages.json 路由替代
├── user: AuthUser | null        → provide('user', user)
│
├── HomeView (局部)
│   └── query: string            → 搜索输入
│
├── WordDetailView (纯渲染 — URL 参数 wordId)
│   └── (无局部状态)
│
├── LibrariesView (纯渲染)
│   └── (无局部状态)
│
├── LibraryWordsView (纯渲染 — URL 参数 libraryId)
│   └── (无局部状态)
│
├── ProfileView (纯渲染 — inject user)
│   └── (无局部状态)
│
├── AuthView (局部)
│   ├── tab: 'login' | 'register'
│   ├── phone/password/username
│   ├── showPassword/error/loading
│
├── BottomNav → pages.json tabBar 替代
│
└── AdminView (局部 — 独立数据副本)
    ├── section: AdminSection
    ├── libraries: WordLibrary[]
    └── words: Word[]
        └── WordEditForm
            ├── form: Partial<Word>
            └── aiLoading/aiDone/imgLoading/colInput
```

### 数据源

| 数据 | 来源 | 消费者 |
|------|------|--------|
| mockWords[] (8个) | mockData.ts 静态数组 | HomeView, WordDetailView, LibrariesView, AdminView |
| mockLibraries[] (4个) | mockData.ts 静态数组 | LibrariesView, AdminView |
| mockUsers[] (5个) | mockData.ts 静态数组 | AuthView（登录验证）, AdminView |
| AI_GENERATED_TEMPLATES | mockData.ts 静态对象 | AdminView.generateAIContent() |

### 目标路由设计

| 页面路径 | 页面名称 | 类型 | 参数 |
|---------|---------|------|------|
| `pages/home/index` | 首页 | tabBar | — |
| `pages/libraries/index` | 词库列表 | tabBar | — |
| `pages/profile/index` | 个人中心 | tabBar | — |
| `pages/word-detail/index` | 单词详情 | 普通 | wordId |
| `pages/library-words/index` | 词库内单词 | 普通 | libraryId |
| `pages/auth/index` | 登录/注册 | 普通 | mode |
| `pages/admin/index` | 管理后台 | 普通 | tab |

### 导航映射

| 源 navigate({ name: 'home' }) | `uni.switchTab({ url: '/pages/home/index' })` |
| 源 navigate({ name: 'wordDetail', wordId }) | `uni.navigateTo({ url: '/pages/word-detail/index?wordId=' + id })` |
| 源 navigate({ name: 'libraries' }) | `uni.switchTab({ url: '/pages/libraries/index' })` |
| 源 navigate({ name: 'libraryWords', libraryId }) | `uni.navigateTo({ url: '/pages/library-words/index?libraryId=' + id })` |
| 源 navigate({ name: 'profile' }) | `uni.switchTab({ url: '/pages/profile/index' })` |
| 源 navigate({ name: 'login' }), mode='login' | `uni.navigateTo({ url: '/pages/auth/index?mode=login' })` |
| 源 navigate({ name: 'register' }), mode='register' | `uni.navigateTo({ url: '/pages/auth/index?mode=register' })` |
| 源 navigate({ name: 'admin', tab }) | `uni.navigateTo({ url: '/pages/admin/index?tab=' + tab })` |
| BottomNav onTabChange | pages.json tabBar + `uni.switchTab` |
| 登录后跳转 | `uni.switchTab` 或 `uni.redirectTo` |

---

## 文档 4：设计 Token

### 调色板

| 令牌 | 色值 | 用途 |
|------|------|------|
| primary | #2563EB | 按钮、链接、激活标签、强调色 |
| primary-dark | #1D4ED8 | 渐变起始色 |
| primary-light | #3B82F6 | 渐变结束色 |
| primary-bg | #EFF6FF | 标签背景、高亮区域 |
| primary-border | #BFDBFE | 聚焦边框、卡片边框 |
| primary-disabled | #93C5FD | 按钮 disabled 态 |
| bg-page | #F7F9FC | 全局页面背景 |
| bg-card | #FFFFFF | 卡片背景 |
| bg-input | #F1F5F9 | 输入框默认背景 |
| bg-example | #F8FAFC | 例句区域背景 |
| text-primary | #111827 | 标题、正文主色 |
| text-secondary | #374151 | 次要文字 |
| text-description | #6B7280 | 描述文字、返回按钮 |
| text-tertiary | #9CA3AF | 标签、占位符、辅助文字 |
| text-muted | #D1D5DB | 箭头图标、分隔线 |
| error | #DC2626 | 错误文字、删除按钮 |
| error-bg | #FEF2F2 | 错误/删除按钮背景 |
| success | #16A34A / #10B981 / #059669 | 成功指示器、绿色强调 |
| success-bg | #F0FDF4 | 成功背景 |
| warning | #D97706 | 警告色 |
| warning-bg | #FFFBEB | 演示提示背景 |
| warning-border | #FDE68A | 演示提示边框 |
| purple | #7C3AED | 管理员紫色 |
| purple-dark | #4C1D95 | 管理员渐变起始 |
| purple-bg | #FAF5FF | 管理员标签背景 |

### 间距体系（源 px → 目标 rpx，1px=2rpx）

| 令牌 | px | rpx | 用途 |
|------|----|-----|------|
| page-pt | 52-56px | 104-112rpx | 页面顶部安全区 padding |
| page-px | 24px | 48rpx | 页面水平内边距 |
| page-pb | 40-80px | 80-160rpx | 页面底部内边距 |
| card-p-sm | 16px | 32rpx | 小卡片内边距 |
| card-p | 20px | 40rpx | 标准卡片内边距 |
| card-p-lg | 24px | 48rpx | 大卡片内边距 |
| gap-xs | 3-4px | 6-8rpx | 极小间距 |
| gap-sm | 6-8px | 12-16rpx | 小元素间距 |
| gap-md | 10-12px | 20-24rpx | 中等间距 |
| gap-lg | 14-16px | 28-32rpx | 较大间距 |
| gap-xl | 20-24px | 40-48rpx | 区块间距 |
| input-px | 14-16px | 28-32rpx | 输入框水平内边距 |
| input-py | 13-14px | 26-28rpx | 输入框垂直内边距 |
| bottom-nav-h | 60px | 120rpx | 底部导航高度 |

### 圆角体系

| 令牌 | px | rpx | 用途 |
|------|----|-----|------|
| radius-xs | 6px | 12rpx | 超小标签 |
| radius-sm | 8-10px | 16-20rpx | 小元素、图标容器 |
| radius-md | 12-14px | 24-28rpx | 输入框、小卡片 |
| radius-lg | 16px | 32rpx | 按钮、卡片项 |
| radius-xl | 20px | 40rpx | 中等卡片 |
| radius-2xl | 24px | 48rpx | 大卡片、主视觉区域 |
| radius-full | 20px/9999px | 40rpx/9999rpx | 标签、切屑、按钮 |

### 字体排版

| 令牌 | 字号/字重/行高 | 用途 |
|------|--------------|------|
| hero | 42px/800/1.1 | 单词详情页大标题 |
| h1 | 26px/700 | 页面标题 |
| h2 | 22px/700 | 子页面标题 |
| h3 | 17-18px/600-700 | 卡片标题、单词名称 |
| today-word | 34px/800 | "今日一词"单词 |
| body-lg | 16px/500-600 | 正文、输入框 |
| body | 14-15px/400-500 | 描述文字 |
| caption | 12-13px | 次要信息 |
| label | 11px/600 | 区块标签（大写+letterSpacing: 2px/4rpx） |
| stat-number | 30px/800 | 管理后台统计数字 |
| font-family | Inter, system-ui, -apple-system, sans-serif | 全局字体 |

### 阴影

| 令牌 | 值 | 用途 |
|------|----|------|
| card-subtle | 0 2px 12px rgba(0,0,0,0.04) | 单词列表项 |
| card-default | 0 2px 16px rgba(0,0,0,0.05) | 标准卡片 |
| card-elevated | 0 2px 20px rgba(0,0,0,0.05) | 核心义/搭配卡片 |
| featured | 0 8px 32px rgba(37,99,235,0.25) | 今日一词卡片 |
| featured-admin | 0 8px 32px rgba(124,58,237,0.25) | 管理员卡片 |
| image-card | 0 4px 24px rgba(0,0,0,0.07) | 物理意象图 |
| tab-active | 0 1px 4px rgba(0,0,0,0.08) | 标签切换激活态 |
| logo | 0 4px 16px rgba(37,99,235,0.3) | Logo 发光 |

### 渐变

| 令牌 | 值 | 用途 |
|------|----|------|
| primary-gradient | linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%) | 今日一词、统计横幅 |
| admin-gradient | linear-gradient(135deg, #4C1D95, #7C3AED) | 管理员用户卡片 |
| logo-gradient | linear-gradient(135deg, #1D4ED8, #3B82F6) | Logo 方块 |
| ai-card-gradient | linear-gradient(135deg, #EFF6FF, #DBEAFE) | AI 生成卡片 |
| lib-card-1~4 | 见源码 | 词库卡片渐变（蓝/绿/橙/紫） |

### 特效

| 令牌 | 值 | 用途 | 审计 Grep | 必须覆盖的文件 |
|------|----|------|----------|--------------|
| blur-header | backdrop-filter: blur(16px) | 所有吸顶 header | `backdrop-filter.*blur` | WordDetailView, LibrariesView, LibraryWordsView, ProfileView(已登录), AdminView |
| blur-bottom-nav | backdrop-filter: blur(20px) | 底部导航（tabBar 替代） | N/A (原生 tabBar) | — |
| header-bg-white | rgba(255,255,255,0.9) | 非详情页 header 背景 | `rgba\(255,.*255,.*255,.*0\.9\)` | HomeView, LibrariesView, LibraryWordsView, ProfileView(已登录) |
| header-bg-gray | rgba(247,249,252,0.92) | 详情页/管理后台 header | `rgba\(247,.*249,.*252` | WordDetailView, AdminView |
| transition-default | 0.2s | 默认过渡时间 | `transition` | 所有交互元素 |
| border-transparent | 1.5px solid transparent | 输入框默认边框 | `transparent` | 所有 input/textarea |
| container-max-width | 430px (860rpx) | 根容器最大宽度（H5） | `max-width` | App.vue |

### 平台默认样式审计（Web → uni-app 跨平台迁移）

> 目标平台：uni-app（H5 + 微信小程序）

| 源文件 | 元素 | 属性 | 偏差风险 | 处理方式 |
|--------|------|------|---------|---------|
| App.tsx | 全局容器 | box-sizing | 🔴 | 目标显式 `box-sizing: border-box` |
| App.tsx | 全局文本 | line-height | 🔴 | 目标显式 `line-height: 1.5` |
| App.tsx | 根容器 | max-width: 430px | 🟡 | H5 条件编译保留 `max-width: 860rpx` |
| HomeView.tsx | input | outline | 🟡 | 目标显式 `outline: none` |
| HomeView.tsx | input | line-height | 🔴 | 目标显式 `line-height: 1.4` |
| AuthView.tsx | input/button | -webkit-appearance | 🔴 | 目标完全自定义样式 |
| AdminView.tsx | textarea | resize | 🟡 | H5 条件编译保留 resize |
| BottomNav.tsx | bottom-nav | backdrop-filter | 🔴 | H5 条件编译保留，小程序用半透明背景 |
| BottomNav.tsx | bottom-nav | safe-area-inset-bottom | 🟡 | uni-app CSS 常量方案 |
| PhysicalImage.tsx | SVG | aspectRatio | 🟡 | 用固定高度或 padding-top 百分比 hack |

---

## 文档 5：图标资产清单（uni-icons 方案）

### 逐文件图标使用统计

| 源文件 | 使用的图标 (lucide-react) | 数量 |
|--------|--------------------------|------|
| HomeView.tsx | Search, ArrowRight, Sparkles | 3 |
| WordDetailView.tsx | ArrowLeft, ChevronRight | 2 |
| LibrariesView.tsx | BookOpen, ArrowRight | 2 |
| ProfileView.tsx | User, Settings, Shield, LogOut, ChevronRight, BookOpen, Target | 7 |
| AuthView.tsx | ArrowLeft, Eye, EyeOff | 3 |
| AdminView.tsx | BookOpen, Type, Users, Plus, Trash2, ArrowLeft, RefreshCw, Loader, ChevronRight, Check, X, ArrowRight, Search | 13 |
| BottomNav.tsx | Search, BookOpen, User | 3 |

### 目标框架图标实现方案：uni-icons

> **红线：禁止使用任何 emoji 替代图标。**

**决策**：使用 **uni-icons**（uni-ui 官方组件）+ 需自行补充的图标（使用自定义 SVG / iconfont 补充）

uni-icons 是 uni-ui 官方提供的跨平台图标组件，通过 `<uni-icons type="xxx" size="20" color="#2563EB"></uni-icons>` 使用。

### uni-icons 内置图标覆盖情况

| 源图标 (lucide) | uni-icons type | 是否直接覆盖 | 方案 |
|----------------|---------------|------------|------|
| Search | `search` | ✅ 内置 | `<uni-icons type="search" size="18" color="#9CA3AF"></uni-icons>` |
| ArrowRight | **无直接匹配** | ❌ | 使用 `arrowright` 或自定义 SVG / iconfont 补充 |
| ArrowLeft | `arrowleft` | ✅ 内置 | `<uni-icons type="arrowleft" size="18" color="#6B7280"></uni-icons>` |
| Sparkles | **无直接匹配** | ❌ | 自定义 SVG 或 iconfont 补充 |
| BookOpen | **无直接匹配** | ❌ | 使用 `paper` 或自定义 iconfont 补充 |
| User | `person` | ✅ 近似 | `<uni-icons type="person" size="20"></uni-icons>` |
| Eye | `eye` | ✅ 内置 | `<uni-icons type="eye" size="18" color="#9CA3AF"></uni-icons>` |
| EyeOff | **无直接匹配**（`eye-slash` 在部分版本可用） | ⚠️ | 查版本或用 `closeeye` |
| Check | `checkmarkempty` | ✅ 内置 | `<uni-icons type="checkmarkempty" size="15" color="#fff"></uni-icons>` |
| X (close) | `close` / `clear` | ✅ 内置 | `<uni-icons type="clear" size="15" color="#DC2626"></uni-icons>` |
| Shield | **无直接匹配** | ❌ | 自定义 iconfont / SVG 补充 |
| LogOut | **无直接匹配** | ❌ | 自定义 iconfont / SVG 补充 |
| Settings | `gear` | ✅ 内置 | `<uni-icons type="gear" size="16" color="#6B7280"></uni-icons>` |
| Target | **无直接匹配** | ❌ | 自定义 iconfont / SVG 补充 |
| Plus | `plus` | ✅ 内置 | `<uni-icons type="plus" size="14" color="#fff"></uni-icons>` |
| RefreshCw | `refreshempty` | ✅ 近似 | `<uni-icons type="refreshempty" size="13"></uni-icons>` |
| Loader (spinner) | `spinner-cycle` | ✅ 内置 | `<uni-icons type="spinner-cycle" size="15"></uni-icons>` + CSS 动画 |
| Type | **无直接匹配** | ❌ | 自定义 iconfont / SVG 补充 |
| Users | **无直接匹配** | ❌ | `person-filled` 或自定义 iconfont 补充 |
| ChevronRight | `arrowright` | ✅ 近似 | `<uni-icons type="arrowright" size="16" color="#D1D5DB"></uni-icons>` |
| Trash2 | `trash` | ✅ 内置 | `<uni-icons type="trash" size="14" color="#DC2626"></uni-icons>` |

### 覆盖统计

| 类别 | 数量 |
|------|------|
| ✅ uni-icons 直接覆盖 | 11 个（Search, ArrowLeft, Eye, Check, X, Settings, Plus, RefreshCw, Loader, ChevronRight, Trash2） |
| ⚠️ 近似覆盖（语义接近） | 2 个（User→person, BookOpen→paper） |
| ❌ 无匹配需补充 | 7 个（ArrowRight, Sparkles, BookOpen, EyeOff, Shield, LogOut, Target, Type, Users） |

### iconfont 补充图标字符映射表（供 uni-icons 不足时使用）

```
arrow-right  → <text class="iconfont">&#xe002;</text>
sparkles     → <text class="iconfont">&#xe004;</text>
book-open    → <text class="iconfont">&#xe005;</text>
eye-off      → <text class="iconfont">&#xe008;</text>
shield       → <text class="iconfont">&#xe00b;</text>
log-out      → <text class="iconfont">&#xe00c;</text>
target       → <text class="iconfont">&#xe00e;</text>
type         → <text class="iconfont">&#xe012;</text>
users        → <text class="iconfont">&#xe013;</text>
```

### 最终图标策略

1. **优先使用 uni-icons**：Search, ArrowLeft, Eye, Check, Close, Settings/Gear, Plus, Refresh, Spinner, Trash, Person(User), ArrowRight(ChevronRight)
2. **iconfont 补充**：Sparkles, BookOpen, Shield, LogOut, Target, EyeOff, Type, Users（8 个无匹配图标）
3. **自定义实现**：ArrowRight（180° 旋转 ArrowLeft）、BookOpen（可尝试 paper 或补充）
4. **emoji 红线**：Phase 3 所有 Agent Prompt 中明确："禁止使用 emoji 替代图标。优先使用 uni-icons，无匹配时使用 iconfont 字体图标。"

> 🚫 **Emoji 禁止声明**：禁止使用 🔍 ✨ 📖 👤 🛡 ⚙ 🎯 🚪 📭 ❌ ✅ ➕ 🔄 💡 ← → 等任何 emoji 字符替代图标。

---

## Phase 1 验证清单

- [x] 每个源文件都在骨架地图中有记录
- [x] 每个可交互元素在交互清单中都有一条记录（100+ 条交互 ID）
- [x] 每个条件渲染分支都有文档记录
- [x] 每个 type/interface 都在数据流图中有记录
- [x] 设计令牌有完整记录（调色板/间距/圆角/字体/阴影/渐变/特效）
- [x] 跨页面共享设计令牌有审计 Grep 模式和覆盖文件
- [x] 图标资产清单已更新为 **uni-icons + iconfont 补充**方案
- [x] 平台默认样式审计已完成
- [ ] **用户确认：等待审阅以上文档**
