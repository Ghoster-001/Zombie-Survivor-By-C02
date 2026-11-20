// ===== Pièces et meubles (chargés près du joueur) =====
function fwHash(a,b){let h=(a*374761393+b*668265263)|0;h=(h^(h>>>13))*1274126177|0;return(h^(h>>>16))>>>0}
function fwFurnish(B){
  if(B.furn) return;
  const T=THREE,rnd=fwRng(fwHash(B.x|0,B.z|0)^(FW.worldSeed|0)),G=fwGeoNew(),Gb=fwGeoNew(),cols=[],lamps=[],pieces=[],I=B.I,cx=B.x,cz=B.z;let mark=0;G.k=.58;
  const pick=a=>a[Math.floor(rnd()*a.length)],shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const U0=-I+6,U1=I-6,Z0=-I+6,Z1=I-112,ZS=0,PU=140,CH=FW_FH-12;
  for(let f=0;f<B.fl;f++){
    const yb=f===0?4:f*FW_FH,yc=(f+1)*FW_FH-10;
    const bx=(u,z,w,d,h,col,y0,em)=>fwGeoBox(em?Gb:G,cx+u,yb+(y0||0)+h/2,cz+z,w,h,d,col);
    const solid=(u,z,w,d,h,y0,fixed)=>{const c=fwAddCol(cx+u-w/2,cz+z-d/2,cx+u+w/2,cz+z+d/2,yb+(y0||0)+h,'f',yb+(y0||0)+1,false,false);c.fur=true;cols.push(c);
      const v1=G.p.length/3;if(!fixed){c.fB=B;c.fp=pieces.length;pieces.push({v0:mark,v1,c,x:cx+u,y:yb+(y0||0)+h/2,z:cz+z,hp:Math.max(30,Math.min(170,w*d*h/1800))})}mark=v1};   // chaque meuble = une pièce destructible (les cloisons restent)
    const lampAt=(u,z)=>{const l={x:cx+u,z:cz+z,y:yc-14,int:true};FW.lamps.push(l);lamps.push(l)};
    // plafond clair + trappe d'escalier
    const hr=fwStairRect(B,f);fwGeoSlab(G,cx,cz,(f+1)*FW_FH-8,-I,I,-I,I,[hr[0],hr[1],hr[2],hr[3]],2,0xa9a59a);mark=G.p.length/3;
    const wall=(u0,u1,z0,z1)=>{if(u1-u0<1||z1-z0<1) return;bx((u0+u1)/2,(z0+z1)/2,u1-u0,z1-z0,CH,0xc2baa8);solid((u0+u1)/2,(z0+z1)/2,u1-u0,z1-z0,CH,0,true)};
    const lintel=(u0,u1,z0,z1)=>{bx((u0+u1)/2,(z0+z1)/2,u1-u0,z1-z0,CH-FW_DOORH,0xc2baa8,FW_DOORH);solid((u0+u1)/2,(z0+z1)/2,u1-u0,z1-z0,CH-FW_DOORH,FW_DOORH,true)};
    const ground=f===0,zcS=(Z0+ZS-4)/2,zcN=(ZS+4+Z1)/2;
    const rooms=[];
    if(ground){rooms.push(['shop',U0,-PU+4,Z0,Z1],['lobby',-PU+12,PU-12,Z0,Z1],['cafe',PU-4,U1,Z0,Z1])}
    else{
      // cloisons : deux lignes verticales et une ligne horizontale, avec des portes de 80
      for(const s of[-1,1]){const u=s*PU;wall(u-4,u+4,Z0,zcS-40);wall(u-4,u+4,zcS+40,zcN-40);wall(u-4,u+4,zcN+40,Z1);lintel(u-4,u+4,zcS-40,zcS+40);lintel(u-4,u+4,zcN-40,zcN+40)}
      for(const [a,b] of[[U0,-242],[-166,-38],[38,166],[242,U1]]) wall(a,b,ZS-4,ZS+4);
      for(const c of[-204,0,204]) lintel(c-38,c+38,ZS-4,ZS+4);
      const kind=rnd()<.55?'apt':'off';
      const th=kind==='apt'?shuffle(['living','kitchen','bedroom','bedroom','bath','office']):shuffle(['office','office','meeting','office','kitchen','storage']);
      const cs=[[U0,-PU-4],[-PU+4,PU-4],[PU+4,U1]],rs=[[Z0,ZS-4],[ZS+4,Z1]];
      let k=0;for(const r of rs) for(const c of cs) rooms.push([th[k++],c[0],c[1],r[0],r[1]]);
    }
    for(const [theme,u0,u1,za,zb] of rooms){
      const cu=(u0+u1)/2,cc=(za+zb)/2,hu=(u1-u0)/2,hz=(zb-za)/2,fu=rnd()<.5?-1:1;
      const P=(du)=>cu+fu*du;
      const chair=(u,z,col)=>{bx(u,z,16,16,4,col||0x3a2a1c,20);bx(u,z-7,16,3,22,col||0x3a2a1c,22);bx(u,z,4,4,20,0x222)};
      const plant=(u,z)=>{bx(u,z,14,14,14,0x7a4a2a);bx(u,z,20,20,30,0x2f6a34,14);bx(u,z,11,11,14,0x3f8a44,42);solid(u,z,16,16,40)};
      const book=(u,z,w,d,h,y0)=>{for(let k=0;k<Math.floor(d/6);k++) bx(u,z-d/2+3+k*6,w-4,4.5,12+rnd()*10,pick([0x8a3a30,0x3a5a8a,0xc8a040,0x4a7a4a,0x6a4a7a]),y0)};
      const picture=(u,z,sideU,w,h,y0)=>bx(sideU,z,2,w,h,pick([0x8a3a30,0x3a5a8a,0xc8a040,0x4a7a4a,0x6a4a7a]),y0);
      // luminaire de pièce
      bx(cu,cc,34,34,2,0xfff0c8,FW_FH-14,true);
      if(theme==='living'){
        bx(cu,cc,110,80,1.4,pick([0x7a2c2c,0x2c4a6a,0x5a5a2c]));
        const sz=za+34;bx(cu,sz,100,40,18,0x44506a);bx(cu,sz-14,100,12,42,0x44506a,18);for(const s of[-1,1]) bx(cu+s*54,sz,10,40,30,0x3a4660);for(let k=-1;k<=1;k++) bx(cu+k*30,sz+3,28,30,6,0x5a6a8a,18);solid(cu,sz,112,42,42);
        bx(cu,cc-6,54,30,5,0x4a3220,16);bx(cu,cc-6,46,22,16,0x2a1c12);solid(cu,cc-6,54,30,20);
        bx(cu,zb-16,76,18,24,0x2a2420);bx(cu,zb-16,60,4,38,0x050505,24);bx(cu,zb-16.4,56,1,34,0x1a2a3a,26,true);solid(cu,zb-16,76,18,24);
        bx(P(-hu+12),cc,18,90,90,0x5a4228);book(P(-hu+12),cc,18,90,20);book(P(-hu+12),cc,18,90,58);solid(P(-hu+12),cc,18,90,90);
        plant(P(hu-14),zb-14);plant(P(hu-14),za+14);
        bx(P(hu-26),za+16,4,4,60,0x333);bx(P(hu-26),za+16,14,14,9,0xffe8b0,60,true);
        picture(0,cc,P(hu-1),30,24,60);
      }else if(theme==='kitchen'){
        bx(cu,zb-18,Math.min(150,hu*2-24),30,40,0x8a8478);bx(cu,zb-18,Math.min(152,hu*2-22),32,4,0x303236,40);bx(P(-30),zb-18,26,18,2,0x9aa0a8,44);bx(P(18),zb-18,3,3,10,0x666,44);solid(cu,zb-18,Math.min(150,hu*2-24),30,44);
        for(let k=-1;k<=1;k++) bx(cu+k*44,zb-9,40,16,34,0x7a5a3a,84);
        bx(P(hu-20),za+20,34,34,86,0x8a8e94);bx(P(hu-20),za+3,2,2,50,0x555,30);solid(P(hu-20),za+20,34,34,86);
        bx(cu,cc-6,70,48,5,0x7a5a3a,30);for(const [dx,dz] of[[-30,-18],[30,-18],[-30,18],[30,18]]) bx(cu+dx,cc-6+dz,5,5,30,0x4a3220);solid(cu,cc-6,70,48,35);
        for(const [dx,dz] of[[-16,-34],[16,-34],[-16,22],[16,22]]) chair(cu+dx,cc-6+dz,0x6a3a2a);
        bx(cu,cc-6,12,12,2,0xffe8b0,FW_FH-26,true);
      }else if(theme==='bedroom'){
        bx(cu,cc,100,100,1.4,pick([0x5a4a6a,0x6a5a4a,0x4a6a6a]));
        const bu=P(-hu+50);bx(bu,cc,90,116,12,0x5a3a22);bx(bu,cc,84,110,12,0xa49e90,12);bx(bu,cc+42,70,16,8,0xbcbcbc,24);bx(bu,cc-8,84,66,5,pick([0x3a5a8a,0x8a3a4a,0x4a7a5a]),24);bx(bu,cc+57,92,5,48,0x5a3a22);solid(bu,cc,92,118,30);
        for(const s of[-1,1]){bx(bu+s*58,cc+48,20,20,28,0x5a3a22);bx(bu+s*58,cc+48,12,12,3,0xffe8b0,28,true);solid(bu+s*58,cc+48,20,20,28)}
        bx(P(hu-20),za+16,76,28,100,0x4a3626);bx(P(hu-20),za+1.5,2,1,70,0x2a1e14,12);solid(P(hu-20),za+16,76,28,100);
        bx(P(hu-16),zb-16,52,28,34,0x5a4228);bx(P(hu-16),zb-16,28,4,20,0x111,34);chair(P(hu-16),zb-34,0x3a3a44);solid(P(hu-16),zb-16,52,28,34);
        plant(P(-hu+14),zb-14);
      }else if(theme==='bath'){
        bx(cu,cc,hu*2-16,hz*2-16,1.2,0x8aa4b0);
        bx(P(-hu+44),zb-26,84,40,30,0xa8acb0);bx(P(-hu+44),zb-26,72,30,4,0x6ab0d8,28);solid(P(-hu+44),zb-26,84,40,30);
        bx(P(hu-18),za+22,24,34,26,0xa8acb0);bx(P(hu-18),za+10,24,12,40,0xa8acb0,26);solid(P(hu-18),za+22,24,34,26);
        bx(P(hu-24),zb-18,52,28,34,0xa49e90);bx(P(hu-24),zb-4,34,2,46,0x9ab4c4,60);solid(P(hu-24),zb-18,52,28,34);
        bx(P(-hu+6),cc,3,40,6,0x888,70);for(let k=0;k<2;k++) bx(P(-hu+9),cc-10+k*20,6,16,22,pick([0xc84a30,0x3a7ac8,0xb0b0b0]),50);
      }else if(theme==='office'){
        for(let r=0;r<2;r++){const z=za+44+r*74,u=cu;
          bx(u,z,76,34,4,0x6a5a48,32);bx(u-34,z,5,32,32,0x4a3e30);bx(u+34,z,5,32,32,0x4a3e30);bx(u,z-12,28,4,18,0x0a0a0a,36);bx(u,z-12.4,24,1,14,0x2a4a6a,38,true);bx(u+18,z+4,14,8,2,0xb0b0b0,36);
          chair(u,z-30,0x2a2a32);solid(u,z,76,34,36)}
        for(let k=0;k<2;k++){bx(P(hu-18),zb-18-k*28,26,26,60,0x6a6e74);solid(P(hu-18),zb-18-k*28,26,26,60)}
        bx(P(-hu+4),cc,2,80,46,0xa8a8a8,40);plant(P(-hu+14),zb-14);
      }else if(theme==='meeting'){
        bx(cu,cc,120,56,4,0x5a4228,32);bx(cu,cc,100,40,32,0x3a2c1c);solid(cu,cc,120,56,36);
        for(let k=0;k<3;k++){chair(cu-36+k*36,cc-40,0x2a2a32);chair(cu-36+k*36,cc+40,0x2a2a32)}
        bx(cu,zb-3,90,2,52,0x111,40);bx(cu,zb-3.4,84,1,46,0x2a4a6a,43,true);plant(P(hu-14),za+14);
      }else if(theme==='storage'){
        for(let k=0;k<5;k++){const u=cu-50+(k%3)*50,z=za+30+Math.floor(k/3)*52;bx(u,z,36,36,36+rnd()*30,pick([0x8a6a3a,0x6a5230,0x7a6a4a]));solid(u,z,36,36,50)}
        bx(P(hu-12),cc,16,110,100,0x6a6e74);for(let k=0;k<8;k++) bx(P(hu-12),cc-45+k*13,12,10,14+rnd()*12,pick([0xc84a30,0x3a7ac8,0xe0c030,0x8a6a3a]),20+Math.floor(k/4)*34);solid(P(hu-12),cc,16,110,100);
      }else if(theme==='shop'){
        for(let r=0;r<3;r++){const z=za+60+r*120;bx(cu,z,120,18,76,0x6a6e74);for(let k=0;k<8;k++){bx(cu-52+k*15,z,12,14,12+rnd()*10,pick([0xc84a30,0x3a7ac8,0xe0c030,0x4aa05a,0xb0b0b0]),20);bx(cu-52+k*15,z,12,14,12+rnd()*10,pick([0xc84a30,0x3a7ac8,0xe0c030,0x4aa05a]),48)}solid(cu,z,120,18,76)}
        bx(cu,zb-18,90,26,40,0x5a4228);bx(P(20),zb-18,18,14,12,0x111,40);bx(P(20),zb-18,14,1,8,0x44aa66,52,true);solid(cu,zb-18,90,26,40);
      }else if(theme==='lobby'){
        bx(cu,cc,120,120,1.4,0x7a2c2c);
        bx(cu,zb-24,110,30,40,0x5a4228);bx(cu,zb-24,112,32,4,0x2a2420,40);bx(cu+30,zb-18,12,12,8,0x111,44);bx(cu+30,zb-18,10,1,6,0x44aa66,52,true);solid(cu,zb-24,112,32,44);
        for(const s of[-1,1]){bx(cu+s*44,za+30,60,28,18,0x3a4a5a);bx(cu+s*44,za+18,60,10,40,0x3a4a5a,18);solid(cu+s*44,za+30,60,28,40)}
        bx(cu,cc-20,44,26,5,0x3a2a1c,18);bx(cu,cc-20,38,20,18,0x2a1c12);solid(cu,cc-20,44,26,22);
        plant(P(hu-14),za+14);plant(P(-hu+14),zb-14);picture(0,cc,P(hu-1),44,34,64);
      }else if(theme==='cafe'){
        for(let k=0;k<3;k++){const z=za+40+k*84;bx(cu,z,46,46,3,0x7a5a3a,32);bx(cu,z,8,8,32,0x4a3220);for(const [dx,dz] of[[-34,0],[34,0],[0,-34],[0,34]]) chair(cu+dx,z+dz,0x6a3a2a);solid(cu,z,50,50,36)}
        bx(P(hu-18),cc,22,140,46,0x5a4228);bx(P(hu-18),cc,24,142,4,0x2a2420,46);solid(P(hu-18),cc,22,140,50);for(let k=0;k<4;k++){bx(P(hu-46),cc-52+k*36,10,10,3,0x3a2a1c,30);bx(P(hu-46),cc-52+k*36,3,3,30,0x222)}
      }
      lampAt(cu,cc);
    }
  }
  const m1=fwGeoMesh(G,FW.vcPlain||(FW.vcPlain=new T.MeshLambertMaterial({vertexColors:true}))),m2=fwGeoMesh(Gb,FW.vcBasic||(FW.vcBasic=new T.MeshBasicMaterial({vertexColors:true})));
  FW.scene.add(m1);FW.scene.add(m2);B.furn={m1,m2,cols,lamps,pieces};FW.furnList.push(B);
  pieces.forEach((p,i)=>{if(FW.fdead&&FW.fdead.has(fwFurnKey(B,i))) fwFurnHide(B,i)});   // meubles déjà cassés : ils le restent quand on revient
}
function fwUnfurnish(B){
  const f=B.furn;if(!f) return;
  FW.scene.remove(f.m1);FW.scene.remove(f.m2);f.m1.geometry.dispose();f.m2.geometry.dispose();
  for(const k of fwBCells(B)){const l=FW.grid.get(k);if(l) FW.grid.set(k,l.filter(c=>!c.fur))}
  FW.lamps=FW.lamps.filter(x=>!f.lamps.includes(x));B.furn=null;FW.furnList=FW.furnList.filter(b=>b!==B);
}
function fwFurnTick(px,pz){
  FW.furT=(FW.furT||0)+1;if(FW.furT%10) return;
  let budget=1;
  const seen=new Set();
  for(let dx=-2;dx<=2;dx++) for(let dz=-2;dz<=2;dz++){
    const B=FW.bmap.get(fwCellKey(Math.floor(px/300)+dx,Math.floor(pz/300)+dz));if(!B||B.furn||seen.has(B)) continue;seen.add(B);
    if(budget>0&&Math.hypot(B.x-px,B.z-pz)<(FW.furR||760)){fwFurnish(B);budget--}
  }
  for(const B of FW.furnList.slice()) if(Math.hypot(B.x-px,B.z-pz)>(FW.unfR||1250)) fwUnfurnish(B);
}
