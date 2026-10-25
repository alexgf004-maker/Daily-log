/**
 * functions/avisos.js
 * Notificaciones al celular (Firebase Cloud Messaging) de Registro de Planilla.
 *
 * Cada teléfono que activa los avisos guarda su token en `avisos_tokens/{uid}/{id}`
 * = { token, creado, actualizado, equipo }. El servidor manda a todos los teléfonos
 * de esa persona y borra los tokens que ya no sirven.
 *
 * Se mandan mensajes "solo datos" ({ titulo, cuerpo, url, tag } y opcionales fijo, vibrar,
 * imagen, boton) y el service worker de la app (sw.js) los muestra: así se ven igual en
 * Android y en iPhone (en iPhone no hay vibración propia, imagen ni botones).
 *
 * En el emulador no se manda nada: el aviso se anota en `avisos_prueba/{uid}` para las pruebas.
 */

const admin = require('firebase-admin');

const rtdb = () => admin.database();
const ZONA = 'America/El_Salvador';
const MIN_AVISO_SALIDA = 5; // se avisa 5 min antes y 5 min después de la hora oficial (entrada y salida)
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
// Opcionales (ver sw.js): fijo = se queda en pantalla hasta que lo toquen · vibrar = 'normal' | 'fuerte'
// · imagen = imagen grande al desplegarlo · boton = texto de un botón que abre la app en `url`
async function enviarA(uid, { titulo, cuerpo, url = './', tag = 'innova', fijo, vibrar, imagen, boton }) {
  const toks = (await rtdb().ref(`avisos_tokens/${uid}`).once('value')).val() || {};
  const lista = Object.entries(toks).filter(([, v]) => v && v.token);
  if (!lista.length) return 0;
  const data = { titulo: String(titulo), cuerpo: String(cuerpo), url: String(url), tag: String(tag), vibrar: vibrar || 'normal' };
  if (fijo) data.fijo = '1';
  if (imagen) data.imagen = String(imagen);
  if (boton) data.boton = String(boton);
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

// ── 1) Recordatorios de marcar entrada y salida ───
// Se corre cada 5 min temprano y por la tarde (lun–sáb). Para cada marca hay dos avisos:
// 5 min antes de la hora oficial y, si sigue sin marcar, 5 min después. Cada uno una sola
// vez al día (avisos_enviados/{fecha}/{uid}/{entrada_antes|entrada_despues|salida_antes|salida_despues}).
//   Entrada: a quien trabaja ese día y no ha marcado (ver debeMarcarEntrada).
//   (Empleados, y la admin si tiene "Sede para marcar" en su perfil.)
//   Salida:  a quien marcó entrada y no salida.
const AUS_TIPOS = ['vacaciones', 'incapacidad', 'permiso', 'bienestar', 'injustificado'];
const SEDES = ['plantel', 'gestionmedida', 'cucumacayan', 'zacatecoluca', 'prueba']; // js/marcaje.js
const VENTANA = { entrada: 60, salida: 4 * 60 }; // hasta cuántos min después de la hora se manda el 2.º aviso

// Asuetos fijos (igual que asuetosFijos() de js/utils.js) + los que agregó el admin
function semanaSanta(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  const pascua = `${y}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  return [-3, -2, -1].map(n => sumarDias(pascua, n));
}
async function esAsueto(fecha) {
  const y = Number(fecha.slice(0, 4));
  const fijos = [...semanaSanta(y), ...['01-01', '05-01', '05-10', '06-17', '08-03', '08-06', '09-15', '11-02', '12-25'].map(md => `${y}-${md}`)];
  if (fijos.includes(fecha)) return true;
  const custom = (await rtdb().ref('asuetos').once('value')).val() || {};
  return Object.values(custom).some(a => a && a.fecha === fecha);
}
const tieneSede = (u, fecha) => (u.sedeTemporal && u.sedeTemporal.hasta >= fecha && SEDES.includes(u.sedeTemporal.sede)) || SEDES.includes(u.sede);

// ¿Le toca marcar entrada hoy? (los días y ausencias se cuentan igual que en Asistencia)
async function debeMarcarEntrada(uid, u, fecha, sabados) {
  if (!tieneSede(u, fecha)) return false;
  if (new Date(fecha + 'T12:00:00').getDay() === 6 && !((sabados[fecha] || {}).empleados || []).includes(uid)) return false;
  const regs = rtdb().ref(`registros/${uid}`);
  const [delDia, vacas, susp] = await Promise.all([
    regs.orderByChild('fecha').equalTo(fecha).once('value').then(s => Object.values(s.val() || {})),
    regs.orderByChild('tipoDia').equalTo('vacaciones').once('value').then(s => Object.values(s.val() || {})),
    rtdb().ref(`suspensiones/${uid}`).once('value').then(s => Object.values(s.val() || {})),
  ]);
  if (delDia.some(r => AUS_TIPOS.includes(r.tipoDia) && r.estadoEspecial !== 'rechazado')) return false;
  if (vacas.some(r => r.estadoEspecial !== 'rechazado' && r.vacIni && r.vacFin && fecha >= r.vacIni && fecha <= r.vacFin)) return false;
  if (susp.some(x => x && x.fecha === fecha)) return false;
  return true;
}

const TEXTOS = {
  entrada_antes: h => ({ titulo: 'En 5 minutos es tu entrada', cuerpo: `Tu entrada es a las ${hora12(h)}; no olvides marcarla en la app al llegar.` }),
  entrada_despues: h => ({ titulo: '¿Ya llegaste? Marca tu entrada', cuerpo: `Tu entrada era a las ${hora12(h)} y todavía no la has marcado.` }),
  salida_antes: h => ({ titulo: 'En 5 minutos es tu salida', cuerpo: `Tu salida es a las ${hora12(h)}; no olvides marcarla en la app al salir.` }),
  salida_despues: h => ({ titulo: '¿Ya saliste? Marca tu salida', cuerpo: `Tu salida era a las ${hora12(h)} y todavía no la has marcado.` }),
};

async function revisarMarcajes(cuando = new Date()) {
  const { fecha, minutos } = ahoraSV(cuando);
  const h = horarioOficial(fecha);
  let tipo = null, cual = null;
  if (h) for (const t of ['entrada', 'salida']) {
    const m = aMin(h[t]);
    if (minutos >= m + MIN_AVISO_SALIDA && minutos < m + VENTANA[t]) { tipo = t; cual = 'despues'; }
    else if (minutos >= m - MIN_AVISO_SALIDA && minutos < m + MIN_AVISO_SALIDA) { tipo = t; cual = 'antes'; }
  }
  if (!tipo) return { fecha, aviso: null, avisados: 0, revisados: 0 };
  const clave = `${tipo}_${cual}`;
  if (tipo === 'entrada' && await esAsueto(fecha)) return { fecha, aviso: clave, asueto: true, avisados: 0, revisados: 0 };
  const [users, ya, sabados] = await Promise.all([
    rtdb().ref('users').once('value').then(s => s.val() || {}),
    rtdb().ref(`avisos_enviados/${fecha}`).once('value').then(s => s.val() || {}),
    tipo === 'entrada' ? rtdb().ref('config/sabadosLaborales').once('value').then(s => s.val() || {}) : {},
  ]);
  // Empleados y también la admin si tiene sede para marcar (la asistente no marca)
  const empleados = Object.entries(users).filter(([, u]) => activo(u) && (u.role === 'empleado' || (u.role === 'admin' && tieneSede(u, fecha))));
  let avisados = 0, revisados = 0;
  await Promise.all(empleados.map(async ([uid, u]) => {
    if (ya[uid]?.[clave]) return;
    const m = (await rtdb().ref(`marcajes/${uid}/${fecha}`).once('value')).val() || {};
    if (tipo === 'entrada' ? (m.entrada || !(await debeMarcarEntrada(uid, u, fecha, sabados))) : (!m.entrada || m.salida)) return;
    revisados++;
    // Más notorios: se quedan en pantalla, imagen grande, botón para marcar y, el segundo, vibración fuerte
    const n = await enviarA(uid, {
      ...TEXTOS[clave](h[tipo]), tag: `${tipo}-${fecha}`, url: './?marcar=1',
      fijo: true, vibrar: cual === 'despues' ? 'fuerte' : 'normal', imagen: `aviso-${tipo}.jpg`, boton: 'Abrir para marcar',
    });
    await rtdb().ref(`avisos_enviados/${fecha}/${uid}/${clave}`).set(Date.now());
    if (n) avisados++;
  }));
  // Limpieza: solo se guardan los avisos de los últimos días
  const viejos = Object.keys((await rtdb().ref('avisos_enviados').orderByKey().endAt(sumarDias(fecha, -7)).once('value')).val() || {});
  if (viejos.length) await rtdb().ref().update(Object.fromEntries(viejos.map(k => [`avisos_enviados/${k}`, null])));
  return { fecha, aviso: clave, avisados, revisados };
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

// ── 4) Cierre de mes ──────────────────────────────
// El mes se cierra solo el día 1 (mesCerrado de js/utils.js): lo que quede sin revisar ya no
// entra en la planilla exportada. 3 días antes del último día y el último día, a las 08:00,
// se avisa a la admin cuántas horas extra y solicitudes faltan (mismo criterio que loadPend).
const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_ANTES_CIERRE = 3;

// ¿Hoy (YYYY-MM-DD) toca avisar? { toca, ultimo: último día del mes, faltan: días hasta el último }
function tocaAvisoCierre(fecha) {
  const [y, m, d] = fecha.split('-').map(Number);
  const dias = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const ultimo = `${fecha.slice(0, 7)}-${String(dias).padStart(2, '0')}`;
  const faltan = dias - d;
  return { toca: faltan === 0 || faltan === DIAS_ANTES_CIERRE, ultimo, faltan };
}

// registros = { uid: { key: registro } }. Solo hasta el último día del mes (no solicitudes de meses
// futuros); los de meses anteriores que sigan pendientes sí cuentan.
function contarPendientesCierre(registros, ultimo) {
  let he = 0, sol = 0;
  for (const regs of Object.values(registros || {})) {
    if (!regs || typeof regs !== 'object') continue;
    for (const r of Object.values(regs)) {
      if (!r || typeof r !== 'object' || !r.fecha || r.fecha > ultimo) continue;
      if (r.he && r.estadoHE === 'pendiente') he++;
      if (r.tipoDia && r.tipoDia !== 'normal' && r.tipoDia !== 'asueto' && r.estadoEspecial === 'pendiente') sol++;
    }
  }
  return { he, sol };
}

function textoAvisoCierre(he, sol, ultimo, faltan) {
  const partes = [];
  if (he) partes.push(`${he} ${he === 1 ? 'día con horas extra' : 'días con horas extra'}`);
  if (sol) partes.push(`${sol} ${sol === 1 ? 'solicitud' : 'solicitudes'}`);
  const d = new Date(ultimo + 'T12:00:00');
  const mes = MESES_LARGOS[d.getMonth()];
  // El cierre es al empezar el día 1: el último día "se cierra mañana"; antes, se nombra el último día
  const cuando = faltan === 0 ? 'mañana' : `el ${DIAS_LARGOS[d.getDay()]} ${d.getDate()}`;
  return {
    titulo: 'Cierre de mes: quedan pendientes',
    cuerpo: `${he + sol === 1 ? 'Falta' : 'Faltan'} revisar ${partes.join(' y ')}. ${mes.charAt(0).toUpperCase() + mes.slice(1)} se cierra ${cuando}.`,
  };
}

// fecha = hoy en El Salvador. forzar = mandar aunque hoy no toque; soloA = solo a ese admin (botón de prueba).
async function avisarCierreMes(fecha, { forzar = false, soloA = null } = {}) {
  const c = tocaAvisoCierre(fecha);
  if (!c.toca && !forzar) return { toca: false };
  const [registros, users] = await Promise.all([
    rtdb().ref('registros').once('value').then(s => s.val() || {}),
    rtdb().ref('users').once('value').then(s => s.val() || {}),
  ]);
  const { he, sol } = contarPendientesCierre(registros, c.ultimo);
  if (!he && !sol) return { toca: c.toca, he, sol, enviado: false };
  const aviso = {
    ...textoAvisoCierre(he, sol, c.ultimo, c.faltan),
    url: './?pend=1', tag: 'cierre-' + fecha.slice(0, 7), fijo: true, boton: 'Ver pendientes',
  };
  const admins = Object.entries(users).filter(([uid, u]) => u && u.role === 'admin' && (u.activo === true || u.activo === 'true') && (!soloA || uid === soloA));
  let telefonos = 0;
  for (const [uid] of admins) telefonos += await enviarA(uid, aviso);
  return { toca: c.toca, he, sol, enviado: true, admins: admins.length, telefonos };
}

module.exports = { enviarA, revisarMarcajes, avisosDeRevision, avisarProgramacion, tocaAvisoCierre, contarPendientesCierre, textoAvisoCierre, avisarCierreMes, ahoraSV, horarioOficial, fechaCorta, fmtMin };
