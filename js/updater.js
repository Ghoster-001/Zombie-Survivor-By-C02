// ===== Mise à jour : cherche la dernière version publiée, notifie, et installe en conservant la progression =====
const REMOTE_URL='https://ghoster-001.github.io/Zombie-Survivor-By-C02/';
const UPD={status:'idle',latest:'',lastCheck:0,msg:'',busy:false,url:'',same:false,notified:''};
const verCmp=(a,b)=>{const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<3;i++){const d=(x[i]||0)-(y[i]||0);if(d) return d}return 0};
async function updCheck(manual){
  const now=Date.now();
  if(UPD.busy||(!manual&&now-UPD.lastCheck<20000)) return;
  UPD.busy=true;UPD.lastCheck=now;if(manual||UPD.status!=='avail') UPD.status='check';UPD.msg='';
  const urls=[];
  if(/^https?:$/.test(location.protocol)) urls.push({u:location.href.split('#')[0].split('?')[0],same:true});
  urls.push({u:REMOTE_URL,same:/ghoster-001\.github\.io$/.test(location.hostname)});
  let found=null;
  for(const c of urls){
    try{
      const ctl=typeof AbortController!=='undefined'?new AbortController():null,to=setTimeout(()=>ctl&&ctl.abort(),9000);
      const r=await fetch(c.u+(c.u.includes('?')?'&':'?')+'nc='+Date.now(),{cache:'no-store',signal:ctl?ctl.signal:undefined});clearTimeout(to);
      if(!r.ok) continue;const t=await r.text(),m=t.match(/const GAME_VERSION='([0-9.]+)'/);
      if(m){found={v:m[1],u:c.u,same:c.same};break}
    }catch(e){}
  }
  UPD.busy=false;
  if(!found){if(manual||UPD.status==='check'){UPD.status='err';UPD.msg=navigator.onLine===false?'hors connexion':'recherche impossible'}return}
  UPD.latest=found.v;UPD.url=found.u;UPD.same=found.same;
  if(verCmp(found.v,GAME_VERSION)>0){
    UPD.status='avail';
    if(UPD.notified!==found.v){UPD.notified=found.v;flash('MISE À JOUR DISPONIBLE : V'+found.v);try{sfx('bonus')}catch(e){}}
  } else {UPD.status='ok'}
}
function updApply(){
  if(UPD.status!=='avail') return;
  persist();                                                              // la progression est enregistrée avant de changer de version
  if(UPD.same){
    flash('Installation de la mise à jour…');
    try{if(window.caches&&caches.keys) caches.keys().then(k=>k.forEach(n=>caches.delete(n)))}catch(e){}
    setTimeout(()=>{location.replace(UPD.url+'?v='+UPD.latest+'&t='+Date.now())},500);
  } else {                                                                // autre adresse : la sauvegarde ne suit pas toute seule, on exporte un fichier
    exportSave();flash('Sauvegarde exportée : importe-la sur la nouvelle version');
    try{window.open(UPD.url,'_blank')}catch(e){}
  }
}
try{if(location.search&&/[?&](v|t)=/.test(location.search)) history.replaceState(null,'',location.pathname)}catch(e){}
