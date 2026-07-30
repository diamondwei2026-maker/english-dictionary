# 英语母语者词典 — 前端架构决策记录

| 属性 | 值 |
|------|-----|
| 版本 | v2.1 |
| 状态 | 已实现 |
| 最后更新 | 2026-07-30 |
| 作者 | Claude (ADR Architect) |
| 日期 | 2026-07-07 |
| 关联文档 | [后端 ADR](./server.md) |

## 1. 需求概述

面向中文母语者的认知语言学英语词典，前端包含两个独立应用：

| 应用 | 定位 | 技术栈 |
|------|------|--------|
| **client/** (uni-app) | 面向用户的生产应用 | uni-app 3.0 + Vue 3 + TypeScript + Vite |
| **figma/** (原型) | 独立原型/设计验证应用 | Vite 6 + React 18 + shadcn/ui + Tailwind CSS 4 |

### 核心功能覆盖

| 功能 | client/ (uni-app) | figma/ (原型) |
|------|:---:|:---:|
| 首页搜索 + 单词列表 | ✅ | ✅ |
| 单词详情（物理意象 SVG + 引申义 + 搭配 + 笔记） | ✅ | ✅ |
| 词库浏览（列表 + 词库内单词） | ✅ | ✅ |
| 用户认证（登录/注册/忘记密码） | ✅ | ✅ |
| 个人中心（用户信息 + 学习统计 + 笔记入口） | ✅ | ✅ |
| 我的笔记（二级导航） | ✅ | ✅ |
| 我的收藏 | ✅ | ✅ mock |
| 管理后台（概览 + 词库/单词/用户管理 + AI 生成） | ✅ | ✅ |
| 今日一词 | ✅ | ✅ |

## 2. 跨切面决策

> 引用后端 ADR 跨切面决策，仅记录前端影响。

### 2.1 API 风格

- **选定方案**：RESTful
- **前端影响**：`client/src/api/` 封装所有 `/api/v1/*` 调用，Vercel `rewrites` 代理到 Render 后端

### 2.2 认证授权

- **选定方案**：JWT（Bearer Token），7d 有效期
- **前端影响**：Token 存 `uni.storage`（H5 对应 localStorage）；`store/user.ts` 用 Vue `reactive` 管理登录态；`api/request.ts` 自动注入 `Authorization` Header；401 时清除 Token 并跳转登录页

### 2.3 跨域

- **选定方案**：后端 `cors` 白名单 + Vercel 代理
- **前端影响**：开发环境直接请求 `localhost:3001`，生产 Vercel 通过 `rewrites` 代理（同域无跨域）

## 3. 技术选型

### 3.1 client/ — 生产应用

| 选型 | 方案 | 说明 |
|------|------|------|
| 跨端框架 | uni-app 3.0.0-alpha | uni-app x 版本，Vue 3 一等支持，编译到 H5 + 微信小程序 |
| 框架 | Vue 3.4 | Composition API + `<script setup>` |
| 语言 | TypeScript 5.4 | 类型安全 |
| 构建 | Vite 5 | uni-app 官方 Vite 插件 |
| 样式 | SCSS | 嵌套、变量 |
| 包管理 | pnpm 9 | Monorepo workspace |
| 图标 | iconfont (unicode) + PNG 图片 | 底部 Tab 图标使用 PNG；CSS 绘制箭头替代 iconfont |
| 字体 | Inter (Google Fonts) | H5 通过 `@import url()` 加载 |

**v1.x → v2.0 迁移**：从 Taro 3.6 + React 18 + @taroify + Webpack 5 迁移到 uni-app 3.0 + Vue 3 + Vite 5。迁移原因：uni-app 对微信小程序编译支持更成熟，Vue 3 Composition API 与 uni-app 生态深度整合，Vite 构建速度显著优于 Webpack。

### 3.2 figma/ — 原型应用

| 选型 | 方案 | 说明 |
|------|------|------|
| 构建 | Vite 6.3 | 极速 HMR |
| 框架 | React 18.3 | Hooks + 函数组件 |
| UI 组件 | shadcn/ui (Radix 基座) | 50+ 组件（accordion ~ tooltip），可定制 |
| 样式 | Tailwind CSS 4 + `tw-animate-css` | 原子化 CSS + 动画 |
| 图标 | Lucide React 0.487 | 统一图标系统 |
| 图表 | Recharts 2.15 | 管理后台数据可视化（预留） |
| 动画 | Motion (Framer Motion 继任) | 交互动画 |
| 表单 | react-hook-form 7.55 | 高性能表单验证 |
| 主题 | next-themes | 亮/暗模式切换（预留） |
| 拖拽 | react-dnd | 管理后台排序（预留） |
| 路由 | react-router 7.13 | SPA 路由 |

### 3.3 状态管理

- **client/ (uni-app)**：Vue `reactive` 全局单例（`store/user.ts`）。当前状态简单（AuthUser），无需 Pinia/Vuex。`login()` / `logout()` 导出函数操作状态 + Token 持久化。
- **figma/ (原型)**：React `useState` + props drilling。状态集中在 `App.tsx`（user, notes, favorites, view），通过 props 向下传递。

### 3.4 路由方案

- **client/ (uni-app)**：uni-app 页面路由（`pages.json` 声明式 pages 列表 + tabBar 配置）。原生 uni tabBar（3 Tab：首页/词库/我的）。管理后台全屏覆盖 tabBar。自定义 `navigateTo` / `switchTab` 导航。
- **figma/ (原型)**：自定义 `ViewState` discriminated union（`{ name: 'home' }` | `{ name: 'wordDetail'; wordId: string }` …），通过 `useState` + 条件渲染模拟路由。非真实 URL 路由。

### 3.5 页面结构

#### client/ (uni-app)

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | pages/home/home | 搜索 + 今日一词 + 词表 |
| 单词详情 | pages/word-detail/word-detail | 物理意象 + 引申义 + 搭配 + 笔记（持久化底部创作栏 + slide-up 面板） |
| 词库列表 | pages/libraries/libraries | 词库卡片列表 |
| 词库详情 | pages/library-words/library-words | 词库内单词列表 |
| 个人中心 | pages/profile/profile | 用户信息 + 统计 + 笔记入口 |
| 认证 | pages/auth/auth | 登录/注册/忘记密码（Tab 切换） |
| 笔记 | pages/notes/notes | 二级导航（单词列表 → 笔记列表） |
| 收藏 | pages/favorites/favorites | 收藏单词列表 + 取消收藏 |
| 管理-概览 | pages/admin/overview | 数据统计卡片 + 入口 |
| 管理-词库 | pages/admin/libraries | 词库 CRUD |
| 管理-单词 | pages/admin/words | 单词 CRUD + AI 生成 + SSE 流式 |
| 管理-用户 | pages/admin/users | 用户列表查看 |

#### figma/ (原型) — 额外页面

| 页面 | 说明 |
|------|------|
| 收藏 (FavoritesView) | 收藏单词列表（mock 数据，未接入后端 API） |
| 社区笔记 | 单词详情页内嵌社区笔记 Tab（公开笔记按点赞排序 + 点赞切换） |
| 笔记创作面板 | 持久化底部创作栏 + slide-up 底部面板（小红书风格） |

## 4. 架构设计

### 4.1 client/ 目录结构

```
client/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── pages.json                  # uni-app 页面配置 + tabBar
├── src/
│   ├── main.ts                 # 入口
│   ├── App.vue                 # 根组件（全局样式 + CSS 箭头 + Inter 字体）
│   ├── data/
│   │   └── types.ts            # TypeScript 类型定义（Word, User, AuthUser, Note 等）
│   ├── api/                    # API 请求层
│   │   ├── index.ts            # 统一导出
│   │   ├── request.ts          # 请求封装（uni.request + JWT 注入 + 401 处理）
│   │   ├── adapters.ts         # 后端 snake_case ↔ 前端 camelCase 字段适配
│   │   ├── auth.ts             # 登录/注册
│   │   ├── words.ts            # 单词 CRUD + 收藏 + 学习记录
│   │   ├── wordbanks.ts        # 词库 CRUD
│   │   ├── ai.ts               # AI 生成 + SSE 流式
│   │   ├── users.ts            # 用户信息
│   │   ├── learning.ts         # 学习记录
│   │   ├── favorites.ts        # 单词收藏
│   │   ├── notes.ts            # 笔记 CRUD
│   │   ├── daily-word.ts       # 今日一词
│   │   └── dashboard.ts        # 管理后台概览
│   ├── store/
│   │   └── user.ts             # 全局认证状态（Vue reactive + uni.storage）
│   ├── composables/
│   │   └── useInputFocus.ts    # 输入框聚焦行为
│   ├── components/             # 公共组件
│   │   ├── PageHeader.vue      # 页头（sticky + 返回按钮 + 搜索栏 slot）
│   │   ├── SearchBar.vue       # 搜索框
│   │   ├── WordCard.vue        # 单词卡片
│   │   ├── PhysicalImage.vue   # 物理意象 SVG 组件（8 种类型）
│   │   ├── PrimaryButton.vue   # 主按钮
│   │   ├── SectionLabel.vue    # 分区标签
│   │   ├── EmptyState.vue      # 空状态占位
│   │   └── AdaptiveSelect.vue  # 自适应选择器
│   ├── pages/
│   │   ├── home/home.vue
│   │   ├── word-detail/word-detail.vue
│   │   ├── libraries/libraries.vue
│   │   ├── library-words/library-words.vue
│   │   ├── profile/profile.vue
│   │   ├── auth/auth.vue
│   │   ├── notes/notes.vue
│   │   ├── favorites/favorites.vue
│   │   └── admin/
│   │       ├── overview.vue
│   │       ├── libraries.vue
│   │       ├── words.vue
│   │       └── users.vue
│   ├── utils/
│   │   └── helpers.ts          # 工具函数
│   └── static/
│       ├── fonts/              # iconfont 字体文件
│       └── images/             # Tab 图标 PNG + 其他图片资源
```

### 4.2 figma/ 目录结构

```
figma/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── src/
│   ├── main.tsx                # 入口
│   ├── app/
│   │   ├── App.tsx             # 根组件（ViewState 路由 + 全局状态）
│   │   ├── data/
│   │   │   ├── types.ts        # 类型定义（Word, Note, AuthUser, ViewState 等）
│   │   │   └── mockData.ts     # Mock 数据（开发降级方案）
│   │   └── components/
│   │       ├── ui/             # shadcn/ui 组件（50+ 组件）
│   │       ├── figma/          # 自定义 Figma 组件
│   │       │   └── ImageWithFallback.tsx
│   │       ├── HomeView.tsx
│   │       ├── WordDetailView.tsx
│   │       ├── LibrariesView.tsx
│   │       ├── ProfileView.tsx
│   │       ├── AuthView.tsx
│   │       ├── AdminView.tsx
│   │       ├── NotesView.tsx
│   │       ├── FavoritesView.tsx
│   │       ├── BottomNav.tsx
│   │       └── PhysicalImage.tsx
```

### 4.3 数据流

```
┌─ uni.storage (Token) ──────────────────────────────┐
│                                                     │
│  client/ (uni-app)                                  │
│  ┌──────────────────────────────────────────────┐   │
│  │ store/user.ts (reactive)                      │   │
│  │   └─ login() / logout() / getToken()         │   │
│  ├──────────────────────────────────────────────┤   │
│  │ api/request.ts                                │   │
│  │   └─ uni.request + JWT 注入 + 401 拦截       │   │
│  ├──────────────────────────────────────────────┤   │
│  │ api/adapters.ts                               │   │
│  │   └─ snake_case ↔ camelCase 字段映射         │   │
│  ├──────────────────────────────────────────────┤   │
│  │ pages/*.vue                                   │   │
│  │   └─ Composition API + 直接 API 调用          │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  figma/ (原型)                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ App.tsx (useState: user, notes, favorites)    │   │
│  │   └─ props drilling → 子组件                  │   │
│  ├──────────────────────────────────────────────┤   │
│  │ data/mockData.ts → 组件直接消费               │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## 5. 接口设计

### 5.1 请求封装

**client/ (uni-app)**: `uni.request` 包装，`api/request.ts` 统一处理 JWT 注入和 401 重定向。生产环境通过 Vercel `rewrites` 代理到 Render。

**figma/ (原型)**: 使用 `data/mockData.ts` 内存数据，无真实 API 调用。

### 5.2 API 模块划分（client/）

| 模块 | 文件 | 接口 |
|------|------|------|
| request | `api/request.ts` | 通用请求封装（uni.request + JWT 注入 + 401 处理） |
| adapters | `api/adapters.ts` | snake_case ↔ camelCase 字段映射 |
| auth | `api/auth.ts` | login, register |
| wordbank | `api/wordbanks.ts` | fetchWordbanks, fetchWordbankById, fetchWordsByWordbank, create, update, delete |
| word | `api/words.ts` | fetchWords, fetchWordById, create, update, delete, recordLearn, favorite, unfavorite |
| ai | `api/ai.ts` | generateWord (JSON), generateWordStream (SSE) |
| user | `api/users.ts` | fetchUsers (admin), fetchCurrentUser, fetchStats, fetchFavorites, fetchLearningRecords |
| learning | `api/learning.ts` | recordLearn, fetchLearningRecords, fetchStats |
| favorites | `api/favorites.ts` | favoriteWord, unfavoriteWord, fetchFavorites |
| notes | `api/notes.ts` | fetchNotes, createNote, deleteNote |
| daily-word | `api/daily-word.ts` | fetchDailyWord |
| dashboard | `api/dashboard.ts` | fetchDashboard |

## 6. 状态管理设计

- **client/**: `store/user.ts` 使用 Vue `reactive` 创建全局单例 `userStore`。`login()` / `logout()` 操作状态并同步 `uni.storage`（跨端兼容 H5 localStorage 和小程序 storage）。Token 通过 `getToken()` 在 `api/request.ts` 中读取。
- **figma/**: React `useState` 集中在 `App.tsx`。`user`（AuthUser | null）、`notes`（Note[]）、`favorites`（string[]），通过 props 向下传递到各视图组件。Notes 的增删通过 `handleSaveNote` / `handleDeleteNote` 回调。

## 7. 非功能性设计

### 性能

- 首屏渲染：uni-app 页面按需加载，管理后台独立页面不参与首屏
- 物理意象 SVG：内联 inline SVG（8 种类型），零网络请求
- 搜索防抖：前端 300ms 防抖减少 API 调用

### 移动端适配

- **client/**: uni-app 原生响应式，H5 最大宽度 430px（860rpx）居中，全局 `#F7F9FC` 背景
- **figma/**: 最大宽度 430px，居中显示，超出隐藏
- 目标平台：Chrome (Android)、Safari (iOS)
- 触摸交互：按钮确保充足触控区域

### 跨端兼容

- **client/**: uni-app `#ifdef H5` / `#ifdef MP-WEIXIN` 条件编译，H5 使用 Web Font + Google Fonts，小程序使用原生组件；`uni.storage` 统一存储 API
- **figma/**: 仅 Web 运行，无跨端需求

### 部署

- **client/**: Vercel 静态部署，`uni build -p h5` 输出到 `dist/build/h5`，Vercel `rewrites` 代理 `/api/*` 到 Render
- **figma/**: 本地开发 `vite dev`，未部署到生产

## 8. 风险与权衡

| 风险 | 影响 | 应对 |
|------|------|------|
| uni-app 3.0 alpha 版本不稳定 | 编译异常或 API 变更 | 锁定版本号，关注官方 Release |
| 两套前端代码库维护成本 | 功能不同步 | Figma 原型明确定位为设计验证工具，不要求功能对等 |
| uni.storage 在小程序环境容量受限（10MB） | Token 存储无影响 | 仅存 Token 字符串，远低于限制 |

### 权衡记录

- **选择 uni-app 替代 Taro**：获得了更成熟的小程序编译支持和 Vue 3 生态整合，放弃了 React 生态和 @taroify 组件库 — 使用自定义组件替代
- **选择 Vue reactive 替代 Pinia**：获得了零依赖的简洁状态管理，放弃了 DevTools 支持和模块化 Store — 当前状态极简（仅 AuthUser），够用
- **选择 Figma 原型独立运行而非整合**：获得了快速 UI 迭代和独立演示能力，付出两套代码维护成本 — 原型仅用于设计验证，不要求生产质量
- **选择 shadcn/ui (Radix) 而非 MUI 作为主 UI 库**：获得了 Tailwind 深度整合和组件源码可控性，放弃了 MUI 的完整主题系统 — Figma 原型场景下定制需求高于开箱即用

## 9. 实施结果

### v1.0 (Taro/React) → v2.0 (uni-app/Vue 3) 迁移

| 变更维度 | 迁移前 (v1.x) | 迁移后 (v2.0) |
|----------|--------------|--------------|
| 框架 | Taro 3.6 + React 18 | uni-app 3.0 + Vue 3.4 |
| 构建工具 | Webpack 5 | Vite 5 |
| 组件库 | @taroify/core 0.9 | 自定义组件 |
| 状态管理 | useState + listener 模式 | Vue reactive 单例 |
| 路由 | useNavigate ViewState 栈 | uni 页面路由 + pages.json |
| TabBar | 自定义 CustomTabBar 组件 | uni 原生 tabBar (PNG 图标) |
| API 层 | `api/` (fetch) | `api/` (uni.request) — 接口模块结构保持一致 |
| 收藏页面 | 无 | client/ favorites.vue + figma/ FavoritesView.tsx |

### 已完成功能

1. ✅ client/ uni-app 迁移：全部页面（11 个）从 Taro/React 重写为 uni-app/Vue 3
2. ✅ client/ API 层：12 个 API 模块覆盖所有后端接口
3. ✅ client/ 认证：Vue reactive store + uni.storage Token 持久化
4. ✅ client/ 笔记：notes 页面二级导航 + API 集成
5. ✅ client/ AI SSE 流式：管理后台 AI 生成支持流式响应
6. ✅ figma/ 原型：完整独立 React 应用，含 shadcn/ui 50+ 组件
7. ✅ figma/ 收藏：FavoritesView 页面（mock 数据）
8. ✅ figma/ 笔记：NotesView 二级导航页面（mock 数据）
9. ✅ 忘记密码：三步流程（client/ + figma/ 均已实现）
10. ✅ 笔记创作面板：持久化底部创作栏 + slide-up 底部面板（小红书风格），替换原内嵌 textarea
11. ✅ AI 词条 IPA 音标：DeepSeek Prompt 新增 IPA 音标输出要求，解析器校验并自动填充 phonetic 字段
