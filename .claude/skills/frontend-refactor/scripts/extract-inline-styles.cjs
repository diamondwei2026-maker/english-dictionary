#!/usr/bin/env node
/**
 * extract-inline-styles.cjs
 *
 * Extracts all CSS property-value pairs from React inline-style objects
 * (style={{...}}) and Vue :style="{...}" bindings in source files.
 *
 * Input:  <source-dir>/src/  (recursively scans .tsx/.jsx/.vue/.ts files)
 * Output: JSON to stdout — { file, line, element, properties }[]
 *
 * Usage:
 *   node extract-inline-styles.cjs <source-dir> > raw-styles.json
 *
 * Part of the frontend-refactor skill.
 * Phase 2 §6c — feeds into design-values.json.
 * Phase 4 Step 4.0b — feeds into diff-source-target.cjs (fallback path).
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = process.argv[2];
if (!SOURCE_DIR) {
  console.error('Usage: node extract-inline-styles.cjs <source-dir>');
  process.exit(2);
}

const EXTENSIONS = ['.tsx', '.jsx', '.vue', '.ts'];
const results = [];

/**
 * Convert camelCase CSS property to kebab-case.
 * e.g. fontSize → font-size, WebkitBackdropFilter → -webkit-backdrop-filter
 */
function camelToKebab(str) {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-webkit-/, '-webkit-')
    .replace(/^-ms-/, '-ms-');
}

/**
 * Parse a CSS property value from a JS expression.
 * Handles: string literals ('...' or "..."), numbers (14 → '14px' for some props),
 * template literals, and expressions like `#fff`.
 */
function parseValue(raw) {
  if (!raw) return null;
  // String literal: 'value' or "value"
  const strMatch = raw.match(/^['"]([^'"]*)['"]$/);
  if (strMatch) return strMatch[1];
  // Numeric literal: 14, 1.5 — for unit-less props (opacity, fontWeight, lineHeight, zIndex)
  const numMatch = raw.match(/^(\d+\.?\d*)$/);
  if (numMatch) return numMatch[1];
  // Template literal: `value`
  const tplMatch = raw.match(/^`([^`]*)`$/);
  if (tplMatch) return tplMatch[1];
  // Otherwise return as-is (e.g. expressions like '#2563EB', 'undefined')
  return raw;
}

/**
 * Extract all key: value pairs from a style={{...}} object string.
 * Handles React style objects: style={{padding:'16px', fontSize:14}}
 * and Vue :style objects: :style="{padding:'16px', fontSize:14}"
 */
function extractStyleProperties(styleStr) {
  const properties = {};
  if (!styleStr || styleStr.length < 2) return properties;

  // Strategy: split by comma, but be careful of commas inside values
  // Match key: value pairs — key is camelCase, value can be string/number/expression
  const pairRegex = /(\w+)\s*:\s*((?:'[^']*'|"[^"]*"|`[^`]*`|\([^)]*\)|[^,{}])+)/g;
  let match;
  while ((match = pairRegex.exec(styleStr)) !== null) {
    const key = match[1];
    const rawVal = match[2].trim();
    // Skip React-specific non-CSS keys (like transform, etc handled below)
    if (key === 'style' || key === '...') continue;

    const value = parseValue(rawVal);
    if (value !== null && value !== 'undefined') {
      const cssProp = camelToKebab(key);
      properties[cssProp] = value;
    }
  }

  // Second pass: try JSON.parse for well-formed objects (fallback for simple cases)
  if (Object.keys(properties).length === 0) {
    try {
      // Replace single quotes with double quotes for JSON compatibility
      const jsonStr = styleStr
        .replace(/'/g, '"')
        .replace(/(\w+)\s*:/g, '"$1":');
      // This is fragile — only use if regex approach yielded nothing
    } catch (e) {
      // ignore
    }
  }

  return properties;
}

/**
 * Determine the JSX element name from the line context.
 */
function getElementName(line) {
  const match = line.match(/<\s*(\w+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Extract style={{...}} blocks from a single line of code.
 * Returns array of { element, styleObjectStr }.
 * Handles multi-line style objects by collecting across lines.
 */
function extractStyleBlocks(lines, startLineIdx) {
  const blocks = [];
  const fileLines = lines;

  // Pattern: style={{ ... }} or style={...}
  // Can span multiple lines

  for (let i = 0; i < fileLines.length; i++) {
    const line = fileLines[i];

    // Match style={{ ... opening
    const styleOpen = line.match(/style=\{\{/);
    if (styleOpen) {
      let styleContent = '';
      let depth = 0;
      let j = i;

      // Collect content from this line after style={{
      const afterOpen = line.substring(styleOpen.index + 8); // strlen('style={{')
      // Count braces in rest of line
      for (const ch of afterOpen) {
        if (ch === '{') depth++;
        else if (ch === '}') {
          if (depth === 0) {
            // Found closing }}
            break;
          }
          depth--;
        } else if (depth === 0 && ch !== ' ') {
          styleContent += ch;
        } else if (depth > 0) {
          styleContent += ch;
        }
      }

      // If not closed on same line, continue to next lines
      if (depth > 0 || !afterOpen.includes('}}')) {
        let closed = afterOpen.includes('}}');
        j++;
        while (j < fileLines.length && !closed) {
          const nextLine = fileLines[j];
          for (const ch of nextLine) {
            if (ch === '{') depth++;
            else if (ch === '}') {
              if (depth === 0) {
                closed = true;
                break;
              }
              depth--;
            } else if (depth === 0 && ch !== ' ') {
              styleContent += ch;
            } else if (depth > 0) {
              styleContent += ch;
            }
          }
          if (!closed) j++;
        }
      }

      // Clean up style content for the regex extractor
      const cleanContent = styleContent.replace(/\s+/g, ' ').trim();
      if (cleanContent) {
        const element = getElementName(line);
        blocks.push({
          line: i + 1, // 1-indexed
          element,
          styleStr: cleanContent,
        });
      }
    }
  }

  return blocks;
}

/**
 * Walk directory recursively, process each matching file.
 */
function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules, dist, .git
      if (!['node_modules', 'dist', '.git', 'unpackage'].includes(entry.name)) {
        walkDir(fullPath);
      }
    } else if (EXTENSIONS.includes(path.extname(entry.name))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        // For .vue files, only process <script> section for inline styles
        // (template :style bindings are also inline styles but handled differently)
        if (entry.name.endsWith('.vue')) {
          // Extract template section (between <template> and </template>)
          const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/i);
          if (templateMatch) {
            const templateLines = templateMatch[1].split('\n');
            // For Vue, we look for :style="..." patterns
            for (let i = 0; i < templateLines.length; i++) {
              const line = templateLines[i];
              const styleBind = line.match(/:style\s*=\s*"([^"]*)"/);
              if (styleBind) {
                try {
                  const vueStyleStr = styleBind[1];
                  // Vue :style can be an object string like "{ color: active ? 'red' : 'blue' }"
                  // This is complex — skip for now, Vue inline styles are less common
                  // than React's style={{}}
                } catch (e) { /* skip */ }
              }
            }
          }
          // For Vue sources (src of a migration FROM Vue), skip —
          // this script is primarily for React TSX/JSX sources
          continue;
        }

        const blocks = extractStyleBlocks(lines, 0);
        for (const block of blocks) {
          const properties = extractStyleProperties(block.styleStr);
          if (Object.keys(properties).length > 0) {
            results.push({
              file: path.relative(SOURCE_DIR, fullPath).replace(/\\/g, '/'),
              line: block.line,
              element: block.element,
              properties,
            });
          }
        }
      } catch (err) {
        console.error(`Error reading ${fullPath}: ${err.message}`);
      }
    }
  }
}

// ── Main ──
walkDir(SOURCE_DIR);

// Sort by file, then line
results.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

// Output JSON
process.stdout.write(JSON.stringify(results, null, 2));
process.stdout.write('\n');
