# Gerador — Programa de Formação Técnico-Profissional em Enfermagem

Gera `docs/formacao/programa-enfermagem-midas26.html`, o documento institucional
completo do Ciclo de Aprofundamento (8 meses, 244 horas).

## Executar

```bash
cd docs/formacao/gerador
python3 build.py           # reescreve ../programa-enfermagem-midas26.html
```

O logótipo é lido de `assets/logo-midas26.png` e embebido como data URI.
Para usar outro ficheiro: `MIDAS_LOGO=/caminho/logo.png python3 build.py`.

## Ficheiros

| Ficheiro | Conteúdo |
|---|---|
| `build_core.py` | Calendário letivo, feriados, interrupção, alternância A/B e cálculo de carga horária |
| `data.py` | Sequência de temas de cada disciplina e dos 8 seminários |
| `sections.py` | Unidades temáticas, objectivos, competências, metodologia, materiais e avaliação |
| `style.py` | Folha de estilos (ecrã, modo escuro e impressão A4) |
| `build.py` | Montagem do documento |

## Alterar o calendário

Em `build_core.py`:

- `START` / `END` — primeiro e último dia do ciclo;
- `FER` — feriados nacionais **a confirmar anualmente** no calendário oficial;
- `REC` — interrupção lectiva de Natal e Ano Novo;
- `MONTHS` — os oito meses do ciclo;
- `SEM_DAY` (em `build_days`) — se o seminário de cada mês cai à terça ou à quinta.

A alternância 180 + 60 segue o ciclo de cinco semanas `A · B · A · B · A`. Alterar
esse ciclo altera a carga horária relativa das disciplinas de cada docente — depois
de mexer, correr `python3 build_core.py` para reconferir os totais.

## Regra importante

O número de sessões em `data.py` tem de coincidir com o número de dias lectivos que
`build_core.py` atribui a cada disciplina. `build_core.py` valida essa correspondência
quando executado directamente e falha com `assert` se houver desencontro.
