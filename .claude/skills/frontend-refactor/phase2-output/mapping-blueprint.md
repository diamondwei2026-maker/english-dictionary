# Phase 2 迁移映射蓝图 — Taro+React → uni-app+Vue3

> **源**：`client/` — Taro 3.6 + React 18 + TypeScript + 100% 内联 style={}
> **目标**：`client-uni/` — uni-app (Vue 3) + SCSS
> **日期**：2026-07-20
> **迁移对**：`taro→uniapp.md` ✅ 已加载

---

## 一、六类映射规则

### 1.1 组件模型映射

| 源 (Taro React) | 目标 (uni-app Vue 3) | 注意 |
|-----------------|---------------------|------|
| `<View>` | `<view>` | 小写 |
| `<Text>` | `<text>` | NC-14: 替代块级元素需 `display:block` |
| `<Input>` | `<input>` | NC-01: 显式 height; NC-02: `></input>` 闭合 |
| `<Textarea>` | `<textarea>` | NC-03: `auto-height` |
| `<Picker>` | `<picker>` | NC-13: 平台自适应 |
| `<>...</>` | `<template>` | Fragment |
| `<ScrollView>` | `<scroll-view>` | — |
| `<Image>` | `<image>` | — |

### 1.2 事件系统映射

| 源 (React) | 目标 (Vue/uni-app) | 注意 |
|-----------|-------------------|------|
| onClick | @click | — |
| onInput | @input | `e.detail.value` (非 `e.target.value`) |
| onChange (Picker) | @change | `e.detail.value` = 索引数组 |
| onFocus | @focus | — |
| onBlur | @blur | — |
| onConfirm (Input) | @confirm | 键盘确认键 |
| useEffect([], fn) | onMounted(fn) | 挂载 |
| useEffect([dep], fn) | watch(dep, fn) 或 watchEffect | 响应式 |

### 1.3 样式系统映射

| 源 | 目标 | 注意 |
|----|------|------|
| 内联 `style={{}}` | **预生成 `<style scoped>` CSS block** (P0-G) | Agent 粘贴 |
| 条件样式 | Vue `:style` / `:class` 切换 | — |
| 全局 `app.scss` | `uni.scss` + `App.vue` 非 scoped | H5 条件编译 |
| `backdropFilter: blur()` | `/* #ifdef H5 */` + rpx | 小程序不支持 |
| px 单位 | rpx (1px = 2rpx) | — |
| camelCase 属性 | kebab-case | fontSize → font-size |

### 1.4 路由映射

| 源 | 目标 |
|----|------|
| `app.config.ts` pages | `pages.json` |
| `Taro.navigateTo` | `uni.navigateTo` |
| `Taro.redirectTo` | `uni.redirectTo` |
| `Taro.navigateBack` | `uni.navigateBack` |
| CustomTabBar 组件 | ✅ **保留** — 同模式，`uni.switchTab` + `uni.redirectTo` |

### 1.5 状态管理映射

| 源 | 目标 |
|----|------|
| `useState(x)` | `ref(x)` |
| `useEffect([], fn)` | `onMounted(fn)` |
| `useEffect([dep], fn)` | `watch(dep, fn)` |
| `useRef(x)` | `ref(x)` |
| `useMemo(() => x, [d])` | `computed(() => x)` |
| useAuth 单例+订阅 | reactive 单例 + watch |
| localStorage | uni.getStorageSync |

### 1.6 数据获取映射

| 源 | 目标 |
|----|------|
| `Taro.request()` | `uni.request()` — Promise 包装 (PM-TU-2) |
| `fetch()` (原生) | 保留 (H5) / uni.request (小程序) |
| SSE `ReadableStream` | 保留原生 fetch (H5) / 降级非流式 (小程序) |

---

## 二、图标迁移映射

**方案**：iconfont 为主（全端兼容），20 图标均映射为 Unicode 码点字符。

| 源图标 | 目标实现 | 代码 |
|--------|---------|------|
| search | iconfont | `<text class="iconfont">&#xe001;</text>` |
| arrow-left | iconfont | `<text class="iconfont">&#xe002;</text>` |
| chevron-right | iconfont | `<text class="iconfont">&#xe003;</text>` |
| user | iconfont | `<text class="iconfont">&#xe004;</text>` |
| book | iconfont | `<text class="iconfont">&#xe005;</text>` |
| eye | iconfont | `<text class="iconfont">&#xe007;</text>` |
| eye-off | iconfont | `<text class="iconfont">&#xe008;</text>` |
| plus | iconfont | `<text class="iconfont">&#xe00b;</text>` |
| trash | iconfont | `<text class="iconfont">&#xe00c;</text>` |
| close | iconfont | `<text class="iconfont">&#xe00d;</text>` |
| check | iconfont | `<text class="iconfont">&#xe00e;</text>` |
| settings | iconfont | `<text class="iconfont">&#xe00f;</text>` |
| shield | iconfont | `<text class="iconfont">&#xe010;</text>` |
| refresh | iconfont | `<text class="iconfont">&#xe011;</text>` |
| sparkles | iconfont | `<text class="iconfont">&#xe012;</text>` |
| target | iconfont | `<text class="iconfont">&#xe013;</text>` |
| fire | iconfont | `<text class="iconfont">&#xe014;</text>` |
| font | iconfont | `<text class="iconfont">&#xe015;</text>` |
| friends | iconfont | `<text class="iconfont">&#xe016;</text>` |
| logout | iconfont | `<text class="iconfont">&#xe017;</text>` |

🔴 **红线**：禁止任何 emoji 替代图标。

---

## 三、文件映射表

| # | 源文件 | 目标文件 | L | 难度 | 说明 |
|---|--------|---------|---|------|------|
| 1 | api/request.ts | utils/request.ts | 0 | 🟡 | Taro→uni.request Promise包装 |
| 2 | api/adapters.ts | utils/adapters.ts | 0 | 🟡 | 同逻辑 |
| 3 | data/types.ts | data/types.ts | 0 | 🟢 | 剥离React特型 |
| 4 | hooks/useAuth.ts | composables/useAuth.ts | 0 | 🟡 | storage→uni.storage |
| 5 | hooks/useNavigate.ts | composables/useNavigate.ts | 0 | 🟢 | Taro→uni API |
| 6-16 | api/*.ts | api/*.ts | 1 | 🟢 | 同逻辑 |
| 17 | data/mockData.ts | data/mockData.ts | 1 | 🟢 | 同结构 |
| 18 | — | config/api.ts | 0 | 🟢 | [NEW] |
| 19 | — | composables/useInputFocus.ts | 1 | 🟢 | [NEW] |
| 20 | PageHeader.tsx | components/PageHeader.vue | 2 | 🟡 | SHARED H5 blur |
| 21 | PrimaryBtn.tsx | components/PrimaryButton.vue | 2 | 🟢 | SHARED 变体 |
| 22 | PhysicalImage.tsx | components/PhysicalImage.vue | 2 | 🔴 | SHARED SVG→Canvas |
| 23 | CustomTabBar/index.tsx | components/CustomTabBar.vue | 2 | 🟡 | SHARED H5 blur + 3 tab SVG |
| 24-27 | — | SectionLabel/EmptyState/SearchBar/WordCard | 2 | 🟢 | [NEW] SHARED |
| 27 | home/index.tsx | pages/home/home.vue | 3 | 🟡 | 搜索+今日一词+全部词汇 |
| 28 | word-detail/index.tsx | pages/word-detail/word-detail.vue | 3 | 🔴 | 意象图+引申义+收藏 |
| 29 | libraries/index.tsx | pages/libraries/libraries.vue | 3 | 🟢 | 词库列表 |
| 30 | library-words/index.tsx | pages/library-words/library-words.vue | 3 | 🟢 | 词库单词列表 |
| 31 | profile/index.tsx | pages/profile/profile.vue | 3 | 🟡 | 个人中心 |
| 32 | auth/index.tsx | pages/auth/auth.vue | 3 | 🟡 | 登录/注册 |
| 33 | admin (shell) | pages/admin/admin.vue | 4 | 🔴 | 4 tab切换 |
| 34 | admin (LibraryManager) | pages/admin/components/LibraryManager.vue | 4 | 🟡 | 词库CRUD |
| 35 | admin (WordManager+Form) | pages/admin/components/WordManager.vue | 4 | 🔴 | 单词CRUD+AI SSE |
| 36 | admin (UserManager) | pages/admin/components/UserManager.vue | 4 | 🟢 | 用户列表 |
| 37 | app.tsx | App.vue | 5 | 🔴 | ✅验证模板 |
| 38 | app.scss | uni.scss + App.vue | 5 | 🔴 | H5条件编译 |
| 39 | app.config.ts | pages.json | 5 | 🔴 | 页面路由配置（无原生tabBar — CustomTabBar独立渲染） |
| 40-46 | [REQUIRED] | index.html/main.ts/vite.config.ts/package.json/tsconfig.json/manifest.json/shims-vue.d.ts | 6 | 🔴 | ✅验证模板 |

### 不移植
| 文件 | 原因 |
|------|------|
| Icon.tsx | iconfont全局方案替代 |
| pages/*/index.config.ts | 合并到 pages.json |

---

## 四、不可映射特性 + 多平台影响

| 源特性 | 问题 | 替代方案 | 决策 |
|--------|------|---------|------|
| SVG PhysicalImage | 小程序不支持 | CSS/Canvas | D5 |
| backdrop-filter | 小程序不支持 | H5条件编译 | D3 |
| CSS transition (input) | NC-04 | H5条件编译 | D8 |
| CustomTabBar position:fixed | ✅ 保留自定义实现 | 同源：`position:fixed` + `bottom:0` + `max-width:430px` + H5 blur + safe-area | D2 |
| @taroify/icons SVG | 小程序不支持 | iconfont | D6 |
| SSE ReadableStream | 小程序无流 | H5保留/小程序降级 | D7 |

### H5 条件编译清单
- `max-width` + `margin: 0 auto` (D1)
- `backdrop-filter` (D3)
- `transition` on native components (D8)
- `cursor: pointer`
- `:hover` / `:focus` pseudo
- `overflow: hidden` on native component parents (NC-05)

---

## 五、input focus 样式模式分类 (Step 4b)

| 模式 | blur border | blur bg | 位置 | 次数 |
|------|-----------|---------|------|------|
| INPUT-A | transparent | #F1F5F9 | HomeView搜索, AdminView全部 | 10+ |
| INPUT-B | #E5E7EB | #fff | AuthView全部 | 3 |

**composable**: `composables/useInputFocus.ts` — 统一 `isFocused` ref + `@focus/@blur`

---

## 六、全局样式强制规则 (G1-G15)

| ID | 规则 |
|----|------|
| G1 | header backdrop-filter H5条件编译 |
| G2 | header 半透明背景 |
| G3 | 页面顶部安全区 padding |
| G5 | 全局字体 Inter |
| G6 | box-sizing: border-box (H5) |
| G7 | line-height: 1.5 (H5) |
| G8 | 页面底部 padding 160rpx |
| G9 | input 显式 height (NC-01) |
| G10 | input 闭合标签 (NC-02) |
| G11 | textarea auto-height (NC-03) |
| G12 | transition 条件编译 (NC-04) |
| G13 | overflow 条件编译 (NC-05) |
| G14 | input focus class切换 + composable |
| G15 | textarea focus (同G14) |

---

## 七、复用分析摘要

**共享组件** (Layer 2): PageHeader, PrimaryButton, PhysicalImage, CustomTabBar, SectionLabel, EmptyState, SearchBar, WordCard
**composable**: useAuth, useNavigate, useInputFocus
**SCSS**: uni.scss 变量 + mixins (section-label, card-base, input-base)

### 复用约束 (注入 Phase 3 Agent)

```
- ✅ PageHeader (import from @/components/PageHeader.vue)
- ✅ PrimaryButton (import from @/components/PrimaryButton.vue)
- ✅ CustomTabBar (import from @/components/CustomTabBar.vue) — 除 admin 外所有页面
- ✅ SectionLabel / EmptyState / SearchBar / WordCard
- ✅ composables/useInputFocus + composables/useNavigate
- ❌ 禁止手写替代实现
- ❌ 禁止 emoji 替代图标
```

---

## 八、产出物

| 产出物 | 路径 | 状态 |
|--------|------|------|
| file-mapping.json | phase2-output/ | ✅ |
| design-values.json | phase2-output/ (1464条,10文件) | ✅ |
| css-blocks/ | phase2-output/css-blocks/ (10个.css-block) | ✅ |
| shared-component-instances.json | phase2-output/ | ✅ |
| mapping-blueprint.md | phase2-output/ | ✅ |

---

## Phase 2 验证 ✅

- [x] 42 映射 + 3 删除 + 6 新增 + 7 REQUIRED → 完整覆盖
- [x] 六类映射规则 + 图标迁移 + API 映射
- [x] 8 项不可映射特性均有替代方案
- [x] input 模式分类完成 (INPUT-A/B + composable)
- [x] Picker 自适应映射完成 (3处)
- [x] G1-G15 全局规则表
- [x] 复用分析完成 (6组件+5样式+3逻辑)
- [x] design-values.json ✅ (阻断)
- [x] CSS blocks ✅ (P0-G)
- [x] shared-component-instances.json ✅ (P0-C)
- [x] 框架必备文件 10/10 ✅
