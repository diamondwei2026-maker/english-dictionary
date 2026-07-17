# React 框架分析指南

当源项目是一个 **React** 应用时使用本指南。它告诉你在第一阶段分析中应该关注什么以及如何解读常见的 React 模式。

---

## 项目检测

一个项目属于 React 项目，如果满足以下条件：
- `package.json` 的 dependencies 中包含 `react`
- 文件使用 `.tsx` 或 `.jsx` 扩展名
- 存在 JSX 语法（`<Component />`、`{expression}`）
- dependencies 中包含 `react-dom`（Web）或 `react-native`（移动端）

## 构建工具检测

| 配置文件 | 构建工具 |
|-------------|-----------|
| `vite.config.*` | Vite |
| `next.config.*` | Next.js |
| `webpack.config.*` | Webpack / CRA |
| `craco.config.*` | CRACO（CRA 分支） |
| `remix.config.*` | Remix |
| `astro.config.*` | Astro |

---

## 组件识别

### 页面级组件
- 位于 `src/pages/`、`src/views/`、`src/screens/` 或 `src/routes/` 中
- 通常是文件中的默认导出
- 以 props 形式接收路由参数或导航回调

### UI 组件
- 位于 `src/components/ui/`、`src/components/common/`、`src/ui/` 中
- 小型、可复用，通常来自某个 UI 库（Radix、MUI 等）

### 功能组件
- 位于 `src/components/` 中，与页面组件并列
- 组合组件：一个包含 index.tsx 及子组件的文件夹

---

## 常见 React 模式及其分析方法

### 模式 1：基于 useState 的视图路由

```tsx
const [view, setView] = useState<ViewState>({name:'home'});

{view.name === 'home' && <HomeView />}
{view.name === 'detail' && <DetailView id={view.id} />}
```

**分析方法：**
- 从类型定义中提取所有可能的 ViewState 值
- 将每个值映射到它所渲染的组件
- 追踪每个 `setView()` 调用，构建完整的导航图
- 这本身就是路由系统——应该像对待 react-router 一样认真对待

### 模式 2：Props 逐层传递（无全局状态）

```tsx
<App>              // user, view state
  <ProfileView     // 接收: user, navigate, onLogout
    onLogout={fn}  // 在 App 中定义
  />
</App>
```

**分析方法：**
- 从 App.tsx（或根组件）开始
- 对于其中定义的每个状态变量，追踪哪些子组件接收了它
- 将每个回调 prop（onXxx）追溯到它的定义处
- 构建 props 流向图：根组件 → 子组件 → 孙组件

### 模式 3：条件渲染

```tsx
{isLoading && <Spinner />}
{error ? <Error msg={error} /> : <Content />}
{items.length === 0 ? <Empty /> : items.map(item => <Item key={item.id} />)}
{user?.role === 'admin' && <AdminPanel />}
```

**分析方法：**
- 找到渲染路径中的每个 `&&`、三元表达式和 `if` 语句
- 记录条件、true 分支渲染内容以及 false 分支渲染内容
- 不要忽略 "else" 情况——那是一个必须保留的状态

### 模式 4：受控输入

```tsx
const [query, setQuery] = useState('');
<input value={query} onChange={e => setQuery(e.target.value)} />
```

**分析方法：**
- 找出每个支撑输入值的 useState
- 记录确切的 onChange 处理函数
- 检查 onFocus/onBlur 的样式变化
- 检查 onKeyDown（按 Enter 提交）

### 模式 5：useEffect 副作用

```tsx
useEffect(() => {
  fetchData(id).then(setData);
}, [id]);

useEffect(() => {
  document.title = `Viewing ${name}`;
}, [name]);
```

**分析方法：**
- 记录什么触发了副作用（依赖数组）
- 记录副作用做了什么
- 检查清理函数（return () => { ... }）
- 依赖数组为空 `[]` 的副作用 = 仅在挂载时运行一次

### 模式 6：自定义 Hooks

```tsx
const { data, loading, error } = useFetchWord(wordId);
const isMobile = useMobile();
```

**分析方法：**
- 找到自定义 Hook 的定义
- 提取它的返回类型（它提供了哪些状态/操作）
- 列出哪些组件使用了它

### 模式 7：Context

```tsx
const ThemeContext = createContext<Theme>('light');
// ...
const theme = useContext(ThemeContext);
```

**分析方法：**
- 找到所有 `createContext()` 调用
- 找到 Provider 组件（context 值是在哪里设置的）
- 找到所有消费者（useContext 调用）
- 记录 context 值的结构

### 模式 8：平台自适应选择器（Adaptive Select）🆕

> **来源**：2026-07-15 uni-app → React (shadcn/ui) 迁移实战。
> uni-app 的 `<picker>` 在移动端从底部弹出——React 的 `<select>` 和 Radix `<Select>`
> 不具备此行为。需构建自适应组件来还原移动端体验。

```tsx
// shadcn/ui 项目中的标准实现模式：
// 1. 检测: useIsMobile() (use-mobile.ts, 768px 断点)
// 2. 桌面: <Select> (Radix — Popover 下拉)
// 3. 移动: <Drawer> (Vaul — Bottom Sheet，底部弹出)

import { useIsMobile } from './use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './drawer';

function AdaptiveSelect({ value, onValueChange, options, placeholder }) {
  const isMobile = useIsMobile();
  // 桌面 → <Select>, 移动端 → <Drawer>
}
```

**分析方法（Phase 1 — 识别源项目中的选择器）：**
- 搜索 `<picker>`、`<select>`、`<DropdownMenu>`、`<Combobox>`
- 记录每个选择器的：选项数据来源、选项数量、是否有搜索/过滤、是否多选
- 在交互清单中标注为"类别 11: 平台自适应选择"

**映射方法（Phase 2 — 规划目标组件）：**
- 检查目标项目是否已有 `Select`（Radix/MUI/Antd）、`Drawer`（Vaul/MUI）、`useIsMobile`
- 选项数据格式统一为 `{label, value}[]`
- 移动端 Drawer 选项列表：选中态高亮 + 点击自动关闭

**常见反模式（Phase 4 审计时重点检查）：**
```tsx
// ❌ 反模式 1：直接用原生 <select> — 移动端无底部弹出
<select value={x} onChange={e => setX(e.target.value)}>
  {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
</select>

// ❌ 反模式 2：用 DropdownMenu 替代 Select — 无选中态指示
<DropdownMenu>
  <DropdownMenuTrigger>选择...</DropdownMenuTrigger>
  <DropdownMenuContent>
    {opts.map(o => <DropdownMenuItem onClick={() => setX(o.value)}>{o.label}</DropdownMenuItem>)}
  </DropdownMenuContent>
</DropdownMenu>

// ✅ 正确：自适应组件 — 桌面 Popover + 移动端 Bottom Sheet
<AdaptiveSelect value={x} onValueChange={setX} options={opts} placeholder="请选择" />
```

---

## 样式系统检测

| 线索 | 样式系统 |
|-------|-------------|
| `className="px-4 bg-white"` | Tailwind CSS |
| `import styles from './x.module.css'` | CSS Modules |
| `styled.div\`...\`` | styled-components |
| `css={...}` 或 `import { css } from '@emotion'` | Emotion |
| `style={{padding: '16px'}}` | 内联样式对象 |
| `className={classes.root}` | Material UI（makeStyles / sx） |
| `import './x.css'` | 全局 CSS |
| `cn('...', className)` 或 `clsx` | 工具类合并 + Tailwind（shadcn 模式） |

---

## 路由检测

| 线索 | 路由方案 |
|-------|--------|
| `import { BrowserRouter, Routes, Route }` | react-router v6 |
| `import { useNavigate } from 'react-router-dom'` | react-router |
| `import { useRouter } from 'next/router'` | Next.js Pages Router |
| `'use client'; import { useRouter } from 'next/navigation'` | Next.js App Router |
| `const [page, setPage] = useState(...)` | 手动路由（无库） |
| `<Link to="/about">` | react-router 或自定义 |

---

## 状态管理检测

| 线索 | 库 |
|-------|---------|
| `create((set) => ({...}))` | Zustand |
| `configureStore` / `createSlice` | Redux Toolkit |
| `createContext` + `useContext` | React Context |
| 仅使用 `useState`，通过 props 共享 | 无状态管理库 |
| `const [state, dispatch] = useReducer(...)` | useReducer |
| `import { atom, useAtom } from 'jotai'` | Jotai |
| `import { proxy, useSnapshot } from 'valtio'` | Valtio |
