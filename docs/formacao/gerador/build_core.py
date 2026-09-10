# -*- coding: utf-8 -*-
import datetime as dt
from data import EMC, UEPS, SMON, EPSC, SEMINARIOS

FER = {
 dt.date(2026,11,11):"Dia da Independência Nacional",
 dt.date(2026,12,25):"Natal",
 dt.date(2027,1,1):"Ano Novo",
 dt.date(2027,1,4):"Dia dos Mártires da Repressão Colonial",
 dt.date(2027,2,4):"Dia do Início da Luta Armada",
 dt.date(2027,2,9):"Carnaval",
 dt.date(2027,3,8):"Dia Internacional da Mulher",
 dt.date(2027,3,23):"Dia da Libertação da África Austral",
 dt.date(2027,3,26):"Sexta-feira Santa",
 dt.date(2027,4,4):"Dia da Paz e Reconciliação Nacional",
 dt.date(2027,5,1):"Dia do Trabalhador",
}
REC = (dt.date(2026,12,21), dt.date(2027,1,4))
MONTHS = [(2026,10),(2026,11),(2026,12),(2027,1),(2027,2),(2027,3),(2027,4),(2027,5)]
MNAME = {1:"Janeiro",2:"Fevereiro",3:"Março",4:"Abril",5:"Maio",6:"Junho",7:"Julho",
         8:"Agosto",9:"Setembro",10:"Outubro",11:"Novembro",12:"Dezembro"}
START, END = dt.date(2026,10,6), dt.date(2027,5,27)

DISC = {
 "EMC": dict(sigla="EMC", nome="Enfermagem Médico-Cirúrgica e Cuidados ao Adulto",
             prof="Prof. Manuel Jorge Weber", seq=EMC),
 "UEPS":dict(sigla="UEPS", nome="Urgência, Emergência e Primeiros Socorros",
             prof="Prof. Manuel Jorge Weber", seq=UEPS),
 "SMON":dict(sigla="SMON", nome="Saúde Materna, Obstétrica e Neonatal",
             prof="Prof. Eduardo David", seq=SMON),
 "EPSC":dict(sigla="EPSC", nome="Enfermagem Pediátrica e Saúde da Criança",
             prof="Prof. Eduardo David", seq=EPSC),
}

def build_days():
    ter, qui = [], []
    d = START
    while d <= END:
        if d.weekday() in (1,3) and not (REC[0] <= d <= REC[1]) and d not in FER:
            (ter if d.weekday()==1 else qui).append(d)
        d += dt.timedelta(days=1)
    SEM_DAY = {0:'qui',1:'ter',2:'qui',3:'ter',4:'qui',5:'ter',6:'qui',7:'qui'}
    sem_dates = []
    for mi,(y,m) in enumerate(MONTHS):
        pool = [x for x in (ter if SEM_DAY[mi]=='ter' else qui) if (x.year,x.month)==(y,m)]
        sem_dates.append(pool[2] if len(pool)>2 else pool[-1])
    semset = set(sem_dates)
    ter_c = [x for x in ter if x not in semset]
    qui_c = [x for x in qui if x not in semset]

    def pat(n, flip_last):
        cyc = ['A','B','A','B','A']
        out = [cyc[i%5] for i in range(n)]
        if flip_last: out[-1] = 'B'
        return out
    pt, pq = pat(len(ter_c), False), pat(len(qui_c), True)

    days = {}
    for i,(d,p) in enumerate(zip(ter_c, pt)):
        longo, curto = ("EMC","UEPS") if p=='A' else ("UEPS","EMC")
        days[d] = dict(tipo="aula", longa=longo, curta=curto,
                       i_long=i, i_curt=i, prof=DISC[longo]["prof"], semana=p)
    for i,(d,p) in enumerate(zip(qui_c, pq)):
        longo, curto = ("SMON","EPSC") if p=='A' else ("EPSC","SMON")
        days[d] = dict(tipo="aula", longa=longo, curta=curto,
                       i_long=i, i_curt=i, prof=DISC[longo]["prof"], semana=p)
    for k,d in enumerate(sem_dates):
        s = SEMINARIOS[k]
        days[d] = dict(tipo="sem", n=k+1, area=s[0], tema=s[1], topicos=s[2])
    return days, ter_c, qui_c, sem_dates, semset

DAYS, TER_C, QUI_C, SEM_DATES, SEMSET = build_days()

# ---- carga horária ----------------------------------------------------------
def carga():
    tot = {k:0 for k in DISC}
    long_n = {k:0 for k in DISC}; curt_n = {k:0 for k in DISC}
    for d,inf in DAYS.items():
        if inf["tipo"]!="aula": continue
        tot[inf["longa"]] += 3; long_n[inf["longa"]] += 1
        tot[inf["curta"]] += 1; curt_n[inf["curta"]] += 1
    return tot, long_n, curt_n
TOT, LONG_N, CURT_N = carga()

FRAC_T = {"T":1.0, "TP":0.40, "P":0.0, "AV":0.40}
def split_tp(key):
    seq = DISC[key]["seq"]; ordem = []
    for d in sorted(DAYS):
        inf = DAYS[d]
        if inf["tipo"]!="aula": continue
        if inf["longa"]==key: ordem.append((inf["i_long"],3))
        elif inf["curta"]==key: ordem.append((inf["i_curt"],1))
    t = sum(h*FRAC_T[seq[i][1]] for i,h in ordem)
    t = int(round(t)); return t, TOT[key]-t
SPLIT = {k: split_tp(k) for k in DISC}

def horas_unidade(key):
    seq = DISC[key]["seq"]; acc = {}
    for d in sorted(DAYS):
        inf = DAYS[d]
        if inf["tipo"]!="aula": continue
        if inf["longa"]==key: i,h = inf["i_long"],3
        elif inf["curta"]==key: i,h = inf["i_curt"],1
        else: continue
        acc[seq[i][2]] = acc.get(seq[i][2],0)+h
    return acc
UNI_H = {k: horas_unidade(k) for k in DISC}

def sessoes(key):
    """Devolve [(n_ordem, data, dur_min, tema, natureza, unidade)] por disciplina."""
    out = []
    seq = DISC[key]["seq"]
    for d in sorted(DAYS):
        inf = DAYS[d]
        if inf["tipo"]!="aula": continue
        if inf["longa"]==key: i,dur = inf["i_long"],180
        elif inf["curta"]==key: i,dur = inf["i_curt"],60
        else: continue
        out.append((i+1, d, dur, seq[i][0], seq[i][1], seq[i][2]))
    return out

if __name__ == "__main__":
    print("Dias letivos:", len(DAYS), "| Aulas:", len([1 for v in DAYS.values() if v["tipo"]=="aula"]), "| Seminários:", len(SEM_DATES))
    for k in DISC:
        t,p = SPLIT[k]
        print(f"{k:5s} total={TOT[k]:3d}h  T={t:2d}h P={p:2d}h  180min×{LONG_N[k]:2d}  60min×{CURT_N[k]:2d}  unid={UNI_H[k]}")
    print("Soma disciplinas:", sum(TOT.values()), "+ seminários 32 =", sum(TOT.values())+32)
    for k in DISC:
        s = sessoes(k)
        assert len(s)==len(DISC[k]["seq"]), (k, len(s))
        print(k, "sessões:", len(s), "| 1.ª", s[0][1], "| última", s[-1][1])
