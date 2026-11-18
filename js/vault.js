// ===== Coffre C02 : copie CHIFFRÉE de la sauvegarde (AES-GCM) ; la clé est générée par le navigateur, NON EXTRACTABLE et liée à cet appareil =====
// Un éditeur de sauvegarde (ou une IA) peut lire et modifier le fichier de sauvegarde, mais pas fabriquer un coffre valide : au prochain démarrage le jeu
// compare, voit la différence et ANNULE la modification (la progression revient à celle du coffre). Limite : seul un serveur rendrait la triche impossible.
var VAULT=(()=>{
  const ok=typeof indexedDB!=='undefined'&&typeof crypto!=='undefined'&&!!crypto.subtle&&typeof crypto.subtle.generateKey==='function';
  let q=Promise.resolve(),halt=false;
  const idb=()=>new Promise((res,rej)=>{try{const r=indexedDB.open('zs_c02v',1);r.onupgradeneeded=()=>r.result.createObjectStore('s');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);r.onblocked=()=>rej(new Error('blocked'))}catch(e){rej(e)}});
  const rq=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
  const put=(db,k,v)=>{const tx=db.transaction('s','readwrite');tx.objectStore('s').put(v,k);return new Promise((res,rej)=>{tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})};
  const getKey=async(db,name,algo,usages)=>{let k=await rq(db.transaction('s').objectStore('s').get(name));if(!k){k=await crypto.subtle.generateKey(algo,false,usages);await put(db,name,k)}return k};
  const AES={name:'AES-GCM',length:256},HM={name:'HMAC',hash:'SHA-256'};
  const enc=new TextEncoder(),b64=u=>btoa(String.fromCharCode(...new Uint8Array(u))),unb64=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
  async function sealNow(obj,imp){const db=await idb();try{const k=await getKey(db,'key',AES,['encrypt','decrypt']),iv=crypto.getRandomValues(new Uint8Array(12));
    const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},k,enc.encode(JSON.stringify({v:GAME_VERSION,t:Date.now(),s:obj,imp:imp?1:0})));await put(db,'v',{iv,ct})}finally{db.close()}}
  async function openNow(){const db=await idb();try{const v=await rq(db.transaction('s').objectStore('s').get('v'));if(!v) return null;
    const k=await rq(db.transaction('s').objectStore('s').get('key'));if(!k) return 'bad';
    try{return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:v.iv},k,v.ct)))}catch(e){return 'bad'}}finally{db.close()}}
  async function macNow(text){const db=await idb();try{const k=await getKey(db,'hkey',HM,['sign','verify']);return b64(await crypto.subtle.sign('HMAC',k,enc.encode(text)))}finally{db.close()}}
  async function macOk(text,sig){try{const db=await idb();try{const k=await rq(db.transaction('s').objectStore('s').get('hkey'));if(!k) return false;return await crypto.subtle.verify('HMAC',k,unb64(sig),enc.encode(text))}finally{db.close()}}catch(e){return false}}
  const clone=o=>JSON.parse(JSON.stringify(o));
  return{ok,
    seal(obj){if(!ok||halt) return Promise.resolve();const c=clone(obj);return q=q.then(()=>sealNow(c)).catch(()=>{})},
    sealThen(obj,cb,imp){if(!ok){cb();return}halt=false;const c=clone(obj);q=q.then(()=>sealNow(c,imp)).catch(()=>{}).then(()=>cb())},
    clearThen(cb){if(!ok){cb();return}q=q.then(async()=>{try{const db=await idb();try{const tx=db.transaction('s','readwrite');tx.objectStore('s').clear();await new Promise(r=>tx.oncomplete=r)}finally{db.close()}}catch(e){}}).then(()=>cb())},
    mac:t=>ok?macNow(t).catch(()=>''):Promise.resolve(''),macOk:(t,s2)=>ok?macOk(t,s2):Promise.resolve(false),
    open:()=>ok?q.then(()=>openNow()).catch(()=>undefined):Promise.resolve(undefined),
    halt(){halt=true},
    boot(){ if(!ok) return;
      q=q.then(async()=>{
        let v;try{v=await openNow()}catch(e){ACG.st.vault='off';return}
        const marker=(()=>{try{return localStorage.getItem('zs_vault_on')==='1'}catch(e){return false}})();
        if(v==='bad'){ACG.note('Coffre chiffré illisible (clé introuvable) : recréé');ACG.st.vault='bad';ACG.st.tampered=true;ACG.st.mpBlock='Anti-triche : coffre de sauvegarde altéré';await sealNow(clone(save));return}
        if(v===null){
          if(marker){ACG.note('Coffre chiffré absent alors qu\'il existait : effacement suspect');ACG.st.vault='bad';ACG.st.tampered=true;ACG.st.mpBlock='Anti-triche : coffre de sauvegarde effacé'}
          else ACG.st.vault='ok';
          try{localStorage.setItem('zs_vault_on','1')}catch(e){}
          await sealNow(clone(save));return}
        if(!v||typeof v!=='object'||!v.s){ACG.st.vault='bad';await sealNow(clone(save));return}
        if(v.imp||v.v!==GAME_VERSION){ACG.st.vault='ok';await sealNow(clone(save));return}           // import légitime ou changement de version : le coffre est refait           // changement de version : migration légitime, le coffre est refait
        const cur=ACG.canon(save),old=ACG.canon(v.s);
        if(cur===old){ACG.st.vault='ok';return}
        let guard=false;try{guard=sessionStorage.getItem('zs_vault_rs')==='1'}catch(e){}
        if(guard){ACG.st.vault='bad';ACG.note('Différence avec le coffre persistante : restauration abandonnée');await sealNow(clone(save));return}
        ACG.note('Sauvegarde modifiée hors du jeu : progression restaurée depuis le coffre chiffré');
        try{sessionStorage.setItem('zs_vault_rs','1');localStorage.setItem('zs_vault_msg','Modification de la sauvegarde détectée (anti-triche) : progression restaurée depuis le coffre chiffré');
          localStorage.setItem(SAVE_KEY+'_bak',localStorage.getItem(SAVE_KEY)||'');localStorage.setItem(SAVE_KEY,JSON.stringify(v.s))}catch(e){}
        halt=true;noPersist=true;ACG.st.vault='restored';setTimeout(()=>location.reload(),250);
      }).catch(()=>{ACG.st.vault='off'});
    }};
})();
let noPersist=false;
function persist(){
  if(noPersist) return;
  try{
    const prev=localStorage.getItem(SAVE_KEY);if(prev&&!ACG.st.tampered) localStorage.setItem(SAVE_KEY+'_bak',prev);   // copie de secours = version précédente (jamais une version modifiée)
    ACG.stamp(save);
    localStorage.setItem(SAVE_KEY,JSON.stringify(save));savedAt=Date.now();localStorage.setItem(SAVE_KEY+'_t',savedAt);saveOK=true;
    if(VAULT&&!ACG.st.tampered) VAULT.seal(save);
  }catch(e){saveOK=false}
}
VAULT.boot();try{const vm=localStorage.getItem('zs_vault_msg');if(vm){localStorage.removeItem('zs_vault_msg');setTimeout(()=>flash(vm),1800)}}catch(e){}
try{if(navigator.storage&&navigator.storage.persist) navigator.storage.persist()}catch(e){}   // demande au navigateur de ne pas effacer la sauvegarde
addEventListener('pagehide',persist);document.addEventListener('visibilitychange',()=>{if(document.hidden) persist()});
let saveMsg='',saveMsgT=0,saveConfirm=false;
const saveNote=t=>{saveMsg=t;saveMsgT=300};
async function exportSave(){
  try{
    persist();const vs=await VAULT.mac(ACG.canon(save));                    // signature liée à CET appareil (clé non extractable) : un fichier modifié ne peut plus être importé
    const blob=new Blob([JSON.stringify({game:'the-infected-grounds',v:5,date:new Date().toISOString(),vs,data:save},null,1)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='infected-grounds-sauvegarde.json';document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);saveNote('Fichier de sauvegarde créé');
  }catch(e){saveNote('Export impossible')}
}
const notBetter=(o,v)=>{                                                    // un ancien fichier (sans signature d'appareil) ne peut qu'être MOINS bon que le coffre
  try{
    if(+o.bank>+v.bank||+o.xp>+v.xp||(o.hpLvl|0)>(v.hpLvl|0)||(o.dmgLvl|0)>(v.dmgLvl|0)) return false;
    for(const k in (o.own||{})) if(o.own[k]&&!(v.own||{})[k]) return false;
    for(const k in (o.up||{})) if(((o.up[k]&&o.up[k].lvl)|0)>(((v.up||{})[k]&&v.up[k].lvl)|0)) return false;
    for(const k in (o.boost||{})) if((o.boost[k]|0)>((v.boost||{})[k]|0)) return false;
    for(const k in (o.skinsOwned||{})) if(o.skinsOwned[k]&&!(v.skinsOwned||{})[k]) return false;
    for(const k in (o.mapClear||{})) if(o.mapClear[k]&&!(v.mapClear||{})[k]) return false;
    for(const m in (o.mapWaves||{})) for(const d in o.mapWaves[m]) if((o.mapWaves[m][d]|0)>(((v.mapWaves||{})[m]||{})[d]|0)) return false;
    return true;
  }catch(e){return false}
};
function importSave(){
  const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';
  inp.onchange=()=>{
    const f=inp.files&&inp.files[0];if(!f) return;
    const rd=new FileReader();
    rd.onload=async()=>{
      try{
        let o=JSON.parse(rd.result);const vs=o&&o.vs;if(o&&o.data) o=o.data;
        if(!o||typeof o!=='object'||typeof o.own!=='object'||isNaN(+o.bank)) throw 0;
        if(ACG.plaus(o).length){saveNote('Valeurs impossibles : import refusé (C02 Anti-Cheat)');return}
        const older=!o.ver||verCmp(String(o.ver),GAME_VERSION)<0;              // sauvegarde exportée par une mise à jour antérieure
        const sigOk=o.ac&&o.ac.s?o.ac.s===ACG.sign(ACG.canon(o)):null;
        let how='';
        if(VAULT.ok&&vs&&await VAULT.macOk(ACG.canon(o),vs)) how='appareil';                 // exportée par cet appareil : toujours acceptée
        else if(older&&sigOk!==false||older&&sigOk===false) how='ancienne version';          // ancienne mise à jour : acceptée (vérifications de plausibilité faites)
        else if(sigOk!==false){                                                              // version actuelle sans signature d'appareil : ne doit rien apporter de plus que le coffre
          const cur=VAULT.ok?await VAULT.open():null;
          if(cur&&cur!=='bad'&&cur.s&&notBetter(o,cur.s)) how='coffre';
          else if(!VAULT.ok||cur===null||cur===undefined) how='sans coffre';
        }
        if(!how){saveNote('Import refusé (C02 Anti-Cheat) : fichier modifié ou non signé par cet appareil');return}
        ACG.note('Import de sauvegarde accepté ('+how+(o.ver?', V'+o.ver:'')+')');
        delete o.ac;try{localStorage.setItem('zs_acimp','1')}catch(e){}
        const apply=()=>{localStorage.setItem(SAVE_KEY+'_bak',localStorage.getItem(SAVE_KEY)||JSON.stringify(save));localStorage.setItem(SAVE_KEY,JSON.stringify(o));noPersist=true;saveNote('Progression importée'+(older?' (version antérieure convertie)':'')+'…');setTimeout(()=>location.reload(),600)};
        VAULT.sealThen(o,apply,true);
      }catch(e){saveNote('Fichier invalide')}
    };
    rd.readAsText(f);
  };
  inp.click();
}
function resetSave(){
  noPersist=true;
  VAULT.clearThen(()=>{try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem(SAVE_KEY+'_bak');localStorage.removeItem(SAVE_KEY+'_t');localStorage.removeItem('zs_acm');localStorage.removeItem('zs_acimp');localStorage.removeItem('zs_vault_on')}catch(e){}location.reload()});
}
function quitGame(){
  persist();try{if(document.fullscreenElement||document.webkitFullscreenElement)(document.exitFullscreen||document.webkitExitFullscreen).call(document)}catch(e){}
  try{if(AMASTER) AMASTER.gain.value=0;if(MUSIC) MUSIC.pause()}catch(e){}
  state='bye';try{window.close()}catch(e){}                         // un navigateur ne ferme que les onglets ouverts par un script : sinon l'écran d'au revoir s'affiche
}
function drawQuit(){
  ctx.fillStyle='#000000ea';ctx.fillRect(0,0,W,H);ctx.textAlign='center';barbed(0,W,12,.8);
  if(state==='quit'){
    ctx.fillStyle='#e9e1d0';ctx.font='400 44px '+TITLE;ctx.fillText('QUITTER LE JEU ?',W/2,200);
    ctx.fillStyle='#8a8178';ctx.font='500 18px '+FONT;ctx.fillText('Ta progression est enregistrée automatiquement.',W/2,236);
    btn(menuRects,W/2-210,280,200,54,'OUI, QUITTER',{act:quitGame,size:22});
    btn(menuRects,W/2+10,280,200,54,'NON',{act:()=>state='menu',size:22});
  } else {
    ctx.fillStyle='#e9e1d0';ctx.font='400 54px '+TITLE;ctx.fillText('À BIENTÔT',W/2,210);
    ctx.fillStyle='#d8d2c8';ctx.font='500 19px '+FONT;ctx.fillText('Ta progression est sauvegardée. Tu peux fermer cet onglet.',W/2,252);
    btn(menuRects,W/2-110,300,220,50,'REVENIR AU JEU',{act:()=>{state='menu';try{musicApply()}catch(e){}try{if(AMASTER) AMASTER.gain.value=.55*SET.vol}catch(e){}},size:20});
  }
  ctx.textAlign='left';
}
function drawMaps(){
  ctx.fillStyle='#000000e0';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  const ttl=mapTrain?'ENTRAÎNEMENT : CHOISIS UNE CARTE':'CHOISIS UNE CARTE';
  ctx.fillStyle='#000';ctx.font='400 36px '+TITLE;ctx.fillText(ttl,43,59);ctx.fillStyle='#e9e1d0';ctx.fillText(ttl,40,56);
  ctx.fillStyle='#7a2c1c';ctx.fillRect(40,64,200,3);
  ctx.fillStyle='#e0a526';ctx.font='700 20px '+FONT;ctx.textAlign='right';ctx.fillText(tr('Niveau').toUpperCase()+' '+curLevel()+'   ·   $'+save.bank,W-40,50);ctx.textAlign='left';
  const sel=MAPS.find(m=>m.id===save.sel.map)||MAPS[0];
  const cw=290,ch=96,gx=10,gy=10;
  MAPS.forEach((m,i)=>{
    const x=40+(i%3)*(cw+gx),y=78+Math.floor(i/3)*(ch+gy),ok=mapUnlocked(m),on=m===sel&&ok,hot=mouse.x>=x&&mouse.x<=x+cw&&mouse.y>=y&&mouse.y<=y+ch;
    menuRects.push({x,y,w:cw,h:ch,act:()=>{if(!ok){sfx('hurt');return}save.sel.map=m.id;const d=DIFFS.find(q=>q.id===save.sel.diff)||DIFFS[1];if(!diffUnlocked(m,d)) save.sel.diff='normal';persist()}});
    ctx.save();ctx.beginPath();ctx.rect(x,y,cw,ch);ctx.clip();
    const g=ctx.createLinearGradient(0,y,0,y+ch);g.addColorStop(0,m.pal.sky[0]);g.addColorStop(.5,m.pal.sky[2]);g.addColorStop(1,m.pal.sky[3]);ctx.fillStyle=g;ctx.fillRect(x,y,cw,ch);
    for(let k=0;k<11;k++){const bw=18+(k*7%14),bh=22+(k*29%38),bx=x+k*27-4;ctx.fillStyle=k%2?m.pal.far:m.pal.near;ctx.fillRect(bx,y+ch-14-bh,bw,bh+14)}
    ctx.fillStyle=m.pal.road[0];ctx.fillRect(x,y+ch-14,cw,14);
    if(!ok){ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(x,y,cw,ch)}
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(x,y,cw,28);
    ctx.restore();
    ctx.strokeStyle=on?'#e2542e':hot&&ok?'#a8553a':'#4a3a2e';ctx.lineWidth=on?3:2;ctx.strokeRect(x+1,y+1,cw-2,ch-2);
    ctx.fillStyle=ok?'#f2efe8':'#8a8178';ctx.font='700 17px '+FONT;ctx.fillText(m.name,x+10,y+20,cw-20);
    if(!ok){padlock(x+cw/2,y+58,1.2,'#a89f94');ctx.fillStyle='#e2542e';ctx.font='700 14px '+FONT;ctx.textAlign='center';ctx.fillText(tr('Niveau').toUpperCase()+' '+m.lvl+'  '+tr('requis').toUpperCase(),x+cw/2,y+ch-34);ctx.font='500 12px '+FONT;ctx.fillStyle='#d8d2c8';ctx.fillText('ou bats le MAGICIEN (manche 10) de la carte précédente',x+cw/2,y+ch-16,cw-16);ctx.textAlign='left'}
    else{ctx.fillStyle='#d8d2c8';ctx.font='500 13px '+FONT;ctx.fillText((m.world<3000?'PETITE':m.world<4000?'MOYENNE':m.world<4600?'GRANDE':'IMMENSE')+'  ·  gains ×'+m.gain,x+10,y+ch-20)}
  });
  // détails de la carte choisie
  const dx=40,dy=292,dw=560,dh=118;
  panel(dx,dy,dw,dh,{grunge:.7,norivets:true});
  ctx.fillStyle='#f2efe8';ctx.font='700 20px '+FONT;ctx.fillText(sel.name,dx+14,dy+26);
  ctx.font='500 15px '+FONT;let ly=dy+50;
  for(const t of sel.pros){ctx.fillStyle='#9fd18a';ctx.fillText('+  '+t,dx+14,ly,dw-28);ly+=22}
  for(const t of sel.cons){ctx.fillStyle='#ff7a5a';ctx.fillText('−  '+t,dx+14,ly,dw-28);ly+=22}
  // difficulté
  if(mapTrain){ctx.fillStyle='#ffd45a';ctx.font='700 17px '+FONT;ctx.fillText('Mode entraînement : toutes les armes, aucun gain (argent et XP).',40,438)}
  else{
    ctx.fillStyle='#8a8178';ctx.font='700 13px '+FONT;ctx.fillText('DIFFICULTÉ  ·  multiplie tes gains (argent et XP)',40,430);
    const bw=136,bg=5;
    DIFFS.forEach((d,i)=>{
      const x=40+i*(bw+bg),y=438,ok=diffUnlocked(sel,d),on=save.sel.diff===d.id&&ok,hot=ok&&mouse.x>=x&&mouse.x<=x+bw&&mouse.y>=y&&mouse.y<=y+40;
      menuRects.push({x,y,w:bw,h:40,act:()=>{if(ok){save.sel.diff=d.id;persist()}else sfx('hurt')}});
      panel(x,y,bw,40,{top:on?'#4a2018':hot?'#3a2e28':ok?'#2d2723':'#1b1715',bot:on?'#2a100c':'#15110f',edge:on?'#e2542e':hot?'#a8553a':'#4a3a2e',norivets:true});
      ctx.fillStyle=ok?'#f2efe8':'#6b625b';ctx.font='700 15px '+FONT;ctx.fillText(d.n,x+10,y+17,bw-14);
      ctx.fillStyle=ok?'#ffd45a':'#6b625b';ctx.font='700 14px '+FONT;ctx.fillText('gains ×'+d.g,x+10,y+34);
      if(!ok) padlock(x+bw-18,y+20,.55,'#8a8178');
    });
    const dsel=DIFFS.find(d=>d.id===save.sel.diff)||DIFFS[1];
    const nx=DIFFS.find(d=>!diffUnlocked(sel,d));
    ctx.font='500 14px '+FONT;
    if(nx){ctx.fillStyle='#e2542e';ctx.fillText(nx.n+' : réussis '+nx.need+' vagues en '+DIFFS.find(d=>d.id===nx.from).n+' sur cette carte  ('+Math.min(nx.need,wavesOn(sel,nx.from))+' / '+nx.need+')',40,494)}
    else{ctx.fillStyle='#9fd18a';ctx.fillText('Toutes les difficultés sont débloquées sur cette carte.',40,494)}
    ctx.fillStyle='#8a8178';ctx.fillText('Zombies : vie ×'+dsel.hp+', dégâts ×'+dsel.dmg+', vitesse ×'+dsel.sp+'   ·   Record sur cette carte : vague '+wavesOn(sel,dsel),40,516);
  }
  // boutons
  const bx=620;
  btn(menuRects,bx,292,300,56,mapTrain?'ENTRAÎNEMENT':'JOUER',{act:()=>{training=mapTrain;reset(false)},size:28});
  btn(menuRects,bx,356,300,40,'ARSENAL',{act:()=>{mapTrain=false;openUpgrades()},size:20});
  btn(menuRects,bx,402,300,40,'PERSONNALISATION',{act:()=>state='custom',size:20});
  btn(menuRects,bx,448,300,40,'RETOUR',{act:()=>state='playhub',size:20});
}
function drawSaves(){
  ctx.fillStyle='#000000e0';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('SAUVEGARDE',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('SAUVEGARDE',40,58);
  ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,200,3);
  panel(40,90,880,120,{grunge:.7,norivets:true});
  ctx.font='700 20px '+FONT;ctx.fillStyle=saveOK?'#9fd18a':'#ff6a4a';
  ctx.fillText(saveOK?'Sauvegarde automatique active sur cet appareil':'ATTENTION : le navigateur refuse d\'enregistrer (navigation privée ?)',60,122);
  ctx.font='500 17px '+FONT;ctx.fillStyle='#d8d2c8';
  ctx.fillText('Niveau '+curLevel()+'   ·   $'+save.bank+'   ·   Record : vague '+save.best+'   ·   '+Object.keys(save.own).length+' armes',60,152);
  ctx.fillText(savedAt?'Dernier enregistrement : '+new Date(savedAt).toLocaleString():'Aucun enregistrement pour l\'instant',60,178);
  ctx.fillStyle='#8a8178';ctx.font='500 14px '+FONT;
  ctx.fillText('Ta progression est enregistrée automatiquement. Exporte un fichier pour la garder en sécurité ou la passer sur un autre appareil.',40,236);
  btn(menuRects,40,262,420,56,'EXPORTER LA SAUVEGARDE',{act:exportSave,size:22,sub:'Télécharge un fichier'});
  btn(menuRects,500,262,420,56,'IMPORTER UNE SAUVEGARDE',{act:importSave,size:22,sub:'Choisis un fichier exporté'});
  btn(menuRects,40,336,420,50,saveConfirm?'CONFIRMER : TOUT EFFACER ?':'EFFACER LA PROGRESSION',{act:()=>{if(saveConfirm) resetSave(); else{saveConfirm=true;saveNote('Clique encore pour confirmer (irréversible)')}},size:20,dim:false});
  btn(menuRects,40,462,200,46,'RETOUR',{act:()=>{saveConfirm=false;state='options'},size:20});
  if(saveMsgT>0){saveMsgT--;ctx.fillStyle='#ffd45a';ctx.font='700 20px '+FONT;ctx.fillText(tr(saveMsg).toUpperCase(),260,492)}
}
const MAX_UP=15;
const hpCost=()=>Math.round(50*Math.pow(save.hpLvl+1,1.5)/10)*10;
let waveBreak=0,runGain=0,runXp=0,lvlStart=1,xpStart=0,overXp=0,overLvl=1,overPulse=0,upShown=null;
// Niveau du compte : l'expérience gagnée en tuant des zombies débloque les armes
const xpForLevel=L=>100*(L-1)*L;      // niv. 2 : 200 XP · niv. 10 : 9 000 · niv. 25 : 60 000
function levelOf(x){let L=1;while(x>=xpForLevel(L+1)) L++;return L}
function curLevel(){return levelOf(save.xp)}
function openUpgrades(){training=false;upShown=xpForLevel(curLevel());state='upgrades'}
// Barre de niveau animée : remplissage, reflet qui défile, étincelle au bout, halo à chaque niveau gagné
function drawXpBar(x,y,w,h,xpVal,pulse){
  const L=levelOf(xpVal),a=xpForLevel(L),b=xpForLevel(L+1),f=Math.max(0,Math.min(1,(xpVal-a)/(b-a)));
  panel(x-3,y-3,w+6,h+6,{norivets:true,grunge:.6,top:'#1a1512',bot:'#0e0b09'});
  ctx.fillStyle='#120e0b';ctx.fillRect(x,y,w,h);
  if(pulse>0){ctx.shadowColor='#ffd45a';ctx.shadowBlur=18*pulse/45}
  const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'#ffd86a');g.addColorStop(1,'#c98a1a');
  ctx.fillStyle=g;ctx.fillRect(x,y,w*f,h);ctx.shadowBlur=0;
  ctx.save();ctx.beginPath();ctx.rect(x,y,w*f,h);ctx.clip();
  const sx=x+((tick*3)%(w+80))-60,sg=ctx.createLinearGradient(sx,0,sx+50,0);
  sg.addColorStop(0,'rgba(255,255,255,0)');sg.addColorStop(.5,'rgba(255,255,255,.55)');sg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=sg;ctx.fillRect(sx,y,50,h);ctx.restore();
  ctx.fillStyle='#00000040';for(let i=1;i<10;i++) ctx.fillRect(x+w*i/10,y,1,h);
  if(f>0&&f<1){ctx.fillStyle='#fff';ctx.globalAlpha=.6+.4*Math.sin(tick*.3);ctx.beginPath();ctx.arc(x+w*f,y+h/2,h*.45,0,7);ctx.fill();ctx.globalAlpha=1}
  ctx.strokeStyle='#5a4a30';ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);
  return {L,a,b};
}
const FONT='Oswald, Impact, "Arial Narrow", sans-serif';
let xp,level,combo,comboT,shake,kills,tick=0,menuRects=[];
let state, wave, money, player, zombies, bullets, particles, spawnQueue, spawnTimer, mouse, keys, msg, msgT;
const mainMelee=i=>{const w=WEAPONS[i];return w&&w.melee?i:Math.max(0,WEAPONS.findIndex(q=>q.name==='Couteau'))};
function reset(toMenu){
  if(toMenu) NM.on=false;
  if(!toMenu) applyMap();
  state='play'; wave=0; money=0; accM=0; accX=0;
  const mhp=100+20*save.hpLvl;
  const mi=mainMelee(training&&trainMain>=0?trainMain:WEAPONS.findIndex(w=>w.name===save.melee));   // l'arme principale est TOUJOURS une arme de mêlée
  player={x:WORLD_W/2,y:GROUND,vy:0,hp:mhp,maxhp:mhp,w:mi,melee:mi,gun:null,
          cd:0,dmgMul:1,hurtCd:0,face:1,step:0,aim:0,swing:0};
  zombies=[]; bullets=[]; particles=[]; fx=[]; crates=[]; decals=[]; acid=[]; bonuses=[]; strikes=[]; turret=null; fxB={shield:0,dmg:0,rapid:0,freeze:0,magnet:0,adren:0};fxL={};fxMax={};ents=[];death=null;revUsed=false;runSrc={kill:{x:0,c:0},wave:{x:0,c:0},bonus:{x:0,c:0}};dailyB=null;dailyT=15000; charXp=0;charLvl=1;charPulse=0;stock=[]; crateT=(7000+rnd()*8000)/curMap.crate;supT=(20000+rnd()*15000)/curMap.sup;xmasReset();cine=null;magWave=false;bloodSnow=0;mgT=meT=0; spawnQueue=[]; spawnTimer=0;
  mouse={x:W/2,y:0,rx:W/2,ry:0,down:false}; keys={}; updateCam(true); msg=''; msgT=0;
  xp=0; level=1; runXp=0; lvlStart=curLevel(); xpStart=save.xp; combo=0; comboT=0; shake=0; kills=0;
  if(!toMenu&&NM.on) nmInit();
  if(toMenu){state='menu';training=false} else if(MP.on&&MP.role==='guest'){state='play'} else{if(!training&&!MP.on&&save.daily.pend){dailyB=save.daily.pend;save.daily.pend=null;persist()}startWave()}
}
function startWave(){
  wave++; state='play'; waveBreak=0;if(NM.on) nmScale(wave);
  if(mpHost()){if(wave>1) mpCheckpoint();for(const q of[MP.hostP].concat(MP.guests.map(g=>g.p))) if(q&&q.dead){q.dead=false;q.hp=Math.round(q.maxhp*.5);q.hurtCd=2500}}
  const n=Math.ceil((5+wave*3)*curMap.count*(1+.55*(mpHost()?MP.guests.length:0))*(NM.on?NM.cnt:1)); spawnQueue=[];
  const pf=Math.min(.4,.12+.03*wave), pt=Math.min(.35,(.04+.025*wave)*curMap.tank);
  for(let i=0;i<n;i++){
    let t='normal', r=Math.random();
    if(wave>=2 && r<pf) t='fast';
    else if(wave>=3 && r>1-pt) t='tank';
    spawnQueue.push(t);
  }
  magWave=false;
  if(wave===10&&!NM.on){spawnQueue=[];spawnTimer=60;startMagicianWave();return}   // manche finale : le magicien, seul
  if(wave%5===0) spawnQueue.unshift('boss'); else if(wave>=2) spawnQueue.unshift('digger');   // toutes les 5 vagues : un boss à la place du fouisseur      // le fouisseur sort en tout dernier (la file se vide par la fin)
  spawnTimer=60; flashG(tr('Vague')+' '+wave);
}
function flash(t){if(flashCtx){flashCtx.msgs.push(t);return}msg=t;msgT=120}

// --- Entrées ---
addEventListener('keydown',e=>{
  audioInit();
  if(ctlEdit&&e.code==='Escape'&&!e.repeat){endCtlEdit();return}
  if(bindListen){e.preventDefault();captureKey(e.code);return}
  keys[e.code]=true;
  if(['Space','ArrowUp','ArrowDown'].includes(e.code)||((state==='play'||state==='keys')&&Object.values(KEYS).some(a=>a.includes(e.code)))) e.preventDefault();
  if(KEYS.full.includes(e.code)) toggleFull();
  if(state==='play'&&!e.repeat&&!MP.on&&KEYS.pause.includes(e.code)) paused=!paused;
  else if(state==='play'&&!paused&&!e.repeat&&KEYS.pick.includes(e.code)) tryPickup();
  if(state==='over' && e.code==='Enter') reset(false);
  else if(state==='menu' && e.code==='Enter'){training=false;reset(false)}
  else if(state==='play' && e.code==='Escape' && !e.repeat) openPause();
  else if(state==='play' && !paused && !e.repeat && KEYS.bonus.includes(e.code)) useBonus();
  else if(state==='pause' && e.code==='Escape' && !e.repeat){if(pauseConfirm) pauseConfirm=false; else closePause()}
  else if(state==='trainpick' && e.code==='Escape') state='pause';
  else if(state==='weapon' && e.code==='Escape') state='upgrades';
  else if(state==='wheel' && e.code==='Escape'){wheelConf=false;state=wheelFrom==='menu'?'menu':'boosts'}
  else if(state==='boosts' && e.code==='Escape') state='upgrades';
  else if(state==='fpsopt' && e.code==='Escape'){state='options';optTab=2}
  else if((state==='mpmenu'||state==='avatars'||state==='nmsetup'||state==='playhub') && e.code==='Escape') state=(state==='mpmenu'||state==='nmsetup')?'playhub':'menu';
  else if(state==='rpsetup' && e.code==='Escape'){rpStop();state='mpmenu'}
  else if((state==='mphost'||state==='mplobby'||state==='mpjoining') && e.code==='Escape'){mpStop();state='mpmenu'}
  else if(state==='acpage' && e.code==='Escape'){state='options';optTab=4}
  else if((state==='gamepad'||state==='padsel'||state==='nmsetup'||state==='playhub'||state==='remote') && e.code==='Escape'){state='options';optTab=3}
  else if(state==='maint' && e.code==='Escape'){state='menu'}
  else if(state==='keys' && e.code==='Escape') state='options';
  else if((state==='maps'||state==='quit'||state==='bye'||state==='shop')&&e.code==='Escape') state='menu';
  else if(state==='saves'&&e.code==='Escape'){saveConfirm=false;state='options'}
  else if((state==='options'||state==='credits'||state==='upgrades'||state==='custom'||state==='lang') && e.code==='Escape') state=(state==='options'&&optFrom==='pause')?'pause':'menu';
});
addEventListener('keyup',e=>keys[e.code]=false);
let sliderActive=null;
cv.addEventListener('mousemove',e=>{
  const r=cv.getBoundingClientRect();
  mouse.rx=(e.clientX-r.left)*W/r.width; mouse.ry=(e.clientY-r.top)*H/r.height;syncMouse();gpAim.on=false;GPS.mouseT=performance.now();
  if(ctlEdit) ceMove({x:mouse.rx,y:mouse.ry},'m');
  if(sliderActive) sliderActive.act();
});
// --- Mobile : commandes tactiles (déplacement, saut, tir), toucher sur les caisses et les bonus ---
const tctl={left:false,right:false,jump:false,fire:false};
const gctl={left:false,right:false,jump:false,fire:false},gpAim={on:false},rin={left:false,right:false,jump:false,fire:false,ax:0,ay:0,aim:false},ceRects=[];
let ctlEdit=null;
const tpts=new Map();
const TPICK={x:0,y:0,r:38},TB={left:{},right:{},jump:{},fire:{}},TPAUSE={w:44,h:44},STOCK={w:248,h:62};
// --- disposition des boutons tactiles (personnalisable : position, taille, opacité) ---
const TKEYS=['left','right','jump','fire','pick','pause','stock'];
const TBASE={left:{r:46},right:{r:46},jump:{r:42},fire:{r:58},pick:{r:38},pause:{w:44,h:44},stock:{w:248,h:62}};
const TELS={left:TB.left,right:TB.right,jump:TB.jump,fire:TB.fire,pick:TPICK,pause:TPAUSE,stock:STOCK};
const PADK=['left','right','jump','fire','aim','pick','bonus','pause'];
const PBASE={left:46,right:46,jump:42,fire:58,aim:72,pick:38,bonus:38,pause:28};
const PDEF={left:[.1,.7],right:[.23,.7],jump:[.8,.8],fire:[.9,.62],aim:[.62,.68],pick:[.9,.36],bonus:[.74,.4],pause:[.93,.16]};
const PB={};for(const k of PADK) PB[k]={k,disc:true,base:PBASE[k],r:PBASE[k],s:1,cx:0,cy:0,x:0,y:0};
const TOP=()=>(save.tui&&save.tui.op)||1;
function placeEl(e,cx,cy){e.cx=cx;e.cy=cy;if(e.disc){e.x=cx;e.y=cy}else{e.x=cx-e.w/2;e.y=cy-e.h/2}}
function tdefault(k,l,rr){switch(k){
  case 'left':return[l+78,H-150];case 'right':return[l+188,H-150];case 'jump':return[W-rr-210,H-126];case 'fire':return[W-rr-100,H-166];
  case 'pick':return[W-rr-100,H-268];case 'pause':return[W-rr-34,106];default:return[W-rr-138,H-45]}}
function layoutTouch(){
  const l=SAFE.l,rr=SAFE.r,L=save.tlay||{};
  for(const k of TKEYS){
    const e=TELS[k],b=TBASE[k],o=L[k];e.k=k;e.disc='r' in b;e.base=e.disc?b.r:0;
    let c=tdefault(k,l,rr);if(o) c=[l+o.x*(W-l-rr),o.y*H];
    e.s=o&&e.disc?(o.s||1):1;
    if(e.disc) e.r=b.r*e.s;else{e.w=b.w;e.h=b.h}
    placeEl(e,c[0],c[1]);
  }
  layoutPad();
}
function layoutPad(){
  const l=SAFE.l,rr=SAFE.r,L=save.play||{};
  for(const k of PADK){const e=PB[k],o=L[k],d=o?[o.x,o.y]:PDEF[k];e.s=o?(o.s||1):1;e.r=PBASE[k]*e.s;placeEl(e,l+d[0]*(W-l-rr),d[1]*H)}
}
layoutTouch();
const MENU_STATES=['menu','shop','quit','bye','maps','saves','options','credits','upgrades','weapon','keys','custom','lang','pause','trainpick','over','boosts','wheel','fpsopt','maint','gamepad','padsel','nmsetup','playhub','remote','padjoin','mpmenu','mphost','mplobby','mpjoin','mpjoining','acpage','avatars','rpsetup','rpjoin'];
let autoTarget=null;
const inR=(p,r)=>p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;
function tpos(t){
  if(FORCED){const vv=window.visualViewport,vw=vv?vv.width:innerWidth,vh=vv?vv.height:innerHeight,dx=t.clientX-vw/2,dy=t.clientY-vh/2;return{x:(dy+CW/2)*W/CW,y:(-dx+CH/2)*H/CH}}
  const r=cv.getBoundingClientRect();return{x:(t.clientX-r.left)*W/r.width,y:(t.clientY-r.top)*H/r.height}}
function tHit(x,y){for(const k in TB){const b=TB[k];if(Math.hypot(x-b.x,y-b.y)<=b.r*1.3) return k}return null}
function tRecalc(){tctl.left=tctl.right=tctl.jump=tctl.fire=false;for(const v of tpts.values()) if(v) tctl[v]=true}
function pack(a,k){let j=0;for(let i=0;i<a.length;i++){const v=a[i];if(k(v)) a[j++]=v}a.length=j;return a}
function takeCrate(c){pickCrate(c);c.dead=true;crates=crates.filter(k=>!k.dead);nearC=null;autoTarget=null}
function tapCrate(x,y){x+=camX;                           // toucher une caisse : la ramasse si on est à portée, sinon le soldat s'y rend
  for(const c of crates){
    if(Math.abs(x-c.x)<40&&y>c.y-84&&y<c.y+16){
      if(Math.hypot(player.x-c.x,(player.y-30)-(c.y-12))<110) takeCrate(c); else autoTarget=c;
      return true;
    }
  }
  return false;
}
function menuPress(){
  for(const r of menuRects) if(mouse.x>=r.x&&mouse.x<=r.x+r.w&&mouse.y>=r.y&&mouse.y<=r.y+r.h){sfx('click');r.act();if(r.slider) sliderActive=r;return true}
  return false;
}
cv.addEventListener('mousedown',()=>{
  audioInit();
  if(ctlEdit&&(state==='play'||state==='padmode')&&ceDown({x:mouse.rx,y:mouse.ry},'m')) return;
  if(state==='padmode'){padTouch({x:mouse.rx,y:mouse.ry},'m','down');return}
  if(MENU_STATES.includes(state)){menuPress();return}
  if(state==='play'&&stock.length&&inR(mouse,STOCK)){useBonus();return}       // clic sur le bonus en stock = l'utiliser
  mouse.down=true;
});
addEventListener('mouseup',()=>{mouse.down=false;sliderActive=null;if(ctlEdit) ceUp('m');if(state==='padmode') padTouch(null,'m','up')});
cv.addEventListener('touchstart',e=>{
  if(e.cancelable) e.preventDefault();touchUsed=true;audioInit();
  for(const t of e.changedTouches){
    const p=tpos(t);mouse.rx=p.x;mouse.ry=p.y;syncMouse();gpAim.on=false;
    if(ctlEdit&&(state==='play'||state==='padmode')&&ceDown(p,t.identifier)) continue;
    if(state==='padmode'){padTouch(p,t.identifier,'down');continue}
    if(MENU_STATES.includes(state)){menuPress();continue}
    if(state!=='play'||paused) continue;
    if(inR(p,TPAUSE)){openPause();continue}
    if(stock.length&&inR(p,STOCK)){useBonus();continue}
    if(((nearC&&!nearC.dead)||mpGuest())&&Math.hypot(p.x-TPICK.x,p.y-TPICK.y)<=TPICK.r*1.4){sfx('click');if(mpGuest()) tryPickup();else takeCrate(nearC);continue}
    const k=tHit(p.x,p.y);
    if(k){tpts.set(t.identifier,k);tRecalc();continue}
    if(!mpGuest()) tapCrate(p.x,p.y);
  }
  fit();
},{passive:false});
cv.addEventListener('touchmove',e=>{
  if(e.cancelable) e.preventDefault();
  for(const t of e.changedTouches){
    const p=tpos(t);mouse.rx=p.x;mouse.ry=p.y;syncMouse();
    if(ctlEdit&&(state==='play'||state==='padmode')&&ceMove(p,t.identifier)) continue;
    if(state==='padmode'){padTouch(p,t.identifier,'move');continue}
    if(sliderActive){sliderActive.act();continue}
    if(state==='play'&&tpts.has(t.identifier)){tpts.set(t.identifier,tHit(p.x,p.y));tRecalc()}
  }
},{passive:false});
const tEnd=e=>{if(e.cancelable) e.preventDefault();audioInit();if(!tEnd.fs){tEnd.fs=1;toggleFullIn()}for(const t of e.changedTouches){tpts.delete(t.identifier);if(ctlEdit) ceUp(t.identifier);if(state==='padmode') padTouch(null,t.identifier,'up')}tRecalc();sliderActive=null};
cv.addEventListener('touchend',tEnd,{passive:false});cv.addEventListener('touchcancel',tEnd,{passive:false});
function drawTouch(){
  const disc=(b,on)=>{ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,7);ctx.fillStyle=on?'rgba(226,84,46,.6)':'rgba(16,12,10,.5)';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=on?'#ff8a5a':'rgba(255,255,255,.4)';ctx.stroke()};
  ctx.save();ctx.globalAlpha=TOP();
  for(const k in TB) disc(TB[k],tctl[k]);
  ctx.fillStyle='rgba(255,255,255,.9)';ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=5;ctx.lineCap='round';ctx.lineJoin='round';
  let b=TB.left;ctx.beginPath();ctx.moveTo(b.x+14,b.y-20);ctx.lineTo(b.x-14,b.y);ctx.lineTo(b.x+14,b.y+20);ctx.closePath();ctx.fill();
  b=TB.right;ctx.beginPath();ctx.moveTo(b.x-14,b.y-20);ctx.lineTo(b.x+14,b.y);ctx.lineTo(b.x-14,b.y+20);ctx.closePath();ctx.fill();
  b=TB.jump;ctx.beginPath();ctx.moveTo(b.x-18,b.y+8);ctx.lineTo(b.x,b.y-10);ctx.lineTo(b.x+18,b.y+8);ctx.stroke();ctx.beginPath();ctx.moveTo(b.x-18,b.y+20);ctx.lineTo(b.x,b.y+2);ctx.lineTo(b.x+18,b.y+20);ctx.stroke();
  b=TB.fire;ctx.beginPath();ctx.arc(b.x,b.y,22,0,7);ctx.stroke();ctx.beginPath();ctx.arc(b.x,b.y,5,0,7);ctx.fill();
  for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]]){ctx.beginPath();ctx.moveTo(b.x+dx*14,b.y+dy*14);ctx.lineTo(b.x+dx*32,b.y+dy*32);ctx.stroke()}
  if((nearC&&!nearC.dead)||ctlEdit||mpGuest()){const q=TPICK,pu=1+.06*Math.sin(tick*.2);ctx.beginPath();ctx.arc(q.x,q.y,q.r*pu,0,7);ctx.fillStyle='rgba(201,162,39,.75)';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#ffd45a';ctx.stroke();
    ctx.fillStyle='#5a4220';ctx.fillRect(q.x-15,q.y-12,30,24);ctx.fillStyle='#e0b86a';ctx.fillRect(q.x-12,q.y-9,24,18);ctx.fillStyle='#5a4220';ctx.fillRect(q.x-3,q.y-12,6,24);ctx.fillRect(q.x-15,q.y-2,30,4)}
  const p=TPAUSE;ctx.fillStyle='rgba(16,12,10,.55)';ctx.beginPath();ctx.roundRect(p.x,p.y,p.w,p.h,8);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='#fff';ctx.fillRect(p.x+13,p.y+11,6,22);ctx.fillRect(p.x+25,p.y+11,6,22);
  ctx.restore();
}
// --- Adaptation automatique à tous les écrans : le jeu garde son format 16:9 et occupe le maximum de place ---
const rotEl=document.getElementById('rot');let portOK=false;

function updateRot(){rotEl.style.display='none'}


// --- Caisses larguées du ciel : seule source d'armes à feu en partie. Munitions (5 à 100) OU durée (10 à 40 s) ---
// Seules les armes à feu déjà achetées peuvent tomber dans une caisse
const ownedGuns=()=>WEAPONS.map((w,i)=>i).filter(i=>!WEAPONS[i].melee&&isOwned(i));
const crateX=()=>{let cx=camX;if(mpHost()){const ps=targets();cx=ps[rndInt(ps.length)].p.x-W/2}const a=Math.max(70,cx-300),b=Math.min(WORLD_W-70,cx+W+300);return a+rnd()*(b-a)};   // tombent autour de l'écran, parfois hors champ (voir les flèches)
function spawnCrate(){
  if(NM.on&&!MP.on) return false;                                // Nightmare solo : les armes viennent de ta sélection, pas des caisses
  // caisse d'arme : tirage uniforme parmi les armes à feu débloquées → chacune a 100 % / (nombre d'armes) de chances
  const pool=ownedGuns(),k=rndInt(pool.length),byTime=rnd()<.5;
  const c={x:crateX(),y:-30,vy:0,landed:false,age:0,ph:rnd()*6,w:pool[k],ammo:byTime?0:5+rndInt(96),time:byTime?(10+rndInt(31))*1000:0};
  crates.push(c);flashG('CAISSE LARGUÉE !');return true;
}
// caisse métallique : soin ou armure (50 / 50), tombe séparément des caisses d'armes et reste 3 fois plus longtemps
const SUP_LIFE=66000;
function spawnSupply(){
  if(NM.on&&!NM.bonus) return;
  crates.push({x:crateX(),y:-30,vy:0,landed:false,age:0,ph:rnd()*6,w:0,ammo:0,time:0,sup:rndInt(2)?'heal':'shield'});
  flashG('CAISSE MÉTALLIQUE !');
}
