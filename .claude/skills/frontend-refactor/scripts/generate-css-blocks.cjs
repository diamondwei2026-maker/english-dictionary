#!/usr/bin/env node
/**
 * generate-css-blocks.cjs
 *
 * Reads design-values.json and produces per-file scoped CSS blocks.
 * Each .css-block file contains complete <style scoped> content that
 * Phase 3 Agents should paste verbatim into target .vue files.
 *
 * Usage:
 *   node generate-css-blocks.cjs <design-values.json> <output-dir>
 */
const fs = require('fs');
const path = require('path');

const DV_FILE = process.argv[2];
const OUT_DIR = process.argv[3];

if (!DV_FILE || !OUT_DIR) {
  console.error('Usage: node generate-css-blocks.cjs <design-values.json> <output-dir>');
  process.exit(2);
}

const dv = JSON.parse(fs.readFileSync(DV_FILE, 'utf-8'));

// ── Known target element → BEM class name mapping ──
// For elements we can identify, assign BEM class names
const ELEMENT_CLASS_MAP = {
  // Generic containers
  'div': null, // will use contextual naming
  'view': null,
  'button': null,
  'input': null,
  'textarea': null,
  'select': null,
  'h1': 'page-title',
  'h2': 'section-title',
  'h3': 'card-title',
  'p': 'text',
  'span': 'text',
};

// ── Property value normalization for SCSS ──
function normalizeValue(prop, val) {
  // Quote font-family values
  if (prop === 'font-family') {
    return val.replace('Inter,system-ui,-apple-system,sans-serif', "'Inter', system-ui, -apple-system, sans-serif");
  }
  return val;
}

// ── Deduplicate similar style blocks within a file ──
function deduplicateStyles(values) {
  const seen = new Map(); // hash → { properties, count, sourceLines }
  const result = [];

  for (const entry of values) {
    const hash = JSON.stringify(entry.properties);
    if (seen.has(hash)) {
      const existing = seen.get(hash);
      existing.count++;
      existing.sourceLines.push(entry.sourceLine);
    } else {
      seen.set(hash, {
        count: 1,
        sourceLines: [entry.sourceLine],
        properties: entry.properties,
        element: entry.element,
      });
    }
  }

  // Convert back to array, sorted by frequency (most reused first)
  const sorted = [...seen.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([_, v]) => v);

  return sorted;
}

// ── Generate class name from properties context ──
function generateClassName(targetFile, index, props, element) {
  // Derive a meaningful class name from file context and element
  const basename = path.basename(targetFile, '.vue');

  // Common patterns
  if (props['backdrop-filter']) return basename + '__header';
  if (props['position'] === 'sticky') return basename + '__header';
  if (props['position'] === 'fixed') return basename + '__fixed';
  if (element === 'input') return basename + '__input';
  if (element === 'textarea') return basename + '__textarea';
  if (element === 'select') return basename + '__select';
  if (element === 'button' && props['background']?.includes('2563EB')) return basename + '__btn-primary';
  if (element === 'button' && props['background']?.includes('DC2626')) return basename + '__btn-danger';
  if (element === 'button') return basename + '__btn';
  if (props['border-radius'] === '50%') return basename + '__avatar';

  // Fallback
  return basename + '__block-' + (index + 1);
}

// ── Determine if a property needs H5 conditional compilation ──
function needsH5Conditional(prop, val) {
  if (prop === 'backdrop-filter' || prop === '-webkit-backdrop-filter') return true;
  if (prop === 'transition') return true;
  if (prop === 'cursor' && val === 'pointer') return true;
  if (prop === 'outline') return false; // explicitly handle via border
  return false;
}

// ── Generate CSS block for one target file ──
function generateCSSBlock(targetFile, data) {
  const blocks = [];
  const deduped = deduplicateStyles(data.values);

  // Header comment
  blocks.push(`/* ═══════════════════════════════════════════════════════════`);
  blocks.push(`   Pre-generated CSS block for: ${targetFile}`);
  blocks.push(`   Source: ${data.source}`);
  blocks.push(`   Generated: ${new Date().toISOString().split('T')[0]}`);
  blocks.push(`   ═══════════════════════════════════════════════════════════ */`);
  blocks.push('');

  // Generate classes
  for (let i = 0; i < deduped.length; i++) {
    const entry = deduped[i];
    const className = generateClassName(targetFile, i, entry.properties, entry.element);
    const lines = entry.sourceLines.join(', ');

    blocks.push(`/* Source lines: ${lines} — ${entry.element} (used ${entry.count}x) */`);
    blocks.push(`.${className} {`);

    for (const [prop, val] of Object.entries(entry.properties)) {
      const normalizedVal = normalizeValue(prop, val);
      if (needsH5Conditional(prop, val)) {
        blocks.push(`  /* #ifdef H5 */`);
        blocks.push(`  ${prop}: ${normalizedVal};`);
        blocks.push(`  /* #endif */`);
      } else {
        blocks.push(`  ${prop}: ${normalizedVal};`);
      }
    }

    blocks.push(`}`);
    blocks.push('');
  }

  return blocks.join('\n');
}

// ── Main ──
fs.mkdirSync(OUT_DIR, { recursive: true });

const manifest = {}; // records which .css-block serves which target file

for (const [targetFile, data] of Object.entries(dv)) {
  // Skip App.vue — it uses the framework template
  if (targetFile === 'App.vue') continue;

  const cssContent = generateCSSBlock(targetFile, data);
  const blockFileName = targetFile.replace(/\//g, '__').replace(/\.vue$/, '.css-block');
  const blockPath = path.join(OUT_DIR, blockFileName);

  fs.writeFileSync(blockPath, cssContent, 'utf-8');
  manifest[targetFile] = blockFileName;

  console.error(`Generated: ${blockFileName} (${data.values.length} entries → ${cssContent.split('\n').length} lines)`);
}

// Write manifest
fs.writeFileSync(
  path.join(OUT_DIR, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf-8'
);

console.error(`\nDone: ${Object.keys(manifest).length} CSS blocks written to ${OUT_DIR}/`);
