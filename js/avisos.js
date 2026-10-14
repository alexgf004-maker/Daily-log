// ── AVISOS AL CELULAR (notificaciones) ──────────────────
// Cada persona activa los avisos en su teléfono (permiso del navegador). Firebase da un
// token de ese teléfono y se guarda en avisos_tokens/{uid}/{id}; el servidor
// (functions/avisos.js) manda los avisos y sw.js los muestra.
// iPhone: solo con la app agregada a la pantalla de inicio (iOS 16.4 o más nuevo).
//
// index.html llama configurarAvisos({app, db, ref, set, llamar, fb}) con fb = funciones de
// firebase-messaging ({getMessaging, getToken, deleteToken, isSupported}).

const LS_ID = 'innova_avisos_id';       // id de este teléfono dentro de avisos_tokens/{uid}
const LS_TOK = 'innova_avisos_token';   // último token guardado
const LS_UID = 'innova_avisos_uid';     // de quién es el token guardado
let C = null;

export function configurarAvisos(ctx) { C = ctx; }

const ls = {
  get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} },
  del: k => { try { localStorage.removeItem(k); } catch (_) {} },
};
export const esIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const appInstalada = () => !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;

// 'activo' | 'apagado' | 'bloqueado' (negó el permiso) | 'ios-instalar' | 'no-soportado'
export async function estadoAvisos() {
  const soporta = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
    && await C.fb.isSupported().catch(() => false);
  if (!soporta) return esIOS() && !appInstalada() ? 'ios-instalar' : 'no-soportado';
  if (Notification.permission === 'denied') return 'bloqueado';
  if (Notification.permission === 'granted' && ls.get(LS_TOK)) return 'activo';
  return 'apagado';
}

async function tokenDeEsteTelefono() {
  const reg = await navigator.serviceWorker.register('sw.js', { scope: './' });
  await navigator.serviceWorker.ready;
  return C.fb.getToken(C.fb.getMessaging(C.app), { serviceWorkerRegistration: reg });
}

async function guardarToken(uid, token) {
  let id = ls.get(LS_ID);
  if (!id) { id = 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); ls.set(LS_ID, id); }
  await C.set(C.ref(C.db, `avisos_tokens/${uid}/${id}`), {
    token, actualizado: Date.now(), equipo: (navigator.userAgent || '').slice(0, 140),
  });
  ls.set(LS_TOK, token); ls.set(LS_UID, uid);
}

// Botón "Activar": pide el permiso (tiene que ser al tocar un botón) y guarda el token
export async function activarAvisos(uid) {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return estadoAvisos();
  const token = await tokenDeEsteTelefono();
  if (!token) throw new Error('No se pudo activar en este teléfono.');
  await guardarToken(uid, token);
  return 'activo';
}

// Al entrar (o abrir la app con sesión): si ya dio permiso, se renueva el token en silencio
export async function refrescarAvisos(uid) {
  try {
    if ((await estadoAvisos()) === 'no-soportado' || !('Notification' in window) || Notification.permission !== 'granted') return;
    const token = await tokenDeEsteTelefono();
    if (token && (token !== ls.get(LS_TOK) || ls.get(LS_UID) !== uid)) await guardarToken(uid, token);
  } catch (e) { console.warn('[avisos]', e.message); }
}

// Al cerrar sesión: este teléfono deja de recibir los avisos de esa persona
export async function quitarAvisosDeEsteTelefono(uid) {
  const id = ls.get(LS_ID);
  if (!uid || !id || ls.get(LS_UID) !== uid) return;
  try { await C.set(C.ref(C.db, `avisos_tokens/${uid}/${id}`), null); } catch (_) {}
  ls.del(LS_TOK); ls.del(LS_UID);
}

// Botón "Apagar"
export async function apagarAvisos(uid) {
  await quitarAvisosDeEsteTelefono(uid);
  try { await C.fb.deleteToken(C.fb.getMessaging(C.app)); } catch (_) {}
  return estadoAvisos();
}

// Botón "Probar": el servidor manda un aviso de prueba a mis teléfonos
export async function probarAviso() {
  return C.llamar('probarAviso');
}
