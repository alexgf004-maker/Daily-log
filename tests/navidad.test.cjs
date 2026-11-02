const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
class Element {
 constructor(){this.attrs={};this.dataset={};this.children={};this.isConnected=true;this.events={};this.style={setProperty:(k,v)=>this.style[k]=v,removeProperty:k=>delete this.style[k]};const classes=new Set();this.classList={add:(...c)=>c.forEach(x=>classes.add(x)),remove:(...c)=>c.forEach(x=>classes.delete(x)),contains:c=>classes.has(c)};}
 setAttribute(k,v){this.attrs[k]=v} getAttribute(k){return this.attrs[k]}
 querySelector(k){return this.children[k]||null} querySelectorAll(){return this.drops||[]}
 addEventListener(k,fn){(this.events[k]??=new Set()).add(fn)} removeEventListener(k,fn){this.events[k]?.delete(fn)}
 emit(k){for(const fn of this.events[k]||[])fn({stopPropagation(){}})}
}
function fixture({date='2026-12-01',mode='auto',reduced=false}={}){
 let now=new Date(date+'T12:00:00');
 const mount=new Element(),svg=new Element(),iceNode=new Element(),login=new Element();
 mount.children.svg=svg;mount.children['.nv-hielo-fijo']=iceNode;login.children['.nv-mascota']=mount;login.classList.add('active');
 for(const id of ['melt-mask','body','left','top','right','reflection','rim','cracks','puddle'])iceNode.children['#nvice-'+id]=new Element();
 iceNode.drops=[new Element(),new Element()];
 const callbacks={},intervals=[],timers=new Map(),actors=[];let timerID=0;
 class Actor{constructor(svg){this.svg=svg;this.scene='idle';actors.push(this)}pause(){this.paused=true}resume(){this.paused=false}destroy(){this.destroyed=true}play(name){this.scene=name}getSceneInfo(){return {duration:5}}}
 Actor.SCENES={idle:{},tap1:{},tap2:{},tap3:{},steal:{},sneak:{},caught:{},climb:{},hide:{},xmas:{},nye:{}};
 const ctx={console,Date:class extends Date{constructor(...args){super(...(args.length?args:[now]))}},MutationObserver:class{observe(){}disconnect(){}},GreenActor:Actor,document:{hidden:false,getElementById:id=>id==='loginScreen'?login:null,addEventListener:(e,fn)=>callbacks[e]=fn},setTimeout:(fn)=>{timers.set(++timerID,fn);return timerID},clearTimeout:id=>timers.delete(id),setInterval:(fn,ms)=>intervals.push({fn,ms}),matchMedia:()=>({matches:reduced})};
 ctx.window=ctx;ctx.__temas={modo:mode,activo:{id:'navidad'},etapaDe:()=>({id:now.getDate()<=21?'pre':'casa'})};
 vm.createContext(ctx);vm.runInContext(read('js/navidad-hielo.js'),ctx);vm.runInContext(read('js/navidad-mascota.js'),ctx);
 return {ctx,mount,iceNode,svg,login,actors,callbacks,intervals,timers,setDate:d=>{now=new Date(d+'T12:00:00')}};
}
test('el hielo pierde altura cada día, con base el 21 y sin hielo el 22',()=>{
 const f=fixture(),ice=f.ctx.NavidadHielo.create(1,f.mount);let previous=-1;
 for(let day=1;day<=21;day++){
  ice.update(day);const shape=f.iceNode.children['#nvice-body'].attrs.d;
  const top=Number(shape.match(/^M[\d.]+ ([\d.]+)/)[1]);
  assert.ok(top>previous);previous=top;
  assert.equal(f.iceNode.dataset.dia,String(day));
  assert.equal(f.iceNode.style.display,'');assert.ok(!shape.includes('NaN'));
 }
 assert.ok(previous<1010);ice.update(22);assert.equal(f.iceNode.style.display,'none');
 ice.update(1);assert.equal(f.iceNode.style.display,'');
});
test('actualización idempotente y limpieza de hielo',()=>{
 const f=fixture(),ice=f.ctx.NavidadHielo.create(12,f.mount),shape=f.iceNode.children['#nvice-body'].attrs.d;
 ice.update(12);assert.equal(f.iceNode.children['#nvice-body'].attrs.d,shape);
 ice.touch();assert.equal(f.timers.size,1);ice.destroy();assert.equal(f.timers.size,0);assert.equal(f.mount.style['--nv-frio'],undefined);
});
test('permanece inmóvil del 1 al 21; se libera al cambiar al 22 sin recargar',()=>{
 const f=fixture();f.ctx.__mascotaNavidadSync();assert.equal(f.actors[0].paused,true);
 f.setDate('2026-12-21');f.ctx.__mascotaNavidadSync();assert.equal(f.ctx.__mascotaNavidadEstado().dia,21);
 assert.equal(f.ctx.__mascotaNavidadPlay('steal'),false);
 f.setDate('2026-12-22');f.ctx.__mascotaNavidadSync();assert.equal(f.actors[0].destroyed,true);
 assert.equal(f.ctx.__mascotaNavidadEstado().congelada,false);assert.ok(f.mount.classList.contains('nv-mascota-libre'));assert.equal(f.actors[1].paused,false);
});
test('regresar a la pestaña el 22 actualiza la liberación inmediatamente',()=>{
 const f=fixture();f.ctx.__mascotaNavidadSync();f.ctx.document.hidden=true;f.callbacks.visibilitychange();
 f.setDate('2026-12-22');f.ctx.document.hidden=false;f.callbacks.visibilitychange();assert.equal(f.ctx.__mascotaNavidadEstado().congelada,false);
});
test('la previsualización local empieza en 1 y rechaza días fuera de rango',()=>{
 const f=fixture({date:'2026-12-12',mode:'ver'});f.ctx.__mascotaNavidadSync();assert.equal(f.ctx.__mascotaNavidadEstado().dia,1);
 assert.equal(f.ctx.__mascotaNavidadPreviewDia(12),true);assert.equal(f.ctx.__mascotaNavidadEstado().dia,12);
 for(const day of [0,22,1.5,'otro'])assert.equal(f.ctx.__mascotaNavidadPreviewDia(day),false);
 f.ctx.__temas.modo='auto';assert.equal(f.ctx.__mascotaNavidadPreviewDia(7),false);f.ctx.__mascotaNavidadSync();assert.equal(f.ctx.__mascotaNavidadEstado().dia,12);
});
test('cambiar de tema retira el motor y sus escuchadores; volver no duplica toques',()=>{
 const f=fixture({date:'2026-12-22'});
 for(let i=0;i<3;i++){
  f.ctx.__temas.activo={id:'navidad'};f.ctx.__mascotaNavidadSync();assert.equal(f.svg.events.pointerdown.size,1);
  f.svg.emit('pointerdown');assert.equal(f.actors.at(-1).scene,'tap1');
  f.ctx.__temas.activo={id:'muertos'};f.ctx.__mascotaNavidadSync();assert.equal(f.svg.events.pointerdown.size,0);assert.equal(f.actors.at(-1).destroyed,true);assert.equal(f.timers.size,0);
 }
});
test('no crea una mascota con otro tema ni con tema apagado',()=>{
 const f=fixture();for(const theme of [null,{id:'muertos'},{id:'halloween'}]){f.ctx.__temas.activo=theme;f.ctx.__mascotaNavidadSync();assert.equal(f.actors.length,0)}
});
test('movimiento reducido: no inicia travesuras automáticas',()=>{
 const f=fixture({date:'2026-12-22',reduced:true});f.ctx.__mascotaNavidadSync();f.intervals.find(i=>i.ms===19000).fn();assert.equal(f.actors[0].scene,'idle');assert.equal(f.actors[0].paused,true);
});
test('se conserva el catálogo de 14 animaciones y el SVG inline completo',()=>{
 const scenes=read('js/green-actor.js').match(/const SCENES = Object.freeze\(\{([\s\S]*?)\n\}\);/)[1];assert.equal((scenes.match(/duration:/g)||[]).length,14);
 for(const id of ['actor','head','body','tail','arm-left','arm-right','leg-left','leg-right','eye-left','eye-right'])assert.ok(read('index.html').includes('id="'+id+'"'));
});
test('los ojos se pausan al ocultar la pestaña y se reanudan con el cuerpo detenido',()=>{
 const f=fixture();f.ctx.__mascotaNavidadSync();assert.equal(f.mount.classList.contains('nv-mascota-ojos-pausa'),false);
 f.ctx.document.hidden=true;f.callbacks.visibilitychange();assert.equal(f.mount.classList.contains('nv-mascota-ojos-pausa'),true);
 f.ctx.document.hidden=false;f.callbacks.visibilitychange();assert.equal(f.mount.classList.contains('nv-mascota-ojos-pausa'),false);assert.equal(f.actors[0].paused,true);
 f.ctx.__temas.activo=null;f.ctx.__mascotaNavidadSync();assert.equal(f.mount.classList.contains('nv-mascota-ojos-pausa'),false);
});
test('movimiento reducido mantiene también los ojos estáticos',()=>{
 const f=fixture({reduced:true});f.ctx.__mascotaNavidadSync();assert.equal(f.mount.classList.contains('nv-mascota-ojos-pausa'),true);assert.equal(f.actors[0].paused,true);
});
