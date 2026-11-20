// ===== V0.78 : MATÉRIAUX RÉALISTES — cartes de relief (normal maps) générées par code, rugosité, saletés ; pools et cônes de lumière, éblouissement du soleil =====
// Les matériaux « physiques » (relief + reflets) ne sont utilisés que si les reflets sont activés (profils ÉLEVÉ et plus) ; sinon on garde les matériaux légers.
function fwHeightCanvas(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return c}
function fwNormalTex(key,hc,strength,rx,ry){
  let t=G3.texC.get(key);
  if(!t){
    const w=hc.width,h=hc.height,src=hc.getContext('2d').getImageData(0,0,w,h).data,c=document.createElement('canvas');c.width=w;c.height=h;
    const g=c.getContext('2d'),out=g.createImageData(w,h),o=out.data,H=(x,y)=>src[((((y%h)+h)%h)*w+(((x%w)+w)%w))*4]/255;
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){
      const dx=(H(x+1,y)-H(x-1,y))*strength,dy=(H(x,y+1)-H(x,y-1))*strength,l=Math.sqrt(dx*dx+dy*dy+1),i=(y*w+x)*4;
      o[i]=(-dx/l*.5+.5)*255;o[i+1]=(dy/l*.5+.5)*255;o[i+2]=(1/l*.5+.5)*255;o[i+3]=255;
    }
    g.putImageData(out,0,0);t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;G3.texC.set(key,t);
  }
  if(rx){const q=t.clone();q.needsUpdate=true;q.repeat.set(rx,ry);return q}
  return t;
}
const fwPbr=()=>!!FXF.refl;
// relief des façades : briques (v%4==0) ou panneaux de béton, encadrements saillants, bandeaux d'étage
function fwShellNormal(v,fl){
  const hc=fwHeightCanvas(512,512,(g,w,h)=>{
    let s=v*733+11;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
    g.fillStyle='#808080';g.fillRect(0,0,w,h);
    if(v%4===0){for(let y=0;y<h;y+=10){const off=((y/10)%2)*16;for(let x=-16;x<w;x+=32){const b=140+rnd()*50;g.fillStyle='rgb('+b+','+b+','+b+')';g.fillRect(x+off+1,y+1,30,8)}}}
    else{for(let i=0;i<1400;i++){const b=110+rnd()*60;g.fillStyle='rgba('+b+','+b+','+b+',.6)';g.fillRect(rnd()*w,rnd()*h,1+rnd()*5,1+rnd()*5)}
      g.fillStyle='#4a4a4a';for(let x=0;x<w;x+=64) g.fillRect(x,0,2,h);for(let y=0;y<h;y+=32) g.fillRect(0,y,w,1.5)}
    const k=128/FW_FH,wy0=128-FW_WY1*k,wh=(FW_WY1-FW_WY0)*k;
    for(let r=0;r<4;r++){const bottom=r===3;g.fillStyle='#d8d8d8';g.fillRect(0,r*128,w,5);g.fillStyle='#bbb';g.fillRect(0,r*128+5,w,2);
      for(let c=0;c<4;c++){if(bottom&&(c===1||c===2)) continue;g.fillStyle='#dedede';g.fillRect(c*128+FW_WX0-7,r*128+wy0-6,FW_WX1-FW_WX0+14,wh+12);g.fillStyle='#f0f0f0';g.fillRect(c*128+FW_WX0-10,r*128+wy0+wh+4,FW_WX1-FW_WX0+20,7)}
      if(bottom){const dh=FW_DOORH*k;g.fillStyle='#dedede';g.fillRect(216,r*128+128-dh-8,80,dh+8)}}
  });
  return fwNormalTex('fwshn'+(v%4),hc,v%4===0?3.2:2.2,1,fl/4);
}
function fwAsphaltNormal(){
  const hc=fwHeightCanvas(512,512,(g,w,h)=>{
    let s=4242;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
    g.fillStyle='#909090';g.fillRect(0,0,w,h);for(let i=0;i<9000;i++){const b=90+rnd()*110;g.fillStyle='rgb('+b+','+b+','+b+')';g.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1+rnd()*2)}
    g.strokeStyle='#202020';g.lineWidth=2;for(let i=0;i<10;i++){let x=rnd()*w,y=rnd()*h;g.beginPath();g.moveTo(x,y);for(let k=0;k<9;k++){x+=(rnd()-.5)*44;y+=(rnd()-.3)*36;g.lineTo(x,y)}g.stroke()}
  });
  return fwNormalTex('fwroadn',hc,2.6,16,16);
}
function fwWalkNormal(){
  const hc=fwHeightCanvas(256,256,(g,w,h)=>{
    let s=999;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
    g.fillStyle='#a0a0a0';g.fillRect(0,0,w,h);for(let i=0;i<3000;i++){const b=120+rnd()*80;g.fillStyle='rgb('+b+','+b+','+b+')';g.fillRect(rnd()*w,rnd()*h,2,2)}
    g.fillStyle='#303030';for(let i=0;i<=w;i+=64){g.fillRect(i-1.5,0,3,h);g.fillRect(0,i-1.5,w,3)}
  });
  return fwNormalTex('fwwalkn',hc,3,6,6);
}
function fwFloorNormal(){
  const hc=fwHeightCanvas(128,128,(g,w,h)=>{g.fillStyle='#909090';g.fillRect(0,0,w,h);g.fillStyle='#303030';for(let i=0;i<8;i++){g.fillRect(0,i*16,w,1.5);for(let k=0;k<2;k++) g.fillRect(((i*37+k*64)%128),i*16,1.5,16)}
    for(let i=0;i<400;i++){const b=110+Math.random()*60;g.fillStyle='rgb('+b+','+b+','+b+')';g.fillRect(Math.random()*w,Math.random()*h,2,1)}});
  return fwNormalTex('fwfloorn',hc,2,1,1);
}
// ----- pools de lumière au sol et cônes de lampadaire (additifs, très peu coûteux) -----
function fwLampGlow(sc,x,z,hy){
  const T=THREE;
  const pt=g3Tex('fwpool',128,128,(g,w,h)=>{const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,205,130,.85)');r.addColorStop(.45,'rgba(255,170,90,.28)');r.addColorStop(1,'rgba(255,150,70,0)');g.fillStyle=r;g.fillRect(0,0,w,h)},false);
  if(!FW.poolM){FW.poolM=new T.MeshBasicMaterial({map:pt,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false,opacity:.9});
    FW.coneM=new T.MeshBasicMaterial({color:0xffbe78,transparent:true,opacity:.05,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide});
    FW.poolG=new T.PlaneGeometry(1,1);FW.coneG=new T.ConeGeometry(120,hy,18,1,true)}
  const p=new T.Mesh(FW.poolG,FW.poolM);p.scale.set(330,330,1);p.rotation.x=-Math.PI/2;p.position.set(x,1.4,z);p.renderOrder=2;sc.add(p);
  const c=new T.Mesh(FW.coneG,FW.coneM);c.position.set(x,hy/2+2,z);sc.add(c);
  return [p,c];
}
// ----- éblouissement du soleil : intensité mesurée sur la copie réduite du rendu (ciel visible = soleil visible) -----
function fwSunFlare(bw,bh){
  const T=THREE,cam=FW.cam,q=FW.sunV;if(!q||!FW.bx) return;
  const v=new T.Vector3(q[0],q[1],q[2]).multiplyScalar(2000).add(cam.position).project(cam);
  let vis=0;
  if(v.z<1&&Math.abs(v.x)<1.05&&Math.abs(v.y)<1.05){
    const px=Math.max(0,Math.min(bw-1,Math.round((v.x+1)/2*bw))),py=Math.max(0,Math.min(bh-1,Math.round((1-v.y)/2*bh)));
    try{const d=FW.bx.getImageData(px,py,1,1).data;vis=Math.max(0,Math.min(1,(d[0]+d[1]-60)/200))}catch(e){vis=0}
  }
  FW.sunVis=(FW.sunVis||0)+(vis-(FW.sunVis||0))*.12;
  const a=FW.sunVis;if(a<.02) return;
  const sx=(v.x+1)/2*W,sy=(1-v.y)/2*H,cx=W/2,cy=H/2;
  ctx.save();ctx.globalCompositeOperation='lighter';
  const R=H*.9,g=ctx.createRadialGradient(sx,sy,0,sx,sy,R);g.addColorStop(0,'rgba(255,200,120,'+.55*a+')');g.addColorStop(.25,'rgba(255,150,70,'+.18*a+')');g.addColorStop(1,'rgba(255,120,50,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  const sg=ctx.createLinearGradient(0,sy,W,sy);sg.addColorStop(0,'rgba(255,170,90,0)');sg.addColorStop(Math.max(0,Math.min(1,sx/W)),'rgba(255,225,170,'+.45*a+')');sg.addColorStop(1,'rgba(255,170,90,0)');ctx.fillStyle=sg;ctx.fillRect(0,sy-3,W,6);
  for(const [t,r,c] of[[-.35,H*.06,'80,200,255'],[-.8,H*.1,'255,140,60'],[.5,H*.05,'255,100,200'],[1.2,H*.14,'90,255,180']]){
    const gx=sx+(cx-sx)*(1+t)*1.0,gy=sy+(cy-sy)*(1+t)*1.0,rg=ctx.createRadialGradient(gx,gy,0,gx,gy,r);rg.addColorStop(0,'rgba('+c+','+.16*a+')');rg.addColorStop(1,'rgba('+c+',0)');ctx.fillStyle=rg;ctx.beginPath();ctx.arc(gx,gy,r,0,7);ctx.fill()}
  ctx.restore();
}
