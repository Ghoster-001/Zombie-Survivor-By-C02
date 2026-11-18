// ===== V0.57 : profil du joueur (avatar prédéfini + pseudo) =====
const AV_SK=['#f1c27d','#e2b58c','#c68642','#8d5524','#ffdbac'],AV_HR=['#2a1a10','#4a3020','#8a5a2a','#d8c068','#a02a1a','#b8b8b8','#111111'],AV_TOP=['#a02a2a','#2a5aa0','#2a8a4a','#7a4a9a','#c8801a','#3a3a3a'];
const AVATARS=[];
OUTFITS.forEach((o,i)=>{for(const sex of['m','f']){const k=AVATARS.length;AVATARS.push({n:(sex==='f'&&o.nf?o.nf:o.n)+(sex==='f'&&!o.nf?' (F)':''),look:{outfit:i,sex,build:o.belly?1:0,skin:AV_SK[k%5],hair:AV_HR[(k*3)%7],top:null,pants:null,hat:null,shoes:null}})}});
for(let i=0;i<7;i++) for(let v=0;v<3;v++){const k=AVATARS.length,sex=(i+v)%2?'f':'m';AVATARS.push({n:OUTFITS[i].n+' '+(v+2),look:{outfit:i,sex,build:v===2?1:0,skin:AV_SK[(k+2)%5],hair:AV_HR[(k*5+2)%7],top:AV_TOP[(i+v*2)%6],pants:null,hat:null,shoes:null}})}
const AV_BG=['#3a4a6a','#6a3a3a','#3a6a4a','#6a5a2a','#5a3a6a','#2a5a6a','#6a3a5a','#4a4a4a'];
const avIdx=i=>Math.max(0,Math.min(AVATARS.length-1,(i|0)));
const AVC=new Map();
function avCanvas(idx,size){                                              // portrait mis en cache : tête et épaules du personnage, dessinés avec la vraie tenue
  idx=avIdx(idx);const key=idx+'|'+size+'|'+RES;let c=AVC.get(key);if(c) return c;
  if(AVC.size>300) AVC.clear();
  const px=Math.max(1,Math.round(size*RES));c=document.createElement('canvas');c.width=c.height=px;
  const g=c.getContext('2d'),mc=ctx,sl=save.look,sp=prevO,A=AVATARS[idx];
  ctx=g;g.scale(px/size,px/size);
  try{
    const bg=g.createLinearGradient(0,0,0,size);bg.addColorStop(0,AV_BG[idx%AV_BG.length]);bg.addColorStop(1,'#14100e');
    g.fillStyle=bg;g.beginPath();g.arc(size/2,size/2,size/2,0,7);g.fill();
    g.save();g.beginPath();g.arc(size/2,size/2,size/2-.5,0,7);g.clip();
    save.look=A.look;prevO=A.look.outfit;
    const k=size/60;g.translate(size/2,size*.60+60*k);g.scale(k,k);
    drawSoldier({x:0,y:0,face:1,step:0,w:0,aim:0,swing:0,cd:0,muz0:0,muz1:0,hurtCd:0});
    g.restore();
  }catch(e){}finally{save.look=sl;prevO=sp;ctx=mc}
  AVC.set(key,c);return c;
}
function avDraw(idx,x,y,size,ring){
  ctx.drawImage(avCanvas(idx,size),x,y,size,size);
  if(ring){ctx.strokeStyle=ring===true?'#e0a526':ring;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,7);ctx.stroke()}
}
// Fenêtre de saisie intégrée au jeu (le prompt() du navigateur est bloqué dans certains contextes : aperçu intégré, mobiles, plein écran)
function askText(title,init,max,cb){
  if(document.getElementById('askbox')) return;
  const d=document.createElement('div');d.id='askbox';
  d.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;z-index:99999;background:rgba(0,0,0,.82);display:flex;align-items:center;justify-content:center;font-family:Oswald,Arial,sans-serif';
  const box=document.createElement('div');box.style.cssText='background:#1b1613;border:3px solid #e2542e;border-radius:12px;padding:20px;width:min(86vw,420px);color:#e9e1d0;text-align:center;box-sizing:border-box';
  const t=document.createElement('div');t.textContent=title;t.style.cssText='font-size:20px;font-weight:700;margin-bottom:12px';
  const inp=document.createElement('input');inp.type='text';inp.maxLength=max;inp.value=init;inp.autocomplete='off';inp.spellcheck=false;
  inp.style.cssText='width:100%;box-sizing:border-box;font-size:22px;padding:10px;border-radius:8px;border:2px solid #4a3a2e;background:#0b0908;color:#fff;text-align:center;text-transform:uppercase;outline:none;font-family:inherit';
  const row=document.createElement('div');row.style.cssText='display:flex;gap:10px;margin-top:14px';
  const mkb=(lab,bg)=>{const b=document.createElement('button');b.textContent=lab;b.style.cssText='flex:1;font-size:18px;font-weight:700;padding:12px;border-radius:8px;border:0;color:#fff;background:'+bg+';font-family:inherit;cursor:pointer';return b};
  const no=mkb('ANNULER','#4a3a2e'),ok=mkb('VALIDER','#2e7d32');
  const close=v=>{try{d.remove()}catch(e){}if(v!==null&&v!==undefined) cb(v)};
  ok.onclick=()=>close(inp.value);no.onclick=()=>close(null);
  for(const ev of['keydown','keyup','keypress']) d.addEventListener(ev,e=>{e.stopPropagation();if(ev==='keydown'){if(e.key==='Enter') close(inp.value);else if(e.key==='Escape') close(null)}});
  for(const ev of['mousedown','mouseup','touchstart','touchend','pointerdown']) d.addEventListener(ev,e=>e.stopPropagation());
  row.appendChild(no);row.appendChild(ok);box.appendChild(t);box.appendChild(inp);box.appendChild(row);d.appendChild(box);document.body.appendChild(d);
  setTimeout(()=>{try{inp.focus();inp.select()}catch(e){}},60);
}
function renamePseudo(after){askText('TON PSEUDO',mpName(),14,v=>{save.mpname=cleanName(v);persist();if(typeof after==='function') after()})}
let avPage=0;
function drawAvatars(){
  ctx.fillStyle='#000000d8';ctx.fillRect(0,0,W,H);ctx.textAlign='left';barbed(0,W,12,.8);
  ctx.fillStyle='#000';ctx.font='400 38px '+TITLE;ctx.fillText('MON AVATAR',43,61);ctx.fillStyle='#e9e1d0';ctx.fillText('MON AVATAR',40,58);ctx.fillStyle='#7a2c1c';ctx.fillRect(40,66,200,3);
  const per=32,pages=Math.ceil(AVATARS.length/per);if(avPage>=pages) avPage=0;
  for(let k=0;k<per;k++){
    const i=avPage*per+k;if(i>=AVATARS.length) break;
    const x=40+(k%8)*80,y=92+Math.floor(k/8)*80,sel=i===avIdx(save.avatar),hot=mouse.x>=x&&mouse.x<=x+72&&mouse.y>=y&&mouse.y<=y+72;
    menuRects.push({x,y,w:72,h:72,act:()=>{save.avatar=i;persist()}});
    if(hot||sel){ctx.fillStyle=sel?'rgba(224,165,38,.25)':'rgba(255,255,255,.1)';ctx.beginPath();ctx.roundRect(x-3,y-3,78,78,10);ctx.fill()}
    avDraw(i,x,y,72,sel?'#ffd45a':false);
  }
  ctx.fillStyle='#8a8178';ctx.font='500 14px '+FONT;ctx.fillText('PAGE '+(avPage+1)+' / '+pages+'  ·  '+AVATARS.length+' avatars',40,436);
  panel(700,92,220,320,{});
  const a=avIdx(save.avatar);avDraw(a,730,110,160,'#e0a526');
  ctx.textAlign='center';ctx.fillStyle='#f2efe8';ctx.font='700 20px '+FONT;ctx.fillText(cleanName(mpName()),810,306,200);
  ctx.fillStyle='#b9b1a6';ctx.font='500 14px '+FONT;ctx.fillText(AVATARS[a].n,810,330,200);ctx.fillText('NIVEAU '+curLevel(),810,352);
  ctx.textAlign='left';
  btn(menuRects,712,364,196,38,'CHANGER LE PSEUDO',{act:renamePseudo,size:15});
  btn(menuRects,40,470,200,44,'RETOUR',{act:()=>state='menu'});
  btn(menuRects,360,452,140,38,'<  PRÉC.',{act:()=>avPage=(avPage+pages-1)%pages,size:14});
  btn(menuRects,510,452,140,38,'SUIV.  >',{act:()=>avPage=(avPage+1)%pages,size:14});
}
function drawProfileCard(){                                               // carte du joueur dans le menu principal : avatar (clic = choisir) + pseudo (clic = changer)
  const x=520,y=70,w=272,h=78;
  panel(x,y,w,h,{norivets:true});
  avDraw(save.avatar,x+9,y+9,60,'#e0a526');
  menuRects.push({x:x+6,y:y+6,w:66,h:66,act:()=>state='avatars'});
  menuRects.push({x:x+78,y:y+8,w:w-86,h:34,act:renamePseudo});
  const hot=mouse.x>=x+78&&mouse.x<=x+w-8&&mouse.y>=y+8&&mouse.y<=y+42;
  ctx.textAlign='left';ctx.fillStyle=hot?'#ffd45a':'#f2efe8';ctx.font='700 21px '+FONT;ctx.fillText(cleanName(mpName()),x+80,y+32,w-90);
  ctx.fillStyle='#8a8178';ctx.font='500 12px '+FONT;ctx.fillText(hot?'✎ cliquer pour changer le pseudo':'NIVEAU '+curLevel()+'  ·  ✎ pseudo',x+80,y+48,w-90);
  ctx.fillStyle='#b9b1a6';ctx.fillText('clic sur l\'avatar : changer',x+80,y+64,w-90);
}

