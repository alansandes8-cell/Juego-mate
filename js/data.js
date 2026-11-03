/* Mate Perfecto — personajes, frases y mejoras */
(function () {
  'use strict';
  const MP = (window.MP = window.MP || {});

  // sweet / herb = probabilidad. temp = preferencia de temperatura.
  const PERSONAS = [
    { id: 'chola', name: 'Abuela Chola', skin: '#f3cfb0', hair: '#dedede', hairStyle: 'bun', shirt: '#9b5fa8', glasses: true, earrings: true,
      sweet: 0.85, temp: 'tibio', herb: 0.45, patience: 26 },
    { id: 'ruben', name: 'Tano Rubén', skin: '#e9b98f', hair: '#3a2a20', hairStyle: 'bald', shirt: '#2f5ea6', mustache: '#3a2a20',
      sweet: 0.05, temp: 'caliente', herb: 0.15, patience: 20 },
    { id: 'brian', name: 'Brian', skin: '#d9a27a', hair: '#2a1a10', hairStyle: 'gorra', hat: '#d33b2c', shirt: '#75aadb', stripes: true,
      sweet: 0.7, temp: 'justo', herb: 0.1, patience: 18 },
    { id: 'rosa', name: 'Doña Rosa', skin: '#f0c19a', hair: '#8a3320', hairStyle: 'curly', shirt: '#e07a3f', earrings: true,
      sweet: 0.5, temp: 'tibio', herb: 0.5, patience: 24 },
    { id: 'ramon', name: 'Don Ramón', skin: '#c98d62', hair: '#9a9a9a', hairStyle: 'boina', hat: '#1f1f2a', shirt: '#c9b48a', mustache: '#cfcfcf', scarf: '#c0392b',
      sweet: 0.0, temp: 'caliente', herb: 0.7, patience: 22 },
    { id: 'mirta', name: 'La Profe Mirta', skin: '#f2d2b6', hair: '#c9b27a', hairStyle: 'short', shirt: '#3f8f6e', glasses: true,
      sweet: 0.3, temp: 'justo', herb: 0.3, patience: 21 },
    { id: 'facu', name: 'Facu', skin: '#e3b38c', hair: '#3b2616', hairStyle: 'long', shirt: '#2b2b2b', beard: '#3b2616',
      sweet: 0.1, temp: 'justo', herb: 0.2, patience: 19 },
    { id: 'cami', name: 'Cami', skin: '#f5d0b5', hair: '#e0a93c', hairStyle: 'ponytail', shirt: '#f2c94c',
      sweet: 0.6, temp: 'tibio', herb: 0.3, patience: 20 },
  ];

  const SUEGRA = { id: 'suegra', name: 'La Suegra', skin: '#efc6a6', hair: '#7d6a8f', hairStyle: 'curly', shirt: '#b22d4a', glasses: true, earrings: true,
    sweet: 0.5, temp: 'justo', herb: 0.5, patience: 15, special: true };

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
  };

  // Quejas según el error más grave
  const COMPLAINTS = {
    first: ['¡El primero es pa\'l cebador!', '¿El primero a mí? ¡Tomalo vos!'],
    lavado: ['¡Está más lavado que media de gaucho!', '¡Está lavado, che!', 'Esto es agua sucia...'],
    lavandose: ['Se está lavando, ojo...', 'Ya está medio lavado.'],
    hervida: ['¡Hirviste el agua! Gusto a quemado.', '¡Agua hervida! Sacrilegio.'],
    sinAzucar: ['Está amargo... ¿y el azúcar?', '¡Te pedí dulce!'],
    conAzucar: ['¿¡Azúcar!? ¡Yo tomo amargo!', '¡Le pusiste azúcar! ¡Herejía!'],
    sinYuyo: ['¿Y la peperina?', 'Le faltan los yuyos.'],
    frio: ['Esto es agua tibia, ¿me cargás?', 'Está frío, che.', '¡Más caliente, por favor!'],
    caliente: ['¡Me quemé la lengua!', '¡Está hirviendo!', '¡Ay! ¡Quema!'],
    poco: ['¡Qué mezquino! Llenalo, che.', '¿Y el agua? ¡Es un sorbito!'],
    rebalso: ['Me mojé toda la mano...', '¡Está todo chorreado!'],
    bombilla: ['¿¡Quién movió la bombilla!?', '¡La bombilla NO se toca!'],
    tapado: ['Se tapa la bombilla, mucha yerba.', 'No pasa nada, ¡está tapado!'],
    lento: ['Tardaste un montón...', '¡Por fin!'],
  };

  const UPGRADES = [
    { id: 'termo', name: 'Termo de acero', desc: 'El agua casi no se enfría con el fuego apagado.', price: 500, icon: 'termo' },
    { id: 'corte', name: 'Pava con corte', desc: 'Apaga el fuego sola a 84°. ¡Nunca más hervida!', price: 750, icon: 'pava' },
    { id: 'premium', name: 'Yerba con palo premium', desc: 'Aguanta 4 cebadas más antes de lavarse.', price: 600, icon: 'yerba' },
    { id: 'calabaza', name: 'Mate de calabaza curado', desc: 'Todo sabe mejor: +8 de calidad.', price: 700, icon: 'mate' },
    { id: 'alpaca', name: 'Bombilla de alpaca', desc: 'Queda fachero: +50% de propinas.', price: 850, icon: 'bombilla' },
    { id: 'bizcochos', name: 'Bizcochitos de grasa', desc: 'La gente espera +40% más. Solo por un día.', price: 220, icon: 'bizcocho', consumable: true },
  ];

  const NEWS = [
    'ÚLTIMO MOMENTO: la yerba aumentó otra vez',
    'El dólar blue cerró a $ {dolar}',
    'Inflación del día: {infl}%',
    'Pronóstico: mate todo el día',
    'Se viene el clásico del domingo',
    'Récord de ventas de bizcochitos de grasa',
    'Científicos confirman: el primero es del cebador',
    'Encuesta: 9 de cada 10 prefieren no mover la bombilla',
    'Alerta: agua hervida detectada en Caballito',
  ];

  MP.DATA = { PERSONAS, SUEGRA, LINES, COMPLAINTS, UPGRADES, NEWS };
})();
