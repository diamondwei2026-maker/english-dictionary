#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Phase 4 自动审计脚本 — frontend-refactor skill
# ─────────────────────────────────────────────────────────────────────────────
# 对目标项目执行确定性（机械可验证）的审计检查。不依赖 Phase 1 设计 Token
# 的精确值——那部分由 LLM 辅助的值级审计完成。
#
# 用法:
#   bash audit-phase4.sh <目标项目目录> [--platform <h5-only|mp-only|cross-platform>] [--values <phase2-values.json>]
#
# --values: （🆕 P0-E）Phase 2 产出的精确数值 JSON 文件。提供时启用值级审计（第 6 组），
#           逐文件 Grep 提取实际 CSS 值并与预期值对比。偏差 > 2rpx 标记为 🟡，> 8rpx 标记为 🔴。
#
# 退出码:
#   0 — 全部检查通过
#   1 — 存在 🟡 Major 或 🔴 Blocker 级问题
#   2 — 脚本执行错误（参数缺失、目录不存在）
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ══════════════════════════════════════════════════════════════════════════════
# 参数解析
# ══════════════════════════════════════════════════════════════════════════════
TARGET_DIR=""
PLATFORM="cross-platform"
VALUES_FILE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --platform)
      PLATFORM="${2:-cross-platform}"
      shift 2
      ;;
    --values)
      VALUES_FILE="${2:-}"
      shift 2
      ;;
    -*)
      echo "❌ 未知参数: $1"
      echo "用法: bash audit-phase4.sh <目标项目目录> [--platform h5-only|mp-only|cross-platform] [--values <phase2-values.json>]"
      exit 2
      ;;
    *)
      TARGET_DIR="$1"
      shift
      ;;
  esac
done

if [ -z "$TARGET_DIR" ]; then
  echo "❌ 用法: bash audit-phase4.sh <目标项目目录> [--platform h5-only|mp-only|cross-platform] [--values <phase2-values.json>]"
  exit 2
fi

if [ ! -d "$TARGET_DIR" ]; then
  echo "❌ 目录不存在: $TARGET_DIR"
  exit 2
fi

SRC_DIR="$TARGET_DIR/src"
BLOCKERS=0
MAJORS=0
MINORS=0
CHECKS_RUN=0
CHECKS_PASSED=0

# ══════════════════════════════════════════════════════════════════════════════
# 工具函数
# ══════════════════════════════════════════════════════════════════════════════
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

passed() { echo -e "  ${GREEN}✅ PASS${NC} — $1"; CHECKS_PASSED=$((CHECKS_PASSED + 1)); }
minor()  { echo -e "  ${YELLOW}🟡 MINOR${NC} — $1"; MINORS=$((MINORS + 1)); }
major()  { echo -e "  ${YELLOW}🟡 MAJOR${NC} — $1"; MAJORS=$((MAJORS + 1)); }
blocker(){ echo -e "  ${RED}🔴 BLOCKER${NC} — $1"; BLOCKERS=$((BLOCKERS + 1)); }
run_check() { CHECKS_RUN=$((CHECKS_RUN + 1)); echo -e "\n${CYAN}[检查 $CHECKS_RUN]${NC} $1"; }

# Grep 辅助：搜索 .vue/.ts/.scss/.js 文件，排除 node_modules 和 dist
grep_src() { grep -rn "$1" "$SRC_DIR" --include="*.vue" --include="*.ts" --include="*.scss" --include="*.js" 2>/dev/null || true; }
grep_vue() { grep -rn "$1" "$SRC_DIR" --include="*.vue" 2>/dev/null || true; }
grep_scss(){ grep -rn "$1" "$SRC_DIR" --include="*.vue" --include="*.scss" 2>/dev/null || true; }

# ══════════════════════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════"
echo "  Phase 4 自动审计 — frontend-refactor"
echo "  目标: $TARGET_DIR"
echo "  平台: $PLATFORM"
echo "═══════════════════════════════════════════════════════════════"

# ══════════════════════════════════════════════════════════════════════════════
# 第 1 组：跨平台原生组件合规（NC-01 ~ NC-13）
# 仅在目标为 uni-app / Taro / 小程序时执行
# ══════════════════════════════════════════════════════════════════════════════
if [ "$PLATFORM" != "h5-only" ]; then
echo ""
echo "── 第 1 组：跨平台原生组件合规 ──"

# NC-01: input 缺少显式 height（检查 input CSS 规则块）
run_check "NC-01: input 是否有显式 height"
NC01_HITS=$(grep_scss 'input' | grep -v 'height:' | grep -v '//' | grep -v '/\*' | grep -c 'input' || true)
if [ "$NC01_HITS" -gt 10 ]; then
  major "可能存在 input 未设置 height（命中 $NC01_HITS 处含 input 的 CSS 行，精确审计需人工确认）"
  echo "   → 手动检查: grep -A10 'input' src/ --include='*.vue' -rn | grep -v 'height:'"
else
  passed "input 高度声明覆盖率正常"
fi

# NC-02: input 自闭合标签 <input ... />
run_check "NC-02: input 自闭合标签"
NC02_HITS=$(grep_vue '<input[^>]*/>')
if [ -n "$NC02_HITS" ]; then
  blocker "存在自闭合 <input /> 标签（小程序端不渲染）:"
  echo "$NC02_HITS" | head -5
else
  passed "无自闭合 input 标签"
fi

# NC-03: textarea 缺少 auto-height
run_check "NC-03: textarea 缺少 auto-height"
NC03_HITS=$(grep_vue '<textarea' | grep -v 'auto-height')
if [ -n "$NC03_HITS" ]; then
  blocker "存在 textarea 无 auto-height 属性:"
  echo "$NC03_HITS" | head -5
else
  passed "所有 textarea 均有 auto-height"
fi

# NC-04: transition 未用 H5 条件编译包裹（仅原生组件场景）
run_check "NC-04: transition 未用 #ifdef H5 包裹"
NC04_HITS=$(grep_scss 'transition:' | grep -v '#ifdef H5' | grep -v '#ifndef H5' | grep -v '//' | grep -v '/\*')
if [ -n "$NC04_HITS" ]; then
  NC04_COUNT=$(echo "$NC04_HITS" | wc -l | tr -d ' ')
  if [ "$NC04_COUNT" -gt 3 ]; then
    major "存在 $NC04_COUNT 处 transition 未条件编译（可能影响小程序端原生组件）:"
    echo "$NC04_HITS" | head -5
  else
    minor "存在 $NC04_COUNT 处 transition 未条件编译"
  fi
else
  passed "所有 transition 均已条件编译"
fi

# NC-05: overflow: hidden 未用 H5 条件编译包裹
run_check "NC-05: overflow:hidden 未条件编译"
NC05_HITS=$(grep_scss 'overflow:\s*hidden' | grep -v '#ifdef H5' | grep -v '#ifndef H5' | grep -v '//')
if [ -n "$NC05_HITS" ]; then
  NC05_COUNT=$(echo "$NC05_HITS" | wc -l | tr -d ' ')
  if [ "$NC05_COUNT" -gt 2 ]; then
    major "存在 $NC05_COUNT 处 overflow:hidden 未条件编译:"
    echo "$NC05_HITS" | head -5
  else
    minor "存在 $NC05_COUNT 处 overflow:hidden 未条件编译"
  fi
else
  passed "所有 overflow:hidden 均已条件编译"
fi

# NC-06: 包裹 input 的容器 (.wrap/.wrapper) 是否有 min-height
run_check "NC-06: input 包裹容器 min-height"
NC06_INPUTS=$(grep_vue '<input')
if [ -n "$NC06_INPUTS" ]; then
  # 检查每个 input 的父容器（通过 -B2 查看上下文）是否有 min-height
  NC06_WRAPS=$(grep_vue 'wrap\|wrapper' | grep -c 'min-height' || true)
  if [ "$NC06_WRAPS" -gt 0 ]; then
    passed "input 包裹容器 min-height 覆盖正常"
  else
    minor "部分 input 包裹容器可能缺少 min-height（需手动确认）"
  fi
fi

# NC-07: 长文本块应使用 view 而非 text
# (跳过 — 需要语义分析，脚本不擅)

# NC-08: textarea resize（H5 条件编译即可）
run_check "NC-08: textarea resize"
NC08_HITS=$(grep_scss 'resize:\s*vertical' | grep -v '#ifdef H5' | grep -v '//')
if [ -n "$NC08_HITS" ]; then
  minor "textarea resize:vertical 未条件编译:"
  echo "$NC08_HITS" | head -3
else
  passed "textarea resize 处理正常"
fi

# NC-09~NC-11: WXSS CSS 兼容性（@import url(), * 选择器, html/body 选择器）
if [ "$PLATFORM" != "h5-only" ]; then
  run_check "NC-09~NC-11: WXSS CSS 兼容性"
  NC09=$(grep_scss "@import\s\+url(" | grep -v '#ifdef H5' | grep -v '//' || true)
  NC10=$(grep_scss '^\s*\*\s*{' | grep -v '#ifdef H5' | grep -v '//' || true)
  NC11=$(grep_scss '^\s*html\b\|^\s*body\b\|^\s*#app\s*{' | grep -v '#ifdef H5' | grep -v '//' || true)
  NC_ISSUES=""
  [ -n "$NC09" ] && NC_ISSUES="${NC_ISSUES}NC-09(@import url) "
  [ -n "$NC10" ] && NC_ISSUES="${NC_ISSUES}NC-10(*选择器) "
  [ -n "$NC11" ] && NC_ISSUES="${NC_ISSUES}NC-11(html/body) "
  if [ -n "$NC_ISSUES" ]; then
    blocker "WXSS 不兼容的全局 CSS: $NC_ISSUES"
    [ -n "$NC09" ] && echo "$NC09" | head -3
    [ -n "$NC10" ] && echo "$NC10" | head -3
    [ -n "$NC11" ] && echo "$NC11" | head -3
  else
    passed "WXSS CSS 兼容性正常"
  fi
fi

# NC-12: <text> 中的 \n 需要 white-space: pre-line
run_check "NC-12: <text> 组件中的 \\n 换行"
NC12_HITS=$(grep_vue '\\\\n' | grep '<text' || true)
if [ -n "$NC12_HITS" ]; then
  major "存在 <text> 中包含 \\n 但可能未设置 white-space: pre-line:"
  echo "$NC12_HITS" | head -3
  echo "   → 对每个命中检查对应 CSS 类是否有 white-space: pre-line"
else
  passed "无 <text> \\n 换行问题"
fi
fi  # end cross-platform checks

# ══════════════════════════════════════════════════════════════════════════════
# 第 2 组：样式关键属性存在性审计
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "── 第 2 组：样式关键属性审计 ──"

# G1: backdrop-filter 是否用 H5 条件编译包裹
if [ "$PLATFORM" != "h5-only" ]; then
  run_check "G1: backdrop-filter H5 条件编译"
  BD_HITS=$(grep_scss 'backdrop-filter:' | grep -v '#ifdef H5' | grep -v '#ifndef H5' | grep -v '//' || true)
  if [ -n "$BD_HITS" ]; then
    BD_COUNT=$(echo "$BD_HITS" | wc -l | tr -d ' ')
    blocker "存在 $BD_COUNT 处 backdrop-filter 未用 #ifdef H5 包裹（可能导致小程序 WXSS 解析失败→白屏）:"
    echo "$BD_HITS" | head -5
  else
    passed "所有 backdrop-filter 均已条件编译"
  fi
fi

# cursor: pointer 是否用 H5 条件编译
if [ "$PLATFORM" != "h5-only" ]; then
  run_check "cursor:pointer H5 条件编译"
  CURSOR_HITS=$(grep_scss 'cursor:\s*pointer' | grep -v '#ifdef H5' | grep -v '#ifndef H5' | grep -v '//' || true)
  if [ -n "$CURSOR_HITS" ]; then
    CURSOR_COUNT=$(echo "$CURSOR_HITS" | wc -l | tr -d ' ')
    if [ "$CURSOR_COUNT" -gt 5 ]; then
      major "存在 $CURSOR_COUNT 处 cursor:pointer 未条件编译"
    else
      minor "存在 $CURSOR_COUNT 处 cursor:pointer 未条件编译"
    fi
  else
    passed "所有 cursor:pointer 均已条件编译"
  fi
fi

# ══════════════════════════════════════════════════════════════════════════════
# 第 3 组：Emoji 零容忍扫描
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "── 第 3 组：Emoji 扫描 ──"

run_check "Emoji 零容忍扫描"
EMOJI_PATTERN='[🔍✨📖👤🛡⚙🎯🚪📭✅❌➕🔄💡←→↑↓➡️✕✓🔥⭐💎🎉📌📋🔒🔑🎨🧩🚀💬🗨📝🔔🏠📊📈🗂📁🔗💼🛠🎭🎪📍⚠🚫☑🔶🔷🔸🔹▪▫◾◽]'
EMOJI_HITS=$(grep_src "$EMOJI_PATTERN" | grep -v '//.*emoji' | grep -v '🚫' | grep -v 'NO emoji' || true)
if [ -n "$EMOJI_HITS" ]; then
  blocker "源代码中存在 emoji 字符（禁止用于替代图标）:"
  echo "$EMOJI_HITS" | head -10
else
  passed "零 emoji 命中"
fi

# ══════════════════════════════════════════════════════════════════════════════
# 第 4 组：复用审计 — 共享组件使用率
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "── 第 4 组：复用审计 ──"

# 检查共享组件目录是否存在
COMPONENTS_DIR="$SRC_DIR/components"
if [ -d "$COMPONENTS_DIR" ]; then
  SHARED_COMPS=$(find "$COMPONENTS_DIR" -name "*.vue" -maxdepth 1 2>/dev/null | while read f; do basename "$f" .vue; done)

  for comp in $SHARED_COMPS; do
    # 排除 index.vue 等非组件文件
    case "$comp" in
      index|App) continue ;;
    esac
    run_check "复用: <$comp> 被页面使用情况"
    USAGE=$(grep_vue "$comp" | grep -v "$COMPONENTS_DIR" | wc -l | tr -d ' ')
    if [ "$USAGE" -eq 0 ]; then
      minor "<$comp> 未被任何页面引用（可能是死代码）"
    elif [ "$USAGE" -eq 1 ]; then
      minor "<$comp> 仅被 1 个页面引用（复用价值低，考虑是否应内联）"
    else
      passed "<$comp> 被 $USAGE 处引用"
    fi
  done
else
  minor "共享组件目录 $COMPONENTS_DIR 不存在，跳过复用审计"
fi

# 检查常见手写重复模式（页面中存在 .header 类但未使用 PageHeader）
run_check "复用违规: 手写 .header 替代 PageHeader"
HEADER_HANDWRITTEN=$(grep_vue 'class="[^"]*header' | grep -v 'PageHeader' | grep -v 'page-header' | grep -v 'components/' || true)
if [ -n "$HEADER_HANDWRITTEN" ]; then
  HEADER_COUNT=$(echo "$HEADER_HANDWRITTEN" | wc -l | tr -d ' ')
  major "存在 $HEADER_COUNT 处页面手写 .header 样式（应使用 <PageHeader>）:"
  echo "$HEADER_HANDWRITTEN" | head -5
else
  passed "无手写 header 违规"
fi

# ══════════════════════════════════════════════════════════════════════════════
# 第 5 组：结构完整性
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "── 第 5 组：结构完整性 ──"

run_check "文件结构概览"
PAGES_COUNT=$(find "$SRC_DIR/pages" -name "*.vue" 2>/dev/null | wc -l | tr -d ' ')
COMPONENTS_COUNT=$(find "$SRC_DIR/components" -name "*.vue" -maxdepth 1 2>/dev/null | wc -l | tr -d ' ')
COMPOSABLES_COUNT=$(find "$SRC_DIR/composables" -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
UTILS_COUNT=$(find "$SRC_DIR/utils" -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
echo "  页面: $PAGES_COUNT | 共享组件: $COMPONENTS_COUNT | Composables: $COMPOSABLES_COUNT | 工具: $UTILS_COUNT"
passed "项目结构正常"

# ══════════════════════════════════════════════════════════════════════════════
# 第 6 组：值级审计 🆕（P0-E — 仅在提供 --values 时执行）
# ══════════════════════════════════════════════════════════════════════════════
if [ -n "$VALUES_FILE" ] && [ -f "$VALUES_FILE" ]; then
  echo ""
  echo "── 第 6 组：值级审计（依据 Phase 2 精确数值）──"

  # 用 node 解析 values JSON，逐文件逐属性 Grep 对比
  node -e "
    const fs = require('fs');
    const values = JSON.parse(fs.readFileSync('$VALUES_FILE', 'utf-8'));
    const srcDir = '$SRC_DIR';

    const results = [];
    let total = 0, passed = 0, minor = 0, major = 0, blocker = 0;

    // 遍历每个文件的每个属性
    for (const [filePath, props] of Object.entries(values)) {
      const fullPath = srcDir + '/' + filePath;
      if (!fs.existsSync(fullPath)) {
        results.push({ file: filePath, prop: '(file)', expected: '-', actual: 'FILE_NOT_FOUND', delta: Infinity, severity: 'BLOCKER' });
        blocker++; total++;
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');

      for (const [propName, info] of Object.entries(props)) {
        total++;
        const expected = info.expected;
        const tolerance = info.tolerance || 2; // 默认 ±2 最小单位

        // 构建 Grep 正则：匹配 CSS 属性及其值
        const escapedProp = propName.replace(/-/g, '\\\\-');
        const regex = new RegExp(escapedProp + '\\\\s*:\\\\s*([^;}\\n]+)', 'g');
        const matches = [...content.matchAll(regex)];

        if (matches.length === 0) {
          results.push({ file: filePath, prop: propName, expected, actual: 'NOT_FOUND', delta: Infinity, severity: 'BLOCKER' });
          blocker++;
          continue;
        }

        const actual = matches[0][1].trim().replace(/\\s+/g, ' ');
        const expNorm = expected.replace(/\\s+/g, ' ').trim();
        const actNorm = actual.replace(/\\s+/g, ' ').trim();

        if (expNorm === actNorm) {
          results.push({ file: filePath, prop: propName, expected, actual, delta: 0, severity: 'PASS' });
          passed++;
        } else {
          // 尝试提取数值做模糊对比
          const expNum = parseFloat(expNorm);
          const actNum = parseFloat(actNorm);
          if (!isNaN(expNum) && !isNaN(actNum)) {
            const delta = Math.abs(actNum - expNum);
            let severity = 'PASS';
            if (delta > 8) severity = 'BLOCKER';
            else if (delta > 2) severity = 'MAJOR';
            else severity = 'MINOR';

            if (severity === 'PASS') passed++;
            else if (severity === 'MINOR') minor++;
            else if (severity === 'MAJOR') major++;
            else blocker++;

            results.push({ file: filePath, prop: propName, expected, actual, delta, severity });
          } else {
            // 非数值值（颜色、字符串）精确匹配
            major++;
            results.push({ file: filePath, prop: propName, expected, actual, delta: 'N/A', severity: 'MAJOR' });
          }
        }
      }
    }

    // 输出结果
    for (const r of results) {
      if (r.severity === 'PASS') {
        console.log('✅ ' + r.file + ': ' + r.prop + ' = ' + r.actual + ' (预期 ' + r.expected + ')');
      } else if (r.severity === 'MINOR') {
        console.log('🟡 ' + r.file + ': ' + r.prop + ' = ' + r.actual + ', 预期 ' + r.expected + ' (偏差 ' + r.delta + ')');
      } else if (r.severity === 'MAJOR') {
        console.log('🟡 ' + r.file + ': ' + r.prop + ' = ' + r.actual + ', 预期 ' + r.expected + ' (偏差 ' + r.delta + ')');
      } else {
        console.log('🔴 ' + r.file + ': ' + r.prop + ' = ' + r.actual + ', 预期 ' + r.expected);
      }
    }

    console.log('');
    console.log('SUMMARY:' + total + '|' + passed + '|' + minor + '|' + major + '|' + blocker);
  " > /tmp/audit-values-output.txt 2>&1

  # Parse output and display (read from file to avoid subshell variable loss)
  VAL_PASSED=0; VAL_MINOR=0; VAL_MAJOR=0; VAL_BLOCKER=0; TOTAL=0
  while IFS= read -r line; do
    case "$line" in
      SUMMARY:*)
        TOTAL=$(echo "$line" | cut -d'|' -f1 | cut -d':' -f2)
        VAL_PASSED=$(echo "$line" | cut -d'|' -f2)
        VAL_MINOR=$(echo "$line" | cut -d'|' -f3)
        VAL_MAJOR=$(echo "$line" | cut -d'|' -f4)
        VAL_BLOCKER=$(echo "$line" | cut -d'|' -f5)
        ;;
      ✅*)
        echo -e "  ${GREEN}$line${NC}"
        ;;
      🟡*)
        echo -e "  ${YELLOW}$line${NC}"
        ;;
      🔴*)
        echo -e "  ${RED}$line${NC}"
        ;;
      *)
        echo "  $line"
        ;;
    esac
  done < /tmp/audit-values-output.txt

  # 将值级审计结果汇总到全局计数器
  if [ -n "${VAL_MAJOR:-}" ]; then
    MAJORS=$((MAJORS + VAL_MAJOR))
  fi
  if [ -n "${VAL_BLOCKER:-}" ]; then
    BLOCKERS=$((BLOCKERS + VAL_BLOCKER))
  fi

  run_check "值级审计汇总"
  echo "  检查项: ${TOTAL:-0} | 通过: ${VAL_PASSED:-0} | Minor: ${VAL_MINOR:-0} | Major: ${VAL_MAJOR:-0} | Blocker: ${VAL_BLOCKER:-0}"
elif [ -n "$VALUES_FILE" ]; then
  echo ""
  echo "── 第 6 组：值级审计 ──"
  major "指定的 --values 文件不存在: $VALUES_FILE"
fi

# ══════════════════════════════════════════════════════════════════════════════
# 🆕 第 7 组：组件注册完整性检查（P0-F）
# 检查每个 .vue 文件模板中引用的共享组件是否在 script 中有对应的 import。
# 如果没有 → 组件在运行时渲染为空 HTMLUnknownElement → 按钮/卡片/输入框静默消失。
# 来源：2026-07-17 figma-prototype → english-dict-uni 迁移 — auth.vue 忘记 import
# PrimaryButton，构建/TS/Console 三者均不报错，人眼看到按钮区域为空。
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "── 第 7 组：组件注册完整性 ──"

COMPONENT_REG_BLOCKERS=0
COMPONENT_REG_CHECKS=0

# 共享组件列表（从 Phase 2 复用分析提取 — PascalCase 组件名）
SHARED_COMPONENTS="PageHeader SectionLabel PrimaryButton WordCard EmptyState SearchBar PhysicalImage"

for comp in $SHARED_COMPONENTS; do
  # 找出模板中使用该组件的所有 .vue 文件
  using_files=$(grep -rl "<$comp" "$SRC_DIR" --include="*.vue" 2>/dev/null || true)

  if [ -z "$using_files" ]; then
    continue
  fi

  # 找 import 了该组件的所有 .vue 文件
  importing_files=$(grep -rl "import $comp from\|import $comp " "$SRC_DIR" --include="*.vue" 2>/dev/null || true)

  for uf in $using_files; do
    COMPONENT_REG_CHECKS=$((COMPONENT_REG_CHECKS + 1))
    fname=$(echo "$uf" | sed "s|$TARGET_DIR/||")

    if ! echo "$importing_files" | grep -qxF "$uf"; then
      echo "  🔴 BLOCKER — $fname: 模板中使用了 <$comp> 但缺少 import $comp"
      COMPONENT_REG_BLOCKERS=$((COMPONENT_REG_BLOCKERS + 1))
      BLOCKERS=$((BLOCKERS + 1))
    fi
  done
done

# 同时检查动态组件引用（:is="xxx" 中的组件名）
for comp in $SHARED_COMPONENTS; do
  dynamic_using=$(grep -rl ":is=.*$comp\|'$comp'\|\\\"$comp\\\"" "$SRC_DIR" --include="*.vue" 2>/dev/null || true)
  if [ -z "$dynamic_using" ]; then
    continue
  fi
  importing_files2=$(grep -rl "import $comp from\|import $comp " "$SRC_DIR" --include="*.vue" 2>/dev/null || true)
  for uf in $dynamic_using; do
    COMPONENT_REG_CHECKS=$((COMPONENT_REG_CHECKS + 1))
    fname=$(echo "$uf" | sed "s|$TARGET_DIR/||")
    if ! echo "$importing_files2" | grep -qxF "$uf"; then
      echo "  🔴 BLOCKER — $fname: 动态引用了组件 $comp 但缺少 import $comp"
      COMPONENT_REG_BLOCKERS=$((COMPONENT_REG_BLOCKERS + 1))
      BLOCKERS=$((BLOCKERS + 1))
    fi
  done
done

if [ "$COMPONENT_REG_BLOCKERS" -eq 0 ]; then
  passed "组件注册完整 — 所有共享组件在引用的 .vue 文件中均有对应 import ($COMPONENT_REG_CHECKS 检查)"
else
  echo ""
  echo "  ── 修复提示 ──"
  echo "  对每个标记为 BLOCKER 的文件，在 <script setup> 中添加缺失的 import:"
  echo "    import <组件名> from '@/components/<组件名>.vue';"
  echo ""
  blocker "存在 $COMPONENT_REG_BLOCKERS 个文件缺少组件 import — 运行时对应组件为空 (P0-F)"
fi

# ══════════════════════════════════════════════════════════════════════════════
# 汇总报告
# ══════════════════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  审计完成"
echo "═══════════════════════════════════════════════════════════════"
echo "  总检查数: $CHECKS_RUN"
echo "  ${GREEN}通过${NC}: $CHECKS_PASSED"
echo "  ${YELLOW}🟡 Minor${NC}: $MINORS"
echo "  ${YELLOW}🟡 Major${NC}: $MAJORS"
echo "  ${RED}🔴 Blocker${NC}: $BLOCKERS"
echo ""

if [ "$BLOCKERS" -gt 0 ]; then
  echo -e "${RED}判定: 未通过 — 存在 $BLOCKERS 个 Blocker 级问题，必须在进入 Phase 5 前修复${NC}"
  exit 1
elif [ "$MAJORS" -gt 0 ]; then
  echo -e "${YELLOW}判定: 条件通过 — 存在 $MAJORS 个 Major 级问题，建议修复后重新审计${NC}"
  exit 1
else
  echo -e "${GREEN}判定: 通过 — 所有关键检查均已通过${NC}"
  exit 0
fi
