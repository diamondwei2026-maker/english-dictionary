# 英语母语者词典 — Taro 跨端迁移方案

> **目标**：一份代码 → 微信小程序（个人）+ iOS APP + Android APP + H5
> **源**：React 18 + Vite 6 + Tailwind 4（全部内联 style）
> **目标框架**：[Taro 3.x](https://taro.jd.com/)（React + TypeScript）
> **整体还原度**：89%（加权平均）
> **工时评估**：2–3 周（全职一人）

---

## 约束条件

- ✅ 微信个人小程序（无企业资质 → 不可用 `<web-view>`）
- ✅ 不可用 Capacitor 套壳方案（WebView 被封死）
- ✅ 一份代码，三端输出
- ✅ 必须保留 Figma 原型的核心视觉特征
- ❌ 不接受"重写两套代码"
- ❌ 不接受 H5 放弃小程序或反之

---

## 依赖处理策略

**当前 `package.json` 依赖 43 个包，迁移原则：**

| 当前依赖 | Taro 兼容性 | 处理 |
|----------|------------|------|
| `react` / `react-dom` 18 | Taro 内置兼容 | 保留 |
| `lucide-react` (图标) | ❓ Taro 小程序不支持 SVG 组件 | → 换 `@taroify/icons` 或 PNG iconfont |
| `@radix-ui/*` (40+ 组件) | ❌ 基于 DOM，小程序全不可用 | → 删除，换 `@taroify/core`（Taro 版 Vant）|
| `@mui/material` + `@emotion/*` | ❌ 基于 DOM | → 删除 |
| `tailwindcss` 4 | ❌ Taro 不支持 Tailwind 4（仅 3.x + weapp-tailwindcss 插件） | → 降级到 Tailwind 3 + `weapp-tailwindcss` |
| `react-router` | ⚠️ 不可用 | → 换 Taro 内置路由（`Taro.navigateTo` 等） |
| `recharts`、`react-dnd`、`cmdk`、`embla-carousel` 等 | ❌ 未使用 | → 删除 |
| `react-hook-form` | ⚠️ 小程序中表单为原生控件 | → 评估后保留或换 Taro 表单 |

---

## 阶段一：环境搭建与工程化（Day 1）

### 1.1 初始化 Taro 项目

- [ ] `npm install -g @tarojs/cli@latest`
- [ ] `taro init` — React + TypeScript 模板
- [ ] 配置 `config/index.ts` 三端编译参数
  ```ts
  outputRoot: {
    h5: 'dist/h5',
    weapp: 'dist/weapp',
    rn: 'dist/rn',
  }
  ```
- [ ] 安装核心依赖
  ```bash
  npm install @taroify/core @taroify/icons   # Taro 版组件库
  npm install weapp-tailwindcss              # 小程序 Tailwind 支持
  ```
- [ ] 配置 `babel.config.js` + `postcss.config.js`
- [ ] 配置 ESLint × Taro 规则

### 1.2 样式体系建立

- [ ] 建立 CSS 变量色彩系统（替换内联 style 中的色值）
  ```css
  :root {
    --bg: #F7F9FC;
    --primary: #2563EB;
    --primary-light: #93C5FD;
    --text-primary: #111827;
    --text-secondary: #6B7280;
    --text-muted: #9CA3AF;
    --success: #16A34A;
    --warning: #D97706;
    --danger: #DC2626;
  }
  ```
- [ ] 建立 Tailwind 圆角语义 class → `rounded-card`(16px) `rounded-section`(24px) `rounded-btn`(16px)
- [ ] 建立 Tailwind 阴影语义 class → `shadow-card-weak` `shadow-card-mid` `shadow-card-strong` `shadow-brand`
- [ ] 将字重体系写入 Tailwind 配置：300/400/500/600/700/800

### 1.3 路由体系迁移

- [ ] 对照现状，建立 Taro 路由表

  当前 (useState ViewState) → Taro pages 映射：

  | 当前视图 | Taro 页面路径 | 导航方式 |
  |---------|-------------|---------|
  | `home` | `pages/home/index` | `switchTab` |
  | `wordDetail` | `pages/word-detail/index?wordId=xxx` | `navigateTo` |
  | `libraries` | `pages/libraries/index` | `switchTab` |
  | `libraryWords` | `pages/library-words/index?libraryId=xxx` | `navigateTo` |
  | `profile` / `login` / `register` | `pages/profile/index` + 子路由 | `switchTab` + `navigateTo` |
  | `admin` (概览+词库+单词+用户) | `pages/admin/index` + 4 个子页 | `navigateTo` |

- [ ] 在 `app.config.ts` 中声明 tabBar（首页 / 词库 / 我的）
- [ ] 实现全局 `useNavigate` hook（封装 `Taro.navigateTo` / `Taro.switchTab` / `Taro.navigateBack`）

---

## 阶段二：组件逐页迁移（Day 2–Week 2）

> 每个页面迁移顺序按"UI 还原复杂度"排序，先简单后复杂。

### 2.1 AuthView（登录/注册页）

**还原目标：92% | 复杂度：低 | 预计：1 天**

- [ ] JSX 标签替换：`div→View` `span→Text` `button→View`（带 `onClick`）
- [ ] `input→Taro Input` 组件（`type="text"` `password` `number`）
- [ ] 表单校验逻辑迁移（正则保持，`e.target.value→e.detail.value`）
- [ ] Eye/EyeOff 密码切换 → `<Image>` 图标切换
- [ ] 提交按钮 loading 态 → `Taro.showLoading()`
- [ ] 🔴 渐变色 Logo 图标 → CSS `linear-gradient`（小程序支持）
- [ ] 🟢 focus/blur 边框动画 → 小程序 `<Input>` 的 `focusClass` 属性

### 2.2 BottomNav（底部导航栏）

**还原目标：85% | 复杂度：低 | 预计：半天**

- [ ] → Taro 原生 `app.config.ts` 的 `tabBar` 配置（自动渲染原生底部栏）
- [ ] tabBar 图标：3 张 PNG + 选中态 3 张 PNG（24×24, @2x/@3x）
- [ ] 🟡 毛玻璃效果 → Taro 原生 tabBar 不支持 `backdrop-filter`，降级为 `rgba(255,255,255,0.95)` 纯色背景 + `borderTop`
- [ ] 🟡 选中态颜色 #2563EB / 未选中 #9CA3AF → `tabBar.color` + `tabBar.selectedColor`
- [ ] 🟡 底栏文字字号 → `tabBar.fontSize: '11px'`
- [ ] 🟢 transition → 原生 tabBar 无过渡动画，直接切换（可接受）

### 2.3 HomeView（首页）

**还原目标：88% | 复杂度：中 | 预计：1.5 天**

- [ ] JSX 标签替换
- [ ] 🔴 430px 宽度限制 → `app.config.ts` 全局 `pageMeta` + CSS `max-width: 430px; margin: 0 auto`
- [ ] 搜索框 → `<Taro.Input>` + `Search` 图标（lucide→@taroify/icons 或替换为 Image）
- [ ] 实时过滤搜索 → `useState` + `filter` 逻辑保持不变
- [ ] 搜索结果列表 + 全部词汇列表 → `View` + `ScrollView`
- [ ] 🔴 今日一词渐变卡片 → `linear-gradient(135deg, #1D4ED8, #2563EB, #3B82F6)` 完整保留
- [ ] 🟡 页面 header 毛玻璃 → 降级：`background: rgba(255,255,255,0.92)` + `borderBottom: 1px solid rgba(0,0,0,0.04)`
- [ ] 🔴 词汇列表卡片圆角 + 阴影 + 库标签 → 完整保留
- [ ] 🟡 词库标签色 → 保留 `color: #2563EB` `background: #EFF6FF` `borderRadius: 6px`

### 2.4 LibrariesView + LibraryWordsView（词库浏览）

**还原目标：87% | 复杂度：中 | 预计：1.5 天**

- [ ] `LibrariesView` → `pages/libraries/index`
- [ ] `LibraryWordsView` → `pages/library-words/index?libraryId=xxx`
- [ ] 🔴 4 张词库卡片各一个 differ 渐变色背景 → 全部保留（小程序支持 `linear-gradient`）
- [ ] BookOpen 图标 → @taroify/icons 或 Image 替代
- [ ] 🔴 卡片圆角 24px + 阴影 + border → 完整保留
- [ ] 🟡 header 毛玻璃 → 同上降级方案
- [ ] 返回箭头 `←` → `<Taro.View onClick={navigateBack}>` + 旋转 180° 的箭头图

### 2.5 ProfileView（个人中心）

**还原目标：88% | 复杂度：中 | 预计：1.5 天**

- [ ] 未登录态 / 普通用户 / 管理员 三种 render 分支 → `if/else` 保持不变
- [ ] 🔴 用户信息卡片渐变背景（管理员紫 / 普通用户蓝）→ 完整保留
- [ ] `User` / `Settings` / `Shield` / `LogOut` / `ChevronRight` 等图标 → 逐个找 @taroify/icons 等效替代
- [ ] 🟡 header 毛玻璃 → 降级
- [ ] 🔴 设置行 → `borderBottom: 0.5px solid #F3F4F6`（小程序 hairline）
- [ ] 🔴 退出登录按钮 → 红色字 `#DC2626` + 浅红背景 `#FEF2F2`
- [ ] 管理后台入口按钮 → `navigateTo({ url: '/pages/admin/index' })`

### 2.6 WordDetailView（单词详情页 — 最复杂的页面）

**还原目标：90% | 复杂度：高 | 预计：2 天**

- [ ] JSX 标签替换 + ScrollView 包裹（长内容滚动）
- [ ] 🔴 单词大头 `42px / fontWeight 800 / letterSpacing -1px` → 保留
- [ ] 🔴 音标 16px #9CA3AF → 保留
- [ ] 🔴 物理意象 SVG（8 种）→ **此为产品核心差异化卖点，必须完整迁移**，见下方 2.6a
- [ ] 🔴 核心义卡片（#fff 背景 24px 圆角 阴影）→ 完整保留
- [ ] 🔴 蓝色左侧强调条 `borderLeft: 3px solid #2563EB` → 保留
- [ ] 🔴 绿色左侧强调条 `borderLeft: 3px solid #10B981` → 保留
- [ ] 🔴 引申义演化箭头 → 保留（带渐变的线 + ChevronRight 三角）
- [ ] 🟡 引申义词性彩色标签（n.蓝 / v.绿 / adj.橙 / adv.紫）→ 保留色值
- [ ] 🔴 常见搭配标签 → flexWrap tag 排列，保留
- [ ] 🟡 sticky header（返回 + 词库标签）→ 小程序 `ScrollView` 的 `sticky` 属性，需确保是 ScrollView 直接子级
- [ ] 🟡 词库标签 pill → 保留

#### 2.6a SVG 物理意象图迁移

**还原目标：93% | 复杂度：中 | 预计：1 天**

| 图片 | SVG 技术依赖 | 小程序兼容性 | 处理 |
|------|-------------|------------|------|
| `flow` | rect line path polygon | ✅ 全兼容 | 直接迁移 |
| `grasp` | circle line polygon + strokeDasharray | ✅ 全兼容 | 直接迁移 |
| `break` | rect line path circle polygon + strokeDasharray | ✅ 全兼容 | 直接迁移 |
| `bear` | rect line circle polygon | ✅ 全兼容 | 直接迁移 |
| `drive` | line circle polygon | ✅ 全兼容 | 直接迁移 |
| `light` | **`<defs>` + `<radialGradient>` + `stopOpacity`** | ❌ `<defs>` 被过滤 | → 替换为多层同心圆模拟（见下方代码） |
| `leverage` | line polygon rect text | ✅ 全兼容 | 直接迁移 |
| `yield` | line rect circle path + strokeDasharray | ✅ 全兼容 | 直接迁移 |

**LightImage 补救代码**（替换 radialGradient 光圈）：

```jsx
// 原：<radialGradient id="glowGrad"> → 小程序不支持
// 新：多层同心圆叠加模拟发光
{[48, 38, 28, 18, 8].map((r, i) => (
  <circle key={i} cx="200" cy="110" r={r}
    fill="#FDE047" opacity={0.06 + 0.06 * (5 - i)} />
))}
// 视觉效果对比：约 85% 还原（过渡不够平滑但整体光感保留）
```

### 2.7 AdminView（管理后台）

**还原目标：87% | 复杂度：最高 | 预计：2.5 天**

- [ ] 页面拆分：Overview / LibraryManager / WordManager / UserManager（当前已在同一文件内以函数拆分，保留此结构）
- [ ] 导航 → `navigateTo` 传 `section` 参数
- [ ] 🔴 统计 banner 渐变卡 → 保留
- [ ] 🔴 功能入口卡片（词库/单词/用户管理） → 保留
- [ ] 词库 CRUD 表单 → `<Taro.Input>` + `<Taro.Textarea>`
- [ ] 单词 CRUD 表单（最复杂子页面）
  - [ ] 所属词库下拉 → `<Picker mode="selector">`
  - [ ] AI 生成按钮 + loading 态 → `showLoading()` + 异步流程保持
  - [ ] 物理意象图预览 + 换图 → 保留 SVG
  - [ ] 引申义列表编辑（动态添加/删除）→ `<View>` + map 渲染，按钮用 `onClick`
  - [ ] 🟡 `window.confirm` 删除确认 → 替换为 `Taro.showModal({ title, content, success })`
- [ ] 🟡 PageHeader 毛玻璃 → 降级
- [ ] 🟡 用户头像渐变圆圈 → 保留 `linear-gradient`
- [ ] ⚪ `@keyframes spin` → 替换为条件渲染的旋转静态图或干脆删掉

---

## 阶段三：跨端兼容补丁（Week 2 后半）

### 3.1 毛玻璃统一降级（影响 7 处）

- [ ] HomeView header: `backdropFilter: 'blur(16px)'`
- [ ] WordDetailView topbar: `backdropFilter: 'blur(16px)'`
- [ ] BottomNav: `backdropFilter: 'blur(20px)'`
- [ ] LibrariesView header: `backdropFilter: 'blur(16px)'`
- [ ] LibraryWordsView header: `backdropFilter: 'blur(16px)'`
- [ ] ProfileView header: `backdropFilter: 'blur(16px)'`
- [ ] AdminView PageHeader: `backdropFilter: 'blur(16px)'`

**统一降级公式：**

```css
/* 原始 */
background: rgba(255,255,255,0.88);
backdrop-filter: blur(16px);

/* Taro 降级 */
background: rgba(255,255,255,0.93);
border-bottom: 0.5px solid rgba(0,0,0,0.05);
/* 可选：叠加极浅的 SVG 噪点纹理 */
```

### 3.2 平台条件编译

```tsx
// 按平台区分行为
import Taro from '@tarojs/taro'

// 小程序原生 tabBar ↔ H5/RN 自定义底部导航
if (process.env.TARO_ENV === 'weapp') {
  // 使用原生 tabBar（在 app.config.ts 中配置）
} else {
  // 使用 React 组件渲染 BottomNav
}

// 确认弹窗
if (process.env.TARO_ENV === 'h5') {
  window.confirm('确认删除？')
} else {
  Taro.showModal({ title: '提示', content: '确认删除？' })
}
```

### 3.3 图标替换清单

| lucide-react 图标 | Taro 替代方案 |
|-------------------|-------------|
| `Search` | @taroify/icons `Search` 或 Image |
| `BookOpen` | @taroify/icons `BookmarkO` |
| `User` | @taroify/icons `UserO` |
| `ArrowLeft` | `<View>` + base64 箭头图 或 @taroify/icons `ArrowLeft` |
| `ArrowRight` | 同上 |
| `ChevronRight` | 同上 |
| `Sparkles` | Emoji ✨ 或 Image |
| `Eye` / `EyeOff` | 自定义 Image 切换 |
| `Plus` / `Trash2` / `X` / `Check` | @taroify/icons 对应项 |
| `Settings` / `Shield` / `LogOut` | @taroify/icons |
| `RefreshCw` | @taroify/icons `Replay` |
| `Loader` | @taroify `<Loading>` 组件 |
| `Target` | 自定义 Image 或 emoji 🎯 |
| `PanelLeftIcon` (sidebar) | 未使用（AdminView 无侧栏） |

### 3.4 真机调试常规问题预判

- [ ] iOS 底部 safe-area → `env(safe-area-inset-bottom)` + Taro `SafeAreaView`
- [ ] Android 字体 weight 800 无效果 → 降级到 700，视觉差异不大
- [ ] Android 阴影渲染性能 → `boxShadow` blur 控制在 20px 以内
- [ ] iOS `<input>` 自动缩放 → `meta viewport user-scalable=no`（Taro 默认已设）
- [ ] RN 端 ScrollView 嵌套 → 注意 Taro RN 的 `nestedScrollEnabled`

---

## 阶段四：APP 打包（Week 3）

### 4.1 Taro → React Native (APP)

- [ ] 配置 Taro RN 端：`taro build --type rn`
- [ ] RN 专属补丁
  - [ ] `linear-gradient` → 用 `<LinearGradient>`（`react-native-linear-gradient`）
  - [ ] `boxShadow` → iOS `shadow*` 属性 / Android `elevation`
  - [ ] `position: sticky` → 手动 `<Animated.ScrollView onScroll>`
  - [ ] SVG → `react-native-svg`（8 个物理意象图用 RNSvg 重渲染）
- [ ] iOS 构建 → Xcode + `taro build --type rn` → Archive → App Store Connect
- [ ] Android 构建 → Android Studio + `taro build --type rn` → APK/AAB

### 4.2 Taro → H5 → Capacitor APP（备选，还原度更高）

如果 RN 端效果不理想（尤其 SVG 和渐变），回退到 H5 + Capacitor：

- [ ] `taro build --type h5`
- [ ] `npx cap init` + `npx cap add ios` + `npx cap add android`
- [ ] H5 端本身还原度 100%，Capacitor 只是把 H5 装进原生壳
- [ ] ⚠️ 需要 Apple Developer 账号和 Google Play 账号

---

## 效果还原度追踪表

| 效果 | 源位置 | 出现次数 | Taro→小程序 | Taro→RN | 优先级 |
|------|--------|---------|------------|---------|--------|
| 430px 居中布局 | App.tsx, BottomNav.tsx | 2 | ✅ 100% | ✅ 100% | 🔴 |
| 色彩体系 10 色 | 全站 | — | ✅ 100% | ✅ 100% | 🔴 |
| 圆角系统 6 档 | 全站 | — | ✅ 100% | ✅ 100% | 🔴 |
| 字体层级 34/26/22/18/16px | 全站 | — | ✅ 90% | ✅ 100% | 🔴 |
| SVG 7 幅（无 defs） | PhysicalImage.tsx | 7 | ✅ 100% | ⚠️ 需 RNSvg | 🔴 |
| SVG 1 幅（含 defs） | PhysicalImage.tsx | 1 | ⚠️ 85% | ⚠️ 需 RNSvg | 🔴 |
| linear-gradient | 全站 | 15+ | ✅ 100% | ❌ 需插件 | 🟡 |
| box-shadow | 全站 | 20+ | ⚠️ 85% | ⚠️ 60% | 🟡 |
| backdrop-filter blur | 全站 | 7 | ❌ 0% | ❌ 0% | 🟡 |
| sticky header | WordDetail, Admin | 2 | ⚠️ 85% | ❌ 需手动实现 | 🟡 |
| 左侧彩色强调条 | WordDetail | 2 | ✅ 100% | ✅ 100% | 🟡 |
| transition 动画 | 全站 | 8 | ⚠️ 50% | ❌ 需 Animated | 🟢 |
| letterSpacing | 全站 | 12 | ⚠️ 85% | ✅ 100% | 🟢 |
| input focus 动态 style | Auth, Admin | 多 | ❌ 0%(需重写) | ❌ 0% | 🟢 |
| keyframes spin | Admin | 1 | ❌ 0% | ❌ 0% | ⚪ |
| WebkitBackdropFilter | BottomNav | 1 | 直接删除 | 直接删除 | ⚪ |
| transform: rotate(180deg) | Libraries | 1 | ← 换图标 | ← 换图标 | ⚪ |

---

---

## 阶段五：Figma vs Client 还原度审查与修复（2026-07-06）

> **审查结论**：Client 迁移了约 70% 的业务逻辑（数据层、路由、状态管理正确），但视觉还原只有约 50%。
> **三个核心问题**：① 图标系统完全丢失（30+ 处 emoji 替代 SVG）② 交互细节缺失（focus/blur 动画、Enter 键提交）③ 架构级偏差（TabBar 无图标、登录/注册拆分、430px 约束未生效）。

### 5.1 P0 — 阻塞性问题（影响基本可用性）| 预计 1-2 天

- [ ] **TabBar 缺少图标** — `app.config.ts` 的 `tabBar.list` 只有 `pagePath` + `text`，缺少 `iconPath` / `selectedIconPath`。小程序原生 TabBar 将只显示文字无图标。
  - 制作 6 张 PNG 图标（24×24，@2x 48×48）：搜索/词库/我的 各 未选中 + 选中态，放在 `client/src/assets/`
  - 在 `tabBar.list` 中为每个 tab 添加 `iconPath` 和 `selectedIconPath`
- [ ] **无 430px 居中约束** — Figma `App.tsx` 最外层有 `maxWidth: '430px', margin: '0 auto'`，Client 的 `app.scss` 定义了 `.page-container` 但**没有任何页面使用它**
  - 方案：在每个页面根 `View` 添加 `max-width: 430px; margin: 0 auto`，或确认 Taro 是否支持在 `page` 元素上设置 `max-width`
- [ ] **登录/注册拆分为两个页面** — Figma 使用单一 `AuthView` 组件 + `useState` 切换 tab，Client 拆成 `login/index.tsx` 和 `register/index.tsx` 两个独立页面，切换时触发 `Taro.redirectTo` 整页跳转
  - 合并为 `pages/auth/index.tsx?mode=login|register`，内部用 `useState` 切换，避免页面跳转闪烁
  - 将全局用户状态（`getGlobalUser`/`setGlobalUser`/`onUserChange`）从 login 页面文件提取到 `src/hooks/useAuth.ts` 或 `src/data/authStore.ts`

### 5.2 P1 — 视觉还原问题（影响用户体验）| 预计 2-3 天

- [ ] **所有图标用 emoji 替代** — Figma 使用 `lucide-react` SVG 图标（矢量、清晰、跨平台一致），Client 全部使用 emoji（🔍✨📖👤🛡🎯⚙🚪👁🙈🔄✕→›←+），影响全部 8 个页面 30+ 处
  - 安装 `@taroify/icons`（已在迁移方案中规划）
  - 逐个替换：HomeView(`🔍`→`Search`, `✨`→自定义), WordDetailView(`←`→`ArrowLeft`, `›`→`Arrow`), LibrariesView(`📖`→`BookmarkO`), LibraryWordsView(`←`→`ArrowLeft`), ProfileView(`👤`→`UserO`, `🛡`→自定义, `📖`→`BookmarkO`, `🎯`→自定义, `⚙`→`SettingO`, `🚪`→自定义), Login/Register(`👁`/`🙈`→Image切换), AdminView(`📖`→`BookmarkO`, `🔤`→自定义, `👥`→自定义, `✕`→`Close`, `🔄`→`Replay`)
  - 对于 `@taroify/icons` 没有的图标，使用内联 SVG 组件或 base64 图片
- [ ] **Input focus/blur 动画缺失** — Figma 中的 `onFocus`(border→`#2563EB` + bg→`#fff`) / `onBlur`(恢复) 在 Client 中完全缺失
  - Taro 的 `Input` 支持 `onFocus`/`onBlur`，使用 `useState` 追踪 focus 状态动态切换 style
  - 修改：HomeView(搜索框)、Login/Register(手机号+密码)、AdminView(所有 Input/Textarea)
- [ ] **Enter 键提交缺失** — Figma 密码输入框有 `onKeyDown={e => e.key === 'Enter' && handleSubmit()}`，Client 无
  - Taro `Input` 组件使用 `onConfirm` 事件替代 Enter 键
  - 在密码输入框添加 `onConfirm={handleSubmit}`
- [ ] **PageHeader 组件未被使用** — `client/src/components/PageHeader.tsx` 已写好但**没有任何页面引用**，所有页面手写内联 header style
  - 重构全部页面，将内联 header 替换为 `<PageHeader>` 调用：
    - HomeView → 保留自定义（搜索框在 header 内，不适合通用组件）
    - WordDetailView → `<PageHeader showBack backLabel="返回" right={<词库标签>} />`
    - LibrariesView → `<PageHeader subtitle="词库" title="选择词库" />`
    - LibraryWordsView → `<PageHeader showBack backLabel="词库列表" title={lib?.name} />`
    - ProfileView → `<PageHeader subtitle="我的" title="个人中心" />`
    - Login/Register → `<PageHeader showBack />` + 自定义 logo 区
    - AdminView → `<PageHeader subtitle="管理后台" title="..." showBack />`
- [ ] **Header 毛玻璃降级不一致** — 各页面降级方式不统一：有的用 `rgba(255,255,255,0.93)`，有的用 `rgba(247,249,252,0.95)`，有的加 `borderBottom` 有的不加
  - 统一在 `PageHeader` 组件中固定：`background: rgba(255,255,255,0.93)` + `borderBottom: 0.5px solid rgba(0,0,0,0.05)`
  - 所有页面通过复用 PageHeader 自然获得一致性（随上一项一起解决）
- [ ] **单词详情返回行为差异** — Figma 中返回按钮始终 `navigate({ name: 'home' })`，Client 使用 `Taro.navigateBack()` 返回上一页
  - 确认产品意图后统一：如果 `Taro.getCurrentPages().length > 1` 则 `navigateBack()`，否则 `switchTab` 到首页

### 5.3 P2 — 体验打磨问题（锦上添花）| 预计 1 天

- [ ] **AI 生成 loading 无旋转动画** — Figma 使用 `Loader` 图标 + CSS `@keyframes spin`，Client 仅文字"⏳ 正在生成..."
  - Taro 不支持 CSS `@keyframes`，降级方案：使用 GIF 图 或 `Taro.showLoading()` + 省略号动画
- [ ] **组件抽象丢失** — Figma 有 `MenuRow`、`PrimaryBtn` 等可复用组件，Client 全部展开为内联 style
  - 将 AdminView 中重复的按钮样式提取为 `PrimaryBtn` 组件
  - 将 ProfileView 中的设置行提取为 `MenuRow` 组件
- [ ] **HomeView 标题换行** — Figma `<h1>用物理意象<br />读懂英语</h1>` 在 Client 用 `{'\n'}` 可能不渲染换行
  - 改为两个独立 `<Text>` 标签或用 `<View>` 包裹
- [ ] **各页面图标用 emoji 替代**（与 5.2 图标系统替换一并处理）
  - LibrariesView：`BookOpen` SVG → emoji 📖
  - Login/Register：`Eye`/`EyeOff` → emoji 👁/🙈
  - ProfileView：`Settings`+`ChevronRight` → emoji ⚙+›，`LogOut` → 🚪
  - AdminView：`BookOpen`/`Type`/`Users` → 📖/🔤/👥
  - WordDetailView：`ChevronRight` → › 字符
  - LibraryWordsView：`ArrowRight` 旋转 180° → ← 字符

### 5.4 不在修复范围内（平台硬限制，按迁移方案有意降级）

| 项目 | 原因 |
|------|------|
| `backdrop-filter: blur()` | 小程序不支持，已降级为半透明纯色背景 |
| CSS `transition` 动画 | 小程序支持有限 |
| `@keyframes spin` | 小程序不支持 CSS animation |
| TabBar 毛玻璃效果 | 原生 TabBar 不支持 `backdrop-filter` |
| `@radix-ui/*` / `@mui/material` 等 | 基于 DOM，小程序不可用 |
| `tailwindcss` 4.x | Taro 未配置 weapp-tailwindcss 插件 |
| `react-router` | 已换 Taro 内置路由 |

### 5.5 修复排期

```
Day 1: P0-1 TabBar 图标制作与配置
        P0-2 全局 430px 居中约束
        P0-3 登录/注册页面合并 + authStore 提取

Day 2: P1-4 PageHeader 组件改造 + 全部页面接入
        P1-5 Header 毛玻璃降级统一（随 PageHeader 自动解决）

Day 3: P1-1 图标系统 — 安装 @taroify/icons + emoji 替换（上半场）
        P1-6 单词详情返回行为确认与修复

Day 4: P1-1 图标系统 — emoji 替换（下半场）+ 缺失图标补充
        P1-2 Input focus/blur 动画
        P1-3 Enter 键提交

Day 5: P2 组件抽象 + 细节打磨 + 全量回归测试
```

---

## 不迁移清单（直接删除）

| 内容 | 原因 |
|------|------|
| `@mui/material` + `@emotion/*` 全家桶 | 小程序无 DOM，MUI 完全不可用 |
| `@radix-ui/*` 全部 40+ 组件 | 基于 DOM 事件系统，小程序不可用 |
| `recharts` | 未使用 |
| `react-dnd` + `react-dnd-html5-backend` | 未使用 |
| `cmdk` | 未使用 |
| `embla-carousel-react` | 未使用 |
| `react-popper` + `@popperjs/core` | 小程序无浮层 DOM API |
| `react-slick` | 未使用 |
| `react-resizable-panels` | 未使用 |
| `react-responsive-masonry` | 未使用 |
| `input-otp` | 未使用 |
| `vaul` | 未使用 |
| `next-themes` | 小程序无主题切换需求 |
| `canvas-confetti` | 小程序无 Canvas 撒花需求 |
| `date-fns` | 仅在 mockData 中选今日一词，可手写 |
| `sonner` | 小程序用 `Taro.showToast` 替代 |
| `tw-animate-css` | Taro 不支持 CSS animation framework |
| `/ui/*` 整个 shadcn 组件目录（50 个文件） | 全基于 Radix DOM，Taro 不可用 |
| `figmaAssetResolver` vite 插件 | Taro 用 webpack，直接改用静态 import |
| `react-router` | 换 Taro 内置路由 |

---

## 风险与缓解

| 风险 | 概率 | 缓解 |
|------|------|------|
| Taro RN SVG 渲染性能差 | 中 | 备选 H5+Capacitor 路线，SVG 在 WebView 中 100% 还原 |
| `weapp-tailwindcss` 兼容性问题 | 中 | 不用 Tailwind 4.x，降级到 3.x + 确认插件版本匹配 Taro 版本 |
| 小程序审核不通过（UGC 词典内容） | 低 | 词典内容为运营编辑，非 UGC，使用「工具-信息查询」类目 |
| Android shadow/elevation 效果差异大 | 中 | 弱化阴影层级，仅保 2 档（弱 + 强），去掉品牌色阴影 |
| `backdrop-filter` 降级后用户感知品质下降 | 高 | 接受。这是小程序平台硬限制，非技术可解决。用纯色半透明 + 噪点 + 细线描边弥补 |

---

## 里程碑

```
Week 1  Day 1-2   环境搭建 + 样式体系 + 路由     ✅ 工程跑通
Week 1  Day 3-5   AuthView + BottomNav + Home    ✅ 3 个核心页面可用
Week 2  Day 1-3   Libraries + Profile + WordDetail ✅ 全部前端页面可用
Week 2  Day 4-5   AdminView + 跨端兼容补丁        ✅ 管理后台可用 + 毛玻璃降级
Week 3  Day 1-3   SVG 迁移 + 图标替换 + 真机调试  ✅ 小程序在微信开发者工具/真机运行
Week 3  Day 4-5   Taro RN 构建 + APP 打包         ✅ iOS/Android 安装包
```
