// ===== V0.82 : OPTIMISATION 3D — fusion des objets fixes (moins d'appels de rendu), réglages par profil (distance de vue, ombres, résolution, meubles) =====
// Les objets fixes de la ville (lampadaires, tonneaux, passages piétons, façades…) qui ont le même aspect sont regroupés en un seul maillage par zone
// de 1800 unités : la carte graphique les dessine en un appel au lieu de centaines, et les zones hors champ restent ignorées.
function fwMatSig(m){
  const h=c=>c&&c.getHex?c.getHex():'',u=t=>t?t.uuid:'';
  return [m.type,h(m.color),h(m.emissive),u(m.map),u(m.alphaMap),u(m.normalMap),u(m.roughnessMap),u(m.emissiveMap),m.side,m.shadowSide,m.transparent?1:0,m.opacity,m.blending,m.vertexColors?1:0,m.fog?1:0,m.depthWrite?1:0,m.depthTest?1:0,m.alphaTest,m.toneMapped?1:0,m.roughness,m.metalness,m.envMapIntensity,m.emissiveIntensity].join('|');
}
function fwBatchStatic(sc){
  const T=THREE,keep=new Set(),groups=new Map(),mats=new Map();
  for(const f of FW.fires||[]) keep.add(f.m);
  for(const s of FW.spots||[]) if(s.g) keep.add(s.g);                                 // voitures de secours : cachées quand les modèles arrivent
  // groupes fixes (enseignes…) : leurs maillages sont remontés directement dans la scène pour pouvoir être fusionnés
  for(const o of sc.children.slice()){
    if(!o.isGroup||o.matrixAutoUpdate||keep.has(o)||o.userData.keep||!o.visible) continue;
    o.updateMatrixWorld(true);const kids=[];o.traverse(c=>{if(c!==o) kids.push(c)});
    if(kids.some(c=>!c.isMesh||c.children.length)) continue;
    for(const c of kids){const m=c.matrixWorld.clone();o.remove(c);m.decompose(c.position,c.quaternion,c.scale);c.updateMatrix();c.matrixAutoUpdate=false;sc.add(c)}
    sc.remove(o);
  }
  let before=0;
  const addPiece=(o,mat,start,count)=>{
    const g=o.geometry;if(!g.boundingSphere) g.computeBoundingSphere();
    const c=g.boundingSphere.center.clone().applyMatrix4(o.matrixWorld);
    const attrs=['position','normal','uv','color'].filter(k=>g.attributes[k]).join(',');
    const sig=fwMatSig(mat);let m=mats.get(sig);if(!m){m=mat;mats.set(sig,m)}
    const key=sig+'#'+attrs+'#'+(o.castShadow?1:0)+(o.receiveShadow?1:0)+'#'+o.renderOrder+'#'+Math.floor(c.x/1800)+','+Math.floor(c.z/1800);
    let gr=groups.get(key);if(!gr){gr={mat:m,list:[],o,attrs:attrs.split(',')};groups.set(key,gr)}
    gr.list.push({o,start,count});
  };
  const merged=new Set();
  for(const o of sc.children.slice()){
    if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.matrixAutoUpdate||!o.visible||keep.has(o)||o===FW.sky||o.userData.keep) continue;
    const g=o.geometry;if(!g||!g.attributes.position||!g.attributes.normal||g.morphAttributes&&Object.keys(g.morphAttributes).length) continue;
    o.updateMatrixWorld(true);before++;
    if(Array.isArray(o.material)){                                                   // pavé à plusieurs matériaux (tours de bordure) : une pièce par groupe de faces
      if(!g.index||!g.groups||!g.groups.length) continue;
      for(const gp of g.groups){const mt=o.material[gp.materialIndex];if(mt) addPiece(o,mt,gp.start,gp.count)}
    } else addPiece(o,o.material,0,g.index?g.index.count:g.attributes.position.count);
    merged.add(o);
  }
  let after=0;
  const nm=new T.Matrix3(),v=new T.Vector3();
  for(const gr of groups.values()){
    let batch=[],nv=0;
    const flush=()=>{
      if(!batch.length) return;
      const P=new Float32Array(nv*3),N=new Float32Array(nv*3),U=gr.attrs.includes('uv')?new Float32Array(nv*2):null,C=gr.attrs.includes('color')?new Float32Array(nv*3):null,I=[];
      let base=0;
      for(const {o,start,count} of batch){
        const g=o.geometry,pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv,ca=g.attributes.color,n=pa.count;nm.getNormalMatrix(o.matrixWorld);
        for(let i=0;i<n;i++){
          v.fromBufferAttribute(pa,i).applyMatrix4(o.matrixWorld);P[(base+i)*3]=v.x;P[(base+i)*3+1]=v.y;P[(base+i)*3+2]=v.z;
          v.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();N[(base+i)*3]=v.x;N[(base+i)*3+1]=v.y;N[(base+i)*3+2]=v.z;
          if(U){U[(base+i)*2]=ua.getX(i);U[(base+i)*2+1]=ua.getY(i)}
          if(C){C[(base+i)*3]=ca.getX(i);C[(base+i)*3+1]=ca.getY(i);C[(base+i)*3+2]=ca.getZ(i)}
        }
        if(g.index){const ix=g.index.array;for(let k=start;k<start+count;k++) I.push(ix[k]+base)}else for(let k=start;k<start+count;k++) I.push(k+base);
        base+=n;
      }
      const bg=new T.BufferGeometry();bg.setAttribute('position',new T.BufferAttribute(P,3));bg.setAttribute('normal',new T.BufferAttribute(N,3));
      if(U) bg.setAttribute('uv',new T.BufferAttribute(U,2));if(C) bg.setAttribute('color',new T.BufferAttribute(C,3));
      bg.setIndex(new T.BufferAttribute(base>65535?new Uint32Array(I):new Uint16Array(I),1));bg.computeBoundingSphere();
      const m=new T.Mesh(bg,gr.mat);m.castShadow=gr.o.castShadow;m.receiveShadow=gr.o.receiveShadow;m.renderOrder=gr.o.renderOrder;m.matrixAutoUpdate=false;m.updateMatrix();
      sc.add(m);after++;batch=[];nv=0;
    };
    for(const it of gr.list){const n=it.o.geometry.attributes.position.count;if(nv+n>65000) flush();batch.push(it);nv+=n}
    flush();
  }
  for(const o of merged) sc.remove(o);
  FW.batchInfo={before,after};
}
// réglages qui dépendent du profil graphique (appelé à chaque image : rien n'est recompilé)
function fwPerfTick(cam){
  const lite=!FXF.lights,eco=FXF.fps<=30||(!FXF.lights&&!FXF.fog&&FXF.anim===0);
  // distance de vue : courte sur les profils légers (la brume masque la coupure), longue en altitude (avion, parachute)
  const far=(FW.y||0)>500?(FW_N>8?7200:4200):(lite?(eco?2400:3000):(FW_N>8?7200:4200));
  if(cam.far!==far){cam.far=far;cam.updateProjectionMatrix()}
  if(lite&&FW.scene.fog) FW.scene.fog.density=Math.max(FW.scene.fog.density,eco?.00085:.0007);
  FW.furR=lite?(eco?480:600):760;FW.unfR=FW.furR+420;
  if(FW.lampSpr&&FW.lampSprOn!==!lite){FW.lampSprOn=!lite;for(const s of FW.lampSpr) s.visible=!lite}   // halos des lampadaires : coupés sur les profils légers
}
// Personnages (zombies) : les pièces fixes de chaque articulation sont fusionnées en un maillage à couleurs de sommets ; les articulations animées restent séparées.
function fwMergeRig(root){
  const T=THREE,P=root.userData&&root.userData.P,refs=new Set();
  if(P) for(const k in P){const v=P[k];if(v&&v.isObject3D) refs.add(v);else if(Array.isArray(v)) v.forEach(x=>{if(x&&x.isObject3D) refs.add(x)})}
  const mat=G3.vcLam||(G3.vcLam=new T.MeshLambertMaterial({vertexColors:true}));
  const ok=o=>o.isMesh&&!o.isSkinnedMesh&&o.children.length===0&&!refs.has(o)&&!Array.isArray(o.material)&&o.material.type==='MeshLambertMaterial'&&!o.material.map&&!o.material.transparent&&(!o.material.emissive||o.material.emissive.getHex()===0)&&o.geometry&&o.geometry.attributes.normal;
  const walk=node=>{
    for(const c of node.children.slice()) if(c.children.length) walk(c);
    const list=node.children.filter(ok);if(list.length<2) return;
    let nv=0;for(const o of list) nv+=o.geometry.attributes.position.count;
    const Pp=new Float32Array(nv*3),N=new Float32Array(nv*3),C=new Float32Array(nv*3),I=[],nm=new T.Matrix3(),v=new T.Vector3();let base=0,cast=false;
    for(const o of list){
      o.updateMatrix();nm.getNormalMatrix(o.matrix);const g=o.geometry,pa=g.attributes.position,na=g.attributes.normal,n=pa.count,col=o.material.color;cast=cast||o.castShadow;
      for(let i=0;i<n;i++){v.fromBufferAttribute(pa,i).applyMatrix4(o.matrix);Pp.set([v.x,v.y,v.z],(base+i)*3);v.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();N.set([v.x,v.y,v.z],(base+i)*3);C.set([col.r,col.g,col.b],(base+i)*3)}
      if(g.index){const ix=g.index.array;for(let k=0;k<ix.length;k++) I.push(ix[k]+base)}else for(let k=0;k<n;k++) I.push(k+base);
      base+=n;node.remove(o);
    }
    const bg=new T.BufferGeometry();bg.setAttribute('position',new T.BufferAttribute(Pp,3));bg.setAttribute('normal',new T.BufferAttribute(N,3));bg.setAttribute('color',new T.BufferAttribute(C,3));
    bg.setIndex(new T.BufferAttribute(base>65535?new Uint32Array(I):new Uint16Array(I),1));bg.computeBoundingSphere();
    const m=new T.Mesh(bg,mat);m.castShadow=cast;m.receiveShadow=true;node.add(m);
  };
  walk(root);return root;
}
// Préconstruction pendant le salon multijoueur 3D : la ville (graine partagée) et les shaders sont prêts avant le départ,
// le lancement de la partie ne fige plus le jeu (sur un petit appareil, un gel de plusieurs secondes coupait la connexion).
function fwPrebuild(n,seed){
  if(!seed||FW.on) return;
  if(G3.status!=='ready'){if(G3.status==='idle') g3Request();clearTimeout(FW.preT);FW.preT=setTimeout(()=>fwPrebuild(n,seed),400);return}
  if(FW.built&&FW.bN===n&&FW.bSeed===seed) return;
  clearTimeout(FW.preT);
  FW.preT=setTimeout(()=>{
    if(FW.on||(FW.built&&FW.bN===n&&FW.bSeed===seed)) return;
    try{fwBuild(n,seed);FW.worldSeed=seed;if(MP) MP.lastSnapAt=performance.now();try{G3.r.compile(FW.scene,FW.cam)}catch(e){}}catch(e){console.warn('préconstruction',e)}
    if(MP) MP.lastSnapAt=performance.now();
  },60);
}
