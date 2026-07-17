# Phase 4 — 验证与修复指南

## 目标

证明生成的目标项目与源项目一致，修复所有不一致项。

---

## 🔴 核心理念：脚本先行，LLM 补漏

Phase 4 的机械检查全部交给脚本——CSS 属性存在性、值偏差、NC 合规、emoji、
复用违规、组件注册完整性。**LLM 的职责是消费脚本输出的结构化报告、执行修复、
处理脚本覆盖不到的语义验证（交互、状态流转）。**

不要在 Phase 4 让 LLM 逐条手敲 Grep 命令——脚本一秒完成的事不要浪费上下文。

### LLM 在 Phase 4 的职责边界

| 做 | 为什么 | 不做 | 为什么 |
|----|--------|------|--------|
| 读取脚本输出，分析真问题 vs 误报 | 脚本基于行级 grep，有跨行漏检 | 逐文件 Grep CSS 值 | diff-source-target.cjs 已覆盖 |
| 对脚本标记问题：Read → Edit → 重新运行脚本 | 修复是语义任务 | 手动 Grep emoji | audit-phase4.sh 第 3 组已覆盖 |
| 交互验证（事件处理器、条件渲染、状态流转） | 脚本无法理解语义 | 手动 Grep NC 合规 | audit-phase4.sh 第 1 组已覆盖 |
| 视觉审查（关键页面是否有明显布局偏差） | 人眼是最终验证 | 手动 Grep 复用违规 | audit-phase4.sh 第 4 组已覆盖 |

### 执行顺序（不可变）

```
Step 0   → audit-phase4.sh                 （脚本 — 7 组机械审计）
Step 0b  → diff-source-target.cjs           （脚本 — 逐文件源→目标 6 维比对）
Step 1   → npm install + build + tsc         （手动 — 依赖+构建+编译）
Step 2   → 启动 dev server + 路由验证        （手动 — 运行时）
Step 3   → 交互清单逐项核对                  （LLM — 语义验证）
Step 4   → 结构完整性检查                    （手动 — 计数）
Step 5   → 阻断式回退（如触发阈值）           （回退 Phase 3）
Step 6   → 重新运行 Step 0 + 0b 确认清零      （脚本）
Step 7   → 输出差异报告                      （LLM 汇总）
```

### 脚本误报处理

审计脚本基于行级 grep。`grep -A2` 无法跨越多行 HTML 属性匹配，
`grep -v '#ifdef H5'` 无法识别跨行条件编译包裹。脚本输出中的问题需要 LLM 逐项验证：

```bash
# 验证 textarea auto-height（跨行匹配）
grep -A10 '<textarea' src/ --include="*.vue" -rn | grep 'auto-height'

# 验证 transition/backdrop-filter 条件编译（跨行包裹）
grep -B2 -A2 'transition:' src/ --include="*.vue" -rn
grep -B2 -A2 'backdrop-filter:' src/ --include="*.vue" -rn
```

脚本确诊率参考：NC-02（input 自闭合）≈ 100%，Emoji ≈ 95%，NC-03 ≈ 60%。
不确定的项用跨行验证命令确认。

## 🔴 Step 0b：逐文件源→目标差异化比对 🆕（阻断关 — 所有后续步骤的前置条件）

> **来源**：2026-07-16 `figma-prototype` → `english-dict-uni` 迁移实战。
> 12 个 Agent 并行生成，CSS 存在性审计全 PASS，但用户反馈"页面样式不一致"。
> 根因：现有审计都是"属性是否存在"——不检查"值是否精确"。
> 必须在 Step 1（静态验证）之前插入此脚本驱动的逐文件 Diff。

### 触发条件

所有迁移项目。Phase 3 使用 Agent 并行生成时**必须执行**。
即使串行生成，也应执行作为第二道防线。

### 执行方式

```bash
# 路径 1（推荐）：有 Phase 2 产出的 design-values.json
node .claude/skills/frontend-refactor/scripts/diff-source-target.cjs \
  --mapping <Phase2产出>/file-mapping.json \
  --design-values <Phase2产出>/design-values.json \
  --target-dir <目标项目目录> \
  --output phase4-output/diff-report.json

# 路径 2（降级）：无 design-values.json — 从源文件反向提取
node .claude/skills/frontend-refactor/scripts/extract-inline-styles.cjs \
  <源项目>/src/ > phase4-output/source-values.json
node .claude/skills/frontend-refactor/scripts/diff-source-target.cjs \
  --source-values phase4-output/source-values.json \
  --target-dir <目标项目目录> \
  --output phase4-output/diff-report.json
```

### Diff 脚本检查 6 个维度

| 维度 | 检测方法 | 典型发现 |
|------|---------|---------|
| **D1: CSS 属性缺失** | 源 `design-values.json` 中有，目标文件 Grep 不到 | `backdrop-filter` 丢了、`padding-top:56px` 漏了 |
| **D2: CSS 值偏差** | 源值 px→rpx 换算后的预期值与目标文件中的实际值不一致 | `font-size: 52rpx` 应为 `68rpx`(34px×2) |
| **D3: 多余 DOM 元素** | 目标中出现了源文件 JSX 不存在的元素/组件 | 空状态凭空加了 `&#xe006;` User 图标 |
| **D4: 缺失 DOM 内容** | 源 JSX 中有目标中没有的结构 | 词库标签 badge 被漏掉 |
| **D5: 文本内容差异** | 源 children 文本与目标 `<text>` 节点文本不一致 | 标题被 Agent 改写或增减 |
| **D6: DOM 结构差异** | 嵌套层级/兄弟顺序与源 JSX 树不一致 | badge 跑到了标题行内联而非释义下方 |

### diff-report.json 格式

```json
{
  "summary": { "totalFiles": 12, "filesWithDiff": 5, "totalDiffs": 18 },
  "files": [
    {
      "targetFile": "pages/home/home.vue",
      "sourceFile": "HomeView.tsx",
      "diffs": [
        {
          "dimension": "D3",
          "severity": "blocker",
          "description": "EmptyState had icon: &#xe006; — no icon in source empty state",
          "fix": "Remove iconChar prop from EmptyState"
        },
        {
          "dimension": "D1",
          "severity": "major",
          "description": "padding-top: 112rpx (56px) missing — header used default 104rpx(52px)",
          "fix": "Add paddingTop=112 to PageHeader props"
        },
        {
          "dimension": "D2",
          "severity": "major",
          "description": "font-size expected 68rpx (34px×2), found 52rpx (26px×2)",
          "fix": "Change .today-card-word font-size from 52rpx to 68rpx"
        }
      ]
    }
  ]
}
```

### LLM 消费 diff-report.json 后的修复流程

```
1. 读取 diff-report.json
2. 对每个有差异的文件，按严重性从高到低排序
3. 🔴 Blocker (D3/D4/D5/D6): 逐项读目标文件 → Edit 修复 → 标记 fixed
4. 🟡 Major (D1/D2, 偏差 > 4rpx): 逐项 Edit 精确值替换 → 标记 fixed
5. 🟢 Minor (D2, 偏差 ≤ 4rpx): 自动 Edit → 标记 fixed
6. 全部修复后 → 重新运行 diff 脚本 → 确认 exit code = 0
```

### 判定标准

| 偏差类型 | 判定 | 处理 |
|---------|------|------|
| D3/D4/D5/D6 — 元素/内容/结构差异 | 🔴 Blocker | 必须修复，报告前清零 |
| D1 — CSS 属性缺失 | 🔴 Blocker | 必须补上 |
| D2 — 值偏差 > 8rpx (4px) | 🔴 Blocker | 必须修正 |
| D2 — 值偏差 4-8rpx (2-4px) | 🟡 Major | 自动修复 |
| D2 — 值偏差 ≤ 4rpx (2px) | 🟢 Minor | 自动修复，记录 |

### 🔴 阻断规则

`diff-report.json` 中任何 🔴 Blocker 差异未清零前，**禁止进入 Step 1**。
这是"源 vs 目标"逐属性精度验证的最后一道防线。

### 修复循环

```
运行脚本 → 产出 diff-report.json → LLM 消费 → 逐项 Edit 修复
→ 重新运行脚本 → 仍有差异？ → 循环直到 exit code = 0
→ 最多循环 3 次。3 次后仍有差异 → 标记文件回退 Phase 3 重生成
```

### 与审计脚本（Step 4.0）的关系

| 检查类型 | audit-phase4.sh | diff-source-target.cjs |
|---------|----------------|----------------------|
| NC-01~NC-14 原生组件合规 | ✅ | — |
| 条件编译包裹检查 | ✅ | — |
| Emoji 扫描 | ✅ | — |
| 复用违规检测 | ✅ | — |
| CSS 属性-值逐文件精确 Diff | — | ✅ |
| DOM 元素存在性 Diff | — | ✅ |
| 文本内容 Diff | — | ✅ |

两个脚本互补——审计脚本检查"模式合规"，Diff 脚本检查"精度一致"。
两个都通过（exit code 均为 0）后，才能进入 Step 1。

### 🆕 NC-14 反向检测（Step 4.0 补充检查）

> **来源**：2026-07-17 第二次 React→uni-app 迁移。PM-M8：WordCard badge 的
> `<text>` 被 Agent 错误地加上了 `display: block`，而源元素是 `<span>`（inline-block）。
> 现有 NC-14 检查是**单向的**——只检查"该有 block 的地方缺了 block"，
> 不检查"不该是 block 的地方写了 block"。

**问题本质**：

NC-14 解决了"`<text>` 替代块级元素时缺 `display: block`"的问题，但 Agent 形成了
"`<text>` → 加 `display: block`"的惯性——对原本是 `inline`/`inline-block` 的元素
也套用了此规则。这导致元素从内容宽度变为父容器全宽，视觉偏差明显但隐蔽。

**检测命令**：

```bash
# 步骤 1：找出所有在 <text> 上使用 display:block 的 CSS 块
grep -rn "display:\s*block" src/components/ src/pages/ --include="*.vue" -B15 | grep -E "<text|display:\s*block" | grep -B1 "display:\s*block"

# 步骤 2：对每个命中，回溯源文件中对应元素的实际 display 值
# 源 <span> / 无 display 声明   → inline → 目标不应有 display:block
# 源 <p> / <h1>~<h6>            → block  → 目标应有 display:block ✅
# 源 <span style="display:inline-block"> → inline-block → 目标应是 inline-block，不是 block
```

**判定规则**：

| 源元素类型 | 源默认 display | 目标 `<text>` 应有的 display | 目标写了 `display: block`？ |
|-----------|-------------|--------------------------|--------------------------|
| `<p>`, `<h1>`~`<h6>` | `block` | `block` ✅ | ✅ 正确 |
| `<span>` 无显式 display | `inline` | 不写（默认 inline） | 🔴 错误 — 应移除 |
| `<span style="display:inline-block">` | `inline-block` | `inline-block` | 🔴 错误 — 应改为 inline-block |
| `<div>` | `block` | 不适用（`<div>` → `<view>`，不是 `<text>`） | — |

**修复**：

```css
/* ❌ 源 <span> → 目标写 block → 元素撑满父容器 */
.badge { display: block; }

/* ✅ 与源一致：inline-block */
.badge { display: inline-block; }

/* ✅ 源 <span> 无显式 display → 不写 display 属性（<text> 默认 inline） */
.badge { /* 无 display 声明 */ }
```

**为什么不自动化**：

此检查无法完全脚本化——需要知道源元素的类型和 display 值。脚本只能找出"目标中哪些 `<text>` 写了 `display: block`"，
但判断"这个 block 是否正确"需要人工比对源文件。Phase 4 中 LLM 应手动执行上述 Grep + 逐项比对。

**与现有 NC-14 检查的关系**：

```
现有 NC-14 检查（单向）  → 找"缺 block"的 <text> → 修复：加 display:block
NC-14 反向检测（新增）   → 找"多 block"的 <text> → 修复：改为 inline-block 或移除
```

---

## Step 1: 静态验证

对目标项目运行以下检查。对失败项进行自动修复。

**🔴 执行顺序不可变**：Step 1a-0（依赖安装）→ Step 1a-1（构建）→ Step 1a-2（TypeScript）。
前一步失败时不得跳到下一步——依赖安装失败时 tsc 必然失败，强行运行是在浪费时间。

### 1a-0. 依赖安装验证 🔴 不可跳过

**这是所有静态验证的前置条件。** 如果依赖没装上，TypeScript 编译、`npm run build`、
开发服务器启动等后续步骤全部无法执行。这一步失败 = 🔴 Blocker。

#### 1a-0-1. 检查 package.json 版本号 🆕

在 `npm install` 之前，先对 `package.json` 中的版本号做基础校验：

```bash
cd <target-project>

# 1. 从 package.json 提取所有依赖的版本号
# 2. 对于使用了 alpha/beta/rc/fixed 精确版本的包，执行 npm view 验证该版本存在
# 3. 对于使用了 ^/~ 语义版本的包，不验证（npm install 会自动选择）

# 示例：验证所有 @dcloudio/* 精确版本（alpha 版本必须从 npm registry 实时获取）
DEPS=$(node -e "
  const pkg = require('./package.json');
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const [name, version] of Object.entries(all)) {
    // 精确版本 (不含 ^ ~ >= <=) 需要验证
    if (!version.match(/^[\^~><=]/)) console.log(name + '@' + version);
  }
")

for dep in $DEPS; do
  if ! npm view "$dep" version >/dev/null 2>&1; then
    echo "❌ $dep — 版本号不存在于 npm registry"
    # 自动获取该包的最新可用版本并填入
  fi
done
```

**常见失败原因**：

| 失败类型 | 表现 | 根因 | 修复方式 |
|---------|------|------|---------|
| **版本号不存在** | `No matching version found for xxx@1.2.3-fake` | Phase 3 生成的 `package.json` 用了不存在的版本号 | `npm view <pkg> versions --json` 获取可用版本列表 → 选最新 stable 或最新 alpha → Edit 修正 |
| **包名拼错** | `404 Not Found - GET xxx` | 包名拼写错误 | 检查正确包名 → Edit 修正 |
| **node 版本不匹配** | `Unsupported engine` | `engines` 字段要求的 node 版本与当前环境不匹配 | 提示用户切换 node 版本；如果是小版本偏差可设 `--ignore-engines` |
| **registry 不可达** | `ETIMEDOUT` / `ENOTFOUND` | npm registry 网络问题 | 换 mirror 源重试：`npm install --registry=https://registry.npmmirror.com` |

#### 1a-0-2. 执行安装

```bash
cd <target-project>
npm install 2>&1
# 检查 exit code
if [ $? -ne 0 ]; then
  echo "🔴 Blocker: npm install 失败，项目不可用。"
  echo "必须回退到 Phase 3 修正 package.json 后重新生成。"
  exit 1
fi
```

> **注意**：如果项目使用 `pnpm` 或 `yarn`（存在 `pnpm-lock.yaml` 或 `yarn.lock`），
> 则使用对应的包管理器安装。检测逻辑：先读项目根目录的 lock 文件类型，再选择命令。

#### 1a-0-3. 失败处理 — 不可盲目批量改版本号

如果 `npm install` 失败：
- 🔴 **禁止**：把所有失败的包盲目改成最新版本（可能引入不兼容的 breaking changes）
- ✅ **正确流程**：分析失败的具体包 → 如果是 `@dcloudio/*` 等框架核心包则用 `npm view` 获取最新 alpha 版本 → 如果是普通依赖则查找与框架版本兼容的版本号
- 🔴 **禁止**：用 `--force` 或 `--legacy-peer-deps` 绕过版本冲突而不理解冲突原因
- ✅ **正确流程**：如果版本号不正确 → 回退到 Phase 3 Layer 8 重新生成 `package.json`（带着正确的版本号信息）

#### 1a-0-4. 出报告

成功时：`"npm install" → ✅ 成功（N packages）`
失败时：`"npm install" → 🔴 Blocker：<失败原因> → 已回退到 Phase 3 修正 <文件>`

### 1a-1. 构建验证

依赖安装成功后，验证项目能否构建：

```bash
cd <target-project>
npm run build 2>&1
```

**常见构建失败原因**：

| 失败类型 | 表现 | 修复方式 |
|---------|------|---------|
| **静态资源缺失** | `Cannot find module 'xxx.ttf' / 'xxx.png'` | 创建最小占位文件（0 字节的 TTF / 1×1 透明 PNG）——但必须在报告中标注"待补充真实资源" |
| **缺少配置文件** | 构建工具报缺少 `pages.json` / `vite.config.ts` 等 | 生成对应的 Layer 6/7/8 配置文件 |
| **框架编译错误** | 语法错误、类型错误 | 回到 1a-2 TypeScript 编译或直接 Edit 修正 |
| **CSS 预处理错误** | Sass/Less 编译失败 | 检查 SCSS 语法，Edit 修正 |

### 1a-2. TypeScript 编译

```bash
cd <target-project>
npx tsc --noEmit 2>&1
```

常见错误及自动修复：
- **缺少 import**：添加对应的 import（从项目结构推断路径）
- **prop 类型错误**：检查组件的实际 interface，调整 prop
- **缺少类型定义**：检查 Level 0 types.ts 中是否存在；若不存在则添加
- **框架 API 不匹配**：使用修正后的迁移规则重新生成该文件

### 1a-2. Import 完整性检查 🆕（静态编译盲区补漏）

> **背景**：某些框架（如 uni-app）将生命周期钩子声明为全局类型，TypeScript 编译
> 不会对缺少 import 报错，但运行时抛出 `ReferenceError: xxx is not defined`。
> 单独的 `tsc --noEmit` 无法发现这类问题，必须用 grep 交叉验证。

#### 检查逻辑

对每个使用了框架特有 API 的源文件，交叉验证对应的 import 是否存在：

```bash
# uni-app: 检查 onLoad 是否有对应 import
grep -rl 'onLoad(' src/pages/ --include="*.vue" | while read f; do
  if ! grep -q "import.*onLoad.*from.*@dcloudio/uni-app" "$f"; then
    echo "❌ $f: onLoad used but not imported from @dcloudio/uni-app"
  fi
done

# uni-app: 检查所有生命周期钩子
for hook in onLoad onShow onReady onHide onUnload onPullDownRefresh onReachBottom; do
  grep -rl "${hook}(" src/ --include="*.vue" | while read f; do
    if ! grep -q "import.*${hook}.*from.*@dcloudio/uni-app" "$f"; then
      echo "❌ $f: ${hook} used but not imported"
    fi
  done
done
```

#### 通用模式（适配任意目标框架）

```
for each framework-specific runtime API that is globally typed:
  1. grep 所有文件中该 API 的调用
  2. 对每个调用文件，grep 对应的 import 语句
  3. 调用存在但 import 不存在 → ❌ 标记并自动修复
```

#### 自动修复

对每个 ❌ 命中的文件，在 `<script setup>` 的 import 区域追加缺失的 import 行：

```
// 在 import { ref } from 'vue' 之后追加
import { <missing-hook> } from '<framework-package>';
```

修复后重新运行检查，确保 0 命中。

### 1b. 构建

```bash
cd <target-project>
npm run build 2>&1
```

构建失败通常是因为：
- 缺少配置文件 → 生成 Level 6 文件
- package.json 中缺少依赖 → 添加对应依赖
- 框架相关的构建错误 → 使用 ctx7 查询错误信息

### 1c. Lint（如果已配置）

```bash
cd <target-project>
npx eslint . --fix 2>&1
```

先用 `--fix` 自动修复 lint 问题。对于剩余问题，修复影响最大的；将次要的样式警告记录在文档中。

### 1d. 启动验证 🔴 关键

构建通过不代表能跑起来。必须实际启动开发服务器进行验证。这是 Phase 4
最重要的步骤之一——如果服务器起不来，之前的步骤都没有意义。

#### 1d-1. 检测启动命令

从 `package.json` 的 `scripts` 中提取 dev 命令：

```bash
# 常见的 dev 命令，按优先级尝试：
npm run dev
pnpm dev
vite
next dev
npm start
```

检测逻辑：先读 `package.json` → 检查 `scripts.dev` 字段 → 如果有则用该命令；
如果没有，根据框架类型推断（Vite 项目用 `vite`，Next.js 用 `next dev`）。

#### 1d-2. 安装依赖

启动前必须先确保依赖已安装：

```bash
cd <target-project>
pnpm install  # 或 npm install / yarn
```

如果 `install` 失败：
- 🔴 **依赖冲突** → 检查 package.json 中的版本号是否合理 → 用 `--force` 重试
- 🔴 **node 版本不匹配** → 检查 `.nvmrc` 或 `engines` 字段 → 提示用户
- 🔴 **网络问题** → 换 registry 源重试

#### 1d-3. 启动开发服务器

```bash
cd <target-project>
npm run dev &
DEV_PID=$!
```

> 注意：使用 `run_in_background` 启动，避免阻塞终端。

#### 1d-4. 轮询等待服务就绪

```bash
# 等待开发服务器启动（最多等 60 秒）
MAX_WAIT=60
INTERVAL=2
ELAPSED=0

while [ $ELAPSED -lt $MAX_WAIT ]; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/ 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" != "000" ] && [ "$HTTP_CODE" != "502" ] && [ "$HTTP_CODE" != "504" ]; then
    echo "✅ 开发服务器就绪 (HTTP $HTTP_CODE, ${ELAPSED}s)"
    break
  fi
  sleep $INTERVAL
  ELAPSED=$((ELAPSED + INTERVAL))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo "❌ 开发服务器启动超时（已等 ${MAX_WAIT}s）"
fi
```

> 端口号从目标项目的构建配置或 dev 命令输出中提取。如果无法自动检测，
> 尝试常见端口：3000, 5173, 8080, 10086, 10089。

#### 1d-5. 验证页面可访问

服务就绪后，测试所有页面路由：

```bash
# 从 Phase 1 分析报告中提取所有路由，逐个测试
PAGES=(
  "/"
  "/word-detail?id=w1"
  "/libraries"
  "/library-words?libraryId=lib1"
  "/profile"
  "/login"
  "/admin"
)

for page in "${PAGES[@]}"; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:<port>${page}" 2>/dev/null)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ $page → HTTP $HTTP_CODE"
  else
    echo "❌ $page → HTTP $HTTP_CODE（需要修复）"
  fi
done
```

#### 1d-6. 检查控制台错误

获取页面 HTML，检查是否包含错误标记：

```bash
# 下载首页 HTML
curl -s http://localhost:<port>/ > /tmp/index.html

# 检查常见错误信号
if grep -q "Cannot GET\|Module not found\|Failed to compile\|Unexpected token\|is not a function" /tmp/index.html; then
  echo "❌ 页面包含运行时错误"
  # 提取错误信息用于诊断
  grep -o "Error: [^<]*" /tmp/index.html | head -5
fi
```

#### 1d-7. 常见启动失败及自动修复

| 错误类型 | 典型输出 | 自动修复方案 |
|---------|---------|-------------|
| **端口被占用** | `Port XXXX is already in use` / `EADDRINUSE` | `taskkill /F /IM node.exe` 或 `lsof -ti :PORT | xargs kill` 后重试 |
| **缺少依赖** | `Cannot find module 'xxx'` | `pnpm install` 安装缺失的包 |
| **模块路径错误** | 同上，但是项目内部文件 | 检查导入路径是否正确 → Edit 修正 import 路径 |
| **配置文件错误** | `Invalid config` / `Configuration error` | 检查 vite.config / next.config / taro config 格式 → 修复或重新生成 |
| **TypeScript 编译错误** | 构建工具内置 tsc 检查失败 | 回到 1a，修复后重试 |
| **JSX/模板语法错误** | `Unexpected token` / `compile error` | 读取出错文件 → 检查语法 → Edit 修复或重新生成 |
| **环境变量缺失** | `process.env.XXX is undefined` | 创建 `.env` 文件，填入缺失变量 |
| **Node 版本不兼容** | `engines` 检查失败 | 提示用户升级/降级 Node 版本 |
| **小程序专用** | 编译失败但无明显错误 | 检查 `project.config.json`、`app.config.ts` 格式 → 对照 Taro 文档修正 |

#### 1d-8. 修复循环

启动失败时的处理流程（最多重试 3 次）：

```
1. 启动开发服务器
2. 等待 60 秒
3. 如果启动成功 → 验证页面 → 进入 Step 2
4. 如果启动失败：
   a. 分析错误日志（从 stderr + 页面 HTML 提取）
   b. 匹配错误类型 → 应用对应的自动修复
   c. 停止失败的进程 → 回到步骤 1
   d. 如果 3 次后仍然失败 → 标记为 🔴 Blocker，在报告中详细记录
```

#### 1d-9. 清理

验证完成后，停止开发服务器：

```bash
taskkill /F /IM node.exe   # Windows
# 或
kill $DEV_PID               # Linux/Mac（使用之前记录的 PID）
```

#### 1d-10. 报告模板

在最终报告中增加启动验证结果：

```markdown
## 启动验证

| 服务 | 状态 | 说明 |
|------|------|------|
| 开发服务器启动 | ✅ / ❌ | 耗时 Xs，端口 XXXX |
| 首页 (/) | ✅ HTTP 200 | — |
| 详情页 (/word-detail) | ✅ HTTP 200 | — |
| 词库页 (/libraries) | ✅ HTTP 200 | — |
| 登录页 (/login) | ✅ HTTP 200 | — |
| 管理后台 (/admin) | ✅ HTTP 200 | — |

### 修复记录（如有）
- 第 1 次启动：❌ 端口 5173 被占用 → 释放端口重试
- 第 2 次启动：✅ 成功，所有页面可访问
```

---

## Step 2: 交互清单审计

这是核心验证步骤。拿 Phase 1 的交互清单，逐一验证每个交互 ID 在生成的目标代码中是否得到正确实现。

### 2a. 自动化审计

对每个交互 ID，运行针对性的 grep 查询：

```bash
# 示例：验证交互 H4（今日一词卡片点击导航到 wordDetail）
cd <target-project>

# 检查：今日一词卡片是否存在？
grep -r "今日一词\|today.*word\|daily.*word" src/

# 检查：是否有导航用的点击处理函数？
grep -r "navigateTo\|navigate\|router.push" <today-word-component>

# 检查：是否传递了 wordId？
grep -r "wordId\|word_id" <today-word-component>
```

构建审计表格：

```markdown
| 交互 ID | 源描述 | 目标文件 | 处理函数已找到 | 状态正确 | 状态 |
|---------------|-------------------|-------------|---------------|----------------|--------|
| H1 | 搜索输入 onChange | pages/home/index.tsx | ✅ onInput={handleSearch} | ✅ | PASS |
| H2 | 搜索输入 focus | pages/home/index.tsx | ❌ 未找到 | — | FAIL |
| H3 | 搜索结果点击 | pages/home/index.tsx | ✅ onClick={goDetail} | ✅ wordId 已传递 | PASS |
| H4 | 今日一词导航 | pages/home/index.tsx | ✅ onClick={goDetail} | ⚠️ 缺少 wordId | FIX |
```

### 2b. 审计类别

对每个交互，验证四个方面：

1. **处理函数存在**：事件处理函数/回调已定义并绑定到对应元素
2. **状态存在**：处理函数读写所需的任何状态变量已定义（useState、ref 等）
3. **行为匹配**：处理函数的行为与源处理函数一致（导航、切换、过滤、提交）
4. **条件匹配**：元素仅在相同条件下渲染，与源保持一致

### 2c. 自动修复失败项

对每个 FAIL 或 FIX 项：

1. 读取生成的目标文件
2. 确定缺失了什么
3. 使用增强的提示词重新生成该文件（或对于简单修复直接编辑）：

```
重新生成 <target-file>。你之前的输出缺失了：
- 交互 <ID>: <描述>。当 <触发条件> 时，必须执行 <行为>。
- 该元素应仅在 <条件> 下渲染。

修复应：
1. 添加缺失的事件处理函数
2. 将其绑定到正确的元素
3. 确保条件渲染逻辑存在
```

---

## Step 2a: 样式关键属性审计（新增）

**这是最容易遗漏的验证步骤，但也是保真度损失最常见的来源。**
交互审计只检查事件处理器和条件分支——不检查样式属性。然而
`backdrop-filter`、半透明背景色、条件编译包裹的 CSS 等属性同样容易遗漏，
且编译器和构建工具无法检测。

### 2a-1. 审计数据来源

从 Phase 1 设计 Token 表的"审计 Grep 模式"和"必须覆盖的文件"字段中提取审计项。
如果 Phase 1 未填写这些字段，则从全局样式强制规则表（Phase 2 步骤 6）中提取。

### 2a-2. 自动化样式审计

对每条全局样式强制规则，对适用文件运行 Grep 检查：

```bash
# 示例：审计规则 G1 — backdrop-filter
# 检查所有页面组件是否包含 backdrop-filter（含 H5 条件编译）

cd <target-project>

# 1. 列出所有包含 .header 或 sticky 定位的文件
grep -rl "position:\s*sticky\|class=\"header\|\.header\s*{" src/ --include="*.vue" --include="*.tsx"

# 2. 检查每个文件是否包含 backdrop-filter
echo "=== 检查 backdrop-filter 覆盖情况 ==="
for file in $(grep -rl "sticky\|header" src/pages/ --include="*.vue"); do
  if grep -q "backdrop-filter" "$file"; then
    echo "✅ $file — backdrop-filter 存在"
  else
    echo "❌ $file — 缺少 backdrop-filter"
  fi
done
```

### 2a-3. 审计矩阵

构建逐规则、逐文件的审计表格：

```markdown
## 样式关键属性审计结果

### G1: 吸顶 header 必须有 backdrop-filter (H5 条件编译)

| 目标文件 | 预期 | 实际 | 状态 |
|---------|------|------|------|
| pages/home/home.vue | `backdrop-filter: blur` | ❌ 未找到 | 🔴 FAIL |
| pages/libraries/libraries.vue | `backdrop-filter: blur` | ✅ H5 条件编译包裹 | ✅ PASS |
| pages/profile/profile.vue | `backdrop-filter: blur` | ❌ 未找到 | 🔴 FAIL |
| pages/word-detail/word-detail.vue | `backdrop-filter: blur` | ✅ H5 条件编译包裹 | ✅ PASS |
| pages/admin/admin.vue | `backdrop-filter: blur` | ✅ H5 条件编译包裹 | ✅ PASS |
| pages/library-words/library-words.vue | `backdrop-filter: blur` | ✅ H5 条件编译包裹 | ✅ PASS |

### G2: header 背景必须是半透明色

| 目标文件 | 预期 | 实际 | 状态 |
|---------|------|------|------|
| pages/home/home.vue | `rgba(255,255,255,0.9)` | ✅ 找到 | ✅ PASS |
| pages/profile/profile.vue | `rgba(255,255,255,0.9)` | ❌ 未登录态无背景 | 🔴 FAIL |
| ... | ... | ... | ... |

### 审计汇总

| 规则 ID | 检查文件数 | 通过 | 失败 | 通过率 |
|---------|----------|------|------|--------|
| G1 | 6 | 4 | 2 | 67% |
| G2 | 6 | 5 | 1 | 83% |
| G3 | 7 | 7 | 0 | 100% |

总计：✅ PASS: 16 | 🔴 FAIL: 3
```

### 2a-4. 自动修复失败项

对每个 FAIL 项，读取目标文件，定位缺失属性对应的样式块，直接 Edit 插入：

```
对 FAIL 项的处理流程：
1. 读取目标文件，找到 .header 或对应的 CSS 类
2. 在适当的位置插入缺失的属性
3. 如果涉及条件编译（如 H5），确保使用 /* #ifdef H5 */ ... /* #endif */ 语法
4. 修复后重新审计该规则（Grep 确认）
5. 更新审计矩阵
```

修复后重新生成审计矩阵，确保所有规则 100% 通过。

### 2a-5. 常见遗漏模式（供参考）

| 遗漏类型 | 典型示例 | 根因 |
|---------|---------|------|
| **条件编译属性** | `backdrop-filter` 只在小程序不安全，但 H5 必须保留 | Agent 可能完全跳过该属性而非添加条件编译 |
| **条件分支丢样式** | 未登录态 `!user` 下 header 的 `:style` 绑定移除了背景 | Vue 模板中 `:style="condition ? a : ''"` 清空了样式 |
| **平台特有值** | CSS 中 `px` 值未转换为 `rpx` | Agent 直接复制了源文件的 px 值 |
| **全局样式遗漏** | `font-family` 只在个别页面设置，未在 App.vue 全局设置 | Agent 用 scoped style，未意识到需要全局设置 |
| **原生组件高度 🆕** | input/textarea 无 height/auto-height → uni-input wrapper 高度 0（NC-01/NC-03） | Agent 认为 padding 足够撑开高度，但原生组件不自动计算 |
| **原生组件自闭合 🆕** | `<input />` 在小程序端不渲染（NC-02） | Agent 按 HTML 习惯写自闭合标签 |
| **包裹容器塌陷 🆕** | border/bg 在容器上但容器高度为 0 → 整个输入区不可见（NC-06） | 多组件组合时未注意原生组件的盒模型特性 |
| **transition 未条件化 🆕** | 小程序端 input 点击无响应（NC-04） | Agent 不知道 transition 触发原生层重绘冲突 |
| **overflow 裁剪原生层 🆕** | 原生输入区域不可点击（NC-05） | Agent 未意识到 overflow: hidden 裁剪了原生渲染层 |

---

## Step 2b: 复用审计（新增）

验证目标项目是否真正使用了 Phase 2 规划的共享抽象。这是"迁移 vs 重构"的分界线——
1:1 迁移保证保真度，复用审计提升代码质量。Phase 3 的 Agent 即便收到了复用约束，
也可能因为各种原因回退为手写，所以必须在 Phase 4 逐项核实。

### 2b-1. 审计数据来源

从 Phase 2 复用分析的"复用约束"清单中提取审计项。

### 2b-2. 自动化复用审计

对每条复用约束，检查适用文件是否确实使用了共享抽象：

```bash
# 示例：审计"页头必须使用 PageHeader 组件"
# 预期：每个页面应该 import { PageHeader } 而非手写 .header 类

cd <target-project>

echo "=== 检查 PageHeader 使用情况 ==="
# 1. 哪些页面 import 了 PageHeader？
grep -rl "import.*PageHeader" src/pages/ --include="*.vue"

# 2. 哪些页面手写了 .header 类（违规）？
echo "--- 手写 .header 的页面（违规） ---"
for file in $(grep -rl "\.header\s*{" src/pages/ --include="*.vue" 2>/dev/null); do
  if grep -q "PageHeader" "$file"; then
    echo "✅ $file — 使用了 PageHeader，.header 是组件内部样式（允许）"
  else
    echo "❌ $file — 手写了 .header 但未使用 PageHeader 组件"
  fi
done

echo ""
echo "=== 检查 SCSS 变量使用情况 ==="
# 3. 哪些文件硬编码了 header padding 值而非使用变量？
grep -rn "padding:\s*\d+rpx\s+\d+rpx.*#\|padding.*104rpx\|padding.*112rpx" src/pages/ --include="*.vue"
```

### 2b-3. 复用审计矩阵

```markdown
## 复用审计结果

### R1: 页头必须使用 PageHeader 组件

| 目标文件 | 预期 | 实际 | 状态 |
|---------|------|------|------|
| pages/home/home.vue | import PageHeader | 手写 .header 类 | 🔴 FAIL |
| pages/libraries/libraries.vue | import PageHeader | 手写 .header 类 | 🔴 FAIL |
| pages/profile/profile.vue | import PageHeader | 手写 .header 类 | 🔴 FAIL |
| pages/word-detail/word-detail.vue | import PageHeader | 手写 .top-bar 类 | 🔴 FAIL |
| pages/library-words/library-words.vue | import PageHeader | 手写 .header 类 | 🔴 FAIL |
| pages/auth/auth.vue | import PageHeader | 手写 .top-nav 类 | 🔴 FAIL |
| pages/admin/admin.vue | import PageHeader | ✅ 已使用（7 次） | ✅ PASS |

### R2: section 标签使用全局 CSS 类 .section-label

| 目标文件 | 预期 | 实际 | 状态 |
|---------|------|------|------|
| pages/home/home.vue | class="section-label" | ❌ 内联 style | 🔴 FAIL |
| pages/word-detail/word-detail.vue | class="section-label" | ✅ 有 .section-label 类 | ✅ PASS |
| pages/admin/admin.vue | class="section-label" | ✅ SLabel 组件 | ✅ PASS |

### R3: 查找词库函数使用 getLibraryById()

| 目标文件 | 预期 | 实际 | 状态 |
|---------|------|------|------|
| pages/home/home.vue | import { getLibraryById } | 内联 mockLibraries.find | 🔴 FAIL |
| pages/word-detail/word-detail.vue | import { getLibraryById } | 内联 mockLibraries.find | 🔴 FAIL |

### 审计汇总

| 规则 ID | 检查文件数 | 通过 | 失败 | 通过率 |
|---------|----------|------|------|--------|
| R1 (PageHeader) | 7 | 1 | 6 | 14% |
| R2 (.section-label) | 3 | 2 | 1 | 67% |
| R3 (getLibraryById) | 2 | 0 | 2 | 0% |

总计：✅ PASS: 3 | 🔴 FAIL: 9
```

### 2b-4. 自动修复失败项

对每个 FAIL 项，读取目标文件并进行重构：

```
对 R1 (PageHeader) 的修复流程：
1. 读取目标文件，找到手写的 .header 模板结构
2. 提取其中的标题、返回按钮、右侧操作等差异化内容
3. 将手写的 .header <view> 替换为 <PageHeader> 组件，差异化内容通过 props/slots 传递
4. 添加 import PageHeader from '../../components/PageHeader.vue'
5. 从 scoped style 中移除 .header 相关 CSS（已由 PageHeader 内部提供）
6. 修复后 Grep 确认该文件不再有独立的手写 .header 类

对 R2 (.section-label) 的修复流程：
1. 找到手写的内联 style
2. 替换为 class="section-label"
3. 确保 App.vue 或全局样式中有 .section-label 的定义

对 R3 (getLibraryById) 的修复流程：
1. 读取文件找到内联的 mockLibraries.find(...)
2. 替换为 getLibraryById(libraryId)
3. 添加 import { getLibraryById } from '../../utils/helpers'
```

修复后重新生成审计矩阵，确保所有复用规则 100% 通过。
注意：如果某个共享抽象确实不适用（如 auth.vue 的结构与 PageHeader 差异太大），
允许标记为"合理例外"并记录原因，但必须有明确的理由。

---

## Step 2c: Emoji 零容忍扫描 🆕（阻断式）

图标保真度是视觉还原的底线。Emoji 替代图标是最常见的退化模式——Agent 在没有明确图标方案时会自行用 emoji 填补。此步骤必须在 Phase 4 执行，并且 **emoji 命中 = 🔴 Blocker，必须全部清零**。

### 2c-1. Emoji 检测

```bash
cd <target-project>

# 扫描所有源文件中使用的高频功能性 emoji
# 排除 node_modules 和静态资源目录
grep -rPn "[🔍✨📖👤🛡⚙🎯🚪📭❌✅➕🔄💡←→↑↓▶◀☰✕✓📋🗑🔒🔓📊👥🏠⭐🔥💎🎨🚀]" src/ --include="*.vue" --include="*.tsx" --include="*.jsx" --include="*.ts"
```

> 注：此正则覆盖了最常见被用作图标替代的 emoji。如需完整扫描，
> 可以用更宽的正则 `[\x{1F300}-\x{1F9FF}\x{2600}-\x{27BF}]`，
> 但可能会命中文案中的合法 emoji 使用。

### 2c-2. 扫描结果分类

对每个命中结果进行分类：

| 分类 | 示例 | 严重性 | 处理方式 |
|------|------|--------|---------|
| **图标替代** | `<text>🔍</text>` 用作搜索图标 | 🔴 Blocker | 替换为 Phase 2 图标映射表指定的方案 |
| **装饰性** | 空状态提示中的 📭 | 🔴 Blocker | 替换为对应图标组件 |
| **文案中** | "恭喜🎉注册成功" | 🟡 Major | 评估是否保留或替换为 iconfont |
| **注释中** | `// TODO: 添加图标` | 🟢 Minor | 移除 emoji 或忽略 |

### 2c-3. 审计矩阵

```markdown
## Emoji 零容忍审计结果

| 文件 | 行号 | Emoji | 分类 | 替换方案 | 状态 |
|------|------|-------|------|---------|------|
| pages/home/home.vue | 12 | 🔍 | 图标替代 | `<uni-icons type="search">` | 🔴 FAIL |
| pages/home/home.vue | 31 | 📭 | 装饰性 | `<EmptyState icon="mail">` | 🔴 FAIL |
| ... | ... | ... | ... | ... | ... |

审计汇总：共发现 N 处 emoji，其中 M 处为图标替代（🔴），需全部替换。
```

### 2c-4. 自动修复

对每个 🔴 FAIL 的 emoji 图标替代项：

```
1. 定位 emoji 字符所在行
2. 从 Phase 2 图标映射表中查找对应的目标实现方案
3. 将 emoji 替换为精确的代码片段（iconfont class + Unicode 码点 / uni-icons 组件）
4. 修复后重新扫描该文件确认 emoji 已移除
```

特殊情况：
- 如果 Phase 2 图标映射表中没有该图标的映射 → 使用占位符 + `/* TODO: 图标待补充 — <用途> */` 注释
- 如果 emoji 在注释中 → 移除即可，不阻塞

### 2c-5. 清零标准

**Emoji 审计必须 100% 通过。** Emoji 替代图标是纯视觉降级——没有任何平台限制能合理解释"为什么必须用 emoji"。因此：
- 任何 🔴 失败项必须在报告前修复
- 修复后重新扫描，确认命中数归零
- 在最终报告中展示"Emoji 扫描：✅ 0 命中"

---

## Step 2g: Input Focus 行为审计 🆕（表单迁移专项）

**这是 Phase 4 最容易被跳过的审计步骤，但也是用户反馈最集中的问题来源。**
交互审计（Step 2）检查事件处理器是否存在，样式关键属性审计（Step 2a）检查
`backdrop-filter` 等特效属性是否存在——但两者都不检查 input focus/blur 的
**行为正确性**：blur 态样式模式是否正确、focus 切换是否使用统一的 composable、
transition 是否正确条件化。

### 2g-1. 审计数据来源

从 Phase 2 步骤 4b（输入框样式模式分类）的表和 Phase 2 的 D8 决策中
提取审计基准。

### 2g-2. 审计矩阵

对每个包含 input/textarea 的文件，逐项检查这 8 个维度：

```markdown
## Input Focus 行为审计结果

| 文件 | @focus | @blur | blur-border | blur-bg | focus-border | useInputFocus | transition H5包裹 | 模式标注 | 判定 |
|------|--------|------|------------|---------|-------------|---------------|------------------|---------|------|
| pages/home/home.vue | ✅ | ✅ | transparent | #F1F5F9 | #2563EB | ✅ | ✅ | INPUT-A ✅ | 🟢 |
| pages/auth/auth.vue | ✅ | ✅ | #E5E7EB | #fff | #2563EB | ✅ | ✅ | INPUT-B ✅ | 🟢 |
| pages/admin/admin.vue | ✅ | ✅ | transparent | #F1F5F9 | #2563EB | ✅ | ✅ | INPUT-A ✅ | 🟢 |
| components/WordEditForm.vue | ✅ | ✅ | transparent | #F1F5F9 | #2563EB | ⚠️ 两套并存 | ✅ | INPUT-A ✅ | 🟡 |

### 审计汇总

| 检查维度 | 检查项数 | 通过 | 失败 | 备注 |
|---------|---------|------|------|------|
| @focus 事件 | N | N | 0 | — |
| @blur 事件 | N | N | 0 | — |
| blur 态 border-color 匹配模式 | N | ... | ... | 对照 Phase 2 步骤 4b 模式表 |
| blur 态 background 匹配模式 | N | ... | ... | 同上 |
| focus 态 border-color = #2563EB | N | ... | ... | — |
| 使用 useInputFocus composable | N | ... | ... | 禁止手写独立 ref（G15） |
| transition 被 H5 条件编译包裹 | N | ... | ... | D8 决策 |
| CSS 中有 INPUT-PATTERN 注释 | N | ... | ... | G14 |
```

### 2g-3. 自动检测（适配多种框架）

```bash
cd <target-project>

# 1. 检查所有 input 是否有 @focus/@blur 事件
echo "=== 缺少 @focus 的 input ==="
grep -B2 '<input\|<Input' src/ --include="*.vue" --include="*.tsx" -rn | grep -v '@focus\|onFocus'

# 2. 检查是否使用 useInputFocus（而非手写 ref）
echo "=== 手写 focus ref（违规 G15） ==="
grep -rn "const.*focused.*=.*ref\|const.*isFocused.*=.*ref\|const.*inputFocus.*=.*ref" src/ --include="*.vue"

# 3. 检查 input blur 态 border-color
echo "=== input 默认 border-color 值 ==="
grep -A10 "\.search-input\|\.form-input\|\.admin-input\|input\s*{" src/ --include="*.vue" --include="*.scss" | grep "border.*solid\|border-color"

# 4. 检查 transition 是否被 H5 条件编译包裹（D8）
echo "=== transition 未条件化（违规 D8） ==="
grep -rn "transition:" src/ --include="*.vue" --include="*.scss" | grep -v "#ifdef H5" | grep -v "//"
# 注：transition 可能用于非 input 元素（合法），需人工判断

# 5. 检查 INPUT-PATTERN 注释是否存在（G14）
echo "=== 缺少 INPUT-PATTERN 注释 ==="
for file in $(grep -rl "input\|Input" src/ --include="*.vue" --include="*.tsx"); do
  if ! grep -q "INPUT-PATTERN" "$file"; then
    echo "❌ $file — 缺少 INPUT-PATTERN 注释"
  fi
done
```

### 2g-4. 常见失败模式

| 失败模式 | 表现 | 根因 | 修复方式 |
|---------|------|------|---------|
| **模式错配** | auth.vue 的 input 用了 transparent 边框而非 #E5E7EB | Agent 选用了错误的 INPUT-A 而非 INPUT-B | Edit 修正 border-color 和 background |
| **无 transition 条件编译** | 小程序端 input 点击无响应 | transition 触发原生层重绘冲突（NC-04） | `/* #ifdef H5 */` 包裹 transition |
| **手写 focus ref** | `const isFocused = ref(false)` 出现在页面组件中 | Agent 没意识到有 useInputFocus composable | 替换为 `useInputFocus()` |
| **两套 focus 机制并存** | WordEditForm 中既有顶层 `wordFocus` composable，又有 `getExtFocus(id)` 动态 map | 扩展字段动态创建 composable 实例，响应式追踪不确定 | 改为统一的字段级 composable 数组 |
| **条件分支丢 focus** | `v-if` / `v-else` 分支中的 input 缺少 `:class` 绑定 | Agent 在复制模板时遗漏了条件分支内的 class 绑定 | Edit 补充 `:class` |

### 2g-5. 判定标准

| 失败项 | 严重度 | 处理方式 |
|--------|--------|---------|
| 模式错配（用了错误的 blur 态样式） | 🟡 Major | Edit 修正 |
| transition 未条件编译 | 🔴 Blocker（小程序端 input 不可用） | `/* #ifdef H5 */` 包裹 |
| 手写 focus ref 而非 useInputFocus | 🟡 Major | 替换为 composable |
| 条件分支丢 focus class | 🟡 Major | Edit 补充 |
| 缺少 INPUT-PATTERN 注释 | 🟢 Minor | Edit 添加注释 |

### 2g-6. 修复后重新审计

修复后重新运行 2g-3 的检测脚本，确保所有检查维度 100% 通过。
如果某个文件在 3 个以上维度失败，不回退到逐项 Edit——直接回退 Phase 3
重新生成该文件，Prompt 中附带当前审计矩阵的失败项清单。

---

## Step 2e: 设计 Token 值级审计 🆕（Value-Level Audit）

**这是 Phase 4 最关键的增强步骤。** Step 2a（样式关键属性审计）只检查"属性是否
存在"（如：header 有没有 backdrop-filter），不检查属性的**值是否正确**（如：
padding 是 20px 还是 24px）。值级审计弥补这个盲区。

### 2e-1. 适用范围与前提

**前提**：Phase 2 步骤 6b 已产出"设计 Token 数值对照表"。如果没有（目标项目不
使用变量体系），则从 Phase 1 设计 Token 表中直接提取审计项。

**适用范围**：所有迁移项目，无论源/目标技术栈。审计维度（padding、gap、
border-radius、font-size 等）是 CSS 的通用概念，与框架无关。差异仅在于：
- 目标单位体系（px / rpx / rem / em）— 换算规则由 Phase 2 确定
- 文件扩展名（.vue / .tsx / .jsx / .svelte / .astro）— 调整 Grep 的 `--include` 参数

### 2e-2. 审计数据来源

从 Phase 2 步骤 6b 产出的"设计 Token 数值对照表"（或 Phase 1 设计 Token 表
直接值）中提取审计项。每项包含：
- CSS 属性名（padding、gap、border-radius、font-size、margin、min-height 等）
- 原型精确值（原始值 + 目标单位换算值）
- 目标文件路径
- 预期的 CSS 选择器或元素

### 2e-3. 自动化值提取脚本（框架无关）

```bash
cd <target-project>

# 根据目标框架调整 include 模式：
# Vue/Nuxt:  --include="*.vue" --include="*.scss"
# React/Next: --include="*.tsx" --include="*.jsx" --include="*.css"
# Svelte:     --include="*.svelte"
# 通用:       --include="*.css" --include="*.scss" --include="*.less"

# 提取所有 padding 值并排序
grep -roh "padding:\s*[^;]*" src/ --include="*.vue" --include="*.scss" --include="*.tsx" --include="*.css" | sort | uniq -c | sort -rn

# 提取所有 border-radius 值
grep -roh "border-radius:\s*[^;]*" src/ --include="*.vue" --include="*.scss" --include="*.tsx" --include="*.css" | sort | uniq -c | sort -rn

# 提取所有 gap 值
grep -roh "gap:\s*[^;]*" src/ --include="*.vue" --include="*.scss" --include="*.tsx" --include="*.css" | sort | uniq -c | sort -rn

# 提取所有 font-size 值
grep -roh "font-size:\s*[^;]*" src/ --include="*.vue" --include="*.scss" --include="*.tsx" --include="*.css" | sort | uniq -c | sort -rn

# 提取 min-height / max-height 值
grep -roh "min-height:\s*[^;]*" src/ --include="*.vue" --include="*.scss" --include="*.tsx" --include="*.css" | sort | uniq -c | sort -rn
```

n### 2e-3 补充 b：原生组件合规检查 🆕

以下脚本专门检查跨平台原生组件陷阱（NC-01 ~ NC-08）。
应在 Phase 4 对所有包含 input/textarea 的文件运行。
详细陷阱说明见 `cross-platform-pitfalls.md`。

```bash
# === NC-01: 检查所有 input 是否有显式 height ===
grep -B10 '<input' src/ --include="*.vue" -rn | grep -v 'height:'

# === NC-02: 检查 input 是否使用自闭合标签 ===
grep -rn '<input[^>]*/>' src/ --include="*.vue"

# === NC-03: 检查所有 textarea 是否有 auto-height ===
grep -B5 '<textarea' src/ --include="*.vue" -rn | grep -v 'auto-height'

# === NC-04: 检查 transition 是否正确条件化 ===
grep -rn 'transition:' src/ --include="*.vue" --include="*.scss" \n  | grep -v '#ifdef H5' | grep -v '//'

# === NC-05: 检查 overflow: hidden 是否正确条件化 ===
grep -rn 'overflow:s*hidden' src/ --include="*.vue" --include="*.scss" \n  | grep -v '#ifdef H5' | grep -v '//'

# === NC-06: 检查包裹容器是否有 min-height ===
# 搜索 *-wrap / *-wrapper 类容器并检查其 CSS
for file in $(grep -rl 'class="[^"]*wrap|class="[^"]*wrapper' src/ --include="*.vue"); do
  echo "=== $file ==="
  grep -A5 'wrap|wrapper' "$file" | grep -E 'min-height|height' || echo "❌ 无 min-height"
done

# === NC-07: 检查中文文本区域使用 <text> 而非 <view> ===
grep -rn '<text[^>]*(meaning|desc|释义|描述)' src/ --include="*.vue"
```


### 2e-3 补充：容器级布局属性提取 🆕

当前 2e-3 的提取维度覆盖了微观值（padding、gap、border-radius、font-size），
但以下**容器级布局属性**是页面结构的骨架——它们决定元素之间的空间关系，
偏差会导致整体布局变形，而非单个元素的外观偏差。

```bash
# === 容器级布局属性提取（新增） ===

# 提取所有 max-width / min-width 值
grep -roh "max-width:\s*[^;]*" src/ --include="*.vue" --include="*.scss" --include="*.tsx" --include="*.css" | sort | uniq -c | sort -rn
grep -roh "min-width:\s*[^;]*" src/ --include="*.vue" --include="*.scss" --include="*.tsx" --include="*.css" | sort | uniq -c | sort -rn

# 提取所有 margin: auto 声明（水平居中）
grep -rn "margin:\s*0\s*auto\|margin-left:\s*auto\|margin-right:\s*auto\|margin:\s*auto" src/ --include="*.vue" --include="*.scss" --include="*.tsx" --include="*.css"

# 提取所有 overflow 值
grep -roh "overflow[^:]*:\s*[^;]*" src/ --include="*.vue" --include="*.scss" --include="*.tsx" --include="*.css" | sort | uniq -c | sort -rn

# 提取所有 box-sizing 声明
grep -rn "box-sizing:" src/ --include="*.vue" --include="*.scss" --include="*.tsx" --include="*.css"

# 提取所有 display 值
grep -roh "display:\s*[^;]*" src/ --include="*.vue" --include="*.scss" --include="*.tsx" --include="*.css" | sort | uniq -c | sort -rn

# 提取所有 flex-direction 值
grep -roh "flex-direction:\s*[^;]*" src/ --include="*.vue" --include="*.scss" --include="*.tsx" --include="*.css" | sort | uniq -c | sort -rn

# 提取所有 align-items 值
grep -roh "align-items:\s*[^;]*" src/ --include="*.vue" --include="*.scss" --include="*.tsx" --include="*.css" | sort | uniq -c | sort -rn

# 提取所有 justify-content 值
grep -roh "justify-content:\s*[^;]*" src/ --include="*.vue" --include="*.scss" --include="*.tsx" --include="*.css" | sort | uniq -c | sort -rn

# 提取所有 position 值
grep -roh "position:\s*[^;]*" src/ --include="*.vue" --include="*.scss" --include="*.tsx" --include="*.css" | sort | uniq -c | sort -rn
```

### 2e-4. 构建审计矩阵

对每个页面/组件文件，列出关键数值属性逐一对比。审计维度**不固定**——不同项目
的高风险属性不同，以下为常见维度和示例：

**审计维度选择指南**（按项目类型调整）：

| 如果项目中存在大量… | 重点审计维度 |
|-------------------|------------|
| 卡片/面板容器 | padding、border-radius、box-shadow 参数 |
| 表单输入区域 | 字段间距(gap)、label margin、textarea min-height |
| 列表/网格布局 | item 间距(gap)、卡片 padding、容器 padding-x |
| 搜索/导航栏 | header padding、输入框 padding/border-radius |
| 文本内容区 | font-size、line-height、margin-bottom |
| 跨平台迁移（Web → 小程序） | max-width、margin:auto、overflow、box-sizing、line-height、position |

### 容器级布局属性审计维度（V-C1 ~ V-C10）🆕

当前 2e 审计覆盖的维度（padding、gap、border-radius、font-size）是"微观值"级。
但以下**容器级布局属性**是页面的"结构骨架"——它们决定了元素之间的空间关系，
偏差会导致整体布局变形：

| 审计维度 | CSS 属性 | 为什么重要 | 在现有 2e 覆盖中？ |
|---------|---------|----------|----------------|
| **V-C1: 容器最大宽度** | `max-width` | 控制页面/卡片在宽屏上的宽度上限——偏差导致阅读体验完全不同 | ❌ 未覆盖 |
| **V-C2: 水平居中** | `margin: auto` / `margin-left: auto; margin-right: auto` | 配合 max-width 实现中央列布局——缺少则内容左对齐 | ❌ 未覆盖 |
| **V-C3: 溢出控制** | `overflow: hidden` / `overflow-x` / `overflow-y` | 控制内容超出容器时的裁剪行为——缺少导致内容溢出或意外滚动 | ❌ 未覆盖 |
| **V-C4: 盒模型** | `box-sizing: border-box` / `content-box` | padding 是否计入元素总宽度——偏差导致元素总尺寸计算错误 | ❌ 未覆盖 |
| **V-C5: 显示类型** | `display: flex` / `grid` / `block` / `inline-block` / `none` | 决定子元素的布局模式——错误的值破坏整个布局 | ❌ 未覆盖 |
| **V-C6: Flex 主轴方向** | `flex-direction: row` / `column` | 决定 flex 子元素的排列方向——反转导致水平变垂直 | ❌ 未覆盖 |
| **V-C7: Flex 交叉轴对齐** | `align-items: stretch` / `center` / `flex-start` / `flex-end` | 决定子元素在交叉轴上的对齐方式——错误导致元素位置偏移 | ❌ 未覆盖 |
| **V-C8: Flex 主轴对齐** | `justify-content: flex-start` / `center` / `space-between` / `space-around` | 决定子元素在主轴上的分布方式 | ❌ 部分通过 2f DOM 结构审计间接检查 |
| **V-C9: 容器最小高度** | `min-height: 100vh` / `min-height: 100%` | 控制页面/区域的最低高度——缺失导致短内容页面的 footer 位置上浮 | ❌ 未覆盖 |
| **V-C10: 定位类型** | `position: relative` / `absolute` / `fixed` / `sticky` | 控制元素的定位上下文——错误导致元素定位基准错乱 | ❌ 未覆盖 |

**示例审计矩阵**（以下为某 React → uni-app 迁移的实际数据，仅作格式参考——
你的项目应填充自己 Phase 1/Phase 2 提取的值）：

```markdown
## 设计 Token 值级审计结果

### V1: 页面级 padding

| 文件 | CSS 属性 | 原型值 | 目标值 | 偏差 | 判定 |
|------|---------|--------|--------|------|------|
| <目标文件路径> | <选择器> <属性> | <原型值(含单位换算)> | <目标 Grep 值> | ±Δ | 🟢/🟡/🔴 |

### V2: 卡片/容器 padding

| 文件 | CSS 类 | 原型值 | 目标值 | 偏差 | 判定 |
|------|--------|--------|--------|------|------|

### V3: 字段间距 (gap / margin)

| 文件 | CSS 类 | 原型值 | 目标值 | 偏差 | 判定 |
|------|--------|--------|--------|------|------|

### V4: border-radius

| 文件 | CSS 类 | 原型值 | 目标值 | 偏差 | 判定 |
|------|--------|--------|--------|------|------|

### V5: font-size

| 文件 | CSS 类 | 原型值 | 目标值 | 偏差 | 判定 |
|------|--------|--------|--------|------|------|

### V6: 元素尺寸 (min-height / width / ...)

| 文件 | CSS 类 | 原型值 | 目标值 | 偏差 | 判定 |
|------|--------|--------|--------|------|------|

### V-C1: 容器 max-width 🆕

| 文件 | CSS 类 | 原型值 | 目标值 | 偏差 | 判定 |
|------|--------|--------|--------|------|------|
| App.vue 全局样式 / `uni.scss` | `.page-container` / `body` | `430px` (860rpx) | 目标 Grep 结果 | ±Δ | 🟢/🟡/🔴 |

### V-C2: 水平居中 margin:auto 🆕

| 文件 | CSS 类 | 原型值 | 目标值 | 状态 |
|------|--------|--------|--------|------|
| App.vue 全局样式 | `.page-container` | `margin: 0 auto` | 目标 Grep 结果 | ✅/❌ |

### V-C3: overflow 控制 🆕

| 文件 | CSS 类 | 原型值 | 目标值 | 偏差 | 判定 |
|------|--------|--------|--------|------|------|

### V-C4: box-sizing 🆕

| 文件 | CSS 类 | 原型值 | 目标值 | 状态 |
|------|--------|--------|--------|------|
| App.vue 全局样式 | `*` / `html` | `border-box`（或 content-box） | 目标 Grep 结果 | ✅/❌ |

### V-C5: display 类型 🆕

| 文件 | CSS 类 | 原型值 | 目标值 | 状态 |
|------|--------|--------|--------|------|

### V-C6: flex-direction 🆕

| 文件 | CSS 类 | 原型值 | 目标值 | 状态 |
|------|--------|--------|--------|------|

### V-C7: align-items 🆕

| 文件 | CSS 类 | 原型值 | 目标值 | 状态 |
|------|--------|--------|--------|------|

### V-C8: justify-content 🆕

| 文件 | CSS 类 | 原型值 | 目标值 | 状态 |
|------|--------|--------|--------|------|

### V-C9: min-height 🆕

| 文件 | CSS 类 | 原型值 | 目标值 | 偏差 | 判定 |
|------|--------|--------|--------|------|------|

### V-C10: position 🆕

| 文件 | CSS 类 | 原型值 | 目标值 | 状态 |
|------|--------|--------|--------|------|
```

### 2e-5. 判定标准（单位无关）

| 偏差（换算为原型 px） | 判定 | 处理方式 |
|---------------------|------|---------|
| 0-2px | 🟢 可接受 | 不处理，记录到 known-issues.md |
| 3-8px | 🟡 Major | 自动 Edit 修正或修改变量/Token 定义 |
| > 8px | 🔴 Blocker | 必须修正。> 8px 视觉上已明显可辨 |

> 判定基于"换算回原型 px 后的偏差绝对值"，与目标项目的单位体系无关。
> 例：目标用 rpx (1px=2rpx)，偏差 16rpx = 8px → 🟡；偏差 20rpx = 10px → 🔴。

### 2e-6. 修复策略（适配多种样式体系）

对每个 🟡/🔴 项，定位偏差来源并修复：

```
1. 定位偏差来源：
   目标项目使用变量体系？
   ├── SCSS/Less 变量     → 偏差来自变量定义值？→ 修正变量文件 → 全局生效
   ├── CSS 自定义属性      → 偏差来自 :root 声明？→ 修正声明 → 全局生效
   ├── Tailwind theme     → 偏差来自 config？→ 修正 theme.extend → 重新生成类
   ├── styled-components  → 偏差来自 theme 对象？→ 修正 theme 定义
   └── 无变量体系          → 偏差来自硬编码值？→ Edit 逐一修正

2. 修正变量时特别注意：
   - 变量值改变会影响所有引用该变量的文件 → 重新运行审计脚本确认全部通过
   - 如果修正后导致其他文件的值变得不对 → 拆分变量（原型中不同页面值不同）

3. 双重嵌套修正（结构问题，不是值问题）：
   - 检查是否有嵌套容器各自添加了 padding
   - 如有 → 移除外层 padding（保留内层），或合并容器
   - 这类问题在 Step 2f DOM 结构审计中也会被捕获
```

### 2e-7. 值级审计汇总

```markdown
### 值级审计汇总

| 审计维度 | 检查项数 | ✅ 通过 | 🟡 偏差 | 🔴 偏差 | 通过率 |
|---------|---------|--------|--------|--------|--------|
| V1 ~ V6（微观值） | ... | ... | ... | ... | ... |
| V-C1 ~ V-C10（容器级属性）🆕 | ... | ... | ... | ... | ... |

总计：✅ X | 🟡 Y | 🔴 Z
```

---

## Step 2f: DOM 结构审计 🆕（Structural Audit）

值级审计能发现 CSS 数值偏差，但不能发现 DOM 结构偏差——元素的嵌套层级、
兄弟顺序、flex 对齐方式等。这种偏差无法通过 Grep 数值来检测，
必须通过"读原型 → 读目标 → 对比结构"来完成。

### 2f-1. 审计维度

| 维度 | 检查内容 | 为什么 Grep 发现不了 |
|------|---------|---------------------|
| 元素父子关系 | 元素 A 的父节点在原型和目标中是否一致 | 子元素和父元素都各自存在，只是关系错了 |
| 兄弟元素顺序 | 同级元素在原型和目标中的排列顺序 | 元素都存在，Grep 不检查顺序 |
| flex 对齐方式 | align-items、justify-content、flex-direction | 属性存在但有值，Grep 不对比值 |
| 嵌套层级深度 | 同一内容区被几层容器包裹 | 每层都正确，但叠加后 padding/margin 失控 |
| 条件渲染对结构的影响 | v-if/v-else 是否改变了元素的 DOM 位置 | Grep 只能找到 v-if，但不知道它改变时 DOM 树是否还正确 |

### 2f-2. 结构审计清单（通用高风险模式）

以下是从多次实际迁移中总结的高风险结构模式。这些模式与具体技术栈无关——
React→Vue、Vue→Svelte、HTML→React 都需要检查。

```markdown
## DOM 结构审计清单 — 通用高风险模式

### S1: 卡片/列表项内部信息架构
原型中卡片通常有多行信息层级（标题行 → 描述行 → 标签行 → 操作行）。
Agent 容易将这些**展平为一行**或**合并不同层级**。
  检查：标签(badge/tag)是否在正确的行？操作按钮是否在独立区域？
  反例：badge 从"描述下方独立行"被移入"标题行内联"

### S2: flex/grid 对齐方式
检查每个使用 display:flex 的容器的：
  - align-items（flex-start / center / stretch）
  - justify-content（flex-start / space-between / center）
  - flex-direction（row / column）
  反例：Agent 把 align-items: flex-start 改成 center 因为"看起来更整齐"

### S3: 表单/搜索区域布局方向
检查同一行内的多个表单控件（输入框+按钮、输入框+图标）的排列方式。
  反例：原型中水平排列的 input+button → Agent 改成了垂直排列

### S4: 嵌套容器层级（双重 padding 元凶）
检查每个页面中包裹内容区的容器嵌套深度。
  方法：在原型中统计从"页面根"到"内容文本"之间有几层带 padding 的容器。
       在目标中同样统计。两数应该相等。
  反例：原型 1 层 padding(24px) → 目标 2 层各 padding(24px) = 实际 48px
```

### 2f-3. 如何针对具体项目填充清单

与值级审计不同，DOM 结构审计的检查项**不能**从设计 Token 表自动推导——
必须通过人工对比原型和目标的 DOM 树来构建。

```
构建步骤：
1. 从 Phase 1 骨架图中提取每个页面/组件的 JSX/模板树
2. 按 S1-S4 四类模式逐一扫描：
   S1: 找到所有卡片/列表项组件，对比其子元素排列
   S2: 找到所有 display:flex 容器，对比其对齐属性
   S3: 找到所有同行表单控件，对比其排列方向
   S4: 找到每个页面的内容区，逐层计数 padding 容器
3. 填充为具体的审计行：
   | 检查项 | 原型结构 | 目标文件 | 目标结构 | 判定 |
```

### 2f-4. 自动化检测（适配多种框架）

```bash
cd <target-project>

# 根据目标框架调整 include 模式
# Vue:  --include="*.vue"
# React: --include="*.tsx" --include="*.jsx"
# Svelte: --include="*.svelte"

# 检测所有 align-items 值
grep -rn "align-items:" src/ --include="*.vue" --include="*.tsx" | sort

# 检测所有 flex-direction 值
grep -rn "flex-direction:" src/ --include="*.vue" --include="*.tsx" | sort

# 检测可能存在双重 padding — 同一文件中 padding 容器的数量
# （数量异常高 = 可能存在冗余嵌套）
for f in $(find src/pages -name "*.vue" -o -name "*.tsx"); do
  count=$(grep -c "padding:" "$f" 2>/dev/null || echo 0)
  if [ "$count" -gt 5 ]; then
    echo "⚠️ $f — $count 处 padding 声明，检查是否有双重嵌套"
  fi
done
```

### 2f-5. 修复策略

DOM 结构偏差不能通过简单的单属性 Edit 修复——通常需要改写模板结构：

```
1. 对于元素父子关系/兄弟顺序偏差：
   - 读取目标文件完整模板
   - 按照原型 DOM 树重新排列元素
   - 相应调整 CSS 选择器

2. 对于 flex 对齐方式偏差：
   - 直接 Edit 修正 align-items / justify-content / flex-direction 值
   - 这是最简单的修复——只改一个 CSS 属性

3. 对于双重嵌套偏差：
   - 检查外层容器是否必需（目标框架要求、路由 layout 等）
   - 非必需 → 合并容器，移除冗余层
   - 必需 → 从内层减掉外层已提供的 padding
```

### 2f-6. 何时触发回退而不是逐项修复

如果某个页面存在 ≥ 3 处结构偏差，不回退到逐项 Edit，而是回退到 Phase 3
重新生成该文件——在 Prompt 中明确指出结构偏差问题并附上原型 DOM 树。
这比逐一 Edit 更高效，因为结构偏差通常是连锁的（改一处可能影响多处 CSS）。

---

## Step 2d: 阻断式审计与回退重生成 🆕

Phase 4 的常规修复策略是"发现问题 → 读取文件 → Edit 逐项修复"。但当某个规则的
**失败率超过阈值**时，逐文件 Edit 的修复质量急剧下降——修复一个文件可能引入
新的不一致。此时回退到 Phase 3 重新生成反而更高效可靠。

### 2d-1. 阈值定义

| 审计类型 | 阻断阈值 | 超过时的处理 |
|---------|---------|------------|
| 交互审计 (Step 2) | 失败率 > 20% | 问题页面回退 Phase 3 重生成，Prompt 中列出缺失的交互 |
| 样式关键属性审计 (Step 2a) | 失败率 > 30% | 涉及的全部文件回退重生成，增强全局样式约束 |
| 复用审计 (Step 2b) | 失败率 > 40% | 涉及的全部文件回退重生成，复用约束前置强调 |
| Emoji 扫描 (Step 2c) | 任何命中 | 逐项替换（Emoji 是点状问题，不触发回退） |
| 值级审计 (Step 2e) 🆕 | 失败率 > 30% | 涉及的全部文件回退重生成，SCSS 变量先修正再重生成 |
| DOM 结构审计 (Step 2f) 🆕 | 单页面 ≥ 3 处偏差 | 该页面回退重生成，Prompt 附原型 DOM 树结构 |
| 原生组件合规审计 🆕 | 任何 NC-01/NC-02/NC-04/NC-05/NC-06 命中 | 🔴 Blocker：命中项必须全部修复——H5 正常、小程序静默失效，不能靠回退解决（pattern issue 而非 file-specific） |

> 失败率 = 失败项数 / 检查项总数。例：G1 规则检查 6 文件，4 通过 2 失败 → 33%，超过 30% 阈值 → 触发回退。

### 2d-2. 回退流程

```
1. 收集触发回退的规则 + 涉及文件列表
2. 构建增强 Prompt：
   - 在 Phase 3 Prompt 最前面加 🔴 警告块：
     "你上一轮的输出在以下规则上失败：<规则列表>。本轮必须确保全部通过。"
   - 将失败的审计项作为交互清单扩展条目注入
3. 仅重新生成涉及的文件（不全量重来）
4. 重生成后立即重新审计该规则
5. 仍失败 → 标记为需人工介入
```

### 2d-3. 回退次数限制

每个文件最多回退 **2 次**。超过后标记为 🟡 Major 已知差异，在报告中说明原因和手动修复建议。

### 2d-4. 回退记录

在最终报告中增加：

```markdown
### 回退重生成记录

| 回退轮次 | 触发规则 | 失败率 | 涉及文件 | 结果 |
|---------|---------|--------|---------|------|
| 1 | G1 (backdrop-filter) | 33% (2/6) | 2 | ✅ 第 2 轮通过 |
| 1 | R1 (PageHeader) | 86% (6/7) | 6 | ✅ 第 2 轮通过 |
```

---

## Step 3: 结构完整性检查

### 3a. 视图/页面数量

```bash
# Source: count page-level components
echo "源页面数: $(count from Phase 1)"
# Target: count page files
echo "目标页面数: $(find src/pages -name 'index.*' | wc -l)"
```

### 3b. 组件数量

```bash
echo "源组件数: $(count from Phase 1)"
echo "目标组件数: $(find src/components -name '*.tsx' -o -name '*.vue' | wc -l)"
```

### 3c. 数据类型数量

```bash
echo "源类型数: $(count from Phase 1 Data Flow)"
echo "目标类型数: $(grep -c 'export interface\|export type' src/data/types.ts)"
```

### 3d. 未映射的文件

```
每个源文件都应有对应的目标文件（或在"未迁移"列表中）。
如果任何源文件两者都没有 → 错误：文件被静默遗漏。
```

### 3e. 框架必备文件检查 🆕

```
从 references/frameworks/<目标框架>.md 的"目标框架必备文件清单"中
提取所有 🔴 必备文件，逐一确认：

| 必备文件 | 是否存在？ | 状态 |
|---------|----------|------|
| index.html | ✅ | PASS |
| package.json | ✅ | PASS |
| ... | ... | ... |

任何 🔴 必备文件缺失 → 🔴 Blocker，报告前生成。
```

---

## Step 4: 导航流程验证

追踪 Phase 1 数据流图中的每一条可能的导航路径：

```markdown
| 路径 | 预期行为 | 实际行为 | 状态 |
|------|----------|--------|--------|
| Home → WordDetail(wordId) | 带 wordId 参数导航 | ✅ | PASS |
| Home → Libraries | 导航到词库页面 | ✅ | PASS |
| Libraries → LibraryWords(libId) | 带 libId 导航 | ✅ | PASS |
| LibraryWords → WordDetail(wordId) | 带 wordId 导航 | ✅ | PASS |
| Profile → Login | 导航到登录页面 | ✅ | PASS |
| Login(onAuth) → Profile | 导航回个人页 | ✅ | PASS |
| Profile(admin) → Admin(overview) | 导航到管理后台 | ✅ | PASS |
| Admin → Profile (exit) | 导航返回 | ✅ | PASS |
```

如果有任何路径出现问题（导航行为不符合预期），则为 🔴 Blocker。

---

## Step 5: 差异报告

### 严重程度分类

| 严重程度 | 判定标准 | 处理方式 |
|----------|----------|----------|
| 🔴 Blocker | 页面缺失、路由损坏、编译错误、构建失败、开发服务器无法启动、框架必备文件缺失、Emoji 替代图标 | 在提交报告前自动修复 |
| 🟡 Major | 交互缺失、样式明显偏离、条件分支遗漏 | 自动修复并在报告中标注 |
| 🟢 Minor | 轻微样式差异、动画时间差异、细微间距差异 | 记录在 known-issues.md 中 |

### 报告模板

```markdown
# 重构验证报告

## 摘要
- 源文件数: 15 → 目标文件数: 18
- 已验证交互数: 47/50 (94% 自动通过)
- 静态检查: TypeScript ✅ | 构建 ✅ | Lint ⚠️ (3 个警告)

## 启动验证
| 服务 | 状态 | 说明 |
|------|------|------|
| 依赖安装 | ✅ | pnpm install 成功 |
| 开发服务器启动 | ✅ | 耗时 3s，端口 5173 |
| 首页 (/) | ✅ HTTP 200 | — |
| 详情页 (/word-detail) | ✅ HTTP 200 | — |
| 词库页 (/libraries) | ✅ HTTP 200 | — |
| 登录页 (/login) | ✅ HTTP 200 | — |
| 管理后台 (/admin) | ✅ HTTP 200 | — |

### 修复记录（如有）
- 第 1 次启动：❌ 端口 5173 被占用 → 释放端口重试
- 第 2 次启动：✅ 成功，所有页面可访问

## 交互审计结果
| 总计 | 通过 | 已修复 | 剩余 |
|-------|------|-------|-----------|
| 50 | 42 | 5 | 3 |

### 样式关键属性审计结果
| 规则 ID | 检查文件数 | 通过 | 失败 | 已修复 |
|---------|----------|------|------|--------|
| G1 backdrop-filter | 6 | 4 | 2 | 2 |
| G2 header 半透明背景 | 6 | 5 | 1 | 1 |
| G3 安全区 padding | 7 | 7 | 0 | 0 |

### Emoji 零容忍扫描 🆕
| 文件 | 行号 | Emoji | 分类 | 替换方案 | 修复状态 |
|------|------|-------|------|---------|---------|
| pages/home/home.vue | 12 | 🔍 | 图标替代 | `<uni-icons type="search">` | ✅ 已修复 |
| pages/home/home.vue | 31 | 📭 | 装饰性 | `<EmptyState>` | ✅ 已修复 |
| ... | ... | ... | ... | ... | ... |

Emoji 扫描汇总：共发现 N 处 emoji（M 处图标替代），已全部替换。✅ 0 命中。

### 复用审计结果
| 规则 ID | 检查文件数 | 通过 | 失败 | 已修复 |
|---------|----------|------|------|--------|
| R1 PageHeader 组件 | 7 | 1 | 6 | 6 |
| R2 .section-label | 3 | 2 | 1 | 1 |
| R3 getLibraryById | 2 | 0 | 2 | 2 |

### 值级审计结果 🆕
| 审计维度 | 检查项数 | ✅ 通过 | 🟡 偏差 | 🔴 偏差 | 通过率 |
|---------|---------|--------|--------|--------|--------|
| V1 页面 padding | 5 | 2 | 1 | 2 | 40% |
| V2 卡片 padding | 5 | 1 | 0 | 4 | 20% |
| V3 字段间距 | 3 | 1 | 2 | 0 | 33% |
| V4 border-radius | 5 | 2 | 1 | 2 | 40% |
| V5 font-size | 3 | 2 | 0 | 1 | 67% |
| V6 textarea 高度 | 3 | 0 | 0 | 3 | 0% |

### DOM 结构审计结果 🆕
| 检查项 | 原型结构 | 目标结构 | 判定 |
|-------|---------|---------|------|
| badge 位置 | 释义下方独立行 | 标题行内联 | ❌ 结构偏差 |
| flex 对齐 | align-items: flex-start | align-items: center | ❌ |
| AI卡片布局 | flex-direction: row | flex-direction: column | ❌ |
| 新增单词页嵌套 | 1层 padding | 2层 padding（双重嵌套） | ❌ |

### 框架必备文件检查 🆕
| 必备文件 | 状态 |
|---------|------|
| index.html | ✅ |
| pages.json | ✅ |
| manifest.json | ✅ |
| main.js | ✅ |
| App.vue | ✅ |
| vite.config.ts | ✅ |
| package.json | ✅ |

### 回退重生成记录 🆕（如有）
| 回退轮次 | 触发规则 | 失败率 | 涉及文件 | 结果 |
|---------|---------|--------|---------|------|
| 1 | R1 (PageHeader) | 86% (6/7) | 6 | ✅ 第 2 轮全部通过 |
| 1 | G1 (backdrop-filter) | 33% (2/6) | 2 | ✅ 第 2 轮全部通过 |

### 已自动修复项（🟡 Major → 已解决）
- H2: 搜索输入 focus 样式 — 添加了 onFocus 处理函数
- A3: 密码可见性切换 — 修正了图标绑定
- AD5: 词库删除确认 — 添加了确认对话框
- AD7: 单词保存导航 — 修复了回调链
- P3: 管理后台入口按钮 — 修正了角色检查
- G1: home.vue 缺少 backdrop-filter — 添加了 H5 条件编译包裹的 blur 属性
- G1: profile.vue 缺少 backdrop-filter — 同上
- G2: profile.vue 未登录态 header 无背景 — 移除了清除背景的条件样式

### 已自动修复项（复用 → 已解决）
- R1: home/libraries/profile/word-detail/library-words/auth 的手写 header 已替换为 PageHeader 组件
- R2: home.vue 的 section 标签内联 style 已替换为 .section-label 类
- R3: home.vue, word-detail.vue 的内联 mockLibraries.find 已替换为 getLibraryById()

### 已记录项（🟢 Minor，详见 known-issues.md）
- W4: SVG PhysicalImage → CSS 渲染 — 渐变透明度存在约 10% 视觉差异
- H1: backdropFilter 模糊 → 替换为半透明纯色背景
- B1: BottomNav position:fixed → 原生 tabBar — 功能一致，视觉上略有差异

## 导航流程
7/7 条路径已验证 ✅

## 建议
1. 查看 known-issues.md 中的 3 处轻微视觉差异
2. 在真机上测试触摸交互
3. 考虑为异步操作添加加载状态
```

---

## Step 6: 生成 known-issues.md

```markdown
# 已知问题与偏差

本文档记录了源项目与目标项目之间，因平台/框架限制而无法实现精确 1:1 映射的
有意偏差。

## 🟢 轻微视觉差异

### 1. SVG 物理图像 → CSS 图形
- **源项目**: 带渐变和 dash 数组的内联 SVG 组件
- **目标项目**: 使用 border、box-shadow、transform 绘制的 CSS 等效图形
- **影响**: 复杂插画上约 10% 的视觉差异（渐变角度、虚线间距）
- **受影响页面**: WordDetailView、AdminView（单词编辑）

### 2. backdropFilter 模糊 → 半透明背景
- **源项目**: 通过 `backdropFilter: 'blur(16px)'` 实现的头部模糊效果
- **目标项目**: 替换为 `rgba(247, 249, 252, 0.94)` 纯色背景
- **影响**: 内容在头部后方滚动时无模糊效果
- **受影响页面**: 所有带粘性头部的页面

### 3. Position Fixed BottomNav → 原生 TabBar
- **源项目**: 使用 `position: fixed` 的自定义 BottomNav
- **目标项目**: 平台原生 tabBar 配置
- **影响**: 功能一致；视觉效果略有不同（平台默认样式）
- **受影响范围**: 全局导航

## 🟢 轻微行为差异

### 4. 输入框 onFocus/onBlur 样式
- **源项目**: 输入框获取焦点时动态改变边框颜色和背景
- **目标项目**: CSS :focus 伪类（在支持的平台上）或已移除
- **影响**: 在不支持的平台上，焦点样式可能略有差异
- **受影响范围**: 搜索输入框、表单输入框

### 5. onKeyDown Enter → onConfirm
- **源项目**: 键盘 Enter 键提交表单
- **目标项目**: Input 组件上的 onConfirm 事件
- **影响**: 移动端功能等效；桌面端 Enter 键可能不生效
- **受影响范围**: AuthView 密码输入框
```
