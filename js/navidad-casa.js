// ── Navidad en casa (22–27 dic): escena del login «Llegamos a la casita» ──
// Es el final de la historia de Pre-Navidad: el mismo mundo (aurora, montañas nevadas, lago congelado, pinos escarchados
// con moño rojo), la casita roja que se venía acercando ya de cerca con humo en la chimenea, el trineo del «Rumbo a
// Navidad» estacionado en su puerta con los regalos, el cordón de foquitos arriba ya todo encendido y el árbol de
// Navidad grande (estilo clásico) junto a la mascota; en el teléfono se asoma la mitad del árbol por la orilla derecha.
// El cordón es SVG del DOM con .nv-guirnalda .nv-luz: es el que usa la historia de la mascota (js/navidad-historia.js).
// La mascota no se toca: solo se lee su posición para dejarle su lugar (piso a la altura de sus pies, su luz, la falda
// del árbol); si cambia de lugar o de tamaño, la escena se vuelve a armar.
// Easter eggs (al tocar fuera de la tarjeta): la estrella del árbol (destello y lluvia de oro; al tercer toque «¡Feliz
// Navidad!»), la chimenea (humo en forma de corazón), la puerta (se abre con luz), el trineo (confeti) y cualquier
// foquito del cordón (ola de luz). Ambiente: estrellas fugaces en la aurora y, cada 40–70 s, Santa a lo lejos.
// Rendimiento: la escena pesada se pinta una vez (y al cambiar el tamaño); la capa viva usa brillos precalculados
// (una imagen por color que solo se escala), corre solo con el login a la vista y se detiene del todo si no;
// resolución tope 1.5×. Con movimiento reducido la capa viva se pinta una vez y queda quieta (los toques siguen).
// La usa armarCasa() en js/navidad.js: window.__nvCasa(capa) → { detener() }.
(function(){
'use strict';
// Motor de ilustración «producida» para el login de Navidad: capas fijas (se pintan una vez) + capa viva (luces,
// nieve y destellos). Ramas de pino aguja por aguja, luces con resplandor, esferas con reflejos, regalos con volumen,
// bokeh y profundidad (lo lejano y lo muy cercano, desenfocado).
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
  // capa viva: luces que respiran (brillo precalculado por color: una imagen que solo se escala), nieve y destellos
  const SPR={}; function sprite(c){ if(SPR[c]) return SPR[c]; const s=document.createElement('canvas'); s.width=s.height=64; const q=s.getContext('2d'), g=q.createRadialGradient(32,32,0,32,32,32);
    g.addColorStop(0,`rgba(${c},.7)`); g.addColorStop(.2,`rgba(${c},.3)`); g.addColorStop(1,`rgba(${c},0)`); q.fillStyle=g; q.fillRect(0,0,64,64); return SPR[c]=s; }
  function vivo(x,W,H,t,luces,copos,chispas){
    x.clearRect(0,0,W,H); x.save(); x.globalCompositeOperation='lighter';
    for(const l of luces){ const a=l.a*(.72+.28*Math.sin(t*l.v+l.f)), R2=l.r*(l.k||8); x.globalAlpha=a*(l.ga||1); x.drawImage(l.spr||(l.spr=sprite(l.c)),l.x-R2,l.y-R2,R2*2,R2*2); }
    x.globalAlpha=1;
    for(const l of luces){ const a=l.a*(.72+.28*Math.sin(t*l.v+l.f)); x.fillStyle=`rgba(${l.c},${.9*a})`; x.beginPath(); x.arc(l.x,l.y,l.r,0,P); x.fill(); }
    for(const c of chispas){ const a=Math.max(0,Math.sin(t*c.v+c.f))**8; if(a<.03) continue; const L=c.r*(1+a); x.strokeStyle=`rgba(255,240,200,${a})`; x.lineWidth=1.2; x.beginPath(); x.moveTo(c.x-L,c.y); x.lineTo(c.x+L,c.y); x.moveTo(c.x,c.y-L); x.lineTo(c.x,c.y+L); x.stroke(); }
    x.restore(); const nieve=sprite('255,255,255');
    for(const k of copos){ const y=((k.y+t*k.v)%(H+40))-20, xx=k.x+Math.sin(t*k.o+k.f)*k.amp; if(k.r>3){ x.globalAlpha=k.a; x.drawImage(nieve,xx-k.r*1.4,y-k.r*1.4,k.r*2.8,k.r*2.8); x.globalAlpha=1; } else { x.fillStyle=`rgba(255,255,255,${k.a})`; x.fillRect(xx-k.r*.7,y-k.r*.7,k.r*1.4,k.r*1.4); } } }
  function copos(W,H,n){ const a=[]; for(let i=0;i<n;i++){ const z=R(); a.push({x:R()*W,y:R()*H,r:z<.12?rr(4,8):rr(.8,2.4),a:z<.12?.35:rr(.5,.9),v:z<.12?rr(40,60):rr(14,34),o:rr(.3,.8),f:R()*6,amp:rr(6,20)}); } return a; }
  return {P,R,rr,sem,lerp,lienzo,esfera,ESF,regalo,vivo,copos};
})();

// Dibujos de postal: luna, trineo de Santa con renos (silueta), casa nevada con luces, casa de jengibre, chimenea.
(function(N){ const P=Math.PI*2, R=N.R, rr=N.rr;
  // trineo con 4 renos en vuelo, en silueta; s = escala, f = fase del galope
  N.trineo=(x,px,py,s,f,col)=>{ x.save(); x.translate(px,py); x.scale(s,s); x.fillStyle=col; x.strokeStyle=col; x.lineCap='round'; x.lineJoin='round';
    const reno=(rx,ry,ph)=>{ x.save(); x.translate(rx,ry+Math.sin(ph)*2); x.beginPath(); x.ellipse(0,0,17,6.5,-.08,0,P); x.fill();
      x.beginPath(); x.moveTo(12,-3); x.quadraticCurveTo(18,-10,20,-15); x.lineTo(24,-14); x.quadraticCurveTo(21,-8,16,1); x.fill();
      x.beginPath(); x.ellipse(23,-16,5,3,-.3,0,P); x.fill(); x.beginPath(); x.moveTo(26,-17); x.lineTo(30,-15.5); x.lineTo(26,-14.5); x.fill();
      x.lineWidth=1.6; x.beginPath(); x.moveTo(21,-19); x.lineTo(18,-28); x.moveTo(19.5,-23); x.lineTo(15,-26); x.moveTo(18.6,-26); x.lineTo(21,-30); x.moveTo(23,-19); x.lineTo(24,-27); x.moveTo(23.6,-23); x.lineTo(27,-26); x.stroke();
      x.lineWidth=2.6; const a=Math.sin(ph)*.35; x.beginPath(); x.moveTo(10,3); x.lineTo(10+Math.cos(.4+a)*13,3+Math.sin(.4+a)*13*.2+6); x.lineTo(24+a*6,6+a*4); x.moveTo(6,3); x.lineTo(16,9+a*3);
      x.moveTo(-12,2); x.lineTo(-22-a*4,8); x.lineTo(-30-a*6,4); x.moveTo(-9,3); x.lineTo(-18,10-a*3); x.stroke();
      x.beginPath(); x.moveTo(-16,-2); x.lineTo(-21,-6); x.lineTo(-17,-1); x.fill(); x.restore(); };
    for(let i=3;i>=0;i--){ const rx=60+i*46, ry=-i*7; reno(rx,ry,f*8+i*1.3); }
    x.lineWidth=1.2; x.beginPath(); x.moveTo(26,4); for(let i=0;i<4;i++) x.lineTo(60+i*46+8,-i*7+2); x.stroke();
    // trineo
    x.lineWidth=3; x.beginPath(); x.moveTo(-60,14); x.lineTo(14,14); x.quadraticCurveTo(28,14,26,2); x.quadraticCurveTo(24,-4,18,-2); x.stroke();
    x.lineWidth=2; x.beginPath(); x.moveTo(-40,14); x.lineTo(-38,6); x.moveTo(0,14); x.lineTo(-2,6); x.stroke();
    x.beginPath(); x.moveTo(-58,6); x.lineTo(-56,-10); x.quadraticCurveTo(-58,-22,-48,-22); x.lineTo(-44,-12); x.lineTo(4,-12); x.quadraticCurveTo(14,-14,16,-4); x.lineTo(12,6); x.closePath(); x.fill();
    // Santa y el saco
    x.beginPath(); x.ellipse(-22,-20,11,10,0,0,P); x.fill(); x.beginPath(); x.arc(-18,-33,6.5,0,P); x.fill();
    x.beginPath(); x.moveTo(-23,-36); x.quadraticCurveTo(-26,-50,-36,-44); x.lineTo(-34,-40); x.lineTo(-14,-36); x.fill(); x.beginPath(); x.arc(-37,-44,2.6,0,P); x.fill();
    x.lineWidth=3; x.beginPath(); x.moveTo(-14,-24); x.quadraticCurveTo(-4,-34,6,-30); x.stroke();
    x.beginPath(); x.ellipse(-44,-24,12,14,-.3,0,P); x.fill(); x.beginPath(); x.moveTo(-48,-36); x.lineTo(-44,-44); x.lineTo(-40,-37); x.fill();
    x.restore(); };
  // casa nevada con luces (fachada), base en (cx,base)
  N.casa=(x,cx,base,w,h,C,{pared='#8a2a22',techo='#3a1a14',luces=true,corona=true,humo=0}={})=>{ const roofH=h*.55, k=w/140;
    // pared con tablas
    let g=x.createLinearGradient(cx-w/2,0,cx+w/2,0); g.addColorStop(0,pared); g.addColorStop(1,shade(pared,-.25)); x.fillStyle=g; x.fillRect(cx-w/2,base-h,w,h);
    x.strokeStyle='rgba(0,0,0,.18)'; x.lineWidth=1; for(let y=base-h+8*k;y<base;y+=8*k){ x.beginPath(); x.moveTo(cx-w/2,y); x.lineTo(cx+w/2,y); x.stroke(); }
    // chimenea
    x.fillStyle='#5a2a1e'; x.fillRect(cx+w*.2,base-h-roofH*.8,w*.12,roofH*.6); x.fillStyle='#f4f8ff'; rrect(x,cx+w*.19,base-h-roofH*.84,w*.14,7*k,3*k); x.fill();
    // techo y nieve gorda
    x.fillStyle=techo; x.beginPath(); x.moveTo(cx-w/2-12*k,base-h+4*k); x.lineTo(cx,base-h-roofH); x.lineTo(cx+w/2+12*k,base-h+4*k); x.closePath(); x.fill();
    g=x.createLinearGradient(0,base-h-roofH,0,base-h+10*k); g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#d6e6f5'); x.fillStyle=g;
    x.beginPath(); x.moveTo(cx-w/2-16*k,base-h+6*k); x.lineTo(cx,base-h-roofH-8*k); x.lineTo(cx+w/2+16*k,base-h+6*k);
    for(let t=1;t>=0;t-=.08){ const xx=cx-w/2-16*k+(w+32*k)*t; x.quadraticCurveTo(xx+6*k,base-h+14*k+R()*6*k,xx,base-h+8*k); } x.closePath(); x.fill();
    for(let xx=cx-w/2-10*k;xx<cx+w/2+10*k;xx+=rr(6,10)*k){ const L=rr(4,14)*k; x.fillStyle='rgba(225,240,255,.95)'; x.beginPath(); x.moveTo(xx,base-h+8*k); x.lineTo(xx+3*k,base-h+8*k+L); x.lineTo(xx+6*k,base-h+8*k); x.fill(); }
    // ventanas encendidas
    const ven=(vx,vy,vw,vh)=>{ let gg=x.createRadialGradient(vx+vw/2,vy+vh/2,1,vx+vw/2,vy+vh/2,vw*1.6); gg.addColorStop(0,'rgba(255,200,110,.35)'); gg.addColorStop(1,'rgba(255,200,110,0)'); x.fillStyle=gg; x.fillRect(vx-vw,vy-vh,vw*3,vh*3);
      gg=x.createLinearGradient(0,vy,0,vy+vh); gg.addColorStop(0,'#ffe9a8'); gg.addColorStop(1,'#ffb347'); x.fillStyle=gg; x.fillRect(vx,vy,vw,vh); x.fillStyle='#3a1a10'; x.fillRect(vx+vw/2-1.2*k,vy,2.4*k,vh); x.fillRect(vx,vy+vh/2-1.2*k,vw,2.4*k);
      x.strokeStyle='#f4ead8'; x.lineWidth=3*k; x.strokeRect(vx,vy,vw,vh); x.fillStyle='#fff'; x.fillRect(vx-3*k,vy+vh,vw+6*k,4*k); };
    ven(cx-w*.38,base-h*.72,w*.2,h*.3); ven(cx+w*.18,base-h*.72,w*.2,h*.3);
    // puerta con corona
    x.fillStyle='#2a3a1a'; rrect(x,cx-w*.1,base-h*.55,w*.2,h*.55,w*.1); x.fill(); x.fillStyle='#e9c15a'; x.beginPath(); x.arc(cx+w*.05,base-h*.28,1.8*k,0,P); x.fill();
    if(corona){ x.strokeStyle='#1f6b45'; x.lineWidth=5*k; x.beginPath(); x.arc(cx,base-h*.4,w*.06,0,P); x.stroke(); x.fillStyle='#d0283c'; x.beginPath(); x.arc(cx,base-h*.4+w*.06,2.6*k,0,P); x.fill(); }
    // luces en el borde del techo
    if(luces){ const cols=['255,90,90','255,214,140','110,220,150','120,190,255','255,150,210']; for(let t=0;t<=1.001;t+=.07){ for(const sd of [-1,1]){ const xx=cx+sd*(w/2+12*k)*(1-t), yy=base-h+6*k-(roofH+6*k)*t; C.luces.push({x:xx,y:yy+3*k,r:2*Math.max(.8,k),c:cols[(Math.round(t*14)+(sd>0?2:0))%5],a:rr(.8,1),v:rr(1.2,2.6),f:R()*6,k:6,ga:.8}); } } }
    if(humo) C.anim.push((v,t)=>{ for(let i=0;i<4;i++){ const u=((t*.12+i/4)%1), sx=cx+w*.26+u*18*k+Math.sin(t+i)*4*k, sy=base-h-roofH*.88-u*60*k; v.fillStyle=`rgba(230,238,248,${.35*(1-u)})`; v.beginPath(); v.arc(sx,sy,(5+u*14)*k,0,P); v.fill(); } });
  };
  function shade(hex,amt){ const n=parseInt(hex.slice(1),16); let r=(n>>16)&255,g=(n>>8)&255,b=n&255; const f=v=>Math.max(0,Math.min(255,Math.round(v+(amt<0?v*amt:(255-v)*amt)))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
  function rrect(x,X,Y,W,H,r){ x.beginPath(); x.moveTo(X+r,Y); x.arcTo(X+W,Y,X+W,Y+H,r); x.arcTo(X+W,Y+H,X,Y+H,r); x.arcTo(X,Y+H,X,Y,r); x.arcTo(X,Y,X+W,Y,r); x.closePath(); }
  N.shade=shade; N.rrect=rrect;
})(NV);

// El mundo de Pre-Navidad, visto ya en Navidad: cielo con aurora, montañas nevadas, lago congelado, pinos escarchados con
// moño rojo, la casita roja (ahora de cerca), el trineo del «Rumbo a Navidad» y el cordón de foquitos (ya todo encendido)
// como guirnalda real del DOM (.nv-guirnalda .nv-luz), la que usa la historia de la mascota.
(function(N){ const P=Math.PI*2, R=N.R, rr=N.rr;
  N.cieloPre=(x,W,H,hz)=>{ let g=x.createLinearGradient(0,0,0,hz); g.addColorStop(0,'#031428'); g.addColorStop(.55,'#0a2d55'); g.addColorStop(1,'#1c5a8f'); x.fillStyle=g; x.fillRect(0,0,W,H);
    x.save(); x.globalCompositeOperation='lighter'; [['80,255,170',.2,1.2,.9],['70,220,255',.27,1.7,.7],['200,110,255',.15,2.1,.5]].forEach(([c,y,f,a])=>{ for(let px=0;px<=W;px+=4){ const yc=hz*y+Math.sin(px/W*Math.PI*f+1)*30+Math.sin(px/80)*9, al=a*(.55+.45*Math.sin(px/70+f)), h=hz*.22+Math.sin(px/55)*30;
      const gg=x.createLinearGradient(0,yc-h,0,yc+20); gg.addColorStop(0,`rgba(${c},0)`); gg.addColorStop(.75,`rgba(${c},${al*.42})`); gg.addColorStop(1,`rgba(${c},0)`); x.fillStyle=gg; x.fillRect(px,yc-h,4,h+20); } }); x.restore();
    for(let i=0;i<Math.round(W/4);i++){ x.globalAlpha=rr(.3,1); x.fillStyle='#fff'; x.beginPath(); x.arc(R()*W,R()*hz*.75,rr(.4,1.4),0,P); x.fill(); } x.globalAlpha=1; };
  N.montesPre=(x,W,base,alto)=>{ const sx=Math.min(W/412,1.45), tw=412*sx;
    for(let k=0;k*tw<W;k++){ x.save(); x.translate(k*tw+(k%2?tw:0),base-330*alto/330); x.scale((k%2?-1:1)*sx,alto/330);
      let g=x.createLinearGradient(0,0,0,330); g.addColorStop(0,'#eaf6ff'); g.addColorStop(1,'#a9d0ea'); x.fillStyle=g; x.globalAlpha=.85; x.beginPath(); x.moveTo(0,220); [[60,120],[90,150],[140,70],[200,160],[250,100],[300,150],[350,80],[412.5,175],[412.5,330],[0,330]].forEach(p=>x.lineTo(p[0],p[1])); x.fill(); x.globalAlpha=1;
      x.fillStyle='#fff'; x.beginPath(); x.moveTo(140,70); x.lineTo(160,100); x.lineTo(150,98); x.lineTo(140,112); x.lineTo(128,96); x.lineTo(120,102); x.closePath(); x.moveTo(350,80); x.lineTo(368,108); x.lineTo(356,104); x.lineTo(348,116); x.lineTo(338,102); x.lineTo(332,106); x.closePath(); x.fill();
      g=x.createLinearGradient(0,0,0,330); g.addColorStop(0,'#fff'); g.addColorStop(.5,'#cfe6f6'); g.addColorStop(1,'#8db9da'); x.fillStyle=g; x.beginPath(); x.moveTo(0,248); [[40,190],[80,220],[130,160],[190,230],[240,180],[290,230],[340,170],[412.5,240],[412.5,330],[0,330]].forEach(p=>x.lineTo(p[0],p[1])); x.fill(); x.restore(); } };
  N.lagoPre=(x,W,y,h)=>{ const g=x.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#bfe3f8'); g.addColorStop(1,'#e9f7ff'); x.fillStyle=g; x.fillRect(0,y,W,h); x.strokeStyle='#fff'; x.lineWidth=2; x.beginPath(); x.moveTo(0,y); x.lineTo(W,y); x.stroke();
    x.globalAlpha=.5; x.lineWidth=1; for(let i=0;i<W/60;i++){ const px=R()*W, py=y+rr(6,h-4); x.beginPath(); x.moveTo(px,py); x.lineTo(px+rr(30,90),py); x.stroke(); } x.globalAlpha=1; };
  // pino escarchado de Pre-Navidad (azulado, nieve en las ramas, moño rojo arriba y esferas rojas)
  N.pinoPre=(x,px,py,k)=>{ x.save(); x.translate(px,py); x.scale(k,k); const g=x.createLinearGradient(-24,0,24,0); g.addColorStop(0,'#1d4a6a'); g.addColorStop(1,'#2f6a8f'); x.fillStyle=g;
    x.beginPath(); [[0,-70],[14,-40],[8,-40],[20,-16],[12,-16],[24,6],[-24,6],[-12,-16],[-20,-16],[-8,-40],[-14,-40]].forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.closePath(); x.fill();
    x.fillStyle='#fff'; x.strokeStyle='#fff'; x.lineWidth=2; x.lineJoin='round'; x.beginPath(); x.moveTo(0,-70); x.lineTo(8,-52); x.lineTo(0,-54); x.lineTo(-8,-52); x.closePath(); x.fill();
    [[-14,-40,14],[-20,-16,20],[-24,6,24]].forEach(([a,b,w])=>{ x.beginPath(); x.moveTo(a,b); x.lineTo(a+w*.4,b+3); x.lineTo(0,b-2); x.lineTo(w*.4,b+3); x.lineTo(w,b); x.stroke(); });
    x.fillStyle='#d81e34'; x.beginPath(); x.moveTo(0,-70); x.bezierCurveTo(-9,-78,-12,-68,-4,-67); x.closePath(); x.moveTo(0,-70); x.bezierCurveTo(9,-78,12,-68,4,-67); x.closePath(); x.fill();
    [[-8,-34],[9,-22],[-12,-6],[12,2]].forEach(([a,b],j)=>{ x.fillStyle=j%2?'#e3263c':'#c4152c'; x.beginPath(); x.arc(a,b,3.4-j*.2,0,P); x.fill(); }); x.restore(); };
  // la casita roja de Pre-Navidad, de cerca: misma paleta (pared roja, techo blanco, ventanas amarillas)
  N.casitaPre=(x,cx,base,w,C,humo=true)=>{ N.casa(x,cx,base,w,w*.72,C,{pared:'#c4152c',techo:'#7a1020',humo}); };
  // el trineo del «Rumbo a Navidad», que ya llegó: rojo con filete dorado y regalos
  N.trineoPre=(x,cx,base,s)=>{ x.save(); x.translate(cx,base); x.scale(s,s); x.lineCap='round';
    x.strokeStyle='#c9d4de'; x.lineWidth=5; x.beginPath(); x.moveTo(-70,0); x.lineTo(54,0); x.quadraticCurveTo(76,0,72,-18); x.stroke(); x.lineWidth=4; x.beginPath(); x.moveTo(-46,0); x.lineTo(-44,-12); x.moveTo(30,0); x.lineTo(28,-12); x.stroke();
    let g=x.createLinearGradient(0,-50,0,-10); g.addColorStop(0,'#e3263c'); g.addColorStop(1,'#8a0f1f'); x.fillStyle=g; x.beginPath(); x.moveTo(-64,-12); x.lineTo(-60,-46); x.quadraticCurveTo(-64,-66,-46,-64); x.lineTo(-40,-44); x.lineTo(40,-44); x.quadraticCurveTo(58,-48,60,-30); x.lineTo(54,-12); x.closePath(); x.fill();
    x.strokeStyle='#f2c45a'; x.lineWidth=3; x.beginPath(); x.moveTo(-58,-40); x.lineTo(44,-40); x.moveTo(-60,-18); x.lineTo(52,-18); x.stroke();
    N.regalo(x,-22,-44,38,30,14,['#1f7a4f','#0f4a30'],['#ffe6a0','#c9952a']); N.regalo(x,16,-44,32,40,12,['#f2c45a','#b07a18'],['#d0283c','#8a0f1f']); N.regalo(x,-2,-80,26,20,10,['#2a6ad0','#123a7a'],['#fff4dc','#cfc0a0']); x.restore(); };
  // cordón de foquitos de Pre-Navidad, ya encendido, como SVG del DOM (.nv-guirnalda con .nv-luz: la mascota roba el último)
  N.cordonPre=(W,alto)=>{ const tramos=Math.max(2,Math.round(W/225)), anT=W/tramos, cols=['#e3263c','#f2c45a','#e3263c','#2bb38a','#e3263c','#9cd7ff']; let s='', n=0;
    for(let t=0;t<tramos;t++){ const x0=t*anT-(t?0:10), x1=(t+1)*anT+(t===tramos-1?10:0), y0=t%2?20:12, y1=t%2?12:20, mx=(x0+x1)/2, my=(y0+y1)/2+alto*.5;
      s+=`<path d="M${x0} ${y0} Q${mx} ${my} ${x1} ${y1}" stroke="#2a3a4a" stroke-width="1.6" fill="none"/>`;
      for(let i=1;i<11;i++){ const u=i/11, px=(1-u)*(1-u)*x0+2*(1-u)*u*mx+u*u*x1, py=(1-u)*(1-u)*y0+2*(1-u)*u*my+u*u*y1, c=cols[n%cols.length], rot=((n*29)%30)-15;
        s+=`<g class="nv-foco-interactivo" role="button" tabindex="0" aria-label="Apagar luz navideña" aria-pressed="true" transform="translate(${px.toFixed(1)} ${(py+2).toFixed(1)}) rotate(${rot})"><rect x="-9" y="-6" width="18" height="34" fill="transparent"/><circle cy="11" r="13" fill="${c}" opacity=".25" class="nvq-halo" style="animation-delay:-${(n*.37%2.4).toFixed(2)}s"/><rect x="-3" y="-1" width="6" height="5" rx="1" fill="#5a6a7a"/><path class="nv-luz" d="M0 3 C-6 5 -6 15 0 18 C6 15 6 5 0 3Z" fill="${c}"/><ellipse cx="-1.6" cy="8" rx="1.1" ry="2.2" fill="#fff" opacity=".6"/></g>`; n++; } }
    return `<svg class="nv-guirnalda" viewBox="0 0 ${W} ${alto+30}" width="${W}" height="${alto+30}" style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none"><style>.nvq-halo{animation:nvqHalo 2.4s ease-in-out infinite}@keyframes nvqHalo{0%,100%{opacity:.32}50%{opacity:.12}}</style>${s}</svg>`; };
})(NV);

// Árbol de Navidad v3 (estilos: 'clasico' | 'nevado' | 'oro'). Firma: N.arbol(x,cx,top,h,w,C,{fuera,pc,estilo,falda,adornos,nieve,tono})
(function(N){ const P=Math.PI*2, R=N.R, rr=N.rr;
  const ESTILOS={
    clasico:{verdes:['#06241a','#0c3a25','#125232','#1a6a42','#2a8456','#46a26e'],esferas:['rojo','oro','rojo','plata','vino','oro','azul','verde'],cinta:'cuentas',luz:'255,196,110',extras:['baston','mono','estrella']},
    nevado:{verdes:['#0a2a26','#123e38','#1a5248','#25665a','#3a7e70','#5c9a8c'],esferas:['plata','azul','plata','oro','azul','plata'],cinta:'cuentasPlata',luz:'255,232,190',extras:['copo','estrella'],nieve:true},
    oro:{verdes:['#071f16','#0c3322','#11462e','#185a3c','#227050','#348a64'],esferas:['rojo','oro','vino','oro','rojo','oro'],cinta:'liston',luz:'255,184,90',extras:['mono','estrella','mono']}
  };
  function baston(x,px,py,s){ x.save(); x.translate(px,py); x.rotate(rr(-.4,.4)); x.lineCap='round'; x.lineWidth=3.2*s; const camino=()=>{ x.beginPath(); x.moveTo(0,12*s); x.lineTo(0,-4*s); x.arc(-4*s,-4*s,4*s,0,Math.PI,true); };
    x.strokeStyle='#fff'; camino(); x.stroke(); x.strokeStyle='#e3263c'; x.setLineDash([2.2*s,2.2*s]); camino(); x.stroke(); x.setLineDash([]); x.restore(); }
  function monito(x,px,py,s){ x.save(); x.translate(px,py); x.scale(s,s); const g=x.createLinearGradient(-8,-6,8,6); g.addColorStop(0,'#ff6b78'); g.addColorStop(1,'#a00a1e'); x.fillStyle=g;
    for(const sd of [-1,1]){ x.beginPath(); x.moveTo(0,0); x.bezierCurveTo(sd*4,-8,sd*12,-6,sd*10,0); x.bezierCurveTo(sd*9,4,sd*4,3,0,0); x.fill(); x.beginPath(); x.moveTo(0,1); x.lineTo(sd*6,11); x.lineTo(sd*3,9); x.lineTo(0,2); x.fill(); }
    x.fillStyle='#c4152c'; x.beginPath(); x.arc(0,0,2.4,0,P); x.fill(); x.restore(); }
  function estrellita(x,px,py,r,col='#f2c45a'){ x.save(); x.translate(px,py); x.rotate(rr(-.3,.3)); x.beginPath(); for(let i=0;i<10;i++){ const a=i*Math.PI/5-Math.PI/2, q=i%2?r*.45:r; x.lineTo(Math.cos(a)*q,Math.sin(a)*q); } x.closePath();
    const g=x.createLinearGradient(-r,-r,r,r); g.addColorStop(0,'#fff6c8'); g.addColorStop(.5,col); g.addColorStop(1,'#9a6a10'); x.fillStyle=g; x.fill(); x.restore(); }
  function copito(x,px,py,r){ x.save(); x.translate(px,py); x.strokeStyle='#f4fbff'; x.lineWidth=Math.max(1,r*.18); x.lineCap='round'; for(let i=0;i<6;i++){ x.rotate(P/6); x.beginPath(); x.moveTo(0,0); x.lineTo(0,-r); x.moveTo(0,-r*.55); x.lineTo(-r*.25,-r*.78); x.moveTo(0,-r*.55); x.lineTo(r*.25,-r*.78); x.stroke(); } x.restore(); }
  // estrella de punta facetada con rayos
  function estrellaTop(x,cx,cy,r,C){ x.save(); x.globalCompositeOperation='lighter'; let g=x.createRadialGradient(cx,cy,0,cx,cy,r*4.5); g.addColorStop(0,'rgba(255,224,150,.55)'); g.addColorStop(.35,'rgba(255,200,110,.18)'); g.addColorStop(1,'rgba(255,200,110,0)'); x.fillStyle=g; x.beginPath(); x.arc(cx,cy,r*4.5,0,P); x.fill();
    for(let i=0;i<16;i++){ const a=i*P/16+.1, L=r*(i%2?2.6:4.4); g=x.createLinearGradient(cx,cy,cx+Math.cos(a)*L,cy+Math.sin(a)*L); g.addColorStop(0,'rgba(255,236,170,.6)'); g.addColorStop(1,'rgba(255,236,170,0)'); x.strokeStyle=g; x.lineWidth=i%2?1.2:2; x.beginPath(); x.moveTo(cx,cy); x.lineTo(cx+Math.cos(a)*L,cy+Math.sin(a)*L); x.stroke(); } x.restore();
    const pts=[]; for(let i=0;i<10;i++){ const a=i*Math.PI/5-Math.PI/2, q=i%2?r*.42:r; pts.push([cx+Math.cos(a)*q,cy+Math.sin(a)*q]); }
    for(let i=0;i<10;i++){ const a=pts[i], b=pts[(i+1)%10]; x.fillStyle=i%2?'#e9a92a':'#ffe48a'; x.beginPath(); x.moveTo(cx,cy); x.lineTo(a[0],a[1]); x.lineTo(b[0],b[1]); x.closePath(); x.fill(); }
    x.strokeStyle='rgba(255,250,220,.9)'; x.lineWidth=1; x.beginPath(); pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.closePath(); x.stroke();
    if(C) C.luces.push({x:cx,y:cy,r:r*.45,c:'255,226,150',a:1,v:1.1,f:0,k:7,ga:.8}); }
  N.estrellaTop=estrellaTop;
  N.arbol=function(x,cx,top,h,w,C,{fuera=()=>false,pc=true,estilo='clasico',falda=true,adornos=true,nieve=false,tono=0}={}){
    const E=ESTILOS[estilo]||ESTILOS.clasico, V=E.verdes, T=pc?8:7, k=w/560; nieve=nieve||!!E.nieve;
    const pisos=[]; for(let i=0;i<T;i++){ const u0=i/T, u1=(i+1)/T, yT=top+h*(i?u0*.92:0), yB=top+h*u1*.97, hw=w/2*Math.pow(u1,.88)*(1+rr(-.03,.03)), tw=i?w/2*Math.pow(u0,.88)*.5:0;
      const n=Math.max(5,Math.round(hw*2/(22*k))), borde=[]; for(let j=0;j<=n;j++){ const t=j/n, xx=cx-hw+2*hw*t, punta=j%2===0, curva=Math.sin(t*Math.PI)*h*.026; borde.push([xx+rr(-2,2)*k,yB+curva+(punta?rr(6,13)*k:-rr(3,8)*k)]); }
      pisos.push({yT,yB,hw,tw,borde}); }
    const camino=p=>{ const pa=new Path2D(); pa.moveTo(cx-p.tw,p.yT); pa.lineTo(cx+p.tw,p.yT); pa.quadraticCurveTo(cx+p.hw*.7,p.yT+(p.yB-p.yT)*.5,p.borde[p.borde.length-1][0],p.borde[p.borde.length-1][1]);
      for(let j=p.borde.length-2;j>=0;j--){ const a=p.borde[j+1], b=p.borde[j]; pa.quadraticCurveTo((a[0]+b[0])/2+rr(-2,2)*k,(a[1]+b[1])/2+rr(-1,3)*k,b[0],b[1]); } pa.quadraticCurveTo(cx-p.hw*.7,p.yT+(p.yB-p.yT)*.5,cx-p.tw,p.yT); pa.closePath(); return pa; };
    const sil=new Path2D(); pisos.forEach(p=>{ p.ruta=camino(p); sil.addPath(p.ruta); });
    const yb=pisos[T-1].yB;
    // falda de terciopelo bajo el árbol
    if(falda&&adornos){ const fr=w*.42, fy=yb+h*.03; let g=x.createRadialGradient(cx,fy-fr*.1,4,cx,fy,fr); g.addColorStop(0,'#c4152c'); g.addColorStop(.8,'#7a0a18'); g.addColorStop(1,'#4a0610'); x.fillStyle=g; x.beginPath(); x.ellipse(cx,fy,fr,fr*.2,0,0,P); x.fill();
      x.strokeStyle='#f6f1e6'; x.lineWidth=5*Math.max(.7,k); x.beginPath(); x.ellipse(cx,fy,fr*.98,fr*.19,0,0,P); x.stroke(); }
    let g=x.createLinearGradient(cx-w*.04,0,cx+w*.04,0); g.addColorStop(0,'#2a180a'); g.addColorStop(.4,'#6a4422'); g.addColorStop(1,'#2a180a'); x.fillStyle=g; x.fillRect(cx-w*.035,yb-h*.05,w*.07,h*.08);
    for(let i=T-1;i>=0;i--){ const p=pisos[i];
      g=x.createLinearGradient(0,p.yT,0,p.yB+8*k); g.addColorStop(0,V[0]); g.addColorStop(.5,V[1]); g.addColorStop(1,V[2]); x.fillStyle=g; x.fill(p.ruta);
      x.save(); x.clip(p.ruta); const alto=p.yB-p.yT, cuantas=Math.round(p.hw*alto/(pc?42:56)/k/k);
      for(let s=0;s<cuantas;s++){ const v=Math.pow(R(),.65), py=p.yT+alto*v, an=p.tw+(p.hw-p.tw)*v, px=cx+(R()*2-1)*an*1.02, dx=(px-cx)/Math.max(1,p.hw);
        const base=Math.PI/2-dx*1.1, luz=v*.8+(dx<0?.22:-.12)+rr(-.25,.25), ci=Math.max(0,Math.min(5,Math.round(luz*5)));
        x.strokeStyle=V[ci]; x.lineWidth=rr(.9,1.5)*Math.max(.8,k); const L=rr(7,15)*k; for(let a=-2;a<=2;a++){ const ang=base+a*.3+rr(-.1,.1); x.beginPath(); x.moveTo(px,py); x.lineTo(px+Math.cos(ang)*L*(1-Math.abs(a)*.12),py+Math.sin(ang)*L*(1-Math.abs(a)*.12)); x.stroke(); } }
      x.restore();
      const copete=(bx,by,dir,L0,claro)=>{ for(let a2=0;a2<9;a2++){ const an=dir+rr(-.55,.55), L=L0*rr(.6,1.1); x.strokeStyle=claro?V[4+(a2%2)]:V[2+(a2%2)]; x.lineWidth=rr(1,1.5)*Math.max(.8,k);
        x.beginPath(); x.moveTo(bx-Math.cos(an)*L*.5,by-Math.sin(an)*L*.5); x.quadraticCurveTo(bx+Math.cos(an)*L*.2,by+Math.sin(an)*L*.2+L*.08,bx+Math.cos(an)*L*.55,by+Math.sin(an)*L*.55+L*.12); x.stroke(); } };
      p.borde.forEach((b,j)=>{ const dir=Math.PI/2-((b[0]-cx)/p.hw)*.9; copete(b[0],b[1]-2*k,dir,(j%2?10:16)*k,b[0]<cx+p.hw*.25); });
      for(let s=0;s<12;s++){ const u=(s+.5)/12, yy=p.yT+(p.yB-p.yT)*u, xw=p.tw+(p.hw-p.tw)*Math.pow(u,1.1); copete(cx-xw*.98,yy,Math.PI*.78,12*k,true); copete(cx+xw*.98,yy,Math.PI*.22,12*k,false); }
      if(i>0){ const q=pisos[i-1]; x.save(); x.clip(p.ruta); g=x.createLinearGradient(0,q.yB-6*k,0,q.yB+26*k); g.addColorStop(0,'rgba(0,10,4,.6)'); g.addColorStop(1,'rgba(0,10,4,0)'); x.fillStyle=g; x.fillRect(cx-p.hw-10,q.yB-6*k,p.hw*2+20,34*k); x.restore(); } }
    if(nieve){ pisos.forEach(p=>{ p.borde.forEach((b,j)=>{ if(j%2) return; const r=rr(5,10)*k, gg=x.createRadialGradient(b[0]-r*.3,b[1]-r*1.4,0,b[0],b[1]-r*1.1,r*1.5); gg.addColorStop(0,'#ffffff'); gg.addColorStop(.7,'#e4f0fa'); gg.addColorStop(1,'rgba(220,236,250,0)'); x.fillStyle=gg; x.beginPath(); x.ellipse(b[0],b[1]-r*1.1,r*1.5,r*.7,((b[0]-cx)/p.hw)*.5,0,P); x.fill(); }); }); }
    if(tono){ x.save(); x.clip(sil); x.fillStyle=`rgba(10,24,48,${tono})`; x.fillRect(cx-w/2-10,top-10,w+20,h+30); x.restore(); }
    // volumen: luz cálida desde dentro (como si las luces iluminaran las ramas) + borde derecho en sombra
    x.save(); x.clip(sil); x.globalCompositeOperation='lighter'; for(let i=0;i<(adornos?Math.round(h/18):0);i++){ const t=rr(.15,.95), y=top+h*t, aw=w/2*Math.pow(t,.88)*.6, px=cx+(R()*2-1)*aw, r=rr(18,40)*Math.max(.6,k); g=x.createRadialGradient(px,y,0,px,y,r); g.addColorStop(0,`rgba(${E.luz},.16)`); g.addColorStop(1,`rgba(${E.luz},0)`); x.fillStyle=g; x.beginPath(); x.arc(px,y,r,0,P); x.fill(); }
    x.globalCompositeOperation='source-over'; g=x.createLinearGradient(cx-w/2,0,cx+w/2,0); g.addColorStop(0,'rgba(255,230,170,.08)'); g.addColorStop(.45,'rgba(255,230,170,0)'); g.addColorStop(.62,'rgba(0,8,4,0)'); g.addColorStop(1,'rgba(0,8,4,.42)'); x.fillStyle=g; x.fillRect(cx-w/2-10,top,w+20,h+20); x.restore();
    if(!adornos) return;
    const anchoEn=y=>w/2*Math.pow(Math.max(0,Math.min(1,(y-top)/h)),.88)*.9;
    // cinta: cuentas (doradas o plateadas) o listón de satín
    x.save(); x.clip(sil);
    for(let j=0;j<(pc?5:4);j++){ const y0=top+h*(.2+j*.16), y1=y0+h*.06, sag=h*.05, pts=[]; for(let s=0;s<=60;s++){ const u=s/60, yy=y0+(y1-y0)*u+Math.sin(u*Math.PI)*sag, aw=anchoEn(yy)*1.08; pts.push([cx-aw+2*aw*u,yy]); }
      if(E.cinta==='liston'){ x.lineCap='round'; x.strokeStyle='rgba(60,0,10,.35)'; x.lineWidth=8*k; x.beginPath(); pts.forEach((q,s)=>s?x.lineTo(q[0],q[1]+3*k):x.moveTo(q[0],q[1]+3*k)); x.stroke(); const gg=x.createLinearGradient(0,y0-6,0,y1+sag); gg.addColorStop(0,'#ff6b78'); gg.addColorStop(.5,'#c4152c'); gg.addColorStop(1,'#7a0a18'); x.strokeStyle=gg; x.lineWidth=7*k; x.beginPath(); pts.forEach((q,s)=>s?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1])); x.stroke(); x.strokeStyle='rgba(255,220,220,.5)'; x.lineWidth=1.4*k; x.beginPath(); pts.forEach((q,s)=>s?x.lineTo(q[0],q[1]-2*k):x.moveTo(q[0],q[1]-2*k)); x.stroke(); }
      else { const plata=E.cinta==='cuentasPlata'; pts.forEach((q,s)=>{ if(s%2||fuera(q[0],q[1])) return; const r=2.3*Math.max(.8,k), gg=x.createRadialGradient(q[0]-r*.4,q[1]-r*.4,0,q[0],q[1],r); gg.addColorStop(0,'#fff'); gg.addColorStop(.4,plata?'#d6e0ea':'#f4d27a'); gg.addColorStop(1,plata?'#7a8896':'#9a6a14'); x.fillStyle=gg; x.beginPath(); x.arc(q[0],q[1],r,0,P); x.fill(); }); } }
    x.restore();
    // adornos colgando de las puntas y por dentro, sin encimarse
    const puestas=[];
    pisos.forEach((p,i)=>{ if(!i) return; p.borde.forEach((b,j)=>{ if(j%2||R()<.3) return; const r=rr(9,15)*k*(.85+i/T*.4), x2=b[0]+rr(-3,3)*k, y2=b[1]-r*rr(.2,.8); if(fuera(x2,y2,r+4)||!x.isPointInPath(sil,x2,y2-r)||puestas.some(q=>Math.hypot(q[0]-x2,q[1]-y2)<q[2]+r+6*k)) return; puestas.push([x2,y2,r,'e']); }); });
    for(let s=0;s<120&&puestas.length<(pc?58:36);s++){ const y=top+h*rr(.14,.92), aw=anchoEn(y)*.82, px=cx+(R()*2-1)*aw, r=rr(7,12)*k; if(fuera(px,y,r+4)||puestas.some(q=>Math.hypot(q[0]-px,q[1]-y)<q[2]+r+9*k)) continue; puestas.push([px,y,r,R()<.62?'e':E.extras[(R()*E.extras.length)|0]]); }
    // Una esfera del árbol queda articulada en el DOM: es el mismo objeto al
    // estar en la rama, en la mano y al oscilar cuando el personaje la suelta.
    let elegida=-1;
    if(C.masc){ const m=C.masc, mano={x:m.l+m.w*.76,y:m.t+m.h*.54}; let menor=Infinity;
      puestas.forEach((q,i)=>{ if(q[3]!=='e'||q[0]<m.l+m.w*.55||q[0]>Math.min(C.W-10,m.r+m.w*.3)||Math.abs(q[1]-mano.y)>m.w*.2) return;
        const dx=(q[0]-m.l)/m.w*800-604,dy=(q[1]-m.t)/m.h*1067-580;if(dx>0&&Math.hypot(dx,dy)>165)return;const dist=Math.hypot(q[0]-mano.x,q[1]-mano.y); if(dist<menor){menor=dist;elegida=i;} }); }
    if(C.masc&&elegida<0){
      const m=C.masc,px=Math.min(C.W-12,m.l+m.w*.85),py=m.t+m.h*.54,r=Math.max(4,m.w*.027);
      if(!fuera(px,py,r+2)&&x.isPointInPath(sil,px,py)){
        for(let i=puestas.length-1;i>=0;i--)if(Math.hypot(puestas[i][0]-px,puestas[i][1]-py)<puestas[i][2]+r+4)puestas.splice(i,1);
        elegida=puestas.length;puestas.push([px,py,r,'e']);
      }
    }
    puestas.forEach((q,i)=>{ const [px,py,r,t]=q, colores=N.ESF[E.esferas[i%E.esferas.length]];
      if(i===elegida){ C.adorno={x:px,y:py,r:r,colores:colores}; return; }
      if(t==='e') N.esfera(x,px,py,r,colores,{brillo:.95}); else if(t==='baston') baston(x,px,py,r*.11); else if(t==='mono') monito(x,px,py,r*.11); else if(t==='estrella') estrellita(x,px,py,r*.9); else if(t==='copo') copito(x,px,py,r*1.1); });
    // tiras de luces
    for(let j=0;j<(pc?7:5);j++){ const y0=top+h*(.1+j*.125), y1=y0+h*.07, sag=h*.04, n=Math.max(4,Math.round(anchoEn(y0+sag)*2/(20*k)));
      for(let s=1;s<n;s++){ const u=s/n, yy=y0+(y1-y0)*u+Math.sin(u*Math.PI)*sag, aw=anchoEn(yy)*1.02, px=cx-aw+2*aw*u+rr(-2,2)*k; if(fuera(px,yy,6)||!x.isPointInPath(sil,px,yy)) continue;
        C.luces.push({x:px,y:yy,r:(pc?2.5:2.1)*Math.max(.8,k),c:R()<.8?E.luz:['255,110,110','130,200,255','255,170,220'][(R()*3)|0],a:rr(.75,1),v:rr(1,2.4),f:R()*6,k:6,ga:.85}); } }
    C.arbolTop={x:cx,y:top-(pc?12:9)*Math.max(.7,k),r:(pc?24:17)*Math.max(.7,k)};
    estrellaTop(x,C.arbolTop.x,C.arbolTop.y,C.arbolTop.r,C);
  };
})(NV);

// Easter eggs y detalles premium del login de Navidad en casa
(function(N){ const P=Math.PI*2, rr=N.rr;
  N.huevos=(C,{casita,trineo,cont})=>{ const {W,H,pc}=C, A=C.anim, ahora=()=>performance.now()/1000;
    const efectos=[]; A.push((v,t)=>{ const tt=ahora(); for(let i=efectos.length-1;i>=0;i--) if(efectos[i](v,tt)===false) efectos.splice(i,1); });
    const chispas=(px,py,n,cols,vel=90,grav=60,vida=1.4)=>{ const t0=ahora(), ps=[...Array(n)].map(()=>{ const a=rr(0,P), s=rr(.3,1)*vel; return {vx:Math.cos(a)*s,vy:Math.sin(a)*s-vel*.3,c:cols[(Math.random()*cols.length)|0],r:rr(1.2,2.8)}; });
      efectos.push((v,t)=>{ const u=t-t0; if(u>vida) return false; v.save(); v.globalCompositeOperation='lighter'; ps.forEach(p=>{ const x=px+p.vx*u, y=py+p.vy*u+grav*u*u, a=1-u/vida; v.fillStyle=`rgba(${p.c},${a})`; v.beginPath(); v.arc(x,y,p.r*(1+a),0,P); v.fill(); }); v.restore(); }); };
    // 1 · la estrella del árbol: destello y lluvia de oro; al tercer toque, un deseo
    let toquesEstrella=0; const st=C.arbolTop;
    if(st) C.hits.push({kind:'estrella',x:st.x,y:st.y,r:st.r*2.2,fn:()=>{ toquesEstrella++; const t0=ahora();
      efectos.push((v,t)=>{ const u=t-t0; if(u>.9) return false; v.save(); v.globalCompositeOperation='lighter'; const R=st.r*(2+u*10), g=v.createRadialGradient(st.x,st.y,0,st.x,st.y,R); g.addColorStop(0,`rgba(255,236,170,${.8*(1-u/.9)})`); g.addColorStop(1,'rgba(255,236,170,0)'); v.fillStyle=g; v.beginPath(); v.arc(st.x,st.y,R,0,P); v.fill(); v.restore(); });
      chispas(st.x,st.y,46,['255,220,120','255,245,200','255,190,80'],pc?160:110,140,1.8);
      if(toquesEstrella%3===0){ efectos.push((v,t)=>{ const u=t-t0; if(u>3.2) return false; const a=Math.min(1,u*2)*(u>2.4?1-(u-2.4)/.8:1); v.save(); v.globalAlpha=a; v.font=`italic 700 ${pc?34:22}px Georgia,serif`; v.textAlign=pc?'center':'right'; v.shadowColor='rgba(255,200,90,.9)'; v.shadowBlur=14; v.fillStyle='#ffe7a6';
        v.fillText('¡Feliz Navidad!',pc?st.x:W-12,st.y+(pc?70:56)-u*10); v.restore(); }); } }});
    // 2 · la chimenea: el humo sale en forma de corazón
    if(casita){ const ch={x:casita.chx,y:casita.chy}; C.hits.push({kind:'chimenea',x:ch.x,y:ch.y,r:Math.max(26,casita.w*.18),fn:()=>{ const t0=ahora();
      efectos.push((v,t)=>{ const u=t-t0; if(u>3) return false; const s=(pc?1:.6)*(1+u*.6), cx=ch.x+u*8, cy=ch.y-30-u*36; v.save(); v.globalAlpha=Math.max(0,.75-u*.25); v.translate(cx,cy); v.scale(s,s); v.fillStyle='#ffe0e6';
        v.beginPath(); v.moveTo(0,10); v.bezierCurveTo(-26,-6,-14,-28,0,-14); v.bezierCurveTo(14,-28,26,-6,0,10); v.fill(); v.restore(); }); }});
      // 3 · la puerta: se abre y sale luz cálida
      const pu={x:casita.cx,y:casita.base-casita.h*.28}; C.hits.push({kind:'puerta',x:pu.x,y:pu.y,r:Math.max(20,casita.w*.14),fn:()=>{ const t0=ahora();
        efectos.push((v,t)=>{ const u=t-t0; if(u>3.4) return false; const a=u<.4?u/.4:u>2.6?1-(u-2.6)/.8:1, dw=casita.w*.2, dh=casita.h*.55, dx=casita.cx-dw/2, dy=casita.base-dh;
          v.save(); v.globalCompositeOperation='lighter'; let g=v.createRadialGradient(casita.cx,casita.base,4,casita.cx,casita.base,casita.w*.9); g.addColorStop(0,`rgba(255,200,110,${.55*a})`); g.addColorStop(1,'rgba(255,200,110,0)'); v.fillStyle=g; v.beginPath(); v.ellipse(casita.cx,casita.base,casita.w*.9,casita.w*.3,0,0,P); v.fill();
          v.fillStyle=`rgba(255,214,140,${.9*a})`; v.fillRect(dx,dy,dw*(.3+.7*Math.min(1,u/.4)),dh); v.restore(); }); chispas(pu.x,pu.y,16,['255,214,140','255,240,200'],60,20,1.2); }}); }
    // 4 · el trineo: los regalos brincan y uno suelta confeti
    if(trineo) C.hits.push({kind:'trineo',x:trineo.x,y:trineo.y-30*trineo.s,r:70*trineo.s,fn:()=>{ chispas(trineo.x,trineo.y-60*trineo.s,60,['255,90,90','255,214,120','110,220,150','120,190,255','255,150,210'],pc?150:100,160,1.8); }});
    // 5 · los foquitos del cordón: el que tocas destella y manda una ola de luz por todo el cordón
    { const luces=[...cont.querySelectorAll('.nv-guirnalda .nv-luz')], base=cont.getBoundingClientRect();
      luces.forEach((l,i)=>{ const r=l.getBoundingClientRect(); C.hits.push({kind:'foco',x:r.left-base.left+r.width/2,y:r.top-base.top+r.height/2,r:16,fn:()=>{ luces.forEach((m,j)=>setTimeout(()=>m.animate([{filter:'brightness(1)'},{filter:'brightness(2.4) drop-shadow(0 0 6px #fff)'},{filter:'brightness(1)'}],{duration:500}),Math.abs(j-i)*40));
        const rr2=l.getBoundingClientRect(); chispas(rr2.left-base.left+rr2.width/2,rr2.top-base.top+rr2.height/2,14,['255,240,200','255,214,140'],70,40,1); }}); }); }
    // ambiente premium: estrellas fugaces en la aurora y, de vez en cuando, Santa a lo lejos
    let sigFugaz=ahora()+rr(2,5), sigSanta=ahora()+rr(25,45);
    efectos.push((v,t)=>{ if(t>sigFugaz){ sigFugaz=t+rr(6,14); const t0=t, sx=rr(W*.1,W*.9), sy=rr(20,C.hz*.4), dx=rr(-1,1)<0?-1:1;
        efectos.push((v2,tt)=>{ const u=(tt-t0)/.8; if(u>1) return false; const x=sx+dx*u*W*.28, y=sy+u*80, L=70; const g=v2.createLinearGradient(x,y,x-dx*L,y-L*.3); g.addColorStop(0,`rgba(255,255,255,${1-u})`); g.addColorStop(1,'rgba(255,255,255,0)'); v2.strokeStyle=g; v2.lineWidth=2; v2.beginPath(); v2.moveTo(x,y); v2.lineTo(x-dx*L,y-L*.3); v2.stroke(); }); }
      if(t>sigSanta){ sigSanta=t+rr(40,70); const t0=t, s=pc?.55:.35, y0=C.hz-(pc?70:40), trail=[];let visto=false;
        efectos.push((v2,tt)=>{ const u=(tt-t0)/(pc?9:7); if(u>1) return false; const x=-160*s+(W+320*s)*u, y=y0-Math.sin(u*Math.PI)*(pc?90:50); if(!visto&&u>.4){visto=true;const b=cont.getBoundingClientRect();cont.closest('#loginScreen')?.dispatchEvent(new CustomEvent('navidad:entorno',{detail:{kind:'santa',x:b.left+x,y:b.top+y}}));}trail.push([x-60*s,y+8*s,tt]); while(trail.length&&tt-trail[0][2]>1.2) trail.shift();
          v2.save(); v2.globalCompositeOperation='lighter'; trail.forEach(q=>{ const a=1-(tt-q[2])/1.2; v2.fillStyle=`rgba(255,215,120,${.6*a})`; v2.beginPath(); v2.arc(q[0],q[1],1.4*a+.4,0,P); v2.fill(); }); v2.restore(); N.trineo(v2,x,y,s,tt,'rgba(8,20,48,.9)'); }); } });
  };
})(NV);

(function(N){ const P=Math.PI*2;
  // el árbol grande de Navidad; en teléfono, con el centro en la orilla derecha (se ve la mitad, detrás de la mascota)
  N.arbolGrande=(x,C,suelo,{centro=false}={})=>{ const {W,H,pc,logo,f,masc}=C;
    const silueta=masc?{l:masc.l+masc.w*.23,r:masc.l+masc.w*.73,t:masc.t+masc.h*.07,b:masc.b}:null;
    const tapa=[C.marca,f].concat(silueta?[silueta]:[],C.pie?[C.pie]:[]);
    const fuera=(px,py,m=4)=>tapa.some(q=>px>q.l-m&&px<q.r+m&&py>q.t-m&&py<q.b+m);
    if(centro){ const top=Math.max(28,logo.t-34), h=suelo-top-10, w=Math.min(W*(pc?.62:1.1),h*.66); N.arbol(x,W/2,top,h,w,C,{pc,fuera}); return; }
    if(pc){ const th=Math.min(H*.66,suelo-logo.t+10), tw=th*.62, cx=Math.min(W-tw*.45,(masc?masc.l+masc.w*.76:f.r)+tw*.32); N.arbol(x,cx,suelo-th-4,th,tw,C,{pc,fuera,estilo:'clasico'}); }
    else { const top=Math.max(64,logo.t+8), h=suelo-top-8, w=h*.5; N.arbol(x,W-32,top,h,w,C,{pc,fuera,estilo:'clasico'}); } };
  N.luzMascota=(x,C,suelo)=>{ const m=C.masc; if(!m) return; const g=x.createRadialGradient(m.cx,suelo+6,4,m.cx,suelo+6,m.w); g.addColorStop(0,'rgba(255,214,150,.45)'); g.addColorStop(1,'rgba(255,214,150,0)'); x.fillStyle=g; x.beginPath(); x.ellipse(m.cx,suelo+6,m.w,m.w*.3,0,0,P); x.fill();
    x.fillStyle='rgba(30,50,80,.28)'; x.beginPath(); x.ellipse(m.cx,suelo+8,m.w*.32,m.w*.07,0,0,P); x.fill(); };
  N.nieveSuelo=(x,W,H,suelo)=>{ const g=x.createLinearGradient(0,suelo-6,0,H); g.addColorStop(0,'#f2f8fe'); g.addColorStop(1,'#cfe2f2'); x.fillStyle=g; x.beginPath(); x.moveTo(0,H+4); x.lineTo(0,suelo+4); for(let i=0;i<=8;i++) x.quadraticCurveTo(i/8*W-W/16,suelo-6,i/8*W,suelo+4); x.lineTo(W,H+4); x.fill(); };
})(NV);

function dibujar(x,C){
 const N=NV, {W,H,pc,logo,marca,f,masc,pie}=C; N.sem(101);
  const suelo=masc?masc.pies-6:H-(pc?60:40), hz=pc?suelo-90:Math.min(suelo-60,(pie?pie.t:f.b+80)-6);
  N.cieloPre(x,W,H,hz); N.montesPre(x,W,hz+6,pc?300:180); N.lagoPre(x,W,hz,pc?40:24);
  // pinos de Pre-Navidad en la orilla
  if(pc) [[.03,1.3],[.08,1.6],[.13,1.1],[.34,1.2],[.66,1.1],[.97,1.4]].forEach(([u,k])=>{ if(u*W>f.l-20&&u*W<f.r+20) return; N.pinoPre(x,u*W,hz+30,k); });
  // la casita de cerca y el trineo en su puerta
  let casita=null, trineo=null;
  if(pc){ const cw=Math.min(300,f.l*.58), cx=Math.max(cw*.6+20,f.l*.42); N.casitaPre(x,cx,suelo+4,cw,C); casita={cx,base:suelo+4,w:cw,h:cw*.72}; trineo={x:cx+cw*.62,y:suelo+10,s:1.15}; N.trineoPre(x,trineo.x,trineo.y,trineo.s); }
  else { const cw=Math.min(96,W*.26), cx=cw*.62+8, base=pie?Math.min(hz+30,pie.t-4):hz+30;
    // en el teléfono la casita queda a la altura del horizonte y el suelo (los pies de la mascota) mucho más abajo:
    // una loma nevada baja desde la casita hasta el suelo para que no flote; los pinitos se paran en la loma
    const xf=cx+cw*1.75, alto=y=>{ const u=Math.min(1,Math.max(0,(y-(cx+cw*.75))/(xf-(cx+cw*.75)))); return lerpY(u); }, lerpY=u=>base+(suelo-base)*(u*u*(3-2*u));
    const lomaY=px=>px<cx+cw*.75?base+Math.pow(Math.abs(px-cx)/(cw*.9),2)*4:alto(px);
    let g=x.createLinearGradient(0,base-8,0,suelo+10); g.addColorStop(0,'#f4f9ff'); g.addColorStop(.6,'#dbe9f5'); g.addColorStop(1,'#c4d9ea'); x.fillStyle=g;
    x.beginPath(); x.moveTo(-4,suelo+20); for(let px=-4;px<=xf+8;px+=4) x.lineTo(px,lomaY(px)+2); x.lineTo(xf+8,suelo+20); x.closePath(); x.fill();
    // sombra azulada del lado derecho y brillo en la cresta
    x.save(); x.globalAlpha=.35; x.strokeStyle='#9fbcd6'; x.lineWidth=6; x.beginPath(); for(let px=cx+cw*.8;px<=xf;px+=4) px===cx+cw*.8?x.moveTo(px,lomaY(px)+5):x.lineTo(px,lomaY(px)+5); x.stroke(); x.restore();
    x.strokeStyle='rgba(255,255,255,.9)'; x.lineWidth=1.6; x.beginPath(); for(let px=0;px<=cx+cw*.9;px+=4) px?x.lineTo(px,lomaY(px)+1):x.moveTo(px,lomaY(px)+1); x.stroke();
    [[.04,.9],[.16,.7]].forEach(([u,k])=>{ const px=u*W; if(px>cx-cw*.5&&px<cx+cw*.5) return; N.pinoPre(x,px,lomaY(px)+2,k); });
    N.pinoPre(x,cx+cw*1.05,lomaY(cx+cw*1.05)+3,.55); N.pinoPre(x,cx+cw*1.3,lomaY(cx+cw*1.3)+3,.75);
    N.casitaPre(x,cx,base,cw,C); casita={cx,base,w:cw,h:cw*.72}; }
  N.nieveSuelo(x,W,H,suelo);
  if(!pc){ trineo={x:Math.min(W*.3,(masc?masc.l:W)-70),y:H-2,s:.5}; N.trineoPre(x,trineo.x,trineo.y,trineo.s); }
  N.arbolGrande(x,C,suelo); N.luzMascota(x,C,suelo);
  if(casita){ casita.chx=casita.cx+casita.w*.26; casita.chy=casita.base-casita.h-casita.h*.55*.8; }
  C.hz=hz; C.huevos=cont=>N.huevos(C,{casita,trineo,cont});
  C.dom=N.cordonPre(W,pc?56:40); C.nCopos=pc?90:45;
}
// el motor de dibujo también lo usa js/navidad-casa-dentro.js (la noche detrás de las pantallas de adentro)
window.__nvMotor=NV;
window.__nvCasa=function(capa){
  var ls=document.getElementById('loginScreen'); if(!ls) return {detener:function(){}};
  var reducido=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  var cont=document.createElement('div'); cont.className='nvc'; capa.appendChild(cont);
  var C=null, vivo=null, cps=[], W=0, H=0, raf=0, firma='', parado=false, adornoSVG=null;
  var NS='http://www.w3.org/2000/svg';
  function nodo(tag,attrs,parent){var n=document.createElementNS(NS,tag);Object.keys(attrs).forEach(function(k){n.setAttribute(k,attrs[k]);});if(parent)parent.appendChild(n);return n;}
  function dibujarAdorno(){
    if(adornoSVG)adornoSVG.remove();adornoSVG=null;if(!C?.adorno)return;
    var a=C.adorno,r=a.r;
    adornoSVG=nodo('svg',{'class':'nv-arbol-adorno',width:W,height:H,'aria-hidden':'true'});ls.appendChild(adornoSVG);
    var defs=nodo('defs',{},adornoSVG),g=nodo('radialGradient',{id:'nv-esfera-real',cx:'.32',cy:'.28',r:'.8'},defs);
    a.colores.forEach(function(c,i){nodo('stop',{offset:[0,.45,1][i],'stop-color':c},g);});
    a.hilo=nodo('path',{fill:'none',stroke:'#d6ba72','stroke-width':'.9','stroke-linecap':'round'},adornoSVG);
    a.node=nodo('g',{'class':'nv-esfera-real'},adornoSVG);
    nodo('rect',{x:-r*.22,y:-r*1.18,width:r*.44,height:r*.26,rx:r*.08,fill:'#ddbd6e'},a.node);
    nodo('circle',{r:r,fill:'url(#nv-esfera-real)',stroke:'#533525','stroke-width':'.6'},a.node);
    nodo('ellipse',{cx:-r*.35,cy:-r*.4,rx:r*.21,ry:r*.13,fill:'#fff5d7',opacity:'.8',transform:'rotate(-30)'},a.node);
    a.p={x:a.x,y:a.y};moverAdorno(a.p);
    C.hits.push({x:a.x,y:a.y,r:Math.max(12,r*1.7),kind:'adorno',fn:function(){}});
  }
  function moverAdorno(p){
    var a=C?.adorno;if(!a?.node)return;
    a.p=p;a.node.setAttribute('transform','translate('+p.x.toFixed(2)+' '+p.y.toFixed(2)+')');
    a.hilo.setAttribute('d','M'+a.x+' '+(a.y-a.r*2.2)+' Q'+(a.x+(p.x-a.x)*.2)+' '+(p.y-a.r*1.4)+' '+p.x+' '+(p.y-a.r));
    ls.dataset.adorno=Math.hypot(p.x-a.x,p.y-a.y)>1?'tirando':'rama';
  }
  var enlace={
    target:function(){var a=C?.adorno;if(!a?.node?.isConnected)return null;var b=capa.getBoundingClientRect();return {x:a.x+b.left,y:a.y+b.top,r:a.r,node:a.node};},
    move:function(p){var b=capa.getBoundingClientRect();moverAdorno({x:p.x-b.left,y:p.y-b.top});},
    reset:function(){if(C?.adorno)moverAdorno({x:C.adorno.x,y:C.adorno.y});},
    react:function(kind){if(!C)return;var b=capa.getBoundingClientRect(),a=C.adorno;if(a)ls.dispatchEvent(new CustomEvent('navidad:entorno',{detail:{kind:kind,x:a.x+b.left,y:a.y+b.top}}));}
  };ls.__nvArbol=enlace;
  function rc(e,base){ var r=e.getBoundingClientRect(); var l=r.left-base.left, t=r.top-base.top; return {l:l,t:t,r:l+r.width,b:t+r.height,w:r.width,h:r.height,cx:l+r.width/2,cy:t+r.height/2}; }
  function medir(){ var base=capa.getBoundingClientRect(), q=function(s){ var e=ls.querySelector(s); return e&&e.offsetWidth?rc(e,base):null; };
    if(!q('.login-logo')||!q('.login-brand')||!q('.login-form')) return null;
    var masc=q('.nv-mascota'); if(masc){ var pies=0; ls.querySelectorAll('.nv-mascota [id="foot-left"],.nv-mascota [id="foot-right"]').forEach(function(e){ var r=e.getBoundingClientRect(); if(r.height) pies=Math.max(pies,r.bottom-base.top); }); masc.pies=pies||masc.b; }   // el dibujo trae aire bajo los pies: se lee dónde pisa (sin tocar la mascota)
    return {W:Math.round(capa.clientWidth),H:Math.round(capa.clientHeight),pc:capa.clientWidth>=760,logo:q('.login-logo'),marca:q('.login-brand'),f:q('.login-form'),masc:masc,pie:q('.login-footer')}; }
  function armar(){ if(parado||!capa.isConnected) return; var M=medir(); if(!M||!M.W||!M.H) return;
    var fi=[M.W,M.H,Math.round(M.f.t),M.masc?[Math.round(M.masc.l),Math.round(M.masc.t),Math.round(M.masc.w),Math.round(M.masc.pies)].join(','):'-'].join('|'); if(fi===firma) return; firma=fi;
    W=M.W; H=M.H; var D=Math.min(1.5,window.devicePixelRatio||1); M.luces=[]; M.chispas=[]; M.anim=[]; M.hits=[]; NV.sem(101);
    var fijo=NV.lienzo(W,H,D); dibujar(fijo.x,M); var v=NV.lienzo(W,H,D);
    cont.innerHTML=''; cont.appendChild(fijo.c); cont.appendChild(v.c); if(M.dom) cont.insertAdjacentHTML('beforeend',M.dom);
    C=M; vivo=v.x; cps=reducido?[]:NV.copos(W,H,M.nCopos||(M.pc?90:45)); if(M.huevos) M.huevos(cont);dibujarAdorno();
    if(reducido) NV.vivo(vivo,W,H,0,C.luces,[],[]); else seguir(); }
  function aLaVista(){ return !document.hidden&&ls.classList.contains('active'); }
  function cuadro(n){ raf=0; if(parado||!capa.isConnected||!aLaVista()) return;   // fuera de la vista no corre; se reanuda solo
    var t=n/1000; NV.vivo(vivo,W,H,t,C.luces,cps,C.chispas); for(var i=0;i<C.anim.length;i++) C.anim[i](vivo,t); raf=requestAnimationFrame(cuadro); }
  function seguir(){ if(!raf&&!reducido&&!parado&&C&&aLaVista()) raf=requestAnimationFrame(cuadro); }
  function toque(e){ if(!C||e.target.closest('.login-form,.nv-mascota,button,input,a,label,.login-footer')) return;
    var r=cont.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top, h=null;
    for(var i=0;i<C.hits.length;i++){ var q=C.hits[i]; if(Math.hypot(q.x-px,q.y-py)<q.r){ h=q; break; } }
    if(h){ h.fn(performance.now()/1000,px,py);ls.dispatchEvent(new CustomEvent('navidad:entorno',{detail:{kind:h.kind||'destello',x:e.clientX,y:e.clientY}})); if(reducido){ var t0=performance.now(); (function paso(n){ NV.vivo(vivo,W,H,0,C.luces,[],[]); for(var j=0;j<C.anim.length;j++) C.anim[j](vivo,n/1000); if(n-t0<3500) requestAnimationFrame(paso); else NV.vivo(vivo,W,H,0,C.luces,[],[]); })(t0); } } }
  ls.addEventListener('pointerdown',toque);
  document.addEventListener('visibilitychange',seguir);
  var mo=new MutationObserver(function(){ if(!C) armar(); seguir(); }); mo.observe(ls,{attributes:true,attributeFilter:['class']});   // al salir la carga se dibuja en ese mismo cuadro, sin esperar
  armar(); var t1=setTimeout(armar,700), t2=setTimeout(armar,1800);      // la mascota y las fuentes se acomodan un momento después
  var ro=window.ResizeObserver?new ResizeObserver(function(){ clearTimeout(t1); t1=setTimeout(armar,200); }):null; if(ro){ ro.observe(capa); var mm=ls.querySelector('.nv-mascota'); if(mm) ro.observe(mm); }
  return {detener:function(){ parado=true; if(raf) cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2); if(ro) ro.disconnect(); mo.disconnect(); ls.removeEventListener('pointerdown',toque); document.removeEventListener('visibilitychange',seguir);if(adornoSVG)adornoSVG.remove();if(ls.__nvArbol===enlace)delete ls.__nvArbol;delete ls.dataset.adorno;cont.remove(); }};
};
})();
