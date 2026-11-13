// ── Navidad en casa (1–26 dic): «Todo se enciende» ──
// Lo que se usa a diario se ilumina con foquitos de colores según lo que hace la persona:
//   · pestañas del técnico: un foquito colgando sobre cada una; se enciende el de la pestaña abierta;
//   · «Mi marcaje» (técnico y admin): la barra entre entrada y salida es un cordón que se enciende conforme avanza la
//     jornada, de la hora de entrada a la salida oficial (data-ent / data-fin / data-sal en .mk3, puestos por index.html);
//     con la salida marcada queda todo encendido; antes de marcar, el primer foquito parpadea;
//   · Hoy / Ayer / Antier / Otra: un foquito arriba de cada uno; se enciende el del día elegido;
//   · títulos de las tarjetas: estrella (Mi marcaje), campana (Día), vela (Horario) y esfera (Actividades), apagadas
//     hasta que esa parte está lista; se encienden con un saltito;
//   · Actividades: el campo está rodeado de foquitos apagados que se encienden mientras se escribe (todos a los 90
//     caracteres; entonces titilan más rápido);
//   · Viático: la perilla del interruptor es un foquito;
//   · Guardar registro: cordón encima que se llena con lo escrito; al presionarlo las luces corren.
// En la admin:
//   · menú: en compu, un cordón vertical a la orilla de la barra lateral con un foquito por sección (en celular, foquitos
//     sobre las pestañas); se enciende el de la sección abierta y parpadea el de Pendientes/Observaciones si hay avisos;
//   · Dashboard: «cordón del equipo», un foquito por persona que debía marcar ese día; se enciende cuando marca;
//   · Pendientes: un foquito por cada pendiente del día; se encienden conforme se revisan (el total se guarda en la
//     sesión); sin nada por revisar, «¡Todo al día!» con todo encendido;
//   · Programación: un foquito por persona disponible; se enciende cuando queda en un grupo.
// Solo con html.nav-casa; al salir del tema se quita todo. No toca la mascota. Las luces son SVG con su brillo animado
// por CSS (opacidad): se pausan en reposo (html.nv-reposo) y con movimiento reducido quedan fijas.
// Estilos en css/temas/navidad.css («Navidad en casa · Todo se enciende»).
(function(){
  'use strict';
  var NS='http://www.w3.org/2000/svg';
  var COLS=['#ff3b4e','#ffc93a','#2fd17a','#3fb6ff','#ff7ad9'];
  var ICON={
    estrella:'<path d="M12 2.5 L14.6 9 L21.5 9.3 L16.1 13.6 L18 20.4 L12 16.5 L6 20.4 L7.9 13.6 L2.5 9.3 L9.4 9 Z"/>',
    campana:'<path d="M6 16 C6 9 7.5 5 12 5 C16.5 5 18 9 18 16 L20 18 H4 Z"/><circle cx="12" cy="20.2" r="1.8"/><path d="M12 2.5 V5" stroke-width="1.6"/>',
    esfera:'<rect x="10" y="2.5" width="4" height="3" rx=".8"/><circle cx="12" cy="13.5" r="8"/>',
    vela:'<rect x="9" y="10" width="6" height="11" rx="1"/><path d="M12 3 C14 6 14 8 12 9 C10 8 10 6 12 3Z"/>'
  };
  var META=90, nCapa=0, listo=false, pend=0;
  function activo(){ return document.documentElement.classList.contains('nav-casa'); }
  function pantalla(){ var a=document.querySelector('.screen.active'); return a&&(a.id==='employeeScreen'||a.id==='adminScreen')?a:null; }
  // la capa se posiciona contra su contenedor: solo se le pone position:relative si no tiene posición propia
  function fijar(h){ if(!h.classList.contains('lz-host')&&getComputedStyle(h).position==='static') h.classList.add('lz-host'); }
  function el(n,a,p){ var e=document.createElementNS(NS,n); for(var k in a) e.setAttribute(k,a[k]); if(p) p.appendChild(e); return e; }

  // capa SVG encima de un elemento (cada capa con sus propios degradados: uno definido en una pantalla oculta no se pinta)
  function capa(host,cual,w,h){
    fijar(host); var s=host.querySelector(':scope>svg.lz-capa'); if(s) s.remove();
    s=el('svg',{'class':'lz-capa lz-'+cual,'aria-hidden':'true',viewBox:'0 0 '+w+' '+h}); host.appendChild(s);
    var d=el('defs',{},s), id='lz'+(++nCapa)+'_';
    COLS.forEach(function(c,i){ var r=el('radialGradient',{id:id+i},d); el('stop',{offset:0,'stop-color':c,'stop-opacity':.85},r); el('stop',{offset:1,'stop-color':c,'stop-opacity':0},r); });
    s._id=id; return s;
  }
  // un foquito en (x,y) colgando hacia el ángulo a (grados; 0 = hacia abajo), escala k; i elige el color
  function luz(svg,x,y,a,k,i){
    var g=el('g',{'class':'lz',transform:'translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+a+') scale('+k+')'},svg), c=i%COLS.length;
    g.style.setProperty('--c',COLS[c]); g.style.setProperty('--d',(-((i*3)%8)*0.3).toFixed(1)+'s');   // fases en múltiplos de 0.3 s: con steps() todas cambian a la vez
    el('circle',{'class':'halo',cx:0,cy:9,r:12,fill:'url(#'+svg._id+c+')'},g);
    el('rect',{x:-3,y:-2,width:6,height:5,rx:1,fill:'#4d5966'},g);
    el('path',{'class':'vid',d:'M0 3 C-6 5 -6 15 0 19 C6 15 6 5 0 3Z'},g);
    el('ellipse',{cx:-1.8,cy:9,rx:1.1,ry:2.6,fill:'#fff',opacity:.6},g);
    return g;
  }
  function saltito(e,clase,ms){ e.classList.add(clase); setTimeout(function(){ e.classList.remove(clase); },ms); }
  function encender(ls,n){ ls.forEach(function(l,i){ var on=i<n; if(on&&!l.classList.contains('on')){ l.classList.add('on'); saltito(l,'pop',400); } else if(!on) l.classList.remove('on'); }); }
  // cordón con caída entre x0 y x1 (en coordenadas del host) con n foquitos
  function cordon(host,cual,x0,x1,y,caida,n,k){
    var w=host.clientWidth, h=host.clientHeight, svg=capa(host,cual,w,h), ls=[], mx=(x0+x1)/2, yc=y+caida*2;
    el('path',{d:'M'+x0+' '+y+' Q'+mx+' '+yc+' '+x1+' '+y,fill:'none',stroke:'#2a3442','stroke-width':1.6},svg);
    for(var i=0;i<n;i++){ var u=(i+.5)/n, x=(1-u)*(1-u)*x0+2*(1-u)*u*mx+u*u*x1, yy=(1-u)*(1-u)*y+2*(1-u)*u*yc+u*u*y; ls.push(luz(svg,x,yy,(u-.5)*-30,k,i)); }
    return ls;
  }
  function icono(k,cual){ if(!k) return null; var s=k.querySelector(':scope>.lz-ic'); if(s) return s; s=document.createElement('span'); s.className='lz-ic'; s.setAttribute('aria-hidden','true'); s.innerHTML='<svg viewBox="0 0 24 24">'+ICON[cual]+'</svg>'; k.insertBefore(s,k.firstChild); return s; }
  function prender(ic,on){ if(!ic) return; if(on&&!ic.classList.contains('on')){ ic.classList.add('on'); saltito(ic,'pop',600); } else if(!on) ic.classList.remove('on'); }

  /* ── cada pieza (idempotente: si ya está y no cambió de tamaño, no se rehace) ── */
  function pestanas(scr){
    var tabs=scr.id==='employeeScreen'&&scr.querySelector(':scope .tabs'); if(!tabs) return;
    var bs=[].slice.call(tabs.querySelectorAll('.tab')); if(!bs.length) return;
    var w=tabs.scrollWidth, s=tabs.querySelector(':scope>svg.lz-capa');
    if(!s||+s.dataset.w!==w){ s=capa(tabs,'tabs',w,22); s.dataset.w=w; s.style.width=w+'px';
      el('path',{d:bs.map(function(b,i){ var x0=b.offsetLeft, x1=x0+b.offsetWidth; return (i?'L':'M')+x0+' 1 Q'+((x0+x1)/2)+' 9 '+x1+' 1'; }).join(' '),fill:'none',stroke:'#2a3442','stroke-width':1.4},s);
      s._ls=bs.map(function(b,i){ return luz(s,b.offsetLeft+b.offsetWidth/2,4.5,0,.9,i); }); }
    s._ls.forEach(function(l,i){ var on=!!bs[i]&&bs[i].classList.contains('active'); if(on&&!l.classList.contains('on')) saltito(l,'pop',400); l.classList.toggle('on',on); });
  }
  function marcaje(scr){
    scr.querySelectorAll('.mk3').forEach(function(card){
      var line=card.querySelector('.mk3-line'); if(!line) return;
      // avance real de la jornada: de la hora de entrada a la salida oficial (index.html deja los datos en la tarjeta)
      var ent=+card.dataset.ent||0, fin=card.dataset.fin?new Date(card.dataset.fin).getTime():0, fr=0;
      if(card.dataset.sal) fr=1; else if(ent) fr=fin>ent?Math.max(.05,Math.min(1,(Date.now()-ent)/(fin-ent))):1;
      var w=line.clientWidth||200, s=line.querySelector(':scope>svg.lz-capa');
      if(!s||+s.dataset.w!==w){ var n=Math.max(6,Math.round(w/24)); var ls=cordon(line,'mk',2,w-2,6,7,n,.85); s=line.querySelector(':scope>svg.lz-capa'); s.dataset.w=w; s._ls=ls; s._n=0; }
      var meta=fr>0?Math.max(1,Math.round(fr*s._ls.length)):0;
      if(s._n!==meta){ var desde=s._n||0; s._n=meta; clearInterval(s._iv); var k=desde; s._iv=setInterval(function(){ k+=k<meta?1:-1; encender(s._ls,k); if(k===meta) clearInterval(s._iv); },140); if(desde===meta) encender(s._ls,meta); }
      s._ls[0].classList.toggle('espera',!meta);
      prender(icono(card.querySelector('.mk3-k'),'estrella'),!!ent);
    });
  }
  function tarjetas(scr){
    var reg=scr.querySelector('#empReg'); if(!reg) return;
    var cards=[].slice.call(reg.querySelectorAll('.fx-card'));
    var dia=cards.filter(function(c){ return c.querySelector('#tipoDiaGrid'); })[0], hor=cards.filter(function(c){ return c.querySelector('.fx-hr'); })[0], act=cards.filter(function(c){ return c.querySelector('#empActs'); })[0];
    var iDia=icono(dia&&dia.querySelector('.fx-k'),'campana'), iHor=icono(hor&&hor.querySelector('.fx-k'),'vela'), iAct=icono(act&&act.querySelector('.fx-k'),'esfera');
    prender(iDia,!!reg.querySelector('.fx-chip.on')); prender(iHor,!!(hor&&hor.offsetParent));
    // los días: foquito arriba de cada uno
    reg.querySelectorAll('.fx-chip').forEach(function(ch,i){
      var s=ch.querySelector(':scope>svg.lz-capa'), w=ch.clientWidth;
      if(!s||+s.dataset.w!==w){ s=capa(ch,'chip',w,ch.clientHeight); s.dataset.w=w; s._l=luz(s,w/2,-7,0,.62,i+1); }
      var on=ch.classList.contains('on'); if(on&&!s._l.classList.contains('on')) saltito(s._l,'pop',400); s._l.classList.toggle('on',on);
    });
    // actividades
    var ta=reg.querySelector('#empActs');
    if(ta&&ta.offsetParent){ var host=ta.parentNode; fijar(host);
      var r={x:ta.offsetLeft,y:ta.offsetTop,w:ta.offsetWidth,h:ta.offsetHeight}, clave=[r.x,r.y,r.w,r.h].join(','), s=host.querySelector(':scope>svg.lz-capa');
      if(!s||s.dataset.k!==clave){ s=capa(host,'ta',host.clientWidth,host.clientHeight); s.dataset.k=clave; var ls=[], paso=26;
        el('rect',{x:r.x,y:r.y,width:r.w,height:r.h,rx:12,fill:'none',stroke:'#2a3442','stroke-width':1.4,opacity:.55},s);
        var nx=Math.max(2,Math.round(r.w/paso)), ny=Math.max(1,Math.round(r.h/paso)), pts=[], i;
        for(i=0;i<nx;i++) pts.push([r.x+(i+.5)*r.w/nx,r.y,180]); for(i=0;i<ny;i++) pts.push([r.x+r.w,r.y+(i+.5)*r.h/ny,-90]);
        for(i=nx-1;i>=0;i--) pts.push([r.x+(i+.5)*r.w/nx,r.y+r.h,0]); for(i=ny-1;i>=0;i--) pts.push([r.x,r.y+(i+.5)*r.h/ny,90]);
        s._ls=pts.map(function(p,j){ return luz(s,p[0],p[1],p[2]+(j%2?8:-8),.62,j); }); }
      if(!ta._lz){ ta._lz=true; ta.addEventListener('input',function(){ if(listo) tarjetas(pantalla()||scr); }); }
      var f=Math.min(1,ta.value.trim().length/META); encender(s._ls,Math.round(f*s._ls.length)); host.classList.toggle('lz-lleno',f>=1);
      prender(iAct,ta.value.trim().length>0);
    }
    // viático: la perilla es un foquito
    var vi=reg.querySelector('.fx-viat'), kn=vi&&vi.querySelector('.fx-sw i');
    if(kn){ var sp=kn.querySelector('svg.lz-perilla');
      if(!sp){ sp=capa(kn,'perilla',24,24); sp.setAttribute('viewBox','-12 -12 24 24'); sp.classList.add('lz-perilla'); sp._l=luz(sp,0,-8,0,.82,1); }
      sp._l.classList.toggle('on',vi.getAttribute('aria-pressed')==='true'); }
    // guardar
    var gb=reg.querySelector('.fx-save');
    if(gb&&gb.offsetParent){ var gh=gb.parentNode; fijar(gh);
      var gk=[gb.offsetLeft,gb.offsetTop,gb.offsetWidth].join(','), gs=gh.querySelector(':scope>svg.lz-capa');
      if(!gs||gs.dataset.k!==gk){ var gl=cordon(gh,'save',gb.offsetLeft+10,gb.offsetLeft+gb.offsetWidth-10,gb.offsetTop-1,3,Math.round(gb.offsetWidth/26),.68); gs=gh.querySelector(':scope>svg.lz-capa'); gs.dataset.k=gk; gs._ls=gl; }
      if(!gb._lz){ gb._lz=true; gb.addEventListener('pointerdown',function(){ if(!listo) return; var c=gb.parentNode.querySelector(':scope>svg.lz-capa'); if(!c) return; c._ls.forEach(function(l){ l.classList.add('on'); }); saltito(gb.parentNode,'lz-corre',1800); }); }
      if(!gh.classList.contains('lz-corre')) encender(gs._ls,Math.round((.25+.75*Math.min(1,(ta?ta.value.trim().length:0)/META))*gs._ls.length));
    }
  }

  var nDec=0; window.__lucesN=function(){ return nDec; };
  /* ── la admin ── */
  function visible(e){ return !!(e&&e.offsetParent); }
  function num(e){ return e?(parseInt(e.textContent,10)||0):0; }
  // menú: en compu es una barra lateral (cordón vertical a la orilla, un foquito por sección); en celular, pestañas arriba
  function menuAdmin(scr){
    var nav=scr.id==='adminScreen'&&scr.querySelector('.ad-nav'); if(!nav) return;
    var bs=[].slice.call(nav.querySelectorAll(':scope>.tab')).filter(visible); if(bs.length<2) return;
    // los avisos (Pendientes, Observaciones) cambian por estilo y texto: se escuchan aparte
    nav.querySelectorAll('.tab-bd').forEach(function(bd){ if(bd._lz) return; bd._lz=true; new MutationObserver(function(){ if(listo) pronto(); }).observe(bd,{attributes:true,childList:true,characterData:true,subtree:true}); });
    var vertical=bs[1].offsetTop>bs[0].offsetTop+4, s=nav.querySelector(':scope>svg.lz-capa'), clave=(vertical?'v':'h')+nav.clientWidth+'x'+nav.scrollHeight;
    if(!s||s.dataset.k!==clave){
      if(vertical){ var w=nav.clientWidth, h=nav.scrollHeight, x=w-9; s=capa(nav,'menu',w,h); s.style.height=h+'px';
        var y0=bs[0].offsetTop+4, y1=bs[bs.length-1].offsetTop+bs[bs.length-1].offsetHeight-4, d='M'+x+' '+y0;
        bs.forEach(function(b){ var c=b.offsetTop+b.offsetHeight/2; d+=' Q'+(x+5)+' '+(c-b.offsetHeight/4)+' '+x+' '+c; }); d+=' L'+x+' '+y1;
        el('path',{d:d,fill:'none',stroke:'rgba(255,255,255,.35)','stroke-width':1.4},s);
        s._ls=bs.map(function(b,i){ return luz(s,x,b.offsetTop+b.offsetHeight/2,90,.78,i); });
      } else { var tw=nav.scrollWidth; s=capa(nav,'menu',tw,22); s.style.width=tw+'px'; s.style.height='22px';
        el('path',{d:bs.map(function(b,i){ var x0=b.offsetLeft, x1=x0+b.offsetWidth; return (i?'L':'M')+x0+' 1 Q'+((x0+x1)/2)+' 9 '+x1+' 1'; }).join(' '),fill:'none',stroke:'#2a3442','stroke-width':1.4},s);
        s._ls=bs.map(function(b,i){ return luz(s,b.offsetLeft+b.offsetWidth/2,4.5,0,.9,i); }); }
      s.dataset.k=clave; s._bs=bs; nav.classList.toggle('lz-menu-h',!vertical);
    }
    s._bs.forEach(function(b,i){ var l=s._ls[i]; if(!l) return; var on=b.classList.contains('active'), bd=b.querySelector('.tab-bd'), aviso=!on&&bd&&bd.style.display!=='none'&&num(bd)>0;
      if(on&&!l.classList.contains('on')) saltito(l,'pop',400); l.classList.toggle('on',on); l.classList.toggle('espera',!!aviso); });
  }
  // tira con texto y un cordón: total foquitos, «encendidos» prendidos; todos → titilan rápido
  function tira(despuesDe,antesDe,id,total,encendidos,texto){
    var t=document.getElementById(id);
    if(!t){ t=document.createElement('div'); t.id=id; t.className='lz-tira'; t.innerHTML='<span class="lz-tira-t"></span><span class="lz-tira-c"></span>'; }
    if(antesDe){ if(t.nextElementSibling!==antesDe) antesDe.parentNode.insertBefore(t,antesDe); } else if(despuesDe&&despuesDe.nextElementSibling!==t) despuesDe.parentNode.insertBefore(t,despuesDe.nextSibling);
    var tx=t.querySelector('.lz-tira-t'); if(tx.textContent!==texto) tx.textContent=texto;
    var c=t.querySelector('.lz-tira-c'), w=c.clientWidth||200, n=Math.max(1,total), clave=n+'@'+w, s=c.querySelector(':scope>svg.lz-capa');
    if(!s||s.dataset.k!==clave){ var paso=w/n, k=Math.max(.42,Math.min(.85,paso/26)); cordon(c,'tcord',2,w-2,5,Math.min(8,4+n),n,k); s=c.querySelector(':scope>svg.lz-capa'); s.dataset.k=clave; s._ls=[].slice.call(s.querySelectorAll('.lz')); }
    encender(s._ls,Math.min(n,encendidos)); t.classList.toggle('lz-lleno',encendidos>=n&&total>0);
  }
  function quitarTira(id){ var t=document.getElementById(id); if(t) t.remove(); }
  function dashboard(scr){
    var dt=scr.id==='adminScreen'&&scr.querySelector('.dtiles'); if(!visible(dt)){ quitarTira('lzEquipo'); return; }
    var ok=num(dt.querySelector('[data-k="ok"] .v')), tarde=num(dt.querySelector('[data-k="tarde"] .v')), sin=num(dt.querySelector('[data-k="sin"] .v')), n=ok+tarde+sin;
    if(!n){ quitarTira('lzEquipo'); return; }
    var m=ok+tarde, hoy=/hoy/i.test((scr.querySelector('#dashAsistFecha')||{}).textContent||'');
    tira(null,dt,'lzEquipo',n,m,m>=n?(hoy?'¡Todo el equipo ya marcó!':'Todo el equipo marcó'):m+' de '+n+(hoy?' ya marcaron entrada':' marcaron entrada'));
  }
  function pendientes(scr){
    var hero=scr.id==='adminScreen'&&scr.querySelector('#adPend .page-header'); if(!visible(hero)){ quitarTira('lzPend'); return; }
    var bd=document.getElementById('pendBadge'), quedan=bd&&bd.style.display!=='none'?num(bd):0, clave='lz_pend_'+new Date().toDateString(), total=quedan;
    try{ total=Math.max(quedan,+sessionStorage.getItem(clave)||0); sessionStorage.setItem(clave,total); }catch(e){}
    var hechos=total-quedan;
    tira(hero,null,'lzPend',total||5,total?hechos:5,!total||!quedan?'¡Todo al día! Nada por revisar':hechos?'Revisaste '+hechos+' de '+total:quedan+(quedan===1?' por revisar':' por revisar · cada uno que revises enciende un foquito'));
  }
  function programacion(scr){
    var hero=scr.id==='adminScreen'&&scr.querySelector('#adProg .pg-hero'); if(!visible(hero)){ quitarTira('lzProg'); return; }
    var b=hero.querySelectorAll('.us-cnt b'); if(b.length<3){ quitarTira('lzProg'); return; }
    var asig=num(b[1]), libres=num(b[2]), n=asig+libres;
    if(!n){ quitarTira('lzProg'); return; }
    tira(hero,null,'lzProg',n,asig,!libres?'¡Todos tienen grupo!':asig+' de '+n+' con grupo · '+libres+(libres===1?' libre':' libres'));
  }

  function decorar(){ var scr=pantalla(); if(!scr) return; nDec++; document.documentElement.classList.add('nvc-luces'); pestanas(scr); marcaje(scr); tarjetas(scr); menuAdmin(scr); dashboard(scr); pendientes(scr); programacion(scr); }
  function quitar(){
    document.querySelectorAll('svg.lz-capa,.lz-ic,.lz-tira').forEach(function(e){ clearInterval(e._iv); e.remove(); });
    document.querySelectorAll('.lz-menu-h').forEach(function(e){ e.classList.remove('lz-menu-h'); });
    document.querySelectorAll('.lz-host').forEach(function(e){ e.classList.remove('lz-host','lz-lleno','lz-corre'); });
    document.documentElement.classList.remove('nvc-luces');
  }
  function pronto(){ clearTimeout(pend); pend=setTimeout(function(){ if(listo) decorar(); },120); }
  // nunca de inmediato: si otro módulo cambia una clase de <html> al ver nuestros cambios, no se arma un ciclo
  function revisar(){ if(activo()){ if(!listo){ listo=true; pronto(); } } else if(listo){ listo=false; clearTimeout(pend); quitar(); } }
  // solo cambios de la app cuentan (no los de las propias luces)
  function ajeno(m){ var t=m.target; if(t.nodeType!==1) return true; if(t.closest&&t.closest('svg.lz-capa,.lz-ic,.lz-tira')) return false;
    if(m.type==='childList'){ var ns=[].slice.call(m.addedNodes).concat([].slice.call(m.removedNodes)); return !ns.length||ns.some(function(n){ return n.nodeType===1&&!(n.classList&&(n.classList.contains('lz-capa')||n.classList.contains('lz-ic')||n.classList.contains('lz-tira'))); }); }
    return !(t.classList&&(t.classList.contains('lz')||t.classList.contains('lz-ic')||t.classList.contains('lz-host')||t.classList.contains('lz-tira')||t.classList.contains('lz-menu-h'))); }
  function iniciar(){
    new MutationObserver(revisar).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    new MutationObserver(function(ms){ if(listo&&ms.some(ajeno)) pronto(); }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-pressed']});
    setInterval(function(){ if(listo&&!document.hidden) pronto(); },60000);   // el avance de la jornada en el marcaje
    var tm=0; window.addEventListener('resize',function(){ if(!listo) return; clearTimeout(tm); tm=setTimeout(decorar,250); });
    revisar();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',iniciar); else iniciar();
})();
