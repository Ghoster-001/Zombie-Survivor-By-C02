// ===== V0.52 : multijoueur coopératif (l'hôte fait tourner la partie, les invités reçoivent l'état en direct) =====
const MP={on:false,role:'',started:false,peer:null,code:'',status:'off',msg:'',guests:[],lobby:{pl:[],map:'ruines',diff:'normal'},sel:{map:'ruines',diff:'normal'},myId:0,hostConn:null,ready:false,gid:'',
  evq:[],sfxQ:new Set(),seq:0,snapT:0,pingT:0,lobT:0,inT:0,cp:null,zmap:new Map(),zst:new Map(),others:new Map(),pinfo:{},lastSnapAt:0,ping:0,nid:0,inp:{l:0,r:0,j:0,f:0,a:0,fc:1},ncp:0};
let flashCtx=null,aimOv=null;
const mpHost=()=>MP.on&&MP.role==='host',mpGuest=()=>MP.on&&MP.role==='guest';
const MPCH='ic02m-',QL=['—','FAIBLE','MOYEN','BON','EXCELLENT'];
const mpName=()=>save.mpname||(save.mpname='JOUEUR-'+genCode().slice(0,3));
const cleanName=n=>String(n||'').replace(/[^A-Za-z0-9À-ÿ _\-\.]/g,'').trim().toUpperCase().slice(0,14)||'JOUEUR';
const qOf=ms=>ms<70?4:ms<130?3:ms<230?2:1;
const num=(v,a,b,d)=>{v=+v;return isFinite(v)?Math.max(a,Math.min(b,v)):d};
// --- contextes de joueurs : on rejoue le code existant « en tant que » un invité (même fonctions, mêmes réglages) ---
function runAs(g,fn){
  if(!g) return fn();
  const sv={player,fxB,fxL,fxMax,stock,charXp,charLvl,up:save.up,fc:flashCtx};
  player=g.p;fxB=g.fxb;fxL=g.fxl;fxMax=g.fxm;stock=g.stock;charXp=g.cxp;charLvl=g.clv;save.up=g.up;flashCtx=g;
  try{return fn()}finally{g.cxp=charXp;g.clv=charLvl;g.stock=stock;player=sv.player;fxB=sv.fxB;fxL=sv.fxL;fxMax=sv.fxMax;stock=sv.stock;charXp=sv.charXp;charLvl=sv.charLvl;save.up=sv.up;flashCtx=sv.fc}
}
const asT=(T,fn)=>T&&T.g?runAs(T.g,fn):fn();
function targets(){
  const a=[{g:null,p:player}];
  if(mpHost()) for(const g of MP.guests) if(g.p) a.push({g,p:g.p});
  const alive=a.filter(t=>!t.p.dead);return alive.length?alive:[a[0]];
}
const nearestT=(TG,x)=>{let b=TG[0],d=Math.abs(b.p.x-x);for(let i=1;i<TG.length;i++){const e=Math.abs(TG[i].p.x-x);if(e<d){d=e;b=TG[i]}}return b};
const allCtx=()=>[{g:null}].concat(mpHost()?MP.guests.filter(g=>g.p).map(g=>({g})):[]);
const mpMul=()=>mpHost()?1+.35*MP.guests.length:1;
function flashG(t){flash(t);if(mpHost()) MP.evq.push(['f',t])}                  // message pour tout le monde
// --- arrêt / quitter ---
function mpStop(){
  if(MP.rp){const gs=MP.guests;MP.guests=[];for(const g of gs){try{g.conn.send({t:'end'})}catch(e){}}rpStop();MP.rp=false;MP.hostLook=null}
  try{for(const g of MP.guests){try{g.conn.send({t:'end',why:'L\'hôte a fermé la partie'});g.conn.close()}catch(e){}}}catch(e){}
  try{MP.hostConn&&MP.hostConn.send({t:'leave'})}catch(e){}
  try{MP.hostConn&&MP.hostConn.close()}catch(e){}try{MP.peer&&MP.peer.destroy()}catch(e){}
  MP.peer=null;MP.hostConn=null;MP.guests=[];MP.on=false;MP.started=false;MP.role='';MP.status='off';MP.msg='';MP.zmap.clear();MP.zst.clear();MP.others.clear();MP.evq.length=0;MP.sfxQ.clear();flashCtx=null;aimOv=null;MP.cp=null;MP.ready=false;
}
function mpLeaveToMenu(msg){
  const wasGuest=MP.role==='guest',cp=MP.cp,started=MP.started;
  mpStop();
  if(wasGuest&&started&&cp) mpApplyReward(cp,false);                    // dernier point de sauvegarde signé par l'hôte
  reset(true);state='menu';if(msg) flash(msg);
}
// --- HÔTE ---
function mpStartHost(){
  if(gameMode!=='2D'&&gameMode!=='3D'){MP.msg='Multijoueur indisponible en mode '+gameMode;return}
  if(gameMode==='3D'&&G3.status!=='ready'){MP.msg='3D en cours de chargement… réessaie dans un instant';g3Request();return}
  if(!ACG.ok()){MP.msg=ACG.why();return}
  mpStop();MP.role='host';MP.sel.mode='coop';MP.sel.nm=!!NM.mpWanted;MP.status='load';MP.msg='Chargement…';MP.sel.map=curMap.id;MP.sel.diff='normal';
  loadPeerJS(()=>{
    const open=tries=>{
      MP.code=genCode();const peer=new Peer(MPCH+MP.code,{debug:0});MP.peer=peer;
      peer.on('open',()=>{MP.status='wait';MP.msg=''});
      peer.on('connection',c=>mpHostConn(c));
      peer.on('error',e=>{if(e.type==='unavailable-id'&&tries<6){try{peer.destroy()}catch(_){}open(tries+1);return}MP.status='err';MP.msg=errText(e)});
      peer.on('disconnected',()=>{try{peer.reconnect()}catch(e){}});
    };open(0);
  },()=>{MP.status='err';MP.msg='Module de connexion introuvable (hors ligne ?)'});
  state='mphost';
}
function mpHostConn(c){
  const maxG=(gameMode==='3D'&&MP.sel.mode&&MP.sel.mode!=='coop')?9:3;
  if(MP.started||MP.guests.length>=maxG){c.on('open',()=>{try{c.send({t:'rej',why:MP.started?'Partie déjà commencée':'Salon complet ('+(maxG+1)+' joueurs)'})}catch(e){}setTimeout(()=>{try{c.close()}catch(e){}},400)});return}
  const used=new Set(MP.guests.map(g=>g.id));let id=1;while(used.has(id)) id++;
  const g={id,conn:c,name:'…',lvl:1,ready:false,ok:false,ping:0,rtts:[],q:0,nonce:genCode()+genCode(),inp:{l:0,r:0,j:0,f:0,a:0,fc:1},p:null,msgs:[],known:new Set(),cnt:0,cntT:0,last:performance.now(),look:null,up:{},prof:null,fxb:{shield:0,dmg:0,rapid:0,freeze:0,magnet:0,adren:0},fxl:{},fxm:{},stock:[],cxp:0,clv:1,dead:false};
  MP.guests.push(g);
  c.on('open',()=>{try{c.send({t:'chal',n:g.nonce})}catch(e){}});
  c.on('data',d=>mpHostData(g,d));
  c.on('close',()=>mpGuestLeft(g));
  c.on('error',()=>mpGuestLeft(g));
}
function mpGuestLeft(g){
  const i=MP.guests.indexOf(g);if(i<0) return;
  MP.guests.splice(i,1);if(typeof FW!=='undefined'&&FW.on) fwmGuestGone(g);try{g.conn.close()}catch(e){}
  if(MP.started){flashG((g.name||'Un joueur')+' a quitté la partie')}
}
function mpValidHello(g,d){
  if(!d||typeof d.n!=='string') return 'profil invalide';
  if(d.v!==GAME_VERSION) return 'version différente (hôte : V'+GAME_VERSION+')';
  if(d.acv!==ACG.VER) return 'version de l\'anti-triche différente';
  const lvl=num(d.lvl,1,500,1)|0,hp=num(d.hp,0,MAX_UP,0)|0;
  const melee=WEAPONS.find(w=>w.name===d.mel&&w.melee);if(!melee) return 'arme de mêlée invalide';
  const up={};if(d.up&&typeof d.up==='object'){let n=0;for(const k in d.up){if(++n>260) return 'profil invalide';const w=WEAPONS.find(x=>x.name===k);const l=d.up[k];if(!w||!Number.isInteger(l)||l<0||l>4) return 'améliorations invalides';up[k]=l}}
  const n=cleanName(d.n);
  if(d.tok!==ACG.profTok(g.nonce,{n:d.n,lvl:d.lvl,hp:d.hp,mel:d.mel,v:d.v,up:d.up||{}})) return 'jeton anti-triche invalide';
  g.name=n;g.lvl=lvl;g.hpLvl=hp;g.mel=melee.name;g.up={};for(const k in up) g.up[k]={lvl:up[k]};g.look=sanitizeLook(d.look);g.av=avIdx(d.av);g.ok=true;
  return '';
}
function sanitizeLook(L){const o={outfit:0,sex:'m',build:0,skin:null,hair:null,top:null,pants:null,hat:null,shoes:null};if(!L||typeof L!=='object') return o;
  o.outfit=num(L.outfit,0,OUTFITS.length-1,0)|0;o.sex=L.sex==='f'?'f':'m';o.build=L.build===1?1:0;
  const col=v=>typeof v==='string'&&/^#[0-9a-fA-F]{3,8}$/.test(v)?v:null;for(const k of['skin','hair','top','pants','hat','shoes']) o[k]=col(L[k]);return o}
function mpHostData(g,d){
  if(!d||typeof d!=='object') return;
  const now=performance.now();g.last=now;
  if(now-g.cntT>1000){g.cntT=now;g.cnt=0}
  if(++g.cnt>150){ACG.note('Invité '+g.name+' : trop de messages, déconnexion');try{g.conn.send({t:'rej',why:'Trop de messages'})}catch(e){}mpGuestLeft(g);return}
  switch(d.t){
    case 'hello':{
      const why=mpValidHello(g,d);
      if(why){try{g.conn.send({t:'rej',why})}catch(e){}ACG.note('Invité refusé : '+why);setTimeout(()=>mpGuestLeft(g),400);return}
      g.conn.send({t:'wel',id:g.id,v:GAME_VERSION});mpLobbySend();break}
    case 'rdy':if(g.ok&&!MP.started){g.ready=!!d.r;mpLobbySend()}break;
    case 'in':if(!g.ok) return;g.inp={l:d.l?1:0,r:d.r?1:0,j:d.j?1:0,f:d.f?1:0,a:num(d.a,-320,320,0)/100,fc:d.fc<0?-1:1};break;
    case 'ev':if(!g.ok||!MP.started||!g.p||g.p.dead) return;
      if(d.k==='pick') guestPick(g);else if(d.k==='bonus') runAs(g,useBonus);break;
    case 'pg':if(typeof d.n==='number'){const r=Math.max(1,Math.round(now-d.n));g.rtts.push(r);if(g.rtts.length>6) g.rtts.shift();g.ping=Math.round(g.rtts.reduce((a,b)=>a+b,0)/g.rtts.length);g.q=qOf(g.ping)}break;
    case 'leave':mpGuestLeft(g);break;
    case 'p3':case 'sh3':case 'ml3':case 'pk3':case 'bn3':break;   // messages 3D : ignorés (version web 2D)
  }
}
const lobEntry=(id,n,lvl,ping,q,r,av)=>({id,n,lvl,ping,q,r,av:av|0});
function mpLobbyList(){
  const l=[lobEntry(0,cleanName(mpName()),curLevel(),0,4,1,save.avatar)];
  for(const g of MP.guests) if(g.ok) l.push(lobEntry(g.id,g.name,g.lvl,g.ping,g.q,g.ready?1:0,g.av));
  return l;
}
function mpLobbySend(){
  if(gameMode==='3D'){if(!MP.preSeed) MP.preSeed=Math.floor(Math.random()*2147483000)+1;try{fwPrebuild((MP.sel.mode||'coop')!=='coop'?17:7,MP.preSeed)}catch(e){}}
  MP.lobby={pl:mpLobbyList(),map:MP.sel.map,diff:MP.sel.diff,mode:MP.sel.mode,m3:gameMode==='3D',nm:!!MP.sel.nm};
  for(const g of MP.guests) if(g.ok&&g.conn.open){try{g.conn.send({t:'lob',pl:MP.lobby.pl,map:MP.sel.map,diff:MP.sel.diff,mode:MP.sel.mode,m3:gameMode==='3D',nm:!!MP.sel.nm,you:g.id,seed:gameMode==='3D'?MP.preSeed:0})}catch(e){}}
}
function mpStartGame(){
  if(MP.role!=='host'||MP.started) return;
  if(!ACG.ok()){MP.msg=ACG.why();return}
  if(MP.guests.some(g=>g.ok&&!g.ready)){MP.msg='Tous les joueurs doivent être prêts';return}
  const m=MAPS.find(x=>x.id===MP.sel.map)||MAPS[0],d=DIFFS.find(x=>x.id===MP.sel.diff)||DIFFS[1];
  if(!mapUnlocked(m)||!diffUnlocked(m,d)){MP.msg='Carte ou difficulté non débloquée';return}
  MP.guests=MP.guests.filter(g=>g.ok);
  if(gameMode==='3D'&&G3.status==='ready'){fwmHostStart();return}
  MP.gid=genCode()+genCode()+Date.now().toString(36);MP.started=true;MP.on=true;MP.msg='';
  curMap=m;curDiff=d;training=false;mapTrain=false;NM.on=!!MP.sel.nm;NM.bonus=true;applyMap();
  for(const g of MP.guests) mpMakeGuest(g);
  reset(false);
  MP.hostP=player;
  const info=[{id:0,n:cleanName(mpName()),look:save.look}].concat(MP.guests.map(g=>({id:g.id,n:g.name,look:g.look})));
  for(const g of MP.guests){try{g.conn.send({t:'go',map:m.id,diff:d.id,gid:MP.gid,id:g.id,pl:info,nm:MP.sel.nm?1:0})}catch(e){}}
}
function mpMakeGuest(g){
  const mhp=100+20*g.hpLvl,mi=mainMelee(WEAPONS.findIndex(w=>w.name===g.mel));
  g.p={x:WORLD_W/2+(g.id%2?1:-1)*60*g.id,y:GROUND,vy:0,hp:mhp,maxhp:mhp,w:mi,melee:mi,gun:null,cd:0,dmgMul:1,hurtCd:0,face:1,step:0,aim:0,swing:0,muz0:0,muz1:0,dead:false};
  g.fxb={shield:0,dmg:0,rapid:0,freeze:0,magnet:0,adren:0};g.fxl={};g.fxm={};g.stock=[];g.cxp=0;g.clv=1;g.inp={l:0,r:0,j:0,f:0,a:0,fc:1};g.msgs=[];g.known=new Set();
}
// --- un pas de simulation pour un invité (déplacement, tir, bonus) ---
function guestStep(g,dt){
  if(!g.p) return;
  runAs(g,()=>{
    const p=g.p,i=g.inp;
    p.cd-=dt;p.hurtCd-=dt;p.swing-=dt;p.muz0-=dt;p.muz1-=dt;
    for(const k in fxB) if(fxB[k]>0) fxB[k]=Math.max(0,fxB[k]-dt);
    if(p.gun&&p.gun.time>0){p.gun.time-=dt;if(p.gun.time<=0) dropGun('TEMPS ÉCOULÉ')}
    p.vy+=GRAV;p.y+=p.vy;if(p.y>GROUND){p.y=GROUND;p.vy=0}
    if(p.dead) return;
    const mv=(i.r?1:0)-(i.l?1:0);
    p.x+=mv*4;p.x=Math.max(80,Math.min(WORLD_W-80,p.x));if(mv) p.step+=.25;
    if(i.j&&p.y>=GROUND) p.vy=-13;
    p.face=i.fc;p.aim=i.a;aimOv=i.a;
    const wp=WEAPONS[p.w];
    if(i.f&&p.cd<=0&&(wp.auto||!p.held)){if(wp.melee) slash();else{shoot();useAmmo()}}
    p.held=!!i.f;aimOv=null;
  });
}
function guestPick(g){
  let picked=null;
  runAs(g,()=>{
    const p=player;let best=null,bd=64;
    for(const c of crates){if(!c.landed||c.dead) continue;const d=Math.hypot(p.x-c.x,(p.y-30)-(c.y-12));if(d<bd){bd=d;best=c}}
    if(!best) return;
    pickCrate(best);best.dead=true;crates=crates.filter(c=>!c.dead);picked=best;
  });
  if(picked) mpShareGift(picked,g);
}
function mpShareGift(c,pg){                                              // cadeaux de Noël : tout le monde reçoit le bonus (les caisses normales : le premier qui les prend)
  if(!mpHost()||!c.gift) return;const k=c.gift.k;if(k!=='heal'&&k!=='shield'&&k!=='weapon') return;
  for(const x of allCtx()){
    if(x.g===pg||(!x.g&&!pg)) continue;
    const dead=x.g?x.g.p.dead:MP.hostP.dead;if(dead) continue;
    runAs(x.g,()=>pickCrate(Object.assign({},c)));
  }
}
// --- état de la partie envoyé aux invités ---
const E_=y=>Math.round(y-GROUND),R1=v=>Math.round(v*10)/10;
const pEnt=(id,p)=>[id,R1(p.x),E_(p.y),p.face,Math.round((p.aim||0)*100),Math.ceil(Math.max(0,p.hp)),p.maxhp,p.w,R1(p.step),Math.max(0,p.swing|0),Math.max(0,p.muz0|0),Math.max(0,p.muz1|0),p.hurtCd>0?1:0,p.dead?1:0,Math.max(0,p.cd|0)];
const ZSTAT=['type','size','maxhp','skin','shirt','gseed','xm','animal','hh','hw','color'];
function mpSnapCommon(){
  const P=[pEnt(0,player)];for(const g of MP.guests) if(g.p) P.push(pEnt(g.id,g.p));
  const Z=[];for(const z of zombies){if(!z.id) z.id=++MP.nid;Z.push([z.id,R1(z.x),E_(z.y),z.dir,R1(z.step),Math.ceil(Math.max(0,z.hp)),(z.emerge>0?1:0)|(z.fall!==undefined?2:0)|(z.inv?4:0)|(z.stun>0?8:0),(z.emerge>0||z.mag)?{e:z.emerge|0,ph:z.ph,pt:z.pt|0,arm:z.arm|0}:0])}
  const B=[];for(let i=0;i<bullets.length&&i<140;i++){const b=bullets[i];B.push([R1(b.x),E_(b.y),R1(b.vx),R1(b.vy),b.col,b.size,b.fire?1:0,b.life,b.l0||0])}
  const C=crates.map(c=>({id:c.id||(c.id=++MP.nid),x:R1(c.x),y:E_(c.y),landed:c.landed?1:0,w:c.w,ammo:c.ammo,time:c.time,sup:c.sup,gift:c.gift,hp:c.hp,ph:c.ph,age:c.age|0,gl:c.gl,gs:c.gs,gwd:c.gwd,gc:c.gc}));
  const K=bonuses.map(b=>[b.type,R1(b.x),E_(b.y),b.life|0,b.gold?1:0]);
  const E=ents.map(e=>{const o={};for(const k of['k','x','hp','max','w','ice','r','t','arm','dir','hit','L']) if(e[k]!==undefined) o[k]=e[k];if(e.y!==undefined) o.y=E_(e.y);if(e.tr) o.tr=e.tr;return o});
  const S=sleighs.map(s=>({kind:s.kind,x:R1(s.x),y:E_(s.y),dir:s.dir,evil:s.evil,fem:s.fem,spd:s.spd}));
  const A=acid.map(a=>[R1(a.x),E_(a.y),a.c||0,a.bc||0,a.g||0]);
  return{t:'s',n:++MP.seq,w:wave,rem:zombies.length+spawnQueue.length,m:money,x:runXp,k:kills,wb:waveBreak,bs:Math.round(bloodSnow*100)/100,cn:cine?cine.t|0:0,mg:magWave?1:0,P,Z,B,C,K,E,S,A,
    T:turret?{x:R1(turret.x),t:turret.t|0,max:turret.max}:0,X:strikes.map(s=>[R1(s.x),s.t|0]),ev:MP.evq.splice(0,60),sf:Array.from(MP.sfxQ),gc:camX};
}
function mpHostSend(){
  if(typeof FW!=='undefined'&&FW.on){MP.evq.length=0;MP.sfxQ.clear();return}
  if(!MP.started||!MP.guests.length){MP.evq.length=0;MP.sfxQ.clear();return}
  const c=mpSnapCommon();MP.sfxQ.clear();
  for(const g of MP.guests){
    if(!g.conn.open||!g.p) continue;
    const p=g.p,fx={};for(const k in g.fxb) if(g.fxb[k]>0) fx[k]=Math.round(g.fxb[k]);
    const ZN=[];for(const z of zombies){if(!g.known.has(z.id)){g.known.add(z.id);const o={id:z.id};for(const k of ZSTAT) if(z[k]!==undefined) o[k]=z[k];if(z.boss) o.boss={id:z.boss.id,n:z.boss.n};if(z.mag) o.mag=1;ZN.push(o)}}
    const me={hp:Math.ceil(Math.max(0,p.hp)),mx:p.maxhp,w:p.w,g:p.gun?{w:p.gun.w,ammo:p.gun.ammo,time:p.gun.time|0,a0:p.gun.a0,t0:p.gun.t0,gl:p.gun.gl,gs:p.gun.gs,gwd:p.gun.gwd}:0,fx,fm:g.fxm,st:g.stock,cx:g.cxp,cl:g.clv,d:p.dead?1:0,px:R1(p.x),py:E_(p.y),msgs:g.msgs.splice(0,6)};
    try{g.conn.send(Object.assign({},c,{me,ZN}))}catch(e){}
  }
}
function mpCheckpoint(){
  for(const g of MP.guests){try{g.conn.send({t:'cp',gid:MP.gid,id:g.id,w:wave-1,k:kills,m:money,x:runXp,sig:ACG.rcpt(MP.gid,g.id,wave-1,kills,money,runXp)})}catch(e){}}
}
function mpGameOver(){
  for(const g of MP.guests){try{g.conn.send({t:'over',gid:MP.gid,id:g.id,w:wave,k:kills,m:money,x:runXp,src:runSrc,sig:ACG.rcpt(MP.gid,g.id,wave,kills,money,runXp)})}catch(e){}}
  MP.started=false;
}
function mpBackToLobby(){
  if(MP.rp){rpBackToSetup();return}
  MP.on=false;MP.started=false;MP.zmap.clear();MP.zst.clear();MP.others.clear();
  for(const g of MP.guests){g.ready=false;g.p=null}
  if(MP.role==='host'){reset(true);state='mphost';mpLobbySend()}
  else{reset(true);state=MP.hostConn&&MP.hostConn.open?'mplobby':'menu'}
}
// --- INVITÉ ---
function mpJoin(code){
  if(gameMode!=='2D'&&gameMode!=='3D'){MP.status='err';MP.msg='Multijoueur indisponible en mode '+gameMode;state='mpmenu';return}
  if(!ACG.ok()){MP.msg=ACG.why();MP.status='err';state='mpmenu';return}
  mpStop();MP.role='guest';MP.status='load';MP.msg='Chargement…';MP.code=code;
  loadPeerJS(()=>{
    const peer=new Peer({debug:0});MP.peer=peer;let to=0;
    const fail=m=>{if(MP.status!=='ok'){MP.status='err';MP.msg=m;try{MP.hostConn&&MP.hostConn.close()}catch(e){}}};
    peer.on('open',()=>{
      MP.status='conn';MP.msg='Connexion à la partie…';
      const c=peer.connect(MPCH+code,{serialization:'json',reliable:true});MP.hostConn=c;
      to=setTimeout(()=>fail('Connexion impossible : code incorrect, hôte absent ou réseau trop restrictif'),15000);
      c.on('open',()=>{clearTimeout(to)});
      c.on('data',d=>mpGuestData(d));
      c.on('close',()=>{clearTimeout(to);if(MP.role==='guest'&&MP.hostConn===c){if(MP.status==='ok'||MP.started) mpLeaveToMenu('Hôte déconnecté');else if(MP.status!=='err'){MP.status='err';MP.msg='Connexion fermée par l\'hôte'}}});
      c.on('error',()=>fail('Erreur de connexion'));
    });
    peer.on('error',e=>fail(errText(e)));
  },()=>{MP.status='err';MP.msg='Module de connexion introuvable (hors ligne ?)'});
  state='mpjoining';
}
function mpSend(o){const c=MP.hostConn;if(c&&c.open){try{c.send(o)}catch(e){}}}
function mpGuestData(d){
  if(!d||typeof d!=='object') return;MP.lastSnapAt=performance.now();
  switch(d.t){
    case 'chal':{
      const o=mpProfile(),n=d.n;
      mpSend({t:'hello',n:o.n,lvl:o.lvl,hp:o.hp,mel:o.mel,v:o.v,up:o.up,look:save.look,av:save.avatar|0,acv:ACG.VER,tok:ACG.profTok(n,o)});break}
    case 'wel':MP.status='ok';MP.msg='';MP.myId=d.id;state='mplobby';break;
    case 'rej':MP.status='err';MP.msg=String(d.why||'Refusé').slice(0,80);try{MP.hostConn.close()}catch(e){}state='mpmenu';break;
    case 'lob':MP.lobby={pl:Array.isArray(d.pl)?d.pl:[],map:d.map,diff:d.diff,mode:d.mode,m3:!!d.m3,nm:!!d.nm};if(d.m3&&G3.status==='idle') g3Request();if(d.m3&&(d.seed|0)>0){const sd=d.seed|0;try{fwPrebuild((d.mode||'coop')!=='coop'?17:7,sd)}catch(e){}}MP.myId=d.you;if(state==='mplobby'||state==='mpjoining') state='mplobby';break;
    case 'go':mpGuestGo(d);break;
    case 's':if(MP.on&&!FW.on) mpApplySnap(d);break;
    case 'go3':mpGuestGo3(d);break;
    case 's3':fwmApply(d);break;
    case 'brend':fwmBrApply(d);break;
    case 'fin3':if(FW.on&&FW.pend) fwmBrFinish();break;
    case 'p':mpSend({t:'pg',n:d.n});break;
    case 'cp':if(MP.on&&d.gid===MP.gid&&d.id===MP.myId&&d.sig===ACG.rcpt(d.gid,d.id,d.w,d.k,d.m,d.x)) MP.cp=d;break;
    case 'over':mpGuestOver(d);break;
    case 'end':mpLeaveToMenu(d.why||'Partie terminée');break;
  }
}
function mpProfile(){const up={};for(const k in save.up) up[k]=(save.up[k]&&save.up[k].lvl)|0;return{n:mpName(),lvl:curLevel(),hp:save.hpLvl|0,mel:save.melee,v:GAME_VERSION,up}}
function mpGuestGo3(d){fwmGuestGo(d)}
function mpGuestGo(d){
  const m=MAPS.find(x=>x.id===d.map)||MAPS[0],df=DIFFS.find(x=>x.id===d.diff)||DIFFS[1];
  curMap=m;curDiff=df;training=false;mapTrain=false;NM.on=!!d.nm;NM.bonus=true;MP.gid=String(d.gid||'');MP.myId=d.id|0;MP.on=true;MP.started=true;MP.cp=null;MP.seq=0;
  MP.zmap.clear();MP.zst.clear();MP.others.clear();MP.pinfo={};if(Array.isArray(d.pl)) for(const p of d.pl) MP.pinfo[p.id]={n:cleanName(p.n),look:sanitizeLook(p.look)};
  applyMap();reset(false);state='play';MP.lastSnapAt=performance.now();
}
function mpApplyReward(d,showOver){
  const done=(save.ac&&save.ac.g)||[];
  if(!d||d.sig!==ACG.rcpt(d.gid,d.id,d.w,d.k,d.m,d.x)){ACG.note('Reçu de l\'hôte invalide : gains refusés');return false}
  if(done.includes(d.gid)){ACG.note('Reçu déjà utilisé');return false}
  const cap=(d.w+1)*900*curDiff.g*curMap.gain+5000;
  if(!(d.m>=0&&d.x>=0&&d.m<=cap&&d.x<=cap&&d.w<=1000)){ACG.note('Gains invraisemblables refusés ('+d.m+' $, '+d.x+' XP)');return false}
  wave=d.w;kills=d.k;money=d.m;runXp=d.x;if(d.src&&d.src.kill) runSrc=d.src;
  if(showOver) finishRun();else{recordWaves();save.bank+=money;save.xp+=runXp;save.best=Math.max(save.best,wave);persist()}
  save.ac=save.ac||{};save.ac.g=done.concat([d.gid]).slice(-40);persist();
  return true;
}
function mpGuestOver(d){
  if(!MP.on) return;
  if(typeof FW!=='undefined'&&FW.on) fwStop();
  MP.started=false;MP.on=true;
  if(!mpApplyReward(d,true)){runGain=0;runXp=0;state='over';overXp=xpStart;overLvl=levelOf(xpStart);overPulse=0}
}
// instantané reçu (invité)
function mpApplySnap(s){
  const p=player;
  wave=s.w;money=s.m;runXp=s.x;kills=s.k;waveBreak=s.wb;bloodSnow=s.bs||0;magWave=!!s.mg;
  MP.zrem=s.rem;
  for(const e of s.P){
    const id=e[0];
    if(id===MP.myId){
      p.face=e[3];p.step=e[8];
      const dx=e[1]-p.x;if(Math.abs(dx)>46) p.x=e[1];else p.x+=dx*.12;
      if(Math.abs(GROUND+e[2]-p.y)>30) {p.y=GROUND+e[2]}
      p.swing=e[9];p.muz0=e[10];p.muz1=e[11];p.hurtCd=e[12]?200:0;p.cd=e[14];
    } else {
      let o=MP.others.get(id);if(!o){o={id,x:e[1],y:GROUND+e[2],vy:0};MP.others.set(id,o)}
      o.tx=e[1];o.ty=GROUND+e[2];o.face=e[3];o.aim=e[4]/100;o.hp=e[5];o.maxhp=e[6];o.w=e[7];o.step=e[8];o.swing=e[9];o.muz0=e[10];o.muz1=e[11];o.hurtCd=e[12]?200:0;o.dead=!!e[13];o.cd=e[14];o.gun=null;
    }
  }
  const ids=new Set(s.P.map(e=>e[0]));for(const id of Array.from(MP.others.keys())) if(!ids.has(id)) MP.others.delete(id);
  const m=s.me;
  if(m){
    p.hp=m.hp;p.maxhp=m.mx;p.w=m.w;p.gun=m.g||null;p.dead=!!m.d;
    fxB=Object.assign({shield:0,dmg:0,rapid:0,freeze:0,magnet:0,adren:0},m.fx||{});fxMax=m.fm||{};stock=m.st||[];charXp=m.cx;charLvl=m.cl;
    if(m.msgs) for(const t of m.msgs) flash(t);
    if(p.dead&&Math.abs(m.px-p.x)>4) p.x=m.px;
  }
  for(const n of s.ZN||[]) MP.zst.set(n.id,n);
  const seen=new Set();
  for(const d of s.Z){
    const id=d[0];let z=MP.zmap.get(id);
    if(!z){const st=MP.zst.get(id);if(!st) continue;z=Object.assign({hp:1,speed:1,dmg:0,coins:0,dir:1,step:0},st,{x:d[1],y:GROUND+d[2]});MP.zmap.set(id,z)}
    z.tx=d[1];z.ty=GROUND+d[2];z.dir=d[3];z.step=d[4];z.hp=d[5];const f=d[6];
    z.emerge=(f&1)?((d[7]&&d[7].e)||1):0;z.fall=(f&2)?0:undefined;z.inv=!!(f&4);z.stun=(f&8)?1:0;
    if(d[7]&&z.mag){z.ph=d[7].ph;z.pt=d[7].pt;z.arm=d[7].arm}
    seen.add(id);
  }
  for(const id of Array.from(MP.zmap.keys())) if(!seen.has(id)){MP.zmap.delete(id);MP.zst.delete(id)}
  zombies=Array.from(MP.zmap.values());
  spawnQueue=new Array(Math.max(0,(s.rem||0)-zombies.length));
  bullets=s.B.map(b=>({x:b[0],y:GROUND+b[1],vx:b[2],vy:b[3],col:b[4],size:b[5],fire:!!b[6],life:b[7],l0:b[8],hit:new Set(),pierce:1,aoe:0}));
  crates=s.C.map(c=>Object.assign({vy:0,w:0},c,{y:GROUND+c.y,landed:!!c.landed}));
  bonuses=s.K.map(b=>({type:b[0],x:b[1],y:GROUND+b[2],life:b[3],gold:!!b[4],vy:0}));
  ents=s.E.map(e=>{const o=Object.assign({},e);if(o.y!==undefined) o.y=GROUND+o.y;return o});
  sleighs=s.S.map(x=>Object.assign({},x,{y:GROUND+x.y,drops:0,dropT:99}));
  acid=s.A.map(a=>({x:a[0],y:GROUND+a[1],c:a[2]||undefined,bc:a[3]||undefined,g:a[4]||undefined}));
  turret=s.T||null;strikes=s.X.map(x=>({x:x[0],t:x[1],w:true}));
  cine=s.cn?{t:s.cn}:null;
  for(const e of s.ev||[]) mpEvent(e);
  for(const n of s.sf||[]) {try{_sfx(n)}catch(e){}}
}
function mpEvent(e){
  switch(e[0]){
    case 'b':_burst(e[1],GROUND+e[2],e[3],e[4]);break;
    case 's':smokePuff(e[1],GROUND+e[2],e[3]);break;
    case 'x':fx.push({x:e[1],y:GROUND+e[2],r:e[3],life:18});if(SET.shake) shake=Math.max(shake,10);break;
    case 'k':spawnGibs({x:e[1],y:GROUND+e[2],size:e[3],hh:e[4]||undefined,skin:e[5]||undefined,boss:e[6]?{}:undefined});break;
    case 'g':try{_playGun(WEAPONS[e[1]])}catch(_){}break;
    case 'f':flash(e[1]);break;
  }
}
// --- côté invité : boucle locale (prédiction du déplacement, effets visuels, envoi des commandes) ---
function guestUpdate(dt){
  if(state!=='play'&&state!=='pause') return;
  const p=player,fro=state==='pause'||p.dead;
  const mv=fro?0:(kd('right')?1:0)-(kd('left')?1:0);
  if(!p.dead){p.x+=mv*4;p.x=Math.max(80,Math.min(WORLD_W-80,p.x));if(mv) p.step+=.25*Math.abs(mv)}
  if(!fro&&kd('jump')&&p.y>=GROUND) p.vy=-13;
  p.vy=(p.vy||0)+GRAV;p.y+=p.vy;if(p.y>GROUND){p.y=GROUND;p.vy=0}
  if(aimDir()){if(mv) p.dir=mv>0?1:-1;p.face=p.dir||1}else p.face=mouse.x+camX>=p.x?1:-1;
  const py=p.y-48;p.aim=aimDir()?(p.face>0?0:Math.PI):Math.atan2(mouse.y-py,mouse.x+camX-p.x);
  const firing=!fro&&(mouse.down||kd('fire'));
  MP.inp={l:mv<0?1:0,r:mv>0?1:0,j:(!fro&&kd('jump'))?1:0,f:firing?1:0,a:Math.round(p.aim*100),fc:p.face};
  if(performance.now()-MP.inT>33){MP.inT=performance.now();mpSend({t:'in',l:MP.inp.l,r:MP.inp.r,j:MP.inp.j,f:MP.inp.f,a:MP.inp.a,fc:MP.inp.fc})}
  updateCam(false);
  // lissage des entités reçues
  for(const z of zombies){if(z.tx!==undefined){z.x+=(z.tx-z.x)*.35;z.y+=(z.ty-z.y)*.35}}
  for(const o of MP.others.values()){if(o.tx!==undefined){o.x+=(o.tx-o.x)*.35;o.y+=(o.ty-o.y)*.35}}
  for(const b of bullets){b.x+=b.vx;b.y+=b.vy}
  for(const q of particles){
    q.x+=q.vx;q.y+=q.vy;q.vy+=q.g===undefined?.3:q.g;q.life--;
    if(q.shell&&q.y>GROUND+4&&q.vy>0){q.y=GROUND+4;q.vy*=-.35;q.vx*=.6;q.rot+=.6;if(Math.abs(q.vy)<.9){q.vy=0;q.g=0;q.vx=0}}
    else if(q.blood&&q.y>GROUND+4){if(SET.gore&&decals.length<230) decals.push({x:q.x,y:GROUND+6+Math.random()*26,r:1.5+Math.random()*3.2,life:1100});q.life=0}
    if(q.shell) q.rot+=q.vx*.1;
    if(q.gib){q.rot+=q.vr;if(q.y>GROUND+4&&q.vy>0){q.y=GROUND+4;q.vy*=-.32;q.vx*=.65;q.vr*=.5;if(!q.hit){q.hit=1;if(decals.length<230) decals.push({x:q.x,y:GROUND+8+Math.random()*16,r:3+Math.random()*3,life:1300})}if(Math.abs(q.vy)<.8){q.vy=0;q.g=0;q.vx=0;q.vr=0}}}
  }
  for(const d of decals) d.life--;pack(decals,d=>d.life>0);
  pack(particles,q=>q.life>0);if(particles.length>FXF.pmax) particles.splice(0,particles.length-FXF.pmax);
  for(const f of fx) f.life--;pack(fx,f=>f.life>0);
  if(msgT>0) msgT--;if(charPulse>0) charPulse--;
  if(shake>.5) shake*=.88;
  if(performance.now()-MP.lastSnapAt>9000){mpLeaveToMenu('Connexion à l\'hôte perdue')}
}
// --- tâches périodiques ---
function mpTick(t){
  rpTick(t);
  if(MP.role==='host'){
    if(!MP.rp&&t-MP.pingT>1000){MP.pingT=t;for(const g of MP.guests){if(g.ok&&g.conn.open){try{g.conn.send({t:'p',n:t})}catch(e){}}}}
    if(!MP.rp&&!MP.started&&t-MP.lobT>600){MP.lobT=t;mpLobbySend()}
    if(!MP.rp&&MP.started&&t-MP.snapT>48){MP.snapT=t;mpHostSend()}
    if(!MP.rp) for(const g of MP.guests.slice()) if(t-g.last>12000) mpGuestLeft(g);
  } else if(MP.role==='guest'&&MP.hostConn&&MP.started&&t-MP.lastSnapAt>9000){/* géré dans guestUpdate */}
}
// --- relais d'événements visuels / sonores de l'hôte vers les invités ---
const _burst=burst,_smoke=smokePuff,_sfx=sfx,_playGun=playGun,_explode=explode,_gibs=spawnGibs;
const FWD=new Set(['zdie','bhit','boom','groan','crate','bonus','wave','hurt','whistle','plane','screech','turret','hitmelee','bells','evilbells']);
burst=function(x,y,col,n){if(mpHost()&&MP.evq.length<70) MP.evq.push(['b',x|0,E_(y),col,n===undefined?8:n]);return _burst.apply(this,arguments)};
smokePuff=function(x,y,n){if(mpHost()&&MP.evq.length<70) MP.evq.push(['s',x|0,E_(y),n]);return _smoke.apply(this,arguments)};
sfx=function(n){if(mpHost()&&FWD.has(n)) MP.sfxQ.add(n);return _sfx.apply(this,arguments)};
playGun=function(hw){if(mpHost()&&MP.evq.length<70) MP.evq.push(['g',WEAPONS.indexOf(hw)]);return _playGun.apply(this,arguments)};
explode=function(x,y,r,dmg){if(mpHost()&&MP.evq.length<70) MP.evq.push(['x',x|0,E_(y),r|0]);return _explode.apply(this,arguments)};
spawnGibs=function(z){if(mpHost()&&MP.evq.length<70) MP.evq.push(['k',z.x|0,E_(z.y),z.size,z.hh||0,z.skin||z.color||'',z.boss?1:0]);return _gibs.apply(this,arguments)};
// --- dessin : autres joueurs ---
function mpDrawOthers(){
  const list=[];
  if(mpHost()){for(const g of MP.guests) if(g.p) list.push({p:g.p,n:g.name,look:g.look,dead:g.p.dead,id:g.id})}
  else if(mpGuest()){for(const o of MP.others.values()){const inf=MP.pinfo[o.id]||{n:'JOUEUR',look:sanitizeLook(null)};list.push({p:o,n:inf.n,look:inf.look,dead:o.dead,id:o.id})}}
  for(const e of list){
    const p=e.p,sl=save.look,sp=prevO;
    save.look=e.look||sl;prevO=save.look.outfit;
    try{
      if(p.hurtCd>0&&Math.floor(p.hurtCd/60)%2) ctx.globalAlpha=.4;
      if(e.dead){ctx.globalAlpha=.45;ctx.save();ctx.translate(p.x,GROUND-12);ctx.rotate(-(p.face||1)*Math.PI/2);ctx.translate(-p.x,-(GROUND-12));const y0=p.y;p.y=GROUND;drawSoldier(p);p.y=y0;ctx.restore()}
      else drawSoldier(p);
    }finally{save.look=sl;prevO=sp;ctx.globalAlpha=1}
    ctx.textAlign='center';ctx.font='700 13px '+FONT;ctx.fillStyle='#000';ctx.fillText(e.n,p.x+1,p.y-96+1);ctx.fillStyle=e.dead?'#ff7a6a':'#e9e1d0';ctx.fillText(e.n,p.x,p.y-96);
    const bw=34,hr=Math.max(0,p.hp/(p.maxhp||100));ctx.fillStyle='#0008';ctx.fillRect(p.x-bw/2,p.y-92,bw,4);ctx.fillStyle=hr>.5?'#7dff6a':hr>.25?'#ffe14a':'#ff6a5a';ctx.fillRect(p.x-bw/2,p.y-92,bw*hr,4);
    ctx.textAlign='left';
  }
}
function mpDrawHud(){
  if(!MP.on) return;
  const rows=[];
  if(mpHost()){rows.push({n:MP.rp?'JOUEUR 1':cleanName(mpName())+' (HÔTE)',hp:player.hp,mx:player.maxhp,dead:player.dead});for(const g of MP.guests) if(g.p) rows.push({n:g.name,hp:g.p.hp,mx:g.p.maxhp,dead:g.p.dead,ping:g.ping})}
  else{const hn=(MP.pinfo[0]||{}).n||'HÔTE';rows.push({n:hn+' (HÔTE)',hp:(MP.others.get(0)||{}).hp||0,mx:(MP.others.get(0)||{}).maxhp||100,dead:(MP.others.get(0)||{}).dead});rows.push({n:cleanName(mpName())+' (TOI)',hp:player.hp,mx:player.maxhp,dead:player.dead});for(const o of MP.others.values()) if(o.id!==0){const inf=MP.pinfo[o.id]||{n:'JOUEUR'};rows.push({n:inf.n,hp:o.hp,mx:o.maxhp,dead:o.dead})}}
  const x=W-262,y0=82;
  rows.forEach((r,i)=>{
    const y=y0+i*26;panel(x,y,252,22,{norivets:true,grunge:.5});
    ctx.textAlign='left';ctx.fillStyle=r.dead?'#ff7a6a':'#e9e1d0';ctx.font='700 12px '+FONT;ctx.fillText(r.n+(r.dead?'  · À TERRE':''),x+8,y+15,150);
    const hr=Math.max(0,Math.min(1,r.hp/(r.mx||100)));ctx.fillStyle='#2a1a18';ctx.fillRect(x+160,y+7,84,8);ctx.fillStyle=hr>.5?'#7dff6a':hr>.25?'#ffe14a':'#ff6a5a';ctx.fillRect(x+160,y+7,84*hr,8);
  });
  if(player.dead){
    ctx.textAlign='center';ctx.font='400 40px '+TITLE;ctx.fillStyle='#000';ctx.fillText('À TERRE',W/2+2,H*.34+2);ctx.fillStyle='#ff6a5a';ctx.fillText('À TERRE',W/2,H*.34);
    ctx.font='700 16px '+FONT;ctx.fillStyle='#e9e1d0';ctx.fillText('Tes équipiers continuent : tu reviens à la prochaine manche',W/2,H*.34+28);ctx.textAlign='left';
  }
}
// --- pages de menu ---
function connBars(x,y,q){for(let i=0;i<4;i++){ctx.fillStyle=i<q?(q>=3?'#7dff6a':q===2?'#ffe14a':'#ff6a5a'):'#3a3028';ctx.fillRect(x+i*7,y+12-i*3-3,5,3+i*3)}}
function drawMpList(){
  const pl=(MP.role==='host'?mpLobbyList():MP.lobby.pl)||[],big=(MP.role==='host'?(gameMode==='3D'&&MP.sel.mode&&MP.sel.mode!=='coop'):(MP.lobby.m3&&MP.lobby.mode&&MP.lobby.mode!=='coop')),N=big?10:4,rh=big?24:54,top=big?126:130;
  panel(40,98,500,big?260:248,{});
  ctx.textAlign='left';ctx.fillStyle='#8a8178';ctx.font='500 12px '+FONT;ctx.fillText('JOUEUR',60,118);ctx.fillText('NIVEAU',250,118);ctx.fillText('PIN',320,118);ctx.fillText('CONNEXION',372,118);ctx.fillText('ÉTAT',468,118);
  for(let i=0;i<N;i++){
    const e=pl[i],y=top+i*rh,hh=rh-8;
    ctx.fillStyle=e?'#241d19':'#17120f';ctx.fillRect(52,y,476,hh);ctx.strokeStyle='#4a3a2e';ctx.lineWidth=1;ctx.strokeRect(52.5,y+.5,475,hh-1);
    if(!e){ctx.fillStyle='#4a3a2e';ctx.font='500 '+(big?12:15)+'px '+FONT;ctx.fillText('— emplacement libre —',66,y+hh*.62);continue}
    const ty=y+hh*.64;
    if(big) avDraw(e.av,56,y+2,18,false);else avDraw(e.av,58,y+5,36,false);
    ctx.fillStyle=e.id===0?'#ffd45a':'#f2efe8';ctx.font='700 '+(big?13:17)+'px '+FONT;ctx.fillText(e.n+(e.id===0?'  ★':'')+(e.id===MP.myId&&MP.role==='guest'?'  (TOI)':''),big?78:100,ty,big?166:146);
    ctx.fillStyle='#d8d2c8';ctx.font='700 '+(big?13:16)+'px '+FONT;ctx.fillText('NIV '+e.lvl,250,ty);
    ctx.fillText(e.id===0?'—':e.ping+' ms',320,ty);
    connBars(372,y+(big?4:14),e.q);ctx.fillStyle='#b9b1a6';ctx.font='500 11px '+FONT;ctx.fillText(QL[e.q]||'—',402,ty-(big?1:0),60);
    ctx.fillStyle=e.r?'#9fd18a':'#e0a526';ctx.font='700 '+(big?12:14)+'px '+FONT;ctx.fillText(e.r?'PRÊT':'EN ATTENTE',468,ty,58);
  }
}
function mapOptions(){return MAPS.filter(m=>mapUnlocked(m))}
function drawMpMenu(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('MULTIJOUEUR',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('MULTIJOUEUR',40,58);ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,230,3);
  ctx.fillStyle='#d8d2c8';ctx.font='500 16px '+FONT;ctx.fillText('Coopération de 2 à 4 joueurs : survivez ensemble. Chacun garde sa progression et ses gains.',40,98);
  const ok=ACG.ok()&&(gameMode==='2D'||gameMode==='3D');
  btn(menuRects,40,124,420,96,'HÔTE',{act:mpStartHost,size:28,sub:gameMode==='3D'?'salon 3D : coop ou Battle Royale (10 joueurs)':'créer une partie et obtenir un code',dim:!ok});
  btn(menuRects,500,124,420,96,'REJOINDRE',{act:()=>{joinCode='';state='mpjoin'},size:28,sub:'entrer le code d\'un ami',dim:!ok});
  btn(menuRects,500,236,420,44,'REMOTE PLAY  ›',{act:()=>{if(gameMode==='2D') state='rpsetup'},size:20,sub:'plusieurs joueurs sur le même écran, un téléphone chacun',dim:gameMode!=='2D'});
  btn(menuRects,40,236,420,44,'PSEUDO : '+cleanName(mpName()),{act:()=>renamePseudo(),size:18});
  ctx.fillStyle='#b9b1a6';ctx.font='500 14px '+FONT;
  ['Hôte : tu crées le salon, tu choisis la carte et la difficulté, puis tu lances quand tout le monde est prêt.','Invités : tu entres le code, tu te mets « prêt », et la partie démarre.','Caisses : le premier qui les prend les garde. Cadeaux de Noël : tout le monde reçoit le bonus.','Les zombies sont plus nombreux et plus résistants selon le nombre de joueurs.'].forEach((t,i)=>ctx.fillText(t,40,312+i*24,880));
  if(gameMode==='3D'){ctx.fillStyle='#9fd18a';ctx.font='700 15px '+FONT;ctx.fillText('MODE 3D actif : crée un salon (HÔTE) puis choisis COOP ou BATTLE ROYALE avec le bouton « MODE 3D ». Les invités rejoignent avec le code.',40,396,880)}
  else if(gameMode!=='2D'){ctx.fillStyle='#e0a526';ctx.font='700 15px '+FONT;ctx.fillText('Le multijoueur n\'est pas disponible en mode '+gameMode+' : repasse en mode 2D ou 3D (menu principal).',40,396,880)}
  ctx.fillStyle=ok?'#9fd18a':'#e2542e';ctx.font='700 14px '+FONT;
  ctx.fillText(ok?'● '+ACG.NAME+' v'+ACG.VER+' : actif, ta sauvegarde est conforme':'● '+ACG.NAME+' : '+ACG.why(),40,420,880);
  if(MP.msg&&MP.status==='err'){ctx.fillStyle='#e2542e';ctx.font='700 16px '+FONT;ctx.fillText(MP.msg,40,446,880)}
  btn(menuRects,40,470,200,44,'RETOUR',{act:()=>state='playhub'});
}
function drawMpHost(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('SALON · HÔTE',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('SALON · HÔTE',40,58);ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,230,3);
  panel(560,98,360,110,{});ctx.textAlign='center';ctx.fillStyle='#8a8178';ctx.font='500 13px '+FONT;ctx.fillText('CODE DE LA PARTIE',740,122);
  ctx.fillStyle='#ffd45a';ctx.font='400 62px '+TITLE;ctx.fillText(MP.status==='wait'||MP.status==='ok'?MP.code:'· · · · ·',740,184);
  ctx.fillStyle=MP.status==='err'?'#e2542e':'#b9b1a6';ctx.font='500 13px '+FONT;ctx.fillText(MP.status==='err'?MP.msg:'Donne ce code à tes amis (Multijoueur → Rejoindre)',740,202,340);ctx.textAlign='left';
  drawMpList();
  const maps=mapOptions(),m=MAPS.find(x=>x.id===MP.sel.map)||MAPS[0],d=DIFFS.find(x=>x.id===MP.sel.diff)||DIFFS[1];
  btn(menuRects,560,222,360,40,'CARTE : '+m.name+'  ›',{act:()=>{const k=maps.findIndex(x=>x.id===m.id);MP.sel.map=maps[(k+1)%maps.length].id;const mm=MAPS.find(x=>x.id===MP.sel.map);if(!diffUnlocked(mm,DIFFS.find(x=>x.id===MP.sel.diff))) MP.sel.diff='normal';mpLobbySend()},size:16});
  btn(menuRects,560,268,360,40,'DIFFICULTÉ : '+d.n+'  ›',{act:()=>{const ds=DIFFS.filter(x=>diffUnlocked(m,x)),k=ds.findIndex(x=>x.id===d.id);MP.sel.diff=ds[(k+1)%ds.length].id;mpLobbySend()},size:16});
  const all=MP.guests.filter(g=>g.ok),rdy=all.every(g=>g.ready);
  ctx.fillStyle='#b9b1a6';ctx.font='500 13px '+FONT;ctx.fillText('Gains ×'+(m.gain*d.g).toFixed(2)+'  ·  zombies : vie ×'+d.hp+', dégâts ×'+d.dmg+'  ·  + joueurs = + zombies',560,328,360);
  btn(menuRects,560,342,360,56,all.length?(rdy?'LANCER LA PARTIE':'EN ATTENTE DES JOUEURS…'):'LANCER (SEUL)',{act:mpStartGame,size:22,dim:!rdy});
  if(gameMode==='3D'){const md=MP.sel.mode||'coop',lab=md==='coop'?'COOP · VAGUES DE ZOMBIES':md==='br'?'BATTLE ROYALE · CHACUN POUR SOI':'BATTLE ROYALE · ÉQUIPES';
    btn(menuRects,560,404,360,40,'MODE 3D : '+lab,{act:()=>{MP.sel.mode=md==='coop'?'br':md==='br'?'brt':'coop';mpLobbySend()},size:15});
    ctx.fillStyle='#b9b1a6';ctx.font='500 12px '+FONT;ctx.fillText(md==='coop'?'Jusqu\'à 4 joueurs · vagues de zombies':'Jusqu\'à 10 joueurs · zone qui rétrécit · dernier debout gagne',560,494,360)}
  if(gameMode==='2D'||(MP.sel.mode||'coop')==='coop') btn(menuRects,560,gameMode==='3D'?446:404,360,34,'NIGHTMARE : '+(MP.sel.nm?'OUI · zombies ultra forts · gains ×9':'NON'),{act:()=>{MP.sel.nm=!MP.sel.nm;mpLobbySend()},size:14});
  if(MP.msg&&MP.status!=='err'){ctx.fillStyle='#e2542e';ctx.font='700 14px '+FONT;ctx.fillText(MP.msg,560,gameMode==='3D'?506:462,360)}
  ctx.fillStyle='#8a8178';ctx.font='500 13px '+FONT;ctx.fillText('Les invités se mettent « prêt » ; tu lances quand tout le monde l\'est.',40,372,500);
  btn(menuRects,40,470,260,44,'FERMER LE SALON',{act:()=>{mpStop();state='mpmenu'},size:18});
  btn(menuRects,320,470,220,44,'PSEUDO',{act:()=>renamePseudo(mpLobbySend),size:18});
}
function drawMpLobby(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('SALON · INVITÉ',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('SALON · INVITÉ',40,58);ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,230,3);
  drawMpList();
  const m=MAPS.find(x=>x.id===MP.lobby.map)||MAPS[0],d=DIFFS.find(x=>x.id===MP.lobby.diff)||DIFFS[1];
  panel(560,98,360,110,{});ctx.textAlign='center';ctx.fillStyle='#8a8178';ctx.font='500 13px '+FONT;ctx.fillText('PARTIE DE L\'HÔTE',740,122);
  ctx.fillStyle='#f2efe8';ctx.font='700 26px '+FONT;ctx.fillText(MP.lobby.m3&&MP.lobby.mode&&MP.lobby.mode!=='coop'?'BATTLE ROYALE 3D':(MP.lobby.m3?'COOP 3D · ':'')+m.name,740,158,330);ctx.fillStyle='#ffd45a';ctx.font='700 20px '+FONT;ctx.fillText(MP.lobby.m3&&MP.lobby.mode==='br'?'CHACUN POUR SOI':MP.lobby.m3&&MP.lobby.mode==='brt'?'PAR ÉQUIPES':'DIFFICULTÉ : '+d.n,740,188);ctx.textAlign='left';
  const me=(MP.lobby.pl||[]).find(e=>e.id===MP.myId);
  btn(menuRects,560,222,360,70,(me&&me.r)?'✔ PRÊT  (annuler)':'JE SUIS PRÊT',{act:()=>{MP.ready=!(me&&me.r);mpSend({t:'rdy',r:MP.ready?1:0});if(me) me.r=MP.ready?1:0},size:26});
  ctx.fillStyle='#b9b1a6';ctx.font='500 14px '+FONT;
  ['La partie démarre quand l\'hôte la lance.','Tes gains (argent et XP) sont ajoutés à TA sauvegarde.','Ta connexion : '+(MP.ping?MP.ping+' ms':'…')].forEach((t,i)=>ctx.fillText(t,560,326+i*22,360));
  btn(menuRects,40,470,260,44,'QUITTER LE SALON',{act:()=>{mpStop();state='mpmenu'},size:18});
}
function drawMpJoining(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='center';barbed(0,W,12,.8);
  ctx.fillStyle='#e9e1d0';ctx.font='400 44px '+TITLE;ctx.fillText('CONNEXION…',480,200);
  ctx.fillStyle=MP.status==='err'?'#e2542e':'#ffd45a';ctx.font='700 20px '+FONT;ctx.fillText(MP.msg||'…',480,260,820);ctx.textAlign='left';
  btn(menuRects,380,320,200,44,'ANNULER',{act:()=>{mpStop();state='mpmenu'},size:18});
}

let acMsg='';
function acRestore(){
  try{const b=JSON.parse(localStorage.getItem(SAVE_KEY+'_bak')||'null');
    if(b&&b.ac&&b.ac.s&&!b.ac.f&&b.ac.s===ACG.sign(ACG.canon(b))&&!ACG.plaus(b).length){noPersist=true;acMsg='Sauvegarde restaurée…';VAULT.sealThen(b,()=>{localStorage.setItem(SAVE_KEY,JSON.stringify(b));setTimeout(()=>location.reload(),300)});return}}catch(e){}
  acMsg='Aucune sauvegarde valide à restaurer';
}
function drawAcPage(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('C02 ANTI-CHEAT',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('C02 ANTI-CHEAT',40,58);ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,250,3);
  ctx.fillStyle='#9fd18a';ctx.font='700 18px '+FONT;ctx.fillText('VERSION '+ACG.VER,520,56);
  const st=ACG.st,rows=[['Signature de la sauvegarde',st.sig==='bad'?'bad':'ok',st.sig==='new'?'première signature faite':st.sig==='ok'?'conforme':'MODIFIÉE'],['Valeurs plausibles',st.plaus,st.plaus==='ok'?'aucune valeur impossible':'valeurs impossibles'],['Horloge de l\'appareil',st.clock,st.clock==='ok'?'cohérente':'modifiée (tirage gratuit bloqué)'],['Surveillance en partie',st.rt,st.rt==='ok'?'aucune anomalie':'anomalie : '+st.runReason],['Intégrité du code du jeu',st.code,st.code==='ok'?'inchangé':'MODIFIÉ'],['Données des armes et zombies',st.data,st.data==='ok'?'inchangées':'MODIFIÉES'],['Coffre chiffré (appareil)',st.vault==='bad'?'bad':'ok',st.vault==='ok'?'sauvegarde protégée':st.vault==='restored'?'modification annulée':st.vault==='off'?'indisponible sur ce navigateur':'à vérifier'],['Multijoueur',ACG.ok()?'ok':'bad',ACG.ok()?'autorisé':ACG.why()]];
  panel(40,86,520,290,{});
  rows.forEach(([a,b,c],i)=>{const y=110+i*30;ctx.fillStyle=b==='ok'?'#9fd18a':'#e2542e';ctx.font='700 20px '+FONT;ctx.fillText(b==='ok'?'✔':'✖',58,y);ctx.fillStyle='#f2efe8';ctx.font='700 16px '+FONT;ctx.fillText(a,86,y,230);ctx.fillStyle=b==='ok'?'#b9b1a6':'#ff9a8a';ctx.font='500 14px '+FONT;ctx.fillText(c,330,y,225)});
  panel(580,86,340,290,{});ctx.fillStyle='#ffd45a';ctx.font='700 14px '+FONT;ctx.fillText('JOURNAL',596,108);
  const lg=st.log.slice(-7).reverse();ctx.fillStyle='#b9b1a6';ctx.font='500 12px '+FONT;
  if(!lg.length){ctx.fillStyle='#6b625b';ctx.fillText('Aucun événement.',596,134)}else lg.forEach((e,i)=>{const d=new Date(e.t);ctx.fillText(d.toTimeString().slice(0,5)+'  '+e.m,596,132+i*25,310)});
  ctx.fillStyle='#b9b1a6';ctx.font='500 13px '+FONT;
  ['Ce qui est protégé : la progression (signature), les gains de partie (surveillance), le tirage du jour (horloge), les données des armes et zombies, la vitesse et la cadence de tir en 3D,','le multijoueur (profil signé, commandes validées par l\'hôte, gains signés par l\'hôte et plafonnés).','Limite : une protection côté navigateur dissuade et détecte, mais seul un serveur pourrait rendre la triche impossible.'].forEach((t,i)=>ctx.fillText(t,40,396+i*17,880));
  if(st.tampered) btn(menuRects,260,478,420,40,'RESTAURER LA DERNIÈRE SAUVEGARDE VALIDE',{act:acRestore,size:16});
  if(acMsg){ctx.fillStyle='#ffd45a';ctx.font='700 15px '+FONT;ctx.fillText(acMsg,700,502,240)}
  btn(menuRects,40,470,200,44,'RETOUR',{act:()=>{state='options';optTab=4}});
}

