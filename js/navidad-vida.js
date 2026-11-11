/* Pausas y gestos autónomos compartidos por el login y el encabezado.
   Un solo temporizador; no mantiene un bucle de dibujo durante el reposo del hielo. */
(function(){
'use strict';
var sequences={
  pre:['icewatch','trapped','icehuff','icedoze'],
  casa:['lookaround','environment','hat','plot','doze','environment','scoff','thaw'],
  ano:['lookaround','plot','doze','thaw']
};
function create(options){
  var timer=0,stopped=false,cursor=0,first=true,running=false;
  function cancel(){clearTimeout(timer);timer=0;}
  function schedule(delay){if(!stopped&&!running&&!timer&&options.active())timer=setTimeout(tick,delay);}
  function tick(){
    timer=0;if(stopped||!options.active())return;
    if(options.busy()){schedule(1500);return;}
    var list=sequences[options.stage()]||sequences.casa,duration=0;
    // Sin objetos cercanos puede observar o gesticular por sí mismo.
    running=true;
    try{for(var i=0;i<list.length&&!duration;i++)duration=Number(options.run(list[cursor++%list.length]))||0;}
    finally{running=false;}
    first=false;schedule((duration+4+Math.random()*3)*1000);
  }
  return {
    sync:function(){if(!options.active())cancel();else schedule(first?2400:3000);},
    defer:function(){cancel();first=false;schedule(9500);},
    destroy:function(){stopped=true;cancel();}
  };
}
window.NavidadVida={create:create};
})();
