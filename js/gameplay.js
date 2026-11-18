function segBox(x0,y0,x1,y1,l,t,r,b){                              // le segment (x0,y0)→(x1,y1) traverse-t-il la boîte ?
  let u0=0,u1=1;const dx=x1-x0,dy=y1-y0;
  for(const[p,q] of[[-dx,x0-l],[dx,r-x0],[-dy,y0-t],[dy,b-y0]]){
    if(p===0){if(q<0) return false}
    else{const u=q/p;if(p<0){if(u>u1) return false;if(u>u0) u0=u}else{if(u<u0) return false;if(u<u1) u1=u}}
  }
  return true;
}
function shoot(){
  const wp=WEAPONS[player.w];let hw=wp,side=0;
  if(wp.hands){side=player.hand=1-(player.hand||0);hw=WEAPONS[wp.hi[side]];player[side?'muz1':'muz0']=70}   // akimbo : une main puis l'autre
  const px=player.x, py=player.y-48+(wp.hands?(side?5:-3):0);
  const base=aimOv!==null?aimOv:(aimDir()?(player.face>0?0:Math.PI):Math.atan2(mouse.y-py,mouse.x+camX-px));
  const sh=hw.kind==='shotgun';
  for(let i=0;i<hw.pellets;i++){
    // fusil à pompe : gerbe de plombs en cloche (la plupart près de l'axe, quelques-uns plus écartés) ; autres armes : dispersion uniforme
    const a=sh?base+Math.max(-hw.spread*.5,Math.min(hw.spread*.5,gauss()*hw.spread*.2)):base+(Math.random()-.5)*hw.spread*2;
    const sp=hw.speed*(sh?.93+Math.random()*.14:1),life=hw.life||Math.ceil(hw.range/sp);
    bullets.push({x:px+Math.cos(base)*22,y:py+Math.sin(base)*22,ox:px,oy:py,
      vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,sp,dist:0,range:hw.range,fall:sh,
      dmg:hw.dmg*player.dmgMul*wBoost(player.w)*dmgM(),pierce:hw.pierce,life,l0:life,hit:new Set(),
      col:hw.col||'#ff0',aoe:hw.aoe||0,fire:!!hw.fire,size:hw.size||2});
  }
  if(['pistol','revolver','deagle','smg','ak','m4','lmg','dmr','barrett','minigun','shotgun'].includes(hw.kind)&&hw.kind!=='revolver'&&!hw.fire) particles.push({x:px,y:py-2,vx:-player.face*(1+Math.random()*1.8),vy:-2-Math.random()*2.2,life:90,ml:90,shell:true,rot:0,g:.32,col:hw.kind==='shotgun'?'#c9372c':'#d9b34a'});
  player.cd=(wp.hands?hw.rate*.6:wp.rate)/rapM(); player.firedThisClick=true;
  playGun(hw);
}
function slash(){
  const wp=WEAPONS[player.w];
  player.cd=wp.rate/rapM(); player.swing=180;
  playSwing(wp);let hitAny=false;
  for(const z of zombies){
    if(z.hp<=0||z.emerge>0||z.inv) continue;
    const dx=(z.x-player.x)*player.face;
    if(dx>-10 && dx<wp.reach+14*z.size){
      z.hp-=wp.dmg*player.dmgMul*wBoost(player.w)*dmgM(); z.x+=player.face*22/z.size; burst(z.x,z.y-40,'#a22',6);hitAny=true;
    }
  }
  if(hitAny&&snd()){const tt=AC.currentTime;if(!lastSfx.mh||tt-lastSfx.mh>.06){lastSfx.mh=tt;meleeHit(wp.name,tt)}}
}
function spawnZombie(type,ox,oy,xm){
  if(Math.random()<.25) sfx('groan');
  const t=ZTYPES[type], left=Math.random()<.5;
  if(type==='digger'){spawnDigger();return}
  if(type==='boss'){spawnBoss();return}
  // Les zombies deviennent plus résistants et plus dangereux à chaque vague
  const hpMul=(1+0.18*(wave-1))*curDiff.hp*curMap.hp*mpMul(), dmgMul=(1+0.10*(wave-1))*curDiff.dmg, spMul=Math.min(1.6,1+0.03*(wave-1))*curDiff.sp*curMap.sp;
  zombies.push({type,xm,fall:oy!==undefined?0:undefined,x:ox!==undefined?ox:(left?30:WORLD_W-30),y:oy!==undefined?oy:GROUND,hp:t.hp*hpMul,maxhp:t.hp*hpMul,
    speed:t.speed*(0.8+Math.random()*.4)*spMul,size:t.size,dmg:Math.round(t.dmg*dmgMul),color:t.color,
    coins:Math.round(t.coins*(1+0.1*(wave-1))),step:Math.random()*6,dir:left?1:-1,animal:t.animal,hh:t.hh,hw:t.hw,gseed:Math.random()});
}
let acid=[];
function spawnBoss(){
  const tier=Math.max(0,Math.floor(wave/5)-1-(wave>10?1:0)),b=BOSSES[tier%3],left=Math.random()<.5;
  const hpMul=(1+0.18*(wave-1))*curDiff.hp*curMap.hp*mpMul()*(1+.25*Math.max(0,tier-2)),dmgMul=(1+0.10*(wave-1))*curDiff.dmg;
  zombies.push({type:'boss',boss:b,skin:b.skin,shirt:b.shirt,x:left?30:WORLD_W-30,y:GROUND,hp:b.hp*hpMul,maxhp:b.hp*hpMul,speed:b.sp*curDiff.sp,size:b.size,dmg:Math.round(b.dmg*dmgMul),color:b.skin,coins:100,step:0,dir:left?1:-1});
  flashG('BOSS : '+b.n+' !');sfx('boom');sfx('groan');if(SET.shake) shake=Math.max(shake,10);
}
function spawnDigger(){
  const side=Math.random()<.5?-1:1;let x=player.x+side*(190+Math.random()*130);
  if(x<110||x>WORLD_W-110) x=player.x-side*(190+Math.random()*130);
  x=Math.max(110,Math.min(WORLD_W-110,x));
  const t=ZTYPES.digger,hpMul=(1+0.18*(wave-1))*curDiff.hp*curMap.hp*mpMul(),dmgMul=(1+0.10*(wave-1))*curDiff.dmg;
  zombies.push({type:'digger',x,y:GROUND,hp:t.hp*hpMul,maxhp:t.hp*hpMul,speed:t.speed*curDiff.sp*curMap.sp,size:t.size,dmg:Math.round(t.dmg*dmgMul),color:t.color,
    coins:Math.round(t.coins*(1+0.1*(wave-1))),step:0,dir:x<player.x?1:-1,emerge:EMERGE_T});
  flashG('LE SOL TREMBLE...');sfx('boom');if(SET.shake) shake=Math.max(shake,6);
}
const EMERGE_T=120;
let decals=[];
function burst(x,y,col,n=8){                                      // éclaboussures : taille, durée et lueur variables ; le sang laisse des traces au sol
  const blood=/^#(8e1b1b|a22|d33|c9372c)$/.test(col),glow=/^#(ffb040|ffd45a)$/.test(col);
  if(blood&&SET.gore) n=Math.round(n*1.7);
  n=Math.max(1,Math.round(n*FXF.pq));
  for(let i=0;i<n;i++){const l=26+Math.random()*26;particles.push({x,y,vx:(Math.random()-.5)*(glow?7:5),vy:-Math.random()*(glow?5:4),life:l,ml:l,col,sz:glow?1+Math.random()*2:1.2+Math.random()*2.4,blood,glow})}
}
function spawnGibs(z){                                              // morceaux de corps qui volent et laissent des traces de sang
  if(!SET.gore||particles.length>FXF.pmax*.7) return;
  const n=Math.round(5+z.size*4+(z.boss?14:0)),cx=z.x,cy=z.y-(z.hh?z.hh*.5:36*z.size);
  for(let i=0;i<n;i++){const kind=['chunk','chunk','bone','eye','limb'][Math.floor(Math.random()*5)];
    particles.push({gib:kind,x:cx,y:cy,vx:(Math.random()-.5)*9,vy:-3-Math.random()*6.5,rot:Math.random()*6,vr:(Math.random()-.5)*.45,life:520,ml:520,sz:2.4+Math.random()*3*(kind==='limb'?1.5:1),col:z.skin||z.color||'#6b8f5a'})}
  if(decals.length<230) decals.push({x:z.x,y:GROUND+8,r:7+z.size*5,life:1700});   // flaque
}
function smokePuff(x,y,n){n=Math.max(1,Math.round(n*FXF.pq));for(let i=0;i<n;i++){const l=50+Math.random()*30;particles.push({x:x+(Math.random()-.5)*30,y:y+(Math.random()-.5)*20,vx:(Math.random()-.5)*1.2,vy:-.6-Math.random()*.9,g:-.012,life:l,ml:l,sz:8+Math.random()*8,smoke:true,col:'#2a2522'})}}

// --- Bonus tombés des zombies : ramassés en marchant dessus (soin, bouclier, dégâts x2, cadence, gel, frappe aérienne, tourelle, butin) ---
const BON={
  heal:{n:'SOIN',c:'#c9372c',w:3},
  shield:{n:'BOUCLIER',c:'#3f8fe0',w:2,dur:8000},
  dmg:{n:'DÉGÂTS ×2',c:'#e0762a',w:2,dur:12000},
  rapid:{n:'CADENCE',c:'#d8b81f',w:2,dur:12000},
  freeze:{n:'GEL',c:'#5fc8e0',w:2,dur:8000},
  strike:{n:'FRAPPE AÉRIENNE',c:'#a83a2a',w:1.5},
  turret:{n:'TOURELLE',c:'#6f8560',w:1.5,dur:14000},
  cash:{n:'BUTIN +10 $',c:'#d8a020',w:2}
};
let bonuses=[],strikes=[],turret=null,fxB={shield:0,dmg:0,rapid:0,freeze:0,magnet:0,adren:0};
function dropBonus(z){
  if(NM.on&&!NM.bonus) return;
  const ch=(z.type==='tank'?.3:z.type==='fast'?.09:.06)*curMap.drop;
  if(Math.random()>=ch) return;
  const ks=BKEYS().filter(k=>training?k!=='cash':bowned(k)),low=player.hp<player.maxhp*.5;
  if(!ks.length) return;
  let tot=0;const ws=ks.map(k=>{const w=BON[k].w*(k==='heal'&&low?2.5:1);tot+=w;return w});
  let r=Math.random()*tot,i=0;while(i<ks.length-1&&(r-=ws[i])>0) i++;
  bonuses.push({x:Math.max(30,Math.min(WORLD_W-30,z.x)),y:z.y-70,vy:-4,type:ks[i],life:12000,gold:Math.random()<.04});
}
function applyBonus(type,fr,gold){
  const p=player,B=BON[type],L=LV(type,gold);fr=fr===undefined?1:fr;
  if(type==='heal') p.hp=Math.min(p.maxhp,p.hp+Math.round(p.maxhp*healFr(L)*fr));
  else if(type==='cash'){if(!training) addMoney(cashV(L),'bonus')}
  else if(type==='strike'){const n=strN(L);for(let i=0;i<n;i++) strikes.push({x:camX+60+Math.random()*(W-120),t:-i*Math.min(230,1500/n)-200,w:false,d:strDmg(L)})}
  else if(type==='turret'){const d=turDur(L);turret={x:p.x,t:d,max:d,cd:0,L}}
  else if(FXD[type]){const d=FXD[type](L);fxB[type]=d*fr;fxMax[type]=d;fxL[type]=L}
  else placeBoost(type,L);
  sfx('bonus');flash((gold?'DORÉ · ':'')+B.n);burst(p.x,p.y-40,gold?'#ffd45a':B.c,gold?26:14);
}
function updateBonus(dt){
  const p=player;
  for(const k in fxB) if(fxB[k]>0) fxB[k]=Math.max(0,fxB[k]-dt);
  if(dailyB){dailyT-=dt;if(dailyT<=0&&bonuses.length<6){dailyT=60000;bonuses.push({x:Math.max(40,Math.min(WORLD_W-40,p.x+(Math.random()<.5?-1:1)*(120+Math.random()*100))),y:GROUND-130,vy:-3,type:dailyB.id,life:20000,gold:dailyB.gold,daily:true});sfx('click')}}
  const mg=fxB.magnet>0?magR(fxL.magnet||0):0;
  for(const b of bonuses){
    b.life-=dt;b.vy+=.35;b.y+=b.vy;if(b.y>GROUND-16){b.y=GROUND-16;b.vy=0}
    if(mg&&Math.abs(b.x-p.x)<mg) b.x+=Math.sign(p.x-b.x)*Math.min(7,Math.abs(p.x-b.x));
    {const TB2=targets().find(t=>Math.abs(b.x-t.p.x)<28&&t.p.y>GROUND-70);if(TB2){asT(TB2,()=>applyBonus(b.type,1,b.gold));b.life=0}}
  }
  pack(bonuses,b=>b.life>0);
  if(turret){
    turret.t-=dt;turret.cd-=dt;
    if(turret.cd<=0){
      let best=null,bd=520;for(const z of zombies){if(z.hp<=0||z.emerge>0||z.inv) continue;const d=Math.abs(z.x-turret.x);if(d<bd){bd=d;best=z}}
      if(best){
        const a=Math.atan2((best.y-38*best.size)-(GROUND-26),best.x-turret.x);
        bullets.push({x:turret.x+Math.cos(a)*20,y:GROUND-26+Math.sin(a)*20,vx:Math.cos(a)*19,vy:Math.sin(a)*19,dmg:12*(1+.1*(wave-1))*(1+.12*(turret.L||0)),pierce:1,life:50,hit:new Set(),col:'#8fe8ff',aoe:0,fire:false,size:2});
        turret.cd=230;sfx('turret');
      }
    }
    if(turret.t<=0) turret=null;
  }
  for(const s of strikes){
    s.t+=dt;
    if(s.t>=0&&!s.w){s.w=true;sfx('whistle')}
    if(s.t>=450){explode(s.x,GROUND-8,95,(s.d||70)+wave*9);s.dead=true}
  }
  strikes=strikes.filter(s=>!s.dead);
}
function bonusIcon(type,cx,cy,r){
  const B=BON[type],k=r/14;
  ctx.save();ctx.translate(cx,cy);ctx.scale(k,k);
  ctx.fillStyle='#0b0908';ctx.beginPath();ctx.arc(0,0,15,0,7);ctx.fill();
  ctx.fillStyle=B.c;ctx.beginPath();ctx.arc(0,0,13,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.arc(-3,-4,8,0,7);ctx.fill();
  ctx.fillStyle='#fff';ctx.strokeStyle='#fff';ctx.lineWidth=2.6;ctx.lineCap='round';ctx.lineJoin='round';
  if(type==='heal'){ctx.fillRect(-2.5,-8,5,16);ctx.fillRect(-8,-2.5,16,5)}
  else if(type==='shield'){ctx.beginPath();ctx.moveTo(-7,-7);ctx.lineTo(7,-7);ctx.lineTo(7,0);ctx.quadraticCurveTo(7,7,0,9);ctx.quadraticCurveTo(-7,7,-7,0);ctx.closePath();ctx.fill()}
  else if(type==='dmg'){ctx.font='900 13px '+FONT;ctx.textAlign='center';ctx.fillText('x2',0,5)}
  else if(type==='rapid'){for(const o of[-5,2]){ctx.beginPath();ctx.moveTo(o,-6);ctx.lineTo(o+5,0);ctx.lineTo(o,6);ctx.stroke()}}
  else if(type==='freeze'){for(let i=0;i<3;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(0,8);ctx.stroke();ctx.restore()}}
  else if(type==='strike'){ctx.beginPath();ctx.ellipse(0,-1,3.4,7,0,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(-3,6);ctx.lineTo(-7,10);ctx.lineTo(0,7);ctx.lineTo(7,10);ctx.lineTo(3,6);ctx.fill()}
  else if(type==='turret'){ctx.fillRect(-7,3,14,5);ctx.fillRect(-2,-3,10,4);ctx.beginPath();ctx.arc(-1,0,4.5,0,7);ctx.fill()}
  else if(type==='cash'){ctx.font='900 17px '+FONT;ctx.textAlign='center';ctx.fillText('$',0,6)}
  else if(type==='barricade'){ctx.fillRect(-8,-7,3,14);ctx.fillRect(5,-7,3,14);ctx.fillRect(-8,-4,16,3);ctx.fillRect(-8,2,16,3)}
  else if(type==='teddy'){ctx.beginPath();ctx.arc(0,3,6,0,7);ctx.fill();ctx.beginPath();ctx.arc(0,-4,4.5,0,7);ctx.fill();ctx.beginPath();ctx.arc(-4,-8,2,0,7);ctx.fill();ctx.beginPath();ctx.arc(4,-8,2,0,7);ctx.fill()}
  else if(type==='mine'){ctx.beginPath();ctx.ellipse(0,3,8,4,0,0,7);ctx.fill();ctx.fillRect(-1.5,-6,3,7)}
  else if(type==='molotov'){ctx.fillRect(-4,-2,8,10);ctx.fillRect(-2,-7,4,6);ctx.beginPath();ctx.moveTo(-3,-8);ctx.lineTo(0,-13);ctx.lineTo(3,-8);ctx.fill()}
  else if(type==='drone'){ctx.fillRect(-4,-1,8,5);ctx.beginPath();ctx.moveTo(-9,-4);ctx.lineTo(9,-4);ctx.stroke();ctx.beginPath();ctx.moveTo(-6,3);ctx.lineTo(-9,7);ctx.moveTo(6,3);ctx.lineTo(9,7);ctx.stroke()}
  else if(type==='decoy'){ctx.fillRect(-7,-2,14,9);ctx.beginPath();ctx.moveTo(3,-2);ctx.lineTo(6,-9);ctx.stroke()}
  else if(type==='magnet'){ctx.beginPath();ctx.arc(0,0,6,Math.PI,0);ctx.stroke();ctx.fillRect(-8,0,4,7);ctx.fillRect(4,0,4,7)}
  else if(type==='beartrap'){ctx.beginPath();ctx.moveTo(-8,3);for(let i=0;i<4;i++){ctx.lineTo(-8+i*4+2,-5);ctx.lineTo(-8+i*4+4,3)}ctx.stroke()}
  else if(type==='grenade'){ctx.beginPath();ctx.arc(0,2,6,0,7);ctx.fill();ctx.fillRect(-2,-7,4,3);ctx.beginPath();ctx.moveTo(2,-6);ctx.lineTo(7,-8);ctx.stroke()}
  else if(type==='smoke'){for(const[ax,ay,rr] of[[-4,2,4.5],[4,2,4.5],[0,-3,5]]){ctx.beginPath();ctx.arc(ax,ay,rr,0,7);ctx.fill()}}
  else if(type==='fence'){ctx.fillRect(-8,-7,2,14);ctx.fillRect(6,-7,2,14);ctx.beginPath();ctx.moveTo(-6,-2);ctx.lineTo(-2,2);ctx.lineTo(1,-3);ctx.lineTo(6,1);ctx.stroke()}
  else if(type==='dog'){ctx.beginPath();ctx.arc(0,1,6,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(-6,-2);ctx.lineTo(-7,-9);ctx.lineTo(-1,-5);ctx.fill();ctx.beginPath();ctx.moveTo(6,-2);ctx.lineTo(7,-9);ctx.lineTo(1,-5);ctx.fill()}
  else if(type==='adren'){ctx.beginPath();ctx.moveTo(-7,7);ctx.lineTo(4,-4);ctx.stroke();ctx.fillRect(2,-9,7,3)}
  else if(type==='ammo'){ctx.fillRect(-7,-2,4,9);ctx.fillRect(-2,-2,4,9);ctx.fillRect(3,-2,4,9);ctx.fillRect(-6.5,-6,3,3);ctx.fillRect(-1.5,-6,3,3);ctx.fillRect(3.5,-6,3,3)}
  else if(type==='icewall'){ctx.strokeRect(-7,-6,14,12);ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(7,0);ctx.stroke()}
  else if(type==='heli'){ctx.beginPath();ctx.ellipse(-1,2,6,4,0,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(-9,-4);ctx.lineTo(8,-4);ctx.stroke();ctx.fillRect(5,1,5,2)}
  else if(type==='revive'){ctx.beginPath();ctx.moveTo(0,8);ctx.bezierCurveTo(-12,-1,-6,-10,0,-4);ctx.bezierCurveTo(6,-10,12,-1,0,8);ctx.fill()}
  ctx.restore();
}
function drawBonusWorld(){
  for(const b of bonuses){
    if(b.life<2500&&Math.floor(b.life/150)%2) continue;
    const bob=Math.sin(tick*.1+b.x)*3,B=BON[b.type];
    const g=ctx.createRadialGradient(b.x,b.y+bob,2,b.x,b.y+bob,30);g.addColorStop(0,B.c+'aa');g.addColorStop(1,B.c+'00');ctx.fillStyle=g;ctx.fillRect(b.x-30,b.y+bob-30,60,60);
    ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(b.x,GROUND+4,11,3,0,0,7);ctx.fill();
    if(b.gold){ctx.strokeStyle='rgba(255,220,90,'+(.6+.3*Math.sin(tick*.2))+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(b.x,b.y+bob-4,19,0,7);ctx.stroke();ctx.fillStyle='rgba(255,220,90,.25)';ctx.beginPath();ctx.arc(b.x,b.y+bob-4,24,0,7);ctx.fill()}
    bonusIcon(b.type,b.x,b.y+bob-4,b.gold?16:14);
  }
  for(const s of strikes){
    if(s.t<0){ctx.strokeStyle='rgba(255,70,50,.5)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(s.x,GROUND+8,10+Math.sin(tick*.4)*3,0,7);ctx.stroke();continue}
    const f=s.t/450,y=-30+f*(GROUND+22);
    ctx.fillStyle='rgba(255,70,50,'+(.25+.3*f)+')';ctx.beginPath();ctx.arc(s.x,GROUND+8,8+16*f,0,7);ctx.fill();
    ctx.save();ctx.translate(s.x,y);ctx.fillStyle='#8a8d92';ctx.beginPath();ctx.ellipse(0,0,4,12,0,0,7);ctx.fill();ctx.fillStyle='#a83a2a';ctx.beginPath();ctx.moveTo(-4,-8);ctx.lineTo(-9,-16);ctx.lineTo(0,-11);ctx.lineTo(9,-16);ctx.lineTo(4,-8);ctx.fill();ctx.fillStyle='#ffb040';ctx.beginPath();ctx.moveTo(-3,-12);ctx.lineTo(0,-34-Math.random()*12);ctx.lineTo(3,-12);ctx.fill();ctx.restore();
  }
  if(turret){
    const tx=turret.x,ty=GROUND;
    ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(tx,ty+4,15,3.5,0,0,7);ctx.fill();
    let best=null,bd=1e9;for(const z of zombies){const d=Math.abs(z.x-tx);if(z.hp>0&&d<bd){bd=d;best=z}}
    const a=best?Math.atan2((best.y-38*best.size)-(ty-26),best.x-tx):0;
    ctx.fillStyle='#4a4f44';ctx.fillRect(tx-4,ty-14,8,14);ctx.fillRect(tx-13,ty-4,26,6);
    ctx.save();ctx.translate(tx,ty-26);ctx.rotate(a);ctx.fillStyle='#262a26';ctx.fillRect(-4,-5,24,10);ctx.fillStyle='#8a948a';ctx.fillRect(18,-3,8,6);ctx.restore();
    ctx.fillStyle='#6f8560';ctx.beginPath();ctx.arc(tx,ty-26,9,0,7);ctx.fill();ctx.fillStyle='#2a2e28';ctx.beginPath();ctx.arc(tx,ty-26,4,0,7);ctx.fill();
    ctx.fillStyle='#0006';ctx.fillRect(tx-14,ty-46,28,4);ctx.fillStyle='#8fe8ff';ctx.fillRect(tx-14,ty-46,28*turret.t/turret.max,4);
  }
  drawEnts();
}
function drawBonusPlayer(){
  const p=player;
  if(fxB.shield>0){const a=fxB.shield<2000&&Math.floor(fxB.shield/150)%2?.15:.35+.1*Math.sin(tick*.2);
    const g=ctx.createRadialGradient(p.x,p.y-42,10,p.x,p.y-42,46);g.addColorStop(0,'rgba(80,150,255,0)');g.addColorStop(1,'rgba(90,170,255,'+a+')');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y-42,46,0,7);ctx.fill();
    ctx.strokeStyle='rgba(150,200,255,'+(a+.3)+')';ctx.lineWidth=2;ctx.stroke()}
  if(fxB.dmg>0){ctx.fillStyle='rgba(255,120,40,'+(.12+.06*Math.sin(tick*.3))+')';ctx.beginPath();ctx.arc(p.x,p.y-42,40,0,7);ctx.fill()}
  if(fxB.rapid>0){ctx.strokeStyle='rgba(255,220,70,.5)';ctx.lineWidth=2;for(let i=0;i<3;i++){const y=p.y-30-i*14;ctx.beginPath();ctx.moveTo(p.x-p.face*24,y);ctx.lineTo(p.x-p.face*(40+(tick*3+i*9)%14),y);ctx.stroke()}}
}
function drawBonusHud(){
  const items=[];for(const k of['shield','dmg','rapid','freeze','magnet','adren']) if(fxB[k]>0) items.push([k,fxB[k],fxMax[k]||8000]);
  if(turret) items.push(['turret',turret.t,turret.max]);
  for(const e of ents) if(e.max&&e.t>0&&['drone','dog','decoy','fence','fire','smoke','heli'].includes(e.k)&&!items.some(q=>q[0]===(e.k==='fire'?'molotov':e.k))) items.push([e.k==='fire'?'molotov':e.k,e.t,e.max]);
  items.forEach(([k,t,d],i)=>{
    const x=10+(i%5)*76,y=80+Math.floor(i/5)*38;panel(x,y,70,34,{norivets:true,grunge:.6});
    bonusIcon(k,x+18,y+17,11);
    ctx.fillStyle=t<2500&&tick%20<10?'#ff7a6a':'#f2efe8';ctx.font='700 16px '+FONT;ctx.textAlign='left';ctx.fillText(Math.ceil(t/1000)+' '+tr('s'),x+34,y+23);
    ctx.fillStyle=BON[k].c;ctx.fillRect(x+4,y+30,62*t/d,2);
  });
  if(dailyB){const y=80+Math.ceil(items.length/5)*38+4;panel(10,y,150,32,{norivets:true,grunge:.6});bonusIcon(dailyB.id,28,y+16,10);ctx.textAlign='left';ctx.fillStyle=dailyB.gold?'#ffd45a':'#e8e0d0';ctx.font='700 13px '+FONT;ctx.fillText('BOOST DU JOUR',46,y+14,110);ctx.fillStyle='#8a8178';ctx.font='500 12px '+FONT;ctx.fillText(BON[dailyB.id].n,46,y+27,110)}
}
// --- Menu pause (Échap) et mode Entraînement ---
function openPause(){tpts.clear();tRecalc();autoTarget=null;msgT=0;state='pause';pauseConfirm=false;mouse.down=false;sfx('click')}
function closePause(){state='play';pauseConfirm=false;mouse.down=false}
function quitToMenu(){
  if(MP.on&&MP.role==='guest'){mpLeaveToMenu();return}
  if(!training&&wave>0&&!ACG.st.cheat){if(NM.on) save.nmBest=Math.max(save.nmBest|0,wave);else{recordWaves();save.best=Math.max(save.best,wave)}save.bank+=money;save.xp+=runXp;persist()}   // les gains de la partie sont conservés
  if(MP.role==='host') mpStop();
  pauseConfirm=false;reset(true);
}
function setMain(i){
  if(WEAPONS[i].melee){trainMain=i;player.melee=i;player.w=i;player.gun=null;player.cd=0;flash(tr('Arme principale : {0}',tr(WEAPONS[i].name)))}
  else{player.gun={w:i,ammo:99999,time:0,a0:99999,t0:0};player.w=i;player.cd=0;flash(tr(WEAPONS[i].name).toUpperCase()+' : ARME SECONDAIRE (munitions illimitées)')}   // une arme à feu n'est jamais l'arme principale
  state='pause';
}
function drawPause(){
  menuRects=[];
  ctx.fillStyle='#000000b8';ctx.fillRect(0,0,W,H);
  const rg=ctx.createRadialGradient(W/2,H/2,80,W/2,H/2,H);rg.addColorStop(0,'rgba(80,0,0,0)');rg.addColorStop(1,'rgba(80,0,0,.4)');ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
  barbed(0,W,14,.9);
  ctx.textAlign='center';ctx.font='400 64px '+TITLE;ctx.fillStyle='#000';ctx.fillText('PAUSE',W/2+3,103);ctx.fillStyle='#e9e1d0';ctx.fillText('PAUSE',W/2,100);
  ctx.fillStyle='#8a8178';ctx.font='500 16px '+FONT;ctx.fillText(training?'MODE ENTRAÎNEMENT':tr('Vague').toUpperCase()+' '+wave+'   ·   $'+money+'   ·   '+kills+' '+tr('tués').toUpperCase(),W/2,128);
  const x=W/2-170,w=340;
  if(!pauseConfirm){
    let y=152;
    btn(menuRects,x,y,w,50,'CONTINUER',{act:closePause,size:24});y+=58;
    if(training){btn(menuRects,x,y,w,50,'ARME PRINCIPALE',{act:()=>{trainPage=0;state='trainpick'},size:24,sub:WEAPONS[player.melee].name.toUpperCase()});y+=58}
    btn(menuRects,x,y,w,50,'PARAMÈTRES',{act:()=>{optFrom='pause';state='options'},size:24});y+=58;
    btn(menuRects,x,y,w,50,'QUITTER',{act:()=>{pauseConfirm=true},size:24});
    ctx.textAlign='center';ctx.fillStyle='#6b625b';ctx.font='500 14px '+FONT;ctx.fillText(tr('Échap : continuer   ·   {0} : figer le jeu sans menu',kn('pause')),W/2,H-22);
  } else {
    panel(W/2-270,150,540,250,{grunge:.8});hazard(W/2-270,150,540,8);
    ctx.textAlign='center';ctx.fillStyle='#e9e1d0';ctx.font='400 34px '+TITLE;ctx.fillText('QUITTER LA PARTIE ?',W/2,212);
    ctx.fillStyle='#b9b1a6';ctx.font='500 17px '+FONT;
    ctx.fillText(training?'Rien n\'est sauvegardé en mode entraînement.':tr('Tes gains sont conservés :  +{0} $   ·   +{1} XP',money,runXp),W/2,246);
    ctx.fillText('Tu reviendras au menu principal.',W/2,270);
    btn(menuRects,W/2-250,300,240,50,'OUI, QUITTER',{act:quitToMenu,size:22});
    btn(menuRects,W/2+10,300,240,50,'NON, RETOUR',{act:()=>{pauseConfirm=false},size:22});
  }
  ctx.textAlign='left';
}
function drawTrainPick(){
  menuRects=[];
  ctx.fillStyle='#000000f4';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('ARME PRINCIPALE',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('ARME PRINCIPALE',40,58);
  ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,200,3);
  ctx.fillStyle='#8a8178';ctx.font='500 15px '+FONT;ctx.textAlign='right';ctx.fillText('Entraînement : toutes les armes, améliorées au maximum, munitions illimitées',W-40,52);ctx.textAlign='left';
  const tw=96,tg=4;
  CAT.forEach((c,ci)=>{
    const x=40+ci*(tw+tg),y=86,on=ci===trainCat,hot=mouse.x>=x&&mouse.x<=x+tw&&mouse.y>=y&&mouse.y<=y+24;
    menuRects.push({x,y,w:tw,h:24,act:()=>{trainCat=ci;trainPage=0}});
    panel(x,y,tw,24,{top:on?'#4a2018':hot?'#3a2e28':'#26211e',bot:on?'#2a100c':'#14100e',edge:on?'#e2542e':'#4a3a2e',norivets:true});if(on) hazard(x+2,y+2,tw-4,3);
    ctx.fillStyle=on?'#fff':'#a89f94';ctx.font='700 14px '+FONT;ctx.textAlign='center';ctx.fillText(c,x+tw/2,y+17,tw-8);
  });
  ctx.textAlign='left';
  const list=[];WEAPONS.forEach((w,i)=>{if(w.cat===CAT[trainCat]) list.push(i)});
  list.sort((p,q)=>WEAPONS[p].lvl-WEAPONS[q].lvl||p-q);
  const per=10,pages=Math.max(1,Math.ceil(list.length/per));if(trainPage>=pages) trainPage=0;
  const cw=168,gap=10;
  for(let k=0;k<per;k++){
    const i=list[trainPage*per+k];if(i===undefined) break;
    const x=40+(k%5)*(cw+gap),y=120+Math.floor(k/5)*152,h=142,wp=WEAPONS[i],eq=player.melee===i,hot=mouse.x>=x&&mouse.x<=x+cw&&mouse.y>=y&&mouse.y<=y+h;
    menuRects.push({x,y,w:cw,h,act:()=>setMain(i)});
    panel(x,y,cw,h,{top:hot?'#4a2018':'#2a2522',bot:hot?'#2a100c':'#15110f',edge:eq?'#4f7d3a':hot?'#e2542e':'#4a3a2e'});
    ctx.fillStyle='#0a0807';ctx.fillRect(x+9,y+9,cw-18,72);
    ctx.save();ctx.beginPath();ctx.rect(x+8,y+8,cw-16,74);ctx.clip();drawWeaponIcon(i,x+cw/2,y+45,cw-30,62,skinOf(i),woodOf(i));ctx.restore();
    ctx.fillStyle='#f2efe8';ctx.font='700 16px '+FONT;ctx.fillText(wp.name.toUpperCase(),x+10,y+102);
    ctx.fillStyle='#b9b1a6';ctx.font='500 13px '+FONT;ctx.fillText(tr('Dégâts').toUpperCase()+' '+Math.round(wp.dmg*wBoost(i))+(wp.pellets>1?' x'+wp.pellets:'')+'  ·  '+(1000/wp.rate).toFixed(1)+' /'+tr('s').toUpperCase(),x+10,y+118);
    ctx.fillStyle=eq?'#9fd18a':'#e0a526';ctx.font='700 14px '+FONT;ctx.fillText(eq?'ÉQUIPÉE':'CLIC : ÉQUIPER',x+10,y+134,cw-20);
  }
  ctx.fillStyle='#8a8178';ctx.font='500 14px '+FONT;ctx.fillText(tr('Page').toUpperCase()+' '+(trainPage+1)+' / '+pages+'   ·   '+list.length+' '+tr('armes').toUpperCase(),40,440);
  if(pages>1){
    btn(menuRects,W-300,424,120,26,'<  PRÉC.',{act:()=>trainPage=(trainPage+pages-1)%pages,size:14});
    btn(menuRects,W-170,424,130,26,'SUIV.  >',{act:()=>trainPage=(trainPage+1)%pages,size:14});
  }
  btn(menuRects,40,470,170,46,'RETOUR',{act:()=>state='pause',size:20});
}
// --- Vrai tirage au sort : générateur du navigateur (crypto), sans pondération ni truquage ---
function rnd(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}catch(e){return Math.random()}}
const rndInt=n=>Math.floor(rnd()*n);
// --- Niveau du personnage (propre à la partie) : à chaque niveau, un bonus est gagné et stocké, utilisable à la demande avec une touche ---
const LEVEL_BONUS=['dmg','rapid','freeze','strike','turret'];      // tirés uniformément au hasard à chaque niveau
let charXp=0,charLvl=1,charPulse=0,stock=[];
const charNeed=L=>15+5*(L-1);
function gainChar(n){
  charXp+=n;
  while(charXp>=charNeed(charLvl)){
    charXp-=charNeed(charLvl);charLvl++;
    const t=LEVEL_BONUS[rndInt(LEVEL_BONUS.length)];
    if(stock.length<8&&!(NM.on&&!NM.bonus)) stock.push(t);
    charPulse=45;sfx('bonus');flash(tr('Niveau {0}  ·  Bonus : {1}',charLvl,tr(BON[t].n)));
  }
}
function useBonus(){
  if(mpGuest()){mpSend({t:'ev',k:'bonus'});return}
  if(player.dead||!stock.length) return;
  applyBonus(stock.shift());
}
function drawLevelHud(){
  const x=Math.round((W-380)/2),y=10,w=380;
  panel(x,y,w,64,{});
  const gx=save.xp+(training?0:runXp),L=levelOf(gx),a=xpForLevel(L),b=xpForLevel(L+1);
  ctx.textAlign='left';ctx.fillStyle='#d8c27a';ctx.font='700 13px '+FONT;ctx.fillText(tr('Niveau de jeu').toUpperCase()+'  '+L,x+14,y+17);
  ctx.textAlign='right';ctx.fillStyle='#8a8178';ctx.font='500 12px '+FONT;ctx.fillText(Math.floor(gx-a)+' / '+(b-a)+' XP'+(training?'  '+tr('(non compté)'):''),x+w-14,y+17);
  drawXpBar(x+14,y+22,w-28,8,gx,0);
  const need=charNeed(charLvl),f=Math.min(1,charXp/need);
  ctx.textAlign='left';ctx.fillStyle=charPulse>0?'#ffd45a':'#f2efe8';ctx.font='700 13px '+FONT;ctx.fillText(tr('Personnage').toUpperCase()+'  '+tr('Niv.').toUpperCase()+' '+charLvl,x+14,y+46);
  ctx.textAlign='right';ctx.fillStyle='#8a8178';ctx.font='500 12px '+FONT;ctx.fillText(tr('{0} / {1}  ·  1 bonus par niveau',charXp,need),x+w-14,y+46);
  const bx=x+14,by=y+51,bw=w-28;
  ctx.fillStyle='#120e0b';ctx.fillRect(bx,by,bw,7);
  if(charPulse>0){ctx.shadowColor='#e2542e';ctx.shadowBlur=14*charPulse/45;charPulse--}
  const g=ctx.createLinearGradient(0,by,0,by+7);g.addColorStop(0,'#ff8a5a');g.addColorStop(1,'#c9372c');ctx.fillStyle=g;ctx.fillRect(bx,by,bw*f,7);ctx.shadowBlur=0;
  ctx.strokeStyle='#5a3a30';ctx.lineWidth=1.2;ctx.strokeRect(bx,by,bw,7);ctx.textAlign='left';
  // bonus en stock
  const sx=STOCK.x-SAFE.l,sy=STOCK.y;
  panel(sx,sy,248,62,{});
  const k=KEYS.bonus.find(v=>v);
  if(stock.length){
    bonusIcon(stock[0],sx+32,sy+31,19);
    ctx.fillStyle='#f2efe8';ctx.font='700 17px '+FONT;ctx.fillText(BON[stock[0]].n,sx+62,sy+26);
    ctx.fillStyle=tick%50<30?'#ffd45a':'#c9a227';ctx.font='700 14px '+FONT;ctx.fillText(k?tr('[{0}]  Utiliser',keyName(k)).toUpperCase():'DÉFINIS UNE TOUCHE (OPTIONS)',sx+62,sy+46);
    for(let i=1;i<stock.length;i++) bonusIcon(stock[i],sx+240-(stock.length-i)*22+8,sy+12,8);
  } else {
    ctx.fillStyle='#6b625b';ctx.font='700 15px '+FONT;ctx.fillText('AUCUN BONUS EN STOCK',sx+14,sy+27);
    ctx.fillStyle='#8a8178';ctx.font='500 13px '+FONT;ctx.fillText(tr('Prochain bonus au niveau {0}',charLvl+1),sx+14,sy+47);
  }
}
let paused=false;
