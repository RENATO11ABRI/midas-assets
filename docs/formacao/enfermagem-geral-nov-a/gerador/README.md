# Gerador — Programa de Enfermagem Geral, III.º Módulo, turma NOV-A

Produz os dois entregáveis do ciclo de 8 meses (15/09/2026 – 13/05/2027, 248 horas):

- `../Programa-Enfermagem-Geral-III-Modulo-NOV-A.docx`
- `../Cronograma-Enfermagem-Geral-III-Modulo-NOV-A.xlsx`

## Executar

```bash
cd docs/formacao/enfermagem-geral-nov-a/gerador
npm install docx          # apenas na primeira vez
pip install openpyxl      # apenas na primeira vez
python3 export.py         # calcula tudo e escreve dados.json
node build_docx.js        # escreve o .docx na pasta acima
python3 build_xlsx.py     # escreve o .xlsx na pasta acima
```

Ambos os ficheiros são escritos em `docs/formacao/enfermagem-geral-nov-a/`, não na
pasta do gerador. O logótipo da capa é lido de `assets/logo-midas26.png`; para usar
outro ficheiro, defina `MIDAS_LOGO`.

`export.py` é a **fonte única**: o Word e o Excel lêem ambos o `dados.json` que ele
produz, pelo que os totais não podem divergir entre os dois ficheiros.

## Ficheiros

| Ficheiro | Conteúdo |
|---|---|
| `core.py` | Calendário lectivo, feriados, interrupção, meses pedagógicos, seminários e ciclo de rotação A/B |
| `temas.py` | Os 108 temas de sessão, um por sessão de cada disciplina, com o tipo (T, TP, P, AVE, AVP) |
| `conteudo.py` | Unidades temáticas com conteúdos, e as 20 listas de verificação do Anexo A |
| `prog.py` | Fundamentação, objectivos, competências, metodologia, materiais e resultados de cada disciplina |
| `export.py` | Calcula cargas e blocos e escreve `dados.json` |
| `build_docx.js` | Monta o documento Word (3 secções: retrato, calendário em paisagem, retrato) |
| `extras.py` | Componente de sábado (GEN e PT), estágios, defesas e condições financeiras |
| `build_xlsx.py` | Monta o livro Excel (Cronograma, Verificação, Seminários, Sábados, Estágios e defesa, Financeiro) |

## Convenções de cálculo

**Rotação 180/60.** Os 240 minutos efectivos do dia não se dividem em dois blocos
iguais de 90 minutos por disciplina. Mantendo o tempo lectivo de 90 minutos, uma
disciplina ocupa o 1.º e o 2.º tempos (180 min) e a outra o bloco complementar (60 min).
Às terças o ciclo é de cinco semanas `A-A-B-A-B` (EMC 54,6 % / UEPS 45,4 %); às quintas
é a alternância simples `A-B` (SMON 50,9 % / EPSC 49,1 %).

**Componente teórica e prática.** Contam para a teórica os blocos T, os TP (exposição
e demonstração) e os de avaliação escrita; contam para a prática os blocos de treino
prático e os de avaliação prática. É uma convenção conservadora e é aplicada de forma
idêntica no Word e nas fórmulas do Excel.

## Alterar o calendário

Em `core.py`: `INI`/`FIM`, `FER` (feriados — **a confirmar anualmente** no calendário
oficial), `REC` (interrupção lectiva), `LIM` (os oito meses pedagógicos) e `SEM_DIA`
(se o seminário de cada mês cai à terça ou à quinta).

O número de temas em `temas.py` tem de coincidir com o número de sessões que
`core.py` atribui a cada disciplina. `export.py` valida essa correspondência e falha
com `assert` se houver desencontro, tal como valida os mínimos de componente prática
(EMC 50 %, UEPS 60 %, SMON 50 %, EPSC 50 %) e o total de 248 horas.

## Portal dos estudantes

`python3 build_portal.py` monta `../portal-nov-a.html` — o portal que os estudantes
usam no telemóvel ou no computador — a partir do mesmo `dados.json`. Os ficheiros
fonte estão em `portal/` (`css.html` e `app.html`) e `portal_data.py` prepara o
objecto de dados que a página embebe.

O portal é publicado como Artifact em claude.ai, onde tem o mural de avisos e as
dúvidas em directo. A cópia neste repositório funciona em qualquer servidor estático
— o progresso pessoal fica no aparelho do estudante — mas sem o mural em directo.
