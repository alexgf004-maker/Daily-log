// ── MÓDULO DE MARCAJE GPS ──────────────────────────────
// Control de entrada/salida por geolocalización.
// Este módulo recibe `db` y las funciones de Firebase (ref, get, set, update)
// desde index.html — no inicializa su propia conexión a Firebase.

export const SEDES = {
  plantel:      { nombre:'Plantel Central',                     lat:13.688409755143281, lng:-89.27993065477382, radio:115 },
  gestionmedida:{ nombre:'Plantel Central · Gestión de la medida', lat:13.687696, lng:-89.280831, radio:100 },
  cucumacayan:  { nombre:'Subestación Cucumacayán',             lat:13.693570433295193, lng:-89.20564341328895, radio:100 },
  zacatecoluca: { nombre:'Subestación Zacatecoluca',            lat:13.508016211954466, lng:-88.86875891706555, radio:100 },
  prueba:       { nombre:'Prueba — no usar',                    lat:13.828394851402207, lng:-89.26711982035171, radio:100 },
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
export function horarioOficial(fecha){
  const d=new Date(fecha+'T12:00:00');
  const dow=d.getDay();
  if(dow===0) return null; // domingo: sin horario oficial de marcaje
  if(dow===6) return {entrada:'06:00',salida:'14:00'}; // sábado
  return dow===5 ? {entrada:'07:00',salida:'16:00'} : {entrada:'07:00',salida:'17:00'};
}

const TOLERANCIA_MIN = 0;

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

// ── Ubicación para marcar ───────────────────────────────
// Antes se pedía UNA lectura de alta precisión sin aceptar nada guardado
// (maximumAge:0): el celular tenía que conseguir una señal GPS nueva, que en
// interiores o con mala señal tarda muchos segundos.
// Ahora, apenas se muestra la tarjeta de marcaje, se empieza a seguir la
// ubicación (watchPosition): las primeras lecturas (red/wifi o la última que
// tenga el celular) llegan casi al instante y luego se van afinando. Al tocar
// "Marcar" se usa la mejor lectura reciente y solo se espera si todavía no
// alcanza para decidir.
let _watchId=null, _mejor=null, _errGps=null, _watchHasta=0, _avisar=[];
const SEGUIR_MS=3*60*1000;   // seguir la ubicación hasta 3 min sin marcar
const LECTURA_VIGENTE_MS=60*1000;
const ESPERA_MAX_MS=15000;   // espera máxima al tocar "Marcar"
const ESPERA_AFINAR_MS=6000; // si ya hay lectura pero imprecisa, esperar un poco a que mejore

function detenerSeguimiento(){
  if(_watchId!==null&&navigator.geolocation){ try{ navigator.geolocation.clearWatch(_watchId); }catch(_){} }
  _watchId=null;
}
function iniciarSeguimiento(){
  if(!navigator.geolocation||!navigator.geolocation.watchPosition) return false;
  _watchHasta=Date.now()+SEGUIR_MS;
  if(_watchId!==null) return true;
  _errGps=null;
  _watchId=navigator.geolocation.watchPosition(pos=>{
    const ahora=Date.now();
    // Se queda con la más precisa; una lectura vieja se reemplaza aunque sea menos precisa
    if(!_mejor||pos.coords.accuracy<=_mejor.pos.coords.accuracy||ahora-_mejor.at>20000) _mejor={pos,at:ahora};
    _errGps=null;
    _avisar.slice().forEach(f=>f());
    if(ahora>_watchHasta) detenerSeguimiento();
  }, err=>{
    _errGps=err;
    _avisar.slice().forEach(f=>f());
    if(err.code===1) detenerSeguimiento();
  }, { enableHighAccuracy:true, maximumAge:30000, timeout:20000 });
  return true;
}

export function prefetchUbicacion(){ iniciarSeguimiento(); }

function errorGps(err){
  return new Error(err&&err.code===1?'PERMISO_DENEGADO':(err&&err.code===3?'GPS_TIMEOUT':'GPS_ERROR'));
}

// Devuelve una posición suficiente para decidir si está dentro del radio de la sede
function ubicacionParaMarcar(sede){
  if(!navigator.geolocation) return Promise.reject(new Error('SIN_GPS'));
  if(!iniciarSeguimiento()){
    // Navegador sin watchPosition: una lectura que acepta una posición reciente
    return new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,e=>rej(errorGps(e)),{enableHighAccuracy:true,timeout:ESPERA_MAX_MS,maximumAge:30000}));
  }
  const inicio=Date.now();
  return new Promise((resolve,reject)=>{
    let listo=false, timer=null;
    const fin=(fn,v)=>{ if(listo) return; listo=true; clearInterval(timer); _avisar=_avisar.filter(f=>f!==revisar); fn(v); };
    const revisar=()=>{
      const espera=Date.now()-inicio;
      if(_errGps&&_errGps.code===1) return fin(reject,errorGps(_errGps));
      const c=_mejor&&(Date.now()-_mejor.at)<LECTURA_VIGENTE_MS?_mejor.pos:null;
      if(c){
        const dist=haversineMetros(c.coords.latitude,c.coords.longitude,sede.lat,sede.lng);
        const precisa=c.coords.accuracy<=Math.max(60,sede.radio);
        // Dentro del radio, o lectura precisa (para bien o para mal), o ya se esperó lo razonable
        if(dist<=sede.radio||precisa||espera>=ESPERA_AFINAR_MS) return fin(resolve,c);
      }
      if(espera>=ESPERA_MAX_MS) return fin(reject,_errGps?errorGps(_errGps):new Error('GPS_TIMEOUT'));
    };
    _avisar.push(revisar);
    timer=setInterval(revisar,500);
    revisar();
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

  const deviceId=obtenerDispositivoId();
  const path=`marcajes/${user.id}/${hoy}`;

  // Estas tres operaciones no dependen entre sí, así que se disparan juntas
  // en vez de esperarlas una por una — el GPS (lo que más tarda) se solapa
  // con las lecturas de Firebase en vez de empezar después de ellas.
  let dispSnap, snap, pos;
  try{
    [dispSnap, snap, pos]=await Promise.all([
      get(ref(db,`users/${user.id}/dispositivoId`)),
      get(ref(db,path)),
      ubicacionParaMarcar(sede),
    ]);
  }catch(err){
    if(err instanceof Error && ['PERMISO_DENEGADO','GPS_TIMEOUT','GPS_ERROR','SIN_GPS'].includes(err.message)){
      const e=new Error('No se pudo obtener tu ubicación'); e.code=err.message; throw e;
    }
    throw err;
  }

  // Verificar vínculo de dispositivo — evita que alguien marque desde otro celular en tu nombre
  const dispositivoRegistrado=dispSnap.exists()?dispSnap.val():null;
  if(!dispositivoRegistrado){
    // Primera vez que esta cuenta marca — queda vinculada a este dispositivo
    await set(ref(db,`users/${user.id}/dispositivoId`),deviceId);
  } else if(dispositivoRegistrado!==deviceId){
    const e=new Error('Esta cuenta ya está vinculada a otro celular. Contacta a Madelyn para reactivarla.');
    e.code='DISPOSITIVO_NO_COINCIDE'; throw e;
  }

  const dist=haversineMetros(pos.coords.latitude,pos.coords.longitude,sede.lat,sede.lng);
  if(dist>sede.radio){
    let msg=`Estás a ${Math.round(dist)}m de ${sede.nombre} — debes estar a menos de ${sede.radio}m.`;
    if(dist>500){
      msg+=' Si estás físicamente en el lugar, tu celular puede estar dando una ubicación imprecisa. En iPhone: Configuración → Privacidad y seguridad → Localización → busca esta app → activa "Ubicación exacta".';
    }
    const e=new Error(msg); e.code='FUERA_DE_RANGO'; e.distancia=Math.round(dist); e.sede=sede.nombre; e.radio=sede.radio; throw e;
  }

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
  detenerSeguimiento(); // ya marcó: no hace falta seguir usando el GPS

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
// Minutos en texto corto: "45 min", "2 h", "7 h 13 min"
export function fmtMin(m){
  m=Math.max(0,Math.round(m||0));
  if(m<60) return `${m} min`;
  const h=Math.floor(m/60), r=m%60;
  return r?`${h} h ${r} min`:`${h} h`;
}

export function chipEstado(marc){
  if(!marc||!marc.estado) return {texto:'—',color:'bn'};
  if(marc.justificado) return {texto:'Justificado',color:'bn'};
  const {estado,minDiff}=marc;
  if(estado==='tarde') return {texto:`${fmtMin(minDiff)} tarde`,color:'br'};
  if(estado==='salida_temprana') return {texto:`${fmtMin(minDiff)} antes`,color:'br'};
  if(estado==='a_tiempo') return {texto:'A tiempo',color:'ba'};
  return {texto:'—',color:'bn'};
}

// ── Justificar (o quitar justificación de) una tardanza/salida temprana ──
// Solo debe llamarse desde la UI de admin (el permiso se controla ahí, no aquí).
// datos: { por:uid, nombre, nota } para marcar, o null para quitar la justificación.
export async function justificarMarcaje(db, fns, uid, fecha, tipo, datos){
  const {ref,update}=fns;
  const justificado = datos ? { ...datos, ts:{ '.sv':'timestamp' } } : null;
  await update(ref(db,`marcajes/${uid}/${fecha}/${tipo}`), { justificado });
}

// Frase completa para el mensaje de confirmación al marcar
export function mensajeMarcaje(tipo, estado, minDiff){
  const dur=minDiff<60?`${minDiff} minuto${minDiff===1?'':'s'}`:fmtMin(minDiff);
  if(estado==='tarde') return `Entraste ${dur} tarde`;
  if(estado==='salida_temprana') return `Saliste ${dur} antes de tu hora de salida`;
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
