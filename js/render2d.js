function drawBackground(){
  const g=ctx.createLinearGradient(0,0,0,GROUND);
  g.addColorStop(0,PAL.sky[0]);g.addColorStop(.45,PAL.sky[1]);g.addColorStop(.8,PAL.sky[2]);g.addColorStop(1,PAL.sky[3]);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,GROUND);
  if(bloodSnow>0){ctx.fillStyle='rgba(120,6,14,'+(.42*bloodSnow)+')';ctx.fillRect(0,0,W,GROUND)}
  const sx=W*.79-camX*.03;
  const sg=ctx.createRadialGradient(sx,150,6,sx,150,130);sg.addColorStop(0,'rgba(240,170,100,.5)');sg.addColorStop(.4,'rgba(200,90,50,.22)');sg.addColorStop(1,'rgba(200,90,50,0)');
  ctx.fillStyle=sg;ctx.fillRect(sx-200,0,400,330);
  ctx.fillStyle='rgba('+PAL.sun+',.5)';ctx.beginPath();ctx.arc(sx,150,30,0,7);ctx.fill();
  if(FXF.lights){                                                       // rayons de lumière à travers la poussière
    ctx.save();ctx.globalCompositeOperation='lighter';const kk=.07*(1-Math.min(.9,(curMap.dark||0)*2))*(FXF.xtra?1.4:1);
    for(let k=0;k<(FXF.xtra?9:5);k++){const a0=sx-120-k*150+Math.sin(ATK*.004+k)*20,a1=a0-110;const g=ctx.createLinearGradient(sx,150,a0,GROUND);g.addColorStop(0,'rgba('+PAL.sun+','+(kk*1.4)+')');g.addColorStop(1,'rgba('+PAL.sun+',0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(sx-6,150);ctx.lineTo(sx+6,150);ctx.lineTo(a0+60,GROUND);ctx.lineTo(a1,GROUND);ctx.closePath();ctx.fill()}
    ctx.restore()}
  ctx.fillStyle='rgba(255,255,255,.2)';for(let i=0;i<26;i++) ctx.fillRect((((i*131-camX*.05)%W)+W)%W,(i*47)%140,1.6,1.6);
  for(const far of [true,false]){
    const par=far?.4:.7,vx=camX*par;
    ctx.save();ctx.translate(-vx,0);
    BUILDINGS.forEach((b,n)=>{
      if(b.far!==far||b.x+b.w<vx-10||b.x>vx+W+10) return;
      const h=far?b.h*.8:b.h,top=GROUND-h;
      ctx.fillStyle=far?PAL.far:PAL.near;                                      // silhouette en ruine (sommet déchiqueté)
      ctx.beginPath();ctx.moveTo(b.x,GROUND);ctx.lineTo(b.x,top+(n*7%14));ctx.lineTo(b.x+b.w*.3,top);ctx.lineTo(b.x+b.w*.55,top+(n*5%18));
      ctx.lineTo(b.x+b.w*.8,top+4);ctx.lineTo(b.x+b.w,top+(n*3%12));ctx.lineTo(b.x+b.w,GROUND);ctx.closePath();ctx.fill();
      for(let wy=top+20;wy<GROUND-20;wy+=22)
        for(let wx=b.x+8;wx<b.x+b.w-10;wx+=18){
          const k=((wx*7+wy*3)|0)%7;
          if(k>4&&!far){ctx.fillStyle='rgba('+PAL.win+','+(.45+.3*Math.sin(ATK*.04+wx))+')';ctx.fillRect(wx,wy,7,10)}
          else if(k>1){ctx.fillStyle=far?'rgba(0,0,0,.25)':'rgba(0,0,0,.55)';ctx.fillRect(wx,wy,7,10)}
        }
    });
    if(!far){
      for(const n of FIRES){                                                      // incendies et fumée sur les toits
        const b=BUILDINGS[n];if(!b||b.x+b.w<vx-60||b.x>vx+W+60) continue;
        const cx=b.x+b.w/2,top=GROUND-b.h;
        for(let k=0;k<(FXF.anim===2?10:FXF.anim===1?4:0);k++){
          const pr=((tick*.5+k*14)%140)/140,y=top-pr*130,x=cx+Math.sin(tick*.02+k)*8+pr*40;
          ctx.fillStyle='rgba(28,22,24,'+(.26*(1-pr))+')';ctx.beginPath();ctx.arc(x,y,8+k*2.4+pr*16,0,7);ctx.fill();
        }
        flame(cx,top+4,1);
      }
    }
    ctx.restore();
  }
  drawFog(false);
  const fg=ctx.createLinearGradient(0,GROUND-70,0,GROUND+12);fg.addColorStop(0,'rgba('+PAL.fog+',0)');fg.addColorStop(1,'rgba('+PAL.fog+',.22)');
  ctx.fillStyle=fg;ctx.fillRect(0,GROUND-70,W,82);                                 // brume
  // --- sol et accessoires : défilent avec la caméra
  ctx.save();ctx.translate(-camX,0);
  const x0=camX,x1=camX+W;
  for(const x of STACKS) if(x>x0-60&&x<x1+60) crateStack(x);
  for(const [x,fl] of WRECKS) if(x>x0-200&&x<x1+200) wreck(x+52,fl);
  for(const x of LAMPS) if(x>x0-80&&x<x1+80) lamp(x);
  for(const x of BARRELS) if(x>x0-60&&x<x1+60) barrel(x);
  const rg=ctx.createLinearGradient(0,GROUND,0,H);rg.addColorStop(0,PAL.road[0]);rg.addColorStop(1,PAL.road[1]);
  ctx.fillStyle=rg;ctx.fillRect(x0,GROUND,W,H-GROUND);                             // route
  if(bloodSnow>0){const b=bloodSnow;ctx.fillStyle='rgba(110,6,14,'+(.66*b)+')';ctx.fillRect(x0,GROUND,W,H-GROUND);ctx.fillStyle='rgba(180,14,24,'+(.22*b)+')';
    for(let k=0;k<40;k++){const x=(k*131+17)%WORLD_W;if(x<x0-70||x>x1+70) continue;ctx.beginPath();ctx.ellipse(x,GROUND+22+(k*11%44),32+(k%4)*10,5,0,0,7);ctx.fill()}}   // le sol disparaît sous le sang
  {const sh=ctx.createLinearGradient(0,GROUND+10,0,GROUND+70);sh.addColorStop(0,'rgba(255,255,255,.07)');sh.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=sh;ctx.fillRect(x0,GROUND+10,W,60)}   // reflet de route mouillée
  ctx.fillStyle=PAL.walk;ctx.fillRect(x0,GROUND,W,8);if(bloodSnow>0){ctx.fillStyle='rgba(150,10,20,'+(.7*bloodSnow)+')';ctx.fillRect(x0,GROUND,W,8)}ctx.fillStyle='#1d1a21';ctx.fillRect(x0,GROUND+8,W,2);   // trottoir
  ctx.fillStyle='rgba(216,196,106,.5)';
  for(let x=Math.floor(x0/120)*120+20;x<x1;x+=120) ctx.fillRect(x,GROUND+34,60,5);   // marquage usé
  ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=1.2;                              // fissures
  for(let c=0;c<34;c++){const x=40+c*108;if(x<x0-50||x>x1) continue;const y=GROUND+16+(c*13%30);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+14,y+6);ctx.lineTo(x+22,y-2);ctx.lineTo(x+40,y+8);ctx.stroke()}
  ctx.fillStyle='rgba(0,0,0,.3)';for(let c=0;c<70;c++){const x=(c*271+13)%WORLD_W;if(x<x0-10||x>x1) continue;ctx.fillRect(x,GROUND+14+(c*17%50),6+(c%3)*4,2)}   // gravats
  // limites de la map : murs de béton
  for(const [wx,dir] of [[0,-1],[WORLD_W,1]]){
    if(wx===0?x0>40:x1<WORLD_W-40) continue;
    const bx=dir<0?0:WORLD_W-60;ctx.fillStyle='#0a0810';ctx.fillRect(dir<0?-1200:WORLD_W,0,1200,H);
    ctx.fillStyle='#2a262e';ctx.fillRect(bx,GROUND-170,60,170);ctx.fillStyle='#3a3540';ctx.fillRect(bx+(dir<0?50:0),GROUND-170,10,170);
    hazard(bx,GROUND-26,60,12);hazard(bx,GROUND-170,60,12);
  }
  ctx.restore();
}
const OUTFITS=[
 {n:'SOLDAT',top:'#55733f',pants:'#3b4a2f',hat:'#3f5530',shoes:'#1e1e1e',hair:'#4a3020',head:'helmet',body:'vest'},
 {n:'COMMANDO',top:'#2f3a30',pants:'#47503a',hat:'#b3241c',shoes:'#2a2220',hair:'#2a1c14',head:'bandana',body:'tank'},
 {n:'SURVIVANT',top:'#6a6f78',pants:'#3a4660',hat:'#8a3f2f',shoes:'#4a3a2a',hair:'#6a4a2a',head:'cap',body:'hoodie'},
 {n:'SWAT',top:'#262a33',pants:'#1d2027',hat:'#1b1e25',shoes:'#0f0f12',hair:'#3a2a20',head:'swat',body:'vest'},
 {n:'CHASSEUR',top:'#a0442c',pants:'#5a4630',hat:'#6b4a2a',shoes:'#3a2a1c',hair:'#8a5a30',head:'hat',body:'flannel'},
 {n:'SCIENTIFIQUE',top:'#e8e8e4',pants:'#4a5266',hat:'#2a2a30',shoes:'#2a2a2a',hair:'#bfb08a',head:'glasses',body:'coat'},
 {n:'MOTARD',top:'#1c1c20',pants:'#2e3a52',hat:'#d8a626',shoes:'#141414',hair:'#2a2a2a',head:'shades',body:'jacket'},
 // ===== Pack de fêtes (payant) : chaque tenue existe en version homme et femme =====
 {n:'PÈRE NOËL',nf:'MÈRE NOËL',id:'noel',cost:400,pack:1,top:'#c4161c',pants:'#a31217',hat:'#c4161c',shoes:'#16161a',hair:'#f2f2f2',head:'santa',body:'santa',belly:true,skirt:true},
 {n:'LUTIN',nf:'LUTINE',id:'lutin',cost:250,pack:1,top:'#2e8b3d',pants:'#c4161c',hat:'#2e8b3d',shoes:'#d8b030',hair:'#8a5a30',head:'elf',body:'elf',skirt:true},
 {n:'RENNE',id:'renne',cost:300,pack:1,top:'#8a5a30',pants:'#5a3a1e',hat:'#6b4423',shoes:'#3a2412',hair:'#5a3a1e',head:'reindeer',body:'reindeer'},
 {n:'BONHOMME DE NEIGE',id:'neige',cost:350,pack:1,top:'#f4f6fa',pants:'#dfe5ee',hat:'#1a1a1f',shoes:'#2a2a2a',hair:'#dfe5ee',head:'snow',body:'snow',skin:'#f4f6fa'},
 {n:'CASSE-NOISETTE',id:'noisette',cost:300,pack:1,top:'#b3141c',pants:'#1a2a6a',hat:'#1a1a1a',shoes:'#1a1a1a',hair:'#3a2a20',head:'nut',body:'nut'},
 {n:"PAIN D'ÉPICE",id:'epice',cost:250,pack:1,top:'#a8662f',pants:'#8a4f22',hat:'#a8662f',shoes:'#6b3a18',hair:'#a8662f',head:'ginger',body:'ginger',skin:'#b8733f'},
 {n:'KRAMPUS',id:'krampus',cost:500,pack:1,top:'#2a1e1a',pants:'#1a1210',hat:'#1a1a1a',shoes:'#0f0a08',hair:'#2a1e1a',head:'krampus',body:'krampus',skin:'#7a2a24'},
 {n:"CANNE D'ORGE",id:'candy',cost:200,pack:1,top:'#d62d3a',pants:'#f4f4f4',hat:'#d62d3a',shoes:'#d62d3a',hair:'#f4f4f4',head:'candy',body:'candy'},
 {n:'PÈRE FOUETTARD',nf:'MÈRE FOUETTARDE',id:'fouettard',cost:450,pack:1,top:'#1d1620',pants:'#120d16',hat:'#1d1620',shoes:'#0c0a0e',hair:'#8a8a94',head:'fouet',body:'fouet',skirt:true},
 {n:'SAPIN DE NOËL',id:'sapin',cost:500,pack:1,zk:'tree',top:'#1f6a34',pants:'#1a4a26',hat:'#e0b030',shoes:'#3a2412',hair:'#3a2a20',head:'star',body:'tree'},
 // ===== Skins ZOMBIES (gratuits) : tous les zombies du jeu sont jouables =====
 {n:'ZOMBIE',id:'z_normal',pack:2,zk:'normal',top:'#4d6a8a',pants:'#3d3d45',hat:'#2f3b25',shoes:'#2a2a2a',hair:'#2f3b25',head:'zhead',body:'zbody',skin:'#7fb069'},
 {n:'COUREUR',id:'z_fast',pack:2,zk:'fast',top:'#8a3f3f',pants:'#3d3d45',hat:'#3a4a1a',shoes:'#2a2a2a',hair:'#3a4a1a',head:'zhead',body:'zbody',skin:'#a9c45a'},
 {n:'COLOSSE',id:'z_tank',pack:2,zk:'tank',top:'#4a3a5a',pants:'#3a3340',hat:'#2f3b25',shoes:'#222',hair:'#222',head:'zhead',body:'zbody',skin:'#6f8f5a',build:1},
 {n:'FOUISSEUR',id:'z_digger',pack:2,zk:'digger',top:'#5a4636',pants:'#4a3a2a',hat:'#3a2e22',shoes:'#2a2018',hair:'#3a2e22',head:'zhead',body:'zbody',skin:'#a89478'},
 {n:'BOSS : LE COLOSSE',s:'BOSS COLOSSE',id:'z_brute',pack:2,zk:'brute',top:'#3a2220',pants:'#2a1a18',hat:'#2a1a18',shoes:'#140c0a',hair:'#1a1210',head:'zhead',body:'zbody',skin:'#8a3a30',build:1},
 {n:'BOSS : LE CRACHEUR',s:'BOSS CRACHEUR',id:'z_spitter',pack:2,zk:'spitter',top:'#3a5a2a',pants:'#2a3a1e',hat:'#2a3a1e',shoes:'#1a2412',hair:'#1a2412',head:'zhead',body:'zbody',skin:'#7ab04a'},
 {n:"BOSS : L'INVOCATEUR",s:'BOSS INVOCATEUR',id:'z_summoner',pack:2,zk:'summoner',top:'#4a2a6a',pants:'#2a1a3a',hat:'#2a1a3a',shoes:'#140c1c',hair:'#e0e0e0',head:'zhead',body:'zbody',skin:'#8a9aa8'},
 {n:'LE MAGICIEN SANGLANT',s:'MAGICIEN',id:'z_mage',pack:2,zk:'mage',top:'#5a0f1c',pants:'#3a0a12',hat:'#1a0a10',shoes:'#140808',hair:'#e8d8c8',head:'zhead',body:'zbody',skin:'#d8d0c8'},
 {n:'ZOMBIE NOËL',s:'Z. NOËL',id:'z_santa',pack:2,zk:'normal',top:'#a01418',pants:'#701014',hat:'#c4161c',shoes:'#16161a',hair:'#f2f2f2',head:'santa',body:'santa',skin:'#7fb069'},
 {n:'ZOMBIE LUTIN',s:'Z. LUTIN',id:'z_elf',pack:2,zk:'normal',top:'#2e8b3d',pants:'#8a1218',hat:'#2e8b3d',shoes:'#a88020',hair:'#8a5a30',head:'elf',body:'elf',skin:'#8ab879'},
 {n:'ZOMBIE FOUETTARD',s:'Z. FOUETTARD',id:'z_fouet',pack:2,zk:'normal',top:'#1d1620',pants:'#120d16',hat:'#1d1620',shoes:'#0c0a0e',hair:'#8a8a94',head:'fouet',body:'fouet',skin:'#6a8a5a'},
 {n:'CHIEN ZOMBIE',id:'z_dog',pack:2,an:'dog',col:'#7a6a58',top:'#7a6a58',pants:'#4a4038',hat:'#4a4038',shoes:'#222',hair:'#4a4038',head:'none',body:'none'},
 {n:'CERF ZOMBIE',id:'z_deer',pack:2,an:'deer',col:'#8a5a30',top:'#8a5a30',pants:'#5a3a1e',hat:'#5a3a1e',shoes:'#222',hair:'#5a3a1e',head:'none',body:'none'},
 {n:'PINGOUIN ZOMBIE',s:'PINGOUIN Z.',id:'z_peng',pack:2,an:'peng',col:'#2a2f3a',top:'#2a2f3a',pants:'#1a1d24',hat:'#1a1d24',shoes:'#222',hair:'#1a1d24',head:'none',body:'none'},
 // ===== V0.81 : nouvelles tenues classiques (gratuites) =====
 {n:'MÉDECIN',nf:'MÉDECIN',top:'#eef2f4',pants:'#3a6aa0',hat:'#3a6aa0',shoes:'#e8e8e8',hair:'#5a3a24',head:'glasses',body:'coat'},
 {n:'POMPIER',top:'#b3241c',pants:'#2a2a30',hat:'#e0b030',shoes:'#141414',hair:'#3a2a20',head:'helmet',body:'jacket'},
 {n:'POLICIER',nf:'POLICIÈRE',top:'#1f2f55',pants:'#18223a',hat:'#1a2440',shoes:'#0f0f12',hair:'#2a1c14',head:'cap',body:'vest'},
 {n:'AGENT',top:'#141418',pants:'#141418',hat:'#141418',shoes:'#0a0a0a',hair:'#1a1a1a',head:'shades',body:'coat'},
 {n:'BÛCHERON',nf:'BÛCHERONNE',top:'#8a1f1f',pants:'#3a4660',hat:'#2a2a2a',shoes:'#4a3020',hair:'#7a4a24',head:'hat',body:'flannel'},
 {n:'PILOTE',top:'#5a6a3a',pants:'#4a5530',hat:'#4a3a28',shoes:'#2a2018',hair:'#5a3a24',head:'cap',body:'jacket'},
 {n:'PUNK',top:'#202024',pants:'#3a1f4a',hat:'#d6247a',shoes:'#141414',hair:'#d6247a',head:'bandana',body:'tank'},
 {n:'CAMOUFLAGE NEIGE',s:'CAMO NEIGE',top:'#e4e8ee',pants:'#c8ced8',hat:'#dfe4ea',shoes:'#3a3a40',hair:'#4a3020',head:'helmet',body:'vest'}
];
const outOwned=i=>{const o=OUTFITS[i];return !!o&&(!o.cost||!!save.skinsOwned[o.id])};
function lookCols(){const L=save.look,O=(outOwned(L.outfit)||L.outfit===prevO)&&OUTFITS[L.outfit]||OUTFITS[0];
  return{O,f:L.sex==='f',big:L.build===1||O.build===1,skin:L.skin||O.skin||'#e2b58c',hair:L.hair||O.hair,top:L.top||O.top,pants:L.pants||O.pants,hat:L.hat||O.hat,shoes:L.shoes||O.shoes}}
function torsoPath(f,big,yb,belly){
  ctx.beginPath();
  if(belly&&big&&!f){ctx.moveTo(-13,-62);ctx.lineTo(12,-62);ctx.quadraticCurveTo(20,-60,22,-50);ctx.bezierCurveTo(52,-44,52,-6,16,yb+8);ctx.lineTo(-12,yb+8);ctx.closePath();return}   // gros ventre
  if(!big){const w=f?20:22;ctx.roundRect(-w/2,-60,w,yb+60,6);return}
  if(f){                                                   // silhouette sablier exagérée
    ctx.moveTo(-8,-60);ctx.lineTo(8,-60);
    ctx.bezierCurveTo(12,-60,20,-54,17,-46);
    ctx.bezierCurveTo(15,-42,8,-42,8,-38);
    ctx.bezierCurveTo(8,-33,18,-32,17,yb);
    ctx.lineTo(-16,yb);
    ctx.bezierCurveTo(-19,-32,-8,-33,-8,-38);
    ctx.bezierCurveTo(-8,-44,-10,-52,-8,-60);
  } else {                                                 // carrure en V exagérée
    ctx.moveTo(-13,-62);ctx.lineTo(13,-62);ctx.quadraticCurveTo(21,-62,20,-53);
    ctx.lineTo(11,-33);ctx.lineTo(10,yb);ctx.lineTo(-10,yb);ctx.lineTo(-11,-33);
    ctx.lineTo(-20,-53);ctx.quadraticCurveTo(-21,-62,-13,-62);
  }
  ctx.closePath();
}
function drawAkimbo(p,sx,sy,a,C,aw,wp){
  for(const h of [1,0]){
    const hw=WEAPONS[wp.hi[h]],ic=weaponIcon(wp.hi[h]),hs=hw.hs||.45,rc=(h?p.muz1:p.muz0)>0?(h?-3:-4):0;
    ctx.save();ctx.translate(sx-(h?4:0)*p.face,sy+(h?9:-3));ctx.rotate(a+(h?(p.face>0?.14:-.14):-(p.face>0?.03:-.03)));
    if(Math.abs(a)>Math.PI/2) ctx.scale(1,-1);
    limb(0,0,16+rc,0,aw,h?shade(C.O.body==='tank'?C.skin:C.top,-.18):(C.O.body==='tank'?C.skin:C.top));
    ctx.save();ctx.translate(14+rc,1);ctx.scale(hs,hs);ctx.drawImage(ic.cv,-OX/2,-OY/2,ICON_W/2,ICON_H/2);ctx.restore();
    ctx.fillStyle=C.skin;ctx.beginPath();ctx.arc(16+rc,3,4,0,7);ctx.fill();
    if((h?p.muz1:p.muz0)>0){ctx.fillStyle='#ffe27a';ctx.beginPath();ctx.arc(14+ic.mx*hs+4,0,hw.kind==='flamer'?0.1:7,0,7);ctx.fill()}
    ctx.restore();
  }
}
// ----- détails des skins : bottes, ceinture, poches, visage ; effets zombies (plaies, côtes, yeux rouges) ; sapin clignotant -----
function szBoots(sw,C,O){
  ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(-10-sw,-2.6,12,2.6);ctx.fillRect(sw,-2.6,12,2.6);                          // semelles
  ctx.fillStyle='rgba(255,255,255,.28)';for(let i=0;i<3;i++){ctx.fillRect(-3-sw+i*2.4,-7+i*1.6,1.4,1);ctx.fillRect(7+sw+i*2.4,-7+i*1.6,1.4,1)}   // lacets
  if(!O.zk&&!O.skirt){ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-7-sw*.4,-19,7,5);ctx.fillRect(1+sw*.4,-19,7,5)}        // genouillères
}
function szTorso(O,C,f,big,yb){
  const tx=-17,tw=34;
  const g=ctx.createLinearGradient(-17,0,17,0);g.addColorStop(0,'rgba(255,255,255,.11)');g.addColorStop(.55,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.24)');ctx.fillStyle=g;ctx.fillRect(tx-8,-64,tw+16,72);
  ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-60);ctx.lineTo(0,yb);ctx.stroke();ctx.strokeRect(3,-46,9,8);
  if(O.zk&&O.zk!=='tree'){
    const zk=O.zk;
    ctx.fillStyle='rgba(120,12,16,.8)';ctx.beginPath();ctx.ellipse(-5,-45,7,9,.3,0,7);ctx.fill();
    ctx.fillStyle=C.skin;ctx.beginPath();ctx.moveTo(-18,-35);ctx.lineTo(-12,-28);ctx.lineTo(-6,-35);ctx.lineTo(0,-27);ctx.lineTo(7,-35);ctx.lineTo(18,-28);ctx.lineTo(18,-20);ctx.lineTo(-18,-20);ctx.fill();   // t-shirt déchiré
    if(zk!=='mage'&&zk!=='summoner'){ctx.strokeStyle='#e8dcc0';ctx.lineWidth=1.7;for(let k=0;k<4;k++){ctx.beginPath();ctx.moveTo(1,-54+k*5);ctx.quadraticCurveTo(9,-56+k*5,14,-51+k*5);ctx.stroke()}ctx.fillStyle='#2a0608';ctx.beginPath();ctx.ellipse(8,-47,7,10,.1,0,7);ctx.globalCompositeOperation='destination-over';ctx.fill();ctx.globalCompositeOperation='source-over'}
    ctx.fillStyle='rgba(110,10,14,.75)';for(let k=0;k<3;k++) ctx.fillRect(-12+k*9,-30,2.2,6+((k*5)%4)*2);                  // coulures de sang
    if(zk==='brute'||zk==='tank'){ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(-17,-60,8,32)}
    if(zk==='spitter'){ctx.fillStyle='rgba(150,230,70,.55)';ctx.beginPath();ctx.arc(-2,-42,4.5,0,7);ctx.arc(6,-36,3,0,7);ctx.fill()}   // acide
    if(zk==='summoner'||zk==='mage'){ctx.strokeStyle=zk==='mage'?'#c8a040':'#b08aff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,-44,7,0,7);ctx.moveTo(-5,-41);ctx.lineTo(0,-51);ctx.lineTo(5,-41);ctx.lineTo(-6,-47);ctx.lineTo(6,-47);ctx.closePath();ctx.stroke()}   // sceau
    return;
  }
  if(O.skirt&&f) return;
  ctx.fillStyle='#231c16';ctx.fillRect(tx-8,yb-7,tw+16,5);ctx.fillStyle='#c8a850';ctx.fillRect(-3,yb-7.4,6,5.8);ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(-1.5,yb-6,3,2.8);   // ceinture + boucle
  ctx.fillStyle='rgba(0,0,0,.34)';ctx.fillRect(8,yb-14,7,9);ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(8,yb-14,7,1.4);                                    // poche
  if(!O.skirt){ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.moveTo(-17,-58);ctx.lineTo(-9,-60);ctx.lineTo(8,-34);ctx.lineTo(0,-32);ctx.fill()}                  // sangle en bandoulière
  ctx.fillStyle=C.skin;ctx.beginPath();ctx.moveTo(-5,-61);ctx.lineTo(5,-61);ctx.lineTo(0,-54);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-6,-61);ctx.lineTo(0,-53);ctx.lineTo(6,-61);ctx.stroke();   // col
}
function szFace(O,C,f){
  if(O.zk&&O.zk!=='tree'){
    ctx.fillStyle='#f4f4d8';ctx.beginPath();ctx.arc(4.4,-72,3.3,0,7);ctx.fill();ctx.fillStyle='#c0252b';ctx.beginPath();ctx.arc(5.4,-72,1.6,0,7);ctx.fill();
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,40,40,.35)';ctx.beginPath();ctx.arc(5.2,-72,5.5,0,7);ctx.fill();ctx.restore();
    ctx.fillStyle='#3a1a1a';ctx.fillRect(2,-65.4,8,3.6);ctx.fillStyle='#e8e0c0';ctx.fillRect(2.8,-65.4,1.5,2.2);ctx.fillRect(5.8,-65.4,1.5,2.4);ctx.fillRect(8.4,-65.4,1.3,2.2);
    ctx.strokeStyle='#8e1b1b';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-4,-77);ctx.lineTo(-1,-72);ctx.lineTo(-3,-68);ctx.stroke();ctx.fillStyle='rgba(120,12,16,.7)';ctx.beginPath();ctx.moveTo(3,-70);ctx.lineTo(4,-61);ctx.lineTo(5.6,-70);ctx.fill();
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(3,-74.6,3.6,1,0,0,7);ctx.fill();
    return;
  }
  ctx.fillStyle='#f4f1ea';ctx.fillRect(2.4,-72.8,4.4,3.8);ctx.fillStyle='#2a2018';ctx.fillRect(4.2,-72.2,2.4,2.6);ctx.fillStyle='#fff';ctx.fillRect(5.6,-72,.9,.9);
  ctx.fillStyle=shade(C.hair,-.15);ctx.fillRect(2.2,-75.4,5.4,1.3);
  ctx.fillStyle=shade(C.skin,-.13);ctx.fillRect(8.4,-70,2,3.2);ctx.fillStyle='#8a4a3a';ctx.fillRect(5.2,-65.6,4.2,1);
  ctx.beginPath();ctx.ellipse(-6.4,-69,2.3,3.1,0,0,7);ctx.fillStyle=shade(C.skin,-.07);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=.8;ctx.stroke();
  ctx.fillStyle='rgba(0,0,0,.08)';ctx.beginPath();ctx.ellipse(2,-63,7,3,0,0,Math.PI);ctx.fill();
}
function szTree(){                                                          // costume de sapin : trois étages, étoile, guirlandes qui clignotent
  const t=tick,cols=['#ff3a3a','#ffd23a','#3ad0ff','#ff6ad8','#6aff7a'];
  const tier=(yb,ya,hw,c1,c2)=>{const g=ctx.createLinearGradient(-hw,0,hw,0);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,ya);ctx.lineTo(hw,yb);ctx.lineTo(hw*.55,yb+4);ctx.lineTo(0,yb+1);ctx.lineTo(-hw*.55,yb+4);ctx.lineTo(-hw,yb);ctx.closePath();ctx.fill()};
  tier(-24,-56,31,'#1c5a2c','#2f8f48');tier(-42,-72,25,'#1f6a34','#38a455');tier(-58,-86,18,'#237a3c','#44b862');
  ctx.fillStyle='#5a3a1e';ctx.fillRect(-5,-26,10,5);
  for(let i=0;i<3;i++){const yb=[-24,-42,-58][i],hw=[31,25,18][i],ya=[-56,-72,-86][i];
    ctx.strokeStyle=['#ffd23a','#e8e8e8','#ff6a6a'][i];ctx.lineWidth=1.6;ctx.beginPath();for(let k=0;k<=8;k++){const u=k/8,x=-hw*.8+u*hw*1.6,y=yb-(yb-ya)*(.25+.1*Math.sin(u*Math.PI))*(1-Math.abs(u-.5)*1.2)+Math.sin(u*Math.PI)*5;k?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
    for(let k=0;k<6;k++){const u=(k+.5)/6,x=-hw*.8+u*hw*1.6,y=yb-(yb-ya)*(.25+.1*Math.sin(u*Math.PI))*(1-Math.abs(u-.5)*1.2)+Math.sin(u*Math.PI)*5+2;const on=((t>>3)+k+i)%3!==0,c=cols[(k+i+(t>>4))%5];
      ctx.fillStyle=on?c:'#2a2a2a';ctx.beginPath();ctx.arc(x,y,2.4,0,7);ctx.fill();
      if(on){ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=c+'55';ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill();ctx.restore()}}
  }
}
function drawSoldier(p){
  const x=p.x,y=p.y,sw=Math.sin(p.step)*8,C=lookCols(),O=C.O,f=C.f,big=C.big,lw=big?(f?10.5:12):9,aw=big&&!f?11:7;
  ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(x,GROUND+4,16,4,0,0,7);ctx.fill();
  if(O.an) drawAnimalClean({x,y,dir:p.face,step:p.step,size:1,color:O.col,animal:O.an,hh:62,hw:28,gseed:.5,type:'zdog'});
  else{ctx.save();ctx.translate(x,y);ctx.scale(p.face,1);
  limb(-4,-28,-4-sw,-4,lw,C.pants);limb(5,-28,5+sw,-4,lw,shade(C.pants,-.1));        // jambes
  rrect(-10-sw,-8,12,8,3,C.shoes);rrect(0+sw,-8,12,8,3,C.shoes);                  // chaussures
  szBoots(sw,C,O);
  if(f&&O.skirt){const sw2=big?23:18,hm=O.body==='santa'?-5:-10;ctx.fillStyle=C.top;ctx.beginPath();ctx.moveTo(-10,-32);ctx.lineTo(10,-32);ctx.lineTo(sw2,hm);ctx.lineTo(-sw2,hm);ctx.closePath();ctx.fill();ctx.fillStyle=O.body==='santa'?'#f4f4f4':O.body==='fouet'?'#555':'#c4161c';ctx.fillRect(-sw2-.5,hm-4,sw2*2+1,4.5)}   // jupe / robe
  if(O.body==='hoodie'){ctx.fillStyle=shade(C.top,-.25);ctx.beginPath();ctx.arc(-6,-62,8,0,7);ctx.fill()}   // capuche
  const yb=O.body==='coat'?-10:-26,tx=-17,tw=34;
  torsoPath(f,big,yb,O.belly);ctx.fillStyle=C.top;ctx.fill();ctx.save();torsoPath(f,big,yb,O.belly);ctx.clip();   // haut (les détails sont découpés dans la silhouette)
  if(O.body==='vest'||O.body==='tank'){rrect(tx,-34,tw,6,2,'#2d2d2d')}
  if(O.body==='vest') rrect(-7,-54,7,10,2,shade(C.top,-.15));
  if(O.body==='tank'){ctx.fillStyle=C.skin;ctx.beginPath();ctx.arc(0,-60,5,0,Math.PI);ctx.fill()}
  if(O.body==='hoodie') rrect(-7,-42,14,9,3,shade(C.top,-.2));
  if(O.body==='flannel'){ctx.fillStyle=shade(C.top,-.4);for(let i=0;i<4;i++){ctx.fillRect(tx+3+i*5.5,-60,2,34);ctx.fillRect(tx,-56+i*9,tw,2)}}
  if(O.body==='coat'){ctx.fillStyle=shade(C.top,-.15);ctx.beginPath();ctx.moveTo(-5,-60);ctx.lineTo(0,-46);ctx.lineTo(5,-60);ctx.fill();ctx.fillRect(-.7,-46,1.4,36);rrect(3,-34,6,7,1.5,shade(C.top,-.1))}
  if(O.body==='jacket'){ctx.fillStyle='#9a9a9a';ctx.fillRect(1,-58,1.5,32);rrect(tx,-60,tw,5,2,C.hat);rrect(tx,-32,tw,5,2,C.hat)}
  {const bl=O.belly&&big&&!f,bw2=bl?72:34,gx=bl?22:0;
   if(O.body==='santa'){ctx.fillStyle='#f4f4f4';ctx.fillRect(tx,-63,bw2,7);ctx.fillRect(tx,yb-(bl?-1:3),bw2,8);rrect(tx,-40,bw2,7,2,'#16161a');rrect(gx-5,-41,10,9,1.5,'#e0b030');ctx.fillStyle='#16161a';ctx.fillRect(gx-2.5,-39,5,5)}
   else if(O.body==='elf'){ctx.fillStyle='#c4161c';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-17+i*7,-61);ctx.lineTo(-10+i*7,-61);ctx.lineTo(-13.5+i*7,-52);ctx.fill()}rrect(tx,-36,tw,5,1.5,'#5a3a1e');rrect(-4,-37,8,7,1,'#e0b030')}
   else if(O.body==='reindeer'){ctx.fillStyle='#f1e6d6';ctx.beginPath();ctx.ellipse(7,-44,6,10,0,0,7);ctx.fill();rrect(tx,-34,tw,4,1.5,'#3a2412')}
   else if(O.body==='snow'){ctx.fillStyle='#c4161c';ctx.fillRect(tx,-63,tw,8);ctx.fillStyle='#f4f4f4';for(let i=0;i<4;i++) ctx.fillRect(-14+i*9,-63,3,8);ctx.fillStyle='#1a1a1a';for(const yy of[-48,-40,-32]){ctx.beginPath();ctx.arc(2,yy,2.6,0,7);ctx.fill()}}
   else if(O.body==='nut'){ctx.strokeStyle='#f4f4f4';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-13,-60);ctx.lineTo(13,-30);ctx.moveTo(13,-60);ctx.lineTo(-13,-30);ctx.stroke();ctx.fillStyle='#e0b030';for(const xx of[-5,5])for(let k=0;k<4;k++){ctx.beginPath();ctx.arc(xx,-55+k*8,2,0,7);ctx.fill()}rrect(-14,-63,9,5,1,'#e0b030');rrect(5,-63,9,5,1,'#e0b030')}
   else if(O.body==='ginger'){ctx.strokeStyle='#fff';ctx.lineWidth=1.8;ctx.beginPath();for(let i=0;i<9;i++){ctx.lineTo(-17+i*4.4,yb-6+(i%2?3:-1))}ctx.stroke();ctx.fillStyle='#fff';for(const yy of[-50,-40]){ctx.beginPath();ctx.arc(1,yy,2.8,0,7);ctx.fill();ctx.fillStyle='#d62d3a';ctx.beginPath();ctx.arc(1,yy,1.2,0,7);ctx.fill();ctx.fillStyle='#fff'}}
   else if(O.body==='krampus'){ctx.fillStyle=shade(C.top,.3);for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(-18+i*5,-62);ctx.lineTo(-14+i*5,-62);ctx.lineTo(-16+i*5,-50);ctx.fill();ctx.beginPath();ctx.moveTo(-18+i*5,yb+2);ctx.lineTo(-14+i*5,yb+2);ctx.lineTo(-16+i*5,yb-10);ctx.fill()}ctx.fillStyle='#8a8a8a';ctx.fillRect(-17,-40,tw,2.5)}
   else if(O.body==='fouet'){ctx.fillStyle='#b3141c';ctx.fillRect(tx,-63,tw,7);ctx.fillStyle=shade(C.top,.25);for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(-18+i*5.6,yb+4);ctx.lineTo(-13+i*5.6,yb+4);ctx.lineTo(-15.5+i*5.6,yb-9);ctx.fill()}ctx.fillStyle='#777';ctx.fillRect(tx,-40,tw,3)}
   else if(O.body==='candy'){ctx.fillStyle='#f4f4f4';for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(-24+i*9,-64);ctx.lineTo(-18+i*9,-64);ctx.lineTo(-38+i*9,-18);ctx.lineTo(-44+i*9,-18);ctx.closePath();ctx.fill()}}}
  szTorso(O,C,f,big,yb);
  ctx.restore();
  if(O.body==='tree') szTree();
  // tête
  if(f){ctx.fillStyle=C.hair;ctx.beginPath();ctx.ellipse(-9,-62,5.5,13,.12,0,7);ctx.fill()}    // cheveux longs / queue
  ctx.fillStyle=C.skin;ctx.beginPath();ctx.arc(0,-70,9,0,7);ctx.fill();
  ctx.fillStyle='#222';ctx.fillRect(3,-72,3,3);
  szFace(O,C,f);
  if(f){ctx.strokeStyle='#222';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(3,-73);ctx.lineTo(7.5,-75);ctx.stroke();ctx.fillStyle='#c0392b';ctx.fillRect(4.5,-65,3.5,1.6)}
  const covered=['helmet','cap','swat','hat','santa','elf','snow','nut','candy','ginger','fouet'].includes(O.head);
  if(covered&&['santa','elf','candy'].includes(O.head)&&!f){ctx.fillStyle=C.hair;ctx.fillRect(-9.8,-74,3.2,9)}
  if(!covered){ctx.fillStyle=C.hair;ctx.beginPath();ctx.arc(0,-72,9.8,Math.PI,0);ctx.fill();ctx.fillRect(-9.8,-72,3,f?10:4);if(f) ctx.fillRect(5,-78,5,5)}
  if(O.head==='helmet'){ctx.fillStyle=C.hat;ctx.beginPath();ctx.arc(0,-72,10.5,Math.PI,0);ctx.fill();ctx.fillRect(-11,-73,23,4)}
  else if(O.head==='bandana'||O.head==='shades'){
    ctx.fillStyle=C.hat;ctx.fillRect(-9.8,-77,19.6,4);ctx.beginPath();ctx.moveTo(-9,-76);ctx.lineTo(-17,-73);ctx.lineTo(-14,-69);ctx.lineTo(-9,-73);ctx.fill();
    if(O.head==='shades'){ctx.fillStyle='#111';ctx.fillRect(1,-74.5,9,4)}}
  else if(O.head==='cap'){ctx.fillStyle=C.hat;ctx.beginPath();ctx.arc(0,-73,10,Math.PI,0);ctx.fill();ctx.fillStyle=shade(C.hat,-.25);ctx.fillRect(2,-74,14,3)}
  else if(O.head==='swat'){ctx.fillStyle=C.hat;ctx.beginPath();ctx.arc(0,-72,11,Math.PI,0);ctx.fill();ctx.fillRect(-11,-73,22,5);ctx.fillStyle=shade(C.hat,.35);ctx.fillRect(1,-74,10,3.5);ctx.fillStyle=C.hat;ctx.fillRect(-1,-66,2,6)}
  else if(O.head==='hat'){ctx.fillStyle=C.hat;ctx.beginPath();ctx.ellipse(0,-76,15,3.6,0,0,7);ctx.fill();rrect(-7.5,-87,15,12,3,C.hat);ctx.fillStyle=shade(C.hat,-.35);ctx.fillRect(-7.5,-79,15,3)}
  else if(O.head==='glasses'){ctx.strokeStyle=C.hat;ctx.lineWidth=1.3;ctx.strokeRect(1,-75,6.5,5);ctx.beginPath();ctx.moveTo(1,-72.5);ctx.lineTo(-6,-73);ctx.stroke()}
  else if(O.head==='santa'){
    if(!f){ctx.fillStyle='#f4f4f4';ctx.beginPath();ctx.moveTo(-7,-69);ctx.lineTo(8.5,-67);ctx.quadraticCurveTo(11,-52,1,-47);ctx.quadraticCurveTo(-9,-52,-7,-69);ctx.fill();ctx.beginPath();ctx.ellipse(6,-66,5.5,2.4,0,0,7);ctx.fill()}
    ctx.fillStyle=C.hat;ctx.beginPath();ctx.moveTo(-10.5,-76);ctx.quadraticCurveTo(-6,-98,-19,-88);ctx.quadraticCurveTo(3,-101,10.5,-76);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f4f4f4';rrect(-11.5,-80,23,5.5,2.7,'#f4f4f4');ctx.beginPath();ctx.arc(-19,-88,4.4,0,7);ctx.fill()}
  else if(O.head==='elf'){
    ctx.fillStyle=C.skin;ctx.beginPath();ctx.moveTo(-5,-72);ctx.lineTo(-17,-81);ctx.lineTo(-4,-65);ctx.fill();
    ctx.fillStyle=C.hat;ctx.beginPath();ctx.moveTo(-10.5,-76);ctx.quadraticCurveTo(-4,-97,-21,-96);ctx.quadraticCurveTo(0,-91,10.5,-76);ctx.closePath();ctx.fill();
    rrect(-11,-79.5,22,4.5,2,'#c4161c');ctx.fillStyle='#e0b030';ctx.beginPath();ctx.arc(-21,-96,3.2,0,7);ctx.fill()}
  else if(O.head==='reindeer'){
    ctx.strokeStyle='#5a3a1e';ctx.lineWidth=2.4;ctx.lineCap='round';ctx.beginPath();
    for(const [x0,x1,sg] of[[-3,-7,-1],[3,8,1]]){ctx.moveTo(x0,-79);ctx.lineTo(x1,-97);ctx.moveTo(x0+(x1-x0)*.55,-90);ctx.lineTo(x1+sg*6,-92);ctx.moveTo(x1,-97);ctx.lineTo(x1-sg*3,-102)}
    ctx.stroke();ctx.fillStyle='#6b4423';ctx.beginPath();ctx.moveTo(-6,-78);ctx.lineTo(-12,-85);ctx.lineTo(-2,-80);ctx.fill();
    ctx.fillStyle='rgba(255,60,60,.35)';ctx.beginPath();ctx.arc(10.5,-69,7,0,7);ctx.fill();ctx.fillStyle='#e0202a';ctx.beginPath();ctx.arc(10.5,-69,3.3,0,7);ctx.fill()}
  else if(O.head==='snow'){
    ctx.fillStyle=C.hat;rrect(-8.5,-93,17,17,2,C.hat);ctx.beginPath();ctx.ellipse(0,-76,14,3.4,0,0,7);ctx.fill();ctx.fillStyle='#c4161c';ctx.fillRect(-8.5,-82,17,3.5);
    ctx.fillStyle='#ee7a1a';ctx.beginPath();ctx.moveTo(8.5,-72.5);ctx.lineTo(21,-69.5);ctx.lineTo(8.5,-66.5);ctx.fill()}
  else if(O.head==='nut'){
    rrect(-8,-99,16,25,2,C.hat);ctx.fillStyle='#e0b030';ctx.fillRect(-8,-81,16,3.2);rrect(-3,-92,8,9,1.5,'#e0b030');ctx.fillStyle='#c4161c';ctx.beginPath();ctx.ellipse(0,-101,3.2,6.5,0,0,7);ctx.fill()}
  else if(O.head==='ginger'){
    ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<8;i++) ctx.lineTo(-9+i*2.7,-77+(i%2?-3:1));ctx.stroke();
    ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(3.5,-67.5,4.2,.25,2.9);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-1,-72,1.8,0,7);ctx.fill()}
  else if(O.head==='fouet'){
    if(!f){ctx.fillStyle=C.hair;ctx.beginPath();ctx.moveTo(-6,-68);ctx.lineTo(8,-66);ctx.quadraticCurveTo(10,-53,1,-49);ctx.quadraticCurveTo(-8,-53,-6,-68);ctx.fill()}
    ctx.fillStyle=C.hat;ctx.beginPath();ctx.arc(-1,-72,12.5,Math.PI*.62,Math.PI*2.02);ctx.lineTo(-1,-60);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ff2a2a';ctx.fillRect(3,-72.5,3.2,3);ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,40,40,.45)';ctx.beginPath();ctx.arc(4.6,-71,5,0,7);ctx.fill();ctx.restore()}
  else if(O.head==='krampus'){
    ctx.fillStyle='#2a1a14';ctx.beginPath();ctx.moveTo(-5,-78);ctx.quadraticCurveTo(-15,-92,-7,-101);ctx.quadraticCurveTo(-9,-91,-1,-79);ctx.fill();
    ctx.beginPath();ctx.moveTo(3,-78);ctx.quadraticCurveTo(10,-94,19,-97);ctx.quadraticCurveTo(11,-88,9,-78);ctx.fill();
    ctx.fillStyle='#ff3030';ctx.fillRect(3,-72,3.2,3);ctx.fillStyle='#d8607a';ctx.fillRect(6.5,-64.5,3,10)}
  else if(O.head==='star'){
    ctx.fillStyle='#e0b030';ctx.beginPath();for(let k=0;k<10;k++){const r=k%2?5:11,a=-Math.PI/2+k*Math.PI/5;ctx.lineTo(Math.cos(a)*r,-93+Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,220,100,'+(.18+.14*Math.sin(tick*.2))+')';ctx.beginPath();ctx.arc(0,-93,11,0,7);ctx.fill();ctx.restore()}
  else if(O.head==='candy'){
    ctx.fillStyle=C.hat;ctx.beginPath();ctx.moveTo(-10.5,-76);ctx.quadraticCurveTo(-6,-98,-19,-88);ctx.quadraticCurveTo(3,-101,10.5,-76);ctx.closePath();ctx.fill();
    ctx.save();ctx.clip();ctx.fillStyle='#f4f4f4';for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(-14+i*6,-100);ctx.lineTo(-10+i*6,-100);ctx.lineTo(-6+i*6,-72);ctx.lineTo(-10+i*6,-72);ctx.fill()}ctx.restore();
    ctx.fillStyle='#f4f4f4';ctx.beginPath();ctx.arc(-19,-88,4.2,0,7);ctx.fill()}
  ctx.restore();}
  // bras et arme
  const sx=x,sy=y-52,wp=WEAPONS[p.w];
  let a=p.aim;
  if(wp.melee){
    const sw=p.swing>0?-1.3+(1-p.swing/180)*2.4:-0.35;
    a=p.face>0?sw:Math.PI-sw;
  }
  ctx.save();ctx.translate(sx,sy);ctx.rotate(a);
  if(Math.abs(a)>Math.PI/2) ctx.scale(1,-1);
  limb(0,0,16,0,aw,O.body==='tank'?C.skin:C.top);if(big&&!f){ctx.fillStyle=O.body==='tank'?C.skin:C.top;ctx.beginPath();ctx.arc(2,0,7.5,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(8,-3.5,6.5,5,0,0,7);ctx.fill()}
  if(wp.hands){ctx.restore();drawAkimbo(p,sx,sy,a,C,aw,wp);return}
  const ic=weaponIcon(p.w,skinOf(p.w),woodOf(p.w)),hs=wp.hs;
  ctx.save();ctx.translate(14,1);ctx.scale(hs,hs);ctx.drawImage(ic.cv,-OX/2,-OY/2,ICON_W/2,ICON_H/2);ctx.restore();
  ctx.fillStyle=C.skin;ctx.beginPath();ctx.arc(16,3,4,0,7);ctx.fill();
  if(!wp.melee && p.cd>wp.rate-50 && wp.kind!=='bow' && wp.kind!=='crossbow'){
    ctx.fillStyle='#ffe27a';ctx.beginPath();ctx.arc(14+ic.mx*hs+4,0,wp.kind==='flamer'?0.1:7,0,7);ctx.fill();
  }
  ctx.restore();
  if(wp.melee&&p.swing>0){
    ctx.strokeStyle='rgba(255,255,255,'+Math.min(1,p.swing/160)+')';ctx.lineWidth=4;ctx.beginPath();
    const R=Math.max(40,wp.reach*.8);
    if(p.face>0) ctx.arc(x,sy,R,-1.1,.9); else ctx.arc(x,sy,R,Math.PI-.9,Math.PI+1.1);
    ctx.stroke();
  }
}
function drawEmerge(z){                                          // fissures puis le zombie remonte du sol
  const t=EMERGE_T-z.emerge,x=z.x;
  const a=Math.min(1,t/20);
  ctx.strokeStyle='rgba(10,6,4,'+a+')';ctx.lineWidth=2.5;ctx.beginPath();
  for(let k=-2;k<=2;k++){ctx.moveTo(x+k*14,GROUND+16);ctx.lineTo(x+k*14+(k%2?6:-6),GROUND+26+Math.abs(k)*3)}
  ctx.moveTo(x-34,GROUND+12);ctx.lineTo(x-10,GROUND+20);ctx.lineTo(x+10,GROUND+13);ctx.lineTo(x+34,GROUND+21);ctx.stroke();
  ctx.fillStyle='rgba(30,20,14,'+(.5*a)+')';ctx.beginPath();ctx.ellipse(x,GROUND+8,30+Math.sin(t*.5)*3,7,0,0,7);ctx.fill();
  if(t>60){
    const pr=(t-60)/(EMERGE_T-60);
    ctx.save();ctx.beginPath();ctx.rect(x-60,GROUND-150,120,150+6);ctx.clip();
    const sy=z.y;z.y=sy+(1-pr)*95;drawZombie(z);z.y=sy;ctx.restore();
  }
}
function drawAnimalClean(z){
  const s=z.size,x=z.x,y=z.y,lg=Math.sin(z.step)*(z.animal==='peng'?4:7);
  ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(x,GROUND+4,18*s,4,0,0,7);ctx.fill();
  ctx.save();ctx.translate(x,y);ctx.scale(z.dir*s,s);ctx.lineCap='round';
  if(z.animal==='dog'){
    ctx.strokeStyle='#4a4038';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-10,-14);ctx.lineTo(-12+lg,0);ctx.moveTo(-5,-14);ctx.lineTo(-3-lg,0);ctx.moveTo(10,-14);ctx.lineTo(12+lg,0);ctx.moveTo(15,-14);ctx.lineTo(18-lg,0);ctx.stroke();
    ctx.strokeStyle=z.color;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-18,-24);ctx.lineTo(-27,-34+Math.sin(z.step*2)*3);ctx.stroke();
    ctx.fillStyle=z.color;ctx.beginPath();ctx.ellipse(0,-22,19,9,0,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(22,-30,8,7,0,0,7);ctx.fill();ctx.fillStyle='#5a4a3c';ctx.beginPath();ctx.ellipse(29,-27,5,3.4,0,0,7);ctx.fill();
    ctx.fillStyle='#3a2c22';ctx.beginPath();ctx.moveTo(18,-35);ctx.lineTo(16,-46);ctx.lineTo(23,-37);ctx.fill();
    ctx.fillStyle='#c0252b';ctx.fillRect(12,-27,5,2.6);ctx.fillStyle='#ff3030';ctx.beginPath();ctx.arc(25,-32,1.6,0,7);ctx.fill();ctx.fillStyle='#c4161c';ctx.fillRect(13,-30,4,9);
  } else if(z.animal==='deer'){
    ctx.strokeStyle='#4a2e18';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-18,-34);ctx.lineTo(-20+lg,0);ctx.moveTo(-10,-34);ctx.lineTo(-8-lg,0);ctx.moveTo(14,-34);ctx.lineTo(16+lg,0);ctx.moveTo(22,-34);ctx.lineTo(26-lg,0);ctx.stroke();
    ctx.fillStyle=z.color;ctx.beginPath();ctx.ellipse(0,-42,28,13,0,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(18,-46);ctx.lineTo(30,-68);ctx.lineTo(40,-62);ctx.lineTo(28,-40);ctx.fill();ctx.beginPath();ctx.ellipse(40,-66,9,6,.4,0,7);ctx.fill();
    ctx.fillStyle='#5a7a4a';ctx.beginPath();ctx.ellipse(-8,-46,8,5,.3,0,7);ctx.fill();
    ctx.strokeStyle='#5a3a1e';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(34,-72);ctx.lineTo(30,-92);ctx.moveTo(32,-83);ctx.lineTo(24,-86);ctx.moveTo(38,-72);ctx.lineTo(44,-92);ctx.moveTo(41,-83);ctx.lineTo(49,-86);ctx.stroke();
    ctx.fillStyle='#ff3030';ctx.beginPath();ctx.arc(43,-68,2,0,7);ctx.arc(48,-62,3.2,0,7);ctx.fill();ctx.fillStyle='#c4161c';ctx.fillRect(22,-56,6,12);
  } else {
    ctx.fillStyle='#d8821e';ctx.beginPath();ctx.ellipse(-4+lg*.5,-2,6,3,0,0,7);ctx.ellipse(6-lg*.5,-2,6,3,0,0,7);ctx.fill();
    ctx.fillStyle=z.color;ctx.beginPath();ctx.ellipse(0,-24,13,22,Math.sin(z.step)*.12,0,7);ctx.fill();ctx.fillStyle='#cfe0cf';ctx.beginPath();ctx.ellipse(3,-20,8,16,0,0,7);ctx.fill();
    ctx.fillStyle=z.color;ctx.beginPath();ctx.ellipse(-12,-22,4,12,.4,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(14,-22,4,12,-.4,0,7);ctx.fill();
    ctx.fillStyle='#d8821e';ctx.beginPath();ctx.moveTo(10,-40);ctx.lineTo(20,-37);ctx.lineTo(10,-34);ctx.fill();ctx.fillStyle='#ff3030';ctx.beginPath();ctx.arc(7,-42,2,0,7);ctx.fill();
    ctx.fillStyle='#c4161c';ctx.fillRect(-2,-34,13,4);
  }
  ctx.restore();
}
const BONE='#e4dcc4',FLESH='#7a1c20',GORE='#b3141c';
function fang(x,y,w,h,down){ctx.beginPath();ctx.moveTo(x-w/2,y);ctx.lineTo(x+w/2,y);ctx.lineTo(x+.3,y+(down?h:-h));ctx.closePath();ctx.fill()}
function clawsAt(x,y,n,len){ctx.fillStyle='#d8d0b8';for(let i=0;i<n;i++){ctx.beginPath();ctx.moveTo(x+i*3.2-3,y);ctx.quadraticCurveTo(x+i*3.2+len*.2,y+len*.4,x+i*3.2+len*.7,y+len);ctx.lineTo(x+i*3.2+1,y);ctx.fill()}}
function ribsAt(x,y,n,gap,h){ctx.strokeStyle=BONE;ctx.lineWidth=1.8;ctx.lineCap='round';for(let i=0;i<n;i++){ctx.beginPath();ctx.moveTo(x+i*gap,y);ctx.quadraticCurveTo(x+i*gap+gap*.8,y+h*.55,x+i*gap,y+h);ctx.stroke()}}
function nightEye(x,y,r){ctx.fillStyle='#050000';ctx.beginPath();ctx.arc(x,y,r+1.2,0,7);ctx.fill();ctx.fillStyle='#ff2a2a';ctx.beginPath();ctx.arc(x,y,r*.75,0,7);ctx.fill();ctx.save();ctx.globalCompositeOperation='lighter';glowAt(x,y,r*5.5,'255,40,40',.6);ctx.restore()}
function blood(x,y,t,n){ctx.fillStyle=GORE;for(let k=0;k<n;k++){const l=3+((Math.sin(tick*.06+k*2.3+t)+1)*4);ctx.fillRect(x+k*3.4-1,y,1.6,l);ctx.beginPath();ctx.arc(x+k*3.4-.2,y+l+.6,1.5,0,7);ctx.fill()}}
function drawAnimal(z){                                              // zombies animaux : version « cauchemar » (griffes, crocs, chair à vif, os apparents)
  const s=z.size,x=z.x,y=z.y,lg=Math.sin(z.step)*(z.animal==='peng'?4:7),jw=.3+.2*Math.sin(z.step*1.7),sd=z.step;
  ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(x,GROUND+4,18*s,4,0,0,7);ctx.fill();
  ctx.save();ctx.translate(x,y);ctx.scale(z.dir*s,s);ctx.lineCap='round';ctx.lineJoin='round';
  if(z.animal==='dog'){
    for(const [lx,l] of[[-11,lg],[-5,-lg],[11,lg],[16,-lg]]){
      ctx.strokeStyle='#5a1418';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(lx,-15);ctx.lineTo(lx+l*.5,-8);ctx.stroke();
      ctx.strokeStyle=BONE;ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(lx+l*.5,-8);ctx.lineTo(lx+l,-1);ctx.stroke();
      ctx.fillStyle=BONE;ctx.beginPath();ctx.arc(lx+l*.5,-8,2.5,0,7);ctx.fill();clawsAt(lx+l-1,-1,3,6);
    }
    ctx.strokeStyle=BONE;ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-18,-25);ctx.quadraticCurveTo(-29,-34,-34,-27+Math.sin(sd*2)*3);ctx.stroke();
    ctx.fillStyle=z.color;ctx.beginPath();ctx.ellipse(0,-22,19,9,0,0,7);ctx.fill();
    ctx.fillStyle=FLESH;ctx.beginPath();ctx.ellipse(-3,-20,12,6.5,0,0,7);ctx.fill();ctx.fillStyle='#240507';ctx.beginPath();ctx.ellipse(-3,-20,9,4.2,0,0,7);ctx.fill();ribsAt(-9,-24.5,5,4.3,8);
    ctx.fillStyle=FLESH;ctx.beginPath();ctx.ellipse(10,-26,5,3,.4,0,7);ctx.fill();
    ctx.fillStyle=BONE;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(-14+i*5.4,-29);ctx.lineTo(-12+i*5.4,-35);ctx.lineTo(-10+i*5.4,-29);ctx.fill()}
    ctx.fillStyle=z.color;ctx.beginPath();ctx.ellipse(24,-32,9,7,.2,0,7);ctx.fill();ctx.fillStyle=BONE;ctx.beginPath();ctx.ellipse(20,-36,4.5,2.6,.3,0,7);ctx.fill();ctx.strokeStyle='#3a2a20';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(17,-37);ctx.lineTo(21,-34.5);ctx.stroke();
    ctx.fillStyle='#4a3a30';ctx.beginPath();ctx.moveTo(26,-37);ctx.lineTo(42,-31.5);ctx.lineTo(41,-27.5);ctx.lineTo(26,-27.5);ctx.fill();ctx.fillStyle=GORE;ctx.fillRect(28,-28.5,13,2);
    ctx.fillStyle='#f4f0e4';for(let k=0;k<5;k++) fang(29+k*2.9,-27.5,2.4,k%2?4.5:7.5,true);
    ctx.save();ctx.translate(26,-27);ctx.rotate(jw);ctx.fillStyle='#4a3a30';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(16,1.5);ctx.lineTo(15,5);ctx.lineTo(0,4.5);ctx.fill();ctx.fillStyle=GORE;ctx.fillRect(1,.5,13,2);ctx.fillStyle='#f4f0e4';for(let k=0;k<4;k++) fang(3+k*3.4,.8,2.3,k%2?4:7,false);blood(6,4.6,0,3);ctx.restore();
    ctx.fillStyle='#3a2a20';ctx.beginPath();ctx.moveTo(18,-38);ctx.lineTo(14,-50);ctx.lineTo(17,-46);ctx.lineTo(19,-52);ctx.lineTo(23,-39);ctx.fill();
    nightEye(26,-34,2.6);ctx.fillStyle='#7a0e12';ctx.fillRect(10,-32,7,3);ctx.fillRect(12,-30,2,8);
    ctx.fillStyle=GORE;ctx.fillRect(-17,-20,2,7);ctx.fillRect(15,-24,2,9);
  } else if(z.animal==='deer'){
    for(const [lx,l] of[[-18,lg],[-10,-lg],[14,lg],[22,-lg]]){
      ctx.strokeStyle='#5a1418';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(lx,-34);ctx.lineTo(lx+l*.5,-18);ctx.stroke();
      ctx.strokeStyle=BONE;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(lx+l*.5,-18);ctx.lineTo(lx+l,-3);ctx.stroke();
      ctx.fillStyle=BONE;ctx.beginPath();ctx.arc(lx+l*.5,-18,3,0,7);ctx.fill();ctx.fillStyle='#2a1a14';ctx.fillRect(lx+l-3,-4,7,4);clawsAt(lx+l,-1,3,5);
    }
    ctx.fillStyle=z.color;ctx.beginPath();ctx.ellipse(0,-43,28,13,0,0,7);ctx.fill();
    ctx.fillStyle=FLESH;ctx.beginPath();ctx.ellipse(-2,-41,19,9,0,0,7);ctx.fill();ctx.fillStyle='#240507';ctx.beginPath();ctx.ellipse(-2,-41,15,6.5,0,0,7);ctx.fill();ribsAt(-13,-47,7,4.4,12);
    ctx.fillStyle=BONE;for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(-22+i*7,-54);ctx.lineTo(-19+i*7,-62);ctx.lineTo(-16+i*7,-54);ctx.fill()}
    ctx.fillStyle=z.color;ctx.beginPath();ctx.moveTo(18,-48);ctx.lineTo(30,-70);ctx.lineTo(41,-64);ctx.lineTo(28,-41);ctx.fill();ctx.fillStyle=FLESH;ctx.beginPath();ctx.ellipse(27,-56,5,8,.5,0,7);ctx.fill();ctx.fillStyle=BONE;ctx.beginPath();ctx.ellipse(30,-62,2.2,5,.5,0,7);ctx.fill();
    ctx.fillStyle=z.color;ctx.beginPath();ctx.ellipse(40,-68,9,6.5,.4,0,7);ctx.fill();ctx.fillStyle=BONE;ctx.beginPath();ctx.ellipse(36,-72,5,3,.4,0,7);ctx.fill();
    ctx.fillStyle='#3a2a20';ctx.beginPath();ctx.moveTo(42,-72);ctx.lineTo(56,-63);ctx.lineTo(54,-58);ctx.lineTo(42,-62);ctx.fill();ctx.fillStyle=GORE;ctx.fillRect(44,-62,10,2.2);
    ctx.fillStyle='#f4f0e4';for(let k=0;k<5;k++) fang(44+k*2.5,-61.5,2.2,k%2?4:7,true);
    ctx.save();ctx.translate(43,-61);ctx.rotate(jw*1.1);ctx.fillStyle='#3a2a20';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(13,1);ctx.lineTo(12,4.5);ctx.lineTo(0,4);ctx.fill();ctx.fillStyle='#f4f0e4';for(let k=0;k<4;k++) fang(2+k*3,.5,2.1,k%2?3.5:6.5,false);blood(5,4,1,3);ctx.restore();
    ctx.strokeStyle='#e4dcc4';ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(37,-74);ctx.lineTo(32,-96);ctx.moveTo(34,-85);ctx.lineTo(26,-90);ctx.moveTo(32,-96);ctx.lineTo(36,-103);ctx.moveTo(43,-74);ctx.lineTo(50,-96);ctx.moveTo(47,-85);ctx.lineTo(55,-88);ctx.moveTo(50,-96);ctx.lineTo(47,-104);ctx.stroke();
    ctx.strokeStyle=GORE;ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(32,-96);ctx.lineTo(32.6,-84);ctx.moveTo(50,-96);ctx.lineTo(49,-84);ctx.stroke();
    nightEye(41,-69,2.8);ctx.fillStyle='#b3141c';ctx.beginPath();ctx.arc(53,-65,3.4,0,7);ctx.fill();blood(24,-58,2,4);
    ctx.fillStyle='#7a0e12';ctx.fillRect(22,-58,7,3);
  } else {
    // pingouin nightmare
    ctx.fillStyle='#8a5a1a';ctx.beginPath();ctx.ellipse(-4+lg*.5,-2,7,3,0,0,7);ctx.ellipse(7-lg*.5,-2,7,3,0,0,7);ctx.fill();clawsAt(-9+lg*.5,-1,3,5);clawsAt(3-lg*.5,-1,3,5);
    ctx.fillStyle=z.color;ctx.beginPath();ctx.ellipse(0,-24,14,23,Math.sin(sd)*.12,0,7);ctx.fill();
    ctx.fillStyle='#cfd8cf';ctx.beginPath();ctx.ellipse(3,-20,8.5,16,0,0,7);ctx.fill();
    ctx.fillStyle=FLESH;ctx.beginPath();ctx.ellipse(3,-20,6.5,11,0,0,7);ctx.fill();ctx.fillStyle='#240507';ctx.beginPath();ctx.ellipse(3,-20,4.6,8,0,0,7);ctx.fill();ribsAt(-1,-27,4,3,12);
    ctx.fillStyle=z.color;ctx.beginPath();ctx.ellipse(-13,-23,4,13,.45,0,7);ctx.ellipse(15,-23,4,13,-.45,0,7);ctx.fill();clawsAt(16,-12,3,6);clawsAt(-18,-12,3,6);
    ctx.fillStyle=z.color;ctx.beginPath();ctx.arc(4,-47,9,0,7);ctx.fill();ctx.fillStyle=BONE;ctx.beginPath();ctx.ellipse(1,-52,4,2.6,.3,0,7);ctx.fill();
    ctx.fillStyle='#8a5a1a';ctx.beginPath();ctx.moveTo(10,-51);ctx.lineTo(24,-47);ctx.lineTo(10,-45);ctx.fill();ctx.fillStyle=GORE;ctx.fillRect(11,-47.4,12,1.8);
    ctx.fillStyle='#f4f0e4';for(let k=0;k<4;k++) fang(12+k*3,-47,2.2,k%2?3.5:6,true);
    ctx.save();ctx.translate(10,-46);ctx.rotate(jw*.8);ctx.fillStyle='#8a5a1a';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(13,1);ctx.lineTo(0,4);ctx.fill();ctx.fillStyle='#f4f0e4';for(let k=0;k<3;k++) fang(2+k*3.3,.4,2,k%2?3:5.5,false);blood(4,3.6,3,3);ctx.restore();
    nightEye(7,-50,2.6);ctx.fillStyle='#050000';ctx.beginPath();ctx.arc(-1,-49,2.4,0,7);ctx.fill();ctx.fillStyle=GORE;ctx.fillRect(-1,-46,1.8,8);
  }
  ctx.restore();
}
function goreHuman(z,lean){                                           // détails gore des zombies humains (plaies, côtes, œil pendant, crocs, os à nu)
  const g=z.gseed===undefined?.5:z.gseed,t=tick;
  ctx.fillStyle='rgba(110,12,16,.82)';ctx.beginPath();ctx.ellipse(-3+lean/2,-40,5+g*3,8,.3,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(6+lean/2,-53,3,4.2,0,0,7);ctx.fill();
  if(g>.35){ctx.fillStyle=FLESH;ctx.beginPath();ctx.ellipse(1+lean/2,-42,8,10,.1,0,7);ctx.fill();ctx.fillStyle='#240507';ctx.beginPath();ctx.ellipse(1+lean/2,-42,5.5,7.4,.1,0,7);ctx.fill();ribsAt(-4+lean/2,-48,4,3.6,11);
    if(g>.7){ctx.strokeStyle='#b8505a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(2,-34);for(let k=1;k<=5;k++) ctx.lineTo(2+Math.sin(t*.1+k)*3,-34+k*4);ctx.stroke()}}   // entrailles
  ctx.strokeStyle=BONE;ctx.lineWidth=2.3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(15+lean,-50);ctx.lineTo(25+lean,-50);ctx.stroke();ctx.fillStyle=FLESH;ctx.beginPath();ctx.arc(15+lean,-50,3.3,0,7);ctx.fill();   // os du bras à nu
  ctx.save();ctx.translate(22+lean,-52);ctx.rotate(-1.2);clawsAt(0,0,3,6);ctx.restore();
  ctx.fillStyle=BONE;ctx.beginPath();ctx.ellipse(-2+lean,-77,5,2.6,.2,0,7);ctx.fill();ctx.fillStyle=FLESH;ctx.beginPath();ctx.ellipse(-2+lean,-75,6,2,.2,0,7);ctx.fill();ctx.fillStyle=GORE;ctx.fillRect(3+lean,-74,1.6,9);   // scalp arraché
  ctx.fillStyle='#240507';ctx.fillRect(2+lean,-66,9,4.4);ctx.fillStyle='#f4f0e4';for(let k=0;k<4;k++) fang(3+lean+k*2.2,-66,1.8,k%2?2.6:4.2,true);for(let k=0;k<3;k++) fang(3.6+lean+k*2.6,-61.6,1.8,3,false);blood(4+lean,-61.6,g*5,3);   // crocs + sang
  if(g>.5){ctx.fillStyle='#050000';ctx.beginPath();ctx.arc(6.4+lean,-72,3.9,0,7);ctx.fill();const sw=Math.sin(t*.12+g*9)*2,ex=9+lean+sw,ey=-59+Math.abs(sw);ctx.strokeStyle='#b3141c';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(6.4+lean,-71);ctx.quadraticCurveTo(8+lean,-65,ex,ey);ctx.stroke();ctx.fillStyle='#f4f4d8';ctx.beginPath();ctx.arc(ex,ey,2.9,0,7);ctx.fill();ctx.fillStyle='#c0252b';ctx.beginPath();ctx.arc(ex+.6,ey,1.1,0,7);ctx.fill()}   // œil qui pend
  else{ctx.save();ctx.globalCompositeOperation='lighter';glowAt(6.4+lean,-72,12,'255,40,40',.5);ctx.restore()}
}
function bloodFlakes(){
  if(bloodSnow<.02) return;
  const n=Math.round(160*bloodSnow);ctx.save();ctx.fillStyle='#c0141e';
  for(let i=0;i<n;i++){const x=((i*97.3+ATK*.35*(1+i%3)+Math.sin(ATK*.015+i)*30)%(W+40))-20,y=((i*53.7+ATK*(1.1+(i%4)*.45))%(H+20))-10,r=1.2+(i%3)*.9;ctx.globalAlpha=.55+(i%4)*.1;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}
  ctx.restore();
}
function drawMagician(z){
  const ph=z.ph;if(ph==='under') return;
  const s=z.size,low=ph==='sink'?(1-z.pt/50)*135:ph==='rise'?(z.pt/50)*135:0;
  if(ph==='sink'||ph==='rise'){                                      // flaque de sang qui s'étale + ondes
    const k=ph==='sink'?1-z.pt/50:z.pt/50;ctx.fillStyle='rgba(120,8,16,.8)';ctx.beginPath();ctx.ellipse(z.x,GROUND+8,26+60*k,7+5*k,0,0,7);ctx.fill();
    ctx.strokeStyle='rgba(200,30,40,.6)';ctx.lineWidth=2;for(let r=0;r<2;r++){const q=((tick*.04+r*.5)%1);ctx.beginPath();ctx.ellipse(z.x,GROUND+8,30+q*70,6+q*8,0,0,7);ctx.stroke()}
  }
  ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(z.x,GROUND+4,26*s,5,0,0,7);ctx.fill();
  ctx.save();if(low>0){ctx.beginPath();ctx.rect(z.x-90,GROUND-260,180,263);ctx.clip()}   // seulement quand il s'enfonce dans le sol
  ctx.translate(z.x,z.y+low);ctx.scale(z.dir*s,s);ctx.lineCap='round';ctx.lineJoin='round';
  const sw=Math.sin(z.step)*3;
  ctx.fillStyle='#1a0a24';ctx.beginPath();ctx.moveTo(-16,-64);ctx.lineTo(16,-64);ctx.lineTo(31+sw,-2);ctx.quadraticCurveTo(0,7,-31-sw,-2);ctx.closePath();ctx.fill();
  ctx.fillStyle='#2e1240';ctx.beginPath();ctx.moveTo(-9,-64);ctx.lineTo(9,-64);ctx.lineTo(16,-4);ctx.lineTo(-16,-4);ctx.closePath();ctx.fill();
  ctx.fillStyle='#7a0e18';ctx.beginPath();ctx.moveTo(-31-sw,-6);ctx.quadraticCurveTo(0,3,31+sw,-6);ctx.lineTo(30+sw,-1);ctx.quadraticCurveTo(0,8,-30-sw,-1);ctx.fill();blood(-26,0,1,6);
  ctx.strokeStyle='#b3141c';ctx.lineWidth=1.4;for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(-6+k*6,-30-k*4,2.2,0,7);ctx.moveTo(-6+k*6,-27-k*4);ctx.lineTo(-6+k*6,-22-k*4);ctx.stroke()}
  ctx.fillStyle='#16081e';ctx.beginPath();ctx.ellipse(0,-62,19,7,0,0,7);ctx.fill();ctx.fillStyle='#7a6a40';ctx.fillRect(-14,-38,28,3);
  ctx.strokeStyle='#cfc6c0';ctx.lineWidth=5;                         // bras arrière
  ctx.beginPath();ctx.moveTo(-8,-58);ctx.lineTo(-18,-40+sw);ctx.stroke();
  const arm=z.arm||0;                                                 // bras avant : baguette levée vers le ciel pendant l'incantation
  const hx=14+arm*14,hy=-46-arm*52;ctx.beginPath();ctx.strokeStyle='#cfc6c0';ctx.lineWidth=5;ctx.moveTo(8,-58);ctx.lineTo(hx,hy);ctx.stroke();
  const tx=hx+4+arm*6,ty=hy-34-arm*10;ctx.strokeStyle='#3a2410';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(tx,ty);ctx.stroke();
  ctx.save();ctx.globalCompositeOperation='lighter';glowAt(tx,ty,26+arm*28+Math.sin(tick*.3)*3,'255,40,50',.75);ctx.restore();ctx.fillStyle='#ff3040';ctx.beginPath();ctx.arc(tx,ty,4,0,7);ctx.fill();
  ctx.fillStyle='#d8d0c8';ctx.beginPath();ctx.arc(0,-74,10,0,7);ctx.fill();                                    // crâne
  ctx.fillStyle='#050000';ctx.beginPath();ctx.arc(4,-76,3.2,0,7);ctx.arc(-3,-76,2.8,0,7);ctx.fill();
  ctx.save();ctx.globalCompositeOperation='lighter';glowAt(4,-76,10,'255,40,40',.7);glowAt(-3,-76,9,'255,40,40',.6);ctx.restore();
  ctx.fillStyle='#ff2a2a';ctx.beginPath();ctx.arc(4,-76,1.5,0,7);ctx.arc(-3,-76,1.3,0,7);ctx.fill();
  ctx.fillStyle='#2a0608';ctx.fillRect(1,-69,8,4);ctx.fillStyle='#f4f0e4';for(let k=0;k<4;k++) fang(2+k*2,-69,1.6,3+(k%2)*1.6,true);
  ctx.fillStyle='#8a8a94';ctx.beginPath();ctx.moveTo(-6,-68);ctx.lineTo(9,-67);ctx.quadraticCurveTo(12,-50,3,-40+sw);ctx.quadraticCurveTo(-8,-50,-6,-68);ctx.fill();blood(-2,-44,3,3);   // barbe
  ctx.fillStyle='#1a0a24';ctx.beginPath();ctx.ellipse(0,-82,16,4,0,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(-11,-82);ctx.quadraticCurveTo(-8,-112,10,-136);ctx.quadraticCurveTo(2,-110,11,-82);ctx.closePath();ctx.fill();   // chapeau
  ctx.fillStyle='#7a0e18';ctx.fillRect(-11,-87,22,5);ctx.fillStyle='#ffd45a';ctx.beginPath();ctx.arc(-1,-100,2.4,0,7);ctx.fill();
  for(let k=0;k<3;k++){const a=tick*.05+k*2.1,ox=Math.cos(a)*40,oy=-72+Math.sin(a)*16;ctx.save();ctx.globalCompositeOperation='lighter';glowAt(ox,oy,14,'255,40,50',.7);ctx.restore();ctx.fillStyle='#c0141e';ctx.beginPath();ctx.arc(ox,oy,4,0,7);ctx.fill()}   // orbes de sang
  ctx.restore();
}
function drawPlane(x,y,dir){                                          // avion cargo militaire
  ctx.save();ctx.translate(x,y+Math.sin(tick*.05)*2);ctx.scale(dir,1);
  ctx.fillStyle='#0003';ctx.beginPath();ctx.ellipse(0,60,70,5,0,0,7);ctx.fill();
  const g=ctx.createLinearGradient(0,-18,0,16);g.addColorStop(0,'#6a7550');g.addColorStop(1,'#3a4428');ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(-100,-8);ctx.lineTo(-70,-16);ctx.lineTo(80,-16);ctx.quadraticCurveTo(108,-14,112,2);ctx.quadraticCurveTo(100,14,70,16);ctx.lineTo(-60,16);ctx.lineTo(-100,8);ctx.closePath();ctx.fill();
  ctx.fillStyle='#3f4a2e';ctx.beginPath();ctx.moveTo(-100,-8);ctx.lineTo(-84,-44);ctx.lineTo(-66,-44);ctx.lineTo(-62,-14);ctx.closePath();ctx.fill();ctx.fillRect(-104,-20,40,5);    // dérive + stabilisateur
  ctx.fillStyle='#2f3820';ctx.fillRect(-30,-24,86,7);ctx.beginPath();ctx.moveTo(-34,-24);ctx.lineTo(60,-24);ctx.lineTo(48,-18);ctx.lineTo(-24,-18);ctx.fill();   // aile haute
  ctx.fillStyle='#9ecfe0';ctx.beginPath();ctx.moveTo(84,-12);ctx.lineTo(104,-8);ctx.lineTo(106,0);ctx.lineTo(84,-2);ctx.fill();   // cockpit
  ctx.fillStyle='#2a2f20';ctx.fillRect(-70,2,70,12);ctx.fillStyle='#1d2216';ctx.fillRect(-72,4,6,10);   // soute / rampe
  ctx.fillStyle='#d8d8c8';ctx.beginPath();ctx.arc(30,-2,7,0,7);ctx.fill();ctx.fillStyle='#3a4428';ctx.beginPath();ctx.arc(30,-2,4.4,0,7);ctx.fill();ctx.fillStyle='#d8d8c8';ctx.fillRect(18,-3,24,2);   // cocarde
  for(const px of[-4,32]){ctx.fillStyle='#2a2f20';ctx.beginPath();ctx.ellipse(px,-14,14,5,0,0,7);ctx.fill();const sp=tick*1.4;ctx.fillStyle='rgba(220,220,210,.45)';ctx.beginPath();ctx.ellipse(px+14,-14,2.4,16,0,0,7);ctx.fill();ctx.strokeStyle='#222';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(px+14,-14+Math.sin(sp)*15);ctx.lineTo(px+14,-14-Math.sin(sp)*15);ctx.stroke()}
  ctx.fillStyle='#f4f4e0';ctx.font='700 9px '+FONT;ctx.fillText('CARGO',-52,-6);
  ctx.restore();
}
function drawDino(x,y,dir,carry){                                     // dinosaure volant zombie (ptérosaure), des zombies dans les pattes
  const fl=Math.sin(tick*.13);
  ctx.save();ctx.translate(x,y+Math.sin(tick*.07)*4);ctx.scale(dir,1);
  ctx.save();ctx.globalCompositeOperation='lighter';glowAt(10,0,150,'120,220,80',.1);ctx.restore();
  for(const k of[-1,1]){const wy=-12-fl*30*k*(k>0?1:.9);ctx.fillStyle=k>0?'#4a6a3a':'#3a5a2e';ctx.beginPath();ctx.moveTo(-6,-8);ctx.quadraticCurveTo(-30,wy-30,-96,wy-12+(k>0?8:0));ctx.lineTo(-70,-4);ctx.lineTo(-52,wy*.3);ctx.lineTo(-30,-2);ctx.closePath();ctx.fill();ctx.strokeStyle='#cfc6a8';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-6,-8);ctx.lineTo(-96,wy-12);ctx.moveTo(-6,-8);ctx.lineTo(-70,-4);ctx.stroke();ctx.fillStyle='#240507';ctx.beginPath();ctx.ellipse(-50,wy*.45-8,6,3.4,.3,0,7);ctx.fill()}   // ailes déchirées
  ctx.fillStyle='#5a7a48';ctx.beginPath();ctx.ellipse(0,0,34,15,0,0,7);ctx.fill();ctx.fillStyle=FLESH;ctx.beginPath();ctx.ellipse(2,2,18,8,0,0,7);ctx.fill();ctx.fillStyle='#240507';ctx.beginPath();ctx.ellipse(2,2,13,5,0,0,7);ctx.fill();ribsAt(-8,-3,6,4,10);
  ctx.strokeStyle='#5a7a48';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(28,-4);ctx.quadraticCurveTo(46,-26,58,-22);ctx.stroke();ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(-30,2);ctx.quadraticCurveTo(-60,10,-84,0);ctx.stroke();ctx.fillStyle=BONE;ctx.beginPath();ctx.moveTo(-84,-4);ctx.lineTo(-96,0);ctx.lineTo(-84,4);ctx.fill();
  ctx.fillStyle='#5a7a48';ctx.beginPath();ctx.ellipse(62,-22,14,8,-.15,0,7);ctx.fill();ctx.fillStyle='#4a3a30';ctx.beginPath();ctx.moveTo(70,-27);ctx.lineTo(100,-20);ctx.lineTo(98,-15);ctx.lineTo(70,-15);ctx.fill();ctx.fillStyle=GORE;ctx.fillRect(72,-17,26,2);
  ctx.fillStyle='#f4f0e4';for(let k=0;k<7;k++) fang(74+k*3.6,-16,2.6,k%2?4:7,true);
  ctx.save();ctx.translate(70,-15);ctx.rotate(.22+.12*Math.sin(tick*.15));ctx.fillStyle='#4a3a30';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(28,2);ctx.lineTo(0,6);ctx.fill();ctx.fillStyle='#f4f0e4';for(let k=0;k<5;k++) fang(3+k*5,.6,2.4,k%2?3:5.5,false);blood(8,5,2,4);ctx.restore();
  ctx.fillStyle='#3a5a2e';ctx.beginPath();ctx.moveTo(54,-28);ctx.lineTo(36,-52);ctx.lineTo(62,-30);ctx.fill();   // crête
  nightEye(66,-25,3);ctx.fillStyle=BONE;ctx.beginPath();ctx.ellipse(56,-27,4,2.4,.2,0,7);ctx.fill();
  for(const lx of[-10,16]){ctx.strokeStyle='#4a6a3a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(lx,10);ctx.lineTo(lx+4,24);ctx.stroke();clawsAt(lx+1,24,3,8)
    if(carry>0){ctx.strokeStyle='#5c9a4a';ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(lx+8,34);ctx.lineTo(lx+8,40);ctx.stroke();ctx.fillStyle='#7fb069';ctx.beginPath();ctx.arc(lx+8,30,5.5,0,7);ctx.fill();ctx.fillStyle='#4d6a8a';ctx.fillRect(lx+3,36,10,15);ctx.strokeStyle='#7fb069';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(lx+4,38);ctx.lineTo(lx-3,31+Math.sin(tick*.2+lx)*3);ctx.moveTo(lx+12,38);ctx.lineTo(lx+19,31-Math.sin(tick*.2+lx)*3);ctx.stroke();ctx.strokeStyle='#3d3d45';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(lx+6,51);ctx.lineTo(lx+4+Math.sin(tick*.3)*3,60);ctx.moveTo(lx+11,51);ctx.lineTo(lx+13-Math.sin(tick*.3)*3,60);ctx.stroke()}}
  ctx.restore();
}
function drawZombie(z){
  if(z.mag){drawMagician(z);return}
  if(z.animal){if(SET.gore) drawAnimal(z); else drawAnimalClean(z);return}
  const s=z.size,x=z.x,y=z.y,sw=Math.sin(z.step)*7;
  const skin=z.skin||(z.type==='digger'?'#a89478':z.type==='tank'?'#6f8f5a':z.type==='fast'?'#a9c45a':'#7fb069');
  const shirt=z.shirt||(z.type==='digger'?'#5a4636':z.type==='tank'?'#4a3a5a':z.type==='fast'?'#8a3f3f':'#4d6a8a');
  ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(x,GROUND+4,16*s,4,0,0,7);ctx.fill();
  ctx.save();ctx.translate(x,y);ctx.scale(z.dir*s*1.14,s);
  const lean=z.type==='fast'?4:0;
  limb(-4,-28,-4-sw,-3,9,'#4a4a52');limb(5,-28,5+sw,-3,9,'#3d3d45');              // jambes
  rrect(-10-sw,-6,12,6,3,'#2a2a2a');rrect(1+sw,-6,12,6,3,'#2a2a2a');
  limb(0,-52,22+lean,-50,6,skin);limb(0,-46,20+lean,-42,6,skin);                   // bras tendus
  ctx.fillStyle=skin;ctx.beginPath();ctx.arc(23+lean,-50,4,0,7);ctx.fill();
  rrect(-11+lean/2,-60,22,33,5,shirt);                                             // t-shirt
  ctx.fillStyle=skin;                                                              // déchirures
  ctx.beginPath();ctx.moveTo(-11,-34);ctx.lineTo(-6,-28);ctx.lineTo(-1,-34);ctx.lineTo(4,-27);ctx.lineTo(11,-34);ctx.lineTo(11,-27);ctx.lineTo(-11,-27);ctx.fill();
  ctx.fillStyle=skin;ctx.beginPath();ctx.arc(2+lean,-70,10,0,7);ctx.fill();         // tête
  ctx.fillStyle='#f4f4d8';ctx.beginPath();ctx.arc(6+lean,-72,3.2,0,7);ctx.arc(-1+lean,-72,2.6,0,7);ctx.fill();
  ctx.fillStyle='#c0252b';ctx.beginPath();ctx.arc(7+lean,-72,1.3,0,7);ctx.arc(0+lean,-72,1.1,0,7);ctx.fill();
  ctx.fillStyle='#3a1a1a';ctx.fillRect(2+lean,-65,8,3);                            // bouche
  ctx.fillStyle='#2f3b25';ctx.fillRect(-7+lean,-80,8,4);ctx.fillRect(1+lean,-81,6,3);// cheveux
  if(SET.gore) goreHuman(z,lean);
  if(z.xm){const hx=2+lean,hy=-72;
    if(z.xm==='santa'){ctx.fillStyle='#c4161c';ctx.beginPath();ctx.moveTo(hx-10,hy-4);ctx.quadraticCurveTo(hx-6,hy-26,hx-19,hy-17);ctx.quadraticCurveTo(hx+4,hy-28,hx+10,hy-4);ctx.fill();ctx.fillStyle='#f4f4f4';ctx.fillRect(hx-11,hy-8,22,5);ctx.beginPath();ctx.arc(hx-19,hy-17,4,0,7);ctx.fill()}
    else if(z.xm==='elf'){ctx.fillStyle='#2e8b3d';ctx.beginPath();ctx.moveTo(hx-10,hy-4);ctx.quadraticCurveTo(hx-4,hy-25,hx-20,hy-23);ctx.quadraticCurveTo(hx,hy-19,hx+10,hy-4);ctx.fill();ctx.fillStyle='#c4161c';ctx.fillRect(hx-11,hy-8,22,4);ctx.fillStyle='#e0b030';ctx.beginPath();ctx.arc(hx-20,hy-23,3,0,7);ctx.fill()}
    else{ctx.strokeStyle='#5a3a1e';ctx.lineWidth=2.2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(hx-3,hy-8);ctx.lineTo(hx-7,hy-24);ctx.moveTo(hx-5,hy-17);ctx.lineTo(hx-11,hy-19);ctx.moveTo(hx+3,hy-8);ctx.lineTo(hx+7,hy-24);ctx.moveTo(hx+5,hy-17);ctx.lineTo(hx+11,hy-19);ctx.stroke();ctx.fillStyle='#e0202a';ctx.beginPath();ctx.arc(hx+9,hy+2,3,0,7);ctx.fill()}}
  ctx.restore();
}
function bar(x,y,w,v,max,col){
  ctx.fillStyle='#0006';ctx.fillRect(x,y,w,6);
  ctx.fillStyle=col;ctx.fillRect(x,y,w*Math.max(0,v/max),6);
}
function glowAt(x,y,r,col,a){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba('+col+','+a+')');g.addColorStop(1,'rgba('+col+',0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
function drawLights(){                                                // lumières dynamiques (additives)
  if(!FXF.lights) return;
  ctx.save();ctx.globalCompositeOperation='lighter';
  const p=player,wp=WEAPONS[p.w];
  const fl=(p.muz0>0||p.muz1>0)||(!wp.melee&&p.cd>wp.rate*.7);
  if(fl&&!wp.melee){const gx=p.x+p.face*34,gy=p.y-50;glowAt(gx,gy,150,'255,190,100',.34);ctx.save();ctx.translate(p.x+p.face*60,GROUND+12);ctx.scale(1,.2);glowAt(0,0,150,'255,180,90',.5);ctx.restore()}
  for(const b of bullets){if(b.x<camX-80||b.x>camX+W+80) continue;glowAt(b.x,b.y,b.aoe?46:26,b.aoe||b.fire?'255,170,70':'255,225,150',.22)}
  for(const f of fx) glowAt(f.x,f.y,f.r*3.2,'255,170,80',.28*f.life/18);
  const view0=camX-80,view1=camX+W+80;
  for(const x of LAMPS) if(x>view0&&x<view1){glowAt(x+22,GROUND+14,110,'255,190,100',.1)}
  for(const x of BARRELS) if(x>view0&&x<view1){const k=.8+.2*Math.sin(tick*.3+x);glowAt(x,GROUND-14,90,'255,140,50',.2*k);glowAt(x,GROUND+12,80,'255,130,50',.1*k)}
  if(turret) glowAt(turret.x,GROUND-26,60,'120,230,255',.14);
  ctx.restore();
}
let FOGS=null;
function makeFog(){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(256,64,4,256,64,256);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(.5,'rgba(255,255,255,.2)');g.addColorStop(1,'rgba(255,255,255,0)');x.save();x.translate(0,64);x.scale(1,.28);x.translate(0,-64);x.fillStyle=g;x.fillRect(0,-200,512,520);x.restore();return c}
function drawFog(front){                                              // brume volumétrique : nappes qui dérivent avec parallaxe
  if(!FXF.fog) return;if(!FOGS) FOGS=makeFog();
  const k=(PAL.fogK||1)*(front?.55:1)*(FXF.xtra?1.25:1),n=(front?3:5)+(FXF.xtra?(front?2:3):0);
  ctx.save();ctx.globalCompositeOperation='lighter';
  const tint=PAL.fog.split(',').map(Number);
  for(let i=0;i<n;i++){
    const par=front?1.25+i*.1:.32+i*.07,w=front?760:620+i*60,sp=(front?.45:.18)*(1+i*.3);
    const span=W+w*2,x=((i*977-camX*par+ATK*sp)%span+span)%span-w;
    ctx.globalAlpha=Math.min(.5,(front?.09:.12)*k*(.7+.3*Math.sin(ATK*.01+i*2)));
    const y=GROUND-(front?4:26)-i*(front?7:13);
    ctx.fillStyle='rgb('+tint.map(v=>Math.round(v*.65)).join(',')+')';
    ctx.drawImage(FOGS,x,y-60*(front?.9:.7),w,front?150:130);
  }
  ctx.restore();
}
function drawEdgeMarks(){                                          // flèches vers les caisses hors de l'écran
  for(const c of crates){
    const sx=c.x-camX;if(sx>26&&sx<W-26) continue;
    const left=sx<=26,x=left?SAFE.l+26:W-SAFE.r-26,y=Math.min(GROUND-40,Math.max(120,c.y-20)),col=c.sup==='heal'?'#d62d2d':c.sup==='shield'?'#4aa0e8':c.gift?'#ff8ad0':'#ffd45a',a=.65+.3*Math.sin(tick*.15);
    ctx.save();ctx.globalAlpha=a;ctx.fillStyle='rgba(16,12,10,.75)';ctx.beginPath();ctx.arc(x,y,17,0,7);ctx.fill();ctx.fillStyle=col;ctx.beginPath();
    if(left){ctx.moveTo(x-9,y);ctx.lineTo(x+3,y-9);ctx.lineTo(x+3,y+9)}else{ctx.moveTo(x+9,y);ctx.lineTo(x-3,y-9);ctx.lineTo(x-3,y+9)}
    ctx.closePath();ctx.fill();ctx.restore();
  }
}
function drawMinimap(){
  const w=Math.min(300,W-640),h=14,x=Math.round((W-w)/2),y=H-40;if(w<120) return;
  ctx.save();ctx.fillStyle='rgba(16,12,10,.7)';ctx.fillRect(x-3,y-3,w+6,h+6);ctx.strokeStyle='#4a3a2e';ctx.lineWidth=1.5;ctx.strokeRect(x-2.5,y-2.5,w+5,h+5);
  const k=w/WORLD_W;ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(x+camX*k,y,W*k,h);   // zone visible
  for(const c of crates){ctx.fillStyle=c.sup==='heal'?'#d62d2d':c.sup==='shield'?'#4aa0e8':'#ffd45a';ctx.fillRect(x+c.x*k-1.5,y+h-6,3,5)}
  ctx.fillStyle='#c0392b';for(const z of zombies) ctx.fillRect(x+Math.max(0,Math.min(WORLD_W,z.x))*k-1,y+3,2,h-6);
  ctx.fillStyle='#7fe08a';ctx.fillRect(x+player.x*k-2,y+1,4,h-2);ctx.restore();
}
function draw(){
  syncMouse();G3.on=g3Active();G3.skip=false;
  if(state==='padmode'){drawPadScreen();return}
  if(state==='menu'||state==='options'||state==='credits'||state==='upgrades'||state==='weapon'||state==='keys'||state==='custom'||state==='lang'||state==='saves'||state==='maps'||state==='quit'||state==='bye'||state==='shop'||state==='boosts'||state==='wheel'||state==='fpsopt'||state==='maint'||state==='gamepad'||state==='padsel'||state==='nmsetup'||state==='playhub'||state==='remote'||state==='padjoin'||state==='mpmenu'||state==='mphost'||state==='mplobby'||state==='mpjoin'||state==='mpjoining'||state==='acpage'||state==='avatars'||state==='rpsetup'||state==='rpjoin'){drawMenu();drawCursor();return}
  ctx.save();
  if(shake>.5){ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);shake*=.88}
  drawBackground();ash();

  const p=player;
  ctx.save();ctx.translate(-camX,0);
  for(const d of decals){ctx.globalAlpha=Math.min(.7,d.life/300);ctx.fillStyle='#4a0a0c';ctx.beginPath();ctx.ellipse(d.x,d.y,d.r*2.5,d.r*.72,0,0,7);ctx.fill();if(d.r>6){ctx.fillStyle='#6a1014';ctx.beginPath();ctx.ellipse(d.x-d.r*.3,d.y-.5,d.r*1.5,d.r*.4,0,0,7);ctx.fill()}}
  ctx.globalAlpha=1;
  if(FXF.refl&&!G3.on){                                               // reflets sur le sol mouillé (les 6 zombies les plus proches seulement)
    ctx.save();ctx.beginPath();ctx.rect(camX-10,GROUND+9,W+20,H);ctx.clip();ctx.globalAlpha=.13;ctx.translate(0,GROUND*2+18);ctx.scale(1,-1);
    let nr=0;for(const z of zombies) if(!(z.emerge>0)&&!(z.mag&&z.ph==='under')&&Math.abs(z.x-camX-W/2)<W/2+60&&nr++<6) drawZombie(z);
    drawSoldier(player);ctx.restore();ctx.globalAlpha=1;
  }
  // zombies
  for(const z of zombies){
    if(Math.abs(z.x-camX-W/2)>W/2+(z.boss?260:100)) continue;           // hors écran : pas dessiné
    if(z.emerge>0){drawEmerge(z);continue}
    drawZombie(z);
    if(z.type==='digger'){ctx.fillStyle='rgba(255,60,40,.9)';ctx.beginPath();ctx.arc(z.x+z.dir*8*z.size,z.y-72*z.size,2.2,0,7);ctx.fill()}
    if(z.hp<z.maxhp&&!z.boss) bar(z.x-15,z.y-(z.hh?z.hh+14:85*z.size),30,z.hp,z.maxhp,'#d33');
  }
  drawCrates();drawBonusWorld();
  // joueur
  const py=p.y-48;
  p.aim=aimDir()?(p.face>0?0:Math.PI):Math.atan2(mouse.y-py,mouse.x+camX-p.x);
  if(p.hurtCd>0 && Math.floor(p.hurtCd/60)%2) ctx.globalAlpha=.4;
  if(death) drawDeadSoldier(p); else if(MP.on&&p.dead){ctx.globalAlpha=.45;ctx.save();ctx.translate(p.x,GROUND-12);ctx.rotate(-(p.face||1)*Math.PI/2);ctx.translate(-p.x,-(GROUND-12));const y0=p.y;p.y=GROUND;drawSoldier(p);p.y=y0;ctx.restore();ctx.globalAlpha=1} else if(MP.rp&&MP.hostLook){const sl=save.look,sp=prevO;save.look=MP.hostLook;prevO=MP.hostLook.outfit;try{drawSoldier(p)}finally{save.look=sl;prevO=sp}} else drawSoldier(p);
  if(MP.on) mpDrawOthers();rpTags();
  ctx.globalAlpha=1;drawBonusPlayer();
  // balles
  for(const b of bullets){
    if(b.fire){const t=1-b.life/(b.l0||16);ctx.fillStyle='rgba(255,'+(160-t*110|0)+',40,'+(.85-t*.6)+')';ctx.beginPath();ctx.arc(b.x,b.y,4+t*10,0,7);ctx.fill()}
    else{
      ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.28;ctx.strokeStyle=b.col;ctx.lineWidth=b.size*4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*.8,b.y-b.vy*.8);ctx.stroke();ctx.restore();   // halo lumineux
      ctx.strokeStyle=b.col;ctx.lineWidth=b.size;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*.6,b.y-b.vy*.6);ctx.stroke()}
  }
  for(const f of fx){const t=f.life/18;{const g=ctx.createRadialGradient(f.x,f.y,2,f.x,f.y,f.r*2.2);g.addColorStop(0,'rgba(255,220,140,'+(.55*t)+')');g.addColorStop(1,'rgba(255,120,40,0)');ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(f.x-f.r*2.2,f.y-f.r*2.2,f.r*4.4,f.r*4.4);ctx.restore()}ctx.fillStyle='rgba(255,'+(120+80*t|0)+',40,'+(.7*t)+')';ctx.beginPath();ctx.arc(f.x,f.y,f.r*(1.2-t*.5),0,7);ctx.fill()}
  for(const q of particles){
    const a=Math.max(0,Math.min(1,q.life/(q.ml||30)));
    if(q.shell){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.rot||0);ctx.fillStyle=q.col||'#d9b34a';ctx.fillRect(-2.5,-1,5,2);ctx.restore();continue}
    if(q.gib){const fa=Math.min(1,q.life/60);ctx.save();ctx.globalAlpha=fa;ctx.translate(q.x,q.y);ctx.rotate(q.rot);const r=q.sz;
      if(q.gib==='chunk'){ctx.fillStyle='#8a1a22';ctx.beginPath();ctx.moveTo(-r,-r*.6);ctx.lineTo(r*.8,-r);ctx.lineTo(r,r*.5);ctx.lineTo(-r*.3,r);ctx.closePath();ctx.fill();ctx.fillStyle='#5a0f14';ctx.fillRect(-r*.3,-r*.2,r*.7,r*.5)}
      else if(q.gib==='bone'){ctx.fillStyle=BONE;ctx.fillRect(-r*1.4,-r*.35,r*2.8,r*.7);ctx.beginPath();ctx.arc(-r*1.4,0,r*.55,0,7);ctx.arc(r*1.4,0,r*.55,0,7);ctx.fill()}
      else if(q.gib==='eye'){ctx.strokeStyle='#b3141c';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-r*1.6,0);ctx.lineTo(0,0);ctx.stroke();ctx.fillStyle='#f4f4d8';ctx.beginPath();ctx.arc(0,0,r*.9,0,7);ctx.fill();ctx.fillStyle='#c0252b';ctx.beginPath();ctx.arc(r*.25,0,r*.38,0,7);ctx.fill()}
      else{ctx.fillStyle=q.col;ctx.fillRect(-r*1.8,-r*.55,r*3.4,r*1.1);ctx.fillStyle=BONE;ctx.beginPath();ctx.arc(r*1.8,0,r*.55,0,7);ctx.fill();ctx.fillStyle='#8a1a22';ctx.fillRect(-r*1.8,-r*.55,r*.5,r*1.1)}
      ctx.restore();continue}
    if(q.smoke){ctx.globalAlpha=a*.32;ctx.fillStyle=q.col;ctx.beginPath();ctx.arc(q.x,q.y,q.sz+(1-a)*16,0,7);ctx.fill();ctx.globalAlpha=1;continue}
    if(q.glow){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=a;ctx.fillStyle=q.col;ctx.beginPath();ctx.arc(q.x,q.y,q.sz*1.3,0,7);ctx.fill();ctx.globalAlpha=a*.35;ctx.beginPath();ctx.arc(q.x,q.y,q.sz*3.4,0,7);ctx.fill();ctx.restore();continue}
    ctx.globalAlpha=q.sz?a:1;ctx.fillStyle=q.col;if(q.sz){ctx.beginPath();ctx.arc(q.x,q.y,q.sz,0,7);ctx.fill()}else ctx.fillRect(q.x,q.y,3,3);
  }
  ctx.globalAlpha=1;
  for(const a of acid){ctx.fillStyle=a.c||'#8fd04a';ctx.beginPath();ctx.arc(a.x,a.y,a.c?8:6,0,7);ctx.fill();ctx.save();ctx.globalCompositeOperation='lighter';glowAt(a.x,a.y,a.c?30:22,a.g||'120,255,80',.55);ctx.restore()}
  drawXmas();drawLights();
  ctx.restore();
  drawFog(true);
  bloodFlakes();
  drawEdgeMarks();
  if(FXF.post){const g=ctx.createRadialGradient(W/2,H*.55,Math.min(W,H)*.45,W/2,H*.55,Math.max(W,H)*.78);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(8,4,6,.38)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}   // vignettage cinéma
  if(curMap.dark&&state!=='over'){const cx=p.x-camX,cy=p.y-50,g=ctx.createRadialGradient(cx,cy,100,cx,cy,Math.max(W,H)*.72);g.addColorStop(0,'rgba('+curMap.dkc+',0)');g.addColorStop(1,'rgba('+curMap.dkc+','+Math.min(.85,curMap.dark*1.9)+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}

  ctx.restore();
  if(FXF.bloom) doBloom();
  if(fxB.freeze>0){ctx.fillStyle='rgba(110,210,235,'+(fxB.freeze<2000?.05:.11)+')';ctx.fillRect(0,0,W,H)}
  const hpR=p.hp/p.maxhp;
  overlayFx(state==='play'&&hpR<.35?(.35-hpR)/.35:0);
  const sfOn=SAFE.l+SAFE.r>0,RW0=W;if(sfOn){ctx.save();ctx.translate(SAFE.l,0);W=RW0-SAFE.l-SAFE.r}
  // --- HUD : vie
  panel(10,10,282,64,{});
  ctx.fillStyle='#b3241c';ctx.fillRect(20,20,22,22);ctx.fillStyle='#f2efe8';ctx.fillRect(29,24,4,14);ctx.fillRect(24,29,14,4);
  ctx.textAlign='left';ctx.fillStyle='#e8e0d0';ctx.font='700 20px '+FONT;ctx.fillText(Math.ceil(p.hp)+' / '+p.maxhp,50,39);
  segBar(20,48,262,12,p.hp,p.maxhp,hpR<.35&&tick%24<12?'#ff4a3a':'#c9372c',22);
  if(reviveAvail()) bonusIcon('revive',204,30,9);
  ctx.textAlign='right';ctx.fillStyle='#9a9086';ctx.font='500 13px '+FONT;ctx.fillText(kills+' '+tr('tués').toUpperCase(),282,36);ctx.textAlign='left';
  drawBonusHud();drawLevelHud();mpDrawHud();
  // --- HUD : vague, argent, zombies restants
  panel(W-262,10,252,64,{});hazard(W-262,10,8,64);
  ctx.textAlign='left';ctx.fillStyle='#8a8178';ctx.font='500 12px '+FONT;ctx.fillText('RESTANTS',W-244,32);
  ctx.fillStyle='#e8e0d0';ctx.font='700 26px '+FONT;ctx.fillText(state==='play'?String(zombies.length+spawnQueue.length):'-',W-244,60);
  ctx.textAlign='right';ctx.fillStyle='#e8e0d0';ctx.font='400 24px '+TITLE;ctx.fillText(tr('Vague').toUpperCase()+' '+wave,W-22,38);
  ctx.fillStyle='#e0a526';ctx.font='700 20px '+FONT;ctx.fillText(training?'ENTRAÎNEMENT':'$'+money+(gainMul()!==1?'   ×'+(Math.round(gainMul()*100)/100):''),W-22,62);ctx.textAlign='left';
  // --- HUD : arme en main
  const g=p.gun,wpn=WEAPONS[p.w];
  panel(14,H-76,340,62,{});
  ctx.save();ctx.beginPath();ctx.rect(20,H-70,96,50);ctx.clip();ctx.fillStyle='#0a0807';ctx.fillRect(20,H-70,96,50);
  drawWeaponIcon(p.w,68,H-45,88,40,skinOf(p.w),woodOf(p.w));ctx.restore();
  ctx.fillStyle='#f2efe8';ctx.font='700 19px '+FONT;ctx.textAlign='left';ctx.fillText(wpn.name.toUpperCase(),126,H-52);
  if(g){
    const t=g.time>0,left=t?g.time:g.ammo,tot=t?g.t0:g.a0,low=left/tot<.2&&tick%20<10;
    segBar(126,H-40,216,10,left,tot,low?'#ff4a3a':'#e0a526',16);
    ctx.textAlign='right';ctx.fillStyle=low?'#ff7a6a':'#ffd45a';ctx.font='700 16px '+FONT;ctx.fillText(t?Math.ceil(left/1000)+' '+tr('s').toUpperCase():left+' '+tr('balles').toUpperCase(),346,H-52);ctx.textAlign='left';
  } else {ctx.fillStyle='#8a8178';ctx.font='500 14px '+FONT;ctx.fillText(wpn.melee?'MÊLÉE  ·  ILLIMITÉ':'ARME PRINCIPALE  ·  ILLIMITÉ',126,H-30)}
  ctx.fillStyle='#b9b1a6';ctx.font='500 12px '+FONT;
  if(!touchOn()) ctx.fillText(tr('Armes à feu : dans les caisses larguées  ·  {0} : ramasser  ·  {1} : bonus  ·  Échap : pause  ·  {2} : plein écran',kn('pick'),kn('bonus'),kn('full')),16,H-4);
  {const bz=zombies.find(z=>z.boss);if(bz&&!cine){const w=440,x=Math.round((W-w)/2),y=82;panel(x,y,w,34,{norivets:true,edge:'#a8261c'});ctx.fillStyle='#e9e1d0';ctx.font='700 15px '+FONT;ctx.textAlign='left';ctx.fillText(bz.boss.n,x+12,y+14);segBar(x+10,y+19,w-20,10,Math.max(0,bz.hp),bz.maxhp,'#c9372c',40)}}
  drawMinimap();
  if(sfOn){W=RW0;ctx.restore()}
  if(cine){const c=cine,T=c.t,k=Math.min(1,T/20)*Math.min(1,Math.max(0,(430-T)/20)),bh=62*k;ctx.fillStyle='#000';ctx.fillRect(0,0,W,bh);ctx.fillRect(0,H-bh,W,bh);
    const txt=T<100?'UN VISITEUR S\'APPROCHE...':T<230?'IL INVOQUE LA NEIGE DE SANG':T<320?'IL S\'ENFONCE DANS LE SOL...':T<380?'...':'IL RESSURGIT DE L\'AUTRE CÔTÉ !';
    ctx.textAlign='center';ctx.fillStyle='#e9e1d0';ctx.font='400 28px '+TITLE;ctx.fillText(txt,W/2,H-bh/2+10);ctx.fillStyle='#8a8178';ctx.font='500 13px '+FONT;ctx.textAlign='right';ctx.fillText('Entrée / clic : passer',W-20,H-8);ctx.textAlign='left'}
  if((touchOn()||ctlEdit)&&state==='play') drawTouch();
  if(ctlEdit&&state==='play') drawCtlEdit();
  // --- annonce (vague, caisse...) avec rayures de danger
  if(msgT>0){
    const age=120-msgT,sc=age<14?1.5-age/28:1;
    ctx.save();ctx.globalAlpha=Math.min(1,msgT/25);ctx.translate(W/2,130);ctx.scale(sc,sc);ctx.textAlign='center';
    let fs=54;ctx.font='400 '+fs+'px '+TITLE;while(ctx.measureText(msg.toUpperCase()).width>W-300&&fs>22){fs-=2;ctx.font='400 '+fs+'px '+TITLE}
    const tw=ctx.measureText(msg.toUpperCase()).width;
    hazard(-tw/2-90,-fs*.45,64,12);hazard(tw/2+26,-fs*.45,64,12);
    ctx.fillStyle='#000';ctx.fillText(msg.toUpperCase(),3,3);ctx.fillStyle='#e9e1d0';ctx.fillText(msg.toUpperCase(),0,0);ctx.restore();
  }

  drawDeathUi();
  if(state==='over'){
    ctx.fillStyle='#000000d0';ctx.fillRect(0,0,W,H);
    const rg=ctx.createRadialGradient(W/2,H/2,60,W/2,H/2,H);rg.addColorStop(0,'rgba(120,0,0,0)');rg.addColorStop(1,'rgba(120,0,0,.45)');ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
    barbed(0,W,20,1);skull(W/2,70,1.5,'#d8d0c0');
    ctx.textAlign='center';ctx.font='400 66px '+TITLE;
    ctx.fillStyle='#000';ctx.fillText('VOUS ÊTES MORT',W/2+3,173);ctx.fillStyle='#b3241c';ctx.fillText('VOUS ÊTES MORT',W/2,170);
    for(let k=0;k<6;k++){const x=W/2-250+k*100+((k*53)%30),len=8+((k*29)%20)+Math.sin(tick*.03+k)*3;ctx.fillStyle='#8a1a14';ctx.fillRect(x,174,4,len);ctx.beginPath();ctx.arc(x+2,174+len,3.4,0,7);ctx.fill()}
    panel(W/2-270,196,540,98,{});
    [['VAGUE',wave,'#e8e0d0'],['ZOMBIES TUÉS',kills,'#e8e0d0'],['PIÈCES',training?'—':'+'+runGain,'#e0a526'],['XP',training?'—':'+'+runXp,'#9fd18a']].forEach(([l,v,c],k)=>{
      const cx=W/2-270+67.5+k*135;ctx.fillStyle='#8a8178';ctx.font='500 13px '+FONT;ctx.fillText(l,cx,214);ctx.fillStyle=c;ctx.font='700 28px '+FONT;ctx.fillText(v,cx,244);
    });
    if(!training){ctx.textAlign='center';ctx.font='600 14px '+FONT;ctx.fillStyle='#cfc6b8';[['KILLS',runSrc.kill],['MANCHES',runSrc.wave],['BONUS',runSrc.bonus]].forEach(([l,r],k)=>ctx.fillText(l+'  +'+r.x+' XP  +'+r.c+' $',W/2-270+90+k*180,280,172))}
    if(training){ctx.textAlign='center';ctx.fillStyle='#9fd18a';ctx.font='700 22px '+FONT;ctx.fillText('ENTRAÎNEMENT  ·  rien n\'est sauvegardé',W/2,312)} else {
    // barre de niveau animée
    if(overXp<save.xp) overXp=Math.min(save.xp,overXp+Math.max(.6,(save.xp-xpStart)/150));
    const nl=levelOf(overXp); if(nl>overLvl){overLvl=nl;overPulse=45}
    if(overPulse>0) overPulse--;
    const bw=440,bx=W/2-bw/2,by=332,info=drawXpBar(bx,by,bw,16,overXp,overPulse);
    const sc=1+(overPulse>0?.35*overPulse/45:0);
    ctx.save();ctx.translate(bx,by-12);ctx.scale(sc,sc);ctx.fillStyle=overPulse>0?'#ffd45a':'#f2efe8';ctx.font='700 24px '+FONT;ctx.textAlign='left';ctx.fillText(tr('Niveau').toUpperCase()+' '+info.L,0,0);ctx.restore();
    ctx.textAlign='right';ctx.fillStyle='#d8d2c8';ctx.font='500 15px '+FONT;ctx.fillText(Math.floor(overXp-info.a)+' / '+(info.b-info.a)+' XP',bx+bw,by-12);
    if(overPulse>0){ctx.textAlign='center';ctx.globalAlpha=Math.min(1,overPulse/20);ctx.fillStyle='#ffd45a';ctx.font='700 22px '+FONT;ctx.fillText('NIVEAU SUPÉRIEUR !',W/2,by-12);ctx.globalAlpha=1;
      ctx.fillStyle='rgba(255,220,120,'+(.16*overPulse/45)+')';ctx.fillRect(0,0,W,H)}
    }
    ctx.textAlign='left';menuRects=[];
    if(MP.on) btn(menuRects,W/2-150,360,300,50,'RETOUR AU SALON',{act:mpBackToLobby,size:24});else btn(menuRects,W/2-150,360,300,50,'REJOUER',{act:()=>reset(false),size:26});
    if(!MP.on) btn(menuRects,W/2-150,416,300,50,'ARSENAL',{act:openUpgrades,size:26});
    btn(menuRects,W/2-150,472,300,50,'MENU PRINCIPAL',{act:()=>{if(MP.on||MP.role) mpLeaveToMenu();else reset(true)},size:26});
    overlayFx(0);
  }
  if(state==='pause') drawPause(); else if(state==='trainpick') inMenuSpace(drawTrainPick);
  drawCursor();
}
