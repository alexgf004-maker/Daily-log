// ── Navidad en casa (22–27 dic) dentro de la app: «Noche en la casita» ──
// Sigue la escena del login: detrás de las pantallas de adentro está la misma noche (aurora, luna, montañas nevadas,
// la casita roja con luces, el árbol grande y el plato de galletas con leche que le dejamos a Santa en la nieve).
// Cada 40–70 s Santa y sus renos cruzan la pantalla con una estela dorada (por encima del contenido y debajo de la
// barra de arriba, sin bloquear los toques; detrás de las tarjetas casi no se vería). Arriba del contenido cuelga el cordón
// de foquitos encendido; los encabezados llevan el gorrito de Santa y la botita con el nombre de quien entró.
// Solo con html.nav-casa. Usa el motor de dibujo de js/navidad-casa.js (window.__nvMotor).
// Rendimiento: el paisaje se pinta una vez (y al cambiar el tamaño o de pantalla) en un lienzo fijo; el lienzo vivo
// (luces del árbol, nieve y Santa) corre a ~30 cuadros por segundo solo con una pantalla de adentro a la vista y la app
// en primer plano. Con movimiento reducido se pinta una vez y queda quieto. Estilos en css/temas/navidad.css
// («Navidad en casa dentro de la app»). Al salir del tema se quita todo.
(function(){
  'use strict';
  var HEROES='.page-header,.dash-hero,.rg-hero,.pg-hero,.ps-hero';
  var reducido=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  // «Reposo»: tras 25 s sin tocar la pantalla (ni deslizar ni escribir), los fondos animados de adentro se detienen y
  // las animaciones decorativas se pausan (clase html.nv-reposo); al primer toque siguen. Así un celular que se queda
  // en la app abierta no gasta batería en nieve que nadie mira. Lo comparten js/navidad-dentro.js y
  // js/navidad-casa-dentro.js (el primero que carga lo crea); otros módulos pueden escucharlo con
  // window.__nvReposo.escuchar(function(quieto){…}).
  var Rp=window.__nvReposo||(window.__nvReposo=(function(){
    var ult=Date.now(), quieto=false, subs=[], ESPERA=25000;
    function avisar(){ document.documentElement.classList.toggle('nv-reposo',quieto); subs.forEach(function(f){ try{ f(quieto); }catch(e){} }); }
    function tocar(){ ult=Date.now(); if(quieto){ quieto=false; avisar(); } }
    ['pointerdown','keydown','wheel','touchstart','scroll'].forEach(function(ev){ document.addEventListener(ev,tocar,{capture:true,passive:true}); });
    document.addEventListener('visibilitychange',function(){ if(!document.hidden) tocar(); });
    setInterval(function(){ if(!quieto&&!document.hidden&&Date.now()-ult>ESPERA){ quieto=true; avisar(); } },2000);
    return {quieto:function(){ return quieto; }, escuchar:function(f){ subs.push(f); }};
  })());
  var n=0, listo=false, pend=0, noche=null;

  function activo(){ return document.documentElement.classList.contains('nav-casa'); }
  function pantallaAdentro(){ var a=document.querySelector('.screen.active'); return a&&(a.id==='employeeScreen'||a.id==='adminScreen')?a:null; }
  function nombre(){ try{ var m=JSON.parse(localStorage.getItem('innova_session')||'null'); var t=(m&&(m.nombre||m.username)||'').trim().split(/[\s.]+/)[0]; return t?t.charAt(0).toUpperCase()+t.slice(1).toLowerCase():''; }catch(e){ return ''; } }
  function esc(t){ return String(t).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  // cada copia con sus propios id: un degradado definido dentro de una pantalla oculta no se pinta en otra
  function propio(svg){ n++; return svg.replace(/id="(\w+)"/g,'id="$1_c'+n+'"').replace(/url\(#(\w+)\)/g,'url(#$1_c'+n+')'); }

  /* ── dibujos ── */
  function gorro(){ return propio('<svg viewBox="0 0 130 104" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>'+
    '<linearGradient id="gR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5466"/><stop offset=".5" stop-color="#d3172f"/><stop offset="1" stop-color="#7e0716"/></linearGradient>'+
    '<radialGradient id="gW" cx=".38" cy=".3" r=".9"><stop offset="0" stop-color="#fff"/><stop offset=".65" stop-color="#eef3f8"/><stop offset="1" stop-color="#bccbd9"/></radialGradient></defs>'+
    '<path d="M16 74C18 46 36 20 66 14c24-5 40 6 46 24-7-7-16-9-23-4 7 10 10 24 11 40z" fill="url(#gR)"/>'+
    '<path d="M66 16c-10 16-14 36-12 58" stroke="rgba(60,0,10,.18)" stroke-width="4" fill="none" stroke-linecap="round"/>'+
    '<path d="M40 30c8-8 20-12 30-12" stroke="rgba(255,255,255,.28)" stroke-width="3" fill="none" stroke-linecap="round"/>'+
    '<g fill="url(#gW)"><rect x="8" y="68" width="104" height="24" rx="12"/>'+[14,26,38,50,62,74,86,98,106].map(function(c,i){ return '<circle cx="'+c+'" cy="'+(i%2?69:91)+'" r="5"/>'; }).join('')+
    '<circle cx="112" cy="44" r="12"/><circle cx="104" cy="38" r="5"/><circle cx="120" cy="50" r="5"/></g>'+
    '<rect x="8" y="80" width="104" height="12" rx="6" fill="rgba(120,150,180,.18)"/></svg>'); }
  function bota(nom){ var t=esc(nom||'');
    return propio('<svg viewBox="0 0 84 126" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>'+
    '<linearGradient id="bR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f03a4f"/><stop offset=".55" stop-color="#c4152c"/><stop offset="1" stop-color="#7a0a18"/></linearGradient>'+
    '<radialGradient id="bW" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#eef3f8"/><stop offset="1" stop-color="#c3d1de"/></radialGradient>'+
    '<pattern id="bP" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 12L12 0" stroke="rgba(255,255,255,.14)" stroke-width="3"/></pattern></defs>'+
    '<path d="M30 4c-4 2-5 8-1 10" stroke="#c9952a" stroke-width="2.4" fill="none" stroke-linecap="round"/>'+
    '<path d="M14 32h44v44c0 6 3 10 9 12 12 5 15 20 4 28-11 8-28 7-41-4L14 96c-3-4-1-10 0-14z" fill="url(#bR)"/>'+
    '<path d="M14 32h44v44c0 6 3 10 9 12 12 5 15 20 4 28-11 8-28 7-41-4L14 96c-3-4-1-10 0-14z" fill="url(#bP)"/>'+
    '<g transform="translate(36 60)" stroke="#f2c45a" stroke-width="2.2" stroke-linecap="round"><path d="M0-9V9M-8-4.5L8 4.5M-8 4.5L8-4.5"/></g>'+
    '<rect x="6" y="10" width="60" height="28" rx="9" fill="url(#bW)"/>'+
    [12,22,32,42,52,60].map(function(c,i){ return '<circle cx="'+c+'" cy="'+(i%2?11:37)+'" r="4" fill="url(#bW)"/>'; }).join('')+
    '<g transform="translate(58 16)"><path d="M0 0c6-6 14-4 14 2-5-1-9 1-10 5C2 4 0 3 0 0z" fill="#2f9a62"/><path d="M0 0c-6-6-14-4-14 2 5-1 9 1 10 5C-2 4 0 3 0 0z" fill="#1f7a4f"/><circle cx="-2" cy="2" r="3" fill="#e3263c"/><circle cx="3" cy="3" r="3" fill="#c4152c"/></g>'+
    (t?'<text x="34" y="29" text-anchor="middle" font-family="\'Plus Jakarta Sans\',system-ui,sans-serif" font-weight="800" font-size="'+(t.length>7?9:t.length>5?10.5:12)+'" fill="#b3192d">'+t+'</text>':'')+'</svg>'); }
  var PLATO='<svg viewBox="0 0 150 96" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="v" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="rgba(220,235,250,.55)"/><stop offset=".5" stop-color="rgba(255,255,255,.95)"/><stop offset="1" stop-color="rgba(200,220,240,.6)"/></linearGradient>'+
    '<radialGradient id="g" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#e9b072"/><stop offset=".7" stop-color="#c47a3a"/><stop offset="1" stop-color="#8a4c1c"/></radialGradient></defs>'+
    '<ellipse cx="62" cy="80" rx="58" ry="13" fill="rgba(0,20,50,.22)"/><ellipse cx="62" cy="76" rx="56" ry="13" fill="#f7f9fc"/><ellipse cx="62" cy="75" rx="44" ry="9" fill="none" stroke="#2a6ad0" stroke-width="2" opacity=".55"/>'+
    '<ellipse cx="46" cy="70" rx="18" ry="7" fill="url(#g)"/><ellipse cx="46" cy="66" rx="18" ry="7" fill="url(#g)"/><g fill="#4a2410"><circle cx="40" cy="65" r="1.6"/><circle cx="50" cy="64" r="1.6"/><circle cx="46" cy="68" r="1.4"/></g>'+
    '<g transform="translate(66 46) rotate(12)"><path d="M10 0l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="#e9c27a" stroke="#a8741c" stroke-width="1"/><circle cx="10" cy="10" r="1.6" fill="#e3263c"/></g>'+
    '<rect x="104" y="18" width="30" height="62" rx="4" fill="url(#v)" stroke="rgba(150,180,210,.8)"/><rect x="106" y="30" width="26" height="48" rx="3" fill="#fbfdff"/><rect x="109" y="32" width="5" height="40" rx="2.5" fill="rgba(255,255,255,.9)"/><ellipse cx="119" cy="30" rx="13" ry="2.5" fill="#eef4fa"/></svg>';

  /* ── adornos del contenido: cordón de foquitos arriba y, en cada encabezado, gorrito y botita ── */
  function cordon(W){ var N=window.__nvMotor; if(!N||!N.cordonPre) return '';
    // clases propias: .nv-guirnalda/.nv-luz son del login (las usa la historia de la mascota)
    return N.cordonPre(W,34).replace('<svg ','<svg preserveAspectRatio="none" ').replace(/nv-guirnalda/g,'nvc-guirnalda').replace(/nv-luz/g,'nvc-luz'); }
  function decorar(){
    var nom=nombre();
    document.querySelectorAll('#employeeScreen .content,#adminScreen .content').forEach(function(c){
      if(!c.querySelector(':scope>.nvc-cordon')){ var d=document.createElement('div'); d.className='nvc-cordon'; d.innerHTML=cordon(Math.max(320,c.clientWidth||innerWidth)); c.insertBefore(d,c.firstChild); } });
    document.querySelectorAll(HEROES).forEach(function(h){
      if(h.querySelector(':scope>.nvc-gorro')&&h.getAttribute('data-nvc')===nom) return;
      h.querySelectorAll(':scope>.nvc-gorro,:scope>.nvc-bota').forEach(function(e){ e.remove(); });
      h.classList.add('nvc-hero'); h.setAttribute('data-nvc',nom);
      h.insertAdjacentHTML('beforeend','<span class="nvc-gorro" aria-hidden="true">'+gorro()+'</span><span class="nvc-bota" aria-hidden="true">'+bota(nom)+'</span>'); });
    verNoche();
  }
  function quitar(){
    document.querySelectorAll('.nvc-cordon,.nvc-gorro,.nvc-bota').forEach(function(e){ e.remove(); });
    document.querySelectorAll('.nvc-hero').forEach(function(h){ h.classList.remove('nvc-hero'); h.removeAttribute('data-nvc'); });
    quitarNoche();
  }
  function pronto(){ clearTimeout(pend); pend=setTimeout(function(){ if(activo()) decorar(); },120); }
  function revisar(){ if(activo()){ listo=true; decorar(); } else if(listo){ listo=false; quitar(); } }

  /* ── la noche de fondo ── */
  function composicion(){
    var W=innerWidth, H=innerHeight, a=pantallaAdentro(), lado=a&&a.id==='adminScreen'&&W>=900?236:0;
    var util=W-lado, margen=Math.max(0,(util-Math.min(util,960))/2);
    return {W:W,H:H,lado:lado,margen:margen,ancho:margen>=190};
  }
  function pintar(fx,K,C){
    var N=window.__nvMotor, W=K.W, H=K.H, suelo=H-(K.ancho?70:64), hz=H*(K.ancho?.58:.6);
    N.sem(211); N.cieloPre(fx,W,H,hz);
    // la luna
    var mx=K.ancho?K.lado+K.margen*.5:W*.3, my=hz-(K.ancho?120:70), mr=K.ancho?40:32;
    var g=fx.createRadialGradient(mx,my,6,mx,my,mr*2.8); g.addColorStop(0,'rgba(255,248,220,.5)'); g.addColorStop(1,'rgba(255,248,220,0)'); fx.fillStyle=g; fx.fillRect(mx-mr*3,my-mr*3,mr*6,mr*6);
    var m=fx.createRadialGradient(mx-mr*.25,my-mr*.25,3,mx,my,mr); m.addColorStop(0,'#fffdf2'); m.addColorStop(1,'#f0dca6'); fx.fillStyle=m; fx.beginPath(); fx.arc(mx,my,mr,0,N.P); fx.fill();
    fx.fillStyle='rgba(200,170,110,.18)'; [[-.3,-.1,.22],[.25,.2,.16],[.05,-.4,.12]].forEach(function(q){ fx.beginPath(); fx.arc(mx+q[0]*mr,my+q[1]*mr,q[2]*mr,0,N.P); fx.fill(); });
    N.montesPre(fx,W,hz+6,K.ancho?260:150); N.lagoPre(fx,W,hz,K.ancho?34:20);
    var pinos=K.ancho?[[.04,1.1],[.1,.8],[.3,.7],[.5,.6],[.7,.7],[.92,.9]]:[[.06,.75],[.42,.55],[.6,.62]];
    pinos.forEach(function(q){ N.pinoPre(fx,q[0]*W,hz+(K.ancho?26:16),q[1]); });
    var cx, cw; if(K.ancho){ cw=Math.min(240,K.margen*.8); cx=K.lado+K.margen*.5; } else { cw=Math.min(128,W*.31); cx=W*.27; }
    N.casitaPre(fx,cx,suelo+2,cw,C); N.nieveSuelo(fx,W,H,suelo);
    if(K.ancho){ var th=Math.min(H*.62,suelo-H*.22), tw=Math.min(K.margen*.92,th*.62), tx=W-K.margen*.5; N.arbol(fx,tx,suelo-th-2,th,tw,C,{pc:true,estilo:'clasico'}); }
    else { var top=H*.3, h=suelo-top-2; N.arbol(fx,W-14,top,h,h*.5,C,{pc:false,estilo:'clasico'}); }
    // el plato de galletas con leche para Santa, en la nieve junto a la casita
    var pw=K.ancho?100:92, px=K.ancho?Math.min(cx+cw*.3,K.lado+K.margen-pw-10):W*.47, img=new Image();
    img.onload=function(){ if(noche&&noche.fx===fx) fx.drawImage(img,px,suelo-pw*.3,pw,pw*.64); };
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(PLATO);
    return {mx:mx,my:my,hz:hz};
  }
  function armarNoche(){
    var N=window.__nvMotor, K=composicion(), D=Math.min(1.5,window.devicePixelRatio||1), firma=[K.W,K.H,K.lado].join('|');
    if(noche.firma===firma) return; noche.firma=firma;
    [noche.f,noche.s].forEach(function(c){ c.width=Math.round(K.W*D); c.height=Math.round(K.H*D); }); noche.v.width=K.W; noche.v.height=K.H;   // la capa viva (luces y nieve) a 1×
    var fx=noche.f.getContext('2d'); fx.setTransform(D,0,0,D,0,0); noche.fx=fx;
    var vx=noche.v.getContext('2d'); vx.setTransform(1,0,0,1,0,0); noche.vx=vx;
    var sx=noche.s.getContext('2d'); sx.setTransform(D,0,0,D,0,0); noche.sx=sx;
    var C={luces:[],chispas:[],anim:[],hits:[],W:K.W,H:K.H,pc:K.ancho};
    noche.p=pintar(fx,K,C); noche.C=C; noche.K=K;
    noche.copos=reducido?[]:N.copos(K.W,K.H,K.ancho?70:40);
    noche.santa=null; noche.sig=performance.now()/1000+(reducido?1e9:N.rr(8,16));
    N.vivo(vx,K.W,K.H,0,C.luces,noche.copos,C.chispas);
  }
  function corre(){ return noche&&noche.f.isConnected&&activo()&&!document.hidden&&!!pantallaAdentro()&&!Rp.quieto(); }
  function cuadro(ms){
    noche.raf=0; if(!corre()){ if(noche.santa){ noche.santa=null; noche.sx.clearRect(0,0,noche.K.W,noche.K.H); } return; }   // se reanuda con verNoche()
    noche.raf=requestAnimationFrame(cuadro);
    if(ms-noche.ult<32) return; noche.ult=ms;   // ~30 cuadros por segundo alcanzan para luces y nieve
    var N=window.__nvMotor, t=ms/1000, K=noche.K, vx=noche.vx;
    N.vivo(vx,K.W,K.H,t,noche.C.luces,noche.copos,noche.C.chispas);
    // Santa y sus renos cruzan la pantalla de vez en cuando, con una estela dorada (en su propio lienzo, encima)
    if(!noche.santa&&t>noche.sig){ noche.santa={t0:t,rastro:[],y0:K.H*N.rr(.3,.42)}; noche.sig=t+N.rr(40,70); }
    var S=noche.santa, sx=noche.sx; if(S){ var dur=K.ancho?10:7, u=(t-S.t0)/dur, s=K.ancho?.5:.38;
      sx.clearRect(0,0,K.W,K.H);
      if(u>1){ noche.santa=null; return; }
      var x=-170*s+(K.W+340*s)*u, y=S.y0-Math.sin(u*Math.PI)*(K.ancho?60:40);
      S.rastro.push([x-60*s,y+8*s,t]); while(S.rastro.length&&t-S.rastro[0][2]>1.2) S.rastro.shift();
      S.rastro.forEach(function(q){ var a=1-(t-q[2])/1.2; sx.fillStyle='rgba(255,205,90,'+(.75*a).toFixed(3)+')'; sx.beginPath(); sx.arc(q[0],q[1],1.6*a+.5,0,N.P); sx.fill(); });
      sx.save(); sx.shadowColor='rgba(255,236,190,.9)'; sx.shadowBlur=6; N.trineo(sx,x,y,s,t,'rgba(10,24,56,.94)'); sx.restore(); }
  }
  Rp.escuchar(function(q){ if(!q&&noche) verNoche(); });
  function verNoche(){
    if(!activo()||!window.__nvMotor) return;
    if(!noche){
      var f=document.createElement('canvas'), v=document.createElement('canvas'), sc=document.createElement('canvas');
      f.className='nvc-noche'; v.className='nvc-noche'; sc.className='nvc-santa'; [f,v,sc].forEach(function(c){ c.setAttribute('aria-hidden','true'); });
      document.body.appendChild(sc);
      document.body.insertBefore(v,document.body.firstChild); document.body.insertBefore(f,v);
      noche={f:f,v:v,s:sc,raf:0,ult:0,firma:''}; document.documentElement.classList.add('nvc-con-noche');
    }
    if(pantallaAdentro()) armarNoche();
    if(!reducido&&!noche.raf&&corre()) noche.raf=requestAnimationFrame(cuadro);
  }
  // para probar: que Santa cruce ya (consola: __nvcSanta())
  window.__nvcSanta=function(){ if(noche) noche.sig=0; };
  function quitarNoche(){ if(!noche) return; if(noche.raf) cancelAnimationFrame(noche.raf); noche.f.remove(); noche.v.remove(); noche.s.remove(); noche=null; document.documentElement.classList.remove('nvc-con-noche'); }
  var tm=0; window.addEventListener('resize',function(){ if(!noche) return; clearTimeout(tm); tm=setTimeout(verNoche,250); });
  document.addEventListener('visibilitychange',function(){ if(noche&&!document.hidden) verNoche(); });

  function iniciar(){
    new MutationObserver(revisar).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    // las pantallas se vuelven a pintar (encabezados nuevos) o se cambia de pantalla: se revisa con calma
    new MutationObserver(function(){ if(listo) pronto(); }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    revisar();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar); else iniciar();
})();
