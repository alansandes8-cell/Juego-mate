/*
 * Mate Perfecto — configuración de publicidad y pagos.
 * Paso a paso completo en PUBLICAR.md
 *
 * ── EN LA WEB ──
 *   adsenseClient: tu ID de AdSense ('ca-pub-…'). Vacío = publicidad de prueba propia.
 *
 * ── EN LA APP (Android / iOS) ──
 *   AdMob: mientras admob.test sea true se usan los anuncios DE PRUEBA de Google (no generan plata,
 *   pero son seguros para probar). Cuando tengas tus bloques de anuncios, pegá los IDs y poné test: false.
 *   ¡Nunca toques tus propios anuncios reales! Google puede cerrar la cuenta.
 *
 *   Compras: se hacen con el sistema de cada tienda a través de RevenueCat (gratis hasta cierto volumen).
 *   Pegá tus claves públicas de RevenueCat. Vacías = compras simuladas (modo prueba).
 */
window.MP_CONFIG = {
  // Web
  adsenseClient: '',
  adsTestMode: true,

  // App: AdMob
  admob: {
    test: true,
    android: { interstitial: '', rewarded: '' },
    ios: { interstitial: '', rewarded: '' },
  },

  // App: compras con RevenueCat (claves públicas de la app en RevenueCat)
  revenuecat: {
    android: '', // empieza con "goog_"
    ios: '',     // empieza con "appl_"
    // ID del "entitlement" que da "sin publicidad"
    sinAdsEntitlement: 'sin_publicidad',
  },

  // IDs de productos: tienen que ser IGUALES en Google Play Console, App Store Connect y RevenueCat
  products: {
    vidas3: 'mate_vidas_3',     // consumible
    bolsa: 'mate_bolsa_plata',  // consumible
    sinads: 'mate_sin_publicidad', // no consumible
  },

  // Web: 'demo' simula compras sin cobrar
  payments: 'demo',

  // Página de privacidad (obligatoria en las tiendas). Cambiala por tu URL publicada.
  privacyUrl: 'privacidad.html',
};
