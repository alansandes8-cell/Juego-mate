/* Mate Perfecto — economía: partida, inventario, precios e inflación */
(function () {
  'use strict';
  const MP = window.MP;
  const D = MP.DATA;

  const infl = (day) => Math.pow(1.25, day - 1);
  const price = (base, day) => Math.max(10, Math.round((base * infl(day)) / 10) * 10);

  function newRun() {
    return {
      day: 1, money: 1500, lives: 1, adsOff: false, rewardDay: 0,
      inv: { yerba: {}, azucar: 0, yuyo: {}, food: {} },
      own: { mates: {}, bombillas: {}, termo: false, electrica: false, segundo: false },
      equip: { mates: [null, null], bombilla: null },
      stats: { served: 0, excellent: 0, truco: 0 },
    };
  }

  const ready = (run) => ({
    mate: !!run.equip.mates[0],
    bombilla: !!run.equip.bombilla,
    yerba: Object.values(run.inv.yerba).some((n) => n > 0),
  });

  function canStart(run) { const r = ready(run); return r.mate && r.bombilla && r.yerba; }

  function unlocksOn(day) {
    const out = [];
    const add = (cat, obj, icon) => Object.entries(obj).forEach(([id, it]) => { if (it.minDay === day) out.push({ cat, id, name: it.name, icon, extra: id }); });
    add('Yerba', D.YERBAS, 'yerba');
    add('Yuyo', D.YUYOS, 'yuyoKind');
    add('Panadería', D.FOODS, 'food');
    add('Mate', D.MATES, 'mateKind');
    add('Bombilla', D.BOMBILLAS, 'bombillaKind');
    Object.entries(D.EQUIPO).forEach(([id, it]) => { if (it.minDay === day) out.push({ cat: 'Equipo', id, name: it.name, icon: id === 'termo' ? 'termo' : id === 'electrica' ? 'electrica' : 'segundo' }); });
    D.FEATURES.filter((f) => f.day === day).forEach((f) => out.push({ cat: 'Novedad', name: f.name, desc: f.desc, icon: 'star' }));
    D.PERSONAS.filter((p) => p.minDay === day && day > 1).forEach((p) => out.push({ cat: 'Cliente', name: p.name, icon: 'person', persona: p }));
    return out;
  }

  const unlockedYerbas = (day) => Object.keys(D.YERBAS).filter((k) => D.YERBAS[k].minDay <= day);
  const unlockedYuyos = (day) => Object.keys(D.YUYOS).filter((k) => D.YUYOS[k].minDay <= day);

  MP.Eco = { infl, price, newRun, canStart, ready, unlocksOn, unlockedYerbas, unlockedYuyos };
})();
