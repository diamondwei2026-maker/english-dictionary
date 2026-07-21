# Phase 2 映射报告 — English Dictionary

> **源项目**：`d:\Users\weij\english-dictionary\client\`（Taro 3.6 + React 18）
> **目标**：uni-app + Vue 3 + uni-ui + Vite + Formily + TypeScript
> **目标路径**：`d:\Users\weij\english-dictionary\client-uni\`
> **生成日期**：2026-07-20
> **上游输入**：`Phase 1 分析报告`（phase1-output/analysis-report.md）

---

## 产出 1：API 与服务端映射（Step 4c）

### 1a. HTTP 客户端映射 — `src/utils/request.ts`

#### 关键 API 差异对照

| 维度 | Taro.request | uni.request |
|------|-------------|------------|
| 函数签名 | `Taro.request<T>({url, method, data, header})` | `uni.request({url, method, data, header})` |
| 返回值 | `Promise<{data: T, statusCode, header}>` | `Promise<[err, res]>` 或 `Promise<{data, statusCode, header}>`（success callback 版） |
| 拦截器 | 无内置（手动封装在 `request.ts`） | 无内置（需手动封装） |
| 超时 | `Taro.request` 无超时参数 | `uni.request` 支持 `timeout` 参数（单位ms） |
| 基础 URL | `""`（同域部署，devServer proxy） | 保留 `""`（同域部署，Vite proxy） |
| data 格式 | JSON 对象 | JSON 对象（一致） |
| header 合并 | 展开 + 覆盖 | 展开 + 覆盖（一致） |

#### 目标 `src/utils/request.ts` 结构设计

```typescript
// src/utils/request.ts — uni.request 封装

// 类型定义（1:1 保留）
export interface ApiError {
  code: string;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;  // uni.request 原生支持
}

export class ApiRequestError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly errors?: Array<{ field: string; message: string }>;
  // 构造函数 1:1 保留
}

// 核心请求函数
export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = getToken();  // uni.getStorageSync('auth_token')
  const method = options.method || "GET";

  const header: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    header["Authorization"] = `Bearer ${token}`;
  }

  try {
    const [err, res] = await uni.request<T>({
      url: `${BASE_URL}${path}`,
      method,
      data: options.data,
      header,
      timeout: options.timeout || 15000,
    });

    // uni.request 成功时返回 [null, res]
    if (err) {
      throw new ApiRequestError(0, "NETWORK_ERROR", "网络请求失败，请检查网络连接");
    }

    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.data == null) {
        throw new ApiRequestError(
          res.statusCode,
          "EMPTY_RESPONSE",
          "服务器返回了空的响应数据，请检查后端服务是否正常运行"
        );
      }
      return res.data as T;
    }

    // 401 — 全局处理
    if (res.statusCode === 401) {
      if (token) {
        clearAuthAndRedirect();  // uni.reLaunch
      }
      const body = res.data as unknown as { error?: ApiError };
      throw new ApiRequestError(
        401,
        body?.error?.code || "UNAUTHORIZED",
        body?.error?.message || "认证失败，请重新登录"
      );
    }

    // 其他错误状态码
    const body = res.data as unknown as { error?: ApiError };
    const apiError = body?.error;
    throw new ApiRequestError(
      res.statusCode,
      apiError?.code || "UNKNOWN_ERROR",
      apiError?.message || `请求失败 (${res.statusCode})`,
      apiError?.errors
    );
  } catch (err) {
    if (err instanceof ApiRequestError) throw err;
    throw new ApiRequestError(0, "NETWORK_ERROR", "网络请求失败，请检查网络连接");
  }
}

// 内部工具
const BASE_URL = "";  // 开发环境 Vite proxy，生产环境同域部署

function clearAuthAndRedirect(): void {
  uni.removeStorageSync(TOKEN_KEY);
  // Pinia store.clearUser()
  setTimeout(() => {
    uni.reLaunch({ url: "/pages/auth/auth?mode=login" });
  }, 100);
}
```

#### 关键导出清单

| 导出 | 类型 | 说明 |
|------|------|------|
| `request<T>(path, options)` | 泛型函数 | 核心请求，返回 `Promise<T>` |
| `ApiRequestError` | class | 自定义错误类（statusCode + code + message + errors） |
| `ApiError` | interface | 后端错误响应格式 |
| `RequestOptions` | interface | 请求选项 |
| `getToken` | re-export | 从 useAuth composable 统一导出 |
| `setToken` | re-export | 从 useAuth composable 统一导出 |
| `removeToken` | re-export | 从 useAuth composable 统一导出 |
| `TOKEN_KEY` | re-export | 常量 `'auth_token'` |

### 1b. Token 存储适配

| 操作 | 源（Taro / 浏览器） | 目标（uni-app） |
|------|------------------|----------------|
| 读取 Token | `localStorage.getItem('auth_token')` | `uni.getStorageSync('auth_token')` |
| 写入 Token | `localStorage.setItem('auth_token', token)` | `uni.setStorageSync('auth_token', token)` |
| 删除 Token | `localStorage.removeItem('auth_token')` | `uni.removeStorageSync('auth_token')` |
| 异常处理 | `try/catch` 静默失败 | 保留 `try/catch` 静默失败 |

**注意事项**：
- `uni.getStorageSync` / `uni.setStorageSync` / `uni.removeStorageSync` 是跨平台统一 API（H5/小程序/App）
- H5 端底层仍使用 `localStorage`，但通过 uni API 保证跨平台一致性
- 小程序端使用 `wx.setStorageSync` 底层实现，单条限制 10MB（Token 远低于此）

### 1c. useAuth composable 迁移

#### 源架构（React 全局单例模式）

```typescript
// hooks/useAuth.ts — 源架构
let globalUser: AuthUser | null = null;           // 模块级全局单例
const listeners: Set<(u) => void> = new Set();    // 手动订阅发布

export function useAuth(): AuthUser | null {       // React hook
  const [user, setUser] = useState(getGlobalUser());
  useEffect(() => {
    const unsub = onUserChange((u) => setUser(u));
    return unsub;
  }, []);
  return user;
}

export function getGlobalUser(): AuthUser | null   // 非组件场景直接读取
export function setGlobalUser(u): void              // 写入 + 通知所有 listeners
export function onUserChange(fn): () => void        // 订阅 + 返回取消函数
export function getToken(): string | null
export function setToken(token: string): void
export function removeToken(): void
export function logout(): void
```

#### 目标架构（Vue 3 Pinia Store + Composable）

```typescript
// stores/auth.ts — Pinia store（替代全局单例）
import { defineStore } from 'pinia';
import type { AuthUser } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const user = ref<AuthUser | null>(null);
  const token = ref<string | null>(null);

  // --- Getters ---
  const isLoggedIn = computed(() => !!user.value && !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  // --- Actions ---
  function setUser(u: AuthUser | null) {
    user.value = u;
  }

  function setTokenValue(t: string) {
    token.value = t;
    try { uni.setStorageSync(TOKEN_KEY, t); } catch {}
  }

  function clearToken() {
    token.value = null;
    try { uni.removeStorageSync(TOKEN_KEY); } catch {}
  }

  function logout() {
    clearToken();
    setUser(null);
    uni.reLaunch({ url: '/pages/auth/auth?mode=login' });
  }

  // 初始化：从 storage 恢复 token
  function initFromStorage() {
    try {
      const saved = uni.getStorageSync(TOKEN_KEY);
      if (saved) token.value = saved;
    } catch {}
  }

  return { user, token, isLoggedIn, isAdmin, setUser, setTokenValue, clearToken, logout, initFromStorage };
});

// composables/useAuth.ts — 面向组件的 composable
export function useAuth() {
  const store = useAuthStore();

  // 向后兼容源 API 的函数签名（方便 API 层调用）
  function getToken(): string | null {
    return store.token;
  }

  function setToken(t: string) {
    store.setTokenValue(t);
  }

  function removeToken() {
    store.clearToken();
  }

  return {
    user: storeToRefs(store).user,      // 响应式 Ref
    isLoggedIn: store.isLoggedIn,
    isAdmin: store.isAdmin,
    setUser: store.setUser,
    getToken,
    setToken,
    removeToken,
    logout: store.logout,
  };
}

export const TOKEN_KEY = 'auth_token';
export { getToken, setToken, removeToken };  // 单独导出供 request.ts 使用
```

#### 源 → 目标 API 对照表

| 源 API | 目标 API | 变更说明 |
|--------|---------|---------|
| `useAuth()` (React hook) | `useAuth()` (Vue composable) | 返回值从 `AuthUser \| null` 变为 `{ user: Ref, isLoggedIn, isAdmin, ... }` |
| `getGlobalUser()` | `useAuthStore().user` | 直接访问 Pinia store 的 state |
| `setGlobalUser(u)` | `useAuthStore().setUser(u)` | 通过 Pinia action 修改 |
| `onUserChange(fn)` | `watch(store.user, fn)` 或 `store.$subscribe(...)` | Vue 响应式 watch 替代手动订阅 |
| `listeners Set` | **移除** | Vue 响应式系统自动处理依赖追踪 |
| `getToken()` | `getToken()` | 实现改为 `uni.getStorageSync` |
| `setToken(t)` | `setToken(t)` | 实现改为 `uni.setStorageSync` |
| `removeToken()` | `removeToken()` | 实现改为 `uni.removeStorageSync` |
| `logout()` | `store.logout()` | 跳转改为 `uni.reLaunch` |

### 1d. SSE 流式 API 适配

#### 源实现（`api/ai.ts` — `generateWordStream`）

- 使用原生 `fetch()` + `ReadableStream` + `TextDecoder`
- 解析 SSE 协议（`event:` / `data:` 行）
- 4 种事件类型：`thinking` / `content` / `done` / `error`
- 401 时手动 `removeToken()`（raw fetch 不经过 request.ts 拦截器）
- 非 200 / 流式失败时抛出异常，由调用方降级到非流式 `generateWord()`

#### 目标实现（条件编译）

```typescript
// api/ai.ts — generateWordStream 条件编译

// #ifdef H5
// ============ H5 端：保留 fetch + ReadableStream（逻辑 1:1 移植） ============
export async function generateWordStream(
  wordName: string,
  wordbankId: string,
  force: boolean,
  callbacks: GenerateWordStreamCallbacks,
): Promise<void> {
  const query = force ? "?force=true" : "";
  const url = `/api/v1/words/generate/stream${query}`;
  const token = getToken();

  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ wordName, wordbankId }),
    });

    if (!response.ok) {
      let errorMsg = `请求失败 (${response.status})`;
      try {
        const errBody = await response.json();
        const apiErr = errBody?.error;
        if (apiErr?.message) errorMsg = apiErr.message;
      } catch { /* ignore parse error */ }
      if (response.status === 401 && token) {
        removeToken();
      }
      throw new Error(errorMsg);
    }

    if (!response.body) {
      throw new Error("浏览器不支持流式读取");
    }

    // ... ReadableStream + TextDecoder + SSE 解析（1:1 保留）
    reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    // ... 保留完整 SSE 解析循环 + parseSSEEvent 函数
  } catch (err) {
    throw err;  // 调用方降级到非流式
  } finally {
    if (reader) {
      try { reader.cancel(); } catch { /* ignore */ }
    }
  }
}
// #endif

// #ifdef MP-WEIXIN
// ============ 小程序端：降级为非流式 generateWord ============
export async function generateWordStream(
  wordName: string,
  wordbankId: string,
  force: boolean,
  callbacks: GenerateWordStreamCallbacks,
): Promise<void> {
  // 小程序不支持 fetch + ReadableStream
  // 降级为非流式 generateWord，在完成后一次性回调
  try {
    const word = await generateWord(wordName, wordbankId, force);
    callbacks.onDone?.(word);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "生成失败";
    callbacks.onError?.("GENERATE_ERROR", msg);
  }
}
// #endif
```

#### 适配决策表

| 平台 | 方案 | 原因 |
|------|------|------|
| H5 | `fetch` + `ReadableStream` | 原生浏览器支持，保留流式体验 |
| 微信小程序 | 降级为非流式 `generateWord` | 小程序 JS 引擎不支持 `ReadableStream`；`wx.request` 无流式能力 |
| App（未来） | 降级为非流式 `generateWord` | App 端 `uni.request` 无流式能力 |

#### 调用方适配

Admin 页面的 AI 生成入口需做条件编译：

```vue
<!-- #ifdef H5 -->
<!-- 先尝试 SSE 流式，失败降级非流式 — 保留完整交互 -->
<!-- #endif -->

<!-- #ifdef MP-WEIXIN -->
<!-- 直接调用非流式 generateWord — 仅 loading 态 + 一次性结果 -->
<!-- #endif -->
```

### 1e. API 文件迁移清单（26 个端点，10 个 API 模块）

| 源文件 | 目标文件 | 函数数 | 变更 |
|--------|---------|--------|------|
| `api/request.ts` | `utils/request.ts` | 5 | Taro.request → uni.request；localStorage → uni.storage |
| `api/adapters.ts` | `utils/adapters.ts` | 8 | 1:1 移植，零逻辑变更 |
| `api/auth.ts` | `api/auth.ts` | 2 | login / register，零变更 |
| `api/words.ts` | `api/words.ts` | 6 | fetchWords, fetchWordById, fetchWordDetail, createWord, updateWord, deleteWord |
| `api/wordbanks.ts` | `api/wordbanks.ts` | 6 | CRUD + list |
| `api/favorites.ts` | `api/favorites.ts` | 3 | favoriteWord, unfavoriteWord, fetchFavorites |
| `api/learning.ts` | `api/learning.ts` | 3 | recordLearn, fetchLearningRecords, fetchUserStats |
| `api/ai.ts` | `api/ai.ts` | 2 | generateWord（1:1）+ generateWordStream（条件编译） |
| `api/daily-word.ts` | `api/daily-word.ts` | 1 | fetchDailyWord，零变更 |
| `api/dashboard.ts` | `api/dashboard.ts` | 1 | fetchDashboard，零变更 |
| `api/users.ts` | `api/users.ts` | 2 | fetchUsers, fetchCurrentUser，零变更 |
| `api/index.ts` | `api/index.ts` | — | 统一 re-export |

所有 API 模块除 `request.ts` 和 `ai.ts` 外均为 1:1 移植，逻辑零变更。

---

## 产出 2：uni.scss 变量设计 + 设计 Token 数值对照

### 2a. 颜色

```scss
// ============================================================
// uni.scss — English Dictionary 全局设计变量
// 基于 Phase 1 设计 Token 表 + 源文件精确 inline style 值
// 换算规则：px → rpx（× 2）
// ============================================================

// ── 主品牌色 ──
$color-primary: #2563EB;            // 源：PrimaryBtn primary 变体 bg + 全局按钮/链接/激活态
$color-primary-dark: #1D4ED8;       // 源：渐变起始 (home:379, profile:231)
$color-primary-light: #3B82F6;      // 源：渐变终止 (home:379)
$color-primary-disabled: #93C5FD;   // 源：PrimaryBtn disabled bg
$color-primary-bg: #EFF6FF;         // 源：蓝色背景 (home:564, word-detail:219)
$color-primary-border: #BFDBFE;     // 源：outline 按钮边框 (PrimaryBtn:49)

// ── 页面 / 卡片背景 ──
$color-page-bg: #F7F9FC;            // 源：全局页面底色 (home:103, auth:132, word-detail:124 等)
$color-card-bg: #FFFFFF;            // 源：卡片 / 列表背景 (home:302 等)
$color-input-bg: #F1F5F9;          // 源：INPUT-A 非聚焦背景 (home:248, auth:216)

// ── 文字色 ──
$color-text-primary: #111827;       // 源：主标题 (home:200, word-detail:233 等)
$color-text-secondary: #374151;     // 源：次要标题 (auth:286 等)
$color-text-tertiary: #6B7280;      // 源：描述文字 (home:331, word-detail:293 等)
$color-text-quaternary: #9CA3AF;    // 源：占位符 / 非激活 (home:113, word-detail:251 等)
$color-icon-inactive: #D1D5DB;      // 源：非激活图标 (home:340, word-detail:248)

// ── 边框 ──
$color-border-default: #E5E7EB;     // 源：INPUT-B 非聚焦边框 (auth:111)
$color-border-light: rgba(0,0,0,0.05);   // 源：header 底部分割线 (PageHeader:63)
$color-border-tabbar: rgba(0,0,0,0.06);  // 源：TabBar 顶部分割线 (CustomTabBar:101)

// ── 浅灰背景 ──
$color-bg-light: #F3F4F6;           // 源：MenuRow icon 背景 (PrimaryBtn:94)
$color-bg-example: #F8FAFC;         // 源：例句背景 (word-detail:287, 317, 350)
$color-bg-container: #F9FAFB;       // 源：收藏星标未激活背景 (word-detail:243)

// ── 语义色 ──
$color-error: #DC2626;              // 源：错误 / danger 文字 (PrimaryBtn:54, auth:410)
$color-error-bg: #FEF2F2;           // 源：错误 / danger 背景 (PrimaryBtn:53, profile:515)
$color-success: #16A34A;            // 源：成功绿 (libraries:12 accent)
$color-success-dark: #059669;        // 源：深绿
$color-success-bg: #F0FDF4;         // 源：成功背景 (word-detail POS v., profile:376)
$color-warning: #D97706;            // 源：library[2] accent (libraries:14)
$color-warning-bg: #FEF3C7;         // 源：收藏星标激活背景 (word-detail:243)

// ── 管理员色 ──
$color-admin: #7C3AED;              // 源：管理员主色 (profile:327, libraries:15)
$color-admin-dark: #4C1D95;         // 源：管理员渐变起始 (profile:230)
$color-admin-bg: #FAF5FF;           // 源：管理员背景 (profile:320)

// ── 收藏星标 ──
$color-star-active: #EAB308;        // 源：星标激活填充 (word-detail:248)
$color-star-bg: #FEF3C7;            // 源：星标激活背景 (word-detail:243)

// ── header 半透明背景 ──
$color-header-bg-white: rgba(255,255,255,0.93);   // 源：PageHeader 默认 bgColor（白色页面）
$color-header-bg-page: rgba(247,249,252,0.94);    // 源：profile FavoritesView PageHeader
// 注：rgba(247,249,252,0.92) 也出现（word-detail:125）— 视觉近似，统一为 0.94

// ── TabBar ──
$color-tabbar-bg: rgba(255,255,255,0.88);         // 源：CustomTabBar:100
```

### 2b. 间距体系（px → rpx）

```scss
// ── 页面级间距 ──
$space-page-pt: 104rpx;             // 源：52px — 页面顶部安全区 (PageHeader:62 "52px 24px 16px")
$space-page-h: 48rpx;               // 源：24px — 页面水平内边距 (home:178, word-detail:229)
$space-page-h-compact: 40rpx;       // 源：20px — 紧凑模式水平内边距 (PageHeader compact)
$space-page-bottom: 48rpx;          // 源：24px — 页面底部留白 (home:103 "0 0 24px")

// ── 卡片内边距 ──
$space-card-p: 40rpx;               // 源：20px — 标准卡片 padding (profile:384, word-detail:311)
$space-card-p-lg: 48rpx;            // 源：24px — 大卡片 padding (word-detail:274, 371)
$space-card-p-h: 40rpx;             // 源：20px — 卡片水平内边距 (search result:301)
$space-card-p-card: 32rpx 40rpx;    // 源："16px 20px" — 搜索 / 收藏 / 词库列表卡片

// ── 输入框内边距 ──
$space-input-p: 28rpx 32rpx;        // 源："14px 16px" — 所有输入框 (home:242, auth:110)
$space-input-p-search: 28rpx 32rpx 28rpx 92rpx;  // 源："14px 16px 14px 46px" — 搜索框 (home:242)

// ── 按钮内边距 ──
$space-btn-p: 32rpx;                // 源：16px — PrimaryBtn / Auth submit / 登录按钮 (PrimaryBtn:32, auth:425)
$space-btn-p-sm: 24rpx 64rpx;       // 源："12px 32px" — 重试按钮 (home:155)
$space-btn-p-outline: 32rpx;        // 源：16px — outline 变体

// ── 标签内边距 ──
$space-tag-p: 4rpx 16rpx;           // 源："2px 8px" — 词库名标签 (home:564)
$space-tag-p-role: 6rpx 20rpx;      // 源："3px 10px" — 角色标签 (profile:283)
$space-tag-p-pos: 6rpx 20rpx;       // 源："3px 10px" — 词性标签 (word-detail:337)

// ── 间距 Gap 体系 ──
$gap-xs: 6rpx;                      // 源：3px — TabBar 图标-文字间距 (CustomTabBar:138)
$gap-sm: 12rpx;                     // 源：6px — 小间距 (PageHeader back:80, auth:145)
$gap-sm-alt: 16rpx;                 // 源：8px — 搭配标签间距 (word-detail:377)
$gap-md: 20rpx;                     // 源：10px — 搜索列表 word-phonetic 间距 (home:312)
$gap-md-alt: 24rpx;                 // 源：12px — 列表卡片间距 (word-detail:305)
$gap-md-lg: 28rpx;                  // 源：14px — Auth 输入框间距 (auth:277) / 词库卡片间距 (libraries:143)
$gap-lg: 32rpx;                     // 源：16px — 大间距 (profile user-card icon gap:241)
$gap-xl: 40rpx;                     // 源：20px — admin card 间距
$gap-xxl: 48rpx;                    // 源：24px — 区块间距 (home:350)
```

### 2c. 圆角体系（px → rpx）

```scss
// ── 圆角 ──
$radius-xs: 12rpx;                  // 源：6px — 标签 pill (home:564)
$radius-sm: 16rpx;                  // 源：8px — MenuRow icon 容器 (PrimaryBtn:94)
$radius-sm-alt: 20rpx;              // 源：10px — 注册 Tab 激活态 (auth:230) / 错误背景 (auth:414)
$radius-md: 24rpx;                  // 源：12px — Tab 切换器背景 (auth:217) / 搭配项 (word-detail:384)
$radius-md-alt: 28rpx;              // 源：14px — Auth Logo (auth:169) / 输入框 (auth:111)
$radius-lg: 32rpx;                  // 源：16px — 主按钮 (PrimaryBtn:33) / 搜索输入框 (home:243)
$radius-xl: 40rpx;                  // 源：20px — 引申义卡片 (word-detail:310) / Profile 卡片 (profile:304)
$radius-2xl: 48rpx;                 // 源：24px — 今日一词 (home:380) / 核心义 (word-detail:272) / 用户卡片 (profile:233)
$radius-round: 40rpx;               // 源：20px — 小圆角 button (重试 btn:158) / 词库标签 (word-detail:222)
$radius-pill: 9999rpx;              // 源：9999px — 标签 pill
$radius-circle: 50%;                // 源：50% — 头像 / 收藏星标按钮 (word-detail:242, profile:131)
```

### 2d. 字体排版（px → rpx）

```scss
// ── 字号 ──
$font-hero: 84rpx;                  // 源：42px / weight 800 — 单词详情 hero (word-detail:233)
$font-today-word: 68rpx;            // 源：34px / weight 800 — 今日一词 (home:399)
$font-stat-number: 60rpx;           // 源：30px / weight 700 — 统计数字
$font-page-title: 52rpx;            // 源：26px / weight 700-800 — 页面标题 (home:199, PageHeader:110, auth:191)
$font-profile-subtitle: 40rpx;      // 源：20px / weight 600 — "登录后开始学习" (profile:144)
$font-word-list: 36rpx;             // 源：18px / weight 700 — 搜索列表单词 (home:317)
$font-word-all: 34rpx;              // 源：17px / weight 700 — 全部词汇列表单词 (home:533)
$font-body-lg: 32rpx;               // 源：16px / weight 600-700 — 大正文 (word-detail:281, PrimaryBtn:34)
$font-body: 30rpx;                  // 源：15px / weight 500 — 正文 (home:116, menu rows)
$font-body-sm: 28rpx;               // 源：14px / weight 400-600 — 小正文 (home:268, auth:143)
$font-caption: 26rpx;               // 源：13px / weight 400-600 — 描述 (home:324, auth:281)
$font-caption-sm: 24rpx;            // 源：12px / weight 400-600 — 小描述 (home:192, word-detail:322)
$font-label: 22rpx;                 // 源：11px / weight 600 — 标签 (home:386, word-detail:258, CustomTabBar:147)

// ── 字重 ──
$font-weight-hero: 800;             // 源：42px + 34px word-display
$font-weight-title: 700;            // 源：26px 页面标题
$font-weight-subtitle: 600;         // 源：16px-20px 副标题 / 按钮文字
$font-weight-body: 500;             // 源：14-15px 正文
$font-weight-caption: 400;          // 源：11-13px 描述 / 非激活 Tab 文字

// ── 字体族 ──
$font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
// 源：Inter, system-ui（仅 PhysicalImage SVG text 元素中使用）
// 目标：H5 条件编译 @import Google Fonts 'Inter'；小程序系统默认
// 详见 产出 3 — D6 设计决策

// ── 行高 ──
$line-height-title: 1.3;            // 源：home:201 PageHeader 标题
$line-height-body: 1.5;             // 源：word-detail:332 引申义
$line-height-relaxed: 1.6;          // 源：home:427 今日一词 / word-detail:323 例句
$line-height-loose: 1.7;            // 源：word-detail:281 核心义
$line-height-hero: 1.1;             // 源：word-detail:233 word hero
```

### 2e. 阴影

```scss
// ── 阴影 ──
$shadow-card-sm: 0 4rpx 24rpx rgba(0,0,0,0.04);          // 源："0 2px 12px rgba(0,0,0,0.04)" — 全部词汇卡片 (home:519)
$shadow-card-md: 0 4rpx 32rpx rgba(0,0,0,0.05);          // 源："0 2px 16px rgba(0,0,0,0.05)" — 搜索 / 收藏 / Profile 卡片 (home:304, profile:305)
$shadow-card-lg: 0 4rpx 40rpx rgba(0,0,0,0.05);          // 源："0 2px 20px rgba(0,0,0,0.05)" — 核心义 / 搭配卡片 (word-detail:276, 372)
$shadow-image: 0 8rpx 48rpx rgba(0,0,0,0.07);            // 源："0 4px 24px rgba(0,0,0,0.07)" — 物理意象插画 (word-detail:264)
$shadow-hero-blue: 0 16rpx 64rpx rgba(37,99,235,0.25);   // 源："0 8px 32px rgba(37,99,235,0.25)" — 今日一词 / 用户卡片蓝 (home:382, profile:238)
$shadow-hero-purple: 0 16rpx 64rpx rgba(124,58,237,0.25);// 源："0 8px 32px rgba(124,58,237,0.25)" — 管理员卡片 (profile:237)
$shadow-subtle: 0 2rpx 8rpx rgba(0,0,0,0.08);            // 源："0 1px 4px rgba(0,0,0,0.08)" — Auth Tab 激活态 (auth:232)
$shadow-auth-logo: 0 8rpx 32rpx rgba(37,99,235,0.3);     // 源："0 4px 16px rgba(37,99,235,0.3)" — Auth Logo (auth:175)
$shadow-header-line: 1rpx solid rgba(0,0,0,0.05);        // 源："0.5px solid rgba(0,0,0,0.05)" — PageHeader 底部分割线 (PageHeader:63)
$shadow-tabbar-line: 2rpx solid rgba(0,0,0,0.06);        // 源："1px solid rgba(0,0,0,0.06)" — TabBar 顶部分割线 (CustomTabBar:101)
```

### 2f. 渐变

```scss
// ── 渐变 ──
$gradient-primary: linear-gradient(135deg, #1D4ED8, #2563EB, #3B82F6);
  // 源：home:379 — 今日一词卡片

$gradient-admin: linear-gradient(135deg, #4C1D95, #7C3AED);
  // 源：profile:230 — 管理员用户卡片

$gradient-logo: linear-gradient(135deg, #1D4ED8, #3B82F6);
  // 源：auth:170 — Auth Logo 背景

$gradient-ai-card: linear-gradient(135deg, #EFF6FF, #DBEAFE);
  // 源：admin AI 卡片

$gradient-evolution: linear-gradient(to right, #E5E7EB, #2563EB);
  // 源：word-detail:31 — 引申义演化箭头线

// ── 词库卡片 4 色渐变 ──
$gradient-library-blue: linear-gradient(135deg, #EFF6FF, #DBEAFE);     // 源：libraries:12
$gradient-library-green: linear-gradient(135deg, #F0FDF4, #DCFCE7);    // 源：libraries:13
$gradient-library-orange: linear-gradient(135deg, #FFF7ED, #FED7AA);   // 源：libraries:14
$gradient-library-purple: linear-gradient(135deg, #FAF5FF, #EDE9FE);   // 源：libraries:15

// 词库卡片对应 accent / border 色
$color-library-blue-accent: #2563EB;     $color-library-blue-border: #BFDBFE;
$color-library-green-accent: #16A34A;    $color-library-green-border: #BBF7D0;
$color-library-orange-accent: #D97706;   $color-library-orange-border: #FDE68A;
$color-library-purple-accent: #7C3AED;   $color-library-purple-border: #DDD6FE;
```

### 2g. 特效（条件编译标记）

```scss
// ── 毛玻璃特效（H5 条件编译 — 小程序不支持 backdrop-filter） ──
/* #ifdef H5 */
$blur-header: blur(16px);           // 源：PageHeader 文档注释 blur(16px)
$blur-tabbar: blur(20px);           // 源：CustomTabBar:114 backdropFilter
/* #endif */

// ── 过渡动画（H5 条件编译 — 小程序依靠 class 切换） ──
/* #ifdef H5 */
$transition-default: 0.2s;           // 源：CustomTabBar:141 transition 'color 0.2s'
$transition-input: 0.2s ease;        // 输入框 focus/blur 过渡
/* #endif */

// ── 光标样式（H5 条件编译） ──
/* #ifdef H5 */
$cursor-pointer: pointer;            // 源：可点击元素
$cursor-not-allowed: not-allowed;
/* #endif */
```

### 2h. 输入框样式 Pattern Mixin（Step 4b 核心输入）

```scss
// ============================================================
// 输入框模式 A — 搜索型（HomeView 搜索框、AdminView 搜索过滤）
// 特征：blur background #F1F5F9 → focus background #FFFFFF + border #2563EB
// ============================================================
@mixin input-pattern-a {
  width: 100%;
  padding: $space-input-p;                  // 28rpx 32rpx
  border-radius: $radius-lg;                // 32rpx
  border: 3rpx solid transparent;           // 源："1.5px solid transparent"
  background: $color-input-bg;              // #F1F5F9
  font-size: $font-body-lg;                 // 32rpx
  color: $color-text-primary;               // #111827
  outline: none;
  box-sizing: border-box;
  line-height: 1.5;                         // 高风险项：源遗漏，目标强制添加

  /* #ifdef H5 */
  -webkit-appearance: none;                 // 高风险项：源遗漏，移除 iOS Safari 默认圆角
  /* #endif */
}

@mixin input-pattern-a-focused {
  border-color: $color-primary;             // #2563EB
  background: $color-card-bg;               // #FFFFFF
}

// ============================================================
// 输入框模式 B — 表单型（AuthView 用户名 / 手机号 / 密码）
// 特征：background 始终 #FFFFFF，仅 border 在 blur/focus 切换
// ============================================================
@mixin input-pattern-b {
  width: 100%;
  padding: $space-input-p;                  // 28rpx 32rpx
  border-radius: $radius-md-alt;            // 28rpx
  border: 3rpx solid $color-border-default; // #E5E7EB
  background: $color-card-bg;               // #FFFFFF
  font-size: $font-body-lg;                 // 32rpx
  color: $color-text-primary;               // #111827
  outline: none;
  box-sizing: border-box;
  line-height: 1.5;                         // 高风险项：源遗漏

  /* #ifdef H5 */
  -webkit-appearance: none;
  /* #endif */
}

@mixin input-pattern-b-focused {
  border-color: $color-primary;             // #2563EB
}

// ============================================================
// 搜索输入框（Input Pattern A + 左侧搜索图标偏移）
// ============================================================
@mixin input-search {
  @include input-pattern-a;
  padding-left: 92rpx;                      // 源："14px 16px 14px 46px" (home:242)
}
```

### 2i. 设计 Token 审计对照（验证覆盖）

| Phase 1 Token | uni.scss 变量 | 源值（px） | rpx 值 | 覆盖文件数 |
|---------------|--------------|-----------|--------|-----------|
| page-pt | `$space-page-pt` | 52px | 104rpx | 7 页面所有 header |
| page-h | `$space-page-h` | 24px | 48rpx | 7 页面 |
| card-p | `$space-card-p` | 20px | 40rpx | 5 页面 |
| card-p-lg | `$space-card-p-lg` | 24px | 48rpx | WordDetail x2 |
| input-p | `$space-input-p` | 14px 16px | 28rpx 32rpx | Auth + Home + Admin |
| btn-p | `$space-btn-p` | 16px | 32rpx | PrimaryBtn + Auth + Profile |
| tag-p | `$space-tag-p` | 2px 8px | 4rpx 16rpx | Home + Profile |
| primary | `$color-primary` | #2563EB | — | 全局 |
| page-bg | `$color-page-bg` | #F7F9FC | — | 全局 |
| blur-header | `$blur-header` | blur(16px) | — | >=6 页面 header |
| blur-tabbar | `$blur-tabbar` | blur(20px) | — | CustomTabBar |
| radius-2xl | `$radius-2xl` | 24px | 48rpx | 今日一词 / 核心义 / 用户卡片 |
| safe-area | `padding-bottom: env(safe-area...)` | — | — | CustomTabBar |

---

## 产出 3：设计决策多平台影响矩阵（Step 5a）

> 格式说明：
> - **决策**：设计 / 架构选择
> - **H5 桌面端 / H5 移动端 / 微信小程序**：每平台的影响与策略
> - **实施方式**：具体技术手段
> - **风险等级**：低 / 中 / 高

### D1: 页面 max-width（430px 容器居中）

| 维度 | 详情 |
|------|------|
| **源实现** | 全局页面 + CustomTabBar 使用 `max-width: 430px; margin: 0 auto`（H5 端宽屏桌面阅读体验） |
| **源位置** | CustomTabBar:99（`maxWidth: '430px'`）；页面通过 `padding: "0 24px"` 隐式控制 |
| **H5 桌面端** | 必须保留 max-width: 430px，否则宽屏下文字行过长影响阅读 |
| **H5 移动端** | 屏幕宽度 <= 430px 时自动占满全宽，max-width 自然生效为上限，无副作用 |
| **微信小程序** | 不需要 max-width（小程序固定宽度），但保留也无害 |
| **实施方式** | 全局 App.vue `#app { max-width: 750rpx; margin: 0 auto; }` 等效于 375px 设计基准，或直接保留 430px CSS 值（`max-width: 430px` 等价于 860rpx） |
| **风险等级** | 低 |

### D2: 自定义 TabBar vs 原生 tabBar（混合方案）

| 维度 | 详情 |
|------|------|
| **源实现** | 自绘 CustomTabBar 组件 + `Taro.redirectTo` 切换页面（非 pages.json tabBar） |
| **源特征** | 3 Tab（home / libraries / profile）+ 内联 SVG 图标 + 毛玻璃 blur(20px) + color 0.2s transition |
| **H5 端** | 保留自绘 CustomTabBar（Vue 组件），条件编译保留 backdrop-filter + transition |
| **小程序端** | 使用 uni-app 原生 `pages.json` tabBar 配置 + `uni.switchTab` |
| **原生 tabBar 配置示例** | `"list": [{ "pagePath": "pages/home/home", "text": "搜索", "iconPath": "static/tabbar/search.png", "selectedIconPath": "static/tabbar/search-active.png" }, ...]`, `"color": "#9CA3AF"`, `"selectedColor": "#2563EB"` |
| **实施方式** | `#ifdef H5` 渲染 CustomTabBar 组件 + `#ifdef MP-WEIXIN` 使用 pages.json tabBar + `.vue` 页面中隐藏 CustomTabBar |
| **风险等级** | 中 — 需准备 6 张小程序 tabBar 图标 PNG（24x24 常规态 x3 + 激活态 x3） |

### D3: backdrop-filter 毛玻璃特效保留

| 维度 | 详情 |
|------|------|
| **源实现** | PageHeader `backdropFilter: blur(16px)` + CustomTabBar `backdropFilter: blur(20px)` |
| **源位置** | PageHeader 文档注释；CustomTabBar:114 |
| **H5 端** | 条件编译保留 `backdrop-filter: blur(...)` + `-webkit-backdrop-filter: blur(...)` |
| **小程序端** | 不支持 backdrop-filter，通过传入与页面底色一致的 `rgba()` 半透明背景色模拟融合效果 |
| **实施方式** | PageHeader `bgColor` prop（默认 `rgba(255,255,255,0.93)`，页面底色 `rgba(247,249,252,0.94)`）；TabBar 半透明 `rgba(255,255,255,0.88)` |
| **风险等级** | 低 — 已在源项目设计阶段完成降级方案 |

### D4: hover / focus 伪类与 cursor 样式

| 维度 | 详情 |
|------|------|
| **源实现** | inline style 中未使用 `:hover`（React inline style 局限性），但部分元素通过 onClick 模拟交互 |
| **H5 桌面端** | 条件编译添加 `:hover` 伪类（按钮轻微变暗、卡片阴影增强），添加 `cursor: pointer` 到所有可点击元素 |
| **H5 移动端** | `:hover` 在触屏设备无效；`:active` 可用 |
| **小程序端** | 不支持 `:hover`，依靠 `hover-class` 属性替代 |
| **实施方式** | H5 端通过 `<style>` 块或 scoped style 添加；小程序端使用 `hover-class="xxx"` |
| **风险等级** | 低 |

### D5: PhysicalImage SVG 插画跨平台

| 维度 | 详情 |
|------|------|
| **源实现** | 9 种物理意象 SVG（内联 JSX），每种一个函数组件，包含 `<svg>` + `<rect>` + `<line>` + `<polygon>` 等基础元素 |
| **源位置** | `components/PhysicalImage.tsx` — flow, grasp, break, bear, drive, light, leverage, yield, generic |
| **H5 端** | 保留内联 SVG（Vue template 直接注入 svg 标签），支持 CSS animation |
| **小程序端** | 小程序 `<svg>` 标签支持有限（基础形状 rect/circle/line/polygon 可用，`<defs>/<radialGradient>` 不支持 — 源项目 LightImage 已用同心圆降级替代 `<radialGradient>`） |
| **实施方式** | 所有 9 个 SVG 1:1 移植为 Vue template；注意：小程序端 SVG 内部 `<text>` 标签在基础库 2.x 中已支持 |
| **风险等级** | 中 — light 类型已做小程序兼容（同心圆降级），其他 8 种使用基础 SVG 元素，小程序基础库 2.9+ 支持 |

### D6: 字体族 'Inter' → 系统字体降级

| 维度 | 详情 |
|------|------|
| **源实现** | SVG 内 `<text fontFamily="Inter, system-ui">`（PhysicalImage.tsx:27,53 等）；React inline style 未显式声明 font-family |
| **H5 端** | `index.html` 中通过 `<link>` 引入 Google Fonts 'Inter'（`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap')`） |
| **小程序端** | 使用系统默认字体（`-apple-system, BlinkMacSystemFont, ...`），无法加载外部 web font |
| **实施方式** | uni.scss 定义 `$font-family-base` 降级链；H5 条件编译在 `index.html` 加载 Inter |
| **风险等级** | 低 — Inter vs 系统默认无衬线字体视觉差异极小 |

### D7: 页面级 state → composable；Admin 面板 useTab 切换

| 维度 | 详情 |
|------|------|
| **源实现** | 每个页面用 React `useState` / `useEffect` 管理局部状态；Admin 用 `const [section, setSection] = useState<AdminTab>('overview')` 切换 4 面板 |
| **H5 端** | 使用 Vue 3 `ref` / `reactive` + `composable` 提取可复用逻辑；Admin 4 面板切换保留单页面方案（`const activeTab = ref('overview')`，4 个 `v-if` 面板） |
| **小程序端** | 同 H5 方案 — 性能无差异 |
| **实施方式** | 每个页面一个 `.vue` SFC + 对应的 composable（如 `useHome.ts`、`useAdmin.ts`） |
| **风险等级** | 低 |

### D8: input transition（focus / blur 动画）

| 维度 | 详情 |
|------|------|
| **源实现** | Input 的 border / background 随 focus / blur state 即时切换（React state -> inline style），无 CSS transition |
| **H5 端** | 条件编译添加 `transition: border-color 0.2s ease, background-color 0.2s ease`，使 focus/blur 切换有平滑动画 |
| **小程序端** | 依靠 `:class` 动态切换样式类名，class 切换触发原生重绘 |
| **实施方式** | H5 条件编译 SCSS 添加 transition 属性；小程序端仅依靠 class 切换 |
| **风险等级** | 低 |

### D9: 条件编译全局策略

| 维度 | 详情 |
|------|------|
| **原则** | 所有 CSS 特效（blur / hover / transition / cursor）使用 `#ifdef H5` 包裹；所有原生能力（fetch ReadableStream / inline SVG）使用平台条件编译 |
| **H5 独有** | backdrop-filter, :hover, transition, cursor: pointer, fetch + ReadableStream, Google Fonts |
| **小程序独有** | pages.json tabBar, hover-class, picker mode="selector", uni.getStorageSync 底层 wx 实现, `<svg>` 元素有限支持 |
| **共享代码（无编译条件）** | 所有 API 模块（除 ai.ts SSE 部分）、adapters.ts、types、request.ts 核心逻辑、Pinia store、Vue 组件模板逻辑 |
| **风险等级** | 低 — 条件编译边界清晰 |

### 决策汇总矩阵

| ID | 决策 | H5 桌面 | H5 移动 | 小程序 | 风险 |
|----|------|---------|---------|--------|------|
| D1 | max-width: 430px | 必须 | 自适应 | 不需要 | 低 |
| D2 | CustomTabBar vs 原生 | CustomTabBar | CustomTabBar | pages.json tabBar | 中 |
| D3 | backdrop-filter | 保留 | 保留 | rgba 降级 | 低 |
| D4 | hover / focus | 保留 | 保留 :active | hover-class | 低 |
| D5 | SVG 插画 | 内联 SVG | 内联 SVG | 基础 SVG 元素 | 中 |
| D6 | Inter 字体 | Google Fonts | Google Fonts | 系统字体 | 低 |
| D7 | 页面 state | composable | composable | composable | 低 |
| D8 | input transition | 保留 transition | 保留 transition | class 切换 | 低 |
| D9 | 条件编译策略 | #ifdef H5 | #ifdef H5 | #ifdef MP | 低 |

---

## 产出 4：拓扑排序层级

> 迁移顺序按照依赖关系从底层类型到顶层入口逐层构建，确保每一层的前置依赖已就绪。

### Layer 0：基础类型与配置（零依赖）

| 文件 | 说明 | 依赖 |
|------|------|------|
| `src/types/index.ts` | 所有 TypeScript 类型 / 接口（Word, WordLibrary, ExtendedMeaning, User, AuthUser, AdminTab） | 无 |
| `src/config/api.ts` | API 配置常量（BASE_URL, TOKEN_KEY 等） | 无 |

### Layer 1：工具层（仅依赖 Layer 0）

| 文件 | 说明 | 依赖 |
|------|------|------|
| `src/utils/request.ts` | HTTP 客户端（uni.request 封装 + Token 拦截器 + 401 跳转 + ApiRequestError） | Layer 0: types, config |
| `src/utils/adapters.ts` | Backend-Frontend 适配器（8 函数 1:1 移植） | Layer 0: types |
| `src/utils/navigation.ts` | 类型化导航函数（9 页面跳转 + navigateBack） | uni API |
| `src/data/mockData.ts` | Mock 数据（fallback，主要数据来自真实 API） | Layer 0: types |

### Layer 2：组合层 — Store + Composables + 共享组件（依赖 Layer 1）

| 文件 | 说明 | 依赖 |
|------|------|------|
| `src/stores/auth.ts` | Pinia store（user / token state + actions） | Layer 1: request（TOKEN_KEY 常量） |
| `src/composables/useAuth.ts` | useAuth composable（封装 store 访问 + 导出 token 工具函数） | stores/auth |
| `src/composables/useInputFocus.ts` | 输入框 focus / blur 状态 composable | 无 |
| `src/components/Icon.vue` | iconfont 图标组件（21 图标 -> unicode 映射） | 静态资源 `static/fonts/iconfont.ttf` |
| `src/components/PrimaryBtn.vue` | 通用按钮（3 变体：primary / outline / danger） | Layer 0: types（变体类型） |
| `src/components/PageHeader.vue` | 页面头部（back / title / subtitle / right slot / sticky / compact / bgColor） | Icon |
| `src/components/PhysicalImage.vue` | 9 种物理意象 SVG 插画 | 无（纯 SVG template） |
| `src/components/CustomTabBar.vue` | H5 自绘 TabBar（条件编译） | Icon |

### Layer 3：叶子页面（仅依赖 Layer 2，无子路由）

| 文件 | 说明 | 源 | 依赖 |
|------|------|------|------|
| `src/pages/home/home.vue` | 首页（搜索 + 今日一词 + 全部词汇） | pages/home | API(words/wordbanks/daily-word) + Icon + PrimaryBtn + CustomTabBar |
| `src/pages/word-detail/word-detail.vue` | 单词详情（物理意象 + 引申义 + 搭配 + 收藏） | pages/word-detail | API(words/wordbanks/favorites/learning) + PhysicalImage + PageHeader + Icon + CustomTabBar |
| `src/pages/library-words/library-words.vue` | 词库单词列表 | pages/library-words | API(wordbanks/words) + PageHeader + Icon + CustomTabBar |

### Layer 4：组合页面（依赖 Layer 3 或路由跳转）

| 文件 | 说明 | 源 | 依赖 |
|------|------|------|------|
| `src/pages/libraries/libraries.vue` | 词库列表（4 色渐变卡片） | pages/libraries | API(wordbanks/words) + PageHeader + Icon + CustomTabBar |
| `src/pages/profile/profile.vue` | 个人中心（用户卡片 / 管理入口 / 收藏子视图 / 退出） | pages/profile | useAuth + API(users/learning/favorites) + PageHeader + Icon + PrimaryBtn + CustomTabBar |
| `src/pages/auth/auth.vue` | 认证页（登录 / 注册 Tab + 表单校验） | pages/auth | useAuth + API(auth) + Icon + PrimaryBtn |
| `src/pages/admin/admin.vue` | 管理后台（4 面板：概览 / 词库CRUD / 单词CRUD+AI / 用户） | pages/admin | API(12+) + useAuth + PhysicalImage + Icon + PrimaryBtn + uni-ui Picker |

### Layer 5：应用入口

| 文件 | 说明 | 依赖 |
|------|------|------|
| `src/App.vue` | 根组件（`@font-face` iconfont 引入 + Pinia 初始化 + 全局样式） | 所有页面 + stores/auth |
| `src/main.ts` | 应用入口（`createApp` + `createPinia` + `uni-ui` 注册） | App.vue + stores + uni-ui |

### Layer 6：构建与配置（独立于所有代码，可随时创建）

| 文件 | 说明 |
|------|------|
| `index.html` | H5 入口 HTML（Google Fonts + viewport meta） |
| `package.json` | 依赖管理（uni-app, Vue 3, Pinia, uni-ui, Vite, TypeScript, Formily） |
| `vite.config.ts` | Vite 构建配置（uni-app Vite 插件 + proxy 配置） |
| `tsconfig.json` | TypeScript 配置 |
| `src/pages.json` | uni-app 页面路由 + 小程序原生 tabBar 配置 + 全局样式 / 窗口 |
| `src/manifest.json` | uni-app 应用配置（AppID、权限、平台设置） |
| `src/uni.scss` | 全局 SCSS 变量（本报告产出 2） |
| `src/shims-vue.d.ts` | Vue SFC 类型声明 |

### 拓扑图（箭头 = "被依赖"）

```
Layer 0:  types/index.ts  <------------------------------------------+
          config/api.ts                                               |
              |                                                       |
              v                                                       |
Layer 1:  utils/request.ts ---+                                      |
          utils/adapters.ts   |                                      |
          utils/navigation.ts |                                      |
          data/mockData.ts    |                                      |
              |               |                                      |
              v               v                                      |
Layer 2:  stores/auth.ts <--- utils/request (TOKEN_KEY constant)     |
          composables/useAuth.ts                                     |
          composables/useInputFocus.ts                               |
          components/Icon.vue                                        |
          components/PrimaryBtn.vue                                  |
          components/PageHeader.vue                                  |
          components/PhysicalImage.vue                               |
          components/CustomTabBar.vue                                |
              |                                                       |
              v                                                       |
Layer 3:  pages/home/home.vue --------------------------------------+
          pages/word-detail/word-detail.vue                          |
          pages/library-words/library-words.vue                      |
              |                                                       |
              v                                                       |
Layer 4:  pages/libraries/libraries.vue                              |
          pages/profile/profile.vue                                  |
          pages/auth/auth.vue                                        |
          pages/admin/admin.vue                                      |
              |                                                       |
              v                                                       |
Layer 5:  App.vue <--------------------------------------------------+
          main.ts
              |
              v
Layer 6:  index.html, package.json, vite.config.ts, tsconfig.json,
          src/pages.json, src/manifest.json, src/uni.scss, src/shims-vue.d.ts
```

---

## 附录 A：文件映射总表

| 源文件（client/src/） | 目标文件（client-uni/src/） | 类型 | 变更 |
|----------------------|---------------------------|------|------|
| `data/types.ts` | `types/index.ts` | 1:1 移植 | 零变更 |
| `api/request.ts` | `utils/request.ts` | 适配 | Taro.request -> uni.request；localStorage -> uni.storage |
| `api/adapters.ts` | `utils/adapters.ts` | 1:1 移植 | 零变更 |
| `hooks/useNavigate.ts` | `utils/navigation.ts` | 适配 | Taro.navigateTo -> uni.navigateTo |
| `hooks/useAuth.ts` | `stores/auth.ts` + `composables/useAuth.ts` | 重构 | 全局单例 -> Pinia store + composable |
| `data/mockData.ts` | `data/mockData.ts` | 1:1 移植 | 零变更 |
| `api/auth.ts` | `api/auth.ts` | 1:1 移植 | 零变更 |
| `api/words.ts` | `api/words.ts` | 1:1 移植 | 零变更 |
| `api/wordbanks.ts` | `api/wordbanks.ts` | 1:1 移植 | 零变更 |
| `api/favorites.ts` | `api/favorites.ts` | 1:1 移植 | 零变更 |
| `api/learning.ts` | `api/learning.ts` | 1:1 移植 | 零变更 |
| `api/ai.ts` | `api/ai.ts` | 适配 | generateWordStream 条件编译 |
| `api/daily-word.ts` | `api/daily-word.ts` | 1:1 移植 | 零变更 |
| `api/dashboard.ts` | `api/dashboard.ts` | 1:1 移植 | 零变更 |
| `api/users.ts` | `api/users.ts` | 1:1 移植 | 零变更 |
| `api/index.ts` | `api/index.ts` | 1:1 移植 | 零变更 |
| `components/Icon.tsx` | `components/Icon.vue` | 重构 | JSX -> Vue template + iconfont unicode |
| `components/PrimaryBtn.tsx` | `components/PrimaryBtn.vue` | 重构 | JSX -> Vue template（inline style -> class） |
| `components/PageHeader.tsx` | `components/PageHeader.vue` | 重构 | JSX -> Vue template + 条件编译 backdrop-filter |
| `components/PhysicalImage.tsx` | `components/PhysicalImage.vue` | 重构 | JSX -> Vue template（内联 SVG 1:1） |
| `components/CustomTabBar/index.tsx` | `components/CustomTabBar.vue` | 重构 | 条件编译：H5 自绘 TabBar，小程序用 pages.json |
| `pages/home/index.tsx` | `pages/home/home.vue` | 重构 | React class -> Vue SFC + composable |
| `pages/libraries/index.tsx` | `pages/libraries/libraries.vue` | 重构 | React class -> Vue SFC + composable |
| `pages/library-words/index.tsx` | `pages/library-words/library-words.vue` | 重构 | React class -> Vue SFC + composable |
| `pages/word-detail/index.tsx` | `pages/word-detail/word-detail.vue` | 重构 | React class -> Vue SFC + composable |
| `pages/profile/index.tsx` | `pages/profile/profile.vue` | 重构 | React class -> Vue SFC + composable |
| `pages/auth/index.tsx` | `pages/auth/auth.vue` | 重构 | React class -> Vue SFC + composable |
| `pages/admin/index.tsx` | `pages/admin/admin.vue` | 重构 | React class -> Vue SFC + composable |
| `app.tsx` | `App.vue` + `main.ts` | 重构 | Taro App -> uni-app createApp |
| `app.config.ts` | `pages.json` + `manifest.json` | 重构 | Taro 配置 -> uni-app 配置 |

---

## 附录 B：关键迁移注意事项

1. **100% inline style -> CSS class**：所有 React inline style 对象需提取为 SCSS class，使用 uni.scss 变量。这是最大工作量项。
2. **CustomTabBar 条件编译**：需准备 6 张小程序原生 tabBar 图标 PNG（24x24 3 对：搜索 / 词库 / 我的 - 常规态 / 激活态）。
3. **Icon `star` bug 修复**：需在 iconfont 生成列表中加入 `star` 图标（Unicode 编码 u+E80A 范围）。
4. **Input line-height**：所有输入框在目标中强制添加 `line-height: 1.5`（源项目遗漏，高风险项）。
5. **uni.request 返回值格式**：`uni.request` 在 callback 模式下参数顺序不同，需在 `request.ts` 中统一处理为 Promise。
6. **Admin Picker 适配**：2 个 Picker（词库选择器 / 词性选择器）使用 `#ifdef H5` -> `<select>` + `#ifdef MP` -> `<picker mode="selector">`。
7. **SSE 流式降级**：小程序端 AI 生成不能使用流式，需降级为非流式 `generateWord()` 一次性返回。
