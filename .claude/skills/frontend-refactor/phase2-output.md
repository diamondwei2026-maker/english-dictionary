# Phase 2 — 迁移映射蓝图

## 组件模型映射规则

| 源模式 (React) | 目标模式 (uni-app Vue 3) |
|---------------|------------------------|
| `<div>` | `<view>` |
| `<span>` | `<text>` |
| `<p>`, `<h1>`-`<h4>` | `<text>` (小程序不支持语义标签) |
| `<img>` | `<image>` |
| `<input>` | `<input>` (uni-app input 组件) |
| `<input type="password">` | `<input type="password">` — 小程序中 type="password" 支持 |
| `<input type="tel">` | `<input type="number">` — 小程序中 tel 支持不同 |
| `<textarea>` | `<textarea>` |
| `<button>` | `<button>` (非原生 tabBar 场景) 或 `<view>` (自定义样式) |
| `<select>` | `<picker>` + `<picker-view>` — 小程序无原生 select |
| `onClick` | `@tap` 或 `@click` (H5 保留 click，小程序用 tap) |
| `onChange` (input) | `@input` (`e.detail.value`) |
| `onFocus` / `onBlur` | `@focus` / `@blur` (H5 保留，小程序有限支持) |
| `onKeyDown` (Enter) | `@confirm` (input 的确认事件) |
| `onSubmit` | `@submit` (form 组件) |
| `React.Fragment` / `<>` | `<template>` v-if/v-for 或 `<block>` |
| `useState(x)` | `ref(x)` (Composition API) |
| `useState()` for toggle | `ref(false)` |
| `useEffect(fn, [])` | `onMounted(fn)` |
| `useEffect(fn, [dep])` | `watch(dep, fn, { immediate: true })` — 注意清理 |
| `setTimeout` | 相同 (`setTimeout`) |
| `window.confirm()` | `uni.showModal({ title, content })` |
| `style={{...}}` | 对象 `:style="{...}"` 或 SCSS class |
| `className` | `class` (conditionally: `:class`) |
| `e.target.value` | `e.detail.value` (uni-app input/textarea) |
| `e.target.style.xxx` | 无直接等价 — 使用 `:class` 绑定 + 数据驱动 |
| `Date.now()` | `Date.now()` — uni-app 支持 |
| `Math.random()` | `Math.random()` — uni-app 支持 |

---

## 事件系统映射规则

| 源模式 | 目标模式 |
|--------|---------|
| `onClick={() => navigate({name:'wordDetail', wordId: w.id})}` | `@tap="() => goToWordDetail(w.id)"` → 调用 `uni.navigateTo` |
| `onChange={e => setQuery(e.target.value)}` | `@input="e => query = e.detail.value"` |
| `onFocus={e => { e.target.style.borderColor = '#2563EB' }}` | `@focus="inputFocused = true"` + `:class="{ 'input-focused': inputFocused }"` |
| `onBlur={e => { e.target.style.borderColor = 'transparent' }}` | `@blur="inputFocused = false"` + `:class` |
| `onKeyDown={e => e.key==='Enter' && handleSubmit()}` | `@confirm="handleSubmit"` (input 的 confirm 事件) |
| `onClick={handleLogout}` | `@tap="handleLogout"` |
| `e.stopPropagation()` | `@tap.stop` (Vue 事件修饰符) |
| `setTimeout(() => {...}, 800)` | `setTimeout(() => {...}, 800)` — 相同 |

### 事件修饰符映射

| React 方式 | Vue/uni-app 方式 |
|-----------|-----------------|
| `e.stopPropagation()` | `@tap.stop="handler"` |
| `e.preventDefault()` | `@tap.prevent="handler"` (H5 only) |
| 密码可见切换 icon | `@tap="showPassword = !showPassword"` |

---

## 样式系统映射规则

### 核心策略：内联 style 对象 → SCSS (scoped) + 全局 CSS 类

源项目使用 100% 内联 `style={{...}}` 对象（React inline styles），无 CSS Modules。
目标项目方案：

```
内联 style        → 提取为 SCSS scoped 样式 + :style 仅用于动态值
页面级 card 样式   → 提取为全局 CSS 类 (.card) 或 SCSS mixin
全局常量样式      → uni.scss 变量 + App.vue 全局样式
动态 style        → :style 绑定 + CSS 变量
```

### 单位换算规则

```
1px (源设计稿) → 2rpx (750rpx 设计稿基准)
例: 24px → 48rpx, 16px → 32rpx, 52px → 104rpx
```

### 样式映射

| 源模式 | 目标模式 |
|--------|---------|
| `style={{padding:'16px 24px',background:'#fff',borderRadius:'16px'}}` | SCSS: `.card { padding: 32rpx 48rpx; background: #fff; border-radius: 32rpx; }` |
| `style={{flexDirection:'column', gap:'10px'}}` | SCSS: `display: flex; flex-direction: column; gap: 20rpx;` |
| `backdropFilter: 'blur(16px)'` | `/* #ifdef H5 */ backdrop-filter: blur(32rpx); -webkit-backdrop-filter: blur(32rpx); /* #endif */` |
| `position: 'fixed'` | H5: fixed 可用；小程序：非 tabBar 的 fixed 元素需 `<view>` 部分支持 |
| `position: 'sticky'` | H5: `position: sticky` 可用；小程序：改用 `page-meta` 或替换方案 |
| `::placeholder` | `::-webkit-input-placeholder` (H5) + 小程序用 placeholder-style 属性 |
| `transition: '0.2s'` | `transition: 0.2s ease` (H5 with `/* #ifdef H5 */`) |
| `cursor: 'pointer'` | `/* #ifdef H5 */ cursor: pointer; /* #endif */` |
| `userSelect: 'none'` | H5 only `/* #ifdef H5 */ user-select: none; /* #endif */` |
| `overflow: 'hidden'` | H5: `overflow: hidden`；小程序：使用 `scroll-view` 组件 |
| `boxShadow: '0 2px 12px ...'` | 同值，换算单位：`box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.04)` |
| `fontFamily: 'Inter, system-ui...'` | `font-family: system-ui, -apple-system, 'Inter', sans-serif` |
| `textTransform: 'uppercase'` | 保留 |
| `letterSpacing: '2px'` | 换算：`letter-spacing: 4rpx` |
| `opacity: 0.7` | 相同 `opacity: 0.7` |
| `textOverflow: 'ellipsis'` | `text-overflow: ellipsis` + `white-space: nowrap` + `overflow: hidden` |
| `whiteSpace: 'nowrap'` | `white-space: nowrap` |

### SCSS 变量定义（写入 uni.scss）

```scss
// 颜色
$primary: #2563EB;
$primary-dark: #1D4ED8;
$primary-light: #3B82F6;
$primary-bg: #EFF6FF;
$primary-border: #BFDBFE;
$bg-page: #F7F9FC;
$bg-card: #FFFFFF;
$bg-input: #F1F5F9;
$bg-code: #F8FAFC;
$text-primary: #111827;
$text-secondary: #6B7280;
$text-tertiary: #9CA3AF;
$text-dark: #374151;
$error: #DC2626;
$error-bg: #FEF2F2;
$success: #16A34A;
$success-bg: #F0FDF4;
$warning: #D97706;
$warning-bg: #FFFBEB;
$purple: #7C3AED;
$purple-bg: #FAF5FF;
$purple-dark: #4C1D95;

// 间距 (rpx)
$page-pt: 104rpx;
$page-px: 48rpx;
$page-pb: 80rpx;
$header-pb: 32rpx;
$card-p-lg: 48rpx;
$card-p-md: 40rpx;
$card-p-sm: 32rpx;
$input-p: 28rpx 32rpx;
$gap-xs: 8rpx;
$gap-sm: 16rpx;
$gap-md: 24rpx;
$gap-lg: 32rpx;
$gap-xl: 48rpx;
$section-gap: 40rpx;
$bottom-nav-h: 120rpx;
$bottom-padding: 160rpx;

// 圆角 (rpx)
$radius-xs: 12rpx;
$radius-sm: 16rpx;
$radius-md: 24rpx;
$radius-lg: 32rpx;
$radius-xl: 40rpx;
$radius-2xl: 48rpx;
$radius-full: 9999rpx;

// 字号 (rpx)
$font-hero: 84rpx;
$font-h1: 52rpx;
$font-h2: 44rpx;
$font-h3: 34rpx;
$font-today-word: 68rpx;
$font-body-lg: 32rpx;
$font-body: 28rpx;
$font-caption: 24rpx;
$font-label: 22rpx;
$font-stat: 60rpx;

// 字重
$weight-hero: 800;
$weight-bold: 700;
$weight-semibold: 600;
$weight-medium: 500;
$weight-normal: 400;

// 阴影
$shadow-card: 0 4rpx 24rpx rgba(0,0,0,0.04);
$shadow-card-md: 0 4rpx 32rpx rgba(0,0,0,0.05);
$shadow-card-lg: 0 4rpx 40rpx rgba(0,0,0,0.05);
$shadow-hero: 0 16rpx 64rpx rgba(37,99,235,0.25);
$shadow-admin: 0 16rpx 64rpx rgba(124,58,237,0.25);
$shadow-tab: 0 2rpx 8rpx rgba(0,0,0,0.08);
$shadow-image: 0 8rpx 48rpx rgba(0,0,0,0.07);

// 渐变
$gradient-primary: linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%);
$gradient-admin: linear-gradient(135deg, #4C1D95, #7C3AED);

// 字体系列
$font-family-base: system-ui, -apple-system, 'Inter', sans-serif;
```

---

## 路由与导航映射规则

源项目使用 `useState<ViewState>` 手动路由。目标项目使用 `uni.navigateTo` + `uni.switchTab` + `pages.json` 配置。

### 路由表映射

| 源 ViewState | 目标路由 | 导航方式 | 参数 |
|-------------|---------|---------|------|
| `{name:'home'}` | `/pages/home/index` | `uni.switchTab` | 无 |
| `{name:'wordDetail', wordId}` | `/pages/word-detail/index` | `uni.navigateTo` | `?id=<wordId>` |
| `{name:'libraries'}` | `/pages/libraries/index` | `uni.switchTab` | 无 |
| `{name:'libraryWords', libraryId}` | `/pages/library-words/index` | `uni.navigateTo` | `?id=<libraryId>` |
| `{name:'profile'}` | `/pages/profile/index` | `uni.switchTab` | 无 |
| `{name:'login'}` | `/pages/auth/index` | `uni.navigateTo` | `?mode=login` |
| `{name:'register'}` | `/pages/auth/index` | `uni.navigateTo` | `?mode=register` |
| `{name:'admin', tab}` | `/pages/admin/index` | `uni.navigateTo` | `?tab=overview` |
| `{name:'adminWordEdit', ...}` | AdminView 内部状态管理（不变） | 局部状态 | — |

### pages.json tabBar 配置

```json
{
  "tabBar": {
    "color": "#9CA3AF",
    "selectedColor": "#2563EB",
    "backgroundColor": "#FFFFFF",
    "borderStyle": "white",
    "list": [
      { "pagePath": "pages/home/index", "text": "搜索" },
      { "pagePath": "pages/libraries/index", "text": "词库" },
      { "pagePath": "pages/profile/index", "text": "我的" }
    ]
  }
}
```

### 页面 style 配置

所有页面使用 `navigationStyle: "custom"` 自定义导航栏（因为源项目所有页面都有自定义 header）。

---

## 状态管理映射规则

| 源模式 | 目标模式 |
|--------|---------|
| `const [view, setView] = useState<ViewState>({name:'home'})` | 路由由 `uni.navigateTo`/`uni.switchTab` 管理（不再需要 view state） |
| `const [user, setUser] = useState<AuthUser \| null>(null)` | `const user = ref<AuthUser \| null>(null)` 放在 App.vue 或全局 store |
| `const [query, setQuery] = useState('')` | `const query = ref('')` (组件内局部) |
| `const [tab, setTab] = useState<'login' \| 'register'>(mode)` | `const tab = ref<'login' \| 'register'>(props.mode)` |
| `const [error, setError] = useState('')` | `const error = ref('')` |
| `const [loading, setLoading] = useState(false)` | `const loading = ref(false)` |
| props 传入的 `navigate` callback | 直接调用 `uni.navigateTo` 或 `emit` 事件 |
| `handleLogin = (u) => { setUser(u); ... }` | `const handleLogin = (u: AuthUser) => { user.value = u; ... }` |
| `genId()` | 相同实现：`Math.random().toString(36).slice(2, 10)` |

### 全局状态共享方案

由于每个页面是独立的路由页面，user 状态需要跨页面共享：

**方案**：使用 `reactive` store 模式（或 Pinia）

```
src/store/user.ts:
  export const userStore = reactive({ user: null as AuthUser | null })
  export function useUser() { return userStore }

各页面中：
  import { useUser } from '@/store/user'
  const { user } = useUser()
  // 或: const user = computed(() => useUser().user)
```

---

## 数据获取映射规则

源项目全部使用静态 mock 数据导入，无 API 调用。目标项目保持一致：

```
import { mockWords } from '../data/mockData'
→
import { mockWords } from '@/data/mockData'
```

AdminView 中对 mock 数据的 CRUD 操作使用组件局部状态（`ref([])`），与源项目模式一致。

---

## 逐文件映射表

| # | 源文件 | 目标文件 | 难度 | 关键说明 |
|---|--------|---------|------|---------|
| 1 | `src/main.tsx` | `src/main.ts` | 🟢 低 | `createApp` 替代 `createRoot` |
| 2 | `src/app/App.tsx` | `src/App.vue` | 🔴 关键 | 拆分为路由；user 状态提升到全局 store；移除 view 状态机 |
| 3 | `src/app/data/types.ts` | `src/data/types.ts` | 🟢 低 | 直接移植；移除 React 特有类型引用 |
| 4 | `src/app/data/mockData.ts` | `src/data/mockData.ts` | 🟢 低 | 直接移植 |
| 5 | `src/app/components/BottomNav.tsx` | (移除) | — | **不移植** — 由 uni-app 原生 tabBar 替代 |
| 6 | `src/app/components/HomeView.tsx` | `src/pages/home/index.vue` | 🟡 中 | 搜索 + 列表 + 每日一词；条件渲染较多 |
| 7 | `src/app/components/WordDetailView.tsx` | `src/pages/word-detail/index.vue` | 🔴 高 | 复杂布局 + SVG 物理意象图 + 多个卡片区 |
| 8 | `src/app/components/LibrariesView.tsx` | `src/pages/libraries/index.vue` | 🟡 中 | 词库卡片列表（仅 LibrariesView） |
| 9 | `src/app/components/LibrariesView.tsx` (LibraryWordsView) | `src/pages/library-words/index.vue` | 🟡 中 | 词库内单词列表（拆分自 LibrariesView） |
| 10 | `src/app/components/ProfileView.tsx` | `src/pages/profile/index.vue` | 🟡 中 | 未登录/已登录两种模式 + 管理入口 |
| 11 | `src/app/components/AuthView.tsx` | `src/pages/auth/index.vue` | 🟡 中 | 登录/注册切换 + 表单验证 + 演示提示 |
| 12 | `src/app/components/AdminView.tsx` | `src/pages/admin/index.vue` | 🔴 高 | 最复杂组件；概览 + 词库 CRUD + 单词 CRUD + 用户列表 |
| 13 | `src/app/components/PhysicalImage.tsx` | `src/components/PhysicalImage.vue` | 🔴 高 | SVG → 小程序可用方案（图片组件 或 Canvas 或 CSS 绘制） |
| 14 | `src/app/components/figma/ImageWithFallback.tsx` | `src/components/ImageWithFallback.vue` | 🟢 低 | 简单图片回退逻辑 |
| 15 | `src/styles/fonts.css` | `src/App.vue` (style 部分) | 🟢 低 | Inter 字体用 system-ui 回退 |
| — | (新增) | `src/components/PageHeader.vue` | 🟡 中 | 🔵 **复用提取** — 出现在 7 个页面中 |
| — | (新增) | `src/components/EmptyState.vue` | 🟢 低 | 🔵 **复用提取** — 出现在 4 个位置 |
| — | (新增) | `src/components/SearchBar.vue` | 🟢 低 | 🔵 **复用提取** — 出现在 3 个位置 |
| — | (新增) | `src/components/WordListItem.vue` | 🟢 低 | 🔵 **复用提取** — 出现在 3 个页面 |
| — | (新增) | `src/store/user.ts` | 🟢 低 | 🔵 **逻辑复用** — 全局用户状态管理 |
| — | (新增) | `src/utils/helpers.ts` | 🟢 低 | 🔵 **逻辑复用** — 工具函数 |
| 16 | `src/styles/index.css` | `src/App.vue` (统一全局样式) | 🟢 低 | 全局样式合并 |
| — | (框架要求) | `src/pages.json` | 🟢 低 | **[REQUIRED]** uni-app 页面配置 |
| — | (框架要求) | `src/manifest.json` | 🟢 低 | **[REQUIRED]** uni-app 应用配置 |
| — | (框架要求) | `src/uni.scss` | 🟡 中 | **[REQUIRED]** 全局 SCSS 变量 |
| — | (框架要求) | `src/App.vue` (onLaunch 等) | 🟢 低 | **[REQUIRED]** 入口 App 组件 |
| — | (框架要求) | `index.html` | 🟢 低 | **[REQUIRED]** uni-app H5 入口 |
| — | (框架要求) | `package.json` | 🟢 低 | **[REQUIRED]** 项目配置 |
| — | (框架要求) | `vite.config.ts` | 🟢 低 | **[REQUIRED]** Vite 构建配置 |
| — | (框架要求) | `tsconfig.json` | 🟢 低 | **[REQUIRED]** TypeScript 配置 |

### 不移植的文件

| 源文件 | 原因 |
|--------|------|
| `vite.config.ts` | 由 uni-app Vite 配置替代 |
| `postcss.config.mjs` | uni-app 内置 PostCSS 配置 |
| `pnpm-workspace.yaml` | 由 uni-app pnpm 配置替代 |
| `tailwind.css`, `theme.css`, `globals.css` | Tailwind 不再使用，由 SCSS 替代 |
| `default_shadcn_theme.css` | 不再使用 |
| `src/app/components/ui/*.tsx` (50+ 文件) | shadcn/ui 封装组件；目标项目不再使用 Radix UI |
| `BottomNav.tsx` | 由 uni-app 原生 tabBar 替代 |
| `guidelines/Guidelines.md`, `ATTRIBUTIONS.md` | 非代码文件 |

---

## 不可移植的特性 × 多平台影响矩阵

### D1：移除页面级 maxWidth 限制

| 评估维度 | H5（桌面端） | H5（移动端） | 微信小程序 |
|---------|-----------|-----------|-----------|
| 视觉影响 | 🔴 严重：宽屏上 1920px 拉伸 | 🟢 无影响 | 🟢 无影响 |
| 交互影响 | 🔴 严重：搜索框过度拉伸 | 🟢 无影响 | 🟢 无影响 |
| 用户预期 | 🔴 桌面端预期中央窄栏 | 🟢 移动端预期全屏 | 🟢 移动端预期全屏 |
| 判定 | 🔴 不可接受 | 🟢 可接受 | 🟢 可接受 |

**决策修正**：H5 条件编译保留 `max-width: 860rpx; margin: 0 auto`

### D2：用原生 tabBar 替代 BottomNav 组件

| 评估维度 | H5 | 微信小程序 |
|---------|----|----------|
| 视觉一致性 | 🟡 H5 tabBar 视觉接近 | 🟢 原生 tabBar 体验完美 |
| blur 效果 | 🟡 原生 tabBar 无 blur | 🟡 原生 tabBar 无 blur |
| 判定 | 🟡 可接受 | 🟢 可接受 |

### D3：header backdrop-filter blur 替换

| 评估维度 | H5 | 微信小程序 |
|---------|----|----------|
| 视觉影响 | 🔴 可保留 blur | 🟡 小程序不支持，纯色背景替代 |
| 判定 | 🔴 H5 条件编译保留 | 🟡 可接受 |

**决策修正**：`/* #ifdef H5 */ backdrop-filter: blur(32rpx); /* #endif */`

### D4：移除 :hover/:focus 伪类样式

| 评估维度 | H5（桌面端） | H5（移动端） | 微信小程序 |
|---------|-----------|-----------|-----------|
| 视觉影响 | 🔴 桌面端失去交互反馈 | 🟢 移动端 hover 不可用 | 🟢 小程序无此概念 |
| 判定 | 🔴 严重 | 🟢 可接受 | 🟢 可接受 |

**决策修正**：H5 条件编译保留 `:hover` 和 `:focus` 伪类，小程序端用 `@tap` + class 切换替代 focus 样式。

### D5：SVG 内联物理意象图

| 评估维度 | H5 | 微信小程序 |
|---------|----|----------|
| 视觉影响 | 🟢 SVG 可正常渲染 | 🔴 小程序不支持内联 SVG |
| 判定 | 🟢 可保留 | 🔴 不可接受 |

**替代方案**：
- H5：保留内联 SVG
- 小程序：将每个 SVG 导出为 PNG 图片，用 `<image>` 组件加载
- 或：小程序端用 Canvas 重绘简单图形

### D6：position: sticky header

| 评估维度 | H5 | 微信小程序 |
|---------|----|----------|
| 视觉影响 | 🟢 sticky 正常 | 🟡 sticky 支持有限 |
| 判定 | 🟢 可保留 | 🟡 使用 page-meta 或固定定位替代 |

### D7：select 下拉框

| 评估维度 | H5 | 微信小程序 |
|---------|----|----------|
| 视觉影响 | 🟢 select 正常 | 🔴 小程序无 select |
| 判定 | 🟢 可保留 | 🔴 不可接受 |

**替代方案**：H5 保留 `<select>`；小程序端使用 `<picker>` 组件

### H5 条件编译属性汇总清单

基于上述决策矩阵，以下属性必须在 H5 平台条件编译保留：

| 属性 | 语法 | 影响决策 |
|------|------|---------|
| `max-width` + `margin: 0 auto` | `/* #ifdef H5 */` | D1 |
| `backdrop-filter` + `-webkit-backdrop-filter` | `/* #ifdef H5 */` | D3 |
| `:hover` / `:focus` 伪类 | `/* #ifdef H5 */` | D4 |
| `position: sticky` | H5 保留，小程序用替代方案 | D6 |
| `cursor: pointer` | `/* #ifdef H5 */` | — |
| 内联 SVG | `/* #ifdef H5 */` | D5 |
| `<select>` 元素 | `/* #ifdef H5 */` | D7 |

---

## 全局样式强制规则（注入 Phase 3 每个页面 Agent）

| 规则 ID | 描述 | 实施方式 | 适用文件 |
|---------|------|---------|---------|
| G1 | 吸顶 header 必须有 H5 条件编译的 backdrop-filter | `/* #ifdef H5 */ backdrop-filter: blur(32rpx); -webkit-backdrop-filter: blur(32rpx); /* #endif */` | 所有有 .header 类的页面组件 |
| G2 | 吸顶 header 背景必须是半透明色 | `background: rgba(247,249,252,0.92)` (WordDetail/Admin) 或 `rgba(255,255,255,0.9)` (Home/Libraries/Profile) | 所有有 header 的页面组件 |
| G3 | 页面顶部 padding 必须包含安全区 | `padding-top: 104rpx` (52px × 2) | 所有页面组件 |
| G4 | 有条件渲染的 header 不得丢失背景 | 未登录/空数据等状态如果 header 仍显示，不能因条件分支丢失背景 | Profile 等有条件渲染的页面 |
| G5 | 全局字体必须在 App.vue 中设置 | `font-family: $font-family-base` | App.vue |
| G6 | 全局 box-sizing 必须显式声明 | `*, *::before, *::after { box-sizing: border-box; }` | App.vue |
| G7 | 全局 line-height 必须显式声明 | `body, page { line-height: 1.5; }` | App.vue |
| G8 | 所有 input/textarea 必须显式声明 outline、border、background | `outline: none; border: 3rpx solid transparent; background: #F1F5F9` | 所有含 input/textarea 的页面 |
| G9 | 按钮必须显式声明所有样式 | 不能依赖平台默认外观，必须全量声明 padding/border/background/radius/color | 所有含 button 的页面 |
| G10 | H5 专属 cursor:pointer | `/* #ifdef H5 */ cursor: pointer; /* #endif */` | 所有可点击元素 |
| G11 | 文本截断必须显式三件套 | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` | 所有需要截断的文本 |
| G12 | maxWidth 容器 | H5: `/* #ifdef H5 */ max-width: 860rpx; margin: 0 auto; /* #endif */` | App.vue 根容器 |

---

## 组件复用分析

### 复用模式识别

| 复用模式 | 出现次数 | 出现位置 | 差异 | 建议 |
|---------|---------|---------|------|------|
| 页头（标题区 + blur 背景 + 可选的返回按钮/右侧操作） | 7/7 | home, libraries, profile, word-detail, library-words, auth, admin | 标题、返回按钮、右侧操作不同 | 🟢 提取为 `<PageHeader>` |
| 空状态（图标 + 标题 + 可选副标题） | 4 | home, libraries, library-words, admin | 图标、文案不同 | 🟢 提取为 `<EmptyState>` |
| 搜索栏（搜索图标 + 输入框 + focus 边框切换） | 3 | home, admin/单词, admin/用户 | placeholder 不同 | 🟡 提取为 `<SearchBar>` |
| 单词列表项（单词名 + 音标 + 含义 + 箭头） | 3 | home(全部词汇), home(搜索结果), library-words | 是否显示词库标签 | 🟡 提取为 `<WordListItem>` |
| focus/blur 边框切换 | 6+ | 所有 input | 完全相同的逻辑 | 🟢 提取为 composable `useInputFocus` |

### 差异化参数清单 — PageHeader

| 属性维度 | home | libraries | profile(已登录) | profile(未登录) | word-detail | library-words | auth | admin |
|---------|------|----------|---------------|---------------|------------|--------------|------|-------|
| 背景色 | rgba(255,255,255,0.9) | rgba(255,255,255,0.9) | rgba(255,255,255,0.9) | — | rgba(247,249,252,0.92) | rgba(255,255,255,0.9) | transparent | rgba(247,249,252,0.94) |
| 返回按钮 | 无 | 无 | 无 | 无 | 有(← 返回) | 有(← 词库列表) | 有(← 返回) | 有(← 返回) |
| 标题 | "主页" | "词库" | "个人中心" | "个人中心" | 动态 | 动态 | "登录/注册" | "管理后台" |
| 副标题 | "认知英语词典" | — | "我的" | "我的" | — | — | — | — |
| 右侧操作 | 无 | 无 | 无 | 无 | 词库标签 | 无 | 无 | 新增按钮/动态 |

**PageHeader Props 接口**：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| title | string | — | 必填：页面标题 |
| subtitle | string | '' | 可选副标题 |
| showBack | boolean | false | 是否显示返回按钮 |
| backLabel | string | '返回' | 返回按钮文字 |
| rightSlot | VNode | null | 右侧操作区（slot） |
| backgroundColor | string | 'rgba(255,255,255,0.9)' | 背景色（多数实例用白色毛玻璃） |
| sticky | boolean | true | 是否吸顶 |

### 差异化参数清单 — WordListItem

| 属性维度 | home(全部词汇) | home(搜索结果) | library-words |
|---------|-------------|-------------|-------------|
| 卡片样式 | 阴影 0 2px 12px | 阴影 0 2px 16px | 阴影 0 2px 12px |
| 是否显示词库标签 | 是 | 否 | 否 |
| 含义截断长度 | 整行 | 36字符 | 40字符 |

**WordListItem Props 接口**：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| word | Word | — | 必填：单词数据 |
| showLibraryTag | boolean | true | 是否显示所属词库标签 |
| meaningTruncate | number | 0 | 含义截断字符数（0=不截断） |
| elevated | boolean | false | 是否使用更高阴影 |

---

## 样式复用分析

| 复用模式 | 出现次数 | 值 | 建议 |
|---------|---------|---|------|
| section 标签 | 8+ | `font-size: 22rpx; font-weight: 600; color: #9CA3AF; letter-spacing: 4rpx; text-transform: uppercase` | 全局 CSS 类 `.section-label` |
| 主按钮 | 8+ | `background: #2563EB; color: #fff; border-radius: 32rpx; font-weight: 700` | 全局 CSS 类 `.btn-primary` |
| 幽灵按钮 | 3+ | `background: #fff; color: #2563EB; border: 3rpx solid #BFDBFE` | 全局 CSS 类 `.btn-ghost` |
| 危险按钮 | 2+ | `background: #FEF2F2; color: #DC2626` | 全局 CSS 类 `.btn-danger` |
| 卡片容器 | 10+ | `background: #fff; border-radius: 40rpx; box-shadow: $shadow-card-md` | SCSS mixin `@mixin card` |
| sticky header | 5+ | `position: sticky; top: 0; z-index: 10` | SCSS mixin `@mixin sticky-header` |
| 输入框 focus 样式 | 6+ | `border-color: #2563EB; background: #fff` | CSS 类 `.input-focused` |
| 返回按钮 | 4 | 箭头 + 文字 | 合并到 PageHeader 组件 |

### 全局 CSS 类（App.vue 非 scoped）

```css
.section-label {
  font-size: 22rpx;
  font-weight: 600;
  color: #9CA3AF;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  margin: 0 0 24rpx;
}

.btn-primary {
  width: 100%;
  padding: 32rpx;
  background: #2563EB;
  color: #fff;
  border: none;
  border-radius: 32rpx;
  font-size: 32rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary[disabled] {
  background: #93C5FD;
}

.btn-ghost {
  width: 100%;
  padding: 32rpx;
  background: #fff;
  color: #2563EB;
  border: 3rpx solid #BFDBFE;
  border-radius: 32rpx;
  font-size: 32rpx;
  font-weight: 700;
}

.btn-danger {
  width: 100%;
  padding: 32rpx;
  background: #FEF2F2;
  color: #DC2626;
  border: none;
  border-radius: 32rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.input-focused {
  border-color: #2563EB !important;
  background: #fff !important;
}
```

### SCSS Mixins（uni.scss）

```scss
@mixin card {
  background: #fff;
  border-radius: 40rpx;
  box-shadow: $shadow-card-md;
}

@mixin sticky-header {
  position: sticky;
  top: 0;
  z-index: 10;
}

@mixin text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

---

## 逻辑复用分析

| 复用模式 | 出现次数 | 建议 |
|---------|---------|------|
| `mockWords.find(w => w.id === wordId)` | 3 | 提取为 `getWordById(id)` |
| `mockLibraries.find(l => l.id === libraryId)` | 4 | 提取为 `getLibraryById(id)` |
| `words.filter(w => w.word.includes(q) \|\| w.coreMeaning.includes(q))` | 3 | 提取为 `filterWords(words, query)` |
| POS_COLORS 映射 | 2 | 提取为 `getPosColor(pos)` |
| focus/blur 边框切换 | 6+ | 提取为 composable `useInputFocus()` |
| `genId()` | 1 (AdminView) | 提取为 `generateId()` |
| `isValidPhone()` | 1 (AuthView) | 提取为 `validatePhone(phone)` |

### 新增工具文件：src/utils/helpers.ts

```typescript
import type { Word, WordLibrary } from '@/data/types'

export function getWordById(words: Word[], id: string): Word | undefined {
  return words.find(w => w.id === id)
}

export function getLibraryById(libraries: WordLibrary[], id: string): WordLibrary | undefined {
  return libraries.find(l => l.id === id)
}

export function filterWords(words: Word[], query: string): Word[] {
  const q = query.trim().toLowerCase()
  if (!q) return words
  return words.filter(w =>
    w.word.toLowerCase().includes(q) || w.coreMeaning.includes(query.trim())
  )
}

export function getPosColor(pos: string): { bg: string; text: string } {
  const map: Record<string, { bg: string; text: string }> = {
    'n.': { bg: '#EFF6FF', text: '#1D4ED8' },
    'v.': { bg: '#F0FDF4', text: '#166534' },
    'adj.': { bg: '#FFF7ED', text: '#C2410C' },
    'adv.': { bg: '#FAF5FF', text: '#7E22CE' },
    'v./n.': { bg: '#ECFDF5', text: '#065F46' },
    'adj./adv.': { bg: '#FFF1F2', text: '#9F1239' },
  }
  return map[pos] || { bg: '#F3F4F6', text: '#6B7280' }
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone.replace(/\s/g, ''))
}
```

### 新增 Composable：src/composables/useInputFocus.ts

```typescript
import { ref } from 'vue'

export function useInputFocus() {
  const focused = ref(false)
  const onFocus = () => { focused.value = true }
  const onBlur = () => { focused.value = false }
  return { focused, onFocus, onBlur }
}
```

---

## SCSS 变量 × 原型值交叉验证

将 Phase 1 的设计 Token 精确值与 Phase 2 定义的 SCSS 变量进行逐项对比。

| SCSS 变量 | 定义值 (rpx) | 原型原始值 (px) | 原型换算值 (rpx) | 偏差 | 判定 |
|-----------|-------------|---------------|----------------|------|------|
| $page-pt | 104rpx | 52-56px | 104-112rpx | 当取 52px 时 0；当取 56px 时 -8rpx | 🟡 取中值 108rpx |
| $page-px | 48rpx | 24px | 48rpx | 0 | 🟢 |
| $page-pb | 80rpx | 40px | 80rpx | 0 | 🟢 |
| $header-pb | 32rpx | 16-20px | 32-40rpx | 当取 16px 时 0 | 🟢 |
| $card-p-lg | 48rpx | 24px | 48rpx | 0 | 🟢 |
| $card-p-md | 40rpx | 20px | 40rpx | 0 | 🟢 |
| $card-p-sm | 32rpx | 16-18px | 32-36rpx | 当取 18px 时 -4rpx | 🟡 偶有 18px 时需单独处理 |
| $input-p | 28rpx 32rpx | 14px 16px | 28rpx 32rpx | 0 | 🟢 |
| $gap-xs | 8rpx | 4-6px | 8-12rpx | 当取 6px 时 -4rpx | 🟡 |
| $gap-sm | 16rpx | 8-10px | 16-20rpx | 当取 10px 时 -4rpx | 🟡 |
| $gap-md | 24rpx | 12-14px | 24-28rpx | 当取 14px 时 -4rpx | 🟡 |
| $gap-lg | 32rpx | 16-20px | 32-40rpx | 当取 20px 时 -8rpx | 🟡 |
| $gap-xl | 48rpx | 24px | 48rpx | 0 | 🟢 |
| $radius-lg | 32rpx | 16px | 32rpx | 0 | 🟢 |
| $radius-xl | 40rpx | 20px | 40rpx | 0 | 🟢 |
| $radius-2xl | 48rpx | 24px | 48rpx | 0 | 🟢 |
| $font-hero | 84rpx | 42px | 84rpx | 0 | 🟢 |
| $font-h1 | 52rpx | 26px | 52rpx | 0 | 🟢 |
| $font-h2 | 44rpx | 22px | 44rpx | 0 | 🟢 |
| $font-h3 | 34rpx | 17-18px | 34-36rpx | 当取 18px 时 -2rpx | 🟢 |
| $font-today-word | 68rpx | 34px | 68rpx | 0 | 🟢 |
| $font-body-lg | 32rpx | 16px | 32rpx | 0 | 🟢 |
| $font-body | 28rpx | 14-15px | 28-30rpx | 当取 15px 时 -2rpx | 🟢 |
| $font-caption | 24rpx | 12-13px | 24-26rpx | 当取 13px 时 -2rpx | 🟢 |
| $font-label | 22rpx | 11px | 22rpx | 0 | 🟢 |
| $font-stat | 60rpx | 30px | 60rpx | 0 | 🟢 |
| $bottom-nav-h | 120rpx | 60px | 120rpx | 0 | 🟢 |
| $bottom-padding | 160rpx | 80px | 160rpx | 0 | 🟢 |

### 修正后的变量值

对偏差 > 2rpx 的变量进行修正，确保数值与原型对齐：

| 变量 | 原值 | 修正值 | 原因 |
|------|------|--------|------|
| $page-pt | 104rpx | **108rpx** | 54px（52-56px 中值）× 2 = 108rpx |
| $card-p-sm | 32rpx | 保持 32rpx | 多数实例用 16px，偶有 18px 时单独覆盖 |
| $gap-sm | 16rpx | 保持 16rpx | 多数实例用 8px，偶有 10px 时单独覆盖 |

---

## 图标迁移映射

采用 **uni-icons + iconfont 混合方案**：

| 源图标 (lucide-react) | 目标实现 | 代码片段 |
|----------------------|---------|---------|
| Search | uni-icons | `<uni-icons type="search" size="16" color="#9CA3AF"></uni-icons>` |
| ArrowRight | uni-icons | `<uni-icons type="arrowright" size="16" color="#D1D5DB"></uni-icons>` |
| ArrowLeft | uni-icons | `<uni-icons type="arrowleft" size="18" color="#6B7280"></uni-icons>` |
| Sparkles | iconfont | `<text class="iconfont">&#xe003;</text>` (颜色 #2563EB) |
| BookOpen | iconfont | `<text class="iconfont">&#xe004;</text>` |
| User | uni-icons | `<uni-icons type="person" size="24" color="#fff"></uni-icons>` |
| Eye | uni-icons | `<uni-icons type="eye" size="18" color="#9CA3AF"></uni-icons>` |
| EyeOff | iconfont | `<text class="iconfont">&#xe006;</text>` |
| Check | uni-icons | `<uni-icons type="checkmarkempty" size="15" color="#fff"></uni-icons>` |
| X / Close | uni-icons | `<uni-icons type="close" size="15" color="#DC2626"></uni-icons>` |
| Shield | iconfont | `<text class="iconfont">&#xe008;</text>` |
| LogOut | iconfont | `<text class="iconfont">&#xe009;</text>` |
| Settings | uni-icons | `<uni-icons type="gear" size="16" color="#6B7280"></uni-icons>` |
| Target | iconfont | `<text class="iconfont">&#xe00b;</text>` |
| Plus | uni-icons | `<uni-icons type="plus" size="16" color="#fff"></uni-icons>` |
| RefreshCw | uni-icons | `<uni-icons type="refresh" size="13" color="#374151"></uni-icons>` |
| Loader | CSS | `<view class="spinner"></view>` (CSS @keyframes spin) |
| Type | iconfont | `<text class="iconfont">&#xe00f;</text>` |
| Users | iconfont | `<text class="iconfont">&#xe010;</text>` |
| ChevronRight | uni-icons | `<uni-icons type="right" size="16" color="#D1D5DB"></uni-icons>` |

### 🔴 红线：禁止 emoji

> **绝对禁止使用任何 emoji 字符替代图标。** 包括但不限于：
> 🔍 ✨ 📖 👤 🛡 ⚙ 🎯 🚪 📭 ❌ ✅ ➕ 🔄 💡 ← →
> 图标必须使用上表中指定的方案实现。

---

## 框架必备文件校验

| 必备文件 | 在映射表中？ | 处理 |
|---------|----------|------|
| `index.html` | ❌ | ✅ 已追加 |
| `src/pages.json` | ❌ | ✅ 已追加 |
| `src/manifest.json` | ❌ | ✅ 已追加 |
| `src/main.ts` | ✅ #1 | — |
| `src/App.vue` | ✅ #2 | — |
| `src/uni.scss` | ❌ | ✅ 已追加 |
| `package.json` | ❌ | ✅ 已追加 |
| `vite.config.ts` | ❌ | ✅ 已追加 |
| `tsconfig.json` | ❌ | ✅ 已追加 |

**校验结果：7 个框架必备文件已追加，映射表完整覆盖所有框架要求。**

---

## 目标项目目录结构

```
uni-app-target/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── pages.json
│   ├── manifest.json
│   ├── uni.scss
│   ├── data/
│   │   ├── types.ts
│   │   └── mockData.ts
│   ├── store/
│   │   └── user.ts
│   ├── utils/
│   │   └── helpers.ts
│   ├── composables/
│   │   └── useInputFocus.ts
│   ├── components/
│   │   ├── PageHeader.vue       ← 复用组件
│   │   ├── EmptyState.vue       ← 复用组件
│   │   ├── SearchBar.vue        ← 复用组件
│   │   ├── WordListItem.vue     ← 复用组件
│   │   ├── PhysicalImage.vue
│   │   └── ImageWithFallback.vue
│   ├── pages/
│   │   ├── home/
│   │   │   └── index.vue
│   │   ├── word-detail/
│   │   │   └── index.vue
│   │   ├── libraries/
│   │   │   └── index.vue
│   │   ├── library-words/
│   │   │   └── index.vue
│   │   ├── profile/
│   │   │   └── index.vue
│   │   ├── auth/
│   │   │   └── index.vue
│   │   └── admin/
│   │       └── index.vue
│   └── static/
│       ├── fonts/
│       │   └── iconfont.ttf    ← 图标字体
│       └── images/             ← PNG 物理意象图(小程序回退)
```

---

## 依赖拓扑排序（Phase 3 生成顺序）

| 层级 | 文件 | 依赖 |
|------|------|------|
| **L0** | `src/data/types.ts` | 无 |
| **L1** | `src/data/mockData.ts`, `src/utils/helpers.ts`, `src/composables/useInputFocus.ts`, `src/store/user.ts` | L0 |
| **L2** | `src/components/PageHeader.vue`, `src/components/EmptyState.vue`, `src/components/SearchBar.vue`, `src/components/WordListItem.vue`, `src/components/PhysicalImage.vue`, `src/components/ImageWithFallback.vue` | L0, L1 |
| **L3** | `src/pages/home/index.vue`, `src/pages/libraries/index.vue`, `src/pages/library-words/index.vue`, `src/pages/word-detail/index.vue`, `src/pages/profile/index.vue`, `src/pages/auth/index.vue` | L2 |
| **L4** | `src/pages/admin/index.vue` | L2 (最多依赖) |
| **L5** | `src/App.vue`, `src/main.ts` | L3, L4 |
| **L6** | `src/pages.json`, `src/manifest.json`, `src/uni.scss`, `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` | L5 |

---

## ✅ Phase 2 验证清单

- [x] 每个源文件都有目标文件分配（或明确的"不移植"原因）
- [x] Phase 1 中的每个交互 ID 至少有一个目标文件负责
- [x] 所有六个映射类别（组件模型、事件、样式、路由、状态管理、数据获取）+ 图标策略都有具体规则
- [x] 不可映射的特性都有文档化的替代方案 + 多平台影响矩阵
- [x] H5 条件编译属性清单已生成
- [x] 全局样式强制规则表已生成（G1-G12）
- [x] 复用分析已完成：组件复用（4个）+ 样式复用（8项）+ 逻辑复用（6项）
- [x] 复用分析产出了差异化参数清单 + props 接口
- [x] 复用分析新增的共享组件已加入 Layer 2 拓扑排序
- [x] SCSS 变量交叉验证已完成，2 个变量已修正
- [x] 图标映射表已生成，含 uni-icons/iconfont 方案选择
- [x] 🔴 框架必备文件校验已通过：7 个必备文件已追加
- [x] 目标项目结构遵循 uni-app 约定
- [x] 依赖拓扑排序可从映射表推算
