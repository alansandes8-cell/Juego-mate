/* Mate Perfecto — Truco argentino 1 contra 1, sin flor (partida a 15 o una sola mano) */
(function () {
  'use strict';
  const MP = window.MP;
  const U = MP.U, Gx = MP.G, Sfx = MP.Sfx;
  const { rr, text } = Gx;
  const W = 720, H = 1280;
  const YO = 0, EL = 1;

  // ---------------- cartas ----------------
  const SUITS = ['espada', 'basto', 'oro', 'copa'];
  const NUMS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  function rank(c) {
    if (c.n === 1 && c.s === 'espada') return 14;
    if (c.n === 1 && c.s === 'basto') return 13;
    if (c.n === 7 && c.s === 'espada') return 12;
    if (c.n === 7 && c.s === 'oro') return 11;
    if (c.n === 3) return 10;
    if (c.n === 2) return 9;
    if (c.n === 1) return 8;
    if (c.n === 12) return 7;
    if (c.n === 11) return 6;
    if (c.n === 10) return 5;
    if (c.n === 7) return 4;
    if (c.n === 6) return 3;
    if (c.n === 5) return 2;
    return 1;
  }
  const envVal = (c) => (c.n >= 10 ? 0 : c.n);
  function envido(hand) {
    let best = 0;
    for (let i = 0; i < hand.length; i++) {
      best = Math.max(best, envVal(hand[i]));
      for (let j = i + 1; j < hand.length; j++) if (hand[i].s === hand[j].s) best = Math.max(best, 20 + envVal(hand[i]) + envVal(hand[j]));
    }
    return best;
  }
  function deal() {
    const d = [];
    for (const s of SUITS) for (const n of NUMS) d.push({ n, s });
    for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
    return [d.slice(0, 3), d.slice(3, 6)];
  }

  // Ganador de la mano según las bazas (-1 = parda)
  function handWinner(bw, mano) {
    const w = [0, 0];
    for (const b of bw) if (b >= 0) w[b]++;
    if (w[0] >= 2) return 0;
    if (w[1] >= 2) return 1;
    if (bw.length >= 2) {
      if (bw[0] === -1 && bw[1] >= 0) return bw[1];
      if (bw[0] >= 0 && bw[1] === -1) return bw[0];
    }
    if (bw.length === 3) {
      if (bw[2] === -1) return bw[0] >= 0 ? bw[0] : mano;
      return bw[2];
    }
    return null;
  }

  // ---------------- estado ----------------
  let T = null;

  function start(opts) {
    T = {
      opts, persona: opts.persona, mode: opts.mode || 'game', target: opts.mode === 'hand' ? 99 : 15,
      pts: [0, 0], handPts: [0, 0], mano: Math.random() < 0.5 ? YO : EL, t: 0,
      msg: '', msgT: 0, bubble: null, bubbleT: 0, over: false, result: null, wait: 0, log: [],
      anim: [],
    };
    newHand();
  }

  function newHand() {
    const [a, b] = deal();
    T.h = {
      cards: [a, b], played: [[], []], baza: 0, leader: T.mano, turn: T.mano, bw: [],
      env: { state: 'none', chain: [], caller: null, resp: null },
      truco: { level: 1, pending: null, last: null },
      done: false, winner: null, resolveT: 0,
    };
    T.handStart = [T.pts[0], T.pts[1]];
    T.wait = 0.8;
    say(T.mano === YO ? 'Sos mano.' : 'Es mano ' + U.shortName(T.persona) + '.', 1.6, true);
  }

  function say(s, dur, isMsg) { if (isMsg) { T.msg = s; T.msgT = dur || 2; } else { T.bubble = s; T.bubbleT = dur || 1.8; } }
  const opp = (p) => 1 - p;
  const nameOf = (p) => (p === YO ? 'Vos' : U.shortName(T.persona));

  // ---------- envido ----------
  const ENV_V = { envido: 2, real: 3 };
  function faltaPts() { return Math.max(1, (T.mode === 'hand' ? 15 : T.target) - Math.max(T.pts[0], T.pts[1])); }
  function chainValue(chain) { return chain.reduce((a, c) => a + (c === 'falta' ? faltaPts() : ENV_V[c]), 0); }
  function envNoQuiero(chain) { return chain.length <= 1 ? 1 : chain.slice(0, -1).reduce((a, c) => a + (c === 'falta' ? faltaPts() : ENV_V[c]), 0); }
  function envRaises(chain) {
    const out = [];
    if (chain.includes('falta')) return out;
    const nEnv = chain.filter((c) => c === 'envido').length;
    if (!chain.includes('real') && nEnv < 2) out.push('envido');
    if (!chain.includes('real')) out.push('real');
    out.push('falta');
    return out;
  }
  function canCallEnvido(p) {
    const h = T.h;
    return h.baza === 0 && h.env.state === 'none' && h.played[p].length === 0 && h.truco.level === 1 && !h.done;
  }
  const ENV_LABEL = { envido: 'Envido', real: 'Real envido', falta: 'Falta envido' };

  function callEnvido(p, kind) {
    const h = T.h;
    h.env.state = 'pending'; h.env.chain.push(kind); h.env.caller = p;
    if (h.truco.pending) { h.env.suspendedTruco = h.truco.pending; h.truco.pending = null; }
    if (p === EL) say('¡' + ENV_LABEL[kind] + '!', 1.8); else say('Cantaste: ' + ENV_LABEL[kind], 1.4, true);
    Sfx.pop();
    if (p === YO) T.wait = 0.9;
  }

  function answerEnvido(p, ans) {
    const h = T.h, e = h.env;
    if (ans === 'no') {
      const pts = envNoQuiero(e.chain);
      addPts(e.caller, pts);
      if (p === EL) say('No quiero.', 1.6); else say('No quisiste el envido', 1.4, true);
      e.state = 'done';
    } else if (ans === 'si') {
      const pts = chainValue(e.chain);
      const v = [envido(h.cards[0].concat(h.played[0])), envido(h.cards[1].concat(h.played[1]))];
      let w = v[0] > v[1] ? YO : v[1] > v[0] ? EL : T.mano;
      addPts(w, pts);
      if (p === EL) say('¡Quiero!', 1.2);
      const first = T.mano, second = opp(T.mano);
      const firstSay = (first === YO ? 'Vos: ' : nameOf(EL) + ': ') + v[first];
      const secondSay = w === second ? (second === YO ? 'Vos: ' : nameOf(EL) + ': ') + v[second] + '. ¡Ganó!' : (second === YO ? 'Vos: son buenas' : nameOf(EL) + ': son buenas');
      say(firstSay + ' · ' + secondSay, 3.2, true);
      T.envReveal = { v, w, t: 3.2 };
      e.state = 'done';
      T.wait = 1.4;
    } else {
      callEnvido(p, ans);
      return;
    }
    if (e.suspendedTruco) { h.truco.pending = e.suspendedTruco; e.suspendedTruco = null; }
    checkGameOver();
  }

  // ---------- truco ----------
  const TRUCO_LABEL = { 2: '¡Truco!', 3: '¡Quiero retruco!', 4: '¡Quiero vale cuatro!' };
  function canCallTruco(p) {
    const h = T.h;
    return !h.done && !h.truco.pending && h.env.state !== 'pending' && h.truco.level < 4 && h.truco.last !== p;
  }
  function callTruco(p) {
    const h = T.h;
    h.truco.pending = { level: h.truco.level + 1, caller: p };
    if (p === EL) say(TRUCO_LABEL[h.truco.level + 1], 1.8); else say('Cantaste ' + TRUCO_LABEL[h.truco.level + 1].replace(/[¡!]/g, ''), 1.4, true);
    Sfx.pop();
    if (p === YO) T.wait = 0.9;
  }
  function answerTruco(p, ans) {
    const h = T.h, pend = h.truco.pending;
    if (ans === 'no') {
      if (p === EL) say('No quiero.', 1.6); else say('No quisiste: ' + nameOf(EL) + ' gana la mano', 1.6, true);
      h.truco.pending = null;
      endHand(pend.caller, h.truco.level);
      return;
    }
    if (ans === 'si') {
      h.truco.level = pend.level; h.truco.last = pend.caller; h.truco.pending = null;
      if (p === EL) say('¡Quiero!', 1.4); else say('Quisiste. Vale ' + h.truco.level, 1.2, true);
      Sfx.click();
      return;
    }
    if (ans === 'raise') {
      h.truco.level = pend.level; h.truco.last = pend.caller; h.truco.pending = null;
      callTruco(p);
      return;
    }
    if (ENV_V[ans] || ans === 'falta') { callEnvido(p, ans); }
  }

  function mazo(p) {
    const h = T.h;
    let pts = h.truco.pending ? h.truco.level : h.truco.level;
    if (h.baza === 0 && h.env.state === 'none' && h.played[p].length === 0) pts += 1; // envido no cantado
    if (p === YO) say('Te fuiste al mazo', 1.6, true); else say('Me voy al mazo.', 1.6);
    endHand(opp(p), pts);
  }

  function addPts(p, n) { T.pts[p] += n; T.handPts[p] += n; Sfx.tick(); }

  // ---------- jugar carta ----------
  function playCard(p, idx) {
    const h = T.h;
    const card = h.cards[p].splice(idx, 1)[0];
    h.played[p].push(card);
    T.anim.push({ p, baza: h.baza, t: 0 });
    Sfx.whoosh();
    const other = opp(p);
    if (h.played[other].length > h.baza) {
      // los dos jugaron esta baza
      const a = h.played[0][h.baza], b = h.played[1][h.baza];
      const ra = rank(a), rb = rank(b);
      const w = ra > rb ? YO : rb > ra ? EL : -1;
      h.bw.push(w);
      const hw = handWinner(h.bw, T.mano);
      if (hw !== null) { T.wait = 0.9; h.pendingEnd = hw; return; }
      h.baza++;
      h.turn = w === -1 ? h.leader : w;
      h.leader = h.turn;
      T.wait = 0.8;
    } else {
      h.turn = other;
      if (other === EL) T.wait = 0.7;
    }
  }

  function endHand(w, pts) {
    const h = T.h;
    if (h.done) return;
    h.done = true; h.winner = w;
    addPts(w, pts);
    h.resolveT = 2.2;
    say((w === YO ? '¡Ganaste la mano! +' : nameOf(EL) + ' ganó la mano. +') + pts, 2.2, true);
    if (w === YO) Sfx.yay(); else Sfx.fail();
    checkGameOver();
  }

  function checkGameOver() {
    if (T.mode === 'game') {
      if (T.pts[0] >= T.target || T.pts[1] >= T.target) finish(T.pts[0] >= T.target ? YO : EL);
    }
  }

  function finish(w) {
    if (T.over) return;
    T.over = true; T.result = w === YO;
    T.overT = 0;
    if (T.result) Sfx.yay(); else Sfx.fail();
  }

  // ---------------- IA ----------------
  function aiWinChance() {
    const h = T.h;
    const mine = h.cards[EL].map(rank);
    let base = mine.length ? mine.reduce((a, b) => a + b, 0) / (mine.length * 14) : 0;
    const won = h.bw.filter((b) => b === EL).length, lost = h.bw.filter((b) => b === YO).length;
    base += won * 0.25 - lost * 0.3;
    if (h.played[YO].length > h.baza) {
      const theirs = rank(h.played[YO][h.baza]);
      if (mine.some((r) => r > theirs)) base += 0.2; else base -= 0.25;
    }
    if (mine.includes(14) || mine.includes(13)) base += 0.15;
    return U.clamp(base, 0, 1);
  }

  function aiAct() {
    const h = T.h;
    const myEnv = envido(h.cards[EL].concat(h.played[EL]));
    // responder envido
    if (h.env.state === 'pending' && h.env.caller === YO) {
      const val = chainValue(h.env.chain);
      const need = 25 + (val >= 5 ? 3 : 0) + (h.env.chain.includes('falta') ? 4 : 0);
      const raises = envRaises(h.env.chain);
      if (myEnv >= 31 && raises.length && Math.random() < 0.6) return answerEnvido(EL, raises.includes('real') ? 'real' : raises[raises.length - 1]);
      if (myEnv >= need || Math.random() < 0.08) return answerEnvido(EL, 'si');
      return answerEnvido(EL, 'no');
    }
    // responder truco
    if (h.truco.pending && h.truco.pending.caller === YO) {
      if (canCallEnvido(EL) && myEnv >= 28) return answerTruco(EL, myEnv >= 31 ? 'real' : 'envido');
      const p = aiWinChance();
      if (p > 0.72 && h.truco.pending.level < 4 && Math.random() < 0.6) return answerTruco(EL, 'raise');
      if (p > 0.45 || Math.random() < 0.12) return answerTruco(EL, 'si');
      return answerTruco(EL, 'no');
    }
    if (h.turn !== EL || h.done || h.pendingEnd != null) return;
    // cantar envido
    if (canCallEnvido(EL)) {
      if (myEnv >= 30 && Math.random() < 0.8) return callEnvido(EL, myEnv >= 32 && T.pts[1] < T.pts[0] ? 'falta' : 'real');
      if (myEnv >= 26 && Math.random() < 0.7) return callEnvido(EL, 'envido');
      if (Math.random() < 0.07) return callEnvido(EL, 'envido');
    }
    // cantar truco
    if (canCallTruco(EL)) {
      const p = aiWinChance();
      if ((p > 0.68 && Math.random() < 0.55) || Math.random() < 0.05) return callTruco(EL);
    }
    // jugar carta
    const mine = h.cards[EL];
    const order = mine.map((c, i) => ({ i, r: rank(c) })).sort((a, b) => a.r - b.r);
    if (h.played[YO].length > h.baza) {
      const theirs = rank(h.played[YO][h.baza]);
      const win = order.find((o) => o.r > theirs);
      const tie = order.find((o) => o.r === theirs);
      if (win) return playCard(EL, win.i);
      if (tie && h.bw[0] === EL) return playCard(EL, tie.i);
      return playCard(EL, order[0].i);
    }
    if (h.baza === 0) return playCard(EL, order[Math.min(1, order.length - 1)].i);
    if (h.bw[0] === EL) return playCard(EL, order[0].i);
    return playCard(EL, order[order.length - 1].i);
  }

  // ---------------- update ----------------
  function update(dt) {
    if (!T) return;
    T.t += dt;
    if (T.msgT > 0) T.msgT -= dt;
    if (T.bubbleT > 0) { T.bubbleT -= dt; if (T.bubbleT <= 0) T.bubble = null; }
    for (const a of T.anim) a.t += dt;
    T.anim = T.anim.filter((a) => a.t < 0.5);
    if (T.envReveal) { T.envReveal.t -= dt; if (T.envReveal.t <= 0) T.envReveal = null; }
    if (T.over) { T.overT += dt; return; }
    const h = T.h;
    if (T.wait > 0) { T.wait -= dt; return; }
    if (h.pendingEnd != null && !h.done) { const w = h.pendingEnd; h.pendingEnd = null; endHand(w, h.truco.level); return; }
    if (h.done) {
      h.resolveT -= dt;
      if (h.resolveT <= 0 && !T.over) {
        if (T.mode === 'hand') { finish(T.handPts[0] > T.handPts[1] ? YO : T.handPts[1] > T.handPts[0] ? EL : YO); return; }
        T.mano = opp(T.mano);
        newHand();
      }
      return;
    }
    const needEl = (h.env.state === 'pending' && h.env.caller === YO) || (h.truco.pending && h.truco.pending.caller === YO) || (h.turn === EL && !h.truco.pending && h.env.state !== 'pending');
    if (needEl) { T.wait = 0.6 + Math.random() * 0.5; aiAct(); }
  }

  // ---------------- botones del jugador ----------------
  function actions() {
    const h = T.h;
    const out = [];
    if (T.over || h.done || T.wait > 0 || h.pendingEnd != null) return out;
    if (h.env.state === 'pending' && h.env.caller === EL) {
      out.push({ id: 'env-si', label: 'Quiero', color: '#2e7d32' }, { id: 'env-no', label: 'No quiero', color: '#c62828' });
      envRaises(h.env.chain).forEach((r) => out.push({ id: 'env-' + r, label: ENV_LABEL[r], color: '#1e63b5' }));
      return out;
    }
    if (h.truco.pending && h.truco.pending.caller === EL) {
      out.push({ id: 'tr-si', label: 'Quiero', color: '#2e7d32' }, { id: 'tr-no', label: 'No quiero', color: '#c62828' });
      if (h.truco.pending.level < 4) out.push({ id: 'tr-raise', label: h.truco.pending.level === 2 ? 'Retruco' : 'Vale cuatro', color: '#e65100' });
      if (canCallEnvido(YO)) out.push({ id: 'env-envido', label: 'Envido', color: '#1e63b5' });
      return out;
    }
    if (h.turn !== YO) return out;
    if (canCallEnvido(YO)) { out.push({ id: 'env-envido', label: 'Envido', color: '#1e63b5' }, { id: 'env-real', label: 'Real env.', color: '#1e63b5' }, { id: 'env-falta', label: 'Falta env.', color: '#1e63b5' }); }
    if (canCallTruco(YO)) out.push({ id: 'tr-call', label: h.truco.level === 1 ? 'Truco' : h.truco.level === 2 ? 'Retruco' : 'Vale cuatro', color: '#e65100' });
    out.push({ id: 'mazo', label: 'Al mazo', color: '#6d4c41' });
    return out;
  }

  function btnRects() {
    const a = actions();
    const rows = a.length > 3 ? 2 : 1;
    const perRow = Math.ceil(a.length / rows);
    const out = [];
    a.forEach((b, i) => {
      const r = Math.floor(i / perRow), c = i % perRow;
      const n = Math.min(perRow, a.length - r * perRow);
      const w = (W - 40 - (n - 1) * 10) / n;
      out.push(Object.assign({ x: 20 + c * (w + 10), y: 1112 + r * 74, w, h: 64, size: 24, r: 16 }, b));
    });
    return out;
  }

  const CARD_W = 150, CARD_H = 222;
  function myCardRect(i, n) {
    const gap = 18, tw = n * CARD_W + (n - 1) * gap;
    return { x: (W - tw) / 2 + i * (CARD_W + gap), y: 870, w: CARD_W, h: CARD_H };
  }

  function down(x, y) {
    if (!T) return;
    if (T.over) {
      if (T.overT > 1 && Gx.hit({ x: 190, y: 820, w: 340, h: 90 }, x, y)) { const r = T.result; const cb = T.opts.onDone; T = null; cb(r); }
      return;
    }
    for (const b of btnRects()) {
      if (!Gx.hit(b, x, y)) continue;
      Sfx.click();
      const h = T.h;
      if (b.id === 'mazo') return mazo(YO);
      if (b.id === 'tr-call') return callTruco(YO);
      if (b.id === 'tr-si') return answerTruco(YO, 'si');
      if (b.id === 'tr-no') return answerTruco(YO, 'no');
      if (b.id === 'tr-raise') return answerTruco(YO, 'raise');
      if (b.id === 'env-si') return answerEnvido(YO, 'si');
      if (b.id === 'env-no') return answerEnvido(YO, 'no');
      if (b.id.startsWith('env-')) {
        const k = b.id.slice(4);
        if (h.env.state === 'pending') return answerEnvido(YO, k);
        return callEnvido(YO, k);
      }
    }
    const h = T.h;
    if (h.turn === YO && !h.done && !h.truco.pending && h.env.state !== 'pending' && T.wait <= 0 && h.pendingEnd == null) {
      const n = h.cards[YO].length;
      for (let i = 0; i < n; i++) if (Gx.hit(myCardRect(i, n), x, y)) return playCard(YO, i);
    }
  }

  // ---------------- dibujo ----------------
  function suitIcon(ctx, s, x, y, k) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    if (s === 'oro') {
      ctx.fillStyle = '#f4c542'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, U.TAU); ctx.fill();
      ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, U.TAU); ctx.stroke();
      ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, U.TAU); ctx.fill();
    } else if (s === 'copa') {
      ctx.fillStyle = '#e53935';
      ctx.beginPath(); ctx.moveTo(-18, -18); ctx.quadraticCurveTo(-18, 6, 0, 8); ctx.quadraticCurveTo(18, 6, 18, -18); ctx.closePath(); ctx.fill();
      ctx.fillRect(-3, 6, 6, 12); ctx.fillRect(-12, 16, 24, 5);
      ctx.fillStyle = '#f4c542'; ctx.fillRect(-18, -20, 36, 5);
    } else if (s === 'espada') {
      ctx.rotate(-0.6);
      ctx.fillStyle = '#5c7cfa'; ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(5, 8); ctx.lineTo(-5, 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f4c542'; ctx.fillRect(-12, 8, 24, 5);
      ctx.fillStyle = '#c0392b'; ctx.fillRect(-3, 13, 6, 12);
    } else {
      ctx.rotate(0.6);
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath(); ctx.moveTo(-5, 24); ctx.lineTo(-8, -10); ctx.quadraticCurveTo(0, -30, 8, -10); ctx.lineTo(5, 24); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1b5e20'; ctx.beginPath(); ctx.arc(-5, -4, 3, 0, U.TAU); ctx.arc(4, 6, 3, 0, U.TAU); ctx.fill();
    }
    ctx.restore();
  }

  function drawCard(ctx, c, x, y, w, h, faceUp, hl) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.3)'; rr(ctx, x + 3, y + 5, w, h, 12); ctx.fill();
    rr(ctx, x, y, w, h, 12);
    if (!faceUp) {
      ctx.fillStyle = '#8e2c2c'; ctx.fill();
      ctx.strokeStyle = '#f4e3c1'; ctx.lineWidth = 4; ctx.stroke();
      ctx.save(); rr(ctx, x + 8, y + 8, w - 16, h - 16, 8); ctx.clip();
      ctx.strokeStyle = 'rgba(244,227,193,.35)'; ctx.lineWidth = 2;
      for (let i = -h; i < w + h; i += 12) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + h, y + h); ctx.stroke(); }
      ctx.restore();
      ctx.restore(); return;
    }
    ctx.fillStyle = '#fffdf6'; ctx.fill();
    ctx.lineWidth = hl ? 5 : 2.5; ctx.strokeStyle = hl ? '#f4a300' : '#6d4c2f'; ctx.stroke();
    const k = w / 150;
    const col = { oro: '#b8860b', copa: '#c62828', espada: '#1e3a8a', basto: '#2e7d32' }[c.s];
    text(ctx, String(c.n), x + 22 * k, y + 28 * k, { size: 34 * k, color: col });
    text(ctx, String(c.n), x + w - 22 * k, y + h - 26 * k, { size: 34 * k, color: col });
    suitIcon(ctx, c.s, x + w / 2, y + h / 2, 1.9 * k);
    if (c.n >= 10) text(ctx, c.n === 10 ? 'SOTA' : c.n === 11 ? 'CABALLO' : 'REY', x + w / 2, y + h - 30 * k, { size: 16 * k, font: U.FONT_B, weight: '900', color: col });
    ctx.restore();
  }

  function fosforos(ctx, x, y, n, t) {
    for (let g = 0; g < 3; g++) {
      const gx = x + g * 62, gy = y;
      const k = U.clamp(n - g * 5, 0, 5);
      const seg = [[0, 0, 40, 0], [40, 0, 40, 40], [40, 40, 0, 40], [0, 40, 0, 0], [0, 0, 40, 40]];
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (const [a, b, c, d] of seg) { ctx.beginPath(); ctx.moveTo(gx + a, gy + b); ctx.lineTo(gx + c, gy + d); ctx.stroke(); }
      for (let i = 0; i < k; i++) {
        const [a, b, c, d] = seg[i];
        ctx.strokeStyle = '#f2e3c6'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(gx + a, gy + b); ctx.lineTo(gx + c, gy + d); ctx.stroke();
        ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.arc(gx + c, gy + d, 4.5, 0, U.TAU); ctx.fill();
      }
    }
  }

  function draw(ctx) {
    if (!T) return;
    const t = T.t, h = T.h;
    // paño
    const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 800);
    g.addColorStop(0, '#2e7d4f'); g.addColorStop(1, '#14462b');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#6d4426'; ctx.lineWidth = 18; ctx.strokeRect(9, 9, W - 18, H - 18);
    ctx.strokeStyle = '#e0b23a'; ctx.lineWidth = 3; ctx.strokeRect(22, 22, W - 44, H - 44);

    // rival
    const c = { p: T.persona, x: 160, baseY: 330, state: 'chat', mood: T.bubble ? 'happy' : 'neutral', phase: 1, blink: 0, anger: 0, talk: T.bubbleT > 0 ? 1 : 0, lookX: 0.5 };
    if (T.over) c.mood = T.result ? 'sad' : 'love';
    ctx.save(); ctx.translate(160, 300); ctx.scale(0.8, 0.8); ctx.translate(-160, -300);
    Gx.drawPerson(ctx, c, t);
    ctx.restore();
    if (T.bubble) {
      Gx.bubble(ctx, 250, 70, 300, 70, 220, 160, { color: '#fffaf0' });
      text(ctx, T.bubble, 400, 106, { size: 28, color: '#3b2412' });
    }
    // marcador
    rr(ctx, 400, 160, 296, 186, 18); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();
    text(ctx, T.mode === 'hand' ? 'Una mano' : 'A 15 sin flor', 548, 184, { size: 20, color: '#ffd54f' });
    text(ctx, nameOf(EL), 420, 214, { size: 21, color: '#fff', align: 'left' });
    text(ctx, String(T.pts[1]), 676, 214, { size: 26, color: '#fff', align: 'right' });
    text(ctx, 'Vos', 420, 284, { size: 21, color: '#fff', align: 'left' });
    text(ctx, String(T.pts[0]), 676, 284, { size: 26, color: '#fff', align: 'right' });
    if (T.mode === 'game') {
      ctx.save(); ctx.translate(424, 232); ctx.scale(0.5, 0.5); fosforos(ctx, 0, 0, T.pts[1], t); ctx.restore();
      ctx.save(); ctx.translate(424, 302); ctx.scale(0.5, 0.5); fosforos(ctx, 0, 0, T.pts[0], t); ctx.restore();
    }
    // apuesta
    text(ctx, (T.mode === 'hand' ? 'Desafío: ' : 'Apuesta: ') + U.money(T.opts.stake), 160, 378, { size: 22, color: '#ffd54f', stroke: '#0b2a19', sw: 5 });

    // cartas del rival
    const nOpp = h.cards[EL].length;
    for (let i = 0; i < nOpp; i++) drawCard(ctx, null, 420 + i * 58, 360, 74, 110, false);

    // bazas jugadas
    for (let b = 0; b < 3; b++) {
      const bx = 130 + b * 230;
      const cE = h.played[EL][b], cY = h.played[YO][b];
      if (!cE && !cY) {
        ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]);
        rr(ctx, bx - 55, 500, 110, 162, 12); ctx.stroke(); ctx.setLineDash([]);
      }
      const an = (p) => { const a = T.anim.find((q) => q.p === p && q.baza === b); return a ? U.easeOut(a.t / 0.5) : 1; };
      if (cE) { const k = an(EL); drawCard(ctx, cE, bx - 55 + 30, U.lerp(380, 480, k), 110, 162, true, h.bw[b] === EL); }
      if (cY) { const k = an(YO); drawCard(ctx, cY, bx - 55 - 20, U.lerp(880, 560, k), 110, 162, true, h.bw[b] === YO); }
      if (h.bw[b] === -1) text(ctx, 'PARDA', bx, 740, { size: 22, color: '#ffd54f', stroke: '#000', sw: 4 });
    }

    // mensaje
    if (T.msgT > 0) {
      ctx.save(); ctx.globalAlpha = U.clamp(T.msgT * 2, 0, 1);
      ctx.font = `900 24px ${U.FONT_B}`;
      const lines = Gx.wrap(ctx, T.msg, W - 80);
      rr(ctx, 30, 772, W - 60, 22 + lines.length * 30, 16); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fill();
      lines.forEach((l, i) => text(ctx, l, W / 2, 790 + i * 30, { size: 24, font: U.FONT_B, weight: '900', color: '#fff' }));
      ctx.restore();
    } else if (!h.done && !T.over) {
      const st = h.truco.pending || h.env.state === 'pending' ? (h.truco.pending && h.truco.pending.caller === EL) || (h.env.state === 'pending' && h.env.caller === EL) ? 'Respondé' : 'Esperando respuesta...' : h.turn === YO ? 'Tu turno: tocá una carta' : 'Juega ' + nameOf(EL) + '...';
      text(ctx, st + (h.truco.level > 1 ? '  ·  Vale ' + h.truco.level : ''), W / 2, 800, { size: 24, font: U.FONT_B, weight: '900', color: '#fff4d6' });
    }
    // envido de cada uno (ayuda)
    const myEnv = envido(h.cards[YO].concat(h.played[YO]));
    if (h.baza === 0 && h.env.state !== 'done') text(ctx, 'Tenés ' + myEnv + ' de envido', W / 2, 846, { size: 20, font: U.FONT_B, weight: '800', color: '#b9f6ca' });

    // mis cartas
    const n = h.cards[YO].length;
    const canPlay = h.turn === YO && !h.done && !h.truco.pending && h.env.state !== 'pending' && T.wait <= 0;
    for (let i = 0; i < n; i++) {
      const r = myCardRect(i, n);
      const lift = canPlay ? Math.sin(t * 3 + i) * 3 : 0;
      drawCard(ctx, h.cards[YO][i], r.x, r.y + lift, r.w, r.h, true, canPlay);
    }
    for (const b of btnRects()) Gx.button(ctx, b, t);

    if (T.over) {
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
      rr(ctx, 70, 400, W - 140, 540, 30); ctx.fillStyle = '#fbf0d9'; ctx.fill();
      ctx.lineWidth = 8; ctx.strokeStyle = T.result ? '#1d6b3a' : '#a12a1c'; ctx.stroke();
      Gx.fileteTitle(ctx, T.result ? '¡Ganaste!' : 'Perdiste...', W / 2, 490, 64, t);
      text(ctx, 'Vos ' + T.pts[0] + ' — ' + T.pts[1] + ' ' + nameOf(EL), W / 2, 580, { size: 32, color: '#3b2412' });
      const prize = T.mode === 'game' ? (T.result ? '+' + U.money(T.opts.stake * 2) : '-' + U.money(T.opts.stake)) : (T.result ? '+' + U.money(T.opts.stake) : '-' + U.money(T.opts.stake));
      text(ctx, prize, W / 2, 660, { size: 52, color: T.result ? '#1d6b3a' : '#a12a1c' });
      text(ctx, T.result ? '¡Qué truquero!' : '¡A practicar en el club!', W / 2, 730, { size: 24, font: U.FONT_B, weight: '800', color: '#5d4037' });
      if (T.overT > 1) Gx.button(ctx, { x: 190, y: 820, w: 340, h: 90, label: 'Volver', color: '#2e7d32', size: 36, pulse: true }, t);
    }
  }

  MP.Truco = { start, update, draw, down, _test: { rank, envido, handWinner } };
})();
