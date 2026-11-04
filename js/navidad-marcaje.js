// ── Pre-Navidad: marcaje "Escarcha viva" ──
// Lo usa el módulo principal de index.html (renderMarcajeCard y "Probar animaciones"). Solo dibuja; no toca
// cómo se marca ni qué se guarda.
//  · Al marcar, la escarcha crece desde las orillas y cubre la tarjeta (la hora se ve helada) y arriba aparece
//    una guirnalda de foquitos de vidrio congelados. Desde el punto recién marcado sale una ola de calor que
//    derrite la escarcha (gotas que escurren, un poco de vapor); cada foquito se descongela y se enciende al
//    llegarle el calor y la hora pasa a dorado.
//  · Tarde: el calor no alcanza, solo se derrite un pedazo y la escarcha regresa; los foquitos cercanos
//    titilan y se apagan.
//  · Después de la escena, la guirnalda queda fija en la tarjeta (prendida o congelada) en un <canvas> chico.
// Con movimiento reducido no hay escena: la tarjeta sale ya en su estado final.

const COLS = [['#ff3b4e', '#b3001b'], ['#ffd23f', '#c98a00'], ['#2ee59d', '#0b7a4b'], ['#4cc3ff', '#0a6db5'], ['#ff7ad9', '#b0167f']];
export const ALTO_GUIRNALDA = 38;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const mezcla = (a, b, t) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const m = s => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t); return `rgb(${m(16)},${m(8)},${m(0)})`; };
const semilla = s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
const reducido = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

// Adorno del punto: esfera roja con cheque (a tiempo) o gris con ✕ (tarde)
export function adornoNV(tono) {
  const mal = tono === 'mal';
  return `<svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true"><defs><radialGradient id="nvpB${mal ? 'm' : 'o'}" cx="35%" cy="30%"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <circle cx="22" cy="22" r="17" fill="${mal ? '#94a3b8' : '#c4152c'}"/><circle cx="22" cy="22" r="17" fill="url(#nvpB${mal ? 'm' : 'o'})"/>
    ${mal ? '<path d="M16 16l12 12M28 16L16 28" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' : '<path d="M14.5 22.5l5 5 10-11" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'}</svg>`;
}

// ── Guirnalda ──
const bulbosDe = W => { const n = Math.max(6, Math.round(W / 40)), b = []; for (let i = 0; i < n; i++) { const t = (i + .5) / n; b.push({ x: -8 + (W + 16) * t, col: COLS[i % COLS.length], luz: 0, frio: 1, fase: i * 1.7 }); } return b; };
const cableY = (W, x) => { const t = (x + 8) / (W + 16); return 6 + 4 * t * (1 - t) * 4 + Math.sin(t * Math.PI * 6) * 1.2; };
function dibujaGuirnalda(x, W, bulbos, now, sombra) {
  x.save(); x.strokeStyle = '#14532d'; x.lineWidth = 1.6; x.beginPath();
  for (let px = -8; px <= W + 8; px += 4) { const py = cableY(W, px); px === -8 ? x.moveTo(px, py) : x.lineTo(px, py); }
  x.stroke(); x.restore();
  bulbos.forEach((b, i) => {
    const cy = cableY(W, b.x), ang = Math.sin(now * 1.6 + b.fase) * 0.06 + (i % 2 ? 0.12 : -0.12), L = b.luz, [c1, c2] = b.col;
    x.save(); x.translate(b.x, cy); x.rotate(ang);
    if (L > 0.02) { x.save(); x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(0, 15, 1, 0, 15, 26); g.addColorStop(0, hexA(c1, .55 * L)); g.addColorStop(1, hexA(c1, 0)); x.fillStyle = g; x.beginPath(); x.arc(0, 15, 26, 0, 7); x.fill(); x.restore(); }
    x.fillStyle = '#9aa6b2'; x.fillRect(-3.2, 0, 6.4, 5.5); x.fillStyle = '#cfd8e3'; x.fillRect(-3.2, 0, 2, 5.5);
    const g = x.createRadialGradient(-2, 10, 1, 0, 13, 11);
    if (L > 0.02) { g.addColorStop(0, '#fff'); g.addColorStop(.25, mezcla('#cfe6f5', c1, L)); g.addColorStop(1, mezcla('#8fb3cc', c2, L)); }
    else { g.addColorStop(0, '#f4fbff'); g.addColorStop(.4, '#cfe6f5'); g.addColorStop(1, '#8fb3cc'); }
    x.fillStyle = g; if (sombra) { x.shadowColor = L > 0.02 ? c1 : 'transparent'; x.shadowBlur = 14 * L; }
    x.beginPath(); x.moveTo(-3.6, 5); x.bezierCurveTo(-8, 9, -7.5, 19, 0, 23); x.bezierCurveTo(7.5, 19, 8, 9, 3.6, 5); x.closePath(); x.fill(); x.shadowBlur = 0;
    x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 1.3; x.lineCap = 'round'; x.beginPath(); x.moveTo(-3.4, 9); x.quadraticCurveTo(-4.6, 13, -3, 17); x.stroke();
    if (b.frio > 0.02) {
      x.globalAlpha = b.frio * .9; x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(-3.6, 5); x.bezierCurveTo(-7, 8, -7, 11, -6, 13); x.quadraticCurveTo(0, 10, 6, 13); x.bezierCurveTo(7, 11, 7, 8, 3.6, 5); x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,255,255,.8)'; for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(-4 + k * 2, 13 + ((k * 7) % 5), .7, 0, 7); x.fill(); } x.globalAlpha = 1;
    }
    x.restore();
  });
}
const preparar = (c, W, H, tope = 2) => { const dpr = Math.min(tope, window.devicePixelRatio || 1); c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); return { x, dpr }; };

// Guirnalda fija (después de la escena o al volver a abrir la app): prendida o congelada
export function pintarGuirnaldaNV(canvas) {
  if (!canvas || !canvas.parentElement) return;
  const W = canvas.parentElement.offsetWidth || canvas.offsetWidth; if (!W) return;
  const { x } = preparar(canvas, W, ALTO_GUIRNALDA);
  const luz = canvas.dataset.luz === '1', b = bulbosDe(W);
  b.forEach(p => { p.luz = luz ? .9 : 0; p.frio = luz ? 0 : 1; });
  x.clearRect(0, 0, W, ALTO_GUIRNALDA); dibujaGuirnalda(x, W, b, 0, true);
}

// ── Escarcha ──
function generaEscarcha(W, H, rnd) {
  const segs = [], puntos = [];
  const crecer = (x, y, ang, largo, t0, ancho, prof) => {
    let px = x, py = y, a = ang;
    for (let s = 0; s < largo; s++) {
      const paso = 3 + rnd() * 4; a += (rnd() - .5) * 0.5;
      const nx = px + Math.cos(a) * paso, ny = py + Math.sin(a) * paso, t = t0 + s * 0.028;
      segs.push({ x1: px, y1: py, x2: nx, y2: ny, t, w: Math.max(.4, ancho * (1 - s / largo)) });
      if (prof < 3 && rnd() < 0.22) { const lado = rnd() < .5 ? -1 : 1; crecer(nx, ny, a + lado * (0.9 + rnd() * .4), Math.floor(largo * (.35 + rnd() * .3)), t + 0.04, ancho * .7, prof + 1); }
      if (rnd() < 0.08) puntos.push({ x: nx, y: ny, t, r: .6 + rnd() * 1.2 });
      px = nx; py = ny;
    }
  };
  const semillas = (n, f) => { for (let i = 0; i < n; i++) f(i / n + rnd() / n); };
  semillas(Math.round(W / 14), u => crecer(u * W, -2, Math.PI / 2 + (rnd() - .5) * .8, 10 + Math.floor(rnd() * 14), rnd() * .25, 1.4, 0));
  semillas(Math.round(W / 14), u => crecer(u * W, H + 2, -Math.PI / 2 + (rnd() - .5) * .8, 10 + Math.floor(rnd() * 14), rnd() * .25, 1.4, 0));
  semillas(Math.round(H / 14), u => crecer(-2, u * H, (rnd() - .5) * .8, 12 + Math.floor(rnd() * 16), rnd() * .25, 1.4, 0));
  semillas(Math.round(H / 14), u => crecer(W + 2, u * H, Math.PI + (rnd() - .5) * .8, 12 + Math.floor(rnd() * 16), rnd() * .25, 1.4, 0));
  return { segs, puntos };
}

// Escena completa. card = .mk3, pt = .mk3-pt.recien. Devuelve una promesa que se cumple al terminar.
// Rendimiento (en celular se veía trabada): los cristales se dibujan UNA vez en su propia capa conforme crecen
// (antes se redibujaban todos en cada cuadro), sin sombras durante la escena y con el lienzo a 1.5x.
export function escarchaMarcaje(card, pt) {
  const dot = pt && pt.querySelector('.mk3-dot.nvp');
  const fija = card && card.querySelector('canvas.nvp-guir');
  const hora = pt && pt.querySelector('.mk3-t');
  const directo = () => { if (fija) { fija.classList.remove('esperando'); pintarGuirnaldaNV(fija); } card && card.querySelectorAll('.nvp-tr.nuevo').forEach(e => e.classList.add('va')); return Promise.resolve(); };
  if (!card || !dot || reducido() || !card.offsetWidth) return directo();
  const mal = dot.classList.contains('mal');
  const W = card.offsetWidth, H = card.offsetHeight;
  const c = document.createElement('canvas'); c.className = 'nvp-fx'; card.appendChild(c);
  const { x, dpr } = preparar(c, W, H, 1.5);
  const capa = () => { const o = document.createElement('canvas'); o.width = c.width; o.height = c.height; const ox = o.getContext('2d'); ox.setTransform(dpr, 0, 0, dpr, 0, 0); return { c: o, x: ox }; };
  const frost = capa(), crist = capa();
  const rnd = semilla(mal ? 29 : 11);
  const { segs, puntos } = generaEscarcha(W, H, rnd), bulbos = bulbosDe(W);
  segs.sort((a, b) => a.t - b.t);
  const brillos = puntos.filter((_, i) => i % 2 === 0).slice(0, 40);
  const cr = card.getBoundingClientRect(), dr = dot.getBoundingClientRect();
  const d = { x: dr.left - cr.left + dr.width / 2, y: dr.top - cr.top + dr.height / 2 };
  const Rmax = Math.hypot(Math.max(d.x, W - d.x), Math.max(d.y, H - d.y)) + 30, Rfin = mal ? Rmax * .42 : Rmax;
  const gotas = [], vapor = [];
  const T_HIELO = 1.0, T_DESHIELO = mal ? 1.6 : 1.5, FIN = mal ? 5.0 : 4.4, CRECE = 1.05;   // los tiempos de la escena aprobada
  let R = 0, ultimoR = 0, tramo = false, iSeg = 0;
  if (hora) hora.classList.add('nvp-hielo');
  const cx = crist.x; cx.lineCap = 'round';
  return new Promise(res => {
    const t0 = performance.now();
    const paso = ahora => {
      if (!c.isConnected) return res();                  // la tarjeta se volvió a pintar: se corta la escena
      const t = (ahora - t0) / 1000, now = t;
      // cristales nuevos de este cuadro (se dibujan una sola vez)
      const tc = t * CRECE;
      while (iSeg < segs.length && segs[iSeg].t <= tc) {
        const s = segs[iSeg++];
        cx.strokeStyle = 'rgba(127,184,220,.45)'; cx.lineWidth = s.w + 1.4; cx.beginPath(); cx.moveTo(s.x1, s.y1); cx.lineTo(s.x2, s.y2); cx.stroke();
        cx.strokeStyle = 'rgba(255,255,255,.95)'; cx.lineWidth = s.w; cx.beginPath(); cx.moveTo(s.x1, s.y1); cx.lineTo(s.x2, s.y2); cx.stroke();
      }
      // capa de escarcha: velo desde las orillas + cristales + brillitos, menos lo que ya derritió el calor
      const f = frost.x; f.globalCompositeOperation = 'source-over'; f.clearRect(0, 0, W, H);
      const cub = clamp(t / T_HIELO), prof = easeOut(cub) * Math.min(W, H) * 0.62;
      const velo = (x0, y0, x1, y1) => { const g = f.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(226,241,252,${.88 * cub})`); g.addColorStop(1, 'rgba(226,241,252,0)'); return g; };
      f.fillStyle = velo(0, 0, 0, prof); f.fillRect(0, 0, W, prof); f.fillStyle = velo(0, H, 0, H - prof); f.fillRect(0, H - prof, W, prof);
      f.fillStyle = velo(0, 0, prof * 1.4, 0); f.fillRect(0, 0, prof * 1.4, H); f.fillStyle = velo(W, 0, W - prof * 1.4, 0); f.fillRect(W - prof * 1.4, 0, prof * 1.4, H);
      f.drawImage(crist.c, 0, 0, W, H);
      f.fillStyle = '#fff';
      for (const p of brillos) { if (p.t > tc) continue; f.globalAlpha = .6 + .4 * Math.sin(now * 6 + p.x); f.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); } f.globalAlpha = 1;
      const td = clamp((t - T_HIELO) / T_DESHIELO);
      if (t > T_HIELO) {
        let obj = Rfin * easeOut(td);
        if (mal && td >= 1) obj = Rfin * (1 - 0.18 * clamp((t - T_HIELO - T_DESHIELO) / 1.2));   // tarde: la escarcha regresa un poco
        R = obj;
        f.globalCompositeOperation = 'destination-out';
        const g = f.createRadialGradient(d.x, d.y, Math.max(0, R * .7), d.x, d.y, R + 1); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        f.fillStyle = g; f.beginPath(); f.arc(d.x, d.y, R + 2, 0, 7); f.fill();
        f.globalCompositeOperation = 'source-over';
        if (R - ultimoR > 4 && gotas.length < 36) { for (let k = 0; k < 2; k++) { const a = Math.PI * (.1 + rnd() * .8); gotas.push({ x: d.x + Math.cos(a) * R * (.9 + rnd() * .1), y: d.y + Math.sin(a) * R * .95 - rnd() * 8, vy: 8 + rnd() * 10, r: 1.4 + rnd() * 1.6, vida: 1, y0: 0 }); gotas[gotas.length - 1].y0 = gotas[gotas.length - 1].y; } ultimoR = R; }
        if (vapor.length < 30 && ((!mal && rnd() < .4) || rnd() < .12)) vapor.push({ x: d.x + (rnd() - .5) * R, y: d.y - rnd() * R * .4, v: 12 + rnd() * 10, vida: 1, r: 4 + rnd() * 6 });
      }
      // composición
      x.clearRect(0, 0, W, H);
      const salida = clamp((t - (FIN - .7)) / .7);           // al final la escarcha se desvanece y deja la tarjeta legible
      x.globalAlpha = 1 - salida; x.drawImage(frost.c, 0, 0, W, H);
      if (t > T_HIELO && R > 4 && td < 1) { x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(d.x, d.y, R * .6, d.x, d.y, R * 1.08); g.addColorStop(0, 'rgba(255,170,60,0)'); g.addColorStop(.75, `rgba(255,170,60,${.2 * (mal ? 1 - td * .5 : 1)})`); g.addColorStop(1, 'rgba(255,170,60,0)'); x.fillStyle = g; x.beginPath(); x.arc(d.x, d.y, R * 1.1, 0, 7); x.fill(); x.globalCompositeOperation = 'source-over'; }
      if (t > T_HIELO) { const k = (mal ? .18 + .1 * Math.sin(now * 18) : .28 * (1 - clamp((t - 3) / 1.4))) * (1 - salida); if (k > .01) { x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(d.x, d.y, 2, d.x, d.y, 60); g.addColorStop(0, `rgba(255,190,90,${k})`); g.addColorStop(1, 'rgba(255,190,90,0)'); x.fillStyle = g; x.beginPath(); x.arc(d.x, d.y, 60, 0, 7); x.fill(); x.globalCompositeOperation = 'source-over'; } }
      // gotas con su rastro corto
      x.lineCap = 'round';
      for (const g of gotas) { if (g.vida <= 0) continue; g.vy += 1.8; g.y += g.vy / 60; g.x += Math.sin(g.y * .3) * .15; g.vida -= .006; if (g.y > H + 6) { g.vida = 0; continue; }
        x.strokeStyle = 'rgba(180,215,240,.5)'; x.lineWidth = g.r * .9; x.beginPath(); x.moveTo(g.x, Math.max(g.y0, g.y - 26)); x.lineTo(g.x, g.y); x.stroke();
        x.fillStyle = 'rgba(205,232,250,.9)'; x.beginPath(); x.ellipse(g.x, g.y, g.r, g.r * 1.25, 0, 0, 7); x.fill();
        x.fillStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.arc(g.x - g.r * .3, g.y - g.r * .4, g.r * .35, 0, 7); x.fill(); }
      for (const v of vapor) { v.vida -= .012; v.y -= v.v / 60; v.r += .12; if (v.vida <= 0) continue; x.fillStyle = `rgba(255,255,255,${.22 * v.vida})`; x.beginPath(); x.arc(v.x, v.y, v.r, 0, 7); x.fill(); }
      x.globalAlpha = 1;
      bulbos.forEach((b, i) => {
        const dist = Math.hypot(b.x - d.x, cableY(W, b.x) + 14 - d.y);
        b.frio = cub * (dist < R * 1.02 ? clamp(1 - (R * 1.02 - dist) / 30) : 1);
        if (!mal) { if (dist < R) b.luz = Math.min(1, b.luz + .08); if (b.luz >= 1) b.luz = .85 + .15 * Math.sin(now * 3 + b.fase); }
        else if (dist < R) { const lat = Math.sin(now * 22 + i * 2) > .2 ? 1 : .15; b.luz = (t > 3.2 ? Math.max(0, 1 - (t - 3.2) * 1.2) : 1) * lat * .8; }
      });
      if (salida > 0) bulbos.forEach(b => { if (mal) b.frio = Math.max(b.frio, salida); else { b.frio *= 1 - salida; b.luz = b.luz + (.9 - b.luz) * salida; } });
      x.globalAlpha = clamp(t / 0.5); dibujaGuirnalda(x, W, bulbos, now, false); x.globalAlpha = 1;
      if (hora) {
        if (!mal && td > .55 && !hora.classList.contains('nvp-oro')) { hora.classList.remove('nvp-hielo'); hora.classList.add('nvp-oro'); }
        if (!mal && t > FIN - .9) hora.classList.remove('nvp-oro');
        if (mal && t > FIN - .7) hora.classList.remove('nvp-hielo');
      }
      if (!tramo && (mal ? td > .9 : td > .55)) { tramo = true; card.querySelectorAll('.nvp-tr.nuevo').forEach(e => e.classList.add('va')); }
      if (t < FIN) requestAnimationFrame(paso);
      else { if (fija) { fija.classList.remove('esperando'); pintarGuirnaldaNV(fija); } c.remove(); res(); }
    };
    requestAnimationFrame(paso);
  });
}
