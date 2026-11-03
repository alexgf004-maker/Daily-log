/* Hielo erosionado: volumen, escarcha, agua superficial y deshielo continuo.
   La fecha fija el volumen; solo las transiciones entre fechas se interpolan. */
(function(){
'use strict';
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function create(day,element){
  var node=element&&element.querySelector('.nv-hielo-fijo');
  if(!node)throw new Error('Falta el bloque de hielo del HTML');
  var paths={};
  ['melt-mask','body','left','top','right','reflection','rim','cracks','puddle',
   'frost-body','contour','runoff-a','runoff-b','wet-edge','ripple-a','ripple-b'].forEach(function(id){
    paths[id]=node.querySelector('#nvice-'+id);
    if(!paths[id])throw new Error('El SVG del bloque está incompleto: '+id);
  });
  var drops=node.querySelectorAll('.nv-hielo-gota'),timer=0,frameId=0,shown=null,target=null;
  var media=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  function paint(progress){
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
  function update(d){
    var n=clamp(Math.round(Number(d)||1),1,22),progress=(Math.min(n,21)-1)/20;
    node.style.display=n>=22?'none':'';
    node.dataset.dia=String(n);node.dataset.derretido=String(Math.round(progress*100));
    if(n>=22){cancel();target=progress;paint(progress);element.style.setProperty('--nv-frio','0');return progress;}
    if(target===progress)return progress;
    cancel();target=progress;
    if(shown===null||media?.matches||typeof requestAnimationFrame!=='function'){paint(progress);return progress;}
    var from=shown,started=null;
    function step(time){
      if(media?.matches||document.hidden){paint(progress);frameId=0;return;}
      if(started===null)started=time;
      var t=clamp((time-started)/950,0,1),eased=t*t*(3-2*t);
      paint(from+(progress-from)*eased);
      if(t<1)frameId=requestAnimationFrame(step);else frameId=0;
    }
    frameId=requestAnimationFrame(step);return progress;
  }
  function touch(){
    node.classList.remove('nv-hielo-golpe');void node.offsetWidth;
    node.classList.add('nv-hielo-golpe');clearTimeout(timer);
    timer=setTimeout(function(){node.classList.remove('nv-hielo-golpe');},650);
  }
  update(day);
  return {node:node,update:update,touch:touch,destroy:function(){
    cancel();clearTimeout(timer);node.classList.remove('nv-hielo-golpe');
    node.style.removeProperty('display');node.style.removeProperty('--nv-eau');element.style.removeProperty('--nv-frio');
  }};
}
window.NavidadHielo={create:create};
})();
