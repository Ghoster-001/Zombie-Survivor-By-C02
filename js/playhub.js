// ===== Page JOUER : choix du type de partie selon le mode (2D / 3D) =====
function drawPlayHub(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('JOUER',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('JOUER',40,58);ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,120,3);
  {
    const m3=gameMode==='3D';
    const cards=[
      ['SOLO','cartes et difficultés · progression sauvegardée',()=>{mapTrain=false;training=false;NM.on=false;state='maps'}],
      ['MULTIJOUEUR',m3?'coop 4 joueurs · battle royale 10 joueurs':'coop 2 à 4 joueurs · remote play',()=>{NM.mpWanted=false;MP.msg='';MP.status='off';state='mpmenu'}],
      ['NIGHTMARE · SOLO','infini · une arme par catégorie · munitions illimitées',()=>{mapTrain=false;training=false;state='nmsetup'}],
      ['NIGHTMARE · MULTI','coop infinie : zombies ultra forts, gains ×9 / ×10',()=>{NM.mpWanted=true;MP.msg='';MP.status='off';state='mpmenu'}],
      ['ENTRAÎNEMENT','toutes les armes au maximum · rien n\'est sauvegardé',()=>{mapTrain=true;state='maps'}],
      ['ARSENAL','armes · boosts · améliorations · roulette',openUpgrades]];
    cards.forEach(([lab,sub,act],k)=>{const col=k%3,row=Math.floor(k/3);btn(menuRects,40+col*300,100+row*190,280,170,lab,{act,size:26,sub})});
    ctx.fillStyle='#8a8178';ctx.font='500 13px '+FONT;ctx.fillText('Mode actuel : '+gameMode+(m3?' (monde libre en ville : première ou troisième personne)':' (vue de côté)'),40,486);
  }
  btn(menuRects,40,492,200,40,'RETOUR',{act:()=>{state='menu'},size:18});
}
function padTabs(cur){
  btn(menuRects,500,30,200,34,'RÉGLAGES',{act:()=>{state='gamepad'},size:14,dim:cur==='gamepad'});
  btn(menuRects,710,30,210,34,'MANETTES CONNECTÉES',{act:()=>{state='padsel'},size:14,dim:cur==='padsel'});
}
function drawPadSel(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('MANETTE',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('MANETTE',40,58);ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,170,3);
  padTabs('padsel');
  const all=allPads(),off=SET.gp.off;
  ctx.fillStyle='#b9b1a6';ctx.font='500 13px '+FONT;
  ctx.fillText('Désactive les manettes que tu ne veux pas utiliser (volant, casque, périphérique virtuel…) : le jeu les ignore complètement.',40,92,880);
  if(!all.length){panel(40,108,880,80,{});ctx.fillStyle='#e2542e';ctx.font='700 17px '+FONT;ctx.fillText('Aucune manette détectée',60,140);ctx.fillStyle='#b9b1a6';ctx.font='500 13px '+FONT;ctx.fillText('Branche une manette puis appuie sur un bouton pour qu\'elle apparaisse ici.',60,164)}
  all.slice(0,6).forEach((p,i)=>{
    const y=108+i*58,dis=!!off[p.id],mv=p.axes.some(a=>Math.abs(a)>.5);
    panel(40,y,880,52,{top:dis?'#1b1715':'#2a2522',bot:dis?'#0f0c0b':'#15110f'});
    ctx.fillStyle=dis?'#e2542e':'#9fd18a';ctx.font='700 14px '+FONT;ctx.fillText(dis?'✖ DÉSACTIVÉE':'● ACTIVE',58,y+22);
    ctx.fillStyle=dis?'#7a736b':'#f2efe8';ctx.font='600 14px '+FONT;ctx.fillText(p.id.slice(0,64),170,y+22,430);
    ctx.fillStyle='#8a8178';ctx.font='500 12px '+FONT;ctx.fillText('n°'+p.index+'  ·  '+p.axes.length+' axes  ·  '+p.buttons.length+' boutons'+(mv&&!dis?'  ·  AXE ACTIF (stick enfoncé ?)':''),170,y+42,430);
    btn(menuRects,610,y+8,150,36,dis?'ACTIVER':'DÉSACTIVER',{act:()=>{if(dis) delete off[p.id];else off[p.id]=true;GPS.base={};GPS.stuck={};saveOpts()},size:14});
    btn(menuRects,770,y+8,140,36,'SEULE ACTIVE',{act:()=>{for(const q of allPads()){if(q.id===p.id) delete off[q.id];else off[q.id]=true}GPS.base={};GPS.stuck={};saveOpts()},size:13});
  });
  ctx.fillStyle='#8a8178';ctx.font='500 13px '+FONT;
  ctx.fillText('Réglage mémorisé par modèle de manette. Si deux manettes ont exactement le même nom, elles sont activées / désactivées ensemble.',40,470,880);
  btn(menuRects,40,478,200,40,'RETOUR',{act:()=>{state='gamepad'}});
  btn(menuRects,250,478,260,40,'TOUT RÉACTIVER',{act:()=>{SET.gp.off={};GPS.base={};GPS.stuck={};saveOpts()},size:14});
}
function drawGamepadPage(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('MANETTE',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('MANETTE',40,58);ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,170,3);
  padTabs('gamepad');const pads=GPS.pads;
  panel(40,90,440,250,{});
  ctx.fillStyle=pads.length?'#9fd18a':'#e2542e';ctx.font='700 17px '+FONT;ctx.fillText(pads.length?'● '+pads.length+' manette'+(pads.length>1?'s':'')+' détectée'+(pads.length>1?'s':''):'Aucune manette détectée',56,116);
  ctx.fillStyle='#b9b1a6';ctx.font='500 13px '+FONT;
  if(pads.length){pads.slice(0,2).forEach((p,i)=>ctx.fillText(p.id.slice(0,62),56,136+i*16))}
  else{ctx.fillText('Branche une manette (USB ou Bluetooth : Xbox, PlayStation, Switch Pro…)',56,136);ctx.fillText('puis appuie sur un bouton pour qu\'elle soit reconnue.',56,152)}
  const p=pads[0],B=i=>p&&p.buttons[i]&&(p.buttons[i].pressed||p.buttons[i].value>.4);
  const stick=(cx,cy,ax,ay,lab)=>{ctx.strokeStyle='#4a3a2e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,34,0,7);ctx.stroke();ctx.fillStyle='#e2542e';ctx.beginPath();ctx.arc(cx+ax*24,cy+ay*24,12,0,7);ctx.fill();ctx.fillStyle='#8a8178';ctx.font='600 12px '+FONT;ctx.textAlign='center';ctx.fillText(lab,cx,cy+54);ctx.textAlign='left'};
  stick(130,250,p?p.axes[0]||0:0,p?p.axes[1]||0:0,'STICK G');stick(300,250,p?p.axes[2]||0:0,p?p.axes[3]||0:0,'STICK D');
  [[0,'A',420,262],[1,'B',446,240],[2,'X',394,240],[3,'Y',420,218]].forEach(([i,l,x,y])=>{ctx.fillStyle=B(i)?'#e2542e':'#2a211c';ctx.beginPath();ctx.arc(x,y,12,0,7);ctx.fill();ctx.strokeStyle='#4a3a2e';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#fff';ctx.font='700 13px '+FONT;ctx.textAlign='center';ctx.fillText(l,x,y+5);ctx.textAlign='left'});
  [[4,'LB',70,170],[5,'RB',380,170],[6,'LT',70,190],[7,'RT',380,190]].forEach(([i,l,x,y])=>{ctx.fillStyle=B(i)?'#e2542e':'#2a211c';ctx.fillRect(x,y-12,50,16);ctx.strokeStyle='#4a3a2e';ctx.strokeRect(x,y-12,50,16);ctx.fillStyle='#fff';ctx.font='600 11px '+FONT;ctx.textAlign='center';ctx.fillText(l,x+25,y);ctx.textAlign='left'});
  panel(500,90,420,250,{});
  ctx.fillStyle='#ffd45a';ctx.font='700 15px '+FONT;ctx.fillText('COMMANDES',516,114);
  ctx.fillStyle='#d8d2c8';ctx.font='500 14px '+FONT;
  [['Stick gauche / croix','se déplacer'],['A  ou  LB','sauter'],['Gâchette droite / RB','tirer'],['Stick droit','viser (comme la souris)'],['X','ramasser une caisse'],['Y','utiliser le bonus en stock'],['Start','pause  ·  valider (menu)'],['B  /  Back','retour dans les menus'],['Menus','stick gauche = curseur, A = clic']].forEach(([a,b],i)=>{ctx.fillStyle='#e9e1d0';ctx.fillText(a,516,140+i*22,180);ctx.fillStyle='#9a9086';ctx.fillText(b,700,140+i*22,210)});
  uiSlider(40,352,300,'ZONE MORTE DES STICKS  '+Math.round(SET.gp.dead*100)+' %',(SET.gp.dead-.1)/.4,v=>{SET.gp.dead=+(.1+v*.4).toFixed(2);saveOpts()});
  uiSlider(350,352,300,'VITESSE DU CURSEUR  '+SET.gp.sens.toFixed(1)+'×',(SET.gp.sens-.5)/1.5,v=>{SET.gp.sens=+(.5+v*1.5).toFixed(1);saveOpts()});
  btn(menuRects,660,352,260,38,'VIBRATIONS : '+(SET.gp.rumble?'OUI':'NON'),{act:()=>{SET.gp.rumble=!SET.gp.rumble;saveOpts();if(SET.gp.rumble) rumble(200,.6)},size:15});
  btn(menuRects,40,398,300,38,'MANETTES : '+(SET.gp.on?'ACTIVÉES':'DÉSACTIVÉES'),{act:()=>{SET.gp.on=!SET.gp.on;saveOpts()},size:15});
  btn(menuRects,350,398,300,38,'CURSEUR DES MENUS : '+(SET.gp.cursor?'OUI':'NON'),{act:()=>{SET.gp.cursor=!SET.gp.cursor;saveOpts()},size:15});
  btn(menuRects,660,398,260,38,'RECALIBRER',{act:()=>{GPS.base={};GPS.stuck={};flash('Manette recalibrée : laisse les sticks au repos')},size:15});
  ctx.fillStyle='#8a8178';ctx.font='500 13px '+FONT;ctx.fillText('Le curseur part tout seul ? Appuie sur RECALIBRER (sticks au repos) ou désactive le curseur / les manettes.',40,452,880);
  btn(menuRects,40,470,200,44,'RETOUR',{act:()=>{state='options';optTab=3}});
}
function drawRemotePage(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('TÉLÉPHONE-MANETTE',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('TÉLÉPHONE-MANETTE',40,58);ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,330,3);
  const st=RMT.status,mob=touchOn();
  if(st==='off'||st==='err'&&!RMT.role){
    ctx.fillStyle='#d8d2c8';ctx.font='500 16px '+FONT;
    ctx.fillText('Utilise ton téléphone comme manette sans fil pour jouer sur PC (même Wi-Fi conseillé).',40,100);
    btn(menuRects,40,126,420,92,mob?'ICI : LA MANETTE  (recommandé)':'ICI : LA MANETTE',{act:rmtPadWait,size:21,sub:'ce téléphone affiche un code à entrer sur le PC'});
    btn(menuRects,500,126,420,92,mob?'ICI : L\'ÉCRAN DE JEU':'ICI : L\'ÉCRAN DE JEU  (recommandé)',{act:()=>{joinCode='';state='padjoin'},size:21,sub:'ce PC entre le code affiché sur le téléphone'});
    btn(menuRects,40,230,880,60,'REMOTE PLAY : REJOINDRE UN ÉCRAN PARTAGÉ',{act:()=>{joinCode='';state='rpjoin'},size:19,sub:'jouer à plusieurs sur le même écran : entre le code affiché sur l\'écran du jeu'});
    ctx.fillStyle='#b9b1a6';ctx.font='500 14px '+FONT;
    ['1. Sur le téléphone : ouvre le jeu → Options → Commandes → Téléphone-manette → « Ici : la manette ».','2. Un code de 5 caractères s\'affiche sur le téléphone.','3. Sur le PC : Options → Commandes → Téléphone-manette → « Ici : l\'écran de jeu », puis tape le code.','4. Le téléphone devient la manette : boutons déplaçables, vibrations, pavé tactile pour les menus.'].forEach((t,i)=>ctx.fillText(t,40,318+i*22,880));
    ctx.fillStyle='#8a8178';ctx.font='500 13px '+FONT;ctx.fillText('La mise en relation passe par un service public gratuit (PeerJS) ; seules les touches sont échangées, aucune donnée personnelle.',40,422,880);
    if(RMT.msg){ctx.fillStyle='#e2542e';ctx.font='700 16px '+FONT;ctx.fillText(RMT.msg,40,448,880)}
  } else if(RMT.role==='pad'&&!RMT.rp){
    panel(40,100,880,250,{});
    ctx.textAlign='center';
    if(st==='wait'||st==='load'){
      ctx.fillStyle='#8a8178';ctx.font='500 16px '+FONT;ctx.fillText(st==='load'?'Préparation…':'CODE À ENTRER SUR LE PC',480,134);
      ctx.fillStyle='#ffd45a';ctx.font='400 96px '+TITLE;ctx.fillText(st==='load'?'· · · · ·':RMT.code,480,238);
      ctx.fillStyle='#b9b1a6';ctx.font='500 15px '+FONT;ctx.fillText('Sur le PC : Options → Commandes → Téléphone-manette → « Ici : l\'écran de jeu » puis tape ce code.',480,282,840);
      ctx.fillStyle=RMT.msg?'#e2542e':'#9fd18a';ctx.font='700 15px '+FONT;ctx.fillText(RMT.msg||'En attente du PC…',480,318,840);
    } else if(st==='ok'){ctx.fillStyle='#9fd18a';ctx.font='700 30px '+FONT;ctx.fillText('● CONNECTÉ AU PC',480,230)}
    else{ctx.fillStyle='#e2542e';ctx.font='700 22px '+FONT;ctx.fillText(RMT.msg||'Erreur',480,230,840)}
    ctx.textAlign='left';
    btn(menuRects,500,368,200,40,'NOUVEAU CODE',{act:rmtPadWait,size:16});
    btn(menuRects,720,368,200,40,'ANNULER',{act:rmtStop,size:16});
  } else {
    panel(40,100,880,250,{});
    ctx.textAlign='center';
    if(st==='ok'){ctx.fillStyle='#9fd18a';ctx.font='700 30px '+FONT;ctx.fillText('● TÉLÉPHONE CONNECTÉ',480,200);ctx.fillStyle='#d8d2c8';ctx.font='500 16px '+FONT;ctx.fillText('Le téléphone pilote le jeu : lance une partie et joue avec lui.',480,236);ctx.fillText('Le téléphone vibre quand tu es touché. Ses boutons se déplacent depuis son écran.',480,262)}
    else if(st==='err'){ctx.fillStyle='#e2542e';ctx.font='700 22px '+FONT;ctx.fillText(RMT.msg||'Erreur',480,230,840)}
    else{ctx.fillStyle='#ffd45a';ctx.font='700 24px '+FONT;ctx.fillText(RMT.msg||'Connexion…',480,230)}
    ctx.textAlign='left';
    btn(menuRects,500,368,200,40,'AUTRE CODE',{act:()=>{joinCode='';state=RMT.rp?'rpjoin':'padjoin'},size:16});
    btn(menuRects,720,368,200,40,st==='ok'?'DÉCONNECTER':'ANNULER',{act:rmtStop,size:16});
  }
  btn(menuRects,40,470,200,44,'RETOUR',{act:()=>{state='options';optTab=3}});
}
function drawPadJoin(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('ENTRER LE CODE',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('ENTRER LE CODE',40,58);ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,260,3);
  ctx.fillStyle='#b9b1a6';ctx.font='500 15px '+FONT;ctx.fillText('Tape (clavier) ou touche (écran) le code de 5 caractères affiché sur le téléphone.',40,98);
  for(let i=0;i<5;i++){const x=300+i*70;panel(x,114,60,76,{norivets:true});ctx.textAlign='center';ctx.fillStyle=joinCode[i]?'#ffd45a':'#4a3a2e';ctx.font='400 54px '+TITLE;ctx.fillText(joinCode[i]||'–',x+30,172);ctx.textAlign='left'}
  const cols=8,kw=52,kh=44,kx=(960-cols*(kw+6))/2;
  [...RCHARS].forEach((ch,i)=>{const x=kx+(i%cols)*(kw+6),y=218+Math.floor(i/cols)*(kh+6);btn(menuRects,x,y,kw,kh,'',{act:()=>{if(joinCode.length<5) joinCode+=ch},size:20});ctx.fillStyle='#f2efe8';ctx.font='700 22px '+FONT;ctx.textAlign='center';ctx.fillText(ch,x+kw/2+4,y+30);ctx.textAlign='left'});
  btn(menuRects,kx,418,170,44,'⌫  EFFACER',{act:()=>{joinCode=joinCode.slice(0,-1)},size:16});
  btn(menuRects,kx+180,418,250,44,'CONNECTER',{act:joinGo,size:20,dim:joinCode.length<5});
  btn(menuRects,40,470,200,44,'RETOUR',{act:()=>state='remote'});
}
function drawRpJoin(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('REMOTE PLAY : CODE',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('REMOTE PLAY : CODE',40,58);ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,260,3);
  ctx.fillStyle='#b9b1a6';ctx.font='500 15px '+FONT;ctx.fillText('Tape (clavier) ou touche (écran) le code de 5 caractères affiché sur l\'écran du jeu.',40,98);
  for(let i=0;i<5;i++){const x=300+i*70;panel(x,114,60,76,{norivets:true});ctx.textAlign='center';ctx.fillStyle=joinCode[i]?'#ffd45a':'#4a3a2e';ctx.font='400 54px '+TITLE;ctx.fillText(joinCode[i]||'–',x+30,172);ctx.textAlign='left'}
  const cols=8,kw=52,kh=44,kx=(960-cols*(kw+6))/2;
  [...RCHARS].forEach((ch,i)=>{const x=kx+(i%cols)*(kw+6),y=218+Math.floor(i/cols)*(kh+6);btn(menuRects,x,y,kw,kh,'',{act:()=>{if(joinCode.length<5) joinCode+=ch},size:20});ctx.fillStyle='#f2efe8';ctx.font='700 22px '+FONT;ctx.textAlign='center';ctx.fillText(ch,x+kw/2+4,y+30);ctx.textAlign='left'});
  btn(menuRects,kx,418,170,44,'⌫  EFFACER',{act:()=>{joinCode=joinCode.slice(0,-1)},size:16});
  btn(menuRects,kx+180,418,250,44,'CONNECTER',{act:rpJoinGo,size:20,dim:joinCode.length<5});
  btn(menuRects,40,470,200,44,'RETOUR',{act:()=>state='remote'});
}
function mpJoinGo(){if(joinCode.length===5) mpJoin(joinCode)}
function drawMpJoin(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('REJOINDRE UNE PARTIE',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('REJOINDRE UNE PARTIE',40,58);ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,260,3);
  ctx.fillStyle='#b9b1a6';ctx.font='500 15px '+FONT;ctx.fillText('Tape (clavier) ou touche (écran) le code de 5 caractères donné par l\'hôte.',40,98);
  for(let i=0;i<5;i++){const x=300+i*70;panel(x,114,60,76,{norivets:true});ctx.textAlign='center';ctx.fillStyle=joinCode[i]?'#ffd45a':'#4a3a2e';ctx.font='400 54px '+TITLE;ctx.fillText(joinCode[i]||'–',x+30,172);ctx.textAlign='left'}
  const cols=8,kw=52,kh=44,kx=(960-cols*(kw+6))/2;
  [...RCHARS].forEach((ch,i)=>{const x=kx+(i%cols)*(kw+6),y=218+Math.floor(i/cols)*(kh+6);btn(menuRects,x,y,kw,kh,'',{act:()=>{if(joinCode.length<5) joinCode+=ch},size:20});ctx.fillStyle='#f2efe8';ctx.font='700 22px '+FONT;ctx.textAlign='center';ctx.fillText(ch,x+kw/2+4,y+30);ctx.textAlign='left'});
  btn(menuRects,kx,418,170,44,'⌫  EFFACER',{act:()=>{joinCode=joinCode.slice(0,-1)},size:16});
  btn(menuRects,kx+180,418,250,44,'CONNECTER',{act:mpJoinGo,size:20,dim:joinCode.length<5});
  btn(menuRects,40,470,200,44,'RETOUR',{act:()=>state='mpmenu'});
}
addEventListener('keydown',e=>{if(state==='padjoin'||state==='mpjoin'||state==='rpjoin'){if(!e.repeat) padJoinKey(e);e.preventDefault();e.stopImmediatePropagation()}},true);

