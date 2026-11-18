function update(dt){
  if(MP.on&&MP.role==='guest'){guestUpdate(dt);return}
  if(state!=='play'&&!(MP.on&&!MP.rp&&state==='pause')){paused=false;return}
  if(paused&&!MP.on) return;
  const p=player;
  if(death){updateDeath(dt);return}
  if(cine){updateCine();return}                                        // cinématique du magicien : le jeu est figé
  if(!magWave&&bloodSnow>0) bloodSnow=Math.max(0,bloodSnow-.0015);
  updateBonus(dt);updateEnts(dt);updateXmas(dt);
  // déplacement
  const fro=player.dead||(MP.on&&state==='pause');
  let mv=fro?0:(kd('right')?1:0)-(kd('left')?1:0);
  if(autoTarget){if(mv!==0||!crates.includes(autoTarget)) autoTarget=null;else{const dx=autoTarget.x-p.x;if(Math.abs(dx)<14) takeCrate(autoTarget);else mv=dx>0?1:-1}}
  p.x+=mv*4; p.x=Math.max(80,Math.min(WORLD_W-80,p.x));
  if(mv) p.step+=0.25*Math.abs(mv);
  if(!fro&&kd('jump') && p.y>=GROUND) p.vy=-13;
  p.vy+=GRAV; p.y+=p.vy; if(p.y>GROUND){p.y=GROUND;p.vy=0}
  updateCam(false);
  if(aimDir()){ if(mv) p.dir=mv>0?1:-1; p.face=p.dir||1 }          // visée « direction » : on tire dans le sens du déplacement
  else p.face=mouse.x+camX>=p.x?1:-1;
  // tir
  p.cd-=dt; p.hurtCd-=dt; p.swing-=dt; p.muz0-=dt; p.muz1-=dt;
  const wp=WEAPONS[p.w];
  const firing=!fro&&(mouse.down||kd('fire'));
  if(firing && p.cd<=0 && (wp.auto || !p.held)){ if(wp.melee) slash(); else {shoot();useAmmo()} }
  updateCrates(dt,p);
  p.held=firing;
  if(MP.on) for(const g of MP.guests) guestStep(g,dt);
  // apparition
  spawnTimer-=1;
  if(spawnQueue.length && spawnTimer<=0 && !(spawnQueue.length===1&&(spawnQueue[0]==='digger'||spawnQueue[0]==='boss')&&zombies.length>0)){   // le fouisseur attend que tous les autres soient morts
    spawnZombie(spawnQueue.pop());
    spawnTimer=Math.max(25,80-wave*4);
  }
  // balles
  for(const b of bullets){
    const ox=b.ox!==undefined?b.ox:b.x,oy=b.ox!==undefined?b.oy:b.y;b.ox=undefined;     // départ du segment : la balle est testée sur tout son trajet, pas seulement à l'arrivée
    b.x+=b.vx;b.y+=b.vy;b.life--;b.dist+=b.sp||0;
    for(const z of zombies){
      if(b.hit.has(z)||z.hp<=0||z.emerge>0||z.inv) continue;
      const zh=z.hh||83*z.size,zw=z.hw||15*z.size;                 // boîte de touche = silhouette complète, haut de la tête compris
      const fw=z.hw?zw:zw*1.9,bk=z.hw?zw:zw*1.15,dd=z.dir>=0?1:-1;           // bras tendus devant : la boîte s'étend vers l'avant
      if(segBox(ox,oy,b.x,b.y,z.x-(dd>0?bk:fw),z.y-zh,z.x+(dd>0?fw:bk),z.y)){
        if(b.aoe){explode(b.x,b.y,b.aoe,b.dmg);b.life=0;break}
        z.hp-=b.fall?b.dmg*Math.max(.3,1-.7*b.dist/b.range):b.dmg; b.hit.add(z); b.pierce--; burst(b.x,b.y,'#a22',5);sfx('bhit');
        z.x+=Math.sign(b.vx)*3;
        if(b.pierce<=0){b.life=0;break}
      }
    }
  }
  for(const b of bullets) if(b.aoe&&b.life>0&&b.y>GROUND){explode(b.x,GROUND,b.aoe,b.dmg);b.life=0}
  pack(bullets,b=>b.life>0&&b.x>-50&&b.x<WORLD_W+50&&b.y<GROUND+30);
  // zombies
  const decoyE=ents.find(e=>e.k==='decoy'),TG=targets();
  for(const z of zombies){
    const T=nearestT(TG,z.x),p=T.p;
    if(z.mag){if(z.ph==='cine') continue;let mr=false;asT(T,()=>{mr=updateMagician(z,p)});if(mr) continue}
    if(z.emerge>0){                                              // sort du sol : intouchable et inoffensif pendant ce temps
      z.emerge--;z.dir=p.x>z.x?1:-1;
      if(z.emerge%4===0) particles.push({x:z.x+(Math.random()-.5)*50,y:GROUND-2,vx:(Math.random()-.5)*3,vy:-2-Math.random()*3,life:26,col:'#6b5a48'});
      if(z.emerge===EMERGE_T-60){sfx('boom')}
      continue;
    }
    if(z.hp<=0){onKill(z);continue}
    const tgt=(decoyE&&!z.boss&&Math.abs(z.x-decoyE.x)<1100)?decoyE.x:p.x;
    z.dir=tgt>z.x?1:-1;
    if(!z.boss&&smokeAt(z)){if(z.wd===undefined||tick%80===0) z.wd=rnd()<.5?1:-1;z.dir=z.wd}
    if(z.fall!==undefined){z.fall+=GRAV*.55;z.y+=z.fall;if(z.y>=GROUND){z.y=GROUND;z.fall=undefined;burst(z.x,GROUND-4,'#e8eef8',8);sfx('bhit')}else continue}
    let sp2=1;
    if(z.boss){
      const id=z.boss.id;
      if(id==='brute'){z.cdash=(z.cdash===undefined?300:z.cdash)-1;if(z.cdash<=0){z.dashT=55;z.cdash=420;sfx('groan');if(SET.shake) shake=Math.max(shake,6)}if(z.dashT>0){z.dashT--;sp2=4.2}}
      else if(id==='spitter'){z.acd=(z.acd===undefined?100:z.acd)-1;if(z.acd<=0&&Math.abs(p.x-z.x)<760){z.acd=130;const t=55,g=.22,x0=z.x+z.dir*24,y0=z.y-70*z.size*.8;acid.push({x:x0,y:y0,vx:Math.max(-10,Math.min(10,(p.x-x0)/t)),vy:((GROUND-30-y0)-.5*g*t*t)/t,dmg:Math.round(z.dmg*.7)});sfx('bhit')}}
      else if(id==='summoner'){z.scd=(z.scd===undefined?200:z.scd)-1;if(z.scd<=0&&zombies.length<16){z.scd=520;for(let k=0;k<3;k++) spawnZombie(Math.random()<.3?'fast':'normal',z.x+(Math.random()-.5)*140);burst(z.x,z.y-30,'#a060ff',16);sfx('boom')}}
    }
    const fz=frzM()*zSlow(z),rush=z.boss?1:Math.abs(z.x-p.x)>W*.7?2.4:1;
    const blk=z.stun>0?(z.stun--,'stun'):zBlock(z,tgt);
    if(blk==='stun') z.step+=.03;
    else if(blk){blk.hp-=z.dmg*(z.boss?.12:.05);if(!blk.hit){blk.hit=8;burst(blk.x-z.dir*8,GROUND-30,blk.ice?'#cfefff':blk.k==='ted'?'#d98aa0':'#9a7440',2)}z.step+=.1}
    else if(decoyE&&tgt===decoyE.x&&Math.abs(z.x-tgt)<30) z.step+=.04;
    else{z.x+=z.dir*z.speed*fz*rush*sp2; z.step+=0.15*z.speed*fz}
    if(Math.abs(z.x-p.x)<18*z.size && p.y>GROUND-60 && p.hurtCd<=0 && !smokeAt(p)) asT(T,()=>{
      if(fxB.shield>0){p.hurtCd=300;burst(p.x+20*z.dir,p.y-40,'#7ab8ff',8);sfx('click')}
      else{p.hp-=z.dmg; p.hurtCd=500;sfx('hurt'); if(SET.shake&&!T.g) shake=8; burst(p.x,p.y-40,'#d33',10);
      if(p.hp<=0){p.hp=0;endRun()}}
    });
  }
  for(const a of acid){a.vy+=.22;a.x+=a.vx;a.y+=a.vy;
    const TA=TG.find(t=>Math.hypot(a.x-t.p.x,a.y-(t.p.y-35))<24&&t.p.hurtCd<=0);
    if(TA){a.dead=true;burst(a.x,a.y,a.bc||'#7ab04a',10);asT(TA,()=>{const p=player;if(fxB.shield>0){p.hurtCd=300;sfx('click')}else{p.hp-=a.dmg;p.hurtCd=450;sfx('hurt');if(SET.shake&&!TA.g) shake=6;if(p.hp<=0){p.hp=0;endRun()}}})}
    else if(a.y>=GROUND-6){a.dead=true;burst(a.x,GROUND-4,a.bc||'#7ab04a',8);if(decals.length<150) decals.push({x:a.x,y:GROUND+10,r:5,life:700})}}
  pack(acid,a=>!a.dead);
  pack(zombies,z=>z.hp>0);
  if(MP.pendingOver){MP.pendingOver=false;mpGameOver();finishRun();return}
  // fin de vague
  if(state==='play' && !spawnQueue.length && !zombies.length){
    if(waveBreak===0){waveBreak=150;gainChar(5);let g5=0;if(!training){g5=addMoney(5,'wave');addXp(5,'wave')}sfx('wave');flashG(tr('Vague')+' '+wave+' '+tr('terminée')+(training?'':'  ·  +'+(Math.round(g5*10)/10)+' $  +'+(Math.round(g5*10)/10)+' XP'))}
    else if(--waveBreak===0) startWave();
  }
  for(const q of particles){
    q.x+=q.vx;q.y+=q.vy;q.vy+=q.g===undefined?.3:q.g;q.life--;
    if(q.shell&&q.y>GROUND+4&&q.vy>0){q.y=GROUND+4;q.vy*=-.35;q.vx*=.6;q.rot+=.6;if(Math.abs(q.vy)<.9){q.vy=0;q.g=0;q.vx=0}}
    else if(q.blood&&q.y>GROUND+4){if(SET.gore&&decals.length<230) decals.push({x:q.x,y:GROUND+6+Math.random()*26,r:1.5+Math.random()*3.2,life:1100});q.life=0}
    if(q.shell) q.rot+=q.vx*.1;
    if(q.gib){q.rot+=q.vr;if(q.y>GROUND+4&&q.vy>0){q.y=GROUND+4;q.vy*=-.32;q.vx*=.65;q.vr*=.5;if(!q.hit){q.hit=1;if(decals.length<230) decals.push({x:q.x,y:GROUND+8+Math.random()*16,r:3+Math.random()*3,life:1300})}if(Math.abs(q.vy)<.8){q.vy=0;q.g=0;q.vx=0;q.vr=0}}}
  }
  for(const d of decals) d.life--;pack(decals,d=>d.life>0);
  pack(particles,q=>q.life>0);if(particles.length>FXF.pmax) particles.splice(0,particles.length-FXF.pmax);
  for(const f of fx) f.life--; pack(fx,f=>f.life>0);
  if(msgT>0) msgT--;
  comboT-=dt; if(comboT<=0) combo=0;
}
function onKill(z){
  spawnGibs(z);
  if(z.mag){
    magWave=false;cine=null;
    if(!training){save.mapClear[curMap.id]=true;persist()}
    const nx=MAPS[MAPS.indexOf(curMap)+1];
    setTimeout(()=>{if(state==='play') flashG(nx&&!training?'CARTE DÉBLOQUÉE : '+nx.name+' !':'MAGICIEN VAINCU !')},150);
    for(const col of['#a060ff','#b3141c','#ffd45a']) burst(z.x,z.y-100,col,20);
  }
  if(z.boss){
    flashG('BOSS VAINCU !');sfx('wave');if(SET.shake) shake=Math.max(shake,12);
    if(!training){addMoney(40+wave*8,'bonus');addXp(30+wave*5,'bonus')}
    const g={x:z.x,y:z.y-90,vy:0,landed:false,age:0,ph:rnd()*6,w:0,ammo:0,time:0,gc:4};makeRareGift(g);crates.push(g);   // le boss lâche un cadeau rare
    for(const col of['#ffd45a','#e2542e','#a060ff']) burst(z.x,z.y-60,col,16);
  }
  kills++; gainChar(1);if(fxB.adren>0) player.hp=Math.min(player.maxhp,player.hp+1+(fxL.adren||0)); if(!training){addMoney(1);addXp(1)}sfx('zdie');
  burst(z.x,z.y-30,SET.blood?'#8e1b1b':z.color,SET.blood?20:10);
}

// --- Rendu ---
// --- Style cartoon : décor et personnages dessinés en code ---
function limb(x1,y1,x2,y2,w,col){
  ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
}
function rrect(x,y,w,h,r,fill){
  ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
}
const BUILDINGS=[];
function applyMap(){                                       // prépare la carte et la difficulté choisies
  curMap=MAPS.find(m=>m.id===save.sel.map)||MAPS[0];if(!NM.on&&!mapUnlocked(curMap)){curMap=MAPS[0];save.sel.map=curMap.id}
  curDiff=training?DIFFS[1]:(DIFFS.find(d=>d.id===save.sel.diff)||DIFFS[1]);if(!diffUnlocked(curMap,curDiff)) curDiff=DIFFS[1];if(NM.on){nmScale(1);curDiff=NM.diff}
  WORLD_W=MP.rp?W:curMap.world;PAL=curMap.pal;
  BUILDINGS.length=0;const N=Math.ceil(WORLD_W/75)+12;
  for(let i=0;i<N;i++) BUILDINGS.push({x:i*75-10,w:60+(i*29%30),h:90+(i*53%130),far:i%2===0});
  FIRES.length=0;for(let i=9;i<N;i+=14) FIRES.push(i);
  for(const a of [WRECKS,LAMPS,BARRELS,STACKS]) a.length=0;
  for(let x=600,i=0;x<WORLD_W-300;x+=800+(i*173%300),i++) WRECKS.push([x,i%2]);
  if(curMap.id!=='desert') for(let x=300,i=0;x<WORLD_W-200;x+=720+(i*131%200),i++) LAMPS.push(x);
  for(let x=950,i=0;x<WORLD_W-200;x+=880+(i*97%260),i++) BARRELS.push(x);
  for(let x=850,i=0;x<WORLD_W-200;x+=810+(i*211%300),i++) STACKS.push(x);
  if(MP.rp){LAMPS.push(W*.16);BARRELS.push(W*.84);STACKS.push(W*.5)}                // remote play : une seule arène, la carte ne défile pas
  camX=Math.max(0,Math.min(WORLD_W-W,camX));
}
function flame(cx,cy,sc){
  const f=1+.18*Math.sin(tick*.35+cx);
  const gl=ctx.createRadialGradient(cx,cy,2,cx,cy,70*sc*f);gl.addColorStop(0,'rgba(255,150,50,.45)');gl.addColorStop(1,'rgba(255,100,20,0)');
  ctx.fillStyle=gl;ctx.fillRect(cx-80*sc,cy-80*sc,160*sc,160*sc);
  for(const [dx,h,c] of[[-6,22,'#e2541e'],[0,32,'#f08a2a'],[6,20,'#e2541e'],[0,18,'#ffd45a']]){
    ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(cx+dx*sc-6*sc,cy);ctx.quadraticCurveTo(cx+dx*sc,cy-h*sc*f,cx+dx*sc+6*sc,cy);ctx.fill();
  }
}
const FIRES=[];
function wreck(x,fl){
  ctx.save();ctx.translate(x-610,0);
  ctx.fillStyle='#120e10';ctx.beginPath();ctx.moveTo(610,GROUND);ctx.lineTo(610,GROUND-16);ctx.lineTo(626,GROUND-18);ctx.lineTo(640,GROUND-34);ctx.lineTo(676,GROUND-34);ctx.lineTo(692,GROUND-18);ctx.lineTo(716,GROUND-16);ctx.lineTo(716,GROUND);ctx.closePath();ctx.fill();
  ctx.fillStyle='#000';ctx.beginPath();ctx.arc(634,GROUND,9,0,7);ctx.arc(694,GROUND,9,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.05)';ctx.fillRect(648,GROUND-31,22,10);
  if(fl) flame(662,GROUND-34,.6);
  ctx.restore();
}
function lamp(x){
  ctx.fillStyle='#1d1a21';ctx.fillRect(x-2,GROUND-120,4,120);ctx.fillRect(x-2,GROUND-120,26,4);
  const f=.55+.25*Math.sin(tick*.2+x);ctx.fillStyle='rgba(255,200,110,'+f+')';ctx.fillRect(x+16,GROUND-116,12,5);
  const g=ctx.createRadialGradient(x+22,GROUND-110,2,x+22,GROUND-110,60);g.addColorStop(0,'rgba(255,190,100,'+(.28*f)+')');g.addColorStop(1,'rgba(255,190,100,0)');ctx.fillStyle=g;ctx.fillRect(x-40,GROUND-170,124,124);
}
function barrel(x){
  ctx.fillStyle='#3a2a22';ctx.fillRect(x-9,GROUND-26,18,26);ctx.fillStyle='#1d1612';ctx.fillRect(x-9,GROUND-18,18,3);ctx.fillRect(x-9,GROUND-8,18,3);
  flame(x,GROUND-26,.5);
}
function crateStack(x){
  ctx.fillStyle='#2a2118';ctx.fillRect(x-22,GROUND-24,44,24);ctx.fillRect(x-12,GROUND-46,30,22);
  ctx.strokeStyle='#120e0a';ctx.lineWidth=2;ctx.strokeRect(x-22,GROUND-24,44,24);ctx.strokeRect(x-12,GROUND-46,30,22);
}
const WRECKS=[],LAMPS=[],BARRELS=[],STACKS=[];
