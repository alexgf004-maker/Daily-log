// ── Pre-Navidad: marcaje «Bola de nieve» ──
// Lo usa js/navidad-marcaje.js (escenaMarcajeNV). Solo dibuja; no toca cómo se marca ni qué se guarda.
//  · Al marcar, un muñeco de nieve sale de un montículo encima de la tarjeta (estilo ilustración: bolas con
//    textura de nieve, ojos y botones de carbón, zanahoria, ramitas con cejas, bufanda escocesa y sombrero de copa
//    con acebo).
//  · A tiempo: te ve, arma una bola en su ramita, cierra un ojo para apuntar y la lanza: da justo en tu marcaje
//    (estallido de nieve y destellos dorados, aparece la esfera roja) y celebra brincando el sombrero.
//  · Tarde: saca un reloj de bolsillo que suena, frunce las cejas, dice que no con la cabeza, le sale vapor del
//    sombrero del coraje y te lanza fuerte una bola de aguanieve sucia que se embarra en tu marcaje y escurre
//    hasta dejar ver la ✕.
//  · Todo vive en un <svg> encima de la tarjeta que se borra al terminar. Las bolas de nieve (lo único con filtro
//    de textura) se convierten una sola vez en imágenes para que el celular no recalcule el filtro en cada cuadro.

const NS = 'http://www.w3.org/2000/svg';
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), seg = (t, a, b) => cl((t - a) / (b - a)), lerp = (a, b, t) => a + (b - a) * t;
const eOut = t => 1 - Math.pow(1 - cl(t), 3), eIO = t => { t = cl(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const back = (t, c = 1.8) => { t = cl(t); return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const eIn = t => Math.pow(cl(t), 2.2), pulso = k => Math.sin(Math.PI * cl(k)), f1 = n => (+n).toFixed(1);
const K = 1.12;   // escala del muñeco
let N = 0;

// ── El muñeco (partes sueltas para moverlas) ──
function partesMuneco(id) {
  let s = 11; const R = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const G = k => `${k}_${id}`;
  const blob = (rx, ry, n = 18, amp = .05) => {
    const p = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = 1 + (R() * 2 - 1) * amp; p.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]); }
    const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; let d = `M${f1(m(p[n - 1], p[0])[0])} ${f1(m(p[n - 1], p[0])[1])}`;
    for (let i = 0; i < n; i++) { const q = m(p[i], p[(i + 1) % n]); d += ` Q${f1(p[i][0])} ${f1(p[i][1])} ${f1(q[0])} ${f1(q[1])}`; } return d + 'Z';
  };
  const defs = `
   <radialGradient id="${G('nv')}" cx=".34" cy=".26" r=".85"><stop offset="0" stop-color="#ffffff"/><stop offset=".38" stop-color="#f4f8fc"/><stop offset=".72" stop-color="#d6e2ef"/><stop offset="1" stop-color="#9fb4cf"/></radialGradient>
   <radialGradient id="${G('ao')}" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#5d77a3" stop-opacity=".5"/><stop offset="1" stop-color="#5d77a3" stop-opacity="0"/></radialGradient>
   <radialGradient id="${G('rim')}" cx=".85" cy=".55" r=".5"><stop offset="0" stop-color="#fff6e8" stop-opacity=".55"/><stop offset="1" stop-color="#fff6e8" stop-opacity="0"/></radialGradient>
   <filter id="${G('tx')}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="5" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="3.2" result="d"/>
     <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="8" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .62  0 0 0 0 .7  0 0 0 0 .84  0 0 0 -1.6 .95" result="m"/><feComposite in="m" in2="d" operator="in" result="mm"/>
     <feMerge><feMergeNode in="d"/><feMergeNode in="mm"/></feMerge></filter>
   <radialGradient id="${G('co')}" cx=".3" cy=".3" r=".8"><stop offset="0" stop-color="#4a4a52"/><stop offset=".6" stop-color="#1c1c22"/><stop offset="1" stop-color="#0a0a0e"/></radialGradient>
   <linearGradient id="${G('za')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f59a3c"/><stop offset=".5" stop-color="#e06a1c"/><stop offset="1" stop-color="#a84a10"/></linearGradient>
   <linearGradient id="${G('ra')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e4a30"/><stop offset="1" stop-color="#3a2414"/></linearGradient>
   <pattern id="${G('ta')}" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)"><rect width="16" height="16" fill="#8e1626"/><rect y="5" width="16" height="6" fill="#123d2a" opacity=".55"/><rect x="5" width="6" height="16" fill="#123d2a" opacity=".55"/><rect y="7.5" width="16" height="1" fill="#e8c46a" opacity=".7"/><rect x="7.5" width="1" height="16" fill="#e8c46a" opacity=".7"/><rect y="2" width="16" height=".6" fill="#fff" opacity=".18"/><rect x="2" width=".6" height="16" fill="#fff" opacity=".18"/></pattern>
   <linearGradient id="${G('fo')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>
   <linearGradient id="${G('fi')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a1a20"/><stop offset=".28" stop-color="#3c3c46"/><stop offset=".42" stop-color="#2a2a32"/><stop offset="1" stop-color="#0c0c10"/></linearGradient>
   <radialGradient id="${G('dr')}" cx=".45" cy=".3" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#e9f0f8"/><stop offset="1" stop-color="#bccde2"/></radialGradient>
   <radialGradient id="${G('gl')}"><stop offset="0" stop-color="#fff6d0"/><stop offset=".35" stop-color="#ffd35a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd35a" stop-opacity="0"/></radialGradient>
   <radialGradient id="${G('or')}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff4c2"/><stop offset=".5" stop-color="#e8b543"/><stop offset="1" stop-color="#9c6a14"/></radialGradient>`;
  let nb = 0;
  const bola = (r, ry) => { const d = blob(r, ry), c = G('cb' + (++nb)); return `<g filter="url(#${G('tx')})"><clipPath id="${c}"><path d="${d}"/></clipPath><path d="${d}" fill="url(#${G('nv')})"/><g clip-path="url(#${c})"><ellipse cx="0" cy="${f1(ry * .62)}" rx="${f1(r * .95)}" ry="${f1(ry * .5)}" fill="url(#${G('ao')})"/><ellipse cx="${f1(r * .45)}" cy="0" rx="${f1(r * .7)}" ry="${f1(ry * .9)}" fill="url(#${G('rim')})"/></g></g>`; };
  const carbon = (x, y, r) => `<path transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(R() * 90)})" d="${blob(r, r * .82, 7, .22)}" fill="url(#${G('co')})"/>`;
  const rama = (pts, ramitas) => {
    let g = `<path d="M${pts.map(p => p.join(' ')).join(' L')}" stroke="url(#${G('ra')})" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M${pts.slice(1).map(p => p.join(' ')).join(' L')}" stroke="#3a2414" stroke-width="1.8" stroke-linecap="round" fill="none"/>`;
    ramitas.forEach(([x, y, dx, dy, w]) => { g += `<path d="M${x} ${y}q${f1(dx * .45)} ${f1(dy * .35)} ${dx} ${dy}" stroke="#4a2e18" stroke-width="${w || 1.4}" stroke-linecap="round" fill="none"/>`; }); return g;
  };
  const acebo = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(.72)"><path d="M0 0C3 -2 4 -5 3 -8C6 -8 8 -10 8 -13C10 -12 13 -13 14 -15C14 -11 16 -9 18 -9C15 -6 14 -2 15 1C12 0 9 1 8 3C7 0 4 -1 0 0Z" fill="#1d5c3a" stroke="#0f3a24" stroke-width=".5"/><path d="M1 -1L14 -10" stroke="#3a8a5a" stroke-width=".5"/></g>`;
  const ojo = (x, y, c) => `<g class="${c}" transform="translate(${x} ${y})">${carbon(0, 0, 2.7)}<circle cx="-.8" cy="-.9" r=".7" fill="#fff" opacity=".55"/></g>`;
  const partes = {
    base: `${bola(40, 36)}${[-14, 8].map(y => carbon(0, y, 3.4)).join('')}`,
    medio: `${bola(29, 26)}${[-8, 8].map(y => carbon(0, y, 3)).join('')}`,
    cabeza: bola(21, 20),
    bolita: bola(7, 6.6),
    ojos: `<g class="oj">${ojo(-7, -4, 'ojI')}${ojo(7, -4.5, 'ojD')}</g>`,
    boca: `<g class="bo">${[[-8, 7], [-4.5, 9.5], [0, 10.5], [4.5, 9.5], [8, 7]].map(([x, y]) => `<g class="mc" transform="translate(${x} ${y})">${carbon(0, 0, 1.5)}</g>`).join('')}</g>`,
    cejas: `<g class="ce"><g class="ceI" transform="translate(-7.5 -11)"><path d="M-5 1.2Q-1 -1.4 5 -.2" stroke="#3a2414" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M-1 -.4l-1.6 -2" stroke="#3a2414" stroke-width="1" stroke-linecap="round"/></g><g class="ceD" transform="translate(7.5 -11.5)"><path d="M-5 -.2Q1 -1.4 5 1.2" stroke="#3a2414" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M1.5 -.6l1.4 -2" stroke="#3a2414" stroke-width="1" stroke-linecap="round"/></g></g>`,
    nariz: `<path d="M-1 -2.8C9 -3 21 -1 31 1.6C21 3.6 9 4.6 -1 3.6Z" fill="url(#${G('za')})"/><path d="M6 -2.4q.6 2.6 0 5.4M12 -1.8q.6 2.2 0 4.6M18 -1q.5 1.8 0 3.4M24 0q.3 1 0 2.2" stroke="#8a3a08" stroke-width=".8" fill="none" opacity=".6"/><path d="M0 -2.2C10 -2.2 20 -.6 28 1" stroke="#ffc88a" stroke-width=".9" fill="none" opacity=".6"/>`,
    brazoI: rama([[0, 0], [-18, -8], [-36, -20], [-50, -34]], [[-18, -8, -6, -12], [-34, -19, -14, -2], [-44, -28, -4, -12, 1.1]]),
    brazoD: rama([[0, 0], [18, -6], [34, -18], [50, -24]], [[18, -6, 4, -12], [32, -17, 10, 4], [42, -21, 6, -10, 1.1]]),
    bufanda: `<path d="M-27 -6C-14 2 14 2 27 -6L28 4C14 12 -14 12 -28 4Z" fill="url(#${G('ta')})"/><path d="M-27 -6C-14 2 14 2 27 -6L28 4C14 12 -14 12 -28 4Z" fill="url(#${G('fo')})"/>
      <path d="M-24 -2C-10 5 10 5 24 -2" stroke="#000" stroke-opacity=".18" stroke-width="1.2" fill="none"/>
      <g class="cola"><path d="M8 5C11 14 15 28 13 42L3 43C4 30 2 16 -1 7Z" fill="url(#${G('ta')})"/><path d="M8 5C11 14 15 28 13 42L3 43C4 30 2 16 -1 7Z" fill="url(#${G('fo')})" opacity=".6"/>
        <path d="M3.5 43l-.6 6M6.5 43l-.3 6.5M9.5 43l.2 6M12.5 42.6l.6 5.6" stroke="#8e1626" stroke-width="1.6" stroke-linecap="round"/></g>
      <path d="M1 3C-3 6 -4 10 0 12C5 13 9 10 9 6C9 3 5 1 1 3Z" fill="url(#${G('ta')})"/><path d="M1 3C-3 6 -4 10 0 12C5 13 9 10 9 6C9 3 5 1 1 3Z" fill="url(#${G('fo')})"/>`,
    sombrero: `<ellipse cx="0" cy="0" rx="25" ry="5" fill="#0e0e12"/><path d="M-25 0Q0 7 25 0" stroke="#3a3a44" stroke-width="1" fill="none"/>
      <path d="M-15 -1L-16 -32Q0 -36 16 -32L15 -1Q0 3 -15 -1Z" fill="url(#${G('fi')})"/><ellipse cx="0" cy="-32" rx="16" ry="3.6" fill="#26262e"/>
      <path d="M-15.4 -10L-15.2 -2Q0 2 15.2 -2L15.4 -10Q0 -6 -15.4 -10Z" fill="#7a1220"/><path d="M-15.3 -9Q0 -5 15.3 -9" stroke="#b8323e" stroke-width=".8" fill="none"/>
      ${acebo(7, -6, -35)}${acebo(9, -5.5, 15)}<circle cx="8.4" cy="-7.6" r="1.9" fill="#b3101f"/><circle cx="10.8" cy="-6.4" r="1.9" fill="#c4152c"/><circle cx="7.9" cy="-8.1" r=".6" fill="#fff" opacity=".6"/>`
  };
  return { defs, partes, G };
}

// Pasa a imagen (una sola vez) un dibujo que usa el filtro de textura. Devuelve el <image> y la promesa de carga.
function aImagen(defs, interior, x, y, w, h, urls) {
  const doc = `<svg xmlns="${NS}" viewBox="${x} ${y} ${w} ${h}" width="${w * 2}" height="${h * 2}"><defs>${defs}</defs>${interior}</svg>`;
  const u = URL.createObjectURL(new Blob([doc], { type: 'image/svg+xml' })); urls.push(u);
  const img = new Image(); img.src = u; const listo = (img.decode ? img.decode() : Promise.resolve()).catch(() => {});
  return { html: `<image href="${u}" x="${x}" y="${y}" width="${w}" height="${h}"/>`, listo };
}

const el = (padre, html) => { padre.insertAdjacentHTML('beforeend', html); return padre.lastElementChild; };
function chispas(sv, x, y, n, cols, vel = 160, grav = 220, vida = 1.1, forma = 'c') {
  const g = el(sv, '<g></g>'), ps = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = vel * (.4 + Math.random() * .8), r = 1.4 + Math.random() * 2.4;
    const e = document.createElementNS(NS, forma === 'e' ? 'path' : 'circle');
    if (forma === 'e') e.setAttribute('d', `M0 ${-r * 2.2}L${r * .6} ${-r * .6}L${r * 2.2} 0L${r * .6} ${r * .6}L0 ${r * 2.2}L${-r * .6} ${r * .6}L${-r * 2.2} 0L${-r * .6} ${-r * .6}Z`); else e.setAttribute('r', r.toFixed(1));
    e.setAttribute('fill', cols[i % cols.length]); g.appendChild(e); ps.push({ e, vx: Math.cos(a) * v, vy: Math.sin(a) * v - vel * .35, rot: Math.random() * 360 });
  }
  return t => { ps.forEach(p => { const k = cl(t / vida); p.e.setAttribute('transform', `translate(${f1(x + p.vx * t)} ${f1(y + p.vy * t + grav * t * t / 2)}) rotate(${(p.rot + t * 300).toFixed(0)})`); p.e.setAttribute('opacity', (1 - k * k).toFixed(2)); }); if (t > vida) g.remove(); };
}
// efectos que arrancan en un instante dado de la escena
function disparos() { const L = new Map(); return (t, t0, crear) => { let f = L.get(t0); if (!f && t >= t0) { f = crear(); L.set(t0, f); } if (f) f(t - t0); }; }

// Postura (coordenadas del muñeco; el suelo es y = 0)
function pose(M, o = {}) {
  const H = `translate(0 -140) rotate(${f1(o.hr || 0)})`;
  M.pc.setAttribute('transform', H); M.pna.setAttribute('transform', `${H} translate(0 1)`); M.pso.setAttribute('transform', `${H} translate(0 -19)${o.soX || ''}`);
  M.pbi.setAttribute('transform', `translate(-24 -102) rotate(${f1(o.ai || 0)})`); M.pbd.setAttribute('transform', `translate(24 -102) rotate(${f1(o.ad || 0)})`);
  M.cola.setAttribute('transform', `rotate(${f1(o.ond || 0)} 4 5)`); M.cu.setAttribute('transform', `rotate(${f1(o.tilt || 0)})`);
}
// Gesto: boca 1 sonrisa … -1 enojo/tristeza; ceja 1 fruncida … -1 preocupada; alza = cejas arriba; guino = cierra el ojo derecho
function cara(M, { boca = 1, ceja = 0, alza = 0, ojx = 0, ojy = 0, parp = 1, guino = 0 } = {}) {
  const p = Math.max(.08, parp);
  M.ojI.setAttribute('transform', `translate(${f1(-7 + ojx)} ${f1(-4 + ojy)}) scale(1 ${p.toFixed(2)})`);
  M.ojD.setAttribute('transform', `translate(${f1(7 + ojx)} ${f1(-4.5 + ojy)}) scale(1 ${(guino ? .12 : p).toFixed(2)})`);
  const XS = [-8, -4.5, 0, 4.5, 8], C = [-1.5, 1, 2, 1, -1.5];
  M.mc.forEach((m, i) => m.setAttribute('transform', `translate(${f1(XS[i] * (boca < 0 ? .85 : 1) + ojx * .3)} ${f1(8.5 + boca * C[i])})`));
  M.ceI.setAttribute('transform', `translate(${f1(-7.5 + ojx * .4)} ${f1(-11 + ceja * 1.3 - alza * 2)}) rotate(${f1(ceja * 22)})`);
  M.ceD.setAttribute('transform', `translate(${f1(7.5 + ojx * .4)} ${f1(-11.5 + ceja * 1.3 - alza * 2)}) rotate(${f1(-ceja * 22)})`);
}
const parpadeo = (t, t0) => 1 - pulso(seg(t, t0, t0 + .16));
// mano izquierda en pantalla con el brazo girado a grados
const manoI = (sx, by, a) => { const r = a * Math.PI / 180, x = -50, y = -34; return { x: sx + K * (-24 + x * Math.cos(r) - y * Math.sin(r)), y: by + K * (-102 + x * Math.sin(r) + y * Math.cos(r)) }; };

// Mancha de aguanieve que se embarra en el marcaje y escurre
function mancha(sv, d) {
  let s = 7; const R = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; const n = 16; let p = '';
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, r = (i % 2 ? 11 : 17) * (.8 + R() * .4); p += (i ? 'L' : 'M') + f1(Math.cos(a) * r) + ' ' + f1(Math.sin(a) * r * .85); } p += 'Z';
  const g = el(sv, `<g transform="translate(${f1(d.x)} ${f1(d.y)})"><g class="mz"><path d="${p}" fill="#c3ccd6" stroke="#8a96a4" stroke-width="1"/><path d="${p}" fill="#7c8796" opacity=".25" transform="scale(.6) translate(3 4)"/>
     ${[[-6, -3, 2.2], [5, 2, 1.6], [-1, 5, 1.8], [7, -6, 1.3], [-9, 4, 1.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#6f7a88" opacity=".55"/>`).join('')}<ellipse cx="-4" cy="-6" rx="5" ry="2" fill="#fff" opacity=".45"/></g>
     ${[[-7, 15], [2, 18], [9, 14]].map(([x, y]) => `<rect data-y0="${y}" x="${x - 1.8}" y="${y}" width="3.6" height="1" rx="1.8" fill="#c3ccd6" stroke="#8a96a4" stroke-width=".6"/>`).join('')}</g>`);
  const mz = g.querySelector('.mz'), es = [...g.querySelectorAll('rect')];
  return (t, resta) => {
    const k = back(seg(t, 0, .25), 2.5), ab = eIn(seg(t, .55, 1.5));
    mz.setAttribute('transform', `translate(0 ${f1(ab * 26)}) scale(${Math.max(.01, k * (1 - .25 * ab)).toFixed(3)} ${Math.max(.01, k * .9 * (1 + .5 * ab)).toFixed(3)})`); mz.setAttribute('opacity', f1(1 - seg(t, .9, 1.6)));
    es.forEach((r, i) => { r.setAttribute('height', f1(1 + eOut(seg(t, .2 + i * .12, 1.4 + i * .12)) * (10 + i * 5))); r.setAttribute('y', f1(+r.dataset.y0 + ab * 14)); });
    g.setAttribute('opacity', f1(1 - seg(-resta, -1.1, -.5)));
  };
}

// Escena completa. card = .mk3, pt = .mk3-pt.recien. op.revelar() se llama cuando la bola llega al marcaje y
// op.alFinal() al terminar. Devuelve una promesa que se cumple al terminar (o si la tarjeta se vuelve a pintar).
export function bolaDeNieveNV(card, pt, op = {}) {
  const dot = pt.querySelector('.mk3-dot'), mal = dot.classList.contains('mal');
  const MARGEN = 250, cr = card.getBoundingClientRect(), dr = dot.getBoundingClientRect();
  const W = Math.round(cr.width + 40), H = Math.round(cr.height + MARGEN + 40), cw = cr.width;
  const d = { x: dr.left + dr.width / 2 - cr.left + 20, y: dr.top + dr.height / 2 - cr.top + MARGEN };
  const sx = Math.min(W - 104, d.x + cw * .6), by = MARGEN + 10;
  const ovAntes = card.style.overflow, posAntes = card.style.position; card.style.overflow = 'visible';
  if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
  card.querySelectorAll(':scope>.nvm-esc').forEach(e => e.remove());
  const sv = document.createElementNS(NS, 'svg'); sv.setAttribute('class', 'nvm-esc'); sv.setAttribute('aria-hidden', 'true'); sv.setAttribute('viewBox', `0 0 ${W} ${H}`);
  sv.style.cssText = `position:absolute;left:-20px;top:${-MARGEN}px;width:${W}px;height:${H}px;pointer-events:none;overflow:visible;z-index:6`;
  dot.style.transition = 'none'; dot.style.opacity = '0';

  const id = 'nvm' + (++N), mn = partesMuneco(id), P = mn.partes, G = mn.G, urls = [];
  const img = (interior, x, y, w, h) => aImagen(mn.defs, interior, x, y, w, h, urls);
  const iBase = img(P.base, -44, -40, 88, 80), iMedio = img(P.medio, -33, -30, 66, 60), iCabeza = img(P.cabeza, -25, -24, 50, 48), iBola = img(P.bolita, -10, -10, 20, 20);
  const iDeriva = img(`<path d="M-96 4C-84 -10 -62 -18 -36 -14C-14 -24 20 -24 42 -14C66 -18 88 -10 98 4Z" fill="url(#${G('dr')})" filter="url(#${G('tx')})"/>`, -100, -28, 202, 36);
  const iLabio = img(`<path d="M-70 4C-50 -8 -20 -11 0 -9C24 -12 52 -8 72 4Z" fill="url(#${G('dr')})" filter="url(#${G('tx')})"/>`, -74, -15, 150, 22);
  const cp = id + 'cp';
  sv.innerHTML = `<defs>${mn.defs}<clipPath id="${cp}"><rect x="-200" y="-400" width="${W + 400}" height="${by - 6 + 400}"/></clipPath></defs>
    <g class="dv"><ellipse cx="${sx}" cy="${by + 2}" rx="92" ry="9" fill="#5d77a3" opacity=".18"/><g transform="translate(${sx} ${by})">${iDeriva.html}</g>
      <g transform="translate(${sx - 78} ${by - 6}) rotate(-24)"><path d="M0 0L30 -4" stroke="#3a2414" stroke-width="1.6"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${3 + i * 3} ${-0.4 * i}l${i % 2 ? 4 : -2} ${i % 2 ? -6 : -7}M${3 + i * 3} ${-0.4 * i}l${i % 2 ? -3 : 3} 6" stroke="#1d5c3a" stroke-width="1.3" stroke-linecap="round"/>`).join('')}</g></g>
    <g clip-path="url(#${cp})"><g class="mu"><g class="cu">
      <g transform="translate(0 -36)">${iBase.html}</g><g transform="translate(0 -94)">${iMedio.html}</g>
      <g class="pbi">${P.brazoI}<g transform="translate(-50 -34)"><g class="bo0" opacity="0">${iBola.html}</g></g></g>
      <g class="pbd">${P.brazoD}<g transform="translate(50 -24)"><g class="rl" opacity="0"><path d="M0 0Q3 8 0 14" stroke="#c9a03a" stroke-width="1.2" fill="none" stroke-dasharray="2 1.2"/>
        <g transform="translate(0 27)"><g class="vib"><rect x="-2.6" y="-17" width="5.2" height="4.4" rx="1.2" fill="url(#${G('or')})"/><circle r="13.5" fill="url(#${G('or')})"/><circle r="11" fill="#fffaf0" stroke="#9c6a14" stroke-width=".8"/>
        ${Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30})" d="M0 -10V${i % 3 ? -8.8 : -7.6}" stroke="#3a2a1a" stroke-width="${i % 3 ? .6 : 1.1}"/>`).join('')}
        <path class="hh" d="M0 1.2V-5.6" stroke="#2a1a10" stroke-width="1.6" stroke-linecap="round"/><path class="mm" d="M0 1.2V-8.4" stroke="#b3101f" stroke-width="1" stroke-linecap="round"/><circle r="1.2" fill="#2a1a10"/>
        <g class="ring" opacity="0"><path d="M-17 -6q-3 6 0 12M-21 -9q-5 9 0 18M17 -6q3 6 0 12M21 -9q5 9 0 18" stroke="#ffd35a" stroke-width="1.6" fill="none" stroke-linecap="round"/></g></g></g></g></g></g>
      <g class="pc"><g>${iCabeza.html}</g>${P.ojos}${P.boca}${P.cejas}</g>
      <g class="pna">${P.nariz}</g><g class="pso">${P.sombrero}</g><g transform="translate(0 -118)">${P.bufanda}</g></g></g></g>
    <g transform="translate(${sx} ${by})">${iLabio.html}</g>
    <g class="vu" opacity="0">${iBola.html}</g>`;
  const q = c => sv.querySelector(c);
  const M = { mu: q('.mu'), cu: q('.cu'), pbi: q('.pbi'), pbd: q('.pbd'), pc: q('.pc'), pna: q('.pna'), pso: q('.pso'), cola: q('.cola'), ojI: q('.ojI'), ojD: q('.ojD'), mc: [...sv.querySelectorAll('.mc')], ceI: q('.ceI'), ceD: q('.ceD') };
  const bo0 = q('.bo0'), rl = q('.rl'), vib = q('.vib'), hh = q('.hh'), mm = q('.mm'), ring = q('.ring'), vu = q('.vu'), dv = q('.dv');
  const estela = Array.from({ length: 6 }, (_, i) => el(sv, `<circle r="${(3 - i * .4).toFixed(1)}" fill="#fff" opacity="0"/>`)), hist = [];
  const vapor = Array.from({ length: 6 }, (_, i) => ({ e: el(sv, '<circle r="5" fill="#ffffff" stroke="#d8e4f0" stroke-width="1" opacity="0"/>'), f: i * .13, dx: (i % 2 ? 1 : -1) * (4 + i * 1.5) }));
  const sucia = 'saturate(.4) brightness(.82) sepia(.25)';
  const en = disparos(); let embarre = null, revelado = false, salida = null;
  const T = mal ? 6.2 : 4.8;
  pose(M); cara(M); M.mu.setAttribute('opacity', '0');
  card.appendChild(sv);

  const revela = k => { const b = back(k, 2.4); dot.style.opacity = String(cl(k * 3)); dot.style.transform = `scale(${(.3 + .7 * b).toFixed(3)})`; if (k > 0 && !revelado) { revelado = true; op.revelar && op.revelar(); } if (k >= 1) dot.style.transform = ''; };
  const terminar = () => {
    dot.style.opacity = ''; dot.style.transform = ''; dot.style.transition = ''; if (!revelado) { revelado = true; op.revelar && op.revelar(); }
    op.alFinal && op.alFinal();
    sv.style.transition = 'opacity .35s'; sv.style.opacity = '0';
    setTimeout(() => { sv.remove(); card.style.overflow = ovAntes; card.style.position = posAntes; urls.forEach(u => URL.revokeObjectURL(u)); }, 400);
  };
  const cuadro = t => {
    // sale de la nieve
    const kr = seg(t, .2, 1.0); M.mu.setAttribute('transform', `translate(${f1(sx)} ${f1(by + lerp(215, 0, back(kr, 1.5)))}) scale(${K})`);
    M.mu.setAttribute('opacity', String(cl(kr * 4) * (1 - seg(t, T - .6, T)))); dv.setAttribute('opacity', String(eOut(seg(t, 0, .4)) * (1 - seg(t, T - .6, T))));
    en(t, .55, () => chispas(sv, sx, by - 8, 22, ['#ffffff', '#e6f0fa', '#d3e3f3'], 120, 260, .9));
    const o = { ond: Math.sin(t * 3) * 4 }, c = { boca: .8, parp: parpadeo(t, 1.15) };
    let lanza = null;   // [salida, duración, altura del arco, escala]
    if (!mal) {
      c.ojx = -1.6 * eOut(seg(t, 1.1, 1.3));
      // arma la bola: se agacha y aparece en su ramita
      const ag = pulso(seg(t, 1.3, 1.9)); o.tilt = -9 * ag; o.ai = -40 * ag;
      const kb = back(seg(t, 1.55, 1.85), 2); bo0.setAttribute('opacity', String(t < 2.32 ? cl(kb * 3) : 0)); bo0.setAttribute('transform', `scale(${Math.max(.01, kb).toFixed(3)})`);
      // apunta (cierra un ojo) y lanza
      if (t > 1.9) { const kw = eIO(seg(t, 1.9, 2.2)), kt = eOut(seg(t, 2.22, 2.36)); o.ai = t < 2.22 ? 42 * kw : lerp(42, -38, kt); if (t > 2.4) o.ai = -38 * (1 - eOut(seg(t, 2.4, 3.0))); o.tilt = t < 2.22 ? -5 * kw : lerp(-5, 7, kt) * (1 - seg(t, 2.5, 3)); }
      c.ceja = .35 * pulso(seg(t, 1.85, 2.3)); c.guino = t > 1.9 && t < 2.25;
      lanza = [2.32, .63, 58, 1, -34];
      en(t, 2.95, () => chispas(sv, d.x, d.y, 18, ['#ffffff', '#e6f0fa'], 150, 200, .8));
      en(t, 2.97, () => chispas(sv, d.x, d.y, 14, ['#ffd35a', '#fff6d0'], 110, 40, 1.1, 'e'));
      revela(seg(t, 2.92, 3.35));
      // celebra
      c.boca = .8 + .6 * seg(t, 2.95, 3.15); c.alza = pulso(seg(t, 2.95, 3.8));
      const kh = seg(t, 3.0, 3.55); o.soX = ` translate(0 ${f1(-16 * pulso(kh))}) rotate(${f1(-16 * pulso(kh))} 0 -10)`; o.ad = t > 3 ? -30 * pulso(seg(t, 3.0, 3.6)) : 0;
    } else {
      // saca el reloj: suena y vibra
      const kw = eOut(seg(t, 1.1, 1.45)); o.ad = -34 * kw; rl.setAttribute('opacity', String(cl(kw * 3) * (1 - seg(t, 3.05, 3.25))));
      rl.setAttribute('transform', `rotate(${f1(34 * kw + Math.sin(t * 5) * 12 * (1 - seg(t, 1.4, 2.2)))})`);
      hh.setAttribute('transform', `rotate(${f1(lerp(0, 300, eOut(seg(t, 1.3, 2.0))))})`); mm.setAttribute('transform', `rotate(${f1(t * 900)})`);
      const suena = t > 1.85 && t < 2.9; ring.setAttribute('opacity', suena ? String(.5 + .5 * Math.sin(t * 50)) : '0'); vib.setAttribute('transform', suena ? `rotate(${f1(Math.sin(t * 70) * 9)}) translate(${f1(Math.sin(t * 90) * 1.2)} 0)` : '');
      c.ojx = 2.4 * eOut(seg(t, 1.35, 1.6)); c.ojy = 1.8 * eOut(seg(t, 1.35, 1.6));
      // se enoja: cejas fruncidas, dice que no y echa vapor
      const enojo = eOut(seg(t, 2.0, 2.3)); c.ceja = 1.15 * enojo; c.boca = lerp(.8, -1, enojo); c.parp *= 1 - .25 * enojo;
      const no = seg(t, 2.35, 3.0); o.hr = Math.sin(no * Math.PI * 5) * 9 * pulso(no); o.tilt = Math.sin(no * Math.PI * 5) * 2 * pulso(no);
      vapor.forEach(v => { const k = seg(t, 2.3 + v.f, 3.2 + v.f); if (k <= 0 || k >= 1) { v.e.setAttribute('opacity', '0'); return; } v.e.setAttribute('opacity', f1(Math.min(1, 1.4 * pulso(k)))); v.e.setAttribute('r', f1(4 + k * 9)); v.e.setAttribute('cx', f1(sx + v.dx * K * (1 + k * 1.6))); v.e.setAttribute('cy', f1(by - K * 195 - k * 34)); });
      if (t > 3.05) o.ad = -34 * (1 - eOut(seg(t, 3.05, 3.4)));
      // aprieta una bola sucia y la lanza con fuerza
      const kb = back(seg(t, 3.15, 3.45), 2); bo0.setAttribute('opacity', String(t < 3.83 ? cl(kb * 3) : 0)); bo0.setAttribute('transform', `scale(${Math.max(.01, kb).toFixed(3)})`); bo0.style.filter = sucia;
      if (t > 3.45) { const kw2 = eIO(seg(t, 3.45, 3.72)), kt = eOut(seg(t, 3.72, 3.84)); o.ai = t < 3.72 ? 48 * kw2 : lerp(48, -45, kt); if (t > 3.9) o.ai = -45 * (1 - eOut(seg(t, 3.9, 4.6))); o.tilt = t < 3.72 ? -7 * kw2 : lerp(-7, 10, kt) * (1 - seg(t, 4.0, 4.6)); }
      lanza = [3.83, .29, 16, 1.35, -45];
      if (t >= 4.12 && !embarre) embarre = mancha(sv, d); if (embarre) embarre(t - 4.12, T - t);
      en(t, 4.12, () => chispas(sv, d.x, d.y, 20, ['#b9c4cf', '#8e9aa8', '#dfe6ee'], 170, 320, .9));
      revela(seg(t, 4.75, 5.2));
      if (t > 4.3) { c.ceja = 1.15; c.boca = -1; }
    }
    // la bola en el aire, con su estela
    const [t0, dur, alto, esc, ang] = lanza, kf = seg(t, t0, t0 + dur);
    if (t >= t0 && kf < 1) {
      salida = salida || manoI(sx, by, ang); const x = lerp(salida.x, d.x, kf), y = lerp(salida.y, d.y, kf) - Math.sin(kf * Math.PI) * alto;
      vu.setAttribute('opacity', '1'); vu.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) rotate(${f1(-kf * 600)}) scale(${(K * esc).toFixed(3)})`); if (mal) vu.style.filter = sucia; hist.unshift([x, y]);
    } else { vu.setAttribute('opacity', '0'); if (kf >= 1) hist.unshift(null); }
    hist.length = Math.min(hist.length, 12);
    estela.forEach((e, i) => { const h = hist[i * 2]; if (h) { e.setAttribute('cx', f1(h[0])); e.setAttribute('cy', f1(h[1])); e.setAttribute('opacity', (.6 - i * .09).toFixed(2)); } else e.setAttribute('opacity', '0'); });
    pose(M, o); cara(M, c);
  };
  return new Promise(res => {
    // espera a que las bolas estén listas como imagen (máximo medio segundo) y arranca
    const imgs = [iBase, iMedio, iCabeza, iBola, iDeriva, iLabio].map(i => i.listo);
    Promise.race([Promise.all(imgs), new Promise(r => setTimeout(r, 500))]).then(() => {
      const t0 = performance.now();
      const paso = ahora => {
        if (!sv.isConnected) { urls.forEach(u => URL.revokeObjectURL(u)); return res(); }   // la tarjeta se volvió a pintar
        const t = Math.min(T, (ahora - t0) / 1000); cuadro(t);
        if (t < T) requestAnimationFrame(paso); else { terminar(); res(); }
      };
      requestAnimationFrame(paso);
    });
  });
}
