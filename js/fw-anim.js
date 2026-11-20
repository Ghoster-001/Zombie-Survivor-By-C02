// ===== V0.83 : ANIMATIONS RÉALISTES (3D) — coups de mêlée à images clés (diagonales, revers, estoc, coup vertical, balayage), réarmement pompe/culasse,
// gant et manche du joueur, démarche des zombies (boiterie, balancement, tête qui pend, bras tendus, griffure en diagonale) =====
// Images clés : [instant 0..1, dx, dy, dz, rx, ry, rz] dans le repère de la caméra (x droite, y haut, -z devant). Impact à 0,42 (moment où les dégâts sont appliqués).
const FW_MELEE={
  diagA:[[0,0,0,0,0,0,0],[.28,9,14,4,-.35,.45,-1.1],[.42,-4,3,-11,.25,-.3,.5],[.6,-16,-12,-5,.5,-.6,1.0],[1,0,0,0,0,0,0]],          // haut droite → bas gauche
  diagB:[[0,0,0,0,0,0,0],[.28,-12,-12,1,.4,-.5,.9],[.42,2,2,-11,-.1,.25,-.3],[.6,13,13,-4,-.4,.55,-1.0],[1,0,0,0,0,0,0]],             // revers : bas gauche → haut droite
  stab:[[0,0,0,0,0,0,0],[.3,2,-1,6,.12,0,0],[.42,-2,1,-17,-.06,0,0],[.6,-1,0,-12,0,0,0],[1,0,0,0,0,0,0]],
  chop:[[0,0,0,0,0,0,0],[.3,-2,12,5,-1.15,0,.15],[.42,-3,-3,-9,.75,0,0],[.6,-3,-10,-4,1.1,0,0],[1,0,0,0,0,0,0]],                   // coup vertical par-dessus la tête
  sweep:[[0,0,0,0,0,0,0],[.3,13,3,4,0,.95,-.3],[.42,-5,0,-11,0,-.55,.2],[.62,-17,-2,-4,0,-1.15,.3],[1,0,0,0,0,0,0]],               // balayage horizontal
  saw:[[0,0,0,0,0,0,0],[.25,0,-2,5,.1,0,0],[.42,0,0,-13,-.05,0,0],[.75,0,0,-11,0,0,0],[1,0,0,0,0,0,0]]
};
function fwMeleeStyle(wp){
  const k=wp.kind;FW.swN=(FW.swN||0)+1;
  if(k==='knife') return ['diagA','diagB','stab'][FW.swN%3];
  if(k==='blade') return FW.swN%2?'diagB':'diagA';
  if(k==='axe'||k==='hammer') return 'chop';
  if(k==='bat'||k==='scythe') return 'sweep';
  if(k==='chainsaw') return 'saw';
  return FW.swN%2?'diagB':'diagA';
}
const fwEase=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function fwMeleePose(sw){
  const keys=FW_MELEE[sw.k]||FW_MELEE.diagA,p=Math.min(1,sw.t/sw.d),amp=sw.amp||1;
  let i=0;while(i<keys.length-2&&p>keys[i+1][0]) i++;
  const a=keys[i],b=keys[i+1],u=fwEase(Math.max(0,Math.min(1,(p-a[0])/Math.max(1e-4,b[0]-a[0])))),o=[];
  for(let j=1;j<7;j++) o.push((a[j]+(b[j]-a[j])*u)*(j<4?amp:Math.min(1.3,amp)));
  if(sw.k==='saw'&&p>.35&&p<.8){o[0]+=(Math.random()-.5)*.8;o[1]+=(Math.random()-.5)*.8}            // vibration de la tronçonneuse
  return o;
}
// réarmement après chaque tir : coup de pompe (fusils à pompe) ou manœuvre de culasse (armes à verrou)
function fwCycleKind(wp){
  if(wp.kind==='shotgun'&&!/SPAS|KSG|Benelli|AA-12|Saiga|USAS|1887|Winchester/i.test(wp.name)) return 'pump';
  if(/1887|Winchester/i.test(wp.name)) return 'lever';
  if((wp.kind==='dmr'||wp.kind==='barrett')&&/Mosin|Kar98|Lee|Springfield|Remington 700|AWM|M24|Hécate|M200|CheyTac|M99/i.test(wp.name)) return 'bolt';
  return null;
}
function fwCyclePose(){
  const c=FW.cyc;if(!c) return null;c.t+=16.7;const p=Math.min(1,c.t/c.d);if(p>=1){FW.cyc=null;return null}
  const s=Math.sin(p*Math.PI);
  if(c.k==='pump') return [-1*s,-1.5*s,4*s,.08*s,0,.22*s];
  if(c.k==='lever') return [0,-2*s,2*s,.25*s,0,0];
  return [1.5*s,-2.5*s,2.5*s,0,.18*s,-.38*s];                                                       // culasse : l'arme pivote vers la gauche
}
// gant + manche (couleur de la tenue du joueur) à la place de la sphère
function fwBuildHands(){
  const T=THREE,g=new T.Group(),look=(typeof g3Look==='function'&&g3Look())||{},pbr=!!FXF.refl;
  const mk=c=>pbr?new T.MeshStandardMaterial({color:c,roughness:.8,metalness:0}):new T.MeshLambertMaterial({color:c});
  const glove=mk(0x24211f),sleeve=mk(new T.Color(look.top||'#3e4430').getHex()),cuff=mk(0x151515);
  const box=(m,sx,sy,sz,x,y,z,q)=>{const b=new T.Mesh(new T.BoxGeometry(sx,sy,sz),m);b.position.set(x,y,z);if(q) b.quaternion.copy(q);g.add(b)};
  const qz=new T.Quaternion().setFromEuler(new T.Euler(0,0,.28));
  box(glove,3.2,4.2,2.9,.3,-3.6,0,qz);box(glove,1.2,3.4,3,2.1,-3.4,0,qz);box(glove,2.6,1.2,1.2,1.4,-1.3,1.4);            // paume, doigts, pouce
  const d=new T.Vector3(-10,-6,7).normalize(),qa=new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),d);
  box(cuff,1.8,3.4,3.4,-1.4,-5.8,1,qa);box(sleeve,10,3.6,3.6,-1.4+d.x*5.8,-5.8+d.y*5.8,1+d.z*5.8,qa);                   // poignet, avant-bras
  return g;
}
// démarche des zombies : boiterie, poids qui bascule, tête qui pend, bras tendus en avant, griffure en diagonale
function fwZombieGait(z,P_,lg){
  if(z.limp===undefined){z.limp=Math.random()*.55;z.hd=(Math.random()-.5)*.5}
  const s=z.step*3,sw=Math.sin(s),cw=Math.cos(s),lim=z.limp;
  P_.legL.rotation.z=sw*.72;P_.legR.rotation.z=-sw*.72*(1-lim);P_.legR.rotation.x=lim*.18;
  P_.body.rotation.z=-.13-lg*.35;P_.body.rotation.x=sw*.07+lim*.06;P_.body.position.y=Math.abs(cw)*1.4-(sw>0?lim*1.5:0);
  if(P_.head){P_.head.rotation.x=z.hd+Math.sin(s*.5)*.12;P_.head.rotation.z=-.18+Math.sin(s*.37)*.1}
  P_.armL.rotation.z=1.3+Math.sin(s*.66)*.16+lg*.95;P_.armR.rotation.z=1.32+Math.sin(s*.66+Math.PI)*.16+lg*1.05;
  P_.armL.rotation.x=lg*.45-.08;P_.armR.rotation.x=-lg*.45+.08;
}
