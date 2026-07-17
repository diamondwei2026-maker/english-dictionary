#!/usr/bin/env node
/**
 * build-design-values.cjs
 *
 * Converts raw-styles.json (from extract-inline-styles.cjs) to:
 *   1. design-values.json — per-target-file CSS exact values
 *   2. css-blocks/ — pre-generated scoped CSS for each target page
 *
 * Usage:
 *   node build-design-values.cjs <raw-styles.json> <file-mapping.json> > phase2-output/design-values.json
 */
const fs = require('fs');
const path = require('path');

const RAW_FILE = process.argv[2];
if (!RAW_FILE) { console.error('Usage: node build-design-values.cjs <raw-styles.json>'); process.exit(2); }

const raw = JSON.parse(fs.readFileSync(RAW_FILE, 'utf-8'));

// ── Source file → Target file mapping ──
const FILE_MAP = {
  'app/App.tsx':                             { target: 'App.vue',                         layer: 'entry' },
  'app/components/HomeView.tsx':             { target: 'pages/home/home.vue',             layer: 'page' },
  'app/components/WordDetailView.tsx':       { target: 'pages/word-detail/word-detail.vue', layer: 'page' },
  'app/components/LibrariesView.tsx':        { target: 'pages/libraries/libraries.vue',   layer: 'page' },
  'app/components/ProfileView.tsx':          { target: 'pages/profile/profile.vue',       layer: 'page' },
  'app/components/AuthView.tsx':             { target: 'pages/auth/auth.vue',             layer: 'page' },
  'app/components/AdminView.tsx':            { target: 'pages/admin/admin.vue',           layer: 'page' }, // main page (Overview)
  'app/components/BottomNav.tsx':            { target: null,                               layer: 'deleted' },
  'app/components/PhysicalImage.tsx':        { target: 'components/PhysicalImage.vue',    layer: 'shared' },
};

// AdminView sub-module routing based on function name patterns (approximate)
// We'll use line ranges to split
function getAdminSubTarget(line) {
  if (line >= 136 && line <= 222) return 'pages/admin/admin.vue';        // Overview
  if (line >= 224 && line <= 326) return 'pages/admin/libraries.vue';    // LibraryManager
  if (line >= 328 && line <= 563) return 'pages/admin/word-edit.vue';    // WordEditForm
  if (line >= 566 && line <= 683) return 'pages/admin/words.vue';        // WordManager
  if (line >= 685 && line <= 730) return 'pages/admin/users.vue';        // UserManager
  if (line >= 733 && line <= 762) return 'pages/admin/admin.vue';        // Main AdminView wrapper
  return 'pages/admin/admin.vue';                                         // default fallback
}

// ── px → rpx conversion ──
function pxToRpx(val) {
  if (typeof val !== 'string') return val;
  // Replace px values: multiply by 2
  return val.replace(/(\d+\.?\d*)px/g, (_, num) => {
    const n = parseFloat(num);
    return Math.round(n * 2) + 'rpx';
  });
}

// ── Normalize comma-spacing in values (fix parser merging like "52px24px16px") ──
function normalizeSpacing(val) {
  if (typeof val !== 'string') return val;
  // "52px24px16px" → "52px 24px 16px"
  // This is a best-effort fix for the regex parser merging values
  val = val.replace(/(\d+px)(\d+px)/g, '$1 $2');
  val = val.replace(/(\d+px)(\d+px)/g, '$1 $2'); // second pass for 3+ values
  // Fix "0auto" → "0 auto"
  val = val.replace(/(\d+)([a-z])/g, (m, n, c) => {
    if (/^(auto|solid|rgba|px|rpx|rem|em|vh|vw|%)/.test(m.slice(String(n).length))) return m;
    return n + ' ' + c + m.slice(String(n).length + 1);
  });
  return val;
}

// ── Group by target file ──
const byTarget = {};

for (const entry of raw) {
  const mapping = FILE_MAP[entry.file];
  if (!mapping || !mapping.target) continue;

  let targetFile = mapping.target;

  // Split AdminView by line range
  if (entry.file === 'app/components/AdminView.tsx') {
    targetFile = getAdminSubTarget(entry.line);
  }

  if (!byTarget[targetFile]) {
    byTarget[targetFile] = { source: entry.file, values: [] };
  }

  // Convert each property
  const converted = {};
  for (const [prop, val] of Object.entries(entry.properties)) {
    const normalized = normalizeSpacing(String(val));
    const convertedVal = pxToRpx(normalized);
    converted[prop] = convertedVal;
  }

  byTarget[targetFile].values.push({
    sourceLine: entry.line,
    element: entry.element,
    properties: converted,
  });
}

// ── Build design-values.json ──
const designValues = {};
for (const [targetFile, data] of Object.entries(byTarget)) {
  designValues[targetFile] = data;
}

// Also add entries for components (PhysicalImage)
// PhysicalImage SVGs have no inline styles — handled separately

console.log(JSON.stringify(designValues, null, 2));
