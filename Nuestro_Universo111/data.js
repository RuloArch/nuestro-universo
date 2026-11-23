/* ============================================================
   NUESTRO UNIVERSO — data.js
   Aquí vive TODO lo que se edita a mano:
   - textos del universo (UNIVERSE_CONFIG)
   - los 20 recuerdos (memories)

   CÓMO EDITAR UN RECUERDO
   -----------------------
   - title / date / figure: lo que aparece en el panel.
   - description: el texto del recuerdo. Escribe aquí lo que quieras
     contarle. Usa \n\n para separar párrafos.

   CÓMO ESTÁ HECHA UNA CONSTELACIÓN (solo si quieres retocar el dibujo)
   -------------------------------------------------------------------
   Las coordenadas son libres. El programa mide la figura completa,
   la centra y la encaja sola en la pantalla: nunca se recorta ni se
   deforma.

   stars: estrellas de la figura  ->  [x, y]      estrella chica
                                      [x, y, 1]   estrella grande
                                      [x, y, 2]   destello de 4 puntas
   lines: trazos que las conectan (formato "d" de SVG):
     "M10 10 L50 50"                         -> línea principal
     { d: "...", kind: "detail" }            -> línea fina de detalle
     { d: "...", kind: "trail", stars: 5 }   -> trayectoria tenue con
                                                estrellitas en el camino
     { d: "...", stars: 4 }                  -> agrega 4 estrellas
                                                repartidas en ese trazo
     { d: "...", transform: "rotate(-20 50 50)" } -> gira/mueve un trazo

   Al abrir el recuerdo: primero aparecen las estrellas, luego se van
   conectando en el orden de "lines" y al final todo brilla.
   ============================================================ */

const UNIVERSE_CONFIG = {
  her: "Hania",
  me: "Raúl",
  title: "Nuestro Universo",
  subtitle: "Toca una estrella para revivir un recuerdo",
  centralMessage: "Entre millones de estrellas, yo volvería a encontrarte.",
  secretStarMessage:
    "Encontraste una estrella que no estaba en el mapa. Esta guarda mi recuerdo favorito: tú.",
  signature: "✦ nuestro universo"
};

/* ---------- Herramientas de dibujo (no hace falta tocarlas) ---------- */

const circle = (cx, cy, r) =>
  `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy}`;

const ellipse = (cx, cy, rx, ry) =>
  `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;

/* corazón centrado en (cx, cy); s = medio ancho */
const heart = (cx, cy, s) =>
  `M${cx} ${cy + s * 0.95} ` +
  `C${cx - s * 0.25} ${cy + s * 0.72} ${cx - s} ${cy + s * 0.22} ${cx - s} ${cy - s * 0.32} ` +
  `C${cx - s} ${cy - s * 0.82} ${cx - s * 0.42} ${cy - s * 1.02} ${cx} ${cy - s * 0.55} ` +
  `C${cx + s * 0.42} ${cy - s * 1.02} ${cx + s} ${cy - s * 0.82} ${cx + s} ${cy - s * 0.32} ` +
  `C${cx + s} ${cy + s * 0.22} ${cx + s * 0.25} ${cy + s * 0.72} ${cx} ${cy + s * 0.95}`;

/* luna creciente; dir = 1 (abre a la derecha) o -1 (abre a la izquierda) */
const crescent = (cx, cy, r, dir = 1) => {
  const a = dir === 1 ? 0 : 1;
  const b = dir === 1 ? 1 : 0;
  return `M${cx} ${cy - r} A${r} ${r} 0 1 ${a} ${cx} ${cy + r} A${r * 0.58} ${r} 0 1 ${b} ${cx} ${cy - r}`;
};

/* nube de palomita: "bolitas" sobre un arco de a0 a a1 grados
   (180 = izquierda, 270 = arriba, 360 = derecha) */
const puff = (cx, cy, r, n, a0 = 180, a1 = 360) => {
  const step = (a1 - a0) / n;
  const chord = 2 * r * Math.sin(Math.abs(step) * Math.PI / 360);
  const br = +(chord * 0.58).toFixed(2);
  let d = "";
  for (let i = 0; i <= n; i++) {
    const ang = (a0 + step * i) * Math.PI / 180;
    const x = +(cx + Math.cos(ang) * r).toFixed(2);
    const y = +(cy + Math.sin(ang) * r).toFixed(2);
    d += i === 0 ? `M${x} ${y}` : ` A${br} ${br} 0 0 1 ${x} ${y}`;
  }
  return d;
};

/* pétalo/hoja en punta, de (x1,y1) a la punta (x2,y2); w = anchura */
const petal = (x1, y1, x2, y2, w) => {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len * w, ny = dx / len * w;
  const p = (t, k) => `${+(x1 + dx * t + nx * k).toFixed(2)} ${+(y1 + dy * t + ny * k).toFixed(2)}`;
  return `M${x1} ${y1} C${p(0.3, 1)} ${p(0.78, 0.85)} ${x2} ${y2} C${p(0.78, -0.85)} ${p(0.3, -1)} ${x1} ${y1}`;
};

/* florecita de 5 pétalos */
const flower = (cx, cy, r) => {
  let d = "";
  for (let i = 0; i < 5; i++) {
    const a = (-90 + i * 72) * Math.PI / 180;
    d += petal(cx, cy, +(cx + Math.cos(a) * r).toFixed(2), +(cy + Math.sin(a) * r).toFixed(2), r * 0.42) + " ";
  }
  return d + circle(cx, cy, r * 0.22);
};

/* balón de fútbol con su patrón de pentágonos */
const soccerBall = (cx, cy, r) => {
  const pt = (ang, k) => [+(cx + Math.cos(ang) * r * k).toFixed(2), +(cy + Math.sin(ang) * r * k).toFixed(2)];
  const pent = [], spokes = [], outer = [];
  for (let i = 0; i < 5; i++) {
    const a = (-90 + i * 72) * Math.PI / 180;
    const [px, py] = pt(a, 0.36);
    const [qx, qy] = pt(a, 0.68);
    const [ex1, ey1] = pt(a - 0.42, 1);
    const [ex2, ey2] = pt(a + 0.42, 1);
    pent.push(`${i ? "L" : "M"}${px} ${py}`);
    spokes.push(`M${px} ${py} L${qx} ${qy} M${ex1} ${ey1} L${qx} ${qy} L${ex2} ${ey2}`);
    outer.push([qx, qy, 0]);
  }
  return {
    lines: [
      { d: circle(cx, cy, r), stars: 7 },
      { d: pent.join(" ") + " Z", kind: "detail", stars: 5 },
      { d: spokes.join(" "), kind: "detail" }
    ],
    stars: outer
  };
};

const BALL8 = soccerBall(60.9, 41.2, 9.2);

/* figura de gol (balón + trayectoria + portería), usada en los partidos */
const GOAL_STARS = [
  ...BALL8.stars,
  [98.6, 10.7, 2], [122, 11.2, 2], [98.6, 24.6, 1], [121.4, 28.4, 2],
  [98.5, 14.8], [98.6, 18.7], [98.5, 22.1],
  [108.8, 18.9, 2]
];
const GOAL_LINES = [
  ...BALL8.lines,
  { d: "M67.6 34.5 Q80 24 98.5 18.7", kind: "trail", stars: 4 },
  { d: "M70.2 41 Q84 28 108.8 18.9", kind: "trail", stars: 5 },
  "M98.6 24.6 L98.6 10.7 L122 11.2 L121.4 28.4",
  { d: "M98.6 10.7 L104 14.2 L124.5 14.4 L122 11.2 M104 14.2 L104.3 24.4 L98.6 24.6 M124.5 14.4 L127.6 26.8 L121.4 28.4 M104.3 24.4 L127.6 26.8", kind: "detail", stars: 2 },
  { d: "M108.4 14.3 L108.6 24.8 M112.8 14.3 L113.1 25.3 M117.2 14.3 L117.8 25.8 M121.4 14.4 L122.4 26.2 M104.1 17.6 L125.3 17.8 M104.2 21 L126.2 21.4", kind: "detail" }
];

/* la misma figura en espejo (balón a la derecha, portería a la izquierda) */
const MIRROR_X = 179.3;
const mirrorStars = list => list.map(([x, y, k]) => [+(MIRROR_X - x).toFixed(2), y, k || 0]);
const mirrorLines = list => list.map(l => {
  const o = typeof l === "string" ? { d: l } : { ...l };
  o.transform = `translate(${MIRROR_X} 0) scale(-1 1)`;
  return o;
});

/* ============================================================
   LOS 20 RECUERDOS
   ============================================================ */

const memories = [
  {
    id: 1,
    title: "Picnic Metropolitano",
    date: "28/03/2026",
    figure: "una canasta de picnic",
    description: "Hoy nos reunimos en un parque para hacer un lindo picnic acompañados de una manta, pizza, vino y galletitas. La pasamos muy bien y pudimos ver los rayos del sol desvanecerse entre los árboles.",
    stars: [
      [50.9, 26.8, 2], [45.7, 28.3], [42.2, 31.3], [39.2, 37], [38.8, 42.4, 1],
      [55.9, 28.2], [59.4, 31.2], [62.5, 37], [63.4, 42.4, 1],
      [33.8, 44.1, 2], [67.9, 44.1, 2],
      [35.2, 48.9], [42.6, 48.9, 1], [50.9, 48.9], [59.1, 48.9, 1], [66.4, 48.9],
      [36.9, 54.8], [43, 54.8, 1], [50.9, 54.8, 1], [58.6, 54.8, 1], [64.6, 54.8],
      [38.8, 60.7, 1], [50.9, 60.7], [62.8, 60.7, 1],
      [28.2, 60, 1], [73.4, 60, 1], [23.7, 63.9], [77.8, 64],
      [18.4, 68.6, 2], [33.6, 68.6], [50.9, 68.6, 2], [68.1, 68.6], [82.8, 68.6, 2]
    ],
    lines: [
      "M38.8 43.4 C38.4 33 44 26.8 50.9 26.8 C57.8 26.8 63.6 33 63.2 43.4",
      "M33.8 44.1 L67.9 44.1",
      "M33.8 44.1 L38.8 60.7 L62.8 60.7 L67.9 44.1",
      "M35.2 48.9 L66.4 48.9 M36.9 54.8 L64.6 54.8",
      "M42.6 48.9 L43 54.8 M59.1 48.9 L58.6 54.8 M50.9 44.1 L50.9 68.6",
      "M28.2 60 L38.8 60.7 M62.8 60.7 L73.4 60 L82.8 68.6 L18.4 68.6 L28.2 60",
      { d: "M23.7 63.9 L77.8 64 M38.8 60.7 L33.6 68.6 M62.8 60.7 L68.1 68.6", kind: "detail" },
      { d: heart(66.6, 25.5, 2.9), stars: 4 },
      { d: heart(74.6, 34.4, 2.2), stars: 3 }
    ]
  },
  {
    id: 2,
    title: "Cita en cancha de basket",
    date: "19/03/2026",
    figure: "un balón entrando al aro",
    description: "Este día fue un momento muy especial, fue el comienzo de nuestras citas. Jugamos basket y conocimos más del otro, fue algo muy hermoso, nuestro primer beso dió lugar aquí, y terminamos platicando sobre nuestras vidas.",
    stars: [
      [49.5, 19.6, 1], [59.4, 20.8], [43, 26.5], [63.5, 26.2], [44.1, 35.2, 1], [63.5, 33],
      [52, 40.4], [60.9, 37.2], [58.9, 29.4, 1],
      [50.2, 50.1, 1], [78.2, 49.6, 1],
      [59.2, 53.3], [68.4, 53.3], [55.8, 61, 1], [63.7, 61.7], [71.8, 60.9, 1],
      [58, 69.1], [59.7, 67.2], [67.8, 67.2], [69.5, 69.1], [63.7, 74.1, 1]
    ],
    lines: [
      circle(53.3, 29.8, 10.6),
      "M49.5 19.6 Q61 27 52 40.4",
      "M43 26.5 Q52 25.2 58.9 29.4 Q61.5 31 63.5 33",
      "M44.1 35.2 Q52 31 58.9 29.4 Q61.5 28.4 63.5 26.2",
      "M59.4 20.8 Q65.5 29 60.9 37.2",
      { d: "M61.5 38.4 L66.6 47.6", kind: "trail", stars: 4 },
      ellipse(64.2, 49.9, 14, 2.4),
      "M50.2 50.1 L55.8 61 L58 69.1 L63.7 74.1 L69.5 69.1 L71.8 60.9 L78.2 49.6",
      "M59.2 53.3 L55.8 61 M59.2 53.3 L63.7 61.7 L68.4 53.3 L71.8 60.9",
      "M55.8 61 L59.7 67.2 L63.7 61.7 L67.8 67.2 L71.8 60.9 M59.7 67.2 L63.7 74.1 L67.8 67.2"
    ]
  },
  {
    id: 3,
    title: "Cafetería Moka & Kofi",
    date: "18/04/2026",
    figure: "dos tazas compartiendo vapor",
    description: "La cafetería favorita de Hanis, un Moka calientito y unos besos de angel deliciosos. Jugamos juegos de mesa como UNO y ajedrez jeje yo le gané a Hanis en ajedrez pero ella me ganó en el UNO. Tuve la oportunidad de regalarle uno de sus libros favoritos, \"Lo inevitable de nosotros\" por su cumpleaños que se acercaba. Sinceramente fue una cita maravillosa, ahora Moka & Kofi es de mis cafeterías favoritas <3",
    stars: [
      [19, 46, 1], [43, 46, 1], [24, 64, 1], [38, 64, 1], [13.2, 51.5], [20.7, 59.8],
      [57, 46, 1], [81, 46, 1], [62, 64, 1], [76, 64, 1], [86.8, 51.5], [79.3, 59.8],
      [50, 34.5, 1], [50, 24.4]
    ],
    lines: [
      "M19 46 L43 46 L38 64 L24 64 Z",
      "M20.3 51 C16 48 12.5 49.2 13.2 51.5 C14 55.5 17.5 59 20.7 59.8",
      "M57 46 L81 46 L76 64 L62 64 Z",
      "M79.7 51 C84 48 87.5 49.2 86.8 51.5 C86 55.5 82.5 59 79.3 59.8",
      { d: "M31 42 C28.5 38.5 33.5 36 32 32.5 C30.5 29 36 25.4 42.7 25.2", stars: 3 },
      { d: "M69 42 C71.5 38.5 66.5 36 68 32.5 C69.5 29 64 25.4 57.3 25.2", stars: 3 },
      { d: heart(50, 27.5, 7.3), stars: 6 },
      { d: "M10 68 L90 68", kind: "detail", stars: 3 }
    ]
  },
  {
    id: 4,
    title: "Cita afuera de la iglesia",
    date: "02/05/2026",
    figure: "una iglesia",
    description: "Hoy pude conocer uno de los lugares favoritos de Hanis, afuera de una iglesia donde ella daba clases de catecismo. Pude conocer más sobre ella al igual que ella de mí, agradezco que haya compartido este lugar seguro conmigo <3",
    stars: [
      [56.2, 17.5, 1], [52.8, 21.3, 1], [56.2, 21.3], [59.7, 21.3, 1], [56.3, 28.3, 1],
      [48.9, 37.6, 1], [63.6, 37.6, 1], [48.7, 48.2, 1], [63.6, 48.2, 1],
      [56.2, 41.8], [52.5, 45.7], [59.9, 45.7], [56.2, 49.7], [56.2, 45.7],
      [32.4, 57.9, 1], [79.9, 57.8, 1], [32.4, 72.4, 1], [48.7, 72.3, 1], [63.6, 72.3, 1], [79.9, 72.3, 1],
      [56.2, 57.8, 1], [51.6, 61.9, 1], [60.7, 61.9, 1], [51.6, 70.6, 1], [60.7, 70.6, 1],
      [40.1, 59.7], [38.2, 62], [41.9, 62], [38.2, 68.6], [41.9, 68.6],
      [72.2, 59.7], [70.4, 62], [74, 62], [70.4, 68.6], [74, 68.6]
    ],
    lines: [
      "M56.2 17.5 L56.2 28.3 M52.8 21.3 L59.7 21.3",
      "M56.3 28.3 L48.9 37.6 L63.6 37.6 Z",
      "M48.9 37.6 L48.7 72.3 M63.6 37.6 L63.6 72.3",
      ellipse(56.2, 45.7, 3.7, 4),
      "M56.2 41.8 L56.2 49.7 M52.5 45.7 L59.9 45.7",
      "M48.7 48.2 L32.4 57.9 L32.4 72.4 L48.7 72.3",
      "M63.6 48.2 L79.9 57.8 L79.9 72.3 L63.6 72.3",
      "M51.6 70.6 L51.6 61.9 C51.6 59.4 53.6 57.8 56.2 57.8 C58.8 57.8 60.7 59.4 60.7 61.9 L60.7 70.6",
      "M38.2 68.6 L38.2 62 C38.2 60.6 39 59.7 40.1 59.7 C41.2 59.7 41.9 60.6 41.9 62 L41.9 68.6 Z",
      "M70.4 68.6 L70.4 62 C70.4 60.6 71.1 59.7 72.2 59.7 C73.3 59.7 74 60.6 74 62 L74 68.6 Z"
    ]
  },
  {
    id: 5,
    title: "Feria del Libro",
    date: "09/05/2026",
    figure: "un libro abierto",
    description: "El día de hoy fuimos a la feria del libro en busca de varios libros, en este día Hanis conoció a mi mamá y mi hermano por primera vez, fue un lindo encuentro. Después de caminar bastante, nos dio hambre y fuimos a las hamburguesas RockStar. Ahí pudimos platicar más sobre nuestras vidas y gustos personales. Hanis y yo salimos de ahí mínimo con un libro cada uno jaja",
    stars: [
      [20.5, 29, 1], [75.4, 29, 1], [48, 36.6, 1], [20.5, 59.1, 1], [75.4, 59.1, 1], [48, 63.8, 1]
    ],
    lines: [
      "M20.5 29 C31 29.5 41 32.5 48 36.6 C55 32.5 65 29.5 75.4 29",
      "M20.5 29 L20.5 59.1 M75.4 29 L75.4 59.1",
      "M48 36.6 L48 63.8",
      "M20.5 59.1 C31 57 41 59.5 48 63.8 C55 59.5 65 57 75.4 59.1",
      { d: "M25 36 C32 36.2 38 37.6 43.5 40.6 M25 42 C32 42.2 38 43.6 43.5 46.6 M25 48 C32 48.2 38 49.6 43.5 52.6", kind: "detail" },
      { d: "M71 36 C64 36.2 58 37.6 52.5 40.6 M71 42 C64 42.2 58 43.6 52.5 46.6 M71 48 C64 48.2 58 49.6 52.5 52.6", kind: "detail" }
    ]
  },
  {
    id: 6,
    title: "Acuario · Aniversario",
    date: "23/05/2026",
    figure: "dos peces nadando juntos",
    description: "Un día muy especial, una cita en el acuario, 2 mokas fríos, sus chocolates favoritos, un brownie de su cafetería favorita, sus flores favoritas? Este día sin duda es muy especial, pues hoy fue el día en el que estaba muy nervioso por preguntarle a Hanis si podemos ser novios. Al llegar al túnel en el acuario saqué una carta, le dije que se volteara y comenzó a leerla, fue un momento muy bello, ya que la carta finalizaba con una frase, \"Me encantaría saber tu respuesta a la siguiente pregunta...\", ella volteó e hice la pregunta, respondió que siiii. Nos emocionamos mucho y después nos abrazamos y besamos.",
    stars: [
      [18.2, 34.6, 1], [21.4, 45.3, 1], [28.8, 38.9, 1], [33.3, 34.8], [40.6, 26.5, 1], [48.5, 29.9, 1],
      [60.1, 36.6, 1], [54.9, 34.9, 1], [51, 40.5, 1], [41, 44.7, 1],
      [84.6, 52.1, 1], [83.1, 64.1, 1], [74.8, 56.3, 1], [65.6, 44.5], [56.9, 47.9, 1], [68, 50.6],
      [45.5, 54.2, 1], [50.7, 52.7, 1], [54.1, 58.2, 1], [63.1, 62.1, 1]
    ],
    lines: [
      "M28.8 38.9 C35 33.5 42 30 48.5 29.9 C54 29.8 58 33 60.1 36.6 C56 40 50 41.3 43 41.2 C37 41 32 40.2 28.8 38.9",
      "M28.8 38.9 L18.2 34.6 Q23.5 39.5 21.4 45.3 Z",
      "M38.1 32 L40.6 26.5 Q46 27 48.5 29.9",
      "M42.3 41.1 L41 44.7 Q46 44.5 49.5 41",
      { d: "M54.9 34.9 Q53.6 38 51 40.5", kind: "detail" },
      "M74.8 56.3 C68.5 51 62.5 47.5 56.9 47.9 C51.5 48.3 47.5 51 45.5 54.2 C49.5 57.5 55 58.8 61.5 58.6 C67 58.4 71.5 57.6 74.8 56.3",
      "M74.8 56.3 L84.6 52.1 Q79 58.2 83.1 64.1 Z",
      "M56.9 47.9 L65.6 44.5 Q67.4 47.4 68 50.6",
      "M61.5 58.6 L63.1 62.1 Q58 61.8 54.8 59",
      { d: "M50.7 52.7 Q52.8 55.4 54.1 58.2", kind: "detail" }
    ]
  },
  {
    id: 7,
    title: "Cita de Sushi",
    date: "28/05/2026",
    figure: "sushi con palillos",
    description: "Sushi, una comida deliciosa. En este día llevé a mi hermosa novia a comer sushis en Locos X el Sushi, un restauran muy sabroso. Fue una cita llena de amor <3",
    stars: [
      [26.4, 50.2, 1], [59.2, 53.6, 1], [42.3, 54.4, 1], [50.6, 55.4, 1],
      [27.7, 55.2], [29, 60.1, 1], [34, 62.6], [41, 64, 1], [50, 64.1], [53.6, 62.9, 1], [56.5, 58.9],
      [63.3, 26.4, 1], [73.6, 59.8, 1], [69, 24.7, 1], [80, 57.9, 1],
      [50.3, 38.5, 2], [50.5, 32.3], [53.6, 35]
    ],
    lines: [
      "M26.4 50.2 C33 43.5 46 42.5 52 45.5 C55.5 47.3 58 50 59.2 53.6",
      "M26.4 50.2 C32 52.5 37 54 42.3 54.4 C46 54.7 49 55.4 50.6 55.4 C54 55.2 57 54.6 59.2 53.6",
      { d: "M35.6 44.6 Q40.5 48.5 42.3 54.4 M45.5 44.1 Q49.6 49 50.6 55.4 M53.8 46.4 Q56.5 49.6 56.6 54.9", kind: "detail" },
      "M27.7 52 C26.8 57 28.5 61.5 34 62.6 C38 63.6 46 64.4 50 64.1 C54 63.8 56.5 61 56.5 58.9 L56.6 55",
      "M63.3 26.4 L73.6 59.8",
      "M69 24.7 L80 57.9",
      { d: heart(42, 34.6, 3.3), stars: 5 }
    ]
  },
  {
    id: 8,
    title: "México vs Corea",
    date: "18/06/2026",
    figure: "un balón entrando a la portería",
    description: "El mundial, Mi bella novia pudo conocer a mi papá, vimos el partido de México contra Corea junto con mi hermano. Pudimos vernos gritar, desesperarnos y emocionarnos por un partido de futbol. Sin duda me encantó esta cita.",
    stars: GOAL_STARS,
    lines: GOAL_LINES
  },
  {
    id: 9,
    title: "Películas en el Coche",
    date: "20/06/2026",
    figure: "nuestro Mazda 3 frente a la pantalla",
    description: "2 películas distintas, pero hay 2 personas que las conectan y solo podemos ser mi novia y yo. La Princesa y el Sapo y Your Name, 2 de nuestras películas favoritas compartiendo momentos inolvidables juntas, en el auto con golosinas y palomitas nos envolvía una atmósfera en donde parecíamos estar solamente Hanis y yo",
    stars: [
      [44.9, 38.1, 1], [68.1, 38.1, 1], [41.2, 45.6], [71.8, 45.6],
      [36.4, 47.6], [76.6, 47.6], [41.2, 50.1], [71.8, 50.1],
      [36, 59.6, 1], [77, 59.6, 1], [41, 61, 1], [72, 61, 1], [36.3, 64.4, 1], [76.7, 64.4, 1],
      [74.8, 19.8, 1], [107, 23.8, 1], [105.3, 41.9, 1], [73.2, 37.7, 1],
      [87.1, 27], [93.3, 31.6], [86.2, 34.6],
      [85.6, 53], [91, 53], [86.1, 59.3], [90.2, 59.3],
      [92.2, 55], [96.4, 55], [92.8, 60.3], [95.8, 60.3]
    ],
    lines: [
      /* Mazda 3 visto desde atrás */
      "M44.9 38.1 Q56.5 37 68.1 38.1",
      "M44.9 38.1 L41.2 45.6 M68.1 38.1 L71.8 45.6",
      "M41.2 45.6 C38.5 46 36.6 47.2 36.3 50.5 L36 59.6 L36.3 64.4 L40.8 64.4 L41 61",
      "M71.8 45.6 C74.5 46 76.4 47.2 76.7 50.5 L77 59.6 L76.7 64.4 L72.2 64.4 L72 61",
      "M36 59.6 L41 61 L72 61 L77 59.6",
      "M36.5 47.4 Q56.5 44.6 76.5 47.4",
      { d: "M36.8 48.6 L41.2 50.1 L47.6 49.8 M76.2 48.6 L71.8 50.1 L65.4 49.8", kind: "detail" },
      { d: "M42 51 C42 54.8 45 55.8 56.5 55.8 C68 55.8 71 54.8 71 51", kind: "detail" },
      { d: "M37.4 57 Q56.5 55 75.6 57", kind: "detail" },
      { d: ellipse(56.5, 48.6, 1.7, 1.15) + " M55.3 49.2 L56.5 47.9 L57.7 49.2", kind: "detail" },
      { d: "M37.2 46.6 L34.9 45.2 Q34.2 46.6 36.4 47.3 M75.8 46.6 L78.1 45.2 Q78.8 46.6 76.6 47.3", kind: "detail" },
      /* pantalla */
      "M74.8 19.8 L107 23.8 L105.3 41.9 L73.2 37.7 Z",
      "M87.1 27 L93.3 31.6 L86.2 34.6 Z",
      /* luna */
      { d: crescent(34.3, 22.4, 5), stars: 2, transform: "rotate(-35 34.3 22.4)" },
      /* palomitas y refresco */
      "M85.6 53 L86.1 59.3 L90.2 59.3 L91 53 Z",
      { d: "M85.6 53 C85 51.4 86.3 50.4 87.3 51.1 C87.6 49.7 89.6 49.7 89.9 51.1 C90.9 50.5 92 51.6 91 53", kind: "detail" },
      "M92.2 55 L92.8 60.3 L95.8 60.3 L96.4 55 Z",
      { d: "M91.9 55 L96.7 55 M95.2 55 L95.9 52.2 L97 52.2", kind: "detail" },
      /* loma y pasto */
      { d: "M9.5 65.5 Q24 61.5 36 60.6 M77 60.6 Q96 61 112 64.5", kind: "detail", stars: 3 },
      { d: "M22.5 60.4 L21.8 57.8 M23.6 60.2 L23.8 57 M24.8 60.1 L25.8 57.9 M100.5 60.6 L100 58 M101.6 60.7 L101.9 57.5 M102.8 60.9 L103.8 58.4", kind: "detail" }
    ]
  },
  {
    id: 10,
    title: "Cita de Helado",
    date: "23/06/2026",
    figure: "un helado",
    description: "El día de hoy fuimos por un helado de vainilla muy sabroso, luego de ahí Hanis me acompañó a comprar un mandado que me habían encargado de Waltmart, ahí encontramos unos chocolates muy ricos \"Chocolates Costanzo\".",
    stars: [
      [61.3, 17.2, 2], [55, 19.2], [67.6, 19.2], [50.6, 23.6], [72, 23.6], [48.3, 33, 2], [73.3, 33, 2],
      [47.9, 38], [53.5, 41], [57.5, 39.5], [63.5, 38.9], [67.6, 41.2], [73.4, 38],
      [51.3, 42.7, 2], [69.6, 42.7, 2], [60, 72, 2],
      [56.9, 49.3], [58.8, 55.7], [60.7, 62.1], [60.9, 49.3], [62.8, 55.7], [64.9, 49.3],
      [61.9, 66.2], [64, 59.8], [66.1, 53.4], [53.1, 48.7], [55, 55.1], [56.9, 61.5], [58.8, 67.9]
    ],
    lines: [
      "M47.9 37 C46.5 26 52.5 17.5 61.3 17.2 C70 17.5 75.3 26 73.6 37",
      "M47.9 37 C46.8 39.8 49.3 41.8 51.3 41.4 C52 42.5 55.5 42.4 57.5 39.5 C59.2 37.8 62.3 37.6 63.5 38.9 C64.7 41.6 66.8 42 67.6 41.2 C70.5 42.2 74.5 40.5 73.6 37",
      { d: "M51.6 31 C51.2 26 54.3 21.6 58.5 20.3", kind: "detail" },
      "M51.3 42.7 L60 72 L69.6 42.7",
      { d: "M51.3 42.7 Q60.4 44 69.6 42.7", kind: "detail" },
      { d: "M55 42.9 L61.9 66.2 M59 42.9 L64 59.8 M63 42.9 L66.1 53.4 M67 42.9 L68.2 47 M55 42.9 L53.1 48.7 M59 42.9 L55 55.1 M63 42.9 L56.9 61.5 M67 42.9 L58.8 67.9", kind: "detail" },
      { d: crescent(31.2, 23.4, 4.4), stars: 2, transform: "rotate(30 31.2 23.4)" }
    ]
  },
  {
    id: 11,
    title: "México vs Chequia",
    date: "24/06/2026",
    figure: "un balón con trayectoria de gol",
    description: "Hoy se enfrentan México vs República Chequia, nos reunimos en un restauran de alitas para verlo junto con más amigo. El resultado? 3-0 Favor México. ¡Ganamos! fue un día muy emocionante.",
    stars: mirrorStars(GOAL_STARS),
    lines: mirrorLines(GOAL_LINES)
  },
  {
    id: 12,
    title: "Parque Explora",
    date: "21/07/2026",
    figure: "una banca en el parque",
    description: "Este día fue un día muy representativo ya que no vi a mi amorcito durante casi un mes, ya que me había ido a Francia. Aunque la distancia no pudo con nosotros porque nuestro amor es más fuerte. Le pude contar todas mis experiencias nuevas y obviamente le traje unos lindos detallitos.",
    stars: [
      [48.6, 19.9, 1], [45, 23.5, 1], [52, 23.5, 1], [48.5, 30.4, 1], [48.6, 33, 1], [48.6, 52.4, 1],
      [41.5, 60.5, 1], [48.6, 60.5, 1], [55.6, 60.5, 1], [85.4, 60.5, 1], [92.6, 60.5, 1],
      [57, 43.9, 1], [84, 43.9, 1], [57, 47.7, 1], [84, 47.7, 1], [57, 51.6], [84, 51.6],
      [55.1, 52.6, 1], [85.9, 52.6, 1],
      [69.5, 32.7, 1], [75.3, 37.9]
    ],
    lines: [
      "M48.6 19.9 L52 23.5 L50.4 29.8 L46.6 29.8 L45 23.5 Z",
      { d: "M45 23.5 L52 23.5 M48.6 19.9 L48.5 29.8", kind: "detail" },
      "M48.6 30.4 L48.6 60.5",
      "M41.5 60.5 L92.6 60.5",
      "M57 43.9 L84 43.9 M57 47.7 L84 47.7",
      "M57 43.9 L57 51.6 M84 43.9 L84 51.6 M57 51.6 L84 51.6",
      "M55.1 52.6 L85.9 52.6 M55.6 52.6 L55.6 60.5 M85.4 52.6 L85.4 60.5",
      { d: crescent(91.5, 27.2, 3.6, -1), stars: 2, transform: "rotate(-25 91.5 27.2)" },
      { d: "M69.5 32.7 L75.3 37.9", kind: "detail" }
    ]
  },
  {
    id: 13,
    title: "Cita de Tacos",
    date: "21/07/2026",
    figure: "un taco",
    description: "Después de el parque explora fuimos por unos tacos muy sabrosos y nos dimos muchos besitos<3",
    stars: [
      [18.3, 55.4, 2], [21.4, 46.9], [25.8, 40.5, 1], [32.9, 33, 1], [45.9, 28.2, 1], [56, 30, 1],
      [62.8, 33.7, 1], [70.4, 40.8], [75.3, 55.3, 2], [66.3, 59.8, 2],
      [42.1, 37.1, 1], [60.9, 49.1, 1],
      [33.9, 36.4], [37.6, 33.2], [43.1, 34], [47.9, 34.8], [51.9, 32.2], [56, 34.3, 1], [54.2, 39.1],
      [59.8, 38.9], [64.1, 41.7], [64.7, 47.1], [69.5, 47.4], [72.7, 49.9], [68.2, 50.7], [70.7, 54.8]
    ],
    lines: [
      "M18.3 55.4 C19 47 26 38 34 32.6 C40 29 46 28.1 50 28.3 C61 29 70 37 73 45 C74.6 49 75.4 52.5 75.3 55.3",
      "M18.3 55.4 L66.3 59.8 L75.3 55.3",
      "M25.8 40.5 C31 37.5 37 36.5 42.1 37.1 C50 38 56.5 42.5 60.9 49.1 C63.3 52.6 65.2 56.2 66.3 59.8",
      "M33.9 36.4 L37.6 33.2 L43.1 34 L47.9 34.8 L51.9 32.2 L56 34.3 L54.2 39.1 L59.8 38.9 L64.1 41.7 L64.7 47.1 L69.5 47.4 L72.7 49.9",
      "M60.9 49.1 L68.2 50.7 L70.7 54.8",
      { d: "M56 30 L56 34.3", kind: "detail" }
    ]
  },
  {
    id: 14,
    title: "Entre Flores y Amor",
    date: "22/07/2026",
    figure: "una flor grande",
    description: "Este día he sorprendido a Hanis con sus flores favoritas, claveles y margaritas, acompañadas de un lindo florero, quedó muy sorprendida por este lindo detalle, tanto que me dio muchos besitos <3",
    stars: [
      [52.5, 35.8, 2], [53.9, 9.8, 1], [28.3, 26.7, 1], [77.4, 29.7, 1], [36.6, 52.1, 1], [65.9, 54.5, 1],
      [53.1, 57.4], [48.7, 85.8, 1], [35, 59.9, 1], [64.4, 64.3, 1]
    ],
    lines: [
      { d: petal(52.5, 35.8, 53.9, 9.8, 7.4), stars: 4 },
      { d: petal(52.5, 35.8, 28.3, 26.7, 6.4), stars: 4 },
      { d: petal(52.5, 35.8, 77.4, 29.7, 6.4), stars: 4 },
      { d: petal(52.5, 35.8, 36.6, 52.1, 6.6), stars: 4 },
      { d: petal(52.5, 35.8, 65.9, 54.5, 6.6), stars: 4 },
      "M52.5 35.8 C53.6 48 53.6 60 52.3 71 C51.5 77 50.2 81.5 48.7 85.8",
      { d: petal(51.6, 76.5, 35, 59.9, 5), stars: 4 },
      { d: petal(52.2, 74, 64.4, 64.3, 4.2), stars: 4 },
      { d: "M52.5 35.8 L53.5 21", kind: "detail" }
    ]
  },
  {
    id: 15,
    title: "Cita en el Cine",
    date: "03/08/2026",
    figure: "unas palomitas",
    description: "Fuimos a ver la película de Spider-Man: Brand New Day, acompañados de palomitas y refrescos. Disfrutamos la película al máximo y lo mejor es que fue a su lado <3",
    stars: [
      [39.2, 42, 2], [71, 42, 2], [45.6, 43.2, 1], [55.1, 44.3, 2], [64.5, 43.2, 1],
      [44.7, 68.2, 2], [55, 71.8, 2], [65.4, 68.3, 2]
    ],
    lines: [
      "M39.2 42 L55.1 44.3 L71 42",
      "M39.2 42 L44.7 68.2 L55 71.8 L65.4 68.3 L71 42",
      "M45.6 43.2 L49 69.9 M55.1 44.3 L55 71.8 M64.5 43.2 L61 69.9",
      { d: puff(42.8, 39.6, 4.3, 4, 160, 345), stars: 4 },
      { d: puff(53, 34.6, 6.4, 6, 168, 372), stars: 6 },
      { d: puff(67.3, 38.4, 4.8, 4, 195, 385), stars: 4 },
      { d: puff(62, 26.8, 2.9, 6, 0, 360), stars: 3 }
    ]
  },
  {
    id: 16,
    title: "Escapada de estadística",
    date: "14/08/2026",
    figure: "un paraguas bajo la lluvia",
    description: "Oh no, no alcanzas a llegar amor, y si te quedas?\n\nAsí fue, un día nos vimos en una hora libre y se nos hizo un poco tarde jaja. Así que decidimos quedarnos juntitos <3",
    stars: [
      [50, 10, 2], [14, 46, 1], [86, 46, 1], [26, 46], [38, 46], [50, 46, 1], [62, 46], [74, 46],
      [50, 66], [41.5, 58, 1], [58.5, 58, 1], [34.5, 66.5], [48.5, 66.5], [51.5, 66.5], [65.5, 66.5],
      [31, 73, 1], [52, 73], [48, 73], [69, 73, 1]
    ],
    lines: [
      { d: "M14 46 C16 22 34 10 50 10 C66 10 84 22 86 46", stars: 5 },
      "M14 46 Q20 40.5 26 46 Q32 40.5 38 46 Q44 40.5 50 46 Q56 40.5 62 46 Q68 40.5 74 46 Q80 40.5 86 46",
      { d: "M50 10 Q34 22 38 46 M50 10 L50 46 M50 10 Q66 22 62 46 M50 10 Q24 18 26 46 M50 10 Q76 18 74 46", kind: "detail" },
      "M50 46 L50 66",
      "M31 73 Q31.5 66.5 41.5 66.4 Q48 66.5 48 73",
      "M52 73 Q52 66.5 58.5 66.4 Q68.5 66.5 69 73",
      { d: "M8 18 L6 24 M20 4 L18 10 M82 2 L80 8 M94 18 L92 24 M6 52 L4 58 M96 50 L94 56 M10 70 L8 76 M92 70 L90 76 M34 0 L32 6 M66 0 L64 6", kind: "detail" },
      { d: "M24 80 Q50 85 76 80", kind: "detail", stars: 3 }
    ]
  },
  {
    id: 17,
    title: "Comida en Casa de la Abuela",
    date: "22/08/2026",
    figure: "una casa con un corazón dentro",
    description: "Mi abuela preparó comida e invitamos a mi bella novia a comer. Conoció a mi tía, Brenda, y a Choco, la perrhija de mi abuela y mi tía.",
    stars: [
      [48.3, 19.7, 2], [26.1, 37.4, 2], [70.6, 37.4, 2], [26.1, 66.4, 2], [70.6, 66.4, 2],
      [62.9, 23.8, 1], [68.1, 23.8], [62.8, 31.1], [68.1, 35.3],
      [48.3, 39.7], [44.6, 37.9, 1], [52.1, 37.9, 1], [42.2, 41.4, 1], [54.5, 41.4, 1], [48.3, 47.9, 1],
      [48.3, 53.3, 2], [39.1, 57.4], [57.6, 57.4], [48.3, 57.4],
      [34.8, 53.3], [35.8, 60.5], [40.8, 60.5], [35, 65.8], [40.8, 65.8],
      [61.8, 53.3], [60.8, 60.5], [55.7, 60.6], [61.4, 65.8], [55.7, 65.9]
    ],
    lines: [
      "M26.1 37.4 L48.3 19.7 L70.6 37.4",
      "M26.1 37.4 L26.1 66.4 L70.6 66.4 L70.6 37.4",
      "M62.8 31.1 L62.9 23.8 L68.1 23.8 L68.1 35.3",
      heart(48.3, 43, 6.2),
      "M39.1 57.4 L57.6 57.4 M48.3 57.4 L48.3 53.3",
      { d: "M40.2 56.2 Q41.9 58.9 43.6 56.2 Z M52.9 56.2 Q54.6 58.9 56.3 56.2 Z", kind: "detail" },
      "M34.8 53.3 L35.8 60.5 L35 65.8 M35.8 60.5 L40.8 60.5 L40.8 65.8",
      "M61.8 53.3 L60.8 60.5 L61.4 65.8 M60.8 60.5 L55.7 60.6 L55.7 65.9"
    ]
  },
  {
    id: 18,
    title: "Coche y Clases de Guitarra",
    date: "24/08/2026",
    figure: "una cita en el coche",
    description: "Un día nos vimos después de clases y Hanis no alcanzó a llegar a su clase de guitarra, así que decidimos quedarnos juntos y pasar una tarde muy bella.",
    stars: [
      [37.8, 33.9, 1], [61.4, 33.9, 1], [49.6, 33.6], [49.6, 36.6],
      [43.6, 39.9, 1], [55.7, 39.9, 1], [40.6, 42.8], [46.4, 42.8], [52.7, 42.8], [58.6, 42.8],
      [39.4, 45.2], [47.6, 45.2], [51.5, 45.2], [59.7, 45.2],
      [32.3, 46.1, 1], [66.7, 46.1, 1], [29.4, 43], [26.6, 44.5, 1], [29.4, 45.9], [69.3, 43], [72.3, 44.4, 1], [69.5, 45.9],
      [29.1, 50.5, 1], [69.6, 50.6, 1], [32.9, 53.2, 2], [65.8, 53.2, 2], [36, 51.4], [62.9, 51.4],
      [38.7, 54.1, 1], [60.1, 54.1, 1], [29.2, 59.4, 1], [69.5, 59.4, 1], [35.3, 60.7, 1], [63.4, 60.6, 1],
      [29.9, 65.5, 1], [34.8, 65.5, 1], [63.9, 65.5, 1], [68.8, 65.5, 1]
    ],
    lines: [
      "M37.8 33.9 Q49.6 33.2 61.4 33.9",
      "M37.8 33.9 L32.3 46.1 M61.4 33.9 L66.7 46.1",
      "M32.3 46.1 Q49.5 45.4 66.7 46.1",
      { d: "M49.6 33.6 L49.6 36.6 M47.6 36.6 L51.6 36.6", kind: "detail" },
      "M39.4 45.2 Q40 42.6 43.6 42.5 Q47 42.6 47.6 45.2 M51.5 45.2 Q52.2 42.6 55.7 42.5 Q59 42.6 59.7 45.2",
      "M32.3 46.1 L29.4 45.9 L26.6 44.5 L29.4 43 L31 44.6 M66.7 46.1 L69.5 45.9 L72.3 44.4 L69.3 43 L68 44.6",
      "M32.3 46.1 L29.1 50.5 L29.2 59.4 M66.7 46.1 L69.6 50.6 L69.5 59.4",
      "M29.1 50.5 L36 51.4 L38.7 54.1 L60.1 54.1 L62.9 51.4 L69.6 50.6",
      "M29.2 59.4 L35.3 60.7 L63.4 60.6 L69.5 59.4",
      "M29.2 59.4 L29.9 65.5 L34.8 65.5 L35.3 60.7 M63.4 60.6 L63.9 65.5 L68.8 65.5 L69.5 59.4"
    ]
  },
  {
    id: 19,
    title: "Café y Amor",
    date: "29/08/2026",
    figure: "una taza de café con vapor romántico",
    description: "Este día tuvimos una cita romántica y después fuimos por unos mokas calientitos y sabrosos.",
    stars: [
      [39.3, 45.6, 1], [67.1, 45.7, 1], [44.7, 65.3, 1], [61.6, 65.3, 1],
      [74.2, 50, 1], [65.5, 61, 1], [65.9, 52.4],
      [53.6, 18.9, 1], [47.3, 33.4, 1], [50.7, 41.1], [59.6, 28.7, 1], [57.3, 41.1, 1]
    ],
    lines: [
      "M39.3 45.6 L67.1 45.7",
      "M39.3 45.6 L44.7 65.3 L61.6 65.3 L67.1 45.7",
      "M65.9 52.4 C68.5 49.5 73 48.5 74.2 50 C75.3 53.5 70 59 65.5 61",
      "M50.7 41.1 C49.5 38.6 46.8 36.4 47.3 33.4 C48 28.5 54.6 24.6 53.6 18.9",
      "M57.3 41.1 C56 38.5 55.2 35.6 55.8 32.8 C56.4 30.6 57.8 29.4 59.6 28.7"
    ]
  },
  {
    id: 20,
    title: "Cena Romántica",
    date: "13/09/2026",
    figure: "una mesa para dos bajo la luna",
    description: "Tuve la oportunidad de llevar a mi hermosa novia a un restaurante muy rico, 500 Noches. Fue una cena algo elegante y deliciosa. Ahí tuvimos diversas pláticas muy amenas y divertidas como el qué nos traían el niño Dios, Reyes o Santa. Honestamente nos divertimos mucho en esta cita y fue una de las mejores.",
    stars: [
      [47, 49.7, 1], [78.8, 49.7, 1], [62.9, 50.1, 1], [62.8, 62.6, 1], [57.5, 66.7, 1], [68.1, 66.7, 1],
      [37, 41.6, 1], [40.9, 56.9, 1], [50.3, 57, 1], [38.9, 66.5, 1], [51.7, 66.7, 1],
      [88.3, 41.6, 1], [84.4, 56.9, 1], [74.9, 57, 1], [86.4, 66.5, 1], [73.6, 66.7, 1],
      [62.9, 38, 2], [54.2, 40.7], [56.5, 40.7], [55.3, 44.7], [69.3, 40.7], [71.6, 40.7], [70.5, 44.7],
      [57, 13.5, 2], [70.3, 22.5, 2], [45.6, 26.4, 2], [76.9, 27.2, 2], [50.6, 33.8, 2], [74.8, 34.4, 2]
    ],
    lines: [
      "M47 49.7 L78.8 49.7",
      "M62.9 50.1 L62.8 62.6 L57.5 66.7 L68.1 66.7 Z",
      "M37 41.6 L40.9 56.9 L50.3 57 M40.9 56.9 L38.9 66.5 M50.3 57 L51.7 66.7",
      "M88.3 41.6 L84.4 56.9 L74.9 57 M84.4 56.9 L86.4 66.5 M74.9 57 L73.6 66.7",
      "M53.9 40.7 L56.8 40.7 C57.1 43 56.5 44.4 55.35 44.8 C54.2 44.4 53.6 43 53.9 40.7 M55.35 44.8 L55.35 48 M53.9 48.3 L56.8 48.3",
      "M69.1 40.7 L72 40.7 C72.3 43 71.7 44.4 70.55 44.8 C69.4 44.4 68.8 43 69.1 40.7 M70.55 44.8 L70.55 48 M69.1 48.3 L72 48.3",
      "M62.4 40.4 L62.4 47.6 L63.4 47.6 L63.4 40.4 Z",
      { d: "M61.2 48.3 L64.6 48.3 M48.4 47.6 Q50.6 48.8 52.8 47.6 Z M72.9 47.6 Q75.1 48.8 77.3 47.6 Z", kind: "detail" },
      { d: crescent(63.5, 23.4, 5.3), stars: 4, transform: "rotate(-40 63.5 23.4)" }
    ]
  },

  /* ===================== 21 – 29 ===================== */

  {
    id: 21,
    title: "Día de pozole con amigos",
    date: "25/09/2026",
    figure: "un tazón de pozole humeante con nuestros amigos",
    description: "Pozoleeeeee! Hanis nos recomendó un lugar muy rico para comer pozole cerca de su casa, la verdad estaba tan delicioso que días después llevé a mi mamá y a mi hermano.",
    stars: [
      [62.4, 13.6, 2],
      [38.6, 56.9, 1], [83.4, 56.9, 1], [61.2, 50.6, 1], [61.2, 75.8, 1],
      [60.3, 29.1, 1], [55.2, 37.3], [68.8, 37.1],
      [20.8, 51.2, 1], [33.6, 46, 1], [44.9, 41.3, 1], [101.5, 51, 1], [88.8, 46, 1], [77.6, 41.6, 1]
    ],
    lines: [
      ellipse(61, 56.8, 22.4, 6.2),
      "M38.6 56.9 C40 68 50 75.8 61.2 75.8 C72 75.8 82 68 83.4 56.9",
      { d: circle(50, 57.5, 1.6) + " " + circle(55, 56.2, 1.6) + " " + circle(66, 56.6, 1.6) + " " + circle(72, 57.8, 1.6), kind: "detail" },
      { d: "M58 56 L62 52.8 L64.5 56.5 M60 55 L61.5 58.5", kind: "detail" },
      { d: "M61.2 63.5 C59.6 66 59.8 68 61.2 69.5 C62.6 68 62.8 66 61.2 63.5 M57 66 Q55.6 68.5 58.3 69.6 M65.4 66 Q66.8 68.5 64.1 69.6", kind: "detail" },
      "M60.3 29.1 C62.5 32.5 58.5 35.5 60.5 39 C62.5 42.5 59.5 44.5 60.6 47",
      "M55.2 37.3 C57 40 54 42.5 55.4 46",
      "M68.8 37.1 C67 40 70 42.5 67.4 46",
      /* amigos a la izquierda */
      { d: circle(37.4, 33.6, 3.3), stars: 3 },
      "M31.5 43.2 C32.5 39.3 35 37.6 38.3 37.6 C41.6 37.6 44 39 44.9 41.3",
      { d: circle(27.2, 38.9, 3.2), stars: 3 },
      "M20.8 51.2 C21 45.5 24 42.6 27.3 42.6 C30.5 42.6 32.8 44 33.6 46",
      "M20.8 51.2 L33.6 46 L44.9 41.3",
      /* amigos a la derecha */
      { d: circle(85.6, 33.6, 3.2), stars: 3 },
      "M77.6 41.6 C78.5 38.8 81.6 37.4 85.2 37.4 C88.5 37.4 90.6 38.8 91.4 41.6",
      { d: circle(95.2, 38.6, 3.2), stars: 3 },
      "M88.8 46 C89.5 43.5 92 42.2 95.2 42.2 C98.6 42.2 101.2 45 101.5 51",
      "M77.6 41.6 L88.8 46 L101.5 51",
      { d: crescent(24.6, 21.3, 4.5), stars: 2, transform: "rotate(-35 24.6 21.3)" }
    ]
  },
  {
    id: 22,
    title: "Cumpleaños de Sofi",
    date: "27/09/2026",
    figure: "una mesa de cumpleaños con amigos y la alberca de fondo",
    description: "De las primeras fiestas a la que vamos y fue una cita algo curiosa, ya que la locación del lugar era MUY MUY LEJANA, esperamos mucho tiempo afuera, pero cuando logramos entrar fueron puras risas y diversión. Pude ver a mi novia en traje de baño, waow se veía bellísima, al igual que ella me vio en traje de baño a mí. La pasamos genial ese día.",
    stars: [
      [64.2, 13.6, 2],
      [48.5, 38.5, 1], [82.4, 38.5, 1], [34.8, 49.1, 1], [89.8, 49.1, 1],
      [31.3, 43.2, 2], [93.7, 43.2, 2],
      [49.7, 60.5, 1], [73.8, 60.5, 1], [44.8, 68.3, 1], [78.5, 68.3, 1], [45.7, 76.8], [77.3, 76.8],
      [60.2, 59.4], [61.8, 59.2, 2], [63.4, 59.4]
    ],
    lines: [
      /* alberca */
      "M48.5 38.5 L82.4 38.5 L89.8 49.1 L34.8 49.1 Z",
      { d: "M50 40.2 L81 40.2 L86.8 47.6 L38.2 47.6 Z", kind: "detail" },
      { d: "M48 43 Q50 42 52 43 Q54 44 56 43 M60 44.6 Q62 43.6 64 44.6 Q66 45.6 68 44.6 M70 42.2 Q72 41.2 74 42.2 Q76 43.2 78 42.2 M52 46 Q54 45 56 46 Q58 47 60 46", kind: "detail" },
      { d: "M75.4 40.6 L75.4 36.3 Q75.4 34.8 76.6 34.8 Q77.8 34.8 77.8 36.3 L77.8 42.5 M79.6 39.4 L79.6 36.3 Q79.6 34.8 80.8 34.8 Q82 34.8 82 36.3 L82 38.5 M75.4 37.4 L77.8 37.4 M75.4 39.4 L77.8 39.4", kind: "detail" },
      { d: puff(38, 41.3, 7, 5, 185, 355), kind: "detail" },
      { d: puff(92, 41.3, 6.6, 5, 185, 355), kind: "detail" },
      { d: "M23 42.8 L28.5 42.8 M96.5 42.8 L103 42.8 M31.3 43.2 L31.3 46.8 M93.7 43.2 L93.7 46.8", kind: "detail" },
      /* mesa con pastel */
      "M49.7 60.5 L73.8 60.5 L78.5 68.3 L44.8 68.3 Z",
      { d: "M44.8 68.3 L45.7 76.8 M78.5 68.3 L77.3 76.8 M45.7 76.8 Q61.5 78.4 77.3 76.8", kind: "detail" },
      { d: ellipse(61.8, 62, 3.4, 0.9) + " M58.4 62 L58.4 64.4 Q61.8 66 65.2 64.4 L65.2 62 M60.2 61.3 L60.2 59.6 M61.8 61.1 L61.8 59.4 M63.4 61.3 L63.4 59.6", kind: "detail" },
      /* amigos alrededor */
      { d: circle(53.8, 55.2, 1.9) + " " + circle(70.2, 55.2, 1.9), stars: 2 },
      "M50.6 60.5 Q51 57.4 53.8 57.4 Q56.6 57.4 57 60.5 M67 60.5 Q67.4 57.4 70.2 57.4 Q73 57.4 73.4 60.5",
      { d: circle(43.4, 60.6, 2) + " " + circle(80, 60.6, 2), stars: 2 },
      "M39.6 67.5 Q40 62.8 43.4 62.8 Q46.6 62.8 47 65.5 M76.4 65.5 Q76.8 62.8 80 62.8 Q83.4 62.8 83.8 67.5",
      { d: circle(61.8, 66.6, 2.1), stars: 2 },
      "M57.6 74.5 Q58 69 61.8 69 Q65.6 69 66 74.5",
      { d: "M39.6 67.5 L39 76 M83.8 67.5 L84.4 76 M57.6 74.5 L57.6 79 M66 74.5 L66 79", kind: "detail" },
      { d: crescent(25, 21, 4.5), stars: 2, transform: "rotate(-35 25 21)" }
    ]
  },
  {
    id: 23,
    title: "Pan de muerto",
    date: "15/10/2026",
    figure: "un pan de muerto (en la hora libre)",
    description: "El día de las flores amarillas? ¡NO! ¡Es el día del pan de muertoooo! Pude compartir un hermoso momento con mi novia comiendo pan de muerto muy rico",
    stars: [
      [63.8, 16.3, 2],
      [63.7, 29, 1], [60.7, 42.1, 1], [66.9, 42.1, 1],
      [43.9, 40.8, 1], [83.6, 40.8, 1], [31.8, 52.9, 2], [95.7, 52.9, 2],
      [63.9, 60.6, 1], [35.9, 63.2, 1], [91.6, 63.2, 1], [63.8, 69.1, 2]
    ],
    lines: [
      circle(63.75, 36.4, 7.4),
      "M43.9 40.8 C45 34 54 32.5 56.6 38.8",
      "M83.6 40.8 C82.5 34 73.5 32.5 70.9 38.8",
      "M60.7 42.1 C55 44.5 50 45.5 45.5 49 C41 52.5 38.5 56 34.5 55.5 C32.5 55.2 31.5 54 31.8 52.9 C33 47.5 38 43 43.9 40.8 C48 39.4 53 39.4 56.6 38.9",
      "M66.8 42.1 C72.5 44.5 77.5 45.5 82 49 C86.5 52.5 89 56 93 55.5 C95 55.2 96 54 95.7 52.9 C94.5 47.5 89.5 43 83.6 40.8 C79.5 39.4 74.5 39.4 70.9 38.9",
      "M60.7 42.1 C57 48 57.5 58.5 63.9 60.6 C70.3 58.5 70.5 48 66.9 42.1",
      "M31.8 52.9 C32 57.5 33.5 61 35.9 63.2 C44 68.5 55 69.5 63.8 69.1 C72.5 69.5 83.5 68.5 91.6 63.2 C94 61 95.5 57.5 95.7 52.9",
      "M63.9 60.6 L63.8 69.1",
      { d: crescent(25.2, 21.6, 4.5), stars: 2, transform: "rotate(-35 25.2 21.6)" }
    ]
  },
  {
    id: 24,
    title: "Cita romántica",
    date: "24/10/2026",
    figure: "dos corazones entrelazados",
    description: "Esta cita solamente queda catalogada en nuestra memoria <3",
    stars: [
      [50, 12, 2], [24, 26, 2], [84, 30, 2], [20, 62], [86, 70]
    ],
    lines: [
      { d: heart(42, 44, 17), stars: 9 },
      { d: heart(61, 54, 13), stars: 7 },
      { d: "M14 70 C30 62 40 74 52 70 C64 66 74 76 90 68", kind: "trail", stars: 5 }
    ]
  },
  {
    id: 25,
    title: "Los diarios de la Boticaria",
    date: "27/10/2026",
    figure: "nuestra serie en la laptop (cap. 1, temporada 3)",
    description: "Un día después de celases fuimos a Soriana, compramos jugos boing, galletitas maría y doritos. Luego fuimos al coche y vimos Los diarios de la Boticaria abrazaditos, sin duda un día muy bello.",
    /* laptop trazada de la referencia + objetos de botica dibujados en la pantalla */
    stars: [
      ...TRACED["25"].stars,
      [28.7, 26.4, 2], [65.7, 24.1, 2], [47.6, 22.3, 1], [47.6, 48.5, 1],
      [26.6, 34.4, 1], [37.6, 25.3, 1], [27, 42.5, 1], [36.4, 42.5, 1], [64, 41.5, 1], [59, 29.1, 1], [66, 48.5, 1]
    ],
    lines: [
      ...TRACED["25"].lines,
      /* horquilla con flor */
      { d: "M32.2 31.9 L42.4 24.6", transform: "translate(-5.6 2.5)" },
      { d: flower(43.2, 22.8, 1.7), kind: "detail", transform: "translate(-5.6 2.5)" },
      { d: "M42.4 24.6 L42.4 28.4 M43.6 24.4 L43.6 29.4 " + circle(42.4, 28.8, 0.35) + " " + circle(43.6, 29.8, 0.35), kind: "detail", transform: "translate(-5.6 2.5)" },
      /* frasco con moño y plantita */
      { d: "M51.4 23.4 C51 21.6 52.4 20.4 53.2 19.8 C54 20.4 55.4 21.6 55 23.4 C54.6 24.6 51.8 24.6 51.4 23.4 Z", transform: "translate(-5.6 2.5)" },
      { d: "M52 24.6 L52 26.8 M54.4 24.6 L54.4 26.8 M51.2 26.8 L55.2 26.8 L55.2 28.2 L51.2 28.2 Z M52 28.2 L52 30.6 M54.4 28.2 L54.4 30.6", transform: "translate(-5.6 2.5)" },
      { d: "M52 30.6 C47 32 45.6 35 45.6 38.4 C45.6 42.6 49 45 53.2 45 C57.4 45 60.8 42.6 60.8 38.4 C60.8 35 59.4 32 54.4 30.6", transform: "translate(-5.6 2.5)" },
      { d: "M50.2 45 L50.6 46 L55.8 46 L56.2 45", transform: "translate(-5.6 2.5)" },
      { d: "M53.2 31 C51.5 29.8 49.6 30 49.8 31.2 C50 32.2 52 31.8 53.2 31 C54.4 30.2 56.6 29.8 56.6 31 C56.6 32.2 54.4 31.8 53.2 31 M53.2 31 L51.6 33.6 M54 31.4 C57 32 58.6 33.4 60 36.2", kind: "detail", transform: "translate(-5.6 2.5)" },
      { d: "M53.2 44 L53.2 35.6 " + petal(53.2, 41.4, 50.4, 39.8, 0.9) + " " + petal(53.2, 41.4, 56, 39.8, 0.9) + " " + petal(53.2, 38.8, 51.2, 37.4, 0.7) + " " + petal(53.2, 38.8, 55.2, 37.4, 0.7), kind: "detail", transform: "translate(-5.6 2.5)" },
      /* mortero */
      { d: "M32.6 40 L42 40 C41.8 43 39.8 44.4 37.3 44.4 C34.8 44.4 32.8 43 32.6 40 Z M35.6 44.4 L35.4 45.6 L39.2 45.6 L39 44.4", transform: "translate(-5.6 2.5)" },
      { d: "M37 40.2 L41.4 36.9 " + circle(41.9, 36.5, 0.7), transform: "translate(-5.6 2.5)" },
      { d: petal(37.3, 43, 35.8, 41.8, 0.5) + " " + petal(37.3, 43, 38.8, 41.8, 0.5), kind: "detail", transform: "translate(-5.6 2.5)" },
      /* rama medicinal */
      { d: "M69.6 39 C69.4 34 67.6 30 64.6 26.4", transform: "translate(-5.6 2.5)" },
      { d: petal(64.9, 26.9, 66.6, 23.4, 1) + " " + petal(66.1, 29.2, 62.6, 28.2, 1) + " " + petal(67.3, 31.4, 70.4, 29.2, 1) + " " + petal(68.2, 33.8, 64.6, 33.6, 1) + " " + petal(68.9, 36.2, 71.8, 33.6, 0.9), kind: "detail", transform: "translate(-5.6 2.5)" },
      /* frasquito y flor */
      { d: "M65.6 39.4 L65.6 45.2 Q65.6 46 66.4 46 L68.8 46 Q69.6 46 69.6 45.2 L69.6 39.4 Q69.6 38.6 68.8 38.6 L66.4 38.6 Q65.6 38.6 65.6 39.4 Z M66.4 38.6 L66.4 37.2 L68.8 37.2 L68.8 38.6 M66.2 37.2 L66.2 36.4 L69 36.4 L69 37.2", transform: "translate(-5.6 2.5)" },
      { d: "M67.6 45 L67.6 41 " + petal(67.6, 43.4, 66.4, 42.4, 0.45) + " " + petal(67.6, 43.4, 68.8, 42.4, 0.45), kind: "detail", transform: "translate(-5.6 2.5)" },
      { d: flower(71.8, 44.4, 1.7), kind: "detail", transform: "translate(-5.6 2.5)" }
    ]
  },
  {
    id: 26,
    title: "Hora Eucarística",
    date: "29/10/2026",
    figure: "fe, encuentro y adoración: una noche en el Estadio Domingo Santana",
    description: "El día de hoy fuimos a un evento muy especial, apoyamos a Sofi, la mejor amiga de mi amor. Cantó de una manera increíble, el ambiente del estadio de los bravos se envolvió en una sinfonía de paz y armonía alabando a Dios.\n\nAgradezco a mi bella novia por invitarme a este evento tan especial, la pasamos muy bien rodeados de tantas velas y música a nuestro alrededor.",
    stars: TRACED["26"].stars,
    lines: TRACED["26"].lines
  },
  {
    id: 27,
    title: "Last Christmas",
    date: "07/11/2026",
    figure: "una noche viendo Last Christmas en la laptop, dentro del coche",
    description: "Hanis tenía muchas ganas de mostrarme una película muy pero muy hermosa, Last Christmas: otra oportunidad para amar. Me encantó, hasta incluso lloré de tan bonita que fue.",
    stars: TRACED["27"].stars,
    lines: TRACED["27"].lines
  },
  {
    id: 28,
    title: "Festival del Globo + Quesadillas",
    date: "14/11/2026",
    figure: "nosotros, bajo un cielo lleno de globos",
    description: "¿Qué? ¿Un festival del globo? ¡Así es, por fin llegó! Desde las 4 de la mañana nos preparamos para ver un espectáculo de colores en el cielo, sin duda alguna uno de los mejores momentos que he vivido al lado de mi novia. Y yo le agradezco que me haya dejado invitarla y deleitarme con su hermosa presencia.\n\nLuego del festival fuimos a desayunar las famosísimas Quesadillas de Don David, a Hania le encantaron y pedimos 2 juguitos boing. Luego de eso nos quedamos un rato más juntos <3",
    stars: TRACED["28"].stars,
    lines: TRACED["28"].lines
  },
  {
    id: 29,
    title: "Hoy conocí a Jony",
    date: "15/11/2026",
    figure: "videojuegos, risas y una gran conexión",
    description: "-Jonathan, gusto en conocerte- Hoy por fin conozco al famoso Jony del que tanto me ha hablado mi novia. Aunque fue por videollamada de inmediato nos llevamos bien, incluso jugamos videojuegos juntos y pudimos conocer más del otro desvelándonos y compartiendo momentos divertidos.",
    stars: TRACED["29"].stars,
    lines: TRACED["29"].lines
  }
];

