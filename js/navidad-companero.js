/* Un compañero en el encabezado visible. Solo observa presentación y gestos;
   no lee campos, sesiones, respuestas de red ni datos de los registros. */
(function(){
'use strict';
var HERO='.page-header,.dash-hero,.rg-hero,.pg-hero,.ps-hero,.pf-gafete,.perfil-hero';
var MODAL='.mo.open,.fx-ok.on,.nv-pan,.rm-card,#tcCapa,#avAnuncio,#novReg,[aria-modal="true"]';
var prefix='nvi-',mount=null,hero=null,screen=null,actor=null,ice=null,world=null;
var stage='',pending=0,touchTimer=0,remaining=0,nap=8,inView=true,blocked=false,receipt=false,wasSaved=false;
var lastPoint=null,navigation=null,intersection=null,observer=null;
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
function covered(){return Array.from(document.querySelectorAll(MODAL)).some(visible);}
function day(){var d=new Date();if(window.__temas?.modo==='ver')return Number(document.querySelector('#loginScreen .nv-hielo-fijo')?.dataset.dia)||1;return d.getMonth()===11?Math.min(21,d.getDate()):1;}
function setCold(){
  if(!mount)return;clearTimeout(touchTimer);mount.dataset.reaccion='frio';
  touchTimer=setTimeout(function(){if(mount)delete mount.dataset.reaccion;},3200);
}
function play(name,point){
  if(!actor||ice||media?.matches||typing()||covered()||document.hidden)return;
  if(name==='ack')actor.lookAt(null);actor.play(name);remaining=GreenActor.SCENES[name].duration;mount.dataset.accion=name;
  var p=point&&NavidadEntorno.point(actor.svg,point);if(p)actor.lookAt(p,remaining);
}
function regulate(){
  if(!actor)return;var stop=!!ice||media?.matches||document.hidden||!inView||typing()||covered();
  mount.classList.toggle('nv-mascota-ojos-pausa',document.hidden||media?.matches||!inView||covered());
  blocked=stop;if(stop)actor.pause();else actor.resume();
  if(document.hidden||!inView||covered())world?.suspend();
}
function frame(info,dt){
  if(blocked)return;
  if(remaining>0){remaining-=dt;if(remaining<=0){actor.play(stage==='ano'?'nye':'idle');delete mount.dataset.accion;}return;}
  nap-=dt;if(nap<=0){nap=17;play('grump');}
}
function destroy(){
  clearTimeout(touchTimer);intersection?.disconnect();intersection=null;world?.destroy();world=null;
  actor?.destroy();actor=null;ice?.destroy();ice=null;mount?.remove();mount=null;
  hero?.classList.remove('nv-con-companero');hero=screen=null;stage='';lastPoint=null;receipt=wasSaved=false;
  remaining=0;nap=8;navigation=null;inView=true;
}
function build(s,h,next){
  var template=document.querySelector('#loginScreen .nv-mascota');if(!template||typeof GreenActor!=='function')return false;
  screen=s;hero=h;stage=next;mount=document.createElement('div');mount.className='nv-mascota nv-mascota-interior';
  mount.setAttribute('role','button');mount.setAttribute('tabindex','0');mount.setAttribute('aria-label','Tocar al robanavidades');
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
  world=NavidadEntorno.create(s,mount,{idPrefix:prefix,frozen:function(){return !!ice;},busy:function(){return typing()||covered()||!inView;},
    lightSelector:'.nvp-f,.nvc-luz',react:function(d){if(typing())return;if(ice)setCold();else play('plot',d);}});
  if(typeof IntersectionObserver==='function'){
    intersection=new IntersectionObserver(function(entries){inView=entries[0].isIntersecting;sync();},{threshold:.08});intersection.observe(mount);
  }
  mount.addEventListener('click',function(){if(ice){if(!media?.matches&&!document.hidden){ice.touch();setCold();}}else play('grump');});
  mount.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();mount.click();}});
  return true;
}
function sync(){
  pending=0;var next=theme(),s=selected(),h=s&&header(s);
  if(!next||!s||!h){if(mount)destroy();return;}
  if(!mount?.isConnected||s!==screen||next!==stage){destroy();if(!build(s,h,next))return;lastPoint=s.querySelector('.mk3-pt.recien');}
  else if(h!==hero){
    hero.classList.remove('nv-con-companero');hero=h;h.classList.add('nv-con-companero');h.appendChild(mount);
    if(ice){if(navigation)world.react({kind:'ambiente',x:navigation.x,y:navigation.y});}else play('plot',navigation);
    navigation=null;intersection?.unobserve(mount);intersection?.observe(mount);
  }
  if(ice)ice.update(day());
  var saved=visible(document.querySelector('#fxOk.on')),point=s.querySelector('.mk3-pt.recien');
  if(saved&&!wasSaved)receipt=true;wasSaved=saved;
  if(point&&point!==lastPoint){receipt=true;lastPoint=point;}
  if(receipt&&!covered()&&!typing()&&!document.hidden&&inView){receipt=false;if(ice)setCold();else play('ack');}
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
    world.resetGaze();
    if(document.activeElement.type==='password'){if(ice)mount.dataset.mirada='apartada';else{actor.play('privacy');actor.render(GreenActor.SCENES.privacy.duration);}}
  }else{if(ice)delete mount.dataset.mirada;else if(actor.scene==='privacy'){actor.play('idle');remaining=0;}}
  regulate();schedule();
}
function init(){
  observer=new MutationObserver(function(records){if(records.some(function(r){return !r.target.closest?.('.nv-mascota-interior');}))schedule();});
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  var app=document.getElementById('appContainer');if(app)observer.observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  document.addEventListener('pointerdown',pointer,true);document.addEventListener('focusin',focus);document.addEventListener('focusout',function(){setTimeout(focus,0);});
  document.addEventListener('visibilitychange',sync);media?.addEventListener?.('change',regulate);setInterval(sync,60000);sync();
}
window.NavidadCompanero={namespace:namespace,sync:sync};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
