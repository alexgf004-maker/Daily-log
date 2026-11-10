const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../js',name),'utf8');
class Node{
 constructor(){this.attrs={};this.dataset={};this.listeners={};this.values={};this.style={setProperty:(k,v)=>this.values[k]=v,removeProperty:k=>delete this.values[k]};const c=new Set();this.classList={add:k=>c.add(k),remove:k=>c.delete(k),contains:k=>c.has(k)};}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,fn){(this.listeners[k]??=new Set()).add(fn)}removeEventListener(k,fn){this.listeners[k]?.delete(fn)}
 emit(k,e){for(const fn of this.listeners[k]||[])fn(e)}
}
function worldFixture(){
 let frozen=true,reduce=false,busy=false,now=20000,restored=0;
 const login=new Node(),mount=new Node(),document=new Node(),svg={getScreenCTM:()=>({a:.2,b:0,c:0,d:.2,e:100,f:200})},pupil={},calls=[],timers=new Map(),intervals=new Map();let id=0;
 login.classList.add('active');document.hidden=false;
 const bulb={classList:{contains:()=>false,add(){},remove(){}},getBoundingClientRect:()=>({left:280,top:40,width:10,height:18}),querySelector:()=>({getAttribute:()=>'#ffbbee'})};
 const house={getBoundingClientRect:()=>({left:30,top:700,width:40,height:40})};
 mount.querySelector=s=>s==='svg'?svg:pupil;login.contains=n=>n===bulb;login.querySelectorAll=s=>s.includes('casita')?[house]:[bulb];
 const ctx={window:null,document,Date:{now:()=>now},Math,Number,getComputedStyle:()=>({translate:'-4px -2px'}),setTimeout:fn=>{timers.set(++id,fn);return id},clearTimeout:i=>timers.delete(i),setInterval:fn=>{intervals.set(++id,fn);return id},clearInterval:i=>intervals.delete(i)};ctx.window=ctx;ctx.matchMedia=()=>({matches:reduce});vm.createContext(ctx);vm.runInContext(read('navidad-entorno.js'),ctx);
 const w=ctx.NavidadEntorno.create(login,mount,{frozen:()=>frozen,busy:()=>busy,react:d=>calls.push(d),restoreFocus:()=>restored++});
 return {w,ctx,login,mount,document,bulb,calls,timers,intervals,setReduced:v=>reduce=v,setBusy:v=>busy=v,setFrozen:v=>frozen=v,setNow:v=>now=v,restored:()=>restored};
}
test('la mirada se calcula en coordenadas del SVG, también con giro y escalado',()=>{
 const f=worldFixture(),p=f.ctx.NavidadEntorno.point({getScreenCTM:()=>({a:0,b:.2,c:-.2,d:0,e:300,f:100})},{x:200,y:200});
 assert.ok(Math.abs(p.x-500)<1e-8);assert.ok(Math.abs(p.y-500)<1e-8);
 assert.equal(f.ctx.NavidadEntorno.point({}, {x:0,y:0}),null);
});
test('un foco real dirige la mirada, aporta su color y no toca los campos',()=>{
 const f=worldFixture();Object.defineProperty(f.bulb,'value',{get(){throw Error('No leer campos')}});
 f.login.emit('pointerdown',{target:{closest:()=>f.bulb}});
 assert.equal(f.mount.dataset.mirada,'entorno');assert.equal(f.mount.dataset.reflejo,'foco');assert.equal(f.mount.values['--nv-reflejo'],'#ffbbee');
 assert.equal(f.calls[0].x,285);assert.equal(f.calls[0].y,49);
 assert.ok(parseFloat(f.mount.values['--nv-mirada-y'])<0);
});
test('las reacciones terminan, restauran el foco y no dejan temporizadores al salir',()=>{
 const f=worldFixture();f.w.react({kind:'nieve',x:180,y:100,color:'#d5f3ff'});
 const [id,end]=[...f.timers.entries()].at(-2);f.timers.delete(id);end();assert.equal(f.mount.dataset.mirada,undefined);assert.equal(f.restored(),1);
 f.w.react({kind:'foco',x:220,y:30,color:'#ffcc88'});f.w.destroy();
 assert.equal(f.timers.size,0);assert.equal(f.intervals.size,0);assert.equal(f.mount.dataset.reflejo,undefined);assert.equal(f.login.listeners['navidad:entorno'].size,0);
});
test('sin actividad visible o con movimiento reducido no reacciona',()=>{
 const f=worldFixture(),d={kind:'nieve',x:180,y:120};
 f.setReduced(true);assert.equal(f.w.react(d),false);f.setReduced(false);f.document.hidden=true;assert.equal(f.w.react(d),false);
 f.document.hidden=false;f.login.classList.remove('active');assert.equal(f.w.react(d),false);assert.equal(f.calls.length,0);
});
test('el ambiente alterna objetos con pausas y no distrae mientras se escribe',()=>{
 const f=worldFixture(),tick=[...f.intervals.values()][0];tick();assert.equal(f.calls.length,1);
 f.setNow(24000);tick();assert.equal(f.calls.length,1);f.setNow(40000);tick();assert.equal(f.calls.length,2);
 f.setFrozen(false);f.setNow(60000);tick();assert.equal(f.calls.length,2);
});
test('rechaza coordenadas no válidas y un color que no venga de la paleta',()=>{
 const f=worldFixture();assert.equal(f.w.react({kind:'foco',x:NaN,y:20}),false);
 f.w.react({kind:'foco',x:180,y:30,color:'url(no)'});assert.equal(f.mount.dataset.reflejo,undefined);
});
function storyFixture(){
 let h={x:300,y:200},a={x:300,y:200,r:6,node:{}},resets=0;
 const moves=[],bridge={target:()=>a,move:p=>moves.push(p),reset:()=>resets++};
 const ctx={window:null,Math,document:{createElement(){throw Error('No crear copias de la esfera')}}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read('navidad-historia.js'),ctx);
 const story=ctx.NavidadHistoria.create({__nvArbol:bridge},{querySelector:()=>({getScreenCTM:()=>({e:h.x,f:h.y})})});
 return {story,moves,bridge,setHand:p=>h=p,setAnchor:p=>a=p,resets:()=>resets};
}
test('la esfera solo pasa a la mano después de contacto físico',()=>{
 const f=storyFixture();assert.equal(f.story.start(),true);f.setHand({x:390,y:250});f.story.pull(3.4);assert.equal(f.moves.length,0);
 f.setHand({x:300,y:200});f.story.pull(3.5);f.setHand({x:308,y:205});f.story.pull(4);assert.deepEqual({...f.moves.at(-1)},{x:308,y:205});
});
test('al soltar, el mismo adorno vuelve amortiguado a su rama',()=>{
 const f=storyFixture();f.story.start();f.story.pull(3);f.setHand({x:310,y:208});f.story.pull(4);f.story.release();f.story.drop(.2);
 assert.ok(f.moves.at(-1).x>300&&f.moves.at(-1).x<310);f.story.drop(4.5);assert.equal(f.resets(),1);
});
test('sin árbol no inventa un objeto ni inicia una travesura',()=>{
 const ctx={window:null,Math};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(read('navidad-historia.js'),ctx);
 const s=ctx.NavidadHistoria.create({},{});assert.equal(s.start(),false);s.destroy();
});

test('la primera reacción ocurre al entrar, y se cancela si el usuario ya está escribiendo',()=>{
 const f=worldFixture(),intro=[...f.timers.values()][0];intro();assert.equal(f.calls.length,1);assert.equal(f.calls[0].kind,'ambiente');
 const silent=worldFixture();silent.setBusy(true);[...silent.timers.values()][0]();assert.equal(silent.calls.length,0);silent.w.destroy();assert.equal(silent.timers.size,0);
});

function switchFixture(){
 const f=worldFixture(),button=new Node();button.classList.add('nv-foco-interactivo');
 button.getBoundingClientRect=f.bulb.getBoundingClientRect;button.querySelector=f.bulb.querySelector;
 f.login.contains=e=>e===button;f.setFrozen(false);
 return {...f,button,touch(){f.login.emit('click',{type:'click',target:{closest:()=>button}});}};
}
test('tocar una luz navideña alterna su estado real y lo comunica al personaje',()=>{
 const f=switchFixture();f.touch();assert.ok(f.button.classList.contains('nv-luz-apagada'));assert.equal(f.button.attrs['aria-pressed'],'false');assert.equal(f.calls[0].off,true);
 f.touch();assert.equal(f.button.classList.contains('nv-luz-apagada'),false);assert.equal(f.button.attrs['aria-pressed'],'true');assert.equal(f.calls[1].off,false);
 f.touch();f.w.destroy();assert.equal(f.button.classList.contains('nv-luz-apagada'),false);assert.equal(f.button.attrs['aria-label'],'Apagar luz navideña');assert.equal(f.login.listeners.keydown.size,0);
});
test('el interruptor también funciona con teclado y movimiento reducido sin animar al personaje',()=>{
 const f=switchFixture();f.setReduced(true);let prevented=false;
 f.login.emit('keydown',{type:'keydown',key:' ',target:{closest:()=>f.button},preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.equal(f.button.attrs['aria-pressed'],'false');assert.equal(f.calls.length,0);
});
test('en prenavidad tocar un foco conserva su comportamiento y no lo apaga',()=>{
 const f=switchFixture();f.setFrozen(true);f.login.emit('pointerdown',{type:'pointerdown',target:{closest:()=>f.button}});assert.equal(f.button.classList.contains('nv-luz-apagada'),false);assert.equal(f.calls[0].off,null);
});

test('tocar el vidrio del foco cambia el estado del grupo completo una sola vez',()=>{
 const f=switchFixture(),glass={closest:()=>f.button,classList:{contains:()=>false}};f.login.contains=()=>true;
 f.login.emit('pointerdown',{type:'pointerdown',target:{closest:()=>glass}});
 f.login.emit('click',{type:'click',target:{closest:s=>s==='.nv-foco-interactivo'?f.button:glass}});
 assert.equal(f.calls.length,1);assert.equal(f.calls[0].off,true);assert.equal(f.button.attrs['aria-pressed'],'false');
});

function blowFixture(){
 const f=switchFixture(),nodes=[];f.button.isConnected=true;
 f.mount.querySelector=s=>s.endsWith('head')?{getScreenCTM:()=>({a:.2,b:0,c:0,d:.2,e:218,f:114})}:null;
 f.login.querySelectorAll=()=>[f.button];f.login.getBoundingClientRect=()=>({left:0,top:0,width:390,height:844});
 f.login.appendChild=n=>nodes.push(n);
 f.document.createElementNS=()=>{const n=new Node();n.appendChild=()=>{};n.remove=()=>nodes.splice(nodes.indexOf(n),1);return n;};
 return {...f,nodes};
}
test('el soplo sale de la boca hacia un foco existente y solo lo apaga al llegar',()=>{
 const f=blowFixture();assert.ok(f.w.startBlow());f.w.blowFrame(.5);assert.equal(f.nodes.length,0);assert.equal(f.button.classList.contains('nv-luz-apagada'),false);
 f.w.blowFrame(1.5);assert.equal(f.nodes.length,1);assert.equal(f.button.classList.contains('nv-luz-apagada'),false);
 f.w.blowFrame(1.86);assert.equal(f.button.classList.contains('nv-luz-apagada'),true);assert.equal(f.button.attrs['aria-label'],'Encender luz navideña');
 f.w.blowFrame(2.3);assert.equal(f.nodes.length,0);f.touch();assert.equal(f.button.classList.contains('nv-luz-apagada'),false);
 f.w.destroy();assert.equal(f.timers.size,0);
});
test('no sopla sin luces, a través de toda la pantalla, congelado ni al escribir',()=>{
 const f=blowFixture();f.setFrozen(true);assert.equal(f.w.startBlow(),null);f.setFrozen(false);f.setBusy(true);assert.equal(f.w.startBlow(),null);
 f.setBusy(false);f.button.getBoundingClientRect=()=>({left:280,top:-500,width:10,height:18});assert.equal(f.w.startBlow(),null);
 f.login.querySelectorAll=()=>[];assert.equal(f.w.startBlow(),null);assert.equal(f.nodes.length,0);
});
test('interrumpir el soplo limpia el aire sin apagar una luz antes de tiempo',()=>{
 const f=blowFixture();f.w.startBlow();f.w.blowFrame(1.2);f.w.cancelBlow();f.w.blowFrame(2);assert.equal(f.nodes.length,0);assert.equal(f.button.classList.contains('nv-luz-apagada'),false);
 f.w.startBlow();f.w.blowFrame(1.9);f.w.destroy();assert.equal(f.button.classList.contains('nv-luz-apagada'),false);assert.equal(f.nodes.length,0);
});

function dialogueFixture(){
 const f=worldFixture(),parent={isConnected:true,children:[],appendChild(n){if(n.parentElement)n.parentElement.children.splice(n.parentElement.children.indexOf(n),1);this.children.push(n);n.parentElement=this;}},other={isConnected:true,children:[],appendChild:parent.appendChild};let host=parent,now=1000,stage='casa';
 f.mount.isConnected=true;f.ctx.Date.now=()=>now;f.ctx.addEventListener=()=>{};f.ctx.removeEventListener=()=>{};
 f.document.createElement=()=>{const n=new Node();n.remove=()=>{n.parentElement.children.splice(n.parentElement.children.indexOf(n),1);};return n;};
 const dialogue=f.ctx.NavidadEntorno.createDialogue(f.mount,{inside:true,container:()=>host,stage:()=>stage});
 return {...f,dialogue,parent,other,setHost:v=>host=v,setStage:v=>stage=v,next:()=>now+=500};
}
test('el diálogo responde al toque con frases locales, sin modal ni acceso a campos',()=>{
 const f=dialogueFixture();Object.defineProperty(f.document,'activeElement',{get(){throw Error('No leer formularios');}});
 assert.equal(f.parent.children.length,0);assert.equal(f.dialogue.say('casa'),true);const bubble=f.parent.children[0];
 assert.equal(bubble.textContent,'¡No me toques!');assert.equal(bubble.attrs.role,'status');assert.equal(bubble.attrs['aria-live'],'polite');
 assert.equal(f.dialogue.say('casa'),false);assert.equal(bubble.textContent,'¡No me toques!');
 f.next();f.dialogue.say('casa');assert.match(bubble.textContent,/Pinche Navidad/);assert.equal(f.parent.children.length,1);
 f.next();f.dialogue.say('caught');assert.match(bubble.textContent,/robando/);assert.equal(f.parent.children.length,1);
});
test('el texto se retira por tiempo, Escape, navegación, ocultación y destrucción',()=>{
 const f=dialogueFixture();f.dialogue.say('pre');const b=f.parent.children[0];assert.match(b.textContent,/hielo/);
 f.document.emit('keydown',{key:'Escape'});assert.equal(b.hidden,true);
 f.next();f.dialogue.say('casa');const end=[...f.timers.values()].at(-1);end();assert.equal(b.hidden,true);
 f.setHost(f.other);f.next();f.dialogue.say('hat');assert.equal(f.parent.children.length,0);assert.equal(f.other.children[0],b);assert.match(b.textContent,/gorro/i);
 f.document.hidden=true;f.document.emit('visibilitychange',{});assert.equal(b.hidden,true);assert.equal(f.dialogue.say('casa'),false);
 f.dialogue.destroy();assert.equal(f.other.children.length,0);f.w.destroy();assert.equal(f.timers.size,0);assert.equal(f.document.listeners.keydown.size,0);
});

test('el globo se ancla por encima de la cabeza y la punta apunta a ella',()=>{
 const f=dialogueFixture();f.dialogue.destroy();
 f.parent.getBoundingClientRect=()=>({left:0,top:0,width:320,height:568});
 f.mount.querySelector=()=>({querySelector:()=>({getBoundingClientRect:()=>({left:240,top:440,width:50,height:58})})});
 f.document.createElement=()=>{const n=new Node();n.getBoundingClientRect=()=>({width:200,height:35});n.remove=()=>{};return n;};
 let expression=null;const d=f.ctx.NavidadEntorno.createDialogue(f.mount,{container:()=>f.parent,stage:()=> 'pre',express:e=>expression=e});d.say('pre');const node=f.parent.children[0];
 assert.ok(parseFloat(node.style.top)+35<440);assert.ok(parseFloat(node.style.left)+200<=310);
 assert.ok(Math.abs(parseFloat(node.style.left)+parseFloat(node.values['--nv-cola-x'])+6-265)<1);
 assert.equal(expression.tone,'angry');assert.equal(expression.level,.65);f.next();d.say('pre');assert.equal(expression.level,.95);
 // La pantalla puede ser estática y tener otro ancestro de posicionamiento.
 node.offsetParent={getBoundingClientRect:()=>({left:16,top:54,width:800}),scrollTop:0};
 f.next();d.say('pre');assert.equal(parseFloat(node.style.top)+54+35,428);
 assert.ok(Math.abs(parseFloat(node.style.left)+16+parseFloat(node.values['--nv-cola-x'])+6-265)<1);
 d.hide();assert.equal(expression,null);d.destroy();f.w.destroy();
});
