// ── UTILIDADES PURAS ────────────────────────────────
// Funciones sin dependencia de estado compartido (me, db, etc).
// Extraídas del index.html para reducir su tamaño.

export const today   = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const ago     = n  => { const d=new Date(); d.setDate(d.getDate()-n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const fmt     = d  => { if(!d) return ''; const[y,m,day]=d.split('-'); return `${day}/${m}/${y}`; };
export const fmtLong = d  => d ? new Date(d+'T12:00:00').toLocaleDateString('es-SV',{weekday:'long',year:'numeric',month:'long',day:'numeric'}) : '';

export function mesCerrado(fecha){
  if(!fecha) return false;
  const [y,m]=fecha.split('-').map(Number);
  const hoy=new Date();
  const mesHoy=hoy.getMonth()+1;
  const anioHoy=hoy.getFullYear();
  // El mes está cerrado si es anterior al mes actual
  if(y<anioHoy) return true;
  if(y===anioHoy&&m<mesHoy) return true;
  return false;
}

export function horarioBase(fecha){
  const d = new Date(fecha+'T12:00:00');
  const dow = d.getDay(); // 0=Dom,1=Lun,...,5=Vie,6=Sab
  if(dow===0 || dow===6) return null; // Sábado y Domingo: todo HE
  if(dow===5) return {ini:'07:00',fin:'16:00'}; // Viernes
  return {ini:'07:00',fin:'17:00'}; // Lun-Jue
}

export function toMins(t){ const[h,m]=t.split(':').map(Number); return h*60+m; }
export function fromMins(m){ return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`; }

// Calcula HE dado fecha, entrada, salida
export function calcularHE(fecha, entrada, salida){
  if(!fecha||!entrada||!salida) return {he:false, minHE:0, heIni:'', heFin:'', esFinde:false};
  const base = horarioBase(fecha);
  const d = new Date(fecha+'T12:00:00');
  const dow = d.getDay();
  const esFinde = (dow===0||dow===6);

  const entMin = toMins(entrada);
  const salMin = toMins(salida);
  if(salMin<=entMin) return {he:false, minHE:0, heIni:'', heFin:'', esFinde};

  let minHE = 0;
  let heIni = '', heFin = '';

  if(!base || dow===0){
    // Domingo o sin base: todo es HE
    minHE = salMin - entMin;
    heIni = entrada; heFin = salida;
  } else {
    const baseIni = toMins(base.ini);
    const baseFin = toMins(base.fin);

    // HE antes de entrada base
    const heAntes = entMin < baseIni ? baseIni - entMin : 0;
    // HE después de salida base
    const heDespues = salMin > baseFin ? salMin - baseFin : 0;

    minHE = heAntes + heDespues;

    if(heAntes > 0 && heDespues > 0){
      // HE en ambos extremos — mostrar rango completo entrada-salida
      heIni = entrada; heFin = salida;
    } else if(heAntes > 0){
      // Solo HE antes — de entrada hasta inicio base
      heIni = entrada; heFin = base.ini;
    } else if(heDespues > 0){
      // Solo HE después — de fin base hasta salida
      heIni = base.fin; heFin = salida;
    }
  }

  return { he: minHE>0, minHE, heIni, heFin, esFinde };
}

// ── ASUETOS (cálculo algorítmico) ──────────────────────
export function calcSemSanta(y){
  const a=y%19,b=Math.floor(y/100),c=y%100;
  const d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
  const h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4;
  const l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
  const mes=Math.floor((h+l-7*m+114)/31),dia=((h+l-7*m+114)%31)+1;
  const pascua=new Date(y,mes-1,dia);
  return [-3,-2,-1].map(n=>{const d=new Date(pascua);d.setDate(pascua.getDate()+n);return d.toISOString().split('T')[0];});
}

export function primerLunesAgosto(y){
  const d=new Date(y,7,1);
  while(d.getDay()!==1) d.setDate(d.getDate()+1);
  return d.toISOString().split('T')[0];
}

export function asuetosFijos(y){
  const ss=calcSemSanta(y), lunes=primerLunesAgosto(y);
  return [
    {fecha:`${y}-01-01`,nombre:'Año Nuevo',oficial:true},
    {fecha:ss[0],nombre:'Jueves Santo',oficial:true},
    {fecha:ss[1],nombre:'Viernes Santo',oficial:true},
    {fecha:ss[2],nombre:'Sábado Santo',oficial:true},
    {fecha:`${y}-05-01`,nombre:'Día del Trabajo',oficial:true},
    {fecha:`${y}-05-10`,nombre:'Día de la Madre',oficial:true},
    {fecha:`${y}-06-17`,nombre:'Día del Padre',oficial:true},
    {fecha:lunes,nombre:'Fiestas Agostinas',oficial:true},
    {fecha:`${y}-08-03`,nombre:'Fiestas Agostinas',oficial:true},
    {fecha:`${y}-08-04`,nombre:'Fiestas Agostinas',oficial:true},
    {fecha:`${y}-08-05`,nombre:'Fiestas Agostinas',oficial:true},
    {fecha:`${y}-09-15`,nombre:'Independencia de El Salvador',oficial:true},
    {fecha:`${y}-11-02`,nombre:'Día de los Difuntos',oficial:true},
    {fecha:`${y}-12-25`,nombre:'Navidad',oficial:true},
  ];
}
