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
function fixture({stage='casa',theme='navidad'}={}){
 let current=stage,enabled=theme,selected=true,modalOn=false,point=null;const events={},actors=[],ices=[],worlds=[],timers=new Map();let id=0;
 const hero=new Element(),other=new Element(),screen=new Element(),template={innerHTML:'<svg id="drawing"><g id="actor"/></svg><div class="nv-hielo-fijo"/>'},modal=new Element(),app=new Element();let chosen=hero;
 screen.classList.add('active');screen.querySelectorAll=()=>[chosen];screen.querySelector=()=>point;screen.contains=e=>e?.inside===true;
 const doc={hidden:false,readyState:'loading',activeElement:null,addEventListener:(k,f)=>events[k]=f,querySelector:s=>s.startsWith('#employeeScreen')?(selected?screen:null):s.startsWith('#loginScreen .nv-mascota')?template:s==='#fxOk.on'&&modalOn?modal:null,querySelectorAll:()=>modalOn?[modal]:[],getElementById:()=>app,createElement(){const e=new Element(),svg=new Element();svg.style={};e.querySelector=s=>s==='svg'?svg:null;e.querySelectorAll=()=>[];return e;}};
 class Actor{constructor(svg,options){this.svg=svg;this.options=options;this.scene=options.initialScene;actors.push(this);}play(n){this.scene=n;return this;}pause(){this.paused=true;}resume(){this.paused=false;}render(t){this.rendered=t;}destroy(){this.destroyed=true;}lookAt(p){this.look=p;}}
 Actor.SCENES={idle:{duration:5},nye:{duration:5},privacy:{duration:.6},grump:{duration:5},plot:{duration:5},ack:{duration:2.8}};
 let reduced=false;
 const ctx={window:null,document:doc,Date,Number,Array,GreenActor:Actor,NavidadHielo:{create(d,e,o){const ice={options:o,days:[d],update(d){this.days.push(d);},touch(){this.touched=true;},destroy(){this.destroyed=true;}};ices.push(ice);return ice;}},NavidadEntorno:{point:(svg,p)=>p,create(s,m,options){const world={options,resetGaze(){this.reset=true;},suspend(){},destroy(){this.destroyed=true;},react(d){options.react(d);}};worlds.push(world);return world;}},MutationObserver:class{observe(){}},setTimeout:f=>{timers.set(++id,f);return id;},clearTimeout:id=>timers.delete(id),setInterval(){},matchMedia:()=>({get matches(){return reduced;},addEventListener:(k,f)=>events.media=f})};ctx.window=ctx;ctx.__temas={modo:'auto',get activo(){return {id:enabled};},etapaDe:()=>({id:current})};vm.createContext(ctx);vm.runInContext(read('js/navidad-companero.js'),ctx);events.DOMContentLoaded();
 return {ctx,doc,hero,other,screen,actors,ices,worlds,events,timers,setStage:s=>current=s,setTheme:s=>enabled=s,setSelected:s=>selected=s,setHero:h=>chosen=h,setModal:v=>modalOn=v,setPoint:p=>point=p,setReduced:v=>reduced=v,sync:ctx.NavidadCompanero.sync};
}
test('reutiliza el dibujo y aísla degradados, filtros, enlaces y etiquetas del login',()=>{
 const f=fixture(),svg=read('assets/navidad/personaje-animable.svg'),n=f.ctx.NavidadCompanero.namespace(svg,'nvi-');
 const ids=[...n.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);assert.ok(ids.every(id=>id.startsWith('nvi-')));
 for(const m of n.matchAll(/url\(#([^)]*)\)/g))assert.ok(ids.includes(m[1]),m[1]);
 assert.ok(n.includes('aria-labelledby="nvi-art-title nvi-art-desc"'));assert.ok(n.includes('data-nv-part="hand-right"'));
 assert.equal(f.ctx.NavidadCompanero.namespace('<use href="#a"/><path id="a" fill="#fff"/>','x-'),'<use href="#x-a"/><path id="x-a" data-nv-part="a" fill="#fff"/>');
});
test('navegar traslada el mismo personaje y su motor al encabezado nuevo',()=>{
 const f=fixture(),node=f.hero.children[0];f.setHero(f.other);f.sync();assert.equal(f.other.children[0],node);assert.equal(f.actors.length,1);assert.equal(f.actors[0].scene,'plot');assert.equal(f.hero.classList.contains('nv-con-companero'),false);
});
test('no aparece en otros temas ni fuera de las pantallas autenticadas',()=>{
 const f=fixture({theme:'muertos'});assert.equal(f.actors.length,0);f.setTheme('navidad');f.sync();assert.equal(f.actors.length,1);f.setSelected(false);f.sync();assert.equal(f.actors[0].destroyed,true);assert.equal(f.hero.children.length,0);assert.equal(f.worlds[0].destroyed,true);
});
test('conserva el hielo hasta el cambio de etapa y limpia el motor anterior',()=>{
 const f=fixture({stage:'pre'});assert.equal(f.actors[0].paused,true);assert.equal(f.actors[0].options.frozen,true);assert.equal(f.ices[0].options.idPrefix,'nvi-');f.setStage('casa');f.sync();assert.equal(f.ices[0].destroyed,true);assert.equal(f.actors[0].destroyed,true);assert.equal(f.actors[1].options.frozen,false);assert.equal(f.hero.children.length,1);
});
test('reacciona al guardado confirmado después de cerrar el modal, nunca antes',()=>{
 const f=fixture();f.setModal(true);f.sync();assert.equal(f.actors[0].paused,true);assert.notEqual(f.actors[0].scene,'ack');f.setModal(false);f.sync();assert.equal(f.actors[0].scene,'ack');f.actors[0].options.onFrame({},3);assert.equal(f.actors[0].scene,'idle');f.sync();assert.equal(f.actors[0].scene,'idle');
});
test('un marcaje recién confirmado se reconoce una vez sin leer hora, tono ni valores',()=>{
 const f=fixture(),p={};Object.defineProperty(p,'textContent',{get(){throw Error('No leer datos de marcaje');}});f.setPoint(p);f.sync();assert.equal(f.actors[0].scene,'ack');f.actors[0].options.onFrame({},3);f.sync();assert.equal(f.actors[0].scene,'idle');
});
test('al editar un PIN aparta la mirada y pausa sin acceder al contenido',()=>{
 const f=fixture(),input={inside:true,type:'password',matches:()=>true};Object.defineProperty(input,'value',{get(){throw Error('No leer credenciales');}});f.doc.activeElement=input;f.events.focusin();assert.equal(f.actors[0].scene,'privacy');assert.equal(f.actors[0].rendered,.6);assert.equal(f.actors[0].paused,true);f.doc.activeElement=null;f.events.focusin();assert.equal(f.actors[0].scene,'idle');assert.equal(f.actors[0].paused,false);
});
test('movimiento reducido y pestaña oculta impiden las reacciones',()=>{
 const f=fixture();f.setReduced(true);f.sync();f.hero.children[0].click();assert.equal(f.actors[0].paused,true);assert.notEqual(f.actors[0].scene,'grump');f.setReduced(false);f.doc.hidden=true;f.sync();assert.equal(f.actors[0].paused,true);f.doc.hidden=false;f.sync();assert.equal(f.actors[0].paused,false);
});
