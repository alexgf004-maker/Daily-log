// ── Navidad en casa (22–27 dic): marcaje «Santa se asoma» ──
// Lo usa el módulo principal de index.html (renderMarcajeCard y "Probar animaciones"). Solo dibuja; no toca cómo se
// marca ni qué se guarda.
//  · A tiempo: Santa se asoma por detrás de la tarjeta, saca un regalo y lo lanza girando al punto; se ríe
//    («¡Jo, jo, jo!»), saluda y guiña el ojo. El punto queda con el regalito.
//  · Tarde (o salida antes): Santa saca su reloj de bolsillo, lo abre y las manecillas corren hasta la hora marcada;
//    se molesta (cejas fruncidas, ojos entrecerrados, boca hacia abajo, marquita de enojo), golpea el reloj, niega con
//    la cabeza y dice «¡Ejem! Llegaste tarde». Deja el reloj en el punto con un brillo rojizo, sin festejo.
//  · La escena es un SVG dentro de la tarjeta (se desplaza con ella); Santa solo se ve por encima de su orilla.
//    Mientras corre, el punto, la hora y la etiqueta esperan ocultos (.nvc-espera) y aparecen al terminar.
// Con movimiento reducido no hay escena: la tarjeta sale ya en su estado final.
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)), seg=(t,a,b)=>cl((t-a)/(b-a)), lerp=(a,b,t)=>a+(b-a)*t;
const eOut=t=>1-Math.pow(1-cl(t),3), eIn=t=>Math.pow(cl(t),2.2), eIO=t=>{t=cl(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
const back=(t,c=1.7)=>{t=cl(t);return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
const NS='http://www.w3.org/2000/svg';
const DEFS=`<defs>
 <radialGradient id="kPiel" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#ffe6d2"/><stop offset=".7" stop-color="#f7c4a2"/><stop offset="1" stop-color="#e9a17e"/></radialGradient>
 <radialGradient id="kMej" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff7a86" stop-opacity=".75"/><stop offset="1" stop-color="#ff7a86" stop-opacity="0"/></radialGradient>
 <radialGradient id="kNar" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffb3a3"/><stop offset=".6" stop-color="#f08070"/><stop offset="1" stop-color="#c85a4a"/></radialGradient>
 <linearGradient id="kRojo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5466"/><stop offset=".5" stop-color="#d3172f"/><stop offset="1" stop-color="#7e0716"/></linearGradient>
 <linearGradient id="kRojoV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f03a4f"/><stop offset="1" stop-color="#9a0f22"/></linearGradient>
 <radialGradient id="kPel" cx=".38" cy=".3" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#eef3f8"/><stop offset="1" stop-color="#b9c9d8"/></radialGradient>
 <linearGradient id="kBarba" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#eef3f8"/><stop offset="1" stop-color="#cfdae4"/></linearGradient>
 <linearGradient id="kOro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b8"/><stop offset=".45" stop-color="#e8b43a"/><stop offset="1" stop-color="#8a5a08"/></linearGradient>
 <linearGradient id="kOroH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a6a1c"/><stop offset=".5" stop-color="#fff1b8"/><stop offset="1" stop-color="#9a7420"/></linearGradient>
 <radialGradient id="kPlata" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c9d4de"/><stop offset="1" stop-color="#5a6c80"/></radialGradient>
 <radialGradient id="kCafe" cx=".4" cy=".3" r=".85"><stop offset="0" stop-color="#b98058"/><stop offset=".65" stop-color="#8a5634"/><stop offset="1" stop-color="#5e3820"/></radialGradient>
 <radialGradient id="kHocico" cx=".45" cy=".35" r=".8"><stop offset="0" stop-color="#f1d2b2"/><stop offset="1" stop-color="#c99a72"/></radialGradient>
 <radialGradient id="kNariz" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ff9a9a"/><stop offset=".45" stop-color="#e3101e"/><stop offset="1" stop-color="#6e0010"/></radialGradient>
 <radialGradient id="kLuzR" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff5a5a" stop-opacity=".85"/><stop offset=".35" stop-color="#ff7a50" stop-opacity=".35"/><stop offset="1" stop-color="#ff7a50" stop-opacity="0"/></radialGradient>
 <radialGradient id="kLuzO" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe7a0" stop-opacity=".9"/><stop offset=".35" stop-color="#ffd27a" stop-opacity=".35"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
 <radialGradient id="kLuzF" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#d8ecff" stop-opacity=".9"/><stop offset=".35" stop-color="#bfe0ff" stop-opacity=".3"/><stop offset="1" stop-color="#bfe0ff" stop-opacity="0"/></radialGradient>
 <radialGradient id="kCarbon" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#5a5f6a"/><stop offset=".6" stop-color="#2a2d34"/><stop offset="1" stop-color="#121418"/></radialGradient>
 <radialGradient id="kGall" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#e3a165"/><stop offset=".6" stop-color="#b4692f"/><stop offset="1" stop-color="#7c4119"/></radialGradient>
 <pattern id="kRaya" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="rgba(255,255,255,0)"/><rect width="4" height="10" fill="rgba(255,255,255,.12)"/></pattern>
 <radialGradient id="kOreja" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#f7c8a6"/><stop offset="1" stop-color="#d98d6a"/></radialGradient>
 <linearGradient id="kBarbaS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="rgba(140,160,185,.35)"/><stop offset=".3" stop-color="rgba(140,160,185,0)"/><stop offset=".7" stop-color="rgba(140,160,185,0)"/><stop offset="1" stop-color="rgba(140,160,185,.4)"/></linearGradient>
 <filter id="kSom" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#2a0a00" flood-opacity=".35"/></filter>
 <filter id="kSomS" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#2a0a00" flood-opacity=".35"/></filter>
</defs>`;
// ── piezas ilustradas ──
const nube=(pts,f)=>pts.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`).join('');
// Santa (cabeza, centro de la cara en 0,0). Mismo dibujo que el de la lista de «¡Listo, guardado!»: la banda de piel
// abraza la frente siguiendo la curva de la cabeza, la punta del gorro cae a un lado con su pompón, mechones de pelo
// sobre las orejas, barba con rizos y bigote de dos lóbulos. Las piezas con id (ojos, cejas, boca, enojo) las anima la escena.
function santaSVG(){ return `
 <g id="sCab">
  <!-- punta del gorro que cae por detrás a la derecha -->
  <path d="M-30 -20 C-30 -50 -8 -68 16 -66 C38 -64 54 -50 58 -30 C61 -18 60 -6 56 4 C52 -6 46 -14 38 -18 C34 -20 30 -22 28 -22 Z" fill="url(#kRojo)"/>
  <path d="M30 -60 C44 -52 54 -38 56 -18" stroke="rgba(70,0,10,.28)" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M-18 -52 C-8 -60 6 -64 18 -62" stroke="rgba(255,255,255,.28)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <g id="sPom" filter="url(#kSomS)">${nube([[56,8,10],[50,3,5],[62,3,5],[63,12,5],[49,13,5],[56,16,5]],'url(#kPel)')}</g>
  <!-- pelo blanco a los lados y orejas -->
  ${nube([[-29,-4,7],[-32,5,7],[-30,14,6],[29,-4,7],[32,5,7],[30,14,6]],'url(#kPel)')}
  <ellipse cx="-26" cy="6" rx="5.5" ry="8" fill="url(#kOreja)"/><ellipse cx="26" cy="6" rx="5.5" ry="8" fill="url(#kOreja)"/>
  <!-- cara -->
  <ellipse cx="0" cy="3" rx="24" ry="26" fill="url(#kPiel)"/>
  <!-- barba frondosa con rizos -->
  <g filter="url(#kSomS)">
   <path d="M-27 4 C-36 22 -34 46 -22 62 C-14 72 -6 78 0 80 C6 78 14 72 22 62 C34 46 36 22 27 4 C25 14 19 21 11 23 C5 24 -5 24 -11 23 C-19 21 -25 14 -27 4 Z" fill="url(#kBarba)"/>
   <path d="M-27 4 C-36 22 -34 46 -22 62 C-14 72 -6 78 0 80 C6 78 14 72 22 62 C34 46 36 22 27 4 C25 14 19 21 11 23 C5 24 -5 24 -11 23 C-19 21 -25 14 -27 4 Z" fill="url(#kBarbaS)"/>
   ${nube([[-28,46,7],[-22,58,8],[-12,68,8],[0,73,8],[12,68,8],[22,58,8],[28,46,7]],'url(#kBarba)')}
  </g>
  <g stroke="rgba(150,170,195,.55)" stroke-width="1.3" fill="none" stroke-linecap="round"><path d="M-22 30 q4 6 0 12 M-12 34 q4 7 0 14 M0 36 q4 8 0 16 M12 34 q-4 7 0 14 M22 30 q-4 6 0 12 M-16 52 q3 5 0 10 M6 54 q3 5 0 10 M-4 60 q3 5 0 9"/></g>
  <circle cx="-14" cy="10" r="8" fill="url(#kMej)"/><circle cx="14" cy="10" r="8" fill="url(#kMej)"/>
  <ellipse id="sRubor" cx="0" cy="4" rx="23" ry="19" fill="#ff3a3a" opacity="0"/>
  <!-- ojos: abiertos, felices, guiño y entrecerrados de enojo -->
  <g id="sOjoA"><ellipse cx="-9.5" cy="1" rx="2.7" ry="3.4" fill="#2e1c12"/><ellipse cx="9.5" cy="1" rx="2.7" ry="3.4" fill="#2e1c12"/><circle cx="-8.6" cy="-.3" r="1.05" fill="#fff"/><circle cx="10.4" cy="-.3" r="1.05" fill="#fff"/></g>
  <g id="sOjoF" opacity="0"><path d="M-13.5 2 Q-9.5 -3 -5.5 2" stroke="#2e1c12" stroke-width="2.1" fill="none" stroke-linecap="round"/><path d="M5.5 2 Q9.5 -3 13.5 2" stroke="#2e1c12" stroke-width="2.1" fill="none" stroke-linecap="round"/></g>
  <g id="sGuino" opacity="0"><ellipse cx="-9.5" cy="1" rx="2.7" ry="3.4" fill="#2e1c12"/><circle cx="-8.6" cy="-.3" r="1.05" fill="#fff"/><path d="M5.5 2 Q9.5 -2 13.5 2" stroke="#2e1c12" stroke-width="2.1" fill="none" stroke-linecap="round"/></g>
  <g id="sOjoM" opacity="0"><path d="M-14.5 -3.4 L-4.6 .4 L-4.6 -4.2 L-14.5 -4.2 Z" fill="url(#kPiel)"/><path d="M14.5 -3.4 L4.6 .4 L4.6 -4.2 L14.5 -4.2 Z" fill="url(#kPiel)"/><path d="M-14.5 -3.4 L-4.6 .4 M14.5 -3.4 L4.6 .4" stroke="#2e1c12" stroke-width="1.3" stroke-linecap="round"/></g>
  <!-- lentes sobre la nariz -->
  <g fill="rgba(255,255,255,.12)" stroke="#c9952a" stroke-width="1.3"><ellipse cx="-9.5" cy="2" rx="6.4" ry="5.6"/><ellipse cx="9.5" cy="2" rx="6.4" ry="5.6"/></g>
  <path d="M-3.1 1.5 Q0 -.6 3.1 1.5" stroke="#c9952a" stroke-width="1.3" fill="none"/><path d="M-15.9 1 L-23 -1 M15.9 1 L23 -1" stroke="#c9952a" stroke-width="1.1"/>
  <path d="M-14 -1 L-11.5 -2.6" stroke="rgba(255,255,255,.85)" stroke-width="1.1" stroke-linecap="round"/><path d="M5 -1 L7.5 -2.6" stroke="rgba(255,255,255,.85)" stroke-width="1.1" stroke-linecap="round"/>
  <!-- cejas pobladas -->
  <g id="sCejas"><g id="sCejaI">${nube([[-15,-7,3],[-11.5,-8.6,3.4],[-7.5,-8,3],[-4.8,-6.8,2.2]],'url(#kPel)')}</g><g id="sCejaD">${nube([[15,-7,3],[11.5,-8.6,3.4],[7.5,-8,3],[4.8,-6.8,2.2]],'url(#kPel)')}</g></g>
  <!-- boca (bajo el bigote): abierta al hablar, hacia abajo cuando se molesta -->
  <g id="sBoca"><ellipse cx="0" cy="23" rx="5" ry="3.8" fill="#6e1420"/><ellipse cx="0" cy="25" rx="3.2" ry="1.6" fill="#e8607a"/></g>
  <g id="sBocaM" opacity="0"><path d="M-6 29 Q0 24 6 29" stroke="#6e1420" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>
  <!-- bigote de dos lóbulos -->
  <g filter="url(#kSomS)">
   <path d="M0 15 C-5 11 -15 10 -23 15 C-28 18 -30 24 -26 27 C-24 22 -18 20 -12 21 C-6 22 -2 21 0 19 Z" fill="url(#kBarba)"/>
   <path d="M0 15 C5 11 15 10 23 15 C28 18 30 24 26 27 C24 22 18 20 12 21 C6 22 2 21 0 19 Z" fill="url(#kBarba)"/>
   <path d="M-4 16 C-10 14 -17 15 -22 19 M4 16 C10 14 17 15 22 19" stroke="rgba(150,170,195,.5)" stroke-width="1" fill="none"/>
  </g>
  <ellipse cx="0" cy="11" rx="5.2" ry="4.6" fill="url(#kNar)"/><ellipse cx="-1.7" cy="9.4" rx="1.6" ry="1.05" fill="rgba(255,255,255,.85)"/>
  <!-- banda de piel que abraza la frente -->
  <g filter="url(#kSomS)">
   <path d="M-34 -10 C-30 -27 30 -27 34 -10 C35 -3 31 0 27 -3 C17 -11 -17 -11 -27 -3 C-31 0 -35 -3 -34 -10 Z" fill="url(#kPel)"/>
   ${nube([[-31,-12,4.6],[-24,-19,5],[-15,-22.5,5],[-5,-24,5],[5,-24,5],[15,-22.5,5],[24,-19,5],[31,-12,4.6],[-29,-4,4],[29,-4,4]],'url(#kPel)')}
   <path d="M-26 -6 C-14 -13 14 -13 26 -6" stroke="rgba(150,170,195,.45)" stroke-width="1.2" fill="none"/>
  </g>
  <!-- marquita de enojo junto al gorro -->
  <g id="sVena" opacity="0"><g transform="translate(-34 -30)"><path d="M-6 -2 Q-2 -2 -2 -6 M2 -6 Q2 -2 6 -2 M6 2 Q2 2 2 6 M-2 6 Q-2 2 -6 2" stroke="#e3101e" stroke-width="2.6" fill="none" stroke-linecap="round"/></g></g>
 </g>`; }
function manopla(){ return `<path d="M-9 -2 C-12 -12 -6 -18 0 -16 C4 -20 11 -16 10 -8 C14 -6 14 2 9 5 L-6 6 C-11 5 -12 2 -9 -2 Z" fill="url(#kRojo)"/><path d="M-8 -6 C-12 -8 -14 -3 -10 1" stroke="#9a0f22" stroke-width="2" fill="none"/><rect x="-11" y="4" width="22" height="9" rx="4.5" fill="url(#kPel)"/>`; }
function regalito(){ return `<g filter="url(#kSomS)"><rect x="-12" y="-14" width="24" height="18" rx="2.5" fill="url(#kRojoV)"/><rect x="-12" y="-14" width="24" height="18" rx="2.5" fill="url(#kRaya)"/><rect x="-14" y="-18" width="28" height="6" rx="2" fill="#ff5466"/><rect x="-2.2" y="-18" width="4.4" height="22" fill="url(#kOroH)"/><path d="M0 -18 C-6 -27 -14 -26 -12 -20 C-11 -17 -5 -17 0 -18 Z M0 -18 C6 -27 14 -26 12 -20 C11 -17 5 -17 0 -18 Z" fill="url(#kOro)" stroke="rgba(120,80,10,.4)" stroke-width=".6"/><circle cx="0" cy="-18" r="2.4" fill="#e0b048"/></g>`; }
function reloj(){ return `<g filter="url(#kSomS)"><path d="M0 -15 C0 -26 10 -30 14 -24" stroke="#c9952a" stroke-width="1.4" fill="none" stroke-dasharray="2 1.4"/><circle cx="0" cy="0" r="13" fill="url(#kOro)"/><circle cx="0" cy="0" r="10.4" fill="#fffaf0" stroke="#b07a18" stroke-width="1"/>${Array.from({length:12},(_,i)=>{const a=i/12*Math.PI*2;return `<line x1="${(Math.cos(a)*8.6).toFixed(1)}" y1="${(Math.sin(a)*8.6).toFixed(1)}" x2="${(Math.cos(a)*(i%3?9.4:7.8)).toFixed(1)}" y2="${(Math.sin(a)*(i%3?9.4:7.8)).toFixed(1)}" stroke="#5a3a10" stroke-width="${i%3?.6:1}"/>`;}).join('')}<line id="rH" x1="0" y1="0" x2="0" y2="-5.4" stroke="#3a2010" stroke-width="1.6" stroke-linecap="round"/><line id="rM" x1="0" y1="0" x2="0" y2="-8" stroke="#3a2010" stroke-width="1.1" stroke-linecap="round"/><circle r="1.2" fill="#b07a18"/><rect x="-2.5" y="-16.5" width="5" height="4" rx="1" fill="url(#kOroH)"/><g id="rTapa"><ellipse cx="0" cy="0" rx="13" ry="13" fill="url(#kOro)"/><circle cx="0" cy="0" r="8" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1"/><path d="M-3 -4 l1.4 2.8 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z" fill="rgba(120,80,10,.35)" transform="translate(3 2)"/></g></g>`; }
function burbuja(txt,w,borde='#e8c98a'){ return `<g filter="url(#kSom)"><rect x="${-w/2}" y="-17" width="${w}" height="30" rx="15" fill="#fffdf6" stroke="${borde}" stroke-width="${borde==='#e8c98a'?1.2:2}"/><path d="M${-w/2+18} 12 l-8 10 l16 -10" fill="#fffdf6" stroke="${borde}" stroke-width="${borde==='#e8c98a'?1.2:2}" stroke-linejoin="round"/><rect x="${-w/2+9}" y="9" width="20" height="5" fill="#fffdf6"/></g><text x="0" y="3.5" text-anchor="middle" font-family="'Plus Jakarta Sans',system-ui,sans-serif" font-weight="800" font-size="13" fill="#b3192d">${txt}</text>`; }
const chispasSVG=n=>Array.from({length:n},(_,i)=>`<g class="ch"><path d="M0 -5 L1.2 -1.2 L5 0 L1.2 1.2 L0 5 L-1.2 1.2 L-5 0 L-1.2 -1.2 Z" fill="#ffe7a0"/></g>`).join('');

const reducido=()=>!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
let serie=0;
// cada copia lleva sus propios id (dos adornos en la misma tarjeta, o la escena encima)
function propio(html){ serie++; const k='_c'+serie; return html.replace(/id="(\w+)"/g,'id="$1'+k+'"').replace(/url\(#(\w+)\)/g,'url(#$1'+k+')'); }
function angulos(hora){ const m=/(\d{1,2}):(\d{2})/.exec(hora||''); const h=m?+m[1]:7, mi=m?+m[2]:0; return {aH:(h%12)*30+mi*.5, aM:mi*6}; }
function relojFijo(hora){ const {aH,aM}=angulos(hora); return reloj().replace('id="rH"',`id="rH" transform="rotate(${aH})"`).replace('id="rM"',`id="rM" transform="rotate(${aM})"`).replace('<g id="rTapa">','<g id="rTapa" opacity="0">'); }

// Adorno del punto: el regalito (a tiempo) o el reloj de bolsillo abierto con la hora (tarde)
export function adornoSantaNV(tono,hora){
  const mal=tono==='mal';
  return propio(`<svg viewBox="${mal?'-23 -25 46 46':'-22 -28 44 44'}" width="44" height="44" aria-hidden="true">${DEFS}${mal?relojFijo(hora):regalito()}</svg>`);
}

// Escena sobre la tarjeta recién marcada. cual: 'entrada' | 'salida'. Devuelve { detener }.
export function escenaSantaNV(card,pt,{tarde=false,hora='',cual='entrada'}={}){
  const nada={detener(){}};
  if(!card||!pt||reducido()) return nada;
  const dotEl=pt.querySelector('.mk3-dot'); if(!dotEl) return nada;
  card.querySelectorAll(':scope>.nvc-mk-santa').forEach(e=>e.remove());
  card.classList.add('nvc-con-santa'); pt.classList.add('nvc-espera');
  const mal=!!tarde, cr=card.getBoundingClientRect(), dr=dotEl.getBoundingClientRect();
  const M=150, W=Math.round(cr.width+32), H=Math.round(cr.height+M+24);
  const dot={x:dr.left+dr.width/2-cr.left+16, y:dr.top+dr.height/2-cr.top+M};
  const sv=document.createElementNS(NS,'svg'); sv.setAttribute('class','nvc-mk-santa'); sv.setAttribute('aria-hidden','true');
  sv.setAttribute('viewBox',`0 0 ${W} ${H}`); sv.setAttribute('width',W); sv.setAttribute('height',H);
  sv.style.cssText=`left:-16px;top:${-M}px;width:${W}px;height:${H}px`;
  const frase=mal?(cual==='salida'?'¡Ejem! Saliste antes':'¡Ejem! Llegaste tarde'):'¡Jo, jo, jo!';
  const sx=Math.min(W*.62,W-70);
  sv.innerHTML=propio(DEFS+`<clipPath id="kDetras"><rect x="0" y="-400" width="${W}" height="${M+400+1}"/></clipPath>
   <g clip-path="url(#kDetras)"><g id="sant">${santaSVG()}</g></g>
   <g id="vuela">${mal?reloj():regalito()}</g>
   <g id="brazo"><g id="mano"><g transform="translate(0 -6)">${manopla()}</g></g></g>
   <g id="enPunto">${mal?reloj():regalito()}</g>
   <g id="luzP"><circle r="34" fill="url(#${mal?'kLuzR':'kLuzO'})"/></g>
   <g id="chis">${chispasSVG(10)}</g>
   <g id="burb">${burbuja(frase,mal?176:110,mal?'#e3263c':'#e8c98a')}</g>`);
  card.appendChild(sv);
  const $=id=>sv.querySelector('[id^="'+id+'_c"]'), tf=(el,x,y,s=1,r=0)=>{ if(el) el.setAttribute('transform',`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${r.toFixed(2)}) scale(${s.toFixed(3)})`); }, op=(el,a)=>{ if(el) el.setAttribute('opacity',cl(a).toFixed(3)); };
  const ch=[...sv.querySelectorAll('[id^="chis_c"] .ch')], {aH,aM}=angulos(hora);
  let revelado=false;
  const revelar=()=>{ if(revelado) return; revelado=true; pt.classList.remove('nvc-espera'); };
  function cuadro(t){
    const sube=back(seg(t,0,.6),1.4), baja=eIn(seg(t,3.25,3.75)), bob=Math.sin(t*2.4)*1.6, risa=!mal&&(t>1.9&&t<2.9)?Math.abs(Math.sin((t-1.9)*Math.PI*3))*2.6:0;
    const sy=lerp(M+86,M-30,sube)+baja*120+bob-risa, rot=Math.sin(t*1.7)*(mal?1:3)+(mal&&t>2.0&&t<2.6?Math.sin((t-2.0)*26)*7*(1-seg(t,2.0,2.6)):0);
    tf($('sant'),sx,sy,1.05,rot);
    // la cara
    const parp=(t>.75&&t<.85)||(t>2.95&&t<3.05), feliz=!mal&&t>1.9&&t<2.9, guino=!mal&&t>3.0&&t<3.25;
    op($('sOjoA'),parp||feliz||guino?0:1); op($('sOjoF'),feliz||parp?1:0); op($('sGuino'),guino?1:0);
    const b=$('sBoca');
    if(!mal){ const habla=(t>1.9&&t<2.85)?.4+.6*Math.abs(Math.sin((t-1.9)*Math.PI*3.2)):.12; b.setAttribute('transform',`translate(0 ${23*(1-habla)}) scale(1 ${habla.toFixed(3)})`); }
    else { const en=seg(t,1.45,1.7)*(1-seg(t,3.3,3.6));   // se molesta al ver la hora
      op($('sOjoM'),en); op($('sBocaM'),en*(t>2.0&&t<2.9?0:1)); op($('sRubor'),en*.16);
      $('sCejaI').setAttribute('transform',`translate(0 ${(en*3.5).toFixed(2)}) rotate(${(en*20).toFixed(1)} -10 -8)`); $('sCejaD').setAttribute('transform',`translate(0 ${(en*3.5).toFixed(2)}) rotate(${(-en*20).toFixed(1)} 10 -8)`);
      const vena=seg(t,1.7,1.85); op($('sVena'),vena*(1-seg(t,3.3,3.5))); $('sVena').setAttribute('transform',`scale(${(1+.18*Math.abs(Math.sin(t*9))*vena).toFixed(3)})`);
      const habla=(t>2.0&&t<2.9)?.35+.4*Math.abs(Math.sin((t-2.0)*Math.PI*3.4)):0; op(b,habla>0?1:0); b.setAttribute('transform',`translate(0 ${23*(1-habla)}) scale(1 ${Math.max(.01,habla).toFixed(3)})`); }
    tf($('sPom'),Math.sin(t*5)*1.2,Math.abs(Math.sin(t*5))*-1.2);
    // la manopla junto a la cara con el regalo (o el reloj) y el lanzamiento al punto
    const mx=sx-44, my=sy+34, sale=back(seg(t,.7,1.0)), adios=1-seg(t,mal?3.0:2.6,mal?3.25:2.85);
    const golpe=mal&&t>1.95&&t<2.3?Math.abs(Math.sin((t-1.95)*Math.PI*5.7))*5:0, saludo=!mal&&t>1.75&&t<2.6?Math.sin((t-1.75)*14)*14:0;
    tf($('mano'),mx,my+(1-sale)*30-golpe,1.05,-10+saludo); op($('brazo'),t>.7?adios:0);
    const t0=mal?2.3:1.15, t1=mal?2.9:1.75, u=seg(t,t0,t1), arc=eIO(u);
    const ix=lerp(mx+2,dot.x,arc), iy=lerp(my-16,dot.y+(mal?2:6),arc)-Math.sin(u*Math.PI)*(mal?40:70);
    op($('vuela'),t>.7&&t<t1?1:0); tf($('vuela'),ix+golpe*.6,iy+(1-sale)*30-golpe,1,mal?Math.sin(u*Math.PI)*15+golpe*2:u*360);
    op($('enPunto'),t>=t1?1:0); tf($('enPunto'),dot.x,dot.y+(mal?2:6),(mal?.95:1.05)+(t>t1?.08*Math.exp(-(t-t1)*8)*Math.sin((t-t1)*30):0));
    op($('luzP'),seg(t,t1,t1+.2)*(1-seg(t,t1+.8,t1+1.6)*.7)*(mal?.8:1)); tf($('luzP'),dot.x,dot.y-2,1);
    ch.forEach((c,i)=>{ if(mal){ op(c,0); return; } const v=seg(t,t1+.03,t1+.93), a=i/ch.length*Math.PI*2+.3, d=34*eOut(v); tf(c,dot.x+Math.cos(a)*d,dot.y-4+Math.sin(a)*d-v*6,(1-v)*(i%2?.8:1.1),v*90); op(c,v>0&&v<1?1-v*.8:0); });
    if(mal){ const tapa=seg(t,1.15,1.35); sv.querySelectorAll('[id^="rTapa"]').forEach(e=>e.setAttribute('transform',`scale(1 ${(1-tapa*.92).toFixed(3)}) translate(0 ${(-tapa*13).toFixed(2)})`));
      const giro=eOut(seg(t,1.3,1.85)); sv.querySelectorAll('[id^="rM"]').forEach(e=>e.setAttribute('transform',`rotate(${(giro*(360+aM)).toFixed(1)})`)); sv.querySelectorAll('[id^="rH"]').forEach(e=>e.setAttribute('transform',`rotate(${(giro*aH).toFixed(1)})`)); }
    // la burbuja
    const bb=mal?back(seg(t,1.95,2.25))*(1-seg(t,3.15,3.35)):back(seg(t,1.95,2.2))*(1-seg(t,3.0,3.2)); op($('burb'),bb>0?1:0); tf($('burb'),Math.max(mal?92:60,sx+(mal?-80:-74)),sy-74,Math.max(.001,bb));
    if(t>(mal?3.0:2.0)) revelar();
  }
  let raf=0, parado=false; const t0=performance.now();
  const detener=()=>{ if(parado) return; parado=true; if(raf) cancelAnimationFrame(raf); sv.remove(); revelar(); };
  (function paso(n){ raf=0; if(parado) return; if(!sv.isConnected){ detener(); return; } const t=(n-t0)/1000; if(t>=3.8){ detener(); return; } cuadro(Math.max(0,t)); raf=requestAnimationFrame(paso); })(t0);
  return {detener};
}

// ── Login de Navidad en casa: Santa también avisa del PIN equivocado y da la bienvenida (los llama js/navidad.js) ──
//  · error(form): la tarjeta tiembla; Santa se asoma por detrás de ella con el ceño fruncido, niega con la mano y dice
//    «Mmm… ese PIN no es». · bienvenida(nombre): ya adentro, Santa sale desde la esquina de abajo, saluda con la mano,
//    dice «¡Hola, <nombre>!» y guiña. Ninguna bloquea los toques. Con movimiento reducido no hay escenas.
function correrNV(dur,f,fin){ const t0=performance.now(); let raf=0; (function p(n){ const t=(n-t0)/1000; f(Math.min(t,dur)); if(t<dur) raf=requestAnimationFrame(p); else fin&&fin(); })(t0); return ()=>{ cancelAnimationFrame(raf); fin&&fin(); }; }
function svgSanta(W,H,html){ const sv=document.createElementNS(NS,'svg'); sv.setAttribute('viewBox',`0 0 ${W} ${H}`); sv.setAttribute('width',W); sv.setAttribute('height',H); sv.setAttribute('aria-hidden','true'); sv.innerHTML=propio(DEFS+html); return sv; }
const $q=(sv,id)=>sv.querySelector('[id^="'+id+'_c"]');
const tfq=(el,x,y,s=1,r=0)=>{ if(el) el.setAttribute('transform',`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${r.toFixed(2)}) scale(${s.toFixed(3)})`); }, opq=(el,a)=>{ if(el) el.setAttribute('opacity',cl(a).toFixed(3)); };
let errorActivo=null;
function errorLoginNV(form){
  if(!form||reducido()) return;
  if(form.animate) form.animate([{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(-4px)'},{transform:'translateX(3px)'},{transform:'translateX(0)'}],{duration:480,easing:'ease-out'});
  if(errorActivo) errorActivo();
  const M=140, W=form.offsetWidth, sx=Math.min(W*.74,W-56);
  const sv=svgSanta(W,M+10,`<clipPath id="kDetras"><rect x="-300" y="-400" width="${W+600}" height="${M+400}"/></clipPath><g clip-path="url(#kDetras)"><g id="sant">${santaSVG()}</g></g><g id="mano"><g transform="translate(0 -6)">${manopla()}</g></g><g id="burb">${burbuja('Mmm… ese PIN no es',168,'#e3263c')}</g>`);
  sv.setAttribute('class','nvc-login-santa'); sv.style.cssText=`left:0;top:${-M}px`; form.appendChild(sv);
  errorActivo=correrNV(2.6,t=>{
    const sube=back(seg(t,0,.45),1.3), baja=eIn(seg(t,2.15,2.55)), y=lerp(M+80,M-24,sube)+baja*110, no=t>.5&&t<1.7?Math.sin((t-.5)*16)*6:0;
    tfq($q(sv,'sant'),sx,y,.92,no*.6);
    const en=seg(t,.35,.55), habla=t>.7&&t<1.6;
    opq($q(sv,'sOjoM'),en*.85); opq($q(sv,'sBocaM'),habla?0:en); const b=$q(sv,'sBoca'); opq(b,habla?1:0);
    const h=habla?.3+.4*Math.abs(Math.sin((t-.7)*11)):.01; b.setAttribute('transform',`translate(0 ${(23*(1-h)).toFixed(2)}) scale(1 ${h.toFixed(3)})`);
    $q(sv,'sCejaI').setAttribute('transform',`translate(0 ${(en*2.5).toFixed(2)}) rotate(${(en*14).toFixed(1)} -10 -8)`); $q(sv,'sCejaD').setAttribute('transform',`translate(0 ${(en*2.5).toFixed(2)}) rotate(${(-en*14).toFixed(1)} 10 -8)`);
    const ms=back(seg(t,.4,.65)); tfq($q(sv,'mano'),sx-48,y+28+(1-ms)*40,1,t<1.9?Math.sin(t*14)*22:0); opq($q(sv,'mano'),seg(t,.4,.5)*(1-seg(t,1.95,2.15)));
    const bb=back(seg(t,.65,.9))*(1-seg(t,1.95,2.15)); opq($q(sv,'burb'),bb>0?1:0); tfq($q(sv,'burb'),Math.max(90,sx-84),y-66,Math.max(.001,bb));
  },()=>{ sv.remove(); errorActivo=null; });
}
function bienvenidaNV(nombre){
  if(reducido()) return;
  const W=innerWidth, H=innerHeight, sx=W-70, txt=nombre?'¡Hola, '+nombre+'!':'¡Hola!', bw=Math.max(96,txt.length*8.6+30);
  const sv=svgSanta(W,H,`<g id="sant">${santaSVG()}</g><g id="mano"><g transform="translate(0 -6)">${manopla()}</g></g><g id="burb">${burbuja(txt.replace(/[&<>"]/g,''),bw)}</g>`);
  sv.setAttribute('class','nvc-bienvenida-santa'); document.body.appendChild(sv);
  correrNV(2.3,t=>{
    const sube=back(seg(t,0,.45),1.4), baja=eIn(seg(t,1.85,2.25)), y=lerp(H+70,H-58,sube)+baja*140;
    tfq($q(sv,'sant'),sx,y,1.1,-12+Math.sin(t*2)*3);
    const feliz=t>.5&&t<1.6, guino=t>1.6&&t<1.85; opq($q(sv,'sOjoA'),feliz||guino?0:1); opq($q(sv,'sOjoF'),feliz?1:0); opq($q(sv,'sGuino'),guino?1:0);
    const h=feliz?.4+.5*Math.abs(Math.sin((t-.5)*10)):.12; $q(sv,'sBoca').setAttribute('transform',`translate(0 ${(23*(1-h)).toFixed(2)}) scale(1 ${h.toFixed(3)})`);
    tfq($q(sv,'mano'),sx-58,y-6+(1-back(seg(t,.3,.55)))*40,1.15,-20+Math.sin(t*13)*24); opq($q(sv,'mano'),seg(t,.3,.4)*(1-seg(t,1.8,1.95)));
    const bb=back(seg(t,.45,.7))*(1-seg(t,1.75,1.95)); opq($q(sv,'burb'),bb>0?1:0); tfq($q(sv,'burb'),Math.min(sx-70,W-12-bw/2),y-82,Math.max(.001,bb));
  },()=>sv.remove());
}
window.__nvSantaLogin={error:errorLoginNV,bienvenida:bienvenidaNV};
