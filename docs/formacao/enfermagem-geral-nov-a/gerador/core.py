# -*- coding: utf-8 -*-
import datetime as dt
WD=["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado","Domingo"]
WDS=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"]
MES={1:"Janeiro",2:"Fevereiro",3:"Março",4:"Abril",5:"Maio",6:"Junho",7:"Julho",8:"Agosto",
     9:"Setembro",10:"Outubro",11:"Novembro",12:"Dezembro"}
FER={dt.date(2026,9,17):"Dia do Herói Nacional",dt.date(2026,11,2):"Dia dos Finados",
     dt.date(2026,11,11):"Dia da Independência Nacional",dt.date(2026,12,25):"Natal",
     dt.date(2027,1,1):"Ano Novo",dt.date(2027,2,4):"Início da Luta Armada",
     dt.date(2027,2,9):"Carnaval",dt.date(2027,3,8):"Dia Internacional da Mulher",
     dt.date(2027,3,23):"Libertação da África Austral",dt.date(2027,3,26):"Sexta-Feira Santa",
     dt.date(2027,4,4):"Dia da Paz e Reconciliação Nacional",dt.date(2027,5,1):"Dia do Trabalhador"}
REC=(dt.date(2026,12,24),dt.date(2027,1,5))   # pausa confirmada pela Direcção
INI,FIM=dt.date(2026,9,15),dt.date(2027,5,13)
LIM=[(dt.date(2026,9,15),dt.date(2026,10,14)),(dt.date(2026,10,15),dt.date(2026,11,14)),
     (dt.date(2026,11,15),dt.date(2026,12,14)),(dt.date(2026,12,15),dt.date(2027,1,14)),
     (dt.date(2027,1,15),dt.date(2027,2,14)),(dt.date(2027,2,15),dt.date(2027,3,14)),
     (dt.date(2027,3,15),dt.date(2027,4,14)),(dt.date(2027,4,15),dt.date(2027,5,13))]
SEM_DIA={1:1,2:3,3:1,4:3,5:1,6:3,7:1,8:3}
SEMS=[("Língua Portuguesa I","Comunicação oral e escrita em contexto de saúde"),
      ("Psicologia I","Relação de ajuda; comunicação com o doente e a família"),
      ("Saúde Colectiva I","Determinantes da saúde; epidemiologia básica; promoção da saúde"),
      ("Saúde Mental I","Conceitos, estigma, sinais de alerta e primeiros socorros psicológicos"),
      ("Língua Portuguesa II","Registos de enfermagem, relatório e passagem de turno escrita"),
      ("Psicologia II","Stress e burnout do profissional; luto; comunicação de más notícias"),
      ("Saúde Colectiva II","Vigilância epidemiológica; doenças de notificação; água e saneamento"),
      ("Saúde Mental II","Abordagem inicial da pessoa em crise; álcool e outras substâncias")]
DISC={"EMC":("Enfermagem Médico-Cirúrgica e Cuidados ao Adulto","Prof. Manuel Jorge Weber"),
      "UEPS":("Urgência, Emergência e Primeiros Socorros","Prof. Manuel Jorge Weber"),
      "SMON":("Saúde Materna, Obstétrica e Neonatal","Prof. Eduardo David"),
      "EPSC":("Enfermagem Pediátrica e Saúde da Criança","Prof. Eduardo David")}

def uteis():
    out=[];d=INI
    while d<=FIM:
        if d.weekday() in (1,3) and d not in FER and not (REC[0]<=d<=REC[1]): out.append(d)
        d+=dt.timedelta(days=1)
    return out
UTEIS=uteis()

def mes_de(d):
    for i,(a,b) in enumerate(LIM,1):
        if a<=d<=b: return i
    return None

SEM_DATAS=[]
for i,(a,b) in enumerate(LIM,1):
    pool=[x for x in UTEIS if a<=x<=b and x.weekday()==SEM_DIA[i]]
    if i==8: pool=[x for x in pool if x<=FIM-dt.timedelta(days=14)]
    SEM_DATAS.append(pool[len(pool)//2])
SEMSET=set(SEM_DATAS)

TER=[x for x in UTEIS if x.weekday()==1 and x not in SEMSET]
QUI=[x for x in UTEIS if x.weekday()==3 and x not in SEMSET]
PT=[['A','A','B','A','B'][i%5] for i in range(len(TER))]; PT[25],PT[26]='A','B'
PQ=[['A','B'][i%2] for i in range(len(QUI))]

def slots(key):
    """[(n, data, dur_min, mes)] por disciplina, em ordem cronológica."""
    out=[]
    if key in ("EMC","UEPS"):
        for i,d in enumerate(TER):
            lo = "EMC" if PT[i]=='A' else "UEPS"
            out.append((len(out)+1, d, 180 if lo==key else 60, mes_de(d)))
    else:
        for i,d in enumerate(QUI):
            lo = "SMON" if PQ[i]=='A' else "EPSC"
            out.append((len(out)+1, d, 180 if lo==key else 60, mes_de(d)))
    return out

if __name__=="__main__":
    for k in DISC:
        s=slots(k); L=sum(1 for x in s if x[2]==180); S=len(s)-L
        print(f"{k:5s} sessões={len(s)} 180'×{L} 60'×{S} = {L*3+S} h")
        print("   ", " ".join(f"M{m}:{n}{'L' if du==180 else 'S'}" for n,d,du,m in s))
    print("\nSeminários:", [f"{x.day:02d}/{x.month:02d} {WDS[x.weekday()]}" for x in SEM_DATAS])
