# 样式保真指南

## 目标

确保目标项目的视觉外观与源项目匹配，准确度达到 95% 以上。这意味着颜色、间距、排版、阴影和布局组合必须与源项目无法区分。

---

## 步骤 1：提取设计 Token（在阶段 1 完成）

阶段 1 的设计 Token 文档是视觉契约。每个生成的文件都必须引用这些 Token，而不是创造新的值。

### Token 提取检查清单

分析源项目时，提取以下内容：

- [ ] **调色板**：每个使用的 hex/rgb/hsl 值及其角色
- [ ] **间距刻度**：所有 padding/margin/gap 值（单位 px）
- [ ] **圆角刻度**：所有 border-radius 值
- [ ] **字体栈**：字体系列，何种字体用于何种角色
- [ ] **字号刻度**：所有 font-size 值及其对应的 line-height
- [ ] **字重刻度**：所有 font-weight 值及其使用上下文
- [ ] **阴影刻度**：所有 box-shadow 值及其使用上下文
- [ ] **渐变定义**：所有线性/径向渐变
- [ ] **过渡/动画**：持续时间、缓动函数、属性
- [ ] **z-index 刻度**：z-index 值和层叠上下文
- [ ] **断点**：响应式断点（如有）
- [ ] **不透明度值**：用于状态（禁用、悬停）的任何 opacity 值

### 如何从不同样式系统中提取

#### Tailwind CSS

```bash
# 搜索自定义主题值
grep -r "theme:" tailwind.config.*
# 搜索任意值（方括号表示法）
grep -r "\[.*\]" src/ --include="*.tsx" --include="*.jsx" --include="*.vue"
# 从类使用中提取颜色
grep -roh "bg-\[#[A-Fa-f0-9]\+\]" src/ | sort | uniq
```

#### 内联样式对象（React）

```bash
# 提取所有十六进制颜色
grep -roh "#[A-Fa-f0-9]\{3,8\}" src/ | sort | uniq -c | sort -rn
# 提取常见的 padding 模式
grep -roh "padding: '[^']*'" src/ | sort | uniq -c | sort -rn
```

#### CSS / SCSS / CSS Modules

```bash
# 提取所有颜色值
grep -roh "#[A-Fa-f0-9]\{3,8\}\|rgb([^)]*)\|hsl([^)]*)" src/ | sort | uniq -c | sort -rn
```

---

## 步骤 2：样式映射策略

### 策略 A：内联样式对象 → CSS Modules

这是最常见的情况（React 内联样式迁移到 Vue/CSS-in-JS/Taro）。

```
源：style={{padding:'16px 24px', background:'#fff', borderRadius:'16px'}}
          → 每个文件中有数十个对象

目标策略：
1. 识别重复的样式模式 → 提取为 CSS 类
2. 一次性样式 → 保持内联（如果简单）或创建专用类
3. 动态样式（由状态计算得出）→ CSS 自定义属性或内联样式

转换示例：
  源：style={{padding:'16px 24px', background:'#fff', borderRadius:'16px'}}
  目标 CSS：.card { padding: 16px 24px; background: #fff; border-radius: 16px; }
  目标 JSX：<View className={styles.card}>
```

### 策略 B：Tailwind → CSS Modules / Scoped Styles

```
源：className="px-6 py-4 bg-white rounded-2xl shadow-sm"

目标：如果目标不支持 Tailwind：
  CSS：.card { padding: 24px 24px 16px; background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
  JSX：<View className={styles.card}>

如果目标支持 Tailwind：
  保留这些类。它们已经是框架无关的工具类。
```

### 策略 C：CSS-in-JS（styled-components、Emotion）→ CSS Modules

```
源：
  const Card = styled.div`
    padding: 24px;
    background: ${props => props.active ? '#EFF6FF' : '#fff'};
    border-radius: 16px;
  `;

目标：
  .card { padding: 24px; border-radius: 16px; }
  .cardActive { background: #EFF6FF; }
  .cardInactive { background: #fff; }

  <View className={`${styles.card} ${active ? styles.cardActive : styles.cardInactive}`}>
```

---

## 步骤 3：布局保真

### 识别使用的布局模式

```
模式                         | 源特征                      | 目标方案
─────────────────────────────┼────────────────────────────┼────────────────────────
Flexbox 纵向排列              | flexDirection:'column', gap | 相同（flex 是通用的）
Flexbox 横向排列              | flexDirection:'row'         | 相同
CSS Grid                     | display:'grid'              | 相同（检查支持情况）
绝对定位                      | position:'absolute'         | ⚠️ 在目标上仔细测试
固定定位                      | position:'fixed'            | ⚠️ 小程序：使用原生方案
粘性定位                      | position:'sticky'           | ⚠️ 检查目标平台支持
负边距                        | margin:'-8px'               | ⚠️ 避免使用；重构为 gap
```

### 每个页面的布局保真检查清单

- [ ] 相同的容器宽度 / max-width
- [ ] 相同的 padding（页面级和组件级）
- [ ] 相同的元素间距
- [ ] 相同的对齐方式（居中、左对齐、两端对齐）
- [ ] 相同的滚动行为（overflow、滚动容器）
- [ ] 相同的安全区域处理（顶部刘海、底部指示条）

---

## 步骤 4：平台特定的样式限制

### 小程序 / Taro 限制

```
❌ backdropFilter       → 替换为纯色背景 + opacity
❌ position: fixed      → 使用原生 tabBar / navigationBar；避免任意固定元素
❌ CSS 渐变（部分）       → 在真机上测试；linear-gradient 通常可用
❌ SVG 内联              → 替换为 CSS 形状、Canvas 或图片资源（完整图标策略见 `references/icons.md`）
❌ :hover/:focus        → 不可用；使用点击事件
❌ overflow: overlay    → 使用 scroll-view 组件
❌ CSS 动画              → 复杂动画使用框架的动画 API
⚠️ box-shadow           → 对性能敏感；谨慎使用
⚠️ z-index              → 层叠上下文不同；充分测试
⚠️ backdrop-filter      → 不支持；使用 rgba 背景作为降级方案
⚠️ position: sticky     → 支持有限；在真机上测试
⚠️ vh 单位              → 100vh 可能包含浏览器 UI；使用 100% 或 calc 配合 env()
```

### Vue 2 → Vue 3 限制

```
❌ v-deep 语法变更        → ::v-deep → :deep()
❌ filter 已移除           → 使用计算属性
❌ $on/$off 已移除         → 使用 mitt 或组合式函数
⚠️ v-model 变更           → .sync → v-model:propName
⚠️ 函数式组件              → 已移除；使用普通组件
```

### React → Next.js 限制

```
⚠️ useEffect 执行时机       → 开发模式下运行两次（StrictMode）；确保幂等
⚠️ window/document 访问     → 必须用 typeof window !== 'undefined' 守卫
⚠️ CSS-in-JS                → 如果使用 RSC，需要 'use client' 指令
⚠️ 图片优化                  → 使用 next/image 替代 <img>
```

---
n## 步骤 4b：原生组件样式陷阱 🆕

当目标平台包含原生组件（小程序、React Native、uni-app 非 H5 端等），
以下 CSS 属性和 HTML 模式必须逐项检查。完整陷阱清单与修复模板见
`references/cross-platform-pitfalls.md`。

### 4b-1. 快速检查清单

- [ ] 所有 `<input>` / `<Input>` 有显式 `height`（NC-01）
- [ ] 所有 `<input>` / `<Input>` 使用闭合标签 `></input>`（NC-02）
- [ ] 所有 `<textarea>` / `<Textarea>` 有 `auto-height`（如需自适应）（NC-03）
- [ ] 所有原生组件的 CSS `transition` 用条件编译包裹（NC-04）
- [ ] 所有原生组件父容器的 `overflow: hidden` 用条件编译包裹（NC-05）
- [ ] 包裹容器的 `min-height` 与内部 input 的 `height` 一致（NC-06）
- [ ] 长文本使用 `<view>` 而非 `<text>`（跨平台换行一致性）（NC-07）
- [ ] 原生组件的 `:hover` / `:focus` 伪类已移除或条件化
- [ ] `resize` 属性已从 `<textarea>` 移除（NC-08）

### 4b-2. 自动检测（Grep 模式）

```bash
# 检测：input 无 height
grep -A10 '<input' src/**/*.vue | grep -v 'height:'

# 检测：input 自闭合
grep -rn '<input[^>]*/>' src/ --include="*.vue"

# 检测：textarea 无 auto-height
grep -B5 '<textarea' src/**/*.vue -rn | grep -v 'auto-height'

# 检测：transition 未条件化
grep -rn 'transition:' src/ --include="*.vue" --include="*.scss" | grep -v '#ifdef H5' | grep -v '//'

# 检测：overflow: hidden 未条件化
grep -rn 'overflow:s*hidden' src/ --include="*.vue" --include="*.scss" | grep -v '#ifdef H5' | grep -v '//'

# 检测：可能塌陷的包裹容器
grep -rn 'class="[^"]*wrap|class="[^"]*wrapper' src/ --include="*.vue"
```

### 4b-3. 为什么本步骤必要

传统样式审计只要回答了"属性是否存在"——例如 `grep "height"` 通过了，
但如果 height 值是因为 padding/line-height 在 H5 上自动推算出来的，
在小程序上这个推算不成立。这是**跨平台迁移独有的保真度陷阱**：
在 H5 开发服务器上一切正常，部署到真机后静默失效。

因此在 Phase 1 设计 Token 提取时必须标注原生组件受限属性，
Phase 2 必须派生原生组件合规规则（G9~G13），
Phase 4 必须逐文件检查原生组件模式安全性（而非仅检查属性存在性）。


## 步骤 5：视觉抽查

当目标项目可运行时，抽查以下高风险区域：

### 高风险视觉元素

1. **渐变** — 迁移过程中容易出错（角度错误、色标错误）
2. **阴影** — 经常遗漏颜色不透明度或模糊半径
3. **嵌套元素的圆角** — 裁剪行为不同
4. **文本截断** — 省略号、line-clamp 行为
5. **遮罩层/模态框** — z-index 层叠、背景遮罩、动画
6. **粘性头部** — 偏移量、背景不透明度
7. **安全区域内边距** — 尤其是在刘海屏手机上
8. **字体渲染** — 后备字体、line-height、letter-spacing
9. **响应式断点** — 如果源项目有的话
10. **暗色模式 / 主题切换** — 如果支持的话

---

## 步骤 6：样式审计脚本

使用以下方法以编程方式验证样式保真：

```bash
# 1. 从目标项目中提取所有颜色并与源 Token 进行比较
grep -roh "#[A-Fa-f0-9]\{6\}" <target-project>/src/ | sort | uniq > target-colors.txt
diff source-tokens.txt target-colors.txt

# 2. 检查残留的源框架模式
#    （例如，在非 React 目标中检查 React 内联样式对象）
grep -r "style={{" <target-project>/src/  # 对于 Vue/Taro 目标，应无任何返回

# 3. 检查应使用 Token 的硬编码值
#    （例如，硬编码的 #2563EB 而不是 var(--primary)）
```

---

## 步骤 7：值级保真 — 为什么"属性存在 ≠ 值正确" 🆕

这是整个样式保真指南中最重要的新增内容。传统审计方法（包括本指南
步骤 6 和 phase4-verification Step 2a）只检查"某个 CSS 属性是否存在"——
例如 `grep "backdrop-filter"` 检查 blur 是否被保留。但这**完全不检查
属性的值是否正确**。

### 7a. 存在性检查 vs 值级检查

```
存在性检查（当前方法）：
  grep "padding:" src/pages/home/index.tsx
  → 找到了 "padding: 24px 20px" ✅ PASS
  → 但没有检查 24px 和 20px 是否与原型一致

值级检查（新增方法）：
  grep -o "padding:\s*[0-9]*px" src/pages/home/index.tsx
  → 实际值: 24px
  → 原型值: 20px
  → 偏差: +4px ❌ FAIL
```

这种方式与框架和单位体系无关——无论目标是 Vue+SCSS(rpx)、React+Tailwind(rem)、
还是 Svelte+CSS(px)，比较逻辑都一样：**提取值 → 换算 → 对比 → 判定**。

### 7b. 系统性偏差的三个来源（框架无关）

#### 来源 1：样式变量 / 设计 Token 语义偏差

Agent 选择变量时基于**语义相似**而非**数值精确**：
- 原型 `padding: 20px` — 一个"看起来像大卡片"的 padding
- SCSS 项目中 Agent 选用 `$card-p-lg: 24px`
- Tailwind 项目中 Agent 选用 `p-6` (24px) 而非 `p-5` (20px)
- CSS 自定义属性项目中 Agent 选用 `var(--space-lg): 24px`
- 所有情况下偏差都是 4px，Grep 存在性检查全部通过

**防线**：Phase 2 步骤 6b 的变量数值交叉验证（适用所有变量体系）

#### 来源 2：语义舍入偏差

Agent 或开发者在定义 Token 时进行了"语义舍入"：
- `14px` → 变成 `12px`（凑整为 3 的倍数）
- `13px` → 变成 `14px`（向上取整到偶数）
- `11px` → 变成 `10px`（向下取整到整数）

这在 Tailwind 项目中尤其常见——非标准值（如 `13px`）在 Tailwind 中没有现成类，
Agent 倾向于用最近的预设值（`text-sm = 14px` 或 `text-xs = 12px`）代替。

**防线**：Phase 2 步骤 6b 的偏差判定标准（> 2px 即标记）+ Phase 4 值级审计

#### 来源 3：结构性叠加偏差（与样式体系无关）

多个独立的 CSS 规则叠加后产生原型中不存在的效果：
- 外层容器 `padding: 24px` + 内层容器 `padding: 24px` = 实际 48px
- 原型只有一层容器 `padding: 24px`
- 每层单独审计都"正确"，但叠加值是原型的 2 倍

这在所有框架中都会发生，与样式体系无关——React 的 JSX 嵌套、Vue 的 template
嵌套、Svelte 的组件嵌套都可能导致。

**防线**：Phase 3 第三节 b 的"避免不必要嵌套"规则 + Phase 4 Step 2f DOM 结构审计

### 7c. 值级提取方法论（框架无关）

对于每个源文件，不应只提取"有哪些属性"，必须提取"每个属性的精确值"。
提取格式适用于任何源样式系统——内联 style、CSS Modules、Tailwind 类、styled-components 等。

**通用提取格式**：

```markdown
## 源文件值级提取

| 源位置 | CSS 属性 | 原始值 | 目标换算值 | 语义 | 是否应映射到变量 |
|-------|---------|--------|-----------|------|---------------|
| <文件:行号> | <属性> | <源值+单位> | <目标值+单位> | <此值的使用场景> | 是/否 — 变量名 |
```

**针对不同源样式系统的提取技巧**：

| 源样式系统 | 提取方法 |
|-----------|---------|
| 内联 style 对象 | `grep -roh "padding:\s*'[^']*'" src/` 或读源码逐行提取 |
| Tailwind 类 | `grep -roh "p-[0-9]*\|px-[0-9]*\|py-[0-9]*" src/`，然后查 Tailwind 默认 spacing 表换算为 px |
| styled-components | 读模板字面量中的 CSS 属性值，同普通 CSS |
| CSS Modules / .css | `grep -roh "<property>:\s*[^;]*" src/` |
| SCSS 变量引用 | 追踪到变量定义文件，提取定义值（非引用名） |

### 7d. 值级提取的输出格式

值级提取结果应作为 Phase 1 设计 Token 文档的**扩展表格**，包含以下列：
- 源位置（文件名:行号）
- CSS 属性名
- 原始值（含源单位）
- 目标换算值（含目标单位，换算规则由 Phase 2 确定）
- 语义描述
- 在目标项目中是否应映射到变量/Token（是/否）
- 如映射，对应的变量名及其**实际定义值**
- 偏差标记（自动计算：目标换算值 - 变量定义值）

### 7e. 与后续阶段的衔接

- Phase 1 产出的值级提取表 → Phase 2 步骤 6b 用此表与变量定义值交叉验证
- Phase 2 步骤 6b 产出的修正后数值对照表 → Phase 4 Step 2e 值级审计的基准
- Phase 4 Step 2e 每一条记录都用 Grep 验证：
  - 属性是否存在 → 存在性检查（已有）
  - **属性值是否在 ±2px 偏差范围内** → 值级检查（新增）
  - 如果值来自变量 → 变量定义值是否正确（新增，由 Phase 2 步骤 6b 保证）
