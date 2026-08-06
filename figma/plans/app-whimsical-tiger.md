# 训练答题页：操作按钮固定在底部

## Context
翻译训练的答题页（`src/app/components/QuizView.tsx`）目前把【提交】/【下一题】按钮放在文档流末尾。提交后会在按钮上方插入一大块判分分析卡片，按钮被顶出可视区域，用户必须手动滚到最底部才能继续答题，节奏被打断。目标：让主操作按钮始终固定在屏幕底部可点，同时分析结果仍可正常滚动阅读。

## 现状
- `QuizView.tsx` 全文写在两行内（超长单行），答题页结构：返回栏 → 进度条 → 题干卡片 → textarea → 判分结果 → 主按钮（`primaryButton`，`marginTop:20`）。
- 页面容器 `padding:'48px 24px 112px'`，`minHeight:100vh`。
- `App.tsx:124` 在 quiz 视图下仍渲染 `BottomNav`（高 60px + 安全区，`position:fixed`，`zIndex:100`）。
- 已有可复用的「固定底栏」样式范式：`WordDetailView.tsx:428-435`（`position:fixed; bottom:calc(60px + env(safe-area-inset-bottom,0px)); left:50%; transform:translateX(-50%); width:100%; maxWidth:430px`）。

## 实施方案
仅改动 `src/app/components/QuizView.tsx`（答题态部分，完成页不动）。

1. **抽出固定操作条**：把结尾的 `<button onClick={submit} …>` 从文档流移入一个固定容器：
   - 容器样式沿用 `WordDetailView.tsx:428` 的定位范式，`bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))'`（BottomNav 之上），`padding:'10px 20px 12px'`，`zIndex: 90`（低于 BottomNav 的 100）。
   - 背景用 `rgba(247,249,252,0.9)` + `backdropFilter:'blur(20px)'` + 顶部 `1px solid rgba(0,0,0,0.05)` 分隔，保持 Apple/Linear 的通透感；按钮本身继续用现有 `primaryButton` 常量，去掉 `marginTop`。
2. **让内容不被遮挡**：答题态主容器底部内边距由 `112px` 改为 `calc(60px + 64px + 24px + env(safe-area-inset-bottom, 0px))`（导航 + 操作条 + 呼吸位），并移除按钮原来的 `marginTop:20`。
3. **提交后滚动**：`submit()` 在生成 `result` 后用 `requestAnimationFrame` 把结果卡片 `scrollIntoView({behavior:'smooth', block:'nearest'})`（结果卡片加 `ref`），保证分析首屏可见；点「下一题」时 `window.scrollTo({top:0, behavior:'smooth'})` 回到题干。
4. **交互细节**：未输入内容时【提交】禁用（`disabled={!result && !input.trim()}`，禁用态 `background:'#C7D2FE'`, `cursor:'not-allowed'`, 去掉阴影），避免固定按钮变成误触区。
5. 完成页（`done` 分支）保持现状，不加固定条。

若后续希望答题时进入无导航的专注模式，只需在 `App.tsx:124` 对 `view.name === 'quiz'` 跳过 `BottomNav` 并把 `bottom` 改为 `env(safe-area-inset-bottom, 0px)`；本次不做。

## 验证
1. 预览中进入「训练」→ 开始「短句中译英」。
2. 不输入内容时确认按钮为禁用态；输入后可提交。
3. 提交后确认：分析卡片出现且自动滚入视野，【下一题】始终固定在底部导航之上、无需滚动即可点击。
4. 输入长文本（撑高 textarea）后再次提交，确认操作条不遮挡 textarea 末尾内容、页面可完整滚到底。
5. 连点到最后一题，确认按钮文案变为「查看结果」并正常进入完成页（完成页布局无变化）。
