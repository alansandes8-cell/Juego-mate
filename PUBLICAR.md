# Cómo publicar Mate Perfecto en Google Play y en la App Store

Guía paso a paso. Seguila en orden: algunas cosas tardan días en aprobarse (verificación de cuentas, prueba cerrada de Google, revisión de Apple), así que conviene arrancarlas temprano.

---

## Qué ya está hecho en el repo

| Cosa | Dónde |
|---|---|
| Proyecto Android (Android Studio) | `android/` |
| Proyecto iOS (Xcode) | `ios/` |
| Íconos y pantallas de carga de todos los tamaños | ya generados dentro de `android/` e `ios/` (originales en `assets/`) |
| Juego funcionando sin internet (fuentes incluidas) | `fonts/` |
| Publicidad con **AdMob** (usa los anuncios de prueba de Google hasta que pongas los tuyos) | `js/ads.js` + `js/config.js` |
| Compras con el sistema de cada tienda (vía **RevenueCat**) + botón "Restaurar compras" | `js/ads.js` + `js/config.js` |
| Permiso de rastreo de iPhone y formulario de consentimiento de Google | `ios/App/App/Info.plist` + `js/ads.js` |
| Política de privacidad (hay que completar 3 datos) | `privacidad.html` |
| Ícono 512 px, gráfico 1024×500 y capturas para las tiendas | `icon-512.png`, `store/` |
| APK de prueba que se compila solo en GitHub | `.github/workflows/android.yml` |

Lo que falta lo tenés que hacer vos, porque requiere tus cuentas, tus datos y pagos. Es lo que sigue.

---

## Paso 0 — Decisiones antes de empezar (5 minutos)

1. **Identificador de la app**: está configurado como `com.mateperfecto.juego`. Es único en el mundo y **no se puede cambiar después de subir la app**. Si querés otro (por ejemplo `com.tunombre.mateperfecto`), avisame y lo cambio en todos lados antes de subir nada.
2. **Nombre público**: "Mate Perfecto". Fijate en las dos tiendas que no exista otra app con ese nombre exacto.
3. **Email de contacto**: las tiendas lo muestran públicamente. Te conviene uno exclusivo para la app.
4. **¿A nombre de quién?** Podés publicar como persona (con tu nombre real visible en la tienda) o como empresa. Para empresa, Google y Apple piden un número **D-U-N-S** (gratis, pero tarda 1 a 2 semanas). Para arrancar, persona es lo más simple.

---

## Paso 1 — Probá la app en tu Android hoy mismo (sin instalar nada)

Cada vez que se sube código a GitHub, se arma solo un APK de prueba.

1. Entrá a tu repo en GitHub → pestaña **Actions** → **APK de prueba (Android)**.
2. Abrí la última ejecución con tilde verde ✅ → abajo, en **Artifacts**, descargá `mate-perfecto-debug-apk`.
3. Descomprimí el `.zip` y pasá `app-debug.apk` al celu (por WhatsApp a vos mismo, Drive o cable).
4. Abrilo en el celu. Android te va a pedir permiso para "instalar apps de orígenes desconocidos": aceptá.
5. Jugá. Los anuncios que vas a ver dicen "Test Ad": eso está bien, son los de prueba.

> Si la ejecución sale con una cruz roja ❌, mandame el error que aparece y lo arreglo.

---

## Paso 2 — Publicá la política de privacidad (obligatoria)

1. Abrí `privacidad.html` y reemplazá los 3 datos entre corchetes: `[FECHA]`, `[TU NOMBRE O EL DE TU EMPRESA]` y `[TU EMAIL DE CONTACTO]`.
2. Publicala gratis con **GitHub Pages**:
   - En GitHub: tu repo → **Settings** → **Pages** → *Source*: **Deploy from a branch** → Branch: `main`, carpeta `/ (root)` → **Save**.
   - En 1 o 2 minutos queda en: `https://alansandes8-cell.github.io/Juego-mate/privacidad.html`
   - Ojo: en cuentas gratis, GitHub Pages solo funciona si el repo es **público**. Si lo querés privado, podés subir solo ese archivo a otro lugar gratuito (por ejemplo Netlify Drop o Google Sites).
3. Pegá esa URL en `js/config.js`, en el campo `privacyUrl`.

De paso, el juego entero también queda jugable en `https://alansandes8-cell.github.io/Juego-mate/`.

---

## Paso 3 — Creá las cuentas (arrancá ya: algunas tardan)

### 3.1 Google Play Console — US$ 25, pago único
1. Entrá a <https://play.google.com/console/signup> con una cuenta de Google.
2. Elegí **Personal** (o **Organización** si tenés D-U-N-S).
3. Pagá los US$ 25 con tarjeta.
4. Verificá tu identidad (te piden DNI o pasaporte y a veces un comprobante de domicilio). Tarda de horas a pocos días.
5. Verificá un celular Android: te lo pide la consola, con la app de Play Console instalada.
6. **Perfil de pagos** (para cobrar las compras): Play Console → *Configuración* → *Perfil de pagos*. Cargá tus datos y tu cuenta bancaria.

> ⚠️ **Regla para cuentas personales nuevas**: antes de publicar en producción, Google exige una **prueba cerrada con al menos 12 personas durante 14 días seguidos** (verificá el número actual en la consola, a veces cambia). Conseguí desde ya 12 o más amigos o familiares con Android y con una cuenta de Gmail.

### 3.2 Apple Developer Program — US$ 99 por año
1. Necesitás un **Apple ID con verificación en dos pasos** activada.
2. Entrá a <https://developer.apple.com/programs/enroll/> y anotate como **Individual** (o **Organization** con D-U-N-S).
3. Pagá los US$ 99. La aprobación tarda de 1 a 2 días. A veces piden una foto del documento desde la app **Apple Developer**.
4. En **App Store Connect** → *Business* (o *Acuerdos, impuestos y banca*): aceptá el acuerdo **Paid Apps** y cargá tus datos bancarios y fiscales. Como persona de Argentina completás el formulario **W-8BEN**. **Sin esto no podés vender compras dentro de la app.**

### 3.3 Google AdMob — gratis (para la publicidad)
1. Entrá a <https://admob.google.com> con tu cuenta de Google y creá tu cuenta.
2. Completá *Pagos* con tus datos y el banco. AdMob paga cuando acumulás el mínimo (en general US$ 100).
3. Creá **dos apps** en AdMob: *Apps* → *Agregar app* → "¿Está publicada?" → **No** (después las vinculás a la tienda).
   - "Mate Perfecto" plataforma **Android**
   - "Mate Perfecto" plataforma **iOS**
4. En **cada una** creá **dos bloques de anuncios**:
   - **Intersticial** (nombre: `entre-dias`)
   - **Bonificado** / *Rewarded* (nombre: `vida-extra`). Recompensa: 1, tipo: `vida`.
5. Anotá estos 6 IDs:
   - **ID de la app** Android (`ca-app-pub-XXXX~YYYY`) e iOS.
   - **ID de bloque** intersticial y bonificado de cada plataforma (`ca-app-pub-XXXX/ZZZZ`).
6. *Privacidad y mensajes* → creá un mensaje de **RGPD** y uno de **ATT** para iOS. Es lo que el juego muestra cuando hace falta pedir permiso.

> ⚠️ **Nunca toques tus propios anuncios reales.** Google lo detecta y puede cerrar la cuenta. Para probar están los anuncios de prueba.

### 3.4 RevenueCat — gratis hasta US$ 2.500 por mes de ventas (para las compras)
RevenueCat conecta las compras de Google y Apple con una sola integración, que ya está programada.
1. Creá la cuenta en <https://app.revenuecat.com>.
2. Creá un **Project** llamado "Mate Perfecto".
3. Agregá dos apps: **Play Store** (package `com.mateperfecto.juego`) y **App Store** (bundle ID `com.mateperfecto.juego`).
4. Conectá las credenciales siguiendo los asistentes de RevenueCat:
   - Google: una **cuenta de servicio** de Google Cloud con acceso a tu Play Console. RevenueCat tiene una guía paso a paso.
   - Apple: la **In-App Purchase Key** (`.p8`) de App Store Connect.
5. Copiá las **claves públicas** de cada app: la de Google empieza con `goog_`, la de Apple con `appl_`.
6. Más adelante (pasos 6 y 7), cuando crees los productos en las tiendas:
   - En RevenueCat → *Products* importá los 3 productos.
   - Marcá `mate_sin_publicidad` como **Non-consumable**.
   - Creá un **Entitlement** con ID `sin_publicidad` y asignale el producto `mate_sin_publicidad`.

---

## Paso 4 — Instalá las herramientas en tu compu

| Para | Necesitás |
|---|---|
| Todo | **Node.js 22** (<https://nodejs.org>) y **Git** (<https://git-scm.com>) |
| Android | **Android Studio** (<https://developer.android.com/studio>). Trae Java y el SDK. Funciona en Windows, Mac o Linux. |
| iPhone | Una **Mac** con **Xcode** (gratis en la App Store de la Mac). |

**¿No tenés Mac?** Opciones:
- Pedir una prestada para el momento de subir (una tarde alcanza).
- Usar un servicio en la nube que compila iOS, como **Codemagic** (tiene plan gratis con minutos limitados). Avisame y te lo configuro.

Bajá el proyecto y preparalo:
```bash
git clone https://github.com/alansandes8-cell/Juego-mate.git
cd Juego-mate
npm install
```

---

## Paso 5 — Poné tus IDs reales (cuando ya tengas AdMob y RevenueCat)

1. **`js/config.js`**:
   ```js
   admob: {
     test: false,                       // ← recién cuando subas la versión final
     android: { interstitial: 'ca-app-pub-XXXX/1111', rewarded: 'ca-app-pub-XXXX/2222' },
     ios:     { interstitial: 'ca-app-pub-XXXX/3333', rewarded: 'ca-app-pub-XXXX/4444' },
   },
   revenuecat: { android: 'goog_xxxxx', ios: 'appl_xxxxx', sinAdsEntitlement: 'sin_publicidad' },
   privacyUrl: 'https://alansandes8-cell.github.io/Juego-mate/privacidad.html',
   ```
2. **`android/app/src/main/AndroidManifest.xml`**: reemplazá `ca-app-pub-3940256099942544~3347511713` por tu **ID de app de AdMob Android**.
3. **`ios/App/App/Info.plist`**: reemplazá `ca-app-pub-3940256099942544~1458002511` por tu **ID de app de AdMob iOS**.
4. Mientras probás con amigos, dejá `test: true`. Pasalo a `false` solo para la versión que va a producción.

> Si querés, pasame los IDs y las claves públicas y lo configuro yo. Las claves **públicas** de RevenueCat y los IDs de AdMob se pueden compartir sin problema. Nunca compartas contraseñas, la clave `.p8` ni el archivo de la cuenta de servicio.

**app-ads.txt (recomendado):** AdMob te va a dar una línea de texto para publicar en un archivo `app-ads.txt` en la raíz del sitio web que pongas como "sitio del desarrollador" en las tiendas. Sin eso, los anuncios rinden menos. Con GitHub Pages hace falta un repo especial llamado `alansandes8-cell.github.io`; avisame y lo armo.

---

## Paso 6 — Android: subir a Google Play

### 6.1 Generar el archivo para la tienda (AAB firmado)
1. En la carpeta del proyecto: `npm run android`. Copia el juego y abre Android Studio. La primera vez tarda en descargar cosas.
2. Para probar en tu celu con cable: activá *Opciones de desarrollador → Depuración USB*, conectalo y tocá ▶️ **Run**.
3. Versión: en `android/app/build.gradle` están `versionCode` (número entero, **subilo en 1 cada vez que subas una versión nueva**) y `versionName` (lo que ve la gente, por ejemplo `1.0.0`).
4. **Build → Generate Signed App Bundle or APK → Android App Bundle → Next**.
5. *Key store path* → **Create new…**: elegí dónde guardarlo y una contraseña. Completá tu nombre y país (AR).
   > 🔐 **Guardá el archivo `.jks` y las contraseñas en dos lugares seguros** (por ejemplo, un pendrive y Google Drive). Sin eso no podés subir actualizaciones. Si usás la firma de apps de Google Play, que viene activada por defecto, se puede recuperar contactando a Google, pero es un trámite.
6. Elegí **release** → **Create**. El archivo queda en `android/app/release/app-release.aab`.

### 6.2 Crear la app en Play Console
1. **Crear app** → Nombre: *Mate Perfecto* · Idioma: Español (Latinoamérica) · **Juego** · **Gratis** → aceptá las declaraciones.
2. En el **Panel**, completá todo "Configura tu app":
   - **Política de privacidad**: tu URL del paso 2.
   - **Acceso a la app**: "Toda la funcionalidad está disponible sin restricciones".
   - **Anuncios**: **Sí, contiene anuncios**.
   - **Clasificación del contenido**: completá el cuestionario (categoría *Juego*). Contestá con honestidad. Ojo con la pregunta de **apuestas simuladas**: el truco con plata del juego puede contar como apuesta simulada. Si preguntan por dinero real, la respuesta es **no**: no se puede ganar plata real. Probablemente quede para mayores de 12 o 13 años.
   - **Público objetivo**: elegí **13 años o más**. Si incluís menores de 13, Google aplica las reglas de "Familias", que son más estrictas con la publicidad.
   - **Seguridad de los datos**, contestá así:
     - ¿Recopila datos? **Sí**.
     - *Identificadores del dispositivo u otros* → recopilado (AdMob) → para **Publicidad o marketing**, **Estadísticas** y **Prevención de fraudes**. No es obligatorio. Se encripta en tránsito.
     - *Actividad en la app / Interacciones* → recopilado (AdMob) → para publicidad y estadísticas.
     - *Información de la app y rendimiento → Diagnóstico y registros de fallas* → recopilado (AdMob).
     - *Información financiera → Historial de compras* → recopilado (RevenueCat) → para **Funcionalidad de la app**.
     - ¿Se puede pedir que se borren los datos? Indicá que no guardás datos en servidores propios y dejá tu email.
   - **App gubernamental / financiera / salud**: No.
3. **Ficha de Play Store principal** (*Crecimiento → Presencia en la tienda*):
   - Nombre, descripción corta y completa: copialas de la sección [Textos para las tiendas](#textos-para-las-tiendas).
   - **Ícono**: `icon-512.png` · **Gráfico de funciones**: `store/feature-graphic.png`.
   - **Capturas de teléfono**: `store/screenshots/android-1.png` a `android-5.png`.
   - Categoría: **Juegos → Casual** · email de contacto · sitio web (opcional).
4. **Productos integrados** (*Monetizar → Productos → Productos integrados*). Creá **exactamente** estos IDs:
   | ID | Nombre | Precio sugerido |
   |---|---|---|
   | `mate_vidas_3` | Pack de 3 vidas | US$ 0,99 |
   | `mate_bolsa_plata` | Bolsa de plata | US$ 1,99 |
   | `mate_sin_publicidad` | Sin publicidad | US$ 2,99 |

   Activá cada uno. Para poder crear productos, Play Console a veces pide haber subido antes un AAB a alguna pista de prueba: si te lo pide, hacé primero el paso 6.3.

### 6.3 Prueba cerrada (obligatoria para cuentas personales nuevas)
1. *Pruebas → Prueba cerrada* → **Crear pista** (o usá "Alpha").
2. **Testers** → creá una lista de emails con tus 12 o más testers (sus cuentas de Gmail).
3. **Crear versión** → subí `app-release.aab` → notas de la versión ("Primera versión de prueba") → **Revisar y lanzar**.
4. Google revisa la versión (horas o pocos días). Después copiá el **link de participación** y mandáselo a los testers: tienen que aceptar e instalar desde Play Store.
5. Pediles que **la abran y jueguen varios días**. Tienen que seguir en la prueba durante los 14 días.
6. Para probar compras sin pagar: *Configuración → Pruebas de licencias*, agregá tu Gmail. Tus compras de prueba no se cobran.
7. Pasados los 14 días: *Panel → Solicitar acceso a producción*. Contestás un par de preguntas sobre la prueba.

### 6.4 Producción
*Producción → Crear versión* → subí el AAB (con `admob.test: false` y `versionCode` más alto) → elegí países (Argentina y los que quieras) → **Enviar a revisión**. Tarda de 1 a 7 días.

---

## Paso 7 — iPhone: subir a la App Store (necesitás una Mac)

### 7.1 Preparar el proyecto en Xcode
1. En la Mac: `npm install` y después `npm run ios`. Se abre Xcode.
2. Seleccioná el proyecto **App** → target **App** → pestaña **Signing & Capabilities**:
   - **Team**: tu cuenta de desarrollador.
   - **Bundle Identifier**: `com.mateperfecto.juego`.
   - Botón **+ Capability** → agregá **In-App Purchase**.
3. Pestaña **General**:
   - **Version** `1.0.0`, **Build** `1`. **Subí el Build en 1 cada vez que subas algo.**
   - **Supported Destinations**: te recomiendo dejar **solo iPhone** (borrá iPad). Así no te piden capturas de iPad. Si querés iPad, las capturas ya están en `store/screenshots/ipad-13-*.png`.
4. Probalo en tu iPhone: conectalo con cable, elegilo arriba y tocá ▶️. La primera vez hay que confiar en el desarrollador en el iPhone: *Ajustes → General → VPN y gestión de dispositivos*.

### 7.2 Crear la app en App Store Connect
1. <https://appstoreconnect.apple.com> → **Apps → +  → Nueva app**.
   - Plataforma iOS · Nombre: *Mate Perfecto* · Idioma: Español (México) o el que prefieras · Bundle ID: `com.mateperfecto.juego` · SKU: `mateperfecto001`.
2. **Información de la app**: categoría **Juegos → Casual** (secundaria: *Cartas*). **URL de política de privacidad**: la del paso 2.
3. **Privacidad de la app** (*App Privacy*) → **Sí, recopilamos datos**:
   - **Identificadores → ID del dispositivo**: usado para *Publicidad de terceros* y *Analíticas*. **No vinculado** a la identidad. **Usado para rastreo**: Sí, porque AdMob con permiso ATT.
   - **Compras → Historial de compras**: *Funcionalidad de la app*. No vinculado. No se usa para rastreo.
   - **Datos de uso → Interacción con el producto** y **Publicidad**: *Publicidad de terceros* y *Analíticas*.
   - **Diagnóstico → Datos de fallas**: *Analíticas*.
4. **Compras dentro de la app** (*Monetización → Compras dentro de la app*), con los **mismos IDs**:
   - `mate_vidas_3` → **Consumible**
   - `mate_bolsa_plata` → **Consumible**
   - `mate_sin_publicidad` → **No consumible**

   Cada uno lleva nombre, descripción, precio y **una captura para la revisión** (sirve `store/screenshots/iphone-6.9-5.png`). La primera vez se envían **junto con la app**.
5. **Clasificación por edad**: completá el cuestionario. En *Apuestas simuladas* elegí **Infrecuentes/leves**, por el truco con plata del juego. Sin dinero real.

### 7.3 Subir la versión
1. En Xcode: arriba elegí **Any iOS Device (arm64)** → menú **Product → Archive**.
2. Se abre el *Organizer* → **Distribute App → App Store Connect → Upload**. Tarda unos minutos y después 10 a 30 minutos en procesarse.
3. **TestFlight** (recomendado): en App Store Connect → TestFlight, agregá tu email como tester interno y probá en tu iPhone desde la app TestFlight. Las compras son de prueba (*sandbox*): no se cobran.
4. En la página de la versión **1.0**:
   - **Capturas de 6,9"**: `store/screenshots/iphone-6.9-1.png` a `-5.png`.
   - Texto promocional, descripción, palabras clave, URL de soporte (puede ser la de privacidad o tu web).
   - **Compilación**: elegí la que subiste.
   - Asociá las 3 compras dentro de la app.
   - **Notas para el revisor** (en inglés ayuda): *"Single-player casual game. No login required. In-app purchases are consumables (extra lives, in-game money) and a non-consumable to remove ads. 'Restore purchases' is in Premium tab of the shop."*
5. **Enviar a revisión**. Tarda 1 a 3 días. Si la rechazan, mandame el mensaje de Apple y lo resolvemos.

---

## Paso 8 — Cada vez que cambiemos algo del juego

1. `git pull` (bajar los cambios nuevos).
2. `npm install` y después `npm run sync`. Copia el juego a las dos apps.
3. Subí el número de versión:
   - **Android**: `versionCode` +1 (y `versionName` si querés) en `android/app/build.gradle`.
   - **iOS**: *Build* +1 (y *Version*) en Xcode.
4. Generá y subí como en los pasos 6.1/6.4 y 7.3.

---

## Textos para las tiendas

**Nombre:** Mate Perfecto

**Subtítulo (App Store, máx. 30):** Cebá el mate de la ronda

**Descripción corta (Google Play, máx. 80):** Cebá mates para la ronda, cobrá propinas y que no se te lave la yerba. ¡Bien argento!

**Descripción completa:**
```
¿Sabés cebar? Demostralo.

Mate Perfecto es un juego de manejo bien argento: armá la ronda, cargá la yerba, poné la bombilla (¡y nunca la muevas!), calentá el agua sin que hierva y cebá en el hueco sin rebalsar. Si el mate sale bueno, te piden otro y te dejan propina. Si sale lavado, frío o con azúcar para el que toma amargo... te dicen "gracias" y se van.

☕ CEBÁ COMO SE DEBE
• Yerbas con personalidad, azúcar cucharadita por cucharadita y yuyos: peperina, poleo, burrito y cedrón.
• Cada cliente lo quiere a su manera: dulce o amargo, tibio o bien caliente, con su yerba favorita.
• El primero es del cebador. Siempre.

🧉 ARMÁ TU EQUIPO
• Empezás con poca plata: elegí tu mate, tu bombilla y tus yerbas.
• Mates de vidrio, madera, calabaza, térmico, imperial y camionero.
• Bombillas de acero, alpaca, pico de loro y oro.
• Pava eléctrica con corte, termo, ¡y dos mates a la vez!

🥐 LA RONDA
• Más de 20 personajes: la abuela, el tano, el gringo, el uruguayo que solo toma su yerba, la influencer...
• Bizcochitos, medialunas y facturas en la mesa.
• Eventos: se corta el gas, día de calor, partido, ¡viene la suegra!

🃏 TRUCO Y DESAFÍOS
• Cada 3 días, un truco a 15 sin flor mano a mano, por plata.
• Si alguien se va enojado, desafialo: piedra, papel o tijera, pulseada o una mano de truco.

📈 Y LA INFLACIÓN...
Todo sube 25% por día. Llegá a la meta, desbloqueá cosas nuevas cada día y fijate hasta dónde llegás.

Juego para un jugador. No necesita cuenta. Contiene anuncios y compras opcionales dentro de la app.
```

**Palabras clave (App Store, máx. 100, separadas por coma):**
`mate,yerba,argentina,cebar,truco,cocina,ronda,bombilla,casual,juego argentino,inflación`

---

## Errores comunes que conviene evitar

- ❌ Subir la versión final con `admob.test: true`: no ganás plata. ❌ Probar tocando anuncios reales: te pueden cerrar la cuenta.
- ❌ Usar nombres o logos de marcas reales de yerba sin permiso: las tiendas pueden rechazar la app o bajarla. Las yerbas del juego tienen nombres parodia.
- ❌ Olvidarte de subir `versionCode` / *Build*: la tienda rechaza el archivo.
- ❌ Perder el archivo `.jks` de Android.
- ❌ En Apple: faltan la URL de privacidad, las capturas de 6,9", el botón de restaurar compras (ya está en la pestaña Premium de la tienda) o el acuerdo Paid Apps.

---

## Checklist rápido

- [ ] Paso 0: identificador y nombre decididos
- [ ] Paso 1: APK de prueba instalado en tu Android
- [ ] Paso 2: `privacidad.html` completo y publicado
- [ ] Paso 3: cuentas de Google Play, Apple, AdMob y RevenueCat creadas y verificadas
- [ ] Paso 3: perfiles de pago (Google) y Paid Apps + banco + W-8BEN (Apple)
- [ ] Paso 5: IDs reales en `js/config.js`, `AndroidManifest.xml` e `Info.plist`
- [ ] Paso 6: AAB firmado · ficha completa · productos creados · prueba cerrada 14 días · producción
- [ ] Paso 7: archivo subido · TestFlight · privacidad · compras · enviado a revisión
