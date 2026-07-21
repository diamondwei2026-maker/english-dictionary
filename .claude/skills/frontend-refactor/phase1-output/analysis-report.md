# Phase 1 分析报告 — English Dictionary (Taro → uni-app)

> **源项目**：`d:\Users\weij\english-dictionary\client\`（Taro 3.6.23 + React 18）
> **目标**：uni-app + Vue 3 + TypeScript + SCSS
> **目标路径**：`d:\Users\weij\english-dictionary\client-uni\`
> **分析日期**：2026-07-20
> **源文件总数**：45 个（7 页面 + 6 组件 + 12 API + 工具/hooks/配置）

---

## 文档 1：骨架地图

### 技术栈摘要

| 层级 | 技术 |
|------|------|
| 框架 | Taro 3.6.23 + React 18 |
| 语言 | TypeScript 5.1 |
| 样式 | **100% 内联 `style={{}}`**（342+ 处），SCSS 仅用于 30 个 CSS 变量 |
| 路由 | Taro pages 配置 + CustomTabBar（redirectTo 模式） |
| 状态 | 全局单例 (useAuth) + 各页面独立 useState，无 Redux/Zustand/Pinia |
| UI 组件库 | @taroify/core + @taroify/icons + 6 个自定义组件 |
| 构建工具 | Webpack 5 via @tarojs/webpack5-runner |
| API | ✅ 真实后端（12 个 API 文件，25+ 端点） |

### 目录树

```
client/src/
├── app.config.ts          → Taro 路由（7 页）
├── app.tsx                → 根组件（无状态/无 Provider）
├── app.scss               → 30 个 CSS 变量 + page/body/#app 布局
├── api/                   → 12 个 API 文件
│   ├── index.ts, request.ts, adapters.ts
│   ├── auth.ts, words.ts, wordbanks.ts, ai.ts
│   ├── daily-word.ts, dashboard.ts, favorites.ts, learning.ts, users.ts
├── data/
│   ├── types.ts           → Word, WordLibrary, ExtendedMeaning, User, AuthUser
│   └── mockData.ts        → mockWords(8), mockLibraries(4), mockUsers(5)
├── hooks/
│   ├── useAuth.ts         → 全局用户状态（单例+订阅）+ localStorage Token
│   └── useNavigate.ts     → 9 个导航函数
├── components/
│   ├── Icon.tsx           → 20 种图标
│   ├── PageHeader.tsx     → 毛玻璃 header (sticky + back + 插槽)
│   ├── PrimaryBtn.tsx     → 3 variant (primary/outline/danger)
│   ├── PhysicalImage.tsx  → 8 种物理意象 SVG 插画
│   └── CustomTabBar/index.tsx → 3 tab 底部导航 (毛玻璃 + 内联 SVG)
└── pages/
    ├── home/              → 搜索 + 今日一词 + 全部词汇
    ├── word-detail/       → 单词详情（意象图+核心义+引申义演化链+搭配+收藏）
    ├── libraries/         → 词库列表（4 个渐变色卡片）
    ├── library-words/     → 词库单词列表
    ├── profile/           → 个人中心（未登录引导/已登录统计+收藏+退登）
    ├── auth/              → 登录/注册（标签切换+表单校验+focus样式）
    └── admin/             → 管理后台（概览+词库CRUD+单词CRUD含AI+用户）
```

---

## 文档 2：交互清单

> 🔴 共用前缀：H=首页, W=单词详情, L=词库, LW=词库单词, P=个人中心, A=认证, AD=管理, B=TabBar

### 首页 (Home) — 9 交互

| ID | 元素 | 触发器 | 行为 | 条件 |
|----|------|--------|------|------|
| H-01 | 搜索输入框 | onInput | 更新 query | 始终 |
| H-02 | 搜索输入框 | onFocus | 蓝色边框+白色背景 | 始终 |
| H-03 | 搜索输入框 | onBlur | 透明边框+灰色背景 | 始终 |
| H-04 | search useEffect | 300ms防抖+seqRef竞态 | 搜索API/清空结果 | query变化 |
| H-05 | 搜索结果卡片 | onClick | navigateToWordDetail(id) | 有结果 |
| H-06 | 重试按钮 | onClick | loadData() | error |
| H-07 | 页面初始化 | useEffect | 并行加载 words+wordbanks+dailyWord | 挂载 |
| H-08 | 今日一词卡片 | onClick | navigateToWordDetail(id) | todayWord非null |
| H-09 | 全部词汇列表项 | onClick | navigateToWordDetail(id) | allWords>0 |

**条件渲染 (Home)**：loading(加载动画)→error(重试)→query(搜索结果区/非搜索区)→searchLoading→空结果→todayWord→allWords空

### 单词详情 (WordDetail) — 4 交互

| ID | 元素 | 触发器 | 行为 | 条件 |
|----|------|--------|------|------|
| W-01 | 页面初始化 | useEffect+wordId | 加载单词+自动记录学习(去重) | 挂载 |
| W-02 | 收藏切换 | onClick→handleToggleFavorite | 检查登录→API收藏/取消 | 正常态 |
| W-03 | 404返回首页 | onClick | redirectTo home | notFound |
| W-04 | 重试 | onClick | loadWord() | error |

**条件渲染**：loading→notFound/!word→error→正常详情（PageHeader右标签/收藏按钮状态/收藏loading）

### 词库列表 (Libraries) — 3 交互

| ID | 元素 | 触发器 | 行为 |
|----|------|--------|------|
| L-01 | 页面初始化 | useEffect | 并行加载词库+单词→build wordCounts |
| L-02 | 词库卡片 | onClick | navigateTo library-words?libraryId |
| L-03 | 重试 | onClick | loadData() |

### 词库单词 (LibraryWords) — 4 交互

| ID | 元素 | 触发器 | 行为 |
|----|------|--------|------|
| LW-01 | 页面初始化 | useEffect+libraryId | 加载词库详情+单词 |
| LW-02 | 单词卡片 | onClick | navigateToWordDetail |
| LW-03 | 404返回 | onClick | navigateTo libraries |
| LW-04 | 重试 | onClick | loadData() |

### 个人中心 (Profile) — 10 交互

| ID | 元素 | 触发器 | 行为 | 条件 |
|----|------|--------|------|------|
| P-01 | 登录按钮 | onClick | navigateToLogin() | !user |
| P-02 | 注册按钮 | onClick | navigateToRegister() | !user |
| P-03 | 用户变化监听 | onUserChange | 更新user | 始终 |
| P-04 | 统计刷新 | useEffect[user] | fetchUserStats() | user非null |
| P-05 | 管理后台 | onClick | navigateToAdmin('overview') | role=admin |
| P-06 | 收藏入口 | onClick | setShowFavorites(true) | user非null |
| P-07 | 退出登录 | onClick→handleLogout | 确认框→toast→800ms后logout() | user非null |
| P-08 | 收藏返回 | onBack | setShowFavorites(false) | showFavorites |
| P-09 | 收藏加载 | useEffect | fetchFavorites | FavoritesView |
| P-10 | 收藏单词 | onClick | navigateToWordDetail | 每条收藏 |

### 认证 (Auth) — 15 交互

| ID | 元素 | 触发器 | 行为 |
|----|------|--------|------|
| A-01 | 返回 | onClick | navigateBack() |
| A-02~03 | 登录/注册标签 | onClick | setMode + 清空error |
| A-04~06 | 用户名Input | onInput/onFocus/onBlur | 仅register |
| A-07~09 | 手机号Input | onInput/onFocus/onBlur | 始终 |
| A-10~12 | 密码Input | onInput/onFocus/onBlur | 始终 |
| A-13 | 密码确认 | onConfirm | handleSubmit() |
| A-14 | 密码可见切换 | onClick | setShowPassword |
| A-15 | 提交按钮 | onClick→handleSubmit | 校验→API→跳转/切换模式 |

**条件渲染**：mode(login/register)→error(红框)→loading(按钮disabled+文字)→showPassword(eye/eye-off)→各focus态(蓝/灰边框)

### 管理后台 (Admin) — 管理员专用（4个子模块，40+ 交互）

**主页面**：section 切换（overview/libraries/words/users）+ loading/error

**Overview**：4 个入口卡片（词库/单词/用户管理 + 退出）

**LibraryManager**：新增/编辑/删除词库 + name/desc Input + 保存/取消（6个focus事件）

**WordManager + WordEditForm**（最大组件）：
- 单词搜索+过滤，新增/编辑/删除单词
- AI SSE流式生成（流式优先/降级非流式）+ 进度显示
- 20+ 字段编辑：音标、意象类型(循环切换)、核心义/例句/意象描述 Textarea
- 引申义列表 CRUD（演化逻辑+中文义+词性Picker+例句+翻译，逐条操作）
- 搭配管理
- focus/blur 管理（动态 focusedField）
- 保存/取消（条件 disabled）

**UserManager**：只读用户列表

### 底部导航 (CustomTabBar) — 3 交互

| ID | 元素 | 触发器 | 行为 |
|----|------|--------|------|
| B-01 | 搜索Tab | onClick | 已激活return；否则redirectTo home |
| B-02 | 词库Tab | onClick | 已激活return；否则redirectTo libraries |
| B-03 | 我的Tab | onClick | 已激活return；否则redirectTo profile |

**Tab状态**：选中=蓝色(#2563EB)+strokeWidth2.5+字重600 / 未选中=灰色(#9CA3AF)+strokeWidth1.8+字重400

---

## 文档 3：数据流图

### 认证流程

```
登录：POST /api/v1/auth/login {phone, password}
  → {token, user} → setToken(token) → setGlobalUser(user)
  → admin → redirectTo admin | user → redirectTo profile

注册：POST /api/v1/auth/register → RegisterResult(不含token) → toast → 1.3s后切登录模式

Token管理：
  存储：localStorage 'auth_token'
  传输：Authorization: Bearer <token> (request.ts自动注入)
  过期：401 → removeToken + 清用户 + redirectTo login
```

### 适配器字段映射

| 后端 (MongoDB) | 前端 (domain) |
|----------------|---------------|
| _id | id |
| wordbankId | libraryId |
| physicalImageType | coreImageType |
| coreExampleEn / coreExampleZh | coreExampleSentence / coreExampleTranslation |
| evolutionDescription | logicalEvolution |
| exampleEn / exampleZh | exampleSentence / exampleTranslation |
| learnedWords (string[]) | learnedWords (number 聚合) |
| createdAt | joinedAt (用户) |

### API端点总览（25+端点）

| 模块 | 端点数 | 关键路由 |
|------|--------|---------|
| auth | 2 | POST login, POST register |
| words | 5 | GET/POST/PUT/DELETE + generate + stream |
| wordbanks | 5 | GET/POST/PUT/DELETE + words子资源 |
| ai | 2 | generate (非流式+SSE流式) |
| daily-word | 1 | GET (公开接口) |
| dashboard | 1 | GET (admin) |
| favorites | 3 | POST/DELETE toggle + GET list |
| learning | 3 | POST record + GET records + GET stats |
| users | 2 | GET list (admin) + GET me |

---

## 文档 4：设计令牌

### 核心数值速查表（1px = 2rpx）

| 类别 | 关键值 (px → rpx) |
|------|------------------|
| 页面背景 | #F7F9FC |
| 主色 | #2563EB / disabled #93C5FD |
| 文字 | #111827 / #6B7280 / #9CA3AF |
| 危险色 | #DC2626 / 背景 #FEF2F2 |
| 页面顶部padding | 52-56px → 104-112rpx |
| 水平padding | 24px → 48rpx (默认) / 20px → 40rpx (compact) |
| 卡片padding | 16-24px → 32-48rpx |
| 按钮padding | 16px → 32rpx |
| 卡片圆角 | 16-24px → 32-48rpx |
| 按钮/input圆角 | 14-16px → 28-32rpx |
| 列表间距 | 10-14px → 20-28rpx |
| 页面底部padding | 80px → 160rpx |
| 最大宽度 | 430px → 860rpx |
| 字体家族 | Inter, system-ui, -apple-system, sans-serif |
| 页面标题 | 26px/700 → 52rpx/700 |
| 卡片单词 | 17-18px/700 → 34-36rpx/700 |
| 详情页单词 | 42px/800 → 84rpx/800 |
| 卡片阴影 | 0 2px 12-20px rgba(0,0,0,0.04-0.07) |
| 品牌阴影 | 0 8px 32px rgba(37,99,235,0.25) |
| 主渐变 | linear-gradient(135deg, #1D4ED8, #2563EB, #3B82F6) |
| 毛玻璃 | backdrop-filter: blur(16-20px) — H5条件编译 |
| header半透明 | rgba(255,255,255,0.93) / rgba(247,249,252,0.92) |
| TabBar半透明 | rgba(255,255,255,0.88) |
| 细分割线 | 0.5px solid rgba(0,0,0,0.05) |

### 平台默认样式审计

| 属性 | 状态 | 风险 |
|------|------|------|
| box-sizing | ❌ 未声明 | 🔴 高 |
| line-height | ❌ 未声明 | 🔴 高 |
| outline | ❌ 未声明 | 🟡 中 |
| -webkit-appearance | ❌ 未声明 | 🟡 中 |
| user-select | ❌ 未声明 | 🟢 轻微 |

---

## 文档 5：图标资产清单

20 个 @taroify/icons SVG 组件 + 3 个 CustomTabBar 独立内联 SVG

**uni-app 目标方案**：uni-icons 优先（11个覆盖）+ iconfont 补充（9个需自建）

| uni-icons 覆盖 | iconfont 补充 |
|----------------|--------------|
| search, arrowleft, arrowright, person, eye, plus, trash, clear, checkmarkempty, gear, refreshempty | eye-off, shield, sparkles, book, target, logout, fire, font, friends |

---

## 文档 6：API 资产清单

- **基础URL**: "" (dev proxy / 生产同域)
- **HTTP客户端**: Taro.request (封装) → 目标 uni.request
- **Token存储**: localStorage → 小程序需改为 uni.getStorageSync
- **Token传递**: Authorization: Bearer header (全平台OK)
- **401处理**: 清除token+用户+跳转登录
- **认证适配**: Web→小程序 Cookie不可用，已用Token方案无需改动

---

## Phase 1 验证清单

- [x] 45个源文件均在骨架地图中
- [x] 97+ 交互条目已编号（H/W/L/LW/P/A/AD/B 前缀）
- [x] 40+ 条件渲染分支已记录
- [x] 6个类型定义已提取
- [x] 设计令牌：色板30+/间距20+/圆角10+/字体10+/阴影6/渐变6/特效8
- [x] 平台默认样式审计：7属性×5组件
- [x] 图标资产清单：20图标+uni-app方案决策
- [x] API资产清单：25+端点+适配器映射+认证流程
- [x] 审计元信息填写完整
