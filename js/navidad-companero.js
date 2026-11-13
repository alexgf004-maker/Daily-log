/* Un compañero en el encabezado visible. Solo observa presentación y gestos;
   no lee campos, sesiones, respuestas de red ni datos de los registros. */
(function(){
'use strict';
var HERO='.page-header,.dash-hero,.rg-hero,.pg-hero,.ps-hero,.pf-gafete,.perfil-hero';
var MODAL='.mo.open,.fx-ok.on,.nv-pan,.rm-card,#tcCapa,#avAnuncio,#novReg,[aria-modal="true"]';
var prefix='nvi-',mount=null,hero=null,screen=null,actor=null,ice=null,world=null,dialogue=null,life=null,gestosHielo=null;
var editing=false,editingTimer=0;
var stage='',pending=0,touchTimer=0,remaining=0,nap=1.4,inView=true,blocked=false;
var intersection=null,observer=null,ornament=null,turn=0,released=false,palmHit=false;
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
function focusedField(){var el=document.activeElement;return el&&screen?.contains(el)&&el.matches('input,textarea,select,[contenteditable="true"]')?el:null;}
function privateField(){return focusedField()?.type==='password';}
function typing(){return !!focusedField()&&(editing||privateField());}
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
  actor.reachFor(null);actor.play(name);remaining=GreenActor.SCENES[name].duration;mount.dataset.accion=name;
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
  var frozenAct=!!ice&&remaining>0&&['trapped','icewatch','icehuff','icedoze','icedraw','icescrape','icepunch','icesneeze'].includes(mount.dataset.accion);
  // «Reposo» de la app (25 s sin tocar, js/navidad-dentro.js): el compañero se queda quieto como el resto de la escena
  var quieto=!!window.__nvReposo?.quieto?.()&&remaining<=0;
  var stop=media?.matches||off||privateField()||modal||quieto||!!ice&&!frozenAct;
  mount.dataset.estado=off?'fuera':modal?'modal':media?.matches?'reducido':privateField()?'privado':typing()?'editando':ice?'hielo':'activo';
  mount.classList.toggle('nv-mascota-ojos-pausa',off||media?.matches||modal||privateField()||quieto);
  blocked=stop;if(stop)actor.pause();else actor.resume();if(off||modal)dialogue?.hide();
  if(off||modal||media?.matches){world?.cancelBlow?.();world?.suspend();}
  life?.sync();
}
function idle(){if(!actor)return;actor.reachFor(null);actor.lookAt(null);actor.play('idle');remaining=0;delete mount.dataset.accion;}
function blow(){
  if(!allowed()||stage!=='casa')return false;var target=world?.startBlow?.();if(!target)return false;
  var p=NavidadEntorno.point(actor.svg,target);if(!p){world.cancelBlow();return false;}
  ornament.restore();actor.reachFor(null);actor.play('blow');actor.lookAt(p,3.2);remaining=3.2;mount.dataset.accion='blow';return true;
}
function contextAction(){
  if(!allowed()||stage!=='casa')return false;var actions=turn++%2?[mischief,blow]:[blow,mischief];
  return actions.some(function(action){return action();});
}
function autonomous(name){
  if(!allowed()||remaining>0)return 0;
  world?.resetGaze();
  if(ice){
    if(gestosHielo&&!gestosHielo.puede(name))return 0;
    var duration=GreenActor.SCENES[name]?.duration;if(!duration)return 0;
    actor.lookAt(null);actor.play(name);remaining=duration;palmHit=false;mount.dataset.accion=name;
    if(name==='icehuff')setCold();actor.resume();regulate();return duration;
  }
  if(name==='environment')return contextAction()?remaining:0;
  if(!GreenActor.SCENES[name])return 0;   // escenas del login (esfera, trineo, nieve): aquí no aplican
  return play(name)?remaining:0;
}
function notice(d){
  if(!allowed())return;if(ice){if(d.kind==='foco'||d.kind==='ambiente'&&!life)pressIce();else if(d.kind!=='ambiente')setCold();return;}
  if(!['foco','santa','adorno','estrella','destello','nieve','casa'].includes(d.kind))return;
  world.cancelBlow?.();ornament.restore();idle();
  if(stage==='ano'&&d.kind==='destello'){play('nye',d);remaining=1.8;}
  else{var p=NavidadEntorno.point(actor.svg,d);if(p)actor.lookAt(p,2.8);}
  nap=8;
}
function frame(info,dt){
  if(blocked||typing())return;
  ornament?.settle(dt);
  if(mount.dataset.accion==='blow')world?.blowFrame?.(info.elapsed);
  if(ice){
    if(remaining>0){
      if(mount.dataset.accion==='trapped'&&!palmHit&&info.elapsed>=.72){palmHit=true;ice.touch();setCold();}
      remaining-=dt;if(remaining<=0){idle();actor.render(0);regulate();}
    }
    return;
  }
  if(mount.dataset.accion==='mischief'){
    if(!released){ornament.pull(info.elapsed);if(info.elapsed>=3.25){ornament.release();released=true;}}
  }
  if(remaining>0){remaining-=dt;if(remaining<=0){idle();nap=7;regulate();}return;}
  if(!life){nap-=dt;if(nap<=0){nap=12;contextAction();}}
}
function touch(event){
  if(!actor||typing()||covered()||document.hidden||!inView)return;
  life?.defer();
  dialogue?.say(ice?'pre':mount.dataset.accion==='mischief'?'caught':mount.dataset.accion==='blow'?'blow':event?.target?.closest?.('[data-nv-part="santa-hat"]')?'hat':stage);
  if(!allowed())return;
  if(ice){pressIce();return;}
  if(mount.dataset.accion==='mischief'){ornament.release();released=true;play('caught');return;}
  if(remaining>0)return;
  var p=event&&Number.isFinite(event.clientX)&&NavidadEntorno.point(actor.svg,{x:event.clientX,y:event.clientY});
  if(stage==='casa'&&p&&p.x>250&&p.x<580&&p.y>60&&p.y<250&&mount.querySelector('[data-nv-part="santa-hat"]')){play('hat');return;}
  contextAction();
}
function destroy(){
  life?.destroy();life=null;clearTimeout(editingTimer);editingTimer=0;editing=false;
  dialogue?.destroy();dialogue=null;clearTimeout(touchTimer);intersection?.disconnect();intersection=null;world?.destroy();world=null;ornament?.destroy();ornament=null;
  gestosHielo?.destroy();gestosHielo=null;actor?.destroy();actor=null;ice?.destroy();ice=null;mount?.remove();mount=null;
  hero?.classList.remove('nv-con-companero');hero=screen=null;stage='';
  remaining=0;nap=1.4;turn=0;inView=true;blocked=false;released=palmHit=false;
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
  actor=new GreenActor(svg,{embedded:true,idPrefix:prefix,personality:true,frozen:next==='pre',initialScene:'idle',onFrame:frame});
  if(next==='pre'){
    mount.classList.add('nv-mascota-congelada','nv-mascota-bloque');ice=NavidadHielo.create(day(),mount,{idPrefix:prefix});
    gestosHielo=window.NavidadHieloGestos?.create(mount,actor,{idPrefix:prefix})||null;
    svg.style.filter='url(#'+prefix+'nvice-refraction) saturate(.86) brightness(.98)';
  }else mount.classList.add('nv-mascota-libre');
  ornament=createOrnament(h,svg);
  world=NavidadEntorno.create(s,mount,{idPrefix:prefix,frozen:function(){return !!ice;},busy:function(){return typing()||covered()||!inView||remaining>0;},
    lightSelector:'.nvp-f,.nvc-luz',react:notice});
  if(typeof IntersectionObserver==='function'){
    intersection=new IntersectionObserver(function(entries){inView=entries[0].isIntersecting;sync();},{threshold:.08});intersection.observe(mount);
  }
  dialogue=NavidadEntorno.createDialogue?.(mount,{inside:true,idPrefix:prefix,container:function(){return screen;},stage:function(){return stage;},reduced:function(){return !!media?.matches;},express:function(e){actor?.speak?.(e);}});
  life=window.NavidadVida?.create({active:function(){return !!actor&&!media?.matches&&!document.hidden&&inView&&screen?.classList.contains('active')&&!typing()&&!covered()&&!window.__nvReposo?.quieto?.();},busy:function(){return remaining>0;},stage:function(){return stage;},run:autonomous})||null;
  mount.addEventListener('click',touch);
  mount.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();touch();}});
  return true;
}
function sync(){
  pending=0;var next=theme(),s=selected(),h=s&&header(s);
  if(!next||!s||!h){if(mount)destroy();return;}
  if(!mount?.isConnected||s!==screen||next!==stage){destroy();if(!build(s,h,next))return;}
  else if(h!==hero){
    dialogue?.hide();world?.cancelBlow?.();ornament?.destroy();idle();hero.classList.remove('nv-con-companero');hero=h;h.classList.add('nv-con-companero');h.appendChild(mount);
    ornament=createOrnament(h,actor.svg);nap=1.4;
    intersection?.unobserve(mount);intersection?.observe(mount);
  }
  if(ice)ice.update(day());
  regulate();
}
function schedule(){if(!pending)pending=setTimeout(sync,40);}
function focus(){
  if(!actor)return;
  clearTimeout(editingTimer);editingTimer=0;editing=!!focusedField();
  if(editing)editingTimer=setTimeout(function(){editing=false;editingTimer=0;regulate();},2500);
  if(typing()){
    dialogue?.hide();world.cancelBlow?.();ornament?.restore();world.resetGaze();idle();
    if(ice){actor.render(0);if(privateField())mount.dataset.mirada='apartada';}
    else if(privateField()){actor.play('privacy');actor.render(GreenActor.SCENES.privacy.duration);}
  }else{if(ice)delete mount.dataset.mirada;else if(actor.scene==='privacy')idle();}
  regulate();schedule();
}
function init(){
  observer=new MutationObserver(function(records){if(records.some(function(r){return !r.target.closest?.('.nv-mascota-interior,.nv-bota-tirada,.nv-soplo-entorno');}))schedule();});
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  var app=document.getElementById('appContainer');if(app)observer.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  document.addEventListener('focusin',focus);document.addEventListener('focusout',function(){setTimeout(focus,0);});
  document.addEventListener('input',function(){if(focusedField())focus();});
  document.addEventListener('visibilitychange',sync);media?.addEventListener?.('change',regulate);setInterval(sync,60000);sync();
  window.__nvReposo?.escuchar?.(function(){regulate();});
  window.addEventListener('resize',function(){world?.cancelBlow?.();if(actor&&!ice&&['mischief','blow'].includes(mount.dataset.accion)){ornament.restore();idle();nap=1.4;}schedule();});
}
window.NavidadCompanero={namespace:namespace,sync:sync,createOrnament:createOrnament};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
