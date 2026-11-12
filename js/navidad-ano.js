// ── Año Nuevo (28 dic–4 ene): escena del login «Pólvora en la terraza» ──
// El volcán de San Salvador (ancho, cima achatada y El Picacho a un lado) con la ciudad encendida a sus pies, cohetes
// de colores sin parar y, al tocar el cielo, el tuyo. En primer plano una terraza: piso de barro, baranda de madera,
// guirnaldas de bombillos y una mesa con mantel, las 12 uvas, un frasco de estrellitas chisporroteando y una cajita de
// cohetillos. La tarjeta lleva un cordón de foquitos de colores; «Recordar» es una estrellita y una mecha prendida
// recorre el botón «Ingresar» (eso es CSS, en css/temas/navidad.css).
// La mascota no se toca: solo se lee dónde están sus pies para que el piso de la terraza quede ahí (la baranda queda
// detrás de ella) y la escena se vuelve a armar si cambia el tamaño de la pantalla, la tarjeta o la mascota.
// Cuando estalla un cohete avisa a la mascota (evento navidad:entorno «destello», como antes; máximo cada 6 s).
// Rendimiento: lo fijo es SVG que se arma una vez por tamaño; la pólvora va en un <canvas> a resolución tope 1.5× que
// solo corre con el login a la vista y se detiene del todo si no. Con movimiento reducido no hay cohetes automáticos.
// La usa armarAno() en js/navidad.js: window.__nvAno(capa) → { detener() }.
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const COLS=['#ff4a5a','#ffcf3a','#3ee08f','#4fb8ff','#ff7ad9'];
const PAL=[['#ff4a5a','#ffd1d6'],['#ffcf3a','#fff1c0'],['#3ee08f','#d9ffe9'],['#4fb8ff','#e0f3ff'],['#ff7ad9','#ffe0f5'],['#ffffff','#ffe9a8']];
const TIPOS=['peonia','peonia','anillo','sauce','crepita'];
const svg=(w,h,inner,cls)=>`<svg class="${cls}" xmlns="${NS}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none" aria-hidden="true">${inner}</svg>`;
const semilla=s=>()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; };
const R=(a,b)=>a+Math.random()*(b-a);
// pies de la mascota y orilla de abajo de la tarjeta, en coordenadas de la capa
function medidas(capa){ const c=capa.getBoundingClientRect(), m=document.querySelector('#loginScreen .nv-mascota'), f=document.querySelector('#loginScreen .login-form');
  const mr=m&&m.offsetWidth?m.getBoundingClientRect():null, fr=f?f.getBoundingClientRect():{left:0,right:0,bottom:c.top+c.height*.7};
  return { pies: mr?{x:mr.left+mr.width/2-c.left, y:mr.bottom-mr.height*.02-c.top, w:mr.width}:null, tarjeta:{x0:fr.left-c.left,x1:fr.right-c.left,y1:fr.bottom-c.top} }; }

function escena({capa,fondo,frente,W,H,ls}){
  const S=semilla(3), r=(a,b)=>a+S()*(b-a), M=medidas(capa), PC=W>700;
  fondo.innerHTML=''; frente.innerHTML='';
  // estrellas
  let p=''; for(let i=0;i<Math.round(W*H/7000);i++) p+=`<circle class="${i%2?'t':''}" style="animation-delay:-${(i%8*.4).toFixed(1)}s" cx="${r(0,W).toFixed(0)}" cy="${r(0,H*.55).toFixed(0)}" r="${r(.4,1.2).toFixed(1)}" fill="#fff" opacity="${r(.3,.9).toFixed(2)}"/>`;
  fondo.insertAdjacentHTML('beforeend',svg(W,H,p,'nva-cielo'));
  // la terraza: el piso llega a los pies de la mascota; la baranda queda detrás de ella
  const pieY=M.pies?Math.min(H-24,M.pies.y):H-40, borde=pieY-6, TH=H-borde+110, yd=TH-(H-borde);   // yd: orilla del piso en la svg
  const rail=yd-52;
  // volcán: entre la tarjeta y la baranda en el celular; grande detrás de todo en la PC
  const VH=PC?Math.min(330,borde-52-H*.25):Math.max(96,(borde-52)-M.tarjeta.y1+30);
  const vx=PC?W*.64:W*.5, vw=PC?Math.min(W*.9,980):W*1.15, top=VH*.16;
  const vol=`M${vx-vw/2-60} ${VH} C${vx-vw*.36} ${VH*.6} ${vx-vw*.22} ${top+16} ${vx-vw*.12} ${top+5} L${vx-vw*.06} ${top} L${vx+vw*.02} ${top+4} L${vx+vw*.07} ${top-VH*.07} C${vx+vw*.1} ${top-VH*.1} ${vx+vw*.13} ${top-VH*.05} ${vx+vw*.16} ${top+VH*.05} C${vx+vw*.28} ${top+VH*.2} ${vx+vw*.4} ${VH*.64} ${vx+vw/2+60} ${VH} Z`;
  const lejos=`M-20 ${VH} C${W*.15} ${VH*.74} ${W*.3} ${VH*.66} ${W*.42} ${VH*.74} C${W*.6} ${VH*.82} ${W*.85} ${VH*.64} ${W+20} ${VH*.72} V${VH} Z`;
  let luces=''; for(let i=0;i<Math.round(W/1.8);i++){ const x=r(-10,W+10), y=VH-r(2,VH*.26)*Math.pow(S(),1.7); luces+=`<circle class="${i%4?'':'lz'}" style="animation-delay:-${(i%8*.3).toFixed(1)}s" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r(.5,1.3).toFixed(1)}" fill="${S()<.75?'#ffcf7a':S()<.5?'#ffffff':'#9fd0ff'}" opacity="${r(.5,1).toFixed(2)}"/>`; }
  let humo=""; for(let i=0;i<5;i++) humo+=`<ellipse filter="url(#nvaBf)" cx="${r(0,W).toFixed(0)}" cy="${(VH*r(.1,.5)).toFixed(0)}" rx="${r(60,160).toFixed(0)}" ry="${r(8,18).toFixed(0)}" fill="#c9a6d8" opacity="${r(.05,.12).toFixed(2)}"/>`;
  fondo.insertAdjacentHTML('beforeend',svg(W,VH,`<defs><filter id="nvaBf" x="-50%" y="-50%" width="200%" height="200%"><feGaussinvaBlur stdDeviation="10"/></filter><linearGradient id="nvaBv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a66"/><stop offset=".5" stop-color="#241a48"/><stop offset="1" stop-color="#150f30"/></linearGradient><linearGradient id="nvaBl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2c6a"/><stop offset="1" stop-color="#2a1a48"/></linearGradient><linearGradient id="nvaBh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a6a" stop-opacity="0"/><stop offset="1" stop-color="#ff9a6a" stop-opacity=".4"/></linearGradient></defs>
    ${humo}<path d="${lejos}" fill="url(#nvaBl)"/><path d="${vol}" fill="url(#nvaBv)"/><path d="${vol}" fill="none" stroke="#b58ad8" stroke-opacity=".35" stroke-width="1.4"/>
    <rect x="0" y="${VH*.5}" width="${W}" height="${VH*.5}" fill="url(#nvaBh)"/>${luces}`,'nva-volcan'));
  const ve=fondo.querySelector('.nva-volcan'); ve.style.bottom=(H-(borde-50))+'px'; ve.style.height=VH+'px';
  let t='';
  // piso de la terraza (barro cocido) en perspectiva
  t+=`<path d="M0 ${yd}H${W}V${TH}H0Z" fill="url(#nvaBp)"/>`;
  for(let i=-8;i<=8;i++){ const xa=W/2+i*W/14, xb=W/2+i*W/5; t+=`<path d="M${xa.toFixed(0)} ${yd}L${xb.toFixed(0)} ${TH}" stroke="#4a1e14" stroke-opacity=".35" stroke-width="1"/>`; }
  [0.25,0.55].forEach(u=>{ const y=yd+(TH-yd)*u*u*1.4; t+=`<path d="M0 ${y.toFixed(0)}H${W}" stroke="#4a1e14" stroke-opacity=".3" stroke-width="1"/>`; });
  t+=`<rect x="0" y="${yd}" width="${W}" height="3" fill="#ffb27a" opacity=".25"/>`;
  // baranda de madera
  t+=`<rect x="0" y="${rail}" width="${W}" height="7" rx="2" fill="url(#nvaBm)"/><rect x="0" y="${rail-1}" width="${W}" height="1.5" fill="#ffcf9a" opacity=".4"/>`;
  for(let x=8;x<W;x+=PC?26:22) t+=`<rect x="${x}" y="${rail+7}" width="6" height="${yd-rail-7}" rx="2.5" fill="url(#nvaBb)"/>`;
  t+=`<rect x="0" y="${yd-6}" width="${W}" height="6" fill="#3a1a10"/>`;
  // postes y guirnalda de bombillos
  const tramos=Math.max(2,Math.round(W/(PC?260:190))), gy=rail-58;
  for(let k=0;k<=tramos;k++){ const x=k*W/tramos; t+=`<rect x="${(x-2.5).toFixed(0)}" y="${gy-6}" width="5" height="${rail-gy+6}" fill="#2a160e"/>`; }
  for(let k=0;k<tramos;k++){ const a=k*W/tramos, b=(k+1)*W/tramos, m=(a+b)/2, cy=gy+30;
    t+=`<path d="M${a} ${gy}Q${m} ${cy} ${b} ${gy}" stroke="#241410" stroke-width="1.4" fill="none"/>`;
    for(let j=1;j<8;j++){ const u=j/8, X=(1-u)*(1-u)*a+2*(1-u)*u*m+u*u*b, Y=(1-u)*(1-u)*gy+2*(1-u)*u*cy+u*u*gy;
      t+=`<g class="bb" style="animation-delay:-${(j%8*.3).toFixed(1)}s"><circle cx="${X.toFixed(1)}" cy="${(Y+8).toFixed(1)}" r="11" fill="#ffcf7a" opacity=".22"/><rect x="${(X-1.8).toFixed(1)}" y="${(Y-1).toFixed(1)}" width="3.6" height="4" fill="#3a2a20"/><circle cx="${X.toFixed(1)}" cy="${(Y+7).toFixed(1)}" r="4.6" fill="#ffe6a8"/><circle cx="${(X-1.3).toFixed(1)}" cy="${(Y+5.6).toFixed(1)}" r="1.4" fill="#fff"/></g>`; } }
  // mesa con mantel, las 12 uvas y un frasco de estrellitas (sobre el piso, a la izquierda)
  const K=PC?1.6:1.25, mx=PC?Math.max(170,M.tarjeta.x0-150):Math.min(W*.3,110), my=yd+(PC?26:16);
  t+=`<g transform="translate(${mx} ${my}) scale(${K})">
    <ellipse cx="0" cy="2" rx="62" ry="5" fill="#000" opacity=".25"/>
    <path d="M-40 -2V-34M40 -2V-34" stroke="#5a2a18" stroke-width="4"/>
    <path d="M-58 -34H58L60 -30H-60Z" fill="#7a3a24"/><path d="M-60 -38H60V-31H-60Z" fill="#fff4e6"/><path d="M-60 -31Q-45 -20 -30 -31Q-15 -20 0 -31Q15 -20 30 -31Q45 -20 60 -31" fill="#fff4e6" stroke="#e8d4bc" stroke-width=".6"/>
    <path d="M-52 -31L-48 -24M-22 -31L-18 -24M8 -31L12 -24M38 -31L42 -24" stroke="#e8433a" stroke-width="1.6"/>
    <g transform="translate(-22 -42)"><ellipse cx="0" cy="0" rx="20" ry="5" fill="#d8e6f2" stroke="#9fb4c8" stroke-width=".8"/><path d="M-20 0Q-18 9 0 10Q18 9 20 0" fill="#c4d6e8" stroke="#9fb4c8" stroke-width=".8"/>
      ${[[-12,-3],[-6,-5],[0,-6],[6,-5],[12,-3],[-9,-9],[-3,-10],[3,-10],[9,-9],[-6,-14],[0,-15],[6,-14]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="3.6" fill="${i%3?'#7cc04a':'#8a3a8a'}" stroke="${i%3?'#4a8a2a':'#5a1a5a'}" stroke-width=".6"/><circle cx="${x-1.1}" cy="${y-1.2}" r="1" fill="#fff" opacity=".55"/>`).join('')}
      <path d="M0 -18q2 -4 5 -5" stroke="#5a3a1a" stroke-width="1" fill="none"/></g>
    <g transform="translate(24 -40)"><path d="M-9 0V-20Q-9 -24 -5 -24H5Q9 -24 9 -20V0Z" fill="#cfe6f5" fill-opacity=".5" stroke="#9fc4dc" stroke-width=".8"/><rect x="-10" y="-27" width="20" height="4" rx="1" fill="#c9a03a"/>
      ${[-5,-1,3,6].map((x,i)=>`<path d="M${x} -22L${x+(i-1.5)*5} -50" stroke="#7a7a82" stroke-width="1.1"/><circle class="nva-pt" cx="${x+(i-1.5)*5}" cy="-50" r="2.4" fill="#fff6c8"/>`).join('')}</g>
    <g transform="translate(50 -46) rotate(8)"><rect x="-7" y="-8" width="14" height="10" rx="1.5" fill="#e8433a"/><rect x="-7" y="-8" width="14" height="3" fill="#ffcf3a"/><path d="M-3 -8V-13M2 -8V-12" stroke="#5a3a2a" stroke-width="1"/></g></g>`;
  frente.insertAdjacentHTML('beforeend',svg(W,TH,`<defs><linearGradient id="nvaBm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a4a2a"/><stop offset="1" stop-color="#4a2414"/></linearGradient><linearGradient id="nvaBb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a1e12"/><stop offset=".4" stop-color="#6a3a22"/><stop offset="1" stop-color="#2a140c"/></linearGradient><linearGradient id="nvaBp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a3a2a"/><stop offset="1" stop-color="#4a1a14"/></linearGradient></defs>${t}`,'nva-terraza'));
  const te=frente.querySelector('.nva-terraza'); te.style.height=TH+'px';
  // chispas de las estrellitas
  const ch=document.createElement('div'); ch.className='nva-chispas'; ch.style.cssText='position:absolute;inset:0'; frente.appendChild(ch);
  requestAnimationFrame(()=>{ const cr=frente.getBoundingClientRect(); te.querySelectorAll('.nva-pt').forEach(pt=>{ const q=pt.getBoundingClientRect(), cx=q.left+q.width/2-cr.left, cy=q.top+q.height/2-cr.top;
    const g=document.createElement('b'); g.style.cssText=`position:absolute;left:${cx-9}px;top:${cy-9}px;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,rgba(255,240,180,.95),rgba(255,190,80,0) 70%)`; ch.appendChild(g);
    for(let k=0;k<8;k++){ const i=document.createElement('i'), a=k/8*6.283+S(); i.style.left=cx+'px'; i.style.top=cy+'px'; i.style.setProperty('--x',(Math.cos(a)*r(10,22)).toFixed(1)+'px'); i.style.setProperty('--y',(Math.sin(a)*r(10,22)+8).toFixed(1)+'px'); i.style.animationDelay=(-r(0,.7)).toFixed(2)+'s'; i.style.animationDuration=r(.45,.8).toFixed(2)+'s'; ch.appendChild(i); } }); });
}

function tarjeta(){
  // cordón de foquitos de colores sobre la orilla de arriba de la tarjeta
  const f=document.querySelector('#loginScreen .login-form'); if(!f||f.querySelector('.nva-foquitos')) return;
  let g=''; for(let i=0;i<14;i++){ const x=8+i*(284/13), y=4+Math.sin(i/13*Math.PI)*6; g+=`<circle cx="${x.toFixed(1)}" cy="${(y+7).toFixed(1)}" r="4" fill="${COLS[i%5]}"/><circle cx="${x.toFixed(1)}" cy="${(y+7).toFixed(1)}" r="8" fill="${COLS[i%5]}" opacity=".25"/>`; }
  f.insertAdjacentHTML('afterbegin',`<svg class="nva-foquitos nv-extra" viewBox="0 0 300 22" preserveAspectRatio="none"><path d="M0 4Q150 16 300 4" stroke="#3a2a3a" stroke-width="1.2" fill="none"/>${g}</svg>`);
}

window.__nvAno=function(capa){
  const ls=document.getElementById('loginScreen'), reducido=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  const fondo=document.createElement('div'); fondo.className='nva-fondo';
  const cv=document.createElement('canvas'); cv.className='nva-polvora';
  const frente=document.createElement('div'); frente.className='nva-frente';
  capa.append(fondo,cv,frente);
  const x=cv.getContext('2d'); let W=0,H=0,vivo=true,firma='';
  const medir=()=>{ const d=Math.min(1.25,window.devicePixelRatio||1); W=capa.clientWidth; H=capa.clientHeight; cv.width=Math.round(W*d); cv.height=Math.round(H*d); x.setTransform(d,0,0,d,0,0); };
  // la escena se arma de nuevo solo si cambian el tamaño o el lugar de la mascota/tarjeta
  const armar=()=>{ if(!vivo) return; medir(); const M=medidas(capa), f=[W,H,M.pies?Math.round(M.pies.y):0,Math.round(M.tarjeta.y1)].join(',');
    if(f===firma||!W||!H) return; firma=f; escena({capa,fondo,frente,W,H,ls}); };
  let pend=0; const programar=()=>{ if(!pend) pend=requestAnimationFrame(()=>{ pend=0; armar(); }); };
  const ro=typeof ResizeObserver==='function'?new ResizeObserver(programar):null;
  if(ro){ ro.observe(capa); const m=ls.querySelector('.nv-mascota'), f=ls.querySelector('.login-form'); if(m) ro.observe(m); if(f) ro.observe(f); }
  window.addEventListener('resize',programar); armar(); const t1=setTimeout(programar,600), t2=setTimeout(programar,1600);
  tarjeta();
  // pólvora
  const coh=[], chis=[]; let prox=0, flash=0, ultAviso=0, raf=0, ult=0;
  const piso=()=>H*.7;
  const lanzar=(tx,ty)=>{ if(!W) return; const x0=tx!=null?tx+R(-20,20):R(W*.08,W*.92), y0=piso(), dest=ty!=null?ty:R(H*.08,Math.min(H*.4,y0-120));
    const vy=-Math.sqrt(2*.06*Math.max(60,y0-dest)); coh.push({x:x0,y:y0,vx:tx!=null?(tx-x0)/(Math.abs(vy)/.06):R(-.3,.3),vy,col:PAL[(Math.random()*PAL.length)|0],cola:[],tipo:TIPOS[(Math.random()*TIPOS.length)|0]}); };
  const estalla=k=>{ const n=k.tipo==='sauce'?70:k.tipo==='anillo'?60:90;
    for(let i=0;i<n;i++){ const a=i/n*6.283+R(-.05,.05), s=k.tipo==='anillo'?2.8:k.tipo==='sauce'?R(1.2,2.6):R(.6,3.4);
      chis.push({x:k.x,y:k.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,v:1,col:Math.random()<.65?k.col[0]:k.col[1],tipo:k.tipo}); }
    flash=1; const ahora=performance.now();
    if(ahora-ultAviso>6000&&ls.classList.contains('active')){ ultAviso=ahora; const b=capa.getBoundingClientRect(); ls.dispatchEvent(new CustomEvent('navidad:entorno',{detail:{kind:'destello',x:b.left+k.x,y:b.top+k.y}})); } };
  const toque=e=>{ if(!vivo||e.target.closest('.login-form,.login-footer,button,input,label,.nv-mascota')) return; const r=capa.getBoundingClientRect(), ty=e.clientY-r.top; if(ty<piso()-80){ lanzar(e.clientX-r.left,ty); seguir(); } };
  ls.addEventListener('pointerdown',toque);
  const aLaVista=()=>!document.hidden&&ls.classList.contains('active');
  // 30 cuadros por segundo: todo avanza con el tiempo (k), así se ve igual de rápido con menos trabajo
  const cuadro=t=>{ raf=0; if(!vivo||!aLaVista()) return;
    if(ult&&t-ult<31){ raf=requestAnimationFrame(cuadro); return; }
    const k=ult?Math.min(3,(t-ult)/16.67):1; ult=t;
    x.clearRect(0,0,W,H);
    if(!reducido&&t>prox){ lanzar(); if(Math.random()<.3) setTimeout(lanzar,240); prox=t+R(700,1300); }
    if(flash>0){ x.fillStyle=`rgba(255,190,160,${(flash*.06).toFixed(3)})`; x.fillRect(0,0,W,H); flash-=.03*k; }
    for(let i=coh.length-1;i>=0;i--){ const c=coh[i]; c.cola.push([c.x,c.y]); if(c.cola.length>14) c.cola.shift(); c.x+=c.vx*k; c.y+=c.vy*k; c.vy+=.06*k;
      const g=x.createLinearGradient(c.cola[0][0],c.cola[0][1],c.x,c.y); g.addColorStop(0,'rgba(255,220,170,0)'); g.addColorStop(1,'rgba(255,236,200,.9)');
      x.strokeStyle=g; x.lineWidth=1.8; x.beginPath(); c.cola.forEach((p,j)=>j?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.stroke();
      x.fillStyle='#fff6dc'; x.beginPath(); x.arc(c.x,c.y,1.6,0,7); x.fill();
      if(c.vy>=-.5){ estalla(c); coh.splice(i,1); } }
    x.globalCompositeOperation='lighter';
    for(let i=chis.length-1;i>=0;i--){ const p=chis[i], sa=p.tipo==='sauce', fr=Math.pow(sa?.976:.982,k);
      p.x+=p.vx*k; p.y+=p.vy*k; p.vx*=fr; p.vy=p.vy*fr+(sa?.045:.035)*k; p.v-=(sa?.0068:.0115)*k;
      if(p.v<=0){ chis.splice(i,1); continue; }
      const al=p.tipo==='crepita'&&p.v<.45?(Math.random()<.5?p.v*2:0):p.v;
      x.strokeStyle=p.col; x.globalAlpha=al*.55; x.lineWidth=sa?1.5:1.2; x.beginPath(); x.moveTo(p.x-p.vx*(sa?8:4),p.y-p.vy*(sa?8:4)); x.lineTo(p.x,p.y); x.stroke();
      x.fillStyle=p.col; x.globalAlpha=al; x.beginPath(); x.arc(p.x,p.y,1.6,0,7); x.fill(); x.globalAlpha=al*.18; x.beginPath(); x.arc(p.x,p.y,5,0,7); x.fill(); }
    x.globalAlpha=1; x.globalCompositeOperation='source-over';
    // con movimiento reducido solo se dibuja mientras haya un cohete tuyo en el aire
    if(!reducido||coh.length||chis.length) raf=requestAnimationFrame(cuadro); else x.clearRect(0,0,W,H);
  };
  function seguir(){ if(!raf&&vivo&&aLaVista()){ ult=0; raf=requestAnimationFrame(cuadro); } }
  const mo=new MutationObserver(seguir); mo.observe(ls,{attributes:true,attributeFilter:['class']}); document.addEventListener('visibilitychange',seguir);
  if(!reducido) seguir();
  return { detener(){ vivo=false; if(raf) cancelAnimationFrame(raf); if(pend) cancelAnimationFrame(pend); clearTimeout(t1); clearTimeout(t2); if(ro) ro.disconnect(); mo.disconnect();
    window.removeEventListener('resize',programar); document.removeEventListener('visibilitychange',seguir); ls.removeEventListener('pointerdown',toque); },
    tam(){ return [W,H]; } };
};
})();
