/* Mate Perfecto — catálogo: clientes, productos, equipo y desbloqueos */
(function () {
  'use strict';
  const MP = (window.MP = window.MP || {});

  // ------------------------------------------------------------------
  // CLIENTES. sweet / herb = probabilidad. temp = preferencia. minDay = desde qué día aparece.
  // pay = multiplicador de lo que paga. tipX = multiplicador de propina. traits: rasgos especiales.
  // ------------------------------------------------------------------
  const PERSONAS = [
    { id: 'chola', name: 'Abuela Chola', skin: '#f3cfb0', hair: '#dedede', hairStyle: 'bun', shirt: '#9b5fa8', glasses: true, earrings: true,
      sweet: 0.85, temp: 'tibio', herb: 0.45, patience: 30, minDay: 1 },
    { id: 'ruben', name: 'Tano Rubén', skin: '#e9b98f', hair: '#3a2a20', hairStyle: 'bald', shirt: '#2f5ea6', mustache: '#3a2a20',
      sweet: 0.05, temp: 'caliente', herb: 0.15, patience: 24, minDay: 1 },
    { id: 'brian', name: 'Brian', skin: '#d9a27a', hair: '#2a1a10', hairStyle: 'gorra', hat: '#d33b2c', shirt: '#75aadb', stripes: '#ffffff',
      sweet: 0.7, temp: 'justo', herb: 0.1, patience: 22, minDay: 1 },
    { id: 'rosa', name: 'Doña Rosa', skin: '#f0c19a', hair: '#8a3320', hairStyle: 'curly', shirt: '#e07a3f', earrings: true,
      sweet: 0.5, temp: 'tibio', herb: 0.5, patience: 28, minDay: 1 },
    { id: 'ramon', name: 'Don Ramón', skin: '#c98d62', hair: '#9a9a9a', hairStyle: 'boina', hat: '#1f1f2a', shirt: '#c9b48a', mustache: '#cfcfcf', scarf: '#c0392b',
      sweet: 0.0, temp: 'caliente', herb: 0.7, patience: 26, minDay: 1 },
    { id: 'mirta', name: 'La Profe Mirta', skin: '#f2d2b6', hair: '#c9b27a', hairStyle: 'short', shirt: '#3f8f6e', glasses: true,
      sweet: 0.3, temp: 'justo', herb: 0.3, patience: 25, minDay: 1 },
    { id: 'facu', name: 'Facu', skin: '#e3b38c', hair: '#3b2616', hairStyle: 'long', shirt: '#2b2b2b', beard: '#3b2616',
      sweet: 0.1, temp: 'justo', herb: 0.2, patience: 23, minDay: 1 },
    { id: 'cami', name: 'Cami', skin: '#f5d0b5', hair: '#e0a93c', hairStyle: 'ponytail', shirt: '#f2c94c',
      sweet: 0.6, temp: 'tibio', herb: 0.3, patience: 24, minDay: 1 },
    { id: 'lucas', name: 'Lucas, el estudiante', skin: '#eac2a0', hair: '#5a3a22', hairStyle: 'beanie', hat: '#2e7d32', shirt: '#8e8e8e',
      sweet: 0.9, temp: 'justo', herb: 0.1, patience: 26, minDay: 1, pay: 0.8, traits: ['tacaño'] },
    { id: 'tito', name: 'Abuelo Tito', skin: '#f0caa8', hair: '#f2f2f2', hairStyle: 'bald', shirt: '#7a5c3e', glasses: true, mustache: '#f2f2f2',
      sweet: 0.8, temp: 'tibio', herb: 0.4, patience: 32, minDay: 2 },
    { id: 'gustavo', name: 'Gustavo, oficinista', skin: '#e6b994', hair: '#2a2a2a', hairStyle: 'short', shirt: '#dfe6ee', tie: '#1e3a6e',
      sweet: 0.2, temp: 'caliente', herb: 0.05, patience: 16, minDay: 2, pay: 1.3, traits: ['apurado'] },
    { id: 'coco', name: 'Coco, el tachero', skin: '#d29a6e', hair: '#1a1a1a', hairStyle: 'gorra', hat: '#f2c94c', shirt: '#4a4a4a', mustache: '#1a1a1a',
      sweet: 0.15, temp: 'caliente', herb: 0.1, patience: 20, minDay: 2 },
    { id: 'john', name: 'John, el gringo', skin: '#fbe1cf', hair: '#f4d36b', hairStyle: 'short', shirt: '#ff7f50', stripes: '#ffd166',
      sweet: 1.0, temp: 'tibio', herb: 0.0, patience: 28, minDay: 3, pay: 1.6, traits: ['gringo'] },
    { id: 'washington', name: 'Washington (uruguayo)', skin: '#d9a982', hair: '#3a2a20', hairStyle: 'short', shirt: '#6cace4', mustache: '#3a2a20',
      sweet: 0.0, temp: 'caliente', herb: 0.0, patience: 24, minDay: 3, fav: 'canarita', traits: ['exigeYerba'] },
    { id: 'pocho', name: 'El Pocho, hincha', skin: '#d8a072', hair: '#1a1a1a', hairStyle: 'short', shirt: '#c62828', stripes: '#ffffff', beard: '#1a1a1a',
      sweet: 0.4, temp: 'justo', herb: 0.1, patience: 17, minDay: 3, traits: ['apurado'] },
    { id: 'sofi', name: 'Sofi, influencer', skin: '#f6d3bd', hair: '#f48fb1', hairStyle: 'ponytail', shirt: '#ffffff', earrings: true, phone: true,
      sweet: 0.5, temp: 'tibio', herb: 0.6, patience: 22, minDay: 4, tipX: 2.2, traits: ['influencer'] },
    { id: 'beto', name: 'Beto, el kiosquero', skin: '#e2ae86', hair: '#6b4b2f', hairStyle: 'bald', shirt: '#2a9d8f', mustache: '#6b4b2f',
      sweet: 0.35, temp: 'justo', herb: 0.3, patience: 25, minDay: 4 },
    { id: 'carlitos', name: 'Carlitos, tanguero', skin: '#e9be98', hair: '#111111', hairStyle: 'fedora', hat: '#2b2b2b', shirt: '#1f1f1f', mustache: '#111111', scarf: '#ffffff',
      sweet: 0.1, temp: 'caliente', herb: 0.6, patience: 24, minDay: 5, tipX: 1.4 },
    { id: 'nelly', name: 'Nelly del barrio', skin: '#f1c7a5', hair: '#b35d9b', hairStyle: 'curly', shirt: '#4db6ac', glasses: true, earrings: true,
      sweet: 0.6, temp: 'justo', herb: 0.7, patience: 27, minDay: 5 },
    { id: 'paisano', name: 'El Paisano', skin: '#b97e55', hair: '#2a2a2a', hairStyle: 'fedora', hat: '#6d4c2f', shirt: '#e8dcc0', scarf: '#1d6b3a', mustache: '#2a2a2a',
      sweet: 0.0, temp: 'caliente', herb: 0.8, patience: 26, minDay: 6 },
  ];

  const SUEGRA = { id: 'suegra', name: 'La Suegra', skin: '#efc6a6', hair: '#7d6a8f', hairStyle: 'curly', shirt: '#b22d4a', glasses: true, earrings: true,
    sweet: 0.5, temp: 'justo', herb: 0.5, patience: 16, special: true, pay: 2 };

  // ------------------------------------------------------------------
  // PRODUCTOS (precios base del día 1; suben con la inflación)
  // Nombres de yerba "parodia": cambialos acá si tenés permiso de usar marcas reales.
  // ------------------------------------------------------------------
  const YERBAS = {
    tarague: { name: 'Taragüé', desc: 'La clásica con palo. Barata, pero se lava un poco antes.', price: 170, cargas: 5, fresh: -1, q: 0, pack: '#c0392b', band: '#f4c542', minDay: 1 },
    rosamundo: { name: 'Rosamundo', desc: 'Suave y pareja. Le gusta a casi todos (+4 calidad).', price: 210, cargas: 5, fresh: 0, q: 4, pack: '#8e2c6b', band: '#ffffff', minDay: 1 },
    canarita: { name: 'Canarita', desc: 'Estilo uruguayo, con polvo. Rinde un montón (+3 cebadas).', price: 320, cargas: 5, fresh: 3, q: 2, pack: '#f2c94c', band: '#1d4fa0', minDay: 3 },
    valdo: { name: 'Valdo', desc: 'Verde finita estilo brasilero. Riquísima (+8), pero se lava rápido.', price: 260, cargas: 5, fresh: -2, q: 8, pack: '#2e9e4f', band: '#ffe082', minDay: 5 },
  };

  const SUGAR = { name: 'Azúcar', desc: 'Paquete de 20 cucharadas. Los que toman dulce quieren azúcar en cada mate.', price: 90, usos: 20 };

  const YUYOS = {
    peperina: { name: 'Peperina', desc: 'Frasco para 6 yerbas. La favorita de los serranos.', price: 120, usos: 6, col: '#4caf50', minDay: 2 },
    poleo: { name: 'Poleo', desc: 'Frasco para 6 yerbas. Ideal para después del asado.', price: 130, usos: 6, col: '#7cb342', minDay: 4 },
    burrito: { name: 'Burrito', desc: 'Frasco para 6 yerbas. Digestivo y bien de campo.', price: 150, usos: 6, col: '#9ccc65', minDay: 6 },
    cedron: { name: 'Cedrón', desc: 'Frasco para 6 yerbas. Perfumado, para los finos.', price: 170, usos: 6, col: '#c0ca33', minDay: 8 },
  };

  // Panadería: se ponen en la mesa. Se venden y además dan un beneficio mientras haya.
  const FOODS = {
    bizcochos: { name: 'Bizcochitos de grasa', desc: 'Docena. Mientras haya en la mesa, la gente espera +25%.', price: 180, units: 12, sell: 35, perk: 'paciencia', col: '#e8b866', minDay: 2 },
    medialunas: { name: 'Medialunas', desc: 'Docena. Mientras haya, las propinas suben +25%.', price: 260, units: 12, sell: 55, perk: 'propinas', col: '#e3a64a', minDay: 4 },
    facturas: { name: 'Facturas surtidas', desc: 'Docena. Mientras haya, los mates saben mejor (+5).', price: 320, units: 12, sell: 65, perk: 'calidad', col: '#d98c5f', minDay: 6 },
  };

  // Mates: q = calidad extra, tip = propina extra, keep = conserva el calor, big = camionero
  const MATES = {
    vidrio: { name: 'Mate de vidrio forrado', desc: 'El más barato. No le da gusto a nada (-3 calidad).', price: 160, q: -3, tip: 0, minDay: 1 },
    madera: { name: 'Mate de madera', desc: 'Noble y sencillo. Ni suma ni resta.', price: 230, q: 0, tip: 0, minDay: 1 },
    calabaza: { name: 'Mate de calabaza', desc: 'El de toda la vida, bien curado (+6 calidad).', price: 420, q: 6, tip: 0, minDay: 1 },
    termico: { name: 'Mate térmico de acero', desc: 'Conserva el calor: perdona errores de temperatura.', price: 650, q: 2, tip: 0, keep: true, minDay: 3 },
    imperial: { name: 'Mate imperial', desc: 'Calabaza con virola de alpaca cincelada. +10 calidad, +30% propina.', price: 1500, q: 10, tip: 0.3, minDay: 5 },
    camionero: { name: 'Mate camionero', desc: 'Grandote: cada mate se cobra 50% más, pero se lava antes.', price: 1200, q: 3, tip: 0, big: true, minDay: 7 },
  };

  const BOMBILLAS = {
    acero: { name: 'Bombilla de acero inoxidable', desc: 'Firme y confiable.', price: 140, tip: 0, q: 0, minDay: 1 },
    alpaca: { name: 'Bombilla de alpaca', desc: 'Queda fachera: +30% de propinas.', price: 450, tip: 0.3, q: 0, alpaca: true, minDay: 1 },
    pico: { name: 'Bombilla pico de loro', desc: 'Nunca se tapa, aunque cargues mucha yerba (+2).', price: 380, tip: 0, q: 2, noTapa: true, minDay: 3 },
    oro: { name: 'Bombilla enchapada en oro', desc: 'Para lucirse: +60% de propinas.', price: 1700, tip: 0.6, q: 2, gold: true, minDay: 8 },
  };

  const EQUIPO = {
    termo: { name: 'Termo de acero', desc: 'El agua casi no se enfría con el fuego apagado.', price: 500, minDay: 2 },
    electrica: { name: 'Pava eléctrica con corte', desc: 'Elegís vos la temperatura de corte y la mantiene sola.', price: 1300, minDay: 4 },
    segundo: { name: 'Lugar para un 2° mate', desc: 'Dos mates en la mesa: uno dulce y otro amargo. (Necesitás 2 mates.)', price: 700, minDay: 5 },
  };

  // Compras con plata real (modo prueba hasta configurar un proveedor de pagos)
  const PREMIUM = [
    { id: 'vidas3', name: 'Pack de 3 vidas', desc: 'Si no llegás a la meta, repetís el día.', price: 'US$ 0,99' },
    { id: 'bolsa', name: 'Bolsa de plata', desc: 'Te suma $ 5.000 (ajustado por inflación).', price: 'US$ 1,99' },
    { id: 'sinads', name: 'Sin publicidad', desc: 'Chau anuncios para siempre.', price: 'US$ 2,99' },
  ];

  // Novedades que no son productos
  const FEATURES = [
    { day: 2, name: 'Desafíos', desc: 'Si alguien se va enojado, desafialo: piedra, papel o tijera.' },
    { day: 3, name: 'Truco cada 3 días', desc: 'Al terminar el día podés jugar un truco a 15 por plata.' },
    { day: 3, name: 'Pulseada', desc: 'Nuevo desafío: ¡a ver quién tiene más fuerza!' },
    { day: 4, name: 'Mano de truco', desc: 'Nuevo desafío: una mano de truco contra el enojado.' },
    { day: 5, name: 'Dos mates', desc: 'Comprá el lugar extra y cebá dulce y amargo a la vez.' },
  ];

  const LINES = {
    greet: ['¿Hay mate?', '¡Cebame uno, che!', '¿Se arma una ronda?', '¡Pasá el mate!', 'Uno y me voy... mentira.', '¿Me convidás uno?'],
    again: ['¡Otro!', '¡Dale, otro!', '¡Cebame otro!', 'Uno más, ¿dale?', '¿Me toca?'],
    great: ['¡Qué mate, por Dios!', '¡Este sabe cebar!', '¡Una masa!', '¡Está diez puntos!', '¡Como en el campo!', '¡Espectacular, che!', '¡Joya!'],
    ok: ['Zafa.', 'Está bien...', 'Pasable, che.', 'Ni fu ni fa.', 'Rico, rico.'],
    thanks: ['¡Gracias! Ya estoy.', 'Gracias, che. Me voy.', '¡Gracias! Qué buena ronda.'],
    impatient: ['Me tomo el bondi. ¡Chau!', '¡Me cansé de esperar!', 'Me voy a lo de la vecina...', '¿Y? ¿Para cuándo?'],
    chat: [
      '¿Viste a cuánto está el dólar?', 'Mañana llueve, me duele la rodilla.', 'El domingo hay asado.', '¡Qué calor que hace!',
      '¿Quién trajo bizcochitos?', 'Esta yerba está bárbara.', 'Todo aumentó otra vez...', '¿Vamos a ver el partido?',
      'Mi nieto se fue a España.', '¡Qué lindo día pa\' matear!', 'Ya no se consigue nada.', 'Che, ¿y el truco?',
    ],
    gringo: ['¡Qué rico el mate, boludou!', 'Very good, che.', '¡Mamita, qué bueno!'],
    influencer: ['¡Esto va directo a mis historias!', '¡Diez de diez, chicos!'],
    influencerBad: ['Uf... esto va a mis historias. Mal.', 'Le pongo una estrella.'],
    snackThanks: ['¡Gracias! Están buenísimas.', 'Mmm, ¡qué rico!', '¡Recién hechas!'],
    challenge: ['¿Ah sí? ¡Vení que te gano!', '¡Dale, a ver qué tenés!', 'Si gano, me pagás vos.'],
  };

  const COMPLAINTS = {
    first: ['¡El primero es pa\'l cebador!', '¿El primero a mí? ¡Tomalo vos!'],
    lavado: ['¡Está más lavado que media de gaucho!', '¡Está lavado, che!', 'Esto es agua sucia...'],
    lavandose: ['Se está lavando, ojo...', 'Ya está medio lavado.'],
    hervida: ['¡Hirviste el agua! Gusto a quemado.', '¡Agua hervida! Sacrilegio.'],
    sinAzucar: ['Está amargo... ¿y el azúcar?', '¡Te pedí dulce!'],
    pocoAzucar: ['Le falta azúcar a este.', 'Poné una cucharadita, che.'],
    conAzucar: ['¿¡Azúcar!? ¡Yo tomo amargo!', '¡Le pusiste azúcar! ¡Herejía!'],
    sinYuyo: ['¿Y el yuyito que te pedí?', 'Le faltan los yuyos.'],
    yerbaMala: ['¿Qué yerba es esta? ¡Yo tomo Canarita!', '¡Esta no es mi yerba, bo!'],
    frio: ['Esto es agua tibia, ¿me cargás?', 'Está frío, che.', '¡Más caliente, por favor!'],
    caliente: ['¡Me quemé la lengua!', '¡Está hirviendo!', '¡Ay! ¡Quema!'],
    poco: ['¡Qué mezquino! Llenalo, che.', '¿Y el agua? ¡Es un sorbito!'],
    rebalso: ['Me mojé toda la mano...', '¡Está todo chorreado!'],
    bombilla: ['¿¡Quién movió la bombilla!?', '¡La bombilla NO se toca!'],
    tapado: ['Se tapa la bombilla, mucha yerba.', 'No pasa nada, ¡está tapado!'],
    lento: ['Tardaste un montón...', '¡Por fin!'],
  };

  const NEWS = [
    'ÚLTIMO MOMENTO: la yerba aumentó otra vez',
    'El dólar blue cerró a $ {dolar}',
    'Inflación del día: 25%',
    'Pronóstico: mate todo el día',
    'Se viene el clásico del domingo',
    'Récord de ventas de bizcochitos de grasa',
    'Científicos confirman: el primero es del cebador',
    'Encuesta: 9 de cada 10 prefieren no mover la bombilla',
    'Alerta: agua hervida detectada en Caballito',
    'Torneo de truco en el club del barrio',
    'Faltante de medialunas en la panadería de la esquina',
  ];

  MP.DATA = { PERSONAS, SUEGRA, YERBAS, SUGAR, YUYOS, FOODS, MATES, BOMBILLAS, EQUIPO, PREMIUM, FEATURES, LINES, COMPLAINTS, NEWS };
})();
