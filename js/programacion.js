// ── MÓDULO DE PROGRAMACIÓN ─────────────────────────────
// Programación diaria de personal a campo/plantel.
// Recibe `db` y las funciones de Firebase desde index.html.
// Estructura Firebase:
//   config/vehiculos/{id}: { nombre, tipo, estado, campanias:[...] }
//   config/campanias/{id}: { nombre, area, activa }
//   programaciones/{fecha}: { grupos:[...], noDisponibles:{personal:[],vehiculos:[]}, actualizado }

// ── SEMILLAS (catálogo inicial que se carga una sola vez) ──
export const CAMPANIAS_SEED = [
  // Campo
  { nombre:'Cambio de medidores',        area:'campo' },
  { nombre:'AMI',                        area:'campo' },
  { nombre:'Caracterización de la carga',area:'campo' },
  { nombre:'Reclamos SIGET',             area:'campo' },
  { nombre:'Mantenimiento no eléctrico', area:'campo' },
  { nombre:'Verificación de medidores',  area:'campo' },
  { nombre:'Descarga de Fusesaver',      area:'campo' },
  { nombre:'Toma de lecturas',           area:'campo' },
  // Plantel
  { nombre:'Sellado de medidores',       area:'plantel' },
  { nombre:'Conteo de medidores',        area:'plantel' },
  { nombre:'Prueba de luminarias',       area:'plantel' },
  { nombre:'Actualización de órdenes',   area:'plantel' },
];

export const VEHICULOS_SEED = [
  // Carros
  { nombre:'P38DA6',  tipo:'carro', campanias:[] },
  { nombre:'P568DA',  tipo:'carro', campanias:[] },
  { nombre:'CPT-154', tipo:'carro', campanias:[] },
  { nombre:'CPT-156', tipo:'carro', campanias:[] },
  { nombre:'AU-200',  tipo:'carro', campanias:[] },
  { nombre:'AU-250',  tipo:'carro', campanias:[] },
  { nombre:'AEC-240', tipo:'carro', campanias:['Cambio de medidores'] }, // restringido
  { nombre:'SG-295',  tipo:'carro', campanias:[] },
  { nombre:'SG-297',  tipo:'carro', campanias:[] },
  // Motos
  { nombre:'M27AC',   tipo:'moto', campanias:[] },
  { nombre:'M277A',   tipo:'moto', campanias:[] },
  { nombre:'M26CA',   tipo:'moto', campanias:[] },
  { nombre:'M270F',   tipo:'moto', campanias:[] },
  { nombre:'M3186A',  tipo:'moto', campanias:[] },
  { nombre:'M3196F',  tipo:'moto', campanias:[] },
  { nombre:'M31A8D',  tipo:'moto', campanias:[] },
  { nombre:'M319E0',  tipo:'moto', campanias:[] },
];

export const ESTADOS_VEHICULO = {
  disponible:   { texto:'Disponible',      color:'ba' },
  mantenimiento:{ texto:'En mantenimiento',color:'br' },
  prestado:     { texto:'Prestado',        color:'by' },
  baja:         { texto:'De baja',         color:'bn' },
};

// Zonas (departamentos) — código para mostrar compacto, nombre para el menú
export const ZONAS = [
  { codigo:'ZC', nombre:'Zacatecoluca' },
  { codigo:'SS', nombre:'San Salvador' },
  { codigo:'ST', nombre:'Santa Tecla' },
  { codigo:'LL', nombre:'La Libertad' },
  { codigo:'OP', nombre:'San Juan Opico' },
];

// ── CATÁLOGOS: leer y sembrar ──────────────────────────
export async function obtenerCampanias(db, fns){
  const {ref,get}=fns;
  const snap=await get(ref(db,'config/campanias'));
  if(!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id,v])=>({id,...v}));
}

export async function obtenerVehiculos(db, fns){
  const {ref,get}=fns;
  const snap=await get(ref(db,'config/vehiculos'));
  if(!snap.exists()) return [];
  return Object.entries(snap.val()).map(([id,v])=>({id,...v}));
}

// Siembra los catálogos SOLO si están vacíos. Devuelve true si sembró.
export async function sembrarCatalogos(db, fns){
  const {ref,get,push,set}=fns;
  let sembro=false;
  const camp=await get(ref(db,'config/campanias'));
  if(!camp.exists()){
    for(const c of CAMPANIAS_SEED){
      await set(push(ref(db,'config/campanias')), { ...c, activa:true });
    }
    sembro=true;
  }
  const veh=await get(ref(db,'config/vehiculos'));
  if(!veh.exists()){
    for(const v of VEHICULOS_SEED){
      await set(push(ref(db,'config/vehiculos')), { ...v, estado:'disponible' });
    }
    sembro=true;
  }
  return sembro;
}

// ── CATÁLOGOS: alta / edición / baja ───────────────────
export async function guardarCampania(db, fns, id, datos){
  const {ref,set,push,update}=fns;
  if(id){ await update(ref(db,`config/campanias/${id}`), datos); return id; }
  const nuevo=push(ref(db,'config/campanias'));
  await set(nuevo, { ...datos, activa:true });
  return nuevo.key;
}
export async function eliminarCampania(db, fns, id){
  const {ref,set}=fns;
  await set(ref(db,`config/campanias/${id}`), null);
}
export async function guardarVehiculo(db, fns, id, datos){
  const {ref,set,push,update}=fns;
  if(id){ await update(ref(db,`config/vehiculos/${id}`), datos); return id; }
  const nuevo=push(ref(db,'config/vehiculos'));
  await set(nuevo, { estado:'disponible', campanias:[], ...datos });
  return nuevo.key;
}
export async function eliminarVehiculo(db, fns, id){
  const {ref,set}=fns;
  await set(ref(db,`config/vehiculos/${id}`), null);
}

// ── PROGRAMACIÓN DIARIA ────────────────────────────────
export async function obtenerProgramacion(db, fns, fecha){
  const {ref,get}=fns;
  const snap=await get(ref(db,`programaciones/${fecha}`));
  return snap.exists()?snap.val():null;
}

export async function guardarProgramacion(db, fns, fecha, data){
  const {ref,set}=fns;
  await set(ref(db,`programaciones/${fecha}`), { ...data, actualizado:Date.now() });
}

// Devuelve las fechas con programación guardada, más recientes primero
export async function obtenerFechasProgramadas(db, fns){
  const {ref,get}=fns;
  const snap=await get(ref(db,'programaciones'));
  if(!snap.exists()) return [];
  return Object.keys(snap.val()).sort((a,b)=>b.localeCompare(a));
}

// ── VALIDACIÓN (solo avisa, no impide) ─────────────────
// grupos: [{ campania, area, empleados:[uid], empleadosNombres:[], vehiculo, vehiculoNombre }]
// Devuelve array de avisos en texto.
export function detectarConflictos(grupos, vehiculos){
  const avisos=[];
  const personaEn={}; // uid -> [indices de grupo]
  const vehiculoEn={}; // vehiculoId -> [indices]

  grupos.forEach((g,i)=>{
    (g.empleados||[]).forEach(uid=>{
      (personaEn[uid]=personaEn[uid]||[]).push(i);
    });
    if(g.vehiculo){
      (vehiculoEn[g.vehiculo]=vehiculoEn[g.vehiculo]||[]).push(i);
      // Restricción de campaña del vehículo
      const veh=vehiculos.find(v=>v.id===g.vehiculo);
      if(veh && Array.isArray(veh.campanias) && veh.campanias.length>0){
        if(g.campania && !veh.campanias.includes(g.campania)){
          avisos.push(`El vehículo ${veh.nombre} normalmente se usa solo para ${veh.campanias.join(', ')}, pero está en "${g.campania}".`);
        }
      }
      // Vehículo no disponible
      if(veh && veh.estado && veh.estado!=='disponible'){
        const est=ESTADOS_VEHICULO[veh.estado]?.texto||veh.estado;
        avisos.push(`El vehículo ${veh.nombre} está marcado como "${est}".`);
      }
    }
  });

  // Persona en más de un grupo
  Object.entries(personaEn).forEach(([uid,idxs])=>{
    if(idxs.length>1){
      const nombre=(grupos[idxs[0]].empleadosNombres||[])[(grupos[idxs[0]].empleados||[]).indexOf(uid)]||'Un empleado';
      avisos.push(`${nombre} está asignado en ${idxs.length} grupos el mismo día.`);
    }
  });
  // Vehículo en más de un grupo
  Object.entries(vehiculoEn).forEach(([vid,idxs])=>{
    if(idxs.length>1){
      const veh=vehiculos.find(v=>v.id===vid);
      avisos.push(`El vehículo ${veh?.nombre||''} está en ${idxs.length} grupos el mismo día.`);
    }
  });

  return avisos;
}

// Busca en qué grupo está asignado un empleado (para su vista personal)
export function grupoDeEmpleado(programacion, uid){
  if(!programacion || !Array.isArray(programacion.grupos)) return null;
  return programacion.grupos.find(g=>(g.empleados||[]).includes(uid)) || null;
}
