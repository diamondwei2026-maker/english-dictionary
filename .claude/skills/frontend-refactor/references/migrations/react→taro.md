# 迁移：React → Taro（多端小程序 + H5）

这是一个高频迁移场景。Taro 允许编写 React/Vue 代码，并编译为微信/支付宝/百度/字节跳动小程序以及 H5。

## Taro 项目结构（目标）

```
<project-name>/
├── src/
│   ├── app.tsx               # 入口组件（替代 main.tsx + App.tsx）
│   ├── app.config.ts         # 全局配置（pages、tabBar、window）
│   ├── app.scss               # 全局样式
│   ├── pages/                 # 每个页面 = 一个文件夹
│   │   ├── home/
│   │   │   ├── index.tsx      # 页面组件
│   │   │   ├── index.config.ts # 页面级配置
│   │   │   └── index.module.scss
│   │   ├── word-detail/
│   │   └── ...
│   ├── components/            # 共享组件
│   ├── data/                  # 类型、模拟数据、服务
│   └── styles/                # 全局样式文件
├── types/                     # 全局类型声明
├── package.json
├── tsconfig.json
├── babel.config.js
├── project.config.json        # 微信小程序配置
└── config/
    ├── index.ts               # Taro 构建配置
    ├── dev.ts
    └── prod.ts
```

## 组件映射

| React 模式 | Taro 模式 | 备注 |
|--------------|-------------|-------|
| `<div>` | `<View>` | 通用容器 |
| `<span>` | `<Text>` | 内联文本（小程序中文本必须使用此组件） |
| `<img>` | `<Image>` | 必须使用 `src` 属性；查看 `mode` 属性以控制填充方式 |
| `<button>` | `<Button>` 或 `<View onClick>` | 原生 Button 带有平台样式 |
| `<input>` | `<Input>` | 事件 API 不同（见下文） |
| `<textarea>` | `<Textarea>` | |
| `<a href>` | `<View onClick={navigate}>` | 小程序中没有 `<a>` |
| `<ul>/<ol>/<li>` | `<View>` + map | 没有列表元素 |
| `<React.Fragment>` | `<Block>` 或 `<>` | 两者均可使用 |
| `<Suspense>` | ❌ | 不支持；使用条件渲染 |
| `dangerouslySetInnerHTML` | ❌ | 大多不支持 |
| `<svg>`（内联） | ❌ | 小程序中不支持；详见 `references/icons.md` |
| `<canvas>` | `<Canvas>` | Taro Canvas 组件 |

## 事件映射

| React 事件 | Taro 事件 | 备注 |
|------------|-----------|-------|
| `onClick` | `onClick` | 可用；事件对象不同 |
| `onChange` | `onInput`（Input）/ `onChange`（其他） | Input 使用 `onInput`，值从 `e.detail.value` 获取 |
| `onSubmit` | `onSubmit`（Form） | Form 组件的提交事件 |
| `onFocus` | `onFocus` | 支持有限；请在真机上测试 |
| `onBlur` | `onBlur` | 支持有限 |
| `onKeyDown` | ❌ | Input 回车键使用 `onConfirm` |
| `onScroll` | `onScroll`（ScrollView） | 仅 ScrollView 支持，普通 View 不支持 |
| `onTouchStart` | `onTouchStart` | |
| `e.stopPropagation()` | `e.stopPropagation()` | |
| `e.preventDefault()` | ❌ | 小程序没有默认行为 |

### Input 事件 — 关键差异

```tsx
// React
<input value={query} onChange={e => setQuery(e.target.value)} />

// Taro
<Input value={query} onInput={e => setQuery(e.detail.value)} />

// 回车键 → 使用 onConfirm（而非 onKeyDown）
<Input onConfirm={handleSubmit} />
```

## 样式映射

| React 模式 | Taro 模式 |
|--------------|-------------|
| 内联 `style={{...}}` | 语法相同，但建议提取到 CSS Modules 以提升性能 |
| Tailwind 类名 | ❌ Taro 中不支持；提取到 CSS Modules |
| CSS Modules | ✅ 完全支持（`.module.scss`） |
| `backdropFilter` | ❌ 小程序不支持；仅保留给 H5 |
| `position: fixed` | ⚠️ 谨慎使用；请在真机上测试 |
| `vh` 单位 | ⚠️ 可能包含浏览器 chrome；使用 `calc()` 或 `env()` |
| `overflow: scroll` | 改用 `<ScrollView scrollY>` |
| `box-shadow` | ⚠️ 小程序中性能敏感 |
| CSS 过渡 | 基本过渡可用；复杂动画 → Taro 动画 API |

### 样式提取示例

```tsx
// 源（React）
<div style={{
  padding: '16px 24px',
  background: '#fff',
  borderRadius: '16px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
}}>

// 目标（Taro + CSS Modules）
// index.module.scss
.card {
  padding: 16px 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

// index.tsx
import styles from './index.module.scss';
<View className={styles.card}>
```

## 路由与导航映射

| React 模式 | Taro 模式 |
|--------------|-------------|
| `navigate({name:'home'})` | `Taro.switchTab({url:'/pages/home/index'})`（Tab 页面） |
| `navigate({name:'wordDetail',wordId:id})` | `Taro.navigateTo({url:`/pages/word-detail/index?id=${id}`})` |
| "返回" 按钮 | `Taro.navigateBack()` 或返回箭头（Taro 自动处理） |
| Tab 式导航 | Taro `app.config.ts` 的 tabBar 配置 |
| 深度链接 | `Taro.navigateTo` 通过 URL 传参 |

### 路由配置

```ts
// app.config.ts
export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/libraries/index',
    'pages/library-words/index',
    'pages/word-detail/index',
    'pages/profile/index',
    'pages/login/index',
    'pages/register/index',
    'pages/admin/index',
  ],
  tabBar: {
    list: [
      { pagePath: 'pages/home/index', text: '搜索', iconPath: '...', selectedIconPath: '...' },
      { pagePath: 'pages/libraries/index', text: '词库', iconPath: '...', selectedIconPath: '...' },
      { pagePath: 'pages/profile/index', text: '我的', iconPath: '...', selectedIconPath: '...' },
    ],
  },
  window: {
    navigationStyle: 'custom', // 如果使用自定义头部
  },
});
```

### 页面间传递数据

```tsx
// 发送页面
Taro.navigateTo({
  url: `/pages/word-detail/index?id=${wordId}`,
});

// 接收页面（word-detail/index.tsx）
import { useLoad } from '@tarojs/taro';

export default function WordDetail() {
  useLoad((options) => {
    const wordId = options?.id;
    // ...使用 wordId
  });
}
```

### 回调内闭合的 navigate → 内联到页面 🔴

**模式识别**：当 React App.tsx 将 `navigate()` 调用闭合在一个回调函数内部、并将该回调
通过 props 传给子组件时，Taro 迁移中**该 navigate 必须内联到页面自身**。

在 Taro 架构中，每个页面是 `pages/xxx/index.tsx` 的独立路由入口——不存在"父组件"
在执行 emit 后跑回调中的 `navigate()`。回调 prop 在 Taro 页面中没有接收方。

**检测方法**（Phase 2 执行）：
1. 在 App.tsx 中找出作为 prop 传给子组件的所有回调函数
2. 检查每个回调的函数体 — 如果包含 `setView()`/`navigate()` → 标记
3. 对标记项，记录"<页面名> → <目标路由>"

**映射规则**：

| 源模式 | ❌ 错误 | ✅ 正确 |
|--------|---------|---------|
| App 回调内含 navigate | emit 或 callback prop — 无人接收 | 页面事件处理函数最后一行：`Taro.navigateTo/Taro.switchTab` |
| App 回调内含 setUser + setView | 分两步，拆分到不同生命周期 | setUser + 立即 switchTab/navigateTo |

**具体示例**：

```tsx
// ❌ 错误 — 保持了 React 的 callback prop 模式，但 Taro 中无 App 层接收
// auth 页面
const handleLogin = (u) => {
  store.setUser(u);
  props.onAuth?.(u);  // ← 这个 prop 在 Taro 页面中不会被任何组件消费
};

// ✅ 正确 — 导航内联到 auth 页面自身
import Taro from '@tarojs/taro';

const handleLogin = (u) => {
  store.setUser(u);
  if (u.role === 'admin') {
    Taro.navigateTo({ url: '/pages/admin/index?tab=overview' });
  } else {
    Taro.switchTab({ url: '/pages/profile/index' });
  }
};
```

> 此规则与 uni-app 的 `react→uniapp.md` §2.2a 完全对称——根因相同（页面独立路由架构），
> 只是 API 名称不同（`Taro.navigateTo` vs `uni.navigateTo`）。

## 状态管理映射

| React 模式 | Taro 模式 |
|--------------|-------------|
| `useState` | `useState` ✅（相同） |
| `useReducer` | `useReducer` ✅（相同） |
| `useEffect` | `useEffect` + `useDidShow` / `useDidHide` |
| `useContext` | `useContext` ✅（相同） |
| `useCallback` | `useCallback` ✅（相同） |
| `useMemo` | `useMemo` ✅（相同） |
| `useRef` | `useRef` ✅（但不能用于 DOM 引用；用于存储值） |
| Redux/Zustand | ✅ 相同库在 Taro 中可用 |

### 生命周期差异

```tsx
// React：组件挂载
useEffect(() => { /* 挂载 */ }, []);

// Taro：页面显示（从其他页面返回时也会触发）
useDidShow(() => { /* 页面变为可见 */ });

// Taro：页面隐藏
useDidHide(() => { /* 页面变为隐藏 */ });
```

使用 `useDidShow` 进行页面级数据获取（用户从详情页返回时页面需要刷新）。

## 数据获取

| React 模式 | Taro 模式 |
|--------------|-------------|
| 直接导入模拟数据 | 相同 ✅ |
| `fetch()` | `Taro.request()`（增加了拦截器、Cookie 管理） |
| `axios` | H5 中可用；小程序需要适配器 |

## 已知限制（必须在阶段 2 中记录）

1. **不支持 SVG**：PhysicalImage SVG 组件 → 使用 CSS 形状或单独的图片资源（完整图标策略见 `references/icons.md`）
2. **不支持 backdropFilter**：粘性头部 → 使用半透明纯色背景
3. **不支持 :hover/:focus**：输入框的焦点样式 → 移除或使用条件类名
4. **不支持 position:fixed BottomNav**：替换为原生 tabBar
5. **不支持 onKeyDown**：回车提交 → 在 Input 上使用 onConfirm
6. **滚动行为**：普通 div 不可滚动 → 包装在 ScrollView 中
7. **100vh 问题**：不排除浏览器 chrome → 使用 `calc(100vh - 常量)` 或 flex 布局
8. **Image mode**：必须指定 `mode` 属性（aspectFit、aspectFill、widthFix 等）
9. **字体限制**：自定义字体需要特殊加载；小程序中仅支持系统字体
10. **CSS 动画复杂性**：复杂的关键帧动画 → 使用 Taro.createAnimation() API

## 快速转换检查清单

- [ ] `<div>` → `<View>`（全面替换）
- [ ] `<span>` → `<Text>`（尤其是 View 内的文本节点）
- [ ] `<img>` → `<Image>` 并设置 `mode` 属性
- [ ] `<input>` → `<Input>` 并使用 `onInput` 替代 `onChange`
- [ ] `<button>` → `<Button>` 或 `<View onClick>`
- [ ] 内联样式 → CSS Modules
- [ ] `navigate()` → `Taro.navigateTo()` / `Taro.switchTab()`
- [ ] 手动 BottomNav → tabBar 配置
- [ ] `backdropFilter` → 纯色背景回退方案
- [ ] SVG 组件 → CSS/Canvas/image 替代方案
- [ ] `onKeyDown` → `onConfirm`
- [ ] `position:fixed` → 原生方案或谨慎使用 CSS
- [ ] 自定义滚动容器 → `<ScrollView>`
