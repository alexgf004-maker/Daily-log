/* Montaje de la mascota navideña, aislado del login y del sistema de temas. */
(function(){
'use strict';
var mount=null,actor=null,ice=null,observer=null,stageNow='',generation=0,timers=[],touchStage=0,previewDay=null;
var reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function later(fn,ms){var id=setTimeout(function(){timers=timers.filter(function(t){return t!==id;});fn();},ms);timers.push(id);return id;}
function theme(){var t=window.__temas;return t&&t.activo&&t.activo.id==='navidad'?t:null;}
function stage(){var t=theme();return t&&t.etapaDe(t.activo)?.id||'';}
function isDate(month,day){var d=new Date();return d.getMonth()===month-1&&d.getDate()===day;}
function dayPre(){
  var d=new Date(),t=window.__temas;
  // La vista previa siempre empieza totalmente congelada.
  // Un día elegido manualmente para probar el deshielo tiene prioridad.
  if(t&&t.modo==='ver')return previewDay!==null?previewDay:1;
  return d.getMonth()===11&&d.getDate()<=21?d.getDate():1;
}
function clearAll(){
  generation++;timers.forEach(clearTimeout);timers=[];
  if(observer){observer.disconnect();observer=null;}
  if(actor){actor.svg.removeEventListener('pointerdown',onTap);actor.destroy();actor=null;}
  if(ice){ice.destroy();ice=null;}
  if(mount){mount.classList.remove('nv-mascota-ojos-pausa','nv-mascota-congelada','nv-mascota-libre','nv-mascota-bloque');mount=null;}
  stageNow='';touchStage=0;
}
function regulate(){
  if(!actor)return;
  var login=document.getElementById('loginScreen');
  var hidden=reduced||document.hidden||!login?.classList.contains('active');
  // La pose queda detenida; CSS mueve únicamente ojos y pupilas dentro del hielo.
  if(mount){
    if(hidden)mount.classList.add('nv-mascota-ojos-pausa');
    else mount.classList.remove('nv-mascota-ojos-pausa');
  }
  if(ice||hidden)actor.pause();
  else actor.resume();
}
function play(name){
  if(!actor||ice||!GreenActor.SCENES[name])return false;
  actor.play(name);
  if(name==='idle'||name==='nye'||name==='tantrum')return true;
  var g=generation,d=actor.getSceneInfo().duration;
  later(function(){if(g===generation&&actor&&!ice&&actor.scene===name)actor.play('idle');},Math.round((d+.25)*1000));
  return true;
}
function routine(){
  if(reduced||!actor||ice||document.hidden||!document.getElementById('loginScreen')?.classList.contains('active'))return;
  if(actor.scene!=='idle')return;
  var options=['sneak','steal','hide','climb','caught'];
  play(options[Math.floor(Math.random()*options.length)]);
}
function onTap(event){
  event.stopPropagation();
  if(ice){ice.touch();return;}
  if(!actor)return;
  touchStage=touchStage%3+1;
  play('tap'+touchStage);
}
function sync(){
  if(!theme()){
    if(mount)clearAll();
    return;
  }
  var current=stage();
  if(mount&&mount.isConnected&&stageNow===current){
    if(ice)ice.update(dayPre());
    regulate();
    return;
  }
  clearAll();
  var myGeneration=++generation;
  stageNow=current;
  var login=document.getElementById('loginScreen');
  if(!login)return;
  // Utilizar el SVG que ya está en el HTML, sin crear otro contenedor.
  var element=login.querySelector('.nv-mascota');
  if(!element)return;
  element.classList.remove('nv-mascota-congelada','nv-mascota-libre','nv-mascota-bloque');
  mount=element;
  try{
    var svg=element.querySelector('svg');
    if(!svg)throw Error('SVG integrado no encontrado');
    if(typeof GreenActor!=='function')throw Error('GreenActor no disponible');
    actor=new GreenActor(svg,{initialScene:'idle'});
    if(current==='pre'){
      if(!window.NavidadHielo)throw Error('NavidadHielo no disponible');
      // El cuerpo está atrapado; los ojos se animan por CSS sobre esta pose fija.
      actor.pause();
      ice=window.NavidadHielo.create(dayPre(),element);
      element.classList.add('nv-mascota-congelada','nv-mascota-bloque');
    }else{
      element.classList.add('nv-mascota-libre');
    }
    svg.addEventListener('pointerdown',onTap);
    observer=new MutationObserver(regulate);
    observer.observe(login,{attributes:true,attributeFilter:['class']});
    regulate();
    if(current==='casa'&&isDate(12,24))later(function(){play('xmas');},1400);
    if(current==='ano'&&isDate(12,31))later(function(){if(actor&&!ice)actor.play('nye');},1400);
  }catch(error){
    console.warn('Mascota navideña:',error);
    if(mount===element)clearAll();
  }
}
window.__mascotaNavidadSync=sync;
window.__mascotaNavidadPlay=play;
window.__mascotaNavidadTap=function(){onTap({stopPropagation:function(){}});};
window.__mascotaNavidadEstado=function(){return {etapa:stageNow,congelada:!!ice,dia:ice?Number(ice.node.dataset.dia):null,escena:actor?.scene||null};};
// Solo para previsualizar mientras el tema está en "Ver ahora" (local).
window.__mascotaNavidadPreviewDia=function(day){
  var t=window.__temas;
  if(!t||t.modo!=='ver'||stage()!=='pre')return false;
  var n=Number(day);if(!Number.isInteger(n)||n<1||n>21)return false;
  previewDay=n;if(ice)ice.update(dayPre());
  return true;
};
document.addEventListener('visibilitychange',function(){if(!document.hidden)sync();else regulate();});
document.addEventListener('DOMContentLoaded',sync);
setInterval(function(){if(mount&&theme())sync();},60*1000);
setInterval(routine,19*1000);
})();