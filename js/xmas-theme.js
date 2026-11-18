// ===== Thème « Noël apocalyptique » (désactivable dans Options → FÊTES) =====
const FETE_PAL={sky:['#060912','#16213a','#3c4f72','#d9946a'],far:'#202a40',near:'#0e131e',win:'255,190,110',sun:'240,230,220',fog:'175,195,225',fogK:1.5,road:['#2c313c','#12151c'],walk:'#6a7388'};
function snowGround(){
  for(let k=-1;k<W/64+2;k++){const x=k*64+((k*37+999)%26),r=24+((k*13)%20);ctx.fillStyle='rgba(222,230,244,.9)';ctx.beginPath();ctx.ellipse(x,GROUND+5,r,6+((k*7)%4),0,0,7);ctx.fill()}
  ctx.fillStyle='rgba(222,230,244,.5)';ctx.fillRect(0,GROUND+6,W,3);
}
function snowfall(){
  if(!FXF.anim) return;
  ctx.save();ctx.fillStyle='#fff';
  for(let i=0,n=FXF.anim===2?120:40;i<n;i++){const sp=.5+(i%4)*.35,x=((i*97.3+tick*.25*(1+i%3)+Math.sin(tick*.012+i)*28)%(W+40))-20,y=((i*53.7+tick*sp)%(H+20))-10,r=.9+(i%3)*.7;ctx.globalAlpha=.45+(i%5)*.1;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}
  ctx.restore();
}
function garland(){
  const seg=150,n=Math.ceil(W/seg)+1,sag=22;
  ctx.save();ctx.strokeStyle='#0c100c';ctx.lineWidth=2;
  for(let s0=0;s0<n;s0++){
    const x0=s0*seg-10,x1=x0+seg,xm=(x0+x1)/2;ctx.beginPath();ctx.moveTo(x0,6);ctx.quadraticCurveTo(xm,6+sag*2,x1,6);ctx.stroke();
    for(let b=1;b<7;b++){
      const t=b/7,x=(1-t)*(1-t)*x0+2*t*(1-t)*xm+t*t*x1,y=(1-t)*(1-t)*6+2*t*(1-t)*(6+sag*2)+t*t*6,idx=s0*7+b;
      if(idx%9===4){ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.arc(x,y+3,2.4,0,7);ctx.fill();continue}   // ampoule grillée
      const col=['#e2342e','#ffd45a','#3ac86a','#4aa0e8'][idx%4],a=.55+.45*Math.sin(ATK*.07+idx*1.9);
      ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y+3,3,0,7);ctx.fill();
      if(FXF.anim){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.4*a;glowAt(x,y+3,15,col==='#e2342e'?'255,70,60':col==='#ffd45a'?'255,210,90':col==='#3ac86a'?'70,230,110':'80,170,255',.9);ctx.restore()}
    }
  }
  ctx.restore();
}
// neige du titre : le calque est calculé une fois à partir des vraies lettres (couche de neige sur le dessus des glyphes, épaisseur irrégulière, ombrage bleuté, gouttes de neige fondue)
let TSNOW=null,TSKEY='';
function titleSnow(){
  const key=RES+'|'+(document.fonts&&document.fonts.status);
  if(!TSNOW||TSKEY!==key){
    TSKEY=key;const X0=60,Y0=50,CW2=480,CH2=190;
    TSNOW=document.createElement('canvas');TSNOW.width=Math.ceil(CW2*RES);TSNOW.height=Math.ceil(CH2*RES);
    const c=TSNOW.getContext('2d');c.scale(RES,RES);c.translate(-X0,-Y0);
    const lines=[['THE',70,80,30],['INFECTED',70,143,76],['GROUNDS',70,209,76]];
    const text=(dy,col)=>{c.fillStyle=col;for(const[t,x,y,sz] of lines){c.font='400 '+sz+'px '+TITLE;c.fillText(t,x,y+dy*sz/76)}};
    const caps=lines.map(([t,x,y,sz])=>{c.font='400 '+sz+'px '+TITLE;const m=c.measureText('E');return y-(m.actualBoundingBoxAscent||sz*.72)});
    text(0,'#f6f9ff');                                                  // 1. les lettres en blanc
    c.globalCompositeOperation='destination-out';                       // 2. on enlève les lettres décalées vers le bas : il reste une calotte sur chaque bord supérieur
    for(let x=X0;x<X0+CW2;x+=1){c.save();c.beginPath();c.rect(x,Y0,1.05,CH2);c.clip();text(3+3.4*Math.abs(Math.sin(x*.045))+2.6*Math.abs(Math.sin(x*.12+1.3)),'#000');c.restore()}
    c.globalCompositeOperation='destination-in';                        // 3. la neige reste uniquement sur le haut des lettres (pas dans les coupures de la police)
    c.beginPath();lines.forEach(([t,x,y,sz],i)=>c.rect(x-6,caps[i]-4,500,(sz/76)*13+4));c.fillStyle='#000';c.fill();
    c.globalCompositeOperation='source-atop';                           // 4. ombrage : blanc pur dessus, bleu-gris dessous
    lines.forEach(([t,x,y,sz],i)=>{const top=caps[i],h=(sz/76)*13+4,g=c.createLinearGradient(0,top,0,top+h);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.5,'rgba(232,240,252,1)');g.addColorStop(1,'rgba(168,188,224,1)');c.fillStyle=g;c.fillRect(x-6,top-4,500,h+4)});
    c.globalCompositeOperation='source-over';                           // 5. petites coulures sous la calotte
    c.fillStyle='rgba(222,234,252,.95)';
    for(let k=0;k<12;k++){const li=1+(k%2),x=84+(k*47)%380,y=caps[li]+8+((k*5)%4),len=3+(k*7)%5;c.fillRect(x,y,2,len);c.beginPath();c.arc(x+1,y+len,1.5,0,7);c.fill()}
  }
  ctx.drawImage(TSNOW,60,50,480,190);
  if(FXF.anim===2){ctx.save();ctx.globalCompositeOperation='lighter';for(let k=0;k<5;k++){const a=Math.max(0,Math.sin(tick*.06+k*1.9));if(a<.2) continue;const x=96+((k*83)%380),y=(k%2?90:158)+((k*17)%6);ctx.globalAlpha=a*.9;ctx.fillStyle='#fff';ctx.fillRect(x-.8,y-3,1.6,6);ctx.fillRect(x-3,y-.8,6,1.6)}ctx.restore()}   // scintillement
}
function menuTree(){                                              // sapin calciné et décoré (espace du menu : 960×540)
  const bx=585,by=GROUND;
  ctx.save();ctx.translate(bx,by);ctx.rotate(-.05);
  ctx.fillStyle='#2a1c14';ctx.fillRect(-6,-30,12,30);
  const T=[[-30,-100,64],[-78,-150,50],[-126,-196,36]];
  for(const [yb,yt,hw] of T){ctx.fillStyle='#16251c';ctx.beginPath();ctx.moveTo(-hw,yb);ctx.lineTo(hw,yb);ctx.lineTo(0,yt);ctx.closePath();ctx.fill()}
  ctx.fillStyle='#0a0d0b';for(const [x,y,w] of[[-30,-60,14],[22,-104,12],[-8,-150,10],[36,-48,10]]){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y+4);ctx.lineTo(x+w*.4,y+w);ctx.closePath();ctx.fill()}   // zones brûlées
  ctx.fillStyle='rgba(236,242,252,.93)';
  for(const [yb,yt,hw] of T)for(let k=1;k<7;k++){const t=k/7.5,py=yb-(yb-yt)*t,px=hw*(1-t);ctx.beginPath();ctx.ellipse(-px,py,7-k*.4,3.6,0,0,7);ctx.ellipse(px,py,6-k*.3,3.4,0,0,7);ctx.fill()}
  const orn=[[-24,-46,'#e2342e'],[28,-50,'#4aa0e8'],[-10,-70,'#ffd45a'],[0,-96,'#e2342e'],[-30,-118,'#3ac86a'],[22,-134,'#ffd45a'],[-8,-160,'#4aa0e8'],[10,-176,'#e2342e']];
  orn.forEach(([x,y,c],i)=>{ctx.fillStyle=i===3?'#444':c;ctx.beginPath();if(i===3){ctx.arc(x,y,5,0,Math.PI)}else ctx.arc(x,y,5,0,7);ctx.fill()});   // une boule brisée
  for(let i=0;i<12;i++){const t=i/11,px=Math.sin(i*2.1)*40*(1-t*.8),py=-34-t*160,a=.5+.5*Math.sin(ATK*.08+i*1.7);if(i%5===2) continue;const col=['255,70,60','255,210,90','70,230,110','80,170,255'][i%4];ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.8*a;glowAt(px,py,13,col,1);ctx.restore();ctx.fillStyle='rgba('+col+',.9)';ctx.beginPath();ctx.arc(px,py,2.2,0,7);ctx.fill()}
  ctx.fillStyle='#8a7222';ctx.save();ctx.translate(6,-203);ctx.rotate(.5);ctx.beginPath();for(let k=0;k<10;k++){const r=k%2?5:11,a=k*Math.PI/5-Math.PI/2;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.restore();   // étoile tordue
  ctx.restore();
  ctx.fillStyle='rgba(222,230,244,.9)';ctx.beginPath();ctx.ellipse(bx,by+4,66,8,0,0,7);ctx.fill();
}
function drawMenu(){
  const fe=SET.fete,keep=PAL;if(fe) PAL=FETE_PAL;
  drawBackground();PAL=keep;
  if(fe){snowGround();const per=W+800,cyc=per+2600,m=((tick*2.4)%cyc)-400;if(m<W+400) drawSleigh(m,92+Math.sin(tick*.02)*10,1,false,Math.floor(tick*2.4/cyc)%2===1)}
  ctx.fillStyle=fe?'#0007':'#0009';ctx.fillRect(0,0,W,H);
  embers();
  overlayFx(0);   // vignette et grain derrière les panneaux du menu
  inMenuSpace(drawMenuBody);
  if(fe){snowfall();garland()}
}
function drawMenuBody(){
  menuRects=[];
  if(state==='upgrades'){drawUpgrades();return}
  if(state==='boosts'){drawBoosts();return}
  if(state==='fpsopt'){drawFpsPage();return}
  if(state==='maint'){drawMaint();return}
  if(state==='gamepad'){drawGamepadPage();return}
  if(state==='padsel'){drawPadSel();return}
  if(state==='nmsetup'){drawNmSetup();return}
  if(state==='playhub'){drawPlayHub();return}
  if(state==='remote'){drawRemotePage();return}
  if(state==='padjoin'){drawPadJoin();return}
  if(state==='mpmenu'){drawMpMenu();return}
  if(state==='mphost'){drawMpHost();return}
  if(state==='mplobby'){drawMpLobby();return}
  if(state==='mpjoin'){drawMpJoin();return}
  if(state==='mpjoining'){drawMpJoining();return}
  if(state==='acpage'){drawAcPage();return}
  if(state==='avatars'){drawAvatars();return}
  if(state==='rpsetup'){drawRpSetup();return}
  if(state==='rpjoin'){drawRpJoin();return}
  if(state==='wheel'){drawWheel();return}
  if(state==='weapon'){drawWeaponDetail();return}
  if(state==='keys'){drawKeys();return}
  if(state==='lang'){drawLang();return}
  if(state==='saves'){drawSaves();return}
  if(state==='maps'){drawMaps();return}
  if(state==='quit'||state==='bye'){drawQuit();return}
  if(state==='shop'){drawShop();return}
  if(state==='custom'){drawCustom();return}
  if(SET.fete&&state==='menu') menuTree();
  // silhouette du soldat à droite (dessin original)
  menuP.x=720;menuP.y=GROUND;menuP.face=-1;menuP.aim=Math.PI+.1;menuP.w=MENU_GUN;menuP.cd=0;menuP.swing=0;
  ctx.save();ctx.translate(720,GROUND);ctx.scale(1.9,1.9);ctx.translate(-720,-GROUND);
  drawSoldier(menuP);ctx.restore();
  ctx.textAlign='left';
  barbed(0,W,16,1);barbed(0,W,22,1.3);
  ctx.font='400 30px '+TITLE;ctx.fillStyle='#000';ctx.fillText('THE',73,83);ctx.fillStyle='#d8d0c0';ctx.fillText('THE',70,80);ctx.font='400 76px '+TITLE;
  ctx.fillStyle='#000';ctx.fillText('INFECTED',73,146);ctx.fillStyle='#e9e1d0';ctx.fillText('INFECTED',70,143);
  ctx.fillStyle='#000';ctx.fillText('GROUNDS',73,212);ctx.fillStyle='#b3241c';ctx.fillText('GROUNDS',70,209);
  ctx.strokeStyle='rgba(10,8,8,.55)';ctx.lineWidth=1.4;                           // rayures sur le titre
  for(let k=0;k<16;k++){const x=70+(k*37)%430,y=70+(k*53)%140;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+26,y+9);ctx.stroke()}
  for(let k=0;k<5;k++){const x=84+k*92,len=6+((k*31)%16)+Math.sin(ATK*.03+k)*3;ctx.fillStyle='#7a1812';ctx.fillRect(x,211,4,len);ctx.beginPath();ctx.arc(x+2,211+len,3.4,0,7);ctx.fill()}
  ctx.fillStyle='rgba(233,225,208,.5)';ctx.font='500 15px '+FONT;if('letterSpacing' in ctx) ctx.letterSpacing='5px';{ctx.save();ctx.font='400 76px '+TITLE;const tcx=70+Math.max(ctx.measureText('INFECTED').width,ctx.measureText('GROUNDS').width)/2;ctx.restore();ctx.textAlign='center';ctx.fillText('ZOMBIES SIEGE',tcx+2.5,232);ctx.textAlign='left'};if('letterSpacing' in ctx) ctx.letterSpacing='0px';
  if(SET.fete&&state==='menu'){
    titleSnow();
    ctx.textAlign='left';ctx.font='700 14px '+FONT;ctx.fillStyle='#ffd45a';ctx.fillText('★  ÉDITION NOËL APOCALYPTIQUE  ★',70,50);
  }
  if(state==='menu'){
    drawProfileCard();
    {const it=[['JOUER',()=>{mapTrain=false;training=false;NM.on=false;state='playhub'},gameMode==='VR'?'VR en maintenance':'solo · multijoueur · nightmare · entraînement · arsenal'],
      ['PERSONNALISATION',()=>state='custom','skins · zombies jouables · sapin'],
      ['BOUTIQUE',()=>state='shop','tenues et packs de fêtes'],
      ['OPTIONS',()=>{optFrom='menu';state='options'},'jeu · son · graphismes · touches · crédits'],
      ['QUITTER',()=>state='quit','']];
     it.forEach(([lab,act,sub],k)=>btn(menuRects,60,246+k*50,290,44,lab,{act,size:19,sub}))}
    {const li=langInfo(),x=W-210,y=H-104,w=170,h=36,hot=mouse.x>=x&&mouse.x<=x+w&&mouse.y>=y&&mouse.y<=y+h;menuRects.push({x,y,w,h,act:()=>state='lang'});
     panel(x,y,w,h,{top:hot?'#4a2018':'#2d2723',bot:hot?'#2a100c':'#17120f',edge:hot?'#e2542e':'#4a3a2e',norivets:true});drawFlag(li.f,x+10,y+6,34,24);
     ctx.fillStyle='#f2efe8';ctx.font='700 15px '+FONT;ctx.textAlign='left';ctx.fillText(li.n,x+54,y+24,w-62)}
    {const cx=W-110,cy=122,r=42,ids=['heal','dmg','freeze','turret','mine','barricade','molotov','shield'],fr=freeReady(),hot=Math.hypot(mouse.x-cx,mouse.y-cy)<r+8;
     menuRects.push({x:cx-r-8,y:cy-r-8,w:2*r+16,h:2*r+34,act:()=>{wheelConf=false;wheelFrom='menu';state='wheel'}});
     ctx.save();ctx.translate(cx,cy);if(hot||fr){ctx.shadowColor=fr?'#ffd45a':'#e2542e';ctx.shadowBlur=18}
     ctx.fillStyle='#14100e';ctx.beginPath();ctx.arc(0,0,r+6,0,7);ctx.fill();ctx.strokeStyle=hot?'#e2542e':'#7a2c1c';ctx.lineWidth=3;ctx.stroke();ctx.shadowBlur=0;
     ctx.rotate(ATK*(fr||hot?.025:.006));
     for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,i*Math.PI/4,(i+1)*Math.PI/4);ctx.closePath();ctx.fillStyle=BON[ids[i]].c;ctx.fill();ctx.fillStyle=i%2?'rgba(0,0,0,.35)':'rgba(255,255,255,.08)';ctx.fill();ctx.strokeStyle='#0b0908';ctx.lineWidth=1.5;ctx.stroke()}
     ctx.restore();
     ctx.fillStyle='#0b0908';ctx.beginPath();ctx.arc(cx,cy,10,0,7);ctx.fill();ctx.fillStyle='#e0a526';ctx.beginPath();ctx.arc(cx,cy,6,0,7);ctx.fill();
     ctx.fillStyle='#e2542e';ctx.strokeStyle='#0b0908';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-7,cy-r-9);ctx.lineTo(cx+7,cy-r-9);ctx.lineTo(cx,cy-r+3);ctx.closePath();ctx.stroke();ctx.fill();
     ctx.textAlign='center';ctx.font='700 17px '+FONT;ctx.fillStyle=hot?'#fff':'#f2efe8';ctx.fillText('TIRAGE',cx,cy+r+24);
     if(fr){const pu=1+.12*Math.sin(tick*.15);ctx.fillStyle='#d62d2d';ctx.beginPath();ctx.arc(cx+r-4,cy-r+8,11*pu,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.font='900 15px '+FONT;ctx.fillText('!',cx+r-4,cy-r+13)}
     ctx.textAlign='left'}
    btn(menuRects,W-110-62,206,124,34,'MODE : '+gameMode,{act:()=>setGameMode(gameMode==='2D'?'3D':gameMode==='3D'?'VR':'2D'),size:17});
    if(gameMode==='3D'){ctx.textAlign='center';ctx.fillStyle=G3.status==='ready'?'#9fd18a':G3.status==='load'?'#ffd45a':'#e2542e';ctx.font='500 12px '+FONT;ctx.fillText(G3.status==='ready'?'3D prête':G3.status==='load'?'chargement 3D…':'3D indisponible',W-110,252);ctx.textAlign='left'}
    {const u=UPD,lab=u.status==='avail'?'INSTALLER V'+u.latest:u.status==='check'?'RECHERCHE…':'MISE À JOUR',
       sub=u.status==='avail'?'nouvelle version !':u.status==='ok'?'à jour ✔ V'+GAME_VERSION:u.status==='err'?(u.msg||'impossible'):u.status==='check'?'patiente…':'rechercher';
     btn(menuRects,W-220,H-158,180,46,lab,{act:()=>u.status==='avail'?updApply():updCheck(true),size:16,sub,dim:u.status==='check'});
     if(u.status==='avail'){const bx=385,by=H-52,bw=340,pu=.6+.4*Math.sin(tick*.12);panel(bx,by,bw,40,{norivets:true,edge:'#ffd45a'});menuRects.push({x:bx,y:by,w:bw,h:40,act:updApply});
       ctx.textAlign='center';ctx.fillStyle='rgba(255,212,90,'+(.75+.25*pu)+')';ctx.font='700 14px '+FONT;ctx.fillText('● MISE À JOUR V'+u.latest+'  ·  CLIQUER POUR INSTALLER',bx+bw/2,by+25,bw-16);ctx.textAlign='left'}}
    btn(menuRects,W-220,H-60,180,38,tr('Plein écran  ({0})',kn('full')).toUpperCase(),{act:toggleFull,size:15});
    ctx.fillStyle='#e0a526';ctx.font='700 24px '+FONT;ctx.textAlign='right';
    ctx.fillText(tr('Niveau').toUpperCase()+' '+curLevel()+'   ·   $'+save.bank+'   ·   '+tr('Record : vague {0}',save.best).toUpperCase(),W-40,50);ctx.textAlign='left';
  } else if(state==='options'){
    ctx.fillStyle='#e9e1d0';ctx.font='400 34px '+TITLE;ctx.fillText('OPTIONS',70,262);
    const TABS=['GAMEPLAY','AUDIO','GRAPHISMES','COMMANDES','DONNÉES'];
    TABS.forEach((t,i)=>{const x=70+i*140,y=270,w=134,h=28,on=optTab===i,hot=mouse.x>=x&&mouse.x<=x+w&&mouse.y>=y&&mouse.y<=y+h;
      menuRects.push({x,y,w,h,act:()=>{optTab=i}});
      panel(x,y,w,h,{top:on?'#4a2018':hot?'#3a2e28':'#26211e',bot:on?'#2a100c':'#14100e',edge:on?'#e2542e':hot?'#a8553a':'#4a3a2e',norivets:true});if(on) hazard(x+2,y+2,w-4,3);
      ctx.fillStyle=on?'#fff':'#a89f94';ctx.font='700 15px '+FONT;ctx.textAlign='center';ctx.fillText(t,x+w/2,y+19,w-10);ctx.textAlign='left'});
    const yo=[316,366,416],X1=70,X2=470,BW=380,BH=44,onoff=v=>tr(v?'Oui':'Non').toUpperCase();
    const tg=(x,y,lab,key,sub,extra)=>btn(menuRects,x,y,BW,BH,lab+' : '+onoff(SET[key]),{act:()=>{SET[key]=!SET[key];if(extra) extra();saveOpts()},size:20,sub});
    if(optTab===0){                                                   // GAMEPLAY
      btn(menuRects,X1,yo[0],BW,BH,tr('Visée').toUpperCase()+' : '+tr(aimDir()?'Direction':'Souris').toUpperCase(),{act:()=>{SET.aim=SET.aim==='dir'?'mouse':'dir';saveOpts()},size:20});
      tg(X2,yo[0],tr('Tremblement').toUpperCase(),'shake');
      tg(X1,yo[1],tr('Sang').toUpperCase(),'blood');
      tg(X2,yo[1],'GORE','gore','détails sanglants, morceaux, os et organes');
      tg(X1,yo[2],'MODE FÊTES','fete','thème de Noël, traîneaux et zombies de Noël');
      ctx.fillStyle='#b9b1a6';ctx.font='500 14px '+FONT;ctx.fillText(aimDir()?'Visée DIRECTION : tir droit devant soi (idéal sur mobile).':'Visée SOURIS : le soldat vise vers le curseur.',X2,yo[2]+27);
    } else if(optTab===1){                                           // AUDIO
      btn(menuRects,X1,yo[0],BW,BH,tr('Effets').toUpperCase()+' : '+(SET.vol>0?Math.round(SET.vol*100)+' %':tr('Non').toUpperCase()),{act:()=>{const L=[1,.6,.3,0];SET.vol=L[(L.indexOf(SET.vol)+1)%4]??1;setVol();saveOpts();audioInit();sfx('click')},size:20,sub:'volume des armes et des bruitages'});
      btn(menuRects,X2,yo[0],BW,BH,tr('Musique').toUpperCase()+' : '+onoff(SET.music),{act:()=>{SET.music=!SET.music;musicApply();saveOpts()},size:20,sub:'activer / désactiver'});
      panel(X1,yo[1]+6,780,50,{grunge:.7,norivets:true});
      ctx.fillStyle='#e8e0d0';ctx.font='700 18px '+FONT;ctx.fillText('VOLUME MUSIQUE',X1+18,yo[1]+37);
      const sx=X1+190,sw=420,sy=yo[1]+31;
      menuRects.push({x:sx-10,y:yo[1]+14,w:sw+20,h:34,slider:true,act:()=>{SET.mvol=Math.max(0,Math.min(1,(mouse.x-sx)/sw));if(SET.mvol>0&&!SET.music) SET.music=true;musicApply();saveOpts()}});
      ctx.fillStyle='#0b0908';ctx.fillRect(sx,sy-4,sw,8);ctx.strokeStyle='#4a3a2e';ctx.lineWidth=1;ctx.strokeRect(sx+.5,sy-3.5,sw-1,7);
      ctx.fillStyle=SET.music?'#e2542e':'#5a4a40';ctx.fillRect(sx,sy-4,sw*SET.mvol,8);
      const tx=sx+sw*SET.mvol,hotS=sliderActive||(mouse.x>=sx-10&&mouse.x<=sx+sw+10&&mouse.y>=yo[1]+14&&mouse.y<=yo[1]+48);
      ctx.fillStyle=hotS?'#fff':'#d8d2c8';ctx.beginPath();ctx.roundRect(tx-6,sy-12,12,24,3);ctx.fill();ctx.strokeStyle='#000';ctx.stroke();
      ctx.fillStyle='#d8d2c8';ctx.font='700 16px '+FONT;ctx.fillText(Math.round(SET.mvol*100)+' %',sx+sw+22,sy+5);
    } else if(optTab===2){                                           // GRAPHISMES
      const q=GFX.find(x=>x.id===SET.gfx)||GFX[0],pf=PROFS.find(x=>x.id===SET.prof)||PROFS[0],cols=[70,330,590],ys=[306,348,390,432],oo=v=>v?'OUI':'NON';
      const B=(c,r,lab,act)=>btn(menuRects,cols[c],ys[r],240,36,lab,{act,size:16});
      const cyc=PROFS.filter(x=>x.id!=='custom');
      B(0,0,'PROFIL : '+pf.n,()=>{const k=cyc.findIndex(x=>x.id===SET.prof);setProfile(cyc[(k+1)%cyc.length].id)});
      B(1,0,'RÉSOLUTION : '+q.n,()=>{const k=GFX.findIndex(x=>x.id===q.id);SET.gfx=GFX[(k+1)%GFX.length].id;SET.prof='custom';saveOpts();fit()});
      B(2,0,'LIMITE FPS : '+fpsName(SET.fps>0?Math.min(SET.fps,HZ):0),()=>{const o=fpsOptions(),k=o.indexOf(SET.fps>0?Math.min(SET.fps,HZ):0);SET.fps=o[(k+1)%o.length];SET.prof='custom';saveOpts()});
      B(0,1,'LUMIÈRES : '+oo(SET.lights),()=>fxToggle('lights'));
      B(1,1,'BRUME : '+oo(SET.fog),()=>fxToggle('fog'));
      B(2,1,'REFLETS : '+oo(SET.refl),()=>fxToggle('refl'));
      B(0,2,'PARTICULES : '+PARTS[Math.max(0,Math.min(3,SET.parts|0))].n,()=>{SET.parts=((SET.parts|0)+1)%4;SET.prof='custom';saveOpts()});
      B(1,2,'VIGNETTE ET GRAIN : '+oo(SET.post),()=>fxToggle('post'));
      B(2,2,'BLOOM (LUEUR) : '+oo(SET.bloom),()=>fxToggle('bloom'));
      B(0,3,'COMPTEUR FPS  ›',()=>state='fpsopt');
      B(1,3,'ANIMATIONS : '+['AUCUNE','RÉDUITES','COMPLÈTES'][[0,1,2].includes(SET.anim)?SET.anim:2],()=>{SET.anim=((SET.anim|0)+1)%3;SET.prof='custom';saveOpts()});
      {const sx=cols[2],sy=ys[3],sw=240,sh=36,k0=sx+12,kw=sw-24,hotS=sliderActive&&sliderActive.lum;
       panel(sx,sy,sw,sh,{norivets:true,grunge:.6});
       ctx.fillStyle='#f2efe8';ctx.font='700 14px '+FONT;ctx.fillText('LUMINOSITÉ  '+Math.round(SET.bright*100)+' %',sx+12,sy+16,sw-24);
       ctx.fillStyle='#0b0908';ctx.fillRect(k0,sy+24,kw,5);ctx.fillStyle='#e2542e';ctx.fillRect(k0,sy+24,kw*SET.bright,5);
       ctx.fillStyle=hotS?'#fff':'#d8d2c8';ctx.beginPath();ctx.roundRect(k0+kw*SET.bright-4,sy+19,8,15,2);ctx.fill();
       menuRects.push({x:sx,y:sy,w:sw,h:sh,slider:true,lum:true,act:()=>{SET.bright=Math.max(0,Math.min(1,(mouse.x-k0)/kw));saveOpts()}})}
      ctx.fillStyle='#b9b1a6';ctx.font='500 13px '+FONT;
      ctx.fillText('AUTO : la résolution puis les effets baissent seuls si le jeu rame. ÉCO = sans animations ni effets, pour les très vieux PC.',290,488,640);
      ctx.fillText('ANIMATIONS : AUCUNE fige les décors et les menus (neige, lumières, brume) pour alléger au maximum. Luminosité : 50 % = normal.',290,506,640);
      ctx.fillText('Écran détecté : '+HZ+' Hz  ·  résolution interne '+cv.width+'×'+cv.height+'  ·  logique fixée à 60 Hz (même vitesse partout).',290,524,640);
    } else if(optTab===3){                                           // COMMANDES
      btn(menuRects,X1,yo[0],BW,BH,'TOUCHES',{act:()=>{bindListen=null;state='keys'},size:20,sub:'changer les touches du clavier'});
      btn(menuRects,X2,yo[0],BW,BH,tr('Visée').toUpperCase()+' : '+tr(aimDir()?'Direction':'Souris').toUpperCase(),{act:()=>{SET.aim=SET.aim==='dir'?'mouse':'dir';saveOpts()},size:20});
      btn(menuRects,X1,yo[1],BW,BH,'MANETTE  ›',{act:()=>state='gamepad',size:20,sub:GPS.pads.length?GPS.pads.length+' détectée(s)':'Xbox, PlayStation, Switch Pro…'});
      btn(menuRects,X2,yo[1],BW,BH,'TÉLÉPHONE-MANETTE  ›',{act:()=>state='remote',size:19,sub:RMT.status==='ok'?'● connecté':'utiliser son téléphone comme manette'});
      btn(menuRects,X1,yo[2],BW,BH,'BOUTONS TACTILES  ›',{act:()=>startCtlEdit('game'),size:20,sub:'déplacer et régler les boutons (mode immortel)'});
      ctx.fillStyle='#b9b1a6';ctx.font='500 13px '+FONT;
      ctx.fillText(tr('{0}/{1} déplacer · {2} sauter · clic : attaquer · {3} : ramasser · Échap : pause · {4} : bonus',kn('left'),kn('right'),kn('jump'),kn('pick'),kn('bonus')),290,486,640);
      ctx.fillText('Mobile : boutons tactiles personnalisables. Manette : branche-la, elle est détectée toute seule.',290,506,640);
    } else {                                                          // DONNÉES
      btn(menuRects,X1,yo[0],BW,BH,'SAUVEGARDE',{act:()=>{saveConfirm=false;state='saves'},size:20,sub:'exporter, importer, effacer'});
      btn(menuRects,X2,yo[0],BW,BH,tr('Langue').toUpperCase()+' : '+langInfo().n,{act:()=>state='lang',size:20});
      btn(menuRects,X1,yo[1],BW,BH,'CRÉDITS',{act:()=>state='credits',size:20});
      btn(menuRects,X1,yo[2],BW,BH,UPD.status==='avail'?'INSTALLER LA MISE À JOUR  (V'+UPD.latest+')':'RECHERCHER UNE MISE À JOUR',{act:()=>UPD.status==='avail'?updApply():updCheck(true),size:19,sub:UPD.status==='ok'?'à jour ✔  V'+GAME_VERSION+'  ·  ta progression est conservée':UPD.status==='check'?'recherche en cours…':UPD.status==='err'?(UPD.msg||'recherche impossible'):'ta progression est conservée à chaque mise à jour'});
      btn(menuRects,X2,yo[1],BW,BH,'C02 ANTI-CHEAT  ›',{act:()=>{acMsg='';state='acpage'},size:20,sub:ACG.ok()?'● actif · v'+ACG.VER:'● alerte : voir le détail'});
    }
    btn(menuRects,70,470,200,36,'RETOUR',{act:()=>state=optFrom==='pause'?'pause':'menu',size:20});
  } else {
    ctx.fillStyle='#e9e1d0';ctx.font='400 34px '+TITLE;ctx.fillText('CRÉDITS',70,270);
    ctx.font='500 20px '+FONT;ctx.fillStyle='#d8d2c8';
    ctx.fillText('THE INFECTED GROUNDS  ·  ZOMBIES SIEGE',70,308);
    ctx.fillText('Un jeu by C02. Code et dessins originaux créés pour ce projet.',70,338);
    ctx.fillText('Un shooter de survie en vue de côté.',70,368);
    btn(menuRects,70,422,160,48,'RETOUR',{act:()=>state='menu'});
  }
  hazard(0,H-8,W,8);
  ctx.fillStyle='#8a8178';ctx.font='500 15px '+FONT;
  ctx.fillText('V'+GAME_VERSION+'   ·   '+ACG.NAME+' v'+ACG.VER,70,H-8);
}
