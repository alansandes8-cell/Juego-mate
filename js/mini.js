/* Mate Perfecto — desafíos: piedra, papel o tijera y pulseada */
(function () {
  'use strict';
  const MP = window.MP;
  const U = MP.U, Gx = MP.G, Sfx = MP.Sfx;
  const { rr, text } = Gx;
  const W = 720, H = 1280;

  let M = null;
  const NAMES = { piedra: 'Piedra', papel: 'Papel', tijera: 'Tijera' };
  const BEATS = { piedra: 'tijera', papel: 'piedra', tijera: 'papel' };
  const PPT_BTNS = ['piedra', 'papel', 'tijera'].map((id, i) => ({ id, x: 40 + i * 220, y: 960, w: 200, h: 200 }));

  function start(opts) {
    M = { opts, kind: opts.kind, t: 0, over: false, result: null, overT: 0 };
    if (M.kind === 'ppt') Object.assign(M, { score: [0, 0], round: null, phase: 'pick', revealT: 0 });
    if (M.kind === 'pulseada') Object.assign(M, { pos: 0, phase: 'count', countT: 3, timeLeft: 12, aiPow: 0.9 + Math.random() * 0.35 + Math.min(0.4, (opts.day || 1) * 0.03), taps: 0, pulse: 0 });
  }

  function finish(win) { M.over = true; M.result = win; M.overT = 0; if (win) Sfx.yay(); else Sfx.fail(); }

  function update(dt) {
    if (!M) return;
    M.t += dt;
    if (M.over) { M.overT += dt; return; }
    if (M.kind === 'ppt' && M.phase === 'reveal') {
      M.revealT -= dt;
      if (M.revealT <= 0) {
        if (M.score[0] >= 2 || M.score[1] >= 2) finish(M.score[0] >= 2);
        else { M.phase = 'pick'; M.round = null; }
      }
    }
    if (M.kind === 'pulseada') {
      M.pulse = Math.max(0, M.pulse - dt * 4);
      if (M.phase === 'count') { M.countT -= dt; if (M.countT <= 0) { M.phase = 'go'; Sfx.bell(); } return; }
      M.timeLeft -= dt;
      // el rival empuja con fuerza que crece cuando está perdiendo
      const push = M.aiPow * (0.07 + (M.pos > 0 ? M.pos * 0.05 : 0)) * (0.8 + Math.sin(M.t * 7) * 0.3);
      M.pos -= push * dt * 2.2;
      M.pos = U.clamp(M.pos, -1, 1);
      if (M.pos >= 1) finish(true);
      else if (M.pos <= -1) finish(false);
      else if (M.timeLeft <= 0) finish(M.pos > 0);
    }
  }

  function down(x, y) {
    if (!M) return;
    if (M.over) {
      if (M.overT > 0.8 && Gx.hit({ x: 190, y: 820, w: 340, h: 90 }, x, y)) { const r = M.result, cb = M.opts.onDone; M = null; cb(r); }
      return;
    }
    if (M.kind === 'ppt' && M.phase === 'pick') {
      for (const b of PPT_BTNS) {
        if (!Gx.hit(b, x, y)) continue;
        const ai = U.pick(['piedra', 'papel', 'tijera']);
        const w = b.id === ai ? -1 : BEATS[b.id] === ai ? 0 : 1;
        if (w >= 0) M.score[w]++;
        M.round = { me: b.id, ai, w };
        M.phase = 'reveal'; M.revealT = 1.8;
        Sfx.pop();
        if (w === 0) Sfx.cash(); else if (w === 1) Sfx.tick();
        return;
      }
    }
    if (M.kind === 'pulseada' && M.phase === 'go') {
      M.pos = U.clamp(M.pos + 0.06, -1, 1);
      M.taps++; M.pulse = 1;
      Sfx.tick();
    }
  }

  // ---------------- dibujo ----------------
  function hand(ctx, kind, x, y, s, flip) {
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
    const skin = '#f0c19a', line = '#8a5a3a';
    ctx.fillStyle = skin; ctx.strokeStyle = line; ctx.lineWidth = 4;
    if (kind === 'piedra') {
      rr(ctx, -50, -40, 100, 80, 34); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-30 + i * 25, -38); ctx.lineTo(-30 + i * 25, -10); ctx.stroke(); }
      rr(ctx, -64, -10, 34, 26, 13); ctx.fill(); ctx.stroke();
    } else if (kind === 'papel') {
      rr(ctx, -44, -20, 88, 70, 24); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 4; i++) { rr(ctx, -42 + i * 22, -78 + Math.abs(i - 1.5) * 8, 18, 70, 9); ctx.fill(); ctx.stroke(); }
      rr(ctx, -78, -4, 40, 20, 10); ctx.fill(); ctx.stroke();
    } else {
      rr(ctx, -44, -10, 88, 60, 24); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.rotate(-0.25); rr(ctx, -36, -86, 18, 82, 9); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.rotate(0.25); rr(ctx, 14, -86, 18, 82, 9); ctx.fill(); ctx.stroke(); ctx.restore();
      rr(ctx, -6, -18, 46, 24, 12); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  function drawRival(ctx, mood, talk) {
    const c = { p: M.opts.persona, x: 360, baseY: 470, state: 'chat', mood, phase: 1, blink: 0, anger: mood === 'angry' ? 0.6 : 0, talk, lookX: 0 };
    Gx.drawPerson(ctx, c, M.t);
  }

  function bg(ctx, title) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#5a2e14'); g.addColorStop(1, '#2a160a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.04)';
    for (let i = 0; i < W; i += 48) ctx.fillRect(i, 0, 20, H);
    Gx.fileteTitle(ctx, title, W / 2, 80, 56, M.t);
    text(ctx, 'Desafío contra ' + M.opts.persona.name + ' · ' + U.money(M.opts.stake), W / 2, 146, { size: 22, font: U.FONT_B, weight: '900', color: '#ffd54f' });
  }

  function drawPPT(ctx) {
    bg(ctx, 'Piedra, papel o tijera');
    drawRival(ctx, M.round ? (M.round.w === 1 ? 'happy' : M.round.w === 0 ? 'angry' : 'neutral') : 'impatient', M.phase === 'pick' ? 0 : 0.3);
    // mesa
    ctx.fillStyle = '#8a5530'; ctx.fillRect(0, 470, W, 470);
    ctx.fillStyle = '#b77b45'; ctx.fillRect(0, 470, W, 14);
    text(ctx, 'Al mejor de 3', W / 2, 520, { size: 26, color: '#fff3b0', stroke: '#3b1d0e', sw: 6 });
    text(ctx, 'Vos ' + M.score[0] + '  —  ' + M.score[1] + ' ' + U.shortName(M.opts.persona), W / 2, 570, { size: 34, color: '#fff', stroke: '#3b1d0e', sw: 7 });
    if (M.phase === 'reveal' && M.round) {
      const k = U.clamp((1.8 - M.revealT) * 4, 0, 1);
      hand(ctx, M.round.ai, 200, 720 - (1 - k) * 60, 1.2, true);
      hand(ctx, M.round.me, 520, 720 + (1 - k) * 60, 1.2, false);
      text(ctx, NAMES[M.round.ai], 200, 830, { size: 26, color: '#fff' });
      text(ctx, NAMES[M.round.me], 520, 830, { size: 26, color: '#fff' });
      const res = M.round.w === -1 ? '¡Empate!' : M.round.w === 0 ? '¡Ganaste la ronda!' : 'Perdiste la ronda';
      text(ctx, res, W / 2, 890, { size: 34, color: M.round.w === 0 ? '#7CFC8A' : M.round.w === 1 ? '#ff8a80' : '#ffd54f', stroke: '#000', sw: 6 });
    } else {
      const bounce = Math.abs(Math.sin(M.t * 6)) * 20;
      hand(ctx, 'piedra', 200, 700 - bounce, 1.1, true);
      hand(ctx, 'piedra', 520, 700 - bounce, 1.1, false);
      text(ctx, '¡Elegí!', W / 2, 870, { size: 34, color: '#fff3b0', stroke: '#3b1d0e', sw: 6 });
    }
    for (const b of PPT_BTNS) {
      const dis = M.phase !== 'pick';
      rr(ctx, b.x, b.y + 6, b.w, b.h, 26); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();
      rr(ctx, b.x, b.y, b.w, b.h, 26); ctx.fillStyle = dis ? '#cfc6b6' : '#fbf0d9'; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = '#6d4c2f'; ctx.stroke();
      hand(ctx, b.id, b.x + b.w / 2, b.y + 92, 0.8, false);
      text(ctx, NAMES[b.id], b.x + b.w / 2, b.y + b.h - 26, { size: 26, color: '#4e342e' });
    }
  }

  function drawPulseada(ctx) {
    bg(ctx, 'Pulseada');
    drawRival(ctx, M.pos < -0.3 ? 'happy' : M.pos > 0.3 ? 'angry' : 'impatient', 0);
    ctx.fillStyle = '#8a5530'; ctx.fillRect(0, 470, W, 470);
    ctx.fillStyle = '#b77b45'; ctx.fillRect(0, 470, W, 14);
    // brazos
    const ang = -M.pos * 1.1;
    const cx = W / 2, cy = 820;
    ctx.save(); ctx.translate(cx, cy);
    // codos
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 40, 140, 20, 0, 0, U.TAU); ctx.fill();
    ctx.rotate(ang);
    ctx.lineCap = 'round';
    ctx.strokeStyle = M.opts.persona.skin; ctx.lineWidth = 46;
    ctx.beginPath(); ctx.moveTo(-120, 40); ctx.lineTo(0, -150); ctx.stroke();
    ctx.strokeStyle = '#f0c19a'; ctx.lineWidth = 46;
    ctx.beginPath(); ctx.moveTo(120, 40); ctx.lineTo(0, -150); ctx.stroke();
    ctx.fillStyle = '#e8b48a'; ctx.beginPath(); ctx.arc(0, -160, 40, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
    text(ctx, U.shortName(M.opts.persona), 150, 900, { size: 24, color: '#fff' });
    text(ctx, 'Vos', 570, 900, { size: 24, color: '#fff' });
    // barra
    rr(ctx, 60, 540, W - 120, 30, 15); ctx.fillStyle = '#1a0f07'; ctx.fill();
    const mid = W / 2, half = (W - 120) / 2;
    ctx.fillStyle = M.pos >= 0 ? '#43a047' : '#e53935';
    const bw = half * Math.abs(M.pos);
    rr(ctx, M.pos >= 0 ? mid : mid - bw, 544, bw, 22, 11); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(mid - 2, 536, 4, 38);
    if (M.phase === 'count') {
      text(ctx, String(Math.ceil(M.countT)), W / 2, 680, { size: 120, color: '#fff3b0', stroke: '#3b1d0e', sw: 12 });
      text(ctx, '¡Tocá la pantalla lo más rápido que puedas!', W / 2, 1000, { size: 24, font: U.FONT_B, weight: '900', color: '#fff' });
    } else {
      text(ctx, Math.ceil(M.timeLeft) + ' s', W / 2, 610, { size: 28, color: '#fff' });
      const s = 1 + M.pulse * 0.08;
      ctx.save(); ctx.translate(W / 2, 1060); ctx.scale(s, s);
      rr(ctx, -200, -70, 400, 140, 40); ctx.fillStyle = '#c62828'; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = '#7f1d1d'; ctx.stroke();
      text(ctx, '¡FUERZA!', 0, 0, { size: 56, color: '#fff', stroke: '#7f1d1d', sw: 8 });
      ctx.restore();
    }
  }

  function draw(ctx) {
    if (!M) return;
    if (M.kind === 'ppt') drawPPT(ctx); else drawPulseada(ctx);
    if (M.over) {
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
      rr(ctx, 70, 400, W - 140, 540, 30); ctx.fillStyle = '#fbf0d9'; ctx.fill();
      ctx.lineWidth = 8; ctx.strokeStyle = M.result ? '#1d6b3a' : '#a12a1c'; ctx.stroke();
      Gx.fileteTitle(ctx, M.result ? '¡Ganaste!' : 'Perdiste...', W / 2, 500, 64, M.t);
      text(ctx, (M.result ? '+' : '-') + U.money(M.opts.stake), W / 2, 620, { size: 56, color: M.result ? '#1d6b3a' : '#a12a1c' });
      text(ctx, M.result ? 'Se fue sin chistar.' : 'Se fue riéndose...', W / 2, 700, { size: 26, font: U.FONT_B, weight: '800', color: '#5d4037' });
      if (M.overT > 0.8) Gx.button(ctx, { x: 190, y: 820, w: 340, h: 90, label: 'Volver', color: '#2e7d32', size: 36, pulse: true }, M.t);
    }
  }

  MP.Mini = { start, update, draw, down };
})();
