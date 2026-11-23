/* ============================================================
   NUESTRO UNIVERSO — script.js
   - Fondo de estrellas en canvas (DPR limitado, se pausa en segundo plano)
   - Universo con 20 estrellas-botón en órbitas sutiles
   - Motor de constelaciones SVG que se encaja solo con getBBox()
   - Animaciones con Anime.js (si no carga o hay "reducir movimiento",
     se muestra el estado final sin animar)
   ============================================================ */

(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hasAnime = typeof window.anime === "function";
  const CFG = typeof UNIVERSE_CONFIG !== "undefined" ? UNIVERSE_CONFIG : {};
  const canAnimate = () => hasAnime && !motionQuery.matches;

  /* tamaños en píxeles de pantalla (se convierten a unidades SVG) */
  const LOOK = {
    main: 1.9,
    detail: 1.1,
    trail: 1.1,
    sizes: [
      { core: 1.9, halo: 7, flare: 0 },     /* chica */
      { core: 3.3, halo: 13, flare: 0 },    /* grande */
      { core: 2.8, halo: 14, flare: 11 }    /* destello */
    ]
  };

  const state = {
    index: -1,
    busy: false,
    opener: null,
    orbitStars: [],
    orbitRunning: false,
    hoverPause: false,
    stageSize: 0,
    fig: null,
    msgTimer: 0
  };

  const $ = id => document.getElementById(id);
  const pad2 = n => String(n).padStart(2, "0");

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    memories.sort((x, y) => x.id - y.id);
    applyTexts();
    const stars = setupStarfield();
    buildUniverse();
    bindUI();
    state.shooting = stars;
    measureUniverse();
    startOrbit();
    window.addEventListener("resize", debounce(onResize, 80));
    setupMusic();
    motionQuery.addEventListener?.("change", () => {
      startOrbit();
    });
  }

  /* ==========================================================
     TEXTOS GENERALES
     ========================================================== */

  function applyTexts() {
    const cfg = CFG;
    if (cfg.title) $("universe-heading").textContent = cfg.title;
    if (cfg.subtitle) $("universe-subtitle").textContent = cfg.subtitle;
    if (cfg.signature) $("panel-signature").textContent = cfg.signature;

    $("star-her").setAttribute("aria-label", `${cfg.her || "Ella"}: una de las dos estrellas centrales`);
    $("star-me").setAttribute("aria-label", `${cfg.me || "Yo"}: una de las dos estrellas centrales`);
    $("label-her").textContent = cfg.her || "Ella";
    $("label-me").textContent = cfg.me || "Yo";

    /* cronología calculada con las fechas reales */
    const times = memories.map(m => parseDate(m.date).getTime());
    const first = new Date(Math.min(...times));
    const last = new Date(Math.max(...times));
    $("chrono-start").textContent = shortDate(first);
    $("chrono-end").textContent = shortDate(last);
  }

  const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  function parseDate(str) {
    const [d, m, y] = str.split("/").map(Number);
    return new Date(y, m - 1, d);
  }
  function longDate(str) {
    const dt = parseDate(str);
    return `${dt.getDate()} de ${MONTHS[dt.getMonth()]} de ${dt.getFullYear()}`;
  }
  function shortDate(dt) {
    return `${pad2(dt.getDate())} ${MONTHS[dt.getMonth()].slice(0, 3).toUpperCase()} ${dt.getFullYear()}`;
  }

  /* ==========================================================
     FONDO DE ESTRELLAS (canvas)
     ========================================================== */

  function setupStarfield() {
    const canvas = $("starfield");
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let w = 0, h = 0, stars = [], last = 0;
    let shoot = null;
    let nextShoot = performance.now() + 6000;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const amount = Math.min(520, Math.round((w * h) / 3200));
      stars = Array.from({ length: amount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1 + 0.25,
        a: Math.random() * 0.55 + 0.2,
        p: Math.random() * Math.PI * 2,
        s: Math.random() * 0.0011 + 0.0003,
        tint: Math.random() < 0.18
      }));
      drawFrame(performance.now(), true);
    }

    function drawFrame(t, force) {
      ctx.clearRect(0, 0, w, h);
      const still = motionQuery.matches;
      for (const s of stars) {
        const a = still ? s.a : Math.max(0.08, s.a + Math.sin(t * s.s + s.p) * 0.18);
        ctx.fillStyle = s.tint ? `rgba(200,190,255,${a})` : `rgba(240,238,255,${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (shoot) drawShoot(t);
      else if (!still && !force && t > nextShoot && state.index < 0) launchShoot(t);
    }

    function launchShoot(t) {
      const fromLeft = Math.random() < 0.6;
      const x = fromLeft ? Math.random() * w * 0.4 : w * (0.6 + Math.random() * 0.4);
      const y = Math.random() * h * 0.35;
      const ang = fromLeft ? 0.42 + Math.random() * 0.25 : Math.PI - 0.42 - Math.random() * 0.25;
      shoot = { x, y, ang, start: t, dur: 1100, len: Math.min(w, h) * 0.45 };
    }

    function drawShoot(t) {
      const k = (t - shoot.start) / shoot.dur;
      if (k >= 1) {
        shoot = null;
        nextShoot = t + 9000 + Math.random() * 9000;
        return;
      }
      const head = shoot.len * k;
      const hx = shoot.x + Math.cos(shoot.ang) * head;
      const hy = shoot.y + Math.sin(shoot.ang) * head;
      const tail = Math.min(head, 110);
      const tx = hx - Math.cos(shoot.ang) * tail;
      const ty = hy - Math.sin(shoot.ang) * tail;
      const fade = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
      const g = ctx.createLinearGradient(tx, ty, hx, hy);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(1, `rgba(255,255,255,${0.85 * fade})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();
    }

    function loop(t) {
      /* ~30 fps es suficiente para un parpadeo suave */
      if (!document.hidden && t - last > 32) {
        last = t;
        drawFrame(t, false);
      }
      requestAnimationFrame(loop);
    }

    window.addEventListener("resize", debounce(resize, 120));
    resize();
    requestAnimationFrame(loop);
    return { resize };
  }

  /* ==========================================================
     UNIVERSO PRINCIPAL
     ========================================================== */

  /* 4 anillos que giran despacio (unos a la derecha y otros a la izquierda).
     Los recuerdos se reparten en orden: los primeros en el anillo de adentro. */
  const RINGS = [0.34, 0.52, 0.7, 0.88];
  const RING_SPEED = [0.0000135, -0.0000105, 0.0000085, -0.0000068];

  function ringCounts(total) {
    /* base 5 / 7 / 8 / 9 (29 recuerdos); si cambian, se reparte proporcional */
    const base = [5, 7, 8, 9];
    const sum = base.reduce((a, b) => a + b, 0);
    if (total === sum) return base;
    const counts = base.map(b => Math.floor(total * b / sum));
    let left = total - counts.reduce((a, b) => a + b, 0);
    for (let i = counts.length - 1; left > 0; i = (i - 1 + counts.length) % counts.length) {
      counts[i]++; left--;
    }
    return counts;
  }

  function buildUniverse() {
    const ringsG = $("orbit-rings");
    RINGS.forEach(r => {
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", 0);
      c.setAttribute("cy", 0);
      c.setAttribute("r", r * 500);
      ringsG.appendChild(c);
    });

    const counts = ringCounts(memories.length);
    const slots = [];
    counts.forEach((n, ring) => {
      for (let p = 0; p < n; p++) {
        slots.push({ ring, angle: -Math.PI / 2 + p * (Math.PI * 2 / n) + ring * 0.42 });
      }
    });

    const box = $("memory-stars");

    memories.forEach((memory, i) => {
      const { ring, angle } = slots[i];

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "memory-star";
      btn.style.setProperty("--tw", (2.5 + Math.random() * 3).toFixed(2) + "s");
      btn.style.setProperty("--td", (-Math.random() * 5).toFixed(2) + "s");
      btn.setAttribute("aria-label",
        `Recuerdo ${pad2(memory.id)}: ${memory.title}, ${longDate(memory.date)}`);
      btn.innerHTML =
        `<span class="ms-halo" aria-hidden="true"></span>` +
        `<span class="ms-core" aria-hidden="true"></span>` +
        `<span class="ms-num" aria-hidden="true">${pad2(memory.id)}</span>`;

      btn.addEventListener("click", () => openMemory(i, btn));
      btn.addEventListener("pointerenter", e => {
        if (e.pointerType === "mouse") { state.hoverPause = true; showTooltip(btn, memory); }
      });
      btn.addEventListener("pointerleave", e => {
        if (e.pointerType === "mouse") { state.hoverPause = false; hideTooltip(); }
      });
      btn.addEventListener("focus", () => {
        if (!state.silentFocus && btn.matches(":focus-visible")) showTooltip(btn, memory);
      });
      btn.addEventListener("blur", hideTooltip);

      box.appendChild(btn);
      state.orbitStars.push({ btn, ring, angle, memory });
    });
  }

  function measureUniverse() {
    const stage = $("universe-stage");
    state.stageSize = stage.clientWidth;
    placeOrbitStars(performance.now());
  }

  function placeOrbitStars(t) {
    const half = state.stageSize / 2;
    const still = motionQuery.matches;
    for (const s of state.orbitStars) {
      const a = s.angle + (still ? 0 : t * RING_SPEED[s.ring]);
      const r = RINGS[s.ring] * half;
      const x = half + Math.cos(a) * r;
      const y = half + Math.sin(a) * r;
      s.btn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
    /* estrella secreta: quieta, entre el 3.er y 4.º anillo */
    const sec = $("secret-star");
    const sa = 2.55;
    const sr = 0.79 * half;
    sec.style.transform = `translate(${(half + Math.cos(sa) * sr).toFixed(1)}px, ${(half + Math.sin(sa) * sr).toFixed(1)}px)`;
  }

  let orbitTime = 0;
  let orbitLast = 0;
  function startOrbit() {
    if (state.orbitRunning) return;
    state.orbitRunning = true;
    orbitLast = performance.now();
    requestAnimationFrame(function step(t) {
      if (state.index >= 0 && !state.busy) {
        state.orbitRunning = false;
        return;
      }
      /* la órbita se frena cuando el mouse está sobre una estrella */
      if (!state.hoverPause && !motionQuery.matches) orbitTime += t - orbitLast;
      orbitLast = t;
      placeOrbitStars(orbitTime);
      requestAnimationFrame(step);
    });
  }

  /* ---------- tooltip ---------- */

  function showTooltip(btn, memory) {
    const tip = $("tooltip");
    tip.querySelector(".tooltip-num").textContent = `RECUERDO ${pad2(memory.id)}`;
    tip.querySelector(".tooltip-title").textContent = memory.title;
    tip.querySelector(".tooltip-date").textContent = longDate(memory.date);
    const r = btn.getBoundingClientRect();
    const tw = tip.offsetWidth || 200;
    let x = r.left + r.width / 2;
    x = Math.max(tw / 2 + 8, Math.min(window.innerWidth - tw / 2 - 8, x));
    let y = r.top - 6;
    tip.classList.toggle("below", y < 90);
    if (y < 90) y = r.bottom + 6;
    tip.style.left = x + "px";
    tip.style.top = y + "px";
    tip.classList.add("visible");
  }
  function hideTooltip() {
    $("tooltip").classList.remove("visible");
  }

  /* ---------- mensajes (estrellas centrales y secreta) ---------- */

  function showMessage(text) {
    const el = $("universe-message");
    el.textContent = text;
    el.classList.add("visible");
    clearTimeout(state.msgTimer);
    state.msgTimer = setTimeout(() => el.classList.remove("visible"), 5200);
  }

  /* ==========================================================
     TRANSICIÓN UNIVERSO -> CONSTELACIÓN
     ========================================================== */

  function openMemory(index, opener) {
    if (state.busy || state.index >= 0) return;
    state.busy = true;
    state.opener = opener || null;
    hideTooltip();

    const universe = $("universe-view");
    const stage = $("universe-stage");
    const view = $("constellation-view");

    /* el zoom va hacia la estrella tocada */
    if (opener) {
      const sr = stage.getBoundingClientRect();
      const br = opener.getBoundingClientRect();
      const ox = br.left + br.width / 2 - sr.left;
      const oy = br.top + br.height / 2 - sr.top;
      stage.style.transformOrigin = `${ox}px ${oy}px`;
    }

    state.index = index;
    fillPanel(memories[index]);
    showView(view);
    view.style.opacity = "0";
    buildConstellation(memories[index]);

    const finish = () => {
      hideView(universe);
      stage.style.transform = "";
      stage.style.opacity = "";
      universe.style.opacity = "";
      state.busy = false;
      $("back-btn").focus({ preventScroll: true });
    };

    if (!canAnimate()) {
      view.style.opacity = "1";
      drawConstellation(false);
      enterPanel(false);
      finish();
      return;
    }

    anime.remove([stage, universe, view]);
    anime({
      targets: stage,
      scale: [1, 5],
      opacity: [1, 0],
      duration: 950,
      easing: "easeInCubic"
    });
    anime({
      targets: ".universe-title, .chronology",
      opacity: [1, 0],
      duration: 450,
      easing: "easeOutQuad"
    });
    anime({
      targets: view,
      opacity: [0, 1],
      duration: 700,
      delay: 600,
      easing: "easeOutQuad",
      begin: () => {
        drawConstellation(true);
        enterPanel(true);
      },
      complete: () => {
        anime.set(".universe-title, .chronology", { opacity: 1 });
        finish();
      }
    });
  }

  function closeMemory() {
    if (state.busy || state.index < 0) return;
    state.busy = true;
    const universe = $("universe-view");
    const stage = $("universe-stage");
    const view = $("constellation-view");

    showView(universe);
    measureUniverse();
    state.index = -1;
    startOrbit();

    const finish = () => {
      hideView(view);
      view.style.opacity = "";
      stage.style.transform = "";
      stage.style.opacity = "";
      state.busy = false;
      const opener = state.opener;
      state.opener = null;
      if (opener) {
        state.silentFocus = true;
        opener.focus({ preventScroll: true });
        state.silentFocus = false;
      }
    };

    if (!canAnimate()) {
      finish();
      return;
    }

    anime.remove([stage, view]);
    stage.style.transformOrigin = "50% 50%";
    anime({
      targets: view,
      opacity: [1, 0],
      duration: 450,
      easing: "easeOutQuad"
    });
    anime({
      targets: stage,
      scale: [2.4, 1],
      opacity: [0, 1],
      duration: 1000,
      delay: 150,
      easing: "easeOutCubic",
      complete: finish
    });
  }

  function changeMemory(dir) {
    if (state.busy || state.index < 0) return;
    state.busy = true;
    const next = (state.index + dir + memories.length) % memories.length;
    const svg = $("constellation-svg");
    const panel = $("memory-panel");

    const swap = () => {
      state.index = next;
      fillPanel(memories[next]);
      buildConstellation(memories[next]);
      svg.style.opacity = "";
      drawConstellation(canAnimate());
      enterPanel(canAnimate());
      state.busy = false;
    };

    if (!canAnimate()) { swap(); return; }

    anime.remove([svg, panel]);
    anime({
      targets: [svg, panel],
      opacity: [1, 0],
      duration: 260,
      easing: "easeInQuad",
      complete: swap
    });
  }

  function showView(el) {
    el.classList.add("active");
    el.removeAttribute("aria-hidden");
    el.inert = false;
  }
  function hideView(el) {
    el.classList.remove("active");
    el.setAttribute("aria-hidden", "true");
    el.inert = true;
  }

  /* ==========================================================
     PANEL
     ========================================================== */

  function fillPanel(memory) {
    $("panel-num").textContent = `RECUERDO ${pad2(memory.id)}`;
    $("const-counter").textContent = `${pad2(memories.indexOf(memory) + 1)} / ${memories.length}`;
    $("panel-title").textContent = memory.title;
    $("panel-date").textContent = longDate(memory.date);
    $("panel-date").setAttribute("datetime", parseDate(memory.date).toISOString().slice(0, 10));
    $("panel-figure").textContent = `Figura: ${memory.figure}.`;

    const text = $("panel-text");
    text.innerHTML = "";
    String(memory.description || "").split(/\n\s*\n/).forEach(par => {
      const p = document.createElement("p");
      p.textContent = par.trim();
      text.appendChild(p);
    });
    text.scrollTop = 0;
    $("memory-panel").scrollTop = 0;

    $("constellation-svg").setAttribute("aria-label",
      `Constelación del recuerdo ${pad2(memory.id)}: ${memory.figure}`);
  }

  function enterPanel(animate) {
    const panel = $("memory-panel");
    if (!animate) {
      panel.style.opacity = "1";
      panel.style.transform = "";
      return;
    }
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    anime.remove(panel);
    anime({
      targets: panel,
      opacity: [0, 1],
      translateX: mobile ? [0, 0] : [26, 0],
      translateY: mobile ? [26, 0] : [0, 0],
      duration: 900,
      delay: 500,
      easing: "easeOutCubic",
      complete: () => { panel.style.transform = ""; }
    });
  }

  /* ==========================================================
     MOTOR DE CONSTELACIONES
     ========================================================== */

  function el(name, attrs, parent) {
    const node = document.createElementNS(SVG_NS, name);
    if (attrs) for (const k in attrs) if (attrs[k] != null) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  /* acepta el formato nuevo (stars/lines) y el viejo (points/paths/connections) */
  function normalize(memory) {
    const lines = [];
    const stars = [];
    (memory.lines || memory.paths || []).forEach(l => {
      lines.push(typeof l === "string" ? { d: l } : l);
    });
    (memory.stars || []).forEach(s => {
      if (Array.isArray(s)) stars.push({ x: s[0], y: s[1], size: s[2] || 0 });
      else stars.push({ x: s.x, y: s.y, size: s.size || (s.big ? 1 : 0) });
    });
    const pts = memory.points || [];
    pts.forEach(p => { if (!p.hidden) stars.push({ x: p.x, y: p.y, size: p.big ? 1 : 0 }); });
    (memory.connections || []).forEach(([a, b]) => {
      if (pts[a] && pts[b]) lines.push({ d: `M${pts[a].x} ${pts[a].y} L${pts[b].x} ${pts[b].y}` });
    });
    return { lines, stars };
  }

  /* construye la figura completa, la centra y ajusta el viewBox a su tamaño real */
  function buildConstellation(memory) {
    const svg = $("constellation-svg");
    if (hasAnime) anime.remove(svg.querySelectorAll("*"));
    clearTimeout(state.glowTimer);
    svg.querySelectorAll(".figure").forEach(n => n.remove());
    svg.classList.remove("glowing");

    const data = normalize(memory);
    const root = el("g", { class: "figure" }, svg);
    const layers = {
      lines: el("g", { class: "layer-lines" }, root),
      stars: el("g", { class: "layer-stars" }, root)
    };

    const strokes = [];
    const stars = [];

    data.stars.forEach(s => stars.push(makeStar(layers.stars, s.x, s.y, s.size)));

    data.lines.forEach((p, pi) => {
      const kind = p.kind === "detail" || p.kind === "trail" ? p.kind : "main";
      const host = p.transform ? el("g", { transform: p.transform }, layers.lines) : layers.lines;
      const path = el("path", { d: p.d, class: `c-path c-${kind}` }, host);
      strokes.push({ node: path, kind, order: pi });

      const count = Math.max(0, Math.round(p.stars || 0));
      if (count > 0) {
        const starHost = p.transform ? el("g", { transform: p.transform }, layers.stars) : layers.stars;
        let len = 0;
        try { len = path.getTotalLength(); } catch (e) { len = 0; }
        if (len > 0) {
          const closed = isClosed(path, len);
          const steps = closed ? count : Math.max(1, count - 1);
          for (let k = 0; k < count; k++) {
            const at = count === 1 ? len / 2 : (len * k) / steps;
            const pt = path.getPointAtLength(Math.min(len, at));
            stars.push(makeStar(starHost, pt.x, pt.y, 0));
          }
        }
      }
    });

    /* orden de aparición de las estrellas: de arriba-izquierda hacia abajo-derecha */
    stars.forEach(s => { s.order = s.y * 1.4 + s.x; });
    stars.sort((a, b) => a.order - b.order);

    /* encajar: medir la figura real (sin el brillo) y centrarla con margen */
    const box = root.getBBox();
    const size = Math.max(box.width, box.height, 1);
    const pad = size * 0.085;
    const vb = {
      x: box.x - pad,
      y: box.y - pad,
      w: box.width + pad * 2,
      h: box.height + pad * 2
    };
    svg.setAttribute("viewBox", `${r2(vb.x)} ${r2(vb.y)} ${r2(vb.w)} ${r2(vb.h)}`);

    state.fig = { root, layers, strokes, stars, vb };
    applyScale();
  }

  function isClosed(path, len) {
    const d = path.getAttribute("d").trim();
    if (/[zZ]\s*$/.test(d)) return true;
    const a = path.getPointAtLength(0);
    const b = path.getPointAtLength(len);
    return Math.hypot(a.x - b.x, a.y - b.y) < 0.5;
  }

  /* size: 0 = chica, 1 = grande, 2 = destello de 4 puntas */
  function makeStar(host, x, y, size) {
    const g = el("g", { class: "c-star s" + size }, host);
    /* r mínimo para que getBBox() cuente también las estrellas sueltas */
    const halo = el("circle", { cx: r2(x), cy: r2(y), r: 0.01, class: "c-halo" }, g);
    const flare = size === 2 ? el("path", { class: "c-flare" }, g) : null;
    const core = el("circle", { cx: r2(x), cy: r2(y), r: 0.01, class: "c-core" }, g);
    g.style.setProperty("--d", (Math.random() * 4).toFixed(2) + "s");
    return { g, halo, core, flare, size, x, y };
  }

  function flarePath(x, y, L) {
    const w = L * 0.16;
    return `M${r3(x)} ${r3(y - L)} L${r3(x + w)} ${r3(y - w)} L${r3(x + L)} ${r3(y)} L${r3(x + w)} ${r3(y + w)} ` +
      `L${r3(x)} ${r3(y + L)} L${r3(x - w)} ${r3(y + w)} L${r3(x - L)} ${r3(y)} L${r3(x - w)} ${r3(y - w)} Z`;
  }

  /* convierte los tamaños en px a unidades del viewBox actual */
  function applyScale() {
    const f = state.fig;
    if (!f) return;
    const stage = $("const-stage");
    const w = stage.clientWidth || 1;
    const h = stage.clientHeight || 1;
    const scale = Math.min(w / f.vb.w, h / f.vb.h) || 1;
    /* en pantallas chicas todo se afina un poco para no empastarse */
    const k = Math.min(1.15, Math.max(0.72, Math.min(w, h) / 480));
    const u = (1 / scale) * k;
    f.unit = u;
    for (const s of f.strokes) {
      s.node.style.strokeWidth = r3(LOOK[s.kind] * u);
    }
    for (const s of f.stars) {
      const S = LOOK.sizes[s.size] || LOOK.sizes[0];
      s.rc = S.core * u;
      s.rh = S.halo * u;
      if (s.flare) s.flare.setAttribute("d", flarePath(s.x, s.y, S.flare * u));
      if (!s.animating) {
        s.core.setAttribute("r", r3(s.rc));
        s.halo.setAttribute("r", r3(s.rh));
      }
    }
  }

  /* anima: aparecen las estrellas -> se conectan una a una -> brillo final */
  function drawConstellation(animate) {
    const f = state.fig;
    const svg = $("constellation-svg");
    if (!f) return;

    if (!animate) {
      f.strokes.forEach(s => {
        s.node.style.strokeDasharray = "";
        s.node.style.strokeDashoffset = "";
      });
      f.stars.forEach(s => { s.g.style.opacity = "1"; s.g.style.transform = ""; });
      svg.classList.add("glowing");
      return;
    }

    /* 1) estrellas */
    const nStars = f.stars.length;
    const starGap = Math.min(55, 1000 / Math.max(1, nStars));
    f.stars.forEach((s, i) => {
      s.g.style.opacity = "0";
      s.animating = true;
      s.core.setAttribute("r", 0);
      s.halo.setAttribute("r", 0);
      const delay = 200 + i * starGap;
      anime({ targets: s.g, opacity: [0, 1], duration: 500, delay, easing: "easeOutQuad" });
      anime({ targets: s.core, r: [0, s.rc], duration: 700, delay, easing: "easeOutBack" });
      anime({
        targets: s.halo,
        r: [0, s.rh * 1.6, s.rh],
        duration: 1100,
        delay,
        easing: "easeOutQuad",
        complete: () => {
          s.animating = false;
          s.core.setAttribute("r", r3(s.rc));
          s.halo.setAttribute("r", r3(s.rh));
        }
      });
      if (s.flare) {
        anime({ targets: s.flare, opacity: [0, 1], scale: [0.2, 1], duration: 800, delay: delay + 150, easing: "easeOutBack" });
      }
    });

    /* 2) líneas, una tras otra, en el orden de data.js */
    f.strokes.forEach(s => {
      let len = 0;
      try { len = s.node.getTotalLength(); } catch (e) { len = 0; }
      s.len = Math.max(0.01, len);
      s.node.style.strokeDasharray = `${s.len} ${s.len}`;
      s.node.style.strokeDashoffset = s.len;
    });

    const linesStart = 200 + Math.min(900, nStars * starGap * 0.75);
    const n = f.strokes.length;
    const gap = Math.min(320, 2400 / Math.max(1, n));
    let end = linesStart;
    f.strokes.forEach((s, i) => {
      const dur = s.kind === "main" ? 900 : 700;
      const delay = linesStart + i * gap;
      end = Math.max(end, delay + dur);
      anime({
        targets: s.node,
        strokeDashoffset: [s.len, 0],
        duration: dur,
        delay,
        easing: "easeInOutSine",
        complete: () => {
          s.node.style.strokeDasharray = "";
          s.node.style.strokeDashoffset = "";
        }
      });
    });

    /* 3) brillo final */
    const fig = f;
    state.glowTimer = setTimeout(() => {
      if (state.fig === fig) svg.classList.add("glowing");
    }, end - 150);
  }

  /* ==========================================================
     EVENTOS
     ========================================================== */

  function bindUI() {
    $("back-btn").addEventListener("click", closeMemory);
    $("prev-btn").addEventListener("click", () => changeMemory(-1));
    $("next-btn").addEventListener("click", () => changeMemory(1));

    const cfg = CFG;
    const central = () => showMessage(cfg.centralMessage || "");
    $("star-her").addEventListener("click", central);
    $("star-me").addEventListener("click", central);
    $("secret-star").addEventListener("click", () => {
      $("secret-star").classList.add("found");
      showMessage(cfg.secretStarMessage || "");
    });

    document.addEventListener("keydown", e => {
      if (state.index < 0) return;
      if (e.key === "Escape") { e.preventDefault(); closeMemory(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); changeMemory(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); changeMemory(1); }
    });

    /* deslizar en móvil sobre la constelación para cambiar de recuerdo */
    const stage = $("const-stage");
    let sx = 0, sy = 0, tracking = false;
    stage.addEventListener("pointerdown", e => {
      if (e.pointerType === "mouse") return;
      tracking = true; sx = e.clientX; sy = e.clientY;
    });
    stage.addEventListener("pointerup", e => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) changeMemory(dx < 0 ? 1 : -1);
    });
    stage.addEventListener("pointercancel", () => { tracking = false; });

    if ("ResizeObserver" in window) {
      new ResizeObserver(() => applyScale()).observe(stage);
    }
  }

  function onResize() {
    hideTooltip();
    measureUniverse();
    applyScale();
  }

  /* ==========================================================
     ENTRADA + MÚSICA
     Los navegadores no dejan sonar música sin que la persona toque
     algo antes; por eso la pantalla "Toca para entrar".
     ========================================================== */

  function setupMusic() {
    const intro = $("intro");
    const enter = $("intro-btn");
    const audio = $("bg-music");
    const btn = $("sound-btn");
    const TARGET = 0.6;
    let wantPlaying = false;
    let fadeId = 0;

    const universe = $("universe-view");
    universe.inert = true;

    function fadeTo(vol, ms, done) {
      cancelAnimationFrame(fadeId);
      const from = audio.volume;
      const start = performance.now();
      const step = now => {
        const k = Math.min(1, (now - start) / ms);
        audio.volume = Math.max(0, Math.min(1, from + (vol - from) * k));
        if (k < 1) fadeId = requestAnimationFrame(step);
        else if (done) done();
      };
      fadeId = requestAnimationFrame(step);
    }

    function setUi(playing) {
      btn.classList.toggle("muted", !playing);
      btn.setAttribute("aria-pressed", String(playing));
      btn.setAttribute("aria-label", playing ? "Pausar la música" : "Reproducir la música");
    }

    function play() {
      wantPlaying = true;
      audio.volume = 0;
      const p = audio.play();
      if (p && p.catch) p.catch(() => { wantPlaying = false; setUi(false); });
      fadeTo(TARGET, 2200);
      setUi(true);
    }

    function pause() {
      wantPlaying = false;
      setUi(false);
      fadeTo(0, 500, () => audio.pause());
    }

    enter.addEventListener("click", () => {
      play();
      intro.classList.add("gone");
      universe.inert = false;
      btn.hidden = false;
      setTimeout(() => intro.remove(), 1400);
      const first = document.querySelector(".memory-star");
      if (first) first.focus({ preventScroll: true });
    });

    btn.addEventListener("click", () => {
      if (wantPlaying) pause(); else play();
    });

    /* si sale de la pestaña se pausa, y al volver sigue */
    document.addEventListener("visibilitychange", () => {
      if (!wantPlaying) return;
      if (document.hidden) audio.pause();
      else {
        const p = audio.play();
        if (p && p.catch) p.catch(() => setUi(false));
      }
    });

    setTimeout(() => enter.focus({ preventScroll: true }), 50);
  }

  /* ==========================================================
     UTILIDADES
     ========================================================== */

  function debounce(fn, ms) {
    let t = 0;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }
  function r2(n) { return Math.round(n * 100) / 100; }
  function r3(n) { return Math.round(n * 1000) / 1000; }
})();
