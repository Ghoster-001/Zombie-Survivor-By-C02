// ===== Armes réalistes : dessinées une fois sur un canvas hors-écran (1 unité = 2 px), origine = détente sur l'axe du canon =====
const ICON_W=640,ICON_H=320,OX=260,OY=150,ICONS={};
function shade(hex,f){
  const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;
  if(f>=0){r+=(255-r)*f;g+=(255-g)*f;b+=(255-b)*f}else{r*=1+f;g*=1+f;b*=1+f}
  return 'rgb('+(r|0)+','+(g|0)+','+(b|0)+')';
}
const gradV=(y0,y1,c)=>{const g=ctx.createLinearGradient(0,y0,0,y1);g.addColorStop(0,shade(c,.34));g.addColorStop(.5,c);g.addColorStop(1,shade(c,-.5));return g};
const edge=()=>{ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=.8;ctx.stroke()};
const mrect=(x,y,w,h,r,c)=>{ctx.fillStyle=gradV(y,y+h,c);ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();edge()};
const mpoly=(pts,c)=>{let a=1e9,b=-1e9;for(const p of pts){a=Math.min(a,p[1]);b=Math.max(b,p[1])}
  ctx.fillStyle=gradV(a,b,c);ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();edge()};
const ln=(x1,y1,x2,y2,w,c)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()};
const disc=(x,y,r,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()};
const grain=(x,y,w,h)=>{ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=.7;
  for(let i=1;i<4;i++){const yy=y+h*i/4;ctx.beginPath();ctx.moveTo(x,yy);ctx.bezierCurveTo(x+w*.3,yy-1.6,x+w*.6,yy+1.6,x+w,yy);ctx.stroke()}};
let MASK=false;
const wrect=(x,y,w,h,r,c)=>{if(MASK){ctx.fillStyle='#00ff00';ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();return}mrect(x,y,w,h,r,c);grain(x,y,w,h)};
const wpoly=(pts,c)=>{if(MASK){ctx.fillStyle='#00ff00';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();return}mpoly(pts,c);let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const p of pts){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])}grain(x0,y0,x1-x0,y1-y0)};
const guard=(x,y,w,h,c)=>{ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+w,y);ctx.lineTo(x+w,y+h*.6);ctx.quadraticCurveTo(x+w,y+h,x+w*.5,y+h);ctx.lineTo(x,y+h*.9);ctx.stroke();ln(x+w*.55,y,x+w*.4,y+h*.7,1.8,'#111')};
const rings=(x0,x1,y0,h,n,c)=>{for(let i=0;i<n;i++){const x=x0+(x1-x0)*i/(n-1);mrect(x-1.2,y0,2.4,h,.5,c)}};
const holes=(x0,x1,y0,y1,step,c)=>{ctx.fillStyle=c;for(let x=x0;x<x1;x+=step)for(let y=y0;y<=y1;y+=step*.9)ctx.fillRect(x,y,1.6,1.6)};

function pistolBase(o){
  const L=o.L||46,H=o.H||12;
  mpoly([[-24,H-9],[L-24,H-9],[L-26,H-2],[8,H-2],[7,H+3],[2,H+8],[-3,H+8],[-9,H+34],[-28,H+34],[-25,H+4]],o.fr);
  if(o.gr){wpoly([[-23,H+3],[-5,H+3],[-10,H+32],[-27,H+32]],o.gr);disc(-16,H+14,1.2,'#d8c48a')}
  else{ctx.fillStyle='rgba(255,255,255,.12)';for(let r=0;r<7;r++)for(let c=0;c<3;c++)ctx.fillRect(-23+c*5-r*.9,H+7+r*3.6,1.5,1.5)}
  mrect(-29,H+31,19,4,1,'#16171a');
  guard(0,H-1,10,10,o.fr);
  mrect(-24,-7,L,H,2,o.sl);
  for(let i=0;i<5;i++) ln(-21+i*2.4,-6,-21+i*2.4,H-9,.8,'rgba(0,0,0,.45)');
  if(o.cut){mrect(0,-6,L-26,H-3,1,'#0d0d0e');mrect(3,-3,L-30,4,1,'#8a8f98')}
  else mrect(-2,-6,15,5,1,'#0d0d0e');
  mrect(-23,-10,4,3,.5,o.sl);mrect(L-28,-10,3,3,.5,o.sl);
  mrect(L-24,-3,4,H-6,1,'#15161a');
  if(o.hammer) mpoly([[-27,-6],[-22,-6],[-22,0],[-28,-2]],o.sl);
}
const ST={};
ST.glock=o=>pistolBase(Object.assign({sl:'#3a3e44',fr:'#27292d'},o));
ST.m1911=o=>pistolBase(Object.assign({sl:'#2c2f34',fr:'#34373c',gr:'#6b3f1e',hammer:true,L:48,H:11},o));
ST.beretta=o=>pistolBase(Object.assign({sl:'#9aa0a8',fr:'#2a2c30',gr:'#222428',cut:true,hammer:true,L:52,H:12},o));
ST.deagle=o=>pistolBase(Object.assign({sl:'#b9bec6',fr:'#aab0b8',gr:'#26282b',L:60,H:16},o));
ST.nailgun=o=>{
  mrect(-26,-12,56,20,4,'#d9b52b');mrect(-26,-12,56,5,3,'#e9cb55');
  mpoly([[-14,8],[0,8],[-2,34],[-18,34]],'#26282b');mrect(26,-6,14,9,1,'#555');
  mpoly([[10,6],[42,-4],[44,0],[12,12]],'#3a3d42');guard(0,7,10,10,'#222');
  ctx.fillStyle='#ccc';for(let i=0;i<6;i++)ctx.fillRect(14+i*5,-1+i*-1.2,2,5);
};
ST.revolver=o=>{
  const B=o.B||44,c=o.c||'#6a7380';
  mrect(-8,-10,26,18,3,c);mrect(18,-6,B,7,1.5,c);mrect(18,-9,B,3,1,shade(c,-.15));mrect(18,1,B*.65,5,1,shade(c,-.1));
  mpoly([[B+14,-6],[B+20,-6],[B+20,-12],[B+16,-12]],'#1a1a1a');
  mrect(-6,-11,24,19,4,shade(c,.12));for(const x of[-1,5,11,17])ln(x,-9,x,6,1,'rgba(0,0,0,.5)');
  mpoly([[-12,-10],[-4,-10],[-14,-20],[-19,-17]],c);
  wpoly([[-12,8],[-2,8],[-5,34],[-22,32],[-20,16]],'#6b3f1e');guard(-2,7,10,10,c);
};
ST.uzi=o=>{
  const k=o.k||1;ctx.save();ctx.scale(k,k);
  mrect(-34,-12,66,17,2,o.sl||'#2d2f33');mrect(-34,-12,66,4,1,'#3c3f45');
  mrect(32,-9,16,11,1,'#26282b');mrect(48,-4,9,5,1,'#16171a');mrect(-33,-16,5,4,.5,'#222');mrect(44,-16,3,8,.5,'#222');
  mpoly([[-8,5],[8,5],[10,44],[-6,46]],o.mp40?'#2a2420':'#232529');mrect(-7,43,17,4,1,'#111');
  guard(8,4,12,11,'#26282b');
  ctx.strokeStyle='#3a3d42';ctx.lineWidth=2.4;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-34,-8);ctx.lineTo(-64,-8);ctx.lineTo(-64,6);ctx.lineTo(-34,4);ctx.stroke();
  mrect(-68,-9,5,17,1,'#1a1a1a');
  ctx.restore();
};
ST.mp5=o=>{
  const k=o.k||1,C=o.c||'#2c2e32';ctx.save();ctx.scale(k,k);
  mrect(-26,-12,44,15,3,C);mrect(18,-12,32,15,4,shade(C,.1));
  for(let i=0;i<5;i++) mrect(23+i*5,-8,2.5,7,1,'#0d0d0e');
  mrect(50,-5,13,6,1,'#1c1c1c');mrect(52,-13,6,7,1,C);disc(-17,-14,3.2,'#222');
  mrect(-56,-10,32,14,3,C);mrect(-61,-9,6,17,1,'#1a1a1a');ln(-26,-6,-56,-6,1,'rgba(0,0,0,.5)');
  mpoly([[-14,3],[-2,3],[-8,27],[-22,25]],'#26282b');
  mpoly([[4,3],[17,3],[19,24],[27,40],[15,43],[8,26]],'#2a2c30');
  if(o.tube) mrect(14,5,38,6,3,'#3a3d42');
  guard(-2,2,12,10,C);ctx.restore();
};
ST.p90=o=>{
  mpoly([[-46,-6],[-8,-18],[44,-14],[52,-8],[52,4],[44,10],[-8,14],[-46,10]],o.v?'#3a3d3a':'#4d5157');
  mrect(-34,-27,72,11,5,'#7d8c91');ctx.fillStyle='#c9a52b';for(let i=0;i<14;i++)ctx.fillRect(-30+i*4.8,-24,2.6,5);
  mrect(-4,-36,14,9,3,'#1c1d20');disc(3,-31,2,'#e24a4a');
  mrect(52,-4,20,5,1,'#1d1d1d');disc(-10,0,5,'#0d0d0e');guard(2,5,10,10,'#2a2c2f');
  ln(-44,2,-12,6,1,'rgba(0,0,0,.4)');
};
ST.thompson=o=>{
  mrect(-30,-11,50,15,2,'#2a2c30');mrect(20,-10,36,13,2,'#33363b');
  if(o.ppsh) holes(24,54,-7,0,3.6,'#0d0d0e'); else for(let i=0;i<6;i++)ln(24+i*5,-10,24+i*5,3,.9,'rgba(0,0,0,.5)');
  mrect(56,-7,9,10,1,'#1c1c1c');
  if(!o.ppsh) wrect(14,4,9,20,3,'#8a5a2b');
  wpoly([[-30,-8],[-76,-2],[-80,14],[-30,4]],'#8a5a2b');wrect(-12,4,11,23,3,'#8a5a2b');
  mrect(-5,-14,12,4,1,'#222');
  disc(3,29,14,'#2a2c30');disc(3,29,10,'#3a3d42');ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=.8;
  for(let a=0;a<6;a++){ctx.beginPath();ctx.moveTo(3,29);ctx.lineTo(3+10*Math.cos(a),29+10*Math.sin(a));ctx.stroke()}
  guard(6,3,12,10,'#2a2c30');
};
ST.ak=o=>{
  const Wd=o.wood||'#8a5a2b',M=o.mag||'#26272b',E=92-(o.short?30:0)+(o.rpk?14:0);
  mrect(30,-2,E-30,4,1.5,'#1e2024');mrect(E-9,-10,3,9,.5,'#1e2024');mrect(E-4,-4,o.brake?11:7,8,1.5,'#1e2024');
  mrect(34,-9,E-50,5,2,'#2a2c30');
  wrect(24,-3,E-52,13,2,Wd);if(E-62>12) wrect(36,-10,E-62,6,1,Wd);
  if(o.rail) mrect(-18,-14,76,3,1,'#33363b');
  mrect(-32,-9,62,16,2,'#2b2d31');for(let i=0;i<7;i++)ln(-26+i*7,-8,-26+i*7,-2,.8,'rgba(0,0,0,.5)');
  mrect(26,-12,10,3,1,'#1a1a1a');
  if(o.short) {ln(-32,-3,-66,-3,3,'#2a2c30');mrect(-70,-8,5,14,1,'#1a1a1a')}
  else wpoly([[-32,-6],[-80,-2],[-84,14],[-32,6]],Wd);
  wpoly([[-16,6],[-3,6],[-8,28],[-22,26]],Wd);guard(-5,5,16,9,'#2a2c30');
  mpoly([[0,7],[15,7],[24,22],[34,38],[22,42],[14,28],[4,17]],M);ln(8,14,24,26,.8,'rgba(0,0,0,.4)');
  if(o.rpk){ln(E-14,3,E-24,24,1.6,'#2a2c30');ln(E-14,3,E-4,24,1.6,'#2a2c30')}
};
ST.ar=o=>{
  const C=o.tan?'#a89270':o.poly?'#3b3f36':'#2c2e32',Wd=o.wood?'#8a5a2b':null,E=o.long?104:(o.short?78:92);
  mrect(-28,-12,58,12,2,C);mrect(-26,0,44,10,2,C);
  if(Wd) wrect(30,-9,E-50,15,3,Wd);
  else{mrect(30,-12,E-46,16,3,shade(C,.1));for(let i=0;i<5;i++)mrect(35+i*(E-60)/5,-7,2.4,8,1,'#0d0d0e')}
  if(o.rail){mrect(-24,-16,E-36,4,1,'#34373c');for(let x=-20;x<E-40;x+=5)ln(x,-16,x,-12,.7,'rgba(0,0,0,.5)')}
  else if(!o.fal&&!o.poly){mrect(-18,-19,40,7,3,C);mrect(-14,-22,8,4,1,'#1a1a1a')}
  if(o.poly) mrect(-18,-24,44,13,5,'#2a2d27');
  if(o.optic){mrect(-6,-28,30,11,3,'#17181b');disc(24,-22,4.5,'#5fb0ff');disc(-6,-22,3.5,'#2a6a9a')}
  mrect(E-22,-4,20,5,1,'#1e2024');mrect(E-4,-5.5,10,9,1,'#1a1b1e');mpoly([[E-28,-3],[E-24,-13],[E-20,-13],[E-20,-3]],'#1e2024');
  if(Wd) wpoly([[-28,-8],[-82,-3],[-86,15],[-28,7]],Wd);
  else{mrect(-54,-8,28,13,3,C);mrect(-60,-9,7,19,1,'#1a1a1a');ln(-28,-3,-54,-3,1,'rgba(0,0,0,.5)')}
  if(Wd) wpoly([[-14,10],[-2,10],[-8,32],[-22,30]],Wd);else mpoly([[-14,10],[-2,10],[-8,32],[-22,30]],C);
  guard(-3,9,16,9,C);
  mpoly(o.fal?[[2,10],[18,10],[24,42],[8,44]]:[[2,10],[17,10],[19,42],[5,42]],'#2a2c30');
  if(o.rail&&o.optic) mrect(42,4,6,18,2,'#2a2c30');
};
ST.bullpup=o=>{
  const C=o.c||(o.aug?'#4b5a3a':'#3a3d41');
  mpoly([[-70,-9],[24,-13],[44,-9],[44,3],[22,6],[-70,10]],C);
  if(o.aug){mrect(-8,-26,44,13,5,'#1f2220');disc(36,-20,5,'#5fb0ff');ln(-8,-20,-30,-14,2,'#1f2220')}
  else if(o.famas) mpoly([[-30,-12],[-24,-26],[18,-26],[24,-12]],C);
  else mrect(-10,-20,46,8,3,'#222');
  mrect(44,-5,36,5,1,'#1e2024');mrect(78,-6.5,9,8,1,'#1a1b1e');
  mpoly([[-6,6],[6,6],[2,30],[-12,28]],C);
  mpoly([[-36,8],[-20,8],[-20,38],[-36,38]],o.aug?'#8a9a7a':'#2a2c30');
  mrect(-75,-9,6,20,1,'#1a1a1a');guard(6,5,12,10,C);
};
ST.pump=o=>{
  const Wd=o.syn?'#26272b':'#8a5a2b';
  mrect(10,-4,90,5,1.5,'#2b2e33');mrect(10,3,72,5,1.5,'#2b2e33');mrect(96,-8,2.4,4,.5,'#ddd');
  mrect(-28,-10,42,16,2,'#2b2d31');mrect(-12,-6,16,4,1,'#0d0d0e');
  wrect(28,1,32,12,4,Wd);ln(32,5,56,5,.8,'rgba(0,0,0,.4)');
  wpoly([[-28,-6],[-88,2],[-92,19],[-28,8]],Wd);guard(-8,5,14,10,'#2b2d31');
};
ST.tact=o=>{
  mrect(14,-4,88,5,1.5,'#26282b');mrect(14,3,76,5,1.5,'#2b2e33');if(o.twin) mrect(14,9,76,5,1.5,'#2b2e33');
  mrect(-30,-11,46,17,3,'#26282b');mrect(-26,-16,40,5,1,'#33363b');
  mrect(30,1,34,13,3,'#2a2c2f');for(let i=0;i<6;i++)ln(34+i*5,3,34+i*5,12,.8,'rgba(0,0,0,.5)');
  mrect(98,-9,3,8,.5,'#1a1a1a');
  mpoly([[-14,6],[-2,6],[-6,28],[-20,26]],'#26282b');mpoly([[-30,-8],[-84,-2],[-88,16],[-30,6]],'#26282b');
  if(o.ak) mpoly([[2,6],[16,6],[24,22],[30,34],[18,38],[10,24]],'#2a2a2e');
  if(o.big) mrect(-6,6,34,24,4,'#2f3236');
  guard(-4,5,14,9,'#26282b');
};
ST.double=o=>{
  mrect(0,-7,94,5,1.5,'#3a3d42');mrect(0,-1,94,5,1.5,'#33363b');mrect(0,-3,94,2,.5,'#8a8f98');mrect(90,-11,2.4,4,.5,'#ddd');
  mrect(-22,-11,26,18,3,'#6a7078');mpoly([[-14,-11],[-8,-11],[-16,-19],[-20,-17]],'#6a7078');
  wrect(8,3,34,11,5,'#8a5a2b');wpoly([[-22,-5],[-82,3],[-86,19],[-22,8]],'#8a5a2b');guard(-6,6,14,10,'#6a7078');
};
ST.lever=o=>{
  const Wd='#8a5a2b';
  wpoly([[-24,-6],[-84,2],[-88,19],[-24,8]],Wd);wrect(18,2,44,10,4,Wd);
  mrect(10,-4,o.sg?70:92,5,1.5,'#4a5058');mrect(10,3,o.sg?56:76,4,1.5,'#3a3f45');
  mrect(-24,-10,40,17,2,'#8a8f98');mrect(8,-13,10,3,.5,'#222');
  ctx.strokeStyle='#8a8f98';ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(8,6);ctx.lineTo(9,17);ctx.quadraticCurveTo(-6,25,-22,15);ctx.lineTo(-17,7);ctx.stroke();
  ln(-1,7,-3,13,1.6,'#111');
};
ST.dragunov=o=>{
  mrect(40,-2,66,4,1,'#1e2024');mrect(102,-4,12,8,1,'#1a1b1e');mrect(94,-10,3,8,.5,'#1a1a1a');
  wrect(24,-3,38,11,2,'#8a5a2b');mrect(-30,-9,60,15,2,'#2b2d31');mrect(-24,-8,50,3,1,'#3a3d42');
  mrect(-8,-24,52,10,4,'#1e1f22');disc(44,-19,5.5,'#4aa0ff');disc(-8,-19,4,'#2a6a9a');mrect(-2,-15,10,6,1,'#2a2c30');
  ctx.strokeStyle='#2a2c30';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-30,-4);ctx.lineTo(-86,-4);ctx.moveTo(-30,6);ctx.lineTo(-70,24);ctx.lineTo(-86,20);ctx.stroke();
  wrect(-74,-9,32,6,2,'#8a5a2b');mrect(-90,-8,6,28,1,'#1a1a1a');
  wpoly([[-16,6],[-3,6],[-8,28],[-22,26]],'#8a5a2b');guard(-5,5,16,9,'#2a2c30');mpoly([[4,6],[18,6],[22,28],[10,30]],'#26272b');
};
ST.bolt=o=>{
  const Wd=o.light?'#b08850':'#7a4a22';
  wpoly([[-32,-7],[-98,1],[-100,19],[-36,13],[-10,11],[64,8],[64,-2],[-10,-2]],Wd);
  mrect(-4,-4,110,5,1.5,'#6a7078');mrect(100,-10,3,7,.5,'#222');
  mrect(-30,-10,36,13,2,'#5a6068');ln(-16,-3,-28,10,2.2,'#8a8f98');disc(-28,11,3.5,'#8a8f98');mrect(8,-10,10,3,.5,'#222');
  if(o.lee) mrect(-16,10,22,13,2,shade(Wd,-.15));
  guard(-12,8,18,10,'#5a6068');
};
ST.sks=o=>{
  wpoly([[-32,-7],[-92,1],[-96,19],[-36,13],[-10,11],[56,8],[56,-3],[-10,-3]],'#8a5a2b');
  mrect(-4,-4,100,5,1.5,'#4a5058');mrect(36,-9,42,4,1.5,'#3a3f45');mrect(94,-10,3,7,.5,'#222');
  mrect(-30,-10,38,13,2,'#4a5058');mrect(-14,8,20,14,2,'#25262a');guard(-12,8,18,10,'#4a5058');
};
ST.tacsnipe=o=>{
  const C=o.c||'#2a2c30',Wd=o.wood?'#8a5a2b':null;
  if(Wd) wpoly([[-32,-7],[-96,0],[-100,20],[-36,13],[-6,11],[66,8],[66,-2],[-6,-2]],Wd);
  else{mpoly([[-32,-7],[-90,-3],[-96,20],[-68,20],[-56,10],[-36,12]],C);wrect(-80,-9,34,6,2,shade(C,.12));mpoly([[-6,-2],[70,-3],[70,9],[-6,12]],C)}
  mrect(66,-3,40,5,1.5,'#1e2024');mrect(100,-5,12,9,1,'#1a1b1e');
  mrect(-30,-10,38,13,2,'#33363b');ln(-18,-3,-30,10,2.2,'#8a8f98');disc(-30,11,3.5,'#8a8f98');
  if(o.scout){mrect(20,-20,34,9,4,'#1c1d20');disc(54,-15,4,'#4aa0ff')}
  else{mrect(-16,-30,66,14,6,'#1c1d20');mrect(12,-37,7,8,2,'#1c1d20');disc(50,-23,6.5,'#4aa0ff');disc(-16,-23,5,'#2a6a9a');mrect(-6,-17,6,7,1,'#2a2c30');mrect(34,-17,6,7,1,'#2a2c30')}
  mrect(-12,11,17,9,2,'#26282b');guard(-12,8,18,10,'#33363b');
  if(o.awp){ln(60,3,50,22,1.6,'#33363b');ln(66,3,76,22,1.6,'#33363b')}
};
ST.barrett=o=>{
  const C=o.tan?'#a89270':'#2a2c2f';
  mrect(-8,-5,90,8,2,C);for(let i=0;i<8;i++)ln(20+i*7,-4,20+i*7,2,.8,'rgba(0,0,0,.4)');
  mpoly([[80,-9],[96,-9],[98,-4],[98,5],[96,10],[80,10]],'#17181a');for(const x of[84,89,94])ln(x,-8,x,9,1,'rgba(255,255,255,.12)');
  mrect(-44,-14,56,21,3,C);mrect(-44,-14,56,5,2,shade(C,.15));
  mpoly([[-44,-8],[-84,-4],[-88,18],[-60,18],[-44,8]],o.tan?'#8a7658':'#2d3034');
  mrect(-30,-32,66,15,7,'#1c1d20');disc(36,-24.5,7.5,'#4aa0ff');disc(-30,-24.5,5.5,'#2a6a9a');mrect(-14,-19,7,7,1,'#2a2c30');mrect(14,-19,7,7,1,'#2a2c30');
  mrect(-30,6,26,15,2,'#33363b');
  ln(58,4,46,26,2,'#33363b');ln(66,4,78,26,2,'#33363b');
  ln(-70,16,-76,34,2,'#33363b');guard(-6,6,16,10,C);
};
ST.saw=o=>{
  const C=o.c||'#2f3a2a';
  mrect(-26,-12,58,17,2,C);mrect(-20,-17,30,6,2,shade(C,.1));
  mrect(32,-6,52,10,3,'#25272a');holes(36,80,-4,2,4.4,'#0d0d0e');mrect(82,-3,12,6,1,'#1a1b1e');mrect(90,-10,3,8,.5,'#1a1a1a');
  mrect(10,-20,3,8,1,'#1a1a1a');
  mpoly([[-26,-8],[-74,-4],[-78,16],[-26,8]],C);
  mpoly([[-16,6],[-3,6],[-8,26],[-22,24]],'#26282b');guard(-5,5,16,9,'#26282b');
  mrect(-2,6,32,26,3,'#3a4a2a');ctx.fillStyle='#c9a52b';for(let i=0;i<5;i++)ctx.fillRect(4+i*5,28,3,6);
  ln(70,4,60,28,1.8,'#2a2c30');ln(76,4,86,28,1.8,'#2a2c30');
};
ST.pkm=o=>{
  mrect(-30,-12,58,16,2,'#2b2d31');mrect(-20,-18,36,7,2,'#2f3236');
  mrect(28,-7,54,11,3,'#25272a');holes(32,78,-5,1,4.4,'#0d0d0e');mrect(80,-3,12,6,1,'#1a1b1e');
  mrect(-4,4,36,28,3,'#3c4a30');ctx.fillStyle='#c9a52b';for(let i=0;i<7;i++)ctx.fillRect(1+i*4.6,0,2.6,5);
  wpoly([[-30,-8],[-84,-3],[-88,17],[-52,17],[-30,8]],'#8a5a2b');
  wpoly([[-16,6],[-3,6],[-8,26],[-22,24]],'#8a5a2b');guard(-4,5,16,9,'#2b2d31');
  ln(66,4,56,28,1.8,'#2a2c30');ln(72,4,82,28,1.8,'#2a2c30');
};
ST.mg42=o=>{
  mrect(-28,-12,56,17,2,'#3a3d42');mrect(28,-9,64,14,3,'#33363b');holes(32,88,-7,3,3.8,'#0d0d0e');mrect(90,-5,9,8,1,'#1a1b1e');
  mrect(-14,-20,40,8,2,'#2f3236');ctx.fillStyle='#d6b13a';for(let i=0;i<9;i++)ctx.fillRect(-10+i*4.4,-26,3,7);
  mrect(-14,-26,40,3,1,'#555');
  wpoly([[-28,-8],[-80,-4],[-84,16],[-28,8]],'#3a2f26');wpoly([[-16,6],[-3,6],[-8,26],[-22,24]],'#3a2f26');guard(-4,5,16,9,'#3a3d42');
  ln(60,4,50,30,2,'#2a2c30');ln(68,4,78,30,2,'#2a2c30');
};
ST.m60=o=>{
  mrect(-28,-12,60,17,2,'#2b2d31');mrect(-20,-20,34,8,2,'#33363b');
  mrect(32,-6,56,10,3,'#25272a');mrect(86,-3,10,6,1,'#1a1b1e');mrect(30,-14,30,5,2,'#2a2c30');
  wpoly([[-28,-8],[-86,-3],[-90,17],[-28,8]],'#8a5a2b');wpoly([[-16,6],[-3,6],[-8,26],[-22,24]],'#8a5a2b');guard(-4,5,16,9,'#2b2d31');
  if(!o.bar){mrect(-4,6,30,22,3,'#3c4a30');ctx.fillStyle='#d6b13a';for(let i=0;i<4;i++)ctx.fillRect(2+i*5,24,3,7)}
  else mrect(-6,5,14,18,2,'#25262a');
  ln(70,4,60,28,1.8,'#2a2c30');ln(76,4,86,28,1.8,'#2a2c30');
};
ST.m2=o=>{
  mrect(-34,-20,84,34,4,'#2f3438');mrect(-30,-20,76,6,3,'#454b50');mrect(-34,-6,14,6,2,'#1a1c1e');
  mrect(50,-9,66,18,5,'#3a4046');for(let i=0;i<6;i++)ln(58+i*9,-8,58+i*9,8,1,'rgba(0,0,0,.45)');mrect(114,-6,10,12,2,'#1a1b1e');
  mrect(-40,-4,8,10,2,'#26282b');disc(-46,-6,7,'#222');disc(-46,10,7,'#222');
  mrect(-6,14,34,22,3,'#3c4a30');ctx.fillStyle='#d6b13a';for(let i=0;i<5;i++)ctx.fillRect(0+i*5.5,32,3.4,8);
  ln(72,10,60,40,2.4,'#2a2c30');ln(82,10,96,40,2.4,'#2a2c30');
};
ST.minigun=o=>{
  for(const [y,c] of [[-14,'#4a4e54'],[-7,'#3a3e44'],[0,'#555a60'],[7,'#3a3e44']]) mrect(-4,y,98,6,2,c);
  for(const x of[6,40,86]) mrect(x,-17,6,31,2,'#25272a');
  mrect(-52,-20,50,36,7,'#2c2f33');mrect(-30,-26,16,8,2,'#1f2225');disc(-18,-2,7,'#444');
  mpoly([[-36,16],[-20,16],[-24,40],[-40,40]],'#26282b');ln(-60,-4,-60,-22,3,'#2a2c30');
  ctx.fillStyle='#d6b13a';for(let i=0;i<9;i++)ctx.fillRect(-48+i*5.4,20+i*1.2,4,8);
  mrect(-52,16,54,5,2,'#555');
};
ST.crossbow=o=>{
  wpoly([[-50,-3],[40,-4],[40,6],[-30,10],[-50,14]],'#7a4a22');mrect(-8,-8,36,6,2,'#3a3d42');
  mrect(36,-32,6,66,3,'#33363b');ln(39,-31,-12,0,1.2,'#e8e8e8');ln(39,33,-12,0,1.2,'#e8e8e8');
  ln(-12,-3,o.harpoon?66:58,-3,o.harpoon?3.4:2.4,o.harpoon?'#cfd5dd':'#d8c08a');mpoly([[o.harpoon?66:58,-6],[o.harpoon?80:68,-3],[o.harpoon?66:58,0]],'#cfd5dd');
  guard(-14,6,12,9,'#33363b');
};
ST.bow=o=>{
  ctx.strokeStyle='#5a3a1c';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(20,-48);ctx.quadraticCurveTo(46,-10,16,0);ctx.quadraticCurveTo(46,10,20,48);ctx.stroke();
  ctx.strokeStyle='#8a5a2b';ctx.lineWidth=2.4;ctx.stroke();
  ln(20,-48,-14,0,1.1,'#eee');ln(20,48,-14,0,1.1,'#eee');
  ln(-14,0,66,0,2.4,'#d8c08a');mpoly([[66,-3.4],[78,0],[66,3.4]],'#cfd5dd');mpoly([[-14,0],[-20,-5],[-8,-2]],'#b33');mpoly([[-14,0],[-20,5],[-8,2]],'#b33');
  wrect(10,-5,14,10,3,'#4a2f18');
};
ST.flamer=o=>{
  mrect(-44,-14,22,48,9,'#a83232');mrect(-38,-20,10,8,2,'#8a8f98');mrect(-36,30,18,5,2,'#555');
  ctx.strokeStyle='#222';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-22,6);ctx.quadraticCurveTo(-10,24,2,8);ctx.stroke();
  mrect(-14,-8,24,15,3,'#2b2d31');mrect(10,-6,60,9,3,'#3a3d42');mrect(66,-9,10,15,2,'#1a1b1e');
  mpoly([[-6,6],[6,6],[2,28],[-12,26]],'#26282b');guard(0,5,12,9,'#2b2d31');
  ctx.fillStyle='#ffb040';ctx.beginPath();ctx.moveTo(76,-3);ctx.quadraticCurveTo(92,-12,102,-2);ctx.quadraticCurveTo(92,8,76,3);ctx.fill();
  ctx.fillStyle='#fff3a0';ctx.beginPath();ctx.moveTo(76,-1);ctx.quadraticCurveTo(86,-5,92,-1);ctx.quadraticCurveTo(86,3,76,1);ctx.fill();
};
ST.rpg=o=>{
  mrect(-56,-7,96,14,4,'#4a5238');mrect(-62,-10,10,20,3,'#33382a');wrect(0,-9,40,18,5,'#8a5a2b');
  mpoly([[40,-6],[84,-5],[96,0],[84,5],[40,6]],'#5a6446');mpoly([[84,-6],[104,0],[84,6]],'#3a3f2e');disc(98,0,2,'#222');
  mpoly([[-10,7],[2,7],[-2,28],[-16,26]],'#26282b');mpoly([[14,7],[24,7],[22,24],[12,24]],'#26282b');
  mrect(10,-17,16,10,2,'#26282b');disc(24,-12,3.4,'#4aa0ff');guard(-4,6,14,10,'#26282b');
};
ST.m79=o=>{
  mrect(0,-9,50,17,5,'#4a5238');mrect(46,-11,12,21,3,'#33382a');mrect(-6,-12,18,22,3,'#6a7078');
  ln(-2,-14,10,-14,2,'#222');mrect(20,-15,18,5,1,'#222');ln(22,-14,36,-22,1,'#aaa');
  wpoly([[-6,-6],[-66,2],[-70,18],[-6,10]],'#8a5a2b');wrect(10,2,26,9,4,'#8a5a2b');guard(-2,8,14,10,'#4a5238');
};
ST.bazooka=o=>{
  mrect(-70,-9,150,16,5,'#4e5740');mpoly([[-70,-12],[-86,-14],[-86,12],[-70,10]],'#3a4030');mrect(76,-12,12,22,3,'#33382a');
  mpoly([[-30,7],[-18,7],[-22,28],[-36,26]],'#26282b');mpoly([[20,7],[32,7],[30,24],[18,24]],'#26282b');
  mrect(-10,-17,22,8,2,'#26282b');mrect(40,-15,3,8,.5,'#222');wrect(-60,6,40,6,3,'#8a5a2b');
};
ST.rail=o=>{
  const g=o.plasma?'#7dff6a':o.col||'#6fe9ff',b=o.big?1.15:1;
  ctx.save();ctx.scale(b,b);
  mpoly([[-52,-8],[-10,-14],[56,-10],[64,-4],[56,4],[-10,8],[-52,10]],'#2a2f3a');
  mrect(-30,-18,40,8,3,'#1b1f27');
  mrect(56,-6,40,10,4,'#1a1d24');
  ctx.shadowColor=g;ctx.shadowBlur=8;ctx.fillStyle=g;
  for(let i=0;i<5;i++)ctx.fillRect(4+i*12,-5,5,9);ctx.fillRect(-40,-2,24,3);ctx.fillRect(86,-3,12,5);
  ctx.shadowBlur=0;
  mpoly([[-14,8],[-2,8],[-6,30],[-20,28]],'#1c1f26');mrect(-6,8,26,10,3,'#2f3542');guard(0,6,12,9,'#1c1f26');
  ctx.restore();
};
ST.lpistol=o=>{
  mpoly([[-24,-8],[24,-10],[34,-4],[34,4],[-24,6]],'#2a2f3a');mrect(24,-5,22,8,3,'#1a1d24');
  ctx.shadowColor='#ff4a4a';ctx.shadowBlur=6;ctx.fillStyle='#ff4a4a';ctx.fillRect(-10,-4,22,3);ctx.fillRect(40,-3,6,4);ctx.shadowBlur=0;
  mpoly([[-14,6],[0,6],[-4,32],[-20,30]],'#1c1f26');guard(0,5,10,9,'#1c1f26');
};
// --- mêlée ---
ST.knife=o=>{
  mrect(-38,-5,34,10,4,'#3a2a1c');ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=1;for(let x=-36;x<-6;x+=4){ctx.beginPath();ctx.moveTo(x,-5);ctx.lineTo(x+3,5);ctx.stroke()}
  mrect(-42,-6,6,12,3,'#8a8f98');mrect(-4,-12,5,24,2,'#8a8f98');
  mpoly([[1,-8],[52,-8],[74,2],[52,6],[1,6]],'#cfd5dd');ln(6,-3,58,-1,1,'rgba(0,0,0,.35)');ln(8,-6,54,-6,1,'rgba(255,255,255,.7)');
};
ST.blade=o=>{
  if(o.kat){
    mrect(-44,-4,40,8,3,'#1c1c20');ctx.strokeStyle='#d8d8d8';ctx.lineWidth=1;for(let x=-40;x<-6;x+=6){ctx.beginPath();ctx.moveTo(x,-4);ctx.lineTo(x+3,0);ctx.lineTo(x,4);ctx.stroke()}
    disc(-2,0,9,'#b8a050');disc(-2,0,5,'#222');
    mpoly([[6,-5],[100,-12],[112,-8],[100,-2],[6,3]],'#e6ecf4');ln(8,-1,100,-8,1.2,'rgba(0,0,0,.28)');ln(10,-4,100,-11,1,'rgba(255,255,255,.85)');
  } else if(o.mach){
    mrect(-36,-5,34,10,4,'#3a2a1c');disc(-37,0,4,'#222');
    mpoly([[0,-6],[60,-8],[86,-12],[88,-2],[62,8],[0,4]],'#bcc3cc');ln(2,-1,86,-8,1,'rgba(255,255,255,.6)');ln(4,3,64,6,1,'rgba(0,0,0,.35)');
  } else {
    mrect(-34,-4,30,8,3,'#222');mrect(-4,-10,5,20,2,'#8a8f98');
    mpoly([[1,-5],[46,-1],[1,5]],'#d6dce4');ln(2,0,44,-.5,1,'rgba(0,0,0,.3)');
  }
};
ST.axe=o=>{
  wrect(-46,-3,104,6,3,'#6b4a2a');mrect(-48,-4,8,8,3,'#4a3018');
  mpoly([[40,-8],[54,-10],[54,-30],[76,-38],[80,-8],[80,24],[56,30],[54,10],[40,8]],'#aab2bb');
  ln(78,-34,82,-8,1.4,'rgba(255,255,255,.7)');ln(82,-8,78,22,1.4,'rgba(255,255,255,.7)');
};
ST.bat=o=>{
  wpoly([[-44,-4],[10,-5],[56,-9],[62,-9],[62,9],[56,9],[10,5],[-44,4]],'#8a5a2b');mrect(-44,-5,22,10,4,'#222');
  ctx.fillStyle='#c6c9ce';for(let i=0;i<6;i++){const x=22+i*7;mpoly([[x,-9],[x+2,-16],[x+4,-9]],'#c6c9ce');mpoly([[x+1,9],[x+3,15],[x+5,9]],'#c6c9ce')}
};
ST.hammer=o=>{
  wrect(-46,-3,104,6,3,'#6b4a2a');mrect(-48,-4,8,8,3,'#4a3018');
  mrect(50,-16,20,32,3,'#7c838c');mrect(70,-12,8,24,2,'#9aa1aa');mpoly([[50,-8],[36,0],[50,8]],'#6a717a');
};
ST.chainsaw=o=>{
  mrect(-44,-16,48,34,7,'#d9822b');mrect(-44,-16,48,8,5,'#eaa24a');
  mrect(-30,-24,24,9,3,'#222');ctx.strokeStyle='#222';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-22,-16);ctx.lineTo(-22,-34);ctx.lineTo(-4,-34);ctx.lineTo(-4,-18);ctx.stroke();
  mrect(4,-9,78,17,6,'#7a7f86');mrect(4,-5,78,9,4,'#3a3d42');ctx.fillStyle='#ddd';for(let x=6;x<80;x+=4){ctx.fillRect(x,-11,2,3);ctx.fillRect(x,7,2,3)}
  mrect(-26,18,16,8,2,'#222');
};
ST.scythe=o=>{
  wrect(-50,-2,124,5,2,'#6b4a2a');mrect(-6,-7,6,10,2,'#444');mrect(24,-7,6,10,2,'#444');
  ctx.fillStyle='#cfd5dd';ctx.beginPath();ctx.moveTo(72,-2);ctx.quadraticCurveTo(88,-42,38,-48);ctx.quadraticCurveTo(70,-34,64,-2);ctx.closePath();ctx.fill();edge();
  ln(70,-6,52,-36,1.2,'rgba(255,255,255,.7)');
};
// --- table nom → style ---
const STY={
 'Beretta 92':['beretta'],'M1911':['m1911'],'CZ 75':['m1911',{sl:'#2f3338',gr:'#222428'}],'Tokarev TT-33':['m1911',{L:44}],
 'Glock 18':['glock',{L:48}],'USP':['glock',{L:50,sl:'#4a4d52'}],'Sig P226':['glock',{sl:'#8a8f98'}],'Five-seveN':['glock',{L:52,H:11}],'Makarov':['glock',{L:40,gr:'#3a2a1c'}],
 'Magnum 44':['revolver',{B:60,c:'#9aa0a8'}],
 'MAC-10':['uzi',{k:.8}],'Skorpion':['uzi',{k:.72,sl:'#3a3f36'}],'MP40':['uzi',{mp40:true,sl:'#2a2a26'}],
 'MP5':['mp5'],'MP7':['mp5',{k:.8,c:'#34383c'}],'UMP45':['mp5',{c:'#3a3d41'}],'Bizon':['mp5',{tube:true}],
 'P90':['p90'],'Vector':['p90',{v:1}],'Thompson M1928':['thompson'],'PPSh-41':['thompson',{ppsh:true}],
 'AKS-74U':['ak',{short:true,wood:'#26272b',mag:'#26272b'}],'AKM':['ak',{brake:true}],'AK-74':['ak',{wood:'#7a3a2a',mag:'#8a3a18',brake:true}],
 'AK-12':['ak',{wood:'#25262a',mag:'#25262a',rail:true}],'AN-94':['ak',{wood:'#2a2c30',mag:'#2a2c30',rail:true,brake:true}],'Galil':['ak',{wood:'#2a2c30',mag:'#2a2c30'}],'RPK':['ak',{rpk:true}],
 'M16A4':['ar',{long:true}],'HK416':['ar',{rail:true,optic:true}],'SCAR-H':['ar',{tan:true,rail:true}],'FN FAL':['ar',{wood:true,long:true,fal:true}],
 'H&K G3':['ar',{wood:true,long:true}],'G36':['ar',{poly:true}],'SIG 552':['ar',{short:true,rail:true}],
 'FAMAS':['bullpup',{famas:true}],'Steyr AUG':['bullpup',{aug:true}],'Tavor':['bullpup'],'QBZ-95':['bullpup',{c:'#3a4a36'}],
 'Mossberg 500':['pump',{syn:true}],'Winchester 1887':['lever',{sg:true}],'SPAS-12':['tact'],'Benelli M4':['tact'],'AA-12':['tact',{big:true}],
 'Saiga-12':['tact',{ak:true}],'Vepr-12':['tact',{ak:true}],'KSG':['tact',{twin:true}],'Double canon':['double'],
 'Dragunov SVD':['dragunov'],'M14 EBR':['tacsnipe',{c:'#2f3236',scout:true}],'SKS':['sks'],'Mosin-Nagant':['bolt'],'Kar98k':['bolt',{light:true}],'Lee-Enfield':['bolt',{lee:true}],
 'Winchester 94':['lever'],'Remington 700':['tacsnipe',{wood:true}],'Steyr Scout':['tacsnipe',{scout:true,c:'#3a3f36'}],'M24 SWS':['tacsnipe',{c:'#3a4a30'}],'AWP':['tacsnipe',{c:'#3f5a2a',awp:true}],
 'CheyTac M200':['barrett',{tan:true}],'PGM Hécate II':['barrett'],
 'Negev':['saw',{c:'#3a3d34'}],'MG4':['saw',{c:'#33363a'}],'Stoner 63':['saw',{c:'#2f3236'}],'PKM':['pkm'],'MG42':['mg42'],'M60':['m60'],'BAR M1918':['m60',{bar:true}],'Browning M2':['m2'],
 'Fusil harpon':['crossbow',{harpoon:true}],'Lance-grenades M79':['m79'],'RPG-7':['rpg'],'Bazooka':['bazooka'],'Railgun':['rail',{big:true}],'Fusil à plasma':['rail',{plasma:true}],'Pistolet laser':['lpistol'],
 'Poignard':['blade'],'Machette':['blade',{mach:true}],'Katana':['blade',{kat:true}],
};
const KIND_STYLE={pistol:'glock',revolver:'revolver',deagle:'deagle',nailgun:'nailgun',smg:'uzi',ak:'ak',m4:'ar',lmg:'saw',shotgun:'pump',dmr:'bolt',barrett:'barrett',minigun:'minigun',
  crossbow:'crossbow',bow:'bow',flamer:'flamer',launcher:'rpg',rail:'rail',laser:'rail',knife:'knife',blade:'blade',axe:'axe',bat:'bat',hammer:'hammer',chainsaw:'chainsaw',scythe:'scythe'};
ST.sawed=o=>{const Wd='#7a4a22';mrect(0,-9,48,7,2,'#2b2e33');mrect(0,-2,48,7,2,'#2b2e33');mrect(44,-9,5,14,1,'#444');mrect(-14,-9,16,14,3,'#2b2d31');wpoly([[-14,-6],[-34,4],[-30,18],[-14,8]],Wd);guard(-10,5,12,9,'#2b2d31')};
ST.legs=o=>{const Wd='#8a5a2b';mrect(-6,-5,66,5,1.5,'#2b2e33');mrect(-6,1,54,5,1.5,'#2b2e33');mrect(56,-9,2.4,4,.5,'#ddd');mrect(-22,-8,26,15,3,'#2b2d31');wrect(14,3,26,9,3,Wd);wpoly([[-22,-4],[-40,3],[-37,17],[-22,8]],Wd);guard(-12,7,14,10,'#2b2d31')};
STY["Mare's Leg"]=['legs'];STY['Canon scié']=['sawed'];STY['Ithaca Stakeout']=['legs'];STY['Milkor MGL']=['m79'];
function paintWeapon(wp){
  if(wp.hands){for(let h=0;h<2;h++){ctx.save();ctx.translate(0,h?26:-24);ctx.scale(.85,.85);paintWeapon(WEAPONS[wp.hi[h]]);ctx.restore()}return}
  const e=STY[wp.name]||[KIND_STYLE[wp.kind]];
  const o=Object.assign({},e[1]||{});
  if(wp.col&&!o.col) o.col=wp.col;
  ST[e[0]](o,wp);
}
const hexRGB=h=>{const n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255]};
function weaponMask(i){
  const key='m'+i;if(ICONS[key]) return ICONS[key];
  const c2=document.createElement('canvas');c2.width=ICON_W;c2.height=ICON_H;
  const prev=ctx;ctx=c2.getContext('2d',{willReadFrequently:true});
  ctx.scale(2,2);ctx.translate(OX/2,OY/2);ctx.lineJoin='round';
  MASK=true;try{paintWeapon(WEAPONS[i])}catch(e){}MASK=false;
  const d=ctx.getImageData(0,0,ICON_W,ICON_H).data;ctx=prev;
  const m=new Uint8Array(ICON_W*ICON_H);
  for(let k=0;k<m.length;k++){const q=k*4;m[k]=(d[q+3]>110&&d[q+1]>200&&d[q]<90&&d[q+2]<90)?1:0}
  return ICONS[key]=m;
}
const ramp=c=>{const b=hexRGB(c);return {b,d:b.map(v=>v*.22),l:b.map(v=>v+(255-v)*.62)}};
function recolor(i,skin,wood){
  const ic=weaponIcon(i),sk=SKINS.find(k=>k.id===skin),wd=WOODS.find(k=>k.id===wood);
  const rm=sk&&sk.c?ramp(sk.c):null,rw=wd&&wd.c?ramp(wd.c):null;
  if(!rm&&!rw) return ic;
  const m=weaponMask(i);
  const c2=document.createElement('canvas');c2.width=ICON_W;c2.height=ICON_H;
  const x2=c2.getContext('2d',{willReadFrequently:true});x2.drawImage(ic.cv,0,0);
  const im=x2.getImageData(0,0,ICON_W,ICON_H),d=im.data;
  for(let k=0;k<d.length;k+=4){
    if(d[k+3]<8) continue;
    const r=m[k>>2]?rw:rm; if(!r) continue;
    let l=(.299*d[k]+.587*d[k+1]+.114*d[k+2])/255;l=Math.max(0,Math.min(1,(l-.04)/.5));
    const t=l<.5?l*2:(l-.5)*2,a=l<.5?r.d:r.b,b=l<.5?r.b:r.l;
    d[k]=a[0]+(b[0]-a[0])*t;d[k+1]=a[1]+(b[1]-a[1])*t;d[k+2]=a[2]+(b[2]-a[2])*t;
  }
  x2.putImageData(im,0,0);
  return {cv:c2,bx:ic.bx,by:ic.by,bw:ic.bw,bh:ic.bh,mx:ic.mx};
}
function weaponIcon(i,skin,wood){
  if((skin&&skin!=='orig')||(wood&&wood!=='orig')){const k=i+'|'+skin+'|'+wood;return ICONS[k]||(ICONS[k]=recolor(i,skin,wood))}
  if(ICONS[i]) return ICONS[i];
  const c2=document.createElement('canvas');c2.width=ICON_W;c2.height=ICON_H;
  const prev=ctx;ctx=c2.getContext('2d',{willReadFrequently:true});
  ctx.scale(2,2);ctx.translate(OX/2,OY/2);ctx.lineJoin='round';
  try{paintWeapon(WEAPONS[i])}catch(e){console.error(WEAPONS[i].name,e)}
  const d=ctx.getImageData(0,0,ICON_W,ICON_H).data;ctx=prev;
  let x0=ICON_W,y0=ICON_H,x1=0,y1=0;
  for(let y=0;y<ICON_H;y++)for(let x=0;x<ICON_W;x++)if(d[(y*ICON_W+x)*4+3]>16){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  return ICONS[i]={cv:c2,bx:x0,by:y0,bw:Math.max(1,x1-x0+1),bh:Math.max(1,y1-y0+1),mx:(x1-OX)/2};
}
function drawWeaponIcon(i,cx,cy,mw,mh,skin,wood){
  const ic=weaponIcon(i,skin,wood),sc=Math.min(mw/ic.bw,mh/ic.bh,1.5),dw=ic.bw*sc,dh=ic.bh*sc;
  ctx.drawImage(ic.cv,ic.bx,ic.by,ic.bw,ic.bh,cx-dw/2,cy-dh/2,dw,dh);
}

function weaponCard(i,x,y,w,h){
  const wp=WEAPONS[i],own=isOwned(i),lvl=curLevel(),locked=!own&&lvl<wp.lvl,eq=!!wp.melee&&save.melee===wp.name;
  const hot=mouse.x>=x&&mouse.x<=x+w&&mouse.y>=y&&mouse.y<=y+h;
  menuRects.push({x,y,w,h,act:()=>buyWeapon(i)});
  panel(x,y,w,h,{top:locked?'#1a1614':hot?'#4a2018':'#2a2522',bot:locked?'#0e0c0b':hot?'#2a100c':'#15110f',edge:eq?'#4f7d3a':locked?'#2c2623':hot?'#e2542e':'#4a3a2e'});
  ctx.fillStyle='#0a0807';ctx.fillRect(x+9,y+9,w-18,90);ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.strokeRect(x+9,y+9,w-18,90);
  ctx.fillStyle='rgba(255,255,255,.025)';for(let ly=y+10;ly<y+98;ly+=4) ctx.fillRect(x+9,ly,w-18,1);
  ctx.save();ctx.beginPath();ctx.rect(x+8,y+8,w-16,92);ctx.clip();
  ctx.globalAlpha=locked?.3:1;drawWeaponIcon(i,x+w/2,y+54,w-30,80,skinOf(i),woodOf(i));ctx.globalAlpha=1;ctx.restore();
  if(locked) padlock(x+w/2,y+56,1.4,'#8a8178');
  ctx.textAlign='left';
  ctx.fillStyle=locked?'#6b625b':'#f2efe8';ctx.font='700 17px '+FONT;
  ctx.fillText(wp.name.toUpperCase(),x+10,y+122,w-20);
  ctx.font='500 14px '+FONT;ctx.fillStyle=locked?'#6b625b':'#b9b1a6';
  const rps=(1000/wp.rate).toFixed(1);
  ctx.fillText(tr('Dégâts').toUpperCase()+' '+Math.round(wp.dmg*wBoost(i))+(wp.melee?'':(wp.pellets>1?' x'+wp.pellets:'')+(wp.aoe?' '+tr('zone').toUpperCase():''))+'  ·  '+rps+' /'+tr('s').toUpperCase(),x+10,y+140,w-20);
  ctx.font='700 15px '+FONT;
  ctx.fillStyle=lvl>=wp.lvl?'#9fd18a':'#e2542e';
  ctx.fillText(tr('Niveau').toUpperCase()+' '+wp.lvl+(lvl>=wp.lvl?'  ✓':'  '+tr('requis').toUpperCase()),x+10,y+h-30,w-20);
  ctx.font='700 20px '+FONT;
  if(own){ctx.fillStyle=eq?'#9fd18a':'#b9b1a6';ctx.fillText(eq?'ÉQUIPÉE':'CLIC : AMÉLIORER',x+10,y+h-8,w-80);
    const ul=upLvl(i);for(let n=0;n<4;n++){ctx.fillStyle=n<ul?(n===3?'#ffd45a':'#e0a526'):'#3a322d';ctx.fillRect(x+w-62+n*13,y+h-18,10,10)}}
  else{ctx.fillStyle=locked?'#6b625b':save.bank>=wp.cost?'#e0a526':'#c9372c';ctx.fillText('$'+wp.cost,x+10,y+h-8)}
}
function drawWeaponDetail(){
  const i=upSel,wp=WEAPONS[i],lvl=upLvl(i),sk=skinOf(i),u=save.up[wp.name]||{};
  ctx.fillStyle='#000000cc';ctx.fillRect(0,0,W,H);ctx.textAlign='left';
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText(wp.name.toUpperCase(),43,61);ctx.fillStyle='#e9e1d0';ctx.fillText(wp.name.toUpperCase(),40,58);
  ctx.fillStyle='#8a8178';ctx.font='500 16px '+FONT;ctx.fillText(tr(wp.melee?'Arme de mêlée':'Arme à feu').toUpperCase()+'  ·  '+tr('Niveau').toUpperCase()+' '+wp.lvl,40,82);
  ctx.textAlign='right';ctx.fillStyle='#e0a526';ctx.font='700 30px '+FONT;ctx.fillText('$'+save.bank,W-40,50);ctx.textAlign='left';
  // visuel de l'arme avec sa couleur actuelle
  panel(40,100,420,200,{edge:sk==='gold'?'#c9a227':'#4a3a2e'});ctx.fillStyle='#0a0807';ctx.fillRect(50,110,400,180);ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.strokeRect(50,110,400,180);
  ctx.fillStyle='rgba(255,255,255,.025)';for(let ly=112;ly<288;ly+=4) ctx.fillRect(50,ly,400,1);
  drawWeaponIcon(i,250,200,380,150,sk,woodOf(i));
  if(sk==='gold') for(let n=0;n<3;n++){
    const a=Math.max(0,Math.sin(tick*.05+n*2.1)),sx=110+n*130,sy=150+((n*37)%70);
    ctx.fillStyle='rgba(255,245,200,'+a+')';ctx.fillRect(sx-7,sy-1,14,2);ctx.fillRect(sx-1,sy-7,2,14);
  }
  ctx.fillStyle='#d8d2c8';ctx.font='500 18px '+FONT;
  ctx.fillText(tr('Dégâts').toUpperCase()+'  '+wp.dmg+(lvl?'  →  '+Math.round(wp.dmg*wBoost(i)):'')+(wp.pellets>1?'  x'+wp.pellets:''),40,326);
  if(wp.melee){const eq=save.melee===wp.name;btn(menuRects,40,340,240,44,eq?'ÉQUIPÉE':'ÉQUIPER',{act:()=>{save.melee=wp.name;persist()},dim:eq,size:20})}
  else{ctx.fillStyle='#8a8178';ctx.font='500 14px '+FONT;ctx.fillText('Les armes à feu tombent uniquement dans les caisses larguées.',40,354)}
  // les 4 améliorations
  const dg=tr('Dégâts').toUpperCase(),names=[dg+' ×1.15',dg+' ×1.30',dg+' ×1.45',dg+' ×1.90  +  '+tr('Mod or').toUpperCase()+'  +  '+tr('Couleurs').toUpperCase()];
  for(let k=1;k<=4;k++){
    const y=100+(k-1)*62,done=k<=lvl,next=k===lvl+1,cost=upCost(i,k),gk=k===4;
    const hot=next&&mouse.x>=490&&mouse.x<=920&&mouse.y>=y&&mouse.y<=y+54;
    menuRects.push({x:490,y,w:430,h:54,act:next?buyUp:()=>{}});
    panel(490,y,430,54,{top:done?'#243a1e':hot?'#4a2018':next?'#2a2522':'#1a1614',bot:done?'#121e0f':hot?'#2a100c':'#15110f',edge:done?'#4f7d3a':next?(hot?'#e2542e':(gk?'#c9a227':'#4a3a2e')):'#2c2622',norivets:true,grunge:next||done?.9:.5});
    ctx.font='700 18px '+FONT;ctx.fillStyle=done?'#9fd18a':next?(gk?'#ffd45a':'#f2efe8'):'#6b625b';ctx.fillText(tr('Amélioration').toUpperCase()+' '+k,504,y+23);
    ctx.font='500 14px '+FONT;ctx.fillStyle=done?'#7fa070':next?'#b9b1a6':'#5a534c';ctx.fillText(names[k-1],504,y+43);
    ctx.textAlign='right';ctx.font='700 22px '+FONT;
    if(done){ctx.fillStyle='#9fd18a';ctx.fillText('✓',906,y+34)}
    else if(next){ctx.fillStyle=save.bank>=cost?'#e0a526':'#c9372c';ctx.fillText('$'+cost,906,y+34)}
    else{ctx.fillStyle='#4a443e';ctx.font='500 14px '+FONT;ctx.fillText('VERROUILLÉE',906,y+32)}
    ctx.textAlign='left';
  }
  // couleur de l'arme (débloquée au niveau 4), modifiable à tout moment
  ctx.fillStyle='#8a8178';ctx.font='500 15px '+FONT;
  ctx.fillText(lvl>=4?'COULEUR DU MÉTAL  ·  change à tout moment, ou reviens au skin d\'origine':'COULEUR ET BOIS  ·  débloqués avec l\'amélioration 4 (mod or + couleurs + bois)',40,420);
  const cur=u.skin||'orig';
  SKINS.forEach((k,n)=>{
    const w=n===0?112:62,x=n===0?40:40+112+8+(n-1)*70,y=430,on=lvl>=4&&cur===k.id,ok=lvl>=4;
    const hot=ok&&mouse.x>=x&&mouse.x<=x+w&&mouse.y>=y&&mouse.y<=y+44;
    menuRects.push({x,y,w,h:44,act:()=>setSkin(k.id)});
    ctx.fillStyle=k.c?(ok?k.c:shade(k.c,-.7)):'#2a2420';ctx.fillRect(x,y,w,44);
    if(k.c&&ok){const g=ctx.createLinearGradient(0,y,0,y+44);g.addColorStop(0,'rgba(255,255,255,.28)');g.addColorStop(1,'rgba(0,0,0,.35)');ctx.fillStyle=g;ctx.fillRect(x,y,w,44)}
    ctx.strokeStyle=on?'#fff':hot?'#e2542e':'#0008';ctx.lineWidth=on?3:2;ctx.strokeRect(x+1,y+1,w-2,42);
    ctx.fillStyle=k.id==='white'||k.id==='gold'||k.id==='cyan'||k.id==='orange'?'#1a1a1a':'#fff';ctx.globalAlpha=ok?1:.4;
    ctx.font='700 14px '+FONT;ctx.textAlign='center';ctx.fillText(k.n,x+w/2,y+27,w-8);ctx.globalAlpha=1;ctx.textAlign='left';
  });
  btn(menuRects,40,484,200,44,'RETOUR',{act:()=>state='upgrades'});
  // bois : d'origine, foncé ou clair (pour contraster avec la couleur du métal)
  const curW=u.wood||'orig',okW=lvl>=4;
  ctx.fillStyle='#8a8178';ctx.font='500 15px '+FONT;ctx.fillText('BOIS',262,512);
  WOODS.forEach((k,n)=>{
    const x=312+n*104,y=484,w=96,on=okW&&curW===k.id,hot=okW&&mouse.x>=x&&mouse.x<=x+w&&mouse.y>=y&&mouse.y<=y+44;
    menuRects.push({x,y,w,h:44,act:()=>setWood(k.id)});
    const base=k.c||'#8a5a2b';ctx.fillStyle=okW?base:shade(base,-.7);ctx.fillRect(x,y,w,44);
    if(okW){const g=ctx.createLinearGradient(0,y,0,y+44);g.addColorStop(0,'rgba(255,255,255,.25)');g.addColorStop(1,'rgba(0,0,0,.35)');ctx.fillStyle=g;ctx.fillRect(x,y,w,44)}
    ctx.strokeStyle=on?'#fff':hot?'#e2542e':'#0008';ctx.lineWidth=on?3:2;ctx.strokeRect(x+1,y+1,w-2,42);
    ctx.fillStyle=k.id==='light'?'#1a1a1a':'#fff';ctx.globalAlpha=okW?1:.4;ctx.font='700 14px '+FONT;ctx.textAlign='center';ctx.fillText(k.n,x+w/2,y+27,w-8);ctx.globalAlpha=1;ctx.textAlign='left';
  });
  if(msgT>0){msgT--;ctx.fillStyle='#e2542e';ctx.font='700 20px '+FONT;ctx.fillText(msg.toUpperCase(),650,512)}
}
const ACTIONS=[['left','ALLER À GAUCHE'],['right','ALLER À DROITE'],['jump','SAUTER'],['pick','RAMASSER UNE CAISSE'],['fire','TIRER / ATTAQUER  (en plus du clic)'],['full','PLEIN ÉCRAN'],['bonus','UTILISER LE BONUS EN STOCK'],['pause','FIGER LE JEU  (sans menu)'],['wnext','ARME SUIVANTE  (Nightmare · molette haut)'],['wprev','ARME PRÉCÉDENTE  (Nightmare · molette bas)']];
function drawKeys(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('TOUCHES',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('TOUCHES',40,58);
  ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,200,3);
  ctx.fillStyle='#8a8178';ctx.font='500 15px '+FONT;
  ctx.fillText('Clique sur une case puis appuie sur la nouvelle touche  ·  Échap : annuler  ·  Retour arrière : effacer la case',40,94);
  ACTIONS.forEach(([a,label],i)=>{
    const y=106+i*36;
    panel(40,y,880,33,{norivets:true,grunge:.7});
    ctx.fillStyle='#e8e0d0';ctx.font='700 20px '+FONT;ctx.textAlign='left';ctx.fillText(label,60,y+23,480);
    for(let sl=0;sl<2;sl++){
      const x=560+sl*180,w=164,on=!!bindListen&&bindListen.action===a&&bindListen.slot===sl,hot=mouse.x>=x&&mouse.x<=x+w&&mouse.y>=y+1&&mouse.y<=y+32;
      menuRects.push({x,y:y+1,w,h:31,act:()=>{bindListen={action:a,slot:sl}}});
      panel(x,y+1,w,31,{top:on?'#4a2018':hot?'#3a2e28':'#26211e',bot:on?'#2a100c':'#14100e',edge:on||hot?'#e2542e':'#4a3a2e',norivets:true});
      ctx.textAlign='center';
      if(on){ctx.globalAlpha=.6+.4*Math.sin(tick*.2);ctx.fillStyle='#ffd45a';ctx.font='700 13px '+FONT;ctx.fillText('APPUIE SUR UNE TOUCHE…',x+w/2,y+21,w-8);ctx.globalAlpha=1}
      else{ctx.fillStyle=KEYS[a][sl]?'#f2efe8':'#5a534c';ctx.font='700 18px '+FONT;ctx.fillText(keyName(KEYS[a][sl]),x+w/2,y+22)}
      ctx.textAlign='left';
    }
  });
  btn(menuRects,40,484,170,44,'RETOUR',{act:()=>{bindListen=null;state='options'},size:20});
  btn(menuRects,230,484,200,44,'RÉINITIALISER',{act:resetKeys,size:18});
  btn(menuRects,440,484,480,44,'MOLETTE : HAUT = '+(SET.wheelInv?'ARME PRÉCÉDENTE':'ARME SUIVANTE'),{act:()=>{SET.wheelInv=!SET.wheelInv;saveOpts()},size:16});
}
const SKIN_TONES=['#ffdbb4','#f1c27d','#e2b58c','#c68642','#a86b3c','#8d5524','#5c3a1e','#3b2314','#9bc47a','#7fb3d5','#b0b0b8','#d77a7a'];
const HAIRS=['#1a1210','#3a2418','#6a4528','#9a6a30','#d8b25a','#e8d8a8','#a8a8a8','#f0f0f0','#8a2a1c','#c84a2a','#2f5fa8','#a83a98'];
const CLOTH=['#1c1c20','#4a4f58','#9aa0a8','#e8e8e4','#8a2a1c','#d8a626','#d86a2a','#55733f','#3b4a2f','#2f5fa8','#6a3a8a','#8a5a30'];
const LOOK_ROWS=[['skin','PEAU',SKIN_TONES],['hair','CHEVEUX',HAIRS],['top','HAUT',CLOTH],['pants','PANTALON',CLOTH],['hat','COIFFE',CLOTH],['shoes','CHAUSSURES',CLOTH]];
function selBtn(x,y,w,h,label,on,act,size){
  const hot=mouse.x>=x&&mouse.x<=x+w&&mouse.y>=y&&mouse.y<=y+h;
  menuRects.push({x,y,w,h,act});
  panel(x,y,w,h,{top:on?'#4a2018':hot?'#3a2e28':'#26211e',bot:on?'#2a100c':'#14100e',edge:on?'#e2542e':hot?'#a8553a':'#4a3a2e',norivets:true});if(on) hazard(x+2,y+2,w-4,3);
  ctx.fillStyle=on?'#fff':'#b4aba0';ctx.font='700 '+(size||16)+'px '+FONT;ctx.textAlign='center';ctx.fillText(label,x+w/2,y+h/2+6,w-10);ctx.textAlign='left';
}
function drawShop(){
  ctx.fillStyle='#000000dc';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('BOUTIQUE DE FÊTES',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('BOUTIQUE DE FÊTES',40,58);
  ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,200,3);
  ctx.textAlign='right';ctx.fillStyle='#e0a526';ctx.font='700 26px '+FONT;ctx.fillText('$'+save.bank,W-40,48);ctx.textAlign='left';
  const L=save.look;
  selBtn(560,60,80,26,'HOMME',L.sex==='m',()=>{L.sex='m';persist()},13);selBtn(644,60,80,26,'FEMME',L.sex==='f',()=>{L.sex='f';persist()},13);
  selBtn(730,60,100,26,'NORMALE',L.build===0,()=>{L.build=0;persist()},13);selBtn(834,60,100,26,'EXAGÉRÉE',L.build===1,()=>{L.build=1;persist()},13);
  const list=OUTFITS.map((o,i)=>i).filter(i=>OUTFITS[i].pack===1),cw=290,gx=10,gy=8,rows=Math.ceil(OUTFITS.filter(o=>o.pack===1).length/3),ch=Math.max(76,Math.min(112,Math.floor((372-(rows-1)*gy)/rows))),dy=v=>Math.round(v*ch/112);   // la hauteur des cartes s'adapte : rien ne passe sous le bouton RETOUR
  const keep=[L.outfit,L.top,L.pants,L.hat,L.shoes];
  list.forEach((i,k)=>{
    const o=OUTFITS[i],x=40+(k%3)*(cw+gx),y=96+Math.floor(k/3)*(ch+gy),own=outOwned(i),eq=own&&keep[0]===i,nm=L.sex==='f'&&o.nf?o.nf:o.n;
    const hot=mouse.x>=x&&mouse.x<=x+cw&&mouse.y>=y&&mouse.y<=y+ch;
    menuRects.push({x,y,w:cw,h:ch,act:()=>{if(own){L.outfit=i;L.top=L.pants=L.hat=L.shoes=null;persist();sfx('click')}else buyOutfit(i)}});
    panel(x,y,cw,ch,{top:eq?'#2a3a22':hot?'#4a2018':'#2a2522',bot:eq?'#141c10':hot?'#2a100c':'#15110f',edge:eq?'#4f7d3a':hot?'#e2542e':'#4a3a2e',norivets:true});
    ctx.save();ctx.beginPath();ctx.rect(x+3,y+3,112,ch-6);ctx.clip();
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x+3,y+3,112,ch-6);
    const kp=prevO;prevO=i;L.outfit=i;L.top=L.pants=L.hat=L.shoes=null;menuP.x=x+58;menuP.y=GROUND;menuP.face=1;menuP.aim=.04;menuP.w=MENU_GUN;menuP.cd=0;menuP.swing=0;menuP.step=0;menuP.muz0=menuP.muz1=0;
    ctx.translate(x+58,y+ch-10);ctx.scale(ch/112*.98,ch/112*.98);ctx.translate(-(x+58),-GROUND);drawSoldier(menuP);ctx.restore();prevO=kp;
    L.outfit=keep[0];L.top=keep[1];L.pants=keep[2];L.hat=keep[3];L.shoes=keep[4];
    ctx.fillStyle='#f2efe8';ctx.font='700 17px '+FONT;ctx.fillText(nm,x+124,y+dy(28),cw-132);
    ctx.font='500 13px '+FONT;ctx.fillStyle='#b9b1a6';ctx.fillText(L.build===1?'Version exagérée':'Version normale',x+124,y+dy(48),cw-132);
    if(own){ctx.fillStyle=eq?'#9fd18a':'#d8d2c8';ctx.font='700 15px '+FONT;ctx.fillText(eq?'ÉQUIPÉE  ✓':'POSSÉDÉE',x+124,y+dy(72));ctx.fillStyle=hot?'#fff':'#a89f94';ctx.font='500 13px '+FONT;if(!eq) ctx.fillText('Clique pour équiper',x+124,y+dy(94),cw-132)}
    else{ctx.fillStyle=save.bank>=o.cost?'#ffd45a':'#e2542e';ctx.font='700 22px '+FONT;ctx.fillText('$'+o.cost,x+124,y+dy(78));ctx.fillStyle=hot?'#fff':'#a89f94';ctx.font='500 13px '+FONT;ctx.fillText(save.bank>=o.cost?'Clique pour acheter':'Pas assez d\'argent',x+124,y+dy(98),cw-132)}
  });
  btn(menuRects,40,484,170,44,'RETOUR',{act:()=>state='menu',size:20});
  if(msgT>0){msgT--;ctx.fillStyle='#ffd45a';ctx.font='700 20px '+FONT;ctx.fillText(msg.toUpperCase(),230,512)}
  else{ctx.fillStyle='#8a8178';ctx.font='500 14px '+FONT;ctx.fillText('Les tenues achetées se retrouvent dans PERSONNALISATION → FÊTES. Elles se jouent en version homme ou femme.',230,512)}
}
function buyOutfit(i){
  const o=OUTFITS[i],L=save.look;
  if(save.bank<o.cost){flash('Pas assez d\'argent');sfx('hurt');return}
  save.bank-=o.cost;save.skinsOwned[o.id]=true;
  L.outfit=i;L.top=L.pants=L.hat=L.shoes=null;prevO=-1;persist();sfx('buy');flash('Tenue débloquée !');
}
function drawCustom(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('PERSONNALISATION',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('PERSONNALISATION',40,58);
  ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,200,3);
  const L=save.look,ch=()=>persist();
  // aperçu
  panel(40,88,250,300,{grunge:.8,norivets:true});
  const g=ctx.createRadialGradient(165,280,10,165,280,170);g.addColorStop(0,'rgba(226,84,46,.25)');g.addColorStop(1,'rgba(226,84,46,0)');ctx.fillStyle=g;ctx.fillRect(41,89,248,298);
  menuP.x=150;menuP.y=GROUND;menuP.face=1;menuP.aim=.04;menuP.w=MENU_GUN;menuP.cd=0;menuP.swing=0;menuP.step=0;
  ctx.save();ctx.beginPath();ctx.rect(41,89,248,298);ctx.clip();
  const keepO=L.outfit,keepC=[L.top,L.pants,L.hat,L.shoes];if(prevO>=0&&!outOwned(prevO)){L.outfit=prevO;L.top=L.pants=L.hat=L.shoes=null}   // aperçu d'une tenue pas encore achetée
  ctx.translate(150,372);ctx.scale(2.4,2.4);ctx.translate(-150,-GROUND);drawSoldier(menuP);ctx.restore();
  L.outfit=keepO;[L.top,L.pants,L.hat,L.shoes]=keepC;
  ctx.textAlign='right';ctx.fillStyle='#e0a526';ctx.font='700 22px '+FONT;ctx.fillText('$'+save.bank,W-40,50);ctx.textAlign='left';
  if(prevO>=0&&!outOwned(prevO)){const o=OUTFITS[prevO];
    btn(menuRects,50,96,230,38,'ACHETER  $'+o.cost,{act:()=>buyOutfit(prevO),size:19,dim:save.bank<o.cost})}
  selBtn(40,396,122,34,'HOMME',L.sex==='m',()=>{L.sex='m';ch()},18);
  selBtn(168,396,122,34,'FEMME',L.sex==='f',()=>{L.sex='f';ch()},18);
  selBtn(40,436,122,34,'NORMALE',L.build===0,()=>{L.build=0;ch()},16);
  selBtn(168,436,122,34,'EXAGÉRÉE',L.build===1,()=>{L.build=1;ch()},16);
  // tenues
  ctx.fillStyle='#8a8178';ctx.font='500 14px '+FONT;ctx.fillText('TENUE  (version homme et femme)',310,92,240);
  selBtn(560,72,110,24,'CLASSIQUES',outPage===0,()=>outPage=0,12);selBtn(676,72,110,24,'FÊTES  ('+OUTFITS.filter((o,i)=>o.pack===1&&outOwned(i)).length+')',outPage===1,()=>outPage=1,12);selBtn(792,72,126,24,'ZOMBIES  ('+OUTFITS.filter(o=>o.pack===2).length+')',outPage===2,()=>outPage=2,12);
  if(outPage===1&&!OUTFITS.some((o,i)=>o.pack===1&&outOwned(i))){ctx.fillStyle='#8a8178';ctx.font='500 15px '+FONT;ctx.fillText('Aucune tenue de fêtes achetée pour l\'instant.',310,124);ctx.fillText('Va dans la BOUTIQUE (menu principal) pour en acheter.',310,146)}
  OUTFITS.map((o,i)=>i).filter(i=>(OUTFITS[i].pack||0)===outPage&&(!OUTFITS[i].pack||outOwned(i))).forEach((i,k)=>{
    const o=OUTFITS[i],x=310+(k%5)*123,y=100+Math.floor(k/5)*31,own=outOwned(i),nm=L.sex==='f'&&o.nf?o.nf:(o.s||o.n);
    selBtn(x,y,118,27,own?nm:nm+' $'+o.cost,own?L.outfit===i&&prevO<0:prevO===i,()=>{if(own){L.outfit=i;L.top=L.pants=L.hat=L.shoes=null;prevO=-1;ch()}else prevO=i},own?12:11);
  });
  // couleurs
  LOOK_ROWS.forEach(([k,label,pal],ri)=>{
    const y=196+ri*44;
    ctx.fillStyle='#e8e0d0';ctx.font='700 17px '+FONT;ctx.textAlign='left';ctx.fillText(label,310,y+23);
    pal.forEach((c,ci)=>{
      const x=420+ci*32,on=L[k]===c,hot=mouse.x>=x&&mouse.x<=x+28&&mouse.y>=y&&mouse.y<=y+34;
      menuRects.push({x,y,w:28,h:34,act:()=>{L[k]=c;ch()}});
      ctx.fillStyle='#000';ctx.fillRect(x-1,y-1,30,36);ctx.fillStyle=c;ctx.fillRect(x,y,28,34);
      if(on||hot){ctx.strokeStyle=on?'#fff':'#e2542e';ctx.lineWidth=2.5;ctx.strokeRect(x-1.5,y-1.5,31,37)}
    });
    selBtn(816,y,104,34,'ORIGINE',!L[k],()=>{L[k]=null;ch()},14);
  });
  btn(menuRects,40,484,170,44,'RETOUR',{act:()=>state='menu',size:20});
  if(msgT>0){msgT--;ctx.fillStyle='#ffd45a';ctx.font='700 18px '+FONT;ctx.fillText(msg.toUpperCase(),230,470)}
  ctx.fillStyle='#8a8178';ctx.font='500 14px '+FONT;ctx.fillText('Cosmétique uniquement. ORIGINE = couleur de la tenue choisie. Changer de tenue remet ses vêtements à l\'origine.',230,512);
}
function drawUpgrades(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);
  ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('ARSENAL',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('ARSENAL',40,58);
  ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,200,3);
  if(upShown===null) upShown=xpForLevel(curLevel());
  upShown=Math.min(save.xp,upShown+Math.max(.4,(save.xp-upShown)*.06));
  const info=drawXpBar(W-260,72,220,8,upShown,0),L=info.L,a=info.a,b=info.b;
  ctx.textAlign='right';ctx.fillStyle='#e0a526';ctx.font='700 30px '+FONT;ctx.fillText('$'+save.bank,W-40,44);
  ctx.fillStyle='#d8d2c8';ctx.font='500 15px '+FONT;ctx.fillText(tr('Niveau').toUpperCase()+' '+L+'   ·   '+Math.floor(upShown-a)+' / '+(b-a)+' XP',W-40,64);
  ctx.textAlign='left';
  // onglets par catégorie
  const tw=96,tg=4;
  CAT.forEach((c,ci)=>{
    const x=40+ci*(tw+tg),y=86,on=ci===upCat,hot=mouse.x>=x&&mouse.x<=x+tw&&mouse.y>=y&&mouse.y<=y+24;
    menuRects.push({x,y,w:tw,h:24,act:()=>{upCat=ci;upPage=0}});
    panel(x,y,tw,24,{top:on?'#4a2018':hot?'#3a2e28':'#26211e',bot:on?'#2a100c':'#14100e',edge:on?'#e2542e':'#4a3a2e',norivets:true});if(on) hazard(x+2,y+2,tw-4,3);
    ctx.fillStyle=on?'#fff':'#a89f94';ctx.font='700 14px '+FONT;ctx.textAlign='center';ctx.fillText(c,x+tw/2,y+17,tw-8);
  });
  ctx.textAlign='left';
  const list=[];WEAPONS.forEach((w,i)=>{if(w.cat===CAT[upCat]) list.push(i)});
  list.sort((p,q)=>WEAPONS[p].lvl-WEAPONS[q].lvl||p-q);
  const pages=Math.max(1,Math.ceil(list.length/5)); if(upPage>=pages) upPage=0;
  const cw=168,gap=10,x0=40;
  for(let k=0;k<5;k++){const idx=list[upPage*5+k]; if(idx!==undefined) weaponCard(idx,x0+k*(cw+gap),122,cw,200)}
  ctx.fillStyle='#8a8178';ctx.font='500 14px '+FONT;
  ctx.fillText(tr('Page').toUpperCase()+' '+(upPage+1)+' / '+pages+'   ·   '+list.length+' '+tr('armes').toUpperCase()+'   ·   '+tr(upCat===0?'Clique sur une arme possédée : améliorer, couleur, équiper':'Armes à feu : une fois débloquées, elles tombent dans les caisses'),40,344);
  if(pages>1){
    btn(menuRects,W-300,328,120,24,'<  PRÉC.',{act:()=>upPage=(upPage+pages-1)%pages,size:14});
    btn(menuRects,W-170,328,130,24,'SUIV.  >',{act:()=>upPage=(upPage+1)%pages,size:14});
  }
  ctx.fillStyle='#8a8178';ctx.font='500 15px '+FONT;ctx.fillText('PERSONNAGE  ·  la vitesse de déplacement ne s\'améliore pas',40,378);
  const hpMax=save.hpLvl>=MAX_UP;
  btn(menuRects,40,386,430,54,'VIE MAX  +20',{act:buyHp,sub:hpMax?tr('Niveau max').toUpperCase():tr('Niv.').toUpperCase()+' '+save.hpLvl+'  ·  '+(100+20*save.hpLvl)+' '+tr('PV')+'  ·  $'+hpCost(),dim:hpMax,size:20});
  btn(menuRects,40,462,200,46,'RETOUR',{act:()=>reset(true)});
  btn(menuRects,250,462,200,46,'BOOSTS',{act:()=>state='boosts'});
  ctx.fillStyle='#8a8178';ctx.font='500 14px '+FONT;
  ctx.fillText('Les améliorations se font uniquement ici, entre deux parties. Le niveau monte en tuant des zombies.',40,528);
  if(msgT>0){msgT--;ctx.fillStyle='#e2542e';ctx.font='700 20px '+FONT;ctx.fillText(msg.toUpperCase(),470,492)}
}

