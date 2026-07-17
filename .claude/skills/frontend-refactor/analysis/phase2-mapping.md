# Phase 2 — 迁移映射蓝图：React (inline-style) → uni-app (Vue 3)

> **生成日期**：2026-07-15（基于 Phase 1 重新分析）
> **迁移对**：React 18（100% 内联 `style={{}}` 对象）→ uni-app（Vue 3 + `<script setup>` + scoped SCSS）
> **目标平台**：H5 + 微信小程序（全端）
> **源交互总数**：72+（Phase 1 交互清单）
> **源核心文件数**：13 个
> **目标文件数**：28 个
> **迁移对参考**：无预置参考（`references/migrations/react→uniapp.md` 不存在）——从零生成
> **跨平台陷阱**：`references/cross-platform-pitfalls.md` — 全部 NC-01~NC-13 适用
> **图标策略**：`references/icons.md` 策略 D（uni-icons + iconfont 补充）

---

## 一、目标项目结构

```
english-dict-uni/
├── index.html                           → 🔴 [REQUIRED] H5 入口，根目录
├── package.json                         → 🔴 [REQUIRED] uni-app 依赖
├── vite.config.ts                       → 🔴 [REQUIRED] 根目录，@dcloudio/vite-plugin-uni
├── tsconfig.json                        → 🟡 [REQUIRED] 根目录
├── src/
│   ├── shims-vue.d.ts                   → 🟡 Vue SFC + SCSS 类型声明
│   ├── pages.json                       → 🔴 [REQUIRED] src/ 下，路由 + tabBar + globalStyle
│   ├── manifest.json                    → 🔴 [REQUIRED] src/ 下，应用清单
│   ├── uni.scss                         → 🟡 全局 SCSS 变量 + mixin
│   ├── App.vue                          → 🔴 [REQUIRED] 根组件
│   ├── main.ts                          → 🔴 [REQUIRED] createSSRApp + 自挂载
│   ├── data/
│   │   ├── types.ts                     → 类型定义（移除 React 类型引用）
│   │   └── mockData.ts                  → Mock 数据（直接移植）
│   ├── utils/
│   │   └── helpers.ts                   → 工具函数：getWordById, getLibraryById, getPosColor, filterWords, isValidPhone
│   ├── store/
│   │   └── user.ts                      → reactive store：user + login/logout
│   ├── composables/
│   │   └── useInputFocus.ts             → focus/blur 通用 composable
│   ├── components/
│   │   ├── PageHeader.vue               → 吸顶 header（7 页面复用）
│   │   ├── SectionLabel.vue             → 统一 section 标签（5+ 页面复用）
│   │   ├── PrimaryButton.vue            → 主按钮（4 页面复用）
│   │   ├── WordCard.vue                 → 单词卡片列表项（4 页面复用）
│   │   ├── EmptyState.vue               → 空状态占位（4 页面复用）
│   │   ├── SearchBar.vue                → 搜索输入框（2 页面复用）
│   │   └── PhysicalImage.vue            → 物理意象图片（2 页面复用，H5 SVG + 小程序 PNG）
│   ├── pages/
│   │   ├── home/
│   │   │   └── home.vue
│   │   ├── word-detail/
│   │   │   └── word-detail.vue
│   │   ├── libraries/
│   │   │   └── libraries.vue
│   │   ├── library-words/
│   │   │   └── library-words.vue
│   │   ├── profile/
│   │   │   └── profile.vue
│   │   ├── auth/
│   │   │   └── auth.vue
│   │   └── admin/
│   │       ├── admin.vue                → section 路由逻辑 + 数据管理
│   │       ├── OverviewSection.vue
│   │       ├── LibraryManager.vue
│   │       ├── WordManager.vue
│   │       ├── WordEditForm.vue
│   │       └── UserManager.vue
│   └── static/
│       ├── fonts/
│       │   └── iconfont.ttf             → 图标字体文件（19 种图标码点）
│       └── images/
│           ├── tab-home.png
│           ├── tab-home-active.png
│           ├── tab-libraries.png
│           ├── tab-libraries-active.png
│           ├── tab-profile.png
│           └── tab-profile-active.png
```

### 框架必备文件清单

| 文件 | 正确位置 | 🔴/🟡 | ❌ 常见错误 |
|------|---------|--------|-----------|
| `index.html` | 项目根目录 | 🔴 | 放 src/ 下；缺 `<script type="module" src="./src/main.ts">` |
| `vite.config.ts` | 项目根目录 | 🔴 | 放 src/ 下 |
| `tsconfig.json` | 项目根目录 | 🔴 | 放 src/ 下 |
| `package.json` | 项目根目录 | 🔴 | 版本号编造 |
| `src/pages.json` | src/ 下 | 🔴 | 放根目录 |
| `src/manifest.json` | src/ 下 | 🔴 | 放根目录 |
| `src/main.ts` | src/ 下 | 🔴 | 不包含自挂载 |
| `src/App.vue` | src/ 下 | 🔴 | 缺 H5 条件编译（NC-09~NC-11） |
| `src/uni.scss` | src/ 下 | 🟡 | 文件名错误 |
| `src/shims-vue.d.ts` | src/ 下 | 🟡 | 漏建 → TypeScript 报错 |

---

## 二、六大类映射规则

### 2.1 组件模型映射

| React 模式 | uni-app (Vue 3) 模式 | 说明 |
|-----------|---------------------|------|
| `function Component(props: I)` | `<script setup lang="ts">` + `defineProps<I>()` | SFC 三结构（template + script setup + style scoped） |
| `<div style={{...}}>` | `<view class="c" :style="dynamicOnly">` | 静态样式 → scoped class；仅动态值留 `:style` |
| `<span>` / `<p>`（短文本） | `<text>` | 单行短文本 |
| `<p>`（需换行的中文长文本） | `<view>` | 🔴 NC-07：`<text>` 中英文混排可能不换行 |
| `<h1>`~`<h4>` | `<view class="h1">` | 无原生 h1~h4 |
| `<img>` | `<image :src="..." mode="aspectFill">` | 小程序 image 组件 |
| `<input>` | `<input v-model="x" class="..."></input>` | 🔴 必须闭合标签（NC-02）；🔴 必须显式 height（NC-01） |
| `<button>` | `<view class="btn" @click="fn">` | 避免小程序 button 默认样式 |
| `<textarea>` | `<textarea auto-height></textarea>` | 🔴 NC-03：必须 auto-height；🔴 NC-08：移除 resize |
| `<select>` | `<picker mode="selector">`（小程序）+ 条件编译 | 🔴 平台差异 |
| `<>...</>` / Fragment | 隐式多根（Vue 3 支持） | 无需 template 包装 |
| `useState(x)` | `ref(x)`（原始类型）/ `reactive({...})`（对象） | `.value` 在 script 中访问 |
| `useMemo(fn, deps)` | `computed(fn)` | — |
| `useEffect(fn, [])` | `onMounted(fn)` | — |
| `useEffect(fn, [deps])` | `watch(deps, fn)` | — |
| `window.confirm()` | `uni.showModal({ title, content, success })` | 异步弹窗 |
| `<button disabled={loading}>` | `<view :class="{ disabled: loading }" @click="loading ? null : fn">` | 小程序 view 无 disabled 属性 |

### 2.2 事件系统映射

| React 模式 | uni-app (Vue 3) 模式 | 说明 |
|-----------|---------------------|------|
| `onClick={fn}` | `@click="fn"` / `@tap="fn"` | 小程序端用 `@tap` |
| `onChange={e => setX(e.target.value)}` | `@input="fn"` + `v-model="x"` | v-model 自动处理 .value vs .detail.value |
| `onFocus={e => e.target.style.xxx = '...'}` | `@focus="handleFocus"` + `:class` 绑定 | 🔴 DOM 操作 → 声明式 class（NC-04） |
| `onBlur={e => e.target.style.xxx = '...'}` | `@blur="handleBlur"` + `:class` 绑定 | 🔴 同上 |
| `onKeyDown={e => e.key==='Enter' && fn()}` | `@confirm="fn"`（input）+ `@keydown.enter="fn"`（H5） | 🟡 小程序端 input 用 @confirm |
| `onSubmit={fn}` | `@submit="fn"` | form 提交 |
| `style={{ ...spread }}` | `:style="dynamicStyleObject"` | 仅动态值需要 :style |
| `e.target.style.xxx` 直接操作 | 全部改为 Vue 响应式 class 绑定 | 🔴 小程序中不存在 e.target.style |

### 2.3 样式系统映射

| React 模式 | uni-app (Vue 3) 模式 | 说明 |
|-----------|---------------------|------|
| 内联 `style={{padding:'16px 24px', ...}}` | `<style scoped>` + 提取为 CSS class | 静态样式一律进 scoped class |
| `backdropFilter: 'blur(16px)'` | `/* #ifdef H5 */ backdrop-filter: blur(16px); /* #endif */` | 🔴 NC-05 |
| `WebkitBackdropFilter` | 移除——标准 `backdrop-filter` 已覆盖 | H5 only |
| `transition: 'border-color 0.2s'` | `/* #ifdef H5 */ transition: border-color 0.2s; /* #endif */` | 🔴 NC-04 |
| `position: 'fixed'`（BottomNav） | 原生 tabBar（`pages.json` 配置） | 🔴 不再用 CSS fixed |
| `position: 'sticky'`（header） | `position: sticky` 直接保留 | H5 支持，小程序部分支持 |
| `overflow: 'hidden'`（图片容器） | `/* #ifdef H5 */ overflow: hidden; /* #endif */` | 🔴 NC-05 |
| `resize: 'vertical'`（textarea） | 移除——`auto-height` 替代 | 🔴 NC-08 |
| CSS `@keyframes spin` | 直接保留 | ✅ CSS animation 全平台支持 |
| `cursor: 'pointer'` | `/* #ifdef H5 */ cursor: pointer; /* #endif */` | 小程序无 cursor 概念 |
| `userSelect: 'none'` | `/* #ifdef H5 */ user-select: none; /* #endif */` | 小程序不支持此属性 |

**px → rpx 换算规则**：`rpx = px × 2`（设计基准 375px→750rpx）

### 2.4 路由与导航映射

| React 模式 | uni-app 模式 | 说明 |
|-----------|-------------|------|
| `navigate({ name: 'home' })` | `uni.switchTab({ url: '/pages/home/home' })` | tabBar 页面 |
| `navigate({ name: 'libraries' })` | `uni.switchTab({ url: '/pages/libraries/libraries' })` | tabBar 页面 |
| `navigate({ name: 'profile' })` | `uni.switchTab({ url: '/pages/profile/profile' })` | tabBar 页面 |
| `navigate({ name: 'wordDetail', wordId })` | `uni.navigateTo({ url: '/pages/word-detail/word-detail?wordId=' + wordId })` | 非 tabBar |
| `navigate({ name: 'libraryWords', libraryId })` | `uni.navigateTo({ url: '/pages/library-words/library-words?libraryId=' + libraryId })` | 非 tabBar |
| `navigate({ name: 'login' })` | `uni.navigateTo({ url: '/pages/auth/auth?mode=login' })` | 非 tabBar |
| `navigate({ name: 'register' })` | `uni.navigateTo({ url: '/pages/auth/auth?mode=register' })` | 非 tabBar |
| `navigate({ name: 'admin', tab })` | `uni.navigateTo({ url: '/pages/admin/admin?tab=' + tab })` | 非 tabBar（全屏无 tabBar） |
| "返回"按钮 | `uni.navigateBack()` | — |
| `window.confirm()` | `uni.showModal()` | — |
| `tabFromView()` 逻辑 | `pages.json` tabBar list 配置 | tab 与路由由配置表达 |
| URL 参数读取 | `onLoad((options) => { options.wordId })` | `@dcloudio/uni-app` |

### 2.5 状态管理映射

| React 模式 | uni-app (Vue 3) 模式 | 说明 |
|-----------|---------------------|------|
| App.tsx `useState<ViewState>` + `setView()` | `pages.json` 路由 + `uni.switchTab` / `uni.navigateTo` | ViewState → 页面路由 |
| App.tsx `useState<AuthUser \| null>` | `src/store/user.ts` — `reactive({ user: null })` | 单 store，不安装 pinia |
| 组件内 `useState` | `ref()` / `reactive()` | 局部状态 |
| 派生状态 | `computed()` | — |
| 回调 prop（`navigate`, `onLogout`） | `defineEmits` 或直接从 store 调用 | navigate → uni API |
| AdminView `useState<AdminSection>` | `ref<AdminSection>('overview')` | 条件渲染子视图 |

### 2.6 数据获取映射

| React 模式 | uni-app (Vue 3) 模式 | 说明 |
|-----------|---------------------|------|
| `import { mockWords } from '../data/mockData'` | 直接保留 import | 静态数据不变 |
| `setTimeout(() => {...}, 800)` | 直接保留 | 模拟异步 |
| `mockWords.find(w => w.id === wordId)` | `getWordById(id)` → `utils/helpers.ts` | 提取为工具函数 |

---

## 三、逐文件映射表

### 3.1 核心映射

| # | 源文件 | 目标文件 | 难度 | 关键说明 |
|---|--------|---------|------|---------|
| 1 | `src/app/data/types.ts` (59行) | `src/data/types.ts` | 🟢 低 | 直接移植；移除 `React.FocusEvent` 引用 |
| 2 | `src/app/data/mockData.ts` (364行) | `src/data/mockData.ts` | 🟢 低 | 直接移植 |
| 3 | `src/main.tsx` (7行) | `src/main.ts` | 🔴 关键 | createRoot → createSSRApp + 自挂载；**使用已验证模板** |
| 4 | `src/app/App.tsx` (76行) | `src/App.vue` | 🔴 关键 | useState 路由 → pages.json；user state → store；BottomNav → tabBar |
| 5 | —（新增） | `src/store/user.ts` | 🟢 低 | reactive store：user + login/logout |
| 6 | —（新增） | `src/utils/helpers.ts` | 🟢 低 | 7 个工具函数 |
| 7 | —（新增） | `src/composables/useInputFocus.ts` | 🟢 低 | focus/blur ref |
| 8 | `src/app/components/HomeView.tsx` (234行) | `src/pages/home/home.vue` | 🟡 中 | 搜索+今日一词+全部词汇；使用 PageHeader, SearchBar, WordCard, SectionLabel |
| 9 | `src/app/components/WordDetailView.tsx` (247行) | `src/pages/word-detail/word-detail.vue` | 🟡 中 | 4 区详细页 + EvolutionArrow；使用 PageHeader, SectionLabel, PhysicalImage |
| 10 | `src/app/components/LibrariesView.tsx` (105行) | `src/pages/libraries/libraries.vue` | 🟢 低 | 词库卡片列表；使用 PageHeader, BookOpen 图标 |
| 11 | `src/app/components/LibrariesView.tsx` (85行 LibraryWordsView) | `src/pages/library-words/library-words.vue` | 🟢 低 | 拆分原文件；使用 PageHeader, WordCard, EmptyState |
| 12 | `src/app/components/ProfileView.tsx` (221行) | `src/pages/profile/profile.vue` | 🟡 中 | 未登录/已登录 + admin/user 分支；使用 PageHeader, PrimaryButton |
| 13 | `src/app/components/AuthView.tsx` (241行) | `src/pages/auth/auth.vue` | 🟡 中 | 登录/注册 + 表单验证 + loading；INPUT-B 模式 |
| 14 | `src/app/components/AdminView.tsx` (763行) | `src/pages/admin/admin.vue` + 5 子组件 | 🔴 高 | 763行拆分为 6 文件 |
| 14a | `AdminView.tsx` → Overview | `src/pages/admin/OverviewSection.vue` | 🟡 中 | 数据概览 + 3 功能入口 |
| 14b | `AdminView.tsx` → LibraryManager | `src/pages/admin/LibraryManager.vue` | 🟡 中 | 词库 CRUD |
| 14c | `AdminView.tsx` → WordManager | `src/pages/admin/WordManager.vue` | 🟡 中 | 单词搜索+列表+删除 |
| 14d | `AdminView.tsx` → WordEditForm | `src/pages/admin/WordEditForm.vue` | 🔴 高 | AI 生成+表单+引申义管理(~300行) |
| 14e | `AdminView.tsx` → UserManager | `src/pages/admin/UserManager.vue` | 🟢 低 | 用户只读列表 |
| 15 | `src/app/components/BottomNav.tsx` (65行) | 移除 → `pages.json` tabBar | 🟢 低 | 原生 tabBar 替代 |
| 16 | `src/app/components/PhysicalImage.tsx` (279行) | `src/components/PhysicalImage.vue` | 🔴 高 | 8 个内联 SVG → 条件编译（H5 SVG + 小程序 PNG） |
| 17 | `src/styles/` (5文件) | `src/uni.scss` + `src/App.vue` `<style>` | 🟡 中 | 全局样式变量 + Inter 字体 + iconfont |

### 3.2 共享组件映射（复用分析提取）

| # | 组件 | 目标文件 | 复用次数 | 来源 |
|---|------|---------|---------|------|
| S1 | PageHeader | `src/components/PageHeader.vue` | 7 | 所有页面 header |
| S2 | SectionLabel | `src/components/SectionLabel.vue` | 5+ | WordDetail, Libraries, Admin 全部子视图 |
| S3 | PrimaryButton | `src/components/PrimaryButton.vue` | 4 | Profile(登录/注册), Auth(提交), Admin(保存/取消/AI) |
| S4 | WordCard | `src/components/WordCard.vue` | 4 | HomeView(搜索+全部词汇), LibraryWords, Admin/WordManager |
| S5 | EmptyState | `src/components/EmptyState.vue` | 4 | HomeView(无结果), LibraryWords(空词库), Admin/LibraryManager, Admin/WordManager |
| S6 | SearchBar | `src/components/SearchBar.vue` | 2 | HomeView, Admin/WordManager |
| S7 | PhysicalImage | `src/components/PhysicalImage.vue` | 2 | WordDetailView, Admin/WordEditForm |

### 3.3 配置文件映射

| # | 目标文件 | 类型 | 说明 |
|---|---------|------|------|
| C1 | `package.json` | 🔴 | **使用 npm view 获取真实版本号**，不可编造 |
| C2 | `vite.config.ts` | 🔴 | **使用已验证模板**，根目录 |
| C3 | `tsconfig.json` | 🔴 | **使用已验证模板**，根目录 |
| C4 | `index.html` | 🔴 | **使用已验证模板**，根目录 |
| C5 | `src/pages.json` | 🔴 | 基于 Phase 1 路由表生成 |
| C6 | `src/manifest.json` | 🔴 | uni-app 应用清单 |
| C7 | `src/uni.scss` | 🟡 | 全局 SCSS 变量 + mixin |
| C8 | `src/shims-vue.d.ts` | 🟡 | Vue SFC 类型声明 |

### 3.4 不移植的文件

| 源文件 | 原因 |
|--------|------|
| `vite.config.ts` | uni-app 使用 `@dcloudio/vite-plugin-uni` |
| `postcss.config.mjs` | uni-app CLI 内置 |
| `pnpm-workspace.yaml` | npm 项目管理 |
| `src/styles/tailwind.css` | 不使用 Tailwind → scoped SCSS |
| `src/styles/theme.css` | CSS 变量 → SCSS 变量 |
| `src/styles/fonts.css` | Inter 字体在 App.vue H5 条件编译中引入 |
| `src/styles/globals.css` | 空文件 |
| `src/styles/index.css` | 入口 CSS — 由 App.vue 替代 |
| `src/app/components/figma/ImageWithFallback.tsx` | 未被引用 |
| `src/app/components/ui/` (48 .tsx) | 全部未使用（shadcn/ui） |
| `guidelines/Guidelines.md` | 空模板 |

---

## 四、图标迁移映射

> 源项目使用 18 种 lucide-react 图标 + 1 个 Loader（CSS 动画）。
> 目标全端方案：**iconfont 统一方案**（策略 D）。
> tabBar 图标：独立 PNG 文件放在 `static/images/`。

### 4.1 图标码点映射表

| # | 源图标 (lucide-react) | 用途 | iconfont 码点 | iconfont class | 代码片段 |
|---|----------------------|------|-------------|----------------|---------|
| 1 | Search | 搜索图标 | `\e001` | `icon-search` | `<text class="iconfont icon-search">&#xe001;</text>` |
| 2 | ArrowRight | 列表箭头 | `\e002` | `icon-arrow-right` | `<text class="iconfont icon-arrow-right">&#xe002;</text>` |
| 3 | ArrowLeft | 返回箭头 | `\e003` | `icon-arrow-left` | `<text class="iconfont icon-arrow-left">&#xe003;</text>` |
| 4 | Sparkles | 今日一词 | `\e004` | `icon-sparkles` | `<text class="iconfont icon-sparkles">&#xe004;</text>` |
| 5 | ChevronRight | 菜单/演化箭头 | `\e005` | `icon-chevron-right` | `<text class="iconfont icon-chevron-right">&#xe005;</text>` |
| 6 | BookOpen | 词库图标 | `\e006` | `icon-book-open` | `<text class="iconfont icon-book-open">&#xe006;</text>` |
| 7 | User | 用户图标 | `\e007` | `icon-user` | `<text class="iconfont icon-user">&#xe007;</text>` |
| 8 | Settings | 设置菜单 | `\e008` | `icon-settings` | `<text class="iconfont icon-settings">&#xe008;</text>` |
| 9 | Shield | 管理员盾牌 | `\e009` | `icon-shield` | `<text class="iconfont icon-shield">&#xe009;</text>` |
| 10 | LogOut | 退出登录 | `\e00a` | `icon-log-out` | `<text class="iconfont icon-log-out">&#xe00a;</text>` |
| 11 | Target | 今日目标 | `\e00b` | `icon-target` | `<text class="iconfont icon-target">&#xe00b;</text>` |
| 12 | Eye | 密码可见 | `\e00c` | `icon-eye` | `<text class="iconfont icon-eye">&#xe00c;</text>` |
| 13 | EyeOff | 密码隐藏 | `\e00d` | `icon-eye-off` | `<text class="iconfont icon-eye-off">&#xe00d;</text>` |
| 14 | Plus | 新增按钮 | `\e00e` | `icon-plus` | `<text class="iconfont icon-plus">&#xe00e;</text>` |
| 15 | RefreshCw | 重新生成 | `\e00f` | `icon-refresh-cw` | `<text class="iconfont icon-refresh-cw">&#xe00f;</text>` |
| 16 | Check | AI 完成勾 | `\e010` | `icon-check` | `<text class="iconfont icon-check">&#xe010;</text>` |
| 17 | X | 删除/清除 | `\e011` | `icon-x` | `<text class="iconfont icon-x">&#xe011;</text>` |
| 18 | Type | 单词管理 | `\e012` | `icon-type` | `<text class="iconfont icon-type">&#xe012;</text>` |
| 19 | Users | 用户管理 | `\e013` | `icon-users` | `<text class="iconfont icon-users">&#xe013;</text>` |
| — | Loader | 加载动画 | — | — | `<view class="spinner">`（CSS @keyframes spin，不用 iconfont） |

### 4.2 图标特殊映射

| 源实现 | 目标实现 |
|--------|---------|
| `ArrowRight` + `transform: rotate(180deg)`（LibraryWordsView 返回箭头） | 直接使用 `icon-arrow-left` (`\e003`) |
| Eye/EyeOff 切换 | `v-if="showPassword"` 切换两个 iconfont 字符 |
| Loader spin 动画 | `@keyframes spin` 全平台支持 |
| PhysicalImage 8 个内联 SVG | H5 条件编译保留 SVG；小程序用 PNG image 回退 |

### 4.3 iconfont 基础设施

**字体文件**：`src/static/fonts/iconfont.ttf`

**全局引入（App.vue 非 scoped style，H5 条件编译内）**：
```css
/* #ifdef H5 */
@font-face {
  font-family: 'iconfont';
  src: url('@/static/fonts/iconfont.ttf') format('truetype');
}
/* #endif */
.iconfont {
  font-family: 'iconfont' !important;
  font-size: inherit;
  font-style: normal;
  /* #ifdef H5 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* #endif */
}
```

### 🔴 图标红线

> **绝对禁止使用任何 emoji 字符替代图标。**
> 包括但不限于：🔍 ✨ 📖 👤 🛡 ⚙ 🎯 🚪 📭 ❌ ✅ ➕ 🔄 💡 ← → × ✓
> 如 iconfont 码点不可用，用 `<view class="icon-placeholder">` 并在注释中标注"待补充图标"。

---

## 五、不可移植特性与多平台影响评估

### 5.1 不可移植特性表

| ID | 源特性 | 问题 | 替代方案 | 保真度差距 | 多平台影响 |
|----|--------|------|---------|-----------|-----------|
| U1 | `backdrop-filter: blur(16px)` ×5 | 小程序不支持 | `/* #ifdef H5 */` 保留；小程序降级纯色 rgba | 🟡 小程序失毛玻璃 | 见 D1 |
| U2 | `backdrop-filter: blur(20px)` BottomNav | 小程序不支持 | 原生 tabBar（自带半透明效果） | 🟢 原生更好 | 见 D2 |
| U3 | CSS `transition` on input | 原生组件不支持 | `/* #ifdef H5 */` 保留；小程序靠 class 切换背景色突变 | 🟡 无过渡动画 | 见 D3 |
| U4 | `e.target.style.xxx = '...'` DOM 操作 | 小程序不可用 | `:class` 绑定 + `useInputFocus` composable | 🟢 声明式更好 | 见 D4 |
| U5 | `window.confirm()` 同步弹窗 | 小程序不可用 | `uni.showModal()` | 🟢 原生弹窗更好 | — |
| U6 | 内联 SVG (8 个 PhysicalImage) | 小程序不支持内联 SVG | H5 保留 SVG；小程序用 PNG `<image>` 回退 | 🟡 小程序视觉可能略异 | — |
| U7 | `position: fixed` BottomNav | 小程序不支持 fixed 叠加 tabBar | 原生 tabBar 配置 | 🟢 原生更好 | 见 D2 |
| U8 | `overflow: hidden` 图片容器 | 裁剪原生渲染层（NC-05） | `/* #ifdef H5 */` 保留 | 🟡 小程序 image 自带裁剪 | — |
| U9 | `<select>` ×3 (WordEditForm) | 小程序不支持 HTML select | `<picker mode="selector">` | 🟢 原生选择器 | — |
| U10 | `position: sticky` header | 小程序部分支持 | 保留 sticky；不支持平台降级为普通流 | 🟡 部分平台无吸顶 | — |

### 5.2 设计决策多平台影响矩阵

#### 决策 D1：header backdrop-filter H5 条件编译保留

| 评估维度 | H5（桌面端） | H5（移动端） | 微信小程序 |
|---------|-----------|-----------|-----------|
| 视觉影响 | 🟢 保留：毛玻璃与原型完全一致 | 🟢 保留 | 🟡 降级：纯色 rgba 背景 |
| 交互影响 | 🟢 无影响 | 🟢 无影响 | 🟢 无影响 |
| 条件编译 | — | — | `/* #ifdef H5 */` 包裹 |
| 判定 | ✅ 保留 | ✅ 保留 | ⚠️ 降级接受 |

#### 决策 D2：BottomNav 改用原生 tabBar

| 评估维度 | H5（桌面端） | H5（移动端） | 微信小程序 |
|---------|-----------|-----------|-----------|
| 视觉影响 | 🟡 原生 tabBar 可定制性低于 CSS | 🟢 移动端原生体验 | 🟢 原生体验 |
| 交互影响 | 🟢 switchTab 正常 | 🟢 正常 | 🟢 正常 |
| 判定 | ✅ 接受 | ✅ 保留 | ✅ 保留 |

#### 决策 D3：input CSS transition 条件编译

| 评估维度 | H5 | 微信小程序 |
|---------|----|-----------|
| 视觉影响 | 🟢 过渡动画保留 | 🟡 背景色突变（class 切换） |
| 交互影响 | 🟢 无影响 | 🔴 移除 transition 避免重绘冲突（NC-04） |
| 条件编译 | — | `/* #ifdef H5 */` 包裹 |
| 判定 | ✅ 保留 | ✅ 必须移除 |

#### 决策 D4：input focus 改用 :class 绑定 + composable

| 评估维度 | H5 | 微信小程序 |
|---------|----|-----------|
| 视觉影响 | 🟢 与原型一致（class 切换） | 🟢 与原型一致 |
| 交互影响 | 🟢 声明式更可靠 | 🟢 唯一可用方案 |
| 判定 | ✅ 改进 | ✅ 唯一方案 |

### 5.3 H5 专属条件编译属性清单

| 属性 | 条件编译语法 | 来源决策 |
|------|------------|---------|
| `backdrop-filter` + `-webkit-backdrop-filter` | `/* #ifdef H5 */` | D1 |
| `transition`（在原生组件上） | `/* #ifdef H5 */` | D3 |
| `overflow: hidden` | `/* #ifdef H5 */` | NC-05 |
| `cursor: pointer` | `/* #ifdef H5 */` | — |
| `@import url(https://...)` | `/* #ifdef H5 */` | NC-09 |
| `* { box-sizing }` | `/* #ifdef H5 */` | NC-10 |
| `html, body { ... }` | `/* #ifdef H5 */` | NC-11 |
| `max-width: 430px; margin: 0 auto` | `/* #ifdef H5 */` | root container |

---

## 六、复用分析

### 6.1 组件复用

#### 共享组件 1：PageHeader

**差异化参数清单**：

| 使用位置 | 背景色 | padding-top | 返回按钮 | 标题内容 | 右侧操作 |
|---------|--------|------------|---------|---------|---------|
| home | `rgba(255,255,255,0.9)` | 56px→112rpx | 无 | subtitle+"用物理意象读懂英语" | 无 |
| word-detail | `rgba(247,249,252,0.92)` | 52px→104rpx | 有 | 无（单词名在下方 body 区） | 词库标签 |
| libraries | `rgba(255,255,255,0.9)` | 52px→104rpx | 无 | subtitle+"选择词库" | 无 |
| library-words | `rgba(255,255,255,0.9)` | 52px→104rpx | 有（←"词库列表"） | 库名 | 无 |
| profile (logged-in) | `rgba(255,255,255,0.9)` | 52px→104rpx | 无 | subtitle+"个人中心" | 无 |
| profile (not-logged-in) | 无 header 背景（仅文字区） | 52px→104rpx | 无 | subtitle+"个人中心" | 无 |
| admin/overview | `rgba(247,249,252,0.94)` | 52px→104rpx | 无 | subtitle+"数据概览" | 无 |
| admin/sub-views | `rgba(247,249,252,0.94)` | 52px→104rpx | 有 | 动态标题 | 新增按钮等 |

**Props 接口推导**：
```ts
defineProps<{
  title?: string          // 主标题（必填）
  subtitle?: string        // 副标签文字（如"认知英语词典"、"词库"、"我的"）
  showBack?: boolean       // 是否显示返回按钮（默认 false）
  backLabel?: string       // 返回按钮文字（默认"返回"）
  bgType?: 'white' | 'page-gray' | 'page-gray-92' | 'none'
  // 'white' → rgba(255,255,255,0.9) — Home/Libraries/Profile
  // 'page-gray' → rgba(247,249,252,0.94) — Admin
  // 'page-gray-92' → rgba(247,249,252,0.92) — WordDetail
  // 'none' → transparent — Profile(not-logged-in)
  paddingTop?: number      // 自定义 padding-top（默认 104rpx）
}>()
// 右侧操作区通过 slot 传入
```

#### 共享组件 2：SectionLabel
- 统一样式：`font-size: 22rpx, font-weight: 600, color: #9CA3AF, letter-spacing: 4rpx, text-transform: uppercase`
- Props: `label: string`

#### 共享组件 3：PrimaryButton
```ts
defineProps<{
  label: string            // 按钮文字
  loading?: boolean        // loading 态
  disabled?: boolean       // disabled 态
  ghost?: boolean          // ghost 变体（白色+蓝色边框）
  icon?: string            // 可选 iconfont class
}>()
```

#### 共享组件 4：WordCard
```ts
defineProps<{
  word: Word               // 单词数据
  library?: WordLibrary    // 所属词库
  showLibrary?: boolean    // 是否显示词库标签（默认 true）
  showArrow?: boolean      // 是否显示 ArrowRight（默认 true）
  variant?: 'default' | 'compact'  // default(全部词汇) vs compact(搜索结果/词库内)
}>()
```

#### 共享组件 5：EmptyState
```ts
defineProps<{
  icon: string             // iconfont class
  message: string          // 主提示文字
  hint?: string            // 副提示文字
}>()
```

#### 共享组件 6：SearchBar
```ts
defineProps<{
  modelValue: string       // v-model 搜索文本
  placeholder?: string     // 占位文字（默认"输入英文单词..."）
}>()
defineEmits<{
  'update:modelValue': [value: string]
}>()
```

#### 共享组件 7：PhysicalImage
```ts
defineProps<{
  type: string             // 物理意象类型
  showLabel?: boolean      // 是否显示底部标注（默认 true）
}>()
```

### 6.2 样式复用（SCSS 变量 + mixin）

完整 SCSS 变量体系（写入 `uni.scss`）：

```scss
// ── 颜色 ──
$color-primary: #2563EB;
$color-primary-dark: #1D4ED8;
$color-primary-light: #3B82F6;
$color-primary-disabled: #93C5FD;
$color-primary-bg: #EFF6FF;
$color-primary-border: #BFDBFE;
$color-success: #16A34A;
$color-success-bg: #F0FDF4;
$color-warning-bg: #FFFBEB;
$color-warning-text: #92400E;
$color-warning-border: #FDE68A;
$color-danger: #DC2626;
$color-danger-bg: #FEF2F2;
$color-admin: #7C3AED;
$color-admin-bg: #FAF5FF;
$color-bg-page: #F7F9FC;
$color-bg-card: #FFFFFF;
$color-bg-input: #F1F5F9;
$color-bg-input-focus: #FFFFFF;
$color-bg-light: #F8FAFC;
$color-bg-gray: #F3F4F6;
$color-text-primary: #111827;
$color-text-secondary: #374151;
$color-text-tertiary: #6B7280;
$color-text-placeholder: #9CA3AF;
$color-border: #E5E7EB;
$color-border-light: #D1D5DB;

// 半透明 header
$color-header-bg-white: rgba(255, 255, 255, 0.9);
$color-header-bg-page: rgba(247, 249, 252, 0.94);
$color-header-bg-page-92: rgba(247, 249, 252, 0.92);

// ── 间距（rpx = px × 2）──
$spacing-xs: 12rpx;     // 6px
$spacing-sm: 16rpx;     // 8px
$spacing-md: 20rpx;     // 10px
$spacing-lg: 24rpx;     // 12px
$spacing-xl: 28rpx;     // 14px
$spacing-2xl: 32rpx;    // 16px
$spacing-3xl: 40rpx;    // 20px
$spacing-4xl: 48rpx;    // 24px
$spacing-5xl: 56rpx;    // 28px
$spacing-6xl: 64rpx;    // 32px

// ── 圆角（rpx）──
$radius-sm: 12rpx;      // 6px
$radius-md: 20rpx;      // 10px
$radius-lg: 24rpx;      // 12px
$radius-xl: 28rpx;      // 14px
$radius-2xl: 32rpx;     // 16px
$radius-3xl: 40rpx;     // 20px
$radius-4xl: 48rpx;     // 24px
$radius-full: 9999rpx;

// ── 字号（rpx）──
$font-3xs: 18rpx;       // 9px
$font-2xs: 22rpx;       // 11px
$font-xs: 24rpx;        // 12px
$font-sm: 26rpx;        // 13px
$font-base: 28rpx;      // 14px
$font-md: 30rpx;        // 15px
$font-lg: 32rpx;        // 16px
$font-xl: 34rpx;        // 17px
$font-2xl: 36rpx;       // 18px
$font-3xl: 40rpx;       // 20px
$font-4xl: 44rpx;       // 22px
$font-5xl: 52rpx;       // 26px
$font-6xl: 68rpx;       // 34px
$font-7xl: 84rpx;       // 42px

// ── 字重 ──
$weight-regular: 400;
$weight-medium: 500;
$weight-semibold: 600;
$weight-bold: 700;
$weight-extrabold: 800;

// ── 阴影 ──
$shadow-card-sm: 0 2px 12px rgba(0, 0, 0, 0.04);
$shadow-card-md: 0 2px 16px rgba(0, 0, 0, 0.04);
$shadow-card-lg: 0 2px 16px rgba(0, 0, 0, 0.05);
$shadow-card-xl: 0 2px 20px rgba(0, 0, 0, 0.05);
$shadow-image: 0 4px 24px rgba(0, 0, 0, 0.07);
$shadow-featured: 0 8px 32px rgba(37, 99, 235, 0.25);
$shadow-admin: 0 8px 32px rgba(37, 99, 235, 0.22);
$shadow-admin-purple: 0 8px 32px rgba(124, 58, 237, 0.25);
$shadow-tab-active: 0 1px 4px rgba(0, 0, 0, 0.08);
$shadow-logo: 0 4px 16px rgba(37, 99, 235, 0.3);

// ── 渐变 ──
$gradient-primary: linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #3B82F6 100%);
$gradient-admin-banner: linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #3B82F6 100%);
$gradient-admin-user: linear-gradient(135deg, #4C1D95, #7C3AED);
$gradient-user: linear-gradient(135deg, #1D4ED8, #2563EB);
$gradient-logo: linear-gradient(135deg, #1D4ED8, #3B82F6);
$gradient-avatar-admin: linear-gradient(135deg, #7C3AED, #8B5CF6);
$gradient-avatar-user: linear-gradient(135deg, #2563EB, #3B82F6);
$gradient-ai-card: linear-gradient(135deg, #EFF6FF, #DBEAFE);
$gradient-evolution-arrow: linear-gradient(to right, #E5E7EB, #2563EB);

// ── 词库卡片色 ──
$lib-color-1-bg: linear-gradient(135deg, #EFF6FF, #DBEAFE);
$lib-color-1-accent: #2563EB;
$lib-color-1-border: #BFDBFE;
$lib-color-2-bg: linear-gradient(135deg, #F0FDF4, #DCFCE7);
$lib-color-2-accent: #16A34A;
$lib-color-2-border: #BBF7D0;
$lib-color-3-bg: linear-gradient(135deg, #FFF7ED, #FED7AA);
$lib-color-3-accent: #D97706;
$lib-color-3-border: #FDE68A;
$lib-color-4-bg: linear-gradient(135deg, #FAF5FF, #EDE9FE);
$lib-color-4-accent: #7C3AED;
$lib-color-4-border: #DDD6FE;

// ── Layout ──
$max-width: 430px;
$tab-bar-height: 120rpx;
$header-padding-top: 104rpx;    // 52px → 104rpx（标准）
$header-padding-top-home: 112rpx; // 56px → 112rpx
```

#### 全局 mixin

```scss
// Card base
@mixin card-base {
  background: $color-bg-card;
  border-radius: $radius-2xl;
  box-shadow: $shadow-card-lg;
}

// ── INPUT-A: 透明边框 + 灰色背景 → focus 蓝色 + 白色（HomeView, AdminView）──
@mixin input-pattern-a {
  width: 100%;
  height: 97rpx;
  padding: 26rpx 28rpx;
  border: 3rpx solid transparent;
  border-radius: $radius-xl;
  background: $color-bg-input;
  font-size: $font-lg;
  color: $color-text-primary;
  box-sizing: border-box;
  /* #ifdef H5 */
  transition: border-color 0.2s, background 0.2s;
  /* #endif */
}

@mixin input-pattern-a-focused {
  border-color: $color-primary;
  background: $color-bg-input-focus;
}

// ── INPUT-B: 灰色边框 + 白色背景 → focus 蓝色（AuthView）──
@mixin input-pattern-b {
  width: 100%;
  height: 104rpx;
  padding: 28rpx 32rpx;
  border: 3rpx solid $color-border;
  border-radius: $radius-xl;
  background: $color-bg-card;
  font-size: $font-lg;
  color: $color-text-primary;
  box-sizing: border-box;
  /* #ifdef H5 */
  transition: border-color 0.2s;
  /* #endif */
}

@mixin input-pattern-b-focused {
  border-color: $color-primary;
}

// Section label
@mixin section-label {
  font-size: $font-2xs;
  font-weight: $weight-semibold;
  color: $color-text-placeholder;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  margin: 0 0 24rpx;
}

// POS tag color helper
@mixin pos-tag($bg, $text) {
  flex-shrink: 0;
  font-size: $font-2xs;
  padding: 6rpx 20rpx;
  border-radius: $radius-full;
  font-weight: $weight-medium;
  background: $bg;
  color: $text;
}
```

### 6.3 逻辑复用

#### composable：`useInputFocus()`
```ts
// src/composables/useInputFocus.ts
import { ref } from 'vue'
export function useInputFocus() {
  const isFocused = ref(false)
  const handleFocus = () => { isFocused.value = true }
  const handleBlur = () => { isFocused.value = false }
  return { isFocused, handleFocus, handleBlur }
}
```

#### 工具函数：`utils/helpers.ts`
```ts
export function getWordById(id: string): Word | undefined
export function getLibraryById(id: string): WordLibrary | undefined
export function getPosColor(pos: string): { bg: string; text: string }
export function filterWords(words: Word[], query: string): Word[]
export function isValidPhone(phone: string): boolean
export function getTodayWord(): Word
export function genId(): string
```

### 6.4 🔴 复用约束清单（注入 Phase 3 Agent Prompt）

| 约束 | 强制指令 | 适用页面 |
|------|---------|---------|
| C1 | **❌ 禁止手写 header → ✅ 必须用 `<PageHeader>`** | home, word-detail, libraries, library-words, profile, admin |
| C2 | **❌ 禁止手写 section 标签 → ✅ 必须用 `<SectionLabel>`** | word-detail, admin 全部子组件 |
| C3 | **❌ 禁止手写操作按钮 → ✅ 必须用 `<PrimaryButton>`** | profile(登录/注册), auth(提交), admin(保存/取消/AI) |
| C4 | **❌ 禁止手写单词列表项 → ✅ 必须用 `<WordCard>`** | home, library-words, admin/WordManager |
| C5 | **❌ 禁止手写空状态 → ✅ 必须用 `<EmptyState>`** | home, library-words, admin/LibraryManager, admin/WordManager |
| C6 | **❌ 禁止手写搜索框 → ✅ 必须用 `<SearchBar>`** | home, admin/WordManager |
| C7 | **❌ 禁止手写 `const isFocused = ref(false)` → ✅ 必须用 `useInputFocus()`** | home, auth, admin |
| C8 | **❌ 禁止手写 input 样式 → ✅ 必须用 `@include input-pattern-a` 或 `@include input-pattern-b`** | home, auth, admin |
| C9 | **❌ 禁止手写 `mockWords.find(...)` → ✅ 必须用 `getWordById()`** | word-detail, admin |
| C10 | **❌ 禁止手写 `mockLibraries.find(...)` → ✅ 必须用 `getLibraryById()`** | word-detail, libraries, admin |

---

## 七、输入框样式模式分类（Step 4b）

> **判定**：React inline-style + 命令式 DOM 操作 + uni-app 小程序 → **三个条件全部满足**，完整执行。

### 7.1 模式分类

| 模式 ID | blur border | blur bg | focus border | focus bg | 出现位置 | 次数 |
|---------|-----------|---------|-------------|---------|---------|------|
| **INPUT-A** | `transparent` | `#F1F5F9` | `#2563EB` | `#FFFFFF` | HomeView 搜索框, AdminView 全部 input/textarea/select | 8+ |
| **INPUT-B** | `#E5E7EB` | `#FFFFFF` | `#2563EB` | `#FFFFFF`(不变) | AuthView 用户名/手机号/密码 | 3 |

### 7.2 目标实现

| 模式 | SCSS | focus class | Vue 绑定 | 适用文件 |
|------|------|------------|---------|---------|
| INPUT-A | `@include input-pattern-a` | `&--focused` | `:class="{ 'search-input--focused': isFocused }"` | home, admin/*.vue |
| INPUT-B | `@include input-pattern-b` | `&--focused` | `:class="{ 'auth-input--focused': isFocused }"` | auth.vue |

### 7.3 模式 → 文件映射

| 文件 | 模式 | 说明 |
|------|------|------|
| `pages/home/home.vue` | INPUT-A | 搜索 input（含 SearchBar 组件） |
| `pages/auth/auth.vue` | INPUT-B | 用户名、手机号、密码（3 处） |
| `pages/admin/WordEditForm.vue` | INPUT-A | 单词、音标、逻辑演化、引申义、例句 textarea（~8 处） |
| `pages/admin/LibraryManager.vue` | INPUT-A | 词库名称、描述 textarea |
| `pages/admin/WordManager.vue` | INPUT-A | 搜索 input（含 SearchBar 组件） |

---

## 八、SCSS 变量交叉验证（Step 2.6）

> 将 uni.scss 变量定义值与原型精确 px 值对比。换算：`rpx = px × 2`

### 8.1 关键数值对照表

| SCSS 变量 | 定义值 | 原型字面值 | 期望 rpx | 偏差 | 判定 |
|-----------|--------|-----------|---------|------|------|
| `$spacing-sm` | `16rpx` | 8px | 16rpx | 0 | ✅ |
| `$spacing-lg` | `24rpx` | 12px | 24rpx | 0 | ✅ |
| `$spacing-xl` | `28rpx` | 14px | 28rpx | 0 | ✅ |
| `$spacing-2xl` | `32rpx` | 16px | 32rpx | 0 | ✅ |
| `$spacing-3xl` | `40rpx` | 20px | 40rpx | 0 | ✅ |
| `$spacing-4xl` | `48rpx` | 24px | 48rpx | 0 | ✅ |
| `$radius-xl` | `28rpx` | 14px | 28rpx | 0 | ✅ |
| `$radius-2xl` | `32rpx` | 16px | 32rpx | 0 | ✅ |
| `$radius-3xl` | `40rpx` | 20px | 40rpx | 0 | ✅ |
| `$radius-4xl` | `48rpx` | 24px | 48rpx | 0 | ✅ |
| `$font-2xs` | `22rpx` | 11px | 22rpx | 0 | ✅ |
| `$font-xs` | `24rpx` | 12px | 24rpx | 0 | ✅ |
| `$font-sm` | `26rpx` | 13px | 26rpx | 0 | ✅ |
| `$font-base` | `28rpx` | 14px | 28rpx | 0 | ✅ |
| `$font-md` | `30rpx` | 15px | 30rpx | 0 | ✅ |
| `$font-lg` | `32rpx` | 16px | 32rpx | 0 | ✅ |
| `$font-5xl` | `52rpx` | 26px | 52rpx | 0 | ✅ |
| `$font-6xl` | `68rpx` | 34px | 68rpx | 0 | ✅ |
| `$font-7xl` | `84rpx` | 42px | 84rpx | 0 | ✅ |
| `$header-padding-top` | `104rpx` | 52px | 104rpx | 0 | ✅ |
| `$header-padding-top-home` | `112rpx` | 56px | 112rpx | 0 | ✅ |
| `$tab-bar-height` | `120rpx` | 60px | 120rpx | 0 | ✅ |
| input-pattern-a height | `97rpx` | 13px+15px×1.5+13px=48.5px | 97rpx | 0 | ✅ |
| input-pattern-b height | `104rpx` | 14px+16px×1.5+14px=52px | 104rpx | 0 | ✅ |

### 8.2 颜色值交叉验证

所有颜色变量定义值与原型中实际使用的字面值一致（参见 Phase 1 §4.1），全部 ✅。

### 8.3 交叉验证结论

所有 SCSS 变量定义值与原型字面值精确匹配，无偏差。✅

---

## 九、全局样式强制规则表（Phase 3 每页 Agent 必须遵守）

| 规则 ID | 规则内容 | 来源 | 适用文件 | 严重性 |
|---------|---------|------|---------|--------|
| G1 | **backdrop-filter 必须用 H5 条件编译**：`/* #ifdef H5 */ backdrop-filter: blur(16px); /* #endif */` | NC-05, D1 | 所有含 header 的页面 | 🔴 |
| G2 | **header 半透明背景色**：各页面必须匹配差异化参数清单中的 rgba 值 | Phase 1 §4.9 | PageHeader 组件（通过 bgType prop） | 🔴 |
| G3 | **安全区 padding-top**：页面顶部用 SCSS 变量 `$header-padding-top` (104rpx) 或 `$header-padding-top-home` (112rpx) | Phase 1 §4.2 | 所有页面 | 🔴 |
| G4 | **BottomNav 由原生 tabBar 实现**：不手写 position:fixed 底部导航 | uni-app tabBar | App.vue（仅全局 UI 逻辑） | 🔴 |
| G5 | **input 必须有显式 height**：公式 `height = padding-top + (font-size × line-height) + padding-bottom` | NC-01 | 所有含 input 的文件 | 🔴 |
| G6 | **input 闭合标签**：`<input ... ></input>` 不可自闭合 | NC-02 | 所有含 input 的文件 | 🔴 |
| G7 | **textarea 必须加 auto-height**：`<textarea auto-height ></textarea>` | NC-03 | admin/WordEditForm | 🔴 |
| G8 | **包裹容器必须有 min-height**：input/textarea 外层容器 min-height 与内部 input height 一致 | NC-06 | auth (phone-wrap, password-wrap) | 🔴 |
| G9 | **overflow: hidden 用 H5 条件编译** | NC-05 | home(图片容器), word-detail(PhysicalImage) | 🔴 |
| G10 | **长文本用 `<view>` 不用 `<text>`**：中文释义、例句等自动换行文本 | NC-07 | word-detail, admin | 🟡 |
| G11 | **word-break 防护**：在中文长文本容器上 `word-break: break-all; overflow-wrap: break-word` | NC-07 | word-detail, admin | 🟡 |
| G12 | **resize 移除**：textarea 不可有 `resize` | NC-08 | admin/WordEditForm | 🟢 |
| G13 | **transition 用 H5 条件编译**：原生组件上的 transition 必须条件编译 | NC-04, D3 | 所有含 input/textarea 的文件 | 🔴 |
| G14 | **input 样式必须使用模式分类**：每个 input 必须标注 INPUT-A 或 INPUT-B，使用 uni.scss mixin | Step 4b | home, auth, admin | 🔴 |
| G15 | **focus 管理必须用 useInputFocus composable**：禁止手写 `const isFocused = ref(false)` | Step 4b, D4 | home, auth, admin | 🔴 |
| G16 | **`<text>` 中 `\n` 必须配合 `white-space: pre-line`** | NC-12 | PageHeader(home 标题含\n), profile | 🟡 |
| G17 | **根容器 max-width + margin auto 用 H5 条件编译**：`/* #ifdef H5 */ max-width: 430px; margin: 0 auto; /* #endif */` | D1 | App.vue | 🔴 |
| G18 | **Google Fonts @import 必须用 H5 条件编译** | NC-09 | App.vue | 🔴 |
| G19 | **通配选择器 `*` 必须用 H5 条件编译** | NC-10 | App.vue | 🔴 |
| G20 | **`html, body` 选择器必须用 H5 条件编译** | NC-11 | App.vue | 🔴 |

---

## 十、Phase 3 生成顺序（拓扑排序）

### 第 0 层：类型 + 数据（无依赖）
- `src/data/types.ts`
- `src/data/mockData.ts`（依赖 types.ts）

### 第 1 层：工具 + store + composable
- `src/utils/helpers.ts`（依赖 types.ts）
- `src/store/user.ts`（依赖 types.ts）
- `src/composables/useInputFocus.ts`（无外部依赖）

### 第 2 层：共享组件（🔴 串行生成 + 验证关）
- `src/components/SectionLabel.vue`
- `src/components/PrimaryButton.vue`
- `src/components/EmptyState.vue`
- `src/components/SearchBar.vue`（依赖 useInputFocus + input-pattern-a）
- `src/components/WordCard.vue`（依赖 types.ts + getLibraryById）
- `src/components/PhysicalImage.vue`（条件编译 SVG/PNG）
- `src/components/PageHeader.vue`（依赖 iconfont）

### 第 2.5 层：静态资源占位（🔴 构建前置）
- `src/static/fonts/iconfont.ttf`（最小合法 TTF 占位）
- `src/static/images/tab-home.png`（1×1 透明 PNG）
- `src/static/images/tab-home-active.png`
- `src/static/images/tab-libraries.png`
- `src/static/images/tab-libraries-active.png`
- `src/static/images/tab-profile.png`
- `src/static/images/tab-profile-active.png`

### 第 3 层：叶子页面（可并行，但须第 2 层全部锁定后）
- `src/pages/home/home.vue`
- `src/pages/auth/auth.vue`
- `src/pages/libraries/libraries.vue`
- `src/pages/library-words/library-words.vue`
- `src/pages/profile/profile.vue`

### 第 4 层：组合页面（可并行，须第 3 层完成后）
- `src/pages/word-detail/word-detail.vue`
- `src/pages/admin/OverviewSection.vue`
- `src/pages/admin/LibraryManager.vue`
- `src/pages/admin/WordEditForm.vue`
- `src/pages/admin/WordManager.vue`
- `src/pages/admin/UserManager.vue`
- `src/pages/admin/admin.vue`（组合以上子组件）

### 第 5 层：应用入口（串行）
- `src/App.vue`（🔴 使用已验证模板）
- `src/main.ts`（🔴 使用已验证模板）

### 第 6 层：配置文件（可并行，使用已验证模板）
- `package.json`（🔴 npm view 获取真实版本号）
- `vite.config.ts`（🔴 使用已验证模板，根目录）
- `tsconfig.json`（🔴 使用已验证模板，根目录）
- `index.html`（🔴 使用已验证模板，根目录）
- `src/pages.json`（🔴 基于 Phase 1 路由表）
- `src/manifest.json`（🔴 uni-app 应用清单）
- `src/uni.scss`（🟡 本 Phase 2 定义的完整变量体系）
- `src/shims-vue.d.ts`（🟡 Vue SFC 类型声明）

---

## 十一、pages.json 路由配置

```json
{
  "pages": [
    { "path": "pages/home/home", "style": { "navigationBarTitleText": "", "navigationStyle": "custom" } },
    { "path": "pages/word-detail/word-detail", "style": { "navigationBarTitleText": "", "navigationStyle": "custom" } },
    { "path": "pages/libraries/libraries", "style": { "navigationBarTitleText": "", "navigationStyle": "custom" } },
    { "path": "pages/library-words/library-words", "style": { "navigationBarTitleText": "", "navigationStyle": "custom" } },
    { "path": "pages/profile/profile", "style": { "navigationBarTitleText": "", "navigationStyle": "custom" } },
    { "path": "pages/auth/auth", "style": { "navigationBarTitleText": "", "navigationStyle": "custom" } },
    { "path": "pages/admin/admin", "style": { "navigationBarTitleText": "", "navigationStyle": "custom" } }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "black",
    "navigationBarTitleText": "",
    "navigationBarBackgroundColor": "#F7F9FC",
    "backgroundColor": "#F7F9FC",
    "navigationStyle": "custom"
  },
  "tabBar": {
    "color": "#9CA3AF",
    "selectedColor": "#2563EB",
    "borderStyle": "black",
    "backgroundColor": "#FFFFFF",
    "list": [
      { "pagePath": "pages/home/home", "iconPath": "static/images/tab-home.png", "selectedIconPath": "static/images/tab-home-active.png", "text": "搜索" },
      { "pagePath": "pages/libraries/libraries", "iconPath": "static/images/tab-libraries.png", "selectedIconPath": "static/images/tab-libraries-active.png", "text": "词库" },
      { "pagePath": "pages/profile/profile", "iconPath": "static/images/tab-profile.png", "selectedIconPath": "static/images/tab-profile-active.png", "text": "我的" }
    ]
  }
}
```

---

## 十二、静态资源清单

| 资源文件 | 用途 | 引用位置 | 占位方案 |
|---------|------|---------|---------|
| `src/static/fonts/iconfont.ttf` | 图标字体 | App.vue @font-face | 最小合法 TTF 占位（Phase 3 Layer 2.5 创建） |
| `src/static/images/tab-home.png` | tabBar "搜索" 图标 | pages.json | 1×1 透明 PNG 占位 |
| `src/static/images/tab-home-active.png` | tabBar "搜索" active | pages.json | 1×1 透明 PNG 占位 |
| `src/static/images/tab-libraries.png` | tabBar "词库" 图标 | pages.json | 1×1 透明 PNG 占位 |
| `src/static/images/tab-libraries-active.png` | tabBar "词库" active | pages.json | 1×1 透明 PNG 占位 |
| `src/static/images/tab-profile.png` | tabBar "我的" 图标 | pages.json | 1×1 透明 PNG 占位 |
| `src/static/images/tab-profile-active.png` | tabBar "我的" active | pages.json | 1×1 透明 PNG 占位 |

---

## 框架必备文件校验结果

| 必备文件 | 在映射表中？ | 处理 |
|---------|----------|------|
| `index.html` | ✅ C4 | — |
| `package.json` | ✅ C1 | — |
| `vite.config.ts` | ✅ C2 | — |
| `tsconfig.json` | ✅ C3 | — |
| `src/pages.json` | ✅ C5 | — |
| `src/manifest.json` | ✅ C6 | — |
| `src/main.ts` | ✅ #3 | — |
| `src/App.vue` | ✅ #4 | — |
| `src/uni.scss` | ✅ C7 | — |
| `src/shims-vue.d.ts` | ✅ C8 | — |

**校验结果**：所有 10 个框架必备文件均已覆盖 ✅

---

## 进入 Phase 3 前验证

- [x] 每个源文件都有目标文件分配（或"不移植"原因）— 13 源 → 28 目标
- [x] Phase 1 中的每个交互 ID 至少有一个目标文件负责
- [x] 所有六个映射类别都有带代码示例的具体规则
- [x] 不可映射情况都有文档化的替代方案（U1~U10 + D1~D4）
- [x] 全局样式强制规则表已生成（G1~G20）
- [x] 复用分析已完成（7 共享组件 + SCSS 变量 + composable + 工具函数）
- [x] 复用约束清单已生成（C1~C10）
- [x] 差异化参数清单已生成（PageHeader 等关键组件）
- [x] SCSS 变量交叉验证已通过（所有值精确匹配）
- [x] 输入框模式分类已完成（INPUT-A/B + 映射表）
- [x] 多平台影响评估已完成（D1~D4）
- [x] H5 条件编译属性清单已生成
- [x] 框架必备文件校验全部通过
- [x] 图标迁移映射已完成（19 个码点 + 基础设施）
- [x] 静态资源清单已生成
- [x] Phase 3 拓扑排序已完成（0~6 层）
