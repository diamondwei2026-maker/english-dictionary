/**
 * Generate simple PNG icons for Taro tabBar.
 * Creates 48x48 PNGs with simple geometric shapes.
 * Run: node scripts/generate-icons.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'tabbar');
const SIZE = 48;

function createPNG(pixels) {
  // Build raw image data (filter byte 0 + RGBA per row)
  const rawData = Buffer.alloc(SIZE * (1 + SIZE * 4));
  for (let y = 0; y < SIZE; y++) {
    const rowOff = y * (1 + SIZE * 4);
    rawData[rowOff] = 0; // filter: none
    for (let x = 0; x < SIZE; x++) {
      const px = pixels[y * SIZE + x];
      const off = rowOff + 1 + x * 4;
      rawData[off] = (px >> 24) & 0xff;     // R
      rawData[off + 1] = (px >> 16) & 0xff; // G
      rawData[off + 2] = (px >> 8) & 0xff;  // B
      rawData[off + 3] = px & 0xff;         // A
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // Build PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeB, data]);
    const crc = crc32(crcData);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeB, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);  // width
  ihdr.writeUInt32BE(SIZE, 4);  // height
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type: RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// CRC32 implementation
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function fillArray(color) {
  const arr = new Uint32Array(SIZE * SIZE);
  arr.fill(color);
  return arr;
}

function drawCircle(pixels, cx, cy, r, color) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        pixels[y * SIZE + x] = color;
      }
    }
  }
}

function drawRect(pixels, rx, ry, rw, rh, color) {
  for (let y = ry; y < ry + rh && y < SIZE; y++) {
    for (let x = rx; x < rx + rw && x < SIZE; x++) {
      if (x >= 0 && y >= 0) pixels[y * SIZE + x] = color;
    }
  }
}

function drawLine(pixels, x1, y1, x2, y2, thickness, color) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  for (let t = 0; t <= len; t += 0.5) {
    const cx = Math.round(x1 + (dx / len) * t);
    const cy = Math.round(y1 + (dy / len) * t);
    for (let ty = -thickness; ty <= thickness; ty++) {
      for (let tx = -thickness; tx <= thickness; tx++) {
        const px = cx + tx, py = cy + ty;
        if (px >= 0 && px < SIZE && py >= 0 && py < SIZE) {
          pixels[py * SIZE + px] = color;
        }
      }
    }
  }
}

// ─── Search icon (magnifying glass) ──────────────────────────────
function makeSearchIcon(fgColor) {
  const bg = 0x00000000; // transparent
  const pixels = fillArray(bg);
  // Circle
  drawCircle(pixels, 21, 21, 10, fgColor);
  // Make center transparent (to create ring)
  drawCircle(pixels, 21, 21, 6, bg);
  // Handle
  drawLine(pixels, 29, 29, 39, 39, 3, fgColor);
  drawLine(pixels, 29, 29, 39, 39, 1, bg); // thin clear center
  return createPNG(pixels);
}

// ─── Library icon (book) ─────────────────────────────────────────
function makeLibraryIcon(fgColor) {
  const bg = 0x00000000;
  const pixels = fillArray(bg);
  // Book spine
  drawRect(pixels, 18, 8, 3, 32, fgColor);
  // Left page
  drawRect(pixels, 21, 10, 11, 28, fgColor);
  drawRect(pixels, 22, 11, 9, 26, bg);
  // Right page
  drawRect(pixels, 21, 10, 11, 28, fgColor);
  drawRect(pixels, 22, 11, 9, 26, bg);
  // Actually, let me draw a simpler book
  // Spine
  drawRect(pixels, 13, 8, 4, 32, fgColor);
  // Book cover left
  drawRect(pixels, 17, 10, 13, 28, fgColor);
  // Book cover right (slightly open)
  drawRect(pixels, 17, 10, 13, 28, fgColor);
  // Pages
  drawRect(pixels, 18, 12, 11, 24, bg);
  return createPNG(pixels);
}

// ─── Profile icon (person) ───────────────────────────────────────
function makeProfileIcon(fgColor) {
  const bg = 0x00000000;
  const pixels = fillArray(bg);
  // Head
  drawCircle(pixels, 24, 16, 8, fgColor);
  drawCircle(pixels, 24, 16, 5, bg);
  // Body
  drawCircle(pixels, 24, 44, 16, fgColor);
  drawCircle(pixels, 24, 44, 13, bg);
  return createPNG(pixels);
}

// ─── Generate all 6 icons ────────────────────────────────────────
const UNSELECTED = 0x9CA3AFff; // #9CA3AF
const SELECTED = 0x2563EBff;   // #2563EB

const icons = [
  { name: 'icon-search', fn: makeSearchIcon },
  { name: 'icon-search-active', fn: (c) => makeSearchIcon(c), color: SELECTED },
  { name: 'icon-library', fn: makeLibraryIcon },
  { name: 'icon-library-active', fn: (c) => makeLibraryIcon(c), color: SELECTED },
  { name: 'icon-profile', fn: makeProfileIcon },
  { name: 'icon-profile-active', fn: (c) => makeProfileIcon(c), color: SELECTED },
];

for (const icon of icons) {
  const color = icon.name.includes('-active') ? SELECTED : UNSELECTED;
  const png = icon.fn(color);
  const filepath = path.join(OUT_DIR, `${icon.name}.png`);
  fs.writeFileSync(filepath, png);
  console.log(`Created: ${filepath} (${png.length} bytes)`);
}

console.log('\nDone! 6 tabBar icons generated.');
