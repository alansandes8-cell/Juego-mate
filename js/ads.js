/* Mate Perfecto — publicidad y pagos (con modo prueba) */
(function () {
  'use strict';
  const MP = (window.MP = window.MP || {});
  const CFG = window.MP_CONFIG || {};
  let real = false;

  function init() {
    if (!CFG.adsenseClient) return;
    try {
      const s = document.createElement('script');
      s.async = true;
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(CFG.adsenseClient);
      s.crossOrigin = 'anonymous';
      if (CFG.adsTestMode) s.setAttribute('data-adbreak-test', 'on');
      document.head.appendChild(s);
      window.adsbygoogle = window.adsbygoogle || [];
      window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); };
      window.adConfig({ preloadAdBreaks: 'on', sound: 'on' });
      real = true;
    } catch (e) { real = false; }
  }

  // Publicidad entre días (no se puede saltear salvo "sin publicidad")
  function interstitial(name, done) {
    const run = MP.ui && MP.ui.run;
    if (run && run.adsOff) { done(); return; }
    if (real) {
      window.adBreak({
        type: 'next', name,
        beforeAd: () => MP.Sfx.suspend(), afterAd: () => MP.Sfx.resume(),
        adBreakDone: () => done(),
      });
      return;
    }
    MP.ui.fakeAd(false, () => done());
  }

  // Publicidad con recompensa: onReward solo si la vieron entera
  function rewarded(name, onReward, done) {
    if (real) {
      let given = false;
      window.adBreak({
        type: 'reward', name,
        beforeAd: () => MP.Sfx.suspend(), afterAd: () => MP.Sfx.resume(),
        beforeReward: (show) => show(),
        adViewed: () => { given = true; onReward(); },
        adDismissed: () => {},
        adBreakDone: (info) => {
          if (!given && info && info.breakStatus !== 'viewed') MP.ui.toastGlobal('No hay anuncios disponibles ahora');
          done && done(given);
        },
      });
      return;
    }
    MP.ui.fakeAd(true, (ok) => { if (ok) onReward(); done && done(ok); });
  }

  // Compras con plata real. En modo 'demo' pide confirmación y no cobra nada.
  function buy(item, cb) {
    if (CFG.payments === 'demo' || !CFG.payments) {
      MP.ui.modal({
        title: 'Compra de prueba',
        lines: [item.name + ' — ' + item.price, 'Modo prueba: no se cobra nada.', 'Configurá un proveedor de pagos en js/config.js.'],
        buttons: [
          { label: 'Simular compra', color: '#2e7d32', cb: () => cb(true) },
          { label: 'Cancelar', color: '#6d4c41', cb: () => cb(false) },
        ],
      });
      return;
    }
    // Acá iría la integración real (Mercado Pago / Stripe / Play Billing)
    cb(false);
  }

  MP.Ads = { init, interstitial, rewarded, get real() { return real; } };
  MP.Pay = { buy };
})();
