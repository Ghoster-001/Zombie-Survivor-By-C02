// ===== Mode NIGHTMARE (2D + 3D) : une arme par catégorie (molette / touches pour changer), vagues infinies, zombies ultra forts, munitions illimitées =====
const NM={on:false,mpWanted:false,bonus:true,load:[],idx:0,cnt:1.5,diff:{id:'nightmare',n:'NIGHTMARE',g:9,hp:3,dmg:2,sp:1.25},map:null};
const nmCats=()=>[...new Set(WEAPONS.map(w=>w.cat))];
const nmOwned=cat=>WEAPONS.map((w,i)=>i).filter(i=>WEAPONS[i].cat===cat&&!!save.own[WEAPONS[i].name]);
function nmSel(cat){const l=nmOwned(cat);if(!l.length) return -1;const nm=(save.nmSel||{})[cat],i=l.find(k=>WEAPONS[k].name===nm);return i===undefined?(cat==='MÊLÉE'?mainMelee(WEAPONS.findIndex(w=>w.name===save.melee)):l[0]):i}
function nmCycleSel(cat,d){const l=nmOwned(cat);if(!l.length) return;const cur=nmSel(cat),k=(l.indexOf(cur)+d+l.length)%l.length;save.nmSel=save.nmSel||{};save.nmSel[cat]=WEAPONS[l[k]].name;persist()}
function nmScale(w){w=Math.max(1,w|0);Object.assign(NM.diff,{hp:3*Math.pow(1.2,w-1),dmg:2*Math.pow(1.1,w-1),sp:Math.min(1.45,1.25+.03*w),g:NM.bonus?9:10});NM.cnt=1.5*Math.pow(1.07,w-1)}
function nmInit(){
  if(MP.on){NM.load=[];NM.idx=0;nmScale(1);return}                          // multijoueur : pas de sélection d'armes, seulement la difficulté Nightmare
  NM.load=nmCats().map(nmSel).filter(i=>i>=0);if(!NM.load.length) NM.load=[mainMelee(-1)];
  NM.idx=0;const mi=NM.load.find(i=>WEAPONS[i].melee);if(mi!==undefined){player.melee=mi}nmSelect(0);nmScale(1);
}
function nmSelect(i){
  const n=NM.load.length;if(!n) return;NM.idx=((i%n)+n)%n;const w=NM.load[NM.idx];
  if(WEAPONS[w].melee){player.gun=null;player.melee=w;player.w=w}else{player.gun={w,ammo:1e9,time:0,a0:1e9,t0:0};player.w=w}
  player.cd=Math.max(player.cd||0,120);
}
function nmCycle(d){if(!NM.on||!player||player.dead) return;nmSelect(NM.idx+d);sfx('click');if(FW&&FW.on) FW.swapT=1}
function nmStart(){
  if(MP.on) return;
  NM.on=true;NM.bonus=save.nmBonus!==false;nmScale(1);training=false;mapTrain=false;reset(false);
}
function drawNmSetup(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('NIGHTMARE',43,61);ctx.fillStyle='#e2542e';ctx.fillText('NIGHTMARE',40,58);ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,200,3);
  ctx.fillStyle='#b9b1a6';ctx.font='500 13px '+FONT;
  ctx.fillText('Mode infini : zombies ultra forts, de plus en plus nombreux à chaque vague. Munitions illimitées. Une arme par catégorie, changée à la molette (haut = suivante, bas = précédente).',40,90,880);
  ctx.fillStyle='#ffd45a';ctx.font='700 14px '+FONT;ctx.fillText('MEILLEURE VAGUE : '+(save.nmBest|0)+'   ·   disponible en 2D et en 3D (selon le MODE du menu : '+gameMode+')',40,110,880);
  const cats=nmCats();
  cats.forEach((c,i)=>{
    const col=i%2,row=Math.floor(i/2),x=40+col*445,y=124+row*44,l=nmOwned(c),cur=nmSel(c),nm=cur>=0?WEAPONS[cur].name:'— aucune arme —';
    panel(x,y,435,38,{norivets:true,grunge:.7});
    ctx.fillStyle='#8a8178';ctx.font='700 12px '+FONT;ctx.fillText(c,x+10,y+15);ctx.fillStyle=cur>=0?'#f2efe8':'#6b625b';ctx.font='700 16px '+FONT;ctx.fillText(tr(nm).toUpperCase(),x+10,y+33,260);
    if(l.length>1){btn(menuRects,x+300,y+4,60,30,'◀',{act:()=>nmCycleSel(c,-1),size:16});btn(menuRects,x+368,y+4,60,30,'▶',{act:()=>nmCycleSel(c,1),size:16})}
    else if(l.length){ctx.fillStyle='#6b625b';ctx.font='500 12px '+FONT;ctx.textAlign='right';ctx.fillText('1 arme',x+425,y+25);ctx.textAlign='left'}
  });
  const by=124+Math.ceil(cats.length/2)*44+4;
  const bon=save.nmBonus!==false;
  btn(menuRects,40,by,430,40,'BONUS : '+(bon?'ACTIVÉS  (gains ×9)':'DÉSACTIVÉS  (gains ×10)'),{act:()=>{save.nmBonus=!bon;persist()},size:16});
  const mp=MAPS.find(m=>m.id===save.sel.map)||MAPS[0];
  btn(menuRects,485,by,430,40,'CARTE : '+mp.name+'  ›',{act:()=>{const k=MAPS.indexOf(mp);save.sel.map=MAPS[(k+1)%MAPS.length].id;persist()},size:16});
  btn(menuRects,40,Math.min(by+50,484),200,44,'RETOUR',{act:()=>{state='playhub'},size:20});
  btn(menuRects,250,Math.min(by+50,484),400,44,'LANCER NIGHTMARE',{act:nmStart,size:22});
  ctx.fillStyle='#8a8178';ctx.font='500 12px '+FONT;ctx.fillText('Touches : '+keyName(KEYS.wnext[0]||'')+' / '+keyName(KEYS.wprev[0]||'')+' (configurables dans Options › Touches) · chiffres 1-9 : choisir directement',40,Math.min(by+104,534),880);
}
function nmHud(){
  if(!NM.on||!NM.load.length) return;const n=NM.load.length,w=58,x0=W/2-n*w/2,y=H-(FW&&FW.on?118:66);
  for(let i=0;i<n;i++){const wi=NM.load[i],on=i===NM.idx,x=x0+i*w;
    ctx.fillStyle=on?'rgba(120,30,16,.85)':'rgba(0,0,0,.6)';ctx.fillRect(x+1,y,w-2,34);ctx.strokeStyle=on?'#ffd45a':'#4a3a2e';ctx.lineWidth=on?2:1;ctx.strokeRect(x+1.5,y+.5,w-3,33);
    try{drawWeaponIcon(wi,x+w/2,y+17,w-8,26,skinOf(wi),woodOf(wi))}catch(e){}
    ctx.fillStyle='#fff';ctx.font='700 10px '+FONT;ctx.textAlign='left';ctx.fillText(String(i+1),x+4,y+11)}
  ctx.textAlign='center';ctx.fillStyle='#e2542e';ctx.font='700 12px '+FONT;ctx.fillText('NIGHTMARE · VAGUE '+wave+'  ·  ×'+NM.diff.g+' gains',W/2,y-5);ctx.textAlign='left';
}
addEventListener('wheel',e=>{if(NM.on&&state==='play'&&!paused&&!MP.on){nmCycle((e.deltaY<0?1:-1)*(SET.wheelInv?-1:1))}},{passive:true});
addEventListener('keydown',e=>{
  if(!NM.on||e.repeat||(state!=='play'&&state!=='fw')) return;
  if(KEYS.wnext.includes(e.code)) nmCycle(1);else if(KEYS.wprev.includes(e.code)) nmCycle(-1);
  else if(/^Digit[1-9]$/.test(e.code)&&state==='play'){const k=+e.code.slice(5)-1;if(k<NM.load.length) nmSelect(k)}
  else if(/^Digit[1-9]$/.test(e.code)&&state==='fw'){const k=+e.code.slice(5)-1;if(k<NM.load.length) nmSelect(k)}
});
