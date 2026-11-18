// ===== V0.51 : boutons tactiles personnalisables, manettes, téléphone-manette =====
const keyPress=code=>{try{window.dispatchEvent(new KeyboardEvent('keydown',{code,key:code}));window.dispatchEvent(new KeyboardEvent('keyup',{code,key:code}))}catch(e){}};
// --- éditeur de la disposition des boutons (mode immortel pour tester) ---
const elList=kind=>kind==='pad'?PADK.map(k=>PB[k]):TKEYS.map(k=>TELS[k]);
const elHit=(e,x,y)=>e.disc?Math.hypot(x-e.cx,y-e.cy)<=e.r*1.2+6:(Math.abs(x-e.cx)<=e.w/2+8&&Math.abs(y-e.cy)<=e.h/2+8);
function elPlace(e,cx,cy){const hw=e.disc?e.r:e.w/2,hh=e.disc?e.r:e.h/2;placeEl(e,clampN(cx,hw+4,W-hw-4),clampN(cy,hh+4,H-hh-4))}
function laySave(kind,e){const l=SAFE.l,rr=SAFE.r,L=kind==='pad'?(save.play=save.play||{}):(save.tlay=save.tlay||{});L[e.k]={x:+((e.cx-l)/(W-l-rr)).toFixed(4),y:+(e.cy/H).toFixed(4),s:e.s||1}}
const selEl=()=>elList(ctlEdit.kind).find(e=>e.k===ctlEdit.sel);
function startCtlEdit(kind){
  if(kind==='pad'){ctlEdit={kind,sel:'fire',mode:'move',drag:null};return}
  mapTrain=false;training=true;reset(false);ctlEdit={kind:'game',sel:'fire',mode:'move',drag:null};
}
function endCtlEdit(){
  const k=ctlEdit.kind;ctlEdit=null;persist();
  if(k!=='pad'){reset(true);state='options';optTab=3;optFrom='menu'}
}
function ceDown(p,id){
  for(const r of ceRects) if(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h){r.act();return true}
  if(ctlEdit.mode==='test') return false;
  const els=elList(ctlEdit.kind);
  for(let i=els.length-1;i>=0;i--){const e=els[i];if(elHit(e,p.x,p.y)){ctlEdit.sel=e.k;ctlEdit.drag={id,dx:e.cx-p.x,dy:e.cy-p.y};return true}}
  return true;
}
function ceMove(p,id){
  const d=ctlEdit.drag;if(!d||d.id!==id) return ctlEdit.mode==='move';
  const e=selEl();if(e) elPlace(e,p.x+d.dx,p.y+d.dy);return true;
}
function ceUp(id){const d=ctlEdit&&ctlEdit.drag;if(d&&d.id===id){ctlEdit.drag=null;const e=selEl();if(e){laySave(ctlEdit.kind,e);persist()}}}
function ceSize(dl){const e=selEl();if(!e||!e.disc){flash('Ce bouton garde sa taille');return}e.s=clampN((e.s||1)+dl,.6,1.8);e.r=e.base*e.s;elPlace(e,e.cx,e.cy);laySave(ctlEdit.kind,e);persist()}
function ceOp(dl){save.tui=save.tui||{};save.tui.op=+clampN(TOP()+dl,.25,1).toFixed(2);persist()}
function ceReset(){if(ctlEdit.kind==='pad') delete save.play;else delete save.tlay;save.tui={op:1};layoutTouch();persist()}
const ELNAME={left:'GAUCHE',right:'DROITE',jump:'SAUT',fire:'TIR',pick:'RAMASSER',pause:'PAUSE',stock:'BONUS',aim:'VISÉE',bonus:'BONUS'};
function drawCtlEdit(){
  const c=ctlEdit;ceRects.length=0;
  const bs=[[c.mode==='move'?'MODE : DÉPLACER':'MODE : TESTER',()=>{c.mode=c.mode==='move'?'test':'move'},132],['TAILLE −',()=>ceSize(-.1),84],['TAILLE +',()=>ceSize(.1),84],['OPACITÉ −',()=>ceOp(-.1),92],['OPACITÉ +',()=>ceOp(.1),92],['RÉINIT.',ceReset,74],['TERMINER',()=>endCtlEdit(),98]];
  const gap=6,tot=bs.reduce((a,b)=>a+b[2],0)+gap*(bs.length-1),x0=Math.round((W-tot)/2),y0=c.kind==='pad'?H-70:6;
  ctx.save();
  ctx.fillStyle='rgba(8,6,5,.9)';ctx.beginPath();ctx.roundRect(x0-10,y0,tot+20,64,10);ctx.fill();ctx.strokeStyle='#e2542e';ctx.lineWidth=2;ctx.stroke();
  const e=selEl();
  ctx.textAlign='left';ctx.fillStyle='#ffd45a';ctx.font='700 13px '+FONT;
  ctx.fillText((c.kind==='pad'?'PERSONNALISATION DE LA MANETTE':'PERSONNALISATION · MODE IMMORTEL')+(e?'   ·   BOUTON : '+(ELNAME[e.k]||e.k)+(e.disc?'  ·  TAILLE '+Math.round((e.s||1)*100)+' %':''):'')+'   ·   OPACITÉ '+Math.round(TOP()*100)+' %',x0,y0+16,tot);
  let x=x0;
  for(const[lab,act,w] of bs){
    ceRects.push({x,y:y0+24,w,h:32,act});
    ctx.fillStyle=lab==='TERMINER'?'#2e7d32':'#3a2e28';ctx.beginPath();ctx.roundRect(x,y0+24,w,32,6);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='700 13px '+FONT;ctx.textAlign='center';ctx.fillText(lab,x+w/2,y0+45);x+=w+gap;
  }
  if(e&&c.mode==='move'){
    ctx.strokeStyle='#ffd45a';ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.beginPath();
    if(e.disc) ctx.arc(e.cx,e.cy,e.r+8,0,7);else ctx.rect(e.x-6,e.y-6,e.w+12,e.h+12);
    ctx.stroke();ctx.setLineDash([]);
  }
  ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,.85)';ctx.font='700 14px '+FONT;
  ctx.fillText(c.mode==='move'?'Touche un bouton et fais-le glisser où tu veux  ·  TAILLE / OPACITÉ pour l\'ajuster':'MODE TESTER : les boutons fonctionnent, tu ne peux pas mourir',W/2,c.kind==='pad'?H-78:y0+82);
  ctx.restore();
}
// --- manettes (Gamepad API : Xbox, PlayStation, Switch Pro, génériques) ---
const GPS={pads:[],prev:{},hp:null,base:{},stuck:{},act:0,mouseT:0};
// Les manettes « fantômes » (volants, casques, périphériques virtuels) envoient des valeurs parasites : on calibre le repos de chaque axe,
// on ignore les boutons bloqués, et le curseur / la visée ne bougent que si une vraie action récente vient de la manette.
const allPads=()=>{try{return Array.from(navigator.getGamepads?navigator.getGamepads():[]).filter(p=>p&&p.connected)}catch(e){return[]}};
function gpState(){
  const o={left:false,right:false,jump:false,fire:false,ax:0,ay:0,rx:0,ry:0,l3:false,lt:false,aim:false,mx:0,my:0,a:false,b:false,x:false,y:false,start:false,back:false},dz=Math.max(.15,SET.gp.dead);
  let list=[];if(SET.gp.on){try{list=Array.from(navigator.getGamepads?navigator.getGamepads():[]).filter(p=>p&&p.connected&&p.axes&&p.axes.length>=2&&p.buttons&&p.buttons.length>=4&&!SET.gp.off[p.id])}catch(e){}}
  GPS.pads=list;let act=false;
  for(const p of list){
    const key=p.index+'|'+p.id,bs=GPS.base[key]||(GPS.base[key]=p.axes.map(v=>v||0)),st=GPS.stuck[key]||(GPS.stuck[key]=p.buttons.map(b=>!!(b&&(b.pressed||b.value>.45))));
    const B=i=>{const on=!!(p.buttons[i]&&(p.buttons[i].pressed||p.buttons[i].value>.45));if(!on){st[i]=false;return false}return !st[i]};
    const AX=i=>clampN((p.axes[i]||0)-(bs[i]||0),-1,1),lx=AX(0),ly=AX(1),rx=p.axes.length>=4?AX(2):0,ry=p.axes.length>=4?AX(3):0;
    for(let i=0;i<Math.min(17,p.buttons.length);i++) if(B(i)) act=true;
    if(Math.hypot(lx,ly)>.55||Math.hypot(rx,ry)>.55) act=true;
    if(lx<-.45||B(14)) o.left=true;if(lx>.45||B(15)) o.right=true;
    if(B(0)||B(4)||B(12)) o.jump=true;
    if(B(7)||B(5)) o.fire=true;
    const m=Math.hypot(rx,ry);if(m>dz+.12){o.aim=true;o.ax=rx/m;o.ay=ry/m;o.rx+=rx;o.ry+=ry}
    if(Math.abs(lx)>dz) o.mx+=lx;if(Math.abs(ly)>dz) o.my+=ly;if(B(14)) o.mx-=1;if(B(15)) o.mx+=1;if(B(12)) o.my-=1;if(B(13)) o.my+=1;
    o.l3=o.l3||B(10);o.lt=o.lt||!!(p.buttons[6]&&p.buttons[6].value>.35);o.a=o.a||B(0);o.b=o.b||B(1);o.x=o.x||B(2);o.y=o.y||B(3);o.start=o.start||B(9);o.back=o.back||B(8);
  }
  if(act) GPS.act=performance.now();
  return o;
}
function rumble(ms,mag){
  if(SET.gp.rumble) for(const p of GPS.pads){const a=p.vibrationActuator;if(a&&a.playEffect){try{a.playEffect('dual-rumble',{duration:ms,strongMagnitude:mag,weakMagnitude:mag*.5})}catch(e){}}}
  rmtSend({t:'vib',ms});
}
function inputFrame(dtc){
  const g=gpState(),pv=GPS.prev,rise=k=>g[k]&&!pv[k];
  if(ctlEdit&&ctlEdit.kind==='game') player.hp=player.maxhp;
  gctl.left=g.left||rin.left;gctl.right=g.right||rin.right;gctl.jump=g.jump||rin.jump;gctl.fire=g.fire||rin.fire;
  const aimOn=g.aim||rin.aim,ax=g.aim?g.ax:rin.ax,ay=g.aim?g.ay:rin.ay;
  if(state==='play'&&!paused&&!death){
    if(aimOn&&(rin.aim||performance.now()-GPS.mouseT>600)){gpAim.on=true;mouse.rx=(player.x-camX)+ax*240;mouse.ry=(player.y-48)+ay*240;syncMouse()}
    if(rise('x')) tryPickup();
    if(rise('y')) useBonus();
    if(GPS.hp!==null&&player.hp<GPS.hp-.5&&!ctlEdit) rumble(140,Math.min(1,.4+(GPS.hp-player.hp)/30));
    GPS.hp=player.hp;
  } else GPS.hp=null;
  if(rise('start')) keyPress(state==='menu'||state==='over'?'Enter':'Escape');
  if(MENU_STATES.includes(state)&&GPS.pads.length){
    if((g.mx||g.my)&&SET.gp.cursor&&performance.now()-GPS.act<6000&&performance.now()-GPS.mouseT>1200){mouse.rx=clampN(mouse.rx+g.mx*11*SET.gp.sens*dtc,0,W);mouse.ry=clampN(mouse.ry+g.my*11*SET.gp.sens*dtc,0,H);syncMouse();uiDirty=true}
    if(rise('a')){mouse.down=true;menuPress()}
    if(g.a&&sliderActive) sliderActive.act();
    if(!g.a&&pv.a){sliderActive=null;mouse.down=false}
    if(rise('b')||rise('back')) keyPress('Escape');
  }
  GPS.prev=g;
}
// --- téléphone-manette : jumelage par code (WebRTC, mise en relation par le service public PeerJS) ---
const RMT={peer:null,conn:null,code:'',status:'off',msg:'',role:'',info:{},lastRx:0,lastTx:0,rtt:0,stT:0};
const RCHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genCode=()=>{let c='';for(let i=0;i<5;i++) c+=RCHARS[rndInt(RCHARS.length)];return c};
const errText=e=>({'peer-unavailable':'Code introuvable : vérifie le code et que la manette est en attente','network':'Réseau indisponible','server-error':'Service de mise en relation injoignable','socket-error':'Service de mise en relation injoignable','socket-closed':'Service de mise en relation injoignable','webrtc':'Connexion directe impossible (réseau trop restrictif)','browser-incompatible':'Navigateur non compatible'}[e&&e.type]||'Erreur de connexion');
function loadPeerJS(ok,ko){
  if(window.Peer) return ok();
  const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';s.integrity='sha384-nlUQ8ZqCbvStErob+biJNzSgltf6urV3VGqhfIfzhmg9RXmpeRm76ELw0pYnKlTR';s.crossOrigin='anonymous';
  s.onload=()=>window.Peer?ok():ko();s.onerror=ko;document.head.appendChild(s);
}
function rmtSend(o){if(RMT.conn&&RMT.conn.open){try{RMT.conn.send(o);RMT.lastTx=performance.now()}catch(e){}}}
function rinClear(){rin.left=rin.right=rin.jump=rin.fire=rin.aim=false}
function rmtStop(){
  try{RMT.conn&&RMT.conn.close()}catch(e){}try{RMT.peer&&RMT.peer.destroy()}catch(e){}
  RMT.peer=RMT.conn=null;RMT.status='off';RMT.msg='';RMT.info={};RMT.rp=false;rinClear();
}
function rmtData(d){
  if(!d||typeof d!=='object') return;RMT.lastRx=performance.now();
  if(RMT.role==='host'){
    switch(d.t){
      case 'in':rin.left=!!d.l;rin.right=!!d.r;rin.jump=!!d.j;rin.fire=!!d.f;rin.aim=!!d.a;rin.ax=+d.ax||0;rin.ay=+d.ay||0;break;
      case 'ev':
        if(d.k==='pick'){if(state==='play'&&!paused&&!ctlEdit) tryPickup()}
        else if(d.k==='bonus'){if(state==='play'&&!paused) useBonus()}
        else if(d.k==='pause') keyPress(state==='menu'||state==='over'?'Enter':'Escape');
        else if(d.k==='back') keyPress('Escape');
        break;
      case 'mv':if(MENU_STATES.includes(state)){mouse.rx=clampN(mouse.rx+(+d.dx||0)*1.6,0,W);mouse.ry=clampN(mouse.ry+(+d.dy||0)*1.6,0,H);syncMouse();uiDirty=true;if(sliderActive) sliderActive.act()}break;
      case 'dn':if(MENU_STATES.includes(state)) menuPress();break;
      case 'up':sliderActive=null;break;
      case 'ping':rmtSend({t:'pong',n:d.n});break;
    }
  } else {
    if(d.t==='st') RMT.info=d;
    else if(d.t==='vib'){try{navigator.vibrate&&navigator.vibrate(clampN(+d.ms||80,10,400))}catch(e){}}
    else if(d.t==='pong') RMT.rtt=Math.round(performance.now()-d.n);
    else if(d.t==='end'){rmtStop();state='remote';RMT.msg='Partie fermée par l\'écran'}
  }
}
function rmtOnConn(c){
  RMT.conn=c;
  c.on('data',rmtData);
  c.on('open',()=>{
    RMT.status='ok';RMT.lastRx=performance.now();RMT.msg='';
    if(RMT.role==='pad'){state='padmode';PADS.touches.clear();padSendIn(true)}
    else{sfx('bonus');flash('TÉLÉPHONE CONNECTÉ')}
  });
  c.on('close',()=>{
    if(RMT.conn!==c) return;
    RMT.conn=null;rinClear();
    if(RMT.role==='pad'){RMT.status='wait';RMT.msg='Connexion perdue : en attente…';if(state==='padmode') state='remote'}
    else{RMT.status='off';RMT.msg='Manette déconnectée';flash('MANETTE DÉCONNECTÉE')}
  });
}
function rmtPadWait(){                                                   // le téléphone affiche un code et attend le PC
  rmtStop();RMT.role='pad';RMT.status='load';RMT.msg='Chargement…';
  loadPeerJS(()=>{
    const open=tries=>{
      RMT.code=genCode();const peer=new Peer('ic02-'+RMT.code,{debug:0});RMT.peer=peer;
      peer.on('open',()=>{RMT.status='wait';RMT.msg=''});
      peer.on('connection',c=>{if(RMT.conn&&RMT.conn.open){c.close();return}rmtOnConn(c)});
      peer.on('error',e=>{if(e.type==='unavailable-id'&&tries<6){try{peer.destroy()}catch(_){}open(tries+1);return}RMT.status='err';RMT.msg=errText(e)});
      peer.on('disconnected',()=>{try{peer.reconnect()}catch(e){}});
    };open(0);
  },()=>{RMT.status='err';RMT.msg='Module de connexion introuvable (hors ligne ?)'});
}
function rmtHostJoin(code){                                              // le PC entre le code affiché sur le téléphone
  rmtStop();RMT.role='host';RMT.code=code;RMT.status='load';RMT.msg='Chargement…';
  loadPeerJS(()=>{
    const peer=new Peer({debug:0});RMT.peer=peer;let to=0;
    const fail=m=>{if(RMT.status!=='ok'){RMT.status='err';RMT.msg=m}};
    peer.on('open',()=>{
      RMT.status='conn';RMT.msg='Connexion…';
      const c=peer.connect('ic02-'+code,{serialization:'json',reliable:true});rmtOnConn(c);
      to=setTimeout(()=>fail('Connexion impossible : même Wi-Fi ? code correct ?'),15000);
      c.on('open',()=>{clearTimeout(to);state='remote'});
      c.on('error',()=>fail('Erreur de connexion'));
    });
    peer.on('error',e=>fail(errText(e)));
  },()=>{RMT.status='err';RMT.msg='Module de connexion introuvable (hors ligne ?)'});
}
let joinCode='';
function joinGo(){if(joinCode.length===5){rmtHostJoin(joinCode);state='remote'}}
function padJoinKey(e){
  if(e.code==='Escape'){state=state==='mpjoin'?'mpmenu':'remote';return true}
  if(e.code==='Backspace'){joinCode=joinCode.slice(0,-1);return true}
  if(e.code==='Enter'){if(state==='mpjoin') mpJoinGo();else if(state==='rpjoin') rpJoinGo();else joinGo();return true}
  const ch=e.key&&e.key.length===1?e.key.toUpperCase():'';
  if(RCHARS.includes(ch)&&joinCode.length<5) joinCode+=ch;
  return true;
}
function rmtTick(t){
  if(RMT.status!=='ok'||!RMT.conn) return;
  if(RMT.role==='host'){
    if(t-RMT.stT>250){RMT.stT=t;rmtSend({t:'st',m:state==='play'&&!paused&&!death?'play':'menu',hp:Math.ceil(player.hp),mx:player.maxhp,w:wave,k:kills,e:ctlEdit?1:0})}
    if(t-RMT.lastRx>2500) rinClear();                                    // plus de nouvelles : on lâche toutes les touches
    if(t-RMT.lastRx>9000){RMT.msg='Manette silencieuse';}
  } else {
    if(t-RMT.lastTx>1000){rmtSend({t:'ping',n:t})}
    if(t-RMT.lastRx>9000){RMT.status='wait';RMT.msg='Connexion perdue';try{RMT.conn.close()}catch(e){}RMT.conn=null;state='remote'}
  }
}
// --- écran « manette » (sur le téléphone) ---
const PADS={touches:new Map(),ctl:{left:false,right:false,jump:false,fire:false,aim:false,ax:0,ay:0},sent:'',sentT:0,tp:null};
const PGEAR={x:0,y:0,w:100,h:34},PQUIT={x:0,y:0,w:100,h:34};
function padSendIn(force){
  const c=PADS.ctl,o={t:'in',l:+c.left,r:+c.right,j:+c.jump,f:+c.fire,a:+c.aim,ax:+c.ax.toFixed(2),ay:+c.ay.toFixed(2)},s=JSON.stringify(o),t=performance.now();
  if(force||s!==PADS.sent||(c.aim&&t-PADS.sentT>100)){PADS.sent=s;PADS.sentT=t;rmtSend(o)}
}
function padRecalc(){
  const c=PADS.ctl;c.left=c.right=c.jump=c.fire=c.aim=false;c.ax=c.ay=0;
  for(const[id,k] of PADS.touches){if(!k||typeof k!=='object') continue;
    if(k.k==='aim'){c.aim=true;c.ax=k.ax;c.ay=k.ay}else c[k.k]=true}
  padSendIn(false);
}
function padHit(p){for(const k of PADK){const e=PB[k];if(elHit(e,p.x,p.y)) return e}return null}
function padTouch(p,id,type){
  const menuMode=(RMT.info.m==='menu')&&!ctlEdit;
  if(type==='up'){
    const tp=PADS.tp;
    if(tp&&tp.id===id){if(!tp.dn&&!tp.moved&&performance.now()-tp.t<320){rmtSend({t:'dn'});rmtSend({t:'up'})}else if(tp.dn) rmtSend({t:'up'});PADS.tp=null}
    PADS.touches.delete(id);padRecalc();return;
  }
  if(type==='down'){
    if(!ctlEdit){
      const px=p.x,py=p.y;
      if(px>=PGEAR.x&&px<=PGEAR.x+PGEAR.w&&py>=PGEAR.y&&py<=PGEAR.y+PGEAR.h){startCtlEdit('pad');return}
      if(px>=PQUIT.x&&px<=PQUIT.x+PQUIT.w&&py>=PQUIT.y&&py<=PQUIT.y+PQUIT.h){rmtStop();state='remote';return}
    }
    if(RMT.rp&&RMT.info.m==='choose'&&!ctlEdit){padChooseTap(p);return}
    if(menuMode){
      const b=padMenuBtn(p);if(b){rmtSend({t:'ev',k:b});return}
      PADS.tp={id,x:p.x,y:p.y,t:performance.now(),moved:false,dn:false};return;
    }
    const e=padHit(p);if(!e) return;
    if(e.k==='aim'){PADS.touches.set(id,{k:'aim',ax:0,ay:0});padTouch(p,id,'move');return}
    if(e.k==='pick'||e.k==='bonus'||e.k==='pause'){rmtSend({t:'ev',k:e.k});PADS.touches.set(id,{k:e.k,ev:1});try{navigator.vibrate&&navigator.vibrate(12)}catch(_){}return}
    PADS.touches.set(id,{k:e.k});padRecalc();return;
  }
  // déplacement
  if(menuMode){
    const tp=PADS.tp;if(tp&&tp.id===id){
      const dx=p.x-tp.x,dy=p.y-tp.y;if(Math.hypot(dx,dy)>1.5){tp.moved=tp.moved||Math.hypot(p.x-tp.x,p.y-tp.y)>0;rmtSend({t:'mv',dx:+dx.toFixed(1),dy:+dy.toFixed(1)});tp.x=p.x;tp.y=p.y;tp.mvTot=(tp.mvTot||0)+Math.hypot(dx,dy);if(tp.mvTot<10) tp.moved=false;else tp.moved=true}
      if(!tp.dn&&!tp.moved&&performance.now()-tp.t>380){tp.dn=true;rmtSend({t:'dn'})}
    }
    return;
  }
  const k=PADS.touches.get(id);if(k&&k.k==='aim'){const e=PB.aim,m=Math.hypot(p.x-e.cx,p.y-e.cy),r=e.r*1.05;let ax=(p.x-e.cx)/Math.max(1,m),ay=(p.y-e.cy)/Math.max(1,m);if(m<r*.18){k.ax=0;k.ay=0;PADS.touches.set(id,{k:'aim',ax:0,ay:0});padRecalc();PADS.ctl.aim=false;padSendIn(false);return}k.ax=ax;k.ay=ay;padRecalc()}
}
function padMenuBtn(p){
  if(p.x>=PQUIT.x&&p.x<=PQUIT.x+PQUIT.w&&p.y>=PQUIT.y&&p.y<=PQUIT.y+PQUIT.h) return null;
  const w=Math.min(200,W*.22),h=64,y=H-h-14;
  if(p.y>=y&&p.y<=y+h){if(p.x>=SAFE.l+14&&p.x<=SAFE.l+14+w) return 'back';if(p.x>=W-SAFE.r-14-w&&p.x<=W-SAFE.r-14) return 'pause'}
  return null;
}
function padIcon(k,e,on){
  const x=e.cx,y=e.cy,r=e.r;
  ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fillStyle=on?'rgba(226,84,46,.65)':'rgba(34,28,24,.85)';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=on?'#ff8a5a':'rgba(255,255,255,.45)';ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.92)';ctx.strokeStyle='rgba(255,255,255,.92)';ctx.lineWidth=Math.max(3,r*.1);ctx.lineCap='round';ctx.lineJoin='round';
  const u=r/46;
  if(k==='left'){ctx.beginPath();ctx.moveTo(x+14*u,y-20*u);ctx.lineTo(x-14*u,y);ctx.lineTo(x+14*u,y+20*u);ctx.closePath();ctx.fill()}
  else if(k==='right'){ctx.beginPath();ctx.moveTo(x-14*u,y-20*u);ctx.lineTo(x+14*u,y);ctx.lineTo(x-14*u,y+20*u);ctx.closePath();ctx.fill()}
  else if(k==='jump'){ctx.beginPath();ctx.moveTo(x-18*u,y+8*u);ctx.lineTo(x,y-10*u);ctx.lineTo(x+18*u,y+8*u);ctx.stroke();ctx.beginPath();ctx.moveTo(x-18*u,y+20*u);ctx.lineTo(x,y+2*u);ctx.lineTo(x+18*u,y+20*u);ctx.stroke()}
  else if(k==='fire'){ctx.beginPath();ctx.arc(x,y,22*u,0,7);ctx.stroke();ctx.beginPath();ctx.arc(x,y,5*u,0,7);ctx.fill();for(const[dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){ctx.beginPath();ctx.moveTo(x+dx*14*u,y+dy*14*u);ctx.lineTo(x+dx*32*u,y+dy*32*u);ctx.stroke()}}
  else if(k==='aim'){
    ctx.strokeStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.arc(x,y,r*.55,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(x-r*.8,y);ctx.lineTo(x+r*.8,y);ctx.moveTo(x,y-r*.8);ctx.lineTo(x,y+r*.8);ctx.stroke();
    const t=[...PADS.touches.values()].find(v=>v&&v.k==='aim'),kx=t?t.ax*r*.7:0,ky=t?t.ay*r*.7:0;
    ctx.beginPath();ctx.arc(x+kx,y+ky,r*.34,0,7);ctx.fillStyle=t?'#ff8a5a':'rgba(255,255,255,.7)';ctx.fill();
  }
  else if(k==='pick'){ctx.fillStyle='#5a4220';ctx.fillRect(x-15*u,y-12*u,30*u,24*u);ctx.fillStyle='#e0b86a';ctx.fillRect(x-12*u,y-9*u,24*u,18*u);ctx.fillStyle='#5a4220';ctx.fillRect(x-3*u,y-12*u,6*u,24*u);ctx.fillRect(x-15*u,y-2*u,30*u,4*u)}
  else if(k==='bonus'){ctx.beginPath();for(let i=0;i<10;i++){const rr=i%2?7*u:16*u,a=i*Math.PI/5-Math.PI/2;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}ctx.closePath();ctx.fillStyle='#ffd45a';ctx.fill()}
  else if(k==='pause'){ctx.fillRect(x-9*u,y-11*u,6*u,22*u);ctx.fillRect(x+3*u,y-11*u,6*u,22*u)}
}
function drawPadScreen(){
  ctx.fillStyle='#0b0908';ctx.fillRect(0,0,W,H);
  const g=ctx.createRadialGradient(W/2,H/2,40,W/2,H/2,Math.max(W,H)*.7);g.addColorStop(0,'rgba(60,24,18,.35)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const inf=RMT.info||{},menuMode=inf.m==='menu'&&!ctlEdit,l=SAFE.l;
  PGEAR.x=l+12;PGEAR.y=10;PQUIT.x=l+120;PQUIT.y=10;
  if(!ctlEdit){
    for(const[b,lab] of[[PGEAR,'BOUTONS'],[PQUIT,'QUITTER']]){ctx.fillStyle='rgba(58,46,40,.9)';ctx.beginPath();ctx.roundRect(b.x,b.y,b.w,b.h,7);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#fff';ctx.font='700 14px '+FONT;ctx.textAlign='center';ctx.fillText(lab,b.x+b.w/2,b.y+22)}
    if(!RMT.rp){ctx.textAlign='left';ctx.fillStyle='#9fd18a';ctx.font='700 14px '+FONT;ctx.fillText('● MANETTE CONNECTÉE'+(RMT.rtt?'  ·  '+RMT.rtt+' ms':''),l+232,30)}
    if(inf.hp!==undefined&&!RMT.rp){const bw=Math.min(260,W*.28),bx=W-SAFE.r-bw-16;ctx.fillStyle='#8a8178';ctx.font='500 12px '+FONT;ctx.textAlign='right';ctx.fillText('VAGUE '+(inf.w||0)+'  ·  '+(inf.k||0)+' TUÉS',W-SAFE.r-16,24);ctx.fillStyle='#2a1a18';ctx.fillRect(bx,32,bw,10);ctx.fillStyle='#c9372c';ctx.fillRect(bx,32,bw*clampN((inf.hp||0)/(inf.mx||100),0,1),10);ctx.textAlign='left'}
  }
  if(RMT.rp&&inf.m==='choose'&&!ctlEdit){drawPadChoose(inf)}
  else if(menuMode){
    const w=Math.min(200,W*.22),h=64,y=H-h-14,ty=62,th=y-ty-14,tx=l+14,tw=W-l-SAFE.r-28;
    ctx.fillStyle='rgba(34,28,24,.85)';ctx.beginPath();ctx.roundRect(tx,ty,tw,th,16);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.75)';ctx.font='700 20px '+FONT;ctx.textAlign='center';ctx.fillText('PAVÉ TACTILE',W/2,ty+th/2-6);ctx.font='500 15px '+FONT;ctx.fillStyle='#b9b1a6';ctx.fillText('Glisse pour déplacer le curseur du PC · touche pour cliquer',W/2,ty+th/2+18);
    for(const[lab,bx] of[['◀  RETOUR',l+14],['VALIDER  ▶',W-SAFE.r-14-w]]){ctx.fillStyle='rgba(58,46,40,.95)';ctx.beginPath();ctx.roundRect(bx,y,w,h,12);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.4)';ctx.stroke();ctx.fillStyle='#fff';ctx.font='700 20px '+FONT;ctx.fillText(lab,bx+w/2,y+h/2+7)}
    ctx.textAlign='left';
  } else {
    const on={left:PADS.ctl.left,right:PADS.ctl.right,jump:PADS.ctl.jump,fire:PADS.ctl.fire,pick:[...PADS.touches.values()].some(v=>v&&v.k==='pick'),bonus:[...PADS.touches.values()].some(v=>v&&v.k==='bonus'),pause:[...PADS.touches.values()].some(v=>v&&v.k==='pause'),aim:PADS.ctl.aim};
    ctx.save();ctx.globalAlpha=TOP();for(const k of PADK) padIcon(k,PB[k],on[k]);ctx.restore();
    if(RMT.rp&&!ctlEdit) drawPadHud(inf);
  }
  if(ctlEdit) drawCtlEdit();
}
// --- pages de menu : manette, téléphone-manette, saisie du code ---
function uiSlider(x,y,w,label,frac,set){
  const hot=sliderActive&&sliderActive.id===label;
  panel(x,y,w,38,{norivets:true,grunge:.6});
  ctx.textAlign='left';ctx.fillStyle='#f2efe8';ctx.font='700 14px '+FONT;ctx.fillText(label,x+12,y+16,w-24);
  ctx.fillStyle='#0b0908';ctx.fillRect(x+12,y+25,w-24,5);ctx.fillStyle='#e2542e';ctx.fillRect(x+12,y+25,(w-24)*frac,5);
  ctx.fillStyle=hot?'#fff':'#d8d2c8';ctx.beginPath();ctx.roundRect(x+12+(w-24)*frac-4,y+20,8,15,2);ctx.fill();
  menuRects.push({x,y,w,h:38,slider:true,id:label,act:()=>set(clampN((mouse.x-x-12)/(w-24),0,1))});
}
