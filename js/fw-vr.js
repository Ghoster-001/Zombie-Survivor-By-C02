// ===== V0.81 : RÉALITÉ VIRTUELLE (WebXR) — casque VR (Meta Quest, Pico, casques PC via navigateur) en solo, coop et Battle Royale =====
// Stick gauche : avancer (vers où l'on regarde) · stick droit : tourner par crans · gâchette droite : tirer (on vise avec la main)
// bouton A : sauter · bouton B : ramasser · poignée droite : changer d'arme · panneau au poignet gauche : vie, munitions, vague.
// La logique du jeu est la même qu'à l'écran (même boucle à 60 Hz, même réseau) : seule la caméra et les commandes changent.
const FWVR={ok:false,checked:false,session:null,rig:null,cam:null,ctrl:[],hud:null,hudT:0,last:0,acc:0,turn:0,prev:{},btn:null,S:45};   // S : unités de jeu par mètre
function fwVrCheck(){
  if(FWVR.checked) return;FWVR.checked=true;
  try{if(navigator.xr&&navigator.xr.isSessionSupported) navigator.xr.isSessionSupported('immersive-vr').then(ok=>{FWVR.ok=!!ok}).catch(()=>{})}catch(e){}
}
function fwVrSetup(){
  const T=THREE;if(FWVR.rig&&FWVR.rig.parent===FW.scene) return;
  const rig=new T.Group(),cam=new T.PerspectiveCamera(80,1,.05,4000);rig.add(cam);rig.scale.setScalar(FWVR.S);FW.scene.add(rig);
  FWVR.rig=rig;FWVR.cam=cam;FWVR.ctrl=[];
  for(let i=0;i<2;i++){
    const c=G3.r.xr.getController(i);rig.add(c);
    c.addEventListener('connected',e=>{c.userData.src=e.data;c.userData.hand=e.data.handedness});
    c.addEventListener('disconnected',()=>{c.userData.src=null});
    FWVR.ctrl.push(c);
  }
  // arme tenue dans la main droite (repère du contrôleur : -Z vers l'avant, en mètres)
  const gun=new T.Group(),m=(sx,sy,sz,x,y,z,col)=>{const b=new T.Mesh(new T.BoxGeometry(sx,sy,sz),new T.MeshStandardMaterial({color:col,metalness:.6,roughness:.4}));b.position.set(x,y,z);gun.add(b)};
  m(.035,.05,.26,0,0,-.08,0x1e2024);m(.018,.018,.16,0,.01,-.28,0x555a60);m(.03,.1,.04,0,-.06,.02,0x111214);m(.03,.08,.05,0,-.05,-.1,0x111214);
  FWVR.gun=gun;
  // panneau au poignet gauche
  const cv2=document.createElement('canvas');cv2.width=512;cv2.height=256;const tx=new T.CanvasTexture(cv2);
  const hud=new T.Mesh(new T.PlaneGeometry(.16,.08),new T.MeshBasicMaterial({map:tx,transparent:true,toneMapped:false,depthTest:false}));hud.renderOrder=999;hud.position.set(0,.06,.06);hud.rotation.x=-.9;
  FWVR.hud=hud;FWVR.hudCv=cv2;FWVR.hudTx=tx;
}
async function fwVrEnter(){
  if(FWVR.session||!navigator.xr||!FW.on) return;
  try{
    const r=G3.r;r.xr.enabled=true;fwVrSetup();
    const s=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor']});
    r.xr.setReferenceSpaceType('local-floor');await r.xr.setSession(s);
    FWVR.session=s;FW.vr=true;FW.vm.visible=false;FWVR.last=0;FWVR.acc=0;try{document.exitPointerLock()}catch(e){}
    s.addEventListener('end',fwVrEnd);
    r.setAnimationLoop(fwVrFrame);flash('RÉALITÉ VIRTUELLE');
  }catch(e){console.warn('VR',e);flash('VR indisponible : '+(e&&e.message||e))}
}
function fwVrEnd(){
  FW.vr=false;FWVR.session=null;try{G3.r.setAnimationLoop(null)}catch(e){}
  FW.rw=0;if(FW.vm) FW.vm.visible=true;
  setTimeout(()=>{if(performance.now()-last>300) requestAnimationFrame(loop)},350);   // relance la boucle normale si le navigateur l'avait suspendue
}
function fwVrInput(){
  const s=FWVR.session,inp={mx:0,mz:0,fire:false,jump:false};let right=null,left=null;
  if(s) for(const src of s.inputSources){if(!src.gamepad) continue;if(src.handedness==='left') left=src;else right=src}
  const ax=(g,i)=>{const v=g&&g.axes[i]||0;return Math.abs(v)<.15?0:v},bt=(g,i)=>!!(g&&g.buttons[i]&&g.buttons[i].pressed);
  const edge=(k,v)=>{const was=FWVR.prev[k];FWVR.prev[k]=v;return v&&!was};
  const lg=left&&left.gamepad,rg=right&&right.gamepad;
  inp.mx=ax(lg,2);inp.mz=-ax(lg,3);
  inp.fire=bt(rg,0);inp.jump=bt(rg,4);
  const tx=ax(rg,2);if(edge('tr',tx>.6)) FWVR.turn-=Math.PI/6;if(edge('tl',tx<-.6)) FWVR.turn+=Math.PI/6;
  if(edge('sq',bt(rg,1))) fwSwap();
  if(edge('pick',bt(rg,5))) fwPickup();
  if(edge('menu',bt(lg,4)||bt(lg,5))) fwUseBonus();
  FW.vrIn=inp;
}
function fwVrPose(){
  const T=THREE,rig=FWVR.rig;if(!rig) return;
  if(Math.abs(FW.y-FW.yv)>45) FW.yv=FW.y;else FW.yv+=(FW.y-FW.yv)*.3;
  rig.position.set(FW.x,FW.yv,FW.z);rig.rotation.y=FWVR.turn;rig.updateMatrixWorld(true);
  // direction du regard -> sens de la marche ; contrôleur droit -> visée (la caméra de tir suit la main)
  const xc=G3.r.xr.isPresenting?G3.r.xr.getCamera(FWVR.cam):FWVR.cam,d=new T.Vector3();xc.getWorldDirection(d);FW.yaw=Math.atan2(-d.x,-d.z);
  let rc=null,lc=null;for(const c of FWVR.ctrl){if(!c.userData.src) continue;if(c.userData.hand==='left') lc=c;else rc=c}
  if(rc){
    if(FWVR.gun.parent!==rc) rc.add(FWVR.gun);
    if(FWVR.gunW!==player.w&&typeof fwGunGroup==='function'){                          // l'arme réellement équipée, à l'échelle de la main
      FWVR.gunW=player.w;while(FWVR.gun.children.length) FWVR.gun.remove(FWVR.gun.children[0]);
      const wp=WEAPONS[player.w],w=wp&&wp.hands?wp.hi[0]:player.w,hold=new T.Group();
      if(WEAPONS[w]&&WEAPONS[w].melee){const pg={gun:new T.Group()};pg.gun.userData.w=-1;g3Gun(pg,w);hold.add(pg.gun)}else for(const m of fwGunGroup(w)) hold.add(m);
      hold.scale.setScalar(1/FWVR.S);hold.rotation.y=Math.PI/2;hold.position.set(0,-.02,.03);FWVR.gun.add(hold);
    }
    rc.updateMatrixWorld(true);const p=new T.Vector3(),q=new T.Quaternion();rc.getWorldPosition(p);rc.getWorldQuaternion(q);
    FW.cam.position.copy(p);FW.cam.quaternion.copy(q);FW.cam.updateMatrixWorld(true);
    const f=new T.Vector3(0,0,-1).applyQuaternion(q);FW.pitch=Math.asin(Math.max(-1,Math.min(1,f.y)));
  }
  if(lc&&FWVR.hud.parent!==lc) lc.add(FWVR.hud);
}
function fwVrHud(){
  if(!FWVR.hudCv||++FWVR.hudT%12) return;
  const g=FWVR.hudCv.getContext('2d'),P=player,wp=WEAPONS[P.w];
  g.clearRect(0,0,512,256);g.fillStyle='rgba(10,10,14,.78)';g.fillRect(0,0,512,256);g.strokeStyle='#e2542e';g.lineWidth=6;g.strokeRect(3,3,506,250);
  g.fillStyle='#e9e1d0';g.font='700 44px Oswald,Impact,sans-serif';g.fillText('VIE '+Math.max(0,Math.ceil(P.hp)),24,62);
  g.fillStyle='#333';g.fillRect(24,78,464,22);g.fillStyle=P.hp>P.maxhp*.3?'#58b84a':'#d03a2a';g.fillRect(24,78,464*Math.max(0,P.hp/P.maxhp),22);
  g.fillStyle='#ffd45a';g.font='700 36px Oswald,Impact,sans-serif';g.fillText((tr(wp.name)||'').toUpperCase().slice(0,22),24,150);
  g.fillStyle='#e9e1d0';g.fillText(wp.melee?'∞':(stock&&stock[P.w]!==undefined?String(stock[P.w]):''),24,196);
  g.fillText(FW.zone&&FW.mode!=='coop'?('ZONE '+Math.round(FW.zone.r)):('VAGUE '+wave+' · '+kills+' MORTS'),24,240);
  FWVR.hudTx.needsUpdate=true;
}
function fwVrFrame(t){
  if(!FW.vr) return;
  const dt=Math.min(100,FWVR.last?t-FWVR.last:16.7);FWVR.last=t;FWVR.acc+=dt;last=t;
  try{mpTick(t)}catch(e){}
  fwVrInput();fwVrPose();
  let n=0;while(FWVR.acc>=STEP-2&&n<4){FWVR.acc-=STEP;n++;tick++;try{update(STEP)}catch(e){console.error(e)}}
  if(n>=4) FWVR.acc=0;
  fwVrPose();fwVrHud();
  try{fwRender()}catch(e){console.error(e)}
}
// bouton « VR » dans l'interface 3D (seulement si un casque est disponible)
function fwVrBtn(){
  fwVrCheck();let framed=false;try{framed=window.top!==window}catch(e){framed=true}
  const open=!FWVR.ok&&!!navigator.xr&&framed;
  if((!FWVR.ok&&!open)||FW.vr){FWVR.btn=null;return}
  const x=W-92-(open?90:60),y=196,w=open?180:120,h=34;FWVR.btn={x,y,w,h,open};
  if(open){ctx.save();ctx.fillStyle='rgba(10,10,14,.75)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#8a8178';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);ctx.fillStyle='#e9e1d0';ctx.font='700 14px '+FONT;ctx.textAlign='center';ctx.fillText('VR : OUVRIR LE JEU',x+w/2,y+22);ctx.restore();ctx.textAlign='left';return}
  ctx.save();ctx.fillStyle='rgba(10,10,14,.75)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#e2542e';ctx.lineWidth=2;ctx.strokeRect(x,y,w,h);
  ctx.fillStyle='#e9e1d0';ctx.font='700 16px '+FONT;ctx.textAlign='center';ctx.fillText('ENTRER EN VR',x+w/2,y+22);ctx.restore();ctx.textAlign='left';
}
function fwVrHit(e){
  const b=FWVR.btn;if(!b||!FW.on||state!=='fw') return false;
  const r=cv.getBoundingClientRect(),t=e.touches?e.touches[0]:e,x=(t.clientX-r.left)*W/r.width,y=(t.clientY-r.top)*H/r.height;
  return x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
}
for(const ev of['mousedown','touchstart']) cv.addEventListener(ev,e=>{if(fwVrHit(e)){e.preventDefault();e.stopImmediatePropagation();if(FWVR.btn.open){try{window.open(REMOTE_URL,'_blank')}catch(_){}}else fwVrEnter()}},{capture:true,passive:false});
