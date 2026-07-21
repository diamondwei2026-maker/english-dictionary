# Phase 2 映射规则 — Taro+React → uni-app+Vue3

> 基于 `d:\Users\weij\english-dictionary\.claude\skills\frontend-refactor\phase1-output\analysis-report.md`
> 目标路径：`d:\Users\weij\english-dictionary\client-uni\`

---

## 产出 1：六大类别映射规则

---

### 1. 组件模型映射

#### 1.1 核心容器组件

| 源 (Taro+React) | 目标 (uni-app+Vue3) | 说明 |
|---|---|---|
| `<View>` | `<view>` | 1:1 映射，小写标签 |
| `<Text>` | `<text>` | ⚠️ NC-14: 替代 h1~h6/块级文本时必须加 `display: block` |
| `<Input>` | `<input>` | ⚠️ NC-01: 显式 height; NC-02: 必须闭合 |
| `<Textarea>` | `<textarea>` | ⚠️ NC-03: 必须 auto-height; NC-08: 移除 resize |
| `<Image>` | `<image>` | mode 属性差异 |
| `<Button>` | `<button>` | open-type 差异 |
| `<ScrollView>` | `<scroll-view>` | 1:1 |
| `<Picker>` | `<picker>` | ⚠️ NC-13: 平台自适应 |
| `React.Fragment` (`<>...</>`) | `<template>` | Vue 3 片段语法 |
| `<block>` 条件渲染 | `v-if` / `v-show` | 非渲染容器 |

**源模式 (Taro)**:
```tsx
import { View, Text, Input } from '@tarojs/components';

<View style={{ padding: '20px' }}>
  <Text style={{ fontSize: '16px', display: 'block' }}>标题</Text>
  <Input
    value={value}
    onInput={(e) => setValue(e.detail.value)}
    style={{ width: '100%', padding: '14px 16px', borderRadius: '14px' }}
  />
</View>
```

**目标模式 (uni-app Vue3)**:
```vue
<template>
  <view class="container">
    <text class="container__title">标题</text>
    <input
      v-model="value"
      class="container__input"
      @input="onInput"
    />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const value = ref('');
const onInput = (e: any) => { value.value = e.detail.value; };
</script>

<style scoped lang="scss">
.container {
  padding: 40rpx;                     // 20px × 2 = 40rpx
  &__title {
    font-size: 32rpx;                 // 16px × 2 = 32rpx
    display: block;                   // NC-14: 必须
  }
  &__input {
    width: 100%;
    padding: 28rpx 32rpx;             // 14px 16px × 2
    border-radius: 28rpx;             // 14px × 2 = 28rpx
    height: 88rpx;                    // NC-01: 显式 height
    box-sizing: border-box;
  }
}
</style>
```

#### 1.2 Taro `<Input>` → uni-app `<input>` 详细对比

| 属性/行为 | Taro | uni-app | 迁移注意 |
|---|---|---|---|
| `value` | JSX prop | `v-model` 或 `:value` | 双向绑定 |
| `onInput` | `e.detail.value` | `@input`, `e.detail.value` | 事件取值相同 |
| `onFocus` | `e` 事件 | `@focus` | 一致 |
| `onBlur` | `e` 事件 | `@blur` | 一致 |
| `onConfirm` | `e` 事件 | `@confirm` | 替代 onKeyDown |
| `type="number"` | 支持 | 支持 | 一致 |
| `password` | boolean attr | `:password="true"` | 动态绑定 |
| `maxlength` | 支持 | `maxlength` | 一致 |
| `placeholder` | 支持 | `placeholder` | 一致 |
| 样式 | inline `style={{...}}` | SCSS class | 全部提取 |
| **height** | 可省略（由 padding 撑开） | ⚠️ NC-01: **必须显式声明** | 🔴 强制 |

#### 1.3 Taro `<Input>` 闭合标签 (NC-02)

**源模式 (合法)**:
```tsx
<Input value={val} onInput={fn} style={{...}} />
```

**目标模式 (必须)**:
```vue
<!-- ✅ 正确：闭合标签 -->
<input v-model="val" @input="fn" class="form-input"></input>

<!-- ❌ 错误：自闭合在小程序中异常 -->
<input v-model="val" @input="fn" class="form-input" />
```

#### 1.4 Taro `<Text>` 替代标题标签 (NC-14)

**源模式**:
```tsx
<Text style={{ fontSize: '26px', fontWeight: '700', color: '#111827' }}>
  页面标题
</Text>
```

**目标模式**:
```vue
<template>
  <text class="page-title">页面标题</text>
</template>

<style scoped lang="scss">
.page-title {
  font-size: 52rpx;           // 26px × 2
  font-weight: 700;
  color: #111827;
  display: block;             // ⚠️ NC-14: 必须！替代 h1 等块级语义
}
</style>
```

#### 1.5 条件渲染 `<block>` → `v-if` / `v-show`

**源模式**:
```tsx
{isLogin && <View>已登录内容</View>}
{loading ? <View>加载中</View> : <View>内容</View>}
```

**目标模式**:
```vue
<view v-if="isLogin">已登录内容</view>
<view v-if="loading">加载中</view>
<view v-else>内容</view>
```

#### 1.6 列表渲染 `map` → `v-for`

**源模式**:
```tsx
{words.map((word) => (
  <View key={word.id} onClick={() => goDetail(word.id)}>
    <Text>{word.word}</Text>
  </View>
))}
```

**目标模式**:
```vue
<view
  v-for="word in words"
  :key="word.id"
  @click="goDetail(word.id)"
>
  <text>{{ word.word }}</text>
</view>
```

#### 1.7 React.Fragment → `<template>`

**源模式**:
```tsx
<>
  <View>子元素 1</View>
  <View>子元素 2</View>
</>
```

**目标模式**:
```vue
<template>
  <view>子元素 1</view>
  <view>子元素 2</view>
</template>
```

#### 1.8 `<Textarea>` (NC-03 + NC-08)

**源模式**:
```tsx
<Textarea
  value={val}
  onInput={(e) => setVal(e.detail.value)}
  style={{
    width: '100%',
    padding: '13px 14px',
    borderRadius: '14px',
    border: '1.5px solid transparent',
    background: '#F1F5F9',
    fontSize: '15px',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
  }}
/>
```

**目标模式**:
```vue
<template>
  <textarea
    v-model="val"
    class="form-textarea"
    auto-height
  ></textarea>
</template>

<style scoped lang="scss">
.form-textarea {
  width: 100%;
  padding: 26rpx 28rpx;       // 13px 14px × 2
  border-radius: 28rpx;
  border: 3rpx solid transparent;
  background: #F1F5F9;
  font-size: 30rpx;
  color: #111827;
  box-sizing: border-box;
  // NC-08: 不写 resize，uni-app 不支持
  // NC-03: auto-height 在模板属性中声明
}
</style>
```

---

### 2. 事件系统映射

#### 2.1 事件速查表

| 源 (React) | 目标 (Vue 3) | 事件参数差异 |
|---|---|---|
| `onClick` | `@click` 或 `@tap` | React: SyntheticEvent; Vue: native Event |
| `onInput` | `@input` | `e.detail.value` (两端相同) |
| `onChange` (Picker) | `@change` | `e.detail.value` → 选中索引 |
| `onFocus` | `@focus` | 一致 |
| `onBlur` | `@blur` | 一致 |
| `onKeyDown` | `@confirm` | ⚠️ 小程序不支持键盘事件 |
| `onSubmit` | `@submit` | 表单提交 |
| `.stop` / `.prevent` | 不可用 | 小程序不支持事件修饰符 |

#### 2.2 onInput 事件值提取

**源模式**:
```tsx
<Input onInput={(e) => setQuery(e.detail.value)} />
```

**目标模式**:
```vue
<input @input="(e) => query = e.detail.value" />
<!-- 或结合 v-model: -->
<input v-model="query" @input="(e) => query = e.detail.value" />
```

#### 2.3 onChange (Picker) → @change

**源模式** (Taro Picker 词库选择器):
```tsx
<Picker mode="selector" range={libraryNames}
  value={libraries.findIndex((l) => l.id === form.libraryId)}
  onChange={(e) => {
    const lib = libraries[e.detail.value];
    if (lib) set('libraryId', lib.id);
  }}
>
  <View style={{...}}>
    <Text>{libraries.find((l) => l.id === form.libraryId)?.name || '选择词库'}</Text>
  </View>
</Picker>
```

**目标模式** (uni-app picker + H5 select):
```vue
<template>
  <!-- #ifdef MP-WEIXIN -->
  <picker mode="selector" :range="libraryNames" :value="selectedLibIndex" @change="onLibChange">
    <view class="picker-display">
      <text>{{ selectedLibName || '选择词库' }}</text>
    </view>
  </picker>
  <!-- #endif -->

  <!-- #ifdef H5 -->
  <select v-model="form.libraryId" class="h5-select">
    <option value="">选择词库</option>
    <option v-for="lib in libraries" :key="lib.id" :value="lib.id">
      {{ lib.name }}
    </option>
  </select>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { computed } from 'vue';

const selectedLibIndex = computed(() =>
  libraries.value.findIndex((l: any) => l.id === form.value.libraryId)
);
const selectedLibName = computed(() =>
  libraries.value.find((l: any) => l.id === form.value.libraryId)?.name
);
const onLibChange = (e: any) => {
  const lib = libraries.value[e.detail.value];
  if (lib) form.value.libraryId = lib.id;
};
</script>
```

#### 2.4 onKeyDown → @confirm

**源模式** (密码输入框按 Enter 提交):
```tsx
<Input
  password={!showPassword}
  value={password}
  onConfirm={handleSubmit}  // Taro 已使用 onConfirm
  // 无 onKeyDown（Taro 不支持）
/>
```

**目标模式**:
```vue
<input
  :password="!showPassword"
  v-model="password"
  @confirm="handleSubmit"
/>
```
注：源项目 Auth 页面已使用 Taro 的 `onConfirm`，直接迁移为 `@confirm`。

#### 2.5 React 函数式事件处理 → Vue 方法

**源模式**:
```tsx
<View onClick={() => setShowPassword((v) => !v)}>
  {showPassword ? <Icon name="eye-off" /> : <Icon name="eye" />}
</View>
```

**目标模式**:
```vue
<view @click="showPassword = !showPassword">
  <icon-font v-if="showPassword" name="eye-off" :size="16" color="#9CA3AF" />
  <icon-font v-else name="eye" :size="16" color="#9CA3AF" />
</view>
```

---

### 3. 样式系统映射

#### 3.1 核心原则

源项目 **100% React inline style**，每个 `style={{...}}` 对象提取为一个 SCSS class。

#### 3.2 CSS 属性名映射

| React inline (camelCase) | SCSS (kebab-case) |
|---|---|
| `fontSize` | `font-size` |
| `fontWeight` | `font-weight` |
| `lineHeight` | `line-height` |
| `textAlign` | `text-align` |
| `backgroundColor` / `background` | `background` / `background-color` |
| `borderRadius` | `border-radius` |
| `boxSizing` | `box-sizing` |
| `flexDirection` | `flex-direction` |
| `alignItems` | `align-items` |
| `justifyContent` | `justify-content` |
| `marginBottom` | `margin-bottom` |
| `paddingTop` | `padding-top` |
| `zIndex` | `z-index` |
| `gap` | `gap` (H5 支持，小程序有限) |
| `letterSpacing` | `letter-spacing` |
| `textTransform` | `text-transform` |
| `whiteSpace` | `white-space` |
| `textOverflow` | `text-overflow` |
| `overflow` | `overflow` (⚠️ NC-05: H5 条件编译) |
| `WebkitBackdropFilter` | `-webkit-backdrop-filter` (⚠️ H5 only) |
| `boxShadow` | `box-shadow` |
| `borderBottom` | `border-bottom` |
| `display: 'flex'` | `display: flex` |
| `cursor: 'pointer'` | `cursor: pointer` (H5 only) |

#### 3.3 单位换算：px → rpx

**规则**：`1px = 2rpx`。所有尺寸数值翻倍。

| 源 (px) | 目标 (rpx) |
|---|---|
| `16px` | `32rpx` |
| `14px` | `28rpx` |
| `24px` | `48rpx` |
| `20px` | `40rpx` |
| `52px` (页面顶部) | `104rpx` |
| `12px` | `24rpx` |
| `6px` | `12rpx` |
| `10px` | `20rpx` |
| `1.5px` (border) | `3rpx` |
| `0.5px` (细线) | `1rpx` |

#### 3.4 完整 inline style 提取示例

**源模式** (home 搜索框):
```tsx
<Input
  value={query}
  onInput={(e) => setQuery(e.detail.value)}
  onFocus={() => setSearchFocused(true)}
  onBlur={() => setSearchFocused(false)}
  placeholder="输入英文单词..."
  style={{
    width: '100%',
    padding: '14px 16px 14px 46px',
    borderRadius: '16px',
    border: searchFocused ? '1.5px solid #2563EB' : '1.5px solid transparent',
    background: searchFocused ? '#fff' : '#F1F5F9',
    fontSize: '16px',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
  }}
/>
```

**目标模式**:
```vue
<template>
  <view class="search-bar">
    <view class="search-bar__icon">
      <icon-font name="search" :size="18" color="#9CA3AF" />
    </view>
    <input
      v-model="query"
      class="search-bar__input"
      :class="{ 'search-bar__input--focused': searchFocused }"
      placeholder="输入英文单词..."
      @focus="searchFocused = true"
      @blur="searchFocused = false"
    ></input>
  </view>
</template>

<style scoped lang="scss">
.search-bar {
  position: relative;

  &__icon {
    position: absolute;
    left: 32rpx;                     // 16px × 2
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
    display: flex;
    align-items: center;
  }

  &__input {
    width: 100%;
    height: 88rpx;                   // NC-01: 显式高度
    padding: 28rpx 32rpx 28rpx 92rpx; // 14px 16px 14px 46px × 2
    border-radius: 32rpx;            // 16px × 2
    border: 3rpx solid transparent;
    background: #F1F5F9;
    font-size: 32rpx;                // 16px × 2
    color: #111827;
    outline: none;
    box-sizing: border-box;

    &--focused {
      border-color: #2563EB;
      background: #fff;
    }
  }
}
</style>
```

#### 3.5 条件编译属性速查

需要 H5 条件编译的所有 CSS 属性，详见 [产出 4: H5 条件编译属性清单](#产出-4h5-条件编译属性清单)。

**示例**:
```scss
// H5 保留、小程序移除
.page-header {
  background: rgba(255, 255, 255, 0.93);
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);

  /* #ifdef H5 */
  backdrop-filter: blur(32rpx);
  -webkit-backdrop-filter: blur(32rpx);
  /* #endif */
}
```

#### 3.6 @font-face (iconfont)

**目标模式** (App.vue):
```vue
<style lang="scss">
/* #ifdef H5 */
@import url('@/static/fonts/iconfont.css');
/* #endif */

/* #ifndef H5 */
@font-face {
  font-family: 'iconfont';
  src: url('@/static/fonts/iconfont.ttf') format('truetype');
}
/* #endif */

.iconfont {
  font-family: 'iconfont' !important;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
}
</style>
```

---

### 4. 路由与导航映射

#### 4.1 全局路由配置

**源模式** (`app.config.ts`):
```ts
export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/word-detail/index',
    'pages/libraries/index',
    'pages/library-words/index',
    'pages/profile/index',
    'pages/auth/index',
    'pages/admin/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F7F9FC',
    navigationBarTitleText: '认知英语词典',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F7F9FC',
  },
});
```

**目标模式** (`pages.json`):
```json
{
  "pages": [
    {
      "path": "pages/home/index",
      "style": {
        "navigationBarTitleText": "认知英语词典",
        "navigationBarBackgroundColor": "#F7F9FC",
        "navigationBarTextStyle": "black",
        "backgroundColor": "#F7F9FC"
      }
    },
    {
      "path": "pages/word-detail/index",
      "style": { "navigationBarTitleText": "单词详情" }
    },
    {
      "path": "pages/libraries/index",
      "style": { "navigationBarTitleText": "词库" }
    },
    {
      "path": "pages/library-words/index",
      "style": { "navigationBarTitleText": "词库单词" }
    },
    {
      "path": "pages/profile/index",
      "style": { "navigationBarTitleText": "我的" }
    },
    {
      "path": "pages/auth/index",
      "style": { "navigationBarTitleText": "登录/注册" }
    },
    {
      "path": "pages/admin/index",
      "style": { "navigationBarTitleText": "管理后台" }
    }
  ],
  "globalStyle": {
    "navigationBarBackgroundColor": "#F7F9FC",
    "navigationBarTitleText": "认知英语词典",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#F7F9FC"
  },
  "tabBar": {
    "color": "#9CA3AF",
    "selectedColor": "#2563EB",
    "backgroundColor": "#FFFFFF",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/home/index",
        "text": "搜索",
        "iconPath": "static/tabbar/search.png",
        "selectedIconPath": "static/tabbar/search-active.png"
      },
      {
        "pagePath": "pages/libraries/index",
        "text": "词库",
        "iconPath": "static/tabbar/book.png",
        "selectedIconPath": "static/tabbar/book-active.png"
      },
      {
        "pagePath": "pages/profile/index",
        "text": "我的",
        "iconPath": "static/tabbar/user.png",
        "selectedIconPath": "static/tabbar/user-active.png"
      }
    ]
  }
}
```

#### 4.2 导航 API 映射

| 源 (Taro) | 目标 (uni-app) |
|---|---|
| `Taro.switchTab({ url })` | `uni.switchTab({ url })` |
| `Taro.redirectTo({ url })` | `uni.redirectTo({ url })` |
| `Taro.navigateTo({ url })` | `uni.navigateTo({ url })` |
| `Taro.navigateBack()` | `uni.navigateBack()` |
| `Taro.getCurrentPages()` | `getCurrentPages()` (uni 内置) |
| `Taro.showToast({...})` | `uni.showToast({...})` |
| `Taro.showModal({...})` | `uni.showModal({...})` |

**源模式** (`useNavigate.ts`):
```ts
export function navigateToWordDetail(wordId: string) {
  Taro.navigateTo({ url: `/pages/word-detail/index?wordId=${wordId}` });
}

export function navigateBack() {
  const pages = Taro.getCurrentPages();
  if (pages.length > 1) {
    Taro.navigateBack();
  } else {
    Taro.redirectTo({ url: '/pages/home/index' });
  }
}
```

**目标模式** (`utils/navigate.ts`):
```ts
export function navigateToWordDetail(wordId: string) {
  uni.navigateTo({ url: `/pages/word-detail/index?wordId=${wordId}` });
}

export function navigateBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
  } else {
    uni.redirectTo({ url: '/pages/home/index' });
  }
}
```

#### 4.3 路由参数接收

**源模式** (React `useRouter` hook):
```tsx
import { useRouter } from '@tarojs/taro';

export default function WordDetailPage() {
  const router = useRouter();
  const wordId = router.params.wordId as string;
  // ...
}
```

**目标模式** (Vue 3 `onLoad`):
```vue
<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const wordId = ref('');

onLoad((options: any) => {
  wordId.value = options.wordId || '';
});
</script>
```

#### 4.4 Admin 内部路由（useState 面板切换）

**源模式** (Admin 4 面板 useState 切换):
```tsx
type AdminSection = 'overview' | 'libraries' | 'words' | 'users';
const [section, setSection] = useState<AdminSection>('overview');

// 面板切换
{section === 'overview' && <Overview ... />}
{section === 'libraries' && <LibraryManager ... />}
```

**目标模式**（两种方案）:

方案 A — 保持 useState 模式（推荐，风险最低）:
```vue
<script setup lang="ts">
import { ref } from 'vue';

type AdminSection = 'overview' | 'libraries' | 'words' | 'users';
const section = ref<AdminSection>('overview');
</script>

<template>
  <overview-panel v-if="section === 'overview'" ... />
  <library-manager v-else-if="section === 'libraries'" ... />
  <word-manager v-else-if="section === 'words'" ... />
  <user-manager v-else-if="section === 'users'" ... />
</template>
```

方案 B — 拆为 4 个子页面（若需深层导航栈）:
```
pages/admin/overview/index.vue
pages/admin/libraries/index.vue
pages/admin/words/index.vue
pages/admin/users/index.vue
```

---

### 5. 状态管理映射

#### 5.1 React Hooks → Vue 3 Composition API 速查

| React | Vue 3 | 说明 |
|---|---|---|
| `useState(init)` | `ref(init)` / `reactive(init)` | ref 用于基本类型，reactive 用于对象 |
| `useEffect(fn, [])` | `onMounted(fn)` | 挂载后执行 |
| `useEffect(fn, [deps])` | `watch(deps, fn)` | 依赖变化执行 |
| `useEffect(() => { return cleanup }, [])` | `onUnmounted(cleanup)` | 卸载清理 |
| `useRef(init)` | `ref(init)` 或普通变量 | template ref vs 可变容器 |
| `useMemo(fn, deps)` | `computed(fn)` | 派生状态 |
| `useCallback(fn, deps)` | 普通函数 | Vue 不需要 useCallback |

#### 5.2 useState → ref / reactive

**源模式**:
```tsx
const [query, setQuery] = useState('');
const [searchFocused, setSearchFocused] = useState(false);
const [allWords, setAllWords] = useState<Word[]>([]);
const [loading, setLoading] = useState(true);
```

**目标模式**:
```ts
import { ref } from 'vue';

const query = ref('');
const searchFocused = ref(false);
const allWords = ref<Word[]>([]);
const loading = ref(true);

// 读取: query.value
// 设置: query.value = 'new'
```

#### 5.3 useEffect → onMounted / watch

**源模式**:
```tsx
// 挂载时加载数据
useEffect(() => {
  loadData();
}, []);

// 搜索防抖 + 竞态保护
useEffect(() => {
  if (!query.trim()) {
    setSearchResults([]);
    return;
  }
  // 防抖逻辑...
  const timer = setTimeout(async () => { /* search */ }, 300);
  return () => clearTimeout(timer);
}, [query]);
```

**目标模式**:
```ts
import { onMounted, watch } from 'vue';

onMounted(() => {
  loadData();
});

// 搜索防抖
let timer: ReturnType<typeof setTimeout> | null = null;
let searchSeq = 0;

watch(query, (newQuery) => {
  if (!newQuery.trim()) {
    searchResults.value = [];
    hasSearched.value = false;
    return;
  }
  hasSearched.value = true;
  searchLoading.value = true;
  if (timer) clearTimeout(timer);
  const seq = ++searchSeq;
  timer = setTimeout(async () => {
    try {
      const result = await fetchWords({ q: newQuery.trim(), pageSize: 20 });
      if (seq === searchSeq) searchResults.value = result.words;
    } catch {
      if (seq === searchSeq) searchResults.value = [];
    } finally {
      if (seq === searchSeq) searchLoading.value = false;
    }
  }, 300);
});
```

#### 5.4 useMemo → computed

**源模式**:
```tsx
const isLogin = mode === 'login';
```

**目标模式**:
```ts
import { computed } from 'vue';
const isLogin = computed(() => mode.value === 'login');
```

#### 5.5 useCallback → 普通函数

**源模式**:
```tsx
const handleSubmit = useCallback(async () => {
  // ...
}, [phone, password, mode]);
```

**目标模式** (Vue 不需要 useCallback):
```ts
const handleSubmit = async () => {
  // 直接访问 phone.value, password.value, mode.value
};
```

#### 5.6 全局认证状态 → Pinia Store 或 reactive 单例

**源模式** (useAuth.ts — 全局单例 + 订阅模式):
```ts
let globalUser: AuthUser | null = null;
const listeners: Set<(u: AuthUser | null) => void> = new Set();

export function getGlobalUser(): AuthUser | null { return globalUser; }
export function setGlobalUser(u: AuthUser | null): void {
  globalUser = u;
  listeners.forEach(fn => fn(u));
}
export function onUserChange(fn: (u: AuthUser | null) => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getGlobalUser());
  useEffect(() => {
    const unsub = onUserChange((u) => setUser(u));
    return unsub;
  }, []);
  return user;
}
```

**目标模式 A — Pinia Store**:
```ts
// stores/auth.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const token = ref<string | null>(null);

  function setUser(u: AuthUser | null) { user.value = u; }
  function setToken(t: string) {
    token.value = t;
    uni.setStorageSync('auth_token', t);
  }
  function getToken(): string | null {
    return token.value || uni.getStorageSync('auth_token') || null;
  }
  function removeToken() {
    token.value = null;
    uni.removeStorageSync('auth_token');
  }
  function logout() {
    removeToken();
    setUser(null);
    uni.redirectTo({ url: '/pages/auth/index?mode=login' });
  }

  return { user, token, setUser, setToken, getToken, removeToken, logout };
});
```

**目标模式 B — reactive 单例** (最小改动):
```ts
// composables/useAuth.ts
import { reactive } from 'vue';

interface AuthState {
  globalUser: AuthUser | null;
}
const state = reactive<AuthState>({ globalUser: null });

export function getGlobalUser() { return state.globalUser; }
export function setGlobalUser(u: AuthUser | null) { state.globalUser = u; }

// 在组件中通过 reactive 引用自动追踪
```

推荐方案 A (Pinia)，因为 uni-app 官方推荐且支持 devtools。

#### 5.7 Token 存储迁移

**源模式**:
```ts
const TOKEN_KEY = 'auth_token';
export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); }
  catch { return null; }
}
export function setToken(token: string): void {
  try { localStorage.setItem(TOKEN_KEY, token); }
  catch { /* silent */ }
}
```

**目标模式**:
```ts
const TOKEN_KEY = 'auth_token';
export function getToken(): string | null {
  try { return uni.getStorageSync(TOKEN_KEY); }
  catch { return null; }
}
export function setToken(token: string): void {
  try { uni.setStorageSync(TOKEN_KEY, token); }
  catch { /* silent */ }
}
export function removeToken(): void {
  try { uni.removeStorageSync(TOKEN_KEY); }
  catch { /* silent */ }
}
```

#### 5.8 ref 防抖/竞态迁移 (useRef → 模块级变量)

**源模式**:
```tsx
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const searchSeqRef = useRef(0);
```

**目标模式**:
```ts
// Vue 3 setup 顶层变量（模块作用域或 setup 作用域）
let timer: ReturnType<typeof setTimeout> | null = null;
let searchSeq = 0;
```

---

### 6. 数据获取映射

#### 6.1 HTTP 客户端核心映射

**源模式** (`api/request.ts` 核心):
```ts
export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = getToken();
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) { header['Authorization'] = `Bearer ${token}`; }

  try {
    const res = await Taro.request<T>({
      url: `${BASE_URL}${path}`,
      method,
      data: options.data,
      header,
    });
    // 处理 statusCode, 401, 错误等...
  } catch (err) { /* network error */ }
}
```

**目标模式** (`utils/request.ts`):
```ts
const BASE_URL = '';

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const token = getToken();
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) { header['Authorization'] = `Bearer ${token}`; }

  try {
    const [err, res] = await uni.request<T>({
      url: `${BASE_URL}${path}`,
      method: options.method || 'GET',
      data: options.data,
      header,
    });

    // uni.request 返回 [error, result] 元组（需要检查）
    if (err) {
      throw new ApiRequestError(0, 'NETWORK_ERROR', '网络请求失败，请检查网络连接');
    }

    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.data == null) {
        throw new ApiRequestError(res.statusCode, 'EMPTY_RESPONSE', '服务器返回了空的响应数据');
      }
      return res.data as T;
    }

    // 401 全局处理
    if (res.statusCode === 401) {
      if (token) { clearAuthAndRedirect(); }
      const body = res.data as any;
      throw new ApiRequestError(401, body?.error?.code || 'UNAUTHORIZED', body?.error?.message || '认证失败');
    }

    // 其他错误
    const body = res.data as any;
    throw new ApiRequestError(res.statusCode, body?.error?.code || 'UNKNOWN_ERROR', body?.error?.message || `请求失败`);
  } catch (err) {
    if (err instanceof ApiRequestError) throw err;
    throw new ApiRequestError(0, 'NETWORK_ERROR', '网络请求失败');
  }
}
```

#### 6.2 SSE 流式获取

**源模式** (`api/ai.ts`):
```ts
// 使用原生 fetch + ReadableStream 实现 SSE
export async function generateWordStream(
  formData: Record<string, unknown>,
  token: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/v1/words/generate/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(formData),
  });
  // ... ReadableStream 处理
}
```

**目标模式**:
```ts
export async function generateWordStream(
  formData: Record<string, unknown>,
  token: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void,
): Promise<void> {
  // #ifdef H5
  // H5 端保留原生 fetch + SSE
  const response = await fetch(`/api/v1/words/generate/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(formData),
  });
  // ReadableStream 处理...
  // #endif

  // #ifdef MP-WEIXIN
  // 小程序端降级为非流式请求
  try {
    const result = await request<{ word: Word }>('/api/v1/words/generate', {
      method: 'POST',
      data: formData,
    });
    onDone(); // 或通知用户结果
  } catch (err) { onError(err as Error); }
  // #endif
}
```

#### 6.3 localStorage → uni.storage

| 源 | 目标 |
|---|---|
| `localStorage.getItem(key)` | `uni.getStorageSync(key)` |
| `localStorage.setItem(key, val)` | `uni.setStorageSync(key, val)` |
| `localStorage.removeItem(key)` | `uni.removeStorageSync(key)` |

#### 6.4 适配器层 — 1:1 移植

`adapters.ts` 中的 8 个适配器函数和 2 个词性映射函数直接 1:1 移植到 `utils/adapters.ts`。所有映射关系、类型定义和转换逻辑保持不变。仅需将 TypeScript 文件扩展名从 `.ts` 保持不变，将相对导入路径从 `../../data/types` 更新为 `@/data/types`。

**关键字段映射** (保持不变):
```
_id               → id               (String())
wordbankId        → libraryId        (String())
physicalImageType → coreImageType    (透传重命名)
coreExampleEn     → coreExampleSentence
coreExampleZh     → coreExampleTranslation
evolutionDescription → logicalEvolution
exampleEn         → exampleSentence
exampleZh         → exampleTranslation
createdAt         → joinedAt (User)
learnedWords[]    → learnedWords (number via .length)
slug, cover_image, gradient, is_public, updatedAt → 丢弃
```

---

## 产出 2：全局样式强制规则表

| 规则 ID | 描述 | 实施方式 | 适用文件 |
|---|---|---|---|
| **G1** | 所有使用 PageHeader 的页面需 H5 backdrop-filter 条件编译 | `/* #ifdef H5 */ backdrop-filter: blur(32rpx); /* #endif */` 写入 PageHeader 组件的 `&__wrapper` class | `components/PageHeader.vue`, 6 个使用 PageHeader 的页面 |
| **G2** | PageHeader 半透明背景色两种模式 | 默认模式: `background: rgba(255,255,255,0.93)` (白色页面); 灰色模式: `background: rgba(247,249,252,0.94)` (WordDetail, Admin); 通过 prop `bgColor` 动态切换 | `components/PageHeader.vue` |
| **G3** | 页面顶部 padding 必须含安全区 (104rpx+) | 所有页面最顶层容器 SCSS: `padding-top: 104rpx` (page-pt token = 52px × 2) | 所有页面 .vue 文件 |
| **G4** | 条件渲染分支中的 header 不得丢失背景样式 | 每个 `v-if` 分支内部都得有完整的 header 样式 class (loading/error/normal 三个分支各自含 header) | `pages/home.vue`, `pages/libraries.vue`, `pages/library-words.vue` |
| **G5** | App.vue 全局字体 font-family 设置 | `App.vue` 的 `<style lang="scss">` 中设置 `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;` | `App.vue` |
| **G6** | 全局 box-sizing: border-box (H5 条件编译, NC-10) | `/* #ifdef H5 */ *, *::before, *::after { box-sizing: border-box; } /* #endif */` | `App.vue` |
| **G7** | html/body/#app 选择器 (H5 条件编译, NC-11) | `/* #ifdef H5 */ html, body, #app { height: 100%; margin: 0; padding: 0; background: #F7F9FC; } /* #endif */` | `App.vue` |
| **G8** | @import url() 外部资源 (H5 条件编译, NC-09) | iconfont CSS 通过 `/* #ifdef H5 */ @import url('@/static/fonts/iconfont.css'); /* #endif */` 引入；小程序用 `@font-face` 本地 TTF | `App.vue` |
| **G9** | 所有 input 必须有显式 height (NC-01) | 每个 `<input>` 对应的 class 必须包含 `height` 声明，不能依赖 padding 撑开: `height: 88rpx` | 所有含 `<input>` 的 .vue 文件 (home, auth, admin) |
| **G10** | 所有 input 必须闭合标签 (NC-02) | 所有 `<input>` 使用闭合形式 `<input ...></input>`，禁止自闭合 `<input ... />` | 所有含 `<input>` 的 .vue 文件 |
| **G11** | 所有 textarea 必须有 auto-height (NC-03) | 每个 `<textarea>` 必须添加 `auto-height` 属性: `<textarea auto-height ...></textarea>` | `pages/admin.vue` (WordEditForm 中 4 个 textarea) |
| **G12** | 所有 transition 必须 H5 条件编译 (NC-04) | 任何使用的 `transition` 属性包裹 `/* #ifdef H5 */ ... /* #endif */` | `components/CustomTabBar.vue` (tab 颜色过渡) |
| **G13** | overflow: hidden 必须 H5 条件编译 (NC-05) | `/* #ifdef H5 */ overflow: hidden; /* #endif */` | `components/PhysicalImage.vue` (SVG 圆角容器) |
| **G14** | input focus/blur 样式使用 INPUT-A/INPUT-B mixin，禁止手写 | 定义两个全局 SCSS mixin: `@mixin input-mode-a` (搜索型: blur 灰底透明边框/focus 白底蓝边框) 和 `@mixin input-mode-b` (表单型: blur 灰边框白底/focus 蓝边框白底) | `styles/mixins.scss`, `pages/home.vue`, `pages/auth.vue`, `pages/admin.vue` |
| **G15** | input 包裹容器必须有 min-height (NC-06) | 每个 input 的外部 `<view>` 包裹容器: `min-height: 0` (防止 flex 容器内 input 被压缩) | 所有含 `<input>` 的 .vue 文件 |
| **G16** | `<text>` 替代 `<h1>`~`<h6>` 等块级元素时必须加 `display: block` (NC-14) | 所有作为块级标题使用的 `<text>` 元素都必须在对应 class 中写 `display: block` | 所有页面 .vue 文件 |
| **G17** | `<text>` 中 `\n` 必须配合 `white-space: pre-line` (NC-12) | 任何包含换行符 `\n` 的 text 元素对应 class 必须添加 `white-space: pre-line` | `pages/auth.vue` (Demo 提示文本) |

### INPUT-A / INPUT-B Mixin 定义

```scss
// styles/mixins.scss

// 模式 A：搜索型输入框
// blur: 灰底(#F1F5F9) + 透明边框
// focus: 白底(#FFFFFF) + 蓝色边框(#2563EB)
@mixin input-mode-a {
  width: 100%;
  height: 88rpx;
  padding: 28rpx 32rpx;
  border-radius: 32rpx;
  border: 3rpx solid transparent;
  background: #F1F5F9;
  font-size: 32rpx;
  color: #111827;
  outline: none;
  box-sizing: border-box;

  &--focused {
    border-color: #2563EB;
    background: #FFFFFF;
  }
}

// 模式 B：表单型输入框
// blur: 灰色边框(#E5E7EB) + 白底(#FFFFFF)
// focus: 蓝色边框(#2563EB) + 白底(#FFFFFF)
@mixin input-mode-b {
  width: 100%;
  height: 88rpx;
  padding: 28rpx 32rpx;
  border-radius: 28rpx;
  border: 3rpx solid #E5E7EB;
  background: #FFFFFF;
  font-size: 32rpx;
  color: #111827;
  outline: none;
  box-sizing: border-box;

  &--focused {
    border-color: #2563EB;
  }
}
```

---

## 产出 3：不可移植特性表

| 源特性 | 问题 | 替代方案 | 保真度差距 | 多平台影响 |
|---|---|---|---|---|
| **内联 SVG (PhysicalImage)** | 9 种物理意象 SVG 插画使用内联 `<svg>` 标签渲染。uni-app 小程序端不支持直接在 template 中写 `<svg>` | H5 端保留内联 SVG 不变; 小程序端两种方案: (A) 将 SVG 转为 Canvas 2D 绘制, (B) 用 CSS 渐变 + box-shadow 纯代码重绘图形。推荐方案 B — 每个物理意象用一个纯 CSS class 还原视觉效果 | **高** — 方案 B 需手工用 CSS 重绘 9 种意象 (流、抓、断、承、驱、光、杠、屈、通用)，每种需调整渐变、圆角、线条、文字 | H5: 完美还原; 小程序: CSS 还原 ≈70% 视觉保真度 |
| **内联 SVG (CustomTabBar 图标)** | TabBar 中 3 个图标使用内联 SVG (搜索/书籍/用户)，小程序不支持 | H5 保留 SVG; 小程序端使用 iconfont unicode 字符或 uni-icons 替代。iconfont 方案最一致 | **低** — iconfont 单色图标可完美替代 (原 TabBar 图标本就是单色笔画) | H5: 完美; 小程序: iconfont ≈95% 保真度 |
| **内联 SVG (logout 图标)** | `Icon.tsx` 中 logout 图标为内联 SVG (3 个 path + polyline + line)，小程序不支持 | iconfont 生成列表中加入 logout 字符，统一用 iconfont 渲染 | **低** — iconfont 单色替换，差异可忽略 | 全平台: iconfont 统一方案 ≈98% 保真度 |
| **backdrop-filter: blur** | PageHeader 毛玻璃效果 (`blur(16px)`) 和 CustomTabBar 毛玻璃 (`blur(20px)`) 在小程序中不支持 | H5 条件编译保留; 小程序端用半透明纯色背景模拟 (PageHeader: `rgba(255,255,255,0.93)`, TabBar: `rgba(255,255,255,0.88)`) + 底部细边框 (已有) | **中** — 小程序失去毛玻璃视觉效果，半透明纯色背景可近似，但无法模糊背后内容 | H5: 完美毛玻璃; 小程序: 纯色半透明 ≈75% 视觉保真度 |
| **CSS transition on input** | CustomTabBar 的 tab 颜色过渡 `transition: color 0.2s` (NC-04) | `/* #ifdef H5 */ transition: color 0.2s; /* #endif */` | **低** — 小程序中 tab 颜色切换无过渡动画，但功能不受影响 | H5: 平滑过渡; 小程序: 无动画 |
| **position: fixed CustomTabBar** | 源使用自定义 fixed 定位 TabBar 而非 Taro 原生 tabBar。uni-app 小程序中 position: fixed 行为与 H5 有差异 (z-index 层叠上下文、滚动时抖动) | **推荐使用 uni-app 原生 tabBar 配置** (`pages.json` 中 `tabBar` 字段)。如必须自定义，H5 端保留 fixed + backdrop-filter；小程序端用 `cover-view` 或改用原生 tabBar | **中** — 改用原生 tabBar 后: 失去毛玻璃和自定义 SVG 图标，但获得原生的稳定性; tab 图标用图片替代 | H5: 自定义 tabBar 完美; 小程序: 原生 tabBar ≈80% 视觉保真度但 100% 功能 |
| **onKeyDown 键盘事件** | 密码输入框按 Enter 键提交为键盘事件，小程序不支持 | 改用 `@confirm` (已存在于源项目的 `onConfirm={handleSubmit}`)，无 onKeyDown 使用 | **低** — 源项目已使用 onConfirm，直接迁移 | H5: Enter 键提交; 小程序: 键盘"完成"按钮提交 |
| **Taro Picker** | 2 个 Picker (词库选择器 S1、词性选择器 S2) 使用 `mode="selector"`，H5 端渲染为原生 `<select>` 但样式不可控 | uni-app picker 小程序端使用原生选择器; H5 端用 `<select>` 标签 (通过 `#ifdef H5` 条件编译) | **中** — H5 端 `<select>` 样式与原生 picker 显示不同，需额外 CSS 统一外观 | H5: `<select>` 原生下拉; 小程序: 原生底部 picker ≈85% 统一度 |
| **Taro `<Input>` 自闭合** | 源项目 `<Input style={{...}} />` 可自闭合。uni-app 小程序中必须闭合标签 | 全部改为 `<input ...></input>` | **无** — 纯语法差异，不影响外观 | 全平台统一闭合写法 |
| **Textarea resize** | uni-app 不支持 `resize` CSS 属性 | 移除所有 `resize: none` 声明，uni-app textarea 原生无 resize 手柄 | **无** — uni-app 默认无 resize 句柄 | 全平台统一 |
| **grid-template-columns** | 源 Admin WordEditForm 使用 `display: 'grid', gridTemplateColumns: '1fr 96px'`, 小程序 CSS Grid 支持有限 | 改用 `display: flex` + 固定宽度替代 grid | **低** — flex 可完全等价实现 | H5: grid 完美; 小程序: flex 替代 ≈100% 功能 |
| **env(safe-area-inset-bottom)** | 源 CustomTabBar 使用 `paddingBottom: 'env(safe-area-inset-bottom, 0px)'`, uni-app 小程序原生支持 | 保持不变 | **无** | 全平台支持 |
| **overflow: hidden (PhysicalImage 圆角裁剪)** | `overflow: hidden` 用于裁剪 SVG 超出 `border-radius` 的部分 (NC-05) | `/* #ifdef H5 */ overflow: hidden; /* #endif */` — 小程序端 SVG 本身在 viewBox 内渲染，大概率不需要 overflow 裁剪 | **低** — 小程序中 SVG 不会超出父容器 | H5: 有 overflow; 小程序: 无 overflow (无实际影响) |

---

## 产出 4：H5 条件编译属性清单

以下列出所有需要 `/* #ifdef H5 */` 条件编译的 CSS 属性及其代码片段。

| # | 属性 | 源组件/页面 | 功能 | H5 条件编译代码 |
|---|---|---|---|---|
| 1 | `backdrop-filter: blur(32rpx)` | PageHeader | 毛玻璃背景 | `/* #ifdef H5 */ backdrop-filter: blur(32rpx); -webkit-backdrop-filter: blur(32rpx); /* #endif */` |
| 2 | `backdrop-filter: blur(40rpx)` | CustomTabBar | TabBar 毛玻璃 | `/* #ifdef H5 */ backdrop-filter: blur(40rpx); -webkit-backdrop-filter: blur(40rpx); /* #endif */` |
| 3 | `transition: color 0.2s` | CustomTabBar tab 颜色 | Tab 激活颜色过渡 (NC-04) | `/* #ifdef H5 */ transition: color 0.2s; /* #endif */` |
| 4 | `transition: border-color 0.2s` | 所有 input focus 切换 | 输入框聚焦边框过渡 (NC-04) | `/* #ifdef H5 */ transition: border-color 0.2s; /* #endif */` |
| 5 | `transition: background-color 0.2s` | 模式 A input 背景 | 搜索框背景切换过渡 (NC-04) | `/* #ifdef H5 */ transition: background-color 0.2s; /* #endif */` |
| 6 | `overflow: hidden` | PhysicalImage 容器 | SVG 圆角溢出裁剪 (NC-05) | `/* #ifdef H5 */ overflow: hidden; /* #endif */` |
| 7 | `overflow: hidden` | 文本截断容器 | 单行 `text-overflow: ellipsis` 配合 (NC-05) | `/* #ifdef H5 */ overflow: hidden; /* #endif */` |
| 8 | `@import url(...)` | App.vue iconfont CSS | 外部字体样式 (NC-09) | `/* #ifdef H5 */ @import url('@/static/fonts/iconfont.css'); /* #endif */` |
| 9 | `@font-face` | App.vue iconfont | 字体文件定义 | 小程序用 `@font-face { src: url('@/static/fonts/iconfont.ttf') }`; H5 可选 @import 方式 |
| 10 | `*, *::before, *::after { box-sizing: border-box }` | App.vue 全局 | 盒模型重置 (NC-10) | `/* #ifdef H5 */ *, *::before, *::after { box-sizing: border-box; } /* #endif */` |
| 11 | `html, body, #app { height: 100%; margin: 0; padding: 0; background: #F7F9FC }` | App.vue 全局 | 根元素样式重置 (NC-11) | `/* #ifdef H5 */ html, body, #app { height: 100%; margin: 0; padding: 0; background: #F7F9FC; } /* #endif */` |
| 12 | `cursor: pointer` | 所有可点击元素 | 鼠标指针样式 | `/* #ifdef H5 */ cursor: pointer; /* #endif */` |
| 13 | `:hover` / `:focus` 伪类 | 按钮、卡片、链接 | 悬停/聚焦态 | 用 class 动态切换替代伪类 (小程序不支持伪类); H5 端可用 SCSS `&:hover` / `&:focus` 额外增强 |
| 14 | `outline: none` | 所有 input | 移除聚焦轮廓 | `/* #ifdef H5 */ outline: none; /* #endif */` (小程序原生无 outline) |
| 15 | `-webkit-appearance: none` | 搜索框 Input | 移除 WebKit 默认样式 | `/* #ifdef H5 */ -webkit-appearance: none; /* #endif */` |
| 16 | `position: sticky` | PageHeader (sticky 模式) | 吸顶定位 | `/* #ifdef H5 */ position: sticky; top: 0; z-index: 10; /* #endif */` — 小程序端用 `position: fixed` 替代或直接去除 |
| 17 | `text-transform: uppercase` | 标签文字 | 英文大写转换 | `/* #ifdef H5 */ text-transform: uppercase; /* #endif */` (小程序 text 组件不支持) |
| 18 | `letter-spacing` | 标签/标题 | 字间距 | `/* #ifdef H5 */ letter-spacing: 2px; /* #endif */` (小程序 text 组件部分支持但各端不一致) |
| 19 | `gap` (flex 容器) | 所有 flex 布局元素 | flex gap 间距 | 小程序对 `gap` 支持有限，建议用 `margin` 替代; H5 端可保留 `gap` |
| 20 | `fetch` (SSE 流式) | `api/ai.ts` | AI 生成流式请求 | `// #ifdef H5` ... 原生 fetch + SSE ... `// #endif`; `// #ifdef MP-WEIXIN` ... 非流式 uni.request ... `// #endif` |
| 21 | `<select>` (H5 picker 降级) | Admin 词库/词性选择器 | 平台自适应选择器 (NC-13) | `<!-- #ifdef H5 --> <select> ... </select> <!-- #endif -->`; `<!-- #ifdef MP-WEIXIN --> <picker> ... </picker> <!-- #endif -->` |
| 22 | `line-height` (input) | 所有 input 元素 | 输入框文本行高 | 所有平台均需声明，但 H5 需额外 `line-height: 1.5` 防止文本偏上 |

### H5 条件编译完整代码示例

**App.vue 全局样式**:
```vue
<style lang="scss">
/* 全局样式 — 非 scoped */

/* #ifdef H5 */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  background: #F7F9FC;
}

*, *::before, *::after {
  box-sizing: border-box;
}

@import url('@/static/fonts/iconfont.css');
/* #endif */

/* #ifndef H5 */
@font-face {
  font-family: 'iconfont';
  src: url('@/static/fonts/iconfont.ttf') format('truetype');
}
/* #endif */

.iconfont {
  font-family: 'iconfont' !important;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
}

/* 全局字体 */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background: #F7F9FC;
}
</style>
```

**PageHeader.vue scoped 样式**:
```vue
<style scoped lang="scss">
.page-header {
  padding: 104rpx 48rpx 32rpx;    // G3: 安全区
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);

  /* #ifdef H5 */
  backdrop-filter: blur(32rpx);   // G1: 毛玻璃
  -webkit-backdrop-filter: blur(32rpx);
  /* #endif */

  &--white {
    background: rgba(255, 255, 255, 0.93);    // G2: 白色页模式
  }

  &--page-bg {
    background: rgba(247, 249, 252, 0.94);    // G2: 灰色页模式
  }

  &--compact {
    padding: 104rpx 40rpx 32rpx;
  }

  /* #ifdef H5 */
  &--sticky {
    position: sticky;
    top: 0;
    z-index: 10;
  }
  /* #endif */

  &__back {
    display: flex;
    align-items: center;
    gap: 12rpx;
    color: #6B7280;
    font-size: 28rpx;
    padding: 12rpx 0;

    /* #ifdef H5 */
    cursor: pointer;
    /* #endif */
  }

  &__subtitle {
    font-size: 24rpx;
    color: #9CA3AF;
    display: block;
    margin-bottom: 12rpx;

    /* #ifdef H5 */
    letter-spacing: 4rpx;
    text-transform: uppercase;
    /* #endif */
  }

  &__title {
    font-size: 52rpx;
    font-weight: 700;
    color: #111827;
    display: block;              // G16: NC-14 块级 text
  }
}
</style>
```

**CustomTabBar.vue scoped 样式**:
```vue
<style scoped lang="scss">
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  background: rgba(255, 255, 255, 0.88);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  z-index: 100;

  /* #ifdef H5 */
  backdrop-filter: blur(40rpx);
  -webkit-backdrop-filter: blur(40rpx);
  /* #endif */

  // 小程序降级：纯半透明背景（无需额外声明，background 已设置）

  &__blur-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    /* #ifdef H5 */
    backdrop-filter: blur(40rpx);
    -webkit-backdrop-filter: blur(40rpx);
    /* #endif */

    z-index: -1;
  }

  &__tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6rpx;
    padding: 12rpx 40rpx;

    /* #ifdef H5 */
    transition: color 0.2s;      // NC-04
    cursor: pointer;
    /* #endif */

    &--active {
      color: #2563EB;
      font-weight: 600;
    }

    &--inactive {
      color: #9CA3AF;
      font-weight: 400;
    }
  }

  &__label {
    font-size: 22rpx;

    /* #ifdef H5 */
    letter-spacing: 0.6rpx;
    /* #endif */
  }
}
</style>
```

**input 通用样式 (NC-01 + NC-02 + NC-10 + NC-11)**:
```vue
<template>
  <!-- NC-02: 闭合标签，禁止自闭合 -->
  <input
    v-model="val"
    class="form-input"
    :class="{ 'form-input--focused': focused }"
    @focus="focused = true"
    @blur="focused = false"
  ></input>
</template>

<style scoped lang="scss">
.form-input {
  width: 100%;
  height: 88rpx;                  // NC-01: 显式高度
  padding: 28rpx 32rpx;
  border-radius: 28rpx;
  border: 3rpx solid #E5E7EB;
  background: #FFFFFF;
  font-size: 32rpx;
  color: #111827;
  box-sizing: border-box;         // NC-10: H5 条件编译中已在全局设置，scoped 也保留

  /* #ifdef H5 */
  outline: none;
  -webkit-appearance: none;
  line-height: 1.5;
  /* #endif */

  &--focused {
    border-color: #2563EB;

    /* #ifdef H5 */
    transition: border-color 0.2s; // NC-04
    /* #endif */
  }
}
</style>
```

---

## 附录：源→目标完整文件映射

| 源文件 (client/src/) | 目标文件 (client-uni/src/) | 迁移类型 |
|---|---|---|
| `app.tsx` | `App.vue` | 重写 (组件 → .vue SFC) |
| `app.config.ts` | `pages.json` | 重写 (TS 配置 → JSON) |
| `app.scss` | `App.vue` `<style>` + `styles/global.scss` | 合并 |
| `api/request.ts` | `utils/request.ts` | 适配 (Taro.request → uni.request) |
| `api/adapters.ts` | `utils/adapters.ts` | 1:1 移植 |
| `api/auth.ts` | `api/auth.ts` | 适配 (import 路径 + request 函数) |
| `api/words.ts` | `api/words.ts` | 适配 |
| `api/wordbanks.ts` | `api/wordbanks.ts` | 适配 |
| `api/favorites.ts` | `api/favorites.ts` | 适配 |
| `api/learning.ts` | `api/learning.ts` | 适配 |
| `api/ai.ts` | `api/ai.ts` | 适配 (SSE 条件编译) |
| `api/daily-word.ts` | `api/daily-word.ts` | 适配 |
| `api/dashboard.ts` | `api/dashboard.ts` | 适配 |
| `api/users.ts` | `api/users.ts` | 适配 |
| `api/index.ts` | `api/index.ts` | 适配 |
| `data/types.ts` | `data/types.ts` | 1:1 移植 |
| `data/mockData.ts` | `data/mockData.ts` (可选) | 1:1 移植 |
| `hooks/useAuth.ts` | `stores/auth.ts` (Pinia) 或 `composables/useAuth.ts` | 重写 (单例 → Pinia/reactive) |
| `hooks/useNavigate.ts` | `utils/navigate.ts` | 适配 (Taro.* → uni.*) |
| `components/Icon.tsx` | `components/IconFont.vue` | 重写 (SVG 组件 → iconfont) |
| `components/PageHeader.tsx` | `components/PageHeader.vue` | 重写 (inline style → SCSS) |
| `components/PrimaryBtn.tsx` | `components/PrimaryBtn.vue` | 重写 |
| `components/PhysicalImage.tsx` | `components/PhysicalImage.vue` | 重写 (SVG → CSS 条件编译) |
| `components/CustomTabBar/index.tsx` | `components/CustomTabBar.vue` (或移除改用原生 tabBar) | 重写或移除 |
| `pages/home/index.tsx` | `pages/home/index.vue` | 重写 |
| `pages/home/index.config.ts` | `pages.json` pages[0].style | 合并 |
| `pages/libraries/index.tsx` | `pages/libraries/index.vue` | 重写 |
| `pages/libraries/index.config.ts` | `pages.json` pages[2].style | 合并 |
| `pages/library-words/index.tsx` | `pages/library-words/index.vue` | 重写 |
| `pages/library-words/index.config.ts` | `pages.json` pages[3].style | 合并 |
| `pages/word-detail/index.tsx` | `pages/word-detail/index.vue` | 重写 |
| `pages/word-detail/index.config.ts` | `pages.json` pages[1].style | 合并 |
| `pages/profile/index.tsx` | `pages/profile/index.vue` | 重写 |
| `pages/profile/index.config.ts` | `pages.json` pages[4].style | 合并 |
| `pages/auth/index.tsx` | `pages/auth/index.vue` | 重写 |
| `pages/auth/index.config.ts` | `pages.json` pages[5].style | 合并 |
| `pages/admin/index.tsx` | `pages/admin/index.vue` (或拆为 4 子页) | 重写 |
| `pages/admin/index.config.ts` | `pages.json` pages[6].style | 合并 |
| — | `styles/mixins.scss` | **新增** (INPUT-A/INPUT-B mixin) |
| — | `styles/variables.scss` | **新增** (设计 Token CSS 变量) |
| — | `styles/global.scss` | **新增** (全局样式) |
| — | `static/fonts/iconfont.ttf` | **新增** (21 个图标 TTF) |
| — | `static/fonts/iconfont.css` | **新增** (iconfont 样式文件) |
| — | `static/tabbar/*.png` | **新增** (原生 tabBar 图标) |
