# 英语母语者词典 — 前端架构决策记录

| 属性 | 值 |
|------|-----|
| 版本 | v1.1 |
| 状态 | 已实现 |
| 作者 | Claude (ADR Architect) |
| 日期 | 2026-07-07 |
| 最后更新 | 2026-07-09 |
| 关联文档 | [后端 ADR](./server.md) |

## 1. 需求概述

面向中文母语者的认知语言学英语词典 APP。前端已完整实现（Taro H5），本轮仅需替换 mock 数据为真实 API 调用。

## 2. 跨切面决策

> 引用后端 ADR 跨切面决策，仅记录前端影响。

### 2.1 API 风格

- **选定方案**：RESTful
- **前端影响**：使用 `fetch` (Taro.request) 封装 API 层，按 `/api/v1/<resource>` 调用后端

### 2.2 认证授权

- **选定方案**：JWT（Bearer Token）
- **前端影响**：登录后 Token 存 `localStorage`；`useAuth` hook 同步读取 Token 中的用户信息；全局请求拦截器自动附加 `Authorization` Header；401 时清除 Token 并跳转登录页

### 2.3 跨域

- **选定方案**：后端 `cors` 白名单放行
- **前端影响**：无需处理，直接请求 Render 域名

## 3. 技术选型

### 3.1 跨端框架

- **选定方案**：Taro 3.6.23
- **目标平台**：H5（优先）、微信小程序（后续）
- **选择理由**：React 语法写多端、@taroify 组件库成熟、社区活跃

### 3.2 UI 框架与组件库

| 选型 | 方案 | 说明 |
|------|------|------|
| 框架 | React 18.2 | Hooks + 函数组件 |
| 语言 | TypeScript 5.1 | 类型安全 |
| 组件库 | @taroify/core 0.9.2 | Taro 适配的 Vant 风格组件，移动端友好 |
| 样式 | SCSS | 嵌套、变量、mixins |
| 构建 | Webpack 5 | Taro 内置 webpack chain |
| 包管理 | pnpm | Monorepo workspace |

### 3.3 状态管理

- **选定方案**：React 内置（useState + 全局单例 listener 模式）
- **说明**：当前项目状态简单（AuthUser + view 路由状态），无需 Redux/Zustand；`useAuth` hook 通过全局单例 + listener 模式实现跨组件共享
- **后续**：如需复杂状态管理，优先引入 Zustand（轻量、TS 友好）

### 3.4 路由方案

- **选定方案**：Taro 页面路由（`app.config.ts` 声明式 pages 列表）
- **页面列表**：

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | pages/home/index | 搜索 + 今日一词 + 词表 |
| 单词详情 | pages/word-detail/index | 物理意象 + 引申义 + 搭配 |
| 词库列表 | pages/libraries/index | 词库卡片列表 |
| 词库详情 | pages/library-words/index | 词库内单词列表 |
| 个人中心 | pages/profile/index | 用户信息 + 入口 |
| 认证 | pages/auth/index | 登录/注册（`?mode=login\|register`） |
| 管理后台 | pages/admin/index | 概览 + 词库/单词/用户管理 |

- **路由状态**：当前用自定义 `useNavigate` hook 管理 ViewState 栈（home/libraries/libraryWords/wordDetail/profile/login/register/admin），非 Taro 原生导航 — 待后续统一为 API 驱动路由
- **底部导航**：自定义 CustomTabBar 组件（首页/词库/我的），管理后台全屏覆盖时不显示

## 4. 架构设计

### 4.1 组件目录结构

```
client/src/
├── app.tsx                    # 入口
├── app.config.ts              # Taro 页面配置
├── app.scss                   # 全局样式
├── data/
│   ├── types.ts               # TypeScript 类型定义（Word, WordBank, User 等）
│   └── mockData.ts            # 开发 Mock 数据（API 不可用时的降级方案）
├── api/                       # 🆕 API 请求层
│   ├── index.ts               # 统一导出
│   ├── request.ts             # 请求封装（fetch + JWT 注入 + 错误处理）
│   ├── adapters.ts            # 后端↔前端数据格式适配器
│   ├── auth.ts                # 登录/注册
│   ├── words.ts               # 单词 CRUD
│   ├── wordbanks.ts           # 词库 CRUD
│   ├── ai.ts                  # AI 生成 + SSE 流式
│   ├── users.ts               # 用户信息
│   ├── learning.ts            # 学习记录
│   ├── favorites.ts           # 单词收藏
│   ├── daily-word.ts          # 今日一词
│   └── dashboard.ts           # 管理后台概览
├── hooks/
│   ├── useAuth.ts             # 认证状态 hook（集成真实 API）
│   └── useNavigate.ts         # 视图路由 hook
├── components/
│   ├── PageHeader.tsx         # 页头（sticky + 返回按钮）
│   ├── PhysicalImage.tsx      # 物理意象 SVG 组件（8 种类型）
│   ├── PrimaryBtn.tsx         # 主按钮组件
│   ├── Icon.tsx               # 图标组件
│   └── CustomTabBar/          # 自定义底部导航
├── pages/
│   ├── home/                  # 首页
│   ├── word-detail/           # 单词详情
│   ├── libraries/             # 词库列表
│   ├── library-words/         # 词库详情
│   ├── profile/               # 个人中心
│   ├── auth/                  # 登录/注册
│   └── admin/                 # 管理后台
└── assets/tabbar/             # 底部导航图标
```

### 4.2 数据流（已实现）

```
API 层 (fetch + JWT) ──→ adapters（字段映射）──→ 页面 state ──→ UI 渲染
       ↑
  localStorage (Token)
       │
  useAuth hook (全局认证状态)
```

- 所有页面已从 `mockData.ts` 切换到真实 API 调用
- `api/adapters.ts` 统一处理后端 `snake_case` ↔ 前端 `camelCase` 字段转换
- `api/request.ts` 自动注入 JWT Token，401 时清除 Token 并跳转登录页

### 4.3 已完成的改造项

| 改造点 | 改造前 | 改造后 |
|--------|--------|--------|
| 数据源 | `mockData.ts` 内存数组 | `/api/v1/*` REST API（已全部切换） |
| 登录验证 | 前端 mock 比对 `123456` | `POST /api/v1/auth/login` JWT |
| AI 生成 | `setTimeout` 1.8s 模拟 | `POST /api/v1/words/generate` + SSE 流式 |
| 路由 | `useNavigate` 自定义 ViewState | 保持不变，管理后台入口加入 Token 角色校验 |
| 数据持久化 | 页面刷新重置 | API 持久化到 MongoDB |
| 🆕 学习记录 | 仅静态 mock 数值 | `POST /api/v1/words/:id/learn` + 统计 API |
| 🆕 单词收藏 | 不存在 | `POST/DELETE /api/v1/words/:id/favorite` + 收藏列表 |
| 🆕 今日一词 | 前端日期取模 | 服务端加权随机推荐算法 |
| 🆕 管理后台概览 | 静态 mock 计数 | 实时 API 统计（词库/单词/用户/收藏/学习） |

## 5. 接口设计

### 5.1 API 请求封装

```typescript
// 计划新建 api/request.ts
const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    // 跳转登录页
  }
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}
```

### 5.2 前端 API 模块划分（已实现）

| 模块 | 文件 | 接口 |
|------|------|------|
| request | `api/request.ts` | 通用请求封装（fetch + JWT 注入 + 401 处理） |
| adapters | `api/adapters.ts` | 后端 snake_case ↔ 前端 camelCase 字段映射 |
| auth | `api/auth.ts` | login, register |
| wordbank | `api/wordbanks.ts` | fetchWordbanks, fetchWordbankById, fetchWordsByWordbank, create, update, delete |
| word | `api/words.ts` | fetchWords, fetchWordById, fetchWordDetail, create, update, delete |
| ai | `api/ai.ts` | generateWord (JSON), generateWordStream (SSE) |
| user | `api/users.ts` | fetchUsers (admin), fetchCurrentUser |
| learning | `api/learning.ts` | recordLearn, fetchLearningRecords, fetchUserStats |
| favorites | `api/favorites.ts` | favoriteWord, unfavoriteWord, fetchFavorites |
| daily-word | `api/daily-word.ts` | fetchDailyWord |
| dashboard | `api/dashboard.ts` | fetchDashboard |

## 6. 非功能性设计

### 性能

- 首屏渲染：现有代码所有视图条件渲染，首屏已包含全部逻辑，无路由懒加载
- 图片资源：物理意象 SVG 为内联 inline SVG，无网络请求
- 搜索：当前基于内存数组 0 延迟过滤；接入 API 后需考虑防抖（300ms）减少请求

### 移动端适配

- 最大宽度 430px，居中显示，超出部分隐藏
- 目标平台：Chrome (Android)、Safari (iOS)
- 触摸交互：按钮最小 44px 触控区域

### 兼容性

- 微信小程序：Taro 编译目标支持，但部分 DOM API 不可用（当前未使用）
- 桌面端：兼容但不作为主要场景

## 7. 风险与权衡

| 风险 | 影响 | 应对 |
|------|------|------|
| Taro API 与标准 DOM 差异 | API 请求层可能不兼容 | 优先用 fetch（H5），小程序用 Taro.request 适配层 |
| 前端类型与后端不实时同步 | 字段不一致 | 提取 `types.ts` 到根目录 `packages/types/` 共享 |
| CustomTabBar 与 Taro 原生导航冲突 | 路由行为异常 | 保持当前自定义 ViewState 路由，不混用 Taro 原生导航 |

## 8. 实施结果

本轮前端改动集中在 **API 接入层**，不涉及 UI 重构，所有改造已完成：

1. ✅ 新建 `api/` 目录（12 个模块），封装 request 方法和各模块调用
2. ✅ `api/adapters.ts` 统一后端/前端字段映射（snake_case ↔ camelCase）
3. ✅ 所有页面已从 `mockData.ts` 切换到真实 API 调用
4. ✅ 认证改造：`useAuth` hook 集成 JWT 登录 + Token 持久化 + 角色识别
5. ✅ SSE 流式 AI 生成：`generateWordStream` 支持实时逐字段推送
6. ✅ 新增功能：学习记录、单词收藏、今日一词 API、管理后台概览
