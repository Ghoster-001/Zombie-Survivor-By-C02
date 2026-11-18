// ===== Cartes et difficultés =====
const BOSSES=[{n:'LE COLOSSE',id:'brute',hp:520,sp:.85,dmg:18,size:2.1,skin:'#8a3a30',shirt:'#3a2220'},{n:'LE CRACHEUR',id:'spitter',hp:650,sp:.75,dmg:14,size:1.9,skin:'#7ab04a',shirt:'#3a5a2a'},{n:"L'INVOCATEUR",id:'summoner',hp:800,sp:.7,dmg:16,size:1.8,skin:'#8a6ab0',shirt:'#2a1a3a'}];
const MAPS=[
 {id:'ruines',name:'RUES EN RUINE',lvl:1,world:3600,count:1,hp:1,sp:1,crate:1,sup:1,drop:1,gain:1,tank:1,dark:0,
  pros:['Équilibrée : idéale pour débuter'],cons:['Aucun avantage particulier'],
  pal:{sky:['#0b0a10','#3a1519','#a8401f','#e0763a'],far:'#2b2230',near:'#17121b',win:'245,170,70',sun:'217,165,106',fog:'190,110,80',road:['#2b2730','#141116'],walk:'#4a4450'}},
 {id:'usine',name:'ZONE INDUSTRIELLE',lvl:4,world:3800,count:1,hp:1.25,sp:1,crate:1,sup:1.7,drop:1,gain:1.15,tank:1,dark:0,
  pros:['Caisses de soin et d\'armure ×1,7','Gains +15 %'],cons:['Zombies +25 % de vie'],
  pal:{sky:['#07090d','#16262c','#35666b','#7fb0a5'],far:'#1f2d33',near:'#0f181c',win:'150,230,210',sun:'170,220,200',fog:'110,170,160',fogK:1.3,road:['#232a2c','#101517'],walk:'#3d4a4d'}},
 {id:'banlieue',name:'BANLIEUE DE NUIT',lvl:8,world:3400,count:1,hp:1,sp:1.15,crate:1,sup:1,drop:1.8,gain:1,tank:1,dark:.4,dkc:'2,3,14',
  pros:['Bonus de zombies +80 % plus fréquents'],cons:['Zombies +15 % plus rapides','Visibilité réduite (nuit)'],
  pal:{sky:['#02030a','#080d22','#14224a','#2a3f78'],far:'#141a30',near:'#090c1a',win:'255,225,140',sun:'200,210,240',fog:'60,80,140',road:['#171a26','#0a0b12'],walk:'#2c3042'}},
 {id:'desert',name:'BASE DANS LE DÉSERT',lvl:12,world:5000,count:1.3,hp:1,sp:1,crate:1.7,sup:1,drop:1,gain:1.3,tank:1,dark:0,
  pros:['Caisses d\'armes ×1,7','Gains +30 %'],cons:['Carte immense','Zombies +30 % plus nombreux'],
  pal:{sky:['#2a1a2e','#a84a3a','#e8913f','#f6cf7a'],far:'#6b4a3a',near:'#3b2a22',win:'255,200,110',sun:'255,225,160',fog:'240,180,110',fogK:.7,road:['#6a5238','#3b2d1f'],walk:'#8a7048'}},
 {id:'metro',name:'MÉTRO ABANDONNÉ',lvl:17,world:2400,count:1.5,hp:.9,sp:1.1,crate:.8,sup:1.3,drop:1.3,gain:1.5,tank:1,dark:.3,dkc:'4,3,6',
  pros:['Gains +50 %','Soins et bonus plus fréquents'],cons:['Carte étroite','50 % de zombies en plus, plus rapides'],
  pal:{sky:['#050407','#120d16','#241a26','#3a2c3a'],far:'#1c1520',near:'#0d0a10',win:'120,255,170',sun:'90,110,100',fog:'90,70,90',fogK:1.8,road:['#1f1b22','#0c0a0e'],walk:'#37313b'}},
 {id:'foret',name:'FORÊT BRUMEUSE',lvl:22,world:4200,count:1,hp:1.1,sp:1,crate:1.2,sup:1.2,drop:1.2,gain:1.4,tank:1.8,dark:.3,dkc:'140,160,150',
  pros:['Gains +40 %','Plus de caisses'],cons:['Brouillard épais','Zombies +10 % de vie, plus de tanks'],
  pal:{sky:['#0b1410','#1e3a2c','#4e7a5c','#a8c8a0'],far:'#2a4234',near:'#15261d',win:'200,255,180',sun:'200,230,190',fog:'150,190,160',fogK:2.6,road:['#2a3328','#121a14'],walk:'#46543f'}}
];
const DIFFS=[
 {id:'easy',n:'FACILE',g:.5,hp:.7,dmg:.7,sp:.95},
 {id:'normal',n:'NORMAL',g:1,hp:1,dmg:1,sp:1},
 {id:'hard',n:'DIFFICILE',g:2,hp:1.5,dmg:1.4,sp:1.1,from:'normal',need:5},
 {id:'imp',n:'IMPOSSIBLE',g:5,hp:2.5,dmg:2,sp:1.2,from:'hard',need:8}
];
let curMap=MAPS[0],curDiff=DIFFS[1],PAL=MAPS[0].pal,mapTrain=false;
   // map défilante : 3600 px de large (~3,7 écrans)
function updateCam(snap){const t=Math.max(0,Math.min(WORLD_W-W,player.x-W/2+(player.face||1)*70));camX=snap?t:camX+(t-camX)*.12;camX=Math.max(0,Math.min(WORLD_W-W,camX))}
let fx=[],upCat=0,crates=[],crateT=0,supT=0;
let upPage=0;
let saveOK=true,savedAt=0;try{savedAt=+localStorage.getItem(SAVE_KEY+'_t')||0}catch(e){}
