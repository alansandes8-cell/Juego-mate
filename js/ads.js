/* Mate Perfecto — publicidad y pagos: AdSense (web), AdMob + compras de tienda (app), o modo prueba */
(function () {
  'use strict';
  const MP = (window.MP = window.MP || {});
  const CFG = window.MP_CONFIG || {};
  const Cap = window.Capacitor;
  const native = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  const platform = native ? Cap.getPlatform() : 'web';
  const plug = (n) => (native && Cap.Plugins ? Cap.Plugins[n] : null);

  // IDs de anuncios de prueba oficiales de Google
  const TEST_IDS = {
    android: { interstitial: 'ca-app-pub-3940256099942544/1033173712', rewarded: 'ca-app-pub-3940256099942544/5224354917' },
    ios: { interstitial: 'ca-app-pub-3940256099942544/4411468910', rewarded: 'ca-app-pub-3940256099942544/1712485313' },
  };

  let mode = 'fake'; // 'adsense' | 'admob' | 'fake'
  let admobReady = false;
  let rcReady = false;
  const storeProducts = {}; // id interno -> producto de la tienda

  function adId(kind) {
    const a = CFG.admob || {};
    const real = a[platform] && a[platform][kind];
    return a.test || !real ? TEST_IDS[platform][kind] : real;
  }

  async function initAdMob() {
    const AdMob = plug('AdMob');
    if (!AdMob) return;
    try {
      // Consentimiento (GDPR / estados de EE.UU.) y permiso de rastreo en iOS
      try {
        const info = await AdMob.requestConsentInfo({});
        if (info && info.isConsentFormAvailable && info.status === 'REQUIRED') await AdMob.showConsentForm();
      } catch (e) { /* sin formulario */ }
      if (platform === 'ios') { try { await AdMob.requestTrackingAuthorization(); } catch (e) { /* nada */ } }
      await AdMob.initialize({ initializeForTesting: !!(CFG.admob && CFG.admob.test) });
      admobReady = true; mode = 'admob';
    } catch (e) { admobReady = false; }
  }

  async function initRevenueCat() {
    const P = plug('Purchases');
    const key = CFG.revenuecat && CFG.revenuecat[platform];
    if (!P || !key) return;
    try {
      await P.configure({ apiKey: key });
      rcReady = true;
      const ids = Object.values(CFG.products || {});
      const res = await P.getProducts({ productIdentifiers: ids, type: 'NON_SUBSCRIPTION' });
      const list = (res && res.products) || [];
      for (const [k, id] of Object.entries(CFG.products)) {
        const pr = list.find((q) => q.identifier === id);
        if (pr) storeProducts[k] = pr;
      }
      await syncSinAds();
    } catch (e) { /* sigue en modo prueba */ }
  }

  async function syncSinAds() {
    const P = plug('Purchases');
    if (!P || !rcReady) return;
    try {
      const r = await P.getCustomerInfo();
      const info = (r && r.customerInfo) || r;
      const ent = CFG.revenuecat.sinAdsEntitlement;
      if (info && info.entitlements && info.entitlements.active && info.entitlements.active[ent]) {
        try { localStorage.setItem('mp_adsoff', 'true'); } catch (e) { /* nada */ }
        if (MP.ui && MP.ui.run) MP.ui.run.adsOff = true;
      }
    } catch (e) { /* nada */ }
  }

  function initWebAds() {
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
      mode = 'adsense';
    } catch (e) { mode = 'fake'; }
  }

  function initNativeShell() {
    // Pantalla completa, botón "atrás" de Android y pausa al salir de la app
    const SB = plug('StatusBar');
    if (SB) { SB.hide().catch(() => {}); }
    const App = plug('App');
    if (App) {
      App.addListener('backButton', () => { if (MP.ui && MP.ui.back) MP.ui.back(); });
      App.addListener('pause', () => { MP.Play && MP.Play.blur(); MP.Sfx && MP.Sfx.suspend(); });
      App.addListener('resume', () => { MP.Sfx && MP.Sfx.resume(); });
    }
  }

  function init() {
    if (native) { initNativeShell(); initAdMob(); initRevenueCat(); }
    else initWebAds();
  }

  // ---------------- publicidad entre días ----------------
  async function interstitial(name, done) {
    const run = MP.ui && MP.ui.run;
    if (run && run.adsOff) { done(); return; }
    if (mode === 'admob' && admobReady) {
      const AdMob = plug('AdMob');
      try {
        MP.Sfx.suspend();
        await AdMob.prepareInterstitial({ adId: adId('interstitial') });
        await AdMob.showInterstitial();
      } catch (e) { /* sin anuncio: seguimos */ }
      MP.Sfx.resume();
      done();
      return;
    }
    if (mode === 'adsense') {
      window.adBreak({ type: 'next', name, beforeAd: () => MP.Sfx.suspend(), afterAd: () => MP.Sfx.resume(), adBreakDone: () => done() });
      return;
    }
    MP.ui.fakeAd(false, () => done());
  }

  // ---------------- publicidad con premio ----------------
  async function rewarded(name, onReward, done) {
    if (mode === 'admob' && admobReady) {
      const AdMob = plug('AdMob');
      let given = false;
      let sub = null;
      try {
        MP.Sfx.suspend();
        sub = await AdMob.addListener('onRewardedVideoAdReward', () => { if (!given) { given = true; onReward(); } });
        await AdMob.prepareRewardVideoAd({ adId: adId('rewarded') });
        const r = await AdMob.showRewardVideoAd();
        if (!given && r && (r.amount !== undefined || r.type)) { given = true; onReward(); }
      } catch (e) {
        MP.ui.toastGlobal('No hay anuncios disponibles ahora');
      }
      try { sub && sub.remove && sub.remove(); } catch (e) { /* nada */ }
      MP.Sfx.resume();
      done && done(given);
      return;
    }
    if (mode === 'adsense') {
      let given = false;
      window.adBreak({
        type: 'reward', name,
        beforeAd: () => MP.Sfx.suspend(), afterAd: () => MP.Sfx.resume(),
        beforeReward: (show) => show(),
        adViewed: () => { given = true; onReward(); },
        adDismissed: () => {},
        adBreakDone: () => { if (!given) MP.ui.toastGlobal('No hay anuncios disponibles ahora'); done && done(given); },
      });
      return;
    }
    MP.ui.fakeAd(true, (ok) => { if (ok) onReward(); done && done(ok); });
  }

  // ---------------- compras ----------------
  function priceLabel(item) {
    const pr = storeProducts[item.id];
    return pr && pr.priceString ? pr.priceString : item.price;
  }

  async function buy(item, cb) {
    const P = plug('Purchases');
    const pr = storeProducts[item.id];
    if (P && rcReady && pr) {
      try {
        await P.purchaseStoreProduct({ product: pr });
        if (item.id === 'sinads') { try { localStorage.setItem('mp_adsoff', 'true'); } catch (e) { /* nada */ } }
        cb(true);
      } catch (e) {
        if (!(e && (e.userCancelled || /cancel/i.test(String(e.message || e))))) MP.ui.toastGlobal('No se pudo completar la compra');
        cb(false);
      }
      return;
    }
    // Modo prueba (web o app sin RevenueCat configurado)
    MP.ui.modal({
      title: 'Compra de prueba',
      lines: [item.name + ' — ' + priceLabel(item), 'Modo prueba: no se cobra nada.', 'Configurá los pagos en js/config.js.'],
      buttons: [
        { label: 'Simular compra', color: '#2e7d32', cb: () => cb(true) },
        { label: 'Cancelar', color: '#6d4c41', cb: () => cb(false) },
      ],
    });
  }

  // Obligatorio en iOS para compras no consumibles ("Sin publicidad")
  async function restore(cb) {
    const P = plug('Purchases');
    if (P && rcReady) {
      try { await P.restorePurchases(); await syncSinAds(); cb(true); } catch (e) { cb(false); }
      return;
    }
    cb(false);
  }

  MP.Ads = { init, interstitial, rewarded, get mode() { return mode; } };
  MP.Pay = { buy, restore, priceLabel, get native() { return native; } };
})();
