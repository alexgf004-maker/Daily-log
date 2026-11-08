/* Reacciones espaciales del personaje. Solo escucha decoración del login;
   no lee campos ni cambia temas, fechas, autenticación o marcajes. */
(function(){
'use strict';
function point(svg,p){
  var m=svg?.getScreenCTM?.();if(!m)return null;var d=m.a*m.d-m.b*m.c;if(!d)return null;
  var x=p.x-m.e,y=p.y-m.f;return {x:(m.d*x-m.c*y)/d,y:(m.a*y-m.b*x)/d};
}
function create(login,mount,options){
  var timer=0,lightTimer=0,last=0,turn=0,stopped=false,source=null,sourceTimer=0,switched=new Set();
  var reduced=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function active(){return !stopped&&!reduced()&&!document.hidden&&login.classList.contains('active');}
  function clearSource(){clearTimeout(sourceTimer);sourceTimer=0;source?.classList?.remove('nv-foco-llamada');source=null;}
  function resetGaze(){
    clearTimeout(timer);timer=0;if(mount.dataset.mirada==='entorno')delete mount.dataset.mirada;
    mount.style.removeProperty('--nv-mirada-x');mount.style.removeProperty('--nv-mirada-y');
  }
  function react(detail){
    if(!active()||!Number.isFinite(detail?.x)||!Number.isFinite(detail?.y))return false;
    last=Date.now();
    if(options.frozen()){
      // Restar la mirada que estaba en curso: la dirección final corresponde al objeto.
      var target=point(mount.querySelector('svg'),detail);if(!target)return false;
      var dx=target.x-400,dy=target.y-325,len=Math.hypot(dx,dy)||1,auto={x:0,y:0};
      var pupil=mount.querySelector('#'+(options.idPrefix||'')+'pupil-left');
      if(pupil&&typeof getComputedStyle==='function'){
        var parts=getComputedStyle(pupil).translate.split(/\s+/);auto={x:parseFloat(parts[0])||0,y:parseFloat(parts[1])||0};
      }
      mount.style.setProperty('--nv-mirada-x',(12*dx/len-auto.x+5).toFixed(2)+'px');
      mount.style.setProperty('--nv-mirada-y',(9*dy/len-auto.y).toFixed(2)+'px');
      mount.dataset.mirada='entorno';clearTimeout(timer);
      timer=setTimeout(function(){resetGaze();options.restoreFocus?.();},detail.kind==='nieve'?1900:2800);
    }
    if(detail.color&&/^#[\da-f]{3,8}$/i.test(detail.color)){
      mount.style.setProperty('--nv-reflejo',detail.color);mount.dataset.reflejo='foco';clearTimeout(lightTimer);
      lightTimer=setTimeout(function(){delete mount.dataset.reflejo;mount.style.removeProperty('--nv-reflejo');lightTimer=0;},1300);
    }
    options.react?.(detail);return true;
  }
  function event(e){react(e.detail);}
  function light(e){
    var bulb=e.target?.closest?.('.nv-foco-interactivo,'+(options.lightSelector||'.nv-fq,.nv-casita'));if(!bulb||!login.contains(bulb))return;
    bulb=bulb.closest?.('.nv-foco-interactivo')||bulb;
    var button=bulb.classList.contains('nv-foco-interactivo')?bulb:null;
    if(button&&!options.frozen()&&e.type==='pointerdown')return;
    if(e.type==='keydown'&&(!button||!['Enter',' '].includes(e.key)))return;
    if(!login.classList.contains('active')||document.hidden)return;
    var off=null;
    if(button&&!options.frozen()){
      if(e.type==='keydown')e.preventDefault();
      off=!button.classList.contains('nv-luz-apagada');
      if(off)button.classList.add('nv-luz-apagada');else button.classList.remove('nv-luz-apagada');
      button.setAttribute('aria-pressed',String(!off));button.setAttribute('aria-label',off?'Encender luz navideña':'Apagar luz navideña');switched.add(button);
    }
    var b=bulb.getBoundingClientRect(),color=bulb.querySelector('.vid,.nv-luz,.nvc-luz')?.getAttribute('fill');
    react({kind:bulb.classList.contains('nv-casita')?'casa':'foco',x:b.left+b.width/2,y:b.top+b.height/2,color:color||'#ffd38c',off:off});
  }
  function clickLight(e){if(e.target?.closest?.('.nv-foco-interactivo')&&!options.frozen())light(e);}
  function ambient(){
    if(!active()||!options.frozen()||Date.now()-last<10000||options.busy?.())return;
    var targets=options.lightSelector?login.querySelectorAll(options.lightSelector):turn++%2===0?login.querySelectorAll('.nv-fq.on,.nv-fq.off'):login.querySelectorAll('.nv-casita');
    targets=Array.from(targets).filter(function(el){var r=el.getBoundingClientRect();return r.width>0&&r.height>0;});
    if(!targets.length)return;
    var el=targets[Math.floor(targets.length*.65)],b=el.getBoundingClientRect();
    clearSource();source=el;source.classList?.add('nv-foco-llamada');sourceTimer=setTimeout(clearSource,3200);
    react({kind:'ambiente',x:b.left+b.width/2,y:b.top+b.height/2,color:el.querySelector?.('.vid')?.getAttribute('fill')||'#ffe0a6'});
  }
  function visibility(){if(document.hidden||!login.classList.contains('active')){clearTimeout(intro);resetGaze();clearSource();clearTimeout(lightTimer);lightTimer=0;delete mount.dataset.reflejo;mount.style.removeProperty('--nv-reflejo');}else if(options.frozen()){clearTimeout(intro);intro=setTimeout(ambient,1800);}}
  login.addEventListener('navidad:entorno',event);login.addEventListener('pointerdown',light,true);login.addEventListener('keydown',light);login.addEventListener('click',clickLight);
  document.addEventListener('visibilitychange',visibility);
  var intro=setTimeout(ambient,1800),interval=setInterval(ambient,12000);
  return {react:react,resetGaze:resetGaze,suspend:visibility,destroy:function(){stopped=true;clearTimeout(intro);clearSource();resetGaze();clearTimeout(lightTimer);clearInterval(interval);delete mount.dataset.reflejo;mount.style.removeProperty('--nv-reflejo');login.removeEventListener('navidad:entorno',event);login.removeEventListener('pointerdown',light,true);login.removeEventListener('keydown',light);login.removeEventListener('click',clickLight);switched.forEach(function(el){el.classList.remove('nv-luz-apagada');el.setAttribute('aria-pressed','true');el.setAttribute('aria-label','Apagar luz navideña');});switched.clear();document.removeEventListener('visibilitychange',visibility);}};
}
window.NavidadEntorno={create:create,point:point};
})();
