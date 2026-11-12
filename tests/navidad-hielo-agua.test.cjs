const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/navidad-hielo.js'),'utf8');
function fixture(){
 const frames=new Map(),images=[],canvases=[],observers=[],classes=new Set(),paused=new Set();let clock=0,seq=0,resize;
 function element(name,attrs={}){return {name,attrs:{...attrs},children:[],style:{},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]??null},appendChild(c){this.children.push(c)},querySelectorAll(){return []},cloneNode(){const c=element(this.name,this.attrs);c.children=this.children.map(x=>x.cloneNode());return c},getTotalLength(){return 200},remove(){this.removed=true}}}
 const doc={hidden:false,createElementNS:(_,name)=>element(name),createElement(){
  const surface=element('canvas'),stack=[];
  const context={globalAlpha:1,clears:[],strokes:[],setTransform(){},clearRect(){this.clears.push(clock)},drawImage(){},save(){stack.push({globalAlpha:this.globalAlpha,lineDashOffset:this.lineDashOffset})},restore(){Object.assign(this,stack.pop())},translate(){},scale(){},beginPath(){},ellipse(){},clip(){},fill(){},setLineDash(){},stroke(p){this.strokes.push({time:clock,offset:this.lineDashOffset,alpha:this.globalAlpha,path:p?.d})}};
  surface.getContext=()=>context;surface.context=context;canvases.push(surface);return surface;
 }};
 const node={ownerDocument:doc,isConnected:true,dataset:{derretido:'0'},children:[],style:{getPropertyValue:()=>'.38'},getBoundingClientRect:()=>({width:240,height:320}),querySelectorAll:()=>[],querySelector:()=>element('g',{opacity:0}),appendChild(c){this.children.push(c)},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}};
 const mount={dataset:{},classList:{contains:c=>paused.has(c)}};
 const paths={};for(const id of ['body','melt-mask','wet-edge','puddle','runoff-a','runoff-b','ripple-a','ripple-b'])paths[id]=element('path',{d:id,opacity:'.2',cx:176});
 paths.body.ownerSVGElement={querySelector:()=>element('defs')};
 const drops=[0,1].map(i=>({style:{translate:(i?622:176)+'px 700px',getPropertyValue:()=> '322px'},getAttribute:()=> 'gota',getAnimations:()=>[{currentTime:0}]}));
 const ctx={document:doc,performance:{now:()=>clock},Path2D:class{constructor(d){this.d=d}},Image:class{constructor(){images.push(this)}},XMLSerializer:class{serializeToString(){return '<svg/>'}},ResizeObserver:class{constructor(fn){resize=fn}observe(){}disconnect(){this.disconnected=true}},MutationObserver:class{constructor(fn){this.notify=fn;observers.push(this)}observe(){}disconnect(){this.disconnected=true}},matchMedia:()=>({matches:false}),requestAnimationFrame:fn=>{frames.set(++seq,fn);return seq},cancelAnimationFrame:id=>frames.delete(id),encodeURIComponent};
 ctx.window=ctx;ctx.devicePixelRatio=3;vm.createContext(ctx);vm.runInContext(source,ctx);
 const water=ctx.NavidadHielo.waterLayer(node,mount,paths,drops,'');
 async function ready(){water.refresh();assert.equal(images.length,2);for(const image of images)image.onload();await Promise.resolve();await Promise.resolve();}
 function step(t){clock=t;const callbacks=[...frames.values()];frames.clear();for(const fn of callbacks)fn(t)}
 return {ctx,water,node,mount,classes,paused,frames,images,canvases,observers,paths,ready,step,resize:()=>resize(),changes:records=>observers[0].notify(records)};
}
test('las fases del agua conservan puntos del CSS, los dos relojes y el easing de caída',()=>{
 const f=fixture(),at=p=>f.ctx.NavidadHielo.waterState(5.6*p/100,5.6,0,.38);
 for(const [p,sx,sy,opacity] of [[0,.25,.3,0],[43,.25,.3,0],[51,.75,1,.85],[55,.7,1.2,.85],[75,.65,1.25,.65],[76,1.7,.2,0]]){
  const d=at(p).drop;assert.ok(Math.abs(d[0]-sx)<1e-8);assert.ok(Math.abs(d[1]-sy)<1e-8);assert.ok(Math.abs(d[2]-opacity)<1e-8);
 }
 assert.ok(Math.abs(at(53).offset+100)<1e-8);assert.ok(Math.abs(at(14).wet-.38)<1e-8);assert.ok(Math.abs(at(40).wet-.38)<1e-8);assert.ok(at(65).wet<1e-8);
 assert.ok(Math.abs(at(78).ring[1]-.7)<1e-8);
 const halfway=at(65).drop;assert.ok(halfway[4]>.3&&halfway[4]<.4,'la caída acelera como cubic-bezier(.42,0,1,1)');
 const shifted=f.ctx.NavidadHielo.waterState(0,6.7,2.35,.38),same=f.ctx.NavidadHielo.waterState(2.35,6.7,0,.38);
 assert.equal(JSON.stringify(shifted),JSON.stringify(same));f.water.destroy();
});
test('agua externa: DPR acotado, máximo 30 dibujos/s y ninguna escritura al SVG por cuadro',async()=>{
 const f=fixture();await f.ready();assert.ok(f.classes.has('nv-hielo-canvas'));assert.equal(f.node.children.length,2);
 for(const c of f.canvases){assert.equal(c.width,360);assert.equal(c.height,480)}
 for(const p of Object.values(f.paths))p.setAttribute=()=>{throw Error('No mutar el SVG en cada cuadro')};
 const front=f.canvases[1].context;
 for(let i=1;i<=120;i++)f.step(i*1000/120);
 assert.ok(front.clears.length<=31,front.clears.length+' dibujos contando el inicial');
 for(let i=1;i<front.clears.length;i++)assert.ok(front.clears[i]-front.clears[i-1]>=1000/30-.001);
 assert.equal(f.images.length,2,'ninguna imagen o color se genera por cuadro');f.water.destroy();
});
test('ocultar o entrar en reposo cancela el RAF y reanudar no duplica relojes ni añade el tiempo oculto',async()=>{
 const f=fixture();await f.ready();f.step(2500);const front=f.canvases[1].context,count=front.clears.length;
 const offset=front.strokes.filter(s=>s.path==='runoff-a').at(-1)?.offset;
 f.water.setVisible(false);assert.equal(f.frames.size,0);f.step(70000);assert.equal(front.clears.length,count);
 f.water.setVisible(true);f.water.setVisible(true);assert.equal(f.frames.size,1);f.step(70040);
 const resumed=front.strokes.filter(s=>s.path==='runoff-a').at(-1)?.offset;assert.ok(Math.abs(resumed-offset)<4);
 f.paused.add('nv-mascota-ojos-pausa');f.changes([{attributeName:'class'}]);assert.equal(f.frames.size,0);
 f.paused.clear();f.changes([{attributeName:'class'}]);assert.equal(f.frames.size,1);
 f.ctx.document.hidden=true;f.step(71000);assert.equal(f.frames.size,0);f.water.destroy();
});
test('una carga tardía no activa canvas ocultos y destruir libera superficies y observadores',async()=>{
 const f=fixture();f.water.refresh();f.water.refresh();assert.equal(f.images.length,2);
 f.water.setVisible(false);for(const i of f.images)i.onload();await Promise.resolve();await Promise.resolve();
 assert.equal(f.frames.size,0);assert.equal(f.classes.has('nv-hielo-canvas'),false);
 f.water.setVisible(true);assert.equal(f.images.length,4);f.water.destroy();for(const i of f.images.slice(2))i.onload();
 await Promise.resolve();await Promise.resolve();assert.equal(f.frames.size,0);assert.equal(f.classes.has('nv-hielo-canvas'),false);
 for(const c of f.canvases){assert.equal(c.width,1);assert.equal(c.height,1)}assert.ok(f.observers[0].disconnected);
});
test('derretir por completo u ocultar el nodo corta el reloj aunque el documento esté visible',async()=>{
 const f=fixture();await f.ready();f.node.style.display='none';f.water.refresh();assert.equal(f.frames.size,0);
 f.node.style.display='';f.water.setVisible(true);assert.equal(f.frames.size,1);
 f.node.isConnected=false;f.step(1000);assert.equal(f.frames.size,0);f.water.destroy();
});
test('si una imagen no carga, permanece el SVG visible y no se deja un bucle vacío',async()=>{
 const f=fixture();f.water.refresh();f.images[0].onerror(Error('imagen no disponible'));f.images[1].onload();
 for(let i=0;i<4;i++)await Promise.resolve();
 assert.equal(f.classes.has('nv-hielo-canvas'),false);assert.equal(f.frames.size,0);
 f.water.refresh();assert.equal(f.images.length,4);f.water.destroy();
});
