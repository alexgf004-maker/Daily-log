/* Presentación del actor: geometría de GreenActor, piezas SVG cacheadas y una
   superficie pequeña. El SVG sigue siendo la referencia de contactos y foco. */
(function(){
'use strict';
var NS='http://www.w3.org/2000/svg',IDENTITY=[1,0,0,1,0,0],PAD=0,VW=800,VH=1067;
var SKIP=/^(defs|title|desc|clippath|lineargradient|radialgradient|pattern|filter)$/i;
var BLINK=[[0,1],[22,1],[22.5,.07],[23.4,1],[59,1],[59.45,.07],[60.3,1],[61,1],[61.45,.07],[62.2,1],[100,1]];
var GAZE=[[0,0,0],[12,0,0],[13,-12,-4],[27,-12,-4],[28,-9,-2],[36,-9,-2],[39,0,0],[64,0,0],[65,10,0],[77,10,0],[78,7,-2],[87,7,-2],[90,0,0],[100,0,0]];
var FOG=[[0,0,0,.35],[43,0,0,.35],[46,.34,-2,.75],[57,0,-19,1.6],[59,0,0,.35],[100,0,0,.35]];
var FOG_TOUCH=[[0,0,0,.3],[14,0,0,.3],[24,.5,-2,.8],[85,0,-22,1.8],[100,0,-22,1.8]];
var TO_LINEAR=null;
function colorTables(){
 if(TO_LINEAR)return;TO_LINEAR=new Float32Array(256);
 for(var i=0;i<256;i++){var x=i/255;TO_LINEAR[i]=x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4);}
}
function multiply(a,b){return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
function transform(text){
 var out=IDENTITY;String(text||'').replace(/(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g,function(_,name,raw){
  var n=raw.trim().split(/[\s,]+/).map(Number),m=IDENTITY,r=n[0]*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
  if(name==='matrix')m=n;
  if(name==='translate')m=[1,0,0,1,n[0],n[1]||0];
  if(name==='scale')m=[n[0],0,0,n.length>1?n[1]:n[0],0,0];
  if(name==='rotate'){m=[c,s,-s,c,0,0];if(n.length>1)m=multiply(multiply([1,0,0,1,n[1],n[2]],m),[1,0,0,1,-n[1],-n[2]]);}
  if(name==='skewX')m=[1,0,Math.tan(r),1,0,0];if(name==='skewY')m=[1,Math.tan(r),0,1,0,0];
  out=multiply(out,m);return _;
 });return out;
}
function bezier(t,x1,y1,x2,y2){
 if(t<=0)return 0;if(t>=1)return 1;
 var lo=0,hi=1,u=t;
 for(var i=0;i<16;i++){var v=1-u,x=3*v*v*u*x1+3*v*u*u*x2+u*u*u;if(x<t)lo=u;else hi=u;u=(lo+hi)/2;}
 return 3*(1-u)*(1-u)*u*y1+3*(1-u)*u*u*y2+u*u*u;
}
function sample(keys,p,ease){
 var a=keys[0],b=keys[keys.length-1];if(p<=a[0])return a.slice(1);if(p>=b[0])return b.slice(1);
 for(var i=1;i<keys.length;i++)if(p<keys[i][0]){a=keys[i-1];b=keys[i];break;}
 var t=(p-a[0])/(b[0]-a[0]);if(ease)t=bezier(t,ease[0],ease[1],ease[2],ease[3]);
 return a.slice(1).map(function(v,j){return v+(b[j+1]-v)*t;});
}
function localUrl(s){return String(s||'').replace(/url\(["']?[^)]*#([^"')]+)["']?\)/g,'url(#$1)');}
function number(s,fallback){var n=parseFloat(s);return Number.isFinite(n)?n:fallback;}
function create(svg,options){
 options=options||{};var doc=svg?.ownerDocument,mount=svg?.parentElement;
 if(!doc?.createElementNS||!mount||typeof Path2D!=='function'||typeof Image!=='function'||typeof XMLSerializer!=='function')return null;
 var canvas=doc.createElement('canvas'),scene=doc.createElement('canvas');
 var gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false,stencil:false});
 var presentation=gl?null:canvas.getContext('2d'),context=scene.getContext('2d',{willReadFrequently:!gl});
 if(!context||!gl&&!presentation){options.report?.('Canvas no disponible');return null;}
 var dead=false,disabled=false,visible=true,ready=false,dirty=true,raf=0,last=null,lastDraw=-Infinity,revision=0,width=0,height=0,sx=1,sy=1;
 var nodes=new Set(Object.values(options.nodes||{}).filter(Boolean)),tree=[],defs='',gradientDefs=new Map(),geometry=new Map(),buffers=[];
 var cssTime=0,visibleTime=0,blinkAt=0,fogAt=0,pupilTime=0,cssActive=false,reaction='',reactionAt=-Infinity,look=[0,0],lookFrom=[0,0],lookTo=[0,0],lookAt=-1,cssState=null,pendingSize='';
 var resizeObserver=null,mutation=null,program=null,frameTexture=null,noiseTexture=null,quad=null,uniforms=null;
 var bounds=null,previousBounds=null,pixelOutput=null,noisePixels=null;
 var pathIDs=new Set(['lid-left','lid-right','brow-left','brow-right','expression-line','speech-mouth','cover-arm-left','cover-arm-right','cover-arm-shine',
  'arm-left-outline','arm-right-outline','arm-left-curve','arm-right-curve','arm-left-light','arm-right-light','leg-left-outline','leg-right-outline','leg-left-curve','leg-right-curve','leg-left-light','leg-right-light']);
 canvas.className='nv-actor-canvas';canvas.setAttribute('aria-hidden','true');
 function id(el){return el.getAttribute('data-nv-part')||String(el.id||'').replace(options.idPrefix||'','');}
 function active(){return !dead&&!disabled&&visible&&!document.hidden&&mount.isConnected;}
 function paused(){return mount.classList.contains('nv-mascota-ojos-pausa');}
 function cssEnabled(){return !!options.frozen&&!mount.dataset.gesto&&!mount.dataset.accion;}
 function cancel(){if(raf)cancelAnimationFrame(raf);raf=0;last=null;}
 function wake(){if(active()&&ready&&!raf){if(last===null)last=performance.now();raf=requestAnimationFrame(tick);}}
 function fallback(error){ready=false;pendingSize='';cancel();if(mount.classList.contains('nv-actor-pintado'))mount.classList.remove('nv-actor-pintado');canvas.remove();tree=[];geometry.clear();for(var layer of buffers)if(layer)layer.surface.width=layer.surface.height=1;if(error)options.report?.(String(error.message||error));}
 function shader(type,source){var sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){gl.deleteShader(sh);throw Error('Shader no disponible');}return sh;}
 function gpu(){
  var vs=shader(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}');
  var fs=shader(gl.FRAGMENT_SHADER,`precision highp float;
varying vec2 uv;uniform sampler2D picture;uniform sampler2D noise;uniform float sat;uniform float brightness;uniform float bend;
vec3 linearColor(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
void main(){vec2 d=(linearColor(texture2D(noise,uv).rgb).rg-.5)*vec2(7./800.,-7./1067.)*bend;vec2 q=uv+d;vec4 c=texture2D(picture,q);
if(q.x<0.||q.x>1.||q.y<0.||q.y>1.)c=vec4(0.);float l=dot(c.rgb,vec3(.213,.715,.072));gl_FragColor=vec4(mix(vec3(l),c.rgb,sat)*brightness,c.a);}`);
  program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Composición GPU no disponible');gl.useProgram(program);
  quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  var location=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
  function texture(unit){gl.activeTexture(gl.TEXTURE0+unit);var t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
  frameTexture=texture(0);noiseTexture=texture(1);uniforms={sat:gl.getUniformLocation(program,'sat'),brightness:gl.getUniformLocation(program,'brightness'),bend:gl.getUniformLocation(program,'bend')};
  gl.uniform1i(gl.getUniformLocation(program,'picture'),0);gl.uniform1i(gl.getUniformLocation(program,'noise'),1);gl.disable(gl.BLEND);
 }
 function image(source,hint){return new Promise(function(resolve,reject){var result=new Image();result.onload=function(){resolve(result);};result.onerror=function(){reject(Error('No se pudo preparar '+(hint||'la textura')));};result.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(source);});}
 function envelope(content,w,h,viewBox){return '<svg xmlns="'+NS+'" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" preserveAspectRatio="none" width="'+w+'" height="'+h+'" viewBox="'+viewBox+'">'+defs+content+'</svg>';}
 function collectDefinitions(){
  defs='';gradientDefs.clear();var serializer=new XMLSerializer();
  for(var el of svg.querySelectorAll('defs,clipPath'))if(!el.parentElement?.closest('defs'))defs+=serializer.serializeToString(el);
  for(var el of svg.querySelectorAll('linearGradient,radialGradient')){
   var stops=Array.from(el.querySelectorAll('stop')).map(function(stop){var style=getComputedStyle(stop),alpha=number(style.stopOpacity,1),color=style.stopColor;
    if(alpha!==1){var rgb=color.match(/[\d.]+/g);color='rgba('+rgb.slice(0,3).join(',')+','+alpha+')';}
    var raw=stop.getAttribute('offset')||'0';return [number(raw,0)/(raw.includes('%')?100:1),color];});
   gradientDefs.set(el.id,{el:el,stops:stops});
  }
 }
 function box(el){var b=el.getBBox();return {x:b.x,y:b.y,width:Math.max(.01,b.width),height:Math.max(.01,b.height)};}
 function changing(el){return nodes.has(el)||el.classList.contains('nv-eye-gaze')||el.classList.contains('nv-vaho')||id(el)==='cold-patina'||Array.from(el.children).some(changing);}
 async function compile(el,bakeX,bakeY){
  if(SKIP.test(el.localName))return null;var style=getComputedStyle(el);if(style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse')return null;
  var children=Array.from(el.children).filter(function(c){return !SKIP.test(c.localName);}),name=id(el);
  var node={el:el,id:name,opacity:number(style.opacity,1),matrixText:null,matrix:IDENTITY,clip:null,css:el.classList.contains('nv-eye-gaze')?'look':el.classList.contains('nv-vaho')?'fog':name};
  var clip=localUrl(style.clipPath).match(/#([^)]*)/);if(clip){var shape=svg.querySelector('[id="'+clip[1]+'"] path');if(shape)node.clip=new Path2D(shape.getAttribute('d'));}
  if(children.some(changing)){node.children=(await Promise.all(children.map(function(c){return compile(c,bakeX,bakeY);}))).filter(Boolean);return node;}
  if(el.localName==='path'&&pathIDs.has(name)){
   node.paint={fill:localUrl(style.fill),stroke:localUrl(style.stroke),width:number(style.strokeWidth,1),cap:style.strokeLinecap,join:style.strokeLinejoin,fillOpacity:number(style.fillOpacity,1),strokeOpacity:number(style.strokeOpacity,1),fillRule:style.fillRule};node.d=null;return node;
  }
  var b=box(el),pad=Math.max(3,number(style.strokeWidth,0)*2);b={x:b.x-pad,y:b.y-pad,width:b.width+pad*2,height:b.height+pad*2};
  var copy=el.cloneNode(true);copy.removeAttribute('transform');copy.removeAttribute('opacity');copy.style.removeProperty('transform');copy.style.removeProperty('opacity');
  for(var key of ['fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','fill-rule','font-family','font-size','font-weight'])if(!copy.hasAttribute(key))copy.setAttribute(key,localUrl(style.getPropertyValue(key)));
  node.image=await image(envelope(new XMLSerializer().serializeToString(copy),Math.max(1,Math.ceil(b.width*bakeX)),Math.max(1,Math.ceil(b.height*bakeY)),[b.x,b.y,b.width,b.height].join(' ')),name||el.localName);node.box=b;return node;
 }
 function local(node){var text=node.el.getAttribute('transform')||'';if(text!==node.matrixText){node.matrixText=text;node.matrix=transform(text);}return node.matrix;}
 function cssPose(){
  var blink=cssActive?sample(BLINK,((cssTime-blinkAt)%13.4)/13.4*100)[0]:1;
  var gaze=cssActive?sample(GAZE,(pupilTime%19.6)/19.6*100,[.18,.72,.25,1]):[0,0];
  var fog=sample(FOG,((cssTime-fogAt)%19.6)/19.6*100,[0,0,.58,1]);
  if(['frio','molesto'].includes(reaction)){var age=cssTime-reactionAt-(reaction==='frio'?.4:0),duration=reaction==='frio'?2.6:2.4;fog=age<0?[0,0,.3]:sample(FOG_TOUCH,age/duration*100,[0,0,.58,1]);}
  var t=Math.min(1,(visibleTime-lookAt)/.3),ease=bezier(t,.18,.72,.25,1);look=[lookFrom[0]+(lookTo[0]-lookFrom[0])*ease,lookFrom[1]+(lookTo[1]-lookFrom[1])*ease];
  return [blink,gaze[0],gaze[1],fog[0],fog[1],fog[2],look[0],look[1]];
 }
 function matrixFor(node,parent){
  var own=local(node),effect=IDENTITY;
  if(options.frozen&&cssState){
   if(cssActive&&(node.id==='eye-left'||node.id==='eye-right')){var x=node.id==='eye-left'?351:449,y=node.id==='eye-left'?317:325;effect=[1,0,0,cssState[0],0,y*(1-cssState[0])];}
   if(cssActive&&(node.id==='pupil-left'||node.id==='pupil-right'))effect=[1,0,0,1,cssState[1],cssState[2]];
   if(node.css==='look')effect=[1,0,0,1,cssState[6],cssState[7]];
   if(node.css==='fog')effect=[cssState[5],0,0,cssState[5],402*(1-cssState[5]),438*(1-cssState[5])+cssState[4]];
  }
  return multiply(parent,multiply(effect,own));
 }
 function alpha(node){
  if(node.css==='fog')return cssState?cssState[3]:0;
  if(node.id==='cold-patina')return .2+.65*number(mount.style.getPropertyValue('--nv-frio'),1);
  var raw=node.el.getAttribute('opacity');return raw===null?node.opacity:number(raw,1);
 }
 function apply(ctx,m){ctx.setTransform(sx*m[0],sy*m[1],sx*m[2],sy*m[3],sx*(m[4]+PAD),sy*(m[5]+PAD));}
 function gradient(ctx,paint,b){
  var match=paint.match(/#([^"')]+)/);if(!match)return paint;
  var def=gradientDefs.get(match[1]);if(!def)return 'transparent';var el=def.el,object=el.getAttribute('gradientUnits')!=='userSpaceOnUse';
  function coord(key,fallback){var raw=el.getAttribute(key)||fallback;return number(raw,0)/(raw.includes('%')?100:1);}
  var result;
  if(el.localName==='radialGradient'){
   ctx.save();if(object)ctx.transform(b.width,0,0,b.height,b.x,b.y);
   var x=coord('cx','50%'),y=coord('cy','50%');result=ctx.createRadialGradient(coord('fx',String(x)),coord('fy',String(y)),0,x,y,coord('r','50%'));ctx.restore();
  }else{var x1=coord('x1','0%'),y1=coord('y1','0%'),x2=coord('x2','100%'),y2=coord('y2','0%');result=ctx.createLinearGradient(object?b.x+x1*b.width:x1,object?b.y+y1*b.height:y1,object?b.x+x2*b.width:x2,object?b.y+y2*b.height:y2);}
  for(var stop of def.stops)result.addColorStop(stop[0],stop[1]);return result;
 }
 function clear(ctx){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,width,height);ctx.globalAlpha=1;}
 function include(b,m,pad){
  pad=pad||0;for(var x of [b.x-pad,b.x+b.width+pad])for(var y of [b.y-pad,b.y+b.height+pad]){
   var px=(m[0]*x+m[2]*y+m[4]+PAD)*sx,py=(m[1]*x+m[3]*y+m[5]+PAD)*sy;
   bounds[0]=Math.min(bounds[0],px);bounds[1]=Math.min(bounds[1],py);bounds[2]=Math.max(bounds[2],px);bounds[3]=Math.max(bounds[3],py);
  }
 }
 function pixels(source,target,noise,w,h,originX,originY,canvasWidth,scaleX,scaleY,saturation,brightness){
  // SVG 1.1 §15.15: in2 utiliza color-interpolation-filters; in conserva sRGB.
  // https://www.w3.org/TR/SVG11/filters.html#feDisplacementMapElement
  for(var y=0;y<h;y++)for(var x=0;x<w;x++){
   var at=((y+originY)*canvasWidth+x+originX)*4;
   var u=x+(noise[at]/255-.5)*7*scaleX,v=y+(noise[at+1]/255-.5)*7*scaleY,ix=Math.floor(u),iy=Math.floor(v),fx=u-ix,fy=v-iy;
   var alpha=0,r=0,g=0,b=0;
   // Interpolar colores premultiplicados evita halos en los bordes transparentes.
   for(var k=0;k<4;k++){var xx=ix+(k&1),yy=iy+(k>>1);if(xx<0||yy<0||xx>=w||yy>=h)continue;
    var p=(yy*w+xx)*4,weight=(k&1?fx:1-fx)*(k>>1?fy:1-fy),a=source[p+3]*weight;
    alpha+=a;r+=source[p]*a;g+=source[p+1]*a;b+=source[p+2]*a;
   }
   if(alpha){r/=alpha;g/=alpha;b/=alpha;var l=.213*r+.715*g+.072*b;
    target[at]=(l+(r-l)*saturation)*brightness;target[at+1]=(l+(g-l)*saturation)*brightness;target[at+2]=(l+(b-l)*saturation)*brightness;target[at+3]=alpha;
   }else target[at]=target[at+1]=target[at+2]=target[at+3]=0;
  }
 }
 function present2D(cold){
  if(!options.frozen){clear(presentation);presentation.drawImage(scene,0,0);return;}
  var pad=Math.ceil(Math.max(sx,sy)*4)+2;
  var x=Math.max(0,Math.floor(bounds[0])-pad),y=Math.max(0,Math.floor(bounds[1])-pad),right=Math.min(width,Math.ceil(bounds[2])+pad),bottom=Math.min(height,Math.ceil(bounds[3])+pad);
  if(previousBounds)presentation.clearRect(previousBounds[0],previousBounds[1],previousBounds[2],previousBounds[3]);
  if(right>x&&bottom>y){var w=right-x,h=bottom-y,source=context.getImageData(x,y,w,h);
   pixels(source.data,pixelOutput.data,noisePixels,w,h,x,y,width,sx,sy,options.idPrefix ? .86 : 1-.14*cold,.98);
   presentation.putImageData(pixelOutput,0,0,x,y,w,h);previousBounds=[x,y,w,h];
  }else previousBounds=null;
 }
 function isolated(depth){if(!buffers[depth]){var surface=doc.createElement('canvas');surface.width=width;surface.height=height;buffers[depth]={surface:surface,ctx:surface.getContext('2d')};}return buffers[depth];}
 function drawNode(node,ctx,parent,depth){
  var opacity=alpha(node);if(opacity<=0)return;var m=matrixFor(node,parent);ctx.save();
  if(node.children&&opacity<1){
   var layer=isolated(depth);clear(layer.ctx);layer.ctx.save();apply(layer.ctx,m);if(node.clip)layer.ctx.clip(node.clip);
   for(var child of node.children)drawNode(child,layer.ctx,m,depth+1);layer.ctx.restore();
   ctx.globalAlpha*=opacity;ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(layer.surface,0,0);ctx.restore();return;
  }
  ctx.globalAlpha*=opacity;apply(ctx,m);if(node.clip)ctx.clip(node.clip);
  if(node.children){for(var child of node.children)drawNode(child,ctx,m,depth+1);}
  else if(node.image){include(node.box,m);ctx.drawImage(node.image,node.box.x,node.box.y,node.box.width,node.box.height);}
  else if(node.paint){
   var d=node.el.getAttribute('d')||'';if(d!==node.d){node.d=d;node.path=new Path2D(d);var b=geometry.get(d);if(!b){b=box(node.el);geometry.set(d,b);if(geometry.size>64)geometry.delete(geometry.keys().next().value);}node.box=b;}
   var p=node.paint,a=ctx.globalAlpha;include(node.box,m,p.stroke==='none'?0:p.width);
   if(p.fill!=='none'){ctx.fillStyle=gradient(ctx,p.fill,node.box);ctx.globalAlpha=a*p.fillOpacity;ctx.fill(node.path,p.fillRule);}
   if(p.stroke!=='none'){ctx.strokeStyle=gradient(ctx,p.stroke,node.box);ctx.globalAlpha=a*p.strokeOpacity;ctx.lineWidth=p.width;ctx.lineCap=p.cap;ctx.lineJoin=p.join;ctx.stroke(node.path);}
  }
  ctx.restore();
 }
 function draw(now){
  if(!active()||!ready)return;lastDraw=now;bounds=[Infinity,Infinity,-Infinity,-Infinity];clear(context);for(var node of tree)drawNode(node,context,IDENTITY,0);
  // Algunos gestos de la galería salen del viewBox. Conservar su SVG completo
  // evita recortes y evita agrandar la superficie/scroll del login para todos.
  var outside=bounds[0]<0||bounds[1]<0||bounds[2]>width||bounds[3]>height;
  if(outside){if(mount.classList.contains('nv-actor-pintado'))mount.classList.remove('nv-actor-pintado');canvas.style.display='none';dirty=false;return;}
  if(canvas.style.display)canvas.style.display='';if(!mount.classList.contains('nv-actor-pintado'))mount.classList.add('nv-actor-pintado');
  var cold=number(mount.style.getPropertyValue('--nv-frio'),1);if(!gl){present2D(cold);dirty=false;return;}
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,frameTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,scene);
  gl.uniform1f(uniforms.sat,options.frozen?(options.idPrefix ? .86 : 1-.14*cold):1);gl.uniform1f(uniforms.brightness,options.frozen ? .98 : 1);gl.uniform1f(uniforms.bend,options.frozen?1:0);
  gl.drawArrays(gl.TRIANGLES,0,6);dirty=false;
 }
 function tick(now){
  raf=0;if(!active()||!ready){last=null;return;}
  var dt=last===null?0:Math.max(0,now-last)/1000;last=now;visibleTime+=dt;
  if(!paused()){cssTime+=dt;if(cssActive&&!mount.dataset.mirada&&!mount.dataset.reaccion)pupilTime+=dt;}
  if(now-lastDraw>=1000/30-.001){var next=cssPose();if(!cssState||next.some(function(value,i){return value!==cssState[i];}))dirty=true;cssState=next;if(dirty)try{draw(now);}catch(error){fallback(error);return;}}
  if(options.frozen&&!paused()||dirty||visibleTime-lookAt<.3)wake();
 }
 function changes(records){
  function classes(value){return String(value||'').split(/\s+/).filter(function(c){return c&&c!=='nv-actor-pintado';}).sort().join(' ');}
  if(records?.length&&records.every(function(r){return r.attributeName==='class'&&classes(r.oldValue)===classes(mount.className);}))return;
  var next=cssEnabled();if(next!==cssActive){cssActive=next;pupilTime=0;blinkAt=cssTime;}
  var r=mount.dataset.reaccion||'';
  if(r!==reaction||records?.some(function(record){return record.attributeName==='data-reaccion'&&record.oldValue===null;})){
   reaction=r;reactionAt=cssTime;if(!r)fogAt=cssTime;
  }
  var target=[0,0];if(mount.dataset.mirada)target=mount.dataset.mirada==='apartada'?[12,2]:mount.dataset.mirada==='entorno'?[number(mount.style.getPropertyValue('--nv-mirada-x'),0),number(mount.style.getPropertyValue('--nv-mirada-y'),0)]:[-6,-5];if(reaction==='molesto')target=[0,-3];
  if(target.some(function(value,i){return value!==lookTo[i];})){lookFrom=look.slice();lookTo=target;lookAt=visibleTime;}
  dirty=true;if(paused())cancel();wake();
 }
 async function prepare(){
  if(!active())return;var rect=svg.getBoundingClientRect(),dpr=Math.min(1.5,window.devicePixelRatio||1),w=Math.ceil(rect.width*dpr*VW/800),h=Math.ceil(rect.height*dpr*VH/1067),size=w+'x'+h;
  if(!w||!h||w===width&&h===height&&ready||size===pendingSize)return;var token=++revision;pendingSize=size;collectDefinitions();
  try{
   var compiled=await Promise.all(Array.from(svg.children).map(function(el){return compile(el,rect.width*1.5/VW,rect.height*1.5/VH);}));
   var noise=await image('<svg xmlns="'+NS+'" preserveAspectRatio="none" width="'+w+'" height="'+h+'" viewBox="0 0 800 1067"><defs><filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".018 .035" numOctaves="1" seed="9"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1"/></filter></defs><rect width="800" height="1067" filter="url(#grain)"/></svg>');
   if(dead||token!==revision||!active())return;
   pendingSize='';tree=compiled.filter(Boolean);width=w;height=h;sx=w/VW;sy=h/VH;canvas.width=scene.width=w;canvas.height=scene.height=h;for(var layer of buffers){if(layer){layer.surface.width=w;layer.surface.height=h;}}
   if(gl){gl.viewport(0,0,w,h);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,noiseTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,noise);}
   else if(options.frozen){colorTables();pixelOutput=presentation.createImageData(w,h);var noiseCanvas=doc.createElement('canvas');noiseCanvas.width=w;noiseCanvas.height=h;var noiseContext=noiseCanvas.getContext('2d',{willReadFrequently:true});noiseContext.drawImage(noise,0,0,w,h);noisePixels=noiseContext.getImageData(0,0,w,h).data;for(var i=0;i<noisePixels.length;i+=4){noisePixels[i]=Math.round(TO_LINEAR[noisePixels[i]]*255);noisePixels[i+1]=Math.round(TO_LINEAR[noisePixels[i+1]]*255);}noiseCanvas.width=noiseCanvas.height=1;previousBounds=null;}
   if(!ready){cssTime=(options.nodes?.['eye-left']?.getAnimations?.()[0]?.currentTime||0)/1000;pupilTime=(options.nodes?.['pupil-left']?.getAnimations?.()[0]?.currentTime||0)/1000;}
   cssActive=cssEnabled();ready=true;cssState=cssPose();mount.appendChild(canvas);dirty=true;draw(performance.now());if(options.frozen&&!paused()||dirty)wake();
  }catch(error){if(token===revision)fallback(error);}
 }
 function releaseGPU(){if(!gl)return;gl.deleteTexture?.(frameTexture);gl.deleteTexture?.(noiseTexture);gl.deleteBuffer?.(quad);gl.deleteProgram?.(program);gl.getExtension?.('WEBGL_lose_context')?.loseContext();}
 function lost(event){event.preventDefault();disabled=true;revision++;fallback();}
 if(gl)try{gpu();}catch(error){options.report?.(String(error.message||error));releaseGPU();canvas.width=canvas.height=scene.width=scene.height=1;return null;}
 canvas.addEventListener('webglcontextlost',lost);
 if(typeof ResizeObserver==='function'){resizeObserver=new ResizeObserver(prepare);resizeObserver.observe(svg);}
 if(typeof MutationObserver==='function'){mutation=new MutationObserver(changes);mutation.observe(mount,{attributes:true,attributeOldValue:true,attributeFilter:['class','style','data-gesto','data-accion','data-mirada','data-reaccion']});}
 Promise.resolve().then(prepare);
 return {invalidate:function(){dirty=true;var now=performance.now();if(active()&&ready&&now-lastDraw>=1000/30-.001)try{draw(now);}catch(error){fallback(error);return;}wake();},setVisible:function(value){visible=!!value;if(!active()){revision++;pendingSize='';cancel();}else{prepare();wake();}},destroy:function(){
  dead=true;revision++;cancel();resizeObserver?.disconnect();mutation?.disconnect();canvas.removeEventListener('webglcontextlost',lost);fallback();
  for(var layer of buffers)if(layer)layer.surface.width=layer.surface.height=1;buffers=[];tree=[];geometry.clear();gradientDefs.clear();
  releaseGPU();pixelOutput=noisePixels=null;canvas.width=canvas.height=scene.width=scene.height=1;
 }};
}
window.GreenPainter={create:create,multiply:multiply,transform:transform,sample:sample};
})();
