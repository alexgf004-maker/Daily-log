// ── Navidad (las tres etapas): sorpresas escondidas ──
// No se anuncian en ningún lado: se descubren y se pasa la voz. No gastan nada mientras nadie las activa (solo
// escuchan toques y, en Android, el movimiento del celular). No tocan la mascota ni cómo se marca o se guarda.
//  · Agitar el celular → la pantalla se vuelve una bola de nieve (vidrio, reflejo y un remolino de copos que se asienta).
//    Android; en iPhone el permiso de movimiento haría aparecer un aviso del sistema, así que ahí no se pide.
//  · Dejar presionado el encabezado (el saludo) → un chocolatito humeante con un mensaje con tu nombre.
//  · Tocar tres veces seguidas «INNOVA» en la barra de arriba → la barra se sacude y le cae la nieve.
//  · A las 12:00 en punto, con la app abierta adentro → el trineo de Santa cruza la pantalla: «¡Buen provecho!».
// Con movimiento reducido no hay sorpresas animadas. Para probarlas: window.__nvSorpresa.probar('globo'|'chocolate'|'barra'|'mediodia').
(function(){
  'use strict';
  var P=Math.PI*2;
  var HEROES='.page-header,.dash-hero,.rg-hero,.pg-hero,.ps-hero';
  var reducido=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  function activo(){ return document.documentElement.classList.contains('tema-navidad'); }
  function etapa(){ var c=document.documentElement.classList; return c.contains('nav-casa')?'casa':c.contains('nav-ano')?'ano':'pre'; }
  function adentro(){ var a=document.querySelector('.screen.active'); return !!a&&(a.id==='employeeScreen'||a.id==='adminScreen'); }
  function nombre(){ try{ var m=JSON.parse(localStorage.getItem('innova_session')||'null'); var t=((m&&(m.nombre||m.username))||'').trim().split(/[\s.]+/)[0].replace(/[^a-záéíóúñü]/gi,''); return t?t.charAt(0).toUpperCase()+t.slice(1).toLowerCase():''; }catch(e){ return ''; } }
  function esc(t){ return String(t).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function vibrar(p){ try{ navigator.vibrate&&navigator.vibrate(p); }catch(e){} }
  function lienzo(z){ var c=document.createElement('canvas'), D=Math.min(1.5,window.devicePixelRatio||1), W=innerWidth, H=innerHeight; c.width=Math.round(W*D); c.height=Math.round(H*D); c.className='nvs-lienzo'; c.style.zIndex=z||600; c.setAttribute('aria-hidden','true'); document.body.appendChild(c); var x=c.getContext('2d'); x.setTransform(D,0,0,D,0,0); return {c:c,x:x,W:W,H:H}; }
  function correr(dur,f,fin){ var t0=performance.now(); (function paso(n){ var t=(n-t0)/1000; if(f(Math.min(t,dur))===false||t>=dur){ fin&&fin(); return; } requestAnimationFrame(paso); })(t0); }
  function burbuja(txt,x,y,clase){ var b=document.createElement('div'); b.className='nvs-burbuja '+(clase||''); b.setAttribute('role','status'); b.textContent=txt; document.body.appendChild(b);
    var w=b.offsetWidth; b.style.left=Math.max(10,Math.min(innerWidth-w-10,x-w/2))+'px'; b.style.top=y+'px'; return b; }

  /* ── 1 · la bola de nieve ── */
  var globo=null;
  function bolaDeNieve(fuerza){
    if(reducido) return;
    if(globo){ globo.energia=Math.min(2.2,globo.energia+.8); return; }   // si la vuelven a agitar, la nieve se alborota más
    var L=lienzo(600), W=L.W, H=L.H, x=L.x, n=Math.round(Math.min(260,W*H/1600));
    var cs=[]; for(var i=0;i<n;i++) cs.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*600,vy:(Math.random()-.8)*700,r:.8+Math.random()*2.6,cop:Math.random()<.08});
    globo={energia:1+(fuerza||0)};
    var txt=['¡Agitaste la bola de nieve!','¡Ventisca en la oficina!','¡Ups! Alguien sacudió la bola de nieve'][Math.floor(Math.random()*3)];
    var b=burbuja('📳 '+txt,W/2,H-150,'nvs-entra');
    vibrar([30,40,30]); var ult=performance.now();
    correr(5.2,function(t){
      var ahora=performance.now(), dt=Math.min(.05,(ahora-ult)/1000); ult=ahora;
      var e=globo.energia; globo.energia=Math.max(0,e-dt*.55);
      x.clearRect(0,0,W,H);
      // el vidrio: orilla azulada (refracción) y un reflejo grande; se desvanece al final
      var a=Math.min(1,t*4)*(1-Math.max(0,(t-4.4)/.8));
      var g=x.createRadialGradient(W/2,H*.45,Math.min(W,H)*.32,W/2,H*.45,Math.max(W,H)*.78); g.addColorStop(0,'rgba(200,230,255,0)'); g.addColorStop(.62,'rgba(160,200,240,'+(.2*a)+')'); g.addColorStop(1,'rgba(10,40,80,'+(.62*a)+')'); x.fillStyle=g; x.fillRect(0,0,W,H);
      x.save(); x.globalAlpha=.5*a; x.strokeStyle='#fff'; x.lineCap='round'; x.lineWidth=Math.max(6,W*.018); x.beginPath(); x.ellipse(W/2,H/2,W*.45,H*.45,0,Math.PI*1.06,Math.PI*1.34); x.stroke(); x.lineWidth=3; x.globalAlpha=.3*a; x.beginPath(); x.ellipse(W/2,H/2,W*.45-14,H*.45-14,0,Math.PI*1.1,Math.PI*1.22); x.stroke(); x.globalAlpha=.28*a; x.fillStyle='#fff'; x.beginPath(); x.ellipse(W*.2,H*.16,W*.13,H*.05,-.7,0,P); x.fill(); x.globalAlpha=.16*a; x.beginPath(); x.ellipse(W*.82,H*.78,W*.05,H*.02,-.7,0,P); x.fill(); x.restore();
      // la nieve: remolino alrededor del centro mientras hay energía, luego cae despacio y se asienta abajo
      var cx=W/2, cy=H*.5;
      cs.forEach(function(c){
        var dx=c.x-cx, dy=c.y-cy, d=Math.hypot(dx,dy)+30, gir=e*240/d;
        c.vx+=(-dy*gir*.04 + (Math.random()-.5)*e*80)*dt*6; c.vy+=( dx*gir*.04 + (Math.random()-.5)*e*80 + 38)*dt*6;
        c.vx*=1-1.8*dt; c.vy*=1-1.8*dt; c.x+=c.vx*dt; c.y+=c.vy*dt;
        if(c.x<0){ c.x=0; c.vx*=-.4; } if(c.x>W){ c.x=W; c.vx*=-.4; } if(c.y<0){ c.y=0; c.vy*=-.4; }
        var suelo=H-8-c.r; if(c.y>suelo){ c.y=suelo; c.vy*=-.15; c.vx*=.6; }
        x.globalAlpha=(.55+c.r/6)*a; x.fillStyle='#fff';
        if(c.cop){ x.strokeStyle='#fff'; x.lineWidth=1.3; var r=c.r*2.6; for(var k=0;k<3;k++){ var an=k*Math.PI/3+t; x.beginPath(); x.moveTo(c.x-Math.cos(an)*r,c.y-Math.sin(an)*r); x.lineTo(c.x+Math.cos(an)*r,c.y+Math.sin(an)*r); x.stroke(); } }
        else { x.fillStyle='rgba(40,90,150,.35)'; x.beginPath(); x.arc(c.x+.6,c.y+.9,c.r+.7,0,P); x.fill(); x.fillStyle='#fff'; x.beginPath(); x.arc(c.x,c.y,c.r,0,P); x.fill(); }
      }); x.globalAlpha=1;
    },function(){ L.c.remove(); b.classList.add('nvs-sale'); setTimeout(function(){ b.remove(); },400); globo=null; });
  }
  // agitar: varios tirones fuertes en menos de un segundo
  var tirones=[], ultimaBola=0;
  function movimiento(ev){
    if(!activo()||reducido||document.hidden) return;
    var a=ev.acceleration&&ev.acceleration.x!=null?ev.acceleration:null, g=ev.accelerationIncludingGravity;
    var m=a?Math.hypot(a.x||0,a.y||0,a.z||0):(g?Math.abs(Math.hypot(g.x||0,g.y||0,g.z||0)-9.8):0);
    if(m<14) return; var t=Date.now(); tirones=tirones.filter(function(x){ return t-x<900; }); tirones.push(t);
    if(tirones.length>=3){ tirones=[]; if(globo){ bolaDeNieve(.5); } else if(t-ultimaBola>8000){ ultimaBola=t; bolaDeNieve(Math.min(1,(m-14)/20)); } }
  }
  if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission!=='function') window.addEventListener('devicemotion',movimiento,{passive:true});

  /* ── 2 · el chocolatito (dejar presionado el encabezado) ── */
  var MENSAJES={
    pre:['Un chocolatito para el frío, {n} ☕','Para que entres en calor, {n} ☕','Un chocolatito y a darle, {n}. ¡Ánimo hoy!'],
    casa:['Un chocolatito calientito, {n}. ¡Feliz Navidad! ☕','Santa te manda un chocolatito, {n} 🎅','Chocolate con malvaviscos para ti, {n} ☕'],
    ano:['Un chocolatito para cerrar el año, {n} ☕','¡Por un año nuevo bien dulce, {n}! ☕','Un brindis con chocolate, {n} 🥂']
  };
  function taza(){ return '<svg class="nvs-taza-svg" viewBox="0 0 130 140" aria-hidden="true"><defs>'+
    '<linearGradient id="nvsT" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8a0f1f"/><stop offset=".35" stop-color="#e3263c"/><stop offset=".7" stop-color="#c4152c"/><stop offset="1" stop-color="#6a0614"/></linearGradient>'+
    '<radialGradient id="nvsC" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#9a5a30"/><stop offset="1" stop-color="#4a2410"/></radialGradient>'+
    '<radialGradient id="nvsM" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#f1e6dc"/></radialGradient></defs>'+
    '<g class="nvs-vapor" stroke="rgba(255,255,255,.8)" stroke-width="4" fill="none" stroke-linecap="round"><path d="M46 34 C40 22 52 16 48 4"/><path d="M64 32 C58 18 70 12 66 0"/><path d="M82 34 C76 22 88 16 84 4"/></g>'+
    '<path class="nvs-corazon" d="M65 12 c-6 -6 -14 0 -8 6 l8 8 l8 -8 c6 -6 -2 -12 -8 -6z" fill="#ff8fa3"/>'+
    '<path d="M100 64 c24 0 24 36 0 36" stroke="url(#nvsT)" stroke-width="10" fill="none" stroke-linecap="round"/>'+
    '<path d="M26 44 h80 l-6 74 a11 11 0 0 1 -11 10 h-46 a11 11 0 0 1 -11 -10z" fill="url(#nvsT)"/>'+
    '<path d="M34 50 l-3 64" stroke="rgba(255,255,255,.25)" stroke-width="5" stroke-linecap="round"/>'+
    '<ellipse cx="66" cy="44" rx="40" ry="10" fill="url(#nvsC)"/>'+
    '<g fill="url(#nvsM)" stroke="rgba(160,130,110,.35)" stroke-width=".8"><rect x="44" y="35" width="13" height="10" rx="3" transform="rotate(-12 50 40)"/><rect x="60" y="31" width="14" height="11" rx="3" transform="rotate(8 67 36)"/><rect x="76" y="37" width="12" height="9" rx="3" transform="rotate(20 82 41)"/><rect x="54" y="42" width="11" height="8" rx="3"/></g>'+
    '<path d="M36 80 h60 M36 96 h58" stroke="#fff" stroke-width="3" stroke-dasharray="7 6" opacity=".75"/>'+
    '<path d="M66 70 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="#f2c45a"/></svg>'; }
  var chocoActivo=null;
  function chocolatito(px,py){
    if(reducido||chocoActivo) return;
    var n=nombre(), lista=MENSAJES[etapa()]||MENSAJES.pre, msg=lista[Math.floor(Math.random()*lista.length)].replace('{n}',n||'equipo');
    if(!n) msg=msg.replace(/, equipo/,'');   // sin nombre: «Un chocolatito para el frío ☕»
    var t=document.createElement('div'); t.className='nvs-taza'; t.innerHTML=taza(); document.body.appendChild(t);
    var w=130, x=Math.max(8,Math.min(innerWidth-w-8,px-w/2)), y=Math.max(60,py-150); t.style.left=x+'px'; t.style.top=y+'px';
    var b=burbuja(msg,px,y+146,'nvs-entra nvs-calida');
    vibrar(25); chocoActivo=t;
    setTimeout(function(){ t.classList.add('nvs-sale'); b.classList.add('nvs-sale'); },3200);
    setTimeout(function(){ t.remove(); b.remove(); chocoActivo=null; },3650);
  }
  var presion=null;
  function cancelarPresion(){ if(presion){ clearTimeout(presion.t); presion.h&&presion.h.classList.remove('nvs-presionando'); presion=null; } }
  document.addEventListener('pointerdown',function(e){
    if(!activo()||reducido||!adentro()||e.button>0) return;
    var h=e.target.closest(HEROES); if(!h||e.target.closest('button,a,input,select,textarea,label,.nv-mascota,[role="button"],.nvc-bota,.nvc-gorro')) return;
    cancelarPresion(); h.classList.add('nvs-presionando');
    presion={x:e.clientX,y:e.clientY,h:h,t:setTimeout(function(){ var p=presion; cancelarPresion(); if(p) chocolatito(p.x,p.y); },650)};
  },{passive:true});
  document.addEventListener('pointermove',function(e){ if(presion&&Math.hypot(e.clientX-presion.x,e.clientY-presion.y)>12) cancelarPresion(); },{passive:true});
  ['pointerup','pointercancel','scroll'].forEach(function(ev){ document.addEventListener(ev,cancelarPresion,{passive:true,capture:true}); });
  // sin menú de copiar ni selección de texto al dejar presionado el encabezado
  document.addEventListener('contextmenu',function(e){ if(activo()&&e.target.closest&&e.target.closest(HEROES)&&adentro()) e.preventDefault(); });

  /* ── 3 · la barra de arriba se sacude (tres toques seguidos en «INNOVA») ── */
  var toques=[];
  function sacudirBarra(barra){
    if(reducido) return; barra=barra||document.querySelector('.screen.active .topbar')||document.querySelector('.screen.active .ad-side-brand'); if(!barra) return;
    barra.classList.remove('nvs-sacude'); void barra.offsetWidth; barra.classList.add('nvs-sacude'); setTimeout(function(){ barra.classList.remove('nvs-sacude'); },700);
    vibrar([15,30,15]);
    var r=barra.getBoundingClientRect(), L=lienzo(560), x=L.x, ps=[], n=Math.round(Math.min(90,r.width/4));
    for(var i=0;i<n;i++) ps.push({x:r.left+Math.random()*r.width,y:r.bottom-4+Math.random()*8,vx:(Math.random()-.5)*40,vy:20+Math.random()*90,r:1+Math.random()*2.6,d:Math.random()*.35,cop:Math.random()<.12});
    var gotas=[]; if(etapa()==='pre') for(i=0;i<6;i++) gotas.push({x:r.left+Math.random()*r.width,y:r.bottom+4,v:0,d:.1+Math.random()*.3});
    correr(2.6,function(t){ x.clearRect(0,0,L.W,L.H); var a=1-Math.max(0,(t-2)/.6);
      ps.forEach(function(p){ var u=Math.max(0,t-p.d); var px=p.x+p.vx*u+Math.sin(u*3+p.r)*8, py=p.y+p.vy*u+90*u*u; x.globalAlpha=a*(.6+p.r/6); x.fillStyle='#fff';
        if(p.cop){ x.strokeStyle='#9cc4e8'; x.lineWidth=1.2; var rr=p.r*2.4; for(var k=0;k<3;k++){ var an=k*Math.PI/3+u*2; x.beginPath(); x.moveTo(px-Math.cos(an)*rr,py-Math.sin(an)*rr); x.lineTo(px+Math.cos(an)*rr,py+Math.sin(an)*rr); x.stroke(); } }
        else { x.fillStyle='rgba(40,90,150,.4)'; x.beginPath(); x.arc(px+.6,py+.9,p.r+.7,0,P); x.fill(); x.fillStyle='#fff'; x.beginPath(); x.arc(px,py,p.r,0,P); x.fill(); } });
      gotas.forEach(function(g){ var u=Math.max(0,t-g.d); var py=g.y+260*u*u; x.globalAlpha=a*.9; x.fillStyle='#bfe6ff'; x.beginPath(); x.moveTo(g.x,py-6); x.quadraticCurveTo(g.x+3.5,py,g.x,py+3); x.quadraticCurveTo(g.x-3.5,py,g.x,py-6); x.fill(); });
      x.globalAlpha=1; },function(){ L.c.remove(); });
  }
  document.addEventListener('pointerdown',function(e){
    if(!activo()||reducido||!e.target.closest) return; var nm=e.target.closest('.tb-name'); if(!nm) return;
    var t=Date.now(); toques=toques.filter(function(x){ return t-x<700; }); toques.push(t);
    if(toques.length>=3){ toques=[]; sacudirBarra(nm.closest('.topbar')||nm.closest('.ad-side-brand')); }
  },{passive:true});

  /* ── 4 · mediodía: el trineo cruza con «¡Buen provecho!» (una vez al día, solo a las 12:00 en punto) ── */
  function hoy(){ var d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
  function mediodia(forzar){
    if(reducido||!window.__nvMotor) return;
    if(!forzar){ var d=new Date(); if(d.getHours()!==12||d.getMinutes()!==0||!activo()||!adentro()||document.hidden) return;
      try{ if(localStorage.getItem('innova_nv_mediodia')===hoy()) return; localStorage.setItem('innova_nv_mediodia',hoy()); }catch(e){} }
    var N=window.__nvMotor, L=lienzo(560), x=L.x, W=L.W, H=L.H, s=W>=760?.7:.56, y0=H*.46, rastro=[], b=null;
    correr(7,function(t){ var u=t/7, px=-180*s+(W+360*s)*u, py=y0-Math.sin(u*Math.PI)*H*.08; x.clearRect(0,0,W,H);
      rastro.push([px-60*s,py+8*s,t]); while(rastro.length&&t-rastro[0][2]>1.3) rastro.shift();
      rastro.forEach(function(q){ var a=1-(t-q[2])/1.3; x.fillStyle='rgba(255,205,90,'+(.75*a).toFixed(3)+')'; x.beginPath(); x.arc(q[0],q[1],1.6*a+.5,0,P); x.fill(); });
      x.save(); x.shadowColor='rgba(255,236,190,.9)'; x.shadowBlur=6; N.trineo(x,px,py,s,t,'rgba(10,24,56,.94)'); x.restore();
      if(!b&&u>.3){ b=burbuja('🍗 ¡Buen provecho!',Math.min(W-90,px-40),py-90*s-30,'nvs-entra'); }
      if(b){ var w=b.offsetWidth; b.style.left=Math.max(10,Math.min(W-w-10,px-40*s-w/2))+'px'; b.style.top=(py-90*s-34)+'px'; }
      if(b&&u>.82&&!b.classList.contains('nvs-sale')) b.classList.add('nvs-sale');
    },function(){ L.c.remove(); if(b) b.remove(); });
  }
  setInterval(function(){ mediodia(false); },20000);

  window.__nvSorpresa={probar:function(q,a,b){ if(q==='globo') bolaDeNieve(.6); else if(q==='chocolate'){ var h=document.querySelector('.screen.active '+HEROES.split(',').join(',.screen.active ')); var r=h?h.getBoundingClientRect():{left:innerWidth/2,top:200,width:0,height:0}; chocolatito(a||r.left+r.width/2,b||r.top+r.height/2); } else if(q==='barra') sacudirBarra(); else if(q==='mediodia') mediodia(true); }};
})();
