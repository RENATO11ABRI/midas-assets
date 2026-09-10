# -*- coding: utf-8 -*-
"""Prepara o objecto D que o portal embebe, a partir de dados.json (fonte única)."""
import json, datetime as dt
d=json.load(open("dados.json",encoding="utf-8"))
M=d["meta"]; SB=d["sabados"]
def iso(ds):  # "dd/mm/yyyy" -> "yyyy-mm-dd"
    p=ds.split("/"); return f"{p[2]}-{p[1]}-{p[0]}"

CORES={"EMC":"#1D6FB8","UEPS":"#C4553A","SMON":"#8A4AA0","EPSC":"#178A3A","GEN":"#0E8A8A","PT":"#B7791F","SEM":"#B58A00"}
NOMES={"SEM":"Seminários complementares"}
sess=[]
for s in d["sessoes"]:
    sess.append(dict(id=f"{s['disc']}-{s['n']}", disc=s["disc"], n=s["n"], data=iso(s["dstr"]),
        dia=s["dia"], mes=s["mes"], dur=s["dur"], horario=s["horario"], tempo=s["tempo"],
        unidade=s["unidade"], unidade_tit=s["unidade_tit"], tema=s["tema"], tipo=s["tipo"], prof=s["prof"]))
for s in SB["sessoes"]:
    sess.append(dict(id=f"{s['disc']}-{s['n']}", disc=s["disc"], n=s["n"], data=iso(s["dstr"]),
        dia="Sábado", mes=None, dur=s["dur"],
        horario="08h00–12h30" if s["disc"]=="GEN" else "12h30–16h00",
        tempo="1.º e 2.º tempo (manhã)" if s["disc"]=="GEN" else "Bloco de projecto (tarde)",
        unidade=s["unidade"], unidade_tit=s["unidade_tit"], tema=s["tema"], tipo=s["tipo"], prof=s["prof"],
        predefesa=s.get("predefesa",False), evento=s.get("evento",False)))
sess.sort(key=lambda x:(x["data"], {"EMC":0,"UEPS":1,"SMON":0,"EPSC":1,"SEM":0,"GEN":0,"PT":1}[x["disc"]], -x["dur"]))

disc={}
for k in d["ordem"]:
    x=d["disc"][k]
    disc[k]=dict(sigla=k, nome=x["nome"], prof=x["prof"], dia=x["dia"], cor=CORES[k],
        total=x["total"], teorica=x["teorica"], pratica=x["pratica"], pct=x["pct_pratica"],
        fund=x["fund"], pre=x["pre"], objg=x["objg"], obje=x["obje"],
        comp=dict(cog=x["comp_cog"], proc=x["comp_proc"], atit=x["comp_atit"]),
        saida=x["saida"], unidades=x["unidades"], metod=x["metod"],
        mat_disp=x["mat_disp"], mat_adq=x["mat_adq"], avalp=x["avalp"], result=x["result"],
        listas=x["listas"])
for k in ("GEN","PT"):
    g=SB["disc"][k]
    disc[k]=dict(sigla=k, nome=g["nome"], prof=SB["prof"], dia="Sábado", cor=CORES[k],
        total=g["total"], teorica=g["teorica"], pratica=g["pratica"], pct=g["pct_pratica"],
        fund=("Gestão de Enfermagem prepara o Técnico de Enfermagem para organizar o serviço, gerir pessoas, "
              "material e informação, e assegurar a qualidade e a segurança do doente na perspectiva de quem chefia uma equipa."
              if k=="GEN" else
              "Projecto Tecnológico conduz o grupo desde a escolha do tema até à defesa do trabalho de fim de curso, "
              "com cinco pré-defesas ao longo do caminho e ensaio geral antes do júri."),
        pre="", objg="", obje=[], comp=dict(cog=[],proc=[],atit=[]), saida=[],
        unidades=g["unidades"], metod=("Sessões de sábado de manhã, em dois tempos de 120 minutos, com exposição, "
              "exercícios de escala e de inventário e estudo de casos de serviço." if k=="GEN" else
              "Bloco contínuo de 210 minutos à tarde, orientado pelo tutor, em que cada grupo trabalha o seu projecto; "
              "as pré-defesas realizam-se perante júri neste bloco."),
        mat_disp="", mat_adq="", avalp="Avaliação e pauta próprias, independentes das quatro disciplinas técnicas.",
        result="", listas=[])
disc["SEM"]=dict(sigla="SEM", nome="Seminários complementares", prof="Formadores convidados", dia="Alternado",
    cor=CORES["SEM"], total=32, teorica=M["sem_teorica"], pratica=M["sem_pratica"], pct=25.0,
    fund="Oito seminários de quatro horas cobrem áreas indispensáveis ao exercício que não são disciplinas regulares: "
         "língua portuguesa, psicologia, saúde mental e saúde colectiva. Cada área tem um seminário de fundamentos e um de aplicação.",
    pre="", objg="", obje=[], comp=dict(cog=[],proc=[],atit=[]), saida=[], unidades=[], metod="", mat_disp="", mat_adq="",
    avalp="Frequência obrigatória e registada; a participação conta para a avaliação contínua. Não entram na média das disciplinas técnicas.",
    result="", listas=[])

cal=[]
for c in d["calendario"]:
    cal.append(dict(ano=c["ano"], mes=c["mes"], nome=c["nome"], ndias=c["ndias"], horas=c["horas"],
        cells=[None if x is None else dict(d=x["d"], tipo=x["tipo"], txt=x["txt"], av=x["av"]) for x in c["cells"]]))

D=dict(
 meta=dict(curso=M["curso"], modulo=M["modulo"], turma=M["turma"], unidade=M["unidade"], ano=M["ano"],
   inst=M["inst"], grupo=M["grupo"], ini=iso(M["ini"]), fim=iso(M["fim"]),
   horas_lectivas=M["horas_total"], horas_sabados=M["horas_sabados"], horas_geral=M["horas_geral"],
   dias_uteis=M["dias_uteis"], formandos=M["formandos"], frequencia=M["frequencia_min"],
   rec=[iso(M["rec"][0]), iso(M["rec"][1])], defesa=iso(d["defesa"]["data"]),
   entrega=iso(d["defesa"]["entrega"]), recurso=iso(d["defesa"]["recurso"]),
   director=M["director"], assiduidade=M["assiduidade"]),
 ordem=["EMC","UEPS","SMON","EPSC","GEN","PT","SEM"], disc=disc, sessoes=sess,
 seminarios=[dict(n=s["n"], data=iso(s["data"]), dia=s["dia"], area=s["area"], tema=s["tema"]) for s in d["seminarios"]],
 calendario=cal, meses=[dict(n=m["n"], ini=iso(m["ini"]), fim=iso(m["fim"])) for m in d["meses"]],
 feriados=[dict(data=iso(f["data"]), nome=f["nome"], efeito=f["efeito"]) for f in d["feriados"]],
 sabados=dict(n=SB["n"], ini=iso(SB["ini"]), fim=iso(SB["fim"]), horas=SB["horas"], prof=SB["prof"],
   horario=SB["horario"], predefesas=[iso(x) for x in SB["predefesas"]], dia_trabalhador=iso(SB["dia_trabalhador"])),
 estagios=[dict(e, ini=iso(e["ini"]), fim=iso(e["fim"]), apresentacao=iso(e["apresentacao"]) if e["apresentacao"] else None)
           for e in d["estagios"]],
 estagio_docs=d["estagio_docs"],
 defesa=dict(d["defesa"], data=iso(d["defesa"]["data"]), entrega=iso(d["defesa"]["entrega"]),
   recurso=iso(d["defesa"]["recurso"]), predefesas=[iso(x) for x in d["defesa"]["predefesas"]]),
 financeiro=d["financeiro"],
 avaliacao=[("Assiduidade",5),("Participação",5),("Trabalhos e estudos de caso",15),("Testes escritos (2)",20),
            ("Demonstrações e avaliações práticas",30),("Avaliação final teórico-prática",25)],
)
json.dump(D, open("portal_D.json","w",encoding="utf-8"), ensure_ascii=False, separators=(",",":"))
import os; print("portal_D.json:", os.path.getsize("portal_D.json")//1024, "KB ·", len(sess), "sessões ·", len(disc), "disciplinas")
