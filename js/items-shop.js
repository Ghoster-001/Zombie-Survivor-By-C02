function dropGun(txt){player.gun=null;player.w=player.melee;player.cd=0;flash(txt)}
function pickCrate(c){
  const f=c.hp===undefined?1:c.hp;                                   // caisse abîmée par les zombies : le contenu diminue avec ses PV
  if(f<1){c=Object.assign({},c,{ammo:c.ammo?Math.max(1,Math.round(c.ammo*f)):0,time:c.time?Math.max(1000,Math.round(c.time*f)):0});if(c.gift&&c.gift.v) c.gift=Object.assign({},c.gift,{v:Math.max(1,Math.round(c.gift.v*f))})}
  if(c.sup){applyBonus(c.sup,f);sfx('crate');if(f<1) flash('CAISSE ABÎMÉE : '+Math.round(f*100)+' %');return}
  if(c.gift&&(c.gift.k==='heal'||c.gift.k==='shield')){applyBonus(c.gift.k,f);sfx('crate');for(const col of['#ffd45a','#e2542e','#4ac86a']) burst(c.x,c.y-16,col,4);return}
  if(c.gift&&c.gift.k!=='weapon'){
    const m=c.gift.k==='money',v=c.gift.v;sfx('crate');sfx('bonus');
    if(m){const g=addMoney(v,'bonus');flash('CADEAU : +'+Math.round(g)+' $')}else{const g=addXp(v,'bonus');flash('CADEAU : +'+Math.round(g)+' XP')}
    for(const col of['#ffd45a','#e2542e','#4ac86a','#4aa0e8']) burst(c.x,c.y-16,col,6);return}
  const w=WEAPONS[c.w],g=player.gun;
  if(g&&g.w===c.w&&((g.time>0)===(c.time>0))){g.ammo+=c.ammo;g.time+=c.time;g.a0+=c.ammo;g.t0+=c.time}
  else{player.gun={w:c.w,ammo:c.ammo,time:c.time,a0:c.ammo,t0:c.time};if(c.gift&&c.gift.rare){player.gun.gl=c.gl;player.gun.gs=c.gs;player.gun.gwd=c.gwd}}
  player.w=c.w;
  flash(tr(w.name).toUpperCase()+'  ·  '+(c.time?Math.round(c.time/1000)+' '+tr('secondes').toUpperCase():c.ammo+' '+tr('munitions').toUpperCase()));
  if(c.gift&&c.gift.rare){const sk=SKINS.find(k=>k.id===c.gs);flash('ARME RARE : '+w.name.toUpperCase()+'  NIV.'+c.gl+(sk?'  ·  '+sk.n:''))}
  burst(c.x,c.y-14,'#ffd45a',14);sfx('crate');
}
function useAmmo(){
  const g=player.gun;
  if(!g||g.time>0) return;                 // arme limitée en durée : pas de munitions
  if(--g.ammo<=0) dropGun('PLUS DE MUNITIONS');
}
function updateCrates(dt,p){
  if(p.gun&&p.gun.time>0){p.gun.time-=dt;if(p.gun.time<=0) dropGun('TEMPS ÉCOULÉ')}
  crateT-=dt;
  if(crateT<=0){spawnCrate();crateT=(15000+rnd()*20000)/curMap.crate}
  supT-=dt;if(supT<=0){spawnSupply();supT=(25000+rnd()*25000)/curMap.sup}
  nearC=null;let best=touchOn()?96:48;                      // caisse à portée : elle se ramasse avec la touche, plus automatiquement
  for(const c of crates){
    if(!c.landed){
      c.vy=Math.min(2.4,c.vy+.04);c.y+=c.vy;c.x+=Math.sin(tick*.03+c.ph)*.4;
      if(c.y>=GROUND){c.y=GROUND;c.landed=true;burst(c.x,c.y-6,'#c9b27a',8)}
    } else{
      c.age+=dt;
      for(const z of zombies){if(z.hp>0&&!(z.emerge>0||z.inv)&&z.fall===undefined&&Math.abs(z.x-c.x)<22){c.hp=Math.max(0,(c.hp===undefined?1:c.hp)-.004);if(c.hp<=0){c.dead=true;burst(c.x,c.y-12,'#9a7440',10);sfx('bhit');flash('CAISSE DÉTRUITE !');break}}}   // les zombies qui passent dessus l'abîment
    }
    const d=Math.hypot(p.x-c.x,(p.y-30)-(c.y-12));
    if(d<best){best=d;nearC=c}
    if(c.age>(c.sup?SUP_LIFE:c.gift?32000:22000)) c.dead=true;
  }
  crates=crates.filter(c=>!c.dead);
  if(nearC&&nearC.dead) nearC=null;
}
function tryPickup(){
  if(mpGuest()){mpSend({t:'ev',k:'pick'});return}
  if(player.dead||!nearC||nearC.dead||!crates.includes(nearC)) return;
  const c=nearC;pickCrate(c);c.dead=true;crates=crates.filter(k=>!k.dead);nearC=null;if(mpHost()) mpShareGift(c,null);
}
function drawCrates(){
  for(const c of crates){
    if(c.age>(c.sup?SUP_LIFE-4000:c.gift?28000:18000)&&Math.floor(c.age/150)%2) continue;
    if(!c.landed){
      ctx.fillStyle='#e8e2d4';ctx.beginPath();ctx.arc(c.x,c.y-50,24,Math.PI,0);ctx.closePath();ctx.fill();
      ctx.fillStyle='#c9372c';ctx.beginPath();ctx.arc(c.x,c.y-50,24,Math.PI*1.34,Math.PI*1.66);ctx.lineTo(c.x,c.y-50);ctx.fill();
      ctx.strokeStyle='#bbb';ctx.lineWidth=1;ctx.beginPath();
      for(const dx of[-24,-8,8,24]){ctx.moveTo(c.x+dx,c.y-50);ctx.lineTo(c.x+dx*.3,c.y-20)}ctx.stroke();
    }
    if(c.sup){
      rrect(c.x-15,c.y-24,30,24,3,'#7d8791');
      ctx.fillStyle='#4a525a';ctx.fillRect(c.x-15,c.y-24,30,3);ctx.fillRect(c.x-15,c.y-3,30,3);
      ctx.fillStyle='#b9c2cb';ctx.fillRect(c.x-13,c.y-21,26,2);
      if(c.sup==='heal'){ctx.fillStyle='#e8e8e8';ctx.fillRect(c.x-8,c.y-19,16,14);ctx.fillStyle='#d62d2d';ctx.fillRect(c.x-2,c.y-18,4,12);ctx.fillRect(c.x-7,c.y-13,14,4)}
      else{ctx.fillStyle='#4aa0e8';ctx.beginPath();ctx.moveTo(c.x-8,c.y-19);ctx.lineTo(c.x+8,c.y-19);ctx.lineTo(c.x+8,c.y-12);ctx.quadraticCurveTo(c.x+7,c.y-7,c.x,c.y-5);ctx.quadraticCurveTo(c.x-7,c.y-7,c.x-8,c.y-12);ctx.closePath();ctx.fill();ctx.strokeStyle='#e8f4ff';ctx.lineWidth=1.5;ctx.stroke()}
    } else if(c.gift){
      const rare=c.gift.rare,gc=rare?'#c9971f':['#c4161c','#2e8b3d','#2f6fd0','#8a4fd0'][(c.gc||0)%4];
      if(rare){ctx.save();ctx.globalCompositeOperation='lighter';glowAt(c.x,c.y-14,38+Math.sin(tick*.15)*5,'255,210,90',.45);ctx.restore()}
      rrect(c.x-13,c.y-24,26,24,2,gc);ctx.fillStyle=rare?'#fff':'#e0b030';ctx.fillRect(c.x-3,c.y-24,6,24);ctx.fillRect(c.x-13,c.y-15,26,5);
      ctx.beginPath();ctx.ellipse(c.x-5,c.y-27,6,4,-.4,0,7);ctx.ellipse(c.x+5,c.y-27,6,4,.4,0,7);ctx.fill();ctx.fillStyle='#b8901f';ctx.beginPath();ctx.arc(c.x,c.y-25,2.4,0,7);ctx.fill();
    } else {
      rrect(c.x-14,c.y-22,28,22,2,'#9a7440');
      ctx.fillStyle='#5a4220';ctx.fillRect(c.x-14,c.y-22,28,4);ctx.fillRect(c.x-14,c.y-4,28,4);ctx.fillRect(c.x-3,c.y-22,6,22);
      ctx.fillStyle='#f2efe8';ctx.font='700 14px '+FONT;ctx.textAlign='center';ctx.fillText('?',c.x+9,c.y-8);ctx.textAlign='left';
    }
    if(c.landed&&c.hp!==undefined&&c.hp<1){ctx.fillStyle='#000a';ctx.fillRect(c.x-15,c.y+3,30,5);ctx.fillStyle=c.hp>.5?'#4ac86a':c.hp>.25?'#e0b030':'#d62d2d';ctx.fillRect(c.x-14,c.y+4,28*c.hp,3)}
    if(c.landed){
      const a=.5+.4*Math.sin(tick*.12);
      ctx.strokeStyle='rgba(255,215,100,'+a+')';ctx.lineWidth=2;ctx.strokeRect(c.x-16,c.y-24,32,26);
      const bob=Math.sin(tick*.12)*3;ctx.fillStyle='#ffd45a';ctx.beginPath();ctx.moveTo(c.x,c.y-30+bob);ctx.lineTo(c.x-6,c.y-40+bob);ctx.lineTo(c.x+6,c.y-40+bob);ctx.fill();
    }
  }
  if(nearC&&!nearC.dead){
    const c=nearC,k=KEYS.pick.find(x=>x),txt=touchOn()?tr('Touche pour ramasser').toUpperCase():k?'['+keyName(k)+']  '+tr('Ramasser').toUpperCase():tr('Définis une touche (Options)').toUpperCase();
    ctx.font='700 15px '+FONT;const w=ctx.measureText(txt).width+22,x=c.x-w/2,y=c.y-(c.landed?66:104)+Math.sin(tick*.15)*2;
    panel(x,y,w,26,{norivets:true,edge:'#c9a227'});ctx.fillStyle='#ffd45a';ctx.textAlign='center';ctx.fillText(txt,c.x,y+19);ctx.textAlign='left';
  }
}
function buyWeapon(i){
  const w=WEAPONS[i];
  if(isOwned(i)){upSel=i;state='weapon';return}                       // arme possédée : page de détail (améliorations, couleur, équiper)
  if(curLevel()<w.lvl){flash(tr('Niveau {0} requis',w.lvl));return}
  if(save.bank<w.cost){flash('Pas assez d\'argent');return}
  save.bank-=w.cost;save.own[w.name]=true;sfx('buy');
  if(w.melee) save.melee=w.name;
  persist();
}
function buyUp(){
  const i=upSel,l=upLvl(i);
  if(l>=4) return;
  const c=upCost(i,l+1);
  if(save.bank<c){flash('Pas assez d\'argent');return}
  save.bank-=c;sfx('buy');
  const n=WEAPONS[i].name,u=save.up[n]=save.up[n]||{lvl:0,skin:'orig'};
  u.lvl=l+1;
  if(u.lvl===4){u.skin='gold';flash('MOD OR DÉBLOQUÉ !')}
  persist();
}
function setWood(id){
  const u=save.up[WEAPONS[upSel].name];
  if(!u||u.lvl<4) return;
  u.wood=id;persist();
}
function setSkin(id){
  const n=WEAPONS[upSel].name,u=save.up[n];
  if(!u||u.lvl<4) return;
  u.skin=id;persist();
}
function explode(x,y,r,dmg){
  for(const z of zombies){
    if(z.hp<=0||z.emerge>0||z.inv) continue;
    const d=Math.hypot(z.x-x,(z.y-30)-y);
    if(d<r) z.hp-=dmg*(1-d/(r*1.4));
  }
  fx.push({x,y,r,life:18});burst(x,y,'#ffb040',22);smokePuff(x,y-10,Math.min(10,4+Math.round(r/25)));sfx('boom');
  if(SET.shake) shake=Math.max(shake,10);
}
function buyHp(){
  if(save.hpLvl>=MAX_UP) return;
  if(save.bank<hpCost()){flash('Pas assez d\'argent');return}
  save.bank-=hpCost();save.hpLvl++;persist();sfx('buy');
}
function finishRun(){
  if(state==='over') return;
  if(ACG.st.cheat){money=0;runXp=0;ACG.note('Gains de la partie annulés')}
  sfx('over');state='over';
  if(training){runGain=0;runXp=0;overXp=save.xp;overLvl=levelOf(save.xp);overPulse=0;msgT=0;return}   // entraînement : rien n'est sauvegardé
  if(NM.on) save.nmBest=Math.max(save.nmBest|0,wave); else if(!BRF.on) recordWaves();
  runGain=money; save.bank+=money; save.xp+=runXp; overXp=xpStart; overLvl=levelOf(xpStart); overPulse=0; msgT=0; if(!NM.on&&!BRF.on) save.best=Math.max(save.best,wave); persist();
}

// --- Sons : synthétisés en direct (WebAudio), un son propre à chaque famille d'arme, décliné par arme ---
let AC=null,AMASTER=null,AVERB=null,ANOISE=null;const lastSfx={};
