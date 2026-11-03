/* Mate Perfecto — utilidades y dibujo procedural (todo vectorial en Canvas) */
(function () {
  'use strict';
  const MP = (window.MP = window.MP || {});
  const TAU = Math.PI * 2;

  const FONT_D = '"Lilita One", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
  const FONT_B = '"Nunito", "Trebuchet MS", "Segoe UI", sans-serif';

  // ---------------- utilidades ----------------
  const U = {
    TAU, FONT_D, FONT_B,
    lerp: (a, b, t) => a + (b - a) * t,
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    rand: (a, b) => a + Math.random() * (b - a),
    randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    easeOutBack(t) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
    easeOut(t) { return 1 - Math.pow(1 - t, 3); },
    money(v) {
      const n = Math.round(Math.abs(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return (v < 0 ? '-$ ' : '$ ') + n;
    },
    hexRgb(h) {
      h = h.replace('#', '');
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      const n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    },
    mix(a, b, t) {
      const A = U.hexRgb(a), B = U.hexRgb(b);
      const r = A.map((v, i) => Math.round(v + (B[i] - v) * t));
      return `rgb(${r[0]},${r[1]},${r[2]})`;
    },
    shade(hex, amt) { return amt >= 0 ? U.mix(hex, '#ffffff', amt) : U.mix(hex, '#000000', -amt); },
    // pseudo-aleatorio determinístico (para texturas estables)
    seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; },
  };

  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function text(ctx, s, x, y, o) {
    o = o || {};
    const size = o.size || 28;
    ctx.font = `${o.weight || ''} ${size}px ${o.font || FONT_D}`;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    if (o.shadow) {
      ctx.fillStyle = o.shadow;
      ctx.fillText(s, x, y + (o.shadowY || size * 0.08));
    }
    if (o.stroke) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.sw || size * 0.2;
      ctx.strokeStyle = o.stroke;
      ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = o.color || '#fff';
    ctx.fillText(s, x, y);
  }

  function wrap(ctx, s, maxW) {
    const words = s.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  // ---------------- adornos tipo fileteado porteño ----------------
  function curl(ctx, x, y, size, dir, colors) {
    colors = colors || ['#1d6b3a', '#e0b23a', '#c0392b'];
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    ctx.lineCap = 'round';
    colors.forEach((col, i) => {
      const s = size * (1 - i * 0.18);
      ctx.strokeStyle = col;
      ctx.lineWidth = size * 0.11;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(s * 0.6, -s * 0.5, s * 1.3, -s * 0.2, s * 1.2, s * 0.35);
      ctx.bezierCurveTo(s * 1.1, s * 0.75, s * 0.6, s * 0.7, s * 0.65, s * 0.4);
      ctx.bezierCurveTo(s * 0.7, s * 0.18, s * 0.95, s * 0.25, s * 0.92, s * 0.42);
      ctx.stroke();
      ctx.translate(0, size * 0.06);
    });
    ctx.restore();
  }

  function leaf(ctx, x, y, len, ang, col) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = col || '#2e8b4a';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0);
    ctx.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = Math.max(1, len * 0.05);
    ctx.beginPath(); ctx.moveTo(len * 0.1, 0); ctx.lineTo(len * 0.85, 0); ctx.stroke();
    ctx.restore();
  }

  function fileteTitle(ctx, s, x, y, size, t) {
    const wob = Math.sin(t * 2) * 2;
    ctx.save();
    ctx.font = `${size}px ${FONT_D}`;
    const w = ctx.measureText(s).width;
    curl(ctx, x - w / 2 - 14, y + wob * 0.5, size * 0.55, -1);
    curl(ctx, x + w / 2 + 14, y + wob * 0.5, size * 0.55, 1);
    const g = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
    g.addColorStop(0, '#fff3b0'); g.addColorStop(0.45, '#f4c542'); g.addColorStop(1, '#d9822b');
    text(ctx, s, x, y + 6, { size, color: '#3b1d0e', stroke: '#3b1d0e', sw: size * 0.32 });
    text(ctx, s, x, y, { size, color: g, stroke: '#1e5631', sw: size * 0.16 });
    ctx.restore();
  }

  // ---------------- botones ----------------
  function button(ctx, b, t) {
    const pressed = b.pressed ? 5 : 0;
    const base = b.disabled ? '#9c9c9c' : b.color || '#e2a93b';
    const pulse = b.pulse && !b.disabled ? 1 + Math.sin(t * 6) * 0.025 : 1;
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
    ctx.scale(pulse, pulse);
    ctx.translate(-b.w / 2, -b.h / 2);
    rr(ctx, 0, 7, b.w, b.h, b.r || 20); ctx.fillStyle = U.shade(base, -0.45); ctx.fill();
    rr(ctx, 0, pressed, b.w, b.h, b.r || 20);
    const g = ctx.createLinearGradient(0, pressed, 0, b.h + pressed);
    g.addColorStop(0, U.shade(base, 0.25)); g.addColorStop(1, base);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = U.shade(base, -0.5); ctx.stroke();
    // brillo
    rr(ctx, 8, pressed + 5, b.w - 16, b.h * 0.32, 12);
    ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fill();
    const fs = b.size || 30;
    const dy = b.sub ? -fs * 0.3 : 0;
    text(ctx, b.label, b.w / 2, b.h / 2 + pressed + dy, { size: fs, color: '#fff', stroke: U.shade(base, -0.55), sw: fs * 0.22 });
    if (b.sub) text(ctx, b.sub, b.w / 2, b.h / 2 + pressed + fs * 0.55, { size: fs * 0.55, font: FONT_B, weight: '800', color: '#fff8e1' });
    ctx.restore();
  }

  function hit(b, x, y) { return b && !b.hidden && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }

  // ---------------- el MATE ----------------
  const speck = (() => { const r = U.seeded(42), a = []; for (let i = 0; i < 60; i++) a.push([r(), r(), r()]); return a; })();

  function gourdPath(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x - 88 * s, y - 104 * s);
    ctx.bezierCurveTo(x - 96 * s, y - 60 * s, x - 142 * s, y - 32 * s, x - 132 * s, y + 30 * s);
    ctx.bezierCurveTo(x - 124 * s, y + 96 * s, x - 70 * s, y + 124 * s, x, y + 124 * s);
    ctx.bezierCurveTo(x + 70 * s, y + 124 * s, x + 124 * s, y + 96 * s, x + 132 * s, y + 30 * s);
    ctx.bezierCurveTo(x + 142 * s, y - 32 * s, x + 96 * s, y - 60 * s, x + 88 * s, y - 104 * s);
    ctx.closePath();
  }

  function silverGrad(ctx, x0, x1) {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, '#8d949c'); g.addColorStop(0.3, '#f4f6f8'); g.addColorStop(0.55, '#b3bac2');
    g.addColorStop(0.8, '#eef1f4'); g.addColorStop(1, '#7c838b');
    return g;
  }

  /**
   * m: {yerba, freshR (0..1), sweet, herb, bombilla, bombT(0..1 anim), water, overflow, wiggle}
   */
  function drawMate(ctx, x, y, s, m, t, opt) {
    opt = opt || {};
    const my = y - 104 * s;
    ctx.save();
    // sombra
    if (!opt.noShadow) {
      ctx.fillStyle = 'rgba(40,20,5,.28)';
      ctx.beginPath(); ctx.ellipse(x + 6 * s, y + 124 * s, 120 * s, 20 * s, 0, 0, TAU); ctx.fill();
    }
    // pie de alpaca
    ctx.fillStyle = silverGrad(ctx, x - 70 * s, x + 70 * s);
    ctx.beginPath(); ctx.ellipse(x, y + 118 * s, 66 * s, 14 * s, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#6d747b'; ctx.lineWidth = 2 * s; ctx.stroke();

    // cuerpo calabaza
    gourdPath(ctx, x, y, s);
    const body = ctx.createRadialGradient(x - 45 * s, y - 20 * s, 10 * s, x, y + 10 * s, 150 * s);
    body.addColorStop(0, opt.calabaza ? '#c98a4a' : '#b0713a');
    body.addColorStop(0.55, '#7a3e18');
    body.addColorStop(1, '#3d1c0b');
    ctx.fillStyle = body; ctx.fill();
    ctx.lineWidth = 3 * s; ctx.strokeStyle = '#2a1206'; ctx.stroke();

    // guarda de cuero con costura + florcita fileteada
    ctx.save();
    gourdPath(ctx, x, y, s); ctx.clip();
    ctx.fillStyle = '#5a2c10';
    ctx.fillRect(x - 150 * s, y + 38 * s, 300 * s, 30 * s);
    ctx.strokeStyle = '#e8c88a'; ctx.lineWidth = 2.5 * s; ctx.setLineDash([7 * s, 6 * s]);
    ctx.beginPath(); ctx.moveTo(x - 150 * s, y + 43 * s); ctx.lineTo(x + 150 * s, y + 43 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 150 * s, y + 63 * s); ctx.lineTo(x + 150 * s, y + 63 * s); ctx.stroke();
    ctx.setLineDash([]);
    // brillo
    ctx.fillStyle = 'rgba(255,230,190,.16)';
    ctx.beginPath(); ctx.ellipse(x - 62 * s, y - 25 * s, 22 * s, 55 * s, 0.35, 0, TAU); ctx.fill();
    ctx.restore();
    // florcita (fileteado) sobre la panza
    if (s > 0.5) {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + 0.3;
        ctx.fillStyle = i % 2 ? '#c0392b' : '#e0b23a';
        ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 11 * s, y - 2 * s + Math.sin(a) * 11 * s, 9 * s, 5 * s, a, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = '#1d6b3a'; ctx.beginPath(); ctx.arc(x, y - 2 * s, 5 * s, 0, TAU); ctx.fill();
      leaf(ctx, x - 16 * s, y + 4 * s, 26 * s, Math.PI - 0.4, '#1d6b3a');
      leaf(ctx, x + 16 * s, y + 4 * s, 26 * s, 0.4, '#1d6b3a');
    }

    // aro de la virola (atrás)
    ctx.lineWidth = 12 * s;
    ctx.strokeStyle = silverGrad(ctx, x - 92 * s, x + 92 * s);
    ctx.beginPath(); ctx.ellipse(x, my, 90 * s, 22 * s, 0, Math.PI, TAU); ctx.stroke();

    // boca
    ctx.fillStyle = '#24140a';
    ctx.beginPath(); ctx.ellipse(x, my, 84 * s, 19 * s, 0, 0, TAU); ctx.fill();

    const yerba = m.yerba || 0;
    const fr = m.freshR == null ? 1 : m.freshR;
    const ycol = U.mix('#b5a76a', '#6f9a2c', fr);
    const ycolD = U.mix('#8a7d48', '#4d7420', fr);
    if (yerba > 0.02) {
      ctx.save();
      ctx.beginPath(); ctx.ellipse(x, my, 84 * s, 19 * s, 0, 0, TAU); ctx.clip();
      ctx.globalAlpha = U.clamp(yerba * 2.5, 0, 1);
      ctx.fillStyle = ycolD; ctx.fillRect(x - 90 * s, my - 25 * s, 180 * s, 50 * s);
      ctx.globalAlpha = 1;
      // hueco
      ctx.fillStyle = 'rgba(30,20,8,.55)';
      ctx.beginPath(); ctx.ellipse(x + 46 * s, my + 2 * s, 34 * s, 11 * s, 0, 0, TAU); ctx.fill();
      // agua
      const w = m.water || 0;
      if (w > 0.01) {
        const wc = m.boiled ? '#6b5a2a' : '#5b6e26';
        ctx.fillStyle = wc;
        const rw = U.clamp(w / 0.75, 0.15, 1);
        ctx.beginPath(); ctx.ellipse(x + 46 * s, my + 2 * s, 34 * s * rw, 11 * s * rw, 0, 0, TAU); ctx.fill();
        if (w > 0.75) {
          ctx.globalAlpha = U.clamp((w - 0.75) / 0.25, 0, 1) * 0.8;
          ctx.beginPath(); ctx.ellipse(x + 10 * s, my + 2 * s, 80 * s, 18 * s, 0, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
        // brillo + espumita
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        ctx.beginPath(); ctx.ellipse(x + 52 * s, my - 1 * s, 12 * s * rw, 3 * s * rw, 0, 0, TAU); ctx.fill();
        if (fr > 0.55 && w > 0.3) {
          ctx.fillStyle = 'rgba(240,235,190,.85)';
          for (let i = 0; i < 9; i++) {
            const a = (i / 9) * TAU + t * 0.6;
            ctx.beginPath(); ctx.arc(x + 46 * s + Math.cos(a) * 24 * s * rw, my + 2 * s + Math.sin(a) * 7 * s * rw, 2.6 * s, 0, TAU); ctx.fill();
          }
        }
      }
      ctx.restore();

      // montañita
      const h = U.clamp((yerba - 0.15) * 58, 0, 42) * s;
      ctx.beginPath();
      ctx.moveTo(x - 82 * s, my + 3 * s);
      ctx.quadraticCurveTo(x - 72 * s, my - h * 0.9, x - 36 * s, my - h);
      ctx.quadraticCurveTo(x + 2 * s, my - h * 0.9, x + 16 * s, my + 5 * s);
      ctx.quadraticCurveTo(x - 30 * s, my + 17 * s, x - 82 * s, my + 3 * s);
      const mg = ctx.createLinearGradient(0, my - h, 0, my + 10 * s);
      mg.addColorStop(0, U.mix('#d2c58a', '#9cc24a', fr)); mg.addColorStop(1, ycol);
      ctx.fillStyle = mg; ctx.fill();
      // palitos y polvito
      ctx.save(); ctx.clip();
      for (const [a, b, c] of speck) {
        const px = x - 80 * s + a * 96 * s, py = my - h + b * (h + 16 * s);
        ctx.fillStyle = c > 0.7 ? 'rgba(240,230,170,.8)' : c > 0.4 ? 'rgba(40,70,20,.45)' : 'rgba(255,255,255,.25)';
        if (c > 0.85) { ctx.fillRect(px, py, 6 * s, 1.6 * s); } else { ctx.beginPath(); ctx.arc(px, py, 1.5 * s, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
      // azúcar y yuyos encima
      if (m.sweet) {
        ctx.fillStyle = 'rgba(255,255,255,.95)';
        for (let i = 0; i < 14; i++) { const a = speck[i]; ctx.fillRect(x - 70 * s + a[0] * 70 * s, my - h * 0.6 + a[1] * h * 0.7, 3 * s, 3 * s); }
      }
      if (m.herb) {
        for (let i = 0; i < 4; i++) { const a = speck[20 + i]; leaf(ctx, x - 66 * s + a[0] * 60 * s, my - h * 0.5 + a[1] * h * 0.5, 14 * s, a[2] * 3, '#3f7d3a'); }
      }
    }

    // bombilla
    if (m.bombilla) {
      const bt = m.bombT == null ? 1 : m.bombT;
      const off = (1 - U.easeOutBack(bt)) * -170 * s;
      const wig = m.wiggle ? Math.sin(t * 40) * m.wiggle * 10 * s : 0;
      ctx.save();
      ctx.beginPath(); ctx.rect(x - 200 * s, my - 400 * s, 400 * s, 400 * s + 2 * s);
      ctx.ellipse(x + 46 * s, my + 2 * s, 34 * s, 11 * s, 0, 0, TAU);
      ctx.clip();
      const bx0 = x + 46 * s + wig * 0.3, by0 = my + 6 * s + off;
      const bx1 = x + 72 * s + wig, by1 = my - 135 * s + off;
      const bx2 = x + 60 * s + wig, by2 = my - 158 * s + off;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#5d646b'; ctx.lineWidth = 11 * s;
      ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.lineTo(bx1, by1); ctx.quadraticCurveTo(bx1 + 4 * s, by2 + 6 * s, bx2, by2); ctx.stroke();
      ctx.strokeStyle = m.alpaca ? '#f1d98a' : '#d9dee3'; ctx.lineWidth = 7 * s;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2.2 * s;
      ctx.beginPath(); ctx.moveTo(bx0 - 2 * s, by0 - 4 * s); ctx.lineTo(bx1 - 2 * s, by1 + 4 * s); ctx.stroke();
      // boquilla
      ctx.fillStyle = m.alpaca ? '#e2b84a' : '#c7ccd1';
      ctx.beginPath(); ctx.ellipse(bx2, by2, 7 * s, 4 * s, -0.5, 0, TAU); ctx.fill();
      // anillito decorativo
      ctx.fillStyle = m.alpaca ? '#d4a017' : '#9aa1a8';
      ctx.beginPath(); ctx.ellipse(bx0 + (bx1 - bx0) * 0.72, by0 + (by1 - by0) * 0.72, 7 * s, 3.5 * s, -0.2, 0, TAU); ctx.fill();
      ctx.restore();
    }

    // aro de la virola (adelante)
    ctx.lineWidth = 12 * s;
    ctx.strokeStyle = silverGrad(ctx, x - 92 * s, x + 92 * s);
    ctx.beginPath(); ctx.ellipse(x, my, 90 * s, 22 * s, 0, 0, Math.PI); ctx.stroke();
    ctx.fillStyle = 'rgba(80,85,90,.6)';
    for (let i = 0; i < 9; i++) {
      const a = 0.25 + (i / 8) * (Math.PI - 0.5);
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * 90 * s, my + Math.sin(a) * 22 * s, 1.8 * s, 0, TAU); ctx.fill();
    }

    // chorreado si rebalsó
    if (m.overflow) {
      ctx.fillStyle = 'rgba(90,110,40,.85)';
      for (let i = 0; i < 3; i++) {
        const dx = x + (20 + i * 26) * s, len = (30 + i * 14 + Math.sin(t * 3 + i) * 4) * s;
        ctx.beginPath();
        ctx.moveTo(dx - 5 * s, my + 18 * s);
        ctx.quadraticCurveTo(dx - 6 * s, my + 18 * s + len, dx, my + 22 * s + len);
        ctx.quadraticCurveTo(dx + 6 * s, my + 18 * s + len, dx + 5 * s, my + 18 * s);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---------------- la PAVA ----------------
  function pavaBody(ctx) {
    ctx.beginPath();
    ctx.moveTo(-78, 48);
    ctx.bezierCurveTo(-98, 8, -72, -40, -42, -46);
    ctx.lineTo(42, -46);
    ctx.bezierCurveTo(72, -40, 98, 8, 78, 48);
    ctx.quadraticCurveTo(0, 62, -78, 48);
    ctx.closePath();
  }

  const PAVA_TIP = [134, -50];

  function drawPava(ctx, x, y, s, tilt, t, opt) {
    opt = opt || {};
    const col = opt.color || '#d4412f';
    ctx.save();
    ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(s, s);
    // manija
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(-36, -44); ctx.bezierCurveTo(-42, -118, 42, -118, 36, -44); ctx.stroke();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-30, -70); ctx.bezierCurveTo(-30, -108, 30, -108, 30, -70); ctx.stroke();
    // pico
    ctx.beginPath();
    ctx.moveTo(66, 12); ctx.quadraticCurveTo(108, 2, 128, -54); ctx.lineTo(140, -48);
    ctx.quadraticCurveTo(118, 18, 70, 34); ctx.closePath();
    ctx.fillStyle = U.shade(col, -0.15); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = U.shade(col, -0.55); ctx.stroke();
    // cuerpo
    pavaBody(ctx);
    const g = ctx.createRadialGradient(-30, -15, 8, 0, 0, 110);
    g.addColorStop(0, U.shade(col, 0.35)); g.addColorStop(0.6, col); g.addColorStop(1, U.shade(col, -0.4));
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = U.shade(col, -0.55); ctx.stroke();
    // florcitas del enlozado
    ctx.save(); pavaBody(ctx); ctx.clip();
    [[-38, 8, 1], [8, 22, 0.8], [42, -8, 0.7], [-8, -22, 0.6]].forEach(([fx, fy, fs]) => {
      ctx.fillStyle = '#fff8ec';
      for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * 8 * fs, fy + Math.sin(a) * 8 * fs, 6 * fs, 3.6 * fs, a, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#f4c542'; ctx.beginPath(); ctx.arc(fx, fy, 4 * fs, 0, TAU); ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    ctx.beginPath(); ctx.ellipse(-45, -10, 10, 26, 0.3, 0, TAU); ctx.fill();
    ctx.restore();
    // borde inferior
    ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-76, 47); ctx.quadraticCurveTo(0, 61, 76, 47); ctx.stroke();
    // tapa (traquetea si hierve)
    const rattle = opt.rattle ? Math.sin(t * 50) * 2.5 : 0;
    ctx.save(); ctx.translate(0, rattle);
    ctx.fillStyle = U.shade(col, -0.1);
    ctx.beginPath(); ctx.ellipse(0, -47, 44, 10, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = U.shade(col, -0.55); ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = U.shade(col, 0.15);
    ctx.beginPath(); ctx.ellipse(0, -52, 32, 12, 0, Math.PI, TAU); ctx.fill();
    ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.ellipse(0, -64, 10, 7, 0, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function pavaTip(x, y, s, tilt) {
    const [lx, ly] = PAVA_TIP;
    const c = Math.cos(tilt), sn = Math.sin(tilt);
    return [x + (lx * c - ly * sn) * s, y + (lx * sn + ly * c) * s];
  }

  function drawHornalla(ctx, x, y, fire, t) {
    ctx.save();
    ctx.fillStyle = '#2d2d33';
    ctx.beginPath(); ctx.ellipse(x, y + 8, 100, 24, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a4a52';
    ctx.beginPath(); ctx.ellipse(x, y, 92, 20, 0, 0, TAU); ctx.fill();
    // llamitas
    if (fire) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        const fx = x + Math.cos(a) * 44, fy = y + Math.sin(a) * 9;
        const h = 14 + Math.sin(t * 22 + i * 1.7) * 5;
        const g = ctx.createLinearGradient(0, fy, 0, fy - h);
        g.addColorStop(0, 'rgba(60,110,255,.95)'); g.addColorStop(0.7, 'rgba(120,190,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(fx - 5, fy); ctx.quadraticCurveTo(fx, fy - h * 1.3, fx + 5, fy); ctx.fill();
      }
    }
    // parrilla
    ctx.strokeStyle = '#18181c'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + Math.PI / 4;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 30, y + Math.sin(a) * 6); ctx.lineTo(x + Math.cos(a) * 92, y + Math.sin(a) * 20); ctx.stroke();
    }
    ctx.restore();
  }

  function drawThermo(ctx, x, top, bot, temp, t) {
    const T0 = 20, T1 = 100;
    const yOf = (v) => bot - ((v - T0) / (T1 - T0)) * (bot - top);
    ctx.save();
    rr(ctx, x - 22, top - 22, 44, bot - top + 44, 22); ctx.fillStyle = 'rgba(255,248,230,.95)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#5a3a20'; ctx.stroke();
    // zonas
    const zones = [[65, 74, '#7ec8e3'], [74, 83, '#5cc96b'], [83, 90, '#f2a33a'], [96, 100, '#e0412f']];
    for (const [a, b, c] of zones) { ctx.fillStyle = c; ctx.fillRect(x + 9, yOf(b), 9, yOf(a) - yOf(b)); }
    // tubo
    rr(ctx, x - 8, top - 6, 14, bot - top + 6, 7); ctx.fillStyle = '#eee'; ctx.fill();
    const ty = yOf(U.clamp(temp, T0, T1));
    const g = ctx.createLinearGradient(0, bot, 0, top);
    g.addColorStop(0, '#d63a2a'); g.addColorStop(1, '#ff7a4d');
    rr(ctx, x - 5, ty, 8, bot - ty + 8, 4); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(x - 1, bot + 10, 14, 0, TAU); ctx.fillStyle = '#d63a2a'; ctx.fill();
    ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  // ---------------- PERSONAS ----------------
  function drawPerson(ctx, c, t) {
    const p = c.p;
    const x = c.x;
    const walking = c.state === 'arrive' || c.state === 'leave';
    const bob = walking ? -Math.abs(Math.sin(t * 11 + c.phase)) * 9 : Math.sin(t * 1.8 + c.phase) * 2;
    const base = c.baseY + bob;
    const hx = x, hy = base - 178;
    const anger = c.anger || 0;
    const skin = anger > 0.02 ? U.mix(p.skin, '#e2483a', anger * 0.6) : p.skin;
    const hair = p.hair;
    const mood = c.mood;

    ctx.save();
    // pelo de atrás
    ctx.fillStyle = hair;
    if (p.hairStyle === 'long') { rr(ctx, hx - 58, hy - 30, 116, 128, 40); ctx.fill(); }
    if (p.hairStyle === 'bun') { ctx.beginPath(); ctx.arc(hx, hy - 56, 22, 0, TAU); ctx.fill(); }
    if (p.hairStyle === 'ponytail') {
      ctx.beginPath(); ctx.ellipse(hx + 52, hy + 18, 16, 42, -0.35 + Math.sin(t * 3 + c.phase) * 0.12, 0, TAU); ctx.fill();
    }
    if (p.hairStyle === 'curly') {
      for (let i = 0; i < 13; i++) {
        const a = Math.PI * 0.95 + (i / 12) * Math.PI * 1.1;
        ctx.beginPath(); ctx.arc(hx + Math.cos(a) * 50, hy - 4 + Math.sin(a) * 48, 19, 0, TAU); ctx.fill();
      }
      ctx.beginPath(); ctx.arc(hx - 52, hy + 22, 17, 0, TAU); ctx.arc(hx + 52, hy + 22, 17, 0, TAU); ctx.fill();
    }

    // torso
    const shirt = p.shirt;
    rr(ctx, x - 74, base - 122, 148, 190, 46);
    ctx.fillStyle = shirt; ctx.fill();
    if (p.stripes) {
      ctx.save(); rr(ctx, x - 74, base - 122, 148, 190, 46); ctx.clip();
      ctx.fillStyle = '#ffffff';
      for (let i = -3; i <= 3; i++) ctx.fillRect(x + i * 40 - 9, base - 130, 18, 200);
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 3;
    rr(ctx, x - 74, base - 122, 148, 190, 46); ctx.stroke();
    // cuello
    ctx.fillStyle = U.shade(p.skin, -0.12);
    rr(ctx, hx - 16, hy + 36, 32, 34, 10); ctx.fill();
    // escote
    ctx.fillStyle = U.shade(p.skin, -0.06);
    ctx.beginPath(); ctx.moveTo(x - 22, base - 122); ctx.lineTo(x, base - 96); ctx.lineTo(x + 22, base - 122); ctx.fill();
    if (p.scarf) {
      ctx.fillStyle = p.scarf;
      ctx.beginPath(); ctx.moveTo(x - 34, base - 124); ctx.lineTo(x + 34, base - 124); ctx.lineTo(x, base - 82); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x - 18 + i * 12, base - 116 + (i % 2) * 8, 2.4, 0, TAU); ctx.fill(); }
    }

    // orejas
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(hx - 50, hy + 4, 11, 0, TAU); ctx.arc(hx + 50, hy + 4, 11, 0, TAU); ctx.fill();
    if (p.earrings) {
      ctx.fillStyle = '#f4c542';
      ctx.beginPath(); ctx.arc(hx - 51, hy + 18, 4.5, 0, TAU); ctx.arc(hx + 51, hy + 18, 4.5, 0, TAU); ctx.fill();
    }
    // cabeza
    ctx.beginPath(); ctx.ellipse(hx, hy, 50, 54, 0, 0, TAU);
    ctx.fillStyle = skin; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 2.5; ctx.stroke();

    // barba
    if (p.beard) {
      ctx.fillStyle = p.beard;
      ctx.beginPath();
      ctx.moveTo(hx - 48, hy + 2);
      ctx.quadraticCurveTo(hx - 46, hy + 62, hx, hy + 66);
      ctx.quadraticCurveTo(hx + 46, hy + 62, hx + 48, hy + 2);
      ctx.quadraticCurveTo(hx + 30, hy + 30, hx, hy + 30);
      ctx.quadraticCurveTo(hx - 30, hy + 30, hx - 48, hy + 2);
      ctx.fill();
    }

    // pelo de adelante / sombreros
    ctx.fillStyle = hair;
    switch (p.hairStyle) {
      case 'bald':
        ctx.beginPath(); ctx.ellipse(hx - 45, hy - 6, 9, 20, 0.2, 0, TAU); ctx.ellipse(hx + 45, hy - 6, 9, 20, -0.2, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(hx - 14, hy - 38, 14, 6, -0.3, 0, TAU); ctx.fill();
        break;
      case 'short': case 'bun': case 'long': case 'ponytail':
        ctx.beginPath(); ctx.ellipse(hx, hy - 20, 53, 38, 0, Math.PI, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(hx - 52, hy - 20); ctx.quadraticCurveTo(hx - 20, hy - 4, hx + 4, hy - 26);
        ctx.quadraticCurveTo(hx + 30, hy - 6, hx + 52, hy - 20); ctx.lineTo(hx + 52, hy - 30); ctx.lineTo(hx - 52, hy - 30); ctx.fill();
        if (p.hairStyle === 'long') { rr(ctx, hx - 58, hy - 24, 14, 80, 7); ctx.fill(); rr(ctx, hx + 44, hy - 24, 14, 80, 7); ctx.fill(); }
        break;
      case 'curly':
        for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(hx - 42 + i * 14, hy - 40 + Math.abs(i - 3) * 3, 14, 0, TAU); ctx.fill(); }
        break;
      case 'gorra':
        ctx.fillStyle = p.hat;
        ctx.beginPath(); ctx.ellipse(hx, hy - 22, 54, 40, 0, Math.PI, TAU); ctx.fill();
        ctx.fillRect(hx - 54, hy - 24, 108, 8);
        ctx.fillStyle = U.shade(p.hat, -0.25);
        ctx.beginPath(); ctx.ellipse(hx + 34, hy - 18, 42, 10, 0.08, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx - 8, hy - 42, 9, 0, TAU); ctx.fill();
        ctx.fillStyle = hair; ctx.fillRect(hx - 50, hy - 18, 10, 14); ctx.fillRect(hx + 40, hy - 18, 10, 14);
        break;
      case 'boina':
        ctx.fillStyle = hair; ctx.fillRect(hx - 50, hy - 22, 10, 18); ctx.fillRect(hx + 40, hy - 22, 10, 18);
        ctx.fillStyle = p.hat;
        ctx.beginPath(); ctx.ellipse(hx + 4, hy - 36, 60, 22, 0.06, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(hx + 6, hy - 58, 5, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.ellipse(hx - 14, hy - 44, 26, 7, 0, 0, TAU); ctx.fill();
        break;
    }

    // cara
    const blink = c.blink > 0;
    const look = c.lookX || 0;
    const ex = 18, ey = hy - 2;
    ctx.lineCap = 'round';
    if (mood === 'happy' || mood === 'love') {
      ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(hx - ex, ey + 4, 8, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.beginPath(); ctx.arc(hx + ex, ey + 4, 8, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else if (mood === 'drink') {
      ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(hx - ex - 8, ey); ctx.lineTo(hx - ex + 8, ey); ctx.moveTo(hx + ex - 8, ey); ctx.lineTo(hx + ex + 8, ey); ctx.stroke();
    } else {
      ctx.fillStyle = '#fff';
      const eh = blink ? 1.5 : 10;
      ctx.beginPath(); ctx.ellipse(hx - ex, ey, 9, eh, 0, 0, TAU); ctx.ellipse(hx + ex, ey, 9, eh, 0, 0, TAU); ctx.fill();
      if (!blink) {
        ctx.fillStyle = '#2a1a10';
        ctx.beginPath(); ctx.arc(hx - ex + look * 3, ey + 2, 5, 0, TAU); ctx.arc(hx + ex + look * 3, ey + 2, 5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(hx - ex + look * 3 + 2, ey, 1.6, 0, TAU); ctx.arc(hx + ex + look * 3 + 2, ey, 1.6, 0, TAU); ctx.fill();
      }
    }
    // cejas
    ctx.strokeStyle = U.shade(hair === '#dedede' || hair === '#9a9a9a' ? '#777777' : hair, -0.2); ctx.lineWidth = 4.5;
    const bAng = mood === 'angry' ? 0.38 : mood === 'sad' ? -0.3 : mood === 'impatient' ? 0.2 : mood === 'happy' || mood === 'love' ? -0.08 : 0;
    const bY = ey - 17 - (mood === 'happy' || mood === 'love' ? 4 : 0);
    ctx.beginPath();
    ctx.moveTo(hx - ex - 10, bY - bAng * 12); ctx.lineTo(hx - ex + 9, bY + bAng * 12);
    ctx.moveTo(hx + ex + 10, bY - bAng * 12); ctx.lineTo(hx + ex - 9, bY + bAng * 12);
    ctx.stroke();
    // nariz
    ctx.strokeStyle = U.shade(p.skin, -0.3); ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(hx + 1, ey + 15, 6, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
    // cachetes
    if (mood === 'happy' || mood === 'love' || p.id === 'chola') {
      ctx.fillStyle = 'rgba(240,110,110,.35)';
      ctx.beginPath(); ctx.ellipse(hx - 32, ey + 18, 9, 6, 0, 0, TAU); ctx.ellipse(hx + 32, ey + 18, 9, 6, 0, 0, TAU); ctx.fill();
    }
    // boca
    const my = hy + 34;
    ctx.strokeStyle = '#5a1e14'; ctx.lineWidth = 4;
    if (c.talk > 0 && mood !== 'drink') {
      const o = 3 + Math.abs(Math.sin(t * 18)) * 7;
      ctx.fillStyle = '#5a1e14';
      ctx.beginPath(); ctx.ellipse(hx, my, 11, o, 0, 0, TAU); ctx.fill();
    } else if (mood === 'happy' || mood === 'love') {
      ctx.fillStyle = '#5a1e14';
      ctx.beginPath(); ctx.arc(hx, my - 5, 15, 0.1, Math.PI - 0.1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8737a'; ctx.beginPath(); ctx.ellipse(hx, my + 5, 7, 4, 0, 0, TAU); ctx.fill();
    } else if (mood === 'angry' || mood === 'sad') {
      ctx.beginPath(); ctx.arc(hx, my + 12, 12, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
    } else if (mood === 'drink') {
      ctx.fillStyle = '#5a1e14'; ctx.beginPath(); ctx.ellipse(hx + 2, my - 6, 5, 5, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(240,110,110,.4)';
      ctx.beginPath(); ctx.ellipse(hx - 26, my - 8, 11, 9, 0, 0, TAU); ctx.ellipse(hx + 26, my - 8, 11, 9, 0, 0, TAU); ctx.fill();
    } else if (mood === 'impatient') {
      ctx.beginPath(); ctx.moveTo(hx - 10, my + 2); ctx.lineTo(hx + 10, my - 1); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(hx, my - 6, 10, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
    }
    // bigote
    if (p.mustache) {
      ctx.fillStyle = p.mustache;
      ctx.beginPath();
      ctx.moveTo(hx, ey + 22);
      ctx.quadraticCurveTo(hx - 18, ey + 16, hx - 30, ey + 32);
      ctx.quadraticCurveTo(hx - 14, ey + 30, hx, ey + 28);
      ctx.quadraticCurveTo(hx + 14, ey + 30, hx + 30, ey + 32);
      ctx.quadraticCurveTo(hx + 18, ey + 16, hx, ey + 22);
      ctx.fill();
    }
    // anteojos
    if (p.glasses) {
      ctx.strokeStyle = '#3a2a20'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(hx - ex, ey, 14, 0, TAU); ctx.moveTo(hx + ex + 14, ey); ctx.arc(hx + ex, ey, 14, 0, TAU);
      ctx.moveTo(hx - ex + 14, ey); ctx.lineTo(hx + ex - 14, ey);
      ctx.moveTo(hx - ex - 14, ey - 2); ctx.lineTo(hx - 50, ey - 6);
      ctx.moveTo(hx + ex + 14, ey - 2); ctx.lineTo(hx + 50, ey - 6);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.beginPath(); ctx.arc(hx - ex, ey, 13, 0, TAU); ctx.arc(hx + ex, ey, 13, 0, TAU); ctx.fill();
    }
    ctx.restore();
    return { hx, hy };
  }

  // ---------------- íconos de herramientas ----------------
  function iconYerba(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    rr(ctx, -26, -36, 52, 72, 6); ctx.fillStyle = '#f2e6c4'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#6b4a22'; ctx.stroke();
    ctx.fillStyle = '#c0392b'; ctx.fillRect(-26, -14, 52, 22);
    text(ctx, 'YERBA', 0, -3, { size: 12, color: '#fff' });
    ctx.fillStyle = '#e0b23a'; ctx.beginPath(); ctx.moveTo(-26, -36); ctx.lineTo(0, -46); ctx.lineTo(26, -36); ctx.fill();
    leaf(ctx, -10, 22, 22, -0.4, '#2e7d32');
    leaf(ctx, 2, 22, 18, -1.2, '#43a047');
    ctx.restore();
  }
  function iconSugar(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#fafafa';
    ctx.beginPath(); ctx.moveTo(-32, -6); ctx.quadraticCurveTo(-30, 32, 0, 32); ctx.quadraticCurveTo(30, 32, 32, -6); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#3a6ea5'; ctx.stroke();
    ctx.fillStyle = '#3a6ea5'; ctx.fillRect(-28, 4, 56, 5);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(0, -6, 32, 8, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#eee';
    for (let i = 0; i < 5; i++) ctx.fillRect(-16 + i * 7, -10 + (i % 2) * 3, 5, 5);
    ctx.strokeStyle = '#a9b0b6'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(8, -8); ctx.lineTo(30, -38); ctx.stroke();
    ctx.restore();
  }
  function iconYuyo(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    rr(ctx, -22, -18, 44, 52, 10); ctx.fillStyle = 'rgba(210,240,255,.7)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#5a7f8f'; ctx.stroke();
    ctx.fillStyle = '#7a5a3a'; ctx.fillRect(-24, -26, 48, 10);
    for (let i = 0; i < 6; i++) leaf(ctx, -8 + (i % 3) * 8, 26 - i * 6, 18, -1.2 - i * 0.35, i % 2 ? '#3f7d3a' : '#5aa54a');
    leaf(ctx, 0, -26, 22, -1.9, '#3f7d3a'); leaf(ctx, 0, -26, 22, -1.2, '#5aa54a');
    ctx.restore();
  }
  function iconBombilla(ctx, x, y, s, gold) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(0.5);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#5d646b'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(0, -32); ctx.quadraticCurveTo(0, -42, -10, -44); ctx.stroke();
    ctx.strokeStyle = gold ? '#f1d98a' : '#dfe3e7'; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = gold ? '#d4a017' : '#9aa1a8';
    ctx.beginPath(); ctx.ellipse(0, 40, 9, 13, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function iconBizcocho(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#e8b866';
      ctx.beginPath(); ctx.ellipse(-16 + i * 16, 10 - (i % 2) * 12, 16, 12, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#b07a30'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-26 + i * 16, 8 - (i % 2) * 12); ctx.lineTo(-6 + i * 16, 8 - (i % 2) * 12); ctx.stroke();
    }
    ctx.restore();
  }
  function iconTermo(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    rr(ctx, -18, -30, 36, 70, 12); ctx.fillStyle = silverGrad(ctx, -18, 18); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 2.5; ctx.stroke();
    rr(ctx, -14, -46, 28, 18, 6); ctx.fillStyle = '#2e7d32'; ctx.fill();
    ctx.fillStyle = '#2e7d32'; ctx.fillRect(-18, 10, 36, 10);
    ctx.restore();
  }
  function iconFor(ctx, id, x, y, s) {
    switch (id) {
      case 'yerba': return iconYerba(ctx, x, y, s);
      case 'azucar': return iconSugar(ctx, x, y, s);
      case 'yuyo': return iconYuyo(ctx, x, y, s);
      case 'bombilla': return iconBombilla(ctx, x, y, s, false);
      case 'pava': return drawPava(ctx, x - 8 * s, y + 8 * s, s * 0.36, 0, 0);
      case 'mate': return drawMate(ctx, x, y + 6 * s, s * 0.28, { yerba: 0.7, bombilla: true }, 0, { noShadow: true, calabaza: true });
      case 'termo': return iconTermo(ctx, x, y, s);
      case 'bizcocho': return iconBizcocho(ctx, x, y, s);
      case 'alpaca': return iconBombilla(ctx, x, y, s, true);
    }
  }

  function thermoIcon(ctx, x, y, s, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    rr(ctx, -4, -14, 8, 20, 4); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#555'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = col; ctx.fillRect(-2, -4, 4, 10);
    ctx.beginPath(); ctx.arc(0, 9, 6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function bubble(ctx, x, y, w, h, tailX, tailY, opt) {
    opt = opt || {};
    ctx.save();
    ctx.fillStyle = 'rgba(40,20,5,.25)';
    rr(ctx, x + 3, y + 5, w, h, 18); ctx.fill();
    ctx.fillStyle = opt.color || '#fffaf0';
    ctx.strokeStyle = opt.border || '#3b2412'; ctx.lineWidth = 3.5;
    rr(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke();
    const tx = U.clamp(tailX, x + 24, x + w - 24);
    ctx.beginPath();
    ctx.moveTo(tx - 12, y + h - 2); ctx.lineTo(tailX, tailY); ctx.lineTo(tx + 12, y + h - 2);
    ctx.fill(); ctx.stroke();
    ctx.fillRect(tx - 10, y + h - 6, 20, 5);
    ctx.restore();
  }

  MP.U = U;
  MP.G = {
    rr, text, wrap, curl, leaf, fileteTitle, button, hit, drawMate, drawPava, pavaTip, drawHornalla, drawThermo,
    drawPerson, iconFor, thermoIcon, bubble, silverGrad,
  };
})();
