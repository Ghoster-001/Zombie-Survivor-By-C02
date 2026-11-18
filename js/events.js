// ===== Événements de fêtes : le traîneau du Père / de la Mère Noël (cadeaux) ou du Père / de la Mère Fouettard(e) (zombies de Noël) =====
let xmasT=0,sleighs=[],goodStreak=0;
function xmasReset(){xmasT=25000+rnd()*20000;sleighs=[];goodStreak=0}
let mgT=0,meT=0,magWave=false,cine=null,bloodSnow=0;
const MAGE={n:'LE MAGICIEN SANGLANT',hp:3000};
const lowPool=()=>WEAPONS.map((w,i)=>i).filter(i=>!WEAPONS[i].melee&&WEAPONS[i].lvl<=10);   // armes de bas niveau (le boss reste dur)
function startMagicianWave(){
  magWave=true;
  const hpMul=(1+0.18*(wave-1))*curDiff.hp*curMap.hp*mpMul(),dmgMul=(1+0.10*(wave-1))*curDiff.dmg;
  const z={type:'boss',boss:{id:'magician',n:MAGE.n},mag:true,inv:true,ph:'cine',x:-60,y:GROUND,hp:MAGE.hp*hpMul,maxhp:MAGE.hp*hpMul,speed:.75*curDiff.sp,size:1.7,hh:165,hw:40,dmg:Math.round(22*dmgMul),color:'#d8d0c8',coins:300,step:0,dir:1,arm:0,pt:0,gseed:.9};
  zombies.push(z);cine={t:0,z};sleighs=[];bloodSnow=0;
  flashG('MANCHE FINALE');sfx('boom');
}
function updateCine(){
  const c=cine,z=c.z,t=++c.t;
  if(t>40&&!c.skip&&(kd('jump')||kd('fire')||mouse.down||keys.Enter)){c.skip=true;c.t=Math.max(c.t,378);z.x=WORLD_W-330;z.dir=-1;z.ph='under';z.arm=0;bloodSnow=1}   // passer la cinématique
  const T=c.t;
  if(T<=100){camX+=(0-camX)*.08;z.x=Math.min(330,z.x+3.4);z.step+=.2;z.dir=1}
  else if(T<=230){camX+=(0-camX)*.08;z.arm=Math.min(1,(T-100)/30);bloodSnow=(T-100)/130;if(T===110) sfx('evilbells');if(SET.shake) shake=Math.max(shake,1.5+3*bloodSnow);if(T%3===0) particles.push({x:z.x+38,y:GROUND-215,vx:(Math.random()-.5)*2,vy:Math.random()*1.5,g:.02,life:40,ml:40,col:'#ff3030',sz:2,glow:true})}
  else if(T<=260){camX+=(0-camX)*.08;z.arm=Math.max(0,1-(T-230)/20);z.x+=1.3;z.step+=.15}
  else if(T<=320){z.ph='sink';z.pt=Math.max(0,50-(T-260)*50/60);if(T%4===0) particles.push({x:z.x+(Math.random()-.5)*60,y:GROUND-2,vx:(Math.random()-.5)*3,vy:-2-Math.random()*3,life:30,ml:30,col:'#b3141c',sz:2.4,blood:false});camX+=(WORLD_W-W-camX)*.05*(T>290?1:0)}
  else if(T<=380){if(z.ph!=='under'){z.ph='under';z.x=WORLD_W-330;z.dir=-1;sfx('boom')}camX+=(WORLD_W-W-camX)*.07;if(T%5===0) particles.push({x:z.x+(Math.random()-.5)*50,y:GROUND-2,vx:(Math.random()-.5)*2,vy:-2,life:30,ml:30,col:'#b3141c',sz:2.2})}
  else if(T<=430){camX+=(WORLD_W-W-camX)*.07;if(z.ph!=='rise'){z.ph='rise';sfx('groan');if(SET.shake) shake=Math.max(shake,8)}z.pt=Math.max(0,(430-T));}
  else{z.ph='walk';z.inv=false;z.pt=0;z.tp=500;z.acd=120;cine=null;mgT=7000;meT=12000;flashG(MAGE.n);sfx('boom')}
  camX=Math.max(0,Math.min(WORLD_W-W,camX));
  for(const q of particles){q.x+=q.vx;q.y+=q.vy;q.vy+=q.g===undefined?.3:q.g;q.life--}pack(particles,q=>q.life>0);
}
function updateMagician(z,p){
  if(z.hp<=0) return false;
  z.step+=.08;
  if(z.ph==='walk'){
    z.dir=p.x>z.x?1:-1;const dx=Math.abs(p.x-z.x);if(dx>220) z.x+=z.dir*z.speed;
    z.acd=(z.acd===undefined?120:z.acd)-1;
    if(z.acd<=0){z.acd=170;const x0=z.x+z.dir*34,y0=z.y-130,t=48,g=.22;for(let k=-1;k<=1;k++){const tx=p.x+k*70;acid.push({x:x0,y:y0,vx:Math.max(-11,Math.min(11,(tx-x0)/t)),vy:((GROUND-35-y0)-.5*g*t*t)/t,dmg:Math.round(z.dmg*.55),c:'#c01822',g:'255,40,50',bc:'#d33'})}sfx('boom')}
    if(dx<44&&p.y>GROUND-70&&p.hurtCd<=0){if(fxB.shield>0){p.hurtCd=300;sfx('click')}else{p.hp-=z.dmg;p.hurtCd=500;sfx('hurt');if(SET.shake) shake=8;if(p.hp<=0){p.hp=0;endRun()}}}
    z.tp=(z.tp===undefined?500:z.tp)-1;if(z.tp<=0){z.ph='sink';z.inv=true;z.pt=50;sfx('groan')}
  } else if(z.ph==='sink'){z.pt--;if(z.pt%4===0) particles.push({x:z.x+(Math.random()-.5)*60,y:GROUND-2,vx:(Math.random()-.5)*3,vy:-2-Math.random()*3,life:30,ml:30,col:'#b3141c',sz:2.4});
    if(z.pt<=0){z.ph='under';z.pt=45;const side=Math.random()<.5?-1:1;let x=p.x+side*(320+Math.random()*220);if(x<150||x>WORLD_W-150) x=p.x-side*(320+Math.random()*220);z.x=Math.max(150,Math.min(WORLD_W-150,x))}}
  else if(z.ph==='under'){z.pt--;if(z.pt%5===0) particles.push({x:z.x+(Math.random()-.5)*50,y:GROUND-2,vx:(Math.random()-.5)*2,vy:-2,life:30,ml:30,col:'#b3141c',sz:2.2});if(z.pt<=0){z.ph='rise';z.pt=50;z.dir=p.x>z.x?1:-1}}
  else if(z.ph==='rise'){z.pt--;if(z.pt<=0){z.ph='walk';z.inv=false;z.tp=560+Math.random()*300}}
  return true;
}
function launchSleigh(force){
  const evil=force?force==='evil':(rnd()<.45||goodStreak>=2),fem=rnd()<.5,dir=rnd()<.5?1:-1;
  if(!force) goodStreak=evil?0:goodStreak+1;                          // un passage maléfique au moins tous les 3
  const kind=SET.fete?'sleigh':(evil?'dino':'plane');
  sleighs.push({kind,x:dir>0?camX-380:camX+W+380,y:96+rnd()*34,dir,evil,fem,drops:evil?(magWave?6:Math.min(7,2+Math.floor(wave/2))):3,dropT:30,spd:kind==='plane'?4.6:kind==='dino'?3.1:3.6});
  flashG(kind==='sleigh'?(evil?(fem?'LA MÈRE FOUETTARDE LÂCHE DES ZOMBIES !':'LE PÈRE FOUETTARD LÂCHE DES ZOMBIES !'):(fem?'LA MÈRE NOËL SURVOLE LA MAP !':'LE PÈRE NOËL SURVOLE LA MAP !')):(evil?'DINOSAURE ZOMBIE : LARGAGE DE ZOMBIES !':'AVION CARGO : LARGAGE DE CAISSES !'));
  sfx(kind==='sleigh'?(evil?'evilbells':'bells'):(evil?'screech':'plane'));
  if(evil&&magWave){const m=zombies.find(z=>z.mag);if(m&&m.hp>0){m.hp=Math.min(m.maxhp,m.hp+m.maxhp*.05);burst(m.x,m.y-90,'#a060ff',14)}}   // le magicien récupère 5 % de vie
}
function makeRareGift(c){                                            // arme rare : n'importe quelle arme à feu (même non débloquée), niveau d'amélioration et couleur aléatoires
  const pool=WEAPONS.map((w,i)=>i).filter(i=>!WEAPONS[i].melee),byTime=rnd()<.5;
  c.w=pool[rndInt(pool.length)];c.ammo=byTime?0:20+rndInt(81);c.time=byTime?(20+rndInt(31))*1000:0;
  const r=rndInt(100);c.gl=r<35?1:r<65?2:r<85?3:4;
  const sk=SKINS.filter(k=>k.id!=='orig'),wd=WOODS.filter(k=>k.id!=='orig');c.gs=sk[rndInt(sk.length)].id;c.gwd=wd[rndInt(wd.length)].id;
  c.gift={k:'weapon',rare:true};c.gc=4;return c;
}
function dropFromSleigh(sl){
  if(sl.evil){
    const r=Math.random();
    if(SET.fete){
      if(r<.4){spawnZombie(['zdog','zdeer','zpeng'][Math.floor(Math.random()*3)],sl.x,sl.y+22);return}
      spawnZombie(wave>=4&&r<.5?'tank':r<.7?'fast':'normal',sl.x,sl.y+22,['santa','elf','reindeer'][Math.floor(Math.random()*3)]);
    } else spawnZombie(wave>=4&&r<.35?'tank':r<.65?'fast':'normal',sl.x,sl.y+22);
    return;
  }
  const c={x:sl.x,y:sl.y+20,vy:0,landed:false,age:0,ph:rnd()*6,w:0,ammo:0,time:0,gc:rndInt(4)};
  const wcrate=pool=>{const byTime=rnd()<.5;c.w=pool[rndInt(pool.length)];c.ammo=byTime?0:5+rndInt(96);c.time=byTime?(10+rndInt(31))*1000:0};
  if(!SET.fete){                                                      // avion cargo : caisses de base du jeu (arme, soin, armure)
    const k=rndInt(3);if(k===0) wcrate(magWave?lowPool():ownedGuns());else c.sup=k===1?'heal':'shield';
    crates.push(c);sfx('click');return;
  }
  if(magWave){const k=rndInt(100);if(k<45){wcrate(lowPool());c.gift={k:'weapon'}}else c.gift={k:k<73?'heal':'shield'};crates.push(c);sfx('click');return}   // pendant le boss : arme de bas niveau, soin ou armure (ni XP ni crédits)
  if(rnd()<.06){makeRareGift(c);crates.push(c);sfx('click');return}   // cadeau rare (6 %)
  const k=training?0:rndInt(10);                                    // 40 % arme, 30 % crédits, 30 % XP (le crédit et l'XP suivent la vague)
  if(k<4){wcrate(ownedGuns());c.gift={k:'weapon'}}
  else c.gift={k:k<7?'money':'xp',v:Math.round((8+wave*3)*(.6+rnd()*.8))};
  crates.push(c);sfx('click');
}
function updateXmas(dt){
  if(state!=='play') return;
  if(magWave){
    if(!cine){mgT-=dt;meT-=dt;if(mgT<=0){launchSleigh('good');mgT=14000+rnd()*6000}if(meT<=0&&zombies.some(z=>z.mag&&z.hp>0)){launchSleigh('evil');meT=17000+rnd()*8000}}
  } else {
    const active=(spawnQueue.length+zombies.length>0)&&waveBreak===0;
    if(active&&!sleighs.length){xmasT-=dt;if(xmasT<=0){launchSleigh();xmasT=45000+rnd()*35000}}
  }
  for(const sl of sleighs){
    sl.x+=sl.dir*(sl.spd||3.6);sl.dropT--;
    if(sl.drops>0&&sl.dropT<=0&&sl.x>camX+90&&sl.x<camX+W-90){sl.drops--;sl.dropT=sl.evil?26:62;dropFromSleigh(sl)}
    if(tick%3===0){const k=sl.kind;particles.push(k==='sleigh'?{x:sl.x-sl.dir*50,y:sl.y+8,vx:-sl.dir*.8,vy:.4,g:0,life:46,ml:46,col:sl.evil?'#a060ff':'#ffd45a',sz:1.6,glow:true}:k==='plane'?{x:sl.x-sl.dir*95,y:sl.y,vx:-sl.dir*.6,vy:-.1,g:-.01,life:60,ml:60,sz:5,smoke:true,col:'#8a8f90'}:{x:sl.x-sl.dir*30,y:sl.y+14,vx:0,vy:1,g:.05,life:40,ml:40,col:'#6aa04a',sz:1.7})}
    if((sl.dir>0&&sl.x>camX+W+460)||(sl.dir<0&&sl.x<camX-460)) sl.dead=true;
  }
  sleighs=sleighs.filter(q=>!q.dead);
}
function drawSleigh(x,y,dir,evil,fem){
  ctx.save();ctx.translate(x,y+Math.sin(tick*.12)*3);ctx.scale(dir,1);
  ctx.save();ctx.globalCompositeOperation='lighter';glowAt(40,0,150,evil?'150,70,255':'255,200,110',.13);ctx.restore();
  for(let i=0;i<3;i++){                                              // les rennes
    const rx=88+i*54,lg=Math.sin(tick*.25+i*1.3)*5;
    ctx.fillStyle=evil?'#3a3138':'#8a5a30';ctx.beginPath();ctx.ellipse(rx,0,17,8,0,0,7);ctx.fill();
    ctx.beginPath();ctx.moveTo(rx+11,-3);ctx.lineTo(rx+21,-15);ctx.lineTo(rx+27,-11);ctx.lineTo(rx+16,2);ctx.fill();ctx.beginPath();ctx.ellipse(rx+26,-14,6,4,.3,0,7);ctx.fill();
    ctx.strokeStyle=evil?'#8a7f88':'#5a3a1e';ctx.lineWidth=2.4;ctx.lineCap='round';ctx.beginPath();
    ctx.moveTo(rx-10,5);ctx.lineTo(rx-14+lg,17);ctx.moveTo(rx-4,6);ctx.lineTo(rx-2-lg,17);ctx.moveTo(rx+8,6);ctx.lineTo(rx+12+lg,16);ctx.moveTo(rx+13,4);ctx.lineTo(rx+17-lg,15);
    ctx.moveTo(rx+25,-18);ctx.lineTo(rx+22,-29);ctx.moveTo(rx+23,-23);ctx.lineTo(rx+18,-25);ctx.moveTo(rx+28,-18);ctx.lineTo(rx+32,-28);ctx.stroke();
    ctx.strokeStyle='#e0b030';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(rx-17,-2);ctx.lineTo(rx-37,-2);ctx.stroke();
    ctx.fillStyle=evil?'#ff2a2a':(i===2?'#ff3030':evil?'#fff':'#1a1a1a');ctx.beginPath();ctx.arc(evil?rx+27:rx+32,evil?-15:-13,evil?1.6:2.7,0,7);ctx.fill();
    if(i===2&&!evil){ctx.save();ctx.globalCompositeOperation='lighter';glowAt(rx+32,-13,16,'255,60,60',.7);ctx.restore()}
  }
  ctx.fillStyle=evil?'#8a5a30':'#8a5a30';ctx.fillStyle=evil?'#2a2018':'#8a5a30';ctx.beginPath();ctx.ellipse(-28,-24,14,15,0,0,7);ctx.fill();         // sac de cadeaux
  ctx.fillStyle=evil?'#1a1220':'#b3141c';ctx.beginPath();ctx.moveTo(-36,-14);ctx.lineTo(30,-14);ctx.quadraticCurveTo(46,-14,48,-28);ctx.lineTo(51,-28);ctx.lineTo(46,3);ctx.lineTo(-30,3);ctx.quadraticCurveTo(-44,3,-46,-8);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#e0b030';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-34,-10);ctx.lineTo(28,-10);ctx.stroke();ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-42,10);ctx.lineTo(42,10);ctx.quadraticCurveTo(58,10,55,-8);ctx.moveTo(-20,3);ctx.lineTo(-20,10);ctx.moveTo(24,3);ctx.lineTo(24,10);ctx.stroke();
  // conducteur
  ctx.fillStyle=evil?'#241a2c':'#c4161c';rrect(-4,-36,20,24,6,ctx.fillStyle);
  ctx.fillStyle='#f4f4f4';if(!evil){ctx.fillRect(-4,-17,20,4)}
  ctx.fillStyle='#e2b58c';ctx.beginPath();ctx.arc(7,-44,7,0,7);ctx.fill();
  if(evil){ctx.fillStyle='#241a2c';ctx.beginPath();ctx.arc(6,-45,9,Math.PI*.55,Math.PI*2.05);ctx.fill();ctx.fillStyle='#ff2a2a';ctx.fillRect(9,-46,2.6,2.4);ctx.strokeStyle='#6b4423';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(18,-28);ctx.lineTo(34,-46);ctx.stroke()}
  else{ctx.fillStyle='#f4f4f4';if(!fem){ctx.beginPath();ctx.moveTo(1,-42);ctx.lineTo(13,-41);ctx.quadraticCurveTo(14,-32,7,-30);ctx.quadraticCurveTo(0,-33,1,-42);ctx.fill()}else{ctx.beginPath();ctx.ellipse(0,-42,3,7,.2,0,7);ctx.fill()}
    ctx.fillStyle='#c4161c';ctx.beginPath();ctx.moveTo(-1,-49);ctx.quadraticCurveTo(5,-64,-8,-56);ctx.quadraticCurveTo(10,-66,14,-49);ctx.closePath();ctx.fill();ctx.fillStyle='#f4f4f4';ctx.fillRect(-2,-51,17,4);ctx.beginPath();ctx.arc(-8,-56,3.4,0,7);ctx.fill()}
  ctx.restore();
}
function drawXmas(){for(const sl of sleighs){if(sl.kind==='plane') drawPlane(sl.x,sl.y,sl.dir);else if(sl.kind==='dino') drawDino(sl.x,sl.y,sl.dir,sl.drops);else drawSleigh(sl.x,sl.y,sl.dir,sl.evil,sl.fem)}}
