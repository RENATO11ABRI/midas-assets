# -*- coding: utf-8 -*-
"""Componentes acrescentadas após as respostas da Direcção (10/09/2026)."""
import datetime as dt

# ---------------------------------------------------------------- SÁBADOS ---
SAB_INI, SAB_FIM = dt.date(2026,12,1), dt.date(2027,6,3)
DIA_TRABALHADOR = dt.date(2027,5,1)
PRE_DEFESAS = [dt.date(2027,1,30), dt.date(2027,2,27), dt.date(2027,3,27),
               dt.date(2027,4,24), dt.date(2027,5,29)]
ENTREGA_TRABALHO = dt.date(2027,5,3)
DEFESA = dt.date(2027,6,3)
RECURSO_DEFESA = dt.date(2027,6,18)

SAB_HORARIO = [("08h00–10h00","1.º tempo","GEN",120),
               ("10h00–10h30","Intervalo","—",30),
               ("10h30–12h30","2.º tempo","GEN",120),
               ("12h30–16h00","Bloco de projecto","PT",210)]

GEN = [  # Gestão de Enfermagem — 24 sessões × 4 h = 96 h
("Apresentação da disciplina; funções de gestão em enfermagem e âmbito do Técnico de Enfermagem","T","I"),
("Organização do serviço de enfermagem: estrutura, cadeia hierárquica e circuitos internos","T","I"),
("Liderança e estilos de chefia; o papel do chefe de equipa de turno","TP","I"),
("Planeamento do trabalho de enfermagem: métodos de distribuição de doentes pela equipa","TP","II"),
("Escalas de serviço: elaboração, rotatividade e cobertura de turnos","P","II"),
("Gestão de faltas, substituições e horas extraordinárias","TP","II"),
("Delegação e supervisão de tarefas: o que se delega e o que nunca se delega","TP","II"),
("Integração e acompanhamento de novos profissionais e de estagiários","TP","II"),
("Gestão de recursos materiais: inventário, requisição e reposição do serviço","P","III"),
("Farmácia do serviço: armazenamento, controlo de estupefacientes e verificação de validades","P","III"),
("Cadeia de frio e gestão de vacinas e de hemoderivados no serviço","P","III"),
("Gestão de resíduos hospitalares e controlo de custos do serviço","TP","III"),
("Qualidade em saúde: conceitos, indicadores e padrões de cuidados de enfermagem","T","IV"),
("Auditoria interna de enfermagem e listas de verificação de serviço","P","IV"),
("Segurança do doente: notificação de incidentes e cultura não punitiva","TP","IV"),
("Prevenção e controlo de infecção na perspectiva da gestão do serviço","TP","IV"),
("Ética e deontologia profissional aplicadas à chefia e à supervisão","T","V"),
("Sigilo profissional, consentimento informado e direitos do doente","T","V"),
("Gestão da informação: registos, estatística do serviço e relatório mensal","P","VI"),
("Actividade do Dia do Trabalhador — o trabalho de enfermagem em Angola: mesa-redonda com professores e formandos","TP","VII"),
("Gestão de conflitos e comunicação institucional","TP","VII"),
("Trabalho em equipa multiprofissional e condução de reuniões de serviço","TP","VII"),
("Empreendedorismo em saúde e projectos de intervenção comunitária","TP","VIII"),
("Inserção profissional: currículo, entrevista e primeiro emprego; avaliação final da disciplina","AVP","VIII"),
]
GEN_UNID = [
("I","Fundamentos da gestão em enfermagem",12,"Funções de gestão e âmbito do Técnico de Enfermagem. Estrutura e circuitos do serviço. Cadeia hierárquica. Liderança, estilos de chefia e o chefe de equipa de turno."),
("II","Gestão de recursos humanos",20,"Métodos de distribuição de doentes. Elaboração de escalas, rotatividade e cobertura de turnos. Faltas, substituições e horas extraordinárias. Delegação e supervisão. Integração de novos profissionais e de estagiários."),
("III","Gestão de recursos materiais",16,"Inventário, requisição e reposição. Farmácia do serviço, estupefacientes e validades. Cadeia de frio, vacinas e hemoderivados. Resíduos hospitalares e controlo de custos."),
("IV","Qualidade e segurança do doente",16,"Indicadores e padrões de cuidados. Auditoria interna e listas de verificação. Notificação de incidentes e cultura não punitiva. Prevenção de infecção na óptica da gestão."),
("V","Ética, deontologia e direitos",8,"Deontologia aplicada à chefia e à supervisão. Sigilo profissional, consentimento informado e direitos do doente."),
("VI","Gestão da informação",4,"Registos, estatística do serviço e elaboração do relatório mensal."),
("VII","Relações de trabalho",12,"Actividade do Dia do Trabalhador. Gestão de conflitos. Comunicação institucional. Equipa multiprofissional e reuniões de serviço."),
("VIII","Empreendedorismo e inserção profissional",8,"Projectos de intervenção comunitária. Currículo, entrevista e primeiro emprego. Avaliação final."),
]

PT = [  # Projecto Tecnológico — 24 sessões × 3,5 h = 84 h
("O trabalho de fim de curso: natureza, tipos, critérios de avaliação e calendário","T","I"),
("Constituição dos grupos, atribuição do tutor e regras de funcionamento","TP","I"),
("Escolha do tema: critérios de relevância, exequibilidade e pertinência clínica","TP","I"),
("Formulação do problema, da pergunta de partida e dos objectivos","TP","II"),
("Pesquisa bibliográfica: fontes, selecção e leitura crítica","P","II"),
("Elaboração do projecto: estrutura do trabalho e cronograma de execução","P","II"),
("1.ª pré-defesa — apresentação do tema, do problema e dos objectivos perante júri","AVP","II"),
("Metodologia: tipo de estudo, população e amostra","T","III"),
("Instrumentos de recolha de dados: questionário, entrevista e grelha de observação","P","III"),
("Ética na investigação: consentimento, anonimato e autorização institucional","T","III"),
("2.ª pré-defesa — apresentação da metodologia e dos instrumentos perante júri","AVP","III"),
("Recolha de dados no terreno: organização, registo e controlo de qualidade","P","IV"),
("Tratamento de dados: tabelas, frequências e percentagens","P","IV"),
("Apresentação de dados: construção e leitura de gráficos","P","IV"),
("3.ª pré-defesa — apresentação dos resultados preliminares perante júri","AVP","IV"),
("Discussão dos resultados: confronto com a literatura consultada","TP","V"),
("Conclusões, limitações do estudo e recomendações","TP","V"),
("Redacção do trabalho: estrutura formal, capa, índice e paginação","P","V"),
("4.ª pré-defesa — apresentação do trabalho completo perante júri","AVP","V"),
("Actividade do Dia do Trabalhador — exposição dos projectos à comunidade escolar","P","VI"),
("Normas de citação e referências bibliográficas; revisão do texto após a entrega","P","VI"),
("Preparação da apresentação oral: estrutura, meios de apoio e distribuição de papéis no grupo","P","VI"),
("Técnicas de apresentação oral e resposta às perguntas do júri","P","VI"),
("Ensaio geral da defesa perante júri simulado","AVP","VI"),
]
PT_UNID = [
("I","Enquadramento do trabalho de fim de curso",10.5,"Natureza, tipos e critérios de avaliação. Calendário. Constituição dos grupos e atribuição do tutor. Escolha do tema."),
("II","Problema, objectivos e projecto",14.0,"Formulação do problema e da pergunta de partida. Objectivos. Pesquisa bibliográfica e leitura crítica. Estrutura e cronograma do projecto. 1.ª pré-defesa."),
("III","Metodologia",14.0,"Tipo de estudo, população e amostra. Instrumentos de recolha de dados. Ética na investigação, consentimento e autorização institucional. 2.ª pré-defesa."),
("IV","Recolha e tratamento de dados",14.0,"Recolha no terreno. Tabelas, frequências e percentagens. Construção e leitura de gráficos. 3.ª pré-defesa."),
("V","Discussão, conclusões e redacção",14.0,"Confronto com a literatura. Conclusões, limitações e recomendações. Estrutura formal do trabalho. 4.ª pré-defesa."),
("VI","Preparação da defesa",17.5,"Exposição dos projectos. Citação e referências. Apresentação oral, meios de apoio e resposta ao júri. Ensaio geral."),
]

# ---------------------------------------------------------------- ESTÁGIOS ---
EST_PRE = dict(
 nome="Estágio preliminar", local="Hospital do Capalanga (Viana)",
 apresentacao=dt.date(2026,9,30), ini=dt.date(2026,10,5), fim=dt.date(2027,1,5),
 duracao="3 meses", dias="Segunda, quarta e sexta-feira e domingo, conforme a escala do hospital",
 horas_dia="10 horas por dia", carga="A fixar pela escala do hospital [a confirmar]",
 supervisor="Edilson de Almeida (supervisão pela escola)",
 tutor="Tutor do serviço a designar pelo hospital [a confirmar]",
 peso="60 % da classificação da componente de estágio", preco=30000,
 inclui="Apenas o estágio. Não inclui seguro, transporte, credencial nem fardamento.",
 seguro="Não é exigido seguro escolar nem de acidentes de trabalho.")
EST_CUR = dict(
 nome="Estágio curricular", local="Hospital do Capalanga, Hospital das Casas Amarelas, Hospital do Prenda e Hospital Wayanga Xito",
 apresentacao=None, ini=dt.date(2027,1,6), fim=dt.date(2027,7,5),
 duracao="6 meses", dias="Conforme a escala de cada unidade hospitalar",
 horas_dia="Conforme a escala de cada unidade hospitalar",
 carga="A fixar pela escala dos hospitais [a confirmar]",
 supervisor="Edilson de Almeida (supervisão pela escola)",
 tutor="Tutor do serviço em cada unidade [a confirmar]",
 peso="40 % da classificação da componente de estágio", preco=60000,
 inclui="Pagamento até à primeira semana de Janeiro de 2027.",
 seguro="Não é exigido seguro escolar nem de acidentes de trabalho.")
EST_DOCS = ["Folha de presenças assinada pelo serviço",
            "Relatório de estágio elaborado pelo formando",
            "Ficha de avaliação preenchida pelo hospital"]

# ---------------------------------------------------------------- DEFESA ---
DEFESA_INFO = dict(
 data=DEFESA, entrega=ENTREGA_TRABALHO, recurso=RECURSO_DEFESA,
 grupo="Grupos de trabalho, com um máximo de 10 elementos por grupo",
 juri="Júri presidido pela escola-mãe, composto por um presidente e três vogais",
 predefesas=PRE_DEFESAS,
 formato="As pré-defesas realizam-se aos sábados, no bloco de projecto, perante júri, a partir de Janeiro de 2027.")

# ------------------------------------------------------------- FINANCEIRO ---
FIN_MOD = [
 ("Confirmação do III.º Módulo", 1600, "Acto único", "No início do módulo"),
 ("Mensalidade", 15000, "9 mensalidades, de Outubro de 2026 a Junho de 2027", "Até ao dia 10 de cada mês"),
 ("Comparticipação para aulas práticas", 10000, "Acto único", "No início do módulo"),
 ("Túnica", 20000, "Acto único", "No início do módulo"),
 ("Estágio preliminar (3 meses)", 30000, "Acto único", "Antes do início do estágio"),
 ("Estágio curricular (6 meses)", 60000, "Acto único", "Até à primeira semana de Janeiro de 2027"),
 ("Tutoria do Projecto Tecnológico", 18000, "Pagamento único ao tutor", "Durante o módulo"),
 ("Manuais de apoio", 10000, "Conjunto completo", "Durante o módulo"),
 ("Declaração para obtenção da licença de aprendizagem", 10000, "Acto único", "Até 10 de Outubro de 2026"),
 ("Termo de frequência", 40000, "Acto único", "Até 30 de Novembro de 2026"),
 ("Declaração de frequência", 8000, "Acto único", "No fim do curso"),
 ("Mesa de júri da defesa", 20000, "Acto único", "Antes da defesa"),
 ("Sala da defesa", 10000, "Acto único", "Antes da defesa"),
 ("Faça", 3000, "Acto único", "Antes da defesa"),
]
FIN_EVENT = [
 ("Multa por atraso no pagamento da mensalidade", 2000, "Por mensalidade em atraso", "A partir do dia 11"),
 ("Recurso por disciplina", 5000, "Por disciplina", "Entre uma semana após as provas e 15 dias após a publicação das pautas"),
 ("Recurso da defesa", 30000, "Acto único", "Quinze dias após a defesa (18/06/2027)"),
]
FIN_FUTURO = [
 ("Confirmação ou renovação de matrícula para o módulo seguinte", 10000, "No início do módulo seguinte"),
 ("Certificado de conclusão do módulo", None, "Valor por definir [a confirmar]"),
 ("Segunda via de documento", None, "Valor por definir [a confirmar]"),
]
FIN_REGRAS = [
 "O pagamento é efectuado exclusivamente por terminal de pagamento automático (TPA).",
 "Não há descontos por pagamento adiantado, por irmãos nem por antiguidade.",
 "A mensalidade vence-se até ao dia 10 de cada mês; a partir do dia 11 acresce a multa de 2.000 Kz.",
 "O formando com mensalidades em atraso não é admitido à defesa de fim de curso.",
 "Os documentos e as declarações só são emitidos a formandos com a situação de propinas regularizada.",
]
