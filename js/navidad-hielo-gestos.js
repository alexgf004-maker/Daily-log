/* Pre-Navidad: lo que los gestos de la mascota dejan en el hielo (login y encabezado). Escucha el cambio de escena del
   motor (greenactor:scenechange) y, solo mientras dura el gesto, dibuja sobre el vidrio del bloque, dentro de su SVG
   (mismas coordenadas que el personaje, 800×1067):
   - icedraw:   vaho frente a la boca y el trazo del dedo (sigue a la mano real) con una carita enojada.
   - icescrape: un agujerito raspado frente al ojo (recorta la escarcha y el cuerpo del hielo con una máscara) y virutas.
   - icepunch:  el bloque se sacude, cae escarcha y aparece una grieta que se queda todo el día (localStorage).
   - icesneeze: ¡achú! nube de vaho, el bloque se sacude y caen copitos dentro del hielo.
   puede(nombre) dice si el hielo todavía llega a donde hace falta (con los días baja). */
(function(){
'use strict';
var NS='http://www.w3.org/2000/svg';
var GESTOS={icedraw:1,icescrape:1,icepunch:1,icesneeze:1};
var ALTURA={icedraw:440,icescrape:300,icepunch:500,icesneeze:2000};   // el borde de arriba del hielo debe quedar más arriba que esto
function cl(v,a,b){return Math.max(a,Math.min(b,v));}
function seg(t,a,b){return cl((t-a)/(b-a),0,1);}
function el(tag,attrs,parent){var n=document.createElementNS(NS,tag);for(var k in attrs)n.setAttribute(k,attrs[k]);if(parent)parent.appendChild(n);return n;}
function hoy(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function grietasGuardadas(){try{var g=JSON.parse(localStorage.getItem('innova_nv_grietas')||'{}');return g.d===hoy()?g.n|0:0;}catch(e){return 0;}}
function guardarGrietas(n){try{localStorage.setItem('innova_nv_grietas',JSON.stringify({d:hoy(),n:n}));}catch(e){}}
// grietas fijas (en la pared derecha, a media altura), cada golpe agrega la siguiente
var GRIETAS=[
  'M628 515l-44 -30 -26 -48 -8 -40M584 485l-60 10 -40 -14M628 515l-38 44 -12 56 10 40M590 559l-56 -6',
  'M628 515l18 -64 -14 -50 10 -36M646 451l40 -18M628 515l26 54 -8 46M654 569l26 26',
  'M600 420l-60 -70 -18 -60M540 350l-70 -10M560 380l-40 40',
  'M612 600l-70 50 -20 70M542 650l-66 -16M590 616l10 76'];

function create(mount,actor,opts){
  var prefix=opts?.idPrefix||'';
  var hielo=mount.querySelector('.nv-hielo-fijo svg'),svg=actor.svg;if(!hielo||!svg)return null;
  var q=function(id){return hielo.querySelector('[id="'+prefix+id+'"]');};
  var cuerpo=q('nvice-body'),escarcha=q('nvice-frost-body'),bloque=mount.querySelector('.nv-hielo-fijo');
  var capa=el('g',{'class':'nv-hielo-gestos','aria-hidden':'true',fill:'none','stroke-linecap':'round','stroke-linejoin':'round'},hielo);
  if(q('nvice-melt'))capa.setAttribute('clip-path','url(#'+prefix+'nvice-melt)');   // nada se sale del hielo que queda
  var grietas=el('g',{stroke:'#f6fdff','stroke-width':'6',opacity:'.9'},capa);
  var defs=hielo.querySelector('defs')||el('defs',{},hielo);
  var gid=prefix+'nvhg-vaho',mid=prefix+'nvhg-hueco';
  var rg=el('radialGradient',{id:gid},defs);el('stop',{offset:'0','stop-color':'#f4fcff','stop-opacity':'.92'},rg);el('stop',{offset:'.6','stop-color':'#e6f7ff','stop-opacity':'.6'},rg);el('stop',{offset:'1','stop-color':'#e6f7ff','stop-opacity':'0'},rg);
  var mascara=el('mask',{id:mid,maskUnits:'userSpaceOnUse',x:'0',y:'0',width:'800',height:'1067'},defs);
  el('rect',{x:'0',y:'0',width:'800',height:'1067',fill:'#fff'},mascara);var hueco=el('circle',{cx:'466',cy:'334',r:'0',fill:'#000'},mascara);
  var n=grietasGuardadas();pintarGrietas();
  var vivo=null,raf=0,ult=0;
  function pintarGrietas(){grietas.innerHTML='';for(var i=0;i<Math.min(n,GRIETAS.length);i++)el('path',{d:GRIETAS[i]},grietas);}
  function topeHielo(){try{return cuerpo.getBBox().y;}catch(e){return 0;}}
  function puede(nombre){return !GESTOS[nombre]||topeHielo()<ALTURA[nombre];}
  // posición de la mano derecha en coordenadas del SVG del hielo
  function mano(){var h=svg.querySelector('[id="'+prefix+'hand-right"]')?.getScreenCTM?.(),m=hielo.getScreenCTM?.();if(!h||!m)return null;
    var p=new DOMPoint(h.e,h.f).matrixTransform(m.inverse());return {x:p.x,y:p.y};}
  function sacude(){if(!bloque)return;bloque.classList.remove('nv-hielo-sacudon');void bloque.getBoundingClientRect();bloque.classList.add('nv-hielo-sacudon');setTimeout(function(){bloque.classList.remove('nv-hielo-sacudon');},650);}
  function limpiarVivo(){if(raf)cancelAnimationFrame(raf);raf=0;if(vivo){vivo.g.remove();if(vivo.mascara){cuerpo?.removeAttribute('mask');escarcha?.removeAttribute('mask');hueco.setAttribute('r','0');}}vivo=null;}
  function empezar(nombre){
    limpiarVivo();if(!GESTOS[nombre])return;
    var g=el('g',{},capa);vivo={nombre:nombre,g:g,t0:performance.now(),hecho:{}};
    if(nombre==='icedraw'){vivo.vaho=el('ellipse',{cx:'510',cy:'468',rx:'0',ry:'0',fill:'url(#'+gid+')'},g);
      vivo.trazo=el('path',{d:'',stroke:'#4f84a8','stroke-width':'13',opacity:'.7'},g);vivo.puntos=[];}
    if(nombre==='icescrape'){vivo.mascara=true;cuerpo?.setAttribute('mask','url(#'+mid+')');escarcha?.setAttribute('mask','url(#'+mid+')');
      vivo.borde=el('circle',{cx:'466',cy:'334',r:'0',stroke:'#f4fcff','stroke-width':'6','stroke-dasharray':'6 7',opacity:'.95'},g);vivo.virutas=[];}
    if(nombre==='icesneeze'){vivo.nube=el('ellipse',{cx:'404',cy:'438',rx:'0',ry:'0',fill:'url(#'+gid+')'},g);vivo.copos=[];}
    if(nombre==='icepunch')vivo.polvo=[];
    if(!raf)raf=requestAnimationFrame(paso);
  }
  function paso(now){
    raf=0;if(!vivo||!mount.isConnected)return;raf=requestAnimationFrame(paso);
    if(now-ult<31)return;ult=now;var t=(now-vivo.t0)/1000,g=vivo.g,k=vivo.nombre;
    if(k==='icedraw'){
      var v=seg(t,.9,1.5)*(1-seg(t,5.9,6.6));vivo.vaho.setAttribute('rx',(100*v).toFixed(1));vivo.vaho.setAttribute('ry',(94*v).toFixed(1));
            // la carita se dibuja con el trazo planeado (el mismo que sigue la mano), hasta donde va el dedo
      if(t>2.3){var u=cl((t-2.3)/3,0,1),l=GreenActor.trazoHielo(u).l,P=GreenActor.TRAZO_HIELO.pts,d='';
        for(var i=0;i<P.length&&P[i].l<=l;i++)d+=(P[i].pluma?' L':' M')+P[i].x.toFixed(1)+' '+P[i].y.toFixed(1);
        var z=GreenActor.trazoHielo(u);if(z.pluma&&u<1)d+=' L'+z.x.toFixed(1)+' '+z.y.toFixed(1);vivo.trazo.setAttribute('d',d);}
      vivo.trazo.setAttribute('opacity',(.7*(1-seg(t,5.9,6.6))).toFixed(3));
      if(t>6.6)return terminar();
    }else if(k==='icescrape'){
      var r=30*seg(t,.9,2.4)*(1-seg(t,4.9,5.6));hueco.setAttribute('r',r.toFixed(1));vivo.borde.setAttribute('r',(r+1.5).toFixed(1));
      if(t>.9&&t<2.4&&vivo.virutas.length<14&&Math.random()<.5){var c=el('circle',{cx:(466+Math.random()*40-20).toFixed(1),cy:'362',r:(3+Math.random()*3).toFixed(1),fill:'#f6fdff'},g);c.__t=t;vivo.virutas.push(c);}
      vivo.virutas.forEach(function(c){var d=t-c.__t;c.setAttribute('transform','translate(0 '+(d*d*160).toFixed(1)+')');c.setAttribute('opacity',(1-cl(d/1.2,0,1)).toFixed(2));});
      if(t>5.6)return terminar();
    }else if(k==='icepunch'){
      if(t>.95&&!vivo.hecho.golpe){vivo.hecho.golpe=1;sacude();if(n<GRIETAS.length){n++;guardarGrietas(n);pintarGrietas();var nueva=grietas.lastChild;if(nueva){var L=400;nueva.setAttribute('stroke-dasharray',L);nueva.setAttribute('stroke-dashoffset',L);vivo.nueva=nueva;}}
        for(var i=0;i<26;i++){var p=el('circle',{cx:(480+Math.random()*170).toFixed(1),cy:(100+Math.random()*120).toFixed(1),r:(3+Math.random()*4).toFixed(1),fill:'#f6fdff'},g);p.__v=60+Math.random()*120;vivo.polvo.push(p);}}
      if(vivo.nueva)vivo.nueva.setAttribute('stroke-dashoffset',(400*(1-seg(t,.95,1.25))).toFixed(1));
      vivo.polvo.forEach(function(p){var d=Math.max(0,t-.95);p.setAttribute('transform','translate('+(Math.sin(d*5+p.__v)*6).toFixed(1)+' '+(d*p.__v+d*d*120).toFixed(1)+')');p.setAttribute('opacity',(1-seg(t,2.4,3.6)).toFixed(2));});
      if(t>3.8)return terminar();
    }else if(k==='icesneeze'){
      if(t>2.4&&!vivo.hecho.achu){vivo.hecho.achu=1;sacude();for(var j=0;j<30;j++){var s=el('circle',{cx:(180+Math.random()*440).toFixed(1),cy:(80+Math.random()*80).toFixed(1),r:(3+Math.random()*4).toFixed(1),fill:'#ffffff'},g);s.__v=40+Math.random()*70;vivo.copos.push(s);}}
      var b=seg(t,2.4,2.75)*(1-seg(t,3.6,4.6));vivo.nube.setAttribute('rx',(150*b).toFixed(1));vivo.nube.setAttribute('ry',(105*b).toFixed(1));vivo.nube.setAttribute('cy',(438+12*seg(t,2.4,3.4)).toFixed(1));
      vivo.copos.forEach(function(s){var d=Math.max(0,t-2.4);s.setAttribute('transform','translate('+(Math.sin(d*3+s.__v)*10).toFixed(1)+' '+(d*s.__v).toFixed(1)+')');s.setAttribute('opacity',(1-seg(t,3.6,4.8)).toFixed(2));});
      if(t>4.8)return terminar();
    }
  }
  function terminar(){limpiarVivo();}
  function onScene(e){var nombre=e.detail?.name;if(GESTOS[nombre])empezar(nombre);else if(vivo&&!GESTOS[nombre])limpiarVivo();}
  svg.addEventListener('greenactor:scenechange',onScene);
  return {puede:puede,destroy:function(){svg.removeEventListener('greenactor:scenechange',onScene);limpiarVivo();capa.remove();rg.remove();mascara.remove();}};
}
window.NavidadHieloGestos={create:create,GESTOS:GESTOS};
})();
