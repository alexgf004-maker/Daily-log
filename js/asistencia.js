// ── MÓDULO DE ASISTENCIA ───────────────────────────────
// Cálculo de tardanzas, salidas tempranas y ausencias por mes.
// Recibe `db` y las funciones de Firebase desde index.html.
// Depende de sedeEfectiva y chipEstado de marcaje.js (se pasan como argumentos
// donde hace falta) para no duplicar lógica.

// ── SÁBADOS LABORALES ──────────────────────────────────
// config/sabadosLaborales/{fecha}: { empleados: [uid, ...] }

export async function obtenerSabadosLaborales(db, fns, mes){
  const {ref,get}=fns;
  const snap=await get(ref(db,'config/sabadosLaborales'));
  if(!snap.exists()) return {};
  const todos=snap.val();
  if(!mes) return todos;
  // Filtrar solo los del mes pedido (YYYY-MM)
  const out={};
  Object.entries(todos).forEach(([fecha,v])=>{ if(fecha.startsWith(mes)) out[fecha]=v; });
  return out;
}

export async function guardarSabadoLaboral(db, fns, fecha, empleados){
  const {ref,set}=fns;
  await set(ref(db,`config/sabadosLaborales/${fecha}`), { empleados });
}

export async function quitarSabadoLaboral(db, fns, fecha){
  const {ref,set}=fns;
  await set(ref(db,`config/sabadosLaborales/${fecha}`), null);
}

// ¿Este empleado trabaja este sábado concreto?
export function empleadoTrabajaSabado(sabadosLaborales, fecha, uid){
  const s=sabadosLaborales[fecha];
  if(!s||!Array.isArray(s.empleados)) return false;
  return s.empleados.includes(uid);
}

// ── DÍAS HÁBILES DEL MES ───────────────────────────────
// Devuelve array de fechas 'YYYY-MM-DD' que son días laborales para un empleado:
// lunes a viernes SIEMPRE; sábados solo si está en la lista de ese sábado laboral.
// Nunca domingos. No incluye fechas futuras (más allá de hoy).
export function diasHabilesEmpleado(mes, uid, sabadosLaborales, hoy){
  const [y,m]=mes.split('-').map(Number);
  const ultimoDia=new Date(y,m,0).getDate();
  const dias=[];
  for(let d=1; d<=ultimoDia; d++){
    const fecha=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    if(fecha>hoy) break; // no contar días futuros
    const dow=new Date(fecha+'T12:00:00').getDay();
    if(dow===0) continue;              // domingo: nunca
    if(dow===6){                       // sábado: solo si está asignado
      if(empleadoTrabajaSabado(sabadosLaborales, fecha, uid)) dias.push(fecha);
      continue;
    }
    dias.push(fecha);                  // lun-vie: siempre
  }
  return dias;
}

// ── TIPO DE DÍA REGISTRADO (vacaciones/incapacidad/permiso) ──
// Recibe los registros del empleado indexados por fecha; devuelve true si ese día
// está justificado y por tanto NO cuenta como ausencia.
function diaJustificado(regsPorFecha, fecha){
  const r=regsPorFecha[fecha];
  if(!r) return false;
  const tipo=r.tipoDia||'normal';
  return tipo==='vacaciones'||tipo==='incapacidad'||tipo==='permiso';
}

// ── RESUMEN MENSUAL DE UN EMPLEADO ─────────────────────
// marcajesPorFecha: { 'YYYY-MM-DD': { entrada:{...}, salida:{...} } }
// regsPorFecha:     { 'YYYY-MM-DD': { tipoDia, ... } }
// Devuelve { diasTarde, minTarde, salidasTemp, minTemp, noMarco, detalle:[...] }
export function resumenMesEmpleado(mes, uid, marcajesPorFecha, regsPorFecha, sabadosLaborales, hoy){
  const dias=diasHabilesEmpleado(mes, uid, sabadosLaborales, hoy);
  let diasTarde=0, minTarde=0, salidasTemp=0, minTemp=0, noMarco=0;
  const detalle=[];

  for(const fecha of dias){
    const justificado=diaJustificado(regsPorFecha, fecha);
    const marc=marcajesPorFecha[fecha];
    const entrada=marc?.entrada, salida=marc?.salida;

    // Ausencia: día hábil, no justificado, sin ninguna marca
    if(!entrada && !salida){
      if(!justificado){
        noMarco++;
        detalle.push({ fecha, tipo:'no_marco', justificado:false });
      } else {
        detalle.push({ fecha, tipo:'justificado', tipoDia:(regsPorFecha[fecha]?.tipoDia) });
      }
      continue;
    }

    const item={ fecha, entrada:entrada||null, salida:salida||null };
    if(entrada?.estado==='tarde'){ diasTarde++; minTarde+=(entrada.minDiff||0); }
    if(salida?.estado==='salida_temprana'){ salidasTemp++; minTemp+=(salida.minDiff||0); }
    detalle.push(item);
  }

  return { uid, diasTarde, minTarde, salidasTemp, minTemp, noMarco, detalle };
}

// ── RESUMEN DE TODOS LOS EMPLEADOS ─────────────────────
// empleados: array de usuarios (ya filtrados por sede y por asignación de asistente)
// getMarcajesMes(uid) y getRegsMes(uid): funciones async que devuelven datos por fecha
export async function resumenMesTodos(mes, empleados, getMarcajesEmpleado, getRegsEmpleado, sabadosLaborales, hoy){
  const filas=await Promise.all(empleados.map(async u=>{
    const [marcajesPorFecha, regsPorFecha]=await Promise.all([
      getMarcajesEmpleado(u.id),
      getRegsEmpleado(u.id)
    ]);
    const r=resumenMesEmpleado(mes, u.id, marcajesPorFecha, regsPorFecha, sabadosLaborales, hoy);
    return { ...r, nombre:u.nombre };
  }));
  // Ordenar: primero los que más incidencias tienen
  filas.sort((a,b)=>(b.diasTarde+b.salidasTemp+b.noMarco)-(a.diasTarde+a.salidasTemp+a.noMarco) || a.nombre.localeCompare(b.nombre));
  return filas;
}

// ── ASISTENCIA DE HOY (para dashboard) ─────────────────
// Devuelve listas con nombres: tarde, salidaTemprana, noMarco
export function asistenciaHoy(empleados, marcajesHoy, hoy, sabadosLaborales){
  const dow=new Date(hoy+'T12:00:00').getDay();
  const esDomingo=dow===0;
  const esSabado=dow===6;
  const tarde=[], salidaTemprana=[], noMarco=[], aTiempo=[];

  for(const u of empleados){
    // ¿Hoy es día laboral para este empleado?
    let esLaboral;
    if(esDomingo) esLaboral=false;
    else if(esSabado) esLaboral=empleadoTrabajaSabado(sabadosLaborales, hoy, u.id);
    else esLaboral=true;
    if(!esLaboral) continue;

    const m=marcajesHoy[u.id];
    if(m?.entrada?.estado==='tarde') tarde.push({nombre:u.nombre, min:m.entrada.minDiff||0, hora:m.entrada.horaStr});
    else if(m?.entrada?.estado==='a_tiempo') aTiempo.push({nombre:u.nombre, hora:m.entrada.horaStr});
    if(m?.salida?.estado==='salida_temprana') salidaTemprana.push({nombre:u.nombre, min:m.salida.minDiff||0, hora:m.salida.horaStr});
    if(!m?.entrada) noMarco.push({nombre:u.nombre});
  }
  return { tarde, salidaTemprana, noMarco, aTiempo };
}
