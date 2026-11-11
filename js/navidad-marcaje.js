// ── Pre-Navidad: marcaje «Bola de nieve» ──
// Lo usa el módulo principal de index.html (renderMarcajeCard y "Probar animaciones"). Solo dibuja; no toca
// cómo se marca ni qué se guarda.
//  · El punto del marcaje es una esfera roja con cheque (a tiempo) o gris con ✕ (tarde).
//  · Al marcar, un muñeco de nieve sale encima de la tarjeta y te lanza una bola (ver js/navidad-muneco.js).
//  · Arriba de la tarjeta queda una guirnalda de foquitos colgada de dos clavitos con acebo, en un <canvas>:
//    prendida si llegaste a tiempo, congelada si llegaste tarde.
// Con movimiento reducido no hay escena: la tarjeta sale ya en su estado final.
import { bolaDeNieveNV } from './navidad-muneco.js?v=1';

const COLS = [['#ff3b4e', '#b3001b'], ['#ffd23f', '#c98a00'], ['#2ee59d', '#0b7a4b'], ['#4cc3ff', '#0a6db5'], ['#ff7ad9', '#b0167f']];
// El lienzo es más alto que la guirnalda (38 px) para que el brillo de los foquitos se apague solo y no se vea cortado
export const ALTO_GUIRNALDA = 56;
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const mezcla = (a, b, t) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const m = s => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t); return `rgb(${m(16)},${m(8)},${m(0)})`; };
const reducido = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

// Adorno del punto: esfera roja con cheque (a tiempo) o gris con ✕ (tarde)
export function adornoNV(tono) {
  const mal = tono === 'mal';
  return `<svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true"><defs><radialGradient id="nvpB${mal ? 'm' : 'o'}" cx="35%" cy="30%"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
    <circle cx="22" cy="22" r="17" fill="${mal ? '#94a3b8' : '#c4152c'}"/><circle cx="22" cy="22" r="17" fill="url(#nvpB${mal ? 'm' : 'o'})"/>
    ${mal ? '<path d="M16 16l12 12M28 16L16 28" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' : '<path d="M14.5 22.5l5 5 10-11" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'}</svg>`;
}

// ── Guirnalda ──
// Cuelga de dos clavitos dorados con acebo, metidos lejos de las esquinas redondeadas; los foquitos van entre
// ellos, así ninguno queda mordido por la orilla de la tarjeta.
const PIN = 16;
const bulbosDe = W => { const a = PIN + 14, n = Math.max(6, Math.round((W - 2 * a) / 38) + 1), b = []; for (let i = 0; i < n; i++) b.push({ x: a + (W - 2 * a) * i / (n - 1), col: COLS[i % COLS.length], luz: 0, frio: 1, fase: i * 1.7 }); return b; };
const cableY = (W, x) => { const t = Math.max(0, Math.min(1, (x - PIN) / (W - 2 * PIN))); return 9 + 20 * t * (1 - t) + Math.sin(t * Math.PI * 6) * 1.1; };
function clavito(x, px, py, lado) {
  x.save(); x.translate(px, py);
  // acebo: dos hojas y dos bolitas
  [[-0.5, 1], [0.5, -1]].forEach(([r, k]) => { x.save(); x.rotate(r * lado + (lado < 0 ? Math.PI : 0)); x.fillStyle = '#1d5c3a'; x.strokeStyle = '#0f3a24'; x.lineWidth = .6;
    x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(3, -4 * k, 9, -4 * k, 12, -1 * k); x.bezierCurveTo(9, 2 * k, 4, 3 * k, 0, 0); x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = '#3a8a5a'; x.lineWidth = .5; x.beginPath(); x.moveTo(1, 0); x.lineTo(10, -1 * k); x.stroke(); x.restore(); });
  [[-2.4, 3.2], [1.2, 4.2]].forEach(([bx, by]) => { const g = x.createRadialGradient(bx - .8, by - .8, .2, bx, by, 2.4); g.addColorStop(0, '#ff6b78'); g.addColorStop(1, '#a50f1f'); x.fillStyle = g; x.beginPath(); x.arc(bx, by, 2.3, 0, 7); x.fill(); });
  // clavito dorado
  const g = x.createRadialGradient(-1, -1, .3, 0, 0, 3.4); g.addColorStop(0, '#fff4c2'); g.addColorStop(.5, '#e8b543'); g.addColorStop(1, '#8a5a10');
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, 3.2, 0, 7); x.fill();
  x.restore();
}
function dibujaGuirnalda(x, W, bulbos, now, sombra) {
  x.save(); x.strokeStyle = '#14532d'; x.lineWidth = 1.6; x.lineCap = 'round'; x.beginPath();
  for (let px = PIN; px <= W - PIN; px += 4) { const py = cableY(W, px); px === PIN ? x.moveTo(px, py) : x.lineTo(px, py); }
  x.lineTo(W - PIN, cableY(W, W - PIN)); x.stroke(); x.restore();
  clavito(x, PIN, cableY(W, PIN), 1); clavito(x, W - PIN, cableY(W, W - PIN), -1);
  bulbos.forEach((b, i) => {
    const cy = cableY(W, b.x), ang = Math.sin(now * 1.6 + b.fase) * 0.06 + (i % 2 ? 0.12 : -0.12), L = b.luz, [c1, c2] = b.col;
    x.save(); x.translate(b.x, cy); x.rotate(ang);
    if (L > 0.02) { x.save(); x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(0, 14, 1, 0, 14, 19); g.addColorStop(0, hexA(c1, .5 * L)); g.addColorStop(.6, hexA(c1, .14 * L)); g.addColorStop(1, hexA(c1, 0)); x.fillStyle = g; x.beginPath(); x.arc(0, 14, 19, 0, 7); x.fill(); x.restore(); }
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

// ── Escena al marcar: «Bola de nieve» (el muñeco y su escena viven en js/navidad-muneco.js) ──
// card = .mk3, pt = .mk3-pt.recien. Devuelve una promesa que se cumple al terminar. Cuando la bola llega al
// marcaje se pinta el tramo nuevo de la línea; al final queda la guirnalda fija (prendida o congelada).
export function escenaMarcajeNV(card, pt) {
  const dot = pt && pt.querySelector('.mk3-dot.nvp');
  const fija = card && card.querySelector('canvas.nvp-guir');
  const tramo = () => card && card.querySelectorAll('.nvp-tr.nuevo').forEach(e => e.classList.add('va'));
  const guirnalda = () => { if (fija) { fija.classList.remove('esperando'); pintarGuirnaldaNV(fija); } };
  if (!card || !dot || reducido() || !card.offsetWidth) { guirnalda(); tramo(); return Promise.resolve(); }
  return bolaDeNieveNV(card, pt, { revelar: tramo, alFinal: guirnalda });
}

// ── Etiqueta de estado "de regalo" (Pre-Navidad) ──
// En la tarjeta del marcaje, en vez de la píldora de siempre: una etiquetita de regalo con su agujero, colgando
// de un cordón de bastón de dulce y un poco ladeada. A tiempo: papel crema con letras rojas (foquito en la
// entrada, estrella en la salida, que dice "Jornada completa"); tarde o salida antes: escarchada en azul con un
// copo. Justificado: papel crema en gris. Los minutos se dicen igual que siempre ("12 min tarde").
const ICO_ET = {
  foco: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="9.5" y="2.5" width="5" height="4" rx="1"/><path d="M12 6.5c4 0 6 3.5 6 7 0 4-3 7.5-6 7.5s-6-3.5-6-7.5c0-3.5 2-7 6-7z"/></svg>',
  estrella: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8 6.2 20l1.4-6.4L2.7 9.2l6.5-.7z"/></svg>',
  copo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10M9 4l3 2 3-2M9 20l3-2 3 2"/></svg>'
};
const escTexto = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// tono: 'ok' | 'mal' | 'neutro'; tipo: 'Entrada' | 'Salida'; texto: el de chipEstado
export function etiquetaRegaloNV(tono, texto, tipo) {
  const salida = /salida/i.test(tipo || '');
  const txt = tono === 'ok' && salida ? 'Jornada completa' : texto;
  const ico = tono === 'ok' ? (salida ? ICO_ET.estrella : ICO_ET.foco) : tono === 'mal' ? ICO_ET.copo : '';
  return `<span class="nvp-et-w"><span class="nvp-et ${tono}">${ico}${escTexto(txt)}</span><span class="nvp-cordel" aria-hidden="true"></span></span>`;
}
