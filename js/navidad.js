// ── Tema de Navidad: escenas del login por etapa ──
// Se carga con defer desde el <head>. La etapa la decide window.__temas (index.html):
//   pre  (1–21 dic)  Invierno mágico: aurora, foquitos congelados que prenden día a día, camino
//                    "Rumbo a Navidad", casita que se acerca y la tarjeta envuelta "Se abre el 24".
//   casa (22–27 dic) Nochebuena en casa: árbol, chimenea, ventana nevada y medias (una con tu nombre).
//                    El 24 se abre el regalo de la tarjeta (una vez por teléfono).
//   ano  (28 dic–4 ene) Noche de pólvora: cohetes sin parar y, al tocar el cielo, el tuyo.
// Estilos en css/temas/navidad.css (solo se descarga con el tema activo). Todo vive dentro de .nv-capa y de elementos .nv-*,
// así que al cambiar de etapa o de tema se quitan sin dejar rastro.
(function(){
  'use strict';
  var NS='http://www.w3.org/2000/svg';
  var reducido=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  var armada=null, bucle=null, soltarMedida=null;
  var R=function(a,b){ return a+Math.random()*(b-a); };
  var $=function(s,r){ return (r||document).querySelector(s); };

  function etapa(){ var T=window.__temas; var t=T&&T.activo; return t&&t.id==='navidad'?T.etapaDe(t):null; }
  // Día que se usa para lo que avanza con los días. Fuera de temporada (vista previa), uno de ejemplo.
  function dia(et){
    var d=new Date(), m=d.getMonth()+1, n=d.getDate(), T=window.__temas;
    var md=('0'+m).slice(-2)+'-'+('0'+n).slice(-2);
    if(T&&T.modo==='ver'&&et.id==='pre') return {mes:12,dia:1,real:false};
    if(T&&T.enRango(md,et.desde,et.hasta)) return {mes:m,dia:n,real:true};
    return {mes:12,dia:{pre:10,casa:23,ano:31}[et.id],real:false};
  }
  // Nombre para el saludo: del usuario recordado en este teléfono ("alex.gonzalez" → "Alex")
  function nombre(){
    var u=''; try{ u=localStorage.getItem('innova_usuario_recordado')||''; }catch(e){}
    var p=(u.split(/[._\s-]/)[0]||'').replace(/[^a-záéíóúñü]/gi,'');
    return p? p.charAt(0).toUpperCase()+p.slice(1).toLowerCase() : '';
  }
  function esc(s){ return String(s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  // Saludo del login (lo llama el script del saludo cada minuto)
  window.__saludoNavidad=function(base){
    var et=etapa(); if(!et) return null;
    var f=dia(et), s=base;
    if(f.mes===12&&f.dia===24) s='Feliz Nochebuena';
    else if(f.mes===12&&f.dia===25) s='Feliz Navidad';
    else if(f.mes===1&&f.dia===1) s='Feliz Año Nuevo';
    var n=nombre(); return esc(s)+(n?', <em>'+esc(n)+'</em>':'');
  };

  function quitar(){
    if(soltarMedida){soltarMedida();soltarMedida=null;}
    document.querySelectorAll('.nv-capa,.nv-extra').forEach(function(e){ e.remove(); });
    if(bucle){ bucle.detener(); bucle=null; }
    armada=null;
  }

  // La decoración comparte la altura del contenido, aunque el login tenga scroll.
  // No se mide scrollHeight: la propia capa absoluta podría impedir que disminuyera.
  function encuadrar(ls,capa){
    var panel=ls.querySelector('.login-panel'),ro=null,pendiente=0;
    if(!panel)return function(){};
    function medir(){
      pendiente=0;if(!ls.clientHeight||!panel.offsetHeight)return;
      var espacio=parseFloat(getComputedStyle(panel).marginBottom)||0;
      var pie=parseFloat(getComputedStyle(ls).paddingBottom)||0;
      var alto=Math.ceil(Math.max(ls.clientHeight,panel.offsetTop+panel.offsetHeight+espacio+pie));
      if(capa.style.height!==alto+'px')capa.style.height=alto+'px';
      ls.style.setProperty('--nv-escena-alto',alto+'px');
    }
    function programar(){if(!pendiente)pendiente=requestAnimationFrame(medir);}
    if(typeof ResizeObserver==='function'){ro=new ResizeObserver(programar);ro.observe(ls);ro.observe(panel);}
    window.addEventListener('resize',programar);medir();
    return function(){
      if(ro)ro.disconnect();if(pendiente)cancelAnimationFrame(pendiente);
      window.removeEventListener('resize',programar);ls.style.removeProperty('--nv-escena-alto');
    };
  }

  /* ── canvas compartido: dibuja solo con el login a la vista y la app en primer plano ── */
  function lienzo(capa,pasos){
    var cv=document.createElement('canvas'); cv.className='nv-lienzo'; capa.appendChild(cv);
    var ctx=cv.getContext('2d'), W=0, H=0, b={vivo:true},tamano=null;
    function medir(){ var d=Math.min(window.devicePixelRatio||1,2); W=cv.clientWidth; H=cv.clientHeight; cv.width=W*d; cv.height=H*d; ctx.setTransform(d,0,0,d,0,0); }
    medir(); window.addEventListener('resize',medir);
    if(typeof ResizeObserver==='function'){tamano=new ResizeObserver(medir);tamano.observe(cv);}
    b.detener=function(){b.vivo=false;window.removeEventListener('resize',medir);if(tamano)tamano.disconnect();};
    var ls=document.getElementById('loginScreen');
    function cuadro(t){
      if(!b.vivo)return;
      if(!document.hidden&&ls&&ls.classList.contains('active')){ if(!W) medir(); ctx.clearRect(0,0,W,H); pasos.forEach(function(f){ f(ctx,W,H,t); }); }
      requestAnimationFrame(cuadro);
    }
    if(reducido){ setTimeout(function(){ if(!b.vivo)return; medir(); pasos.forEach(function(f){ f(ctx,W,H,0); }); },60); }
    else requestAnimationFrame(cuadro);
    b.ctx=ctx; b.tam=function(){ return [W,H]; };
    return b;
  }

  /* ════════════════ PRE-NAVIDAD ════════════════ */
  function armarPre(capa,f){
    var d=f.dia, avance=Math.min(1,(d-1)/16), prendenTodos=d>=17;
    // aurora, estrellas y nieve fina en el canvas
    var bandas=[{c:'80,255,170',y:.2,a:1.1,f:1.2,s:.00035},{c:'70,220,255',y:.26,a:.8,f:1.7,s:.00028},{c:'200,110,255',y:.14,a:.65,f:2.1,s:.0004},{c:'120,255,200',y:.33,a:.45,f:2.6,s:.0005}];
    var est=[]; for(var i=0;i<80;i++) est.push({x:Math.random(),y:Math.random()*.45,r:R(.5,1.6),f:R(0,6)});
    var cop=[]; for(i=0;i<60;i++) cop.push({x:Math.random(),y:Math.random(),r:R(.6,2.3),v:R(.0004,.0012)});
    bucle=lienzo(capa,[
      function(c,W,H,t){ est.forEach(function(e){ c.fillStyle='rgba(255,255,255,'+(.35+.65*Math.abs(Math.sin(t/900+e.f)))+')'; c.beginPath(); c.arc(e.x*W,e.y*H,e.r,0,6.283); c.fill(); }); },
      function(c,W,H,t){ c.globalCompositeOperation='lighter';
        bandas.forEach(function(b){ for(var x=0;x<=W;x+=5){ var yc=H*b.y+Math.sin(x/W*Math.PI*b.f+t*b.s*3)*34+Math.sin(x/90+t*b.s*5)*10, alto=110+Math.sin(x/60+t*b.s*4)*40, al=b.a*(.55+.45*Math.sin(x/70+t*b.s*6));
          var g=c.createLinearGradient(0,yc-alto,0,yc+20); g.addColorStop(0,'rgba('+b.c+',0)'); g.addColorStop(.75,'rgba('+b.c+','+(al*.5)+')'); g.addColorStop(1,'rgba('+b.c+',0)'); c.fillStyle=g; c.fillRect(x,yc-alto,5,alto+20); } });
        c.globalCompositeOperation='source-over'; },
      function(c,W,H){ c.fillStyle='#fff'; cop.forEach(function(k){ if(!reducido){ k.y+=k.v; if(k.y>1.02) k.y=-.02; } c.globalAlpha=.4+k.r/4; c.beginPath(); c.arc(k.x*W+Math.sin(k.y*12)*8,k.y*H,k.r,0,6.283); c.fill(); }); c.globalAlpha=1; }
    ]);
    // montañas, lago congelado y pinos escarchados con moños y esferas rojas; trineo atrapado
    function montes(){
    var Wv=Math.max(360,Math.round(window.innerWidth||412)), sx=Wv/412, dx=Wv-412;
    var pinos=[[18,262,.9],[46,266,1.2],[78,262,.8],[332+dx,262,.9],[362+dx,266,1.3],[394+dx,262,.85]];
    var m='<svg class="nv-montes" viewBox="0 0 '+Wv+' 330" preserveAspectRatio="xMidYMax slice"><defs>'+
      '<linearGradient id="nvMon1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#cfe6f6"/><stop offset="1" stop-color="#8db9da"/></linearGradient>'+
      '<linearGradient id="nvMon2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf6ff"/><stop offset="1" stop-color="#a9d0ea"/></linearGradient>'+
      '<linearGradient id="nvLago" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3f8"/><stop offset="1" stop-color="#e9f7ff"/></linearGradient>'+
      '<linearGradient id="nvPino" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1d4a6a"/><stop offset="1" stop-color="#2f6a8f"/></linearGradient></defs>'+
      '<g transform="scale('+sx.toFixed(4)+' 1)">'+
      '<path d="M-10 230 L60 120 L90 150 L140 70 L200 160 L250 100 L300 150 L350 80 L420 190 L420 330 L-10 330Z" fill="url(#nvMon2)" opacity=".85"/>'+
      '<path d="M140 70 L160 100 L150 98 L140 112 L128 96 L120 102Z M350 80 L368 108 L356 104 L348 116 L338 102 L332 106Z" fill="#fff"/>'+
      '<path d="M-10 260 L40 190 L80 220 L130 160 L190 230 L240 180 L290 230 L340 170 L420 250 L420 330 L-10 330Z" fill="url(#nvMon1)"/>'+
      '<rect x="0" y="262" width="412" height="70" fill="url(#nvLago)"/><path d="M0 262 H412" stroke="#fff" stroke-width="2"/>'+
      '<g opacity=".5" stroke="#fff" stroke-width="1"><path d="M30 280 h60 M140 292 h90 M260 284 h70 M80 304 h50 M300 310 h60"/></g></g>';
    pinos.forEach(function(p){
      m+='<g transform="translate('+p[0]+' '+p[1]+') scale('+p[2]+')"><path d="M0 -70 L14 -40 L8 -40 L20 -16 L12 -16 L24 6 L-24 6 L-12 -16 L-20 -16 L-8 -40 L-14 -40Z" fill="url(#nvPino)"/>'+
        '<path d="M0 -70 L8 -52 L0 -54 L-8 -52Z M-14 -40 L-4 -38 L0 -42 L6 -38 L14 -40 M-20 -16 L-6 -13 L2 -18 L10 -13 L20 -16 M-24 6 L-8 3 L4 0 L14 3 L24 6" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>'+
        '<g transform="translate(0 -70)"><path d="M0 0 C-9 -8 -12 2 -4 3Z M0 0 C9 -8 12 2 4 3Z" fill="#d81e34"/><path d="M-1 2 L-5 11 L-2 9 L-1 12Z M1 2 L5 11 L2 9 L1 12Z" fill="#a3132a"/><circle r="2" fill="#f24a5c"/></g>'+
        [[-8,-34],[9,-22],[-12,-6],[12,2]].map(function(b,j){ return '<g transform="translate('+b[0]+' '+b[1]+')"><circle r="'+(3.4-j*.2)+'" fill="'+(j%2?'#e3263c':'#c4152c')+'"/><path d="M-3 -1 a3.4 3.4 0 0 1 6 0" fill="#fff" opacity=".8"/></g>'; }).join('')+'</g>';
    });
    m+='<g transform="translate('+(Wv/2+44).toFixed(0)+' 304)"><path d="M-30 0 H22 C30 0 32 -8 26 -10" stroke="#9aa8b4" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M-26 -4 L-22 -18 H18 L22 -4Z" fill="#c4152c"/><path d="M-22 -18 H18" stroke="#f2c45a" stroke-width="2"/><path d="M-27 -18 C-20 -24 10 -24 20 -18 C12 -21 -16 -21 -27 -18Z" fill="#fff"/><path d="M-30 1 C-16 -3 10 -3 30 1 L30 5 L-30 5Z" fill="#f2fbff"/></g></svg>';
    var viejo=capa.querySelector('.nv-montes'); if(viejo) viejo.outerHTML=m; else capa.insertAdjacentHTML('afterbegin',m);
    }
    montes();
    var tmM=null; window.addEventListener('resize',function(){ if(!capa.isConnected) return; clearTimeout(tmM); tmM=setTimeout(montes,250); });

    // la casita de Navidad a lo lejos: cada día más cerca y con más ventanas encendidas
    var prog=(Math.min(d,24)-1)/23, k=.55+prog*.75, nv=Math.round(1+prog*5);
    var vs=[[-14,-6],[8,-6],[-14,6],[8,6],[-3,-17]];
    capa.insertAdjacentHTML('beforeend','<svg class="nv-casita" viewBox="-40 -50 80 80" style="width:'+Math.round(64*k)+'px;height:'+Math.round(64*k)+'px"><defs><radialGradient id="nvHalo"><stop offset="0" stop-color="#ffcf70" stop-opacity="'+(.35+prog*.4).toFixed(2)+'"/><stop offset="1" stop-color="#ffcf70" stop-opacity="0"/></radialGradient></defs>'+
      '<circle r="38" cy="-4" fill="url(#nvHalo)"/><path d="M14 -30 V-18 H20 V-26Z" fill="#7a3a22"/><g class="nv-humo"><circle cx="17" cy="-34" r="3" fill="#fff" opacity=".5"/><circle cx="19" cy="-41" r="4" fill="#fff" opacity=".35"/></g>'+
      '<rect x="-22" y="-12" width="44" height="30" fill="#c4152c"/><path d="M-28 -10 L0 -32 L28 -10Z" fill="#fff"/>'+
      vs.map(function(v,i){ return '<rect x="'+v[0]+'" y="'+v[1]+'" width="7" height="7" rx="1" fill="'+(i<nv?'#ffd27a':'#4a1820')+'"/>'; }).join('')+
      '<rect x="-4" y="6" width="8" height="12" rx="1" fill="'+(nv>=6?'#ffd27a':'#3a1a1a')+'"/><path d="M-22 18 H22" stroke="#fff" stroke-width="3"/>'+
      '<g fill="#ffd36b">'+[-20,-10,0,10,20].map(function(x){ return '<circle cx="'+x+'" cy="-12" r="1.4"/>'; }).join('')+'</g></svg>');

    // cordón de foquitos congelados: prenden más cada día; el 17 todos
    var cols=['#e3263c','#e3263c','#f2c45a','#e3263c','#2bb38a','#e3263c'];
    function curva(t,x0,x1,y0,y1,c){ var mx=(x0+x1)/2, my=(y0+y1)/2+c; return [(1-t)*(1-t)*x0+2*(1-t)*t*mx+t*t*x1,(1-t)*(1-t)*y0+2*(1-t)*t*my+t*t*y1]; }
    var tramos=[[-10,215,14,22,58],[215,440,22,14,58]];
    var g='<svg class="nv-focos" viewBox="0 0 430 120" preserveAspectRatio="none"><defs><filter id="nvBrillo" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'+
      '<linearGradient id="nvEsc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#cdeefc" stop-opacity=".55"/></linearGradient></defs>';
    tramos.forEach(function(tr){ var mx=(tr[0]+tr[1])/2, my=(tr[2]+tr[3])/2+tr[4];
      g+='<path d="M'+tr[0]+' '+tr[2]+' Q'+mx+' '+my+' '+tr[1]+' '+tr[3]+'" stroke="#2a3a4a" stroke-width="1.6" fill="none"/>'+
         '<path d="M'+tr[0]+' '+(tr[2]-1.5)+' Q'+mx+' '+(my-1.5)+' '+tr[1]+' '+(tr[3]-1.5)+'" stroke="url(#nvEsc)" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".9"/>';
      for(var i=1;i<18;i++){ var p=curva(i/18,tr[0],tr[1],tr[2],tr[3],tr[4]), L=4+((i*37)%9)*(1-avance*.6); g+='<path d="M'+(p[0]-2).toFixed(1)+' '+p[1].toFixed(1)+' L'+(p[0]+2).toFixed(1)+' '+p[1].toFixed(1)+' L'+p[0].toFixed(1)+' '+(p[1]+L).toFixed(1)+'Z" fill="#e8f8ff" opacity=".85"/>'; } });
    var n=0, total=22, prenden=prendenTodos?total:Math.round(total*avance*.8), orden=[];
    for(i=0;i<total;i++) orden.push(i); orden.sort(function(a,b){ return ((a*7)%total)-((b*7)%total); });
    var on={}; orden.slice(0,prenden).forEach(function(i){ on[i]=1; });
    tramos.forEach(function(tr){ for(var i=1;i<12;i++){ var p=curva(i/12,tr[0],tr[1],tr[2],tr[3],tr[4]), col=cols[n%cols.length], e=!!on[n];
      g+='<g class="nv-fq '+(e?'on':'off')+'" transform="translate('+p[0].toFixed(1)+' '+(p[1]+2).toFixed(1)+') rotate('+(((n*29)%30)-15)+')"><rect x="-3" y="-1" width="6" height="5" rx="1" fill="#5a6a7a"/>'+
        '<path class="vid" d="M0 3 C-6 5 -6 15 0 18 C6 15 6 5 0 3Z" fill="'+col+'" '+(e?'filter="url(#nvBrillo)"':'opacity=".55"')+'/>'+
        (e?'':'<path d="M-4.4 7 C-4 5 4 5 4.4 7 C4 11 -4 11 -4.4 7Z" fill="url(#nvEsc)"/><path d="M0 3 C-6 5 -6 15 0 18 C6 15 6 5 0 3Z" fill="#dff4ff" opacity=".35"/>')+
        '<ellipse cx="-1.6" cy="8" rx="1.1" ry="2.2" fill="#fff" opacity=".6"/></g>'; n++; } });
    capa.insertAdjacentHTML('beforeend',g+'</svg>');
    // los congelados titilan de vez en cuando, como queriendo prender
    if(!reducido&&!prendenTodos){ (function intentar(){ if(!capa.isConnected) return; var off=capa.querySelectorAll('.nv-fq.off'); if(off.length){ var x=off[(Math.random()*off.length)|0]; x.classList.add('intenta'); setTimeout(function(){ x.classList.remove('intenta'); },900); } setTimeout(intentar,1200+Math.random()*1800); })(); }

    // copos de cristal grandes que giran
    var copo='<svg viewBox="-50 -50 100 100" width="100%" height="100%"><g stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none">'+[0,60,120,180,240,300].map(function(a){ return '<g transform="rotate('+a+')"><path d="M0 0 V-44 M0 -16 L-10 -26 M0 -16 L10 -26 M0 -30 L-8 -38 M0 -30 L8 -38"/></g>'; }).join('')+'</g><circle r="5" fill="#fff"/></svg>';
    for(i=0;i<8;i++){ var sz=R(16,38); capa.insertAdjacentHTML('beforeend','<div class="nv-cristal" style="left:'+R(0,95).toFixed(1)+'%;width:'+sz.toFixed(0)+'px;height:'+sz.toFixed(0)+'px;--dx:'+R(-40,40).toFixed(0)+'px;animation-duration:'+R(10,20).toFixed(1)+'s,'+R(14,26).toFixed(1)+'s;animation-delay:-'+R(0,20).toFixed(1)+'s,-'+R(0,26).toFixed(1)+'s">'+copo+'</div>'); }

    // camino "Rumbo a Navidad" (bajo el nombre de la app): 24 días, el trineo avanza hasta hoy
    var hoy=Math.min(d,24), faltan=24-hoy, X=function(k){ return 8+(k-1)*(224/23); }, Y=function(k){ return 14+Math.sin(k*.7)*3.5; };
    var huellas='', trazo='M8 14', hecho='M8 14';
    for(var k2=1;k2<=24;k2++){ if(k2>1){ trazo+=' L'+X(k2).toFixed(1)+' '+Y(k2).toFixed(1); if(k2<=hoy) hecho+=' L'+X(k2).toFixed(1)+' '+Y(k2).toFixed(1); }
      if(k2!==hoy) huellas+='<circle cx="'+X(k2).toFixed(1)+'" cy="'+Y(k2).toFixed(1)+'" r="'+(k2%6===0?3:2.1)+'" fill="'+(k2<hoy?'#ff6b7a':'rgba(255,255,255,.45)')+'"/>'; }
    var sub=$('#loginScreen .login-brand-sub');
    if(sub) sub.insertAdjacentHTML('afterend','<div class="nv-extra nv-camino"><div class="nv-camino-t">Rumbo a Navidad <span>'+(faltan?'faltan <b>'+faltan+'</b> '+(faltan===1?'día':'días'):'<b>¡Hoy!</b>')+'</span></div>'+
      '<svg viewBox="0 0 262 30"><path d="'+trazo+'" stroke="rgba(255,255,255,.18)" stroke-width="5" stroke-linecap="round" fill="none"/><path d="'+hecho+'" stroke="#e3263c" stroke-width="2.4" stroke-linecap="round" fill="none" stroke-dasharray="1 5"/>'+huellas+
      '<g transform="translate('+X(hoy).toFixed(1)+' '+(Y(hoy)-2).toFixed(1)+')"><g class="nv-trineo"><path d="M-9 4 H7 C10 4 11 1 9 0" stroke="#dfe8f0" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M-8 3 L-7 -3 H6 L7 3Z" fill="#e3263c"/><path d="M-7 -3 H6" stroke="#f2c45a" stroke-width="1"/><rect x="-5" y="-8" width="6" height="5" rx="1" fill="#2bb38a"/><path d="M-2 -8 v5 M-5 -5.5 h6" stroke="#f2c45a" stroke-width=".9"/></g></g>'+
      '<g transform="translate(248 13)"><rect x="-8" y="-6" width="16" height="13" rx="2" fill="#e3263c"/><rect x="-9" y="-9" width="18" height="5" rx="1.5" fill="#c4152c"/><path d="M0 -9 V7" stroke="#f2c45a" stroke-width="2.2"/><path d="M0 -9 C-6 -15 -9 -9 -2 -9 M0 -9 C6 -15 9 -9 2 -9" stroke="#f2c45a" stroke-width="1.8" fill="none"/></g></svg></div>');

    // tarjeta envuelta como regalo: cinta, moño y etiqueta
    envolverTarjeta('Se abre el <b>24</b>');
    detallesPre(capa);
  }

  /* ── Pre-Navidad: detalles del login (escarcha, foquitos que se tocan, errores con "brrr", bienvenida) ── */
  function escarcha(w,h,semilla){
    var sem=semilla||7, rnd=function(){ sem=(sem*9301+49297)%233280; return sem/233280; }, d='';
    function rama(x,y,ang,largo,prof){
      var x2=x+Math.cos(ang)*largo, y2=y+Math.sin(ang)*largo; d+='M'+x.toFixed(1)+' '+y.toFixed(1)+'L'+x2.toFixed(1)+' '+y2.toFixed(1);
      if(prof<=0||largo<4) return;
      var n=prof>1?3:4;
      for(var k=1;k<=n;k++){ var t=k/(n+1), bx=x+(x2-x)*t, by=y+(y2-y)*t, l=largo*(.42-.06*k)*(.8+rnd()*.4);
        rama(bx,by,ang-1.05,l,prof-1); rama(bx,by,ang+1.05,l*(.85+rnd()*.3),prof-1); }
    }
    // desde la esquina (0,0) hacia adentro
    [[.18,62],[.62,74],[1.05,58],[1.4,40]].forEach(function(r){ rama(0,0,r[0]+(rnd()-.5)*.12,r[1]*(.85+rnd()*.3),2); });
    return '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMinYMin slice"><defs><radialGradient id="nvEscF'+semilla+'" cx="0" cy="0" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'+
      '<filter id="nvEscB'+semilla+'"><feGaussianBlur stdDeviation="1.2"/></filter></defs>'+
      '<rect width="'+w+'" height="'+h+'" fill="url(#nvEscF'+semilla+')"/>'+
      '<path d="'+d+'" stroke="#cfeeff" stroke-width="2.2" fill="none" opacity=".55" filter="url(#nvEscB'+semilla+')"/>'+
      '<path d="'+d+'" stroke="#ffffff" stroke-width=".85" fill="none" stroke-linecap="round" opacity=".95"/></svg>';
  }
  function chispas(x,y,n,cols){ for(var i=0;i<n;i++){ var c=document.createElement('i'); c.className='nv-extra nv-chispa'; c.style.left=x+'px'; c.style.top=y+'px';
      c.style.background=cols[i%cols.length]; var a=Math.random()*6.283, r=R(30,90); c.style.setProperty('--tx',(Math.cos(a)*r).toFixed(0)+'px'); c.style.setProperty('--ty',(Math.sin(a)*r).toFixed(0)+'px');
      document.body.appendChild(c); (function(e){ setTimeout(function(){ e.remove(); },900); })(c); } }
  function detallesPre(capa){
    var form=$('#loginScreen .login-form');
    // escarcha en dos esquinas de la tarjeta (las otras tienen el moño y la etiqueta)
    if(form) form.insertAdjacentHTML('afterbegin','<div class="nv-extra nv-escarcha a">'+escarcha(118,96,7)+'</div><div class="nv-extra nv-escarcha b">'+escarcha(118,96,19)+'</div>');
    // foquitos que se pueden tocar: el congelado titila, el encendido destella
    capa.querySelectorAll('.nv-fq').forEach(function(f){ f.addEventListener('pointerdown',function(e){ e.stopPropagation();
      var cl=f.classList.contains('on')?'destella':'intenta'; f.classList.remove(cl); void f.getBoundingClientRect(); f.classList.add(cl); setTimeout(function(){ f.classList.remove(cl); },900); }); });
    // botón: chispitas blancas al tocarlo
    var btn=$('#loginScreen .btn-login');
    if(btn&&!btn.__nv){ btn.__nv=1; btn.addEventListener('pointerdown',function(e){ if(armada!=='pre'||reducido) return; chispas(e.clientX,e.clientY,14,['#fff','#e8f8ff','#ffd9de']); }); }
  }
  // Una sola vez: avisos del login y la bienvenida al entrar
  (function(){
    function enPre(){ return armada==='pre'; }
    function falla(){ // el aviso de error: la tarjeta tiembla de frío y un foquito no prende
      var form=$('#loginScreen .login-form');
      // con la Web Animations API para no reiniciar la animación de entrada de la tarjeta (.lg-anim)
      if(form&&!reducido&&form.animate) form.animate([{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(-5px)'},{transform:'translateX(4px)'},{transform:'translateX(-2px)'},{transform:'translateX(0)'}],{duration:520,easing:'cubic-bezier(.36,.07,.19,.97)'});
      var on=document.querySelectorAll('.nv-fq.on'); if(on.length){ var f=on[(Math.random()*on.length)|0]; f.classList.add('falla'); setTimeout(function(){ f.classList.remove('falla'); },1600); }
    }
    function vigilar(){
      var al=document.getElementById('loginAlert'), ls=document.getElementById('loginScreen'); if(!al||!ls) return;
      new MutationObserver(function(){ if(!enPre()) return;
        al.querySelectorAll('.mk-av:not(.nv-ok)').forEach(function(m){ m.classList.add('nv-ok'); m.insertAdjacentHTML('beforeend','<div class="nv-helada">'+escarcha(92,64,31).replace('xMinYMin','xMaxYMin')+'</div>'); var h=m.querySelector('.nv-helada svg'); if(h) h.style.transform='scaleX(-1)'; });
        if(al.querySelector('.mk-av.mal')) falla(); }).observe(al,{childList:true});
      var antes=ls.classList.contains('active');
      new MutationObserver(function(){ var ahora=ls.classList.contains('active');
        if(antes&&!ahora&&enPre()&&!reducido){ var m=document.getElementById('maintenanceScreen'); if(!(m&&m.classList.contains('active'))) bienvenida(); }
        antes=ahora; }).observe(ls,{attributes:true,attributeFilter:['class']});
    }
    // al entrar: una guirnalda de foquitos se enciende arriba y caen copos, menos de un segundo
    function bienvenida(){
      var b=document.createElement('div'); b.className='nv-extra nv-bienvenida'; b.setAttribute('aria-hidden','true');
      var cols=['#e3263c','#f2c45a','#e3263c','#2bb38a','#e3263c','#9cd7ff'], g='', n=16;
      for(var i=0;i<n;i++){ var t=(i+.5)/n, x=t*400, y=10+Math.sin(t*Math.PI)*26;
        g+='<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+((i%2?1:-1)*10)+')"><rect x="-2.6" y="-1" width="5.2" height="4.4" rx="1" fill="#5a6a7a"/>'+
           '<path class="vid" style="animation-delay:'+(.25+i*.05).toFixed(2)+'s" d="M0 3 C-5.5 5 -5.5 14.5 0 17 C5.5 14.5 5.5 5 0 3Z" fill="'+cols[i%cols.length]+'" filter="url(#nvBvLuz)"/></g>'; }
      var copos=''; for(i=0;i<20;i++) copos+='<b style="left:'+R(0,100).toFixed(0)+'%;animation-delay:'+R(.1,.45).toFixed(2)+'s;width:'+R(4,8).toFixed(0)+'px;height:'+R(4,8).toFixed(0)+'px;--dx:'+R(-30,30).toFixed(0)+'px"></b>';
      var n2=nombre();
      b.innerHTML='<svg class="nv-bv-guirnalda" viewBox="0 0 400 50" preserveAspectRatio="none"><defs><filter id="nvBvLuz" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'+
        '<path d="M0 10 Q200 62 400 10" stroke="#2a3a4a" stroke-width="1.2" fill="none"/>'+g+'</svg>'+copos+
        '<div class="nv-bv-hola"><svg viewBox="-12 -12 24 24"><g stroke="#1b84c9" stroke-width="1.6" stroke-linecap="round" fill="none"><g id="nvBvC"><path d="M0 0V-10M0-5L-2.6-7.6M0-5L2.6-7.6"/></g><use href="#nvBvC" transform="rotate(60)"/><use href="#nvBvC" transform="rotate(120)"/><use href="#nvBvC" transform="rotate(180)"/><use href="#nvBvC" transform="rotate(240)"/><use href="#nvBvC" transform="rotate(300)"/></g></svg>'+
        (n2?'¡Qué gusto verte, '+esc(n2)+'!':'¡Qué gusto verte!')+'</div>';
      document.body.appendChild(b);
      setTimeout(function(){ b.remove(); },1750);
    }
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',vigilar); else vigilar();
  })();
  var MONO='<svg class="nv-extra nv-mono" viewBox="-39 -26 78 60"><defs>'+
    '<linearGradient id="nvLazo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b7c"/><stop offset=".45" stop-color="#e3263c"/><stop offset="1" stop-color="#8a0f22"/></linearGradient>'+
    '<linearGradient id="nvLazoIn" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e0a1a"/><stop offset="1" stop-color="#b5142c"/></linearGradient>'+
    '<linearGradient id="nvCola" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9e1027"/><stop offset=".5" stop-color="#e3263c"/><stop offset="1" stop-color="#8a0f22"/></linearGradient>'+
    '<radialGradient id="nvNudo" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ff8a98"/><stop offset=".6" stop-color="#d51f37"/><stop offset="1" stop-color="#8a0f22"/></radialGradient></defs>'+
    // colas
    '<path d="M-3 3 C-7 12 -12 20 -16 30 L-11 27 L-8 33 C-4 22 -1 12 1 4Z" fill="url(#nvCola)"/>'+
    '<path d="M3 3 C7 12 11 20 14 31 L9 28 L6 34 C3 22 1 12 -1 4Z" fill="url(#nvCola)"/>'+
    // lazos (con su interior más oscuro)
    '<path d="M-2 -1 C-14 -22 -38 -20 -35 -5 C-33 6 -16 7 -2 2Z" fill="url(#nvLazo)"/>'+
    '<path d="M-5 -1 C-14 -14 -29 -13 -28 -5 C-27 1 -16 2 -5 1Z" fill="url(#nvLazoIn)" opacity=".75"/>'+
    '<path d="M2 -1 C14 -22 38 -20 35 -5 C33 6 16 7 2 2Z" fill="url(#nvLazo)"/>'+
    '<path d="M5 -1 C14 -14 29 -13 28 -5 C27 1 16 2 5 1Z" fill="url(#nvLazoIn)" opacity=".75"/>'+
    '<path d="M-30 -12 C-24 -17 -14 -16 -8 -9" stroke="#ffc2ca" stroke-width="1.4" fill="none" opacity=".7" stroke-linecap="round"/>'+
    '<path d="M30 -12 C24 -17 14 -16 8 -9" stroke="#ffc2ca" stroke-width="1.4" fill="none" opacity=".5" stroke-linecap="round"/>'+
    // nudo
    '<rect x="-6.5" y="-6" width="13" height="11" rx="4.5" fill="url(#nvNudo)"/><path d="M-4 -3.5 C-1 -5 2 -5 4 -3.5" stroke="#ffc2ca" stroke-width="1.2" fill="none" opacity=".8" stroke-linecap="round"/>'+
    '</svg>';
  function envolverTarjeta(etq){
    var form=$('#loginScreen .login-form'); if(!form) return null;
    form.insertAdjacentHTML('afterbegin','<div class="nv-extra nv-cinta"></div>'+MONO+(etq?'<div class="nv-extra nv-etiqueta">'+etq+'</div>':''));
    return form;
  }

  /* ════════════════ NAVIDAD EN CASA ════════════════ */
  function armarCasa(capa,f){
    capa.insertAdjacentHTML('beforeend','<div class="nv-tapiz"></div>');
    // ventana con nieve afuera
    var v='<div class="nv-ventana">'; for(var i=0;i<26;i++) v+='<i style="left:'+R(0,96).toFixed(0)+'px;animation-duration:'+R(3,6).toFixed(1)+'s;animation-delay:-'+R(0,6).toFixed(1)+'s;opacity:'+R(.5,1).toFixed(2)+'"></i>';
    capa.insertAdjacentHTML('beforeend',v+'</div>');
    // árbol con esferas, guirnalda dorada, luces que titilan y la estrella
    var a='<svg class="nv-arbol" viewBox="0 0 230 430"><defs><linearGradient id="nvPinoA" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0f3d26"/><stop offset=".5" stop-color="#1f6b45"/><stop offset="1" stop-color="#0c3020"/></linearGradient>'+
      '<radialGradient id="nvEstA"><stop offset="0" stop-color="#fff8d0"/><stop offset=".5" stop-color="#ffd35a"/><stop offset="1" stop-color="#d99a20"/></radialGradient>'+
      '<filter id="nvLuz" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>'+
      '<rect x="104" y="388" width="22" height="34" fill="#4a2a14"/><path d="M70 400 h90 l-8 30 h-74z" fill="#8a1a1a"/><path d="M70 400 h90" stroke="#d9a840" stroke-width="4"/>';
    [[115,40,40,80],[115,90,62,140],[115,150,84,210],[115,220,104,290],[115,290,118,380]].forEach(function(p){ var cx=p[0],top=p[1],w=p[2],bot=p[3];
      a+='<path d="M'+cx+' '+top+' C'+(cx+w*.3)+' '+(top+30)+' '+(cx+w*.7)+' '+(bot-30)+' '+(cx+w)+' '+bot+' C'+(cx+w*.5)+' '+(bot+12)+' '+(cx-w*.5)+' '+(bot+12)+' '+(cx-w)+' '+bot+' C'+(cx-w*.7)+' '+(bot-30)+' '+(cx-w*.3)+' '+(top+30)+' '+cx+' '+top+'Z" fill="url(#nvPinoA)"/>'; });
    [[60,120,170,150],[42,195,190,230],[26,268,206,305],[16,340,214,372]].forEach(function(q){ a+='<path d="M'+q[0]+' '+q[1]+' Q115 '+(q[3]+18)+' '+q[2]+' '+(q[3]-14)+'" stroke="#e9c15a" stroke-width="2.4" fill="none" opacity=".9"/>'; });
    var cols=['#d4213a','#e9b44a','#f4f4f4','#2a7ad4','#d4213a','#e9b44a'];
    [[95,118],[140,128],[80,175],[150,190],[118,165],[60,240],[170,250],[112,232],[40,320],[90,300],[150,315],[195,330],[120,350],[70,365],[175,365]].forEach(function(p,i){ a+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+R(7,10).toFixed(1)+'" fill="'+cols[i%6]+'"/><circle cx="'+(p[0]-2.5)+'" cy="'+(p[1]-3)+'" r="2.4" fill="#fff" opacity=".7"/>'; });
    for(i=0;i<46;i++){ var t=R(.08,1), y=40+t*330, w=10+t*108, x=115+R(-w,w)*.85;
      a+='<circle class="nv-luz" cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="2.4" fill="'+['#ffd36b','#ff6b6b','#7ee2a8','#9cc7ff','#ffb36b'][i%5]+'" filter="url(#nvLuz)" style="animation-duration:'+R(1.2,2.6).toFixed(2)+'s;animation-delay:-'+R(0,2).toFixed(2)+'s"/>'; }
    a+='<g transform="translate(115 34)" filter="url(#nvLuz)"><path class="nv-estrella" d="M0 -22 L6 -7 L22 -6 L10 4 L14 20 L0 11 L-14 20 L-10 4 L-22 -6 L-6 -7Z" fill="url(#nvEstA)"/></g></svg>';
    capa.insertAdjacentHTML('beforeend',a);
    // guirnalda de pino con luces y moño arriba
    var g='<svg class="nv-guirnalda" viewBox="0 0 430 90" preserveAspectRatio="none"><path d="M0 10 Q107 70 215 18 Q322 70 430 10" stroke="#174d31" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M0 10 Q107 70 215 18 Q322 70 430 10" stroke="#256b45" stroke-width="7" fill="none" stroke-dasharray="3 5"/>';
    for(i=1;i<20;i++){ var tt=i/20, half=tt<.5, u=half?tt*2:(tt-.5)*2, x0=half?0:215, x1=half?215:430, y0=half?10:18, y1=half?18:10;
      var px=(1-u)*(1-u)*x0+2*(1-u)*u*(x0+107)+u*u*x1, py=(1-u)*(1-u)*y0+2*(1-u)*u*70+u*u*y1;
      g+='<circle class="nv-luz" cx="'+px.toFixed(1)+'" cy="'+(py+5).toFixed(1)+'" r="4" fill="'+['#ffd36b','#ff5a5f','#7ee2a8','#9cc7ff'][i%4]+'" style="animation-duration:'+R(1.2,2.2).toFixed(2)+'s;animation-delay:-'+R(0,2).toFixed(2)+'s"/>'; }
    g+='<g transform="translate(215 24)"><path d="M0 0 C-14 -12 -20 2 -7 5Z M0 0 C14 -12 20 2 7 5Z" fill="#c81f35"/><path d="M-2 3 L-9 20 L-4 17 L-2 22Z M2 3 L9 20 L4 17 L2 22Z" fill="#a3132a"/><circle r="3.4" fill="#e2384d"/></g></svg>';
    capa.insertAdjacentHTML('beforeend',g);
    // chimenea con fuego
    capa.insertAdjacentHTML('beforeend','<svg class="nv-chimenea" viewBox="0 0 250 230"><defs><linearGradient id="nvLadr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a3a22"/><stop offset="1" stop-color="#5a2010"/></linearGradient>'+
      '<radialGradient id="nvFuego" cx=".5" cy=".9" r=".9"><stop offset="0" stop-color="#fff3b0"/><stop offset=".35" stop-color="#ffb02e"/><stop offset=".7" stop-color="#ff5a1f"/><stop offset="1" stop-color="#c0180a" stop-opacity="0"/></radialGradient>'+
      '<radialGradient id="nvResp" cx=".5" cy=".8" r=".7"><stop offset="0" stop-color="#ffb060" stop-opacity=".65"/><stop offset="1" stop-color="#ffb060" stop-opacity="0"/></radialGradient></defs>'+
      '<ellipse class="nv-resplandor" cx="125" cy="200" rx="160" ry="90" fill="url(#nvResp)"/><rect x="20" y="40" width="230" height="190" fill="url(#nvLadr)"/>'+
      '<g stroke="#3e150a" stroke-width="1.4" opacity=".6">'+[60,80,100,120,140,160,180,200].map(function(y,i){ return '<path d="M20 '+y+' H250"/>'+[0,1,2,3,4,5].map(function(k){ return '<path d="M'+(20+k*40+(i%2?20:0))+' '+y+' v20"/>'; }).join(''); }).join('')+'</g>'+
      '<rect x="8" y="28" width="250" height="18" rx="3" fill="#3a1a0c"/><rect x="8" y="28" width="250" height="5" fill="#5a2a16"/><path d="M60 230 V130 Q60 100 90 100 H200 Q230 100 230 130 V230Z" fill="#1a0805"/>'+
      '<path class="nv-llama" d="M100 226 C90 200 104 186 112 170 C114 186 124 190 122 204 C130 196 132 182 128 168 C146 184 150 206 140 226Z" fill="url(#nvFuego)"/>'+
      '<path class="nv-llama dos" d="M150 226 C144 206 152 194 160 184 C162 196 170 198 168 210 C176 202 174 192 172 186 C186 200 186 214 180 226Z" fill="url(#nvFuego)"/>'+
      '<rect x="86" y="222" width="110" height="9" rx="4" fill="#4a2410"/><rect x="96" y="214" width="90" height="9" rx="4" fill="#5a2e14" transform="rotate(-4 141 218)"/></svg>');
    // medias colgadas del manto: la primera con tu nombre
    var n=nombre().toUpperCase().slice(0,7), med='<div class="nv-medias">';
    [[n||'TÚ','#c81f35'],['EQUIPO','#1f6b45'],['INNOVA','#b98328'],[String(f.mes===1?new Date().getFullYear()-1:new Date().getFullYear()),'#1f6b45']].forEach(function(mm,i){
      med+=('<svg class="nv-media m'+(i+1)+'" viewBox="0 0 46 70" style="animation-delay:-'+(i*1.3)+'s"><path d="M10 0 h24 v38 c0 6 4 8 10 12 c6 4 2 18 -8 16 c-8 -2 -14 -8 -20 -12 c-6 -4 -6 -8 -6 -14z" fill="'+mm[1]+'"/><rect x="8" y="0" width="28" height="12" rx="3" fill="#fff"/><text x="22" y="9" font-size="'+(mm[0].length>5?6:7)+'" font-weight="800" text-anchor="middle" fill="'+mm[1]+'" font-family="Plus Jakarta Sans,Inter,sans-serif">'+esc(mm[0])+'</text><circle cx="16" cy="24" r="2" fill="#fff" opacity=".7"/><circle cx="26" cy="32" r="2" fill="#fff" opacity=".7"/></svg>'); });
    capa.insertAdjacentHTML('beforeend',med+'</div>');
    for(i=0;i<12;i++) capa.insertAdjacentHTML('beforeend','<i class="nv-bokeh" style="left:'+R(0,100).toFixed(0)+'%;top:'+R(5,70).toFixed(0)+'%;width:'+R(10,32).toFixed(0)+'px;height:'+R(10,32).toFixed(0)+'px;background:rgba(255,'+(R(150,210)|0)+',90,'+R(.12,.3).toFixed(2)+');animation-delay:-'+R(0,3).toFixed(1)+'s"></i>');
    // 24 de diciembre: se abre el regalo (una vez por teléfono, el día de verdad o en la vista previa)
    if(f.mes===12&&f.dia===24){
      var clave='innova_nav_regalo', ya=null; try{ ya=localStorage.getItem(clave); }catch(e){}
      var marca=String(new Date().getFullYear());
      if(ya!==marca||!f.real){
        var form=envolverTarjeta('');
        if(form&&!reducido){ setTimeout(function(){ form.classList.add('nv-abre'); try{ if(f.real) localStorage.setItem(clave,marca); }catch(e){} confeti(form); },1400);
          setTimeout(function(){ form.querySelectorAll('.nv-cinta,.nv-mono').forEach(function(e){ e.remove(); }); form.classList.remove('nv-abre'); },3400); }
        else if(form){ form.querySelectorAll('.nv-cinta,.nv-mono').forEach(function(e){ e.remove(); }); }
      }
    }
  }
  function confeti(form){
    var r=form.getBoundingClientRect(), cols=['#e3263c','#f2c45a','#2bb38a','#fff','#ff8a95'];
    for(var i=0;i<26;i++){ var c=document.createElement('i'); c.className='nv-extra nv-confeti';
      c.style.left=(r.right-56)+'px'; c.style.top=(r.top+4)+'px'; c.style.background=cols[i%5];
      c.style.setProperty('--tx',R(-180,120).toFixed(0)+'px'); c.style.setProperty('--ty',R(-160,40).toFixed(0)+'px'); c.style.setProperty('--rot',R(0,720).toFixed(0)+'deg');
      document.body.appendChild(c); (function(e){ setTimeout(function(){ e.remove(); },1600); })(c); }
  }

  /* ════════════════ AÑO NUEVO ════════════════ */
  function armarAno(capa,f){
    // ciudad con ventanas encendidas
    var c='<svg class="nv-ciudad" viewBox="0 0 412 170" preserveAspectRatio="xMidYMax slice"><defs><linearGradient id="nvEdif" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1236"/><stop offset="1" stop-color="#0a0618"/></linearGradient></defs>';
    var x=0; while(x<412){ var w=R(26,52), h=R(50,140); c+='<rect x="'+x.toFixed(0)+'" y="'+(170-h).toFixed(0)+'" width="'+w.toFixed(0)+'" height="'+h.toFixed(0)+'" fill="url(#nvEdif)"/>';
      for(var yy=170-h+8;yy<162;yy+=12) for(var xx=x+5;xx<x+w-6;xx+=9) if(Math.random()<.45) c+='<rect x="'+xx.toFixed(0)+'" y="'+yy.toFixed(0)+'" width="4" height="6" fill="'+(Math.random()<.8?'#ffcf70':'#9cc7ff')+'" opacity="'+R(.5,1).toFixed(2)+'"/>';
      x+=w+R(0,4); }
    capa.insertAdjacentHTML('beforeend',c+'</svg>');
    // banderines
    var b='<svg class="nv-banderines" viewBox="0 0 412 120" preserveAspectRatio="none">';
    [[0,8,412,30,46],[0,38,412,14,40]].forEach(function(q,j){ b+='<path d="M'+q[0]+' '+q[1]+' Q206 '+((q[1]+q[3])/2+q[4])+' '+q[2]+' '+q[3]+'" stroke="rgba(255,255,255,.35)" stroke-width="1" fill="none"/>';
      for(var i=1;i<16;i++){ var t=i/16, my=(q[1]+q[3])/2+q[4], X=(1-t)*(1-t)*q[0]+2*(1-t)*t*206+t*t*q[2], Y=(1-t)*(1-t)*q[1]+2*(1-t)*t*my+t*t*q[3];
        b+='<path d="M'+(X-7).toFixed(1)+' '+Y.toFixed(1)+' L'+(X+7).toFixed(1)+' '+Y.toFixed(1)+' L'+X.toFixed(1)+' '+(Y+16).toFixed(1)+'Z" fill="'+['#ff3d6e','#ffb02e','#3ee08f','#3fb6ff','#b05cff'][(i+j)%5]+'" opacity=".9"/>'; } });
    capa.insertAdjacentHTML('beforeend',b+'</svg>');
    var ls=document.getElementById('loginScreen');
    var hint=document.createElement('div'); hint.className='nv-extra nv-toca'; hint.textContent='✦ Toca el cielo para lanzar un cohete ✦'; ls.appendChild(hint);
    // pólvora
    var coh=[], chis=[], flash=0, prox=0;
    var PAL=[['#ff3d6e','#ffd1dc'],['#ffb02e','#fff0c9'],['#3ee08f','#d9ffe9'],['#3fb6ff','#e0f3ff'],['#b05cff','#efdcff'],['#ffe14a','#ffffff']];
    function lanzar(tx,ty){ var t=bucle&&bucle.tam(); if(!t||!t[0]) return; var W=t[0],H=t[1];
      var x0=tx!=null?tx+R(-30,30):(Math.random()<.5?R(W*.06,W*.3):R(W*.7,W*.94)), dest=ty!=null?ty:R(H*.1,H*.42), vy=-Math.sqrt(2*.06*Math.max(60,H-150-dest));
      coh.push({x:x0,y:H-150,vx:tx!=null?(tx-x0)/(Math.abs(vy)/.06):R(-.4,.4),vy:vy,col:PAL[(Math.random()*PAL.length)|0],cola:[],tipo:(Math.random()*4)|0}); }
    function estalla(k){ for(var i=0;i<80;i++){ var a=i/80*6.283, s=k.tipo===0?R(.6,3.4):k.tipo===1?3:k.tipo===2?R(1,2.4):2.6;
        var p={x:k.x,y:k.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,v:1,col:Math.random()<.6?k.col[0]:k.col[1],sauce:k.tipo===2,crep:k.tipo===3}; if(k.tipo===1&&i%2){ p.vx*=.55; p.vy*=.55; } chis.push(p); } flash=1; }
    ls.addEventListener('pointerdown',function(e){ if(!capa.isConnected||e.target.closest('.login-form,.login-footer,button,input,label')) return; if(e.clientY<window.innerHeight*.45) lanzar(e.clientX,e.clientY); });
    bucle=lienzo(capa,[function(cx,W,H,t){
      if(reducido) return;
      if(t>prox){ lanzar(); if(Math.random()<.4) setTimeout(function(){ lanzar(); },200); prox=t+R(700,1400); }
      if(flash>0){ cx.fillStyle='rgba(255,200,240,'+(flash*.07)+')'; cx.fillRect(0,0,W,H); flash-=.035; }
      for(var i=coh.length-1;i>=0;i--){ var k=coh[i]; k.cola.push([k.x,k.y]); if(k.cola.length>12) k.cola.shift(); k.x+=k.vx; k.y+=k.vy; k.vy+=.06;
        cx.strokeStyle='rgba(255,220,170,.8)'; cx.lineWidth=1.6; cx.beginPath(); k.cola.forEach(function(p,j){ if(j) cx.lineTo(p[0],p[1]); else cx.moveTo(p[0],p[1]); }); cx.stroke();
        if(k.vy>=-.4){ estalla(k); coh.splice(i,1); } }
      cx.globalCompositeOperation='lighter';
      for(i=chis.length-1;i>=0;i--){ var p=chis[i]; p.x+=p.vx; p.y+=p.vy; p.vx*=p.sauce?.975:.982; p.vy=p.vy*(p.sauce?.975:.982)+(p.sauce?.05:.035); p.v-=p.sauce?.0075:.012;
        if(p.v<=0){ chis.splice(i,1); continue; } var al=p.crep?(Math.random()<.5?p.v:0):p.v;
        cx.strokeStyle=p.sauce?'#ffd27a':p.col; cx.globalAlpha=al*.6; cx.lineWidth=p.sauce?1.6:1.3; cx.beginPath(); cx.moveTo(p.x-p.vx*(p.sauce?7:4),p.y-p.vy*(p.sauce?7:4)); cx.lineTo(p.x,p.y); cx.stroke();
        cx.fillStyle=p.sauce?'#fff0c0':p.col; cx.globalAlpha=al; cx.beginPath(); cx.arc(p.x,p.y,1.7,0,6.283); cx.fill(); cx.globalAlpha=al*.22; cx.beginPath(); cx.arc(p.x,p.y,5,0,6.283); cx.fill(); }
      cx.globalAlpha=1; cx.globalCompositeOperation='source-over';
    }]);
  }

  // Cuenta regresiva (casa y año nuevo) bajo el nombre de la app
  function cuenta(et,f){
    var sub=$('#loginScreen .login-brand-sub'); if(!sub) return;
    var t;
    if(et.id==='casa') t=f.dia<24?'Faltan <b>'+(24-f.dia)+'</b> '+(24-f.dia===1?'día':'días')+' para Nochebuena':f.dia===24?'Esta noche es <b>Nochebuena</b>':f.dia===25?'¡Hoy es <b>Navidad</b>!':'Felices <b>fiestas</b>';
    else { var anio=new Date().getFullYear()+(f.mes===12?1:0); if(!f.real) anio=new Date().getFullYear()+1;
      t=f.mes===12?(32-f.dia===1?'Mañana empieza el <b>'+anio+'</b>':'Faltan <b>'+(32-f.dia)+'</b> días para el <b>'+anio+'</b>'):'¡Feliz <b>'+anio+'</b>!'; }
    sub.insertAdjacentHTML('afterend','<div class="nv-extra nv-cuenta">'+(et.id==='casa'?'🎁 ':'🎆 ')+t+'</div>');
  }

  window.__escenaNavidad=function(){
    var et=etapa();
    if(!et){ if(armada) quitar(); return; }
    var ls=document.getElementById('loginScreen'); if(!ls) return;
    if(armada===et.id) return;
    quitar();
    var f=dia(et), capa=document.createElement('div');
    capa.className='nv-capa nv-'+et.id; capa.setAttribute('aria-hidden','true');
    ls.insertBefore(capa,ls.firstChild);
    if(et.id==='pre') armarPre(capa,f); else if(et.id==='casa'){ armarCasa(capa,f); cuenta(et,f); } else { armarAno(capa,f); cuenta(et,f); }
    // Pre-Navidad: nieve suave dentro de la app (CSS la esconde mientras el login está a la vista)
    if(et.id==='pre'&&!reducido&&document.body){ var amb=document.createElement('div'), cc=''; amb.className='nv-extra nv-amb'; amb.setAttribute('aria-hidden','true');
      for(var k=0;k<10;k++) cc+='<i style="left:'+(4+k*9.6).toFixed(1)+'%;animation-duration:'+(15+(k*7)%9)+'s;animation-delay:-'+((k*5.3)%17).toFixed(1)+'s"></i>';
      amb.innerHTML=cc; document.body.appendChild(amb); }
    soltarMedida=encuadrar(ls,capa);
    armada=et.id;
    window.__pintarSaludo&&window.__pintarSaludo();
  };
})();
