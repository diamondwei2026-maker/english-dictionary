#!/usr/bin/env bash
# Quick project metadata extraction script
# Usage: bash analyze.sh <project-directory>
# Output: JSON to stdout with detected tech stack info

set -euo pipefail

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

# ── Framework detection ──────────────────────────────────────────
detect_framework() {
  if [ ! -f package.json ]; then
    echo "unknown"
    return
  fi

  local deps
  deps=$(cat package.json | python3 -c "
import json, sys
try:
    pkg = json.load(sys.stdin)
    deps = {**pkg.get('dependencies',{}), **pkg.get('devDependencies',{})}
    print(' '.join(deps.keys()))
except: pass
" 2>/dev/null || echo "")

  if echo "$deps" | grep -q "react"; then
    if echo "$deps" | grep -q "next"; then echo "nextjs"
    elif echo "$deps" | grep -q "@tarojs/taro"; then echo "taro-react"
    else echo "react"; fi
  elif echo "$deps" | grep -q "vue"; then
    if echo "$deps" | grep -q "nuxt"; then echo "nuxt"
    else echo "vue3"; fi
  elif echo "$deps" | grep -q "@angular/core"; then echo "angular"
  elif echo "$deps" | grep -q "svelte"; then echo "svelte"
  elif echo "$deps" | grep -q "solid-js"; then echo "solid"
  else echo "unknown"; fi
}

# ── Language detection ──────────────────────────────────────────
detect_language() {
  local ts_files
  ts_files=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | head -5)
  if [ -n "$ts_files" ]; then echo "typescript"
  else echo "javascript"; fi
}

# ── Style system detection ──────────────────────────────────────
detect_style() {
  local deps
  deps=$(cat package.json | python3 -c "
import json, sys
try:
    pkg = json.load(sys.stdin)
    deps = {**pkg.get('dependencies',{}), **pkg.get('devDependencies',{})}
    print(' '.join(deps.keys()))
except: pass
" 2>/dev/null || echo "")

  if echo "$deps" | grep -q "tailwindcss"; then echo "tailwind"
  elif echo "$deps" | grep -q "styled-components"; then echo "styled-components"
  elif echo "$deps" | grep -q "@emotion"; then echo "emotion"
  elif [ -f postcss.config.* ]; then echo "postcss"
  elif find src -name "*.module.css" 2>/dev/null | head -1 | grep -q .; then echo "css-modules"
  elif find src -name "*.scss" 2>/dev/null | head -1 | grep -q .; then echo "scss"
  else echo "css"; fi
}

# ── Router detection ────────────────────────────────────────────
detect_router() {
  local deps
  deps=$(cat package.json | python3 -c "
import json, sys
try:
    pkg = json.load(sys.stdin)
    deps = {**pkg.get('dependencies',{}), **pkg.get('devDependencies',{})}
    print(' '.join(deps.keys()))
except: pass
" 2>/dev/null || echo "")

  if echo "$deps" | grep -q "react-router"; then echo "react-router"
  elif echo "$deps" | grep -q "vue-router"; then echo "vue-router"
  elif echo "$deps" | grep -q "@tarojs/router"; then echo "taro-router"
  elif echo "$deps" | grep -q "next"; then echo "nextjs-file-router"
  else echo "manual-or-unknown"; fi
}

# ── File counts ─────────────────────────────────────────────────
count_files() {
  local ext="${1:-.tsx}"
  find src -name "*$ext" 2>/dev/null | wc -l
}

# ── Build tool ──────────────────────────────────────────────────
detect_bundler() {
  if [ -f vite.config.* ]; then echo "vite"
  elif [ -f next.config.* ]; then echo "nextjs"
  elif [ -f webpack.config.* ]; then echo "webpack"
  elif [ -f vue.config.js ]; then echo "vue-cli"
  else echo "unknown"; fi
}

# ── Output JSON ─────────────────────────────────────────────────
FRAMEWORK=$(detect_framework)
LANGUAGE=$(detect_language)
STYLE=$(detect_style)
ROUTER=$(detect_router)
BUNDLER=$(detect_bundler)

TSX_COUNT=$(count_files ".tsx")
JSX_COUNT=$(count_files ".jsx")
VUE_COUNT=$(count_files ".vue")
TS_COUNT=$(count_files ".ts")
TOTAL_FILES=$(find src -type f 2>/dev/null | wc -l)

cat <<EOF
{
  "project_dir": "$(realpath .)",
  "framework": "$FRAMEWORK",
  "language": "$LANGUAGE",
  "style_system": "$STYLE",
  "router": "$ROUTER",
  "bundler": "$BUNDLER",
  "file_counts": {
    "tsx": $TSX_COUNT,
    "jsx": $JSX_COUNT,
    "vue": $VUE_COUNT,
    "ts": $TS_COUNT,
    "total": $TOTAL_FILES
  }
}
EOF
