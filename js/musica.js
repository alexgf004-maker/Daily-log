// js/musica.js
// Música de fondo de la app (login y dentro de la app), con botón de silencio.
//
// El admin sube un MP3 desde su perfil. Se guarda en la base en partes de
// texto (base64), porque la app no usa Firebase Storage:
//   config/musica                     { version, nombre, tipo, bytes, partes, activa, subidoPor, subidoEn }
//   config/musicaDatos/{version}/{i}  '<base64 de esa parte>'
// Cada teléfono la descarga UNA sola vez y la guarda en el navegador
// (IndexedDB); mientras la versión no cambie no vuelve a bajarla, así que no
// gasta descargas de la base en cada visita.
//
// Los navegadores no dejan sonar audio hasta que la persona toca la pantalla:
// si no puede arrancar sola, empieza con el primer toque o tecla.

export const MAX_BYTES = 6 * 1024 * 1024;     // tope del MP3
const PARTE = 512 * 1024;                     // caracteres base64 por parte
const VOLUMEN = 0.35;
const CLAVE_SILENCIO = 'innova_musica_silencio';
const IDB = 'innova-musica', STORE = 'pista';

let fb = null;            // { db, ref, get, set, update }
let audio = null, url = null, versionActual = null;
let silenciada = false, activa = false, desbloqueada = false;
let boton = null;

// ── Caché en el navegador ─────────────────────────
function abrirIDB() {
  return new Promise((ok, mal) => {
    const r = indexedDB.open(IDB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => mal(r.error);
  });
}
async function leerCache() {
  try {
    const d = await abrirIDB();
    return await new Promise(ok => {
      const q = d.transaction(STORE).objectStore(STORE).get('actual');
      q.onsuccess = () => ok(q.result || null);
      q.onerror = () => ok(null);
    });
  } catch (_) { return null; }
}
async function guardarCache(v) {
  try {
    const d = await abrirIDB();
    const t = d.transaction(STORE, 'readwrite');
    if (v) t.objectStore(STORE).put(v, 'actual'); else t.objectStore(STORE).delete('actual');
  } catch (_) {}
}

// ── base64 ────────────────────────────────────────
function aBase64(buf) {
  const b = new Uint8Array(buf); let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}
function deBase64(txt, tipo) {
  const s = atob(txt), b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return new Blob([b], { type: tipo || 'audio/mpeg' });
}

// ── Reproducción ──────────────────────────────────
function ponerPista(blob, version) {
  if (url) URL.revokeObjectURL(url);
  url = URL.createObjectURL(blob);
  versionActual = version;
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
  }
  audio.src = url;
  audio.volume = 0;
  pintarBoton();
  intentarSonar();
}

function quitarPista() {
  if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
  if (url) { URL.revokeObjectURL(url); url = null; }
  versionActual = null;
  pintarBoton();
}

// Sube el volumen poco a poco (no arranca de golpe)
let rampa = null;
function subirVolumen() {
  clearInterval(rampa);
  rampa = setInterval(() => {
    if (!audio) return clearInterval(rampa);
    audio.volume = Math.min(VOLUMEN, audio.volume + VOLUMEN / 20);
    if (audio.volume >= VOLUMEN) clearInterval(rampa);
  }, 80);
}

function debeSonar() {
  return !!(audio && url && activa && !silenciada && document.visibilityState === 'visible');
}

function intentarSonar() {
  if (!debeSonar()) { if (audio && !audio.paused) audio.pause(); return; }
  if (!audio.paused) return;
  const p = audio.play();
  if (p && p.then) p.then(() => { desbloqueada = true; subirVolumen(); }).catch(() => {});
}

// Primer toque o tecla: los navegadores ya dejan sonar
function alPrimerGesto() {
  if (desbloqueada) return;
  intentarSonar();
}

// ── Botón flotante ────────────────────────────────
const ICO_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
const ICO_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><line x1="2" y1="2" x2="22" y2="22"/></svg>';

function pintarBoton() {
  const hay = !!(url && activa);
  if (!hay) { if (boton) boton.hidden = true; return; }
  if (!boton) {
    boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'mus-btn';
    boton.addEventListener('click', e => { e.stopPropagation(); alternarSilencio(); });
    document.body.appendChild(boton);
  }
  boton.hidden = false;
  boton.classList.toggle('off', silenciada);
  boton.innerHTML = silenciada ? ICO_OFF : ICO_ON;
  boton.setAttribute('aria-label', silenciada ? 'Activar música' : 'Silenciar música');
  boton.title = silenciada ? 'Activar música' : 'Silenciar música';
}

export function alternarSilencio() {
  silenciada = !silenciada;
  try { if (silenciada) localStorage.setItem(CLAVE_SILENCIO, '1'); else localStorage.removeItem(CLAVE_SILENCIO); } catch (_) {}
  pintarBoton();
  if (silenciada) audio?.pause(); else intentarSonar();
}

// ── Sincronizar con la base ───────────────────────
async function sincronizar(meta) {
  activa = !!(meta && meta.version && meta.activa !== false);
  if (!meta || !meta.version) { quitarPista(); guardarCache(null); return; }
  if (!activa) { audio?.pause(); pintarBoton(); return; }   // apagada para todos: ni se descarga
  if (meta.version === versionActual) { pintarBoton(); intentarSonar(); return; }

  const cache = await leerCache();
  if (cache && cache.version === meta.version && cache.blob) { ponerPista(cache.blob, meta.version); return; }

  // Versión nueva: se baja una sola vez y queda guardada en el teléfono
  try {
    const snap = await fb.get(fb.ref(fb.db, `config/musicaDatos/${meta.version}`));
    if (!snap.exists()) return;
    const val = snap.val();
    const partes = Array.isArray(val) ? val : Object.keys(val).sort((a, b) => a - b).map(k => val[k]);
    if (partes.length !== meta.partes) return;   // a medio subir
    const blob = deBase64(partes.join(''), meta.tipo);
    await guardarCache({ version: meta.version, blob, nombre: meta.nombre || '' });
    ponerPista(blob, meta.version);
  } catch (e) { console.warn('[musica]', e.message); }
}

/**
 * Arranca la música. Llamar una vez al cargar la app.
 * fbFns = { db, ref, get, onValue, set, update }
 */
export async function iniciarMusica(fbFns) {
  fb = fbFns;
  try { silenciada = localStorage.getItem(CLAVE_SILENCIO) === '1'; } catch (_) {}

  ['pointerdown', 'keydown', 'touchend'].forEach(ev => document.addEventListener(ev, alPrimerGesto, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') intentarSonar(); else audio?.pause();
  });

  // Lo guardado en el teléfono suena aunque la red tarde (o no haya)
  const cache = await leerCache();
  if (cache?.blob) { activa = true; ponerPista(cache.blob, cache.version); }

  // Escuchar cambios: si el admin sube otra o la quita, se aplica sola
  try {
    fb.onValue(fb.ref(fb.db, 'config/musica'), s => sincronizar(s.val()), e => console.warn('[musica]', e.message));
  } catch (e) { console.warn('[musica]', e.message); }
}

/** Estado para el panel del admin. */
export function estadoMusica() {
  return { hay: !!url, activa, silenciada };
}

/**
 * Sube un MP3 (solo admin). onProgreso(0..1).
 * Primero las partes en una carpeta de versión nueva, después el aviso
 * (config/musica) y al final se borra la versión anterior: nadie descarga
 * una canción a medias.
 */
export async function subirMusica(file, quien, onProgreso) {
  if (!file) throw new Error('Elige un archivo');
  if (!/^audio\//.test(file.type) && !/\.(mp3|m4a|aac|ogg|wav)$/i.test(file.name)) throw new Error('El archivo no es de audio');
  if (file.size > MAX_BYTES) throw new Error(`Pesa ${(file.size / 1048576).toFixed(1)} MB; el máximo es ${MAX_BYTES / 1048576} MB`);
  const anterior = (await fb.get(fb.ref(fb.db, 'config/musica'))).val();
  const b64 = aBase64(await file.arrayBuffer());
  const version = String(Date.now());
  const partes = [];
  for (let i = 0; i < b64.length; i += PARTE) partes.push(b64.slice(i, i + PARTE));
  for (let i = 0; i < partes.length; i++) {
    await fb.set(fb.ref(fb.db, `config/musicaDatos/${version}/${i}`), partes[i]);
    onProgreso && onProgreso((i + 1) / partes.length);
  }
  await fb.set(fb.ref(fb.db, 'config/musica'), {
    version, nombre: file.name.replace(/\.[^.]+$/, ''), tipo: file.type || 'audio/mpeg',
    bytes: file.size, partes: partes.length, activa: true,
    subidoPor: quien || '', subidoEn: Date.now(),
  });
  if (anterior?.version && anterior.version !== version) {
    try { await fb.set(fb.ref(fb.db, `config/musicaDatos/${anterior.version}`), null); } catch (_) {}
  }
}

/** Encender o apagar la música para todos (solo admin). */
export function activarMusica(si) {
  return fb.set(fb.ref(fb.db, 'config/musica/activa'), !!si);
}

/** Quitar la música (solo admin). */
export async function quitarMusica() {
  const m = (await fb.get(fb.ref(fb.db, 'config/musica'))).val();
  await fb.set(fb.ref(fb.db, 'config/musica'), null);
  if (m?.version) await fb.set(fb.ref(fb.db, `config/musicaDatos/${m.version}`), null);
}
