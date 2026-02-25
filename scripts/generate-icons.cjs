#!/usr/bin/env node
/**
 * Génère les icônes PWA pour iOS 16.4+ Web Push.
 * Exécuter : node scripts/generate-icons.cjs
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SIZES = [72, 96, 128, 144, 152, 167, 180, 192, 384, 512];
const COLOR = { r: 5, g: 150, b: 105 }; // #059669 emerald

function createPng(size) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (size * y + x) << 2;
      png.data[i] = COLOR.r;
      png.data[i + 1] = COLOR.g;
      png.data[i + 2] = COLOR.b;
      png.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

fs.mkdirSync(ICONS_DIR, { recursive: true });

for (const size of SIZES) {
  fs.writeFileSync(path.join(ICONS_DIR, `icon-${size}.png`), createPng(size));
}
fs.writeFileSync(path.join(ICONS_DIR, 'badge-72.png'), createPng(72));

console.log('✓ Icônes PWA générées dans public/icons/');
