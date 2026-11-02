/* Hielo de Pre-Navidad: ilustración SVG vectorial, sin imágenes rasterizadas.
   Entre el 1 y el 21 de diciembre baja el nivel de hielo. */
(function(){
'use strict';
var SVG_NS='http://www.w3.org/2000/svg';
function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function create(day){
  var host=document.createElement('div');
  host.className='nv-mascota-hielo';host.setAttribute('aria-hidden','true');
  var doc=[
'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1067" preserveAspectRatio="xMidYMid meet">',
'<defs>',
'<linearGradient id="nvice-fill" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="#ecfdff" stop-opacity=".92"/><stop offset=".21" stop-color="#a2e3fb" stop-opacity=".48"/><stop offset=".47" stop-color="#9bdbf4" stop-opacity=".31"/><stop offset=".78" stop-color="#6dc6ef" stop-opacity=".48"/><stop offset="1" stop-color="#d9faff" stop-opacity=".85"/></linearGradient>',
'<linearGradient id="nvice-edge" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5ffff"/><stop offset=".48" stop-color="#6bc1e5"/><stop offset="1" stop-color="#e7ffff"/></linearGradient>',
'<linearGradient id="nvice-shine" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>',
'<clipPath id="nvice-level"><path id="nvice-mask" d="M0 0 H800 V1067 H0Z"/></clipPath>',
'</defs>',
'<g id="nv-ice-block" clip-path="url(#nvice-level)">',
'<path d="M383 38L435 46L486 114L559 180L594 283L614 375L599 540L602 696L579 870L535 1018L278 1018L234 944L205 823L193 667L201 492L186 351L209 245L286 141L342 69Z" fill="url(#nvice-fill)" stroke="url(#nvice-edge)" stroke-width="18" stroke-linejoin="round"/>',
'<path d="M342 69L292 182L256 360L234 531L252 777L278 1014" fill="none" stroke="#fff" stroke-opacity=".61" stroke-width="12" stroke-linecap="round"/>',
'<path d="M483 118L552 231L577 388L560 637L535 971" fill="none" stroke="#66bada" stroke-opacity=".48" stroke-width="15" stroke-linecap="round"/>',
'<path d="M290 192L370 126L356 348L284 450Z" fill="url(#nvice-shine)" opacity=".75"/>',
'<path d="M523 214L558 353L539 512L496 400Z" fill="#e7ffff" opacity=".29"/>',
'<path d="M224 557L289 514L315 708L242 790Z" fill="#e9ffff" opacity=".24"/>',
'<path d="M433 773L542 678L526 930L475 985Z" fill="#edffff" opacity=".23"/>',
'<path d="M382 65L407 103L392 203" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="5" stroke-linecap="round"/>',
'<path d="M262 393L288 414L307 393M552 465L523 484L507 467M248 841L270 850L279 888" fill="none" stroke="#f5ffff" stroke-width="6" opacity=".8" stroke-linecap="round"/>',
'<g id="nv-ice-cracks" stroke="#eaffff" stroke-width="4.8" stroke-linejoin="round" stroke-linecap="round" fill="none">',
'<path d="M427 217L445 282L414 330L461 382L439 429M445 282L492 306L510 336M414 330L390 353"/>',
'<path d="M242 510L290 555L281 610L321 659M290 555L327 543L353 565M281 610L256 644"/>',
'<path d="M565 718L526 754L542 814L501 847M526 754L487 741"/>',
'</g>',
'<path d="M231 970Q332 1033 528 970" fill="none" stroke="#f5ffff" opacity=".67" stroke-width="8" stroke-linecap="round"/>',
'</g>',
'<g class="nv-hielo-agua" id="nv-ice-water">',
'<ellipse cx="398" cy="1012" rx="179" ry="28" fill="#8edbf6" opacity=".35"/>',
'<ellipse cx="397" cy="1011" rx="119" ry="12" fill="none" stroke="#e8ffff" stroke-width="5" opacity=".85"/>',
'<path d="M306 1013Q394 1036 498 1010" fill="none" stroke="#fff" stroke-opacity=".64" stroke-width="4"/>',
'<path class="nv-hielo-gota nv-hielo-gota-a" d="M264 548Q251 566 262 585Q276 593 281 579Q283 566 264 548Z" fill="#bcf5ff" stroke="#fff" stroke-width="3"/>',
'<path class="nv-hielo-gota nv-hielo-gota-b" d="M547 744Q536 759 541 772Q554 780 560 767Q560 755 547 744Z" fill="#d6f8ff" stroke="#fff" stroke-width="3"/>',
'</g>',
'<g class="nv-hielo-chispas"><path d="M600 226v32m-16-16h32" stroke="#e3ffff" stroke-width="4" stroke-linecap="round"/><path d="M203 405v21m-10-11h21" stroke="#f4ffff" stroke-width="3" stroke-linecap="round"/></g>',
'</svg>'].join('');
  host.innerHTML=doc;
  var mask=host.querySelector('#nv-ice-mask');
  var cracks=host.querySelector('#nv-ice-cracks');
  var water=host.querySelector('#nv-ice-water');
  var animationTimer=0;
  function update(d){
    d=clamp(Math.round(Number(d)||1),1,21);
    var progress=(d-1)/20;
    var amount=1-.85*Math.pow(progress,1.12);
    var y=Math.round((1-amount)*1067);
    // El borde del hielo se derrite irregularmente: no es un simple rectángulo.
    mask.setAttribute('d','M0 '+y+' Q92 '+(y-11)+' 182 '+(y+7)+' T401 '+(y-4)+' T614 '+(y+5)+' T800 '+y+' L800 1067 L0 1067 Z');
    cracks.setAttribute('opacity',String(clamp((progress-.1)*1.28,.06,.9)));
    water.setAttribute('opacity',String(clamp(progress*1.1,0,.95)));
    host.dataset.dia=String(d);
    host.dataset.derretido=String(Math.round(progress*100));
    host.style.setProperty('--nv-progreso',String(progress));
  }
  function touch(){
    host.classList.remove('nv-hielo-golpe');void host.offsetWidth;
    host.classList.add('nv-hielo-golpe');
    clearTimeout(animationTimer);
    animationTimer=setTimeout(function(){host.classList.remove('nv-hielo-golpe');},650);
  }
  update(day);
  return {node:host,update:update,touch:touch,destroy:function(){clearTimeout(animationTimer);host.remove();}};
}
window.NavidadHielo={create:create};
})();