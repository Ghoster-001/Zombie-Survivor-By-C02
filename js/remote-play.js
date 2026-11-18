// ===== V0.58 : REMOTE PLAY — plusieurs joueurs sur le même écran (non divisé, carte fixe), chacun avec son téléphone =====
const RP={n:0,slots:[],sel:{map:'ruines',diff:'normal'},msg:'',stT:0};
const RP_COL=['#e2542e','#4aa0e8','#6fd06a','#ffd45a'];
const rpPlaying=()=>MP.rp&&MP.on&&MP.started;
function rpStop(){
  for(const s of RP.slots){try{s.conn&&s.conn.close()}catch(e){}try{s.peer&&s.peer.destroy()}catch(e){}}
  RP.slots=[];RP.n=0;RP.msg='';
}
function rpNewSlots(n){
  rpStop();RP.n=n;RP.sel.map=curMap.id;RP.sel.diff='normal';
  for(let i=0;i<n;i++) RP.slots.push({i,usePC:i===0,code:'',peer:null,conn:null,status:'idle',av:i===0?-1:avIdx(i*9+3),rdy:false,msg:'',last:performance.now(),g:null});
}
const rpActive=()=>RP.slots.find(s=>!s.rdy);
function rpSlotPeer(sl){
  if(sl.peer||sl.status==='load') return;
  sl.status='load';sl.msg='Chargement…';
  loadPeerJS(()=>{
    const open=tries=>{
      sl.code=genCode();const peer=new Peer('ic02r-'+sl.code,{debug:0});sl.peer=peer;
      peer.on('open',()=>{sl.status=sl.conn&&sl.conn.open?'ok':'wait';sl.msg=''});
      peer.on('connection',c=>rpSlotConn(sl,c));
      peer.on('error',e=>{if(e.type==='unavailable-id'&&tries<6){try{peer.destroy()}catch(_){}open(tries+1);return}sl.status='err';sl.msg=errText(e)});
      peer.on('disconnected',()=>{try{peer.reconnect()}catch(e){}});
    };open(0);
  },()=>{sl.status='err';sl.msg='Module de connexion introuvable (hors ligne ?)'});
}
function rpSend(sl,o){if(sl.conn&&sl.conn.open){try{sl.conn.send(o)}catch(e){}}}
function rpSlotConn(sl,c){
  if(sl.conn&&sl.conn.open){try{c.close()}catch(e){}return}
  sl.conn=c;c.on('data',d=>rpSlotData(sl,d));
  c.on('open',()=>{sl.status='ok';sl.last=performance.now();sl.rdy=false;sl.msg='';sfx('bonus');rpPush(sl)});
  c.on('close',()=>{if(sl.conn!==c) return;sl.conn=null;sl.status=sl.peer?'wait':'idle';sl.rdy=false;if(sl.i===0) rinClear();if(sl.g) sl.g.inp={l:0,r:0,j:0,f:0,a:0,fc:1};if(rpPlaying()) flashG('JOUEUR '+(sl.i+1)+' : téléphone déconnecté')});
  c.on('error',()=>{});
}
function rpPush(sl){rpSend(sl,rpPlaying()?rpStPlay(sl):{t:'st',m:'choose',rp:1,av:sl.av,rdy:sl.rdy?1:0,pn:'JOUEUR '+(sl.i+1),np:RP.n})}
function rpSlotData(sl,d){
  if(!d||typeof d!=='object') return;sl.last=performance.now();
  switch(d.t){
    case 'pick':if(!rpPlaying()){sl.av=avIdx(d.av);rpPush(sl)}break;
    case 'rdy':if(!rpPlaying()){sl.rdy=!!d.r;rpPush(sl)}break;
    case 'in':if(rpPlaying()) rpInput(sl,d);break;
    case 'ev':if(rpPlaying()) rpEvent(sl,d.k);break;
    case 'ping':rpSend(sl,{t:'pong',n:d.n});break;
    case 'hello':rpPush(sl);break;
  }
}
function rpInput(sl,d){
  if(sl.i===0){rin.left=!!d.l;rin.right=!!d.r;rin.jump=!!d.j;rin.fire=!!d.f;rin.aim=!!d.a;rin.ax=+d.ax||0;rin.ay=+d.ay||0;return}
  const g=sl.g;if(!g) return;
  const ax=num(d.ax,-1,1,0),ay=num(d.ay,-1,1,0);let a,fc;
  if(d.a){a=Math.atan2(ay,ax);fc=ax>=0?1:-1}else{fc=d.r?1:d.l?-1:(g.inp.fc||1);a=fc>0?0:Math.PI}
  g.inp={l:d.l?1:0,r:d.r?1:0,j:d.j?1:0,f:d.f?1:0,a,fc};
}
function rpEvent(sl,k){
  if(k==='pause'){keyPress('Escape');return}
  if(k==='back'){keyPress('Escape');return}
  if(state!=='play') return;
  if(sl.i===0){if(player.dead) return;if(k==='pick') tryPickup();else if(k==='bonus') useBonus()}
  else if(sl.g&&sl.g.p&&!sl.g.p.dead){if(k==='pick') guestPick(sl.g);else if(k==='bonus') runAs(sl.g,useBonus)}
}
function rpStPlay(sl){
  let p,fb,fm,st;if(sl.i===0||!sl.g){p=player;fb=fxB;fm=fxMax;st=stock}else{p=sl.g.p;fb=sl.g.fxb;fm=sl.g.fxm;st=sl.g.stock}
  const gun=p.gun,w=WEAPONS[p.w],fx=[];
  for(const k in fb) if(fb[k]>0) fx.push([k,Math.round(100*fb[k]/(fm[k]||8000))]);
  return{t:'st',m:'play',rp:1,pn:'JOUEUR '+(sl.i+1),hp:Math.ceil(Math.max(0,p.hp)),mx:p.maxhp,w:wave,k:kills,wn:w.name,am:gun?(gun.time>0?Math.ceil(gun.time/1000)+' s':String(gun.ammo)):'',amp:gun?Math.round(100*(gun.time>0?gun.time/gun.t0:gun.ammo/gun.a0)):100,fx,st:(st||[]).slice(0,4),d:p.dead?1:0,pz:state==='pause'?1:0};
}
function rpTick(t){
  if(!RP.slots.length) return;
  if(t-RP.stT>250){RP.stT=t;for(const s of RP.slots) if(s.conn&&s.conn.open) rpPush(s)}
  for(const s of RP.slots){
    if(s.conn&&t-s.last>2500){if(s.i===0) rinClear();if(s.g) s.g.inp={l:0,r:0,j:0,f:0,a:0,fc:1}}
    if(s.conn&&t-s.last>10000){try{s.conn.close()}catch(e){}}
  }
  const a=rpActive();if(a&&state==='rpsetup'&&!(a.i===0&&a.usePC)) rpSlotPeer(a);                // « chacun son tour » : le code du joueur suivant apparaît quand le précédent est prêt
}
function rpStart(){
  if(!RP.slots.length||RP.slots.some(s=>!s.rdy)){RP.msg='Tous les joueurs doivent être prêts';return}
  const m=MAPS.find(x=>x.id===RP.sel.map)||MAPS[0],d=DIFFS.find(x=>x.id===RP.sel.diff)||DIFFS[1];
  if(!mapUnlocked(m)||!diffUnlocked(m,d)){RP.msg='Carte ou difficulté non débloquée';return}
  RP.msg='';MP.rp=true;MP.role='host';MP.on=true;MP.started=true;MP.gid='rp'+genCode()+Date.now().toString(36);
  MP.guests=[];
  for(const s of RP.slots){
    if(s.i===0) continue;
    const g={id:s.i,conn:s.conn,name:'JOUEUR '+(s.i+1),lvl:curLevel(),ready:true,ok:true,ping:0,rtts:[],q:4,nonce:'',inp:{l:0,r:0,j:0,f:0,a:0,fc:1},p:null,msgs:[],known:new Set(),cnt:0,cntT:0,last:performance.now(),look:AVATARS[avIdx(s.av)].look,av:avIdx(s.av),up:save.up,hpLvl:save.hpLvl|0,mel:save.melee,fxb:{},fxl:{},fxm:{},stock:[],cxp:0,clv:1,dead:false};
    s.g=g;MP.guests.push(g);
  }
  curMap=m;curDiff=d;training=false;mapTrain=false;applyMap();
  for(const g of MP.guests) mpMakeGuest(g);
  reset(false);MP.hostP=player;
  MP.hostLook=RP.slots[0].av>=0?AVATARS[avIdx(RP.slots[0].av)].look:null;
  for(const s of RP.slots) rpPush(s);
}
function rpBackToSetup(){
  MP.on=false;MP.started=false;MP.rp=false;MP.role='';MP.guests=[];MP.hostLook=null;
  for(const s of RP.slots){s.rdy=false;s.g=null}
  rinClear();reset(true);state='rpsetup';
}
// --- portrait d'un look quelconque (avatar « mon personnage ») ---
function avDrawLook(look,x,y,size,ring,tag){
  const key='L'+tag+'|'+JSON.stringify(look)+'|'+size+'|'+RES;let c=AVC.get(key);
  if(!c){
    const px=Math.max(1,Math.round(size*RES));c=document.createElement('canvas');c.width=c.height=px;
    const g=c.getContext('2d'),mc=ctx,sl=save.look,sp=prevO;ctx=g;g.scale(px/size,px/size);
    try{const bg=g.createLinearGradient(0,0,0,size);bg.addColorStop(0,'#5a4a2a');bg.addColorStop(1,'#14100e');g.fillStyle=bg;g.beginPath();g.arc(size/2,size/2,size/2,0,7);g.fill();g.save();g.beginPath();g.arc(size/2,size/2,size/2-.5,0,7);g.clip();
      save.look=look;prevO=look.outfit;const k=size/60;g.translate(size/2,size*.60+60*k);g.scale(k,k);drawSoldier({x:0,y:0,face:1,step:0,w:0,aim:0,swing:0,cd:0,muz0:0,muz1:0,hurtCd:0});g.restore()}catch(e){}finally{save.look=sl;prevO=sp;ctx=mc}
    if(AVC.size>300) AVC.clear();AVC.set(key,c);
  }
  ctx.drawImage(c,x,y,size,size);
  if(ring){ctx.strokeStyle=ring===true?'#e0a526':ring;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,7);ctx.stroke()}
}
function rpAvDraw(sl,x,y,size,ring){if(sl.av<0) avDrawLook(save.look,x,y,size,ring,'me');else avDraw(sl.av,x,y,size,ring)}
const rpAvName=sl=>sl.av<0?'MON PERSONNAGE':AVATARS[avIdx(sl.av)].n;
function rpCycle(sl,dir){const lo=sl.i===0?-1:0,hi=AVATARS.length-1;let v=sl.av+dir;if(v>hi) v=lo;if(v<lo) v=hi;sl.av=v}
// --- page de préparation (PC) ---
function drawRpSetup(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('REMOTE PLAY',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('REMOTE PLAY',40,58);ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,230,3);
  if(!RP.n){
    ctx.fillStyle='#d8d2c8';ctx.font='500 16px '+FONT;ctx.fillText('Jouez à plusieurs sur ce même écran : chacun contrôle son personnage avec son téléphone.',40,98);
    ctx.fillStyle='#b9b1a6';ctx.font='500 14px '+FONT;ctx.fillText('Écran non divisé, carte fixe (elle ne défile pas). Vie, bonus et armes s\'affichent sur le téléphone de chaque joueur.',40,120,880);
    for(let n=2;n<=4;n++){
      const x=40+(n-2)*300,y=150,w=280,h=250,hot=mouse.x>=x&&mouse.x<=x+w&&mouse.y>=y&&mouse.y<=y+h;
      menuRects.push({x,y,w,h,act:()=>rpNewSlots(n)});
      panel(x,y,w,h,{top:hot?'#4a2018':'#2d2723',bot:hot?'#2a100c':'#17120f',edge:hot?'#e2542e':'#4a3a2e'});
      const sw=220,sh=124,sx=x+30,sy=y+26;ctx.fillStyle='#0b0908';ctx.fillRect(sx,sy,sw,sh);
      for(let i=0;i<n;i++){ctx.fillStyle=RP_COL[i]+'66';ctx.fillRect(sx+i*sw/n+2,sy+2,sw/n-4,sh-4);ctx.fillStyle=RP_COL[i];ctx.font='700 30px '+FONT;ctx.textAlign='center';ctx.fillText(String(i+1),sx+i*sw/n+sw/n/2,sy+sh/2+10);ctx.textAlign='left'}
      ctx.fillStyle='#f2efe8';ctx.font='700 28px '+FONT;ctx.textAlign='center';ctx.fillText(n+' JOUEURS',x+w/2,y+196);ctx.fillStyle='#8a8178';ctx.font='500 13px '+FONT;ctx.fillText('même écran, chacun son téléphone',x+w/2,y+220);ctx.textAlign='left';
    }
    btn(menuRects,40,470,200,44,'RETOUR',{act:()=>{rpStop();state='mpmenu'}});
    return;
  }
  const N=RP.n,pw=Math.floor(880/N),act=rpActive();
  ctx.fillStyle='#b9b1a6';ctx.font='500 14px '+FONT;ctx.fillText(N+' joueurs  ·  chacun son tour : connecte ton téléphone, choisis ton personnage, puis « PRÊT ».',40,92,880);
  RP.slots.forEach(sl=>{
    const x=40+sl.i*pw,y=102,w=pw-10,h=284,col=RP_COL[sl.i],isAct=sl===act;
    panel(x,y,w,h,{edge:isAct?col:'#4a3a2e'});ctx.fillStyle=col;ctx.fillRect(x+2,y+2,w-4,28);
    ctx.fillStyle='#0b0908';ctx.font='700 17px '+FONT;ctx.textAlign='center';ctx.fillText('JOUEUR '+(sl.i+1),x+w/2,y+22);
    const asz=Math.min(112,w-40);
    if(sl.rdy){
      rpAvDraw(sl,x+w/2-asz/2,y+44,asz,col);ctx.fillStyle='#f2efe8';ctx.font='700 15px '+FONT;ctx.fillText(rpAvName(sl),x+w/2,y+44+asz+22,w-16);
      ctx.fillStyle='#9fd18a';ctx.font='700 20px '+FONT;ctx.fillText('✔ PRÊT',x+w/2,y+44+asz+50);ctx.fillStyle='#8a8178';ctx.font='500 12px '+FONT;ctx.fillText(sl.i===0&&sl.usePC?'clavier / manette de ce PC':'téléphone connecté',x+w/2,y+44+asz+68,w-16);
      menuRects.push({x:x+10,y:y+h-40,w:w-20,h:32,act:()=>{sl.rdy=false;rpPush(sl)}});
      ctx.fillStyle='#3a2e28';ctx.fillRect(x+10,y+h-40,w-20,32);ctx.fillStyle='#fff';ctx.font='700 13px '+FONT;ctx.fillText('MODIFIER',x+w/2,y+h-19);
    } else if(!isAct){
      ctx.fillStyle='#6b625b';ctx.font='700 15px '+FONT;ctx.fillText('EN ATTENTE…',x+w/2,y+130);ctx.font='500 12px '+FONT;ctx.fillText(sl.i?'après le joueur '+sl.i:'',x+w/2,y+152);
    } else if(sl.i===0&&sl.usePC){
      rpAvDraw(sl,x+w/2-asz/2,y+40,asz,col);ctx.fillStyle='#f2efe8';ctx.font='700 14px '+FONT;ctx.fillText(rpAvName(sl),x+w/2,y+40+asz+18,w-16);ctx.textAlign='left';
      const by=y+40+asz+28,bw=Math.floor((w-30)/2);
      btn(menuRects,x+10,by,bw,32,'‹',{act:()=>rpCycle(sl,-1),size:22});btn(menuRects,x+20+bw,by,bw,32,'›',{act:()=>rpCycle(sl,1),size:22});
      btn(menuRects,x+10,by+38,w-20,32,'PRÊT',{act:()=>{sl.rdy=true},size:16});
      btn(menuRects,x+10,by+76,w-20,26,'TÉLÉPHONE',{act:()=>{sl.usePC=false;rpSlotPeer(sl)},size:12});
    } else {
      ctx.textAlign='center';
      if(sl.status==='ok'&&sl.conn){
        rpAvDraw(sl,x+w/2-asz/2,y+40,asz,col);ctx.fillStyle='#9fd18a';ctx.font='700 14px '+FONT;ctx.fillText('● TÉLÉPHONE CONNECTÉ',x+w/2,y+40+asz+22,w-12);ctx.fillStyle='#f2efe8';ctx.font='700 14px '+FONT;ctx.fillText(rpAvName(sl),x+w/2,y+40+asz+42,w-12);
        ctx.fillStyle='#b9b1a6';ctx.font='500 12px '+FONT;ctx.fillText('choisis ton personnage',x+w/2,y+40+asz+60,w-12);ctx.fillText('sur ton téléphone',x+w/2,y+40+asz+76,w-12);
      } else {
        ctx.fillStyle='#8a8178';ctx.font='500 12px '+FONT;ctx.fillText('CODE À ENTRER SUR LE TÉLÉPHONE',x+w/2,y+52,w-8);
        ctx.fillStyle=col;ctx.font='400 '+(w>200?46:34)+'px '+TITLE;ctx.fillText(sl.status==='wait'||sl.status==='ok'?sl.code:'· · · · ·',x+w/2,y+112,w-8);
        ctx.fillStyle=sl.status==='err'?'#e2542e':'#b9b1a6';ctx.font='500 12px '+FONT;
        if(sl.status==='err') ctx.fillText(sl.msg,x+w/2,y+138,w-12);
        else ['Téléphone : Options →','Commandes → Téléphone-','manette → REMOTE PLAY,','puis tape ce code.'].forEach((t,i)=>ctx.fillText(t,x+w/2,y+142+i*17,w-12));
        ctx.fillStyle='#e0a526';ctx.font='700 13px '+FONT;ctx.fillText('En attente du téléphone…',x+w/2,y+222,w-12);
        if(sl.i===0) {ctx.textAlign='left';btn(menuRects,x+10,y+h-38,w-20,28,'CE PC',{act:()=>{sl.usePC=true;try{sl.conn&&sl.conn.close()}catch(e){}try{sl.peer&&sl.peer.destroy()}catch(e){}sl.peer=null;sl.conn=null;sl.status='idle'},size:12});ctx.textAlign='center'}
      }
      ctx.textAlign='left';
    }
    ctx.textAlign='left';
  });
  const m=MAPS.find(x=>x.id===RP.sel.map)||MAPS[0],d=DIFFS.find(x=>x.id===RP.sel.diff)||DIFFS[1],maps=mapOptions(),all=RP.slots.every(s=>s.rdy);
  btn(menuRects,40,398,290,38,'CARTE : '+m.name+'  ›',{act:()=>{const k=maps.findIndex(x=>x.id===m.id);RP.sel.map=maps[(k+1)%maps.length].id;const mm=MAPS.find(x=>x.id===RP.sel.map);if(!diffUnlocked(mm,DIFFS.find(x=>x.id===RP.sel.diff))) RP.sel.diff='normal'},size:15});
  btn(menuRects,340,398,290,38,'DIFFICULTÉ : '+d.n+'  ›',{act:()=>{const ds=DIFFS.filter(x=>diffUnlocked(m,x)),k=ds.findIndex(x=>x.id===d.id);RP.sel.diff=ds[(k+1)%ds.length].id},size:15});
  btn(menuRects,640,398,280,38,all?'LANCER LA PARTIE':'EN ATTENTE DES JOUEURS…',{act:rpStart,size:16,dim:!all});
  ctx.fillStyle='#8a8178';ctx.font='500 13px '+FONT;ctx.fillText('Gains ×'+(m.gain*d.g).toFixed(2)+'  ·  l\'XP et les crédits reviennent au compte principal de ce jeu.',40,458,600);
  if(RP.msg){ctx.fillStyle='#e2542e';ctx.font='700 14px '+FONT;ctx.fillText(RP.msg,640,458,280)}
  btn(menuRects,40,470,200,44,'QUITTER',{act:()=>{rpStop();state='mpmenu'},size:18});
  btn(menuRects,250,470,200,44,'CHANGER LE NOMBRE',{act:()=>rpNewSlots(0),size:14});
}
// --- téléphone : rejoindre un remote play (entrer le code affiché sur l'écran) ---
function rpJoin(code){
  rmtStop();RMT.role='pad';RMT.rp=true;RMT.code=code;RMT.status='load';RMT.msg='Chargement…';state='remote';
  loadPeerJS(()=>{
    const peer=new Peer({debug:0});RMT.peer=peer;let to=0;
    const fail=m=>{if(RMT.status!=='ok'){RMT.status='err';RMT.msg=m}};
    peer.on('open',()=>{
      RMT.status='conn';RMT.msg='Connexion…';
      const c=peer.connect('ic02r-'+code,{serialization:'json',reliable:true});RMT.conn=c;
      to=setTimeout(()=>fail('Connexion impossible : code incorrect, joueur pas encore actif ou réseau trop restrictif'),15000);
      c.on('data',rmtData);
      c.on('open',()=>{clearTimeout(to);RMT.status='ok';RMT.lastRx=performance.now();RMT.info={};state='padmode';PADS.touches.clear();PADS.cp=0;rmtSend({t:'hello'});padSendIn(true)});
      c.on('close',()=>{clearTimeout(to);if(RMT.conn===c&&RMT.status==='ok'){RMT.status='err';RMT.msg='Connexion perdue';RMT.conn=null;if(state==='padmode') state='remote'}});
      c.on('error',()=>fail('Erreur de connexion'));
    });
    peer.on('error',e=>fail(errText(e)));
  },()=>{RMT.status='err';RMT.msg='Module de connexion introuvable (hors ligne ?)'});
}
function rpJoinGo(){if(joinCode.length===5) rpJoin(joinCode)}
// --- téléphone : choix du personnage ---
function padChooseGeo(){const cols=8,t=58,g=8,tw=cols*(t+g)-g;return{cols,t,g,x0:Math.round((W-tw)/2),y0:62,per:32}}
function drawPadChoose(inf){
  const G=padChooseGeo(),pages=Math.ceil(AVATARS.length/G.per),page=Math.min(PADS.cp||0,pages-1),col=RP_COL[inf.pc||0];
  ctx.textAlign='center';ctx.fillStyle='#e9e1d0';ctx.font='400 26px '+TITLE;ctx.fillText('CHOISIS TON PERSONNAGE',W/2,38);
  ctx.fillStyle=RP_COL[(inf.pn||'JOUEUR 1').slice(-1)-1]||col;ctx.font='700 14px '+FONT;ctx.fillText(inf.pn||'',W/2,54);
  for(let k=0;k<G.per;k++){
    const i=page*G.per+k;if(i>=AVATARS.length) break;
    const x=G.x0+(k%G.cols)*(G.t+G.g),y=G.y0+Math.floor(k/G.cols)*(G.t+G.g),sel=i===inf.av;
    if(sel){ctx.fillStyle='rgba(224,165,38,.3)';ctx.beginPath();ctx.roundRect(x-3,y-3,G.t+6,G.t+6,10);ctx.fill()}
    avDraw(i,x,y,G.t,sel?'#ffd45a':false);
  }
  const by=H-84,bh=64,l=SAFE.l,sw=Math.min(300,W*.3);
  ctx.fillStyle='#e9e1d0';ctx.font='700 16px '+FONT;ctx.fillText(inf.av>=0&&AVATARS[inf.av]?AVATARS[inf.av].n:'MON PERSONNAGE',W/2,by-12);
  for(const[lab,bx,bw2,on] of[['◀',l+14,110,false],['PAGE '+(page+1)+'/'+pages+'  ▶',W-SAFE.r-14-130,130,false],[inf.rdy?'✔ PRÊT (annuler)':'JE SUIS PRÊT',W/2-sw/2,sw,!!inf.rdy]]){
    ctx.fillStyle=on?'#2e7d32':'rgba(58,46,40,.95)';ctx.beginPath();ctx.roundRect(bx,by,bw2,bh,12);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='700 '+(bw2>200?22:17)+'px '+FONT;ctx.fillText(lab,bx+bw2/2,by+bh/2+7);
  }
  ctx.textAlign='left';
}
function padChooseTap(p){
  const G=padChooseGeo(),inf=RMT.info,pages=Math.ceil(AVATARS.length/G.per),page=Math.min(PADS.cp||0,pages-1);
  const by=H-84,bh=64,l=SAFE.l,sw=Math.min(300,W*.3);
  if(p.y>=by&&p.y<=by+bh){
    if(p.x>=l+14&&p.x<=l+124){PADS.cp=(page+pages-1)%pages;return}
    if(p.x>=W-SAFE.r-144&&p.x<=W-SAFE.r-14){PADS.cp=(page+1)%pages;return}
    if(p.x>=W/2-sw/2&&p.x<=W/2+sw/2){rmtSend({t:'rdy',r:inf.rdy?0:1});return}
    return;
  }
  for(let k=0;k<G.per;k++){
    const i=page*G.per+k;if(i>=AVATARS.length) break;
    const x=G.x0+(k%G.cols)*(G.t+G.g),y=G.y0+Math.floor(k/G.cols)*(G.t+G.g);
    if(p.x>=x&&p.x<=x+G.t&&p.y>=y&&p.y<=y+G.t){rmtSend({t:'pick',av:i});try{navigator.vibrate&&navigator.vibrate(10)}catch(e){}return}
  }
}
// --- téléphone : vie, arme, bonus du joueur ---
function drawPadHud(inf){
  const w=Math.min(470,W-2*(SAFE.l+250)-20),x=(W-w)/2,y=8;
  ctx.fillStyle='rgba(8,6,5,.85)';ctx.beginPath();ctx.roundRect(x,y,w,86,10);ctx.fill();ctx.strokeStyle=RP_COL[inf.pc||0]||'#e2542e';ctx.lineWidth=2;ctx.stroke();
  ctx.textAlign='left';ctx.fillStyle=RP_COL[(inf.pn||'JOUEUR 1').slice(-1)-1]||'#fff';ctx.font='700 13px '+FONT;ctx.fillText((inf.pn||'')+'   ·   VAGUE '+(inf.w||0)+'   ·   '+(inf.k||0)+' TUÉS',x+10,y+17,w-20);
  const hr=Math.max(0,Math.min(1,(inf.hp||0)/(inf.mx||100)));
  ctx.fillStyle='#2a1a18';ctx.fillRect(x+10,y+24,w-20,14);ctx.fillStyle=hr>.5?'#c9372c':hr>.25?'#e07a2a':'#ff3a2a';ctx.fillRect(x+10,y+24,(w-20)*hr,14);
  ctx.fillStyle='#fff';ctx.font='700 12px '+FONT;ctx.textAlign='center';ctx.fillText((inf.hp||0)+' / '+(inf.mx||100),x+w/2,y+35);
  ctx.textAlign='left';ctx.fillStyle='#e9e1d0';ctx.font='700 13px '+FONT;ctx.fillText(String(inf.wn||'').toUpperCase(),x+10,y+54,w*.5);
  ctx.textAlign='right';ctx.fillStyle='#ffd45a';ctx.fillText(inf.am||'ILLIMITÉ',x+w-10,y+54);
  if(inf.am){ctx.fillStyle='#2a2418';ctx.fillRect(x+10,y+59,w-20,5);ctx.fillStyle='#e0a526';ctx.fillRect(x+10,y+59,(w-20)*Math.max(0,Math.min(1,(inf.amp||0)/100)),5)}
  ctx.textAlign='left';
  (inf.fx||[]).slice(0,7).forEach((f,i)=>{const bx=x+22+i*44;bonusIcon(f[0],bx,y+76,9);ctx.fillStyle='#0008';ctx.fillRect(bx-10,y+86,20,3);ctx.fillStyle=BON[f[0]]?BON[f[0]].c:'#fff';ctx.fillRect(bx-10,y+86,20*Math.max(0,f[1])/100,3)});
  const sb=PB.bonus;if(inf.st&&inf.st.length){ctx.save();ctx.globalAlpha=TOP();bonusIcon(inf.st[0],sb.cx,sb.cy,sb.r*.62);ctx.fillStyle='#fff';ctx.font='700 12px '+FONT;ctx.textAlign='center';ctx.fillText(inf.st.length>1?'×'+inf.st.length:'',sb.cx+sb.r*.6,sb.cy+sb.r*.9);ctx.restore()}
  if(inf.d){ctx.textAlign='center';ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(0,H*.4,W,70);ctx.fillStyle='#ff6a5a';ctx.font='400 34px '+TITLE;ctx.fillText('À TERRE',W/2,H*.4+36);ctx.fillStyle='#e9e1d0';ctx.font='500 14px '+FONT;ctx.fillText('tu reviens à la prochaine manche',W/2,H*.4+58);ctx.textAlign='left'}
  if(inf.pz){ctx.textAlign='center';ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(0,H*.4,W,50);ctx.fillStyle='#ffd45a';ctx.font='700 24px '+FONT;ctx.fillText('PAUSE',W/2,H*.4+34);ctx.textAlign='left'}
}
// repères de joueurs sur l'écran partagé
function rpTags(){
  if(!MP.rp) return;
  const arr=[{p:player,i:0}].concat(MP.guests.filter(g=>g.p).map(g=>({p:g.p,i:g.id})));
  for(const e of arr){
    const p=e.p;if(p.dead) continue;const c=RP_COL[e.i]||'#fff',y=p.y-112;
    ctx.fillStyle='#0b0908';ctx.beginPath();ctx.moveTo(p.x-8,y-8);ctx.lineTo(p.x+8,y-8);ctx.lineTo(p.x,y+2);ctx.closePath();ctx.fill();
    ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(p.x-6,y-7);ctx.lineTo(p.x+6,y-7);ctx.lineTo(p.x,y);ctx.closePath();ctx.fill();
    ctx.textAlign='center';ctx.font='700 13px '+FONT;ctx.fillStyle='#000';ctx.fillText(String(e.i+1),p.x+1,y-12+1);ctx.fillStyle=c;ctx.fillText(String(e.i+1),p.x,y-12);ctx.textAlign='left';
  }
}

