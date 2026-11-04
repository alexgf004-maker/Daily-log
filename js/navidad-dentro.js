// ── Pre-Navidad dentro de la app: «Cristal escarchado» ──
// Carámbanos bajo la barra de arriba (de los largos cae una gota de vez en cuando), aurora boreal en los
// encabezados y escarcha que crece desde las esquinas de las tarjetas y de los cuadros del panel.
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
    listo=false;
  }
  function revisar(){ pend=0; var on=document.documentElement.classList.contains('nav-pre');
    if(on&&!listo) armar(); else if(on) decorar(); else if(listo) quitar(); }
  function pronto(){ if(!pend) pend=setTimeout(revisar,250); }
  function iniciar(){
    new MutationObserver(revisar).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    // las pantallas se vuelven a pintar (encabezados nuevos): se revisa con calma, no en cada cambio
    new MutationObserver(function(){ if(listo) pronto(); }).observe(document.body,{childList:true,subtree:true});
    revisar();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar); else iniciar();
})();
