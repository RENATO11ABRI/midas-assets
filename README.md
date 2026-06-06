# Turmas Midas 2026 — Do Zero ao Emprego

Sistema web de gestão para o **Grupo Midas Angola**: matrículas, cursos,
turmas, pagamentos, recibos, relatórios — com impressão limpa em A4 e
exportação em PDF/CSV.

> **Identidade visual:** verde escuro, branco e dourado discreto · Slogan: *Do Zero ao Emprego*

## ✨ Funcionalidades

| Módulo | O que faz |
|--------|-----------|
| **Dashboard** | Indicadores (estudantes, total recebido, cursos ativos, turmas abertas), matrículas e pagamentos recentes |
| **Nova Matrícula** | Formulário completo, nº de matrícula automático, preenchimento automático a partir do curso, geração de recibo |
| **Estudantes** | Lista pesquisável e filtrável, ficha do estudante, histórico de pagamentos, editar, imprimir, exportar |
| **Cursos** | Tabelas pré-definidas (14 cursos iniciais), tipo/duração/período/regime/valores, ativar/inativar |
| **Pagamentos** | Registo, filtros (curso, emolumento, data), totais por dia/mês, exportação |
| **Recibos** | Gerador com design institucional, numeração sequencial, pesquisa, imprimir/PDF |
| **Relatórios** | Matrículas, pagamentos, receitas mensais, por curso/funcionário/período/unidade |
| **Configurações** | Dados institucionais, numeração, listas (períodos, unidades, emolumentos, funcionários…), backup |

## 🌐 Site online

Publicado automaticamente via **GitHub Pages** a cada `push` no `main`:

**https://renato11abri.github.io/midas-assets/**

## 🔐 Acesso (login)

O sistema abre num ecrã de login.

- **Utilizador:** `secretaria`
- **Palavra-passe inicial:** `midas2026`

> Altere a palavra-passe em **Configurações → Conta e segurança** no primeiro acesso.
> O login é do lado do cliente (no navegador): impede o acesso casual, mas não
> substitui um servidor seguro. Pode desativá-lo no mesmo painel.

## 🚀 Como usar

Não precisa de instalação nem servidor. Basta abrir o ficheiro **`index.html`**
num navegador moderno (Chrome, Edge, Firefox) — ou usar o link acima.

Para imprimir/guardar em PDF, use o botão **Imprimir** e escolha
*"Guardar como PDF"* na janela de impressão.

### Servir localmente (opcional)
```bash
# Python
python3 -m http.server 8080
# depois abra http://localhost:8080
```

## 💾 Dados

Os dados são guardados localmente no navegador (`localStorage`) deste
computador. Em **Configurações → Dados** é possível:

- **Exportar backup** (JSON) — faça-o regularmente
- **Importar backup** — restaurar noutro computador
- **Repor dados de fábrica**

> ⚠️ Limpar os dados do navegador apaga os registos. Mantenha backups.

## 📐 Regras do sistema

- Numeração de recibos **automática e sequencial** (`REC-2026-00001`)
- Nenhum recibo é criado sem **valor pago > 0**
- Nenhuma matrícula é guardada sem **nome, contacto e curso**
- Totais calculados automaticamente; histórico por estudante
- Impressão limpa em **A4** e PDF com aparência profissional

## 🗂 Estrutura

```
index.html          Shell da aplicação (sidebar + conteúdo)
css/styles.css      Identidade visual e responsividade (desktop + telemóvel)
js/data.js          Camada de dados (localStorage) + cursos iniciais
js/utils.js         Formatação, datas, impressão A4, CSV
js/components.js    Toasts, modais, recibo e folha de relatório
js/views.js         Todas as páginas/seções
js/app.js           Router, eventos e ligações
```

---
© 2026 Grupo Midas Angola · Turmas Midas 2026
