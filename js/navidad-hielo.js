/* Hielo erosionado: volumen, escarcha, agua superficial y deshielo continuo.
   La fecha fija el volumen; solo las transiciones entre fechas se interpolan. */
(function(){
'use strict';
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
// Los mismos puntos y curvas de los keyframes CSS, sin invalidar el SVG del hielo.
var DROP=[[0,.25,.3,0,0,0],[43,.25,.3,0,0,0],[51,.75,1,.85,0,0],[55,.7,1.2,.85,4,0],[75,.65,1.25,.65,0,1],[76,1.7,.2,0,0,1],[100,1.7,.2,0,0,1]];
var RING=[[0,.1,0],[75,.1,0],[78,.28,.7],[100,1.5,0]];
var RUNOFF=[[0,8],[8,8],[53,-100],[100,-100]],WET=[[0,0],[8,0],[14,1],[40,1],[65,0],[100,0]];
var PALMS=[[0,0],[10,0],[25,.8],[40,.8],[48,.3],[58,.8],[72,.3],[100,0]];
var BREATH=[[0,0],[18,.9],[32,.9],[65,.6],[100,0]],FOG=[[0,.12,.12,0],[26,1,1,0],[100,1.65,1.3,-12]];
function curve(t,x1,x2){
  // Cubic-bezier(x1,0,x2,1), resuelto por bisección (entrada ya acotada).
  var lo=0,hi=1,u=t;for(var i=0;i<15;i++){var v=1-u,x=3*v*v*u*x1+3*v*u*u*x2+u*u*u;if(x<t)lo=u;else hi=u;u=(lo+hi)/2;}
  return 3*(1-u)*u*u+u*u*u;
}
function sample(keys,percent,easing){
  var a=keys[0],b=keys[keys.length-1];
  if(percent<=a[0])return a.slice(1);if(percent>=b[0])return b.slice(1);
  for(var i=1;i<keys.length;i++)if(percent<keys[i][0]){a=keys[i-1];b=keys[i];break;}
  var t=(percent-a[0])/(b[0]-a[0]);
  if(easing==='out')t=curve(t,0,.58);else if(keys===DROP&&a[0]===55)t=curve(t,.42,1);
  return a.slice(1).map(function(v,j){return v+(b[j+1]-v)*t;});
}
function waterState(seconds,duration,offset,eau){
  var p=((seconds+(offset||0))%(duration||5.6)+(duration||5.6))%(duration||5.6)/(duration||5.6)*100;
  return {drop:sample(DROP,p),ring:sample(RING,p),offset:sample(RUNOFF,p)[0],wet:sample(WET,p)[0]*eau};
}
function waterLayer(node,mount,paths,drops,prefix){
  var doc=node.ownerDocument,svg=paths.body.ownerSVGElement;
  if(!doc?.createElement||!svg||typeof Path2D!=='function'||typeof Image!=='function'||typeof XMLSerializer!=='function')return null;
  var back=doc.createElement('canvas'),front=doc.createElement('canvas'),buffer=doc.createElement('canvas');
  var bc=back.getContext('2d'),fc=front.getContext('2d'),pc=buffer.getContext('2d');if(!bc||!fc||!pc)return null;
  node.querySelectorAll('.nv-hielo-agua').forEach(function(el){el.remove();});node.classList.remove('nv-hielo-canvas');
  back.className='nv-hielo-agua nv-hielo-agua-fondo';front.className='nv-hielo-agua nv-hielo-agua-frente';
  back.setAttribute('aria-hidden','true');front.setAttribute('aria-hidden','true');node.appendChild(back);node.appendChild(front);
  var visible=true,dead=false,ready=false,raf=0,last=null,drawn=-Infinity,time=0,revision=0,width=0,height=0,sx=1,sy=1;
  var data=null,puddle=null,breath=null,observer=null,mutation=null,reaction='',reactionAt=-Infinity,gesture='',palmsAt=-Infinity,pendingSize='';
  var reduced=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
  function part(id){return node.querySelector('#'+prefix+'nvice-'+id);}
  function paused(){return mount.classList.contains('nv-mascota-ojos-pausa')||!!reduced?.matches;}
  function active(){return !dead&&visible&&!document.hidden&&node.isConnected!==false&&node.style.display!=='none';}
  function cancel(){if(raf)cancelAnimationFrame(raf);raf=0;last=null;}
  function wake(){if(active()&&ready&&!paused()&&!raf){if(last===null)last=performance.now();raf=requestAnimationFrame(tick);}}
  function geometry(){
    data={clip:new Path2D(paths['melt-mask'].getAttribute('d')),edge:new Path2D(paths['wet-edge'].getAttribute('d')),
      eau:parseFloat(node.style.getPropertyValue('--nv-eau')),puddle:Number(paths.puddle.getAttribute('opacity')),water:[]};
    drops.forEach(function(drop,i){
      var position=drop.style.translate.split(' ').map(parseFloat),runoff=paths[i?'runoff-b':'runoff-a'];
      data.water.push({x:position[0],y:position[1],fall:parseFloat(drop.style.getPropertyValue('--nv-chute')),
        drop:new Path2D(drop.getAttribute('d')),runoff:new Path2D(runoff.getAttribute('d')),unit:runoff.getTotalLength()/100,
        cx:Number(paths[i?'ripple-b':'ripple-a'].getAttribute('cx')),cy:i?1022:1023,rx:i?32:38});
    });
  }
  function clear(context){context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,width,height);context.setTransform(sx,0,0,sy,0,0);context.globalAlpha=1;}
  function draw(stamp){
    if(!active()||!ready||!data)return;
    drawn=stamp===undefined?performance.now():stamp;
    clear(pc);pc.drawImage(puddle,0,0,800,1067);pc.strokeStyle='#dffaff';pc.lineWidth=2.5;
    var states=data.water.map(function(_,i){return waterState(time,i?6.7:5.6,i?2.35:0,data.eau);});
    data.water.forEach(function(w,i){var state=states[i].ring;if(!state[1])return;
      pc.save();pc.globalAlpha=state[1];pc.translate(w.cx,w.cy);pc.scale(state[0],state[0]);pc.beginPath();pc.ellipse(0,0,w.rx,i?7:8,0,0,Math.PI*2);pc.stroke();pc.restore();
    });
    clear(bc);bc.globalAlpha=data.puddle;bc.drawImage(buffer,0,0,800,1067);
    clear(fc);fc.save();fc.clip(data.clip);fc.lineWidth=3;fc.lineCap='round';fc.strokeStyle='#f0fcff';
    data.water.forEach(function(w,i){var state=states[i];if(!state.wet)return;
      fc.globalAlpha=state.wet;fc.setLineDash([8*w.unit,100*w.unit]);fc.lineDashOffset=state.offset*w.unit;fc.stroke(w.runoff);
    });
    fc.setLineDash([]);fc.lineDashOffset=0;
    var age=(time-reactionAt-.35)/2.6*100;
    if(age>=0&&age<=100){var opacity=sample(BREATH,age,'out')[0],fog=sample(FOG,age,'out');
      fc.save();fc.globalAlpha=opacity;fc.translate(405,440+fog[2]);fc.scale(fog[0],fog[1]);fc.drawImage(breath,-405,-440,800,1067);fc.restore();
    }
    age=(time-palmsAt)/3.6*100;
    if(age>=0&&age<=100){fc.globalAlpha=sample(PALMS,age,'out')[0];fc.strokeStyle='#effcff';fc.lineWidth=5;
      fc.beginPath();fc.ellipse(215,530,27,32,0,0,Math.PI*2);fc.stroke();fc.beginPath();fc.ellipse(605,530,27,32,0,0,Math.PI*2);fc.stroke();
    }
    fc.globalAlpha=.55;fc.strokeStyle='#effcff';fc.lineWidth=5;fc.stroke(data.edge);fc.restore();
    fc.fillStyle='#ceeffa';fc.strokeStyle='#f0fcff';fc.lineWidth=1.5;
    data.water.forEach(function(w,i){var d=states[i].drop;if(!d[2])return;
      fc.save();fc.translate(w.x,w.y+d[3]+w.fall*d[4]);fc.scale(d[0],d[1]);fc.globalAlpha=d[2];fc.fill(w.drop);fc.globalAlpha=d[2]*.8;fc.stroke(w.drop);fc.restore();
    });
  }
  function tick(now){
    raf=0;if(!active()||paused()||!ready){last=null;return;}
    if(last!==null)time+=Math.max(0,now-last)/1000;last=now;
    if(now-drawn>=1000/30-.001)draw(now);wake();
  }
  function picture(partNode,removeRings,w,h){
    var source=doc.createElementNS('http://www.w3.org/2000/svg','svg');source.setAttribute('xmlns','http://www.w3.org/2000/svg');
    source.setAttribute('viewBox','0 0 800 1067');source.setAttribute('preserveAspectRatio','none');source.setAttribute('width',String(w));source.setAttribute('height',String(h));
    source.appendChild(svg.querySelector('defs').cloneNode(true));var copy=partNode.cloneNode(true);copy.setAttribute('opacity','1');
    if(removeRings)copy.querySelectorAll('.nv-hielo-onda').forEach(function(r){r.remove();});source.appendChild(copy);
    return new Promise(function(resolve,reject){var image=new Image();image.onload=function(){resolve(image)};image.onerror=reject;
      image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(source));
    });
  }
  function resize(){
    if(!active())return;
    var rect=node.getBoundingClientRect(),dpr=Math.min(1.5,window.devicePixelRatio||1),w=Math.ceil(rect.width*dpr),h=Math.ceil(rect.height*dpr);
    var size=w+'x'+h;
    if(!w||!h||w===width&&h===height&&ready||pendingSize===size)return;
    var token=++revision;pendingSize=size;
    Promise.all([picture(paths.puddle,true,w,h),picture(part('breath'),false,w,h)]).then(function(images){
      if(dead||token!==revision||!active())return;
      pendingSize='';puddle=images[0];breath=images[1];width=w;height=h;sx=w/800;sy=h/1067;
      for(var surface of [back,front,buffer]){surface.width=w;surface.height=h;}
      // Capturar la fase una sola vez antes de retirar las animaciones originales.
      if(!ready)time=(drops[0]?.getAnimations?.()[0]?.currentTime||0)/1000;
      ready=true;geometry();node.classList.add('nv-hielo-canvas');draw();wake();
    }).catch(function(){if(token===revision){pendingSize='';ready=false;cancel();node.classList.remove('nv-hielo-canvas');}});
  }
  function changes(records){
    var next=mount.dataset.reaccion||'',nextGesture=mount.dataset.gesto||mount.dataset.accion||'';
    if(next!==reaction||records.some(function(r){return r.attributeName==='data-reaccion'&&r.oldValue===null;})){
      reaction=next;reactionAt=['frio','molesto'].includes(next)?time:-Infinity;
    }
    if(nextGesture!==gesture||records.some(function(r){return ['data-gesto','data-accion'].includes(r.attributeName)&&r.oldValue===null;})){
      gesture=nextGesture;palmsAt=gesture==='trapped'?time:-Infinity;
    }
    if(!active()||paused())cancel();else{resize();wake();}
  }
  if(typeof ResizeObserver==='function'){observer=new ResizeObserver(resize);observer.observe(node);}
  if(typeof MutationObserver==='function'){mutation=new MutationObserver(changes);mutation.observe(mount,{attributes:true,attributeOldValue:true,attributeFilter:['class','data-reaccion','data-gesto','data-accion']});}
  return {refresh:function(){if(dead)return;geometry();if(!active()){cancel();return;}resize();if(ready&&paused())draw();wake();},setVisible:function(value){
    if(dead)return;visible=!!value;if(!active()){revision++;pendingSize='';cancel();}else{geometry();resize();if(ready&&paused())draw();wake();}
  },destroy:function(){dead=true;revision++;cancel();observer?.disconnect();mutation?.disconnect();back.remove();front.remove();node.classList.remove('nv-hielo-canvas');puddle=breath=data=null;for(var surface of [back,front,buffer])surface.width=surface.height=1;}};
}
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
    source.setAttribute('preserveAspectRatio','none');
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
  var water=waterLayer(node,element,paths,drops,prefix);
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
    water?.refresh();
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
    water?.setVisible(active());
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
    destroyed=true;cancel();stopHit();water?.destroy();frost?.destroy();
    node.style.removeProperty('display');node.style.removeProperty('--nv-eau');element.style.removeProperty('--nv-frio');
  }};
}
window.NavidadHielo={create:create,cacheFrost:cacheFrost,waterLayer:waterLayer,waterState:waterState};
})();
