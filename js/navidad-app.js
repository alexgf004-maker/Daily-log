// ── Navidad dentro de la app: cordón personal de foquitos y calendario de Adviento ──
// Lo usa el módulo principal de index.html (import). No toca cómo se marca ni cómo se guardan registros.
//  · Cordón personal (Pre-Navidad, 1–21 dic): en el encabezado de "Registro de actividades", un foquito por día
//    hábil de diciembre. Se enciende si ese día el técnico marcó su entrada a tiempo (o la justificó); si no,
//    queda congelado (sin rojo ni regaños). Los días que faltan, apagados y tenues.
//  · Calendario de Adviento (1–24 dic): una tarjeta con 24 puertitas; se abre la de hoy (y las pasadas que no
//    abrió). Trae una sorpresita del día, una línea personal y, si el admin lo escribió, su mensaje
//    (config/navidad/adviento/<día>). Las puertas abiertas se recuerdan en este teléfono.
// Fuera de diciembre (vista previa con "Ver ahora"), se muestra con un día de ejemplo (10 dic).

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

// Sorpresas del Adviento: textos propios (curiosidades, consejos y detalles para el equipo)
export const ADVIENTO = [
  { ico:'⭐', t:'Arranca diciembre', x:'Hoy se enciende la Navidad en la app. Cada día se abre una puertita nueva hasta Nochebuena: pasa por aquí antes de registrar.' },
  { ico:'☕', t:'Pausa con café', x:'Un descanso corto de 5 minutos a media mañana ayuda a concentrarse mejor el resto del día. Te lo ganaste.' },
  { ico:'🧤', t:'Manos a salvo', x:'En campo, revisa tus guantes y herramientas antes de salir. Lo mejor de diciembre es llegar bien a casa.' },
  { ico:'🌺', t:'La flor de pascua', x:'La pascua, tan típica en nuestras casas en diciembre, es originaria de México y Centroamérica. Lo rojo no son pétalos: son hojas.' },
  { ico:'🎶', t:'Música para la ruta', x:'Arma una lista de canciones para el camino de regreso. El tráfico de diciembre se lleva mejor con buena música.' },
  { ico:'🫶', t:'Un gracias a tiempo', x:'Hoy dale las gracias a un compañero que te haya echado la mano este año. Cuesta poco y se recuerda mucho.' },
  { ico:'💧', t:'Agua, por favor', x:'Con el sol de diciembre también se suda. Lleva tu botella de agua y tómala aunque no tengas sed.' },
  { ico:'🌙', t:'Noche de faroles', x:'En muchos pueblos de El Salvador se encienden faroles y luces en estas fechas: diciembre es el mes más iluminado del año.' },
  { ico:'📸', t:'La foto del día', x:'Si hoy ves algo bonito en tu ruta, tómale una foto. Al final del mes vas a tener tu propio diciembre en imágenes.' },
  { ico:'📝', t:'Registro al día', x:'Registrar tus actividades el mismo día evita olvidos y que te reboten horas extra o viáticos. Diez segundos y listo.' },
  { ico:'🍬', t:'Dulce del mes', x:'¿Sabías que los bastones de dulce tienen más de 300 años? Hoy, si puedes, comparte algo dulce con alguien.' },
  { ico:'🧭', t:'Ruta segura', x:'Antes de salir a campo, avisa por dónde vas a andar. Si algo pasa, tu equipo sabe dónde buscarte.' },
  { ico:'🎁', t:'Regalos que no se compran', x:'Una llamada a tu familia a medio día, un mensaje a un amigo: hay regalos que no cuestan nada y valen mucho.' },
  { ico:'⏰', t:'Diez minutos antes', x:'Salir diez minutos antes de casa es la fórmula más sencilla para llegar sin carreras y empezar el día tranquilo.' },
  { ico:'🌟', t:'Mitad del camino', x:'Ya vamos a la mitad del camino a Nochebuena. Quedan nueve puertitas: no te pierdas ninguna.' },
  { ico:'🫓', t:'Tamales y pan con pavo', x:'En El Salvador la Nochebuena suele llevar pan con pavo o tamales. ¿Cuál es el plato que no puede faltar en tu casa?' },
  { ico:'😴', t:'Dormir también es trabajo', x:'Dormir 7 u 8 horas mejora la atención en campo. Hoy intenta acostarte un poquito más temprano.' },
  { ico:'🔦', t:'Revisión de equipo', x:'Linterna con batería, cargador y datos móviles: revísalos hoy y te ahorras sustos en la semana.' },
  { ico:'🤝', t:'Equipo que se ayuda', x:'Si terminas antes, pregunta si alguien necesita una mano. Los equipos que se ayudan cierran el año más tranquilos.' },
  { ico:'🧦', t:'Medias en la chimenea', x:'Cuenta la historia que unas monedas cayeron por una chimenea y fueron a dar a unas medias que se secaban junto al fuego. De ahí viene colgarlas.' },
  { ico:'🎄', t:'Luces seguras', x:'Si en tu casa ya brilla el árbol, revisa que las extensiones no queden bajo alfombras ni cerca de cortinas, y apágalas al dormir.' },
  { ico:'🕯️', t:'Faltan dos días', x:'El árbol encendido y la chimenea calientita: ya casi es Nochebuena. Estos días, cuida tus gastos y disfruta a los tuyos.' },
  { ico:'✨', t:'Víspera de Nochebuena', x:'Mañana es Nochebuena. Si vas a usar pólvora, que sea lejos de niños y mascotas, y siempre con un adulto responsable.' },
  { ico:'🌠', t:'¡Feliz Nochebuena!', x:'Llegamos. Gracias por cada registro, cada marcaje y cada día de trabajo este año. ¡Feliz Nochebuena para ti y tu familia!' },
];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const primerNombre = n => { const p = String(n || '').trim().split(/\s+/)[0] || ''; return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : ''; };

// Día "de Navidad" que vale ahora: el real en diciembre; fuera de temporada (vista previa), el 10
export function diaNavidad(hoyISO) {
  const [y, m, d] = hoyISO.split('-').map(Number);
  if (m === 12) return { anio: y, dia: d, real: true };
  return { anio: m === 1 ? y - 1 : y, dia: 10, real: false };
}

/* ═══════════════════ 1. Cordón personal de foquitos ═══════════════════ */
// dias: [{fecha, dia, estado:'on'|'frio'|'hoy'|'futuro'}]
// fechas: los días de la etapa Pre-Navidad hasta hoy (AAAA-MM-DD, de T.diaPre) más los que faltan de la etapa no se
// dibujan; sin fechas (vista previa fuera de temporada) se usan los días 1–21 de diciembre como antes.
export function diasDelCordon({ fechas, hoy, anio, diaHoy, real, uid, marcajes, sabados, asuetos, empleadoTrabajaSabado }) {
  const asu = new Set((asuetos || []).map(a => a.fecha || a));
  const porFecha = Object.fromEntries((marcajes || []).map(m => [m.fecha, m]));
  const out = [];
  if (fechas && fechas.length) {
    for (const fecha of fechas) {
      const dow = new Date(fecha + 'T12:00:00').getDay(), d = Number(fecha.slice(8));
      if (dow === 0 || asu.has(fecha)) continue;
      if (dow === 6 && !(empleadoTrabajaSabado && empleadoTrabajaSabado(sabados, fecha, uid))) continue;
      const e = porFecha[fecha]?.entrada;
      const estado = e && (e.estado === 'a_tiempo' || e.justificado) ? 'on' : fecha === hoy ? (e ? 'frio' : 'hoy') : 'frio';
      out.push({ fecha, dia: d, dow, estado });
    }
    return out;
  }
  for (let d = 1; d <= 21; d++) {
    const fecha = `${anio}-12-${String(d).padStart(2, '0')}`;
    const dow = new Date(fecha + 'T12:00:00').getDay();
    if (dow === 0 || asu.has(fecha)) continue;
    if (dow === 6 && !(empleadoTrabajaSabado && empleadoTrabajaSabado(sabados, fecha, uid))) continue;
    let estado;
    if (!real) estado = d < diaHoy ? ([2, 5].includes(out.length % 7) ? 'frio' : 'on') : d === diaHoy ? 'hoy' : 'futuro';   // vista previa
    else if (d > diaHoy) estado = 'futuro';
    else {
      const e = porFecha[fecha]?.entrada;
      if (e && (e.estado === 'a_tiempo' || e.justificado)) estado = 'on';
      else if (d === diaHoy) estado = e ? 'frio' : 'hoy';
      else estado = 'frio';
    }
    out.push({ fecha, dia: d, dow, estado });
  }
  return out;
}

export function cordonHTML(dias, nombre, real) {
  const n = dias.length || 1, on = dias.filter(x => x.estado === 'on').length;
  const colores = ['#e3263c', '#f2c45a', '#2bb38a', '#e3263c', '#9cd7ff'];
  const W = 320, cae = 16;
  const pos = i => { const t = (i + 0.5) / n; return [t * W, 6 + cae * 4 * t * (1 - t)]; };
  let focos = '';
  dias.forEach((x, i) => {
    const [px, py] = pos(i), col = colores[i % colores.length];
    const titulo = `${DIAS[x.dow]} ${x.dia}: ${x.estado === 'on' ? 'encendido' : x.estado === 'frio' ? 'congelado' : x.estado === 'hoy' ? 'hoy, por encender' : 'por venir'}`;
    focos += `<g class="nvp-f ${x.estado}" transform="translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${((i * 37) % 24) - 12})" style="--d:${(-((i * 3) % 8) * 0.3).toFixed(1)}s"><title>${titulo}</title>
      <rect x="-2.4" y="-1" width="4.8" height="4" rx="1" fill="#8fa6bb"/>
      <path class="vid" d="M0 2.8C-5 4.6 -5 13.4 0 15.6C5 13.4 5 4.6 0 2.8Z" fill="${x.estado === 'on' ? col : x.estado === 'futuro' ? 'rgba(255,255,255,.18)' : '#cfe3f2'}"/>
      ${x.estado === 'frio' ? '<path d="M-3.9 6.6C-3.4 4.6 3.4 4.6 3.9 6.6C3.4 9.6 -3.4 9.6 -3.9 6.6Z" fill="#fff" opacity=".85"/><path d="M-2 15 l1 3 1-3" fill="#e8f8ff"/>' : ''}
      ${x.estado === 'on' ? '<ellipse cx="-1.4" cy="7" rx="1" ry="2" fill="#fff" opacity=".7"/>' : ''}
      ${x.estado === 'hoy' ? '<circle class="nvp-anillo" cy="9" r="9" fill="none" stroke="#fff" stroke-width="1.2"/>' : ''}</g>`;
  });
  const quien = primerNombre(nombre);
  const frase = on === 0
    ? (quien ? `${quien}, tu primer foquito se enciende al marcar a tiempo` : 'Tu primer foquito se enciende al marcar a tiempo')
    : `${quien ? quien + ', llevas' : 'Llevas'} <b>${on}</b> ${on === 1 ? 'foquito encendido' : 'foquitos encendidos'}`;
  return `<div class="nvp-foq${real ? '' : ' demo'}" aria-label="Tu cordón de foquitos de la temporada">
    <svg viewBox="0 -2 ${W} 40" preserveAspectRatio="none"><defs><filter id="nvpLuz" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <path d="M0 6 Q${W / 2} ${6 + cae * 2} ${W} 6" stroke="rgba(207,227,242,.6)" stroke-width="1" fill="none"/>${focos}</svg>
    <div class="nvp-foq-t">${frase}${real ? '' : ' <span>· vista previa</span>'}</div></div>`;
}

/* ═══════════════════ 2. Calendario de Adviento ═══════════════════ */
const claveAbiertas = (uid, anio) => `innova_adviento_${uid}_${anio}`;
export function puertasAbiertas(uid, anio) { try { return JSON.parse(localStorage.getItem(claveAbiertas(uid, anio)) || '[]'); } catch (_) { return []; } }
function marcarAbierta(uid, anio, dia) { try { const a = new Set(puertasAbiertas(uid, anio)); a.add(dia); localStorage.setItem(claveAbiertas(uid, anio), JSON.stringify([...a])); } catch (_) {} }

// Cordones de foquitos numerados: se enciende uno por cada día que ya llegó y el de hoy parpadea. En el celular van
// dos cordones de 12; en pantallas anchas (PC) uno solo de 24, para que los foquitos no se vean enormes (el CSS
// elige cuál mostrar según el ancho de la tarjeta).
const COLS_ADV = ['#ff3b4e', '#ffc93a', '#2fd17a', '#3fb6ff', '#ff7ad9'];
function cordonAdv(desde, n, diaHoy, ancho, clase) {
  const yCable = u => { const t = u < .5 ? u * 2 : (u - .5) * 2, a = u < .5 ? 4 : 6, c = u < .5 ? 6 : 4; return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * 28 + t * t * c; };
  let g = '';
  for (let k = 0; k < n; k++) {
    const d = desde + k, u = (k + .5) / n, x = u * ancho, y = yCable(u) - 1, on = d <= diaHoy, hoy = d === diaHoy, col = COLS_ADV[d % 5];
    g += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"${hoy ? ' class="adv-hoy"' : ''}>${on ? `<circle cy="11" r="13" fill="${col}" opacity=".3"/>` : ''}<rect x="-3" y="-2" width="6" height="5" rx="1" fill="#4d5966"/><path d="M0 3C-6 5-6 15 0 19C6 15 6 5 0 3Z" fill="${on ? col : '#cfd6de'}" fill-opacity="${on ? 1 : .45}"${hoy ? ' stroke="#fff" stroke-width="1.5"' : ''}/><ellipse cx="-1.8" cy="9" rx="1.1" ry="2.6" fill="#fff" opacity=".6"/><text y="33" text-anchor="middle" opacity="${hoy ? 1 : on ? .75 : .45}">${d}</text></g>`;
  }
  const m = ancho / 2;
  return `<svg class="adv-cordon ${clase}" viewBox="0 0 ${ancho} 48" aria-hidden="true"><path d="M-4 4Q${m / 2 - 4} 28 ${m} 6Q${m * 1.5 + 4} 28 ${ancho + 4} 4" fill="none"/>${g}</svg>`;
}
function cordonesAdviento(diaHoy) {
  return `<div class="adv-cordones" aria-label="${Math.min(diaHoy, 24)} de 24 foquitos encendidos">${cordonAdv(1, 12, diaHoy, 360, 'adv-dos')}${cordonAdv(13, 12, diaHoy, 360, 'adv-dos')}${cordonAdv(1, 24, diaHoy, 840, 'adv-uno')}</div>`;
}

export function adventoHTML({ uid, anio, diaHoy, real }) {
  const abiertas = new Set(puertasAbiertas(uid, anio));
  const hoyAbierta = abiertas.has(diaHoy) && real;
  let puertas = '';
  for (let d = 1; d <= 24; d++) {
    const est = d > diaHoy ? 'cerrada' : abiertas.has(d) && real ? 'abierta' : d === diaHoy ? 'hoy' : 'pendiente';
    puertas += `<button type="button" class="nvp-pu ${est}" data-dia="${d}" ${est === 'cerrada' ? 'disabled aria-disabled="true"' : ''} aria-label="Día ${d}${est === 'cerrada' ? ', todavía no' : ''}"><span>${d}</span></button>`;
  }
  const faltan = Math.max(0, 24 - diaHoy);
  return `<div class="nvp-adv${real ? '' : ' demo'}" id="nvpAdv">
    <button type="button" class="nvp-adv-hoy" data-dia="${diaHoy}" aria-label="Abrir la puertita de hoy">
      <span class="nvp-adv-regalo ${hoyAbierta ? 'abierto' : ''}" aria-hidden="true">
        <svg viewBox="0 0 64 64"><defs><linearGradient id="nvpCaja" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef4459"/><stop offset="1" stop-color="#a3132a"/></linearGradient></defs>
          <rect x="10" y="28" width="44" height="30" rx="4" fill="url(#nvpCaja)"/><rect x="29" y="28" width="6" height="30" fill="#f2c45a"/>
          <g class="tapa"><rect x="7" y="19" width="50" height="11" rx="3" fill="#d51f37"/><rect x="29" y="19" width="6" height="11" fill="#f6d27a"/>
            <path d="M32 19C24 8 15 12 20 18C23 21 29 20 32 19ZM32 19C40 8 49 12 44 18C41 21 35 20 32 19Z" fill="#f2c45a"/></g>
          <text x="32" y="50" text-anchor="middle" font-size="13" font-weight="800" fill="#fff" font-family="Plus Jakarta Sans,Inter,sans-serif">${diaHoy}</text></svg>
      </span>
      <span class="nvp-adv-tx"><b>Calendario de Adviento</b><span>${hoyAbierta ? 'Ya abriste la de hoy · toca para verla' : 'Toca para abrir la puertita de hoy'}</span><em>${faltan > 1 ? `Faltan ${faltan} días para Nochebuena` : faltan === 1 ? '¡Mañana es Nochebuena!' : '¡Hoy es Nochebuena!'}</em></span>
    </button>
    ${cordonesAdviento(diaHoy)}
    <details class="nvp-adv-mas"><summary>Ver las 24 puertitas</summary><div class="nvp-puertas">${puertas}</div></details>
  </div>`;
}

// Abre la puerta de un día: animación de las dos hojas de la puerta y la sorpresa adentro
export function abrirPuerta({ dia, uid, anio, nombre, mensajeAdmin, lineaPersonal, real }) {
  const s = ADVIENTO[dia - 1] || ADVIENTO[0];
  if (real) marcarAbierta(uid, anio, dia);
  document.getElementById('nvpPuerta')?.remove();
  const quien = primerNombre(nombre);
  const fecha = `${DIAS[new Date(`${anio}-12-${String(dia).padStart(2, '0')}T12:00:00`).getDay()]} ${dia} de diciembre`;
  const w = document.createElement('div'); w.id = 'nvpPuerta'; w.className = 'nvp-modal';
  w.innerHTML = `<div class="nvp-modal-in" role="dialog" aria-label="Puertita del día ${dia}">
      <div class="nvp-hojas" aria-hidden="true"><i class="izq"><b>${dia}</b></i><i class="der"></i></div>
      <div class="nvp-sorpresa">
        <div class="nvp-ico">${s.ico}</div>
        <div class="nvp-k">${esc(fecha)}</div>
        <div class="nvp-t">${esc(s.t)}</div>
        <p class="nvp-x">${esc(s.x)}</p>
        ${lineaPersonal ? `<div class="nvp-personal">${lineaPersonal}</div>` : ''}
        ${mensajeAdmin ? `<div class="nvp-admin"><span>Mensaje de la oficina</span>${esc(mensajeAdmin.texto)}${mensajeAdmin.por ? `<em>— ${esc(primerNombre(mensajeAdmin.por))}</em>` : ''}</div>` : ''}
        <button type="button" class="nvp-cerrar">${quien ? `¡Gracias! Seguimos, ${esc(quien)}` : '¡Gracias!'}</button>
      </div></div>`;
  const cerrar = () => { w.classList.add('sale'); setTimeout(() => w.remove(), 260); };
  w.addEventListener('click', e => { if (e.target === w || e.target.closest('.nvp-cerrar')) cerrar(); });
  document.body.appendChild(w);
  requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add('abre')));
  return w;
}

export function lineaPersonalAdviento({ nombre, encendidos, diaHoy }) {
  const q = primerNombre(nombre);
  if (encendidos == null) return q ? `${esc(q)}, que tengas un gran día.` : '';
  if (diaHoy > 21) return `${q ? esc(q) + ', este' : 'Este'} diciembre encendiste <b>${encendidos}</b> ${encendidos === 1 ? 'foquito' : 'foquitos'}. ¡Gracias!`;
  if (encendidos === 0) return `${q ? esc(q) + ', hoy' : 'Hoy'} puede ser tu primer foquito encendido: marca tu entrada a tiempo.`;
  return `${q ? esc(q) + ', llevas' : 'Llevas'} <b>${encendidos}</b> ${encendidos === 1 ? 'foquito encendido' : 'foquitos encendidos'} en tu cordón.`;
}
