// ── Navidad en casa (22–27 dic): escena del login «El árbol» ──
// Ilustración pintada en canvas: sala cálida con luces desenfocadas, piso de madera, un árbol frondoso de verdad
// (ramas aguja por aguja) con listón dorado, esferas con reflejos, foquitos y estrella con rayos; en PC un segundo
// árbol desenfocado al fondo y regalos con volumen. Se arma alrededor de lo fijo del login (logo, nombre y tarjeta) y
// del lugar donde está la mascota del login: el piso queda a la altura de sus pies, el árbol principal a su lado y un
// charco de luz cálida debajo de ella; regalos, adornos y destellos no caen encima. La mascota no se toca: solo se lee
// su posición (si cambia de lugar o de tamaño, la escena se vuelve a armar).
// Dos capas: la fija se pinta una vez (y al cambiar el tamaño); la viva (luces que respiran, nieve, destellos) corre
// solo con el login a la vista. Con movimiento reducido, la viva se pinta una vez y queda quieta.
// El árbol se arma por pisos sólidos (sin huecos) con puntas de agujas, sombra de piso a piso, guirnaldas
// doradas continuas, tiras de luces y esferas colgando de las puntas.
// La usa armarCasa() en js/navidad.js: window.__nvCasa(capa) → { detener() }.
(function(){
'use strict';
// Motor de ilustración «producida» para el login de Navidad: capas fijas (se pintan una vez) + capa viva (luces,
// nieve y destellos). Ramas de pino aguja por aguja, luces con resplandor, esferas con reflejos, regalos con volumen,
// bokeh y profundidad (lo lejano y lo muy cercano, desenfocado).
// Motor de ilustración «producida» para el login de Navidad: capas fijas (se pintan una vez) + capa viva (luces,
// nieve y destellos). Ramas de pino aguja por aguja, luces con resplandor, esferas con reflejos, regalos con volumen,
// bokeh y profundidad (lo lejano y lo muy cercano, desenfocado).
const NV=(()=>{
  const P=Math.PI*2; let s=7; const R=()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; const sem=n=>{ s=n; };
  const lerp=(a,b,t)=>a+(b-a)*t, rr=(a,b)=>a+R()*(b-a);
  const lienzo=(W,H,D)=>{ const c=document.createElement('canvas'); c.width=Math.round(W*D); c.height=Math.round(H*D); const x=c.getContext('2d'); x.setTransform(D,0,0,D,0,0); return {c,x}; };
  // ── bokeh: círculos de luz desenfocados ──
  function bokeh(x,W,H,n,cols,r0,r1,a0,a1,zona){ x.save(); x.globalCompositeOperation='lighter';
    for(let i=0;i<n;i++){ const cx=zona?rr(zona.x0,zona.x1):R()*W, cy=zona?rr(zona.y0,zona.y1):R()*H, r=rr(r0,r1), c=cols[(R()*cols.length)|0], a=rr(a0,a1);
      const g=x.createRadialGradient(cx,cy,0,cx,cy,r); g.addColorStop(0,`rgba(${c},${a*.55})`); g.addColorStop(.72,`rgba(${c},${a*.5})`); g.addColorStop(.86,`rgba(${c},${a*.75})`); g.addColorStop(1,`rgba(${c},0)`);
      x.fillStyle=g; x.beginPath(); x.arc(cx,cy,r,0,P); x.fill(); } x.restore(); }
  // ── esfera brillante ──
  function esfera(x,cx,cy,r,col,{hilo=0,brillo=1}={}){ const [c1,c2,c3]=col;
    if(hilo){ x.strokeStyle='rgba(230,200,120,.8)'; x.lineWidth=1; x.beginPath(); x.moveTo(cx,cy-r-hilo); x.lineTo(cx,cy-r); x.stroke(); }
    x.save(); x.shadowColor='rgba(0,0,0,.35)'; x.shadowBlur=r*.6; x.shadowOffsetY=r*.25;
    const g=x.createRadialGradient(cx-r*.35,cy-r*.4,r*.05,cx,cy,r); g.addColorStop(0,c1); g.addColorStop(.45,c2); g.addColorStop(1,c3); x.fillStyle=g; x.beginPath(); x.arc(cx,cy,r,0,P); x.fill(); x.restore();
    const rim=x.createRadialGradient(cx,cy,r*.7,cx,cy,r); rim.addColorStop(0,'rgba(255,255,255,0)'); rim.addColorStop(1,`rgba(255,220,170,${.25*brillo})`); x.fillStyle=rim; x.beginPath(); x.arc(cx,cy,r,0,P); x.fill();
    x.fillStyle=`rgba(255,255,255,${.85*brillo})`; x.beginPath(); x.ellipse(cx-r*.38,cy-r*.42,r*.2,r*.12,-.6,0,P); x.fill();
    x.fillStyle=`rgba(255,255,255,${.35*brillo})`; x.beginPath(); x.arc(cx+r*.3,cy+r*.35,r*.08,0,P); x.fill();
    const tg=x.createLinearGradient(cx-r*.25,0,cx+r*.25,0); tg.addColorStop(0,'#8a6a2a'); tg.addColorStop(.5,'#f4d98a'); tg.addColorStop(1,'#7a5a20'); x.fillStyle=tg; x.fillRect(cx-r*.22,cy-r-r*.18,r*.44,r*.24); }
  const ESF={rojo:['#ff9a9a','#d0142c','#5a0410'],oro:['#fff2b0','#d9a530','#6a4508'],verde:['#9fe0b8','#1d7a4a','#062e1a'],plata:['#ffffff','#b9c6d2','#4a5866'],azul:['#bfe0ff','#2a6ad0','#0a2050'],vino:['#ff9ab8','#9a1240','#3a0418']};
  // ── regalo con volumen ──
  function regalo(x,cx,base,w,h,d,col,cinta){ const [f1,f2]=col, lado=d*.55;
    x.save(); x.shadowColor='rgba(0,0,0,.4)'; x.shadowBlur=18; x.shadowOffsetY=8; x.fillStyle=f2; x.fillRect(cx-w/2,base-h,w,h); x.restore();
    let g=x.createLinearGradient(cx-w/2,0,cx+w/2,0); g.addColorStop(0,f1); g.addColorStop(1,f2); x.fillStyle=g; x.fillRect(cx-w/2,base-h,w,h);
    x.fillStyle=f1; x.beginPath(); x.moveTo(cx-w/2,base-h); x.lineTo(cx-w/2+lado,base-h-lado*.6); x.lineTo(cx+w/2+lado,base-h-lado*.6); x.lineTo(cx+w/2,base-h); x.closePath(); x.fill();
    x.fillStyle='rgba(255,255,255,.18)'; x.fill(); x.fillStyle=f2; x.beginPath(); x.moveTo(cx+w/2,base-h); x.lineTo(cx+w/2+lado,base-h-lado*.6); x.lineTo(cx+w/2+lado,base-lado*.6); x.lineTo(cx+w/2,base); x.closePath(); x.fill(); x.fillStyle='rgba(0,0,0,.25)'; x.fill();
    const cw=Math.max(5,w*.12); g=x.createLinearGradient(cx-cw/2,0,cx+cw/2,0); g.addColorStop(0,cinta[1]); g.addColorStop(.45,cinta[0]); g.addColorStop(1,cinta[1]); x.fillStyle=g; x.fillRect(cx-cw/2,base-h,cw,h);
    g=x.createLinearGradient(0,base-h*.55-cw/2,0,base-h*.55+cw/2); g.addColorStop(0,cinta[1]); g.addColorStop(.45,cinta[0]); g.addColorStop(1,cinta[1]); x.fillStyle=g; x.fillRect(cx-w/2,base-h*.55-cw/2,w,cw);
    x.fillStyle=cinta[0]; x.beginPath(); x.moveTo(cx-w/2+lado*.5-cw/2+w/2,base-h-lado*.3); x.lineTo(cx+lado*.5+cw/2,base-h-lado*.3); x.lineTo(cx+cw/2,base-h); x.lineTo(cx-cw/2,base-h); x.closePath(); x.fill();
    const bx=cx+lado*.3, by=base-h-lado*.2, b=w*.32; [[-1],[1]].forEach(([sd])=>{ const gg=x.createRadialGradient(bx+sd*b*.4,by-b*.2,1,bx+sd*b*.5,by-b*.2,b*.8); gg.addColorStop(0,cinta[0]); gg.addColorStop(1,cinta[1]); x.fillStyle=gg;
      x.beginPath(); x.moveTo(bx,by); x.bezierCurveTo(bx+sd*b*.2,by-b*.9,bx+sd*b*1.1,by-b*.8,bx+sd*b*.9,by-b*.15); x.bezierCurveTo(bx+sd*b*.7,by+b*.15,bx+sd*b*.3,by+b*.05,bx,by); x.fill();
      x.strokeStyle='rgba(255,255,255,.35)'; x.lineWidth=1.2; x.beginPath(); x.moveTo(bx+sd*b*.2,by-b*.3); x.bezierCurveTo(bx+sd*b*.35,by-b*.75,bx+sd*b*.85,by-b*.65,bx+sd*b*.8,by-b*.25); x.stroke(); });
    x.fillStyle=cinta[1]; x.beginPath(); x.ellipse(bx,by,b*.18,b*.14,0,0,P); x.fill(); }
  // capa viva: luces que respiran, nieve con profundidad y destellos
  function vivo(x,W,H,t,luces,copos,chispas){
    x.clearRect(0,0,W,H); x.save(); x.globalCompositeOperation='lighter';
    for(const l of luces){ const a=l.a*(.72+.28*Math.sin(t*l.v+l.f)), r=l.r, K=l.k||8, ga=l.ga||1;
      const g=x.createRadialGradient(l.x,l.y,0,l.x,l.y,r*K); g.addColorStop(0,`rgba(${l.c},${.7*a*ga})`); g.addColorStop(.2,`rgba(${l.c},${.3*a*ga})`); g.addColorStop(1,`rgba(${l.c},0)`); x.fillStyle=g; x.beginPath(); x.arc(l.x,l.y,r*K,0,P); x.fill();
      x.fillStyle=`rgba(255,250,235,${.95*a})`; x.beginPath(); x.arc(l.x,l.y,r*.55,0,P); x.fill(); x.fillStyle=`rgba(${l.c},${.9*a})`; x.beginPath(); x.arc(l.x,l.y,r,0,P); x.fill(); }
    for(const c of chispas){ const a=Math.max(0,Math.sin(t*c.v+c.f))**8; if(a<.03) continue; const L=c.r*(1+a); x.strokeStyle=`rgba(255,240,200,${a})`; x.lineWidth=1.2; x.beginPath(); x.moveTo(c.x-L,c.y); x.lineTo(c.x+L,c.y); x.moveTo(c.x,c.y-L); x.lineTo(c.x,c.y+L); x.stroke(); x.fillStyle=`rgba(255,255,255,${a})`; x.beginPath(); x.arc(c.x,c.y,1.4,0,P); x.fill(); }
    x.restore();
    for(const k of copos){ const y=((k.y+t*k.v)%(H+40))-20, xx=k.x+Math.sin(t*k.o+k.f)*k.amp; if(k.r>3){ const g=x.createRadialGradient(xx,y,0,xx,y,k.r); g.addColorStop(0,`rgba(255,255,255,${k.a})`); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; } else x.fillStyle=`rgba(255,255,255,${k.a})`; x.beginPath(); x.arc(xx,y,k.r,0,P); x.fill(); } }
  function copos(W,H,n){ const a=[]; for(let i=0;i<n;i++){ const z=R(); a.push({x:R()*W,y:R()*H,r:z<.12?rr(4,8):rr(.8,2.4),a:z<.12?.35:rr(.5,.9),v:z<.12?rr(40,60):rr(14,34),o:rr(.3,.8),f:R()*6,amp:rr(6,20)}); } return a; }
  function estrella(x,cx,cy,r,C){ x.save(); x.globalCompositeOperation='lighter'; for(let i=0;i<12;i++){ const a=i*P/12, L=r*(i%2?2.2:3.6); const g=x.createLinearGradient(cx,cy,cx+Math.cos(a)*L,cy+Math.sin(a)*L); g.addColorStop(0,'rgba(255,230,150,.55)'); g.addColorStop(1,'rgba(255,230,150,0)'); x.strokeStyle=g; x.lineWidth=2; x.beginPath(); x.moveTo(cx,cy); x.lineTo(cx+Math.cos(a)*L,cy+Math.sin(a)*L); x.stroke(); } x.restore();
    let p=''; x.beginPath(); for(let i=0;i<10;i++){ const a=i*Math.PI/5-Math.PI/2, rr2=i%2?r*.45:r; i?x.lineTo(cx+Math.cos(a)*rr2,cy+Math.sin(a)*rr2):x.moveTo(cx+Math.cos(a)*rr2,cy+Math.sin(a)*rr2); } x.closePath();
    const g=x.createRadialGradient(cx-r*.2,cy-r*.3,1,cx,cy,r); g.addColorStop(0,'#fffbe0'); g.addColorStop(.5,'#ffd35a'); g.addColorStop(1,'#c98a10'); x.fillStyle=g; x.fill(); x.strokeStyle='#fff3c0'; x.lineWidth=1; x.stroke();
    C.luces.push({x:cx,y:cy,r:r*.5,c:'255,220,140',a:1,v:1.2,f:0}); }
  return {estrella,P,R,rr,sem,lerp,lienzo,bokeh,esfera,ESF,regalo,vivo,copos};
})();

// Árbol de Navidad v2: cuerpo sólido por pisos (sin huecos), puntas caídas, sombra de cada piso sobre el de abajo,
// textura de agujas, luz desde arriba a la izquierda, guirnaldas doradas continuas, tiras de luces ordenadas y esferas
// colgando de las puntas. Firma igual que antes: arbol(x,cx,top,h,w,C,{fuera,pc}) — top = punta, h = alto, w = ancho abajo.
(function(N){
  const P=Math.PI*2, R=N.R, rr=N.rr;
  N.arbol=function(x,cx,top,h,w,C,{fuera=()=>false,pc=true}={}){
    const T=pc?7:6, k=w/560;                       // k: escala de detalles respecto al árbol de referencia
    const pisos=[]; for(let i=0;i<T;i++){ const u0=i/T, u1=(i+1)/T, yT=top+h*(i?u0*.93:0), yB=top+h*u1*.98, hw=w/2*Math.pow(u1,.92), tw=i?w/2*Math.pow(u0,.92)*.45:0;
      // borde de abajo: puntas que caen y huecos entre ellas
      const n=Math.max(4,Math.round(hw*2/(26*k))), borde=[]; for(let j=0;j<=n;j++){ const t=j/n, xx=cx-hw+2*hw*t, punta=j%2===0, curva=Math.sin(t*Math.PI)*h*.022;
        borde.push([xx+rr(-2,2)*k, yB+curva+(punta?rr(6,12)*k:-rr(4,9)*k)]); }
      pisos.push({yT,yB,hw,tw,borde}); }
    const camino=p=>{ const pa=new Path2D(); pa.moveTo(cx-p.tw,p.yT); pa.lineTo(cx+p.tw,p.yT);
      pa.quadraticCurveTo(cx+p.hw*.62,p.yT+(p.yB-p.yT)*.45,p.borde[p.borde.length-1][0],p.borde[p.borde.length-1][1]);
      for(let j=p.borde.length-2;j>=0;j--){ const a=p.borde[j+1], b=p.borde[j]; pa.quadraticCurveTo((a[0]+b[0])/2+rr(-2,2)*k,(a[1]+b[1])/2+rr(-1,2)*k,b[0],b[1]); }
      pa.quadraticCurveTo(cx-p.hw*.62,p.yT+(p.yB-p.yT)*.45,cx-p.tw,p.yT); pa.closePath(); return pa; };
    const silueta=new Path2D(); pisos.forEach(p=>{ p.ruta=camino(p); silueta.addPath(p.ruta); });
    // tronco
    const yb=pisos[T-1].yB; let g=x.createLinearGradient(cx-w*.04,0,cx+w*.04,0); g.addColorStop(0,'#3a2412'); g.addColorStop(.4,'#6a4422'); g.addColorStop(1,'#2a180a');
    x.fillStyle=g; x.fillRect(cx-w*.04,yb-h*.04,w*.08,h*.08);
    // pisos de abajo hacia arriba: cuerpo, agujas y la sombra que le cae del piso de arriba
    for(let i=T-1;i>=0;i--){ const p=pisos[i];
      g=x.createLinearGradient(0,p.yT,0,p.yB+8*k); g.addColorStop(0,'#07261a'); g.addColorStop(.55,'#0f4129'); g.addColorStop(1,'#1a5c3a'); x.fillStyle=g; x.fill(p.ruta);
      x.save(); x.clip(p.ruta);
      // agujas: ramitas cortas que apuntan hacia abajo y hacia afuera, más claras hacia las puntas y a la izquierda
      const alto=p.yB-p.yT, cuantas=Math.round(p.hw*alto/(pc?55:70)/k/k);
      for(let s=0;s<cuantas;s++){ const v=Math.pow(R(),.7), py=p.yT+alto*v, ancho=p.tw+(p.hw-p.tw)*v, px=cx+(R()*2-1)*ancho*1.02, dx=(px-cx)/Math.max(1,p.hw);
        const base=Math.PI/2-dx*1.05, luz=v*.7+(dx<0?.25:-.1)+rr(-.2,.2), cols=['#0a2e1e','#114a2e','#18603c','#22744a','#2f8a5a','#45a26e'];
        const ci=Math.max(0,Math.min(5,Math.round(luz*5))); x.strokeStyle=cols[ci]; x.lineWidth=rr(.9,1.5)*Math.max(.8,k);
        const L=rr(7,14)*k; for(let a=-2;a<=2;a++){ const an=base+a*.32+rr(-.1,.1); x.beginPath(); x.moveTo(px,py); x.lineTo(px+Math.cos(an)*L*(1-Math.abs(a)*.12),py+Math.sin(an)*L*(1-Math.abs(a)*.12)); x.stroke(); } }
      // puntas: más claras (la luz les pega)
      p.borde.forEach((b,j)=>{ if(j%2) return; for(let a=0;a<7;a++){ const an=Math.PI/2+(cx-b[0])/p.hw*-.8+rr(-.7,.7), L=rr(6,12)*k; x.strokeStyle=(b[0]<cx?['#3c9a66','#4fae78']:['#2a7d52','#348c5e'])[a%2]; x.lineWidth=1.2*Math.max(.8,k);
        x.beginPath(); x.moveTo(b[0]+rr(-4,4)*k,b[1]-rr(4,14)*k); x.lineTo(b[0]+Math.cos(an)*L*.4+rr(-3,3)*k,b[1]+rr(-2,3)*k); x.stroke(); } });
      x.restore();
      const copete=(bx,by,dir,L0,claro)=>{ for(let a2=0;a2<9;a2++){ const an=dir+rr(-.55,.55), L=L0*rr(.6,1.1); x.strokeStyle=claro?['#2f8a5a','#3c9a66','#24774c'][a2%3]:['#14502f','#1b603b','#0f4127'][a2%3]; x.lineWidth=rr(1,1.5)*Math.max(.8,k);
        x.beginPath(); x.moveTo(bx-Math.cos(an)*L*.5,by-Math.sin(an)*L*.5); x.quadraticCurveTo(bx+Math.cos(an)*L*.2,by+Math.sin(an)*L*.2+L*.08,bx+Math.cos(an)*L*.55,by+Math.sin(an)*L*.55+L*.12); x.stroke(); } };
      p.borde.forEach((b,j)=>{ const dir=Math.PI/2-((b[0]-cx)/p.hw)*.9; copete(b[0],b[1]-2*k,dir,(j%2?9:15)*k,b[0]<cx+p.hw*.2); });
      for(let s=0;s<10;s++){ const u=(s+.5)/10, yy=p.yT+(p.yB-p.yT)*u, xw=p.tw+(p.hw-p.tw)*Math.pow(u,1.1); copete(cx-xw*.98,yy,Math.PI*.78,11*k,true); copete(cx+xw*.98,yy,Math.PI*.22,11*k,false); }
      // sombra del piso de arriba sobre este
      if(i>0){ const q=pisos[i-1]; x.save(); x.clip(p.ruta); g=x.createLinearGradient(0,q.yB-6*k,0,q.yB+22*k); g.addColorStop(0,'rgba(0,10,4,.55)'); g.addColorStop(1,'rgba(0,10,4,0)'); x.fillStyle=g; x.fillRect(cx-p.hw-10,q.yB-6*k,p.hw*2+20,30*k); x.restore(); } }
    // volumen: luz desde arriba a la izquierda y sombra a la derecha
    x.save(); x.clip(silueta); g=x.createLinearGradient(cx-w/2,0,cx+w/2,0); g.addColorStop(0,'rgba(255,230,170,.10)'); g.addColorStop(.45,'rgba(255,230,170,0)'); g.addColorStop(.6,'rgba(0,8,4,0)'); g.addColorStop(1,'rgba(0,8,4,.38)'); x.fillStyle=g; x.fillRect(cx-w/2-10,top,w+20,h+20); x.restore();
    const anchoEn=y=>{ const u=Math.max(0,Math.min(1,(y-top)/h)); return w/2*Math.pow(u,.92)*.9; };
    // guirnaldas doradas: caen de un lado al otro, continuas (solo sobre el árbol)
    x.save(); x.clip(silueta);
    for(let j=0;j<(pc?5:4);j++){ const y0=top+h*(.2+j*.165), y1=y0+h*.06, sag=h*.05; const pts=[]; for(let s=0;s<=40;s++){ const u=s/40, yy=y0+(y1-y0)*u+Math.sin(u*Math.PI)*sag, aw=anchoEn(yy)*1.08; pts.push([cx-aw+2*aw*u,yy]); }
      if(pts.some(q=>fuera(q[0],q[1]))) continue;
      x.lineCap='round'; x.lineJoin='round';
      x.strokeStyle='rgba(60,30,0,.35)'; x.lineWidth=6*k; x.beginPath(); pts.forEach((q,s)=>s?x.lineTo(q[0],q[1]+3*k):x.moveTo(q[0],q[1]+3*k)); x.stroke();
      g=x.createLinearGradient(0,y0-6,0,y1+sag+6); g.addColorStop(0,'#fff1b8'); g.addColorStop(.5,'#e3b34a'); g.addColorStop(1,'#9a6a14'); x.strokeStyle=g; x.lineWidth=5*k; x.beginPath(); pts.forEach((q,s)=>s?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1])); x.stroke();
      x.fillStyle='#fff6d0'; pts.forEach((q,s)=>{ if(s%3) return; x.beginPath(); x.arc(q[0],q[1]-1.2*k,1.3*k,0,P); x.fill(); }); }
    x.restore();
    // esferas colgando de las puntas de cada piso (y algunas adentro), sin encimarse
    const cols=['rojo','oro','rojo','plata','vino','oro','azul','rojo'], puestas=[];
    pisos.forEach((p,i)=>{ if(!i) return; p.borde.forEach((b,j)=>{ if(j%2||R()<.35) return; const r=rr(8,13)*k*(.8+i/T*.4), cx2=b[0]+rr(-3,3)*k, cy2=b[1]-r*rr(.2,.9);
      if(fuera(cx2,cy2,r+4)||!x.isPointInPath(silueta,cx2,cy2-r)||puestas.some(q=>Math.hypot(q[0]-cx2,q[1]-cy2)<q[2]+r+6*k)) return; puestas.push([cx2,cy2,r]); }); });
    for(let s=0;s<60&&puestas.length<(pc?40:26);s++){ const y=top+h*rr(.18,.9), aw=anchoEn(y)*.8, px=cx+(R()*2-1)*aw, r=rr(7,11)*k;
      if(fuera(px,y,r+4)||puestas.some(q=>Math.hypot(q[0]-px,q[1]-y)<q[2]+r+10*k)) continue; puestas.push([px,y,r]); }
    puestas.forEach((q,i)=>N.esfera(x,q[0],q[1],q[2],N.ESF[cols[i%cols.length]],{brillo:.95}));
    // tiras de luces cálidas, en curvas parejas entre las guirnaldas
    for(let j=0;j<(pc?6:5);j++){ const y0=top+h*(.12+j*.145), y1=y0+h*.07, sag=h*.04, n=Math.max(4,Math.round(anchoEn(y0+sag)*2/(22*k)));
      for(let s=1;s<n;s++){ const u=s/n, yy=y0+(y1-y0)*u+Math.sin(u*Math.PI)*sag, aw=anchoEn(yy)*1.02, px=cx-aw+2*aw*u+rr(-2,2)*k;
        if(fuera(px,yy,6)||!x.isPointInPath(silueta,px,yy)) continue;
        C.luces.push({x:px,y:yy,r:(pc?2.5:2.1)*Math.max(.8,k),c:R()<.85?'255,214,150':['255,110,110','130,200,255','255,170,220'][(R()*3)|0],a:rr(.75,1),v:rr(1,2.4),f:R()*6,k:6,ga:.85}); } }
    N.estrella(x,cx,top-(pc?10:8)*Math.max(.7,k),(pc?22:16)*Math.max(.7,k),C);
  };
})(NV);

function dibujar(x,C){
 const N=NV, {W,H,pc,logo,marca,f,masc}=C; N.sem(21);
  const tapa=[marca,f].concat(masc?[masc]:[]);
  const fuera=(px,py,m=8)=>tapa.some(q=>px>q.l-m&&px<q.r+m&&py>q.t-m&&py<q.b+m);
  const libre=(cx,w)=>!masc||cx+w/2<masc.l-6||cx-w/2>masc.r+6;
  let g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'#2a0d06'); g.addColorStop(.6,'#4a1a0c'); g.addColorStop(1,'#2a0e06'); x.fillStyle=g; x.fillRect(0,0,W,H);
  N.bokeh(x,W,H,pc?60:30,['255,190,110','255,160,80','255,220,160'],pc?16:10,pc?54:34,.06,.24);
  // piso a la altura de los pies de la mascota
  const piso=masc?masc.b-(pc?16:12):H-(pc?70:44);
  g=x.createLinearGradient(0,piso,0,H); g.addColorStop(0,'#3a1608'); g.addColorStop(1,'#1e0a04'); x.fillStyle=g; x.fillRect(0,piso,W,H-piso);
  x.strokeStyle='rgba(0,0,0,.18)'; x.lineWidth=1; for(let i=1;i<8;i++){ const y=piso+(H-piso)*(i/8)**1.5; x.beginPath(); x.moveTo(0,y); x.lineTo(W,y); x.stroke(); }
  g=x.createRadialGradient(W/2,piso,10,W/2,piso,W*.6); g.addColorStop(0,'rgba(255,170,80,.18)'); g.addColorStop(1,'rgba(255,170,80,0)'); x.fillStyle=g; x.fillRect(0,piso-40,W,H);
  if(pc){
    // árbol principal a la derecha de la tarjeta, con la mascota parada al pie, del lado de la tarjeta
    const hueco=W-f.r, top=Math.max(40,logo.t-10), tw=Math.min(hueco*.95,(piso-top)*.62), h=piso-top-14, cx=masc?Math.min(W-tw*.42,masc.r+tw*.18):f.r+hueco/2;   // la falda del árbol cuelga ~0.3 del ancho: el alto se recorta para que asiente en el piso
    // árbol del fondo (izquierda), desenfocado
    const tmp=N.lienzo(W,H,1), C2={luces:[]}; const tw2=Math.min(f.l*.8,H*.42), t2=piso-H*.6; N.arbol(tmp.x,Math.max(180,f.l*.5),t2,piso-t2-14,tw2,C2,{pc});
    C2.luces.forEach(l=>{ const gg=tmp.x.createRadialGradient(l.x,l.y,0,l.x,l.y,7); gg.addColorStop(0,`rgba(${l.c},.9)`); gg.addColorStop(1,`rgba(${l.c},0)`); tmp.x.fillStyle=gg; tmp.x.beginPath(); tmp.x.arc(l.x,l.y,7,0,N.P); tmp.x.fill(); });
    x.save(); x.globalAlpha=.85; x.filter='blur(4px)'; x.drawImage(tmp.c,0,0,W,H); x.restore();
    const lx=Math.max(150,f.l*.5); N.regalo(x,lx-90,piso+22,96,70,34,['#d0283c','#8a0f1f'],['#ffe6a0','#c9952a']); N.regalo(x,lx+60,piso+22,80,92,30,['#1f7a4f','#0f4a30'],['#fff4dc','#cfc0a0']); N.regalo(x,lx-10,piso+26,64,46,24,['#f2c45a','#b07a18'],['#d0283c','#8a0f1f']);
    N.arbol(x,cx,top,h,tw,C,{pc,fuera:(px,py)=>fuera(px,py,4)});
    // regalos al pie del árbol, del lado de afuera (no donde está la mascota)
    [[cx+tw*.28,92,70,['#2a6ad0','#123a7a'],['#ffe6a0','#c9952a']],[cx+tw*.05,66,54,['#9a1240','#5a0820'],['#f6f0e0','#c9bca0']],[cx+tw*.45,58,80,['#f2c45a','#b07a18'],['#1f7a4f','#0f4a30']]]
      .forEach(([gx,w,hh,col,ci])=>{ if(libre(gx,w)&&gx+w/2<W-4) N.regalo(x,gx,piso+18,w,hh,w*.35,col,ci); });
  } else { const top=logo.t-14, h=H-top-30, w=W*1.25;
    N.arbol(x,W/2,top,h,w,C,{pc,fuera});
    g=x.createRadialGradient(W/2,marca.cy,10,W/2,marca.cy,marca.w*.7); g.addColorStop(0,'rgba(10,20,10,.6)'); g.addColorStop(1,'rgba(10,20,10,0)'); x.fillStyle=g; x.fillRect(0,0,W,H);
    [[W*.16,62,48,['#d0283c','#8a0f1f'],['#ffe6a0','#c9952a']],[W*.36,46,62,['#f2c45a','#b07a18'],['#d0283c','#8a0f1f']]].forEach(([gx,w,hh,col,ci])=>{ if(libre(gx,w)) N.regalo(x,gx,piso+12,w,hh,w*.35,col,ci); }); }
  // el lugar de la mascota: un charco de luz cálida en el piso y su sombra
  if(masc){ const mx=masc.cx, my=piso+(pc?10:8);
    g=x.createRadialGradient(mx,my,4,mx,my,masc.w*.9); g.addColorStop(0,'rgba(255,200,120,.32)'); g.addColorStop(1,'rgba(255,200,120,0)'); x.fillStyle=g; x.beginPath(); x.ellipse(mx,my,masc.w*.9,masc.w*.28,0,0,N.P); x.fill();
    x.fillStyle='rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(mx,my+2,masc.w*.3,masc.w*.07,0,0,N.P); x.fill(); }
  for(let i=0;i<(pc?24:10);i++){ const px=N.R()*W, py=N.R()*H; if(fuera(px,py,20)) continue; C.chispas.push({x:px,y:py,r:N.rr(3,7),v:N.rr(.6,1.4),f:N.R()*6}); }
  g=x.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.75); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.45)'); x.fillStyle=g; x.fillRect(0,0,W,H);
}
window.__nvCasa=function(capa){
  var ls=document.getElementById('loginScreen'); if(!ls) return {detener:function(){}};
  var reducido=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  var cont=document.createElement('div'); cont.className='nvc'; capa.appendChild(cont);
  var vivo=null, luces=[], chispas=[], cps=[], W=0, H=0, raf=0, firma='', parado=false;
  function rc(e,base){ var r=e.getBoundingClientRect(); var l=r.left-base.left, t=r.top-base.top; return {l:l,t:t,r:l+r.width,b:t+r.height,w:r.width,h:r.height,cx:l+r.width/2,cy:t+r.height/2}; }
  function medir(){ var base=capa.getBoundingClientRect(), m=ls.querySelector('.nv-mascota'), q=function(s){ return ls.querySelector(s); };
    if(!q('.login-logo')||!q('.login-brand')||!q('.login-form')) return null;
    return {W:Math.round(capa.clientWidth),H:Math.round(capa.clientHeight),pc:capa.clientWidth>=760,logo:rc(q('.login-logo'),base),marca:rc(q('.login-brand'),base),f:rc(q('.login-form'),base),masc:(m&&m.offsetWidth)?rc(m,base):null}; }
  function armar(){ if(parado||!capa.isConnected) return; var C=medir(); if(!C||!C.W||!C.H) return;
    var f=[C.W,C.H,Math.round(C.f.t),C.masc?[Math.round(C.masc.l),Math.round(C.masc.t),Math.round(C.masc.w)].join(','):'-'].join('|'); if(f===firma) return; firma=f;
    W=C.W; H=C.H; var D=Math.min(1.5,window.devicePixelRatio||1); C.luces=[]; C.chispas=[]; NV.sem(21);
    var fijo=NV.lienzo(W,H,D); dibujar(fijo.x,C); var v=NV.lienzo(W,H,D);
    cont.innerHTML=''; cont.appendChild(fijo.c); cont.appendChild(v.c); vivo=v.x; luces=C.luces; chispas=C.chispas; cps=reducido?[]:NV.copos(W,H,C.pc?110:60);
    if(reducido) NV.vivo(vivo,W,H,0,luces,[],[]); else if(!raf) raf=requestAnimationFrame(cuadro); }
  function cuadro(n){ raf=0; if(parado||!capa.isConnected) return;
    if(document.hidden||!ls.classList.contains('active')){ raf=requestAnimationFrame(cuadro); return; }
    NV.vivo(vivo,W,H,n/1000,luces,cps,chispas); raf=requestAnimationFrame(cuadro); }
  armar(); var t1=setTimeout(armar,700), t2=setTimeout(armar,1800);      // la mascota y las fuentes se acomodan un momento después
  var ro=window.ResizeObserver?new ResizeObserver(function(){ clearTimeout(t1); t1=setTimeout(armar,200); }):null; if(ro){ ro.observe(capa); var mm=ls.querySelector('.nv-mascota'); if(mm) ro.observe(mm); }
  return {detener:function(){ parado=true; if(raf) cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2); if(ro) ro.disconnect(); cont.remove(); }};
};
})();
