# 图标迁移策略 — 通用全技术栈参考

## 为什么图标需要独立处理

图标迁移比颜色、间距、字体等视觉属性更隐蔽——原因有三：

1. **SVG 兼容性碎片化**：不同平台对 SVG 的支持程度差异极大（见下方矩阵），
   源项目使用的图标方案在目标平台可能完全不可用
2. **Agent 的 emoji 倾向**：AI Agent 在生成代码时极容易用 emoji（🔍 ✨ 📖）替代图标，
   因为 emoji 不需要任何依赖、配置或资源文件
3. **静默失效**：图标不像路由断裂或编译失败那样会报错——它们只是"不显示"或"显示为方块"，
   Phase 4 的存在性审计（检查属性是否存在）天然无法发现图标问题

这就是为什么图标必须在 Phase 1 就被专项分析、在 Phase 2 被独立映射、
在 Phase 3 被强制约束、在 Phase 4 被零容忍扫描。

---

## 一、SVG 支持矩阵

### Web 平台

| 环境 | 内联 `<svg>` | `<img src="x.svg">` | CSS background SVG | SVG sprite | 备注 |
|------|-------------|---------------------|--------------------|-----------|------|
| 现代浏览器 (Chrome/Firefox/Safari/Edge) | ✅ | ✅ | ✅ | ✅ | 全部支持 |
| IE 11 | ⚠️ 部分 | ✅ | ✅ | ❌ | 内联 SVG 有已知 bug |

### 小程序平台

| 环境 | 内联 `<svg>` | `<image src="x.svg">` | CSS background SVG | base64 `<image>` | 备注 |
|------|-------------|----------------------|--------------------|------------------|------|
| 微信小程序 | ❌ | ⚠️ 基础库 ≥2.12.0 支持 | ❌ | ⚠️ 部分 Android 不支持 | 推荐 iconfont |
| 支付宝小程序 | ❌ | ⚠️ 基础库 ≥2.6.0 支持 | ❌ | ⚠️ 同上 | 推荐 iconfont |
| 百度小程序 | ❌ | ❌ | ❌ | ❌ | 仅支持 iconfont |
| 字节跳动小程序 | ❌ | ⚠️ 基础库 ≥2.30.0 | ❌ | ⚠️ | 推荐 iconfont |
| QQ 小程序 | ❌ | ❌ | ❌ | ❌ | 仅支持 iconfont |
| 快应用 | ❌ | ❌ | ❌ | ❌ | 仅支持 iconfont / PNG |

> **结论**：如果要兼容所有小程序平台，**iconfont 是唯一 100% 可用的方案**。

### 跨平台框架

| 框架 | H5 端 | 小程序端 | App 端 | 推荐统一方案 |
|------|-------|---------|--------|------------|
| **Taro** | ✅ 内联 SVG | ❌ | ❌（React Native 无 DOM） | iconfont 或 Taro Icons |
| **uni-app** | ✅ 内联 SVG | ❌ | ❌（nvue 无 DOM） | uni-icons + iconfont 补充 |
| **Flutter** | ✅（Web 端） | — | ✅（自带渲染引擎，支持 SVG 包） | flutter_svg 包 |
| **React Native** | — | — | ⚠️（需 react-native-svg） | react-native-svg 库 |
| **Weex** | ✅ | — | ❌ | iconfont |
| **Ionic / Capacitor** | ✅ | — | ✅（WebView） | 内联 SVG / ionicons |

### 桌面端

| 环境 | 内联 `<svg>` | 备注 |
|------|-------------|------|
| **Electron** | ✅ | Chromium 内核，完整 SVG 支持 |
| **Tauri** | ✅ | 系统 WebView，完整支持 |

---

## 二、图标策略决策树

从 Phase 1 的图标资产清单出发，按以下决策树选择每条路径的图标方案：

```
源项目的图标方案是？
├── 图标库（lucide-react / react-icons / heroicons / @ant-design/icons 等）
│   └── 目标平台是？
│       ├── 纯 Web（React/Vue/Next.js/Nuxt/Svelte 等）
│       │   → 策略 A：保留同名图标库（如果有目标框架版本）
│       │   → 策略 B：替换为等价图标库（如 lucide-react → lucide-vue）
│       │   → 策略 C：提取为 SVG sprite 或内联 SVG 组件
│       │
│       ├── 小程序 + H5（Taro / uni-app）
│       │   ├── uni-app → 策略 D：uni-icons 优先 + iconfont 补充
│       │   └── Taro → 策略 E：Taro Icons 或 iconfont
│       │
│       ├── React Native
│       │   → 策略 F：react-native-svg + react-native-vector-icons
│       │
│       ├── Flutter
│       │   → 策略 G：flutter_svg + 自带 Material Icons
│       │
│       └── 桌面端（Electron / Tauri）
│           → 策略 A/B/C 均可（WebView 全支持）
│
├── 内联 SVG（手写或 SVG 组件）
│   └── 目标平台是？
│       ├── 纯 Web → ✅ 直接保留
│       ├── 小程序 → ❌ 必须替换为 iconfont / PNG / CSS 绘制
│       ├── React Native → ⚠️ 转换为 react-native-svg 组件
│       └── Flutter → ⚠️ 转换为 SVG 资源文件 + flutter_svg
│
├── SVG 文件（<img src="icon.svg">）
│   └── 目标平台是？
│       ├── 纯 Web → ✅ 直接保留
│       ├── 小程序 + H5 → 策略 D/E（转换为 iconfont 或 base64 <image>）
│       └── React Native → 策略 F
│
├── iconfont / 字体图标
│   └── 目标平台是？
│       ├── 纯 Web → ✅ 直接保留（或升级为 SVG sprite）
│       ├── 小程序 + H5 → ✅ 直接保留（最稳定的方案）
│       ├── React Native → ⚠️ 需额外加载字体文件
│       └── Flutter → ⚠️ 转换为 IconData 类或使用自定义字体
│
├── PNG / 位图图标
│   └── 任意目标 → ✅ 全部支持（但不可缩放、颜色不可控）
│
└── CSS 绘制（border / box-shadow / clip-path）
    └── 任意目标 → ✅ 全部支持（但仅适用于简单形状）
```

---

## 三、各策略详细实施指南

### 策略 A：保留同名图标库（目标有对应版本）

**适用**：源用 lucide-react → 目标 React/Next.js  
**不适用**：目标不是源库支持的框架

直接迁移——只需改 import 路径。大多数现代图标库同时提供 React/Vue/Svelte 版本：

| 源图标库 | React 版本 | Vue 3 版本 | Svelte 版本 |
|---------|-----------|-----------|------------|
| Lucide | `lucide-react` | `lucide-vue-next` | `lucide-svelte` |
| Heroicons | `@heroicons/react` | `@heroicons/vue` | — |
| Tabler Icons | `@tabler/icons-react` | `@tabler/icons-vue` | `@tabler/icons-svelte` |
| Phosphor | `@phosphor-icons/react` | `phosphor-vue` | `phosphor-svelte` |
| Radix Icons | `@radix-ui/react-icons` | — | — |
| Ant Design Icons | `@ant-design/icons` | `@ant-design/icons-vue` | — |

**实施步骤**：
1. 列出 Phase 1 图标清单中的所有图标名称
2. 在目标图标库中查找同名图标（绝大多数命名一致）
3. 仅改 import 语句：`import { Search } from 'lucide-react'` → `import { Search } from 'lucide-vue-next'`
4. 如果某个图标在目标库中不存在，标记为"待替换"并用占位图标代替

### 策略 B：替换为等价图标库

**适用**：源图标库没有目标框架版本，或目标项目偏好另一图标库

**实施步骤**：
1. 从 Phase 1 图标清单中提取所有图标的**语义名称**（如 Search → "搜索"、ArrowRight → "右箭头"）
2. 在目标图标库中逐个匹配
3. 构建"源→目标"图标名称映射表（名称可能不完全一致，如 `Sparkles` → `Magic`、`RefreshCw` → `Sync`）
4. Phase 3 Agent 按映射表替换

### 策略 C：提取为 SVG Sprite 或内联 SVG 组件

**适用**：纯 Web 平台，不想引入图标库依赖，或使用了自定义 SVG 图标

**方案 C1 — SVG Sprite（推荐用于多图标项目）**：
```html
<!-- sprite.svg -->
<svg xmlns="http://www.w3.org/2000/svg">
  <symbol id="icon-search" viewBox="0 0 24 24">
    <path d="..."/>
  </symbol>
  <symbol id="icon-arrow-right" viewBox="0 0 24 24">
    <path d="..."/>
  </symbol>
</svg>

<!-- 使用 -->
<svg><use href="sprite.svg#icon-search" /></svg>
```

**方案 C2 — JSX/TSX SVG 组件（React/Vue）**：
```tsx
// icons.tsx
export const SearchIcon = (props: SVGProps) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="..." />
  </svg>
);
```

### 策略 D：uni-icons 优先 + iconfont 补充（uni-app 专用）

**适用**：目标 == uni-app（全端发布）

**优先级**：
1. **优先使用 uni-icons**：`<uni-icons type="search" size="16" color="#9CA3AF" />`
   uni-icons 内置了 100+ 常用图标，全端可用，无需额外配置
2. **uni-icons 没有的图标 → 自建 iconfont**：创建自定义 iconfont 字体文件

**自建 iconfont 流程**：
1. 列出 uni-icons 不覆盖的图标清单
2. 去 [iconfont.cn](https://www.iconfont.cn/) 搜索对应图标
3. 加入购物车 → 添加到项目 → 下载字体包（.ttf + .css）
4. 放入 `src/static/fonts/`
5. 在 `App.vue` 非 scoped style 中声明 `@font-face`
6. 在全局样式定义 `.iconfont { font-family: 'iconfont'; }`

**uni-icons 常用图标速查**：

| 语义 | uni-icons type | 备注 |
|------|---------------|------|
| 搜索 | `search` | ✅ |
| 箭头-右 | `arrowright` | ✅ |
| 箭头-左 | `arrowleft` | ✅ |
| 用户/我的 | `person` | ✅ |
| 设置 | `gear` | ✅ |
| 关闭/× | `clear` | ✅ |
| 对勾/✓ | `checkmarkempty` | ✅ |
| 添加/+ | `plus` | ✅ |
| 眼睛 | `eye` | ✅ |
| 闭眼 | `eye-off` | ❌ 需自建 |
| 书/词库 | `flag` 或自建 | ⚠️ 语义不完全匹配 |
| 星星/闪光 | `star` 或自建 | ⚠️ 语义不完全匹配 |
| 刷新 | `refreshempty` | ✅ |
| 盾牌 | — | ❌ 需自建 |
| 靶心 | — | ❌ 需自建 |
| 登出 | — | ❌ 需自建 |
| 加载中/旋转 | — | CSS animation 替代 |

### 策略 E：Taro Icons 或 iconfont（Taro 专用）

**适用**：目标 == Taro

**方案 E1 — Taro Icons（推荐）**：
```bash
npm install taro-icons
```
```tsx
import { Search, ArrowRight } from 'taro-icons'
<Search size={20} color="#9CA3AF" />
```

**方案 E2 — iconfont（更灵活）**：
Taro 中使用 iconfont 与 uni-app 完全相同——全局注册字体 + `<Text>` 组件引用。

### 策略 F：react-native-svg + react-native-vector-icons

**适用**：目标 == React Native

```bash
npm install react-native-svg react-native-vector-icons
```

```tsx
import Icon from 'react-native-vector-icons/Feather';
<Icon name="search" size={20} color="#9CA3AF" />
```

### 策略 G：flutter_svg + Material Icons

**适用**：目标 == Flutter

```yaml
# pubspec.yaml
dependencies:
  flutter_svg: ^2.0.0
```

```dart
import 'package:flutter/material.dart';
// Material Icons 自带 2000+ 图标，通常够用
Icon(Icons.search, size: 20, color: Color(0xFF9CA3AF))
```

---

## 四、iconfont 基础设施标准模板

当决策树选择 iconfont 方案时，以下基础设施必须在 Phase 3 Layer 2.5（静态资源占位）阶段规划：

### 4.1 文件结构

```
src/
├── static/
│   └── fonts/
│       └── iconfont.ttf          # 图标字体文件
├── styles/
│   └── iconfont.css              # @font-face 声明 + 基础类 + Unicode 映射
└── app.tsx / App.vue             # 全局引入 iconfont.css
```

### 4.2 @font-face 声明

```css
/* src/styles/iconfont.css */
@font-face {
  font-family: 'iconfont';
  src: url('@/static/fonts/iconfont.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: block;  /* 防止文字闪烁 */
}

.iconfont {
  font-family: 'iconfont' !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: inline-block;
  line-height: 1;
  speak: never;  /* 无障碍：屏幕阅读器忽略 */
}

/* Unicode 码点映射 */
.icon-search::before { content: '\e001'; }
.icon-arrow-right::before { content: '\e002'; }
.icon-arrow-left::before { content: '\e003'; }
.icon-sparkles::before { content: '\e004'; }
.icon-book-open::before { content: '\e005'; }
.icon-user::before { content: '\e006'; }
.icon-eye::before { content: '\e007'; }
.icon-eye-off::before { content: '\e008'; }
.icon-shield::before { content: '\e009'; }
.icon-settings::before { content: '\e00a'; }
.icon-target::before { content: '\e00b'; }
/* ... 按需扩展 */
```

### 4.3 在小程序中使用

```html
<!-- uni-app -->
<text class="iconfont icon-search"></text>

<!-- Taro -->
<Text className="iconfont icon-search" />

<!-- 原生小程序 -->
<text class="iconfont icon-search"></text>
```

### 4.4 颜色与尺寸控制

```css
/* iconfont 的文字特性意味着它自动继承 color 和 font-size */
/* 无需单独设置 fill/stroke —— 用 color 和 font-size 即可 */
```

```html
<!-- 蓝色 20px 图标 -->
<text class="iconfont icon-search" style="color: #2563EB; font-size: 20px;"></text>

<!-- 或通过 class -->
<text class="iconfont icon-search icon-blue icon-lg"></text>
```

### 4.5 占位 TTF 文件

在用户提供真实 iconfont.ttf 之前，Phase 3 Layer 2.5 创建最小合法 TTF 占位文件，
防止 `@font-face { src: url(...) }` 在 CSS 编译阶段报 file-not-found：

```bash
# 最小合法 TTF 文件（约 60 字节），仅用于占位
# 真实 iconfont 由用户后续替换
printf '\x00\x01\x00\x00\x00\x0a\x00\x80\x00\x03\x00\x20\x4f\x53\x2f\x32\x51\xd7\xb5\x76\x00\x00\x00\x00...' > src/static/fonts/iconfont.ttf
```

> 占位 TTF 字体中不包含任何字形——所有 iconfont class 的图标不显示但也不会报错。
> 用户替换为真实 iconfont.ttf 后图标自动生效。

### 4.6 iconfont 本地生成流水线（iconfont.cn 替代方案）🆕

当以下任一情况发生时，用本地工具链自动生成字体文件，无需手动操作 iconfont.cn：

- iconfont.cn 需要登录无法自动化
- 源字体文件在迁移中损坏且无备份
- 需要精确控制 unicode 码点以保持与旧代码兼容

**工具链**：SVG 文件 → `svgicons2svgfont` → SVG font → `svg2ttf` → TTF 文件

这两个包是 `fantasticon` 的底层依赖，fantasticon 安装后两者即可直接使用：

```bash
npm install --save-dev fantasticon  # 会自动安装 svgicons2svgfont + svg2ttf
```

**生成脚本模板**（保存为 `scripts/generate-font.cjs`）：

```js
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { SVGIcons2SVGFontStream } = require('svgicons2svgfont');
const svg2ttf = require('svg2ttf');

const SVGS_DIR = path.resolve(__dirname, 'icons');        // SVG 源文件目录
const OUTPUT_DIR = path.resolve(__dirname, '../src/static/fonts');
const FONT_NAME = 'iconfont';
const PREFIX = 'icon';

// 码点映射 — 保持与旧代码兼容，不修改静态文本中的 &#xe0XX; 引用
const CODEPOINTS = {
  search: 0xE001,
  'arrow-right': 0xE002,
  // ... 为每个 SVG 文件名指定码点
};

async function main() {
  const svgFiles = fs.readdirSync(SVGS_DIR).filter(f => f.endsWith('.svg'));
  
  // 1. 收集所有 glyph → SVG font
  let svgFontData = '';
  const fontStream = new SVGIcons2SVGFontStream({
    fontName: FONT_NAME,
    fontHeight: 1024,
    normalize: true,
    centerHorizontally: true,
  });
  
  fontStream.on('data', chunk => { svgFontData += chunk.toString(); });
  
  await new Promise((resolve, reject) => {
    fontStream.on('end', resolve);
    fontStream.on('error', reject);
    let i = 0;
    function writeNext() {
      if (i >= svgFiles.length) { fontStream.end(); return; }
      const name = path.basename(svgFiles[i], '.svg');
      const cp = CODEPOINTS[name];
      const glyph = new Readable();
      glyph.push(fs.readFileSync(path.join(SVGS_DIR, svgFiles[i]), 'utf-8'));
      glyph.push(null);
      glyph.metadata = { name, unicode: [String.fromCodePoint(cp)] };
      fontStream.write(glyph, () => { i++; writeNext(); });
    }
    writeNext();
  });
  
  // 2. SVG font → TTF
  const ttf = svg2ttf(svgFontData, {});
  fs.writeFileSync(path.join(OUTPUT_DIR, `${FONT_NAME}.ttf`), Buffer.from(ttf.buffer));
  
  // 3. 生成 CSS 类定义（:before 伪元素 + content）
  let css = `@font-face {\n  font-family: '${FONT_NAME}';\n  src: url('./${FONT_NAME}.ttf') format('truetype');\n  font-weight: normal;\n  font-style: normal;\n  font-display: block;\n}\n\n`;
  for (const f of svgFiles) {
    const name = path.basename(f, '.svg');
    css += `.${PREFIX}-${name}::before { content: '\\${CODEPOINTS[name].toString(16)}'; }\n`;
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, `${FONT_NAME}-classes.css`), css);
  
  // 4. 完整性验证
  const ttfSize = fs.statSync(path.join(OUTPUT_DIR, `${FONT_NAME}.ttf`)).size;
  if (ttfSize < 1024) {
    console.error(`🔴 TTF size ${ttfSize} bytes — font may be corrupted`);
    process.exit(1);
  }
  console.log(`✅ Generated ${FONT_NAME}.ttf (${ttfSize} bytes, ${svgFiles.length} icons)`);
}

main().catch(e => { console.error(e); process.exit(1); });
```

**SVG 源文件格式要求**：
- `viewBox="0 0 24 24"` + `fill="none"` + `stroke="currentColor"`（标准 icon 尺寸）
- 路径使用 Lucide/Feather 开源图标集（MIT 协议）
- 文件名即映射键：`search.svg` → `icons/search.svg` → CSS class `.icon-search`

**在迁移流程中的集成**：
- Phase 1：列出所有源图标 → 从 Lucide/Feather 中选择语义匹配的 SVG 路径
- Phase 2：决定码点映射策略 → 选择"保留旧编码"（推荐，减少代码改动）或"重新分配"
- Phase 3 Layer 2.5：运行生成脚本 → 验证 TTF 大小 > 1KB → 生成 CSS 类文件
- Phase 4：TTF 完整性审计 + 渲染模式审计 + emoji 零容忍扫描

---

## 五、各框架/平台差异速查

### 纯 Web 框架

| 框架 | 推荐方案 | 备选方案 |
|------|---------|---------|
| React (CRA/Vite) | lucide-react / react-icons | SVG sprite / CSS background |
| Next.js | lucide-react / react-icons | `@next/Image` + SVG |
| Vue 3 | lucide-vue-next | SVG 组件 |
| Nuxt 3 | nuxt-icons 模块 / lucide-vue-next | SVG sprite |
| Svelte | lucide-svelte / svelte-icons | 内联 SVG |
| Angular | @angular/material icon | angular-svg-icon |
| 原生 HTML/CSS | SVG sprite + `<use>` | iconfont / Font Awesome CDN |

### 小程序框架

| 框架 | 推荐方案 | 不可用方案 |
|------|---------|-----------|
| uni-app | uni-icons + iconfont | 内联 SVG、SVG 文件 |
| Taro | Taro Icons / iconfont | 内联 SVG、SVG 文件 |
| 原生微信小程序 | iconfont | 内联 SVG |
| 原生支付宝小程序 | iconfont | 内联 SVG |

### 跨端框架

| 框架 | 推荐方案 | 备注 |
|------|---------|------|
| Flutter | Material Icons + flutter_svg | Material Icons 自带 2000+ 图标 |
| React Native | react-native-vector-icons | 需原生模块 |
| Electron | 任意 Web 方案 | 完整浏览器引擎 |

---

## 六、从常见源图标库迁移的映射规则

### 6.1 lucide-react → 各目标

lucide-react 是目前最常见的 React 图标库。迁移时的命名对照：

| lucide-react 图标 | 语义 | uni-icons type | iconfont 建议名 | react-native-vector-icons (Feather) |
|-------------------|------|---------------|----------------|-------------------------------------|
| `Search` | 搜索 | `search` | `icon-search` | `search` |
| `ArrowRight` | 右箭头 | `arrowright` | `icon-arrow-right` | `arrow-right` |
| `ArrowLeft` | 左箭头 | `arrowleft` | `icon-arrow-left` | `arrow-left` |
| `User` | 用户 | `person` | `icon-user` | `user` |
| `Settings` / `Cog` | 设置 | `gear` | `icon-settings` | `settings` |
| `X` | 关闭 | `clear` | `icon-close` | `x` |
| `Check` | 确认 | `checkmarkempty` | `icon-check` | `check` |
| `Plus` | 添加 | `plus` | `icon-plus` | `plus` |
| `Eye` | 显示 | `eye` | `icon-eye` | `eye` |
| `EyeOff` | 隐藏 | — | `icon-eye-off` | `eye-off` |
| `BookOpen` | 书本/词库 | `flag` (近似) | `icon-book-open` | `book-open` |
| `Sparkles` | 亮点/装饰 | `star` (近似) | `icon-sparkles` | — |
| `Shield` | 盾牌/安全 | — | `icon-shield` | `shield` |
| `Target` | 目标 | — | `icon-target` | `crosshair` |
| `LogOut` | 登出 | — | `icon-logout` | `log-out` |
| `RefreshCw` | 刷新 | `refreshempty` | `icon-refresh` | `refresh-cw` |
| `ChevronRight` | 小箭头 | `arrowright` | `icon-chevron-right` | `chevron-right` |
| `ChevronLeft` | 小箭头 | `arrowleft` | `icon-chevron-left` | `chevron-left` |
| `Menu` | 菜单 | `bars` | `icon-menu` | `menu` |
| `Trash2` | 删除 | `trash` | `icon-trash` | `trash-2` |
| `Edit` / `Pencil` | 编辑 | `compose` | `icon-edit` | `edit` |
| `Loader` / `Loader2` | 加载中 | — | CSS animation（`@keyframes spin`） | `loader` |
| `Image` | 图片 | `image` | `icon-image` | `image` |
| `Type` | 文字/字体 | — | `icon-type` | `type` |
| `Users` | 多用户 | `person-filled` (近似) | `icon-users` | `users` |
| `Shield` | 安全/管理员 | — | `icon-shield` | `shield` |
| `Lock` | 密码/锁定 | `locked` | `icon-lock` | `lock` |
| `Mail` | 邮箱 | `email` | `icon-mail` | `mail` |
| `Phone` | 电话 | `phone` | `icon-phone` | `phone` |

### 6.2 @heroicons/react → 各目标

| heroicons 名称 | 语义 | uni-icons | iconfont 建议名 |
|---------------|------|-----------|----------------|
| `MagnifyingGlassIcon` | 搜索 | `search` | `icon-search` |
| `ArrowRightIcon` | 右箭头 | `arrowright` | `icon-arrow-right` |
| `UserIcon` | 用户 | `person` | `icon-user` |
| ... | ... | ... | ... |

### 6.3 映射表生成流程

Phase 2 构建图标映射表时：
1. 从 Phase 1 的图标资产清单中提取源图标名称列表
2. 运行 `npx ctx7@latest library <source-icon-lib> "icon list"` 获取完整图标列表
3. 与目标平台可用图标集做交集
4. 交集中的 → 直接映射；交集外的 → 自建 iconfont 或占位

---

## 七、与 frontend-refactor 各阶段的集成

### Phase 1（深度分析）

在 Step 1.2（理解源框架编码模式）中，增加图标专项分析：

```markdown
## 文档 5：图标资产清单（Phase 1 必须产出）

| 源文件 | 图标来源 | 图标名称 | 使用次数 | 尺寸 | 颜色 | 语义角色 |
|--------|---------|---------|---------|------|------|---------|
| HomeView.tsx | lucide-react | Search | 1 | 18 | #9CA3AF | 搜索框图标 |
| HomeView.tsx | lucide-react | ArrowRight | 4 | 16/14 | #D1D5DB/0.8 | 列表项箭头 |
| ... | ... | ... | ... | ... | ... | ... |
```

### Phase 2（迁移映射）

在步骤 2（图标迁移策略）中，产出：

1. **图标映射表**（精确到每个图标的代码片段）→ 见本文第六章
2. **图标基础设施规划**（如果选了 iconfont 方案）→ 见本文第四章
3. **emoji 红线声明** → 注入 Phase 3 所有 Agent

### Phase 3（代码生成）

Agent Prompt 的第七节（图标约束）从本文的映射表生成，格式为：

```
## 图标约束（Icon Constraints）

⚠️ 红线：本文件严禁使用任何 emoji 字符替代图标。

本文件需要的图标及其实施方式：
| 图标用途 | 实施方式 | 代码 |
|---------|---------|------|
| 搜索图标 | uni-icons | `<uni-icons type="search" size="16" color="#9CA3AF" />` |
| ... | ... | ... |

🚫 禁止声明：以下 emoji/Unicode 符号在本文件中绝对不可用于替代图标：
🔍 ✨ 📖 👤 🛡 ⚙ 🎯 🚪 📭 ❌ ✅ ➕ 🔄 💡 ← → × ✓
```

### Phase 4（验证与修复）

Step 4.3d（Emoji 零容忍扫描）：
```bash
# 扫描所有目标文件中的 emoji
grep -Pn '[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}\x{1F600}-\x{1F64F}\x{1F680}-\x{1F6FF}\x{1F900}-\x{1F9FF}\x{2B50}\x{2B55}\x{231A}\x{231B}\x{2328}\x{23CF}\x{23E9}-\x{23F3}\x{23F8}-\x{23FA}\x{24C2}\x{25AA}\x{25AB}\x{25B6}\x{25C0}\x{25FB}-\x{25FE}\x{2600}-\x{2B55}\x{2934}\x{2935}\x{3030}\x{303D}\x{3297}\x{3299}\x{FE0F}\x{200D}]' src/**/*.{vue,tsx,jsx,html}
```

Step 4.3b（样式关键属性审计）中增加：
- iconfont CSS class 是否在适用文件中被正确使用
- 图标尺寸是否与 Phase 1 清单一致
- 图标颜色是否与 Phase 1 清单一致

**🆕 图标专项审计（Phase 4 新增步骤）**：

Step 4.3g — TTF 字体完整性审计：

```bash
# 1. 检查 TTF 文件大小 ≥ 1KB（排除 38 字节的损坏文件）
SIZE=$(wc -c < src/static/fonts/iconfont.ttf)
if [ "$SIZE" -lt 1024 ]; then
  echo "🔴 Blocker: iconfont.ttf 仅 ${SIZE} 字节 → 可能已损坏（正常 ≥ 3KB）"
  echo "   → 执行本地生成流水线（见 icons.md §4b）重建字体文件"
fi

# 2. 检查构建产物中的 @font-face base64 内容不是空的
grep -o '@font-face{[^}]*}' dist/build/h5/assets/index-*.css \
  | grep -o 'base64,[^)]*' \
  | wc -c
# 预期：base64 字符串 > 200 字符；如果是 AAAEAAAAKAIAAAwAgT1MvMkoE...（约 60 字符）→ 空字体
```

Step 4.3h — iconfont 渲染模式审计（Pattern B/C/D 检测）🆕：

```bash
# Pattern B: :class="icon" 绑定 unicode（应改为 {{ icon }} 文本渲染）
grep -rn ':class="icon"' src/components/ src/pages/ --include="*.vue"
# 命中 → 该元素永远不会渲染图标 glyph → 修复为 {{ icon }}

# Pattern C/D: JS 字符串中的 HTML entity（应改为 Unicode 转义或直接 Unicode 字符）
grep -rn "'&#x" src/ --include="*.vue"
# 命中 → 这是 JS 字符串字面量，HTML entity 不会被解析 → 修复
```

---

## 八、常见陷阱与反模式

### 陷阱 1：H5 开发时图标正常，小程序真机一片空白

**根因**：开发时用 Chrome DevTools 看 H5 端，内联 SVG 完美显示。切到小程序真机时
SVG 完全不支持，所有图标消失。

**防范**：Phase 2 就必须根据目标平台选择正确的图标方案——不能等到 Phase 4 真机
测试才发现。

### 陷阱 2：iconfont 字符显示为方块

**根因**：iconfont.ttf 未正确加载（路径错误、跨域、小程序未声明网络域名）。

**防范**：
- Phase 3 Layer 2.5 创建占位 TTF 文件后，验证 CSS 中的 url() 路径是否可达
- 小程序中使用 iconfont 时，字体文件必须在项目包内（不能从网络加载）

### 陷阱 3：Agent 用 emoji 填充图标

**根因**：emoji 是 Agent 的"最小阻力路径"——不需要任何配置、依赖或资源文件。

**防范**：
- Phase 3 每个 Agent Prompt 第七节明确列出该文件需要的图标及精确代码
- Phase 4 Step 4.3d 做 emoji 零容忍 Grep 扫描
- emoji 命中 = 🔴 Blocker，必须修复

### 陷阱 4：图标颜色不随主题变化

**根因**：使用 PNG/位图图标时，颜色在文件中固化，无法通过 CSS `color` 控制。

**防范**：
- 优先使用矢量方案（SVG / iconfont / 图标组件），这些天然支持 `color` 控制
- 如果必须使用 PNG，为每个颜色变体准备单独的图片文件
- uni-icons 的 `color` prop 和 iconfont 的 `color` CSS 属性都需要显式传入

### 陷阱 5：uni-icons 和 iconfont 混用导致视觉不统一

**根因**：uni-icons 的图标风格（线框/填充/尺寸）与自建 iconfont 不一致。

**防范**：
- Phase 2 统一规划图标风格——要么全用 uni-icons（限制多但一致性好），
  要么全用自建 iconfont（灵活但工作量大）
- 如果必须混用，在 Phase 2 明确标注哪些文件用哪些方案，
  并确保同一页面内不混用两种方案

### 陷阱 6：图标库版本升级导致图标名称变化

**根因**：如 lucide-react 在 major 版本中曾重命名多个图标（`Grid` → `LayoutGrid`）。

**防范**：Phase 2 锁定源项目的图标库版本号，Phase 3 使用同版本的图标名称。

### 陷阱 7：iconfont.ttf 迁移后损坏（构建通过，图标全部不可见）🆕

> **来源**：2026-07-15 迁移项目，字体文件从 30KB 退化至 38 字节，`npm run build`
> 输出 `DONE Build complete`，`@font-face` 在 CSS 中正常生成（Vite 将 38 字节
> base64 内联），但所有图标均不显示。从构建工具视角看一切正常——CSS 编译成功、
> TypeScript 无错误、路由可用——只有人眼能看到图标全是空白。

**根因**：TTF 字体文件在迁移过程中只保留了文件头（38 字节），字形数据（glyf 表、
cmap 表等）全部丢失。文件存在 ≠ 文件有效。

一个正常 iconfont 至少 3-6KB（15-30 个图标），38 字节的 TTF 二进制内容为：
```
00000000: 0001 0000 000a 0080 0003 0020 4f53 2f32  ← 仅 TTF header
00000010: 4a04 0000 0000 0000 0000 0000 0000 0000  ← 空表目录
00000020: 0000 0000 0000                           ← 无任何字形数据
```

**为什么构建工具不报错**：
1. Vite 将 TTF 内联为 base64 写入 CSS —— 它不验证字体内容的有效性
2. `@font-face` 声明和 `.iconfont` class 正常生成
3. CSS `font-family` 回退机制：iconfont 无字形 → 浏览器静默回退到系统字体 →
   没有报错也没有方块（因为 unicode 码点在 PUA 区，系统字体的 PUA 通常是空白）

**防范**：
- Phase 3 Layer 2.5 创建占位 TTF 后，**必须**验证文件大小 ≥ 1KB：
  ```bash
  SIZE=$(wc -c < src/static/fonts/iconfont.ttf)
  if [ "$SIZE" -lt 1024 ]; then
    echo "🔴 Blocker: iconfont.ttf 仅 ${SIZE} 字节，可能已损坏"
  fi
  ```
- Phase 4 启动验证：在 dev server 启动后打开至少 3 个使用 iconfont 的页面，
  人工确认图标可见（机械化审计无法发现 "字形数据缺失"）
- 如果源字体文件遗失 → 用本地生成流水线重建（见 §4b）

### 陷阱 8：iconfont 渲染模式 bugs 导致图标不显示 🆕

> **来源**：2026-07-15 uni-app 项目发现 4 处渲染模式 bugs。这些 bugs 在字体
> 文件损坏时不可见（因为本来就没有字形），字体修复后才会暴露。

**三种常见反模式**：

| 模式 | 代码示例 | 为什么是 bug | 检测 |
|------|---------|-------------|------|
| Pattern B — `:class` 绑 unicode | `<text class="iconfont" :class="icon">` 其中 `icon="&#xe006;"` | Unicode 字符被当作 CSS class 名绑定——浏览器尝试匹配 `.e006` 类（不存在）而非渲染该字符 | 无视觉反馈，静默失效 |
| Pattern C — JS 表达式中的 HTML entity | `{{ show ? '&#xe00d;' : '&#xe00c;' }}` | `'&#xe00d;'` 是 7 个 ASCII 字符的 JS 字符串字面量，不是 HTML entity。浏览器显示字面量文本而非图标 | 页面上出现 `&#xe00d;` 字面量文字 |
| Pattern D — JS 数据中的 HTML entity | `{ icon: '&#xe006;' }` | 同上，在 `<script>` 中的数据定义中不会被 HTML 解析器处理 | `{{ s.icon }}` 渲染出字面量文本 |

**正确写法**：
```html
<!-- Pattern B 正确：直接作为文本内容 -->
<text class="iconfont">{{ icon }}</text>

<!-- Pattern C 正确：JS unicode 转义 -->
{{ showPassword ? '' : '' }}

<!-- Pattern D 正确：JS unicode 转义（或直接用字面 Unicode 字符） -->
{ icon: '' }
```

**防范**：
- Phase 4 增加「iconfont 渲染模式审计」—— Grep 检测 `:class="icon"` 模式；
  检测 JS 字符串中 `&#x` HTML entity 模式
  ```bash
  # 检测 Pattern B: :class="icon" 模式（应改为 {{ icon }} 文本内容）
  grep -rn ':class="icon"' src/components/ src/pages/ --include="*.vue"
  # 检测 Pattern C/D: JS 中的 HTML entity（应改为 \u 转义）
  grep -rn "'&#x" src/ --include="*.vue"
  ```

---

## 九、图标方案选型综述

| 方案 | 全端兼容 | 颜色可控 | 可缩放 | 配置成本 | 最佳场景 |
|------|---------|---------|--------|---------|---------|
| **iconfont** 🏆 | ✅ 全部 | ✅ CSS color | ✅ 字体缩放 | 🟡 中 | 小程序 + H5 统一方案 |
| **uni-icons** | ✅ uni-app 全端 | ✅ prop | ✅ | 🟢 低 | uni-app 项目（图标够用时） |
| **内联 SVG** | ❌ 仅 Web | ✅ fill/stroke | ✅ | 🟢 低 | 纯 Web 项目 |
| **SVG sprite** | ❌ 仅 Web | ✅ fill/stroke | ✅ | 🟡 中 | 纯 Web 项目（自定义图标多） |
| **图标组件库** | ⚠️ 取决于框架 | ✅ prop | ✅ | 🟢 最低 | 源=目标的直接迁移 |
| **PNG/位图** | ✅ 全部 | ❌ 固化 | ❌ | 🟢 低 | tabBar 图标（仅平台要求） |
| **CSS 绘制** | ✅ 全部 | ✅ CSS | ✅ | 🔴 高 | 极简几何图形（箭头、×） |
| **Base64 图片** | ⚠️ 部分 | ❌ 固化 | ❌ | 🟡 中 | 兜底方案 |

---

## 十、检查清单（Phase 2 图标规划完成前）

- [ ] Phase 1 已产出完整的图标资产清单（文件→图标名→尺寸→颜色）
- [ ] 已根据决策树为本次迁移选择了图标方案（单方案或组合方案）
- [ ] 如果选 iconfont：已规划字体文件位置、Unicode 码点分配、@font-face 声明
- [ ] 如果选 uni-icons：已逐一检查每个源图标是否在 uni-icons 中有对应项
- [ ] 每个图标都有精确到代码片段的映射（不是笼统的"用 iconfont"）
- [ ] emoji 红线声明已写入 Phase 3 Prompt 模板
- [ ] 图标基础设施（字体文件/CSS 声明）已加入依赖拓扑的 Layer 2.5
- [ ] Phase 4 emoji 扫描命令已准备好
- [ ] "不可直接映射"的图标（如 Loader→CSS animation、Sparkles→近似图标）已有替代方案
- [ ] 🆕 如果选 iconfont：是否使用本地生成流水线？如果是，SVG 源文件 + 生成脚本已准备好
- [ ] 🆕 如果选 iconfont：Phase 4 TTF 完整性审计命令已准备（`wc -c iconfont.ttf` ≥ 1KB）
- [ ] 🆕 Phase 4 iconfont 渲染模式审计命令已准备（Pattern B `:class="icon"` + Pattern C/D `'&#x` 检测）
- [ ] 🆕 源项目 iconfont 渲染模式已审计 — 如果存在 Pattern B/C/D bugs，Phase 3 必须修复
