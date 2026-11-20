// ===== V0.85 : DÉCOR DESTRUCTIBLE — voitures, feux tricolores, lampadaires, bouches d'incendie, bancs, poubelles, bennes, cartons, buissons, tonneaux, arbres, meubles =====
// Les murs des immeubles (façades et cloisons intérieures) restent indestructibles. L'hôte décide (comme pour les zombies) et envoie la liste des objets détruits.
// Chaque objet garde sa trace : collisions, maillages simples, morceaux fusionnés (plage de sommets) et instances de modèles 3D.
const FW_DOB_COL={car:'#3a3d42',lamp:'#2a2c31',traffic:'#d8a420',hydrant:'#c0281e',bench:'#7a5a3a',bin:'#3a6a3a',dumpster:'#2a6a3a',crate:'#6a5232',bush:'#3a7a34',tree:'#4a3420',barrel:'#2f6a7a',box:'#8a6a3a',furn:'#7a6a58'};
const FW_DOB_HP={car:420,lamp:220,traffic:160,hydrant:150,bench:90,bin:45,dumpster:300,crate:45,bush:40,tree:160,barrel:70,box:35};
function fwDob(kind,x,y,z,cols,objs,hp){
  const d={id:FW.dob.length,kind,x,y,z,hp:hp||FW_DOB_HP[kind]||80,cols:(cols||[]).filter(Boolean),objs:[],ranges:[],inst:[],dead:false};
  d.max=d.hp;FW.dob.push(d);for(const c of d.cols) c.did=d.id;
  for(const o of objs||[]) if(o){o.userData.did=d.id;d.objs.push(o)}
  return d;
}
function fwDobDebris(x,y,z,col,n,sp){for(let i=0;i<n;i++) fwPart(x+(Math.random()-.5)*20,y+Math.random()*20,z+(Math.random()-.5)*20,i%3?col:'#6a6660',sp||5)}
function fwDobHit(d,dmg,x,y,z){
  if(!d||d.dead) return;
  fwDobDebris(x!==undefined?x:d.x,y!==undefined?y:d.y,z!==undefined?z:d.z,FW_DOB_COL[d.kind]||'#888',2,3);
  if(FW.net==='guest') return;                                                       // l'hôte décide ; l'invité ne fait que l'effet
  d.hp-=dmg;if(d.hp<=0) fwDobBreak(d,true);
}
function fwDobHide(d){
  const far=-99999;
  for(const o of d.objs) o.visible=false;
  for(const r of d.ranges){const pa=r.geo.attributes.position;for(let i=r.v0;i<r.v0+r.n;i++) pa.setXYZ(i,0,far,0);pa.needsUpdate=true}
  const Z=new THREE.Matrix4().makeScale(0,0,0);
  for(const it of d.inst){it.im.setMatrixAt(it.i,Z);it.im.instanceMatrix.needsUpdate=true}
}
function fwDobChar(d){                                                               // épave calcinée (voitures)
  const T=THREE,col=new T.Color(0x0e0b0a);
  for(const it of d.inst) if(it.im.instanceColor){it.im.setColorAt(it.i,col);it.im.instanceColor.needsUpdate=true}
  for(const o of d.objs) o.traverse&&o.traverse(m=>{if(m.isMesh&&m.material&&m.material.color){m.material=m.material.clone();m.material.color.setHex(0x1c1714)}});
  const f=new T.Mesh(new T.SphereGeometry(16,8,6),new T.MeshBasicMaterial({color:0xff7a22}));f.position.set(d.x,70,d.z);f.scale.y=1.7;FW.scene.add(f);
  FW.fires.push({m:f,x:d.x,z:d.z});FW.lamps.push({x:d.x,z:d.z,fire:true});
}
function fwDobBreak(d,local){
  if(d.dead) return;d.dead=true;d.hp=0;
  if(local&&FW.net==='host') FW.dsq.push(d.id);
  const near=Math.hypot(d.x-FW.x,d.z-FW.z)<1600;
  if(d.kind==='car'){
    fwDobChar(d);fwBoom(d.x,40,d.z,190);if(near) try{sfx('boom')}catch(e){}FW.shk=Math.max(FW.shk||0,Math.max(0,10-Math.hypot(d.x-FW.x,d.z-FW.z)/120));
    fwDobDebris(d.x,40,d.z,'#2a2a2a',10,8);
    if(local) setTimeout(()=>{if(FW.on){for(const z of FW.zs) if(z.hp>0){const k=Math.hypot(z.px-d.x,z.pz-d.z);if(k<220) fwDmgZ(z,160*(1-k/260),false)}fwDobAoe(d.x,d.z,230,180,d)}},120);   // explosion : zombies et réaction en chaîne
    return;
  }
  for(const c of d.cols) c.dead=true;
  if(d.lamp) d.lamp.dead=true;
  fwDobHide(d);
  fwDobDebris(d.x,d.y,d.z,FW_DOB_COL[d.kind]||'#888',d.kind==='lamp'||d.kind==='tree'?12:8,6);
  if(near) try{sfx(d.kind==='crate'||d.kind==='box'||d.kind==='bench'?'crate':'bhit')}catch(e){}
  if(d.kind==='hydrant') (FW.jets=FW.jets||[]).push({x:d.x,z:d.z,t:420});
  if(d.kind==='barrel'&&d.fire){fwBoom(d.x,40,d.z,120);if(near) try{sfx('boom')}catch(e){}if(local) for(const z of FW.zs) if(z.hp>0&&Math.hypot(z.px-d.x,z.pz-d.z)<140) fwDmgZ(z,90,false)}
}
function fwDobAoe(x,z,R,dm,skip){
  if(FW.net==='guest') return;
  for(const c of fwDobNear(x,z,R)){const d=FW.dob[c.did];if(!d||d.dead||d===skip) continue;const k=Math.hypot(d.x-x,d.z-z);if(k<R) fwDobHit(d,dm*(1-k/(R*1.3)))}
  fwFurnAoe(x,z,R,dm);
}
function fwDobNear(x,z,R){                                                           // collisions des objets destructibles autour d'un point (grille de 300)
  const out=new Set();
  for(let cx=Math.floor((x-R)/300);cx<=Math.floor((x+R)/300);cx++) for(let cz=Math.floor((z-R)/300);cz<=Math.floor((z+R)/300);cz++){const l=FW.grid.get(fwCellKey(cx,cz));if(l) for(const c of l) if(c.did!==undefined&&!c.dead) out.add(c)}
  return out;
}
function fwDobMelee(x,z,dir,reach,dmg){
  for(const c of fwDobNear(x,z,reach+60)){const d=FW.dob[c.did];if(!d||d.dead) continue;const cx=Math.max(c.x0,Math.min(c.x1,x+dir.x*reach*.6)),cz=Math.max(c.z0,Math.min(c.z1,z+dir.z*reach*.6));
    const dx=cx-x,dz=cz-z,k=Math.hypot(dx,dz);if(k<reach&&(k<25||(dx*dir.x+dz*dir.z)/k>.4)) fwDobHit(d,dmg,cx,(c.y0+c.h)/2,cz)}
  fwFurnMelee(x,z,dir,reach,dmg);
}
// tir : premier obstacle touché le long du rayon (null, true = mur d'immeuble, ou la collision d'un objet)
function fwSolidAt(x,z,y){
  const k=fwCellKey(Math.floor(x/300),Math.floor(z/300)),l=FW.grid.get(k);
  if(l) for(const c of l) if(!c.nr&&!c.dead&&x>=c.x0&&x<=c.x1&&z>=c.z0&&z<=c.z1&&y<c.h&&y>=c.y0) return c;
  const B=FW.bmap.get(k);return !!B&&fwBldSolid(B,x,z,y);
}
function fwShotHit(c,dm,x,y,z){
  if(!c||c===true) return;
  if(c.did!==undefined) fwDobHit(FW.dob[c.did],dm,x,y,z);
  else if(c.fB&&c.fp!==undefined) fwFurnHit(c.fB,c.fp,dm,x,y,z);
}
// ----- meubles (chaque client a ses propres meubles, chargés près de lui : leur destruction est locale) -----
function fwFurnKey(B,i){return Math.round(B.x)+'_'+Math.round(B.z)+'_'+i}
function fwFurnHide(B,i){
  const f=B.furn;if(!f) return;const p=f.pieces[i];if(!p||p.dead) return;p.dead=true;p.c.dead=true;
  const pa=f.m1.geometry.attributes.position;for(let v=p.v0;v<p.v1;v++) pa.setXYZ(v,0,-99999,0);pa.needsUpdate=true;
}
function fwFurnHit(B,i,dm,x,y,z){
  const f=B.furn;if(!f) return;const p=f.pieces[i];if(!p||p.dead) return;
  fwDobDebris(x!==undefined?x:p.x,y!==undefined?y:p.y,z!==undefined?z:p.z,FW_DOB_COL.furn,2,3);
  p.hp-=dm;if(p.hp>0) return;
  fwFurnHide(B,i);FW.fdead.add(fwFurnKey(B,i));fwDobDebris(p.x,p.y,p.z,'#7a5a3a',8,5);try{sfx('crate')}catch(e){}
}
function fwFurnAoe(x,z,R,dm){for(const B of FW.furnList||[]) if(B.furn&&Math.hypot(B.x-x,B.z-z)<R+400) B.furn.pieces.forEach((p,i)=>{if(!p.dead){const k=Math.hypot(p.x-x,p.z-z);if(k<R) fwFurnHit(B,i,dm*(1-k/(R*1.3)))}})}
function fwFurnMelee(x,z,dir,reach,dm){for(const B of FW.furnList||[]) if(B.furn&&Math.hypot(B.x-x,B.z-z)<700) B.furn.pieces.forEach((p,i)=>{if(p.dead||Math.abs(p.y-(FW.y+40))>90) return;const dx=p.x-x,dz=p.z-z,k=Math.hypot(dx,dz);if(k<reach+30&&(k<30||(dx*dir.x+dz*dir.z)/k>.4)) fwFurnHit(B,i,dm)})}
// effets continus : jets d'eau des bouches d'incendie
function fwDobTick(){
  if(!FW.jets||!FW.jets.length) return;
  for(const j of FW.jets){j.t--;if(j.t%2===0&&Math.hypot(j.x-FW.x,j.z-FW.z)<1400) fwPart(j.x+(Math.random()-.5)*6,30+Math.random()*30,j.z+(Math.random()-.5)*6,'#bfe6ff',4)}
  FW.jets=FW.jets.filter(j=>j.t>0);
}
// réseau : l'hôte joint les objets détruits à son instantané ; l'invité les applique
function fwDobNet(base){
  if(FW.dsq.length) base.ds=FW.dsq.splice(0);
  if((FW.seq%90)===0){const all=[];for(const d of FW.dob) if(d.dead) all.push(d.id);if(all.length) base.dsa=all}
}
function fwDobApply(s){
  for(const id of (s.ds||[]).concat(s.dsa||[])){const d=FW.dob[id|0];if(d&&!d.dead) fwDobBreak(d,false)}
}
// invité : ses tirs sont décidés par l'hôte, sauf sur ses propres meubles (chargés chez lui seulement)
function fwGuestFurnRay(wp){
  if(wp.melee) return;const o=FW.cam.getWorldPosition(new THREE.Vector3()),d=fwDir(0);
  for(let t=8;t<1600;t+=8){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;if(y<0) return;const c=fwSolidAt(x,z,y);if(c){if(c!==true&&c.fB) fwFurnHit(c.fB,c.fp,wp.dmg||20,x,y,z);return}}
}
