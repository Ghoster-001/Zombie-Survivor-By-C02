// ===== V0.61 : optimisation — les zombies humains 2D sont dessinés une fois par pose puis recopiés (au lieu d'une centaine de tracés par zombie et par image) =====
const _dzOrig=drawZombie,ZSPR=new Map();
drawZombie=function(z){
  if(z.mag||z.animal||z.y!==GROUND||z.fall!==undefined||!(z.size>0)) return _dzOrig(z);
  const s=z.size,ph=Math.round((((z.step%6.283185)+6.283185)%6.283185)/6.283185*18)%18,gb=Math.min(5,Math.max(0,Math.floor((z.gseed===undefined?.5:z.gseed)*6))),tb=(tick>>4)&3,
    key=(z.type||'')+'|'+(z.skin||'')+'|'+(z.shirt||'')+'|'+(z.xm||'')+'|'+(SET.gore?1:0)+'|'+ph+'|'+gb+'|'+tb+'|'+Math.round(s*20)+'|'+RES;
  let sp=ZSPR.get(key);
  if(!sp){
    if(ZSPR.size>700) ZSPR.clear();
    const bw=Math.ceil(100*s),bh=Math.ceil(124*s+16),ox=Math.ceil(44*s),oy=Math.ceil(108*s),c=document.createElement('canvas');
    c.width=Math.max(1,Math.ceil(bw*RES));c.height=Math.max(1,Math.ceil(bh*RES));
    const mc=ctx,t0=tick,fz={type:z.type,skin:z.skin,shirt:z.shirt,xm:z.xm,size:s,x:0,y:GROUND,dir:1,step:ph*6.283185/18,gseed:(gb+.5)/6,color:z.color,hp:z.hp,maxhp:z.maxhp};
    ctx=c.getContext('2d');ctx.setTransform(RES,0,0,RES,ox*RES,(oy-GROUND)*RES);tick=tb*16;
    try{_dzOrig(fz)}finally{ctx=mc;tick=t0}
    sp={c,ox,oy,bw,bh};ZSPR.set(key,sp);
  }
  ctx.save();ctx.translate(z.x,GROUND);ctx.scale(z.dir<0?-1:1,1);ctx.drawImage(sp.c,-sp.ox,-sp.oy,sp.bw,sp.bh);ctx.restore();
};

let last=performance.now();
let emaDt=16.7,adaptT=0;
const STEP=1000/60;let acc=0,lastDrawT=0,drawDebt=0,acT=0;
function loop(t){
  const dtRaw=Math.max(0,t-last);last=t;hzSample(dtRaw);
  const dtc=Math.min(100,dtRaw);acc+=dtc;adaptT+=dtc;drawDebt=Math.min(500,drawDebt+dtc);
  fxUpdate();ATK=FXF.anim===0?0:tick;
  inputFrame(Math.min(3,dtc/16.7));rmtTick(t);mpTick(t);
  if(t-acT>3000){acT=t;ACG.codeCheck();ACG.clockCheck()}
  const iv=1000/FXF.fps,interp=FXF.fps>61;
  if(state!=='play'||paused) prevValid=false;
  // la logique tourne à 60 Hz fixes (même vitesse de jeu quel que soit l'écran) ; au-dessus de 60 FPS les positions sont interpolées
  let steps=0;
  while(acc>=STEP-2&&steps<4){acc-=STEP;steps++;tick++;if(interp&&state==='play'&&!paused) snapPrev();try{update(STEP)}catch(e){console.error(e)}ACG.watch()}
  if(steps>=4) acc=0;else if(acc<-STEP/2) acc=0;
  const menuOnly=FXF.anim===0&&MENU_STATES.includes(state)&&state!=='pause'&&state!=='over'&&!(state==='wheel'&&wheel.spin);
  if(state!==lastUiState){if(state==='menu') updCheck(false);lastUiState=state;uiDirty=true}
  if(state==='menu'&&window.__updNotice){const n=window.__updNotice;window.__updNotice=null;flash('MISE À JOUR INSTALLÉE : V'+n[0]+' → V'+n[1]+' · progression conservée')}
  const skipMenu=menuOnly&&!uiDirty&&t-lastDrawT<250;                  // animations coupées : les menus ne se redessinent qu'au besoin
  if(drawDebt>=iv-1&&(steps>0||interp)&&!skipMenu){
    uiDirty=false;
    drawDebt=Math.max(0,drawDebt-iv);
    const d=t-lastDrawT;if(lastDrawT>0&&d<200){ftPush(d);emaDt+=(d-emaDt)*.05}lastDrawT=t;fcUpdate(t);
    const useI=interp&&prevValid,al=Math.max(0,Math.min(1,acc/STEP));
    if(useI) interpOn(al);
    try{draw()}catch(e){console.error(e)}
    if(useI) interpOff();
    try{drawFps()}catch(e){console.error(e)}
  }
  if(adaptT>3000&&!document.hidden){
    adaptT=0;
    if(emaDt>(1000/Math.min(FXF.fps,60))*1.55){                    // le jeu rame : d'abord la résolution, puis les effets (profil AUTO)
      if((SET.gfx||'auto')==='auto'&&RES>1){autoCap=Math.max(1,RES-.5);fit()}
      else if(SET.prof==='auto'&&autoDrop<6) autoDrop++;
    }
  }
  requestAnimationFrame(loop);
}
ACG.check(save);ACG.snapFns();ACG.snapData();
applyMap();reset(true);
makeTextures();
if(document.fonts){document.fonts.load('700 20px Oswald');document.fonts.load('400 20px "Black Ops One"')}
READY=true;fit();
requestAnimationFrame(loop);
