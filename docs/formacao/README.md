# Formação — Centro de Formação Técnica em Saúde

## Enfermagem Geral — III.º Módulo — turma NOV-A

Programa em vigor. Ciclo de **15/09/2026 a 13/05/2027**, com defesa de fim de curso
a **03/06/2027**. Carga global de **428 horas**.

| Componente | Quando | Carga |
|---|---|---:|
| Quatro disciplinas técnicas | Terças e quintas, 08h00–12h15 | 216 h |
| Oito seminários complementares | Um por mês | 32 h |
| Gestão de Enfermagem e Projecto Tecnológico | Todos os sábados, 08h00–16h00 | 180 h |
| **Total** | | **428 h** |

Fora desta contagem: estágio preliminar (05/10/2026 a 05/01/2027) e estágio
curricular (06/01 a 05/07/2027), cuja carga depende da escala dos hospitais.

### Ficheiros

- `enfermagem-geral-nov-a/Programa-Enfermagem-Geral-III-Modulo-NOV-A.docx` — programa
  completo em 21 secções, com calendário lectivo de 10 meses em A4 horizontal, anexos
  com listas de verificação e condições financeiras
- `enfermagem-geral-nov-a/Cronograma-Enfermagem-Geral-III-Modulo-NOV-A.xlsx` — seis
  folhas: Cronograma, Verificação por fórmulas, Seminários, Sábados, Estágios e defesa,
  e Financeiro
- `enfermagem-geral-nov-a/gerador/` — recalcula ambos a partir de uma fonte única

### Regenerar

```bash
cd enfermagem-geral-nov-a/gerador
npm install docx && pip install openpyxl   # apenas na primeira vez
python3 export.py && node build_docx.js && python3 build_xlsx.py
```

Os dois ficheiros são reescritos na pasta acima. `export.py` é a fonte única: o Word e
o Excel lêem ambos o `dados.json` que ele produz, pelo que os totais não podem divergir.

## Histórico

O **Ciclo de Aprofundamento** (06/10/2026 a 27/05/2027, 244 h, em HTML) foi a primeira
versão deste trabalho e foi **substituído** pelo programa acima por decisão da Direcção.
Mantém-se no histórico do repositório e pode ser recuperado a partir do commit anterior
à sua remoção.
