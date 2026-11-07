// ── Navidad en casa (22–27 dic): escena del login «El pueblito de jengibre» ──
// Ilustración en canvas, de postal con toque de cuento: anochecer índigo a rosa con luna creciente y estrellas;
// colinas nevadas; casitas de jengibre con glaseado, gomitas, bastones y ventanas encendidas; faroles de bastón de
// caramelo con tiras de luces de colores; paletas y gomitas en la nieve; un árbol con adornos (por pisos sólidos, puntas
// de agujas, guirnaldas, luces y esferas) junto a la mascota. En el teléfono, composición propia: luces colgando sobre
// el logo, una tira de luces entre la tarjeta y el letrero de abajo y una fila de casitas sobre la calle.
// Se arma alrededor de lo fijo del login (logo, nombre, tarjeta, letrero de abajo) y del lugar donde está la mascota del
// login: el piso queda a la altura de sus pies con un charco de luz y nada se le encima. La mascota no se toca: solo
// se lee su posición (si cambia de lugar o de tamaño, la escena se vuelve a armar).
// Dos capas: la fija se pinta una vez (y al cambiar el tamaño); la viva (luces que respiran, nieve, destellos) corre
// solo con el login a la vista. Con movimiento reducido, la viva se pinta una vez y queda quieta.
// La usa armarCasa() en js/navidad.js: window.__nvCasa(capa) → { detener() }.
(function(){
'use strict';
// Motor de ilustración «producida» para el login de Navidad: capas fijas (se pintan una vez) + capa viva (luces,
// nieve y destellos): esferas con reflejos y luces con resplandor.
const NV=(()=>{
  const P=Math.PI*2; let s=7; const R=()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; const sem=n=>{ s=n; };
  const lerp=(a,b,t)=>a+(b-a)*t, rr=(a,b)=>a+R()*(b-a);
  const lienzo=(W,H,D)=>{ const c=document.createElement('canvas'); c.width=Math.round(W*D); c.height=Math.round(H*D); const x=c.getContext('2d'); x.setTransform(D,0,0,D,0,0); return {c,x}; };
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
  return {estrella,P,R,rr,sem,lerp,lienzo,esfera,ESF,vivo,copos};
})();

// Árbol de Navidad v2: cuerpo sólido por pisos (sin huecos), puntas caídas, sombra de cada piso sobre el de abajo,
// textura de agujas, luz desde arriba a la izquierda, guirnaldas doradas continuas, tiras de luces ordenadas y esferas
// colgando de las puntas. Firma igual que antes: arbol(x,cx,top,h,w,C,{fuera,pc}) — top = punta, h = alto, w = ancho abajo.
(function(N){
  const P=Math.PI*2, R=N.R, rr=N.rr;
  N.arbol=function(x,cx,top,h,w,C,{fuera=()=>false,pc=true,adornos=true,nieve=false,tono=0}={}){
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
    if(nieve){ pisos.forEach(p=>{ x.fillStyle='rgba(250,253,255,.97)'; p.borde.forEach((b,j)=>{ if(j%2) return; const r=rr(5,9)*k; x.beginPath(); x.ellipse(b[0],b[1]-r*1.2,r*1.4,r*.65,((b[0]-cx)/p.hw)*.5,0,P); x.fill(); });
      x.beginPath(); for(let s=0;s<=10;s++){ const u=s/10, xx=cx-p.hw*.85+p.hw*1.7*u, yy=p.yB-(p.yB-p.yT)*.28+Math.sin(u*Math.PI)*(p.yB-p.yT)*.12; s?x.lineTo(xx,yy):x.moveTo(xx,yy); } x.strokeStyle='rgba(240,248,255,.55)'; x.lineWidth=4*k; x.stroke(); }); }
    if(tono){ x.save(); x.clip(silueta); x.fillStyle=`rgba(10,24,48,${tono})`; x.fillRect(cx-w/2-10,top-10,w+20,h+30); x.restore(); }
    // volumen: luz desde arriba a la izquierda y sombra a la derecha
    x.save(); x.clip(silueta); g=x.createLinearGradient(cx-w/2,0,cx+w/2,0); g.addColorStop(0,'rgba(255,230,170,.10)'); g.addColorStop(.45,'rgba(255,230,170,0)'); g.addColorStop(.6,'rgba(0,8,4,0)'); g.addColorStop(1,'rgba(0,8,4,.38)'); x.fillStyle=g; x.fillRect(cx-w/2-10,top,w+20,h+20); x.restore();
    const anchoEn=y=>{ const u=Math.max(0,Math.min(1,(y-top)/h)); return w/2*Math.pow(u,.92)*.9; };
    if(!adornos) return;
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

// Casa de jengibre (y dos ayudas: aclarar/oscurecer un color y rectángulo redondeado).
(function(N){ const P=Math.PI*2, R=N.R, rr=N.rr;
  function shade(hex,amt){ const n=parseInt(hex.slice(1),16); let r=(n>>16)&255,g=(n>>8)&255,b=n&255; const f=v=>Math.max(0,Math.min(255,Math.round(v+(amt<0?v*amt:(255-v)*amt)))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
  function rrect(x,X,Y,W,H,r){ x.beginPath(); x.moveTo(X+r,Y); x.arcTo(X+W,Y,X+W,Y+H,r); x.arcTo(X+W,Y+H,X,Y+H,r); x.arcTo(X,Y+H,X,Y,r); x.arcTo(X,Y,X+W,Y,r); x.closePath(); }
  N.shade=shade; N.rrect=rrect;
  // casa de jengibre
  N.jengibre=(x,cx,base,w,h,C)=>{ const k=w/140, roofH=h*.6;
    let g=x.createLinearGradient(cx-w/2,0,cx+w/2,0); g.addColorStop(0,'#b5703a'); g.addColorStop(1,'#8a4f22'); x.fillStyle=g; x.fillRect(cx-w/2,base-h,w,h);
    x.fillStyle='rgba(90,45,15,.35)'; for(let i=0;i<40;i++){ x.beginPath(); x.arc(cx-w/2+R()*w,base-h+R()*h,rr(.6,1.4)*k,0,P); x.fill(); }
    // techo de galleta con glaseado ondulado y gomitas
    x.fillStyle='#7a4018'; x.beginPath(); x.moveTo(cx-w/2-14*k,base-h+6*k); x.lineTo(cx,base-h-roofH); x.lineTo(cx+w/2+14*k,base-h+6*k); x.closePath(); x.fill();
    x.strokeStyle='#fffaf0'; x.lineWidth=6*k; x.lineJoin='round'; x.beginPath(); x.moveTo(cx-w/2-14*k,base-h+6*k); x.lineTo(cx,base-h-roofH); x.lineTo(cx+w/2+14*k,base-h+6*k); x.stroke();
    x.fillStyle='#fffaf0'; for(const sd of [-1,1]) for(let t=.08;t<.95;t+=.12){ const xx=cx+sd*(w/2+14*k)*(1-t), yy=base-h+6*k-(roofH+6*k)*t; x.beginPath(); x.arc(xx,yy+5*k,4*k,0,Math.PI); x.fill(); }
    const gom=['#e3263c','#2bb38a','#f2c45a','#4c8dff','#ff7ad9']; for(const sd of [-1,1]) for(let t=.15;t<.9;t+=.18){ const xx=cx+sd*(w/2)*(1-t)*.8, yy=base-h-(roofH)*t*.85+8*k; x.fillStyle=gom[Math.round(t*10)%5]; x.beginPath(); x.ellipse(xx,yy,4*k,3.2*k,0,0,P); x.fill(); x.fillStyle='rgba(255,255,255,.6)'; x.beginPath(); x.arc(xx-1.4*k,yy-1.2*k,1*k,0,P); x.fill(); }
    // ventanas redondas con glaseado y luz
    [[cx-w*.28,base-h*.62],[cx+w*.28,base-h*.62]].forEach(([vx,vy])=>{ const r=w*.1; let gg=x.createRadialGradient(vx,vy,1,vx,vy,r*2.4); gg.addColorStop(0,'rgba(255,200,110,.4)'); gg.addColorStop(1,'rgba(255,200,110,0)'); x.fillStyle=gg; x.beginPath(); x.arc(vx,vy,r*2.4,0,P); x.fill();
      x.fillStyle='#ffcf6a'; x.beginPath(); x.arc(vx,vy,r,0,P); x.fill(); x.strokeStyle='#fffaf0'; x.lineWidth=3*k; x.stroke(); x.beginPath(); x.moveTo(vx-r,vy); x.lineTo(vx+r,vy); x.moveTo(vx,vy-r); x.lineTo(vx,vy+r); x.lineWidth=2*k; x.stroke(); });
    // puerta y bastones a los lados
    x.fillStyle='#5a2a10'; rrect(x,cx-w*.12,base-h*.5,w*.24,h*.5,w*.12); x.fill(); x.strokeStyle='#fffaf0'; x.lineWidth=2.5*k; x.stroke();
    for(const sd of [-1,1]){ const bx=cx+sd*(w/2+6*k); for(let y=base;y>base-h*.95;y-=6*k){ x.fillStyle=((base-y)/6/k|0)%2?'#e3263c':'#fff'; x.fillRect(bx-3*k,y-6*k,6*k,6*k); } x.strokeStyle='#e3263c'; x.lineWidth=6*k; x.beginPath(); x.arc(bx-sd*7*k,base-h*.95,7*k,Math.PI,0,sd<0); x.stroke(); }
    // glaseado en la base y las esquinas
    x.fillStyle='#fffaf0'; for(let xx=cx-w/2;xx<cx+w/2;xx+=8*k){ x.beginPath(); x.arc(xx+4*k,base-h,4*k,0,Math.PI); x.fill(); }
    for(let t=0;t<=1.001;t+=.08) for(const sd of [-1,1]){ const xx=cx+sd*(w/2+14*k)*(1-t), yy=base-h+6*k-(roofH+6*k)*t; C.luces.push({x:xx,y:yy-2*k,r:1.8*Math.max(.8,k),c:'255,214,140',a:rr(.8,1),v:rr(1.2,2.6),f:R()*6,k:6,ga:.7}); }
  };
})(NV);

function dibujar(x,C){
 const N=NV, {W,H,pc,logo,marca,f,masc,pie}=C; N.sem(67);
  const tapa=[marca,f].concat(masc?[masc]:[],pie?[pie]:[]), fuera=(px,py,m=8)=>tapa.some(q=>px>q.l-m&&px<q.r+m&&py>q.t-m&&py<q.b+m);
  const suelo=masc?masc.b-(pc?14:10):H-(pc?60:40);
  let g=x.createLinearGradient(0,0,0,suelo); g.addColorStop(0,'#1a1046'); g.addColorStop(.45,'#3a2270'); g.addColorStop(.8,'#8a3f8a'); g.addColorStop(1,'#e28aa0'); x.fillStyle=g; x.fillRect(0,0,W,H);
  for(let i=0;i<(pc?180:80);i++){ x.globalAlpha=N.rr(.3,1); x.fillStyle=['#fff','#ffe9b0','#d6e6ff'][i%3]; x.beginPath(); x.arc(N.R()*W,N.R()*suelo*.65,N.rr(.4,1.4),0,N.P); x.fill(); } x.globalAlpha=1;
  // luna creciente
  const mr=pc?52:22, mx=pc?Math.max(mr*2,f.l*.3):mr+14, my=pc?Math.max(80,logo.t+20):Math.max(mr+52,logo.t+10); let gg=x.createRadialGradient(mx,my,mr,mx,my,mr*4); gg.addColorStop(0,'rgba(255,235,200,.35)'); gg.addColorStop(1,'rgba(255,235,200,0)'); x.fillStyle=gg; x.beginPath(); x.arc(mx,my,mr*4,0,N.P); x.fill();
  const lunaC=N.lienzo(mr*3,mr*3,2); lunaC.x.fillStyle='#fff3cf'; lunaC.x.beginPath(); lunaC.x.arc(mr*1.5,mr*1.5,mr,0,N.P); lunaC.x.fill(); lunaC.x.globalCompositeOperation='destination-out'; lunaC.x.beginPath(); lunaC.x.arc(mr*1.95,mr*1.25,mr*.88,0,N.P); lunaC.x.fill(); x.drawImage(lunaC.c,mx-mr*1.5,my-mr*1.5,mr*3,mr*3);
  // colinas nevadas teñidas de rosa
  x.fillStyle='#c79ac8'; x.beginPath(); x.moveTo(0,H); x.lineTo(0,suelo-(pc?110:60)); for(let i=0;i<=6;i++) x.quadraticCurveTo(i/6*W-W/12,suelo-(pc?150:80)+N.rr(-20,20),i/6*W,suelo-(pc?100:55)+N.rr(-10,10)); x.lineTo(W,H); x.fill();
  x.fillStyle='#e6c6e0'; x.beginPath(); x.moveTo(0,H); x.lineTo(0,suelo-(pc?40:24)); for(let i=0;i<=6;i++) x.quadraticCurveTo(i/6*W-W/12,suelo-(pc?66:36)+N.rr(-10,10),i/6*W,suelo-(pc?36:20)); x.lineTo(W,H); x.fill();
  // pinos de fondo con nieve
  (pc?[.04,.12,.86,.95]:[]).forEach((u,i)=>{ const h=(pc?170:96)*(.85+i%2*.3); N.arbol(x,u*W,suelo-h-(pc?50:28),h,h*.6,C,{pc,adornos:false,nieve:true,tono:.3}); });
  // paletas gigantes
  const paleta=(px,py,r,c1,c2)=>{ x.fillStyle='#f6f0e6'; x.fillRect(px-r*.08,py,r*.16,r*2.2); x.save(); x.translate(px,py); x.beginPath(); x.arc(0,0,r,0,N.P); x.fillStyle=c1; x.fill(); x.clip();
    for(let i=0;i<6;i++){ x.strokeStyle=i%2?c2:'#fff'; x.lineWidth=r*.28; x.beginPath(); for(let a=0;a<N.P*1.6;a+=.2){ const rr2=r*a/(N.P*1.6); x.lineTo(Math.cos(a+i*1.05)*rr2,Math.sin(a+i*1.05)*rr2); } x.stroke(); } x.restore();
    x.fillStyle='rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(px-r*.35,py-r*.4,r*.3,r*.16,-.6,0,N.P); x.fill(); };
  // casitas de jengibre
  const casas=pc?[[Math.max(120,f.l-250),170,130],[Math.max(70,f.l-90),130,104],[Math.min(W-100,f.r+(W-f.r)*.8),160,124]]:[];
  const puestas=[];   // en pantallas medianas (tablet) no se enciman: se quita la que choca con otra, con la tarjeta o con la mascota
  casas.forEach(([cx,w,h],i)=>{ if(masc&&cx+w/2>masc.l-10&&cx-w/2<masc.r+10) return; if(cx+w/2>f.l-8&&cx-w/2<f.r+8) return; if(i===2&&W<1100) return;
    if(puestas.some(q=>Math.abs(q[0]-cx)<(q[1]+w)/2+10)) return; puestas.push([cx,w]); N.jengibre(x,cx,suelo+2,w,h,C); });
  if(pc&&W>=1100){ paleta(Math.max(40,f.l-360),suelo-120,34,'#e3263c','#ff8fa0'); paleta(Math.min(W-40,f.r+(W-f.r)*.55),suelo-110,30,'#2bb38a','#bff5d8'); }
  // nieve de la calle
  g=x.createLinearGradient(0,suelo-6,0,H); g.addColorStop(0,'#fbf3fb'); g.addColorStop(1,'#e4d2ea'); x.fillStyle=g; x.beginPath(); x.moveTo(0,H); x.lineTo(0,suelo+4); for(let i=0;i<=8;i++) x.quadraticCurveTo(i/8*W-W/16,suelo-4+N.rr(-3,3),i/8*W,suelo+4); x.lineTo(W,H); x.fill();
  // gomitas sobre la nieve
  for(let i=0;i<(pc?16:7);i++){ const px=N.R()*W, py=N.rr(suelo+14,H-10); if(fuera(px,py,16)) continue; const c=['#e3263c','#2bb38a','#f2c45a','#4c8dff','#ff7ad9'][i%5], r=N.rr(6,11);
    x.fillStyle=c; x.beginPath(); x.moveTo(px-r,py); x.quadraticCurveTo(px-r,py-r*1.4,px,py-r*1.4); x.quadraticCurveTo(px+r,py-r*1.4,px+r,py); x.closePath(); x.fill(); x.fillStyle='rgba(255,255,255,.55)'; for(let k=0;k<5;k++){ x.beginPath(); x.arc(px+N.rr(-r*.6,r*.6),py-N.rr(2,r*1.1),.9,0,N.P); x.fill(); } }
  // faroles de bastón y tiras de luces entre ellos (por encima de la escena, sin cruzar la tarjeta)
  const farol=(fx,fy,hh)=>{ for(let y=fy;y>fy-hh;y-=8){ x.fillStyle=((fy-y)/8|0)%2?'#e3263c':'#fff'; x.fillRect(fx-3.5,y-8,7,8); } x.strokeStyle='#e3263c'; x.lineWidth=7; x.beginPath(); x.arc(fx+10,fy-hh,10,Math.PI,0); x.stroke();
    x.fillStyle='#2a1a3a'; x.fillRect(fx+14,fy-hh+4,12,4); x.fillStyle='#ffe6a8'; N.rrect(x,fx+13,fy-hh+8,14,16,3); x.fill(); C.luces.push({x:fx+20,y:fy-hh+16,r:5,c:'255,214,150',a:1,v:.9,f:N.R()*6,k:6,ga:.9}); return [fx+20,fy-hh+8]; };
  const pts=pc?[farol(Math.max(30,f.l-340),suelo+6,170),farol(Math.max(20,f.l-30),suelo+6,150)]:[];
  const der=pc?[farol(Math.min(W-40,f.r+30),suelo+6,150),farol(Math.min(W-30,W-40),suelo+6,170)]:[];
  const tira=(a,b)=>{ const n=Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/22), sag=40; x.strokeStyle='#1a1430'; x.lineWidth=1.4; x.beginPath(); for(let i=0;i<=n;i++){ const u=i/n, px=a[0]+(b[0]-a[0])*u, py=a[1]+(b[1]-a[1])*u+Math.sin(u*Math.PI)*sag; i?x.lineTo(px,py):x.moveTo(px,py); if(i&&i<n) C.luces.push({x:px,y:py+4,r:pc?2.6:2.2,c:['255,90,90','255,214,140','110,220,150','120,190,255','255,150,210'][i%5],a:N.rr(.8,1),v:N.rr(1,2.4),f:N.R()*6,k:6,ga:.85}); } x.stroke(); };
  if(pc){ tira(pts[0],pts[1]); tira(der[0],der[1]); }
  if(!pc){
    // ── teléfono ──
    // arriba: dos tiras de luces de colores que cuelgan sobre el logo, y una guirnalda de dulces
    const cols=['255,90,90','255,214,140','110,220,150','120,190,255','255,150,210'];
    const colgar=(x0,x1,y0,sag,paso)=>{ const n=Math.round((x1-x0)/paso); x.strokeStyle='#1a1430'; x.lineWidth=1.4; x.beginPath(); for(let i=0;i<=n;i++){ const u=i/n, px=x0+(x1-x0)*u, py=y0+Math.sin(u*Math.PI)*sag; i?x.lineTo(px,py):x.moveTo(px,py);
        if(i&&i<n){ C.luces.push({x:px,y:py+4,r:2.4,c:cols[i%5],a:N.rr(.8,1),v:N.rr(1,2.4),f:N.R()*6,k:6,ga:.9}); x.fillStyle='#6a7480'; x.fillRect(px-1.6,py,3.2,3); } } x.stroke(); };
    const topeLuces=Math.max(14,logo.t-24); colgar(-6,W/2,6,topeLuces-6,20); colgar(W/2,W+6,6,topeLuces-6,20);
    // bastones a las orillas, de abajo hasta arriba de la tarjeta, con tira de luces entre la tarjeta y el letrero
    const yTira=pie?Math.min(f.b+(pie.t-f.b)*.45,pie.t-16):f.b+28;
    const baston=(bx,lado)=>{ for(let y=H;y>yTira-14;y-=9){ x.fillStyle=((H-y)/9|0)%2?'#e3263c':'#fff'; x.fillRect(bx-4,y-9,8,9); } x.strokeStyle='#e3263c'; x.lineWidth=8; x.beginPath(); x.arc(bx+lado*9,yTira-14,9,Math.PI,0,lado<0); x.stroke(); };
    baston(6,1);
    colgar(6,W+6,yTira-10,Math.min(26,(pie?pie.t:f.b+60)-yTira-4),22);
    // casitas de jengibre en fila sobre la calle (detrás del letrero y de la mascota, como un pueblo)
    const hueco=suelo-f.b, hh=Math.max(48,Math.min(92,hueco*.42)), ww=hh*1.3;
    [[.17,1],[.47,.88],[.8,.92]].forEach(([u,s])=>{ const cx=u*W, w2=ww*s; if(masc&&cx+w2/2>masc.l+10&&cx-w2/2<masc.r-10) return; N.jengibre(x,cx,suelo+4,w2,hh*s,C); });
    // paleta junto a la mascota, del lado del letrero
    if(masc&&pie){ const px=(pie.r+masc.l)/2, py=Math.max(pie.t-10,f.b+40); if(masc.l-pie.r>34) paleta(px,py,14,'#e3263c','#ff8fa0'); }
  }
  // árbol con adornos junto a la mascota y su luz
  if(masc){ const th=pc?Math.min(H*.5,suelo-logo.t-60):Math.min(220,suelo-f.b+50), tw=th*.6, tcx=pc?Math.min(W-tw*.45,masc.r+tw*.3):Math.max(tw*.42,masc.l-tw*.15);
    if(pc) N.arbol(x,tcx,suelo-th-4,th,tw,C,{pc,fuera:(px,py)=>fuera(px,py,4),nieve:true});
    gg=x.createRadialGradient(masc.cx,suelo+6,4,masc.cx,suelo+6,masc.w); gg.addColorStop(0,'rgba(255,214,160,.45)'); gg.addColorStop(1,'rgba(255,214,160,0)'); x.fillStyle=gg; x.beginPath(); x.ellipse(masc.cx,suelo+6,masc.w,masc.w*.3,0,0,N.P); x.fill();
    x.fillStyle='rgba(90,50,100,.25)'; x.beginPath(); x.ellipse(masc.cx,suelo+8,masc.w*.32,masc.w*.07,0,0,N.P); x.fill(); }
  for(let i=0;i<(pc?40:16);i++){ const px=N.R()*W, py=N.R()*H; if(fuera(px,py,20)) continue; C.chispas.push({x:px,y:py,r:N.rr(2.5,6),v:N.rr(.6,1.4),f:N.R()*6}); }
  gg=x.createRadialGradient(W/2,marca.cy,10,W/2,marca.cy,marca.w*.75); gg.addColorStop(0,'rgba(20,8,40,.4)'); gg.addColorStop(1,'rgba(20,8,40,0)'); x.fillStyle=gg; x.fillRect(0,0,W,H);
  C.nCopos=pc?90:45;
}
window.__nvCasa=function(capa){
  var ls=document.getElementById('loginScreen'); if(!ls) return {detener:function(){}};
  var reducido=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  var cont=document.createElement('div'); cont.className='nvc'; capa.appendChild(cont);
  var vivo=null, luces=[], chispas=[], anim=[], cps=[], W=0, H=0, raf=0, firma='', parado=false;
  function rc(e,base){ var r=e.getBoundingClientRect(); var l=r.left-base.left, t=r.top-base.top; return {l:l,t:t,r:l+r.width,b:t+r.height,w:r.width,h:r.height,cx:l+r.width/2,cy:t+r.height/2}; }
  function medir(){ var base=capa.getBoundingClientRect(), m=ls.querySelector('.nv-mascota'), q=function(s){ return ls.querySelector(s); };
    if(!q('.login-logo')||!q('.login-brand')||!q('.login-form')) return null;
    return {W:Math.round(capa.clientWidth),H:Math.round(capa.clientHeight),pc:capa.clientWidth>=760,logo:rc(q('.login-logo'),base),marca:rc(q('.login-brand'),base),f:rc(q('.login-form'),base),masc:(m&&m.offsetWidth)?rc(m,base):null,pie:q('.login-footer')&&q('.login-footer').offsetWidth?rc(q('.login-footer'),base):null}; }
  function armar(){ if(parado||!capa.isConnected) return; var C=medir(); if(!C||!C.W||!C.H) return;
    var f=[C.W,C.H,Math.round(C.f.t),C.masc?[Math.round(C.masc.l),Math.round(C.masc.t),Math.round(C.masc.w)].join(','):'-'].join('|'); if(f===firma) return; firma=f;
    W=C.W; H=C.H; var D=Math.min(1.5,window.devicePixelRatio||1); C.luces=[]; C.chispas=[]; C.anim=[]; NV.sem(21);
    var fijo=NV.lienzo(W,H,D); dibujar(fijo.x,C); var v=NV.lienzo(W,H,D);
    cont.innerHTML=''; cont.appendChild(fijo.c); cont.appendChild(v.c); vivo=v.x; luces=C.luces; chispas=C.chispas; anim=C.anim; cps=reducido?[]:NV.copos(W,H,C.nCopos||(C.pc?110:60));
    if(reducido) NV.vivo(vivo,W,H,0,luces,[],[]); else if(!raf) raf=requestAnimationFrame(cuadro); }
  function cuadro(n){ raf=0; if(parado||!capa.isConnected) return;
    if(document.hidden||!ls.classList.contains('active')){ raf=requestAnimationFrame(cuadro); return; }
    var t=n/1000; NV.vivo(vivo,W,H,t,luces,cps,chispas); for(var i=0;i<anim.length;i++) anim[i](vivo,t); raf=requestAnimationFrame(cuadro); }
  armar(); var t1=setTimeout(armar,700), t2=setTimeout(armar,1800);      // la mascota y las fuentes se acomodan un momento después
  var ro=window.ResizeObserver?new ResizeObserver(function(){ clearTimeout(t1); t1=setTimeout(armar,200); }):null; if(ro){ ro.observe(capa); var mm=ls.querySelector('.nv-mascota'); if(mm) ro.observe(mm); }
  return {detener:function(){ parado=true; if(raf) cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2); if(ro) ro.disconnect(); cont.remove(); }};
};
})();
