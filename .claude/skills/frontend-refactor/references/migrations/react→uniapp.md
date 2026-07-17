# React (inline-style) → uni-app (Vue 3) 迁移指南

> **创建日期**：2026-07-15
> **实战来源**：`figma-prototype` (React 18 + 100% 内联 style) → `english-dict-uni`
> **源 13 文件 → 目标 38 文件**，构建自检通过，全部交互保留

---

## 一、六大类映射速查

### 1.1 组件模型

| React | uni-app (Vue 3) | 注意事项 |
|-------|-----------------|---------|
| `function C(props: I)` | `<script setup>` + `defineProps<I>()` | 模板 + script + style scoped 三结构 |
| `<div style={{...}}>` | `<view class="c">` | 静态样式 → scoped class；仅动态值用 `:style` |
| `<h1>`~`<h4>` | `<view class="h1">` | 无原生语义标签 |
| `<input onChange>` | `<input v-model @input>` | `v-model` 自动处理 `.value` vs `.detail.value` |
| `<button>` | `<view @click>` | 避免小程序 button 默认样式 |
| `<select>` | `<picker>`（小程序）+ `<select>`（H5 条件编译） | 🔴 必须条件编译 |
| `useState(x)` | `ref(x)` / `reactive({...})` | ref 从 `vue` 导入，不从 `@dcloudio/uni-app` |
| `useMemo(fn,deps)` | `computed(fn)` | — |
| `useEffect(fn,[])` | `onMounted(fn)` | — |
| `window.confirm()` | `uni.showModal({...})` | 异步回调替代同步阻塞 |

### 1.2 事件系统

| React | uni-app | 注意事项 |
|-------|---------|---------|
| `onClick` | `@click` / `@tap` | 小程序端用 `@tap` |
| `onChange={e => ...}` | `@input` + `v-model` | v-model 自动处理 |
| `onFocus={e => e.target.style.xxx=...}` | `@focus` + `:class` 绑定 | 🔴 DOM 操作 → 声明式 class |
| `onBlur={e => e.target.style.xxx=...}` | `@blur` + `:class` 绑定 | 🔴 同上 |
| `onKeyDown={e=>e.key==='Enter'}` | `@confirm`（input）/ `@keydown.enter`（H5） | 小程序端 input 用 `@confirm` |

### 1.3 样式系统

| React | uni-app | 注意事项 |
|-------|---------|---------|
| 内联 `style={{...}}` | scoped CSS class + `:style` | 静态值进 class，动态值留 `:style` |
| `backdropFilter: 'blur(16px)'` | `/* #ifdef H5 */ backdrop-filter: blur(16px); /* #endif */` | 🔴 |
| `transition: '...'` | `/* #ifdef H5 */ transition: ... /* #endif */` | 🔴 NC-04 |
| `position: 'fixed'` BottomNav | `pages.json` 原生 tabBar | — |
| `overflow: 'hidden'` 容器 | `/* #ifdef H5 */ overflow: hidden; /* #endif */` | 🔴 NC-05 |
| `resize: 'vertical'` textarea | 移除 → `auto-height` | 🔴 NC-08 |
| px → rpx | `rpx = px × 2` | 设计基准 375px→750rpx |

### 1.4 路由与导航

| React | uni-app |
|-------|---------|
| `useState<ViewState>` 手动路由 | `pages.json` 配置 |
| tabBar 页面导航 | `uni.switchTab({ url: '/pages/xxx/xxx' })` |
| 非 tabBar 页面 | `uni.navigateTo({ url: '/pages/xxx/xxx?param=val' })` |
| 返回 | `uni.navigateBack()` |
| 参数获取 | `onLoad((options) => { options.paramName })` |

### 1.5 状态管理

| React | uni-app (Vue 3) |
|-------|-----------------|
| App.tsx `useState<ViewState>` + `setView()` | `pages.json` 路由 |
| App.tsx `useState<AuthUser>` | `reactive({ user: null })` — 单 store，不装 pinia |
| 组件内 `useState` | `ref()` / `reactive()` |
| 派生状态 | `computed()` |
| 回调 prop | `defineEmits` 或直接调用 store |

### 1.6 数据获取

| React | uni-app |
|-------|---------|
| `import { mockData }` | 直接保留 |
| `setTimeout(()=>{}, ms)` | 直接保留 |
| `mockData.find(...)` | 提取为工具函数 `getXxxById()` |

---

## 二、React 特有 → uni-app 映射

### 2.1 内联 style 对象 → scoped SCSS

React 中 95%+ 的内联样式对象在迁移时必须逐项提取为 scoped CSS class。
遵循以下规则：

1. **静态值进 class**：`style={{ padding: '16px 24px', background: '#fff' }}` → `.card { padding: 32rpx 48rpx; background: #fff; }`
2. **动态值留 :style**：`style={{ color: isActive ? '#2563EB' : '#9CA3AF' }}` → `:style="{ color: isActive ? '#2563EB' : '#9CA3AF' }"`
3. **onFocus/onBlur DOM 操作 → class 绑定**：`e.target.style.borderColor = '#2563EB'` → `:class="{ 'input--focused': isFocused }"`
4. **条件分支中的 style → Vue 条件 class**：`style={loading ? {...} : {...}}` → `:class="{ 'btn--loading': loading }"`

### 2.2 useState 路由 → pages.json + uni API

React 的 `useState<ViewState>` 手动条件渲染是此项目中唯一的"路由"方案。
迁移到 uni-app 时必须完全替换：

```ts
// ❌ React 模式（源项目实际写法）
const [view, setView] = useState<ViewState>({ name: 'home' });
const navigate = (newView: ViewState) => setView(newView);
// JSX: {view.name === 'home' && <HomeView />}

// ✅ uni-app 模式
// pages.json 配置路由 → uni.switchTab / uni.navigateTo
// 页面参数从 onLoad((options) => {}) 获取
```

### 2.2a 回调内闭合的 navigate → 内联到页面 🔴

**模式识别**：当 React App.tsx 将 navigate() 调用闭合在一个回调函数内部、并将该回调
通过 props 传给子组件时，uni-app 迁移中**该 navigate 必须内联到页面自身**。

在 uni-app 架构中，每个页面是独立路由入口——不存在"父组件"在执行 `emit` 后跑
回调中的 `navigate()`。`defineEmits` 只能触发模板中的 handler，不能跨路由调用。

**检测方法**（Phase 2 执行）：
1. 在 App.tsx 中找出作为 prop 传给子组件的所有回调函数
2. 检查每个回调的函数体 — 如果包含 `setView()`/`navigate()` → 标记
3. 对标记项，记录"<页面名> → <目标路由>"

```
示例（figma-prototype App.tsx）：

    const handleLogin = (u: AuthUser) => {
      setUser(u);
      if (u.role === 'admin') navigate({ name: 'admin', tab: 'overview' });
      else navigate({ name: 'profile' });
    };
    // ↑ 标记：navigate 在 handleLogin 体内，handleLogin 传给 AuthView.onAuth
    // → auth.vue 的 handleSubmit 成功后必须包含 uni.navigateTo/switchTab

    const handleLogout = () => {
      setUser(null);
      navigate({ name: 'home' });
    };
    // ↑ 标记：navigate 在 handleLogout 体内，handleLogout 传给 ProfileView.onLogout
    // → profile.vue 的退出按钮必须包含 uni.switchTab({ url: '/pages/home/home' })
```

**映射规则**：

| 源模式 | ❌ 错误 | ✅ 正确 |
|--------|---------|---------|
| App 回调内含 navigate | `emit('auth', user)` — 无人接收 | handleSubmit 最后一行：`uni.navigateTo/switchTab` |
| App 回调内含 setUser + setView | 分两步 emit 两个事件 | login(user) + 立即 switchTab/navigateTo |

**已确认命中此模式的迁移对**：
- `figma-prototype` → uni-app：handleLogin、handleLogout、AuthView.navigate('home')

### 2.3 lucide-react → iconfont

源项目使用 18 种 lucide-react 图标。uni-app 全端（H5+小程序）方案：
- **iconfont 字体图标** — 唯一全端兼容方案
- **tabBar 图标** — 独立 PNG 文件
- **PhysicalImage SVG** — H5 条件编译保留，小程序 PNG 回退

---

## 三、输入框样式模式分类

源项目 React inline-style 使用 `onFocus={e => e.target.style.borderColor = '#2563EB'}`
命令式 DOM 操作管理输入框 focus/blur 样式。这是跨平台迁移中最顽固的问题——
三种模式必须显式分类：

| 模式 | blur border | blur bg | focus border | focus bg | 出现文件 |
|------|-----------|---------|-------------|---------|---------|
| INPUT-A | `transparent` | `#F1F5F9` | `#2563EB` | `#FFFFFF` | HomeView, AdminView 全部 |
| INPUT-B | `#E5E7EB` | `#FFFFFF` | `#2563EB` | `#FFFFFF`(不变) | AuthView |

目标实现：
- INPUT-A/B 封装为 SCSS mixin → `uni.scss` → `vite.config.ts additionalData` 全局注入
- focus 管理封装为 `useInputFocus()` composable
- transition 必须 `/* #ifdef H5 */` 包裹

---

## 四、共享组件清单（复用约束）

基于 Phase 2 跨文件复用分析，以下 7 个共享组件必须在页面之前生成并锁定：

| 组件 | Props | 复用页面 |
|------|-------|---------|
| PageHeader | title, subtitle, showBack, backLabel, bgType, paddingTop | home, word-detail, libraries, library-words, profile, admin(×4) |
| SectionLabel | label | word-detail, admin(×5) |
| PrimaryButton | label, loading, disabled, ghost, icon | profile, auth, admin(×3) |
| WordCard | word, library, showLibrary, showArrow, variant | home, library-words |
| EmptyState | icon, message, hint | home, library-words, admin(×2) |
| SearchBar | modelValue, placeholder | home, admin/WordManager |
| PhysicalImage | type, showLabel | word-detail, admin/WordEditForm |

---

## 五、全局样式强制规则（G1~G20）

Phase 3 每个页面 Agent 必须遵守的 20 条规则，见 Phase 2 映射蓝图 §九。

核心规则摘要：

| 规则 | 内容 | 严重性 |
|------|------|--------|
| G1 | backdrop-filter 必须 H5 条件编译 | 🔴 |
| G5 | input 必须有显式 height | 🔴 |
| G6 | input 必须闭合标签 `></input>` | 🔴 |
| G7 | textarea 必须 `auto-height` | 🔴 |
| G13 | transition 必须 H5 条件编译 | 🔴 |
| G14 | input 使用 INPUT-A/B mixin | 🔴 |
| G15 | focus 用 `useInputFocus` composable | 🔴 |
| G18 | `@import url()` 必须 H5 条件编译 (NC-09) | 🔴 |
| G19 | `*` 选择器必须 H5 条件编译 (NC-10) | 🔴 |
| G20 | `html, body` 选择器必须 H5 条件编译 (NC-11) | 🔴 |

---

## 六、Post-Mortem 故障录

### PM-M1: `ref` 从 `@dcloudio/uni-app` 导入 → 构建失败

**现象**：`uni build` 报 `"ref" is not exported by "@dcloudio/uni-app"`

**根因**：`ref`/`reactive`/`computed`/`watch` 是 Vue 3 核心 API，只能从 `vue` 导入。
`@dcloudio/uni-app` 只导出 uni-app 特有的 API（`onLoad`, `onLaunch`, `onShow`, `onHide`）。

**修复**：
```ts
// ❌ 错误
import { ref, onLoad } from '@dcloudio/uni-app';
// ✅ 正确
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
```

**检测命令**：`grep -rn "import.*ref.*from '@dcloudio/uni-app'" src/`

### PM-M2: @dcloudio/* 版本号混用 → npm install 失败

**现象**：`No matching version found for @dcloudio/uni-components@2.0.2-xxx`

**根因**：`@dcloudio/*` 所有包使用统一 alpha 版本号。`2.0.2-*` release line 不含
`uni-components`/`uni-h5`/`uni-mp-weixin`（这些在 `3.0.0-alpha-*` line）。

**修复**：所有 `@dcloudio/*` 包使用 `npm view` 获取的同一版本号字符串。
```json
// ✅ package.json 中所有 @dcloudio/* 版本号字符串完全一致
```

**检测命令**：
```bash
grep '"@dcloudio/' package.json | grep -oP '\d+\.\d+\.\d+-[^"]+' | sort -u
# 输出应只有一行（一个版本号）
```

### PM-M3: iconfont.ttf 不存在 → npm run build CSS 阶段失败

**现象**：`npm run dev` 正常，`npm run build` 报 `Cannot find module iconfont.ttf`

**根因**：Vite dev 按需编译 SCSS，不检查 `url()` 引用的文件；生产构建全量编译所有 SCSS，
`@font-face { src: url('@/static/fonts/iconfont.ttf') }` 要求文件物理存在。

**修复**：Phase 3 Layer 2.5 创建最小合法 TTF 占位文件。

**检测命令**：
```bash
# 仅检查"存在"不够 —— 见 PM-M5 的完整性检查
ls -la src/static/fonts/iconfont.ttf
wc -c src/static/fonts/iconfont.ttf  # 应 ≥ 1024
```

### PM-M4: 审计脚本误报（多行限制）

**现象**：NC-03 Blocker — `textarea` 无 `auto-height`；NC-04 Major — `transition` 未条件编译。
人工逐行验证后发现全部已正确实现。

**根因**：`audit-phase4.sh` 基于行级 `grep`，`grep -A2` 无法跨越多行 HTML 标签匹配属性，
`grep -v '#ifdef H5'` 无法识别跨多行的条件编译包裹。

**修复方法论**：审计脚本运行后**必须**人工逐项验证：
```bash
# 验证 textarea auto-height（跨行匹配）
grep -A10 '<textarea' src/ --include="*.vue" -rn | grep 'auto-height'
# 验证条件编译（查看上下文行）
grep -B2 -A2 'transition:' src/ --include="*.vue" -rn
grep -B2 -A2 'backdrop-filter:' src/ --include="*.vue" -rn
```

### PM-M5: iconfont.ttf 损坏（构建通过，图标全部不可见）🆕

> **来源**：2026-07-15 english-dict-uni 迁移后验证。

**现象**：`npm run build` → `DONE Build complete`，dev server 启动正常，所有页面可访问。
但所有图标（搜索、箭头、用户、设置等 17 个 iconfont 图标）在浏览器中均为空白。

**根因**：`iconfont.ttf` 文件在迁移后仅 38 字节——只保留了 TTF 文件头和空表目录，
字形数据全部丢失。Vite 构建时将其内联为 base64 写入 CSS，`@font-face` 声明完整有效，
浏览器加载字体时发现 `cmap` 表为空 → 所有码点无 glyph → 静默回退到系统字体的
PUA 空白字符。**整个链条没有任何环节报错**——构建工具、浏览器 DevTools、
CSS 属性审计全部通过，只有人眼能看到图标消失。

**与 PM-M3 的区别**：PM-M3 是"文件不存在 → CSS 编译失败"（硬错误，构建时暴露）；
PM-M5 是"文件存在但内容损坏 → 构建成功但图标不可见"（软错误，运行时不暴露）。

**修复**：
1. 如果源字体文件有备份 → 直接复制替换
2. 如果源文件丢失 → 用本地生成流水线重建（`svgicons2svgfont` + `svg2ttf`，
   17 个 SVG 源文件 → 指定码点 → 生成 TTF → 验证 size ≥ 1KB）
3. 如果只有 iconfont.cn 项目 → 重新下载

**检测命令**：
```bash
# 文件大小检查：38-60 字节 = 损坏，正常 ≥ 3KB
wc -c src/static/fonts/iconfont.ttf

# 构建产物中的 base64 内容长度检查
# 空字体 base64 = 约 60 字符；正常字体 = 4000-6000 字符
grep -o '@font-face{[^}]*}' dist/build/h5/assets/index-*.css \
  | grep -o 'base64,[^)]*' | wc -c
```

### PM-M6: iconfont 渲染模式 bugs — `:class` 绑 unicode + JS 中的 HTML entity 🆕

> **来源**：2026-07-15 english-dict-uni 迁移后验证。字体修复后暴露 4 处渲染 bugs。

**现象**：TTF 修复后，大部分图标恢复显示，但 4 个特定位置仍然不显示：
- `EmptyState` 组件的空状态图标 → 空白
- `PrimaryButton` 组件的图标 → 空白（虽然当前代码未传 icon prop）
- `auth.vue` 密码可见/不可见切换 → 显示字面量文本 `&#xe00d;` 而非图标
- `OverviewSection.vue` 管理导航图标 → 显示字面量文本而非图标

**根因**：三种不同的渲染模式 bugs：

| 模式 | Bug 代码 | 问题 | 为什么难发现 |
|------|---------|------|------------|
| Pattern B | `<text class="iconfont" :class="icon">` 其中 `icon="&#xe006;"` | `:class` 把 unicode 字符当作 CSS class 名绑定，浏览器去找 `.e006` 类（不存在） | 字体损坏时反正没图标，看不出 |
| Pattern C | `{{ show ? '&#xe00d;' : '&#xe00c;' }}` | `'&#xe00d;'` 在 JS 中是 7 个 ASCII 字符的字符串字面量，HTML entity 解析器不处理 JS 表达式 | 字体文件损坏时反正没图标 |
| Pattern D | `{ icon: '&#xe006;' }`（JS 数据中） | 同上 | 同上 |

**修复**：
```html
<!-- Pattern B 正确：作为文本内容渲染 → unicode 字符被字体渲染为 glyph -->
<text class="iconfont">{{ icon }}</text>

<!-- Pattern C 正确：JS 字符串中用 Unicode 转义，运行时解析为实际字符 -->
{{ showPassword ? '' : '' }}

<!-- Pattern D 正确：直接用 Unicode 字符或 \u 转义 -->
{ icon: '' }
```

**检测命令**：
```bash
# Pattern B: :class="icon" 模式
grep -rn ':class="icon"' src/components/ src/pages/ --include="*.vue"

# Pattern C/D: JS 字符串中的 HTML entity（这些永远不会被解析）
grep -rn "'&#x" src/ --include="*.vue" | grep -v 'content:'  # 排除 CSS content

# 预期：零命中
```

### PM-M7: `<p>` → `<text>` — 文本截断（nowrap+ellipsis）静默失效 🆕

> **来源**：2026-07-15 figma-prototype (React) → english-dict-uni 迁移，Phase 4 审查发现。

**现象**：WordManager.vue 中 `word-manager__card-meaning` 文字超长时不换行、也不显示
省略号，直接撑出卡片边界。WordCard.vue 中 compact 变体的 `meaning-text` 同理。

**根因**：React 源项目 [AdminView.tsx:658](figma-prototype/src/app/components/AdminView.tsx#L658) 使用 `<p>` 标签：
```tsx
<p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
  {word.coreMeaning}
</p>
```
- `<p>` 的默认 CSS `display` 是 `block` → 元素宽度等于父容器宽度 → nowrap 三件套正常工作
- uni-app 的 `<text>` 默认 `display` 是 `inline` → 宽度由内容撑开 → 不感知父容器宽度 → 三件套失效

**这是一个跨框架语义偏差（cross-framework semantic gap）**：
CSS 属性逐字搬移（`overflow:hidden; text-overflow:ellipsis; white-space:nowrap`）
是正确的，但目标元素的默认 `display` 值不同导致渲染结果完全不同。
没有任何类型检查、lint 或构建工具能发现这个问题——只有人眼比对渲染结果才能暴露。

**修复**：

1. **`display: block`** — 添加到需要截断的 `<text>` 元素对应的 CSS 类上
2. **DOM 结构调整**（进阶）— 如果该元素需要铺满卡片全宽而非仅 flex-left 宽度，
   需将 `<text>` 提升为卡片直接子元素（摆脱 `flex: 1` 父容器的宽度限制）

**检测命令**：
```bash
# Phase 2：检查源项目中 <p> 是否含有 nowrap+ellipsis → 迁移时需要 display:block
grep -rn "white-space:\s*nowrap" <source>/src/ --include="*.tsx" -B5 | grep "<p"

# Phase 4：检查目标项目 <text> + 截断但缺 display:block  
grep -rn "text-overflow:\s*ellipsis" <target>/src/ --include="*.vue" -B10 | grep "<text"
# → Grep 出 .vue 文件名后，手动检查对应 CSS 类的 display 属性
```

**与 NC-14 的关系**：此问题已固化为 `cross-platform-pitfalls.md` 的 NC-14 条目。
NC-14 是框架无关的通用描述，PM-M7 是 React→uniapp 迁移对的具体实例。**

### PM-M8: NC-14 反模式 — `<text>` 被错误地加上 `display: block` 🆕

> **来源**：2026-07-17 第二次 figma-prototype → english-dict-uni 迁移，Phase 4 审查发现。

**现象**：WordCard 组件的词库标签 badge 铺满整个卡片宽度，而非像源项目那样由内容撑开。

**根因**：源项目使用 `<span style="display:inline-block">`（行内块，宽度由内容决定），
目标 Agent 将其转换为 `<text>` 后加上了 `display: block`。Agent 的推理链是：
"`<text>` 默认 `inline` → NC-14 要求对替代 HTML 块级元素的 `<text>` 加 `display: block` →
badge 看起来像是一个独立行 → 加 `display: block`"。
但源元素是 `<span>`（inline）不是 `<p>`/`<h1>`（block），`display: block` 是反向偏差。

**这是一个 NC-14 规则过度应用的典型案例**：
NC-14 解决的是"`<text>` 替代块级元素时缺 `display: block` 导致截断失效"问题，
但它不意味着**所有 `<text>` 都该加 `display: block`**。Agent 形成了"`<text>` → 加 block"的惯性，
对原本是 `inline`/`inline-block` 的元素也套用规则，导致元素从内容宽度变为全宽。

**修复**：
```css
/* ❌ 错误 — 源是 inline-block，不应改写为 block */
.word-card__badge { display: block; }

/* ✅ 正确 — 与源一致 */
.word-card__badge { display: inline-block; }
```

**检测命令**：
```bash
# Phase 4 新检查：<text> 的 display:block 是否是反向偏差
# 查找所有在 <text> 上使用 display:block 的 CSS 块，人工确认源元素是否真的是块级
grep -rn "display:\s*block" src/components/ --include="*.vue" -B10 | grep "<text"
```

**防范措施**（已写入 phase2-mapping.md §7a-补充2 + phase4-verification.md NC-14 反向检测）：
- Phase 2 共享组件差异化参数表必须包含每个子元素的源 display 值
- Phase 3 Agent Prompt 中 NC-14 规则的表述从"`<text>` 需要 `display: block`"改为
  "`<text>` 的 display 值必须与源元素的 display 值一致——源是 block 则写 block，
  源是 inline 则不写，源是 inline-block 则写 inline-block"

### PM-M9: 共享组件 props 遗漏 — 基础 CSS 属性差异化失败 🆕

> **来源**：2026-07-17 第二次 figma-prototype → english-dict-uni 迁移，Phase 4 审查发现。

**现象**：PrimaryButton 组件在所有页面显示相同的 padding 和 font-size，
但源项目中不同页面的按钮有不同的尺寸——auth 页 `16px/16px`、admin 页 `15px/15px`、
AI 按钮 `14px/15px`。

**根因**：Phase 2 差异化参数分析的"属性维度"只覆盖了**语义属性**
（variant, loading, disabled, icon），没有覆盖**基础 CSS 属性**（padding, font-size, border-radius）。
以下两个维度在分析时被遗漏：

| 分析维度 | 是否在差异化表中 | 值在各实例间是否相同 | 遗漏后果 |
|---------|---------------|------------------|---------|
| 语义属性（variant/loading/disabled） | ✅ 已覆盖 | 部分不同 → 已转化为 props | — |
| 基础 CSS 属性（padding/font-size） | 🔴 未覆盖 | 不同（32rpx/30rpx/28rpx） | 组件硬编码 30rpx，auth 偏小 2rpx |

**为什么遗漏**：差异化参数清单的提取方法写的是"列出该模式的完整属性集合"，
但"属性集合"被隐式理解为"颜色、文案、状态"等语义属性，padding/font-size
被认为是"组件内部的固定样式"不参与差异化——实际上不同实例确实有不同值。

**修复**：
1. PrimaryButton 增加 `size` prop：`'lg'`（32rpx）、`'md'`（30rpx）、`'sm'`（28rpx）
2. 各页面按源值传参：auth→lg, admin→md, AI→sm

**检测命令**：
```bash
# Phase 2 新增：对每个共享组件，检查各实例的基础 CSS 属性值是否一致
# 以 PrimaryButton 为例：
grep -A20 "PrimaryButton\|PrimaryBtn\|<button.*submit\|<button.*保存" <source>/src/ --include="*.tsx" -rn \
  | grep -E "padding|fontSize|borderRadius"
# → 如果输出中同一个 CSS 属性有 N 个不同值，该属性必须作为 prop
```

**防范措施**（已写入 phase2-mapping.md §7a-补充3）：
- Phase 2 差异化参数表增加"基础 CSS 属性"为独立维度
- 任何 CSS 属性如果在 ≥2 个实例之间有不同值 → 必须转化为 prop
- 此维度与"语义属性维度"同等地位，不可跳过

### PM-M10: 共享组件内部 DOM 结构 — 标题区位置偏差 🆕

> **来源**：2026-07-17 第二次 figma-prototype → english-dict-uni 迁移，Phase 4 审查发现。

**现象**：home/libraries/profile 页面的标题文字比搜索框/内容区偏右约 60rpx，
未与页面内容左对齐。

**根因**：PageHeader 组件的标题区（titles）被放在了一个不必要渲染的 flex bar 内部。
源项目中，纯标题页面（home/libraries/profile）的结构是：
```
header div (padding: 52px 24px 20px)
├── <p> 副标题 </p>
├── <h1> 标题 </h1>
└── <div> 搜索框/内容区 </div>  ← 与标题在同一左起点
```
目标 Agent 将所有页面的标题都放入 bar 内：
```
page-header
└── bar (flex, space-between, v-if="showBack || $slots.right")
│   ├── spacer (60rpx)  ← 🔴 无返回按钮时也渲染
│   ├── titles           ← 起点 = padding(48) + spacer(60) = 108rpx
│   └── spacer (60rpx)
└── slot/SearchBar       ← 起点 = padding(48) = 48rpx ✅
```
标题与 slot 不在同一左起点，偏差 60rpx。

**根因的根因**：Phase 2 步骤 7a 的"children/slot 位置差异化分析"只覆盖了
`<slot />` 在组件模板中的位置（兄弟 vs 子节点），没有覆盖组件**自身固定子元素**
（如标题区 titles）在不同源实例中的 DOM 位置是否一致。

在源文件中：
- home 页：标题是 header div 的**直接子节点**（无 bar）
- admin 页：标题在 `<PageHeader>` 的 **children 中**传给同一组件模板

这个差异在 Phase 2 未被识别 → Phase 3 Agent 自由选择标题放 bar 内 → 偏差。

**修复**：
PageHeader 模板重构：
1. bar 改为 `v-if="showBack || $slots.right"` 条件渲染
2. 标题区从 bar 内部移到 bar 外部（作为 header 的直接子节点）
3. 标题区与 `<slot />` 共享同一左侧起点（均由 header 的 padding 控制）

**检测命令**：
无自动化检测——需要人工比对组件模板的 DOM 树与每个源实例的 DOM 树。
唯一有效手段：Phase 2 事前分析（已写入 phase2-mapping.md §7a-补充2）。

**防范措施**（已写入 phase2-mapping.md §7a-补充2）：
- Phase 2 共享组件分析的 children/slot 位置维度从"仅分析 `<slot />`"扩展为
  "分析组件所有非 slot 固定子元素在每个源实例中的 DOM 位置"
- 判定规则：如果任何固定子元素（如标题区）在 ≥2 个源实例中位于不同位置 →
  Phase 3 Agent Prompt 必须指定该元素在组件模板中的精确位置

---

## 七、Phase 3 生成顺序（拓扑排序）

```
Layer 0: types.ts, mockData.ts                    → 无依赖，可并行
Layer 1: helpers.ts, user.ts, useInputFocus.ts    → 依赖 Layer 0，可并行
Layer 2: 7 共享组件                                → 🔴 串行 + 逐个验证关
Layer 2.5: 静态资源占位                             → iconfont.ttf + 6 tabBar PNG
Layer 3: 5 叶子页面 (home,auth,libraries,library-words,profile) → 可并行
Layer 4: word-detail + 6 admin 子组件              → 可并行
Layer 5: App.vue → main.ts                        → 串行，使用已验证模板
Layer 6: package.json, vite.config.ts, tsconfig.json, index.html,
         pages.json, manifest.json, uni.scss, shims-vue.d.ts  → 可并行
```

---

## 八、Phase 4 验证清单（补充项）

常规验证清单外，本次 React → uni-app 迁移特别增加的检查项：

- [x] **[PM-M1]** 检查 `ref` 未从 `@dcloudio/uni-app` 导入
- [x] **[PM-M2]** 检查所有 `@dcloudio/*` 版本号一致
- [x] **[PM-M3]** 检查 `iconfont.ttf` 物理存在
- [x] **[PM-M5]** 🆕 检查 `iconfont.ttf` 完整性（`wc -c` ≥ 1KB，排除 38 字节损坏文件）
- [x] **[PM-M6]** 🆕 检查 iconfont 渲染模式 — `:class="icon"` 模式和 JS 中 `'&#x` HTML entity 零命中
- [x] **[PM-M4]** 审计脚本运行后人工逐项验证（不只看退出码）
- [x] 所有 `backdrop-filter` 被 `/* #ifdef H5 */` 包裹
- [x] 所有 `transition` 在原生组件上的被 `/* #ifdef H5 */` 包裹
- [x] 所有 `@import url()` / `*` / `html body` 选择器被 `/* #ifdef H5 */` 包裹
- [x] 所有 `input` 有显式 `height` 且使用闭合标签
- [x] 所有 `textarea` 有 `auto-height` 且无 `resize`
- [x] emoji 零命中
- [x] 共享组件被正确引用（而非页面手写替代）
- [x] 🆕 构建产物 `@font-face` 中 base64 字体内容长度 > 200 字符（排除 60 字符的空 base64）
- [x] **[PM-M7]** 🆕 检查 `<text>` 元素截断（nowrap+ellipsis）是否缺 `display: block` — 对 `text-overflow: ellipsis` 的每个命中，确认对应 `<text>` 的 CSS 有 `display: block`
