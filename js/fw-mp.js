// ===== V0.63 : MULTIJOUEUR 3D — COOP (vagues) et BATTLE ROYALE (chacun pour soi ou par équipes, jusqu'à 10 joueurs) =====
// L'hôte fait autorité (zombies, dégâts, zone, butin) ; les invités envoient leur position, leurs tirs et leurs demandes de ramassage.
const BRF={on:false};
Object.assign(FW,{net:'',mode:'coop',peers:[],pmap:new Map(),zmap:new Map(),pkmap:new Map(),enmap:new Map(),evq:[],zid:0,pkid:0,enid:0,zone:null,down:false,myTeam:0,feed:[],place:0,snT:0,posT:0,zoneM:null,over:false,nteams:0,stat:{k:0},seq:0});
const FW_TEAMC=['#ff4a4a','#4aa0ff','#4ad06a','#ffd23a','#c060ff','#ff8a2a','#40e0d0','#ff6ad8','#a0a0a0','#ffffff'];
function fwmEv(a){if(FW.net==='host'&&FW.evq.length<90) FW.evq.push(a)}
function fwmPlayers(){                                                    // tous les joueurs (hôte + invités) vus par l'hôte
  const hp0=MP.hostP||player,a=[{id:0,x:FW.x,z:FW.z,y:FW.y,air:FW.air|0,c:FW.crouch>.5?1:0,g:null,p:hp0,dead:!!(FW.down||hp0.dead),   // joueur de l'hôte : toujours SON objet, même quand le code tourne « en tant qu'invité » (runAs)
    team:FW.myTeam,name:cleanName(mpName()),k:FW.stat.k,place:FW.place}];
  for(const g of MP.guests) if(g.p&&g.f3) a.push({id:g.id,x:g.f3.x,z:g.f3.z,y:g.f3.y||0,air:g.f3.air|0,c:g.f3.c|0,g,p:g.p,dead:!!g.p.dead,team:g.f3.team||0,name:g.name,k:g.f3.k|0,place:g.f3.place|0});
  return a;
}
function fwmNearest(x,z){
  let best=null,bd=1e18;
  for(const q of fwmPlayers()){if(q.dead) continue;const d=(q.x-x)**2+(q.z-z)**2;if(d<bd){bd=d;best=q}}
  return best||{x:FW.x,z:FW.z,y:FW.y,g:null,p:player,dead:true};
}
function fwmHurtG(g,dmg){
  const p=g.p;if(!p||p.dead||g.fxb.shield>0) return;
  p.hp-=dmg;p.hurt=1;
  if(p.hp<=0){p.hp=0;p.dead=true;if(FW.mode==='coop') fwmCoopCheck()}
}
function fwmCoopCheck(){if(fwmPlayers().every(q=>q.dead)) fwmCoopOver()}
function fwmCoopOver(){if(FW.over) return;FW.over=true;mpGameOver();fwStop();finishRun()}
// ---------- démarrage ----------
function fwmFreeNear(x,z){
  for(let t=0;t<40;t++){const px=Math.max(-FW_LIM+60,Math.min(FW_LIM-60,x+(Math.random()-.5)*(80+t*14))),pz=Math.max(-FW_LIM+60,Math.min(FW_LIM-60,z+(Math.random()-.5)*(80+t*14)));
    if(!fwSolid(px,pz,20)&&!fwSolid(px+22,pz,20)&&!fwSolid(px-22,pz,20)&&!fwSolid(px,pz+22,20)&&!fwSolid(px,pz-22,20)) return [px,pz]}
  return [FW_P/2,FW_P/2];
}
function fwmHostStart(){
  const mode=MP.sel.mode||'coop',m=MAPS.find(x=>x.id===MP.sel.map)||MAPS[0],d=DIFFS.find(x=>x.id===MP.sel.diff)||DIFFS[1];
  if(mode==='coop'&&MP.guests.length>3){MP.msg='Coop 3D : 4 joueurs maximum';return}
  MP.gid=genCode()+genCode()+Date.now().toString(36);MP.started=true;MP.on=true;MP.msg='';
  training=false;mapTrain=false;NM.on=mode==='coop'&&!!MP.sel.nm;NM.bonus=true;BRF.on=mode!=='coop';curMap=m;curDiff=d;applyMap();
  for(const g of MP.guests) mpMakeGuest(g);
  reset(false);MP.hostP=player;
  const n=MP.guests.length+1;
  const teamOf=i=>mode==='brt'?i%Math.max(2,Math.ceil(n/2)):(mode==='br'?i:0);
  MP.pinfo={};FW.myTeam=teamOf(0);MP.guests.forEach((g,i)=>{g.f3={x:0,z:0,y:0,yaw:0,pitch:0,w:g.p.w,t:performance.now(),team:teamOf(i+1),k:0,place:0,px:0,pz:0,viol:0}});
  fwStart({net:'host',mode,seed:MP.preSeed||0});
  MP.pinfo[0]={n:cleanName(mpName()),look:sanitizeLook(save.look),team:FW.myTeam};for(const g of MP.guests) MP.pinfo[g.id]={n:g.name,look:sanitizeLook(g.look),team:g.f3.team};
  const info=[{id:0,n:cleanName(mpName()),look:save.look,team:FW.myTeam}].concat(MP.guests.map(g=>({id:g.id,n:g.name,look:g.look,team:g.f3.team})));
  for(const g of MP.guests){const sp=mode==='coop'?[FW.x+(g.id%2?1:-1)*60,FW.z+40*g.id]:fwmSpawnFor(g.id,n);g.f3.x=g.f3.px=sp[0];g.f3.z=g.f3.pz=sp[1];
    try{g.conn.send({t:'go3',mode,map:m.id,diff:d.id,gid:MP.gid,id:g.id,pl:info,team:g.f3.team,spawn:sp,nm:NM.on?1:0,seed:FW.worldSeed})}catch(e){}}
  MP.preSeed=0;                                                        // la prochaine partie aura une nouvelle ville
}
function fwmSpawnFor(id,n){const a=(id/n)*6.283+.4,p=fwmFreeNear(Math.cos(a)*1800,Math.sin(a)*1800);return p}
function fwmGuestGo(d){
  if(G3.status!=='ready'){mpLeaveToMenu('3D indisponible (Three.js non chargé) : impossible de rejoindre');return}
  gameMode='3D';SET.m3=true;training=false;mapTrain=false;NM.on=!!d.nm;NM.bonus=true;BRF.on=d.mode!=='coop';
  MP.gid=String(d.gid||'');MP.myId=d.id|0;MP.on=true;MP.started=true;MP.cp=null;MP.pinfo={};
  if(Array.isArray(d.pl)) for(const p of d.pl) MP.pinfo[p.id]={n:cleanName(p.n),look:sanitizeLook(p.look),team:p.team|0};
  curMap=MAPS.find(x=>x.id===d.map)||MAPS[0];curDiff=DIFFS.find(x=>x.id===d.diff)||DIFFS[1];applyMap();
  reset(false);
  fwStart({net:'guest',mode:d.mode==='br'||d.mode==='brt'?d.mode:'coop',team:d.team|0,spawn:Array.isArray(d.spawn)?d.spawn:null,seed:d.seed|0});
}
function fwmInitMode(o){                                                  // appelé par fwStart
  FW.gnd=true;FW.yv=0;FW.crouch=0;FW.ads=false;FW.adsK=0;FW.lmb=false;FW.adsM=false;FW.scopeK=0;FW.pend=null;FW.tDrop=0;
  FW.net=o&&o.net||'';FW.mode=o&&o.mode||'coop';FW.over=false;FW.down=false;FW.place=0;FW.stat={k:0};FW.feed=[];FW.evq=[];FW.zone=null;FW.myTeam=(o&&o.team)|0;
  for(const q of FW.peers) if(q.mesh) FW.scene.remove(q.mesh);FW.peers=[];FW.pmap.clear();
  for(const z of FW.zmap.values()) FW.scene.remove(z.mesh);FW.zmap.clear();for(const p of FW.pkmap.values()) FW.scene.remove(p.m);FW.pkmap.clear();for(const e of FW.enmap.values()) FW.scene.remove(e.m);FW.enmap.clear();
  if(FW.zoneM) FW.zoneM.visible=false;
  if(FW.net==='guest'&&o.spawn){FW.x=o.spawn[0];FW.z=o.spawn[1]}
  if(FW.net&&FW.mode!=='coop'){
    if(!FW.zoneM){const T=THREE;FW.zoneM=new T.Mesh(new T.CylinderGeometry(1,1,6000,64,1,true),new T.MeshBasicMaterial({color:0xff3a2a,transparent:true,opacity:.18,side:T.DoubleSide,depthWrite:false,fog:false}));FW.zoneM.position.y=3000;FW.scene.add(FW.zoneM)}
    player.maxhp=player.hp=100;player.w=player.melee=mainMelee(-1);player.gun=null;
    FW.air=1;FW.tDrop=0;FW.vy=0;FW.vxA=0;FW.vzA=0;FW.path=fwPath();FW.spec=-1;FW.pend=null;
    if(!FW.planeM){FW.planeM=fwPlaneMesh(FW.path.type);FW.scene.add(FW.planeM)}
  }else{FW.air=0;if(FW.planeM) FW.planeM.visible=false}
  if(FW.net==='host'&&FW.mode!=='coop'){
    {const Ri=FW_LIM*1.8;FW.zone={cx:0,cz:0,r:Ri,r0:Ri,r1:Ri,cx0:0,cz0:0,cx1:0,cz1:0,phase:0,t:0,st:'shrink'};fwmZoneNext(FW.zone)}   // départ : cercle plus grand que la carte, il se referme déjà pendant le vol
    for(const g of MP.guests){g.p.maxhp=g.p.hp=100;g.p.w=g.p.melee=mainMelee(-1);g.p.gun=null}
    fwmBrLoot();flashG(FW.mode==='brt'?'BATTLE ROYALE · ÉQUIPES':'BATTLE ROYALE · CHACUN POUR SOI');
  }
}
