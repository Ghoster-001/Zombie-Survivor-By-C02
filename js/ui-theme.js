// ===== Interface apocalyptique : plaques de métal rouillé, rivets, rayures de danger, grain et vignette =====
const TITLE='"Black Ops One", Impact, "Arial Black", sans-serif';
let GRUNGE=null,GRAIN=null,VIG=null;
function makeTextures(){
  const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
  let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  const a=mk(256,256),g=a.getContext('2d');                      // taches de rouille, rayures, éclats
  for(let i=0;i<46;i++){const x=rnd()*256,y=rnd()*256,r=8+rnd()*34,rg=g.createRadialGradient(x,y,0,x,y,r);
    rg.addColorStop(0,rnd()<.6?'rgba(120,52,18,.22)':'rgba(0,0,0,.3)');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=rg;g.fillRect(x-r,y-r,r*2,r*2)}
  g.strokeStyle='rgba(255,255,255,.07)';g.lineWidth=1;
  for(let i=0;i<26;i++){const x=rnd()*256,y=rnd()*256,l=10+rnd()*40,an=rnd()*.6-.3;g.beginPath();g.moveTo(x,y);g.lineTo(x+l*Math.cos(an),y+l*Math.sin(an));g.stroke()}
  g.fillStyle='rgba(0,0,0,.2)';for(let i=0;i<260;i++) g.fillRect(rnd()*256,rnd()*256,1+rnd()*2,1);
  GRUNGE=ctx.createPattern(a,'repeat');
  const b=mk(128,128),h=b.getContext('2d'),im=h.createImageData(128,128);   // grain de pellicule
  for(let k=0;k<im.data.length;k+=4){const v=rnd()*255;im.data[k]=im.data[k+1]=im.data[k+2]=v;im.data[k+3]=rnd()<.55?0:70}
  h.putImageData(im,0,0);GRAIN=ctx.createPattern(b,'repeat');
  const v=mk(W,H),vg=v.getContext('2d'),gr=vg.createRadialGradient(W/2,H/2,H*.32,W/2,H/2,H*.98);   // vignette
  gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.7,'rgba(0,0,0,.35)');gr.addColorStop(1,'rgba(0,0,0,.82)');vg.fillStyle=gr;vg.fillRect(0,0,W,H);VIG=v;
}
function rivet(x,y){ctx.fillStyle='#120e0b';ctx.beginPath();ctx.arc(x,y,2.7,0,7);ctx.fill();ctx.fillStyle='#74634f';ctx.beginPath();ctx.arc(x-.6,y-.6,1.4,0,7);ctx.fill()}
const PCACHE=new Map();let pcPx=0;
function panel(x,y,w,h,o){                                            // les plaques de métal sont dessinées une fois puis recopiées (cache par taille et couleurs)
  o=o||{};
  if(w<4||h<4||w>2000||h>1200){panelRaw(x,y,w,h,o);return}
  const key=w+'|'+h+'|'+(o.top||'')+'|'+(o.bot||'')+'|'+(o.edge||'')+'|'+(o.grunge===undefined?.9:o.grunge)+'|'+(o.norivets?1:0)+'|'+RES;
  let c=PCACHE.get(key);
  if(!c){
    const cw=Math.max(1,Math.ceil(w*RES)),ch=Math.max(1,Math.ceil(h*RES));
    if(pcPx+cw*ch>48e6){PCACHE.clear();pcPx=0}
    c=document.createElement('canvas');c.width=cw;c.height=ch;pcPx+=cw*ch;
    const mc=ctx;ctx=c.getContext('2d');ctx.scale(cw/w,ch/h);try{panelRaw(0,0,w,h,o)}finally{ctx=mc}
    PCACHE.set(key,c);
  }
  ctx.drawImage(c,x,y,w,h);
}
function panelRaw(x,y,w,h,o){
  o=o||{};
  const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,o.top||'#2a2522');g.addColorStop(1,o.bot||'#15110f');
  ctx.fillStyle=g;ctx.fillRect(x,y,w,h);
  if(GRUNGE){ctx.save();ctx.globalAlpha=o.grunge===undefined?.9:o.grunge;ctx.fillStyle=GRUNGE;ctx.fillRect(x,y,w,h);ctx.restore()}
  ctx.strokeStyle=o.edge||'#4a3a2e';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,w-2,h-2);
  ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+2.5,y+h-2);ctx.lineTo(x+2.5,y+2.5);ctx.lineTo(x+w-2,y+2.5);ctx.stroke();
  if(!o.norivets&&w>40&&h>34){rivet(x+7,y+7);rivet(x+w-7,y+7);rivet(x+7,y+h-7);rivet(x+w-7,y+h-7)}
}
function hazard(x,y,w,h){
  if(MENU_MODE&&x===0&&w===960){x=-MOX;w=MRW}
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.fillStyle='#d9a21b';ctx.fillRect(x,y,w,h);ctx.fillStyle='#17130f';
  for(let k=-h;k<w+h;k+=14){ctx.beginPath();ctx.moveTo(x+k,y+h);ctx.lineTo(x+k+7,y+h);ctx.lineTo(x+k+7+h,y);ctx.lineTo(x+k+h,y);ctx.fill()}
  ctx.restore();
}
function barbed(x0,x1,y,sway){
  if(MENU_MODE&&x0===0&&x1===960){x0=-MOX;x1=960+MOX;y-=MOY}
  ctx.strokeStyle='#6a625a';ctx.lineWidth=1.6;ctx.beginPath();
  for(let x=x0;x<=x1;x+=6){const yy=y+Math.sin(x*.05+ATK*.01)*3*sway;x===x0?ctx.moveTo(x,yy):ctx.lineTo(x,yy)}ctx.stroke();
  ctx.strokeStyle='#8a8278';ctx.lineWidth=1.3;
  for(let x=x0+14;x<=x1;x+=44){const yy=y+Math.sin(x*.05+ATK*.01)*3*sway;ctx.beginPath();ctx.moveTo(x-4,yy-4);ctx.lineTo(x+4,yy+4);ctx.moveTo(x+4,yy-4);ctx.lineTo(x-4,yy+4);ctx.stroke()}
}
function skull(cx,cy,sc,col){
  ctx.save();ctx.translate(cx,cy);ctx.scale(sc,sc);ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,-4,14,Math.PI*.95,Math.PI*2.05);ctx.lineTo(10,8);ctx.lineTo(10,15);ctx.lineTo(-10,15);ctx.lineTo(-10,8);ctx.closePath();ctx.fill();
  ctx.fillStyle='#0b0908';ctx.beginPath();ctx.arc(-5.5,-2,3.6,0,7);ctx.arc(5.5,-2,3.6,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(0,3);ctx.lineTo(-2.4,8);ctx.lineTo(2.4,8);ctx.fill();
  ctx.strokeStyle='#0b0908';ctx.lineWidth=1.2;for(const x of[-5,0,5]){ctx.beginPath();ctx.moveTo(x,10);ctx.lineTo(x,15);ctx.stroke()}ctx.restore();
}
function padlock(cx,cy,sc,col){
  ctx.save();ctx.translate(cx,cy);ctx.scale(sc,sc);ctx.strokeStyle=col;ctx.lineWidth=3.2;ctx.beginPath();ctx.arc(0,-6,7,Math.PI,0);ctx.stroke();
  ctx.fillStyle=col;ctx.fillRect(-10,-6,20,16);ctx.fillStyle='#000a';ctx.beginPath();ctx.arc(0,1,2.4,0,7);ctx.fill();ctx.fillRect(-1,2,2,5);ctx.restore();
}
function segBar(x,y,w,h,v,max,col,n){
  const gw=(w-(n-1)*2)/n,f=Math.max(0,Math.min(1,v/max))*n;
  for(let i=0;i<n;i++){
    const fl=Math.max(0,Math.min(1,f-i)),sx=x+i*(gw+2);
    ctx.fillStyle='#1a1412';ctx.fillRect(sx,y,gw,h);
    if(fl>0){ctx.fillStyle=col;ctx.fillRect(sx,y,gw*fl,h);ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(sx,y,gw*fl,h*.35)}
  }
}
function overlayFx(low){
  if(FXF.post){ctx.drawImage(VIG,0,0,W,H);
  ctx.save();ctx.globalAlpha=.07;ctx.translate((ATK*7)%128,(ATK*13)%128);ctx.fillStyle=GRAIN;ctx.fillRect(-128,-128,W+128,H+128);ctx.restore()}
  if(low>0){const a=low*(.35+.2*Math.sin(tick*.15)),gr=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.85);
    gr.addColorStop(0,'rgba(160,0,0,0)');gr.addColorStop(1,'rgba(160,10,10,'+a+')');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H)}
}
function ash(){
  if(FXF.anim<2) return;
  for(let i=0;i<28;i++){
    const t=tick*(.25+(i%5)*.06)+i*53,x=(i*97+t*.6+Math.sin(t*.02+i)*20)%(W+20),y=(i*61+t*.9)%(GROUND-10),sz=1.6+(i%3)*.6;
    ctx.fillStyle='rgba(210,200,190,'+(.12+(i%4)*.05)+')';ctx.fillRect(x,y,sz,sz);
  }
}
function drawCursor(){
  if(touchUsed) return;
  if(state==='play'&&aimDir()){ctx.fillStyle='rgba(255,74,58,.85)';ctx.beginPath();ctx.arc(mouse.rx,mouse.ry,3,0,7);ctx.fill();return}
  const x=mouse.rx,y=mouse.ry,path=()=>{ctx.beginPath();ctx.arc(x,y,9,0,7);
    for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){ctx.moveTo(x+dx*12,y+dy*12);ctx.lineTo(x+dx*19,y+dy*19)}};
  ctx.save();ctx.lineCap='round';path();ctx.strokeStyle='rgba(0,0,0,.75)';ctx.lineWidth=4.5;ctx.stroke();
  path();ctx.strokeStyle='#ff4a3a';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#ff4a3a';ctx.beginPath();ctx.arc(x,y,1.5,0,7);ctx.fill();ctx.restore();
}
function btn(list,x,y,w,h,label,opts){
  opts=opts||{};
  const o=Object.assign({x,y,w,h},opts.code?{code:opts.code}:{act:opts.act});
  list.push(o);
  const hot=!opts.dim&&mouse.x>=x&&mouse.x<=x+w&&mouse.y>=y&&mouse.y<=y+h;
  panel(x,y,w,h,{top:opts.dim?'#1b1715':hot?'#4a2018':'#2d2723',bot:opts.dim?'#0f0c0b':hot?'#2a100c':'#17120f',edge:opts.dim?'#2c2622':hot?'#e2542e':'#4a3a2e',norivets:h<40,grunge:opts.dim?.5:.9});
  if(hot){ctx.save();ctx.shadowColor='#e2542e';ctx.shadowBlur=14;ctx.strokeStyle='#e2542e';ctx.lineWidth=1.5;ctx.strokeRect(x+1,y+1,w-2,h-2);ctx.restore();hazard(x+3,y+3,6,h-6)}
  else if(!opts.dim){ctx.fillStyle='#7a2c1c';ctx.fillRect(x+3,y+3,3,h-6)}
  const tx=x+(hot?20:16);
  ctx.textAlign='left';ctx.fillStyle=opts.dim?'#6b625b':'#f2efe8';
  ctx.font='700 '+(opts.size||22)+'px '+FONT;ctx.fillText(label,tx,y+(opts.sub?h/2-2:h/2+8),w-(tx-x)-12);
  if(opts.sub){ctx.font='500 15px '+FONT;ctx.fillStyle=opts.dim?'#6b625b':'#d8a64a';ctx.fillText(opts.sub,tx,y+h/2+18,w-(tx-x)-12)}
}
function embers(){
  if(FXF.anim<2) return;
  for(let i=0;i<40;i++){
    const t=(tick*.6+i*97)%540, x=(i*163+Math.sin(tick*.02+i)*30)%W, y=GROUND+40-t;
    ctx.fillStyle='rgba(255,'+(120+i*3%100)+',40,'+(.8-t/700)+')';
    ctx.fillRect(x,y,2+i%3,2+i%3);
  }
}
// Les menus sont dessinés dans un espace de 960x540 centré en bas de l'écran, le décor et les voiles couvrent tout l'écran.
let MENU_MODE=false,MOX=0,MOY=0,MRW=960,MRH=540;
const MENU_SPACE=['menu','shop','quit','bye','maps','saves','options','credits','upgrades','weapon','keys','custom','lang','trainpick','boosts','wheel','fpsopt','maint','gamepad','padsel','nmsetup','playhub','remote','padjoin','mpmenu','mphost','mplobby','mpjoin','mpjoining','acpage','avatars','rpsetup','rpjoin'];
function syncMouse(){const m=MENU_SPACE.includes(state);mouse.x=mouse.rx-(m?(W-960)/2:0);mouse.y=mouse.ry-(m?(H-540):0)}
function inMenuSpace(fn){
  const RW=W,RH=H,RG=GROUND,ox=(RW-960)/2,oy=RH-540;
  ctx.save();ctx.translate(ox,oy);W=960;H=540;GROUND=460;MENU_MODE=true;MOX=ox;MOY=oy;MRW=RW;MRH=RH;
  const fr=ctx.fillRect;ctx.fillRect=function(x,y,w,h){if(x===0&&y===0&&w===960&&h===540){x=-ox;y=-oy;w=RW;h=RH}return fr.call(this,x,y,w,h)};
  try{fn()}finally{delete ctx.fillRect;W=RW;H=RH;GROUND=RG;MENU_MODE=false;ctx.restore()}
}
