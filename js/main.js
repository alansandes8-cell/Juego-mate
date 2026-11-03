/* Mate Perfecto — escenas, loop, input y escalado */
(function () {
  'use strict';
  const MP = window.MP;
  const U = MP.U, Gx = MP.G, D = MP.DATA, Sfx = MP.Sfx, Play = MP.Play, Eco = MP.Eco;
  const { rr, text } = Gx;
  const W = 720, H = 1280;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const view = { k: 1, scale: 1, dpr: 1 };

  let scene = 'title';
  let t = 0;
  let run = null;
  let sum = null;
  let offer = null;
  let modalQ = null;
  let toastG = null;

  // ---------------- guardado ----------------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* nada */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* nada */ } },
  };
  let best = store.get('mp_best', { day: 0 });
  const saveRun = () => { if (run) { store.set('mp_run2', run); if (run.adsOff) store.set('mp_adsoff', true); } };

  // ---------------- fondos cacheados ----------------
  let wallCache = null, tableCache = null, cacheK = 0, cacheSeats = -1;

  function makeCache(h, fn) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(W * view.k); c.height = Math.ceil(h * view.k);
    const x = c.getContext('2d');
    x.setTransform(view.k, 0, 0, view.k, 0, 0);
    fn(x);
    return c;
  }

  function paintWall(x, seatXs) {
    const g = x.createLinearGradient(0, 0, 0, 500);
    g.addColorStop(0, '#f6e7c8'); g.addColorStop(1, '#ecd3a5');
    x.fillStyle = g; x.fillRect(0, 0, W, 500);
    x.fillStyle = 'rgba(190,140,80,.12)';
    for (let i = 0; i < W; i += 36) x.fillRect(i, 0, 14, 380);
    x.save();
    rr(x, 236, 150, 248, 190, 10); x.fillStyle = '#6d4426'; x.fill();
    const sky = x.createLinearGradient(0, 160, 0, 330);
    sky.addColorStop(0, '#7ec8f2'); sky.addColorStop(1, '#d9f1ff');
    rr(x, 248, 162, 224, 166, 6); x.fillStyle = sky; x.fill();
    x.save(); rr(x, 248, 162, 224, 166, 6); x.clip();
    x.fillStyle = '#ffe082'; x.beginPath(); x.arc(420, 200, 22, 0, U.TAU); x.fill();
    x.fillStyle = 'rgba(255,255,255,.9)';
    [[300, 200], [330, 192], [355, 202]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 16, 0, U.TAU); x.fill(); });
    x.fillStyle = '#9fb7c8';
    [[250, 280, 30, 50], [282, 270, 24, 60], [310, 290, 40, 40], [395, 275, 28, 55], [425, 285, 50, 45]].forEach(([a, b, c, d]) => x.fillRect(a, b, c, d));
    x.fillStyle = '#c9d6df';
    x.beginPath(); x.moveTo(356, 330); x.lineTo(362, 236); x.lineTo(366, 226); x.lineTo(370, 236); x.lineTo(376, 330); x.fill();
    x.fillStyle = '#5d8a3a'; x.beginPath(); x.arc(262, 300, 30, 0, U.TAU); x.arc(290, 312, 24, 0, U.TAU); x.fill();
    x.restore();
    x.fillStyle = '#6d4426'; x.fillRect(357, 162, 6, 166); x.fillRect(248, 242, 224, 6);
    x.fillStyle = '#c0392b';
    x.beginPath(); x.moveTo(226, 140); x.quadraticCurveTo(262, 250, 238, 350); x.lineTo(220, 350); x.lineTo(220, 140); x.fill();
    x.beginPath(); x.moveTo(494, 140); x.quadraticCurveTo(458, 250, 482, 350); x.lineTo(500, 350); x.lineTo(500, 140); x.fill();
    x.fillStyle = '#5d4037'; x.fillRect(210, 134, 300, 10);
    x.restore();
    x.save();
    rr(x, 18, 150, 190, 96, 14); x.fillStyle = '#1b1b1b'; x.fill();
    x.lineWidth = 4; x.strokeStyle = '#e0b23a'; x.stroke();
    Gx.curl(x, 34, 170, 16, 1, ['#c0392b', '#e0b23a']);
    Gx.curl(x, 192, 170, 16, -1, ['#c0392b', '#e0b23a']);
    text(x, 'Que no falte', 113, 188, { size: 22, color: '#f4c542' });
    text(x, 'el mate', 113, 220, { size: 28, color: '#fff' });
    x.restore();
    x.save();
    x.fillStyle = '#5d4037'; x.beginPath(); x.arc(616, 196, 46, 0, U.TAU); x.fill();
    x.fillStyle = '#fffaf0'; x.beginPath(); x.arc(616, 196, 38, 0, U.TAU); x.fill();
    x.strokeStyle = '#3b2412'; x.lineWidth = 4; x.lineCap = 'round';
    x.beginPath(); x.moveTo(616, 196); x.lineTo(616, 170); x.moveTo(616, 196); x.lineTo(634, 204); x.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * U.TAU; x.fillStyle = '#3b2412'; x.beginPath(); x.arc(616 + Math.cos(a) * 31, 196 + Math.sin(a) * 31, 2, 0, U.TAU); x.fill(); }
    x.restore();
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
    x.save();
    x.translate(240, 930);
    x.fillStyle = '#c0392b'; x.beginPath(); x.ellipse(0, 0, 200, 40, 0, 0, U.TAU); x.fill();
    x.strokeStyle = '#f4c542'; x.lineWidth = 5; x.beginPath(); x.ellipse(0, 0, 185, 33, 0, 0, U.TAU); x.stroke();
    x.strokeStyle = '#1d6b3a'; x.lineWidth = 3; x.setLineDash([10, 8]); x.beginPath(); x.ellipse(0, 0, 170, 27, 0, 0, U.TAU); x.stroke();
    x.restore();
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
  function drawTable(c) { c.drawImage(tableCache, 0, 0, W, H); }
  function drawBackdrop(c, dim) {
    ensureCaches(0);
    c.drawImage(wallCache, 0, 0, W, 500); c.drawImage(tableCache, 0, 0, W, H);
    c.fillStyle = 'rgba(20,10,4,' + (dim == null ? 0.6 : dim) + ')'; c.fillRect(0, 0, W, H);
  }

  // ---------------- modales (compras de prueba, publicidad de prueba) ----------------
  function modal(m) { modalQ = Object.assign({ t0: t }, m); }
  function fakeAd(rewarded, cb) {
    modal({
      ad: true, rewarded, dur: rewarded ? 5 : 3, cb,
      title: 'Publicidad', lines: ['Acá va tu anuncio de AdSense.', 'Modo prueba: configuralo en js/config.js'],
    });
    Sfx.suspend && Sfx.silenceLoops();
  }
  function modalButtons() {
    const m = modalQ;
    if (!m) return [];
    if (m.ad) {
      const left = m.dur - (t - m.t0);
      if (left > 0) return m.rewarded ? [{ id: 'skip', x: 210, y: 860, w: 300, h: 70, label: 'Cerrar (sin premio)', color: '#6d4c41', size: 22 }] : [];
      return [{ id: 'close', x: 210, y: 860, w: 300, h: 80, label: m.rewarded ? '¡Cobrar premio!' : 'Cerrar', color: '#2e7d32', size: 30 }];
    }
    return m.buttons.map((b, i) => Object.assign({ id: 'b' + i, x: 150, y: 760 + i * 100, w: 420, h: 84, size: 30 }, b));
  }
  function drawModal() {
    const m = modalQ;
    ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(0, 0, W, H);
    rr(ctx, 60, 340, W - 120, 640, 30); ctx.fillStyle = m.ad ? '#263238' : '#fbf0d9'; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = m.ad ? '#4fc3f7' : '#7b1fa2'; ctx.stroke();
    text(ctx, m.title, W / 2, 410, { size: 42, color: m.ad ? '#fff' : '#3b2412' });
    m.lines.forEach((l, i) => text(ctx, l, W / 2, 490 + i * 40, { size: 24, font: U.FONT_B, weight: '800', color: m.ad ? '#cfd8dc' : '#5d4037' }));
    if (m.ad) {
      const left = Math.max(0, m.dur - (t - m.t0));
      Gx.iconFor(ctx, 'tv', W / 2, 680, 2.6);
      text(ctx, left > 0 ? Math.ceil(left) + ' s' : '¡Listo!', W / 2, 790, { size: 34, color: '#4fc3f7' });
    }
    for (const b of modalButtons()) Gx.button(ctx, b, t);
  }
  function modalDown(x, y) {
    const m = modalQ;
    for (const b of modalButtons()) {
      if (!Gx.hit(b, x, y)) continue;
      Sfx.click();
      modalQ = null;
      if (m.ad) { m.cb(b.id === 'close'); return; }
      const bb = m.buttons[Number(b.id.slice(1))];
      bb.cb && bb.cb();
      return;
    }
  }

  // ---------------- título ----------------
  const TITLE_BTNS = () => {
    const saved = store.get('mp_run2', null);
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
    drawBackdrop(ctx, 0.35);
    rr(ctx, 40, 70, W - 80, 250, 36); ctx.fillStyle = '#141414'; ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = '#e0b23a'; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#c0392b'; rr(ctx, 56, 86, W - 112, 218, 28); ctx.stroke();
    Gx.fileteTitle(ctx, 'MATE', W / 2, 160, 96, t);
    Gx.fileteTitle(ctx, 'PERFECTO', W / 2, 250, 76, t + 1);
    const s = 1.05 + Math.sin(t * 2) * 0.03;
    const demo = { yerba: 0.75, freshR: 1, bombilla: true, water: 0.85 + Math.sin(t) * 0.1, sweet: false, herb: true };
    Gx.drawMate(ctx, W / 2 - 30, 560 + Math.sin(t * 1.6) * 8, s, demo, t, { kind: 'imperial' });
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
      if (b.id === 'play') newGame();
      else if (b.id === 'cont') { run = store.get('mp_run2', null); if (!run) return newGame(); startDay(); }
      else if (b.id === 'how') scene = 'how';
      else if (b.id === 'mus') Sfx.toggleMusic();
      else if (b.id === 'sfx') Sfx.toggleSfx();
      return;
    }
  }

  function newGame() {
    const keepAds = run && run.adsOff;
    run = Eco.newRun();
    if (keepAds || store.get('mp_adsoff', false)) run.adsOff = true;
    store.del('mp_run2');
    MP.Shop.open(run, 'start', () => startDay());
    scene = 'shop';
  }

  function startDay() {
    const snapCopy = JSON.parse(JSON.stringify(Object.assign({}, run, { snap: null })));
    run.snap = snapCopy;
    saveRun();
    scene = 'play';
    Play.start(run);
  }

  // ---------------- cómo se juega ----------------
  const HOW = [
    ['yerba', 'Armá tu equipo', 'Arrancás con $ 1.500: comprá mate, bombilla, yerba y azúcar. Después hay que reponer todos los días.'],
    ['bombilla', 'Yerba y bombilla', 'Mantené apretado para cargar ¾ de yerba. Poné la bombilla en el hueco... ¡y NUNCA la muevas!'],
    ['pava', 'El agua', 'Cada cliente pide una temperatura. Si hierve, cambiala. Con la pava eléctrica elegís el corte.'],
    ['mate', 'Cebar', 'Mantené la pava en el hueco, sin rebalsar. El primero es tuyo: "Me lo tomo yo".'],
    ['azucar', 'Dulce, amargo y yuyos', 'Los dulces quieren su cucharadita en cada mate. El azúcar y los yuyos quedan en la yerba.'],
    ['food', 'Panadería', 'Bizcochitos, medialunas y facturas: se ven en la mesa, se venden y dan beneficios.'],
    ['vida', 'Desafíos y truco', 'Si alguien se va enojado, desafialo. Cada 3 días podés jugar un truco a 15 por plata.'],
    ['plata', 'Inflación', 'Todo sube 25% por día. Llegá a la meta o usá una vida. ¡Cada día se desbloquea algo nuevo!'],
  ];

  function drawHow() {
    drawBackdrop(ctx, 0.6);
    rr(ctx, 24, 24, W - 48, H - 48, 30); ctx.fillStyle = '#fbf0d9'; ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = '#1d6b3a'; ctx.stroke();
    Gx.fileteTitle(ctx, 'Cómo se juega', W / 2, 92, 54, t);
    HOW.forEach(([ic, title, body], i) => {
      const y = 156 + i * 120;
      rr(ctx, 44, y, 96, 96, 18); ctx.fillStyle = '#f0dfbd'; ctx.fill();
      Gx.iconFor(ctx, ic, 92, y + 50, ic === 'mate' ? 1.1 : 0.85, ic === 'food' ? 'medialunas' : undefined);
      text(ctx, title, 158, y + 18, { size: 26, color: '#1d6b3a', align: 'left' });
      ctx.font = `700 19px ${U.FONT_B}`;
      Gx.wrap(ctx, body, W - 210).slice(0, 3).forEach((l, j) => text(ctx, l, 158, y + 48 + j * 23, { size: 19, font: U.FONT_B, weight: '700', color: '#3b2412', align: 'left' }));
    });
    Gx.button(ctx, { x: 210, y: 1150, w: 300, h: 80, label: '¡Entendido!', color: '#2e7d32', size: 34 }, t);
  }

  // ---------------- resumen ----------------
  function goSummary(s) {
    sum = s;
    if (Play.state) run = Play.state.run;
    Sfx.silenceLoops();
    if (s.passed) {
      if (s.day + 1 > best.day) { best = { day: s.day + 1 }; store.set('mp_best', best); }
      Sfx.yay();
    } else {
      if (s.day > best.day) { best = { day: s.day }; store.set('mp_best', best); }
      Sfx.fail();
    }
    scene = 'summary';
    sum.t0 = t;
  }

  function sumButtons() {
    if (sum.passed) return [{ id: 'next', x: 160, y: 1080, w: 400, h: 96, label: 'Seguir', color: '#2e7d32', size: 40, pulse: true }];
    const b = [];
    let y = 990;
    if (run.lives > 0) { b.push({ id: 'life', x: 110, y, w: 500, h: 84, label: 'Usar una vida', sub: 'Repetís el día ' + sum.day + ' (te quedan ' + run.lives + ')', color: '#c62828', size: 32, pulse: true }); y += 96; }
    else if (run.rewardDay !== run.day) { b.push({ id: 'adlife', x: 110, y, w: 500, h: 84, label: 'Ver anuncio: +1 vida', color: '#1e63b5', size: 30, pulse: true }); y += 96; }
    else { b.push({ id: 'buy', x: 110, y, w: 500, h: 84, label: 'Conseguir vidas', color: '#7b1fa2', size: 30 }); y += 96; }
    b.push({ id: 'again', x: 110, y, w: 240, h: 70, label: 'Empezar de 0', color: '#6d4c41', size: 24 });
    b.push({ id: 'menu', x: 370, y, w: 240, h: 70, label: 'Menú', color: '#6d4c41', size: 24 });
    return b;
  }

  function drawSummary() {
    drawBackdrop(ctx, 0.6);
    rr(ctx, 40, 50, W - 80, 920, 34); ctx.fillStyle = '#fbf0d9'; ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = sum.passed ? '#1d6b3a' : '#a12a1c'; ctx.stroke();
    Gx.fileteTitle(ctx, sum.passed ? '¡Día superado!' : '¡Te fundiste!', W / 2, 126, 56, t);
    text(ctx, 'Día ' + sum.day, W / 2, 190, { size: 30, color: '#5d4037' });
    const s = sum.stats;
    const rows = [
      ['Mates servidos', String(s.served)],
      ['Excelentes', String(s.excellent)],
      ['Se fueron enojados', String(s.bad + s.lost)],
      ['Cobrado (con propinas)', U.money(s.earned)],
      ['Propinas', U.money(s.tips)],
      ['Panadería vendida', U.money(s.snacks)],
      ['Desafíos', s.challengesWon + ' ganados · ' + s.challengesLost + ' perdidos'],
      ['Multas, kiosco y trapos', '-' + U.money(s.fines)],
    ];
    const k = U.clamp((t - sum.t0) * 4, 0, rows.length);
    rows.forEach(([a, b], i) => {
      if (i > k) return;
      const y = 250 + i * 52;
      text(ctx, a, 80, y, { size: 24, font: U.FONT_B, weight: '800', color: '#5d4037', align: 'left' });
      text(ctx, b, W - 80, y, { size: b.length > 16 ? 20 : 28, color: b.startsWith('-') ? '#a12a1c' : '#1d6b3a', align: 'right' });
    });
    ctx.fillStyle = '#d7c3a0'; ctx.fillRect(80, 676, W - 160, 4);
    text(ctx, 'Ganancia del día', 80, 720, { size: 30, color: '#3b2412', align: 'left' });
    text(ctx, U.money(sum.net), W - 80, 720, { size: 38, color: sum.net >= sum.meta ? '#1d6b3a' : '#a12a1c', align: 'right' });
    text(ctx, 'Meta', 80, 776, { size: 24, font: U.FONT_B, weight: '800', color: '#5d4037', align: 'left' });
    text(ctx, U.money(sum.meta), W - 80, 776, { size: 28, color: '#5d4037', align: 'right' });
    text(ctx, 'En la billetera', 80, 826, { size: 24, font: U.FONT_B, weight: '800', color: '#5d4037', align: 'left' });
    text(ctx, U.money(run.money), W - 80, 826, { size: 28, color: run.money >= 0 ? '#1d6b3a' : '#a12a1c', align: 'right' });
    const msg = sum.passed
      ? (s.excellent >= s.served * 0.7 && s.served > 4 ? '¡Sos un cebador de primera!' : '¡Bien ahí! Mañana todo sale más caro...')
      : run.money < 0 ? 'Quedaste en rojo. ¡A vender la pava!' : 'No llegaste a la meta. La inflación no perdona.';
    text(ctx, msg, W / 2, 910, { size: 25, color: sum.passed ? '#1d6b3a' : '#a12a1c' });
    for (const b of sumButtons()) Gx.button(ctx, b, t);
  }

  function summaryDown(x, y) {
    for (const b of sumButtons()) {
      if (!Gx.hit(b, x, y)) continue;
      Sfx.click();
      if (b.id === 'next') return afterDay(0);
      if (b.id === 'life') {
        const lives = run.lives - 1, adsOff = run.adsOff, rewardDay = run.rewardDay;
        run = run.snap;
        run.lives = lives; run.adsOff = adsOff; run.rewardDay = rewardDay;
        return startDay();
      }
      if (b.id === 'adlife') return MP.Ads.rewarded('vida-repetir', () => { run.lives++; run.rewardDay = run.day; Sfx.yay(); });
      if (b.id === 'buy') { MP.Shop.open(run, 'fail', () => { scene = 'summary'; }, 'premium'); scene = 'shop'; return; }
      if (b.id === 'again') return newGame();
      if (b.id === 'menu') { store.del('mp_run2'); scene = 'title'; return; }
    }
  }

  // pasos después de un día ganado: publicidad (cada 2 días) → truco (cada 3) → almacén
  function afterDay(step) {
    if (step === 0) {
      if (sum.day % 2 === 0 && !run.adsOff) { MP.Ads.interstitial('entre-dias', () => afterDay(1)); return; }
      return afterDay(1);
    }
    if (step === 1) {
      if (sum.day % 3 === 0) {
        const pool = D.PERSONAS.filter((p) => p.minDay <= sum.day);
        offer = { persona: U.pick(pool), stake: Math.round((100 * Eco.infl(sum.day) * 4) / 10) * 10, t0: t };
        scene = 'offer';
        return;
      }
      return afterDay(2);
    }
    MP.Shop.open(run, 'day', () => { run.day++; startDay(); });
    scene = 'shop';
  }

  const OFFER_BTNS = [
    { id: 'si', x: 150, y: 900, w: 420, h: 92, label: '¡Juguemos!', color: '#2e7d32', size: 38, pulse: true },
    { id: 'no', x: 150, y: 1010, w: 420, h: 76, label: 'Otro día', color: '#6d4c41', size: 28 },
  ];
  function drawOffer() {
    drawBackdrop(ctx, 0.65);
    rr(ctx, 50, 120, W - 100, 1000, 34); ctx.fillStyle = '#14462b'; ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = '#e0b23a'; ctx.stroke();
    Gx.fileteTitle(ctx, '¿Un truquito?', W / 2, 200, 58, t);
    ctx.save(); ctx.beginPath(); rr(ctx, 160, 250, 400, 330, 24); ctx.clip();
    ctx.fillStyle = '#2e7d4f'; ctx.fillRect(160, 250, 400, 330);
    Gx.drawPerson(ctx, { p: offer.persona, x: 360, baseY: 600, state: 'chat', mood: 'happy', phase: 0, blink: 0, anger: 0, talk: Math.sin(t * 3) > 0 ? 1 : 0, lookX: 0 }, t);
    ctx.restore();
    text(ctx, offer.persona.name + ' te desafía', W / 2, 630, { size: 30, color: '#fff' });
    text(ctx, 'Truco a 15, sin flor, mano a mano', W / 2, 680, { size: 24, font: U.FONT_B, weight: '900', color: '#b9f6ca' });
    text(ctx, 'Si ganás: +' + U.money(offer.stake * 2), W / 2, 750, { size: 32, color: '#7CFC8A' });
    text(ctx, 'Si perdés: -' + U.money(offer.stake), W / 2, 800, { size: 28, color: '#ff8a80' });
    text(ctx, 'Tenés ' + U.money(run.money), W / 2, 850, { size: 22, font: U.FONT_B, weight: '800', color: '#fff4d6' });
    for (const b of OFFER_BTNS) Gx.button(ctx, b, t);
  }
  function offerDown(x, y) {
    for (const b of OFFER_BTNS) {
      if (!Gx.hit(b, x, y)) continue;
      Sfx.click();
      if (b.id === 'no') return afterDay(2);
      MP.Truco.start({
        mode: 'game', persona: offer.persona, stake: offer.stake,
        onDone: (win) => {
          run.money += win ? offer.stake * 2 : -offer.stake;
          run.stats.truco = (run.stats.truco || 0) + (win ? 1 : 0);
          afterDay(2);
        },
      });
      scene = 'truco';
      return;
    }
  }

  // ---------------- desafíos desde la ronda ----------------
  function startChallenge(o) {
    const back = () => { scene = 'play'; };
    const done = (win) => { back(); o.onDone(win); };
    if (o.kind === 'truco') { MP.Truco.start({ mode: 'hand', persona: o.persona, stake: o.stake, onDone: done }); scene = 'truco'; }
    else { MP.Mini.start({ kind: o.kind, persona: o.persona, stake: o.stake, day: run.day, onDone: done }); scene = 'mini'; }
  }

  // ---------------- loop ----------------
  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;
    t += dt;
    ctx.setTransform(view.k, 0, 0, view.k, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!modalQ) {
      if (scene === 'play') Play.update(dt);
      else if (scene === 'truco') MP.Truco.update(dt);
      else if (scene === 'mini') MP.Mini.update(dt);
      else if (scene === 'shop') MP.Shop.update(dt);
    }
    switch (scene) {
      case 'title': drawTitle(); break;
      case 'how': drawHow(); break;
      case 'play': Play.draw(ctx); break;
      case 'summary': drawSummary(); break;
      case 'shop': MP.Shop.draw(ctx); break;
      case 'offer': drawOffer(); break;
      case 'truco': MP.Truco.draw(ctx); break;
      case 'mini': MP.Mini.draw(ctx); break;
    }
    if (toastG && t - toastG.t0 < 2.5) {
      rr(ctx, 60, 60, W - 120, 56, 18); ctx.fillStyle = 'rgba(0,0,0,.8)'; ctx.fill();
      text(ctx, toastG.text, W / 2, 88, { size: 22, font: U.FONT_B, weight: '900', color: '#fff' });
    }
    if (modalQ) drawModal();
    requestAnimationFrame(frame);
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
    if (modalQ) return modalDown(x, y);
    switch (scene) {
      case 'title': titleDown(x, y); break;
      case 'how': if (y > 1100) { Sfx.click(); scene = 'title'; } break;
      case 'play': Play.down(x, y); break;
      case 'summary': if (t - sum.t0 > 0.8) summaryDown(x, y); break;
      case 'shop': MP.Shop.down(x, y); break;
      case 'offer': if (t - offer.t0 > 0.5) offerDown(x, y); break;
      case 'truco': MP.Truco.down(x, y); break;
      case 'mini': MP.Mini.down(x, y); break;
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
    if (k === ' ' || k === 'Tab') e.preventDefault();
    if (scene === 'play' && !modalQ) Play.key(k, true);
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
    drawWall, drawTable, drawBackdrop,
    resetCaches() { wallCache = null; },
    goSummary, goTitle() { saveRun(); scene = 'title'; },
    startChallenge, modal, fakeAd, saveRun,
    toastGlobal(s) { toastG = { text: s, t0: t }; },
    get run() { return run; },
    get scene() { return scene; },
    _debug: { get run() { return run; }, set run(r) { run = r; }, setScene(s) { scene = s; }, get sum() { return sum; } },
  };

  resize();
  MP.Ads.init();
  const go = () => requestAnimationFrame((n) => { last = n; frame(n); });
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]).then(() => { wallCache = null; go(); });
  } else go();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
