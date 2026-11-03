/*
 * Genera el arte para las tiendas con Playwright:
 *   npm run assets:art      -> assets/*.png, icon-512.png, store/feature-graphic.png y capturas
 * Requiere: npx playwright install chromium (una sola vez)
 */
const path = require('path');
const http = require('http');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };

function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const f = path.join(ROOT, u === '/' ? 'index.html' : u);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rsp);
    }).listen(0, () => res(srv));
  });
}


// Escenas armadas para las capturas de la tienda
const SCENES = [
  () => { MP.ui._debug.setScene('title'); },
  () => {
    const r = MP.Eco.newRun(); r.day = 5; r.money = 8450; r.lives = 2;
    r.own.mates = { imperial: true, calabaza: true }; r.own.bombillas = { alpaca: true }; r.own.segundo = true; r.own.electrica = true;
    r.equip = { mates: ['imperial', 'calabaza'], bombilla: 'alpaca' };
    r.inv = { yerba: { canarita: 5, rosamundo: 4 }, azucar: 14, yuyo: { peperina: 5, poleo: 6 }, food: { bizcochos: 9, medialunas: 6 } };
    MP.ui._debug.run = r; MP.ui._debug.setScene('play'); MP.Play.start(r);
    const G = MP.Play.state; G.intro = false; G.event = null;
    for (const m of G.mates) { m.yerba = 0.76; m.brand = 'canarita'; m.maxFresh = 13; m.fresh = 11; m.bombilla = true; m.first = false; }
    G.mates[1].sweet = true; G.mates[1].sugarNow = true; G.mates[1].yuyo = 'peperina';
    G.mates[0].water = 0.92; G.mates[0].waterTemp = 80; G.pava.fire = true; G.pava.temp = 80; G.pava.target = 80;
    G.stats.earned = 760; G.timeLeft = 87;
  },
  () => { const G = MP.Play.state; const c = G.seats.find((s) => s && s.state === 'waiting'); if (c) MP.Play.down(c.x, 400); },
  () => { MP.Truco.start({ mode: 'game', persona: MP.DATA.PERSONAS[4], stake: 980, onDone: () => {} }); MP.ui._debug.setScene('truco'); },
  () => { MP.Shop.open(MP.ui._debug.run, 'day', () => {}, 'mates'); MP.ui._debug.setScene('shop'); },
];

(async () => {
  const srv = await serve();
  const base = 'http://localhost:' + srv.address().port;
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const out = [
    ['icon', 'assets/icon-only.png', false], ['fg', 'assets/icon-foreground.png', true], ['bg', 'assets/icon-background.png', false],
    ['splash', 'assets/splash.png', false], ['splash', 'assets/splash-dark.png', false], ['feature', 'store/feature-graphic.png', false], ['pwa', 'icon-512.png', false],
  ];
  for (const [w, file, transparent] of out) {
    const p = await browser.newPage();
    await p.goto(`${base}/tools/assets.html?w=${w}`);
    await p.waitForFunction(() => document.title === 'listo');
    await p.locator('#c').screenshot({ path: path.join(ROOT, file), omitBackground: transparent });
    await p.close();
    console.log('✓', file);
  }
  // capturas de pantalla de la tienda (teléfono vertical)
  const shots = [
    { name: 'android', w: 1080, h: 1920, dpr: 1 },
    { name: 'iphone-6.9', w: 440, h: 956, dpr: 3 },   // 1320 x 2868
    { name: 'ipad-13', w: 1032, h: 1376, dpr: 2 },    // 2064 x 2752
  ];
  for (const s of shots) {
    const p = await browser.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: s.dpr });
    await p.goto(base + '/index.html');
    await p.waitForTimeout(1500);
    for (let i = 0; i < SCENES.length; i++) {
      await p.evaluate(SCENES[i]);
      await p.waitForTimeout(i === 0 ? 400 : 2600);
      const f = `store/screenshots/${s.name}-${i + 1}.png`;
      fs.mkdirSync(path.join(ROOT, 'store/screenshots'), { recursive: true });
      await p.screenshot({ path: path.join(ROOT, f) });
      console.log('✓', f);
    }
    await p.close();
  }
  await browser.close();
  srv.close();
})();
