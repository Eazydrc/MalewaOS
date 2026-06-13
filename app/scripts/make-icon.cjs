/**
 * Génère icon.png (256x256) et icon.ico pour Electron/NSIS
 * Usage: node scripts/make-icon.cjs
 * Aucune dépendance externe — Node.js pur (zlib intégré)
 */

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── Couleurs Elengi ────────────────────────────────────────────────────────────
const PRIMARY = { r: 0xE8, g: 0x5D, b: 0x26 }; // #E85D26 orange

// ── CRC32 (requis par PNG) ─────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let n = i;
    for (let j = 0; j < 8; j++) n = (n & 1) ? (0xEDB88320 ^ (n >>> 1)) : (n >>> 1);
    t[i] = n;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const lenBuf  = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length, 0);
  const typeB   = Buffer.from(type);
  const crcBuf  = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeB, data])), 0);
  return Buffer.concat([lenBuf, typeB, data, crcBuf]);
}

// ── Génère un PNG solide de taille `size`×`size` ───────────────────────────────
function makePng(size, color, rounded = true) {
  const { r, g, b } = color;
  const cx = size / 2, cy = size / 2, radius = size * 0.42;

  // Raw scanlines: [filter_byte, R, G, B, R, G, B, ...]
  const raw = Buffer.alloc(size * (1 + size * 3), 0);
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 3)] = 0; // filter = None
    for (let x = 0; x < size; x++) {
      const inside = !rounded ||
        ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2);
      const off = y * (1 + size * 3) + 1 + x * 3;
      if (inside) {
        raw[off]     = r;
        raw[off + 1] = g;
        raw[off + 2] = b;
      }
      // else: 0,0,0 (transparent / black bg — PNG RGB has no alpha here, keep black outer)
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  // compression, filter, interlace = 0

  const idat = zlib.deflateSync(raw, { level: 6 });

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Génère un ICO multi-taille (PNG inside ICO — Windows Vista+) ───────────────
function makeIco(sizes, color) {
  const pngs = sizes.map(s => makePng(s, color, true));
  const count = sizes.length;

  // Header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: ICO
  header.writeUInt16LE(count, 4);

  // Directory entries: 16 bytes each
  const dirSize  = count * 16;
  const dataOffset = 6 + dirSize;

  const dirs = [];
  let offset = dataOffset;
  for (let i = 0; i < count; i++) {
    const entry = Buffer.alloc(16);
    const s = sizes[i];
    entry.writeUInt8(s >= 256 ? 0 : s, 0);  // width  (0 = 256)
    entry.writeUInt8(s >= 256 ? 0 : s, 1);  // height (0 = 256)
    entry.writeUInt8(0,  2); // colorCount (0 = no palette)
    entry.writeUInt8(0,  3); // reserved
    entry.writeUInt16LE(1,  4); // planes
    entry.writeUInt16LE(32, 6); // bitCount
    entry.writeUInt32LE(pngs[i].length, 8);
    entry.writeUInt32LE(offset, 12);
    dirs.push(entry);
    offset += pngs[i].length;
  }

  return Buffer.concat([header, ...dirs, ...pngs]);
}

// ── Génère les fichiers ────────────────────────────────────────────────────────
const outDir  = path.join(__dirname, '..', 'build-resources');
const iconDir = path.join(__dirname, '..', 'electron');

fs.mkdirSync(outDir,  { recursive: true });
fs.mkdirSync(iconDir, { recursive: true });

// PNG 512×512 pour electron/icon.png (utilisé en dev + fenêtre)
const png512 = makePng(512, PRIMARY, true);
fs.writeFileSync(path.join(iconDir, 'icon.png'), png512);
console.log('✅ electron/icon.png créé (512×512)');

// ICO multi-taille pour NSIS
const ico = makeIco([16, 32, 48, 64, 128, 256], PRIMARY);
fs.writeFileSync(path.join(outDir, 'icon.ico'), ico);
console.log('✅ build-resources/icon.ico créé (16/32/48/64/128/256px)');

// PNG 512 pour build-resources aussi (macOS)
fs.copyFileSync(path.join(iconDir, 'icon.png'), path.join(outDir, 'icon.png'));
console.log('✅ build-resources/icon.png copié');

console.log('\n🎉 Icônes Elengi générées avec succès.');
