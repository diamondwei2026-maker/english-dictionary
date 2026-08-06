# 短句翻译训练模块

## Context

当前 APP 只有「搜索 / 词库 / 我的」三个页面，用户学完单词后没有输出型练习，无法验证是否真的摆脱了"中英翻译脑"。本次新增「训练」板块：短句中译英 / 英译中练习，每轮 10 题，逐题判分并在答错时给出中文分析；同时在单词详情页提供针对该单词的专项练习入口，把"看懂词义"闭环到"能用词造句"。

后端尚未接入，本轮采用**本地模拟版**（用户已确认）：题库预置在 `mockData.ts`，判分用规则匹配。UI 与交互按真 AI 版设计，后续接 Supabase 时只需替换 `judgeAnswer` / `generateQuiz` 两个函数的实现。

本轮**只实现中译英**（用户已确认）。「短句英译中」按钮照常展示，但为禁用态并标注「即将上线」。类型与引擎仍按双方向设计，后续补齐英译中只需加题库数据并放开按钮。

## 现状要点

- 路由是 `App.tsx` 中的 `ViewState` 联合类型 + `tabFromView()` 映射，无 react-router。
- `BottomNav.tsx` 的 `Tab` 类型硬编码为 `'home' | 'libraries' | 'profile'`，`App.tsx` 里也重复定义了一份。
- 视觉规范（沿用，不要新造）：背景 `#F7F9FC`，主色 `#2563EB`，正文 `#111827` / 次要 `#6B7280` / 弱化 `#9CA3AF`，卡片白底 + 大圆角 + 柔和阴影，sticky 顶栏 `padding: '52px 24px 16px'` + `backdrop-filter: blur(16px)`，返回按钮用 `ArrowLeft size={18}`。参考 `FavoritesView.tsx` 作为最简页面模板。
- 全部为内联 style，不用 Tailwind class；禁止 emoji。

## 实现步骤

### 1. `src/app/data/types.ts`

```ts
export type QuizDirection = 'zh2en' | 'en2zh';

export interface QuizItem {
  id: string;
  wordId?: string;        // 单词专项练习时关联的词
  prompt: string;         // 题干（中译英时为中文，英译中时为英文）
  reference: string;      // 参考答案
  keywords: string[];     // 判分必需关键词（含可接受的词形变体，小写）
  hint?: string;          // 目标词/结构提示
  analysis: string;       // 答错时展示的中文分析（意象/逻辑角度）
}

export interface QuizResult {
  correct: boolean;
  score: number;          // 0-100
  matched: string[];
  missing: string[];
  analysis: string;       // 判定说明；正确时为肯定性反馈
}
```

`ViewState` 追加：
```ts
| { name: 'training' }
| { name: 'quiz'; direction: QuizDirection; wordId?: string }
```

### 2. `src/app/data/mockData.ts`

新增 `export const mockQuizItems: QuizItem[]`：
- 为 `mockWords` 中每个词各写 3-4 道题（`wordId` 关联），题目围绕该词的核心意象与各引申义，句子控制在 8-15 词。
- 另加一批通用题（无 `wordId`）补足综合练习的 10 题。
- `analysis` 用认知语言学口吻，例如："中文'现金周转'的'转'会诱导你用 turn；英语这里锚定的是液体沿渠道持续移动的意象，故为 cash flow。"

### 3. `src/app/data/quizEngine.ts`（新建）

纯函数，未来替换为后端调用的唯一接口：

- `generateQuiz(direction, wordId?): QuizItem[]`
  - 有 `wordId`：优先取该词题目，不足则用同 `libraryId` 的词补齐；无则从通用池随机。
  - 洗牌后 `slice(0, 10)`。
- `judgeAnswer(item, userInput, direction): QuizResult`
  - 归一化：小写、去首尾空白、折叠连续空格、去除句末标点。
  - 中译英：关键词命中率（支持简单词形变体，`flow/flows/flowed/flowing` 通过前缀+常见后缀匹配）占 70 分，与 `reference` 的词序列相似度（LCS / 词数）占 30 分；`score >= 70` 判对。
  - 英译中：本轮不启用，先留占位分支（按字符 bigram 重合度判定），不接入 UI。
  - 空输入直接 `correct: false`。
  - `analysis`：正确时给简短肯定 + 参考答案；错误时输出 `item.analysis` + 缺失关键词提示。

### 4. `src/app/components/TrainingView.tsx`（新建）

训练首页。顶部标题「训练」+ 一句副标题；两张大卡片按钮：
- 「短句中译英」→ `navigate({ name: 'quiz', direction: 'zh2en' })`
- 「短句英译中」→ 禁用态：`opacity: 0.55`、`cursor: 'default'`、无点击响应，右上角挂一枚浅灰胶囊标签「即将上线」（背景 `#F3F4F6`，文字 `#9CA3AF`）

每张卡片：白底、`borderRadius: 24px`、`padding: 24px`、柔和阴影、`lucide-react` 图标（`Languages` / `BookOpenCheck`）+ 标题 + 说明文案 + 右侧 `ChevronRight`。留白充足。

### 5. `src/app/components/QuizView.tsx`（新建）

props：`{ direction, wordId?, navigate }`。

- `useState` 初始化 `items = generateQuiz(direction, wordId)`（用 lazy initializer 避免重渲染重新洗牌）；`index`、`input`、`result`、`answers: QuizResult[]`。
- 顶栏：返回（回 `training`，若带 `wordId` 则回 `wordDetail`）+ 进度 `3 / 10` + 细进度条（`#2563EB` 填充）。
- 题卡：题干大字；`hint` 以浅色标签展示。
- 输入：多行 `textarea`，圆角 16px，聚焦时边框变主色。
- 底部主按钮「提交」→ `judgeAnswer` 写入 `result`；已判分时按钮变「下一题」/ 最后一题变「查看结果」。
- 判分反馈卡片：正确用 `#F0FDF4`/`#166534` + `Check` 图标；错误用 `#FFF1F2`/`#9F1239` + `X` 图标，展示参考答案与 `analysis`。用 `motion/react` 做淡入上移（已安装）。
- 完成页：正确数 / 10、正确率、逐题回顾折叠列表、「再来一组」（重新 `generateQuiz`，重置 state）和「返回」。

### 6. `src/app/components/WordDetailView.tsx`

在收藏/笔记区域上方（词条正文之后）加一张「专项练习」入口卡片：图标 + 「用 {word} 造句练习」+ 说明，点击 `navigate({ name: 'quiz', direction: 'zh2en', wordId })`。样式与页内已有卡片一致。

### 7. `BottomNav.tsx` + `App.tsx`

- `BottomNav`：`Tab` 增加 `'training'`，tabs 数组在「词库」与「我的」之间插入 `{ id: 'training', label: '训练', Icon: Dumbbell }`（或 `Target`）。
- `App.tsx`：
  - 同步 `Tab` 类型；
  - `tabFromView`：`training` / `quiz` → `'training'`；
  - `handleTabChange` 增加分支；
  - 渲染 `TrainingView` 与 `QuizView`。
- 训练与练习页不需要登录，与现有笔记浏览逻辑一致。

## 验证

1. 预览中底部导航出现四个 tab，点「训练」进入训练首页，图标与文字高亮为 `#2563EB`。
2. 点「短句中译英」→ 出现 10 题，进度条随作答推进。
3. 提交一个明显正确的答案（照抄参考答案）→ 判对；提交空/无关内容 → 判错并显示中文分析与参考答案。
4. 走完 10 题看到结果页；「再来一组」题目重新洗牌。
5. 「短句英译中」按钮为灰态、带「即将上线」标签、点击无跳转。
6. 单词详情页练习入口 → 题目均围绕该单词；返回按钮回到该单词详情页而非训练首页。
7. 检查无 emoji、留白充足、字号/字重未使用 Tailwind text-* / font-* class。
