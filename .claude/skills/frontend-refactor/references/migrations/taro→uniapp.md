# Taro+React → uni-app+Vue3 迁移指南

> **来源项目**：english-dictionary (Taro 3.6 + React 18) → english-dict-uni (uni-app + Vue 3)
> **验证日期**：2026-07-20
> **迁移规模**：37 源文件 → 43 目标文件（22 Vue + 21 TS）

---

## 一、快速参考

### 组件映射速查

| Taro | uni-app | 注意 |
|------|---------|------|
| `<View>` | `<view>` | 小写 |
| `<Text>` | `<text>` | NC-14: 替代块级元素需 `display:block` |
| `<Input>` | `<input>` | NC-01: height; NC-02: `></input>` |
| `<Textarea>` | `<textarea>` | NC-03: `auto-height` |
| `<Picker>` | `<picker>` | NC-13: 平台自适应 |
| `<>...</>` | `<template>` | |

### 事件映射

| React | Vue/uni-app |
|--------|------------|
| onClick | @click |
| onInput | @input (`e.detail.value`) |
| onChange(Picker) | @change (`e.detail.value`=索引) |
| onFocus/onBlur | @focus/@blur |
| onKeyDown(Enter) | @confirm |

### 样式映射

- 1px = 2rpx
- camelCase → kebab-case
- H5 条件编译必包：backdrop-filter, transition, overflow:hidden, cursor, :hover, :focus, @import url(), *, html/body

### 状态管理映射

| React | Vue 3 |
|--------|-------|
| useState | ref() |
| useEffect | watch()/onMounted()/onLoad() |
| useRef | ref() 或普通变量 |
| useMemo | computed() |
| Context/全局单例 | Pinia store |
| localStorage | uni.getStorageSync |

---

## 二、Post-Mortem 故障录

### PM-TU-1: api/index.ts 缺少 AI 函数导出 → 构建失败

**现象**：`uni build` 报 `"generateWordStream" is not exported by "src/api/index.ts"`

**根因**：API 服务文件迁移 Agent 遗漏了 `ai.ts` 的导出。`api/index.ts` 初始仅导出了 8 个文件，
但 `ai.ts`（第 9 个 API 文件）是后来单独补迁移的，index.ts 未被同步更新。

**修复**：在 `api/index.ts` 追加：
```ts
export { generateWord, generateWordStream } from "./ai";
export type { GenerateWordStreamCallbacks } from "./ai";
```

**检测命令**：
```bash
grep -c "generateWordStream" src/api/index.ts  # 期望: 1
```

---

### PM-TU-2: uni.request 错误的解构模式 → TypeScript 编译失败

**现象**：`tsc --noEmit` 报 `Type '...' must have a '[Symbol.iterator]()' method`

**根因**：uni.request 不返回 Promise 元组。Agent 将 `uni.request` 写为 `const [err, res] = await uni.request<T>(...)`，
但这在 TypeScript 类型中不支持元组解构。

**修复**：
```ts
// ❌ 错误
const [err, res] = await uni.request<T>({...});

// ✅ 正确
const res = await new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
  uni.request({..., success: resolve, fail: reject});
});
```

**检测命令**：
```bash
grep -rn "const \[err, res\] = await uni.request" src/  # 期望: 0
```

---

### PM-TU-3: SSE 解析中 `Record<string, unknown>` 直接转型 → TypeScript 错误

**现象**：`tsc` 报 `Conversion of type 'Record<string, unknown>' to type 'BackendWordResponse' may be a mistake`

**根因**：`parseSSEEvent` 返回 `data: Record<string, unknown>`，Agent 直接 `as BackendWordResponse`。
TypeScript 不允许从不重叠的类型转型。

**修复**：
```ts
// ❌ 错误
const word = adaptWord(event.data as BackendWordResponse);

// ✅ 正确
const d = event.data as Record<string, any>;
const word = adaptWord(d as unknown as BackendWordResponse);
```

**检测命令**：
```bash
grep -rn "event\.data as BackendWordResponse" src/api/ai.ts  # 期望: 0
```

---

### PM-TU-4: npm install 版本号不一致 → 安装失败

**现象**：`npm install` 报 `No match for version 2.0.2`

**根因**：`@dcloudio/*` 所有包必须使用**统一的 alpha 版本号**。`uni-app` 的 `latest` tag 是 `2.0.2-*`，
但 `uni-components`、`vite-plugin-uni` 等子包的 `latest` 是 `3.0.0-alpha-*`。
不同 release line 混用 → install 失败。

**修复**：
1. 查看所有子包共有的最新 alpha 版本：
```bash
npm view @dcloudio/uni-app versions --json | grep "3.0.0-alpha" | tail -1
npm view @dcloudio/uni-components versions --json | grep "3.0.0-alpha" | tail -1
```
2. 取交集的最新版本，统一应用于所有 `@dcloudio/*` 包。

**检测命令**：
```bash
grep -E '@dcloudio/' package.json | grep -v 'alpha'  # 期望: 0（全部用 alpha）
```

---

### PM-TU-5: 审计脚本 NC-03 误报（跨行 textarea 属性）

**现象**：`audit-phase4.sh` 报告 NC-03 Blocker（textarea 无 auto-height），但实际所有 textarea 已有 `auto-height`

**根因**：审计脚本的 `grep -A2` 仅匹配 textarea 首行后 2 行。当 `auto-height` 在第 3 行或更后时（多行 Vue 属性），脚本无法匹配。这是 PM-3 的已知局限性。

**验证命令**：
```bash
grep -A15 '<textarea' src/ --include="*.vue" | grep 'auto-height'
grep -A15 '<textarea' src/ --include="*.vue" | grep -c 'auto-height'
```

**检测**：绝对不要仅根据脚本退出码判定 NC-03。

---

### PM-TU-6: package.json 缺 vite → npm install 成功但 uni build 失败

**现象**：`npm install --legacy-peer-deps` 成功，但 `npx uni build` 报：
```
Error: Cannot find module 'vite'
Require stack: ... @dcloudio/vite-plugin-uni/dist/cli/uvue.js
```

**根因**：`@dcloudio/vite-plugin-uni` 内部依赖 `vite` 但不声明为 peerDependency，
npm 不会自动安装。`package.json` 的 devDependencies 中缺少 `"vite"`。

**修复**：
```bash
npm install --save-dev vite@^5.4.0 --legacy-peer-deps
```

**检测命令**：
```bash
grep -c '"vite"' package.json  # 期望: 1
```

---

### PM-TU-7: CSS block 预生成脚本泄漏 JS 三元表达式到 CSS

**现象**：`npx uni build` 报 `Missed semicolon`，文件为 `.vue?vue&type=style...`（编译后的 CSS 模块行号）。原因是 CSS 属性值中包含 JS 三元表达式：
```css
/* ❌ 泄漏的 JS 表达式 */
background: isAdmin ?"linear-gradient(135deg,#4C1D95,#7C3AED)" :"linear-gradient(135deg,#1D4ED8,#2563EB,#3B82F6)";
box-shadow: isAdmin ?"16rpx64rpxrgba(124,58,237,0.25)" :"16rpx64rpxrgba(37,99,235,0.25)";
```

**根因**：`extract-inline-styles.cjs` 从源文件 JSX 的 `style={{}}` 中提取 CSS 值时，
将 React 条件表达式值（如 `style={{ background: isAdmin ? x : y }}`）当作 CSS 属性值写入 `raw-styles.json`，
进而写入 `design-values.json` 和 `css-blocks/`。`generate-css-blocks.cjs` 中的
`normalizeValue()` 无法区分 CSS 值和 JS 表达式。

**修复（两步）**：
1. Phase 3 构建自检前清理所有 `.vue` 的 `<style scoped>` 块：
```bash
node -e "
const fs = require('fs');
const files = fs.readdirSync('src', {recursive:true}).filter(f => f.endsWith('.vue'));
for (const f of files) {
  let c = fs.readFileSync('src/'+f,'utf-8');
  const si = c.indexOf('<style scoped>'), ei = c.indexOf('</style>');
  if (si<0) continue;
  let style = c.substring(si, ei);
  style = style.replace(/^.*\?.*\n/gm, '');
  style = style.replace(/^.*\$\{.*\n/gm, '');
  style = style.replace(/^.*(isAdmin|item\.|BG|CARD|INPUT|color\.|s\.bg).*\n/gm, '');
  c = c.substring(0,si) + style + c.substring(ei);
  fs.writeFileSync('src/'+f, c);
}
"
```

2. 长期修复：在 `generate-css-blocks.cjs` 的 `normalizeValue()` 中增加 JS 表达式检测，
   对含 `?`、`${`、`=>` 的值直接丢弃而非写入 CSS block。

**检测命令**：
```bash
grep -rn '\?' src/ --include="*.vue" -A0 | grep -v '<\|>\|/\*\|//'  # 期望: 0
```

---

### PM-TU-8: CustomTabBar 以自定义组件方式保留（非原生 tabBar）

**现象**：Phase 2 决策使用原生 tabBar 替代 CustomTabBar 组件，但用户要求保留自定义实现。

**根因**：源项目使用 `position:fixed` + `max-width:430px` + `backdrop-filter` 实现自定义
底部导航。uni-app 原生 tabBar 不支持这些效果。

**修复**：
- 保留 CustomTabBar 为 Layer 2 共享组件
- pages.json 不配置 tabBar
- 每个非 admin 页面显式 import + render `<CustomTabBar :activeTab="'xxx'" />`
- tab 切换使用 `uni.redirectTo`（与源项目 redirectTo 模式一致）
- 需要在 `shared-component-instances.json` 中为 CustomTabBar 添加完整的差异化参数和交叉验证矩阵

**检测命令**：
```bash
# 确认 pages.json 不含 tabBar
grep -c '"tabBar"' src/pages.json  # 期望: 0
# 确认 CustomTabBar 在所有页面中被使用
grep -l 'CustomTabBar' src/pages/*/*.vue  # 应在 6 个页面中命中
```

---

## 三、检查清单新增项

- [x] **[TU-1]** `api/index.ts` 导出了所有 API 文件（用 `grep -c "export {" src/api/index.ts` 验证导出行数）
- [x] **[TU-2]** `request.ts` 使用 Promise 包装 + success/fail 回调，非元组解构
- [x] **[TU-3]** SSE 解析中对 `Record<string, unknown>` 使用 `as unknown as ConcreteType` 转型
- [x] **[TU-4]** 所有 `@dcloudio/*` 包使用统一的 alpha 版本号（从 `npm view` 获取）
- [x] **[TU-5]** 不依赖审计脚本 NC-03 退出码判断 textarea auto-height 缺失
- [x] **[TU-6]** `package.json` 必须包含 `vite` 作为 devDependency（`@dcloudio/vite-plugin-uni` 依赖 vite 但不声明为 peerDependency）— 缺少则 `npx uni build` 报 `Cannot find module 'vite'`
- [x] **[TU-7]** CSS block 预生成脚本可能将 JS 三元表达式（`isAdmin ? "val1" : "val2"`）写入 CSS 文件。Phase 3 构建自检前必须 Grep 所有 `.vue` 的 `<style scoped>` 块，移除含 `?` 或 `=> ` 的 CSS 行
- [x] **[TU-8]** CustomTabBar 组件在 uni-app 中保留为自定义组件（非原生 tabBar）时，每个页面必须显式 import 并渲染 `<CustomTabBar>`。用 `redirectTo` 跨 tab 切换（与源项目一致）
