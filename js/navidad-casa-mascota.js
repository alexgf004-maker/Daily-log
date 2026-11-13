// ── Navidad en casa (1–26 dic): «¡Listo, guardado!» con la mascota de protagonista ──
// Lo usa mostrarGuardadoOK en index.html. Solo dibuja; no toca cómo se guarda el registro.
// La mascota es el mismo personaje animado del login (con su gorro de Santa en esta etapa): se copia su dibujo con
// ids propios, como el compañero de adentro, y la mueve su propio GreenActor (30 cps). Sala cálida con guirnalda.
// Escena «Enciende el árbol»: entra de puntillas con un foquito encendido (tu registro), lo coloca en el árbol apagado
// estirando la mano (escena 'offer' + reachFor), el árbol se enciende en onda desde ese foco y al final la estrella;
// ella lo mira y se sonroja (tap3). Elegida entre 3 (árbol, regalo en la bota, huellita en el registro).
// Al terminar se llama alTexto() para mostrar el texto y los datos. Con movimiento reducido sale la escena final quieta.
const cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)), seg=(t,a,b)=>cl((t-a)/(b-a)), lerp=(a,b,t)=>a+(b-a)*t;
const eOut=t=>1-Math.pow(1-cl(t),3), eIO=t=>{t=cl(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
const P=Math.PI*2, rnd=s=>()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};
const reducido=()=>!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const NS='http://www.w3.org/2000/svg';

function conPrefijo(markup,p){
  const ids=[]; markup.replace(/\bid="([^"]+)"/g,(_,id)=>{ ids.push(id); return _; });
  markup=markup.replace(/\bid="([^"]+)"/g,(_,id)=>`id="${p}${id}" data-nv-part="${id}"`);
  ids.forEach(id=>{ markup=markup.split(`url(#${id})`).join(`url(#${p}${id})`).split(`href="#${id}"`).join(`href="#${p}${id}"`); });
  return markup.replace(/aria-labelledby="[^"]*"/g,'');
}
function crearMascota(cont,antes,MW,MH,animar){
  const plantilla=document.querySelector('#loginScreen .nv-mascota'); if(!plantilla) return null;
  const m=document.createElement('div'); m.className='nv-mascota nv-mascota-guardado'; m.setAttribute('aria-hidden','true');
  m.innerHTML=conPrefijo(plantilla.innerHTML,'nvmg-');
  m.querySelectorAll('[tabindex],[role]').forEach(e=>{ e.removeAttribute('tabindex'); e.removeAttribute('role'); e.removeAttribute('aria-label'); });
  m.style.cssText=`position:absolute;left:0;top:0;width:${MW}px;height:${MH}px;pointer-events:none;will-change:transform`;
  cont.insertBefore(m,antes);
  const svg=m.querySelector('svg'); if(!svg){ m.remove(); return null; }
  let actor=null;
  if(typeof GreenActor==='function'){ try{ actor=new GreenActor(svg,{embedded:true,idPrefix:'nvmg-',initialScene:'idle'});
    if(!animar){ actor.render(0); actor.pause(); } }catch(e){ actor=null; } }   // movimiento reducido: su pose de reposo, quieta
  const hechos=new Set(), mano=m.querySelector('[data-nv-part="hand-right"]');
  const aEscena=(x,y)=>{ const r=cont.getBoundingClientRect(); return window.NavidadEntorno?.point(svg,{x:x+r.left,y:y+r.top}); };
  return { m, svg, actor,
    una(k,fn){ if(!hechos.has(k)){ hechos.add(k); try{ fn(); }catch(e){} } },
    poner(cx,pie,a=1){ m.style.transform=`translate(${(cx-MW/2).toFixed(1)}px,${(pie-MH*.923).toFixed(1)}px)`; m.style.opacity=cl(a).toFixed(3); },
    mirar(x,y,s=.5){ const q=aEscena(x,y); if(q&&actor) actor.lookAt(q,s); },
    alcanzar(x,y){ const q=aEscena(x,y); if(q&&actor) actor.reachFor(q); },
    mano(){ if(!mano) return null; const r=mano.getBoundingClientRect(), c=cont.getBoundingClientRect(); if(!r.width) return null; return {x:r.left+r.width/2-c.left, y:r.top+r.height/2-c.top}; },
    destruir(){ try{ actor?.destroy(); }catch(e){} m.remove(); } };
}

// La sala: fondo cálido de madera, luces desenfocadas, piso y la guirnalda (se pinta una vez)
function sala(fx,W,H,piso){
  const R=rnd(9); let g=fx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#2a110a'); g.addColorStop(.6,'#3d170d'); g.addColorStop(1,'#1a0805'); fx.fillStyle=g; fx.fillRect(0,0,W,H);
  for(let i=0;i<W;i+=26){ fx.fillStyle='rgba(255,210,150,.03)'; fx.fillRect(i,0,12,H); }
  for(let i=0;i<26;i++){ const c=['255,190,90','255,120,90','140,230,170','255,220,150','120,180,255'][Math.floor(R()*5)], x=R()*W, y=R()*piso*.85, r=12+R()*40, a=.05+R()*.12;
    const q=fx.createRadialGradient(x,y,0,x,y,r); q.addColorStop(0,`rgba(${c},${a})`); q.addColorStop(1,`rgba(${c},0)`); fx.fillStyle=q; fx.beginPath(); fx.arc(x,y,r,0,P); fx.fill(); }
  g=fx.createLinearGradient(0,piso,0,H); g.addColorStop(0,'#5a2c16'); g.addColorStop(.15,'#3e1d0e'); g.addColorStop(1,'#1c0c05'); fx.fillStyle=g; fx.fillRect(0,piso,W,H-piso);
  fx.fillStyle='rgba(255,200,140,.1)'; fx.fillRect(0,piso,W,2);
  for(let x=-40;x<W;x+=70){ fx.strokeStyle='rgba(0,0,0,.18)'; fx.lineWidth=1; fx.beginPath(); fx.moveTo(x,piso); fx.lineTo(x-60,H); fx.stroke(); }
  fx.strokeStyle='#1f5a38'; fx.lineWidth=14; fx.lineCap='round'; fx.beginPath(); fx.moveTo(-10,24); for(let i=0;i<=6;i++) fx.quadraticCurveTo(i*W/6-W/12,52,i*W/6,24); fx.stroke();
}
const glow=(x,c,px,py,r,a)=>{ if(a<=0) return; const g=x.createRadialGradient(px,py,0,px,py,r); g.addColorStop(0,`rgba(${c},${a})`); g.addColorStop(1,`rgba(${c},0)`); x.fillStyle=g; x.beginPath(); x.arc(px,py,r,0,P); x.fill(); };
function foquito(x,px,py,c,a,s=1,rot=0){   // foco de guirnalda (vidrio de color con su casquillo)
  x.save(); x.translate(px,py); x.rotate(rot); x.scale(s,s);
  x.fillStyle='#8b6b3a'; x.fillRect(-3.2,-11,6.4,5);
  x.fillStyle=a>0?`rgb(${c})`:'#3a2a26'; x.beginPath(); x.ellipse(0,0,5.4,7.6,0,0,P); x.fill();
  x.fillStyle=`rgba(255,255,255,${.25+.45*a})`; x.beginPath(); x.ellipse(-1.8,-2.6,1.4,2.6,0,0,P); x.fill(); x.restore(); }

// cont: contenedor de la escena (ocupa la pantalla, detrás del texto). Devuelve { detener, duracion }.
export function escenaMascotaCasaNV(cont,{alTexto}={}){
  const quieto=reducido();
  const W=Math.max(320,cont.clientWidth||innerWidth), H=Math.max(480,cont.clientHeight||innerHeight), D=Math.min(1.5,window.devicePixelRatio||1);
  const cv=()=>{ const c=document.createElement('canvas'); c.width=Math.round(W*D); c.height=Math.round(H*D); const x=c.getContext('2d'); x.setTransform(D,0,0,D,0,0); return {c,x}; };
  const F=cv(), V=cv(), sv=document.createElementNS(NS,'svg'); sv.setAttribute('viewBox',`0 0 ${W} ${H}`); sv.setAttribute('aria-hidden','true');
  cont.appendChild(F.c); cont.appendChild(sv); cont.appendChild(V.c);
  const piso=Math.min(H*.78,H-170), MW=Math.min(330,W*.8), MH=MW*1067/800, sc=MW/800;
  sala(F.x,W,H,piso);
  const MAS=crearMascota(cont,V.c,MW,MH,!quieto), A=MAS?.actor, vx=V.x;
  const FOCOS=Array.from({length:13},(_,i)=>({x:i*W/12,y:30+Math.sin(i*1.3)*8,c:['255,80,90','255,210,90','120,220,150','120,190,255'][i%4]}));
  const COL=['255,70,85','255,205,80','110,225,150','110,180,255','255,130,220'];
  const mx=Math.max(MW*.36,W*.3);                           // donde se para la mascota (centro), a la izquierda
  const hombro=()=>({x:mx-MW/2+444*sc, y:piso-MH*.923+580*sc}), alcance=mx-MW/2+735*sc;   // hasta dónde llega su mano (con el paso que da)
  const chis=Array.from({length:18},(_,i)=>({a:i/18*P+(i%3)*.2,v:50+((i*37)%60),r:1.3+(i%4)*.5}));
  let texto=false, extra=()=>{}; const fin=6.8, llegada=1.55;

  // ── «Enciende el árbol»: entra con su foquito (tu registro), lo coloca en el árbol apagado y todo se enciende ──
  const tx=Math.min(W-80,alcance+50), base=piso+4, alto=Math.min(360,piso-120), ancho=alto*.5, top=base-alto;
  const capas=[[.0,.34],[.24,.62],[.5,1]].map(([a,b])=>({y0:top+alto*a*.86,y1:top+alto*b*.86,w:ancho*(.42+.58*b)}));
  const capaD=c=>`M${tx} ${c.y0} L${tx+c.w/2} ${c.y1} Q${tx} ${c.y1+12} ${tx-c.w/2} ${c.y1} Z`;   // de la capa de abajo a la de arriba
  const ss=hombro(); const SLOT={x:Math.min(tx-ancho*.16,alcance-6), y:Math.max(ss.y-30,top+alto*.52)};
  const R=rnd(4), focos=[];
  for(let i=0;i<22;i++){ const v=.12+.82*R(), y=top+alto*.86*v, w=ancho*(.18+.78*v)*.5, x=tx+(R()*2-1)*w*.8; focos.push({x,y,c:COL[i%5],d:0}); }
  focos.push({x:SLOT.x,y:SLOT.y,c:'255,205,80',d:0,mio:true});
  focos.forEach(f=>f.d=Math.hypot(f.x-SLOT.x,f.y-SLOT.y));
  const dmax=Math.max(...focos.map(f=>f.d));
  sv.innerHTML=`<defs><linearGradient id="nvmA" x1="0" x2="1"><stop offset="0" stop-color="#0f3d24"/><stop offset=".5" stop-color="#1d6b3c"/><stop offset="1" stop-color="#0c3320"/></linearGradient></defs>
    <rect x="${tx-9}" y="${base-alto*.16}" width="18" height="${alto*.16}" fill="#5a3418"/>
    <path d="M${tx-26} ${base} h52 l-6 -26 h-40 z" fill="#b8152b"/><path d="M${tx-26} ${base-14} h52" stroke="#e8b543" stroke-width="3"/>
    ${capas.slice().reverse().map(c=>`<path d="${capaD(c)}" fill="url(#nvmA)" stroke="#0a2a17" stroke-width="2" stroke-linejoin="round"/><path d="M${tx-c.w*.42} ${c.y1-4} Q${tx} ${c.y1+8} ${tx+c.w*.42} ${c.y1-6}" stroke="#e8f4ff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".5"/>`).join('')}
    <ellipse id="nvmSom" cx="${mx}" cy="${piso+4}" rx="${MW*.2}" ry="9" fill="rgba(15,3,0,.45)"/>
    <path d="M${tx} ${top-22} l6 13 14 1 -11 9 4 14 -13 -8 -13 8 4 -14 -11 -9 14 -1z" id="nvmEst" fill="#6b5a2a" stroke="#3a2a10" stroke-width="1.5"/>`;
  const est=sv.querySelector('#nvmEst'), som=sv.querySelector('#nvmSom');   // sombra en el piso (no un filtro CSS sobre algo que se mueve)
  let puesto=false;
  extra=(t,mano)=>{
    // cuándo se enciende cada foco: en onda desde el que coloca
    const tE=3.15, enc=f=>f.mio?(puesto?1:0):eOut(seg(t,tE+.08+f.d/dmax*.7,tE+.25+f.d/dmax*.7));
    if(t>3.05&&!puesto){ puesto=true; }
    const brillo=seg(t,tE+.5,tE+1.2);
    glow(vx,'255,200,120',tx,top+alto*.5,alto*.75,.22*brillo);
    focos.forEach((f,i)=>{ if(f.mio&&!puesto) return; const a=enc(f); const tw=a*(.75+.25*Math.sin(t*5+i*1.7)); glow(vx,f.c,f.x,f.y,15,.55*tw); foquito(vx,f.x,f.y,f.c,tw,.8); });
    const es=seg(t,tE+.85,tE+1.05); est.setAttribute('fill',es>0?'#ffd84a':'#6b5a2a'); est.setAttribute('stroke',es>0?'#fff1a8':'#3a2a10');
    if(es>0){ glow(vx,'255,230,120',tx,top-12,70,.55*(1-.3*seg(t,tE+1.1,tE+2))+.1*Math.sin(t*6)); const k=seg(t,tE+.9,tE+1.7); if(k<1) chis.forEach(c=>{ const dd=10+c.v*eOut(k); vx.fillStyle=`rgba(255,236,150,${(1-k).toFixed(3)})`; vx.beginPath(); vx.arc(tx+Math.cos(c.a)*dd,top-12+Math.sin(c.a)*dd,c.r,0,P); vx.fill(); }); }
    // el foquito en su mano hasta que lo coloca
    const m=puesto?null:mano();
    if(m){ glow(vx,'255,205,80',m.x,m.y-6,18,.5+.2*Math.sin(t*8)); foquito(vx,m.x+2,m.y-8,'255,205,80',1,.95,.35); }
    const xm=lerp(-MW*.45,mx,eIO(seg(t,.15,llegada))); som.setAttribute('cx',xm.toFixed(1));
    if(!MAS) return; MAS.poner(xm,piso,1);
    if(t<llegada) MAS.una('entra',()=>A?.play('sneak')); else MAS.una('quieta',()=>A?.play('idle'));
    if(t>llegada&&t<1.85) MAS.mirar(SLOT.x,SLOT.y);
    if(t>1.8) MAS.una('pone',()=>{ MAS.alcanzar(SLOT.x,SLOT.y); A?.play('offer'); });
    if(t>tE+.75) MAS.mirar(tx,top,1); if(t>tE+1.2) MAS.una('orgullo',()=>{ A?.reachFor(null); A?.play('tap3'); });
  };

  function cuadro(t){
    vx.clearRect(0,0,W,H);
    FOCOS.forEach((f,i)=>{ glow(vx,f.c,f.x,f.y,14,.55+.3*Math.sin(t*4+i)); vx.fillStyle=`rgb(${f.c})`; vx.beginPath(); vx.arc(f.x,f.y,3.4,0,P); vx.fill(); });
    extra(t,()=>MAS&&!quieto?MAS.mano():null);
    if(!texto&&t>4.2){ texto=true; alTexto&&alTexto(); }
  }
  if(quieto){ MAS&&MAS.poner(mx,piso,1); cuadro(6); texto=true; alTexto&&alTexto(); return {detener(){ MAS?.destruir(); }, duracion:3.2}; }
  let raf=0, parado=false; const t0=performance.now();
  (function paso(n){ raf=0; if(parado||!sv.isConnected) return; const t=(n-t0)/1000; cuadro(Math.max(0,t)); if(t<fin) raf=requestAnimationFrame(paso); })(t0);
  return {detener(){ parado=true; if(raf) cancelAnimationFrame(raf); MAS?.destruir(); }, duracion:fin};
}
