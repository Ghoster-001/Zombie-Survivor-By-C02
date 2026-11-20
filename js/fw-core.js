// ===== V0.61 : MONDE LIBRE 3D — première / troisième personne, déplacement libre (avant, arrière, côtés) dans une ville ouverte =====
// Réutilise : armes, munitions, caisses, boosts, vagues, XP / crédits du compte. Le jeu 2D reste inchangé.
const FW={on:false,built:false,scene:null,cam:null,tp:false,x:0,z:0,y:0,vy:0,yaw:0,pitch:0,bob:0,shk:0,hurtFl:0,hitM:0,recoil:0,lock:false,lockT:0,
  zs:[],pk:[],tr:[],pt:[],ex:[],grid:new Map(),bmap:new Map(),furnList:[],furT:0,vcBasic:null,inMats:[],maxH:0,yv:0,gnd:true,lamps:[],fires:[],bl:[],bld:[],mm:null,bN:0,bSeed:0,crouch:0,ads:false,adsK:0,adsM:false,lmb:false,scopeK:0,zi:1,zoom:1,air:0,tDrop:0,vxA:0,vzA:0,path:null,planeM:null,spec:-1,pend:null,worldSeed:7,dying:[],sw:null,swapT:0,slashFx:0,queue:[],spT:0,brk:0,crT:0,suT:0,model:null,vm:null,fl:null,flOn:true,fired:false,
  rw:0,rh:0,pl:[],plT:0,sens:.0022,gpOn:false,tc:{mv:null,lk:null,b:{}},stars:null,moon:null,matC:{},grp:null,vmLast:-1,swingV:0,boss:null,tmp:null};
let FW_N=7,FW_LIM=3250;const FW_BLK=600,FW_RD=300,FW_P=900,FW_EYE=72,FW_R=18;
const fwRng=seed=>{let a=(seed|0)||123456789;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};   // générateur déterministe : tous les joueurs construisent LA MÊME ville

function fwCellKey(cx,cz){return (cx+20)*64+(cz+20)}
function fwAddCol(x0,z0,x1,z1,h,kind,y0,nopush,noray){
  const c={x0,z0,x1,z1,h,kind:kind||'b',y0:y0||0,np:!!nopush,nr:!!noray};
  for(let cx=Math.floor(x0/300);cx<=Math.floor((x1-.01)/300);cx++) for(let cz=Math.floor(z0/300);cz<=Math.floor((z1-.01)/300);cz++){
    const k=fwCellKey(cx,cz);let l=FW.grid.get(k);if(!l){l=[];FW.grid.set(k,l)}l.push(c)}
  return c;
}
function fwPush(o,r,yy,hgt){                                                  // pousse le cercle (o.px,o.pz) hors des obstacles ; renvoie vrai si touché (3 passes : coins et obstacles voisins)
  let hit=false;for(let it=0;it<3;it++){if(!fwPush1(o,r,yy,hgt)) break;hit=true}return hit}
function fwPush1(o,r,yy,hgt){
  let hit=false;
  for(let cx=Math.floor((o.px-r)/300);cx<=Math.floor((o.px+r)/300);cx++) for(let cz=Math.floor((o.pz-r)/300);cz<=Math.floor((o.pz+r)/300);cz++){
    {const BB=FW.bmap.get(fwCellKey(cx,cz));if(BB&&fwBldPush(BB,o,r,yy,hgt)) hit=true}
    const l=FW.grid.get(fwCellKey(cx,cz));if(!l) continue;
    for(const c of l){
      if(c.np||c.dead||(yy!==undefined&&(yy>=c.h||yy+(hgt||80)<=c.y0))) continue;
      const qx=Math.max(c.x0,Math.min(c.x1,o.px)),qz=Math.max(c.z0,Math.min(c.z1,o.pz)),dx=o.px-qx,dz=o.pz-qz,d2=dx*dx+dz*dz;
      if(d2>=r*r) continue;hit=true;
      if(d2>1e-6){const d=Math.sqrt(d2),k=(r-d)/d;o.px+=dx*k;o.pz+=dz*k}
      else{const a=o.px-c.x0,b=c.x1-o.px,e=o.pz-c.z0,f=c.z1-o.pz,m=Math.min(a,b,e,f);if(m===a) o.px=c.x0-r;else if(m===b) o.px=c.x1+r;else if(m===e) o.pz=c.z0-r;else o.pz=c.z1+r}
    }
  }
  return hit;
}
function fwSolid(x,z,y){const k=fwCellKey(Math.floor(x/300),Math.floor(z/300)),l=FW.grid.get(k);if(l) for(const c of l) if(!c.nr&&!c.dead&&x>=c.x0&&x<=c.x1&&z>=c.z0&&z<=c.z1&&y<c.h&&y>=c.y0) return true;const B=FW.bmap.get(k);return !!B&&fwBldSolid(B,x,z,y)}
function fwFacade(v,fl){
  const key=v+'_'+fl;let m=FW.matC[key];if(m) return m;
  const mk=em=>{const t=g3Tex('fwt2'+v+(em?'e':'w'),512,512,(g,w,h)=>{
    let s=v*977+13;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
    const base=['#6a3c32','#55585f','#26384c','#5a5040'][v%4],dk=['#4a2820','#3a3d44','#182636','#3e382c'][v%4];
    g.fillStyle=em?'#000':base;g.fillRect(0,0,w,h);
    if(!em){
      if(v%4===0){g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=1;for(let y=0;y<h;y+=10){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();for(let x=((y/10)%2)*16;x<w;x+=32){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+10);g.stroke()}}}
      else{for(let i=0;i<500;i++){g.fillStyle='rgba('+(rnd()<.5?'255,255,255':'0,0,0')+','+(.03+rnd()*.05)+')';g.fillRect(rnd()*w,rnd()*h,1+rnd()*4,1+rnd()*4)}}
      const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,255,255,.08)');gr.addColorStop(.5,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.28)');g.fillStyle=gr;g.fillRect(0,0,w,h);
      g.fillStyle=dk;g.fillRect(0,h-14,w,14);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(0,h-16,w,2);   // corniche d'étage
    }
    for(let r=0;r<4;r++) for(let c=0;c<4;c++){
      const x=c*128+22,y=r*128+22,ww=84,wh=78,lit=rnd()<.34,warm=rnd()<.78,blind=rnd()<.4,cur=rnd()<.25;
      if(em){if(lit){g.fillStyle=warm?'#ffcf7a':'#a8d4ff';g.fillRect(x+4,y+4,ww-8,wh-8)}continue}
      g.fillStyle=dk;g.fillRect(x-6,y-6,ww+12,wh+12);                                                // cadre
      const gg=g.createLinearGradient(x,y,x+ww,y+wh);
      if(lit){gg.addColorStop(0,warm?'#ffe0a0':'#c8e4ff');gg.addColorStop(1,warm?'#e0a050':'#78a8d8')}else{gg.addColorStop(0,'#1c2634');gg.addColorStop(1,'#080c12')}
      g.fillStyle=gg;g.fillRect(x,y,ww,wh);
      if(lit&&blind){g.fillStyle='rgba(60,30,10,.35)';for(let k=0;k<8;k++) g.fillRect(x,y+k*10,ww,3)}
      if(lit&&cur){g.fillStyle='rgba(150,40,40,.55)';g.fillRect(x,y,14,wh);g.fillRect(x+ww-14,y,14,wh)}
      g.fillStyle='rgba(0,0,0,.55)';g.fillRect(x+ww/2-1.5,y,3,wh);g.fillRect(x,y+wh/2-1.5,ww,3);   // croisillons
      if(!lit){g.fillStyle='rgba(180,210,255,.10)';g.beginPath();g.moveTo(x,y+wh);g.lineTo(x+ww*.5,y);g.lineTo(x+ww*.75,y);g.lineTo(x+ww*.25,y+wh);g.fill()}   // reflet
      g.fillStyle='#8a8478';g.fillRect(x-8,y+wh+6,ww+16,5);                                         // appui
      if(rnd()<.07){g.fillStyle='#8c8f94';g.fillRect(x+8,y+wh+11,ww-16,22);g.fillStyle='#4a4c50';g.fillRect(x+12,y+wh+15,ww-24,14)}   // climatiseur
    }
    if(!em){g.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<14;i++){const x=rnd()*w,y=rnd()*h;g.fillRect(x,y,3+rnd()*3,30+rnd()*70)}}   // coulures
  },true);const c=t.clone();c.needsUpdate=true;c.repeat.set(1,fl/4);return c};
  m=new THREE.MeshLambertMaterial({map:mk(false),emissive:0xffffff,emissiveMap:mk(true),emissiveIntensity:.95});FW.matC[key]=m;return m;
}
function fwTex(key,w,h,draw,rx,ry){const t=g3Tex(key,w,h,draw,true);if(rx){const c=t.clone();c.needsUpdate=true;c.repeat.set(rx,ry);return c}return t}
