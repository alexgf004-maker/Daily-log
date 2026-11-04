// ── Pre-Navidad: "¡Listo, guardado!" — la ventana empañada ──
// Lo usa mostrarGuardadoOK en index.html. Solo dibuja; no toca cómo se guarda el registro.
// Escena: una ventana de madera con foquitos; afuera un pueblito nevado. El vidrio se empaña como con un aliento
// y un dedo verde y peludo (con uña) escribe "¡Listo!" trazo por trazo, se levanta entre letra y letra y hace una
// palomita. Donde pasa el dedo se limpia el vaho y quedan perlitas de agua; al pie de algunos trazos se juntan gotas
// que resbalan a tirones. Al terminar de escribir se llama alTexto() para mostrar el texto y los datos.
// Con movimiento reducido no hay animación: sale la ventana ya escrita.

const NS = 'http://www.w3.org/2000/svg';
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, seg = (t, a, b) => clamp((t - a) / (b - a));
const eOut = t => 1 - Math.pow(1 - clamp(t), 3), eIO = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const semilla = s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

// "¡Listo!" en letra de mano: trazos en orden (el dedo se levanta entre uno y otro), en una caja de 300×130
const LETRAS = [
  [[22, 34], [22, 36]], [[22, 54], [21, 80], [19, 104], [18, 118]],
  [[70, 22], [66, 46], [60, 74], [55, 98], [56, 110], [70, 112], [86, 108], [98, 104]],
  [[112, 74], [111, 92], [110, 108], [116, 112]], [[118, 50], [118, 52]],
  [[154, 76], [142, 72], [134, 80], [142, 90], [152, 98], [148, 110], [134, 112], [128, 106]],
  [[180, 44], [178, 70], [176, 96], [178, 110], [188, 112]], [[164, 70], [178, 68], [194, 66]],
  [[222, 74], [208, 78], [202, 94], [210, 110], [226, 108], [232, 92], [226, 76], [214, 74]],
  [[256, 28], [254, 54], [252, 80], [251, 94]], [[250, 112], [250, 114]],
];
const PALOMITA = [[80, 150], [112, 176], [190, 128]];
function catmull(pts, n = 10) {
  if (pts.length < 3) return pts; const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); }
  }
  out.push(pts[pts.length - 1]); return out;
}

// Dedo verde y peludo con uña (dibujo plano). Origen = yema que toca el vidrio; el dedo sale hacia +y.
function dedoVerde(x, R, t, pelo) {
  const A = R * 1.95, L = R * 17, top = R * .2;
  const lado = s => { const pts = [], o = pelo.orilla[s > 0 ? 0 : 1];
    for (let i = 0; i < o.length; i++) { const y = top + R * 1.2 + i * (L - top) / o.length, m = o[i], sway = Math.sin(t * 2.4 + i * .9) * .06, base = s * A * (1 + .03 * Math.sin(i * 1.7));
      pts.push([base, y]); pts.push([base + s * R * m.l * (1 + sway), y + R * (.55 + m.d)]); pts.push([base + s * R * .08, y + R * (.7 + m.d * .6)]); }
    return pts; };
  const der = lado(1), izq = lado(-1).reverse();
  x.beginPath(); x.moveTo(-A, top + R * 1.2); x.bezierCurveTo(-A, -R * 1.9, A, -R * 1.9, A, top + R * 1.2);
  der.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(A, L); x.lineTo(-A, L); izq.forEach(p => x.lineTo(p[0], p[1])); x.closePath();
  const g = x.createLinearGradient(-A, 0, A, 0); g.addColorStop(0, '#3b7a1f'); g.addColorStop(.42, '#72c544'); g.addColorStop(.7, '#5aa834'); g.addColorStop(1, '#2f6418');
  x.fillStyle = g; x.fill(); x.strokeStyle = 'rgba(28,64,12,.55)'; x.lineWidth = 1.2; x.stroke();
  x.lineCap = 'round';
  for (const m of pelo.mechones) { const y = R * 2.4 + m.u * (L - R * 3), xx = (m.a - .5) * A * 1.6, l = R * (.7 + m.l * .9), ang = .25 + (m.a - .5) * .7 + Math.sin(t * 2 + m.u * 7) * .05;
    for (let k = -1; k <= 1; k++) { x.strokeStyle = k ? 'rgba(40,90,20,.55)' : 'rgba(170,230,120,.7)'; x.lineWidth = k ? 1.1 : 1.4; x.beginPath(); x.moveTo(xx + k * 1.6, y);
      x.quadraticCurveTo(xx + k * 1.6 + Math.sin(ang) * l * .6, y + l * .4, xx + k * 1.6 + Math.sin(ang) * l, y + Math.cos(ang) * l); x.stroke(); } }
  x.strokeStyle = 'rgba(28,64,12,.6)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(-A * .55, R * 5.4); x.quadraticCurveTo(0, R * 4.8, A * .55, R * 5.4);
  x.moveTo(-A * .45, R * 6.1); x.quadraticCurveTo(0, R * 5.6, A * .45, R * 6.1); x.stroke();
  const gu = x.createLinearGradient(0, -R * 2.2, 0, R * 2.2); gu.addColorStop(0, '#f6f0cf'); gu.addColorStop(.6, '#e2d59a'); gu.addColorStop(1, '#bfae6a');
  x.fillStyle = gu; x.beginPath(); x.moveTo(-A * .6, R * 2.0); x.bezierCurveTo(-A * .72, -R * .6, -A * .3, -R * 1.9, 0, -R * 2.35); x.bezierCurveTo(A * .3, -R * 1.9, A * .72, -R * .6, A * .6, R * 2.0);
  x.quadraticCurveTo(0, R * 2.5, -A * .6, R * 2.0); x.fill(); x.strokeStyle = 'rgba(110,90,35,.65)'; x.lineWidth = 1.1; x.stroke();
  x.strokeStyle = 'rgba(255,252,235,.85)'; x.lineWidth = 1.4; x.beginPath(); x.moveTo(-A * .42, -R * .4); x.quadraticCurveTo(-A * .1, -R * 1.7, A * .25, -R * 1.75); x.stroke();
  x.fillStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.ellipse(-A * .25, R * .2, R * .22, R * .75, -.15, 0, 7); x.fill();
  x.strokeStyle = 'rgba(150,120,60,.35)'; x.lineWidth = 1; x.beginPath(); x.moveTo(-A * .5, R * 1.5); x.quadraticCurveTo(0, R * 1.9, A * .5, R * 1.5); x.stroke();
}

// Arma la escena dentro de "cont" (un div que cubre la pantalla). Devuelve { duracion (s), detener() }.
export function escenaVentanaNV(cont, { alTexto } = {}) {
  const W = Math.max(320, innerWidth), H = Math.max(480, innerHeight), DPR = Math.min(1.5, devicePixelRatio || 1);
  const rnd = semilla(21);
  const reducido = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const lienzo = z => { const c = document.createElement('canvas'); c.style.zIndex = z; cont.appendChild(c); c.width = W * DPR; c.height = H * DPR; const x = c.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0); return { c, x }; };
  const capa = () => { const c = document.createElement('canvas'); c.width = W * DPR; c.height = H * DPR; const x = c.getContext('2d'); x.setTransform(DPR, 0, 0, DPR, 0, 0); return { c, x }; };
  const pasos = [];

  // ── afuera: pueblito nevado ──
  { const { x } = lienzo(1), suelo = H * .72;
    const casas = [...Array(7)].map((_, i) => ({ x: i * W / 6 - 20 + rnd() * 20, w: 52 + rnd() * 30, h: 46 + rnd() * 40, f: rnd() * 6 }));
    const pinos = [...Array(9)].map(() => ({ x: rnd() * W, h: 40 + rnd() * 50 }));
    const copos = [...Array(90)].map(() => ({ x: rnd() * W, y: rnd() * H, r: .7 + rnd() * 2.2, v: 14 + rnd() * 28, f: rnd() * 6 }));
    pasos.push((t, dt) => {
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b2a52'); g.addColorStop(.7, '#1d4f86'); g.addColorStop(1, '#2a6aa6'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(255,248,214,.1)'; x.beginPath(); x.arc(W * .78, H * .15, 64, 0, 7); x.fill(); x.fillStyle = '#fff8d6'; x.beginPath(); x.arc(W * .78, H * .15, 26, 0, 7); x.fill();
      x.fillStyle = '#163c66'; x.beginPath(); x.moveTo(0, suelo - 40); for (let i = 0; i <= 8; i++) x.quadraticCurveTo(i * W / 8 - W / 16, suelo - 70 - (i % 2) * 30, i * W / 8, suelo - 40); x.lineTo(W, H); x.lineTo(0, H); x.fill();
      for (const p of pinos) { x.fillStyle = '#0f3157'; x.beginPath(); x.moveTo(p.x, suelo - p.h - 20); x.lineTo(p.x + p.h * .35, suelo - 10); x.lineTo(p.x - p.h * .35, suelo - 10); x.fill();
        x.fillStyle = '#e8f4ff'; x.beginPath(); x.moveTo(p.x, suelo - p.h - 20); x.lineTo(p.x + p.h * .12, suelo - p.h + 2); x.lineTo(p.x - p.h * .12, suelo - p.h + 2); x.fill(); }
      for (const c of casas) { const y = suelo - c.h; x.fillStyle = '#5b2a1f'; x.fillRect(c.x, y, c.w, c.h); x.fillStyle = '#f3f8ff'; x.beginPath(); x.moveTo(c.x - 6, y); x.lineTo(c.x + c.w / 2, y - c.w * .42); x.lineTo(c.x + c.w + 6, y); x.fill();
        const v = .78 + .22 * Math.sin(t * 2.2 + c.f); x.fillStyle = `rgba(255,200,90,${v})`; x.fillRect(c.x + c.w * .2, y + c.h * .3, c.w * .22, c.h * .25); x.fillRect(c.x + c.w * .58, y + c.h * .3, c.w * .22, c.h * .25);
        x.fillStyle = 'rgba(255,190,80,.14)'; x.beginPath(); x.arc(c.x + c.w / 2, y + c.h * .42, c.w * .7, 0, 7); x.fill(); }
      x.fillStyle = '#eaf5ff'; x.fillRect(0, suelo, W, H - suelo);
      x.fillStyle = '#fff'; x.globalAlpha = .85;
      for (const p of copos) { p.y += p.v * dt; p.x += Math.sin(t * 1.3 + p.f) * .25; if (p.y > H) { p.y = -3; p.x = rnd() * W; } x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); }
      x.globalAlpha = 1;
    }); }

  // ── el vaho, el dedo y las gotas ──
  const { x } = lienzo(2), niebla = capa(), limpio = capa(), comp = capa();
  { const n = niebla.x; n.fillStyle = 'rgba(216,228,240,.88)'; n.fillRect(0, 0, W, H); for (let i = 0; i < 4200; i++) { n.fillStyle = `rgba(255,255,255,${rnd() * .22})`; n.fillRect(rnd() * W, rnd() * H, 1.4, 1.4); } }
  const perlas = [...Array(320)].map(() => ({ x: rnd() * W, y: rnd() * H, r: .5 + rnd() * 1.7 }));
  const k = Math.min((W - 60) / 300, 1.55), ox = W / 2 - 150 * k, oy = H * .25;
  const trazos = [...LETRAS.map(s => s.length <= 2 ? s : catmull(s, 8)), catmull(PALOMITA, 10)].map(s => s.map(p => [ox + p[0] * k, oy + p[1] * k]));
  const largo = s => { let L = 0; for (let i = 1; i < s.length; i++) L += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); return Math.max(L, 4); };
  const tIni = .3, VEL = 520 * k / 1.3, LEV = .09; let tt = tIni + .9;
  const plan = trazos.map((s, i) => { const d = largo(s) / VEL + (s.length <= 2 ? .06 : 0), p = { s, i0: tt, i1: tt + d, L: largo(s), hecho: 0 }; tt += d + LEV + (i === LETRAS.length - 1 ? .25 : 0); return p; });
  const tFin = tt, R = 8.5 * k;
  const pelo = { orilla: [0, 1].map(() => [...Array(26)].map(() => ({ l: .35 + rnd() * .95, d: rnd() * .5 }))), mechones: [...Array(46)].map(() => ({ u: rnd(), a: rnd(), l: rnd() })) };
  const brocha = (cx, cy, r) => { const g = limpio.x.createRadialGradient(cx, cy, r * .35, cx, cy, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); limpio.x.fillStyle = g; limpio.x.beginPath(); limpio.x.arc(cx, cy, r, 0, 7); limpio.x.fill(); };
  const gotas = [], bordes = [];
  let avisado = false;
  const escribir = (p, obj) => { let acum = 0;
    for (let i = 1; i < p.s.length; i++) { const a = p.s[i - 1], b = p.s[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (acum + l > p.hecho && acum < obj) { const desde = Math.max(0, p.hecho - acum), hasta = Math.min(l, obj - acum);
        for (let d = desde; d <= hasta; d += 1.5) { const q = d / l; brocha(a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, R * (1 + .06 * Math.sin(d)));
          if (rnd() < .05) bordes.push({ x: a[0] + (b[0] - a[0]) * q + (rnd() - .5) * R * 2.4, y: a[1] + (b[1] - a[1]) * q + (rnd() - .5) * R * 2.4, r: .8 + rnd() * 1.4 }); } }
      acum += l; }
    p.hecho = obj; };
  pasos.push((t, dt) => {
    const al = eOut(seg(t, 0, tIni + .6));
    let dedo = null;
    for (const p of plan) { if (t < p.i0) break; const u = clamp((t - p.i0) / (p.i1 - p.i0)), obj = p.L * eIO(u); escribir(p, obj);
      if (u < 1) { let a2 = 0; for (let i = 1; i < p.s.length; i++) { const a = p.s[i - 1], b = p.s[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (a2 + l >= obj) { const q = (obj - a2) / l; dedo = { x: a[0] + (b[0] - a[0]) * q, y: a[1] + (b[1] - a[1]) * q, toca: 1 }; break; } a2 += l; }
        if (!dedo) dedo = { x: p.s[p.s.length - 1][0], y: p.s[p.s.length - 1][1], toca: 1 }; }
      else if (!p.listo) { p.listo = 1; let low = p.s[0]; p.s.forEach(q => { if (q[1] > low[1]) low = q; });
        if (p.L > 40 && gotas.length < 5 && rnd() < .6) gotas.push({ x: low[0], y: low[1] + R * .6, r: 0, rmax: 2.2 + rnd() * 1.6, carga: .5 + rnd() * .9, v: 0, estado: 'crece', tope: low[1] + 28 + rnd() * 46 }); } }
    if (!dedo) { const sig = plan.find(p => t < p.i0), ant = [...plan].reverse().find(p => t >= p.i1);
      if (sig && ant) { const a = ant.s[ant.s.length - 1], b = sig.s[0], u = eIO(clamp((t - ant.i1) / (sig.i0 - ant.i1))); dedo = { x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * 14 * k, toca: 0 }; } }
    for (const g of gotas) {
      if (g.estado === 'crece') { g.r = Math.min(g.rmax, g.r + dt * 3); g.carga -= dt; if (g.carga <= 0) g.estado = 'baja'; }
      else if (g.estado === 'baja') { const tiron = Math.sin(t * 9 + g.x) > .2 ? 1 : .15; g.v = lerp(g.v, (40 + g.r * 24) * tiron, dt * 6); const y0 = g.y; g.y += g.v * dt; g.x += Math.sin(g.y * .07) * .08;
        limpio.x.strokeStyle = 'rgba(0,0,0,.85)'; limpio.x.lineWidth = g.r * 1.2; limpio.x.lineCap = 'round'; limpio.x.beginPath(); limpio.x.moveTo(g.x, y0); limpio.x.lineTo(g.x, g.y); limpio.x.stroke();
        g.r -= dt * .4; if (g.r < 1.4 || g.y > g.tope) g.estado = 'queda'; } }
    const c = comp.x; c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, W, H);
    if (al < 1) { c.save(); c.beginPath(); const rr = Math.hypot(W, H) * .62 * al; for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, w = 1 + .12 * Math.sin(a * 5 + 1) + .08 * Math.sin(a * 9); c.lineTo(W / 2 + Math.cos(a) * rr * w, H * .38 + Math.sin(a) * rr * w); } c.closePath(); c.clip(); }
    c.drawImage(niebla.c, 0, 0, W, H); c.fillStyle = 'rgba(255,255,255,.55)'; for (const p of perlas) { c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); }
    if (al < 1) c.restore();
    c.globalCompositeOperation = 'destination-out'; c.drawImage(limpio.c, 0, 0, W, H); c.globalCompositeOperation = 'source-over';
    c.fillStyle = 'rgba(255,255,255,.75)'; for (const b of bordes) { c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); }
    x.clearRect(0, 0, W, H); x.drawImage(comp.c, 0, 0, W, H);
    for (const g of gotas) { if (g.r <= 0) continue; x.fillStyle = 'rgba(232,244,255,.92)'; x.beginPath(); x.ellipse(g.x, g.y, g.r, g.r * 1.25, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(g.x - g.r * .35, g.y - g.r * .45, g.r * .35, 0, 7); x.fill(); }
    const visible = clamp(seg(t, tIni + .3, tIni + .8)) * (1 - seg(t, tFin, tFin + .5));
    if (visible > 0 && !reducido) { const ult = plan[plan.length - 1].s.slice(-1)[0], d = dedo || { x: ult[0], y: ult[1], toca: 0 };
      const sal = (1 - visible) * 240, px = d.x + sal * .6, py = d.y + sal, toca = d.toca;
      x.save(); x.translate(px, py); x.rotate(-.62);
      x.fillStyle = `rgba(40,60,90,${.18 + .12 * toca})`; x.beginPath(); x.ellipse(6 + (1 - toca) * 10, 4 + (1 - toca) * 10, R * 1.8, R * 1.3, 0, 0, 7); x.fill();
      const lev = (1 - toca) * -9; x.translate(lev * .4, lev); dedoVerde(x, R, t, pelo); x.restore(); }
    if (!avisado && t >= tFin) { avisado = true; alTexto && alTexto(); }
  });

  // ── marco de madera con foquitos ──
  { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', `0 0 ${W} ${H}`); s.setAttribute('preserveAspectRatio', 'none'); s.style.zIndex = 3; cont.appendChild(s);
    const fq = [...Array(Math.round(W / 34))].map((_, i) => { const px = 17 + i * 34, py = 30 + Math.sin(i * .9) * 5, c = ['#ff3b4e', '#ffd23f', '#2ee59d', '#4cc3ff', '#ff7ad9'][i % 5];
      return `<g class="fxn-fq"><circle cx="${px}" cy="${py + 12}" r="13" fill="${c}" opacity=".28"/><rect x="${px - 3}" y="${py - 2}" width="6" height="5" fill="#8b6b3a"/><ellipse cx="${px}" cy="${py + 9}" rx="5" ry="7" fill="${c}"/><ellipse cx="${px - 1.6}" cy="${py + 6}" rx="1.4" ry="2.4" fill="#fff" opacity=".7"/></g>`; }).join('');
    s.innerHTML = `<defs><linearGradient id="fxnMd" x1="0" x2="1"><stop offset="0" stop-color="#6b3f22"/><stop offset=".5" stop-color="#8a5530"/><stop offset="1" stop-color="#5a321a"/></linearGradient>
        <linearGradient id="fxnRefl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".10"/><stop offset=".5" stop-color="#ffd9a0" stop-opacity="0"/></linearGradient></defs>
      <rect x="0" y="0" width="${W}" height="${H}" fill="url(#fxnRefl)"/><rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="url(#fxnMd)" stroke-width="36"/>
      <rect x="${W / 2 - 7}" y="0" width="14" height="${H}" fill="url(#fxnMd)"/><rect x="0" y="${H * .56 - 7}" width="${W}" height="14" fill="url(#fxnMd)"/>
      <path d="M0 ${H - 18}h${W}v18H0z" fill="#4a2a14"/><path d="M18 ${H - 26}q${W / 4} -14 ${W / 2 - 18} -2q${W / 4} 12 ${W / 2 - 18} 0v8H18z" fill="#f3f8ff"/>
      <path d="M0 22 Q${W / 2} 48 ${W} 22" stroke="#14532d" stroke-width="2" fill="none"/>${fq}`;
    if (!reducido) s.querySelectorAll('.fxn-fq').forEach((g, i) => g.animate([{ opacity: 1 }, { opacity: .5 }, { opacity: 1 }], { duration: 1300 + i * 90, iterations: Infinity, delay: i * 110 })); }

  let vivo = true, raf = 0;
  if (reducido) {                                         // estado final directo, sin movimiento
    plan.forEach(p => escribir(p, p.L)); pasos.forEach(f => f(tFin + 1, 0)); alTexto && alTexto();
    return { duracion: 3.2, detener() { vivo = false; } };
  }
  const t0 = performance.now(); let prev = t0;
  const bucle = now => { if (!vivo || !cont.isConnected) return; const t = (now - t0) / 1000, dt = Math.min(.05, (now - prev) / 1000); prev = now; pasos.forEach(f => f(t, dt)); raf = requestAnimationFrame(bucle); };
  raf = requestAnimationFrame(bucle);
  return { duracion: tFin + 3.0, detener() { vivo = false; cancelAnimationFrame(raf); } };
}
