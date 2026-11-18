#!/usr/bin/env python3
"""Prépare la publication multi-fichiers : écrit <dossier>/index.html (de <title> à la fin) ; les fichiers js/ sont publiés tels quels."""
import sys
out=sys.argv[1]
s=open('index.html',encoding='utf-8').read()
a=s.index('<title>');b=s.rindex('</script>')+9
open(out+'/index.html','w',encoding='utf-8').write(s[a:b])
