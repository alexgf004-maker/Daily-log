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
 contains(target){return !!target&&Object.values(this.children).includes(target)}
 emit(k,event={}){for(const fn of this.events[k]||[])fn({stopPropagation(){},...event})}
}
function fixture({date='2026-12-01',mode='auto',reduced=false}={}){
 let now=new Date(date+'T12:00:00');
 const mount=new Element(),svg=new Element(),iceNode=new Element(),login=new Element(),form=new Element(),pin=new Element(),user=new Element();pin.id='loginPin';user.id='loginUser';form.children={pin,user};login.children['.login-form']=form;
 mount.children.svg=svg;mount.children['.nv-hielo-fijo']=iceNode;login.children['.nv-mascota']=mount;login.classList.add('active');
 for(const id of ['melt-mask','body','left','top','right','reflection','rim','cracks','puddle','frost-body','contour','runoff-a','runoff-b','wet-edge','ripple-a','ripple-b'])iceNode.children['#nvice-'+id]=new Element();
 iceNode.drops=[new Element(),new Element()];
 const callbacks={},intervals=[],timers=new Map(),actors=[];let timerID=0;
 class Actor{constructor(svg,options){this.svg=svg;this.options=options;this.scene='idle';this.elapsed=0;actors.push(this)}pause(){this.paused=true}resume(){this.paused=false}destroy(){this.destroyed=true}play(name){this.scene=name;this.elapsed=0}render(t){this.elapsed=t}getSceneInfo(){return {name:this.scene,elapsed:this.elapsed,...Actor.SCENES[this.scene]}}}
 Actor.SCENES=vm.runInNewContext('('+read('js/green-actor.js').match(/const SCENES = Object.freeze\((\{[\s\S]*?\n\})\);/)[1]+')');
 const storage=new Map(),envs=[];
 const ctx={console,Date:class extends Date{constructor(...args){super(...(args.length?args:[now]))}},MutationObserver:class{observe(){}disconnect(){}},GreenActor:Actor,document:{hidden:false,getElementById:id=>({loginScreen:login,loginPin:pin,loginUser:user}[id]||null),addEventListener:(e,fn)=>callbacks[e]=fn},setTimeout:(fn)=>{timers.set(++timerID,fn);return timerID},clearTimeout:id=>timers.delete(id),setInterval:(fn,ms)=>intervals.push({fn,ms}),matchMedia:()=>({matches:reduced,addEventListener:(name,fn)=>callbacks.mediachange=fn})};
 ctx.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 ctx.NavidadHistoria={create(){const e={taken:false,start(){return true},pull(t){this.taken=t>=3.2},give(t){this.taken=t<3.8},release(){},drop(t){if(t>=2.4)this.taken=false},restore(){this.taken=false},destroy(){this.taken=false}};envs.push(e);return e}};
 ctx.window=ctx;ctx.__temas={modo:mode,activo:{id:'navidad'},etapaDe:()=>({id:now.getDate()<=21?'pre':'casa'})};
 vm.createContext(ctx);vm.runInContext(read('js/navidad-hielo.js'),ctx);vm.runInContext(read('js/navidad-mascota.js'),ctx);
 function advance(seconds){let left=seconds;while(left>0){const dt=Math.min(.05,left);left-=dt;const a=actors.at(-1);if(!a||a.paused||a.destroyed)continue;const meta=Actor.SCENES[a.scene];a.elapsed=meta.loop?(a.elapsed+dt)%meta.duration:Math.min(meta.duration,a.elapsed+dt);a.options.onFrame(a.getSceneInfo(),dt);}}
 return {ctx,mount,iceNode,svg,login,form,pin,user,actors,callbacks,intervals,timers,advance,envs,storage,setDate:d=>{now=new Date(d+'T12:00:00')}};
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
 const f=fixture({date:'2026-12-22',reduced:true});f.ctx.__mascotaNavidadSync();f.advance(120);assert.equal(f.actors[0].scene,'idle');assert.equal(f.actors[0].paused,true);
});
test('se conservan las 14 animaciones originales y se agregan 6 poses integradas',()=>{
 const scenes=read('js/green-actor.js').match(/const SCENES = Object.freeze\(\{([\s\S]*?)\n\}\);/)[1];assert.equal((scenes.match(/duration:/g)||[]).length,20);
 for(const name of ['idle','sneak','run','climb','steal','caught','drop','tantrum','hide','tap1','tap2','tap3','xmas','nye','thaw','privacy','tug','offer','grump','plot'])assert.match(scenes,new RegExp('\\b'+name+':'));
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
test('la liberación se completa una vez por temporada y la vista previa no guarda esa marca',()=>{
 const f=fixture({date:'2026-12-22'});f.ctx.__mascotaNavidadSync();assert.equal(f.actors.at(-1).scene,'thaw');f.advance(6.3);
 assert.equal(f.storage.get('innova_nv_liberado_2026'),'1');assert.equal(f.actors.at(-1).scene,'idle');
 f.ctx.__temas.activo=null;f.ctx.__mascotaNavidadSync();f.ctx.__temas.activo={id:'navidad'};f.ctx.__mascotaNavidadSync();assert.equal(f.actors.at(-1).scene,'idle');
 const p=fixture({date:'2026-12-22',mode:'ver'});p.ctx.__mascotaNavidadSync();p.advance(6.3);assert.equal(p.storage.size,0);
});
test('la historia usa tiempo animado: no avanza con la pestaña oculta',()=>{
 const f=fixture({date:'2026-12-22',mode:'ver'});f.ctx.__mascotaNavidadSync();f.advance(2);const before=f.ctx.__mascotaNavidadEstado().tiempo;
 f.ctx.document.hidden=true;f.callbacks.visibilitychange();f.advance(90);assert.equal(f.ctx.__mascotaNavidadEstado().tiempo,before);
 f.ctx.document.hidden=false;f.callbacks.visibilitychange();f.advance(4.3);assert.equal(f.ctx.__mascotaNavidadEstado().historia,null);
});
test('una travesura tiene acercamiento, tirón y devolución; al tocarlo se sobresalta',()=>{
 const f=fixture({date:'2026-12-22',mode:'ver'});f.ctx.__mascotaNavidadSync();assert.equal(f.ctx.__mascotaNavidadHistoria('travesura'),true);
 assert.equal(f.actors.at(-1).scene,'sneak');f.advance(3.5);assert.equal(f.actors.at(-1).scene,'tug');assert.equal(f.envs.at(-1).taken,true);
 f.svg.emit('pointerdown');assert.equal(f.actors.at(-1).scene,'caught');assert.equal(f.ctx.__mascotaNavidadEstado().historia,'descubierto');
 f.advance(4.9);assert.equal(f.envs.at(-1).taken,false);assert.equal(f.actors.at(-1).scene,'idle');
});
test('enfocar el PIN devuelve el foco real, cubre los ojos y no lee credenciales',()=>{
 const f=fixture({date:'2026-12-22',mode:'ver'});Object.defineProperty(f.pin,'value',{get(){throw Error('No se debe leer el PIN')}});
 f.ctx.__mascotaNavidadSync();f.ctx.__mascotaNavidadHistoria('travesura');f.advance(4);assert.equal(f.envs.at(-1).taken,true);
 f.form.emit('focusin',{target:f.pin});assert.equal(f.envs.at(-1).taken,false);assert.equal(f.actors.at(-1).scene,'privacy');f.advance(40);assert.equal(f.actors.at(-1).scene,'privacy');
 assert.equal(f.ctx.__mascotaNavidadHistoria('travesura'),false);f.form.emit('focusout',{relatedTarget:null});assert.equal(f.actors.at(-1).scene,'idle');
});
test('cambiar de tema devuelve el foco y elimina los escuchadores del formulario',()=>{
 const f=fixture({date:'2026-12-22',mode:'ver'});f.ctx.__mascotaNavidadSync();f.ctx.__mascotaNavidadHistoria('travesura');f.advance(4);const env=f.envs.at(-1);
 f.ctx.__temas.activo={id:'muertos'};f.ctx.__mascotaNavidadSync();assert.equal(env.taken,false);assert.equal(f.form.events.focusin.size,0);assert.equal(f.form.events.focusout.size,0);
});
test('las historias de prueba no pueden forzarse fuera de Ver ahora o dentro del hielo',()=>{
 const real=fixture({date:'2026-12-22'});real.ctx.__mascotaNavidadSync();assert.equal(real.ctx.__mascotaNavidadHistoria('travesura'),false);
 const frozen=fixture({mode:'ver'});frozen.ctx.__mascotaNavidadSync();assert.equal(frozen.ctx.__mascotaNavidadHistoria('travesura'),false);
});
test('con movimiento reducido el PIN se cubre sin animación y las historias no empiezan',()=>{
 const f=fixture({date:'2026-12-22',mode:'ver',reduced:true});f.ctx.__mascotaNavidadSync();assert.equal(f.ctx.__mascotaNavidadEstado().historia,null);
 f.form.emit('focusin',{target:f.pin});assert.equal(f.actors.at(-1).scene,'privacy');assert.equal(f.actors.at(-1).elapsed,.6);assert.equal(f.actors.at(-1).paused,true);
});
test('la devolución de la luz termina sin dejar el foco de la escena oculto',()=>{
 const f=fixture({date:'2026-12-25',mode:'ver'});f.ctx.__mascotaNavidadSync();f.ctx.__mascotaNavidadHistoria('regalo');f.advance(1);assert.equal(f.actors.at(-1).scene,'offer');assert.equal(f.envs.at(-1).taken,true);
 f.advance(4.1);assert.equal(f.envs.at(-1).taken,false);assert.equal(f.ctx.__mascotaNavidadEstado().historia,null);
});
test('motor real: todas las escenas conservan transformaciones finitas y restauran los brazos',()=>{
 const context={Math,console,requestAnimationFrame:()=>1,cancelAnimationFrame(){},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}}};context.window=context;vm.createContext(context);vm.runInContext(read('js/green-actor.js'),context);
 for(const embedded of [false,true]){
  const svg=new Element();svg.tagName='svg';svg.dispatchEvent=()=>{};
  for(const id of read('index.html').matchAll(/id="([^"]+)"/g))svg.children['#'+id[1]]=new Element();
  const actor=new context.GreenActor(svg,{embedded});actor.pause();
  for(const [name,meta] of Object.entries(context.GreenActor.SCENES)){
   actor.play(name);for(const p of [0,.25,.5,.9,1]){actor.render(meta.duration*p);for(const n of Object.values(svg.children))for(const v of Object.values(n.attrs))assert.doesNotMatch(v,/NaN|Infinity/,name);}
  }
  actor.play('privacy');actor.render(.6);assert.equal(actor.n('hands-eyes').attrs.opacity,'1');assert.equal(actor.n('arm-left').attrs.opacity,'0');
  actor.play('idle');actor.render(0);assert.equal(actor.n('hands-eyes').attrs.opacity,'0');assert.equal(actor.n('arm-left').attrs.opacity,'1');assert.equal(actor.n('arm-right').attrs.opacity,'1');actor.destroy();
 }
});
test('sin guirnalda no inicia una travesura ni deja la pose bloqueada',()=>{
 const f=fixture({date:'2026-12-22',mode:'ver'});f.ctx.__mascotaNavidadSync();f.envs.at(-1).start=()=>false;
 assert.equal(f.ctx.__mascotaNavidadHistoria('travesura'),false);assert.equal(f.ctx.__mascotaNavidadEstado().historia,null);assert.equal(f.actors.at(-1).scene,'idle');f.advance(100);assert.ok(['idle','grump','plot'].includes(f.actors.at(-1).scene));assert.equal(f.ctx.__mascotaNavidadEstado().historia,null);
});
test('activar movimiento reducido durante el PIN conserva las manos sobre los ojos',()=>{
 const f=fixture({date:'2026-12-22',mode:'ver'});f.ctx.__mascotaNavidadSync();f.form.emit('focusin',{target:f.pin});f.callbacks.mediachange({matches:true});
 assert.equal(f.actors.at(-1).scene,'privacy');assert.equal(f.actors.at(-1).elapsed,.6);assert.equal(f.actors.at(-1).paused,true);
});

test('el deshielo interpola sin saltos, permite invertirlo y cancela sus cuadros al salir',()=>{
 const f=fixture(),frames=new Map();let seq=0;
 f.ctx.requestAnimationFrame=fn=>{frames.set(++seq,fn);return seq};
 f.ctx.cancelAnimationFrame=id=>frames.delete(id);
 function frame(time){const entries=[...frames];frames.clear();for(const [,fn] of entries)fn(time);}
 function top(){return Number(f.iceNode.children['#nvice-body'].attrs.d.match(/^M[\d.]+ ([\d.]+)/)[1]);}
 const ice=f.ctx.NavidadHielo.create(1,f.mount),start=top();
 ice.update(21);assert.equal(top(),start);frame(0);frame(475);
 const middle=top();assert.ok(middle>start&&middle<922);
 ice.update(1);assert.equal(frames.size,1);frame(600);frame(1550);assert.equal(top(),start);assert.equal(frames.size,0);
 ice.update(21);assert.equal(frames.size,1);ice.destroy();assert.equal(frames.size,0);
});
test('las gotas y las ondas mantienen el mismo punto de caída durante el deshielo',()=>{
 const f=fixture(),ice=f.ctx.NavidadHielo.create(1,f.mount);
 for(const day of [1,7,14,21]){
  ice.update(day);
  f.iceNode.drops.forEach((drop,i)=>{
   const [x,y]=drop.style.translate.split(' ').map(parseFloat);
   assert.ok(y<1022);assert.equal(x,Number(f.iceNode.children[i?'#nvice-ripple-b':'#nvice-ripple-a'].attrs.cx));
   assert.ok(Math.abs(y+parseFloat(drop.style['--nv-chute'])-1022)<.2);
  });
 }
});

test('alterna gestos con pausas y todavía tira de una esfera: los gestos no reinician la espera',()=>{
 const f=fixture({date:'2026-12-22',mode:'ver'});f.ctx.Math=Object.create(Math);f.ctx.Math.random=()=>0;f.ctx.__mascotaNavidadSync();
 const scenes=new Set(),stories=new Set();
 for(let i=0;i<650;i++){f.advance(.1);scenes.add(f.actors.at(-1).scene);stories.add(f.ctx.__mascotaNavidadEstado().historia);}
 for(const name of ['idle','grump','plot','tug','caught'])assert.ok(scenes.has(name),name);
 assert.ok(stories.has('travesura'));assert.ok(stories.has('descubierto'));
});
test('enfocar el PIN interrumpe el gesto y el cambio de tema limpia su estado',()=>{
 const f=fixture({date:'2026-12-22',mode:'ver'});f.ctx.__mascotaNavidadSync();f.ctx.__mascotaNavidadPlay('grump');
 assert.equal(f.mount.dataset.gesto,'grump');f.form.emit('focusin',{target:f.pin});assert.equal(f.actors.at(-1).scene,'privacy');assert.equal(f.mount.dataset.gesto,undefined);
 f.advance(40);assert.equal(f.actors.at(-1).scene,'privacy');
 f.ctx.__temas.activo=null;f.ctx.__mascotaNavidadSync();assert.equal(f.mount.dataset.gesto,undefined);
});
test('un berrinche manual termina y vuelve al reposo en el login',()=>{
 const f=fixture({date:'2026-12-22',mode:'ver'});f.ctx.__mascotaNavidadSync();f.ctx.__mascotaNavidadPlay('tantrum');f.advance(5.4);assert.equal(f.actors.at(-1).scene,'idle');
});


test('Enter y espacio repiten los toques y el teclado se desconecta al cambiar de tema',()=>{
 const f=fixture({date:'2026-12-22',mode:'ver'});f.ctx.__mascotaNavidadSync();let prevented=0;
 f.svg.emit('keydown',{key:'Enter',preventDefault(){prevented++}});assert.equal(f.actors.at(-1).scene,'tap1');
 f.svg.emit('keydown',{key:' ',preventDefault(){prevented++}});assert.equal(f.actors.at(-1).scene,'tap2');assert.equal(prevented,2);
 f.ctx.__temas.activo=null;f.ctx.__mascotaNavidadSync();assert.equal(f.svg.events.keydown.size,0);
});

function realActor(options={}){
 const context={Math,console,requestAnimationFrame:()=>1,cancelAnimationFrame(){},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}}};context.window=context;
 vm.createContext(context);vm.runInContext(read('js/green-actor.js'),context);
 const svg=new Element();svg.tagName='svg';svg.dispatchEvent=()=>{};
 for(const id of read('assets/navidad/personaje-animable.svg').matchAll(/id="([^"]+)"/g))svg.children['#'+id[1]]=new Element();
 const actor=new context.GreenActor(svg,{embedded:true,...options});let now=1000;actor.frame(now);
 return {actor,tick(dt){now+=dt*1000;actor.frame(now);}};
}
test('dentro del hielo mantiene cejas, párpados y boca enojados sin mover el cuerpo',()=>{
 const {actor}=realActor({frozen:true,personality:false});
 actor.render(0);const root=actor.n('actor').attrs.transform,brow=actor.n('brow-left').attrs.d;
 const arms=[actor.n('arm-left').attrs.transform,actor.n('arm-right').attrs.transform];
 for(const t of [0,1,5,20]){
  actor.render(t);assert.equal(actor.n('brow-left').attrs.d,brow);
  assert.equal(actor.n('expression-mouth').attrs.opacity,'1');assert.equal(actor.n('mouth').attrs.opacity,'0');
  assert.equal(actor.n('lid-left').attrs.opacity,'1');assert.equal(actor.n('actor').attrs.transform,root);
  assert.deepEqual([actor.n('arm-left').attrs.transform,actor.n('arm-right').attrs.transform],arms);
 }
});

test('congelado mira al formulario y aparta la mirada del PIN sin leer los campos',()=>{
 const f=fixture();
 for(const field of [f.pin,f.user])Object.defineProperty(field,'value',{get(){throw Error('No se debe leer el campo')}});
 f.ctx.__mascotaNavidadSync();f.form.emit('focusin',{target:f.user});assert.equal(f.mount.dataset.mirada,'formulario');
 f.form.emit('focusin',{target:f.pin});assert.equal(f.mount.dataset.mirada,'apartada');assert.equal(f.actors[0].paused,true);
 f.form.emit('focusout',{relatedTarget:null});assert.equal(f.mount.dataset.mirada,undefined);
});
test('el fastidio al tocar el hielo termina y se limpia al cambiar de tema',()=>{
 const f=fixture();f.ctx.__mascotaNavidadSync();f.svg.emit('pointerdown');
 assert.equal(f.mount.dataset.reaccion,'molesto');assert.equal(f.actors[0].paused,true);
 const [timer,end]=[...f.timers.entries()].at(-1);f.timers.delete(timer);end();assert.equal(f.mount.dataset.reaccion,undefined);
 f.svg.emit('pointerdown');f.ctx.__temas.activo=null;f.ctx.__mascotaNavidadSync();
 assert.equal(f.mount.dataset.reaccion,undefined);assert.equal(f.mount.dataset.mirada,undefined);assert.equal(f.timers.size,0);
});
test('el hielo no reacciona a toques con movimiento reducido ni con el login oculto',()=>{
 const reduced=fixture({reduced:true});reduced.ctx.__mascotaNavidadSync();reduced.svg.emit('pointerdown');assert.equal(reduced.timers.size,0);
 const hidden=fixture();hidden.ctx.__mascotaNavidadSync();hidden.login.classList.remove('active');hidden.svg.emit('pointerdown');assert.equal(hidden.timers.size,0);
});
test('las interrupciones conservan la pose y la velocidad; no vuelven al origen de golpe',()=>{
 const {actor,tick}=realActor();actor.play('grump');for(let i=0;i<150;i++)tick(1/60);
 const arm=actor.n('arm-left').attrs.transform,head=actor.n('head').attrs.transform;
 actor.play('caught');assert.equal(actor.n('arm-left').attrs.transform,arm);assert.equal(actor.n('head').attrs.transform,head);
 tick(1/60);assert.ok(Math.abs(actor._pose.leftArm+34)<2);
 actor.play('idle');for(let i=0;i<120;i++)tick(1/60);
 assert.ok(Math.abs(actor._pose.leftArm)<3);assert.ok(Math.abs(actor._velocity.leftArm)<5);
});
test('la respiración sigue su fase al repetir el ciclo de reposo',()=>{
 const {actor,tick}=realActor();const values=[];
 for(let i=0;i<400;i++){tick(1/60);values.push(actor._pose.dy);}
 assert.ok(Math.abs(values[348]-values[347])<.15);assert.ok(values.every(Number.isFinite));
});
test('la respuesta amortiguada coincide a 30 y 60 cuadros por segundo',()=>{
 function at(fps){const r=realActor();r.actor.play('grump');for(let i=0;i<fps*2;i++)r.tick(1/fps);return r.actor._pose;}
 const slow=at(30),fast=at(60);
 for(const key of ['leftArm','rightArm','head','dy','scarf'])assert.ok(Math.abs(slow[key]-fast[key])<.7,key);
});
test('las manos siguen conectadas a los hombros al cubrir el PIN y al bajar',()=>{
 const {actor,tick}=realActor();actor.play('privacy');
 for(let i=0;i<60;i++){tick(1/60);assert.match(actor.n('cover-arm-left').attrs.d,/^M352 580 /);assert.match(actor.n('cover-arm-right').attrs.d,/^M445 580 /);}
 assert.ok(actor._pose.cover>.99);assert.equal(actor.n('hands-eyes').attrs.transform,'translate(0 0)');
 actor.play('idle');assert.ok(Number(actor.n('hands-eyes').attrs.opacity)>.9);
 for(let i=0;i<90;i++)tick(1/60);
 assert.equal(actor.n('hands-eyes').attrs.opacity,'0');assert.equal(actor.n('arm-left').attrs.opacity,'1');
});

test('el controlador conserva la pose congelada al avanzar el deshielo y la retira el 22',()=>{
 const f=fixture();f.ctx.__mascotaNavidadSync();assert.equal(f.actors.at(-1).options.frozen,true);
 f.setDate('2026-12-21');f.ctx.__mascotaNavidadSync();assert.equal(f.actors.at(-1).options.frozen,true);
 f.setDate('2026-12-22');f.ctx.__mascotaNavidadSync();assert.equal(f.actors.at(-1).options.frozen,false);
});
test('la amortiguación y su reloj permanecen quietos durante la pausa',()=>{
 const {actor,tick}=realActor();actor.play('grump');for(let i=0;i<45;i++)tick(1/60);
 const before=actor.n('arm-left').attrs.transform,time=actor.motionTime;
 actor.pause();tick(60);actor.resume();tick(1/60);
 assert.equal(actor.n('arm-left').attrs.transform,before);assert.equal(actor.motionTime,time);
 tick(1/60);assert.ok(actor.motionTime-time<.02);assert.ok(Number.isFinite(actor._pose.leftArm));
});

test('el nuevo dibujo conserva huesos y manos conectadas en todas las escenas',()=>{
 const {actor}=realActor();
 for(const name of Object.keys(actor.constructor.SCENES)){
  actor.play(name);
  for(let step=0;step<=8;step++){
   actor.render(actor.constructor.SCENES[name].duration*step/8);
   for(const side of ['left','right']){
    const points=actor.n('arm-'+side+'-curve').attrs.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    const [sx,sy]=points,ex=points[6],ey=points[7],hx=points[12],hy=points[13];
    assert.ok(Math.abs(Math.hypot(ex-sx,ey-sy)-85)<.02,name+' hombro');
    assert.ok(Math.abs(Math.hypot(hx-ex,hy-ey)-95)<.02,name+' antebrazo');
    const wrist=actor.n('hand-'+side).attrs.transform.match(/translate\(([-\d.]+) ([-\d.]+)\)/);
    assert.equal(Number(wrist[1]),hx);assert.equal(Number(wrist[2]),hy);
    const leg=actor.n('leg-'+side+'-curve').attrs.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    assert.ok(Math.abs(Math.hypot(leg[6]-leg[0],leg[7]-leg[1])-60)<.02,name+' muslo');
    assert.ok(Math.abs(Math.hypot(leg[12]-leg[6],leg[13]-leg[7])-60)<.02,name+' rodilla');
   }
  }
 }
});
test('interrumpir un gesto conserva también los codos y las muñecas del dibujo nuevo',()=>{
 const {actor,tick}=realActor();actor.play('grump');for(let i=0;i<100;i++)tick(1/60);
 const curve=actor.n('arm-left-curve').attrs.d,hand=actor.n('hand-left').attrs.transform;
 actor.play('caught');assert.equal(actor.n('arm-left-curve').attrs.d,curve);assert.equal(actor.n('hand-left').attrs.transform,hand);
 tick(1/60);assert.ok(actor.n('arm-left-curve').attrs.d!==curve);
});
test('los pies mantienen su apoyo durante la respiración del reposo',()=>{
 const {actor}=realActor();
 for(let t=0;t<14;t+=.13){
  actor.render(t);
  const root=actor.n('actor').attrs.transform.match(/^translate\(([-\d.]+) ([-\d.]+)\)/),dy=Number(root[2]);
  for(const side of ['left','right']){
   const curve=actor.n('leg-'+side+'-curve').attrs.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
   assert.ok(Math.abs(curve[13]+dy-939)<.02);
  }
 }
});
test('la zancada alterna el pie que se levanta',()=>{
 const {actor}=realActor();
 actor.poseLeg('left',14,0,true);actor.poseLeg('right',-14,0,true);
 const end=side=>Number(actor.n('leg-'+side+'-curve').attrs.d.match(/-?\d+(?:\.\d+)?/g).at(-1));
 assert.ok(end('left')<920);assert.ok(Math.abs(end('right')-939)<.1);
 actor.poseLeg('left',-14,0,true);actor.poseLeg('right',14,0,true);
 assert.ok(end('right')<920);assert.ok(Math.abs(end('left')-939)<.1);
});
test('el SVG canónico y el incrustado son idénticos y mantienen todos los identificadores',()=>{
 const svg=read('assets/navidad/personaje-animable.svg'),html=read('index.html');
 const start=html.indexOf('<svg id="nv-green-character"'),end=html.indexOf('</svg>',start)+6;
 assert.equal(html.slice(start,end),svg);
 const ids=Array.from(svg.matchAll(/id="([^"]+)"/g),m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const id of ['arm-left-curve','arm-right-curve','hand-left','hand-right','leg-left-curve','leg-right-curve','iris-clip-left','iris-clip-right'])assert.ok(ids.includes(id));
});
test('la mano alcanza el objeto real y se retira sin saltar al interrumpir la travesura',()=>{
 const {actor,tick}=realActor();actor.reachFor({x:650,y:580});actor.play('tug');actor.render(1.4);
 const h=actor.n('hand-right').attrs.transform.match(/translate\(([-\d.]+) ([-\d.]+)\)/),root=actor.n('actor').attrs.transform.match(/^translate\(([-\d.]+) ([-\d.]+)\)/);
 assert.ok(Math.abs(Number(h[1])+Number(root[1])-650)<.05);assert.ok(Math.abs(Number(h[2])+Number(root[2])-580)<.05);
 const curve=actor.n('arm-right-curve').attrs.d;actor.reachFor(null);actor.play('caught');assert.equal(actor.n('arm-right-curve').attrs.d,curve);
 for(let i=0;i<80;i++)tick(1/60);assert.ok(actor._pose.worldReach<.001);
});
test('puede mirar un punto de la escena sin interferir con la pose del PIN',()=>{
 const {actor,tick}=realActor();actor.lookAt({x:0,y:0},3);for(let i=0;i<20;i++)tick(1/60);
 assert.ok(actor._pose.pupilX<0);assert.ok(actor._pose.pupilY<0);
 actor.play('privacy');actor.render(.6);assert.equal(actor._pose.pupilX,0);assert.equal(actor._pose.pupilY,0);
 actor.reachFor({x:NaN,y:0});assert.equal(actor._reachTarget,null);
});
test('la pausa de revisión no está disponible fuera de Ver ahora ni estando congelado',()=>{
 const actual=fixture({date:'2026-12-22'});actual.ctx.__mascotaNavidadSync();assert.equal(actual.ctx.__mascotaNavidadPausa(true),false);
 const frozen=fixture({mode:'ver'});frozen.ctx.__mascotaNavidadSync();assert.equal(frozen.ctx.__mascotaNavidadPausa(true),false);
 const local=fixture({date:'2026-12-22',mode:'ver'});local.ctx.__mascotaNavidadSync();assert.equal(local.ctx.__mascotaNavidadPausa(true),true);assert.equal(local.actors.at(-1).paused,true);
 local.ctx.__mascotaNavidadPausa(false);assert.equal(local.actors.at(-1).paused,false);
});

test('tras liberarse se interesa por el árbol en los primeros segundos',()=>{
 const f=fixture({date:'2026-12-22',mode:'ver'});f.ctx.__mascotaNavidadSync();f.advance(9);assert.equal(f.ctx.__mascotaNavidadEstado().historia,'travesura');
});
test('el tirón del adorno tiene recorrido visible y conserva las longitudes del brazo',()=>{
 const {actor}=realActor();actor.reachFor({x:680,y:580});actor.play('tug');actor.render(1.4);
 const point=()=>{const h=actor.n('hand-right').attrs.transform.match(/translate\(([-\d.]+) ([-\d.]+)\)/),r=actor.n('actor').attrs.transform.match(/^translate\(([-\d.]+) ([-\d.]+)\)/);return {x:Number(h[1])+Number(r[1]),y:Number(h[2])+Number(r[2]),localX:Number(h[1]),localY:Number(h[2])};};
 const contact=point();actor.render(1.95);const pulled=point();assert.ok(contact.x-pulled.x>90);assert.ok(Math.hypot(pulled.localX-444,pulled.localY-580)<180);
});
