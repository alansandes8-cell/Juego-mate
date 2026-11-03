/*
 * Mate Perfecto — configuración de monetización.
 *
 * PUBLICIDAD (Google AdSense para juegos HTML5 / "Ad Placement API"):
 *   1. Necesitás una cuenta de AdSense aprobada para tu dominio y acceso a anuncios para juegos H5.
 *   2. Poné tu ID de editor abajo (ej: 'ca-pub-1234567890123456').
 *   3. Mientras pruebas, dejá adsTestMode en true (Google muestra anuncios de prueba).
 *   Sin ID, el juego muestra una "publicidad de prueba" propia para que veas dónde van.
 *
 * PAGOS (vidas, bolsa de plata, sin publicidad):
 *   'demo' simula la compra sin cobrar. Para cobrar de verdad hace falta un proveedor
 *   (Mercado Pago, Stripe, o las compras de Google Play / App Store si lo empaquetás como app)
 *   y un pequeño servidor que confirme el pago. El punto de conexión es MP.Pay.buy() en js/ads.js.
 */
window.MP_CONFIG = {
  adsenseClient: '',
  adsTestMode: true,
  payments: 'demo',
};
