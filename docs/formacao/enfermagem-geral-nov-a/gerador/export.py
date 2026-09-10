# -*- coding: utf-8 -*-
import json, datetime as dt, calendar
import core, temas, conteudo, prog
from core import (DISC, FER, REC, INI, FIM, LIM, UTEIS, TER, QUI, PT, PQ,
                  SEM_DATAS, SEMS, SEMSET, WD, WDS, MES, mes_de, slots)

SEQ={"EMC":temas.EMC,"UEPS":temas.UEPS,"SMON":temas.SMON,"EPSC":temas.EPSC}
ORD=["EMC","UEPS","SMON","EPSC"]
def ds(d): return f"{d.day:02d}/{d.month:02d}/{d.year}"

# ---- unidade de cada sessão ----
def unidade_de(k, mes):
    for num,tit,m,h,cont in conteudo.UNIDADES[k]:
        if m==mes: return num,tit
    return "—","—"

# ---- cargas (calculadas mais abaixo, a partir dos blocos) ----
carga={}
for k in ORD:
    s=slots(k)
    carga[k]=dict(total=sum(du//60 for _,_,du,_ in s),
                  l=sum(1 for x in s if x[2]==180), s=sum(1 for x in s if x[2]==60))
MIN={"EMC":50,"UEPS":60,"SMON":50,"EPSC":50}

# ---- cronograma por sessão ----
sessoes=[]
for k in ORD:
    for i,(n,d,du,m) in enumerate(slots(k)):
        u,ut=unidade_de(k,m)
        sessoes.append(dict(disc=k, n=n, data=d.isoformat(), dstr=ds(d), dia=WD[d.weekday()],
            mes=m, dur=du, unidade=u, unidade_tit=ut, tema=SEQ[k][i][0], tipo=SEQ[k][i][1],
            prof=DISC[k][1],
            tempo="1.º e 2.º tempo lectivo" if du==180 else "Bloco complementar",
            horario="08h00–11h15" if du==180 else "11h15–12h15"))
for i,(d,(a,tema)) in enumerate(zip(SEM_DATAS,SEMS)):
    sessoes.append(dict(disc="SEM", n=i+1, data=d.isoformat(), dstr=ds(d), dia=WD[d.weekday()],
        mes=mes_de(d), dur=240, unidade=f"S{i+1}", unidade_tit=a, tema=tema, tipo="T",
        prof="Formador(a) convidado(a) [a designar]", tempo="Seminário (dia completo)",
        horario="08h00–12h15"))
sessoes.sort(key=lambda x:(x["data"], -x["dur"], x["disc"]))

# ---- blocos (para o Excel) ----
blocos=[]
nb=0
for d in UTEIS:
    if d in SEMSET:
        i=SEM_DATAS.index(d); a,tema=SEMS[i]
        for hor,tp,dur,det in [("08h00–09h30","1.º tempo",90,f"Módulo 1 — {tema}"),
                               ("09h30–09h45","Intervalo",15,"Intervalo regulamentar"),
                               ("09h45–11h15","2.º tempo",90,f"Módulo 2 — {tema}"),
                               ("11h15–12h15","Bloco complementar",60,"Oficina e ficha-síntese de participação")]:
            nb+=1
            blocos.append([nb, ds(d), WD[d.weekday()], hor, tp,
                           "—" if tp=="Intervalo" else "SEM",
                           "—" if tp=="Intervalo" else f"Seminário {i+1} — {a}", det,
                           "—" if tp=="Intervalo" else "Formador(a) convidado(a)",
                           "—" if tp=="Intervalo" else ("P" if "Oficina" in det else "T"),
                           dur])
        continue
    if d.weekday()==1: lo="EMC" if PT[TER.index(d)]=='A' else "UEPS"; cu="UEPS" if lo=="EMC" else "EMC"
    else:              lo="SMON" if PQ[QUI.index(d)]=='A' else "EPSC"; cu="EPSC" if lo=="SMON" else "SMON"
    m=mes_de(d)
    sl=[x for x in sessoes if x["disc"]==lo and x["data"]==d.isoformat()][0]
    sc=[x for x in sessoes if x["disc"]==cu and x["data"]==d.isoformat()][0]
    fase={"T":("Exposição dialogada e discussão dirigida","Aplicação a casos clínicos e consolidação"),
          "TP":("Enquadramento teórico e demonstração da técnica","Treino prático supervisionado e estudo de caso"),
          "P":("Demonstração da técnica e critérios de execução","Treino prático em estações com correcção individual"),
          "AVE":("Realização da prova escrita","Correcção comentada e esclarecimento de dúvidas"),
          "AVP":("1.ª série de estações práticas","2.ª série de estações e devolução dos resultados")}[sl["tipo"]]
    tps={"T":"T","TP":"TP","P":"P","AVE":"Avaliação escrita","AVP":"Avaliação prática"}
    for hor,tp,dur,disc,tema,det,tipo,prof in [
        ("08h00–09h30","1.º tempo lectivo",90,lo,sl["tema"],fase[0],tps[sl["tipo"]],DISC[lo][1]),
        ("09h30–09h45","Intervalo",15,"—","Intervalo regulamentar","—","—","—"),
        ("09h45–11h15","2.º tempo lectivo",90,lo,sl["tema"],fase[1],
            "P" if sl["tipo"] in("TP","P") else tps[sl["tipo"]],DISC[lo][1]),
        ("11h15–12h15","Bloco complementar",60,cu,sc["tema"],
            {"T":"Exposição e discussão dirigida","TP":"Demonstração e aplicação prática",
             "P":"Treino prático supervisionado","AVE":"Realização da prova escrita e correcção comentada","AVP":"Estações práticas avaliadas e devolução dos resultados"}[sc["tipo"]],
            tps[sc["tipo"]],DISC[cu][1])]:
        nb+=1
        blocos.append([nb, ds(d), WD[d.weekday()], hor, tp, disc,
                       (f"U{sl['unidade']} — {sl['unidade_tit']}" if disc==lo else
                        f"U{sc['unidade']} — {sc['unidade_tit']}") if disc!="—" else "—",
                       (tema if disc=="—" else f"{tema} · {det}"), prof, tipo, dur])

# ---- componente teórica e prática, a partir dos blocos ----
# Convenção declarada no programa: contam para a componente teórica os blocos
# teóricos, os teórico-práticos (exposição e demonstração) e os de avaliação escrita;
# contam para a componente prática os blocos de treino prático e os de avaliação
# prática. É esta a convenção aplicada também na folha de verificação do Excel.
def _tp(disc):
    bs=[b for b in blocos if b[5]==disc]
    t=sum(b[10]/60 for b in bs if b[9] in ("T","TP","Avaliação escrita"))
    tot=sum(b[10]/60 for b in bs)
    return round(t,1), round(tot-t,1), tot
for k in ORD:
    t,p,tot = _tp(k)
    assert abs(tot-carga[k]["total"])<0.01, (k,tot,carga[k]["total"])
    carga[k].update(teorica=t, pratica=p, pct_pratica=round(p/tot*100,1))
    assert carga[k]["pct_pratica"]>=MIN[k], (k,carga[k],MIN[k])
SEM_T,SEM_P,SEM_TOT=_tp("SEM")
assert abs(SEM_TOT-32)<0.01, SEM_TOT

# ---- calendário ----
EST_INI,EST_FIM=dt.date(2026,10,5),dt.date(2026,12,5)
def sab1(y,m):
    d=dt.date(y,m,1)
    while d.weekday()!=5: d+=dt.timedelta(days=1)
    return d
GESTAO=[sab1(y,m) for y,m in [(2026,12),(2027,1),(2027,2),(2027,3),(2027,4),(2027,5)]]
CAL=[]
for y,m in [(2026,9),(2026,10),(2026,11),(2026,12),(2027,1),(2027,2),(2027,3),(2027,4),(2027,5)]:
    first=dt.date(y,m,1); nd=calendar.monthrange(y,m)[1]
    cells=[]
    for _ in range(first.weekday()): cells.append(None)
    for dd in range(1,nd+1):
        d=dt.date(y,m,dd); c=dict(d=dd, tipo="normal", txt="", av="")
        if d in SEMSET:
            i=SEM_DATAS.index(d); c.update(tipo="sem", txt=f"SEM {i+1} — {SEMS[i][0]}")
        elif d in [dt.date.fromisoformat(x["data"]) for x in sessoes if x["disc"]!="SEM"]:
            hoje=[x for x in sessoes if x["data"]==d.isoformat()]
            lo=[x for x in hoje if x["dur"]==180][0]; cu=[x for x in hoje if x["dur"]==60][0]
            c.update(tipo="aula", txt=f"{lo['disc']} 180' • {cu['disc']} 60'")
            avs=[x["disc"] for x in hoje if x["tipo"]=="AV"]
            if avs: c["av"]="AV "+"/".join(avs)
        elif d in FER: c.update(tipo="fer", txt=FER[d])
        elif REC[0]<=d<=REC[1]: c.update(tipo="rec", txt="Interrupção lectiva")
        elif d in GESTAO: c.update(tipo="gest", txt="Gestão e Proj. Tecnológico 08h–16h")
        elif EST_INI<=d<=EST_FIM and d.weekday() in (0,2,4): c.update(tipo="est", txt="Estágio preliminar")
        elif d==dt.date(2026,9,30): c.update(tipo="est", txt="Apresentação ao local de estágio")
        cells.append(c)
    dias=[x for x in cells if x and x["tipo"] in ("aula","sem")]
    hh={}
    for x in [s for s in sessoes if s["disc"]!="SEM" and dt.date.fromisoformat(s["data"]).month==m
              and dt.date.fromisoformat(s["data"]).year==y]:
        hh[x["disc"]]=hh.get(x["disc"],0)+x["dur"]//60
    ns=len([x for x in cells if x and x["tipo"]=="sem"])
    CAL.append(dict(ano=y, mes=m, nome=MES[m], cells=cells, ndias=len(dias),
                    horas=sum(hh.values())+ns*4, resumo=hh, nsem=ns))

dados=dict(
 meta=dict(curso="Enfermagem Geral", modulo="III.º Módulo", turma="MIDAS — NOV-A",
   unidade="Zango", ano="2026/2027", autor="Manuel Pedro de Almeida", versao="1.0",
   inst="Centro de Formação Técnica em Saúde", grupo="Grupo Midas Angola",
   ini=ds(INI), fim=ds(FIM), rec=[ds(REC[0]),ds(REC[1])],
   dias_uteis=len(UTEIS), dias_disc=len(UTEIS)-8,
   horas_disc=sum(carga[k]["total"] for k in ORD), horas_sem=32, sem_teorica=SEM_T, sem_pratica=SEM_P,
   horas_total=sum(carga[k]["total"] for k in ORD)+32,
   defesa="03/06/2027", est_apres="30/09/2026",
   est_ini=ds(EST_INI), est_fim=ds(EST_FIM),
   gestao=[ds(x) for x in GESTAO]),
 disc={k:dict(sigla=k, nome=DISC[k][0], prof=DISC[k][1],
   dia="Terça-feira" if k in("EMC","UEPS") else "Quinta-feira", **carga[k],
   unidades=[dict(num=n,tit=t,mes=m,horas=h,cont=c) for n,t,m,h,c in conteudo.UNIDADES[k]],
   fund=prog.FUND[k], pre=prog.PRE[k], objg=prog.OBJG[k], obje=prog.OBJE[k],
   comp_cog=prog.COMP[k][0], comp_proc=prog.COMP[k][1], comp_atit=prog.COMP[k][2],
   saida=prog.SAIDA[k], metod=prog.METOD[k], mat_disp=prog.MAT_DISP[k],
   mat_adq=prog.MAT_ADQ[k], avalp=prog.AVALP[k], result=prog.RESULT[k],
   listas=[dict(cod=c,tit=t,itens=i) for c,t,i in conteudo.LISTAS[k]]) for k in ORD},
 ordem=ORD,
 sessoes=sessoes, blocos=blocos, calendario=CAL,
 seminarios=[dict(n=i+1, data=ds(d), dia=WD[d.weekday()], area=SEMS[i][0], tema=SEMS[i][1],
                  mes=mes_de(d)) for i,d in enumerate(SEM_DATAS)],
 feriados=[dict(data=ds(d), dia=WD[d.weekday()], nome=n,
                efeito="Dia de aula suprimido" if d.weekday() in (1,3) else "Sem impacto no horário")
           for d,n in sorted(FER.items())],
 meses=[dict(n=i+1, ini=ds(a), fim=ds(b)) for i,(a,b) in enumerate(LIM)],
)
json.dump(dados, open("dados.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)
print("dados.json escrito")
for k in ORD: print(f"  {k:5s} {carga[k]['total']:2d} h  T {carga[k]['teorica']:5.1f}  P {carga[k]['pratica']:5.1f}  ({carga[k]['pct_pratica']}% ≥ {MIN[k]}%)")
print("  disciplinas", dados['meta']['horas_disc'], "+ seminários 32 =", dados['meta']['horas_total'], "h")
print("  sessões", len(sessoes), "· blocos", len(blocos), "· meses de calendário", len(CAL))
