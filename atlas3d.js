/* De Bewegingsatlas · gedeelde motor van de 3D-haltes.
   Een halte roept Atlas3D(cfg) aan. De motor bouwt de schil (kop, zoomladder, panelen, HUD, film),
   de renderer, de punten, de speurtocht, het geluid, de presentatiestand en de uitlegfilm.
   De halte levert in cfg.build(K) de 3D-scènes per zoomniveau en de inhoud.
   Afgeleid van spier.html (halte 8); zie BOUWEN.md voor de afspraken. */
(function(){
"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function fail(msg){const e=$('#err');if(!e){alert(msg);return;}$('#errMsg').textContent=msg;e.classList.add('open');const l=$('#loader');if(l)l.classList.add('gone');}
window.__err=fail;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ================= schil ================= */
function shellHTML(c){const F=c.film||{},hp=c.help||{},L0=c.levels[0];
  const st=['s1','s2','s3'].map((k,i)=>L0[k]||['Rust','Belasting','Blessure'][i]);
  const keys=[['<kbd>+</kbd> <kbd>−</kbd>','Inzoomen · uitzoomen'],['<kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd>',hp.states||st.join(' · ')],['<kbd>→</kbd> <kbd>←</kbd>','Volgend / vorig tabje of punt (werkt met een clicker)'],['<kbd>Spatie</kbd>','Pauzeren of hervatten']].concat(hp.keys||[]).concat([['<kbd>C</kbd> · <kbd>G</kbd> · <kbd>L</kbd>','Camerarit · geluid · labels'],['<kbd>F</kbd>','Uitlegfilm starten'],['<kbd>Esc</kbd>','Paneel sluiten of presentatie stoppen']]);
  if(c.levels.length<2)keys.splice(0,1);
  return `<div id="app">
  <canvas id="c" aria-label="${esc(c.aria||c.name)}"></canvas>
  <div id="vignette"></div><div id="flash"></div><div id="markers"></div>
  <div id="lens"></div><div id="lensTxt"></div>
  <canvas id="filmOv" aria-hidden="true"></canvas>
  <div id="filmBar" hidden><button id="fPrev" title="Vorig hoofdstuk (←)" aria-label="Vorig hoofdstuk">⏮</button><button id="fPlay" title="Pauze / afspelen (spatie)" aria-label="Pauze of afspelen">⏸</button><button id="fNext" title="Volgend hoofdstuk (→)" aria-label="Volgend hoofdstuk">⏭</button><span id="fPos"></span><span class="sep"></span><button id="fVoice">Stem: aan</button><button id="fRec" title="Neemt de film in 1080p op en downloadt hem met ingebrande ondertitels, muziek en geluid. De stem kan de browser niet opnemen.">⬇ Video (ondertiteld, zonder stem)</button><span class="sep"></span><button id="fClose" title="Film sluiten (Esc)">✕ Sluiten</button></div>
  <div id="recNote" hidden>● Opname loopt. Laat dit tabblad open en zichtbaar tot de download start.</div>
  <div id="filmStart" hidden><div><button id="filmStartBtn">▶ Bekijk de film</button><p>${F.blurb||'Uitlegfilm met stem en ondertitels'}</p></div></div>
  <header id="top">
    <div class="title">
      <a href="index.html">← Bewegingsatlas · halte ${c.halte}</a>
      <h1 id="hTitle"></h1>
      <p id="hSub"></p>
    </div>
    <div class="tools">
      <div class="seg" role="group" aria-label="Stand">
        <button data-state="1" class="on"><kbd>1</kbd><span id="s1lbl">${st[0]}</span></button>
        <button data-state="2"><kbd>2</kbd><span id="s2lbl">${st[1]}</span></button>
        <button data-state="3"><kbd>3</kbd><span id="s3lbl">${st[2]}</span></button>
      </div>
      <button class="btn accent" id="bFilm" title="Uitlegfilm met stem en ondertitels (F)" aria-label="Uitlegfilm"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5v14l12-7z"/></svg><span class="t">Film</span></button>
      <button class="btn" id="bSound" title="Geluid (G)" aria-label="Geluid" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path id="sndWave" d="M17 9l4 6M21 9l-4 6"/></svg><span class="t">Geluid</span></button>
      <button class="btn" id="bPresent" title="Presenteren" aria-label="Presenteren" aria-pressed="false"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/></svg><span class="t">Presenteren</span></button>
    </div>
  </header>
  <nav id="left" aria-label="Bediening">
    <h4 id="ladderH">Zoomniveau</h4>
    <div id="ladder"></div>
    <div class="zrow"><button class="btn" id="zOut" title="Uitzoomen (−)">− Uit</button><button class="btn accent" id="zIn" title="Inzoomen (+)">+ In</button></div>
    <h4 id="layersH" class="none">Lagen</h4>
    <div id="layers"></div>
    <h4>Doen</h4>
    <div id="doen">
    <button class="btn accent" id="bQuiz">Speurtocht</button>
    <button class="btn" id="bHelp">Uitleg</button>
    <button class="btn" id="bPause" aria-pressed="false" title="Pauzeren of hervatten (spatie)">⏸ Pauze</button>
    <button class="btn" id="bSlow" aria-pressed="false" title="Slow motion (M)">Slow motion</button>
    <button class="btn" id="bRide" aria-pressed="false" title="Camerarit (C)">Camerarit</button>
    <button class="btn" id="bLabels">Labels: Stippen</button>
    <button class="btn" id="bQual">Beeld: Mooi</button>
    </div>
  </nav>
  <aside class="panel" id="info">
    <div class="ph"><div class="num" id="iNum">1</div><div><h2 id="iTitle"></h2><p class="lat" id="iLat"></p></div><button class="x pmin" aria-label="Paneel inklappen" aria-expanded="true">▾</button><button class="x" id="iClose" aria-label="Sluiten">×</button></div>
    <div class="tabs" id="iTabs" role="tablist"><button role="tab" data-tab="0" class="on" aria-selected="true">Uitleg</button><button role="tab" data-tab="1" aria-selected="false">In de sport</button><button role="tab" data-tab="2" aria-selected="false">Weetje</button><button role="tab" data-tab="3" aria-selected="false">Denkvraag</button></div>
    <div class="pb" id="iBody" role="tabpanel"></div>
    <div class="pf"><button id="iPrev">← Vorige</button><span id="iPos"></span><button id="iNext">Volgende →</button></div>
  </aside>
  <aside class="panel" id="quiz">
    <div class="ph"><div class="num" style="background:var(--gold);color:#1c1a17">?</div><div><h2>Speurtocht</h2><p class="lat" id="qSub">van zoeken tot nadenken</p></div><button class="x pmin" aria-label="Paneel inklappen" aria-expanded="true">▾</button><button class="x" id="qClose" aria-label="Sluiten">×</button></div>
    <div class="pb" id="qBody"></div>
    <div class="pf"><span id="qPos"></span><button id="qNext" disabled>Volgende →</button></div>
  </aside>
  <div id="hud">
    <div id="scale"><svg width="64" height="10" viewBox="0 0 64 10"><path d="M2 2v6h60V2" fill="none" stroke="#efe3c8" stroke-width="2"/></svg><b id="scB"></b><small id="scS"></small></div>
    <div id="hudMid"></div>
    <div id="cap"><b id="capT"></b><span id="capX"></span><div id="ctl"></div></div>
  </div>
  <div id="hint">${c.levels.length>1?'Sleep om te draaien · scroll om te zoomen · <b>+</b> en <b>−</b> om een niveau in of uit te zoomen · klik op een genummerd punt':'Sleep om te draaien · scroll om te zoomen · klik op een genummerd punt'}</div>
  <div class="modal" id="help" role="dialog" aria-modal="true" aria-labelledby="helpT"><div class="card">
    <h2 id="helpT" tabindex="-1">${hp.title||'Zo werkt de zoomreis'}</h2>
    ${hp.html||''}
    <h3>Sneltoetsen</h3>
    <table class="keys">${keys.map(k=>`<tr><td>${k[0]}</td><td>${k[1]}</td></tr>`).join('')}</table>
    <p style="margin-top:16px"><button class="btn accent" id="helpClose">Aan de slag</button></p>
    <p class="hint">${hp.note||'Vereenvoudigd didactisch model: aantallen, kleuren en verhoudingen zijn aangepast om het zichtbaar te maken.'}</p>
  </div></div>
  <div id="loader"><div><div class="spin"></div><h3>${(c.loader||[])[0]||'De halte wordt opgebouwd…'}</h3><p>${(c.loader||[])[1]||''}</p></div></div>
  <div id="err"><div><h2 style="font-family:Fraunces,serif">Het 3D-beeld werkt niet</h2><p id="errMsg" style="color:var(--muted);max-width:460px;margin:8px auto 16px">Je browser kon de 3D-weergave niet starten.</p><button class="btn accent" onclick="location.reload()">Opnieuw laden</button></div></div>
</div>`;}

/* ================= wiskunde en bouwstenen ================= */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const ease=t=>{t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;};
const D2R=Math.PI/180,TAU=Math.PI*2;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
const bump=(x,c,w)=>{let d=Math.abs(x-c);d=Math.min(d,1-d);return Math.exp(-(d/w)*(d/w));};
function sunflower(n){const a=[];for(let i=0;i<n;i++){const r=Math.sqrt((i+.5)/n),t=i*2.39996;a.push([r*Math.cos(t),r*Math.sin(t)]);}return a;}
function hexPts(rings,s){const p=[[0,0]];for(let r=1;r<=rings;r++){for(let k=0;k<6;k++){const a0=k*Math.PI/3,a1=(k+1)*Math.PI/3;const x0=r*s*Math.cos(a0),y0=r*s*Math.sin(a0),x1=r*s*Math.cos(a1),y1=r*s*Math.sin(a1);for(let j=0;j<r;j++)p.push([lerp(x0,x1,j/r),lerp(y0,y1,j/r)]);}}return p;}

function run(cfg){
const LEVELS=cfg.levels,NL=LEVELS.length;
document.title=cfg.docTitle||(cfg.name+' · Bewegingsatlas');
document.body.classList.add('lbl-dots','lv0');if(NL<2)document.body.classList.add('one');
document.body.insertAdjacentHTML('afterbegin',shellHTML(cfg));
if(!window.THREE||!THREE.OrbitControls){fail('De 3D-bibliotheek kon niet geladen worden. Controleer de internetverbinding en laad opnieuw.');return;}
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const AX=V(1,0,0),AY=V(0,1,0),AZ=V(0,0,1);
const R=mulberry32(cfg.seed||8);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- renderer ---------- */
const canvas=$('#c');let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:!!cfg.preserve});}catch(e){fail('Je browser of grafische kaart ondersteunt geen WebGL. Probeer Chrome of Edge.');return;}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('De grafische kaart heeft de 3D-weergave gestopt. Sluit andere tabbladen en laad opnieuw.');});
renderer.setClearColor(0,0);renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=cfg.exposure||1.08;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
const scene=new THREE.Scene();scene.fog=new THREE.Fog(LEVELS[0].fog||0x17222a,cfg.fogNear||40,cfg.fogFar||100);
const camera=new THREE.PerspectiveCamera(36,1,.05,300);camera.position.set(14,10,17);
const controls=new THREE.OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=cfg.minDist||1.5;controls.maxDistance=cfg.maxDist||60;
const hemi=new THREE.HemisphereLight(0xdfe9f0,0x2a2018,.6);scene.add(hemi);
const key=new THREE.DirectionalLight(0xfff1dc,1.2);key.position.set(9,17,11);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
Object.assign(key.shadow.camera,Object.assign({left:-13,right:13,top:13,bottom:-6,near:2,far:50},cfg.shadow||{}));key.shadow.bias=-.0006;key.shadow.normalBias=.03;scene.add(key);
const rim=new THREE.DirectionalLight(0x9cc4ff,.6);rim.position.set(-10,8,-12);scene.add(rim);
const fillL=new THREE.DirectionalLight(0xffd7b0,.3);fillL.position.set(-8,3,10);scene.add(fillL);

/* ---------- bouwstenen ---------- */
function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');draw(x,w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(rep)t.repeat.set(rep[0],rep[1]);return t;}
function mesh(geo,mat,pos,rot,scl,parent){const m=new THREE.Mesh(geo,mat);if(pos)m.position.set(pos[0],pos[1],pos[2]);if(rot)m.rotation.set(rot[0],rot[1],rot[2]);if(scl)m.scale.set(scl[0],scl[1],scl[2]);m.castShadow=true;m.receiveShadow=true;if(parent)parent.add(m);return m;}
const std=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.6},o||{}));
const glass=(c,op,o)=>std(c,Object.assign({transparent:true,opacity:op===undefined?.3:op,roughness:.3,depthWrite:false,side:THREE.DoubleSide},o||{}));
const glow=(c,e,i)=>new THREE.MeshStandardMaterial({color:c,emissive:e===undefined?c:e,emissiveIntensity:i||0,roughness:.4});
const add=(c,op)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:op===undefined?1:op,blending:THREE.AdditiveBlending,depthWrite:false});
const BAND=new THREE.CylinderGeometry(1,1,1,14,1);BAND.translate(0,.5,0);
const UCYL=new THREE.CylinderGeometry(1,1,1,8,1);UCYL.translate(0,.5,0);
const _y=V(0,0,0),_o=new THREE.Object3D();
function orient(m,a,b,w,d){_y.subVectors(b,a);const L=_y.length()||1e-5;_y.divideScalar(L);m.quaternion.setFromUnitVectors(AY,_y);m.position.copy(a);m.scale.set(w,L,d===undefined?w:d);return L;}
function segMatrix(a,b,r){_y.subVectors(b,a);const L=_y.length()||1e-5;_y.divideScalar(L);_o.quaternion.setFromUnitVectors(AY,_y);_o.position.copy(a);_o.scale.set(r,L,r);_o.updateMatrix();return _o.matrix;}
function placeMatrix(p,rot,s){_o.position.copy(p);if(rot&&rot.isQuaternion)_o.quaternion.copy(rot);else _o.rotation.set(rot?rot[0]:0,rot?rot[1]:0,rot?rot[2]:0);if(typeof s==='number')_o.scale.setScalar(s);else _o.scale.set(s?s[0]:1,s?s[1]:1,s?s[2]:1);_o.updateMatrix();return _o.matrix;}
const ZERO=new THREE.Matrix4().makeScale(0,0,0);
function inst(geo,mat,n){const m=new THREE.InstancedMesh(geo,mat,n);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.castShadow=true;m.receiveShadow=true;return m;}
function tube(pts,r,mat,parent,seg,rs){const cv=new THREE.CatmullRomCurve3(pts.map(p=>p.isVector3?p:V(p[0],p[1],p[2])));const m=mesh(new THREE.TubeGeometry(cv,seg||64,r,rs||10),mat,0,0,0,parent);m.userData.curve=cv;return m;}
// lathe: profiel als [[straal,hoogte],...] van onder naar boven
function lathe(prof,mat,parent,seg,pos,rot){return mesh(new THREE.LatheGeometry(prof.map(p=>new THREE.Vector2(Math.max(.001,p[0]),p[1])),seg||40),mat,pos,rot,0,parent);}
// bot: een schacht met twee verdikte uiteinden langs de y-as (lengte l, straal r)
function boneGeo(l,r,k1,k2,seg){const p=[];const N=28;for(let i=0;i<=N;i++){const t=i/N;let w=r*(1+.15*Math.sin(Math.PI*t));w+=r*(k1===undefined?.9:k1)*Math.pow(Math.max(0,1-t/.18),2)+r*(k2===undefined?.9:k2)*Math.pow(Math.max(0,(t-.82)/.18),2);p.push(new THREE.Vector2(Math.max(.001,i===0||i===N?w*.35:w),t*l));}const g=new THREE.LatheGeometry(p,seg||24);return g;}
const BONE=()=>std(0xefe3c8,{roughness:.55});
const CART=()=>std(0xbfe0ea,{roughness:.25,transparent:true,opacity:.92});
const MUSC=()=>std(0xb8473a,{roughness:.5});
const TEND=()=>std(0xf1ece0,{roughness:.35});

/* ---------- vloeren, sokkel en naambord ---------- */
function floorTex(kind){return canvasTex(1024,672,(x,w,h)=>{
  if(kind==='track'){x.fillStyle='#b4452f';x.fillRect(0,0,w,h);for(let i=0;i<9000;i++){x.fillStyle=`rgba(${150+R()*60|0},${40+R()*30|0},${30+R()*20|0},.5)`;x.fillRect(R()*w,R()*h,2,2);}x.fillStyle='#f2efe8';[110,250,390,530].forEach(y=>x.fillRect(0,y,w,6));}
  else if(kind==='lab'){x.fillStyle='#c9cdd0';x.fillRect(0,0,w,h);x.strokeStyle='rgba(80,90,96,.35)';x.lineWidth=2;for(let i=0;i<w;i+=64){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();}for(let j=0;j<h;j+=64){x.beginPath();x.moveTo(0,j);x.lineTo(w,j);x.stroke();}}
  else if(kind==='mat'){x.fillStyle='#2f5f9a';x.fillRect(0,0,w,h);for(let i=0;i<5000;i++){x.fillStyle=`rgba(255,255,255,${R()*.05})`;x.fillRect(R()*w,R()*h,2,2);}x.strokeStyle='rgba(10,20,40,.5)';x.lineWidth=5;for(let i=256;i<w;i+=256){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();}x.beginPath();x.moveTo(0,h/2);x.lineTo(w,h/2);x.stroke();}
  else if(kind==='split'){const s=w*.42;x.fillStyle='#c9cdd0';x.fillRect(0,0,s,h);x.strokeStyle='rgba(80,90,96,.35)';x.lineWidth=2;for(let i=0;i<s;i+=64){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();}for(let j=0;j<h;j+=64){x.beginPath();x.moveTo(0,j);x.lineTo(s,j);x.stroke();}x.fillStyle='#b4452f';x.fillRect(s,0,w-s,h);for(let i=0;i<7000;i++){x.fillStyle=`rgba(${150+R()*60|0},${40+R()*30|0},${30+R()*20|0},.5)`;x.fillRect(s+R()*(w-s),R()*h,2,2);}x.fillStyle='#f2efe8';[150,290,430,570].forEach(y=>x.fillRect(s,y,w-s,6));x.fillStyle='#2b2f33';x.fillRect(s-6,0,12,h);}
  else{// gymzaalvloer: planken met lijnen
    x.fillStyle='#c9965c';x.fillRect(0,0,w,h);for(let j=0;j<h;j+=28){const sh=(R()-.5)*18;x.fillStyle=`rgb(${201+sh|0},${150+sh|0},${92+sh*.6|0})`;x.fillRect(0,j,w,27);x.fillStyle='rgba(70,40,15,.25)';x.fillRect(0,j+27,w,1);for(let k=0;k<6;k++){const xx=R()*w;x.fillRect(xx,j,1,27);}}
    for(let i=0;i<2600;i++){x.fillStyle=`rgba(90,55,20,${R()*.08})`;x.fillRect(R()*w,R()*h,R()*40,1);}
    x.lineWidth=7;x.strokeStyle='#f1ede4';x.strokeRect(40,40,w-80,h-80);x.beginPath();x.moveTo(w/2,40);x.lineTo(w/2,h-40);x.stroke();x.beginPath();x.arc(w/2,h/2,90,0,TAU);x.stroke();
    x.strokeStyle='#e0b23a';x.beginPath();x.arc(40,h/2,190,-Math.PI/2,Math.PI/2);x.stroke();x.strokeStyle='#3d7fc2';x.beginPath();x.arc(w-40,h/2,190,Math.PI/2,Math.PI*1.5);x.stroke();}
});}
function plaqueTex(t1,t2){const t=canvasTex(1024,180,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#d8b46a');g.addColorStop(.5,'#b48b42');g.addColorStop(1,'#8f6a2e');x.fillStyle=g;x.fillRect(0,0,w,h);x.strokeStyle='rgba(60,40,10,.6)';x.lineWidth=4;x.strokeRect(10,10,w-20,h-20);x.fillStyle='#3b2a10';x.textAlign='center';
  let f=60;x.font=`700 ${f}px Georgia,serif`;while(x.measureText(t1).width>w-80&&f>28){f-=2;x.font=`700 ${f}px Georgia,serif`;}x.fillText(t1,w/2,92);let f2=34;x.font=`italic ${f2}px Georgia,serif`;while(t2&&x.measureText(t2).width>w-80&&f2>18){f2-=2;x.font=`italic ${f2}px Georgia,serif`;}if(t2)x.fillText(t2,w/2,146);});t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return t;}
const ENV={base:std(0x2a1d15,{roughness:.65}),edge:std(0x1a120d,{roughness:.5}),metal:std(0x5a6066,{metalness:.85,roughness:.3}),dark:std(0x24282c,{metalness:.5,roughness:.4})};
// de sokkel van de diorama: houten blok, vloer erop, koperen naambord voorop. Bovenkant op y = 0,08.
function base(o){o=o||{};const w=o.w||18.6,d=o.d||12.6,P=o.parent||scene;
  const nd=m=>{m.userData.noDim=true;return m;};
  nd(mesh(new THREE.BoxGeometry(w,1.1,d),ENV.base,[0,-.55,0],0,0,P));
  nd(mesh(new THREE.BoxGeometry(w+.6,.22,d+.6),ENV.edge,[0,-1,0],0,0,P));
  let ft=o.floor;if(typeof ft==='string'||!ft)ft=floorTex(ft||'gym');ft.wrapS=ft.wrapT=THREE.ClampToEdgeWrapping;
  nd(mesh(new THREE.BoxGeometry(w-1,.08,d-1),[ENV.base,ENV.base,std(0xffffff,{map:ft,roughness:.6}),ENV.base,ENV.base,ENV.base],[0,.04,0],0,0,P)).castShadow=false;
  if(o.plaque){const pw=o.plaqueW||5.4;nd(mesh(new THREE.BoxGeometry(pw,.9,.06),[ENV.metal,ENV.metal,ENV.metal,ENV.metal,std(0xffffff,{map:plaqueTex(o.plaque[0],o.plaque[1]),metalness:.6,roughness:.35}),ENV.metal],[o.plaqueX||0,-.55,d/2+.03],0,0,P));}
  return {top:.08,w,d};}
// een standaard (paal met voet) om een anatomisch model op te zetten
function stand(o){o=o||{};const P=o.parent||scene,x=o.x||0,z=o.z||0,h=o.h||4;const g=new THREE.Group();g.position.set(x,0,z);P.add(g);
  mesh(new THREE.CylinderGeometry(o.foot||1.3,(o.foot||1.3)*1.08,.2,40),ENV.dark,[0,.18,0],0,0,g);mesh(new THREE.CylinderGeometry(.09,.09,h,14),ENV.metal,[0,.28+h/2,0],0,0,g);
  const top=new THREE.Group();top.position.y=.28+h;g.add(top);return {g,top};}

/* ---------- de sporter ---------- */
// Figuur kijkt naar +z, staat op y=0 (voeten), lengte ongeveer 2,2 eenheden.
// Hoeken in radialen. heup x<0: been naar voren (flexie). knie x>0: buigen. enkel x<0: voet omhoog (dorsaalflexie), enkel z: inversie/eversie.
// schouder x<0: arm naar voren heffen; rechterschouder z<0 en linkerschouder z>0: arm zijwaarts heffen (abductie); schouder y: rotatie. elleboog x<0: buigen.
// romp: lean (x, naar voren), side (z), twist (y). Getallen of [x,y,z] voor heupen, schouders, enkels en polsen.
function figure(o){o=o||{};
  const sk=std(o.skin||0xb57a55),shirt=std(o.shirt||0xd8642a,{roughness:.7}),shorts=std(o.shorts||0x1d1f24,{roughness:.8}),shoe=std(o.shoe||0xf3f1ec,{roughness:.5}),sole=std(o.sole||0x2d6fd1),hairM=std(o.hair||0x1d140e,{roughness:.9});
  const C=(r,l)=>new THREE.CapsuleGeometry(r,l,4,12);
  const A=.62,B=.6,ankH=.09;
  const root=new THREE.Group();(o.parent||scene).add(root);if(o.pos)root.position.set(o.pos[0],o.pos[1],o.pos[2]);if(o.rotY)root.rotation.y=o.rotY;if(o.scale)root.scale.setScalar(o.scale);
  const pelvis=new THREE.Group();root.add(pelvis);
  mesh(C(.13,.16),shorts,[0,0,0],[0,0,Math.PI/2],[1,1,.85],pelvis);
  const torso=new THREE.Group();torso.position.y=.04;pelvis.add(torso);
  mesh(C(.12,.22),shirt,[0,.2,0],0,[1.05,1,.8],torso);mesh(C(.15,.2),shirt,[0,.47,0],[0,0,Math.PI/2],[1,1.05,.72],torso);
  const neck=new THREE.Group();neck.position.y=.64;torso.add(neck);mesh(new THREE.CylinderGeometry(.05,.055,.1,10),sk,[0,0,0],0,0,neck);
  const head=new THREE.Group();head.position.y=.14;neck.add(head);
  mesh(new THREE.SphereGeometry(.125,18,14),sk,[0,0,0],0,[1,1.1,1],head);mesh(new THREE.SphereGeometry(.13,18,12,0,TAU,0,Math.PI*.5),hairM,[0,.02,-.01],[-.2,0,0],[1.02,1,1.05],head);
  function arm(s){const sh=new THREE.Group();sh.position.set(s*.25,.55,0);torso.add(sh);mesh(C(.048,.24),sk,[0,-.16,0],0,0,sh);const el=new THREE.Group();el.position.y=-.32;sh.add(el);mesh(C(.043,.21),sk,[0,-.14,0],0,0,el);const wr=new THREE.Group();wr.position.y=-.29;el.add(wr);mesh(new THREE.SphereGeometry(.05,10,8),sk,[0,-.02,.01],0,[1,1.2,.8],wr);return {sh,el,wr};}
  function leg(s){const hip=new THREE.Group();hip.position.set(s*.11,-.02,0);pelvis.add(hip);mesh(new THREE.CylinderGeometry(.095,.088,.24,12),shorts,[0,-.1,0],0,0,hip);mesh(C(.072,.44),sk,[0,-.31,0],0,0,hip);
    const kn=new THREE.Group();kn.position.y=-A;hip.add(kn);mesh(C(.06,.44),sk,[0,-.28,0],0,0,kn);
    const an=new THREE.Group();an.position.y=-B;kn.add(an);mesh(new THREE.BoxGeometry(.11,.08,.28),shoe,[0,-.045,.07],0,0,an);mesh(new THREE.BoxGeometry(.115,.025,.29),sole,[0,-.09,.07],0,0,an);return {hip,kn,an};}
  const aR=arm(-1),aL=arm(1),lR=leg(-1),lL=leg(1);
  const F={root,pelvis,torso,neck,head,aR,aL,lR,lL,A,B,ankH,mats:{sk,shirt,shorts,shoe,sole,hair:hairM},standY:ankH+A+B+.02};
  const r3=(g,v)=>{if(v===undefined)return;if(typeof v==='number')g.rotation.set(v,0,0);else g.rotation.set(v[0]||0,v[1]||0,v[2]||0);};
  F.pose=function(p){p=p||{};pelvis.position.set(p.px||0,p.py===undefined?F.standY:p.py,p.pz||0);pelvis.rotation.set(p.pelvisX||0,p.pelvisY||0,p.pelvisZ||0);
    torso.rotation.set(p.lean||0,p.twist||0,p.side||0);head.rotation.set(p.head||0,p.headY||0,0);
    r3(lR.hip,p.hipR||0);r3(lL.hip,p.hipL||0);lR.kn.rotation.x=p.kneeR||0;lL.kn.rotation.x=p.kneeL||0;r3(lR.an,p.ankR||0);r3(lL.an,p.ankL||0);
    r3(aR.sh,p.shR===undefined?[.05,0,-.1]:p.shR);r3(aL.sh,p.shL===undefined?[.05,0,.1]:p.shL);aR.el.rotation.x=p.elbR===undefined?-.15:p.elbR;aL.el.rotation.x=p.elbL===undefined?-.15:p.elbL;r3(aR.wr,p.wrR||0);r3(aL.wr,p.wrL||0);};
  F.pose({});return F;}
// meng twee houdingen (getallen en [x,y,z])
function mixPose(A,B,t){const o={};const ks=new Set(Object.keys(A).concat(Object.keys(B)));ks.forEach(k=>{const a=A[k],b=B[k];if(Array.isArray(a)||Array.isArray(b)){const aa=Array.isArray(a)?a:[a||0,0,0],bb=Array.isArray(b)?b:[b||0,0,0];o[k]=[0,1,2].map(i=>lerp(aa[i]||0,bb[i]||0,t));}else o[k]=lerp(a===undefined?b:a,b===undefined?a:b,t);});return o;}

/* ---------- toestand ---------- */
const S={lvl:0,state:1,stT:0,clock:0,paused:false,xSpeed:1,grade:2,tearFired:false,quality:'hi',zooming:false};
const W={};
const groups=LEVELS.map(()=>{const g=new THREE.Group();g.visible=false;scene.add(g);return g;});
function hudSet(html){$('#hudMid').innerHTML=html;}
let capLast='',capAt=-9;
function capSet(t,x){const k=t+'|'+x;if(k===capLast)return;capLast=k;capAt=S.clock;$('#capT').textContent=t;$('#capX').innerHTML=x;}
// voor teksten die snel zouden wisselen: een nieuwe tekst verschijnt pas als de vorige minstens `min` seconden stond
function capSoft(t,x,min){const k=t+'|'+x;if(k===capLast)return;if(S.clock-capAt<(min===undefined?2.6:min)&&capLast.split('|')[0]===t)return;capSet(t,x);}
function ctlSet(html){$('#ctl').innerHTML=html;}
function stName(n,lv){const L=LEVELS[lv===undefined?S.lvl:lv];return n===1?(L.s1||'Rust'):n===2?(L.s2||'Belasting'):(L.s3||'Blessure');}
function stateText(){return 'Stand '+S.state+' · '+stName(S.state);}
function bars(names){return `<div id="bars">${names.map((n,i)=>`<span class="n">${n}</span><span class="bar"><i id="b${i+1}"></i></span><span class="m" id="m${i+1}"></span>`).join('')}</div>`;}
function bar(i,frac,txt,cls,bg){const b=$('#b'+i);if(!b)return;b.style.width=Math.round(clamp(frac,0,1)*100)+'%';b.style.background=bg||'';const m=$('#m'+i);if(txt!==undefined)m.textContent=txt;m.className='m '+(cls||'');}
function stepsHTML(names){return `<div id="steps">${names.map((s,i)=>`<span data-s="${i}">${s}</span>`).join('')}</div>`;}
function stepOn(i){$$('#steps span').forEach(e=>e.classList.toggle('on',+e.dataset.s===i));}
let shakeV=0;const FILM={on:false,si:-1,li:-1,lt:0,ld:0,voice:true,vDone:true,playing:false,camT:0,view:null,bars:0,cap:'',capA:0,chap:'',chapA:0,title:null,titleA:0,flashA:0,lensT:9,lensName:'',steps:null,rec:null,end:false,waiting:false,idle:0};
function flash(o){o=o||{};if(reduced){if(o.sound!==false)SND.rip(o.big!==false);FILM.flashA=.5;return;}const f=$('#flash');f.style.transition='none';f.style.opacity=o.a===undefined?1:o.a;requestAnimationFrame(()=>{f.style.transition='opacity 1.1s';f.style.opacity=0;});if(o.sound!==false)SND.rip(o.big!==false);shakeV=o.shake===undefined?.45:o.shake;FILM.flashA=1;}

/* ---------- geluid (alles in de browser gegenereerd) ---------- */
let H=[];
const SND=(function(){let C=null,master,rev,noiseBuf,on=false,drone=null,mus=null,musOn=false,dest=null;
  const CH=[[110,164.8,220,261.6,55],[87.3,130.8,174.6,220,43.65],[130.8,196,261.6,329.6,65.4],[98,146.8,196,246.9,49]];
  function init(){if(C)return;C=new (window.AudioContext||window.webkitAudioContext)();master=C.createGain();master.gain.value=0;master.connect(C.destination);
    rev=C.createConvolver();const len=C.sampleRate*2.2|0;const ir=C.createBuffer(2,len,C.sampleRate);for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);}rev.buffer=ir;const rg=C.createGain();rg.gain.value=.45;rev.connect(rg);rg.connect(master);
    noiseBuf=C.createBuffer(1,C.sampleRate*2,C.sampleRate);const nd=noiseBuf.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
    const bb=C.createBuffer(1,C.sampleRate*4,C.sampleRate);const bd=bb.getChannelData(0);let l=0;for(let i=0;i<bd.length;i++){l=(l+.02*(Math.random()*2-1))/1.02;bd[i]=l*3.2;}
    const src=C.createBufferSource();src.buffer=bb;src.loop=true;const lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=380;const g=C.createGain();g.gain.value=.1;src.connect(lp);lp.connect(g);g.connect(master);src.start();
    const o=C.createOscillator();o.frequency.value=55;const o2=C.createOscillator();o2.frequency.value=82.4;const dg=C.createGain();dg.gain.value=0;o.connect(dg);o2.connect(dg);dg.connect(master);o.start();o2.start();drone=dg;}
  function out(n,wet){n.connect(master);if(wet){const w=C.createGain();w.gain.value=wet;n.connect(w);w.connect(rev);}}
  function env(g,t0,a,peak,d){g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t0+a);g.gain.exponentialRampToValueAtTime(.0001,t0+a+d);}
  function thump(f,dur,vol,t0){t0=t0||C.currentTime;const o=C.createOscillator();o.frequency.setValueAtTime(f,t0);o.frequency.exponentialRampToValueAtTime(f*.45,t0+dur);const g=C.createGain();env(g,t0,.005,vol,dur);o.connect(g);out(g,.3);o.start(t0);o.stop(t0+dur+.05);}
  function noise(dur,type,freq,q,vol,att,t0,f2){t0=t0||C.currentTime;const s=C.createBufferSource();s.buffer=noiseBuf;const f=C.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(freq,t0);if(f2)f.frequency.exponentialRampToValueAtTime(f2,t0+att+dur);f.Q.value=q;const g=C.createGain();env(g,t0,att,vol,dur);s.connect(f);f.connect(g);out(g,.35);s.start(t0,Math.random());s.stop(t0+att+dur+.05);}
  function tone(f,dur,vol,type,t0,f2){t0=t0||C.currentTime;const o=C.createOscillator();o.type=type||'sine';o.frequency.setValueAtTime(f,t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+dur);const g=C.createGain();env(g,t0,.01,vol,dur);o.connect(g);out(g,.25);o.start(t0);o.stop(t0+dur+.05);}
  const api={thump:(f,d,v,t)=>{if(on&&C)thump(f,d,v,t);},noise:(d,ty,f,q,v,a,t,f2)=>{if(on&&C)noise(d,ty,f,q,v,a,t,f2);},tone:(f,d,v,ty,t,f2)=>{if(on&&C)tone(f,d,v,ty,t,f2);},get now(){return C?C.currentTime:0;},get on(){return on;}};
  return {api,
    set(v){init();on=v;C.resume();master.gain.setTargetAtTime(v?.9:0,C.currentTime,.15);},
    get on(){return on;},
    tick(){if(!on||!C)return;this.musicTick();drone.gain.setTargetAtTime(LEVELS[S.lvl].drone?.035:0,C.currentTime,.5);const h=H[S.lvl];if(h&&h.sound){try{h.sound(api);}catch(e){}}},
    click(p){if(!on||!C)return;const t=C.currentTime;const o=C.createOscillator();o.frequency.value=900*(p||1);const g=C.createGain();env(g,t,.003,.04,.06);o.connect(g);out(g,0);o.start(t);o.stop(t+.1);},
    stroke(){if(!on||!C)return;thump(220,.12,.12);noise(.05,'bandpass',2400,4,.08,.002);},
    split(){if(!on||!C)return;noise(.06,'highpass',4000,.7,.12,.002);},
    rip(big){if(!on||!C)return;const t=C.currentTime;noise(big?.35:.22,'bandpass',3200,1.2,big?.5:.3,.004,t,500);noise(.04,'highpass',2500,.7,.4,.001,t);if(big){thump(70,.4,.7,t);noise(1.2,'bandpass',600,1,.14,.25,t+.3);}},
    whoosh(dir){if(!on||!C)return;noise(.7,'bandpass',dir>0?400:2400,1.5,.18,.2,C.currentTime,dir>0?2400:400);},
    music(v){init();if(v&&!mus){const g=C.createGain();g.gain.value=0;const lp=C.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1100;lp.connect(g);out(g,.7);
        const oscs=[0,1,2,3,4].map(i=>{const o=C.createOscillator();o.type=i<3?'triangle':'sine';o.detune.value=i===1?6:i===2?-5:0;const og=C.createGain();og.gain.value=i===4?.35:.2;o.connect(og);og.connect(lp);o.start();return o;});mus={g,oscs,i:0,next:0};}
      musOn=v;if(mus)mus.g.gain.setTargetAtTime(v?.075:0,C.currentTime,v?1.6:.5);},
    musicTick(){if(!mus||!musOn||!C)return;const now=C.currentTime;if(now<mus.next)return;const ch=CH[mus.i%CH.length];mus.oscs.forEach((o,i)=>o.frequency.setTargetAtTime(ch[i],now,.35));mus.i++;mus.next=now+6.4;},
    tap(){init();if(!dest){dest=C.createMediaStreamDestination();master.connect(dest);}return dest.stream;},
  };})();
Object.assign(SND.api,{rip:b=>SND.rip(b),click:p=>SND.click(p),stroke:()=>SND.stroke(),split:()=>SND.split(),whoosh:d=>SND.whoosh(d)});

/* ---------- de halte bouwt haar scènes ---------- */
const K={THREE,V,AX,AY,AZ,R,rand:mulberry32,clamp,lerp,smooth,ease,bump,D2R,TAU,sunflower,hexPts,
  scene,camera,renderer,controls,key,hemi,rim,fill:fillL,groups,W,S,SND:SND.api,FILM,
  canvasTex,mesh,std,glass,glow,add,BAND,UCYL,orient,segMatrix,placeMatrix,ZERO,inst,tube,lathe,boneGeo,BONE,CART,MUSC,TEND,ENV,
  floorTex,plaqueTex,base,stand,figure,mixPose,
  capSet,capSoft,hudSet,ctlSet,bars,bar,stepsHTML,stepOn,stName,stateText,flash,shake:v=>{if(!reduced)shakeV=v;},reduced,
  setState:n=>setState(n),goLevel:(n,a)=>goLevel(n,a),flyTo:(p,t,d)=>flyTo(p,t,d),$,$$};
const B=cfg.build(K)||{};
H=B.levels||[];while(H.length<NL)H.push({step(){}});
const POINTS=B.points||[],TAGS=B.tags||[],QUIZ=B.quiz||[],SCENES=(B.film||{}).scenes||[],FCFG=Object.assign({},cfg.film||{},B.film||{}),LAYERS=B.layers||[];

/* ---------- lagen (aan/uit per zoomniveau) ---------- */
LAYERS.forEach(l=>{if(l.on===undefined)l.on=true;l.on0=l.on;});
// in de speurtocht en de film staan de lagen op hun beginstand, zodat letters en uitleg nooit bij een verborgen onderdeel staan
let layKeep=null;
function layDefaults(){if(layKeep)return;layKeep=LAYERS.map(l=>l.on);let ch=false;LAYERS.forEach(l=>{if(l.on!==l.on0){l.on=l.on0;applyLayer(l);ch=true;}});if(ch)buildLayers();}
function layRestore(){if(!layKeep)return;const k=layKeep;layKeep=null;let ch=false;LAYERS.forEach((l,i)=>{if(l.on!==k[i]){l.on=k[i];applyLayer(l);ch=true;}});if(ch)buildLayers();}
function applyLayer(l){(call(l.objs,[])||[]).forEach(o=>o.visible=l.on);if(l.set){try{l.set(l.on);}catch(e){console.error(e);}}}
function layerOff(name){const l=LAYERS.find(x=>x.name===name);return !!(l&&!l.on);}
function buildLayers(){const box=$('#layers'),mine=LAYERS.filter(l=>l.lv===undefined||l.lv===S.lvl);$('#layersH').classList.toggle('none',!mine.length);
  box.innerHTML=mine.map(l=>`<button class="btn lay ${l.on?'on':''}" data-lay="${esc(l.name)}" aria-pressed="${l.on}">${esc(l.name)}</button>`).join('');
  $$('#layers [data-lay]').forEach(b=>b.addEventListener('click',()=>{const l=LAYERS.find(x=>x.name===b.dataset.lay);l.on=!l.on;applyLayer(l);b.classList.toggle('on',l.on);b.setAttribute('aria-pressed',l.on);if(curPoint&&curPoint.layer===l.name&&!l.on)closeInfo();}));}

/* ---------- focus: bij een geopend punt worden de andere delen doorzichtig ---------- */
const dimCache=new Map();let dimmed=[];
function dimMat(m){let d=dimCache.get(m);if(!d){d=m.clone();d.transparent=true;d.opacity=Math.min(m.opacity===undefined?1:m.opacity,.14);d.depthWrite=false;if(d.emissive)d.emissiveIntensity=0;dimCache.set(m,d);}return d;}
function clearFocus(){dimmed.forEach(([o,m])=>{o.material=m;});dimmed=[];}
function applyFocus(p){clearFocus();const f=p&&call(p.focus,null);if(!f||!f.length)return;const keep=new Set();f.forEach(o=>o&&o.traverse(c=>keep.add(c)));
  groups[p.lv].traverse(o=>{if(!(o.isMesh||o.isPoints||o.isLine)||keep.has(o)||o.userData.noDim||Array.isArray(o.material))return;dimmed.push([o,o.material]);o.material=dimMat(o.material);});}

/* ---------- HUD en standen ---------- */
function buildHUD(){const L=LEVELS[S.lvl],h=H[S.lvl];$('#scB').textContent=L.scale||'';$('#scS').textContent=L.sc||'';
  $('#s1lbl').textContent=stName(1);$('#s2lbl').textContent=stName(2);$('#s3lbl').textContent=stName(3);
  hudSet(h.hud?h.hud():'');let c='';
  if(S.state===3&&h.grades)c+=`<label>Graad</label>${[1,2,3].map(g=>`<button data-g="${g}" class="${S.grade===g?'on':''}">${g}</button>`).join('')}`;
  if(S.state===3&&h.replay!==false)c+='<button id="bReplay">↻ Opnieuw</button>';
  if(h.ctl)c+=h.ctl();ctlSet(c);
  $$('#ctl [data-g]').forEach(b=>b.addEventListener('click',()=>{S.grade=+b.dataset.g;setState(3);}));
  const br=$('#bReplay');if(br)br.addEventListener('click',()=>setState(3));
  if(h.bind)h.bind();}
function setState(n){S.state=n;S.stT=0;S.tearFired=false;S.paused=false;
  $$('.seg button').forEach(b=>b.classList.toggle('on',+b.dataset.state===n));
  H.forEach((h,i)=>{if(h.reset){try{h.reset(n,i===S.lvl);}catch(e){console.error(e);}}});
  buildHUD();pauseUI();SND.click();}

/* ---------- punten en labels ---------- */
const mkWrap=$('#markers');
const MK=POINTS.map((p,i)=>{const b=document.createElement('button');b.className='mk';b.innerHTML=`<b>${i+1}</b><span>${p.name}</span>`;b.setAttribute('aria-label',`Punt ${i+1}: ${p.name}`);b.addEventListener('click',e=>{e.stopPropagation();openPoint(i);});mkWrap.appendChild(b);return b;});
TAGS.forEach(t=>{t.el=document.createElement('div');t.el.className='tg '+(t.cls||'');if(t.col)t.el.style.color=t.col;mkWrap.appendChild(t.el);});
let QMK=[];const _p=V(0,0,0);
function project(v,el,off){if(!v){el.style.display='none';return;}_p.copy(v).project(camera);if(_p.z>1||_p.z<-1){el.style.display='none';return;}el.style.display='';const x=(_p.x*.5+.5)*innerWidth,y=(-_p.y*.5+.5)*innerHeight;el.style.transform=`translate(${x-(off||13)}px,${y-(off||13)}px)`;}
const call=(f,d)=>{try{return typeof f==='function'?f():f;}catch(e){return d;}};
function updateMarkers(){POINTS.forEach((p,i)=>{if(p.lv!==S.lvl||S.zooming||(p.layer&&layerOff(p.layer))){MK[i].style.display='none';return;}project(call(p.at),MK[i]);});
  TAGS.forEach(t=>{if(t.lv!==S.lvl||S.zooming||(t.show&&!call(t.show,false))){t.el.style.display='none';return;}t.el.textContent=call(t.txt,'');project(call(t.at),t.el,12);});
  QMK.forEach(q=>{if(S.zooming){q.el.style.display='none';return;}project(call(q.fn),q.el);});}

/* ---------- infopaneel ---------- */
let curPoint=null,tab=0;
function panelState(){const open=$('#info').classList.contains('open')||quizOpen;document.body.classList.toggle('panel-open',open);if(!open)setMin(false);}
// op een telefoon klap je een paneel in tot de kop, zodat je het model en de HUD weer ziet
function setMin(on){document.body.classList.toggle('panel-min',on);$$('.panel').forEach(p=>p.classList.toggle('min',on));$$('button.pmin').forEach(b=>{b.textContent=on?'▴':'▾';b.setAttribute('aria-label',on?'Paneel uitklappen':'Paneel inklappen');b.setAttribute('aria-expanded',!on);});}
$$('button.pmin').forEach(b=>b.addEventListener('click',()=>setMin(!document.body.classList.contains('panel-min'))));
function openPoint(i,startTab){closeQuiz();const p=POINTS[i];if(!p)return;const go=()=>{curPoint=p;p.i=i;$('#iNum').textContent=i+1;$('#iTitle').textContent=p.name;$('#iLat').textContent=p.lat||'';
  if(p.layer&&layerOff(p.layer)){const l=LAYERS.find(x=>x.name===p.layer);l.on=true;applyLayer(l);buildLayers();}
  $('#iPos').textContent=`${i+1} / ${POINTS.length}`;$('#iPrev').disabled=i===0;$('#iNext').disabled=i===POINTS.length-1;MK.forEach((m,j)=>m.classList.toggle('on',j===i));setTab(startTab||0);$('#info').classList.add('open');setMin(false);panelState();
  if(p.state&&S.state!==p.state)setState(p.state);applyFocus(p);if(p.view)flyTo(p.view[0],p.view[1]);SND.click();try{history.replaceState(null,'','#'+(i+1));}catch(e){}};
  if(p.lv!==S.lvl){goLevel(p.lv,go);}else go();}
function setTab(n){tab=n;$$('#iTabs button').forEach(b=>{const on=+b.dataset.tab===n;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);});$('#iBody').innerHTML=curPoint.tabs[n]||'';}
function closeInfo(){if(!curPoint&&!$('#info').classList.contains('open'))return;$('#info').classList.remove('open');curPoint=null;MK.forEach(m=>m.classList.remove('on'));clearFocus();panelState();try{if(/^#\d/.test(location.hash))history.replaceState(null,'',location.pathname+location.search);}catch(e){}}
// klik op het model (zonder te slepen) opent het punt van dat onderdeel
const ray=new THREE.Raycaster(),_m2=new THREE.Vector2();let downAt=null;
canvas.addEventListener('pointerdown',e=>{downAt=[e.clientX,e.clientY];});
canvas.addEventListener('pointerup',e=>{if(!downAt)return;const moved=Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1]);downAt=null;if(moved>6||quizOpen||FILM.on||S.zooming)return;
  _m2.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1);ray.setFromCamera(_m2,camera);let best=null;
  POINTS.forEach((p,i)=>{if(p.lv!==S.lvl||(p.layer&&layerOff(p.layer)))return;const objs=call(p.pick,null)||call(p.focus,null);if(!objs||!objs.length)return;const hits=ray.intersectObjects(objs.filter(Boolean),true).filter(h=>h.object.visible);if(hits.length&&(!best||hits[0].distance<best.d))best={i,d:hits[0].distance};});
  if(best)openPoint(best.i);});
$$('#iTabs button').forEach(b=>b.addEventListener('click',()=>setTab(+b.dataset.tab)));
$('#iClose').addEventListener('click',closeInfo);
$('#iPrev').addEventListener('click',()=>{if(curPoint&&curPoint.i>0)openPoint(curPoint.i-1);});
$('#iNext').addEventListener('click',()=>{if(curPoint&&curPoint.i<POINTS.length-1)openPoint(curPoint.i+1);});
function next(){if(quizOpen)return;if(!curPoint){let i=POINTS.findIndex(p=>p.lv===S.lvl);if(i<0)i=0;openPoint(i);return;}if(tab<3)setTab(tab+1);else if(curPoint.i<POINTS.length-1)openPoint(curPoint.i+1);}
function prev(){if(quizOpen||!curPoint)return;if(tab>0)setTab(tab-1);else if(curPoint.i>0){openPoint(curPoint.i-1,3);}}

/* ---------- speurtocht ---------- */
let quizOpen=false,qi=0,qres=[],qDone=false;
$('#qSub').textContent=`${QUIZ.length} opdrachten · van zoeken tot nadenken`;
// de voortgang blijft staan als je de speurtocht sluit; pas na de laatste opdracht begin je opnieuw
function openQuiz(){closeInfo();quizOpen=true;document.body.classList.add('quiz-on');$('#quiz').classList.add('open');layDefaults();if(!qres.length||qi>=QUIZ.length){qi=0;qres=QUIZ.map(()=>null);}renderQ();setMin(false);panelState();}
function closeQuiz(){if(!quizOpen)return;quizOpen=false;document.body.classList.remove('quiz-on');$('#quiz').classList.remove('open');clearQMK();layRestore();panelState();}
function clearQMK(){QMK.forEach(q=>q.el.remove());QMK=[];document.body.classList.remove('q-find');}
function dots(){return QUIZ.map((q,j)=>`<i class="${j===qi?'cur':qres[j]===true?'ok':qres[j]===false?'no':''}"></i>`).join('');}
function renderQ(){clearQMK();qDone=false;$('#qNext').disabled=true;
  if(qi>=QUIZ.length){const ok=qres.filter(x=>x===true).length,closed=QUIZ.filter(q=>q.type!=='open').length;$('#qBody').innerHTML=`<div class="dots">${dots()}</div><p class="qprompt">Klaar!</p><p>Je had <b>${ok} van de ${closed}</b> gesloten vragen in één keer goed.</p>${cfg.quizEnd||'<p>Bespreek de slotvraag met je groep of docent.</p>'}<p><button class="btn" id="qAgain">Opnieuw beginnen</button></p>`;
    $('#qAgain').addEventListener('click',()=>{qi=0;qres=QUIZ.map(()=>null);renderQ();});$('#qPos').textContent='';$('#qNext').style.display='none';return;}
  $('#qNext').style.display='';const q=QUIZ[qi];$('#qPos').textContent=`Opdracht ${qi+1} van ${QUIZ.length}`;
  const prep=()=>{if(q.state&&S.state!==q.state)setState(q.state);if(q.view)flyTo(q.view[0],q.view[1]);};
  if(q.lv!==undefined&&q.lv!==S.lvl)goLevel(q.lv,prep);else prep();
  let h=`<div class="dots">${dots()}</div><p class="qprompt"><span class="qtag">${q.t}</span>${q.q}</p>`;
  if(q.type==='find'){document.body.classList.add('q-find');h+='<p class="hint">Klik op een van de gele letters A–D in het beeld.</p><div id="qfb" role="status"></div>';$('#qBody').innerHTML=h;
    q.opts.forEach((fn,j)=>{const el=document.createElement('button');el.className='mk q';el.innerHTML=`<b>${'ABCD'[j]}</b>`;el.setAttribute('aria-label','Antwoord '+'ABCD'[j]);mkWrap.appendChild(el);
      el.addEventListener('click',e=>{e.stopPropagation();if(qDone)return;if(qres[qi]===null)qres[qi]=j===q.ok;el.classList.add(j===q.ok?'right':'wrong');$('#qfb').innerHTML=`<div class="fb ${j===q.ok?'ok':'no'}">${q.fb[j]}</div>`;
        if(j===q.ok){qDone=true;$('#qNext').disabled=false;}SND.click(j===q.ok?1.5:.7);});QMK.push({el,fn});});}
  else if(q.type==='mc'){h+='<div class="opts">'+q.opts.map((o,j)=>`<button data-j="${j}"><b>${'ABCD'[j]}</b>${o}</button>`).join('')+'</div><div id="qfb" role="status"></div>';$('#qBody').innerHTML=h;
    $$('#qBody .opts button').forEach(b=>b.addEventListener('click',()=>{if(qDone)return;const j=+b.dataset.j;if(qres[qi]===null)qres[qi]=j===q.ok;b.classList.add(j===q.ok?'right':'wrong');
      if(j===q.ok){qDone=true;$('#qNext').disabled=false;$$('#qBody .opts button').forEach(x=>x.disabled=true);}
      $('#qfb').innerHTML=`<div class="fb ${j===q.ok?'ok':'no'}">${j===q.ok?'<b>Goed.</b> '+q.ex:'<b>Nog niet.</b> '+((q.why&&q.why[j])||q.hint||'Kijk nog eens goed en probeer opnieuw.')}</div>`;SND.click(j===q.ok?1.5:.7);}));}
  else{h+='<textarea aria-label="Jouw antwoord" placeholder="Schrijf je antwoord hier. Het wordt nergens opgeslagen."></textarea><p><button class="btn" id="qShow">Toon een modelantwoord</button></p><div id="qfb" role="status"></div>';$('#qBody').innerHTML=h;
    $('#qShow').addEventListener('click',()=>{$('#qfb').innerHTML=`<div class="fb ok">${q.model}</div>`;qres[qi]='open';});$('#qNext').disabled=false;}}
$('#qNext').addEventListener('click',()=>{qi++;renderQ();});$('#qClose').addEventListener('click',closeQuiz);$('#bQuiz').addEventListener('click',()=>quizOpen?closeQuiz():openQuiz());

/* ---------- camera en zoomen ---------- */
let fly=null,ride=false,rideA=0;
function flyTo(pos,tgt,dur){const p=V(...pos),t=V(...tgt);const asp=innerWidth/innerHeight;if(asp<1)p.sub(t).multiplyScalar(Math.min(1.9,1/Math.pow(asp,.85))).add(t);
  fly={p0:camera.position.clone(),t0:controls.target.clone(),p1:p,t1:t,k:0,dur:reduced?.01:(dur||1.4)};ride=false;}
controls.addEventListener('start',()=>{fly=null;ride=false;});
const ladder=$('#ladder');LEVELS.forEach((L,i)=>{const b=document.createElement('button');b.className='rung';b.innerHTML=`<b>${L.name}</b><small>${L.scale||''}</small>`;b.addEventListener('click',()=>goLevel(i));ladder.appendChild(b);});
function showLevel(n){groups.forEach((g,i)=>g.visible=i===n);S.lvl=n;document.body.className=document.body.className.replace(/\blv\d\b/,'')+' lv'+n;
  $$('.rung').forEach((r,i)=>r.classList.toggle('on',i===n));const L=LEVELS[n];$('#hTitle').textContent=L.title;$('#hSub').innerHTML=L.sub||'';
  const bg=L.bg||['#2c3a42','#18232a','#0d1316'];const app=$('#app');app.style.setProperty('--bg0',bg[0]);app.style.setProperty('--bgm',bg[1]);app.style.setProperty('--bg1',bg[2]);
  key.castShadow=(L.shadows===undefined?n===0:L.shadows)&&S.quality==='hi';scene.fog.color.set(L.fog||0x17222a);hemi.intensity=L.hemi===undefined?(n===0?.6:.75):L.hemi;
  if(curPoint&&curPoint.lv!==n)closeInfo();setState(S.state);buildLayers();if(H[n].onShow){try{H[n].onShow();}catch(e){console.error(e);}}}
// een verzoek tijdens het zoomen (snel Volgende in de speurtocht, een filmscène) wacht tot de zoom klaar is
let goQ=null;
function goLevel(n,after){if(n<0||n>=NL)return;if(S.zooming){goQ=[n,after];return;}if(n===S.lvl){after&&after();return;}
  const dir=n>S.lvl?1:-1;S.zooming=true;const L=LEVELS[S.lvl];SND.whoosh(dir);
  if(dir>0&&L.zoomTo){const tz=V(...L.zoomTo);const p1=tz.clone().add(camera.position.clone().sub(tz).normalize().multiplyScalar(.35));flyTo(p1.toArray(),tz.toArray(),.8);}
  else{const t=controls.target.clone();const p1=camera.position.clone().sub(t).multiplyScalar(3).add(t);flyTo(p1.toArray(),t.toArray(),.8);}
  $('#lens').classList.add('on');$('#lensTxt').innerHTML=`${LEVELS[n].name}<small>${dir>0?'INZOOMEN':'UITZOOMEN'}${LEVELS[n].scale?' · ≈ '+LEVELS[n].scale:''}</small>`;setTimeout(()=>$('#lensTxt').classList.add('on'),250);
  setTimeout(()=>{showLevel(n);const v=LEVELS[n].view;const T=V(...v[1]),P=V(...v[0]);let start;
    if(dir>0)start=P.clone().sub(T).multiplyScalar(5).add(T);else{const z=LEVELS[n].zoomTo?V(...LEVELS[n].zoomTo):T.clone();start=z.clone().add(P.clone().sub(z).normalize().multiplyScalar(.5));controls.target.copy(z);}
    camera.position.copy(start);if(dir>0)controls.target.copy(T);fly=null;$('#lens').classList.remove('on');$('#lensTxt').classList.remove('on');flyTo(v[0],v[1],1.3);
    setTimeout(()=>{S.zooming=false;after&&after();if(goQ){const q=goQ;goQ=null;goLevel(q[0],q[1]);}},350);},800);}
$('#zIn').addEventListener('click',()=>goLevel(S.lvl+1));$('#zOut').addEventListener('click',()=>goLevel(S.lvl-1));

/* ---------- bediening ---------- */
function setSound(v){SND.set(v);$('#bSound').classList.toggle('on',v);$('#bSound').setAttribute('aria-pressed',v);$('#sndWave').setAttribute('d',v?'M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12':'M17 9l4 6M21 9l-4 6');}
$('#bSound').addEventListener('click',()=>setSound(!SND.on));
$$('.seg button').forEach(b=>b.addEventListener('click',()=>setState(+b.dataset.state)));
const LBL=['Stippen','Namen','Uit'];let lblI=0;
function cycleLabels(){lblI=(lblI+1)%3;document.body.classList.remove('lbl-dots','lbl-names','lbl-off');document.body.classList.add(['lbl-dots','lbl-names','lbl-off'][lblI]);$('#bLabels').textContent='Labels: '+LBL[lblI];}
$('#bLabels').addEventListener('click',cycleLabels);
function setQuality(q){S.quality=q;renderer.setPixelRatio(q==='hi'?Math.min(devicePixelRatio,2):1);renderer.shadowMap.enabled=q==='hi';const L=LEVELS[S.lvl];key.castShadow=q==='hi'&&(L.shadows===undefined?S.lvl===0:L.shadows);scene.traverse(o=>{if(o.material)[].concat(o.material).forEach(m=>m.needsUpdate=true);});$('#bQual').textContent='Beeld: '+(q==='hi'?'Mooi':'Snel');resize();}
$('#bQual').addEventListener('click',()=>setQuality(S.quality==='hi'?'lo':'hi'));
$('#bHelp').addEventListener('click',()=>openHelp());$('#helpClose').addEventListener('click',()=>closeHelp());
$('#help').addEventListener('click',e=>{if(e.target.id==='help')closeHelp();});
function setPresent(on){document.body.classList.toggle('present',on);$('#bPresent').classList.toggle('on',on);$('#bPresent').setAttribute('aria-pressed',on);if(on){if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});setSound(true);if(!curPoint&&!quizOpen)next();}else if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});}
$('#bPresent').addEventListener('click',()=>setPresent(!document.body.classList.contains('present')));
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&document.body.classList.contains('present')){document.body.classList.remove('present');$('#bPresent').classList.remove('on');$('#bPresent').setAttribute('aria-pressed','false');}});
function pauseUI(){const bp=$('#bPlay');if(bp)bp.textContent=S.paused?'▶ Afspelen':'⏸ Pauze';const b=$('#bPause');b.textContent=S.paused?'▶ Afspelen':'⏸ Pauze';b.classList.toggle('on',S.paused);b.setAttribute('aria-pressed',S.paused);}
function togglePause(){S.paused=!S.paused;pauseUI();}
function setSlow(v){S.slow=v;const b=$('#bSlow');b.classList.toggle('on',v);b.setAttribute('aria-pressed',v);b.textContent=v?'Slow motion ¼×':'Slow motion';}
function setRide(v){ride=v;fly=null;const b=$('#bRide');b.classList.toggle('on',v);b.setAttribute('aria-pressed',v);}
$('#bPause').addEventListener('click',togglePause);$('#bSlow').addEventListener('click',()=>setSlow(!S.slow));$('#bRide').addEventListener('click',()=>setRide(!ride));
function openHelp(){$('#help').classList.add('open');setTimeout(()=>$('#helpT').focus(),30);}function closeHelp(){$('#help').classList.remove('open');$('#bHelp').focus();}
addEventListener('keydown',e=>{const tg=e.target.tagName;if(tg==='TEXTAREA'||tg==='INPUT'||tg==='SELECT')return;if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key;
  if(tg==='BUTTON'&&(k===' '||k==='Enter'))return;
  if(k==='ArrowRight'||k==='PageDown'){next();e.preventDefault();}else if(k==='ArrowLeft'||k==='PageUp'){prev();e.preventDefault();}
  else if(k==='+'||k==='='){goLevel(S.lvl+1);}else if(k==='-'||k==='_'){goLevel(S.lvl-1);}
  else if(k==='1'||k==='2'||k==='3')setState(+k);else if(k===' '){togglePause();e.preventDefault();}
  else if(k==='s'||k==='S'){const h=H[S.lvl];if(h.stepOnce)h.stepOnce();}else if(k==='m'||k==='M')setSlow(!S.slow);else if(k==='Home'){closeInfo();const v=LEVELS[S.lvl].view;flyTo(v[0],v[1]);}
  else if(k==='c'||k==='C'){setRide(!ride);}else if(k==='g'||k==='G')setSound(!SND.on);else if(k==='l'||k==='L')cycleLabels();else if(k==='f'||k==='F'){if(SCENES.length)filmStart();}
  else if(k==='Escape'){if($('#help').classList.contains('open'))closeHelp();else if(document.body.classList.contains('present'))setPresent(false);else if(quizOpen)closeQuiz();else closeInfo();}});
// op een telefoon schuiven menu en panelen mee met de hoogte van de HUD
if(window.ResizeObserver){new ResizeObserver(()=>{$('#app').style.setProperty('--hudH',$('#hud').offsetHeight+'px');}).observe($('#hud'));}

/* ---------- lus ---------- */
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<1?48:36;camera.updateProjectionMatrix();}
addEventListener('resize',resize);resize();
let last=performance.now(),frames=0,fpsT=0,autoChecked=false,first=true,errd={};
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;frame(dt);}
function frame(dt){const h=H[S.lvl];const own=h.ownPause&&h.ownPause.includes(S.state);
  const hold=S.paused&&!own;const sdt=dt*(S.slow?.25:1);const pdt=hold?0:sdt;
  if(!hold){S.stT+=sdt;S.clock+=sdt;}
  try{h.step(pdt);}catch(e){const m=String(e&&e.message);if(!errd[m]){errd[m]=1;console.error(e);}}
  if(fly){fly.k+=dt/fly.dur;const e=ease(fly.k);camera.position.lerpVectors(fly.p0,fly.p1,e);controls.target.lerpVectors(fly.t0,fly.t1,e);if(fly.k>=1)fly=null;}
  else if(ride){rideA+=dt*.2;const v=LEVELS[S.lvl].view;const T=V(...v[1]);const r=V(...v[0]).distanceTo(T)*(.9+.12*Math.sin(rideA*.7));camera.position.set(T.x+Math.sin(rideA)*r,T.y+r*.3+r*.12*Math.sin(rideA*.5),T.z+Math.cos(rideA)*r);controls.target.lerp(T,.05);}
  else if(FILM.on&&!S.zooming)filmCam(dt);
  controls.update();
  if(shakeV>0){shakeV=Math.max(0,shakeV-dt);const s=shakeV*.12;camera.position.x+=(R()-.5)*s;camera.position.y+=(R()-.5)*s;}
  renderer.render(scene,camera);filmDraw(dt);updateMarkers();SND.tick();
  if(first){first=false;setTimeout(()=>$('#loader').classList.add('gone'),250);}
  frames++;fpsT+=dt;if(!autoChecked&&fpsT>4){autoChecked=true;if(frames/fpsT<28&&S.quality==='hi')setQuality('lo');}}

/* ================= de uitlegfilm ================= */
function filmSetView(v,dur){if(FILM.view===v)return;FILM.view=v;FILM.camT=0;const q=filmPose(v,0);fly={p0:camera.position.clone(),t0:controls.target.clone(),p1:q.p,t1:q.t,k:0,dur:dur||2.2};ride=false;}
const estDur=t=>t?Math.max(2.4,.7+t.length/13.2):3;
let nlVoice=null;function pickVoice(){try{const vs=speechSynthesis.getVoices();const nl=vs.filter(v=>/^nl/i.test(v.lang));nlVoice=nl.find(v=>/natural|online|neural/i.test(v.name))||nl.find(v=>/google/i.test(v.name))||nl.find(v=>/nl-NL/i.test(v.lang))||nl[0]||null;}catch(e){}}
if('speechSynthesis' in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice;}
function speak(t){FILM.vDone=true;if(!FILM.voice||!t||!('speechSynthesis' in window)||FILM.rec)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='nl-NL';if(nlVoice)u.voice=nlVoice;u.rate=1;u.pitch=1;FILM.vDone=false;u.onend=u.onerror=()=>{FILM.vDone=true;};speechSynthesis.speak(u);}catch(e){FILM.vDone=true;}}
function filmScene(i){if(i>=SCENES.length){filmEnd();return;}const sc=SCENES[i],prev=SCENES[FILM.si];
  if(prev)prev.lines.forEach(l=>{if(l.end){try{l.end();}catch(e){console.error(e);}}});if(prev&&prev.end){try{prev.end();}catch(e){console.error(e);}}
  FILM.si=i;FILM.li=-1;FILM.waiting=true;FILM.end=false;FILM.steps=sc.steps||null;FILM.chap=sc.chap||'';FILM.chapA=0;FILM.cap='';FILM.title=sc.title||null;
  try{speechSynthesis.cancel();}catch(e){}S.paused=false;const tok=FILM.tok=(FILM.tok||0)+1;
  const go=()=>{if(!FILM.on||FILM.tok!==tok)return;if(sc.st)setState(sc.st);if(sc.setup){try{sc.setup();}catch(e){console.error(e);}}filmSetView(sc.view||LEVELS[S.lvl].view,1.8);FILM.waiting=false;filmLine(0);};
  if(sc.lv!==undefined&&sc.lv!==S.lvl){FILM.lensT=0;FILM.lensDir=sc.lv>S.lvl?1:-1;FILM.lensName=LEVELS[sc.lv].name;FILM.camT=0;goLevel(sc.lv,()=>setTimeout(go,250));}else{go();}
  filmUI();}
function filmLine(j){const sc=SCENES[FILM.si];if(j>=sc.lines.length){filmScene(FILM.si+1);return;}const L=sc.lines[j];FILM.li=j;FILM.lt=0;FILM.ld=Math.max(L.min||0,estDur(L.t));
  if(L.cam)filmSetView(L.cam,2.4);if(L.do){try{L.do(FILM.ld);}catch(e){console.error(e);}}FILM.cap=L.t;FILM.capA=0;speak(L.t);filmUI();}
function filmTick(dt){if(!FILM.on)return;FILM.bars=Math.min(1,FILM.bars+dt*1.5);FILM.chapA=Math.min(1,FILM.chapA+dt*1.2);FILM.capA=Math.min(1,FILM.capA+dt*3);
  FILM.titleA=lerp(FILM.titleA,FILM.title?1:0,Math.min(1,dt*2.2));FILM.lensT+=dt;FILM.flashA=Math.max(0,FILM.flashA-dt*.9);
  if(!FILM.playing||FILM.waiting||FILM.end)return;FILM.lt+=dt;const L=SCENES[FILM.si]&&SCENES[FILM.si].lines[FILM.li];if(!L)return;
  if(FILM.lt>=FILM.ld&&(FILM.vDone||FILM.lt>FILM.ld*2+2)){filmLine(FILM.li+1);}}
function filmPose(v,ct){const T=V(...v[1]),off=V(...v[0]).sub(T);const asp=camera.aspect;if(asp<1)off.multiplyScalar(Math.min(1.9,1/Math.pow(asp,.85)));const a=(S.lvl===0?.3:.2)*Math.sin(ct*.16);off.applyAxisAngle(AY,a).multiplyScalar(1-.07*Math.sin(ct*.11));off.y+=(S.lvl===0?.5:.25)*Math.sin(ct*.13);return {p:T.clone().add(off),t:T};}
function filmCam(dt){if(!FILM.view||fly)return;FILM.camT+=dt;const q=filmPose(FILM.view,FILM.camT);camera.position.copy(q.p);controls.target.copy(q.t);}
// na de film komen geluid, graad, slow motion en lagen terug zoals de kijker ze had
function filmStart(){if(!SCENES.length)return;closeInfo();closeQuiz();if(!FILM.on){FILM.pre={snd:SND.on,grade:S.grade,slow:S.slow};layDefaults();}FILM.on=true;FILM.end=false;FILM.playing=true;FILM.bars=0;FILM.title=null;FILM.titleA=0;FILM.camT=0;ride=false;document.body.classList.add('film');$('#help').classList.remove('open');
  if(!SND.on)setSound(true);SND.music(true);filmResize();filmScene(0);}
function filmStop(){FILM.on=false;FILM.playing=false;FILM.tok=(FILM.tok||0)+1;const sc=SCENES[FILM.si];if(sc){sc.lines.forEach(l=>{if(l.end){try{l.end();}catch(e){}}});if(sc.end){try{sc.end();}catch(e){}}}FILM.si=-1;FILM.cap='';FILM.title=null;FILM.steps=null;try{speechSynthesis.cancel();}catch(e){}SND.music(false);S.xSpeed=1;S.paused=false;
  if(FCFG.stop){try{FCFG.stop();}catch(e){}}document.body.classList.remove('film');
  const pr=FILM.pre;FILM.pre=null;if(pr){if(pr.grade!==undefined)S.grade=pr.grade;setSlow(!!pr.slow);if(!pr.snd&&!FILM.rec)setSound(false);}layRestore();setState(S.state);const v=LEVELS[S.lvl].view;flyTo(v[0],v[1]);filmUI();if(FILM.rec)recStop(false);}
function filmEnd(){FILM.end=true;FILM.playing=false;filmUI();if(FILM.rec)setTimeout(()=>recStop(true),2500);}
function filmPause(){if(!FILM.on)return;if(FILM.end){filmStart();return;}FILM.playing=!FILM.playing;S.paused=!FILM.playing;try{FILM.playing?speechSynthesis.resume():speechSynthesis.pause();}catch(e){}filmUI();}
function filmJump(d){if(!FILM.on||S.zooming)return;const i=clamp(FILM.si+d,0,SCENES.length-1);FILM.end=false;FILM.playing=true;filmScene(i);}
function wrapText(ctx,t,maxW){const words=t.split(' ');const lines=[];let cur='';for(const w of words){const test=cur?cur+' '+w:w;if(ctx.measureText(test).width>maxW&&cur){lines.push(cur);cur=w;}else cur=test;}if(cur)lines.push(cur);return lines;}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
// op het scherm nooit kleiner dan ongeveer 15 css-pixels ondertitel; in de video precies op 1080p-maat
let fbLift=0;
function drawOverlay(ctx,w,h,rec){const s=rec?Math.min(h/1080,w/1500):Math.max(Math.min(h/1080,w/1500),.4*Math.min(devicePixelRatio||1,2));ctx.save();
  if(rec){const b=LEVELS[S.lvl].bg||['#2c3a42','#18232a','#0d1316'];const g=ctx.createRadialGradient(w*.55,h*.4,0,w*.55,h*.4,w*.75);g.addColorStop(0,b[0]);g.addColorStop(.55,b[1]);g.addColorStop(1,b[2]);ctx.globalCompositeOperation='destination-over';ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation='source-over';
    const vg=ctx.createRadialGradient(w/2,h*.45,h*.35,w/2,h*.45,w*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');ctx.fillStyle=vg;ctx.fillRect(0,0,w,h);}
  if(FILM.flashA>0){const fg=ctx.createRadialGradient(w/2,h/2,h*.2,w/2,h/2,w*.7);fg.addColorStop(0,'rgba(214,60,40,0)');fg.addColorStop(1,`rgba(214,60,40,${.5*FILM.flashA})`);ctx.fillStyle=fg;ctx.fillRect(0,0,w,h);}
  const lt=FILM.lensT;const la=lt<.75?lt/.75:lt<1.1?1:Math.max(0,1-(lt-1.1)/.6);if(la>0){const lg=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w*.6);lg.addColorStop(0,`rgba(255,255,255,0)`);lg.addColorStop(.45,`rgba(225,236,245,${.65*la})`);lg.addColorStop(1,`rgba(240,246,250,${la})`);ctx.fillStyle=lg;ctx.fillRect(0,0,w,h);
    if(la>.5){ctx.globalAlpha=(la-.5)*2;ctx.fillStyle='#1d2a33';ctx.textAlign='center';ctx.font=`700 ${56*s}px Fraunces, serif`;ctx.fillText(FILM.lensName,w/2,h/2);const Lz=LEVELS.find(L=>L.name===FILM.lensName);ctx.font=`600 ${20*s}px "JetBrains Mono", monospace`;ctx.fillStyle='#4b5b66';ctx.fillText((FILM.lensDir<0?'UITZOOMEN':'INZOOMEN')+(Lz&&Lz.scale?' · '+Lz.scale:''),w/2,h/2+44*s);ctx.globalAlpha=1;}}
  if(FILM.titleA>.01&&FILM.title){ctx.globalAlpha=FILM.titleA;const tg=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w*.6);tg.addColorStop(0,'rgba(8,12,14,.55)');tg.addColorStop(1,'rgba(8,12,14,.15)');ctx.fillStyle=tg;ctx.fillRect(0,0,w,h);
    ctx.textAlign='center';ctx.fillStyle='#e6b65e';ctx.font=`600 ${22*s}px "JetBrains Mono", monospace`;ctx.fillText('DE BEWEGINGSATLAS · '+(FCFG.brand||cfg.name).toUpperCase(),w/2,h*.4);
    ctx.fillStyle='#f1e9da';let f=92;ctx.font=`700 ${f*s}px Fraunces, serif`;while(ctx.measureText(FILM.title[0]).width>w*.86&&f>40){f-=4;ctx.font=`700 ${f*s}px Fraunces, serif`;}ctx.fillText(FILM.title[0],w/2,h*.4+100*s);ctx.fillStyle='#c9c0ae';ctx.font=`500 ${32*s}px "Instrument Sans", sans-serif`;ctx.fillText(FILM.title[1]||'',w/2,h*.4+160*s);ctx.globalAlpha=1;}
  const bh=74*s*FILM.bars;ctx.fillStyle='#000';ctx.fillRect(0,0,w,bh);ctx.fillRect(0,h-bh,w,bh);
  if(FILM.chap){ctx.globalAlpha=FILM.chapA;ctx.textAlign='left';ctx.fillStyle='#e6b65e';ctx.font=`600 ${22*s}px "JetBrains Mono", monospace`;ctx.fillText(FILM.chap.toUpperCase(),70*s,bh+52*s);
    if(LEVELS[S.lvl].scale){ctx.fillStyle='rgba(241,233,218,.75)';ctx.font=`500 ${20*s}px "JetBrains Mono", monospace`;ctx.fillText('≈ '+LEVELS[S.lvl].scale,70*s,bh+82*s);}ctx.globalAlpha=1;}
  if(FILM.steps&&FILM.steps.names&&(FILM.steps.lv===undefined||FILM.steps.lv===S.lvl)){const names=FILM.steps.names,cur=call(FILM.steps.cur,-1);ctx.font=`600 ${21*s}px "Instrument Sans", sans-serif`;let cw=0;names.forEach((n,i)=>cw=Math.max(cw,ctx.measureText((i+1)+' · '+n).width+40*s));cw=Math.min(cw,(w-140*s)/names.length-14*s);const gap=14*s,x0=w/2-(names.length*cw+(names.length-1)*gap)/2,y=bh+(w/h<1.6?112:30)*s;
    names.forEach((n,i)=>{const on=cur===i;ctx.fillStyle=on?'rgba(230,182,94,.95)':'rgba(15,20,23,.7)';roundRect(ctx,x0+i*(cw+gap),y,cw,46*s,12*s);ctx.fill();ctx.fillStyle=on?'#1c1a17':'rgba(241,233,218,.8)';ctx.textAlign='center';ctx.fillText((i+1)+' · '+n,x0+i*(cw+gap)+cw/2,y+31*s);});}
  if(FILM.cap){ctx.font=`600 ${38*s}px "Instrument Sans", sans-serif`;const lines=wrapText(ctx,FILM.cap,Math.min(1380*s,w-120*s));const lh=50*s,boxH=lines.length*lh+36*s;let maxW=0;lines.forEach(l=>maxW=Math.max(maxW,ctx.measureText(l).width));const bw=maxW+64*s,bx=w/2-bw/2;let by=h-bh-boxH-34*s;
    // op een telefoon staat de ondertitel boven de filmbalk zolang die zichtbaar is
    if(!rec){const fb=$('#filmBar');const want=fb&&!fb.hidden&&!fb.classList.contains('idle')?(innerHeight-fb.getBoundingClientRect().top+10)*Math.min(devicePixelRatio,2):0;fbLift=lerp(fbLift,want,.15);by=Math.min(by,h-fbLift-boxH);}
    ctx.globalAlpha=FILM.capA;ctx.fillStyle='rgba(10,14,16,.78)';roundRect(ctx,bx,by,bw,boxH,16*s);ctx.fill();ctx.fillStyle='#f1e9da';ctx.textAlign='center';lines.forEach((l,i)=>ctx.fillText(l,w/2,by+18*s+lh*(i+.78)));ctx.globalAlpha=1;}
  ctx.textAlign='right';ctx.fillStyle='rgba(241,233,218,.55)';ctx.font=`600 ${18*s}px "JetBrains Mono", monospace`;ctx.fillText('DE BEWEGINGSATLAS',w-60*s,h-bh/2+6*s);
  ctx.restore();}
const ov=$('#filmOv'),ovx=ov.getContext('2d');
function filmResize(){const d=Math.min(devicePixelRatio,2);ov.width=innerWidth*d;ov.height=innerHeight*d;}
addEventListener('resize',filmResize);
function filmDraw(dt){filmTick(dt);if(!FILM.on){if(ov.width&&ov.dataset.clear!=='1'){ovx.clearRect(0,0,ov.width,ov.height);ov.dataset.clear='1';}return;}ov.dataset.clear='0';
  ovx.clearRect(0,0,ov.width,ov.height);drawOverlay(ovx,ov.width,ov.height,false);
  if(FILM.rec){const R2=FILM.rec,c=R2.ctx,W2=1920,H2=1080;const src=renderer.domElement,sw=src.width,sh=src.height;FILM.idle=0;const a=W2/H2;let cw=sw,ch=sw/a;if(ch>sh){ch=sh;cw=sh*a;}const sx=(sw-cw)/2,sy=(sh-ch)/2;
    c.clearRect(0,0,W2,H2);c.drawImage(src,sx,sy,cw,ch,0,0,W2,H2);drawOverlay(c,W2,H2,true);}
  FILM.idle+=dt;$('#filmBar').classList.toggle('idle',FILM.idle>2.6&&FILM.playing);}
function filmUI(){const bar=$('#filmBar');bar.hidden=!FILM.on;if(!FILM.on)return;$('#fPlay').textContent=FILM.end?'↻ Opnieuw':FILM.playing?'⏸':'▶';$('#fPos').textContent=FILM.end?'Einde':`Hoofdstuk ${Math.max(0,FILM.si)} van ${SCENES.length-1}`;$('#fVoice').classList.toggle('on',FILM.voice);$('#fVoice').textContent=FILM.voice?'Stem: aan':'Stem: uit';
  $('#fRec').textContent=FILM.rec?'● Opnemen… (klik om te stoppen)':'⬇ Video (ondertiteld, zonder stem)';$('#fRec').classList.toggle('rec',!!FILM.rec);}
if(SCENES.length){$('#bFilm').addEventListener('click',()=>filmStart());}else{$('#bFilm').hidden=true;}
$('#fPlay').addEventListener('click',filmPause);$('#fPrev').addEventListener('click',()=>filmJump(-1));$('#fNext').addEventListener('click',()=>filmJump(1));
$('#fVoice').addEventListener('click',()=>{FILM.voice=!FILM.voice;if(!FILM.voice){try{speechSynthesis.cancel();}catch(e){}FILM.vDone=true;}filmUI();});
$('#fClose').addEventListener('click',filmStop);
addEventListener('mousemove',()=>{FILM.idle=0;});
function recMime(){const c=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'];return c.find(m=>window.MediaRecorder&&MediaRecorder.isTypeSupported(m))||'';}
function recStart(){if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){alert('Deze browser kan geen video opnemen. Gebruik Chrome of Edge.');return;}
  const mime=recMime();const cv=document.createElement('canvas');cv.width=1920;cv.height=1080;const ctx=cv.getContext('2d');const vs=cv.captureStream(30);
  if(!SND.on)setSound(true);const as=SND.tap();if(as)as.getAudioTracks().forEach(t=>vs.addTrack(t));
  const chunks=[];let mr;try{mr=new MediaRecorder(vs,{mimeType:mime,videoBitsPerSecond:12e6});}catch(e){mr=new MediaRecorder(vs);}
  mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
  mr.onstop=()=>{const type=(mr.mimeType||mime||'video/webm').split(';')[0];const blob=new Blob(chunks,{type});if(FILM.recOk){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(FCFG.file||(cfg.id+'-uitleg'))+'-bewegingsatlas.'+(type.includes('mp4')?'mp4':'webm');document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);}};
  FILM.rec={mr,ctx,cv,voice:FILM.voice,q:S.quality};FILM.recOk=false;autoChecked=true;document.body.classList.add('rec');cv.id='recView';$('#app').appendChild(cv);FILM.voice=false;try{speechSynthesis.cancel();}catch(e){}if(S.quality!=='hi')setQuality('hi');
  recSize();$('#recNote').hidden=false;try{mr.start(500);}catch(e){}filmStart();filmUI();}
function recSize(){if(!FILM.rec)return;renderer.setPixelRatio(1);renderer.setSize(1920,1080,false);camera.aspect=16/9;camera.fov=36;camera.updateProjectionMatrix();}
addEventListener('resize',recSize);
function recStop(ok){const R2=FILM.rec;if(!R2)return;FILM.recOk=ok;FILM.rec=null;try{R2.mr.stop();}catch(e){}$('#recNote').hidden=true;document.body.classList.remove('rec');R2.cv.remove();setQuality(R2.q);FILM.voice=R2.voice;filmUI();}
$('#fRec').addEventListener('click',()=>{if(FILM.rec){recStop(false);return;}recStart();});
// tijdens de film werken alleen de filmtoetsen; de rest van de bediening ligt stil
addEventListener('keydown',e=>{if(!FILM.on)return;e.stopImmediatePropagation();if(e.ctrlKey||e.metaKey||e.altKey)return;if(e.key===' '){e.preventDefault();filmPause();}else if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();filmJump(1);}else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();filmJump(-1);}else if(e.key==='Escape'){filmStop();}},true);
$('#filmStartBtn').addEventListener('click',()=>{$('#filmStart').hidden=true;filmStart();});

/* ---------- start ---------- */
showLevel(0);
const v0=LEVELS[0].view;camera.position.set(...v0[0]).sub(V(...v0[1])).multiplyScalar(1.4).add(V(...v0[1]));controls.target.set(...v0[1]);flyTo(v0[0],v0[1],2.4);
// deeplinks: halte.html#5 (punt), #niveau=3, #stand=2, #speurtocht of #film; ook als het adres verandert
LAYERS.forEach(applyLayer);buildLayers();
function deeplink(first){const h=decodeURIComponent(location.hash.slice(1));if(!h)return;const d=first?900:50;
  if(/film/.test(h)&&SCENES.length){setTimeout(()=>{$('#filmStart').hidden=false;},d);return;}
  if(/speurtocht/.test(h)){setTimeout(openQuiz,d);return;}
  const st=h.match(/stand=(\d)/);if(st)setTimeout(()=>setState(clamp(+st[1],1,3)),d);
  const m=h.match(/niveau=(\d)/);if(m){setTimeout(()=>goLevel(clamp(+m[1]-1,0,NL-1)),first?600:50);return;}
  const p=parseInt(h,10);if(p>=1&&p<=POINTS.length&&(!curPoint||curPoint.i!==p-1))setTimeout(()=>openPoint(p-1),d);}
deeplink(true);addEventListener('hashchange',()=>deeplink(false));
requestAnimationFrame(loop);
// testhaak: in een verborgen tabblad loopt requestAnimationFrame niet; __atlas.step(120) rekent en tekent 2 seconden
window.__atlas={step:(n,d)=>{const l=$('#loader');if(l)l.style.display='none';for(let i=0;i<n;i++)frame(d||1/60);},goLevel,setState,showLevel,openPoint,closeInfo,openQuiz,closeQuiz,filmStart,filmStop,filmScene,S,W,H,K,FILM,SCENES,POINTS,QUIZ,LEVELS,camera,controls,renderer,scene,setQuality,flyTo};
}

window.Atlas3D=function(cfg){const start=()=>{try{run(cfg);}catch(e){console.error(e);fail('Er ging iets mis bij het opbouwen van de 3D-scène: '+(e&&e.message));}};if(document.body)start();else document.addEventListener('DOMContentLoaded',start);};
window.addEventListener('error',function(){if(!window.THREE)fail('De 3D-bibliotheek kon niet geladen worden. Controleer de internetverbinding en laad opnieuw.');});
})();
