/* Mate Perfecto — El almacén: kit inicial, reposición, equipo y premium */
(function () {
  'use strict';
  const MP = window.MP;
  const U = MP.U, Gx = MP.G, D = MP.DATA, Sfx = MP.Sfx, Eco = MP.Eco;
  const { rr, text } = Gx;
  const W = 720;

  const TABS = [
    { id: 'almacen', label: 'Almacén' },
    { id: 'pana', label: 'Yuyos y pan' },
    { id: 'mates', label: 'Mates' },
    { id: 'equipo', label: 'Equipo' },
    { id: 'premium', label: 'Premium' },
  ];

  let S = null;

  function open(run, mode, onDone, tab) {
    S = { run, mode, onDone, tab: tab || 'almacen', t: 0, msg: null };
  }

  const pday = () => (S.mode === 'start' ? 1 : S.run.day + 1);
  const price = (base) => Eco.price(base, pday());
  const locked = (def) => def.minDay > pday();

  function cards() {
    const run = S.run, out = [];
    const tab = S.tab;
    if (tab === 'almacen') {
      Object.entries(D.YERBAS).forEach(([id, d]) => out.push({ kind: 'yerba', id, d, icon: 'yerba', extra: id, name: 'Yerba ' + d.name, desc: d.desc, stock: (run.inv.yerba[id] || 0) + ' cargas', price: price(d.price), unit: '+' + d.cargas }));
      out.push({ kind: 'azucar', id: 'azucar', d: D.SUGAR, icon: 'azucar', name: D.SUGAR.name, desc: D.SUGAR.desc, stock: (run.inv.azucar || 0) + ' cucharadas', price: price(D.SUGAR.price), unit: '+' + D.SUGAR.usos });
    } else if (tab === 'pana') {
      Object.entries(D.YUYOS).forEach(([id, d]) => out.push({ kind: 'yuyo', id, d, icon: 'yuyoKind', extra: id, name: d.name, desc: d.desc, stock: (run.inv.yuyo[id] || 0) + ' usos', price: price(d.price), unit: '+' + d.usos }));
      Object.entries(D.FOODS).forEach(([id, d]) => out.push({ kind: 'food', id, d, icon: 'food', extra: id, name: d.name, desc: d.desc, stock: (run.inv.food[id] || 0) + ' en la mesa', price: price(d.price), unit: '+12' }));
    } else if (tab === 'mates') {
      Object.entries(D.MATES).forEach(([id, d]) => out.push({ kind: 'mate', id, d, icon: 'mateKind', extra: id, name: d.name, desc: d.desc, owned: !!run.own.mates[id], price: price(d.price) }));
    } else if (tab === 'equipo') {
      Object.entries(D.BOMBILLAS).forEach(([id, d]) => out.push({ kind: 'bombilla', id, d, icon: 'bombillaKind', extra: id, name: d.name, desc: d.desc, owned: !!run.own.bombillas[id], price: price(d.price) }));
      Object.entries(D.EQUIPO).forEach(([id, d]) => out.push({ kind: 'equipo', id, d, icon: id === 'termo' ? 'termo' : id, name: d.name, desc: d.desc, owned: !!run.own[id], price: price(d.price) }));
    } else if (tab === 'premium') {
      out.push({ kind: 'reward', id: 'reward', icon: 'tv', name: 'Ver un anuncio', desc: 'Mirá un anuncio cortito y ganá 1 vida. Una vez por día.', done: run.rewardDay === run.day });
      D.PREMIUM.forEach((p) => out.push({ kind: 'premium', id: p.id, d: p, icon: p.id === 'vidas3' ? 'vida' : p.id === 'bolsa' ? 'plata' : 'tv', name: p.name, desc: p.desc, priceLabel: MP.Pay.priceLabel(p), owned: p.id === 'sinads' && run.adsOff }));
      out.push({ kind: 'restore', id: 'restore', icon: 'plata', name: 'Restaurar compras', desc: '¿Compraste "Sin publicidad" en otro teléfono? Recuperalo acá.' });
    }
    const gap = 8, h = out.length > 7 ? 92 : 102;
    out.forEach((c, i) => Object.assign(c, { x: 24, y: 236 + i * (h + gap), w: W - 48, h }));
    return out;
  }

  function cardButtons(c) {
    const run = S.run;
    const bx = c.x + c.w - 150, by = c.y + (c.h - 56) / 2;
    if (c.d && c.d.minDay && locked(c.d)) return [{ id: 'locked', x: bx, y: by, w: 136, h: 56, label: 'Día ' + c.d.minDay, color: '#8d8d8d', size: 22, disabled: true }];
    if (c.kind === 'reward') return [{ id: 'reward', x: bx, y: by, w: 136, h: 56, label: c.done ? 'Mañana' : 'Ver', color: '#1e63b5', size: 24, disabled: c.done }];
    if (c.kind === 'restore') return [{ id: 'restore', x: bx, y: by, w: 136, h: 56, label: 'Restaurar', color: '#455a64', size: 20 }];
    if (c.kind === 'premium') return [{ id: 'premium', x: bx, y: by, w: 136, h: 56, label: c.owned ? '¡Listo!' : c.priceLabel, color: c.owned ? '#2e7d32' : '#7b1fa2', size: 20, disabled: c.owned }];
    if (c.kind === 'mate' && c.owned) {
      const b = [];
      const isMain = run.equip.mates[0] === c.id, isSec = run.equip.mates[1] === c.id;
      b.push({ id: 'main', x: c.x + c.w - (run.own.segundo ? 232 : 150), y: by, w: run.own.segundo ? 140 : 136, h: 56, label: isMain ? 'En uso' : 'Usar', color: isMain ? '#2e7d32' : '#e2a93b', size: 22 });
      if (run.own.segundo) b.push({ id: 'sec', x: c.x + c.w - 84, y: by, w: 72, h: 56, label: isSec ? '2° ✓' : '2°', color: isSec ? '#2e7d32' : '#6d4c41', size: 20 });
      return b;
    }
    if (c.kind === 'bombilla' && c.owned) {
      const on = run.equip.bombilla === c.id;
      return [{ id: 'usebomb', x: bx, y: by, w: 136, h: 56, label: on ? 'En uso' : 'Usar', color: on ? '#2e7d32' : '#e2a93b', size: 22 }];
    }
    if (c.kind === 'equipo' && c.owned) return [{ id: 'done', x: bx, y: by, w: 136, h: 56, label: '¡Listo!', color: '#2e7d32', size: 22, disabled: true }];
    const can = run.money >= c.price;
    return [{ id: 'buy', x: bx, y: by, w: 136, h: 56, label: U.money(c.price), color: can ? '#e2a93b' : '#9c9c9c', size: c.price >= 10000 ? 18 : 22 }];
  }

  function msg(s, col) { S.msg = { text: s, col: col || '#fff', t: S.t }; }

  function buy(c) {
    const run = S.run;
    if (run.money < c.price) { msg('¡No te alcanza, che!', '#ff8a80'); Sfx.fail(); return; }
    if (c.kind === 'equipo' && c.id === 'segundo' && Object.keys(run.own.mates).length < 2) { msg('Primero comprá un segundo mate', '#ffcc80'); Sfx.fail(); return; }
    run.money -= c.price;
    switch (c.kind) {
      case 'yerba': run.inv.yerba[c.id] = (run.inv.yerba[c.id] || 0) + c.d.cargas; break;
      case 'azucar': run.inv.azucar = (run.inv.azucar || 0) + D.SUGAR.usos; break;
      case 'yuyo': run.inv.yuyo[c.id] = (run.inv.yuyo[c.id] || 0) + c.d.usos; break;
      case 'food': run.inv.food[c.id] = (run.inv.food[c.id] || 0) + c.d.units; break;
      case 'mate':
        run.own.mates[c.id] = true;
        if (!run.equip.mates[0]) run.equip.mates[0] = c.id;
        else if (run.own.segundo && !run.equip.mates[1]) run.equip.mates[1] = c.id;
        break;
      case 'bombilla': run.own.bombillas[c.id] = true; if (!run.equip.bombilla || D.BOMBILLAS[c.id].price > D.BOMBILLAS[run.equip.bombilla].price) run.equip.bombilla = c.id; break;
      case 'equipo':
        run.own[c.id] = true;
        if (c.id === 'segundo' && !run.equip.mates[1]) run.equip.mates[1] = Object.keys(run.own.mates).find((k) => k !== run.equip.mates[0]) || null;
        break;
    }
    msg('¡Compraste ' + c.name + '!', '#7CFC8A');
    Sfx.cash();
  }

  function kitSugerido() {
    const run = S.run;
    const list = [
      () => !run.own.mates.calabaza && buy(cards0('mates', 'calabaza')),
      () => !run.own.bombillas.acero && buy(cards0('equipo', 'acero')),
      () => buy(cards0('almacen', 'tarague')),
      () => buy(cards0('almacen', 'rosamundo')),
      () => buy(cards0('almacen', 'tarague')),
      () => buy(cards0('almacen', 'azucar')),
    ];
    list.forEach((f) => f());
    msg('Kit armado: calabaza, bombilla, 3 yerbas y azúcar', '#7CFC8A');
  }
  function cards0(tab, id) { const prev = S.tab; S.tab = tab; const c = cards().find((q) => q.id === id); S.tab = prev; return c; }

  const MAIN_BTN = { x: 150, y: 1150, w: 420, h: 96, color: '#2e7d32', size: 36 };
  const KIT_BTN = { x: 470, y: 1086, w: 226, h: 50, label: 'Kit sugerido', color: '#1e63b5', size: 22, r: 14 };

  function tabRects() {
    const tabs = TABS;
    const w = (W - 48 - (tabs.length - 1) * 6) / tabs.length;
    return tabs.map((tb, i) => Object.assign({ x: 24 + i * (w + 6), y: 166, w, h: 56 }, tb));
  }

  function update(dt) { if (S) S.t += dt; }

  function draw(ctx) {
    if (!S) return;
    const run = S.run, t = S.t;
    MP.ui.drawBackdrop(ctx, 0.7);
    Gx.fileteTitle(ctx, S.mode === 'start' ? 'Armá tu equipo' : 'El almacén', W / 2, 58, 50, t);
    text(ctx, 'Tenés ' + U.money(run.money) + '   ·   Vidas ' + run.lives, W / 2, 124, { size: 30, color: '#7CFC8A', stroke: '#0d3b1e', sw: 7 });
    for (const tb of tabRects()) {
      const sel = S.tab === tb.id;
      rr(ctx, tb.x, tb.y, tb.w, tb.h, 14); ctx.fillStyle = sel ? '#fbf0d9' : tb.id === 'premium' ? '#6a1b9a' : '#4a2c17'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = sel ? '#e0b23a' : '#2a170b'; ctx.stroke();
      text(ctx, tb.label, tb.x + tb.w / 2, tb.y + tb.h / 2, { size: tb.label.length > 9 ? 18 : 21, color: sel ? '#3b2412' : '#fff4d6' });
    }
    for (const c of cards()) {
      const lk = c.d && c.d.minDay && locked(c.d);
      const owned = c.owned || (c.kind === 'mate' && run.equip.mates.includes(c.id));
      rr(ctx, c.x, c.y + 5, c.w, c.h, 18); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fill();
      rr(ctx, c.x, c.y, c.w, c.h, 18); ctx.fillStyle = lk ? '#cfc6b6' : owned ? '#dcedc8' : c.kind === 'premium' || c.kind === 'reward' || c.kind === 'restore' ? '#f3e5f5' : '#fbf0d9'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = owned ? '#2e7d32' : '#8d6e63'; ctx.stroke();
      rr(ctx, c.x + 10, c.y + 10, c.h - 20, c.h - 20, 14); ctx.fillStyle = '#f0dfbd'; ctx.fill();
      ctx.save(); if (lk) ctx.globalAlpha = 0.45;
      const ic = c.icon === 'mateKind' ? 1.05 : c.icon === 'electrica' ? 0.8 : c.icon === 'segundo' ? 0.9 : 0.75;
      Gx.iconFor(ctx, c.icon, c.x + c.h / 2, c.y + c.h / 2, ic * (c.h / 102), c.extra);
      ctx.restore();
      const tx = c.x + c.h + 6;
      const btns = cardButtons(c);
      const textW = btns[0].x - tx - 10;
      ctx.font = `23px ${U.FONT_D}`;
      let nm = c.name; while (ctx.measureText(nm).width > textW && nm.length > 4) nm = nm.slice(0, -2) + '…';
      text(ctx, nm, tx, c.y + 24, { size: 23, color: '#3b2412', align: 'left' });
      ctx.font = `700 16px ${U.FONT_B}`;
      Gx.wrap(ctx, c.desc, textW).slice(0, 2).forEach((l, j) => text(ctx, l, tx, c.y + 50 + j * 19, { size: 16, font: U.FONT_B, weight: '700', color: '#5d4037', align: 'left' }));
      if (c.stock) text(ctx, 'Tenés: ' + c.stock + (c.unit ? '   (' + c.unit + ' por compra)' : ''), tx, c.y + c.h - 14, { size: 14, font: U.FONT_B, weight: '900', color: '#1d6b3a', align: 'left' });
      for (const b of btns) Gx.button(ctx, b, t);
    }
    // pie
    if (S.mode === 'start') {
      const r = Eco.ready(run);
      const chk = (ok, s) => (ok ? '✓ ' : '✗ ') + s;
      text(ctx, 'Necesitás: ' + [chk(r.mate, 'mate'), chk(r.bombilla, 'bombilla'), chk(r.yerba, 'yerba')].join('   '), 30, 1111, { size: 21, font: U.FONT_B, weight: '900', color: Eco.canStart(run) ? '#7CFC8A' : '#ffcc80', align: 'left' });
      Gx.button(ctx, KIT_BTN, t);
    } else {
      const low = [];
      if (!Object.values(run.inv.yerba).some((n) => n > 0)) low.push('yerba');
      if ((run.inv.azucar || 0) < 5) low.push('azúcar');
      text(ctx, low.length ? '¡Ojo! Te falta ' + low.join(' y ') + ' para mañana' : 'Mañana: más clientes, más inflación... ¡y novedades!', W / 2, 1111, { size: 21, font: U.FONT_B, weight: '900', color: low.length ? '#ffcc80' : '#fff4d6' });
    }
    const label = S.mode === 'start' ? '¡Abrir la ronda!' : S.mode === 'fail' ? 'Volver' : '¡A cebar!';
    const sub = S.mode === 'day' ? 'Día ' + (run.day + 1) : null;
    Gx.button(ctx, Object.assign({}, MAIN_BTN, { label, sub, disabled: S.mode === 'start' && !Eco.canStart(run), pulse: true }), t);
    if (S.msg && S.t - S.msg.t < 2.2) {
      ctx.save(); ctx.globalAlpha = U.clamp((2.2 - (S.t - S.msg.t)) * 2, 0, 1);
      rr(ctx, 60, 1020, W - 120, 52, 16); ctx.fillStyle = 'rgba(0,0,0,.8)'; ctx.fill();
      text(ctx, S.msg.text, W / 2, 1046, { size: 22, font: U.FONT_B, weight: '900', color: S.msg.col });
      ctx.restore();
    }
  }

  function down(x, y) {
    if (!S) return;
    const run = S.run;
    for (const tb of tabRects()) if (Gx.hit(tb, x, y)) { S.tab = tb.id; Sfx.click(); return; }
    for (const c of cards()) {
      for (const b of cardButtons(c)) {
        if (!Gx.hit(b, x, y)) continue;
        if (b.disabled) { if (b.id === 'locked') msg('Se desbloquea el día ' + c.d.minDay, '#ffcc80'); return; }
        Sfx.click();
        if (b.id === 'buy') return buy(c);
        if (b.id === 'main') {
          if (run.equip.mates[1] === c.id) run.equip.mates[1] = run.equip.mates[0];
          run.equip.mates[0] = c.id;
          if (run.equip.mates[1] === c.id) run.equip.mates[1] = null;
          return msg('Ahora usás: ' + c.name, '#7CFC8A');
        }
        if (b.id === 'sec') {
          if (run.equip.mates[0] === c.id) return msg('Ese ya es tu mate principal', '#ffcc80');
          run.equip.mates[1] = run.equip.mates[1] === c.id ? null : c.id;
          return msg(run.equip.mates[1] ? 'Segundo mate: ' + c.name : 'Sacaste el segundo mate', '#7CFC8A');
        }
        if (b.id === 'usebomb') { run.equip.bombilla = c.id; return msg('Ahora usás: ' + c.name, '#7CFC8A'); }
        if (b.id === 'reward') {
          MP.Ads.rewarded('vida-extra', () => { run.lives++; run.rewardDay = run.day; msg('¡+1 vida!', '#7CFC8A'); Sfx.yay(); });
          return;
        }
        if (b.id === 'restore') {
          MP.Pay.restore((ok) => { if (ok && localStorage.getItem('mp_adsoff')) run.adsOff = true; msg(ok ? 'Compras restauradas' : 'No hay compras para restaurar', ok ? '#7CFC8A' : '#ffcc80'); MP.ui.saveRun(); });
          return;
        }
        if (b.id === 'premium') {
          MP.Pay.buy(c.d, (ok) => {
            if (!ok) return;
            if (c.id === 'vidas3') run.lives += 3;
            if (c.id === 'bolsa') run.money += Eco.price(5000, pday());
            if (c.id === 'sinads') run.adsOff = true;
            msg('¡Listo! ' + c.name, '#7CFC8A'); Sfx.cash();
            MP.ui.saveRun();
          });
          return;
        }
        return;
      }
    }
    if (S.mode === 'start' && Gx.hit(KIT_BTN, x, y)) { Sfx.click(); kitSugerido(); return; }
    if (Gx.hit(MAIN_BTN, x, y)) {
      if (S.mode === 'start' && !Eco.canStart(run)) { msg('Necesitás un mate, una bombilla y yerba', '#ffcc80'); Sfx.fail(); return; }
      Sfx.click();
      const cb = S.onDone; S = null; cb();
    }
  }

  MP.Shop = { open, update, draw, down };
})();
