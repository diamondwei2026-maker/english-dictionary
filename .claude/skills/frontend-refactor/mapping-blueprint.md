# Phase 2 迁移映射蓝图：React → Vue 3 + uni-app + uni-ui

> **重新编制日期**：2026-07-15
> **核心变更**：目标 UI 组件库从 iconfont 变为 **uni-ui**（uni-icons, uni-nav-bar, uni-search-bar, uni-section, uni-card, uni-easyinput, uni-data-select, uni-forms）

---

## 迁移对：react → uniapp (Vue 3 + uni-ui)

**源框架**：React 18 + TypeScript + Tailwind 4.1 + 内联 style 对象 + lucide-react 图标  
**目标框架**：Vue 3 (Composition API `<script setup>`) + uni-app + **uni-ui**  
**图标方案**：uni-icons 优先 + iconfont 补充（8 个无匹配图标）  
**平台**：H5 + 微信小程序（跨平台）

---

## 步骤 1-2：迁移规则（六大类别 + uni-ui 组件映射）

### 1. 组件模型映射

| 源模式 (React) | 目标模式 (Vue 3 uni-app) | 说明 |
|---------------|------------------------|------|
| `function Comp({prop}: Props)` | `<script setup lang="ts">` + `defineProps<Props>()` | React FC → Vue SFC |
| `useState(init)` | `ref(init)` / `reactive(obj)` | 状态管理 |
| `useState` setter | 直接赋值 `ref.value = x` | 响应式更新 |
| `React.CSSProperties` | SCSS class + `:style` 仅动态值 | 样式迁移到 SCSS |
| `<div>` | `<view>` | uni-app 标准 |
| `<span>` | `<text>` | 文本节点 |
| `<img>` | `<image>` | uni-app 图片 |
| `<input>` | `<input></input>`（**必须闭合**，NC-02） | uni-app input |
| `<textarea>` | `<textarea auto-height></textarea>`（NC-03） | uni-app textarea |
| `<button>` | `<view>` + @click（自定义样式） | 完全自定义按钮 |
| `<select>` | `<!-- #ifdef H5 --><select>...<!-- #endif -->` + `<!-- #ifndef H5 --><picker>...<!-- #endif -->` | 平台自适应 |
| `props.children` | `<slot />` | 子内容传递 |
| `style={{ ... }}` 内联静态值 | SCSS class | 声明式样式 |
| `e.target.style.xxx = '...'` | `:class` 绑定 + SCSS class 切换 | 命令式 → 声明式 |

### 2. 事件系统映射

| 源模式 (React) | 目标模式 (Vue 3 uni-app) |
|---------------|------------------------|
| `onClick={handler}` | `@click="handler"` |
| `onChange={e => set(e.target.value)}` | `@input="e => state = e.detail.value"` (uni-app input) |
| `onFocus={e => ...}` | `@focus="onFocus"` |
| `onBlur={e => ...}` | `@blur="onBlur"` |
| `onKeyDown={e => e.key==='Enter' && submit()}` | `@confirm="submit"` (uni-app input) |
| `e.target.value` | `e.detail.value` (uni-app) |
| `e.preventDefault()` | `.prevent` 修饰符 |
| `e.stopPropagation()` | `.stop` 修饰符 |

### 3. 样式映射

| 源模式 | 目标模式 | 说明 |
|--------|---------|------|
| 内联 `style={{ padding: '16px 24px' }}` | SCSS `.card { padding: 32rpx 48rpx; }` | 提取到 scoped SCSS |
| 内联动态 style | `:style` 绑定 + computed | 仅动态值保留内联 |
| `backdropFilter: 'blur(16px)'` | `/* #ifdef H5 */ backdrop-filter: blur(32rpx); /* #endif */` | H5 条件编译 |
| `position: 'fixed'` (BottomNav) | pages.json tabBar 原生 | 不手写底部导航 |
| `cursor: 'pointer'` | `/* #ifdef H5 */ cursor: pointer; /* #endif */` | H5 only |
| `transition: '...'` on input | `/* #ifdef H5 */ transition: ...; /* #endif */` | NC-04 |
| `resize: 'vertical'` | `/* #ifdef H5 */ resize: vertical; /* #endif */` | NC-08 |
| `aspectRatio: '16/9'` | 固定高度或 padding-top hack | 小程序不支持 |
| `overflow: 'hidden'` (image) | `/* #ifdef H5 */ overflow: hidden; /* #endif */` | NC-05 |

> **单位换算**：`1px → 2rpx`（uni-app 750rpx 设计稿基准）

### 4. 路由映射

| 源模式 | 目标模式 |
|--------|---------|
| `useState<ViewState>` 手动路由 | `pages.json` 声明式路由 + uni API |
| `navigate({ name: 'home' })` | `uni.switchTab({ url: '/pages/home/index' })` |
| `navigate({ name: 'wordDetail', wordId })` | `uni.navigateTo({ url: '/pages/word-detail/index?wordId=' + id })` |
| `navigate({ name: 'libraries' })` | `uni.switchTab({ url: '/pages/libraries/index' })` |
| `navigate({ name: 'libraryWords', libraryId })` | `uni.navigateTo({ url: '/pages/library-words/index?libraryId=' + id })` |
| `navigate({ name: 'profile' })` | `uni.switchTab({ url: '/pages/profile/index' })` |
| `navigate({ name: 'login' }), mode='login'` | `uni.navigateTo({ url: '/pages/auth/index?mode=login' })` |
| `navigate({ name: 'register' }), mode='register'` | `uni.navigateTo({ url: '/pages/auth/index?mode=register' })` |
| `navigate({ name: 'admin', tab })` | `uni.navigateTo({ url: '/pages/admin/index?tab=' + tab })` |
| `BottomNav` 3 标签页 | `pages.json` → `tabBar` 配置（原生） |
| 返回上一页 | `uni.navigateBack()` |

### 5. 状态管理映射

| 源模式 | 目标模式 |
|--------|---------|
| App.tsx `useState<ViewState>` | `pages.json` 路由替代 |
| App.tsx `useState<AuthUser \| null>` | App.vue `provide('user', user)` |
| 局部 `useState` | `ref()` / `reactive()` |
| `useMemo(fn, deps)` | `computed(fn)` |
| `useEffect(fn, deps)` | `watch(source, fn)` / `onMounted(fn)` |
| AdminView 局部 CRUD state | AdminView 内 `ref([])` / `reactive` |

### 6. uni-ui 组件映射（🆕 核心变更）

> uni-ui 是 uni-app 官方跨平台 UI 库。以下是源项目模式与 uni-ui 组件的对应关系。

#### 6a. 页面头部 — uni-nav-bar 替代 PageHeader

| 源模式 (React) | uni-ui 组件 | 适用场景 |
|---------------|-----------|---------|
| 自定义 `<div>` header + backdrop-filter | **手写** — uni-nav-bar 不支持 backdrop-filter 条件编译 | 所有页面 — 需自定义 SCSS + #ifdef H5 |
| 返回按钮 + 标题 | `<uni-nav-bar>` 或手写 | 简单返回+标题页面 |
| 返回 + 标题 + 右侧操作 | 手写（灵活度更高） | 管理后台等复杂 header |

**结论**：uni-nav-bar 的定制性有限（不支持自定义背景 blur、不支持 slot 复杂布局），建议仍用手写 PageHeader 组件 + SCSS。但简单场景（如 auth 页面）可考虑 uni-nav-bar。

#### 6b. 搜索栏 — uni-search-bar

| 源模式 (React) | uni-ui 组件 | 说明 |
|---------------|-----------|------|
| HomeView 搜索框（Search 图标 + input + focus/blur） | `<uni-search-bar>` | ✅ **高度匹配**：内置搜索图标、@input/@focus/@blur、v-model、bgColor 可设 #F1F5F9 |
| AdminView 单词搜索框 | `<uni-search-bar>` | ✅ 同上，含 clearButton |

**但需注意**：uni-search-bar 默认样式（圆角、背景色、clearButton）需要通过 props 调整以匹配原型设计值。原型 focus 态 border-color 变化和 bg 变化需要通过 CSS 覆盖实现。

#### 6c. 区块标题 — uni-section

| 源模式 (React) | uni-ui 组件 | 说明 |
|---------------|-----------|------|
| `SLabel` / SECTION_LABEL 样式 | `<uni-section>` | ✅ **匹配**：`title` prop + `type="line"` 装饰线 |

**注意**：源项目 SECTION_LABEL 样式（fontSize: 11px/22rpx, fontWeight: 600, color: #9CA3AF, letterSpacing: 2px/4rpx, uppercase）需通过 CSS 覆盖 uni-section 默认样式。

#### 6d. 卡片 — uni-card

| 源模式 (React) | uni-ui 组件 | 说明 |
|---------------|-----------|------|
| 简单卡片（统计、设置菜单） | `<uni-card>` | ✅ 简单场景可用 |

**但**：uni-card 的 padding/shadow/border 可配，但复杂布局（如渐变背景用户卡、AI 生成卡片）需手写。

#### 6e. 输入框 — uni-easyinput

| 源模式 (React) | uni-ui 组件 | 说明 |
|---------------|-----------|------|
| AuthView 表单输入框 | `<uni-easyinput>` | ✅ 支持 prefixIcon、suffixIcon、密码可见性切换、@focus/@blur |
| AdminView 表单输入框 | `<uni-easyinput>` | ✅ 支持 v-model、placeholder、disabled |

**注意**：uni-easyinput 支持 `prefixIcon` 和 `suffixIcon` 属性，可传入 uni-icons 的 type 字符串。密码可见性切换有内置支持。但 focus/blur 边框色变化（#E5E7EB → #2563EB）需要 CSS 覆盖或手动 :class 控制。

#### 6f. 下拉选择 — uni-data-select

| 源模式 (React) | uni-ui 组件 | 说明 |
|---------------|-----------|------|
| `<select>` 词库选择 | `<uni-data-select>` | ✅ 跨平台选择器 |
| `<select>` 词性选择 | `<uni-data-select>` | ✅ 跨平台选择器 |

#### 6g. 表单 — uni-forms

| 源模式 (React) | uni-ui 组件 | 说明 |
|---------------|-----------|------|
| 手写表单验证 | `<uni-forms>` + `<uni-easyinput>` | ✅ 内置校验规则 |

#### 6h. 图标 — uni-icons

| 源图标 (lucide) | uni-icons type | 覆盖 |
|----------------|---------------|------|
| Search | `search` | ✅ |
| ArrowLeft | `arrowleft` | ✅ |
| ArrowRight | `arrowright` | ✅ (方向性使用) |
| ChevronRight | `arrowright` | ✅ |
| Eye | `eye` | ✅ |
| EyeOff | 需 iconfont 补充 | ❌ |
| Check | `checkmarkempty` | ✅ |
| X (close) | `close` / `clear` | ✅ |
| Settings | `gear` | ✅ |
| Plus | `plus` | ✅ |
| RefreshCw | `refreshempty` | ✅ |
| Loader (spinner) | `spinner-cycle` | ✅ |
| Trash2 | `trash` | ✅ |
| User | `person` | ⚠️ 近似 |
| Sparkles | 需 iconfont 补充 | ❌ |
| BookOpen | 需 iconfont 补充 | ❌ |
| Shield | 需 iconfont 补充 | ❌ |
| LogOut | 需 iconfont 补充 | ❌ |
| Target | 需 iconfont 补充 | ❌ |
| Type | 需 iconfont 补充 | ❌ |
| Users | 需 iconfont 补充 | ❌ |

---

## 步骤 3：逐文件映射表

| # | 源文件 | 目标文件 | 难度 | 关键说明 |
|---|--------|---------|------|---------|
| **数据层** | | | | |
| 1 | `src/app/data/types.ts` | `src/data/types.ts` | 🟢 低 | 直接移植；ViewState 改用路由后不再需要 |
| 2 | `src/app/data/mockData.ts` | `src/data/mockData.ts` | 🟢 低 | 直接移植 |
| **工具函数** | | | | |
| 3 | — (提取) | `src/utils/helpers.ts` | 🟢 低 | getWordById, getLibraryById, filterWords, generateId |
| 4 | — (提取) | `src/utils/posColors.ts` | 🟢 低 | POS_COLORS 词性颜色映射 |
| **Composable** | | | | |
| 5 | — (提取) | `src/composables/useInputFocus.ts` | 🟢 低 | 共享 focus 管理 composable |
| **共享组件（Layer 2）** | | | | |
| 6 | — (新建) | `src/components/PageHeader.vue` | 🟡 中 | 共享页头（5+ 页面使用）；backdrop-filter H5 条件编译 |
| 7 | — (新建) | `src/components/EmptyState.vue` | 🟢 低 | 共享空状态（4 处使用） |
| 8 | — (新建) | `src/components/WordCard.vue` | 🟡 中 | 共享单词卡片（3 处使用） |
| 9 | `src/app/components/PhysicalImage.tsx` | `src/components/PhysicalImage.vue` | 🟡 中 | 8 个 SVG 组件 → Vue SFC |
| **页面（Layer 3-4）** | | | | |
| 10 | `src/app/components/HomeView.tsx` | `src/pages/home/index.vue` | 🟡 中 | uni-search-bar + WordCard + 今日一词 |
| 11 | `src/app/components/WordDetailView.tsx` | `src/pages/word-detail/index.vue` | 🟡 中 | URL 参数 wordId；PageHeader + PhysicalImage |
| 12 | `src/app/components/LibrariesView.tsx` → 拆分 | `src/pages/libraries/index.vue` | 🟡 中 | 词库卡片列表；uni-icons + 渐变背景 |
| 13 | `src/app/components/LibrariesView.tsx` → 拆分 | `src/pages/library-words/index.vue` | 🟡 中 | URL 参数 libraryId；PageHeader + WordCard + EmptyState |
| 14 | `src/app/components/ProfileView.tsx` | `src/pages/profile/index.vue` | 🟡 中 | 未登录/已登录条件渲染；inject user；管理员入口 |
| 15 | `src/app/components/AuthView.tsx` | `src/pages/auth/index.vue` | 🟡 中 | URL 参数 mode；uni-icons 密码切换；uni-easyinput（可选） |
| 16 | `src/app/components/AdminView.tsx` | `src/pages/admin/index.vue` | 🔴 高 | 5 section 切换；CRUD；uni-data-select；可拆分子组件 |
| **应用入口（Layer 5）** | | | | |
| 17 | `src/app/App.tsx` | `src/App.vue` | 🔴 关键 | 路由全部由 pages.json 替代；仅保留 user provide + 全局样式 |
| 18 | `src/main.tsx` | `src/main.ts` | 🟢 低 | uni-app 入口模板（验证过的） |
| **配置文件（Layer 6）** | | | | |
| 19 | `src/styles/*.css` | `src/uni.scss` | 🟡 中 | 全局 SCSS 变量 + mixin + 设计 Token |
| 20 | — (框架要求) | `pages.json` | 🔴 关键 | uni-app 路由 + tabBar 配置 |
| 21 | — (框架要求) | `manifest.json` | 🟢 低 | uni-app 应用配置 |
| 22 | `vite.config.ts` | `vite.config.ts` | 🟡 中 | uni-app Vite 配置（已验证模板） |
| 23 | `package.json` | `package.json` | 🟡 中 | uni-app + uni-ui 依赖 |
| 24 | `index.html` | `index.html` | 🟢 低 | uni-app 入口 HTML（已验证模板） |
| 25 | — (框架要求) | `tsconfig.json` | 🟢 低 | TypeScript 配置 |
| 26 | — (框架要求) | `src/shims-vue.d.ts` | 🟢 低 | Vue SFC 类型声明 |

### 不移植的文件

| 源文件 | 原因 |
|--------|------|
| `vite.config.ts` (源) | uni-app Vite 配置替代 |
| `postcss.config.mjs` | uni-app 内置 PostCSS |
| `pnpm-workspace.yaml` | 目标不需要 |
| `default_shadcn_theme.css` | shadcn 不适用 |
| `guidelines/Guidelines.md` | 保留参考 |
| `src/app/components/BottomNav.tsx` | pages.json tabBar 替代 |
| `src/app/components/figma/ImageWithFallback.tsx` | 未使用 |
| `src/styles/tailwind.css` | 不使用 Tailwind |
| `src/styles/theme.css` | shadcn 不适用 |
| `src/styles/fonts.css` | App.vue 条件编译处理字体 |
| `src/app/components/ui/*.tsx` (30+) | uni-ui + 手写替代 |

---

## 步骤 4：uni-ui 组件使用决策表

### 决策表

| uni-ui 组件 | 是否使用 | 使用场景 | 不使用原因 |
|-----------|---------|---------|-----------|
| **uni-icons** | ✅ 使用 | 所有图标（优先） | — |
| **uni-nav-bar** | ⚠️ 部分使用 | auth 等简单返回页面 | 不支持 backdrop-filter 条件编译、定制性有限 |
| **uni-search-bar** | ✅ 使用 | HomeView + AdminView 搜索 | 需 CSS 覆盖定制 focus 态 |
| **uni-section** | ⚠️ 部分使用 | 简单区块标题 | 定制样式需 CSS 覆盖 |
| **uni-card** | ❌ 不使用 | — | 源项目卡片布局高度定制（渐变背景、复杂内部结构） |
| **uni-easyinput** | ⚠️ 可选 | AuthView 表单输入 | 需评估与 INPUT-A/INPUT-B 模式的兼容性 |
| **uni-data-select** | ✅ 使用 | AdminView 下拉选择 | 跨平台选择器 |
| **uni-forms** | ❌ 不使用 | — | 表单逻辑简单（仅 AuthView），手写足够 |
| **uni-list** | ❌ 不使用 | — | 源项目列表项布局高度定制（单词卡片结构） |

### uni-search-bar 定制要点

uni-search-bar 默认样式与原型差异及调整方案：

| 属性 | uni-search-bar 默认 | 原型值 | 调整方式 |
|------|-------------------|--------|---------|
| bgColor | #F8F8F8 | #F1F5F9 | prop `bgColor="#F1F5F9"` |
| radius | 10 (px) | 16px / 32rpx | prop `:radius="32"` |
| placeholder | 搜索 | "输入英文单词..." | prop `placeholder="输入英文单词..."` |
| border | 无 | 1.5px solid transparent (→#2563EB focus) | CSS 深度选择器覆盖 |
| focus 背景 | 不变 | → #fff | 需通过 @focus 事件 + :class 控制 |

> ⚠️ 如果 CSS 覆盖过于复杂，fallback 方案：仍手写搜索栏但使用 uni-icons 的 search 图标。

---

## 步骤 4b：输入框 focus/blur 样式模式分类

### 4b-1. 源项目输入框模式枚举

| 模式 ID | blur 态 border | blur 态 bg | focus 态 border | focus 态 bg | 出现位置 | 次数 |
|---------|---------------|-----------|----------------|------------|---------|------|
| **INPUT-A** | transparent | #F1F5F9 | #2563EB | #fff | HomeView + AdminView 全部 | 10+ |
| **INPUT-B** | #E5E7EB | #fff | #2563EB | #fff (不变) | AuthView 全部 | 4 |

### 4b-2. 目标实现

#### uni.scss 全局 mixin

```scss
// INPUT-A: 透明边框 + 灰色背景 → 蓝色边框 + 白色背景
@mixin input-pattern-a {
  border: 3rpx solid transparent;
  background: #F1F5F9;
  outline: none;
  box-sizing: border-box;
  line-height: 1.4;
}
@mixin input-pattern-a-focused {
  border-color: #2563EB;
  background: #fff;
}

// INPUT-B: 灰色边框 + 白色背景 → 蓝色边框
@mixin input-pattern-b {
  border: 3rpx solid #E5E7EB;
  background: #fff;
  outline: none;
  box-sizing: border-box;
  line-height: 1.4;
}
@mixin input-pattern-b-focused {
  border-color: #2563EB;
}
```

#### useInputFocus composable

```ts
// src/composables/useInputFocus.ts
import { ref } from 'vue'
export function useInputFocus() {
  const isFocused = ref(false)
  const onFocus = () => { isFocused.value = true }
  const onBlur = () => { isFocused.value = false }
  return { isFocused, onFocus, onBlur }
}
```

---

## 步骤 5：不可移植的特性

| # | 源特性 | 问题 | 替代方案 | 差距 |
|---|--------|------|---------|------|
| D1 | 根容器 `maxWidth: 430px` | 小程序不需要 | H5 条件编译 `max-width: 860rpx; margin: 0 auto` | 🟢 |
| D2 | 自定义 `BottomNav` 组件 | 小程序推荐原生 tabBar | pages.json tabBar | 🟡 无法 blur、样式受限 |
| D3 | Header `backdropFilter: blur()` | 小程序不支持 | H5 条件编译，小程序半透明纯色背景 | 🟡 小程序无 blur |
| D4 | `:hover` / `cursor: pointer` | 小程序无鼠标 | H5 条件编译 | 🟢 |
| D5 | 内联 SVG (PhysicalImage) | 小程序 SVG 支持有限 | H5 保留内联 SVG，小程序 → image 回退或条件编译 | 🟡 |
| D6 | CSS `transition` on input (NC-04) | 小程序原生 input 冲突 | H5 条件编译 | 🟡 |
| D7 | `resize: vertical` on textarea | 小程序不支持 | H5 条件编译 | 🟢 |
| D8 | `<select>` HTML 元素 | 小程序无 select | uni-data-select 或 picker | 🟡 交互方式不同 |

---

## 步骤 6：全局样式强制规则表

| 规则 ID | 描述 | 实施方式 | 适用文件 |
|---------|------|---------|---------|
| **G1** | 吸顶 header H5 blur | `/* #ifdef H5 */ backdrop-filter: blur(32rpx); /* #endif */` | word-detail, libraries, library-words, profile(已登录), admin |
| **G2** | 吸顶 header 半透明背景 | `rgba(255,255,255,0.9)` 或 `rgba(247,249,252,0.92)` | 所有有 header 的页面 |
| **G3** | 页面顶部安全区 padding | padding-top ≥ 104rpx | 所有页面 |
| **G4** | 条件分支中 header 不丢失背景 | 未登录/空数据等状态保留 header | profile, library-words |
| **G5** | 全局字体 | `font-family: system-ui, -apple-system, 'Inter', sans-serif` | App.vue |
| **G6** | 全局 box-sizing | `/* #ifdef H5 */ * { box-sizing: border-box; } /* #endif */` | App.vue |
| **G7** | 全局 line-height | App.vue `line-height: 1.5` | App.vue |
| **G8** | 全局 input outline | `/* #ifdef H5 */ input, textarea { outline: none; } /* #endif */` | App.vue |
| **G9** | 全局 text 换行 | NC-07: 长文本用 view | 所有页面 |
| **G10** | input 必须有显式 height | padding + line-height × font-size | 所有 input (NC-01) |
| **G11** | input 必须闭合标签 | `<input></input>` | 所有 input (NC-02) |
| **G12** | textarea auto-height | `<textarea auto-height></textarea>` | 所有 textarea (NC-03) |
| **G13** | input 容器 min-height | 包裹容器 min-height = input height | auth (NC-06) |
| **G14** | input 样式模式标注 | INPUT-A / INPUT-B | 所有 input |
| **G15** | useInputFocus composable | 统一使用 `useInputFocus()` | 所有含 input 的文件 |
| **G16** | 页面背景色 | `background: #F7F9FC` | 所有页面 |
| **G17** | H5 容器居中 | `/* #ifdef H5 */ max-width: 860rpx; margin: 0 auto; /* #endif */` | App.vue (D1) |
| **G18** | cursor pointer (H5) | `/* #ifdef H5 */ cursor: pointer; /* #endif */` | 所有可点击元素 (D4) |
| **G19** | 🆕 uni-icons 优先 | 图标优先使用 `<uni-icons>`，无匹配时用 iconfont 补充 | 所有文件 |
| **G20** | 🆕 uni-search-bar 定制 | 使用 uni-search-bar 时需配置 bgColor/radius + CSS 覆盖 focus 态 | home, admin |

---

## 步骤 7：复用分析

### 7a. 组件复用

| 复用模式 | 出现次数 | 出现位置 | uni-ui 方案 | 决策 |
|---------|---------|---------|-----------|------|
| **页头** (标题+可选返回+blur) | 7 | 全部页面 | uni-nav-bar（部分） | 🟢 手写 `<PageHeader>` — uni-nav-bar 不够灵活 |
| **搜索栏** | 2 | home, admin | uni-search-bar | ✅ 使用 uni-search-bar + CSS 定制 |
| **单词列表项** | 3 | home(全部), home(搜索), library-words | — | 🟢 提取 `<WordCard>` |
| **空状态** | 4 | home, library-words, admin×2 | — | 🟢 提取 `<EmptyState>` |
| **区块标签** | 8+ | 大部分页面 | uni-section | ⚠️ 简单场景用 uni-section，复杂用手写 |
| **主按钮** | 8+ | auth, admin, profile | — | 🟡 全局 CSS `.btn-primary` |
| **词库卡片** | 1 | libraries | — | 不提取（仅 1 处） |

### 7b. 样式复用

| 复用模式 | 出现次数 | SCSS 抽象 |
|---------|---------|----------|
| header padding + 背景 | 5 | `$header-pt: 104rpx; $header-px: 48rpx; $header-bg-white; $header-bg-gray` |
| 吸顶 header | 5 | `@mixin sticky-header` (含 H5 条件编译 blur) |
| 卡片 | 10+ | `@mixin card($radius: 40rpx, $shadow: ...)` |
| 主按钮 | 8+ | `.btn-primary` |
| section 标签 | 8+ | `.section-label` 或 uni-section + CSS 覆盖 |

### 7c. 逻辑复用

| 复用模式 | 出现次数 | 抽象 |
|---------|---------|------|
| navigateToWordDetail(id) | 6+ | `goToWordDetail(id)` |
| mockWords.find(w => w.id === id) | 3 | `getWordById(id)` |
| mockLibraries.find(l => l.id === id) | 4 | `getLibraryById(id)` |
| filterWords(query, words) | 2 | `filterWords(query, words)` |
| focus/blur 边框切换 | 10+ | `useInputFocus()` composable |
| genId() | 1 | `generateId()` |
| getPosColor(pos) | 2 | `getPosColor(pos)` from posColors.ts |

### 7d. 复用约束（注入 Phase 3 Agent Prompt）

```
✅ 页头：必须使用 <PageHeader> 组件
✅ 搜索栏：必须使用 <uni-search-bar>（home, admin）
✅ 空状态：必须使用 <EmptyState> 组件
✅ 单词列表项：必须使用 <WordCard> 组件
✅ 区块标签：优先使用 <uni-section>，复杂场景用手写 .section-label
✅ Input focus 管理：必须使用 useInputFocus() composable
✅ 卡片样式：使用 SCSS @mixin card
✅ 主按钮：使用全局 CSS .btn-primary
✅ 工具函数：从 @/utils/helpers 导入
✅ 词性颜色：从 @/utils/posColors 导入 getPosColor
✅ 图标：优先使用 <uni-icons>，无匹配时用 iconfont

❌ 禁止手写 .header 样式（用 PageHeader）
❌ 禁止手写空状态 div（用 EmptyState）
❌ 禁止手写 onFocus/onBlur 内联 style（用 useInputFocus）
❌ 禁止使用 emoji 替代图标
```

---

## 依赖拓扑排序

```
第 0 层：类型 + 工具函数（无依赖）
  ├── src/data/types.ts
  ├── src/utils/helpers.ts
  └── src/utils/posColors.ts

第 1 层：Mock 数据 + Composable
  ├── src/data/mockData.ts        → 依赖 types.ts
  └── src/composables/useInputFocus.ts → 无依赖

第 2 层：共享组件（先于页面锁定）
  ├── src/components/PageHeader.vue    → 无依赖
  ├── src/components/EmptyState.vue    → 无依赖
  ├── src/components/PhysicalImage.vue → 无依赖
  └── src/components/WordCard.vue      → 依赖 types.ts, posColors

第 3 层：叶子页面
  ├── src/pages/home/index.vue         → PageHeader, WordCard, uni-search-bar, uni-icons
  ├── src/pages/auth/index.vue         → PageHeader, useInputFocus, uni-icons
  ├── src/pages/word-detail/index.vue  → PageHeader, PhysicalImage, posColors, uni-icons
  ├── src/pages/libraries/index.vue    → PageHeader, uni-icons
  └── src/pages/library-words/index.vue → PageHeader, WordCard, EmptyState, uni-icons

第 4 层：组合页面
  ├── src/pages/profile/index.vue      → PageHeader, uni-icons
  └── src/pages/admin/index.vue        → PageHeader, uni-search-bar, EmptyState, PhysicalImage, useInputFocus, uni-data-select, uni-icons

第 5 层：应用入口
  ├── src/App.vue                      → 全局样式 + user provide
  └── src/main.ts                      → uni-app 入口（已验证模板）

第 6 层：配置文件 + 静态资源
  ├── src/uni.scss                     → SCSS 变量 + mixin
  ├── pages.json                       → 路由 + tabBar
  ├── manifest.json
  ├── vite.config.ts                   → 已验证模板
  ├── tsconfig.json
  ├── package.json                     → 真实版本号
  ├── index.html                       → 已验证模板
  ├── src/shims-vue.d.ts
  └── src/static/                      → 字体 + tabBar 图标占位
```

---

## Phase 2 验证清单

- [x] 每个源文件都有目标文件分配（或不移植原因）
- [x] 100+ 交互 ID 都有对应的目标文件负责
- [x] 六大映射类别 + uni-ui 组件映射都有带代码示例的规则
- [x] 8 项不可移植特性都有文档化的替代方案
- [x] 全局样式强制规则表已生成（G1-G20，含 uni-ui 特定规则）
- [x] uni-ui 组件使用决策表已完成（7 个组件逐一分析）
- [x] 输入框样式模式分类已完成（INPUT-A/INPUT-B + composable）
- [x] 复用分析已完成（组件 + 样式 + 逻辑）
- [x] 图标方案已确定：uni-icons 优先 + iconfont 补充
- [x] 🔴 框架必备文件校验通过
- [x] 依赖拓扑排序已完成（6 层）
- [ ] **用户确认：等待审阅**

---

**请确认以上映射蓝图。** 你可以：
- 直接确认 → 进入 Phase 3（代码生成）
- 修改某个 uni-ui 组件的使用决策
- 对图标方案或复用策略提出调整意见
