# Vue 3 框架分析与参考指南

当**源**项目或**目标**项目为 Vue 3 时使用本指南。涵盖两个方向：分析 Vue 3 项目（第一阶段）和生成 Vue 3 代码（第三阶段）。

---

## 项目检测

满足以下条件即为 Vue 3 项目：
- `package.json` 中包含版本号为 `^3.x` 的 `vue`
- 文件使用 `.vue` 扩展名（SFC — 单文件组件）
- 模板语法：`v-if`、`v-for`、`v-model`、`{{ interpolation }}`
- 组合式 API：`ref()`、`reactive()`、`computed()`、`watch()`
- 选项式 API：`export default { data(), methods: {}, computed: {} }`

## 构建工具检测

| 配置文件 | 构建工具 |
|-------------|-----------|
| `vite.config.*` + `@vitejs/plugin-vue` | Vite |
| `vue.config.js` | Vue CLI (Webpack) |
| `nuxt.config.ts` | Nuxt 3 |

---

## 组件识别

### 页面级组件
- 位于 `src/pages/`、`src/views/` 或 `src/screens/`
- 在 Nuxt 中：`pages/` 目录（文件系统路由）

### 组合式 API 与选项式 API

```vue
<!-- 组合式 API（新项目默认推荐） -->
<script setup lang="ts">
import { ref, computed } from 'vue';
const count = ref(0);
const double = computed(() => count.value * 2);
</script>

<!-- 选项式 API -->
<script>
export default {
  data() { return { count: 0 }; },
  computed: { double() { return this.count * 2; } },
};
</script>
```

**检测方法**：`<script setup>` 标签 = 组合式 API。没有 `setup` = 大概率是选项式 API。

---

## Vue 3 常见模式

### 模式 1：ref / reactive 响应式状态

```vue
<script setup>
const query = ref('');          // 原始值 → ref
const form = reactive({         // 对象 → reactive
  phone: '',
  password: '',
});
</script>
```

**等价物**：React 的 useState。注意：在 script 中访问 ref 需要使用 `.value`。

### 模式 2：computed（派生状态）

```vue
<script setup>
const results = computed(() =>
  words.value.filter(w => w.word.includes(query.value))
);
</script>
```

**等价物**：React 的 useMemo。自动追踪依赖。

### 模式 3：watch / watchEffect（副作用）

```vue
<script setup>
watch(wordId, (newId) => {
  fetchWord(newId);
});
</script>
```

**等价物**：React 的 useEffect（带依赖数组）。

### 模式 4：v-if / v-show / v-for（模板指令）

```vue
<template>
  <div v-if="loading">加载中...</div>
  <div v-else-if="error">{{ error }}</div>
  <div v-else>
    <Card v-for="item in items" :key="item.id" :data="item" />
  </div>
</template>
```

### 模式 5：v-model（双向绑定）

```vue
<input v-model="query" />
<!-- 等价于： -->
<input :value="query" @input="query = $event.target.value" />
```

### 模式 6：props 与 emits

```vue
<!-- 子组件 -->
<script setup>
const props = defineProps<{
  wordId: string;
  onNavigate: (view: ViewState) => void;
}>();
const emit = defineEmits<{
  logout: [];
  submit: [data: FormData];
}>();
</script>
```

### 模式 7：provide / inject（上下文等价物）

```vue
<!-- 祖先组件 -->
<script setup>
provide('user', user);
</script>

<!-- 后代组件 -->
<script setup>
const user = inject('user');
</script>
```

---

## 路由类型

| 线索 | 路由方案 |
|-------|--------|
| 依赖中有 `vue-router` | Vue Router |
| `pages/` 目录 + `<NuxtPage>` | Nuxt 文件系统路由 |
| 无路由，手动 `component :is` | 手动路由 |

### Vue Router 模式

```ts
// 导航
router.push('/word-detail?id=123');
router.push({ name: 'word-detail', params: { id: '123' } });
router.back();  // 返回上一页

// 在组件中
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();
const wordId = route.params.id;
```

---

## 样式系统

| 模式 | 样式方案 |
|---------|--------|
| `<style scoped>` | 局部作用域 CSS（Vue SFC 内置） |
| `<style module>` | CSS Modules（Vue SFC 内置） |
| `class="px-4 bg-white"` | Tailwind |
| `:class` 绑定 | 动态类名（Vue 指令） |
| `:style` 绑定 | 动态内联样式 |

---

## Vue 3 → React 映射表（用于反向迁移）

| Vue 3 | React |
|-------|-------|
| `ref()` | `useState()` |
| `reactive()` | `useState()`（配合对象） |
| `computed()` | `useMemo()` |
| `watch()` | `useEffect()` |
| `onMounted()` | `useEffect([], ...)` |
| `defineProps<>()` | 组件参数中的 Props 接口 |
| `defineEmits<>()` | 回调 Props |
| `v-if` | `{condition && ...}` |
| `v-for` | `.map()` |
| `v-model` | `value` + `onChange` |
| `<slot>` | `{children}` |
| `<slot name="x">` | 具名 Props |
| `provide/inject` | `createContext` / `useContext` |
| `<Teleport>` | `createPortal` |
| `<style scoped>` | CSS Modules 或 CSS-in-JS |
| `<Transition>` | CSS transitions 或 framer-motion |

---

## 需要处理的 Vue 特有功能

从 Vue 3 迁出时：

- **指令**（`v-if`、`v-for`、`v-show`、`v-model`、`v-bind`）→ React 等价写法
- **作用域插槽** → render props 或组件组合
- **`<Transition>` / `<TransitionGroup>`** → CSS transitions 或动画库
- **`<KeepAlive>`** → React 没有直接等价物；需使用状态保持方案
- **`<Teleport>`** → React 的 `createPortal()`
- **`<Suspense>`** → React `<Suspense>`（React 18+）
- **Pinia / Vuex stores** → Redux / Zustand / Context
- **Composables**（`useXxx()`）→ 自定义 Hooks（`useXxx()`）

迁入 Vue 3 时：

- **React hooks** → Vue Composables（大多可 1:1 映射）
- **Context** → `provide/inject`
- **条件渲染** → `v-if` / `v-show`
- **列表渲染** → `v-for` 配合 `:key`
- **Fragments** → `<template>` 或隐式多根节点（Vue 3 支持）

---

## 目标框架必备文件清单

> **🔴 关键**：当 Vue 3 / uni-app 作为**目标框架**时，Phase 2 必须在逐文件映射完成后，
> 使用本清单进行 diff 校验。任何不在映射表中的必备文件必须显式追加一行映射。
> 这是防止"漏了 index.html"这类问题的唯一机制。

### Vue 3 (Vite) 必备文件

| 文件 | 性质 | 说明 |
|------|------|------|
| `index.html` | 🔴 入口 | Vite 的 HTML 入口，必须包含 `<div id="app">` + `<script type="module" src="/src/main.js">` |
| `vite.config.js/ts` | 🔴 构建配置 | Vite 配置文件 |
| `package.json` | 🔴 项目清单 | 依赖声明 |
| `src/main.js/ts` | 🔴 应用入口 | `createApp(App).mount('#app')` |
| `src/App.vue` | 🔴 根组件 | Vue 应用根组件 |

### uni-app 必备文件

| 文件 | 性质 | 说明 |
|------|------|------|
| `index.html` | 🔴 H5 入口 | uni-app H5 模式需要此文件作为 Vite 开发服务器入口 |
| `src/pages.json` | 🔴 路由配置 | 页面路由 + tabBar + globalStyle，uni-app 的核心配置文件 |
| `src/manifest.json` | 🔴 应用清单 | uni-app 应用配置 |
| `src/main.js` | 🔴 应用入口 | `createSSRApp` 入口 |
| `src/App.vue` | 🔴 根组件 | 包含全局样式和 provide |
| `src/uni.scss` | 🟡 全局样式 | 全局 SCSS 变量 + mixin（设计 token） |
| `vite.config.ts` | 🔴 构建配置 | `@dcloudio/vite-plugin-uni` |
| `package.json` | 🔴 项目清单 | 🔴 `@dcloudio/*` 包全部使用 alpha 预发布版本号 → 版本号必须从 `npm view @dcloudio/uni-app versions --json` 实时获取，**禁止编造** |
| `tsconfig.json` | 🟡 类型配置 | TypeScript 配置 |

### 🆕 uni-app 不应包含的文件/依赖

| 文件/依赖 | 原因 | 替代方案 |
|---------|------|---------|
| `vue-router` | uni-app 由 `pages.json` 管理路由 | `uni.navigateTo / uni.switchTab / uni.navigateBack` |
| `src/router/index.ts` | uni-app 不需要 Vue Router 配置文件 | `pages.json` 的 `pages` 数组 |
| `pinia` | 简单状态（1-2 个 reactive 对象）不需要 store 库 | `src/store/xxx.ts` — `reactive()` 即可 |

### uni-app 生命周期钩子导入约定

> **🔴 关键**：uni-app 的生命周期钩子（`onLoad`、`onShow` 等）在 `<script setup>` 中
> **不会自动可用**——即使 `@dcloudio/types` 将它们声明为全局类型，TypeScript 编译不会报错，
> 但运行时缺少 import 会直接抛出 `ReferenceError: onLoad is not defined`。
> 这是 **Phase 3 Agent 最容易漏掉的 import**，也是静态编译无法发现的运行时错误。

#### 必须显式导入的钩子

| 钩子 | 导入语句 | 用途 | 触发时机 |
|------|---------|------|---------|
| `onLoad` | `import { onLoad } from '@dcloudio/uni-app'` | 接收页面参数（options） | 页面加载 |
| `onShow` | `import { onShow } from '@dcloudio/uni-app'` | 页面显示时的副作用 | 页面显示/从后台切回 |
| `onReady` | `import { onReady } from '@dcloudio/uni-app'` | 页面渲染完成后的操作 | 初次渲染完成 |
| `onHide` | `import { onHide } from '@dcloudio/uni-app'` | 页面隐藏时的清理 | 页面隐藏/切到后台 |
| `onUnload` | `import { onUnload } from '@dcloudio/uni-app'` | 页面卸载时的清理 | 页面销毁 |
| `onPullDownRefresh` | `import { onPullDownRefresh } from '@dcloudio/uni-app'` | 下拉刷新 | 用户下拉 |
| `onReachBottom` | `import { onReachBottom } from '@dcloudio/uni-app'` | 触底加载更多 | 滚动到底部 |

#### 正确用法示例

```vue
<!-- ✅ 正确：显式导入 -->
<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const wordId = ref('');

onLoad((options?: Record<string, string>) => {
  wordId.value = options?.wordId || '';
});
</script>

<!-- ❌ 错误：缺少 import，构建不报错但运行时崩溃 -->
<script setup lang="ts">
import { ref } from 'vue';
// 忘了 import { onLoad }

const wordId = ref('');

onLoad((options) => {
  // ReferenceError: onLoad is not defined
});
</script>
```

#### Phase 2/3/4 集成

- **Phase 2**：在 Step 4 映射规则中，对每个使用了页面参数的页面，在"事件映射"行追加一条：`props → onLoad(options) (import from @dcloudio/uni-app)`
- **Phase 3**：Agent Prompt 第一节（角色与任务）如果目标框架包含 uni-app，追加提示："所有页面生命周期钩子（onLoad、onShow 等）必须从 @dcloudio/uni-app 显式导入"
- **Phase 4**：Step 1 静态验证增加 grep 检查（见 `phase4-verification.md` Step 1a-2）

### Taro 必备文件

| 文件 | 性质 | 说明 |
|------|------|------|
| `src/app.config.ts` | 🔴 应用配置 | 路由 + tabBar + window |
| `src/app.tsx` 或 `.ts` | 🔴 应用入口 | Taro 应用根组件 |
| `src/index.html` | 🔴 H5 入口 | Taro H5 入口 HTML |
| `project.config.json` | 🔴 微信配置 | 微信小程序项目配置 |
| `package.json` | 🔴 项目清单 | Taro 核心依赖 |
| `config/index.ts` | 🔴 构建配置 | Taro 编译配置 |
| `tsconfig.json` | 🟡 类型配置 | TypeScript 配置 |

### Next.js 必备文件

| 文件 | 性质 | 说明 |
|------|------|------|
| `next.config.js/ts` | 🔴 构建配置 | Next.js 配置 |
| `package.json` | 🔴 项目清单 | Next.js 依赖 |
| `tsconfig.json` | 🟡 类型配置 | TypeScript 配置 |
| `src/app/layout.tsx` | 🔴 根布局 | App Router 根布局 |
| `src/app/page.tsx` | 🔴 首页 | 首页路由 |

### 使用方式（Phase 2 集成）

在 Phase 2 生成逐文件映射表后，执行以下校验：

```markdown
## 步骤 2.N: 框架必备文件校验

将目标框架的必备文件清单与逐文件映射表做 diff：

1. 对于每个 🔴 必备文件，检查映射表的"目标文件"列中是否存在
2. 对不在映射表中的必备文件，显式追加一行：
   | N+1 | — (框架要求) | <必备文件路径> | 🟢 低 | 框架必备文件，内容参考框架模板 |
3. 在最终的映射表中用 `[REQUIRED]` 标记这些追加的行
```

> **反例**：本次 react→uniapp 迁移漏了 `index.html` 正是因为映射表没有这一行，
> Phase 3 的依据只有映射表，所以 Agent 不会生成它。本清单的校验就是堵这个口子。

---

## 🔴 uni-app 已验证文件模板（Phase 3 直接使用，禁止自由发挥）

> **来源**：2026-07-14 `figma-prototype` (React inline-style) → uni-app 迁移，
> 5 个文件位置错误 + 2 个文件内容缺失导致 `uni build` 产出零 JS、页面白屏，
> 花费约 90 分钟试错才全部定位并修复。以下每条规则和模板均经过 `npm run build` 验证。

### 文件精确位置速查表

| 文件 | 正确位置 | ❌ 错误位置及后果 |
|------|---------|-------------------|
| `index.html` | **项目根目录** | `src/index.html` → Vite 找不到入口 HTML |
| `vite.config.ts` | **项目根目录** | `src/vite.config.ts` → uni CLI 找不到 → 不加载 uni 插件 → `.vue` 不编译 |
| `tsconfig.json` | **项目根目录** | `src/tsconfig.json` → TypeScript 找不到配置 |
| `src/pages.json` | **`src/` 下** | 项目根目录 → `uni build` 报 `ENOENT: src/pages.json` |
| `src/manifest.json` | **`src/` 下** | 项目根目录 → `uni build` 报 `ENOENT: src/manifest.json` |

### index.html 已验证模板

> 🔴 三条红线：
> 1. `id="app"` 必须精确匹配——uni-app 运行时挂载到 `#app`
> 2. `<script type="module" src="./src/main.ts">` 必须存在——没有它 Vite 不打包任何 `.vue` 文件，dist 零 JS
> 3. viewport `maximum-scale=1.0, user-scalable=no` 必须包含——H5 端移动端适配

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title><!-- 项目名称 --></title>
    <link rel="icon" href="data:image/svg+xml,..." />
    <style>
      html, body { height: 100%; margin: 0; padding: 0; }
      #app { height: 100%; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./src/main.ts"></script>
  </body>
</html>
```

### main.ts 已验证模板

> 🔴 **关键**：`export function createApp()` 是 uni-app 编译要求的入口签名。
> `createApp().app.mount('#app')` 是 H5 端自挂载——没有这行页面白屏。
> 该 alpha 版本的 Vite 插件不会自动注入挂载逻辑，必须显式调用。

```ts
import { createSSRApp } from 'vue'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  return { app }
}

// Self-mount for H5 development
createApp().app.mount('#app')
```

### vite.config.ts 已验证模板

> 🔴 **关键**：
> 1. `@` 别名指向 `src/`——不配置会导致所有 `@/components/` 导入解析失败
> 2. `additionalData` 为每个 `.vue` 的 `<style lang="scss">` 自动注入 `uni.scss`——页面直接使用其中的变量和 mixin，无需手动 import
> 3. `@use ... as *` 优于 `@import`——Dart Sass 3.0 将废弃 `@import`；`as *` 使所有变量全局可用

```ts
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

export default defineConfig({
  plugins: [uni()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/uni.scss" as *;`,
      },
    },
  },
})
```

### tsconfig.json 已验证模板

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
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["@dcloudio/types"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"],
  "exclude": ["node_modules", "dist"]
}
```

### 🔴 构建产出自检命令

Phase 3 Layer 5-6 完成后，**必须**运行以下命令验证入口文件完整：

```bash
npm install --legacy-peer-deps 2>&1 | tail -3
npx uni build 2>&1 | tail -5

echo "=== JS files in dist ==="
find dist -name "*.js" | wc -l          # 预期 >= 10（入口 + 7页面 + 6组件 + utils）

echo "=== Script tags in HTML ==="
grep -c '<script' dist/build/h5/index.html  # 预期 >= 1（Vite 注入的入口 script）

echo "=== CSS files in dist ==="
find dist -name "*.css" | wc -l          # 预期 >= 5
```

**判定规则**：
- JS 文件数 = 0 → `index.html` 缺 `<script type="module" src="./src/main.ts">`
- JS 文件数 = 1 → `vite.config.ts` 位置错误，uni 插件未加载
- npm install 失败 → `package.json` 中 `@dcloudio/*` 版本号是编造的
