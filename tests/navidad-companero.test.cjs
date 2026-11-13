const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
class Element{
 constructor(){this.dataset={};this.events={};this.attrs={};this.children=[];this.isConnected=true;this.visible=true;const classes=new Set();this.classList={add:(...xs)=>xs.forEach(x=>classes.add(x)),remove:x=>classes.delete(x),contains:x=>classes.has(x),toggle:(x,on)=>{if(on)classes.add(x);else classes.delete(x);}};this.style={};}
 setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}getClientRects(){return this.visible?[{}]:[];}
 appendChild(e){e.parentElement?.children.splice(e.parentElement.children.indexOf(e),1);this.children.push(e);e.parentElement=this;e.isConnected=true;}
 remove(){if(this.parentElement)this.parentElement.children.splice(this.parentElement.children.indexOf(this),1);this.isConnected=false;}
 querySelector(){return null;}querySelectorAll(){return [];}contains(e){return this.children.includes(e);}matches(){return false;}closest(){return null;}
 addEventListener(k,fn){this.events[k]=fn;}click(){this.events.click?.({});}
}
function fixture({stage='casa',theme='navidad',autonomous=false}={}){
 let current=stage,enabled=theme,selected=true,modalOn=false,point=null;const events={},actors=[],ices=[],worlds=[],talks=[],timers=new Map(),due=new Map();let id=0,clock=0;
 const hero=new Element(),other=new Element(),screen=new Element(),template={innerHTML:'<svg id="drawing"><g id="actor"/></svg><div class="nv-hielo-fijo"/>'},modal=new Element(),app=new Element();let chosen=hero;
 screen.classList.add('active');screen.querySelectorAll=()=>[chosen];screen.querySelector=()=>point;screen.contains=e=>e?.inside===true;
 const doc={hidden:false,readyState:'loading',activeElement:null,addEventListener:(k,f)=>events[k]=f,querySelector:s=>s.startsWith('#employeeScreen')?(selected?screen:null):s.startsWith('#loginScreen .nv-mascota')?template:s==='#fxOk.on'&&modalOn?modal:null,querySelectorAll:()=>modalOn?[modal]:[],getElementById:()=>app,createElement(){const e=new Element(),svg=new Element();svg.style={};e.querySelector=s=>s==='svg'?svg:null;e.querySelectorAll=()=>[];return e;}};
 class Actor{constructor(svg,options){this.svg=svg;this.options=options;this.scene=options.initialScene;this.elapsed=0;this.plays=[];actors.push(this);}play(n){this.scene=n;this.elapsed=0;this.plays.push(n);return this;}pause(){this.paused=true;}resume(){this.paused=false;}render(t){this.rendered=t;}reachFor(p){this.target=p;return this;}destroy(){this.destroyed=true;}lookAt(p){this.look=p;}}
 Actor.SCENES=vm.runInNewContext('('+read('js/green-actor.js').match(/const SCENES = Object.freeze\((\{[\s\S]*?\n\})\);/)[1]+')');
 let reduced=false;
 const ctx={window:null,document:doc,Date,Number,Array,GreenActor:Actor,NavidadHielo:{create(d,e,o){const ice={options:o,days:[d],update(d){this.days.push(d);},touch(){this.touched=true;},destroy(){this.destroyed=true;}};ices.push(ice);return ice;}},NavidadEntorno:{createDialogue(){const t={lines:[],say(s){this.lines.push(s);},hide(){this.hidden=true;},destroy(){this.destroyed=true;}};talks.push(t);return t;},point:(svg,p)=>p,create(s,m,options){const world={options,resetGaze(){this.reset=true;},suspend(){},destroy(){this.destroyed=true;},react(d){options.react(d);}};worlds.push(world);return world;}},MutationObserver:class{observe(){}},setTimeout:(f,ms=0)=>{timers.set(++id,f);due.set(id,clock+ms);return id;},clearTimeout:id=>{timers.delete(id);due.delete(id);},setInterval(){},matchMedia:()=>({get matches(){return reduced;},addEventListener:(k,f)=>events.media=f})};ctx.window=ctx;ctx.addEventListener=(k,f)=>events[k]=f;ctx.__temas={modo:'auto',get activo(){return {id:enabled};},etapaDe:()=>({id:current})};vm.createContext(ctx);if(autonomous)vm.runInContext(read('js/navidad-vida.js'),ctx);vm.runInContext(read('js/navidad-companero.js'),ctx);events.DOMContentLoaded();
 function advance(seconds){let left=seconds;while(left>0){const dt=Math.min(left,.05);left-=dt;clock+=dt*1000;for(const [id,at] of [...due])if(at<=clock){const fn=timers.get(id);timers.delete(id);due.delete(id);fn?.();}const a=actors.at(-1);if(a&&!a.paused&&!a.destroyed){a.elapsed+=dt;a.options.onFrame({elapsed:a.elapsed},dt);}}}
 return {ctx,doc,hero,other,screen,actors,ices,worlds,talks,events,timers,advance,setStage:s=>current=s,setTheme:s=>enabled=s,setSelected:s=>selected=s,setHero:h=>chosen=h,setModal:v=>modalOn=v,setPoint:p=>point=p,setReduced:v=>reduced=v,sync:ctx.NavidadCompanero.sync};
}
test('reutiliza el dibujo y aísla degradados, filtros, enlaces y etiquetas del login',()=>{
 const f=fixture(),svg=read('assets/navidad/personaje-animable.svg'),n=f.ctx.NavidadCompanero.namespace(svg,'nvi-');
 const ids=[...n.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);assert.ok(ids.every(id=>id.startsWith('nvi-')));
 for(const m of n.matchAll(/url\(#([^)]*)\)/g))assert.ok(ids.includes(m[1]),m[1]);
 assert.ok(n.includes('aria-labelledby="nvi-art-title nvi-art-desc"'));assert.ok(n.includes('data-nv-part="hand-right"'));
 assert.equal(f.ctx.NavidadCompanero.namespace('<use href="#a"/><path id="a" fill="#fff"/>','x-'),'<use href="#x-a"/><path id="x-a" data-nv-part="a" fill="#fff"/>');
});
test('navegar traslada el mismo personaje y su motor al encabezado nuevo',()=>{
 const f=fixture(),node=f.hero.children[0];f.setHero(f.other);f.sync();assert.equal(f.other.children[0],node);assert.equal(f.actors.length,1);assert.equal(f.actors[0].scene,'idle');assert.equal(f.hero.classList.contains('nv-con-companero'),false);
});
test('no aparece en otros temas ni fuera de las pantallas autenticadas',()=>{
 const f=fixture({theme:'muertos'});assert.equal(f.actors.length,0);f.setTheme('navidad');f.sync();assert.equal(f.actors.length,1);f.setSelected(false);f.sync();assert.equal(f.actors[0].destroyed,true);assert.equal(f.hero.children.length,0);assert.equal(f.worlds[0].destroyed,true);
});
test('conserva el hielo hasta el cambio de etapa y limpia el motor anterior',()=>{
 const f=fixture({stage:'pre'});assert.equal(f.actors[0].paused,true);assert.equal(f.actors[0].options.frozen,true);assert.equal(f.ices[0].options.idPrefix,'nvi-');f.setStage('casa');f.sync();assert.equal(f.ices[0].destroyed,true);assert.equal(f.actors[0].destroyed,true);assert.equal(f.actors[1].options.frozen,false);assert.equal(f.hero.children.length,1);
});
test('el modal pausa y al cerrar no añade gestos al guardado de Santa',()=>{
 const f=fixture();f.setModal(true);f.sync();assert.equal(f.actors[0].paused,true);assert.notEqual(f.actors[0].scene,'ack');f.setModal(false);f.sync();assert.equal(f.actors[0].scene,'idle');f.actors[0].options.onFrame({},3);assert.equal(f.actors[0].scene,'idle');f.sync();assert.equal(f.actors[0].scene,'idle');
});
test('un marcaje no provoca gestos ajenos al tema ni se leen sus datos',()=>{
 const f=fixture(),p={};Object.defineProperty(p,'textContent',{get(){throw Error('No leer datos de marcaje');}});f.setPoint(p);f.sync();assert.equal(f.actors[0].scene,'idle');f.actors[0].options.onFrame({},3);f.sync();assert.equal(f.actors[0].scene,'idle');
});
test('al editar un PIN aparta la mirada y pausa sin acceder al contenido',()=>{
 const f=fixture(),input={inside:true,type:'password',matches:()=>true};Object.defineProperty(input,'value',{get(){throw Error('No leer credenciales');}});f.doc.activeElement=input;f.events.focusin();assert.equal(f.actors[0].scene,'privacy');assert.equal(f.actors[0].rendered,.6);assert.equal(f.actors[0].paused,true);f.doc.activeElement=null;f.events.focusin();assert.equal(f.actors[0].scene,'idle');assert.equal(f.actors[0].paused,false);
});
test('movimiento reducido y pestaña oculta impiden las reacciones',()=>{
 const f=fixture();f.setReduced(true);f.sync();f.hero.children[0].click();assert.equal(f.actors[0].paused,true);assert.notEqual(f.actors[0].scene,'grump');f.setReduced(false);f.doc.hidden=true;f.sync();assert.equal(f.actors[0].paused,true);f.doc.hidden=false;f.sync();assert.equal(f.actors[0].paused,false);
});
test('no congela toda la respiración al editar un campo normal ni inicia travesuras al escribir',()=>{
 const f=fixture();f.doc.activeElement={inside:true,type:'text',matches:()=>true};f.events.focusin();assert.equal(f.actors[0].paused,false);assert.equal(f.hero.children[0].dataset.estado,'editando');
 f.actors[0].options.onFrame({elapsed:2},20);assert.equal(f.actors[0].scene,'idle');
});
test('sin elementos cercanos los toques no inventan gestos ni objetos',()=>{
 const f=fixture(),node=f.hero.children[0];for(let i=0;i<20;i++){node.click();f.actors[0].options.onFrame({elapsed:20},20);assert.equal(f.actors[0].scene,'idle');}
});
test('al tocar el hielo presiona, deja marcas de las manos y vuelve al reposo dentro del bloque',()=>{
 const f=fixture({stage:'pre'});f.hero.children[0].click();assert.equal(f.actors[0].scene,'trapped');assert.equal(f.actors[0].paused,false);
 f.actors[0].options.onFrame({elapsed:.8},.8);assert.equal(f.ices[0].touched,true);f.actors[0].options.onFrame({elapsed:3.6},3);assert.equal(f.actors[0].paused,true);assert.equal(f.actors[0].scene,'idle');assert.equal(f.ices.length,1);
});
test('un modal con opacidad cero no bloquea al personaje',()=>{
 const f=fixture();f.ctx.getComputedStyle=()=>({opacity:'0',visibility:'visible',display:'flex'});f.setModal(true);f.sync();assert.equal(f.actors[0].paused,false);
});
function ornamentFixture(){
 const f=fixture(),boot=new Element(),values={};boot.style={setProperty:(k,v)=>values[k]=v,removeProperty:k=>delete values[k]};
 boot.querySelector=()=>({getScreenCTM:()=>({a:1,b:0,c:0,d:1,e:266,f:178})});let hand={e:400,f:300};
 const ornament=f.ctx.NavidadCompanero.createOrnament({querySelector:()=>boot},{querySelector:()=>({getScreenCTM:()=>hand})});return {ornament,boot,values,setHand:p=>hand=p};
}
test('la botita original solo se mueve tras el contacto real de la mano y vuelve a su lugar',()=>{
 const f=ornamentFixture();assert.equal(f.ornament.start(),true);f.ornament.pull(1.2);assert.equal(f.boot.classList.contains('nv-bota-tirada'),false);
 f.setHand({e:300,f:200});f.ornament.pull(1.25);f.setHand({e:310,f:197});f.ornament.pull(1.8);assert.equal(f.values['--nv-bota-x'],'10.00px');
 f.ornament.release();f.ornament.settle(.2);assert.ok(Math.abs(parseFloat(f.values['--nv-bota-x']))<10);f.ornament.settle(3);assert.equal(f.boot.classList.contains('nv-bota-tirada'),false);assert.deepEqual(f.values,{});
});

test('un cambio de luz dirige la mirada sin risas, saltos ni protestas añadidas',()=>{
 const f=fixture();f.worlds[0].react({kind:'foco',off:true,x:80,y:30});assert.equal(f.actors[0].scene,'idle');assert.equal(f.actors[0].look.x,80);
 f.worlds[0].react({kind:'foco',off:false,x:90,y:40});assert.equal(f.actors[0].scene,'idle');assert.equal(f.actors[0].look.x,90);
 const frozen=fixture({stage:'pre'});frozen.worlds[0].react({kind:'foco',x:80,y:30});assert.equal(frozen.actors[0].scene,'trapped');
});
test('solo sopla cuando el entorno devuelve un foco real y no repite gestos sin objetivo',()=>{
 const f=fixture(),w=f.worlds[0];let target=null,calls=0,cancelled=0;
 w.startBlow=()=>target;w.blowFrame=()=>calls++;w.cancelBlow=()=>cancelled++;
 f.hero.children[0].click();assert.equal(f.actors[0].scene,'idle');target={x:120,y:70};
 f.hero.children[0].click();assert.equal(f.actors[0].scene,'blow');assert.equal(f.actors[0].look.x,120);
 f.actors[0].options.onFrame({elapsed:1.9},1.9);assert.equal(calls,1);
 f.doc.activeElement={inside:true,type:'text',matches:()=>true};f.events.focusin();assert.ok(cancelled>0);assert.equal(f.actors[0].scene,'idle');
});
test('Año Nuevo espera un destello real y no tiembla en bucle',()=>{
 const f=fixture({stage:'ano'});f.actors[0].options.onFrame({elapsed:20},20);f.hero.children[0].click();assert.equal(f.actors[0].scene,'idle');
 f.worlds[0].react({kind:'destello',x:100,y:20});assert.equal(f.actors[0].scene,'nye');f.actors[0].options.onFrame({elapsed:2},2);assert.equal(f.actors[0].scene,'idle');
});

test('el toque muestra diálogo incluso con movimiento reducido y se limpia al salir del tema',()=>{
 const f=fixture({stage:'pre'});f.setReduced(true);f.sync();f.hero.children[0].click();
 assert.equal(f.talks[0].lines[0],'pre');assert.equal(f.actors[0].paused,true);
 f.doc.activeElement={inside:true,type:'text',matches:()=>true};f.events.focusin();assert.equal(f.talks[0].hidden,true);
 f.setTheme('muertos');f.sync();assert.equal(f.talks[0].destroyed,true);
});

test('el encabezado congelado despierta por sí mismo y vuelve a pausar entre gestos',()=>{
 const f=fixture({stage:'pre',autonomous:true});f.advance(2.6);assert.equal(f.actors[0].scene,'icewatch');assert.equal(f.actors[0].paused,false);
 f.advance(4);assert.equal(f.actors[0].scene,'idle');assert.equal(f.actors[0].paused,true);
 f.advance(120);for(const name of ['icewatch','trapped','icehuff','icedoze','icedraw','icesneeze'])assert.ok(f.actors[0].plays.includes(name),name);
 assert.equal(f.ices.length,1);
});
test('el encabezado libre tiene gestos variados sin depender de la botita o los focos',()=>{
 const f=fixture({autonomous:true});f.advance(100);
 for(const name of ['lookaround','hat','plot','doze','scoff','thaw'])assert.ok(f.actors[0].plays.includes(name),name);
});
test('la edición reciente pausa la iniciativa; un campo normal inactivo no la bloquea indefinidamente',()=>{
 const f=fixture({autonomous:true});f.doc.activeElement={inside:true,type:'text',matches:()=>true};f.events.focusin();f.advance(2);
 assert.equal(f.actors[0].scene,'idle');f.events.input();f.advance(2);assert.equal(f.actors[0].scene,'idle');
 f.advance(6);assert.ok(f.actors[0].plays.includes('lookaround'));
 f.doc.activeElement={inside:true,type:'password',matches:()=>true};f.events.focusin();const count=f.actors[0].plays.length;
 f.advance(60);assert.equal(f.actors[0].plays.length,count);assert.equal(f.actors[0].paused,true);
});
test('un modal, la pestaña oculta y salir del tema detienen la iniciativa del encabezado',()=>{
 const f=fixture({autonomous:true});f.setModal(true);f.sync();f.advance(90);assert.equal(f.actors[0].plays.length,0);assert.equal(f.timers.size,0);
 f.setModal(false);f.sync();f.advance(3);assert.ok(f.actors[0].plays.length>0);
 f.doc.hidden=true;f.sync();const count=f.actors[0].plays.length;f.advance(90);assert.equal(f.actors[0].plays.length,count);assert.equal(f.timers.size,0);
 f.setTheme('muertos');f.sync();assert.equal(f.timers.size,0);assert.equal(f.actors[0].destroyed,true);
});
