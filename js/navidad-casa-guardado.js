// ── Navidad en casa (22–27 dic): «¡Listo, guardado!» · Santa lo anota en su lista ──
// Lo usa mostrarGuardadoOK en index.html. Solo dibuja; no toca cómo se guarda el registro.
// Escena: una sala cálida (guirnalda de foquitos y brillo de la chimenea). Santa, de medio cuerpo, sostiene su
// «Lista de Santa» por el rodillo de arriba; la lista se desenrolla, una pluma de ganso escribe el primer nombre de
// quien guardó en cursiva (trazo por trazo, con las tildes al final), pone la palomita roja y cae el sello de lacre.
// Santa asiente, se ríe y guiña; al terminar se llama alTexto() para mostrar el texto y los datos.
// Con movimiento reducido no hay animación: sale la lista ya escrita y sellada.
//
// Letra cursiva: Hershey Script 1-stroke (trazos de un solo hilo, solo A–Z y a–z; las tildes y la ñ se agregan aquí).
//   The Hershey Fonts were originally created by Dr. A. V. Hershey while working at the U. S. National Bureau of
//   Standards. The format of the Font data in this distribution was originally created by James Hurt, Cognition, Inc.,
//   900 Technology Park Drive, Billerica, MA 01821. Conversión a SVG: Windell H. Oskay (evilmadscientist.com), vía
//   el paquete hersheytext (MIT).
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)), seg=(t,a,b)=>cl((t-a)/(b-a)), lerp=(a,b,t)=>a+(b-a)*t;
const eOut=t=>1-Math.pow(1-cl(t),3), eIn=t=>Math.pow(cl(t),2.2), eIO=t=>{t=cl(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
const back=(t,c=1.7)=>{t=cl(t);return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);};
const P=Math.PI*2;
const rnd=s=>()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};
const fluff=(pts,f)=>pts.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`).join('');
const DEFS2=`<defs>
 <radialGradient id="gPiel" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="#ffe9d8"/><stop offset=".65" stop-color="#f6c3a0"/><stop offset="1" stop-color="#e29b78"/></radialGradient>
 <radialGradient id="gOreja" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#f7c8a6"/><stop offset="1" stop-color="#d98d6a"/></radialGradient>
 <radialGradient id="gMej" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff6f7e" stop-opacity=".7"/><stop offset="1" stop-color="#ff6f7e" stop-opacity="0"/></radialGradient>
 <radialGradient id="gNar" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffc0b0"/><stop offset=".55" stop-color="#ee7d6c"/><stop offset="1" stop-color="#c25544"/></radialGradient>
 <linearGradient id="gRojo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4475a"/><stop offset=".5" stop-color="#cc1a30"/><stop offset="1" stop-color="#7a0818"/></linearGradient>
 <linearGradient id="gRojoS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a0c1e"/><stop offset=".35" stop-color="#d42136"/><stop offset=".7" stop-color="#b8152b"/><stop offset="1" stop-color="#6a0614"/></linearGradient>
 <radialGradient id="gPel" cx=".4" cy=".3" r=".85"><stop offset="0" stop-color="#ffffff"/><stop offset=".65" stop-color="#f1f5f9"/><stop offset="1" stop-color="#c3cfdb"/></radialGradient>
 <linearGradient id="gBarba" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f2f5f8"/><stop offset="1" stop-color="#cdd8e2"/></linearGradient>
 <linearGradient id="gBarbaS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="rgba(140,160,185,.35)"/><stop offset=".3" stop-color="rgba(140,160,185,0)"/><stop offset=".7" stop-color="rgba(140,160,185,0)"/><stop offset="1" stop-color="rgba(140,160,185,.4)"/></linearGradient>
 <linearGradient id="gOro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c2"/><stop offset=".45" stop-color="#e3ad38"/><stop offset="1" stop-color="#7f5206"/></linearGradient>
 <linearGradient id="gOroH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a6a1c"/><stop offset=".5" stop-color="#fff1b8"/><stop offset="1" stop-color="#9a7420"/></linearGradient>
 <linearGradient id="gPapel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9d7ad"/><stop offset=".07" stop-color="#f8edd2"/><stop offset=".5" stop-color="#fdf6e3"/><stop offset=".93" stop-color="#f8edd2"/><stop offset="1" stop-color="#e2cc9c"/></linearGradient>
 <linearGradient id="gRodillo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e6bf"/><stop offset=".45" stop-color="#e3cd96"/><stop offset="1" stop-color="#b89a5c"/></linearGradient>
 <linearGradient id="gMadera" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a5643a"/><stop offset=".5" stop-color="#7a4222"/><stop offset="1" stop-color="#4e2812"/></linearGradient>
 <radialGradient id="gLacre" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#ff6b78"/><stop offset=".55" stop-color="#c3132b"/><stop offset="1" stop-color="#6a0412"/></radialGradient>
 <linearGradient id="gPluma" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf8"/><stop offset=".55" stop-color="#e6dccb"/><stop offset="1" stop-color="#b9a585"/></linearGradient>
 <linearGradient id="gPunta" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d6420"/><stop offset=".5" stop-color="#f6e2a0"/><stop offset="1" stop-color="#8a6a1c"/></linearGradient>
 <filter id="gSom" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#1a0500" flood-opacity=".38"/></filter>
 <filter id="gSomS" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.4" flood-color="#2a0a00" flood-opacity=".3"/></filter>
 <filter id="gTinta" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation=".25"/></filter>
</defs>`;

// Santa de medio cuerpo: (0,0) es el centro de la cara. Sostiene el rodillo de la lista con las dos manos en y≈124.
function santaMedio(){ return `
 <g id="sCuerpo" filter="url(#gSom)">
  <!-- saco -->
  <path d="M-70 170 C-74 118 -66 76 -34 60 L34 60 C66 76 74 118 70 170 Z" fill="url(#gRojo)"/>
  <path d="M-40 66 C-56 78 -62 100 -63 124" stroke="rgba(255,255,255,.16)" stroke-width="5" fill="none" stroke-linecap="round"/>
  <rect x="-9" y="66" width="18" height="104" fill="url(#gPel)"/>
  <rect x="-70" y="140" width="140" height="16" fill="#1c1310"/><rect x="-13" y="136" width="26" height="24" rx="3" fill="none" stroke="url(#gOroH)" stroke-width="4.5"/>
  <!-- mangas hacia el frente -->
  <path d="M-44 66 C-70 74 -84 96 -86 118 L-62 124 C-60 106 -52 92 -40 84 Z" fill="url(#gRojoS)"/>
  <path d="M44 66 C70 74 84 96 86 118 L62 124 C60 106 52 92 40 84 Z" fill="url(#gRojoS)"/>
 </g>
 <g id="sCabeza">
  <!-- punta del gorro que cae por detrás a la derecha -->
  <path d="M-30 -20 C-30 -50 -8 -68 16 -66 C38 -64 54 -50 58 -30 C61 -18 60 -6 56 4 C52 -6 46 -14 38 -18 C34 -20 30 -22 28 -22 Z" fill="url(#gRojo)"/>
  <path d="M30 -60 C44 -52 54 -38 56 -18" stroke="rgba(70,0,10,.28)" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M-18 -52 C-8 -60 6 -64 18 -62" stroke="rgba(255,255,255,.28)" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <g id="sPompon" filter="url(#gSomS)">${fluff([[56,8,10],[50,3,5],[62,3,5],[63,12,5],[49,13,5],[56,16,5]],'url(#gPel)')}</g>
  <!-- pelo blanco a los lados -->
  ${fluff([[-29,-4,7],[-32,5,7],[-30,14,6],[29,-4,7],[32,5,7],[30,14,6]],'url(#gPel)')}
  <!-- orejas -->
  <ellipse cx="-26" cy="6" rx="5.5" ry="8" fill="url(#gOreja)"/><ellipse cx="26" cy="6" rx="5.5" ry="8" fill="url(#gOreja)"/>
  <!-- cara -->
  <ellipse cx="0" cy="3" rx="24" ry="26" fill="url(#gPiel)"/>
  <!-- barba frondosa con rizos -->
  <g filter="url(#gSomS)">
   <path d="M-27 4 C-36 22 -34 46 -22 62 C-14 72 -6 78 0 80 C6 78 14 72 22 62 C34 46 36 22 27 4 C25 14 19 21 11 23 C5 24 -5 24 -11 23 C-19 21 -25 14 -27 4 Z" fill="url(#gBarba)"/>
   <path d="M-27 4 C-36 22 -34 46 -22 62 C-14 72 -6 78 0 80 C6 78 14 72 22 62 C34 46 36 22 27 4 C25 14 19 21 11 23 C5 24 -5 24 -11 23 C-19 21 -25 14 -27 4 Z" fill="url(#gBarbaS)"/>
   ${fluff([[-28,46,7],[-22,58,8],[-12,68,8],[0,73,8],[12,68,8],[22,58,8],[28,46,7]],'url(#gBarba)')}
  </g>
  <g stroke="rgba(150,170,195,.55)" stroke-width="1.3" fill="none" stroke-linecap="round">
   <path d="M-22 30 q4 6 0 12 M-12 34 q4 7 0 14 M0 36 q4 8 0 16 M12 34 q-4 7 0 14 M22 30 q-4 6 0 12 M-16 52 q3 5 0 10 M6 54 q3 5 0 10 M-4 60 q3 5 0 9"/>
  </g>
  <!-- cachetes y nariz -->
  <circle cx="-14" cy="10" r="8" fill="url(#gMej)"/><circle cx="14" cy="10" r="8" fill="url(#gMej)"/>
  <!-- ojos -->
  <g id="sOjoA"><ellipse cx="-9.5" cy="1" rx="2.7" ry="3.4" fill="#2e1c12"/><ellipse cx="9.5" cy="1" rx="2.7" ry="3.4" fill="#2e1c12"/><circle cx="-8.6" cy="-.3" r="1.05" fill="#fff"/><circle cx="10.4" cy="-.3" r="1.05" fill="#fff"/></g>
  <g id="sOjoF" opacity="0"><path d="M-13.5 2 Q-9.5 -3 -5.5 2" stroke="#2e1c12" stroke-width="2.1" fill="none" stroke-linecap="round"/><path d="M5.5 2 Q9.5 -3 13.5 2" stroke="#2e1c12" stroke-width="2.1" fill="none" stroke-linecap="round"/></g>
  <g id="sGuino" opacity="0"><ellipse cx="-9.5" cy="1" rx="2.7" ry="3.4" fill="#2e1c12"/><circle cx="-8.6" cy="-.3" r="1.05" fill="#fff"/><path d="M5.5 2 Q9.5 -2 13.5 2" stroke="#2e1c12" stroke-width="2.1" fill="none" stroke-linecap="round"/></g>
  <!-- lentes sobre la nariz -->
  <g fill="rgba(255,255,255,.12)" stroke="#c9952a" stroke-width="1.3"><ellipse cx="-9.5" cy="2" rx="6.4" ry="5.6"/><ellipse cx="9.5" cy="2" rx="6.4" ry="5.6"/></g>
  <path d="M-3.1 1.5 Q0 -.6 3.1 1.5" stroke="#c9952a" stroke-width="1.3" fill="none"/><path d="M-15.9 1 L-23 -1 M15.9 1 L23 -1" stroke="#c9952a" stroke-width="1.1"/>
  <path d="M-14 -1 L-11.5 -2.6" stroke="rgba(255,255,255,.85)" stroke-width="1.1" stroke-linecap="round"/><path d="M5 -1 L7.5 -2.6" stroke="rgba(255,255,255,.85)" stroke-width="1.1" stroke-linecap="round"/>
  <!-- cejas pobladas -->
  ${fluff([[-15,-7,3],[-11.5,-8.6,3.4],[-7.5,-8,3],[-4.8,-6.8,2.2]],'url(#gPel)')}${fluff([[15,-7,3],[11.5,-8.6,3.4],[7.5,-8,3],[4.8,-6.8,2.2]],'url(#gPel)')}
  <!-- boca (bajo el bigote) -->
  <g id="sBoca"><ellipse cx="0" cy="23" rx="5" ry="3.8" fill="#6e1420"/><ellipse cx="0" cy="25" rx="3.2" ry="1.6" fill="#e8607a"/></g>
  <!-- bigote de dos lóbulos -->
  <g filter="url(#gSomS)">
   <path d="M0 15 C-5 11 -15 10 -23 15 C-28 18 -30 24 -26 27 C-24 22 -18 20 -12 21 C-6 22 -2 21 0 19 Z" fill="url(#gBarba)"/>
   <path d="M0 15 C5 11 15 10 23 15 C28 18 30 24 26 27 C24 22 18 20 12 21 C6 22 2 21 0 19 Z" fill="url(#gBarba)"/>
   <path d="M-4 16 C-10 14 -17 15 -22 19 M4 16 C10 14 17 15 22 19" stroke="rgba(150,170,195,.5)" stroke-width="1" fill="none"/>
  </g>
  <ellipse cx="0" cy="11" rx="5.2" ry="4.6" fill="url(#gNar)"/><ellipse cx="-1.7" cy="9.4" rx="1.6" ry="1.05" fill="rgba(255,255,255,.85)"/>
  <!-- banda de piel que abraza la frente (sigue la curva de la cabeza) -->
  <g filter="url(#gSomS)">
   <path d="M-34 -10 C-30 -27 30 -27 34 -10 C35 -3 31 0 27 -3 C17 -11 -17 -11 -27 -3 C-31 0 -35 -3 -34 -10 Z" fill="url(#gPel)"/>
   ${fluff([[-31,-12,4.6],[-24,-19,5],[-15,-22.5,5],[-5,-24,5],[5,-24,5],[15,-22.5,5],[24,-19,5],[31,-12,4.6],[-29,-4,4],[29,-4,4]],'url(#gPel)')}
   <path d="M-26 -6 C-14 -13 14 -13 26 -6" stroke="rgba(150,170,195,.45)" stroke-width="1.2" fill="none"/>
  </g>
 </g>
`; }

function manosSVG(){ return ` 
 <g id="sManos" filter="url(#gSomS)">
  <g transform="translate(-76 124)"><rect x="-13" y="-12" width="26" height="12" rx="6" fill="url(#gPel)"/><path d="M-11 0 C-14 6 -10 16 -2 16 C6 17 12 12 12 6 C13 1 10 -1 6 0 Z" fill="#1f1a18"/><path d="M-11 4 C-16 4 -17 10 -12 12" fill="none" stroke="#1f1a18" stroke-width="5" stroke-linecap="round"/><path d="M-6 4 C-2 6 4 6 8 4" stroke="rgba(255,255,255,.18)" stroke-width="1.5" fill="none"/></g>
  <g transform="translate(76 124) scale(-1 1)"><rect x="-13" y="-12" width="26" height="12" rx="6" fill="url(#gPel)"/><path d="M-11 0 C-14 6 -10 16 -2 16 C6 17 12 12 12 6 C13 1 10 -1 6 0 Z" fill="#1f1a18"/><path d="M-11 4 C-16 4 -17 10 -12 12" fill="none" stroke="#1f1a18" stroke-width="5" stroke-linecap="round"/><path d="M-6 4 C-2 6 4 6 8 4" stroke="rgba(255,255,255,.18)" stroke-width="1.5" fill="none"/></g>
 </g>`; }
// Pluma de ganso: la punta en (0,0)
function pluma(){ const barbas=[]; for(let i=0;i<20;i++){ const u=i/19, y=-14-u*62, x=u*22+2, w=lerp(4,13,Math.sin(u*Math.PI*.9)); barbas.push(`<path d="M${x.toFixed(1)} ${y.toFixed(1)} l${(-w*.55).toFixed(1)} ${(w*.75).toFixed(1)} M${x.toFixed(1)} ${y.toFixed(1)} l${(w*.9).toFixed(1)} ${(w*.35).toFixed(1)}" stroke="rgba(160,175,195,.55)" stroke-width=".6"/>`); }
  return `<g filter="url(#gSomS)"><path d="M3 -12 C-8 -30 -6 -56 22 -84 C34 -60 30 -34 9 -14 Z" fill="url(#gPluma)" stroke="#a89068" stroke-width="1.1"/>${barbas.join('')}<path d="M2 -6 C8 -30 15 -56 23 -82" stroke="#d8c8a8" stroke-width="1.4" fill="none"/><path d="M-1.6 -12 L4 -12 L1.6 -2 L.6 0 L.2 -2 Z" fill="url(#gPunta)"/><path d="M1 -9 L.8 -2" stroke="#4a3a10" stroke-width=".5"/></g>`; }


const reducido=()=>!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
// [avance, trazos[[x,y,x,y…]]] en unidades de la fuente (1000 por em, y hacia arriba)
const GLIFOS={"A":[630,[[32,0,94,32,189,126,284,252,410,472,504,662,504,0,472,94,410,189,346,252,252,315,189,315,158,284,158,220,189,158,252,94,346,32,441,0,598,0]]],"B":[724,[[441,598,472,567,472,472,441,346,410,252,378,189,315,94,252,32,189,0,158,0,126,32,126,126,158,284,189,378,220,441,284,536,346,598,410,630,504,662,598,662,662,630,693,567,693,504,662,441,630,410,567,378,472,346],[441,346,472,346,567,315,598,284,630,220,630,126,598,63,567,32,504,0,410,0,346,32,315,94]]],"C":[630,[[410,472,410,441,441,410,504,410,567,441,598,504,598,567,567,630,504,662,410,662,315,630,252,567,189,472,158,410,126,284,126,158,158,63,189,32,252,0,315,0,410,32,472,94,504,158]]],"D":[724,[[441,662,378,630,346,567,315,441,284,252,252,158,220,94,158,32,94,0,32,0,0,32,0,94,32,126,94,126,158,94,220,32,315,0,410,0,504,32,567,94,630,220,662,378,662,504,630,598,598,630,536,662,441,662,378,598,378,536,410,441,472,346,536,284,630,220,693,189]]],"E":[630,[[472,536,472,504,504,472,567,472,598,504,598,567,567,630,472,662,346,662,252,630,220,567,220,472,252,410,284,378,378,346,284,346,189,315,158,284,126,220,126,126,158,63,189,32,284,0,378,0,472,32,536,94,567,158]]],"F":[630,[[346,472,284,472,220,504,189,567,220,630,315,662,410,662,536,630,630,630,693,662],[536,630,472,410,410,220,346,94,284,32,220,0,158,0,94,32,63,94,63,158,94,189,158,189,220,158],[315,346,598,346]]],"G":[724,[[32,0,94,32,220,158,315,315,346,410,378,536,378,630,346,662,315,662,284,630,252,567,252,472,284,410,346,378,472,378,567,410,598,441,630,504,630,315,598,158,567,94,504,32,410,0,284,0,189,32,126,94,94,158,94,220]]],"H":[756,[[252,441,189,472,158,536,158,567,189,630,252,662,284,662,346,630,378,567,378,504,346,378,284,189,220,63,158,0,94,0,63,32,63,94],[252,284,536,378,598,410,693,472,756,536,788,598,788,630,756,662,724,662,662,598,598,472,536,284,504,126,504,32,536,0,567,0,630,32,662,63,724,158]]],"I":[536,[[472,158,410,220,346,315,315,378,284,472,284,567,315,630,346,662,410,662,441,630,472,567,472,472,441,315,378,158,346,94,284,32,220,0,158,0,94,32,63,94,63,158,94,189,158,189,220,158]]],"J":[472,[[346,-94,284,0,220,158,189,346,189,536,220,630,284,662,346,662,378,630,410,536,410,441,378,284,284,0,220,-189,189,-284,158,-346,94,-378,63,-346,63,-284,94,-189,158,-94,220,-32,315,32,441,94]]],"K":[756,[[252,441,189,472,158,536,158,567,189,630,252,662,284,662,346,630,378,567,378,504,346,378,284,189,220,63,158,0,94,0,63,32,63,94],[788,567,788,630,756,662,724,662,662,630,598,567,536,472,472,410,410,378,346,378],[410,378,441,315,441,94,472,32,504,0,536,0,598,32,630,63,693,158]]],"L":[598,[[158,284,220,284,346,315,441,378,504,441,536,504,536,598,504,662,441,662,410,630,378,567,346,410,315,252,284,158,252,94,189,32,126,0,63,0,32,32,32,94,63,126,126,126,189,94,284,32,378,0,441,0,536,32,598,94]]],"M":[1040,[[189,441,126,472,94,536,94,567,126,630,189,662,220,662,284,630,315,567,315,504,284,346,252,220,189,0],[252,220,346,472,410,598,441,630,504,662,536,662,598,630,630,567,630,504,598,346,567,220,504,0],[567,220,662,472,724,598,756,630,819,662,850,662,914,630,945,567,945,504,914,346,850,126,850,32,882,0,914,0,976,32,1008,63,1071,158]]],"N":[756,[[189,441,126,472,94,536,94,567,126,630,189,662,220,662,284,630,315,567,315,504,284,346,252,220,189,0],[252,220,346,472,410,598,441,630,504,662,567,662,630,630,662,567,662,504,630,346,567,126,567,32,598,0,630,0,693,32,724,63,788,158]]],"O":[662,[[410,662,315,630,252,567,189,472,158,410,126,284,126,158,158,63,189,32,252,0,315,0,410,32,472,94,536,189,567,252,598,378,598,504,567,598,536,630,472,662,410,662,346,598,346,504,378,410,441,315,504,252,598,189,662,158]]],"P":[788,[[441,598,472,567,472,472,441,346,410,252,378,189,315,94,252,32,189,0,158,0,126,32,126,126,158,284,189,378,220,441,284,536,346,598,410,630,504,662,662,662,724,630,756,598,788,536,788,441,756,378,724,346,662,315,567,315,504,346,472,378]]],"Q":[693,[[441,472,410,410,378,378,315,346,252,346,220,410,220,472,252,567,315,630,410,662,504,662,567,630,598,567,598,441,567,346,504,252,378,126,284,63,220,32,126,0,63,0,32,32,32,94,63,126,126,126,189,94,284,32,378,0,472,0,567,32,630,94]]],"R":[788,[[441,598,472,567,472,472,441,346,410,252,378,189,315,94,252,32,189,0,158,0,126,32,126,126,158,284,189,378,220,441,284,536,346,598,410,630,504,662,630,662,693,630,724,598,756,536,756,441,724,378,693,346,630,315,536,315,441,346,472,315,504,252,504,94,536,32,598,0,662,32,693,63,756,158]]],"S":[630,[[32,0,94,32,158,94,252,220,315,315,378,441,410,536,410,630,378,662,346,662,315,630,284,567,284,504,315,441,378,378,472,315,536,252,567,189,567,126,536,63,504,32,410,0,284,0,189,32,126,94,94,158,94,220]]],"T":[598,[[346,472,284,472,220,504,189,567,220,630,315,662,410,662,536,630,630,630,693,662],[536,630,472,410,410,220,346,94,284,32,220,0,158,0,94,32,63,94,63,158,94,189,158,189,220,158]]],"U":[756,[[189,441,126,472,94,536,94,567,126,630,189,662,220,662,284,630,315,567,315,504,284,378,252,284,220,158,220,94,252,32,315,0,378,0,441,32,472,63,536,189,630,441,693,662],[630,441,598,315,567,126,567,32,598,0,630,0,693,32,724,63,788,158]]],"V":[724,[[189,441,126,472,94,536,94,567,126,630,189,662,220,662,284,630,315,567,315,504,284,378,252,284,220,158,220,63,252,0,315,0,378,32,472,126,536,220,598,346,630,441,662,567,662,630,630,662,598,662,567,630,536,567,536,504,567,410,630,346,693,315]]],"W":[882,[[189,441,126,472,94,536,94,567,126,630,189,662,220,662,284,630,315,567,315,472,284,0],[598,662,284,0],[598,662,536,0],[976,662,914,630,819,536,724,410,630,220,536,0]]],"X":[756,[[284,472,220,472,189,504,189,567,220,630,284,662,346,662,410,630,441,567,441,472,378,189,378,94,410,32,472,0,536,0,598,32,630,94,630,158,598,189,536,189],[756,567,756,630,724,662,662,662,598,630,536,567,472,472,346,189,284,94,220,32,158,0,94,0,63,32,63,94]]],"Y":[724,[[189,441,126,472,94,536,94,567,126,630,189,662,220,662,284,630,315,567,315,504,284,378,252,284,220,158,220,94,252,32,284,0,346,0,410,32,472,94,536,189,567,252,630,441],[693,662,630,441,536,126,472,-63,410,-220,346,-346,284,-378,252,-346,252,-284,284,-189,346,-94,441,0,536,63,693,158]]],"Z":[662,[[441,472,410,410,378,378,315,346,252,346,220,410,220,472,252,567,315,630,410,662,504,662,567,630,598,567,598,441,567,346,504,220,410,126,284,32,220,0,126,0,94,32,94,94,126,126,220,126,284,94,315,63,346,0,346,-94,315,-189,284,-252,220,-346,158,-378,126,-346,126,-284,158,-189,220,-94,315,0,410,63,598,158]]],"a":[504,[[315,189,284,252,220,284,158,284,94,252,63,220,32,158,32,94,63,32,126,0,189,0,252,32,284,94,346,284,315,126,315,32,346,0,378,0,441,32,472,63,536,158]]],"b":[441,[[32,158,94,252,189,410,220,472,252,567,252,630,220,662,158,630,126,567,94,441,63,220,63,32,94,0,126,0,189,32,252,94,284,189,284,284,315,158,346,126,410,126,472,158]]],"c":[346,[[252,220,252,252,220,284,158,284,94,252,63,220,32,158,32,94,63,32,126,0,220,0,315,63,378,158]]],"d":[504,[[315,189,284,252,220,284,158,284,94,252,63,220,32,158,32,94,63,32,126,0,189,0,252,32,284,94,472,662],[346,284,315,126,315,32,346,0,378,0,441,32,472,63,536,158]]],"e":[315,[[63,63,126,94,158,126,189,189,189,252,158,284,126,284,63,252,32,189,32,94,63,32,126,0,189,0,252,32,284,63,346,158]]],"f":[252,[[32,158,158,315,220,410,252,472,284,567,284,630,252,662,189,630,158,567,94,315,0,32,-94,-189,-126,-284,-126,-346,-94,-378,-32,-346,0,-252,32,32,63,0,126,0,189,32,220,63,284,158]]],"g":[472,[[315,189,284,252,220,284,158,284,94,252,63,220,32,158,32,94,63,32,126,0,189,0,252,32,284,63],[346,284,284,63,158,-284,126,-346,63,-378,32,-346,32,-284,63,-189,158,-94,252,-32,315,0,410,63,504,158]]],"h":[472,[[32,158,94,252,189,410,220,472,252,567,252,630,220,662,158,630,126,567,94,441,63,252,32,0],[32,0,63,94,94,158,158,252,220,284,284,284,315,252,315,189,284,94,284,32,315,0,346,0,410,32,441,63,504,158]]],"i":[220,[[126,441,126,410,158,410,158,441,126,441],[32,158,94,284,32,94,32,32,63,0,94,0,158,32,189,63,252,158]]],"j":[220,[[126,441,126,410,158,410,158,441,126,441],[32,158,94,284,-94,-284,-126,-346,-189,-378,-220,-346,-220,-284,-189,-189,-94,-94,0,-32,63,0,158,63,252,158]]],"k":[441,[[32,158,94,252,189,410,220,472,252,567,252,630,220,662,158,630,126,567,94,441,63,252,32,0],[32,0,63,94,94,158,158,252,220,284,284,284,315,252,315,189,252,158,158,158],[158,158,220,126,252,32,284,0,315,0,378,32,410,63,472,158]]],"l":[252,[[32,158,94,252,189,410,220,472,252,567,252,630,220,662,158,630,126,567,94,441,63,220,63,32,94,0,126,0,189,32,220,63,284,158]]],"m":[788,[[32,158,94,252,158,284,189,252,189,220,158,94,126,0],[158,94,189,158,252,252,315,284,378,284,410,252,410,220,378,94,346,0],[378,94,410,158,472,252,536,284,598,284,630,252,630,189,598,94,598,32,630,0,662,0,724,32,756,63,819,158]]],"n":[567,[[32,158,94,252,158,284,189,252,189,220,158,94,126,0],[158,94,189,158,252,252,315,284,378,284,410,252,410,189,378,94,378,32,410,0,441,0,504,32,536,63,598,158]]],"o":[441,[[220,284,158,284,94,252,63,220,32,158,32,94,63,32,126,0,189,0,252,32,284,63,315,126,315,189,284,252,220,284,189,252,189,189,220,126,284,94,378,94,441,126,472,158]]],"p":[472,[[32,158,94,252,126,315,94,189,-94,-378],[94,189,126,252,189,284,252,284,315,252,346,189,346,126,315,63,284,32,220,0],[94,32,158,0,252,0,346,32,410,63,504,158]]],"q":[472,[[315,189,284,252,220,284,158,284,94,252,63,220,32,158,32,94,63,32,126,0,189,0,252,32],[346,284,315,189,252,32,158,-189,126,-284,126,-346,158,-378,220,-346,252,-252,252,-32,315,0,410,63,504,158]]],"r":[410,[[32,158,94,252,126,315,126,252,220,252,252,220,252,158,220,63,220,32,252,0,284,0,346,32,378,63,441,158]]],"s":[346,[[32,158,94,252,126,315,126,252,189,158,220,94,220,32,158,0],[32,32,94,0,220,0,284,32,315,63,378,158]]],"t":[284,[[32,158,94,252,158,378],[252,662,63,94,63,32,94,0,158,0,220,32,252,63,315,158],[63,410,284,410]]],"u":[472,[[32,158,94,284,32,94,32,32,63,0,126,0,189,32,252,94,315,189],[346,284,284,94,284,32,315,0,346,0,410,32,441,63,504,158]]],"v":[472,[[32,158,94,284,63,126,63,32,94,0,126,0,220,32,284,94,315,189,315,284],[315,284,346,158,378,126,441,126,504,158]]],"w":[662,[[126,284,63,220,32,126,32,63,63,0,126,0,189,32,252,94],[315,284,252,94,252,32,284,0,346,0,410,32,472,94,504,189,504,284],[504,284,536,158,567,126,630,126,693,158]]],"x":[504,[[32,158,94,252,158,284,220,284,252,252,252,32,284,0,378,0,472,63,536,158],[441,252,410,284,346,284,315,252,189,32,158,0,94,0,63,32]]],"y":[472,[[32,158,94,284,32,94,32,32,63,0,126,0,189,32,252,94,315,189],[346,284,158,-284,126,-346,63,-378,32,-346,32,-284,63,-189,158,-94,252,-32,315,0,410,63,504,158]]],"z":[441,[[32,158,94,252,158,284,220,284,284,220,284,158,252,94,189,32,94,0,158,-32,189,-94,189,-189,158,-284,126,-346,63,-378,32,-346,32,-284,63,-189,158,-94,252,-32,378,63,472,158]]]};
const OTROS=['Ana','Carlos','Sofía','Mario','Elena','Rosa'];
function primerNombre(n){ const t=String(n||'').trim().split(/\s+/)[0]||''; const l=t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g,''); return l?l.charAt(0).toUpperCase()+l.slice(1).toLowerCase():'Equipo'; }
// El nombre como un solo trazo (en px): letras en orden y después tildes, diéresis y la virgulilla de la ñ
function trazoNombre(nombre,k){
  let x=0; const sub=[], marcas=[];
  for(const ch of nombre){ const nfd=ch.normalize('NFD'), base=nfd[0], g=GLIFOS[base]; if(!g){ x+=300; continue; }
    let ymax=-1e9, xmin=1e9, xmax=-1e9;
    g[1].forEach(s=>{ const p=[]; for(let i=0;i<s.length;i+=2){ p.push([(x+s[i])*k,-s[i+1]*k]); ymax=Math.max(ymax,s[i+1]); xmin=Math.min(xmin,s[i]); xmax=Math.max(xmax,s[i]); } sub.push(p); });
    const cx=(x+(xmin+xmax)/2)*k, top=(ymax+80)*k;
    if(nfd.includes('́')) marcas.push([[cx-30*k,-top],[cx+40*k,-top-110*k]]);
    if(nfd.includes('̃')) marcas.push([[cx-70*k,-top-30*k],[cx-35*k,-top-70*k],[cx,-top-40*k],[cx+35*k,-top-10*k],[cx+70*k,-top-50*k]]);
    if(nfd.includes('̈')) { marcas.push([[cx-40*k,-top-20*k],[cx-36*k,-top-24*k]]); marcas.push([[cx+40*k,-top-20*k],[cx+44*k,-top-24*k]]); }
    x+=g[0]; }
  const todo=sub.concat(marcas);
  return {d:todo.map(p=>'M'+p.map(q=>q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' L')).join(' '), ancho:x*k};
}
const CHECK='M0 0 C2 2 5 6 8 10 C11 2 17 -8 26 -16';

// cont: el contenedor de la escena (ocupa la pantalla, detrás del texto). Devuelve { detener, duracion }.
export function escenaListaNV(cont,{nombre='',alTexto}={}){
  const W=Math.max(320,cont.clientWidth||innerWidth), H=Math.max(480,cont.clientHeight||innerHeight), D=Math.min(1.5,window.devicePixelRatio||1);
  const cv=()=>{ const c=document.createElement('canvas'); c.width=Math.round(W*D); c.height=Math.round(H*D); const x=c.getContext('2d'); x.setTransform(D,0,0,D,0,0); return {c,x}; };
  const F=cv(), V=cv(), NS='http://www.w3.org/2000/svg', sv=document.createElementNS(NS,'svg');
  sv.setAttribute('viewBox',`0 0 ${W} ${H}`); sv.setAttribute('aria-hidden','true');
  cont.appendChild(F.c); cont.appendChild(sv); cont.appendChild(V.c);
  const fx=F.x, vx=V.x, SUF='_nvl';
  const $=id=>sv.querySelector('#'+id+SUF), tf=(el,x,y,s=1,r=0)=>el.setAttribute('transform',`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${r.toFixed(2)}) scale(${s.toFixed(3)})`), op=(el,a)=>el.setAttribute('opacity',cl(a).toFixed(3));
  const glow=(x,c,px,py,r,a)=>{ const g=x.createRadialGradient(px,py,0,px,py,r); g.addColorStop(0,`rgba(${c},${a})`); g.addColorStop(1,`rgba(${c},0)`); x.fillStyle=g; x.beginPath(); x.arc(px,py,r,0,P); x.fill(); };
  // medidas: Santa arriba, la lista colgando de sus manos; el texto de la app queda abajo
  const S=Math.min(1.25,(H*.62)/440), cx=W/2, sy=Math.max(70,H*.13);
  const LW=Math.min(286,W*.74), LX=cx-LW/2, ROD=sy+124*S, PASO=Math.min(44,(H*.52-130)/5);
  const nom=primerNombre(nombre), otros=OTROS.filter(n=>n.toLowerCase()!==nom.toLowerCase()).slice(0,5), nombres=[...otros.slice(0,3),nom,...otros.slice(3,5)];
  const fila=i=>ROD+80+i*PASO, FY=fila(3), NX=LX+30, FIN=fila(5)+78;
  let kN=.026; const prueba=trazoNombre(nom,1); const maxA=LW-104; if(prueba.ancho*kN>maxA) kN=maxA/prueba.ancho;
  const NOMB=trazoNombre(nom,kN);
  const verde=(x,y,k)=>`<path d="M${x} ${y} c2 1.6 4 4.4 6 7.4 c3 -6 7 -12 13 -17" stroke="#2c7a4b" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="rotate(${k} ${x} ${y})"/>`;
  const rodillo=y=>`<rect x="${LX-10}" y="${y-10}" width="${LW+20}" height="20" rx="10" fill="url(#gRodillo)"/><path d="M${LX-4} ${y-5} H${LX+LW+4}" stroke="rgba(255,255,255,.5)" stroke-width="2" stroke-linecap="round"/><rect x="${LX-20}" y="${y-7}" width="12" height="14" rx="4" fill="url(#gMadera)"/><rect x="${LX+LW+8}" y="${y-7}" width="12" height="14" rx="4" fill="url(#gMadera)"/>`;
  const acebo=t=>`<g transform="${t}"><path d="M0 0 l5 -4 4 3 4 -4 5 3 4 -3 5 4 -5 4 -4 -3 -5 3 -4 -3 -4 3z" fill="#2c7a4b"/><circle cx="18" cy="3" r="2.6" fill="#c4152c"/><circle cx="22" cy="5" r="2.2" fill="#c4152c"/></g>`;
  const serif=`font-family="Georgia,'Times New Roman',serif" font-style="italic"`;
  sv.innerHTML=(DEFS2+`<clipPath id="gLista"><rect id="gListaR" x="${LX-4}" y="${ROD}" width="${LW+8}" height="0"/></clipPath>
   <g id="santa">${santaMedio()}</g>
   <g filter="url(#gSom)"><g clip-path="url(#gLista)">
     <rect x="${LX}" y="${ROD}" width="${LW}" height="${FIN-ROD+20}" fill="url(#gPapel)"/>
     <rect x="${LX}" y="${ROD}" width="${LW}" height="20" fill="rgba(120,80,30,.12)"/>
     <g transform="translate(${cx} ${ROD+36})"><text text-anchor="middle" ${serif} font-weight="700" font-size="21" fill="#8a1a1a">Lista de Santa</text>${acebo('translate(-92 -7)')}${acebo('translate(92 -7) scale(-1 1)')}</g>
     <path d="M${LX+28} ${ROD+50} H${LX+LW-28}" stroke="#c9952a" stroke-width="1.3"/><path d="M${LX+50} ${ROD+54} H${LX+LW-50}" stroke="#c9952a" stroke-width=".7" opacity=".7"/>
     ${nombres.map((n,i)=>{ const y=fila(i); return `<path d="M${LX+26} ${y+9} H${LX+LW-26}" stroke="rgba(120,90,50,.22)" stroke-width="1"/>${i===3?'':`<text x="${NX}" y="${y+2}" ${serif} font-size="18" fill="#5a4a36">${n}</text>${verde(LX+LW-58,y-6,(i*7)%9-4)}`}`; }).join('')}
     <g transform="translate(${NX} ${FY+4})" filter="url(#gTinta)"><path id="gNom" d="${NOMB.d}" stroke="#1b3a86" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
     <text x="${LX+30}" y="${FIN-10}" ${serif} font-size="13" fill="#8a1a1a" opacity=".85">— S. Claus, Polo Norte</text>
     <g transform="translate(${LX+LW-60} ${FY-4})" filter="url(#gTinta)"><path id="gChk" d="${CHECK}" stroke="#c4152c" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
     <g id="gSello" opacity="0"><g filter="url(#gSomS)"><path d="M0 -30 C10 -31 20 -27 26 -19 C33 -12 33 2 29 11 C24 22 13 30 0 30 C-9 31 -21 27 -27 18 C-33 9 -32 -6 -27 -15 C-21 -25 -11 -30 0 -30 Z" fill="url(#gLacre)"/><circle r="20" fill="none" stroke="rgba(90,0,10,.45)" stroke-width="1.6"/><circle r="20" fill="none" stroke="rgba(255,170,170,.35)" stroke-width="1" transform="translate(-.6 -.8)"/>
       <path d="M-9 0 l6 7 l13 -14" stroke="rgba(90,0,10,.55)" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M-9 -1 l6 7 l13 -14" stroke="rgba(255,180,180,.6)" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(-.7 -.9)"/>
       <ellipse cx="-11" cy="-15" rx="7" ry="3.4" fill="rgba(255,255,255,.35)" transform="rotate(-30 -11 -15)"/></g></g>
   </g>
   <g id="gRollo">${rodillo(0)}</g>${rodillo(ROD)}</g>
   <g id="manos">${manosSVG()}</g>
   <g id="laPluma">${pluma()}</g>`).replace(/id="(\w+)"/g,'id="$1'+SUF+'"').replace(/url\(#(\w+)\)/g,'url(#$1'+SUF+')');
  const nomP=$('gNom'), chk=$('gChk'), NL=nomP.getTotalLength(), CL=chk.getTotalLength();
  [[nomP,NL],[chk,CL]].forEach(([e,L])=>{ e.style.strokeDasharray=L; e.style.strokeDashoffset=L; });
  // fondo fijo: sala cálida, luces desenfocadas y la guirnalda (se pinta una vez)
  { const R=rnd(9); let g=fx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#2a110a'); g.addColorStop(.6,'#3d170d'); g.addColorStop(1,'#1a0805'); fx.fillStyle=g; fx.fillRect(0,0,W,H);
    for(let i=0;i<W;i+=26){ fx.fillStyle='rgba(255,210,150,.03)'; fx.fillRect(i,0,12,H); }
    for(let i=0;i<30;i++){ glow(fx,['255,190,90','255,120,90','140,230,170','255,220,150','120,180,255'][Math.floor(R()*5)],R()*W,R()*H*.8,12+R()*40,.06+R()*.14); }
    fx.strokeStyle='#1f5a38'; fx.lineWidth=14; fx.lineCap='round'; fx.beginPath(); fx.moveTo(-10,24); for(let i=0;i<=6;i++) fx.quadraticCurveTo(i*W/6-W/12,52,i*W/6,24); fx.stroke(); }
  const FOCOS=Array.from({length:13},(_,i)=>({x:i*W/12,y:30+Math.sin(i*1.3)*8,c:['255,80,90','255,210,90','120,220,150','120,190,255'][i%4]}));
  const R2=rnd(3), chis=Array.from({length:16},(_,i)=>({a:i/16*P+R2()*.3,v:40+R2()*60,r:1.2+R2()*1.8}));
  const SX=LX+LW-56, SY=FIN-26;
  let texto=false;
  function cuadro(t){
    const ent=eOut(seg(t,0,.55)), asiente=t>3.0&&t<3.5?Math.sin((t-3.0)*18)*3.5:0, resp=Math.sin(t*2.1)*1.2;
    tf($('santa'),cx,sy+(1-ent)*40,S,0); op($('santa'),ent); tf($('manos'),cx,sy+(1-ent)*40,S,0); op($('manos'),ent);
    $('sCabeza').setAttribute('transform',`translate(0 ${(resp+asiente).toFixed(2)}) rotate(${(Math.sin(t*1.3)*1.5+(t>1.2&&t<2.6?3:0)).toFixed(2)} 0 30)`);
    $('sPompon').setAttribute('transform',`rotate(${(Math.sin(t*3)*6).toFixed(1)} 50 -8)`);
    const parp=(t>.8&&t<.9)||(t>2.7&&t<2.8), feliz=t>2.95&&t<3.7, guino=t>3.8&&t<4.1;
    op($('sOjoA'),parp||feliz||guino?0:1); op($('sOjoF'),feliz||parp?1:0); op($('sGuino'),guino?1:0);
    const habla=feliz?.45+.45*Math.abs(Math.sin((t-2.95)*10)):.14; $('sBoca').setAttribute('transform',`translate(0 ${(23*(1-habla)).toFixed(2)}) scale(1 ${habla.toFixed(3)})`);
    // la lista se desenrolla
    const LH=(FIN+10-ROD)*eOut(seg(t,.4,1.05)); $('gListaR').setAttribute('height',LH.toFixed(1)); tf($('gRollo'),0,ROD+LH,1,0);
    // la pluma escribe el nombre (tildes al final) y la palomita; la tinta se seca de brillante a mate
    const u1=seg(t,1.15,2.3), u3=seg(t,2.42,2.72);
    nomP.style.strokeDashoffset=(NL*(1-u1)).toFixed(1); chk.style.strokeDashoffset=(CL*(1-u3)).toFixed(1); nomP.style.opacity=u1>0?1:0; chk.style.opacity=u3>0?1:0;   // sin el puntito de la punta redonda antes de empezar
    nomP.setAttribute('stroke',t>2.6?'#1b3a86':'#23479e'); chk.setAttribute('stroke',t>3.1?'#b3122a':'#d51a33');
    let px,py; if(u3>0){ const p=chk.getPointAtLength(CL*u3); px=LX+LW-60+p.x; py=FY-4+p.y; } else { const p=nomP.getPointAtLength(NL*u1); px=NX+p.x; py=FY+4+p.y; }
    const pv=seg(t,.9,1.12)*(1-seg(t,2.78,3.0)), lev=t>2.3&&t<2.42?Math.sin(seg(t,2.3,2.42)*Math.PI)*6:0;
    tf($('laPluma'),px+(1-pv)*36,py-(1-pv)*40-lev,1.15,-6+Math.sin(t*14)*2*(u1>0&&u1<1?1:0)); op($('laPluma'),pv);
    // el sello de lacre cae y se aplasta
    const st=seg(t,2.85,3.05), apl=t>3.05?Math.exp(-(t-3.05)*8)*Math.sin((t-3.05)*28)*.07:0;
    op($('gSello'),st>0?1:0); tf($('gSello'),SX,SY,lerp(1.7,1,eIn(st))*(1+apl),-14+(1-st)*20);
    // capa viva: foquitos, chimenea, brillo de la tinta y chispas del sello
    vx.clearRect(0,0,W,H);
    glow(vx,'255,140,50',W*.05,H*.95,W*.95,.36+.07*Math.sin(t*9)+.04*Math.sin(t*23));
    FOCOS.forEach((f,i)=>{ glow(vx,f.c,f.x,f.y,14,.55+.3*Math.sin(t*4+i)); vx.fillStyle=`rgb(${f.c})`; vx.beginPath(); vx.arc(f.x,f.y,3.4,0,P); vx.fill(); });
    if(pv>0&&t<2.75) glow(vx,'255,235,180',px,py,10,.5);
    if(t>3.05){ const k=seg(t,3.05,3.9); if(k<1){ glow(vx,'255,214,120',SX,SY,80,.45*(1-k)); chis.forEach(c=>{ const d=24+c.v*eOut(k); vx.fillStyle=`rgba(255,226,140,${(1-k).toFixed(3)})`; vx.beginPath(); vx.arc(SX+Math.cos(c.a)*d,SY+Math.sin(c.a)*d,c.r*(1-k)+.3,0,P); vx.fill(); }); } }
    if(!texto&&t>3.95){ texto=true; alTexto&&alTexto(); }
  }
  const duracion=reducido()?3.2:6.2;
  if(reducido()){ cuadro(4.5); texto=true; alTexto&&alTexto(); return {detener(){}, duracion}; }
  let raf=0, parado=false; const t0=performance.now();
  (function paso(n){ raf=0; if(parado||!sv.isConnected) return; const t=(n-t0)/1000; cuadro(Math.max(0,t)); if(t<duracion) raf=requestAnimationFrame(paso); })(t0);
  return {detener(){ parado=true; if(raf) cancelAnimationFrame(raf); }, duracion};
}
