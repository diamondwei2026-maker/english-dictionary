# 迁移指南：React → Vue 3（Composition API）

## 目标项目结构

```
<project-name>/
├── src/
│   ├── App.vue                  # 根组件
│   ├── main.ts                  # 入口：createApp
│   ├── router/
│   │   └── index.ts             # Vue Router 配置
│   ├── views/                   # 页面组件
│   │   ├── HomeView.vue
│   │   ├── WordDetailView.vue
│   │   ├── LibrariesView.vue
│   │   ├── LibraryWordsView.vue
│   │   ├── ProfileView.vue
│   │   ├── AuthView.vue
│   │   └── AdminView.vue
│   ├── components/              # 共享组件
│   │   ├── BottomNav.vue
│   │   ├── PhysicalImage.vue
│   │   └── ui/                  # 基础 UI 组件
│   ├── data/                    # 类型定义、模拟数据
│   │   ├── types.ts
│   │   └── mockData.ts
│   ├── stores/                  # Pinia stores（状态管理）
│   │   ├── auth.ts
│   │   └── words.ts
│   └── styles/                  # 全局样式
├── vite.config.ts
├── package.json
└── tsconfig.json
```

## 组件模型映射

| React | Vue 3（Composition API） |
|-------|------------------------|
| `function Component(props)` | `<script setup>` + `defineProps` |
| `useState(x)` | `ref(x)`（原始类型）/ `reactive({...})`（对象） |
| `useEffect(fn, [])` | `onMounted(fn)` |
| `useEffect(fn, [deps])` | `watch(deps, fn)` / `watchEffect(fn)` |
| `useMemo(fn, deps)` | `computed(fn)` |
| `useCallback(fn, deps)` | 不需要；`<script setup>` 中的函数是稳定的 |
| `useRef()` | `ref(null)` 或 `templateRef` |
| `useContext(X)` | `inject(key)` |
| Props 接口 | `defineProps<{...}>()` |
| 回调 props | `defineEmits<{...}>()` |

## 模板语法映射

| React JSX | Vue 模板 |
|-----------|-------------|
| `{condition && <Comp />}` | `<Comp v-if="condition" />` |
| `{condition ? <A /> : <B />}` | `<A v-if="condition" /><B v-else />` |
| `{items.map(i => <Item key={i.id} />)}` | `<Item v-for="i in items" :key="i.id" />` |
| `<div style={{padding:'16px'}}>` | `<div :style="{padding:'16px'}">` |
| `<div className={cls}>` | `<div :class="cls">` |
| `<div className="fixed-class">` | `<div class="fixed-class">` |
| `{children}` | `<slot />` |
| `{propName === 'x' ? <A /> : <B />}` | `<slot :name="propName">` |

## 事件映射

| React | Vue 3 |
|-------|-------|
| `onClick={fn}` | `@click="fn"` |
| `onChange={fn}` | `@change="fn"` / `@input="fn"` |
| `onSubmit={fn}` | `@submit.prevent="fn"` |
| `onFocus={fn}` | `@focus="fn"` |
| `onBlur={fn}` | `@blur="fn"` |
| `onKeyDown={(e) => e.key==='Enter' && fn()}` | `@keydown.enter="fn"` |
| `e.stopPropagation()` | `@click.stop="fn"` |
| `e.preventDefault()` | `@submit.prevent="fn"` |

## 状态管理：Context/Props → Pinia

```ts
// store/auth.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);

  function login(u: AuthUser) {
    user.value = u;
  }

  function logout() {
    user.value = null;
  }

  return { user, login, logout };
});
```

## 样式映射

| React | Vue 3 |
|-------|-------|
| 内联 `style={{...}}` | `:style="{...}"` 或 `<style scoped>` |
| CSS Modules | `<style module>` 或 CSS Modules（导入） |
| Tailwind 类名 | Tailwind 类名（相同，在 Vite 中配置） |
| `className` | `class`（静态）或 `:class`（动态） |

推荐使用 `<style scoped>` 编写组件样式 — 它是 Vue 内置的 CSS Modules 等价方案，无需额外配置。

## 示例：完整组件转换

```tsx
// ── React 源码 ──────────────────────────────────
function HomeView({ navigate }: { navigate: (v: ViewState) => void }) {
  const [query, setQuery] = useState('');
  const results = query.trim()
    ? mockWords.filter(w => w.word.includes(query))
    : [];

  return (
    <div style={{ padding: '0 0 24px' }}>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {results.length === 0 && query.trim()
        ? <p>No results</p>
        : results.map(w => (
            <button key={w.id} onClick={() => navigate({name:'wordDetail', wordId:w.id})}>
              {w.word}
            </button>
          ))
      }
    </div>
  );
}
```

```vue
<!-- ── Vue 3 目标 ──────────────────────────────── -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ViewState } from '@/data/types';
import { mockWords } from '@/data/mockData';

const props = defineProps<{
  navigate: (view: ViewState) => void;
}>();

const query = ref('');
const results = computed(() =>
  query.value.trim()
    ? mockWords.filter(w => w.word.includes(query.value.trim()))
    : []
);
</script>

<template>
  <div class="home-view">
    <input v-model="query" class="search-input" />

    <p v-if="results.length === 0 && query.trim()" class="empty">No results</p>
    <button
      v-for="w in results"
      :key="w.id"
      class="word-item"
      @click="props.navigate({ name: 'wordDetail', wordId: w.id })"
    >
      {{ w.word }}
    </button>
  </div>
</template>

<style scoped>
.home-view { padding: 0 0 24px; }
.search-input { /* ... */ }
.empty { /* ... */ }
.word-item { /* ... */ }
</style>
```

## uni-app 特有注意事项

当目标框架是 uni-app（Vue 3 + 多端编译）时，以下额外规则适用。
本节是对 `cross-platform-pitfalls.md` 中通用陷阱的 uni-app 具体化。

### 输入组件（input）

| React | uni-app (Vue 3) | 注意事项 |
|-------|-----------------|----------|
| `<input style={{...}} />` | `<input class="..." ></input>` | 🔴 必须使用闭合标签 `></input>`，不能用 `/>`（NC-02） |
| 浏览器自动计算 input 高度 | 小程序端不自动计算 | 🔴 必须显式设置 `height`——公式见 cross-platform-pitfalls.md §1 NC-01 |
| `transition: border-color 0.2s` | `/* #ifdef H5 */ transition ... /* #endif */` | 🔴 小程序原生组件不支持 CSS transition（NC-04） |
| `e.target.value` | `e.detail.value`（@input 事件） | 与 Taro 一致 |
| `onChange` | `@input` + `v-model` | uni-app 中 `v-model` 自动处理 |
| `resize: vertical`（textarea） | 移除，用 `auto-height` 替代 | 小程序不支持 resize（NC-08） |

### 文本组件

| React | uni-app (Vue 3) | 注意事项 |
|-------|-----------------|----------|
| `<p>` / `<span>` | `<view>` / `<text>` | 🔴 需要自动换行的文本块用 `<view>` 而非 `<text>`（NC-07） |
| 浏览器默认 word-break | 小程序不默认断词 | 🔴 在中文释义等可能溢出的文本上添加 `word-break: break-all; overflow-wrap: break-word` |

### 条件渲染中的原生组件

| React | uni-app (Vue 3) |
|-------|-----------------|
| `{mode === 'new' ? <InputA /> : <InputB />}` | `<template v-if="..." :key="unique-key">` |

🔴 在 `v-if` 控制的 `<template>` 上必须添加 `:key`，否则切换时原生组件状态残留。

### 包裹容器模式（phone/password wrap）

当输入框由外层容器承载 border/背景时（常见于手机号+86前缀、密码+眼睛图标）：

```html
<!-- ❌ 容器可能塌陷 -->
<view class="phone-wrap">
  <text class="prefix">+86</text>
  <input class="input--phone" /> <!-- border:none, bg:transparent -->
</view>

<!-- ✅ 容器有 min-height 兜底 -->
<view class="phone-wrap" style="min-height: 104rpx">
  <text class="prefix">+86</text>
  <input class="input--phone" style="height: 104rpx" ></input>
</view>
```

详见 `cross-platform-pitfalls.md` §1 NC-06。

### uni-app package.json 生成规则

**这是 Phase 3 生成 `package.json` 时的强制约束。** `@dcloudio/*` 包全部使用
alpha 预发布版本号——不存在"固定版本号可以直接写"。必须从 npm registry 实时获取。

#### 版本号获取流程

```bash
# 1. 先拿到最新的 alpha 版本号
LATEST=$(npm view @dcloudio/uni-app versions --json | tail -3 | head -1 | sed 's/[", ]//g')

# 2. 验证该版本号下所有必需的包都存在
for pkg in uni-app uni-app-plus uni-components uni-h5 uni-mp-weixin uni-automator uni-cli-shared vite-plugin-uni; do
  if ! npm view "@dcloudio/$pkg@$LATEST" version >/dev/null 2>&1; then
    echo "❌ @dcloudio/$pkg@$LATEST 不存在，请尝试上一版"
  fi
done

# 3. 将验证通过的版本号写入 package.json
```

#### 规则

| 规则 | 内容 |
|------|------|
| 🔴 禁止编造版本号 | 不要猜 `3.0.0-alpha-4020420240924001` 这种格式——末尾时间戳是 CI 构建时间，无法人工推算 |
| 🔴 必须 `npm view` 验证 | Phase 3 生成 `package.json` 之前，必须先跑 `npm view @dcloudio/uni-app versions --json` 获取真实版本号 |
| 🟡 统一版本号 | 所有 `@dcloudio/*` 包用同一个 alpha tag（它们是一起发布的，版本号一致） |
| 🟢 `vue` 和 `sass` 等非 dcloudio 包可用 `^x.y.z` 语义版本 | `"vue": "^3.4.21"`、`"sass": "^1.70.0"` — npm install 会自动选最新兼容版 |

#### 常见错误示例

```json
// ❌ 错误：编造了不存在的 alpha 版本号
"@dcloudio/uni-app": "3.0.0-alpha-4020420240924001"

// ✅ 正确：从 npm view 获取的真实最新版本
"@dcloudio/uni-app": "3.0.0-alpha-5020120260710001"
```

### 不应包含的依赖

uni-app 的页面路由由 `pages.json` + `uni.navigateTo/switchTab` 管理。
以下依赖在纯 Vue 3 项目中需要，但在 uni-app 项目中**不需要**：

| 不需要的依赖 | 原因 | 替代方案 |
|------------|------|---------|
| `vue-router` | uni-app 使用 `pages.json` 管理路由 | `uni.navigateTo / uni.switchTab / uni.navigateBack` |
| `pinia` | uni-app 项目如果状态简单（如只有一个 user store），`reactive()` 对象即可满足 | `src/store/user.ts` — `reactive({ user: null })` |

> **判断标准**：如果项目有 ≥ 3 个独立 store 模块且有复杂 getter → 安装 pinia。
> 如果只有 1-2 个简单的 reactive 对象 → 不安装 pinia，减少依赖体积。

## 🔴 Post-Mortem：React inline-style → uni-app 迁移实战故障录

> **来源**：2026-07-14 `figma-prototype`（React 内联 style）→ uni-app（Vue 3）迁移。
> 以下每条故障都经过了"构建成功但页面白屏 → 诊断 → 修复 → 验证通过"的完整闭环。
> **Phase 3 生成入口文件时，Agent 必须逐条对照此清单检查。**

### 故障 1：dist/ 零 JS 文件，页面白屏

**现象**：`npm run build` 输出 `DONE Build complete`，但 `dist/build/h5/` 中只有
`index.html` + 静态占位文件，没有任何 `.js` 文件。浏览器打开白屏。

**根因**：`index.html` 缺少 `<script type="module" src="./src/main.ts">`。
Vite 从 HTML 中的 `<script>` 标签发现入口模块——没有它就不打包任何 JS。

**修复**：在 `<body>` 底部添加 `<script type="module" src="./src/main.ts"></script>`。

**检测命令**：
```bash
find dist -name "*.js" | head -5          # 应该是非空列表
grep -c '<script' dist/build/h5/index.html # 应该 >= 1
```

---

### 故障 2：`main.ts` 导出但未挂载

**现象**：修复故障 1 后 Vite 报 `Failed to parse source for import analysis because the content contains invalid JS syntax`。

**根因**：`main.ts` 只导出了 `createApp()` 工厂函数，从未调用 `.mount('#app')`。

**修复**：在 `export function createApp()` 之后添加 `createApp().app.mount('#app')`。

**正确模板**：
```ts
import { createSSRApp } from 'vue'
import App from './App.vue'

export function createApp() {
  const app = createSSRApp(App)
  return { app }
}
createApp().app.mount('#app')
```

---

### 故障 3：`vite.config.ts` 放错目录

**现象**：`uni build` 只编译 2 个模块（`index.html` 自身），不编译任何 `.vue` 文件。
构建日志中没有页面编译条目。

**根因**：`vite.config.ts` 放在 `src/` 下。uni CLI 在**项目根目录**查找配置文件。
找不到时，Vite 以默认配置启动——没有 uni 插件 → 不识别 `.vue` 文件 → 不编译任何页面。

**修复**：`vite.config.ts` **必须在项目根目录**。

**验证**：构建日志中应出现类似 `src/pages/home/index.vue` 的编译条目。

---

### 故障 4：`pages.json` 和 `manifest.json` 放错目录

**现象**：`uni build` 报 `ENOENT: no such file or directory, open '.../src/pages.json'`

**根因**：`pages.json` 或 `manifest.json` 放在项目根目录。uni CLI 在 `src/` 下查找。

**修复**：两个文件都**必须在 `src/` 下**。

---

### 故障 5：`tsconfig.json` 缺 `@dcloudio/types` 类型引用

**现象**：`uni build` 成功但所有使用 `uni.xxx` 或生命周期钩子的文件在 IDE 中报类型错误。

**修复**：
```json
{
  "compilerOptions": {
    "types": ["@dcloudio/types"],
    "paths": { "@/*": ["src/*"] }
  }
}
```

---

### 故障 6：SCSS `additionalData` 不生效

**现象**：所有 `.vue` 文件的 `<style lang="scss">` 中引用 `$color-primary` 等变量报
`Undefined variable`。

**根因**：`vite.config.ts` 的 `css.preprocessorOptions.scss.additionalData` 未正确配置。

**修复**：
```ts
css: {
  preprocessorOptions: {
    scss: {
      // 🔴 必须用 @import — @use 会与 App.vue 中的 @import 冲突（见故障 8）
      additionalData: `@import "@/uni.scss";`,
    },
  },
},
```

> 🔴 **纠错（2026-07-15）**：此前推荐 `@use ... as *`，但在 uni-app 实践中发现
> `@use` 会与 App.vue 非 scoped style 中的 `@import` 冲突 —— Sass 禁止 `@use`
> 出现在任何其他规则之后。`additionalData` 注入的代码在每个文件末尾执行，此时
> App.vue 的非 scoped style 中可能已有 `@import`，导致 "`@use` rules must be
> written before any other rules" 构建失败。**改用 `@import`**（虽然 Dart Sass 3.0
> 将废弃它，但这是 uni-app 当前唯一可行方案）。

---

### 故障 7：`npm install` 因不存在的 alpha 版本号失败

**现象**：`npm install` 报 `No matching version found for @dcloudio/uni-app@3.0.0-alpha-4020420240924001`

**根因**：`@dcloudio/*` 包使用 CI 构建时间戳作为 alpha 版本号——**不可人工推算**。
Phase 3 Agent 编造了一个不存在的版本号。

**修复流程**：
```bash
# 获取真实最新版本号
npm view @dcloudio/uni-app versions --json | tail -5
# 从输出中选取一个存在的版本号，确认所有兄弟包都有同样版本
LATEST="3.0.0-4020920240930001"
npm view @dcloudio/vite-plugin-uni@$LATEST version  # 验证存在
# 然后将此版本号写入 package.json
```

---

### 故障 8：SCSS `@use` 与 `@import` 冲突 → 构建失败 🆕

**来源**：2026-07-15 `figma-prototype` → uni-app 迁移

**现象**：`uni build` 报 `Error: @use rules must be written before any other rules`，
指向 `src/App.vue` 行号。

**根因**：`vite.config.ts` 的 `additionalData: '@use "@/uni.scss" as *;'` 将 `@use`
注入到每个 SCSS 文件的**末尾**。但 Dart Sass 要求 `@use` 必须在所有其他规则之前。
`App.vue` 的非 scoped style 块中已有 `@import url(...)` 和普通 CSS 规则——`@use`
注入到这些之后 → Sass 报错。

**修复**：将 `additionalData` 改为 `@import`：
```ts
// ❌ 错误 — @use 在 uni-app 中不可用
additionalData: `@use "@/uni.scss" as *;`

// ✅ 正确
additionalData: `@import "@/uni.scss";`
```

**检测命令**：
```bash
grep -r '@use.*uni.scss' vite.config.ts    # 如果命中 → 故障 8 触发
```

---

### 故障 9：`~@/` 路径前缀在 Vite 中无效 🆕

**来源**：2026-07-15

**现象**：`uni build` 报 `Cannot find module '.../src/static/fonts/iconfont.ttf'`。

**根因**：`App.vue` 中 `@font-face { src: url('~@/static/fonts/iconfont.ttf') }`。
`~@/` 是 Webpack 独有前缀（`~` = node_modules，`@` = alias），Vite 不支持。

> **图标整体策略**：iconfont 基础设施的完整模板、占位文件规划、@font-face 声明标准写法，见 `references/icons.md` 第四章。

**修复**：直接用 `@/` 路径：
```css
/* ❌ Webpack 语法 — Vite 不支持 */
src: url('~@/static/fonts/iconfont.ttf') format('truetype');

/* ✅ Vite 语法 */
src: url('@/static/fonts/iconfont.ttf') format('truetype');
```

**检测命令**：
```bash
grep -rn '~@/' src/ --include="*.vue" --include="*.scss"   # 应该为空
```

---

### 故障 10：Vue SFC 类型声明文件缺失 🆕

**来源**：2026-07-15

**现象**：`npx tsc --noEmit` 报 `Cannot find module './App.vue' or its corresponding type declarations`。

**根因**：TypeScript 不认识 `.vue` 文件。仅靠 `tsconfig.json` 中的 `@dcloudio/types`
不够——`@dcloudio/types` 只提供了 uni API（`uni.xxx`）的类型，不提供 `.vue` 模块声明。

**修复**：创建 `src/shims-vue.d.ts`：
```ts
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
```

**检测命令**：
```bash
test -f src/shims-vue.d.ts && echo "✅" || echo "❌ 缺少 shims-vue.d.ts"
```

---

### 故障 11：静态资源占位文件缺失 → 构建失败 🆕

**来源**：2026-07-15

**现象**：`uni build` 在引用不存在的静态文件时失败（具体错误因 uni-app 版本而异）。
常见于：
- `pages.json` tabBar 的 `iconPath` / `selectedIconPath` 指向不存在的 PNG
- `App.vue` 的 `@font-face` 中 `url()` 指向不存在的 iconfont.ttf

**根因**：uni-app 构建时会解析所有静态资源引用——文件不存在则构建失败。
Phase 3 Agent 通常会生成代码**引用**这些文件（正确的），但不会**创建**文件本身。

**修复**：在 Phase 3 Layer 2.5 创建所有静态资源占位文件：
```bash
touch src/static/fonts/iconfont.ttf
touch src/static/images/tab-{home,libraries,profile}.png
touch src/static/images/tab-{home,libraries,profile}-active.png
```

> **这是 Phase 3 新增 Layer 2.5 的原因**——在页面 Agent 启动前确保静态资源目录就位。

**检测命令**：
```bash
for f in $(grep -roh "'static/[^']*'" src/pages.json 2>/dev/null | tr -d "'"); do
  test -f "src/$f" && echo "✅ $f" || echo "❌ 缺失: $f"
done
```

---

### 故障 12：子组件占位符未被替换 🆕

**来源**：2026-07-15

**现象**：admin.vue 生成后，LibraryManager/WordManager/UserManager 显示为
"词库管理模块（待实现）"占位符，而非实际功能模块。

**根因**：admin.vue 和子组件（LibraryManager, WordManager, UserManager）是由
**不同的 Agent 并行生成**的。admin.vue 的 Agent 不知道子组件的精确接口（props/
emits 签名），因此使用占位符作为安全回退。

**修复**：在 Phase 3 Layer 4 全部完成后，做一次交叉验证：
1. 检查每个容器组件是否使用了 `v-if` + 子组件 import（而非占位符 text）
2. 检查子组件的 props 和 emits 接口是否与容器中传递的参数匹配
3. Grep 搜索 `待实现` 或 `placeholder` 关键词——任何命中都需要替换

**检测命令**：
```bash
grep -rn '待实现\|placeholder\|TODO.*implement' src/ --include="*.vue"   # 应该为空
```

---

---

### 故障 13：WXSS 编译错误 — `@import url()` 外部 CSS（NC-09）🆕

**来源**：2026-07-15 `english-dict-uni` uni-app 编译到微信小程序

**现象**：微信开发者工具报告 `[WXSS 文件编译错误] ./app.wxss(1:9): error at token 'url'`，
随后 `Error: timeout`。小程序只显示底部 tabBar，所有页面内容白屏不显示。

**根因**：`App.vue` 中存在 `@import url('https://fonts.googleapis.com/css2?...')`。
编译到小程序后 `app.wxss` 第一行即为该语句。**微信小程序 WXSS 的 `@import` 只支持
本地相对路径**（如 `@import "./base.wxss"`），不支持函数形式的 `url()` 参数。

**链式故障机制**：`app.wxss` 解析失败 → 全局样式表加载中断 → 页面渲染管线初始化超时
→ `Error: timeout` → 所有页面内容不显示。但原生 tabBar 不依赖 WXSS，仍然可见。

**修复**：
```scss
/* ❌ 触发 NC-09 */
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..700;1,14..32,300..700&display=swap');

/* ✅ H5 条件编译 */
/* #ifdef H5 */
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..700;1,14..32,300..700&display=swap');
/* #endif */
```

**检测命令**：
```bash
# 源文件检查 — 搜索未条件化的外部 @import
grep -rn '@import\s\+url(' src/ --include="*.vue" --include="*.scss" | grep -v '#ifdef H5'

# 编译产物检查 — WXSS 中不得有外部 URL
grep -rn 'url("https\?://' dist/build/mp-weixin/ --include="*.wxss"
```

---

### 故障 14：WXSS 编译错误 — `*` / `html` / `body` 选择器（NC-10, NC-11）🆕

**来源**：2026-07-15 修复故障 13 后，WXSS 仍报错

**现象**：修复 `@import url()` 后，WXSS 报告 `unexpected token '*'`（第 11 列）。
小程序同样只显示 tabBar，页面白屏 + timeout。

**根因**：WXSS 不支持 CSS 通配选择器 `*`、也不支持 `html` / `body` 元素选择器
（小程序渲染层没有 HTML DOM 概念）。`App.vue` 中的全局 reset 样式
`* { box-sizing: border-box; }`、`html, body { ... }`、`#app { ... }`
在编译后的 `app.wxss` 中直接出现，触发解析错误。

**修复**：将全部 Web-only 的全局样式用 `/* #ifdef H5 */ ... /* #endif */` 包裹：
```scss
/* #ifdef H5 */
* { box-sizing: border-box; }
html, body { height: 100%; margin: 0; padding: 0; font-family: Inter, sans-serif; }
#app { height: 100%; }
/* #endif */
```

**检测命令**：
```bash
# 源文件检查
grep -rn '^\s*\*\s*{' src/ --include="*.vue" --include="*.scss" | grep -v '#ifdef H5'
grep -rn '^\s*html\b\|^\s*body\b' src/ --include="*.vue" --include="*.scss" | grep -v '#ifdef H5'

# 编译产物检查 — WXSS 中不得出现 *、html、body 选择器
grep -rn '^\s*\*{' dist/build/mp-weixin/ --include="*.wxss"
grep -rn '^\s*html,\|^\s*body{' dist/build/mp-weixin/ --include="*.wxss"
```

---

### 故障 15：`<text>` 组件中 `\n` 不换行（NC-12）🆕

**来源**：2026-07-15 `english-dict-uni` — PageHeader title "用物理意象\n读懂英语"

**现象**：`\n` 没有换行，而是以字符串形式直接显示在一行中。

**根因**：小程序 `<text>` 组件遵循 HTML 空白折叠规则——JavaScript 字符串中的 `\n`
（换行符 LF）被折叠为普通空格。这与 H5 浏览器行为一致（浏览器同样折叠），但用户
往往以为 `<text>` 会像 `<pre>` 那样保留换行。

**修复**：在目标 `<text>` 元素的 CSS 中添加 `white-space: pre-line`：
```css
.page-header__title {
  white-space: pre-line;
}
```

**检测命令**：
```bash
# 搜索含 \n 的 <text> 内容
grep -rn '\\\\n' src/ --include="*.vue" -B2 | grep '<text'
# 对每个命中，检查对应 CSS 类是否有 white-space: pre-line
```

---

### 文件位置速查表

| 文件 | 位置 | ❌ 常见错误 |
|------|------|-----------|
| `index.html` | 根目录 | 放 src/ 下 |
| `vite.config.ts` | 根目录 | 放 src/ 下 |
| `tsconfig.json` | 根目录 | 放 src/ 下 |
| `package.json` | 根目录 | — |
| `src/pages.json` | src/ 下 | 放根目录 |
| `src/manifest.json` | src/ 下 | 放根目录 |
| `src/main.ts` | src/ 下 | — |
| `src/App.vue` | src/ 下 | — |
| `src/uni.scss` | src/ 下 | — |
| `src/shims-vue.d.ts` 🆕 | src/ 下 | 漏建 → tsc 报 Cannot find module '.vue' |

### 构建自检脚本（Phase 3 Layer 5+6 完成后必须运行）

```bash
cd <target-project>
npm install --legacy-peer-deps 2>&1 | tail -3
npx uni build 2>&1 | tail -5

# 关键检查
echo "=== JS files in dist ==="
find dist -name "*.js" | wc -l          # 预期 >= 10

echo "=== Script tags in HTML ==="
grep -c '<script' dist/build/h5/index.html  # 预期 >= 1

echo "=== CSS files in dist ==="
find dist -name "*.css" | wc -l          # 预期 >= 5

# 如果 JS 文件数 = 0 → 故障 1（index.html 缺 script）
# 如果 JS 文件数 = 1 → 故障 3（vite.config.ts 位置错误）
# 如果 npm install 失败 → 故障 7（版本号编造）
# 如果 @use 错误 → 故障 8（additionalData 用了 @use 而非 @import）
# 如果 ~@/ 路径错误 → 故障 9（url() 用了 webpack 独有的 ~@/ 前缀）
# 如果 tsc Cannot find module → 故障 10（缺 shims-vue.d.ts）
# 如果静态资源缺失 → 故障 11（占位文件未创建）
# 🆕 如果小程序 WXSS token 'url' → 故障 13（App.vue @import url() 未条件化）
# 🆕 如果小程序 WXSS unexpected token '*' → 故障 14（App.vue */html/body 选择器未条件化）
# 🆕 如果小程序白屏只显示 tabBar → 故障 13 或 14（app.wxss 解析失败 → timeout）
```

## 快速检查清单

- [ ] `useState` → `ref()` / `reactive()`
- [ ] `useEffect` → `onMounted()` / `watch()` / `watchEffect()`
- [ ] `useMemo` → `computed()`
- [ ] `function Component(props)` → `<script setup>` + `defineProps`
- [ ] `{condition && X}` → `v-if`
- [ ] `{a ? b : c}` → `v-if` / `v-else`
- [ ] `.map()` → `v-for` + `:key`
- [ ] `onClick` → `@click`
- [ ] `onChange` → `@change` / `@input` / `v-model`
- [ ] `className` → `class` / `:class`
- [ ] 内联 `style={{...}}` → `:style="{...}"` 或 `<style scoped>`
- [ ] 回调 props → `defineEmits`（如果是事件）或保留为 props（如果是回调）
- [ ] Context → Pinia store 或 `provide`/`inject`
- [ ] 手动路由 → Vue Router
- [x] `<input>` 有显式 `height`（uni-app 小程序端必须）（NC-01）
- [x] `<input>` 使用 `></input>` 闭合（非自闭合）（NC-02）
- [x] `<textarea>` 有 `auto-height` 属性（NC-03）
- [x] 原生组件 CSS `transition` 用 `/* #ifdef H5 */` 包裹（NC-04）
- [x] 原生组件父容器 `overflow: hidden` 用 H5 条件编译（NC-05）
- [x] 包裹容器 `min-height` 与内部 input 一致（NC-06）
- [x] 需要换行的文本用 `<view>` 而非 `<text>`（NC-07）
- [x] `index.html` 在根目录 + `<script type="module" src="./src/main.ts">`
- [x] `vite.config.ts` 在根目录（不在 src/ 下）
- [x] `pages.json` 和 `manifest.json` 在 `src/` 下
- [x] `main.ts` 包含 `createApp().app.mount('#app')` 自挂载
- [x] `package.json` 的 `@dcloudio/*` 版本号来自 `npm view`（非编造）
- [x] 构建后 `find dist -name "*.js" | wc -l` >= 10
- [x] 🆕 SCSS additionalData 使用 `@import` 而非 `@use`（故障 8）
- [x] 🆕 `url()` 使用 `@/` 而非 `~@/`（故障 9）
- [x] 🆕 存在 `src/shims-vue.d.ts`（故障 10）
- [x] 🆕 静态资源占位文件存在（tabBar PNG, iconfont.ttf）（故障 11）
- [x] 🆕 无 "待实现" / "placeholder" 残留（故障 12）
- [x] 🆕 App.vue 中 `@import url()` 用 `/* #ifdef H5 */` 包裹（NC-09 / 故障 13）
- [x] 🆕 App.vue 中 `*`、`html`、`body`、`#app` 选择器用 `/* #ifdef H5 */` 包裹（NC-10~NC-11 / 故障 14）
- [x] 🆕 编译产物 WXSS 中无 `url("http`、无 `*{`、无 `html,`（故障 13/14 编译后验证）
- [x] 🆕 含 `\n` 的 `<text>` 元素 CSS 有 `white-space: pre-line`（NC-12 / 故障 15）
- [x] 🆕 `min-height: 100vh` 用 `/* #ifdef H5 */` 包裹或改为固定值（小程序 vh 行为不一致）
