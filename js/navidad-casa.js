// ── Navidad en casa (22–27 dic): escena del login «El árbol» ──
// Ilustración pintada en canvas: sala cálida con luces desenfocadas, piso de madera, un árbol frondoso de verdad
// (ramas aguja por aguja) con listón dorado, esferas con reflejos, foquitos y estrella con rayos; en PC un segundo
// árbol desenfocado al fondo y regalos con volumen. Se arma alrededor de lo fijo del login (logo, nombre y tarjeta) y
// del lugar donde está la mascota del login: el piso queda a la altura de sus pies, el árbol principal a su lado y un
// charco de luz cálida debajo de ella; regalos, adornos y destellos no caen encima. La mascota no se toca: solo se lee
// su posición (si cambia de lugar o de tamaño, la escena se vuelve a armar).
// Dos capas: la fija se pinta una vez (y al cambiar el tamaño); la viva (luces que respiran, nieve, destellos) corre
// solo con el login a la vista. Con movimiento reducido, la viva se pinta una vez y queda quieta.
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
  // ── rama de pino: tallo curvo con agujas a los dos lados ──
  const VERDES=[['#0b3320','#0f4429','#145234','#1a6040','#21704b'],['#0d3a26','#124a30','#185a3a','#1f6a46','#2a7d55']];
  function rama(x,x0,y0,ang,len,{grosor=1.6,dens=1,pal=0,caida=.25,luz=.0,nieve=0}={}){
    const pts=[]; const n=Math.max(6,Math.round(len/4));
    for(let i=0;i<=n;i++){ const t=i/n, a=ang+caida*t*t; pts.push([x0+Math.cos(ang)*len*t+Math.cos(a)*0, y0+Math.sin(ang)*len*t+caida*len*t*t*.6]); }
    x.strokeStyle='#3a2a1a'; x.lineWidth=grosor*1.4; x.lineCap='round'; x.beginPath(); pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.stroke();
    const V=VERDES[pal];
    for(let i=1;i<pts.length;i++){ const t=i/(pts.length-1), [px,py]=pts[i], dir=Math.atan2(pts[i][1]-pts[i-1][1],pts[i][0]-pts[i-1][0]), L=len*(.16+.06*(1-t))*(1-t*.45);
      for(let k=0;k<Math.round(5*dens);k++){ for(const sd of [-1,1]){ const a=dir+sd*rr(.55,1.15), l=L*rr(.7,1.1), ci=Math.min(4,Math.max(0,Math.round((sd<0?1.5:2.6)+luz*2+rr(-1.2,1.2))));
        x.strokeStyle=V[ci]; x.lineWidth=grosor*rr(.7,1.05); x.beginPath(); x.moveTo(px+rr(-1,1),py+rr(-1,1)); x.quadraticCurveTo(px+Math.cos(a)*l*.5,py+Math.sin(a)*l*.5+l*.06,px+Math.cos(a)*l,py+Math.sin(a)*l+l*.12); x.stroke(); } } }
    if(nieve){ for(let i=2;i<pts.length;i+=3){ const t=i/(pts.length-1); if(R()>nieve) continue; const [px,py]=pts[i], w=len*.075*(1-t*.5);
      for(let k=0;k<3;k++){ const ox=rr(-w,w), oy=rr(-w*.5,0), r=w*rr(.45,.8), g=x.createRadialGradient(px+ox-r*.3,py+oy-r*.4,0,px+ox,py+oy,r); g.addColorStop(0,'rgba(255,255,255,.98)'); g.addColorStop(.75,'rgba(225,238,250,.95)'); g.addColorStop(1,'rgba(190,212,235,0)'); x.fillStyle=g; x.beginPath(); x.arc(px+ox,py+oy,r,0,P); x.fill(); } } }
    return pts; }
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
  // ── luces: se guardan para la capa viva ──
  const COLS={calido:['255,190,90','255,214,140','255,170,70'],color:['255,70,80','255,200,80','90,220,140','90,170,255','255,120,200']};
  function cable(x,pts,ancho=1.6){ x.strokeStyle='#1a1f14'; x.lineWidth=ancho; x.beginPath(); pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.stroke(); }
  function curva(x0,y0,x1,y1,caida,n){ const pts=[]; for(let i=0;i<=n;i++){ const t=i/n; pts.push([lerp(x0,x1,t),lerp(y0,y1,t)+caida*4*t*(1-t)]); } return pts; }
  // capa viva: luces que respiran, nieve con profundidad y destellos
  function vivo(x,W,H,t,luces,copos,chispas){
    x.clearRect(0,0,W,H); x.save(); x.globalCompositeOperation='lighter';
    for(const l of luces){ const a=l.a*(.72+.28*Math.sin(t*l.v+l.f)), r=l.r;
      const g=x.createRadialGradient(l.x,l.y,0,l.x,l.y,r*8); g.addColorStop(0,`rgba(${l.c},${.7*a})`); g.addColorStop(.2,`rgba(${l.c},${.3*a})`); g.addColorStop(1,`rgba(${l.c},0)`); x.fillStyle=g; x.beginPath(); x.arc(l.x,l.y,r*8,0,P); x.fill();
      x.fillStyle=`rgba(255,250,235,${.95*a})`; x.beginPath(); x.arc(l.x,l.y,r*.55,0,P); x.fill(); x.fillStyle=`rgba(${l.c},${.9*a})`; x.beginPath(); x.arc(l.x,l.y,r,0,P); x.fill(); }
    for(const c of chispas){ const a=Math.max(0,Math.sin(t*c.v+c.f))**8; if(a<.03) continue; const L=c.r*(1+a); x.strokeStyle=`rgba(255,240,200,${a})`; x.lineWidth=1.2; x.beginPath(); x.moveTo(c.x-L,c.y); x.lineTo(c.x+L,c.y); x.moveTo(c.x,c.y-L); x.lineTo(c.x,c.y+L); x.stroke(); x.fillStyle=`rgba(255,255,255,${a})`; x.beginPath(); x.arc(c.x,c.y,1.4,0,P); x.fill(); }
    x.restore();
    for(const k of copos){ const y=((k.y+t*k.v)%(H+40))-20, xx=k.x+Math.sin(t*k.o+k.f)*k.amp; if(k.r>3){ const g=x.createRadialGradient(xx,y,0,xx,y,k.r); g.addColorStop(0,`rgba(255,255,255,${k.a})`); g.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=g; } else x.fillStyle=`rgba(255,255,255,${k.a})`; x.beginPath(); x.arc(xx,y,k.r,0,P); x.fill(); } }
  function copos(W,H,n){ const a=[]; for(let i=0;i<n;i++){ const z=R(); a.push({x:R()*W,y:R()*H,r:z<.12?rr(4,8):rr(.8,2.4),a:z<.12?.35:rr(.5,.9),v:z<.12?rr(40,60):rr(14,34),o:rr(.3,.8),f:R()*6,amp:rr(6,20)}); } return a; }
  function arbol(x,cx,top,h,w,C,{fuera=()=>false,pc=true}={}){
    const filas=Math.round(h/(pc?11:10));
    for(let i=0;i<filas;i++){ const t=i/filas, y=top+t*h, hw=w*.5*(.06+t*.94);
      for(const sd of [-1,1]) for(let k=0;k<3;k++){ const a=sd<0?Math.PI-N1(.25,.7):N1(.25,.7), L=hw*N1(.55,1.05); rama(x,cx+sd*N1(0,hw*.15),y,a,L,{grosor:pc?1.6:1.3,dens:.9,pal:k%2,caida:.3,luz:(sd>0?.2:-.2)+t*.0}); } }
    for(let i=0;i<filas*2;i++){ const t=R(), y=top+t*h, hw=w*.5*(.06+t*.94), px=cx+(R()*2-1)*hw*.8; rama(x,px,y,N1(0,P),N1(14,32)*(pc?1:.8),{grosor:1.4,dens:1,pal:1,caida:.4,luz:.35}); }
    // listón dorado en espiral
    for(let j=0;j<5;j++){ const y0=top+h*(.12+j*.18), y1=y0+h*.11, hw0=w*.5*(.06+(.12+j*.18)*.94), hw1=w*.5*(.06+(.23+j*.18)*.94);
      const g=x.createLinearGradient(cx-hw0,y0,cx+hw1,y1); g.addColorStop(0,'#8a6a1a'); g.addColorStop(.5,'#ffe6a0'); g.addColorStop(1,'#a07818'); x.strokeStyle=g; x.lineWidth=pc?6:4; x.lineCap='round';
      const pts=[]; x.beginPath(); for(let s2=0;s2<=20;s2++){ const u=s2/20, px=cx+lerp(-hw0,hw1,u)*.92, py=lerp(y0,y1,u)+Math.sin(u*Math.PI)*h*.05; if(fuera(px,py)){ x.stroke(); x.beginPath(); continue; } s2&&!fuera(cx+lerp(-hw0,hw1,(s2-1)/20)*.92,lerp(y0,y1,(s2-1)/20))?x.lineTo(px,py):x.moveTo(px,py); } x.stroke(); }
    // esferas y luces
    const cols=Object.keys(ESF); for(let i=0;i<Math.round(h/(pc?9:12));i++){ const t=N1(.1,.95), y=top+t*h, hw=w*.5*(.06+t*.94)*.85, px=cx+(R()*2-1)*hw; if(fuera(px,y)) continue; esfera(x,px,y,N1(pc?6:5,pc?12:9),ESF[cols[i%cols.length]],{brillo:.9}); }
    for(let i=0;i<Math.round(h/(pc?3.2:4.5));i++){ const t=N1(.05,.98), y=top+t*h, hw=w*.5*(.06+t*.94)*.9, px=cx+(R()*2-1)*hw; if(fuera(px,y)) continue; C.luces.push({x:px,y,r:pc?2.2:1.8,c:R()<.75?'255,200,110':['255,90,90','120,200,255','255,140,210'][(R()*3)|0],a:N1(.7,1),v:N1(1,2.6),f:R()*6}); }
    estrella(x,cx,top-(pc?8:6),pc?22:16,C); }
  function estrella(x,cx,cy,r,C){ x.save(); x.globalCompositeOperation='lighter'; for(let i=0;i<12;i++){ const a=i*P/12, L=r*(i%2?2.2:3.6); const g=x.createLinearGradient(cx,cy,cx+Math.cos(a)*L,cy+Math.sin(a)*L); g.addColorStop(0,'rgba(255,230,150,.55)'); g.addColorStop(1,'rgba(255,230,150,0)'); x.strokeStyle=g; x.lineWidth=2; x.beginPath(); x.moveTo(cx,cy); x.lineTo(cx+Math.cos(a)*L,cy+Math.sin(a)*L); x.stroke(); } x.restore();
    let p=''; x.beginPath(); for(let i=0;i<10;i++){ const a=i*Math.PI/5-Math.PI/2, rr2=i%2?r*.45:r; i?x.lineTo(cx+Math.cos(a)*rr2,cy+Math.sin(a)*rr2):x.moveTo(cx+Math.cos(a)*rr2,cy+Math.sin(a)*rr2); } x.closePath();
    const g=x.createRadialGradient(cx-r*.2,cy-r*.3,1,cx,cy,r); g.addColorStop(0,'#fffbe0'); g.addColorStop(.5,'#ffd35a'); g.addColorStop(1,'#c98a10'); x.fillStyle=g; x.fill(); x.strokeStyle='#fff3c0'; x.lineWidth=1; x.stroke();
    C.luces.push({x:cx,y:cy,r:r*.5,c:'255,220,140',a:1,v:1.2,f:0}); }
  const N1=rr;
  return {arbol,estrella,P,R,rr,sem,lerp,lienzo,bokeh,rama,esfera,ESF,regalo,COLS,cable,curva,vivo,copos};
})();

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
    const hueco=W-f.r, top=Math.max(40,logo.t-10), tw=Math.min(hueco*.95,(piso-top)*.62), h=piso-top-tw*.3, cx=masc?Math.min(W-tw*.42,masc.r+tw*.18):f.r+hueco/2;   // la falda del árbol cuelga ~0.3 del ancho: el alto se recorta para que asiente en el piso
    // árbol del fondo (izquierda), desenfocado
    const tmp=N.lienzo(W,H,1), C2={luces:[]}; const tw2=Math.min(f.l*.8,H*.42), t2=piso-H*.6; N.arbol(tmp.x,Math.max(180,f.l*.5),t2,piso-t2-tw2*.3,tw2,C2,{pc});
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
