# 训练答题页：固定底部操作条（保留底部导航）

## Context

当前答题页 `src/app/components/QuizView.tsx` 的主操作按钮（「提交」/「下一题」/「查看结果」，以及完成页的「再来一组」）是跟随内容流的普通按钮，位于长文本输入框和判分反馈之后。当题干较长或判分分析文字较多时，按钮会被推到首屏之外，用户必须滚动才能提交，答题节奏被打断。

目标：把主操作按钮改成固定在视口底部的操作条，且**保留底部导航**——操作条悬浮在 `BottomNav` 之上，两者叠成一个整体的底部区域，用户在任何滚动位置都能直接提交。

## 现状要点

- `src/app/App.tsx:110` 渲染 `QuizView`，外层容器 `src/app/App.tsx:94` 已有 `paddingBottom: 80px`，`src/app/App.tsx:124` 始终渲染 `BottomNav`（`view.name === 'quiz'` 时也在，`tabFromView` 把 quiz 归到 training tab）。
- `src/app/components/BottomNav.tsx:19` 为 `position: fixed; bottom: 0; left: 50%; translateX(-50%); width:100%; maxWidth:430px; zIndex:100`，内部条高 `60px` + `env(safe-area-inset-bottom)`。
- `QuizView.tsx:15` 已有共享样式常量 `primaryButton`（52px 高、圆角 16、`#2563EB`），复用它，不新增按钮样式。
- 答题页与完成页目前都是 `padding:'48px 24px 112px'` / `'52px 24px 112px'`。

## 实施方案

修改文件：仅 `src/app/components/QuizView.tsx`。

1. **新增操作条容器样式常量**（与 `primaryButton` 并列，放在文件底部）：

   ```ts
   const actionBar = {
     position: 'fixed' as const,
     bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
     left: '50%',
     transform: 'translateX(-50%)',
     width: '100%',
     maxWidth: 430,
     boxSizing: 'border-box' as const,
     padding: '12px 24px 14px',
     background: 'rgba(247,249,252,0.92)',
     backdropFilter: 'blur(20px)',
     WebkitBackdropFilter: 'blur(20px)',
     borderTop: '1px solid rgba(0,0,0,0.05)',
     zIndex: 99,
   };
   ```

   - `bottom` 精确对齐 `BottomNav` 的高度（60px 条高 + 安全区），使两者无缝相接。
   - `zIndex: 99` 低于导航的 100，视觉层级正确。
   - 背景与页面底色 `#F7F9FC` 同色 + 毛玻璃，内容滚过时不会露底。

2. **答题页（`QuizView.tsx:12`）**：把末尾的 `<button onClick={submit} style={{...primaryButton, marginTop:20}}>` 从 `<main>` 内容流中移出，包进 `<div style={actionBar}>`，按钮去掉 `marginTop`。同时把 `<main>` 的 `padding` 底部值从 `112px` 提到 `170px`（52 按钮 + 26 上下内边距 + 60 导航 + 余量），避免反馈卡片被操作条遮挡。

3. **完成页（`QuizView.tsx:10`）**：同样处理「再来一组」按钮 —— 移出内容流放入 `actionBar`，`<main>` 底部 padding 由 `112px` 提到 `170px`。「逐题回顾」折叠区仍留在内容流内可滚动。

4. 由于操作条是 `fixed`，`<main>` 的 `minHeight:'100vh'` 与 App 外层容器保持不变，无需改 `App.tsx`。

## 验证

1. 预览中进入「训练」→「短句中译英」，确认：
   - 按钮固定在底部导航正上方，滚动内容时按钮不动。
   - 输入长文本、textarea 拉高后按钮仍可见；提交后判分反馈卡片完整可滚动到，不被操作条盖住。
   - 点「查看结果」进入完成页，「再来一组」同样固定在导航之上；展开「逐题回顾」后列表可滚动，末项不被遮挡。
2. 从单词详情页的专项练习卡片进入答题（带 `wordId`），确认布局一致，返回逻辑不变。
3. 在窄屏（375px）与 430px 宽度下检查操作条宽度与导航对齐、左右 24px 边距一致。
