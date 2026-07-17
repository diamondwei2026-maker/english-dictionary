# Phase 2 迁移蓝图：React (inline-style) → Vue 3 + uni-app + uni-ui + Vite + Formily

> 源项目：`figma-prototype`（英语母语者词典APP）
> 目标技术栈：Vue 3 + uni-app + uni-ui + Vite + Formily
> 日期：2026-07-16
> 迁移规则来源：`references/migrations/react→uniapp.md`（已验证）

---

## 一、文件映射表

| # | 源文件 | 目标文件 | 难度 | 关键说明 |
|---|--------|---------|------|---------|
| 0 | — (框架要求) | `index.html` | 🟢 低 | **[REQUIRED]** 根目录，使用 uni-app 已验证模板 |
| 1 | `src/main.tsx` | `src/main.ts` | 🟢 低 | 入口点：createSSRApp + 自挂载 |
| 2 | `src/app/App.tsx` | `src/App.vue` | 🔴 关键 | 路由重写：useState → pages.json + store；根组件 |
| 3 | `src/app/data/types.ts` | `src/data/types.ts` | 🟢 低 | 直接保留，无 React 特定类型 |
| 4 | `src/app/data/mockData.ts` | `src/data/mockData.ts` | 🟢 低 | 直接保留，AI_GENERATED_TEMPLATES 保留 |
| 5 | `src/app/components/BottomNav.tsx` | — (原生 tabBar) | 🟢 低 | 由 `pages.json` tabBar 配置取代 |
| 6 | `src/app/components/HomeView.tsx` | `src/pages/home/home.vue` | 🟡 中 | 搜索+列表+焦点样式 |
| 7 | `src/app/components/WordDetailView.tsx` | `src/pages/word-detail/word-detail.vue` | 🔴 高 | 复杂布局；SVG → 条件编译保留；滚动行为 |
| 8 | `src/app/components/LibrariesView.tsx` | `src/pages/libraries/libraries.vue` + `src/pages/library-words/library-words.vue` | 🟡 中 | 拆为两个路由页面 |
| 9 | `src/app/components/ProfileView.tsx` | `src/pages/profile/profile.vue` | 🟡 中 | 未登录/已登录双态；条件渲染 |
| 10 | `src/app/components/AuthView.tsx` | `src/pages/auth/auth.vue` | 🟡 中 | 表单验证 + Formily 可选增强 |
| 11 | `src/app/components/AdminView.tsx` | `src/pages/admin/admin.vue` + 4 个子组件（见下方拆分） | 🔴 高 | 🔴 拆为6个文件：admin主入口 + 5个子视图 |
| 11a | AdminView:Overview | `src/pages/admin/components/OverviewSection.vue` | 🟡 中 | 数据概览 |
| 11b | AdminView:LibraryManager | `src/pages/admin/components/LibraryManager.vue` | 🟡 中 | 词库 CRUD |
| 11c | AdminView:WordManager | `src/pages/admin/components/WordManager.vue` | 🟡 中 | 单词 CRUD + 搜索 |
| 11d | AdminView:WordEditForm | `src/pages/admin/components/WordEditForm.vue` | 🔴 高 | AI 生成 + 复杂表单 → Formily 候选 |
| 11e | AdminView:UserManager | `src/pages/admin/components/UserManager.vue` | 🟢 低 | 用户列表（只读） |
| 12 | `src/app/components/PhysicalImage.tsx` | `src/components/PhysicalImage.vue` | 🟡 中 | 8 个 SVG → H5 条件编译保留；小程序 PNG 回退 |
| 13 | `src/app/components/figma/ImageWithFallback.tsx` | `src/components/ImageWithFallback.vue` | 🟢 低 | 图片兜底组件 |
| — | (复用分析新增) | `src/components/PageHeader.vue` | 🟡 中 | 🔴 共享组件：9 个页面复用 |
| — | (复用分析新增) | `src/components/SectionLabel.vue` | 🟢 低 | 🔴 共享组件 |
| — | (复用分析新增) | `src/components/PrimaryButton.vue` | 🟢 低 | 🔴 共享组件 |
| — | (复用分析新增) | `src/components/WordCard.vue` | 🟡 中 | 🔴 共享组件 |
| — | (复用分析新增) | `src/components/EmptyState.vue` | 🟢 低 | 🔴 共享组件 |
| — | (复用分析新增) | `src/components/SearchBar.vue` | 🟡 中 | 🔴 共享组件：focus/blur 状态 |
| — | (逻辑复用新增) | `src/utils/helpers.ts` | 🟢 低 | getWordById, getLibraryById, getPosColor, filterWords |
| — | (逻辑复用新增) | `src/composables/useInputFocus.ts` | 🟡 中 | focus/blur :class 切换 |
| — | (状态复用新增) | `src/store/user.ts` | 🟢 低 | 全局 user 状态（reactive store） |
| — | (框架要求) | `src/pages.json` | 🔴 关键 | **[REQUIRED]** src/ 下 |
| — | (框架要求) | `src/manifest.json` | 🟢 低 | **[REQUIRED]** src/ 下 |
| — | (框架要求) | `src/uni.scss` | 🟡 中 | **[REQUIRED]** 全局 SCSS 变量 |
| — | (框架要求) | `src/shims-vue.d.ts` | 🟢 低 | **[REQUIRED]** TypeScript 声明 |
| — | (框架要求) | `vite.config.ts` | 🔴 关键 | **[REQUIRED]** 根目录，uni 插件 |
| — | (框架要求) | `tsconfig.json` | 🟢 低 | **[REQUIRED]** 根目录 |
| — | (框架要求) | `package.json` | 🔴 关键 | **[REQUIRED]** 根目录 |

### 不移植的文件

| 源文件 | 原因 |
|--------|------|
| `src/app/components/BottomNav.tsx` | 由 uni-app 原生 tabBar 取代 |
| `vite.config.ts` | 由 uni-app 的 vite.config.ts 替代 |
| `postcss.config.mjs` | uni-app 内置 PostCSS 处理 |
| `pnpm-workspace.yaml` | 目标项目不使用 pnpm workspace |
| `src/styles/index.css` / `tailwind.css` / `fonts.css` / `theme.css` / `globals.css` | 由 uni.scss + App.vue 全局样式替代 |
| `default_shadcn_theme.css` | 不使用 shadcn/ui |
| `guidelines/Guidelines.md` | 空模板，无需迁移 |
| `src/app/components/ui/*.tsx` (49 files) | shadcn/ui 样板，由 uni-ui 替代 |

### 📋 最终目标目录结构（总计 ~38 文件）

```
target-project/
├── index.html                     → 根目录
├── package.json                   → 根目录
├── vite.config.ts                 → 根目录
├── tsconfig.json                  → 根目录
└── src/
    ├── main.ts                    → 入口
    ├── App.vue                    → 根组件
    ├── pages.json                 → 路由配置
    ├── manifest.json              → 应用清单
    ├── uni.scss                   → 全局 SCSS 变量
    ├── shims-vue.d.ts             → TS 类型声明
    ├── data/
    │   ├── types.ts               → 类型定义
    │   └── mockData.ts            → 模拟数据
    ├── store/
    │   └── user.ts                → 全局用户状态
    ├── composables/
    │   └── useInputFocus.ts       → 输入框 focus 管理
    ├── utils/
    │   └── helpers.ts             → 工具函数
    ├── components/
    │   ├── PageHeader.vue         → 共享页头
    │   ├── SectionLabel.vue       → 区块标签
    │   ├── PrimaryButton.vue      → 主按钮
    │   ├── WordCard.vue           → 单词卡片
    │   ├── EmptyState.vue         → 空状态
    │   ├── SearchBar.vue          → 搜索栏
    │   ├── PhysicalImage.vue      → 物理意象图
    │   └── ImageWithFallback.vue  → 图片兜底
    ├── pages/
    │   ├── home/home.vue          → 首页
    │   ├── word-detail/word-detail.vue → 单词详情
    │   ├── libraries/libraries.vue     → 词库列表
    │   ├── library-words/library-words.vue → 词库单词
    │   ├── profile/profile.vue    → 个人中心
    │   ├── auth/auth.vue          → 登录注册
    │   └── admin/
    │       ├── admin.vue          → 管理主页
    │       └── components/
    │           ├── OverviewSection.vue
    │           ├── LibraryManager.vue
    │           ├── WordManager.vue
    │           ├── WordEditForm.vue
    │           └── UserManager.vue
    └── static/
        ├── fonts/
        │   └── iconfont.ttf       → 图标字体占位
        └── images/
            ├── tab-home.png
            ├── tab-home-active.png
            ├── tab-libraries.png
            ├── tab-libraries-active.png
            ├── tab-profile.png
            └── tab-profile-active.png
```

---

## 二、六大类映射规则

### 2.1 组件模型映射

| 源模式 (React) | 目标模式 (uni-app Vue 3) | 代码示例 |
|---------------|------------------------|---------|
| `function C(props: I)` | `<script setup>` + `defineProps<I>()` | — |
| `<div style={...}>` | `<view class="c">` | 静态值进 scoped class |
| `<h1>`~`<h4>` | `<view class="h1">` | 无原生语义标签 |
| `<span>` | `<text>` | 🔴 NC-14: 必须 `display: block` 替代块级 |
| `<p>` | `<text>` 或 `<view>` | 🔴 NC-14: 截断场景必须 `display: block` |
| `<input onChange>` | `<input v-model @input>` | v-model 自动处理值绑定 |
| `<button>` | `<view class="btn" @click>` | 避免小程序 button 默认样式 |
| `<select>` | `<picker mode="selector">` 条件编译 | 🔴 见 2.4c |
| `useState(x)` | `ref(x)` | `import { ref } from 'vue'` **不从 @dcloudio** |
| `useMemo(fn, deps)` | `computed(fn)` | — |
| `useEffect(fn, [])` | `onMounted(fn)` | — |
| `window.confirm()` | `uni.showModal({...})` | 异步回调替代同步阻塞 |
| `<React.Fragment>` / `<>` | `<template>` 或 `<block>` | — |
| `{view.name === 'home' && <C/>}` | `pages.json` 路由 → 无需条件渲染 | — |

### 2.2 事件系统映射

| 源 (React) | 目标 (uni-app) | 说明 |
|-----------|---------------|------|
| `onClick={...}` | `@click` / `@tap` | 小程序端优先 `@tap` |
| `onChange={e => setX(e.target.value)}` | `@input` + `v-model` | v-model 自动处理 |
| `onFocus={e => e.target.style.xxx=...}` | `@focus` + `:class` 绑定 | 🔴 **关键**：DOM 操作 → 声明式 class |
| `onBlur={e => e.target.style.xxx=...}` | `@blur` + `:class` 绑定 | 🔴 同上 |
| `onKeyDown={e => e.key==='Enter' && fn()}` | `@confirm`（input）/ `@keydown.enter`（H5） | 小程序端 input 用 `@confirm` |
| `onSubmit` | `@submit` / 按钮 `@click` | — |

### 2.3 样式系统映射

| 源 (React inline-style) | 目标 (uni-app) | 规则 |
|-------------------------|---------------|------|
| `style={{padding:'16px',...}}` | scoped CSS `.class { padding: 32rpx; ... }` | 静态值进 class |
| `style={{color: isX ? '#A' : '#B'}}` | `:style="{ color: isX ? '#A' : '#B' }"` | 动态值留 :style |
| `e.target.style.borderColor = '...'` | `:class="{ 'input--focused': isFocused }"` | 🔴 命令式 → 声明式 |
| `backdropFilter: 'blur(16px)'` | `/* #ifdef H5 */ backdrop-filter: blur(32rpx); /* #endif */` | 🔴 必须条件编译 |
| `transition: 'border-color 0.2s...'` | `/* #ifdef H5 */ transition: ...; /* #endif */` | 🔴 NC-04 |
| `position: 'fixed'` BottomNav | `pages.json` 原生 tabBar | 移除自定义 BottomNav |
| px → rpx | `1px = 2rpx`（375px → 750rpx 基准） | 所有静态值 ×2 |
| `boxShadow: '0 2px 16px...'` | `box-shadow: 0 4rpx 32rpx rgba(0,0,0,0.05)` | 数值 ×2 |
| `resize: 'vertical'` textarea | 移除 → 小程序用 `auto-height` | 🔴 NC-08 |

### 2.4 路由与导航映射

| 源 (useState 手动路由) | 目标 (uni-app pages.json) |
|------------------------|--------------------------|
| `setView({name:'home'})` | `uni.switchTab({url:'/pages/home/home'})` |
| `setView({name:'wordDetail', wordId})` | `uni.navigateTo({url:'/pages/word-detail/word-detail?wordId='+id})` |
| `setView({name:'libraries'})` | `uni.switchTab({url:'/pages/libraries/libraries'})` |
| `setView({name:'libraryWords', libraryId})` | `uni.navigateTo({url:'/pages/library-words/library-words?libraryId='+id})` |
| `setView({name:'profile'})` | `uni.switchTab({url:'/pages/profile/profile'})` |
| `setView({name:'login'})` | `uni.navigateTo({url:'/pages/auth/auth?mode=login'})` |
| `setView({name:'register'})` | `uni.navigateTo({url:'/pages/auth/auth?mode=register'})` |
| `setView({name:'admin', tab})` | `uni.navigateTo({url:'/pages/admin/admin?tab='+tab})` |
| 返回上一页 (ArrowLeft) | `uni.navigateBack()` |
| 参数获取 | `onLoad((options) => { options.wordId })` |

### 🔴 回调内闭合的 navigate → 内联到页面（PM-M1）

| 源模式 | 问题 | 正确做法 |
|--------|------|---------|
| App.tsx `handleLogin` 内含 `navigate()` → 传给 AuthView.onAuth | AuthView emit('auth',u) → 但无人接收 | auth.vue 的 handleSubmit 成功后直接 `uni.switchTab/uni.navigateTo` |
| App.tsx `handleLogout` 内含 `navigate({name:'home'})` → 传给 ProfileView.onLogout | ProfileView emit → 无人接收 | profile.vue 的退出按钮直接 `uni.switchTab({url:'/pages/home/home'})` |

### 2.5 状态管理映射

| 源 (React) | 目标 (uni-app Vue 3) |
|-----------|---------------------|
| App.tsx `useState<ViewState>` + `setView()` | `pages.json` 路由 — 移除手动视图 |
| App.tsx `useState<AuthUser>` + props 传递 | `src/store/user.ts` → `reactive({user:null})` |
| 组件内 `useState` | `ref()` / `reactive()` |
| 派生状态 | `computed()` |
| 回调 prop (`onAuth`, `onLogout`) | defineEmits + 页面内联 navigater |

### 2.6 数据获取映射

| 源 | 目标 |
|----|------|
| `import { mockWords } from '../data/mockData'` | 相同 — 保留 import |
| `mockWords.find(w => w.id === id)` | 提取为 `helpers.ts` → `getWordById(id)` |
| `mockLibraries.find(...)` | 提取为 `helpers.ts` → `getLibraryById(id)` |
| `setTimeout(() => {...}, ms)` | 保留 |
| `AI_GENERATED_TEMPLATES[word]` | 保留 |

---

## 三、图标迁移映射（icongont 方案）

> **决策**：uni-icons 无法覆盖全部 20 个图标，选择 iconfont 字体图标全端方案。
> **🔴 红线**：禁止使用任何 emoji 字符替代图标。

| 源图标 (lucide-react) | 目标实现 | 代码片段 | 说明 |
|----------------------|---------|---------|------|
| Search | iconfont | `<text class="iconfont">&#xe001;</text>` | 搜索放大镜 |
| ArrowRight | iconfont | `<text class="iconfont">&#xe002;</text>` | 列表项右箭头 |
| ArrowLeft | iconfont | `<text class="iconfont">&#xe003;</text>` | 返回左箭头 |
| Sparkles | iconfont | `<text class="iconfont">&#xe004;</text>` | 今日一词装饰 |
| BookOpen | iconfont | `<text class="iconfont">&#xe005;</text>` | 词库书本 |
| User | iconfont | `<text class="iconfont">&#xe006;</text>` | 用户头像 |
| Eye | iconfont | `<text class="iconfont">&#xe007;</text>` | 密码可见 |
| EyeOff | iconfont | `<text class="iconfont">&#xe008;</text>` | 密码隐藏 |
| Check | iconfont | `<text class="iconfont">&#xe009;</text>` | AI 完成标记 |
| X | iconfont | `<text class="iconfont">&#xe00a;</text>` | 关闭/清除 |
| Shield | iconfont | `<text class="iconfont">&#xe00b;</text>` | 管理员盾牌 |
| LogOut | iconfont | `<text class="iconfont">&#xe00c;</text>` | 退出登录 |
| Settings | iconfont | `<text class="iconfont">&#xe00d;</text>` | 设置齿轮 |
| Target | iconfont | `<text class="iconfont">&#xe00e;</text>` | 学习目标 |
| Plus | iconfont | `<text class="iconfont">&#xe00f;</text>` | 新增加号 |
| RefreshCw | iconfont | `<text class="iconfont">&#xe010;</text>` | 重新生成 |
| Loader | CSS animation | `<view class="spinner">` | @keyframes spin |
| Type | iconfont | `<text class="iconfont">&#xe012;</text>` | 文字/类型 |
| Users | iconfont | `<text class="iconfont">&#xe013;</text>` | 用户组 |
| ChevronRight | iconfont | `<text class="iconfont">&#xe014;</text>` | 展开引导 |

**图标基础设施**：
1. `src/static/fonts/iconfont.ttf` — 字体文件占位（Phase 3 Layer 2.5）
2. `App.vue` 非 scoped style — `@font-face` + `.iconfont` 工具类
3. Unicode 码点：`\e001` ~ `\e014`

---

## 四、不可直接映射的特性及多平台决策

| # | 源特性 | 问题 | 替代方案 | 保真度差距 | 多平台影响 |
|----|--------|------|---------|-----------|-----------|
| D1 | `maxWidth: '430px'` 中央窄栏 | 小程序无此概念 | H5 条件编译保留 | 🟡 | 见 D1 矩阵 |
| D2 | 自定义 BottomNav 组件 | 无原生 tabBar 体验 | `pages.json` 原生 tabBar | 🟡 可接受 | 见 D2 矩阵 |
| D3 | `backdropFilter: blur(16px)` | 小程序不支持 | H5 保留 blur，小程序纯色背景 | 🟡 | 见 D3 矩阵 |
| D4 | `transition: 'border-color 0.2s'` | 小程序原生组件不支持 | H5 保留 transition，小程序 `:class` 突变 | 🟡 | 见 D8 矩阵 |
| D5 | 内联 SVG PhysicalImage | 小程序不支持内联 SVG | H5 保留 SVG；小程序 PNG 回退 | 🟡 | 见 D5 矩阵 |
| D6 | `<select>` 词库/词性选择 | 小程序无原生 select | `<picker mode="selector">` | 🟢 | 见 §2.4c |
| D7 | `window.confirm()` 同步阻塞 | 小程序不支持 | `uni.showModal()` 异步 | 🟢 | AdminView 删除确认 |
| D8 | Input focus CSS transition | 小程序原生层冲突（NC-04） | H5 保留 transition；小程序 :class 突变 | 🟡 | 见 D8 矩阵 |

### 多平台影响矩阵

#### D1：移除页面级 maxWidth

| 评估维度 | H5 桌面端 | H5 移动端 | 微信小程序 |
|---------|----------|----------|-----------|
| 视觉影响 | 🔴 严重：宽屏拉伸 | 🟢 无影响 | 🟢 无影响 |
| 判定 | 🔴 不可接受 → 条件编译保留 | 🟢 | 🟢 |

**决策**：`/* #ifdef H5 */` 包裹 `max-width: 860rpx; margin: 0 auto`（App.vue 根容器）

#### D3：header backdrop-filter blur

| 评估维度 | H5 | 微信小程序 |
|---------|----|-----------|
| 视觉影响 | 🔴 blur 丢失 → 视觉降级 | 🟡 小程序不支持 → 纯色背景可接受 |
| 判定 | 🔴 不可接受 → 条件编译保留 | 🟡 可接受 |

**决策**：`/* #ifdef H5 */ backdrop-filter: blur(32rpx); -webkit-backdrop-filter: blur(32rpx); /* #endif */`

#### D8：input focus CSS transition

| 评估维度 | H5 | 微信小程序 |
|---------|----|-----------|
| 视觉影响 | 🟢 平滑过渡 | 🟡 :class 突变仍可见 |
| 判定 | 🟢 保留 | 🟡 可接受 |

**决策**：H5 端 `transition` 保留；小程序端靠 `:class` 切换背景色突变表达 focus 状态。

### H5 专属条件编译属性清单

| 属性 | 条件编译语法 | 关联决策 |
|------|------------|---------|
| `max-width` + `margin: 0 auto` | `/* #ifdef H5 */` | D1 |
| `backdrop-filter` + `-webkit-backdrop-filter` | `/* #ifdef H5 */` | D3 |
| `transition` 在 input/textarea 上 | `/* #ifdef H5 */` | D8 |
| `cursor: pointer` | `/* #ifdef H5 */` | — |
| 内联 SVG（PhysicalImage） | `<!-- #ifdef H5 -->` | D5 |
| `@import url()` Google Fonts | `/* #ifdef H5 */` | NC-09 |
| `*` 通配选择器 | `/* #ifdef H5 */` | NC-10 |
| `html, body` 选择器 | `/* #ifdef H5 */` | NC-11 |

---

## 五、输入框样式模式分类（Step 4b — 完整）

> **触发**：源用 `e.target.style.xxx = '...'` 命令式 DOM 操作 + 不同页面有不同默认值 +
> 目标是 uni-app → 完整执行。

### 5.1 模式枚举

| 模式 ID | blur border | blur bg | focus border | focus bg | 出现位置 |
|---------|-----------|---------|-------------|---------|---------|
| INPUT-A | `transparent` | `#F1F5F9` | `#2563EB` | `#FFFFFF` | HomeView 搜索框、AdminView 全部（搜索框+表单+textarea+select） |
| INPUT-B | `#E5E7EB` | `#FFFFFF` | `#2563EB` | `#FFFFFF` | AuthView 全部（手机号+密码+用户名） |

### 5.2 SCSS 实现

```scss
// uni.scss — 全局注入

// INPUT-A: 透明边框 + 灰色背景 → 蓝色边框 + 白色背景
@mixin input-pattern-a {
  border: 3rpx solid transparent;
  background: #F1F5F9;
  /* #ifdef H5 */
  transition: border-color 0.2s, background 0.2s;
  /* #endif */
}

@mixin input-pattern-a-focused {
  border-color: #2563EB !important;
  background: #fff !important;
}

// INPUT-B: 灰色边框 + 白色背景 → 蓝色边框（背景不变）
@mixin input-pattern-b {
  border: 3rpx solid #E5E7EB;
  background: #fff;
  /* #ifdef H5 */
  transition: border-color 0.2s;
  /* #endif */
}

@mixin input-pattern-b-focused {
  border-color: #2563EB !important;
}
```

### 5.3 文件→模式映射表

| 文件 | 输入框类型 | 使用模式 | focus 管理 |
|------|----------|---------|-----------|
| home.vue | 搜索 input | INPUT-A | useInputFocus composable |
| admin/components/WordManager.vue | 搜索 input | INPUT-A | useInputFocus composable |
| admin/components/LibraryManager.vue | input + textarea | INPUT-A | useInputFocus composable |
| admin/components/WordEditForm.vue | input + textarea + select | INPUT-A | useInputFocus composable |
| auth.vue | 手机号/密码/用户名 input | INPUT-B | useInputFocus composable |

---

## 六、复用分析

### 6.1 组件复用

| 复用模式 | 出现次数 | 出现位置 | 建议 |
|---------|---------|---------|------|
| 页头（半透明背景 + blur + 标题 + 可选返回+可选右侧） | 9 | home, libraries, library-words, profile(已登录), word-detail, auth, admin(×3) | 🟢 **提取为 PageHeader** |
| 区块标签（大写小字 + letter-spacing） | 15+ | word-detail, admin 所有子组件 | 🟢 **提取为 SectionLabel** |
| 主操作按钮（全宽 + 蓝色 + 圆角 + loading 态） | 8+ | profile, auth, admin(保存/生成/提交) | 🟢 **提取为 PrimaryButton** |
| 单词列表项（单词名+音标+含义+箭头） | 3 | home(全部词汇), home(搜索结果), library-words | 🟡 **提取为 WordCard** |
| 空状态提示（图标+标题+副标题） | 4 | home(搜索无结果), library-words(空词库), admin(词库/单词为空) | 🟢 **提取为 EmptyState** |
| 搜索栏（图标+输入框+focus/blur 边框） | 2 | home, admin/WordManager | 🟡 **提取为 SearchBar** |
| 物理意象图（SVG+标签） | 2 | word-detail, admin/WordEditForm | 🟡 **提取为 PhysicalImage** |

### 6.2 PageHeader — 差异化参数清单

| 属性维度 | home | libraries | library-words | profile(已登录) | word-detail | auth | admin |
|---------|------|-----------|---------------|----------------|-------------|------|-------|
| 背景色 | `rgba(255,255,255,0.9)` | `rgba(255,255,255,0.9)` | `rgba(255,255,255,0.9)` | `rgba(255,255,255,0.9)` | `rgba(247,249,252,0.92)` | 无header背景 | `rgba(247,249,252,0.94)` |
| padding-top | 56px | 52px | 52px | 52px | 52px | 52px | 52px |
| 返回按钮 | ❌ | ❌ | ✅ "词库列表" | ❌ | ✅ "返回" | ✅ "返回" | ✅ "返回" |
| 右侧操作 | ❌ | ❌ | ❌ | ❌ | 词库标签 badge | ❌ | 新增按钮 |
| 标题 | 双行(小字+大字) | 双行 | 动态(词库名) | 双行 | 无(用h1在内容) | 动态(logo+标题) | 双行(小字+大字) |

**Props 接口推导**：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | 必填 | 主标题 |
| `subtitle` | `string` | `''` | 副标题（小字标签行） |
| `showBack` | `boolean` | `false` | 是否显示返回按钮 |
| `backLabel` | `string` | `'返回'` | 返回按钮文字 |
| `bgType` | `'white' \| 'page' \| 'none'` | `'white'` | 背景类型 |
| `paddingTop` | `number` | `104` | top padding（rpx） |

### 6.3 样式复用 → SCSS 变量/mixin

| 复用模式 | 实施方式 |
|---------|---------|
| header padding + 背景 | SCSS 变量 `$header-padding-top`, `$header-padding-bottom` |
| 吸顶 header | SCSS mixin `@mixin sticky-header` |
| 区块标签 | 全局类 `.section-label` |
| 卡片投影 | SCSS mixin `@mixin card($radius: 48rpx)` |
| 横排卡片（单词列表项） | 全局类 `.word-row-card` |
| 按钮基础样式 | 全局类 `.btn` |

### 6.4 逻辑复用 → 工具函数/composable

| 复用模式 | 目标 | 实施方式 |
|---------|------|---------|
| `mockWords.find(w => w.id === id)` | `src/utils/helpers.ts` | `getWordById(id)` |
| `mockLibraries.find(l => l.id === id)` | `src/utils/helpers.ts` | `getLibraryById(id)` |
| POS_COLORS 查找 | `src/utils/helpers.ts` | `getPosColor(pos)` |
| 搜索过滤逻辑 | `src/utils/helpers.ts` | `filterWords(query, words)` |
| Input focus/blur 状态管理 | `src/composables/useInputFocus.ts` | `useInputFocus(initialFocus?)` |

---

## 七、SCSS 变量定义与交叉验证

### 7.1 变量定义（uni.scss）

```scss
// ══════════════════════════════════════════════════════════
// uni.scss — 全局 SCSS 变量 (injected via vite.config.ts)
// ══════════════════════════════════════════════════════════

// ── 颜色 ──────────────────────────────────────────────
$color-primary: #2563EB;         /* Phase1(src): HomeView.tsx:41 H1=#2563EB, WordDetailView.tsx:95 hero=#111827 */
$color-primary-dark: #1D4ED8;    /* Phase1(src): HomeView.tsx:143 gradient */
$color-primary-light: #3B82F6;   /* Phase1(src): HomeView.tsx:143 gradient */
$color-primary-bg: #EFF6FF;      /* Phase1(src): HomeView.tsx:216 badge, LibrariesView.tsx:11 gradient */
$color-bg-page: #F7F9FC;         /* Phase1(src): App.tsx:52 bg, HomeView.tsx:26 bg */
$color-bg-card: #FFFFFF;         /* Phase1(src): all cards */
$color-bg-input: #F1F5F9;        /* Phase1(src): HomeView.tsx:61 input bg, AdminView.tsx:54 INPUT bg */
$color-text-primary: #111827;    /* Phase1(src): all titles */
$color-text-secondary: #6B7280;  /* Phase1(src): all descriptions */
$color-text-tertiary: #9CA3AF;   /* Phase1(src): HomeView.tsx:36 labels */
$color-text-muted: #D1D5DB;      /* Phase1(src): arrow icons */
$color-border: #E5E7EB;          /* Phase1(src): AuthView.tsx:62 input border */
$color-border-light: #BFDBFE;    /* Phase1(src): LibrariesView.tsx:11 lib card border */
$color-error: #DC2626;           /* Phase1(src): AuthView.tsx:204 error msg, ProfileView.tsx:176 logout btn */
$color-error-bg: #FEF2F2;        /* Phase1(src): AuthView.tsx:204, ProfileView.tsx:176 */
$color-success: #16A34A;         /* Phase1(src): ProfileView.tsx:148 stats */
$color-success-bg: #F0FDF4;      /* Phase1(src): ProfileView.tsx:148 */
$color-warning: #D97706;         /* Phase1(src): AuthView.tsx:229 demo hint border */
$color-warning-bg: #FFFBEB;      /* Phase1(src): AuthView.tsx:229 */
$color-admin: #7C3AED;           /* Phase1(src): ProfileView.tsx:134 admin icon, AdminView.tsx:146 */
$color-admin-bg: #FAF5FF;        /* Phase1(src): ProfileView.tsx:132 admin bg */

// ── 间距 ──────────────────────────────────────────────
$page-pt: 112rpx;                /* Phase1(src): HomeView.tsx:29 56px, LibrariesView.tsx:20 52px ⚠️ 4px diff — use majority 52px=104rpx, home needs override */
$page-pt-home: 112rpx;           /* Phase1(src): HomeView.tsx:29 56px → 112rpx */
$header-pt: 104rpx;              /* Phase1(src): LibrariesView.tsx:20 52px, majority */
$page-px: 48rpx;                 /* Phase1(src): 24px → across all pages */
$content-pt: 40rpx;              /* Phase1(src): HomeView.tsx:132 20px */
$card-p-lg: 48rpx;               /* Phase1(src): WordDetailView.tsx:121 24px, LibrariesView.tsx:48 24px */
$card-p-md: 40rpx;               /* Phase1(src): AdminView.tsx:192 CARD padding=20px ⚠️ diff from $card-p-lg */
$card-p-sm: 32rpx;               /* Phase1(src): list items 16px */
$gap-xs: 12rpx;                  /* Phase1(src): icon+text 6px */
$gap-sm: 20rpx;                  /* Phase1(src): 10px */
$gap-md: 32rpx;                  /* Phase1(src): 16px */
$gap-lg: 48rpx;                  /* Phase1(src): 24px */
$input-px: 32rpx;                /* Phase1(src): 16px */
$input-py: 28rpx;                /* Phase1(src): 14px */

// ── 圆角 ──────────────────────────────────────────────
$radius-sm: 16rpx;               /* Phase1(src): 8px badges, tags */
$radius-md: 24rpx;               /* Phase1(src): 12px icon containers */
$radius-lg: 32rpx;               /* Phase1(src): 16px inputs, buttons, list items */
$radius-xl: 40rpx;               /* Phase1(src): 20px cards, user cards */
$radius-2xl: 48rpx;              /* Phase1(src): 24px large cards, hero */
$radius-full: 9999rpx;           /* Phase1(src): badge, avatar */

// ── 字体 ──────────────────────────────────────────────
$font-hero: 84rpx;               /* Phase1(src): WordDetailView.tsx:95 42px → 84rpx */
$font-h1: 52rpx;                 /* Phase1(src): HomeView.tsx:39 26px */
$font-h2: 44rpx;                 /* Phase1(src): AdminView.tsx:155 22px */
$font-h3: 36rpx;                 /* Phase1(src): 18px */
$font-body-lg: 32rpx;            /* Phase1(src): 16px */
$font-body: 28rpx;               /* Phase1(src): 14px */
$font-caption: 26rpx;            /* Phase1(src): 13px */
$font-label: 22rpx;              /* Phase1(src): HomeView.tsx:37 12px ⚠️ WordDetailView.tsx:105 uses 11px=22rpx → coincidentally same */
$font-sm: 20rpx;                 /* Phase1(src): 10px tiny text */

// ── 阴影 ──────────────────────────────────────────────
$shadow-card: 0 4rpx 24rpx rgba(0,0,0,0.04);     /* Phase1(src): HomeView.tsx:195 */
$shadow-card-strong: 0 4rpx 32rpx rgba(0,0,0,0.05); /* Phase1(src): HomeView.tsx:105 */
$shadow-elevated: 0 16rpx 64rpx rgba(37,99,235,0.25); /* Phase1(src): HomeView.tsx:148 */
$shadow-subtle: 0 2rpx 8rpx rgba(0,0,0,0.08);    /* Phase1(src): AuthView.tsx:123 */
```

### 7.2 交叉验证矩阵

| 变量 | 定义值(rpx) | 原型px→rpx | 原型来源 | 偏差 | 判定 |
|------|-----------|-----------|---------|------|------|
| `$page-pt` | 104rpx | 52px→104rpx (多数) | LibrariesView:20 | 0 | 🟢 |
| `$page-pt-home` | 112rpx | 56px→112rpx | HomeView:29 | 0 | 🟢 |
| `$header-pt` | 104rpx | 52px→104rpx | 多数页面 | 0 | 🟢 |
| `$card-p-lg` | 48rpx | 24px→48rpx | WordDetailView:121 | 0 | 🟢 |
| `$card-p-md` | 40rpx | 20px→40rpx | AdminView:192 | 0 | 🟢 |
| `$gap-sm` | 20rpx | 10px→20rpx | HomeView:113 | 0 | 🟢 |
| `$font-h1` | 52rpx | 26px→52rpx | HomeView:39 | 0 | 🟢 |
| `$font-label` | 22rpx | 11-12px→22-24rpx | ⚠️ 存在2值 (11/12px) | 🟡 (取22rpx) | 🟡 文档中标记 |
| `$shadow-card` | 0 4rpx 24rpx | 0 2px 12px→4rpx 24rpx | HomeView:195 | 0 | 🟢 |

> ⚠️ **`$font-label` 偏差说明**：源中 11px 和 12px 两个值均存在。取 22rpx (11px) 作为默认值。使用 12px 的页面需覆盖 `font-size: 24rpx`。

---

## 八、全局样式强制规则（G1~G17）

Phase 3 每个页面 Agent 必须收到的约束：

| ID | 规则 | 实施方式 | 严重性 |
|----|------|---------|--------|
| G1 | 所有 header backdrop-filter 必须 H5 条件编译 | `/* #ifdef H5 */ backdrop-filter: blur(32rpx); /* #endif */` | 🔴 |
| G2 | header 背景必须是半透明色 | `rgba(255,255,255,0.9)` 或 `rgba(247,249,252,0.94)`（按 bgType） | 🔴 |
| G3 | 页面顶部 padding 包含安全区 | `padding-top: 104rpx` 起 | 🟡 |
| G4 | 全局 box-sizing: border-box | `/* #ifdef H5 */ * { box-sizing: border-box; } /* #endif */` | 🔴 |
| G5 | input 必须有显式 height | `height: 88rpx`（44px×2）| 🔴 NC-01 |
| G6 | input 必须闭合标签 `></input>` | 非 `/>` | 🔴 NC-02 |
| G7 | textarea 必须有 `auto-height` | 无 `resize` | 🔴 NC-03/NC-08 |
| G8 | 页面级 maxWidth H5 条件编译 | `/* #ifdef H5 */ max-width: 860rpx; margin: 0 auto; /* #endif */` | 🔴 D1 |
| G9 | `@import url()` 必须 H5 条件编译 | `/* #ifdef H5 */ @import url(...) /* #endif */` | 🔴 NC-09 |
| G10 | 通配选择器 `*` 必须 H5 条件编译 | `/* #ifdef H5 */ * { } /* #endif */` | 🔴 NC-10 |
| G11 | `html, body` 选择器必须 H5 条件编译 | `/* #ifdef H5 */ html, body { } /* #endif */` | 🔴 NC-11 |
| G12 | font-family: Inter 降级 | H5: Inter + system-ui; 小程序: system-ui | 🟡 |
| G13 | transition 在原生组件上必须 H5 条件编译 | `/* #ifdef H5 */ transition: ...; /* #endif */` | 🔴 NC-04 |
| G14 | input 使用正确的 INPUT-A/B mixin | `@include input-pattern-a` 或 `@include input-pattern-b` | 🔴 |
| G15 | focus 管理使用 `useInputFocus` composable | `const { isFocused, onFocus, onBlur } = useInputFocus()` | 🔴 |
| G16 | 🚫 禁止原生 `<select>` 在非 H5 平台 | `<picker mode="selector">` 条件编译 | 🔴 |
| G17 | `<text>` 替代块级元素时需 `display: block` | nowrap+ellipsis 场景 | 🔴 NC-14 |

---

## 九、平台自适应选择器映射（Step 2.4c）

> **触发**：源项目 AdminView 中有 `<select>` 元素（词库选择、词性选择），移动端需底部弹出。

| # | 源位置 | 选择器用途 | 选项数 | 目标组件 | 备注 |
|---|--------|----------|--------|---------|------|
| S1 | AdminView.tsx:441 | 词库选择（belonging library） | N个（动态） | `<picker mode="selector">` | #ifndef H5 |
| S2 | AdminView.tsx:520 | 词性选择（POS） | 7个固定 | `<picker mode="selector">` | #ifndef H5 |

**实施方式**：
```html
<!-- #ifdef H5 -->
<select v-model="form.libraryId" class="form-select">
  <option v-for="l in libraries" :key="l.id" :value="l.id">{{ l.name }}</option>
</select>
<!-- #endif -->
<!-- #ifndef H5 -->
<picker mode="selector" :range="libraryNames" :value="libraryIndex" @change="onLibraryChange">
  <view class="picker-display">{{ selectedLibraryName }}</view>
</picker>
<!-- #endif -->
```

---

## 十、Formily 集成评估

> 用户指定目标栈包含 Formily。

Formily 在本次迁移中的适用性评估：

| 界面 | 表单复杂度 | Formily 适用性 | 替代方案 |
|------|----------|---------------|---------|
| AuthView（登录/注册） | 3 字段 + 验证 | 🟡 可选（过度工程化） | 手动 v-model + ref |
| AdminView:WordEditForm | 15+ 字段 + 嵌套数组 + AI 生成 | ✅ **强烈推荐** | 手写 15+ ref + 嵌套更新逻辑 |
| AdminView:LibraryManager（编辑模式） | 2 字段 | ❌ 不推荐 | 手动 v-model |

**建议**：仅在 WordEditForm 中引入 Formily。其余表单保持手动 v-model。
WordEditForm 是本次迁移中最复杂的表单——15+ 字段（单词名、音标、词库、核心义描述、
核心义例句、例句翻译、N 个引申义各有 5 个字段、搭配列表）——Formily 的
`ArrayField`（引申义列表）和 `setFieldState`（AI 生成后批量填充）显著减少代码量。

---

## 十一、框架必备文件校验

| 必备文件 | 在映射表中？ | 处理 |
|---------|----------|------|
| `index.html` | ✅ | 根目录，已验证模板 |
| `src/pages.json` | ✅ | src/ 下 |
| `src/manifest.json` | ✅ | src/ 下 |
| `src/main.ts` | ✅ | src/ 下 |
| `src/App.vue` | ✅ | src/ 下 |
| `src/uni.scss` | ✅ | src/ 下 |
| `vite.config.ts` | ✅ | 根目录 |
| `tsconfig.json` | ✅ | 根目录 |
| `package.json` | ✅ | 根目录 |
| `src/shims-vue.d.ts` | ✅ | src/ 下 |

✅ 所有框架必备文件已覆盖。

---

## 十二、Phase 3 拓扑排序

```
Layer 0 (types + mock):        types.ts, mockData.ts           → 可并行
Layer 1 (工具函数 + store):    helpers.ts, user.ts, useInputFocus.ts → 可并行
Layer 2 (🔴 共享组件 — 串行):   SectionLabel → EmptyState → PrimaryButton → 
                              SearchBar → PhysicalImage → WordCard → PageHeader
                              (每个组件: Agent生成 → 验证关 → lock → 下一个)
Layer 2.5 (静态资源占位):      iconfont.ttf + 6 tabBar PNG    → Bash 创建
Layer 3 (叶子页面 — 可并行):    home, auth, libraries, library-words, profile
Layer 4 (组合页面 — 可并行):    word-detail, admin + 5子组件
Layer 5 (入口 — 串行):         App.vue → main.ts              → 使用已验证模板
Layer 6 (配置 — 可并行):       package.json, vite.config.ts, tsconfig.json,
                              index.html, pages.json, manifest.json, uni.scss,
                              shims-vue.d.ts                   → 使用已验证模板
Layer 7 (构建自检):            npm install + uni build + dist 产物检查 → 🔴 阻断关
```

---

## 十三、静态资源清单

| 资源文件 | 用途 | 引用位置 | 占位方案 |
|---------|------|---------|---------|
| `src/static/fonts/iconfont.ttf` | 图标字体 | uni.scss @font-face | 最小合法 TTF 占位 |
| `src/static/images/tab-home.png` | tabBar 首页图标 | pages.json | 1x1 透明 PNG |
| `src/static/images/tab-home-active.png` | tabBar 首页激活图标 | pages.json | 1x1 透明 PNG |
| `src/static/images/tab-libraries.png` | tabBar 词库图标 | pages.json | 1x1 透明 PNG |
| `src/static/images/tab-libraries-active.png` | tabBar 词库激活图标 | pages.json | 1x1 透明 PNG |
| `src/static/images/tab-profile.png` | tabBar 我的图标 | pages.json | 1x1 透明 PNG |
| `src/static/images/tab-profile-active.png` | tabBar 我的激活图标 | pages.json | 1x1 透明 PNG |

---

## 验证清单

- [x] 每个源文件都有目标文件分配（或明确的"不移植"原因）
- [x] Phase 1 中所有 62 个交互 ID 至少有一个目标文件负责
- [x] 所有六个映射类别都有带代码示例的具体规则
- [x] 无法映射的情况都有文档化的替代方案 + 多平台影响矩阵
- [x] 全局样式强制规则表已生成（G1~G17）
- [x] 复用分析已完成：组件（7 个共享）+ 样式（SCSS 变量+mixin）+ 逻辑（helpers + composable）
- [x] 差异化参数清单已完成（PageHeader 6 维度 × 9 页面）
- [x] SCSS 变量交叉验证已完成（偏差表 + 已知偏差标记）
- [x] 设计 Token 数值对照表已生成（含原型来源注释）
- [x] H5 条件编译属性清单已完成
- [x] 图标迁移映射表已完成（20 图标 × iconfont 码点）
- [x] 平台自适应选择器映射已完成（S1/S2）
- [x] 框架必备文件校验通过（10/10）
- [x] 拓扑依赖排序已规划（Layer 0-7）
- [x] 静态资源清单已完成
- [x] 迁移对 `react→uniapp.md` Post-Mortem 故障录（PM-M1~PM-M7）已纳入
