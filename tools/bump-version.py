#!/usr/bin/env python3
"""Change la version du jeu : python3 tools/bump-version.py 0.78
Met à jour GAME_VERSION et le paramètre ?v= de chaque <script src="js/..."> dans index.html (évite les fichiers JS périmés en cache)."""
import re,sys
v=sys.argv[1]
if not re.fullmatch(r'\d+\.\d+(\.\d+)?',v): sys.exit('version invalide')
s=open('index.html',encoding='utf-8').read()
s=re.sub(r"const GAME_VERSION='[0-9.]+';","const GAME_VERSION='%s';"%v,s,count=1)
s=re.sub(r'(<script src="js/[a-z0-9-]+\.js)\?v=[0-9.]+"',r'\1?v=%s"'%v,s)
open('index.html','w',encoding='utf-8').write(s)
print('version',v)
