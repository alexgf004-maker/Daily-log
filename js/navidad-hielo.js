/* Hielo erosionado: volumen, escarcha, agua superficial y deshielo continuo.
   La fecha fija el volumen; solo las transiciones entre fechas se interpolan. */
(function(){
'use strict';
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
// El ruido de la escarcha es estático: resolverlo una vez al tamaño mostrado,
// no cada vez que una gota invalida el SVG. El original sirve de fallback.
function cacheFrost(node,path){
  var doc=node.ownerDocument,svg=path.ownerSVGElement;
  if(!doc?.createElementNS||!svg||typeof Image!=='function'||typeof XMLSerializer!=='function')return null;
  var canvas=doc.createElement('canvas'),context=canvas.getContext?.('2d');if(!context)return null;
  node.classList.remove('nv-escarcha-cache');node.querySelectorAll('.nv-escarcha-bitmap').forEach(function(el){el.remove();});
  var bitmap=doc.createElementNS('http://www.w3.org/2000/svg','image');
  bitmap.setAttribute('class','nv-escarcha-bitmap');bitmap.setAttribute('x','0');bitmap.setAttribute('y','0');
  bitmap.setAttribute('width','800');bitmap.setAttribute('height','1067');bitmap.setAttribute('pointer-events','none');
  path.parentNode.insertBefore(bitmap,path.nextSibling);
  var visible=true,dead=false,revision=0,key='',pending='',observer=null;
  function invalidate(){revision++;pending='';key='';node.classList.remove('nv-escarcha-cache');}
  function refresh(){
    if(dead||!visible||document.hidden)return;
    var rect=node.getBoundingClientRect(),dpr=Math.min(1.5,window.devicePixelRatio||1);
    if(!rect.width||!rect.height)return;
    var width=Math.max(1,Math.ceil(rect.width*dpr)),height=Math.max(1,Math.ceil(rect.height*dpr));
    var stamp=[width,height,path.getAttribute('d'),path.getAttribute('opacity')].join('|');
    if(stamp===key||stamp===pending)return;
    var token=++revision;pending=stamp;
    var source=doc.createElementNS('http://www.w3.org/2000/svg','svg');
    source.setAttribute('xmlns','http://www.w3.org/2000/svg');source.setAttribute('viewBox','0 0 800 1067');
    source.setAttribute('width',String(width));source.setAttribute('height',String(height));
    source.appendChild(svg.querySelector('defs').cloneNode(true));source.appendChild(path.cloneNode(true));
    var image=new Image();
    image.onload=function(){
      if(dead||token!==revision||!visible||document.hidden)return;
      try{
        canvas.width=width;canvas.height=height;context.clearRect(0,0,width,height);context.drawImage(image,0,0,width,height);
        bitmap.setAttribute('href',canvas.toDataURL('image/png'));
        key=stamp;pending='';node.classList.add('nv-escarcha-cache');
      }catch(error){pending='';node.classList.remove('nv-escarcha-cache');}
      // La superficie temporal no permanece asignada entre cambios de fecha.
      canvas.width=canvas.height=1;
    };
    image.onerror=function(){if(token===revision)pending='';};
    image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(source));
  }
  if(typeof ResizeObserver==='function'){observer=new ResizeObserver(refresh);observer.observe(node);}
  return {refresh:refresh,invalidate:invalidate,setVisible:function(value){
    visible=!!value;if(!visible){revision++;pending='';}else refresh();
  },destroy:function(){dead=true;revision++;observer?.disconnect();bitmap.remove();node.classList.remove('nv-escarcha-cache');canvas.width=canvas.height=1;}};
}
function create(day,element,options){
  var prefix=options?.idPrefix||'';
  var node=element&&element.querySelector('.nv-hielo-fijo');
  if(!node)throw new Error('Falta el bloque de hielo del HTML');
  var paths={};
  ['melt-mask','body','left','top','right','reflection','rim','cracks','puddle',
   'frost-body','contour','runoff-a','runoff-b','wet-edge','ripple-a','ripple-b'].forEach(function(id){
    paths[id]=node.querySelector('#'+prefix+'nvice-'+id);
    if(!paths[id])throw new Error('El SVG del bloque está incompleto: '+id);
  });
  var drops=node.querySelectorAll('.nv-hielo-gota'),timer=0,frameId=0,shown=null,target=null;
  var visible=true,destroyed=false,hit=null;
  var media=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  var frost=cacheFrost(node,paths['frost-body']);
  function paint(progress){
    frost?.invalidate();
    shown=progress;
    var top=52+870*Math.pow(progress,1.12),bottom=1014;
    var left=126+112*progress,right=674-120*progress,w=right-left,h=bottom-top;
    // Coordenadas normalizadas: los detalles y el agua siguen la superficie actual.
    function q(x,y){return (left+x*w).toFixed(1)+' '+(top+y*h).toFixed(1);}
    var erosion=progress*.1;
    var shape='M'+q(.16,0)+'C'+q(.3,-.015)+','+q(.4,.012+erosion)+','+q(.53,.006+erosion)+
      'C'+q(.7,-.018)+','+q(.81,-.005)+','+q(.88,.025)+'Q'+q(.965,.055)+','+q(.97,.14)+
      'C'+q(.996,.32)+','+q(.98,.44)+','+q(.99,.6)+'L'+q(.97,.91)+
      'Q'+q(.965,.98)+','+q(.85,.995)+'C'+q(.65,1)+','+q(.3,1.012)+','+q(.14,1)+
      'Q'+q(.035,.99)+','+q(.022,.93)+'C'+q(.01,.7)+','+q(-.008,.4)+','+q(.015,.22)+
      'Q'+q(.02,.08)+','+q(.16,0)+'Z';
    paths['melt-mask'].setAttribute('d',shape);paths.body.setAttribute('d',shape);
    paths['frost-body'].setAttribute('d',shape);
    paths['frost-body'].setAttribute('opacity',String(.92-progress*.38));
    paths.top.setAttribute('d','M'+q(.16,0)+'C'+q(.3,-.015)+','+q(.4,.012+erosion)+','+q(.53,.006+erosion)+
      'C'+q(.7,-.018)+','+q(.81,-.005)+','+q(.88,.025)+'Q'+q(.965,.055)+','+q(.97,.14)+
      'Q'+q(.9,.165)+','+q(.85,.19)+'C'+q(.58,.165)+','+q(.32,.23)+','+q(.105,.205)+
      'Q'+q(.04,.18)+','+q(.07,.13)+'Z');
    paths.left.setAttribute('d','M'+q(.16,0)+'Q'+q(.05,.1)+','+q(.015,.22)+
      'L'+q(.022,.93)+'Q'+q(.04,.99)+','+q(.14,1)+'Q'+q(.08,.64)+','+q(.105,.205)+'Z');
    paths.right.setAttribute('d','M'+q(.85,.19)+'Q'+q(.91,.15)+','+q(.97,.14)+'L'+q(.97,.91)+
      'Q'+q(.965,.98)+','+q(.85,.995)+'Q'+q(.9,.66)+','+q(.85,.19)+'Z');
    paths.reflection.setAttribute('d','M'+q(.18,.2)+'Q'+q(.26,.22)+','+q(.33,.205)+
      'C'+q(.2,.43)+','+q(.24,.74)+','+q(.14,.94)+'Q'+q(.11,.78)+','+q(.18,.2)+'Z');
    paths.contour.setAttribute('d','M'+q(.07,.26)+'Q'+q(.045,.52)+','+q(.065,.82)+
      'M'+q(.94,.28)+'Q'+q(.965,.55)+','+q(.93,.88));
    paths.rim.setAttribute('d','M'+q(.04,.28)+'Q'+q(.03,.12)+','+q(.16,.014)+
      'C'+q(.31,.002)+','+q(.4,.027+erosion)+','+q(.53,.02+erosion)+'M'+q(.55,.02)+
      'Q'+q(.78,.005)+','+q(.88,.04)+'M'+q(.14,.99)+'Q'+q(.35,1.003)+','+q(.53,.99));
    paths['wet-edge'].setAttribute('d','M'+q(.12,.205)+'C'+q(.33,.23)+','+q(.6,.165)+','+q(.85,.19));
    paths['runoff-a'].setAttribute('d','M'+q(.1,.21)+'C'+q(.09,.34)+','+q(.08,.48)+','+q(.035,.6)+'Q'+q(.015,.64)+','+q(.015,.69));
    paths['runoff-b'].setAttribute('d','M'+q(.88,.18)+'C'+q(.92,.36)+','+q(.91,.52)+','+q(.965,.63)+'Q'+q(.985,.67)+','+q(.985,.71));
    paths.cracks.setAttribute('opacity',String(.32+.22*Math.sin(progress*Math.PI)));
    paths.puddle.setAttribute('opacity',String(.2+progress*.8));
    // Las gotas salen de la pared y llegan al suelo; después se expanden las ondas.
    drops.forEach(function(drop,i){
      var x=i?right-w*.015:left+w*.015,y=top+h*(i?.71:.69);
      paths[i?'ripple-b':'ripple-a'].setAttribute('cx',x.toFixed(1));
      drop.style.translate=x.toFixed(1)+'px '+y.toFixed(1)+'px';
      drop.style.setProperty('--nv-chute',(1022-y).toFixed(1)+'px');
    });
    node.style.setProperty('--nv-eau',String(.38+progress*.62));
    element.style.setProperty('--nv-frio',String(1-progress));
  }
  function cancel(){if(frameId&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(frameId);frameId=0;}
  function active(){return !destroyed&&visible&&!document.hidden;}
  function stopHit(){hit?.cancel();hit=null;clearTimeout(timer);timer=0;node.classList.remove('nv-hielo-golpe','nv-hielo-waapi');}
  function setVisible(value){
    var wasActive=active();
    visible=!!value;
    if(!active()){cancel();stopHit();}
    // Los cambios de fecha ocultos se aplican una vez al regresar, sin reproducir
    // la transición que el usuario no vio ni avanzar relojes en segundo plano.
    else if(!wasActive&&target!==null&&shown!==target)paint(target);
    frost?.setVisible(active());
  }
  function update(d){
    var n=clamp(Math.round(Number(d)||1),1,22),progress=(Math.min(n,21)-1)/20;
    node.style.display=n>=22?'none':'';
    node.dataset.dia=String(n);node.dataset.derretido=String(Math.round(progress*100));
    if(n>=22){cancel();target=progress;if(active())paint(progress);element.style.setProperty('--nv-frio','0');return progress;}
    if(target===progress)return progress;
    cancel();target=progress;
    if(!active())return progress;
    if(shown===null||media?.matches||typeof requestAnimationFrame!=='function'){paint(progress);frost?.refresh();return progress;}
    var from=shown,started=null;
    function step(time){
      frameId=0;if(!active())return;
      if(media?.matches){paint(progress);frost?.refresh();return;}
      if(started===null)started=time;
      var t=clamp((time-started)/950,0,1),eased=t*t*(3-2*t);
      paint(from+(progress-from)*eased);
      if(t<1)frameId=requestAnimationFrame(step);else{frameId=0;frost?.refresh();}
    }
    frameId=requestAnimationFrame(step);return progress;
  }
  function touch(){
    if(!active()||media?.matches)return;
    stopHit();node.classList.add('nv-hielo-golpe');
    // Reiniciar el golpe exterior sin forzar layout con offsetWidth.
    if(typeof node.animate==='function'){node.classList.add('nv-hielo-waapi');hit=node.animate([
      {transform:'translateX(0)',offset:0},{transform:'translateX(-1.8px)',offset:.23},
      {transform:'translateX(1.2px)',offset:.52},{transform:'translateX(-.5px)',offset:.77},
      {transform:'translateX(0)',offset:1}
    ],{duration:550,easing:'ease-out'});}
    timer=setTimeout(stopHit,650);
  }
  update(day);
  return {node:node,update:update,touch:touch,setVisible:setVisible,destroy:function(){
    destroyed=true;cancel();stopHit();frost?.destroy();
    node.style.removeProperty('display');node.style.removeProperty('--nv-eau');element.style.removeProperty('--nv-frio');
  }};
}
window.NavidadHielo={create:create,cacheFrost:cacheFrost};
})();
