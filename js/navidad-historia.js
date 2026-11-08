/* La esfera pertenece al árbol: su mismo nodo pasa de la rama a la mano.
   No se copia ni se trae un foco desde el techo a través del formulario. */
(function(){
'use strict';
function create(login,mount){
  var tree=null,anchor=null,last=null,released=null,contact=false;
  function restore(){if(tree)tree.reset();tree=anchor=last=released=null;contact=false;}
  function start(){restore();tree=login.__nvArbol;anchor=tree?.target();if(!anchor){tree=null;return false;}return true;}
  function target(){return tree?.target()||null;}
  function hand(){
    var node=mount.querySelector('#hand-right'),m=node?.getScreenCTM();
    return m?{x:m.e,y:m.f}:null;
  }
  function pull(t){
    var a=target(),h=hand();if(!a||!h)return;
    if(!contact&&t>=2.8&&Math.hypot(h.x-a.x,h.y-a.y)<=Math.max(5,a.r))contact=true;
    if(contact){tree.move(h);last=h;}
  }
  function release(){released=last;}
  function drop(t){
    var a=target();if(!a||!released){restore();return;}
    // Vuelve por tensión de su hilo, con oscilación amortiguada.
    var decay=Math.exp(-1.5*t),swing=Math.cos(t*7.5)*decay;
    tree.move({x:a.x+(released.x-a.x)*swing,y:a.y+(released.y-a.y)*swing});
    if(t>=4.5)restore();
  }
  function give(t){
    var a=target(),h=hand();if(!a||!h)return;
    if(t<1.1)return;
    if(!contact&&Math.hypot(h.x-a.x,h.y-a.y)<=Math.max(5,a.r))contact=true;
    if(contact){tree.move(h);last=h;}
    if(t>=3.8){release();drop((t-3.8)*4);}
  }
  return {start:start,target:target,pull:pull,release:release,drop:drop,give:give,restore:restore,destroy:restore};
}
window.NavidadHistoria={create:create};
})();
