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
  if(dow===0) return null; // domingo: sin horario oficial de marcaje
  if(dow===6) return {entrada:'06:00',salida:'14:00'}; // sábado
  return dow===5 ? {entrada:'07:00',salida:'16:00'} : {entrada:'07:00',salida:'17:00'};
}

const TOLERANCIA_MIN = 5;

function horaAminutos(horaStr){
  const [h,m]=horaStr.split(':').map(Number);
  return h*60+m;
}

function calcularEstado(tipo, horaStr, fecha){
  const horario=horarioOficial(fecha);
  if(!horario) return {estado:'normal', minDiff:0};
  const min=horaAminutos(horaStr);
  if(tipo==='entrada'){
    const oficial=horaAminutos(horario.entrada);
    const limite=oficial+TOLERANCIA_MIN;
    if(min<=limite) return {estado:'a_tiempo', minDiff:0};
    return {estado:'tarde', minDiff:min-oficial};
  } else {
    const oficial=horaAminutos(horario.salida);
    if(min>=oficial) return {estado:'a_tiempo', minDiff:0};
    return {estado:'salida_temprana', minDiff:oficial-min};
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
// ── Vínculo de dispositivo ──────────────────────────────
// Genera/recupera un identificador único para este celular, guardado localmente.
function obtenerDispositivoId(){
  let id=localStorage.getItem('innova_device_id');
  if(!id){
    id=(crypto?.randomUUID)?crypto.randomUUID():('dev-'+Date.now()+'-'+Math.random().toString(36).slice(2));
    localStorage.setItem('innova_device_id',id);
  }
  return id;
}

// tipo: 'entrada' | 'salida'
// Lanza errores con código: SIN_SEDE, DISPOSITIVO_NO_COINCIDE, SIN_GPS, PERMISO_DENEGADO, GPS_TIMEOUT, GPS_ERROR, FUERA_DE_RANGO, YA_MARCADO
export async function marcarAsistencia(db, fns, user, tipo, hoy){
  const {ref,get,set,update}=fns;
  const sede=sedeEfectiva(user, hoy);
  if(!sede){ const e=new Error('Sin sede asignada'); e.code='SIN_SEDE'; throw e; }

  // Verificar vínculo de dispositivo — evita que alguien marque desde otro celular en tu nombre
  const deviceId=obtenerDispositivoId();
  const dispSnap=await get(ref(db,`users/${user.id}/dispositivoId`));
  const dispositivoRegistrado=dispSnap.exists()?dispSnap.val():null;
  if(!dispositivoRegistrado){
    // Primera vez que esta cuenta marca — queda vinculada a este dispositivo
    await set(ref(db,`users/${user.id}/dispositivoId`),deviceId);
  } else if(dispositivoRegistrado!==deviceId){
    const e=new Error('Esta cuenta ya está vinculada a otro celular. Contacta a Madelyn para reactivarla.');
    e.code='DISPOSITIVO_NO_COINCIDE'; throw e;
  }

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
  const {estado,minDiff}=calcularEstado(tipo,horaStr,hoy);

  await update(ref(db,`${path}/${tipo}`),{ estado, horaStr, minDiff });

  return { estado, horaStr, minDiff, sede:sede.nombre, tipo };
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

// ── Texto y color según estado y minutos de diferencia ──
// Formato corto para badges/chips en listas
export function chipEstado(marc){
  if(!marc||!marc.estado) return {texto:'—',color:'bn'};
  const {estado,minDiff}=marc;
  if(estado==='tarde') return {texto:`${minDiff} min tarde`,color:'br'};
  if(estado==='salida_temprana') return {texto:`${minDiff} min antes`,color:'br'};
  if(estado==='a_tiempo') return {texto:'A tiempo',color:'ba'};
  return {texto:'—',color:'bn'};
}

// Frase completa para el mensaje de confirmación al marcar
export function mensajeMarcaje(tipo, estado, minDiff){
  if(estado==='tarde') return `Entraste ${minDiff} minuto${minDiff===1?'':'s'} tarde`;
  if(estado==='salida_temprana') return `Saliste ${minDiff} minuto${minDiff===1?'':'s'} antes de tu hora de salida`;
  if(estado==='a_tiempo') return tipo==='entrada' ? 'Entraste a tiempo' : 'Cumpliste tu jornada completa';
  return tipo==='entrada' ? 'Entrada registrada' : 'Salida registrada';
}

// Mantenido por compatibilidad — mapea estado a texto/color sin minutos (fallback)
export const ESTADO_LABELS={
  a_tiempo:{texto:'A tiempo',color:'ba'},
  tarde:{texto:'Tarde',color:'br'},
  salida_temprana:{texto:'Salida temprana',color:'br'},
  normal:{texto:'—',color:'bn'}
};

export const NOMBRE_SEDES = Object.fromEntries(Object.entries(SEDES).map(([k,v])=>[k,v.nombre]));
