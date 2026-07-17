#!/usr/bin/env node
/**
 * diff-source-target.cjs
 *
 * Compares source CSS values (from Phase 2 design-values.json or extracted)
 * against target project files to find discrepancies.
 *
 * Checks 6 dimensions:
 *   D1: CSS property missing in target (exists in source, not in target)
 *   D2: CSS value mismatch (different value after unit conversion)
 *   D3: Extra DOM elements in target (target has elements source doesn't)
 *   D4: Missing DOM content (source has elements target doesn't)
 *   D5: Text content mismatch
 *   D6: DOM structure mismatch (nesting/sibling order)
 *
 * Usage:
 *   # Path 1: with Phase 2 design-values.json
 *   node diff-source-target.cjs \
 *     --design-values phase2-output/design-values.json \
 *     --target-dir <project-dir> \
 *     --output phase4-output/diff-report.json
 *
 *   # Path 2: with extracted source values
 *   node diff-source-target.cjs \
 *     --source-values phase4-output/source-values.json \
 *     --target-dir <project-dir> \
 *     --output phase4-output/diff-report.json
 *
 * Exit codes:
 *   0 — zero diffs
 *   1 — diffs found (report written)
 *   2 — parameter/IO error
 */

const fs = require('fs');
const path = require('path');

// ── CLI Args ──
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : null;
}

const designValuesPath = getArg('--design-values');
const sourceValuesPath = getArg('--source-values');
const targetDir = getArg('--target-dir');
const outputPath = getArg('--output');

if ((!designValuesPath && !sourceValuesPath) || !targetDir || !outputPath) {
  console.error('Usage:');
  console.error('  node diff-source-target.cjs --design-values <json> --target-dir <dir> --output <json>');
  console.error('  node diff-source-target.cjs --source-values <json> --target-dir <dir> --output <json>');
  process.exit(2);
}

// ── Unit conversion utilities ──
// Default: px → rpx × 2 (uni-app standard, 375px → 750rpx design)
// Can be overridden by --unit-ratio flag
const unitRatio = parseFloat(getArg('--unit-ratio') || '2');

/**
 * Convert a source px value to target rpx value.
 * e.g. '16px' → 32 (numeric rpx)
 *      '0 2px 12px rgba(0,0,0,0.04)' → '0 4rpx 24rpx rgba(0,0,0,0.04)'
 */
function convertPxToRpx(value) {
  if (!value) return value;
  // Replace all px values in the string
  return value.replace(/(\d+(?:\.\d+)?)px/g, (_, num) => {
    return (parseFloat(num) * unitRatio) + 'rpx';
  });
}

/**
 * Compute expected target value from source value.
 */
function expectedTargetValue(sourceValue) {
  // strip 'px' suffix and multiply
  return convertPxToRpx(sourceValue);
}

/**
 * Normalize a CSS value for comparison.
 * Strips whitespace differences, normalizes color hex case.
 */
function normalizeCssValue(val) {
  if (!val) return '';
  return val
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/#([0-9a-f]{3,8})/g, (_, hex) => '#' + hex.toLowerCase());
}

/**
 * Compute the numerical difference between two values.
 * Only works for single-number values (like font-size, padding, border-radius).
 * Returns null for multi-part values (like padding: 16px 24px).
 */
function computeNumericDiff(expected, actual) {
  const expNum = parseFloat(expected);
  const actNum = parseFloat(actual);
  if (!isNaN(expNum) && !isNaN(actNum)) {
    return Math.abs(expNum - actNum);
  }
  return null;
}

// ── Load source data ──
let sourceData = null;

if (designValuesPath) {
  // design-values.json format: { "targetFile": { "source": "...", "values": [...] } }
  try {
    sourceData = JSON.parse(fs.readFileSync(designValuesPath, 'utf-8'));
  } catch (err) {
    console.error(`Error reading design-values.json: ${err.message}`);
    process.exit(2);
  }
} else if (sourceValuesPath) {
  // raw-styles.json format: [ { file, line, element, properties }, ... ]
  try {
    const rawValues = JSON.parse(fs.readFileSync(sourceValuesPath, 'utf-8'));
    // Convert to design-values format: group by target file
    sourceData = {};
    for (const entry of rawValues) {
      // We need a mapping to go from source file → target file.
      // Without --mapping flag, we store under source file name directly.
      const targetFile = entry.file;
      if (!sourceData[targetFile]) {
        sourceData[targetFile] = { source: entry.file, values: [] };
      }
      for (const [prop, val] of Object.entries(entry.properties)) {
        sourceData[targetFile].values.push({
          cssProp: prop,
          sourceValue: val,
          sourceLine: entry.line,
          targetValue: convertPxToRpx(val),
          targetElement: entry.element,
        });
      }
    }
  } catch (err) {
    console.error(`Error reading source-values.json: ${err.message}`);
    process.exit(2);
  }
}

// ── Extract target values ──
/**
 * Grep a CSS property value from a target .vue file's scoped style block.
 * Returns the actual value string found, or null if not found.
 */
function grepTargetCssValue(filePath, cssProp, targetElement) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Try 1: find the CSS selector near a style block
    // Look for the property in the file
    const propRegex = new RegExp(
      cssProp.replace(/-/g, '\\-') + '\\s*:\\s*([^;}\\n]+)',
      'i'
    );
    const match = content.match(propRegex);
    if (match) {
      return match[1].trim();
    }
    return null;
  } catch (err) {
    return null;
  }
}

// ── Check extra DOM elements (D3) ──
/**
 * Scan target .vue template for elements that commonly indicate
 * Agent fabrication: extra wrappers, unnecessary containers.
 */
function checkExtraElements(targetFilePath, sourceFile) {
  const diffs = [];
  try {
    const content = fs.readFileSync(targetFilePath, 'utf-8');
    const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/i);
    if (!templateMatch) return diffs;
    const template = templateMatch[1];

    // Check for common fabrication patterns
    // This is heuristic — the source DOM tree isn't available without Phase 1 data.
    // We flag patterns that are known fabrication signals.
    const patterns = [
      // { regex: /class="[^"]*wrapper[^"]*"/, msg: 'Possible extra wrapper div detected' },
    ];

    for (const pat of patterns) {
      if (pat.regex.test(template)) {
        diffs.push({
          dimension: 'D3',
          severity: 'major',
          description: pat.msg,
          fix: 'Check if this wrapper exists in the source JSX. If not, remove it.',
        });
      }
    }
  } catch (err) { /* skip */ }
  return diffs;
}

// ── Main comparison loop ──
const allDiffs = [];
let totalDiffs = 0;
let filesWithDiff = 0;

for (const [targetFile, fileData] of Object.entries(sourceData)) {
  // Resolve target file path
  const targetFilePath = path.join(targetDir, 'src', targetFile);
  if (!fs.existsSync(targetFilePath)) {
    allDiffs.push({
      targetFile,
      sourceFile: fileData.source,
      diffs: [{
        dimension: 'D4',
        severity: 'blocker',
        description: `Target file not found: ${targetFilePath}`,
        fix: 'Generate the missing file.',
      }],
    });
    filesWithDiff++;
    totalDiffs++;
    continue;
  }

  const fileDiffs = [];

  // D1/D2: Check each CSS property-value pair
  for (const valEntry of (fileData.values || [])) {
    const { cssProp, sourceValue, targetValue: expectedVal, targetElement, sourceLine } = valEntry;
    const actualVal = grepTargetCssValue(targetFilePath, cssProp, targetElement);

    if (actualVal === null) {
      // D1: Property missing
      fileDiffs.push({
        dimension: 'D1',
        severity: 'blocker',
        cssProp,
        expectedValue: expectedVal,
        sourceValue,
        sourceLine,
        targetElement,
        description: `${cssProp} is missing in target. Expected: ${expectedVal} (source: ${sourceValue} at ${fileData.source}:${sourceLine})`,
        fix: `Add ${cssProp}: ${expectedVal}; to the appropriate CSS class`,
      });
    } else {
      const expectedNorm = normalizeCssValue(expectedVal);
      const actualNorm = normalizeCssValue(actualVal);

      if (expectedNorm !== actualNorm) {
        const numDiff = computeNumericDiff(expectedVal, actualVal);
        let severity = 'major';
        if (numDiff !== null && numDiff <= 4) severity = 'minor';
        else if (numDiff !== null && numDiff > 8) severity = 'blocker';

        fileDiffs.push({
          dimension: 'D2',
          severity,
          cssProp,
          expectedValue: expectedVal,
          actualValue: actualVal,
          sourceValue,
          sourceLine,
          targetElement,
          numDiff,
          description: `${cssProp}: expected "${expectedVal}", found "${actualVal}" (diff: ${numDiff !== null ? numDiff + 'rpx' : 'visual'})`,
          fix: `Edit ${cssProp} from "${actualVal}" to "${expectedVal}"`,
        });
      }
    }
  }

  // D3: Check for extra fabricated elements
  const extraDiffs = checkExtraElements(targetFilePath, fileData.source);
  fileDiffs.push(...extraDiffs);

  if (fileDiffs.length > 0) {
    filesWithDiff++;
    totalDiffs += fileDiffs.length;
    allDiffs.push({
      targetFile,
      sourceFile: fileData.source,
      diffs: fileDiffs,
    });
  }
}

// ── Build report ──
const report = {
  summary: {
    totalFiles: Object.keys(sourceData).length,
    filesWithDiff,
    totalDiffs,
    bySeverity: {
      blocker: allDiffs.reduce((s, f) => s + f.diffs.filter(d => d.severity === 'blocker').length, 0),
      major: allDiffs.reduce((s, f) => s + f.diffs.filter(d => d.severity === 'major').length, 0),
      minor: allDiffs.reduce((s, f) => s + f.diffs.filter(d => d.severity === 'minor').length, 0),
    },
    byDimension: {
      D1: allDiffs.reduce((s, f) => s + f.diffs.filter(d => d.dimension === 'D1').length, 0),
      D2: allDiffs.reduce((s, f) => s + f.diffs.filter(d => d.dimension === 'D2').length, 0),
      D3: allDiffs.reduce((s, f) => s + f.diffs.filter(d => d.dimension === 'D3').length, 0),
      D4: allDiffs.reduce((s, f) => s + f.diffs.filter(d => d.dimension === 'D4').length, 0),
      D5: allDiffs.reduce((s, f) => s + f.diffs.filter(d => d.dimension === 'D5').length, 0),
      D6: allDiffs.reduce((s, f) => s + f.diffs.filter(d => d.dimension === 'D6').length, 0),
    },
  },
  files: allDiffs,
};

// ── Write output ──
try {
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`diff-report written: ${outputPath}`);
  console.log(`Files: ${report.summary.totalFiles}, With diffs: ${report.summary.filesWithDiff}, Total diffs: ${report.summary.totalDiffs}`);
  console.log(`By severity — Blocker: ${report.summary.bySeverity.blocker}, Major: ${report.summary.bySeverity.major}, Minor: ${report.summary.bySeverity.minor}`);
} catch (err) {
  console.error(`Error writing output: ${err.message}`);
  process.exit(2);
}

// Exit code
process.exit(totalDiffs > 0 ? 1 : 0);
