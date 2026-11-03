/* Mate Perfecto — escena de juego: la ronda */
(function () {
  'use strict';
  const MP = window.MP;
  const U = MP.U, Gx = MP.G, D = MP.DATA, Sfx = MP.Sfx;
  const { rr, text } = Gx;

  const W = 720, H = 1280;
  const MATE = { x: 270, y: 800 };
  const MOUTH_Y = MATE.y - 104;
  const SEAT_Y = 524;
  const PAVA = { x: 560, y: 848 };
  const HORNALLA = { x: 560, y: 902 };
  const THERMO = { x: 690, top: 600, bot: 880 };
  const TEMP = {
    tibio: { lo: 64, hi: 75, label: 'Tibio 64-75°', col: '#3fa7d6' },
    justo: { lo: 72, hi: 84, label: 'Justo 72-84°', col: '#3aa655' },
    caliente: { lo: 80, hi: 90, label: 'Caliente 80-90°', col: '#e07b1a' },
  };
  const TOOLS = [
    { id: 'yerba', label: 'Yerba', key: '1' },
    { id: 'azucar', label: 'Azúcar', key: '2' },
    { id: 'yuyo', label: 'Peperina', key: '3' },
    { id: 'bombilla', label: 'Bombilla', key: '4' },
    { id: 'pava', label: 'Pava', key: '5' },
  ];
  const TOOL_Y = 1100, TOOL_H = 160, TOOL_W = 132, TOOL_GAP = 8;
  const toolRect = (i) => ({ x: 16 + i * (TOOL_W + TOOL_GAP), y: TOOL_Y, w: TOOL_W, h: TOOL_H });

  const BTN = {
    vaciar: { x: 30, y: 960, w: 170, h: 62, label: 'Vaciar', color: '#8d6e63', size: 26 },
    tomo: { x: 214, y: 960, w: 230, h: 62, label: 'Me lo tomo yo', color: '#2e7d32', size: 25 },
    fuego: { x: 470, y: 960, w: 230, h: 62, label: 'Fuego', color: '#1e63b5', size: 26 },
    agua: { x: 462, y: 606, w: 196, h: 56, label: 'Cambiar agua', color: '#c0392b', size: 22 },
    pausa: { x: 652, y: 14, w: 56, h: 56, label: 'II', color: '#5d4037', size: 24, r: 16 },
  };
  const PAUSE_BTNS = {
    seguir: { x: 210, y: 520, w: 300, h: 84, label: 'Seguir', color: '#2e7d32' },
    musica: { x: 210, y: 630, w: 300, h: 70, label: 'Música', color: '#1e63b5', size: 26 },
    sonido: { x: 210, y: 720, w: 300, h: 70, label: 'Sonido', color: '#1e63b5', size: 26 },
    salir: { x: 210, y: 820, w: 300, h: 76, label: 'Salir al menú', color: '#c0392b', size: 28 },
  };

  let G = null;

  // ------------------------------------------------------------------
  function seatXs(n) { return n === 2 ? [210, 510] : [120, 360, 600]; }

  function start(run) {
    const day = run.day;
    const infl = Math.pow(1.25, day - 1);
    G = {
      run, day, t: 0,
      infl,
      price: 100 * infl,
      yerbaCost: 150 * infl,
      meta: Math.round((280 * Math.pow(1.42, day - 1)) / 10) * 10,
      dayLen: day === 1 ? 100 : 120,
      timeLeft: day === 1 ? 100 : 120,
      nSeats: day === 1 ? 2 : 3,
      patMul: Math.max(0.65, 1 - 0.05 * (day - 1)) * (run.bizcochos ? 1.4 : 1) * (day === 1 ? 1.35 : 1),
      tool: 'yerba',
      mate: freshMate(),
      pava: { temp: 22, fire: false, boiled: false },
      pouring: false, yerbaPouring: false, pourX: MATE.x + 46, pourXs: MATE.x + 46, yerbaSpent: 0,
      seats: [], spawnT: [],
      trip: null,
      parts: [], floats: [],
      shake: 0, toast: null, banner: null,
      stats: { served: 0, excellent: 0, bad: 0, lost: 0, earned: 0, tips: 0, yerba: 0, fines: 0 },
      intro: true, paused: false, ending: false, endT: 0,
      event: null, gasT: 0, gasAt: -1, spoon: 0,
      tickerX: W, news: '',
      lastTick: 99,
    };
    G.seatX = seatXs(G.nSeats);
    for (let i = 0; i < G.nSeats; i++) { G.seats.push(null); G.spawnT.push(0.6 + i * 1.6); }
    // eventos del día
    if (day >= 2 && Math.random() < 0.65) {
      G.event = U.pick(day >= 3 ? ['gas', 'suegra', 'frio', 'calor'] : ['gas', 'frio', 'calor']);
      if (G.event === 'gas') G.gasAt = U.rand(0.3, 0.6) * G.dayLen;
      if (G.event === 'suegra') G.suegraPending = true;
    }
    nextNews();
    MP.ui && MP.ui.resetCaches();
  }

  function freshMate() {
    return {
      yerba: 0, fresh: 0, maxFresh: 1, sweet: false, herb: false,
      bombilla: false, bombT: 1, moved: false, wiggle: 0,
      water: 0, waterTemp: 0, boiledW: false, overflow: false, washExtra: 0,
      first: true, cebadas: 0, loc: 'table',
    };
  }

  function freshFromYerba(y) {
    let f;
    if (y < 0.25) f = 2;
    else if (y < 0.55) f = 2 + ((y - 0.25) / 0.3) * 7;
    else f = 10;
    if (G.run.upgrades.premium) f += 4;
    return Math.round(f);
  }

  function nextNews() {
    let s = U.pick(D.NEWS);
    s = s.replace('{dolar}', U.money(1450 * Math.pow(G.infl, 1.1)).replace('$ ', '')).replace('{infl}', '25');
    G.news = '★ ' + s + ' ★';
    G.tickerX = W;
  }

  // ------------------------------------------------------------------
  function toast(s, col) { G.toast = { text: s, t: 2.2, col: col || '#c0392b' }; }
  function floater(textS, x, y, col, size) { G.floats.push({ text: textS, x, y, life: 1.6, max: 1.6, col: col || '#fff', size: size || 30 }); }
  function addP(o) { G.parts.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 1, max: 1, size: 4, color: '#fff', type: 'dot', rot: 0, vr: 0 }, o)); }
  function addMoney(v, x, y, label) {
    G.run.money += v;
    if (v >= 0) G.stats.earned += v; else G.stats.fines += -v;
    floater((label ? label + ' ' : '') + (v >= 0 ? '+' : '') + U.money(v), x, y, v >= 0 ? '#7CFC8A' : '#ff6b5b', 30);
    if (v > 0) for (let i = 0; i < 5; i++) addP({ x, y, vx: U.rand(-120, 120), vy: U.rand(-320, -160), g: 600, life: 1.1, max: 1.1, type: 'cash', size: 14, rot: U.rand(0, 6), vr: U.rand(-6, 6) });
  }
  function say(c, s, dur) { c.say = s; c.sayT = dur || 2.4; c.talk = Math.min(1.2, (dur || 2.4) * 0.5); }
  function setMood(c, m, dur) { c.mood = m; c.moodT = dur || 2.5; }

  // ------------------------------------------------------------------
  function spawn(i) {
    const present = G.seats.filter(Boolean).map((c) => c.p.id);
    let p;
    if (G.suegraPending && G.t > 12) { p = D.SUEGRA; G.suegraPending = false; banner('¡Llegó la suegra!', 'Exigente... pero paga el doble'); }
    else {
      const pool = D.PERSONAS.filter((q) => !present.includes(q.id) && q.id !== G.lastLeft);
      p = U.pick(pool.length ? pool : D.PERSONAS);
    }
    let temp = p.temp;
    if (G.event === 'frio') temp = 'caliente';
    if (G.event === 'calor') temp = 'tibio';
    const x = G.seatX[i];
    const fromLeft = x < W / 2 || (x === W / 2 && Math.random() < 0.5);
    const patMax = p.patience * G.patMul;
    const c = {
      p, seat: i, x: fromLeft ? -110 : W + 110, tx: x, baseY: SEAT_Y,
      state: 'arrive', sweet: Math.random() < p.sweet, temp, herb: G.day > 1 && Math.random() < p.herb,
      patMax, patience: patMax, wants: U.randi(3, 6), mood: 'neutral', moodT: 0, say: null, sayT: 0, talk: 0,
      phase: Math.random() * 6, blink: 0, blinkT: U.rand(1, 4), anger: 0, chatT: 0, leaveT: 0, lookX: 0, steamT: 0,
    };
    if (p.special) c.wants = 3;
    G.seats[i] = c;
  }

  function leave(c, line, mood) {
    if (line) say(c, line, 2.4);
    setMood(c, mood || 'neutral', 3);
    c.state = 'leaving';
    c.leaveT = 2.1;
  }

  function updateCustomers(dt) {
    for (let i = 0; i < G.nSeats; i++) {
      const c = G.seats[i];
      if (!c) {
        if (!G.ending && G.timeLeft > 10) {
          G.spawnT[i] -= dt;
          if (G.spawnT[i] <= 0) spawn(i);
        }
        continue;
      }
      c.blinkT -= dt;
      if (c.blinkT <= 0) { c.blink = 0.12; c.blinkT = U.rand(1.5, 4.5); }
      if (c.blink > 0) c.blink -= dt;
      if (c.sayT > 0) { c.sayT -= dt; if (c.sayT <= 0) c.say = null; }
      if (c.talk > 0) c.talk -= dt;
      if (c.moodT > 0) { c.moodT -= dt; if (c.moodT <= 0 && c.state !== 'drinking') c.mood = 'neutral'; }
      c.lookX = U.lerp(c.lookX, U.clamp((MATE.x - c.x) / 300, -1, 1), dt * 3);

      switch (c.state) {
        case 'arrive': {
          const d = c.tx - c.x;
          c.x += Math.sign(d) * Math.min(Math.abs(d), 420 * dt);
          if (Math.abs(d) < 1) { c.x = c.tx; c.state = 'waiting'; say(c, U.pick(D.LINES.greet), 2); }
          break;
        }
        case 'waiting': {
          if (!G.ending) c.patience -= dt;
          const r = c.patience / c.patMax;
          c.anger = U.clamp((0.45 - r) / 0.45, 0, 1);
          if (c.moodT <= 0) c.mood = r < 0.35 ? 'impatient' : 'neutral';
          if (r < 0.3) {
            c.steamT -= dt;
            if (c.steamT <= 0) { c.steamT = 0.25; addP({ x: c.x + U.rand(-40, 40), y: c.baseY - 240, vx: U.rand(-20, 20), vy: -60, life: 0.9, max: 0.9, type: 'steam', size: 12, color: 'rgba(255,255,255,.8)' }); }
          }
          if (c.patience <= 0) {
            G.stats.lost++;
            addMoney(-Math.round(G.price * 0.3), c.x, c.baseY - 260, 'Se fue');
            Sfx.fail();
            G.lastLeft = c.p.id;
            leave(c, U.pick(D.LINES.impatient), 'angry');
          }
          break;
        }
        case 'chat': {
          c.anger = Math.max(0, c.anger - dt);
          c.chatT -= dt;
          if (!c.say && Math.random() < dt * 0.12) say(c, U.pick(D.LINES.chat), 2.6);
          if (c.chatT <= 0 && !G.ending) {
            if (c.wants > 0) {
              c.state = 'waiting'; c.patience = c.patMax;
              say(c, U.pick(D.LINES.again), 1.6);
            } else {
              G.lastLeft = c.p.id;
              leave(c, U.pick(D.LINES.thanks), 'happy');
            }
          }
          break;
        }
        case 'leaving': {
          c.leaveT -= dt;
          if (c.leaveT <= 0) { c.state = 'leave'; c.dir = c.x < W / 2 ? -1 : 1; }
          break;
        }
        case 'leave': {
          c.x += c.dir * 460 * dt;
          if (c.x < -140 || c.x > W + 140) { G.seats[i] = null; G.spawnT[i] = U.rand(1.5, 4); }
          break;
        }
      }
    }
  }

  // ------------------------------------------------------------------
  function evaluate(c) {
    const m = G.mate;
    const r = [];
    const add = (pen, key) => r.push({ pen, key });
    if (m.first) add(35, 'first');
    if (m.fresh <= 0) add(55, 'lavado'); else if (m.fresh <= 1.5) add(14, 'lavandose');
    if (m.boiledW) add(30, 'hervida');
    if (c.sweet && !m.sweet) add(30, 'sinAzucar');
    if (!c.sweet && m.sweet) add(45, 'conAzucar');
    if (c.herb && !m.herb) add(15, 'sinYuyo');
    const T = TEMP[c.temp], wt = m.waterTemp;
    if (wt < T.lo) add(Math.min(50, (T.lo - wt) * 4), 'frio');
    else if (wt > T.hi) add(Math.min(50, (wt - T.hi) * 4), 'caliente');
    if (m.water < 0.6) add(35, 'poco'); else if (m.water < 0.8) add((0.8 - m.water) * 120, 'poco');
    if (m.overflow) add(12, 'rebalso');
    if (m.moved) add(20, 'bombilla');
    if (m.yerba > 0.92) add(12, 'tapado');
    if (c.patience < c.patMax * 0.25) add(8, 'lento');
    let q = 100 - r.reduce((a, b) => a + b.pen, 0);
    if (G.run.upgrades.calabaza) q += 8;
    q = U.clamp(Math.round(q), 0, 100);
    r.sort((a, b) => b.pen - a.pen);
    return { q, worst: r.length && r[0].pen >= 10 ? r[0].key : null };
  }

  function consumeCebada() {
    const m = G.mate;
    m.fresh -= 1 + m.washExtra;
    m.washExtra = 0; m.water = 0; m.overflow = false; m.moved = false; m.first = false;
    m.cebadas++; m.boiledW = false; m.waterTemp = 0;
  }

  function finishDrink(c) {
    const { q, worst } = evaluate(c);
    const special = c.p.special ? 2 : 1;
    const price = G.price * special;
    const hx = c.x, hy = c.baseY - 270;
    c.wants--;
    G.stats.served++;
    const complaint = worst ? U.pick(D.COMPLAINTS[worst]) : null;
    if (q >= 85) {
      const tip = Math.round(price * 0.35 * (G.run.upgrades.alpaca ? 1.5 : 1) * (q / 100));
      addMoney(Math.round(price * (q / 100)) + tip, hx, hy);
      G.stats.tips += tip; G.stats.excellent++;
      setMood(c, 'love', 3);
      say(c, U.pick(D.LINES.great), 2.4);
      Sfx.cash(); Sfx.yay();
      for (let i = 0; i < 10; i++) addP({ x: hx, y: hy + 60, vx: U.rand(-220, 220), vy: U.rand(-320, -80), g: 300, life: 1, max: 1, type: 'star', size: U.rand(8, 14), color: U.pick(['#ffd54f', '#fff59d', '#ffb300']), rot: 0, vr: U.rand(-5, 5) });
      floater(q === 100 ? '¡MATE PERFECTO!' : '¡EXCELENTE!', hx, hy - 40, '#ffd54f', 34);
      c.state = 'chat'; c.chatT = U.rand(2.5, 5);
    } else if (q >= 65) {
      addMoney(Math.round(price * (q / 100)), hx, hy);
      setMood(c, 'happy', 2);
      say(c, complaint && Math.random() < 0.6 ? complaint : U.pick(D.LINES.ok), 2.4);
      Sfx.cash();
      c.state = 'chat'; c.chatT = U.rand(3, 6);
    } else if (q >= 45) {
      addMoney(Math.round(price * (q / 100) * 0.5), hx, hy);
      setMood(c, 'sad', 2.5);
      say(c, complaint || U.pick(D.LINES.ok), 2.6);
      Sfx.tick();
      if (Math.random() < 0.45) { c.wants = 0; }
      c.state = 'chat'; c.chatT = U.rand(3, 5);
    } else {
      G.stats.bad++;
      addMoney(-Math.round(price * 0.5), hx, hy, 'Multa');
      Sfx.fail();
      G.shake = 0.4;
      c.anger = 1;
      G.lastLeft = c.p.id;
      leave(c, (complaint || '¡Horrible!') + ' ¡Gracias!', 'angry');
    }
    if (c.state === 'chat' && c.wants <= 0) c.chatT = 1.2;
  }

  // ------------------------------------------------------------------
  function mateReady() { return G.mate.loc === 'table' && G.mate.water > 0.05; }

  function serve(c) {
    if (!mateReady()) {
      if (G.mate.loc !== 'table') toast('El mate está dando vueltas...');
      else toast('¡Primero cebá el mate!');
      return;
    }
    stopPour();
    c.state = 'drinking';
    G.mate.loc = 'travel';
    G.trip = { c, self: false, phase: 'go', t: 0 };
    Sfx.whoosh();
  }

  function drinkSelf() {
    if (!mateReady()) { toast(G.mate.loc !== 'table' ? 'El mate está dando vueltas...' : 'No hay nada para tomar'); return; }
    stopPour();
    G.mate.loc = 'travel';
    G.trip = { c: null, self: true, phase: 'go', t: 0 };
    Sfx.whoosh();
  }

  const TRIP_T = { go: 0.45, drink: 1.7, back: 0.4 };

  function tripTarget() {
    const tr = G.trip;
    if (tr.self) return { x: MATE.x + 40, y: 1120, s: 1.35 };
    const hy = tr.c.baseY - 178;
    return { x: tr.c.x - 29, y: hy + 130, s: 0.42 };
  }

  function matePose() {
    if (!G.trip) return { x: MATE.x, y: MATE.y, s: 1, a: 1 };
    const tr = G.trip, tg = tripTarget();
    const k = tr.phase === 'go' ? U.easeInOut(tr.t / TRIP_T.go) : tr.phase === 'back' ? 1 - U.easeInOut(tr.t / TRIP_T.back) : 1;
    const arc = Math.sin(k * Math.PI) * (tr.self ? 0 : -80);
    return {
      x: U.lerp(MATE.x, tg.x, k), y: U.lerp(MATE.y, tg.y, k) + arc, s: U.lerp(1, tg.s, k),
      a: tr.self ? 1 - k * 0.25 : 1,
    };
  }

  function updateTrip(dt) {
    const tr = G.trip;
    if (!tr) return;
    tr.t += dt;
    if (tr.phase === 'go' && tr.t >= TRIP_T.go) {
      tr.phase = 'drink'; tr.t = 0;
      if (tr.c) setMood(tr.c, 'drink', 99);
      Sfx.slurp();
      if (tr.self) floater('¡Glu glu glu!', MATE.x, 1000, '#fff', 30);
    } else if (tr.phase === 'drink') {
      tr.sip = tr.t / (tr.self ? 1.2 : TRIP_T.drink);
      if (tr.t >= (tr.self ? 1.2 : TRIP_T.drink)) {
        if (tr.self) {
          if (G.mate.first) { floater('¡El primero es del cebador!', MATE.x, 960, '#ffd54f', 28); Sfx.yay(); }
        } else {
          tr.c.moodT = 0; tr.c.mood = 'neutral';
          finishDrink(tr.c);
        }
        consumeCebada();
        tr.phase = 'back'; tr.t = 0; tr.sip = 0;
        Sfx.whoosh();
      }
    } else if (tr.phase === 'back' && tr.t >= TRIP_T.back) {
      G.trip = null; G.mate.loc = 'table';
      if (G.mate.fresh <= 0) toast('¡El mate se lavó! Vacialo y poné yerba nueva', '#8d6e63');
    }
  }

  // ------------------------------------------------------------------
  function stopPour() {
    if (G.pouring) { G.pouring = false; Sfx.setPour(false); }
    if (G.yerbaPouring) {
      G.yerbaPouring = false;
      if (G.yerbaSpent > 0.01) {
        const cost = Math.round(G.yerbaSpent * G.yerbaCost);
        G.run.money -= cost; G.stats.yerba += cost;
        floater('Yerba -' + U.money(cost), MATE.x - 120, MATE.y - 210, '#ffcc80', 26);
      }
      G.yerbaSpent = 0;
    }
  }

  function toolOnMate(x) {
    const m = G.mate;
    if (m.loc !== 'table') { toast('El mate está dando vueltas...'); return; }
    switch (G.tool) {
      case 'yerba':
        if (m.cebadas > 0 || m.water > 0) { toast('Ese mate ya está usado: tocá VACIAR'); return; }
        if (m.bombilla) { toast('Con la bombilla puesta no... tocá VACIAR'); return; }
        if (m.yerba >= 1) { toast('¡Ya está lleno de yerba!'); return; }
        G.yerbaPouring = true; G.pourX = x; return;
      case 'azucar':
        if (m.yerba < 0.2) { toast('Primero poné la yerba'); return; }
        if (!m.sweet) { m.sweet = true; floater('Endulzado', MATE.x - 40, MATE.y - 170, '#fff', 26); }
        G.spoon = 1; Sfx.clink(); return;
      case 'yuyo':
        if (m.yerba < 0.2) { toast('Primero poné la yerba'); return; }
        if (!m.herb) { m.herb = true; floater('+ Peperina', MATE.x - 40, MATE.y - 170, '#b9f6ca', 26); }
        for (let i = 0; i < 8; i++) addP({ x: MATE.x - 30 + U.rand(-30, 30), y: MOUTH_Y - 120, vx: U.rand(-40, 40), vy: U.rand(40, 120), g: 400, life: 0.5, max: 0.5, type: 'leaf', size: 12, color: '#4caf50', rot: U.rand(0, 6), vr: U.rand(-8, 8) });
        Sfx.pop(); return;
      case 'bombilla':
        if (m.yerba < 0.2) { toast('Primero poné la yerba'); return; }
        if (!m.bombilla) { m.bombilla = true; m.bombT = 0; Sfx.pop(); return; }
        if (!m.moved) { m.moved = true; G.run.stats && G.run.stats.moved++; }
        m.wiggle = 1; G.shake = 0.25;
        toast('¡¡NUNCA se mueve la bombilla!!');
        Sfx.fail(); return;
      case 'pava':
        if (m.yerba < 0.2) { toast('Primero poné la yerba'); return; }
        if (!m.bombilla) { toast('Poné la bombilla primero'); return; }
        G.pouring = true; G.pourX = x; Sfx.setPour(true); return;
    }
  }

  function vaciar() {
    const m = G.mate;
    if (m.loc !== 'table') { toast('El mate está dando vueltas...'); return; }
    if (m.yerba <= 0.01) { toast('El mate ya está vacío'); return; }
    stopPour();
    for (let i = 0; i < 26; i++) addP({ x: MATE.x + U.rand(-60, 60), y: MOUTH_Y, vx: U.rand(-250, 250), vy: U.rand(-420, -200), g: 1100, life: 1, max: 1, type: 'dot', size: U.rand(3, 6), color: U.pick(['#6f9a2c', '#8a7d48', '#b5a76a']) });
    G.mate = freshMate();
    Sfx.whoosh();
    floater('¡Yerba a las plantas!', MATE.x, MATE.y - 210, '#c5e1a5', 26);
  }

  function toggleFire() {
    if (G.gasT > 0) { toast('¡No hay gas! Esperá...'); return; }
    G.pava.fire = !G.pava.fire;
    Sfx.click();
  }

  function changeWater() {
    G.pava.temp = 20; G.pava.boiled = false;
    Sfx.splash();
    floater('Agua nueva', PAVA.x, PAVA.y - 120, '#b3e5fc', 26);
  }

  function banner(title, sub) { G.banner = { title, sub, t: 3 }; Sfx.bell(); }

  function updatePava(dt) {
    const p = G.pava;
    if (G.gasAt > 0 && G.t >= G.gasAt) { G.gasAt = -1; G.gasT = 10; p.fire = false; banner('¡Se cortó el gas!', 'Diez segundos sin fuego...'); }
    if (G.gasT > 0) { G.gasT -= dt; p.fire = false; if (G.gasT <= 0) toast('¡Volvió el gas!', '#2e7d32'); }
    if (p.fire) {
      p.temp += (p.temp < 60 ? 8 : 4.5) * dt;
      if (G.run.upgrades.corte && p.temp >= 84) { p.fire = false; floater('¡Clic! Corte a 84°', PAVA.x, PAVA.y - 130, '#fff', 24); Sfx.click(); }
      if (p.temp >= 100) {
        p.temp = 100;
        if (!p.boiled) {
          p.boiled = true; G.shake = 0.35; Sfx.boil();
          toast('¡SE HIRVIÓ EL AGUA! Cambiala');
        }
      }
    } else {
      const k = G.run.upgrades.termo ? 0.004 : 0.028;
      p.temp -= (p.temp - 22) * k * dt * 1.0;
    }
    Sfx.setFire(p.fire);
    Sfx.setKettle(p.fire ? (p.temp - 86) / 14 : 0);
    // vapor
    if (p.temp > 62 && !G.pouring && Math.random() < dt * (p.temp - 55) * 0.25) {
      const [tx, ty] = Gx.pavaTip(PAVA.x, PAVA.y, 0.74, 0);
      addP({ x: tx, y: ty, vx: U.rand(10, 40), vy: U.rand(-80, -40), life: 1.2, max: 1.2, type: 'steam', size: 10, color: 'rgba(255,255,255,.7)' });
    }
    if (p.temp >= 96 && Math.random() < dt * 10) {
      addP({ x: PAVA.x + U.rand(-30, 30), y: PAVA.y - 40, vx: U.rand(-30, 30), vy: -90, life: 0.8, max: 0.8, type: 'steam', size: 12, color: 'rgba(255,255,255,.8)' });
    }
  }

  function updatePour(dt) {
    const m = G.mate;
    G.pourXs = U.lerp(G.pourXs, G.pourX, Math.min(1, dt * 14));
    if (G.yerbaPouring) {
      const d = 0.42 * dt;
      if (m.yerba < 1.05) { m.yerba = Math.min(1.05, m.yerba + d); G.yerbaSpent += d; }
      m.maxFresh = freshFromYerba(m.yerba); m.fresh = m.maxFresh;
      if (Math.random() < 0.7) Sfx.yerbaTick();
      for (let i = 0; i < 3; i++) addP({ x: G.pourXs - 10 + U.rand(-10, 10), y: MOUTH_Y - 160, vx: U.rand(-30, 30), vy: U.rand(100, 250), g: 900, life: 0.32, max: 0.32, type: 'dot', size: U.rand(2, 4), color: U.pick(['#6f9a2c', '#8fb83f', '#c9c27a']) });
      if (m.yerba >= 1.05) { stopPour(); toast('¡Tapaste el mate de yerba!'); }
    }
    if (G.pouring) {
      const d = 0.46 * dt;
      if (m.water < 0.02) { m.waterTemp = G.pava.temp; m.boiledW = false; }
      m.waterTemp = (m.waterTemp * m.water + G.pava.temp * d) / (m.water + d);
      if (G.pava.boiled) m.boiledW = true;
      const rel = (G.pourXs - MATE.x) / 84;
      if (rel < 0) m.washExtra += d * 1.6;
      m.water += d;
      G.pava.temp -= d * 2;
      const [tx] = [G.pourXs];
      if (Math.random() < 0.6) addP({ x: tx + U.rand(-6, 6), y: MOUTH_Y, vx: U.rand(-60, 60), vy: U.rand(-120, -40), g: 700, life: 0.3, max: 0.3, type: 'drop', size: 3, color: 'rgba(190,225,255,.9)' });
      if (m.water > 1) {
        m.water = 1;
        if (!m.overflow) {
          m.overflow = true; G.shake = 0.3; Sfx.splash();
          toast('¡REBALSÓ! ¡Trapo, trapo!');
          addMoney(-Math.round(G.price * 0.15), MATE.x, MATE.y - 200, 'Trapo');
        }
        for (let i = 0; i < 2; i++) addP({ x: MATE.x + U.rand(20, 90), y: MOUTH_Y + 20, vx: U.rand(-40, 80), vy: U.rand(0, 60), g: 800, life: 0.6, max: 0.6, type: 'drop', size: 4, color: 'rgba(110,130,50,.9)' });
      }
    }
  }

  function updateParticles(dt) {
    for (const p of G.parts) {
      p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
    G.parts = G.parts.filter((p) => p.life > 0);
    if (G.parts.length > 400) G.parts.splice(0, G.parts.length - 400);
    for (const f of G.floats) { f.life -= dt; f.y -= 50 * dt; }
    G.floats = G.floats.filter((f) => f.life > 0);
    // vapor del mate
    const m = G.mate;
    if (m.water > 0.1 && m.waterTemp > 60 && Math.random() < dt * 6) {
      const pz = matePose();
      addP({ x: pz.x + (46 + U.rand(-20, 20)) * pz.s, y: pz.y - 110 * pz.s, vx: U.rand(-10, 10), vy: -50, life: 1.3, max: 1.3, type: 'steam', size: 9 * pz.s, color: 'rgba(255,255,255,.55)' });
    }
  }

  function endDay() {
    G.ending = true; G.endT = 2.4;
    stopPour();
    Sfx.silenceLoops(); Sfx.bell();
    banner('¡Terminó el día!', 'A contar la plata...');
  }

  function update(dt) {
    if (!G) return;
    if (G.paused) { Sfx.silenceLoops(); return; }
    if (G.intro) { G.t2 = (G.t2 || 0) + dt; return; }
    G.t += dt;
    if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
    if (G.toast) { G.toast.t -= dt; if (G.toast.t <= 0) G.toast = null; }
    G.shake = Math.max(0, G.shake - dt);
    G.spoon = Math.max(0, G.spoon - dt * 2);
    G.mate.wiggle = Math.max(0, G.mate.wiggle - dt * 2);
    if (G.mate.bombT < 1) G.mate.bombT = Math.min(1, G.mate.bombT + dt * 3);
    G.tickerX -= 110 * dt;

    if (!G.ending) {
      G.timeLeft -= dt;
      const sec = Math.ceil(G.timeLeft);
      if (sec <= 10 && sec !== G.lastTick && sec > 0) { G.lastTick = sec; Sfx.tick(); }
      if (G.timeLeft <= 0) { G.timeLeft = 0; endDay(); }
      updatePava(dt);
      updatePour(dt);
    } else {
      G.endT -= dt;
      if (G.endT <= 0 && !G.trip) { MP.ui.goSummary(summary()); return; }
    }
    updateTrip(dt);
    updateCustomers(dt);
    updateParticles(dt);
  }

  function summary() {
    const s = G.stats;
    const net = s.earned - s.fines - s.yerba;
    return { day: G.day, meta: G.meta, net, stats: s, money: G.run.money, passed: net >= G.meta && G.run.money >= 0 };
  }

  // ------------------------------------------------------------------
  //                              INPUT
  // ------------------------------------------------------------------
  function custAt(x, y) {
    for (const c of G.seats) {
      if (!c) continue;
      if (Math.abs(x - c.x) < 105 && y > 120 && y < SEAT_Y + 10) return c;
    }
    return null;
  }

  function down(x, y) {
    if (!G) return;
    if (G.intro) { G.intro = false; Sfx.bell(); if (G.event && G.event !== 'gas' && G.event !== 'suegra') { /* ya anunciado */ } return; }
    if (G.paused) {
      if (Gx.hit(PAUSE_BTNS.seguir, x, y)) { G.paused = false; Sfx.click(); }
      else if (Gx.hit(PAUSE_BTNS.musica, x, y)) { Sfx.toggleMusic(); Sfx.click(); }
      else if (Gx.hit(PAUSE_BTNS.sonido, x, y)) { Sfx.toggleSfx(); Sfx.click(); }
      else if (Gx.hit(PAUSE_BTNS.salir, x, y)) { G.paused = false; Sfx.silenceLoops(); MP.ui.goTitle(); }
      return;
    }
    if (G.ending) return;
    if (Gx.hit(BTN.pausa, x, y)) { G.paused = true; stopPour(); Sfx.click(); return; }
    for (let i = 0; i < TOOLS.length; i++) {
      if (Gx.hit(toolRect(i), x, y)) { G.tool = TOOLS[i].id; Sfx.click(); return; }
    }
    if (Gx.hit(BTN.vaciar, x, y)) return vaciar();
    if (Gx.hit(BTN.tomo, x, y)) return drinkSelf();
    if (Gx.hit(BTN.fuego, x, y)) return toggleFire();
    if (G.pava.boiled && Gx.hit(BTN.agua, x, y)) return changeWater();
    if (x > 470 && x < 700 && y > 740 && y < 940) return toggleFire(); // tocar la pava/hornalla
    const c = custAt(x, y);
    if (c) {
      if (c.state === 'waiting') return serve(c);
      if (c.state === 'chat') { say(c, 'Ya tomé, ¡esperá!', 1.2); return; }
      return;
    }
    const dx = x - MATE.x, dy = y - (MATE.y - 40);
    if (dx * dx + dy * dy < 200 * 200 && y < 950 && y > 540) {
      return toolOnMate(U.clamp(x, MATE.x - 80, MATE.x + 80));
    }
  }

  function move(x, y) {
    if (!G) return;
    if (G.pouring || G.yerbaPouring) G.pourX = U.clamp(x, MATE.x - 80, MATE.x + 80);
  }

  function up() { if (G) stopPour(); }

  function key(k, isDown) {
    if (!G) return;
    if (!isDown) { if (k === ' ') stopPour(); return; }
    if (G.intro) { G.intro = false; return; }
    if (k === 'Escape' || k === 'p') { G.paused = !G.paused; stopPour(); return; }
    if (G.paused || G.ending) return;
    const t = TOOLS.find((q) => q.key === k);
    if (t) { G.tool = t.id; Sfx.click(); return; }
    if (k === 'f') toggleFire();
    if (k === 'v') vaciar();
    if (k === 't') drinkSelf();
    if (k === ' ' && !G.pouring && !G.yerbaPouring) toolOnMate(G.tool === 'yerba' ? MATE.x - 20 : MATE.x + 46);
  }

  function blur() { if (G && !G.intro && !G.ending) { G.paused = true; stopPour(); } }

  // ------------------------------------------------------------------
  //                              DRAW
  // ------------------------------------------------------------------
  function hint() {
    const m = G.mate, p = G.pava;
    if (G.toast) return { text: G.toast.text, col: G.toast.col, warn: true };
    if (m.loc !== 'table') return { text: 'El mate está en la ronda... ¡vigilá la pava!' };
    if (m.yerba < 0.2) return { text: 'YERBA: mantené apretado sobre el mate (¾ está bien)', target: 'yerba' };
    if (m.cebadas > 0 && m.fresh <= 0) return { text: 'Está lavado: tocá VACIAR y poné yerba nueva', target: 'vaciar' };
    if (!m.bombilla) return { text: 'Poné la BOMBILLA: tocá el mate', target: 'bombilla' };
    if (p.boiled) return { text: '¡Agua hervida! Tocá CAMBIAR AGUA', target: 'agua' };
    if (m.water < 0.05) {
      if (p.temp < 64 && !p.fire) return { text: 'Prendé el FUEGO para calentar el agua', target: 'fuego' };
      if (p.temp < 64) return { text: 'Esperá que se caliente el agua... (mirá el termómetro)' };
      return { text: 'PAVA: mantené apretado en el hueco, al lado de la bombilla', target: 'pava' };
    }
    if (m.first) return { text: 'El primero es del cebador: tocá ME LO TOMO YO', target: 'tomo' };
    return { text: 'Tocá a quien está esperando para pasarle el mate', target: 'cliente' };
  }

  function hintTargetPos(tg) {
    const ti = TOOLS.findIndex((q) => q.id === tg);
    if (ti >= 0) {
      if (G.tool === tg) return { x: MATE.x, y: MATE.y - 250 };
      const r = toolRect(ti); return { x: r.x + r.w / 2, y: r.y - 6 };
    }
    if (BTN[tg]) return { x: BTN[tg].x + BTN[tg].w / 2, y: BTN[tg].y - 6 };
    if (tg === 'cliente') {
      const c = G.seats.find((s) => s && s.state === 'waiting');
      if (c) return { x: c.x, y: c.baseY - 20 };
    }
    return null;
  }

  function drawArrow(ctx, x, y, t) {
    const b = Math.sin(t * 7) * 8;
    ctx.save(); ctx.translate(x, y - 20 + b);
    ctx.fillStyle = '#ffeb3b'; ctx.strokeStyle = '#5d3a00'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(-20, -10); ctx.lineTo(-8, -10); ctx.lineTo(-8, -34); ctx.lineTo(8, -34); ctx.lineTo(8, -10); ctx.lineTo(20, -10); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawOrderBubble(ctx, c, t) {
    const bw = G.nSeats === 2 ? 250 : 218;
    const hy = c.baseY - 178;
    if (c.say) {
      ctx.font = `800 21px ${U.FONT_B}`;
      const lines = Gx.wrap(ctx, c.say, bw - 28);
      const h = 22 + lines.length * 26;
      const bx = U.clamp(c.x - bw / 2, 6, W - bw - 6), by = hy - 72 - h;
      const col = c.mood === 'angry' ? '#ffd9d2' : c.mood === 'love' || c.mood === 'happy' ? '#e6ffd9' : '#fffaf0';
      Gx.bubble(ctx, bx, by, bw, h, c.x, hy - 58, { color: col });
      lines.forEach((l, i) => text(ctx, l, bx + bw / 2, by + 24 + i * 26, { size: 21, font: U.FONT_B, weight: '800', color: '#3b2412' }));
      return;
    }
    if (c.state !== 'waiting') return;
    const rows = [];
    rows.push(c.sweet ? { ic: 'sugar', t: 'Dulce' } : { ic: 'amargo', t: 'Amargo' });
    rows.push({ ic: 'temp', t: TEMP[c.temp].label, col: TEMP[c.temp].col });
    if (c.herb) rows.push({ ic: 'herb', t: 'Con peperina' });
    const h = 22 + rows.length * 32 + 18;
    const bx = U.clamp(c.x - bw / 2, 6, W - bw - 6), by = hy - 72 - h;
    const ready = mateReady();
    if (ready) {
      ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 6) * 0.3;
      ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 8;
      rr(ctx, bx - 5, by - 5, bw + 10, h + 10, 22); ctx.stroke();
      ctx.restore();
    }
    Gx.bubble(ctx, bx, by, bw, h, c.x, hy - 58);
    rows.forEach((r, i) => {
      const ry = by + 26 + i * 32, ix = bx + 26;
      if (r.ic === 'sugar') { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#7a7a7a'; ctx.lineWidth = 2; rr(ctx, ix - 10, ry - 10, 20, 20, 4); ctx.fill(); ctx.stroke(); }
      else if (r.ic === 'amargo') { Gx.leaf(ctx, ix - 11, ry + 6, 22, -0.6, '#2e7d32'); }
      else if (r.ic === 'temp') Gx.thermoIcon(ctx, ix, ry, 1.1, r.col);
      else if (r.ic === 'herb') { Gx.leaf(ctx, ix - 10, ry + 4, 18, -0.9, '#4caf50'); Gx.leaf(ctx, ix - 4, ry + 8, 16, -0.3, '#2e7d32'); }
      text(ctx, r.t, ix + 22, ry + 1, { size: 21, font: U.FONT_B, weight: '900', color: r.col || '#3b2412', align: 'left' });
    });
    // paciencia
    const pr = U.clamp(c.patience / c.patMax, 0, 1);
    const px = bx + 14, py = by + h - 18, pw = bw - 28;
    rr(ctx, px, py, pw, 9, 5); ctx.fillStyle = '#e0d6c6'; ctx.fill();
    if (pr > 0) { rr(ctx, px, py, pw * pr, 9, 5); ctx.fillStyle = pr > 0.5 ? '#43a047' : pr > 0.25 ? '#f9a825' : '#e53935'; ctx.fill(); }
    if (c.p.special) text(ctx, '×2', bx + bw - 22, by + 22, { size: 22, color: '#c0392b' });
  }

  function drawCustomers(ctx, t) {
    for (const c of G.seats) {
      if (!c) continue;
      Gx.drawPerson(ctx, c, t);
    }
  }

  function drawToolbar(ctx, t) {
    // panel
    ctx.save();
    for (let i = 0; i < TOOLS.length; i++) {
      const r = toolRect(i), sel = G.tool === TOOLS[i].id;
      const lift = sel ? -10 : 0;
      rr(ctx, r.x, r.y + 8, r.w, r.h, 22); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();
      rr(ctx, r.x, r.y + lift, r.w, r.h, 22);
      ctx.fillStyle = sel ? '#fff3c4' : '#f5e6c8'; ctx.fill();
      ctx.lineWidth = sel ? 6 : 3; ctx.strokeStyle = sel ? '#f4a300' : '#6d4c2f'; ctx.stroke();
      Gx.iconFor(ctx, TOOLS[i].id, r.x + r.w / 2, r.y + 62 + lift, TOOLS[i].id === 'pava' ? 1.05 : 1.15);
      text(ctx, TOOLS[i].label, r.x + r.w / 2, r.y + r.h - 24 + lift, { size: 23, color: '#4e342e' });
      // estado
      const m = G.mate;
      const done = (TOOLS[i].id === 'azucar' && m.sweet) || (TOOLS[i].id === 'yuyo' && m.herb) || (TOOLS[i].id === 'bombilla' && m.bombilla) || (TOOLS[i].id === 'yerba' && m.yerba > 0.2);
      if (done) {
        ctx.fillStyle = '#2e7d32'; ctx.beginPath(); ctx.arc(r.x + r.w - 18, r.y + 18 + lift, 13, 0, U.TAU); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(r.x + r.w - 24, r.y + 18 + lift); ctx.lineTo(r.x + r.w - 19, r.y + 23 + lift); ctx.lineTo(r.x + r.w - 11, r.y + 12 + lift); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawHUD(ctx, t) {
    ctx.save();
    const g = ctx.createLinearGradient(0, 0, 0, 86);
    g.addColorStop(0, '#2f1b0e'); g.addColorStop(1, '#4a2c17');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 86);
    ctx.fillStyle = '#e0b23a'; ctx.fillRect(0, 84, W, 4);
    // plata
    rr(ctx, 12, 14, 220, 58, 18); ctx.fillStyle = '#1d6b3a'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#e0b23a'; ctx.stroke();
    text(ctx, U.money(G.run.money), 122, 44, { size: 32, color: G.run.money < 0 ? '#ff8a80' : '#fff', stroke: '#0d3b1e', sw: 6 });
    // día y reloj
    const sec = Math.ceil(G.timeLeft);
    const tt = Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
    text(ctx, 'DÍA ' + G.day, 330, 24, { size: 20, color: '#f4c542' });
    text(ctx, tt, 330, 58, { size: 36, color: sec <= 10 && sec % 2 ? '#ff6b5b' : '#fff', stroke: '#2a1206', sw: 6 });
    // meta
    const s = G.stats, net = s.earned - s.fines - s.yerba;
    const pr = U.clamp(net / G.meta, 0, 1);
    text(ctx, 'Meta ' + U.money(G.meta), 530, 26, { size: 20, color: '#f4c542' });
    rr(ctx, 430, 44, 200, 22, 11); ctx.fillStyle = '#1a0f07'; ctx.fill();
    if (pr > 0) { rr(ctx, 430, 44, 200 * pr, 22, 11); ctx.fillStyle = pr >= 1 ? '#7CFC8A' : '#f4c542'; ctx.fill(); }
    text(ctx, U.money(net), 530, 56, { size: 16, font: U.FONT_B, weight: '900', color: '#fff', stroke: '#000', sw: 3 });
    Gx.button(ctx, BTN.pausa, t);
    // ticker
    ctx.fillStyle = '#121212'; ctx.fillRect(0, 88, W, 30);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 88, W, 30); ctx.clip();
    ctx.font = `900 18px ${U.FONT_B}`;
    const tw = ctx.measureText(G.news).width;
    if (G.tickerX < -tw) nextNews();
    text(ctx, G.news, G.tickerX, 104, { size: 18, font: U.FONT_B, weight: '900', color: '#ffd54f', align: 'left' });
    ctx.restore();
    ctx.restore();
  }

  function drawParticles(ctx) {
    for (const p of G.parts) {
      const a = U.clamp(p.life / p.max, 0, 1);
      ctx.save();
      ctx.globalAlpha = p.type === 'steam' ? a * 0.8 : Math.min(1, a * 2);
      ctx.translate(p.x, p.y);
      switch (p.type) {
        case 'steam': {
          const r = p.size * (1 + (1 - a) * 1.6);
          ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, r, 0, U.TAU); ctx.fill(); break;
        }
        case 'leaf': Gx.leaf(ctx, 0, 0, p.size, p.rot, p.color); break;
        case 'star': {
          ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.beginPath();
          for (let i = 0; i < 10; i++) { const r = i % 2 ? p.size * 0.45 : p.size; const an = (i / 10) * U.TAU - Math.PI / 2; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
          ctx.closePath(); ctx.fill(); break;
        }
        case 'cash': {
          ctx.rotate(p.rot); ctx.fillStyle = '#5fa85a'; ctx.fillRect(-p.size, -p.size * 0.55, p.size * 2, p.size * 1.1);
          ctx.strokeStyle = '#2e5e2a'; ctx.lineWidth = 2; ctx.strokeRect(-p.size, -p.size * 0.55, p.size * 2, p.size * 1.1);
          ctx.fillStyle = '#2e5e2a'; ctx.beginPath(); ctx.arc(0, 0, p.size * 0.3, 0, U.TAU); ctx.fill(); break;
        }
        default:
          ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, U.TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  function draw(ctx) {
    if (!G) return;
    const t = G.t + (G.t2 || 0);
    ctx.save();
    if (G.shake > 0) ctx.translate(U.rand(-1, 1) * G.shake * 22, U.rand(-1, 1) * G.shake * 22);

    MP.ui.drawWall(ctx);
    drawCustomers(ctx, t);
    MP.ui.drawTable(ctx);

    // charco si rebalsó
    if (G.mate.overflow && G.mate.loc === 'table') {
      ctx.fillStyle = 'rgba(90,110,40,.45)';
      ctx.beginPath(); ctx.ellipse(MATE.x + 70, MATE.y + 128, 90, 16, 0, 0, U.TAU); ctx.fill();
    }

    // termómetro + hornalla + pava
    Gx.drawThermo(ctx, THERMO.x, THERMO.top, THERMO.bot, G.pava.temp, t);
    Gx.drawHornalla(ctx, HORNALLA.x, HORNALLA.y, G.pava.fire, t);
    if (!G.pouring) Gx.drawPava(ctx, PAVA.x, PAVA.y, 0.74, 0, t, { rattle: G.pava.temp >= 96 });
    const tc = G.pava.temp;
    const tcol = G.pava.boiled || tc > 90 ? '#ff5252' : tc >= 83 ? '#ffb74d' : tc >= 74 ? '#69f0ae' : tc >= 65 ? '#81d4fa' : '#fff';
    rr(ctx, PAVA.x - 64, 684, 128, 44, 14); ctx.fillStyle = 'rgba(30,15,5,.75)'; ctx.fill();
    text(ctx, Math.round(tc) + '°', PAVA.x, 707, { size: 32, color: tcol, stroke: '#000', sw: 4 });
    if (G.gasT > 0) text(ctx, 'SIN GAS ' + Math.ceil(G.gasT), HORNALLA.x, HORNALLA.y + 32, { size: 22, color: '#ff8a65', stroke: '#000', sw: 4 });
    if (G.pava.boiled) Gx.button(ctx, Object.assign({ pulse: true }, BTN.agua), t);

    // botones de acción
    const m = G.mate;
    Gx.button(ctx, Object.assign({}, BTN.vaciar, { disabled: m.yerba < 0.01 || m.loc !== 'table' }), t);
    Gx.button(ctx, Object.assign({}, BTN.tomo, { disabled: !mateReady(), pulse: mateReady() && m.first }), t);
    Gx.button(ctx, Object.assign({}, BTN.fuego, { label: G.pava.fire ? 'Apagar fuego' : 'Prender fuego', color: G.pava.fire ? '#e65100' : '#1e63b5', disabled: G.gasT > 0 }), t);

    // el mate
    const pz = matePose();
    const sip = G.trip && G.trip.phase === 'drink' ? G.trip.sip || 0 : 0;
    const mv = {
      yerba: m.yerba, freshR: U.clamp(m.fresh / Math.max(1, m.maxFresh), 0, 1), sweet: m.sweet, herb: m.herb,
      bombilla: m.bombilla, bombT: m.bombT, wiggle: m.wiggle, water: m.water * (1 - sip), overflow: m.overflow && G.mate.loc === 'table',
      boiled: m.boiledW, alpaca: G.run.upgrades.alpaca,
    };
    // guía de puntería
    if (G.tool === 'pava' && m.loc === 'table' && m.bombilla && !G.pouring && m.water < 0.9) {
      ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 5) * 0.3; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.ellipse(MATE.x + 46, MOUTH_Y + 2, 40, 14, 0, 0, U.TAU); ctx.stroke(); ctx.restore();
    }
    if (G.trip && !G.trip.self && G.trip.phase === 'drink') {
      // en la mano del cliente
      Gx.drawMate(ctx, pz.x, pz.y, pz.s, mv, t, { noShadow: true, calabaza: G.run.upgrades.calabaza });
      ctx.fillStyle = G.trip.c.p.skin;
      ctx.beginPath(); ctx.ellipse(pz.x + 44 * pz.s * 1.2, pz.y + 10, 16, 20, 0, 0, U.TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 2; ctx.stroke();
    } else {
      ctx.save(); ctx.globalAlpha = pz.a;
      Gx.drawMate(ctx, pz.x, pz.y, pz.s, mv, t, { calabaza: G.run.upgrades.calabaza, noShadow: !!G.trip });
      ctx.restore();
    }
    // cuchara de azúcar
    if (G.spoon > 0) {
      const k = 1 - G.spoon;
      ctx.save(); ctx.translate(MATE.x - 30, MOUTH_Y - 70 + Math.sin(k * Math.PI) * 30); ctx.rotate(-0.6 + k * 1.2);
      ctx.strokeStyle = '#b0b7be'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(70, -40); ctx.stroke();
      ctx.fillStyle = '#c9d0d6'; ctx.beginPath(); ctx.ellipse(-6, 4, 14, 9, -0.5, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-6, 0, 10, 5, -0.5, 0, U.TAU); ctx.fill();
      ctx.restore();
      if (Math.random() < 0.5) addP({ x: MATE.x - 36 + U.rand(-6, 6), y: MOUTH_Y - 60, vx: U.rand(-20, 20), vy: 80, g: 600, life: 0.3, max: 0.3, size: 2.5, color: '#fff' });
    }

    // clientes: globos (arriba de todo lo del fondo)
    for (const c of G.seats) if (c) drawOrderBubble(ctx, c, t);

    // pava sirviendo
    if (G.pouring) {
      const tilt = 0.62, s = 0.8;
      const tipLocal = Gx.pavaTip(0, 0, s, tilt);
      const tipX = G.pourXs + 8, tipY = 575;
      const px = tipX - tipLocal[0], py = tipY - tipLocal[1];
      Gx.drawPava(ctx, px, py, s, tilt, t, {});
      // chorro
      ctx.save();
      ctx.lineCap = 'round';
      const wob = Math.sin(t * 30) * 2;
      ctx.strokeStyle = 'rgba(170,215,255,.85)'; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.quadraticCurveTo(tipX + 6 + wob, (tipY + MOUTH_Y) / 2, G.pourXs, MOUTH_Y); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(tipX - 2, tipY); ctx.quadraticCurveTo(tipX + 3 - wob, (tipY + MOUTH_Y) / 2, G.pourXs - 2, MOUTH_Y); ctx.stroke();
      ctx.restore();
      if (G.pourXs < MATE.x) text(ctx, '¡Ojo! Lavás la montañita', MATE.x - 40, MOUTH_Y - 190, { size: 22, color: '#ffcc80', stroke: '#3b1d0e', sw: 5 });
    }
    // paquete de yerba
    if (G.yerbaPouring) {
      ctx.save(); ctx.translate(G.pourXs + 10, MOUTH_Y - 205); ctx.rotate(2.6 + Math.sin(t * 20) * 0.05);
      Gx.iconFor(ctx, 'yerba', 0, 0, 1.6);
      ctx.restore();
    }

    drawParticles(ctx);
    for (const f of G.floats) {
      const a = U.clamp(f.life / f.max * 2, 0, 1);
      ctx.save(); ctx.globalAlpha = a;
      const sc = 1 + Math.max(0, f.life - f.max + 0.2) * 2;
      text(ctx, f.text, U.clamp(f.x, 120, W - 120), f.y, { size: f.size * sc, color: f.col, stroke: '#2a1206', sw: 6 });
      ctx.restore();
    }

    // barra de ayuda
    const h = hint();
    rr(ctx, 16, 1036, W - 32, 52, 16);
    ctx.fillStyle = h.warn ? 'rgba(120,20,10,.88)' : 'rgba(30,15,5,.78)'; ctx.fill();
    text(ctx, h.text, W / 2, 1062, { size: h.text.length > 48 ? 19 : 21, font: U.FONT_B, weight: '900', color: h.warn ? '#ffd3cc' : '#fff4d6' });
    drawToolbar(ctx, t);
    if (!h.warn && h.target && (G.day <= 2 || G.t < 25) && !G.ending) {
      const tp = hintTargetPos(h.target);
      if (tp) drawArrow(ctx, tp.x, tp.y, t);
    }
    // indicadores de estado del mate
    if (m.yerba > 0.2 && m.loc === 'table') {
      const fr = U.clamp(m.fresh / Math.max(1, m.maxFresh), 0, 1);
      text(ctx, m.fresh <= 0 ? 'LAVADO' : 'Cebadas: ' + Math.max(0, Math.ceil(m.fresh)), 90, 590, { size: 20, font: U.FONT_B, weight: '900', color: m.fresh <= 0 ? '#ff8a80' : fr < 0.3 ? '#ffcc80' : '#fff', stroke: '#2a1206', sw: 5 });
      const tags = [];
      if (m.sweet) tags.push('Dulce'); else tags.push('Amargo');
      if (m.herb) tags.push('Peperina');
      if (m.yerba > 0.92) tags.push('¡Tapado!');
      text(ctx, tags.join(' · '), 90, 618, { size: 18, font: U.FONT_B, weight: '800', color: '#fff4d6', stroke: '#2a1206', sw: 4 });
    }

    drawHUD(ctx, t);
    ctx.restore();

    // banner de eventos
    if (G.banner) {
      const b = G.banner, k = U.clamp((3 - b.t) * 4, 0, 1), out = U.clamp(b.t * 3, 0, 1);
      ctx.save(); ctx.globalAlpha = out;
      const sc = U.easeOutBack(k);
      ctx.translate(W / 2, 470); ctx.scale(sc, sc);
      rr(ctx, -300, -70, 600, 140, 26); ctx.fillStyle = '#1d6b3a'; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = '#e0b23a'; ctx.stroke();
      text(ctx, b.title, 0, -18, { size: 42, color: '#fff3b0', stroke: '#0d3b1e', sw: 8 });
      text(ctx, b.sub, 0, 34, { size: 22, font: U.FONT_B, weight: '900', color: '#fff' });
      ctx.restore();
    }

    if (G.intro) drawIntro(ctx, t);
    if (G.paused) drawPause(ctx, t);
  }

  function drawIntro(ctx, t) {
    ctx.save();
    ctx.fillStyle = 'rgba(20,10,4,.72)'; ctx.fillRect(0, 0, W, H);
    rr(ctx, 50, 230, W - 100, 700, 34); ctx.fillStyle = '#fbf0d9'; ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = '#1d6b3a'; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#e0b23a'; rr(ctx, 64, 244, W - 128, 672, 26); ctx.stroke();
    Gx.fileteTitle(ctx, 'DÍA ' + G.day, W / 2, 310, 76, t);
    const lines = [
      ['Meta del día', U.money(G.meta)],
      ['Precio del mate', U.money(G.price)],
      ['Paquete de yerba', U.money(G.yerbaCost)],
      ['Inflación', G.day === 1 ? '¡Arrancamos!' : '+25% todo'],
    ];
    lines.forEach(([a, b], i) => {
      text(ctx, a, 110, 410 + i * 54, { size: 26, font: U.FONT_B, weight: '800', color: '#5d4037', align: 'left' });
      text(ctx, b, W - 110, 410 + i * 54, { size: 30, color: '#1d6b3a', align: 'right' });
    });
    let ev = '';
    if (G.day === 1) ev = 'Primer día: prendé el fuego, poné yerba y la bombilla, y cebá en el hueco. ¡El primero es tuyo!';
    else if (G.event === 'frio') ev = 'Hoy hace frío: todos lo quieren BIEN CALIENTE.';
    else if (G.event === 'calor') ev = '¡Qué calor! Hoy todos lo quieren TIBIO.';
    else if (G.event === 'gas') ev = 'Dicen que hoy cortan el gas un rato... ojo.';
    else if (G.event === 'suegra') ev = 'Hoy viene la suegra. Exigente, pero paga doble.';
    else ev = 'Un día normal en la ronda. ¡Que no falte el mate!';
    if (G.run.bizcochos) ev += ' Hay bizcochitos: la gente espera más.';
    ctx.font = `800 24px ${U.FONT_B}`;
    Gx.wrap(ctx, ev, W - 180).forEach((l, i) => text(ctx, l, W / 2, 660 + i * 32, { size: 24, font: U.FONT_B, weight: '800', color: '#3b2412' }));
    Gx.button(ctx, { x: 190, y: 800, w: 340, h: 92, label: '¡A cebar!', color: '#2e7d32', pulse: true, size: 40 }, t);
    ctx.restore();
  }

  function drawPause(ctx, t) {
    ctx.save();
    ctx.fillStyle = 'rgba(20,10,4,.75)'; ctx.fillRect(0, 0, W, H);
    Gx.fileteTitle(ctx, 'Pausa', W / 2, 420, 80, t);
    Gx.button(ctx, PAUSE_BTNS.seguir, t);
    Gx.button(ctx, Object.assign({}, PAUSE_BTNS.musica, { label: 'Música: ' + (Sfx.musicOn ? 'Sí' : 'No') }), t);
    Gx.button(ctx, Object.assign({}, PAUSE_BTNS.sonido, { label: 'Sonido: ' + (Sfx.sfxOn ? 'Sí' : 'No') }), t);
    Gx.button(ctx, PAUSE_BTNS.salir, t);
    ctx.restore();
  }

  MP.Play = {
    start, update, draw, down, move, up, key, blur,
    get state() { return G; },
    consts: { W, H, MATE, SEAT_Y, THERMO, PAVA, HORNALLA },
  };
})();
