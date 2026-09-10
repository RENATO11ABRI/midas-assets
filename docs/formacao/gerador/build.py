# -*- coding: utf-8 -*-
import datetime as dt, base64, html, calendar
from build_core import (DAYS, DISC, MONTHS, MNAME, FER, REC, START, END, TOT,
                        LONG_N, CURT_N, SPLIT, UNI_H, sessoes, SEM_DATES, TER_C, QUI_C)
from sections import (UNIDADES, FUND, OBJ_GERAL, OBJ_ESP, COMPET, TECNICAS,
                      METODOLOGIA, MATERIAIS, RESULTADOS, AVAL_PRATICA)
from data import SEMINARIOS
from style import CSS

E = html.escape
WD  = ["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado","Domingo"]
WDS = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"]
ORDEM = ["EMC","UEPS","SMON","EPSC"]
TOT_DISC = sum(TOT.values()); TOT_SEM = 32; TOT_GERAL = TOT_DISC + TOT_SEM
T_SUM = sum(SPLIT[k][0] for k in DISC); P_SUM = sum(SPLIT[k][1] for k in DISC)
N_AULAS = len([1 for v in DAYS.values() if v["tipo"]=="aula"])

import os
_HERE = os.path.dirname(os.path.abspath(__file__))
LOGO_PATH = os.environ.get("MIDAS_LOGO",
    os.path.normpath(os.path.join(_HERE, "..", "..", "..", "assets", "logo-midas26.png")))
LOGO = "data:image/png;base64," + base64.b64encode(open(LOGO_PATH, "rb").read()).decode()

def dstr(d): return f"{d.day:02d}/{d.month:02d}/{d.year}"
def sig(k): return f'<span class="sig sig-{k}">{k}</span>'

NAT_LONG = {
 "T":  ("T",     "exposição e discussão dirigida",                    "T/P",  "aplicação a casos clínicos e consolidação"),
 "TP": ("T/P",   "enquadramento teórico e demonstração da técnica",   "P",    "treino prático supervisionado e estudo de caso"),
 "P":  ("T/P",   "demonstração da técnica e critérios de execução",   "P",    "treino prático em estações com correção individual"),
 "AV": ("Aval.", "realização da prova / 1.ª série de estações",       "Aval.","2.ª série de estações, correção comentada e devolução"),
}
NAT_SHORT = {"T":("T","exposição e discussão dirigida"),
             "TP":("T/P","demonstração e aplicação prática"),
             "P":("P","treino prático supervisionado"),
             "AV":("Aval.","realização da prova e correção comentada")}

# ============================================================ CALENDÁRIO ======
def cal_mes(mi, y, m):
    first = dt.date(y,m,1); ndays = calendar.monthrange(y,m)[1]
    cells = ['<div class="wd">%s</div>' % w for w in WDS]
    cells += ['<div class="cd off"></div>'] * first.weekday()
    n_aula = n_sem = 0
    for dd in range(1, ndays+1):
        d = dt.date(y,m,dd); inf = DAYS.get(d)
        we = " we" if d.weekday()>=5 else ""
        if inf and inf["tipo"]=="aula":
            n_aula += 1
            lo, cu = inf["longa"], inf["curta"]
            cells.append(
              f'<div class="cd aula" title="{E(dstr(d))} — {E(DISC[lo]["nome"])} 180 min · {E(DISC[cu]["nome"])} 60 min">'
              f'<span class="dn">{dd}</span>'
              f'<span class="ch lo"><b>{lo}</b> 180′</span>'
              f'<span class="ch">{cu} 60′</span></div>')
        elif inf and inf["tipo"]=="sem":
            n_sem += 1
            cells.append(
              f'<div class="cd semi" title="{E(dstr(d))} — Seminário {inf["n"]}: {E(inf["tema"])}">'
              f'<span class="dn">{dd}</span>'
              f'<span class="ch lo"><b>SEM {inf["n"]}</b> 240′</span>'
              f'<span class="semt">{E(inf["area"])}</span></div>')
        elif d in FER:
            cells.append(f'<div class="cd hol{we}"><span class="dn">{dd}</span>'
                         f'<span class="hn">{E(FER[d])}</span></div>')
        else:
            rec = REC[0] <= d <= REC[1]
            extra = '<span class="hn" style="color:var(--muted)">Interrupção letiva</span>' if rec and d.weekday() in (1,3) else ''
            cells.append(f'<div class="cd{we}"><span class="dn">{dd}</span>{extra}</div>')
    horas = n_aula*4 + n_sem*4
    return (f'<div class="mes"><div class="mes-h"><span class="mn">Mês {mi+1}</span>'
            f'<h3>{MNAME[m]} {y}</h3><span class="mm">{n_aula+n_sem} dias · {horas} h</span></div>'
            f'<div class="cal">{"".join(cells)}</div>'
            f'<div class="mes-f"><span>{n_aula} dias de disciplinas · {n_sem} seminário</span>'
            f'<span class="mono">{horas} h</span></div></div>')

# ============================================================ CRONOGRAMA ======
def cron_mes(mi, y, m):
    rows = []; nd = 0
    for d in sorted(DAYS):
        if (d.year,d.month) != (y,m): continue
        inf = DAYS[d]; nd += 1
        dia = WD[d.weekday()]
        if inf["tipo"] == "sem":
            tp = inf["topicos"]
            head = (f'<td class="dt" rowspan="4">{dstr(d)}</td>'
                    f'<td class="pf" rowspan="4">{dia}</td>')
            prof = '<td class="pf" rowspan="4">Formador(a)<br>convidado(a)</td>'
            rows.append(f'<tr class="d0 semi">{head}<td class="tp">08h00–09h30</td><td class="tp">1.º tempo</td>'
                        f'<td>{sig("SEM")}</td><td class="tema"><strong>Seminário {inf["n"]} · {E(inf["area"])} — {E(inf["tema"])}</strong><br>'
                        f'<em>Módulo 1: {E(tp[0])}</em></td>{prof}<td class="c"><span class="nat">T</span></td><td class="n">90 min</td></tr>')
            rows.append('<tr class="int"><td class="tp">09h30–09h45</td><td class="tp">Intervalo</td><td colspan="2">Intervalo regulamentar</td><td></td><td class="n">15 min</td></tr>')
            rows.append(f'<tr class="semi"><td class="tp">09h45–11h15</td><td class="tp">2.º tempo</td>'
                        f'<td>{sig("SEM")}</td><td class="tema"><em>Módulo 2: {E(tp[1])}</em><br><em>Módulo 3: {E(tp[2])}</em></td>'
                        f'<td class="c"><span class="nat">T/P</span></td><td class="n">90 min</td></tr>')
            rows.append(f'<tr class="semi"><td class="tp">11h15–12h15</td><td class="tp">3.º bloco</td>'
                        f'<td>{sig("SEM")}</td><td class="tema"><em>{E(tp[3])}</em></td>'
                        f'<td class="c"><span class="nat nat-P">P</span></td><td class="n">60 min</td></tr>')
            continue

        lo, cu = inf["longa"], inf["curta"]
        sl = DISC[lo]["seq"][inf["i_long"]]; sc = DISC[cu]["seq"][inf["i_curt"]]
        n1, f1, n2, f2 = NAT_LONG[sl[1]]; nsh, fsh = NAT_SHORT[sc[1]]
        cls1 = " nat-P" if n1=="P" else (" nat-AV" if n1=="Aval." else "")
        cls2 = " nat-P" if n2=="P" else (" nat-AV" if n2=="Aval." else "")
        cls3 = " nat-P" if nsh=="P" else (" nat-AV" if nsh=="Aval." else "")
        head = f'<td class="dt" rowspan="4">{dstr(d)}</td><td class="pf" rowspan="4">{dia}</td>'
        prof = f'<td class="pf" rowspan="4">{E(DISC[lo]["prof"]).replace("Prof. ","Prof.<br>")}</td>'
        rows.append(f'<tr class="d0">{head}<td class="tp">08h00–09h30</td><td class="tp">1.º tempo</td>'
                    f'<td>{sig(lo)}</td><td class="tema"><strong>{E(sl[0])}</strong><br><em>{f1}</em></td>'
                    f'{prof}<td class="c"><span class="nat{cls1}">{n1}</span></td><td class="n">90 min</td></tr>')
        rows.append('<tr class="int"><td class="tp">09h30–09h45</td><td class="tp">Intervalo</td><td colspan="2">Intervalo regulamentar</td><td></td><td class="n">15 min</td></tr>')
        rows.append(f'<tr><td class="tp">09h45–11h15</td><td class="tp">2.º tempo</td>'
                    f'<td>{sig(lo)}</td><td class="tema"><em>{f2}</em></td>'
                    f'<td class="c"><span class="nat{cls2}">{n2}</span></td><td class="n">90 min</td></tr>')
        rows.append(f'<tr><td class="tp">11h15–12h15</td><td class="tp">3.º bloco</td>'
                    f'<td>{sig(cu)}</td><td class="tema"><strong>{E(sc[0])}</strong><br><em>{fsh}</em></td>'
                    f'<td class="c"><span class="nat{cls3}">{nsh}</span></td><td class="n">60 min</td></tr>')
    horas = nd*4
    return (f'<div class="cron-mes"><h3>Mês {mi+1} — {MNAME[m]} {y}<span>{nd} dias letivos · {horas} horas</span></h3>'
            f'<div class="tw"><table class="cron"><thead><tr>'
            f'<th>Data</th><th>Dia</th><th>Horário</th><th>Tempo letivo</th><th>Disciplina</th>'
            f'<th>Tema</th><th>Professor</th><th class="c">T/P</th><th class="n">Duração</th>'
            f'</tr></thead><tbody>{"".join(rows)}</tbody></table></div></div>')

# ============================================================ TABELAS =========
def tab_mes_disc():
    rows = []
    tot_m = {k:0 for k in ORDEM}; tot_sem = 0; tot_h = 0
    for mi,(y,m) in enumerate(MONTHS):
        h = {k:0 for k in ORDEM}; sm = 0; nt = nq = 0
        for d,inf in DAYS.items():
            if (d.year,d.month)!=(y,m): continue
            if inf["tipo"]=="aula":
                h[inf["longa"]] += 3; h[inf["curta"]] += 1
                if d.weekday()==1: nt += 1
                else: nq += 1
            else: sm += 4
        tot = sum(h.values())+sm; tot_h += tot; tot_sem += sm
        for k in ORDEM: tot_m[k] += h[k]
        rows.append(f'<tr><td><strong>Mês {mi+1}</strong></td><td>{MNAME[m]} {y}</td>'
                    f'<td class="n">{nt}</td><td class="n">{nq}</td>'
                    + "".join(f'<td class="n">{h[k]}</td>' for k in ORDEM)
                    + f'<td class="n">{sm}</td><td class="n"><strong>{tot}</strong></td></tr>')
    foot = (f'<tr><td colspan="2">Total do ciclo</td><td class="n">{len(TER_C)+len([x for x in SEM_DATES if x.weekday()==1])}</td>'
            f'<td class="n">{len(QUI_C)+len([x for x in SEM_DATES if x.weekday()==3])}</td>'
            + "".join(f'<td class="n">{tot_m[k]}</td>' for k in ORDEM)
            + f'<td class="n">{tot_sem}</td><td class="n">{tot_h}</td></tr>')
    return (f'<div class="tw"><table><thead><tr><th>Mês</th><th>Período</th>'
            f'<th class="n">Ter.</th><th class="n">Qui.</th>'
            + "".join(f'<th class="n">{k}</th>' for k in ORDEM)
            + f'<th class="n">SEM</th><th class="n">Total h</th></tr></thead>'
            f'<tbody>{"".join(rows)}</tbody><tfoot>{foot}</tfoot></table></div>')

def chart_carga():
    rows = []
    maxh = max(max(TOT.values()), TOT_SEM)
    for k in ORDEM:
        t,p = SPLIT[k]; tot = TOT[k]
        wt = t/maxh*100; wp = p/maxh*100
        rows.append(
          f'<div class="crow"><div class="cl">{E(DISC[k]["nome"])}<small>{k}</small></div>'
          f'<div class="cbar" role="img" aria-label="{E(DISC[k]["nome"])}: {t} horas teóricas e {p} horas práticas, total {tot} horas">'
          f'<i class="th" style="width:{wt:.2f}%">{t}h</i><i class="pr" style="width:{wp:.2f}%">{p}h</i></div>'
          f'<div class="cv">{tot} h</div></div>')
    ws = TOT_SEM/maxh*100
    rows.append(
      f'<div class="crow"><div class="cl">Seminários complementares<small>SEM · 8 × 4 h</small></div>'
      f'<div class="cbar" role="img" aria-label="Seminários: 24 horas teóricas e 8 horas de oficina, total 32 horas">'
      f'<i class="th" style="width:{ws*0.75:.2f}%">24h</i><i class="pr" style="width:{ws*0.25:.2f}%">8h</i></div>'
      f'<div class="cv">{TOT_SEM} h</div></div>')
    return (f'<div class="chart"><p class="chart-t">Carga horária por disciplina, repartida por componente</p>'
            f'<p class="chart-s">Total do ciclo: {TOT_GERAL} horas em {len(DAYS)} dias letivos. '
            f'A barra mede horas; o segmento sólido é a componente prática.</p>'
            f'<div class="chart-leg"><span><i class="th" style="background:var(--theor);box-shadow:inset 0 0 0 1px var(--theor-line)"></i>Componente teórica</span>'
            f'<span><i class="pr" style="background:var(--pract)"></i>Componente prática</span></div>'
            f'{"".join(rows)}</div>')

def tab_resumo():
    rows = []
    for k in ORDEM:
        t,p = SPLIT[k]; s = sessoes(k)
        rows.append(f'<tr><td>{sig(k)}</td><td><strong>{E(DISC[k]["nome"])}</strong></td>'
                    f'<td>{E(DISC[k]["prof"])}</td><td class="n">{len(s)}</td>'
                    f'<td class="n">{LONG_N[k]}</td><td class="n">{CURT_N[k]}</td>'
                    f'<td class="n">{t}</td><td class="n">{p}</td><td class="n"><strong>{TOT[k]}</strong></td>'
                    f'<td class="n">{TOT[k]/TOT_GERAL*100:.1f}%</td></tr>')
    rows.append(f'<tr><td>{sig("SEM")}</td><td><strong>Seminários complementares</strong> '
                f'(Língua Portuguesa, Psicologia, Saúde Mental, Saúde Coletiva)</td>'
                f'<td>Formadores convidados</td><td class="n">8</td><td class="n">—</td><td class="n">—</td>'
                f'<td class="n">24</td><td class="n">8</td><td class="n"><strong>{TOT_SEM}</strong></td>'
                f'<td class="n">{TOT_SEM/TOT_GERAL*100:.1f}%</td></tr>')
    foot = (f'<tr><td colspan="3">Total do ciclo formativo — {len(DAYS)} dias letivos</td>'
            f'<td class="n">{sum(len(sessoes(k)) for k in ORDEM)+8}</td>'
            f'<td class="n">{sum(LONG_N.values())}</td><td class="n">{sum(CURT_N.values())}</td>'
            f'<td class="n">{T_SUM+24}</td><td class="n">{P_SUM+8}</td>'
            f'<td class="n">{TOT_GERAL}</td><td class="n">100%</td></tr>')
    return (f'<div class="tw"><table><thead><tr><th>Sigla</th><th>Disciplina</th><th>Docente</th>'
            f'<th class="n">Sessões</th><th class="n">Blocos 180′</th><th class="n">Blocos 60′</th>'
            f'<th class="n">Teórica</th><th class="n">Prática</th><th class="n">Total</th><th class="n">% ciclo</th>'
            f'</tr></thead><tbody>{"".join(rows)}</tbody><tfoot>{foot}</tfoot></table></div>')

def tab_unidades(k):
    rows = []
    for num, tit, cont in UNIDADES[k]:
        h = UNI_H[k].get(num,0)
        rows.append(f'<tr><td class="c mono">{num}</td><td><strong>{E(tit)}</strong><br>'
                    f'<span style="font-size:12.5px">{E(cont)}</span></td><td class="n">{h} h</td></tr>')
    return (f'<div class="tw"><table><thead><tr><th style="width:52px" class="c">Un.</th>'
            f'<th>Unidade temática e conteúdos</th><th class="n">Carga</th></tr></thead>'
            f'<tbody>{"".join(rows)}</tbody>'
            f'<tfoot><tr><td colspan="2">Carga horária total da disciplina</td>'
            f'<td class="n">{TOT[k]} h</td></tr></tfoot></table></div>')
print("build.py parte 1 OK")

# ============================================================ PROGRAMAS =======
def bloco_programa(k, idx):
    d = DISC[k]; t,p = SPLIT[k]; s = sessoes(k)
    li = lambda xs: "".join(f"<li>{E(x)}</li>" for x in xs)
    return f"""
<article class="prog" id="prog-{k.lower()}">
  <div class="prog-h">
    <div class="pi"><span class="code">Disciplina {idx} · {k}</span>
      <h3>{E(d['nome'])}</h3>
      <p class="pp">{E(d['prof'])} · Técnico de Enfermagem · {len(s)} sessões distribuídas do 1.º ao 8.º mês</p></div>
    <div class="prog-kpi">
      <div><b>{TOT[k]}</b><small>Horas</small></div>
      <div><b>{t}</b><small>Teórica</small></div>
      <div><b>{p}</b><small>Prática</small></div>
      <div><b>{p/TOT[k]*100:.0f}%</b><small>Prática</small></div>
    </div>
  </div>
  <div class="prog-b">
    <h4 class="sub-h4">Fundamentação</h4>
    <p>{E(FUND[k])}</p>
    <h4 class="sub-h4">Objetivo geral</h4>
    <p>{E(OBJ_GERAL[k])}</p>
    <div class="grid2">
      <div><h4 class="sub-h4">Objetivos específicos</h4><ul class="li">{li(OBJ_ESP[k])}</ul></div>
      <div><h4 class="sub-h4">Competências a desenvolver</h4><ul class="tick">{li(COMPET[k])}</ul></div>
    </div>
    <h4 class="sub-h4">Unidades temáticas, conteúdos e carga horária</h4>
    {tab_unidades(k)}
    <h4 class="sub-h4">Técnicas e procedimentos a executar</h4>
    <p>{E(TECNICAS[k])}</p>
    <h4 class="sub-h4">Metodologia</h4>
    <p>{E(METODOLOGIA[k])}</p>
    <h4 class="sub-h4">Materiais e recursos didáticos</h4>
    <p>{E(MATERIAIS[k])}</p>
    <div class="grid2">
      <div><h4 class="sub-h4">Sistema de avaliação da disciplina</h4>
        <p>Duas avaliações escritas intercalares, demonstrações práticas avaliadas por grelha de observação ao
        longo de todas as unidades, um estudo de caso escrito e a avaliação prática final em estações.
        A ponderação segue o quadro geral do capítulo 11. A componente prática é eliminatória: sem
        classificação igual ou superior a 10 valores na avaliação prática final não há aprovação na disciplina,
        independentemente da média obtida nas restantes componentes.</p></div>
      <div><h4 class="sub-h4">Avaliação prática final</h4><p>{E(AVAL_PRATICA[k])}</p></div>
    </div>
    <h4 class="sub-h4">Resultados esperados</h4>
    <p>{E(RESULTADOS[k])}</p>
  </div>
</article>"""

def bloco_seminarios():
    out = []
    for i,(d,(area,tema,tops)) in enumerate(zip(SEM_DATES, SEMINARIOS)):
        out.append(f"""<div class="sem">
  <div class="sh"><span class="sn">Seminário {i+1}</span><span class="sa">{E(area)}</span>
    <span class="sd">{dstr(d)} · {WDS[d.weekday()]} · 4 h</span></div>
  <h4>{E(tema)}</h4>
  <ul>{"".join(f"<li>{E(t)}</li>" for t in tops)}</ul></div>""")
    return '<div class="sems">' + "".join(out) + '</div>'

AVAL = [("Avaliação contínua e participação nas sessões",10,
         "Envolvimento nas demonstrações, qualidade da intervenção em estudo de caso e progressão observada."),
        ("Assiduidade e pontualidade",5,
         "Presença mínima obrigatória de 75 % das horas de cada disciplina e de 75 % dos seminários."),
        ("Trabalhos e estudos de caso",15,
         "Um estudo de caso escrito por disciplina, com plano de cuidados e registos de enfermagem."),
        ("Avaliações escritas intercalares",20,
         "Duas provas por disciplina, aplicadas no bloco complementar de 60 minutos."),
        ("Demonstrações e avaliações práticas intercalares",20,
         "Execução de procedimentos avaliada por grelha de observação ao longo de todas as unidades."),
        ("Avaliação prática final em estações",20,
         "Quatro a cinco estações cronometradas por disciplina, com critérios eliminatórios de biossegurança."),
        ("Avaliação final escrita integrada",10,
         "Prova única de integração das quatro disciplinas, aplicada no último mês do ciclo.")]

def tab_aval():
    bar = "".join(f'<i style="flex:{p}">{p}%</i>' for _,p,_ in AVAL)
    rows = "".join(f'<tr><td><strong>{E(n)}</strong></td><td>{E(dsc)}</td><td class="n">{p} %</td></tr>'
                   for n,p,dsc in AVAL)
    return (f'<div class="aval-bar" role="img" aria-label="Repartição percentual das componentes de avaliação">{bar}</div>'
            f'<div class="tw"><table><thead><tr><th>Componente</th><th>Descrição</th><th class="n">Peso</th></tr></thead>'
            f'<tbody>{rows}</tbody><tfoot><tr><td colspan="2">Classificação final da disciplina</td>'
            f'<td class="n">100 %</td></tr></tfoot></table></div>')

# ============================================================ DOCUMENTO ======
TOC = [("1","Introdução e fundamentação","intro"),
       ("2","Objetivos do programa","objetivos"),
       ("3","Perfil de entrada e perfil de saída","perfis"),
       ("4","Metodologia de formação","metodologia"),
       ("5","Plano curricular e distribuição da carga horária","plano"),
       ("6","Horário-base e regime de blocos letivos","horario"),
       ("7","Calendário letivo dos oito meses","calendario"),
       ("8","Cronograma detalhado de aulas","cronograma"),
       ("9","Programas das quatro disciplinas","programas"),
       ("10","Plano dos oito seminários complementares","seminarios"),
       ("11","Sistema de avaliação","avaliacao"),
       ("12","Recursos, materiais e requisitos de funcionamento","recursos"),
       ("13","Tabela-resumo final","resumo")]

def sec(n, tit, sid, tag, body):
    return (f'<section class="sec" id="{sid}"><div class="sec-h"><span class="sec-n">{n}</span>'
            f'<h2>{tit}</h2><span class="tag">{tag}</span></div>{body}</section>')
print("build.py parte 2 OK")

FICHA = [
 ("Designação da formação","Curso de Formação Técnico-Profissional em Enfermagem — Ciclo de Aprofundamento"),
 ("Entidade formadora","Grupo Midas Angola · Centro de Formação Técnica em Saúde"),
 ("Programa","MIDAS 26 — Do Zero ao Emprego"),
 ("Duração","8 meses"),
 ("Período do ciclo", f"{dstr(START)} a {dstr(END)}"),
 ("Dias de formação","Terça-feira e quinta-feira"),
 ("Horário","08h00 – 12h15 (4 horas efetivas + 15 min de intervalo)"),
 ("Dias letivos", f"{len(DAYS)} ({N_AULAS} de disciplinas + 8 de seminário)"),
 ("Carga horária total", f"{TOT_GERAL} horas — {T_SUM+24} h teóricas e {P_SUM+8} h práticas"),
 ("Estrutura curricular","4 disciplinas técnicas simultâneas + 8 seminários complementares"),
 ("Equipa docente","Prof. Manuel Jorge Weber e Prof. Eduardo David, Técnicos de Enfermagem"),
 ("Pré-requisito","Conclusão de Técnicas de Enfermagem, Farmacologia, Anatomia e Doenças Correntes"),
]

PERFIL_ENT = ["Frequência concluída das disciplinas de Técnicas de Enfermagem, Farmacologia, Anatomia e Doenças Correntes.",
 "Domínio dos procedimentos básicos de enfermagem e da preparação e administração de terapêutica.",
 "Conhecimento da estrutura anatómica e dos quadros clínicos mais frequentes.",
 "Capacidade de leitura e de escrita em língua portuguesa suficiente para o registo clínico."]
PERFIL_SAI = ["Presta cuidados de enfermagem ao adulto internado em serviço médico e cirúrgico, organizando o turno por prioridades.",
 "Reconhece a deterioração clínica e atua nos primeiros minutos de uma emergência, no adulto e na criança.",
 "Acompanha a mulher na gravidez, assiste ao parto normal e presta os cuidados imediatos ao recém-nascido.",
 "Avalia, classifica e cuida da criança, decidindo entre tratar e encaminhar.",
 "Aplica sistematicamente as medidas de biossegurança, de prevenção de infeção e de segurança do doente.",
 "Comunica com o doente, a família e a equipa e documenta a sua intervenção com rigor.",
 "Reconhece os limites da sua competência e encaminha em tempo útil."]

METOD_GERAL = [("Exposição dialogada","Abertura de cada tema com enquadramento breve, sempre ancorado num caso clínico apresentado no início da sessão."),
 ("Demonstração","Execução do procedimento pelo formador, primeiro em velocidade normal e depois decomposta em passos, com explicitação dos critérios de correção."),
 ("Técnicas práticas","Execução individual por todos os formandos, em manequim, modelo ou simulador, contra grelha de observação."),
 ("Simulação","Cenários com atribuição de funções, gestão de tempo e debriefing estruturado no final."),
 ("Estudo de casos","Casos clínicos reais anonimizados, trabalhados em grupo, com plano de cuidados escrito."),
 ("Resolução de situações clínicas","Exercícios de decisão sob restrição de tempo e de recursos, com justificação obrigatória da conduta."),
 ("Avaliação prática","Estações cronometradas com critérios eliminatórios de biossegurança."),
 ("Revisão e consolidação","Blocos complementares dedicados à síntese, ao exercício de registo e à correção comentada.")]

def documento():
    toc = "".join(f'<li><span class="tn">{n}</span><a href="#{sid}">{E(t)}</a></li>' for n,t,sid in TOC)
    ficha = "".join(f'<div class="row"><dt>{E(a)}</dt><dd>{E(b)}</dd></div>' for a,b in FICHA)
    meses = "".join(cal_mes(i,y,m) for i,(y,m) in enumerate(MONTHS))
    cron  = "".join(cron_mes(i,y,m) for i,(y,m) in enumerate(MONTHS))
    progs = "".join(bloco_programa(k,i+1) for i,k in enumerate(ORDEM))
    metod = "".join(f'<tr><td><strong>{E(a)}</strong></td><td>{E(b)}</td></tr>' for a,b in METOD_GERAL)
    fer_rows = "".join(f'<tr><td class="dt mono">{dstr(d)}</td><td>{WD[d.weekday()]}</td><td>{E(n)}</td>'
                       f'<td>{"Dia de aula suprimido" if d.weekday() in (1,3) else "Sem impacto no horário"}</td></tr>'
                       for d,n in sorted(FER.items()))
    ab = ""
    for lbl,(a,b) in [("Semana A — terça-feira",("EMC","UEPS")),("Semana B — terça-feira",("UEPS","EMC")),
                      ("Semana A — quinta-feira",("SMON","EPSC")),("Semana B — quinta-feira",("EPSC","SMON"))]:
        ab += (f'<div class="abc"><h4>{lbl}</h4>'
               f'<div class="r"><span><span class="h">08h00–11h15</span> &nbsp;{sig(a)} {E(DISC[a]["nome"])}</span><b class="mono">180 min</b></div>'
               f'<div class="r"><span><span class="h">11h15–12h15</span> &nbsp;{sig(b)} {E(DISC[b]["nome"])}</span><b class="mono">60 min</b></div></div>')

    return f"""<title>Programa de Enfermagem MIDAS 26</title>
{CSS}
<div class="wrap">

<header class="capa">
  <div class="capa-in">
    <div class="capa-logo"><img src="{LOGO}" alt="Logótipo MIDAS 26 — Do Zero ao Emprego"></div>
    <div>
      <p class="capa-eyebrow">Grupo Midas Angola · Centro de Formação Técnica em Saúde</p>
      <h1>Programa de Formação Técnico-Profissional em Enfermagem</h1>
      <p class="sub">Ciclo de Aprofundamento · Outubro de 2026 a Maio de 2027</p>
      <div class="capa-facts">
        <span><b>8</b> meses</span><span><b>{len(DAYS)}</b> dias letivos</span>
        <span><b>{TOT_GERAL}</b> horas</span><span><b>4</b> disciplinas técnicas</span>
        <span><b>8</b> seminários</span><span>Terças e quintas · <b>08h00–12h15</b></span>
      </div>
    </div>
  </div>
</header>

<div class="ficha"><h2>Identificação da formação</h2><dl>{ficha}</dl></div>

<nav class="toc"><h2>Índice</h2><ol>{toc}</ol></nav>

{sec("1","Introdução e fundamentação","intro","Enquadramento", f'''
<div class="prose">
<p>O presente documento estabelece o programa do <strong>Ciclo de Aprofundamento</strong> da Formação
Técnico-Profissional em Enfermagem do Centro de Formação Técnica em Saúde do Grupo Midas Angola, com a
duração de oito meses.</p>
<p>Os formandos concluíram já as disciplinas de <strong>Técnicas de Enfermagem</strong>,
<strong>Farmacologia</strong>, <strong>Anatomia</strong> e <strong>Doenças Correntes</strong>. Nenhuma delas
é retomada como disciplina autónoma. O que aí se adquiriu — o gesto técnico isolado, o conhecimento do
fármaco, a estrutura do corpo e o quadro clínico — constitui agora o pressuposto, não o conteúdo. Este ciclo
faz a passagem do procedimento para o cuidado: organiza o conhecimento por contexto clínico e por ciclo de
vida, e exige do formando que integre técnica, raciocínio e decisão perante um doente concreto.</p>
<p>A estrutura assenta em <strong>quatro disciplinas técnicas ministradas em simultâneo ao longo dos oito
meses</strong>, sem que nenhuma se esgote a meio do percurso. Esta simultaneidade é deliberada: o
aprofundamento faz-se por espiral e não por sequência fechada, de modo que uma competência introduzida no
primeiro mês seja retomada, complexificada e reavaliada em contextos sucessivos até ao oitavo. Nenhuma
disciplina termina ao quarto mês; todas percorrem integralmente o ciclo.</p>
<p>A distribuição da carga horária privilegia deliberadamente a <strong>componente prática</strong>, que
representa {(P_SUM+8)/TOT_GERAL*100:.0f} % do total. Quatro eixos transversais atravessam as quatro
disciplinas e são avaliados em todas elas: <strong>biossegurança e prevenção de infeção</strong>,
<strong>segurança do doente</strong>, <strong>ética e comunicação</strong> e <strong>registos de enfermagem e
encaminhamento adequado</strong>.</p>
</div>''')}

{sec("2","Objetivos do programa","objetivos","Finalidades", f'''
<h3 class="sub-h">Objetivo geral</h3>
<div class="prose"><p>Habilitar o formando a exercer as funções de Técnico de Enfermagem com autonomia técnica
no âmbito da sua competência, prestando cuidados seguros, sistematizados e humanizados ao adulto, à mulher no
ciclo gravídico-puerperal, ao recém-nascido e à criança, em contexto de internamento, de urgência e de
cuidados primários, e reconhecendo com clareza os limites da sua intervenção.</p></div>
<h3 class="sub-h">Objetivos específicos</h3>
<ul class="tick" style="max-width:80ch">
<li>Consolidar e aprofundar as competências técnicas adquiridas no ciclo anterior, aplicando-as a contextos clínicos completos.</li>
<li>Instalar um método único e reprodutível de avaliação do doente, aplicável ao adulto, à grávida e à criança.</li>
<li>Desenvolver a capacidade de reconhecimento precoce da deterioração clínica e de decisão sob restrição de tempo.</li>
<li>Assegurar a execução segura dos procedimentos invasivos do âmbito do Técnico de Enfermagem.</li>
<li>Tornar a biossegurança e a prevenção de infeção um comportamento sistemático e não uma regra evocada.</li>
<li>Desenvolver a comunicação profissional com o doente, a família e a equipa.</li>
<li>Garantir a qualidade, a legibilidade e a utilidade dos registos de enfermagem.</li>
<li>Formar profissionais capazes de identificar o limite da sua competência e de encaminhar em tempo útil.</li>
<li>Complementar a formação técnica com as áreas transversais indispensáveis ao exercício — língua portuguesa,
psicologia, saúde mental e saúde coletiva — através de seminários.</li>
</ul>''')}

{sec("3","Perfil de entrada e perfil de saída","perfis","Competências", f'''
<div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:28px">
<div><h4 class="sub-h4">Perfil de entrada</h4><ul class="li">{"".join(f"<li>{E(x)}</li>" for x in PERFIL_ENT)}</ul></div>
<div><h4 class="sub-h4">Perfil de saída</h4><ul class="tick">{"".join(f"<li>{E(x)}</li>" for x in PERFIL_SAI)}</ul></div>
</div>''')}

{sec("4","Metodologia de formação","metodologia","Estratégias", f'''
<div class="prose"><p>Todas as sessões combinam as modalidades abaixo. A regra de ouro do ciclo é que
<strong>nenhum procedimento é dado por adquirido sem execução individual observada</strong>: a demonstração
pelo formador nunca substitui a execução por cada formando contra uma grelha de critérios explícitos.</p></div>
<div class="tw"><table><thead><tr><th style="width:250px">Modalidade</th><th>Aplicação no ciclo</th></tr></thead>
<tbody>{metod}</tbody></table></div>
<div class="callout"><h4>Eixos transversais</h4>
<p>Biossegurança e prevenção de infeção · segurança do doente · ética e comunicação · registos de enfermagem
e encaminhamento adequado. Estes eixos não constituem unidades autónomas: são critérios de avaliação
presentes em todas as grelhas de observação das quatro disciplinas, com estatuto eliminatório nos itens de
segurança.</p></div>''')}

{sec("5","Plano curricular e distribuição da carga horária","plano","Carga horária", f'''
<div class="prose">
<p>As quatro disciplinas não têm carga horária idêntica. A repartição foi definida em função da
<strong>extensão dos conteúdos</strong>, da <strong>exigência de componente prática</strong> e do
<strong>peso relativo das competências</strong> no exercício do Técnico de Enfermagem, e não por divisão
aritmética do total disponível.</p>
<p><strong>Enfermagem Médico-Cirúrgica</strong> recebe a maior carga por ser a disciplina de maior amplitude
de conteúdos — cobre todos os aparelhos e sistemas, o perioperatório e o doente crónico — e por corresponder
ao contexto onde o técnico exerce de forma mais continuada. <strong>Saúde Materna, Obstétrica e Neonatal</strong>
segue-a de perto, por acumular três domínios clínicos distintos (gravidez, parto e neonatologia) que não
admitem compressão. <strong>Urgência, Emergência e Primeiros Socorros</strong> tem conteúdo teórico mais
circunscrito, mas a mais alta proporção de treino prático — {SPLIT["UEPS"][1]/TOT["UEPS"]*100:.0f} % da sua
carga é prática — porque a competência em emergência depende de repetição deliberada até à automatização.
<strong>Enfermagem Pediátrica</strong> beneficia de conteúdos já parcialmente cobertos em Doenças Correntes e
concentra-se na avaliação, na classificação e nos procedimentos específicos da criança.</p>
</div>
{chart_carga()}
<p class="tnote">Leitura: cada barra mede a carga horária total da disciplina; o segmento sólido é a componente
prática. Os valores absolutos estão inscritos nos segmentos e repetidos na tabela do capítulo 13.</p>
<h3 class="sub-h">Presença das quatro disciplinas em cada um dos oito meses</h3>
{tab_mes_disc()}
<p class="tnote">Todas as disciplinas estão presentes do 1.º ao 8.º mês. A variação mensal de horas resulta do
número de terças e quintas de cada mês, da interrupção letiva de {dstr(REC[0])} a {dstr(REC[1])} e dos
feriados nacionais que recaem em dia de aula.</p>''')}

{sec("6","Horário-base e regime de blocos letivos","horario","08h00 – 12h15", f'''
<div class="prose">
<p>O dia letivo decorre das <strong>08h00 às 12h15</strong>: 255 minutos de permanência, dos quais
<strong>240 minutos são de formação efetiva</strong> e 15 de intervalo. O tempo letivo principal é de
<strong>90 minutos</strong>.</p>
</div>
<div class="horario">
  <div class="hb"><div class="t">08h00 – 09h30</div><div class="d"><b>1.º tempo letivo</b></div><div class="m">90 min</div></div>
  <div class="hb int"><div class="t">09h30 – 09h45</div><div class="d">Intervalo</div><div class="m">15 min</div></div>
  <div class="hb"><div class="t">09h45 – 11h15</div><div class="d"><b>2.º tempo letivo</b></div><div class="m">90 min</div></div>
  <div class="hb"><div class="t">11h15 – 12h15</div><div class="d"><b>3.º bloco complementar</b></div><div class="m">60 min</div></div>
  <div class="hb tot"><div class="t">08h00 – 12h15</div><div class="d"><b>Formação efetiva</b></div><div class="m">240 min</div></div>
</div>
<div class="callout warn"><h4>A regra dos 90 minutos e a razão da distribuição 180 + 60</h4>
<p>Os 240 minutos efetivos do dia <strong>não são divisíveis em dois blocos iguais de 90 minutos por
disciplina</strong>. Se se pretendesse atribuir rigorosamente dois tempos de 120 minutos — um a cada
disciplina do dia — o tempo letivo deixaria de ser de 90 minutos e passaria a ser de 120, e a designação
"tempo letivo de 90 minutos" tornar-se-ia incorreta.</p>
<p>Mantendo-se a regra dos 90 minutos, a única distribuição consistente com a entrada às 08h00, a saída às
12h15 e o intervalo de 15 minutos é <strong>180 + 60</strong>: uma disciplina ocupa o 1.º e o 2.º tempos
letivos (2 × 90 = 180 minutos) e a outra ocupa o 3.º bloco complementar (60 minutos). É esta a regra adotada
em todo o programa.</p></div>
<h3 class="sub-h">Alternância entre disciplinas</h3>
<div class="prose"><p>Cada docente é responsável pelas suas duas disciplinas e leciona-as no mesmo dia, o que
evita deslocações para blocos isolados de 60 minutos. <strong>Terça-feira</strong> é o dia do Prof. Manuel
Jorge Weber (EMC e UEPS); <strong>quinta-feira</strong> é o dia do Prof. Eduardo David (SMON e EPSC).</p></div>
<div class="ab">{ab}</div>
<div class="callout"><h4>Ciclo de compensação de cinco semanas</h4>
<p>A alternância obedece a um ciclo de cinco semanas com a sequência <span class="mono">A · B · A · B · A</span>.
Em cada ciclo, a disciplina de maior extensão ocupa três vezes o bloco de 180 minutos e duas vezes o bloco de
60; a disciplina parceira faz o percurso inverso. É este mecanismo — e não uma atribuição arbitrária de horas
— que produz a diferenciação de carga horária descrita no capítulo 5, garantindo ao mesmo tempo que
<strong>as duas disciplinas de cada docente estão presentes em todos os dias letivos</strong>, do primeiro ao
último mês. Nos dias de seminário, o seminário ocupa integralmente o período das 08h00 às 12h15, incluindo o
intervalo.</p></div>''')}

{sec("7","Calendário letivo dos oito meses","calendario",f"{dstr(START)} – {dstr(END)}", f'''
<div class="cal-legend">
  <span class="lg"><span class="sw sw-aula"></span>Dia de aula (terça ou quinta)</span>
  <span class="lg"><span class="sw sw-sem"></span>Dia de seminário</span>
  <span class="lg"><span class="sw sw-hol"></span>Feriado nacional</span>
  <span class="lg">{sig("EMC")} Enfermagem Médico-Cirúrgica e Cuidados ao Adulto</span>
  <span class="lg">{sig("UEPS")} Urgência, Emergência e Primeiros Socorros</span>
  <span class="lg">{sig("SMON")} Saúde Materna, Obstétrica e Neonatal</span>
  <span class="lg">{sig("EPSC")} Enfermagem Pediátrica e Saúde da Criança</span>
  <span class="lg">{sig("SEM")} Seminário complementar</span>
</div>
<p class="tnote">Em cada dia assinalado, a sigla em primeiro lugar corresponde à disciplina que ocupa o 1.º e o
2.º tempos letivos (180 minutos) e a segunda à que ocupa o 3.º bloco complementar (60 minutos).</p>
<div class="meses">{meses}</div>
<h3 class="sub-h">Interrupções letivas e feriados</h3>
<p class="tnote">Interrupção letiva de Natal e Ano Novo: de {dstr(REC[0])} a {dstr(REC[1])}.</p>
<div class="tw"><table><thead><tr><th>Data</th><th>Dia</th><th>Feriado</th><th>Efeito no calendário</th></tr></thead>
<tbody>{fer_rows}</tbody></table></div>
<div class="callout warn"><h4>Confirmação do calendário oficial</h4>
<p>As datas de feriado acima indicadas devem ser confirmadas junto do calendário oficial publicado anualmente
para o ano civil correspondente, incluindo eventuais pontes, tolerâncias de ponto e feriados municipais da
localidade onde a formação decorre. Qualquer alteração implica a reposição do dia letivo suprimido, a
agendar pela Coordenação Pedagógica.</p></div>''')}

{sec("8","Cronograma detalhado de aulas","cronograma",f"{len(DAYS)} dias · {TOT_GERAL} h", f'''
<p class="tnote">Cada dia letivo é apresentado nos seus três blocos. A disciplina de 180 minutos ocupa o 1.º e
o 2.º tempos: o primeiro destina-se ao enquadramento e à demonstração, o segundo ao treino prático
supervisionado do mesmo tema. Legenda de natureza: <span class="nat">T</span> teórica ·
<span class="nat">T/P</span> teórico-prática · <span class="nat nat-P">P</span> prática ·
<span class="nat nat-AV">Aval.</span> avaliação.</p>
{cron}''')}

{sec("9","Programas das quatro disciplinas","programas","Fundamentação · Objetivos · Unidades · Avaliação", progs)}

{sec("10","Plano dos oito seminários complementares","seminarios","8 × 4 h = 32 h", f'''
<div class="prose"><p>Os seminários cobrem áreas indispensáveis ao exercício profissional que não constituem
disciplinas regulares deste ciclo. Realiza-se <strong>um seminário por mês</strong>, ocupando integralmente o
período das 08h00 às 12h15, incluindo o intervalo. Cada área é tratada em dois seminários, o primeiro de
fundamentos e o segundo de aplicação. Os seminários são de frequência obrigatória e a participação conta para
a componente de avaliação contínua.</p></div>
<div class="tw"><table><thead><tr><th>N.º</th><th>Data</th><th>Dia</th><th>Área</th><th>Tema</th><th class="n">Duração</th></tr></thead>
<tbody>{"".join(f'<tr><td class="c mono">{i+1}</td><td class="mono">{dstr(d)}</td><td>{WD[d.weekday()]}</td>'
   f'<td><strong>{E(a)}</strong></td><td>{E(t)}</td><td class="n">4 h</td></tr>'
   for i,(d,(a,t,_)) in enumerate(zip(SEM_DATES, SEMINARIOS)))}</tbody>
<tfoot><tr><td colspan="5">Total dos seminários complementares</td><td class="n">32 h</td></tr></tfoot></table></div>
<h3 class="sub-h">Conteúdo de cada seminário</h3>
{bloco_seminarios()}
<div class="callout warn"><h4>Docência dos seminários</h4>
<p>Os seminários são assegurados por formadores convidados das respetivas áreas, a designar pela Coordenação
Pedagógica. Os dois Técnicos de Enfermagem responsáveis pelas disciplinas técnicas não asseguram os
seminários.</p></div>''')}

{sec("11","Sistema de avaliação","avaliacao","Ponderação e regras", f'''
<div class="prose"><p>A avaliação é <strong>contínua e de natureza maioritariamente prática</strong>. Nenhuma
componente isolada determina a aprovação, mas a componente prática é eliminatória.</p></div>
{tab_aval()}
<h3 class="sub-h">Regras de aprovação</h3>
<ul class="tick" style="max-width:80ch">
<li><strong>Escala de classificação:</strong> 0 a 20 valores.</li>
<li><strong>Aprovação na disciplina:</strong> classificação final igual ou superior a 10 valores.</li>
<li><strong>Requisito eliminatório:</strong> classificação igual ou superior a 10 valores na avaliação prática
final. Não há compensação desta componente pela média das restantes.</li>
<li><strong>Critérios de segurança:</strong> a falha em qualquer critério eliminatório de biossegurança ou de
segurança do doente numa estação prática anula a estação, independentemente da execução técnica.</li>
<li><strong>Assiduidade:</strong> presença mínima de 75 % das horas de cada disciplina e de 75 % dos
seminários. Abaixo deste limiar o formando não é admitido à avaliação prática final.</li>
<li><strong>Recurso:</strong> é admitida uma época de recurso por disciplina, com avaliação escrita e prática,
a realizar após o termo do ciclo em data fixada pela Coordenação Pedagógica.</li>
<li><strong>Aprovação no ciclo:</strong> exige aprovação nas quatro disciplinas e frequência validada dos
seminários.</li>
</ul>
<div class="callout"><h4>Instrumentos de registo da avaliação</h4>
<p>Grelha de observação por procedimento, com critérios explícitos e classificação por item; ficha de estudo
de caso com plano de cuidados; folha de estação para a avaliação prática final, assinada pelo avaliador;
pauta de assiduidade por sessão; e ficha individual de progressão do formando, revista mensalmente pela
Coordenação Pedagógica.</p></div>''')}

{sec("12","Recursos, materiais e requisitos de funcionamento","recursos","Condições mínimas", f'''
<h4 class="sub-h4">Instalações</h4>
<div class="prose"><p>Sala de aula com capacidade para o efetivo da turma e projeção; <strong>sala de práticas
de enfermagem</strong> equipada com cama hospitalar articulada, bancada de trabalho, lavatório com água
corrente e contentores de resíduos por categoria; espaço livre para cenários de simulação de emergência com
possibilidade de trabalho no solo.</p></div>
<h4 class="sub-h4">Equipamento por disciplina</h4>
<div class="tw"><table><thead><tr><th style="width:120px">Disciplina</th><th>Material e recursos didáticos</th></tr></thead>
<tbody>{"".join(f'<tr><td>{sig(k)}<br><span style="font-size:11.5px">{E(DISC[k]["nome"])}</span></td><td>{E(MATERIAIS[k])}</td></tr>' for k in ORDEM)}</tbody></table></div>
<h4 class="sub-h4">Requisitos de funcionamento</h4>
<ul class="tick" style="max-width:80ch">
<li>Rácio máximo recomendado de 6 formandos por posto de treino nas sessões de execução individual.</li>
<li>Reposição obrigatória de consumíveis antes de cada sessão prática, verificada pelo docente.</li>
<li>Impressos clínicos em quantidade suficiente para uso efetivo em sala: processo do doente, folha de
evolução e de terapêutica, cartão da grávida, partograma, curvas de crescimento e fichas de estação.</li>
<li>Reunião mensal de coordenação entre os dois docentes para verificação do cumprimento do cronograma e do
equilíbrio da alternância A/B.</li>
<li>Registo de sumários por sessão, com identificação do bloco, da disciplina e do tema efetivamente lecionado.</li>
</ul>''')}

{sec("13","Tabela-resumo final","resumo","Síntese do ciclo", f'''
{tab_resumo()}
<p class="tnote">Sessões: número de aulas atribuídas à disciplina ao longo do ciclo. Blocos 180′: dias em que a
disciplina ocupa o 1.º e o 2.º tempos letivos. Blocos 60′: dias em que ocupa o 3.º bloco complementar.</p>
<div class="tw"><table><thead><tr><th>Indicador</th><th class="n">Valor</th></tr></thead><tbody>
<tr><td>Duração do ciclo</td><td class="n">8 meses ({dstr(START)} – {dstr(END)})</td></tr>
<tr><td>Dias letivos totais</td><td class="n">{len(DAYS)}</td></tr>
<tr><td>Dias de disciplinas técnicas</td><td class="n">{N_AULAS}</td></tr>
<tr><td>Dias de seminário</td><td class="n">8</td></tr>
<tr><td>Carga horária das disciplinas técnicas</td><td class="n">{TOT_DISC} h</td></tr>
<tr><td>Carga horária dos seminários</td><td class="n">{TOT_SEM} h</td></tr>
<tr><td>Componente teórica</td><td class="n">{T_SUM+24} h ({(T_SUM+24)/TOT_GERAL*100:.0f} %)</td></tr>
<tr><td>Componente prática</td><td class="n">{P_SUM+8} h ({(P_SUM+8)/TOT_GERAL*100:.0f} %)</td></tr>
<tr><td>Horas semanais em semana completa</td><td class="n">8 h (2 dias × 4 h)</td></tr>
</tbody><tfoot><tr><td>Carga horária total do ciclo</td><td class="n">{TOT_GERAL} horas</td></tr></tfoot></table></div>

<div class="callout warn"><h4>Nota sobre referências normativas</h4>
<p>Este programa <strong>não cita legislação, decretos, diplomas ou números de referência normativa</strong>,
por não dispor de fonte verificada para o efeito. As designações de programas nacionais de saúde referidas
nos conteúdos — nomeadamente o programa alargado de vacinação, a prevenção da transmissão vertical e a
abordagem integrada das doenças da infância — são utilizadas como <strong>designações técnicas genéricas</strong>
e os respetivos calendários, esquemas terapêuticos e algoritmos devem ser confirmados e atualizados junto das
normas em vigor emitidas pela autoridade sanitária competente antes do início da formação.</p>
<p>Do mesmo modo, o reconhecimento oficial, a equivalência académica e a certificação profissional decorrente
deste ciclo dependem de acreditação a confirmar junto das entidades competentes, não sendo objeto do presente
documento.</p></div>

<div class="assin">
  <div><b>Prof. Manuel Jorge Weber</b><small>Técnico de Enfermagem · EMC e UEPS</small></div>
  <div><b>Prof. Eduardo David</b><small>Técnico de Enfermagem · SMON e EPSC</small></div>
  <div><b>Coordenação Pedagógica</b><small>Centro de Formação Técnica em Saúde</small></div>
  <div><b>Direção</b><small>Grupo Midas Angola</small></div>
</div>

<footer class="doc">
  <span>MIDAS 26 · Do Zero ao Emprego</span>
  <span>Programa de Formação Técnico-Profissional em Enfermagem · Ciclo de Aprofundamento</span>
  <span>{TOT_GERAL} h · {len(DAYS)} dias letivos</span>
</footer>''')}

</div>"""

SKEL_HEAD = ('<!doctype html>\n<html lang="pt-AO">\n<head>\n<meta charset="utf-8">\n'
 '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
 '<meta name="description" content="Programa completo de Forma\u00e7\u00e3o T\u00e9cnico-Profissional em Enfermagem '
 '\u2014 Grupo Midas Angola. 8 meses, 244 horas, 4 disciplinas t\u00e9cnicas e 8 semin\u00e1rios.">\n'
 '<style>:root{color-scheme:light dark}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n')

if __name__ == "__main__":
    out = documento().replace(
        "<title>Programa de Enfermagem MIDAS 26</title>",
        "<title>Programa de Enfermagem MIDAS 26 \u2014 Grupo Midas Angola</title>\n</head>\n<body>", 1)
    doc = SKEL_HEAD + out + "\n</body>\n</html>\n"
    dest = os.path.normpath(os.path.join(_HERE, "..", "programa-enfermagem-midas26.html"))
    with open(dest, "w", encoding="utf-8") as f:
        f.write(doc)
    print("Escrito:", dest, "-", len(doc), "bytes")
