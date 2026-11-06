// ── Pre-Navidad dentro de la app: «Cristal escarchado» ──
// Carámbanos bajo la barra de arriba (de los largos cae una gota de vez en cuando), aurora boreal en los
// encabezados y escarcha que crece desde las esquinas de las tarjetas y de los cuadros del panel.
// Además «Responde al toque» (escarcha donde tocas, botones con nieve, soplo de copos en las pestañas, foquitos que se mecen).
// Solo con html.nav-pre. Los dibujos de escarcha se generan una vez y se pasan al CSS como variables
// (--nvd-e1…); el CSS (css/temas/navidad.css, «Cristal escarchado») decide dónde van. Al salir del tema se quita todo.
(function(){
  'use strict';
  var R=function(a,b){ return a+Math.random()*(b-a); };
  var HEROES='.page-header,.dash-hero,.rg-hero,.pg-hero,.ps-hero';
  var listo=false, vars=null, carSVG=null, auHTML=null, pend=0, n=0;
  // cada copia lleva sus propios id: un degradado definido dentro de una pantalla oculta no se pinta en otra
  function propio(html){ n++; return html.replace(/nvd([AG]\d?)/g,'nvd$1_'+n); }

  function svgUrl(s){ return 'url("data:image/svg+xml,'+encodeURIComponent(s)+'")'; }
  // helecho de escarcha: una rama con ramitas a los lados que a su vez se abren
  function helecho(x,y,ang,len,dep,o){
    var x2=x+Math.cos(ang)*len, y2=y+Math.sin(ang)*len;
    o.push('<path d="M'+x.toFixed(1)+' '+y.toFixed(1)+'L'+x2.toFixed(1)+' '+y2.toFixed(1)+'" stroke-width="'+(dep*.45+.5).toFixed(2)+'"/>');
    if(dep<=0){ if(Math.random()<.5) o.push('<circle cx="'+x2.toFixed(1)+'" cy="'+y2.toFixed(1)+'" r="'+R(.8,1.5).toFixed(1)+'" fill="#fff" stroke="none"/>'); return; }
    var n=Math.round(len/7);
    for(var i=1;i<=n;i++){ var t=i/(n+1), px=x+(x2-x)*t, py=y+(y2-y)*t, l=len*R(.25,.42)*(1-t*.5);
      helecho(px,py,ang-R(.8,1.1),l,dep-1,o); helecho(px,py,ang+R(.8,1.1),l,dep-1,o); }
    helecho(x2,y2,ang+R(-.3,.3),len*.45,dep-1,o);
  }
  // esquina de escarcha (sale de la esquina superior izquierda; el CSS la gira para las otras)
  function esquina(tam,col,op,giro){
    var o=[], k=3+(Math.random()*2|0);
    for(var i=0;i<k;i++) helecho(0,0,R(.05,1.5),tam*R(.45,.8),2,o);
    var tr=giro==='br'?'rotate(180 '+tam/2+' '+tam/2+')':giro==='tr'?'translate('+tam+' 0) scale(-1 1)':'';
    return svgUrl("<svg xmlns='http://www.w3.org/2000/svg' width='"+tam+"' height='"+tam+"'><g transform='"+tr+"' opacity='"+op+"' fill='none' stroke='"+col+"' stroke-linecap='round'>"+o.join('').replace(/"/g,"'")+'</g></svg>');
  }
  function carambanos(){
    var w=1600, x=-2, s='', g='', k=0;
    while(x<w){ var ww=R(5,10), L=Math.random()<.2?R(16,22):R(6,13);
      s+='<path d="M'+x.toFixed(1)+' 0L'+(x+ww).toFixed(1)+' 0Q'+(x+ww*.62).toFixed(1)+' '+(L*.55).toFixed(1)+' '+(x+ww*.52).toFixed(1)+' '+L.toFixed(1)+'Q'+(x+ww*.45).toFixed(1)+' '+(L+1).toFixed(1)+' '+(x+ww*.4).toFixed(1)+' '+(L*.6).toFixed(1)+'Q'+(x+ww*.2).toFixed(1)+' '+(L*.3).toFixed(1)+' '+x.toFixed(1)+' 0Z" fill="url(#nvdG)" stroke="#9cc9e8" stroke-width=".6"/>'+
         '<path d="M'+(x+ww*.3).toFixed(1)+' 1Q'+(x+ww*.4).toFixed(1)+' '+(L*.4).toFixed(1)+' '+(x+ww*.48).toFixed(1)+' '+(L*.8).toFixed(1)+'" stroke="#fff" stroke-width=".9" fill="none" opacity=".9"/>';
      if(L>16&&k<40){ g+='<circle class="nvd-gota" cx="'+(x+ww*.5).toFixed(1)+'" cy="'+(L+2).toFixed(1)+'" r="1.7" style="animation-delay:'+R(0,6).toFixed(1)+'s"/>'; k++; }
      x+=ww+R(-1,4); }
    return '<svg width="'+w+'" height="60" viewBox="0 0 '+w+' 60" aria-hidden="true"><defs><linearGradient id="nvdG" x1="0" x2="1"><stop offset="0" stop-color="#cbe6f7"/><stop offset=".5" stop-color="#f4fbff"/><stop offset="1" stop-color="#a9d2ee"/></linearGradient></defs><path d="M0 0H'+w+'V3Q'+w/2+' 5 0 3Z" fill="#e8f5fd"/>'+s+g+'</svg>';
  }
  function aurora(){
    var e='';
    for(var i=0;i<16;i++) e+='<i style="left:'+R(2,98).toFixed(1)+'%;top:'+R(4,60).toFixed(1)+'%;animation-delay:'+R(0,4).toFixed(1)+'s;transform:scale('+R(.5,1.2).toFixed(2)+')"></i>';
    var g='<defs><linearGradient id="nvdA1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2ee59d" stop-opacity="0"/><stop offset=".55" stop-color="#2ee59d" stop-opacity=".55"/><stop offset="1" stop-color="#2ee59d" stop-opacity="0"/></linearGradient>'+
          '<linearGradient id="nvdA2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4cc3ff" stop-opacity="0"/><stop offset=".5" stop-color="#7a8cff" stop-opacity=".45"/><stop offset="1" stop-color="#ff7ad9" stop-opacity="0"/></linearGradient></defs>';
    return '<svg class="b1" viewBox="0 0 800 160" preserveAspectRatio="none">'+g+'<path d="M0 70C100 20 200 110 300 60S500 10 600 60S800 110 800 60V110C700 150 600 80 500 110S300 160 200 110S0 120 0 110Z" fill="url(#nvdA1)"/></svg>'+
           '<svg class="b2" viewBox="0 0 800 160" preserveAspectRatio="none"><path d="M0 40C120 80 220 0 340 40S560 90 680 30S800 50 800 50V80C700 70 600 120 480 80S240 30 120 80S0 70 0 70Z" fill="url(#nvdA2)"/></svg>'+e;
  }

  function armar(){
    if(!vars){
      vars={};
      for(var i=1;i<=3;i++){ vars['--nvd-e'+i]=esquina(Math.round(R(100,125)),'#8fc0e4',1,'tl'); vars['--nvd-f'+i]=esquina(Math.round(R(75,95)),'#8fc0e4',.85,'br'); }
      vars['--nvd-b1']=esquina(80,'#ffffff',.6,'tr'); vars['--nvd-b2']=esquina(80,'#ffffff',.6,'tr');
      carSVG=carambanos(); auHTML=aurora();
    }
    var st=document.documentElement.style; for(var k in vars) st.setProperty(k,vars[k]);
    listo=true; decorar();
  }
  function decorar(){
    document.querySelectorAll('.topbar').forEach(function(b){ if(!b.querySelector(':scope>.nvd-car')){ var d=document.createElement('div'); d.className='nvd-car'; d.setAttribute('aria-hidden','true'); d.innerHTML=propio(carSVG); b.appendChild(d); } });
    document.querySelectorAll(HEROES).forEach(function(h){ if(!h.querySelector(':scope>.nvd-au')){ var d=document.createElement('div'); d.className='nvd-au'; d.setAttribute('aria-hidden','true'); d.innerHTML=propio(auHTML); h.classList.add('nvd-hero'); h.insertBefore(d,h.firstChild); } });
  }
  function quitar(){
    document.querySelectorAll('.nvd-car,.nvd-au').forEach(function(e){ e.remove(); });
    document.querySelectorAll('.nvd-hero').forEach(function(e){ e.classList.remove('nvd-hero'); });
    if(vars){ var st=document.documentElement.style; for(var k in vars) st.removeProperty(k); }
    if(lz){ lz.remove(); lz=null; cx=null; efectos=[]; parts=[]; if(corre){ cancelAnimationFrame(corre); corre=0; } }
    listo=false;
  }
  function revisar(){ pend=0; var on=document.documentElement.classList.contains('nav-pre');
    if(on&&!listo) armar(); else if(on) decorar(); else if(listo) quitar(); }
  function pronto(){ if(!pend) pend=setTimeout(revisar,250); }

  /* ── «Responde al toque» ──
     Tocar una tarjeta hace florecer escarcha donde tocas (se derrite en ~2 s); los botones de acción se hunden y
     sueltan migajas de nieve; al cambiar de pestaña sale un soplo de copos; al deslizar, los foquitos del cordón del
     encabezado se mecen. Un solo lienzo que solo dibuja mientras hay algo animándose (en reposo no gasta nada).
     Con movimiento reducido no hace nada. */
  var reducido=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  var TARJ='.fx-card,.mk3,.nvp-adv,#dashAsistCard,.rban,.dtile', BOT='.mk3-btn,.fx-save,.btn-p';
  var lz=null, cx=null, efectos=[], parts=[], corre=0, prevT=0;
  function activo(){ return !reducido&&document.documentElement.classList.contains('nav-pre'); }
  function lienzo(){
    var D=Math.min(2,window.devicePixelRatio||1), W=innerWidth, H=innerHeight;
    if(!lz){ lz=document.createElement('canvas'); lz.className='nvd-toque'; lz.setAttribute('aria-hidden','true'); document.body.appendChild(lz); cx=lz.getContext('2d'); }
    if(lz.width!==Math.round(W*D)||lz.height!==Math.round(H*D)){ lz.width=Math.round(W*D); lz.height=Math.round(H*D); }
    cx.setTransform(D,0,0,D,0,0);
  }
  function arrancar(){ if(corre) return; lienzo(); prevT=performance.now(); corre=requestAnimationFrame(cuadro); }
  function cuadro(n){
    var dt=Math.min(.05,(n-prevT)/1000); prevT=n; cx.clearRect(0,0,innerWidth,innerHeight);
    for(var i=efectos.length-1;i>=0;i--) if(efectos[i](n)===false) efectos.splice(i,1);
    for(i=parts.length-1;i>=0;i--){ var p=parts[i]; p.vida-=dt; if(p.vida<=0){ parts.splice(i,1); continue; }
      p.vy+=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; cx.globalAlpha=Math.min(1,p.vida/p.v0)*.95; cx.fillStyle=p.c; cx.beginPath(); cx.arc(p.x,p.y,p.r,0,6.283); cx.fill(); }
    cx.globalAlpha=1;
    if(efectos.length||parts.length) corre=requestAnimationFrame(cuadro); else { corre=0; cx.clearRect(0,0,innerWidth,innerHeight); }
  }
  // escarcha que florece desde el punto tocado: 6–7 ramas con ramitas que crecen, se quedan y se derriten
  function florece(px,py,blanca){
    var tam=blanca?38:48, col=blanca?'#ffffff':'#8fc0e4', ramas=[], n=6+(Math.random()*2|0), a0=Math.random();
    function rama(x0,y0,ang,len,dep,d0){ var x1=x0+Math.cos(ang)*len, y1=y0+Math.sin(ang)*len; ramas.push([x0,y0,x1,y1,dep*.55+.5,d0,d0+len]);
      if(dep<=0) return; var k=Math.round(len/9); for(var i=1;i<=k;i++){ var u=i/(k+1), bx=x0+(x1-x0)*u, by=y0+(y1-y0)*u, l=len*R(.28,.4)*(1-u*.4);
        rama(bx,by,ang-R(.9,1.1),l,dep-1,d0+len*u); rama(bx,by,ang+R(.9,1.1),l,dep-1,d0+len*u); } }
    for(var i=0;i<n;i++) rama(px,py,a0+i/n*6.283+R(-.15,.15),tam*R(.7,1),2,0);
    var t1=performance.now();
    efectos.push(function(now){ var t=Math.max(0,(now-t1)/1000), crece=(1-Math.pow(1-Math.min(1,t/.7),3))*tam*1.05, al=1-Math.max(0,Math.min(1,(t-1.5)/.9)); if(al<=0) return false;
      cx.save(); cx.globalAlpha=al; cx.lineCap='round'; cx.strokeStyle=col;
      var g=cx.createRadialGradient(px,py,0,px,py,tam*.9); g.addColorStop(0,blanca?'rgba(255,255,255,.28)':'rgba(190,225,248,.35)'); g.addColorStop(1,'rgba(255,255,255,0)'); cx.fillStyle=g; cx.beginPath(); cx.arc(px,py,crece*.9,0,6.283); cx.fill();
      for(var j=0;j<ramas.length;j++){ var r=ramas[j]; if(crece<=r[5]) continue; var u=Math.min(1,(crece-r[5])/(r[6]-r[5])); cx.lineWidth=r[4]; cx.beginPath(); cx.moveTo(r[0],r[1]); cx.lineTo(r[0]+(r[2]-r[0])*u,r[1]+(r[3]-r[1])*u); cx.stroke(); }
      cx.restore(); });
    arrancar();
  }
  function migas(b){ var r=b.getBoundingClientRect();
    if(b.animate) b.animate([{transform:'scale(1)'},{transform:'scale(.95,.9)',offset:.35},{transform:'scale(1.02,1.03)',offset:.7},{transform:'scale(1)'}],{duration:420,easing:'ease-out'});
    for(var i=0;i<20;i++) parts.push({x:R(r.left+8,r.right-8),y:r.top+R(-2,3),vx:R(-14,14),vy:R(-50,-10),g:260,r:R(1,2.4),c:'#fff',vida:R(.7,1.2),v0:1.2});
    arrancar(); }
  function soplo(t){ var r=t.getBoundingClientRect(); if(!r.width) return;
    for(var i=0;i<24;i++){ var a=R(-3,-.1); parts.push({x:r.left+r.width/2+R(-r.width/3,r.width/3),y:r.bottom-4,vx:Math.cos(a)*R(30,90),vy:Math.sin(a)*R(20,70),g:40,r:R(1,2.2),c:i%3?'#ffffff':'#bfe3f7',vida:R(.6,1.1),v0:1.1}); }
    arrancar(); }
  document.addEventListener('click',function(e){
    if(!activo()||!e.isTrusted||e.detail===0) return;          // solo toques reales (no Enter del teclado)
    var t=e.target; if(!t||!t.closest) return;
    var tab=t.closest('#employeeScreen .tab,#adminScreen .tab');
    if(tab){ setTimeout(function(){ soplo(document.querySelector('#employeeScreen.active .tab.active,#adminScreen.active .tab.active')||tab); },60); return; }
    var b=t.closest(BOT); if(b&&!b.disabled&&b.closest('#employeeScreen,#adminScreen')){ migas(b); return; }
    if(t.closest('input,textarea,select,[contenteditable],a')) return;   // escribir o abrir enlaces sin adornos
    var c=t.closest(TARJ); if(c) florece(e.clientX,e.clientY,c.classList.contains('dtile'));
  },true);
  // foquitos del cordón del encabezado que se mecen al deslizar (resorte con amortiguación; se detiene solo)
  var focos=[], empuje=0, meceRaf=0, mPrev=0, ultScroll=new WeakMap();
  function focosVivos(){
    var gs=document.querySelectorAll('#empReg .nvp-foq .nvp-f'); if(!gs.length) return [];
    if(focos.length&&focos[0].g===gs[0]&&focos[0].g.isConnected) return focos;
    focos=[].map.call(gs,function(g,i){ var w=g.querySelector(':scope>.nvd-mece'); if(!w){ w=document.createElementNS('http://www.w3.org/2000/svg','g'); w.setAttribute('class','nvd-mece'); while(g.firstChild) w.appendChild(g.firstChild); g.appendChild(w); } return {g:g,w:w,a:0,v:0,k:1+(i%5)*.08}; });
    return focos;
  }
  function mece(n){ var dt=Math.min(.05,(n-mPrev)/1000); mPrev=n; var energia=0;
    focos.forEach(function(f,i){ f.v+=(-f.a*38*f.k-f.v*2.6+empuje*(1+(i%3)*.2))*dt; f.a+=f.v*dt; energia+=Math.abs(f.a)+Math.abs(f.v)*.1; f.w.setAttribute('transform','rotate('+f.a.toFixed(2)+')'); });
    empuje*=Math.pow(.02,dt);
    if(energia>focos.length*.05||Math.abs(empuje)>1) meceRaf=requestAnimationFrame(mece); else { focos.forEach(function(f){ f.a=f.v=0; f.w.removeAttribute('transform'); }); meceRaf=0; } }
  document.addEventListener('scroll',function(e){
    if(!activo()) return; var el=e.target===document?document.scrollingElement:e.target; if(!el||el.scrollTop===undefined) return;
    var antes=ultScroll.has(el)?ultScroll.get(el):el.scrollTop; ultScroll.set(el,el.scrollTop); var d=el.scrollTop-antes; if(!d) return;
    if(!focosVivos().length) return;
    empuje+=Math.max(-90,Math.min(90,d*6));
    if(!meceRaf){ mPrev=performance.now(); meceRaf=requestAnimationFrame(mece); }
  },{capture:true,passive:true});
  function iniciar(){
    new MutationObserver(revisar).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    // las pantallas se vuelven a pintar (encabezados nuevos): se revisa con calma, no en cada cambio
    new MutationObserver(function(){ if(listo) pronto(); }).observe(document.body,{childList:true,subtree:true});
    revisar();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar); else iniciar();
})();
