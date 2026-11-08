/* GreenActor 2 — articulated SVG limbs, 14 original scenes and 13 integrated poses.
   API: const actor = new GreenActor(document.querySelector('#green-character'));
   actor.play('steal'); actor.tap(); actor.pause(); actor.resume(); actor.destroy();
   Custom DOM events: greenactor:scenechange and greenactor:complete. */
(() => {
'use strict';
const PI = Math.PI;
const clamp = (v, min=0, max=1) => Math.max(min,Math.min(max,v));
const lerp = (a,b,t) => a+(b-a)*t;
const smooth = x => {const u=clamp(x);return u*u*(3-2*u)};
const between = (t,a,b) => smooth((t-a)/(b-a));
const wave = (t,f=1) => Math.sin(t*PI*2*f);
const bump = (t,a,b,c,d) => between(t,a,b)*(1-between(t,c,d));
const SCENES = Object.freeze({
 idle:     {duration:5.8,loop:true, title:'Respirar', detail:'Respira, parpadea y la bufanda se mueve con el viento.', group:'Ciclos básicos'},
 sneak:    {duration:6.0,loop:true, title:'Caminar de puntillas', detail:'Avanza con cautela, alterna los pies y vigila a ambos lados.', group:'Ciclos básicos'},
 run:      {duration:3.2,loop:true, title:'Correr y huir', detail:'Se inclina, acelera, deja polvo y la bufanda vuela hacia atrás.', group:'Ciclos básicos'},
 climb:    {duration:7.0,loop:false,title:'Trepar', detail:'Se agarra al borde del formulario y sube hasta alcanzar la tarjeta.', group:'Ciclos básicos'},
 steal:    {duration:8.5,loop:false,title:'Robar', detail:'Se asoma, revisa los costados, gira el foco, se lo lleva y ríe.', group:'Historia'},
 caught:   {duration:4.8,loop:false,title:'Lo descubren', detail:'Se queda inmóvil, abre los ojos y le cae una gota de sudor.', group:'Historia'},
 drop:     {duration:7.2,loop:false,title:'Se le cae el botín', detail:'Tropieza, el saco se abre y los focos salen rodando.', group:'Historia'},
 tantrum:  {duration:5.0,loop:true, title:'Berrinche', detail:'Cruza los brazos, golpea el piso y refunfuña «hmph».', group:'Historia'},
 hide:     {duration:5.5,loop:false,title:'Se esconde', detail:'Se agacha tras la tarjeta del login: solo quedan visibles los ojos.', group:'Historia'},
 tap1:     {duration:3.0,loop:false,title:'Primer toque', detail:'Se sobresalta, pega un salto y te mira asustado.', group:'Toques'},
 tap2:     {duration:4.0,loop:false,title:'Segundo toque', detail:'Se molesta, protesta y sale de la escena refunfuñando.', group:'Toques'},
 tap3:     {duration:4.2,loop:false,title:'Tercer toque', detail:'Se sonroja, desvía la mirada y parece disfrutar la atención.', group:'Toques'},
 xmas:     {duration:8.0,loop:false,title:'Nochebuena · 24 dic', detail:'Devuelve los focos, sonríe por primera vez y se sienta junto a la estrella.', group:'Fechas especiales'},
 thaw:     {duration:6.2,loop:false,title:'Libre del hielo',detail:'Observa sus manos, se sacude el frío y se estira.',group:'Login integrado'},
 privacy:  {duration:.6,loop:false,title:'No miro el PIN',detail:'Se cubre los ojos mientras el campo está enfocado.',group:'Login integrado'},
 tug:      {duration:6.0,loop:false,title:'Tirar de las luces',detail:'Alcanza un cordón, tira suavemente y vigila si lo descubren.',group:'Login integrado'},
 offer:    {duration:5.0,loop:false,title:'Devolver la luz',detail:'Levanta la mano y devuelve un foco a la guirnalda.',group:'Login integrado'},
 grump:    {duration:5.8,loop:false,title:'Refunfuñar',detail:'Entrecierra los ojos, cruza los brazos y protesta con una pequeña patada.',group:'Login integrado'},
 plot:     {duration:5.2,loop:false,title:'Tramar otra travesura',detail:'Comprueba ambos lados, junta las manos y esboza una sonrisa torcida.',group:'Login integrado'},
 trapped:  {duration:3.6,loop:false,title:'Déjame salir',detail:'Apoya las manos contra el hielo, empuja y resopla sin salir del bloque.',group:'Interacciones'},
 mischief: {duration:4.4,loop:false,title:'Tirar de la botita',detail:'Se acerca a la botita real, la agarra y da dos tirones antes de soltarla.',group:'Interacciones'},
 hat:      {duration:4.2,loop:false,title:'Acomodarse el gorro',detail:'Se le baja el gorro sobre los ojos, toma el borde y lo vuelve a acomodar.',group:'Interacciones'},
 scoff:    {duration:3.6,loop:false,title:'Risa traviesa',detail:'Se tapa la boca, sacude los hombros y mira de reojo.',group:'Interacciones'},
 shoo:     {duration:3.8,loop:false,title:'No toques mis luces',detail:'Niega con la cabeza y hace un gesto de protesta con la mano.',group:'Interacciones'},
 doze:     {duration:6.0,loop:false,title:'Le vence el sueño',detail:'Cabecea, se le cierran los ojos y despierta disimulando.',group:'Interacciones'},
 ack:      {duration:2.8,loop:false,title:'Registro recibido',detail:'Comprueba el registro, asiente una vez y vuelve a su expresión gruñona.',group:'Dentro de la app'},
 nye:      {duration:5.6,loop:true,title:'31 de diciembre', detail:'Los destellos lo asustan: tiembla y se tapa los oídos.', group:'Fechas especiales'},
});
class GreenActor {
 constructor(svg, options={}){
  if (!svg || svg.tagName.toLowerCase() !== 'svg') throw new Error('GreenActor requires the actual inline <svg> element.');
  this.svg=svg; this.options=options; this.nodes={};
  const ids=['actor','head','body','leg-left','leg-right','arm-left','arm-right','tail','scarf-tail','scarf-knot','hair','ear-left','ear-right','eye-left','eye-right','pupil-left','pupil-right','brow-left','brow-right','lid-left','lid-right','mouth','expression-mouth','expression-line','smirk-crease','smile','blush','sweat','hands-ears','hands-eyes','cover-arm-left','cover-arm-right','cover-arm-shine','cover-hand-left','cover-hand-right','roof-card','roof-front','peek-eyes','peek-pupils','wire-bulb','hanging-bulb','stolen-bulb','bag','rolling-bulbs','roll-a','roll-b','roll-c','bubble','bubble-text','dust','christmas-star','lights-string','night-overlay','celebration-fireworks','fw-left','fw-right','reach-arm','sitting-legs','speed-lines'];
  ids.push('santa-hat','hat-tip','hand-left','hand-right','arm-left-outline','arm-right-outline','arm-left-curve','arm-right-curve','arm-left-light','arm-right-light',
    'foot-left','foot-right','leg-left-outline','leg-right-outline','leg-left-curve','leg-right-curve','leg-left-light','leg-right-light');
  for (const id of ids) this.nodes[id]=svg.querySelector('#'+(options.idPrefix||'')+id);
  this.scene='idle';this.elapsed=0;this.last=0;this.paused=false;this.stopped=false;this.completed=false;this.tapCount=0;
  this.motionTime=0;this._pose=null;this._velocity={};this._visible={};
  this._reachTarget=null;this._lookTarget=null;
  this._raf=requestAnimationFrame(t=>this.frame(t));
  this.play(options.initialScene||'idle');
 }
 n(id){return this.nodes[id]}
 attr(id,property,value){const node=this.n(id); if(node) node.setAttribute(property,String(value))}
 show(id,opacity){this.attr(id,'opacity',clamp(opacity))}
 transform(id,content){this.attr(id,'transform',content)}
 rot(id,angle,x,y){this.transform(id,`rotate(${angle.toFixed(2)} ${x} ${y})`)}
 bodyScale(scale){this.transform('body',`translate(400 525) scale(1 ${scale.toFixed(4)}) translate(-400 -525)`)}
 faceScale(id,x,y,sx=1,sy=sx){this.transform(id,`translate(${x} ${y}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(${-x} ${-y})`)}
 // Una curva continua une hombro, codo y muñeca. La mano conserva su volumen;
 // el antebrazo llega después del hombro, sin girar todo el miembro como una tabla.
 poseArm(side,upper,forearm,goal=null){
  const sign=side==='left'?-1:1,shoulder={x:side==='left'?352:444,y:580};
  const inward=angle=>side==='left'?-angle:angle;
  const wristTarget=angle=>{
    const a=inward(angle),fold=clamp(a/34),lift=clamp((a-34)/71),out=clamp(-a/65);
    let x=lerp(94,-50,fold);
    let y=lerp(750,side==='left'?638:658,fold);
    x=lerp(x,80,lift);y=lerp(y,414,lift);
    x=lerp(x,170,out);y=lerp(y,516,out);
    return {x:400+sign*x,y};
  };
  const leading=wristTarget(upper),following=wristTarget(forearm);
  const h={x:lerp(leading.x,following.x,.65),y:lerp(leading.y,following.y,.65)};
  if(goal){h.x=lerp(h.x,goal.x,goal.amount);h.y=lerp(h.y,goal.y,goal.amount);}
  // Cinemática de dos huesos: el gesto no alarga los brazos al cruzarlos.
  const upperLength=85,lowerLength=95;
  let dx=h.x-shoulder.x,dy=h.y-shoulder.y,distance=Math.hypot(dx,dy)||1;
  const reach=clamp(distance,lowerLength-upperLength+1,upperLength+lowerLength-.5);
  dx/=distance;dy/=distance;
  h.x=shoulder.x+dx*reach;h.y=shoulder.y+dy*reach;
  const along=(upperLength*upperLength-lowerLength*lowerLength+reach*reach)/(2*reach);
  const height=Math.sqrt(Math.max(0,upperLength*upperLength-along*along)),bend=-sign;
  const e={x:shoulder.x+dx*along-dy*height*bend,y:shoulder.y+dy*along+dx*height*bend};
  const tx=(h.x-shoulder.x)*.15,ty=(h.y-shoulder.y)*.15;
  const d=`M${shoulder.x} ${shoulder.y} C${lerp(shoulder.x,e.x,.4).toFixed(2)} ${lerp(shoulder.y,e.y,.4).toFixed(2)} ${(e.x-tx).toFixed(2)} ${(e.y-ty).toFixed(2)} ${e.x.toFixed(2)} ${e.y.toFixed(2)} C${(e.x+tx).toFixed(2)} ${(e.y+ty).toFixed(2)} ${lerp(h.x,e.x,.3).toFixed(2)} ${lerp(h.y,e.y,.3).toFixed(2)} ${h.x.toFixed(2)} ${h.y.toFixed(2)}`;
  for(const part of ['outline','curve','light'])this.attr('arm-'+side+'-'+part,'d',d);
  this.transform('arm-'+side,'translate(0 0)');
  this.transform('hand-'+side,`translate(${h.x.toFixed(2)} ${h.y.toFixed(2)}) rotate(${(sign*clamp(inward(forearm)/34)*-42).toFixed(2)})`);
 }
 poseLeg(side,angle,ground,stride=false){
  const sign=side==='left'?-1:1,hip={x:side==='left'?370:432,y:823};
  const lift=stride?Math.max(0,angle):Math.abs(angle);
  const baseX=side==='left'?365:445,ankle={x:baseX+angle*.6,y:939-Math.min(52,lift*1.8)-ground};
  let dx=ankle.x-hip.x,dy=ankle.y-hip.y,distance=Math.hypot(dx,dy)||1;
  const reach=clamp(distance,1,119.5);dx/=distance;dy/=distance;
  ankle.x=hip.x+dx*reach;ankle.y=hip.y+dy*reach;
  const along=reach/2,height=Math.sqrt(Math.max(0,60*60-along*along));
  const knee={x:hip.x+dx*along+dy*height*sign,y:hip.y+dy*along-dx*height*sign};
  const tx=(ankle.x-hip.x)*.1,ty=(ankle.y-hip.y)*.1;
  const d=`M${hip.x} ${hip.y} C${hip.x} ${(hip.y+24).toFixed(2)} ${(knee.x-tx).toFixed(2)} ${(knee.y-ty).toFixed(2)} ${knee.x.toFixed(2)} ${knee.y.toFixed(2)} C${(knee.x+tx).toFixed(2)} ${(knee.y+ty).toFixed(2)} ${ankle.x.toFixed(2)} ${(ankle.y-20).toFixed(2)} ${ankle.x.toFixed(2)} ${ankle.y.toFixed(2)}`;
  for(const part of ['outline','curve','light'])this.attr('leg-'+side+'-'+part,'d',d);
  this.transform('leg-'+side,'translate(0 0)');
  this.transform('foot-'+side,`translate(${(ankle.x-baseX).toFixed(2)} ${(ankle.y-939).toFixed(2)}) rotate(${(angle*.28).toFixed(2)} ${baseX} 939)`);
 }
 play(name){
  if(!SCENES[name])throw new Error('Unknown scene: '+name);
  this.scene=name;this.elapsed=0;this.completed=false;
  this.svg.dispatchEvent(new CustomEvent('greenactor:scenechange',{detail:{name, ...SCENES[name]}}));
  this.render(0,0);
  return this;
 }
 // Coordenadas del SVG principal, calculadas a partir del objeto real de la escena.
 reachFor(point){this._reachTarget=point&&Number.isFinite(point.x)&&Number.isFinite(point.y)?point:null;return this;}
 lookAt(point,seconds=2.8){this._lookTarget=point&&Number.isFinite(point.x)&&Number.isFinite(point.y)?{...point,until:this.motionTime+seconds}:null;return this;}
 tap(){this.tapCount=this.tapCount%3+1;this.play('tap'+this.tapCount);return this.tapCount}
 pause(){this.paused=true; return this}
 resume(){if(this.paused){this.paused=false;this.last=0;}return this}
 togglePause(){return this.paused?this.resume():this.pause()}
 resetTouches(){this.tapCount=0;return this}
 getSceneInfo(){return {name:this.scene,elapsed:this.elapsed,...SCENES[this.scene]}}
 destroy(){this.stopped=true;cancelAnimationFrame(this._raf)}
 frame(now){
  if(this.stopped)return;
  if(!this.last) this.last=now;
  const dt=clamp((now-this.last)/1000,0,.07);this.last=now;
  if(!this.paused){
    const meta=SCENES[this.scene];this.elapsed+=dt;
    if(this.elapsed>=meta.duration){
      if(meta.loop) this.elapsed%=meta.duration;
      else {
        this.elapsed=meta.duration;
        if(!this.completed){this.completed=true;this.svg.dispatchEvent(new CustomEvent('greenactor:complete',{detail:{name:this.scene}}))}
      }
    }
    this.motionTime+=dt;
    this.render(this.elapsed,dt);
    if(this.options.onFrame)this.options.onFrame(this.getSceneInfo(),dt);
  }
  this._raf=requestAnimationFrame(t=>this.frame(t));
 }
 // Respuesta amortiguada exacta: conserva posición y velocidad al cambiar de gesto.
 // Ojos rápidos, cabeza intermedia y ropa más lenta, sin un filtro dependiente de FPS.
 settlePose(target,dt){
  if(!this._pose||dt===null||!this.options.embedded){this._pose={...target};this._velocity={};return;}
  for(const key of Object.keys(target)){
    if(['eyeL','eyeR'].includes(key)){this._pose[key]=target[key];continue;}
    let frequency=14,damping=.94;
    if(['pupilX','pupilY','lidL','lidR','grump','sly','surprise','cover'].includes(key)){frequency=26;damping=1;}
    else if(['scarf','tail','knot','hair','earL','earR'].includes(key)){frequency=9;damping=.78;}
    else if(['leftArm','rightArm','reach'].includes(key)){frequency=13;damping=.86;}
    else if(['forearmL','forearmR'].includes(key)){frequency=10.5;damping=.9;}
    const x=this._pose[key]-target[key],velocity=this._velocity[key]||0,decay=Math.exp(-damping*frequency*dt);
    let next,speed;
    if(damping===1){const c=velocity+frequency*x;next=(x+c*dt)*decay;speed=(velocity-frequency*c*dt)*decay;}
    else{
      const wd=frequency*Math.sqrt(1-damping*damping),sn=Math.sin(wd*dt),cs=Math.cos(wd*dt);
      next=decay*(x*cs+(velocity+damping*frequency*x)/wd*sn);
      speed=decay*(velocity*cs-(damping*frequency*velocity+frequency*frequency*x)/wd*sn);
    }
    this._pose[key]=target[key]+next;this._velocity[key]=speed;
  }
 }
 render(t,dt=null){
  const mode=this.scene;const D=SCENES[mode].duration;const p=clamp(t/D);
  let v={dx:0,dy:0,s:1,angle:0,head:0,body:1,leftLeg:0,rightLeg:0,leftArm:0,rightArm:0,
    scarf:0,tail:0,knot:0,hair:0,earL:0,earR:0,eyeL:1,eyeR:1,pupilX:0,pupilY:0,browL:0,browR:0,lidL:0,lidR:0,grump:0,sly:0,surprise:0,reach:0,cover:0,headY:0,alpha:1,
    hatTilt:0,hatSlip:0,hatTouch:0,laughCover:0,trapPress:0,leftWorldReach:0,leftWorldHandX:this._pose?.leftWorldHandX??306,leftWorldHandY:this._pose?.leftWorldHandY??750,
    worldReach:0,worldHandX:this._pose?.worldHandX||494,worldHandY:this._pose?.worldHandY||750};
  const personality=this.options.embedded&&this.options.personality!==false;
  const frozen=!!this.options.frozen;
  const clock=this.options.embedded&&dt!==null?this.motionTime:t;
  const visible={};const props=(...args)=>{for (const id of args)visible[id]=1};
  let text='';let bubble=0;let bagTransform='';let bulbTransform='';let rollVisible=0;
  // Every frame uses absolute coordinates; switching scenes never leaves stale transforms.
  const breath = wave(clock,0.23);
  const blinkAt = (cycle, phase=0) => {
    const f=((clock+phase)%cycle)/cycle;
    return f>.76 && f<.795 ? Math.max(.09,1-Math.sin((f-.76)/.035*PI)*.92) : 1;
  };
  v.head=1.3*wave(clock,.20);v.body=1+.011*breath;
  v.scarf=4*wave(clock,.31);v.tail=7*wave(clock,.24);
  v.leftArm=2.5*wave(clock,.23);v.rightArm=-2.5*wave(clock,.23);
  v.eyeL=blinkAt(4.7);v.eyeR=blinkAt(4.7);
  if(personality){
    const blink=clock%13.7;
    const close=bump(blink,2.8,2.86,2.91,3.04)+bump(blink,9.1,9.16,9.21,9.34)+bump(blink,9.51,9.57,9.61,9.75);
    v.eyeL=1-.94*close;v.eyeR=1-.92*close;
    v.grump=.48;v.lidL=.43;v.lidR=.5;
    v.leftArm=.8*wave(clock,.23);v.rightArm=-.6*wave(clock-.2,.23);
  }
  switch(mode){
    case 'idle':
      v.dy=-3*breath;v.pupilX=3*wave(t,.12);v.head=2*wave(clock,.17);v.hair=2*wave(clock,.2);
      if(personality){
        // Mirada primero, cabeza después: una pausa de sospecha dentro del reposo.
        const watch=clock%17.3,glance=bump(watch,1.2,1.37,4.1,4.32),check=bump(watch,10.7,10.9,13.5,13.7);
        v.pupilX=-10*glance+8*check;
        v.head=3.5*bump(watch,1.5,2.15,4.3,5.1)-2.5*bump(watch,11.1,11.8,13.7,14.4);
        v.dy=-1.5*breath;v.scarf=2*wave(clock,.25);v.tail=3*wave(clock,.21);
        v.grump=.48+.2*glance;v.lidL=.43+.19*glance;v.lidR=.5+.12*glance;
      }
      break;
    case 'sneak':{
      const step=wave(t,1.05),drift=wave(t,.165);
      v.dx=85*drift;v.dy=-9*Math.abs(step);v.angle=-3+3*wave(t,.17);
      v.leftLeg=11*step;v.rightLeg=-11*step;v.leftArm=10+6*step;v.rightArm=-10-6*step;
      v.head=9*wave(t,.34);v.pupilX=t%6<2?-10:t%6<4?11:-8;
      v.earL=-3*step;v.earR=3*step;v.scarf=7*wave(t,.36);
      if(this.options.embedded){
        // La aproximación termina en la misma posición que el tirón del cordón.
        const settle=1-between(t,1.3,2),arc=Math.sin(PI*clamp(t/2));
        v.dx=22*arc;v.dy=-3*Math.abs(step)*arc;v.angle=-3*arc;
        for(const key of ['leftLeg','rightLeg','leftArm','rightArm','head','earL','earR','scarf'])v[key]*=settle;
        if(personality){v.pupilX=-12*bump(t,.1,.35,.9,1.2)+10*bump(t,1.15,1.4,1.75,2);v.grump=.38;v.sly=.35*between(t,1.2,1.9);v.lidL=.42;v.lidR=.3;}
      }
      break;}
    case 'run':{
      const sprint=wave(t,3.8);
      v.dx=35*wave(t,.31);v.dy=-10*Math.abs(sprint);v.angle=8;
      v.leftLeg=18*sprint;v.rightLeg=-18*sprint;v.leftArm=-14*sprint;v.rightArm=14*sprint;
      v.head=-7;v.pupilX=11;v.scarf=55+10*wave(t,2.5);v.tail=-11+14*wave(t,2.5);
      v.hair=-11;props('dust','speed-lines');visible.dust=.2+.45*Math.abs(sprint);visible['speed-lines']=.35+.25*Math.abs(sprint);
      break;}
    case 'climb':{
      props('roof-card');
      const approach=between(t,0,1.1),pull=between(t,1.5,5.5),finish=between(t,5.5,6.5);
      v.s=.61;v.dx=lerp(-185,95,approach*.4+pull*.6);
      v.dy=-270*pull + 5*wave(t,1.8)*bump(t,1.2,1.6,5.7,6.2);
      v.leftArm=-115+29*wave(t,1.5);v.rightArm=115-29*wave(t,1.5);
      v.leftLeg=38*wave(t,1.3)*(1-finish);v.rightLeg=-38*wave(t,1.3)*(1-finish);
      v.head=-9+8*finish;v.scarf=18*wave(t,.7);v.pupilY=-8;
      break;}
    case 'steal':{
      props('wire-bulb');v.s=.87;
      const peer=between(t,.5,1.3),look=between(t,1.35,2.35),reach=between(t,2.6,3.8),unscrew=between(t,3.9,5.15),stow=between(t,5.4,6.8);
      v.dx=-95+120*peer;v.dy=70-70*peer;
      v.head=-11*peer+8*look;v.pupilX=t<2.3?wave(t,1)*12:11;
      v.rightArm=-10*reach+25*stow;v.leftArm=13*peer;
      v.scarf=-9+9*wave(t,.7);props('reach-arm');visible['reach-arm']=bump(t,2.65,3.7,5.25,5.95);this.show('arm-right',1-visible['reach-arm']);
      this.rot('hanging-bulb',360*unscrew,579,600);
      visible['wire-bulb']=1-unscrew;
      if(t>=5.0){props('stolen-bulb');visible['stolen-bulb']=1-between(t,6.7,7.2);
        bulbTransform=`translate(${lerp(575,597,stow)} ${lerp(600,845,stow)}) rotate(${20+540*unscrew}) scale(${lerp(1,.7,stow)})`;}
      if(t>4.6){props('bag');bagTransform=`rotate(${10*wave(t,.5)} 593 848)`}
      if(t>6.4){bubble=bump(t,6.5,6.9,7.9,8.3);text='ji, ji…';}
      break;}
    case 'caught':{
      const freeze=between(t,.3,.55),recover=between(t,3.8,4.6);
      v.dx=-8;v.dy=-18*freeze+12*recover;v.head=-6;
      v.eyeL=lerp(1,1.18,freeze);v.eyeR=lerp(1,1.18,freeze);
      v.pupilX=9*wave(t,.7);v.leftArm=-29*freeze;v.rightArm=29*freeze;
      props('sweat'); visible.sweat=bump(t,.75,1.1,3.8,4.5);
      this.transform('sweat',`translate(0 ${(-12+58*between(t,1.3,3.4)).toFixed(1)})`);
      bubble=bump(t,.3,.65,2.4,3);text='¡Ups!';
      if(personality){
        const sulk=between(t,2.3,3.2),startle=1-between(t,1.5,2.2);
        v.dx=-3*startle;v.dy=-10*bump(t,.02,.13,.3,.55);v.angle=0;
        v.head=-8*startle+9*sulk;v.pupilX=-9*sulk;v.surprise=startle;
        v.leftArm=-29*startle-32*sulk;v.rightArm=29*startle+32*sulk;
        v.grump=.9*sulk;v.lidL=.7*sulk;v.lidR=.62*sulk;
        v.eyeL=1+.16*startle;v.eyeR=v.eyeL;
      }
      break;}
    case 'drop':{
      const trip=between(t,.5,2.2),fall=between(t,2.2,3.15),recover=between(t,4.4,6.4);
      v.dx=-36*fall+34*recover;v.angle=-10*fall+10*recover;
      v.dy=-40*Math.sin(PI*between(t,.1,1.1)) + 23*fall-24*recover;
      v.leftLeg=16*wave(t,2)*trip;v.rightLeg=-18*wave(t,2)*trip;
      v.leftArm=27*fall;v.rightArm=-26*fall;v.head=-15*fall+15*recover;
      props('bag');bagTransform=`translate(${95*fall} ${-100*fall}) rotate(${92*fall} 593 848)`;
      visible.bag=1-between(t,4.8,5.6);
      rollVisible=between(t,2.35,2.7);visible['rolling-bulbs']=rollVisible;
      this.transform('roll-a',`translate(${lerp(584,735,between(t,2.5,5.8))} ${lerp(830,969,between(t,2.5,4.0))-24*Math.abs(wave(t,1.2))*(1-between(t,4.3,5.8))}) rotate(${540*between(t,2.5,5.8)})`);
      this.transform('roll-b',`translate(${lerp(617,240,between(t,2.6,6.3))} ${lerp(821,975,between(t,2.6,4.8))-36*Math.abs(wave(t,1.3))*(1-between(t,4.5,6.1))}) rotate(${-640*between(t,2.6,6.3)})`);
      this.transform('roll-c',`translate(${lerp(618,500,between(t,2.7,5.5))} ${lerp(817,980,between(t,2.7,4.1))-32*Math.abs(wave(t,1.4))*(1-between(t,4.3,5.4))}) rotate(${340*between(t,2.7,5.5)})`);
      v.eyeL=1+.18*fall;v.eyeR=1+.18*fall;
      bubble=bump(t,2.5,2.8,4.0,4.5);text='¡No!';
      break;}
    case 'tantrum':{
      const stomp=(Math.sin(t*PI*3)>0?1:0)*Math.abs(wave(t,1.5));
      v.dy=-7*stomp;v.head=-8+5*wave(t,.6);v.body=.99;
      v.leftArm=32;v.rightArm=-32;v.leftLeg=-4*stomp;v.rightLeg=8*stomp;
      v.browL=16;v.browR=-16;v.pupilX=3;v.scarf=-5*wave(t,2);
      bubble=bump(t,.5,.85,3.1,3.7);text='hmph';
      props('dust');visible.dust=.4*stomp;
      break;}
    case 'hide':{
      const dive=between(t,.6,2.0),peek=between(t,2.3,2.6);
      props('roof-front');v.s=.82;v.dy=370*dive;v.alpha=1-between(t,1.7,2.3);
      v.head=-8*dive;v.eyeL=blinkAt(3.8);
      props('peek-eyes');visible['peek-eyes']=peek;
      this.transform('peek-pupils',`translate(${8*wave(t,.45)} ${4*wave(t,.35)})`);
      break;}
    case 'tap1':{
      const panic=between(t,0,.19),jump=Math.sin(PI*between(t,.22,1.65));
      v.dy=-112*jump;v.angle=10*Math.sin(t*8)*(1-between(t,1.7,2.6));
      v.leftArm=-34*panic;v.rightArm=34*panic;
      v.leftLeg=-13*jump;v.rightLeg=13*jump;v.eyeL=1+.18*panic;v.eyeR=1+.18*panic;
      v.head=-10*panic;v.scarf=-15*jump;
      bubble=bump(t,.17,.31,1.0,1.7);text='¡Ah!';
      if(personality){
        const recoil=bump(t,0,.12,.32,.7),suspect=bump(t,.45,.9,2.1,3);
        v.dy=-20*recoil;v.dx=4*recoil;v.angle=-2*recoil;v.head=-6*recoil+8*suspect;
        v.leftLeg=-3*recoil;v.rightLeg=3*recoil;v.leftArm=-12*recoil-14*suspect;v.rightArm=12*recoil+14*suspect;
        v.surprise=recoil;v.grump=.75*suspect;v.lidL=.65*suspect;v.lidR=.5*suspect;v.pupilX=-12*suspect;
      }
      break;}
    case 'tap2':{
      const frown=between(t,.15,.55),walkOff=between(t,1.35,3.85);
      v.dx=610*walkOff+6*wave(t,5)*(1-walkOff);v.angle=6*walkOff;
      v.leftLeg=25*wave(t,2.8)*walkOff;v.rightLeg=-25*wave(t,2.8)*walkOff;
      v.leftArm=64;v.rightArm=-45;v.browL=18*frown;v.browR=-17*frown;
      v.pupilX=-10;v.head=-11;v.eyeL=blinkAt(3.9);
      bubble=bump(t,.32,.52,1.5,1.85);text='grrr…';
      if(personality){
        const fold=bump(t,.1,.6,2.9,4),stamp=bump(t,1.6,1.85,2,2.25);
        v.dx=4*fold;v.dy=3*fold;v.angle=2*fold;v.head=10*fold;v.pupilX=-13*fold;
        v.leftArm=-34*fold;v.rightArm=34*fold;v.leftLeg=0;v.rightLeg=-12*stamp;
        v.scarf=-7*bump(t,1.9,2.15,2.3,2.7);v.grump=fold;v.lidL=.78*fold;v.lidR=.65*fold;
      }
      break;}
    case 'tap3':{
      const shy=between(t,.3,1.0);
      v.head=-13*shy+6*wave(t,.45)*shy;v.dy=9*shy;v.pupilX=-14*shy;v.pupilY=9*shy;
      v.leftArm=28*shy;v.rightArm=-24*shy;v.earL=9*shy;v.earR=-9*shy;
      props('blush');visible.blush=shy;
      v.eyeL=blinkAt(3.6,.2);v.eyeR=blinkAt(3.6,.2);
      if(personality){
        const defy=bump(t,.1,.6,3,4.2);
        visible.blush=0;v.head=-7*defy;v.dy=0;v.pupilX=12*defy;v.pupilY=-2*defy;
        v.leftArm=-28*defy;v.rightArm=28*defy;v.earL=-4*defy;v.earR=2*defy;
        v.grump=.2;v.sly=.85*defy;v.lidL=.55*defy;v.lidR=.25*defy;
      }
      break;}
    case 'xmas':{
      props('christmas-star','lights-string');
      const give=between(t,.45,3.5),sit=between(t,4.3,6.6);
      v.s=lerp(1,.78,between(t,3.5,5));v.dx=-145*between(t,.3,4.5);
      v.dy=80*sit;v.angle=-5*sit;v.body=1-.16*sit;
      v.leftArm=-58*give+40*sit;v.rightArm=55*give-35*sit;
      v.leftLeg=0;v.rightLeg=0;v.head=3*wave(t,.3);props('sitting-legs');visible['sitting-legs']=sit;
      v.scarf=7*wave(t,.23);v.tail=6*wave(t,.2);
      props('smile');visible.smile=between(t,4.3,4.8);
      this.show('mouth',1-visible.smile);
      visible['lights-string']=give; visible['christmas-star']=.45+.55*between(t,4,5);
      this.transform('christmas-star',`rotate(${4*wave(t,.18)} 630 706) scale(${1+.04*wave(t,.38)})`);
      props('stolen-bulb');visible['stolen-bulb']=bump(t,.6,1.1,3.3,3.9);
      bulbTransform=`translate(${lerp(490,485,give)} ${lerp(657,246,give)}) rotate(${180*give}) scale(.68)`;
      break;}
    case 'hat':{
      const bow=bump(t,.05,.65,2.6,3.65),fix=bump(t,.65,1.1,2.05,2.65);
      v.headY=15*bow;v.head=0;v.hatSlip=155*bow;v.hatTouch=fix;
      v.hatTilt=-8*bump(t,.7,1.1,1.5,2.1);v.pupilY=-10*fix;v.pupilX=9*fix;
      v.leftArm=-20*bow;v.grump=.7;v.lidL=.7;v.lidR=.5;v.scarf=-5*bow;break;}
    case 'scoff':{
      const grin=bump(t,.1,.6,2.65,3.6),laugh=bump(t,.7,.95,2.0,2.55),shake=Math.abs(wave(t,2.6))*laugh;
      v.laughCover=grin;v.rightArm=66*grin;v.leftArm=-22*grin;v.headY=18*grin;v.head=-8*grin+3*shake;
      v.dy=-6*shake;v.body=1-.018*shake;v.sly=grin;v.grump=.15;v.lidL=.72*grin;v.lidR=.5*grin;v.pupilX=-11*grin;v.scarf=8*shake;break;}
    case 'shoo':{
      const protest=bump(t,.1,.55,2.6,3.8),wag=wave(t,1.6)*bump(t,.65,.9,2.1,2.7);
      v.head=8*wag;v.rightArm=-48*protest-14*wag;v.leftArm=-30*protest;v.pupilY=-7*protest;
      v.grump=protest;v.lidL=.85*protest;v.lidR=.7*protest;v.earL=5*protest;v.earR=-5*protest;break;}
    case 'doze':{
      const sleep=bump(t,.2,1.6,4.0,4.35),wake=bump(t,4.05,4.2,4.45,4.9);
      v.headY=28*sleep;v.head=12*sleep-9*wake;v.eyeL=1-.98*sleep;v.eyeR=v.eyeL;
      v.lidL=.92*sleep;v.lidR=.92*sleep;v.leftArm=-24*sleep;v.rightArm=24*sleep;
      v.dy=4*sleep-13*wake;v.surprise=wake;v.pupilX=-12*bump(t,4.5,4.8,5.4,6);v.grump=.6*(1-wake);break;}
    case 'ack':{
      const nod=bump(t,.3,.8,1.15,1.8);v.head=10*nod;v.pupilY=6*nod;
      v.rightArm=-16*nod;v.grump=.58;v.lidL=.6;v.lidR=.5;v.sly=.12;
      v.scarf=2*wave(clock,.25);v.dy=-1.5*breath;break;}
    case 'thaw':{
      const look=bump(t,.2,.7,1.45,1.9),shiver=bump(t,1.5,1.8,2.55,2.9),stretch=bump(t,2.9,3.6,4.9,6.2);
      v.pupilY=14*look;v.head=8*look-9*stretch;
      v.dx=4*wave(t,9)*shiver;v.dy=-12*stretch;
      v.leftArm=24*look+90*stretch;v.rightArm=-24*look-90*stretch;
      v.body=1+.035*stretch;v.scarf=12*wave(t,7)*shiver;
      v.earL=5*wave(t,8)*shiver;v.earR=-v.earL;
      v.eyeL=1-.45*stretch;v.eyeR=v.eyeL;
      break;}
    case 'privacy':{
      const cover=between(t,0,.6);
      v.head=0;v.dy=0;v.body=1;v.leftArm=0;v.rightArm=0;
      v.eyeL=1-.9*cover;v.eyeR=v.eyeL;v.pupilX=0;v.pupilY=0;
      props('hands-eyes');visible['hands-eyes']=cover;
      v.cover=cover;
      if(this.n('arm-left-curve')){v.headY=72*cover;v.body=1-.025*cover;v.grump=.6;}
      break;}
    case 'tug':{
      const reach=between(t,0,.8),pull=bump(t,1.0,1.4,3.5,4.0);
      v.head=-10*reach+14*between(t,4.0,5.2);v.pupilY=-10*(1-between(t,4,5));
      v.pupilX=t>4?10*wave(t,.6):7;v.leftArm=12*reach;
      v.angle=-3*pull;v.dy=4*pull;v.scarf=2*wave(t,.5);
      props('reach-arm');visible['reach-arm']=reach;
      v.reach=-26*reach+4*pull;
      if(personality){
        const tug=bump(t,1,1.25,1.55,1.9)+.7*bump(t,2.3,2.55,2.85,3.2);
        const check=bump(t,4,4.35,5.1,5.6);
        v.angle=-4*tug;v.dy=3*tug;v.leftArm=15*reach;v.head=-8*reach+14*check;v.pupilX=7-18*check;
        v.grump=.32;v.sly=.8*bump(t,1.3,1.8,4.1,4.7);v.lidL=.55;v.lidR=.38;
        v.scarf=5*tug;v.reach=-26*reach+5*tug;
      }
      break;}
    case 'offer':{
      const reach=between(t,0,.8)*(1-between(t,3.8,5));
      v.head=-7*reach;v.pupilY=-9*reach;v.leftArm=8*reach;
      props('reach-arm','smile');visible['reach-arm']=reach;visible.smile=reach;
      v.reach=-26*reach;this.show('mouth',1-reach);
      if(personality){v.grump=.45*(1-between(t,2.1,3.5));v.lidL=.4*reach;v.lidR=.3*reach;visible.smile=.55*reach*between(t,2.2,3.6);}
      break;}
    case 'grump':{
      const prepare=bump(t,.05,.25,.4,.8),fold=bump(t,.35,1.05,4.25,5.8),huff=bump(t,1.65,1.9,2.15,2.8),stamp=bump(t,3.05,3.2,3.37,3.72);
      v.head=9*fold-5*huff-3*prepare;v.dy=2*fold+2*prepare;v.angle=1.5*fold;v.body=1-.012*huff-.008*prepare;
      v.leftArm=8*prepare-34*fold;v.rightArm=-6*prepare+34*bump(t,.45,1.2,4.35,5.8);v.rightLeg=-11*stamp;v.leftLeg=2*bump(t,2.85,3.05,3.6,3.9);
      v.pupilX=-12*fold;v.pupilY=2*fold;v.grump=fold;v.lidL=.78*fold;v.lidR=.68*fold;
      v.earL=6*fold;v.earR=-4*fold;v.scarf=-8*bump(t,1.9,2.1,2.3,2.85);
      break;}
    case 'plot':{
      const left=bump(t,.1,.4,1.05,1.4),right=bump(t,1.5,1.8,2.4,2.8),idea=bump(t,2.8,3.3,4.5,5.2);
      const rub=2.2*Math.sin((t-3.2)*PI*2*1.15)*bump(t,3.2,3.5,4.1,4.45);
      v.pupilX=-13*left+12*right+7*idea;v.pupilY=-3*idea;
      v.head=5*bump(t,.35,.75,1.1,1.5)-5*bump(t,1.75,2.1,2.5,2.9)-6*idea;
      v.leftArm=-31*idea+rub;v.rightArm=31*bump(t,2.98,3.45,4.55,5.2)+rub*.75;v.dy=1.5*idea;
      v.grump=.3*(left+right);v.sly=.9*idea;v.lidL=.45*(left+right)+.5*idea;v.lidR=.35*(left+right)+.22*idea;
      v.earL=-3*idea;v.earR=3*idea;v.tail=3*wave(t,.3);v.scarf=2*wave(t,.28);
      break;}
    case 'nye':{
      props('night-overlay','celebration-fireworks','hands-ears');
      visible['night-overlay']=.85;
      const bang=Math.abs(wave(t,1.5));
      visible['celebration-fireworks']=.15+.85*Math.pow(bang,4);
      v.dx=5*wave(t,7)*(.3+.7*bang);v.dy=-5*bang;
      v.head=5*wave(t,6);v.leftArm=-105;v.rightArm=105;
      v.eyeL=.46+.23*Math.abs(wave(t,2));v.eyeR=v.eyeL;
      v.earL=9;v.earR=-9;v.scarf=18*wave(t,5);
      this.rot('fw-left',t*52,190,194);
      this.rot('fw-right',-t*65,615,284);
      break;}
  }
  let handGoal=null;
  if(this._reachTarget&&this.options.embedded&&['tug','offer'].includes(mode)){
    const a=this._reachTarget,dy=a.y-580,span=Math.sqrt(Math.max(0,170*170-dy*dy));
    const step=clamp(a.x-444-span+18,0,160)*between(t,0,.95);
    const extension=between(t,.65,1.35)*(mode==='offer'?1-between(t,3.2,4):1);
    const pull=mode==='tug'?44*between(t,1.45,1.85)+24*(bump(t,1.7,1.95,2.2,2.5)+.7*bump(t,2.9,3.15,3.4,3.75)):0;
    v.dx=step-pull*.35;v.dy=0;v.angle=0;v.leftLeg=5*Math.sin(Math.PI*between(t,0,.95));v.rightLeg=-v.leftLeg;
    v.head=-4*extension;v.pupilX=9;v.pupilY=clamp((a.y-325)/25,-8,8);
    v.rightArm=0;v.grump=.6+.3*clamp(pull/60);v.sly=.4*extension;v.lidL=.6;v.lidR=.4;
    visible['reach-arm']=0;
    v.worldHandX=a.x-v.dx-1.5*pull;v.worldHandY=a.y+pull;v.worldReach=extension;
  }
  if(this._reachTarget&&this.options.embedded&&mode==='mischief'){
    const a=this._reachTarget,dy=a.y-580,span=Math.sqrt(Math.max(0,173*173-dy*dy));
    const step=clamp(a.x-352+span-12,-180,0)*between(t,0,.75);
    const extend=between(t,.45,1.1)*(1-between(t,3.25,4.1));
    const pull=72*bump(t,1.45,1.72,1.95,2.25)+54*bump(t,2.35,2.6,2.82,3.12);
    const walk=Math.sin(t/.78*PI*2)*between(t,0,.12)*(1-between(t,.62,.8));
    v.leftLeg=18*walk;v.rightLeg=-18*walk;v.dx=step+pull*.18;v.dy=-3*Math.abs(walk);v.angle=0;v.head=7*extend;v.pupilX=-12;v.pupilY=9;
    v.leftArm=0;v.rightArm=15;v.grump=.75;v.sly=.4;v.lidL=.7;v.lidR=.55;
    v.leftWorldReach=extend;v.leftWorldHandX=a.x-v.dx+pull;v.leftWorldHandY=a.y-pull*.3;
    v.scarf=-5*bump(t,1.5,1.8,2,2.3);
  }
  if(this._lookTarget&&this.motionTime<=this._lookTarget.until&&mode!=='privacy'&&!this._reachTarget){
    const dx=this._lookTarget.x-400-v.dx,dy=this._lookTarget.y-325-v.dy,length=Math.hypot(dx,dy)||1;
    v.pupilX=12*dx/length;v.pupilY=9*dy/length;v.head=lerp(v.head,v.pupilX*.35,.75);
  }
  if(frozen){
    // Una pose estática, enfadada durante todo el deshielo; los ojos se animan por CSS.
    Object.assign(v,{dx:0,dy:0,angle:0,head:0,body:1,leftArm:0,rightArm:0,leftLeg:0,rightLeg:0,
      scarf:0,tail:0,knot:0,hair:0,earL:4,earR:-3,eyeL:1,eyeR:1,pupilX:-5,pupilY:0,
      grump:1,sly:.12,surprise:0,lidL:.9,lidR:.82});
    v.leftArm=-18;v.rightArm=16;
    if(mode==='trapped'){
      const press=bump(t,.08,.65,2.55,3.6),strain=bump(t,.85,1.1,1.35,1.65)+.7*bump(t,1.8,2.05,2.25,2.55);
      v.trapPress=press;v.head=2*press;v.pupilX=-3+7*strain;v.pupilY=-2*press;
      v.lidL=.94;v.lidR=.88;v.earL=4+3*strain;v.earR=-3-2*strain;
    }
  }
  v.forearmL=v.leftArm;v.forearmR=v.rightArm;
  this.settlePose(v,dt);v={...this._pose};
  handGoal=v.worldReach>.0001?{x:v.worldHandX,y:v.worldHandY,amount:clamp(v.worldReach)}:null;
  // Las capas auxiliares también se relevan sin aparecer de golpe.
  for(const id of ['reach-arm','hands-eyes','smile','sweat','blush']){
    const target=visible[id]||0;
    this._visible[id]=dt===null||!this.options.embedded?target:lerp(this._visible[id]||0,target,1-Math.exp(-20*dt));
    if(Math.abs(this._visible[id]-target)<.0001)this._visible[id]=target;
    visible[id]=this._visible[id];
  }
  this.rot('reach-arm',v.reach,448,585);
  // Los hombros permanecen anclados al torso al subir las manos, sin trasladar los brazos enteros.
  const cover=clamp(v.cover),arc=Math.sin(PI*cover),headAngle=v.head*PI/180;
  const eye=(x,y)=>({x:399+(x-399)*Math.cos(headAngle)-(y-474)*Math.sin(headAngle),y:474+(x-399)*Math.sin(headAngle)+(y-474)*Math.cos(headAngle)+v.headY});
  const le=eye(350,319),re=eye(449,326);
  const lx=lerp(366,le.x,cover)-56*arc,ly=lerp(640,le.y,cover),rx=lerp(432,re.x,cover)+56*arc,ry=lerp(640,re.y,cover);
  this.attr('cover-arm-left','d',`M352 580 C${lerp(324,285,cover)} ${lerp(596,520,cover)} ${lx-42*cover} ${ly+72*cover} ${lx-16*cover} ${ly+9*cover}`);
  this.attr('cover-arm-right','d',`M445 580 C${lerp(478,516,cover)} ${lerp(596,518,cover)} ${rx+42*cover} ${ry+72*cover} ${rx+16*cover} ${ry+9*cover}`);
  this.attr('cover-arm-shine','d',`M350 575 Q${lx-35*cover} ${ly+140*cover} ${lx-11*cover} ${ly+60*cover} M447 575 Q${rx+35*cover} ${ry+140*cover} ${rx+11*cover} ${ry+60*cover}`);
  for(const [id,x,y,cx,cy,sign] of [['cover-hand-left',lx,ly,350,319,-1],['cover-hand-right',rx,ry,449,326,1]]){
    this.transform(id,`translate(${x} ${y}) rotate(${sign*12*arc}) scale(${lerp(.55,1,cover)}) translate(${-cx} ${-cy})`);
  }
  this.transform('hands-eyes','translate(0 0)');
  this.transform('actor',`translate(${v.dx.toFixed(2)} ${v.dy.toFixed(2)}) rotate(${v.angle.toFixed(2)} 400 900) translate(400 960) scale(${v.s.toFixed(4)}) translate(-400 -960)`);
  this.attr('actor','opacity',v.alpha);
  this.transform('head',`translate(0 ${v.headY.toFixed(2)}) rotate(${v.head.toFixed(2)} 399 474)`);this.bodyScale(v.body);
  if(this.n('leg-left-curve')){
    // Compensar la respiración en el apoyo, pero conservar los saltos y carreras.
    const stride=['sneak','run','climb'].includes(mode)||mode==='mischief'&&t<.85;
    const planted=stride||['idle','grump','plot','privacy','tug','offer','tap2','tap3','ack','mischief','trapped','hat','scoff','shoo','doze'].includes(mode);
    const ground=side=>planted?v.dy+Math.sin(v.angle*PI/180)*((side==='left'?365:445)-400):0;
    this.poseLeg('left',v.leftLeg,ground('left'),stride);this.poseLeg('right',v.rightLeg,ground('right'),stride);
  }else{
    this.rot('leg-left',v.leftLeg,370,807);this.rot('leg-right',v.rightLeg,432,805);
  }
  if(this.n('arm-left-curve')){
    const leftGoal=v.trapPress>.0001?{x:215,y:530,amount:clamp(v.trapPress)}:v.leftWorldReach>.0001?{x:v.leftWorldHandX,y:v.leftWorldHandY,amount:clamp(v.leftWorldReach)}:null;
    const rightGoal=v.trapPress>.0001?{x:605,y:530,amount:clamp(v.trapPress)}:v.hatTouch>.0001?{x:492,y:245+v.headY+v.hatSlip,amount:clamp(v.hatTouch)}:v.laughCover>.0001?{x:448,y:445+v.headY,amount:clamp(v.laughCover)}:handGoal;
    this.poseArm('left',v.leftArm,v.forearmL,leftGoal);this.poseArm('right',v.rightArm,v.forearmR,rightGoal);
  }else{
    this.rot('arm-left',v.leftArm,352,580);this.rot('arm-right',v.rightArm,444,580);
  }
  this.rot('scarf-tail',v.scarf,449,506);this.rot('scarf-knot',v.knot,399,490);
  this.transform('santa-hat',`translate(0 ${v.hatSlip.toFixed(2)}) rotate(${v.hatTilt.toFixed(2)} 400 235)`);this.rot('hat-tip',2*wave(clock,.45)+v.hatTilt*.5,400,215);
  this.rot('tail',v.tail,347,760);this.rot('hair',v.hair,400,231);
  this.rot('ear-left',v.earL,296,292);this.rot('ear-right',v.earR,504,290);
  this.faceScale('eye-left',351,317,1,v.eyeL);this.faceScale('eye-right',449,325,1,v.eyeR);
  this.transform('pupil-left',`translate(${v.pupilX.toFixed(1)} ${v.pupilY.toFixed(1)})`);
  this.transform('pupil-right',`translate(${v.pupilX.toFixed(1)} ${v.pupilY.toFixed(1)})`);
  this.rot('brow-left',v.browL,340,272);this.rot('brow-right',v.browR,450,272);
  // Párpados reales sobre los ojos: la pupila mantiene su forma al entrecerrarlos.
  for(const [id,cx,cy,rx,amount] of [['lid-left',351,317,38,v.lidL],['lid-right',449,325,39,v.lidR]]){
    const a=PI*(.025+.44*clamp(amount)),dx=rx*Math.sin(a),y=cy-46*Math.cos(a);
    // El párpado cae hacia el entrecejo: una mirada de fastidio, con iris redondos.
    const tilt=(id==='lid-left'?1:-1)*clamp(v.grump)*13;
    if(this.n('arm-left-curve')){
      const depth=clamp(amount)*24;
      const shape=id==='lid-left'
        ?`M307 304C325 284 351 289 386 312Q347 ${297+depth} 307 ${304+depth*.3}Z`
        :`M411 313C442 290 470 288 492 307L492 ${307+depth*.25}Q453 ${297+depth} 411 313Z`;
      this.attr(id,'d',shape);
    }else this.attr(id,'d',`M${cx-dx} ${y} A${rx} 46 0 0 1 ${cx+dx} ${y} L${cx+dx} ${y+tilt} Q${cx} ${y+4*amount} ${cx-dx} ${y-tilt}Z`);
    this.show(id,amount>0?1:0);
  }
  const g=clamp(v.grump),sly=clamp(v.sly);
  this.attr('brow-left','d',`M316 ${273+11*g} Q342 ${256+25*g} 364 ${275+27*g-7*sly}`);
  this.attr('brow-right','d',`M425 ${282+21*g-12*sly} Q448 ${253+27*g-8*sly} 477 ${278+6*g}`);
  const expression=clamp((1-g+sly)/2),frown=[363,432,384,413,416,414,440,430],smirk=[369,419,391,440,420,437,442,408];
  const m=frown.map((value,i)=>lerp(value,smirk[i],expression));
  this.attr('expression-line','d',`M${m[0]} ${m[1]} C${m[2]} ${m[3]} ${m[4]} ${m[5]} ${m[6]} ${m[7]}`);
  this.show('smirk-crease',sly);

  for (const id of ['roof-card','roof-front','peek-eyes','wire-bulb','stolen-bulb','bag','rolling-bulbs','sweat','blush','smile','bubble','dust','christmas-star','lights-string','night-overlay','celebration-fireworks','hands-ears','hands-eyes','reach-arm','sitting-legs','speed-lines']) {
    this.show(id,visible[id]||0);
  }
  if(mode!=='caught')this.transform('sweat','translate(0 0)');
  this.transform('bag',bagTransform||'translate(0 0)');
  this.transform('stolen-bulb',bulbTransform||'translate(0 0)');
  if(mode!=='hide')this.transform('peek-pupils','translate(0 0)');
  if(mode!=='nye')this.transform('celebration-fireworks','translate(0 0)');
  // Swap original legs for a connected, drawn seated pose (no detached feet).
  if(mode==='xmas'){const amount=visible['sitting-legs']||0;this.show('leg-left',1-amount);this.show('leg-right',1-amount)}else{this.show('leg-left',1);this.show('leg-right',1)}
  this.show('arm-right',this.options.embedded?(1-(visible['reach-arm']||0))*(1-(visible['hands-eyes']||0)):['steal','tug','offer'].includes(mode)?1-(visible['reach-arm']||0):mode==='privacy'?1-(visible['hands-eyes']||0):1);
  this.show('arm-left',this.options.embedded?1-(visible['hands-eyes']||0):mode==='privacy'?1-(visible['hands-eyes']||0):1);
  if(!this.options.embedded&&!['tug','offer'].includes(mode))this.transform('reach-arm','translate(0 0)');

  // El login aporta los objetos reales: no dibujar otra tarjeta o guirnalda encima.
  if(this.options.embedded)for(const id of ['roof-card','roof-front','wire-bulb','lights-string','night-overlay','celebration-fireworks'])this.show(id,0);
  // Restore the default face when leaving the Nochebuena scene.
  if(mode!=='xmas'&&mode!=='offer')this.show('mouth',1);
  const closedFace=(frozen||personality||['grump','plot'].includes(mode))*(1-v.surprise);
  const happy=visible.smile||0;
  this.show('expression-mouth',closedFace*(1-happy));
  if(closedFace)this.show('mouth',(1-closedFace)*(1-happy));
  // La actitud se entiende por la actuación; el login no necesita globos de texto.
  this.show('bubble',this.options.embedded?0:bubble);if(text)this.n('bubble-text').textContent=text;
 }
}
GreenActor.SCENES=SCENES;
window.GreenActor=GreenActor;
})();
