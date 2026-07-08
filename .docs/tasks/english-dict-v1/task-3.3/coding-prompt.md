# Coding Prompt — Task 3.3: 前端数据层集成

> 生成日期：2026-07-08

---

## 1. 任务目标

将前端所有页面中的 `mockData.ts` 导入替换为真实后端 API 调用，包括用户端页面（首页、单词详情、词库列表、词库下单词）和管理后台（词库/单词 CRUD、数据概览），同时增加 loading / error / empty 状态处理。

---

## 2. 技术上下文

- **语言/框架**: TypeScript 5.1 + React 18.2 (Hooks) + Taro 3.6.23
- **已有基础设施**:
  - `client/src/api/request.ts` — 通用请求封装（`request<T>(path, options)`），自动注入 Bearer Token，401 全局拦截
  - `client/src/api/auth.ts` — 认证 API（login、register）
  - `client/src/api/index.ts` — 统一导出
  - `client/src/hooks/useAuth.ts` — 全局认证状态（getGlobalUser、logout）
  - `client/src/data/types.ts` — 前端类型定义（Word、WordLibrary、ExtendedMeaning 等）
- **后端 API 基路径**: `/api/v1`（开发环境通过 Taro devServer proxy 代理，生产环境同域部署）
- **后端响应格式**:
  - 列表接口：`{ data: T[], pagination: { page, pageSize, total, totalPages } }`
  - 详情接口：直接返回对象
  - 创建：`201` + 对象
  - 更新：对象
  - 删除：`{ message: "..." }`
  - 错误：`{ error: { code: string, message: string } }`（已由 `request.ts` 包装为 `ApiRequestError`）

### 后端 ⇔ 前端字段名对照表

后端 Mongoose 模型使用 camelCase，但与前端 mock 类型字段名不同，需要适配：

| 后端字段 (Word) | 前端字段 (Word) | 说明 |
|-----------------|-----------------|------|
| `_id` | `id` | MongoDB ObjectId → string |
| `wordbankId` | `libraryId` | 所属词库 ID |
| `coreExampleEn` | `coreExampleSentence` | 核心义英文例句 |
| `coreExampleZh` | `coreExampleTranslation` | 核心义中文翻译 |
| `physicalImageType` | `coreImageType` | 物理意象类型 |
| — | (后端无此字段) | 前端 `physicalImageDescription` 可选保留 |

| 后端字段 (ExtendedMeaning) | 前端字段 (ExtendedMeaning) |
|---------------------------|---------------------------|
| `_id` | `id` |
| `evolutionDescription` | `logicalEvolution` |
| `exampleEn` | `exampleSentence` |
| `exampleZh` | `exampleTranslation` |

| 后端字段 (WordBank) | 前端字段 (WordLibrary) | 说明 |
|---------------------|----------------------|------|
| `_id` | `id` | MongoDB ObjectId → string |
| — | `wordCount` | 后端控制器动态计算，不在 Model 中 |
| `is_public` | — | 前端暂不展示，但 admin 需了解 |
| `slug` | — | 前端暂不使用 |
| `gradient` | — | 前端暂使用本地颜色数组 |

### 涉及文件一览

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| **新建** | `client/src/api/words.ts` | 单词 API 模块 |
| **新建** | `client/src/api/wordbanks.ts` | 词库 API 模块 |
| **新建** | `client/src/api/users.ts` | 用户 API 模块 |
| **新建** | `client/src/api/adapters.ts` | 后端→前端字段适配器 |
| **修改** | `client/src/api/index.ts` | 导出新 API 模块 |
| **修改** | `client/src/pages/home/index.tsx` | 替换 mock，接入 API |
| **修改** | `client/src/pages/word-detail/index.tsx` | 替换 mock，接入 API |
| **修改** | `client/src/pages/libraries/index.tsx` | 替换 mock，接入 API |
| **修改** | `client/src/pages/library-words/index.tsx` | 替换 mock，接入 API |
| **修改** | `client/src/pages/admin/index.tsx` | 替换 mock，接入 API（最大改动） |

---

## 3. 实现要求

### 3.1 新建 `client/src/api/adapters.ts` — 数据适配器

**职责**: 将后端 API 响应格式转换为前端 `types.ts` 中的类型，确保页面 UI 代码无需修改字段名。

```typescript
// 函数签名
function adaptWord(backendWord: BackendWord): Word
function adaptWordList(response: { data: BackendWord[]; pagination: BackendPagination }): { words: Word[]; total: number }
function adaptWordbank(backendWordbank: BackendWordbank, wordCount?: number): WordLibrary
function adaptWordbankList(response: { data: BackendWordbank[]; pagination: BackendPagination }): { libraries: WordLibrary[]; total: number }
function adaptUser(backendUser: BackendUser): User
```

**关键逻辑**:
1. `adaptWord`: 将 `_id` → `id`（转字符串），`wordbankId` → `libraryId`（转字符串），`coreExampleEn` → `coreExampleSentence`，`coreExampleZh` → `coreExampleTranslation`，`physicalImageType` → `coreImageType`；遍历 `extendedMeanings` 做同映射；`collocations` 直接透传
2. `adaptWordList`: 对 `response.data` 中每个元素调 `adaptWord`，返回 `{ words, total }`（total 来自 `response.pagination.total`）
3. `adaptWordbank`: `_id` → `id`，`wordCount` 参数默认 0
4. `adaptWordbankList`: 对每个元素调 `adaptWordbank`（不带 wordCount），返回 `{ libraries, total }`
5. `adaptUser`: `_id` → `id`，添加 `joinedAt`（从 `createdAt`）、`learnedWords`（从 `learnedWords.length`）

**注意事项**:
- `_id` 在后端可能是对象或字符串（Mongoose JSON 序列化后为字符串），统一用 `String()` 包裹
- `wordbankId` 同样用 `String()` 包裹

---

### 3.2 新建 `client/src/api/words.ts` — 单词 API 模块

**参考已有模式**: `client/src/api/auth.ts`（使用 `request<T>()` 泛型函数）

**函数列表**:

```typescript
import { request } from './request';
import type { Word } from '../data/types';
import { adaptWord, adaptWordList } from './adapters';

// 单词列表 / 搜索
// GET /api/v1/words?page=1&pageSize=20&q=keyword&wordbank_id=xxx
export async function fetchWords(params: {
  page?: number;
  pageSize?: number;
  q?: string;
  wordbankId?: string;
}): Promise<{ words: Word[]; total: number }>

// 单词详情
// GET /api/v1/words/:id
export async function fetchWordById(id: string): Promise<Word>

// 新增单词（admin）
// POST /api/v1/words
export async function createWord(data: CreateWordInput): Promise<Word>

// 编辑单词（admin）
// PUT /api/v1/words/:id
export async function updateWord(id: string, data: UpdateWordInput): Promise<Word>

// 删除单词（admin）
// DELETE /api/v1/words/:id
export async function deleteWord(id: string): Promise<void>
```

**关键逻辑**:
1. `fetchWords`: 将 params 转为 query string → `request<BackendListResponse>` → `adaptWordList`
2. `fetchWordById`: `request<BackendWord>` → `adaptWord`
3. `createWord`: `request<BackendWord>` (POST) → `adaptWord`
4. `updateWord`: `request<BackendWord>` (PUT) → `adaptWord`
5. `deleteWord`: `request<{message: string}>` (DELETE)，不返回数据

**CreateWordInput / UpdateWordInput 类型定义**（在本文件中定义）:
- `CreateWordInput`: word (必填), wordbankId (必填), phonetic, coreMeaning, coreExampleEn, coreExampleZh, physicalImageType, physicalImageDescription, extendedMeanings (数组), collocations (字符串数组)
- `UpdateWordInput`: 所有字段可选（Partial 语义）

---

### 3.3 新建 `client/src/api/wordbanks.ts` — 词库 API 模块

```typescript
import { request } from './request';
import type { WordLibrary, Word } from '../data/types';
import { adaptWordbank, adaptWordbankList, adaptWordList } from './adapters';

// 词库列表
// GET /api/v1/wordbanks?page=1&pageSize=20
export async function fetchWordbanks(params?: { page?: number; pageSize?: number }): Promise<{ libraries: WordLibrary[]; total: number }>

// 词库详情
// GET /api/v1/wordbanks/:id  响应含 wordCount
export async function fetchWordbankById(id: string): Promise<WordLibrary>

// 词库下单词列表
// GET /api/v1/wordbanks/:id/words?page=1&pageSize=20
export async function fetchWordsByWordbank(id: string, params?: { page?: number; pageSize?: number }): Promise<{ words: Word[]; total: number }>

// 新增词库（admin）
// POST /api/v1/wordbanks  body: { name, description }
export async function createWordbank(data: { name: string; description?: string }): Promise<WordLibrary>

// 编辑词库（admin）
// PUT /api/v1/wordbanks/:id
export async function updateWordbank(id: string, data: { name?: string; description?: string }): Promise<WordLibrary>

// 删除词库（admin）
// DELETE /api/v1/wordbanks/:id
export async function deleteWordbank(id: string): Promise<void>
```

**关键逻辑**:
1. `fetchWordbankById`: 响应的 `wordCount` 由后端控制器动态注入 → 在适配时传入 `adaptWordbank(backendWordbank, backendWordbank.wordCount)`
2. `fetchWordsByWordbank`: 复用 `adaptWordList`

---

### 3.4 新建 `client/src/api/users.ts` — 用户 API 模块

```typescript
import { request } from './request';
import type { User } from '../data/types';
import { adaptUser } from './adapters';

// 用户列表（admin）
// GET /api/v1/users（注：后端目前仅有 GET /api/v1/users/me，
// 若 admin 用户列表接口尚未实现，则此函数暂时返回空数组并在调用方标注 TODO）
export async function fetchUsers(): Promise<User[]>

// 当前用户信息
// GET /api/v1/users/me
export async function fetchCurrentUser(): Promise<User>
```

**关键逻辑**:
1. `fetchUsers`: 若后端暂无 admin 用户列表路由，函数体返回 `[]` 并在注释中标注 `TODO: 待后端实现 GET /api/v1/users (admin)`
2. `fetchCurrentUser`: 调用 `GET /api/v1/users/me`，用 `adaptUser` 转换

---

### 3.5 修改 `client/src/api/index.ts` — 统一导出

在现有导出基础上，增加导出 words、wordbanks、users、adapters 模块的所有公开函数和类型。

```typescript
// 在现有代码后追加:
export * from './words';
export * from './wordbanks';
export * from './users';
export * from './adapters';
```

---

### 3.6 修改 `client/src/pages/home/index.tsx` — 首页 API 接入

**当前状态**: 导入 `mockWords`、`mockLibraries`，在组件内做客户端搜索和 "今日一词" 计算

**修改内容**:

1. **删除 import**: 移除 `import { mockWords, mockLibraries } from "../../data/mockData"`
2. **新增 import**: `import { fetchWords, fetchWordbanks } from "../../api"` 和 `import { useState, useEffect } from "react"`（useState 已在用，useEffect 需新增）
3. **新增状态**:
   ```typescript
   const [allWords, setAllWords] = useState<Word[]>([]);
   const [todayWord, setTodayWord] = useState<Word | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   ```
4. **新增 useEffect**（页面加载时获取数据）:
   ```typescript
   useEffect(() => {
     loadData();
   }, []);

   const loadData = async () => {
     setLoading(true);
     setError(null);
     try {
       const result = await fetchWords({ pageSize: 100 });
       setAllWords(result.words);
       // 今日一词：随机取一个单词
       if (result.words.length > 0) {
         const idx = Math.floor(Date.now() / 86400000) % result.words.length;
         setTodayWord(result.words[idx]);
       }
     } catch (e) {
       setError(e instanceof Error ? e.message : '加载失败');
     } finally {
       setLoading(false);
     }
   };
   ```
5. **搜索逻辑改造**: 移除客户端 `mockWords.filter`，改为调用 `fetchWords({ q: query })`。使用防抖（300ms `setTimeout`）减少请求频率：
   ```typescript
   const [searchResults, setSearchResults] = useState<Word[]>([]);
   const [searchLoading, setSearchLoading] = useState(false);
   
   useEffect(() => {
     if (!query.trim()) {
       setSearchResults([]);
       return;
     }
     const timer = setTimeout(async () => {
       setSearchLoading(true);
       try {
         const result = await fetchWords({ q: query.trim(), pageSize: 20 });
         setSearchResults(result.words);
       } catch { /* 静默处理，搜索失败不算严重错误 */ }
       finally { setSearchLoading(false); }
     }, 300);
     return () => clearTimeout(timer);
   }, [query]);
   ```
6. **UI 改造**:
   - **Loading 态**: 当 `loading` 为 true 时，在"今日一词"和"全部词汇"区域显示简易加载指示器（文字 + 旋转图标，Taro 小程序兼容。不引入新依赖库）
   - **Error 态**: 当 `error` 不为 null 时，显示错误提示 + "重试"按钮（点击触发 `loadData()`）
   - **Empty 态**: 现有的"未找到相关单词"逻辑保留，适配新数据源
   - **非搜索状态**: `allWords.map()` 替换原来的 `mockWords.map()`；词库名称需要在获取时关联 — 调用 `fetchWordbanks()` 获取词库列表用于展示词库标签
7. **"全部词汇"词库标签**: 需要在获取 words 的同时获取 wordbanks，通过 `libraryId` 匹配展示词库名。代码模式：
   ```typescript
   const lib = libraries.find(l => l.id === word.libraryId);
   ```

---

### 3.7 修改 `client/src/pages/word-detail/index.tsx` — 单词详情 API 接入

**当前状态**: `mockWords.find(w => w.id === wordId)` + `mockLibraries.find(l => l.id === word.libraryId)`

**修改内容**:

1. **删除 import**: `mockWords`、`mockLibraries`
2. **新增 import**: `fetchWordById`、`fetchWordbanks`
3. **新增状态**:
   ```typescript
   const [word, setWord] = useState<Word | null>(null);
   const [library, setLibrary] = useState<WordLibrary | null>(null);
   const [loading, setLoading] = useState(true);
   const [notFound, setNotFound] = useState(false);
   const [error, setError] = useState<string | null>(null);
   ```
4. **新增 useEffect**:
   ```typescript
   useEffect(() => {
     if (!wordId) return;
     loadWord();
   }, [wordId]);

   const loadWord = async () => {
     setLoading(true);
     setError(null);
     setNotFound(false);
     try {
       const w = await fetchWordById(wordId);
       setWord(w);
       // 获取词库名
       const { libraries } = await fetchWordbanks({ pageSize: 100 });
       setLibrary(libraries.find(l => l.id === w.libraryId) || null);
     } catch (e) {
       if (e instanceof ApiRequestError && e.statusCode === 404) {
         setNotFound(true);
       } else {
         setError(e instanceof Error ? e.message : '加载失败');
       }
     } finally {
       setLoading(false);
     }
   };
   ```
5. **UI 改造**:
   - **Loading 态**: `loading === true` → 显示加载指示器
   - **404 态**: `notFound === true` → 显示"单词不存在"+ "返回首页"
   - **Error 态**: `error !== null` → 显示错误提示 + 重试按钮
   - **正常展示**: 保持现有 UI 结构完全不变（字段名一致，都是前端类型）
6. **保留**: `PhysicalImage` 组件调用保持不变（`word.coreImageType` 映射自 `physicalImageType`）

---

### 3.8 修改 `client/src/pages/libraries/index.tsx` — 词库列表 API 接入

**当前状态**: 导入 `mockLibraries`、`mockWords`，用本地颜色数组

**修改内容**:

1. **删除 import**: `mockLibraries`、`mockWords`
2. **新增 import**: `fetchWordbanks`、`fetchWords`
3. **新增状态**:
   ```typescript
   const [libraries, setLibraries] = useState<WordLibrary[]>([]);
   const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   ```
4. **新增 useEffect**:
   ```typescript
   const loadData = async () => {
     setLoading(true);
     setError(null);
     try {
       const [libResult, wordResult] = await Promise.all([
         fetchWordbanks({ pageSize: 100 }),
         fetchWords({ pageSize: 999 }), // 用于统计每个词库的单词数
       ]);
       setLibraries(libResult.libraries);
       // 统计每个词库的单词数
       const counts: Record<string, number> = {};
       wordResult.words.forEach(w => {
         counts[w.libraryId] = (counts[w.libraryId] || 0) + 1;
       });
       setWordCounts(counts);
     } catch (e) {
       setError(e instanceof Error ? e.message : '加载失败');
     } finally {
       setLoading(false);
     }
   };
   ```
5. **UI 改造**:
   - **Loading / Error / Empty**: 同首页模式
   - 卡片中的 `lib.wordCount` → 使用 `wordCounts[lib.id] || 0`（或 fetchWordbankById 逐条获取会更精确，但会增加 N 次请求；用批量统计方式可接受）
   - 颜色数组保持本地（`libraryColors[index % libraryColors.length]`）
   - 点击跳转保持不变（`/pages/library-words/index?libraryId=${lib.id}`）

---

### 3.9 修改 `client/src/pages/library-words/index.tsx` — 词库下单词 API 接入

**当前状态**: `mockLibraries.find()` + `mockWords.filter()`

**修改内容**:

1. **删除 import**: `mockLibraries`、`mockWords`
2. **新增 import**: `fetchWordsByWordbank`、`fetchWordbankById`
3. **新增状态**:
   ```typescript
   const [library, setLibrary] = useState<WordLibrary | null>(null);
   const [words, setWords] = useState<Word[]>([]);
   const [loading, setLoading] = useState(true);
   const [notFound, setNotFound] = useState(false);
   const [error, setError] = useState<string | null>(null);
   ```
4. **新增 useEffect**:
   ```typescript
   useEffect(() => {
     if (!libraryId) return;
     loadData();
   }, [libraryId]);

   const loadData = async () => {
     setLoading(true);
     setError(null);
     setNotFound(false);
     try {
       const [lib, wordResult] = await Promise.all([
         fetchWordbankById(libraryId),
         fetchWordsByWordbank(libraryId, { pageSize: 200 }),
       ]);
       setLibrary(lib);
       setWords(wordResult.words);
     } catch (e) {
       if (e instanceof ApiRequestError && e.statusCode === 404) {
         setNotFound(true);
       } else {
         setError(e instanceof Error ? e.message : '加载失败');
       }
     } finally {
       setLoading(false);
     }
   };
   ```
5. **UI 改造**:
   - **Loading / Error / Empty / 404**: 同 word-detail 模式（404 → "词库不存在"）
   - 单词列表使用 `words.map()` 替代 `mockWords.filter().map()`
   - `PageHeader` 的 title 使用 `library?.name`
   - 单词数显示 `words.length`

---

### 3.10 修改 `client/src/pages/admin/index.tsx` — 管理后台 API 接入（改动最大）

**当前状态**: 本地 useState 管理 `libraries`、`words`，CRUD 操作直接修改本地数组，使用 `mockUsers` 显示用户列表，`AI_GENERATED_TEMPLATES` + `setTimeout` 模拟 AI 生成

**修改策略**:
- 页面初始化时从 API 加载数据
- 每个 CRUD 操作调 API 后刷新列表（或局部更新 state）
- 操作时显示 loading 和 toast 反馈
- AI 生成逻辑保留当前 mock 实现（setTimeout + 本地模板），待 Task 4.1 完整实现时替换

**修改内容**:

#### A. 删除 import
移除 `mockWords as initialWords`、`mockLibraries as initialLibraries`、`mockUsers`、`AI_GENERATED_TEMPLATES`

#### B. 新增 import
```typescript
import {
  fetchWords, fetchWordbanks, fetchUsers,
  createWordbank, updateWordbank, deleteWordbank,
  createWord, updateWord, deleteWord,
} from "../../api";
```

#### C. AdminPage 主组件改造

```typescript
export default function AdminPage() {
  const router = useRouter();
  const initialTab = (router.params.tab as AdminSection) || "overview";

  const [section, setSection] = useState<AdminSection>(initialTab);
  const [libraries, setLibraries] = useState<WordLibrary[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载数据
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [libResult, wordResult, userList] = await Promise.all([
        fetchWordbanks({ pageSize: 100 }),
        fetchWords({ pageSize: 999 }),
        fetchUsers(), // 无 admin 用户列表接口时返回 []
      ]);
      setLibraries(libResult.libraries);
      setWords(wordResult.words);
      setUsers(userList);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);
```

#### D. CRUD 方法改造

```typescript
// 词库 CRUD
const addLib = async (d: Omit<WordLibrary, "id" | "createdAt">) => {
  try {
    await createWordbank({ name: d.name, description: d.description });
    Taro.showToast({ title: "词库已创建", icon: "success" });
    await loadAllData();
  } catch (e) {
    Taro.showToast({ title: e instanceof Error ? e.message : "创建失败", icon: "error" });
  }
};

const editLib = async (id: string, d: Partial<WordLibrary>) => {
  try {
    await updateWordbank(id, { name: d.name, description: d.description });
    Taro.showToast({ title: "词库已更新", icon: "success" });
    await loadAllData();
  } catch (e) {
    Taro.showToast({ title: e instanceof Error ? e.message : "更新失败", icon: "error" });
  }
};

const deleteLib = async (id: string) => {
  try {
    await deleteWordbank(id);
    Taro.showToast({ title: "词库已删除", icon: "success" });
    await loadAllData();
  } catch (e) {
    Taro.showToast({ title: e instanceof Error ? e.message : "删除失败", icon: "error" });
  }
};

// 单词 CRUD（模式同上）
const addWord = async (w: Word) => {
  try {
    await createWord({
      word: w.word, wordbankId: w.libraryId, phonetic: w.phonetic,
      coreMeaning: w.coreMeaning, coreExampleEn: w.coreExampleSentence,
      coreExampleZh: w.coreExampleTranslation, physicalImageType: w.coreImageType,
      physicalImageDescription: "", // 后端必填，前端暂无此字段，传空字符串
      extendedMeanings: w.extendedMeanings.map(em => ({
        evolutionDescription: em.logicalEvolution,
        meaning: em.meaning, partOfSpeech: mapPosToBackend(em.partOfSpeech),
        exampleEn: em.exampleSentence, exampleZh: em.exampleTranslation,
      })),
      collocations: w.collocations,
    });
    Taro.showToast({ title: "单词已创建", icon: "success" });
    await loadAllData();
  } catch (e) {
    Taro.showToast({ title: e instanceof Error ? e.message : "创建失败", icon: "error" });
  }
};

const editWord = async (id: string, w: Word) => {
  try {
    await updateWord(id, {
      word: w.word, wordbankId: w.libraryId, phonetic: w.phonetic,
      coreMeaning: w.coreMeaning, coreExampleEn: w.coreExampleSentence,
      coreExampleZh: w.coreExampleTranslation, physicalImageType: w.coreImageType,
      physicalImageDescription: "",
      extendedMeanings: w.extendedMeanings.map(em => ({
        evolutionDescription: em.logicalEvolution,
        meaning: em.meaning, partOfSpeech: mapPosToBackend(em.partOfSpeech),
        exampleEn: em.exampleSentence, exampleZh: em.exampleTranslation,
      })),
      collocations: w.collocations,
    });
    Taro.showToast({ title: "单词已更新", icon: "success" });
    await loadAllData();
  } catch (e) {
    Taro.showToast({ title: e instanceof Error ? e.message : "更新失败", icon: "error" });
  }
};

const deleteWord = async (id: string) => {
  try {
    await deleteWord(id);
    Taro.showToast({ title: "单词已删除", icon: "success" });
    await loadAllData();
  } catch (e) {
    Taro.showToast({ title: e instanceof Error ? e.message : "删除失败", icon: "error" });
  }
};
```

#### E. 词性映射辅助函数

前端词性：`"n." / "v." / "adj." / "adv." / "v./n." / "adj./adv." / "prep."` 等
后端词性枚举：`"noun" / "verb" / "adj" / "adv" / "prep" / "conj" / "pron" / "other"`

```typescript
// 前端 → 后端词性映射
function mapPosToBackend(frontPos: string): string {
  const map: Record<string, string> = {
    'n.': 'noun', 'v.': 'verb', 'adj.': 'adj', 'adv.': 'adv',
    'prep.': 'prep', 'conj.': 'conj', 'pron.': 'pron',
    'v./n.': 'verb',  // 复合词性简化取主要
    'adj./adv.': 'adj',
  };
  return map[frontPos] || 'other';
}

// 后端 → 前端词性映射（在 adapters.ts 中使用）
function mapPosToFront(backPos: string): string {
  const map: Record<string, string> = {
    'noun': 'n.', 'verb': 'v.', 'adj': 'adj.', 'adv': 'adv.',
    'prep': 'prep.', 'conj': 'conj.', 'pron': 'pron.',
  };
  return map[backPos] || backPos;
}
```

> `mapPosToBackend` 放在 admin 页面（仅 admin CRUD 需要），`mapPosToFront` 放在 adapters.ts（供所有 adapter 使用）。

#### F. 传递给子组件的 props 保持不变

各子组件 (`Overview`, `LibraryManager`, `WordManager`) 的 props 接口不变（仍接收 `WordLibrary[]`, `Word[]` 等前端类型），但 CRUD 回调需要支持 async（父组件状态更新在 API 成功后由 `loadAllData()` 统一刷新）。

**注意**: `LibraryManager` 的 `onAdd`/`onEdit`/`onDelete` 和 `WordManager` 的 `onAdd`/`onEdit`/`onDelete` 回调签名保持不变，但需要在调用处包裹 try/catch + loading 控制。

#### G. Overview 组件

- `users` 数据从 AdminPage 的 `users` state 传入，不再从 `mockUsers` 直接读取
- 统计面板的"词库"/"单词"/"用户"数字使用 `libraries.length` / `words.length` / `users.length`

#### H. AI 生成逻辑（保留 mock）

`generateAIContent` 函数和 `AI_GENERATED_TEMPLATES` 保留在 admin/index.tsx 中（从 mockData.ts 移动硬编码模板到 admin 页面内，或保留 import 仅引用 `AI_GENERATED_TEMPLATES`）。`setTimeout` 模拟延迟保持不变。

#### I. 数据概览 loading / error 态

在主 `AdminPage` 返回前增加判断：
```typescript
if (loading) {
  return <View>...加载指示器...</View>
}
if (error) {
  return <View>...错误提示 + 重试...</View>
}
```

---

## 4. 代码规范要求

1. **使用 async/await**，不使用 Promise.then
2. **API 模块**统一使用 `client/src/api/request.ts` 中的 `request<T>()` 泛型函数
3. **适配器**集中在 `adapters.ts`，不在页面组件中直接操作后端字段名
4. **Loading/Error/Empty 三态**每个数据获取页面都必须覆盖
5. **错误提示**使用 `Taro.showToast({ title, icon: 'error' })`（管理后台操作）或页面内嵌错误提示 + 重试按钮（数据加载）
6. **Token 处理**由 `request.ts` 全局拦截 401，页面组件无需关心
7. **类型安全**：所有 API 函数写明返回类型，不滥用 `any`
8. **不引入新的 npm 依赖**（如 react-query、swr 等），使用 React 内置 hooks
9. **保留 `client/src/data/mockData.ts`** 文件不动（仅删除页面组件中的 import）

---

## 5. 测试要求

代码必须能通过以下测试用例（详见 [test-cases.md](./test-cases.md)）：

| 编号 | 覆盖点 |
|------|--------|
| TC-001 | 首页今日一词从 API 获取 |
| TC-002 | 首页搜索调用 `GET /api/v1/words?q=` |
| TC-003 | 搜索无结果空状态 |
| TC-004 | 全部词汇从 API 获取 |
| TC-005 | 首页 loading 状态 |
| TC-006 | 首页 error + 重试 |
| TC-007 | 单词详情完整数据展示 |
| TC-008 | 单词 404 友好提示 |
| TC-009 | 单词详情 loading |
| TC-010 | 词库列表 API 展示 |
| TC-011 | 词库列表空状态 |
| TC-012~013 | 词库列表 loading / error |
| TC-014~016 | 词库下单词列表、空状态、404 |
| TC-017~022 | 管理后台词库 CRUD 全流程 |
| TC-023~029 | 管理后台单词 CRUD 全流程 + AI 生成 |
| TC-030 | 管理后台概览 |
| TC-031~033 | 全局 loading / error / empty |
| TC-034 | admin 入口可见性 |
| TC-035 | 401 全局处理 |
| TC-036 | mockData.ts 保留不被页面导入 |

---

## 6. 注意事项

### 6.1 数据刷新策略
- 管理后台 CRUD 操作成功后，**全量刷新**列表（`loadAllData()`），保证前后端数据一致
- 用户端页面（首页、词库列表等）每次进入页面时重新请求（`useEffect` 空依赖数组）

### 6.2 搜索防抖
- 首页搜索框输入使用 300ms 防抖，避免每次按键都发送请求
- 使用 `useEffect` + `setTimeout` + cleanup pattern

### 6.3 并发请求
- 首页需要同时获取 words 和 wordbanks（用于展示词库标签），使用 `Promise.all` 并发请求
- 词库列表页同上

### 6.4 词性字段映射
- 后端 Word model 中 `extendedMeanings[].partOfSpeech` 是英文枚举（`"noun"`, `"verb"`, `"adj"`, etc.）
- 前端 `types.ts` 中 `ExtendedMeaning.partOfSpeech` 是中文缩写（`"n."`, `"v."`, `"adj."` 等）
- 适配器 `adaptWord` 中必须做 `partOfSpeech` 映射
- 管理后台新增/编辑单词时，前端表单用的是中文缩写词性，提交时必须映射回英文枚举

### 6.5 404 错误处理
- `request.ts` 对非 2xx 响应统一 throw `ApiRequestError`
- 页面可通过 `e instanceof ApiRequestError && e.statusCode === 404` 区分"资源不存在"和"网络错误"
- 需在调用处 import `ApiRequestError` from `api/request.ts`

### 6.6 管理后台 `physicalImageDescription` 字段
- 后端 Word model 中 `physicalImageDescription` 是必填字段
- 前端 mock 数据中没有此字段
- 管理后台新增/编辑单词时，传空字符串 `""`

### 6.7 `fetchUsers()` 降级
- 后端目前仅有 `GET /api/v1/users/me`，没有 admin 用户列表接口
- `fetchUsers()` 函数返回 `[]`，注释标注 `TODO` 待后续实现
- 管理后台的"用户管理"页面暂时显示空用户列表
