/* Montaje de la mascota navideña, aislado del login y del sistema de temas. */
(function(){
'use strict';
var mount=null,actor=null,ice=null,observer=null,stageNow='',generation=0,timers=[],touchStage=0,previewDay=null;
var reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
function later(fn,ms){var id=setTimeout(fn,ms);timers.push(id);return id;}
function theme(){var t=window.__temas;return t&&t.activo&&t.activo.id==='navidad'?t:null;}
function stage(){var t=theme();return t&&t.etapaDe(t.activo)?.id||'';}
function isDate(month,day){var d=new Date();return d.getMonth()===month-1&&d.getDate()===day;}
function dayPre(){
  var d=new Date(),t=window.__temas;
  // Fuera de diciembre, "Ver ahora" enseña el día 10 como muestra.
  if(t&&t.modo==='ver'&&previewDay!==null)return previewDay;
  return d.getMonth()===11&&d.getDate()<=21?d.getDate():10;
}
function clearAll(){
  generation++;timers.forEach(clearTimeout);timers=[];
  if(observer){observer.disconnect();observer=null;}
  if(actor){actor.destroy();actor=null;}
  if(ice){ice.destroy();ice=null;}
  if(mount){mount.remove();mount=null;}
  stageNow='';touchStage=0;
}
function regulate(){
  if(!actor)return;
  var login=document.getElementById('loginScreen');
  if(ice||reduced||document.hidden||!login?.classList.contains('active'))actor.pause();
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
  if(!actor||ice||document.hidden||!document.getElementById('loginScreen')?.classList.contains('active'))return;
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
async function sync(){
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
  var element=document.createElement('div');
  element.className='nv-mascota';
  element.setAttribute('aria-label',current==='pre'?'Criatura navideña atrapada en hielo':'Criatura navideña interactiva');
  login.appendChild(element);mount=element;
  try{
    // SVG integrado: evita fallos por rutas, caché o peticiones en el login.
    var source=window.__nvMascotaSprite;
    if(!source)throw Error('Sprite vectorial no disponible');
    if(myGeneration!==generation||!theme()||stage()!==current)return;
    var xml=new DOMParser().parseFromString(source,'image/svg+xml');
    if(xml.querySelector('parsererror'))throw Error('SVG inválido');
    var svg=document.importNode(xml.documentElement,true);
    svg.removeAttribute('width');svg.removeAttribute('height');svg.setAttribute('aria-hidden','true');
    element.replaceChildren(svg);
    if(typeof GreenActor!=='function')throw Error('GreenActor no disponible');
    actor=new GreenActor(svg,{initialScene:'idle'});
    if(current==='pre'){
      if(!window.NavidadHielo)throw Error('NavidadHielo no disponible');
      // El personaje está atrapado: detener por completo su movimiento.
      actor.pause();
      ice=window.NavidadHielo.create(dayPre());
      element.appendChild(ice.node);
      element.classList.add('nv-mascota-congelada');
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
document.addEventListener('visibilitychange',regulate);
document.addEventListener('DOMContentLoaded',sync);
setInterval(function(){if(mount&&theme())sync();},60*1000);
setInterval(routine,19*1000);
})();