// ===== V0.69 : BATTLE ROYALE — saut d'avion / dirigeable, parachute, zone mobile, spectateur, visée, accroupi =====
const BR_WAIT=[90000,60000,50000,40000,30000],BR_SHR=[170000,95000,75000,60000,45000],BR_DPS=[2,4,7,10,15],BR_RF=[.66,.42,.24,.11,.03],BR_K=.28;
function fwPath(){
  const sd=FW.worldSeed|0,a=((sd>>>3)%628)/100,type=(sd&1)?'blimp':'plane',R=FW_LIM*1.12;
  return{dx:Math.cos(a),dz:Math.sin(a),sx:-Math.cos(a)*R,sz:-Math.sin(a)*R,len:2*R,v:type==='plane'?5.4:3.4,alt:(FW.maxH||2800)*1.35,type};
}
function fwPlanePos(t){
  const P=FW.path||fwPath(),d=Math.min(P.len,P.v*t/16.7);
  return{x:P.sx+P.dx*d,z:P.sz+P.dz*d,y:P.alt,vx:P.dx*P.v,vz:P.dz*P.v,done:d>=P.len-1,left:Math.max(0,(P.len-d)/P.v*16.7/1000)};
}
function fwAirKey(){
  if(FW.air===1){FW.air=2;FW.vy=0;FW.vxA=FW.vxA||0;FW.vzA=FW.vzA||0;flash('CHUTE LIBRE · ESPACE : OUVRIR LE PARACHUTE')}
  else if(FW.air===2){FW.air=3;sfx('bonus');flash('PARACHUTE OUVERT')}
}
function fwAirUpdate(dt,mvx,mvz){
  const k=dt/16.7,fx_=-Math.sin(FW.yaw),fz_=-Math.cos(FW.yaw),rx=Math.cos(FW.yaw),rz=-Math.sin(FW.yaw);
  if(FW.air===1){const p=fwPlanePos(FW.tDrop);FW.x=p.x;FW.z=p.z;FW.y=p.y;FW.vxA=p.vx;FW.vzA=p.vz;if(p.done) fwAirKey();return}
  const sp=FW.air===2?5.4:4.6,L=Math.hypot(mvx,mvz)||1,m=Math.min(1,L),ix=(fx_*mvz+rx*mvx)/L*m,iz=(fz_*mvz+rz*mvx)/L*m;
  FW.vxA+=(ix*sp-FW.vxA)*.045*k;FW.vzA+=(iz*sp-FW.vzA)*.045*k;
  {const o={px:Math.max(-FW_LIM,Math.min(FW_LIM,FW.x+FW.vxA*k)),pz:Math.max(-FW_LIM,Math.min(FW_LIM,FW.z+FW.vzA*k))};fwPush(o,FW_R,FW.y,80);FW.x=o.px;FW.z=o.pz}
  if(FW.air===2){FW.vy=Math.max(-15,FW.vy-.5*k);if(FW.y<240) fwAirKey()}
  else FW.vy+=((-3.3)-FW.vy)*.07*k;
  const y0=FW.y;FW.y+=FW.vy*k;
  const sup=fwSupportY(FW.x,FW.z,Math.max(y0,FW.y));
  if(FW.y<=sup){FW.y=sup;FW.vy=0;FW.air=0;FW.gnd=true;FW.yv=FW.y;FW.shk=8;sfx('boom');flash('ATTERRISSAGE')}
}
function fwScoped(wp){return !!wp&&!wp.melee&&(wp.kind==='dmr'||wp.kind==='barrett'||wp.cat==='PRÉCISION')}
const FW_ZOOMS=[2,3,4,6,8];
function fwSkinCol(i){const w=WEAPONS[i];if(!w) return null;const u=save.up[w.name];if(!u||!u.skin||u.skin==='orig') return null;const sk=SKINS.find(k=>k.id===u.skin);return sk&&sk.c||null}   // BR : seule la couleur choisie est visible, jamais les améliorations
function fwPlaneMesh(type){
  const T=THREE,g=new T.Group(),bx=(c,sx,sy,sz,x,y,z)=>{const m=g3Mesh('box',c,sx,sy,sz,x,y,z);g.add(m)};
  if(type==='plane'){bx('#8a909a',170,26,26,0,0,0);bx('#8a909a',34,4,230,10,2,0);bx('#7a808a',24,3,80,-72,10,0);bx('#7a808a',20,40,3,-76,22,0);bx('#2a3440',26,14,22,70,8,0);for(const s of[-1,1]) bx('#444',18,12,12,16,-6,s*74)}
  else{const m=g3Mesh('sph','#c8c0a8',180,62,62,0,0,0);g.add(m);bx('#444',60,16,26,0,-66,0);for(const s of[-1,1]){bx('#a02a20',40,3,70,-150,s*40,0);bx('#a02a20',40,70,3,-150,0,0)}bx('#a02a20',3,3,3,0,0,0)}
  g.traverse(o=>{o.castShadow=false});return g;
}
function fwCanopy(){
  const T=THREE,g=new T.Group(),m=new T.Mesh(new T.SphereGeometry(1,16,8,0,6.283,0,1.4),new T.MeshLambertMaterial({color:0xe0452a,side:T.DoubleSide}));m.scale.set(60,34,60);m.position.y=118;g.add(m);
  const lm=new T.LineBasicMaterial({color:0xdddddd});for(let k=0;k<6;k++){const a=k*1.047,gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute([Math.cos(a)*52,118,Math.sin(a)*52,0,60,0],3));g.add(new T.Line(gg,lm))}
  return g;
}
// ----- spectateur -----
function fwmSpec(){
  if(!FW.down||FW.mode==='coop'||!FW.net) return null;
  const alive=FW.peers.filter(q=>!q.dead&&q.mesh);if(!alive.length) return null;
  let t=alive.find(q=>q.id===FW.spec);if(!t){t=alive[0];FW.spec=t.id}return t;
}
function fwmSpecNext(){
  const alive=FW.peers.filter(q=>!q.dead);if(alive.length<2) return;
  const i=alive.findIndex(q=>q.id===FW.spec);FW.spec=alive[(i+1)%alive.length].id;sfx('click');
}
function fwmBrFinish(){
  const d=FW.pend;if(!d) return;FW.pend=null;
  MP.started=false;BRF.on=true;money=d.m;runXp=d.x;kills=d.k;wave=d.place;FW.place=d.place;
  const done=(save.ac&&save.ac.g)||[];save.ac=save.ac||{};save.ac.g=done.concat([d.gid]).slice(-40);
  fwStop();finishRun();
}
// ----- zone mobile : le centre se déplace et le cercle rétrécit en douceur -----
function fwmZoneNext(Z){
  const R0=FW_LIM*.9,rn=R0*BR_RF[Math.min(Z.phase,BR_RF.length-1)],rmax=Math.min(Math.max(0,Z.r-rn)*.88,FW_LIM*.38),a=Math.random()*6.283,d=Math.sqrt(Math.random())*rmax;
  Z.cx0=Z.cx;Z.cz0=Z.cz;Z.r0=Z.r;Z.cx1=Z.cx+Math.cos(a)*d;Z.cz1=Z.cz+Math.sin(a)*d;Z.r1=rn;
}
function fwmZoneSecs(Z){return Math.max(0,((Z.st==='wait'?BR_WAIT:BR_SHR)[Math.min(Z.phase,BR_WAIT.length-1)]-Z.t)/1000)}
function fwmBrLoot(){
  const n=MP.guests.length+1,pool=WEAPONS.map((w,i)=>i).filter(i=>!WEAPONS[i].melee),big=FW_N>8;
  const nw=big?Math.round((70+12*n)*1.75):24+6*n,ns=big?60:14,sp=FW_LIM*1.8;
  for(let i=0;i<nw;i++){const p=fwmFreeNear((Math.random()-.5)*sp,(Math.random()-.5)*sp);
    const w=pool[Math.floor(Math.random()*pool.length)];fwmAddCrate(p[0],p[1],{w,ammo:30+Math.floor(Math.random()*90),time:0})}
  for(let i=0;i<ns;i++){const p=fwmFreeNear((Math.random()-.5)*sp,(Math.random()-.5)*sp);fwmAddCrate(p[0],p[1],{sup:Math.random()<.5?'heal':'shield'})}
}
function fwmAddCrate(x,z,data){const q=fwAddPk('crate',x,z,data,data.sup?(data.sup==='heal'?0xe0463a:0x3f8fe0):0xffd45a,1e9);const pk=FW.pk[FW.pk.length-1];pk.id=++FW.pkid;return pk}
// ---------- côté hôte : messages des invités ----------
function fwmHostMsg(g,d){
  if(!MP.started||!g.f3||!g.p||!FW.on) return;
  const f=g.f3,now=performance.now();
  switch(d.t){
    case 'p3':{
      const x=num(d.x,-FW_LIM,FW_LIM,f.x),z=num(d.z,-FW_LIM,FW_LIM,f.z),dt=Math.min(500,now-f.t);f.t=now;
      const max=.45*dt+90,dist=Math.hypot(x-f.x,z-f.z);                       // vitesse plausible (marche + sprint + latence)
      if(dist>max){f.viol++;if(f.viol===5) ACG.note('Invité '+g.name+' : déplacements impossibles');f.x+=(x-f.x)/dist*max;f.z+=(z-f.z)/dist*max}
      else{f.x=x;f.z=z;if(f.viol>0&&Math.random()<.02) f.viol--}
      f.y=num(d.y,0,5200,0);f.air=num(d.a,0,3,0)|0;f.c=d.c?1:0;if(!f.air){const oo={px:f.x,pz:f.z};fwPush(oo,FW_R,f.y,68);f.x=oo.px;f.z=oo.pz}      // jamais dans un mur côté hôte
      f.yaw=num(d.ya,-100,100,0);f.pitch=num(d.pi,-2,2,0);if(!g.p.dead&&Number.isInteger(d.w)&&WEAPONS[d.w]){const wp=WEAPONS[d.w];if(wp.melee?d.w===g.p.melee:(g.p.gun&&g.p.gun.w===d.w)) g.p.w=d.w}
      break}
    case 'sh3':if(!g.p.dead) fwmShootFor(g,d);break;
    case 'ml3':if(!g.p.dead) fwmSlashFor(g,d);break;
    case 'pk3':if(!g.p.dead){const pk=FW.pk.find(q=>q.id===d.id&&q.kind==='crate');if(pk&&Math.hypot(pk.px-f.x,pk.pz-f.z)<140){runAs(g,()=>pickCrate(Object.assign({x:0,y:0},pk.d)));FW.scene.remove(pk.m);FW.pk.splice(FW.pk.indexOf(pk),1)}}break;
    case 'bn3':if(!g.p.dead&&FW.mode==='coop') runAs(g,()=>{if(stock.length) fwApply(stock.shift(),false,{x:f.x,z:f.z,yaw:f.yaw})});break;
  }
}
function fwmShootFor(g,d){
  const p=g.p,f=g.f3;if(p.cd>0||!Array.isArray(d.o)||!Array.isArray(d.d)) return;
  const T=THREE,o=new T.Vector3(num(d.o[0],-4000,4000,f.x),num(d.o[1],20,200,72),num(d.o[2],-4000,4000,f.z)),base=new T.Vector3(num(d.d[0],-1,1,0),num(d.d[1],-1,1,0),num(d.d[2],-1,1,-1));
  if(base.lengthSq()<.4) return;base.normalize();if(Math.hypot(o.x-f.x,o.z-f.z)>70){o.x=f.x;o.z=f.z}
  runAs(g,()=>{
    const wp=WEAPONS[p.w],gn=p.gun;if(!wp||wp.melee||!gn||gn.w!==p.w) return;
    let hw=wp;if(wp.hands){const side=p.hand=1-(p.hand||0);hw=WEAPONS[wp.hi[side]]}
    fwFire(o,base,hw,hw.dmg*p.dmgMul*wBoost(p.w)*dmgM(),{id:g.id,g,team:f.team,ads:!!d.a});
    useAmmo();p.cd=(wp.hands?hw.rate*.6:wp.rate)/rapM()*.85;
  });
}
function fwmSlashFor(g,d){
  const p=g.p,f=g.f3;if(p.cd>0||!Array.isArray(d.d)) return;
  runAs(g,()=>{
    const wp=WEAPONS[p.w];if(!wp||!wp.melee) return;p.cd=wp.rate/rapM()*.85;
    const dx=num(d.d[0],-1,1,0),dz=num(d.d[1],-1,1,-1),L=Math.hypot(dx,dz)||1,v={x:dx/L,z:dz/L};
    fwMeleeHit(f.x,f.z,v,wp.dmg*p.dmgMul*wBoost(p.w)*dmgM(),wp.reach*1.25+52,{id:g.id,g,team:f.team});
  });
}
function fwmGuestGone(g){
  if(FW.net!=='host'||!g.f3) return;
  if(FW.mode!=='coop'&&g.p&&!g.p.dead){const q=fwmPlayers().find(x=>x.g===g);if(q) fwmEliminate(q,null)}
  else if(FW.mode==='coop') fwmCoopCheck();
}
// ---------- BR : zone, éliminations, fin de partie ----------
function fwmDmgRaw(q,dmg,killer){
  if(q.dead) return;const p=q.p;p.hp-=dmg;p.hurt=1;if(q.id===0){FW.hurtFl=1;FW.shk=Math.max(FW.shk,4)}
  if(p.hp<=0){p.hp=0;fwmEliminate(q,killer)}
}
function fwmHurtP(q,dmg,head,who){
  if(q.dead||(FW.mode==='brt'&&q.team===who.team)) return;
  fwmDmgRaw(q,dmg*(head?1.7:1)*BR_K,who);                                       // plusieurs coups pour tuer : la barre de vie compte
}
function fwmEliminate(q,killer){
  if(q.dead||q.p.dead) return;q.p.dead=true;q.p.hp=0;if(q.id===0) FW.down=true;
  const all=fwmPlayers();
  if(killer&&killer.id!==q.id){const kq=all.find(x=>x.id===killer.id);if(kq){if(kq.id===0) FW.stat.k++;else if(kq.g) kq.g.f3.k=(kq.g.f3.k|0)+1}}
  fwmEv(['kf',killer&&killer.id!==undefined&&killer.id!==q.id?(all.find(x=>x.id===killer.id)||{name:'?'}).name:'LA ZONE',q.name]);
  FW.feed.push({t:300,a:killer&&killer.id!==q.id?(all.find(x=>x.id===killer.id)||{name:'?'}).name:'LA ZONE',b:q.name});
  const alive=all.filter(x=>!x.dead&&x.id!==q.id&&!x.p.dead),aliveTeams=new Set(alive.map(x=>x.team));
  const teamAlive=alive.some(x=>x.team===q.team);
  if(!teamAlive){const pl=aliveTeams.size+1;for(const x of all) if(x.team===q.team&&!x.place) fwmGivePlace(x,pl)}
  if(aliveTeams.size<=1&&alive.length>=0){for(const x of all) if(!x.dead&&!x.p.dead&&!x.place) fwmGivePlace(x,1);fwmBrEnd()}
}
function fwmGivePlace(x,pl){
  x.place=pl;const n=fwmPlayers().length,k=x.id===0?FW.stat.k:(x.g?x.g.f3.k|0:0);
  if(x.id===0){FW.place=pl;return}
  x.g.f3.place=pl;
  const m=Math.round(25*(n-pl+1)+15*k+(pl===1?100:0)),xp=Math.round(m*1.2);
  try{x.g.conn.send({t:'brend',gid:MP.gid,id:x.g.id,place:pl,n,k,m,x:xp,sig:ACG.rcpt(MP.gid,x.g.id,pl,k,m,xp)})}catch(e){}
}
function fwmBrEnd(){
  if(FW.over) return;FW.over=true;MP.started=false;
  const n=fwmPlayers().length,k=FW.stat.k,pl=FW.place||1,m=Math.round(25*(n-pl+1)+15*k+(pl===1?100:0)),xp=Math.round(m*1.2);
  if(!FW.place) FW.place=pl;
  for(const g of MP.guests){try{g.conn.send({t:'fin3'})}catch(e){}}
  setTimeout(()=>{if(FW.on&&FW.net==='host'){fwStop();BRF.on=true;money=m;runXp=xp;kills=k;wave=pl;finishRun()}},1800);
}
function fwmBrTick(dt){
  const Z=FW.zone;if(!Z||FW.over) return;Z.t+=dt;
  const ph=Math.min(Z.phase,BR_WAIT.length-1);
  if(Z.st==='wait'&&Z.t>=BR_WAIT[ph]){Z.st='shrink';Z.t=0;flashG('LA ZONE SE DÉPLACE !')}
  else if(Z.st==='shrink'){
    const u=Math.min(1,Z.t/BR_SHR[ph]),e=u*u*(3-2*u);
    Z.cx=Z.cx0+(Z.cx1-Z.cx0)*e;Z.cz=Z.cz0+(Z.cz1-Z.cz0)*e;Z.r=Z.r0+(Z.r1-Z.r0)*e;
    if(u>=1){Z.phase=Math.min(BR_RF.length-1,Z.phase+1);Z.st='wait';Z.t=0;fwmZoneNext(Z);if(Z.phase<BR_RF.length-1||Z.r>Z.r1+1) flashG('NOUVELLE ZONE MARQUÉE SUR LA CARTE')}
  }
  for(const q of fwmPlayers()){if(q.dead||q.p.dead||q.air) continue;if(Math.hypot(q.x-Z.cx,q.z-Z.cz)>Z.r) fwmDmgRaw(q,BR_DPS[ph]*dt/1000,null)}
}
// ---------- hôte : mise à jour réseau ----------
function fwmHostTick(dt){
  for(const g of MP.guests){
    if(!g.p||!g.f3) continue;
    runAs(g,()=>{const p=g.p;p.cd=Math.max(0,p.cd-dt);for(const k in fxB) if(fxB[k]>0) fxB[k]=Math.max(0,fxB[k]-dt);if(p.gun&&p.gun.time>0){p.gun.time-=dt;if(p.gun.time<=0) dropGun('TEMPS ÉCOULÉ')}});
    if(FW.mode==='coop'&&!g.p.dead) for(const pk of FW.pk) if(pk.kind==='bonus'&&pk.life>0&&Math.hypot(pk.px-g.f3.x,pk.pz-g.f3.z)<60){runAs(g,()=>fwApply(pk.d.type,pk.d.gold,{x:g.f3.x,z:g.f3.z,yaw:g.f3.yaw}));pk.life=0}
  }
  if(FW.mode!=='coop') fwmBrTick(dt);
  for(const f of FW.feed) f.t-=dt/16.7;FW.feed=FW.feed.filter(f=>f.t>0);
  FW.snT+=dt;if(FW.snT>=64){FW.snT=0;fwmSend()}
}
function fwmSend(){
  if(!MP.guests.length){FW.evq.length=0;return}
  const r1=n=>Math.round(n*10)/10;
  const z=FW.zs.filter(q=>q.hp>0).map(q=>{if(!q.id) q.id=++FW.zid;return[q.id,q.type,r1(q.px),r1(q.pz),Math.max(1,Math.ceil(q.hp/q.maxhp*100)),Math.round(q.size*10),q.boss?1:0,Math.round(((Math.atan2(q.fz||0,q.fx||1))*100))]});
  const pl=fwmPlayers().map(q=>[q.id,r1(q.x),r1(q.z),Math.round(q.y),Math.round((q.id===0?FW.yaw:(q.g.f3.yaw||0))*100),Math.round((q.id===0?FW.pitch:(q.g.f3.pitch||0))*100),Math.ceil(Math.max(0,q.p.hp)),q.p.w,q.dead?1:0,q.team,q.k|0,q.place|0,q.air|0,q.c|0]);
  const pk=FW.pk.map(q=>{if(!q.id) q.id=++FW.pkid;return[q.id,q.kind==='bonus'?1:0,Math.round(q.px),Math.round(q.pz),q.kind==='bonus'?q.d.type:(q.d.sup||(q.d.w!==undefined?q.d.w:'g')),Math.round(q.col||0)]});
  const en=FW.en.filter(e=>!e.dead).map(e=>{if(!e.nid) e.nid=++FW.enid;return[e.nid,e.k,Math.round(e.x),Math.round(e.z),Math.round((e.yaw||0)*100)]});
  const ZZ=FW.zone,Z=ZZ?[Math.round(ZZ.cx),Math.round(ZZ.cz),Math.round(ZZ.r),Math.round(ZZ.cx1),Math.round(ZZ.cz1),Math.round(ZZ.r1),ZZ.phase,Math.round(fwmZoneSecs(ZZ)),ZZ.st==='wait'?0:1]:0;
  const base={t:'s3',n:++FW.seq,w:wave,m:money,x:runXp,k:kills,q:FW.queue.length+FW.zs.length,z,pl,pk,en,ev:FW.evq,zn:Z,fd:FW.feed.map(f=>[f.a,f.b])};
  FW.evq=[];
  for(const g of MP.guests){
    if(!g.conn.open||!g.p) continue;const p=g.p,fxo={};for(const k in g.fxb) if(g.fxb[k]>0) fxo[k]=Math.round(g.fxb[k]);
    const me={hp:Math.ceil(Math.max(0,p.hp)),mx:p.maxhp,dead:p.dead?1:0,w:p.w,gun:p.gun?{w:p.gun.w,ammo:Math.min(p.gun.ammo,1e9),time:p.gun.time|0,a0:p.gun.a0,t0:p.gun.t0,gl:p.gun.gl,gs:p.gun.gs,gwd:p.gun.gwd}:0,fx:fxo,st:g.stock,cx:g.cxp,cl:g.clv,ms:g.msgs.splice(0,6)};
    try{g.conn.send(Object.assign({},base,{me}))}catch(e){}
  }
}
// ---------- côté invité : envoi de la position, tirs, réception ----------
function fwmSendPos(dt){
  FW.posT+=dt;if(FW.posT<50) return;FW.posT=0;
  mpSend({t:'p3',a:FW.air|0,c:FW.crouch>.5?1:0,x:Math.round(FW.x*10)/10,z:Math.round(FW.z*10)/10,y:Math.round(FW.y),ya:Math.round(FW.yaw*100)/100,pi:Math.round(FW.pitch*100)/100,w:player.w});
}
function fwmGuestShoot(wp){
  const g=player.gun;if(!g||g.w!==player.w||!(g.ammo>0||g.time>0)){return}
  const T=THREE,o=FW.cam.getWorldPosition(new T.Vector3()),base=fwDir(0),hw=wp.hands?WEAPONS[wp.hi[player.hand=1-(player.hand||0)]]:wp;
  mpSend({t:'sh3',a:FW.adsK>.6?1:0,o:[Math.round(o.x*10)/10,Math.round(o.y*10)/10,Math.round(o.z*10)/10],d:[Math.round(base.x*1e4)/1e4,Math.round(base.y*1e4)/1e4,Math.round(base.z*1e4)/1e4]});
  const muz=o.clone().add(base.clone().multiplyScalar(30)).add(new T.Vector3(0,-6,0));fwTrace(muz,o.clone().add(base.clone().multiplyScalar(Math.max(700,(hw.range||800)*1.6)*.6)),hw.col||'#ffe08a');
  if(g.time<=0) g.ammo--;FW.recoil=1;player.cd=(wp.hands?hw.rate*.6:wp.rate)/rapM();playGun(hw);
}
function fwmPeer(id,info){
  let q=FW.pmap.get(id);
  if(!q){
    const pi=(MP.pinfo&&MP.pinfo[id])||{n:'JOUEUR',look:null,team:0},T=THREE;
    const sv=save.look,svp=prevO;let lk;try{save.look=pi.look||sv;prevO=(pi.look&&pi.look.outfit)|0;lk=g3Look()}finally{save.look=sv;prevO=svp}
    const mesh=lk.an?g3Quad(lk.an,lk.col):g3Human(lk);mesh.userData.an=lk.an;
    const tc=new T.Mesh(G3.geo.sph,new T.MeshBasicMaterial({color:new T.Color(FW_TEAMC[(info&&info.team||pi.team||0)%10])}));tc.scale.setScalar(5);tc.position.set(0,104,0);mesh.add(tc);
    FW.scene.add(mesh);q={id,x:0,z:0,y:0,yaw:0,pitch:0,hp:100,w:0,dead:false,team:pi.team|0,name:pi.n,mesh,first:true,k:0,tx:0,tz:0,col:FW_TEAMC[(pi.team|0)%10],step:0,place:0};FW.pmap.set(id,q);FW.peers.push(q);
  }
  return q;
}
function fwmApply(s){
  if(!FW.on||FW.net!=='guest') return;
  const T=THREE;MP.lastSnapAt=performance.now();
  wave=s.w;money=s.m;runXp=s.x;kills=s.k;FW.left=s.q;
  // zombies
  const seen=new Set();
  for(const e of s.z){
    const id=e[0];seen.add(id);let z=FW.zmap.get(id);
    if(!z){const boss=!!e[6],mesh=g3MakeZombie(boss?{type:'tank',boss:true}:{type:e[1]});fwZScale(mesh,e[5]/10);const B=boss?BOSSES[0]:null;z={id,type:e[1],px:e[2],pz:e[3],tx:e[2],tz:e[3],size:e[5]/10,hp:e[4],maxhp:100,boss,B,mesh,step:0,dead:false,at:0};FW.scene.add(mesh);FW.zmap.set(id,z);FW.zs.push(z)}
    z.tx=e[2];z.tz=e[3];z.hp=e[4];
  }
  for(const [id,z] of FW.zmap) if(!seen.has(id)){FW.scene.remove(z.mesh);FW.zmap.delete(id);z.dead=true;FW.dying.push({m:z.mesh,t:0,y:0});FW.scene.add(z.mesh)}
  FW.zs=FW.zs.filter(z=>!z.dead);
  // joueurs
  const seenP=new Set();
  for(const e of s.pl){
    const id=e[0];if(id===MP.myId){player.hp=e[6];FW.myTeam=e[9];FW.place=e[11];if(e[8]&&!FW.down){FW.down=true}continue}
    seenP.add(id);const q=fwmPeer(id,{team:e[9]});q.tx=e[1];q.tz=e[2];q.y=e[3];q.tyaw=e[4]/100;q.pitch=e[5]/100;q.hp=e[6];q.w=e[7];q.dead=!!e[8];q.team=e[9];q.k=e[10];q.place=e[11];q.air=e[12]|0;q.c=e[13]|0;
    if(q.first){q.first=false;q.x=q.tx;q.z=q.tz;q.yaw=q.tyaw}
  }
  for(const q of FW.peers.slice()) if(!seenP.has(q.id)){FW.scene.remove(q.mesh);FW.pmap.delete(q.id);FW.peers.splice(FW.peers.indexOf(q),1)}
  // butin
  const seenK=new Set();
  for(const e of s.pk){
    const id=e[0];seenK.add(id);if(FW.pkmap.has(id)) continue;
    const bonus=!!e[1],d=bonus?{type:e[4],gold:false}:(e[4]==='heal'||e[4]==='shield'?{sup:e[4]}:{w:+e[4]});
    fwAddPk(bonus?'bonus':'crate',e[2],e[3],d,e[5]||0xffd45a,1e9);const pk=FW.pk[FW.pk.length-1];pk.id=id;FW.pkmap.set(id,pk);
  }
  for(const [id,pk] of FW.pkmap) if(!seenK.has(id)){FW.scene.remove(pk.m);FW.pkmap.delete(id);const i=FW.pk.indexOf(pk);if(i>=0) FW.pk.splice(i,1)}
  // objets de boosts (aperçu simple)
  const seenE=new Set();
  for(const e of s.en){
    const id=e[0];seenE.add(id);let o=FW.enmap.get(id);
    if(!o){const col={barr:0x8a6a3a,ted:0xa8744a,mine:0x2a2c26,trap:0x6a6e76,fire:0xff6a1a,drone:0x44505c,decoy:0x5a4a2a,gren:0x4a6a3a,smoke:0x9aa0aa,fence:0x5fd8ff,dog:0xb88a4a,heli:0x4a5a3a,turret:0x4a5640}[e[1]]||0xcccccc;
      const sz={barr:[96,60,16],fire:[120,6,120],smoke:[160,70,160],fence:[160,60,6],heli:[110,34,40],mine:[24,6,24],trap:[28,5,28]}[e[1]]||[30,30,30];
      const m=new T.Mesh(G3.geo.box,new T.MeshBasicMaterial({color:col,transparent:e[1]==='smoke'||e[1]==='fire',opacity:e[1]==='smoke'?.3:e[1]==='fire'?.5:1}));m.scale.set(sz[0],sz[1],sz[2]);FW.scene.add(m);o={m,sy:sz[1]};FW.enmap.set(id,o)}
    o.m.position.set(e[2],e[1]==='heli'||e[1]==='drone'?200:o.sy/2,e[3]);o.m.rotation.y=e[4]/100;
  }
  for(const [id,o] of FW.enmap) if(!seenE.has(id)){FW.scene.remove(o.m);FW.enmap.delete(id)}
  // zone
  if(s.zn){FW.zone={cx:s.zn[0],cz:s.zn[1],r:s.zn[2],cx1:s.zn[3],cz1:s.zn[4],r1:s.zn[5],phase:s.zn[6],secs:s.zn[7],shrink:!!s.zn[8]}}else FW.zone=null;
  FW.feed=(s.fd||[]).map(f=>({a:f[0],b:f[1],t:200}));
  // événements visuels / sonores
  for(const e of s.ev||[]){
    if(e[0]==='tr'){if(e[8]!==MP.myId) fwTrace(new T.Vector3(e[1],e[2],e[3]),new T.Vector3(e[4],e[5],e[6]),e[7])}
    else if(e[0]==='bm') fwBoom(e[1],e[2],e[3],e[4]);
    else if(e[0]==='sf'){try{sfx(e[1])}catch(_){}}
    else if(e[0]==='ft') flash(e[1]);
  }
  // mon état
  const y=s.me;if(y){
    const prev=player.hp;player.hp=y.hp;player.maxhp=y.mx;if(y.hp<prev-.5){FW.hurtFl=1;FW.shk=Math.max(FW.shk,5);sfx('hurt')}
    if(y.dead&&!FW.down){FW.down=true;flash(FW.mode==='coop'?'À TERRE : tu reviens à la prochaine manche':'ÉLIMINÉ')}
    if(!y.dead&&FW.down&&FW.mode==='coop'){FW.down=false}
    if(y.gun){const gn=player.gun;if(!gn||gn.w!==y.gun.w){player.gun=Object.assign({},y.gun);player.w=y.gun.w}else if(Math.abs((gn.ammo||0)-y.gun.ammo)>2||gn.time!==y.gun.time) player.gun=Object.assign({},y.gun);else gn.time=y.gun.time}
    else if(player.gun){player.gun=null;if(player.w!==player.melee) player.w=player.melee}
    stock=Array.isArray(y.st)?y.st.slice(0,8):[];charXp=y.cx|0;charLvl=y.cl|0||1;fxB=Object.assign({shield:0,dmg:0,rapid:0,freeze:0,magnet:0,adren:0},y.fx||{});
    for(const m of y.ms||[]) flash(String(m).slice(0,60));
  }
}
function fwmGuestTick(dt){
  const k=Math.min(1,dt/16.7),T=THREE;
  for(const z of FW.zs){
    const dx=z.tx-z.px,dz=z.tz-z.pz,sp=Math.hypot(dx,dz);z.px+=dx*.3*k;z.pz+=dz*.3*k;if(sp>1.2){z.step+=sp*.05;z.face=Math.atan2(-dz,dx)}
    const m=z.mesh;m.position.set(z.px,0,z.pz);if(z.face!==undefined) m.rotation.y=z.face;
    const P_=m.userData.P,sw=Math.sin(z.step*3);if(P_&&P_.legL){P_.legL.rotation.z=sw*.7;P_.legR.rotation.z=-sw*.7;P_.armL.rotation.z=1.25;P_.armR.rotation.z=1.3;P_.body.rotation.z=-.08}
  }
}
function fwmPeersTick(dt){
  const k=Math.min(1,dt/16.7);
  if(FW.net==='host'){for(const g of MP.guests) if(g.f3&&!FW.pmap.has(g.id)) fwmPeer(g.id,{team:g.f3.team});for(const q of FW.peers.slice()) if(!MP.guests.some(g=>g.id===q.id)){FW.scene.remove(q.mesh);FW.pmap.delete(q.id);FW.peers.splice(FW.peers.indexOf(q),1)}}
  for(const q of FW.peers){
    if(FW.net==='host'){const g=MP.guests.find(x=>x.id===q.id);if(g&&g.f3){q.tx=g.f3.x;q.tz=g.f3.z;q.tyaw=g.f3.yaw||0;q.y=g.f3.y||0;q.pitch=g.f3.pitch||0;q.hp=g.p.hp;q.w=g.p.w;q.dead=!!g.p.dead;q.team=g.f3.team;q.k=g.f3.k|0}}
    const dx=q.tx-q.x,dz=q.tz-q.z,sp=Math.hypot(dx,dz);q.x+=dx*.35*k;q.z+=dz*.35*k;let dy=(q.tyaw||0)-q.yaw;while(dy>3.14) dy-=6.283;while(dy<-3.14) dy+=6.283;q.yaw+=dy*.4*k;if(sp>.6) q.step+=.2;
    const M=q.mesh;M.position.set(q.x,q.y||0,q.z);M.rotation.y=q.yaw+Math.PI/2;
    const PP=M.userData.P;
    if(M.userData.an){const lg=PP&&PP.legs,sw=sp>.6?Math.sin(q.step):0;if(lg&&lg.length>3){lg[0].rotation.z=sw*.8;lg[1].rotation.z=-sw*.8;lg[2].rotation.z=-sw*.8;lg[3].rotation.z=sw*.8}}
    else if(PP){const sw=sp>.6?Math.sin(q.step)*.7:0;PP.legL.rotation.z=sw;PP.legR.rotation.z=-sw;g3Gun(PP,q.w);const wp=WEAPONS[q.w];if(wp&&wp.melee){PP.armR.rotation.z=-.3;PP.armL.rotation.z=.2}else{PP.armR.rotation.z=q.pitch;PP.armL.rotation.z=q.pitch-.15;PP.armL.rotation.y=.18}
      if(M.userData.bulbs){const cols=[0xff3a3a,0xffd23a,0x3ad0ff,0xff6ad8,0x6aff7a];M.userData.bulbs.forEach((b,i)=>b.material.color.setHex(((tick>>3)+i)%3===0?0x222222:cols[(i+(tick>>4))%5]))}}
    if(!M.userData.can){M.userData.can=fwCanopy();M.add(M.userData.can)}M.userData.can.visible=q.air===3&&!q.dead;M.scale.y=q.c?.74:1;
    M.rotation.z=q.dead?-1.5:0;if(q.dead) M.position.y=-6;
  }
  if(FW.zoneM&&FW.zone&&FW.mode!=='coop'){FW.zoneM.visible=true;FW.zoneM.scale.set(FW.zone.r,1,FW.zone.r);FW.zoneM.position.set(FW.zone.cx,3000,FW.zone.cz);FW.zoneM.material.opacity=.15+.07*Math.sin(tick*.08)+(FW.zone.st==='shrink'||FW.zone.shrink?.08:0)}else if(FW.zoneM) FW.zoneM.visible=false;
  if(FW.planeM){const pp=fwPlanePos(FW.tDrop);FW.planeM.visible=FW.mode!=='coop'&&!pp.done&&!FW.over;FW.planeM.position.set(pp.x,pp.y,pp.z);FW.planeM.rotation.y=Math.atan2(-(FW.path?FW.path.dz:0),(FW.path?FW.path.dx:1))}
}
// ---------- affichage 2D : joueurs, zone, BR ----------
function fwLos(tx,ty,tz){const c=FW.cam.position;for(let i=1;i<10;i++){const t=i/10;if(fwSolid(c.x+(tx-c.x)*t,c.z+(tz-c.z)*t,c.y+(ty-c.y)*t)) return false}return true}
function fwmHud(){
  const cx=W/2,T=THREE,v=new T.Vector3();
  for(const q of FW.peers){
    if(q.dead) continue;const dx=q.x-FW.x,dz=q.z-FW.z,d2=dx*dx+dz*dz;if(d2>1400*1400) continue;
    v.set(q.x,112+(q.y||0),q.z).project(FW.cam);if(v.z>1||Math.abs(v.x)>1.1||Math.abs(v.y)>1.1) continue;if(!fwLos(q.x,70+(q.y||0),q.z)) continue;
    const sx=(v.x+1)/2*W,sy=(1-v.y)/2*H;ctx.textAlign='center';ctx.font='700 13px '+FONT;ctx.fillStyle='#000a';ctx.fillText(q.name,sx+1,sy+1);ctx.fillStyle=FW_TEAMC[(q.team|0)%10];ctx.fillText(q.name,sx,sy);
    const f=Math.max(0,q.hp/(FW.mode==='coop'?Math.max(100,q.hp):100));ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(sx-24,sy+4,48,5);ctx.fillStyle='#58b84a';ctx.fillRect(sx-23,sy+5,46*Math.min(1,f),3);
  }
  ctx.textAlign='left';
  if(FW.mode!=='coop'&&FW.net){
    const alive=(FW.net==='host'?fwmPlayers().filter(q=>!q.dead).length:FW.peers.filter(q=>!q.dead).length+(FW.down?0:1)),Z=FW.zone;
    ctx.fillStyle='#000a';ctx.fillRect(cx-150,8,300,76);ctx.textAlign='center';ctx.fillStyle='#ffd45a';ctx.font='700 16px '+FONT;ctx.fillText('BATTLE ROYALE · '+alive+' EN VIE',cx,28);
    if(Z){const sec=FW.net==='host'?Math.round(fwmZoneSecs(Z)):(Z.secs|0),shr=FW.net==='host'?Z.st==='shrink':Z.shrink,mm=Math.floor(sec/60),ss=String(sec%60).padStart(2,'0');
      ctx.fillStyle=shr?'#ff6a4a':'#d8d2c8';ctx.font='500 13px '+FONT;ctx.fillText(shr?'LA ZONE SE DÉPLACE ET SE RÉDUIT':'PROCHAIN DÉPLACEMENT DE LA ZONE',cx,48);
      ctx.fillStyle=shr?'#ff4a3a':'#ffd45a';ctx.font='700 26px '+FONT;ctx.fillText(mm+':'+ss,cx,78);
      const me=Math.hypot(FW.x-Z.cx,FW.z-Z.cz);if(me>Z.r&&!FW.air){ctx.fillStyle='rgba(180,20,10,'+(.18+.1*Math.sin(tick*.3))+')';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ff6a4a';ctx.font='700 22px '+FONT;ctx.fillText('TU ES HORS DE LA ZONE !',cx,H*.3)}}
    ctx.textAlign='left';
    let fy=210;ctx.font='600 13px '+FONT;for(const f of FW.feed.slice(-5)){ctx.textAlign='right';ctx.fillStyle='#000a';ctx.fillText(f.a+'  ✖  '+f.b,W-14,fy+1);ctx.fillStyle='#f2e6d0';ctx.fillText(f.a+'  ✖  '+f.b,W-15,fy);fy+=18}ctx.textAlign='left';
    if(FW.mode==='brt'){ctx.fillStyle=FW_TEAMC[(FW.myTeam|0)%10];ctx.font='700 13px '+FONT;ctx.fillText('ÉQUIPE '+((FW.myTeam|0)+1),cx-24,H-96)}
  }
  if(FW.down){
    ctx.textAlign='center';
    if(FW.mode==='coop'){ctx.fillStyle='#000a';ctx.fillRect(cx-260,H*.18,520,76);ctx.fillStyle='#ff6a5a';ctx.font='400 38px '+TITLE;ctx.fillText('À TERRE',cx,H*.18+38);ctx.fillStyle='#e9e1d0';ctx.font='700 14px '+FONT;ctx.fillText('Tes équipiers continuent : tu reviens à la prochaine manche',cx,H*.18+62)}
    else{
      ctx.fillStyle='#0009';ctx.fillRect(0,H*.1,W,H*.22);ctx.fillStyle='#ff6a5a';ctx.font='400 30px '+TITLE;ctx.fillText('ÉLIMINÉ',cx,H*.1+34);
      ctx.fillStyle='#ffd45a';ctx.font='400 96px '+TITLE;ctx.fillText(FW.place?'#'+FW.place:'#?',cx,H*.1+118);
      const sp=fwmSpec();ctx.fillStyle='#e9e1d0';ctx.font='700 15px '+FONT;
      ctx.fillText(sp?'Tu regardes : '+sp.name+'   ·   clic : joueur suivant':'Plus personne à regarder…',cx,H*.1+H*.22-12);
      if(FW.pend){ctx.fillStyle='#000b';ctx.fillRect(cx-210,H-92,420,40);ctx.fillStyle='#9fd18a';ctx.font='700 16px '+FONT;ctx.fillText('ENTRÉE : quitter et voir mes gains (+'+FW.pend.m+' $)',cx,H-66)}
    }
    ctx.textAlign='left'}
  // saut / parachute / altitude
  if(FW.air){ctx.textAlign='center';ctx.fillStyle='#000a';ctx.fillRect(cx-250,H*.62,500,64);ctx.fillStyle='#ffd45a';ctx.font='700 20px '+FONT;
    const left=FW.air===1?Math.ceil(fwPlanePos(FW.tDrop).left):0;
    ctx.fillText(FW.air===1?'ESPACE / E : SAUTER  ('+left+' s avant la fin du trajet)':FW.air===2?'ESPACE : OUVRIR LE PARACHUTE':'PARACHUTE OUVERT · dirige-toi avec ZQSD',cx,H*.62+28);
    ctx.fillStyle='#d8d2c8';ctx.font='500 14px '+FONT;ctx.fillText('Altitude : '+Math.round(FW.y)+' m'+(FW.air===1?'   ·   '+(FW.path&&FW.path.type==='blimp'?'DIRIGEABLE':'AVION'):''),cx,H*.62+52);ctx.textAlign='left'}
  // lunette
  if(FW.scopeK>.85){const R=H*.44;ctx.fillStyle='#000';ctx.beginPath();ctx.rect(0,0,W,H);ctx.arc(W/2,H/2,R,0,Math.PI*2,true);ctx.fill('evenodd');
    ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W/2-R,H/2);ctx.lineTo(W/2+R,H/2);ctx.moveTo(W/2,H/2-R);ctx.lineTo(W/2,H/2+R);ctx.stroke();
    ctx.strokeStyle='rgba(0,0,0,.7)';ctx.beginPath();ctx.arc(W/2,H/2,R*.5,0,7);ctx.stroke();ctx.fillStyle='#ff3a2a';ctx.fillRect(W/2-1,H/2-1,2,2);
    ctx.textAlign='center';ctx.fillStyle='#e9e1d0';ctx.font='700 16px '+FONT;ctx.fillText('×'+FW_ZOOMS[FW.zi]+'   (molette : zoom)',W/2,H/2+R+22);ctx.textAlign='left'}
  if(FW.net==='guest'&&FW.left!==undefined&&FW.mode==='coop'){ctx.fillStyle='#8a8178';ctx.font='500 13px '+FONT;ctx.fillText('',0,0)}
}
function fwmBrApply(d){                                                    // reçu de l'hôte : on le garde, le joueur regarde la fin de la partie (caméra spectateur)
  if(!d||d.id!==MP.myId||d.gid!==MP.gid){return}
  const done=(save.ac&&save.ac.g)||[];
  if(d.sig!==ACG.rcpt(d.gid,d.id,d.place,d.k,d.m,d.x)){ACG.note('Reçu Battle Royale invalide : gains refusés');return}
  if(done.includes(d.gid)){ACG.note('Reçu déjà utilisé');return}
  if(!(d.m>=0&&d.x>=0&&d.m<=6000&&d.x<=7200&&d.place>=1&&d.place<=10)){ACG.note('Gains Battle Royale invraisemblables refusés');return}
  FW.pend=d;FW.place=d.place;if(!FW.down){FW.down=true;FW.air=0}
  if(d.place===1) setTimeout(()=>{if(FW.pend) fwmBrFinish()},2500);
}

// ---------- mise à jour ----------
function fwGp(){                                                          // manettes activées uniquement, axes recalibrés au repos, boutons bloqués ignorés (voir gpState)
  if(!SET.gp.on||!GPS.pads.length){FW.gpOn=false;return null}
  const g=gpState();FW.gpOn=true;return g;
}
function fwUpdate(dt,pz){
  const P=player,T=THREE,touch=touchOn(),gp=fwGp(),NET=FW.net,G=NET==='guest';
  if(!NET&&!FW.lock&&!touch&&!gp){return}
  const idle=!!pz||FW.down||!(FW.lock||touch||gp);
  if(NET&&FW.mode!=='coop'&&!FW.over) FW.tDrop+=dt;
  const crT=!!(keys.ControlLeft||keys.ControlRight)&&!FW.air&&!idle;FW.crouch+=((crT?1:0)-FW.crouch)*.25*(dt/16.7);
  // regard
  const tc=FW.tc;
  let mvx=0,mvz=0,run=!!(keys.ShiftLeft||keys.ShiftRight),jump=!!keys.Space,fireH=false;
  if(keys.KeyW||keys.ArrowUp) mvz+=1;if(keys.KeyS||keys.ArrowDown) mvz-=1;
  if(kd('right')) mvx+=1;if(kd('left')) mvx-=1;
  if(touch){
    if(tc.mv){mvx+=Math.max(-1,Math.min(1,(tc.mv.x-tc.mv.x0)/55));mvz+=Math.max(-1,Math.min(1,-(tc.mv.y-tc.mv.y0)/55))}
    if(tc.lk){FW.yaw-=(tc.lk.x-tc.lk.px)*.0055;FW.pitch-=(tc.lk.y-tc.lk.py)*.0055;tc.lk.px=tc.lk.x;tc.lk.py=tc.lk.y}
    if(tc.b.jump) jump=true;if(tc.b.fire) fireH=true;if(tc.b.run) run=true;
  }
  if(gp){
    const live=performance.now()-GPS.act<8000,k=Math.max(.5,SET.gp.sens);
    if(live){mvx+=Math.max(-1,Math.min(1,gp.mx));mvz-=Math.max(-1,Math.min(1,gp.my));FW.yaw-=gp.rx*.05*k;FW.pitch-=gp.ry*.04*k}
    if(gp.a||gp.jump) jump=true;if(gp.fire) fireH=true;if(gp.l3) run=true;
    const edge=(n,v,fn)=>{if(v&&!FW['gb'+n]) fn();FW['gb'+n]=v};
    edge('x',gp.x,fwPickup);edge('y',gp.y,fwUseBonus);edge('b',gp.b,()=>{FW.tp=!FW.tp});edge('s',gp.start,openPause);edge('k',gp.back,fwSwap);
  }
  if(!touch&&!gp||FW.lock) fireH=fireH||(FW.lmb&&performance.now()-FW.lockT>250)||kd('fire');
  FW.pitch=Math.max(-1.45,Math.min(1.45,FW.pitch));
  if(idle){mvx=0;mvz=0;jump=false;fireH=false}
  const adsOn=(FW.adsM||(gp&&gp.lt))&&!idle&&!FW.air&&!WEAPONS[P.w].melee;FW.ads=!!adsOn;FW.adsK+=((adsOn?1:0)-FW.adsK)*.22*(dt/16.7);
  FW.scopeK=fwScoped(WEAPONS[P.w])?Math.max(0,(FW.adsK-.5)*2):0;
  const L=Math.hypot(mvx,mvz);if(L>1){mvx/=L;mvz/=L}
  if(FW.air){fwAirUpdate(dt,mvx,mvz)}else{
  if(FW.crouch>.5) run=false;
  const sp=2.7*(run?1.55:1)*(1-.45*FW.crouch)*(dt/16.7),fx_=-Math.sin(FW.yaw),fz_=-Math.cos(FW.yaw),rx=Math.cos(FW.yaw),rz=-Math.sin(FW.yaw);
  const o={px:FW.x+(fx_*mvz+rx*mvx)*sp,pz:FW.z+(fz_*mvz+rz*mvx)*sp};
  fwPush(o,FW_R,FW.y,FW.crouch>.5?44:68);fwPushEn(o,FW_R);o.px=Math.max(-FW_LIM,Math.min(FW_LIM,o.px));o.pz=Math.max(-FW_LIM,Math.min(FW_LIM,o.pz));
  {const hh=(FW.crouch>.5?44:68)+4;                                   // plafond : on ne quitte pas l'escalier par le côté la tête dans le plancher
    if(fwSlabHit(o.px,o.pz,FW.y,hh)&&!fwSlabHit(FW.x,FW.z,FW.y,hh)){
      if(!fwSlabHit(o.px,FW.z,FW.y,hh)) o.pz=FW.z;else if(!fwSlabHit(FW.x,o.pz,FW.y,hh)) o.px=FW.x;else{o.px=FW.x;o.pz=FW.z}}}
  if(L>.05) FW.bob+=.17*(run?1.4:1);
  ACG.fwStep(Math.hypot(o.px-FW.x,o.pz-FW.z),2.7*1.55*(dt/16.7));FW.x=o.px;FW.z=o.pz;P.x=FW.x;if(G) fwmSendPos(dt);
  {const yp=FW.y;let sup=fwSupportY(FW.x,FW.z,yp);
    if(FW.vy<=0&&FW.gnd&&yp-sup<=16&&yp-sup>-1){FW.y=sup;FW.vy=0}                      // reste collé au sol, aux marches, aux rampes
    else{FW.vy-=.42;FW.y+=FW.vy;FW.gnd=false;if(FW.vy>0){const hh=(FW.crouch>.5?44:68)+4,cy=fwCeilY(FW.x,FW.z,yp);if(FW.y+hh>cy){FW.y=cy-hh;FW.vy=0}}sup=fwSupportY(FW.x,FW.z,Math.max(yp,FW.y));if(FW.vy<=0&&FW.y<=sup){const imp=FW.vy;FW.y=sup;FW.vy=0;FW.gnd=true;if(imp<-13&&FW.net!=='guest'&&!FW.down){fwHurt(Math.round((-imp-13)*9));FW.shk=10}}}
    if(jump&&FW.gnd&&FW.crouch<.5){FW.vy=7.4;FW.gnd=false}
  }
  }
  // armes
  P.cd=Math.max(0,P.cd-dt);P.swing=Math.max(0,(P.swing||0)-dt);
  const wp=WEAPONS[P.w];
  if(fireH){if(P.cd<=0&&(wp.auto||!FW.fired)){FW.fired=true;if(wp.melee) fwSlash();else fwShoot()}}else FW.fired=false;
  if(FW.sw){FW.sw.t+=dt;if(!FW.sw.hit&&FW.sw.t>=FW.sw.d*.42){FW.sw.hit=true;fwSlashHit()}if(FW.sw.t>=FW.sw.d) FW.sw=null}
  if(!G) for(const k in fxB) if(fxB[k]>0) fxB[k]=Math.max(0,fxB[k]-dt);
  if(!G&&P.gun&&P.gun.time>0){P.gun.time-=dt;if(P.gun.time<=0) dropGun('TEMPS ÉCOULÉ')}
  // caisses et bonus
  const CO=!G&&FW.mode==='coop';
  if(CO) FW.crT-=dt;if(CO&&FW.crT<=0){FW.crT=(15000+Math.random()*20000)/curMap.crate;const c=fwPlaceFree(350,900);if(c) fwSpawnCrate(c[0],c[1])}
  if(CO) FW.suT-=dt;if(CO&&FW.suT<=0){FW.suT=(25000+Math.random()*25000)/curMap.sup;const c=fwPlaceFree(350,900);if(c) fwSpawnCrate(c[0],c[1],true)}
  FW.near=null;let bd=95;
  for(let i=FW.pk.length-1;i>=0;i--){
    const p=FW.pk[i];p.t+=.06;p.life-=dt;p.m.rotation.y+=.02;p.m.position.y=p.kind==='bonus'?22+Math.sin(p.t)*5:0;
    const d=Math.hypot(p.px-FW.x,p.pz-FW.z);
    if(p.kind==='bonus'&&d<60&&CO&&!FW.down){fwApply(p.d.type,p.d.gold);p.life=0}
    else if(p.kind==='crate'&&d<bd){bd=d;FW.near=p}
    if(p.life<=0){FW.scene.remove(p.m);FW.pk.splice(i,1)}
  }
  // zombies
  const frz=fxB.freeze>0?.3:1;
  for(const z of (G?[]:FW.zs)){
    if(z.dead) continue;
    const tg=NET?fwmNearest(z.px,z.pz):{x:FW.x,z:FW.z,y:FW.y,g:null},dx=tg.x-z.px,dz=tg.z-z.pz,d=Math.hypot(dx,dz);if(!z.id) z.id=++FW.zid;
    if(d>2800){const c=fwPlaceFree(950,1500);if(c){z.px=c[0];z.pz=c[1]}continue}
    if(z.stun>0){z.stun--;continue}
    let tdx=dx,tdz=dz;const dec=FW.en.find(e=>e.k==='decoy');if(dec&&Math.hypot(dec.x-z.px,dec.z-z.pz)<1400){tdx=dec.x-z.px;tdz=dec.z-z.pz}
    let a=Math.atan2(tdz,tdx);if(z.avT>0){a+=z.av*1.1;z.avT--}if(z.lost>0){z.lost--;a+=Math.sin(tick*.1+z.step)*1.6}
    const sl=z.slow>0?(z.slow--,.5):1,spd=z.speed*.95*frz*sl*(dt/16.7);
    if(d>20*z.size+FW_R-4){
      const ox=z.px,oz=z.pz;z.px+=Math.cos(a)*spd;z.pz+=Math.sin(a)*spd;
      const hit=fwPush(z,15*z.size,0,88*z.size),eh=fwPushEn(z,15*z.size);if(eh&&eh.hp!==undefined&&(eh.k==='barr'||eh.k==='ted')) eh.hp-=z.dmg*.02*(dt/16.7);
      if(hit&&Math.hypot(z.px-ox,z.pz-oz)<spd*.4&&z.avT<=0){z.avT=45;z.av=Math.random()<.5?1:-1}
      z.step+=spd*.17;
    }
    z.atk=Math.max(0,z.atk-dt);
    if(d<(26*z.size+FW_R)&&z.atk<=0&&(tg.y||0)<45){z.atk=800;z.at=18;z.fx=dx;z.fz=dz;if(tg.g) fwmHurtG(tg.g,z.dmg);else if(!FW.down) fwHurt(z.dmg)}
    z.fx=dx;z.fz=dz;const m=z.mesh;m.position.set(z.px,0,z.pz);m.rotation.y=Math.atan2(-dz,dx);
    const P_=m.userData.P,sw=Math.sin(z.step*3);
    if(P_&&P_.legL){P_.legL.rotation.z=sw*.7;P_.legR.rotation.z=-sw*.7;const lg=z.at>0?Math.sin(z.at--/18*Math.PI):0;P_.armL.rotation.z=1.25+Math.sin(z.step*2)*.12+lg*.7;P_.armR.rotation.z=1.3+Math.sin(z.step*2+1)*.12+lg*.7;P_.body.rotation.z=-.08-lg*.3;fwZScale(m,z.size,z.flash>0?1.06:1);if(z.flash>0) z.flash--}
  }
  if(!G) for(let i=0;i<FW.zs.length;i++){const a=FW.zs[i];if(a.dead) continue;for(let j=i+1;j<FW.zs.length;j++){const b=FW.zs[j];if(b.dead) continue;
    const dx=b.px-a.px,dz=b.pz-a.pz,dd=dx*dx+dz*dz,r=(a.size+b.size)*13;if(dd<r*r&&dd>.01){const d=Math.sqrt(dd),k=(r-d)/d*.5;a.px-=dx*k;a.pz-=dz*k;b.px+=dx*k;b.pz+=dz*k}}}
  if(!G) FW.zs=FW.zs.filter(z=>!z.dead);
  // vagues
  const cap=MOBILE?14:24;
  if(!G&&FW.mode==='coop'&&FW.queue.length&&FW.zs.length<cap){FW.spT-=dt/16.7;if(FW.spT<=0){FW.spT=50+Math.random()*60;fwSpawnZ(FW.queue.shift())}}
  else if(!G&&FW.mode==='coop'&&!FW.queue.length&&!FW.zs.length){
    FW.brk+=dt;
    if(FW.brk>4000){if(wave===10&&!training&&!NM.on){save.mapClear[curMap.id]=true;persist();const nx=MAPS[MAPS.indexOf(curMap)+1];if(nx) flashG('CARTE DÉBLOQUÉE : '+nx.name+' !')}fwWave()}
  }
  // effets
  for(let i=FW.dying.length-1;i>=0;i--){const q=FW.dying[i];q.t++;q.m.rotation.z=-Math.min(1,q.t/14)*1.55;q.m.position.y=q.y-Math.max(0,q.t-30)*.8;if(q.t>56){FW.scene.remove(q.m);FW.dying.splice(i,1)}}
  for(const f of FW.fires){f.m.scale.set(1+Math.sin(tick*.3+f.x)*.15,1.6+Math.sin(tick*.4+f.z)*.35,1);f.m.updateMatrix()}
  FW.slashFx=Math.max(0,FW.slashFx-1);
  if(!G) fwEnUpdate(dt);
  if(!G&&fxB.magnet>0){const R=magR(fxL.magnet||0)*1.5;for(const p of FW.pk){const dx=FW.x-p.px,dz=FW.z-p.pz,d=Math.hypot(dx,dz);if(d<R&&d>6){p.px+=dx/d*7;p.pz+=dz/d*7;p.m.position.x=p.px;p.m.position.z=p.pz}}}
  for(const t of FW.tr) if(t.life>0){t.life--;t.m.material.opacity=t.life/5;if(t.life<=0) t.m.visible=false}
  for(const p of FW.pt) if(p.life>0){p.life--;p.vy-=.22;p.m.position.x+=p.vx;p.m.position.y=Math.max(1,p.m.position.y+p.vy);p.m.position.z+=p.vz;if(p.life<=0) p.m.visible=false}
  for(const e of FW.ex) if(e.life>0){e.life--;const k=1-e.life/16;e.m.scale.setScalar(e.r*(.25+.75*k));e.m.material.opacity=.7*(1-k);if(e.life<=0) e.m.visible=false}
  if(FW.air) FW.shk*=.9;
  FW.hurtFl=Math.max(0,FW.hurtFl-.06);FW.hitM=Math.max(0,FW.hitM-1);FW.recoil=Math.max(0,FW.recoil-.14);FW.shk*=.86;FW.swingV=Math.max(0,FW.swingV-.07);
  P.hp=Math.min(P.maxhp,P.hp);
  if(msgT>0) msgT--;
  fwFurnTick(FW.x,FW.z);
  if(NET){fwmPeersTick(dt);if(G) fwmGuestTick(dt);else fwmHostTick(dt)}
  particles.length=0;fx.length=0;decals.length=0;bullets.length=0;crates.length=0;bonuses.length=0;
  if(P.hp<P.maxhp&&FW.near===null&&false) P.hp+=0;
}
function fwSwap(){const P=player;if(P.gun&&P.w===P.melee) P.w=P.gun.w;else P.w=P.melee;P.cd=Math.max(P.cd,150)}
// ---------- rendu ----------
function fwRender(){
  const T=THREE,r=G3.r,t0r=performance.now(),cam=FW.cam,P=player,rr=Math.min(RES,FXF.lights?1.5:1),w=Math.round(W*rr),h=Math.round(H*rr);
  if(FW.rw!==w||FW.rh!==h){FW.rw=w;FW.rh=h;r.setSize(w,h,false)}
  cam.aspect=W/H;
  if(Math.abs(FW.y-FW.yv)>45) FW.yv=FW.y;else FW.yv+=(FW.y-FW.yv)*.3;
  if(FW.scene.fog) FW.scene.fog.density=.00062-.00046*Math.min(1,(FW.y||0)/1800);
  const spc=fwmSpec(),SX=spc?spc.x:FW.x,SZ=spc?spc.z:FW.z,SYW=spc?spc.yaw:FW.yaw,SY=spc?(spc.y||0):FW.yv,SPT=spc?-.12:FW.pitch,TPV=spc?true:FW.tp;
  {const sc=FW.scopeK||0,zoom=1+(FW_ZOOMS[FW.zi]-1)*sc;cam.fov=Math.max(5,(touchOn()?68:76)*(1-.22*FW.adsK*(sc>.5?0:1))/zoom);FW.fovNow=cam.fov;cam.updateProjectionMatrix()}
  const bob=Math.sin(FW.bob)*(SY>0?0:2.1)*(1-FW.crouch*.5),sh=FW.shk>.3?(Math.random()-.5)*FW.shk*.5:0;
  const ey=FW_EYE*(1-.36*FW.crouch)+SY+bob,fx_=-Math.sin(SYW),fz_=-Math.cos(SYW),rx=Math.cos(SYW),rz=-Math.sin(SYW);
  if(!TPV){cam.position.set(SX,ey+sh,SZ);}
  else{const bx=SX-fx_*165+rx*34,bz=SZ-fz_*165+rz*34;cam.position.set(bx,ey+34-SPT*60+sh,bz)}
  cam.rotation.set(SPT,SYW,sh*.01,'YXZ');
  // arme en main
  const vm=FW.vm,vg=vm.userData.g;vm.visible=!TPV&&FW.scopeK<.85&&!FW.air;
  if(vg.userData.w!==P.w){g3Gun({gun:vg},P.w);vg.add(FW.hand);const sc2=fwSkinCol(P.w);if(sc2&&vg.children[0]&&vg.children[0]!==FW.hand) vg.children[0].material=g3Mat(sc2)}
  {let px=11,py=-10,pz=-24,rx_=0,ry_=0,rz_=0;
    const mv=Math.hypot(FW.x-(FW.vx0||FW.x),FW.z-(FW.vz0||FW.z))>.3;FW.vx0=FW.x;FW.vz0=FW.z;
    px+=Math.sin(FW.bob*.5)*(mv?.9:.25);py+=Math.abs(Math.sin(FW.bob))*(mv?1.1:0)+Math.sin(tick*.04)*.25;
    pz+=FW.recoil*5;py-=FW.recoil*1.2;rx_-=FW.recoil*.07;
    if(vg.userData.w!==FW.lastW){FW.lastW=vg.userData.w;FW.swapT=1}FW.swapT=Math.max(0,(FW.swapT||0)-.07);py-=FW.swapT*16;rx_-=FW.swapT*.6;
    const sw=FW.sw;
    if(sw){const p=Math.min(1,sw.t/sw.d),e=p<.42?p/.42:1-(p-.42)/.58,e2=e*e*(3-2*e);
      if(sw.k==='stab'){pz+=p<.2?p*20:-22*Math.sin(Math.min(1,(p-.2)/.35)*Math.PI*.9);px-=3*e}
      else if(sw.k==='chop'){rx_+=(p<.25?-p/.25*1.1:(p<.5?-1.1+(p-.25)/.25*2.6:1.5-(p-.5)/.5*1.5));pz-=4*e;py+=(p<.25?p/.25*8:0)}
      else{rz_=(p<.2?p/.2*1.0:(p<.5?1.0-(p-.2)/.3*2.4:-1.4+(p-.5)/.5*1.4));px+=(p<.5?-(p/.5)*18+8:(-18+8)+(p-.5)/.5*10);ry_=-rz_*.4}
    }
    px*=(1-FW.adsK);py=py*(1-.28*FW.adsK)-1.5*FW.adsK;vm.position.set(px,py,pz);vm.rotation.set(rx_,ry_,rz_);
  }
  // joueur à la troisième personne
  if(!FW.model){FW.look=g3Look();FW.model=FW.look.an?g3Quad(FW.look.an,FW.look.col):g3Human(FW.look);FW.model.userData.an=FW.look.an;FW.scene.add(FW.model)}
  const M=FW.model;M.visible=FW.tp&&!spc;if(!M.userData.can){M.userData.can=fwCanopy();M.add(M.userData.can)}M.userData.can.visible=FW.air===3;M.scale.y=1-.28*FW.crouch;
  if(FW.tp&&M.userData.an){const PP=M.userData.P,mv=Math.hypot(FW.x-(FW.px_||FW.x),FW.z-(FW.pz_||FW.z))>.3;FW.px_=FW.x;FW.pz_=FW.z;M.position.set(FW.x,FW.yv,FW.z);M.rotation.y=FW.yaw+Math.PI/2;const sw=Math.sin(FW.bob)*(mv?1:0),lg=PP.legs;if(lg&&lg.length>3){lg[0].rotation.z=sw*.8;lg[1].rotation.z=-sw*.8;lg[2].rotation.z=-sw*.8;lg[3].rotation.z=sw*.8}}
  else if(FW.tp){
    const PP=M.userData.P,mv=Math.hypot(FW.x-(FW.px_||FW.x),FW.z-(FW.pz_||FW.z))>.3;FW.px_=FW.x;FW.pz_=FW.z;
    M.position.set(FW.x,FW.yv,FW.z);M.rotation.y=FW.yaw+Math.PI/2;
    const sw=Math.sin(FW.bob)*.7*(mv?1:0);PP.legL.rotation.z=sw;PP.legR.rotation.z=-sw;g3Gun(PP,P.w);
    if(M.userData.bulbs){const cols=[0xff3a3a,0xffd23a,0x3ad0ff,0xff6ad8,0x6aff7a];M.userData.bulbs.forEach((b,i)=>b.material.color.setHex(((tick>>3)+i)%3===0?0x222222:cols[(i+(tick>>4))%5]))}
    const wp=WEAPONS[P.w];if(wp.melee){PP.armR.rotation.z=FW.sw?-1.2+Math.min(1,FW.sw.t/FW.sw.d)*2.6:-.3;PP.armL.rotation.z=.2}else{const al=FW.pitch;PP.armR.rotation.z=al;PP.armL.rotation.z=al-.15;PP.armL.rotation.y=.18}
  }
  // lumières proches
  FW.plT--;if(FW.plT<=0){FW.plT=12;const ls=FW.lamps.map(l=>({l,d:(l.x-SX)**2+(l.z-SZ)**2+((l.y||230)-(SY+50))**2})).sort((a,b)=>a.d-b.d);
    for(let i=0;i<FW.pl.length;i++){const q=ls[i];const L=FW.pl[i];if(q&&q.d<900*900){L.position.set(q.l.x,q.l.fire?50:(q.l.y||230),q.l.z);L.color.set(q.l.fire?0xff8a3a:0xffd29a);L.intensity=q.l.fire?1.4:(q.l.int?.95:1.6)}else L.intensity=0}}
  FW.grp.position.set(SX,0,SZ);
  if(FW.sky) FW.sky.position.copy(cam.position);
  if(FW.sun){const q=FW.sunV,tx=Math.round(SX/8)*8,tz=Math.round(SZ/8)*8;FW.sun.castShadow=!!FXF.lights;FW.sun.target.position.set(tx,0,tz);FW.sun.position.set(tx+q[0]*1800,q[1]*1800,tz+q[2]*1800);FW.sun.target.updateMatrixWorld()}
  fwDustTick(SX,SY,SZ);
  // muzzle flash éphémère
  const mf=FW.recoil>.6;FW.fl.intensity=FW.flOn?(mf?3:1.7):0;
  r.render(FW.scene,cam);
  G3.W=0;ctx.drawImage(G3.cv,0,0,W,H);fwPost();
  if(performance.now()-t0r>1200) MP.lastSnapAt=performance.now();          // image très longue à calculer (compilation des shaders…) : ce n'est pas le réseau qui a lâché
}
function fwHud(){
  const brHud=FW.net&&FW.mode!=='coop';
  const P=player,touch=touchOn(),cx=W/2,cy=H/2;
  // flash dégâts / mort proche
  if(FW.hurtFl>0){const g=ctx.createRadialGradient(cx,cy,H*.25,cx,cy,H*.8);g.addColorStop(0,'rgba(160,0,0,0)');g.addColorStop(1,'rgba(180,10,10,'+(.3*FW.hurtFl)+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
  if(P.hp<P.maxhp*.3){const a=.25*(1-P.hp/(P.maxhp*.3))*(.7+.3*Math.sin(tick*.15)),g=ctx.createRadialGradient(cx,cy,H*.3,cx,cy,H*.85);g.addColorStop(0,'rgba(160,0,0,0)');g.addColorStop(1,'rgba(160,10,10,'+a+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
  // viseur
  const wp=WEAPONS[P.w],hot=FW.hitM>0,col=hot?(FW.hitHead?'#ffd45a':'#ff4a3a'):'rgba(255,255,255,.85)',gap=wp.melee?7:5+(wp.spread||0)*60+FW.recoil*7;
  if(FW.scopeK<.85&&!FW.air){const g2=gap*(1-.5*FW.adsK);ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();
  for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){ctx.moveTo(cx+dx*g2,cy+dy*g2);ctx.lineTo(cx+dx*(g2+8),cy+dy*(g2+8))}ctx.stroke();
  ctx.fillStyle=col;ctx.fillRect(cx-1,cy-1,2,2)}
  // mini-carte : plan de la ville (routes, immeubles, voitures) qui tourne avec le regard, le haut = devant toi
  {const rx=W-92,ry=104,rr=74,sc=rr/950;
    ctx.save();ctx.fillStyle='rgba(8,10,14,.85)';ctx.beginPath();ctx.arc(rx,ry,rr,0,7);ctx.fill();ctx.beginPath();ctx.arc(rx,ry,rr,0,7);ctx.clip();
    ctx.translate(rx,ry);ctx.rotate(FW.yaw);ctx.scale(sc,sc);ctx.translate(-FW.x,-FW.z);
    if(FW.mm) ctx.drawImage(FW.mm,-FW_LIM-350,-FW_LIM-350,2*(FW_LIM+350),2*(FW_LIM+350));
    const d=(x,z,c,s2)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,z,s2/sc,0,7);ctx.fill()};
    for(const p of FW.pk) d(p.px,p.pz,p.kind==='bonus'?'#7fe08a':'#ffd45a',3.2);
    for(const z of FW.zs) d(z.px,z.pz,z.boss?'#ff40ff':'#e03a2a',z.boss?4.5:2.6);
    for(const q of FW.peers||[]) if(!q.dead) d(q.x,q.z,FW_TEAMC[(q.team|0)%10]||'#4aa0ff',3.6);
    if(FW.zone&&FW.mode!=='coop'){ctx.strokeStyle='#ff4a3a';ctx.lineWidth=3/sc;ctx.beginPath();ctx.arc(FW.zone.cx,FW.zone.cz,FW.zone.r,0,7);ctx.stroke();if(FW.zone.r1>0&&FW.zone.r1<FW.zone.r-2){ctx.strokeStyle='#ffffff';ctx.setLineDash([10/sc,8/sc]);ctx.beginPath();ctx.arc(FW.zone.cx1,FW.zone.cz1,FW.zone.r1,0,7);ctx.stroke();ctx.setLineDash([])}}
    ctx.restore();ctx.save();ctx.strokeStyle='#6a5a48';ctx.lineWidth=3;ctx.beginPath();ctx.arc(rx,ry,rr,0,7);ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(rx,ry-8);ctx.lineTo(rx-5,ry+5);ctx.lineTo(rx,ry+2);ctx.lineTo(rx+5,ry+5);ctx.fill();
    const na=FW.yaw-Math.PI/2;ctx.fillStyle='#ff6a4a';ctx.font='700 12px '+FONT;ctx.textAlign='center';ctx.fillText('N',rx+Math.cos(na)*(rr-9),ry+Math.sin(na)*(rr-9)+4);ctx.restore();ctx.textAlign='left'}
  // barres de vie au-dessus des zombies
  {const T=THREE,v=new T.Vector3();FW.cam.updateMatrixWorld();
    for(const z of FW.zs){
      if(z.hp<=0) continue;const dx=z.px-FW.x,dz=z.pz-FW.z,d2=dx*dx+dz*dz;if(d2>1500*1500) continue;
      v.set(z.px,(86+14*(z.boss?1:0))*z.size+8,z.pz).project(FW.cam);if(v.z>1||Math.abs(v.x)>1.1||Math.abs(v.y)>1.1) continue;if(!fwLos(z.px,60*z.size,z.pz)) continue;
      const sx=(v.x+1)/2*W,sy=(1-v.y)/2*H,bw=Math.max(26,Math.min(70,2600/Math.sqrt(d2+1)))*(z.boss?1.6:1),f=Math.max(0,z.hp/z.maxhp);
      ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(sx-bw/2-1,sy-1,bw+2,7);ctx.fillStyle=f>.5?'#58b84a':f>.25?'#e0b030':'#d03a2a';ctx.fillRect(sx-bw/2,sy,bw*f,5);
      if(z.boss||d2<420*420){ctx.fillStyle='#e9e1d0';ctx.font='700 11px '+FONT;ctx.textAlign='center';ctx.fillText(z.boss?z.B.n:Math.ceil(z.hp),sx,sy-3);ctx.textAlign='left'}
    }}
  // infos en haut à gauche
  ctx.textAlign='left';ctx.fillStyle='#000a';ctx.fillRect(14,14,200,66);ctx.strokeStyle='#4a3a2e';ctx.strokeRect(14.5,14.5,199,65);
  ctx.fillStyle='#e9e1d0';ctx.font='700 18px '+FONT;ctx.fillText(brHud?'BATTLE ROYALE':tr('Vague').toUpperCase()+' '+wave,26,38);
  ctx.font='500 14px '+FONT;ctx.fillStyle='#d8c27a';ctx.fillText(brHud?'ÉLIMINATIONS : '+(FW.net==='host'?FW.stat.k:kills):'$ '+money+'   ·   '+kills+' '+tr('tués').toUpperCase(),26,58);
  if(brHud){ctx.fillStyle='#8a8178';ctx.fillText(FW.mode==='brt'?'ÉQUIPE '+((FW.myTeam|0)+1):'CHACUN POUR SOI',26,74)}else{const left=FW.queue.length+FW.zs.length;ctx.fillStyle='#8a8178';ctx.fillText(left+' ZOMBIE'+(left>1?'S':'')+' RESTANT'+(left>1?'S':''),26,74)}
  if(FW.scopeK<.85&&!brHud) drawLevelHud();
  // vie
  const bx=24,by=H-54,bw=260;ctx.fillStyle='#000a';ctx.fillRect(bx-6,by-26,bw+12,48);
  ctx.fillStyle='#1a1412';ctx.fillRect(bx,by,bw,16);const f=Math.max(0,P.hp/P.maxhp);ctx.fillStyle=f>.5?'#58b84a':f>.25?'#e0b030':'#d03a2a';ctx.fillRect(bx,by,bw*f,16);ctx.strokeStyle='#5a3a30';ctx.strokeRect(bx+.5,by+.5,bw-1,15);
  ctx.fillStyle='#e9e1d0';ctx.font='700 14px '+FONT;ctx.fillText('VIE  '+Math.ceil(Math.max(0,P.hp))+' / '+P.maxhp,bx,by-8);
  let ox=bx;ctx.font='700 12px '+FONT;for(const k in fxB) if(fxB[k]>0&&BON[k]){ctx.fillStyle=BON[k].c;ctx.fillText(BON[k].n+' '+Math.ceil(fxB[k]/1000)+'s',ox,by+36);ox+=ctx.measureText(BON[k].n+' 99s').width+14}
  // arme
  const g=P.gun,ax=W-24;ctx.textAlign='right';ctx.fillStyle='#000a';ctx.fillRect(ax-250,H-158,262,60);
  ctx.fillStyle='#e9e1d0';ctx.font='700 18px '+FONT;ctx.fillText(tr(wp.name).toUpperCase(),ax,H-132);
  ctx.font='500 15px '+FONT;ctx.fillStyle='#d8c27a';ctx.fillText(wp.melee?'∞':g&&g.time>0?Math.ceil(g.time/1000)+' s':g?g.ammo+' '+tr('munitions').toUpperCase():'',ax,H-110);
  ctx.textAlign='left';
  // boss
  const bz=FW.boss;if(bz&&bz.hp>0){const w2=360,x2=cx-w2/2;ctx.fillStyle='#000a';ctx.fillRect(x2-6,88,w2+12,34);ctx.fillStyle='#1a1412';ctx.fillRect(x2,106,w2,10);ctx.fillStyle='#c0301f';ctx.fillRect(x2,106,w2*Math.max(0,bz.hp/bz.maxhp),10);ctx.textAlign='center';ctx.fillStyle='#e9e1d0';ctx.font='700 14px '+FONT;ctx.fillText(bz.B.n,cx,101);ctx.textAlign='left'}
  // invite caisse
  if(FW.near){ctx.textAlign='center';ctx.fillStyle='#000a';ctx.fillRect(cx-150,cy+70,300,34);ctx.fillStyle='#ffd45a';ctx.font='700 16px '+FONT;const k=KEYS.pick.find(v=>v)||'E';ctx.fillText((touch?'TOUCHE LE BOUTON ◉':k.replace('Key','')+' : RAMASSER')+(FW.near.d.sup?(FW.near.d.sup==='heal'?'  SOIN':'  BOUCLIER'):FW.near.d.w!==undefined&&WEAPONS[FW.near.d.w]?'  '+tr(WEAPONS[FW.near.d.w].name).toUpperCase():''),cx,cy+92);ctx.textAlign='left'}
  // message
  if(msgT>0&&msg){ctx.textAlign='center';ctx.font='700 26px '+FONT;ctx.fillStyle='#000';ctx.fillText(msg,cx+2,152);ctx.fillStyle='#f2e6d0';ctx.fillText(msg,cx,150);ctx.textAlign='left'}
  // aide / verrouillage souris
  const act=FW.lock||touch||FW.gpOn;
  if(!act){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,0,W,H);panel(cx-260,cy-80,520,160,{});ctx.textAlign='center';ctx.fillStyle='#e9e1d0';ctx.font='700 30px '+FONT;ctx.fillText('CLIQUE POUR JOUER',cx,cy-28);
    ctx.font='500 15px '+FONT;ctx.fillStyle='#d8c27a';ctx.fillText('ZQSD / WASD : bouger · Souris : viser · Clic : tirer · Espace : sauter · Maj : courir',cx,cy+6);
    ctx.fillText('E : ramasser · Q : bonus · V : 1ère / 3ème personne · L : lampe · 1/2 ou molette : arme · Échap : pause',cx,cy+30);ctx.fillStyle='#8a8178';ctx.fillText('Le jeu reprend dès que la souris est capturée',cx,cy+58);ctx.textAlign='left'}
  nmHud();fwmHud();
  if(touch) fwTouchHud();
}
const FWB=()=>[{k:'fire',x:W-110,y:H-120,r:52,t:'TIR'},{k:'jump',x:W-215,y:H-70,r:34,t:'SAUT'},{k:'pick',x:W-90,y:H-235,r:34,t:'◉'},{k:'bonus',x:W-200,y:H-165,r:30,t:'Q'},{k:'view',x:W-130,y:60,r:26,t:'V'},{k:'swap',x:W-215,y:H-250,r:28,t:'⇄'},{k:'pause',x:44,y:44,r:24,t:'II'}];
function fwTouchHud(){
  const tc=FW.tc;ctx.save();ctx.globalAlpha=.55;
  for(const b of FWB()){ctx.fillStyle=tc.b[b.k]?'#e2542e':'#2d2723';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fill();ctx.strokeStyle='#d8c27a';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='700 '+(b.r>40?18:14)+'px '+FONT;ctx.fillText(b.t,b.x,b.y+5)}
  if(tc.mv){ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(tc.mv.x0,tc.mv.y0,55,0,7);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(Math.max(tc.mv.x0-55,Math.min(tc.mv.x0+55,tc.mv.x)),Math.max(tc.mv.y0-55,Math.min(tc.mv.y0+55,tc.mv.y)),22,0,7);ctx.fill()}
  ctx.restore();ctx.textAlign='left';
}
const _drawFW=draw;
draw=function(){
  if(FW.on&&(state==='fw'||state==='pause')){
    syncMouse();menuRects=[];
    try{fwRender()}catch(e){console.error(e);fwStop();gameMode='2D';SET.m3=false;saveOpts();flash('3D indisponible');reset(true);return}
    if(state==='fw') fwHud();
    else{fwHud();drawPause();drawCursor()}
    return;
  }
  const r=_drawFW.apply(this,arguments);if(NM.on&&state==='play') nmHud();return r;
};
const _updFW=update;
update=function(dt){
  if(FW.on){if(state==='fw') fwUpdate(dt,false);else if(state==='pause'&&FW.net) fwUpdate(dt,true);return}
  return _updFW.apply(this,arguments);
};
const _closeFW=closePause;
closePause=function(){if(FW.on){state='fw';pauseConfirm=false;mouse.down=false;if(!touchOn()&&!FW.gpOn){try{cv.requestPointerLock()}catch(e){}}FW.lockT=performance.now();return}_closeFW()};
// ---------- entrées ----------
document.addEventListener('pointerlockchange',()=>{
  FW.lock=document.pointerLockElement===cv;if(!FW.lock){FW.lmb=false;FW.adsM=false}
  if(!FW.lock&&FW.on&&state==='fw'&&!touchOn()) openPause();
});
cv.addEventListener('mousedown',e=>{
  if(!FW.on||state!=='fw') return;
  if(!FW.lock&&!touchOn()){try{cv.requestPointerLock()}catch(_){}FW.lockT=performance.now();return}
  if(e.button===0){FW.lmb=true;if(FW.down&&FW.mode!=='coop'&&FW.net) fwmSpecNext()}
  else if(e.button===2) FW.adsM=true;
});
addEventListener('mouseup',e=>{if(e.button===0) FW.lmb=false;else if(e.button===2) FW.adsM=false});
cv.addEventListener('contextmenu',e=>{if(FW.on) e.preventDefault()});
addEventListener('mousemove',e=>{
  if(FW.on&&state==='fw'&&FW.lock&&Math.abs(e.movementX)<500&&Math.abs(e.movementY)<500){const k=Math.max(.15,(FW.fovNow||76)/76);FW.yaw-=e.movementX*FW.sens*k;FW.pitch-=e.movementY*FW.sens*k}
});
addEventListener('wheel',e=>{if(FW.on&&state==='fw'&&FW.lock){if(FW.adsK>.3&&fwScoped(WEAPONS[player.w])){FW.zi=Math.max(0,Math.min(FW_ZOOMS.length-1,FW.zi+(e.deltaY<0?1:-1)))}else if(NM.on) nmCycle((e.deltaY<0?1:-1)*(SET.wheelInv?-1:1));else fwSwap()}},{passive:true});
addEventListener('keydown',e=>{
  if(!FW.on||state!=='fw'||e.repeat) return;
  const c=e.code;
  if(FW.air&&(c==='Space'||KEYS.pick.includes(c))){fwAirKey();return}
  if(c==='Enter'&&FW.pend){fwmBrFinish();return}
  if(c==='Escape'&&!FW.lock){openPause();return}
  if(KEYS.pick.includes(c)) fwPickup();
  else if(KEYS.bonus.includes(c)) fwUseBonus();
  else if(KEYS.pause.includes(c)) openPause();
  else if(c==='KeyV') FW.tp=!FW.tp;
  else if(c==='KeyL') FW.flOn=!FW.flOn;
  else if(c==='Digit1'&&!NM.on){player.w=player.melee}
  else if(c==='Digit2'&&!NM.on){if(player.gun) player.w=player.gun.w}
  else if(c==='Tab'){e.preventDefault();fwSwap()}
});
(function(){
  const pos=t=>{const r=cv.getBoundingClientRect();return [(t.clientX-r.left)*W/r.width,(t.clientY-r.top)*H/r.height]};
  const act=k=>{
    if(k==='pick') fwPickup();else if(k==='bonus') fwUseBonus();else if(k==='view') FW.tp=!FW.tp;else if(k==='swap') fwSwap();else if(k==='pause') openPause();
  };
  const down=e=>{
    if(!FW.on||state!=='fw') return;e.preventDefault();
    for(const t of e.changedTouches){
      const [x,y]=pos(t),tc=FW.tc;let hit=null;
      for(const b of FWB()) if(Math.hypot(x-b.x,y-b.y)<b.r+12){hit=b;break}
      if(hit){tc.b[hit.k]=t.identifier;if(['pick','bonus','view','swap','pause'].includes(hit.k)){act(hit.k);tc.b[hit.k]=0}}
      else if(x<W*.45&&!tc.mv) tc.mv={id:t.identifier,x0:x,y0:y,x,y};
      else if(!tc.lk) tc.lk={id:t.identifier,x,y,px:x,py:y};
    }
  };
  const move=e=>{
    if(!FW.on||state!=='fw') return;e.preventDefault();
    for(const t of e.changedTouches){const [x,y]=pos(t),tc=FW.tc;if(tc.mv&&tc.mv.id===t.identifier){tc.mv.x=x;tc.mv.y=y}if(tc.lk&&tc.lk.id===t.identifier){tc.lk.x=x;tc.lk.y=y}}
  };
  const up=e=>{
    if(!FW.on) return;
    for(const t of e.changedTouches){const tc=FW.tc;if(tc.mv&&tc.mv.id===t.identifier) tc.mv=null;if(tc.lk&&tc.lk.id===t.identifier) tc.lk=null;for(const k in tc.b) if(tc.b[k]===t.identifier) delete tc.b[k]}
  };
  cv.addEventListener('touchstart',down,{passive:false});cv.addEventListener('touchmove',move,{passive:false});cv.addEventListener('touchend',up);cv.addEventListener('touchcancel',up);
})();


