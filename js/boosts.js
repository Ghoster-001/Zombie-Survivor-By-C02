// ===== V0.47 : boosts améliorables, nouveaux boosts, roulette du jour, seconde vie, mort animée =====
Object.assign(BON,{
  barricade:{n:'BARRICADE',c:'#a8794a',w:1.4},
  teddy:{n:'NOUNOURS PIÉGÉ',c:'#d98aa0',w:1.2},
  mine:{n:'MINES',c:'#8a8f5a',w:1.2},
  molotov:{n:'MOLOTOV',c:'#e8541e',w:1.1},
  drone:{n:'DRONE',c:'#6fa0c8',w:1},
  decoy:{n:'APPÂT RADIO',c:'#b08a3a',w:1},
  magnet:{n:'AIMANT',c:'#c04a5a',w:1.2},
  beartrap:{n:'PIÈGE À OURS',c:'#8a8f98',w:1.2},
  grenade:{n:'GRENADE',c:'#5f8f4a',w:1.3},
  smoke:{n:'FUMIGÈNE',c:'#8a909a',w:1},
  fence:{n:'CLÔTURE ÉLECTRIQUE',c:'#3aa8d8',w:1},
  dog:{n:'CHIEN DE GARDE',c:'#b88a4a',w:1},
  adren:{n:'ADRÉNALINE',c:'#e0457a',w:1},
  ammo:{n:'MUNITIONS',c:'#b89a2a',w:1.3},
  icewall:{n:'MUR DE GLACE',c:'#6fc0d8',w:1},
  heli:{n:'RENFORT HÉLICO',c:'#5a6a46',w:.7},
  revive:{n:'SECONDE VIE',c:'#e0457a',w:0,nodrop:true}
});
const BKEYS=()=>Object.keys(BON).filter(k=>!BON[k].nodrop);
// --- puissance de chaque boost selon son niveau d'amélioration L (0 à 5, jusqu'à 7 avec l'or et le boost du jour) ---
const healFr=L=>Math.min(.95,.35+.08*L),shDur=L=>8000+1400*L,dmgDur=L=>12000+1600*L,dmgMul=L=>2+.2*L,rapDur=L=>12000+1600*L,rapMul=L=>1.8+.12*L,
  frDur=L=>8000+1200*L,frSlow=L=>Math.max(.12,.3-.03*L),strN=L=>6+2*L,strDmg=L=>70+8*L,turDur=L=>14000+2500*L,cashV=L=>10+5*L,
  barHp=L=>400+300*L,barN=L=>1+(L>=3?1:0)+(L>=5?1:0),tedHp=L=>160+90*L,tedDmg=L=>150+45*L,tedR=L=>120+10*L,mineN=L=>3+L,mineDmg=L=>90+25*L,
  firR=L=>90+8*L,firDur=L=>6000+800*L,droneDur=L=>14000+2500*L,decDur=L=>8000+1200*L,magDur=L=>15000+2500*L,magR=L=>260+60*L,
  trapN=L=>2+L,trapStun=L=>240+45*L,grenR=L=>110+8*L,grenDmg=L=>120+30*L,smkDur=L=>8000+1200*L,fenDur=L=>9000+1500*L,
  dogDur=L=>14000+2000*L,adrDur=L=>10000+1500*L,iceHp=L=>260+160*L,heliDur=L=>5000+700*L;
const FXD={shield:shDur,dmg:dmgDur,rapid:rapDur,freeze:frDur,magnet:magDur,adren:adrDur};
const BOOSTS=[
 {id:'heal',u:1,c:0,d:L=>'Rend '+Math.round(healFr(L)*100)+' % de PV'},
 {id:'shield',u:1,c:0,d:L=>'Invincible '+(shDur(L)/1000).toFixed(1)+' s'},
 {id:'barricade',u:2,c:120,d:L=>barN(L)+' barricade'+(barN(L)>1?'s':'')+' · '+barHp(L)+' PV'},
 {id:'dmg',u:3,c:150,d:L=>'Dégâts ×'+dmgMul(L).toFixed(1)+' · '+(dmgDur(L)/1000|0)+' s'},
 {id:'rapid',u:5,c:200,d:L=>'Cadence ×'+rapMul(L).toFixed(1)+' · '+(rapDur(L)/1000|0)+' s'},
 {id:'teddy',u:6,c:300,d:L=>'Explose : '+tedDmg(L)+' dégâts · rayon '+tedR(L)},
 {id:'freeze',u:7,c:300,d:L=>'Zombies à '+Math.round(frSlow(L)*100)+' % · '+(frDur(L)/1000|0)+' s'},
 {id:'beartrap',u:8,c:350,d:L=>trapN(L)+' pièges · stoppés '+(trapStun(L)/60).toFixed(1)+' s'},
 {id:'cash',u:9,c:250,d:L=>'+'+cashV(L)+' $'},
 {id:'mine',u:10,c:400,d:L=>mineN(L)+' mines · '+mineDmg(L)+' dégâts'},
 {id:'turret',u:11,c:500,d:L=>'Tourelle '+(turDur(L)/1000|0)+' s · dégâts +'+12*L+' %'},
 {id:'grenade',u:12,c:450,d:L=>grenDmg(L)+' dégâts · rayon '+grenR(L)},
 {id:'strike',u:13,c:600,d:L=>strN(L)+' missiles · '+strDmg(L)+' dégâts'},
 {id:'smoke',u:14,c:400,d:L=>'Nuage '+(smkDur(L)/1000|0)+' s · zombies perdus'},
 {id:'molotov',u:14,c:650,d:L=>'Feu '+(firDur(L)/1000|0)+' s · rayon '+firR(L)},
 {id:'drone',u:15,c:800,d:L=>'Drone '+(droneDur(L)/1000|0)+' s · dégâts +'+12*L+' %'},
 {id:'decoy',u:15,c:500,d:L=>'Appât '+(decDur(L)/1000|0)+' s'},
 {id:'magnet',u:16,c:600,d:L=>'Aimant '+(magDur(L)/1000|0)+' s · portée '+magR(L)},
 {id:'fence',u:16,c:700,d:L=>'Clôture '+(fenDur(L)/1000|0)+' s · dégâts +'+Math.round(L*24)+' %'},
 {id:'dog',u:17,c:900,d:L=>'Chien '+(dogDur(L)/1000|0)+' s · morsure '+(8+3*L)},
 {id:'adren',u:17,c:800,d:L=>(adrDur(L)/1000|0)+' s · +'+(1+L)+' PV par kill'},
 {id:'ammo',u:18,c:700,d:L=>'Recharge les munitions (+'+(15+5*L)+')'},
 {id:'icewall',u:18,c:750,d:L=>'Mur de glace · '+iceHp(L)+' PV'},
 {id:'heli',u:20,c:1500,d:L=>'Hélico '+(heliDur(L)/1000|0)+' s · '+(10+2*L)+' dégâts / tir'},
 {id:'revive',u:15,c:2000,max:10,d:L=>'Retour avec '+10*L+' % de PV (1 fois par partie)'}
];
const BDEF={};BOOSTS.forEach(b=>BDEF[b.id]=b);
const bMax=b=>b.max||5,bRev=b=>b.id==='revive';
const bReq=(b,k)=>bRev(b)?14+k:(k===0?b.u:b.u+2*k);
const bCostK=(b,k)=>bRev(b)?Math.round(2000*Math.pow(k,1.4)/50)*50:(k===0?b.c:Math.round(Math.max(100,b.c)*(.8+.6*k)/5)*5);
const bowned=id=>save.boost[id]!==undefined;
const bl=id=>{const v=save.boost[id];return v===undefined?0:v};
let dailyB=null,dailyT=0,ents=[],fxL={},fxMax={},runSrc={kill:{x:0,c:0},wave:{x:0,c:0},bonus:{x:0,c:0}},death=null,revUsed=false;
const LV=(id,gold)=>Math.min(7,bl(id)+(gold?2:0)+(dailyB&&dailyB.id===id?2:0));
const dmgM=()=>fxB.dmg>0?dmgMul(fxL.dmg||0):1;
const rapM=()=>(fxB.rapid>0?rapMul(fxL.rapid||0):1)*(fxB.adren>0?1.3+.05*(fxL.adren||0):1);
const frzM=()=>fxB.freeze>0?frSlow(fxL.freeze||0):1;
const reviveAvail=()=>!training&&!revUsed&&bowned('revive')&&bl('revive')>=1;
function buyBoost(id){
  const b=BDEF[id],cur=save.boost[id],k=cur===undefined?(bRev(b)?1:0):cur+1;
  if(k>bMax(b)) return;
  const need=bReq(b,k),cost=bCostK(b,k);
  if(curLevel()<need){flash('Niveau '+need+' requis');return}
  if(save.bank<cost){flash("Pas assez d'argent");return}
  save.bank-=cost;save.boost[id]=k;sfx('buy');persist();
}
// --- placement des boosts qui posent quelque chose sur la map ---
function capEnt(k,n){const l=ents.filter(e=>e.k===k);while(l.length>n){const o=l.shift();o.dead=true}ents=ents.filter(e=>!e.dead)}
function placeBoost(type,L){
  const p=player,f=p.face||1,cl=x=>Math.max(60,Math.min(WORLD_W-60,x)),add=e=>{ents.push(e);return e};
  switch(type){
    case 'barricade':{const n=barN(L);for(let i=0;i<n;i++) add({k:'barr',x:cl(p.x+(i===0?f*85:i===1?-f*85:f*160)),hp:barHp(L),max:barHp(L),w:28,blk:1});capEnt('barr',6);break}
    case 'icewall':{const n=L>=3?2:1,hp=iceHp(L);for(let i=0;i<n;i++) add({k:'barr',ice:1,x:cl(p.x+(i?-f:f)*90),hp,max:hp,w:30,blk:1,t:12000+1000*L});capEnt('barr',6);break}
    case 'teddy':{const n=L>=4?2:1;for(let i=0;i<n;i++) add({k:'ted',x:cl(p.x+(i?-f:f)*95),hp:tedHp(L),max:tedHp(L),w:30,blk:1,r:tedR(L),dmg:tedDmg(L)+wave*6});capEnt('ted',4);break}
    case 'mine':{const n=mineN(L);for(let i=0;i<n;i++) add({k:'mine',x:cl(p.x+(i%2?-1:1)*(55+Math.floor(i/2)*48)),arm:50,r:95,dmg:mineDmg(L)+wave*4});capEnt('mine',12);break}
    case 'beartrap':{const n=trapN(L);for(let i=0;i<n;i++) add({k:'trap',x:cl(p.x+(i%2?-1:1)*(70+Math.floor(i/2)*60)),stun:trapStun(L),dmg:40+12*L});capEnt('trap',10);break}
    case 'molotov':add({k:'fire',x:cl(p.x+f*170),t:firDur(L),max:firDur(L),r:firR(L),dps:.4+.07*L});capEnt('fire',4);burst(p.x+f*100,p.y-60,'#ff8a2a',12);break;
    case 'drone':ents=ents.filter(e=>e.k!=='drone');add({k:'drone',x:p.x,y:GROUND-140,t:droneDur(L),max:droneDur(L),cd:0,L});break;
    case 'decoy':ents=ents.filter(e=>e.k!=='decoy');add({k:'decoy',x:cl(p.x+f*340),t:decDur(L),max:decDur(L)});break;
    case 'grenade':add({k:'gren',x:p.x,y:p.y-50,vx:f*6.5,vy:-8,r:grenR(L),dmg:grenDmg(L)+wave*6});break;
    case 'smoke':add({k:'smoke',x:p.x,t:smkDur(L),max:smkDur(L),r:150});capEnt('smoke',3);break;
    case 'fence':add({k:'fence',x:cl(p.x+f*115),t:fenDur(L),max:fenDur(L),w:140,dps:.5+.12*L});capEnt('fence',3);break;
    case 'dog':ents=ents.filter(e=>e.k!=='dog');add({k:'dog',x:p.x,t:dogDur(L),max:dogDur(L),cd:0,L,dir:1});break;
    case 'heli':add({k:'heli',x:p.x-f*560,dir:f,y:GROUND-250,t:heliDur(L),max:heliDur(L),cd:0,L,dmg:10+2*L+wave});break;
    case 'ammo':{const g=p.gun;if(g){if(g.time>0) g.time+=12000+2000*L;else g.ammo+=Math.ceil((g.ammo||10)*.5)+15+5*L}else p.hp=Math.min(p.maxhp,p.hp+Math.round(p.maxhp*.1));break}
  }
}
const zv=z=>z.hp>0&&!(z.emerge>0)&&!z.inv&&z.fall===undefined;
const smokeAt=o=>ents.some(e=>e.k==='smoke'&&Math.abs(o.x-e.x)<e.r);
function zBlock(z,tx){for(const e of ents){if(!e.blk||e.hp<=0) continue;const rel=(e.x-z.x)*z.dir;if(rel>-6&&rel<e.w/2+10*z.size&&(e.x-tx)*z.dir<0) return e}return null}
function zSlow(z){let m=1;for(const e of ents){const d=Math.abs(z.x-e.x);if(e.k==='fence'&&d<e.w/2) m*=.6;else if(e.k==='barr'&&e.ice&&d<95) m*=.5;else if(e.k==='smoke'&&d<e.r) m*=.5}return m}
function nearestZ(x,range){let best=null,bd=range;for(const z of zombies){if(!zv(z)) continue;const d=Math.abs(z.x-x);if(d<bd){bd=d;best=z}}return best}
function updateEnts(dt){
  const p=player;
  for(const e of ents){
    if(e.t!==undefined){e.t-=dt;if(e.t<=0) e.dead=true}
    if(e.hit>0) e.hit--;
    switch(e.k){
      case 'barr':case 'ted':
        if(e.hp<=0&&!e.dead){e.dead=true;
          if(e.k==='ted'){explode(e.x,GROUND-26,e.r,e.dmg);for(let i=0;i<16;i++) particles.push({x:e.x,y:GROUND-30,vx:(Math.random()-.5)*10,vy:-3-Math.random()*7,life:55,col:i%3?'#e8a0b8':'#f4e6d0'})}
          else{burst(e.x,GROUND-24,e.ice?'#bfefff':'#9a7440',14);sfx('bhit')}}
        break;
      case 'mine':
        if(e.arm>0){e.arm--;break}
        for(const z of zombies){if(zv(z)&&Math.abs(z.x-e.x)<26){explode(e.x,GROUND-8,e.r,e.dmg);e.dead=true;break}}
        break;
      case 'trap':
        for(const z of zombies){if(zv(z)&&!z.boss&&Math.abs(z.x-e.x)<22){z.stun=e.stun;z.hp-=e.dmg;burst(z.x,GROUND-10,'#c8ccd4',8);sfx('bhit');e.dead=true;break}}
        break;
      case 'fire':
        for(const z of zombies){if(zv(z)&&Math.abs(z.x-e.x)<e.r) z.hp-=e.dps*(z.boss?.5:1)}
        if(tick%2===0) particles.push({x:e.x+(Math.random()-.5)*e.r*1.6,y:GROUND-4,vx:(Math.random()-.5)*.8,vy:-1.5-Math.random()*2,g:-.03,life:28,col:Math.random()<.5?'#ff8a2a':'#ffd45a'});
        break;
      case 'fence':
        for(const z of zombies){if(zv(z)&&Math.abs(z.x-e.x)<e.w/2) z.hp-=e.dps*(z.boss?.5:1)}
        break;
      case 'drone':{
        e.x+=(p.x-(p.face||1)*45-e.x)*.08;e.y=GROUND-140+Math.sin(tick*.08)*6;e.cd-=dt;
        if(e.cd<=0){const z=nearestZ(e.x,650);if(z){const a=Math.atan2((z.y-40*z.size)-e.y,z.x-e.x);bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*19,vy:Math.sin(a)*19,dmg:8*(1+.1*(wave-1))*(1+.12*e.L),pierce:1,life:60,hit:new Set(),col:'#9fe8ff',aoe:0,fire:false,size:2});sfx('turret');e.cd=Math.max(120,320-16*e.L)}}
        break}
      case 'dog':{
        e.cd--;const z=nearestZ(e.x,520);
        if(z){e.dir=z.x>e.x?1:-1;if(Math.abs(z.x-e.x)>26) e.x+=e.dir*4.4;else if(e.cd<=0){z.hp-=8+3*e.L;e.cd=24;burst(z.x,z.y-30,'#a22',5);sfx('hitmelee')}}
        else{const t=p.x-(p.face||1)*50;if(Math.abs(t-e.x)>10){e.dir=t>e.x?1:-1;e.x+=e.dir*3.2}}
        break}
      case 'heli':{
        e.x+=e.dir*3;e.cd--;
        if(e.cd<=0){e.cd=5;const z=nearestZ(e.x,430);if(z){z.hp-=e.dmg;e.tr={x:z.x,y:z.y-30,l:4};burst(z.x,z.y-30,'#ffd45a',3);sfx('turret')}}
        if(e.tr&&--e.tr.l<=0) e.tr=null;
        break}
      case 'gren':
        e.vy+=.45;e.x+=e.vx;e.y+=e.vy;
        if(e.y>=GROUND-6){explode(e.x,GROUND-8,e.r,e.dmg);for(const z of zombies){if(zv(z)&&!z.boss){const d=z.x-e.x;if(Math.abs(d)<e.r) z.x+=Math.sign(d||1)*45}}e.dead=true}
        break;
    }
  }
  if(fxB.magnet>0){
    const R=magR(fxL.magnet||0);
    for(const c of crates.slice()){if(c.dead||!c.landed||Math.abs(c.x-p.x)>R) continue;c.x+=Math.sign(p.x-c.x)*Math.min(5,Math.abs(p.x-c.x));if(Math.abs(c.x-p.x)<16) takeCrate(c)}
  }
  pack(ents,e=>!e.dead);
}
function drawEnts(){
  const bar=(x,y,r)=>{ctx.fillStyle='#0008';ctx.fillRect(x-18,y,36,4);ctx.fillStyle=r>.5?'#9fd18a':r>.25?'#e0a526':'#d33';ctx.fillRect(x-18,y,36*Math.max(0,r),4)};
  const p=player;
  if(fxB.magnet>0){const R=magR(fxL.magnet||0);ctx.strokeStyle='rgba(224,69,122,'+(.18+.1*Math.sin(tick*.1))+')';ctx.lineWidth=2;ctx.setLineDash([8,10]);ctx.beginPath();ctx.arc(p.x,GROUND-30,R*(.9+.1*Math.sin(tick*.07)),0,7);ctx.stroke();ctx.setLineDash([])}
  if(fxB.adren>0){ctx.fillStyle='rgba(224,69,122,'+(.12+.07*Math.sin(tick*.35))+')';ctx.beginPath();ctx.arc(p.x,p.y-42,42,0,7);ctx.fill()}
  for(const e of ents){
    const x=e.x;
    if(e.k==='barr'){
      const hw=e.w/2,r=e.hp/e.max;
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(x,GROUND+4,hw+9,3.5,0,0,7);ctx.fill();
      if(e.ice){ctx.fillStyle='rgba(170,230,250,'+(.4+.35*r)+')';ctx.fillRect(x-hw,GROUND-54,e.w,54);ctx.strokeStyle='#e8fbff';ctx.lineWidth=2;ctx.strokeRect(x-hw,GROUND-54,e.w,54);ctx.beginPath();ctx.moveTo(x-hw+5,GROUND-46);ctx.lineTo(x-3,GROUND-14);ctx.moveTo(x+4,GROUND-48);ctx.lineTo(x+hw-4,GROUND-30);ctx.stroke()}
      else{
        ctx.save();ctx.translate(e.hit>0?(tick%2?2:-2):0,0);
        ctx.fillStyle='#5a4128';ctx.fillRect(x-hw,GROUND-52,5,52);ctx.fillRect(x+hw-5,GROUND-52,5,52);
        for(let i=0;i<3;i++){ctx.fillStyle=i%2?'#8a6338':'#9a7040';ctx.fillRect(x-hw-3,GROUND-46+i*15,e.w+6,10)}
        ctx.strokeStyle='#3a2a18';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-hw,GROUND-4);ctx.lineTo(x+hw,GROUND-48);ctx.stroke();
        ctx.strokeStyle='#bfc4cc';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<=6;i++) ctx.lineTo(x-hw-3+i*(e.w+6)/6,GROUND-56+(i%2?-3:3));ctx.stroke();
        ctx.restore();
      }
      if(r<1) bar(x,GROUND-68,r);
    } else if(e.k==='ted'){
      const r=e.hp/e.max,b=Math.sin(tick*.12+x)*1.5,s=e.hit>0?(tick%2?2:-2):0;
      ctx.save();ctx.translate(s,0);
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(x,GROUND+4,17,3.5,0,0,7);ctx.fill();
      ctx.fillStyle='#a8744a';for(const[ax,ay,rr] of[[0,-16,13],[0,-37,10],[-8,-45,4.5],[8,-45,4.5],[-14,-20,5],[14,-20,5],[-8,-4,5],[8,-4,5]]){ctx.beginPath();ctx.arc(x+ax,GROUND+ay+b,rr,0,7);ctx.fill()}
      ctx.fillStyle='#e8c89a';ctx.beginPath();ctx.arc(x,GROUND-34+b,4.5,0,7);ctx.fill();
      ctx.fillStyle='#1a120c';ctx.beginPath();ctx.arc(x-3.5,GROUND-39+b,1.5,0,7);ctx.arc(x+3.5,GROUND-39+b,1.5,0,7);ctx.fill();ctx.fillRect(x-1.5,GROUND-35+b,3,2);
      ctx.fillStyle='#b8352a';ctx.fillRect(x-10,GROUND-21+b,20,6);ctx.fillStyle='#d8d0c0';ctx.fillRect(x-6,GROUND-21+b,2,6);ctx.fillRect(x+3,GROUND-21+b,2,6);
      ctx.fillStyle=tick%30<15?'#ff3a2a':'#4a1410';ctx.beginPath();ctx.arc(x,GROUND-18+b,2,0,7);ctx.fill();
      ctx.restore();
      if(r<1) bar(x,GROUND-60,r);
    } else if(e.k==='mine'){
      ctx.fillStyle='#2a2d26';ctx.beginPath();ctx.ellipse(x,GROUND+1,13,5,0,0,7);ctx.fill();ctx.fillStyle='#3d4236';ctx.beginPath();ctx.ellipse(x,GROUND-1,9,3.5,0,0,7);ctx.fill();
      ctx.fillStyle=e.arm>0?'#6a6a2a':tick%40<8?'#ff3a2a':'#5a1a14';ctx.beginPath();ctx.arc(x,GROUND-3,1.8,0,7);ctx.fill();
    } else if(e.k==='trap'){
      ctx.strokeStyle='#aeb4bc';ctx.lineWidth=2;ctx.fillStyle='#4a4f56';ctx.beginPath();ctx.ellipse(x,GROUND+2,17,4,0,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(x-16,GROUND+1);for(let i=0;i<6;i++){ctx.lineTo(x-16+i*6+3,GROUND-9);ctx.lineTo(x-16+i*6+6,GROUND+1)}ctx.stroke();
    } else if(e.k==='fire'){
      const f=Math.min(1,e.t/1200),n=Math.max(4,Math.round(e.r/12));
      const g=ctx.createRadialGradient(x,GROUND-6,4,x,GROUND-6,e.r);g.addColorStop(0,'rgba(255,150,40,'+(.4*f)+')');g.addColorStop(1,'rgba(255,90,20,0)');ctx.fillStyle=g;ctx.fillRect(x-e.r,GROUND-e.r,e.r*2,e.r*1.4);
      for(let i=0;i<n;i++){const fx0=x-e.r+(i+.5)*(e.r*2/n),h=(16+16*Math.abs(Math.sin(tick*.25+i*1.7)))*f;ctx.fillStyle=i%2?'#ff7a1e':'#ffb040';ctx.beginPath();ctx.moveTo(fx0-7,GROUND+2);ctx.quadraticCurveTo(fx0-2,GROUND-h*.6,fx0+Math.sin(tick*.3+i)*3,GROUND-h);ctx.quadraticCurveTo(fx0+2,GROUND-h*.6,fx0+7,GROUND+2);ctx.fill()}
    } else if(e.k==='smoke'){
      const f=Math.min(1,e.t/1500);
      for(let i=0;i<8;i++){const a=tick*.008+i*.8,cx=x+Math.cos(a)*e.r*.6*(i%3?.7:1),cy=GROUND-34-(i%3)*16+Math.sin(a*1.3)*8;ctx.fillStyle='rgba(185,190,196,'+(.2*f)+')';ctx.beginPath();ctx.arc(cx,cy,56+Math.sin(a*2)*8,0,7);ctx.fill()}
    } else if(e.k==='fence'){
      const hw=e.w/2,f=Math.min(1,e.t/1200);
      ctx.fillStyle='#3a3f46';ctx.fillRect(x-hw-3,GROUND-46,6,46);ctx.fillRect(x+hw-3,GROUND-46,6,46);
      ctx.strokeStyle='rgba(140,230,255,'+f+')';ctx.lineWidth=2;
      for(let k=0;k<2;k++){ctx.beginPath();ctx.moveTo(x-hw,GROUND-38+k*18);for(let i=1;i<=8;i++) ctx.lineTo(x-hw+i*e.w/8,GROUND-38+k*18+(Math.random()-.5)*(i<8?10:0));ctx.stroke()}
      const g=ctx.createRadialGradient(x,GROUND-24,4,x,GROUND-24,hw);g.addColorStop(0,'rgba(120,220,255,'+(.15*f)+')');g.addColorStop(1,'rgba(120,220,255,0)');ctx.fillStyle=g;ctx.fillRect(x-hw,GROUND-60,e.w,60);
    } else if(e.k==='decoy'){
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(x,GROUND+3,14,3,0,0,7);ctx.fill();
      ctx.fillStyle='#4a4a3a';ctx.fillRect(x-11,GROUND-18,22,18);ctx.fillStyle='#8a8a6a';ctx.fillRect(x-8,GROUND-15,9,9);ctx.fillStyle='#222';ctx.beginPath();ctx.arc(x+5,GROUND-9,3.5,0,7);ctx.fill();
      ctx.strokeStyle='#bbb';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+7,GROUND-18);ctx.lineTo(x+14,GROUND-40);ctx.stroke();
      for(let i=0;i<3;i++){const rr=((tick*1.2+i*24)%72);ctx.strokeStyle='rgba(230,200,90,'+(.5-rr/150)+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+14,GROUND-40,rr/2,Math.PI*1.2,Math.PI*1.8);ctx.stroke()}
    } else if(e.k==='dog'){
      const sw=Math.sin(tick*.5)*4;
      ctx.save();ctx.translate(x,GROUND);ctx.scale(e.dir,1);
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(0,4,18,3,0,0,7);ctx.fill();
      ctx.fillStyle='#a07848';ctx.beginPath();ctx.ellipse(0,-20,18,9,0,0,7);ctx.fill();ctx.fillRect(-14+sw,-16,4,16);ctx.fillRect(-4-sw,-16,4,16);ctx.fillRect(6+sw,-16,4,16);ctx.fillRect(12-sw,-16,4,16);
      ctx.beginPath();ctx.arc(19,-29,8,0,7);ctx.fill();ctx.fillStyle='#6a4a2a';ctx.beginPath();ctx.moveTo(15,-35);ctx.lineTo(14,-43);ctx.lineTo(20,-37);ctx.fill();ctx.fillRect(23,-29,8,5);
      ctx.strokeStyle='#a07848';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-17,-24);ctx.lineTo(-27,-33+Math.sin(tick*.4)*3);ctx.stroke();
      ctx.fillStyle='#111';ctx.fillRect(21,-32,2,2);ctx.fillStyle='#c0392b';ctx.fillRect(12,-24,3,5);
      ctx.restore();
    } else if(e.k==='drone'){
      ctx.save();ctx.translate(x,e.y);
      ctx.fillStyle='#2a2f36';ctx.beginPath();ctx.ellipse(0,0,13,6,0,0,7);ctx.fill();ctx.fillStyle='#6fa0c8';ctx.fillRect(-4,-3,8,3);
      ctx.strokeStyle='#cfd6de';ctx.lineWidth=2;const rw=14*Math.abs(Math.cos(tick*1.1));
      for(const ox of[-15,15]){ctx.beginPath();ctx.moveTo(ox-rw,-8);ctx.lineTo(ox+rw,-8);ctx.stroke();ctx.beginPath();ctx.moveTo(ox,-8);ctx.lineTo(ox*.7,-2);ctx.stroke()}
      ctx.fillStyle=tick%20<10?'#ff3a2a':'#6a1a14';ctx.beginPath();ctx.arc(0,5,2,0,7);ctx.fill();
      ctx.restore();
    } else if(e.k==='heli'){
      ctx.save();ctx.translate(x,e.y);ctx.scale(e.dir,1);
      ctx.fillStyle='#4a5a3a';ctx.beginPath();ctx.ellipse(0,0,36,14,0,0,7);ctx.fill();ctx.fillRect(-62,-6,34,8);ctx.fillStyle='#8ac0d8';ctx.beginPath();ctx.ellipse(16,-3,14,8,0,0,7);ctx.fill();
      ctx.fillStyle='#2f3a28';ctx.fillRect(-4,14,8,5);ctx.fillRect(-26,19,60,3);
      ctx.strokeStyle='#cfd2c8';ctx.lineWidth=3;const rw=60*Math.abs(Math.cos(tick*.9));ctx.beginPath();ctx.moveTo(-rw,-16);ctx.lineTo(rw,-16);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(0,-12);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-62,-14+Math.sin(tick)*6);ctx.lineTo(-62,2+Math.sin(tick)*6);ctx.stroke();
      ctx.restore();
      if(e.tr){ctx.strokeStyle='rgba(255,220,120,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+e.dir*30,e.y+10);ctx.lineTo(e.tr.x,e.tr.y);ctx.stroke()}
    } else if(e.k==='gren'){
      ctx.fillStyle='#3d5a2a';ctx.beginPath();ctx.arc(e.x,e.y,6,0,7);ctx.fill();ctx.fillStyle='#8a8d92';ctx.fillRect(e.x-2,e.y-9,4,4);
    }
  }
}
// --- Roulette du jour ---
const DAY=864e5;
let wheelFrom='boosts',wheel={ang:0,from:0,to:0,t:0,dur:0,res:null,spin:false,win:null,gold:false},wheelConf=false,bPage=0;
const wheelIds=()=>BKEYS();
const freeReady=()=>ACG.st.clock!=='bad'&&Date.now()-save.daily.last>=DAY;
const spinPrice=()=>freeReady()?0:Math.min(6400,100*Math.pow(2,save.daily.buys||0));
function fmtLeft(ms){const m=Math.max(0,Math.ceil(ms/60000)),h=Math.floor(m/60);return h+' h '+String(m%60).padStart(2,'0')+' min'}
function startSpin(){
  if(wheel.spin) return;
  const pr=spinPrice();
  if(pr>0&&save.bank<pr){flash("Pas assez d'argent");return}
  if(save.daily.pend&&!wheelConf){wheelConf=true;flash('Un boost du jour est déjà prêt : clique encore pour le remplacer');return}
  wheelConf=false;
  if(pr>0){save.bank-=pr;save.daily.buys=(save.daily.buys||0)+1}else{save.daily.last=Date.now();save.daily.buys=0}
  const ids=wheelIds(),i=rndInt(ids.length),gold=rnd()<.08,s=2*Math.PI/ids.length,target=-Math.PI/2-(i+.5)*s;
  save.daily.pend={id:ids[i],gold};
  const d=(((target-wheel.ang)%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
  wheel.from=wheel.ang;wheel.to=wheel.ang+d+Math.PI*2*5;wheel.t=0;wheel.dur=330;wheel.spin=true;wheel.res=null;wheel.win=ids[i];wheel.gold=gold;
  persist();sfx('click');
}
function drawWheel(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('ROULETTE DU JOUR',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('ROULETTE DU JOUR',40,58);
  ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,300,3);
  ctx.textAlign='right';ctx.fillStyle='#e0a526';ctx.font='700 30px '+FONT;ctx.fillText('$'+save.bank,W-40,44);ctx.textAlign='left';
  const ids=wheelIds(),n=ids.length,s=2*Math.PI/n,cx=270,cy=312,R=170;
  if(wheel.spin){
    wheel.t++;const f=Math.min(1,wheel.t/wheel.dur),e=1-Math.pow(1-f,3),a0=wheel.ang;wheel.ang=wheel.from+(wheel.to-wheel.from)*e;
    if(Math.floor(wheel.ang/s)!==Math.floor(a0/s)) sfx('click');
    if(f>=1){wheel.spin=false;wheel.res=wheel.win;sfx('bonus');sfx('crate')}
  }
  ctx.save();ctx.translate(cx,cy);
  ctx.fillStyle='#14100e';ctx.beginPath();ctx.arc(0,0,R+12,0,7);ctx.fill();ctx.strokeStyle='#7a2c1c';ctx.lineWidth=4;ctx.stroke();
  ctx.rotate(wheel.ang);
  for(let i=0;i<n;i++){
    ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,i*s,(i+1)*s);ctx.closePath();ctx.fillStyle=BON[ids[i]].c;ctx.fill();
    ctx.fillStyle=i%2?'rgba(0,0,0,.38)':'rgba(255,255,255,.07)';ctx.fill();ctx.strokeStyle='#0b0908';ctx.lineWidth=2;ctx.stroke();
    ctx.save();ctx.rotate((i+.5)*s);bonusIcon(ids[i],R*.8,0,11);ctx.restore();
  }
  ctx.restore();
  ctx.fillStyle='#0b0908';ctx.beginPath();ctx.arc(cx,cy,26,0,7);ctx.fill();ctx.fillStyle='#e0a526';ctx.beginPath();ctx.arc(cx,cy,18,0,7);ctx.fill();ctx.fillStyle='#7a2c1c';ctx.beginPath();ctx.arc(cx,cy,8,0,7);ctx.fill();
  ctx.fillStyle='#e2542e';ctx.strokeStyle='#0b0908';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cx-14,cy-R-20);ctx.lineTo(cx+14,cy-R-20);ctx.lineTo(cx,cy-R+8);ctx.closePath();ctx.stroke();ctx.fill();
  // panneau de droite
  const X=520,pd=save.daily.pend,ready=freeReady(),price=spinPrice();
  panel(X,100,400,170,{});
  ctx.fillStyle='#8a8178';ctx.font='500 14px '+FONT;ctx.fillText('BOOST DU JOUR  ·  PROCHAINE PARTIE',X+20,126);
  if(pd&&!wheel.spin){
    bonusIcon(pd.id,X+50,172,26);
    ctx.fillStyle=pd.gold?'#ffd45a':'#f2efe8';ctx.font='700 26px '+FONT;ctx.fillText((pd.gold?'DORÉ · ':'')+BON[pd.id].n,X+90,170,300);
    ctx.fillStyle='#d8d2c8';ctx.font='500 15px '+FONT;ctx.fillText('Réapparaît près de toi toutes les 60 s,',X+90,198);ctx.fillText('avec 2 niveaux de puissance en plus.',X+90,218);
    ctx.fillStyle='#9fd18a';ctx.fillText('Valable pour UNE seule partie.',X+90,242);
  }else{ctx.fillStyle='#6b625b';ctx.font='500 17px '+FONT;ctx.fillText(wheel.spin?'La roue tourne…':'Aucun boost du jour : tente ta chance !',X+20,180)}
  ctx.fillStyle=ready?'#9fd18a':'#d8a64a';ctx.font='700 18px '+FONT;
  ctx.fillText(ready?'TIRAGE GRATUIT DISPONIBLE !':'Prochain tirage gratuit dans '+fmtLeft(save.daily.last+DAY-Date.now()),X,302);
  const lab=ready?'TIRAGE GRATUIT':'TIRER  ·  $'+price;
  btn(menuRects,X,316,400,52,wheelConf?'CONFIRMER LE REMPLACEMENT':lab,{act:startSpin,size:26,dim:wheel.spin,sub:ready?undefined:'Le prix double à chaque achat'});
  ctx.fillStyle='#8a8178';ctx.font='500 14px '+FONT;
  ctx.fillText('Le prix des tirages payants revient à $100 quand le tirage gratuit revient (toutes les 24 h).',X,392,400);
  ctx.fillText('Le boost gagné peut être n\'importe lequel, même non débloqué. 8 % de chance de version dorée.',X,412,400);
  if(wheel.res&&!wheel.spin){ctx.fillStyle='#ffd45a';ctx.font='700 22px '+FONT;ctx.fillText('GAGNÉ : '+BON[wheel.res].n+(wheel.gold?' (DORÉ)':'')+' !',X,444,400)}
  btn(menuRects,40,484,200,44,'RETOUR',{act:()=>{wheelConf=false;state=wheelFrom==='menu'?'menu':'boosts'}});
  if(msgT>0){msgT--;ctx.fillStyle='#e2542e';ctx.font='700 18px '+FONT;ctx.fillText(msg.toUpperCase(),260,512,640)}
}
// --- Page BOOSTS ---
function boostCard(b,x,y,w,h){
  const own=bowned(b.id),L=bl(b.id),mx=bMax(b),k=own?L+1:(bRev(b)?1:0),maxed=own&&L>=mx,req=bReq(b,k),cost=bCostK(b,k),lvOK=curLevel()>=req;
  const hot=mouse.x>=x&&mouse.x<=x+w&&mouse.y>=y&&mouse.y<=y+h;
  menuRects.push({x,y,w,h,act:()=>buyBoost(b.id)});
  panel(x,y,w,h,{top:hot?'#3a2a22':'#2b2521',bot:'#16110f',edge:own?'#6f9a4a':hot?'#a8553a':'#4a3a2e',norivets:true,grunge:.8});
  ctx.globalAlpha=own?1:.55;bonusIcon(b.id,x+28,y+30,19);ctx.globalAlpha=1;
  ctx.textAlign='left';ctx.fillStyle=own?'#f2efe8':'#a89f94';ctx.font='700 16px '+FONT;ctx.fillText(bRev(b)?'SECONDE VIE':BON[b.id].n,x+56,y+24,w-64);
  for(let i=0;i<mx;i++){ctx.fillStyle=own&&i<L+(bRev(b)?0:0)?'#e0a526':'#3a3028';ctx.fillRect(x+56+i*(bRev(b)?15:20),y+30,bRev(b)?12:16,5)}
  ctx.fillStyle=own?'#d8d2c8':'#7a7168';ctx.font='500 14px '+FONT;ctx.fillText(own?b.d(bRev(b)?L:L):'Verrouillé',x+10,y+56,w-20);
  if(!maxed){ctx.fillStyle='#8aa87a';ctx.font='500 13px '+FONT;ctx.fillText('→ '+b.d(k),x+10,y+74,w-20)}
  else{ctx.fillStyle='#e0a526';ctx.font='700 14px '+FONT;ctx.fillText('NIVEAU MAX',x+10,y+74)}
  if(!maxed){
    ctx.font='700 15px '+FONT;
    if(!lvOK){ctx.fillStyle='#e2542e';ctx.fillText('Niveau '+req+' requis',x+10,y+98)}
    else{ctx.fillStyle=save.bank>=cost?'#ffd45a':'#9a7040';ctx.fillText((own?'AMÉLIORER':'DÉBLOQUER')+'  ·  $'+cost,x+10,y+98)}
  }
}
let maintTitle='MULTIJOUEUR',gameMode='2D';
function setGameMode(m){
  if(m==='3D'){gameMode='3D';SET.m3=true;SET.vr=false;saveOpts();g3Request();state='menu';return}
  if(m==='2D'){gameMode='2D';SET.m3=false;SET.vr=false;saveOpts();state='menu';return}
  gameMode=m;SET.vr=(m==='VR');SET.m3=false;saveOpts();maintTitle='MODE '+m;state='maint'
}   // VR : page de maintenance ; le mode choisi (2D, 3D ou VR) est mémorisé et restauré au prochain lancement
function drawMaint(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText(maintTitle,43,61);ctx.fillStyle='#e9e1d0';ctx.fillText(maintTitle,40,58);
  ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,230,3);
  hazard(140,150,680,16);hazard(140,330,680,16);
  panel(140,166,680,164,{});
  ctx.textAlign='center';ctx.fillStyle='#ffd45a';ctx.font='400 54px '+TITLE;ctx.fillText('EN MAINTENANCE',480,238);
  ctx.fillStyle='#d8d2c8';ctx.font='500 20px '+FONT;ctx.fillText('Le mode '+(maintTitle==='MULTIJOUEUR'?'multijoueur':maintTitle==='MODE 3D'?'3D':'VR')+' est en cours de préparation.',480,276);
  ctx.fillStyle='#8a8178';ctx.font='500 16px '+FONT;ctx.fillText('Reviens bientôt : il arrivera dans une prochaine mise à jour.',480,304);
  if(maintTitle!=='MULTIJOUEUR'){ctx.fillStyle='#e0a526';ctx.font='700 15px '+FONT;ctx.fillText('Le multijoueur ne sera pas disponible en mode '+'VR'+' : il reste réservé au mode 2D.',480,322)}
  ctx.textAlign='left';
  if(gameMode!=='2D') btn(menuRects,700,470,220,44,'MODE : '+gameMode,{act:()=>setGameMode(gameMode==='3D'?'VR':'2D'),size:18});
  btn(menuRects,40,470,200,44,'RETOUR',{act:()=>{state='menu'}});
}
const FC_POS=[['tl','HAUT GAUCHE',0,0],['tr','HAUT DROITE',1,0],['br','BAS DROITE',1,1],['bl','BAS GAUCHE',0,1]];
function drawFpsPage(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('COMPTEUR FPS',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('COMPTEUR FPS',40,58);
  ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,230,3);
  const f=SET.fc,X=[40,320],ys=[92,134,176,218,260,302,344,386],oo=v=>v?'OUI':'NON',up=()=>saveOpts();
  const B=(c,r,lab,act)=>btn(menuRects,X[c],ys[r],270,36,lab,{act,size:16});
  const SIZES=[.8,1,1.25,1.5,2],OPS=[1,.75,.5,.25],COLS=[['auto','AUTO (VERT/JAUNE/ROUGE)'],['white','BLANC'],['green','VERT'],['yellow','JAUNE']];
  const cyc=(arr,v,eq)=>{let k=arr.findIndex(x=>eq?eq(x,v):x===v);return arr[(k+1)%arr.length]};
  const pn=(FC_POS.find(p=>p[0]===f.pos)||['','LIBRE'])[1];
  B(0,0,'COMPTEUR : '+oo(f.on),()=>{f.on=!f.on;up()});
  B(1,0,'POSITION : '+pn,()=>{const p=FC_POS[(Math.max(-1,FC_POS.findIndex(q=>q[0]===f.pos))+1)%FC_POS.length];f.pos=p[0];f.fx=p[2];f.fy=p[3];up()});
  B(0,1,'TAILLE : '+Math.round(f.size*100)+' %',()=>{f.size=cyc(SIZES,f.size);up()});
  B(1,1,'OPACITÉ : '+Math.round(f.op*100)+' %',()=>{f.op=cyc(OPS,f.op);up()});
  B(0,2,'COULEUR : '+(COLS.find(c=>c[0]===f.col)||COLS[0])[1],()=>{f.col=cyc(COLS,f.col,(x,v)=>x[0]===v)[0];up()});
  B(1,2,'FOND SOMBRE : '+oo(f.bg),()=>{f.bg=f.bg?0:1;up()});
  B(0,3,'FPS : '+oo(f.fps),()=>{f.fps=f.fps?0:1;up()});
  B(1,3,'TEMPS D\'IMAGE (ms) : '+oo(f.ms),()=>{f.ms=f.ms?0:1;up()});
  B(0,4,'1 % BAS : '+oo(f.low),()=>{f.low=f.low?0:1;up()});
  B(1,4,'MOY / MIN / MAX : '+oo(f.avg),()=>{f.avg=f.avg?0:1;up()});
  B(0,5,'RÉSOLUTION : '+oo(f.res),()=>{f.res=f.res?0:1;up()});
  B(1,5,'PROFIL GRAPHIQUE : '+oo(f.prof),()=>{f.prof=f.prof?0:1;up()});
  B(0,6,'GRAPHIQUE DES IMAGES : '+oo(f.graph),()=>{f.graph=f.graph?0:1;up()});
  B(0,7,'TAUX DE L\'ÉCRAN : '+(SET.hz>0?SET.hz+' Hz (MANUEL)':'AUTO ('+HZm+' Hz)'),()=>{const o=[0,60,75,90,100,120,144,165,180,240,360,480,1000];SET.hz=o[(o.indexOf(SET.hz>0?SET.hz:0)+1)%o.length];fxUpdate();up()});
  B(1,6,'RÉINITIALISER',()=>{SET.fc=Object.assign({},FC_DEF,{on:f.on});up()});
  // mini-écran : on glisse le repère pour placer le compteur n'importe où
  const mx=620,my=92,mw=300,mh=Math.round(300*H/W>200?200:300*9/16);
  ctx.fillStyle='#8a8178';ctx.font='500 14px '+FONT;ctx.fillText('Glisse le repère pour placer le compteur',mx,my-8);
  ctx.fillStyle='#0b0908';ctx.fillRect(mx,my,mw,mh);ctx.strokeStyle='#4a3a2e';ctx.lineWidth=2;ctx.strokeRect(mx,my,mw,mh);
  const bw=56,bh=22,px=mx+4+f.fx*(mw-bw-8),py=my+4+f.fy*(mh-bh-8);
  menuRects.push({x:mx,y:my,w:mw,h:mh,slider:true,act:()=>{f.fx=Math.max(0,Math.min(1,(mouse.x-mx-bw/2-4)/(mw-bw-8)));f.fy=Math.max(0,Math.min(1,(mouse.y-my-bh/2-4)/(mh-bh-8)));f.pos='free';up()}});
  ctx.fillStyle=f.on?'rgba(125,255,106,.85)':'rgba(120,110,100,.7)';ctx.fillRect(px,py,bw,bh);ctx.fillStyle='#0b0908';ctx.font='700 13px '+FONT;ctx.textAlign='center';ctx.fillText(f.on?'FPS':'OFF',px+bw/2,py+16);ctx.textAlign='left';
  ctx.fillStyle='#b9b1a6';ctx.font='500 13px '+FONT;
  ctx.fillText('Le compteur apparaît en direct à l\'écran, à l\'endroit choisi.',mx,my+mh+22,300);
  ctx.fillText('Écran détecté : '+HZ+' Hz  ·  limite actuelle : '+fpsName(SET.fps>0?Math.min(SET.fps,HZ):0),mx,my+mh+42,300);
  ctx.fillText('(limite réglable dans Graphismes)',mx,my+mh+62,300);
  btn(menuRects,40,470,200,44,'RETOUR',{act:()=>{state='options';optTab=2}});
}
function drawBoosts(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);
  ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('BOOSTS',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('BOOSTS',40,58);
  ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,160,3);
  const info=drawXpBar(W-260,72,220,8,save.xp,0),L=info.L;
  ctx.textAlign='right';ctx.fillStyle='#e0a526';ctx.font='700 30px '+FONT;ctx.fillText('$'+save.bank,W-40,44);
  ctx.fillStyle='#d8d2c8';ctx.font='500 15px '+FONT;ctx.fillText(tr('Niveau').toUpperCase()+' '+L,W-40,64);ctx.textAlign='left';
  const per=9,pages=Math.ceil(BOOSTS.length/per);if(bPage>=pages) bPage=0;
  for(let k=0;k<per;k++){const b=BOOSTS[bPage*per+k];if(!b) break;boostCard(b,40+(k%3)*300,92+Math.floor(k/3)*128,290,120)}
  btn(menuRects,40,484,200,44,'RETOUR',{act:()=>state='upgrades'});
  btn(menuRects,250,484,300,44,freeReady()?'ROULETTE  ·  GRATUIT !':'ROULETTE DU JOUR',{act:()=>{wheelConf=false;wheelFrom='boosts';state='wheel'},size:20});
  ctx.fillStyle='#8a8178';ctx.font='500 14px '+FONT;ctx.textAlign='right';ctx.fillText('PAGE '+(bPage+1)+' / '+pages,W-40,476);ctx.textAlign='left';
  btn(menuRects,W-300,484,120,44,'<  PRÉC.',{act:()=>bPage=(bPage+pages-1)%pages,size:14});
  btn(menuRects,W-170,484,130,44,'SUIV.  >',{act:()=>bPage=(bPage+1)%pages,size:14});
  if(msgT>0){msgT--;ctx.fillStyle='#e2542e';ctx.font='700 18px '+FONT;ctx.fillText(msg.toUpperCase(),40,520,880)}
}
// --- Mort animée, récapitulatif et seconde vie ---
function endRun(){
  if(ctlEdit){player.hp=player.maxhp;return}
  if(MP.on&&MP.role==='host'){                                           // coop : un joueur à terre ne met pas fin à la partie tant qu'il en reste un debout
    const P=player;if(P.dead) return;P.dead=true;P.hp=0;
    flashG(((MP.guests.find(g=>g.p===P)||{}).name||cleanName(mpName()))+' est à terre !');
    if([MP.hostP].concat(MP.guests.map(g=>g.p)).every(q=>!q||q.dead)) MP.pendingOver=true;
    return;
  }                              // mode de personnalisation : immortel
  if(state==='over'||death) return;
  death={t:0,ph:'fall',rev:reviveAvail(),end:400};
  sfx('hurt');
}
function updateDeath(dt){
  const d=death,p=player;d.t++;
  p.vy+=GRAV;p.y+=p.vy;if(p.y>GROUND){p.y=GROUND;p.vy=0}
  for(const q of particles){q.x+=q.vx;q.y+=q.vy;q.vy+=q.g===undefined?.3:q.g;q.life--;if(q.blood&&q.y>GROUND+4) q.life=0}
  pack(particles,q=>q.life>0);for(const f of fx) f.life--;pack(fx,f=>f.life>0);
  updateCam(false);
  if(d.ph==='fall'){
    if(d.t<60&&d.t%5===0&&d.t>6) burst(p.x,p.y-30-Math.random()*20,'#a01010',5);
    if(d.t===30) sfx('boom');
    for(const z of zombies){if(z.hp>0&&!(z.emerge>0)&&z.fall===undefined){z.dir=p.x>z.x?1:-1;if(Math.abs(z.x-p.x)>46){z.x+=z.dir*z.speed*.35;z.step+=.05}}}
    if(d.t>=140){if(d.rev){d.ph='recap';d.t=0}else{death=null;finishRun()}}
  }else if(d.ph==='recap'){
    if(d.t>=d.end){d.ph='revive';d.t=0}
  }else{
    if(d.t===1){
      const pct=bl('revive')*.1;p.hp=Math.max(1,Math.round(p.maxhp*pct));revUsed=true;p.hurtCd=0;fxB.shield=Math.max(fxB.shield,3000);fxMax.shield=Math.max(fxMax.shield||0,3000);fxL.shield=fxL.shield||0;
      for(const z of zombies){if(z.hp>0&&!z.boss&&Math.abs(z.x-p.x)<420){const dd=z.x>=p.x?1:-1;z.x+=dd*130;z.stun=70}}
      fx.push({x:p.x,y:GROUND-40,r:170,life:18});burst(p.x,p.y-40,'#ff9ac0',26);burst(p.x,p.y-40,'#ffffff',16);sfx('bonus');sfx('wave');flash('SECONDE VIE !');
    }
    if(d.t>=75) death=null;
  }
}
function deathAng(){
  const d=death;
  if(d.ph==='fall') return d.t<18?0:Math.pow(Math.min(1,(d.t-18)/34),2)*Math.PI/2;
  if(d.ph==='recap') return Math.PI/2;
  return Math.PI/2*(1-Math.min(1,d.t/45));
}
function drawDeadSoldier(p){
  const d=death,ang=deathAng();
  if(d.ph!=='revive'||d.t<30){const pf=d.ph==='fall'?Math.min(1,Math.max(0,(d.t-20)/110)):1,fade=d.ph==='revive'?1-d.t/30:1;
    ctx.fillStyle='rgba(110,8,8,'+(.85*fade)+')';ctx.beginPath();ctx.ellipse(p.x-p.face*30*pf,GROUND+7,12+62*pf,3+9*pf,0,0,7);ctx.fill();ctx.fillStyle='rgba(60,2,2,'+(.5*fade)+')';ctx.beginPath();ctx.ellipse(p.x-p.face*30*pf,GROUND+8,8+40*pf,2+5*pf,0,0,7);ctx.fill()}
  const sh=d.ph==='fall'&&d.t<18?Math.sin(d.t*1.8)*3:0;
  ctx.save();ctx.translate(p.x+sh,GROUND-12);ctx.rotate(-p.face*ang);ctx.translate(-p.x,-(GROUND-12));
  const y0=p.y;p.y=GROUND;drawSoldier(p);p.y=y0;ctx.restore();
}
function drawRecap(){
  const d=death,t=d.t,cx=W/2,x0=cx-270,top=Math.max(40,H/2-210);
  const a=Math.min(1,t/30);
  ctx.fillStyle='rgba(8,0,0,'+(.84*a)+')';ctx.fillRect(0,0,W,H);
  const rg=ctx.createRadialGradient(cx,H/2,60,cx,H/2,H);rg.addColorStop(0,'rgba(120,0,0,0)');rg.addColorStop(1,'rgba(120,0,0,'+(.5*a)+')');ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=a;barbed(0,W,20,1);skull(cx,top+20,1.2,'#d8d0c0');
  ctx.textAlign='center';ctx.font='400 56px '+TITLE;ctx.fillStyle='#000';ctx.fillText('VOUS ÊTES MORT',cx+3,top+113);ctx.fillStyle='#b3241c';ctx.fillText('VOUS ÊTES MORT',cx,top+110);
  ctx.globalAlpha=1;
  panel(x0,top+130,540,150,{});
  const rows=[['KILLS',kills+' zombies tués',runSrc.kill],['MANCHES','manche '+wave,runSrc.wave],['BONUS','boss, cadeaux, butin',runSrc.bonus]];
  rows.forEach(([lab,sub,r],i)=>{
    const t0=20+i*40,v=Math.max(0,Math.min(1,(t-t0)/36));if(v<=0) return;
    const y=top+160+i*34;ctx.globalAlpha=Math.min(1,v*2);
    ctx.textAlign='left';ctx.fillStyle='#e8e0d0';ctx.font='700 20px '+FONT;ctx.fillText(lab,x0+20,y);ctx.fillStyle='#8a8178';ctx.font='500 13px '+FONT;ctx.fillText(sub,x0+110,y);
    ctx.textAlign='right';ctx.fillStyle='#9fd18a';ctx.font='700 20px '+FONT;ctx.fillText('XP +'+Math.round(r.x*v),x0+420,y);ctx.fillStyle='#e0a526';ctx.fillText('$ +'+Math.round(r.c*v),x0+520,y);
    ctx.globalAlpha=1;
  });
  if(t>140){
    const v=Math.min(1,(t-140)/30);ctx.globalAlpha=v;ctx.textAlign='left';ctx.fillStyle='#fff';ctx.font='700 22px '+FONT;ctx.fillText('TOTAL',x0+20,top+268);
    ctx.textAlign='right';ctx.fillStyle='#9fd18a';ctx.fillText('XP +'+runXp,x0+420,top+268);ctx.fillStyle='#e0a526';ctx.fillText('$ +'+money,x0+520,top+268);ctx.globalAlpha=1;
  }
  if(t>170){
    const f=Math.min(1,(t-170)/130),val=xpStart+runXp*f,l0=levelOf(xpStart),l1=levelOf(val);
    if(l1>(d.lv||l0)){d.lv=l1;d.pulse=45}
    if(d.pulse>0) d.pulse--;
    const by=top+318,bw=540,info=drawXpBar(x0,by,bw,16,val,d.pulse||0);
    ctx.textAlign='left';ctx.fillStyle=d.pulse>0?'#ffd45a':'#f2efe8';ctx.font='700 22px '+FONT;ctx.fillText(tr('Niveau').toUpperCase()+' '+info.L,x0,by-10);
    ctx.textAlign='right';ctx.fillStyle='#d8d2c8';ctx.font='500 15px '+FONT;ctx.fillText(Math.floor(val-info.a)+' / '+(info.b-info.a)+' XP',x0+bw,by-10);
    if(d.pulse>0){ctx.textAlign='center';ctx.globalAlpha=Math.min(1,d.pulse/20);ctx.fillStyle='#ffd45a';ctx.font='700 20px '+FONT;ctx.fillText('NIVEAU SUPÉRIEUR !',cx,by+42);ctx.globalAlpha=1}
  }
  if(t>300){
    ctx.textAlign='center';const pul=.75+.25*Math.sin(t*.15);ctx.globalAlpha=Math.min(1,(t-300)/30)*pul;
    ctx.fillStyle='#ff9ac0';ctx.font='700 26px '+FONT;ctx.fillText('SECONDE VIE : retour avec '+bl('revive')*10+' % de PV',cx,top+400);
    ctx.globalAlpha=1;ctx.fillStyle='#8a8178';ctx.font='500 14px '+FONT;ctx.fillText('Entrée ou clic pour continuer',cx,top+424);
  }
  ctx.textAlign='left';
}
function drawDeathUi(){
  const d=death;if(!d) return;
  if(d.ph==='fall'){
    overlayFx(Math.min(.9,d.t/70));
    if(d.t>70){ctx.globalAlpha=Math.min(1,(d.t-70)/50);ctx.textAlign='center';ctx.font='400 56px '+TITLE;ctx.fillStyle='#000';ctx.fillText('VOUS ÊTES MORT',W/2+3,H*.3+3);ctx.fillStyle='#b3241c';ctx.fillText('VOUS ÊTES MORT',W/2,H*.3);ctx.globalAlpha=1;ctx.textAlign='left'}
  }else if(d.ph==='recap') drawRecap();
  else{
    if(d.t<40){ctx.fillStyle='rgba(255,255,255,'+(1-d.t/40)*.9+')';ctx.fillRect(0,0,W,H)}
    const bw=260,bx=W/2-bw/2,by=H-90,f=Math.min(1,d.t/45),hp=player.hp/player.maxhp;
    ctx.globalAlpha=Math.min(1,(75-d.t)/20);panel(bx-10,by-34,bw+20,64,{norivets:true});
    ctx.fillStyle='#ff9ac0';ctx.font='700 18px '+FONT;ctx.textAlign='center';ctx.fillText('SECONDE VIE',W/2,by-12);
    ctx.fillStyle='#2a1a1e';ctx.fillRect(bx,by,bw,14);ctx.fillStyle='#e0457a';ctx.fillRect(bx,by,bw*hp*f,14);ctx.globalAlpha=1;ctx.textAlign='left';
  }
}
function finishRunHook(){}
addEventListener('keydown',e=>{if(death&&death.ph==='recap'&&death.t>90&&(e.code==='Enter'||e.code==='Space')) death.t=death.end});
addEventListener('pointerdown',()=>{if(death&&death.ph==='recap'&&death.t>90) death.t=death.end});

