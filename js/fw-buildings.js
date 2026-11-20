// ===== V0.74 : GRANDS IMMEUBLES — 560 x 560, 140 de hauteur d'étage, pièces cloisonnées et meublées, escalier monumental, toit à rebord =====
// Coque : texture à découpes (portes / fenêtres) ; intérieur : murs papier peint percés des mêmes ouvertures ; structure (planchers, marches, rebord) fusionnée ;
// pièces et meubles chargés seulement près du joueur. Collisions analytiques (murs avec portes et fenêtres, planchers à trappe, marches, toit).
const FW_FH=140,FW_TH=28,FW_DOORW=70,FW_DOORH=110,FW_NS=14,FW_WX0=36,FW_WX1=92,FW_WY0=10,FW_WY1=110;
function fwGeoNew(){return{p:[],n:[],c:[],u:[],i:[]}}
function fwGeoBox(G,x,y,z,sx,sy,sz,col){
  if(sx<=0||sy<=0||sz<=0) return;
  const hx=sx/2,hy=sy/2,hz=sz/2,c=new THREE.Color(col).multiplyScalar(G.k||1),F=[
    [1,0,0,[[hx,-hy,-hz],[hx,hy,-hz],[hx,hy,hz],[hx,-hy,hz]]],[-1,0,0,[[-hx,-hy,hz],[-hx,hy,hz],[-hx,hy,-hz],[-hx,-hy,-hz]]],
    [0,1,0,[[-hx,hy,-hz],[-hx,hy,hz],[hx,hy,hz],[hx,hy,-hz]]],[0,-1,0,[[-hx,-hy,hz],[-hx,-hy,-hz],[hx,-hy,-hz],[hx,-hy,hz]]],
    [0,0,1,[[-hx,-hy,hz],[hx,-hy,hz],[hx,hy,hz],[-hx,hy,hz]]],[0,0,-1,[[hx,-hy,-hz],[-hx,-hy,-hz],[-hx,hy,-hz],[hx,hy,-hz]]]];
  for(const [nx,ny,nz,q] of F){
    const b=G.p.length/3;
    for(const v of q){const wx=x+v[0],wy=y+v[1],wz=z+v[2];G.p.push(wx,wy,wz);G.n.push(nx,ny,nz);G.c.push(c.r,c.g,c.b);if(ny!==0) G.u.push(wx/60,wz/60);else if(nx!==0) G.u.push(wz/60,wy/60);else G.u.push(wx/60,wy/60)}
    G.i.push(b,b+1,b+2,b,b+2,b+3);
  }
}
function fwGeoMesh(G,mat){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(G.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(G.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(G.c,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(G.u,2));
  g.setIndex(new THREE.BufferAttribute(G.p.length/3>65000?new Uint32Array(G.i):new Uint16Array(G.i),1));
  g.computeBoundingSphere();return new THREE.Mesh(g,mat);
}
function fwGeoSlab(G,cx,cz,y,x0,x1,z0,z1,hole,th,col){
  const add=(a,b,c,d)=>{if(b-a>.5&&d-c>.5) fwGeoBox(G,cx+(a+b)/2,y-th/2,cz+(c+d)/2,b-a,th,d-c,col)};
  if(!hole){add(x0,x1,z0,z1);return}
  const [hx0,hx1,hz0,hz1]=hole;
  add(x0,hx0,z0,z1);add(hx1,x1,z0,z1);add(hx0,hx1,z0,hz0);add(hx0,hx1,hz1,z1);
}
// escalier monumental le long du mur nord : deux volées côte à côte (A pour les étages pairs, B pour les impairs), paliers aux deux bouts
function fwStairRect(B,g){const I=B.I,R0=-I+60,R1=I-60;return g%2===0?[R0,R1,I-104,I-52]:[R0,R1,I-52,I]}
function fwWallOpen(B,u,feet,hh){                                            // mur traversable ? (porte du rez-de-chaussée, fenêtres de chaque étage)
  const f=Math.floor((feet+1e-6)/FW_FH),yl=feet-f*FW_FH;if(yl>FW_WY0+2||f<0||f>=B.fl) return false;
  const x512=(u+B.half)/B.bw*512,ground=f%4===0;
  if(ground&&x512>=224&&x512<=288) return yl+hh<=FW_DOORH;
  for(let c=0;c<4;c++){if(ground&&(c===1||c===2)) continue;if(x512>=c*128+FW_WX0&&x512<=c*128+FW_WX1) return yl+hh<=FW_WY1}
  return false;
}
function fwBldPush(B,o,r,yy,hgt){
  const feet=yy===undefined?0:yy,hh=hgt||68,half=B.half,TH=FW_TH,cx=B.x,cz=B.z;
  if(feet>B.h+40||feet+hh<=0) return false;
  let hit=false;
  const slabs=[[cx-half,cz-half,cx+half,cz-half+TH,0],[cx-half,cz+half-TH,cx+half,cz+half,0],[cx-half,cz-half,cx-half+TH,cz+half,1],[cx+half-TH,cz-half,cx+half,cz+half,1]];
  const roof=feet>=B.h-1;
  for(const [x0,z0,x1,z1,ax] of slabs){
    let a0=x0,b0=z0,a1=x1,b1=z1;
    if(roof){const pe=FW_PE;if(ax===0){if(z0<cz) b1=z0+pe;else b0=z1-pe}else{if(x0<cx) a1=x0+pe;else a0=x1-pe}}
    const qx=Math.max(a0,Math.min(a1,o.px)),qz=Math.max(b0,Math.min(b1,o.pz)),dx=o.px-qx,dz=o.pz-qz,d2=dx*dx+dz*dz;
    if(d2>=r*r) continue;
    if(!roof){const u=ax===0?o.px-cx:o.pz-cz;if(fwWallOpen(B,u,feet,hh)) continue}
    else if(feet>=B.h+40) continue;
    hit=true;
    if(d2>1e-6){const d=Math.sqrt(d2),k=(r-d)/d;o.px+=dx*k;o.pz+=dz*k}
    else{const m=Math.min(o.px-a0,a1-o.px,o.pz-b0,b1-o.pz);if(m===o.px-a0) o.px=a0-r;else if(m===a1-o.px) o.px=a1+r;else if(m===o.pz-b0) o.pz=b0-r;else o.pz=b1+r}
  }
  return hit;
}
function fwBCells(B){const o=[];for(let a=Math.floor((B.x-B.half)/300);a<=Math.floor((B.x+B.half-.01)/300);a++) for(let b=Math.floor((B.z-B.half)/300);b<=Math.floor((B.z+B.half-.01)/300);b++) o.push(fwCellKey(a,b));return o}
function fwBldAt(x,z){return FW.bmap.get(fwCellKey(Math.floor(x/300),Math.floor(z/300)))}
function fwSupportY(x,z,y){
  let best=0;const B=fwBldAt(x,z);
  {const l=FW.grid.get(fwCellKey(Math.floor(x/300),Math.floor(z/300)));                  // on peut se poser sur les voitures, bennes et meubles bas
   if(l) for(const c of l){if(c.np||c.dead||c.h>y+16||c.h<=best||x<c.x0||x>c.x1||z<c.z0||z>c.z1) continue;
     if(c.kind==='c'||c.kind==='d'||(c.kind==='f'&&c.y0%140<6&&c.h-c.y0<=70)) best=c.h}}
  if(!B) return best;
  const dx=x-B.x,dz=z-B.z,ax=Math.abs(dx),az=Math.abs(dz),half=B.half,I=B.I,lim=y+16;
  if(ax>half||az>half) return best;
  const inner=ax<I&&az<I;
  for(let f=1;f<=B.fl;f++){
    const top=f*FW_FH;if(top>lim) break;
    if(f<B.fl){if(!inner) continue}
    const r=fwStairRect(B,f-1);
    if(dx>r[0]&&dx<r[1]&&dz>r[2]&&dz<r[3]) continue;
    if(f===B.fl&&(ax>half-FW_PE||az>half-FW_PE)) continue;
    if(top>best) best=top;
  }
  if(!inner){
    const u=ax>=az?dz:dx,x512=(u+half)/B.bw*512;
    for(let f=0;f<B.fl;f++){
      const top=f*FW_FH;if(top>lim) break;const ground=f%4===0;
      if(ground&&x512>=224&&x512<=288){if(top>best) best=top;continue}
      for(let c=0;c<4;c++){if(ground&&(c===1||c===2)) continue;if(x512>=c*128+FW_WX0&&x512<=c*128+FW_WX1){if(top+FW_WY0>best&&top+FW_WY0<=lim) best=top+FW_WY0;break}}
    }
  }
  if(inner) for(let g=0;g<B.fl;g++){
    const r=fwStairRect(B,g);
    if(dx>r[0]&&dx<r[1]&&dz>r[2]&&dz<r[3]){
      const t=g%2===0?(dx-r[0])/(r[1]-r[0]):(r[1]-dx)/(r[1]-r[0]),yy=g*FW_FH+FW_FH*(Math.floor(t*FW_NS)+1)/FW_NS;
      if(yy<=lim&&yy>best) best=yy;
    }
  }
  return best;
}
function fwCeilY(x,z,y){                                                        // dessous du plafond au-dessus de y (trappe d'escalier exceptée)
  const B=fwBldAt(x,z);if(!B) return 1e9;
  const dx=x-B.x,dz=z-B.z;if(Math.abs(dx)>=B.I||Math.abs(dz)>=B.I) return 1e9;
  for(let f=1;f<=B.fl;f++){const bot=f*FW_FH-10;if(bot<y+20) continue;const r=fwStairRect(B,f-1);if(dx>r[0]&&dx<r[1]&&dz>r[2]&&dz<r[3]) continue;return bot}
  return 1e9;
}
function fwSlabHit(x,z,y,hh){                                                  // le corps (pieds y, hauteur hh) est-il dans l'épaisseur d'un plancher (hors trappe) ?
  const B=fwBldAt(x,z);if(!B) return false;
  const dx=x-B.x,dz=z-B.z;if(Math.abs(dx)>=B.I||Math.abs(dz)>=B.I) return false;
  for(let f=1;f<=B.fl;f++){const top=f*FW_FH;if(y>=top-2||y+hh<=top-10) continue;const r=fwStairRect(B,f-1);if(dx>r[0]&&dx<r[1]&&dz>r[2]&&dz<r[3]) continue;return true}
  return false;
}
function fwBldSolid(B,x,z,y){
  const dx=x-B.x,dz=z-B.z,ax=Math.abs(dx),az=Math.abs(dz),half=B.half,I=B.I;
  if(ax>half||az>half||y<0) return false;
  if(y>=B.h){return y<B.h+40&&(ax>half-FW_PE||az>half-FW_PE)}
  if(ax<I&&az<I){
    const f=Math.ceil(y/FW_FH);if(f<1||f>B.fl) return false;
    if(y<f*FW_FH-6) return false;
    const r=fwStairRect(B,f-1);if(dx>r[0]&&dx<r[1]&&dz>r[2]&&dz<r[3]) return false;
    return true;
  }
  const f=Math.floor(y/FW_FH),yl=y-f*FW_FH,u=(ax>=az?dz:dx)+half,x512=u/B.bw*512,ground=f%4===0;
  if(ground){if(x512>=224&&x512<=288&&yl<FW_DOORH) return false}
  if(yl>=FW_WY0&&yl<=FW_WY1){for(let c=0;c<4;c++){if(ground&&(c===1||c===2)) continue;if(x512>=c*128+FW_WX0&&x512<=c*128+FW_WX1) return false}}
  return true;
}
// ----- matériaux : coque (extérieur) et murs intérieurs, avec les mêmes découpes -----
function fwAlphaTex(){
  return g3Tex('fwalpha',512,512,(g,w,h)=>{
    g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#000';
    const wy0=128-FW_WY1*128/FW_FH,wh=(FW_WY1-FW_WY0)*128/FW_FH;
    for(let r=0;r<4;r++){const bottom=r===3;for(let c=0;c<4;c++){if(bottom&&(c===1||c===2)) continue;g.fillRect(c*128+FW_WX0,r*128+wy0,FW_WX1-FW_WX0,wh)}
      if(bottom){const dh=FW_DOORH*128/FW_FH;g.fillRect(224,r*128+128-dh,64,dh)}}},true);
}
function fwShellMats(v,fl){
  const key='sh'+v+'_'+fl+(fwPbr()?'p':'');let m=FW.matC[key];if(m) return m;
  const t=g3Tex('fwsh'+v,512,512,(g,w,h)=>{
    let s=v*977+31;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
    const base=['#6a3c32','#55585f','#2e4258','#5a5040'][v%4],dk=['#4a2820','#3a3d44','#182636','#3e382c'][v%4];
    g.fillStyle=base;g.fillRect(0,0,w,h);
    if(v%4===0){g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=1;for(let y=0;y<h;y+=10){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();for(let x=((y/10)%2)*16;x<w;x+=32){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+10);g.stroke()}}}
    else{for(let i=0;i<500;i++){g.fillStyle='rgba('+(rnd()<.5?'255,255,255':'0,0,0')+','+(.03+rnd()*.05)+')';g.fillRect(rnd()*w,rnd()*h,1+rnd()*4,1+rnd()*4)}}
    const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,255,255,.08)');gr.addColorStop(1,'rgba(0,0,0,.25)');g.fillStyle=gr;g.fillRect(0,0,w,h);
    const k=128/FW_FH,wy0=128-FW_WY1*k,wh=(FW_WY1-FW_WY0)*k;
    for(let r=0;r<4;r++){const bottom=r===3;g.fillStyle=dk;g.fillRect(0,r*128,w,5);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(0,r*128+5,w,2);
      for(let c=0;c<4;c++){if(bottom&&(c===1||c===2)) continue;g.fillStyle=dk;g.fillRect(c*128+FW_WX0-7,r*128+wy0-6,FW_WX1-FW_WX0+14,wh+12);g.fillStyle='#8a8478';g.fillRect(c*128+FW_WX0-10,r*128+wy0+wh+4,FW_WX1-FW_WX0+20,7)}
      if(bottom){const dh=FW_DOORH*k;g.fillStyle=dk;g.fillRect(216,r*128+128-dh-8,80,dh+8);g.fillStyle='#a02a20';g.fillRect(198,r*128+128-dh-24,116,16)}}
    g.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<14;i++){g.fillRect(rnd()*w,rnd()*h,3+rnd()*3,30+rnd()*70)}
  },true);const c=t.clone();c.needsUpdate=true;c.repeat.set(1,fl/4);
  const a=fwAlphaTex().clone();a.needsUpdate=true;a.repeat.set(1,fl/4);
  m=fwPbr()?new THREE.MeshStandardMaterial({map:c,normalMap:fwShellNormal(v,fl),normalScale:new THREE.Vector2(1,1),roughness:.86,metalness:.02,envMapIntensity:.45,alphaMap:a,alphaTest:.5,side:THREE.FrontSide})
    :new THREE.MeshLambertMaterial({map:c,alphaMap:a,alphaTest:.5,side:THREE.FrontSide});FW.matC[key]=m;return m;
}
const FW_WP=[['#cdbd9c','#b8a684'],['#a9bfcc','#8aa3b4'],['#d2adad','#b58f8f'],['#b2c6a6','#93ab88'],['#dcd5c4','#c2baa8']];
function fwWallMat(v,fl,lit){
  const key='wm'+(v%5)+'_'+fl+'_'+(lit?1:0);let m=FW.matC[key];if(m) return m;
  const t0=g3Tex('fwwp'+(v%5),512,512,(g,w,h)=>{
    const [a,b]=FW_WP[v%5];g.fillStyle=a;g.fillRect(0,0,w,h);
    for(let r=0;r<4;r++){const y=r*128;
      g.fillStyle=b;for(let x=0;x<w;x+=24) g.fillRect(x,y,12,128);
      g.fillStyle='rgba(0,0,0,.12)';g.fillRect(0,y+70,w,58);
      g.fillStyle='#5a4228';g.fillRect(0,y+68,w,5);g.fillRect(0,y+112,w,16);g.fillStyle='rgba(255,255,255,.15)';g.fillRect(0,y+112,w,2);
      g.fillStyle='#f4efe6';g.fillRect(0,y,w,10);g.fillStyle='rgba(0,0,0,.12)';g.fillRect(0,y+10,w,3)}
    for(let i=0;i<400;i++){g.fillStyle='rgba(0,0,0,.04)';g.fillRect(Math.random()*w,Math.random()*h,2,2)}},true);
  const t=t0.clone();t.needsUpdate=true;t.repeat.set(1,fl/4);
  const a=fwAlphaTex().clone();a.needsUpdate=true;a.repeat.set(1,fl/4);
  m=new THREE.MeshLambertMaterial({map:t,color:0xa8a8a8,alphaMap:a,alphaTest:.5,emissiveMap:t,emissive:0xffffff,emissiveIntensity:lit?.3:.15,side:THREE.BackSide});FW.matC[key]=m;return m;
}
function fwFloorTex(){
  return g3Tex('fwfloor2',128,128,(g,w,h)=>{g.fillStyle='#9c9c9c';g.fillRect(0,0,w,h);
    for(let i=0;i<8;i++){g.fillStyle=i%2?'rgba(0,0,0,.10)':'rgba(255,255,255,.12)';g.fillRect(0,i*16,w,16);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,i*16,w,1.5);
      for(let k=0;k<2;k++) g.fillRect(((i*37+k*64)%128),i*16,1.5,16)}
    for(let i=0;i<300;i++){g.fillStyle='rgba(0,0,0,.05)';g.fillRect(Math.random()*w,Math.random()*h,2,1)}},true);
}
function fwTower(sc,rnd,cx,cz,bw,fl,v){
  const T=THREE,h=fl*FW_FH,half=bw/2,TH=FW_TH,I=half-TH,B={x:cx,z:cz,bw,half,I,fl,h};
  const shell=new T.Mesh(G3.geo.box,fwShellMats(v,fl));shell.castShadow=true;shell.receiveShadow=true;shell.material.shadowSide=T.FrontSide;shell.scale.set(bw,h,bw);shell.position.set(cx,h/2,cz);sc.add(shell);
  const lit=rnd()<.45,inner=new T.Mesh(G3.geo.box,fwWallMat(v,fl,lit));inner.receiveShadow=true;inner.scale.set(2*(I+1),h-2,2*(I+1));inner.position.set(cx,h/2,cz);sc.add(inner);
  const G=fwGeoNew();G.k=.85;const floorC=0x4a3a2c,slabC=0x56524c,stepC=0x6a6258,roofC=0x34343a;
  fwGeoBox(G,cx,2,cz,2*I,4,2*I,floorC);
  for(let f=1;f<=fl;f++){
    const roof=f===fl,hr=fwStairRect(B,f-1);
    if(roof) fwGeoSlab(G,cx,cz,f*FW_FH+1,-half,half,-half,half,hr,8,roofC);
    else fwGeoSlab(G,cx,cz,f*FW_FH,-I,I,-I,I,hr,8,[0x5a4a3c,0x48505a,0x66584a,0x4a4238][(f+v)%4]);
  }
  for(let g=0;g<fl;g++){
    const r=fwStairRect(B,g),L=r[1]-r[0];
    for(let s=0;s<FW_NS;s++){
      const u0=g%2===0?r[0]+L*s/FW_NS:r[1]-L*(s+1)/FW_NS,top=g*FW_FH+FW_FH*(s+1)/FW_NS,hh=top-g*FW_FH;
      fwGeoBox(G,cx+u0+L/(2*FW_NS),g*FW_FH+hh/2,cz+(r[2]+r[3])/2,L/FW_NS,hh,r[3]-r[2],stepC);
      if(g>0||true){fwGeoBox(G,cx+u0+L/(2*FW_NS),top+16,cz+r[2]+1.5,L/FW_NS,2,3,0x2a2a30)}      // main courante (fine barre)
    }
  }
  const pe=FW_PE,ph=40,y=h+1+ph/2;
  fwGeoBox(G,cx,y,cz-half+pe/2,bw,ph,pe,roofC);fwGeoBox(G,cx,y,cz+half-pe/2,bw,ph,pe,roofC);
  fwGeoBox(G,cx-half+pe/2,y,cz,pe,ph,bw-2*pe,roofC);fwGeoBox(G,cx+half-pe/2,y,cz,pe,ph,bw-2*pe,roofC);
  for(let k=0;k<4;k++){const px=cx+(rnd()-.5)*(bw-160),pz=cz+(rnd()-.5)*(bw-160);fwGeoBox(G,px,h+1+16,pz,40+rnd()*30,32,34+rnd()*20,0x3a3c42)}   // blocs techniques sur le toit
  const Gb=fwGeoNew();fwTowerDetail(G,Gb,sc,rnd,B,v);
  const sm=fwGeoMesh(G,FW.vcMat||(FW.vcMat=fwPbr()?new T.MeshStandardMaterial({vertexColors:true,map:fwFloorTex(),normalMap:fwFloorNormal(),roughness:.8,metalness:.02,envMapIntensity:.35}):new T.MeshLambertMaterial({vertexColors:true,map:fwFloorTex()})));sm.castShadow=true;sm.receiveShadow=true;sc.add(sm);
  if(Gb.p.length){const gm=fwGeoMesh(Gb,FW.vcBasic||(FW.vcBasic=new T.MeshBasicMaterial({vertexColors:true,toneMapped:false})));sc.add(gm)}
  for(const k of fwBCells(B)) FW.bmap.set(k,B);
  FW.maxH=Math.max(FW.maxH,h+41);
  return B;
}
