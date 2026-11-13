// ── Ilustraciones del encabezado de la imagen de Programación en Navidad ──
// Pre-Navidad (13–30 nov): paisaje de Nochebuena (casita roja con foquitos, árbol grande, muñeco de nieve, trineo,
//   bastones de caramelo, cerca con luces, faroles, pueblito con iglesia, luna; Santa la cruza, lo dibuja index.html).
// Navidad en casa (1–26 dic): la sala por dentro (ventana nevada con cortinas y guirnalda, árbol con regalos y tren,
//   chimenea encendida con las botitas, velas y reloj, leche y galletas «Para Santa», sillón, flor de pascua, gatito).
// Son SVG que se arman al ancho que necesita la imagen (WT = ancho en unidades de 520 de alto): si la programación es
// larga y la imagen sale más ancha, la escena se extiende hacia la izquierda (más cielo, lomas, pueblo o pared) en vez
// de estirarse. Lo de la derecha (la escena principal) queda igual; lo de la izquierda queda libre para el texto.
// index.html lo importa solo al generar la imagen en esas etapas (no se descarga el resto del año).
// ilustracion(etapa, W, H) → Promise<Image|null> (null si no se pudo dibujar: index.html pone un fondo liso).
function paisaje(WT){ WT=Math.max(1620,WT||1620); let s=17; const R=()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; };
  const W=1620, H=520, X0=1620-WT, f=n=>n.toFixed(1); let o=[];
  const COL=['#ff4d5e','#ffd166','#3ddc84','#4cc3ff','#ff7ad9'];
  const defs=`<defs>
  <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050c24"/><stop offset=".55" stop-color="#11265a"/><stop offset=".85" stop-color="#2a4a86"/><stop offset="1" stop-color="#4a6aa6"/></linearGradient>
  <radialGradient id="halo"><stop offset="0" stop-color="#fff6dc" stop-opacity=".55"/><stop offset=".35" stop-color="#cfe0ff" stop-opacity=".18"/><stop offset="1" stop-color="#cfe0ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="luna" cx=".42" cy=".38" r=".65"><stop offset="0" stop-color="#fffdf2"/><stop offset=".7" stop-color="#f6ecd2"/><stop offset="1" stop-color="#e2d2ac"/></radialGradient>
  <linearGradient id="loma1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ea6d4"/><stop offset="1" stop-color="#5d78ad"/></linearGradient>
  <linearGradient id="loma2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3d3f0"/><stop offset="1" stop-color="#8aa2cf"/></linearGradient>
  <linearGradient id="loma3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef4ff"/><stop offset=".6" stop-color="#cfdcf3"/><stop offset="1" stop-color="#b3c4e6"/></linearGradient>
  <linearGradient id="nieveTecho" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#e8f0fc"/><stop offset="1" stop-color="#b9cbe8"/></linearGradient>
  <linearGradient id="pared" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8e1420"/><stop offset=".5" stop-color="#b51e2c"/><stop offset="1" stop-color="#8a1220"/></linearGradient>
  <linearGradient id="paredS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6a0d18"/><stop offset="1" stop-color="#7d1220"/></linearGradient>
  <linearGradient id="tejado" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2018"/><stop offset="1" stop-color="#2a100c"/></linearGradient>
  <radialGradient id="ventana" cx=".5" cy=".55" r=".7"><stop offset="0" stop-color="#fff3c4"/><stop offset=".55" stop-color="#ffc35a"/><stop offset="1" stop-color="#e88a2a"/></radialGradient>
  <radialGradient id="charco" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb050" stop-opacity="0"/></radialGradient>
  <radialGradient id="glowC" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="#ffe6a8" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
  ${COL.map((c,i)=>`<radialGradient id="g${i}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${c}" stop-opacity=".9"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('')}
  <linearGradient id="pinoL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1f6b43"/><stop offset=".55" stop-color="#145a36"/><stop offset="1" stop-color="#0b3a22"/></linearGradient>
  <linearGradient id="pinoLejos" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a6a7a"/><stop offset="1" stop-color="#28505e"/></linearGradient>
  <radialGradient id="bola" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".25" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <linearGradient id="caramelo" x1="0" y1="0" x2="10" y2="10" spreadMethod="repeat" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e3263c"/><stop offset=".45" stop-color="#e3263c"/><stop offset=".5" stop-color="#fff"/><stop offset=".95" stop-color="#fff"/></linearGradient>
  <filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter><filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter><filter id="blur14"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="grano" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .05 0"/></filter>
  <filter id="sombra" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0a1840" flood-opacity=".35"/></filter>
  </defs>`;
  o.push(`<rect x="${X0}" width="${W-X0}" height="${H}" fill="url(#cielo)"/>`);
  // estrellas con destello
  for(let i=0;i<Math.round(260*(W-X0)/W);i++){ const x=X0+R()*(W-X0), y=R()*300, r=R()*1.3+.3, a=.35+R()*.65; o.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#fff" opacity="${f(a)}"/>`); }
  for(let i=0;i<14;i++){ const x=380+R()*1200, y=20+R()*200, l=5+R()*6; o.push(`<g opacity=".85" stroke="#fff" stroke-width="1" stroke-linecap="round"><path d="M${f(x-l)} ${f(y)}H${f(x+l)}M${f(x)} ${f(y-l)}V${f(y+l)}"/></g><circle cx="${f(x)}" cy="${f(y)}" r="1.8" fill="#fff"/>`); }
  // luna
  o.push(`<circle cx="1232" cy="82" r="150" fill="url(#halo)"/><circle cx="1232" cy="82" r="44" fill="url(#luna)"/>`);
  [[-14,-10,9],[12,8,11],[-4,18,6],[16,-16,5],[-20,12,4]].forEach(([a,b,r])=>o.push(`<circle cx="${1232+a}" cy="${82+b}" r="${r}" fill="#d8c7a0" opacity=".35"/>`));
  const pino=(x,y,h,opts={})=>{ const w=h*.46; let g=`<g filter="url(#sombra)">`;
    g+=`<rect x="${f(x-h*.035)}" y="${f(y-h*.08)}" width="${f(h*.07)}" height="${f(h*.1)}" fill="#4a2a18"/>`;
    for(let k=0;k<5;k++){ const t=k/4, yy=y-h+k*h*.17, ww=w*(.28+t*.72), hh=h*.3; const base=yy+hh;
      let d=`M${f(x)} ${f(yy)}C${f(x+ww*.3)} ${f(yy+hh*.4)} ${f(x+ww*.7)} ${f(base-hh*.2)} ${f(x+ww)} ${f(base)}`;
      const n=5; for(let i=n;i>=0;i--){ const xx=x-ww+i*2*ww/n; d+=` Q${f(xx+ww/n)} ${f(base+hh*.12)} ${f(xx)} ${f(base)}`; } d+=` C${f(x-ww*.7)} ${f(base-hh*.2)} ${f(x-ww*.3)} ${f(yy+hh*.4)} ${f(x)} ${f(yy)}Z`;
      g+=`<path d="${d}" fill="url(#pinoL)"/>`;
      // nieve sobre la capa
      let dn=`M${f(x-ww*.86)} ${f(base-hh*.08)}`; for(let i=0;i<=6;i++){ const xx=x-ww*.86+i*ww*1.72/6; dn+=` Q${f(xx-ww*.07)} ${f(base-hh*.28-(i%2)*hh*.06)} ${f(xx)} ${f(base-hh*.12-(i%2?0:hh*.05))}`; }
      dn+=` L${f(x+ww*.86)} ${f(base-hh*.02)} Q${f(x)} ${f(base-hh*.18)} ${f(x-ww*.86)} ${f(base-hh*.02)}Z`; g+=`<path d="${dn}" fill="url(#nieveTecho)" opacity=".95"/>`;
      g+=`<path d="M${f(x)} ${f(yy)}C${f(x+ww*.3)} ${f(yy+hh*.4)} ${f(x+ww*.7)} ${f(base-hh*.2)} ${f(x+ww)} ${f(base)}L${f(x+ww*.3)} ${f(base)}Z" fill="#06261a" opacity=".25"/>`; }
    g+=`<path d="M${f(x)} ${f(y-h-2)}L${f(x+w*.12)} ${f(y-h+h*.1)}Q${f(x)} ${f(y-h+h*.07)} ${f(x-w*.12)} ${f(y-h+h*.1)}Z" fill="#fff"/>`;
    if(opts.luces){ const lu=[]; for(let i=0;i<opts.luces;i++){ const t=.12+.85*i/opts.luces, yy=y-h+t*h*.95, ww=w*(.2+t*.78)*.9, xx=x+Math.sin(i*2.1)*ww; lu.push([xx,yy,i%5]); }
      if(opts.guirnalda) for(let k=0;k<4;k++){ const t0=.2+k*.19, t1=t0+.14, y0=y-h+t0*h, y1=y-h+t1*h, w0=w*(.2+t0*.78)*.88, w1=w*(.2+t1*.78)*.88; g+=`<path d="M${f(x-w0)} ${f(y0)}Q${f(x)} ${f((y0+y1)/2+18)} ${f(x+w1)} ${f(y1)}" stroke="#f2c45a" stroke-width="2.4" fill="none" opacity=".95"/>`; }
      lu.forEach(([xx,yy,c])=>{ g+=`<circle cx="${f(xx)}" cy="${f(yy)}" r="9" fill="url(#g${c})"/><circle cx="${f(xx)}" cy="${f(yy)}" r="2.6" fill="${COL[c]}"/><circle cx="${f(xx-.8)}" cy="${f(yy-.8)}" r=".9" fill="#fff" opacity=".9"/>`; }); }
    if(opts.bolas) for(let i=0;i<opts.bolas;i++){ const t=.18+.75*R(), yy=y-h+t*h*.95, ww=w*(.2+t*.78)*.8, xx=x+(R()*2-1)*ww, c=['#c81f35','#e3ad38','#c9d6e6','#2a6ad4'][i%4], r=3.4+R()*2.2; g+=`<circle cx="${f(xx)}" cy="${f(yy)}" r="${f(r)}" fill="${c}"/><circle cx="${f(xx)}" cy="${f(yy)}" r="${f(r)}" fill="url(#bola)"/>`; }
    if(opts.estrella){ const sx=x, sy=y-h-6; g+=`<circle cx="${sx}" cy="${sy}" r="38" fill="url(#glowC)"/>`; let d=''; for(let i=0;i<10;i++){ const rr=i%2?5.5:13, a=-Math.PI/2+i*Math.PI/5; d+=(i?'L':'M')+f(sx+Math.cos(a)*rr)+' '+f(sy+Math.sin(a)*rr); } g+=`<path d="${d}Z" fill="#ffd35a" stroke="#c58a1c" stroke-width="1"/>`; }
    return g+'</g>'; };
  // lomas lejanas con pueblito
  const loma=(y,amp,fill,seed)=>{ let d=`M${X0} ${H}L${X0} ${y}`; for(let x=X0;x<=W;x+=60){ d+=` Q${x+30} ${f(y-amp*Math.sin((x+seed)/170)-amp*.4)} ${x+60} ${f(y-amp*Math.sin((x+60+seed)/170))}`; } return `<path d="${d} L${W} ${H}Z" fill="${fill}"/>`; };
  o.push(loma(318,14,'url(#loma1)',40));
  // pueblito: casitas con ventanas encendidas e iglesia
  const casitaL=(x,y,w,h,col)=>{ const r=h*.7; let g=`<g><rect x="${x}" y="${y-h}" width="${w}" height="${h}" fill="${col}"/><path d="M${x-3} ${y-h}L${x+w/2} ${y-h-r}L${x+w+3} ${y-h}Z" fill="#e9f0fc"/><path d="M${x+w/2} ${y-h-r}L${x+w+3} ${y-h}L${x+w/2} ${y-h}Z" fill="#c3d2ec"/>`;
    for(let i=0;i<Math.max(1,Math.floor(w/9));i++) g+=`<rect x="${f(x+3+i*9)}" y="${f(y-h*.68)}" width="4" height="5" fill="#ffd27a"/><circle cx="${f(x+5+i*9)}" cy="${f(y-h*.6)}" r="7" fill="url(#charco)" opacity=".7"/>`;
    return g+'</g>'; };
  [[400,312,22,14,'#5a3a5a'],[430,309,18,12,'#2a4a6a'],[468,314,26,16,'#7a2a3a'],[520,310,20,13,'#3a5a3a'],[700,313,24,15,'#7a2a3a'],[740,309,18,12,'#2a4a6a'],[790,312,22,14,'#8a5a2a'],[840,308,20,13,'#5a3a5a'],[880,312,24,15,'#3a5a3a']].forEach(a=>o.push(casitaL(...a)));
  for(let x=340;x>X0+40;x-=110+R()*60){ const w=18+R()*10; o.push(casitaL(x,310+R()*6,w,w*.62,['#5a3a5a','#2a4a6a','#7a2a3a','#3a5a3a','#8a5a2a'][Math.floor(R()*5)])); }
  if(X0<-400){ for(let i=0;i<5;i++) o.push(pino(X0+120+R()*(-X0-200),372+R()*10,60+R()*40)); }
  // iglesia
  o.push(`<g><rect x="604" y="276" width="44" height="36" fill="#e8e0d0"/><path d="M600 276L626 258L652 276Z" fill="#f4f8ff"/><rect x="616" y="226" width="20" height="54" fill="#f0e8d8"/><path d="M613 226L626 200L639 226Z" fill="#f4f8ff"/><path d="M626 192V204M621 197H631" stroke="#e3ad38" stroke-width="2"/><rect x="622" y="236" width="8" height="12" rx="4" fill="#ffd27a"/><circle cx="626" cy="242" r="12" fill="url(#charco)"/><rect x="619" y="292" width="14" height="20" rx="7" fill="#ffc35a"/></g>`);
  // pinos lejanos
  const pinoSil=(x,y,h,fill,nieve)=>{ const w=h*.42; let d=''; for(let k=0;k<4;k++){ const yy=y-h+k*h*.22, ww=w*(.35+k*.22); d+=`M${f(x)} ${f(yy)}L${f(x+ww)} ${f(yy+h*.32)}L${f(x-ww)} ${f(yy+h*.32)}Z`; } return `<path d="${d}" fill="${fill}"/>`+(nieve?`<path d="M${f(x)} ${f(y-h)}L${f(x+w*.18)} ${f(y-h+h*.12)}L${f(x-w*.18)} ${f(y-h+h*.12)}Z" fill="#e9f0fc"/>`:''); };
  for(let i=0;i<Math.round(26+(1620-W-X0)/50);i++){ const x=Math.min(360,X0+60)+R()*(1260+Math.max(0,360-X0-60)), h=26+R()*24; o.push(pinoSil(x,330+R()*8,h,'url(#pinoLejos)',true)); }
  o.push(loma(352,10,'url(#loma2)',300));
  // pinos medios
  [[700,372,70],[760,376,90],[920,368,60],[960,374,80]].forEach(([x,y,h])=>o.push(pino(x,y,h)));
  o.push(loma(392,8,'url(#loma3)',600));
  // ── casita ──
  const cx=1330, by=458, hw=150, hp=150, apex=by-hp-118;
  // resplandor de las ventanas sobre la nieve
  o.push(`<ellipse cx="${cx}" cy="${by+18}" rx="230" ry="38" fill="url(#charco)"/>`);
  // muro lateral (perspectiva)
  o.push(`<path d="M${cx+hw} ${by}L${cx+hw+70} ${by-18}L${cx+hw+70} ${by-hp-14}L${cx+hw} ${by-hp}Z" fill="url(#paredS)"/>`);
  for(let y=by-hp+12;y<by;y+=14) o.push(`<path d="M${cx+hw} ${y}L${cx+hw+70} ${f(y-16+ (y-(by-hp))*0)}" stroke="#4a0810" stroke-opacity=".5" stroke-width="1.2"/>`);
  // frente
  o.push(`<path d="M${cx-hw} ${by}L${cx-hw} ${by-hp}L${cx} ${apex}L${cx+hw} ${by-hp}L${cx+hw} ${by}Z" fill="url(#pared)"/>`);
  for(let y=by-hp+12;y<by;y+=14) o.push(`<path d="M${cx-hw} ${y}H${cx+hw}" stroke="#6a0d18" stroke-opacity=".45" stroke-width="1.3"/>`);
  for(let k=1;k<9;k++){ const y=by-hp-k*13; const w=hw*(1-(by-hp-y)/(by-hp-apex)); if(w>4) o.push(`<path d="M${f(cx-w)} ${y}H${f(cx+w)}" stroke="#6a0d18" stroke-opacity=".45" stroke-width="1.3"/>`); }
  o.push(`<rect x="${cx-hw}" y="${by-hp}" width="8" height="${hp}" fill="#f6ead2"/><rect x="${cx+hw-8}" y="${by-hp}" width="8" height="${hp}" fill="#e8dcc0"/>`);
  // ventanita redonda del ático
  o.push(`<circle cx="${cx}" cy="${by-hp-50}" r="20" fill="url(#ventana)"/><circle cx="${cx}" cy="${by-hp-50}" r="20" fill="none" stroke="#f6ead2" stroke-width="5"/><path d="M${cx-20} ${by-hp-50}H${cx+20}M${cx} ${by-hp-70}V${by-hp-30}" stroke="#f6ead2" stroke-width="3"/>`);
  // chimenea de piedra
  const chx=cx+70; o.push(`<rect x="${chx}" y="${apex+10}" width="34" height="74" fill="#7a6a62"/>`); for(let r=0;r<6;r++) for(let c=0;c<3;c++) o.push(`<rect x="${f(chx+1+c*11+(r%2)*5)}" y="${apex+12+r*12}" width="10" height="10" rx="2" fill="${['#8a7a72','#6e5e56','#94847a'][(r+c)%3]}"/>`);
  o.push(`<path d="M${chx-4} ${apex+12}Q${chx+17} ${apex-2} ${chx+38} ${apex+12}Q${chx+17} ${apex+6} ${chx-4} ${apex+12}Z" fill="url(#nieveTecho)"/>`);
  // humo
  o.push(`<path d="M${chx+17} ${apex}C${chx+5} ${apex-30} ${chx+40} ${apex-50} ${chx+22} ${apex-85}C${chx+10} ${apex-110} ${chx+50} ${apex-125} ${chx+40} ${apex-160}" stroke="#dfe8f8" stroke-width="16" stroke-linecap="round" fill="none" opacity=".22" filter="url(#blur6)"/>`);
  // techo: alero con tejas y nieve gruesa con goteos
  const techo=(x0,y0,x1,y1)=>{ o.push(`<path d="M${x0} ${y0}L${x1} ${y1}L${x1+(x1>x0?12:-12)} ${y1+14}L${x0+(x1>x0?-6:6)} ${y0+14}Z" fill="url(#tejado)"/>`); };
  techo(cx,apex-6,cx+hw+22,by-hp+14); techo(cx,apex-6,cx-hw-22,by-hp+14);
  // nieve del techo
  let dn=`M${cx-hw-30} ${by-hp+10}L${cx} ${apex-24}L${cx+hw+30} ${by-hp+10}`; dn+=` Q${cx+hw+30} ${by-hp+24} ${cx+hw+14} ${by-hp+22}`;
  const go=[]; for(let i=0;i<=14;i++){ const u=i/14; go.push(u); }
  for(let i=14;i>=0;i--){ const u=i/14, x=cx+hw+14-u*(hw+14), y=by-hp+22-u*(by-hp-apex+30); const gota=i%3===1?10+R()*8:0; dn+=` Q${f(x+6)} ${f(y+6+gota)} ${f(x)} ${f(y+2)}`; }
  for(let i=0;i<=14;i++){ const u=i/14, x=cx-u*(hw+14), y=apex+8+u*(by-hp-apex+14); const gota=i%3===1?10+R()*8:0; dn+=` Q${f(x+6)} ${f(y+6+gota)} ${f(x)} ${f(y+2)}`; }
  dn+=` Q${cx-hw-30} ${by-hp+24} ${cx-hw-30} ${by-hp+10}Z`; o.push(`<path d="${dn}" fill="url(#nieveTecho)" filter="url(#sombra)"/>`);
  // nieve del techo lateral
  o.push(`<path d="M${cx+hw+30} ${by-hp+10}L${cx+hw+96} ${by-hp-6}L${cx+hw+96} ${by-hp+6}Q${cx+hw+60} ${by-hp+16} ${cx+hw+30} ${by-hp+22}Z" fill="#d6e2f5"/>`);
  // carámbanos
  for(let i=0;i<22;i++){ const u=(i+.5)/22, x=cx+hw+14-u*(hw+14)*0, xx=cx-hw-12+u*(2*hw+24); const L=8+R()*20; if(Math.abs(xx-cx)<hw+10){ const y=by-hp+20; o.push(`<path d="M${f(xx-3)} ${y}L${f(xx+3)} ${y}L${f(xx)} ${f(y+L)}Z" fill="#e6f4ff" opacity=".9"/>`); } }
  // foquitos en el alero (dos aguas) con brillo
  const foco=(x,y,i,k=1)=>`<circle cx="${f(x)}" cy="${f(y)}" r="${14*k}" fill="url(#g${i%5})"/><path d="M${f(x)} ${f(y-3*k)}C${f(x-4.5*k)} ${f(y-1*k)} ${f(x-4.5*k)} ${f(y+6*k)} ${f(x)} ${f(y+9*k)}C${f(x+4.5*k)} ${f(y+6*k)} ${f(x+4.5*k)} ${f(y-1*k)} ${f(x)} ${f(y-3*k)}Z" fill="${COL[i%5]}"/><rect x="${f(x-2*k)}" y="${f(y-5.5*k)}" width="${f(4*k)}" height="${f(3*k)}" fill="#3a4450"/><ellipse cx="${f(x-1.3*k)}" cy="${f(y+1.5*k)}" rx="${f(.9*k)}" ry="${f(2*k)}" fill="#fff" opacity=".75"/>`;
  let cable=`M${cx-hw-20} ${by-hp+30}`; const fo=[];
  for(let i=0;i<=20;i++){ const u=i/20, x=cx-hw-20+u*(2*hw+40), y=(u<.5? by-hp+30-(u*2)*(by-hp-apex+4) : apex+4+((u-.5)*2)*(by-hp-apex+26))+8; fo.push([x,y]); if(i) cable+=` Q${f((fo[i-1][0]+x)/2)} ${f((fo[i-1][1]+y)/2+7)} ${f(x)} ${f(y)}`; }
  o.push(`<path d="${cable}" stroke="#1b2430" stroke-width="1.6" fill="none"/>`); fo.forEach(([x,y],i)=>o.push(foco(x,y+4,i,1.15)));
  // ventanas con postigos, cortinas, corona y repisa nevada
  const ventana=(x,y)=>{ const w=50, h=56; o.push(`<ellipse cx="${x}" cy="${by+14}" rx="60" ry="14" fill="url(#charco)"/>`);
    o.push(`<rect x="${x-w/2-16}" y="${y-h/2}" width="13" height="${h}" fill="#1d5a36"/><rect x="${x+w/2+3}" y="${y-h/2}" width="13" height="${h}" fill="#1d5a36"/>`);
    for(let k=0;k<4;k++) o.push(`<path d="M${x-w/2-14} ${y-h/2+6+k*13}H${x-w/2-5}M${x+w/2+5} ${y-h/2+6+k*13}H${x+w/2+14}" stroke="#14462a" stroke-width="2"/>`);
    o.push(`<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" fill="url(#ventana)"/><circle cx="${x}" cy="${y}" r="46" fill="url(#charco)" opacity=".8"/>`);
    o.push(`<path d="M${x-w/2} ${y-h/2}Q${x-w/2+10} ${y} ${x-w/2+4} ${y+h/2}L${x-w/2} ${y+h/2}Z M${x+w/2} ${y-h/2}Q${x+w/2-10} ${y} ${x+w/2-4} ${y+h/2}L${x+w/2} ${y+h/2}Z" fill="#c8402a" opacity=".55"/>`);
    o.push(`<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" fill="none" stroke="#f6ead2" stroke-width="5"/><path d="M${x} ${y-h/2}V${y+h/2}M${x-w/2} ${y}H${x+w/2}" stroke="#f6ead2" stroke-width="3.5"/>`);
    o.push(`<path d="M${x-w/2-8} ${y+h/2+2}H${x+w/2+8}V${y+h/2+8}H${x-w/2-8}Z" fill="#f6ead2"/><path d="M${x-w/2-10} ${y+h/2+2}Q${x} ${y+h/2-9} ${x+w/2+10} ${y+h/2+2}Q${x} ${y+h/2+4} ${x-w/2-10} ${y+h/2+2}Z" fill="#fff"/>`);
    o.push(`<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="#1f6b45" stroke-width="7"/>`); for(let k=0;k<12;k++){ const a=k/12*Math.PI*2; o.push(`<circle cx="${f(x+Math.cos(a)*13)}" cy="${f(y+Math.sin(a)*13)}" r="3" fill="${k%3?'#2a8a5c':'#174d31'}"/>`); }
    o.push(`<path d="M${x-5} ${y+12}L${x} ${y+9}L${x+5} ${y+12}L${x+3} ${y+22}L${x} ${y+15}L${x-3} ${y+22}Z" fill="#d3172f"/><circle cx="${x}" cy="${y+11}" r="3" fill="#e3263c"/>`); };
  ventana(cx-90,by-hp+66); ventana(cx+90,by-hp+66);
  // puerta con corona y guirnalda con luces
  o.push(`<path d="M${cx-30} ${by}V${by-80}Q${cx} ${by-100} ${cx+30} ${by-80}V${by}Z" fill="#1d4a2e"/><path d="M${cx-30} ${by}V${by-80}Q${cx} ${by-100} ${cx+30} ${by-80}V${by}" fill="none" stroke="#f6ead2" stroke-width="5"/>`);
  o.push(`<path d="M${cx-18} ${by-6}V${by-40}M${cx+18} ${by-6}V${by-40}M${cx-18} ${by-46}V${by-72}M${cx+18} ${by-46}V${by-72}" stroke="#163b25" stroke-width="2"/><circle cx="${cx+20}" cy="${by-40}" r="3" fill="#e3ad38"/>`);
  o.push(`<circle cx="${cx}" cy="${by-58}" r="15" fill="none" stroke="#1f6b45" stroke-width="8"/>`); for(let k=0;k<14;k++){ const a=k/14*Math.PI*2; o.push(`<circle cx="${f(cx+Math.cos(a)*15)}" cy="${f(by-58+Math.sin(a)*15)}" r="3.4" fill="${k%3?'#2a8a5c':'#174d31'}"/>`); } [[-6,-10],[6,-12],[0,10]].forEach(([a,b])=>o.push(`<circle cx="${cx+a}" cy="${by-58+b}" r="2.6" fill="#d3172f"/>`)); o.push(`<path d="M${cx-6} ${by-44}L${cx} ${by-47}L${cx+6} ${by-44}L${cx+4} ${by-32}L${cx} ${by-40}L${cx-4} ${by-32}Z" fill="#d3172f"/>`);
  let gz=`M${cx-52} ${by-96}`; for(let i=1;i<=8;i++){ const x=cx-52+i*13; gz+=` Q${x-6.5} ${by-86+Math.sin(i)*2} ${x} ${by-96+ (i===4?0:0)}`; } o.push(`<path d="M${cx-52} ${by-96}Q${cx} ${by-70} ${cx+52} ${by-96}" stroke="#174d31" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${cx-52} ${by-96}Q${cx} ${by-70} ${cx+52} ${by-96}" stroke="#2a8a5c" stroke-width="4" fill="none" stroke-dasharray="3 5"/>`);
  for(let i=0;i<7;i++){ const u=(i+.5)/7, x=cx-52+u*104, y=by-96+Math.sin(u*Math.PI)*13+2; o.push(foco(x,y,i+2,.75)); }
  // escalones nevados y regalos en la entrada
  o.push(`<path d="M${cx-46} ${by}H${cx+46}V${by+8}H${cx-46}Z" fill="#6a4a32"/><path d="M${cx-50} ${by+1}Q${cx} ${by-6} ${cx+50} ${by+1}Q${cx} ${by+4} ${cx-50} ${by+1}Z" fill="#fff"/>`);
  const regalo=(x,y,w,h,c,cin,lazo)=>{ return `<g filter="url(#sombra)"><rect x="${f(x-w/2)}" y="${f(y-h)}" width="${w}" height="${h}" rx="1.5" fill="${c}"/><rect x="${f(x-w/2)}" y="${f(y-h)}" width="${f(w*.45)}" height="${h}" fill="#000" opacity=".12"/><rect x="${f(x-w*.07)}" y="${f(y-h)}" width="${f(w*.14)}" height="${h}" fill="${cin}"/><rect x="${f(x-w/2)}" y="${f(y-h*.62)}" width="${w}" height="${f(h*.14)}" fill="${cin}"/><path d="M${f(x)} ${f(y-h)}C${f(x-w*.45)} ${f(y-h-w*.35)} ${f(x-w*.5)} ${f(y-h+2)} ${f(x)} ${f(y-h)}C${f(x+w*.45)} ${f(y-h-w*.35)} ${f(x+w*.5)} ${f(y-h+2)} ${f(x)} ${f(y-h)}Z" fill="${lazo||cin}"/><path d="M${f(x-w/2-1)} ${f(y-h)}H${f(x+w/2+1)}" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></g>`; };
  o.push(regalo(cx-70,by+14,22,18,'#c81f35','#f2c45a'),regalo(cx-50,by+16,16,22,'#1f6b45','#fff'),regalo(cx+66,by+15,24,16,'#f2c45a','#c81f35'));
  // ── árbol grande ──
  o.push(`<ellipse cx="1060" cy="478" rx="110" ry="16" fill="#8aa0cc" opacity=".35"/><ellipse cx="1060" cy="470" rx="140" ry="40" fill="url(#charco)" opacity=".7"/>`);
  o.push(pino(1060,476,300,{luces:46,guirnalda:true,bolas:26,estrella:true}));
  o.push(regalo(1000,486,34,26,'#c81f35','#f2c45a'),regalo(1034,490,26,34,'#2a6ad4','#fff'),regalo(1094,488,38,24,'#f2c45a','#1f6b45'),regalo(1124,492,24,20,'#1f6b45','#c81f35'),regalo(1062,494,22,16,'#fff','#e3263c','#e3263c'));
  // pinos cercanos a los lados
  o.push(pino(1525,470,190,{bolas:0}),pino(1595,478,150),pino(890,468,150,{luces:22}),pino(840,476,110));
  // faroles con moño
  const farol=(x,y)=>`<g><circle cx="${x}" cy="${y-96}" r="40" fill="url(#glowC)"/><rect x="${x-3}" y="${y-90}" width="6" height="90" fill="#1a1d26"/><path d="M${x-12} ${y-88}H${x+12}L${x+9} ${y-112}H${x-9}Z" fill="#ffd88a"/><path d="M${x-12} ${y-88}H${x+12}M${x-9} ${y-112}H${x+9}M${x} ${y-112}V${y-88}" stroke="#1a1d26" stroke-width="2.5"/><path d="M${x-14} ${y-112}L${x} ${y-124}L${x+14} ${y-112}Z" fill="#1a1d26"/><path d="M${x-15} ${y-113}Q${x} ${y-128} ${x+15} ${y-113}Q${x} ${y-118} ${x-15} ${y-113}Z" fill="#fff"/><path d="M${x} ${y-80}C${x-14} ${y-90} ${x-16} ${y-72} ${x} ${y-80}C${x+14} ${y-90} ${x+16} ${y-72} ${x} ${y-80}Z" fill="#d3172f"/><path d="M${x-2} ${y-80}L${x-6} ${y-64}M${x+2} ${y-80}L${x+6} ${y-64}" stroke="#d3172f" stroke-width="3"/></g>`;
  o.push(farol(1190,486),farol(1478,490));
  // cerca nevada con foquitos
  let cer=''; for(let i=0;i<9;i++){ const x=1470+i*18; cer+=`<path d="M${x} ${492}V${466}L${x+4} ${461}L${x+8} ${466}V${492}Z" fill="#f6ead2" stroke="#c9b48e" stroke-width="1"/><ellipse cx="${x+4}" cy="${462}" rx="6" ry="3.5" fill="#fff"/>`; }
  cer+=`<rect x="1466" y="472" width="160" height="5" fill="#e8dcc0"/><rect x="1466" y="484" width="160" height="5" fill="#e8dcc0"/>`; o.push(cer);
  let cab2='M1466 470'; for(let i=0;i<9;i++) cab2+=` Q${1475+i*18} ${478} ${1484+i*18} ${470}`; o.push(`<path d="${cab2}" stroke="#1b2430" stroke-width="1.3" fill="none"/>`); for(let i=0;i<9;i++) o.push(foco(1475+i*18,477,i+1,.7));
  // muñeco de nieve
  const mx=1556, my=500; o.push(`<g filter="url(#sombra)"><ellipse cx="${mx}" cy="${my-22}" rx="30" ry="28" fill="#f7faff"/><path d="M${mx-30} ${my-22}A30 28 0 0 0 ${mx+30} ${my-22}A30 18 0 0 1 ${mx-30} ${my-22}Z" fill="#c6d5ee"/><circle cx="${mx}" cy="${my-66}" r="21" fill="#f7faff"/><path d="M${mx+21} ${my-66}A21 21 0 0 1 ${mx-15} ${my-51}A21 18 0 0 0 ${mx+21} ${my-66}Z" fill="#c6d5ee"/><circle cx="${mx}" cy="${my-100}" r="16" fill="#f7faff"/>`+
    `<rect x="${mx-12}" y="${my-138}" width="24" height="24" fill="#1a1a22"/><rect x="${mx-19}" y="${my-116}" width="38" height="5" rx="2" fill="#1a1a22"/><rect x="${mx-12}" y="${my-122}" width="24" height="5" fill="#c81f35"/>`+
    `<circle cx="${mx-5}" cy="${my-104}" r="2" fill="#1a1a22"/><circle cx="${mx+5}" cy="${my-104}" r="2" fill="#1a1a22"/><path d="M${mx} ${my-99}L${mx+16} ${my-96}L${mx} ${my-94}Z" fill="#ff8a2e"/>`+
    [-6,-3,0,3,6].map((a,i)=>`<circle cx="${mx+a}" cy="${my-91+Math.abs(a)*-.25+(i===2?1:0)}" r="1.2" fill="#1a1a22"/>`).join('')+
    `<path d="M${mx-17} ${my-86}Q${mx} ${my-78} ${mx+17} ${my-86}L${mx+17} ${my-80}Q${mx} ${my-72} ${mx-17} ${my-80}Z" fill="#c81f35"/><path d="M${mx+8} ${my-80}L${mx+14} ${my-56}L${mx+6} ${my-56}L${mx+3} ${my-78}Z" fill="#c81f35"/><path d="M${mx-15} ${my-82}H${mx+15}" stroke="#fff" stroke-width="1.6" stroke-dasharray="3 4"/>`+
    [-74,-62,-36,-24].map(b=>`<circle cx="${mx}" cy="${my+b}" r="2.3" fill="#1a1a22"/>`).join('')+
    `<path d="M${mx-19} ${my-70}L${mx-46} ${my-92}M${mx-36} ${my-84}L${mx-40} ${my-98}M${mx+19} ${my-70}L${mx+44} ${my-86}" stroke="#5a3418" stroke-width="3" stroke-linecap="round"/></g>`);
  // trineo con regalos
  o.push(`<g filter="url(#sombra)"><path d="M1196 506H1270Q1284 506 1284 494" stroke="#c81f35" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M1206 506V494M1258 506V494" stroke="#8a4a22" stroke-width="4"/><rect x="1198" y="486" width="70" height="9" rx="2" fill="#8a4a22"/>${regalo(1220,486,24,20,'#2a6ad4','#f2c45a')}${regalo(1246,486,20,26,'#c81f35','#fff')}</g>`);
  // bastones de caramelo en el camino
  const baston=(x,y,s,flip)=>`<g transform="translate(${x} ${y}) scale(${flip?-s:s} ${s})"><path d="M0 0V-34A8 8 0 0 0 -16 -34" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M0 0V-34A8 8 0 0 0 -16 -34" stroke="#e3263c" stroke-width="6" fill="none" stroke-linecap="butt" stroke-dasharray="4 5"/></g>`;
  o.push(`<path d="M${cx-34} ${by+6}Q${cx-20} ${by+40} ${cx-60} ${H}H${cx+90}Q${cx+30} ${by+40} ${cx+34} ${by+6}Z" fill="#dfe8f6" opacity=".9"/>`);
  for(let i=0;i<3;i++){ o.push(baston(cx-44-i*8,by+26+i*20,.8+i*.18,false),baston(cx+50+i*16,by+26+i*20,.8+i*.18,true)); }
  // primer plano: banco de nieve con brillos
  o.push(`<path d="M${X0} ${H}L${X0} ${H-30}Q${X0+200} ${H-52} ${X0+420} ${H-34}T${X0+860} ${H-30}`+(X0<0?` T${X0+1300} ${H-26} T200 ${H-30} T640 ${H-28}`:'')+` T860 ${H-30}T1300 ${H-22}T1620 ${H-34}L1620 ${H}Z" fill="#eef4ff" opacity=".85"/>`);
  for(let i=0;i<90;i++){ const x=X0+R()*(W-X0), y=H-28+R()*26; o.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(.6+R()*1.2)}" fill="#fff" opacity="${f(.5+R()*.5)}"/>`); }
  // nieve cayendo (dos tamaños, algunos desenfocados)
  for(let i=0;i<Math.round(150*(W-X0)/W);i++){ const x=X0+R()*(W-X0), y=R()*H, r=1+R()*2.2; o.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#fff" opacity="${f(.45+R()*.5)}"${r>2.6?' filter="url(#blur2)"':''}/>`); }
  o.push(`<rect x="${X0}" width="${W-X0}" height="${H}" filter="url(#grano)" opacity=".6"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${X0} 0 ${WT} ${H}" width="${WT}" height="${H}">${defs}${o.join('')}</svg>`;
}

function sala(WT,compacta){ WT=Math.max(1620,WT||1620); let s=29; const R=()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; };
  const W=1620, H=520, X0=1620-WT, f=n=>n.toFixed(1); const o=[];
  const COL=['#ff4d5e','#ffd166','#3ddc84','#4cc3ff','#ff7ad9'];
  const defs=`<defs>
  <linearGradient id="sPared" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a0a10"/><stop offset=".6" stop-color="#5e1219"/><stop offset="1" stop-color="#6e1a1e"/></linearGradient>
  <pattern id="sDamasco" width="56" height="64" patternUnits="userSpaceOnUse"><path d="M28 6C34 16 44 18 44 30C44 40 34 44 28 58C22 44 12 40 12 30C12 18 22 16 28 6Z" fill="none" stroke="#e8b04a" stroke-opacity=".10" stroke-width="2"/><circle cx="28" cy="30" r="4" fill="#e8b04a" fill-opacity=".08"/><circle cx="0" cy="0" r="3" fill="#e8b04a" fill-opacity=".07"/><circle cx="56" cy="64" r="3" fill="#e8b04a" fill-opacity=".07"/></pattern>
  <linearGradient id="sZocalo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2a16"/><stop offset="1" stop-color="#3a180c"/></linearGradient>
  <linearGradient id="sPiso" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a3a1c"/><stop offset="1" stop-color="#3e1e0c"/></linearGradient>
  <radialGradient id="sCalor" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb35a" stop-opacity=".55"/><stop offset=".5" stop-color="#ff8a3a" stop-opacity=".18"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>
  <radialGradient id="sGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="#ffe6a8" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
  ${COL.map((c,i)=>`<radialGradient id="sg${i}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${c}" stop-opacity=".9"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('')}
  <linearGradient id="sNoche" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1638"/><stop offset="1" stop-color="#2a4a86"/></linearGradient>
  <linearGradient id="sPino" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a7a4c"/><stop offset=".55" stop-color="#17603a"/><stop offset="1" stop-color="#0b3a22"/></linearGradient>
  <linearGradient id="sPiedra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6d6bc"/><stop offset="1" stop-color="#bda888"/></linearGradient>
  <linearGradient id="sMadera" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5230"/><stop offset=".4" stop-color="#6e3d20"/><stop offset="1" stop-color="#4a2410"/></linearGradient>
  <radialGradient id="sFuego" cx=".5" cy=".9" r=".9"><stop offset="0" stop-color="#fff4c0"/><stop offset=".3" stop-color="#ffb43a"/><stop offset=".7" stop-color="#e8501a"/><stop offset="1" stop-color="#8a1a0a" stop-opacity="0"/></radialGradient>
  <radialGradient id="sBola" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".25" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <linearGradient id="sAlfombra" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a1420"/><stop offset=".5" stop-color="#a51c2a"/><stop offset="1" stop-color="#7a1420"/></linearGradient>
  <filter id="sBlur2"><feGaussianBlur stdDeviation="2"/></filter><filter id="sBlur5"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="sSombra" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#1a0500" flood-opacity=".45"/></filter>
  <filter id="sGrano" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 .9  0 0 0 0 .8  0 0 0 .05 0"/></filter>
  </defs>`;
  const PISO=440;
  // pared con damasco, moldura, zócalo de madera
  o.push(`<rect x="${X0}" width="${W-X0}" height="${PISO}" fill="url(#sPared)"/><rect x="${X0}" width="${W-X0}" height="${PISO}" fill="url(#sDamasco)"/>`);
  o.push(`<rect x="${X0}" y="${PISO-92}" width="${W-X0}" height="92" fill="url(#sZocalo)"/><rect x="${X0}" y="${PISO-96}" width="${W-X0}" height="7" fill="#8a5230"/><rect x="${X0}" y="${PISO-96}" width="${W-X0}" height="2" fill="#c8884a" opacity=".6"/>`);
  for(let x=X0+20;x<W;x+=120) o.push(`<rect x="${x}" y="${PISO-80}" width="100" height="66" rx="3" fill="none" stroke="#2a1006" stroke-opacity=".5" stroke-width="2"/><rect x="${x+2}" y="${PISO-78}" width="96" height="2" fill="#c8884a" opacity=".25"/>`);
  // piso de duela con reflejo cálido
  o.push(`<rect x="${X0}" y="${PISO}" width="${W-X0}" height="${H-PISO}" fill="url(#sPiso)"/>`);
  for(let y=PISO+14;y<H;y+=16) o.push(`<path d="M${X0} ${y}H${W}" stroke="#2a1006" stroke-opacity=".35" stroke-width="1.5"/>`);
  for(let y=PISO,k=0;y<H;y+=16,k++) for(let x=X0+((k*53)%140);x<W;x+=140) o.push(`<path d="M${x} ${y}V${y+16}" stroke="#2a1006" stroke-opacity=".3" stroke-width="1.2"/>`);
  // lámpara de pie a la izquierda con luz cálida (detrás del texto, suave)
  o.push(`<circle cx="${X0+190}" cy="150" r="180" fill="url(#sCalor)" opacity=".5"/>`);
  const foco=(x,y,i,k=1)=>`<circle cx="${f(x)}" cy="${f(y)}" r="${14*k}" fill="url(#sg${i%5})"/><path d="M${f(x)} ${f(y-3*k)}C${f(x-4.5*k)} ${f(y-1*k)} ${f(x-4.5*k)} ${f(y+6*k)} ${f(x)} ${f(y+9*k)}C${f(x+4.5*k)} ${f(y+6*k)} ${f(x+4.5*k)} ${f(y-1*k)} ${f(x)} ${f(y-3*k)}Z" fill="${COL[i%5]}"/><rect x="${f(x-2*k)}" y="${f(y-5.5*k)}" width="${f(4*k)}" height="${f(3*k)}" fill="#3a4450"/><ellipse cx="${f(x-1.3*k)}" cy="${f(y+1.5*k)}" rx="${f(.9*k)}" ry="${f(2*k)}" fill="#fff" opacity=".75"/>`;
  if(!compacta){
  // ── ventana con la noche nevada (Santa cruza la luna en la app) ──
  const vx=1000, vy=74, vw=170, vh=230;
  o.push(`<g filter="url(#sSombra)"><rect x="${vx-14}" y="${vy-14}" width="${vw+28}" height="${vh+28}" rx="4" fill="#f2e6cc"/></g><rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="url(#sNoche)"/>`);
  for(let i=0;i<70;i++) o.push(`<circle cx="${f(vx+R()*vw)}" cy="${f(vy+R()*vh*.7)}" r="${f(.6+R()*1.2)}" fill="#fff" opacity="${f(.4+R()*.6)}"/>`);
  o.push(`<circle cx="${vx+160}" cy="${vy+62}" r="70" fill="#cfe0ff" opacity=".12"/><circle cx="${vx+160}" cy="${vy+62}" r="27" fill="#fbf3dc"/><circle cx="${vx+152}" cy="${vy+56}" r="5" fill="#d8c7a0" opacity=".45"/><circle cx="${vx+168}" cy="${vy+70}" r="6" fill="#d8c7a0" opacity=".4"/>`);
  o.push(`<path d="M${vx} ${vy+vh}V${vy+vh-46}Q${vx+60} ${vy+vh-74} ${vx+120} ${vy+vh-52}T${vx+vw} ${vy+vh-58}V${vy+vh}Z" fill="#c9d8f0"/><path d="M${vx} ${vy+vh}V${vy+vh-22}Q${vx+90} ${vy+vh-40} ${vx+vw} ${vy+vh-26}V${vy+vh}Z" fill="#eef4ff"/>`);
  [[vx+40,vy+vh-48,46],[vx+70,vy+vh-44,36],[vx+190,vy+vh-52,40]].forEach(([x,y,h])=>o.push(`<path d="M${x} ${y-h}L${x+h*.32} ${y}L${x-h*.32} ${y}Z" fill="#1a4a3a"/><path d="M${x} ${y-h}L${x+h*.1} ${y-h*.7}L${x-h*.1} ${y-h*.7}Z" fill="#eef4ff"/>`));
  [[vx+120,vy+vh-60,18,12]].forEach(([x,y,w,h])=>o.push(`<rect x="${x}" y="${y-h}" width="${w}" height="${h}" fill="#7a2a3a"/><path d="M${x-2} ${y-h}L${x+w/2} ${y-h-9}L${x+w+2} ${y-h}Z" fill="#eef4ff"/><rect x="${x+6}" y="${y-h+4}" width="5" height="5" fill="#ffd27a"/>`));
  for(let i=0;i<40;i++) o.push(`<circle cx="${f(vx+R()*vw)}" cy="${f(vy+R()*vh)}" r="${f(1+R()*1.6)}" fill="#fff" opacity=".85"/>`);
  // marco, cruz, escarcha en las esquinas y cortinas
  o.push(`<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="none" stroke="#f2e6cc" stroke-width="9"/><path d="M${vx+vw/2} ${vy}V${vy+vh}M${vx} ${vy+vh*.45}H${vx+vw}" stroke="#f2e6cc" stroke-width="7"/>`);
  [[vx+5,vy+vh-5,1,-1],[vx+vw-5,vy+vh-5,-1,-1]].forEach(([x,y,sx,sy])=>{ for(let k=0;k<7;k++){ const a=(k/6)*Math.PI/2, l=24+R()*16; o.push(`<path d="M${x} ${y}l${f(sx*Math.cos(a)*l)} ${f(sy*Math.sin(a)*l)}" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>`); } o.push(`<circle cx="${x}" cy="${y}" r="20" fill="#fff" opacity=".18" filter="url(#sBlur5)"/>`); });
  o.push(`<rect x="${vx-26}" y="${vy+vh+12}" width="${vw+52}" height="12" rx="3" fill="#e8dcc0"/>`);
  const cortina=(x,dir)=>`<path d="M${x} ${vy-30}C${x+dir*50} ${vy+60} ${x+dir*20} ${vy+150} ${x+dir*44} ${vy+vh+30}L${x+dir*80} ${vy+vh+30}C${x+dir*70} ${vy+150} ${x+dir*96} ${vy+60} ${x+dir*70} ${vy-30}Z" fill="#9a1422"/><path d="M${x+dir*20} ${vy-30}C${x+dir*58} ${vy+70} ${x+dir*36} ${vy+170} ${x+dir*58} ${vy+vh+30}" stroke="#6a0c16" stroke-width="5" fill="none" opacity=".6"/><path d="M${x+dir*8} ${vy+130}Q${x+dir*44} ${vy+145} ${x+dir*82} ${vy+128}" stroke="#e3ad38" stroke-width="5" fill="none"/>`;
  o.push(cortina(vx-6,-1),cortina(vx+vw+6,1));
  o.push(`<rect x="${vx-110}" y="${vy-40}" width="${vw+220}" height="10" rx="5" fill="#8a5a2a"/><circle cx="${vx-110}" cy="${vy-35}" r="9" fill="#d9a530"/><circle cx="${vx+vw+110}" cy="${vy-35}" r="9" fill="#d9a530"/>`);
  // guirnalda en la ventana con foquitos
  let gw=`M${vx-30} ${vy-28}Q${vx+vw/2} ${vy+20} ${vx+vw+30} ${vy-28}`; o.push(`<path d="${gw}" stroke="#123f26" stroke-width="16" fill="none" stroke-linecap="round"/><path d="${gw}" stroke="#2a8a5c" stroke-width="7" fill="none" stroke-dasharray="4 6"/>`);
  for(let i=0;i<11;i++){ const u=(i+.5)/11, x=vx-30+u*(vw+60), y=(1-u)*(1-u)*(vy-28)+2*(1-u)*u*(vy+20)+u*u*(vy-28)+6; o.push(foco(x,y,i,.9)); }
  o.push(`<path d="M${vx+vw/2} ${vy-6}C${vx+vw/2-24} ${vy-22} ${vx+vw/2-28} ${vy+6} ${vx+vw/2} ${vy-6}C${vx+vw/2+24} ${vy-22} ${vx+vw/2+28} ${vy+6} ${vx+vw/2} ${vy-6}Z" fill="#c81f35"/><path d="M${vx+vw/2-3} ${vy-4}L${vx+vw/2-12} ${vy+22}M${vx+vw/2+3} ${vy-4}L${vx+vw/2+12} ${vy+22}" stroke="#c81f35" stroke-width="5"/>`);
  }
  // ── chimenea a la derecha ──
  const fx=1468, fw=262, ftop=176;
  o.push(`<circle cx="${fx}" cy="${PISO-40}" r="300" fill="url(#sCalor)"/>`);
  o.push(`<g filter="url(#sSombra)"><rect x="${fx-fw/2}" y="${ftop+30}" width="${fw}" height="${PISO-ftop-30}" fill="url(#sPiedra)"/></g>`);
  for(let r=0;r<9;r++) for(let c=0;c<7;c++){ const x=fx-fw/2+c*44+(r%2)*22-10, y=ftop+34+r*26; if(x>fx-fw/2-10&&x<fx+fw/2-20) o.push(`<rect x="${f(Math.max(fx-fw/2+2,x))}" y="${y}" width="${f(Math.min(40,fx+fw/2-2-Math.max(fx-fw/2+2,x)))}" height="22" rx="4" fill="${['#e9dac0','#d9c6a6','#efe2ca','#cdb894'][(r*3+c)%4]}"/>`); }
  // boca con fuego
  const bx=fx-90, bw=180, btop=PISO-150;
  o.push(`<path d="M${bx} ${PISO}V${btop+50}Q${bx} ${btop} ${bx+bw/2} ${btop}Q${bx+bw} ${btop} ${bx+bw} ${btop+50}V${PISO}Z" fill="#1a0804"/>`);
  o.push(`<ellipse cx="${fx}" cy="${PISO-30}" rx="80" ry="60" fill="url(#sCalor)"/>`);
  const llama=(x,w,h,c)=>`<path d="M${x-w} ${PISO-14}C${x-w} ${PISO-14-h*.5} ${x-w*.2} ${PISO-14-h*.6} ${x+w*.1} ${PISO-14-h}C${x+w*.3} ${PISO-14-h*.55} ${x+w} ${PISO-14-h*.45} ${x+w} ${PISO-14}Z" fill="${c}"/>`;
  [[-46,22,62],[-14,28,92],[22,26,80],[52,20,56]].forEach(([dx,w,h])=>o.push(llama(fx+dx,w,h,'#e8501a'),llama(fx+dx,w*.7,h*.75,'#ffb43a'),llama(fx+dx,w*.4,h*.45,'#fff4c0')));
  o.push(`<rect x="${fx-70}" y="${PISO-20}" width="140" height="12" rx="6" fill="#4a2410" transform="rotate(-4 ${fx} ${PISO-14})"/><rect x="${fx-62}" y="${PISO-14}" width="124" height="11" rx="5" fill="#5a2e14" transform="rotate(5 ${fx} ${PISO-10})"/><circle cx="${fx+66}" cy="${PISO-16}" r="5" fill="#e0b080"/>`);
  for(let i=0;i<14;i++) o.push(`<circle cx="${f(fx-50+R()*100)}" cy="${f(PISO-80-R()*60)}" r="${f(.8+R()*1.2)}" fill="#ffd27a" opacity="${f(.6+R()*.4)}"/>`);
  o.push(`<path d="M${bx-8} ${PISO}V${btop+50}Q${bx-8} ${btop-8} ${bx+bw/2} ${btop-8}Q${bx+bw+8} ${btop-8} ${bx+bw+8} ${btop+50}V${PISO}" fill="none" stroke="#a89070" stroke-width="10"/>`);
  // repisa de madera con garland, velas, foquitos y adornos
  o.push(`<g filter="url(#sSombra)"><rect x="${fx-fw/2-24}" y="${ftop+12}" width="${fw+48}" height="22" rx="3" fill="url(#sMadera)"/></g><rect x="${fx-fw/2-24}" y="${ftop+12}" width="${fw+48}" height="3" fill="#c8884a" opacity=".7"/>`);
  // velas, cascanueces y arbolitos sobre la repisa (la corona va arriba, en la pared)
  { const nx=fx+40, ny=ftop+12; o.push(`<g filter="url(#sSombra)"><rect x="${nx-9}" y="${ny-12}" width="7" height="12" fill="#1a1a22"/><rect x="${nx+2}" y="${ny-12}" width="7" height="12" fill="#1a1a22"/><rect x="${nx-12}" y="${ny-3}" width="24" height="4" rx="2" fill="#d9a530"/><rect x="${nx-11}" y="${ny-36}" width="22" height="25" rx="3" fill="#c81f35"/><path d="M${nx-11} ${ny-24}H${nx+11}" stroke="#d9a530" stroke-width="3"/><path d="M${nx} ${ny-36}V${ny-12}" stroke="#f2c45a" stroke-width="1.5" stroke-dasharray="2 3"/><rect x="${nx-16}" y="${ny-34}" width="5" height="18" rx="2.5" fill="#c81f35"/><rect x="${nx+11}" y="${ny-34}" width="5" height="18" rx="2.5" fill="#c81f35"/><rect x="${nx-8}" y="${ny-52}" width="16" height="16" rx="3" fill="#f6d2b0"/><rect x="${nx-8}" y="${ny-44}" width="16" height="8" rx="2" fill="#fff"/><circle cx="${nx-3}" cy="${ny-47}" r="1.3" fill="#1a1a22"/><circle cx="${nx+3}" cy="${ny-47}" r="1.3" fill="#1a1a22"/><rect x="${nx-9}" y="${ny-72}" width="18" height="21" rx="2" fill="#1a1a22"/><rect x="${nx-9}" y="${ny-58}" width="18" height="3" fill="#d9a530"/><circle cx="${nx}" cy="${ny-66}" r="2.4" fill="#d9a530"/></g>`); }
  const vela=(x,h)=>`<circle cx="${x}" cy="${ftop+12-h-10}" r="22" fill="url(#sGlow)"/><rect x="${x-6}" y="${ftop+12-h}" width="12" height="${h}" rx="2" fill="#f6ead2"/><rect x="${x+1}" y="${ftop+12-h}" width="5" height="${h}" fill="#000" opacity=".08"/><path d="M${x} ${ftop+12-h-17}Q${x+5} ${ftop+12-h-7} ${x} ${ftop+12-h-2}Q${x-5} ${ftop+12-h-7} ${x} ${ftop+12-h-17}Z" fill="#ffcf5a"/>`;
  o.push(vela(fx-62,34),vela(fx-46,24),vela(fx-28,30));
  const arbolito=(x,h)=>`<path d="M${x} ${ftop+12-h}L${x+h*.32} ${ftop+12}L${x-h*.32} ${ftop+12}Z" fill="#1d6a3e"/><path d="M${x} ${ftop+12-h}L${x+h*.12} ${ftop+12-h*.6}L${x-h*.12} ${ftop+12-h*.6}Z" fill="#fff" opacity=".85"/><circle cx="${x}" cy="${ftop+12-h}" r="3" fill="#ffd35a"/>`;
  o.push(arbolito(fx-104,40),arbolito(fx-86,28),arbolito(fx+96,44),arbolito(fx+114,30));
  // guirnalda de la repisa con foquitos
  let gr=`M${fx-fw/2-30} ${ftop+30}`; for(let i=0;i<4;i++){ const a=fx-fw/2-30+i*(fw+60)/4, b=a+(fw+60)/4; gr+=` Q${(a+b)/2} ${ftop+62} ${b} ${ftop+30}`; }
  o.push(`<path d="${gr}" stroke="#123f26" stroke-width="18" fill="none" stroke-linecap="round"/><path d="${gr}" stroke="#2a8a5c" stroke-width="8" fill="none" stroke-dasharray="4 6"/>`);
  for(let i=0;i<16;i++){ const u=(i+.5)/16, seg=Math.floor(u*4), t=u*4-seg, a=fx-fw/2-30+seg*(fw+60)/4, b=a+(fw+60)/4, x=(1-t)*(1-t)*a+2*(1-t)*t*(a+b)/2+t*t*b, y=(1-t)*(1-t)*(ftop+30)+2*(1-t)*t*(ftop+62)+t*t*(ftop+30)+5; o.push(foco(x,y,i+1,.8)); }
  // botitas colgando de la repisa
  const bota=(x,col,col2,pat)=>{ const y0=ftop+40; let d=`M${x-14} ${y0}V${y0+62}Q${x-14} ${y0+80} ${x+4} ${y0+80}H${x+30}Q${x+42} ${y0+80} ${x+40} ${y0+66}Q${x+34} ${y0+54} ${x+14} ${y0+50}V${y0}Z`; let g=`<g filter="url(#sSombra)"><path d="${d}" fill="${col}"/>`;
    if(pat==='rayas') for(let yy=y0+18;yy<y0+80;yy+=12) g+=`<path d="M${x-14} ${yy}H${x+42}" stroke="${col2}" stroke-width="5" clip-path="none"/>`;
    if(pat==='copo') g+=`<g stroke="${col2}" stroke-width="2" stroke-linecap="round">${[0,1,2].map(k=>{ const a=k*Math.PI/3; return `<path d="M${f(x-Math.cos(a)*9)} ${f(y0+42-Math.sin(a)*9)}L${f(x+Math.cos(a)*9)} ${f(y0+42+Math.sin(a)*9)}"/>`; }).join('')}</g>`;
    if(pat==='puntos') for(let yy=y0+20;yy<y0+76;yy+=11) for(let xx=x-9+((yy/11)%2)*5;xx<x+12;xx+=10) g+=`<circle cx="${xx}" cy="${yy}" r="2" fill="${col2}"/>`;
    g+=`<path d="${d}" fill="none" stroke="#000" stroke-opacity=".15" stroke-width="1"/><rect x="${x-18}" y="${y0-4}" width="36" height="16" rx="6" fill="#fbf6ee"/><path d="M${x} ${y0-4}V${y0-12}" stroke="#d9a530" stroke-width="2"/></g>`; return g; };
  o.push(bota(fx-104,'#c81f35','#fbf6ee','rayas'),bota(fx-44,'#1f6b45','#e3ad38','puntos'),bota(fx+16,'#f2e3c4','#c81f35','copo'),bota(fx+76,'#c81f35','#1f6b45','rayas'));
  // un bastón de caramelo que asoma de una botita
  o.push(`<path d="M${fx+26} ${ftop+46}V${ftop+18}A7 7 0 0 0 ${fx+12} ${ftop+18}" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M${fx+26} ${ftop+46}V${ftop+18}A7 7 0 0 0 ${fx+12} ${ftop+18}" stroke="#e3263c" stroke-width="5" fill="none" stroke-dasharray="3 4"/>`);
  // sillón a la izquierda del árbol con cojín y manta
  const sx2=960, sy2=PISO+12; o.push(`<g filter="url(#sSombra)"><path d="M${sx2-80} ${sy2}V${sy2-80}Q${sx2-80} ${sy2-118} ${sx2-40} ${sy2-118}H${sx2+40}Q${sx2+80} ${sy2-118} ${sx2+80} ${sy2-80}V${sy2}Z" fill="#1d4a2e"/><rect x="${sx2-96}" y="${sy2-66}" width="30" height="70" rx="14" fill="#18402a"/><rect x="${sx2+66}" y="${sy2-66}" width="30" height="70" rx="14" fill="#18402a"/><rect x="${sx2-66}" y="${sy2-46}" width="132" height="34" rx="10" fill="#235a38"/><rect x="${sx2-26}" y="${sy2-86}" width="40" height="36" rx="10" fill="#c81f35" transform="rotate(-10 ${sx2-6} ${sy2-68})"/><path d="M${sx2+10} ${sy2-46}Q${sx2+40} ${sy2-50} ${sx2+60} ${sy2-30}L${sx2+56} ${sy2+6}Q${sx2+30} ${sy2-10} ${sx2+6} ${sy2-12}Z" fill="#f2e3c4"/><path d="M${sx2+14} ${sy2-38}L${sx2+56} ${sy2-22}M${sx2+12} ${sy2-26}L${sx2+56} ${sy2-8}" stroke="#c81f35" stroke-width="3"/></g>`);
  { const sx2=960, sy2=PISO+12; let g=''; for(let r=0;r<2;r++) for(let c=0;c<4;c++) g+=`<circle cx="${sx2-48+c*32+(r%2)*16}" cy="${sy2-100+r*22}" r="2.6" fill="#123a22"/>`; g+=`<rect x="${sx2-86}" y="${sy2}" width="7" height="10" rx="2" fill="#3a1a0a"/><rect x="${sx2+79}" y="${sy2}" width="7" height="10" rx="2" fill="#3a1a0a"/>`; o.push(g); }
  // alfombra y mesita con leche y galletas para Santa
  o.push(`<ellipse cx="1250" cy="${PISO+64}" rx="340" ry="38" fill="url(#sAlfombra)" opacity=".85"/><ellipse cx="1250" cy="${PISO+64}" rx="310" ry="30" fill="none" stroke="#e3ad38" stroke-width="2" stroke-dasharray="6 6" opacity=".7"/>`);
  // ── árbol grande entre la ventana y la chimenea ──
  const ax=compacta?1236:1200, ab=PISO+20, ah=compacta?300:320, aw=124;
  o.push(`<ellipse cx="${ax}" cy="${ab-16}" rx="190" ry="60" fill="url(#sCalor)" opacity=".8"/>`);
  o.push(`<rect x="${ax-12}" y="${ab-30}" width="24" height="26" fill="#4a2a18"/><path d="M${ax-40} ${ab-6}H${ax+40}L${ax+34} ${ab-30}H${ax-34}Z" fill="#c81f35"/><path d="M${ax-40} ${ab-6}H${ax+40}" stroke="#e3ad38" stroke-width="3"/>`);
  let ar='';
  for(let k=0;k<6;k++){ const t=k/5, yy=ab-28-ah+k*ah*.15, ww=aw*(.24+t*.76), hh=ah*.27, base=yy+hh; let d=`M${f(ax)} ${f(yy)}C${f(ax+ww*.3)} ${f(yy+hh*.4)} ${f(ax+ww*.7)} ${f(base-hh*.2)} ${f(ax+ww)} ${f(base)}`; const n=6; for(let i=n;i>=0;i--){ const xx=ax-ww+i*2*ww/n; d+=` Q${f(xx+ww/n)} ${f(base+hh*.1)} ${f(xx)} ${f(base)}`; } d+=` C${f(ax-ww*.7)} ${f(base-hh*.2)} ${f(ax-ww*.3)} ${f(yy+hh*.4)} ${f(ax)} ${f(yy)}Z`;
    ar+=`<path d="${d}" fill="url(#sPino)"/><path d="M${f(ax)} ${f(yy)}C${f(ax+ww*.3)} ${f(yy+hh*.4)} ${f(ax+ww*.7)} ${f(base-hh*.2)} ${f(ax+ww)} ${f(base)}L${f(ax+ww*.25)} ${f(base)}Z" fill="#06261a" opacity=".25"/>`;
    for(let i=0;i<18;i++){ const u=R(), xx=ax+(R()*2-1)*ww*u, y2=yy+hh*u*.9; ar+=`<path d="M${f(xx)} ${f(y2)}l${f((R()-.5)*10)} 6" stroke="#3a9a62" stroke-opacity=".5" stroke-width="1.5"/>`; } }
  o.push(`<g filter="url(#sSombra)">${ar}</g>`);
  for(let k=0;k<5;k++){ const t0=.18+k*.16, t1=t0+.12, y0=ab-28-ah+t0*ah, y1=ab-28-ah+t1*ah, w0=aw*(.24+t0*.76)*.88, w1=aw*(.24+t1*.76)*.88; o.push(`<path d="M${f(ax-w0)} ${f(y0)}Q${f(ax)} ${f((y0+y1)/2+20)} ${f(ax+w1)} ${f(y1)}" stroke="#f2c45a" stroke-width="2.6" fill="none"/>`); }
  for(let i=0;i<30;i++){ const t=.14+.82*R(), yy=ab-28-ah+t*ah, ww=aw*(.24+t*.76)*.8, xx=ax+(R()*2-1)*ww, c=['#c81f35','#e3ad38','#c9d6e6','#2a6ad4','#8a1a6a'][i%5], r=4+R()*3; o.push(`<circle cx="${f(xx)}" cy="${f(yy)}" r="${f(r)}" fill="${c}"/><circle cx="${f(xx)}" cy="${f(yy)}" r="${f(r)}" fill="url(#sBola)"/><rect x="${f(xx-1.5)}" y="${f(yy-r-2)}" width="3" height="2.5" fill="#d9a530"/>`); }
  for(let i=0;i<54;i++){ const t=.1+.86*i/54, yy=ab-28-ah+t*ah, ww=aw*(.24+t*.76)*.9, xx=ax+Math.sin(i*2.3)*ww; o.push(`<circle cx="${f(xx)}" cy="${f(yy)}" r="9" fill="url(#sg${i%5})"/><circle cx="${f(xx)}" cy="${f(yy)}" r="2.6" fill="${COL[i%5]}"/><circle cx="${f(xx-.8)}" cy="${f(yy-.8)}" r=".9" fill="#fff" opacity=".9"/>`); }
  // estrella
  const sx=ax, sy=ab-28-ah-8; o.push(`<circle cx="${sx}" cy="${sy}" r="46" fill="url(#sGlow)"/>`); let ds=''; for(let i=0;i<10;i++){ const rr=i%2?6.5:16, a=-Math.PI/2+i*Math.PI/5; ds+=(i?'L':'M')+f(sx+Math.cos(a)*rr)+' '+f(sy+Math.sin(a)*rr); } o.push(`<path d="${ds}Z" fill="#ffd35a" stroke="#c58a1c" stroke-width="1.2"/>`);
  // regalos y tren de juguete al pie del árbol
  const regalo=(x,y,w,h,c,cin)=>`<g filter="url(#sSombra)"><rect x="${f(x-w/2)}" y="${f(y-h)}" width="${w}" height="${h}" rx="2" fill="${c}"/><rect x="${f(x-w/2)}" y="${f(y-h)}" width="${f(w*.42)}" height="${h}" fill="#000" opacity=".12"/><rect x="${f(x-w*.07)}" y="${f(y-h)}" width="${f(w*.14)}" height="${h}" fill="${cin}"/><rect x="${f(x-w/2)}" y="${f(y-h*.62)}" width="${w}" height="${f(h*.14)}" fill="${cin}"/><path d="M${f(x)} ${f(y-h)}C${f(x-w*.45)} ${f(y-h-w*.35)} ${f(x-w*.5)} ${f(y-h+2)} ${f(x)} ${f(y-h)}C${f(x+w*.45)} ${f(y-h-w*.35)} ${f(x+w*.5)} ${f(y-h+2)} ${f(x)} ${f(y-h)}Z" fill="${cin}"/></g>`;
  o.push(regalo(1110,PISO+34,44,36,'#c81f35','#f2c45a'),regalo(1150,PISO+42,32,44,'#2a6ad4','#fff'),regalo(1250,PISO+36,48,30,'#f2c45a','#1f6b45'),regalo(1290,PISO+44,28,24,'#1f6b45','#c81f35'),regalo(1200,PISO+48,30,22,'#fbf6ee','#e3263c'),regalo(1072,PISO+44,26,22,'#8a1a6a','#f2c45a'));
  const tren=(x,y)=>`<g filter="url(#sSombra)"><rect x="${x}" y="${y-22}" width="34" height="22" rx="3" fill="#c81f35"/><rect x="${x+20}" y="${y-36}" width="14" height="16" fill="#c81f35"/><rect x="${x+4}" y="${y-34}" width="8" height="12" fill="#1a1a22"/><rect x="${x+22}" y="${y-32}" width="10" height="8" fill="#ffd27a"/><rect x="${x+38}" y="${y-18}" width="26" height="16" rx="2" fill="#1f6b45"/><rect x="${x+68}" y="${y-18}" width="26" height="16" rx="2" fill="#2a6ad4"/>${[x+8,x+26,x+44,x+58,x+74,x+88].map(xx=>`<circle cx="${xx}" cy="${y}" r="5" fill="#1a1a22"/><circle cx="${xx}" cy="${y}" r="2" fill="#d9a530"/>`).join('')}<circle cx="${x+8}" cy="${y-42}" r="5" fill="#fff" opacity=".5"/><circle cx="${x+2}" cy="${y-52}" r="7" fill="#fff" opacity=".35"/></g>`;
  o.push(tren(1290,PISO+66));
  const mx=1400, my=PISO+34; o.push(`<g filter="url(#sSombra)"><rect x="${mx-46}" y="${my-6}" width="92" height="8" rx="3" fill="url(#sMadera)"/><rect x="${mx-38}" y="${my+2}" width="6" height="34" fill="#4a2410"/><rect x="${mx+32}" y="${my+2}" width="6" height="34" fill="#4a2410"/></g>`);
  o.push(`<ellipse cx="${mx-12}" cy="${my-8}" rx="26" ry="6" fill="#f4efe6"/><ellipse cx="${mx-12}" cy="${my-8}" rx="21" ry="4" fill="none" stroke="#c81f35" stroke-width="1.5"/>`);
  [[-24,-12],[-12,-14],[-2,-11]].forEach(([dx,dy])=>{ o.push(`<ellipse cx="${mx+dx}" cy="${my+dy}" rx="9" ry="4" fill="#b8692e"/>`); [[-3,-1],[2,0],[0,1.5]].forEach(([a,b])=>o.push(`<circle cx="${mx+dx+a}" cy="${my+dy+b}" r="1" fill="#4a2410"/>`)); });
  o.push(`<path d="M${mx+16} ${my-34}H${mx+30}L${mx+28} ${my-8}H${mx+18}Z" fill="#fff" opacity=".95"/><rect x="${mx+17}" y="${my-34}" width="13" height="4" fill="#d6e0ee"/>`);
  o.push(`<g transform="rotate(10 ${mx+20} ${my-18})"><rect x="${mx+34}" y="${my-30}" width="26" height="20" fill="#fffaf0"/><text x="${mx+47}" y="${my-22}" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="7" fill="#c81f35" text-anchor="middle">Para</text><text x="${mx+47}" y="${my-14}" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="7" fill="#c81f35" text-anchor="middle">Santa</text></g>`);
  // gatito naranja sentado con gorrito de Santa, jugando con una esfera
  { const cx=1048, cy=PISO+74, P2=Math.PI*2; let g=`<g filter="url(#sSombra)">`;
    g+=`<ellipse cx="${cx+4}" cy="${cy+4}" rx="40" ry="8" fill="#1a0500" opacity=".25"/>`;
    g+=`<path d="M${cx+22} ${cy}C${cx+58} ${cy+2} ${cx+62} ${cy-30} ${cx+44} ${cy-40}C${cx+36} ${cy-44} ${cx+32} ${cy-36} ${cx+40} ${cy-32}C${cx+50} ${cy-24} ${cx+44} ${cy-8} ${cx+20} ${cy-8}Z" fill="#e8873a"/><path d="M${cx+46} ${cy-38}l4 6M${cx+52} ${cy-26}l6 2M${cx+48} ${cy-12}l6 -2" stroke="#b85a1e" stroke-width="3" stroke-linecap="round"/>`;
    g+=`<path d="M${cx-26} ${cy}C${cx-30} ${cy-34} ${cx-20} ${cy-56} ${cx} ${cy-58}C${cx+20} ${cy-56} ${cx+30} ${cy-34} ${cx+26} ${cy}Z" fill="#e8873a"/>`;
    g+=`<path d="M${cx-14} ${cy-2}C${cx-16} ${cy-26} ${cx-8} ${cy-44} ${cx} ${cy-46}C${cx+8} ${cy-44} ${cx+16} ${cy-26} ${cx+14} ${cy-2}Z" fill="#fbeedd"/>`;
    [[-24,-38,-12,-40],[-27,-24,-14,-24],[24,-38,12,-40],[27,-24,14,-24]].forEach(([a,b,c2,d])=>{ g+=`<path d="M${cx+a} ${cy+b}L${cx+c2} ${cy+d}" stroke="#b85a1e" stroke-width="3.5" stroke-linecap="round"/>`; });
    g+=`<ellipse cx="${cx-10}" cy="${cy-2}" rx="9" ry="6" fill="#fbeedd"/><ellipse cx="${cx+10}" cy="${cy-2}" rx="9" ry="6" fill="#fbeedd"/><path d="M${cx-13} ${cy-3}v4M${cx-9} ${cy-3}v4M${cx+7} ${cy-3}v4M${cx+11} ${cy-3}v4" stroke="#e0c8b0" stroke-width="1.2"/>`;
    const hx=cx, hy=cy-74;
    g+=`<path d="M${hx-30} ${hy+4}L${hx-24} ${hy-26}L${hx-8} ${hy-12}Z" fill="#e8873a"/><path d="M${hx+30} ${hy+4}L${hx+24} ${hy-26}L${hx+8} ${hy-12}Z" fill="#e8873a"/><path d="M${hx-26} ${hy-2}L${hx-23} ${hy-18}L${hx-13} ${hy-10}Z" fill="#f6b8a8"/><path d="M${hx+26} ${hy-2}L${hx+23} ${hy-18}L${hx+13} ${hy-10}Z" fill="#f6b8a8"/>`;
    g+=`<ellipse cx="${hx}" cy="${hy+4}" rx="32" ry="27" fill="#ee9444"/><path d="M${hx-6} ${hy-22}l2 10M${hx} ${hy-23}v11M${hx+6} ${hy-22}l-2 10" stroke="#b85a1e" stroke-width="3" stroke-linecap="round"/><path d="M${hx-32} ${hy+2}h8M${hx-31} ${hy+9}h8M${hx+32} ${hy+2}h-8M${hx+31} ${hy+9}h-8" stroke="#b85a1e" stroke-width="2.6" stroke-linecap="round"/>`;
    g+=`<ellipse cx="${hx}" cy="${hy+14}" rx="15" ry="11" fill="#fbeedd"/>`;
    [-11,11].forEach(dx=>{ g+=`<ellipse cx="${hx+dx}" cy="${hy+1}" rx="6.5" ry="7.5" fill="#3a8a4a"/><ellipse cx="${hx+dx}" cy="${hy+1}" rx="2.4" ry="6" fill="#141414"/><circle cx="${hx+dx-2}" cy="${hy-2}" r="2" fill="#fff"/>`; });
    g+=`<path d="M${hx-4} ${hy+9}L${hx+4} ${hy+9}L${hx} ${hy+13}Z" fill="#f08a9a"/><path d="M${hx} ${hy+13}q-4 6 -9 3M${hx} ${hy+13}q4 6 9 3" stroke="#7a4030" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    g+=`<path d="M${hx-14} ${hy+12}L${hx-36} ${hy+8}M${hx-14} ${hy+15}L${hx-36} ${hy+17}M${hx+14} ${hy+12}L${hx+36} ${hy+8}M${hx+14} ${hy+15}L${hx+36} ${hy+17}" stroke="#fff" stroke-width="1" opacity=".85"/>`;
    g+=`<circle cx="${hx-19}" cy="${hy+10}" r="4" fill="#f6a0a0" opacity=".45"/><circle cx="${hx+19}" cy="${hy+10}" r="4" fill="#f6a0a0" opacity=".45"/>`;
    // gorrito de Santa, ladeado, con pompón que cae a un lado
    g+=`<path d="M${hx-26} ${hy-14}C${hx-20} ${hy-46} ${hx+8} ${hy-62} ${hx+34} ${hy-52}C${hx+46} ${hy-46} ${hx+44} ${hy-30} ${hx+38} ${hy-22}C${hx+34} ${hy-34} ${hx+28} ${hy-40} ${hx+20} ${hy-40}C${hx+16} ${hy-30} ${hx+20} ${hy-20} ${hx+24} ${hy-14}Z" fill="#d3172f"/><path d="M${hx-16} ${hy-30}C${hx-6} ${hy-48} ${hx+12} ${hy-56} ${hx+28} ${hy-50}" stroke="#ff6a7a" stroke-width="3" fill="none" opacity=".6"/>`;
    g+=`<rect x="${hx-30}" y="${hy-20}" width="58" height="13" rx="6.5" fill="#fbf6ee" transform="rotate(-6 ${hx} ${hy-14})"/><circle cx="${hx+40}" cy="${hy-20}" r="8" fill="#fbf6ee"/>`;
    for(let k=0;k<9;k++) g+=`<circle cx="${f(hx-26+k*6.5)}" cy="${f(hy-12-k*.7+((k*7)%3))}" r="1.3" fill="#e0d4c4"/>`;
    // esfera roja con la que juega
    g+=`<circle cx="${cx-46}" cy="${cy-8}" r="11" fill="#c81f35"/><circle cx="${cx-46}" cy="${cy-8}" r="11" fill="url(#sBola)"/><rect x="${cx-49}" y="${cy-22}" width="6" height="4" fill="#d9a530"/><path d="M${cx-46} ${cy-22}q-8 -10 2 -16" stroke="#d9a530" stroke-width="1.2" fill="none"/>`;
    g+=`<ellipse cx="${cx-26}" cy="${cy-6}" rx="8" ry="5" fill="#fbeedd" transform="rotate(-25 ${cx-26} ${cy-6})"/>`;
    o.push(g+'</g>'); }
  const lx=800; o.push(`<circle cx="${lx}" cy="268" r="130" fill="url(#sCalor)"/><g filter="url(#sSombra)"><rect x="${lx-3}" y="280" width="6" height="${PISO-280+20}" fill="#2a1a10"/><ellipse cx="${lx}" cy="${PISO+22}" rx="26" ry="6" fill="#2a1a10"/><path d="M${lx-34} 284H${lx+34}L${lx+22} 240H${lx-22}Z" fill="#f2dfb0"/><path d="M${lx-34} 284H${lx+34}" stroke="#c8a060" stroke-width="3"/></g><path d="M${lx-30} 282L${lx-48} ${PISO}H${lx+48}L${lx+30} 282Z" fill="#ffd88a" opacity=".07"/>`);
  const px=880, py=PISO+30; let fp=`<g filter="url(#sSombra)"><path d="M${px-26} ${py-36}H${px+26}L${px+20} ${py}H${px-20}Z" fill="#c8a060"/><rect x="${px-29}" y="${py-40}" width="58" height="8" rx="2" fill="#d9b06a"/><path d="M${px-26} ${py-24}H${px+26}" stroke="#c81f35" stroke-width="5"/>`;
  for(let k=0;k<7;k++){ const a=-Math.PI/2+(k-3)*.42; fp+=`<path d="M${px} ${py-44}Q${f(px+Math.cos(a)*30)} ${f(py-44+Math.sin(a)*30-6)} ${f(px+Math.cos(a)*52)} ${f(py-44+Math.sin(a)*48)}Q${f(px+Math.cos(a)*30+6)} ${f(py-44+Math.sin(a)*30+4)} ${px} ${py-44}Z" fill="#1f6b45"/>`; }
  for(let k=0;k<3;k++){ const cx=px+(k-1)*26, cy=py-86+Math.abs(k-1)*12; for(let j=0;j<6;j++){ const a=j/6*Math.PI*2+k; fp+=`<path d="M${cx} ${cy}Q${f(cx+Math.cos(a+.3)*12)} ${f(cy+Math.sin(a+.3)*12)} ${f(cx+Math.cos(a)*22)} ${f(cy+Math.sin(a)*22)}Q${f(cx+Math.cos(a-.3)*12)} ${f(cy+Math.sin(a-.3)*12)} ${cx} ${cy}Z" fill="${j%2?'#d3172f':'#e3263c'}"/>`; } fp+=`<circle cx="${cx}" cy="${cy}" r="4" fill="#f2c45a"/>`; }
  o.push(fp+'</g>');
  // guirnalda del techo con foquitos (arriba de todo, sin tocar el texto)
  { let d=`M${X0} 0`; const tramos=Math.max(4,Math.round((W-X0)/300)), paso=(W-X0)/tramos; for(let i=0;i<tramos;i++){ const a=X0+i*paso; d+=` Q${f(a+paso/2)} 30 ${f(a+paso)} 0`; }
    o.push(`<path d="${d}" stroke="#123f26" stroke-width="13" fill="none"/><path d="${d}" stroke="#2a8a5c" stroke-width="5" fill="none" stroke-dasharray="3 5"/>`);
    for(let i=0;i<tramos;i++){ const a=X0+i*paso; for(let j=1;j<6;j++){ const u=j/6, x=a+u*paso, y=2*(1-u)*u*30+3; o.push(foco(x,y,i*5+j,.7)); } if(i) o.push(`<path d="M${f(a)} 2C${f(a-14)} -10 ${f(a-18)} 14 ${f(a)} 2C${f(a+14)} -10 ${f(a+18)} 14 ${f(a)} 2Z" fill="#c81f35"/>`); } }
  // corona sobre la chimenea
  { const wx=fx, wy=112; let g=`<g filter="url(#sSombra)"><circle cx="${wx}" cy="${wy}" r="30" fill="none" stroke="#123f26" stroke-width="16"/>`; for(let i=0;i<26;i++){ const a=i/26*Math.PI*2; g+=`<ellipse cx="${f(wx+Math.cos(a)*30)}" cy="${f(wy+Math.sin(a)*30)}" rx="7" ry="3.2" fill="${i%2?'#2a8a5c':'#1d6a3e'}" transform="rotate(${f(a*57.3+60)} ${f(wx+Math.cos(a)*30)} ${f(wy+Math.sin(a)*30)})"/>`; }
    [[.4,'#d3172f'],[1.5,'#e3ad38'],[2.6,'#d3172f'],[3.7,'#e3ad38'],[4.8,'#d3172f'],[5.7,'#e3ad38']].forEach(([a,c])=>{ g+=`<circle cx="${f(wx+Math.cos(a)*30)}" cy="${f(wy+Math.sin(a)*30)}" r="4.5" fill="${c}"/><circle cx="${f(wx+Math.cos(a)*30-1.3)}" cy="${f(wy+Math.sin(a)*30-1.3)}" r="1.4" fill="#fff" opacity=".7"/>`; });
    g+=`<path d="M${wx} ${wy+30}C${wx-18} ${wy+16} ${wx-22} ${wy+42} ${wx} ${wy+30}C${wx+18} ${wy+16} ${wx+22} ${wy+42} ${wx} ${wy+30}Z" fill="#c81f35"/><path d="M${wx-3} ${wy+31}L${wx-10} ${wy+54}M${wx+3} ${wy+31}L${wx+10} ${wy+54}" stroke="#c81f35" stroke-width="5" stroke-linecap="round"/></g>`; o.push(g); }
  // cuadro con paisaje nevado en la pared (solo en la versión compacta, donde no está la ventana)
  if(compacta){ const qx=1000, qy=236; o.push(`<g filter="url(#sSombra)"><rect x="${qx-46}" y="${qy-34}" width="92" height="70" rx="3" fill="#c8963a"/><rect x="${qx-38}" y="${qy-26}" width="76" height="54" fill="url(#sNoche)"/><path d="M${qx-38} ${qy+28}V${qy+12}Q${qx-10} ${qy+2} ${qx+10} ${qy+10}T${qx+38} ${qy+8}V${qy+28}Z" fill="#e8f0fb"/><path d="M${qx-20} ${qy+12}l8 -18 8 18Z M${qx+14} ${qy+10}l6 -14 6 14Z" fill="#1a4a3a"/><circle cx="${qx+22}" cy="${qy-12}" r="7" fill="#fbf3dc"/><rect x="${qx-6}" y="${qy+4}" width="12" height="9" fill="#7a2a3a"/><rect x="${qx-2}" y="${qy+7}" width="4" height="4" fill="#ffd27a"/></g><path d="M${qx-30} ${qy-34}Q${qx} ${qy-20} ${qx+30} ${qy-34}" stroke="#123f26" stroke-width="7" fill="none"/><circle cx="${qx}" cy="${qy-27}" r="4" fill="#d3172f"/>`); }
  // banquito con chocolate caliente con malvaviscos y libros
  { const bx2=724, by2=PISO+40; o.push(`<g filter="url(#sSombra)"><rect x="${bx2-30}" y="${by2-30}" width="60" height="9" rx="3" fill="url(#sMadera)"/><rect x="${bx2-24}" y="${by2-22}" width="6" height="30" fill="#4a2410"/><rect x="${bx2+18}" y="${by2-22}" width="6" height="30" fill="#4a2410"/>`+
    `<rect x="${bx2-26}" y="${by2-42}" width="40" height="7" rx="1.5" fill="#1d4a2e"/><rect x="${bx2-24}" y="${by2-49}" width="36" height="7" rx="1.5" fill="#9a1a22"/><rect x="${bx2-22}" y="${by2-55}" width="32" height="6" rx="1.5" fill="#d9a530"/>`+
    `<path d="M${bx2+12} ${by2-56}h18l-2 22h-14Z" fill="#c81f35"/><path d="M${bx2+30} ${by2-50}q9 0 8 8q-1 6 -9 5" stroke="#c81f35" stroke-width="3" fill="none"/><ellipse cx="${bx2+21}" cy="${by2-56}" rx="9" ry="2.6" fill="#6a3418"/><rect x="${bx2+15}" y="${by2-60}" width="5" height="4" rx="1" fill="#fff"/><rect x="${bx2+21}" y="${by2-61}" width="5" height="4" rx="1" fill="#fff"/><path d="M${bx2+31} ${by2-56}h0M${bx2+14} ${by2-48}h14" stroke="#fff" stroke-width="2" opacity=".5"/>`+
    `<path d="M${bx2+18} ${by2-64}c-4 -6 4 -8 0 -14M${bx2+24} ${by2-64}c-4 -6 4 -8 0 -14" stroke="#fff" stroke-width="1.6" fill="none" opacity=".45"/></g>`); }
  // osito de peluche con moño junto a los regalos
  { const ox=1336, oy=PISO+40; o.push(`<g filter="url(#sSombra)"><circle cx="${ox-12}" cy="${oy-36}" r="6" fill="#a8692e"/><circle cx="${ox+12}" cy="${oy-36}" r="6" fill="#a8692e"/><circle cx="${ox}" cy="${oy-28}" r="13" fill="#b8763a"/><ellipse cx="${ox}" cy="${oy-6}" rx="14" ry="15" fill="#b8763a"/><ellipse cx="${ox}" cy="${oy-4}" rx="8" ry="9" fill="#e8c49a"/><ellipse cx="${ox}" cy="${oy-24}" rx="6" ry="4.5" fill="#e8c49a"/><circle cx="${ox-5}" cy="${oy-31}" r="1.6" fill="#1a1a22"/><circle cx="${ox+5}" cy="${oy-31}" r="1.6" fill="#1a1a22"/><circle cx="${ox}" cy="${oy-25}" r="2" fill="#1a1a22"/><ellipse cx="${ox-13}" cy="${oy+6}" rx="6" ry="5" fill="#a8692e"/><ellipse cx="${ox+13}" cy="${oy+6}" rx="6" ry="5" fill="#a8692e"/><path d="M${ox} ${oy-15}C${ox-10} ${oy-22} ${ox-11} ${oy-9} ${ox} ${oy-15}C${ox+10} ${oy-22} ${ox+11} ${oy-9} ${ox} ${oy-15}Z" fill="#1f6b45"/></g>`); }
  // galleta de jengibre y esfera de nieve en la mesita
  { const gx=1424, gy=PISO+26; o.push(`<path d="M${gx} ${gy-14}a4 4 0 1 1 0.1 0ZM${gx-3} ${gy-11}l-7 2 1 3 6 -1 -3 8 3 1 3 -6 3 6 3 -1 -3 -8 6 1 1 -3 -7 -2Z" fill="#b8692e"/><path d="M${gx-2} ${gy-17}h0.1M${gx+2} ${gy-17}h0.1" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`);
    o.push(`<ellipse cx="${1368}" cy="${PISO+26}" rx="10" ry="3" fill="#6e3d20"/><rect x="1360" y="${PISO+20}" width="16" height="6" fill="#8a5230"/><circle cx="1368" cy="${PISO+10}" r="11" fill="#cfe4ff" opacity=".55"/><path d="M1362 ${PISO+14}l6 -10 6 10Z" fill="#1d6a3e"/><circle cx="1365" cy="${PISO+6}" r="1" fill="#fff"/><circle cx="1372" cy="${PISO+9}" r="1" fill="#fff"/><circle cx="1364" cy="${PISO+4}" r="3" fill="#fff" opacity=".7"/>`); }
  // charcos de luz cálida en el piso y viñeta
  o.push(`<ellipse cx="${fx}" cy="${PISO+40}" rx="220" ry="40" fill="url(#sCalor)" opacity=".7"/><ellipse cx="${800}" cy="${PISO+30}" rx="120" ry="24" fill="url(#sCalor)" opacity=".5"/>`);
  // brillo cálido general y grano
  o.push(`<rect x="${X0}" width="${W-X0}" height="${H}" fill="url(#sCalor)" opacity=".18"/><rect x="${X0}" width="${W-X0}" height="${H}" filter="url(#sGrano)" opacity=".6"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${X0} 0 ${WT} ${H}" width="${WT}" height="${H}">${defs}${o.join('')}</svg>`;
}

// libre: ancho (px de la imagen) que ocupa el texto a la izquierda.
// La escena va anclada a la derecha; si el texto llegaría hasta la ventana de la sala (x≈880 de 1620), la sala se arma
// compacta (sin la ventana y con el árbol un poco a la derecha) para no taparlo.
export function ilustracion(etapa,W,H,libre=0){
  const k=H/520, WT=Math.max(1620,Math.ceil(W/k)), compacta=etapa==='casa'&&W-1620*k+880*k<libre, svg=etapa==='casa'?sala(WT,compacta):paisaje(WT);
  return new Promise(res=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=()=>res(null); i.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg); setTimeout(()=>res(null),8000); });
}
