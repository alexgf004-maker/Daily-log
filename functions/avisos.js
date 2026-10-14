/**
 * functions/avisos.js
 * Notificaciones al celular (Firebase Cloud Messaging) de Registro de Planilla.
 *
 * Cada teléfono que activa los avisos guarda su token en `avisos_tokens/{uid}/{id}`
 * = { token, creado, actualizado, equipo }. El servidor manda a todos los teléfonos
 * de esa persona y borra los tokens que ya no sirven.
 *
 * Se mandan mensajes "solo datos" ({ titulo, cuerpo, url, tag }) y el service worker de
 * la app (sw.js) los muestra: así se ven igual en Android y en iPhone.
 *
 * En el emulador no se manda nada: el aviso se anota en `avisos_prueba/{uid}` para las pruebas.
 */

const admin = require('firebase-admin');

const rtdb = () => admin.database();
const ZONA = 'America/El_Salvador';
const MINUTOS_DESPUES_SALIDA = 15;
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const ERRORES_TOKEN_MUERTO = ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token', 'messaging/invalid-argument'];

const enEmulador = () => process.env.FUNCTIONS_EMULATOR === 'true' || process.env.AVISOS_PRUEBA === '1';

// ── Fechas en hora de El Salvador ─────────────────
function ahoraSV(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(d).map(x => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, minutos: Number(p.hour) * 60 + Number(p.minute) };
}
const fechaCorta = f => { const d = new Date(f + 'T12:00:00'); return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`; };
const sumarDias = (f, n) => { const d = new Date(f + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
function fmtMin(m) {
  m = Math.max(0, Math.round(m || 0));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} h ${r} min` : `${h} h`;
}
// Igual que horarioOficial() de js/marcaje.js
function horarioOficial(fecha) {
  const dow = new Date(fecha + 'T12:00:00').getDay();
  if (dow === 0) return null;
  if (dow === 6) return { entrada: '06:00', salida: '14:00' };
  return dow === 5 ? { entrada: '07:00', salida: '16:00' } : { entrada: '07:00', salida: '17:00' };
}
const aMin = h => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const hora12 = h => { let [a, b] = h.split(':').map(Number); const ap = a >= 12 ? 'p.m.' : 'a.m.'; a = a % 12 || 12; return `${a}:${String(b).padStart(2, '0')} ${ap}`; };
const activo = u => u && (u.activo === true || u.activo === 'true');

// ── Enviar a una persona ──────────────────────────
// Devuelve cuántos teléfonos lo recibieron (0 = no tiene los avisos activados)
async function enviarA(uid, { titulo, cuerpo, url = './', tag = 'innova' }) {
  const toks = (await rtdb().ref(`avisos_tokens/${uid}`).once('value')).val() || {};
  const lista = Object.entries(toks).filter(([, v]) => v && v.token);
  if (!lista.length) return 0;
  const data = { titulo: String(titulo), cuerpo: String(cuerpo), url: String(url), tag: String(tag) };
  if (enEmulador()) {
    await rtdb().ref(`avisos_prueba/${uid}`).push({ ...data, telefonos: lista.length, en: Date.now() });
    return lista.length;
  }
  const r = await admin.messaging().sendEachForMulticast({
    tokens: lista.map(([, v]) => v.token),
    data,
    webpush: { headers: { Urgency: 'high', TTL: String(24 * 3600) } },
  });
  const borrar = {};
  r.responses.forEach((x, i) => {
    if (!x.success && ERRORES_TOKEN_MUERTO.includes(x.error?.code)) borrar[`avisos_tokens/${uid}/${lista[i][0]}`] = null;
  });
  if (Object.keys(borrar).length) await rtdb().ref().update(borrar).catch(() => {});
  return r.successCount;
}

// ── 1) Recordatorio de marcar salida ──────────────
// Se corre cada 15 min por la tarde. A quien marcó entrada hoy y no salida, le avisa
// una sola vez, 15 min después de la hora oficial de salida.
async function revisarSalidas(cuando = new Date()) {
  const { fecha, minutos } = ahoraSV(cuando);
  const h = horarioOficial(fecha);
  if (!h || minutos < aMin(h.salida) + MINUTOS_DESPUES_SALIDA) return { fecha, avisados: 0, revisados: 0 };
  const [users, ya] = await Promise.all([
    rtdb().ref('users').once('value').then(s => s.val() || {}),
    rtdb().ref(`avisos_enviados/${fecha}`).once('value').then(s => s.val() || {}),
  ]);
  const empleados = Object.entries(users).filter(([, u]) => activo(u) && u.role === 'empleado');
  let avisados = 0, revisados = 0;
  await Promise.all(empleados.map(async ([uid]) => {
    if (ya[uid]?.salida) return;
    const m = (await rtdb().ref(`marcajes/${uid}/${fecha}`).once('value')).val();
    if (!m || !m.entrada || m.salida) return;
    revisados++;
    const n = await enviarA(uid, {
      titulo: '¿Ya saliste? Marca tu salida',
      cuerpo: `Tu salida de hoy era a las ${hora12(h.salida)}; cuando termines, márcala en la app.`,
      tag: 'salida-' + fecha,
    });
    await rtdb().ref(`avisos_enviados/${fecha}/${uid}/salida`).set(Date.now());
    if (n) avisados++;
  }));
  // Limpieza: solo se guardan los avisos de los últimos días
  const viejos = Object.keys((await rtdb().ref('avisos_enviados').orderByKey().endAt(sumarDias(fecha, -7)).once('value')).val() || {});
  if (viejos.length) await rtdb().ref().update(Object.fromEntries(viejos.map(k => [`avisos_enviados/${k}`, null])));
  return { fecha, avisados, revisados };
}

// ── 2) Aprobaciones y rechazos ────────────────────
// Recibe el registro antes y después del cambio; devuelve los avisos que tocan
// (mismos textos que la campanita de novedades de la app)
const NV_ESP = {
  vacaciones: ['Vacaciones aprobadas', 'Vacaciones rechazadas'], incapacidad: ['Incapacidad aprobada', 'Incapacidad rechazada'],
  permiso: ['Permiso aprobado', 'Permiso rechazado'], bienestar: ['Día de bienestar aprobado', 'Día de bienestar rechazado'],
  injustificado: ['Permiso injustificado revisado', 'Permiso injustificado rechazado'],
};
function avisosDeRevision(antes, r) {
  antes = antes || {};
  if (!r || !r.fecha) return [];
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  const f = cap(fechaCorta(r.fecha));
  const conMotivo = (t, m) => (m ? `${t}. Motivo: ${m}` : t);
  const out = [];
  if (r.he && r.revisadoHEEn && r.revisadoHEEn !== antes.revisadoHEEn && (r.estadoHE === 'aprobado' || r.estadoHE === 'rechazado')) {
    if (r.estadoHE === 'rechazado') out.push({ titulo: 'Horas extra rechazadas', cuerpo: conMotivo(`${f} · ${fmtMin(r.minHE)}`, r.motivoRechazoHE), tag: 'he-' + r.fecha });
    else if (r.heAjustada) out.push({ titulo: 'Horas extra ajustadas', cuerpo: conMotivo(`${f} · aprobadas ${fmtMin(r.minHEAprobado)} de ${fmtMin(r.minHE)}`, r.notaAjusteHE), tag: 'he-' + r.fecha });
    else out.push({ titulo: 'Horas extra aprobadas', cuerpo: `${f} · ${fmtMin(r.minHEAprobado !== undefined ? r.minHEAprobado : r.minHE)}`, tag: 'he-' + r.fecha });
  }
  if (r.viatico && r.revisadoViaticEn && r.revisadoViaticEn !== antes.revisadoViaticEn && r.estadoViatico === 'rechazado') {
    out.push({ titulo: 'Viático anulado', cuerpo: conMotivo(f, r.motivoRechazoViatico), tag: 'via-' + r.fecha });
  }
  if (r.tipoDia && r.tipoDia !== 'normal' && r.revisadoEspEn && r.revisadoEspEn !== antes.revisadoEspEn && (r.estadoEspecial === 'aprobado' || r.estadoEspecial === 'rechazado')) {
    const ok = r.estadoEspecial === 'aprobado';
    const rango = (r.tipoDia === 'vacaciones' && r.vacIni && r.vacFin) ? `${cap(fechaCorta(r.vacIni))} al ${fechaCorta(r.vacFin)}` : f;
    const rem = (r.tipoDia === 'permiso' && ok) ? (r.remunerado === false ? ' · no remunerado' : ' · remunerado') : '';
    const t = (NV_ESP[r.tipoDia] || ['Solicitud aprobada', 'Solicitud rechazada'])[ok ? 0 : 1];
    out.push({ titulo: t, cuerpo: ok ? rango + rem : conMotivo(rango, r.motivoRechazoEspecial), tag: 'esp-' + r.fecha });
  }
  return out;
}

// ── 3) Programación del día ───────────────────────
// Un aviso por persona asignada: campaña, zona, compañeros y vehículo
async function avisarProgramacion(fecha) {
  const [prog, vehiculos, users] = await Promise.all([
    rtdb().ref(`programaciones/${fecha}`).once('value').then(s => s.val()),
    rtdb().ref('config/vehiculos').once('value').then(s => s.val() || {}),
    rtdb().ref('users').once('value').then(s => s.val() || {}),
  ]);
  const grupos = (prog && prog.grupos) || [];
  const hoy = ahoraSV().fecha;
  const cuando = fecha === hoy ? 'de hoy' : fecha === sumarDias(hoy, 1) ? 'de mañana' : 'del ' + fechaCorta(fecha);
  const nombre = (uid, i, g) => {
    const u = users[uid];
    return (u && (u.nombreCorto || u.nombre)) || (g.empleadosNombres || [])[i] || '';
  };
  let personas = 0, conAvisos = 0;
  const sinAvisos = [];
  await Promise.all(grupos.flatMap(g => (g.empleados || []).map(async (uid, i) => {
    personas++;
    const companeros = (g.empleados || []).map((o, j) => (o === uid ? null : nombre(o, j, g))).filter(Boolean);
    const v = g.vehiculo ? vehiculos[g.vehiculo] : null;
    const placa = v ? v.nombre : (g.vehiculoNombre || '');
    const partes = [g.campania || 'Asignación'];
    if (g.zona) partes.push(g.zona);
    partes.push(companeros.length ? 'con ' + companeros.join(', ') : 'sin compañero');
    if (placa) partes.push('vehículo ' + placa);
    const n = await enviarA(uid, {
      titulo: `Tu programación ${cuando}`,
      cuerpo: partes.join(' · '),
      tag: 'prog-' + fecha,
    });
    if (n) conAvisos++; else sinAvisos.push(nombre(uid, i, g));
  })));
  return { personas, conAvisos, sinAvisos };
}

module.exports = { enviarA, revisarSalidas, avisosDeRevision, avisarProgramacion, ahoraSV, horarioOficial, fechaCorta, fmtMin };
