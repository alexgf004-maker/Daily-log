/* El bloque conserva caras y aristas mientras pierde altura y espesor.
   1 dic: hielo completo. 21 dic: última base. 22 dic: sin hielo. */
(function(){
'use strict';
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function create(day,element){
  var node=element&&element.querySelector('.nv-hielo-fijo');
  if(!node)throw new Error('Falta el bloque de hielo del HTML');
  var paths={};
  ['melt-mask','body','left','top','right','reflection','rim','cracks','puddle'].forEach(function(id){
    paths[id]=node.querySelector('#nvice-'+id);
    if(!paths[id])throw new Error('El SVG del bloque está incompleto: '+id);
  });
  var drops=node.querySelectorAll('.nv-hielo-gota'),timer=0;
  function point(x,y){return x.toFixed(1)+' '+y.toFixed(1);}
  function polygon(points){return 'M'+points.map(function(p){return point(p[0],p[1]);}).join('L')+'Z';}
  function update(d){
    var n=clamp(Math.round(Number(d)||1),1,22),progress=(Math.min(n,21)-1)/20;
    var top=55+837*Math.pow(progress,1.08),bottom=1010;
    var left=130+105*progress,right=675-100*progress;
    var bevel=Math.min(70,(bottom-top)*.2);
    var a=[left+bevel,top],b=[right-bevel,top-8*(1-progress)];
    var c=[right,top+bevel],e=[right-bevel,bottom],f=[left+bevel,bottom+8];
    var g=[left,bottom-bevel],h=[left+4,top+bevel*2.4];
    var frontL=[left+bevel+6,h[1]],frontR=[right-bevel*.9,top+bevel*2.2];
    var shape=polygon([a,b,c,[right-6,bottom-bevel],e,f,g,h]);
    paths['melt-mask'].setAttribute('d',shape);
    paths.body.setAttribute('d',shape);
    paths.left.setAttribute('d',polygon([a,h,g,f,[left+bevel*.8,bottom-bevel],frontL]));
    paths.top.setAttribute('d',polygon([a,b,c,frontR,frontL]));
    paths.right.setAttribute('d',polygon([frontR,c,[right-6,bottom-bevel],e]));
    paths.reflection.setAttribute('d',polygon([
      [frontL[0]+24,frontL[1]+18],[frontL[0]+99,frontL[1]-5],
      [left+bevel+46,bottom-bevel-28],[left+bevel+2,bottom-bevel+10]
    ]));
    paths.rim.setAttribute('d','M'+point(left+18,top+bevel*2)+'L'+point(a[0],top+12)+'L'+point(b[0],b[1]+13));
    paths.cracks.setAttribute('opacity',String(progress*.48));
    paths.puddle.setAttribute('opacity',String(progress*.9));
    drops.forEach(function(drop,i){
      // Caen desde las aristas actuales; nunca quedan suspendidas sobre hielo ya fundido.
      drop.style.translate=point(i?right-10:left+14,top+bevel*2.5).split(' ').join('px ')+'px';
    });
    node.style.display=n>=22?'none':'';
    node.dataset.dia=String(n);node.dataset.derretido=String(Math.round(progress*100));
    element.style.setProperty('--nv-frio',String(n>=22?0:1-progress));
    return progress;
  }
  function touch(){
    node.classList.remove('nv-hielo-golpe');void node.offsetWidth;
    node.classList.add('nv-hielo-golpe');clearTimeout(timer);
    timer=setTimeout(function(){node.classList.remove('nv-hielo-golpe');},650);
  }
  update(day);
  return {node:node,update:update,touch:touch,destroy:function(){
    clearTimeout(timer);node.classList.remove('nv-hielo-golpe');
    node.style.removeProperty('display');element.style.removeProperty('--nv-frio');
  }};
}
window.NavidadHielo={create:create};
})();
