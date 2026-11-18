// ===== V0.80 : MODÈLES 3D RÉELS (CC0, KayKit : City Builder Bits) — voitures, bouches d'incendie, feux, bancs, bennes, buissons… =====
// Les modèles sont intégrés dans js/models-city.js (glTF + données en base64) : aucun serveur nécessaire. Posés en instances (un seul appel de rendu par pièce) une fois chargés ;
// les collisions sont créées tout de suite à la construction de la ville (identiques chez tous les joueurs). Sans modèles, le décor d'origine reste affiché.
const FWM={st:'idle',m:{},cbs:[],S:223};   // S : échelle (1 unité du modèle = S unités de jeu ; une voiture fait ~210 de long)
const FW_CARS=['car_hatchback','car_police','car_sedan','car_stationwagon','car_taxi'];
function fwModelsLoad(cb){
  if(FWM.st==='ready'||FWM.st==='err'){if(FWM.st==='ready') cb();return}
  FWM.cbs.push(cb);if(FWM.st==='load') return;
  if(typeof FW_MODELS==='undefined'||!window.THREE||!THREE.GLTFLoader){FWM.st='err';return}
  FWM.st='load';
  const L=new THREE.GLTFLoader(),names=Object.keys(FW_MODELS);let n=names.length;
  const end=()=>{if(--n>0) return;FWM.st='ready';const c=FWM.cbs;FWM.cbs=[];for(const f of c){try{f()}catch(e){console.error(e)}}};
  for(const k of names){
    const j=FW_MODELS[k];for(const im of j.images||[]) im.uri=FW_MODELS_TEX;
    try{L.parse(JSON.stringify(j),'',g=>{try{FWM.m[k]=fwModelPrep(g.scene)}catch(e){console.warn('modèle',k,e)}end()},e=>{console.warn('modèle',k,e);end()})}catch(e){console.warn('modèle',k,e);end()}
  }
}
function fwModelPrep(root){
  const T=THREE,parts=[],cache=new Map();root.updateMatrixWorld(true);
  const mat=src=>{let m=cache.get(src);if(m) return m;const t=src.map;if(t){t.encoding=T.LinearEncoding;t.needsUpdate=true}
    m=fwPbr()?new T.MeshStandardMaterial({map:t,roughness:.72,metalness:.08,envMapIntensity:.5}):new T.MeshLambertMaterial({map:t});cache.set(src,m);return m};
  let minY=1e9;
  root.traverse(o=>{if(!o.isMesh) return;o.geometry.computeBoundingBox();const bb=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);minY=Math.min(minY,bb.min.y);
    parts.push({geo:o.geometry,mat:mat(Array.isArray(o.material)?o.material[0]:o.material),mtx:o.matrixWorld.clone()})});
  return{parts,minY};
}
// spots : [{n,x,z,ry,s}] — pose les modèles (instances) dans la scène sc, puis cache les décors de remplacement (s.g)
function fwModelsPlace(sc,spots){
  const T=THREE,by={};for(const s of spots) if(FWM.m[s.n]) (by[s.n]=by[s.n]||[]).push(s);
  const M=new T.Matrix4(),R=new T.Matrix4(),S=new T.Matrix4();
  for(const n in by){
    const list=by[n],mod=FWM.m[n];
    for(const p of mod.parts){
      const im=new T.InstancedMesh(p.geo,p.mat,list.length);im.frustumCulled=false;im.castShadow=true;im.receiveShadow=true;
      list.forEach((s,i)=>{const k=s.s||FWM.S;M.makeTranslation(s.x,-mod.minY*k,s.z);R.makeRotationY(s.ry||0);S.makeScale(k,k,k);M.multiply(R).multiply(S).multiply(p.mtx);im.setMatrixAt(i,M)});
      im.instanceMatrix.needsUpdate=true;sc.add(im);
    }
    for(const s of list) if(s.g) s.g.visible=false;
  }
}
function fwModelsApply(sc){FW.mdScene=sc;fwModelsLoad(()=>{if(FW.scene===sc&&FW.spots&&!FW.spotsDone){FW.spotsDone=true;fwModelsPlace(sc,FW.spots)}})}
// ----- mobilier urbain : emplacement tiré d'un générateur à part (la disposition de la ville ne change pas) ; collisions immédiates -----
const FW_PROPS=[
  {n:'firehydrant',w:2,k:1,r:11,h:50,y:1},{n:'trash_A',w:2,k:1,r:0},{n:'trash_B',w:1,k:1.3,r:0},{n:'bench',w:1.4,k:1.15,bx:[96,32],h:34,face:1},
  {n:'bush',w:1.6,k:1.15,r:20,h:80},{n:'box_A',w:1.6,k:1.1,r:24,h:42,sup:1},{n:'box_B',w:1.2,k:1.1,r:20,h:36,sup:1},{n:'dumpster',w:.8,k:1,bx:[126,70],h:72,face:1}];
function fwPropsLayout(sc,seed){
  const rp=fwRng((seed|0)^0x2545f491),half=FW_N*FW_P/2,tot=FW_PROPS.reduce((a,p)=>a+p.w,0);
  const pickProp=()=>{let t=rp()*tot;for(const p of FW_PROPS){t-=p.w;if(t<=0) return p}return FW_PROPS[0]};
  const add=(p,x,z,ry,k)=>{
    FW.spots.push({n:p.n,x,z,ry,s:FWM.S*(p.k||1)*(k||1)});
    if(p.bx){const cs=Math.abs(Math.cos(ry)),sn=Math.abs(Math.sin(ry)),w=p.bx[0]*cs+p.bx[1]*sn,d=p.bx[0]*sn+p.bx[1]*cs;fwAddCol(x-w/2,z-d/2,x+w/2,z+d/2,p.h,'p')}
    else if(p.r) fwAddCol(x-p.r,z-p.r,x+p.r,z+p.r,p.h,'p');
  };
  for(let i=0;i<FW_N;i++) for(let j=0;j<FW_N;j++){
    const cx=(i-(FW_N-1)/2)*FW_P,cz=(j-(FW_N-1)/2)*FW_P;
    for(const [nx,nz] of[[0,-1],[0,1],[-1,0],[1,0]]){
      for(let a=0;a<3;a++){
        if(rp()>.5) continue;
        const t=(rp()<.5?-1:1)*(110+rp()*120),p=pickProp(),hd=p.bx?p.bx[1]/2:(p.r||12),d=322+hd,x=cx+nx*d+(nz?t:0),z=cz+nz*d+(nx?t:0),e=(p.bx?p.bx[0]/2:hd)+12;   // au moins 40 entre le mur et l'objet : on peut toujours passer
        if(fwSolid(x,z,10)||fwSolid(x+e,z,10)||fwSolid(x-e,z,10)||fwSolid(x,z+e,10)||fwSolid(x,z-e,10)||fwSolid(x+e,z+e,10)||fwSolid(x-e,z-e,10)||fwSolid(x+e,z-e,10)||fwSolid(x-e,z+e,10)) continue;
        const ry=Math.atan2(-nx,-nz)+(p.face?0:rp()*6.28);                          // bancs et bennes : dos à la rue
        add(p,x,z,ry+(nz?0:0));
      }
    }
  }
  // feux tricolores aux angles des carrefours (le coin « ++ » est déjà occupé par un lampadaire)
  for(let k=1;k<FW_N;k++) for(let l=1;l<FW_N;l++){
    const x0=k*FW_P-half,z0=l*FW_P-half;
    for(const [sx,sz,m] of[[-1,1,'trafficlight_B'],[1,-1,'trafficlight_A'],[-1,-1,'trafficlight_B']]){
      const x=x0+sx*124,z=z0+sz*124;if(fwSolid(x,z,10)) continue;
      FW.spots.push({n:m,x,z,ry:Math.atan2(-sx,-sz),s:FWM.S});fwAddCol(x-7,z-7,x+7,z+7,200,'p');
    }
  }
}
