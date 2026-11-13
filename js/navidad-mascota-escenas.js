/* Login de Navidad en casa: la mascota interactúa con el escenario (el dibujo lo expone en login.__nvEscena y la esfera
   en login.__nvArbol). Cuatro historias; cada una devuelve cuánto dura y se avanza con frame(t):
   - esfera:    descuelga una esfera del árbol, la admira y la vuelve a colgar.
   - escondite: al tocarla corre a esconderse detrás del árbol (una copia del árbol queda delante), se asoma por la
                orilla, sale por un lado y vuelve a su lugar.
   - trineo:    toma el regalo de arriba del trineo, lo sacude junto a la oreja para adivinar y lo devuelve.
   - nieve:     junta una bola de nieve entre las manos y la lanza al techo de la casita (se deshace en polvo).
   Solo mueve el contenedor de la mascota con la propiedad `translate` (no toca su `transform`) y piezas sueltas;
   detener() deja todo como estaba. */
(function(){
'use strict';
var cl=function(v,a,b){return Math.max(a===undefined?0:a,Math.min(b===undefined?1:b,v));};
var seg=function(t,a,b){return cl((t-a)/(b-a));};
var eIO=function(t){t=cl(t);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
var lerp=function(a,b,t){return a+(b-a)*t;};
var DUR={esfera:9.6,escondite:8.4,trineo:7.4,nieve:7.4};
function create(o){
  var login=o.login,mount=o.mount,actor=o.actor,flow=null,piezas=[];
  function escena(){return login.__nvEscena||null;}
  function puntoSVG(p){return p&&window.NavidadEntorno?.point(actor.svg,p);}
  function nodo(id){return mount.querySelector('#'+id);}
  function centro(id){var n=nodo(id),r=n?.getBoundingClientRect?.();return r&&r.width?{x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}:null;}
  function mano(lado){var m=nodo('hand-'+lado)?.getScreenCTM?.();return m?{x:m.e,y:m.f}:null;}
  function correr(px){mount.style.translate=px?px.toFixed(1)+'px 0':'';}
  function corrido(){return parseFloat(mount.style.translate)||0;}
  function una(k,fn){if(!flow.hecho[k]){flow.hecho[k]=1;try{fn();}catch(e){}}}
  function decir(r){o.say?.(r);}
  function enLogin(p){var b=login.getBoundingClientRect();return {x:p.x-b.left,y:p.y-b.top};}
  function pieza(cls){var n=document.createElement('i');n.className=cls;n.setAttribute('aria-hidden','true');login.appendChild(n);piezas.push(n);return n;}
  function ponerEn(n,p,extra){var q=enLogin(p);n.style.transform='translate('+q.x.toFixed(1)+'px,'+q.y.toFixed(1)+'px)'+(extra||'');}
  function limpiar(){piezas.forEach(function(n){n.remove();});piezas=[];}

  function puede(kind){
    var e=escena();if(!e)return false;
    var piso=(login.querySelector('.login-form')?.getBoundingClientRect?.().bottom||0)+8;   // en PC el escenario queda junto al formulario: sin estas escenas
    if(kind==='esfera')return !!o.environment?.start?.();
    if(kind==='escondite'){var c=centro('head'),b=centro('body');return !!c&&!!b&&c.y-c.h*.5>piso&&e.arbol(false)&&e.orilla(c.y)!==null;}
    if(kind==='trineo'){var g=e.regalo(),h=mano('left');return !!g&&!!h&&Math.hypot(g.x-h.x,g.y-h.y)<(centro('body')?.h||200)*.95;}
    if(kind==='nieve'){var k=e.casita();return !!k&&k.y>piso-20;}
    return false;
  }
  function start(kind){
    if(!DUR[kind]||!puede(kind))return 0;
    flow={kind:kind,t:0,hecho:{},base:{}};
    var e=escena(),cab=centro('head');
    if(kind==='esfera'){actor.play('sneak');o.aim?.();}
    else if(kind==='escondite'){actor.play('tap1');var cu=centro('body'),oc=e.orilla(cab.y),ob=e.orilla(cu.y+cu.h*.25);
      flow.base={dentro:cu.w*.55,asoma:oc!==null?(oc-cab.w*.12)-cab.x:0,fuera:ob!==null?(ob-cu.w*.75)-cu.x:-cu.w};}   // asomada: solo la cabeza fuera; fuera: todo el cuerpo
    else if(kind==='trineo'){var g=e.regalo();actor.reachFor(puntoSVG(g));actor.play('mischief');flow.base.regalo=g;}
    else if(kind==='nieve'){actor.play('plot');flow.base.casita=e.casita();}
    return DUR[kind];
  }
  function frame(dt){
    if(!flow)return false;flow.t+=dt;var t=flow.t,e=escena(),k=flow.kind;
    if(!e){stop();return false;}
    if(k==='esfera'){
      // se acerca y la jala (como la travesura), la mira un rato y la devuelve a su rama
      var env=o.environment;
      if(t>=2)una('jala',function(){actor.play('tug');});
      if(t<4.6){o.aim?.();env.pull(t);}
      else if(t<6.4){una('mira',function(){actor.reachFor(null);actor.play('idle');decir('esfera');});env.pull(9);var h=mano('right');if(h)actor.lookAt(puntoSVG(h),.4);}
      else if(t<8.2){una('cuelga',function(){o.aim?.();actor.play('offer');});env.pull(9);
        var a=env.target(),h2=mano('right');if(a&&h2&&t>7&&Math.hypot(a.x-h2.x,a.y-h2.y)<Math.max(8,a.r*1.6))una('suelta',function(){env.release();flow.suelta=t;});}
      else una('suelta2',function(){env.release();flow.suelta=flow.suelta||t;});
      if(flow.suelta){env.drop((t-flow.suelta)*1.4);if(t>8.4)una('fin',function(){actor.reachFor(null);actor.play('ack');});}
    }
    else if(k==='escondite'){
      var B=flow.base,dentro=B.dentro,asoma=B.asoma,fuera=B.fuera;
      // brinca del susto, corre detrás del árbol, se asoma, sale por la izquierda y vuelve a su lugar
      if(t>=.55)una('corre',function(){actor.play('run');});
      if(t>=.75)una('tapa',function(){e.arbol(true);});
      var x=0;
      if(t<1.4)x=lerp(0,dentro,eIO(seg(t,.55,1.3)));
      else if(t<2.4){x=dentro;una('quieta',function(){actor.play('idle');});}
      else if(t<4.9){x=lerp(dentro,asoma,eIO(seg(t,2.4,3.0)));una('asoma',function(){actor.play('lookaround');});if(t>3.1)una('dice',function(){decir('escondite');});}
      else if(t<6.4){x=lerp(asoma,fuera,eIO(seg(t,4.9,5.9)));una('sale',function(){actor.play('sneak');});if(t>5.9)una('destapa',function(){e.arbol(false);});}
      else{x=lerp(fuera,0,eIO(seg(t,6.4,8.0)));if(t>8.05)una('vuelve',function(){actor.play('idle');});}
      correr(x);
    }
    else if(k==='trineo'){
      // mete la mano al trineo, toma el regalo de arriba (a los dos tirones), lo sacude junto a la oreja y lo regresa
      var g0=flow.base.regalo,hl=mano('left');
      if(t<1.75){if(t>1.5&&hl){flow.agarra=1;e.moverRegalo(hl,0);}}
      else if(t<3.3){if(hl)e.moverRegalo(hl,Math.sin(t*20)*4);}
      if(t>=3.3)una('escucha',function(){actor.reachFor(null);actor.play('lookaround');flow.desde=mano('left')||g0;decir('trineo');});
      var oreja=centro('ear-left');
      if(t>=3.3&&t<5.6&&oreja){var p=eIO(seg(t,3.3,3.8)),d=flow.desde,q={x:lerp(d.x,oreja.x-oreja.w*.2,p),y:lerp(d.y,oreja.y+oreja.h*.35,p)};
        e.moverRegalo(q,t>3.8?Math.sin(t*34)*14*(1-seg(t,5.2,5.6)):0);}
      if(t>=5.6&&oreja){var p2=eIO(seg(t,5.6,6.3)),a2={x:oreja.x-oreja.w*.2,y:oreja.y+oreja.h*.35},q2={x:lerp(a2.x,g0.x,p2),y:lerp(a2.y,g0.y,p2)-Math.sin(p2*Math.PI)*40};
        e.moverRegalo(p2>=1?null:q2,(1-p2)*-20);una('acepta',function(){actor.play('ack');});}
    }
    else if(k==='nieve'){
      // junta nieve entre las manos (plot), la avienta con la izquierda y se deshace en el techo de la casita
      var hl2=mano('left'),hr=mano('right'),c=flow.base.casita;
      if(!flow.bola&&t>.9)flow.bola=pieza('nv-bola-nieve');
      var bola=flow.bola;
      if(bola&&t<2.1&&hl2&&hr){var s=cl((t-.9)/.6);ponerEn(bola,{x:(hl2.x+hr.x)/2,y:(hl2.y+hr.y)/2-4},' scale('+(.3+.7*s).toFixed(2)+')');}
      if(t>=2.1)una('apunta',function(){var h=centro('head');actor.reachFor(puntoSVG({x:h.x-h.w*.55,y:h.y+h.h*.25}));actor.play('mischief');});
      if(bola&&t>=2.1&&t<2.95&&hl2)ponerEn(bola,{x:hl2.x,y:hl2.y-4});
      if(bola&&t>=2.95){una('suelta',function(){flow.desde=hl2||mano('left');actor.reachFor(null);});
        var d=flow.desde,u=seg(t,2.95,3.85);
        if(u<1&&d){var tope=(login.querySelector('.login-form')?.getBoundingClientRect?.().bottom||0)+16,arco=Math.max(8,Math.min(Math.abs(d.x-c.x)*.45,Math.min(d.y,c.y)-tope));   // por debajo del formulario
          var x=lerp(d.x,c.x,u),y=lerp(d.y,c.y,u)-Math.sin(u*Math.PI)*arco;ponerEn(bola,{x:x,y:y},' scale('+(1-u*.35).toFixed(2)+')');}
        else una('plaf',function(){bola.style.opacity='0';for(var i=0;i<10;i++){var n=pieza('nv-nieve-polvo'),a=i/10*Math.PI*2;ponerEn(n,c);
          n.animate([{transform:n.style.transform,opacity:1},{transform:n.style.transform+' translate('+(Math.cos(a)*26).toFixed(1)+'px,'+(Math.sin(a)*16-6).toFixed(1)+'px) scale(.4)',opacity:0}],{duration:620,easing:'ease-out',fill:'forwards'});}
          actor.play('scoff');decir('nieve');});}
    }
    if(t>=DUR[k]){stop();return false;}
    return true;
  }
  function stop(){
    if(!flow)return;var e=escena();
    if(flow.kind==='esfera')o.environment?.restore?.();
    e?.arbol?.(false);e?.moverRegalo?.(null);limpiar();correr(0);actor.reachFor(null);actor.lookAt?.(null);flow=null;o.onEnd?.();
  }
  return {start:start,frame:frame,stop:stop,activa:function(){return flow?.kind||null;},duracion:function(k){return DUR[k]||0;}};
}
window.NavidadEscenas={create:create};
})();
