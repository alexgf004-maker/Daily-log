const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/green-painter.js'),'utf8');
function fixture({frozen=false,color=[128,128,128,255]}={}){
 const frames=new Map(),images=[],surfaces=[],observers=[],classes=new Set();let clock=0,seq=0,resize;
 function element(name,attrs={},children=[]){
  const e={localName:name,id:attrs.id||'',attrs:{...attrs},children,style:{removeProperty(){}},parentElement:null,
   getAttribute(k){return this.attrs[k]??null},setAttribute(k,v){this.attrs[k]=String(v)},removeAttribute(k){delete this.attrs[k]},hasAttribute(k){return k in this.attrs},
   classList:{contains:c=>(attrs.class||'').split(' ').includes(c)},getBBox:()=>({x:200,y:150,width:400,height:800}),
   getAnimations:()=>[],getBoundingClientRect:()=>({width:80,height:106.7}),closest:()=>null,
   querySelectorAll:()=>[],querySelector:()=>null,appendChild(c){this.children.push(c);c.parentElement=this},
   cloneNode(){return element(name,this.attrs,this.children.map(c=>c.cloneNode()))},remove(){this.removed=true},addEventListener(){},removeEventListener(){}};
  for(const c of children)c.parentElement=e;return e;
 }
 const brow=element('path',{id:'brow-left',d:'M310 286Q343 289 382 305'}),body=element('path',{id:'body',d:'M200 500L600 500L600 950Z'});
 const actor=element('g',{id:'actor'},[body,brow]),defs=element('defs'),svg=element('svg',{},[defs,actor]);
 const mount={isConnected:true,dataset:{},style:{getPropertyValue:()=> '1'},classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c)},appendChild(c){c.parentElement=this}};
 svg.parentElement=mount;svg.querySelectorAll=s=>s==='defs,clipPath'?[defs]:[];
 const doc={hidden:false,createElementNS:(_,name)=>element(name),createElement(){
  const surface=element('canvas'),stack=[];
  const ctx={globalAlpha:1,draws:[],fills:[],puts:[],getImageData(x,y,w,h){const data=new Uint8ClampedArray(w*h*4),c=surface===surfaces[1]?color:[128,128,128,255];for(let i=0;i<data.length;i+=4)data.set(c,i);return {data,width:w,height:h}},createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4),width:w,height:h}},
   setTransform(){},clearRect(){},drawImage(image,...args){this.draws.push({image,args,alpha:this.globalAlpha,time:clock})},save(){stack.push(this.globalAlpha)},restore(){this.globalAlpha=stack.pop()},clip(){},transform(){},fill(p){this.fills.push(p.d)},stroke(){},putImageData(...args){this.puts.push({args,time:clock})}};
  surface.width=surface.height=0;surface.getContext=type=>type==='2d'?ctx:null;surface.context=ctx;surfaces.push(surface);return surface;
 }};svg.ownerDocument=doc;
 function style(el){return {display:'inline',visibility:el.getAttribute('visibility')||'visible',opacity:el.getAttribute('opacity')||'1',fill:'rgb(128, 128, 128)',stroke:'none',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round',fillOpacity:'1',strokeOpacity:'1',fillRule:'nonzero',clipPath:'none',getPropertyValue(k){return ({fill:'rgb(128, 128, 128)',stroke:'none','stroke-width':'2'})[k]||''}}}
 const errors=[],ctx={document:doc,performance:{now:()=>clock},getComputedStyle:style,Path2D:class{constructor(d){this.d=d}},Image:class{constructor(){images.push(this)}},XMLSerializer:class{serializeToString(e){return '<'+e.localName+' '+Object.entries(e.attrs).map(([k,v])=>k+'="'+v+'"').join(' ')+'/>'}},ResizeObserver:class{constructor(fn){resize=fn}observe(){}disconnect(){this.disconnected=true}},MutationObserver:class{constructor(fn){this.notify=fn;observers.push(this)}observe(){}disconnect(){this.disconnected=true}},requestAnimationFrame:fn=>{frames.set(++seq,fn);return seq},cancelAnimationFrame:id=>frames.delete(id),encodeURIComponent};
 ctx.window=ctx;ctx.devicePixelRatio=3;vm.createContext(ctx);vm.runInContext(source,ctx);
 const painter=ctx.GreenPainter.create(svg,{nodes:{actor,body,'brow-left':brow},frozen,report:m=>errors.push(m)});
 function step(t){clock=t;const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn(t)}
 async function ready(){for(let round=0;round<20;round++){await Promise.resolve();for(const image of images)if(!image.loaded){image.loaded=true;image.onload()}}}
 return {ctx,painter,frames,images,surfaces,observers,classes,svg,actor,brow,body,mount,errors,ready,step,resize:()=>resize()};
}
test('las matrices conservan orden SVG y pivotes de cabeza, manos y pies',()=>{
 const f=fixture(),p=f.ctx.GreenPainter,point=(m,x,y)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
 const rotate=p.transform('rotate(90 399 474)');const center=point(rotate,399,474);assert.ok(Math.abs(center[0]-399)<1e-8);assert.ok(Math.abs(center[1]-474)<1e-8);
 const moved=point(p.transform('translate(10 20) scale(2 3)'),4,5);assert.deepEqual(moved,[18,35]);
 const hand=p.transform('translate(449 326) scale(-1 1)');assert.deepEqual(point(hand,10,0),[439,326]);f.painter.destroy();
});
test('la capa 2D cachea piezas, limita DPR, no pierde la curva de las cejas y se detiene tras pintar',async()=>{
 const f=fixture();await f.ready();assert.ok(f.classes.has('nv-actor-pintado'));assert.equal(f.surfaces[0].width,120);assert.equal(f.surfaces[0].height,161);
 f.step(40);assert.equal(f.frames.size,0);assert.ok(f.surfaces[1].context.fills.includes(f.brow.attrs.d));
 const imageCount=f.images.length;f.brow.attrs.d='M310 284Q343 269 382 286';f.painter.invalidate();f.step(80);
 assert.ok(f.surfaces[1].context.fills.includes(f.brow.attrs.d));assert.equal(f.images.length,imageCount);
 assert.match(decodeURIComponent(f.images[0].src),/preserveAspectRatio="none"/);f.painter.destroy();
});
test('respeta las partes que el tema oculta, como el mechón bajo el gorro',async()=>{
 const f=fixture();f.body.attrs.visibility='hidden';await f.ready();
 assert.equal(f.images.some(i=>decodeURIComponent(i.src).includes('id="body"')),false);assert.ok(f.classes.has('nv-actor-pintado'));f.painter.destroy();
});
test('el color congelado conserva saturación/brillo y no introduce color en píxeles transparentes',async()=>{
 for(const color of [[255,0,0,255],[220,12,12,0]]){
  const f=fixture({frozen:true,color});await f.ready();f.step(40);
  const picture=f.surfaces[0].context.puts[0].args[0],at=(90*picture.width+60)*4;
  const rgba=[...picture.data.slice(at,at+4)];assert.deepEqual(rgba,color[3]?[222,7,7,255]:[0,0,0,0]);f.painter.destroy();
 }
});
test('dibujar no muta los nodos del SVG de referencia',async()=>{
 const f=fixture();await f.ready();for(const el of [f.actor,f.brow,f.body])el.setAttribute=()=>{throw Error('No escribir el SVG desde el pintor')};
 f.step(40);f.painter.invalidate();f.step(80);assert.equal(f.errors.length,0);f.painter.destroy();
});
test('visibilidad estricta cancela la capa y reanudar no duplica su RAF',async()=>{
 const f=fixture({frozen:true});await f.ready();f.step(40);const n=f.surfaces[0].context.puts.length;
 f.painter.setVisible(false);assert.equal(f.frames.size,0);f.painter.invalidate();f.step(50000);assert.equal(f.surfaces[0].context.puts.length,n);
 f.painter.setVisible(true);f.painter.setVisible(true);assert.equal(f.frames.size,1);f.step(50040);assert.equal(f.errors.length,0);
 f.ctx.document.hidden=true;f.step(50100);assert.equal(f.frames.size,0);f.painter.destroy();
});
test('el reposo no deja ojos animados ni un bucle persistente y no se dibuja más de 30 cps',async()=>{
 const f=fixture({frozen:true});await f.ready();
 for(let i=1;i<=120;i++){f.painter.invalidate();f.step(i*1000/120)}
 const times=f.surfaces[0].context.puts.map(p=>p.time);assert.ok(times.length<=31,'30 intervalos más el dibujo inicial');
 for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=1000/30-.001);
 f.classes.add('nv-mascota-ojos-pausa');f.observers[0].notify([]);f.step(1040);assert.equal(f.frames.size,0);f.painter.destroy();
});
test('la transparencia de grupo se compone una vez, y destruir libera cada superficie',async()=>{
 const f=fixture();await f.ready();f.actor.attrs.opacity='.5';f.painter.invalidate();f.step(40);
 assert.ok(f.surfaces[1].context.draws.some(d=>d.alpha===.5));f.painter.destroy();
 assert.equal(f.classes.has('nv-actor-pintado'),false);assert.equal(f.frames.size,0);
 for(const c of f.surfaces){assert.equal(c.width,1);assert.equal(c.height,1)}assert.ok(f.observers[0].disconnected);
});
test('el PIN puede apartar la mirada suavemente con el parpadeo pausado y termina su transición',async()=>{
 const f=fixture({frozen:true});await f.ready();f.step(40);
 f.classes.add('nv-mascota-ojos-pausa');f.mount.dataset.mirada='apartada';f.observers[0].notify([]);
 const before=f.surfaces[0].context.puts.length;
 for(let t=80;t<=440;t+=40)f.step(t);
 assert.ok(f.surfaces[0].context.puts.length>before+2);assert.equal(f.frames.size,0);f.painter.destroy();
});
test('una imagen que termina después de ocultar o destruir no sustituye el SVG',async()=>{
 const f=fixture();await Promise.resolve();f.painter.setVisible(false);await f.ready();assert.equal(f.classes.has('nv-actor-pintado'),false);
 f.painter.destroy();f.painter.setVisible(true);f.painter.invalidate();await f.ready();assert.equal(f.frames.size,0);
});
