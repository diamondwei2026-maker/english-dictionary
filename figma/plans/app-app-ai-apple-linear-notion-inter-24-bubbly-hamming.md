# 单词收藏功能（详情页收藏按钮 + 个人中心"我的收藏"）

## Context

用户希望能收藏单词以便日后复习。需要在单词详情页加一个收藏按钮（切换收藏/取消），并在个人中心新增"我的收藏"入口，点击进入可查看已收藏单词的列表。收藏与笔记同属登录用户的个人数据，遵循与点赞一致的规则：未登录用户点击收藏时引导至登录页。

## 数据与状态

- 收藏无需新建类型，只需在 `App.tsx` 维护 `favorites: string[]`（收藏的 wordId 数组）：
  - `const [favorites, setFavorites] = useState<string[]>([]);`（可选预置几个示例）
  - `handleToggleFavorite(wordId)`：仅 `user` 存在时切换数组中是否含该 wordId
- `src/app/data/types.ts` 的 `ViewState` 新增 `| { name: 'favorites' }`
- `tabFromView`（App.tsx）把 `'favorites'` 归入 `profile` tab

## App.tsx 接线

- 向 `WordDetailView` 传 `favorites`（或布尔 `isFavorite`）+ `onToggleFavorite`
- 向 `ProfileView` 传 `favorites`（用于入口计数）
- 新增视图渲染：`{view.name === 'favorites' && user && <FavoritesView ... />}`

## 详情页收藏按钮（`src/app/components/WordDetailView.tsx`）

- Props 新增 `isFavorite: boolean` 与 `onToggleFavorite: () => void`
- 在顶部标题区（第 111–118 行 word heading 附近）右侧放一个收藏按钮，用 `lucide-react` 的 `Bookmark` 图标：
  - 已收藏：填充蓝色 `#2563EB` + `#EFF6FF` 底；未收藏：灰描边
  - 点击：登录则 `onToggleFavorite()`；未登录 `navigate({ name: 'login' })`
- 样式沿用现有圆角胶囊/图标按钮风格，无 emoji

## 我的收藏页面（新建 `src/app/components/FavoritesView.tsx`）

- 结构参照 `NotesView` 的 Level-1 列表与 `LibraryWordsView` 的单词卡片样式：
  - 顶部 sticky 返回栏（返回个人中心）+ 标题"我的收藏"
  - 用 `favorites.map` 结合 `mockWords.find` 渲染单词卡片：单词、音标、核心义摘要，点击 `navigate({ name: 'wordDetail', wordId })`
  - 每张卡片可带取消收藏按钮（复用 `onToggleFavorite`）
  - 空态：`Bookmark` 灰图标 + "还没有收藏单词"文案

## 个人中心入口（`src/app/components/ProfileView.tsx`）

- 在"我的笔记" `MenuRow` 下方（第 171–184 行区块内）新增一条 `MenuRow`：
  - icon `Bookmark`、label"我的收藏"、sub `${favorites.length} 个单词`、onClick 跳 `{ name: 'favorites' }`
- Props 新增 `favorites: string[]`

## 设计一致性

沿用现有 inline style、`#2563EB` 主蓝、24px 圆角、柔和阴影、Inter 字体，无 emoji，与笔记功能视觉统一。

## 验证

预览环境中：
1. 未登录进入单词详情 → 收藏按钮可见，点击跳转登录页
2. 登录（`13800000002 / 123456`）后点击收藏按钮 → 变为已收藏高亮态，再点取消
3. 个人中心出现"我的收藏"入口且计数正确 → 点击进入看到已收藏单词列表 → 点单词跳详情，取消收藏后列表更新
4. 管理员账号不受影响

---

# 单词详情页：社区笔记（所有笔记/我的笔记 + 点赞排序）

## Context

当前单词详情页（`WordDetailView.tsx`）的笔记区仅在登录后显示，且只展示当前用户自己的笔记，没有点赞概念。产品希望把笔记做成"社区化"：任何访客（无论是否登录）都能看到该单词下**所有用户**的笔记，按点赞数从高到低排序；登录用户可在"所有笔记 / 我的笔记"之间切换，并可对笔记点赞。点赞属于写操作，需登录后才能进行。

## 数据模型改动

`src/app/data/types.ts` — 扩展 `Note` 接口：
- 新增 `likedBy: string[]`（点赞用户 id 数组；点赞数 = `likedBy.length`，避免额外字段不同步）
- 新增 `authorName: string`（作者展示名，避免每次从 mockUsers 反查；运行时新建笔记从 `AuthUser.username` 取）

## 种子数据

`src/app/data/mockData.ts` — 新增并导出 `mockNotes: Note[]`：
- 覆盖几个已有单词（如 flow / grasp / break），每个单词 2–4 条笔记
- 作者取自 `mockUsers`（填 `userId` + `authorName`），`likedBy` 给不同长度以体现排序差异
- `createdAt` 用 `YYYY-MM-DD` 字符串，与现有格式一致

## App.tsx

- `const [notes, setNotes] = useState<Note[]>(mockNotes);`（用种子数据初始化，导入 `mockNotes`）
- `handleSaveNote`：新建笔记补充 `likedBy: []` 和 `authorName: user.username`（当前签名 `Omit<Note,'id'|'createdAt'>` 已包含 userId/content，调用处再传 authorName，或在此处根据传入的 userId 反查——采用调用处传 authorName 更简单）
- 新增 `handleToggleLike(noteId: string)`：仅当 `user` 存在时切换 `likedBy` 中是否含 `user.id`
- 将 `notes` 与 `onToggleLike` 传入 `WordDetailView`（WordDetailView 已接收 `notes`，新增 `onToggleLike`、并已有 `user`）

## WordDetailView.tsx（核心改动，`src/app/components/WordDetailView.tsx`）

现有第 262–341 行的 `{user && (...笔记区...)}` 改为**始终渲染**的社区笔记区：

1. Props 新增 `onToggleLike: (noteId: string) => void;`
2. 计算：
   - `const allNotes = notes.filter(n => n.wordId === wordId).sort((a,b) => b.likedBy.length - a.likedBy.length);`
   - `const myNotes = user ? allNotes.filter(n => n.userId === user.id) : [];`
   - 本地 state `const [noteTab, setNoteTab] = useState<'all' | 'mine'>('all');`
   - 展示列表 `const displayed = noteTab === 'mine' ? myNotes : allNotes;`
3. 区块标题从"我的笔记"改为"社区笔记"。标题下方加一个分段切换（沿用 `AuthView` 登录/注册切换的按钮组样式，圆角胶囊 + 选中态蓝底）：
   - 「所有笔记 (allNotes.length)」「我的笔记 (myNotes.length)」
   - 「我的笔记」tab 仅在 `user` 存在时显示；未登录只显示「所有笔记」
4. 笔记卡片（复用现有卡片样式，`#F8FAFC` 背景、左侧蓝色边框）内展示：
   - 顶部一行：`authorName`（若 `user && note.userId===user.id` 追加"（我）"标记）+ 右侧 `createdAt`
   - 中部：`note.content`
   - 底部：点赞按钮（`lucide-react` 的 `Heart` 图标 + 数字 `note.likedBy.length`）
     - 已赞态（`user && note.likedBy.includes(user.id)`）用填充/蓝色高亮
     - `onClick`：登录则 `onToggleLike(note.id)`；未登录则 `navigate({ name: 'login' })`
5. 空态：当 `displayed.length === 0` 显示占位文案（"暂无笔记" / "你还没有为该单词写笔记"）
6. 写笔记输入框（textarea + 保存按钮）保持在区块底部，但**仅登录用户可见**；未登录时用一条提示替代（如"登录后可添加笔记"，点击跳转登录）。`handleSave` 逻辑不变，onSaveNote 调用处补 `authorName: user.username`

## 设计一致性

- 全部沿用现有 inline style 模式与配色（`#2563EB` 主蓝、`#F8FAFC` 卡片底、24px 圆角、柔和阴影），无 emoji，Inter 字体继承
- 分段切换与点赞按钮均使用与现有组件相同的圆角与色板

## 不改动

- `NotesView.tsx`（个人中心的"我的笔记"二级导航）保持不变——仅展示自己的笔记，符合其定位；如需与新字段兼容，其 `Note` 使用不受影响（新增字段可选/有默认）

## 验证

预览环境（dev server 已运行，勿手动启动）中：
1. 未登录进入某单词详情 → 能看到"社区笔记"及多条他人笔记，按点赞数降序；无"我的笔记"tab；无写笔记框，显示"登录后可添加/点赞"提示；点点赞按钮跳转登录页
2. 用 `13800000002 / 123456` 登录后进入同一单词 → 出现"所有笔记 / 我的笔记"切换；点赞后数字 +1 且高亮，再点取消；排序随点赞变化
3. 在"我的笔记"tab 下新增一条笔记 → 立即出现在"我的笔记"和"所有笔记"中，作者名显示当前用户
4. 切到管理员账号 `13800000001` 不受影响（直接进后台）
