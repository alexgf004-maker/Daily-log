const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'js/green-actor.js'),'utf8');
const sprite=fs.readFileSync(path.join(root,'assets/navidad/personaje-animable.svg'),'utf8');

function fixture(options={},direct=false){
 const frames=new Map(),nodes={};let sequence=0,writes=0;
 let calculations=0;const localMath=Object.create(Math);for(const name of ['sqrt','hypot','sin','cos'])localMath[name]=(...args)=>{calculations++;return Math[name](...args)};
 const context={Math:localMath,requestAnimationFrame:fn=>{frames.set(++sequence,fn);return sequence;},cancelAnimationFrame:id=>frames.delete(id),CustomEvent:class{}};
 context.window=context;vm.createContext(context);vm.runInContext(source,context);
 for(const id of [...sprite.matchAll(/id="([^"]+)"/g)].map(m=>m[1]).concat(['speech-heat','speech-mouth'])){
  nodes['#'+id]={attrs:{},textContent:'',setAttribute(k,v){this.attrs[k]=String(v);writes++;}};
 }
 const svg={tagName:'svg',querySelector:s=>nodes[s]||null,dispatchEvent(){}};
 // Referencia sin caché ni agrupación: todas las asignaciones llegan al SVG.
 if(direct)context.GreenActor.prototype.attr=function(id,k,v){this.n(id)?.setAttribute(k,String(v));};
 const actor=new context.GreenActor(svg,options);
 return {actor,frames,nodes,get writes(){return writes;},get calculations(){return calculations;},snapshot(){return JSON.stringify(nodes);},step(t){const current=[...frames.values()];frames.clear();for(const fn of current)fn(t);}};
}

test('pausa sin diálogo no deja solicitudes de fotogramas; reanudar no duplica el bucle',()=>{
 const f=fixture();assert.equal(f.frames.size,1);f.step(1000);
 f.actor.pause();assert.equal(f.frames.size,0);const before=f.actor.motionTime;
 f.actor.resume();f.actor.resume();assert.equal(f.frames.size,1);
 // en reposo («idle») el motor va a 30 cuadros por segundo: un paso de 1/60 s no dibuja, uno de 1/30 s sí
 f.step(61000);assert.equal(f.actor.motionTime,before);f.step(61000+1000/60);assert.equal(f.actor.motionTime,before);
 f.step(61000+1000/30);
 assert.ok(f.actor.motionTime>before&&f.actor.motionTime-before<.04);
 f.actor.destroy();assert.equal(f.frames.size,0);f.actor.resume();assert.equal(f.frames.size,0);
});

test('una pausa o destrucción desde onFrame tampoco vuelve a programar el motor',()=>{
 for(const action of ['pause','destroy']){
  let actor;const f=fixture({onFrame(){actor[action]();}});actor=f.actor;
  f.step(1000);assert.equal(f.frames.size,0,action);
 }
});

test('fuera de vista no procesa ni el diálogo y vuelve sin salto ni bucles duplicados',()=>{
 const f=fixture({embedded:true,frozen:true});f.actor.pause();
 f.actor.speak({tone:'angry',animated:true});f.step(1000);f.step(1040);
 f.actor.setVisible(false);const before=f.snapshot(),speechTime=f.actor._speechTime;
 assert.equal(f.frames.size,0);f.actor.resume();
 assert.equal(f.frames.size,0);f.actor.frame(50000);
 assert.equal(f.snapshot(),before);assert.equal(f.actor._speechTime,speechTime);
 f.actor.setVisible(true);f.actor.setVisible(true);assert.equal(f.frames.size,1);
 f.step(51000);assert.equal(f.actor._speechTime,speechTime);
 f.step(51040);assert.ok(f.actor._speechTime>speechTime);f.actor.destroy();
});

test('hablar despierta solo la cara congelada y termina su bucle al retirar la expresión',()=>{
 const f=fixture({embedded:true,frozen:true});f.actor.pause();
 const elapsed=f.actor.elapsed,motion=f.actor.motionTime;
 f.actor.speak({tone:'angry',level:.95,animated:true});assert.equal(f.frames.size,1);
 for(let i=0;i<60;i++)f.step(1000+i*1000/60);
 assert.ok(f.actor._pose.heat>.9);assert.equal(f.actor.elapsed,elapsed);assert.equal(f.actor.motionTime,motion);
 f.actor.speak(null);
 for(let i=0;i<60;i++)f.step(2000+i*1000/60);
 assert.equal(f.frames.size,0);assert.ok(f.actor._pose.heat<.02);assert.equal(f.actor.paused,true);
});

test('el diálogo estático de movimiento reducido no necesita fotogramas',()=>{
 const f=fixture({embedded:true,frozen:true});f.actor.pause();
 f.actor.speak({tone:'angry',level:.8,animated:false});assert.equal(f.frames.size,0);assert.equal(f.actor._pose.heat,.8);
 f.actor.speak(null);assert.equal(f.frames.size,0);assert.equal(f.actor._pose.heat,0);
});

test('las 32 escenas conservan todos los atributos finales en 7.680 fotogramas',()=>{
 for(const embedded of [false,true]){
  const options={embedded,contextOnly:embedded,personality:embedded},cached=fixture(options),direct=fixture(options,true);
  for(const [name,meta] of Object.entries(cached.actor.constructor.SCENES)){
   cached.actor.play(name);direct.actor.play(name);
   for(let i=0;i<120;i++){
    const time=meta.duration*i/119;
    cached.actor.motionTime=direct.actor.motionTime=time;
    if(i===30)for(const f of [cached,direct])f.actor.speak({tone:'angry',level:.95,animated:true});
    if(i===90)for(const f of [cached,direct])f.actor.speak(null);
    cached.actor._speechTime=direct.actor._speechTime=i/60;
    direct.actor._limbGeometry=Object.create(null);
    cached.actor.render(time,1/60);direct.actor.render(time,1/60);
    assert.equal(cached.snapshot(),direct.snapshot(),name+' '+embedded+' '+i);
   }
  }
 }
});

test('repetir geometría evita trigonometría y conserva atributos incluso si otra capa los sobrescribe',()=>{
 const f=fixture();f.actor.poseArm('left',-18,-18);f.actor.poseLeg('right',0,0);
 const before=f.calculations,expected=f.nodes['#arm-left-curve'].attrs.d;
 for(let i=0;i<100;i++){f.actor.poseArm('left',-18,-18);f.actor.poseLeg('right',0,0)}
 assert.equal(f.calculations,before);assert.equal(Object.keys(f.actor._limbGeometry).length,4);
 f.actor.attr('arm-left-curve','d','otra capa');f.actor.poseArm('left',-18,-18);
 assert.equal(f.nodes['#arm-left-curve'].attrs.d,expected);
 f.actor.poseArm('left',-18,-18,{x:215,y:530,amount:.8});assert.ok(f.calculations>before);
 assert.notEqual(f.nodes['#arm-left-curve'].attrs.d,expected);f.actor.destroy();
});

test('reposo contextual reduce escrituras y repetir una pose no invalida el SVG',t=>{
 const options={embedded:true,contextOnly:true,personality:true},cached=fixture(options),direct=fixture(options,true);
 const before=cached.writes,reference=direct.writes;
 for(let i=0;i<600;i++)for(const f of [cached,direct]){f.actor.motionTime=i/60;f.actor.render(i/60,1/60);}
 assert.ok((cached.writes-before)/(direct.writes-reference)<.1);
 t.diagnostic('600 cuadros de reposo: '+(direct.writes-reference)+' escrituras directas; '+(cached.writes-before)+' con caché.');
 assert.equal(cached.snapshot(),direct.snapshot());
 cached.actor.render(2);const writes=cached.writes;
 cached.actor.render(2);assert.equal(cached.writes,writes);
});

test('en reposo dibuja a 30 cuadros por segundo; los gestos van a la frecuencia completa',()=>{
 const f=fixture();f.step(1000);let t=1000,antes=f.actor.motionTime;
 for(let i=1;i<=60;i++)f.step(t+i*1000/60);
 const idle=f.actor.motionTime-antes;assert.ok(idle>.9&&idle<1.05,'idle '+idle);
 f.actor.tap();t=2000;f.step(t);antes=f.actor.motionTime;let n=0;const r=f.actor.render.bind(f.actor);f.actor.render=(...a)=>{n++;return r(...a);};
 for(let i=1;i<=30;i++)f.step(t+i*1000/60);
 assert.ok(n>=29,'gesto '+n);
 f.actor.destroy();
});
