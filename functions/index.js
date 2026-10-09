/**
 * functions/index.js
 * Servidor de Registro de Planilla (Cloud Functions de Firebase).
 *
 * Antes el login descargaba la lista de usuarios con sus PIN cifrados y los
 * revisaba en el teléfono, y la base no exigía haber iniciado sesión. Ahora:
 *   - login:          el servidor revisa usuario + PIN (con límite de intentos)
 *                     y entrega un token; la app entra con él a Firebase Auth.
 *   - cambiarPin:     el propio usuario cambia su PIN (revisa el actual).
 *   - guardarUsuario: el admin crea o edita usuarios (y su PIN).
 *   - migrarPines:    el admin pasa todos los PIN a la rama protegida.
 *
 * Los PIN viven en `pins/{uid}` = { hash, salt } (sha256(salt + pin)). Las
 * reglas de la base deben negar `pins`, `pins_viejos` y `seguridad_intentos` a la app.
 * Los PIN viejos estaban en `users/{uid}/pin` como sha256('INNOVA_SALT_2025_' + pin)
 * o en texto (muy antiguos); se migran al primer login correcto.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 5 });

const rtdb = () => admin.database();

const MAX_FALLOS_USUARIO = 5;
const MAX_FALLOS_IP = 20;
const VENTANA_MS = 15 * 60 * 1000;
const BLOQUEO_MS = 15 * 60 * 1000;
const ROLES = ['admin', 'asistente', 'empleado'];
const SAL_VIEJA = 'INNOVA_SALT_2025_';

const sha256 = t => crypto.createHash('sha256').update(String(t), 'utf8').digest('hex');
const nuevaSal = () => crypto.randomBytes(16).toString('hex');
const normUsuario = u => String(u || '').trim().toLowerCase();
const pinValido = p => /^\d{4,8}$/.test(String(p || ''));
const activo = u => u && (u.activo === true || u.activo === 'true');
// Claves de la base: sin . # $ [ ] / ni vacías
const claveSegura = t => sha256(t);

function iguales(a, b) {
  const x = Buffer.from(String(a || ''), 'utf8'), y = Buffer.from(String(b || ''), 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// ── Límite de intentos ────────────────────────────
async function revisarBloqueo(clave) {
  const v = (await rtdb().ref(`seguridad_intentos/${clave}`).once('value')).val();
  if (v && v.bloqueadoHasta && v.bloqueadoHasta > Date.now()) {
    const min = Math.ceil((v.bloqueadoHasta - Date.now()) / 60000);
    throw new HttpsError('resource-exhausted', `Demasiados intentos. Espera ${min} min e intenta de nuevo.`);
  }
}
async function anotarFallo(clave, maximo) {
  await rtdb().ref(`seguridad_intentos/${clave}`).transaction(v => {
    const ahora = Date.now();
    if (!v || !v.desde || ahora - v.desde > VENTANA_MS) v = { fallos: 0, desde: ahora };
    v.fallos = (v.fallos || 0) + 1;
    v.ultimo = ahora;
    if (v.fallos >= maximo) { v.bloqueadoHasta = ahora + BLOQUEO_MS; v.fallos = 0; v.desde = ahora; }
    return v;
  });
}
const limpiarFallos = clave => rtdb().ref(`seguridad_intentos/${clave}`).remove().catch(() => {});

// ── PIN guardado ──────────────────────────────────
// Devuelve una función que revisa un PIN, y si el PIN venía del formato viejo
async function pinGuardado(uid, usuario) {
  const p = (await rtdb().ref(`pins/${uid}`).once('value')).val();
  if (p && p.hash) return { revisar: pin => iguales(sha256((p.salt || '') + pin), p.hash), viejo: false };
  const viejo = (usuario && usuario.pin) || (await rtdb().ref(`pins_viejos/${uid}`).once('value')).val();
  if (!viejo) return null;
  const s = String(viejo);
  return { revisar: pin => s.length === 64 ? iguales(sha256(SAL_VIEJA + pin), s) : iguales(String(pin), s), viejo: true };
}
// Guarda el PIN en la rama protegida y lo borra de la ficha del usuario
async function guardarPin(uid, pin) {
  const salt = nuevaSal();
  await rtdb().ref().update({
    [`pins/${uid}`]: { hash: sha256(salt + pin), salt, actualizado: Date.now() },
    [`users/${uid}/pin`]: null,
    [`pins_viejos/${uid}`]: null,
  });
}

async function usuarioPorNombre(username) {
  const snap = await rtdb().ref('users').orderByChild('username').equalTo(username).once('value');
  let res = null;
  snap.forEach(c => { if (!res) res = { uid: c.key, ...c.val() }; });
  return res;
}

async function quienLlama(req) {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Inicia sesión de nuevo.');
  const u = (await rtdb().ref(`users/${req.auth.uid}`).once('value')).val();
  if (!activo(u)) throw new HttpsError('permission-denied', 'Usuario sin acceso.');
  return { uid: req.auth.uid, ...u };
}

// ── login ─────────────────────────────────────────
exports.login = onCall(async req => {
  // La app llama con { despertar: true } al abrir el login: así el servidor ya está
  // listo cuando la persona termina de escribir el PIN (no revisa nada ni cuenta intentos)
  if (req.data?.despertar === true) return { ok: true };
  const username = normUsuario(req.data?.username);
  const pin = String(req.data?.pin || '');
  if (!username || !pin) throw new HttpsError('invalid-argument', 'Escribe tu usuario y tu PIN.');

  const ip = String(req.rawRequest?.ip || req.rawRequest?.headers?.['x-forwarded-for'] || 'sin-ip').split(',')[0].trim();
  const claveU = 'u_' + claveSegura(username), claveIp = 'ip_' + claveSegura(ip);
  // Todo lo que no depende de otra cosa se lee al mismo tiempo
  const [, , u, mantSnap] = await Promise.all([
    revisarBloqueo(claveU),
    revisarBloqueo(claveIp),
    username.length <= 100 ? usuarioPorNombre(username) : null,
    rtdb().ref('config/mantenimiento').once('value'),
  ]);

  const incorrecto = async () => {
    await Promise.all([anotarFallo(claveU, MAX_FALLOS_USUARIO), anotarFallo(claveIp, MAX_FALLOS_IP)]);
    throw new HttpsError('permission-denied', 'Usuario o PIN incorrecto');
  };

  if (!u) return incorrecto();
  const guardado = await pinGuardado(u.uid, u);
  if (!guardado || !guardado.revisar(pin)) return incorrecto();

  if (!activo(u)) throw new HttpsError('permission-denied', 'Usuario inactivo. Pide a David que lo revise.');
  if (!ROLES.includes(u.role)) throw new HttpsError('permission-denied', 'Usuario sin rol asignado.');
  if (mantSnap.val() === true && u.role !== 'admin') throw new HttpsError('failed-precondition', 'App en mantenimiento. Por ahora solo puede entrar el administrador.');

  try {
    const [token] = await Promise.all([
      admin.auth().createCustomToken(u.uid, { role: u.role }),
      limpiarFallos(claveU),
      guardado.viejo ? guardarPin(u.uid, pin) : null,
    ]);
    return { token };
  } catch (e) {
    console.error('No se pudo crear el token de acceso:', e.code || '', e.message);
    throw new HttpsError('internal', 'No se pudo iniciar sesión, intenta de nuevo en un momento.');
  }
});

// ── cambiarPin (el propio usuario) ────────────────
exports.cambiarPin = onCall(async req => {
  const yo = await quienLlama(req);
  const actual = String(req.data?.actual || ''), nuevo = String(req.data?.nuevo || '');
  if (!pinValido(nuevo)) throw new HttpsError('invalid-argument', 'El PIN nuevo debe tener de 4 a 8 números.');
  if (nuevo === actual) throw new HttpsError('invalid-argument', 'El PIN nuevo debe ser diferente al actual.');
  const clave = 'c_' + claveSegura(yo.uid);
  await revisarBloqueo(clave);
  const guardado = await pinGuardado(yo.uid, yo);
  if (!guardado || !guardado.revisar(actual)) {
    await anotarFallo(clave, MAX_FALLOS_USUARIO);
    throw new HttpsError('permission-denied', 'El PIN actual es incorrecto.');
  }
  await limpiarFallos(clave);
  await guardarPin(yo.uid, nuevo);
  return { ok: true };
});

// ── guardarUsuario (solo admin): crear o editar, con PIN opcional al editar ──
exports.guardarUsuario = onCall(async req => {
  const yo = await quienLlama(req);
  if (yo.role !== 'admin') throw new HttpsError('permission-denied', 'Solo el admin gestiona usuarios.');
  const d = req.data || {};
  const uid = d.uid ? String(d.uid) : null;
  const username = normUsuario(d.username);
  const nombre = String(d.nombre || '').trim();
  const role = String(d.role || '');
  const pin = String(d.pin || '');
  if (!nombre || !username) throw new HttpsError('invalid-argument', 'Completa nombre y usuario.');
  if (username.length < 2 || username.length > 40 || /\s/.test(username)) throw new HttpsError('invalid-argument', 'El usuario debe tener de 2 a 40 letras, sin espacios.');
  if (!ROLES.includes(role)) throw new HttpsError('invalid-argument', 'Rol no válido.');
  if (!uid && !pinValido(pin)) throw new HttpsError('invalid-argument', 'El PIN debe tener de 4 a 8 números.');
  if (uid && pin && !pinValido(pin)) throw new HttpsError('invalid-argument', 'El PIN debe tener de 4 a 8 números.');
  const otro = await usuarioPorNombre(username);
  if (otro && otro.uid !== uid) throw new HttpsError('already-exists', 'Ese usuario ya existe.');

  const datos = {
    nombre, nombreCorto: String(d.nombreCorto || '').trim(), cargo: String(d.cargo || '').trim(),
    username, role,
    empleadosAsig: role === 'asistente' && Array.isArray(d.empleadosAsig) ? d.empleadosAsig.map(String) : [],
    sede: role === 'empleado' ? String(d.sede || '') : '',
  };
  let id = uid;
  if (uid) {
    const existe = (await rtdb().ref(`users/${uid}`).once('value')).exists();
    if (!existe) throw new HttpsError('not-found', 'No existe ese usuario.');
    await rtdb().ref(`users/${uid}`).update(datos);
  } else {
    const ref = rtdb().ref('users').push();
    id = ref.key;
    await ref.set({ ...datos, activo: true });
  }
  if (pin) await guardarPin(id, pin);
  return { uid: id };
});

// ── migrarPines (admin): saca todos los PIN de las fichas de usuario ──
exports.migrarPines = onCall(async req => {
  const yo = await quienLlama(req);
  if (yo.role !== 'admin') throw new HttpsError('permission-denied', 'Solo el admin.');
  const users = (await rtdb().ref('users').once('value')).val() || {};
  const pins = (await rtdb().ref('pins').once('value')).val() || {};
  const upd = {};
  let movidos = 0;
  for (const [uid, u] of Object.entries(users)) {
    if (!u || !u.pin) continue;
    // Solo se puede mover tal cual el formato viejo: se guarda marcado como "viejo"
    // y el login lo convierte al formato nuevo la primera vez que esa persona entra.
    if (!pins[uid]) upd[`pins_viejos/${uid}`] = String(u.pin);
    upd[`users/${uid}/pin`] = null;
    movidos++;
  }
  if (movidos) await rtdb().ref().update(upd);
  return { movidos };
});
