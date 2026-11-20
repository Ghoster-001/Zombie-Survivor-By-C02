// ===== V0.83 : ARMES RÉALISTES — modèles 3D détaillés par famille (canon, culasse, chargeur, crosse, organes de visée, rails, lunettes…) =====
// Repère : canon vers +X, poignée près de l'origine, Y vers le haut (même repère et même longueur que les anciens modèles : rien d'autre ne bouge).
// Les pièces sont regroupées par matériau (métal bronzé, acier, polymère, bois, laiton, verre…) : moins de 8 appels de rendu par arme.
const FWG={geo:new Map(),mats:{},cache:new Map(),pbr:null};
function fwGunMats(){
  const pbr=!!FXF.refl;if(FWG.pbr===pbr&&FWG.mats.metal) return FWG.mats;FWG.pbr=pbr;FWG.cache.clear();
  const T=THREE,mk=(c,met,rough,o)=>pbr?new T.MeshStandardMaterial(Object.assign({color:c,metalness:met,roughness:rough,envMapIntensity:.9},o||{})):new T.MeshLambertMaterial(Object.assign({color:c},o&&o.emissive!==undefined?{emissive:o.emissive}:{}));
  FWG.mats={
    metal:mk(0x2b2d31,.85,.42),steel:mk(0x70757c,.95,.28),poly:mk(0x18191b,.05,.78),wood:mk(0x4c2a15,.0,.6),woodD:mk(0x32190c,0,.66),
    brass:mk(0xb38b3c,.95,.32),glass:mk(0x173a5c,.3,.08,{emissive:0x061a2c}),rubber:mk(0x0d0d0e,0,.95),olive:mk(0x4b5331,.1,.7),tan:mk(0x8b7652,.05,.75),
    blade:mk(0xd9dee4,1,.18),red:mk(0x7d1a14,.2,.55),orange:mk(0xd46a1a,.1,.55),green:mk(0x3e5a2a,.1,.6),
    glow:new T.MeshBasicMaterial({color:0x66e6ff,toneMapped:false}),glowR:new T.MeshBasicMaterial({color:0xff4a3a,toneMapped:false})
  };
  return FWG.mats;
}
function fwGunBuild(wp){
  const T=THREE,M=fwGunMats(),parts=[],nm=String(wp.name||''),k=wp.kind;
  const geo=(key,f)=>{let g=FWG.geo.get(key);if(!g){g=f();FWG.geo.set(key,g)}return g};
  const add=(g,mat,x,y,z,sx,sy,sz,rz,ry,rx)=>{const m=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx||0,ry||0,rz||0,'XYZ')),new T.Vector3(sx,sy,sz));parts.push({g,mat,m})};
  const B=(mat,sx,sy,sz,x,y,z,rz,ry,rx)=>add(geo('box',()=>new T.BoxGeometry(1,1,1)),mat,x,y,z,sx,sy,sz,rz,ry,rx);
  const C=(mat,r,len,x,y,z,seg,r2,rz,ry)=>add(geo('cyl'+(seg||12)+'_'+(r2===undefined?1:(r2/r).toFixed(2)),()=>{const g=new T.CylinderGeometry(r2===undefined?1:r2/r,1,1,seg||12);g.rotateZ(-Math.PI/2);return g}),mat,x,y,z,len,r,r,rz,ry);
  const Cy=(mat,r,len,x,y,z,seg)=>add(geo('cyly'+(seg||12),()=>new T.CylinderGeometry(1,1,1,seg||12)),mat,x,y,z,r,len,r);   // cylindre vertical
  const Cz=(mat,r,len,x,y,z,seg)=>add(geo('cylz'+(seg||12),()=>{const g=new T.CylinderGeometry(1,1,1,seg||12);g.rotateX(Math.PI/2);return g}),mat,x,y,z,r,r,len);
  const S=(mat,r,x,y,z,sy)=>add(geo('sph',()=>new T.SphereGeometry(1,12,8)),mat,x,y,z,r,(sy||r),r);
  const rail=(x0,x1,y,z)=>{B(M.metal,x1-x0,.5,1.6,(x0+x1)/2,y,z||0);for(let x=x0+.5;x<x1;x+=1.1) B(M.metal,.55,.45,1.9,x,y+.4,z||0)};
  const scope=(x,y,len,r,ro)=>{C(M.metal,r,len,x,y,0,16);C(M.metal,ro||r*1.45,len*.22,x+len*.42,y,0,16);C(M.metal,r*1.25,len*.16,x-len*.44,y,0,16);
    C(M.glass,(ro||r*1.45)*.86,.15,x+len*.53,y,0,16);C(M.glass,r*1.05,.15,x-len*.52,y,0,16);Cy(M.metal,r*.45,r*1.1,x,y+r*1.2,0,10);Cz(M.metal,r*.45,r*1.1,x,y,r*1.2,10);
    B(M.metal,1.2,1.3,1.5,x-len*.22,y-r-.5,0);B(M.metal,1.2,1.3,1.5,x+len*.22,y-r-.5,0)};
  const reddot=(x,y)=>{B(M.metal,3.2,2.4,2.2,x,y+1.2,0);C(M.glass,.85,.1,x+1.65,y+1.4,0,14);B(M.metal,3.4,.45,2.4,x,y,0)};
  const grip=(mat,x,y,h,ang)=>{B(mat,2.6,h,2.1,x,y,0,ang===undefined?.28:ang);B(M.rubber,.25,h*.75,2.15,x+1.05,y,0,ang===undefined?.28:ang)};
  const guard=(x,y,w)=>{B(M.metal,w,.35,1.1,x,y-1.7,0);B(M.metal,.35,1.7,1.1,x+w/2,y-.9,0);B(M.metal,.3,1.1,.4,x-.4,y-.9,0,.25)};
  const wood=/AK-47|AKM|AK-103|SKS|Mosin|Kar98|Lee|Dragunov|M14(?! EBR)|M1 Garand|Winchester|Remington 870|Mossberg|Thompson|PPSh|Springfield|1887|Double|M79/i.test(nm);
  const fur=wood?M.wood:M.poly;
  if(wp.melee){
    if(k==='knife'){C(M.blade,.55,9.5,10.5,0,0,4,.08);B(M.blade,9,1.9,.35,10.2,.55,0);B(M.steel,9,.3,.4,10,1.45,0);B(M.metal,1,2.6,1.4,5.5,.2,0);C(M.rubber,.85,5,2.6,0,0,10);for(let i=0;i<4;i++) C(M.poly,.95,.3,1+i*1.2,0,0,10)}
    else if(k==='blade'){const L=/Katana/i.test(nm)?30:/Machette/i.test(nm)?20:12,w=/Machette/i.test(nm)?2.8:1.6;B(M.blade,L,w,.3,L/2+5,w*.25,0);B(M.steel,L,.35,.4,L/2+5,w*.75,0);
      if(/Katana/i.test(nm)){C(M.brass,1.9,.5,4.6,0,0,8);for(let i=0;i<5;i++) B(i%2?M.poly:M.red,1.4,1.3,1.3,1+i*1.2-2,0,0,0,0,.5)}else{B(M.metal,.8,3,1.2,4.6,0,0);C(M.woodD,.9,6,1.4,0,0,10)}}
    else if(k==='axe'){C(M.wood,.8,24,6,0,0,10);B(M.steel,3.5,5,1,16.5,2,0);B(M.blade,1.2,6.4,.4,18.6,2,0);B(M.metal,3,2,1.3,15,-.6,0)}
    else if(k==='bat'){C(M.wood,1.6,16,14,0,0,14,.7);C(M.woodD,.8,6,2,0,0,10);for(let i=0;i<7;i++){const a=i*2.2;B(M.steel,.3,1.4,.3,13+i*1.6,Math.cos(a)*1.6,Math.sin(a)*1.6,0,0,a)}}
    else if(k==='hammer'){C(M.wood,.75,22,6,0,0,10);B(M.steel,4.2,7,4.2,17,0,0);B(M.metal,4.6,1,4.6,17,3.3,0);B(M.metal,4.6,1,4.6,17,-3.3,0)}
    else if(k==='scythe'){C(M.wood,.7,30,10,0,0,10);for(let i=0;i<6;i++) B(M.blade,4,.5,.3,24-i*2.6,2+i*1.6,0,.15+i*.18)}
    else if(k==='chainsaw'){B(M.orange,9,6,4,3,0,0);B(M.poly,4,1.2,4.2,-1,3.4,0);B(M.steel,15,2.4,.4,15,0,0);for(let i=0;i<14;i++) B(M.metal,.6,.4,.6,8+i*1.05,1.35,0);C(M.poly,1,4,-1,-1.5,0,10)}
    else{B(M.blade,20,1.4,.4,11,0,0);C(M.woodD,.9,5,1.5,0,0,10)}
    return parts;
  }
  switch(k){
    case 'pistol':case 'deagle':case 'nailgun':case 'laser':{
      const big=k==='deagle',L=big?17:14.5,h=big?3.6:2.9,w=big?2.6:2.2;
      if(k==='nailgun'){B(M.orange,13,5,3,4,0,0);B(M.poly,3,8,2.6,-.5,-5,0,.2);B(M.steel,3,1,1,11.5,-1.5,0);for(let i=0;i<8;i++) B(M.steel,.25,3.5,.25,6+i*.5,-4,0);break}
      B(M.metal,L,h,w,L/2-2.6,1.7,0);                                                      // culasse
      for(let i=0;i<6;i++) B(M.poly,.22,h*.8,w+.05,-1.6+i*.55,1.8,0);                       // stries
      B(M.poly,L*.9,1.6,w*.95,L*.45-2.6,-.6,0);                                             // carcasse
      C(M.steel,big?.9:.6,1.2,L-2.3,1.9,0,12);B(M.metal,.4,.6,.4,L-3,1.7+h/2+.25,0);B(M.metal,.5,.7,1.4,-1.8,1.7+h/2+.3,0);
      grip(M.poly,-.6,-4.1,7.2);guard(1.9,.3,3.6);B(M.metal,.3,1.2,.4,1.4,-1,0,.2);B(M.metal,2.8,.6,2.3,-1.6,-7.6,0,.28);
      if(k==='laser'){B(M.metal,L,h,w,L/2-2.6,1.7,0);C(M.glow,.7,1.6,L-1.4,1.9,0,10);B(M.glow,3,.5,w+.1,4,1.7,0)}
      break}
    case 'revolver':{
      C(M.steel,1.95,3.8,2.6,.8,0,12);for(let i=0;i<6;i++){const a=i*Math.PI/3;C(M.metal,.38,3.9,2.6,.8+Math.cos(a)*1.95,Math.sin(a)*1.95,6)}
      C(M.steel,.8,9.5,9.2,1.6,0,14);B(M.steel,9.5,.7,1,9.2,2.5,0);B(M.metal,.5,1,.5,13.6,3,0);
      B(M.steel,5,3.2,1.5,2.4,1.2,0);B(M.metal,1,1.6,.7,-.3,3,0,-.4);grip(M.wood,-1.2,-3.6,6.6,.42);guard(2.2,-.6,3)}break;
    case 'smg':{
      const p90=/P90/i.test(nm),uzi=/Uzi|MAC/i.test(nm);
      if(p90){B(M.poly,20,6,3.6,6,0,0);B(M.poly,8,1.5,3,9,3.4,0);B(M.glass,12,.6,2.4,8,3.1,0);C(M.steel,.55,2,17,.6,0,10);B(M.poly,3,5,2.6,5,-4,0,.15);reddot(6,4.2);break}
      B(M.metal,uzi?12:14,4,3,uzi?4.5:5.5,.8,0);C(M.steel,.55,uzi?3:5,uzi?11.5:14,1.3,0,10);C(M.poly,1,uzi?2:6,uzi?10:11,1.2,0,10);
      grip(M.poly,uzi?3:1,-4.4,7.5,uzi?.1:.28);B(M.metal,2,uzi?9:7,1.6,uzi?3:5.5,uzi?-5:-4.5,0,uzi?.08:-.12);guard(4,-1,3);
      if(!uzi){B(M.metal,.4,2.4,.4,-2,.6,0);B(M.metal,6,.5,.5,-5,.2,.9);B(M.metal,6,.5,.5,-5,.2,-.9);B(M.rubber,.8,3.6,2.2,-8,-.5,0)}else B(M.metal,6,.6,2,-3,.4,0);
      rail(1,9,3,0);if(/Vector|MP7|KRISS/i.test(nm)) reddot(4,3.3)}break;
    case 'ak':{
      B(M.metal,13,4,3,5,.7,0);B(M.metal,12,1.2,3.1,5.5,3.2,0);C(M.steel,.6,13,18.5,1.8,0,10);C(M.metal,.55,9,14.5,3.3,0,10);
      B(fur,8,2.4,3.4,15.5,1.3,0);B(fur,7,1.6,2.6,15.5,3.4,0);B(M.metal,.5,2.6,.5,23.5,3.2,0);C(M.metal,.85,2.4,25.3,1.8,0,10);B(M.metal,1.2,1.4,1.6,11,3.9,0);
      for(let i=0;i<5;i++) B(M.metal,2.3,2.1,2,8.3+i*.75,-2.6-i*1.55,0,-.06-i*.11);               // chargeur courbe
      grip(fur,1.6,-4.2,6.8,.35);guard(5,-1.3,3.5);B(fur,8,3.6,2.4,-4,0,0,.08);B(fur,4,5.4,2.4,-8.6,-.9,0,.08);B(M.rubber,.5,5.6,2.5,-10.6,-1.1,0,.08);
      if(!wood) rail(2,10,4,0)}break;
    case 'm4':{
      const bull=/FAMAS|AUG|Tavor|SA80|L85/i.test(nm);
      if(bull){B(M.poly,20,5,3.2,6,.6,0);B(M.poly,14,2,2,7,4,0);C(M.steel,.6,6,19,1.2,0,10);C(M.metal,.8,1.6,22,1.2,0,10);grip(M.poly,9,-4.1,6.8);B(M.metal,2.2,6.5,1.6,2,-4,0,-.1);reddot(8,5.3);break}
      B(M.metal,10,3.6,2.8,4,.7,0);B(M.metal,10,2.2,2.6,4,3,0);rail(-1,9,4.2,0);rail(9,18,3.2,0);
      B(M.metal,9,3.4,3.2,13.5,1.4,0);for(let i=0;i<5;i++) B(M.poly,.9,3.6,3.4,10+i*1.8,1.4,0);
      C(M.steel,.55,10,21,1.4,0,10);C(M.metal,.85,2,26,1.4,0,10);for(let i=0;i<4;i++) B(M.poly,.12,1.7,.12,25.4+i*.4,1.4,0);B(M.metal,.5,2.4,.5,17.5,3.8,0);
      B(M.metal,2.2,7,1.8,6.5,-3.6,0,-.14);grip(M.poly,1.6,-4,6.6);guard(5,-1.1,3.6);
      C(M.metal,.9,7,-4.2,1.4,0,12);B(M.poly,5,3.4,2.4,-9,.4,0);B(M.poly,2,4.6,2.4,-11,-.4,0);reddot(3,4.6)}break;
    case 'shotgun':{
      const lever=/1887|Winchester/i.test(nm),tac=/SPAS|KSG|Benelli|AA-12|Saiga|USAS/i.test(nm);
      B(M.metal,9,4,3,3.5,.6,0);C(M.steel,.8,22,18.5,1.9,0,12);C(M.metal,.72,15,15,-.1,0,12);
      if(!lever) for(let i=0;i<6;i++) B(tac?M.poly:M.wood,1.1,2.6,3,12+i*1.25,-.1,0);B(M.brass,.35,.35,.35,29.4,2.8,0);
      grip(fur,-1.5,-3.6,5.6,.45);guard(2,-1.3,3.2);
      if(lever){B(M.metal,4.5,.5,.6,1.5,-2.6,0);B(M.metal,.5,2.4,.6,-.5,-3.6,0)}
      B(fur,8,3.6,2.4,-5.2,-.6,0,.12);B(fur,4.5,5.2,2.4,-9.6,-1.6,0,.12);B(M.rubber,.6,5.4,2.5,-11.8,-1.9,0,.12);if(tac) rail(0,7,2.9,0)}break;
    case 'dmr':case 'barrett':{
      const big=k==='barrett',bolt=/Mosin|Kar98|Lee|Springfield|Remington 700|AWM|M24|Hécate|M200|CheyTac|M99/i.test(nm);
      const L=big?44:36;
      B(M.metal,big?15:12,big?5:3.6,big?3.6:2.8,big?5:4,.6,0);C(M.steel,big?.95:.6,L*.55,L*.66,1.4,0,12);
      if(big){B(M.metal,3.6,2.4,2.4,L-2.6,1.4,0);B(M.poly,.4,2.6,2.6,L-3.6,1.4,0);B(M.poly,.4,2.6,2.6,L-1.8,1.4,0);   // frein de bouche
        for(const s of[-1,1]){B(M.metal,.5,9,.5,L*.55,-3.4,s*1.6,s*.0,0,s*.35)}B(M.metal,6,1.2,1.4,4,4.8,0)}
      else C(M.metal,.85,2,L-1.6,1.4,0,10);
      B(fur,big?10:13,big?3.6:2.6,big?3.4:2.6,big?15:12,big?.2:.2,0);
      for(let i=0;i<4;i++) B(M.metal,2.1,2,big?2.4:1.8,(big?6:5)+i*.2,-2.6-i*1.4,0,-.05);              // chargeur
      scope(big?6:5,big?5.4:4.3,big?15:13,big?1.3:1.05,big?2.1:1.6);
      if(bolt){B(M.steel,1.8,.5,.5,1.5,1.6,2,0,-.5);S(M.steel,.55,2,1.6,2.9)}
      grip(fur,-1.4,-3.7,5.8,.4);guard(2.4,-1.3,3.2);B(fur,9,3.6,2.4,-6,-.3,0,.1);B(fur,5,5.4,2.4,-11,-1.2,0,.1);B(M.rubber,.6,5.6,2.5,-13.6,-1.5,0,.1);
      if(big) B(M.metal,4,.8,1.6,-8,2.2,0)}break;
    case 'lmg':{
      B(M.metal,14,4.6,3.4,5,.8,0);B(M.metal,14,1,3.5,5,3.4,0);C(M.steel,.75,16,21,1.4,0,12);B(M.metal,10,2.4,3.6,17,1.4,0);for(let i=0;i<6;i++) C(M.poly,.45,.3,13.2+i*1.5,2.7,0,8);
      C(M.metal,1,2.2,30,1.4,0,10);B(M.olive,6,5,4,6,-3.6,2.6);B(M.brass,.4,1.6,1.6,3,-1,1.9);for(let i=0;i<6;i++) B(M.brass,.35,.5,1.6,3.2-i*.45,-.6+i*.35,1.9);
      B(M.metal,5,.7,.7,7,5,0);B(M.metal,.6,1.5,.6,5,4.2,0);B(M.metal,.6,1.5,.6,9,4.2,0);
      for(const s of[-1,1]) B(M.metal,.5,8,.5,23,-3.2,s*1.4,0,0,s*.3);grip(M.poly,1.4,-4.2,6.4);guard(4.6,-1.3,3.4);B(M.poly,9,4,2.6,-6,0,0,.05);B(M.poly,3,5,2.6,-10.5,-.5,0)}break;
    case 'minigun':{
      for(let i=0;i<6;i++){const a=i*Math.PI/3;C(M.steel,.55,22,15,1.6*Math.cos(a)+.6,1.6*Math.sin(a),12)}
      C(M.metal,2.6,1,10,.6,0,16);C(M.metal,2.6,1,22,.6,0,16);C(M.metal,2.8,8,1.5,.6,0,16);B(M.metal,6,1,1,1.5,4.2,0);B(M.metal,1,3,1,-.5,2.8,0);B(M.metal,1,3,1,3.5,2.8,0);
      B(M.olive,7,7,5,-2,-5.5,2);for(let i=0;i<8;i++) B(M.brass,.6,.5,1.8,3+i*.65,-2+i*.2,2.2)}break;
    case 'flamer':{
      C(M.metal,1,16,10,1,0,12);C(M.steel,.7,6,19,1,0,10);S(M.glowR,.5,22.3,.6,0);for(const z of[-1.8,1.8]) Cy(M.red,2.2,10,1,-4.5,z,14);
      B(M.steel,1,4,1,8,-2,0);grip(M.poly,3,-3.4,5.4);B(M.poly,6,3,2.4,-4,0,0)}break;
    case 'launcher':{
      const rpg=/RPG|Panzer/i.test(nm),drum=/MGL|Milkor/i.test(nm),m79=/M79/i.test(nm);
      if(m79){C(M.metal,1.8,12,8,1.6,0,14);B(M.wood,10,3,2.6,-3,0,0,.08);grip(M.wood,0,-2.6,4.4,.3);B(M.metal,1,3,.6,5,3.6,0);break}
      if(drum){C(M.metal,3.4,5,5,0,0,12);for(let i=0;i<6;i++){const a=i*Math.PI/3;C(M.brass,.9,5.2,5,2.2*Math.cos(a),2.2*Math.sin(a),10)}C(M.metal,1.7,9,13,0,0,12);grip(M.poly,-1.5,-4,6);B(M.poly,8,3,2.4,-7,0,0);reddot(9,1.8);break}
      C(rpg?M.green:M.olive,1.6,30,9,1.2,0,14);C(M.metal,1.9,2,-5.5,1.2,0,14);
      if(rpg){C(M.green,1.6,5,26,1.2,0,14,3);C(M.olive,3,4.5,29.5,1.2,0,14,.1);B(M.wood,7,2.6,3.4,10,-.6,0);reddot(9,3);}
      grip(M.poly,4,-3.2,5.4);grip(M.poly,13,-3.2,5.4)}break;
    case 'rail':{B(M.metal,30,4,3,10,.8,0);for(let i=0;i<7;i++) C(M.glow,1.9,.6,8+i*3,.8,0,16);C(M.steel,.8,8,27,.8,0,10);grip(M.poly,1,-4,6.2);B(M.poly,8,3.4,2.4,-6,.2,0);scope(6,4.4,9,.9)}break;
    case 'crossbow':case 'bow':{
      if(k==='bow'){for(let i=-5;i<=5;i++){if(!i) continue;B(M.wood,1.4,2.6,1,0+Math.abs(i)*.45,i*2.3,0,i*.06)}B(M.rubber,1.8,4,1.6,0,0,0);B(M.poly,.15,25,.15,-2.5,0,0);break}
      B(M.wood,22,2.6,2.4,6,0,0);B(M.metal,14,.6,1.2,14,1.6,0);for(const s of[-1,1]) B(M.metal,1,1,10,20,1.2,s*5,0,s*.35);B(M.poly,.15,.15,18,15,1.4,0);
      grip(M.wood,1,-3.2,5.4);scope(8,3.6,7,.75);B(M.steel,10,.3,.3,15,2,0)}break;
    default:{B(M.metal,(wp.len||26),4,3,(wp.len||26)/2-4,0,0);grip(M.poly,2,-4,6.4);C(M.steel,.6,4,(wp.len||26)-3,.5,0,10)}
  }
  return parts;
}
// fusion par matériau ; la première pièce est la carcasse (elle reçoit la couleur du skin)
function fwGunGroup(w){
  const T=THREE,wp=WEAPONS[w];fwGunMats();
  let built=FWG.cache.get(w);
  if(!built){
    const parts=fwGunBuild(wp),by=new Map();
    for(const p of parts){let l=by.get(p.mat);if(!l){l=[];by.set(p.mat,l)}l.push(p)}
    built=[];
    for(const [mat,l] of by){
      let nv=0;for(const p of l) nv+=p.g.attributes.position.count;
      const P=new Float32Array(nv*3),N=new Float32Array(nv*3),I=[],nm=new T.Matrix3(),v=new T.Vector3();let base=0;
      for(const p of l){const g=p.g,pa=g.attributes.position,na=g.attributes.normal,n=pa.count;nm.getNormalMatrix(p.m);
        for(let i=0;i<n;i++){v.fromBufferAttribute(pa,i).applyMatrix4(p.m);P.set([v.x,v.y,v.z],(base+i)*3);v.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();N.set([v.x,v.y,v.z],(base+i)*3)}
        const ix=g.index.array;for(let k=0;k<ix.length;k++) I.push(ix[k]+base);base+=n}
      const bg=new T.BufferGeometry();bg.setAttribute('position',new T.BufferAttribute(P,3));bg.setAttribute('normal',new T.BufferAttribute(N,3));bg.setIndex(new T.BufferAttribute(base>65535?new Uint32Array(I):new Uint16Array(I),1));bg.computeBoundingSphere();
      built.push({geo:bg,mat,main:mat===FWG.mats.metal||mat===FWG.mats.orange});
    }
    built.sort((a,b)=>(b.main?1:0)-(a.main?1:0));
    FWG.cache.set(w,built);
  }
  return built.map(b=>{const m=new T.Mesh(b.geo,b.mat);m.castShadow=true;return m});
}
// remplace l'ancien modèle (boîtes) : mêmes appels, même repère
g3Gun=function(P,w){
  if(P.gun.userData.w===w) return;P.gun.userData.w=w;while(P.gun.children.length) P.gun.remove(P.gun.children[0]);
  const wp=WEAPONS[w];if(!wp) return;
  if(wp.hands){const a=new THREE.Group(),b=new THREE.Group();for(const m of fwGunGroup(wp.hi[0])) a.add(m);for(const m of fwGunGroup(wp.hi[1])) b.add(m);a.position.z=-4;b.position.z=4;P.gun.add(a);P.gun.add(b);return}
  for(const m of fwGunGroup(w)) P.gun.add(m);
};
// ===== physique des armes : recul (la visée monte puis revient en partie), dispersion horizontale, balancement, douilles, perte de dégâts avec la distance =====
const FW_RECOIL={pistol:[.016,.006],revolver:[.034,.008],deagle:[.05,.012],smg:[.007,.006],ak:[.013,.008],m4:[.009,.005],lmg:[.01,.008],minigun:[.003,.004],
  dmr:[.028,.006],barrett:[.07,.012],shotgun:[.05,.012],launcher:[.035,.008],flamer:[.001,.002],nailgun:[.006,.004],laser:[.004,.002],rail:[.04,.006],crossbow:[.012,.004],bow:[.008,.004]};
function fwRecoil(wp){
  if(FW.vr||wp.melee) return;
  const r=FW_RECOIL[wp.kind]||[.01,.005],ads=1-.35*(FW.adsK||0),cr=1-.25*(FW.crouch||0);
  const v=r[0]*ads*cr*(.85+Math.random()*.3),h=(Math.random()-.5)*2*r[1]*ads*cr;
  FW.pitch+=v;FW.yaw+=h;FW.recRec=(FW.recRec||0)+v*.7;FW.recWait=7;                    // après la rafale, ~70 % de la montée revient (le tireur compense)
  FW.vmKick=Math.min(1.6,(FW.vmKick||0)+r[0]*22);
  {const ck=typeof fwCycleKind==='function'&&fwCycleKind(wp);if(ck) FW.cyc={t:-90,d:Math.min(650,Math.max(260,(wp.rate||500)*.75)),k:ck}}   // réarmement juste après le recul
  fwCasing(wp);
}
function fwRecoilTick(dt){
  const k=dt/16.7;
  if(FW.recWait>0) FW.recWait-=k;
  else if(FW.recRec>0){const s=Math.min(FW.recRec,FW.recRec*.14*k+.0003*k);FW.pitch-=s;FW.recRec-=s}
  FW.vmKick=Math.max(0,(FW.vmKick||0)-.12*k*(1+(FW.vmKick||0)));
  for(const c of FW.cas||[]) if(c.life>0){
    c.life-=k;c.vy-=.32*k;c.x+=c.vx*k;c.y+=c.vy*k;c.z+=c.vz*k;c.m.rotation.x+=c.sx*k;c.m.rotation.z+=c.sz*k;
    const g=(typeof fwSupportY==='function'?fwSupportY(c.x,c.z,c.y+4):0)+.8;
    if(c.y<g){c.y=g;if(Math.abs(c.vy)>.6){c.vy=-c.vy*.35;c.vx*=.6;c.vz*=.6;if(c.y<FW.y+200&&Math.random()<.5) try{sfx('click')}catch(e){}}else{c.vy=0;c.vx*=.8;c.vz*=.8;c.sx*=.7;c.sz*=.7}}
    c.m.position.set(c.x,c.y,c.z);if(c.life<=0) c.m.visible=false;
  }
}
function fwCasing(wp){
  const no={flamer:1,laser:1,rail:1,crossbow:1,bow:1,launcher:1,nailgun:1};if(no[wp.kind]||!FW.cas) return;
  const T=THREE;let c=FW.cas.find(q=>q.life<=0);if(!c) c=FW.cas[(FW.casI=(FW.casI||0)+1)%FW.cas.length];
  const sg=wp.kind==='shotgun',big=wp.kind==='barrett'||wp.kind==='dmr'||wp.kind==='lmg'||wp.kind==='minigun';
  c.m.material=sg?FW.casMatS:FW.casMat;c.m.scale.set(sg?1.6:1,sg?3.4:big?3.2:2,sg?1.6:1);
  const cam=FW.cam,f=new T.Vector3(),r=new T.Vector3(),u=new T.Vector3();cam.getWorldDirection(f);r.crossVectors(f,cam.up).normalize();u.crossVectors(r,f).normalize();
  const p=cam.position;c.x=p.x+f.x*18+r.x*7-u.x*5;c.y=p.y+f.y*18+r.y*7-u.y*5;c.z=p.z+f.z*18+r.z*7-u.z*5;
  const sp=2.2+Math.random()*1.2;c.vx=r.x*sp+f.x*.4+(Math.random()-.5)*.6;c.vy=2.4+Math.random()*1.2;c.vz=r.z*sp+f.z*.4+(Math.random()-.5)*.6;
  c.sx=(Math.random()-.5)*.8;c.sz=.4+Math.random()*.5;c.life=150;c.m.visible=true;c.m.position.set(c.x,c.y,c.z);
}
function fwCasingPool(sc){
  const T=THREE;FW.cas=[];FW.casMat=new T.MeshStandardMaterial({color:0xc9a043,metalness:.95,roughness:.3});FW.casMatS=new T.MeshStandardMaterial({color:0x9a1c16,metalness:.2,roughness:.5});
  const g=new T.CylinderGeometry(.55,.55,1,8);
  for(let i=0;i<28;i++){const m=new T.Mesh(g,FW.casMat);m.visible=false;m.frustumCulled=false;sc.add(m);FW.cas.push({m,life:0,x:0,y:0,z:0,vx:0,vy:0,vz:0,sx:0,sz:0})}
}
// perte de dégâts avec la distance (balles d'arme de poing et de pistolet-mitrailleur surtout ; les fusils de précision n'en perdent pas)
function fwFalloff(wp,t){
  const k=wp.kind;
  if(k==='pistol'||k==='revolver'||k==='deagle'||k==='smg'||k==='nailgun') return Math.max(.55,1-.45*Math.max(0,(t-500)/1300));
  if(k==='ak'||k==='m4'||k==='lmg'||k==='minigun') return Math.max(.78,1-.22*Math.max(0,(t-1000)/2000));
  return 1;
}
