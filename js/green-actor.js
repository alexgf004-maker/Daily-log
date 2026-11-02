/* GreenActor 1.0 — 14 SVG animations for a self-contained web login. No external dependencies.
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
 nye:      {duration:5.6,loop:true,title:'31 de diciembre', detail:'Los destellos lo asustan: tiembla y se tapa los oídos.', group:'Fechas especiales'},
});
class GreenActor {
 constructor(svg, options={}){
  if (!svg || svg.tagName.toLowerCase() !== 'svg') throw new Error('GreenActor requires the actual inline <svg> element.');
  this.svg=svg; this.options=options; this.nodes={};
  const ids=['actor','head','body','leg-left','leg-right','arm-left','arm-right','tail','scarf-tail','scarf-knot','hair','ear-left','ear-right','eye-left','eye-right','pupil-left','pupil-right','brow-left','brow-right','mouth','smile','blush','sweat','hands-ears','roof-card','roof-front','peek-eyes','peek-pupils','wire-bulb','hanging-bulb','stolen-bulb','bag','rolling-bulbs','roll-a','roll-b','roll-c','bubble','bubble-text','dust','christmas-star','lights-string','night-overlay','celebration-fireworks','fw-left','fw-right','reach-arm','sitting-legs','speed-lines'];
  for (const id of ids) this.nodes[id]=svg.querySelector('#'+id);
  this.scene='idle';this.elapsed=0;this.last=0;this.paused=false;this.stopped=false;this.completed=false;this.tapCount=0;
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
 play(name){
  if(!SCENES[name])throw new Error('Unknown scene: '+name);
  this.scene=name;this.elapsed=0;this.completed=false;
  this.svg.dispatchEvent(new CustomEvent('greenactor:scenechange',{detail:{name, ...SCENES[name]}}));
  this.render(0);
  return this;
 }
 tap(){this.tapCount=this.tapCount%3+1;this.play('tap'+this.tapCount);return this.tapCount}
 pause(){this.paused=true; return this}
 resume(){this.paused=false;this.last=0;return this}
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
    this.render(this.elapsed);
    if(this.options.onFrame)this.options.onFrame(this.getSceneInfo());
  }
  this._raf=requestAnimationFrame(t=>this.frame(t));
 }
 render(t){
  const mode=this.scene;const D=SCENES[mode].duration;const p=clamp(t/D);
  const v={dx:0,dy:0,s:1,angle:0,head:0,body:1,leftLeg:0,rightLeg:0,leftArm:0,rightArm:0,
    scarf:0,tail:0,knot:0,hair:0,earL:0,earR:0,eyeL:1,eyeR:1,pupilX:0,pupilY:0,browL:0,browR:0,alpha:1};
  const visible={};const props=(...args)=>{for (const id of args)visible[id]=1};
  let text='';let bubble=0;let bagTransform='';let bulbTransform='';let rollVisible=0;
  // Every frame uses absolute coordinates; switching scenes never leaves stale transforms.
  const breath = wave(t,0.23);
  const blinkAt = (cycle, phase=0) => {
    const f=((t+phase)%cycle)/cycle;
    return f>.76 && f<.795 ? Math.max(.09,1-Math.sin((f-.76)/.035*PI)*.92) : 1;
  };
  v.head=1.3*wave(t,.20);v.body=1+.011*breath;
  v.scarf=4*wave(t,.31);v.tail=7*wave(t,.24);
  v.leftArm=2.5*wave(t,.23);v.rightArm=-2.5*wave(t,.23);
  v.eyeL=blinkAt(4.7);v.eyeR=blinkAt(4.7);
  switch(mode){
    case 'idle':
      v.dy=-3*breath;v.pupilX=3*wave(t,.12);v.head=2*wave(t,.17);v.hair=2*wave(t,.2);
      break;
    case 'sneak':{
      const step=wave(t,1.05),drift=wave(t,.165);
      v.dx=85*drift;v.dy=-9*Math.abs(step);v.angle=-3+3*wave(t,.17);
      v.leftLeg=11*step;v.rightLeg=-11*step;v.leftArm=10+6*step;v.rightArm=-10-6*step;
      v.head=9*wave(t,.34);v.pupilX=t%6<2?-10:t%6<4?11:-8;
      v.earL=-3*step;v.earR=3*step;v.scarf=7*wave(t,.36);
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
      break;}
    case 'tap2':{
      const frown=between(t,.15,.55),walkOff=between(t,1.35,3.85);
      v.dx=610*walkOff+6*wave(t,5)*(1-walkOff);v.angle=6*walkOff;
      v.leftLeg=25*wave(t,2.8)*walkOff;v.rightLeg=-25*wave(t,2.8)*walkOff;
      v.leftArm=64;v.rightArm=-45;v.browL=18*frown;v.browR=-17*frown;
      v.pupilX=-10;v.head=-11;v.eyeL=blinkAt(3.9);
      bubble=bump(t,.32,.52,1.5,1.85);text='grrr…';
      break;}
    case 'tap3':{
      const shy=between(t,.3,1.0);
      v.head=-13*shy+6*wave(t,.45)*shy;v.dy=9*shy;v.pupilX=-14*shy;v.pupilY=9*shy;
      v.leftArm=28*shy;v.rightArm=-24*shy;v.earL=9*shy;v.earR=-9*shy;
      props('blush');visible.blush=shy;
      v.eyeL=blinkAt(3.6,.2);v.eyeR=blinkAt(3.6,.2);
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
  this.transform('actor',`translate(${v.dx.toFixed(2)} ${v.dy.toFixed(2)}) rotate(${v.angle.toFixed(2)} 400 900) translate(400 960) scale(${v.s.toFixed(4)}) translate(-400 -960)`);
  this.attr('actor','opacity',v.alpha);
  this.rot('head',v.head,399,474);this.bodyScale(v.body);
  this.rot('leg-left',v.leftLeg,370,807);this.rot('leg-right',v.rightLeg,432,805);
  this.rot('arm-left',v.leftArm,352,580);this.rot('arm-right',v.rightArm,444,580);
  this.rot('scarf-tail',v.scarf,449,506);this.rot('scarf-knot',v.knot,399,490);
  this.rot('tail',v.tail,347,760);this.rot('hair',v.hair,400,231);
  this.rot('ear-left',v.earL,296,292);this.rot('ear-right',v.earR,504,290);
  this.faceScale('eye-left',351,317,1,v.eyeL);this.faceScale('eye-right',449,325,1,v.eyeR);
  this.transform('pupil-left',`translate(${v.pupilX.toFixed(1)} ${v.pupilY.toFixed(1)})`);
  this.transform('pupil-right',`translate(${v.pupilX.toFixed(1)} ${v.pupilY.toFixed(1)})`);
  this.rot('brow-left',v.browL,340,272);this.rot('brow-right',v.browR,450,272);
  for (const id of ['roof-card','roof-front','peek-eyes','wire-bulb','stolen-bulb','bag','rolling-bulbs','sweat','blush','smile','bubble','dust','christmas-star','lights-string','night-overlay','celebration-fireworks','hands-ears','reach-arm','sitting-legs','speed-lines']) {
    this.show(id,visible[id]||0);
  }
  if(mode!=='caught')this.transform('sweat','translate(0 0)');
  this.transform('bag',bagTransform||'translate(0 0)');
  this.transform('stolen-bulb',bulbTransform||'translate(0 0)');
  if(mode!=='hide')this.transform('peek-pupils','translate(0 0)');
  if(mode!=='nye')this.transform('celebration-fireworks','translate(0 0)');
  // Swap original legs for a connected, drawn seated pose (no detached feet).
  if(mode==='xmas'){const amount=visible['sitting-legs']||0;this.show('leg-left',1-amount);this.show('leg-right',1-amount)}else{this.show('leg-left',1);this.show('leg-right',1)}
  this.show('arm-right',mode==='steal'?1-(visible['reach-arm']||0):1);
  // Restore the default face when leaving the Nochebuena scene.
  if(mode!=='xmas')this.show('mouth',1);
  this.show('bubble',bubble);if(text)this.n('bubble-text').textContent=text;
 }
}
GreenActor.SCENES=SCENES;
window.GreenActor=GreenActor;
})();
