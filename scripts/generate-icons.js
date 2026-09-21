import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height, isMaskable = false) {
  // Simple uncompressed or deflate PNG builder
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA color type
  ihdrData.writeUInt8(0, 10); // Compression method
  ihdrData.writeUInt8(0, 11); // Filter method
  ihdrData.writeUInt8(0, 12); // Interlace method
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data with filter byte (0) per row
  const rowStride = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowStride);

  const cx = width / 2;
  const cy = height / 2;
  const rMax = Math.min(width, height) / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep navy background: #0f172a (15, 23, 42)
      let r = 15;
      let g = 23;
      let b = 42;
      let a = 255;

      // Outer gradient to dark indigo
      const grad = Math.min(1, dist / rMax);
      r = Math.round(11 + grad * 15);
      g = Math.round(19 + grad * 15);
      b = Math.round(41 + grad * 35);

      // Subtle pulse ring
      if (Math.abs(dist - rMax * 0.7) < 2.5) {
        r = 56; g = 189; b = 248; a = 200; // Cyan ring
      } else if (Math.abs(dist - rMax * 0.5) < 1.5) {
        r = 99; g = 102; b = 241; a = 160; // Indigo ring
      }

      // ECG pulse line in center: simplified cross & heartbeat
      const normX = (x - cx) / (rMax * 0.6);
      const normY = (y - cy) / (rMax * 0.6);

      // Draw ECG wave
      if (Math.abs(normX) <= 1.0) {
        let expectedY = 0;
        if (normX > -0.7 && normX < -0.4) expectedY = 0;
        else if (normX >= -0.4 && normX < -0.2) expectedY = -0.2 * Math.sin((normX + 0.4) / 0.2 * Math.PI);
        else if (normX >= -0.2 && normX < 0.0) expectedY = 0.8 * Math.sin((normX + 0.2) / 0.2 * Math.PI);
        else if (normX >= 0.0 && normX < 0.25) expectedY = -0.4 * Math.sin(normX / 0.25 * Math.PI);
        else expectedY = 0;

        const diffY = Math.abs(normY - expectedY);
        if (diffY < 0.06) {
          const intensity = Math.max(0, 1 - diffY / 0.06);
          r = Math.round(56 * intensity + r * (1 - intensity));
          g = Math.round(189 * intensity + g * (1 - intensity));
          b = Math.round(248 * intensity + b * (1 - intensity));
        }
      }

      // Rounded corners for non-maskable icon
      if (!isMaskable) {
        const cornerR = width * 0.22;
        const cornerX = Math.min(Math.abs(x - cornerR), Math.abs(x - (width - cornerR)));
        const cornerY = Math.min(Math.abs(y - cornerR), Math.abs(y - (height - cornerR)));
        if (x < cornerR && y < cornerR && Math.hypot(x - cornerR, y - cornerR) > cornerR) a = 0;
        if (x > width - cornerR && y < cornerR && Math.hypot(x - (width - cornerR), y - cornerR) > cornerR) a = 0;
        if (x < cornerR && y > height - cornerR && Math.hypot(x - cornerR, y - (height - cornerR)) > cornerR) a = 0;
        if (x > width - cornerR && y > height - cornerR && Math.hypot(x - (width - cornerR), y - (height - cornerR)) > cornerR) a = 0;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

// Simple standard CRC32 table & function
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, 64, false));

console.log('Successfully generated PWA icon assets!');
