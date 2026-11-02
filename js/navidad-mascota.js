/* Mascota navideña: montaje aislado del login. Requiere green-actor.js. */
(function(){
'use strict';
var mount=null, actor=null, generation=0, timers=[], touchStage=0;
function later(fn,delay){var id=setTimeout(fn,delay);timers.push(id);return id;}
function clearAll(){
  generation++;timers.forEach(clearTimeout);timers=[];
  if(actor){actor.destroy();actor=null;}
  if(mount){mount.remove();mount=null;}
}
function isChristmas(){
  var t=window.__temas,ls=document.getElementById('loginScreen');
  return !!(t&&t.activo&&t.activo.id==='navidad'&&ls);
}
function stage(){var t=window.__temas;var e=t&&t.etapaDe(t.activo);return e&&e.id;}
function isDate(month,day){var d=new Date();return d.getMonth()===month-1&&d.getDate()===day;}
function play(name){
  if(!actor)return;
  actor.play(name);
  if(name==='idle'||name==='nye'||name==='tantrum')return;
  var g=generation;
  var info=actor.getSceneInfo();
  later(function(){if(g===generation&&actor&&actor.scene===name)actor.play('idle');},Math.round((info.duration+0.35)*1000));
}
function routine(){
  if(!actor||document.hidden||!document.getElementById('loginScreen')?.classList.contains('active'))return;
  if(actor.scene!=='idle')return;
  var options=['sneak','steal','hide','climb','caught'];
  play(options[Math.floor(Math.random()*options.length)]);
}
function onTap(ev){
  if(!actor)return;
  ev.stopPropagation();
  touchStage=(touchStage%3)+1;
  play('tap'+touchStage);
}
async function setup(){
  if(!isChristmas()){clearAll();return;}
  if(mount&&mount.isConnected)return;
  clearAll();var own=++generation;
  var login=document.getElementById('loginScreen');
  var element=document.createElement('div');
  element.className='nv-mascota';element.setAttribute('aria-label','Personaje navideño interactivo');
  element.innerHTML='<div class="nv-mascota-cargando" aria-hidden="true"></div>';
  login.appendChild(element);mount=element;
  try{
    var resp=await fetch('assets/navidad/personaje-animable.svg');
    if(!resp.ok)throw new Error('SVG HTTP '+resp.status);
    var str=await resp.text();
    if(own!==generation||!isChristmas())return;
    var parser=new DOMParser(),svgDoc=parser.parseFromString(str,'image/svg+xml');
    if(svgDoc.querySelector('parsererror'))throw new Error('SVG inválido');
    var svg=document.importNode(svgDoc.documentElement,true);
    svg.removeAttribute('width');svg.removeAttribute('height');
    svg.setAttribute('aria-hidden','true');
    element.replaceChildren(svg);
    if(typeof GreenActor!=='function')throw new Error('Motor GreenActor no disponible');
    actor=new GreenActor(svg,{initialScene:'idle'});
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)actor.pause();
    svg.addEventListener('pointerdown',onTap);
    // En el día real, reproducir la escena una sola vez por visita.
    if(stage()==='casa'&&isDate(12,24))later(function(){if(actor)play('xmas');},1200);
    if(stage()==='ano'&&isDate(12,31))later(function(){if(actor)actor.play('nye');},1200);
  }catch(err){console.warn('Mascota navideña:',err);if(mount===element)clearAll();}
}
window.__mascotaNavidadSync=setup;
window.__mascotaNavidadPlay=play;
window.__mascotaNavidadTap=function(){if(actor)onTap({stopPropagation:function(){}});};
document.addEventListener('visibilitychange',function(){
 if(!actor)return;
 if(document.hidden)actor.pause();
 else if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)actor.resume();
});
document.addEventListener('DOMContentLoaded',function(){setup();});
setInterval(routine,19000);
})();