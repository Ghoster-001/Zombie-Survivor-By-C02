// ===== Stickman vs Zombies : base de jeu originale =====
const cv = document.getElementById('c');
let ctx = cv.getContext('2d',{alpha:false});
if(!CanvasRenderingContext2D.prototype.roundRect){CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){r=Math.min(Array.isArray(r)?(r[0]||0):(r||0),Math.abs(w)/2,Math.abs(h)/2);this.moveTo(x+r,y);this.arcTo(x+w,y,x+w,y+h,r);this.arcTo(x+w,y+h,x,y+h,r);this.arcTo(x,y+h,x,y,r);this.arcTo(x,y,x+w,y,r);this.closePath()}}   // anciens navigateurs mobiles
const MOBILE=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
// Qualité graphique : résolution interne du canvas (1x = 960 px de large ... 8x = 7680 px, soit 8K). « Auto » suit la résolution réelle de l'écran et se réduit seule si le jeu rame.
const GFX=[{id:'auto',n:'AUTO'},{id:'std',n:'STANDARD',r:1},{id:'high',n:'HAUTE',r:2},{id:'ultra',n:'ULTRA',r:3},{id:'4k',n:'4K',r:4},{id:'8k',n:'8K',r:8}];
let autoCap=MOBILE?2:4,RES=1,RESd=0;
// Profils graphiques : AUTO règle tout seul (la résolution puis les effets baissent si le jeu rame), les autres figent les réglages.
const PROFS=[{id:'auto',n:'AUTO'},
 {id:'eco',n:'ÉCO',gfx:'std',fps:30,lights:0,fog:0,refl:0,post:0,bloom:0,parts:0,anim:0},
 {id:'low',n:'BAS',gfx:'std',fps:60,lights:0,fog:0,refl:0,post:0,bloom:0,parts:1,anim:1},
 {id:'med',n:'MOYEN',gfx:'high',fps:60,lights:1,fog:0,refl:0,post:1,bloom:0,parts:1,anim:2},
 {id:'high',n:'ÉLEVÉ',gfx:'high',fps:0,lights:1,fog:1,refl:1,post:1,bloom:0,parts:2,anim:2},
 {id:'ultra',n:'ULTRA',gfx:'ultra',fps:0,lights:1,fog:1,refl:1,post:1,bloom:0,parts:2,anim:2},
 {id:'extreme',n:'EXTRÊME',gfx:'4k',fps:0,lights:1,fog:1,refl:1,post:1,bloom:1,parts:3,anim:2},
 {id:'custom',n:'PERSONNALISÉ'}];
const PARTS=[{n:'MINIMALES',q:.3,max:110},{n:'RÉDUITES',q:.6,max:240},{n:'NORMALES',q:1,max:520},{n:'MAXIMALES',q:1.7,max:1000}];
let autoDrop=MOBILE?2:0;                                              // paliers d'économie automatiques (profil AUTO) : 1 bloom · 2 reflets · 3 brume · 4 lumières · 5 vignette/grain · 6 particules
let FXF={lights:1,fog:1,refl:1,post:1,bloom:0,pq:1,pmax:520,fps:60,xtra:0,anim:2},ATK=0,uiDirty=true,lastUiState='',lastBright=-1;
// --- taux de rafraîchissement de l'écran : mesuré à l'exécution, les limites de FPS proposées vont jusqu'à lui ---
let HZ=60,HZm=60,hzS=[];
function hzSample(dt){
  if(document.hidden||dt<.4||dt>60) return;
  hzS.push(dt);
  if(hzS.length>=90){
    hzS.sort((a,b)=>a-b);const est=1000/hzS[Math.floor(hzS.length*.1)];hzS=[];
    let best=Math.round(est);for(const v of[24,30,48,50,60,72,75,85,90,100,120,144,165,180,200,240,280,300,360,480,500,1000]) if(Math.abs(v-est)/v<.06){best=v;break}
    if(best>HZm||!hzSample.set){HZm=hzSample.set?Math.max(HZm,best):best;hzSample.set=1}
  }
}
function fpsOptions(){const o=[30,45,60,75,90,120,144,165,240,360,480,500,1000].filter(v=>v<HZ-1);return o.concat([0])}   // 0 = taux de l'écran
const fpsName=v=>v>0?String(v):'ÉCRAN ('+HZ+')';
// --- compteur FPS (à la Steam) ---
const FC_DEF={on:false,fx:0,fy:0,pos:'tl',size:1,op:.9,bg:1,col:'auto',fps:1,ms:0,low:0,avg:0,res:0,prof:0,graph:0};
const FT=new Float32Array(240);let ftN=0,fcT=0,fcFrames=0,fcStat={fps:0,ms:0,low:0,avg:0,min:0,max:0};
function ftPush(d){FT[ftN%240]=d;ftN++;fcFrames++}
function fcUpdate(t){
  if(t-fcT<250) return;
  const el=t-fcT;fcT=t;fcStat.fps=Math.round(fcFrames*1000/el);fcFrames=0;
  const n=Math.min(240,ftN);if(n<3) return;
  const a=Array.from(FT.subarray(0,n)).sort((x,y)=>x-y);let sum=0;for(const v of a) sum+=v;
  fcStat.low=1000/a[Math.min(n-1,Math.floor(n*.99))];fcStat.min=1000/a[n-1];fcStat.max=1000/a[0];fcStat.avg=1000*n/sum;
  let r=0;const m=Math.min(15,n);for(let i=0;i<m;i++) r+=FT[(ftN-1-i+240)%240];fcStat.ms=r/m;
}
function drawFps(){
  const f=SET.fc;if(!f.on) return;
  const st=fcStat,L=[];
  if(f.fps) L.push([String(st.fps),'FPS',1]);
  if(f.ms) L.push([st.ms.toFixed(1)+' ms','',0]);
  if(f.low) L.push(['1 % bas  '+Math.round(st.low),'',0]);
  if(f.avg) L.push(['moy '+Math.round(st.avg)+'   min '+Math.round(st.min)+'   max '+Math.round(st.max),'',0]);
  if(f.res) L.push([cv.width+'×'+cv.height+'  ('+RES+'×)','',0]);
  if(f.prof) L.push([(PROFS.find(x=>x.id===SET.prof)||PROFS[0]).n+(SET.prof==='auto'&&autoDrop?' (−'+autoDrop+')':''),'',0]);
  const sz=f.size;
  ctx.save();ctx.setTransform(RES,0,0,RES,0,0);
  let bw=0,bh=8*sz;
  for(const l of L){ctx.font=(l[2]?'700 ':'600 ')+(l[2]?24:13)*sz+'px '+FONT;let w=ctx.measureText(l[0]).width;if(l[1]){ctx.font='600 '+11*sz+'px '+FONT;w+=ctx.measureText(l[1]).width+6*sz}bw=Math.max(bw,w);bh+=(l[2]?28:17)*sz}
  const gh=f.graph?34*sz:0,gw=Math.max(bw,100*sz);if(f.graph){bw=gw;bh+=gh+4*sz}
  bw+=16*sz;if(!L.length&&!f.graph){ctx.restore();return}
  const m=8,x=m+f.fx*Math.max(0,W-bw-2*m),y=m+f.fy*Math.max(0,H-bh-2*m);
  ctx.globalAlpha=f.op;
  if(f.bg){ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(x,y,bw,bh)}
  const colOf=v=>f.col==='white'?'#f2f2f2':f.col==='green'?'#7dff6a':f.col==='yellow'?'#ffe14a':(v>=55?'#7dff6a':v>=30?'#ffe14a':'#ff6a5a');
  let cy=y+4*sz;ctx.textAlign='left';
  for(const l of L){
    const big=l[2];cy+=(big?24:13)*sz+(big?0:1);
    ctx.font=(big?'700 ':'600 ')+(big?24:13)*sz+'px '+FONT;
    const c=big?colOf(st.fps):(f.col==='auto'?'#e8e8e8':colOf(60));
    if(!f.bg){ctx.fillStyle='#000';ctx.fillText(l[0],x+8*sz+1,cy+1)}
    ctx.fillStyle=c;ctx.fillText(l[0],x+8*sz,cy);
    if(l[1]){const w=ctx.measureText(l[0]).width;ctx.font='600 '+11*sz+'px '+FONT;ctx.fillStyle='#c8c8c8';ctx.fillText(l[1],x+8*sz+w+6*sz,cy)}
    cy+=(big?4:3)*sz;
  }
  if(f.graph){
    const gx=x+8*sz,gy=y+bh-gh-4*sz,n=Math.min(90,ftN),bwid=(gw)/90;
    ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(gx,gy,gw,gh);
    for(let i=0;i<n;i++){const d=FT[(ftN-1-i+240)%240],hh=Math.min(gh,gh*d/50);ctx.fillStyle=d<=18?'#7dff6a':d<=33?'#ffe14a':'#ff6a5a';ctx.fillRect(gx+gw-(i+1)*bwid,gy+gh-hh,Math.max(1,bwid-.5),hh)}
  }
  ctx.restore();
}
// --- interpolation : à plus de 60 FPS, les positions sont lissées entre deux pas de logique ---
let prevValid=false,prevCam=0,intList=[],savedCam=0;
function snapPrev(){
  const f=o=>{o.px=o.x;o.py=o.y};
  f(player);for(const z of zombies) f(z);for(const b of bullets) f(b);for(const q of particles) f(q);for(const a of acid) f(a);for(const b of bonuses) f(b);for(const c of crates) f(c);for(const e of ents) f(e);
  prevCam=camX;prevValid=true;
}
function interpOn(al){
  intList.length=0;
  const g=o=>{if(o.px===undefined) return;const dx=o.x-o.px,dy=o.y-o.py;if((dx===0&&dy===0)||dx*dx+dy*dy>40000) return;o.sx=o.x;o.sy=o.y;o.x=o.px+dx*al;o.y=o.py+dy*al;intList.push(o)};
  g(player);for(const z of zombies) g(z);for(const b of bullets) g(b);for(const q of particles) g(q);for(const a of acid) g(a);for(const b of bonuses) g(b);for(const c of crates) g(c);for(const e of ents) g(e);
  savedCam=camX;const dc=camX-prevCam;if(Math.abs(dc)<300) camX=prevCam+dc*al;
}
function interpOff(){for(const o of intList){o.x=o.sx;o.y=o.sy}intList.length=0;camX=savedCam}
function fxUpdate(){
  const s=SET;HZ=s.hz>0?s.hz:HZm;const a=s.prof==='auto'?autoDrop:0;
  let pi=Math.max(0,Math.min(3,s.parts|0));if(a>=1) pi=Math.min(pi,2);if(a>=5) pi=Math.min(pi,1);if(a>=6) pi=0;
  FXF.lights=s.lights&&a<4?1:0;FXF.fog=s.fog&&a<3?1:0;FXF.refl=s.refl&&a<2?1:0;FXF.post=s.post&&a<5?1:0;FXF.bloom=s.bloom&&a<1?1:0;
  FXF.pq=PARTS[pi].q;FXF.pmax=PARTS[pi].max;FXF.fps=s.fps>0?Math.max(15,Math.min(s.fps,HZ)):HZ;
  {let an=[0,1,2].includes(s.anim)?s.anim:2;if(a>=6) an=0;else if(a>=5) an=Math.min(an,1);FXF.anim=an}
  if(s.bright!==lastBright){lastBright=s.bright;const b=Math.max(0,Math.min(1,+s.bright)),f=b<=.5?.35+b/.5*.65:1+(b-.5)*1.4;cv.style.filter=Math.abs(f-1)<.01?'':'brightness('+f.toFixed(2)+')'}   // luminosité : filtre CSS (aucun coût au dessin)
  FXF.xtra=(s.bloom&&s.fog&&s.lights&&pi>=3&&a<1)?1:0;               // qualité supérieure : plus de brume, de rayons de lumière et de particules
}
function setProfile(id){
  const p=PROFS.find(x=>x.id===id)||PROFS[0];SET.prof=p.id;
  if(p.id==='auto'){Object.assign(SET,{gfx:'auto',lights:1,fog:1,refl:1,post:1,bloom:0,parts:2,fps:0,anim:2});autoDrop=MOBILE?2:0}
  else if(p.id!=='custom'){Object.assign(SET,{gfx:p.gfx,fps:p.fps,lights:p.lights,fog:p.fog,refl:p.refl,post:p.post,bloom:p.bloom,parts:p.parts,anim:p.anim})}
  saveOpts();fit();
}
const fxToggle=k=>{SET[k]=SET[k]?0:1;SET.prof='custom';saveOpts()};
let BLC=null,BLC2=null;
function doBloom(){                                                    // lueur : le rendu est réduit, flouté et éclairci puis rajouté en additif
  const bw=Math.max(64,Math.round(W/4)),bh=Math.max(36,Math.round(H/4));
  if(!BLC||BLC.width!==bw||BLC.height!==bh){BLC=document.createElement('canvas');BLC.width=bw;BLC.height=bh;BLC2=document.createElement('canvas');BLC2.width=bw;BLC2.height=bh}
  const a=BLC.getContext('2d'),b=BLC2.getContext('2d');
  a.globalCompositeOperation='copy';a.drawImage(cv,0,0,cv.width,cv.height,0,0,bw,bh);
  b.globalCompositeOperation='copy';let ok=false;try{b.filter='blur(3px) brightness(1.2) contrast(1.6)';ok=b.filter!=='none'}catch(e){}
  b.drawImage(BLC,0,0);try{b.filter='none'}catch(e){}
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=ok?.5:.22;ctx.drawImage(BLC2,0,0,W,H);ctx.restore();
}

function resWanted(vw){
  let g='auto';try{g=SET.gfx||'auto'}catch(e){}
  const q=GFX.find(x=>x.id===g)||GFX[0];
  let r=q.r||Math.max(1,Math.min(autoCap,Math.max(MOBILE?1.5:2,(vw*(window.devicePixelRatio||1))/W)));   // Auto : au moins 2x (suréchantillonnage), jusqu'à la résolution réelle de l'écran
  const maxA=MOBILE?16e6:36e6;                                       // limite de surface des navigateurs
  while(r>1&&W*H*r*r>maxA) r-=.25;
  return Math.round(r*4)/4;
}
let W=960,H=540,GROUND=460;const GRAV=0.7;   // coordonnées logiques : s'adaptent au format de l'écran (voir fit) ; le canvas fait 2x ces valeurs
cv.width=Math.round(W*RES);cv.height=Math.round(H*RES);ctx=cv.getContext('2d');ctx.scale(RES,RES);
const clampN=(v,a,b)=>Math.max(a,Math.min(b,v));   // +0.01 à chaque mise à jour
var READY=false,FORCED=false,CW=1,CH=1;
// Le jeu s'adapte au format de l'écran (de 6:5 à 3:1) : la zone de jeu s'élargit (ou s'agrandit en hauteur) pour remplir tout l'écran, sans bandes noires.
const SAFE={l:0,r:0};
function readSafe(){
  try{const cs=getComputedStyle(document.getElementById('safe')),k=W/Math.max(1,cv.getBoundingClientRect().width);SAFE.l=(parseFloat(cs.paddingLeft)||0)*k;SAFE.r=(parseFloat(cs.paddingRight)||0)*k}catch(e){}
}
function fit(){
  const vv=window.visualViewport;let vw=Math.max(1,vv?vv.width:innerWidth),vh=Math.max(1,vv?vv.height:innerHeight);
  FORCED=READY&&vh>vw*1.02&&touchOn();                      // téléphone tenu en portrait : le jeu est pivoté de 90° pour rester en paysage, même avec le verrouillage de rotation
  if(FORCED){const t=vw;vw=vh;vh=t}
  const asp=vw/vh,a=Math.max(1.2,Math.min(3,asp));
  let nw,nh;if(a>=16/9){nh=540;nw=Math.round(540*a)}else{nw=960;nh=Math.round(960/a)}
  const rw=resWanted(vw);
  if(nw!==W||nh!==H||rw!==RESd){
    RES=RESd=rw;
    const dG=(nh-80)-GROUND;
    W=nw;H=nh;GROUND=nh-80;if(READY&&MP.on&&MP.rp){WORLD_W=nw;camX=0}
    cv.width=Math.round(W*RES);cv.height=Math.round(H*RES);cv.getContext('2d').setTransform(RES,0,0,RES,0,0);cv.getContext('2d').imageSmoothingQuality='high';
    if(READY&&dG){try{                                                 // le sol change de hauteur (plein écran, rotation) : tout ce qui est posé dessus suit
      for(const arr of[zombies,crates,decals,particles,bonuses,ents,acid,bullets,fx]) for(const o of arr) if(typeof o.y==='number') o.y+=dG;
      player.y+=dG;for(const g of MP.guests) if(g.p) g.p.y+=dG;for(const o of MP.others.values()) if(typeof o.y==='number') o.y+=dG;
    }catch(e){}}
  }
  const cw=asp>=1.2&&asp<=3?vw:(asp>3?vh*3:vw),ch=asp>=1.2&&asp<=3?vh:(asp>3?vh:vw/1.2);
  cv.style.width=cw+'px';cv.style.height=ch+'px';CW=cw;CH=ch;cv.style.transform=FORCED?'rotate(90deg)':'';cv.style.flex='none';
  if(READY){if(FORCED){SAFE.l=SAFE.r=0}else readSafe();layoutTouch();updateRot()}
}
addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,150));if(window.visualViewport) visualViewport.addEventListener('resize',fit);fit();
function toggleFullIn(){try{if(document.fullscreenElement||document.webkitFullscreenElement) return;const el=document.documentElement,r=(el.requestFullscreen||el.webkitRequestFullscreen).call(el);const lock=()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}};if(r&&r.then) r.then(lock).catch(()=>{}); else lock()}catch(e){}}
function toggleFull(){
  try{
    const el=document.documentElement;
    if(document.fullscreenElement||document.webkitFullscreenElement){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return}
    const r=(el.requestFullscreen||el.webkitRequestFullscreen).call(el);
    const lock=()=>{try{screen.orientation.lock('landscape').catch(()=>{})}catch(e){}};
    if(r&&r.then) r.then(lock).catch(()=>{}); else lock();
  }catch(e){}
}

// --- Données de configuration (à modifier facilement) ---
const SKINS=[{id:'orig',n:'ORIGINAL'},{id:'gold',n:'OR',c:'#e0a820'},{id:'red',n:'ROUGE',c:'#c9372c'},{id:'blue',n:'BLEU',c:'#2f6fd0'},{id:'green',n:'VERT',c:'#3da05a'},{id:'purple',n:'VIOLET',c:'#8a4fd0'},{id:'orange',n:'ORANGE',c:'#e0832a'},{id:'pink',n:'ROSE',c:'#e05a9a'},{id:'cyan',n:'CYAN',c:'#2fc7d6'},{id:'white',n:'BLANC',c:'#e8e8ee'}];
const WOODS=[{id:'orig',n:'ORIGINAL'},{id:'dark',n:'FONCÉ',c:'#4e2d16'},{id:'light',n:'CLAIR',c:'#d6b27c'}];
const CAT=['MÊLÉE','PISTOLETS','PM','ASSAUT','POMPES','PRÉCISION','LOURDES','SPÉCIAL','AKIMBO'];
const KINDS={
  pistol:{len:22,thick:7},revolver:{len:24,thick:8},deagle:{len:26,thick:9},nailgun:{len:20,thick:8},
  smg:{len:26,thick:7},ak:{len:44,thick:8},m4:{len:44,thick:8},lmg:{len:48,thick:9},
  shotgun:{len:42,thick:8},dmr:{len:50,thick:7,scope:true},barrett:{len:58,thick:9,scope:true},
  minigun:{len:54,thick:14},crossbow:{len:30,thick:8},bow:{len:24,thick:5},flamer:{len:40,thick:11},
  launcher:{len:48,thick:12},rail:{len:50,thick:8},laser:{len:40,thick:6},
};
// portée utile (px) : ni trop courte ni infinie — l'écran fait ~960 px de large
const RANGE={pistol:640,revolver:720,deagle:780,nailgun:480,smg:640,ak:960,m4:1000,lmg:1000,shotgun:500,dmr:1250,barrett:1450,minigun:900,crossbow:850,bow:780,flamer:150,launcher:950,rail:1600,laser:1150};
const PALS=[['#2a2a2e','#8a5a30'],['#33363a','#6b4a2a'],['#2f3a2c','#7a5a30'],['#3a3a3a','#a07040'],['#2a303a','#5a3a22'],['#44413a','#8a6a40']];
const WEAPONS=[];
function M(name,kind,dmg,rate,reach,o){WEAPONS.push(Object.assign({cat:'MÊLÉE',name,kind,melee:true,dmg,rate,reach,auto:true},o||{}))}
function G(cat,name,kind,dmg,rate,spread,speed,pierce,auto,o){
  WEAPONS.push(Object.assign({cat,name,kind,dmg,rate,pellets:1,spread,speed,pierce,auto:!!auto,range:RANGE[kind]||800},KINDS[kind],o||{}));
}
const NEWWS={},NEWWSG={};   // sons des nouvelles armes (fusionnés avec WS / WSG plus bas)
function N(cat,name,kind,dmg,rate,spread,speed,pierce,auto,snd,o){G(cat,name,kind,dmg,rate,spread,speed,pierce,auto,o);if(kind==='shotgun'&&snd&&snd.length===4&&typeof snd[0]==='number') NEWWSG[name]=snd; else if(snd) NEWWS[name]=snd}
// Akimbo : deux armes, une par main, qui tirent chacune leur tour
function D(name,a,b){
  const A=WEAPONS.find(w=>w.name===a),B=WEAPONS.find(w=>w.name===b);if(!A||!B) throw new Error('akimbo '+name);
  const av=k=>(A[k]+B[k])/2;
  WEAPONS.push({cat:'AKIMBO',name,kind:'dual',hands:[a,b],dmg:Math.round(av('dmg')*10)/10,rate:Math.round(av('rate')*.6),pellets:Math.round(av('pellets')),spread:av('spread'),speed:av('speed'),
    pierce:Math.max(A.pierce,B.pierce),auto:A.auto&&B.auto,len:32,thick:8,range:Math.round(av('range')),hi:[WEAPONS.indexOf(A),WEAPONS.indexOf(B)]});
}
// Mêlée (le couteau est toujours l'arme n°1)
M('Couteau','knife',28,280,62,{blade:23});
M('Poignard','blade',30,220,54,{blade:20});
M('Machette','blade',40,330,70,{blade:34});
M('Hache de bûcheron','axe',65,480,72);
M('Batte cloutée','bat',55,420,76);
M('Katana','blade',50,260,86,{blade:52,bc:'#e4eaf2'});
M('Marteau de guerre','hammer',95,650,74);
M('Faux','scythe',80,520,112);
M('Tronçonneuse','chainsaw',14,70,66);
// Pistolets
G('PISTOLETS','Glock 17','pistol',12,330,.03,16,1,0);
G('PISTOLETS','Beretta 92','pistol',13,300,.03,16,1,0);
G('PISTOLETS','M1911','pistol',18,380,.03,17,1,0);
G('PISTOLETS','USP','pistol',14,280,.03,17,1,0);
G('PISTOLETS','CZ 75','pistol',11,240,.04,16,1,0);
G('PISTOLETS','Five-seveN','pistol',15,260,.03,20,2,0);
G('PISTOLETS','Sig P226','pistol',15,300,.02,17,1,0);
G('PISTOLETS','Makarov','pistol',10,260,.04,15,1,0);
G('PISTOLETS','Tokarev TT-33','pistol',17,340,.03,19,2,0);
G('PISTOLETS','Glock 18','pistol',6,70,.12,16,1,1);
G('PISTOLETS','Revolver Python','revolver',38,520,.02,19,2,0);
G('PISTOLETS','Magnum 44','revolver',52,650,.02,20,3,0);
G('PISTOLETS','Desert Eagle','deagle',42,450,.02,21,2,0);
// Pistolets-mitrailleurs
G('PM','Uzi','smg',6,75,.14,17,1,1);
G('PM','MAC-10','smg',5,55,.2,16,1,1);
G('PM','MP5','smg',8,90,.07,18,1,1);
G('PM','MP7','smg',7,70,.07,20,1,1);
G('PM','P90','smg',7,62,.08,20,2,1);
G('PM','Vector','smg',6,50,.1,18,1,1);
G('PM','Skorpion','smg',5,66,.15,16,1,1);
G('PM','Thompson M1928','smg',11,100,.11,17,1,1);
G('PM','PPSh-41','smg',9,65,.14,16,1,1);
G('PM','UMP45','smg',10,105,.06,18,1,1);
G('PM','Bizon','smg',7,80,.09,17,1,1);
G('PM','MP40','smg',9,110,.09,17,1,1);
G('PM','AKS-74U','smg',11,95,.09,19,1,1);
// Fusils d'assaut
G('ASSAUT','AK-47','ak',13,110,.08,19,1,1);
G('ASSAUT','AKM','ak',14,115,.07,19,1,1);
G('ASSAUT','AK-74','ak',12,95,.06,21,1,1);
G('ASSAUT','AK-12','ak',13,85,.05,21,1,1);
G('ASSAUT','AN-94','ak',14,100,.04,22,2,1);
G('ASSAUT','M4A1','m4',11,85,.05,20,1,1);
G('ASSAUT','M16A4','m4',15,130,.03,22,2,1);
G('ASSAUT','HK416','m4',12,80,.04,21,1,1);
G('ASSAUT','SCAR-H','m4',18,120,.05,22,2,1);
G('ASSAUT','FAMAS','m4',9,62,.06,21,1,1);
G('ASSAUT','Galil','m4',13,100,.06,20,1,1);
G('ASSAUT','Steyr AUG','m4',11,82,.04,21,1,1);
G('ASSAUT','G36','m4',11,88,.04,21,1,1);
G('ASSAUT','SIG 552','m4',11,80,.05,20,1,1);
G('ASSAUT','FN FAL','m4',20,150,.06,22,2,1);
G('ASSAUT','H&K G3','m4',22,160,.07,22,2,1);
G('ASSAUT','Tavor','m4',12,78,.05,21,1,1);
G('ASSAUT','QBZ-95','m4',11,84,.05,21,1,1);
// Fusils à pompe
G('POMPES','Remington 870','shotgun',9,700,.35,15,1,0,{pellets:8});
G('POMPES','Mossberg 500','shotgun',9,650,.36,15,1,0,{pellets:8});
G('POMPES','Benelli M4','shotgun',8,420,.32,15,1,0,{pellets:8});
G('POMPES','SPAS-12','shotgun',10,520,.30,16,1,0,{pellets:8});
G('POMPES','KSG','shotgun',9,800,.34,15,1,0,{pellets:10});
G('POMPES','Winchester 1887','shotgun',12,600,.30,16,1,0,{pellets:7});
G('POMPES','AA-12','shotgun',7,180,.38,15,1,1,{pellets:7});
G('POMPES','Saiga-12','shotgun',8,300,.34,15,1,1,{pellets:8});
G('POMPES','Double canon','shotgun',14,900,.45,14,1,0,{pellets:12});
G('POMPES','Vepr-12','shotgun',9,350,.33,15,1,1,{pellets:8});
// Précision
G('PRÉCISION','Dragunov SVD','dmr',48,420,0,25,3,0);
G('PRÉCISION','M14 EBR','dmr',32,260,.01,24,2,0);
G('PRÉCISION','SKS','dmr',26,300,.02,22,2,0);
G('PRÉCISION','Mosin-Nagant','dmr',55,800,0,26,3,0);
G('PRÉCISION','Kar98k','dmr',58,850,0,26,3,0);
G('PRÉCISION','Lee-Enfield','dmr',46,600,0,25,3,0);
G('PRÉCISION','Winchester 94','dmr',34,500,.01,22,2,0);
G('PRÉCISION','Remington 700','dmr',70,900,0,28,4,0);
G('PRÉCISION','Steyr Scout','dmr',52,700,0,27,3,0);
G('PRÉCISION','M24 SWS','dmr',80,1000,0,29,5,0);
G('PRÉCISION','AWP','dmr',105,1300,0,30,6,0);
G('PRÉCISION','CheyTac M200','barrett',115,1200,0,31,8,0);
G('PRÉCISION','Barrett M82','barrett',120,900,0,30,8,0);
G('PRÉCISION','PGM Hécate II','barrett',160,1100,0,32,10,0);
// Armes lourdes
G('LOURDES','M249','lmg',9,75,.09,19,1,1);
G('LOURDES','PKM','lmg',12,95,.1,20,1,1);
G('LOURDES','RPK','lmg',10,80,.08,19,1,1);
G('LOURDES','MG42','lmg',8,45,.13,19,1,1);
G('LOURDES','M60','lmg',13,105,.09,20,1,1);
G('LOURDES','Browning M2','lmg',24,160,.07,22,3,1);
G('LOURDES','Negev','lmg',9,62,.08,20,1,1);
G('LOURDES','MG4','lmg',9,66,.08,20,1,1);
G('LOURDES','Stoner 63','lmg',10,72,.07,20,1,1);
G('LOURDES','BAR M1918','lmg',15,120,.06,21,2,1);
G('LOURDES','Minigun','minigun',8,40,.2,18,1,1);
// Spécial
G('SPÉCIAL','Arbalète','crossbow',60,700,.01,20,2,0,{col:'#d8c08a',size:3});
G('SPÉCIAL','Arc de chasse','bow',40,500,.01,19,2,0,{col:'#d8c08a',size:3});
G('SPÉCIAL','Pistolet à clous','nailgun',7,60,.08,18,1,1,{col:'#ccc'});
G('SPÉCIAL','Lance-flammes','flamer',3,25,.22,7,99,1,{life:16,fire:true});
G('SPÉCIAL','Lance-grenades M79','launcher',70,900,.02,11,1,0,{aoe:90,col:'#9fb36a',size:4});
G('SPÉCIAL','RPG-7','launcher',120,1400,.01,12,1,0,{aoe:120,col:'#ffb040',size:4});
G('SPÉCIAL','Bazooka','launcher',160,1600,.01,13,1,0,{aoe:140,col:'#ffb040',size:5});
G('SPÉCIAL','Railgun','rail',300,1300,0,40,99,0,{col:'#6fe9ff',size:4});
G('SPÉCIAL','Fusil laser','laser',10,55,.01,40,6,1,{col:'#ff4a4a',size:2});
G('SPÉCIAL','Fusil à plasma','laser',28,220,.02,18,1,1,{aoe:45,col:'#7dff6a',size:4});
G('SPÉCIAL','Fusil harpon','crossbow',85,1100,0,22,3,0,{col:'#cfd5dd',size:3});
G('SPÉCIAL','Pistolet laser','laser',7,120,.02,40,3,0,{col:'#ff4a4a',size:2,len:24});

