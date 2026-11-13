const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(stage='pre'){
 let now=0,id=0,active=true,busy=false,objects=true,reentrant=false;const timers=new Map(),plays=[];
 const ctx={window:null,Math,Number,setTimeout(fn,ms){timers.set(++id,{fn,at:now+ms});return id;},clearTimeout:id=>timers.delete(id)};ctx.window=ctx;
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/navidad-vida.js'),'utf8'),ctx);
 const life=ctx.NavidadVida.create({active:()=>active,busy:()=>busy,stage:()=>stage,run(name){if(name==='environment'&&!objects)return 0;plays.push(name);if(reentrant)life.sync();return 3;}});
 function advance(ms){const until=now+ms;for(;;){const pending=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!pending||pending[1].at>until)break;now=pending[1].at;timers.delete(pending[0]);pending[1].fn();}now=until;}
 return {life,timers,plays,advance,setActive:v=>active=v,setBusy:v=>busy=v,setObjects:v=>objects=v,setReentrant:v=>reentrant=v};
}
test('el hielo alterna cuatro gestos propios con pausas y un solo temporizador',()=>{
 const f=fixture();f.life.sync();f.life.sync();assert.equal(f.timers.size,1);
 f.advance(2300);assert.equal(f.plays.length,0);f.advance(200);assert.equal(f.plays[0],'icewatch');
 f.advance(40000);assert.deepEqual(f.plays.slice(0,4),['icewatch','icedraw','trapped','icesneeze']);assert.equal(f.timers.size,1);
});
test('libre puede observar, reír, estirarse y acomodar el gorro sin adornos cercanos',()=>{
 const f=fixture('casa');f.setObjects(false);f.life.sync();f.advance(140000);
 for(const name of ['lookaround','hat','plot','doze','scoff','thaw'])assert.ok(f.plays.includes(name),name);
 assert.equal(f.plays.includes('environment'),false);
});
test('suspender y destruir eliminan el temporizador; no se acumulan gestos al volver',()=>{
 const f=fixture();f.life.sync();f.advance(2500);const count=f.plays.length;
 f.setActive(false);f.life.sync();assert.equal(f.timers.size,0);f.advance(120000);assert.equal(f.plays.length,count);
 f.setActive(true);f.life.sync();assert.equal(f.timers.size,1);f.advance(3100);assert.equal(f.plays.length,count+1);
 f.life.destroy();f.life.sync();assert.equal(f.timers.size,0);
});
test('una escena en curso y el toque del usuario posponen el siguiente gesto',()=>{
 const f=fixture();f.setBusy(true);f.life.sync();f.advance(6000);assert.equal(f.plays.length,0);assert.equal(f.timers.size,1);
 f.setBusy(false);f.life.defer();f.advance(9400);assert.equal(f.plays.length,0);f.advance(200);assert.equal(f.plays.length,1);
});
test('sincronizar desde el propio gesto conserva la pausa y no crea otro temporizador',()=>{
 const f=fixture();f.setReentrant(true);f.life.sync();f.advance(2500);assert.equal(f.plays.length,1);
 f.advance(6800);assert.equal(f.plays.length,1);assert.equal(f.timers.size,1);
 f.advance(3200);assert.equal(f.plays.length,2);
});
