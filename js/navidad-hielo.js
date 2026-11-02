/* Pre-Navidad: gran bloque SVG pre-renderizado en el HTML (visible incluso sin JS).
   Se derrite por la fecha: 1 de diciembre completamente congelado;
   21 de diciembre queda una base pequeña; 22 queda libre. */
(function(){
'use strict';
var MIN=1,MAX=21;
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function create(day,element){
  var node=element&&element.querySelector('.nv-hielo-fijo');
  if(!node)throw new Error('Falta el bloque de hielo del HTML');
  var mask=node.querySelector('#nvice-melt-mask');
  var cracks=node.querySelector('#nvice-cracks');
  var puddle=node.querySelector('#nvice-puddle');
  if(!mask||!cracks||!puddle)throw new Error('El SVG del bloque está incompleto');
  var timer=0;
  function update(d){
    var n=clamp(Math.round(Number(d)||MIN),MIN,MAX);
    var progress=(n-MIN)/(MAX-MIN);
    // Antes de la liberación, 10% de hielo permanece en la base.
    var y=Math.round(965*Math.pow(progress,1.13));
    // El borde de fusión es una curva ondulada, no una desaparición rectangular.
    mask.setAttribute('d',
      'M0 '+y+' Q95 '+(y-13)+' 196 '+(y+6)+' T399 '+(y-5)+
      ' T607 '+(y+8)+' T800 '+y+' L800 1067 L0 1067 Z');
    cracks.setAttribute('opacity',String(clamp((progress-.08)*1.5,0,.95)));
    puddle.setAttribute('opacity',String(clamp(progress*1.08,0,.94)));
    node.dataset.dia=String(n);
    node.dataset.derretido=String(Math.round(progress*100));
    node.style.setProperty('--nv-progreso',progress);
    return progress;
  }
  function touch(){
    node.classList.remove('nv-hielo-golpe');
    void node.offsetWidth;
    node.classList.add('nv-hielo-golpe');
    clearTimeout(timer);
    timer=setTimeout(function(){node.classList.remove('nv-hielo-golpe');},650);
  }
  update(day);
  return {
    node:node,update:update,touch:touch,
    destroy:function(){clearTimeout(timer);node.classList.remove('nv-hielo-golpe');}
  };
}
window.NavidadHielo={create:create};
})();