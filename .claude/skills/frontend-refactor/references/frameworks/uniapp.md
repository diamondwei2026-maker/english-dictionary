# uni-app 框架指南 — 目标项目生成参考

当**目标**项目为 uni-app（Vue 3 + 多端编译）时使用本指南。涵盖项目结构、配置文件模板、
已验证文件模板、构建自检命令和常见陷阱。

---

## 项目结构速查

```
<project>/
├── index.html                  → 🔴 根目录（不在 src/ 下）
├── package.json                → 🔴 根目录
├── vite.config.ts              → 🔴 根目录（不在 src/ 下）
├── tsconfig.json               → 🔴 根目录
├── src/
│   ├── pages.json              → 🔴 src/ 下（不在根目录）
│   ├── manifest.json           → 🔴 src/ 下（不在根目录）
│   ├── uni.scss                → 🟡 src/ 下 — 全局 SCSS 变量，uni-app 自动注入
│   ├── main.ts                 → 🔴 src/ 下
│   ├── App.vue                 → 🔴 src/ 下
│   ├── shims-vue.d.ts          → 🟡 src/ 下 — Vue SFC 类型声明（TypeScript 必需）
│   ├── data/                   → 类型 + 数据
│   ├── store/                  → reactive store
│   ├── composables/            → 可复用 composable
│   ├── components/             → 共享组件
│   ├── pages/                  → 页面（与 pages.json path 对应）
│   └── static/
│       ├── fonts/              → 字体文件（iconfont.ttf）
│       └── images/             → tabBar 图标 + 图片
```

### 文件位置速查表

| 文件 | 正确位置 | ❌ 常见错误 |
|------|---------|-----------|
| `index.html` | 项目根目录 | 放 `src/` 下 |
| `vite.config.ts` | 项目根目录 | 放 `src/` 下 |
| `tsconfig.json` | 项目根目录 | 放 `src/` 下 |
| `package.json` | 项目根目录 | — |
| `src/pages.json` | `src/` 下 | 放根目录 |
| `src/manifest.json` | `src/` 下 | 放根目录 |
| `src/main.ts` | `src/` 下 | — |
| `src/App.vue` | `src/` 下 | — |
| `src/uni.scss` | `src/` 下 | — |
| `src/shims-vue.d.ts` | `src/` 下 | 漏建 — TypeScript 编译报错 |

---

## 🔴 已验证文件模板

> 以下模板经过完整构建+启动验证。Phase 3 生成入口文件时必须使用这些模板，
> **禁止 Agent 自由发挥**。

### index.html（根目录）

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <script>
      var coverSupport = 'CSS' in window && typeof CSS.supports === 'function' && (CSS.supports('top: env(a)') ||
        CSS.supports('top: constant(a)'))
      document.write(
        '<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0' +
        (coverSupport ? ', viewport-fit=cover' : '') + '" />')
    </script>
    <title><!-- 应用名称 --></title>
    <!--preload-links-->
    <!--app-context-->
  </head>
  <body>
    <div id="app"><!--app-html--></div>
    <!-- 🔴 此行不可省略 — 缺少则 dist 零 JS 文件 -->
    <script type="module" src="./src/main.ts"></script>
  </body>
</html>
```

### main.ts（src/ 下）

```ts
import { createSSRApp } from 'vue';
import App from './App.vue';

export function createApp() {
  const app = createSSRApp(App);
  return { app };
}

// 🔴 自挂载不可省略 — 省略则运行时无渲染
createApp().app.mount('#app');
```

### vite.config.ts（根目录）

```ts
import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 🔴 不可用 @use — 会与 App.vue 中的 @import 冲突导致构建失败
        // `@use` rules must be written before any other rules
        additionalData: `@import "@/uni.scss";`,
      },
    },
  },
});
```

### pages.json（src/ 下）— 含 tabBar 示例

```json
{
  "pages": [
    {
      "path": "pages/home/home",
      "style": { "navigationBarTitleText": "", "navigationStyle": "custom" }
    }
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
      {
        "pagePath": "pages/home/home",
        "iconPath": "static/images/tab-home.png",
        "selectedIconPath": "static/images/tab-home-active.png",
        "text": "首页"
      }
    ]
  }
}
```

### manifest.json（src/ 下）

```json
{
  "name": "应用名称",
  "appid": "__UNI__XXXXXXX",
  "description": "应用描述",
  "vueVersion": "3",
  "mp-weixin": {
    "appid": "",
    "setting": { "urlCheck": false },
    "usingComponents": true
  }
}
```

### tsconfig.json（根目录）

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "sourceMap": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "lib": ["ESNext", "DOM"],
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["@dcloudio/types"],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"],
  "exclude": ["node_modules", "dist", "unpackage"]
}
```

### shims-vue.d.ts（src/ 下 — 🟡 TypeScript 必需）

```ts
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}
```

### App.vue（src/ 下）

```vue
<template>
  <view class="app-root">
    <router-view />
  </view>
</template>

<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';
onLaunch(() => { console.log('App Launch'); });
onShow(() => { console.log('App Show'); });
onHide(() => { console.log('App Hide'); });
</script>

<style lang="scss">
/* ── Icon Font (unicode glyphs, no font file needed in mini program) ── */
.iconfont {
  font-family: 'iconfont' !important;
  font-size: inherit;
  font-style: normal;
  /* #ifdef H5 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* #endif */
}

/* ── H5 only: Google Fonts, @font-face, global resets ── */
/* 🔴 以下全部必须用 #ifdef H5 包裹 —— WXSS 不支持 @import url(),
   通配选择器 *, html/body 选择器（NC-09~NC-11） */
/* #ifdef H5 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap');

@font-face {
  font-family: 'iconfont';
  src: url('@/static/fonts/iconfont.ttf') format('truetype');
}

* {
  box-sizing: border-box;
}

html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: Inter, system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

#app {
  height: 100%;
}
/* #endif */

/* ── Animations (WXSS supports @keyframes) ── */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

<style lang="scss">
.app-root {
  font-family: Inter, system-ui, -apple-system, sans-serif;
  background: #F7F9FC;
  position: relative;

  /* #ifdef H5 */
  min-height: 100vh;
  max-width: 430px;
  margin: 0 auto;
  /* #endif */
}
</style>
```

---

## 构建自检脚本（Phase 3 Layer 5-6 完成后必须运行）

```bash
cd <target-project>
npm install --legacy-peer-deps 2>&1 | tail -3
npx uni build 2>&1 | tail -5

echo "=== JS files in dist ==="
find dist -name "*.js" | wc -l          # 预期 >= 10

echo "=== Script tags in HTML ==="
grep -c '<script' dist/build/h5/index.html  # 预期 >= 1

echo "=== CSS files in dist ==="
find dist -name "*.css" | wc -l          # 预期 >= 5
```

**判定规则**：

| 症状 | 根因 | 修复 |
|------|------|------|
| JS 文件数 = 0 | `index.html` 缺 `<script type="module" src="./src/main.ts">` | 补齐 script 标签 |
| JS 文件数 = 1-2 | `vite.config.ts` 位置错误 → uni/Vue 插件未加载 | 移到根目录 |
| npm install 失败 | 版本号编造 | `npm view` 获取真实版本号 |
| 构建报 ENOENT pages.json | `pages.json` 放根目录而非 `src/` | 移到 `src/` |
| SCSS `@use` 错误 | `additionalData` 用了 `@use` 而非 `@import` | 改用 `@import "@/uni.scss"` |
| Cannot find module iconfont.ttf | `url('~@/...')` 前缀无效 | 改用 `url('@/...')` |
| tsc Cannot find module '.vue' | 缺 `shims-vue.d.ts` | 创建声明文件 |
| 构建报 tabBar 图标缺失 | `static/images/*.png` 不存在 | 创建占位文件 |
| 构建报 WXSS token `url` | `@import url(http...)` 未用 `#ifdef H5` 包裹（NC-09） | 用条件编译包裹 |
| 构建报 WXSS `unexpected token '*'` | 通配选择器未用 `#ifdef H5` 包裹（NC-10） | 用条件编译包裹 |
| 小程序白屏只显示 tabBar | `app.wxss` 解析失败（NC-09~NC-11 任一触发） → timeout | Grep 检查源文件 + 编译产物 WXSS |

---

## uni-app 特有注意事项

### uni.scss 注入方式

- uni-app **不自动注入** `uni.scss` 到组件 SCSS。必须通过 `vite.config.ts` 的 `additionalData` 手动注入
- **🔴 不可用 `@use`** — Dart Sass 的 `@use` 必须出现在所有其他规则之前，但 `additionalData` 注入的代码位于每个 SCSS 文件末尾，会导致"@use rules must be written before any other rules"错误
- **✅ 必须用 `@import`** — `additionalData: '@import "@/uni.scss";'`。虽然 Sass 已废弃 `@import`（Dart Sass 3.0 移除），但这是 uni-app 当前唯一可行方案

### @ 别名

- `vite.config.ts` 中配置 `resolve.alias: { '@': '/src' }`
- `tsconfig.json` 中配置 `paths: { "@/*": ["src/*"] }`
- `url()` 中的路径直接用 `@/`，不可用 `~@/`（webpack 独有前缀，Vite 不支持）

### 路由系统

- 路由由 `pages.json` 配置，不使用 `vue-router`
- tabBar 页面：`uni.switchTab({ url: '/pages/xxx/xxx' })`
- 普通页面：`uni.navigateTo({ url: '/pages/xxx/xxx?param=value' })`
- 返回：`uni.navigateBack()`
- **页面参数获取**：`onLoad((options) => { options.paramName })` — 来自 `@dcloudio/uni-app`

### 原生 tabBar vs CSS 底部导航

- uni-app 推荐使用 `pages.json` 中的原生 `tabBar` 配置
- tabBar 图标必须是**物理 PNG 文件**放在 `src/static/images/` 下
- tabBar 配置示例见上方 `pages.json` 模板

### 条件编译

```css
/* #ifdef H5 */
backdrop-filter: blur(16px);
/* #endif */
```

```html
<!-- #ifdef H5 -->
<select v-model="x"><option>...</option></select>
<!-- #endif -->
<!-- #ifndef H5 -->
<picker mode="selector" :range="options" @change="fn"></picker>
<!-- #endif -->
```

### 路由参数

```ts
import { onLoad } from '@dcloudio/uni-app';
onLoad((options: any) => {
  // options.wordId, options.libraryId, etc.
});
```

### package.json 版本号

- `@dcloudio/*` 包使用 alpha 预发布版本（含 CI 时间戳）——**不可人工推算**
- 必须通过 `npm view @dcloudio/uni-app versions --json` 获取真实可用的版本号
- 所有 `@dcloudio/*` 包使用统一的 alpha 版本号（一起发布）
- `vue` 和 `sass` 可用语义版本 `"^3.4.21"`

### 静态资源

- `pages.json` 的 tabBar iconPath 在首次构建时**必须**存在（即使为空文件）
- iconfont.ttf 在首次构建时必须物理存在
- 建议 Phase 3 Layer 2.5 创建所有静态资源占位文件

### 原生组件合规（小程序端）

所有规则详见 `cross-platform-pitfalls.md`：
- NC-01：input 必须有显式 `height`
- NC-02：input 必须用闭合标签 `></input>` 非 `/>`
- NC-03：textarea 必须有 `auto-height`
- NC-04：transition 必须用 H5 条件编译包裹
- NC-05：overflow: hidden 必须用 H5 条件编译包裹
- NC-06：包裹容器必须有 `min-height`
- NC-07：长文本用 `<view>` 而非 `<text>`
- NC-08：textarea 不可有 `resize`
- 🔴 **NC-14**：`<text>` 默认 `display: inline` — 任何替代 HTML 块级元素（`<p>`、`<h1>`~`<h6>`）的 `<text>` 必须显式 `display: block`。否则：(a) nowrap+ellipsis 截断失效 (b) 后续兄弟元素不换行 (c) margin 不生效。**即使纯 H5 也受影响**，不依赖小程序原生渲染。

### `<text>` 组件 display 默认值（🔴 跨框架语义陷阱）

HTML `<p>`、`<h1>`~`<h6>` 默认 `display: block`；uni-app `<text>` 默认 `display: inline`。
当迁移保留了这些 HTML 标签的截断样式（`overflow:hidden; text-overflow:ellipsis; white-space:nowrap`）时，
必须显式添加 `display: block`，否则截断全盘失效——这是 CSS 正确但渲染结果不同的典型案例。
详见 `cross-platform-pitfalls.md` NC-14。

---

## Post-Mortem 故障录（实战验证）

> 以下故障来源于 React (inline-style) → uni-app 迁移实战，每个故障均包含
> 四段格式：现象 → 根因 → 修复 → 检测命令。

### PM-1: 版本号不匹配 → npm install 失败

**现象**：`npm install` 报 `No matching version found for @dcloudio/uni-components@2.0.2-xxx`

**根因**：`@dcloudio/*` 所有包使用统一的 alpha 版本号一起发布。`2.0.2-*` 是 `uni-app`
的 release line，但 `uni-components`、`uni-h5`、`uni-mp-weixin` 使用 `3.0.0-alpha-*` line。
两个 major 版本的包不能混用。

**修复**：
```bash
# 1. 先查最新版本
LATEST=$(npm view @dcloudio/uni-app@latest version)
# 2. 用 npm view 确认所有子包存在相同版本
npm view @dcloudio/uni-components@$LATEST version
npm view @dcloudio/uni-h5@$LATEST version
npm view @dcloudio/uni-mp-weixin@$LATEST version
# 3. 如果子包版本不存在（major 不一致），用统一的 alpha 版本号
#    从 npm view ... versions --json | tail -3 取最新 tag
```

**检测命令**：
```bash
grep -E '@dcloudio/' package.json | sort -u  # 检查版本号是否全部一致
npm install --legacy-peer-deps --dry-run 2>&1 | grep -i error
```

### PM-2: `ref` 导入源错误 → 构建失败

**现象**：`uni build` 报 `"ref" is not exported by "@dcloudio/uni-app"`

**根因**：Vue 3 的 `ref`、`reactive`、`computed`、`watch` 从 `vue` 导入；`@dcloudio/uni-app`
只导出 uni-app 特有的 API（`onLoad`、`onLaunch`、`onShow`、`onHide`、`uni.*` 等）。

**修复**：
```ts
// ❌ 错误
import { ref, onLoad } from '@dcloudio/uni-app';

// ✅ 正确
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
```

**检测命令**：
```bash
grep -rn "import.*ref.*from '@dcloudio/uni-app'" src/ --include="*.vue" --include="*.ts"
```

### PM-3: 审计脚本误报（多行标签/条件编译）

**现象**：`audit-phase4.sh` 报告 NC-03 Blocker（textarea 无 `auto-height`）、NC-04 Major
（transition 未条件编译），但实际代码已正确实现。脚本的 `grep -A2` 无法跨越多行 HTML
标签匹配属性，`grep -v '#ifdef H5'` 无法识别跨行条件编译包裹。

**根因**：这是审计脚本的设计局限——基于行级正则，而非 AST 解析。Vue SFC 的
`<textarea` 属性通常分布在 5-10 行内，脚本只能捕获首行。

**修复**：对审计脚本标记的每一项，用人工 `grep -A10` 跨行验证，不能仅看脚本退出码。
```bash
# 验证 textarea auto-height
grep -A10 '<textarea' src/ --include="*.vue" -rn | grep 'auto-height'

# 验证 transition 条件编译
grep -B2 -A2 'transition:' src/ --include="*.vue" -rn
```

**检测命令**：见上方两个 `grep` 命令 — 每次审计脚本运行后必须执行。

### PM-4: iconfont.ttf 不存在 → 生产构建 CSS 编译阶段失败

**现象**：`npm run dev` 正常启动（Vite 按需编译），但 `npm run build` 失败：
`Cannot find module iconfont.ttf`。生产构建全量编译所有 SCSS，`@font-face` 中的
`url('@/static/fonts/iconfont.ttf')` 要求文件物理存在。

**根因**：Vite dev 模式不预编译所有 SCSS——它只在浏览器请求时按需编译。但生产构建
遍历所有 SCSS 并遇到 `url()` 引用时，Vite 会尝试 resolve 该文件——不存在则抛错。

**修复**：Phase 3 Layer 2.5 创建最小合法 TTF 占位文件。
```bash
printf '\x00\x01\x00\x00\x00\x0A\x00\x80...' > src/static/fonts/iconfont.ttf
```

**检测命令**：
```bash
ls -la src/static/fonts/iconfont.ttf  # 必须物理存在
npm run build 2>&1 | grep -i "Cannot find\|ENOENT"
```

---

## 补充：依赖版本对齐规则（2026-07-15）

所有 `@dcloudio/*` 包使用**统一的 alpha 预发布版本号**——因为 DCloud 一起发布。
`package.json` 中所有 `@dcloudio/*` 包的版本号**必须是同一字符串**，不可混用
`npm view` 返回的不同包的 `latest` tag。

```json
// ✅ 正确：所有 @dcloudio/* 版本一致
{
  "@dcloudio/uni-app": "3.0.0-alpha-5020120260710001",
  "@dcloudio/uni-components": "3.0.0-alpha-5020120260710001",
  "@dcloudio/uni-h5": "3.0.0-alpha-5020120260710001",
  "@dcloudio/uni-mp-weixin": "3.0.0-alpha-5020120260710001",
  "@dcloudio/uni-cli-shared": "3.0.0-alpha-5020120260710001",
  "@dcloudio/vite-plugin-uni": "3.0.0-alpha-5020120260710001"
}

// ❌ 错误：混用 2.x 和 3.x（不同 release line）
{
  "@dcloudio/uni-app": "2.0.2-5010520260709001",
  "@dcloudio/uni-components": "3.0.0-alpha-5020120260710001"
}
```

### PM-5: `type: "module"` 导致 vite-plugin-uni import 失败 🆕

**现象**：`npx uni build` 报 `uni is not a function`

**根因**：`@dcloudio/vite-plugin-uni` 是 CJS 包。当 `package.json` 设置了
`"type": "module"` 时，Vite 以 ESM 方式加载 CJS 模块——`default` 导出变成
`{ default: fn }` 而非直接是 `fn`。`import uni from '...'` 拿到的是包装对象。

**修复**：
```ts
// ❌ ESM 模式下直接 import default 不可靠
import uni from '@dcloudio/vite-plugin-uni';

// ✅ 兼容方案
import uniPlugin from '@dcloudio/vite-plugin-uni';
const uni = (uniPlugin as any).default || uniPlugin;
```

**检测命令**：
```bash
grep -c '"type": "module"' package.json
# 如果输出 1 → 必须使用上述兼容方案
```

### PM-6: api/index.ts 缺少文件导出 → 构建失败 🆕

**现象**：`uni build` 报 `"xxx" is not exported by "src/api/index.ts"`

**根因**：API 服务文件迁移时，新增的 API 文件（如`ai.ts`）没有被加入到 `api/index.ts`
的 re-export 列表中。多个 Agent 各自生成 API 文件，但没有一个 Agent 负责更新索引文件。

**修复**：在 `api/index.ts` 中追加新 API 文件的导出声明。

**检测命令**：
```bash
# 检查 api/ 下所有 .ts 文件的导出是否都在 index.ts 中声明
diff <(ls src/api/*.ts | sed 's|.*/||; s|\.ts||' | grep -v index) \
     <(grep 'export.*from.*"./' src/api/index.ts | sed 's|.*"./||; s|".*||')
```

### PM-7: uni.request 错误的 Promise 解构 → TS2488 🆕

**现象**：`tsc --noEmit` 报 `Type '...' must have a '[Symbol.iterator]()' method`

**根因**：Agent 将 `uni.request` 按照 Taro.request 模式写为 `const [err, res] = await uni.request<T>()`。
但 uni.request 不返回元组，TypeScript 类型中不支持此解构。

**修复**：使用 Promise 包装模式：
```ts
const res = await new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
  uni.request({..., success: resolve, fail: reject});
});
```

**检测命令**：
```bash
grep -rn "const \[.*\] = await uni.request" src/  # 期望: 0
```

### PM-8: 审计脚本 NC-03 跨行误报 🆕

**现象**：`audit-phase4.sh` 报告 NC-03 Blocker（textarea 无 auto-height），
但跨行验证后所有 textarea 均有 `auto-height` 属性。

**根因**：审计脚本的 `grep -A2` 只匹配 textarea 标签后 2 行。Vue SFC 的多行
`<textarea>` 属性可能分布在 5-10 行，`auto-height` 在 grep 窗口外 → 被误报缺失。

**验证命令（每次审计脚本运行后必须执行）**：
```bash
grep -A15 '<textarea' src/ --include="*.vue" -rn | grep -c 'auto-height'
```
