#!/usr/bin/env python3
"""Télécharge les modèles CC0 (KayKit : City Builder Bits, Kay Lousberg, https://www.kaylousberg.com) et les assemble dans js/models-city.js
(glTF + données binaires en base64 : fonctionne même en ouvrant index.html directement, sans serveur).  Usage : python3 tools/pack-models.py"""
import json,base64,urllib.request,sys
BASE='https://cdn.jsdelivr.net/gh/KayKit-Game-Assets/KayKit-City-Builder-Bits-1.0@main/addons/kaykit_city_builder_bits/Assets/'
NAMES=['car_hatchback','car_police','car_sedan','car_stationwagon','car_taxi','dumpster','firehydrant','trafficlight_A','trafficlight_B','trash_A','trash_B','bench','bush','box_A','box_B']
def get(u): return urllib.request.urlopen(u,timeout=30).read()
tex=get(BASE+'gltf/citybits_texture.png')
out={}
for n in NAMES:
    g=json.loads(get(BASE+'gltf/%s.gltf'%n));bn=get(BASE+'gltf/%s.bin'%n)
    g['buffers'][0]['uri']='data:application/octet-stream;base64,'+base64.b64encode(bn).decode()
    for im in g.get('images',[]): im['uri']='@TEX'
    out[n]=g
js='// Modèles CC0 © Kay Lousberg (KayKit : City Builder Bits) — généré par tools/pack-models.py, ne pas modifier à la main\nconst FW_MODELS_TEX=\'data:image/png;base64,%s\';\nconst FW_MODELS=%s;\n'%(base64.b64encode(tex).decode(),json.dumps(out,separators=(',',':')))
open('js/models-city.js','w').write(js)
open('assets/models/LICENSE-KayKit-CC0.txt','wb').write(get(BASE+'LICENSE.txt'))
print(len(js)//1024,'Ko',len(out),'modèles')
