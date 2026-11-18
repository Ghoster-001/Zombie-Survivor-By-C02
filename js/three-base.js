// ===== V0.59 : MODE 3D — le décor et les personnages sont de vrais objets 3D (perspective, lumières, ombres) ; objets, effets et interface restent dessinés par-dessus =====
// La ligne de jeu reste le plan z = 0 vu de face : la correspondance avec l'écran est exacte, la visée et les bulles de vie restent justes.
const G3={on:false,skip:false,status:'idle',err:'',r:null,scene:null,cam:null,cv:null,ent:new Map(),W:0,H:0,R:0,key:'',world:null,lights:[],lamps:[],sun:null,hemi:null,flash:null,mats:new Map(),geo:{},texC:new Map(),sunSpr:null,fx:0};
const THREE_URL='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
function g3Fail(){gameMode='2D';SET.m3=false;saveOpts();flash('3D indisponible : '+G3.err)}
function g3Request(){
  if(G3.status==='ready'||G3.status==='load') return;
  G3.status='load';G3.err='';
  const done0=()=>{try{g3Setup();G3.status='ready'}catch(e){G3.status='err';G3.err='WebGL non disponible';g3Fail()}};
  const done=()=>{                                                           // chargeur de modèles glTF (facultatif : sans lui le décor d'origine reste affiché)
    if(THREE.GLTFLoader){done0();return}
    const s2=document.createElement('script');s2.src='js/vendor/GLTFLoader.js?v='+GAME_VERSION;s2.onload=done0;s2.onerror=done0;document.head.appendChild(s2)};
  if(window.THREE){done();return}
  const s=document.createElement('script');s.src=THREE_URL;s.integrity='sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu';s.crossOrigin='anonymous';
  s.onload=()=>{if(window.THREE) done();else{G3.status='err';G3.err='module 3D introuvable';g3Fail()}};
  s.onerror=()=>{G3.status='err';G3.err='hors ligne ?';g3Fail()};
  document.head.appendChild(s);
}
const g3Active=()=>false;   // V0.61 : l'ancienne vue de côté hybride est remplacée par le monde libre (voir plus bas)
function g3Setup(){
  const T=THREE,cv3=document.createElement('canvas');
  const r=new T.WebGLRenderer({canvas:cv3,antialias:true,alpha:false,powerPreference:'high-performance'});
  r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;
  G3.r=r;G3.cv=cv3;G3.scene=new T.Scene();G3.cam=new T.PerspectiveCamera(40,16/9,10,9000);
  G3.hemi=new T.HemisphereLight(0xffffff,0x2a2220,.8);G3.scene.add(G3.hemi);
  G3.sun=new T.DirectionalLight(0xffffff,.9);G3.sun.castShadow=true;G3.sun.shadow.mapSize.set(2048,1024);
  const sc=G3.sun.shadow.camera;sc.left=-760;sc.right=760;sc.top=320;sc.bottom=-120;sc.near=10;sc.far=2200;G3.sun.shadow.bias=-.0008;
  G3.scene.add(G3.sun);G3.scene.add(G3.sun.target);
  for(let i=0;i<4;i++){const l=new T.PointLight(0xffc880,0,360,2);G3.scene.add(l);G3.lights.push(l)}
  G3.flash=new T.PointLight(0xffd090,0,460,2);G3.scene.add(G3.flash);
  const g=G3.geo;g.box=new T.BoxGeometry(1,1,1);g.sph=new T.SphereGeometry(1,14,10);g.cyl=new T.CylinderGeometry(1,1,1,14);g.cone=new T.ConeGeometry(1,1,14);g.pl=new T.PlaneGeometry(1,1);
}
function g3Mat(hex,o){const k=hex+(o?JSON.stringify(o):'');let m=G3.mats.get(k);if(!m){m=new THREE.MeshLambertMaterial(Object.assign({color:new THREE.Color(hex)},o||{}));G3.mats.set(k,m)}return m}
function g3Mesh(geo,hex,sx,sy,sz,x,y,z,o){const m=new THREE.Mesh(G3.geo[geo],g3Mat(hex,o));m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m}
function g3Tex(key,w,h,draw,repeat){
  let t=G3.texC.get(key);if(t) return t;
  const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  t=new THREE.CanvasTexture(c);if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping}G3.texC.set(key,t);return t;
}
// --- décor : ciel, sol, trottoir, immeubles aux fenêtres allumées, lampadaires, tonneaux, caisses, épaves, murs de béton ---
function g3BuildWorld(){
  const key=curMap.id+'|'+WORLD_W+'|'+PAL.sky[0]+'|'+(MP.rp?1:0);
  if(G3.key===key) return;G3.key=key;
  const T=THREE,sc=G3.scene;
  if(G3.world){sc.remove(G3.world);G3.world.traverse(o=>{if(o.geometry&&o.userData.own) o.geometry.dispose()})}
  G3.texC.clear();
  const g=new T.Group();G3.world=g;sc.add(g);
  sc.background=g3Tex('sky'+PAL.sky.join(),4,256,(c,w,h)=>{const gr=c.createLinearGradient(0,0,0,h);gr.addColorStop(0,PAL.sky[0]);gr.addColorStop(.45,PAL.sky[1]);gr.addColorStop(.8,PAL.sky[2]);gr.addColorStop(1,PAL.sky[3]);c.fillStyle=gr;c.fillRect(0,0,w,h)});
  const fogc=new T.Color(PAL.sky[2]);sc.fog=new T.Fog(fogc,700,3200);
  const wide=WORLD_W+7000,cxw=WORLD_W/2;
  const road=g3Tex('road'+PAL.road[0],256,256,(c,w,h)=>{c.fillStyle=PAL.road[0];c.fillRect(0,0,w,h);for(let i=0;i<1400;i++){c.fillStyle='rgba('+(i%2?'255,255,255':'0,0,0')+','+(.03+(i%5)*.01)+')';c.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*2)}c.strokeStyle='rgba(0,0,0,.4)';for(let i=0;i<10;i++){c.beginPath();let x=Math.random()*w,y=Math.random()*h;c.moveTo(x,y);for(let k=0;k<4;k++){x+=Math.random()*30-8;y+=Math.random()*18-9;c.lineTo(x,y)}c.stroke()}},true);
  road.repeat.set(wide/260,2600/260);
  const plane=new T.Mesh(G3.geo.pl,new T.MeshLambertMaterial({map:road}));plane.scale.set(wide,2600,1);plane.rotation.x=-Math.PI/2;plane.position.set(cxw,-8,300);plane.receiveShadow=true;g.add(plane);
  const lot=new T.Mesh(G3.geo.box,g3Mat(PAL.near));lot.scale.set(wide,8,2600);lot.position.set(cxw,-4,-1300-60);lot.receiveShadow=true;g.add(lot);       // terrain derrière le trottoir
  const walk=new T.Mesh(G3.geo.box,g3Mat(PAL.walk));walk.scale.set(wide,8,66);walk.position.set(cxw,-4,-27);walk.receiveShadow=true;g.add(walk);          // trottoir (la ligne de jeu est son bord avant)
  for(let x=-200;x<WORLD_W+200;x+=120){const m=new T.Mesh(G3.geo.box,g3Mat('#d8c46a'));m.scale.set(60,.6,6);m.position.set(x+30,-7.6,60);g.add(m)}  // marquage usé
  // immeubles : deux rangées (proche et lointaine) avec façades et fenêtres éclairées
  const facade=(far,v)=>g3Tex('fac'+(far?1:0)+v+PAL.win,64,128,(c,w,h)=>{c.fillStyle=far?PAL.far:PAL.near;c.fillRect(0,0,w,h);for(let wy=8;wy<h-8;wy+=22)for(let wx=6;wx<w-8;wx+=18){const k=((wx*7+wy*3+v*5)|0)%7;if(k>4&&!far){c.fillStyle='rgb('+PAL.win+')';c.fillRect(wx,wy,8,11)}else if(k>1){c.fillStyle=far?'rgba(0,0,0,.25)':'rgba(0,0,0,.55)';c.fillRect(wx,wy,8,11)}}},true);
  const emis=v=>g3Tex('em'+v+PAL.win,64,128,(c,w,h)=>{c.fillStyle='#000';c.fillRect(0,0,w,h);for(let wy=8;wy<h-8;wy+=22)for(let wx=6;wx<w-8;wx+=18){const k=((wx*7+wy*3+v*5)|0)%7;if(k>4){c.fillStyle='rgb('+PAL.win+')';c.fillRect(wx,wy,8,11)}}},true);
  const nb=BUILDINGS.length||40;
  const mkB=(x,w,h,z,far,i)=>{
    const v=i%3,tf=facade(far,v).clone(),te=emis(v).clone();tf.needsUpdate=te.needsUpdate=true;tf.repeat.set(Math.max(1,w/60),Math.max(1,h/110));te.repeat.copy(tf.repeat);
    const mat=new T.MeshLambertMaterial({color:0xffffff,map:tf,emissive:far?0x000000:0xffffff,emissiveMap:te,emissiveIntensity:far?0:.9});
    const m=new T.Mesh(G3.geo.box,mat);m.scale.set(w,h,w*.9);m.position.set(x,h/2,z);m.castShadow=false;m.receiveShadow=true;g.add(m);
    if(i%4===0){const t=new T.Mesh(G3.geo.box,g3Mat(far?PAL.far:PAL.near));t.scale.set(w*.4,h*.12,w*.3);t.position.set(x-w*.15,h+h*.06,z);g.add(t)}      // sommet en ruine
  };
  for(let i=0,x=-300;x<WORLD_W+300;i++){const b=BUILDINGS[i%nb],w=85+(i*29%55);mkB(x+w/2,w,b.h*1.5+40,-320-(i*37%70),false,i);x+=w+8+(i*13%30)}
  for(let i=0,x=-1200;x<WORLD_W+1400;i++){const b=BUILDINGS[(i*3)%nb],w=190+(i*41%110);mkB(x+w/2,w,b.h*2.4+120,-1050-(i*53%260),true,i);x+=w+10+(i*17%40)}
  // accessoires
  for(const x of LAMPS){const p=g3Mesh('cyl','#1a1a1c',2,100,2,x,50,-24);g.add(p);const a=g3Mesh('box','#1a1a1c',28,3,3,x+14,100,-24);g.add(a);const b=new T.Mesh(G3.geo.sph,new T.MeshBasicMaterial({color:0xffd890}));b.scale.set(5,5,5);b.position.set(x+27,97,-24);g.add(b)}
  for(const x of BARRELS){g.add(g3Mesh('cyl','#7a3a1a',11,28,11,x,14,-16));const f=new T.Mesh(G3.geo.cyl,new T.MeshBasicMaterial({color:0xff7a22}));f.scale.set(8,3,8);f.position.set(x,29,-16);g.add(f)}
  for(const x of STACKS){g.add(g3Mesh('box','#5a4220',40,32,34,x,16,-22));g.add(g3Mesh('box','#6a5028',34,26,30,x+4,45,-22))}
  for(const [x,fl] of WRECKS){const c=fl?'#3a4a5a':'#5a3a30';g.add(g3Mesh('box',c,96,22,40,x+52,18,-50));g.add(g3Mesh('box',c,52,20,36,x+46,38,-50));g.add(g3Mesh('cyl','#111',9,6,9,x+20,9,-30).rotateX(Math.PI/2));g.add(g3Mesh('cyl','#111',9,6,9,x+82,9,-30).rotateX(Math.PI/2))}
  for(const wx of [0,WORLD_W]){const dir=wx===0?-1:1;g.add(g3Mesh('box','#2a262e',60,170,200,wx+dir*30,85,-30));g.add(g3Mesh('box','#d9a21b',62,12,202,wx+dir*30,164,-30));g.add(g3Mesh('box','#d9a21b',62,12,202,wx+dir*30,20,-30))}
  // soleil
  if(!G3.sunSpr){const t=g3Tex('sun',128,128,(c,w,h)=>{const gr=c.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,'rgba(255,230,190,1)');gr.addColorStop(.25,'rgba(255,190,120,.7)');gr.addColorStop(1,'rgba(255,150,80,0)');c.fillStyle=gr;c.fillRect(0,0,w,h)});G3.sunSpr=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false}));G3.sunSpr.scale.set(520,520,1);sc.add(G3.sunSpr)}
  G3.lamps=LAMPS.slice();
}
// --- personnages : humain (joueur, zombies, boss), quadrupèdes (chien, cerf), pingouin, magicien ---
function g3Human(o){
  const T=THREE,g=new T.Group(),P={};
  const sk=o.skin||'#e2b58c',top=o.top||'#55733f',pants=o.pants||'#3b4a2f',shoes=o.shoes||'#1e1e1e',big=o.big?1.3:1;
  P.body=new T.Group();g.add(P.body);
  P.legL=new T.Group();P.legR=new T.Group();P.legL.position.set(-3,30,3.5);P.legR.position.set(3,30,-3.5);
  for(const l of[P.legL,P.legR]){l.add(g3Mesh('box',pants,8*big,30,8*big,0,-15,0));l.add(g3Mesh('box',shoes,13,7,9*big,3,-27,0));P.body.add(l)}
  P.torso=g3Mesh('box',top,20*big,31,13*big,0,45,0);P.body.add(P.torso);
  if(o.belly){P.body.add(g3Mesh('sph',top,19,17,15,5,38,0))}
  if(o.skirt){P.body.add(g3Mesh('cone',top,17,26,17,0,38,0).rotateX(Math.PI))}
  P.head=new T.Group();P.head.position.set(0,70,0);P.body.add(P.head);
  P.head.add(g3Mesh('sph',sk,9,9,9,0,0,0));
  const eye=o.zombie?'#ff2a2a':'#222';for(const z of[3,-3]){const e=new T.Mesh(G3.geo.box,new T.MeshBasicMaterial({color:new T.Color(eye)}));e.scale.set(2.4,2.4,2.4);e.position.set(7.6,2,z);P.head.add(e)}
  if(o.zombie){P.head.add(g3Mesh('box','#3a1a1a',2,3,8,8,-4,0));P.torso.add(g3Mesh('box','#8a1a22',1.2,.34,.4,0,.1,.5))}
  const hair=o.hair||'#4a3020',H=o.head;
  const dome=(c,sx,sy,sz,x,y)=>P.head.add(g3Mesh('sph',c,sx,sy,sz,x,y,0));
  if(!o.zombie&&H){
    if(H==='helmet'||H==='swat'||H==='cap'){dome(o.hat||'#3f5530',10.6,7.5,10.6,0,3);if(H==='cap') P.head.add(g3Mesh('box',o.hat||'#3f5530',9,1.6,12,9,2,0))}
    else if(H==='hat'){P.head.add(g3Mesh('cyl',o.hat||'#5a3a1e',15,1.6,15,0,5,0));P.head.add(g3Mesh('cyl',o.hat||'#5a3a1e',7.5,10,7.5,0,10,0))}
    else if(H==='santa'||H==='elf'||H==='candy'||H==='fouet'||H==='nut'||H==='snow'||H==='ginger'){
      const c=H==='santa'?'#c4161c':H==='elf'?'#2e8b3d':H==='candy'?'#f4f4f4':H==='fouet'?'#2a1a14':H==='snow'?'#1a1a1a':H==='nut'?'#e0b030':'#d4a060';
      if(H==='snow'){P.head.add(g3Mesh('cyl',c,13,1.6,13,0,6,0));P.head.add(g3Mesh('cyl',c,8,14,8,0,13,0))}
      else if(H==='nut'){P.head.add(g3Mesh('box',c,14,18,14,0,12,0))}
      else if(H==='fouet'){dome('#1a1210',10.4,7,10.4,0,3);P.head.add(g3Mesh('cone','#c8c8c8',2,12,2,-4,15,6).rotateZ(.3));P.head.add(g3Mesh('cone','#c8c8c8',2,12,2,-4,15,-6).rotateZ(.3))}
      else{P.head.add(g3Mesh('cone',c,9.5,20,9.5,-2,16,0).rotateZ(.25));if(H==='santa') P.head.add(g3Mesh('sph','#f4f4f4',3.4,3.4,3.4,-10,24,0))}
    }
    else if(H==='bandana'||H==='shades'){P.head.add(g3Mesh('box',o.hat||'#a82a2a',19.6,4,19.6,0,5,0));if(H==='shades') P.head.add(g3Mesh('box','#111',2,3.6,13,9,2,0))}
    else dome(hair,9.8,6,9.8,-.5,3);
  } else if(!o.zombie) dome(hair,9.8,6,9.8,-.5,3);
  if(o.zombie) dome(o.hair||'#2f3b25',8.4,3.2,8.4,-1,6);
  if(o.female) P.body.add(g3Mesh('box',hair,5,22,12,-9,60,0));
  // ----- détails du personnage -----
  if(!o.zombie&&!o.tree){
    P.body.add(g3Mesh('box','#231c16',21*big+1,3.6,13*big+1,0,31,0));P.body.add(g3Mesh('box','#c8a850',2,3.6,5,10.8*big,31,0));
    for(const z of[-1,1]) P.body.add(g3Mesh('box','#2c3428',4,6,4.4,7*big,27.5,z*6.4*big));
    const st=g3Mesh('box','#2a2420',1.2,40,3.2,10.3*big,46,0);st.rotation.x=.42;P.body.add(st);
    for(const l of[P.legL,P.legR]) l.add(g3Mesh('box','#1c1c1c',8.6*big+.6,6,8.6*big+.6,0,-13,0));
    P.head.add(g3Mesh('box','#f4f1ea',1.4,3,3.4,8.1,2.2,3));P.head.add(g3Mesh('box','#f4f1ea',1.4,3,3.4,8.1,2.2,-3));
    P.head.add(g3Mesh('box',hair,1,1.2,4.4,8,6,3));P.head.add(g3Mesh('box',hair,1,1.2,4.4,8,6,-3));
    P.head.add(g3Mesh('box','#b88a66',2.4,3.4,2.6,9.4,-.8,0));P.head.add(g3Mesh('box','#8a4a3a',.8,.9,5,8.8,-4.6,0));
    for(const z of[1,-1]) P.head.add(g3Mesh('sph',sk,2.3,3,1.4,0,0,z*8.8));
  }
  if(o.zombie){
    for(let k=0;k<3;k++) P.body.add(g3Mesh('box','#e8dcc0',.7,1.1,9,10.3*big,51-k*4.6,2.5));
    P.body.add(g3Mesh('box','#7a1218',.6,9,8,10.4*big,42,-3.4));P.body.add(g3Mesh('box','#5a0c10',.6,13,1.6,10.4*big,31,-5));P.body.add(g3Mesh('box','#5a0c10',.6,10,1.6,10.4*big,31,4));
    for(const z of[1.6,-1.6]) P.head.add(g3Mesh('box','#e8e0c0',.9,2.4,.9,8.3,-5,z));
    P.head.add(g3Mesh('box','#8e1b1b',.5,7,.7,8.4,2,-5));P.head.add(g3Mesh('box','#7a1218',.5,6,.9,8.3,-7,3));
    for(const l of[P.legL,P.legR]) l.add(g3Mesh('box','#2a2a30',8.4*big+.4,5,8.4*big+.4,0,-4,0));   // pantalon déchiré
  }
  if(o.tree){
    g.userData.bulbs=[];const cols=[0xff3a3a,0xffd23a,0x3ad0ff,0xff6ad8,0x6aff7a];
    for(const [y,hh,hw] of[[26,36,30],[44,30,24],[58,22,17]]){
      P.body.add(g3Mesh('cone','#1f6a34',hw,hh,hw,0,y,0));
      for(let k=0;k<7;k++){const a=k/7*6.283+y,r=hw*.62,m=new T.Mesh(G3.geo.sph,new T.MeshBasicMaterial({color:cols[k%5]}));m.scale.setScalar(2);m.position.set(Math.cos(a)*r,y-hh*.12+Math.sin(k*1.7)*3,Math.sin(a)*r);P.body.add(m);g.userData.bulbs.push(m)}}
    const star=new T.Mesh(G3.geo.sph,new T.MeshBasicMaterial({color:0xffd23a}));star.scale.set(4.4,4.4,4.4);star.position.set(0,88,0);P.body.add(star);g.userData.bulbs.push(star);
  }
  P.armL=new T.Group();P.armR=new T.Group();P.armL.position.set(0,56,7.5*big);P.armR.position.set(0,56,-7.5*big);
  for(const a of[P.armL,P.armR]){a.add(g3Mesh('box',top,26,6.4,6.4,13,0,0));a.add(g3Mesh('sph',sk,3.6,3.6,3.6,27,0,0));P.body.add(a)}
  P.gun=new T.Group();P.gun.position.set(27,0,0);P.armR.add(P.gun);
  g.userData.P=P;return g;
}
function g3Gun(P,w){                                                   // arme tenue : taille et couleur selon la famille
  if(P.gun.userData.w===w) return;P.gun.userData.w=w;while(P.gun.children.length) P.gun.remove(P.gun.children[0]);
  const wp=WEAPONS[w];if(!wp) return;
  if(wp.melee){P.gun.add(g3Mesh('box','#d8dce0',22,3.4,1.4,11,0,0));P.gun.add(g3Mesh('box','#4a3020',7,4,3,-1,0,0));return}
  const L={pistol:16,revolver:17,deagle:19,smg:22,ak:30,m4:30,lmg:36,dmr:38,barrett:46,minigun:34,shotgun:34}[wp.kind]||26;
  P.gun.add(g3Mesh('box','#26272b',L,5,4,L/2-4,0,0));P.gun.add(g3Mesh('box','#4a3a2a',L*.32,6,4.4,-2,-2,0));P.gun.add(g3Mesh('box','#26272b',4,9,3.4,L*.35,-6,0));
  if(wp.hands||/akimbo/i.test(wp.name)) P.gun.add(g3Mesh('box','#26272b',L*.8,5,4,L*.4-3,0,6));
}
function g3Quad(kind,col){
  const T=THREE,g=new T.Group(),P={legs:[]};
  const dog=kind==='dog',deer=kind==='deer';
  if(kind==='peng'){
    g.add(g3Mesh('sph',col||'#2a2f3a',15,25,13,0,30,0));g.add(g3Mesh('sph','#eef0f4',9,19,10,5,29,0));g.add(g3Mesh('sph',col||'#2a2f3a',9,9,9,3,56,0));
    g.add(g3Mesh('cone','#e0902a',3,10,3,13,55,0).rotateZ(-Math.PI/2));g.add(g3Mesh('box','#e0902a',9,3,8,4,3,0));
    const e=new T.Mesh(G3.geo.box,new T.MeshBasicMaterial({color:0xff2a2a}));e.scale.set(2,2,2);e.position.set(9,58,4);g.add(e);
    P.fl=[g3Mesh('box',col||'#2a2f3a',4,18,3,0,40,-14),g3Mesh('box',col||'#2a2f3a',4,18,3,0,40,14)];P.fl.forEach(f=>g.add(f));
    g.userData.P=P;return g;
  }
  const len=deer?46:34,hh=deer?40:20;
  g.add(g3Mesh('box',col||'#8a5a30',len,deer?22:14,deer?16:14,0,hh+8,0));
  g.add(g3Mesh('box',col||'#8a5a30',deer?10:12,deer?30:10,deer?9:11,len/2-2,hh+(deer?24:12),0).rotateZ(deer?-.5:0));
  g.add(g3Mesh('box','#3a2412',deer?16:14,deer?12:11,deer?10:10,len/2+(deer?10:8),hh+(deer?36:10),0));
  const e=new T.Mesh(G3.geo.box,new T.MeshBasicMaterial({color:0xff2a2a}));e.scale.set(2,2,2);e.position.set(len/2+(deer?16:13),hh+(deer?39:12),4);g.add(e);
  const tail=g3Mesh('box',col||'#8a5a30',3,12,3,-len/2-3,hh+10,0);tail.rotation.z=.8;g.add(tail);
  if(deer){for(const z of[-3,3]){g.add(g3Mesh('cyl','#c8b890',1.4,18,1.4,len/2+4,hh+50,z*2).rotateZ(.4));g.add(g3Mesh('cyl','#c8b890',1.2,10,1.2,len/2-2,hh+57,z*3).rotateZ(-.4))}}
  for(const [x,z] of[[-len/2+5,-5],[-len/2+5,5],[len/2-5,-5],[len/2-5,5]]){const l=new T.Group();l.position.set(x,hh,z);l.add(g3Mesh('box',col||'#8a5a30',5,hh,5,0,-hh/2,0));g.add(l);P.legs.push(l)}
  g.userData.P=P;return g;
}
function g3Mage(){
  const T=THREE,g=new T.Group(),P={};
  g.add(g3Mesh('cone','#2e1240',26,66,26,0,33,0));g.add(g3Mesh('cone','#1a0a24',18,50,18,0,41,0));
  P.head=new T.Group();P.head.position.set(0,72,0);g.add(P.head);P.head.add(g3Mesh('sph','#d8d0c8',8,8,8,0,0,0));
  P.head.add(g3Mesh('cyl','#1a0a24',17,2,17,0,6,0));P.head.add(g3Mesh('cone','#1a0a24',10,38,10,0,26,0));P.head.add(g3Mesh('box','#7a0e18',17,4,17,0,8,0));
  for(const z of[3,-3]){const e=new T.Mesh(G3.geo.box,new T.MeshBasicMaterial({color:0xff2a2a}));e.scale.set(2.2,2.2,2.2);e.position.set(7,0,z);P.head.add(e)}
  P.arm=new T.Group();P.arm.position.set(6,56,-9);P.arm.add(g3Mesh('box','#2e1240',24,6,6,12,0,0));g.add(P.arm);
  P.staff=new T.Group();P.staff.position.set(24,0,0);P.staff.add(g3Mesh('cyl','#3a2412',1.6,70,1.6,0,10,0));const orb=new T.Mesh(G3.geo.sph,new T.MeshBasicMaterial({color:0xff2a44}));orb.scale.set(5,5,5);orb.position.set(0,48,0);P.staff.add(orb);P.arm.add(P.staff);
  g.userData.P=P;return g;
}
const ZSK={normal:'#7fb069',fast:'#a9c45a',tank:'#6f8f5a',digger:'#a89478'},ZSH={normal:'#4d6a8a',fast:'#8a3f3f',tank:'#4a3a5a',digger:'#5a4636'};
function g3MakeZombie(z){
  if(z.mag){const g=g3Mage();g.userData.kind='mag';return g}
  if(z.animal){const g=g3Quad(z.animal,z.color);g.userData.kind='quad';return g}
  const sk=z.skin||ZSK[z.type]||'#7fb069',sh=z.shirt||ZSH[z.type]||'#4d6a8a';
  const g=g3Human({skin:sk,top:sh,pants:'#3d3d45',shoes:'#2a2a2a',zombie:true,big:z.type==='tank'||!!z.boss,hair:'#2f3b25',head:null});
  if(z.xm==='santa'){const P=g.userData.P;P.head.add(g3Mesh('cone','#c4161c',9.5,20,9.5,-2,16,0).rotateZ(.25))}
  else if(z.xm==='elf'){const P=g.userData.P;P.head.add(g3Mesh('cone','#2e8b3d',9.5,20,9.5,-2,16,0).rotateZ(.25))}
  g.userData.kind='hum';return g;
}
function g3Look(){const C=lookCols();return{zombie:!!C.O.zk&&C.O.zk!=='tree',tree:C.O.zk==='tree',zk:C.O.zk,an:C.O.an,col:C.O.col,skin:C.skin,top:C.top,pants:C.pants,shoes:C.shoes,hair:C.hair,hat:C.hat,head:C.O.head,belly:!!(C.O.belly&&C.big&&!C.f),skirt:!!(C.f&&C.O.skirt),big:C.big,female:C.f}}
function g3Frame(){
  const T=THREE;
  try{
    g3BuildWorld();
    const r=Math.min(RES,2);if(G3.W!==W||G3.H!==H||G3.R!==r){G3.W=W;G3.H=H;G3.R=r;G3.r.setSize(Math.round(W*r),Math.round(H*r),false)}
    const D=700,cx=camX+W/2,Yc=GROUND-H/2,shx=shake>.5?(Math.random()-.5)*shake:0,shy=shake>.5?(Math.random()-.5)*shake:0,cam=G3.cam;
    cam.fov=2*Math.atan(H/2/D)*180/Math.PI;cam.aspect=W/H;cam.position.set(cx-shx,Yc+shy,D);cam.lookAt(cx-shx,Yc+shy,0);cam.updateProjectionMatrix();
    // lumières
    const dark=curMap.dark||0,sunC=new T.Color('rgb('+PAL.sun+')');
    G3.hemi.color.set(PAL.sky[1]);G3.hemi.intensity=Math.max(.25,.85-dark*1.1);
    G3.sun.color.copy(sunC);G3.sun.intensity=Math.max(.2,.95-dark*1.2);G3.sun.castShadow=!!FXF.lights;
    G3.sun.position.set(cx-220,520,260);G3.sun.target.position.set(cx,0,0);G3.sun.target.updateMatrixWorld();
    let li=0;const near=G3.lamps.filter(x=>Math.abs(x-cx)<W).sort((a,b)=>Math.abs(a-cx)-Math.abs(b-cx));
    for(const l of G3.lights){const x=near[li++];if(x!==undefined&&FXF.lights){l.position.set(x+27,92,-10);l.intensity=1.4+dark*2}else l.intensity=0}
    const p=player,wp=WEAPONS[p.w],fl=(p.muz0>0||p.muz1>0)||(!wp.melee&&p.cd>wp.rate*.7);
    G3.fx=fl?1:G3.fx*.6;G3.flash.intensity=G3.fx*2.6;G3.flash.position.set(p.x+(p.face||1)*40,GROUND-p.y+50,40);
    // soleil à la même place que dans l'image 2D
    {const s=D/(D+1500),sx=W*.79-camX*.03;G3.sunSpr.position.set(cx+(sx-W/2)/s,Yc+(H/2-150)/s,-1500);G3.sunSpr.scale.set(520,520,1)}
    // entités
    const seen=new Set(),ent=G3.ent;
    const get=(o,mk)=>{let e=ent.get(o);if(!e){e=mk();e.visible=true;G3.scene.add(e);ent.set(o,e)}seen.add(o);return e};
    // joueur
    {
      const key=p, look=g3Look(),lk=JSON.stringify(look);
      let g=ent.get(key);if(g&&g.userData.lk!==lk){G3.scene.remove(g);ent.delete(key);g=null}
      g=get(key,()=>{const m=g3Human(look);m.userData.lk=lk;m.userData.kind='me';return m});
      g3Animate(g,p,true);
    }
    for(const z of zombies){
      if(Math.abs(z.x-cx)>W/2+260&&!z.boss) {const e=ent.get(z);if(e) e.visible=false;seen.add(z);continue}
      const g=get(z,()=>g3MakeZombie(z));g.visible=true;g3Zombie(g,z);
    }
    for(const [o,e] of ent) if(!seen.has(o)){G3.scene.remove(e);ent.delete(o)}
    G3.r.render(G3.scene,cam);
    G3.skip=true;
    ctx.drawImage(G3.cv,0,0,W,H);
    if(bloodSnow>0){ctx.fillStyle='rgba(120,6,14,'+(.34*bloodSnow)+')';ctx.fillRect(0,0,W,H)}
  }catch(e){
    console.error(e);G3.status='err';G3.err='erreur 3D';G3.on=false;G3.skip=false;gameMode='2D';SET.m3=false;
    return false;
  }
  return true;
}
function g3Animate(g,p,me){                                            // le joueur : jambes, visée du bras, arme
  const P=g.userData.P,face=p.face||1,Y=Math.max(0,GROUND-p.y),sw=Math.sin(p.step||0)*.7;
  g.position.set(p.x,Y,0);g.rotation.y=face>0?0:Math.PI;
  P.legL.rotation.z=sw;P.legR.rotation.z=-sw;
  let a=aimDir()?(face>0?0:Math.PI):Math.atan2(mouse.y-(p.y-48),mouse.x+camX-p.x);
  const Xd=Math.cos(a),Yd=-Math.sin(a),al=face>0?Math.atan2(Yd,Xd):Math.atan2(Yd,-Xd);
  const wp=WEAPONS[p.w];g3Gun(P,p.w);
  if(wp.melee){const sp=Math.max(0,p.swing||0)/180,ang=sp>0?(-1.2+(1-sp)*2.6):-.3;P.armR.rotation.z=ang;P.armL.rotation.z=.2}
  else{P.armR.rotation.z=al;P.armL.rotation.z=al-.15;P.armL.rotation.y=.18}
  if(!(typeof death!=='undefined'&&death)) P.body.rotation.z=0;P.head.rotation.z=Math.max(-.4,Math.min(.4,al*.2));
  g.visible=!(p.hurtCd>0&&Math.floor(p.hurtCd/60)%2);
  if(typeof death!=='undefined'&&death){const ang=deathAng();P.body.rotation.z=ang;P.body.position.y=Math.sin(ang)*12}else P.body.position.y=0;
}
function g3Zombie(g,z){
  const P=g.userData.P,k=g.userData.kind,s=z.size||1,Y=Math.max(0,GROUND-z.y);
  let sink=0;if(z.emerge>0) sink=(z.emerge/EMERGE_T)*85*s;
  if(z.mag){
    if(z.ph==='under'){g.visible=false;return}
    const low=z.ph==='sink'?(1-z.pt/50)*135:z.ph==='rise'?(z.pt/50)*135:0;
    g.position.set(z.x,Y-low*s*.5,0);g.scale.setScalar(s);g.rotation.y=z.dir>0?0:Math.PI;
    P.arm.rotation.z=.9+Math.sin((z.step||0)*.5)*.3;P.head.rotation.z=Math.sin((z.step||0)*.4)*.06;return;
  }
  g.position.set(z.x,Y-sink,0);g.rotation.y=z.dir>0?0:Math.PI;
  const sw=Math.sin(z.step||0);
  if(k==='quad'){
    g.scale.setScalar(s);const lg=P.legs;if(lg&&lg.length>3){lg[0].rotation.z=sw*.8;lg[1].rotation.z=-sw*.8;lg[2].rotation.z=-sw*.8;lg[3].rotation.z=sw*.8}
    if(P.fl){P.fl[0].rotation.x=sw*.5;P.fl[1].rotation.x=-sw*.5}
    return;
  }
  g.scale.setScalar(s*(z.boss?1:1));
  P.legL.rotation.z=sw*.6;P.legR.rotation.z=-sw*.6;
  const lean=z.type==='fast'?.22:.06;P.body.rotation.z=-lean;
  P.armL.rotation.z=.12+Math.sin((z.step||0)+1)*.12;P.armR.rotation.z=.18+Math.sin((z.step||0))*.12;
  g.userData.hit=z.stun>0;
}
// --- branchement sur le dessin 2D : le décor 2D est remplacé par la scène 3D ; les personnages 2D ne sont plus dessinés ---
const _bg3=drawBackground,_dz3=drawZombie,_de3=drawEmerge,_ds3=drawSoldier,_fog3=drawFog,_ash3=ash;
drawBackground=function(){if(G3.on){if(g3Frame()) return}return _bg3.apply(this,arguments)};
drawZombie=function(z){if(G3.skip) return;return _dz3(z)};
drawEmerge=function(z){if(G3.skip) return;return _de3(z)};
drawSoldier=function(p){if(G3.skip) return;return _ds3(p)};
drawFog=function(front){if(front) G3.skip=false;if(G3.on) return;return _fog3.apply(this,arguments)};
ash=function(){if(G3.on) return;return _ash3()};

if(SET.m3){gameMode='3D';g3Request()}else if(SET.vr) gameMode='VR';          // le dernier mode utilisé (2D, 3D ou VR) est restauré au lancement
// --- Boucle ---
for(const ev of['mousemove','mousedown','mouseup','touchstart','touchmove','keydown','wheel']) addEventListener(ev,()=>{uiDirty=true},{passive:true});
