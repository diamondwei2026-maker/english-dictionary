#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Phase 3 Layer 2 组件验证关 — verify-component.sh
# ─────────────────────────────────────────────────────────────────────────────
# 在 Layer 2 每个共享组件生成后立即运行，通过后才能生成下一个组件。
# 此脚本验证组件中的关键 CSS 值是否与 Phase 2 设计规格一致——
# 阻止偏差从 Layer 2 传播到 6+ 个页面。
#
# 用法:
#   bash verify-component.sh <component-file> <phase2-spec.json> <component-name>
#
# spec.json 格式 (Phase 2 产出):
#   {
#     "components": {
#       "PageHeader": {
#         "props": { "bgType": "white|gray|none", "showBack": "boolean", ... },
#         "css": {
#           "padding-bottom": { "expected": "32rpx", "selector": ".page-header" },
#           "font-size": { "expected": "28rpx", "selector": "&__back-label" }
#         },
#         "slots": ["title", "subtitle", "right"]
#       },
#       ...
#     }
#   }
#
# 退出码:
#   0 — 全部检查通过，可以继续生成下一个组件
#   1 — 存在偏差，必须修复后重新验证
#   2 — 脚本执行错误
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

COMPONENT_FILE="${1:-}"
SPEC_FILE="${2:-}"
COMPONENT_NAME="${3:-}"

if [ -z "$COMPONENT_FILE" ] || [ -z "$SPEC_FILE" ] || [ -z "$COMPONENT_NAME" ]; then
  echo "❌ 用法: bash verify-component.sh <component-file> <phase2-spec.json> <component-name>"
  exit 2
fi

if [ ! -f "$COMPONENT_FILE" ]; then
  echo "❌ 组件文件不存在: $COMPONENT_FILE"
  exit 2
fi

if [ ! -f "$SPEC_FILE" ]; then
  echo "⚠️  规格文件不存在: $SPEC_FILE — 跳过值级验证，仅做结构检查"
  SPEC_MODE="structural"
else
  SPEC_MODE="full"
fi

PASSED=0
FAILED=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "═══════════════════════════════════════════════════════════════"
echo "  Layer 2 组件验证: $COMPONENT_NAME"
echo "  文件: $COMPONENT_FILE"
echo "═══════════════════════════════════════════════════════════════"

# ── 结构检查（无 spec 时也执行） ──────────────────────────────────────
echo ""
echo "── 结构检查 ──"

# 1. 脚本必须有 defineProps 或 defineEmits
if grep -q 'defineProps\|defineEmits' "$COMPONENT_FILE"; then
  echo -e "  ${GREEN}✅${NC} defineProps/defineEmits 存在"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${YELLOW}⚠️${NC} 组件未声明 defineProps/defineEmits（可能是纯展示组件）"
fi

# 2. scoped style 存在
if grep -q 'scoped' "$COMPONENT_FILE"; then
  echo -e "  ${GREEN}✅${NC} scoped style 存在"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${YELLOW}⚠️${NC} 缺少 scoped style"
fi

# 3. 检查是否使用了全局 SCSS 变量（$xxx）
SCSS_VAR_COUNT=$(grep -c '\$[a-z]' "$COMPONENT_FILE" 2>/dev/null || echo "0")
echo "  ℹ️  使用了 $SCSS_VAR_COUNT 处 SCSS 变量"

# ── 值级验证（需要 spec 文件） ────────────────────────────────────────
if [ "$SPEC_MODE" = "full" ]; then
  echo ""
  echo "── 值级验证（依据 Phase 2 设计规格） ──"

  # 用 node 解析 JSON 并逐项 Grep 验证
  node -e "
    const fs = require('fs');
    const spec = JSON.parse(fs.readFileSync('$SPEC_FILE', 'utf-8'));
    const compSpec = spec.components && spec.components['$COMPONENT_NAME'];

    if (!compSpec || !compSpec.css) {
      console.log('NO_SPEC');
      process.exit(0);
    }

    const fileContent = fs.readFileSync('$COMPONENT_FILE', 'utf-8');
    let passed = 0;
    let failed = 0;

    for (const [prop, info] of Object.entries(compSpec.css)) {
      const expected = info.expected;
      // Grep 文件中包含此 CSS 属性的行，提取实际值
      const regex = new RegExp(prop.replace('-', '\\\\-') + '\\\\s*:\\\\s*([^;]+)', 'g');
      const matches = [...fileContent.matchAll(regex)];

      if (matches.length === 0) {
        console.log('MISSING:' + prop + '|expected=' + expected + '|actual=NOT_FOUND');
        failed++;
        continue;
      }

      const actual = matches[0][1].trim();
      const expectedNormalized = expected.replace(/\s+/g, ' ').trim();
      const actualNormalized = actual.replace(/\s+/g, ' ').trim();

      if (expectedNormalized === actualNormalized) {
        console.log('PASS:' + prop + '|expected=' + expected + '|actual=' + actual);
        passed++;
      } else {
        console.log('FAIL:' + prop + '|expected=' + expected + '|actual=' + actual);
        failed++;
      }
    }

    console.log('SUMMARY:' + passed + '|' + failed);
  " 2>&1 | while IFS= read -r line; do
    case "$line" in
      NO_SPEC)
        echo "  ℹ️  规格文件中未找到组件 '$COMPONENT_NAME' 的 CSS 定义，跳过值级验证"
        ;;
      PASS:*)
        # Format: PASS:prop|expected=X|actual=Y
        PROP=$(echo "$line" | cut -d'|' -f1 | cut -d':' -f2)
        EXPECTED=$(echo "$line" | cut -d'|' -f2 | cut -d'=' -f2)
        ACTUAL=$(echo "$line" | cut -d'|' -f3 | cut -d'=' -f2)
        echo -e "  ${GREEN}✅${NC} $PROP = $ACTUAL (预期 $EXPECTED)"
        PASSED=$((PASSED + 1))
        ;;
      FAIL:*)
        PROP=$(echo "$line" | cut -d'|' -f1 | cut -d':' -f2)
        EXPECTED=$(echo "$line" | cut -d'|' -f2 | cut -d'=' -f2)
        ACTUAL=$(echo "$line" | cut -d'|' -f3 | cut -d'=' -f2)
        echo -e "  ${RED}❌${NC} $PROP = $ACTUAL, 预期 $EXPECTED"
        FAILED=$((FAILED + 1))
        ;;
      MISSING:*)
        PROP=$(echo "$line" | cut -d'|' -f1 | cut -d':' -f2)
        EXPECTED=$(echo "$line" | cut -d'|' -f2 | cut -d'=' -f2)
        echo -e "  ${RED}❌${NC} $PROP 未找到，预期 $EXPECTED"
        FAILED=$((FAILED + 1))
        ;;
      SUMMARY:*)
        # already handled in the loop
        ;;
      *)
        echo "  $line"
        ;;
    esac
  done
fi

# ── 判定 ──────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ "$FAILED" -gt 0 ]; then
  echo -e "  ${RED}判定: 未通过${NC} — $PASSED 通过, $FAILED 失败"
  echo ""
  echo "  🔴 必须修复以上偏差后才能继续生成下一个共享组件。"
  echo "  修复建议："
  echo "  1. 读取生成的组件文件，找到偏差属性对应的代码行"
  echo "  2. 用 Edit 修改为预期值"
  echo "  3. 重新运行本脚本验证:"
  echo "     bash verify-component.sh $COMPONENT_FILE $SPEC_FILE $COMPONENT_NAME"
  echo "═══════════════════════════════════════════════════════════════"
  exit 1
else
  echo -e "  ${GREEN}判定: 通过${NC} — 所有检查均已通过"
  echo "  ✅ 可以继续生成下一个共享组件"
  echo "═══════════════════════════════════════════════════════════════"
  exit 0
fi
