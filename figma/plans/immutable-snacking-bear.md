# 笔记重构 + 忘记密码方案

---

## 1. 我的笔记 — 二级导航

### 问题
当前 NotesView 把所有笔记平铺展示。需改为：第一级列出有笔记的单词，第二级展示该单词的笔记。

### 方案
在 `NotesView` 内增加本地 state `selectedWordId: string | null`（默认 null）。

**第一级（selectedWordId === null）：单词列表**
- 每个有笔记的单词渲染一张卡片：单词名 + 笔记条数 badge
- 点击卡片 → `setSelectedWordId(wordId)`

**第二级（selectedWordId 已设置）：该单词的笔记**
- 页头显示返回按钮（`setSelectedWordId(null)`）和单词名
- 列出该单词所有笔记（内容 + 时间 + 删除按钮）
- 底部放「查看单词详情」按钮，点击跳转 `navigate({ name: 'wordDetail', wordId })`

### 改动文件
- `src/app/components/NotesView.tsx`：拆成两个内部视图，用 `selectedWordId` 切换

---

## 2. 忘记密码

### 方案
在 AuthView 内部新增 `mode` 状态：`'login' | 'register' | 'forgot'`。当 `tab === 'login'` 时，密码字段下方显示「忘记密码？」文字链，点击切换到 `forgot` 模式。

忘记密码分 3 步，用本地 `step: 1 | 2 | 3` 管理：

**Step 1 — 验证手机号**
- 输入手机号，点击「获取验证码」
- 校验手机号格式，通过后进入 Step 2（模拟发送，300ms 延迟）

**Step 2 — 输入验证码**
- 显示「验证码已发送至 +86 xxx」提示
- 6 位数字输入框（mock：任意 6 位均可通过）
- 通过后进入 Step 3

**Step 3 — 设置新密码**
- 新密码 + 确认密码两个字段
- 校验：两次一致、至少 6 位
- 点击「确认修改」后模拟 600ms 延迟 → 显示成功提示 → 自动切回登录 tab

### 页头处理
- `forgot` 模式下隐藏顶部 Tab 切换器（登录/注册）
- 左上角显示「← 返回登录」按钮切回 `login` tab

### 改动文件
- `src/app/components/AuthView.tsx`：扩展本地状态，新增 `ForgotView` 内部组件或内联分支

---

## 验证
1. 进入我的笔记 → 只看到单词列表，点击单词 → 进入该单词笔记列表
2. 从单词笔记列表点返回 → 回到单词列表
3. 登录页点「忘记密码」→ 进入 Step 1，完整走完三步 → 自动回到登录 tab
4. Step 2 输入非 6 位 → 不可提交；Step 3 两次密码不一致 → 提示错误
