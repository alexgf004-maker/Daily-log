/* Objetos del login real. Solo se anima un foco existente de la guirnalda;
   el recorrido pasa por el margen exterior de la tarjeta y se restaura al salir. */
(function(){
'use strict';
var NS='http://www.w3.org/2000/svg';
function clamp(v){return Math.max(0,Math.min(1,v));}
function mix(a,b,p){return {x:a.x+(b.x-a.x)*p,y:a.y+(b.y-a.y)*p};}
function pointAt(points,p){
  var lengths=[],total=0;
  for(var i=1;i<points.length;i++){var d=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);lengths.push(d);total+=d;}
  var at=clamp(p)*total;
  for(i=0;i<lengths.length;i++){if(at<=lengths[i]||i===lengths.length-1)return mix(points[i],points[i+1],lengths[i]?at/lengths[i]:1);at-=lengths[i];}
  return points[0];
}
function create(login,mount){
  var source=null,layer=null,wire=null,lamp=null,previous='',last=null,dropFrom=null,stolen=false;
  function restore(){
    if(source)source.style.visibility=previous;
    if(layer)layer.remove();
    source=layer=wire=lamp=last=dropFrom=null;stolen=false;
  }
  function svg(tag,attrs,parent){var node=document.createElementNS(NS,tag);Object.keys(attrs).forEach(function(k){node.setAttribute(k,attrs[k]);});if(parent)parent.appendChild(node);return node;}
  function start(){
    restore();
    var lights=login.querySelectorAll('.nv-guirnalda .nv-luz');
    source=lights[lights.length-1];if(!source)return false;
    previous=source.style.visibility;
    layer=svg('svg',{'class':'nv-historia-capa','aria-hidden':'true'});login.appendChild(layer);
    wire=svg('path',{fill:'none',stroke:'#74915c','stroke-width':'1.2','stroke-linecap':'round','stroke-linejoin':'round',opacity:'.75'},layer);
    lamp=svg('g',{},layer);
    var color=source.getAttribute('fill')||'#ffd36b';
    svg('circle',{r:'11',fill:color,opacity:'.17'},lamp);
    svg('rect',{x:'-2',y:'-7',width:'4',height:'4',rx:'1',fill:'#566951'},lamp);
    svg('circle',{r:'4.5',fill:color},lamp);
    svg('circle',{cx:'-1.2',cy:'-1.4',r:'1.1',fill:'#fff5dc',opacity:'.85'},lamp);
    lamp.style.display='none';return true;
  }
  function geometry(){
    if(!source?.isConnected||!layer?.isConnected)return null;
    var r=login.getBoundingClientRect(),b=source.getBoundingClientRect(),f=login.querySelector('.login-form').getBoundingClientRect();
    var m=mount.getBoundingClientRect(),arm=mount.querySelector('#reach-arm'),ctm=arm&&arm.getScreenCTM();
    if(!ctm||!m.width)return null;
    var origin={x:r.left-login.scrollLeft,y:r.top-login.scrollTop};
    var anchor={x:b.left+b.width/2-origin.x,y:b.top+b.height/2-origin.y};
    var hand={x:ctm.a*571+ctm.c*588+ctm.e-origin.x,y:ctm.b*571+ctm.d*588+ctm.f-origin.y};
    var gutter=Math.min(login.clientWidth-5,Math.max(f.right-origin.x+9,hand.x+12));
    var corner={x:gutter,y:Math.max(f.bottom-origin.y+9,hand.y-18)};
    var route=[anchor,{x:gutter,y:anchor.y+22},corner,hand];
    layer.setAttribute('width',login.clientWidth);layer.setAttribute('height',Math.max(login.scrollHeight,login.clientHeight));
    return {anchor:anchor,hand:hand,route:route,corner:corner,floor:m.bottom-origin.y-9};
  }
  function draw(g,point,opacity,loose){
    if(!g)return;
    var route=g.route.slice();if(loose)route[route.length-1]=point;
    wire.setAttribute('d','M'+route.map(function(p){return p.x.toFixed(1)+' '+p.y.toFixed(1);}).join(' L'));
    wire.setAttribute('opacity',String(opacity));
    lamp.style.display='';lamp.setAttribute('transform','translate('+point.x.toFixed(1)+' '+point.y.toFixed(1)+')');last=point;
  }
  function pull(t){
    var g=geometry();if(!g)return;
    if(t<3.2){wire.setAttribute('opacity',String(clamp((t-1.8)/.8)*.75));wire.setAttribute('d','M'+g.route.map(function(p){return p.x+' '+p.y;}).join(' L'));return;}
    stolen=true;source.style.visibility='hidden';draw(g,pointAt(g.route,clamp((t-3.2)/3)),.75);
  }
  function release(){dropFrom=last;}
  function drop(t){
    if(!stolen||!dropFrom){restore();return;}
    var g=geometry();if(!g)return;
    var floor={x:dropFrom.x,y:Math.max(dropFrom.y,g.floor)};
    var path=[floor,g.corner,g.route[1],g.anchor];
    if(t<.65)draw(g,mix(dropFrom,floor,Math.pow(clamp(t/.65),2)),.6,true);
    else if(t<2.4)draw(g,pointAt(path,(t-.65)/1.75),.5,true);
    else restore();
  }
  function give(t){
    var g=geometry();if(!g)return;
    stolen=true;source.style.visibility='hidden';
    if(t>=3.8){restore();return;}
    draw(g,pointAt(g.route.slice().reverse(),clamp((t-.8)/3)),.65);
  }
  return {start:start,pull:pull,release:release,drop:drop,give:give,restore:restore,destroy:restore};
}
window.NavidadHistoria={create:create};
})();
