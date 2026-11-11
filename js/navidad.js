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
  var armada=null, bucle=null, soltarMedida=null, hieloListo=false;
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
    document.querySelectorAll('#loginScreen .nv-deshielo,#loginScreen .nv-libre').forEach(function(e){ e.classList.remove('nv-deshielo','nv-libre'); });
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
      // La base del bloque toca el primer plano nevado, no la ladera del fondo.
      var mascota=panel.querySelector('.nv-mascota');
      if(mascota)ls.style.setProperty('--nv-mascota-apoyo',(panel.offsetTop+panel.offsetHeight-alto+38-mascota.offsetHeight*.045).toFixed(1)+'px');
    }
    function programar(){if(!pendiente)pendiente=requestAnimationFrame(medir);}
    if(typeof ResizeObserver==='function'){ro=new ResizeObserver(programar);ro.observe(ls);ro.observe(panel);}
    window.addEventListener('resize',programar);medir();
    return function(){
      if(ro)ro.disconnect();if(pendiente)cancelAnimationFrame(pendiente);
      window.removeEventListener('resize',programar);ls.style.removeProperty('--nv-escena-alto');ls.style.removeProperty('--nv-mascota-apoyo');
    };
  }

  /* ── canvas compartido: dibuja solo con el login a la vista y la app en primer plano ── */
  // opc.fps: tope de cuadros por segundo (Pre-Navidad dibuja a 30: en un celular económico la escena a 60 saturaba el
  // procesador). Lo que avanza por cuadro usa «ritmo» (1 = un cuadro a 60 cps) para moverse igual de rápido.
  var ritmo=1;
  function lienzo(capa,pasos,opc){
    var cv=document.createElement('canvas'); cv.className='nv-lienzo'; capa.appendChild(cv);
    var ctx=cv.getContext('2d'), W=0, H=0, b={vivo:true},tamano=null, minMs=opc&&opc.fps?1000/opc.fps-2:0, ult=0;
    function medir(){ var d=Math.min(window.devicePixelRatio||1,opc&&opc.dpr||1.5); W=cv.clientWidth; H=cv.clientHeight; cv.width=W*d; cv.height=H*d; ctx.setTransform(d,0,0,d,0,0); }
    medir(); window.addEventListener('resize',medir);
    if(typeof ResizeObserver==='function'){tamano=new ResizeObserver(medir);tamano.observe(cv);}
    b.detener=function(){b.vivo=false;window.removeEventListener('resize',medir);if(tamano)tamano.disconnect();};
    var ls=document.getElementById('loginScreen');
    // con el login oculto (adentro de la app o en segundo plano) el ciclo se detiene del todo y se reanuda al volver
    var raf=0;
    function aLaVista(){ return !document.hidden&&ls&&ls.classList.contains('active'); }
    function cuadro(t){
      raf=0; if(!b.vivo||!aLaVista()) return;
      raf=requestAnimationFrame(cuadro);
      if(minMs&&t-ult<minMs) return;
      ritmo=ult?Math.min(6,(t-ult)/16.67):1; ult=t;
      if(!W) medir(); ctx.clearRect(0,0,W,H); pasos.forEach(function(f){ f(ctx,W,H,t); });
    }
    function seguir(){ if(!raf&&b.vivo&&!reducido&&aLaVista()){ ult=0; raf=requestAnimationFrame(cuadro); } }
    if(reducido){ setTimeout(function(){ if(!b.vivo)return; medir(); pasos.forEach(function(f){ f(ctx,W,H,0); }); },60); }
    else { seguir(); if(ls){ var mo=new MutationObserver(seguir); mo.observe(ls,{attributes:true,attributeFilter:['class']}); } document.addEventListener('visibilitychange',seguir); var det=b.detener; b.detener=function(){ det(); if(mo) mo.disconnect(); document.removeEventListener('visibilitychange',seguir); if(raf) cancelAnimationFrame(raf); }; }
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
    var techo=null,medido=-1000,ultimoCopo=-15000,posados=[], aurora=document.createElement('canvas'), auroraT=-1e9;
    bucle=lienzo(capa,[
      function(c,W,H,t){ est.forEach(function(e){ c.fillStyle='rgba(255,255,255,'+(.35+.65*Math.abs(Math.sin(t/900+e.f)))+')'; c.beginPath(); c.arc(e.x*W,e.y*H,e.r,0,6.283); c.fill(); }); },
      function(c,W,H,t){
        // la aurora se mueve muy despacio: se pinta a media resolución unas 11 veces por segundo y se copia en cada cuadro
        var aw=Math.ceil(W/2), ah=Math.ceil(H/2);
        if(aurora.width!==aw||aurora.height!==ah){ aurora.width=aw; aurora.height=ah; auroraT=-1e9; }
        if(t-auroraT>90){ auroraT=t; var a=aurora.getContext('2d'); a.setTransform(.5,0,0,.5,0,0); a.clearRect(0,0,W,H); a.globalCompositeOperation='lighter';
          bandas.forEach(function(b){ for(var x=0;x<=W;x+=6){ var yc=H*b.y+Math.sin(x/W*Math.PI*b.f+t*b.s*3)*34+Math.sin(x/90+t*b.s*5)*10, alto=110+Math.sin(x/60+t*b.s*4)*40, al=b.a*(.55+.45*Math.sin(x/70+t*b.s*6));
            var g=a.createLinearGradient(0,yc-alto,0,yc+20); g.addColorStop(0,'rgba('+b.c+',0)'); g.addColorStop(.75,'rgba('+b.c+','+(al*.5)+')'); g.addColorStop(1,'rgba('+b.c+',0)'); a.fillStyle=g; a.fillRect(x,yc-alto,6,alto+20); } }); }
        c.globalCompositeOperation='lighter'; c.drawImage(aurora,0,0,W,H); c.globalCompositeOperation='source-over'; },
      function(c,W,H,t){
        // La nieve comparte el espacio físico del bloque y se posa en su cara superior.
        if(t-medido>300){medido=t;var hielo=$('#loginScreen .nv-mascota-congelada #nvice-body');techo=null;
          if(hielo){var r=hielo.getBoundingClientRect(),b=c.canvas.getBoundingClientRect();if(r.width&&b.width)techo={l:r.left-b.left+r.width*.12,r:r.right-b.left-r.width*.12,y:r.top-b.top,b:b};}}
        c.fillStyle='#fff';cop.forEach(function(k){var antes=k.y*H;if(!reducido){ k.y+=k.v*ritmo; if(k.y>1.02)k.y=-.02; }
          var x=k.x*W+Math.sin(k.y*12)*8,y=k.y*H;
          if(techo&&antes<techo.y&&y>=techo.y&&x>techo.l&&x<techo.r){
            posados.push({x:x,y:techo.y,t:t,r:k.r});k.y=-.02;
            if(t-ultimoCopo>14000&&!reducido){ultimoCopo=t;var ls=document.getElementById('loginScreen');ls.dispatchEvent(new CustomEvent('navidad:entorno',{detail:{kind:'nieve',x:techo.b.left+x,y:techo.b.top+techo.y,color:'#d5f3ff'}}));}
            return;
          }
          c.globalAlpha=.4+k.r/4;c.beginPath();c.arc(x,y,k.r,0,6.283);c.fill();
        });
        posados=posados.filter(function(p){var u=(t-p.t)/1500;if(u>1)return false;c.globalAlpha=(1-u)*.8;c.beginPath();c.ellipse(p.x,p.y-1,p.r*1.5,p.r*.6,0,0,6.283);c.fill();return true;});c.globalAlpha=1;
      }
    ],{fps:30,dpr:1});   // aurora, estrellas y nieve: suaves, a 1× se ven igual y cuestan menos de la mitad
    // montañas, lago congelado y pinos escarchados con moños y esferas rojas; trineo atrapado
    function montes(){
    var Wv=Math.max(360,Math.round(window.innerWidth||412)), sx=Math.min(Wv/412,1.45), dx=Wv-412;
    // en teléfono el perfil ocupa todo el ancho; en tablet/PC se repite (alternando el sentido) en vez de estirarse
    var tiraW=412*sx, tiras=Math.ceil(Wv/tiraW);
    var pinos=[[18,262,.9],[46,266,1.2],[78,262,.8],[332+dx,262,.9],[362+dx,266,1.3],[394+dx,262,.85]];
    if(Wv>560){   // bosquecitos de 2 o 3 pinos hacia el centro (con huecos entre ellos), sin llegar debajo de la tarjeta ni tapar la casita
      var lim=Wv*.5-240, casa=Wv*(Wv>=760?.2:.27), grupos=Math.max(1,Math.min(4,Math.floor((lim-120)/150)));
      [[1,0],[-1,1]].forEach(function(ld){ for(var q=0;q<grupos;q++){
        var cx=120+(lim-120)*(q+.5)/grupos+((q*53+ld[1]*31)%40-20); if(ld[0]>0&&Math.abs(cx-casa)<80) cx=casa+(cx<casa?-80:80);
        var cuantos=2+((q+ld[1])%2), base=ld[0]>0?cx:Wv-cx;
        for(var r=0;r<cuantos;r++){ var lejos=r===1, xr=base+(r-1)*(lejos?9:22)+(r===2?6:0);
          pinos.push([Math.round(xr),lejos?257:263+((q+r)%2)*3,lejos?.62+((q*7+r)%3)*.06:.85+((q*5+r*3+ld[1])%4)*.12]); } } }); }
    pinos.sort(function(a,b){ return a[1]-b[1]; });
    var m='<svg class="nv-montes" viewBox="0 0 '+Wv+' 330" preserveAspectRatio="xMidYMax slice"><defs>'+
      '<linearGradient id="nvMon1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#cfe6f6"/><stop offset="1" stop-color="#8db9da"/></linearGradient>'+
      '<linearGradient id="nvMon2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf6ff"/><stop offset="1" stop-color="#a9d0ea"/></linearGradient>'+
      '<linearGradient id="nvLago" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3f8"/><stop offset="1" stop-color="#e9f7ff"/></linearGradient>'+
      '<linearGradient id="nvPino" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1d4a6a"/><stop offset="1" stop-color="#2f6a8f"/></linearGradient></defs>'+
      (function(){ var t=''; for(var k=0;k<tiras;k++){ var x0=k*tiraW, esp=k%2;   // cada tira, la mitad al revés para que no se note la repetición
        t+='<g transform="translate('+(x0+(esp?tiraW:0)).toFixed(1)+' 0) scale('+(esp?-sx:sx).toFixed(4)+' 1)">'+
        '<path d="M0 220 L60 120 L90 150 L140 70 L200 160 L250 100 L300 150 L350 80 L412.5 175 L412.5 330 L0 330Z" fill="url(#nvMon2)" opacity=".85"/>'+
        '<path d="M140 70 L160 100 L150 98 L140 112 L128 96 L120 102Z M350 80 L368 108 L356 104 L348 116 L338 102 L332 106Z" fill="#fff"/>'+
        '<path d="M0 248 L40 190 L80 220 L130 160 L190 230 L240 180 L290 230 L340 170 L412.5 240 L412.5 330 L0 330Z" fill="url(#nvMon1)"/></g>'; } return t; })()+
      '<rect x="0" y="262" width="'+Wv+'" height="70" fill="url(#nvLago)"/><path d="M0 262 H'+Wv+'" stroke="#fff" stroke-width="2"/>'+
      '<g opacity=".5" stroke="#fff" stroke-width="1"><path d="'+(function(){ var d='', L=[[30,280,60],[140,292,90],[260,284,70],[80,304,50],[300,310,60]]; for(var k=0;k*412<Wv;k++) L.forEach(function(l){ d+='M'+(l[0]+k*412)+' '+l[1]+' h'+l[2]+' '; }); return d; })()+'"/></g>';
    pinos.forEach(function(p){
      m+='<g transform="translate('+p[0]+' '+p[1]+') scale('+p[2]+')"><path d="M0 -70 L14 -40 L8 -40 L20 -16 L12 -16 L24 6 L-24 6 L-12 -16 L-20 -16 L-8 -40 L-14 -40Z" fill="url(#nvPino)"/>'+
        '<path d="M0 -70 L8 -52 L0 -54 L-8 -52Z M-14 -40 L-4 -38 L0 -42 L6 -38 L14 -40 M-20 -16 L-6 -13 L2 -18 L10 -13 L20 -16 M-24 6 L-8 3 L4 0 L14 3 L24 6" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>'+
        '<g transform="translate(0 -70)"><path d="M0 0 C-9 -8 -12 2 -4 3Z M0 0 C9 -8 12 2 4 3Z" fill="#d81e34"/><path d="M-1 2 L-5 11 L-2 9 L-1 12Z M1 2 L5 11 L2 9 L1 12Z" fill="#a3132a"/><circle r="2" fill="#f24a5c"/></g>'+
        [[-8,-34],[9,-22],[-12,-6],[12,2]].map(function(b,j){ return '<g transform="translate('+b[0]+' '+b[1]+')"><circle r="'+(3.4-j*.2)+'" fill="'+(j%2?'#e3263c':'#c4152c')+'"/><path d="M-3 -1 a3.4 3.4 0 0 1 6 0" fill="#fff" opacity=".8"/></g>'; }).join('')+'</g>';
    });
    m+='<g transform="translate('+(Wv<700?Wv/2+44:Math.max(Wv/2+260,Wv*.66)).toFixed(0)+' '+(Wv<700?304:294)+')'+(Wv<700?'':' scale(1.25)')+'"><path d="M-30 0 H22 C30 0 32 -8 26 -10" stroke="#9aa8b4" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M-26 -4 L-22 -18 H18 L22 -4Z" fill="#c4152c"/><path d="M-22 -18 H18" stroke="#f2c45a" stroke-width="2"/><path d="M-27 -18 C-20 -24 10 -24 20 -18 C12 -21 -16 -21 -27 -18Z" fill="#fff"/><path d="M-30 1 C-16 -3 10 -3 30 1 L30 5 L-30 5Z" fill="#f2fbff"/></g></svg>';
    var viejo=capa.querySelector('.nv-montes'); if(viejo) viejo.outerHTML=m; else capa.insertAdjacentHTML('afterbegin',m);
    }
    montes();
    var tmM=null; window.addEventListener('resize',function(){ if(!capa.isConnected) return; clearTimeout(tmM); tmM=setTimeout(montes,250); });

    // la casita de Navidad a lo lejos: cada día más cerca y con más ventanas encendidas
    var prog=(Math.min(d,24)-1)/23, k=.55+prog*.75, nv=Math.round(1+prog*5);
    var vs=[[-14,-6],[8,-6],[-14,6],[8,6],[-3,-17]];
    var kc=k*Math.min(1.7,Math.max(1,(window.innerWidth||412)/560));
    capa.insertAdjacentHTML('beforeend','<svg class="nv-casita" viewBox="-40 -50 80 80" style="width:'+Math.round(64*kc)+'px;height:'+Math.round(64*kc)+'px"><defs><radialGradient id="nvHalo"><stop offset="0" stop-color="#ffcf70" stop-opacity="'+(.35+prog*.4).toFixed(2)+'"/><stop offset="1" stop-color="#ffcf70" stop-opacity="0"/></radialGradient></defs>'+
      '<circle r="38" cy="-4" fill="url(#nvHalo)"/><path d="M14 -30 V-18 H20 V-26Z" fill="#7a3a22"/><g class="nv-humo"><circle cx="17" cy="-34" r="3" fill="#fff" opacity=".5"/><circle cx="19" cy="-41" r="4" fill="#fff" opacity=".35"/></g>'+
      '<rect x="-22" y="-12" width="44" height="30" fill="#c4152c"/><path d="M-28 -10 L0 -32 L28 -10Z" fill="#fff"/>'+
      vs.map(function(v,i){ return '<rect x="'+v[0]+'" y="'+v[1]+'" width="7" height="7" rx="1" fill="'+(i<nv?'#ffd27a':'#4a1820')+'"/>'; }).join('')+
      '<rect x="-4" y="6" width="8" height="12" rx="1" fill="'+(nv>=6?'#ffd27a':'#3a1a1a')+'"/><path d="M-22 18 H22" stroke="#fff" stroke-width="3"/>'+
      '<g fill="#ffd36b">'+[-20,-10,0,10,20].map(function(x){ return '<circle cx="'+x+'" cy="-12" r="1.4"/>'; }).join('')+'</g></svg>');

    // cordón de foquitos congelados: prenden más cada día; el 17 todos
    var cols=['#e3263c','#e3263c','#f2c45a','#e3263c','#2bb38a','#e3263c'];
    function curva(t,x0,x1,y0,y1,c){ var mx=(x0+x1)/2, my=(y0+y1)/2+c; return [(1-t)*(1-t)*x0+2*(1-t)*t*mx+t*t*x1,(1-t)*(1-t)*y0+2*(1-t)*t*my+t*t*y1]; }
    function focos(){
    // ancho del dibujo = ancho real del cordón en pantalla, a la escala de su alto: los focos nunca se deforman
    var hc=120, viejo=capa.querySelector('.nv-focos');
    if(viejo){ hc=viejo.getBoundingClientRect().height||hc; viejo.remove(); }
    else { var pr=document.createElement('div'); pr.className='nv-focos'; pr.style.visibility='hidden'; capa.appendChild(pr); hc=pr.getBoundingClientRect().height||hc; pr.remove(); }
    var Wf=Math.round(((window.innerWidth||412)+20)*120/hc), nT=Math.max(2,Math.round(Wf/225)), anT=Wf/nT, tramos=[];
    for(var it=0;it<nT;it++) tramos.push([it*anT-(it?0:10),(it+1)*anT+(it===nT-1?10:0),it%2?22:14,it%2?14:22,58]);
    var g='<svg class="nv-focos" viewBox="0 0 '+Wf+' 120" preserveAspectRatio="none"><defs><filter id="nvBrillo" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'+
      '<linearGradient id="nvEsc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#cdeefc" stop-opacity=".55"/></linearGradient></defs>';
    tramos.forEach(function(tr){ var mx=(tr[0]+tr[1])/2, my=(tr[2]+tr[3])/2+tr[4];
      g+='<path d="M'+tr[0]+' '+tr[2]+' Q'+mx+' '+my+' '+tr[1]+' '+tr[3]+'" stroke="#2a3a4a" stroke-width="1.6" fill="none"/>'+
         '<path d="M'+tr[0]+' '+(tr[2]-1.5)+' Q'+mx+' '+(my-1.5)+' '+tr[1]+' '+(tr[3]-1.5)+'" stroke="url(#nvEsc)" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".9"/>';
      for(var i=1;i<18;i++){ var p=curva(i/18,tr[0],tr[1],tr[2],tr[3],tr[4]), L=4+((i*37)%9)*(1-avance*.6); g+='<path d="M'+(p[0]-2).toFixed(1)+' '+p[1].toFixed(1)+' L'+(p[0]+2).toFixed(1)+' '+p[1].toFixed(1)+' L'+p[0].toFixed(1)+' '+(p[1]+L).toFixed(1)+'Z" fill="#e8f8ff" opacity=".85"/>'; } });
    var n=0, total=nT*11, prenden=prendenTodos?total:Math.round(total*avance*.8), orden=[];
    for(i=0;i<total;i++) orden.push(i); orden.sort(function(a,b){ return ((a*7)%total)-((b*7)%total); });
    var on={}; orden.slice(0,prenden).forEach(function(i){ on[i]=1; });
    tramos.forEach(function(tr){ for(var i=1;i<12;i++){ var p=curva(i/12,tr[0],tr[1],tr[2],tr[3],tr[4]), col=cols[n%cols.length], e=!!on[n];
      g+='<g class="nv-fq '+(e?'on':'off')+'" transform="translate('+p[0].toFixed(1)+' '+(p[1]+2).toFixed(1)+') rotate('+(((n*29)%30)-15)+')"><rect x="-3" y="-1" width="6" height="5" rx="1" fill="#5a6a7a"/>'+
        '<path class="vid" d="M0 3 C-6 5 -6 15 0 18 C6 15 6 5 0 3Z" fill="'+col+'" '+(e?'filter="url(#nvBrillo)"':'opacity=".55"')+'/>'+
        (e?'':'<path d="M-4.4 7 C-4 5 4 5 4.4 7 C4 11 -4 11 -4.4 7Z" fill="url(#nvEsc)"/><path d="M0 3 C-6 5 -6 15 0 18 C6 15 6 5 0 3Z" fill="#dff4ff" opacity=".35"/>')+
        '<ellipse cx="-1.6" cy="8" rx="1.1" ry="2.2" fill="#fff" opacity=".6"/></g>'; n++; } });
    capa.insertAdjacentHTML('beforeend',g+'</svg>');
    }
    focos();
    var tmF=null; window.addEventListener('resize',function(){ if(!capa.isConnected) return; clearTimeout(tmF); tmF=setTimeout(focos,250); });
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
    hieloCampos(btn);
  }
  // «Congelado»: los campos y el botón empiezan cubiertos de hielo; cada campo se descongela al llenarlo
  // y el botón se libera con el usuario y el PIN (4+) completos. Estilos en navidad.css.
  function hieloCampos(btn){
    var u=document.getElementById('loginUser'), pin=document.getElementById('loginPin'), ls=document.getElementById('loginScreen');
    if(!u||!pin||!btn) return;
    btn.insertAdjacentHTML('afterbegin','<span class="nv-extra nv-hielo-btn" aria-hidden="true"></span>');
    revisarHielo();
    if(hieloListo) return; hieloListo=true;
    ['input','change'].forEach(function(t){ u.addEventListener(t,revisarHielo); pin.addEventListener(t,revisarHielo); });
    // al volver al login (cerrar sesión limpia los campos sin evento) y por el autollenado del navegador
    if(ls) new MutationObserver(function(){ if(ls.classList.contains('active')){ revisarHielo(); setTimeout(revisarHielo,600); } }).observe(ls,{attributes:true,attributeFilter:['class']});
    setTimeout(revisarHielo,800);
  }
  function revisarHielo(){
    var u=document.getElementById('loginUser'), pin=document.getElementById('loginPin'), btn=$('#loginScreen .btn-login');
    if(!u||!pin||!btn) return;
    var pre=armada==='pre'||!!btn.querySelector('.nv-hielo-btn'), uOk=pre&&!!u.value.trim(), pOk=pre&&pin.value.length>=4;
    var wu=u.closest('.lg-wrap'), wp=pin.closest('.lg-wrap');
    if(wu) wu.classList.toggle('nv-deshielo',uOk); if(wp) wp.classList.toggle('nv-deshielo',pOk);
    btn.classList.toggle('nv-libre',uOk&&pOk);
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
      new MutationObserver(function(){
        // Navidad en casa: Santa se asoma por detrás de la tarjeta y niega con la mano (js/navidad-casa-marcaje.js)
        if(armada==='casa'){ var mm=al.querySelector('.mk-av.mal:not(.nvc-ok)'); if(mm){ mm.classList.add('nvc-ok'); if(window.__nvSantaLogin) window.__nvSantaLogin.error($('#loginScreen .login-form')); } return; }
        if(!enPre()) return;
        al.querySelectorAll('.mk-av:not(.nv-ok)').forEach(function(m){ m.classList.add('nv-ok'); m.insertAdjacentHTML('beforeend','<div class="nv-helada">'+escarcha(92,64,31).replace('xMinYMin','xMaxYMin')+'</div>'); var h=m.querySelector('.nv-helada svg'); if(h) h.style.transform='scaleX(-1)'; });
        if(al.querySelector('.mk-av.mal')) falla(); }).observe(al,{childList:true});
      var antes=ls.classList.contains('active');
      new MutationObserver(function(){ var ahora=ls.classList.contains('active');
        if(antes&&!ahora&&(enPre()||armada==='casa')&&!reducido){ var m=document.getElementById('maintenanceScreen'); if(!(m&&m.classList.contains('active'))){
          if(armada==='casa'){ if(window.__nvSantaLogin) window.__nvSantaLogin.bienvenida(nombreSesion()); }   // Santa saluda desde la esquina
          else bienvenida(); } }
        antes=ahora; }).observe(ls,{attributes:true,attributeFilter:['class']});
    }
    // primer nombre de quien acaba de entrar (de la sesión); si no, el del usuario recordado
    function nombreSesion(){ try{ var m=JSON.parse(localStorage.getItem('innova_session')||'null'); var t=((m&&(m.nombre||m.username))||'').trim().split(/[\s.]+/)[0].replace(/[^a-záéíóúñü]/gi,''); if(t) return t.charAt(0).toUpperCase()+t.slice(1).toLowerCase(); }catch(e){} return nombre(); }
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
    // la escena «El árbol» vive en js/navidad-casa.js (canvas, se acomoda al logo, la tarjeta y la mascota)
    if(window.__nvCasa) bucle=window.__nvCasa(capa);
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
    var coh=[], chis=[], flash=0, prox=0, ultimoAviso=0;
    var PAL=[['#ff3d6e','#ffd1dc'],['#ffb02e','#fff0c9'],['#3ee08f','#d9ffe9'],['#3fb6ff','#e0f3ff'],['#b05cff','#efdcff'],['#ffe14a','#ffffff']];
    function lanzar(tx,ty){ var t=bucle&&bucle.tam(); if(!t||!t[0]) return; var W=t[0],H=t[1];
      var x0=tx!=null?tx+R(-30,30):(Math.random()<.5?R(W*.06,W*.3):R(W*.7,W*.94)), dest=ty!=null?ty:R(H*.1,H*.42), vy=-Math.sqrt(2*.06*Math.max(60,H-150-dest));
      coh.push({x:x0,y:H-150,vx:tx!=null?(tx-x0)/(Math.abs(vy)/.06):R(-.4,.4),vy:vy,col:PAL[(Math.random()*PAL.length)|0],cola:[],tipo:(Math.random()*4)|0}); }
    function estalla(k){
      var ahora=performance.now();
      if(ahora-ultimoAviso>6000&&ls.classList.contains('active')){ultimoAviso=ahora;var b=capa.getBoundingClientRect();ls.dispatchEvent(new CustomEvent('navidad:entorno',{detail:{kind:'destello',x:b.left+k.x,y:b.top+k.y}}));}
      for(var i=0;i<80;i++){ var a=i/80*6.283, s=k.tipo===0?R(.6,3.4):k.tipo===1?3:k.tipo===2?R(1,2.4):2.6;
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
    capa.className='nv-capa nv-'+et.id; if(et.id!=='casa') capa.setAttribute('aria-hidden','true');
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
