# -*- coding: utf-8 -*-
import json, datetime as dt
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo

d=json.load(open("dados.json",encoding="utf-8"))
M=d["meta"]; ORD=d["ordem"]
NAVY="FF0F3A63"; NAVY2="FF1B4E7F"; GREEN="FF0B7A20"; ZEBRA="FFF2F6F9"; BOX="FFEEF3F7"
COR={"EMC":"FFDCE9F5","UEPS":"FFF7E0DA","SMON":"FFEEDFF2","EPSC":"FFDFF0E2","SEM":"FFFFF0CC","—":"FFF5F5F5"}
thin=Side(style="thin",color="FFB7C4CF")
BD=Border(left=thin,right=thin,top=thin,bottom=thin)

def head(ws,labels,row=1,widths=None):
    for j,l in enumerate(labels,1):
        c=ws.cell(row=row,column=j,value=l)
        c.font=Font(name="Calibri",bold=True,size=10,color="FFFFFFFF")
        c.fill=PatternFill("solid",start_color=NAVY); c.alignment=Alignment(vertical="center",wrap_text=True)
        c.border=BD
    ws.row_dimensions[row].height=30
    if widths:
        for j,w in enumerate(widths,1): ws.column_dimensions[get_column_letter(j)].width=w

MESES=[(dt.date.fromisoformat(x["ini"][6:10]+"-"+x["ini"][3:5]+"-"+x["ini"][0:2]),
        dt.date.fromisoformat(x["fim"][6:10]+"-"+x["fim"][3:5]+"-"+x["fim"][0:2])) for x in d["meses"]]
def mes_de(ds):
    dd=dt.date(int(ds[6:10]),int(ds[3:5]),int(ds[0:2]))
    for i,(a,b) in enumerate(MESES,1):
        if a<=dd<=b: return i
    return 0

wb=Workbook(); ws=wb.active; ws.title="Cronograma"
ws.merge_cells("A1:L1")
t=ws["A1"]; t.value=(f"Cronograma detalhado — {M['curso']}, {M['modulo']}, turma {M['turma']}, "
                     f"Unidade do {M['unidade']}, ano lectivo {M['ano']}  ·  {M['horas_total']} horas")
t.font=Font(name="Cambria",bold=True,size=13,color=NAVY); ws.row_dimensions[1].height=24
head(ws,["N.º","Data","Dia","Mês","Horário","Tempo lectivo","Disciplina","Unidade temática",
         "Tema da sessão","Professor","Tipo","Duração (min)"],row=2,
     widths=[6,11,14,6,13,20,11,34,62,24,11,13])
r=3
for b in d["blocos"]:
    n,data,dia,hor,tp,disc,uni,tema,prof,tipo,dur=b
    vals=[n,data,dia,mes_de(data),hor,tp,disc,uni,tema,prof,tipo,dur]
    for j,v in enumerate(vals,1):
        c=ws.cell(row=r,column=j,value=v); c.border=BD
        c.font=Font(name="Calibri",size=9.5)
        c.alignment=Alignment(vertical="top",wrap_text=(j in (8,9)),
                              horizontal="center" if j in (1,4,11,12) else "left")
        if j==7: c.font=Font(name="Calibri",size=9.5,bold=True)
        if disc in COR: c.fill=PatternFill("solid",start_color=COR[disc])
        elif r%2==0: c.fill=PatternFill("solid",start_color=ZEBRA)
    r+=1
LAST=r-1
ws.freeze_panes="A3"
ws.auto_filter.ref=f"A2:L{LAST}"
ws.sheet_view.zoomScale=90

# ---------------- FOLHA DE VERIFICAÇÃO ----------------
v=wb.create_sheet("Verificação")
v.column_dimensions["A"].width=42
for col in "BCDEFGHIJ": v.column_dimensions[col].width=13
def titulo(row,txt,span=6):
    v.merge_cells(start_row=row,start_column=1,end_row=row,end_column=span)
    c=v.cell(row=row,column=1,value=txt)
    c.font=Font(name="Cambria",bold=True,size=12,color="FFFFFFFF")
    c.fill=PatternFill("solid",start_color=NAVY2); c.alignment=Alignment(vertical="center")
    v.row_dimensions[row].height=20
def lbl(row,col,txt,b=False,fill=None):
    c=v.cell(row=row,column=col,value=txt); c.border=BD
    c.font=Font(name="Calibri",size=10,bold=b)
    if fill: c.fill=PatternFill("solid",start_color=fill)
    return c
def frm(row,col,f,b=False,fill=None,fmt='0.0'):
    c=v.cell(row=row,column=col,value=f); c.border=BD; c.number_format=fmt
    c.font=Font(name="Calibri",size=10,bold=b); c.alignment=Alignment(horizontal="center")
    if fill: c.fill=PatternFill("solid",start_color=fill)
    return c
C=f"Cronograma!$G$3:$G${LAST}"      # Disciplina
DU=f"Cronograma!$L$3:$L${LAST}"     # Duração
ME=f"Cronograma!$D$3:$D${LAST}"     # Mês
TI=f"Cronograma!$K$3:$K${LAST}"     # Tipo

v["A1"]=f"Folha de verificação — todos os valores são calculados por fórmula a partir da folha «Cronograma»"
v["A1"].font=Font(name="Cambria",bold=True,size=13,color=NAVY)
v.merge_cells("A1:J1")

titulo(3,"1 · Horas por disciplina",7)
lbl(4,1,"Disciplina",True,BOX); lbl(4,2,"Minutos",True,BOX); lbl(4,3,"Horas",True,BOX)
lbl(4,4,"Teórica",True,BOX); lbl(4,5,"Prática",True,BOX); lbl(4,6,"% prática",True,BOX); lbl(4,7,"Mínimo",True,BOX)
MIN={"EMC":50,"UEPS":60,"SMON":50,"EPSC":50}
row=5
for k in ORD+["SEM"]:
    lbl(row,1,k,True)
    frm(row,2,f'=SUMIF({C},"{k}",{DU})',fmt='0')
    frm(row,3,f"=B{row}/60")
    frm(row,4,f'=(SUMIFS({DU},{C},"{k}",{TI},"T")+SUMIFS({DU},{C},"{k}",{TI},"TP")+SUMIFS({DU},{C},"{k}",{TI},"Avaliação escrita"))/60')
    frm(row,5,f"=C{row}-D{row}")
    frm(row,6,f"=E{row}/C{row}",fmt='0.0%')
    if k in MIN: frm(row,7,MIN[k]/100,fmt='0%')
    else: lbl(row,7,"—")
    row+=1
lbl(row,1,"TOTAL",True,BOX)
for col,f in [(2,f"=SUM(B5:B{row-1})"),(3,f"=SUM(C5:C{row-1})"),(4,f"=SUM(D5:D{row-1})"),(5,f"=SUM(E5:E{row-1})")]:
    frm(row,col,f,True,BOX,fmt='0' if col==2 else '0.0')
frm(row,6,f"=E{row}/C{row}",True,BOX,fmt='0.0%')
TOTROW=row
row+=2
lbl(row,1,"Verificação do total do ciclo",True)
frm(row,3,f'=IF(C{TOTROW}={M["horas_total"]},"CONFERE","DIVERGE")',True,fill="FFDFF0E2",fmt='General')
lbl(row,4,f"esperado: {M['horas_total']} h")
row+=1
lbl(row,1,"Verificação dos mínimos de componente prática",True)
frm(row,3,f'=IF(AND(F5>=G5,F6>=G6,F7>=G7,F8>=G8),"CUMPRE","NÃO CUMPRE")',True,fill="FFDFF0E2",fmt='General')

row+=3
titulo(row,"2 · Horas por mês e por disciplina",7)
row+=1
lbl(row,1,"Mês",True,BOX)
for j,k in enumerate(ORD+["SEM"],2): lbl(row,j,k,True,BOX)
lbl(row,7,"Total",True,BOX)
first=row+1
for m in range(1,9):
    row+=1
    lbl(row,1,f"Mês {m} ({d['meses'][m-1]['ini']} – {d['meses'][m-1]['fim']})")
    for j,k in enumerate(ORD+["SEM"],2):
        frm(row,j,f'=SUMIFS({DU},{C},"{k}",{ME},{m})/60')
    frm(row,7,f"=SUM(B{row}:F{row})",True)
row+=1
lbl(row,1,"TOTAL",True,BOX)
for j in range(2,8): frm(row,j,f"=SUM({get_column_letter(j)}{first}:{get_column_letter(j)}{row-1})",True,BOX)
row+=1
lbl(row,1,"Presença das 4 disciplinas em todos os 8 meses",True)
frm(row,2,f'=IF(COUNTIF(B{first}:E{row-2},0)=0,"SIM","NÃO")',True,fill="FFDFF0E2",fmt='General')

row+=3
titulo(row,"3 · Horas por tipo de sessão",5)
row+=1
lbl(row,1,"Tipo",True,BOX); lbl(row,2,"Minutos",True,BOX); lbl(row,3,"Horas",True,BOX); lbl(row,4,"% do ciclo",True,BOX)
ft=row+1
for cod,nome in [("T","Teórica"),("TP","Teórico-prática"),("P","Prática"),("Avaliação escrita","Avaliação escrita"),("Avaliação prática","Avaliação prática")]:
    row+=1
    lbl(row,1,f"{cod} — {nome}",True)
    frm(row,2,f'=SUMIF({TI},"{cod}",{DU})',fmt='0')
    frm(row,3,f"=B{row}/60")
    frm(row,4,f"=C{row}/{M['horas_total']}",fmt='0.0%')
row+=1
lbl(row,1,"Intervalos (não contam como formação)",True)
frm(row,2,f'=SUMIF({TI},"—",{DU})',fmt='0'); frm(row,3,f"=B{row}/60"); lbl(row,4,"—")
row+=1
lbl(row,1,"TOTAL de formação efectiva",True,BOX)
frm(row,2,f"=SUM(B{ft}:B{row-2})",True,BOX,fmt='0')
frm(row,3,f"=C{ft}+C{ft+1}+C{ft+2}+C{ft+3}+C{ft+4}",True,BOX)
frm(row,4,f"=C{row}/{M['horas_total']}",True,BOX,fmt='0.0%')

row+=3
titulo(row,"4 · Contagem de dias",4)
row+=1
nFer=len([f for f in d["feriados"] if f["efeito"]=="Dia de aula suprimido"])
for txt,val in [("Terças e quintas-feiras brutas",M["dias_uteis"]+nFer+4),
                ("Menos: feriados em dia de aula",-nFer),
                ("Menos: interrupção lectiva",-4),
                ("Dias lectivos úteis",M["dias_uteis"]),
                ("Menos: dias de seminário",-8),
                ("Dias de disciplinas",M["dias_disc"])]:
    lbl(row,1,txt,txt.startswith("Dias")); frm(row,2,val,txt.startswith("Dias"),fmt='0'); row+=1
lbl(row,1,"Blocos registados no cronograma",True)
frm(row,2,f"=COUNTA(Cronograma!A3:A{LAST})",True,fmt='0')
lbl(row,3,f"esperado: {M['dias_uteis']*4}")
row+=1
lbl(row,1,"Verificação de blocos",True)
frm(row,2,f'=IF(B{row-1}={M["dias_uteis"]*4},"CONFERE","DIVERGE")',True,fill="FFDFF0E2",fmt='General')
v.freeze_panes="A2"; v.sheet_view.zoomScale=100

# ---------------- SEMINÁRIOS ----------------
s=wb.create_sheet("Seminários")
head(s,["N.º","Data","Dia","Mês","Área","Tema","Duração (h)","Formador"],row=1,
     widths=[6,12,15,6,22,58,12,30])
for i,x in enumerate(d["seminarios"],2):
    for j,val in enumerate([x["n"],x["data"],x["dia"],x["mes"],x["area"],x["tema"],4,
                            "Formador(a) convidado(a) [a designar]"],1):
        c=s.cell(row=i,column=j,value=val); c.border=BD; c.font=Font(name="Calibri",size=10)
        c.alignment=Alignment(vertical="top",wrap_text=(j==6),
                              horizontal="center" if j in (1,4,7) else "left")
        c.fill=PatternFill("solid",start_color=COR["SEM"] if i%2 else "FFFFFFFF")
s.cell(row=10,column=6,value="Total").font=Font(bold=True)
s.cell(row=10,column=7,value="=SUM(G2:G9)").font=Font(bold=True)
s.freeze_panes="A2"


# ---------------- SÁBADOS ----------------
SB=d["sabados"]
sb=wb.create_sheet("Sábados")
sb.merge_cells("A1:I1")
c=sb["A1"]; c.value=(f"Gestão de Enfermagem e Projecto Tecnológico — {SB['n']} sábados, "
                     f"{SB['ini']} a {SB['fim']}, {SB['horas']:.0f} h · {SB['prof']}")
c.font=Font(name="Cambria",bold=True,size=13,color=NAVY); sb.row_dimensions[1].height=24
head(sb,["N.º","Data","Dia","Horário","Bloco","Disciplina","Unidade temática","Tema da sessão","Tipo","Duração (min)"],
     row=2,widths=[6,11,10,13,18,11,34,62,16,13])
COR2={"GEN":"FFE4DDF4","PT":"FFDDEAF4","—":"FFF5F5F5"}
r=3
for b in SB["blocos"]:
    n,data,dia,hor,tp,disc,uni,tema,prof,tipo,dur=b
    for j,v in enumerate([n,data,dia,hor,tp,disc,uni,tema,tipo,dur],1):
        cc=sb.cell(row=r,column=j,value=v); cc.border=BD; cc.font=Font(name="Calibri",size=9.5)
        cc.alignment=Alignment(vertical="top",wrap_text=(j in (7,8)),
                               horizontal="center" if j in (1,9,10) else "left")
        if j==6: cc.font=Font(name="Calibri",size=9.5,bold=True)
        cc.fill=PatternFill("solid",start_color=COR2.get(disc,"FFFFFFFF"))
    r+=1
SB_LAST=r-1
sb.freeze_panes="A3"; sb.auto_filter.ref=f"A2:J{SB_LAST}"
CS=f"Sábados!$F$3:$F${SB_LAST}"; DS=f"Sábados!$J$3:$J${SB_LAST}"; TS=f"Sábados!$I$3:$I${SB_LAST}"
sb.cell(row=SB_LAST+2,column=6,value="GEN").font=Font(bold=True)
sb.cell(row=SB_LAST+2,column=8,value=f'=SUMIF({CS},"GEN",{DS})/60').number_format='0.0'
sb.cell(row=SB_LAST+3,column=6,value="PT").font=Font(bold=True)
sb.cell(row=SB_LAST+3,column=8,value=f'=SUMIF({CS},"PT",{DS})/60').number_format='0.0'
sb.cell(row=SB_LAST+4,column=6,value="TOTAL").font=Font(bold=True)
sb.cell(row=SB_LAST+4,column=8,value=f"=H{SB_LAST+2}+H{SB_LAST+3}").font=Font(bold=True)
sb.cell(row=SB_LAST+4,column=8).number_format='0.0'

# ---------------- ESTÁGIOS E DEFESA ----------------
es=wb.create_sheet("Estágios e defesa")
es.column_dimensions["A"].width=28
for col in "BC": es.column_dimensions[col].width=46
es["A1"]="Estágios, pré-defesas e defesa de fim de curso"
es["A1"].font=Font(name="Cambria",bold=True,size=13,color=NAVY); es.merge_cells("A1:C1")
campos=[("Designação","nome"),("Local","local"),("Apresentação","apresentacao"),("Início","ini"),
        ("Termo","fim"),("Duração","duracao"),("Dias","dias"),("Horas por dia","horas_dia"),
        ("Carga horária","carga"),("Supervisão pela escola","supervisor"),("Tutoria no serviço","tutor"),
        ("Peso na avaliação","peso"),("Custo (Kz)","preco")]
r=3
lbl_ = lambda row,col,txt,b=False,fill=None: (lambda cc: (setattr(cc,'border',BD),
        setattr(cc,'font',Font(name="Calibri",size=10,bold=b)),
        setattr(cc,'alignment',Alignment(vertical="top",wrap_text=True)),
        cc.__setattr__('fill',PatternFill("solid",start_color=fill)) if fill else None, cc)[-1])(es.cell(row=row,column=col,value=txt))
lbl_(r,1,"Campo",True,BOX); lbl_(r,2,"Estágio preliminar",True,BOX); lbl_(r,3,"Estágio curricular",True,BOX); r+=1
for nome,chave in campos:
    lbl_(r,1,nome,True)
    lbl_(r,2,d["estagios"][0][chave] if d["estagios"][0][chave] is not None else "—")
    lbl_(r,3,d["estagios"][1][chave] if d["estagios"][1][chave] is not None else "—")
    r+=1
r+=1
lbl_(r,1,"Documentos a entregar",True,BOX); lbl_(r,2,"; ".join(d["estagio_docs"]),False,BOX); r+=2
lbl_(r,1,"Momento",True,BOX); lbl_(r,2,"Data",True,BOX); lbl_(r,3,"Observações",True,BOX); r+=1
for i,x in enumerate(d["defesa"]["predefesas"],1):
    lbl_(r,1,f"{i}.ª pré-defesa",True); lbl_(r,2,x); lbl_(r,3,"Sábado, no bloco de projecto"); r+=1
for nome,val,obs in [("Entrega do trabalho",d["defesa"]["entrega"],"Um mês antes da defesa"),
                     ("Defesa de fim de curso",d["defesa"]["data"],d["defesa"]["juri"]),
                     ("Recurso da defesa",d["defesa"]["recurso"],"Quinze dias após a defesa")]:
    lbl_(r,1,nome,True); lbl_(r,2,val); lbl_(r,3,obs); r+=1

# ---------------- FINANCEIRO ----------------
FI=d["financeiro"]
fi=wb.create_sheet("Financeiro")
fi.column_dimensions["A"].width=46
for col,wd in [("B",14),("C",34),("D",34)]: fi.column_dimensions[col].width=wd
fi["A1"]=f"Condições financeiras — turma {M['turma']}, {M['modulo']}, {M['ano']} (valores em kwanzas)"
fi["A1"].font=Font(name="Cambria",bold=True,size=13,color=NAVY); fi.merge_cells("A1:D1")
r=3
def sec_fin(r,txt):
    fi.merge_cells(start_row=r,start_column=1,end_row=r,end_column=4)
    cc=fi.cell(row=r,column=1,value=txt)
    cc.font=Font(name="Cambria",bold=True,size=11,color="FFFFFFFF")
    cc.fill=PatternFill("solid",start_color=NAVY2); return r+1
r=sec_fin(r,"Encargos do módulo")
lbl_(r,1,"Encargo",True,BOX); lbl_(r,2,"Valor",True,BOX); lbl_(r,3,"Regime",True,BOX); lbl_(r,4,"Prazo",True,BOX); r+=1
first_fin=r
for x in FI["modulo"]:
    lbl_(r,1,x["item"],True)
    cc=fi.cell(row=r,column=2,value=x["valor"]); cc.border=BD; cc.number_format='#,##0'
    cc.font=Font(name="Calibri",size=10); cc.alignment=Alignment(horizontal="right")
    lbl_(r,3,x["nota"]); lbl_(r,4,x["quando"]); r+=1
lbl_(r,1,"Total do módulo por formando",True,BOX)
cc=fi.cell(row=r,column=2,value=f"=SUM(B{first_fin}:B{r-1})+B{first_fin+1}*8")
cc.border=BD; cc.number_format='#,##0'; cc.font=Font(name="Calibri",size=10,bold=True)
cc.alignment=Alignment(horizontal="right"); cc.fill=PatternFill("solid",start_color=BOX)
lbl_(r,3,f"a mensalidade conta {FI['mensalidades']} vezes",False,BOX)
lbl_(r,4,f"conferência: {FI['total_modulo']:,} Kz".replace(",","."),False,BOX); r+=2
r=sec_fin(r,"Encargos eventuais")
lbl_(r,1,"Encargo",True,BOX); lbl_(r,2,"Valor",True,BOX); lbl_(r,3,"Regime",True,BOX); lbl_(r,4,"Quando se aplica",True,BOX); r+=1
for x in FI["eventual"]:
    lbl_(r,1,x["item"],True)
    cc=fi.cell(row=r,column=2,value=x["valor"]); cc.border=BD; cc.number_format='#,##0'
    cc.font=Font(name="Calibri",size=10); cc.alignment=Alignment(horizontal="right")
    lbl_(r,3,x["nota"]); lbl_(r,4,x["quando"]); r+=1
r+=1
r=sec_fin(r,"Encargos posteriores e valores por definir")
lbl_(r,1,"Encargo",True,BOX); lbl_(r,2,"Valor",True,BOX); lbl_(r,3,"Observações",True,BOX); r+=1
for x in FI["futuro"]:
    lbl_(r,1,x["item"],True)
    if x["valor"] is None: lbl_(r,2,"a definir")
    else:
        cc=fi.cell(row=r,column=2,value=x["valor"]); cc.border=BD; cc.number_format='#,##0'
        cc.font=Font(name="Calibri",size=10); cc.alignment=Alignment(horizontal="right")
    lbl_(r,3,x["quando"]); r+=1
r+=1
r=sec_fin(r,"Regras de pagamento")
for x in FI["regras"]:
    lbl_(r,1,x); fi.merge_cells(start_row=r,start_column=1,end_row=r,end_column=4); r+=1
fi.freeze_panes="A2"

wb.save("Cronograma-Enfermagem-Geral-III-Modulo-NOV-A.xlsx")
print("XLSX escrito ·", LAST-2, "blocos ·", SB_LAST-2, "blocos de sábado ·", len(d["seminarios"]), "seminários ·", len(wb.sheetnames), "folhas")
