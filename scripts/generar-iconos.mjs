// Genera los íconos PNG de la PWA sin dependencias: fondo oscuro y una "H" en color acento.
// Uso: npm run iconos
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLICO = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const FONDO = [0x0e, 0x10, 0x12];
const ACENTO = [0xc6, 0xf3, 0x5e];

const TABLA = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TABLA[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bloque(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const td = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([largo, td, crc]);
}

// escala = alto de la "H" relativo al ícono.
function dentroH(u, v, escala) {
  const alto = escala;
  const ancho = escala * 0.82;
  const x = (u - (0.5 - ancho / 2)) / ancho;
  const y = (v - (0.5 - alto / 2)) / alto;
  if (x < 0 || x > 1 || y < 0 || y > 1) return false;
  return x <= 0.3 || x >= 0.7 || (y >= 0.4 && y <= 0.6);
}

function png(tam, escala) {
  const fila = tam * 4 + 1;
  const crudo = Buffer.alloc(fila * tam);
  const SUB = 4;
  for (let y = 0; y < tam; y++) {
    crudo[y * fila] = 0;
    for (let x = 0; x < tam; x++) {
      let dentro = 0;
      for (let sy = 0; sy < SUB; sy++) for (let sx = 0; sx < SUB; sx++) if (dentroH((x + (sx + 0.5) / SUB) / tam, (y + (sy + 0.5) / SUB) / tam, escala)) dentro++;
      const t = dentro / (SUB * SUB);
      const o = y * fila + 1 + x * 4;
      for (let c = 0; c < 3; c++) crudo[o + c] = Math.round(FONDO[c] + (ACENTO[c] - FONDO[c]) * t);
      crudo[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tam, 0);
  ihdr.writeUInt32BE(tam, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 6; // RGBA
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), bloque('IHDR', ihdr), bloque('IDAT', deflateSync(crudo, { level: 9 })), bloque('IEND', Buffer.alloc(0))]);
}

mkdirSync(PUBLICO, { recursive: true });
const salidas = [
  ['icon-192.png', 192, 0.5],
  ['icon-512.png', 512, 0.5],
  ['icon-maskable-512.png', 512, 0.42], // dentro de la zona segura del 80 %
  ['apple-touch-icon.png', 180, 0.5],
];
for (const [nombre, tam, escala] of salidas) {
  writeFileSync(join(PUBLICO, nombre), png(tam, escala));
  console.log(`public/${nombre}`);
}
