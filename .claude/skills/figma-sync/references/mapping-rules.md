# Figma React ↔ uni-app Vue 3 技术映射速查表

> 已验证映射（来源：2026-07 english-dictionary 项目 react→uniapp 迁移实战 +
> Figma 增量同步实战）。新迁移直接使用此表，不重新推导。

---

## 1. 组件模型

| Figma (React) | 目标 (uni-app Vue 3) | 示例 |
|---------------|---------------------|------|
| `export function Foo({ a, b }: Props)` | `<script setup lang="ts">` + `defineProps<{ a, b }>()` | |
| `interface FooProps { ... }` | `defineProps<{ ... }>()`（内联类型） | |
| `children` prop | `<slot />` 默认插槽 | |
| 条件渲染: `{cond && <X/>}` | `v-if="cond"` | |
| 列表渲染: `{arr.map(x => <X/>)}` | `v-for="x in arr" :key="x.id"` | |
| React Fragment `<>...</>` | `<template>` 或直接省略（Vue 支持多根节点） | |
| `useState` | `ref()` | `const [v,setV]=useState(0)` → `const v=ref(0)` |
| `useEffect(()=>{...}, [])` | `onLoad`（uni 页面）或 `onMounted`（组件） | |

---

## 2. 样式映射

| Figma (inline style) | 目标 (scoped SCSS) | 说明 |
|---------------------|-------------------|------|
| `style={{ padding: '16px' }}` | `padding: 32rpx;` | **px × 2 = rpx**（1px = 2rpx） |
| `style={{ fontSize: '14px' }}` | `font-size: 28rpx;` | |
| `style={{ borderRadius: '24px' }}` | `border-radius: 48rpx;` | |
| `style={{ background: 'rgba(247,249,252,0.94)' }}` | `background: rgba(247, 249, 252, 0.94);` | 颜色值不换算 |
| `style={{ backdropFilter: 'blur(16px)' }}` | `/* #ifdef H5 */ backdrop-filter: blur(32rpx); -webkit-backdrop-filter: blur(32rpx); /* #endif */` | 必须 H5 条件编译 |
| `style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}` | `box-shadow: 0 8rpx 48rpx rgba(0, 0, 0, 0.07);` | 所有数值 ×2 |
| `style={{ display: 'flex', flexDirection: 'column' }}` | `display: flex; flex-direction: column;` | |
| `style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}` | `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` | |
| `style={{ cursor: 'pointer' }}` | `/* #ifdef H5 */ cursor: pointer; /* #endif */` | 必须 H5 条件编译 |
| `style={{ transition: 'all 0.2s' }}` | `/* #ifdef H5 */ transition: all 0.2s; /* #endif */` | 必须 H5 条件编译 |
| `style={{ fontFamily: 'Inter, ...' }}` | 不写在组件 SCSS 中，由 `App.vue` 全局设置 | |
| `onFocus={e => e.target.style.borderColor = '#2563EB'}` | `:class="{ 'xxx--focused': isFocused }"` + `@focus="isFocused = true"` | 使用 Vue 响应式 class 而非命令式 DOM |

### 注释格式

每个 CSS 属性值必须附带源追溯注释：
```scss
padding: 104rpx 48rpx 32rpx; /* Phase1(src): FavoritesView.tsx:19 — 52px 24px 16px → rpx×2 */
```

---

## 3. 图标映射

| Figma (lucide-react) | 目标 |
|---------------------|------|
| `<ArrowLeft size={18} />` | `<view class="css-arrow-left" />`（CSS 绘制） |
| `<ArrowRight size={16} />` | `<view class="css-arrow" />`（CSS 绘制） |
| `<ChevronRight size={16} />` | 同上 `.css-arrow` |
| `<Bookmark size={20} fill={...} />` | 内联 SVG 组件（`components/icons/BookmarkIcon.vue`） |
| `<Heart size={14} fill={...} />` | 内联 SVG（Heart path: `M20.84 4.61a5.5...`） |
| `<Search size={18} />` | PNG 图片 `/static/images/tab-home.png` |
| `<BookOpen size={18} />` | PNG 图片 `/static/images/browse.png` |
| `<User size={36} />` | iconfont `&#xe004;` 或 PNG `/static/images/user.png` |
| `<FileText size={14} />` | PNG 图片 `/static/images/file.png` |
| `<Trash2 size={13} />` | PNG 图片 `/static/images/ashbin.png` |
| `<Settings size={16} />` | PNG 图片 `/static/images/setting.png` |
| `<Sparkles size={14} />` | iconfont 或省略（仅装饰性） |

### SVG 组件创建规则

当 Figma 源中使用 `lucide-react` 图标，且项目中 ≥2 处使用同一图标时：
1. 从 lucide-react 源提取 SVG path 数据
2. 创建 `components/icons/<IconName>.vue`
3. Props: `size`, `filled`, `strokeColor`, `filledColor`, `strokeWidth`（带默认值）
4. SVG 属性使用 Vue 响应式绑定

---

## 4. 路由映射

| Figma (ViewState) | 目标 (uni-app) |
|------------------|---------------|
| `{ name: 'home' }` | `pages/home/home`（tabBar 页面） |
| `{ name: 'wordDetail', wordId }` | `pages/word-detail/word-detail?wordId=${wordId}` |
| `{ name: 'libraries' }` | `pages/libraries/libraries`（tabBar 页面） |
| `{ name: 'libraryWords', libraryId }` | `pages/library-words/library-words?libraryId=${libraryId}` |
| `{ name: 'profile' }` | `pages/profile/profile`（tabBar 页面） |
| `{ name: 'login' }` / `'register'` | `pages/auth/auth?mode=login` / `?mode=register` |
| `{ name: 'notes' }` | `pages/notes/notes` |
| `{ name: 'favorites' }` | `pages/favorites/favorites` |
| `{ name: 'admin', tab }` | `pages/admin/${tab}` |
| `navigate(view)` | `uni.navigateTo({ url })` |
| `navigate({ name: 'home' })` | `uni.switchTab({ url: '/pages/home/home' })`（tabBar 页面用 switchTab） |
| 返回上一页 | `uni.navigateBack()` |

### 路由注册

每个新页面必须在 `client/src/pages.json` `pages` 数组中注册：
```json
{
  "path": "pages/<name>/<name>",
  "style": { "navigationBarTitleText": "", "navigationStyle": "custom" }
}
```

---

## 5. 状态管理映射

| Figma (App.tsx useState) | 目标 |
|-------------------------|------|
| `const [user, setUser] = useState<AuthUser \| null>(null)` | `store/user.ts` — `reactive({ user: null })` |
| `const [notes, setNotes] = useState<Note[]>(mockNotes)` | API 驱动 — `onShow` 中调用 `fetchPublicNotesByWord()` |
| `const [favorites, setFavorites] = useState<string[]>([])` | API 驱动 — `fetchFavorites()` + `favoriteWord()`/`unfavoriteWord()` |
| `handleLogin(u)` / `handleLogout()` | `store/user.ts` — `login()` / `logout()` |
| `handleSaveNote(note)` | 页面本地函数 + `createNote()` API |
| `handleToggleLike(noteId)` | 页面本地函数 + `toggleLikeNote()` API + 乐观更新 |
| `handleToggleFavorite(wordId)` | 页面本地函数 + `favoriteWord()`/`unfavoriteWord()` API |

**状态归属原则**：
- 多页面共享状态（user）→ `store/`
- 仅本页面使用的状态（noteInput、noteTab）→ 页面级 `ref()`
- 跨页面同步的数据（收藏、笔记）→ 通过 API 重新获取而非全局缓存

---

## 6. 数据获取映射

| Figma (mockData) | 目标 (API) |
|-----------------|-----------|
| `mockWords.find(w => w.id === wordId)` | `fetchWordDetail(wordId)` → `WordDetail` |
| `mockWords.filter(w => w.libraryId === lib.id)` | `fetchWordsByWordbank(libraryId)` |
| `mockLibraries` | `fetchWordbanks()` |
| `mockNotes.filter(n => n.wordId === wordId)` | `fetchPublicNotesByWord(wordId)` |
| `mockUsers` (mock 登录) | `apiLogin(phone, password)` → JWT |
| `favorites.map(id => mockWords.find(...))` | `fetchFavorites({ pageSize })` → `Word[]` |

### API 模块与适配器

- 所有 API 调用经过 `client/src/api/request.ts`（JWT 注入 + 401 拦截）
- 后端响应字段（snake_case）→ `client/src/api/adapters.ts` → 前端类型（camelCase）
- 新增 API 函数后，在 `client/src/api/index.ts` 中注册导出

---

## 7. 事件映射

| Figma (React) | 目标 (Vue) |
|---------------|-----------|
| `onClick={handler}` | `@click="handler"` |
| `onClick={(e) => { e.stopPropagation(); handler(); }}` | `@click.stop="handler"` |
| `onChange={e => setV(e.target.value)}` | `v-model="v"`（input）或 `@change`（select） |
| `onFocus={e => ...}` / `onBlur={e => ...}` | `@focus` / `@blur` + 响应式 class 切换 |
| `onKeyDown={e => e.key === 'Enter' && handler()}` | `@keydown.enter="handler"`（H5 可用） |
| `onSubmit` (表单) | `@submit.prevent="handler"` |

---

## 8. 条件渲染安全性

| 检查项 | 规则 |
|--------|------|
| 未登录状态 | `v-if="!userStore.user"` 检查，而非 `v-if="user"` |
| 管理员 vs 普通用户 | `userStore.user?.role === 'admin'` |
| API 加载中 | `v-if="loading"` + `<text>加载中...</text>` |
| API 空数据 | `v-else-if="list.length === 0"` + `<EmptyState>` |
| API 错误 | `try/catch` + `uni.showToast`（生产环境不静默吞错） |

---

## 9. 文件命名的命名规范

| Figma 源文件 | 目标文件 |
|-------------|---------|
| `HomeView.tsx` | `pages/home/home.vue` |
| `WordDetailView.tsx` | `pages/word-detail/word-detail.vue` |
| `LibrariesView.tsx` + `LibraryWordsView` | `pages/libraries/libraries.vue` + `pages/library-words/library-words.vue` |
| `ProfileView.tsx` | `pages/profile/profile.vue` |
| `AuthView.tsx` | `pages/auth/auth.vue` |
| `NotesView.tsx` | `pages/notes/notes.vue` |
| `FavoritesView.tsx` | `pages/favorites/favorites.vue` |
| `AdminView.tsx` | `pages/admin/overview.vue` + `pages/admin/libraries.vue` + `...` |
| `BottomNav.tsx` | `pages.json` tabBar 配置（uni 原生） |
| `app/data/types.ts` | `client/src/data/types.ts` |

### 组件导入路径

```typescript
// 共享组件（components/）
import WordCard from "@/components/WordCard.vue";
import EmptyState from "@/components/EmptyState.vue";
import PageHeader from "@/components/PageHeader.vue";

// 图标组件（components/icons/）
import BookmarkIcon from "@/components/icons/BookmarkIcon.vue";

// API 函数（api/）
import { fetchFavorites } from "@/api";

// 工具函数（utils/）
import { TOAST } from "@/utils/helpers";

// 状态管理（store/）
import { userStore } from "@/store/user";
```
