/* Mate Perfecto — escena de juego: la ronda */
(function () {
  'use strict';
  const MP = window.MP;
  const U = MP.U, Gx = MP.G, D = MP.DATA, Sfx = MP.Sfx, Eco = MP.Eco;
  const { rr, text } = Gx;

  const W = 720, H = 1280;
  const SEAT_Y = 524;
  const PAVA = { x: 560, y: 848 };
  const HORNALLA = { x: 560, y: 902 };
  const THERMO = { x: 690, top: 600, bot: 880 };
  const MATE_POS = {
    1: [{ x: 250, y: 806, s: 0.92 }],
    2: [{ x: 126, y: 830, s: 0.66 }, { x: 350, y: 830, s: 0.66 }],
  };
  const PLATES = { bizcochos: { x: 60, y: 566 }, medialunas: { x: 178, y: 566 }, facturas: { x: 592, y: 566 } };
  const TEMP = {
    tibio: { lo: 64, hi: 75, label: 'Tibio 64-75°', col: '#3fa7d6' },
    justo: { lo: 72, hi: 84, label: 'Justo 72-84°', col: '#3aa655' },
    caliente: { lo: 80, hi: 90, label: 'Caliente 80-90°', col: '#e07b1a' },
  };
  const TOOLS = [
    { id: 'yerba', label: 'Yerba', key: '1' },
    { id: 'azucar', label: 'Azúcar', key: '2' },
    { id: 'yuyo', label: 'Yuyos', key: '3' },
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
    menos: { x: 462, y: 684, w: 52, h: 44, label: '–', color: '#455a64', size: 30, r: 12 },
    mas: { x: 606, y: 684, w: 52, h: 44, label: '+', color: '#455a64', size: 30, r: 12 },
    pausa: { x: 652, y: 14, w: 56, h: 56, label: 'II', color: '#5d4037', size: 24, r: 16 },
  };
  const PAUSE_BTNS = {
    seguir: { x: 210, y: 520, w: 300, h: 84, label: 'Seguir', color: '#2e7d32' },
    musica: { x: 210, y: 630, w: 300, h: 70, label: 'Música', color: '#1e63b5', size: 26 },
    sonido: { x: 210, y: 720, w: 300, h: 70, label: 'Sonido', color: '#1e63b5', size: 26 },
    salir: { x: 210, y: 820, w: 300, h: 76, label: 'Salir al menú', color: '#c0392b', size: 28 },
  };
  const INTRO_BTN = { x: 190, y: 1060, w: 340, h: 92, label: '¡A cebar!', color: '#2e7d32', size: 40 };

  let G = null;

  // ------------------------------------------------------------------
  function seatXs(n) { return n === 2 ? [210, 510] : [120, 360, 600]; }

  function start(run) {
    const day = run.day;
    const infl = Eco.infl(day);
    const nm = run.own.segundo && run.equip.mates[1] ? 2 : 1;
    G = {
      run, day, t: 0, infl,
      price: 100 * infl,
      meta: Math.round((300 * Math.pow(1.38, day - 1)) / 10) * 10,
      dayLen: day === 1 ? 100 : 120,
      timeLeft: day === 1 ? 100 : 120,
      nSeats: day === 1 ? 2 : 3,
      patMul: Math.max(0.65, 1 - 0.05 * (day - 1)) * (day === 1 ? 1.35 : 1),
      tool: 'yerba',
      brand: Eco.unlockedYerbas(day).find((k) => (run.inv.yerba[k] || 0) > 0) || 'tarague',
      yuyoSel: Eco.unlockedYuyos(day).find((k) => (run.inv.yuyo[k] || 0) > 0) || Eco.unlockedYuyos(day)[0] || null,
      mates: [], sel: 0,
      pava: { temp: 22, fire: false, boiled: false, target: 78, electric: !!run.own.electrica },
      pouring: -1, yerbaPouring: -1, pourX: 0, pourXs: 0,
      seats: [], spawnT: [],
      parts: [], floats: [],
      shake: 0, toast: null, banner: null,
      stats: { served: 0, excellent: 0, bad: 0, lost: 0, earned: 0, tips: 0, fines: 0, snacks: 0, challengesWon: 0, challengesLost: 0 },
      intro: true, paused: false, ending: false, endT: 0,
      event: null, gasT: 0, gasAt: -1, spoon: 0,
      tickerX: W, news: '', lastTick: 99,
      unlocks: Eco.unlocksOn(day),
    };
    for (let i = 0; i < nm; i++) G.mates.push(freshMate(i, run.equip.mates[i]));
    G.seatX = seatXs(G.nSeats);
    for (let i = 0; i < G.nSeats; i++) { G.seats.push(null); G.spawnT.push(0.6 + i * 1.6); }
    if (day >= 2 && Math.random() < 0.7) {
      const pool = ['gas', 'frio', 'calor', 'lluvia'];
      if (day >= 3) pool.push('suegra', 'partido');
      G.event = U.pick(pool);
      if (G.event === 'gas') G.gasAt = U.rand(0.3, 0.6) * G.dayLen;
      if (G.event === 'suegra') G.suegraPending = true;
    }
    nextNews();
    MP.ui && MP.ui.resetCaches();
  }

  function freshMate(i, kind) {
    return {
      i, kind: kind || 'calabaza',
      yerba: 0, fresh: 0, maxFresh: 1, sweet: false, sugarNow: false, yuyo: null, brand: null,
      bombilla: false, bombT: 1, moved: false, wiggle: 0,
      water: 0, waterTemp: 0, boiledW: false, overflow: false, washExtra: 0,
      first: true, cebadas: 0, loc: 'table', trip: null,
    };
  }

  function mpos(m) { return MATE_POS[G.mates.length][m.i]; }
  function mouthY(m) { const p = mpos(m); return p.y - 104 * p.s; }
  const MK = (m) => D.MATES[m.kind] || D.MATES.calabaza;
  const BK = () => D.BOMBILLAS[G.run.equip.bombilla] || D.BOMBILLAS.acero;

  function freshFromYerba(m, y) {
    let f;
    if (y < 0.25) f = 2;
    else if (y < 0.55) f = 2 + ((y - 0.25) / 0.3) * 7;
    else f = 10;
    const Y = D.YERBAS[m.brand];
    if (Y) f += Y.fresh;
    if (MK(m).big) f -= 2;
    return Math.max(2, Math.round(f));
  }

  function nextNews() {
    let s = U.pick(D.NEWS);
    s = s.replace('{dolar}', U.money(1450 * Math.pow(G.infl, 1.1)).replace('$ ', ''));
    G.news = '★ ' + s + ' ★';
    G.tickerX = W;
  }

  const food = (k) => (G.run.inv.food[k] || 0);
  const perk = (k) => food(k) > 0;

  // ------------------------------------------------------------------
  function toast(s, col) { G.toast = { text: s, t: 2.2, col: col || '#c0392b' }; }
  function floater(textS, x, y, col, size) { G.floats.push({ text: textS, x, y, life: 1.6, max: 1.6, col: col || '#fff', size: size || 30 }); }
  function addP(o) { G.parts.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, life: 1, max: 1, size: 4, color: '#fff', type: 'dot', rot: 0, vr: 0 }, o)); }
  function addMoney(v, x, y, label) {
    v = Math.round(v);
    G.run.money += v;
    if (v >= 0) G.stats.earned += v; else G.stats.fines += -v;
    floater((label ? label + ' ' : '') + (v >= 0 ? '+' : '') + U.money(v), x, y, v >= 0 ? '#7CFC8A' : '#ff6b5b', 30);
    if (v > 0) for (let i = 0; i < 5; i++) addP({ x, y, vx: U.rand(-120, 120), vy: U.rand(-320, -160), g: 600, life: 1.1, max: 1.1, type: 'cash', size: 14, rot: U.rand(0, 6), vr: U.rand(-6, 6) });
  }
  function say(c, s, dur) { c.say = s; c.sayT = dur || 2.4; c.talk = Math.min(1.2, (dur || 2.4) * 0.5); }
  function setMood(c, m, dur) { c.mood = m; c.moodT = dur || 2.5; }
  function banner(title, sub) { G.banner = { title, sub, t: 3 }; Sfx.bell(); }

  // ------------------------------------------------------------------
  function spawn(i) {
    const present = G.seats.filter(Boolean).map((c) => c.p.id);
    let p;
    G.seenNew = G.seenNew || {};
    if (G.suegraPending && G.t > 12) { p = D.SUEGRA; G.suegraPending = false; banner('¡Llegó la suegra!', 'Exigente... pero paga el doble'); }
    else {
      const pool = D.PERSONAS.filter((q) => q.minDay <= G.day && !present.includes(q.id) && q.id !== G.lastLeft);
      const fresh = pool.filter((q) => q.minDay === G.day && G.day > 1 && !G.seenNew[q.id]);
      p = fresh.length && Math.random() < 0.7 ? fresh[0] : U.pick(pool.length ? pool : D.PERSONAS.filter((q) => q.minDay <= G.day));
      G.seenNew[p.id] = true;
    }
    let temp = p.temp;
    if (G.event === 'frio') temp = 'caliente';
    if (G.event === 'calor') temp = 'tibio';
    const x = G.seatX[i];
    const fromLeft = x < W / 2 || (x === W / 2 && Math.random() < 0.5);
    let patMax = p.patience * G.patMul;
    if (G.event === 'lluvia') patMax *= 1.3;
    if (G.event === 'partido') patMax *= 0.8;
    const yuyos = Eco.unlockedYuyos(G.day);
    const brands = Eco.unlockedYerbas(G.day);
    let fav = null, strict = false;
    if (p.fav && brands.includes(p.fav)) { fav = p.fav; strict = (p.traits || []).includes('exigeYerba'); }
    else if (brands.length > 1 && Math.random() < 0.25) fav = U.pick(brands);
    const foods = Object.keys(D.FOODS).filter((k) => D.FOODS[k].minDay <= G.day && food(k) > 0);
    const c = {
      p, seat: i, x: fromLeft ? -110 : W + 110, tx: x, baseY: SEAT_Y,
      state: 'arrive', sweet: Math.random() < p.sweet, temp,
      yuyo: yuyos.length && Math.random() < p.herb ? U.pick(yuyos) : null,
      fav, strict, snack: foods.length && Math.random() < 0.4 ? U.pick(foods) : null, snackDone: false,
      patMax, patience: patMax, wants: U.randi(3, 6), mood: 'neutral', moodT: 0, say: null, sayT: 0, talk: 0,
      phase: Math.random() * 6, blink: 0, blinkT: U.rand(1, 4), anger: 0, chatT: 0, leaveT: 0, lookX: 0, steamT: 0,
      challengeT: 0,
    };
    if (p.special) c.wants = 3;
    G.seats[i] = c;
  }

  function leave(c, line, mood, canChallenge) {
    if (line) say(c, line, 2.4);
    setMood(c, mood || 'neutral', 3);
    c.state = 'leaving';
    c.leaveT = 2.1;
    if (canChallenge && G.day >= 2 && !G.ending) { c.challengeT = 4.5; c.leaveT = 4.5; }
  }

  function updateCustomers(dt) {
    const patRate = perk('bizcochos') ? 0.75 : 1;
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
      c.lookX = U.lerp(c.lookX, U.clamp((W / 2 - 80 - c.x) / 300, -1, 1), dt * 3);

      switch (c.state) {
        case 'arrive': {
          const d = c.tx - c.x;
          c.x += Math.sign(d) * Math.min(Math.abs(d), 420 * dt);
          if (Math.abs(d) < 1) { c.x = c.tx; c.state = 'waiting'; say(c, U.pick(D.LINES.greet), 2); }
          break;
        }
        case 'waiting': {
          if (!G.ending) c.patience -= dt * patRate;
          const r = c.patience / c.patMax;
          c.anger = U.clamp((0.45 - r) / 0.45, 0, 1);
          if (c.moodT <= 0) c.mood = r < 0.35 ? 'impatient' : 'neutral';
          if (r < 0.3) {
            c.steamT -= dt;
            if (c.steamT <= 0) { c.steamT = 0.25; addP({ x: c.x + U.rand(-40, 40), y: c.baseY - 240, vx: U.rand(-20, 20), vy: -60, life: 0.9, max: 0.9, type: 'steam', size: 12, color: 'rgba(255,255,255,.8)' }); }
          }
          if (c.patience <= 0) {
            G.stats.lost++;
            addMoney(-G.price * 0.3, c.x, c.baseY - 260, 'Se fue');
            Sfx.fail();
            G.lastLeft = c.p.id;
            leave(c, U.pick(D.LINES.impatient), 'angry', true);
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
          if (c.challengeT > 0) c.challengeT -= dt;
          if (c.leaveT <= 0) { c.state = 'leave'; c.challengeT = 0; c.dir = c.x < W / 2 ? -1 : 1; }
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
  function evaluate(c, m) {
    const r = [];
    let bonus = 0;
    const add = (pen, key) => r.push({ pen, key });
    if (m.first) add(35, 'first');
    if (m.fresh <= 0) add(55, 'lavado'); else if (m.fresh <= 1.5) add(14, 'lavandose');
    if (m.boiledW) add(30, 'hervida');
    if (c.sweet && !m.sweet) add(30, 'sinAzucar');
    else if (c.sweet && !m.sugarNow) add(15, 'pocoAzucar');
    if (!c.sweet && m.sweet) add(45, 'conAzucar');
    if (c.yuyo && m.yuyo !== c.yuyo) add(15, 'sinYuyo');
    if (c.fav) {
      if (m.brand === c.fav) bonus += 8;
      else if (c.strict) add(25, 'yerbaMala');
    }
    const T = TEMP[c.temp], wt = m.waterTemp;
    const tmul = MK(m).keep ? 2 : 4;
    if (wt < T.lo) add(Math.min(50, (T.lo - wt) * tmul), 'frio');
    else if (wt > T.hi) add(Math.min(50, (wt - T.hi) * tmul), 'caliente');
    if (m.water < 0.6) add(35, 'poco'); else if (m.water < 0.8) add((0.8 - m.water) * 120, 'poco');
    if (m.overflow) add(12, 'rebalso');
    if (m.moved) add(20, 'bombilla');
    if (m.yerba > 0.92 && !BK().noTapa) add(12, 'tapado');
    if (c.patience < c.patMax * 0.25) add(8, 'lento');
    const Y = D.YERBAS[m.brand];
    bonus += (Y ? Y.q : 0) + MK(m).q + BK().q + (perk('facturas') ? 5 : 0);
    let q = 100 - r.reduce((a, b) => a + b.pen, 0) + bonus;
    q = U.clamp(Math.round(q), 0, 100);
    r.sort((a, b) => b.pen - a.pen);
    return { q, worst: r.length && r[0].pen >= 10 ? r[0].key : null, favHit: c.fav && m.brand === c.fav };
  }

  function consumeCebada(m) {
    m.fresh -= 1 + m.washExtra;
    m.washExtra = 0; m.water = 0; m.overflow = false; m.moved = false; m.first = false;
    m.cebadas++; m.boiledW = false; m.waterTemp = 0; m.sugarNow = false;
  }

  function finishDrink(c, m) {
    const { q, worst, favHit } = evaluate(c, m);
    const P = c.p;
    const price = G.price * (P.pay || 1) * (MK(m).big ? 1.5 : 1);
    const hx = c.x, hy = c.baseY - 270;
    const traits = P.traits || [];
    c.wants--;
    G.stats.served++;
    G.run.stats.served = (G.run.stats.served || 0) + 1;
    const complaint = worst ? U.pick(D.COMPLAINTS[worst]) : null;
    if (q >= 85) {
      const tipMul = (1 + MK(m).tip + BK().tip + (perk('medialunas') ? 0.25 : 0) + (G.event === 'partido' ? 0.5 : 0)) * (P.tipX || 1);
      const tip = Math.round(price * 0.35 * tipMul * (q / 100));
      addMoney(price * (q / 100) + tip, hx, hy);
      G.stats.tips += tip; G.stats.excellent++;
      G.run.stats.excellent = (G.run.stats.excellent || 0) + 1;
      setMood(c, 'love', 3);
      let line = U.pick(D.LINES.great);
      if (traits.includes('gringo')) line = U.pick(D.LINES.gringo);
      if (traits.includes('influencer')) { line = U.pick(D.LINES.influencer); floater('¡Te recomendó en sus historias!', W / 2, 640, '#f48fb1', 26); }
      if (favHit) line = '¡Mi yerba favorita! ' + line;
      say(c, line, 2.4);
      Sfx.cash(); Sfx.yay();
      for (let i = 0; i < 10; i++) addP({ x: hx, y: hy + 60, vx: U.rand(-220, 220), vy: U.rand(-320, -80), g: 300, life: 1, max: 1, type: 'star', size: U.rand(8, 14), color: U.pick(['#ffd54f', '#fff59d', '#ffb300']), rot: 0, vr: U.rand(-5, 5) });
      floater(q === 100 ? '¡MATE PERFECTO!' : '¡EXCELENTE!', hx, hy - 40, '#ffd54f', 34);
      c.state = 'chat'; c.chatT = U.rand(2.5, 5);
    } else if (q >= 65) {
      addMoney(price * (q / 100), hx, hy);
      setMood(c, 'happy', 2);
      say(c, complaint && Math.random() < 0.6 ? complaint : U.pick(D.LINES.ok), 2.4);
      Sfx.cash();
      c.state = 'chat'; c.chatT = U.rand(3, 6);
    } else if (q >= 45) {
      addMoney(price * (q / 100) * 0.5, hx, hy);
      setMood(c, 'sad', 2.5);
      say(c, complaint || U.pick(D.LINES.ok), 2.6);
      Sfx.tick();
      if (Math.random() < 0.45) c.wants = 0;
      c.state = 'chat'; c.chatT = U.rand(3, 5);
    } else {
      G.stats.bad++;
      addMoney(-price * 0.5, hx, hy, 'Multa');
      if (traits.includes('influencer')) addMoney(-G.price * 0.5, W / 2, 640, 'Mala reseña');
      Sfx.fail();
      G.shake = 0.4;
      c.anger = 1;
      G.lastLeft = c.p.id;
      leave(c, (complaint || '¡Horrible!') + ' ¡Gracias!', 'angry', true);
    }
    if (c.state === 'chat' && c.wants <= 0) c.chatT = 1.2;
  }

  // ------------------------------------------------------------------
  const mateReady = (m) => m && m.loc === 'table' && m.water > 0.05;
  const selMate = () => G.mates[G.sel] || G.mates[0];

  function serve(c) {
    let m = selMate();
    if (!mateReady(m)) m = G.mates.find(mateReady);
    if (!m) {
      toast(G.mates.some((q) => q.loc !== 'table') ? 'El mate está dando vueltas...' : '¡Primero cebá el mate!');
      return;
    }
    stopPour();
    c.state = 'drinking';
    m.loc = 'travel';
    m.trip = { c, self: false, phase: 'go', t: 0 };
    Sfx.whoosh();
  }

  function drinkSelf() {
    const m = selMate();
    if (!mateReady(m)) { toast(m.loc !== 'table' ? 'El mate está dando vueltas...' : 'No hay nada para tomar'); return; }
    stopPour();
    m.loc = 'travel';
    m.trip = { c: null, self: true, phase: 'go', t: 0 };
    Sfx.whoosh();
  }

  const TRIP_T = { go: 0.45, drink: 1.7, back: 0.4 };

  function tripTarget(m) {
    const tr = m.trip, p = mpos(m);
    if (tr.self) return { x: p.x + 40, y: 1120, s: p.s * 1.45 };
    const hy = tr.c.baseY - 178;
    return { x: tr.c.x - 29, y: hy + 130, s: 0.42 };
  }

  function matePose(m) {
    const p = mpos(m);
    if (!m.trip) return { x: p.x, y: p.y, s: p.s, a: 1 };
    const tr = m.trip, tg = tripTarget(m);
    const k = tr.phase === 'go' ? U.easeInOut(tr.t / TRIP_T.go) : tr.phase === 'back' ? 1 - U.easeInOut(tr.t / TRIP_T.back) : 1;
    const arc = Math.sin(k * Math.PI) * (tr.self ? 0 : -80);
    return { x: U.lerp(p.x, tg.x, k), y: U.lerp(p.y, tg.y, k) + arc, s: U.lerp(p.s, tg.s, k), a: tr.self ? 1 - k * 0.25 : 1 };
  }

  function updateTrips(dt) {
    for (const m of G.mates) {
      const tr = m.trip;
      if (!tr) continue;
      tr.t += dt;
      const p = mpos(m);
      if (tr.phase === 'go' && tr.t >= TRIP_T.go) {
        tr.phase = 'drink'; tr.t = 0;
        if (tr.c) setMood(tr.c, 'drink', 99);
        Sfx.slurp();
        if (tr.self) floater('¡Glu glu glu!', p.x, 1000, '#fff', 30);
      } else if (tr.phase === 'drink') {
        const dur = tr.self ? 1.2 : TRIP_T.drink;
        tr.sip = tr.t / dur;
        if (tr.t >= dur) {
          if (tr.self) {
            if (m.first) { floater('¡El primero es del cebador!', p.x + 60, 940, '#ffd54f', 26); Sfx.yay(); }
          } else {
            tr.c.moodT = 0; tr.c.mood = 'neutral';
            finishDrink(tr.c, m);
          }
          consumeCebada(m);
          tr.phase = 'back'; tr.t = 0; tr.sip = 0;
          Sfx.whoosh();
        }
      } else if (tr.phase === 'back' && tr.t >= TRIP_T.back) {
        m.trip = null; m.loc = 'table';
        if (m.fresh <= 0) toast('¡Un mate se lavó! Vacialo y poné yerba nueva', '#8d6e63');
      }
    }
  }

  // ------------------------------------------------------------------
  function stopPour() {
    if (G.pouring >= 0) { G.pouring = -1; Sfx.setPour(false); }
    G.yerbaPouring = -1;
  }

  function kioscoPrice(kind) {
    if (kind === 'azucar') return Eco.price(D.SUGAR.price * 0.6, G.day);
    if (kind === 'yerba') return Eco.price((D.YERBAS[G.brand].price / 5) * 2.5, G.day);
    if (kind === 'yuyo') return Eco.price((D.YUYOS[G.yuyoSel].price / 6) * 2.5, G.day);
    return 0;
  }

  function kiosco(kind) {
    const pr = kioscoPrice(kind);
    G.run.money -= pr; G.stats.fines += pr;
    if (kind === 'azucar') G.run.inv.azucar = (G.run.inv.azucar || 0) + 5;
    if (kind === 'yerba') G.run.inv.yerba[G.brand] = (G.run.inv.yerba[G.brand] || 0) + 1;
    if (kind === 'yuyo') G.run.inv.yuyo[G.yuyoSel] = (G.run.inv.yuyo[G.yuyoSel] || 0) + 1;
    floater('Kiosco -' + U.money(pr), 360, 1000, '#ffcc80', 24);
    Sfx.cash();
  }

  function toolOnMate(m, x) {
    G.sel = m.i;
    if (m.loc !== 'table') { toast('Ese mate está dando vueltas...'); return; }
    const p = mpos(m);
    const my = mouthY(m);
    switch (G.tool) {
      case 'yerba': {
        if (m.cebadas > 0 || m.water > 0) { toast('Ese mate ya está usado: tocá VACIAR'); return; }
        if (m.bombilla) { toast('Con la bombilla puesta no... tocá VACIAR'); return; }
        if (m.yerba >= 1) { toast('¡Ya está lleno de yerba!'); return; }
        if (m.yerba < 0.01) {
          if ((G.run.inv.yerba[G.brand] || 0) <= 0) { toast('No te queda ' + D.YERBAS[G.brand].name + '. ¡Kiosco o cambiá de yerba!'); return; }
          G.run.inv.yerba[G.brand]--;
          m.brand = G.brand;
        }
        G.yerbaPouring = m.i; G.pourX = x; G.pourXs = x; return;
      }
      case 'azucar':
        if (m.yerba < 0.2) { toast('Primero poné la yerba'); return; }
        if (m.sugarNow) { toast('Ya tiene su cucharadita'); return; }
        if ((G.run.inv.azucar || 0) <= 0) { toast('¡Se acabó el azúcar! Mandá al kiosco'); return; }
        G.run.inv.azucar--;
        if (!m.sweet) floater('Endulzado', p.x - 40, p.y - 170 * p.s, '#fff', 26);
        m.sweet = true; m.sugarNow = true;
        G.spoon = 1; G.spoonM = m.i; Sfx.clink(); return;
      case 'yuyo': {
        const k = G.yuyoSel;
        if (!k) { toast('Los yuyos se desbloquean el día 2'); return; }
        if (m.yerba < 0.2) { toast('Primero poné la yerba'); return; }
        if (m.yuyo === k) { toast('Ya tiene ' + D.YUYOS[k].name.toLowerCase()); return; }
        if ((G.run.inv.yuyo[k] || 0) <= 0) { toast('No te queda ' + D.YUYOS[k].name.toLowerCase() + '. ¡Kiosco!'); return; }
        G.run.inv.yuyo[k]--;
        m.yuyo = k;
        floater('+ ' + D.YUYOS[k].name, p.x - 40, p.y - 170 * p.s, '#b9f6ca', 26);
        for (let i = 0; i < 8; i++) addP({ x: p.x - 30 * p.s + U.rand(-30, 30), y: my - 120, vx: U.rand(-40, 40), vy: U.rand(40, 120), g: 400, life: 0.5, max: 0.5, type: 'leaf', size: 12, color: D.YUYOS[k].col, rot: U.rand(0, 6), vr: U.rand(-8, 8) });
        Sfx.pop(); return;
      }
      case 'bombilla':
        if (m.yerba < 0.2) { toast('Primero poné la yerba'); return; }
        if (!m.bombilla) { m.bombilla = true; m.bombT = 0; Sfx.pop(); return; }
        m.moved = true; m.wiggle = 1; G.shake = 0.25;
        toast('¡¡NUNCA se mueve la bombilla!!');
        Sfx.fail(); return;
      case 'pava':
        if (m.yerba < 0.2) { toast('Primero poné la yerba'); return; }
        if (!m.bombilla) { toast('Poné la bombilla primero'); return; }
        G.pouring = m.i; G.pourX = x; G.pourXs = x; Sfx.setPour(true); return;
    }
  }

  function vaciar() {
    const m = selMate();
    if (m.loc !== 'table') { toast('Ese mate está dando vueltas...'); return; }
    if (m.yerba <= 0.01) { toast('Ese mate ya está vacío'); return; }
    stopPour();
    const p = mpos(m);
    for (let i = 0; i < 26; i++) addP({ x: p.x + U.rand(-60, 60) * p.s, y: mouthY(m), vx: U.rand(-250, 250), vy: U.rand(-420, -200), g: 1100, life: 1, max: 1, type: 'dot', size: U.rand(3, 6), color: U.pick(['#6f9a2c', '#8a7d48', '#b5a76a']) });
    G.mates[m.i] = freshMate(m.i, m.kind);
    Sfx.whoosh();
    floater('¡Yerba a las plantas!', p.x, p.y - 210 * p.s, '#c5e1a5', 26);
  }

  function toggleFire() {
    if (G.gasT > 0) { toast(G.pava.electric ? '¡Se cortó la luz! Esperá...' : '¡No hay gas! Esperá...'); return; }
    G.pava.fire = !G.pava.fire;
    Sfx.click();
  }

  function changeWater() {
    G.pava.temp = 20; G.pava.boiled = false;
    Sfx.splash();
    floater('Agua nueva', PAVA.x, PAVA.y - 120, '#b3e5fc', 26);
  }

  function giveSnack(kind) {
    if (food(kind) <= 0) return;
    const c = G.seats.filter((s) => s && (s.state === 'waiting' || s.state === 'chat') && s.snack === kind && !s.snackDone).sort((a, b) => a.patience - b.patience)[0];
    const F = D.FOODS[kind];
    if (!c) { toast('Nadie pidió ' + F.name.toLowerCase() + ' todavía', '#6d4c41'); return; }
    G.run.inv.food[kind]--;
    c.snackDone = true;
    c.patience = Math.min(c.patMax, c.patience + c.patMax * 0.35);
    const pr = Eco.price(F.sell, G.day);
    G.stats.snacks += pr;
    addMoney(pr, c.x, c.baseY - 260);
    say(c, U.pick(D.LINES.snackThanks), 1.8);
    setMood(c, 'happy', 1.5);
    Sfx.cash();
  }

  function updatePava(dt) {
    const p = G.pava;
    if (G.gasAt > 0 && G.t >= G.gasAt) {
      G.gasAt = -1; G.gasT = 10; p.fire = false;
      banner(p.electric ? '¡Se cortó la luz!' : '¡Se cortó el gas!', 'Diez segundos sin calentar...');
    }
    if (G.gasT > 0) { G.gasT -= dt; p.fire = false; if (G.gasT <= 0) toast(p.electric ? '¡Volvió la luz!' : '¡Volvió el gas!', '#2e7d32'); }
    if (p.electric) {
      if (p.fire) {
        if (p.temp < p.target - 0.5) p.temp = Math.min(p.target, p.temp + (p.temp < 60 ? 9 : 6) * dt);
        else p.temp = U.lerp(p.temp, p.target, Math.min(1, dt * 2));
      } else {
        p.temp -= (p.temp - 22) * (G.run.own.termo ? 0.004 : 0.022) * dt;
      }
    } else if (p.fire) {
      p.temp += (p.temp < 60 ? 8 : 4.5) * dt;
      if (p.temp >= 100) {
        p.temp = 100;
        if (!p.boiled) { p.boiled = true; G.shake = 0.35; Sfx.boil(); toast('¡SE HIRVIÓ EL AGUA! Cambiala'); }
      }
    } else {
      const k = G.run.own.termo ? 0.004 : 0.028;
      p.temp -= (p.temp - 22) * k * dt;
    }
    Sfx.setFire(p.fire && !p.electric);
    Sfx.setKettle(p.fire && !p.electric ? (p.temp - 86) / 14 : 0);
    if (p.temp > 62 && G.pouring < 0 && Math.random() < dt * (p.temp - 55) * 0.25) {
      const [tx, ty] = p.electric ? [PAVA.x + 70, PAVA.y - 66] : Gx.pavaTip(PAVA.x, PAVA.y, 0.74, 0);
      addP({ x: tx, y: ty, vx: U.rand(10, 40), vy: U.rand(-80, -40), life: 1.2, max: 1.2, type: 'steam', size: 10, color: 'rgba(255,255,255,.7)' });
    }
    if (p.temp >= 96 && Math.random() < dt * 10) {
      addP({ x: PAVA.x + U.rand(-30, 30), y: PAVA.y - 40, vx: U.rand(-30, 30), vy: -90, life: 0.8, max: 0.8, type: 'steam', size: 12, color: 'rgba(255,255,255,.8)' });
    }
  }

  function updatePour(dt) {
    G.pourXs = U.lerp(G.pourXs, G.pourX, Math.min(1, dt * 14));
    if (G.yerbaPouring >= 0) {
      const m = G.mates[G.yerbaPouring];
      const d = 0.42 * dt;
      if (m.yerba < 1.05) m.yerba = Math.min(1.05, m.yerba + d);
      m.maxFresh = freshFromYerba(m, m.yerba); m.fresh = m.maxFresh;
      if (Math.random() < 0.7) Sfx.yerbaTick();
      for (let i = 0; i < 3; i++) addP({ x: G.pourXs - 10 + U.rand(-10, 10), y: mouthY(m) - 160, vx: U.rand(-30, 30), vy: U.rand(100, 250), g: 900, life: 0.32, max: 0.32, type: 'dot', size: U.rand(2, 4), color: U.pick(['#6f9a2c', '#8fb83f', '#c9c27a']) });
      if (m.yerba >= 1.05) { stopPour(); toast('¡Tapaste el mate de yerba!'); }
    }
    if (G.pouring >= 0) {
      const m = G.mates[G.pouring];
      if (m.loc !== 'table') { stopPour(); return; }
      const p = mpos(m);
      const d = 0.46 * dt * (MK(m).big ? 0.75 : 1);
      if (m.water < 0.02) { m.waterTemp = G.pava.temp; m.boiledW = false; }
      m.waterTemp = (m.waterTemp * m.water + G.pava.temp * d) / (m.water + d);
      if (G.pava.boiled) m.boiledW = true;
      if (G.pourXs < p.x) m.washExtra += d * 1.6;
      m.water += d;
      if (!G.pava.electric || !G.pava.fire) G.pava.temp -= d * 2;
      if (Math.random() < 0.6) addP({ x: G.pourXs + U.rand(-6, 6), y: mouthY(m), vx: U.rand(-60, 60), vy: U.rand(-120, -40), g: 700, life: 0.3, max: 0.3, type: 'drop', size: 3, color: 'rgba(190,225,255,.9)' });
      if (m.water > 1) {
        m.water = 1;
        if (!m.overflow) {
          m.overflow = true; G.shake = 0.3; Sfx.splash();
          toast('¡REBALSÓ! ¡Trapo, trapo!');
          addMoney(-G.price * 0.15, p.x, p.y - 200 * p.s, 'Trapo');
        }
        for (let i = 0; i < 2; i++) addP({ x: p.x + U.rand(20, 90) * p.s, y: mouthY(m) + 20, vx: U.rand(-40, 80), vy: U.rand(0, 60), g: 800, life: 0.6, max: 0.6, type: 'drop', size: 4, color: 'rgba(110,130,50,.9)' });
      }
    }
  }

  function updateParticles(dt) {
    for (const p of G.parts) { p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; }
    G.parts = G.parts.filter((p) => p.life > 0);
    if (G.parts.length > 400) G.parts.splice(0, G.parts.length - 400);
    for (const f of G.floats) { f.life -= dt; f.y -= 50 * dt; }
    G.floats = G.floats.filter((f) => f.life > 0);
    for (const m of G.mates) {
      if (m.water > 0.1 && m.waterTemp > 60 && Math.random() < dt * 6) {
        const pz = matePose(m);
        addP({ x: pz.x + (46 + U.rand(-20, 20)) * pz.s, y: pz.y - 110 * pz.s, vx: U.rand(-10, 10), vy: -50, life: 1.3, max: 1.3, type: 'steam', size: 9 * pz.s, color: 'rgba(255,255,255,.55)' });
      }
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
    for (const m of G.mates) {
      m.wiggle = Math.max(0, m.wiggle - dt * 2);
      if (m.bombT < 1) m.bombT = Math.min(1, m.bombT + dt * 3);
    }
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
      if (G.endT <= 0 && !G.mates.some((m) => m.trip)) { MP.ui.goSummary(summary()); return; }
    }
    updateTrips(dt);
    updateCustomers(dt);
    updateParticles(dt);
  }

  function summary() {
    const s = G.stats;
    const net = s.earned - s.fines;
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

  function mateAt(x, y) {
    for (const m of G.mates) {
      const p = mpos(m);
      const r = 175 * p.s + 20;
      const dx = x - p.x, dy = y - (p.y - 40 * p.s);
      if (dx * dx + dy * dy < r * r && y < 950 && y > 540) return m;
    }
    return null;
  }

  function chipRects() {
    const out = [];
    let items = [];
    let kioscoKind = null;
    if (G.tool === 'yerba') {
      items = Eco.unlockedYerbas(G.day).map((k) => ({ id: k, label: D.YERBAS[k].name, n: G.run.inv.yerba[k] || 0, sel: G.brand === k, col: D.YERBAS[k].pack }));
      if ((G.run.inv.yerba[G.brand] || 0) <= 0) kioscoKind = 'yerba';
    } else if (G.tool === 'yuyo' && G.yuyoSel) {
      items = Eco.unlockedYuyos(G.day).map((k) => ({ id: k, label: D.YUYOS[k].name, n: G.run.inv.yuyo[k] || 0, sel: G.yuyoSel === k, col: D.YUYOS[k].col }));
      if ((G.run.inv.yuyo[G.yuyoSel] || 0) <= 0) kioscoKind = 'yuyo';
    } else if (G.tool === 'azucar' && (G.run.inv.azucar || 0) <= 0) {
      kioscoKind = 'azucar';
    } else return out;
    const all = items.slice();
    if (kioscoKind) all.push({ id: 'kiosco', kind: kioscoKind, label: 'Kiosco ' + U.money(kioscoPrice(kioscoKind)), kiosco: true });
    if (!all.length) return out;
    const gap = 8, w = Math.min(170, (W - 32 - gap * (all.length - 1)) / all.length);
    let x = (W - (w * all.length + gap * (all.length - 1))) / 2;
    for (const it of all) { out.push(Object.assign({ x, y: 1036, w, h: 52 }, it)); x += w + gap; }
    return out;
  }

  function down(x, y) {
    if (!G) return;
    if (G.intro) {
      if ((G.t2 || 0) > 0.4 && (Gx.hit(INTRO_BTN, x, y) || y > 1000)) { G.intro = false; Sfx.bell(); }
      return;
    }
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
    for (const ch of chipRects()) {
      if (!Gx.hit(ch, x, y)) continue;
      Sfx.click();
      if (ch.kiosco) kiosco(ch.kind);
      else if (G.tool === 'yerba') G.brand = ch.id;
      else if (G.tool === 'yuyo') G.yuyoSel = ch.id;
      return;
    }
    if (Gx.hit(BTN.vaciar, x, y)) return vaciar();
    if (Gx.hit(BTN.tomo, x, y)) return drinkSelf();
    if (Gx.hit(BTN.fuego, x, y)) return toggleFire();
    if (G.pava.electric) {
      if (Gx.hit(BTN.menos, x, y)) { G.pava.target = Math.max(60, G.pava.target - 2); Sfx.click(); return; }
      if (Gx.hit(BTN.mas, x, y)) { G.pava.target = Math.min(96, G.pava.target + 2); Sfx.click(); return; }
    }
    if (G.pava.boiled && Gx.hit(BTN.agua, x, y)) return changeWater();
    for (const k of Object.keys(PLATES)) {
      const p = PLATES[k];
      if (food(k) > 0 && Math.abs(x - p.x) < 58 && Math.abs(y - p.y) < 34) return giveSnack(k);
    }
    if (x > 470 && x < 660 && y > 740 && y < 940) return toggleFire();
    const c = custAt(x, y);
    if (c) {
      if (c.state === 'leaving' && c.challengeT > 0) return challenge(c);
      if (c.state === 'waiting') return serve(c);
      if (c.state === 'chat') { say(c, 'Ya tomé, ¡esperá!', 1.2); return; }
      return;
    }
    const m = mateAt(x, y);
    if (m) {
      const p = mpos(m);
      return toolOnMate(m, U.clamp(x, p.x - 80 * p.s, p.x + 80 * p.s));
    }
  }

  function challenge(c) {
    c.challengeT = 0;
    stopPour();
    Sfx.silenceLoops();
    const kinds = ['ppt'];
    if (G.day >= 3) kinds.push('pulseada');
    if (G.day >= 4) kinds.push('truco');
    const kind = U.pick(kinds);
    const stake = Math.round((G.price * 1.2) / 10) * 10;
    say(c, U.pick(D.LINES.challenge), 1.5);
    c.leaveT = 99;
    MP.ui.startChallenge({
      kind, persona: c.p, stake,
      onDone: (win) => {
        if (win) { G.stats.challengesWon++; addMoney(stake, c.x, c.baseY - 260, 'Desafío'); say(c, 'Bueno... ganaste. Tomá la propina.', 2); setMood(c, 'sad', 2); }
        else { G.stats.challengesLost++; addMoney(-stake, c.x, c.baseY - 260, 'Desafío'); say(c, '¡Ja! ¡Pagá, pagá!', 2); setMood(c, 'happy', 2); }
        c.leaveT = 1.6;
      },
    });
  }

  function move(x) {
    if (!G) return;
    const idx = G.pouring >= 0 ? G.pouring : G.yerbaPouring;
    if (idx >= 0) { const p = mpos(G.mates[idx]); G.pourX = U.clamp(x, p.x - 80 * p.s, p.x + 80 * p.s); }
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
    if (k === 'm' || k === 'Tab') { G.sel = (G.sel + 1) % G.mates.length; return; }
    if (k === ' ' && G.pouring < 0 && G.yerbaPouring < 0) {
      const m = selMate(), p = mpos(m);
      toolOnMate(m, G.tool === 'yerba' ? p.x - 20 * p.s : p.x + 46 * p.s);
    }
  }

  function blur() { if (G && !G.intro && !G.ending) { G.paused = true; stopPour(); } }

  // ------------------------------------------------------------------
  //                              DRAW
  // ------------------------------------------------------------------
  function hint() {
    const m = selMate(), p = G.pava;
    if (G.toast) return { text: G.toast.text, col: G.toast.col, warn: true };
    if (m.loc !== 'table') {
      const other = G.mates.find((q) => q !== m && q.loc === 'table');
      return other ? { text: 'Tocá el otro mate para trabajar con ese' } : { text: 'El mate está en la ronda... ¡vigilá la pava!' };
    }
    if (m.yerba < 0.2) {
      if (!Eco.unlockedYerbas(G.day).some((k) => (G.run.inv.yerba[k] || 0) > 0)) return { text: '¡Sin yerba! Elegí YERBA y comprá en el kiosco', target: 'yerba' };
      return { text: 'YERBA: mantené apretado sobre el mate (¾ está bien)', target: 'yerba' };
    }
    if (m.cebadas > 0 && m.fresh <= 0) return { text: 'Está lavado: tocá VACIAR y poné yerba nueva', target: 'vaciar' };
    if (!m.bombilla) return { text: 'Poné la BOMBILLA: tocá el mate', target: 'bombilla' };
    if (p.boiled) return { text: '¡Agua hervida! Tocá CAMBIAR AGUA', target: 'agua' };
    if (m.water < 0.05) {
      if (p.temp < 64 && !p.fire) return { text: p.electric ? 'ENCENDÉ la pava (elegí el corte con – y +)' : 'Prendé el FUEGO para calentar el agua', target: 'fuego' };
      if (p.temp < 64) return { text: 'Esperá que se caliente el agua... (mirá el termómetro)' };
      return { text: 'PAVA: mantené apretado en el hueco, al lado de la bombilla', target: 'pava' };
    }
    if (m.first) return { text: 'El primero es del cebador: tocá ME LO TOMO YO', target: 'tomo' };
    return { text: 'Tocá a quien está esperando para pasarle el mate', target: 'cliente' };
  }

  function hintTargetPos(tg) {
    const ti = TOOLS.findIndex((q) => q.id === tg);
    if (ti >= 0) {
      if (G.tool === tg) { const p = mpos(selMate()); return { x: p.x, y: p.y - 270 * p.s }; }
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

  function fit(ctx, s, maxW) {
    while (ctx.measureText(s).width > maxW && s.length > 4) s = s.slice(0, -2) + '…';
    return s;
  }

  function drawOrderBubble(ctx, c, t) {
    const bw = G.nSeats === 2 ? 250 : 222;
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
    if (c.state !== 'waiting') {
      if (c.state === 'chat' && c.snack && !c.snackDone && food(c.snack) > 0) {
        const bx = c.x - 90, by = hy - 124;
        Gx.bubble(ctx, bx, by, 180, 52, c.x, hy - 58);
        text(ctx, '¿' + D.FOODS[c.snack].name.split(' ')[0] + '?', c.x, by + 26, { size: 21, font: U.FONT_B, weight: '900', color: '#6d4c2f' });
      }
      return;
    }
    const rows = [];
    rows.push(c.sweet ? { ic: 'sugar', t: 'Dulce' } : { ic: 'amargo', t: 'Amargo' });
    rows.push({ ic: 'temp', t: TEMP[c.temp].label, col: TEMP[c.temp].col });
    if (c.yuyo) rows.push({ ic: 'herb', t: 'Con ' + D.YUYOS[c.yuyo].name.toLowerCase(), col: '#2e7d32' });
    const extra = [];
    if (c.fav) extra.push((c.strict ? '¡Solo ' : '') + D.YERBAS[c.fav].name + (c.strict ? '!' : ''));
    if (c.snack && !c.snackDone && food(c.snack) > 0) extra.push('+ ' + D.FOODS[c.snack].name.split(' ')[0]);
    if (extra.length) rows.push({ ic: 'extra', t: extra.join(' · '), col: c.strict ? '#c0392b' : '#6d4c2f', small: true });
    const RH = 29;
    const h = 20 + rows.length * RH + 18;
    const bx = U.clamp(c.x - bw / 2, 6, W - bw - 6), by = hy - 72 - h;
    if (G.mates.some(mateReady)) {
      ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 6) * 0.3;
      ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 8;
      rr(ctx, bx - 5, by - 5, bw + 10, h + 10, 22); ctx.stroke();
      ctx.restore();
    }
    Gx.bubble(ctx, bx, by, bw, h, c.x, hy - 58);
    rows.forEach((r, i) => {
      const ry = by + 24 + i * RH, ix = bx + 24;
      if (r.ic === 'sugar') { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#7a7a7a'; ctx.lineWidth = 2; rr(ctx, ix - 9, ry - 9, 18, 18, 4); ctx.fill(); ctx.stroke(); }
      else if (r.ic === 'amargo') { Gx.leaf(ctx, ix - 10, ry + 5, 20, -0.6, '#2e7d32'); }
      else if (r.ic === 'temp') Gx.thermoIcon(ctx, ix, ry, 1, r.col);
      else if (r.ic === 'herb') { Gx.leaf(ctx, ix - 9, ry + 4, 16, -0.9, '#4caf50'); Gx.leaf(ctx, ix - 3, ry + 7, 14, -0.3, '#2e7d32'); }
      else if (r.ic === 'extra') { ctx.fillStyle = r.col; ctx.beginPath(); ctx.arc(ix, ry, 6, 0, U.TAU); ctx.fill(); }
      const fs = r.small ? 17 : 20;
      ctx.font = `900 ${fs}px ${U.FONT_B}`;
      text(ctx, fit(ctx, r.t, bw - 56), ix + 20, ry + 1, { size: fs, font: U.FONT_B, weight: '900', color: r.col || '#3b2412', align: 'left' });
    });
    const pr = U.clamp(c.patience / c.patMax, 0, 1);
    const px = bx + 14, py = by + h - 18, pw = bw - 28;
    rr(ctx, px, py, pw, 9, 5); ctx.fillStyle = '#e0d6c6'; ctx.fill();
    if (pr > 0) { rr(ctx, px, py, pw * pr, 9, 5); ctx.fillStyle = pr > 0.5 ? '#43a047' : pr > 0.25 ? '#f9a825' : '#e53935'; ctx.fill(); }
    if (c.p.pay && c.p.pay !== 1) text(ctx, '×' + String(c.p.pay).replace('.', ','), bx + bw - 24, by + 20, { size: 18, color: c.p.pay > 1 ? '#1d6b3a' : '#a12a1c' });
  }

  function drawToolbar(ctx) {
    ctx.save();
    const m = selMate();
    for (let i = 0; i < TOOLS.length; i++) {
      const id = TOOLS[i].id;
      const r = toolRect(i), sel = G.tool === id;
      const locked = id === 'yuyo' && !G.yuyoSel;
      const lift = sel ? -10 : 0;
      rr(ctx, r.x, r.y + 8, r.w, r.h, 22); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();
      rr(ctx, r.x, r.y + lift, r.w, r.h, 22);
      ctx.fillStyle = sel ? '#fff3c4' : '#f5e6c8'; ctx.fill();
      ctx.lineWidth = sel ? 6 : 3; ctx.strokeStyle = sel ? '#f4a300' : '#6d4c2f'; ctx.stroke();
      ctx.save(); if (locked) ctx.globalAlpha = 0.35;
      if (id === 'yerba') Gx.iconFor(ctx, 'yerba', r.x + r.w / 2, r.y + 62 + lift, 1.15, G.brand);
      else if (id === 'yuyo') Gx.iconFor(ctx, 'yuyoKind', r.x + r.w / 2, r.y + 62 + lift, 1.15, G.yuyoSel);
      else if (id === 'pava' && G.pava.electric) Gx.iconFor(ctx, 'electrica', r.x + r.w / 2, r.y + 56 + lift, 1.1);
      else if (id === 'bombilla') Gx.iconFor(ctx, 'bombillaKind', r.x + r.w / 2, r.y + 62 + lift, 1.15, G.run.equip.bombilla);
      else Gx.iconFor(ctx, id, r.x + r.w / 2, r.y + 62 + lift, id === 'pava' ? 1.05 : 1.15);
      ctx.restore();
      text(ctx, locked ? 'Día 2' : TOOLS[i].label, r.x + r.w / 2, r.y + r.h - 24 + lift, { size: 23, color: '#4e342e' });
      let n = null;
      if (id === 'yerba') n = G.run.inv.yerba[G.brand] || 0;
      if (id === 'azucar') n = G.run.inv.azucar || 0;
      if (id === 'yuyo' && G.yuyoSel) n = G.run.inv.yuyo[G.yuyoSel] || 0;
      if (n !== null) {
        rr(ctx, r.x + 6, r.y + 6 + lift, 40, 26, 13); ctx.fillStyle = n > 0 ? '#3e2723' : '#c62828'; ctx.fill();
        text(ctx, String(n), r.x + 26, r.y + 20 + lift, { size: 17, font: U.FONT_B, weight: '900', color: '#fff' });
      }
      const done = (id === 'azucar' && m.sugarNow) || (id === 'yuyo' && m.yuyo) || (id === 'bombilla' && m.bombilla) || (id === 'yerba' && m.yerba > 0.2);
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
    rr(ctx, 12, 14, 220, 58, 18); ctx.fillStyle = '#1d6b3a'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#e0b23a'; ctx.stroke();
    text(ctx, U.money(G.run.money), 122, 44, { size: Math.abs(G.run.money) >= 100000 ? 26 : 32, color: G.run.money < 0 ? '#ff8a80' : '#fff', stroke: '#0d3b1e', sw: 6 });
    const sec = Math.ceil(G.timeLeft);
    const tt = Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
    text(ctx, 'DÍA ' + G.day, 330, 24, { size: 20, color: '#f4c542' });
    text(ctx, tt, 330, 58, { size: 36, color: sec <= 10 && sec % 2 ? '#ff6b5b' : '#fff', stroke: '#2a1206', sw: 6 });
    const s = G.stats, net = s.earned - s.fines;
    const pr = U.clamp(net / G.meta, 0, 1);
    text(ctx, 'Meta ' + U.money(G.meta), 530, 26, { size: 20, color: '#f4c542' });
    rr(ctx, 430, 44, 200, 22, 11); ctx.fillStyle = '#1a0f07'; ctx.fill();
    if (pr > 0) { rr(ctx, 430, 44, 200 * pr, 22, 11); ctx.fillStyle = pr >= 1 ? '#7CFC8A' : '#f4c542'; ctx.fill(); }
    text(ctx, U.money(net), 530, 56, { size: 16, font: U.FONT_B, weight: '900', color: '#fff', stroke: '#000', sw: 3 });
    Gx.button(ctx, BTN.pausa, t);
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
        case 'steam': { const r = p.size * (1 + (1 - a) * 1.6); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, r, 0, U.TAU); ctx.fill(); break; }
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
        default: ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, U.TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  function mateView(m) {
    const sip = m.trip && m.trip.phase === 'drink' ? m.trip.sip || 0 : 0;
    return {
      yerba: m.yerba, freshR: U.clamp(m.fresh / Math.max(1, m.maxFresh), 0, 1), sweet: m.sweet, herb: !!m.yuyo,
      bombilla: m.bombilla, bombT: m.bombT, wiggle: m.wiggle, water: m.water * (1 - sip), overflow: m.overflow && m.loc === 'table',
      boiled: m.boiledW, alpaca: BK().alpaca, gold: BK().gold,
    };
  }

  function draw(ctx) {
    if (!G) return;
    const t = G.t + (G.t2 || 0);
    ctx.save();
    if (G.shake > 0) ctx.translate(U.rand(-1, 1) * G.shake * 22, U.rand(-1, 1) * G.shake * 22);

    MP.ui.drawWall(ctx);
    for (const c of G.seats) if (c) Gx.drawPerson(ctx, c, t);
    MP.ui.drawTable(ctx);

    // panadería en la mesa
    for (const k of Object.keys(PLATES)) {
      const n = food(k);
      if (n <= 0) continue;
      const p = PLATES[k];
      Gx.drawPlate(ctx, p.x, p.y, 0.85, k, n);
      const wanted = G.seats.some((c) => c && c.snack === k && !c.snackDone && (c.state === 'waiting' || c.state === 'chat'));
      ctx.save();
      if (wanted) { ctx.globalAlpha = 0.75 + Math.sin(t * 6) * 0.25; }
      rr(ctx, p.x - 26, p.y + 14, 52, 22, 11); ctx.fillStyle = wanted ? '#e65100' : 'rgba(30,15,5,.75)'; ctx.fill();
      ctx.restore();
      text(ctx, String(n), p.x, p.y + 25, { size: 16, font: U.FONT_B, weight: '900', color: '#fff' });
    }

    for (const m of G.mates) {
      if (m.overflow && m.loc === 'table') {
        const p = mpos(m);
        ctx.fillStyle = 'rgba(90,110,40,.45)';
        ctx.beginPath(); ctx.ellipse(p.x + 70 * p.s, p.y + 128 * p.s, 90 * p.s, 16 * p.s, 0, 0, U.TAU); ctx.fill();
      }
    }

    // pava
    const pv = G.pava;
    Gx.drawThermo(ctx, THERMO.x, THERMO.top, THERMO.bot, pv.temp, t);
    if (pv.electric) {
      if (G.pouring < 0) Gx.drawElectric(ctx, PAVA.x, PAVA.y + 10, 0.85, pv.fire, t, pv.target);
      else { rr(ctx, PAVA.x - 68, PAVA.y + 44, 136, 18, 9); ctx.fillStyle = '#2b2b2b'; ctx.fill(); }
    } else {
      Gx.drawHornalla(ctx, HORNALLA.x, HORNALLA.y, pv.fire, t);
      if (G.pouring < 0) Gx.drawPava(ctx, PAVA.x, PAVA.y, 0.74, 0, t, { rattle: pv.temp >= 96 });
    }
    const tc = pv.temp;
    const tcol = pv.boiled || tc > 90 ? '#ff5252' : tc >= 84 ? '#ffb74d' : tc >= 72 ? '#69f0ae' : tc >= 64 ? '#81d4fa' : '#fff';
    rr(ctx, PAVA.x - 40, 684, 80, 44, 14); ctx.fillStyle = 'rgba(30,15,5,.75)'; ctx.fill();
    text(ctx, Math.round(tc) + '°', PAVA.x, 707, { size: 30, color: tcol, stroke: '#000', sw: 4 });
    if (pv.electric) {
      Gx.button(ctx, BTN.menos, t); Gx.button(ctx, BTN.mas, t);
      text(ctx, 'Corte ' + pv.target + '°', PAVA.x, 650, { size: 22, color: '#4fc3f7', stroke: '#0b2533', sw: 5 });
    }
    if (G.gasT > 0) text(ctx, (pv.electric ? 'SIN LUZ ' : 'SIN GAS ') + Math.ceil(G.gasT), HORNALLA.x, HORNALLA.y + 32, { size: 22, color: '#ff8a65', stroke: '#000', sw: 4 });
    if (pv.boiled) Gx.button(ctx, Object.assign({ pulse: true }, BTN.agua), t);

    const sm = selMate();
    Gx.button(ctx, Object.assign({}, BTN.vaciar, { disabled: sm.yerba < 0.01 || sm.loc !== 'table' }), t);
    Gx.button(ctx, Object.assign({}, BTN.tomo, { disabled: !mateReady(sm), pulse: mateReady(sm) && sm.first }), t);
    const fireLabel = pv.electric ? (pv.fire ? 'Apagar pava' : 'Encender pava') : pv.fire ? 'Apagar fuego' : 'Prender fuego';
    Gx.button(ctx, Object.assign({}, BTN.fuego, { label: fireLabel, color: pv.fire ? '#e65100' : '#1e63b5', disabled: G.gasT > 0 }), t);

    // mates
    for (const m of G.mates) {
      const p = mpos(m);
      if (G.mates.length > 1 && G.sel === m.i && m.loc === 'table') {
        ctx.save(); ctx.globalAlpha = 0.55 + Math.sin(t * 4) * 0.2; ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.ellipse(p.x, p.y + 118 * p.s, 120 * p.s, 26 * p.s, 0, 0, U.TAU); ctx.stroke(); ctx.restore();
      }
      if (G.tool === 'pava' && m.loc === 'table' && m.bombilla && G.pouring < 0 && m.water < 0.9) {
        ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 5) * 0.3; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.ellipse(p.x + 46 * p.s, mouthY(m) + 2, 40 * p.s, 14 * p.s, 0, 0, U.TAU); ctx.stroke(); ctx.restore();
      }
      const pz = matePose(m);
      const mv = mateView(m);
      if (m.trip && !m.trip.self && m.trip.phase === 'drink') {
        Gx.drawMate(ctx, pz.x, pz.y, pz.s, mv, t, { noShadow: true, kind: m.kind });
        ctx.fillStyle = m.trip.c.p.skin;
        ctx.beginPath(); ctx.ellipse(pz.x + 44 * pz.s * 1.2, pz.y + 10, 16, 20, 0, 0, U.TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 2; ctx.stroke();
      } else {
        ctx.save(); ctx.globalAlpha = pz.a;
        Gx.drawMate(ctx, pz.x, pz.y, pz.s, mv, t, { kind: m.kind, noShadow: !!m.trip });
        ctx.restore();
      }
      if (m.yerba > 0.2 && m.loc === 'table') {
        const tags = [];
        if (m.brand) tags.push(D.YERBAS[m.brand].name);
        tags.push(m.fresh <= 0 ? 'LAVADO' : Math.max(0, Math.ceil(m.fresh)) + ' ceb.');
        tags.push(m.sweet ? 'Dulce' : 'Amargo');
        if (m.yuyo) tags.push(D.YUYOS[m.yuyo].name);
        const s = tags.join(' · ');
        ctx.font = `900 16px ${U.FONT_B}`;
        const tw = Math.min(ctx.measureText(s).width + 20, G.mates.length > 1 ? 218 : 400);
        const ty = p.y + 124 * p.s + 14;
        rr(ctx, p.x - tw / 2, ty - 13, tw, 26, 13);
        ctx.fillStyle = m.fresh <= 0 ? 'rgba(160,30,20,.9)' : 'rgba(30,15,5,.8)'; ctx.fill();
        text(ctx, fit(ctx, s, tw - 16), p.x, ty, { size: 16, font: U.FONT_B, weight: '900', color: m.sugarNow ? '#fff59d' : '#fff4d6' });
      }
    }
    if (G.spoon > 0) {
      const m = G.mates[G.spoonM || 0] || G.mates[0], p = mpos(m);
      const k = 1 - G.spoon;
      ctx.save(); ctx.translate(p.x - 30 * p.s, mouthY(m) - 70 + Math.sin(k * Math.PI) * 30); ctx.rotate(-0.6 + k * 1.2);
      ctx.strokeStyle = '#b0b7be'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(70, -40); ctx.stroke();
      ctx.fillStyle = '#c9d0d6'; ctx.beginPath(); ctx.ellipse(-6, 4, 14, 9, -0.5, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-6, 0, 10, 5, -0.5, 0, U.TAU); ctx.fill();
      ctx.restore();
    }

    for (const c of G.seats) if (c) drawOrderBubble(ctx, c, t);
    for (const c of G.seats) {
      if (!c || c.state !== 'leaving' || c.challengeT <= 0) continue;
      Gx.button(ctx, { x: c.x - 100, y: c.baseY - 60, w: 200, h: 58, label: '¡Desafialo!', color: '#c62828', size: 26, pulse: true }, t);
      rr(ctx, c.x - 90, c.baseY + 4, 180 * (c.challengeT / 4.5), 6, 3); ctx.fillStyle = '#ffeb3b'; ctx.fill();
    }

    if (G.pouring >= 0) {
      const m = G.mates[G.pouring], my = mouthY(m);
      const tipY = my - 120;
      const tipX = G.pourXs + 8;
      if (pv.electric) {
        ctx.save(); ctx.translate(tipX - 80, tipY + 46); ctx.rotate(0.45);
        Gx.drawElectric(ctx, 0, 0, 0.7, pv.fire, t, pv.target);
        ctx.restore();
      } else {
        const tilt = 0.62, s = 0.8;
        const tipLocal = Gx.pavaTip(0, 0, s, tilt);
        Gx.drawPava(ctx, tipX - tipLocal[0], tipY - tipLocal[1], s, tilt, t, {});
      }
      ctx.save(); ctx.lineCap = 'round';
      const wob = Math.sin(t * 30) * 2;
      ctx.strokeStyle = 'rgba(170,215,255,.85)'; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.quadraticCurveTo(tipX + 6 + wob, (tipY + my) / 2, G.pourXs, my); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(tipX - 2, tipY); ctx.quadraticCurveTo(tipX + 3 - wob, (tipY + my) / 2, G.pourXs - 2, my); ctx.stroke();
      ctx.restore();
      if (G.pourXs < mpos(m).x) text(ctx, '¡Ojo! Lavás la montañita', U.clamp(mpos(m).x, 170, 550), my - 170, { size: 22, color: '#ffcc80', stroke: '#3b1d0e', sw: 5 });
    }
    if (G.yerbaPouring >= 0) {
      const m = G.mates[G.yerbaPouring];
      ctx.save(); ctx.translate(G.pourXs + 10, mouthY(m) - 205); ctx.rotate(2.6 + Math.sin(t * 20) * 0.05);
      Gx.iconFor(ctx, 'yerba', 0, 0, 1.6, m.brand);
      ctx.restore();
    }

    drawParticles(ctx);
    for (const f of G.floats) {
      const a = U.clamp((f.life / f.max) * 2, 0, 1);
      ctx.save(); ctx.globalAlpha = a;
      const sc = 1 + Math.max(0, f.life - f.max + 0.2) * 2;
      text(ctx, f.text, U.clamp(f.x, 130, W - 130), f.y, { size: f.size * sc, color: f.col, stroke: '#2a1206', sw: 6 });
      ctx.restore();
    }

    const chips = chipRects();
    if (chips.length && !G.toast) {
      for (const ch of chips) {
        rr(ctx, ch.x, ch.y, ch.w, ch.h, 14);
        ctx.fillStyle = ch.kiosco ? '#e65100' : ch.sel ? '#fff3c4' : 'rgba(30,15,5,.85)'; ctx.fill();
        if (ch.sel) { ctx.lineWidth = 4; ctx.strokeStyle = '#f4a300'; ctx.stroke(); }
        if (!ch.kiosco) { ctx.fillStyle = ch.col; ctx.beginPath(); ctx.arc(ch.x + 16, ch.y + 26, 7, 0, U.TAU); ctx.fill(); }
        const col = ch.kiosco ? '#fff' : ch.n === 0 ? '#ff8a80' : ch.sel ? '#3b2412' : '#fff4d6';
        ctx.font = `900 17px ${U.FONT_B}`;
        const lb = fit(ctx, ch.kiosco ? ch.label : ch.label + ' ' + ch.n, ch.w - (ch.kiosco ? 12 : 34));
        text(ctx, lb, ch.x + (ch.kiosco ? ch.w / 2 : 28), ch.y + 27, { size: 17, font: U.FONT_B, weight: '900', color: col, align: ch.kiosco ? 'center' : 'left' });
      }
    } else {
      const h = hint();
      rr(ctx, 16, 1036, W - 32, 52, 16);
      ctx.fillStyle = h.warn ? 'rgba(120,20,10,.88)' : 'rgba(30,15,5,.78)'; ctx.fill();
      text(ctx, h.text, W / 2, 1062, { size: h.text.length > 48 ? 19 : 21, font: U.FONT_B, weight: '900', color: h.warn ? '#ffd3cc' : '#fff4d6' });
      if (!h.warn && h.target && (G.day <= 2 || G.t < 25) && !G.ending) {
        const tp = hintTargetPos(h.target);
        if (tp) drawArrow(ctx, tp.x, tp.y, t);
      }
    }
    drawToolbar(ctx);
    drawHUD(ctx, t);
    ctx.restore();

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

  function eventText() {
    switch (G.event) {
      case 'frio': return 'Hoy hace frío: todos lo quieren BIEN CALIENTE.';
      case 'calor': return '¡Qué calor! Hoy todos lo quieren TIBIO.';
      case 'gas': return G.pava.electric ? 'Dicen que hoy cortan la luz un rato... ojo.' : 'Dicen que hoy cortan el gas un rato... ojo.';
      case 'suegra': return 'Hoy viene la suegra. Exigente, pero paga doble.';
      case 'lluvia': return 'Llueve: la gente no tiene apuro (+30% paciencia).';
      case 'partido': return 'Hay partido: todos apurados, pero propinas +50%.';
      default: return 'Un día normal en la ronda. ¡Que no falte el mate!';
    }
  }

  function drawIntro(ctx, t) {
    ctx.save();
    ctx.fillStyle = 'rgba(20,10,4,.78)'; ctx.fillRect(0, 0, W, H);
    rr(ctx, 40, 130, W - 80, 1060, 34); ctx.fillStyle = '#fbf0d9'; ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = '#1d6b3a'; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = '#e0b23a'; rr(ctx, 54, 144, W - 108, 1032, 26); ctx.stroke();
    Gx.fileteTitle(ctx, 'DÍA ' + G.day, W / 2, 210, 72, t);
    const lines = [
      ['Meta de ganancia', U.money(G.meta)],
      ['Precio del mate', U.money(G.price)],
      ['Vidas', String(G.run.lives)],
    ];
    lines.forEach(([a, b], i) => {
      text(ctx, a, 96, 296 + i * 46, { size: 24, font: U.FONT_B, weight: '800', color: '#5d4037', align: 'left' });
      text(ctx, b, W - 96, 296 + i * 46, { size: 28, color: '#1d6b3a', align: 'right' });
    });
    let ev = G.day === 1 ? 'Primer día: prendé el fuego, poné yerba y la bombilla, y cebá en el hueco. ¡El primero es tuyo!' : eventText();
    const perks = Object.keys(D.FOODS).filter((k) => food(k) > 0).map((k) => D.FOODS[k].name.split(' ')[0].toLowerCase());
    if (perks.length) ev += ' En la mesa hay ' + perks.join(', ') + '.';
    ctx.font = `800 22px ${U.FONT_B}`;
    Gx.wrap(ctx, ev, W - 170).slice(0, 3).forEach((l, i) => text(ctx, l, W / 2, 448 + i * 30, { size: 22, font: U.FONT_B, weight: '800', color: '#3b2412' }));
    const un = G.unlocks.slice(0, 6);
    if (un.length) {
      rr(ctx, 80, 548, W - 160, 44, 22); ctx.fillStyle = '#c62828'; ctx.fill();
      text(ctx, '¡NUEVO HOY!', W / 2, 571, { size: 28, color: '#fff' });
      un.forEach((u, i) => {
        const y = 636 + i * 66;
        rr(ctx, 80, y - 28, 64, 56, 12); ctx.fillStyle = '#f0dfbd'; ctx.fill();
        if (u.icon === 'person') {
          ctx.save(); rr(ctx, 80, y - 28, 64, 56, 12); ctx.clip();
          ctx.translate(112, y + 10); ctx.scale(0.42, 0.42); ctx.translate(-112, -(y + 10));
          Gx.drawPerson(ctx, { p: u.persona, x: 112, baseY: y + 10 + 150, mood: 'happy', state: 'chat', phase: 0, blink: 0, anger: 0, talk: 0, lookX: 0 }, 0);
          ctx.restore();
        } else if (u.icon === 'star') {
          ctx.fillStyle = '#f4a300'; ctx.beginPath();
          for (let j = 0; j < 10; j++) { const r = j % 2 ? 9 : 20; const an = (j / 10) * U.TAU - Math.PI / 2; ctx.lineTo(112 + Math.cos(an) * r, y + Math.sin(an) * r); }
          ctx.closePath(); ctx.fill();
        } else Gx.iconFor(ctx, u.icon, 112, y, 0.62, u.extra);
        text(ctx, u.cat.toUpperCase(), 160, y - 12, { size: 15, font: U.FONT_B, weight: '900', color: '#c62828', align: 'left' });
        ctx.font = `24px ${U.FONT_D}`;
        text(ctx, fit(ctx, u.name, W - 260), 160, y + 14, { size: 24, color: '#3b2412', align: 'left' });
      });
    } else {
      text(ctx, 'Revisá el almacén: siempre hay algo para mejorar.', W / 2, 600, { size: 20, font: U.FONT_B, weight: '800', color: '#6d4c41' });
    }
    Gx.button(ctx, Object.assign({ pulse: true }, INTRO_BTN), t);
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
    consts: { W, H, SEAT_Y, THERMO, PAVA, HORNALLA },
  };
})();
