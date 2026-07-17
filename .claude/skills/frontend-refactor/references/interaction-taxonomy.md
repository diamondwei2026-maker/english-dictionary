# 交互分类法

本参考文档定义了在阶段一分析中必须识别的每一类交互，以及在阶段四审计中必须验证的内容。在构建交互清单时，请使用这些类别以确保没有遗漏。

---

## 类别 1：点击/轻触交互

最常见的类型。任何响应用户轻触/点击的元素。

### 在源代码中需要查找的内容

```
onClick={...}
onPress={...}
onTap={...}
@click="..."
v-on:click="..."
<button ...>
<a href="...">
<div role="button" onClick={...}>
```

### 需要记录的内容

| 字段 | 示例 |
|-------|---------|
| ID | H4 |
| 元素 | "今日一词" 英雄卡片 |
| 触发器 | onClick |
| 行为 | navigate({name:'wordDetail', wordId: todayWord.id}) |
| 状态 | 正常、悬停（桌面端）、激活/按下 |
| 条件 | 仅在搜索查询为空时 |

### 常见陷阱
- 看起来像文本的按钮（无边框的 `<button>` 样式）
- 可点击的卡片（整个卡片就是一个按钮）
- 嵌套的可点击元素（点击卡片 vs 点击内部按钮）
- 阻止默认行为 / 阻止事件冒泡

---

## 类别 2：文本输入交互

### 需要查找的内容

```
onChange={...}     // React
@input="..."       // Vue
onInput={...}      // Taro、小程序
v-model="..."      // Vue 双向绑定
bindinput="..."    // 小程序
onBlur={...}
onFocus={...}
```

### 需要记录的内容

| 字段 | 示例 |
|-------|---------|
| ID | H1 |
| 元素 | 搜索输入框 |
| 触发器 | onChange |
| 行为 | setQuery(e.target.value) → 实时过滤 mockWords |
| 状态 | 空闲、聚焦、输入中、失焦 |
| 条件 | 始终渲染 |

### 需要关注的特殊输入行为
- 防抖过滤 vs 即时过滤
- 输入掩码（电话号码、信用卡）
- maxLength 限制
- inputMode 提示（numeric、tel、email）
- 受控组件 vs 非受控组件
- 表单验证时机（失焦时 vs 提交时）

---

## 类别 3：表单提交

### 需要查找的内容

```
onSubmit={...}
<form onSubmit={...}>
@submit="..."
bindsubmit="..."
```

### 需要记录的内容

| 字段 | 示例 |
|-------|---------|
| ID | A4 |
| 元素 | 登录/注册提交按钮 |
| 触发器 | onClick → handleSubmit() |
| 行为 | 验证 → 设置加载状态 → 认证 → 导航跳转 |
| 状态 | 空闲、加载中（禁用 + "处理中..."）、错误（显示消息） |
| 条件 | 始终（加载状态时禁用） |

### 需要捕获的验证模式
- 哪些字段是必填的
- 验证规则（正则表达式、长度、格式）
- 错误消息的显示位置和样式
- 成功/失败的回调函数

---

## 类别 4：切换/开关/标签页

### 需要查找的内容

```
setState(!state)
setTab('login' | 'register')
toggle 打开/关闭
标签页切换器
手风琴展开/折叠
开关组件
```

### 需要记录的内容

| 字段 | 示例 |
|-------|---------|
| ID | A1 |
| 元素 | 登录标签按钮（在登录/注册切换器中） |
| 触发器 | onClick → setTab('login') |
| 行为 | 切换表单模式，清除错误消息 |
| 状态 | 激活（白色背景 + 阴影）vs 未激活（透明 + 灰色文字） |
| 条件 | 始终渲染 |

### 激活/未激活状态追踪
- 激活和未激活之间的视觉差异
- 状态之间的动画/过渡效果
- 标签切换时内容发生的变化
- 默认/初始状态

---

## 类别 5：条件渲染

JSX/模板中的每个 `if`、`&&` 或三元表达式都有一个条件和两种结果。

### 需要查找的内容

```
{condition && <Component />}
{condition ? <A /> : <B />}
{isLoading ? <Spinner /> : <Content />}
{error && <ErrorMessage />}
{items.length === 0 && <EmptyState />}
v-if / v-show
wx:if / hidden
```

### 需要记录的内容

| 字段 | 示例 |
|-------|---------|
| ID | H5 |
| 元素 | 空搜索结果消息 |
| 触发器 | 响应式（查询状态变化） |
| 行为 | 显示"未找到相关单词"及建议 |
| 状态 | 可见 |
| 条件 | `results.length === 0 && query.trim() !== ''` |

### 条件分支检查清单
- [ ] 加载状态（数据正在获取中）
- [ ] 空状态（没有返回数据）
- [ ] 错误状态（获取/操作失败）
- [ ] 认证状态（已登录 vs 未登录）
- [ ] 角色状态（管理员 vs 普通用户）
- [ ] 功能开关（付费版 vs 免费版）
- [ ] 边界情况（null、undefined、空字符串）

---

## 类别 6：列表渲染与迭代

### 需要查找的内容

```
.map()
.forEach()
v-for
wx:for
```

### 需要记录的内容

| 字段 | 示例 |
|-------|---------|
| ID | H8 |
| 元素 | 每个单词列表项 |
| 触发器 | onClick |
| 行为 | navigate({name:'wordDetail', wordId: word.id}) |
| 状态 | 正常 |
| 条件 | 查询为空（无搜索激活） |

### 列表特定的关注点
- 每个项目的 key/id（用于协调比对）
- 空列表状态（与空搜索不同！）
- 项目点击 vs 项目子元素点击
- 每个项目内的动态内容（徽章、标签）

---

## 类别 7：模态框/对话框/弹出层

### 需要查找的内容

```
Dialog
Modal
Popup
AlertDialog
Sheet / Drawer
confirm() / alert() 原生对话框
```

### 需要记录的内容

| 字段 | 示例 |
|-------|---------|
| ID | AD5 |
| 元素 | 删除确认对话框 |
| 触发器 | onClick（删除按钮）→ window.confirm() |
| 行为 | 显示原生确认框 → 点击确定后：从列表中移除 |
| 状态 | 打开、关闭 |
| 条件 | 不适用（点击时打开） |

---

## 类别 8：导航与路由

### 需要查找的内容

```
navigate({name:'...', params})
router.push(...)
history.push(...)
window.location.href = ...
Taro.navigateTo(...)
wx.navigateTo(...)
<Link to="...">
<NuxtLink to="...">
```

### 需要记录的内容

| 字段 | 示例 |
|-------|---------|
| ID | H4 |
| 元素 | 今日单词英雄卡片 |
| 触发器 | onClick → navigate() |
| 行为 | 使用 todayWord.id 导航至 wordDetail 视图 |
| 状态 | — |
| 条件 | 查询为空 |

### 导航模式
- Push vs Replace（用户能否返回？）
- 标签页切换（与页面 Push 不同）
- 带参数 vs 不带参数
- 返回按钮行为
- 深度链接支持
- 操作后的重定向（登录 → 个人资料页）

---

## 类别 9：键盘交互

桌面端特有的交互，在移动端/触控目标上可能不存在。

### 需要查找的内容

```
onKeyDown={...}
onKeyUp={...}
onKeyPress={...}
@keydown="..."
```

### 需要记录的内容

| 字段 | 示例 |
|-------|---------|
| ID | A10 |
| 元素 | 密码输入框 |
| 触发器 | onKeyDown → 检查 key === 'Enter' |
| 行为 | 调用 handleSubmit() |
| 状态 | — |
| 条件 | 始终在密码输入框上 |

### 目标平台影响
- 小程序：通常不支持 — 必须映射到 onConfirm 或移除
- 移动端 Web：可用但很少被触发
- 桌面端 Web：必须保留

---

## 类别 10：定时器与异步

### 需要查找的内容

```
setTimeout(() => { ... }, ms)
setInterval(() => { ... }, ms)
async function / await
Promise 链（.then/.catch）
fetch / axios 调用
```

### 需要记录的内容

| 字段 | 示例 |
|-------|---------|
| ID | AD-AI1 |
| 元素 | AI 生成按钮 |
| 触发器 | onClick → setTimeout(1800ms) → 更新状态 |
| 行为 | 显示加载旋转动画 → 模拟 AI 生成 → 填充字段 |
| 状态 | 空闲 → 加载中（按钮禁用）→ 完成（绿色按钮） |
| 条件 | 单词输入非空 |

---

## 类别 11：平台自适应选择交互 🆕

移动端的"选择/下拉"与桌面端有根本的 UX 差异：

| 平台 | 选择交互形态 |
|------|------------|
| 移动端（iOS/Android） | 从屏幕**底部弹出**选项列表（Action Sheet / Bottom Sheet / Picker） |
| 桌面端（Web） | 在触发元素**附近弹出**下拉菜单（Popover / Dropdown） |

当源项目使用移动端框架的 `<picker>` 或 `<select>`，迁移到纯 Web 框架后，
**原生 `<select>` 在移动端仍然显示 Web 下拉而非底部弹出**——体验不符合移动端预期。
需要构建**自适应组件**来还原。

### 在源代码中需要查找的内容

```
uni-app:     <picker mode="selector" :range="options" @change="fn">
Taro:        <Picker mode="selector" range={options} onChange={fn}>
小程序:      <picker mode="selector" range="{{options}}" bindchange="fn">
React Native: <Picker selectedValue={x} onValueChange={fn}>
Flutter:     DropdownButton / CupertinoPicker
Web:         <select>、<Select>、<DropdownMenu>、<Combobox>
```

### 需要记录的内容

| 字段 | 示例 |
|-------|---------|
| ID | AD-SEL1 |
| 元素 | 词库选择器（管理员编辑界面） |
| 源交互 | `<picker mode="selector">` — 底部弹出 |
| 迁移后实际表现 | `<select>` — Web 下拉（**未使用自适应组件**） |
| 期望移动端行为 | Bottom Sheet 选择列表（Drawer / Action Sheet） |
| 期望桌面端行为 | Popover 下拉 |
| 选项数据来源 | 数组/对象列表 → 动态选项列表 |
| 选项数量 | N 个（帮助决策：< 3 个可选 Radio、>= 3 个必须用选择器） |

### 自适应实现策略（按目标框架）

| 目标框架 | 桌面端组件 | 移动端组件 | 响应式判断 |
|---------|----------|----------|----------|
| React (shadcn/ui) | `<Select>` (Radix) | `<Drawer>` (Vaul) | `useIsMobile()` — 768px 断点 |
| React (MUI) | `<Select>` | `<BottomSheet>` / `<Drawer>` | `useMediaQuery` |
| React (Ant Design) | `<Select>` | `<Popup>` + `<List>` | `useBreakpoint` |
| Vue 3 (Vant) | `<van-dropdown-menu>` | `<van-action-sheet>` | 组件自带 |
| Vue 3 (Element Plus) | `<el-select>` | 自定义 `<Drawer>` | `useMediaQuery` |
| 纯 Web (无 UI 库) | 自定义 Popover | 自定义 Bottom Sheet | `matchMedia('(max-width: 767px)')` |

### 架构模式

```
AdaptiveSelect
├── useIsMobile() === false (桌面)
│   └── <Select> — Popover 下拉，trigger 附近弹出
└── useIsMobile() === true  (移动端)
    └── <Drawer> — 底部滑入，含遮罩 + 拖拽指示条 + 可滚动选项列表
```

**关键规则**：
- ✅ 复用已有的 `Select` 和 `Drawer`，不要从零实现
- ✅ 共享 options 数据源和 onChange 回调
- ✅ 移动端 Drawer 中选择后自动关闭
- ❌ 不要用原生 `<select>` 在移动端 —— 它不会底部弹出
- ❌ 不要用 `.mobile-select { display:none }` 之类的 CSS hack —— 交互模式不同

### 检测命令

```bash
# 搜索源项目中的选择器/下拉组件
grep -rn '<select\|<picker\|<Picker\|<Dropdown\|DropdownMenu\|ActionSheet\|mode="selector"' src/ --include="*.vue" --include="*.tsx" --include="*.jsx"

# 搜索目标项目中的原生 select（可能是未自适应的遗留）
grep -rn '<select\|native.*select' src/ --include="*.vue" --include="*.tsx" --include="*.jsx"
```

### 完整性检查

- [ ] 每个 `<picker>` / `<select>` / `<DropdownMenu>` 元素
- [ ] 每个选项数量 > 2 的选择交互
- [ ] 源项目选择器的弹出方式（底部弹出 vs 下拉）
- [ ] 目标项目是否已有可复用的 Drawer/Select 组件
- [ ] 目标项目是否已有 `useIsMobile` / 响应式断点检测

---
## 完整性检查清单

在阶段一中构建交互清单时，请验证你已涵盖以下内容：

- [ ] 每个 `<button>` 元素
- [ ] 每个带有 `onClick` 的元素
- [ ] 每个带有事件处理函数的 `<input>`、`<textarea>`、`<select>`
- [ ] 每个带有 `onChange` 的元素
- [ ] 每个带有 `onSubmit` 的 `<form>`
- [ ] 每个 `onFocus` / `onBlur`
- [ ] 每个 `onKeyDown` / `onKeyUp` / `onKeyPress`
- [ ] 每个 `onScroll`
- [ ] 每个带有副作用的 `useEffect`
- [ ] 每个 `setTimeout` / `setInterval`
- [ ] 每个条件渲染（`&&`、三元表达式、`if`）
- [ ] 每个 `.map()` 迭代
- [ ] 每个对话框 / 模态框 / 弹出层
- [ ] 每个导航调用
- [ ] 每个 `<select>`、`<picker>`、`<Dropdown>`（类别 11 — 平台自适应）🆕
- [ ] 每个状态切换
