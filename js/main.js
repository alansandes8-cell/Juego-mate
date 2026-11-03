/* Mate Perfecto — escenas, loop, input y escalado */
(function () {
  'use strict';
  const MP = window.MP;
  const U = MP.U, Gx = MP.G, D = MP.DATA, Sfx = MP.Sfx, Play = MP.Play;
  const { rr, text } = Gx;
  const W = 720, H = 1280;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const view = { k: 1, scale: 1, dpr: 1 };

  let scene = 'title';
  let t = 0;
  let run = null;
  let sum = null;
  let shopMsg = null;

  // ---------------- guardado ----------------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* nada */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* nada */ } },
  };
  let best = store.get('mp_best', { day: 0, money: 0 });

  function newRun() { return { day: 1, money: 300, upgrades: {}, bizcochos: false, stats: { moved: 0 } }; }

  // ---------------- fondos cacheados ----------------
  let wallCache = null, tableCache = null, cacheK = 0, cacheSeats = 0;

  function makeCache(h, fn) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(W * view.k); c.height = Math.ceil(h * view.k);
    const x = c.getContext('2d');
    x.setTransform(view.k, 0, 0, view.k, 0, 0);
    fn(x);
    return c;
  }

  function paintWall(x, seatXs) {
    // pared
    const g = x.createLinearGradient(0, 0, 0, 500);
    g.addColorStop(0, '#f6e7c8'); g.addColorStop(1, '#ecd3a5');
    x.fillStyle = g; x.fillRect(0, 0, W, 500);
    x.fillStyle = 'rgba(190,140,80,.12)';
    for (let i = 0; i < W; i += 36) x.fillRect(i, 0, 14, 380);
    // ventana
    x.save();
    rr(x, 236, 150, 248, 190, 10); x.fillStyle = '#6d4426'; x.fill();
    const sky = x.createLinearGradient(0, 160, 0, 330);
    sky.addColorStop(0, '#7ec8f2'); sky.addColorStop(1, '#d9f1ff');
    rr(x, 248, 162, 224, 166, 6); x.fillStyle = sky; x.fill();
    x.save(); rr(x, 248, 162, 224, 166, 6); x.clip();
    x.fillStyle = '#ffe082'; x.beginPath(); x.arc(420, 200, 22, 0, U.TAU); x.fill();
    x.fillStyle = 'rgba(255,255,255,.9)';
    [[300, 200], [330, 192], [355, 202]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 16, 0, U.TAU); x.fill(); });
    // ciudad y el obelisco a lo lejos
    x.fillStyle = '#9fb7c8';
    [[250, 280, 30, 50], [282, 270, 24, 60], [310, 290, 40, 40], [395, 275, 28, 55], [425, 285, 50, 45]].forEach(([a, b, c, d]) => x.fillRect(a, b, c, d));
    x.fillStyle = '#c9d6df';
    x.beginPath(); x.moveTo(356, 330); x.lineTo(362, 236); x.lineTo(366, 226); x.lineTo(370, 236); x.lineTo(376, 330); x.fill();
    // árbol
    x.fillStyle = '#5d8a3a'; x.beginPath(); x.arc(262, 300, 30, 0, U.TAU); x.arc(290, 312, 24, 0, U.TAU); x.fill();
    x.restore();
    x.fillStyle = '#6d4426'; x.fillRect(357, 162, 6, 166); x.fillRect(248, 242, 224, 6);
    // cortinas
    x.fillStyle = '#c0392b';
    x.beginPath(); x.moveTo(226, 140); x.quadraticCurveTo(262, 250, 238, 350); x.lineTo(220, 350); x.lineTo(220, 140); x.fill();
    x.beginPath(); x.moveTo(494, 140); x.quadraticCurveTo(458, 250, 482, 350); x.lineTo(500, 350); x.lineTo(500, 140); x.fill();
    x.fillStyle = '#5d4037'; x.fillRect(210, 134, 300, 10);
    x.restore();
    // cartelito fileteado
    x.save();
    rr(x, 18, 150, 190, 96, 14); x.fillStyle = '#1b1b1b'; x.fill();
    x.lineWidth = 4; x.strokeStyle = '#e0b23a'; x.stroke();
    Gx.curl(x, 34, 170, 16, 1, ['#c0392b', '#e0b23a']);
    Gx.curl(x, 192, 170, 16, -1, ['#c0392b', '#e0b23a']);
    text(x, 'Que no falte', 113, 188, { size: 22, color: '#f4c542' });
    text(x, 'el mate', 113, 220, { size: 28, color: '#fff' });
    x.restore();
    // reloj
    x.save();
    x.fillStyle = '#5d4037'; x.beginPath(); x.arc(616, 196, 46, 0, U.TAU); x.fill();
    x.fillStyle = '#fffaf0'; x.beginPath(); x.arc(616, 196, 38, 0, U.TAU); x.fill();
    x.strokeStyle = '#3b2412'; x.lineWidth = 4; x.lineCap = 'round';
    x.beginPath(); x.moveTo(616, 196); x.lineTo(616, 170); x.moveTo(616, 196); x.lineTo(634, 204); x.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * U.TAU; x.fillStyle = '#3b2412'; x.beginPath(); x.arc(616 + Math.cos(a) * 31, 196 + Math.sin(a) * 31, 2, 0, U.TAU); x.fill(); }
    x.restore();
    // azulejos calcáreos
    const ty = 372;
    for (let i = 0; i < W / 42 + 1; i++) {
      for (let j = 0; j < 4; j++) {
        const px = i * 42, py = ty + j * 42;
        x.fillStyle = (i + j) % 2 ? '#f2ead8' : '#e8dcc0';
        x.fillRect(px, py, 42, 42);
        x.fillStyle = (i + j) % 2 ? '#2f6f8f' : '#b5562f';
        x.beginPath(); x.moveTo(px + 21, py + 5); x.lineTo(px + 37, py + 21); x.lineTo(px + 21, py + 37); x.lineTo(px + 5, py + 21); x.closePath(); x.fill();
        x.fillStyle = '#f2ead8'; x.beginPath(); x.arc(px + 21, py + 21, 6, 0, U.TAU); x.fill();
        x.fillStyle = '#d9a441';
        [[0, 0], [42, 0], [0, 42], [42, 42]].forEach(([a, b]) => { x.beginPath(); x.arc(px + a, py + b, 6, 0, U.TAU); x.fill(); });
      }
    }
    x.fillStyle = '#7a4f2c'; x.fillRect(0, 364, W, 10);
    // sillas
    (seatXs || []).forEach((sx) => {
      x.fillStyle = '#8b5a2b';
      rr(x, sx - 70, 300, 140, 26, 10); x.fill();
      x.fillRect(sx - 64, 320, 14, 190); x.fillRect(sx + 50, 320, 14, 190);
      x.fillStyle = '#a06a35'; rr(x, sx - 54, 350, 108, 16, 6); x.fill();
      x.fillStyle = 'rgba(255,255,255,.15)'; rr(x, sx - 66, 304, 132, 6, 3); x.fill();
    });
  }

  function paintTable(x) {
    const top = 500;
    const g = x.createLinearGradient(0, top, 0, 1040);
    g.addColorStop(0, '#b77b45'); g.addColorStop(1, '#8a5530');
    x.fillStyle = g; x.fillRect(0, top, W, 540);
    // tablones
    x.strokeStyle = 'rgba(60,30,10,.35)'; x.lineWidth = 3;
    for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(0, top + i * 92); x.lineTo(W, top + i * 92); x.stroke(); }
    const r = U.seeded(7);
    x.strokeStyle = 'rgba(70,35,10,.18)'; x.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      const yy = top + 10 + r() * 520, xx = r() * W;
      x.beginPath(); x.moveTo(xx, yy); x.bezierCurveTo(xx + 40, yy - 4, xx + 80, yy + 4, xx + 130, yy); x.stroke();
    }
    x.fillStyle = '#d29a5f'; x.fillRect(0, top, W, 10);
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, top + 10, W, 6);
    // individual tejido bajo el mate
    x.save();
    x.translate(270, 930);
    x.fillStyle = '#c0392b'; x.beginPath(); x.ellipse(0, 0, 170, 40, 0, 0, U.TAU); x.fill();
    x.strokeStyle = '#f4c542'; x.lineWidth = 5; x.beginPath(); x.ellipse(0, 0, 155, 33, 0, 0, U.TAU); x.stroke();
    x.strokeStyle = '#1d6b3a'; x.lineWidth = 3; x.setLineDash([10, 8]); x.beginPath(); x.ellipse(0, 0, 140, 27, 0, 0, U.TAU); x.stroke();
    x.restore();
    // panel inferior
    const p = x.createLinearGradient(0, 1028, 0, H);
    p.addColorStop(0, '#4a2c17'); p.addColorStop(1, '#2a170b');
    x.fillStyle = p; x.fillRect(0, 1028, W, H - 1028);
    x.fillStyle = '#e0b23a'; x.fillRect(0, 1028, W, 4);
  }

  function ensureCaches(nSeats) {
    if (!wallCache || cacheK !== view.k || cacheSeats !== nSeats) {
      cacheK = view.k; cacheSeats = nSeats;
      const xs = nSeats === 2 ? [210, 510] : nSeats === 3 ? [120, 360, 600] : [];
      wallCache = makeCache(500, (x) => paintWall(x, xs));
      tableCache = makeCache(H, (x) => paintTable(x));
    }
  }

  function drawWall(c) {
    const st = Play.state;
    ensureCaches(scene === 'play' && st ? st.nSeats : 0);
    c.drawImage(wallCache, 0, 0, W, 500);
  }
  function drawTable(c) {
    c.drawImage(tableCache, 0, 0, W, H);
  }

  // ---------------- escenas ----------------
  const TITLE_BTNS = () => {
    const saved = store.get('mp_run', null);
    const b = [];
    let y = 760;
    if (saved && saved.day > 1) { b.push({ id: 'cont', x: 160, y, w: 400, h: 92, label: 'Seguir', sub: 'Día ' + saved.day + ' · ' + U.money(saved.money), color: '#2e7d32', size: 38 }); y += 112; }
    b.push({ id: 'play', x: 160, y, w: 400, h: 92, label: saved && saved.day > 1 ? 'Nueva partida' : '¡Jugar!', color: saved && saved.day > 1 ? '#e2a93b' : '#2e7d32', size: 40, pulse: !(saved && saved.day > 1) });
    y += 112;
    b.push({ id: 'how', x: 160, y, w: 400, h: 76, label: 'Cómo se juega', color: '#1e63b5', size: 30 });
    y += 96;
    b.push({ id: 'mus', x: 160, y, w: 192, h: 62, label: 'Música', sub: Sfx.musicOn ? 'Sí' : 'No', color: '#6d4c41', size: 22 });
    b.push({ id: 'sfx', x: 368, y, w: 192, h: 62, label: 'Sonido', sub: Sfx.sfxOn ? 'Sí' : 'No', color: '#6d4c41', size: 22 });
    return b;
  };

  function drawTitle() {
    ensureCaches(0);
    ctx.drawImage(wallCache, 0, 0, W, 500);
    ctx.drawImage(tableCache, 0, 0, W, H);
    ctx.fillStyle = 'rgba(20,10,4,.35)'; ctx.fillRect(0, 0, W, H);
    // título
    rr(ctx, 40, 70, W - 80, 250, 36); ctx.fillStyle = '#141414'; ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = '#e0b23a'; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#c0392b'; rr(ctx, 56, 86, W - 112, 218, 28); ctx.stroke();
    Gx.fileteTitle(ctx, 'MATE', W / 2, 160, 96, t);
    Gx.fileteTitle(ctx, 'PERFECTO', W / 2, 250, 76, t + 1);
    // mate girando suave
    const s = 1.05 + Math.sin(t * 2) * 0.03;
    const yerbaDemo = { yerba: 0.75, freshR: 1, bombilla: true, water: 0.85 + Math.sin(t) * 0.1, sweet: false, herb: true };
    Gx.drawMate(ctx, W / 2 - 30, 560 + Math.sin(t * 1.6) * 8, s, yerbaDemo, t, { calabaza: true });
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.5 + i / 3) % 1;
      ctx.save(); ctx.globalAlpha = (1 - k) * 0.6; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(W / 2 + 16 + Math.sin(k * 6 + i) * 14, 440 - k * 110, 10 + k * 22, 0, U.TAU); ctx.fill(); ctx.restore();
    }
    text(ctx, 'El juego del cebador', W / 2, 712, { size: 30, color: '#fff3b0', stroke: '#3b1d0e', sw: 7 });
    for (const b of TITLE_BTNS()) Gx.button(ctx, b, t);
    if (best.day > 0) text(ctx, 'Récord: llegaste al día ' + best.day, W / 2, 1250, { size: 22, font: U.FONT_B, weight: '900', color: '#ffd54f' });
  }

  function titleDown(x, y) {
    for (const b of TITLE_BTNS()) {
      if (!Gx.hit(b, x, y)) continue;
      Sfx.click();
      if (b.id === 'play') { run = newRun(); store.del('mp_run'); startDay(); }
      else if (b.id === 'cont') { run = store.get('mp_run', null) || newRun(); run.stats = run.stats || { moved: 0 }; startDay(); }
      else if (b.id === 'how') scene = 'how';
      else if (b.id === 'mus') Sfx.toggleMusic();
      else if (b.id === 'sfx') Sfx.toggleSfx();
      return;
    }
  }

  function startDay() {
    scene = 'play';
    Play.start(run);
  }

  // -------- cómo se juega --------
  const HOW = [
    ['yerba', 'Yerba', 'Mantené apretado sobre el mate. Unos ¾ está joya: poca se lava rápido, mucha tapa la bombilla.'],
    ['bombilla', 'Bombilla', 'Ponela en el hueco. Y después... ¡NUNCA se mueve la bombilla!'],
    ['pava', 'El agua', 'Prendé el fuego y mirá el termómetro. Entre 65° y 90°, según el gusto. ¡Si hierve, cambiala!'],
    ['pava', 'Cebar', 'Con la pava, mantené apretado en el hueco, al lado de la bombilla. Llenalo sin rebalsar. Si mojás la montañita se lava antes.'],
    ['mate', 'El primero', 'El primer mate de la yerba nueva es del cebador: tocá "Me lo tomo yo".'],
    ['azucar', 'Dulce o amargo', 'El azúcar queda en la yerba hasta que la cambies. Ojo con los que toman amargo...'],
    ['yuyo', 'Yuyos', 'A algunos les gusta con peperina. También queda en la yerba.'],
    ['bizcocho', 'La ronda', 'Tocá a quien espera para pasarle el mate. Si queda contento, pide otro y deja propina. Si dice "gracias", no quiere más.'],
    ['termo', 'Inflación', 'Cada día todo sube 25%. Llegá a la meta de ganancia o te fundís. Entre días comprá mejoras.'],
  ];

  function drawHow() {
    ensureCaches(0);
    ctx.drawImage(wallCache, 0, 0, W, 500); ctx.drawImage(tableCache, 0, 0, W, H);
    ctx.fillStyle = 'rgba(20,10,4,.6)'; ctx.fillRect(0, 0, W, H);
    rr(ctx, 24, 24, W - 48, H - 48, 30); ctx.fillStyle = '#fbf0d9'; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#1d6b3a'; ctx.stroke();
    Gx.fileteTitle(ctx, 'Cómo se juega', W / 2, 92, 54, t);
    HOW.forEach(([ic, title, body], i) => {
      const y = 152 + i * 110;
      rr(ctx, 44, y, 96, 96, 18); ctx.fillStyle = '#f0dfbd'; ctx.fill();
      Gx.iconFor(ctx, ic, 92, y + 50, ic === 'mate' ? 1.1 : 0.85);
      text(ctx, title, 158, y + 18, { size: 26, color: '#1d6b3a', align: 'left' });
      ctx.font = `700 19px ${U.FONT_B}`;
      Gx.wrap(ctx, body, W - 210).slice(0, 3).forEach((l, j) => text(ctx, l, 158, y + 46 + j * 22, { size: 19, font: U.FONT_B, weight: '700', color: '#3b2412', align: 'left' }));
    });
    Gx.button(ctx, { x: 210, y: 1150, w: 300, h: 80, label: '¡Entendido!', color: '#2e7d32', size: 34 }, t);
  }

  // -------- resumen del día --------
  function goSummary(s) {
    sum = s;
    Sfx.silenceLoops();
    run.bizcochos = false;
    if (s.passed) {
      if (s.day + 1 > best.day) { best = { day: s.day + 1, money: run.money }; store.set('mp_best', best); }
      Sfx.yay();
    } else {
      if (s.day > best.day) { best = { day: s.day, money: run.money }; store.set('mp_best', best); }
      store.del('mp_run');
      Sfx.fail();
    }
    scene = 'summary';
    sum.t0 = t;
  }

  const SUM_BTNS = () => sum.passed
    ? [{ id: 'shop', x: 160, y: 1060, w: 400, h: 96, label: 'A la tienda', color: '#2e7d32', size: 40, pulse: true }]
    : [{ id: 'again', x: 160, y: 1030, w: 400, h: 92, label: 'Volver a empezar', color: '#2e7d32', size: 36 },
      { id: 'menu', x: 160, y: 1140, w: 400, h: 76, label: 'Menú', color: '#6d4c41', size: 30 }];

  function drawSummary() {
    ensureCaches(0);
    ctx.drawImage(wallCache, 0, 0, W, 500); ctx.drawImage(tableCache, 0, 0, W, H);
    ctx.fillStyle = 'rgba(20,10,4,.6)'; ctx.fillRect(0, 0, W, H);
    rr(ctx, 40, 60, W - 80, 940, 34); ctx.fillStyle = '#fbf0d9'; ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = sum.passed ? '#1d6b3a' : '#a12a1c'; ctx.stroke();
    Gx.fileteTitle(ctx, sum.passed ? '¡Día superado!' : '¡Te fundiste!', W / 2, 140, 58, t);
    text(ctx, 'Día ' + sum.day, W / 2, 210, { size: 30, color: '#5d4037' });
    const s = sum.stats;
    const rows = [
      ['Mates servidos', String(s.served)],
      ['Excelentes', String(s.excellent)],
      ['Se fueron enojados', String(s.bad + s.lost)],
      ['Cobrado (con propinas)', U.money(s.earned)],
      ['Propinas', U.money(s.tips)],
      ['Yerba', '-' + U.money(s.yerba)],
      ['Multas y trapos', '-' + U.money(s.fines)],
    ];
    const k = U.clamp((t - sum.t0) * 3, 0, rows.length);
    rows.forEach(([a, b], i) => {
      if (i > k) return;
      const y = 280 + i * 58;
      text(ctx, a, 90, y, { size: 26, font: U.FONT_B, weight: '800', color: '#5d4037', align: 'left' });
      text(ctx, b, W - 90, y, { size: 30, color: b.startsWith('-') ? '#a12a1c' : '#1d6b3a', align: 'right' });
    });
    ctx.fillStyle = '#d7c3a0'; ctx.fillRect(80, 690, W - 160, 4);
    text(ctx, 'Ganancia del día', 90, 740, { size: 30, color: '#3b2412', align: 'left' });
    text(ctx, U.money(sum.net), W - 90, 740, { size: 38, color: sum.net >= sum.meta ? '#1d6b3a' : '#a12a1c', align: 'right' });
    text(ctx, 'Meta', 90, 800, { size: 26, font: U.FONT_B, weight: '800', color: '#5d4037', align: 'left' });
    text(ctx, U.money(sum.meta), W - 90, 800, { size: 30, color: '#5d4037', align: 'right' });
    text(ctx, 'En la billetera', 90, 856, { size: 26, font: U.FONT_B, weight: '800', color: '#5d4037', align: 'left' });
    text(ctx, U.money(sum.money), W - 90, 856, { size: 30, color: sum.money >= 0 ? '#1d6b3a' : '#a12a1c', align: 'right' });
    const msg = sum.passed
      ? (s.excellent >= s.served * 0.7 && s.served > 4 ? '¡Sos un cebador de primera!' : '¡Bien ahí! Mañana todo sale más caro...')
      : sum.money < 0 ? 'Quedaste en rojo. ¡A vender la pava!' : 'No llegaste a la meta. La inflación no perdona.';
    text(ctx, msg, W / 2, 940, { size: 26, color: sum.passed ? '#1d6b3a' : '#a12a1c' });
    for (const b of SUM_BTNS()) Gx.button(ctx, b, t);
  }

  function summaryDown(x, y) {
    for (const b of SUM_BTNS()) {
      if (!Gx.hit(b, x, y)) continue;
      Sfx.click();
      if (b.id === 'shop') { scene = 'shop'; shopMsg = null; }
      else if (b.id === 'again') { run = newRun(); startDay(); }
      else if (b.id === 'menu') scene = 'title';
    }
  }

  // -------- tienda --------
  function priceOf(u) { return Math.round((u.price * Math.pow(1.25, run.day)) / 10) * 10; }
  function shopCards() {
    return D.UPGRADES.map((u, i) => ({ u, x: 36, y: 214 + i * 124, w: W - 72, h: 112 }));
  }
  const SHOP_NEXT = { x: 140, y: 1000 + 0, w: 440, h: 100, label: '', color: '#2e7d32', size: 36 };

  function drawShop() {
    ensureCaches(0);
    ctx.drawImage(wallCache, 0, 0, W, 500); ctx.drawImage(tableCache, 0, 0, W, H);
    ctx.fillStyle = 'rgba(20,10,4,.65)'; ctx.fillRect(0, 0, W, H);
    Gx.fileteTitle(ctx, 'El almacén', W / 2, 80, 60, t);
    text(ctx, 'Tenés ' + U.money(run.money), W / 2, 160, { size: 34, color: '#7CFC8A', stroke: '#0d3b1e', sw: 7 });
    for (const c of shopCards()) {
      const owned = c.u.consumable ? run.bizcochos : run.upgrades[c.u.id];
      const pr = priceOf(c.u), can = !owned && run.money >= pr;
      rr(ctx, c.x, c.y + 6, c.w, c.h, 22); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();
      rr(ctx, c.x, c.y, c.w, c.h, 22); ctx.fillStyle = owned ? '#dcedc8' : '#fbf0d9'; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = owned ? '#2e7d32' : can ? '#e0b23a' : '#8d6e63'; ctx.stroke();
      rr(ctx, c.x + 12, c.y + 12, 88, 88, 16); ctx.fillStyle = '#f0dfbd'; ctx.fill();
      Gx.iconFor(ctx, c.u.id === 'alpaca' ? 'alpaca' : c.u.icon, c.x + 56, c.y + 58, c.u.icon === 'mate' ? 1.1 : c.u.icon === 'pava' ? 0.8 : 0.8);
      text(ctx, c.u.name, c.x + 116, c.y + 30, { size: 25, color: '#3b2412', align: 'left' });
      ctx.font = `700 18px ${U.FONT_B}`;
      Gx.wrap(ctx, c.u.desc, c.w - 290).slice(0, 2).forEach((l, j) => text(ctx, l, c.x + 116, c.y + 62 + j * 22, { size: 18, font: U.FONT_B, weight: '700', color: '#5d4037', align: 'left' }));
      const bx = c.x + c.w - 156, by = c.y + 26;
      Gx.button(ctx, { x: bx, y: by, w: 140, h: 60, label: owned ? '¡Listo!' : U.money(pr), color: owned ? '#2e7d32' : can ? '#e2a93b' : '#9c9c9c', size: 24, r: 16 }, t);
    }
    if (shopMsg && t - shopMsg.t < 2) text(ctx, shopMsg.text, W / 2, 975, { size: 26, color: shopMsg.col, stroke: '#000', sw: 5 });
    Gx.button(ctx, Object.assign({}, SHOP_NEXT, { label: '¡A cebar!', sub: 'Día ' + (run.day + 1), pulse: true }), t);
  }

  function shopDown(x, y) {
    for (const c of shopCards()) {
      if (!Gx.hit(c, x, y)) continue;
      const owned = c.u.consumable ? run.bizcochos : run.upgrades[c.u.id];
      const pr = priceOf(c.u);
      if (owned) { shopMsg = { text: 'Ya lo tenés', col: '#fff', t }; return; }
      if (run.money < pr) { shopMsg = { text: '¡No te alcanza, che!', col: '#ff8a80', t }; Sfx.fail(); return; }
      run.money -= pr;
      if (c.u.consumable) run.bizcochos = true; else run.upgrades[c.u.id] = true;
      shopMsg = { text: '¡Compraste ' + c.u.name + '!', col: '#7CFC8A', t };
      Sfx.cash();
      return;
    }
    if (Gx.hit(SHOP_NEXT, x, y)) {
      Sfx.click();
      run.day++;
      store.set('mp_run', run);
      startDay();
    }
  }

  // ---------------- loop ----------------
  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;
    t += dt;
    ctx.setTransform(view.k, 0, 0, view.k, 0, 0);
    ctx.clearRect(0, 0, W, H);
    switch (scene) {
      case 'title': drawTitle(); break;
      case 'how': drawHow(); break;
      case 'play': Play.update(dt); if (scene === 'play') Play.draw(ctx); else frameScene(); break;
      case 'summary': drawSummary(); break;
      case 'shop': drawShop(); break;
    }
    requestAnimationFrame(frame);
  }
  function frameScene() {
    if (scene === 'summary') drawSummary();
    else if (scene === 'title') drawTitle();
  }

  // ---------------- escalado ----------------
  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const scale = Math.min(vw / W, vh / H);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    view.scale = scale; view.dpr = dpr; view.k = scale * dpr;
    canvas.style.width = Math.floor(W * scale) + 'px';
    canvas.style.height = Math.floor(H * scale) + 'px';
    canvas.width = Math.floor(W * scale * dpr);
    canvas.height = Math.floor(H * scale * dpr);
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));

  // ---------------- input ----------------
  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  }
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    Sfx.init();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
    const [x, y] = toGame(e);
    switch (scene) {
      case 'title': titleDown(x, y); break;
      case 'how': if (y > 1100) { Sfx.click(); scene = 'title'; } break;
      case 'play': Play.down(x, y); break;
      case 'summary': if (t - sum.t0 > 0.8) summaryDown(x, y); break;
      case 'shop': shopDown(x, y); break;
    }
  });
  canvas.addEventListener('pointermove', (e) => { if (scene === 'play') { const [x, y] = toGame(e); Play.move(x, y); } });
  const upH = (e) => { if (scene === 'play') { const [x, y] = toGame(e); Play.up(x, y); } };
  canvas.addEventListener('pointerup', upH);
  canvas.addEventListener('pointercancel', upH);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    Sfx.init();
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === ' ') e.preventDefault();
    if (scene === 'play') Play.key(k, true);
    else if ((k === 'Enter' || k === ' ') && scene === 'title') { run = store.get('mp_run', null) || newRun(); startDay(); }
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (scene === 'play') Play.key(k, false);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { Play.blur(); Sfx.suspend(); } else Sfx.resume();
  });
  window.addEventListener('blur', () => { if (scene === 'play') Play.blur(); });

  MP.ui = {
    drawWall, drawTable,
    resetCaches() { wallCache = null; },
    goSummary, goTitle() { scene = 'title'; },
    get scene() { return scene; },
    // para pruebas automatizadas
    _debug: { get run() { return run; }, setScene(s) { scene = s; } },
  };

  resize();
  const go = () => requestAnimationFrame((n) => { last = n; frame(n); });
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]).then(() => { wallCache = null; go(); });
  } else go();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
