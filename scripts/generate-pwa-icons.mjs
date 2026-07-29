// Generates the PWA icon set (public/icons/*.png) as plain solid-color PNGs
// with a segmented "S" glyph, using only Node built-ins (zlib for DEFLATE +
// CRC32) — no browser, no image library. Re-run this if the brand colors
// or icon design change: `node scripts/generate-pwa-icons.mjs`
import { deflateSync, crc32 } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

// Brand colors (matches --brand-navy / theme-color already used in the app).
const NAVY = [0x1e, 0x3a, 0x8a]; // #1e3a8a
const WHITE = [0xff, 0xff, 0xff];

// The "S" glyph as five bars — the same shape a 7-segment display uses for
// "S" (identical to digit 5's segments) — reliable at any resolution.
// Rectangles in normalized [0,1] space: [x0, y0, x1, y1].
function segmentedS(scale, thickness) {
  const cx = 0.5;
  const halfW = 0.22 * scale;
  const top = 0.22 + (0.5 - scale) * 0.5;
  const bottom = 0.78 - (0.5 - scale) * 0.5;
  const mid = (top + bottom) / 2;
  const t = thickness;
  return [
    [cx - halfW, top, cx + halfW, top + t], // top bar
    [cx - halfW, top, cx - halfW + t, mid], // upper-left vertical
    [cx - halfW, mid - t / 2, cx + halfW, mid + t / 2], // middle bar
    [cx + halfW - t, mid, cx + halfW, bottom], // lower-right vertical
    [cx - halfW, bottom - t, cx + halfW, bottom], // bottom bar
  ];
}

function inRect(nx, ny, [x0, y0, x1, y1]) {
  return nx >= x0 && nx <= x1 && ny >= y0 && ny <= y1;
}

function renderIcon(size, { scale = 0.62, thickness = 0.085 } = {}) {
  const segments = segmentedS(scale, thickness);
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    const ny = (y + 0.5) / size;
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5) / size;
      const isGlyph = segments.some((seg) => inRect(nx, ny, seg));
      const [r, g, b] = isGlyph ? WHITE : NAVY;
      const i = (y * size + x) * 4;
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = 255;
    }
  }
  return buf;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput) >>> 0, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = chunk("IHDR", ihdrData);

  // Raw scanlines, each prefixed with filter-type 0 (None).
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = chunk("IDAT", deflateSync(raw, { level: 9 }));
  const iend = chunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

const targets = [
  { name: "icon-192.png", size: 192, scale: 0.62 },
  { name: "icon-512.png", size: 512, scale: 0.62 },
  { name: "icon-maskable-512.png", size: 512, scale: 0.42 }, // extra padding for OS mask safe-zone
  { name: "apple-touch-icon.png", size: 180, scale: 0.62 },
];

for (const t of targets) {
  const rgba = renderIcon(t.size, { scale: t.scale });
  const png = encodePng(rgba, t.size);
  writeFileSync(path.join(outDir, t.name), png);
  console.log(`wrote ${t.name} (${t.size}x${t.size}, ${png.length} bytes)`);
}
