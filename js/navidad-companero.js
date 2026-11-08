/* Un compañero en el encabezado visible. Solo observa presentación y gestos;
   no lee campos, sesiones, respuestas de red ni datos de los registros. */
(function(){
'use strict';
var HERO='.page-header,.dash-hero,.rg-hero,.pg-hero,.ps-hero,.pf-gafete,.perfil-hero';
var MODAL='.mo.open,.fx-ok.on,.nv-pan,.rm-card,#tcCapa,#avAnuncio,#novReg,[aria-modal="true"]';
var prefix='nvi-',mount=null,hero=null,screen=null,actor=null,ice=null,world=null;
var stage='',pending=0,touchTimer=0,remaining=0,nap=1.4,inView=true,blocked=false,receipt=false,wasSaved=false;
var lastPoint=null,navigation=null,intersection=null,observer=null,ornament=null,taps=0,mood=0,released=false,palmHit=false;
var media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
function namespace(markup,p){
  var ids=[];markup.replace(/\bid="([^"]+)"/g,function(_,id){ids.push(id);return _;});
  // Se reescriben solo identificadores y referencias, nunca colores hexadecimales.
  markup=markup.replace(/\bid="([^"]+)"/g,function(_,id){return 'id="'+p+id+'" data-nv-part="'+id+'"';});
  ids.forEach(function(id){markup=markup.split('url(#'+id+')').join('url(#'+p+id+')').split('href="#'+id+'"').join('href="#'+p+id+'"');});
  return markup.replace(/aria-labelledby="([^"]+)"/g,function(_,list){return 'aria-labelledby="'+list.split(/\s+/).map(function(id){return p+id;}).join(' ')+'"';});
}
function visible(el){return !!el&&el.isConnected&&el.getClientRects().length>0;}
function theme(){var t=window.__temas;return t?.activo?.id==='navidad'?t.etapaDe(t.activo)?.id:'';}
function selected(){return document.querySelector('#employeeScreen.active,#adminScreen.active');}
function header(s){return Array.from(s.querySelectorAll('.content '+HERO.split(',').join(',.content '))).find(visible)||null;}
function typing(){var el=document.activeElement;return !!el&&!!screen?.contains(el)&&el.matches('input,textarea,select,[contenteditable="true"]');}
function privateField(){return typing()&&document.activeElement.type==='password';}
function covered(){return Array.from(document.querySelectorAll(MODAL)).some(function(el){
  if(!visible(el)||el.getAttribute?.('aria-hidden')==='true')return false;
  if(typeof getComputedStyle!=='function')return true;
  var style=getComputedStyle(el);return style.visibility!=='hidden'&&style.display!=='none'&&Number(style.opacity)!==0;
});}
function day(){var d=new Date();if(window.__temas?.modo==='ver')return Number(document.querySelector('#loginScreen .nv-hielo-fijo')?.dataset.dia)||1;return d.getMonth()===11?Math.min(21,d.getDate()):1;}
function createOrnament(h,svg){
  var node=null,anchor=null,last=null,contact=false,released=false,time=0;
  function restore(){if(node){node.classList.remove('nv-bota-tirada');['--nv-bota-x','--nv-bota-y','--nv-bota-giro'].forEach(function(k){node.style.removeProperty(k);});}node=anchor=last=null;contact=released=false;time=0;}
  function start(){
    restore();node=h.querySelector(':scope>.nvc-bota');var m=node?.querySelector('svg')?.getScreenCTM();
    if(!m){node=null;return false;}
    anchor={x:m.a*34+m.c*22+m.e,y:m.b*34+m.d*22+m.f};return true;
  }
  function move(p){
    if(!node?.isConnected||!anchor)return;
    var dx=p.x-anchor.x,dy=p.y-anchor.y;
    node.classList.add('nv-bota-tirada');node.style.setProperty('--nv-bota-x',dx.toFixed(2)+'px');node.style.setProperty('--nv-bota-y',dy.toFixed(2)+'px');
    node.style.setProperty('--nv-bota-giro',(5+Math.max(-15,Math.min(15,-dx*1.2))).toFixed(2)+'deg');
  }
  function pull(t){
    if(released||!node?.isConnected||!anchor)return;
    var m=svg.querySelector('#'+prefix+'hand-left')?.getScreenCTM();if(!m)return;
    var p={x:m.e,y:m.f};
    if(!contact&&t>=1.05&&Math.hypot(p.x-anchor.x,p.y-anchor.y)<5)contact=true;
    if(contact){move(p);last=p;}
  }
  function release(){if(!contact){restore();return;}released=true;time=0;}
  function settle(dt){
    if(!released||!last||!anchor)return;
    time+=dt;var w=Math.cos(time*9)*Math.exp(-3*time);
    move({x:anchor.x+(last.x-anchor.x)*w,y:anchor.y+(last.y-anchor.y)*w});if(time>=2.4)restore();
  }
  return {start:start,target:function(){return anchor;},pull:pull,release:release,settle:settle,restore:restore,destroy:restore};
}
function setCold(){
  if(!mount)return;clearTimeout(touchTimer);delete mount.dataset.reaccion;void mount.offsetWidth;mount.dataset.reaccion='frio';
  touchTimer=setTimeout(function(){if(mount)delete mount.dataset.reaccion;},3600);
}
function allowed(){return !!actor&&!media?.matches&&!typing()&&!covered()&&!document.hidden&&inView;}
function play(name,point){
  if(!allowed()||ice)return false;
  actor.reachFor(null);if(name==='ack')actor.lookAt(null);actor.play(name);remaining=GreenActor.SCENES[name].duration;mount.dataset.accion=name;
  var p=point&&NavidadEntorno.point(actor.svg,point);if(p)actor.lookAt(p,remaining);return true;
}
function mischief(){
  if(!allowed()||ice||!ornament?.start())return false;
  var p=NavidadEntorno.point(actor.svg,ornament.target());if(!p){ornament.restore();return false;}
  actor.lookAt(null);actor.reachFor(p);actor.play('mischief');remaining=GreenActor.SCENES.mischief.duration;mount.dataset.accion='mischief';released=false;return true;
}
function pressIce(){
  if(!ice||!allowed())return false;
  actor.lookAt(null);actor.play('trapped');remaining=GreenActor.SCENES.trapped.duration;palmHit=false;
  delete mount.dataset.accion;void mount.offsetWidth;mount.dataset.accion='trapped';actor.resume();regulate();return true;
}
function regulate(){
  if(!actor)return;var modal=covered(),off=document.hidden||!inView;
  var stop=media?.matches||off||privateField()||modal||!!ice&&mount.dataset.accion!=='trapped';
  mount.dataset.estado=off?'fuera':modal?'modal':media?.matches?'reducido':privateField()?'privado':typing()?'editando':ice?'hielo':'activo';
  mount.classList.toggle('nv-mascota-ojos-pausa',off||media?.matches||modal);
  blocked=stop;if(stop)actor.pause();else actor.resume();if(off||modal)world?.suspend();
}
function idle(){if(!actor)return;actor.reachFor(null);actor.play(stage==='ano'?'nye':'idle');remaining=0;delete mount.dataset.accion;}
function frame(info,dt){
  if(blocked||typing())return;
  ornament?.settle(dt);
  if(ice){
    if(remaining>0){
      if(!palmHit&&info.elapsed>=.72){palmHit=true;ice.touch();setCold();}
      remaining-=dt;if(remaining<=0){idle();actor.render(0);regulate();}
    }
    return;
  }
  if(mount.dataset.accion==='mischief'){
    if(!released){ornament.pull(info.elapsed);if(info.elapsed>=3.25){ornament.release();released=true;}}
  }
  if(remaining>0){remaining-=dt;if(remaining<=0){idle();nap=7;}return;}
  nap-=dt;if(nap<=0){nap=6;var n=mood++%7;if(n===0&&mischief())return;play(['plot','hat','scoff','shoo','doze','grump','plot'][n]);}
}
function touch(){
  if(!allowed())return;
  if(ice){pressIce();return;}
  if(mount.dataset.accion==='mischief'){ornament.release();released=true;play('caught');return;}
  var n=taps++%7;if(n===0&&mischief())return;play(['caught','grump','plot','hat','scoff','shoo','doze'][n]);
}
function destroy(){
  clearTimeout(touchTimer);intersection?.disconnect();intersection=null;world?.destroy();world=null;ornament?.destroy();ornament=null;
  actor?.destroy();actor=null;ice?.destroy();ice=null;mount?.remove();mount=null;
  hero?.classList.remove('nv-con-companero');hero=screen=null;stage='';lastPoint=null;receipt=wasSaved=false;
  remaining=0;nap=1.4;taps=mood=0;navigation=null;inView=true;blocked=false;released=palmHit=false;
}
function build(s,h,next){
  var template=document.querySelector('#loginScreen .nv-mascota');if(!template||typeof GreenActor!=='function')return false;
  screen=s;hero=h;stage=next;mount=document.createElement('div');mount.className='nv-mascota nv-mascota-interior';
  mount.setAttribute('role','button');mount.setAttribute('tabindex','0');mount.setAttribute('aria-label','Molestar al robanavidades');
  mount.innerHTML=namespace(template.innerHTML,prefix);
  mount.querySelectorAll('svg').forEach(function(svg){svg.setAttribute('aria-hidden','true');});
  mount.querySelectorAll('[tabindex],[role="button"]').forEach(function(el){el.removeAttribute('tabindex');el.removeAttribute('role');el.removeAttribute('aria-label');});
  h.classList.add('nv-con-companero');h.appendChild(mount);
  var svg=mount.querySelector('svg');
  actor=new GreenActor(svg,{embedded:true,idPrefix:prefix,personality:true,frozen:next==='pre',initialScene:next==='ano'?'nye':'idle',onFrame:frame});
  if(next==='pre'){
    mount.classList.add('nv-mascota-congelada','nv-mascota-bloque');ice=NavidadHielo.create(day(),mount,{idPrefix:prefix});
    svg.style.filter='url(#'+prefix+'nvice-refraction) saturate(.86) brightness(.98)';
  }else mount.classList.add('nv-mascota-libre');
  ornament=createOrnament(h,svg);
  world=NavidadEntorno.create(s,mount,{idPrefix:prefix,frozen:function(){return !!ice;},busy:function(){return typing()||covered()||!inView;},
    lightSelector:'.nvp-f,.nvc-luz',react:function(d){if(!allowed())return;if(ice){if(d.kind==='ambiente'||d.kind==='foco')pressIce();else setCold();}else{ornament.restore();play(d.kind==='foco'?(d.off===true?'scoff':d.off===false?'shoo':'plot'):d.kind==='santa'?'shoo':'plot',d);}}});
  if(typeof IntersectionObserver==='function'){
    intersection=new IntersectionObserver(function(entries){inView=entries[0].isIntersecting;sync();},{threshold:.08});intersection.observe(mount);
  }
  mount.addEventListener('click',touch);
  mount.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();touch();}});
  return true;
}
function sync(){
  pending=0;var next=theme(),s=selected(),h=s&&header(s);
  if(!next||!s||!h){if(mount)destroy();return;}
  if(!mount?.isConnected||s!==screen||next!==stage){destroy();if(!build(s,h,next))return;lastPoint=s.querySelector('.mk3-pt.recien');}
  else if(h!==hero){
    ornament?.destroy();idle();hero.classList.remove('nv-con-companero');hero=h;h.classList.add('nv-con-companero');h.appendChild(mount);
    ornament=createOrnament(h,actor.svg);nap=1.4;
    if(ice){if(navigation)world.react({kind:'ambiente',x:navigation.x,y:navigation.y});}else play('plot',navigation);
    navigation=null;intersection?.unobserve(mount);intersection?.observe(mount);
  }
  if(ice)ice.update(day());
  var saved=visible(document.querySelector('#fxOk.on')),point=s.querySelector('.mk3-pt.recien');
  if(saved&&!wasSaved)receipt=true;wasSaved=saved;
  if(point&&point!==lastPoint){receipt=true;lastPoint=point;}
  if(receipt&&!covered()&&!typing()&&!document.hidden&&inView){receipt=false;if(ice)pressIce();else{ornament.restore();play('ack');}}
  regulate();
}
function schedule(){if(!pending)pending=setTimeout(sync,40);}
function pointer(e){
  if(!mount||!screen.contains(e.target)||mount.contains(e.target))return;
  if(e.target.closest('.tab')){navigation={x:e.clientX,y:e.clientY};schedule();return;}
  var target=e.target.closest('.mk3-btn,.nvp-pu,.nvp-adv-hoy,.dtile');
  if(target&&!typing()){
    var d={kind:'ambiente',x:e.clientX,y:e.clientY};if(ice)world.react(d);else{var p=NavidadEntorno.point(actor.svg,d);if(p)actor.lookAt(p,2.5);}
  }
}
function focus(){
  if(!actor)return;
  if(typing()){
    ornament?.restore();world.resetGaze();idle();
    if(ice){actor.render(0);if(privateField())mount.dataset.mirada='apartada';}
    else if(privateField()){actor.play('privacy');actor.render(GreenActor.SCENES.privacy.duration);}
  }else{if(ice)delete mount.dataset.mirada;else if(actor.scene==='privacy')idle();}
  regulate();schedule();
}
function init(){
  observer=new MutationObserver(function(records){if(records.some(function(r){return !r.target.closest?.('.nv-mascota-interior,.nv-bota-tirada');}))schedule();});
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  var app=document.getElementById('appContainer');if(app)observer.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  document.addEventListener('pointerdown',pointer,true);document.addEventListener('focusin',focus);document.addEventListener('focusout',function(){setTimeout(focus,0);});
  document.addEventListener('visibilitychange',sync);media?.addEventListener?.('change',regulate);setInterval(sync,60000);sync();
  window.addEventListener('resize',function(){if(actor&&!ice&&mount.dataset.accion==='mischief'){ornament.restore();idle();nap=1.4;}schedule();});
}
window.NavidadCompanero={namespace:namespace,sync:sync,createOrnament:createOrnament};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
