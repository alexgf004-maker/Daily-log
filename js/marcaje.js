// ── MÓDULO DE MARCAJE GPS ──────────────────────────────
// Control de entrada/salida por geolocalización.
// Este módulo recibe `db` y las funciones de Firebase (ref, get, set, update)
// desde index.html — no inicializa su propia conexión a Firebase.

export const SEDES = {
  plantel:      { nombre:'Plantel Central',            lat:13.688409755143281, lng:-89.27993065477382, radio:100 },
  cucumacayan:  { nombre:'Subestación Cucumacayán',    lat:13.693570433295193, lng:-89.20564341328895, radio:100 },
  zacatecoluca: { nombre:'Subestación Zacatecoluca',   lat:13.508016211954466, lng:-88.86875891706555, radio:100 },
  prueba:       { nombre:'Prueba — no usar',           lat:13.828394851402207, lng:-89.26711982035171, radio:100 },
};

// ── Distancia entre dos puntos GPS (fórmula de Haversine) ──
export function haversineMetros(lat1,lng1,lat2,lng2){
  const R=6371000;
  const toRad=d=>d*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLng=toRad(lng2-lng1);
  const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// ── Determina la sede efectiva de un usuario (fija o temporal vigente) ──
export function sedeEfectiva(user, hoy){
  if(!user) return null;
  if(user.sedeTemporal && user.sedeTemporal.hasta && user.sedeTemporal.hasta>=hoy && user.sedeTemporal.sede && SEDES[user.sedeTemporal.sede]){
    return { key:user.sedeTemporal.sede, ...SEDES[user.sedeTemporal.sede], temporal:true, hasta:user.sedeTemporal.hasta };
  }
  if(user.sede && SEDES[user.sede]) return { key:user.sede, ...SEDES[user.sede], temporal:false };
  return null;
}

// ── Horario oficial de entrada/salida por día ──
function horarioOficial(fecha){
  const d=new Date(fecha+'T12:00:00');
  const dow=d.getDay();
  if(dow===0||dow===6) return null; // fin de semana: sin horario oficial de marcaje
  return dow===5 ? {entrada:'07:00',salida:'16:00'} : {entrada:'07:00',salida:'17:00'};
}

const TOLERANCIA_MIN = 5;

function horaAminutos(horaStr){
  const [h,m]=horaStr.split(':').map(Number);
  return h*60+m;
}

function calcularEstado(tipo, horaStr, fecha){
  const horario=horarioOficial(fecha);
  if(!horario) return 'normal';
  const min=horaAminutos(horaStr);
  if(tipo==='entrada'){
    const limite=horaAminutos(horario.entrada)+TOLERANCIA_MIN;
    return min<=limite ? 'a_tiempo' : 'tarde';
  } else {
    const limite=horaAminutos(horario.salida);
    return min>=limite ? 'a_tiempo' : 'salida_temprana';
  }
}

// ── Obtener ubicación GPS actual como Promesa ──
function obtenerUbicacion(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation){ reject(new Error('SIN_GPS')); return; }
    navigator.geolocation.getCurrentPosition(
      pos=>resolve(pos),
      err=>{
        if(err.code===1) reject(new Error('PERMISO_DENEGADO'));
        else if(err.code===3) reject(new Error('GPS_TIMEOUT'));
        else reject(new Error('GPS_ERROR'));
      },
      { enableHighAccuracy:true, timeout:12000, maximumAge:0 }
    );
  });
}

// ── Marcar entrada o salida ──
// tipo: 'entrada' | 'salida'
// Lanza errores con código: SIN_SEDE, SIN_GPS, PERMISO_DENEGADO, GPS_TIMEOUT, GPS_ERROR, FUERA_DE_RANGO, YA_MARCADO
export async function marcarAsistencia(db, fns, user, tipo, hoy){
  const {ref,get,set,update}=fns;
  const sede=sedeEfectiva(user, hoy);
  if(!sede){ const e=new Error('Sin sede asignada'); e.code='SIN_SEDE'; throw e; }

  let pos;
  try{ pos=await obtenerUbicacion(); }
  catch(err){ const e=new Error('No se pudo obtener tu ubicación'); e.code=err.message; throw e; }

  const dist=haversineMetros(pos.coords.latitude,pos.coords.longitude,sede.lat,sede.lng);
  if(dist>sede.radio){ const e=new Error(`Estás a ${Math.round(dist)}m de ${sede.nombre} — debes estar a menos de ${sede.radio}m`); e.code='FUERA_DE_RANGO'; e.distancia=Math.round(dist); throw e; }

  const path=`marcajes/${user.id}/${hoy}`;
  const snap=await get(ref(db,path));
  const existente=snap.exists()?snap.val():{};
  if(existente[tipo]){ const e=new Error('Ya marcaste tu '+tipo+' hoy'); e.code='YA_MARCADO'; throw e; }

  // Escribir con marca de tiempo del servidor — el celular no puede alterar esto
  await set(ref(db,`${path}/${tipo}`),{
    ts:{ '.sv':'timestamp' },
    lat:pos.coords.latitude,
    lng:pos.coords.longitude,
    precision:Math.round(pos.coords.accuracy||0),
    sedeUsada:sede.key
  });

  // Releer para obtener la hora real que asignó el servidor
  const releido=await get(ref(db,`${path}/${tipo}`));
  const datos=releido.val();
  const horaReal=new Date(datos.ts);
  const horaStr=`${String(horaReal.getHours()).padStart(2,'0')}:${String(horaReal.getMinutes()).padStart(2,'0')}`;
  const estado=calcularEstado(tipo,horaStr,hoy);

  await update(ref(db,`${path}/${tipo}`),{ estado, horaStr });

  return { estado, horaStr, sede:sede.nombre, tipo };
}

// ── Obtener el marcaje del día actual para un usuario ──
export async function obtenerMarcajeDia(db, fns, uid, fecha){
  const {ref,get}=fns;
  const snap=await get(ref(db,`marcajes/${uid}/${fecha}`));
  return snap.exists()?snap.val():null;
}

// ── Obtener todos los marcajes de un usuario en un mes (YYYY-MM) ──
export async function obtenerMarcajesMes(db, fns, uid, mes){
  const {ref,get}=fns;
  const snap=await get(ref(db,`marcajes/${uid}`));
  if(!snap.exists()) return [];
  return Object.entries(snap.val())
    .filter(([fecha])=>fecha.startsWith(mes))
    .map(([fecha,v])=>({fecha,...v}))
    .sort((a,b)=>b.fecha.localeCompare(a.fecha));
}

// ── Etiquetas visuales para estados ──
export const ESTADO_LABELS={
  a_tiempo:{texto:'A tiempo',color:'ba'},
  tarde:{texto:'Tarde',color:'br'},
  salida_temprana:{texto:'Salida temprana',color:'br'},
  normal:{texto:'—',color:'bn'}
};

export const NOMBRE_SEDES = Object.fromEntries(Object.entries(SEDES).map(([k,v])=>[k,v.nombre]));
