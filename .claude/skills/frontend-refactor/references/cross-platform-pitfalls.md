# 跨平台原生组件陷阱 — Cross-Platform Native Component Pitfalls

## 目的

本文档描述 Web 组件与跨平台框架原生组件之间的根本差异所导致的常见样式/行为陷阱。
它**不绑定于任何特定迁移对**——任何涉及原生组件渲染平台
（uni-app 小程序端、Taro 小程序端、React Native、Flutter 等）的迁移都应加载本文档。

## 何时加载

- 目标平台是 uni-app（需编译到小程序） → **必须加载**
- 目标平台是 Taro → **必须加载**
- 目标平台是 React Native / Flutter → **加载 §1（陷阱模式是通用的）**
- 目标平台是纯 Web（Next.js / Nuxt / Vite SPA） → **不加载**

---

## §1 原生组件的 CSS 盒模型陷阱

### 根本原因

在微信/支付宝/百度/字节等小程序平台中，`<input>`、`<textarea>`、`<video>` 等元素
由**原生渲染层**绘制，而非 WebView DOM。这导致三个根本差异：

1. **不自动计算盒模型** — 浏览器会基于 `padding` + `line-height` + `font-size`
   自动推算 input 高度。原生组件不会——没有显式 `height` 则 wrapper 高度为 0。
2. **不支持 CSS transition/animation** — 原生层与 WebView 渲染不同步，
   动画帧错位导致闪烁或无响应。
3. **overflow: hidden 裁剪原生层** — 原生组件在 WebView 之上的独立层渲染，
   父容器的 `overflow: hidden` 会裁掉这个层级，导致不可见/不可点击。

### 陷阱清单

| ID | 描述 | 影响平台 | H5 表现 | 小程序表现 | 严重性 |
|----|------|---------|--------|-----------|--------|
| NC-01 | `<input>` 无显式 `height`，wrapper 高度为 0 | 全部小程序 | ✅ 正常 | ❌ 输入框不可见/不可点击 | 🔴 Blocker |
| NC-02 | `<input>` 自闭合 `/>` | 微信/百度 | ✅ 正常 | ❌ 不渲染或渲染异常 | 🔴 Blocker |
| NC-03 | `<textarea>` 无 `auto-height` | 全部小程序 | ✅ 正常 | ❌ 固定高度，内容溢出不可见 | 🟡 Major |
| NC-04 | CSS `transition` 应用于原生组件 | 全部小程序 | ✅ 正常 | ❌ 闪烁、点击无响应 | 🔴 Blocker |
| NC-05 | `overflow: hidden` 裁剪原生层 | 全部小程序 | ✅ 正常 | ❌ 输入区域不可点击 | 🔴 Blocker |
| NC-06 | 包裹容器无 `min-height`（border/bg 在容器上） | 全部小程序 | ✅ 正常 | ❌ 整个输入区塌陷不可见 | 🔴 Blocker |
| NC-07 | `<text>` 组件中英文混排不自动换行 | 全部小程序 | ✅ 正常 | ❌ 长文本超出卡片 | 🟡 Major |
| NC-08 | `resize: vertical` 应用于 `<textarea>` | 全部小程序 | ✅ 正常 | ❌ 不支持 resize | 🟢 Minor |
| NC-09 | `@import url("https://...")` 引入外部 CSS | 全部小程序 | ✅ 正常 | ❌ WXSS 解析错误 `token 'url'` → 全局样式加载失败 → timeout | 🔴 Blocker |
| NC-10 | CSS 通配选择器 `*`（如 `* { box-sizing }`） | 全部小程序 | ✅ 正常 | ❌ WXSS 解析错误 `unexpected token '*'` → 全局样式加载失败 → timeout | 🔴 Blocker |
| NC-11 | `html`/`body` 元素选择器 | 全部小程序 | ✅ 正常 | ❌ WXSS 解析错误（小程序没有 html/body 概念） → 样式加载失败 → timeout | 🔴 Blocker |
| NC-12 | `<text>` 组件中 `\n` 不换行 | 全部小程序 | ✅ `white-space` 生效 | ❌ 换行符折叠为空格，所有文字挤在一行 | 🟡 Major |
| NC-13 | 原生 `<select>` 或通用 Dropdown 在移动端无底部弹出行为 🆕 | React/Vue (Web) 目标 | ✅ 桌面端正常 | ❌ 移动端显示 Web 下拉而非 Bottom Sheet，与 uni-app `<picker>` 的底部弹出体验不一致 | 🟡 Major |
| NC-14 | `<text>` 默认 `display: inline`，替代任何 HTML 块级元素时行为不同 🆕 | uni-app/Taro 目标 | ✅ 源 HTML `<p>`/`<h1>`~`<h6>` 默认 `display: block`，宽度受父容器约束、后续兄弟元素自动换行 | ❌ `<text>` 是行内元素，宽度由内容撑开，后续兄弟元素不自动换行。表现为三类问题：(a) nowrap+ellipsis 截断失效 (b) 期望另起一行的 sibling 元素（badge、按钮等）跟 text 挤在同一行 (c) margin-top/bottom 不生效无法撑开间距 | 🔴 Blocker |

### NC-09~NC-11 链式故障机制

这三个陷阱具有**连锁效应**：任何一个触发 → `app.wxss` 解析失败 → 全局样式表整块不加载 →
页面渲染管线初始化超时 → `Error: timeout` → 所有页面内容不显示（但原生 tabBar 仍可见，
因为它是原生组件，不依赖 WXSS）。**现象相同但根因不同**，必须逐项排查。

## 关联的 Phase 2 设计决策

| 决策 ID | 描述 | 关联陷阱 |
|---------|------|---------|
| D8 | 小程序端 input focus 放弃 CSS transition，改用背景色突变 | NC-04 |
| D3 | header backdrop-filter H5 条件编译保留 | NC-05（overflow 条件编译同理） |

### 修复模板

#### NC-01: input 高度公式

```
通用公式: height = padding-top + line-height × font-size + padding-bottom

uni-app rpx 示例:
  原型 padding: 13px 14px, font-size: 15px
  → 目标 padding: 26rpx 28rpx, font-size: 30rpx
  → height = 26rpx + (30rpx × 1.5) + 26rpx = 97rpx

Taro px 示例:
  原型 padding: 13px 14px, font-size: 15px
  → height = 13px + (15px × 1.5) + 13px = 48.5px → 取 49px
```

修复代码：

```css
/* ❌ 原始 — 只有 padding，无 height */
.auth-page__input {
  width: 100%;
  padding: 28rpx 32rpx;
  font-size: 32rpx;
}

/* ✅ 修复 — 添加 height + 条件编译 transition */
.auth-page__input {
  width: 100%;
  height: 104rpx;                    /* ← 新增 */
  padding: 28rpx 32rpx;
  font-size: 32rpx;
  /* #ifdef H5 */
  transition: border-color 0.2s;
  /* #endif */
}
```

#### NC-02: input 闭合标签

```html
<!-- ❌ 自闭合 — 小程序中不可靠 -->
<input v-model="value" class="my-input" />

<!-- ✅ 闭合标签 -->
<input v-model="value" class="my-input" ></input>
```

#### NC-03: textarea auto-height

```html
<!-- ❌ 无 auto-height -->
<textarea v-model="desc" class="my-textarea" />

<!-- ✅ 有 auto-height + 闭合 -->
<textarea v-model="desc" class="my-textarea" auto-height></textarea>
```

#### NC-04: transition 条件编译

```css
/* ❌ 无保护 */
.my-input {
  transition: border-color 0.2s, background 0.2s;
}

/* ✅ 条件编译 */
.my-input {
  /* #ifdef H5 */
  transition: border-color 0.2s, background 0.2s;
  /* #endif */
}
```

#### NC-05: overflow 条件编译

```css
/* ❌ 无保护 — 裁剪原生组件 */
.search-bar {
  overflow: hidden;
}

/* ✅ 条件编译 */
.search-bar {
  /* #ifdef H5 */
  overflow: hidden;
  /* #endif */
}
```

#### NC-06: 包裹容器 min-height

```css
/* ❌ 无兜底 — 容器高度为 0 */
.phone-wrap {
  display: flex;
  align-items: center;
  border: 3rpx solid #E5E7EB;
  background: #fff;
}

/* ✅ 有 min-height 兜底 */
.phone-wrap {
  display: flex;
  align-items: center;
  border: 3rpx solid #E5E7EB;
  background: #fff;
  min-height: 104rpx;              /* 与内部 input height 一致 */
}
```

#### NC-07: 文本换行

```html
<!-- ❌ <text> 在中英文混排时可能不换行 -->
<text class="word-meaning">{{ longChineseText }}</text>

<!-- ✅ <view> 换行行为与 web <p> 一致 -->
<view class="word-meaning">{{ longChineseText }}</view>
```

```css
.word-meaning {
  word-break: break-all;       /* 强制所有字符可断行 */
  overflow-wrap: break-word;   /* 长单词在边界处断行 */
}
```

#### NC-08: textarea resize 移除

```css
/* ❌ 小程序 textarea 不支持 resize */
.admin__textarea { resize: vertical; }

/* ✅ 移除 resize，由 auto-height 替代 */
.admin__textarea { /* resize 移除 */ }
```

#### NC-09: `@import url()` 外部 CSS

```scss
/* ❌ WXSS 仅支持 @import 本地相对路径，url() 形式触发解析错误 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap');

/* ✅ H5 条件编译 — 小程序端完全不注入此规则 */
/* #ifdef H5 */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300..700&display=swap');
/* #endif */
```

> 🔴 编译后 WXSS **不能有任何 `@import url(http...)` 行**。即使 URL 是境内 CDN，
> WXSS 的 `@import` 语法也不接受函数形式的 `url()` 参数——只接受 `@import "./base.wxss"`。

#### NC-10: 通配选择器 `*`

```scss
/* ❌ WXSS 不支持通配选择器 — unexpected token '*' */
* { box-sizing: border-box; }

/* ✅ H5 条件编译 */
/* #ifdef H5 */
* { box-sizing: border-box; }
/* #endif */
```

#### NC-11: `html`/`body` 选择器

```scss
/* ❌ WXSS 不支持 html/body 选择器（小程序没有这些元素） */
html, body { height: 100%; margin: 0; padding: 0; }

/* ✅ H5 条件编译 */
/* #ifdef H5 */
html, body { height: 100%; margin: 0; padding: 0; }
/* #endif */
```

#### NC-12: `<text>` 组件中 `\n` 不换行

```html
<!-- ❌ <text> 中 \n（换行符）被折叠为空格 -->
<text class="title">用物理意象\n读懂英语</text>
```

```css
/* ✅ 显式声明 white-space: pre-line */
.title { white-space: pre-line; }
```

> **原理**：小程序 `<text>` 遵循 HTML 空白折叠规则——换行符（LF）折叠为普通空格。
> `white-space: pre-line` 保留换行符并正常断行（H5 同样需要此属性）。

#### NC-14: `<text>` 默认 `display: inline` → 任何替代 HTML 块级元素的行为都不同 🆕

**根本原因**：HTML `<p>` 和 `<h1>`~`<h6>` 的默认 `display` 是 `block`，所以：
(a) 元素宽度受父容器约束 → `nowrap+ellipsis` 正常截断
(b) 后续兄弟元素自动换到下一行 → badge、按钮等自然分离
(c) `margin-top/bottom` 生效 → 行间距正常

uni-app/Taro 的 `<text>` 组件默认 `display: inline` ——以上三项全不生效。

**适用范围**：
- 任何源 HTML `<p>`、`<h1>`~`<h6>` → uni-app/Taro `<text>` 的迁移
- **触发条件（满足任意一条即命中）**：
  1. 源元素使用了 `overflow:hidden` + `text-overflow:ellipsis` + `white-space:nowrap`
  2. 源元素下方紧跟期望另起一行的兄弟元素（如 badge、按钮、第二个 `<p>`）
  3. 源元素使用了 `margin-top` 或 `margin-bottom` 作为行间距
- **即使不跨平台**（纯 H5）：uni-app 的 `<text>` 在 H5 端也是 inline，问题同源

**检测方法**：
```bash
# Phase 2：扫描源 HTML 块级标签 (p/h1-h6) → 目标 text 的所有替换点
grep -rn "<\(p\|h[1-6]\)" <源项目>/src/ --include="*.tsx" --include="*.vue"
# → 每个命中都需要在目标 CSS 中有 display: block

# Phase 2：扫描源中 nowrap+ellipsis 模式（子集检查）
grep -rn "white-space:\s*nowrap" <源项目>/src/ --include="*.tsx" --include="*.vue" -A3 | grep -E "text-overflow|overflow"

# Phase 4：检查目标项目的 <text> 是否有截断但缺 display:block（原有检查）
grep -rn "text-overflow:\s*ellipsis" <目标>/src/ --include="*.vue" -B10 | grep "<text"
# → 对每个命中，检查对应 CSS 类是否有 display: block

# 🆕 Phase 4：检查目标项目所有 <text> 的 CSS 类是否缺 display:block（通用检查）
# 对所有包含 <text 的 .vue 文件，提取 class 名，验证对应 SCSS 中的 display 属性
grep -rn "<text" <目标>/src/pages/ --include="*.vue" -A0 | grep 'class='
# → 对每个 class，grep 同名 SCSS 选择器中是否有 display: block
```

**修复模板**：

```html
<!-- ❌ 错误 — <text> 是 inline，nowrap+ellipsis 不生效 -->
<text class="card-meaning">{{ word.coreMeaning }}</text>
```
```css
/* ❌ 配套的失效 CSS */
.card-meaning {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**修复方案 A — 需要单行截断**（如列表摘要）：
```css
.card-meaning {
  display: block;          /* ← 🔴 关键：将 inline 转为 block */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

**修复方案 B — 需要多行自然换行**（如卡片详情）：
```css
.card-meaning {
  display: block;          /* ← 撑满父容器宽度 */
  overflow-wrap: break-word;
  line-height: 1.5;
}
```
	
**修复方案 C — 无截断但后续兄弟需换行**（如列表摘要后跟 badge）🆕：
```css
.card-meaning {
  display: block;          /* ← 🔴 关键：强制换行，让 badge 另起一行 */
  font-size: 24rpx;
  color: #6B7280;
  line-height: 1.5;
}
```

> **注意**：`display: block` 是唯一修复——`display: inline-block` 不能解决截断问题
> （inline-block 的宽度仍然由内容撑开，`nowrap` 下它不会感知父容器的 max-width）。
> 方案 C 不需要 `overflow:hidden` 或 `text-overflow`——它的目的是**换行行为**而非截断。
> 这是一个独立于方案 A/B 的问题表现，但根因完全相同。

### 🆕 NC-14 反向陷阱：`display: block` 过度应用

> **来源**：2026-07-17 React→uni-app 迁移。PM-M8：Agent 将源 `<span style="display:inline-block">`
> 转换为 `<text>` 后错误地加上了 `display: block`——元素从内容撑开变为父容器全宽。

**问题**：NC-14 解决的是"`<text>` 替代块级元素时缺 `display: block`"的问题，
但 Agent 容易形成"`<text>` → 加 `display: block`"的惯性——对原本是
`inline`/`inline-block` 的元素也套用规则。

**判定矩阵**：

| 源元素 | 源 display | 目标 `<text>` 应写 | 不应写 |
|--------|----------|-------------------|--------|
| `<p>`, `<h1>`~`<h6>` | `block` | `display: block` ✅ | — |
| `<span>` 无显式 display | `inline` | 不写 display（默认 inline 即可） | `display: block` ❌ |
| `<span style="display:inline-block">` | `inline-block` | `display: inline-block` | `display: block` ❌ |
| `<div>` | `block` | 不适用（`<div>` → `<view>`，不是 `<text>`） | — |

**检测命令**：
```bash
# Phase 4：查找所有在 <text> 上使用 display:block 的 CSS 块
# 对每个命中回溯源元素类型——源是 <span> 则 display:block 是反向偏差
grep -rn "display:\s*block" src/components/ src/pages/ --include="*.vue" -B15 \
  | grep -E "<text|display:\s*block" \
  | grep -B1 "display:\s*block"
```

**防范**：
- Phase 3 Agent Prompt 中 NC-14 的表述必须从"`<text>` 需要 `display: block`"
  改为"`<text>` 的 display 值必须与源元素的 display 值一致"
- Phase 4 必须执行 NC-14 反向检测（见 phase4-verification.md Step 4.0 补充检查）

#### NC-13: 原生 `<select>` 在移动端无底部弹出行为 🆕

**根本原因**：uni-app 的 `<picker mode="selector">` 在小程序和移动端 H5 上均从屏幕底部弹出，
这是移动端原生系统的标准交互模式。但 Web 框架的 `<select>` 和 Radix UI `<Select>` 在
移动端浏览器中仍按 Web 方式在触发元素附近展开下拉——**浏览器不会因为视口宽度变窄就
把 `<select>` 改为 Action Sheet**。

**适用范围**：
- 从 uni-app / Taro / 小程序 → React / Vue (Web) 的迁移（移动端体验丢失）
- 响应式 Web 应用（需要在移动端提供原生级体验）

**检测方法**：

```bash
# 在源项目中搜索选择器组件
grep -rn '<picker\|<Picker\|mode="selector"\|<select\|Dropdown\|ActionSheet' src/

# 在目标项目中检查组件的移动端行为
# 关键问题：目标项目中有多少选择器在移动端仍然使用 Web 下拉？
grep -rn '<select\|SelectTrigger\|SelectContent' src/
```

**修复模板 — React (shadcn/ui)**：

```tsx
// 新建 src/components/ui/adaptive-select.tsx
import { useIsMobile } from './use-mobile';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './select';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from './drawer';
import { useState } from 'react';

interface AdaptiveSelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: { label: string; value: T }[];
  placeholder?: string;
}

export function AdaptiveSelect<T extends string>({
  value, onValueChange, options, placeholder = '请选择',
}: AdaptiveSelectProps<T>) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile) {
    // 桌面端：使用 Select (Radix Popover)
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // 移动端：使用 Drawer (Vaul Bottom Sheet)
  const selected = options.find(o => o.value === value);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm"
      >
        {selected?.label || placeholder}
        <ChevronDown className="size-4 opacity-50" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{placeholder}</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onValueChange(opt.value); setOpen(false); }}
                className={`w-full rounded-md px-4 py-3 text-left text-sm ${
                  opt.value === value
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
```

**修复模板 — 纯 Vue 3 (无 UI 库)**：

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  modelValue: string;
  options: { label: string; value: string }[];
  placeholder?: string;
}>();
const emit = defineEmits<{ 'update:modelValue': [v: string] }>();

const isMobile = ref(false);
const mql = window.matchMedia('(max-width: 767px)');
isMobile.value = mql.matches;
mql.addEventListener('change', (e) => { isMobile.value = e.matches; });

// 桌面用原生 select（简化），移动端用自定义 bottom sheet
// 完整实现需自行构建 Drawer 组件
</script>
```

**不要做的事**：

```tsx
// ❌ 只用原生 <select> — 移动端体验差
<select value={form.libraryId} onChange={e => set('libraryId', e.target.value)}>
  {libraries.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
</select>

// ❌ 只检测一次设备类型就不改了（横屏切换、折叠屏展开不响应）
const isMobile = /iPhone|Android/.test(navigator.userAgent);  // 脆弱的 UA 检测

// ✅ 使用 matchMedia 或 useIsMobile hook（响应式）
const isMobile = useIsMobile();  // 监听 resize，响应横竖屏切换
```

---

## §2 检测命令集（Phase 2/Phase 4 使用）

### NC-01: 检测 input 缺少 height

```bash
# uni-app
grep -A10 '<input' src/ --include="*.vue" -rn | grep -v 'height:'

# Taro
grep -A10 '<Input' src/ --include="*.tsx" -rn | grep -v 'height'
```

### NC-02: 检测 input 自闭合

```bash
# uni-app — 搜索自闭合 input 标签
grep -rn '<input[^>]*/>' src/ --include="*.vue"

# Taro — 搜索自闭合 Input 标签
grep -rn '<Input[^>]*/>' src/ --include="*.tsx"
```

### NC-03: 检测 textarea 缺少 auto-height

```bash
# uni-app
grep -B5 '<textarea' src/ --include="*.vue" -rn | grep -v 'auto-height'

# Taro
grep -B5 '<Textarea' src/ --include="*.tsx" -rn | grep -v 'autoHeight'
```

### NC-04: 检测 transition 未条件化

```bash
# 搜索所有 transition: 声明，排除已条件化的
grep -rn 'transition:' src/ --include="*.vue" --include="*.scss" | grep -v '#ifdef H5' | grep -v '//'
```

### NC-05: 检测 overflow: hidden 未条件化

```bash
grep -rn 'overflow:\s*hidden' src/ --include="*.vue" --include="*.scss" | grep -v '#ifdef H5' | grep -v '//'
```

### NC-06: 检测可能塌陷的包裹容器

```bash
# 搜索 .*-wrap / .*-wrapper 类容器 — 它们包裹 input 并承载 border
grep -rn 'class="[^"]*wrap\|class="[^"]*wrapper' src/ --include="*.vue"
# 对每个结果检查其 CSS 是否有 min-height
```

### NC-07: 检测文本换行问题

```bash
# 搜索中文释义区域使用 <text> 而非 <view>（可能有换行风险）
grep -rn '<text[^>]*meaning\|<text[^>]*desc\|<text[^>]*释义' src/ --include="*.vue"
```

### NC-09~NC-11: 检测 WXSS 不兼容的全局 CSS（🔴 阻断性检查）

```bash
# NC-09: 检测 @import url() 外部资源（必须全部被 #ifdef H5 包裹）
grep -rn '@import\s\+url(' src/ --include="*.vue" --include="*.scss" | grep -v '#ifdef H5'

# NC-10: 检测裸的 * 选择器（必须全部被 #ifdef H5 包裹）
grep -rn '^\s*\*\s*{' src/ --include="*.vue" --include="*.scss" | grep -v '#ifdef H5'

# NC-11: 检测裸的 html/body 选择器（必须全部被 #ifdef H5 包裹）
grep -rn '^\s*html\b\|^\s*body\b\|^\s*#app\s*{' src/ --include="*.vue" --include="*.scss" | grep -v '#ifdef H5'

# 编译产物验证：WXSS 中不得出现外部 URL 或禁用选择器
grep -rn 'url("https\?://' dist/build/mp-weixin/ --include="*.wxss"
grep -rn '^\s*\*{' dist/build/mp-weixin/ --include="*.wxss"
grep -rn '^\s*html,\|^\s*body{' dist/build/mp-weixin/ --include="*.wxss"
```

### NC-12: 检测 `<text>` 组件换行需求

```bash
# 搜索包含 \n 且被 <text> 包裹的内容（需要 white-space: pre-line）
grep -rn '\\\\n' src/ --include="*.vue" -B2 | grep '<text'
# 对每个命中，检查对应 CSS 类是否有 white-space: pre-line
```

### NC-14: 检测 `<text>` 截断缺 `display: block` 🆕

```bash
# 搜索所有使用 text-overflow:ellipsis 的 SCSS 块
grep -rn 'text-overflow:\s*ellipsis' src/ --include="*.vue" --include="*.scss" -B10

# 对每个命中，检查：
# 1. 目标元素是否为 <text>（而非 <view>）
# 2. 如果元素是 <text>，对应的 CSS 是否包含 display: block

# 快速一键检测 —— 查找 .vue 中 <text> + 截断 CSS 但缺 display:block
# （手动执行：对每个 text-overflow 命中，向上找到 <text class="...">，
#  再检查该 class 的定义是否有 display:block）
```

---

## §3 不同框架的原生组件清单

### uni-app (小程序端)

| 组件 | 受影响 CSS 属性 | 备注 |
|------|----------------|------|
| `<input>` | transition, animation, overflow, position:fixed, z-index | 最常用的原生组件 |
| `<textarea>` | 同上 | 额外需要 `auto-height` |
| `<video>` | transition, transform, opacity | H5 表现差异大 |
| `<canvas>` | 大部分 CSS 不生效 | 使用 Canvas API |
| `<map>` | 全部 CSS 不生效 | 完全原生渲染 |
| `<web-view>` | 全部 CSS 不生效 | 铺满整个容器 |

### Taro (小程序端)

| 组件 | 受影响 CSS 属性 |
|------|----------------|
| `<Input>` | transition, animation, overflow |
| `<Textarea>` | 同上 |
| `<Video>` | transition, transform |
| `<Canvas>` | 大部分 CSS 不生效 |
| `<Map>` | 全部 CSS 不生效 |

### 微信原生小程序

uni-app 的清单 + 额外组件：`<camera>`, `<live-player>`, `<live-pusher>`, `<open-data>`

---

## §4 本次实战案例索引

以下案例来自 `React (inline-style) → uni-app (Vue 3)` 迁移项目，
记录了每个陷阱的发现位置和修复方式：

| 陷阱 ID | 发现文件 | 发现日期 | 现象 | 修复文件 |
|---------|---------|---------|------|---------|
| NC-01 | `SearchBar.vue` | 2026-07 | 搜索框 uni-input wrapper 高度为 0，H5 正常、小程序不可点击 | 加 `height: 104rpx` |
| NC-01 | `auth/index.vue` (3 处 input) | 2026-07 | 登录/注册表单全部输入框在小程序端不可编辑 | 3 处 input 加 `height: 104rpx` |
| NC-01 | `admin/index.vue` (5 处 input) | 2026-07 | 管理后台表单 input 不可编辑 | 加 `height: 97rpx` |
| NC-02 | `SearchBar.vue` | 2026-07 | `<input />` 自闭合在小程序中不渲染 | 改为 `<input></input>` |
| NC-02 | `auth/index.vue` (3 处) | 2026-07 | 同上 | 3 处改为 `></input>` |
| NC-02 | `admin/index.vue` (5 处) | 2026-07 | 同上 | 5 处改为 `></input>` |
| NC-03 | `admin/index.vue` (7 处 textarea) | 2026-07 | 表单 textarea 固定高度，内容超出不可见 | 加 `auto-height` |
| NC-04 | `SearchBar.vue` + `auth/index.vue` + `admin/index.vue` | 2026-07 | 小程序端 input 点击无响应（transition 触发重绘冲突） | 全部 transition 用 `/* #ifdef H5 */` 包裹 |
| NC-05 | `SearchBar.vue` | 2026-07 | 搜索图标层可见但搜索框不可点击 | `overflow: hidden` 改为 H5 条件编译 |
| NC-06 | `auth/index.vue` phone-wrap / password-wrap | 2026-07 | 手机号/密码包裹容器塌陷 | 加 `min-height: 104rpx` |
| NC-07 | `WordListItem.vue` + `admin/index.vue` | 2026-07 | 中文释义长文本超出卡片 | `<text>` 改 `<view>` + `word-break: break-all` |
| NC-08 | `admin/index.vue` | 2026-07 | `resize: vertical` 在 textarea 上不生效 | 移除 `resize`，由 `auto-height` 替代 |
| NC-09 | `App.vue` | 2026-07-15 | `@import url(https://fonts.googleapis.com/...)` → WXSS 编译错误 `token 'url'` → timeout → 全页面白屏 | 用 `/* #ifdef H5 */` 包裹 Google Fonts import |
| NC-10 | `App.vue` | 2026-07-15 | `* { box-sizing }` → WXSS 编译错误 `unexpected token '*'` → timeout → 全页面白屏 | 用 `/* #ifdef H5 */` 包裹通用选择器 |
| NC-11 | `App.vue` | 2026-07-15 | `html, body { ... }` + `#app { ... }` → WXSS 编译错误 | 用 `/* #ifdef H5 */` 包裹 |
| NC-12 | `PageHeader.vue` + `profile.vue` | 2026-07-15 | `\n` 在 `<text>` 中不换行，显示为一行字符串 | 加 `white-space: pre-line` |
| NC-13 | `AdminView.tsx` (2 处 `<select>`) | 2026-07-15 | uni-app → React (shadcn) 迁移后，管理后台词库/词性选择在移动端显示 Web 下拉而非底部弹出——与 uni-app `<picker>` 体验不一致 | 创建 AdaptiveSelect 组件：桌面用 `<Select>` (Radix)，移动端用 `<Drawer>` (Vaul)，通过 `useIsMobile()` 切换 |
| NC-14 | `WordManager.vue`, `WordCard.vue` | 2026-07-15 | `<text class="card-meaning">` 使用 nowrap+ellipsis 三件套，文字溢出卡片不换行、无省略号。根因：`<text>` 默认 `display:inline`，宽度由内容撑开，`text-overflow` 需要块级 box | WordManager：改为 `display:block` + `overflow-wrap:break-word`；WordCard compact：加 `display:block` |

---

## §5 Phase 各阶段如何使用本文档

### Phase 1（分析）

- 设计 Token 提取时标注：哪些属性在目标平台的原生组件上受限
- 增加"平台默认样式"提取维度——原生组件在各平台上的默认外观差异

### Phase 2（映射）

- 步骤 2.1：若目标包含小程序平台，加载本文档
- 步骤 2.4a（多平台影响评估）：将本文档 NC-01 ~ NC-13 作为评估基线
- 全局样式规则表中派生 G9~G17（原生组件合规规则 + WXSS CSS 兼容性规则 + 平台自适应选择器规则 🆕）
- 步骤 2.4c（平台自适应选择器映射）🆕：若源项目有 `<picker>` / `<select>`，必须在 Phase 2 标记为需创建 AdaptiveSelect 组件，规划选项数据格式统一、open/onOpenChange 跨组件 props
- 🔴 App.vue 模板检查（防止 NC-09~NC-11 重演）：检查目标项目的 App.vue 是否包含未条件化的
  `@import url()`、`*` 选择器、`html`/`body` 选择器。这三项必须全部用 `/* #ifdef H5 */` 包裹

### Phase 3（生成）

- Agent prompt 第五节（全局样式约束）注入原生组件合规规则 + WXSS CSS 兼容性规则
- Agent prompt 第九节（输出规范）增加原生组件合规要求
- Agent prompt 第三节 b（DOM 结构保持）增加闭合标签约束
- 🔴 Agent 生成 App.vue 时必须同时产出两种编译产物的验证命令

### Phase 4（验证）

- Step 2a 样式审计增加原生组件合规审计维度
- Step 2e-3 值级提取增加原生组件检测脚本
- 常见遗漏模式表增加原生组件相关条目

---

## §6 与其他文档的关系

```
cross-platform-pitfalls.md
  ├── 被 SKILL.md 在决策树步骤 4a / 4d 🆕 引用
  ├── 被 style-fidelity.md §4b 引用（快速检查清单）
  ├── 被 interaction-taxonomy.md §11 引用（平台自适应选择交互）🆕
  ├── 被 migrations/react→vue3.md 引用（uni-app 特有注意事项）
  ├── 被 migrations/react→taro.md 引用（Taro 原生组件映射）
  ├── 被 phase3-generation.md §5/§9 引用（生成约束）
  └── 被 phase4-verification.md §2a/§2e-3 引用（审计命令）
```

---

## §7 维护原则

1. **新陷阱从实战中提取**：每次发现新的原生组件陷阱，在此文件追加一条 NC-NN 条目，
   并填入 §4 的案例索引表
2. **不绑定特定迁移对**：陷阱描述必须框架无关——
   写"原生 input wrapper 高度为 0"，不写"uni-app 的 uni-input"
3. **保持检测命令可执行**：§2 中的每个 Grep 命令必须能直接复制到终端运行
4. **跨越框架边界**：如果 React Native 或 Flutter 有类似陷阱，追加到 §3 的清单中
5. **链式故障优先标记**：如果新陷阱会触发连锁效应（如 WXSS 解析错误 → 全局样式不加载 → timeout → 白屏），在 §1 的陷阱清单中增加"链式故障机制"说明，帮助诊断时快速区分根因和表象
