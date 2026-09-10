# -*- coding: utf-8 -*-
"""Monta o portal dos estudantes (portal-nov-a.html) a partir de dados.json e do logótipo."""
import base64, os, re, subprocess, sys
HERE=os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
subprocess.run([sys.executable,"portal_data.py"],check=True)
css=open("portal/css.html",encoding="utf-8").read(); app=open("portal/app.html",encoding="utf-8").read()
dados=open("portal_D.json",encoding="utf-8").read().replace("</","<\\/").replace("\u2028","\\u2028").replace("\u2029","\\u2029")
logo_path=os.environ.get("MIDAS_LOGO",os.path.normpath(os.path.join(HERE,"..","..","..","..","assets","logo-midas26.png")))
logo="data:image/png;base64,"+base64.b64encode(open(logo_path,"rb").read()).decode()
html="<title>Turma NOV-A</title>\n"+css+"\n"+app.replace("__DADOS__",dados).replace("__LOGO__",logo)
dest=os.path.normpath(os.path.join(HERE,"..","portal-nov-a.html"))
open(dest,"w",encoding="utf-8").write(html)
print("Portal escrito:",dest,"-",len(html)//1024,"KB")
