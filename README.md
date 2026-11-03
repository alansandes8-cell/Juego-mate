# Mate Perfecto 🧉

Juego web 2D (celu y PC) para cebar el mate perfecto. Bien argento.

- Abrí `index.html` en el navegador (o serví la carpeta con cualquier servidor estático).
- Sin dependencias ni build: Canvas 2D + WebAudio, todo dibujado y sintetizado por código.
- Instalable como app (PWA) cuando se sirve por HTTPS, y como app nativa de Android e iOS (Capacitor).
- **Para publicar en Google Play y App Store, seguí [PUBLICAR.md](PUBLICAR.md).**

## Qué tiene

- **Arrancás con $ 1.500** y armás tu equipo: mate, bombilla, yerbas y azúcar. Después hay que reponer.
- **Yerbas** con distintas propiedades (Taragüé, Rosamundo, Canarita, Valdo — nombres parodia, se cambian en `js/data.js`).
- **Yuyos** que se desbloquean: peperina, poleo, burrito y cedrón.
- **Mates**: vidrio, madera, calabaza, térmico, imperial y camionero. **Bombillas**: acero, alpaca, pico de loro y oro.
- **Panadería** en la mesa (bizcochitos, medialunas, facturas): se venden y dan beneficios.
- **Pava eléctrica** con corte regulable, termo y **dos mates** a la vez.
- **20 clientes** con gustos y rasgos (el gringo, el uruguayo que solo toma Canarita, la influencer...).
- **Desafíos** cuando alguien se va enojado: piedra-papel-tijera, pulseada o una mano de truco.
- **Truco a 15 sin flor** cada 3 días, por plata.
- **Novedades todos los días**, eventos (corte de gas, partido, lluvia, la suegra) e inflación del 25% diario.
- **Vidas** para repetir un día.

## Monetización (modo prueba)

Todo está en `js/config.js` y `js/ads.js`:

- **Publicidad cada 2 días** y anuncio con premio (+1 vida). Sin configurar muestra una publicidad de prueba.
  Para anuncios reales: cuenta de AdSense aprobada + acceso a anuncios para juegos H5, y poner tu `ca-pub-...`.
- **Compras** (vidas, bolsa de plata, sin publicidad): en modo `demo` se simulan sin cobrar.
  Para cobrar de verdad hay que conectar un proveedor (Mercado Pago, Stripe o la tienda de apps) con un servidor que valide el pago.

## Controles

Elegí una herramienta abajo (Yerba, Azúcar, Yuyos, Bombilla, Pava) y mantené apretado / tocá sobre el mate.
Tocá a quien espera para pasarle el mate. Tocá un plato para darle lo que pidió.

Teclado: `1`-`5` herramientas, `Espacio` usar, `F` fuego, `T` tomarlo vos, `V` vaciar, `M` cambiar de mate, `Esc` pausa.
