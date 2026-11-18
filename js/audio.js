function audioBuild(c){
  AC=c;
  const comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=6;
  AMASTER=c.createGain();AMASTER.gain.value=.55*SET.vol;AMASTER.connect(comp);comp.connect(c.destination);
  const n=c.sampleRate*2;ANOISE=c.createBuffer(1,n,c.sampleRate);const d=ANOISE.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
  const L=Math.floor(c.sampleRate*1.3),ir=c.createBuffer(2,L,c.sampleRate);
  for(let ch=0;ch<2;ch++){const dd=ir.getChannelData(ch);for(let i=0;i<L;i++)dd[i]=(Math.random()*2-1)*Math.pow(1-i/L,3.2)}
  AVERB=c.createConvolver();AVERB.buffer=ir;const vg=c.createGain();vg.gain.value=.5;AVERB.connect(vg);vg.connect(AMASTER);
}
function audioInit(){
  if(!started){started=true;musicApply()}
  if(AC){if(AC.state==='suspended'&&AC.resume) AC.resume();return}
  const C=window.AudioContext||window.webkitAudioContext;if(!C) return;
  try{audioBuild(new C())}catch(e){AC=null}
}
// Musique de fond en boucle (fichier fourni), volume et activation réglables dans Options
let MUSIC=null;
try{MUSIC=new Audio('assets/Apocalypse_Zombie.mp3');MUSIC.loop=true;MUSIC.preload='auto'}catch(e){MUSIC=null}
function musicApply(){if(!MUSIC) return;MUSIC.volume=Math.max(0,Math.min(1,SET.mvol));if(SET.music&&SET.mvol>0){const p=MUSIC.play();if(p&&p.catch)p.catch(()=>{})}else MUSIC.pause()}
document.addEventListener('visibilitychange',()=>{if(!MUSIC) return;if(document.hidden) MUSIC.pause();else if(started) musicApply()});
let started=false;
function setVol(){if(AMASTER) AMASTER.gain.value=.55*SET.vol}
const snd=()=>AC&&SET.vol>0;
function env(g,t,dur,vol,att){g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+(att||.002));g.gain.exponentialRampToValueAtTime(.0001,t+dur)}
function nz(t,dur,o){                                  // rafale de bruit filtré (souffle, détonation, impact)
  o=o||{};const s=AC.createBufferSource();s.buffer=ANOISE;
  const f=AC.createBiquadFilter();f.type=o.type||'bandpass';f.Q.value=o.q||.8;f.frequency.setValueAtTime(o.f||1000,t);
  if(o.f2) f.frequency.exponentialRampToValueAtTime(Math.max(20,o.f2),t+dur);
  const g=AC.createGain();env(g,t,dur,o.vol==null?1:o.vol,o.att);
  s.connect(f);f.connect(g);g.connect(AMASTER);
  if(o.rev){const r=AC.createGain();r.gain.value=o.rev;g.connect(r);r.connect(AVERB)}
  s.start(t,Math.random()*.6);s.stop(t+dur+.05);
}
function tone(t,dur,o){                                // oscillateur (corps grave, corde, laser, voix)
  o=o||{};const s=AC.createOscillator();s.type=o.type||'sine';s.frequency.setValueAtTime(o.f||100,t);
  if(o.f2) s.frequency.exponentialRampToValueAtTime(Math.max(15,o.f2),t+dur);
  const g=AC.createGain();env(g,t,dur,o.vol==null?1:o.vol,o.att);
  let out=s;if(o.lp){const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=o.lp;s.connect(f);out=f}
  out.connect(g);g.connect(AMASTER);
  if(o.rev){const r=AC.createGain();r.gain.value=o.rev;g.connect(r);r.connect(AVERB)}
  s.start(t);s.stop(t+dur+.05);
}
const wHash=n=>{let h=7;for(const ch of n)h=(h*31+ch.charCodeAt(0))>>>0;return (h%1000)/1000};
// --- Sons par arme : chaque arme a un profil inspiré de son vrai calibre, de la longueur de canon et du mécanisme ---
// classes de munition : [claquement Hz, corps grave Hz, durée de queue s, volume, réverbération]
const AMMO={
  c22:[4400,280,.06,.55,.06], p9:[3400,190,.09,1,.15], p9s:[3800,215,.07,.85,.1], p45:[2500,150,.12,1.05,.18],
  p57:[5200,320,.05,.7,.1], tt:[4300,200,.1,.95,.15], p357:[2100,115,.22,1.2,.3], p44:[1900,100,.28,1.3,.35], p50:[1800,92,.32,1.4,.42],
  r556:[3600,175,.13,1,.28], r545:[3300,160,.13,1,.28], r762s:[2300,130,.15,1.1,.28], r762:[2000,112,.2,1.2,.35],
  r54r:[1900,100,.26,1.25,.4], r792:[1800,100,.3,1.3,.45], r303:[1900,108,.28,1.2,.42], r3030:[2200,125,.2,1.1,.3],
  r338:[2000,82,.4,1.45,.55], r408:[1600,66,.5,1.6,.65], r50:[1400,56,.6,1.75,.75]
};
// mécanismes : s = glissière, r = culasse mobile (cliquetis), k = clac doux, g = piston à gaz, b = culasse à verrou, l = levier, c = bande de cartouches
const WS={
 'Glock 17':['p9','s'],'Beretta 92':['p9','s',{fb:1.05,tl:1.05}],'M1911':['p45','s'],'USP':['p9','s',{fc:.92,fb:.95,tl:1.1}],'CZ 75':['p9','s',{fc:1.05}],
 'Five-seveN':['p57','s'],'Sig P226':['p9','s',{fc:.97,fb:1.1}],'Makarov':['p9','s',{fc:.9,v:.85,fb:1.1}],'Tokarev TT-33':['tt','s'],'Glock 18':['p9','r',{v:.8,tl:.7}],
 'Revolver Python':['p357',''],'Magnum 44':['p44',''],'Desert Eagle':['p50','s'],
 'Uzi':['p9s','r',{fb:1.1}],'MAC-10':['p9s','r',{fc:.9,fb:1.2,tl:.8}],'MP5':['p9s','k',{fc:.95,v:.8}],'MP7':['p57','k',{fb:.9,v:.8}],'P90':['p57','k',{fb:.85,v:.85}],
 'Vector':['p45','r',{fc:1.1,v:.9,tl:.8}],'Skorpion':['c22','r'],'Thompson M1928':['p45','r',{fb:.9,v:1.1,tl:1.1}],'PPSh-41':['tt','r',{fb:1.1,tl:.9}],
 'UMP45':['p45','k',{v:.9}],'Bizon':['p9s','r',{fb:.95}],'MP40':['p9s','r',{fc:.9,fb:1.05}],'AKS-74U':['r545','g',{fc:1.1,tl:.8,v:1.1}],
 'AK-47':['r762s','g'],'AKM':['r762s','g',{fc:.97,v:1.05}],'AK-74':['r545','g',{fb:1.05}],'AK-12':['r545','g',{fc:1.05,fb:.95}],'AN-94':['r545','g',{fc:1.1,v:.95}],
 'M4A1':['r556','k'],'M16A4':['r556','k',{fc:.95,fb:1.05,tl:1.1}],'HK416':['r556','k',{fc:1.05,v:.95}],'SCAR-H':['r762','k'],'FAMAS':['r556','k',{fc:1.1,tl:.8,v:.9}],
 'Galil':['r556','g',{fb:1.1}],'Steyr AUG':['r556','k',{fc:.9,fb:.95,v:.9}],'G36':['r556','k',{fc:.95,fb:1.1,v:.9}],'SIG 552':['r556','k',{fc:1.05,tl:.9}],
 'FN FAL':['r762','g',{fb:1.05}],'H&K G3':['r762','g',{fc:.95,fb:1.1,v:1.05}],'Tavor':['r556','k',{fc:.9,fb:.9,v:.95}],'QBZ-95':['r556','k',{fc:.85}],
 'Dragunov SVD':['r54r','g'],'M14 EBR':['r762','g',{fc:1.05}],'SKS':['r762s','g',{fc:.95,tl:1.1}],'Mosin-Nagant':['r54r','b',{fb:1.05,tl:1.2}],
 'Kar98k':['r792','b'],'Lee-Enfield':['r303','b'],'Winchester 94':['r3030','l'],'Remington 700':['r762','b',{fb:.9,tl:1.3}],'Steyr Scout':['r762','b',{fc:1.05,fb:.95}],
 'M24 SWS':['r762','b',{fb:.9,tl:1.4,v:1.1}],'AWP':['r338','b'],'CheyTac M200':['r408','b'],'Barrett M82':['r50','s'],'PGM Hécate II':['r50','b',{fb:.95,tl:1.1,v:1.05}],
 'M249':['r556','c'],'PKM':['r54r','c'],'RPK':['r762s','c'],'MG42':['r792','c',{fc:1.1,tl:.6}],'M60':['r762','c'],'Browning M2':['r50','c',{v:.95,tl:.5}],
 'Negev':['r556','c',{fc:1.05}],'MG4':['r556','c',{fb:1.1}],'Stoner 63':['r556','c',{fc:.95}],'BAR M1918':['r762','k']
};
// fusils à pompe : [grave Hz, durée, filtre Hz, mécanisme p = pompe, g = gaz, l = levier, r = rapide, d = double canon]
const WSG={'Remington 870':[85,.38,1500,'p'],'Mossberg 500':[90,.36,1650,'p'],'Benelli M4':[95,.3,1700,'g'],'SPAS-12':[88,.34,1550,'p'],'KSG':[80,.4,1400,'p'],
 'Winchester 1887':[75,.4,1300,'l'],'AA-12':[105,.2,1900,'r'],'Saiga-12':[92,.3,1650,'g'],'Double canon':[70,.5,1200,'d'],'Vepr-12':[98,.3,1750,'g']};
Object.assign(WS,NEWWS);Object.assign(WSG,NEWWSG);
function mech(m,t,v){
  const k=(dt,o)=>nz(t+dt,o.d||.03,Object.assign({q:3,vol:.3*v},o));
  switch(m){
    case 's':k(.13,{f:3500,vol:.12*v});tone(t+.13,.03,{f:700,type:'square',vol:.05*v,lp:2500});break;
    case 'r':k(.012,{f:5000,vol:.25*v});tone(t+.012,.02,{f:420,type:'square',vol:.08*v,lp:2000});break;
    case 'k':k(.01,{f:4200,vol:.12*v});break;
    case 'g':tone(t+.02,.04,{f:230,f2:120,vol:.16*v});k(.025,{f:2600,vol:.12*v});break;
    case 'b':k(.38,{f:1800,d:.05,vol:.4*v});tone(t+.38,.04,{f:300,type:'square',vol:.1*v,lp:1500});k(.55,{f:1400,d:.06,vol:.45*v});tone(t+.56,.05,{f:220,type:'square',vol:.1*v,lp:1200});break;
    case 'l':k(.3,{f:1900,d:.05,vol:.4*v});k(.45,{f:1500,d:.06,vol:.45*v});break;
    case 'c':k(.012,{f:6500,vol:.2*v});k(.04,{f:5200,vol:.12*v});break;
    case 'p':k(.38,{f:1200,q:2,d:.05,vol:.5*v});k(.52,{f:900,q:2,d:.06,vol:.55*v});break;
  }
}
function gunVoice(name,t){
  const w=wHash(name),j=(a,s)=>1+((w*7.3%1)-.5)*s*(a||1);            // micro-variation propre à chaque arme
  const e=WS[name];
  if(e){
    const c=AMMO[e[0]],o=e[2]||{},fc=c[0]*(o.fc||1)*j(1,.08),fb=c[1]*(o.fb||1)*j(1,.08),tl=c[2]*(o.tl||1)*j(1,.1),v=c[3]*(o.v||1),rv=c[4];
    const rj=1+(Math.random()-.5)*.05;
    nz(t,tl,{f:fc*rj,f2:Math.max(200,fc*.22),q:.6,vol:v,rev:rv});                  // souffle de la détonation
    nz(t,.02,{f:7000,type:'highpass',vol:.3*v*Math.min(1.4,fc/2800)});             // claquement sec de la balle
    tone(t,tl*1.25,{f:fb*rj,f2:fb*.33,vol:v*.95});                                 // coup grave
    mech(e[1],t,Math.min(1,v));return true;
  }
  const g=WSG[name];
  if(g){
    const f=g[2]*j(1,.1),bd=g[0]*j(1,.1),tl=g[1]*j(1,.1);
    nz(t,tl,{f,f2:f*.13,q:.4,vol:1.4,rev:.4});nz(t,.03,{f:3500,q:.8,vol:.6});tone(t,tl*.9,{f:bd,f2:28,vol:1.45});
    if(g[3]==='d'){nz(t+.06,tl,{f,f2:f*.13,q:.4,vol:1.5,rev:.4});tone(t+.06,tl*.9,{f:bd*.9,f2:26,vol:1.5});nz(t+.5,.06,{f:1000,q:2,vol:.5});}
    else mech(g[3]==='r'?'r':g[3],t,1);
    return true;
  }
  switch(name){
    case 'Minigun':nz(t,.045,{f:2400,f2:1200,q:.8,vol:.55});tone(t,.045,{f:150,f2:90,vol:.4});tone(t,.05,{f:60+Math.random()*6,type:'sawtooth',vol:.12,lp:300});return true;
    case 'Arbalète':tone(t,.3,{f:380,f2:140,type:'triangle',vol:.6});nz(t,.05,{f:900,q:3,vol:.5});nz(t,.14,{f:1600,f2:500,q:1,vol:.25});return true;
    case 'Arc de chasse':tone(t,.28,{f:520,f2:240,type:'triangle',vol:.5});nz(t+.02,.2,{f:2800,f2:900,q:1.2,vol:.3});return true;
    case 'Pistolet à clous':nz(t,.05,{f:2500,q:2,vol:.8});tone(t,.06,{f:300,f2:90,type:'square',vol:.35,lp:2000});nz(t+.02,.05,{f:6000,type:'highpass',vol:.3});return true;
    case 'Lance-flammes':tone(t,.15,{f:70,f2:40,vol:.6});nz(t,.28,{f:800,f2:1500,q:.5,vol:.9,rev:.1});nz(t,.28,{f:260,type:'lowpass',vol:.8});return true;
    case 'Lance-grenades M79':tone(t,.25,{f:130,f2:45,vol:1.2,lp:400});nz(t,.2,{f:600,f2:200,q:.6,vol:.7,rev:.3});tone(t+.03,.12,{f:300,f2:120,vol:.4});return true;
    case 'RPG-7':nz(t,.03,{f:3000,type:'highpass',vol:.6});nz(t+.02,.7,{f:1200,f2:400,q:.7,vol:.9,rev:.4});tone(t,.3,{f:100,f2:40,vol:1});return true;
    case 'Bazooka':tone(t,.45,{f:80,f2:30,vol:1.3});nz(t,.9,{f:800,f2:200,q:.6,vol:1,rev:.5});nz(t,.03,{f:3000,type:'highpass',vol:.5});return true;
    case 'Railgun':tone(t,.15,{f:200,f2:1500,type:'sine',vol:.3});tone(t+.14,.35,{f:1800,f2:90,type:'sawtooth',vol:.5,lp:3000});tone(t+.14,.5,{f:70,f2:25,vol:1.3});nz(t+.14,.22,{f:5000,type:'highpass',vol:.45,rev:.5});return true;
    case 'Fusil laser':tone(t,.16,{f:1800,f2:400,type:'square',vol:.3,lp:4000});tone(t,.18,{f:2600,f2:700,vol:.25});return true;
    case 'Fusil à plasma':tone(t,.3,{f:700,f2:120,type:'sawtooth',vol:.35,lp:2500});tone(t,.32,{f:1400,f2:260,vol:.2});nz(t,.12,{f:2500,f2:600,q:2,vol:.25});return true;
    case 'Pistolet laser':tone(t,.1,{f:2600,f2:900,vol:.3});tone(t,.08,{f:3200,f2:1200,type:'square',vol:.12,lp:5000});return true;
    case 'M72 LAW':nz(t,.04,{f:2800,type:'highpass',vol:.5});nz(t+.02,.6,{f:1100,f2:350,q:.7,vol:.85,rev:.4});tone(t,.28,{f:115,f2:42,vol:1});return true;
    case 'Panzerfaust':tone(t,.4,{f:90,f2:34,vol:1.3});nz(t,.8,{f:700,f2:180,q:.6,vol:1.1,rev:.5});nz(t,.03,{f:3500,type:'highpass',vol:.5});return true;
    case 'Milkor MGL':tone(t,.2,{f:140,f2:50,vol:1.1,lp:450});nz(t,.18,{f:700,f2:220,q:.6,vol:.65,rev:.25});tone(t+.03,.1,{f:320,f2:130,vol:.35});return true;
    case 'Pistolet lance-fusée':nz(t,.12,{f:1800,f2:600,q:.7,vol:.7,rev:.3});tone(t,.14,{f:260,f2:90,vol:.8});nz(t+.05,.35,{f:2500,f2:900,q:1,vol:.2});return true;
    case 'Arbalète à répétition':tone(t,.22,{f:420,f2:170,type:'triangle',vol:.5});nz(t,.06,{f:1500,q:3,vol:.4});nz(t+.08,.03,{f:3500,q:2,vol:.2});return true;
    case 'Fusil à fléchettes':nz(t,.035,{f:3800,f2:2200,q:1.5,vol:.35});tone(t,.05,{f:520,f2:260,type:'square',vol:.18,lp:2500});return true;
    case 'Fusil harpon':tone(t,.3,{f:150,f2:60,vol:.9});nz(t,.25,{f:1200,f2:300,q:.5,type:'lowpass',vol:.8});nz(t+.04,.08,{f:4000,q:4,vol:.3});return true;
  }
  return false;
}
function meleeSwing(name,t){
  switch(name){
    case 'Couteau':nz(t,.1,{f:900,f2:3800,q:1.3,vol:.55,att:.04});return true;
    case 'Poignard':nz(t,.09,{f:1100,f2:4200,q:1.3,vol:.5,att:.04});return true;
    case 'Machette':nz(t,.15,{f:600,f2:2800,q:1.2,vol:.75,att:.06});tone(t,.12,{f:140,f2:90,vol:.2});return true;
    case 'Hache de bûcheron':nz(t,.22,{f:250,f2:1100,q:1,vol:1,att:.1});tone(t,.2,{f:90,f2:60,vol:.3});return true;
    case 'Batte cloutée':nz(t,.2,{f:300,f2:1500,q:.9,vol:.9,att:.09});return true;
    case 'Katana':nz(t,.2,{f:900,f2:4500,q:1.2,vol:.6,att:.07});tone(t+.02,.35,{f:3300,f2:3900,type:'triangle',vol:.09});tone(t+.02,.3,{f:4950,type:'sine',vol:.04});return true;
    case 'Marteau de guerre':nz(t,.28,{f:180,f2:900,q:1,vol:1.1,att:.14});tone(t,.28,{f:70,f2:50,vol:.35});return true;
    case 'Faux':nz(t,.34,{f:400,f2:2200,q:.8,vol:.85,att:.16});return true;
    case 'Tronçonneuse':tone(t,.1,{f:75+Math.random()*8,f2:100,type:'sawtooth',vol:.35,lp:900});tone(t,.1,{f:150,f2:200,type:'sawtooth',vol:.12,lp:1500});nz(t,.1,{f:1800,q:1,vol:.3});return true;
  }
  return false;
}
function meleeHit(name,t){
  switch(name){
    case 'Couteau':case 'Poignard':nz(t,.06,{f:2400,f2:1300,q:.8,vol:1.6});nz(t,.1,{f:300,f2:120,vol:1.4});break;
    case 'Machette':nz(t,.08,{f:1800,f2:700,q:.8,vol:1.5});tone(t,.1,{f:110,f2:50,vol:1.2});break;
    case 'Hache de bûcheron':nz(t,.1,{f:700,f2:200,q:.6,vol:1.8});tone(t,.15,{f:95,f2:40,vol:1.5});nz(t,.03,{f:3000,type:'highpass',vol:.6});break;
    case 'Batte cloutée':tone(t,.08,{f:400,f2:150,type:'triangle',vol:1});nz(t,.06,{f:1200,f2:400,vol:1.2});tone(t,.12,{f:100,f2:50,vol:1.2});break;
    case 'Katana':nz(t,.09,{f:3200,f2:1500,q:.8,vol:1.5});nz(t,.1,{f:280,f2:110,vol:1.2});tone(t,.2,{f:3300,type:'triangle',vol:.06});break;
    case 'Marteau de guerre':tone(t,.25,{f:90,f2:35,vol:2});nz(t,.12,{f:400,type:'lowpass',vol:1.8});nz(t,.03,{f:3000,type:'highpass',vol:.7});break;
    case 'Faux':nz(t,.09,{f:2400,f2:1000,q:.8,vol:1.5});nz(t,.12,{f:260,f2:100,vol:1.3});break;
    case 'Tronçonneuse':tone(t,.14,{f:95,type:'sawtooth',vol:.5,lp:1200});nz(t,.12,{f:2000,q:.8,vol:1.5});break;
    default:nz(t,.09,{f:500,f2:150,q:.6,vol:1.6});tone(t,.12,{f:120,f2:50,vol:1.3});
  }
}
function playGun(wp,t0){
  if(wp.hands) wp=WEAPONS[wp.hi[0]];
  if(!snd()) return;const t=t0==null?AC.currentTime:t0;
  if(gunVoice(wp.name,t)) return;                    // son propre à cette arme
  const w=wHash(wp.name),pf=(.9+w*.2)*(1+(Math.random()-.5)*.05),dk=.9+(1-w)*.25;
  switch(wp.kind){
    case 'pistol':nz(t,.09*dk,{f:3300*pf,f2:900,q:.7,rev:.15});tone(t,.1*dk,{f:190*pf,f2:55,vol:.9});nz(t,.03,{f:6500,type:'highpass',vol:.45});break;
    case 'revolver':nz(t,.2*dk,{f:2100*pf,f2:450,q:.6,vol:1.1,rev:.3});tone(t,.24*dk,{f:115*pf,f2:35,vol:1.2});nz(t,.03,{f:6000,type:'highpass',vol:.5});break;
    case 'deagle':nz(t,.26*dk,{f:1900*pf,f2:380,q:.6,vol:1.25,rev:.4});tone(t,.28*dk,{f:100*pf,f2:30,vol:1.3});nz(t,.03,{f:5500,type:'highpass',vol:.55});break;
    case 'smg':nz(t,.06*dk,{f:3900*pf,f2:1500,q:.8,vol:.8,rev:.08});tone(t,.06*dk,{f:230*pf,f2:90,vol:.6});break;
    case 'ak':nz(t,.15*dk,{f:2200*pf,f2:600,q:.6,rev:.25});tone(t,.15*dk,{f:140*pf,f2:48,vol:1.05});nz(t,.025,{f:5000,type:'highpass',vol:.5});break;
    case 'm4':nz(t,.11*dk,{f:3100*pf,f2:900,q:.7,rev:.2});tone(t,.1*dk,{f:200*pf,f2:70,vol:.85});nz(t,.02,{f:7000,type:'highpass',vol:.4});break;
    case 'lmg':nz(t,.19*dk,{f:1700*pf,f2:420,q:.55,vol:1.1,rev:.25});tone(t,.19*dk,{f:105*pf,f2:40,vol:1.15});break;
    case 'shotgun':nz(t,.38*dk,{f:1500*pf,f2:200,q:.4,vol:1.4,rev:.4});tone(t,.32*dk,{f:90*pf,f2:28,vol:1.45});
      nz(t+.38,.05,{f:1200,q:2,vol:.5});nz(t+.52,.06,{f:900,q:2,vol:.55});break;                      // « clac-clac » de la pompe
    case 'dmr':nz(t,.24*dk,{f:2700*pf,f2:480,q:.6,vol:1.25,rev:.5});tone(t,.26*dk,{f:130*pf,f2:38,vol:1.1});nz(t,.025,{f:6500,type:'highpass',vol:.55});break;
    case 'barrett':nz(t,.55*dk,{f:1400*pf,f2:140,q:.45,vol:1.6,rev:.7});tone(t,.55*dk,{f:70*pf,f2:24,vol:1.7});nz(t,.03,{f:5000,type:'highpass',vol:.6});break;
    case 'minigun':nz(t,.05,{f:2400*pf,f2:1200,q:.8,vol:.5});tone(t,.05,{f:150*pf,f2:90,vol:.4});break;
    case 'crossbow':tone(t,.3*dk,{f:320*pf,f2:150,type:'triangle',vol:.6});nz(t,.14,{f:1800,f2:500,q:1,vol:.3});nz(t,.03,{f:2500,vol:.4});break;
    case 'bow':tone(t,.28*dk,{f:480*pf,f2:220,type:'triangle',vol:.5});nz(t+.02,.18,{f:2600,f2:900,q:1.2,vol:.28});break;
    case 'nailgun':nz(t,.05,{f:2500*pf,q:2,vol:.8});tone(t,.06,{f:300,f2:100,type:'square',vol:.35});break;
    case 'flamer':nz(t,.26,{f:800*pf,f2:1500,q:.5,vol:.9,rev:.1});nz(t,.26,{f:260,type:'lowpass',vol:.8});break;
    case 'launcher':tone(t,.3,{f:125*pf,f2:48,vol:1});nz(t,.55,{f:900,f2:250,q:.7,vol:.8,rev:.3});break;
    case 'rail':tone(t,.35,{f:1800*pf,f2:90,type:'sawtooth',vol:.5,lp:3000});tone(t,.4,{f:90,f2:30,vol:1.2});nz(t,.22,{f:5000,type:'highpass',vol:.4,rev:.5});break;
    case 'laser':tone(t,.18,{f:1600*pf,f2:300,type:'square',vol:.32,lp:4000});tone(t,.2,{f:2400*pf,f2:600,vol:.3});break;
    default:nz(t,.1,{f:2500,f2:800});tone(t,.1,{f:160,f2:60});
  }
}
function playSwing(wp,t0){
  if(!snd()) return;const t=t0==null?AC.currentTime:t0,pf=.9+wHash(wp.name)*.2;
  if(meleeSwing(wp.name,t)) return;
  switch(wp.kind){
    case 'knife':case 'blade':nz(t,wp.name==='Katana'?.2:.13,{f:700*pf,f2:3000,q:1.3,vol:.7,att:.05});if(wp.name==='Katana') tone(t,.3,{f:3300,type:'triangle',vol:.08});break;
    case 'axe':case 'bat':case 'hammer':nz(t,.24,{f:250*pf,f2:1200,q:1,vol:1,att:.1});break;
    case 'scythe':nz(t,.32,{f:400*pf,f2:2200,q:1.1,vol:.9,att:.14});break;
    case 'chainsaw':tone(t,.1,{f:80*pf,f2:95,type:'sawtooth',vol:.35,lp:900});nz(t,.1,{f:1800,q:1,vol:.3});break;
    default:nz(t,.15,{f:600,f2:2500,vol:.7,att:.05});
  }
}
function sfx(name){
  if(!snd()) return;const t=AC.currentTime;
  const gate=ms=>{if(lastSfx[name]&&t-lastSfx[name]<ms/1000) return false;lastSfx[name]=t;return true};
  switch(name){
    case 'hitmelee':if(!gate(60)) return;nz(t,.09,{f:500,f2:150,q:.6,vol:1.6});tone(t,.12,{f:120,f2:50,vol:1.3});break;
    case 'hitcut':if(!gate(60)) return;nz(t,.07,{f:2600,f2:1400,q:.8,vol:1.6});nz(t,.1,{f:300,f2:120,vol:1.6});break;
    case 'bhit':if(!gate(45)) return;nz(t,.05,{f:800,f2:300,q:.7,vol:1.1});break;
    case 'zdie':if(!gate(90)) return;tone(t,.5,{f:(110+Math.random()*50),f2:50,type:'sawtooth',vol:.5,lp:500});nz(t,.12,{f:350,f2:120,vol:1});break;
    case 'groan':if(!gate(300)) return;tone(t,.7,{f:90+Math.random()*40,f2:60,type:'sawtooth',vol:.3,lp:380,att:.15});break;
    case 'hurt':if(!gate(120)) return;tone(t,.2,{f:230,f2:110,type:'sawtooth',vol:.7,lp:900});nz(t,.12,{f:300,f2:100,vol:1.4});break;
    case 'boom':nz(t,.8,{f:700,f2:60,type:'lowpass',q:.5,vol:1.9,rev:.5});tone(t,.7,{f:85,f2:26,vol:1.7});break;
    case 'crate':nz(t,.04,{f:5000,type:'highpass',vol:.6});tone(t,.07,{f:900,type:'square',vol:.15,lp:3000});tone(t+.08,.09,{f:1300,type:'square',vol:.15,lp:3000});tone(t,.12,{f:140,f2:70,vol:.5});break;
    case 'wave':[523,659,784].forEach((f,i)=>tone(t+i*.12,.35,{f,type:'triangle',vol:.3,rev:.2}));break;
    case 'over':tone(t,1,{f:220,f2:50,type:'sawtooth',vol:.7,lp:700});nz(t,.5,{f:400,f2:80,type:'lowpass',vol:1.6});break;
    case 'buy':tone(t,.18,{f:1320,vol:.25,type:'triangle'});tone(t+.09,.3,{f:1760,vol:.25,type:'triangle'});nz(t,.03,{f:6000,type:'highpass',vol:.3});break;
    case 'bonus':tone(t,.14,{f:880,type:'triangle',vol:.3});tone(t+.08,.14,{f:1175,type:'triangle',vol:.3});tone(t+.16,.3,{f:1568,type:'triangle',vol:.3,rev:.2});break;
    case 'whistle':tone(t,.45,{f:2200,f2:500,type:'sawtooth',vol:.12,lp:3000});break;
    case 'turret':if(!gate(60)) return;nz(t,.05,{f:3200,f2:1200,q:.8,vol:.5});tone(t,.06,{f:260,f2:100,vol:.4});break;
    case 'bells':[2093,2637,2349,2637,3136,2637,3136,3520].forEach((f,i)=>{tone(t+i*.1,.3,{f,type:'sine',vol:.13,rev:.3});tone(t+i*.1,.2,{f:f*2.01,type:'sine',vol:.04})});break;
    case 'evilbells':tone(t,1.2,{f:110,f2:60,type:'sawtooth',vol:.4,lp:500});[1760,1865,1760,1865].forEach((f,i)=>tone(t+i*.22,.5,{f,type:'sine',vol:.1,rev:.5}));nz(t,.8,{f:300,f2:80,q:.6,vol:.5,rev:.5});break;
    case 'plane':tone(t,1.3,{f:85,f2:70,type:'sawtooth',vol:.22,lp:320});nz(t,1.2,{f:500,f2:380,q:.8,vol:.28,att:.4});tone(t,1.2,{f:170,f2:140,type:'square',vol:.05,lp:600});break;
    case 'screech':tone(t,.55,{f:800,f2:2300,type:'sawtooth',vol:.28,lp:3500});nz(t,.5,{f:3000,f2:1500,q:1,vol:.3});tone(t+.2,.4,{f:300,f2:120,type:'sawtooth',vol:.25,lp:600});break;
    case 'click':nz(t,.03,{f:3000,q:2,vol:1.2});tone(t,.04,{f:600,f2:300,type:'square',vol:.25});break;
  }
}

// --- Logique ---
const gauss=()=>{let u=0,v=0;while(!u)u=Math.random();v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(6.2832*v)};
