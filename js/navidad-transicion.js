// ── Mantenimiento de transición: «Una nueva época está llegando» (tema normal → Pre-Navidad) ──
// Se usa cuando la administración pone la app en mantenimiento para cambiar de temporada y deja prendido
// «Pantalla de transición a Navidad» en su perfil (config/mantenimientoTransicion = 'navidad').
// La pantalla de mantenimiento arranca con el azul de siempre; enseguida se congela desde las orillas (escarcha, como la
// del marcaje de Pre-Navidad), se hace de noche con aurora y nieve, y una luz cálida derrite una ventana redonda por la
// que se ve el mundo de Pre-Navidad (montañas nevadas, pinos con moño rojo, la casita roja con humo). El título aparece
// palabra por palabra y una línea de estado va cambiando («Encendiendo la chimenea…»). La escarcha se aclara y queda
// como marco. Lo demás de la pantalla (registros a salvo, Intentar de nuevo, Soy administrador) se queda igual.
// Estilos en css/temas/comun.css («Mantenimiento de transición»). Con movimiento reducido sale directo el final.
// Lo llama index.html: window.__mantTransicion() al mostrar #maintenanceScreen.
(function(){
'use strict';
const LOGO_NS='http://www.w3.org/2000/svg';
const FRASES=['Encendiendo la chimenea','Desenredando las luces','Buscando la estrella del árbol','Afinando los villancicos','Escribiendo la carta a Santa','Colgando las esferas','Calentando el chocolate'];
let armada=false;

// ── el mundo de Pre-Navidad en pequeño (mismo dibujo que el login) ──
function paisaje(Wp,Hp,hor){
  let sem=9; const S=()=>{ sem=(sem*16807)%2147483647; return (sem-1)/2147483646; }, r=(a,b)=>a+S()*(b-a);
  let s=`<defs><linearGradient id="mtxMon1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#cfe6f6"/><stop offset="1" stop-color="#8db9da"/></linearGradient>
    <linearGradient id="mtxMon2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf6ff"/><stop offset="1" stop-color="#a9d0ea"/></linearGradient>
    <linearGradient id="mtxMon3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6f9cc4"/><stop offset="1" stop-color="#3d6a94"/></linearGradient>
    <linearGradient id="mtxLago" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3f8"/><stop offset="1" stop-color="#e9f7ff"/></linearGradient>
    <linearGradient id="mtxCielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04122a"/><stop offset=".6" stop-color="#0d3560"/><stop offset="1" stop-color="#2a6a9a"/></linearGradient>
    <linearGradient id="mtxPino" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1d4a6a"/><stop offset="1" stop-color="#2f6a8f"/></linearGradient>
    <radialGradient id="mtxHalo"><stop offset="0" stop-color="#ffcf70" stop-opacity=".45"/><stop offset="1" stop-color="#ffcf70" stop-opacity="0"/></radialGradient></defs>
    <rect width="${Wp}" height="${Hp}" fill="url(#mtxCielo)"/>`;
  for(let i=0;i<26;i++) s+=`<circle cx="${r(0,Wp).toFixed(0)}" cy="${r(0,hor*.7).toFixed(0)}" r="${r(.4,1.2).toFixed(1)}" fill="#fff" opacity="${r(.4,1).toFixed(2)}"/>`;
  // sierras con picos irregulares y cumbres nevadas recortadas del mismo perfil
  let nc=0;
  const sierra=(y0,amp,n,fill,op,nieve)=>{ let d=`M0 ${Hp}L0 ${y0}`, x=0; const pts=[];
    while(x<Wp+40){ const a=amp*r(.45,1), w=r(.6,1.4)*Wp/n; pts.push([x+w*.5,y0-a],[x+w*r(.75,.9),y0-a*r(.45,.7)],[x+w,y0-amp*r(.05,.25)]); x+=w; }
    pts.forEach(p=>{ d+=` L${p[0].toFixed(0)} ${p[1].toFixed(0)}`; }); d+=` L${Wp} ${Hp}Z`;
    let g=`<path d="${d}" fill="${fill}" opacity="${op}"/>`;
    if(nieve){ const id='mtxC'+(++nc); g+=`<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${pts.filter((_,i)=>i%3===0).map(p=>{ const h=amp*.32;
      return `<path d="M${(p[0]-h*1.1).toFixed(0)} ${(p[1]+h).toFixed(0)}L${p[0].toFixed(0)} ${(p[1]-2).toFixed(0)}L${(p[0]+h*1.2).toFixed(0)} ${(p[1]+h*1.1).toFixed(0)}L${(p[0]+h*.5).toFixed(0)} ${(p[1]+h*.75).toFixed(0)}L${(p[0]+h*.1).toFixed(0)} ${(p[1]+h*1.05).toFixed(0)}L${(p[0]-h*.4).toFixed(0)} ${(p[1]+h*.7).toFixed(0)}Z" fill="#fff" opacity=".92"/>`; }).join('')}</g>`; }
    return g; };
  s+=sierra(hor-26,Hp*.34,3,'url(#mtxMon3)',.8,true)+sierra(hor-2,Hp*.22,4,'url(#mtxMon2)',.95,true)+sierra(hor+16,Hp*.13,6,'url(#mtxMon1)',1,false);
  s+=`<rect x="0" y="${hor+16}" width="${Wp}" height="${Hp-hor}" fill="url(#mtxLago)"/><path d="M0 ${hor+16}H${Wp}" stroke="#fff" stroke-width="2"/>`;
  // la casita roja con humo
  const cx=Wp*.7;
  s+=`<g transform="translate(${cx.toFixed(0)} ${hor+8}) scale(.95)"><circle r="40" cy="-4" fill="url(#mtxHalo)"/><path d="M14 -30 V-18 H20 V-26Z" fill="#7a3a22"/>
    <g class="mtx-humo"><circle cx="17" cy="-34" r="3" fill="#fff"/><circle cx="17" cy="-34" r="3" fill="#fff" style="animation-delay:-1.3s"/><circle cx="17" cy="-34" r="3" fill="#fff" style="animation-delay:-2.6s"/></g>
    <rect x="-22" y="-12" width="44" height="30" fill="#c4152c"/><path d="M-28 -10 L0 -32 L28 -10Z" fill="#fff"/>${[[-14,-6],[8,-6],[-14,6],[8,6],[-3,-17]].map(v=>`<rect x="${v[0]}" y="${v[1]}" width="7" height="7" rx="1" fill="#ffd27a"/>`).join('')}
    <rect x="-4" y="6" width="8" height="12" rx="1" fill="#ffd27a"/><path d="M-22 18 H22" stroke="#fff" stroke-width="3"/><g fill="#ffd36b">${[-20,-10,0,10,20].map(x=>`<circle cx="${x}" cy="-12" r="1.4"/>`).join('')}</g></g>`;
  // pinos escarchados con su moño rojo
  const pinos=[]; for(let i=0;i<6;i++){ const x=(i+.5)*Wp/6+r(-12,12); if(Math.abs(x-cx)<40) continue; pinos.push([x,hor+r(18,30),r(.7,1.2)]); }
  pinos.sort((a,b)=>a[1]-b[1]).forEach(([x,y,k])=>{ s+=`<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${k.toFixed(2)})"><path d="M0 -70 L14 -40 L8 -40 L20 -16 L12 -16 L24 6 L-24 6 L-12 -16 L-20 -16 L-8 -40 L-14 -40Z" fill="url(#mtxPino)"/>
    <path d="M0 -70 L8 -52 L0 -54 L-8 -52Z M-14 -40 L-4 -38 L0 -42 L6 -38 L14 -40 M-20 -16 L-6 -13 L2 -18 L10 -13 L20 -16 M-24 6 L-8 3 L4 0 L14 3 L24 6" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
    <g transform="translate(0 -70)"><path d="M0 0 C-9 -8 -12 2 -4 3Z M0 0 C9 -8 12 2 4 3Z" fill="#d81e34"/><circle r="2" fill="#f24a5c"/></g>
    ${[[-8,-34],[9,-22],[-12,-6],[12,2]].map((b,j)=>`<circle cx="${b[0]}" cy="${b[1]}" r="${3.4-j*.2}" fill="${j%2?'#e3263c':'#c4152c'}"/>`).join('')}<rect x="-3" y="6" width="6" height="7" fill="#4a2a18"/></g>`; });
  return `<svg xmlns="${LOGO_NS}" viewBox="0 0 ${Wp} ${Hp}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${s}</svg>`;
}

// ── cielo de noche de fondo: aurora y estrellas ──
function cielo(W,H){
  let sem=5; const S=()=>{ sem=(sem*16807)%2147483647; return (sem-1)/2147483646; }, r=(a,b)=>a+S()*(b-a);
  let e=''; for(let i=0;i<Math.round(W*H/6000);i++) e+=`<circle cx="${r(0,W).toFixed(0)}" cy="${r(0,H).toFixed(0)}" r="${r(.4,1.4).toFixed(1)}" fill="#fff" opacity="${r(.4,1).toFixed(2)}" style="animation-delay:-${r(0,3).toFixed(1)}s"/>`;
  const aur=[['#50ffaa',.22,.55],['#46dcff',.3,.4],['#c86eff',.16,.35]].map(([c,y,o],i)=>`<path d="M${-W*.1} ${H*y} C${W*.25} ${H*(y-.12)} ${W*.55} ${H*(y+.08)} ${W*1.1} ${H*(y-.06)} L${W*1.1} ${H*(y+.06)} C${W*.55} ${H*(y+.2)} ${W*.25} ${H*y} ${-W*.1} ${H*(y+.12)}Z" fill="${c}" opacity="${o}" style="animation-delay:-${i*3}s"/>`).join('');
  return `<svg xmlns="${LOGO_NS}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><g class="mtx-aur">${aur}</g><g class="mtx-estr">${e}</g></svg>`;
}

// ── escarcha que crece desde las orillas (canvas); el centro queda libre ──
function escarcha(cv,W,H,instantaneo){
  const d=Math.min(2,window.devicePixelRatio||1); cv.width=Math.round(W*d); cv.height=Math.round(H*d);
  const x=cv.getContext('2d'); x.setTransform(d,0,0,d,0,0); x.lineCap='round';
  let sem=11; const S=()=>{ sem=(sem*16807)%2147483647; return (sem-1)/2147483646; };
  const segs=[], ancho=W>700;
  const crecer=(px,py,a,L,t0,w,p)=>{ for(let s=0;s<L;s++){ const paso=4+S()*5; a+=(S()-.5)*.5; const nx=px+Math.cos(a)*paso, ny=py+Math.sin(a)*paso;
    segs.push({x1:px,y1:py,x2:nx,y2:ny,t:t0+s*.03,w:Math.max(.4,w*(1-s/L))});
    if(p<3&&S()<.22){ const l=S()<.5?-1:1; crecer(nx,ny,a+l*(.9+S()*.4),Math.floor(L*(.35+S()*.3)),t0+s*.03+.04,w*.7,p+1); } px=nx; py=ny; } };
  for(let i=0;i<W/22;i++){ crecer(S()*W,-2,Math.PI/2+(S()-.5)*.8,7+(S()*12|0),S()*.3,1.5,0); crecer(S()*W,H+2,-Math.PI/2+(S()-.5)*.8,7+(S()*12|0),S()*.3,1.5,0); }
  for(let i=0;i<H/22;i++){ crecer(-2,S()*H,(S()-.5)*.8,7+(S()*(ancho?20:10)|0),S()*.3,1.5,0); crecer(W+2,S()*H,Math.PI+(S()-.5)*.8,7+(S()*(ancho?20:10)|0),S()*.3,1.5,0); }
  segs.sort((a,b)=>a.t-b.t);
  const trazo=s=>{ x.strokeStyle='rgba(150,200,235,.4)'; x.lineWidth=s.w+1.6; x.beginPath(); x.moveTo(s.x1,s.y1); x.lineTo(s.x2,s.y2); x.stroke();
    x.strokeStyle='rgba(255,255,255,.9)'; x.lineWidth=s.w; x.beginPath(); x.moveTo(s.x1,s.y1); x.lineTo(s.x2,s.y2); x.stroke(); };
  const velo=a=>{ const g=x.createRadialGradient(W/2,H/2,Math.min(W,H)*.32,W/2,H/2,Math.max(W,H)*.75); g.addColorStop(0,'rgba(220,238,252,0)'); g.addColorStop(1,`rgba(220,238,252,${a})`); x.fillStyle=g; x.fillRect(0,0,W,H); };
  if(instantaneo){ velo(.4); segs.forEach(trazo); return; }
  let i0=0; const t0=performance.now()+900;
  const paso=t=>{ if(!cv.isConnected) return; const tt=(t-t0)/1000*1.2;
    if(tt>0){ while(i0<segs.length&&segs[i0].t<=tt) trazo(segs[i0++]); if(tt<1.4) velo(.035); }
    if(i0<segs.length) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}

window.__mantTransicion=function(){
  const ms=document.getElementById('maintenanceScreen'); if(!ms||armada) return; armada=true;
  const reducido=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  ms.classList.add('mtx');
  ms.insertAdjacentHTML('afterbegin','<div class="mtx-azul"></div><div class="mtx-noche"></div><div class="mtx-cielo"></div><canvas class="mtx-hielo"></canvas><div class="mtx-nieve" aria-hidden="true"></div>');
  const W=()=>window.innerWidth, H=()=>window.innerHeight;
  const capaCielo=ms.querySelector('.mtx-cielo'), cv=ms.querySelector('.mtx-hielo'), nieve=ms.querySelector('.mtx-nieve');
  capaCielo.innerHTML=cielo(W(),H());
  for(let i=0;i<36;i++){ const e=document.createElement('i'), s=1.4+Math.random()*3.4; e.style.cssText=`left:${(Math.random()*100).toFixed(1)}%;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;--dx:${(Math.random()*60-30).toFixed(0)}px;animation-duration:${(8+Math.random()*8).toFixed(1)}s;animation-delay:-${(Math.random()*16).toFixed(1)}s`; nieve.appendChild(e); }
  // textos: la ventana redonda con el mundo de Pre-Navidad, título palabra por palabra y estado que va cambiando
  const t=ms.querySelector('.mt-t'), sub=ms.querySelector('.mt-s');
  t.innerHTML=['Una','<span class="oro">nueva</span>','<span class="oro">época</span>','está','llegando'].map((w,i)=>`<span class="w" style="transition-delay:${(i*.16).toFixed(2)}s">${w}</span>`).join(' ');
  sub.textContent='Estamos preparando la temporada navideña. La app vuelve en unos minutos, vestida de fiesta.';
  t.insertAdjacentHTML('beforebegin',`<div class="mtx-ventana" aria-hidden="true">${paisaje(260,260,150)}<div class="mtx-aro"></div></div><div class="mtx-ceja">INNOVA · Temporada navideña</div>`);
  sub.insertAdjacentHTML('afterend','<div class="mtx-estado" aria-live="polite"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10"/></svg><span></span><i></i></div><div class="mtx-hueco"></div>');
  const est=ms.querySelector('.mtx-estado span'), pts=ms.querySelector('.mtx-estado i'); let kf=0, kp=0;
  est.textContent=FRASES[0];
  if(!reducido){ setInterval(()=>{ est.classList.add('va'); setTimeout(()=>{ est.textContent=FRASES[++kf%FRASES.length]; est.classList.remove('va'); },400); },3400);
    setInterval(()=>{ pts.textContent='.'.repeat(kp++%4); },420); } else pts.textContent='…';
  // la secuencia: azul → escarcha → noche → se abre la ventana → título
  escarcha(cv,W(),H(),reducido);
  if(reducido) ms.classList.add('n1','n2','n3','n4');
  else [700,1400,3200,4300].forEach((ms_,i)=>setTimeout(()=>ms.classList.add('n'+(i+1)),ms_));
  // si cambia el tamaño (girar el teléfono, ventana de PC) se vuelven a dibujar el cielo y la escarcha, ya completos
  let tm=0; window.addEventListener('resize',()=>{ clearTimeout(tm); tm=setTimeout(()=>{ capaCielo.innerHTML=cielo(W(),H()); escarcha(cv,W(),H(),true); },250); });
};
})();
