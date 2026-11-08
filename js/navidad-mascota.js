/* Historia visual del login: sin leer credenciales ni modificar autenticación. */
(function(){
'use strict';
var mount=null,actor=null,ice=null,environment=null,observer=null,login=null,form=null;
var stageNow='',previewDay=null,touchStage=0,flow=null,nap=28,manualRemaining=0,focusTarget=null,moodWait=7,moodIndex=0;
var frostTimer=0;
var world=null;
var previewPaused=false;
var media=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)'),reduced=!!media?.matches;
function theme(){var t=window.__temas;return t?.activo?.id==='navidad'?t:null;}
function stage(){var t=theme();return t&&t.etapaDe(t.activo)?.id||'';}
function preview(){return theme()?.modo==='ver';}
function seasonKey(){return 'innova_nv_liberado_'+new Date().getFullYear();}
function dayPre(){var d=new Date();if(preview())return previewDay===null?1:previewDay;return d.getMonth()===11&&d.getDate()<=21?d.getDate():1;}
function giftDay(){var d=new Date();return d.getMonth()===11&&d.getDate()>=24;}
function shouldIntroduce(){if(preview())return true;try{return localStorage.getItem(seasonKey())!=='1';}catch(e){return true;}}
function stopStory(){if(environment)environment.restore();actor?.reachFor?.(null);if(mount){delete mount.dataset.historia;delete mount.dataset.gesto;}flow=null;manualRemaining=0;nap=28;moodWait=7;}
function idle(){if(!actor)return;if(mount)delete mount.dataset.gesto;actor.play(stageNow==='ano'?'nye':'idle');}
function clearAll(){
  clearTimeout(frostTimer);frostTimer=0;
  if(world){world.destroy();world=null;}
  stopStory();if(observer){observer.disconnect();observer=null;}
  if(form){form.removeEventListener('focusin',onFocus);form.removeEventListener('focusout',onBlur);}
  if(actor){actor.svg.removeEventListener('pointerdown',onTap);actor.svg.removeEventListener('keydown',onKey);actor.destroy();actor=null;}
  if(ice){ice.destroy();ice=null;}if(environment){environment.destroy();environment=null;}
  if(mount){mount.classList.remove('nv-mascota-ojos-pausa','nv-mascota-congelada','nv-mascota-libre','nv-mascota-bloque');delete mount.dataset.historia;delete mount.dataset.reaccion;delete mount.dataset.mirada;}
  mount=login=form=focusTarget=null;stageNow='';touchStage=0;moodIndex=0;
  previewPaused=false;
}
function regulate(){
  if(!actor)return;
  var hidden=reduced||document.hidden||!login?.classList.contains('active');
  if(hidden)mount.classList.add('nv-mascota-ojos-pausa');else mount.classList.remove('nv-mascota-ojos-pausa');
  if(hidden)world?.suspend();
  // Dejar el foco de la escena tal como estaba al abandonar el login.
  if(!login?.classList.contains('active')&&flow&&flow.kind!=='liberacion'){stopStory();idle();}
  if(ice||hidden||previewPaused)actor.pause();else actor.resume();
}
function startStory(kind){
  if(!actor||ice||reduced||focusTarget||stageNow!=='casa')return false;
  stopStory();
  if(kind!=='liberacion'&&(!environment||!environment.start())){idle();return false;}
  flow={kind:kind,time:0,phase:0};mount.dataset.historia=kind;
  actor.play(kind==='liberacion'?'thaw':kind==='regalo'?'offer':'sneak');
  aim();
  return true;
}
function aim(){
  var target=environment?.target?.(),p=target&&window.NavidadEntorno?.point(actor.svg,target);
  if(p)actor.reachFor?.(p);
}
function reactToWorld(detail){
  if(ice){if(['nieve','ambiente','foco','casa'].includes(detail.kind)){mount.dataset.reaccion='frio';clearTimeout(frostTimer);frostTimer=setTimeout(function(){if(mount)delete mount.dataset.reaccion;frostTimer=0;},3200);}return;}
  if(!actor||focusTarget)return;
  if(flow?.kind==='travesura'){if(detail.kind!=='santa')caught();return;}
  if(flow)return;
  if(detail.kind==='adorno'){startStory('travesura');return;}
  play(['estrella','destello'].includes(detail.kind)?'caught':detail.kind==='santa'?'grump':'plot');
  var p=window.NavidadEntorno?.point(actor.svg,detail);if(p)actor.lookAt?.(p,3.5);
}
function caught(){
  if(environment)environment.release();actor?.reachFor?.(null);flow={kind:'descubierto',time:0,phase:0};mount.dataset.historia='descubierto';actor.play('caught');
}
function finishStory(){var first=flow?.kind==='liberacion';stopStory();delete mount.dataset.historia;idle();nap=first?2.4:28+Math.random()*8;}
function frame(info,dt){
  if(!actor||ice||reduced||document.hidden||!login?.classList.contains('active')||focusTarget)return;
  if(flow){
    flow.time+=dt;var t=flow.time;
    if(flow.kind==='liberacion'){
      if(t>=6.2){if(!preview())try{localStorage.setItem(seasonKey(),'1');}catch(e){}finishStory();}
    }else if(flow.kind==='travesura'){
      if(t>=2&&flow.phase===0){flow.phase=1;actor.play('tug');}
      aim();
      environment.pull(t);if(t>=8.6)caught();
    }else if(flow.kind==='descubierto'){
      environment.drop(t);if(t>=4.8)finishStory();
    }else if(flow.kind==='regalo'){
      aim();
      environment.give(t);if(t>=5)finishStory();
    }
    return;
  }
  if(manualRemaining>0){manualRemaining-=dt;if(manualRemaining<=0)idle();return;}
  if(actor.scene!=='idle'||stageNow!=='casa')return;
  nap-=dt;
  if(nap<=0){if(!startStory(giftDay()?'regalo':'travesura'))nap=28;return;}
  moodWait-=dt;
  if(moodWait<=0){
    var name=['grump','plot','plot','grump'][moodIndex++%4];
    actor.play(name);mount.dataset.gesto=name;manualRemaining=GreenActor.SCENES[name].duration;
    moodWait=11+Math.random()*6;
  }
}
function play(name){
  if(!actor||ice||reduced||focusTarget||!GreenActor.SCENES[name])return false;
  stopStory();delete mount.dataset.historia;actor.play(name);mount.dataset.gesto=name;
  if(!['idle','nye'].includes(name))manualRemaining=GreenActor.SCENES[name].duration+.25;
  return true;
}
function onTap(event){
  event.stopPropagation();if(ice){
    if(reduced||document.hidden||!login?.classList.contains('active'))return;
    // Primero clava la mirada; luego resopla. Nunca se mueve el cuerpo preso.
    ice.touch();mount.dataset.reaccion='molesto';clearTimeout(frostTimer);
    frostTimer=setTimeout(function(){if(mount)delete mount.dataset.reaccion;frostTimer=0;},3200);return;
  }
  if(!actor||reduced||focusTarget)return;
  if(flow?.kind==='travesura'){caught();return;}
  touchStage=touchStage%3+1;play('tap'+touchStage);
}
function onKey(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();onTap(event);}}
function onFocus(event){
  if(!actor)return;
  world?.resetGaze();
  if(ice){mount.dataset.mirada=event.target.id==='loginPin'?'apartada':'formulario';return;}
  focusTarget=event.target;stopStory();delete mount.dataset.historia;
  actor.play(event.target.id==='loginPin'?'privacy':'idle');regulate();
  // Con movimiento reducido mostrar directamente la pose final, sin transición.
  if(reduced&&event.target.id==='loginPin')actor.render(GreenActor.SCENES.privacy.duration);
}
function onBlur(event){
  if(ice){if(!event.relatedTarget||!form.contains(event.relatedTarget))delete mount.dataset.mirada;return;}
  focusTarget=event.relatedTarget&&form.contains(event.relatedTarget)?event.relatedTarget:null;
  if(actor&&!ice&&!focusTarget){idle();nap=28;regulate();}
}
function sync(){
  if(!theme()){if(mount)clearAll();return;}
  var current=stage();
  if(mount?.isConnected&&stageNow===current){if(ice)ice.update(dayPre());regulate();return;}
  clearAll();stageNow=current;login=document.getElementById('loginScreen');mount=login?.querySelector('.nv-mascota');
  if(!mount)return;
  try{
    var svg=mount.querySelector('svg');if(!svg||typeof GreenActor!=='function')throw Error('Motor o SVG no disponible');
    actor=new GreenActor(svg,{initialScene:'idle',embedded:true,personality:current==='casa',frozen:current==='pre',onFrame:frame});
    form=login.querySelector('.login-form');
    world=window.NavidadEntorno?.create(login,mount,{frozen:function(){return !!ice;},react:reactToWorld,busy:function(){return !!focusTarget||!!form?.contains(document.activeElement);},restoreFocus:function(){if(form?.contains(document.activeElement))onFocus({target:document.activeElement});}})||null;
    if(current==='pre'){
      ice=window.NavidadHielo.create(dayPre(),mount);actor.pause();mount.classList.add('nv-mascota-congelada','nv-mascota-bloque');
    }else{
      mount.classList.add('nv-mascota-libre');
      environment=window.NavidadHistoria.create(login,mount);
      if(current==='casa'&&shouldIntroduce())startStory('liberacion');
      else if(current==='casa'&&giftDay())nap=4;
      else if(current==='ano')actor.play('nye');
    }
    svg.addEventListener('pointerdown',onTap);svg.addEventListener('keydown',onKey);
    form?.addEventListener('focusin',onFocus);form?.addEventListener('focusout',onBlur);
    observer=new MutationObserver(regulate);observer.observe(login,{attributes:true,attributeFilter:['class']});
    if(form?.contains(document.activeElement))onFocus({target:document.activeElement});
    regulate();
  }catch(error){console.warn('Mascota navideña:',error);clearAll();}
}
window.__mascotaNavidadSync=sync;
window.__mascotaNavidadPlay=play;
window.__mascotaNavidadTap=function(){onTap({stopPropagation:function(){}});};
window.__mascotaNavidadEstado=function(){return {etapa:stageNow,congelada:!!ice,dia:ice?Number(ice.node.dataset.dia):null,escena:actor?.scene||null,historia:flow?.kind||null,tiempo:flow?.time||0};};
window.__mascotaNavidadPreviewDia=function(day){if(!preview()||stage()!=='pre')return false;var n=Number(day);if(!Number.isInteger(n)||n<1||n>21)return false;previewDay=n;if(ice)ice.update(dayPre());return true;};
// Solo pruebas locales mediante "Ver ahora"; no cambia fechas ni temas globales.
window.__mascotaNavidadHistoria=function(name){if(!preview()||!['liberacion','travesura','regalo'].includes(name))return false;return startStory(name);};
window.__mascotaNavidadPausa=function(paused){if(!preview()||ice)return false;previewPaused=!!paused;regulate();return true;};
window.__mascotaNavidadAvanzar=function(seconds){
  if(!preview()||ice||!actor||document.hidden||!Number.isFinite(seconds)||seconds<0||seconds>10)return false;
  actor.resume();for(var left=seconds;left>0;left-=.05)actor.frame((actor.last||performance.now())+Math.min(left,.05)*1000);
  return true;
};
document.addEventListener('visibilitychange',function(){if(!document.hidden)sync();else regulate();});
document.addEventListener('DOMContentLoaded',sync);
media?.addEventListener?.('change',function(event){reduced=event.matches;if(reduced&&actor&&!ice){stopStory();if(focusTarget?.id==='loginPin'){actor.play('privacy');actor.render(GreenActor.SCENES.privacy.duration);}else idle();}regulate();});
setInterval(function(){if(mount)sync();},60*1000);
})();
