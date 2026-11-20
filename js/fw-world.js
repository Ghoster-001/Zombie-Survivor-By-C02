// ===== V0.75 : REMASTER GRAPHIQUE — ciel de crépuscule, soleil rasant et ombres, reflets, bloom, étalonnage, enseignes néon, murs épais =====
const FW_SUN={az:-2.2,el:.3},FW_PE=22;
function fwSunVec(){const c=Math.cos(FW_SUN.el);return[Math.cos(FW_SUN.az)*c,Math.sin(FW_SUN.el),Math.sin(FW_SUN.az)*c]}
function fwSkyTex(){
  return g3Tex('fwsky3',2048,1024,(g,w,h)=>{
    const gr=g.createLinearGradient(0,0,0,h);
    [[0,'#060a24'],[.2,'#16225a'],[.33,'#4a3f86'],[.41,'#b8627a'],[.46,'#f0885a'],[.495,'#ffc47c'],[.505,'#4a3440'],[.6,'#241e2c'],[1,'#14121a']].forEach(([o,c])=>gr.addColorStop(o,c));
    g.fillStyle=gr;g.fillRect(0,0,w,h);
    let s=777;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
    for(let i=0;i<900;i++){const y=rnd()*h*.34,a=.2+rnd()*.6*(1-y/(h*.34));g.fillStyle='rgba(255,255,255,'+a+')';const r=rnd()<.06?1.8:.9;g.fillRect(rnd()*w,y,r,r)}
    const su=(((Math.PI-FW_SUN.az)/(2*Math.PI))%1+1)%1,sx=su*w,sy=(.5-FW_SUN.el/Math.PI)*h;
    for(let i=0;i<260;i++){
      const x=rnd()*w,y=h*(.25+rnd()*.21),rw=70+rnd()*220,rh=7+rnd()*17;
      let dx=Math.abs(x-sx);dx=Math.min(dx,w-dx);const lit=Math.max(0,1-dx/(w*.26))*(1-Math.abs(y/h-.45)*2.2);
      const R=Math.round(86+lit*170),G=Math.round(66+lit*84),B=Math.round(118-lit*50);
      g.fillStyle='rgba('+R+','+G+','+B+','+(.09+rnd()*.14)+')';g.beginPath();g.ellipse(x,y,rw,rh,0,0,7);g.fill();
    }
    for(const ox of[-w,0,w]){
      for(const [r,c] of[[640,'rgba(255,130,60,.20)'],[300,'rgba(255,165,80,.32)'],[120,'rgba(255,215,140,.65)']]){const rg=g.createRadialGradient(sx+ox,sy,0,sx+ox,sy,r);rg.addColorStop(0,c);rg.addColorStop(1,'rgba(255,140,60,0)');g.fillStyle=rg;g.fillRect(sx+ox-r,sy-r,2*r,2*r)}
      g.fillStyle='#fff4d0';g.beginPath();g.arc(sx+ox,sy,22,0,7);g.fill();
    }
    const mx=(sx+w/2)%w,my=h*.16;g.fillStyle='rgba(225,232,255,.92)';g.beginPath();g.arc(mx,my,15,0,7);g.fill();const rg=g.createRadialGradient(mx,my,8,mx,my,90);rg.addColorStop(0,'rgba(160,180,255,.32)');rg.addColorStop(1,'rgba(160,180,255,0)');g.fillStyle=rg;g.fillRect(mx-90,my-90,180,180);
  },false);
}
function fwAtmos(sc){
  const T=THREE,tex=fwSkyTex();
  const dome=new T.Mesh(new T.SphereGeometry(3500,48,24),new T.MeshBasicMaterial({map:tex,side:T.BackSide,fog:false,depthWrite:false,toneMapped:false}));dome.renderOrder=-10;dome.frustumCulled=false;sc.add(dome);FW.sky=dome;
  sc.background=new T.Color(0x14101c);sc.fog=new T.FogExp2(0x74586a,.00040);
  const [sx,sy,sz]=fwSunVec();
  sc.add(new T.HemisphereLight(0x8c9cdc,0x503a3e,.6));
  const sun=new T.DirectionalLight(0xffa862,1.5);FW.sunV=[sx,sy,sz];sun.position.set(sx*1800,sy*1800,sz*1800);sc.add(sun);sc.add(sun.target);FW.sun=sun;
  const sh=sun.shadow,smap=FXF.refl?2048:1024;sh.mapSize.set(smap,smap);const c=sh.camera;c.left=-800;c.right=800;c.top=800;c.bottom=-800;c.near=50;c.far=4600;sh.bias=-.0005;sh.normalBias=1.4;
  const fill=new T.DirectionalLight(0x5a6cc8,.32);fill.position.set(-sx*900,700,-sz*900);sc.add(fill);
  if(FXF.refl) try{const es=new T.Scene();es.add(new T.Mesh(new T.SphereGeometry(100,32,16),new T.MeshBasicMaterial({map:tex,side:T.BackSide})));const pm=new T.PMREMGenerator(G3.r);FW.env=pm.fromScene(es,.04).texture;sc.environment=FW.env;pm.dispose()}catch(e){FW.env=null}
  // poussière et braises dans l'air
  const N=260,pos=new Float32Array(N*3),seed=[];for(let i=0;i<N;i++){seed.push([Math.random()*1000,Math.random()*320,Math.random()*1000,.2+Math.random()*.8,Math.random()*6.28])}
  const gg=new T.BufferGeometry();gg.setAttribute('position',new T.BufferAttribute(pos,3));
  const dust=new T.Points(gg,new T.PointsMaterial({color:0xffd8a8,size:2.6,transparent:true,opacity:.5,depthWrite:false,fog:false}));dust.frustumCulled=false;sc.add(dust);FW.dust=dust;FW.dustS=seed;
}
function fwDustTick(SX,SY,SZ){
  const d=FW.dust;if(!d) return;const p=d.geometry.attributes.position.array,S=FW.dustS,t=tick*.012;
  for(let i=0;i<S.length;i++){const s=S[i];p[i*3]=((s[0]+t*14*s[3]+Math.sin(t*s[3]+s[4])*20)%1000+1000)%1000-500;p[i*3+1]=((s[1]+t*6*s[3])%320+320)%320;p[i*3+2]=((s[2]+t*9*s[3])%1000+1000)%1000-500}
  d.geometry.attributes.position.needsUpdate=true;d.position.set(SX,Math.max(0,SY-80),SZ);d.visible=!!FXF.fog&&SY<400;
}
// ----- post-traitement : bloom (copie réduite, seuil, flou) + étalonnage cinéma + vignette -----
const FW_FILT=typeof CanvasRenderingContext2D!=='undefined'&&'filter' in CanvasRenderingContext2D.prototype;
function fwPost(){
  if(!FXF.post) return;
  const w=W,h=H;
  if(FW_FILT&&(FXF.bloom||FXF.refl)){
    const bw=Math.max(80,w>>2),bh=Math.max(45,h>>2);
    if(!FW.bc){FW.bc=document.createElement('canvas');FW.bx=FW.bc.getContext('2d',{willReadFrequently:true})}
    if(FW.bc.width!==bw||FW.bc.height!==bh){FW.bc.width=bw;FW.bc.height=bh}
    const x=FW.bx;x.globalCompositeOperation='source-over';x.clearRect(0,0,bw,bh);x.filter='brightness(.62) contrast(2.6) blur(4px)';x.drawImage(G3.cv,0,0,bw,bh);x.filter='none';
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=FXF.bloom?.55:.34;ctx.imageSmoothingEnabled=true;ctx.drawImage(FW.bc,0,0,w,h);ctx.restore();
    fwSunFlare(bw,bh);
  }
  ctx.save();
  ctx.globalCompositeOperation='soft-light';const lg=ctx.createLinearGradient(0,0,0,h);lg.addColorStop(0,'rgba(60,110,200,.38)');lg.addColorStop(.55,'rgba(255,255,255,0)');lg.addColorStop(1,'rgba(255,140,60,.34)');ctx.fillStyle=lg;ctx.fillRect(0,0,w,h);
  ctx.globalCompositeOperation='multiply';const vg=ctx.createRadialGradient(w/2,h/2,h*.45,w/2,h/2,h*.95);vg.addColorStop(0,'rgba(255,255,255,1)');vg.addColorStop(1,'rgba(60,40,70,1)');ctx.fillStyle=vg;ctx.fillRect(0,0,w,h);
  ctx.restore();
}
// ----- enseignes néon -----
const FW_SIGNS=[['HOTEL','#ff4aa8'],['BAR','#42e0ff'],['PHARMA','#5dff8a'],['CINÉ','#ffcf3a'],['24/7','#ff7a3a'],['BANK','#7ab0ff'],['PIZZA','#ff5a5a'],['MOTEL','#c07aff'],['CLUB','#ff3ae0'],['DINER','#ffe05a']];
function fwSignMat(i){
  const [txt,col]=FW_SIGNS[i%FW_SIGNS.length],key='sign_'+txt;let m=FW.matC[key];if(m) return m;
  const t=g3Tex('fwsn'+txt,512,160,(g,w,h)=>{
    g.fillStyle='rgba(8,8,16,.92)';g.fillRect(0,0,w,h);g.strokeStyle=col;g.lineWidth=7;g.shadowColor=col;g.shadowBlur=16;g.strokeRect(12,12,w-24,h-24);
    g.fillStyle='#fff';g.font='900 92px "Arial Black",Impact,sans-serif';g.textAlign='center';g.textBaseline='middle';g.shadowBlur=26;g.fillStyle=col;g.fillText(txt,w/2,h/2+4);g.shadowBlur=6;g.fillStyle='#fff';g.fillText(txt,w/2,h/2+4)},false);
  m=new THREE.MeshBasicMaterial({map:t,toneMapped:false});FW.matC[key]=m;return m;
}
function fwSignPlane(m,w,h){const g=new THREE.Group(),a=new THREE.Mesh(G3.geo.pl,m),b=new THREE.Mesh(G3.geo.pl,m);a.scale.set(w,h,1);b.scale.set(w,h,1);b.rotation.y=Math.PI;b.position.z=-.5;a.position.z=.5;g.add(a);g.add(b);return g}   // recto + verso : le texte n'est jamais inversé
// ----- détails de façade : ébrasements (murs épais), appuis, pilastres, corniches, toit équipé, enseignes -----
function fwTowerDetail(G,Gb,sc,rnd,B,v){
  const {x:cx,z:cz,bw,half,fl,h}=B,TH=FW_TH,stone=[0x8c8374,0x7e8088,0x70788a,0x948a78][v%4],dark=0x4a443c,sill=0xa89f8e;
  const wb=(s,u,y,d,su,sy,sd,col)=>{const o=half-d;if(s[1]) fwGeoBox(G,cx+u,y,cz+s[1]*o,su,sy,sd,col);else fwGeoBox(G,cx+s[0]*o,y,cz+u,sd,sy,su,col)};
  const U=x=>x/512*bw-half,dep=1+(TH-2)/2;
  for(const s of[[0,-1],[0,1],[-1,0],[1,0]]){
    for(let f=0;f<fl;f++){
      const y0=f*FW_FH+FW_WY0,y1=f*FW_FH+FW_WY1,gr=f%4===0,ym=(y0+y1)/2;
      for(let c=0;c<4;c++){
        if(gr&&(c===1||c===2)) continue;
        const ua=U(c*128+FW_WX0),ub=U(c*128+FW_WX1),uc=(ua+ub)/2,wu=ub-ua;
        wb(s,ua-3,ym,dep,6,y1-y0+10,TH-2,stone);wb(s,ub+3,ym,dep,6,y1-y0+10,TH-2,stone);
        wb(s,uc,y1+3,dep,wu+12,6,TH-2,stone);wb(s,uc,y0-3,dep,wu+12,6,TH-2,sill);
        wb(s,uc,y0-2,-4,wu+16,4,12,sill);                                              // rebord extérieur
        wb(s,uc,y1+8,-2,wu+14,6,8,stone);                                              // linteau saillant
      }
      if(gr){const ua=U(224),ub=U(288),uc=(ua+ub)/2,y=f*FW_FH;
        wb(s,ua-4,y+(FW_DOORH+6)/2,dep,8,FW_DOORH+6,TH-2,stone);wb(s,ub+4,y+(FW_DOORH+6)/2,dep,8,FW_DOORH+6,TH-2,stone);wb(s,uc,y+FW_DOORH+3,dep,ub-ua+16,6,TH-2,stone);
        wb(s,uc,y+2,dep,ub-ua,4,TH-2,0x6a645a);                                         // seuil
        if(f===0){wb(s,uc,y+FW_DOORH+14,-14,ub-ua+40,6,36,0xa02a20);wb(s,uc,y+FW_DOORH+9,-14,ub-ua+40,6,4,0x6a1810);}   // auvent
      }
    }
  }
  // pilastres d'angle + corniches
  for(const sx of[-1,1]) for(const sz of[-1,1]) fwGeoBox(G,cx+sx*(half-8),(h+40)/2,cz+sz*(half-8),24,h+40,24,stone);
  for(let f=1;f<fl;f++){const y=f*FW_FH,L=bw+12;fwGeoBox(G,cx,y,cz-half-2.5,L,7,5,stone);fwGeoBox(G,cx,y,cz+half+2.5,L,7,5,stone);fwGeoBox(G,cx-half-2.5,y,cz,5,7,L,stone);fwGeoBox(G,cx+half+2.5,y,cz,5,7,L,stone)}
  {const y=h+40+4,L=bw+22;fwGeoBox(G,cx,y,cz-half-5,L,9,10,stone);fwGeoBox(G,cx,y,cz+half+5,L,9,10,stone);fwGeoBox(G,cx-half-5,y,cz,10,9,L,stone);fwGeoBox(G,cx+half+5,y,cz,10,9,L,stone)}
  // toit : climatiseurs, ventilateurs, antennes avec balise rouge, enseigne néon
  const R=half-70;
  for(let k=0;k<5;k++){const px=cx+(rnd()-.5)*2*R,pz=cz+(rnd()-.5)*2*R,w=44+rnd()*30,d=34+rnd()*20;fwGeoBox(G,px,h+1+13,pz,w,26,d,0x6e7278);fwGeoBox(G,px,h+1+27,pz,w-10,2,d-10,0x2a2c30);fwGeoBox(G,px,h+1+4,pz,w+6,8,d+6,0x3a3c42)}
  for(let k=0;k<2;k++){const px=cx+(rnd()-.5)*2*R,pz=cz+(rnd()-.5)*2*R,ah=90+rnd()*70;fwGeoBox(G,px,h+1+ah/2,pz,4,ah,4,0x2a2c30);fwGeoBox(G,px,h+1+ah*.7,pz,34,3,3,0x2a2c30);fwGeoBox(Gb,px,h+1+ah+4,pz,7,7,7,0xff2a2a)}
  if(rnd()<.62){
    const i=Math.floor(rnd()*FW_SIGNS.length),s=[[0,-1],[0,1],[-1,0],[1,0]][Math.floor(rnd()*4)],m=fwSignMat(i),sw=250,sh=78,y=h+40+sh/2+18;
    const o=half-FW_PE-4;
    const pl=fwSignPlane(m,sw,sh);
    if(s[1]){pl.position.set(cx+(rnd()-.5)*120,y,cz+s[1]*o);if(s[1]<0) pl.rotation.y=Math.PI}else{pl.position.set(cx+s[0]*o,y,cz+(rnd()-.5)*120);pl.rotation.y=s[0]>0?Math.PI/2:-Math.PI/2}
    sc.add(pl);
    for(const d of[-1,1]){const lx=pl.position.x+(s[1]?d*sw*.4:0),lz=pl.position.z+(s[1]?0:d*sw*.4);fwGeoBox(G,lx,h+40+9,lz,6,18,6,0x2a2c30)}
  }
  // enseigne en drapeau au rez-de-chaussée
  if(rnd()<.8){
    const i=Math.floor(rnd()*FW_SIGNS.length),m=fwSignMat(i+3),s=[[0,-1],[0,1],[-1,0],[1,0]][Math.floor(rnd()*4)],u=U(128)*0+(-140),y=78;
    const pl=fwSignPlane(m,66,21);
    if(s[1]){pl.position.set(cx+u,y,cz+s[1]*(half+22));pl.rotation.y=s[1]>0?Math.PI/2:-Math.PI/2}else{pl.position.set(cx+s[0]*(half+22),y,cz+u);pl.rotation.y=s[0]>0?0:Math.PI}
    sc.add(pl);
    if(s[1]) fwGeoBox(G,cx+u,y,cz+s[1]*(half+11),3,3,22,0x2a2c30);else fwGeoBox(G,cx+s[0]*(half+11),y,cz+u,22,3,3,0x2a2c30);
  }
}
function fwBuild(n,seed){
  n=n||7;seed=seed|0||1;
  if(FW.built&&FW.bN===n&&FW.bSeed===seed) return;
  FW.built=true;FW.bN=n;FW.bSeed=seed;FW_N=n;FW_LIM=(n-1)/2*FW_P+550;
  FW.lampSpr=[];FW.lampSprOn=undefined;FW.grid=new Map();FW.bmap=new Map();FW.furnList=[];FW.inMats=[];FW.maxH=0;FW.lamps=[];FW.fires=[];FW.bl=[];FW.bld=[];FW.tr=[];FW.pt=[];FW.ex=[];FW.pl=[];FW.zoneM=null;FW.planeM=null;FW.model=null;FW.hand=null;
  const T=THREE,sc=FW.scene=new T.Scene(),rnd=fwRng(seed);
  fwAtmos(sc);G3.r.toneMapping=T.ACESFilmicToneMapping;G3.r.toneMappingExposure=1.3;G3.r.shadowMap.enabled=true;G3.r.shadowMap.type=T.PCFSoftShadowMap;
  FW.cam=new T.PerspectiveCamera(75,16/9,3,n>8?7200:4200);FW.cam.rotation.order='YXZ';sc.add(FW.cam);
  for(let i=0;i<5;i++){const l=new T.PointLight(0xffd29a,0,760,2);sc.add(l);FW.pl.push(l)}
  const fl0=new T.SpotLight(0xfff0d0,1.7,1700,.46,.5,1.4);fl0.position.set(6,-4,0);FW.cam.add(fl0);const tg=new T.Object3D();tg.position.set(0,0,-120);FW.cam.add(tg);fl0.target=tg;FW.fl=fl0;
  // ----- textures : asphalte fissuré et taché, trottoir carrelé, passages piétons -----
  const road=fwTex('fwroad2',512,512,(g,w,h)=>{
    g.fillStyle='#1d1e22';g.fillRect(0,0,w,h);
    for(let i=0;i<2200;i++){g.fillStyle='rgba('+(rnd()<.5?'255,255,255':'0,0,0')+','+(.025+rnd()*.05)+')';g.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1+rnd()*2)}
    for(let i=0;i<7;i++){g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.ellipse(rnd()*w,rnd()*h,20+rnd()*40,10+rnd()*24,rnd()*3,0,7);g.fill()}         // taches d'huile
    for(let i=0;i<5;i++){g.fillStyle='rgba(40,42,48,.5)';g.fillRect(rnd()*w,rnd()*h,40+rnd()*80,30+rnd()*60)}                                           // rustines
    g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=1.4;for(let i=0;i<9;i++){let x=rnd()*w,y=rnd()*h;g.beginPath();g.moveTo(x,y);for(let k=0;k<9;k++){x+=(rnd()-.5)*40;y+=(rnd()-.3)*34;g.lineTo(x,y)}g.stroke()}   // fissures
    g.fillStyle='rgba(20,22,26,.9)';g.beginPath();g.arc(120,340,16,0,7);g.fill();g.strokeStyle='#3a3c42';g.lineWidth=2;g.stroke();                           // plaque d'égout
  },16,16);
  const roadR=fwTex('fwroadR',256,256,(g,w,h)=>{
    g.fillStyle='#8c8c8c';g.fillRect(0,0,w,h);for(let i=0;i<900;i++){const v=110+rnd()*70;g.fillStyle='rgba('+v+','+v+','+v+',.5)';g.fillRect(rnd()*w,rnd()*h,2,2)}
    for(let i=0;i<9;i++){const x=rnd()*w,y=rnd()*h,r=14+rnd()*34,rg=g.createRadialGradient(x,y,0,x,y,r);rg.addColorStop(0,'rgba(10,10,10,.95)');rg.addColorStop(.7,'rgba(10,10,10,.8)');rg.addColorStop(1,'rgba(10,10,10,0)');g.fillStyle=rg;g.beginPath();g.ellipse(x,y,r*1.6,r,rnd()*3,0,7);g.fill()}
  },16,16);
  const gr=new T.Mesh(new T.PlaneGeometry(14000,14000),new T.MeshStandardMaterial(Object.assign({map:road,roughnessMap:roadR,roughness:1,metalness:.08,envMapIntensity:.8},fwPbr()?{normalMap:fwAsphaltNormal(),normalScale:new T.Vector2(.5,.5)}:{})));gr.receiveShadow=true;gr.rotation.x=-Math.PI/2;sc.add(gr);
  const walk=fwTex('fwwalk',256,256,(g,w,h)=>{g.fillStyle='#55524d';g.fillRect(0,0,w,h);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=2;for(let i=0;i<=w;i+=64){g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(w,i);g.stroke()}
    for(let i=0;i<500;i++){g.fillStyle='rgba('+(rnd()<.5?'255,255,255':'0,0,0')+','+(.03+rnd()*.05)+')';g.fillRect(rnd()*w,rnd()*h,2,2)}},6,6);
  const dash=g3Tex('fwdash',64,16,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#dcc65a';g.fillRect(0,5,34,6)},true);
  const half=FW_N*FW_P/2;
  for(let k=0;k<=FW_N;k++){
    const c=k*FW_P-half;
    for(const rot of[0,1]){const len=FW_N*FW_P+FW_RD*2,tx=dash.clone();tx.needsUpdate=true;tx.repeat.set(len/64,1);const mt=new T.MeshBasicMaterial({map:tx,transparent:true});
      const m=new T.Mesh(new T.PlaneGeometry(len,14),mt);m.rotation.x=-Math.PI/2;m.position.y=.6;if(rot){m.rotation.z=Math.PI/2;m.position.x=c}else m.position.z=c;sc.add(m)}
  }
  const zeb=g3Tex('fwzeb',64,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='rgba(230,230,220,.8)';for(let i=0;i<8;i++) g.fillRect(i*8+1,0,5,h)},true);
  const zm=new T.MeshBasicMaterial({map:zeb,transparent:true,depthWrite:false});
  for(let k=0;k<=FW_N;k++) for(let l=0;l<=FW_N;l++){
    const x=k*FW_P-half,z=l*FW_P-half;
    for(const [dx,dz,rot] of[[0,-FW_RD/2-30,0],[0,FW_RD/2+30,0],[-FW_RD/2-30,0,1],[FW_RD/2+30,0,1]]){const m=new T.Mesh(new T.PlaneGeometry(FW_RD*.7,56),zm);m.rotation.x=-Math.PI/2;m.rotation.z=rot?Math.PI/2:0;m.position.set(x+dx,.7,z+dz);sc.add(m)}
  }
  // ----- blocs et immeubles -----
  const sw=fwPbr()?new T.MeshStandardMaterial({map:walk,normalMap:fwWalkNormal(),roughness:.9,metalness:0,envMapIntensity:.3}):new T.MeshLambertMaterial({map:walk}),roof=new T.MeshLambertMaterial({color:0x24242a}),bg=new T.BoxGeometry(1,1,1),FH=FW_FH;
  const lotsEmpty=[],bl=FW.bl=[];
  for(let i=0;i<FW_N;i++) for(let j=0;j<FW_N;j++){
    const cx=(i-(FW_N-1)/2)*FW_P,cz=(j-(FW_N-1)/2)*FW_P;
    const s=new T.Mesh(bg,sw);s.receiveShadow=true;s.scale.set(FW_BLK,8,FW_BLK);s.position.set(cx,4,cz);sc.add(s);
    const mid=(i===(FW_N-1)/2&&j===(FW_N-1)/2);
    if(rnd()<.2||mid){for(const [ox,oz] of[[-150,-150],[150,-150],[-150,150],[150,150]]) lotsEmpty.push([cx+ox,cz+oz]);bl.push([cx-290,cz-290,cx+290,cz+290,0]);continue}
    const fl=[4,4,8,8,8,12][Math.floor(rnd()*6)],h=fl*FW_FH,v=Math.floor(rnd()*4),bw=560;
    fwTower(sc,rnd,cx,cz,bw,fl,v);
    bl.push([cx-bw/2,cz-bw/2,cx+bw/2,cz+bw/2,fl]);
    if(rnd()<.35){const t=new T.Mesh(new T.CylinderGeometry(30,30,80,10),new T.MeshLambertMaterial({color:0x5a4a3a}));t.position.set(cx+(rnd()-.5)*200,h+41,cz+(rnd()-.5)*200);sc.add(t)}   // château d'eau
  }
  // ----- immeubles de bordure : une enceinte de tours qui ferme la ville -----
  const LIMW=FW_LIM+110;
  for(let side=0;side<4;side++){
    for(let u=-LIMW-420;u<=LIMW+420;u+=300){
      for(let layer=0;layer<2;layer++){
        const off=LIMW+150+layer*320,fl=[12,16,20,24][Math.floor(rnd()*4)]*(layer?1.2:1)|0,fl4=Math.max(4,Math.round(fl/4)*4),h=fl4*FH,v=Math.floor(rnd()*4),m=fwFacade(v,fl4),bd=new T.Mesh(bg,[m,m,roof,roof,m,m]);
        bd.scale.set(290,h,290);FW.maxH=Math.max(FW.maxH,h+8);const x=side<2?(side?off:-off):u,z=side<2?u:(side===2?off:-off);bd.position.set(x,h/2+8,z);sc.add(bd);fwAddCol(x-145,z-145,x+145,z+145,h+8,'w');
      }
    }
  }
  const wallm=new T.MeshLambertMaterial({map:walk}); // mur bas le long de la limite jouable
  for(const [sx,sz,px,pz] of[[2*LIMW+40,26,0,-LIMW],[2*LIMW+40,26,0,LIMW],[26,2*LIMW+40,-LIMW,0],[26,2*LIMW+40,LIMW,0]]){const w=new T.Mesh(bg,wallm);w.scale.set(sx,70,sz);w.position.set(px,35,pz);sc.add(w);fwAddCol(px-sx/2,pz-sz/2,px+sx/2,pz+sz/2,70,'w')}
  // ----- lampadaires (un par intersection) -----
  const pm=new T.MeshLambertMaterial({color:0x2a2c31}),bm=new T.MeshBasicMaterial({color:0xffe0a0});
  const glow=g3Tex('fwglow',64,64,(g,w,h)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,225,160,.9)');gr.addColorStop(.35,'rgba(255,190,100,.28)');gr.addColorStop(1,'rgba(255,170,80,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)},false);
  const gm=new T.SpriteMaterial({map:glow,blending:T.AdditiveBlending,depthWrite:false,fog:false});
  for(let k=0;k<=FW_N;k++) for(let l=0;l<=FW_N;l++){
    const x=k*FW_P-half+FW_RD/2-22,z=l*FW_P-half+FW_RD/2-22;
    const p=new T.Mesh(new T.CylinderGeometry(4,6,300,8),pm);p.position.set(x,158,z);sc.add(p);
    const arm=new T.Mesh(bg,pm);arm.scale.set(46,5,5);arm.position.set(x-20,306,z);sc.add(arm);
    const b=new T.Mesh(new T.SphereGeometry(10,10,8),bm);b.position.set(x-42,302,z);sc.add(b);
    const sp=new T.Sprite(gm);(FW.lampSpr=FW.lampSpr||[]).push(sp);sp.scale.set(120,120,1);sp.position.set(x-42,302,z);sc.add(sp);FW.lamps.push({x:x-42,z});if(FXF.lights) fwLampGlow(sc,x-42,z,300);
    fwAddCol(x-6,z-6,x+6,z+6,300,'p');
  }
  // ----- épaves, tonneaux, bennes, arbres morts, bancs (à l'échelle du personnage) -----
  FW.spots=[];FW.spotsDone=false;const rcar=fwRng((seed|0)^0x51ed270b);
  const cm=[0x7a2a2a,0x2a4a7a,0x555a60,0x7a6a2a,0x2a6a3a,0x8a8a8a,0x2a2a30];
  for(let i=0;i<80;i++){
    const k=Math.floor(rnd()*(FW_N+1)),vert=rnd()<.5,c=k*FW_P-half,t=(rnd()-.5)*(FW_N*FW_P),off=(rnd()<.5?-1:1)*(40+rnd()*42);
    const mm=((t+half)%FW_P+FW_P)%FW_P;if(mm<FW_RD/2+120||mm>FW_P-FW_RD/2-120) continue;
    const x=vert?c+off:t,z=vert?t:c+off,L=210,Wd=88,sx=vert?Wd:L,sz=vert?L:Wd;
    const g=new T.Group(),col=cm[Math.floor(rnd()*cm.length)],wreck=rnd()<.5;
    const body=new T.Mesh(bg,new T.MeshStandardMaterial({color:col,roughness:.28,metalness:.6,envMapIntensity:1.3}));body.castShadow=true;body.scale.set(L,34,Wd);body.position.y=26;g.add(body);
    const cab=new T.Mesh(bg,new T.MeshStandardMaterial({color:0x0c1118,roughness:.06,metalness:.85,envMapIntensity:1.6}));cab.castShadow=true;cab.scale.set(L*.5,30,Wd-8);cab.position.set(-10,58,0);g.add(cab);
    for(const [wx,wz] of[[-66,Wd/2],[66,Wd/2],[-66,-Wd/2],[66,-Wd/2]]){const w=new T.Mesh(new T.CylinderGeometry(15,15,10,12),new T.MeshLambertMaterial({color:0x0c0c0c}));w.rotation.x=Math.PI/2;w.position.set(wx,15,wz);g.add(w)}
    for(const hx of[1,-1]){const hl=new T.Mesh(bg,new T.MeshBasicMaterial({color:wreck?0x332211:0xffe8b0}));hl.scale.set(3,8,16);hl.position.set(L/2,30,hx*(Wd/2-14));g.add(hl)}
    if(wreck) body.rotation.z=(rnd()-.5)*.12;
    g.position.set(x,0,z);g.rotation.y=vert?Math.PI/2:0;if(rnd()<.5) g.rotation.y+=Math.PI;sc.add(g);fwAddCol(x-sx/2,z-sz/2,x+sx/2,z+sz/2,78,'c');bl.push([x-sx/2,z-sz/2,x+sx/2,z+sz/2,-1]);FW.spots.push({n:FW_CARS[Math.floor(rcar()*FW_CARS.length)],x,z,ry:g.rotation.y+Math.PI/2,s:FWM.S,g});
  }
  for(let i=0;i<110;i++){
    const x=(rnd()-.5)*FW_LIM*1.9,z=(rnd()-.5)*FW_LIM*1.9;if(fwSolid(x,z,10)) continue;
    const fire=rnd()<.3,b=new T.Mesh(new T.CylinderGeometry(18,18,56,12),new T.MeshLambertMaterial({color:fire?0x7a4a22:0x2f6a7a}));b.position.set(x,28,z);sc.add(b);fwAddCol(x-18,z-18,x+18,z+18,56,'p');
    const ring=new T.Mesh(new T.CylinderGeometry(19,19,4,12),new T.MeshLambertMaterial({color:0x222}));ring.position.set(x,40,z);sc.add(ring);
    if(fire){const f=new T.Mesh(new T.SphereGeometry(12,8,6),new T.MeshBasicMaterial({color:0xff7a22}));f.position.set(x,66,z);f.scale.y=1.6;sc.add(f);FW.lamps.push({x,z,fire:true});FW.fires.push({m:f,x,z})}
  }
  const dm=new T.MeshLambertMaterial({color:0x2a6a3a}),wd=new T.MeshLambertMaterial({color:0x3e3226}),tr=new T.MeshLambertMaterial({color:0x2a1e14});
  for(const [x,z] of lotsEmpty){
    const d=new T.Mesh(bg,dm);d.scale.set(120,70,52);d.position.set(x,43,z);sc.add(d);fwAddCol(x-60,z-26,x+60,z+26,78,'d');
    const lid=new T.Mesh(bg,new T.MeshLambertMaterial({color:0x1f4a2a}));lid.scale.set(124,6,56);lid.position.set(x,80,z);sc.add(lid);
    for(let i=0;i<3;i++){const px=x+(rnd()-.5)*220,pz=z+(rnd()-.5)*220;if(fwSolid(px,pz,10)||Math.abs(px-x)<80&&Math.abs(pz-z)<50) continue;
      const c=new T.Mesh(bg,wd);c.scale.set(44,44,44);c.position.set(px,22,pz);sc.add(c);fwAddCol(px-22,pz-22,px+22,pz+22,44,'p')}
    if(rnd()<.6){const px=x+(rnd()-.5)*200,pz=z+(rnd()-.5)*200;if(!fwSolid(px,pz,10)){const t=new T.Mesh(new T.CylinderGeometry(7,10,150,7),tr);t.position.set(px,75,pz);sc.add(t);
      for(let k=0;k<4;k++){const br=new T.Mesh(new T.CylinderGeometry(2,4,70,5),tr);br.position.set(px+Math.cos(k*1.6)*16,130+k*8,pz+Math.sin(k*1.6)*16);br.rotation.z=Math.cos(k*1.6)*.9;br.rotation.x=-Math.sin(k*1.6)*.9;sc.add(br)}
      fwAddCol(px-9,pz-9,px+9,pz+9,150,'p')}}
  }
  fwPropsLayout(sc,seed);
  for(const o of sc.children.slice()) if(!o.isCamera&&!o.isLight&&!o.isSprite&&o!==FW.sky&&o!==FW.dust){o.updateMatrix();o.matrixAutoUpdate=false}
  try{fwBatchStatic(sc)}catch(e){console.warn('fusion',e)}
  fwModelsApply(sc);
  // ----- ciel : lune et étoiles (suivent le joueur) -----
  const grp=FW.grp=new T.Group();sc.add(grp);
  const mo=new T.Mesh(new T.SphereGeometry(140,20,14),new T.MeshBasicMaterial({color:0xefe9d6,fog:false}));mo.position.set(-1800,2400,-2600);grp.add(mo);
  const halo=new T.Sprite(new T.SpriteMaterial({map:glow,color:0xaab8ff,blending:T.AdditiveBlending,depthWrite:false,fog:false}));halo.scale.set(900,900,1);halo.position.copy(mo.position);grp.add(halo);
  const pos=[];for(let i=0;i<600;i++){const a=rnd()*6.283,e=.15+rnd()*1.2,r=3800;pos.push(Math.cos(a)*Math.cos(e)*r,Math.sin(e)*r,Math.sin(a)*Math.cos(e)*r)}
  const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(pos,3));grp.add(new T.Points(sg,new T.PointsMaterial({color:0xffffff,size:2.2,sizeAttenuation:false,fog:false})));
  // ----- pools : traînées, particules, explosions -----
  const lm=new T.LineBasicMaterial({color:0xffe08a,transparent:true});
  for(let i=0;i<24;i++){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,0,1],3));const ln=new T.Line(g,lm.clone());ln.visible=false;ln.frustumCulled=false;sc.add(ln);FW.tr.push({m:ln,life:0})}
  for(let i=0;i<110;i++){const m=new T.Mesh(bg,new T.MeshBasicMaterial({color:0xaa1111}));m.scale.setScalar(2.6);m.visible=false;sc.add(m);FW.pt.push({m,life:0,vx:0,vy:0,vz:0})}
  for(let i=0;i<6;i++){const m=new T.Mesh(new T.SphereGeometry(1,12,10),new T.MeshBasicMaterial({color:0xff9a3a,transparent:true,opacity:.7}));m.visible=false;sc.add(m);FW.ex.push({m,life:0,r:0})}
  // ----- arme en main -----
  const vm=FW.vm=new T.Group();vm.position.set(11,-10,-24);FW.cam.add(vm);
  const vg=new T.Group();vg.rotation.y=Math.PI/2;vm.add(vg);vm.userData.g=vg;
  const hand=FW.hand=new T.Mesh(FW_SPH(),new T.MeshLambertMaterial({color:0xe2b58c}));hand.scale.setScalar(3.6);hand.position.set(-1,-4,0);vg.add(hand);
  FW.mmDraw();
}
FW.mmDraw=function(){
  const S=.14,R=FW_LIM+350,n=Math.round(2*R*S),c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d');
  g.fillStyle='#17191f';g.fillRect(0,0,n,n);g.setTransform(S,0,0,S,R*S,R*S);
  g.fillStyle='#2a2926';for(let i=0;i<FW_N;i++) for(let j=0;j<FW_N;j++){const cx=(i-(FW_N-1)/2)*FW_P,cz=(j-(FW_N-1)/2)*FW_P;g.fillRect(cx-300,cz-300,600,600)}
  g.strokeStyle='rgba(220,198,90,.55)';g.lineWidth=7;g.setLineDash([60,60]);const half=FW_N*FW_P/2;
  for(let k=0;k<=FW_N;k++){const q=k*FW_P-half;g.beginPath();g.moveTo(-R,q);g.lineTo(R,q);g.stroke();g.beginPath();g.moveTo(q,-R);g.lineTo(q,R);g.stroke()}g.setLineDash([]);
  for(const b of FW.bl){const fl=b[4];g.fillStyle=fl===0?'#1f3a2a':fl<0?'#9a7a3a':'rgb('+(70+fl*6)+','+(74+fl*5)+','+(92+fl*6)+')';g.fillRect(b[0],b[1],b[2]-b[0],b[3]-b[1]);if(fl>0){g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=5;g.strokeRect(b[0],b[1],b[2]-b[0],b[3]-b[1])}}
  g.strokeStyle='#b0302a';g.lineWidth=18;g.strokeRect(-FW_LIM-30,-FW_LIM-30,2*FW_LIM+60,2*FW_LIM+60);
  FW.mm=c;
};
function FW_SPH(){return G3.geo.sph}
function fwPlaceFree(minD,maxD){
  for(let t=0;t<16;t++){
    const a=Math.random()*6.283,d=minD+Math.random()*(maxD-minD),x=FW.x+Math.cos(a)*d,z=FW.z+Math.sin(a)*d;
    if(Math.abs(x)>FW_LIM||Math.abs(z)>FW_LIM||fwSolid(x,z,20)||fwSolid(x+20,z,20)||fwSolid(x-20,z,20)||fwSolid(x,z+20,20)||fwSolid(x,z-20,20)) continue;
    return [x,z];
  }
  return null;
}
// ---------- cycle de partie ----------
let _resetFW=reset;
reset=function(toMenu){
  const was=FW.on;if(toMenu||was) fwStop();if(toMenu) BRF.on=false;
  _resetFW(toMenu);
  if(!toMenu&&gameMode==='3D'&&G3.status==='ready'&&!MP.on) fwStart();
};
function fwStart(o){
  FW.worldSeed=(o&&o.seed)|0||((o&&o.net==='host')?Math.floor(Math.random()*2147483000)+1:7);
  fwBuild(o&&o.mode&&o.mode!=='coop'&&o.net?17:7,FW.worldSeed);FW.on=true;state='fw';FW.zs.forEach(z=>FW.scene.remove(z.mesh));FW.zs=[];FW.dying.forEach(q=>FW.scene.remove(q.m));FW.dying=[];FW.sw=null;FW.en.forEach(e=>e.m&&FW.scene.remove(e.m));FW.en=[];FW.strikes=[];FW.pk.forEach(p=>FW.scene.remove(p.m));FW.pk=[];
  for(const t of FW.tr) t.m.visible=false;for(const t of FW.pt){t.m.visible=false;t.life=0}for(const e of FW.ex){e.m.visible=false;e.life=0}
  FW.pl.forEach((l,i)=>{l.visible=i<(FXF.lights?5:2)});FW.x=FW_P/2;FW.z=FW_P/2;FW.y=0;FW.vy=0;FW.yaw=Math.PI/4;FW.pitch=0;FW.hurtFl=0;FW.recoil=0;FW.shk=0;FW.fired=false;FW.boss=null;
  if(FW.model){FW.scene.remove(FW.model);FW.model=null}
  FW.vm.userData.g.userData.w=-1;
  spawnQueue=[];zombies=[];wave=0;FW.queue=[];fwmInitMode(o);
  if(FW.net!=='guest'&&FW.mode==='coop') fwWave();FW.crT=6000;FW.suT=14000;FW.spT=90;
  player.cd=0;player.swing=0;mouse.down=false;msg='';msgT=0;
  if(FW.net!=='guest'&&FW.mode==='coop'){const c=fwPlaceFree(350,520);if(c) fwSpawnCrate(c[0],c[1])}
  try{document.exitPointerLock()}catch(e){}
}
function fwStop(){
  if(!FW.on) return;FW.on=false;FW.net='';FW.down=false;for(const q of FW.peers) if(q.mesh) FW.scene.remove(q.mesh);FW.peers=[];FW.pmap.clear();for(const z of FW.zmap.values()) FW.scene.remove(z.mesh);FW.zmap.clear();for(const p of FW.pkmap.values()) FW.scene.remove(p.m);FW.pkmap.clear();for(const e of FW.enmap.values()) FW.scene.remove(e.m);FW.enmap.clear();if(FW.zoneM) FW.zoneM.visible=false;FW.zone=null;
  try{if(document.pointerLockElement) document.exitPointerLock()}catch(e){}
  for(const z of FW.zs) FW.scene.remove(z.mesh);FW.zs=[];FW.dying.forEach(q=>FW.scene.remove(q.m));FW.dying=[];FW.en.forEach(e=>e.m&&FW.scene.remove(e.m));FW.en=[];for(const p of FW.pk) FW.scene.remove(p.m);FW.pk=[];
  FW.tc.mv=FW.tc.lk=null;FW.tc.b={};
}
function fwWave(){
  wave++;if(NM.on) nmScale(wave);
  if(FW.net==='host'){if(player.dead){player.dead=false;FW.down=false;player.hp=Math.max(1,Math.round(player.maxhp*.5))}for(const g of MP.guests) if(g.p&&g.p.dead){g.p.dead=false;g.p.hp=Math.max(1,Math.round(g.p.maxhp*.5))}}
  const n=Math.ceil((5+wave*3)*curMap.count*(NM.on?NM.cnt:1)),pf=Math.min(.4,.12+.03*wave),pt=Math.min(.35,(.04+.025*wave)*curMap.tank);
  FW.queue=[];
  for(let i=0;i<n;i++){let t='normal',r=Math.random();if(wave>=2&&r<pf) t='fast';else if(wave>=3&&r>1-pt) t='tank';FW.queue.push(t)}
  if(wave%5===0) FW.queue.unshift('boss');
  FW.brk=0;FW.spT=60;flashG(tr('Vague')+' '+wave);
}
const fwZScale=(m,sz,k)=>m.scale.set(sz*1.12*(k||1),sz*(k||1),sz*1.4*(k||1));   // zombies plus massifs (largeur et profondeur)
function fwSpawnZ(type){
  const p=fwPlaceFree(950,1700);if(!p) return;
  const t=ZTYPES[type==='boss'?'tank':type],boss=type==='boss';
  const tier=Math.max(0,Math.floor(wave/5)-1),B=BOSSES[tier%BOSSES.length];
  const hpMul=(1+.18*(wave-1))*curDiff.hp*curMap.hp,dmgMul=(1+.1*(wave-1))*curDiff.dmg,spMul=Math.min(1.6,1+.03*(wave-1))*curDiff.sp*curMap.sp;
  const z={type,boss,px:p[0],pz:p[1],hp:(boss?B.hp*1.4:t.hp)*hpMul,speed:(boss?B.sp:t.speed)*(.8+Math.random()*.4)*spMul,size:boss?B.size*.8:t.size,dmg:Math.round((boss?B.dmg:t.dmg)*dmgMul),
    color:t.color,step:Math.random()*6,atk:0,stun:0,av:0,avT:0,flash:0,B:boss?B:null};
  z.maxhp=z.hp;
  const m=fwMergeRig(g3MakeZombie(boss?{type:'tank',boss:true,skin:B.skin,shirt:B.shirt}:{type}));z.mesh=m;fwZScale(m,z.size);m.position.set(z.px,0,z.pz);FW.scene.add(m);FW.zs.push(z);
  if(boss) FW.boss=z;
  if(Math.random()<.25) sfx('groan');
}
function fwSpawnCrate(x,z,sup){
  if(NM.on&&!MP.on&&(!sup||!NM.bonus)) return;
  let c;
  if(sup) c={sup:Math.random()<.5?'heal':'shield'};
  else{const pool=ownedGuns(),byTime=Math.random()<.5;c={w:pool[Math.floor(Math.random()*pool.length)],ammo:byTime?0:5+Math.floor(Math.random()*96),time:byTime?(10+Math.floor(Math.random()*31))*1000:0}}
  fwAddPk('crate',x,z,c,sup?(c.sup==='heal'?0xe0463a:0x3f8fe0):0xffd45a,70000);
  flashG(sup?'CAISSE MÉTALLIQUE !':'CAISSE LARGUÉE !');
}
function fwAddPk(kind,x,z,data,col,life){
  const T=THREE,g=new T.Group();
  const body=g3Mesh('box',kind==='crate'&&data.sup?'#5a6a5a':kind==='crate'?'#8a6a3a':'#222',kind==='crate'?58:22,kind==='crate'?42:22,kind==='crate'?46:22,0,kind==='crate'?21:0,0);
  if(kind==='bonus'){body.material=new T.MeshBasicMaterial({color:col})}
  g.add(body);
  const beam=new T.Mesh(new T.CylinderGeometry(4,4,560,8,1,true),new T.MeshBasicMaterial({color:col,transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide,fog:false}));beam.position.y=260;g.add(beam);
  g.position.set(x,0,z);FW.scene.add(g);FW.pk.push({kind,m:g,px:x,pz:z,d:data,life,t:Math.random()*6,col});
}
function fwBonusDrop(z){
  if(NM.on&&!NM.bonus) return;
  const ch=(z.type==='tank'?.3:z.type==='fast'?.09:.06)*curMap.drop;if(Math.random()>=ch) return;
  const ks=BKEYS().filter(k=>training?k!=='cash':bowned(k));if(!ks.length) return;
  const low=player.hp<player.maxhp*.5;let tot=0;const ws=ks.map(k=>{const w=BON[k].w*(k==='heal'&&low?2.5:1);tot+=w;return w});
  let r=Math.random()*tot,i=0;while(i<ks.length-1&&(r-=ws[i])>0) i++;
  const k=ks[i];fwAddPk('bonus',z.px,z.pz,{type:k,gold:Math.random()<.04},parseInt(BON[k].c.slice(1),16),12000);
}
function fwKill(z){
  fwmEv(['sf','zdie']);
  const adapt={x:0,y:GROUND,type:z.type,color:z.color,size:z.size,hp:0,maxhp:z.maxhp,dir:1,step:0,hh:80,hw:20};
  try{onKill(adapt)}catch(e){}
  if(z.boss){
    flashG('BOSS VAINCU !');sfx('wave');if(!training){addMoney(40+wave*8,'bonus');addXp(30+wave*5,'bonus')}
    const g={x:0,y:0,vy:0,landed:true,age:0,ph:0,w:0,ammo:0,time:0,gc:4};makeRareGift(g);fwAddPk('crate',z.px,z.pz,g,0xc060ff,90000);FW.boss=null;
  }
  fwBonusDrop(z);
  for(let i=0;i<14;i++) fwPart(z.px,40*z.size,z.pz,'#8e1b1b',3);
  z.dead=true;FW.dying.push({m:z.mesh,t:0,y:z.mesh.position.y})
}
function fwPart(x,y,z,col,sp){
  for(const p of FW.pt) if(p.life<=0){p.life=26+Math.random()*16;p.vx=(Math.random()-.5)*sp*1.6;p.vy=Math.random()*sp*1.4;p.vz=(Math.random()-.5)*sp*1.6;p.m.position.set(x,y,z);p.m.material.color.set(col);p.m.visible=true;return}
}
// ---------- combat ----------
function fwDir(spread,out){
  const c=FW.cam;c.updateMatrixWorld();const T=THREE,d=out||new T.Vector3();
  d.set(0,0,-1).applyQuaternion(c.quaternion);
  if(spread){d.x+=(Math.random()-.5)*spread*2;d.y+=(Math.random()-.5)*spread*2;d.z+=(Math.random()-.5)*spread*2;d.normalize()}
  return d;
}
function fwTrace(a,b,col,wid){
  fwmEv(['tr',Math.round(a.x),Math.round(a.y),Math.round(a.z),Math.round(b.x),Math.round(b.y),Math.round(b.z),col||'#ffe08a',wid===undefined?-1:wid]);
  for(const t of FW.tr) if(t.life<=0){const p=t.m.geometry.attributes.position;p.setXYZ(0,a.x,a.y,a.z);p.setXYZ(1,b.x,b.y,b.z);p.needsUpdate=true;t.m.material.color.set(col||'#ffe08a');t.m.material.opacity=.9;t.m.visible=true;t.life=5;return}
}
function fwBoom(x,y,z,r){fwmEv(['bm',Math.round(x),Math.round(y),Math.round(z),Math.round(r)]);for(const e of FW.ex) if(e.life<=0){e.life=16;e.r=r;e.m.position.set(x,y,z);e.m.visible=true;return}}
function fwDmgZ(z,dmg,head){
  if(z.hp<=0) return;
  z.hp-=dmg*(head?2:1);z.flash=5;FW.hitM=8;FW.hitHead=!!head;
  if(z.mesh) fwPart(z.px,45*z.size,z.pz,'#a22',2.5);
  if(z.hp<=0) fwKill(z);else z.stun=Math.max(z.stun,head?0:0);
}
function fwSpread(base,sp){const d=base.clone();if(sp){d.x+=(Math.random()-.5)*sp*2;d.y+=(Math.random()-.5)*sp*2;d.z+=(Math.random()-.5)*sp*2;d.normalize()}return d}
function fwShoot(){
  const wp=WEAPONS[player.w];
  if(FW.net==='guest'){fwmGuestShoot(wp);return}
  let hw=wp,side=0;
  if(wp.hands){side=player.hand=1-(player.hand||0);hw=WEAPONS[wp.hi[side]]}
  const o=FW.cam.getWorldPosition(new THREE.Vector3());
  fwFire(o,fwDir(0),hw,hw.dmg*player.dmgMul*wBoost(player.w)*dmgM(),{id:0,g:null,team:FW.myTeam,ads:FW.adsK>.6});
  FW.recoil=1;useAmmo();player.cd=(wp.hands?hw.rate*.6:wp.rate)/rapM();ACG.fwShot(player.cd);playGun(hw);
}
function fwFire(o,base,hw,dm,who){                                        // tir hitscan commun (hôte, solo, invités) : zombies et, en Battle Royale, autres joueurs
  const T=THREE,sh=hw.kind==='shotgun',range=Math.max(700,(hw.range||800)*1.6),muz=o.clone().add(base.clone().multiplyScalar(30)).add(new T.Vector3(0,-6,0));
  const brm=FW.net&&FW.mode!=='coop',others=brm?fwmPlayers().filter(q=>!q.dead&&!q.p.dead&&q.id!==who.id&&!q.air&&!(FW.mode==='brt'&&q.team===who.team)):null;
  for(let i=0;i<Math.max(1,hw.pellets);i++){
    const sp=(sh?Math.max(-hw.spread*.5,Math.min(hw.spread*.5,gauss()*hw.spread*.2))*.9:hw.spread*.55)*(who.ads?.45:1);
    const d=fwSpread(base,sp);
    let tw=range;for(let t=8;t<range;t+=8){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;if(y<0||fwSolid(x,z,y)){tw=t;break}}
    const hits=[],test=(px0,pz0,sph,ref,isP)=>{
      const dx=px0-o.x,dz=pz0-o.z;if(dx*dx+dz*dz>(tw+60)*(tw+60)) return;
      for(const q of sph){
        const cx=px0-o.x,cy=q[0]-o.y,cz=pz0-o.z,pr=cx*d.x+cy*d.y+cz*d.z;if(pr<0||pr>tw) continue;
        const px=cx-d.x*pr,py=cy-d.y*pr,pz=cz-d.z*pr,dd=px*px+py*py+pz*pz;if(dd<q[1]*q[1]){hits.push({ref,isP,t:pr,head:q[2]});break}
      }
    };
    const cyl=(px0,pz0,R,Hh,ref,isP,yb)=>{yb=yb||0;                                    // silhouette complète : cylindre vertical (jambes, tronc, bras, tête) ; le haut du cylindre compte comme tir à la tête
      const dx=px0-o.x,dz=pz0-o.z;if(dx*dx+dz*dz>(tw+R+60)*(tw+R+60)) return;
      const a=d.x*d.x+d.z*d.z;if(a<1e-6) return;
      const bx=o.x-px0,bz=o.z-pz0,b=2*(bx*d.x+bz*d.z),c=bx*bx+bz*bz-R*R,disc=b*b-4*a*c;if(disc<0) return;
      const sq=Math.sqrt(disc);let t=(-b-sq)/(2*a),y=o.y+d.y*t-yb;
      if(t<0||y<0||y>Hh){t=(-b+sq)/(2*a);y=o.y+d.y*t-yb}
      if(t<0||t>tw||y<0||y>Hh) return;
      hits.push({ref,isP,t,head:y>Hh*.78});
    };
    for(const z of FW.zs){if(z.hp<=0) continue;const s=z.size;cyl(z.px,z.pz,19*s,88*s,z,false)}
    if(others) for(const q of others) cyl(q.x,q.z,16,q.c?58:84,q,true,q.y||0);
    hits.sort((a,b)=>a.t-b.t);
    let left=Math.max(1,hw.pierce||1),end=tw;
    for(const h of hits){if(left<=0) break;if(h.t>tw) break;const dmg=sh?dm*Math.max(.3,1-.7*h.t/range):dm;if(h.isP) fwmHurtP(h.ref,dmg,h.head,who);else fwDmgZ(h.ref,dmg,h.head);left--;end=h.t;if(left<=0) break}
    if(left>0&&hits.length===0&&tw<range) fwPart(o.x+d.x*tw,o.y+d.y*tw,o.z+d.z*tw,'#d8c27a',2);
    const e=o.clone().add(d.clone().multiplyScalar(Math.min(end,range)));
    if(i<4||!sh) fwTrace(muz,e,hw.col||'#ffe08a',who.id);
    if(hw.aoe){const R=hw.aoe*1.2;fwBoom(e.x,Math.max(10,e.y),e.z,R);for(const z of FW.zs) if(z.hp>0&&Math.hypot(z.px-e.x,z.pz-e.z)<R) fwDmgZ(z,dm*.8*(1-Math.hypot(z.px-e.x,z.pz-e.z)/R*.6),false);
      if(others) for(const q of others){const dd=Math.hypot(q.x-e.x,q.z-e.z);if(dd<R) fwmHurtP(q,dm*.8*(1-dd/R*.6),false,who)}sfx('boom')}
  }
}
const FW_STYLE=wp=>/knife|blade|dagger/.test(wp.kind)?'stab':/axe|bat|hammer|saw|scythe/.test(wp.kind)?'chop':'slash';
function fwSlash(){
  const wp=WEAPONS[player.w];player.cd=wp.rate/rapM();player.swing=180;
  FW.sw={t:0,d:Math.max(170,Math.min(420,wp.rate*.85)),hit:false,k:FW_STYLE(wp)};playSwing(wp);
}
function fwSlashHit(){                                                    // l'impact a lieu au milieu du geste : aucun projectile, seulement la portée de l'arme
  const wp=WEAPONS[player.w],d=fwDir(0);d.y=0;d.normalize();
  if(FW.net==='guest'){mpSend({t:'ml3',d:[Math.round(d.x*1e3)/1e3,Math.round(d.z*1e3)/1e3]});FW.slashFx=7;return}
  const any=fwMeleeHit(FW.x,FW.z,{x:d.x,z:d.z},wp.dmg*player.dmgMul*wBoost(player.w)*dmgM(),wp.reach*1.25+52,{id:0,g:null,team:FW.myTeam});
  if(any&&snd()){const tt=AC.currentTime;if(!lastSfx.mh||tt-lastSfx.mh>.06){lastSfx.mh=tt;try{meleeHit(wp.name,tt)}catch(e){}}}
  FW.slashFx=7;
}
function fwMeleeHit(x,z,d,dm,reach,who){
  let any=false;
  for(const q of FW.zs){
    if(q.hp<=0) continue;
    const dx=q.px-x,dz=q.pz-z,dist=Math.hypot(dx,dz);
    if(dist<reach+16*q.size&&(dx*d.x+dz*d.z)/Math.max(1,dist)>.4){any=true;q.px+=d.x*24/q.size;q.pz+=d.z*24/q.size;q.stun=Math.max(q.stun,8);fwDmgZ(q,dm,false)}
  }
  if(FW.net&&FW.mode!=='coop') for(const q of fwmPlayers()){
    if(q.dead||q.p.dead||q.id===who.id||q.air) continue;const dx=q.x-x,dz=q.z-z,dist=Math.hypot(dx,dz);
    if(dist<reach+16&&(dx*d.x+dz*d.z)/Math.max(1,dist)>.4){any=true;fwmHurtP(q,dm,false,who)}
  }
  return any;
}
function fwHurt(d){
  if(fxB.shield>0||player.dead||FW.down) return;
  player.hp-=d;FW.hurtFl=1;FW.shk=Math.max(FW.shk,6);sfx('hurt');
  if(player.hp<=0) fwDie();
}
function fwDie(){
  const p=player;
  if(reviveAvail()){
    const pct=bl('revive')*.1;p.hp=Math.max(1,Math.round(p.maxhp*pct));revUsed=true;fxB.shield=Math.max(fxB.shield,3000);fxMax.shield=Math.max(fxMax.shield||0,3000);fxL.shield=fxL.shield||0;
    for(const z of FW.zs){if(z.hp>0&&!z.boss&&Math.hypot(z.px-FW.x,z.pz-FW.z)<520){const a=Math.atan2(z.pz-FW.z,z.px-FW.x);z.px+=Math.cos(a)*220;z.pz+=Math.sin(a)*220;z.stun=70}}
    fwBoom(FW.x,40,FW.z,260);sfx('bonus');sfx('wave');flash('SECONDE VIE !');return;
  }
  if(FW.net==='host'){
    if(FW.mode==='coop'){p.dead=true;FW.down=true;flash('À TERRE : tes équipiers continuent');fwmCoopCheck();return}
    const q=fwmPlayers()[0];p.hp=0;fwmEliminate(q,null);return;
  }
  fwStop();finishRun();
}
function fwUseBonus(){
  if(FW.net==='guest'){mpSend({t:'bn3'});return}
  if(FW.down||!stock.length) return;
  fwApply(stock.shift(),false);
}
function fwPickup(){
  if(FW.net==='guest'){let b=null,bd=140;for(const p of FW.pk){if(p.kind!=='crate') continue;const d=Math.hypot(p.px-FW.x,p.pz-FW.z);if(d<bd){bd=d;b=p}}if(b&&b.id) mpSend({t:'pk3',id:b.id});return}
  if(FW.down) return;
  let best=null,bd=95;
  for(const p of FW.pk){if(p.kind!=='crate') continue;const d=Math.hypot(p.px-FW.x,p.pz-FW.z);if(d<bd){bd=d;best=p}}
  if(!best) return;
  pickCrate(Object.assign({x:0,y:0},best.d));FW.scene.remove(best.m);FW.pk.splice(FW.pk.indexOf(best),1);
}
// ---------- boosts en 3D : tous les boosts du jeu posent de vrais objets dans la ville ----------
FW.en=[];FW.strikes=[];
const FW_SIMPLE=['heal','shield','dmg','rapid','freeze','cash','adren','magnet'];
function fwBox(c,sx,sy,sz,x,y,z,o){return g3Mesh('box',c,sx,sy,sz,x,y,z,o)}
function fwApply(type,gold,org){
  const O=org||{x:FW.x,z:FW.z,yaw:FW.yaw};
  const B=BON[type];if(!B) return;const L=LV(type,gold);
  if(FW_SIMPLE.includes(type)){applyBonus(type,1,gold);return}
  sfx('bonus');flash((gold?'DORÉ · ':'')+B.n);
  const T=THREE,f={x:-Math.sin(O.yaw),z:-Math.cos(O.yaw)},r={x:Math.cos(O.yaw),z:-Math.sin(O.yaw)},px=O.x,pz=O.z;
  const cap=(k,n)=>{const l=FW.en.filter(e=>e.k===k);while(l.length>n) fwEnDel(l.shift())};
  const add=e=>{FW.en.push(e);return e};
  const wall=(off,dist,hp,ice,t)=>{const x=px+f.x*dist+r.x*off,z=pz+f.z*dist+r.z*off,g=new T.Group();
    if(ice){g.add(fwBox('#9fe0f4',96,62,18,0,31,0,{transparent:true,opacity:.72}));g.add(fwBox('#ffffff',90,4,12,0,64,0,{transparent:true,opacity:.6}))}
    else{for(let i=0;i<4;i++) g.add(fwBox('#8a6a3a',96,13,16,0,8+i*15,0));g.add(fwBox('#5a4228',8,62,18,-40,31,0));g.add(fwBox('#5a4228',8,62,18,40,31,0))}
    g.position.set(x,0,z);g.rotation.y=O.yaw;FW.scene.add(g);return add({k:'barr',ice,x,z,yaw:O.yaw,hp,max:hp,m:g,t:t||1e9,circ:[[-34,0],[0,0],[34,0]]})};
  switch(type){
    case 'barricade':{const n=barN(L);for(let i=0;i<n;i++) wall(i===0?0:i===1?-110:110,95,barHp(L));cap('barr',6);break}
    case 'icewall':{const n=L>=3?2:1;for(let i=0;i<n;i++) wall(i?-100:0,95,iceHp(L),true,12000+1000*L);cap('barr',6);break}
    case 'teddy':{const n=L>=4?2:1;for(let i=0;i<n;i++){const g=new T.Group();g.add(g3Mesh('sph','#a8744a',13,13,11,0,16,0));g.add(g3Mesh('sph','#a8744a',9,9,8,0,34,0));for(const s of[-1,1]) g.add(g3Mesh('sph','#a8744a',3.5,3.5,3,s*7,41,0));g.add(g3Mesh('sph','#d98aa0',7,2.4,3,0,26,6));g.add(g3Mesh('sph','#222',1.2,1.2,1.2,-3,36,8));g.add(g3Mesh('sph','#222',1.2,1.2,1.2,3,36,8));
      const x=px+f.x*95+r.x*(i?-70:70),z=pz+f.z*95+r.z*(i?-70:70);g.position.set(x,0,z);FW.scene.add(g);add({k:'ted',x,z,hp:tedHp(L),max:tedHp(L),m:g,R:tedR(L)*1.3,dmg:tedDmg(L)+wave*6,circ:[[0,0]],cr:16})}cap('ted',4);break}
    case 'mine':{const n=mineN(L);for(let i=0;i<n;i++){const g=new T.Group();g.add(g3Mesh('cyl','#2a2c26',14,4,14,0,2,0));const led=new T.Mesh(G3.geo.sph,new T.MeshBasicMaterial({color:0xff2a2a}));led.scale.setScalar(2.6);led.position.y=6;g.add(led);
      const a=i*2.1,d=70+(i>>1)*55,x=px+Math.cos(a)*d*(i%2?-1:1)+f.x*70,z=pz+Math.sin(a)*d*.4+f.z*70;g.position.set(x,0,z);FW.scene.add(g);add({k:'mine',x,z,m:g,led,arm:50,R:130,dmg:mineDmg(L)+wave*4})}cap('mine',12);break}
    case 'beartrap':{const n=trapN(L);for(let i=0;i<n;i++){const g=new T.Group();g.add(g3Mesh('cyl','#6a6e76',17,3,17,0,1.5,0));for(let k=0;k<8;k++){const a=k*.785;g.add(g3Mesh('cone','#aab',2,7,2,Math.cos(a)*13,6,Math.sin(a)*13))}
      const x=px+f.x*(90+i*45)+r.x*(i%2?-1:1)*(30+i*14),z=pz+f.z*(90+i*45)+r.z*(i%2?-1:1)*(30+i*14);g.position.set(x,0,z);FW.scene.add(g);add({k:'trap',x,z,m:g,stun:trapStun(L)/16.7|0,dmg:40+12*L})}cap('trap',10);break}
    case 'molotov':{const R=firR(L)*1.5,x=px+f.x*260,z=pz+f.z*260,g=new T.Group();
      const d=new T.Mesh(new T.CylinderGeometry(R,R,2,20),new T.MeshBasicMaterial({color:0xff6a1a,transparent:true,opacity:.55,depthWrite:false}));d.position.y=1;g.add(d);
      const fl=[];for(let i=0;i<7;i++){const c=new T.Mesh(G3.geo.cone,new T.MeshBasicMaterial({color:i%2?0xffc23a:0xff5a1a,transparent:true,opacity:.85}));const a=i*.9,rr=R*.55*((i%3)/3+.3);c.position.set(Math.cos(a)*rr,14,Math.sin(a)*rr);c.scale.set(10,34,10);g.add(c);fl.push(c)}
      g.position.set(x,0,z);FW.scene.add(g);add({k:'fire',x,z,m:g,fl,R,t:firDur(L),dps:(.4+.07*L)*60*5});cap('fire',4);fwBoom(x,20,z,R*.6);break}
    case 'drone':{FW.en.filter(e=>e.k==='drone').forEach(fwEnDel);const g=new T.Group();g.add(fwBox('#44505c',24,7,24,0,0,0));for(const [a,b] of[[1,1],[1,-1],[-1,1],[-1,-1]]){g.add(g3Mesh('cyl','#ccd',9,.8,9,a*14,4,b*14))}
      const led=new T.Mesh(G3.geo.sph,new T.MeshBasicMaterial({color:0x66ff99}));led.scale.setScalar(2.4);led.position.set(12,-3,0);g.add(led);g.position.set(px,150,pz);FW.scene.add(g);add({k:'drone',x:px,z:pz,y:150,m:g,t:droneDur(L),cd:0,L});break}
    case 'decoy':{FW.en.filter(e=>e.k==='decoy').forEach(fwEnDel);const g=new T.Group();g.add(fwBox('#5a4a2a',22,28,12,0,14,0));g.add(fwBox('#222',14,8,2,0,18,6.5));g.add(g3Mesh('cyl','#999',1.2,40,1.2,8,46,0));const led=new T.Mesh(G3.geo.sph,new T.MeshBasicMaterial({color:0xffaa22}));led.scale.setScalar(2.4);led.position.set(8,68,0);g.add(led);
      const x=px+f.x*420,z=pz+f.z*420;g.position.set(x,0,z);FW.scene.add(g);add({k:'decoy',x,z,m:g,led,t:decDur(L)});break}
    case 'grenade':{const m=new T.Mesh(G3.geo.sph,g3Mat('#4a6a3a'));m.scale.setScalar(5);m.position.set(px,FW_EYE-10,pz);FW.scene.add(m);add({k:'gren',x:px,z:pz,y:FW_EYE-10,vx:f.x*9,vz:f.z*9,vy:5.5,m,R:grenR(L)*1.3,dmg:grenDmg(L)+wave*6});break}
    case 'smoke':{const g=new T.Group(),R=150*1.3;for(let i=0;i<8;i++){const s=new T.Mesh(G3.geo.sph,new T.MeshBasicMaterial({color:0x9aa0aa,transparent:true,opacity:.28,depthWrite:false}));s.scale.setScalar(50+Math.random()*30);s.position.set((Math.random()-.5)*R,40+Math.random()*50,(Math.random()-.5)*R);g.add(s)}
      const x=px+f.x*200,z=pz+f.z*200;g.position.set(x,0,z);FW.scene.add(g);add({k:'smoke',x,z,m:g,R,t:smkDur(L)});cap('smoke',3);break}
    case 'fence':{const g=new T.Group(),W2=160;for(const s of[-1,1]) g.add(fwBox('#555',6,70,6,s*W2/2,35,0));
      const pts=[];for(const yy of[24,46,66]){for(let k=0;k<=10;k++){pts.push(-W2/2+k*W2/10,yy+((k%2)?5:-5),0)}}
      const lg=new T.BufferGeometry();lg.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.add(new T.Line(lg,new T.LineBasicMaterial({color:0x5fd8ff})));
      const x=px+f.x*150,z=pz+f.z*150;g.position.set(x,0,z);g.rotation.y=O.yaw;FW.scene.add(g);add({k:'fence',x,z,yaw:O.yaw,m:g,t:fenDur(L),W:W2,dps:(40+10*L)});cap('fence',3);break}
    case 'dog':{FW.en.filter(e=>e.k==='dog').forEach(fwEnDel);const g=g3Quad('dog','#b88a4a');g.scale.setScalar(1.3);g.position.set(px+r.x*50,0,pz+r.z*50);FW.scene.add(g);add({k:'dog',x:px+r.x*50,z:pz+r.z*50,m:g,t:dogDur(L),cd:0,L,step:0});break}
    case 'heli':{const g=new T.Group();g.add(fwBox('#4a5a3a',110,34,40,0,0,0));g.add(fwBox('#4a5a3a',90,10,10,-100,6,0));g.add(fwBox('#222',3,3,150,10,22,0));const ro=fwBox('#111',190,2,10,0,24,0);g.add(ro);
      g.add(fwBox('#9fd0e8',30,20,34,48,4,0));g.position.set(px,260,pz);FW.scene.add(g);add({k:'heli',x:px,z:pz,y:260,m:g,ro,t:heliDur(L),cd:0,L,a:0,dmg:10+2*L+wave});break}
    case 'turret':{const g=new T.Group();g.add(g3Mesh('cyl','#3a4034',16,10,16,0,5,0));g.add(fwBox('#4a5640',16,12,16,0,16,0));g.add(fwBox('#222',26,5,5,13,18,0));
      const x=px+f.x*70,z=pz+f.z*70;g.position.set(x,0,z);FW.scene.add(g);FW.en.filter(e=>e.k==='turret').forEach(fwEnDel);add({k:'turret',x,z,m:g,t:turDur(L),cd:0,L});break}
    case 'strike':{const n=strN(L);FW.strikes.length=0;for(let i=0;i<n;i++) FW.strikes.push({t:-i*Math.min(14,90/n)-12,d:strDmg(L)});break}
    case 'ammo':{const g=player.gun;if(g){if(g.time>0) g.time+=12000+2000*L;else g.ammo+=Math.ceil((g.ammo||10)*.5)+15+5*L}else player.hp=Math.min(player.maxhp,player.hp+Math.round(player.maxhp*.1));break}
  }
}
function fwEnDel(e){e.dead=true;if(e.m) FW.scene.remove(e.m)}
function fwZNear(x,z,range){let b=null,bd=range*range;for(const q of FW.zs){if(q.hp<=0) continue;const d=(q.px-x)**2+(q.pz-z)**2;if(d<bd){bd=d;b=q}}return b}
function fwAoe(x,z,R,dm,fall){fwBoom(x,25,z,R);sfx('boom');for(const q of FW.zs) if(q.hp>0){const d=Math.hypot(q.px-x,q.pz-z);if(d<R+14*q.size) fwDmgZ(q,fall?dm*(1-d/(R+20)*.5):dm,false)}}
function fwPushEn(o,r){                                                     // obstacles posés (barricades, nounours) : renvoie l'objet touché
  let hit=null;
  for(const e of FW.en){
    if(!e.circ||e.dead) continue;const c=e.yaw!==undefined?Math.cos(e.yaw):1,s=e.yaw!==undefined?Math.sin(e.yaw):0;
    for(const [lx,lz] of e.circ){
      const cx=e.x+(e.yaw!==undefined?lx*c+lz*s:lx),cz=e.z+(e.yaw!==undefined?-lx*s+lz*c:lz),rr=r+(e.cr||30),dx=o.px-cx,dz=o.pz-cz,d2=dx*dx+dz*dz;
      if(d2<rr*rr&&d2>.0001){const d=Math.sqrt(d2),k=(rr-d)/d;o.px+=dx*k;o.pz+=dz*k;hit=e}
    }
  }
  return hit;
}
function fwZHitFrom(x,y,z,q,dm,col){fwTrace(new THREE.Vector3(x,y,z),new THREE.Vector3(q.px,40*q.size,q.pz),col);fwDmgZ(q,dm,false)}
function fwEnUpdate(dt){
  const k=dt/16.7,TIMED=['fire','smoke','barr','fence','decoy','dog','drone','heli','turret'];
  for(const e of FW.en){
    if(e.dead) continue;
    if(e.t!==undefined&&e.t<1e8){e.t-=dt;if(e.t<=0&&TIMED.includes(e.k)){fwEnDel(e);continue}}
    switch(e.k){
      case 'barr':if(e.hp<=0){fwBoom(e.x,30,e.z,50);fwEnDel(e)}else if(e.ice) for(const z of FW.zs) if(z.hp>0&&Math.hypot(z.px-e.x,z.pz-e.z)<120) z.slow=Math.max(z.slow||0,10);break;
      case 'ted':{let tr=e.hp<=0;for(const z of FW.zs) if(z.hp>0&&Math.hypot(z.px-e.x,z.pz-e.z)<30*z.size+14){tr=true;break}if(tr){fwAoe(e.x,e.z,e.R,e.dmg,true);fwEnDel(e)}break}
      case 'mine':{e.arm--;if(e.arm<=0){e.led.material.color.setHex((tick>>4)&1?0xff2a2a:0x551111);for(const z of FW.zs) if(z.hp>0&&Math.hypot(z.px-e.x,z.pz-e.z)<34+8*z.size){fwAoe(e.x,e.z,e.R,e.dmg,true);fwEnDel(e);break}}break}
      case 'trap':for(const z of FW.zs) if(z.hp>0&&!z.trapped&&Math.hypot(z.px-e.x,z.pz-e.z)<30){z.stun=e.stun;z.trapped=1;fwDmgZ(z,e.dmg,false);fwEnDel(e);break}break;
      case 'fire':{for(const z of FW.zs) if(z.hp>0&&Math.hypot(z.px-e.x,z.pz-e.z)<e.R) fwDmgZ(z,e.dps*dt/1000,false);e.fl.forEach((c,i)=>{c.scale.y=26+Math.sin(tick*.35+i)*12;c.position.y=c.scale.y/2});break}
      case 'smoke':for(const z of FW.zs) if(z.hp>0&&Math.hypot(z.px-e.x,z.pz-e.z)<e.R){z.slow=Math.max(z.slow||0,10);z.lost=20}break;
      case 'fence':{const c=Math.cos(e.yaw),s=Math.sin(e.yaw);for(const z of FW.zs){if(z.hp<=0) continue;const dx=z.px-e.x,dz=z.pz-e.z,lx=dx*c-dz*s,lz=dx*s+dz*c;if(Math.abs(lx)<e.W/2&&Math.abs(lz)<22){z.slow=Math.max(z.slow||0,10);fwDmgZ(z,e.dps*dt/1000,false)}}break}
      case 'decoy':e.led.material.color.setHex((tick>>3)&1?0xffaa22:0x553311);break;
      case 'gren':e.vy-=.32*k;e.x+=e.vx*k;e.z+=e.vz*k;e.y+=e.vy*k;e.m.position.set(e.x,e.y,e.z);if(e.y<=4||fwSolid(e.x,e.z,e.y)){fwAoe(e.x,e.z,e.R,e.dmg,true);fwEnDel(e)}break;
      case 'drone':{const tx=FW.x+Math.sin(FW.yaw)*40+Math.cos(FW.yaw)*60,tz=FW.z+Math.cos(FW.yaw)*40-Math.sin(FW.yaw)*60;e.x+=(tx-e.x)*.06*k;e.z+=(tz-e.z)*.06*k;e.y=150+Math.sin(tick*.08)*6;e.m.position.set(e.x,e.y,e.z);e.m.children.forEach((c,i)=>{if(i>=1&&i<=4) c.rotation.y+=.8});
        e.cd-=dt;if(e.cd<=0){const z=fwZNear(e.x,e.z,700);if(z){fwZHitFrom(e.x,e.y,e.z,z,8*(1+.1*(wave-1))*(1+.12*e.L)*3,'#9fe8ff');sfx('turret');e.cd=Math.max(120,320-30*e.L)}}break}
      case 'turret':{e.cd-=dt;const z=fwZNear(e.x,e.z,900);if(z){e.m.rotation.y=Math.atan2(-(z.pz-e.z),z.px-e.x);if(e.cd<=0){fwZHitFrom(e.x,34,e.z,z,6*(1+.1*(wave-1))*(1+.12*e.L)*3,'#ffe08a');sfx('turret');e.cd=Math.max(90,200-14*e.L)}}break}
      case 'heli':{e.a+=.012*k;e.x=FW.x+Math.cos(e.a)*380;e.z=FW.z+Math.sin(e.a)*380;e.y=260+Math.sin(tick*.05)*8;e.m.position.set(e.x,e.y,e.z);e.m.rotation.y=-e.a-Math.PI/2+.4;e.ro.rotation.y+=1.2;
        e.cd-=dt;if(e.cd<=0){const z=fwZNear(e.x,e.z,950);if(z){fwZHitFrom(e.x,e.y,e.z,z,e.dmg*2.4,'#ff9a3a');sfx('turret');e.cd=220}}break}
      case 'dog':{const z=fwZNear(e.x,e.z,1200);let tx=FW.x,tz=FW.z,sp=3.6;if(z){tx=z.px;tz=z.pz;sp=5}const dx=tx-e.x,dz=tz-e.z,d=Math.hypot(dx,dz);if(d>(z?22:70)){e.x+=dx/d*sp*k;e.z+=dz/d*sp*k;e.step+=.35*k}
        e.m.position.set(e.x,0,e.z);e.m.rotation.y=Math.atan2(-dz,dx);const sw=Math.sin(e.step),lg=e.m.userData.P&&e.m.userData.P.legs;if(lg&&lg.length>3){lg[0].rotation.z=sw*.8;lg[1].rotation.z=-sw*.8;lg[2].rotation.z=-sw*.8;lg[3].rotation.z=sw*.8}
        e.cd-=dt;if(z&&d<40&&e.cd<=0){fwDmgZ(z,(8+3*e.L)*3,false);e.cd=700}break}
    }
  }
  FW.en=FW.en.filter(e=>!e.dead);
  for(let i=FW.strikes.length-1;i>=0;i--){const s=FW.strikes[i];s.t+=k;if(s.t>=0){FW.strikes.splice(i,1);const z=fwZNear(FW.x,FW.z,1100)||null,x=z?z.px+(Math.random()-.5)*60:FW.x-Math.sin(FW.yaw)*500+(Math.random()-.5)*400,zz=z?z.pz+(Math.random()-.5)*60:FW.z-Math.cos(FW.yaw)*500+(Math.random()-.5)*400;fwAoe(x,zz,135,s.d,true)}}
}

