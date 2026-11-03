/* Copia el juego a www/ (la carpeta que Capacitor mete dentro de la app) */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'www');
const INCLUDE = ['index.html', 'style.css', 'manifest.webmanifest', 'icon.svg', 'icon-512.png', 'privacidad.html', 'js', 'fonts', 'icons'];
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
for (const f of INCLUDE) {
  const src = path.join(ROOT, f);
  if (!fs.existsSync(src)) continue;
  fs.cpSync(src, path.join(OUT, f), { recursive: true });
}
console.log('Listo: juego copiado a www/');
