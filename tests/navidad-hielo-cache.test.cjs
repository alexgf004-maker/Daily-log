const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/navidad-hielo.js'),'utf8');
function fixture(){
 const images=[],draws=[],classes=new Set();let resize,disconnected=false;
 function el(name,attrs={}){return {name,attrs:{...attrs},children:[],setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]||null},appendChild(c){this.children.push(c)},cloneNode(){const c=el(this.name,this.attrs);c.children=this.children.map(n=>n.cloneNode());return c},remove(){this.removed=true}}}
 const canvas={width:0,height:0,getContext:()=>({clearRect(){},drawImage(img,x,y,w,h){draws.push({img,w,h})}}),toDataURL:()=> 'data:image/png;base64,resultado'};
 const doc={hidden:false,createElement:()=>canvas,createElementNS:(_,name)=>el(name)};
 const defs=el('defs');defs.appendChild(el('filter',{id:'nvice-grain'}));
 const svg={querySelector:()=>defs};
 const frost=el('path',{d:'M0 0L100 0L100 100Z',fill:'url(#nvice-frost)',filter:'url(#nvice-grain)',opacity:'.92'});
 frost.ownerSVGElement=svg;let bitmap;frost.parentNode={insertBefore:n=>bitmap=n};
 const node={ownerDocument:doc,classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},querySelectorAll:()=>[],getBoundingClientRect:()=>({width:240,height:320})};
 function serialize(e){return '<'+e.name+Object.entries(e.attrs).map(([k,v])=>' '+k+'="'+v+'"').join('')+'>'+e.children.map(serialize).join('')+'</'+e.name+'>'}
 const ctx={document:doc,Image:class{constructor(){images.push(this)}},XMLSerializer:class{serializeToString(e){return serialize(e)}},ResizeObserver:class{constructor(fn){resize=fn}observe(){}disconnect(){disconnected=true}},encodeURIComponent,requestAnimationFrame(){throw Error('El caché no debe tener bucle RAF')}};
 ctx.window=ctx;ctx.devicePixelRatio=3;vm.createContext(ctx);vm.runInContext(source,ctx);
 return {cache:ctx.NavidadHielo.cacheFrost(node,frost),doc,canvas,images,draws,classes,frost,get bitmap(){return bitmap},resize:()=>resize(),get disconnected(){return disconnected}};
}
test('la escarcha conserva geometría/filtro/opacidad, se hornea una vez y limita DPR a 1.5',()=>{
 const f=fixture();f.cache.refresh();assert.equal(f.images.length,1);
 const svg=decodeURIComponent(f.images[0].src.split(',')[1]);
 assert.match(svg,/viewBox="0 0 800 1067"/);assert.match(svg,/filter="url\(#nvice-grain\)"/);assert.match(svg,/opacity="\.92"/);
 assert.match(svg,/d="M0 0L100 0L100 100Z"/);
 f.cache.refresh();assert.equal(f.images.length,1,'no decodificar dos veces la misma petición');
 f.images[0].onload();assert.equal(f.draws.length,1);assert.equal(f.draws[0].w,360);assert.equal(f.draws[0].h,480);
 assert.ok(f.classes.has('nv-escarcha-cache'));assert.match(f.bitmap.attrs.href,/^data:image\/png/);
 f.cache.refresh();f.resize();assert.equal(f.images.length,1);assert.equal(f.canvas.width,1);assert.equal(f.canvas.height,1);
});
test('invalidar o destruir descarta imágenes tardías y conserva el vector de respaldo',()=>{
 const f=fixture();f.cache.refresh();f.cache.invalidate();f.images[0].onload();
 assert.equal(f.draws.length,0);assert.equal(f.classes.has('nv-escarcha-cache'),false);
 f.frost.attrs.d='M0 0L30 0L30 30Z';f.cache.refresh();f.images[1].onload();assert.equal(f.draws.length,1);
 f.cache.invalidate();f.cache.refresh();f.cache.destroy();f.images[2].onload();
 assert.equal(f.draws.length,1);assert.equal(f.bitmap.removed,true);assert.equal(f.disconnected,true);
 assert.equal(f.classes.has('nv-escarcha-cache'),false);f.cache.refresh();assert.equal(f.images.length,3);
});
test('ocultar cancela el horneado pendiente y no crea superficies mientras no se ve',()=>{
 const f=fixture();f.cache.refresh();f.cache.setVisible(false);f.images[0].onload();
 f.cache.refresh();assert.equal(f.images.length,1);assert.equal(f.draws.length,0);
 f.cache.setVisible(true);assert.equal(f.images.length,2);f.images[1].onload();
 f.doc.hidden=true;f.cache.invalidate();f.cache.refresh();assert.equal(f.images.length,2);
 f.doc.hidden=false;f.cache.refresh();f.images[2].onerror();assert.equal(f.classes.has('nv-escarcha-cache'),false);
 f.cache.refresh();assert.equal(f.images.length,4);
});
