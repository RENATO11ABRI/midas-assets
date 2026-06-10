# Handoff: Redesign Turmas Midas 2026 — Sistema de Design Premium

> Para: **Claude Code** · Projeto: `midas-assets` (Grupo Midas Angola)
> Objetivo: aplicar um novo sistema de design premium (estilo Linear / Stripe / Supabase) à aplicação existente, **sem alterar a lógica de negócio**.

---

## 1. Visão geral

O **Turmas Midas 2026** é um sistema de gestão académica e financeira (matrículas, cursos,
pagamentos, recibos, relatórios) construído em **HTML + CSS + JavaScript vanilla**, sem build,
com dados em `localStorage` e backend opcional Supabase.

Este pacote contém um **redesign visual completo** do sistema: novos tokens de cor/tipografia/espaçamento,
componentes refeitos (KPIs, tabelas, formulários, documentos) e **3 paletas comutáveis** com modo Dia/Noite.

A filosofia é *restraint premium*: hairlines em vez de sombras pesadas, espaço em vez de cor,
acento disciplinado. Elimina gradientes, brilhos e o ar institucional do verde+dourado original.

## 2. Sobre os ficheiros deste pacote

Os ficheiros aqui são uma **referência de design criada em HTML/CSS/JS** — um protótipo que mostra
o aspeto e comportamento pretendidos. **A app real já usa exatamente a mesma stack** (HTML/CSS/JS vanilla,
classes CSS, sem framework), por isso o handoff é quase direto: o ficheiro `css/midas-ds.css` foi escrito
para **substituir o atual `css/styles.css`**, mantendo toda a estrutura de `js/views.js`, `js/components.js`, etc.

> Recriar a UI no ambiente existente do repositório — **não** introduzir React/Vue nem um build novo.
> A app é deliberadamente "sem instalação"; mantém isso.

| Ficheiro | O que é | Como usar |
|---|---|---|
| `css/midas-ds.css` | **O artefacto principal.** Sistema de design completo + 3 paletas + modo Dia/Noite. | Substitui `css/styles.css` (ver §6 para o mapa de classes). |
| `reference/Midas 2026 Redesign.html` | Shell de referência (sidebar + topbar + router). | Referência de estrutura do `index.html`. |
| `reference/prototype.js` | Render de referência dos ecrãs + lógica de aparência/paletas. | Referência de markup e da feature "Aparência". |
| `assets/logo.svg` | Logótipo Midas (inalterado). | Já existe no repo. |

## 3. Fidelidade

**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamento e estados finais. Recriar fielmente.
Os textos de exemplo (nomes de estudantes, valores) são *placeholder* — os dados reais vêm de `js/data.js` / Supabase.

---

## 4. Design Tokens

Todos definidos como CSS custom properties em `:root` no topo de `css/midas-ds.css`. **Usar sempre os tokens**, nunca hex soltos.

### Neutros (paleta Slate, modo Dia — default)
| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#f8fafc` | Fundo da app |
| `--panel` | `#ffffff` | Cartões, superfícies |
| `--panel-2` / `--panel-3` | `#f8fafc` / `#f1f5f9` | Superfícies sutis / hover |
| `--ink` | `#0f172a` | Texto principal |
| `--ink-2` | `#334155` | Texto secundário (labels) |
| `--muted` | `#64748b` | Texto auxiliar |
| `--soft` | `#94a3b8` | Texto ténue, placeholders |
| `--line` | `#e2e8f0` | Bordas (hairline) |
| `--line-strong` | `#cbd5e1` | Bordas em hover |

### Marca / acento (Slate + Turquesa)
| Token | Valor | Uso |
|---|---|---|
| `--primary` | `#0f172a` | **Fundo do botão primário** |
| `--accent` / `--accent-600` | `#14b8a6` | Destaque: ícones KPI, gráficos, nav ativo, focus |
| `--accent-500` | `#2dd4bf` | Hover / variação clara |
| `--accent-50` / `--accent-100` | `#e6faf6` / `#c7f2eb` | Tints (fundo de KPI icon, nav ativo, focus ring) |

### Estado
| Token | Valor |
|---|---|
| `--ok` / `--ok-bg` | `#16a34a` / `#e7f7ec` |
| `--warn` / `--warn-bg` | `#b45309` / `#fbf0dd` |
| `--danger` / `--danger-bg` | `#dc2626` / `#fbe7e7` |
| `--info` / `--info-bg` | `#2563eb` / `#e8effd` |

### Raios / sombras / tipografia
| Token | Valor |
|---|---|
| `--r-card` / `--r` / `--r-sm` / `--r-pill` | `12px` / `9px` / `7px` / `999px` |
| `--shadow-xs` | `0 1px 2px rgba(16,32,24,.05)` |
| `--shadow-sm` | `0 1px 2px rgba(16,32,24,.05), 0 1px 3px rgba(16,32,24,.05)` |
| `--shadow-md` | `0 8px 24px -10px rgba(12,40,28,.22), 0 2px 6px rgba(12,40,28,.06)` |
| `--shadow-lg` | `0 24px 60px -18px rgba(8,32,22,.32)` |
| `--font` | `"Inter", "SF Pro Text", "Segoe UI", system-ui, …` |
| `--sidebar-w` | `264px` |
| `--gut` | `28px` (gutter de conteúdo; `20px` em densidade compacta) |

### Escala tipográfica (efetiva)
| Elemento | Tamanho / peso |
|---|---|
| Título de página (`.page-head h1`) | 22px / 700, `letter-spacing: -.025em` |
| Valor KPI (`.kpi .k-val`) | 27px / 700, `-.03em`, `tabular-nums` |
| Título de cartão (`.card-head h3`) | 14.5px / 650 |
| Corpo (`body`) | 14px / 1.5, `-.006em` |
| Label de formulário | 12.5px / 600 |
| Auxiliar / cabeçalho de tabela | 11px / 600, `uppercase`, `letter-spacing: .06em` |

> Números monetários e contadores usam `.num` → `font-variant-numeric: tabular-nums`.

---

## 5. Paletas comutáveis (feature "Aparência")

O sistema suporta **3 paletas** + **Dia/Noite** + **sidebar escura/clara** + **densidade**, todas via atributos no `<html>`:

```html
<html data-theme="light" data-palette="slate" data-sidebar="executive" data-density="comfortable">
```

| Atributo | Valores | Default |
|---|---|---|
| `data-palette` | `slate` · `supabase` · `midas` | `slate` |
| `data-theme` | `light` · `dark` | `light` |
| `data-sidebar` | `executive` (escura) · `light` (clara) | `executive` |
| `data-density` | `comfortable` · `compact` | `comfortable` |

Cada paleta redefine os tokens (ver blocos `[data-palette="…"]` no fim do CSS). Resumo das identidades:

- **slate** — petróleo `#0f172a` + turquesa `#14b8a6` (ERP moderno).
- **supabase** — cinza neutro + esmeralda `#3ecf8e` (lindo no escuro).
- **midas** — verde executivo `#0f6243` + dourado `#bd9442` (identidade original).

> No modo `dark`, o botão primário passa a usar o acento (turquesa/esmeralda) porque o slate-900 ficaria invisível.

### Persistência (a implementar no repo real)
A página de **Configurações → Aparência** e o atalho na topbar gravam em `localStorage`:
`midas_palette`, `midas_theme`, `midas_sidebar`, `midas_density`. No arranque, lê-se cada chave e aplica-se
o atributo correspondente em `document.documentElement`. Ver a secção "Aparência" em `reference/prototype.js`
(função `boot()` → `syncAppearance` + listeners delegados em `[data-pal] / [data-theme-set] / [data-side-set] / [data-dens-set]`).

> O repo já tem um `body.dark` e um botão "Alternar Modo Dia/Noite". **Migrar** isso para `data-theme` no `<html>`
> e ligar o botão existente ao novo sistema. A página "Configurações" já existe em `js/views.js` → adicionar lá a secção "Aparência".

---

## 6. Mapa de migração de classes (antigo → novo)

A app atual e este design partilham muita nomenclatura. Principais alterações em `js/views.js` / `js/components.js` / `index.html`:

| Antigo (`styles.css`) | Novo (`midas-ds.css`) | Nota |
|---|---|---|
| `#app` | `.app` | wrapper |
| `.sidebar-brand` | `.side-brand` + `.bt` no texto | logo 34px, raio 9px |
| `.nav-link` (igual) | `.nav-link` | ativo agora a `.active` (sem `::before` dourado fixo — usa `--side-active-ico`) |
| `.sidebar-footer` | `.side-foot` + `.user-chip` com `.av` (iniciais) | |
| `.content` | `.content` + adicionar `.topbar` e `<main>` envolto em `.page` | ver shell de referência |
| `.page-head` (igual) | `.page-head` (`h1` + `.sub` + `.page-actions`) | |
| `.hero` | **remover** | substituído por `.page-head` + KPIs (sem gradiente) |
| `.stat-card` / `.stats` | `.kpi` / `.kpis` | novo: `.k-top`, `.k-label`, `.k-ico`, `.k-val`, `.k-foot`, `.delta` |
| `.card` (+ `.card-head`) | `.card` + `.card-head` + `.card-body` (`.flush` p/ tabelas) | borda hairline, sombra mínima |
| `.btn-primary` | `.btn-primary` | agora usa `--primary` |
| `.btn-gold` | `.btn-primary` ou `.btn` | dourado deixa de ser sistémico |
| `.btn-light` / `.btn-ghost` | `.btn` / `.btn-ghost` | |
| `table.data` (igual) | `table.data` | thead sem fundo; usa `.who`, `.cell-strong`, `.cell-sub`, `.row-actions` |
| `.badge.ok/warn/...` | `.badge.ok/warn/danger/info/off` | agora com ponto (`::before`); `.no-dot` para remover |
| `.field` / `.form-grid` | iguais | + `.form-section` (cabeçalho de secção), `.check` (checkbox row) |
| `.toolbar` / `.search-box` | `.toolbar` / `.search` (+ `.seg`, `.select`) | |
| `.doc-a4` / `.via` / `.doc-head` | `.doc` / `.doc-head` / `.doc-rows` / `.doc-row` / `.doc-amount` / `.doc-sign` | usa tokens `--doc-*` (sempre claro p/ impressão) |
| `.tabs` / `.tab` | iguais | indicador agora `--accent-600` |
| `.modal*` / `.toast*` | manter os do repo, **reestilizar** com os novos tokens | não recriados aqui |

> **Componentes não incluídos neste pacote** (modais, toasts, login, relatórios em folha): manter a lógica
> existente e apenas reestilizar com os tokens novos. O login pode seguir o padrão `.doc`/`.card` (fundo `--side-bg`, cartão `.card`).

---

## 7. Ecrãs (referência)

Todos seguem: `.page` → `.page-head` → conteúdo. Markup completo em `reference/prototype.js`.

### Dashboard (`V.dashboard`)
- **4 cartões KPI** (`.kpi`) numa `.grid.kpis` (4 col → 2 → 1 responsivo): label, ícone em tint, valor grande tabular, `.delta` (▲/▼ + %) e nota.
- **2 cartões** lado a lado (`.grid.two-col`): "Receita mensal" (gráfico de colunas `.cols`) e "Receita por curso" (barras `.chart`).
- **2 cartões** lado a lado: "Matrículas recentes" e "Últimos pagamentos" (tabelas `.flush` com botão "Ver todos").

### Estudantes (`V.estudantes`)
- `.toolbar`: `.search` + `.select` (curso) + `.seg` (Todos/Ativos/Pendentes).
- Tabela `.data` dentro de `.card > .card-body.flush`: coluna estudante com `.who` (avatar de iniciais + matrícula), curso, polo, `.badge` de estado, Pago/Saldo (`.num`, saldo>0 a `--danger`), ação "Ficha".

### Nova Matrícula (`V.matricula`)
- Grid 2 colunas: formulário (`.form-grid` com `.form-section` por bloco) + cartão **Resumo** sticky com `.doc-amount`.
- `.form-actions` com `.check` "Gerar recibo", "Limpar", botão primário "Gerar matrícula".

### Recibo (`V.recibos`)
- `.doc` (máx 820px, branco fixo): `.doc-head` (logo + org / kind + nº + data), `.doc-rows` (`.doc-row` k/v), `.doc-amount` (tint da paleta), `.doc-sign` (2 assinaturas), `.doc-foot`. Pronto para impressão A4.

### MIDAS 2026 — Finalistas (`V.midas`)
- 3 KPIs + `.tabs` (Estágios&aptidão / Defesas / Concluídos) + tabela com barra de progresso de estágio (`.chart-track`/`.chart-fill`) e `.badge` (Apto / Em estágio).

### Configurações (`V.config`)
- Cartão **Aparência**: linhas `.set-row` (label+descrição | controlo) → grelha de 3 `.pal-opt` (paletas) + 3 `.appe-seg` (Tema, Sidebar, Densidade).
- 2 cartões: "Identidade institucional" e "Numeração de documentos" (formulários ligados a settings reais).

---

## 8. Interações & comportamento

- **Navegação**: router por hash/`data-route` (já existe). Botões com `data-go="<rota>"` navegam.
- **Transições**: entrada de ecrã `.view-enter` (fade+translate 6px, 0.28s) — respeitar `prefers-reduced-motion`.
- **Hover**: cartões/botões só mudam borda/fundo (sem elevação exagerada). Linhas de tabela → `--panel-2`.
- **Focus**: `:focus-visible` com `outline: 2px var(--accent)` e, em inputs, `box-shadow: 0 0 0 3px var(--accent-50)`.
- **Sidebar mobile** (`<880px`): off-canvas com overlay (`.overlay`, `body.nav-open`, `.sidebar.open`) e `#menuToggle` na topbar.
- **Charts**: barras puramente CSS (largura/altura em %), sem bibliotecas — manter assim por performance.

## 9. Responsividade
- `≤1180px`: KPIs 4→2 col; `.two-col`/`.three-col` colapsam para 1 col.
- `≤880px`: sidebar off-canvas; topbar mostra menu; pesquisa da topbar oculta; `.form-grid`/`.dl` → 1 col.
- `≤520px`: KPIs 1 col; padding de página reduzido; documento com menos padding.
- **Sem scroll horizontal**; tabelas largas dentro de `.table-wrap` (overflow-x auto).

## 10. Assets
- `assets/logo.svg` — logótipo Midas (já no repo, inalterado). É o único elemento de marca com verde+dourado fixos; mantém-se em todas as paletas.
- **Ícones**: inline SVG (stroke), 1.7–1.8 de espessura, `viewBox 0 0 24 24`. Conjunto em `reference/prototype.js` (objeto `I`). Sem dependências de ícones externos.
- **Fonte**: Inter via Google Fonts (já incluída no `<head>` do repo).

---

## 11. Passos sugeridos de implementação

1. Copiar `css/midas-ds.css` para `css/` e trocar o `<link>` em `index.html` (substituir `styles.css`).
2. No `index.html`: adicionar `data-theme/data-palette/data-sidebar/data-density` em `<html>`; envolver as views numa `.topbar` + `<main>`/`.page` (ver shell de referência).
3. Migrar as classes em `js/views.js` e `js/components.js` conforme o **§6** (focar 1 ecrã de cada vez; começar pelo Dashboard).
4. Adicionar a secção **Aparência** à view de Configurações e ligar os 4 `localStorage` keys (§5).
5. Reestilizar modais/toasts/login com os tokens novos (não há markup novo — só CSS).
6. Verificar impressão A4 dos documentos (`@media print` já incluído no CSS).
7. Testar as 3 paletas × Dia/Noite em desktop e telemóvel.

> Dica: manter intacta toda a lógica de dados (`js/data.js`, `js/supabase-data.js`, `js/auth.js`).
> Este redesign é **apenas apresentação** — não toca em regras de negócio nem na numeração de recibos.
