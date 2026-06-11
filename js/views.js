/* ==========================================================================
   views.js — Todas as páginas/seções do sistema
   ========================================================================== */
(function (window) {
  "use strict";
  var U = window.U, C = window.C, D = window.MidasData;
  var V = {};

  /* =======================================================================
     1. DASHBOARD
     ======================================================================= */
  V.dashboard = function () {
    var db = D.db();
    var s = db.settings;
    var estudantes = db.estudantes;
    var totalRec = D.totalRecebido();
    var cursosAtivos = db.cursos.filter(function (c) { return c.estado === "ativo"; }).length;
    var turmas = {};
    db.cursos.filter(function (c) { return c.estado === "ativo"; }).forEach(function (c) {
      turmas[c.nome + "|" + c.periodo + "|" + c.unidade] = true;
    });
    var turmasAbertas = Object.keys(turmas).length;

    var hoje = U.hoje(), mes = U.ym(U.agoraISO()), ano = (U.agoraISO() || "").slice(0, 4);
    var pagsHoje = db.pagamentos.filter(function (p) { return U.ymd(p.data) === hoje; });
    var recHoje = U.sum(pagsHoje, function (p) { return p.valorPago; });
    var recMes = U.sum(db.pagamentos.filter(function (p) { return U.ym(p.data) === mes; }), function (p) { return p.valorPago; });
    var recAno = U.sum(db.pagamentos.filter(function (p) { return (p.data || "").slice(0, 4) === ano; }), function (p) { return p.valorPago; });

    var ativos = estudantes.filter(function (e) { return e.estado === "ativo"; }).length;
    var concluidos = estudantes.filter(function (e) { return e.estado === "concluído" || e.estado === "concluido"; }).length;
    var comDivida = estudantes.filter(function (e) { return D.saldoDevedor(e) > 0; }).length;

    var recentes = estudantes.slice().sort(U.by("dataMatricula")).slice(0, 6);
    var ultPag = db.pagamentos.slice().sort(U.by("data")).slice(0, 6);

    // ---- Dados para gráficos ----
    var agg = function (arr, keyFn, valFn) {
      var m = {};
      arr.forEach(function (x) { var k = keyFn(x) || "—"; m[k] = (m[k] || 0) + (valFn ? (Number(valFn(x)) || 0) : 1); });
      return m;
    };
    var mPorMes = agg(db.pagamentos, function (p) { return U.ym(p.data); }, function (p) { return p.valorPago; });
    var chartMes = Object.keys(mPorMes).sort().slice(-12).map(function (k) { return { label: U.mesAno(k + "-01"), value: mPorMes[k] }; });
    var mCurso = agg(db.pagamentos, function (p) { return p.curso; }, function (p) { return p.valorPago; });
    var chartCurso = Object.keys(mCurso).map(function (k) { return { label: k, value: mCurso[k] }; }).sort(function (a, b) { return b.value - a.value; }).slice(0, 8);
    var mForma = agg(db.pagamentos, function (p) { return p.formaPagamento; }, function (p) { return p.valorPago; });
    var chartForma = Object.keys(mForma).map(function (k) { return { label: k, value: mForma[k] }; }).sort(function (a, b) { return b.value - a.value; });
    var mMatMes = agg(estudantes, function (e) { return U.ym(e.dataMatricula); }, null);
    var chartMatMes = Object.keys(mMatMes).sort().slice(-12).map(function (k) { return { label: U.mesAno(k + "-01"), value: mMatMes[k] }; });
    var chartDevedores = estudantes.map(function (e) { return { label: e.nome, value: D.saldoDevedor(e) }; })
      .filter(function (x) { return x.value > 0; }).sort(function (a, b) { return b.value - a.value; }).slice(0, 8);

    var html =
      '<div class="page-head"><div>' +
        "<h1>" + U.esc(s.sistema) + '</h1><p class="sub">' + U.esc(s.slogan) + " · " + U.esc(s.instituicao) + "</p></div>" +
        '<div class="page-actions">' +
          '<button class="btn btn-primary" data-go="matricula">Nova Matrícula</button>' +
          '<button class="btn" data-go="recibos">Emitir Recibo</button>' +
          '<button class="btn" data-go="relatorios">Relatórios</button>' +
        "</div></div>" +

      '<div class="grid stats">' +
        V._stat("Estudantes matriculados", estudantes.length, { icon: "users", accent: "green" }) +
        V._stat("Estudantes ativos", ativos, { icon: "userCheck", accent: "green" }) +
        V._stat("Estudantes concluídos", concluidos, { icon: "cap", accent: "info" }) +
        V._stat("Estudantes com dívida", comDivida, { icon: "alert", accent: "danger" }) +
      "</div>" +

      '<div class="grid stats mt">' +
        V._stat("Recebido hoje", U.moeda(recHoje), { icon: "wallet", accent: "gold" }) +
        V._stat("Recebido no mês", U.moeda(recMes), { icon: "trend", accent: "green" }) +
        V._stat("Recebido no ano", U.moeda(recAno), { icon: "calendar", accent: "green" }) +
        V._stat("Total recebido", U.moeda(totalRec), { icon: "wallet", accent: "gold" }) +
      "</div>" +

      '<div class="grid stats mt">' +
        V._stat("Cursos ativos", cursosAtivos, { icon: "book" }) +
        V._stat("Turmas abertas", turmasAbertas, { icon: "layers" }) +
        V._stat("Pagamentos de hoje", pagsHoje.length, { icon: "receipt" }) +
        V._stat("Pagamentos registados", db.pagamentos.length, { icon: "receipt" }) +
      "</div>" +

      '<div class="grid two-col mt">' +
        '<div class="card"><div class="card-head"><h3>Receita por mês</h3></div>' + C.chartBars(chartMes, { moeda: true }) + "</div>" +
        '<div class="card"><div class="card-head"><h3>Receita por curso</h3></div>' + C.chartBars(chartCurso, { moeda: true }) + "</div>" +
      "</div>" +
      '<div class="grid two-col mt">' +
        '<div class="card"><div class="card-head"><h3>Formas de pagamento</h3></div>' + C.chartBars(chartForma, { moeda: true }) + "</div>" +
        '<div class="card"><div class="card-head"><h3>Matrículas por mês</h3></div>' + C.chartBars(chartMatMes) + "</div>" +
      "</div>" +
      '<div class="grid two-col mt">' +
        '<div class="card"><div class="card-head"><h3>Top devedores</h3></div>' + C.chartBars(chartDevedores, { moeda: true, vazio: "Sem dívidas registadas." }) + "</div>" +
        '<div class="card"><div class="card-head"><h3>Recebido por unidade</h3></div>' + V._dashAgg("unidade") + "</div>" +
      "</div>" +

      '<div class="grid two-col mt">' +
        '<div class="card"><div class="card-head"><h3>Matrículas recentes</h3>' +
          '<button class="btn btn-light btn-sm" data-go="estudantes">Ver todos</button></div>' +
          (recentes.length ? V._dashStudents(recentes) : C.empty("", "Ainda não há matrículas. Comece pela Nova Matrícula.")) +
        "</div>" +
        '<div class="card"><div class="card-head"><h3>Últimos pagamentos</h3>' +
          '<button class="btn btn-light btn-sm" data-go="pagamentos">Ver todos</button></div>' +
          (ultPag.length ? V._dashPagamentos(ultPag) : C.empty("", "Sem pagamentos registados.")) +
        "</div>" +
      "</div>";

    return html;
  };
  V._dashAgg = function (campo) {
    var by = {};
    D.pagamentos().forEach(function (p) {
      var k = p[campo] || "—"; by[k] = (by[k] || 0) + (Number(p.valorPago) || 0);
    });
    var keys = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; }).slice(0, 8);
    if (!keys.length) return C.empty("", "Sem pagamentos registados.");
    var rows = keys.map(function (k) {
      return "<tr><td>" + U.esc(k) + "</td><td class='text-right num'><strong>" + U.moeda(by[k]) + "</strong></td></tr>";
    }).join("");
    return '<div class="table-wrap"><table class="data"><thead><tr><th>' +
      (campo === "curso" ? "Curso" : "Unidade") + '</th><th class="text-right">Recebido</th></tr></thead><tbody>' +
      rows + "</tbody></table></div>";
  };
  // Ícones inline para os cartões (sem dependências).
  V._ICONES = {
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    userCheck: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M16 11l2 2 4-4"/>',
    cap: '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    wallet: '<path d="M3 7h18v12H3z"/><path d="M16 12h3"/><path d="M3 7l3-4h12l3 4"/>',
    trend: '<path d="M3 17l6-6 4 4 7-7"/><path d="M17 8h4v4"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    receipt: '<path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M9 8h6M9 12h6"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    layers: '<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>'
  };
  V._ico = function (name) {
    var p = V._ICONES[name];
    return p ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + p + "</svg>" : "";
  };
  // KPI no estilo do design premium (.kpi). Mantém a assinatura antiga
  // (label, value, {icon, accent, sub}) usada em todo o app.
  V._stat = function (label, value, opts) {
    opts = (opts && typeof opts === "object") ? opts : {};
    var ico = opts.icon ? '<span class="k-ico">' + V._ico(opts.icon) + "</span>" : "";
    return '<div class="kpi"><div class="k-top"><span class="k-label">' + U.esc(label) + "</span>" + ico + "</div>" +
      '<div class="k-val num">' + (typeof value === "number" ? value : U.esc(value)) + "</div>" +
      (opts.sub ? '<div class="k-foot">' + U.esc(opts.sub) + "</div>" : "") + "</div>";
  };
  V._dashStudents = function (list) {
    var rows = list.map(function (e) {
      return "<tr><td><strong>" + U.esc(e.nome) + "</strong><br><small>" + U.esc(e.matricula) + "</small></td>" +
        "<td>" + U.esc(e.curso) + "</td><td>" + C.estadoBadge(e.estado) + "</td></tr>";
    }).join("");
    return '<div class="table-wrap"><table class="data"><thead><tr><th>Estudante</th><th>Curso</th><th>Estado</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
  };
  V._dashPagamentos = function (list) {
    var rows = list.map(function (p) {
      return "<tr><td><strong>" + U.esc(p.recibo) + "</strong><br><small>" + U.esc(p.estudanteNome) + "</small></td>" +
        "<td>" + U.esc(p.emolumento) + "</td><td class='text-right num'>" + U.moeda(p.valorPago) + "</td></tr>";
    }).join("");
    return '<div class="table-wrap"><table class="data"><thead><tr><th>Recibo</th><th>Emolumento</th><th class="text-right">Valor</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
  };

  /* =======================================================================
     2. NOVA MATRÍCULA
     ======================================================================= */
  V.matricula = function (params) {
    var db = D.db();
    var editing = params && params.id ? D.estudanteById(params.id) : null;
    var e = editing || {};
    var nextMat = editing ? e.matricula : D.peekMatricula();

    var cursoOpts = '<option value="">— Selecione o curso —</option>' +
      D.cursosOrdenados().map(function (c) {
        return '<option value="' + U.esc(c.nome) + '"' + (e.curso === c.nome ? " selected" : "") + ">" +
          U.esc(c.nome) + "</option>";
      }).join("");

    return C.pageHead("Nova Matrícula", "Cadastro, impressão e arquivo da ficha de matrícula",
      editing ? '<button class="btn btn-light" data-go="estudantes">Voltar</button>' : "") +
      // ---- 1. Formulário ----
      '<div class="card mb"><div class="card-head"><h3>' + (editing ? "Editar Matrícula" : "Ficha de Matrícula") + "</h3>" +
        '<span class="help">Nº de matrícula: <strong id="matNum">' + U.esc(nextMat) + "</strong></span></div>" +
      '<form id="formMatricula"><div class="form-grid">' +
        '<div class="fieldset-title">Dados do estudante</div>' +
        V._f("nome", "Nome completo do estudante", "text", e.nome, true) +
        V._f("dataNascimento", "Data de nascimento", "date", e.dataNascimento) +
        V._f("bi", "Número do BI", "text", e.bi) +
        V._f("contacto", "Contacto principal", "tel", e.contacto, true) +
        V._f("whatsapp", "WhatsApp", "tel", e.whatsapp) +
        V._f("morada", "Morada", "text", e.morada) +

        '<div class="fieldset-title">Encarregado de educação</div>' +
        V._f("encarregado", "Nome do encarregado de educação", "text", e.encarregado) +
        V._f("encarregadoContacto", "Contacto do encarregado", "tel", e.encarregadoContacto) +

        '<div class="fieldset-title">Dados do curso</div>' +
        '<div class="field"><label>Curso <span class="req">*</span></label>' +
          '<select name="curso" id="selCurso" required>' + cursoOpts + "</select>" +
          '<span class="help">Ao escolher o curso, os valores preenchem automaticamente.</span></div>' +
        V._fselect("unidade", "Unidade / Polo", db.unidades, e.unidade) +
        V._fselect("periodo", "Período", db.periodos, e.periodo) +
        V._fselect("tipoCurso", "Tipo de curso", db.tiposCurso, e.tipoCurso) +
        V._f("duracao", "Duração do curso", "text", e.duracao) +
        V._fselect("regime", "Regime de aulas", db.regimes, e.regime) +

        '<div class="fieldset-title">Matrícula e pagamento</div>' +
        V._f("dataMatricula", "Data da matrícula", "date", e.dataMatricula || U.hoje(), true) +
        V._fselect("estado", "Estado", ["ativo", "pendente", "desistente", "concluído"], e.estado || "ativo") +
        V._f("valorInscricao", "Valor da inscrição (Kz)", "number", e.valorInscricao) +
        V._f("valorMatricula", "Valor da matrícula (Kz)", "number", e.valorMatricula) +
        V._f("valorPago", "Valor pago (Kz)", "number", e.valorPago) +
        V._fselect("formaPagamento", "Forma de pagamento", db.formasPagamento, e.formaPagamento) +
        '<div class="field"><label>Tipo de pagamento (emolumento)</label>' +
          '<select name="emolumentoId" id="matEmol">' + V.emolumentoOptions(e.emolumentoId || D.emolumentoPadrao("Matrícula")) + "</select></div>" +
        V._fselect("funcionario", "Funcionário que recebeu", db.funcionarios, e.funcionario) +
        '<div class="field full"><label>Observações</label><textarea name="observacoes">' + U.esc(e.observacoes || "") + "</textarea></div>" +
      "</div>" +
      (editing ? '<input type="hidden" name="id" value="' + e.id + '">' : "") +
      '<input type="hidden" name="matricula" value="' + U.esc(nextMat) + '">' +
      '<div class="form-actions">' +
        '<label class="flex" style="margin-right:auto;font-size:13px;font-weight:600">' +
          '<input type="checkbox" id="gerarRecibo" ' + (editing ? "" : "checked") + '> Gerar recibo do valor pago</label>' +
        '<button type="button" class="btn btn-light" id="matLimpar">Limpar formulário</button>' +
        '<button type="submit" class="btn btn-primary" id="matGerar">' + (editing ? "Guardar alterações" : "Gerar matrícula") + "</button>" +
      "</div></form></div>" +
      // ---- 2. Pré-visualização (A4, 2 vias) ----
      '<div class="card mb" id="matPreviewCard" hidden><div class="card-head"><h3>Pré-visualização — Folha A4, 2 vias</h3>' +
        '<div class="flex"><button class="btn btn-gold" id="matImprimir">Imprimir ficha</button>' +
        '<button class="btn btn-primary" id="matPdf">Guardar em PDF</button></div></div>' +
        '<div id="matPreview"></div></div>' +
      // ---- 3. Pesquisa ----
      '<div class="card"><div class="card-head"><h3>Pesquisar matrícula</h3></div>' +
        '<div class="toolbar"><div class="search-box"><input id="matSearch" placeholder="Pesquisar por nome, contacto, nº de matrícula ou curso..."></div></div>' +
        '<div id="matSearchTable"></div></div>';
  };
  V.renderMatriculaSearch = function () {
    var host = document.getElementById("matSearchTable");
    if (!host) return;
    var q = (document.getElementById("matSearch").value || "").toLowerCase().trim();
    var list = D.estudantes().slice().sort(U.by("dataMatricula"));
    if (q) {
      list = list.filter(function (e) {
        return (e.nome + " " + (e.contacto || "") + " " + e.matricula + " " + (e.curso || "")).toLowerCase().indexOf(q) >= 0;
      });
    }
    list = list.slice(0, 12);
    if (!list.length) { host.innerHTML = C.empty("", q ? "Nenhuma matrícula encontrada." : "Ainda não há matrículas registadas."); return; }
    var rows = list.map(function (e) {
      return "<tr><td><strong>" + U.esc(e.matricula) + "</strong></td>" +
        "<td>" + U.esc(e.nome) + "<br><small>" + U.esc(e.contacto || "") + "</small></td>" +
        "<td>" + U.esc(e.curso || "—") + "</td><td>" + C.estadoBadge(e.estado) + "</td>" +
        '<td><div class="row-actions">' +
          '<button class="btn btn-light btn-sm" data-est-edit="' + e.id + '">Carregar</button>' +
          '<button class="btn btn-gold btn-sm" data-est-ficha="' + e.id + '">Ficha</button>' +
        "</div></td></tr>";
    }).join("");
    host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      "<th>Matrícula</th><th>Nome / Contacto</th><th>Curso</th><th>Estado</th><th>Ações</th>" +
      "</tr></thead><tbody>" + rows + "</tbody></table></div>";
  };
  V._f = function (name, label, type, val, req) {
    return '<div class="field"><label>' + U.esc(label) + (req ? ' <span class="req">*</span>' : "") + "</label>" +
      '<input type="' + type + '" name="' + name + '" value="' + (val == null ? "" : U.esc(val)) + '"' +
      (req ? " required" : "") + (type === "number" ? ' min="0" step="0.01"' : "") + "></div>";
  };
  V._fselect = function (name, label, arr, sel, req) {
    return '<div class="field"><label>' + U.esc(label) + (req ? ' <span class="req">*</span>' : "") + "</label>" +
      '<select name="' + name + '"' + (req ? " required" : "") + ">" +
      '<option value="">—</option>' + U.optionList(arr, sel) + "</select></div>";
  };
  // <option>s dos emolumentos ATIVOS (valor preenchido automaticamente ao selecionar)
  V.emolumentoOptions = function (selectedId) {
    var ativos = D.emolumentosAtivos();
    if (!ativos.length) return '<option value="">(sem emolumentos ativos)</option>';
    return ativos.map(function (e) {
      var ctx = [];
      if (e.curso) ctx.push(e.curso);
      if (e.unidade) ctx.push(e.unidade);
      var label = e.nome + (ctx.length ? " (" + ctx.join(" · ") + ")" : "") + (e.valor ? " — " + U.moeda(e.valor) : "");
      return '<option value="' + e.id + '" data-valor="' + (Number(e.valor) || 0) + '" data-nome="' + U.esc(e.nome) +
        '" data-categoria="' + U.esc(e.categoria) + '"' + (e.id === selectedId ? " selected" : "") + ">" + U.esc(label) + "</option>";
    }).join("");
  };
  V.emolumentoNomesUnicos = function () {
    var seen = {}, out = [];
    D.emolumentos().forEach(function (e) { if (!seen[e.nome]) { seen[e.nome] = 1; out.push(e.nome); } });
    return out;
  };

  /* =======================================================================
     3. ESTUDANTES
     ======================================================================= */
  V.estudantes = function () {
    return C.pageHead("Estudantes", "Lista de todos os estudantes matriculados",
      '<button class="btn btn-primary" data-go="matricula">Nova Matrícula</button>' +
      '<button class="btn btn-light" id="expEstCsv">Exportar CSV</button>' +
      '<button class="btn btn-light" id="expEstPdf">PDF</button>') +
      '<div class="card">' +
        '<div class="toolbar">' +
          '<div class="search-box"><input id="estSearch" placeholder="Pesquisar por nome, contacto, matrícula..."></div>' +
          '<div class="field"><label>Curso</label><select id="estFiltroCurso"><option value="">Todos</option>' +
            U.optionList(D.cursos().map(function (c) { return c.nome; })) + "</select></div>" +
          '<div class="field"><label>Estado</label><select id="estFiltroEstado"><option value="">Todos</option>' +
            U.optionList(["ativo", "pendente", "desistente", "concluído"]) + "</select></div>" +
        "</div>" +
        '<div id="estTable"></div>' +
      "</div>";
  };
  V._estState = { pagina: 1 };
  V.renderEstudantesTable = function () {
    var host = document.getElementById("estTable");
    if (!host) return;
    var opts = {
      busca: document.getElementById("estSearch").value || "",
      curso: document.getElementById("estFiltroCurso").value,
      estado: document.getElementById("estFiltroEstado").value,
      pagina: V._estState.pagina, porPagina: 50
    };
    D.queryEstudantes(opts).then(function (res) {
      V._estState.pagina = res.pagina;
      if (!res.total) { host.innerHTML = C.empty("", "Nenhum estudante encontrado."); return; }
      var rows = res.rows.map(function (e) {
        var pago = D.totalPagoEstudante(e.id);
        return "<tr>" +
          "<td><strong>" + U.esc(e.matricula) + "</strong></td>" +
          "<td>" + U.esc(e.nome) + "<br><small>" + U.esc(e.contacto || "") + "</small></td>" +
          "<td>" + U.esc(e.curso) + "<br><small>" + U.esc(e.periodo || "") + " · " + U.esc(e.tipoCurso || "") + "</small></td>" +
          "<td>" + U.esc(e.regime || "—") + "</td>" +
          "<td class='text-right num'>" + U.moeda(pago) + "</td>" +
          "<td>" + C.estadoBadge(e.estado) + "</td>" +
          "<td>" + U.dataPT(e.dataMatricula) + "</td>" +
          '<td><div class="row-actions">' +
            '<button class="btn btn-light btn-sm" data-est-view="' + e.id + '">Ver</button>' +
            '<button class="btn btn-light btn-sm" data-est-ficha="' + e.id + '">Ficha</button>' +
            '<button class="btn btn-light btn-sm" data-est-edit="' + e.id + '">Editar</button>' +
            '<button class="btn btn-light btn-sm" data-est-pay="' + e.id + '">Pagamento</button>' +
            '<button class="btn btn-danger btn-sm" data-est-del="' + e.id + '">Eliminar</button>' +
          "</div></td></tr>";
      }).join("");
      host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
        "<th>Matrícula</th><th>Nome / Contacto</th><th>Curso</th><th>Regime</th>" +
        '<th class="text-right">Total pago</th><th>Estado</th><th>Data</th><th>Ações</th>' +
        "</tr></thead><tbody>" + rows + "</tbody></table></div>" + V._paginacao(res);
    });
  };
  V._paginacao = function (res) {
    var ini = (res.pagina - 1) * res.porPagina + 1;
    var fim = Math.min(res.total, res.pagina * res.porPagina);
    if (res.nPaginas <= 1) return '<p class="help mt">' + res.total + " estudante(s).</p>";
    return '<div class="paginacao">' +
      '<button class="btn btn-light btn-sm" data-est-pag="ant"' + (res.pagina <= 1 ? " disabled" : "") + ">‹ Anterior</button>" +
      '<span class="pag-info">' + ini + "–" + fim + " de " + res.total + " · página " + res.pagina + "/" + res.nPaginas + "</span>" +
      '<button class="btn btn-light btn-sm" data-est-pag="seg"' + (res.pagina >= res.nPaginas ? " disabled" : "") + ">Seguinte ›</button>" +
      "</div>";
  };

  V.fichaEstudante = function (id) {
    var e = D.estudanteById(id);
    if (!e) return;
    var pags = D.pagamentosDeEstudante(id).sort(U.by("data"));
    var pago = U.sum(pags, function (p) { return p.valorPago; });
    var curso = D.cursoByNome(e.curso);
    var totalCurso = curso ? curso.valorTotal : 0;
    var saldo = totalCurso ? Math.max(0, totalCurso - pago) : 0;
    var cursoEmFalta = D.cursoEmFalta(e);

    var dl = function (k, v) { return '<div class="dl-item"><div class="k">' + U.esc(k) + '</div><div class="v">' + U.esc(v || "—") + "</div></div>"; };

    var histRows = pags.length ? pags.map(function (p) {
      return "<tr><td>" + U.dataPT(p.data) + "</td><td>" + U.esc(p.recibo) + "</td><td>" + U.esc(p.emolumento) +
        "</td><td>" + U.esc(p.formaPagamento || "") + "</td><td class='text-right num'>" + U.moeda(p.valorPago) +
        '</td><td><button class="btn btn-light btn-sm" data-pag-view="' + p.id + '">Recibo</button></td></tr>';
    }).join("") : '<tr><td colspan="6" style="text-align:center;color:#888">Sem pagamentos.</td></tr>';

    C.modal({
      title: "Ficha do Estudante",
      body:
        '<div id="fichaDoc">' +
        '<div class="print-only" style="text-align:center;margin-bottom:14px"><h2 style="color:#103d2d;margin:0">' +
          U.esc(D.db().settings.instituicao) + "</h2><div>Ficha do Estudante — " + U.esc(D.db().settings.anoLetivo) + "</div></div>" +
        '<h3 style="color:#103d2d">' + U.esc(e.nome) + " · " + U.esc(e.matricula) + " " + C.estadoBadge(e.estado) + "</h3>" +
        (cursoEmFalta ? '<div style="margin:0 0 12px;padding:10px 12px;border-radius:8px;background:#fdecee;color:#842029;font-weight:600">⚠️ Curso removido ou não encontrado — não é possível calcular o saldo em falta.</div>' : "") +
        '<div class="dl mb">' +
          dl("BI", e.bi) + dl("Nascimento", U.dataPT(e.dataNascimento)) +
          dl("Contacto", e.contacto) + dl("WhatsApp", e.whatsapp) +
          dl("Morada", e.morada) + dl("Unidade / Polo", e.unidade) +
          dl("Curso", e.curso) + dl("Tipo de curso", e.tipoCurso) +
          dl("Período", e.periodo) + dl("Duração", e.duracao) +
          dl("Regime", e.regime) + dl("Data da matrícula", U.dataPT(e.dataMatricula)) +
        "</div>" +
        '<div class="grid stats mb" style="grid-template-columns:repeat(3,1fr)">' +
          V._stat("Total pago", U.moeda(pago), "") +
          V._stat("Valor do curso", cursoEmFalta ? "⚠ Curso removido" : (totalCurso ? U.moeda(totalCurso) : "—"), "") +
          V._stat("Saldo em falta", cursoEmFalta ? "⚠ Não calculável" : (totalCurso ? U.moeda(saldo) : "—"), "") +
        "</div>" +
        "<h4>Histórico de pagamentos</h4>" +
        '<div class="table-wrap"><table class="data"><thead><tr><th>Data</th><th>Recibo</th><th>Emolumento</th><th>Forma</th><th class="text-right">Valor</th><th></th></tr></thead><tbody>' +
        histRows + "</tbody></table></div>" +
        (e.observacoes ? "<p><strong>Observações:</strong> " + U.esc(e.observacoes) + "</p>" : "") +
        "</div>",
      footer:
        '<button class="btn btn-light" onclick="App.closeModal()">Fechar</button>' +
        '<button class="btn btn-light" id="fichaEdit">Editar</button>' +
        '<button class="btn btn-gold" id="fichaPay">Novo pagamento</button>' +
        (saldo > 0 ? '<button class="btn btn-light" id="fichaWhats">Lembrar no WhatsApp</button>' : "") +
        '<button class="btn btn-light" id="fichaCarne">Mapa de Propinas</button>' +
        '<button class="btn btn-light" id="fichaExtrato">Gerar Extrato</button>' +
        '<button class="btn btn-primary" id="fichaPrint">Imprimir histórico</button>',
      onOpen: function () {
        document.getElementById("fichaEdit").onclick = function () { C.closeModal(); App.navigate("matricula", { id: id }); };
        document.getElementById("fichaPay").onclick = function () { C.closeModal(); V.novoPagamento(id); };
        document.getElementById("fichaExtrato").onclick = function () { C.closeModal(); C.verExtrato(e); };
        document.getElementById("fichaCarne").onclick = function () { C.closeModal(); C.verMapaPropinas(e); };
        document.getElementById("fichaPrint").onclick = function () { U.printElement("fichaDoc", "Ficha " + e.nome); };
        var fw = document.getElementById("fichaWhats");
        if (fw) fw.onclick = function () {
          var num = e.whatsapp || e.contacto;
          if (!num) { C.toast("Sem contacto de WhatsApp para este estudante.", "err"); return; }
          var msg = "Olá, " + e.nome + ". Aqui é a Secretaria do " + U.esc(D.db().settings.instituicao).replace(/&amp;/g, "&") +
            ".\n\nConsta no sistema uma pendência no valor de " + U.moeda(saldo) +
            ".\n\nPedimos que regularize o pagamento para manter a sua situação académica em dia.\n\n" +
            D.db().settings.instituicao + " — " + D.db().settings.sistema + ".";
          var url = U.whatsappURL(num, msg);
          if (url) window.open(url, "_blank"); else C.toast("Contacto inválido.", "err");
        };
      }
    });
  };

  /* =======================================================================
     4. CURSOS
     ======================================================================= */
  V.cursos = function () {
    return C.pageHead("Cursos", "Tabelas pré-definidas de cursos, valores e turmas",
      '<button class="btn btn-primary" id="novoCurso">Novo Curso</button>' +
      '<button class="btn btn-light" id="expCursoCsv">Exportar CSV</button>') +
      '<div class="card">' +
        '<div class="toolbar">' +
          '<div class="search-box"><input id="cursoSearch" placeholder="Pesquisar curso..."></div>' +
          '<div class="field"><label>Tipo</label><select id="cursoFiltroTipo"><option value="">Todos</option>' +
            U.optionList(D.db().tiposCurso) + "</select></div>" +
          '<div class="field"><label>Estado</label><select id="cursoFiltroEstado"><option value="">Todos</option>' +
            U.optionList(["ativo", "inativo"]) + "</select></div>" +
        '</div><div id="cursoTable"></div></div>';
  };
  V.renderCursosTable = function () {
    var q = (document.getElementById("cursoSearch").value || "").toLowerCase();
    var ft = document.getElementById("cursoFiltroTipo").value;
    var fe = document.getElementById("cursoFiltroEstado").value;
    var list = D.cursos().filter(function (c) {
      if (ft && c.tipo !== ft) return false;
      if (fe && c.estado !== fe) return false;
      if (q && c.nome.toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var host = document.getElementById("cursoTable");
    if (!list.length) { host.innerHTML = C.empty("", "Nenhum curso encontrado."); return; }
    var rows = list.map(function (c) {
      return "<tr><td><strong>" + U.esc(c.nome) + "</strong><br><small>" + U.esc(c.unidade || "") + "</small></td>" +
        '<td><span class="badge gold">' + U.esc(c.tipo) + "</span></td>" +
        "<td>" + U.esc(c.duracao || "—") + "</td>" +
        "<td>" + U.esc(c.periodo || "—") + "<br><small>" + U.esc(c.regime || "") + "</small></td>" +
        "<td class='text-right num'>" + U.moeda(c.valorMensalidade) + "</td>" +
        "<td class='text-right num'><strong>" + U.moeda(c.valorTotal) + "</strong></td>" +
        "<td>" + C.estadoBadge(c.estado) + "</td>" +
        '<td><div class="row-actions">' +
          '<button class="btn btn-light btn-sm" data-curso-edit="' + c.id + '">Editar</button>' +
          '<button class="btn btn-danger btn-sm" data-curso-del="' + c.id + '">Eliminar</button>' +
        "</div></td></tr>";
    }).join("");
    host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      "<th>Curso</th><th>Tipo</th><th>Duração</th><th>Período / Regime</th>" +
      '<th class="text-right">Mensalidade</th><th class="text-right">Total</th><th>Estado</th><th>Ações</th>' +
      "</tr></thead><tbody>" + rows + "</tbody></table></div>" +
      '<p class="help mt">' + list.length + " curso(s).</p>";
  };
  V.editarCurso = function (id) {
    var db = D.db();
    var c = id ? D.cursoById(id) : {};
    var f = function (n, l, t, v) {
      return '<div class="field"><label>' + l + "</label><input type='" + t + "' name='" + n + "' value='" +
        (v == null ? "" : U.esc(v)) + "'" + (t === "number" ? " min='0' step='0.01'" : "") + "></div>";
    };
    var sel = function (n, l, arr, v) {
      return '<div class="field"><label>' + l + "</label><select name='" + n + "'><option value=''>—</option>" +
        U.optionList(arr, v) + "</select></div>";
    };
    C.modal({
      title: id ? "Editar Curso" : "Novo Curso",
      body: '<form id="formCurso"><div class="form-grid">' +
        '<div class="field full"><label>Nome do curso <span class="req">*</span></label>' +
          "<input name='nome' required value='" + U.esc(c.nome || "") + "'></div>" +
        sel("tipo", "Tipo de curso", db.tiposCurso, c.tipo) +
        f("duracao", "Duração do curso", "text", c.duracao) +
        sel("periodo", "Período", db.periodos, c.periodo) +
        sel("regime", "Regime", db.regimes, c.regime) +
        f("valorInscricao", "Valor da inscrição (Kz)", "number", c.valorInscricao) +
        f("valorMatricula", "Valor da matrícula (Kz)", "number", c.valorMatricula) +
        f("valorMensalidade", "Valor da propina / mensalidade (Kz)", "number", c.valorMensalidade) +
        f("valorEstagio", "Valor do estágio (Kz)", "number", c.valorEstagio) +
        f("valorDefesa", "Valor da defesa (Kz)", "number", c.valorDefesa) +
        f("valorCertificado", "Valor do certificado (Kz)", "number", c.valorCertificado) +
        f("valorTotal", "Valor total do curso (Kz)", "number", c.valorTotal) +
        sel("unidade", "Unidade / Polo", db.unidades, c.unidade) +
        sel("estado", "Estado", ["ativo", "inativo"], c.estado || "ativo") +
        "</div>" + (id ? "<input type='hidden' name='id' value='" + id + "'>" : "") + "</form>",
      footer:
        '<button class="btn btn-light" onclick="App.closeModal()">Cancelar</button>' +
        '<button class="btn btn-primary" id="saveCurso">Guardar</button>',
      onOpen: function () {
        document.getElementById("saveCurso").onclick = function () {
          var fd = new FormData(document.getElementById("formCurso"));
          var nome = (fd.get("nome") || "").trim();
          if (!nome) { C.toast("Indique o nome do curso.", "err"); return; }
          var curso = {
            id: fd.get("id") || undefined,
            nome: nome, tipo: fd.get("tipo"), duracao: fd.get("duracao"),
            periodo: fd.get("periodo"), regime: fd.get("regime"),
            valorInscricao: U.parseMoeda(fd.get("valorInscricao")),
            valorMatricula: U.parseMoeda(fd.get("valorMatricula")),
            valorMensalidade: U.parseMoeda(fd.get("valorMensalidade")),
            valorEstagio: U.parseMoeda(fd.get("valorEstagio")),
            valorDefesa: U.parseMoeda(fd.get("valorDefesa")),
            valorCertificado: U.parseMoeda(fd.get("valorCertificado")),
            valorTotal: U.parseMoeda(fd.get("valorTotal")),
            unidade: fd.get("unidade"), estado: fd.get("estado") || "ativo"
          };
          D.saveCurso(curso);
          C.closeModal(); C.toast("Curso guardado.", "ok"); V.renderCursosTable();
        };
      }
    });
  };

  /* =======================================================================
     5. PAGAMENTOS
     ======================================================================= */
  V.pagamentos = function () {
    return C.pageHead("Pagamentos", "Registe pagamentos e gere recibos. Ao registar um pagamento, o estudante é criado automaticamente se ainda não existir.",
      '<button class="btn btn-gold" id="novoPag">Registar Pagamento</button>' +
      '<button class="btn btn-light" id="expPagCsv">Exportar CSV</button>' +
      '<button class="btn btn-light" id="expPagPdf">Relatório PDF</button>') +
      '<div class="grid stats mb" id="pagStats"></div>' +
      '<div class="card">' +
        '<div class="toolbar">' +
          '<div class="search-box"><input id="pagSearch" placeholder="Pesquisar por estudante, recibo, curso..."></div>' +
          '<div class="field"><label>Curso</label><select id="pagFiltroCurso"><option value="">Todos</option>' +
            U.optionList(D.cursos().map(function (c) { return c.nome; })) + "</select></div>" +
          '<div class="field"><label>Tipo de pagamento</label><select id="pagFiltroEmol"><option value="">Todos</option>' +
            U.optionList(V.emolumentoNomesUnicos()) + "</select></div>" +
          '<div class="field"><label>Unidade</label><select id="pagFiltroUnidade"><option value="">Todas</option>' +
            U.optionList(D.db().unidades) + "</select></div>" +
          '<div class="field"><label>De</label><input type="date" id="pagDe"></div>' +
          '<div class="field"><label>Até</label><input type="date" id="pagAte"></div>' +
        '</div><div id="pagTable"></div></div>';
  };
  V._filtrarPagamentos = function () {
    var q = (document.getElementById("pagSearch").value || "").toLowerCase();
    var fc = document.getElementById("pagFiltroCurso").value;
    var fem = document.getElementById("pagFiltroEmol").value;
    var fu = document.getElementById("pagFiltroUnidade").value;
    var de = document.getElementById("pagDe").value;
    var ate = document.getElementById("pagAte").value;
    return D.pagamentos().filter(function (p) {
      if (fc && p.curso !== fc) return false;
      if (fem && p.emolumento !== fem) return false;
      if (fu && p.unidade !== fu) return false;
      var d = U.ymd(p.data);
      if (de && d < de) return false;
      if (ate && d > ate) return false;
      if (q) {
        var hay = (p.estudanteNome + " " + p.recibo + " " + p.curso + " " + p.emolumento + " " + (p.contacto || "")).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    }).sort(U.by("data"));
  };
  V.renderPagamentos = function () {
    var list = V._filtrarPagamentos();
    var hoje = U.hoje(), mes = U.ym(U.agoraISO());
    var totalFiltro = U.sum(list, function (p) { return p.valorPago; });
    var totalHoje = U.sum(D.pagamentos().filter(function (p) { return U.ymd(p.data) === hoje; }), function (p) { return p.valorPago; });
    var totalMes = U.sum(D.pagamentos().filter(function (p) { return U.ym(p.data) === mes; }), function (p) { return p.valorPago; });

    document.getElementById("pagStats").innerHTML =
      V._stat("Total filtrado", U.moeda(totalFiltro), "") +
      V._stat("Recebido hoje", U.moeda(totalHoje), "") +
      V._stat("Recebido este mês", U.moeda(totalMes), "") +
      V._stat("Nº de pagamentos", list.length, "");

    var host = document.getElementById("pagTable");
    if (!list.length) { host.innerHTML = C.empty("", "Nenhum pagamento encontrado."); return; }
    var rows = list.map(function (p) {
      return "<tr><td>" + U.dataPT(p.data) + "</td>" +
        "<td><strong>" + U.esc(p.recibo) + "</strong></td>" +
        "<td>" + U.esc(p.estudanteNome) + "<br><small>" + U.esc(p.curso || "") + "</small></td>" +
        '<td><span class="badge info">' + U.esc(p.emolumento) + "</span></td>" +
        "<td>" + U.esc(p.formaPagamento || "—") + "</td>" +
        "<td class='text-right num'><strong>" + U.moeda(p.valorPago) + "</strong></td>" +
        '<td><div class="row-actions">' +
          '<button class="btn btn-light btn-sm" data-pag-view="' + p.id + '">Recibo</button>' +
          '<button class="btn btn-danger btn-sm" data-pag-del="' + p.id + '">Eliminar</button>' +
        "</div></td></tr>";
    }).join("");
    host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      "<th>Data</th><th>Recibo</th><th>Estudante / Curso</th><th>Emolumento</th><th>Forma</th>" +
      '<th class="text-right">Valor</th><th>Ações</th></tr></thead><tbody>' + rows +
      "</tbody></table></div>";
  };

  // Resolve um texto escrito (nome, "nome · matrícula" ou parcial) para um estudante.
  // Tolerante a maiúsculas, acentos e espaços; só devolve quando há 1 correspondência clara.
  V.resolverEstudante = function (valor) {
    var norm = function (s) {
      return String(s == null ? "" : s).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    };
    var v = norm(valor);
    if (!v) return null;
    var ests = D.estudantes();
    var exato = ests.filter(function (x) {
      return norm(x.nome + " · " + x.matricula) === v || norm(x.nome) === v;
    });
    if (exato.length) return exato[0];
    var porMat = ests.filter(function (x) { return x.matricula && v.indexOf(norm(x.matricula)) >= 0; });
    if (porMat.length === 1) return porMat[0];
    var parc = ests.filter(function (x) {
      return norm(x.nome + " · " + x.matricula).indexOf(v) >= 0 || norm(x.nome).indexOf(v) >= 0;
    });
    if (parc.length === 1) return parc[0];
    return null;
  };

  // Modal de aviso de possível duplicado. onUsar(estudante) | onCriarNovo()
  V.confirmaDuplicado = function (candidatos, onUsar, onCriarNovo) {
    var lista = candidatos.slice(0, 6).map(function (e) {
      var info = [e.matricula, e.contacto, e.curso].filter(Boolean).map(U.esc).join(" · ");
      return '<li class="flex spread" style="padding:8px 0;border-bottom:1px solid var(--line)">' +
        "<span><strong>" + U.esc(e.nome) + "</strong><br><small>" + info + "</small></span>" +
        '<button class="btn btn-primary btn-sm" data-usar="' + e.id + '">É este</button></li>';
    }).join("");
    C.modal({
      title: "Estudante parecido encontrado",
      body: '<p class="help" style="margin-top:0">Para evitar fichas duplicadas, verifique se o estudante já existe:</p>' +
        '<ul style="list-style:none;padding:0;margin:0" id="dupList">' + lista + "</ul>",
      footer:
        '<button class="btn btn-light" onclick="App.closeModal()">Cancelar</button>' +
        '<button class="btn btn-gold" id="dupCriar">Criar novo mesmo assim</button>',
      onOpen: function () {
        document.getElementById("dupList").addEventListener("click", function (ev) {
          var id = ev.target && ev.target.getAttribute && ev.target.getAttribute("data-usar");
          if (id) { C.closeModal(); onUsar(D.estudanteById(id)); }
        });
        document.getElementById("dupCriar").onclick = function () { C.closeModal(); onCriarNovo(); };
      }
    });
  };

  // Modal: registar pagamento. Se o estudante não existir, é CRIADO a partir
  // deste pagamento (a folha de pagamento é o ponto de entrada do estudante).
  V.novoPagamento = function (estId) {
    var db = D.db();
    var sel = estId ? D.estudanteById(estId) : null;
    var cursoOpts = '<option value="">— Curso (opcional) —</option>' +
      D.cursosOrdenados().map(function (c) {
        return '<option value="' + U.esc(c.nome) + '"' + (sel && sel.curso === c.nome ? " selected" : "") + ">" + U.esc(c.nome) + "</option>";
      }).join("");
    C.modal({
      title: "Registar Pagamento",
      body: '<form id="formPag">' +
        '<p class="help" style="margin-top:0">Escreva o nome do estudante. Se ainda não existir no sistema, ' +
        "<strong>é criado automaticamente</strong> a partir deste pagamento.</p>" +
        '<div class="form-grid">' +
        '<div class="field full"><label>Nome do estudante <span class="req">*</span></label>' +
          V.buscaInteligenteHTML("payEstNome", "Escreva o nome — sugere por curso, período e matrícula…", (sel ? sel.nome : ""), { hiddenId: "payEst" }) +
          '<input type="hidden" name="estudanteId" id="payEst" value="' + (sel ? sel.id : "") + '"></div>' +
        '<div class="field"><label>Contacto</label><input name="contacto" id="payContacto" type="tel" value="' +
          (sel ? U.esc(sel.contacto || "") : "") + '"></div>' +
        '<div class="field"><label>Curso</label><select name="curso" id="payCurso">' + cursoOpts + "</select></div>" +
        '<div class="field full"><label>Emolumentos <span class="req">*</span></label>' +
          '<div id="payItens"></div>' +
          '<div class="pay-item-add"><button type="button" class="btn btn-light btn-sm" id="payAddItem">+ Adicionar emolumento</button>' +
            '<span class="pay-total">Total: <strong id="payTotal">' + U.moeda(0) + "</strong></span></div></div>" +
        '<div class="field"><label>Mês de referência</label><input type="month" name="mesReferencia"></div>' +
        '<div class="field"><label>Forma de pagamento</label><select name="formaPagamento">' +
          U.optionList(db.formasPagamento) + "</select></div>" +
        '<div class="field"><label>Data</label><input type="date" name="data" value="' + U.hoje() + '"></div>' +
        '<div class="field"><label>Funcionário que recebeu</label><select name="funcionario">' +
          U.optionList(db.funcionarios) + "</select></div>" +
        '<div class="field"><label>Referência</label><input name="referencia" placeholder="Nº de referência / TPA / transferência"></div>' +
        '<div class="field full"><label>Observações</label><textarea name="observacoes"></textarea></div>' +
        "</div></form>",
      footer:
        '<button class="btn btn-light" onclick="App.closeModal()">Cancelar</button>' +
        '<button class="btn btn-primary" id="savePag">Registar e gerar recibo</button>',
      onOpen: function () {
        // Pesquisa inteligente: ao escolher um estudante existente, liga-o
        // (preenche o hidden payEst) e preenche contacto/curso. Se escrever um
        // nome novo, payEst fica vazio e a gravação cria/associa como antes.
        V.wireBuscaInteligente("payEstNome", function (e) {
          var ct = document.getElementById("payContacto");
          var cu = document.getElementById("payCurso");
          if (ct && !ct.value) ct.value = e.contacto || "";
          if (cu && e.curso) cu.value = e.curso;
        }, "payEst");
        // ---- Emolumentos (vários por recibo) ----
        var itensHost = document.getElementById("payItens");
        var emolOpts = V.emolumentoOptions(D.emolumentoPadrao("Propina"));
        function recalcTotal() {
          var t = 0;
          [].slice.call(itensHost.querySelectorAll(".pay-val")).forEach(function (inp) { t += U.parseMoeda(inp.value); });
          document.getElementById("payTotal").textContent = U.moeda(t);
        }
        function addRow(presetId) {
          var row = document.createElement("div");
          row.className = "pay-item-row";
          row.innerHTML = '<select class="pay-emol">' + emolOpts + "</select>" +
            "<input type='number' class='pay-val' min='0' step='0.01' placeholder='Valor'>" +
            '<button type="button" class="btn btn-danger btn-sm pay-del" title="Remover">×</button>';
          itensHost.appendChild(row);
          var selE = row.querySelector(".pay-emol"), valE = row.querySelector(".pay-val");
          if (presetId) selE.value = presetId;
          var fill = function () { var v = D.emolumentoValor(selE.value); if (v > 0) valE.value = v; recalcTotal(); };
          selE.addEventListener("change", fill);
          valE.addEventListener("input", recalcTotal);
          row.querySelector(".pay-del").addEventListener("click", function () {
            if (itensHost.querySelectorAll(".pay-item-row").length > 1) { row.remove(); recalcTotal(); }
            else C.toast("Tem de haver pelo menos um emolumento.", "err");
          });
          fill();
        }
        document.getElementById("payAddItem").onclick = function () { addRow(); };
        addRow(D.emolumentoPadrao("Propina"));

        document.getElementById("savePag").onclick = function () {
          if (V.caixaBloqueadoModal()) return;   // exige fecho do caixa do dia anterior
          var fd = new FormData(document.getElementById("formPag"));
          var nomeRaw = (document.getElementById("payEstNome").value || "").trim();
          if (!nomeRaw) { C.toast("Escreva o nome do estudante.", "err"); return; }
          var itens = [];
          [].slice.call(itensHost.querySelectorAll(".pay-item-row")).forEach(function (row) {
            var emo = D.emolumentoById(row.querySelector(".pay-emol").value);
            var v = U.parseMoeda(row.querySelector(".pay-val").value);
            if (v > 0) itens.push({ emolumentoId: emo ? emo.id : "", emolumento: emo ? emo.nome : "Outros", categoria: emo ? emo.categoria : "Outros", valorPago: v });
          });
          if (!itens.length) { C.toast("Adicione pelo menos um emolumento com valor.", "err"); return; }
          var btn = document.getElementById("savePag");
          var restore = function () { if (btn) { btn.disabled = false; btn.textContent = "Registar e gerar recibo"; } };
          var contacto = fd.get("contacto") || "", curso = fd.get("curso") || "";

          // Regista o pagamento para um estudante (existente ou novo)
          var registar = function (est, novo) {
            if (btn) { btn.disabled = true; btn.textContent = "A registar…"; }
            V._criarPagamento(est, {
              itens: itens,
              mesReferencia: fd.get("mesReferencia"),
              formaPagamento: fd.get("formaPagamento"), funcionario: fd.get("funcionario"),
              data: fd.get("data") ? fd.get("data") + "T" + new Date().toTimeString().slice(0, 8) : U.agoraISO(),
              referencia: fd.get("referencia"), observacoes: fd.get("observacoes")
            }).then(function (pag) {
              C.closeModal();
              C.toast((novo ? "Estudante criado e pagamento registado" : "Pagamento registado") + " — recibo " + pag.recibo, "ok");
              C.viewReceipt(pag);
              App.refresh();
            }).catch(function (e) {
              C.toast("Erro ao registar: " + (e && e.message ? e.message : e), "err");
              restore();
            });
          };
          var criarNovo = function () {
            D.alocarMatricula().then(function (numero) {
              var nv = D.saveEstudante({
                matricula: numero, nome: nomeRaw.split(" · ")[0].trim(),
                contacto: contacto, curso: curso, estado: "ativo", dataMatricula: U.hoje()
              });
              registar(nv, true);
            }).catch(function (e) { C.toast("Erro ao criar estudante: " + (e && e.message ? e.message : e), "err"); restore(); });
          };

          // Existente (resolvido pela pesquisa ou pelo nome) → usa-o. Senão, verifica duplicados antes de criar.
          var payEstHid = document.getElementById("payEst");
          var existente = (payEstHid && D.estudanteById(payEstHid.value)) || V.resolverEstudante(nomeRaw);
          if (existente) { registar(existente, false); return; }
          var semelhantes = D.estudantesSemelhantes(nomeRaw, contacto, null);
          if (semelhantes.length) {
            V.confirmaDuplicado(semelhantes, function (esc) { registar(esc, false); }, criarNovo);
          } else {
            criarNovo();
          }
        };
      }
    });
  };
  // Cria registo de pagamento a partir de um estudante + dados.
  // Devolve uma Promise<pagamento> (o número do recibo é alocado de forma atómica).
  // Bloqueio do caixa: se houver um dia anterior por fechar, impede novos
  // movimentos financeiros e mostra como desbloquear. Devolve true se bloqueado.
  V.caixaBloqueadoModal = function () {
    var dia = D.caixaBloqueado();
    if (!dia) return false;
    var perfil = D.auth().perfil;
    var podeFechar = !window.MidasUsers || perfil === "admin" || perfil === "directora";
    C.modal({
      title: "Caixa por fechar",
      body: "<p>Há um dia com movimentos por fechar: <strong>" + U.dataPT(dia) + "</strong>.</p>" +
        "<p>Não é possível registar novos <strong>pagamentos</strong> nem <strong>matrículas</strong> " +
        "enquanto o caixa desse dia não for fechado.</p>" +
        (podeFechar
          ? "<p>Vá a <strong>Fecho de Caixa</strong>, escolha essa data e <strong>Guardar fecho</strong> para desbloquear.</p>"
          : "<p>Peça ao <strong>Administrador/Diretora</strong> para fechar o caixa desse dia.</p>"),
      footer: '<button class="btn btn-light" onclick="App.closeModal()">Fechar</button>' +
        (podeFechar ? '<button class="btn btn-primary" id="irFecho">Ir para Fecho de Caixa</button>' : ""),
      onOpen: function () {
        var b = document.getElementById("irFecho");
        if (b) b.onclick = function () { C.closeModal(); App.navigate("fecho"); };
      }
    });
    return true;
  };

  V._criarPagamento = function (est, extra) {
    return D.alocarRecibo().then(function (numero) {
      // Suporta vários emolumentos por recibo (extra.itens). Mantém valorPago
      // como TOTAL e emolumento como resumo, para Fecho/relatórios continuarem
      // a funcionar (que somam valorPago e mostram emolumento).
      var itens = (extra.itens && extra.itens.length) ? extra.itens : null;
      var valorTotal = itens
        ? itens.reduce(function (s, it) { return s + (Number(it.valorPago) || 0); }, 0)
        : (Number(extra.valorPago) || 0);
      var resumoEmol = itens
        ? (itens.length === 1 ? itens[0].emolumento : itens.map(function (it) { return it.emolumento; }).join(" + "))
        : (extra.emolumento || "Outros");
      var pag = {
        recibo: numero,
        estudanteId: est.id, estudanteNome: est.nome, matricula: est.matricula,
        contacto: est.contacto, curso: est.curso, periodo: est.periodo,
        unidade: est.unidade, tipoCurso: est.tipoCurso, duracao: est.duracao, regime: est.regime,
        data: extra.data || U.agoraISO(),
        emolumentoId: itens && itens.length === 1 ? itens[0].emolumentoId : (extra.emolumentoId || ""),
        emolumento: resumoEmol,
        categoria: itens ? (itens[0].categoria || "") : (extra.categoria || ""),
        itens: itens || undefined,
        mesReferencia: extra.mesReferencia || "",
        valorPago: valorTotal,
        formaPagamento: extra.formaPagamento || "",
        funcionario: extra.funcionario || "",
        referencia: extra.referencia || "",
        observacoes: extra.observacoes || ""
      };
      return D.savePagamento(pag);
    });
  };

  /* =======================================================================
     5b. FECHO DE CAIXA
     ======================================================================= */
  V._FORMAS_FECHO = ["Dinheiro", "TPA", "Transferência", "Multicaixa Express"];
  V._resumoCaixa = function (ymd, funcionario) {
    var pags = D.pagamentosDoDia(ymd, funcionario);
    var totais = {};
    V._FORMAS_FECHO.forEach(function (f) { totais[f] = 0; });
    totais["Outras"] = 0;
    var porEmol = {}, porFunc = {};
    var totalGeral = 0;
    pags.forEach(function (p) {
      var v = Number(p.valorPago) || 0; totalGeral += v;
      var f = p.formaPagamento;
      if (V._FORMAS_FECHO.indexOf(f) >= 0) totais[f] += v; else totais["Outras"] += v;
      var fn = p.funcionario || "—"; porFunc[fn] = (porFunc[fn] || 0) + v;
      // por emolumento (expande os itens quando o recibo tem vários)
      if (p.itens && p.itens.length) {
        p.itens.forEach(function (it) { var k = it.emolumento || "Outros"; porEmol[k] = (porEmol[k] || 0) + (Number(it.valorPago) || 0); });
      } else { var k = p.emolumento || "Outros"; porEmol[k] = (porEmol[k] || 0) + v; }
    });
    return { recibos: pags.slice().sort(U.by("data")), totais: totais, porEmol: porEmol, porFunc: porFunc, totalGeral: totalGeral };
  };
  // Tabela "chave → valor (moeda)" para os detalhes do fecho.
  V._tabelaTotais = function (titulo, obj) {
    var keys = Object.keys(obj || {}).filter(function (k) { return (obj[k] || 0) !== 0; }).sort();
    if (!keys.length) return "";
    return "<h4>" + U.esc(titulo) + '</h4><div class="table-wrap"><table class="data"><tbody>' +
      keys.map(function (k) { return "<tr><td>" + U.esc(k) + "</td><td class='text-right num'>" + U.moeda(obj[k]) + "</td></tr>"; }).join("") +
      "</tbody></table></div>";
  };
  V.fecho = function () {
    var db = D.db();
    return C.pageHead("Fecho de Caixa", "Resumo diário dos valores recebidos, por funcionário.") +
      '<div class="card mb"><div class="form-grid">' +
        '<div class="field"><label>Data</label><input type="date" id="fcData"></div>' +
        '<div class="field"><label>Funcionário</label><select id="fcFunc"><option value="">Todos</option>' +
          U.optionList(db.funcionarios) + "</select></div>" +
        "</div>" +
        '<div class="grid stats" id="fcStats"></div>' +
        '<div id="fcRecibos" class="mt"></div>' +
        '<div class="field full mt"><label>Observações</label><textarea id="fcObs"></textarea></div>' +
        '<div class="form-actions">' +
          '<button class="btn btn-light" id="fcImprimir">Imprimir / PDF</button>' +
          '<button class="btn btn-primary" id="fcGuardar">Guardar fecho</button>' +
        "</div></div>" +
      '<div class="card"><div class="card-head"><h3>Fechos guardados</h3></div><div id="fcGuardados"></div></div>';
  };
  V.renderFechoResumo = function (ymd, funcionario) {
    var r = V._resumoCaixa(ymd, funcionario);
    var stats = document.getElementById("fcStats");
    if (stats) stats.innerHTML =
      V._stat("Dinheiro", U.moeda(r.totais["Dinheiro"])) +
      V._stat("TPA", U.moeda(r.totais["TPA"])) +
      V._stat("Transferência", U.moeda(r.totais["Transferência"])) +
      V._stat("Multicaixa Express", U.moeda(r.totais["Multicaixa Express"])) +
      V._stat("Outras formas", U.moeda(r.totais["Outras"])) +
      V._stat("Total geral", U.moeda(r.totalGeral)) +
      V._stat("Nº de recibos", r.recibos.length);
    var host = document.getElementById("fcRecibos");
    if (!host) return;
    if (!r.recibos.length) { host.innerHTML = C.empty("", "Sem recibos para esta data/funcionário."); return; }
    var rows = r.recibos.map(function (p) {
      return "<tr><td>" + U.esc(p.recibo) + "</td><td>" + U.esc(p.estudanteNome) + "</td><td>" + U.esc(p.emolumento) +
        "</td><td>" + U.esc(p.formaPagamento || "") + "</td><td>" + U.esc(p.funcionario || "") +
        "</td><td class='text-right num'>" + U.moeda(p.valorPago) + "</td></tr>";
    }).join("");
    host.innerHTML =
      '<div class="grid two-col">' +
        '<div>' + V._tabelaTotais("Por emolumento", r.porEmol) + "</div>" +
        '<div>' + V._tabelaTotais("Por funcionário", r.porFunc) + "</div>" +
      "</div>" +
      "<h4>Recibos do dia</h4>" +
      '<div class="table-wrap"><table class="data"><thead><tr><th>Recibo</th><th>Estudante</th><th>Emolumento</th><th>Forma</th><th>Funcionário</th><th class="text-right">Valor</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
  };
  V.renderFechosGuardados = function () {
    var host = document.getElementById("fcGuardados");
    if (!host) return;
    var list = D.fechos().slice().sort(function (a, b) { return (a.fechadoEm || "") < (b.fechadoEm || "") ? 1 : -1; });
    if (!list.length) { host.innerHTML = C.empty("", "Ainda não há fechos guardados."); return; }
    var admin = !window.MidasUsers || D.auth().perfil === "admin";
    var rows = list.map(function (f) {
      return "<tr><td>" + U.dataPT(f.data) + "</td><td>" + U.esc(f.funcionario) + "</td>" +
        "<td class='text-right num'>" + U.moeda(f.totalGeral) + "</td><td>" + (f.numRecibos || 0) + "</td>" +
        "<td><small>" + U.esc(f.fechadoPor || "") + "</small></td>" +
        '<td><div class="row-actions"><button class="btn btn-light btn-sm" data-fecho-print="' + f.id + '">Imprimir</button>' +
        (admin ? '<button class="btn btn-danger btn-sm" data-fecho-del="' + f.id + '">Eliminar</button>' : "") +
        "</div></td></tr>";
    }).join("");
    host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr><th>Data</th><th>Funcionário</th><th class="text-right">Total</th><th>Recibos</th><th>Fechado por</th><th></th></tr></thead><tbody>' + rows + "</tbody></table></div>";
  };

  /* =======================================================================
     6. RECIBOS
     ======================================================================= */
  V.recibos = function () {
    return C.pageHead("Recibos", "Emita e reimprima recibos de pagamento",
      '<button class="btn btn-gold" id="recNovo">Emitir recibo / Registar pagamento</button>') +
      // ---- 1. Emitir (usa o MESMO fluxo do Registar Pagamento) ----
      '<div class="card mb"><div class="card-head"><h3>Emitir recibo</h3>' +
        '<span class="help">Próximo nº (automático): <strong id="recNum">' + U.esc(D.peekRecibo()) + "</strong></span></div>" +
        '<p class="help" style="margin:0">Clique em <strong>“Emitir recibo / Registar pagamento”</strong>. ' +
        "É o mesmo formulário do menu <em>Pagamentos</em>: regista o pagamento, cria o estudante se necessário " +
        "e abre logo o recibo (folha A4, 2 vias) para imprimir ou guardar em PDF.</p></div>" +
      // ---- 2. Pesquisa / reimpressão ----
      '<div class="card"><div class="card-head"><h3>Pesquisar e reimprimir recibos</h3></div>' +
        '<div class="toolbar">' +
          '<div class="search-box"><input id="recSearch" placeholder="Pesquisar por nº recibo, nome, contacto, curso..."></div>' +
          '<div class="field"><label>De</label><input type="date" id="recDe"></div>' +
          '<div class="field"><label>Até</label><input type="date" id="recAte"></div>' +
        '</div><div id="recTable"></div></div>';
  };
  V.renderRecibos = function () {
    var q = (document.getElementById("recSearch").value || "").toLowerCase();
    var de = document.getElementById("recDe").value, ate = document.getElementById("recAte").value;
    var list = D.pagamentos().filter(function (p) {
      var d = U.ymd(p.data);
      if (de && d < de) return false;
      if (ate && d > ate) return false;
      if (q) {
        var hay = (p.recibo + " " + p.estudanteNome + " " + (p.contacto || "") + " " + p.curso + " " + U.dataPT(p.data)).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    }).sort(U.by("data"));
    var host = document.getElementById("recTable");
    if (!list.length) { host.innerHTML = C.empty("", "Nenhum recibo encontrado."); return; }
    var rows = list.map(function (p) {
      return "<tr><td><strong>" + U.esc(p.recibo) + "</strong></td>" +
        "<td>" + U.dataPT(p.data) + "</td>" +
        "<td>" + U.esc(p.estudanteNome) + "<br><small>" + U.esc(p.contacto || "") + "</small></td>" +
        "<td>" + U.esc(p.curso || "—") + "</td>" +
        "<td>" + U.esc(p.emolumento) + "</td>" +
        "<td class='text-right num'><strong>" + U.moeda(p.valorPago) + "</strong></td>" +
        '<td><button class="btn btn-gold btn-sm" data-pag-view="' + p.id + '">Ver / Imprimir</button></td></tr>';
    }).join("");
    host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      "<th>Nº Recibo</th><th>Data</th><th>Estudante</th><th>Curso</th><th>Emolumento</th>" +
      '<th class="text-right">Valor</th><th></th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
      '<p class="help mt">' + list.length + " recibo(s).</p>";
  };

  /* =======================================================================
     7. RELATÓRIOS
     ======================================================================= */
  V.relatorios = function () {
    var db = D.db();
    return C.pageHead("Relatórios", "Relatórios filtráveis com impressão e exportação em PDF") +
      '<div class="card mb"><div class="form-grid">' +
        '<div class="field"><label>Tipo de relatório</label><select id="relTipo">' +
          '<option value="matriculas">Matrículas (diário/período)</option>' +
          '<option value="pagamentos">Receitas / Pagamentos (diário/período)</option>' +
          '<option value="estudantes">Estudantes (lista completa)</option>' +
          '<option value="receitasMes">Receitas mensais</option>' +
          '<option value="porCurso">Por curso</option>' +
          '<option value="porCategoria">Receitas por categoria (contabilidade)</option>' +
          '<option value="porFormaPagamento">Receitas por forma de pagamento</option>' +
          '<option value="porFuncionario">Por funcionário</option>' +
          '<option value="porPeriodo">Estudantes por período</option>' +
          '<option value="porUnidade">Estudantes por unidade</option>' +
          '<option value="dividas">Dívidas (saldo em falta)</option>' +
          '<option value="estagios">Estágios</option>' +
          '<option value="certificados">Certificados</option>' +
          '<option value="defesa">Defesa Final</option>' +
        "</select></div>" +
        '<div class="field"><label>De</label><input type="date" id="relDe"></div>' +
        '<div class="field"><label>Até</label><input type="date" id="relAte"></div>' +
        '<div class="field" style="justify-content:flex-end"><label>&nbsp;</label>' +
          '<button class="btn btn-primary" id="relGerar">Gerar relatório</button></div>' +
      "</div></div>" +
      '<div class="card"><div class="card-head"><h3 id="relTitulo">Pré-visualização</h3>' +
        '<div class="flex"><button class="btn btn-light" id="relCsv">CSV</button>' +
        '<button class="btn btn-gold" id="relPrint">Imprimir / PDF</button></div></div>' +
        '<div id="relOut">' + C.empty("", "Escolha o tipo de relatório e clique em “Gerar relatório”.") + "</div></div>";
  };

  // Build report data; returns {titulo, sub, headers, rows, totals, csv:{headers,rows}}
  V.buildReport = function (tipo, de, ate) {
    var inRange = function (iso) {
      var d = U.ymd(iso);
      if (de && d < de) return false;
      if (ate && d > ate) return false;
      return true;
    };
    var rangeTxt = (de || ate) ? ("Período: " + (de ? U.dataPT(de) : "início") + " a " + (ate ? U.dataPT(ate) : "hoje")) : "Todos os registos";

    if (tipo === "matriculas") {
      var ests = D.estudantes().filter(function (e) { return inRange(e.dataMatricula); }).sort(U.by("dataMatricula"));
      return {
        titulo: "Relatório de Matrículas", sub: rangeTxt,
        headers: ["Data", "Matrícula", "Nome", "Curso", "Período", "Unidade", "Estado"],
        rows: ests.map(function (e) {
          return [U.dataPT(e.dataMatricula), U.esc(e.matricula), U.esc(e.nome), U.esc(e.curso), U.esc(e.periodo || ""), U.esc(e.unidade || ""), U.esc(e.estado)];
        }),
        totals: ["", "", "", "", "", "Total", ests.length + " matrículas"]
      };
    }
    if (tipo === "pagamentos") {
      var pags = D.pagamentos().filter(function (p) { return inRange(p.data); }).sort(U.by("data"));
      var tot = U.sum(pags, function (p) { return p.valorPago; });
      return {
        titulo: "Relatório de Pagamentos", sub: rangeTxt,
        headers: ["Data", "Recibo", "Estudante", "Curso", "Emolumento", "Forma", "Valor (Kz)"],
        rows: pags.map(function (p) {
          return [U.dataPT(p.data), U.esc(p.recibo), U.esc(p.estudanteNome), U.esc(p.curso || ""), U.esc(p.emolumento), U.esc(p.formaPagamento || ""), U.num(p.valorPago)];
        }),
        totals: ["", "", "", "", "", "TOTAL", U.moeda(tot)]
      };
    }
    if (tipo === "receitasMes") {
      var byMonth = {};
      D.pagamentos().filter(function (p) { return inRange(p.data); }).forEach(function (p) {
        var k = U.ym(p.data); byMonth[k] = byMonth[k] || { count: 0, total: 0 };
        byMonth[k].count++; byMonth[k].total += Number(p.valorPago) || 0;
      });
      var keys = Object.keys(byMonth).sort();
      var grand = keys.reduce(function (s, k) { return s + byMonth[k].total; }, 0);
      return {
        titulo: "Relatório de Receitas Mensais", sub: rangeTxt,
        headers: ["Mês", "Nº pagamentos", "Total recebido (Kz)"],
        rows: keys.map(function (k) {
          return [U.mesAno(k + "-01"), byMonth[k].count, U.num(byMonth[k].total)];
        }),
        totals: ["TOTAL", "", U.moeda(grand)]
      };
    }
    if (tipo === "porCurso") {
      var byC = {};
      D.estudantes().forEach(function (e) {
        byC[e.curso] = byC[e.curso] || { mat: 0, pago: 0 };
        byC[e.curso].mat++;
      });
      D.pagamentos().filter(function (p) { return inRange(p.data); }).forEach(function (p) {
        byC[p.curso] = byC[p.curso] || { mat: 0, pago: 0 };
        byC[p.curso].pago += Number(p.valorPago) || 0;
      });
      var ck = Object.keys(byC).sort();
      var gMat = 0, gPago = 0;
      ck.forEach(function (k) { gMat += byC[k].mat; gPago += byC[k].pago; });
      return {
        titulo: "Relatório por Curso", sub: rangeTxt,
        headers: ["Curso", "Estudantes", "Total recebido (Kz)"],
        rows: ck.map(function (k) { return [U.esc(k || "—"), byC[k].mat, U.num(byC[k].pago)]; }),
        totals: ["TOTAL", gMat, U.moeda(gPago)]
      };
    }
    if (tipo === "porCategoria" || tipo === "porFormaPagamento") {
      var campo = tipo === "porCategoria" ? "categoria" : "formaPagamento";
      var by = {};
      D.pagamentos().filter(function (p) { return inRange(p.data); }).forEach(function (p) {
        var k = (campo === "categoria" ? (p.categoria || p.emolumento) : p.formaPagamento) || "—";
        by[k] = by[k] || { count: 0, total: 0 };
        by[k].count++; by[k].total += Number(p.valorPago) || 0;
      });
      var ks = Object.keys(by).sort(function (a, b) { return by[b].total - by[a].total; });
      var gt = ks.reduce(function (s, k) { return s + by[k].total; }, 0);
      return {
        titulo: tipo === "porCategoria" ? "Receitas por Categoria" : "Receitas por Forma de Pagamento",
        sub: rangeTxt,
        headers: [tipo === "porCategoria" ? "Categoria" : "Forma de pagamento", "Nº", "Total (Kz)"],
        rows: ks.map(function (k) { return [U.esc(k), by[k].count, U.num(by[k].total)]; }),
        totals: ["TOTAL", "", U.moeda(gt)]
      };
    }
    if (tipo === "porFuncionario") {
      var byF = {};
      D.pagamentos().filter(function (p) { return inRange(p.data); }).forEach(function (p) {
        var k = p.funcionario || "—"; byF[k] = byF[k] || { count: 0, total: 0 };
        byF[k].count++; byF[k].total += Number(p.valorPago) || 0;
      });
      var fk = Object.keys(byF).sort();
      var gf = fk.reduce(function (s, k) { return s + byF[k].total; }, 0);
      return {
        titulo: "Relatório por Funcionário", sub: rangeTxt,
        headers: ["Funcionário", "Nº recibos", "Total recebido (Kz)"],
        rows: fk.map(function (k) { return [U.esc(k), byF[k].count, U.num(byF[k].total)]; }),
        totals: ["TOTAL", "", U.moeda(gf)]
      };
    }
    if (tipo === "porPeriodo" || tipo === "porUnidade") {
      var key = tipo === "porPeriodo" ? "periodo" : "unidade";
      var byK = {};
      D.estudantes().filter(function (e) { return inRange(e.dataMatricula); }).forEach(function (e) {
        var k = e[key] || "—"; byK[k] = (byK[k] || 0) + 1;
      });
      var kk = Object.keys(byK).sort();
      var g = kk.reduce(function (s, k) { return s + byK[k]; }, 0);
      return {
        titulo: tipo === "porPeriodo" ? "Estudantes por Período" : "Estudantes por Unidade",
        sub: rangeTxt,
        headers: [tipo === "porPeriodo" ? "Período" : "Unidade / Polo", "Nº de estudantes"],
        rows: kk.map(function (k) { return [U.esc(k), byK[k]]; }),
        totals: ["TOTAL", g]
      };
    }
    if (tipo === "estudantes") {
      var le = D.estudantes().filter(function (e) { return inRange(e.dataMatricula); }).sort(U.by("dataMatricula"));
      return {
        titulo: "Relatório de Estudantes", sub: rangeTxt,
        headers: ["Matrícula", "Nome", "Curso", "Período", "Unidade", "Estado", "Total pago"],
        rows: le.map(function (e) {
          return [U.esc(e.matricula), U.esc(e.nome), U.esc(e.curso), U.esc(e.periodo || ""), U.esc(e.unidade || ""), U.esc(e.estado), U.num(D.totalPagoEstudante(e.id))];
        }),
        totals: ["", "", "", "", "", "Total", le.length + " estudante(s)"]
      };
    }
    if (tipo === "dividas") {
      var devedores = D.estudantes().map(function (e) {
        return { e: e, pago: D.totalPagoEstudante(e.id), divida: D.saldoDevedor(e) };
      }).filter(function (x) { return x.divida > 0; }).sort(function (a, b) { return b.divida - a.divida; });
      var totDiv = U.sum(devedores, function (x) { return x.divida; });
      return {
        titulo: "Relatório de Dívidas", sub: rangeTxt,
        headers: ["Matrícula", "Nome", "Curso", "Total pago (Kz)", "Em dívida (Kz)"],
        rows: devedores.map(function (x) {
          return [U.esc(x.e.matricula), U.esc(x.e.nome), U.esc(x.e.curso), U.num(x.pago), U.num(x.divida)];
        }),
        totals: ["", "", "", "TOTAL EM DÍVIDA", U.moeda(totDiv)]
      };
    }
    if (tipo === "estagios" || tipo === "certificados" || tipo === "defesa") {
      var match = function (nome) {
        var n = (nome || "").toLowerCase();
        if (tipo === "estagios") return n.indexOf("estágio") >= 0 || n.indexOf("estagio") >= 0;
        if (tipo === "certificados") return n.indexOf("certificado") >= 0;
        return n.indexOf("defesa") >= 0 || n.indexOf("júri") >= 0 || n.indexOf("juri") >= 0;
      };
      var pe = D.pagamentos().filter(function (p) {
        return inRange(p.data) && (match(p.emolumento) || match(p.categoria));
      }).sort(U.by("data"));
      var totPe = U.sum(pe, function (p) { return p.valorPago; });
      var titulos = { estagios: "Relatório de Estágios", certificados: "Relatório de Certificados", defesa: "Relatório de Defesa Final" };
      return {
        titulo: titulos[tipo], sub: rangeTxt,
        headers: ["Data", "Recibo", "Estudante", "Curso", "Tipo", "Valor (Kz)"],
        rows: pe.map(function (p) {
          return [U.dataPT(p.data), U.esc(p.recibo), U.esc(p.estudanteNome), U.esc(p.curso || ""), U.esc(p.emolumento), U.num(p.valorPago)];
        }),
        totals: ["", "", "", "", "TOTAL", U.moeda(totPe)]
      };
    }
    return { titulo: "Relatório", sub: rangeTxt, headers: [], rows: [], totals: [] };
  };

  /* =======================================================================
     8. CONFIGURAÇÕES (Painel administrativo)
     ======================================================================= */
  V.config = function () {
    var s = D.db().settings;
    return C.pageHead("Configurações", "Painel administrativo — dados institucionais e listas do sistema") +
      '<div class="tabs" id="cfgTabs">' +
        '<div class="tab active" data-tab="inst">Instituição</div>' +
        '<div class="tab" data-tab="aparencia">Aparência</div>' +
        '<div class="tab" data-tab="emolumentos">Emolumentos e Valores</div>' +
        '<div class="tab" data-tab="listas">Listas (períodos, unidades, etc.)</div>' +
        '<div class="tab" data-tab="conta">Conta e segurança</div>' +
        (window.MidasUsers && D.auth().perfil === "admin"
          ? '<div class="tab" data-tab="utilizadores">Utilizadores</div>' : "") +
        (!window.MidasUsers || ["admin", "directora"].indexOf(D.auth().perfil) >= 0
          ? '<div class="tab" data-tab="importar">Importar</div>' : "") +
        (window.MidasAudit && ["admin", "directora"].indexOf(D.auth().perfil) >= 0
          ? '<div class="tab" data-tab="auditoria">Auditoria</div>' : "") +
        '<div class="tab" data-tab="dados">Dados (backup)</div>' +
      '</div><div id="cfgContent"></div>';
  };
  V.cfgInst = function () {
    var s = D.db().settings;
    var f = function (n, l, v, t) {
      return '<div class="field"><label>' + l + "</label><input type='" + (t || "text") + "' name='" + n + "' value='" + U.esc(v || "") + "'></div>";
    };
    var logoP = s.logoPrincipal || U.assetURL("assets/logo.svg");
    return '<form id="formInst" class="card"><div class="form-grid">' +
      '<div class="fieldset-title">Dados institucionais</div>' +
      f("instituicao", "Nome da instituição", s.instituicao) +
      f("sistema", "Nome do sistema", s.sistema) +
      f("slogan", "Slogan", s.slogan) +
      f("endereco", "Endereço", s.endereco) +
      f("telefone", "Telefone principal", s.telefone) +
      f("whatsapp", "WhatsApp", s.whatsapp) +
      f("email", "E-mail", s.email, "email") +
      f("website", "Website", s.website) +
      f("nif", "NIF", s.nif) +
      '<div class="fieldset-title">Direção e assinaturas</div>' +
      f("directorGeral", "Nome do Director Geral", s.directorGeral) +
      f("diretora", "Nome da Directora Administrativa", s.diretora) +
      f("secretaria", "Nome da Secretaria", s.secretaria) +
      '<div class="fieldset-title">Logótipo</div>' +
      '<div class="field"><label>Logótipo principal</label>' +
        '<div class="flex"><img src="' + logoP + '" alt="" style="width:54px;height:54px;border-radius:10px;border:1px solid var(--line)" id="logoPrev">' +
        '<input type="file" accept="image/*" id="logoFile"></div>' +
        '<span class="help">PNG/JPG/SVG. Aparece na barra lateral, login, dashboard, recibos, matrículas e PDF.</span></div>' +
      '<div class="field" style="align-self:end"><button type="button" class="btn btn-light btn-sm" id="logoRemover">Remover logótipo</button></div>' +
      '<div class="fieldset-title">Ano lectivo e moeda</div>' +
      '<div class="field"><label>Ano lectivo activo</label><select name="anoLectivo">' +
        U.optionList(["2024/2025", "2025/2026", "2026/2027", "2027/2028"], s.anoLectivo) + "</select></div>" +
      f("anoLetivo", "Ano de numeração (ex.: 2026)", s.anoLetivo) +
      '<div class="field"><label>Moeda</label><input name="moeda" value="' + U.esc(s.moeda || "Kz") + '"></div>' +
      '<div class="field"><label>Casas decimais</label><select name="casasDecimais">' +
        U.optionList(["0", "1", "2"], String(s.casasDecimais == null ? 2 : s.casasDecimais)) + "</select></div>" +
      '<div class="fieldset-title">Numeração automática</div>' +
      f("prefixoMatricula", "Prefixo das matrículas", s.prefixoMatricula) +
      f("digitosMatricula", "Dígitos das matrículas", s.digitosMatricula, "number") +
      f("prefixoRecibo", "Prefixo dos recibos", s.prefixoRecibo) +
      f("digitosRecibo", "Dígitos dos recibos", s.digitosRecibo, "number") +
      f("seqMatricula", "Próximo nº de matrícula", s.seqMatricula, "number") +
      f("seqRecibo", "Próximo nº de recibo", s.seqRecibo, "number") +
      "</div>" +
      '<p class="help">Pré-visualização: matrícula <strong>' + U.esc(D.peekMatricula()) + "</strong> · recibo <strong>" + U.esc(D.peekRecibo()) + "</strong></p>" +
      "<div class='form-actions'><button type='submit' class='btn btn-primary'>Guardar</button></div></form>";
  };
  // ---- Aparência do sistema ----
  V.cfgAparencia = function () {
    var s = D.db().settings;
    var temas = ["Verde Midas", "Azul Executivo", "Verde Escuro Institucional", "Preto Premium"];
    var sw = { "Verde Midas": "#0f4d3a", "Azul Executivo": "#155e8c", "Verde Escuro Institucional": "#0c5a3f", "Preto Premium": "#16181c" };
    var cards = temas.map(function (t) {
      return '<div class="tema-card' + (s.tema === t ? " sel" : "") + '" data-tema="' + U.esc(t) + '">' +
        '<span class="tema-swatch" style="background:' + sw[t] + '"></span><strong>' + U.esc(t) + "</strong></div>";
    }).join("");
    var cor = function (n, l, v) {
      return '<div class="field"><label>' + l + '</label><input type="color" name="' + n + '" value="' + (v || "#0f4d3a") + '"></div>';
    };
    return '<form id="formAparencia" class="card"><div class="card-head"><h3>Aparência do sistema</h3>' +
      '<button type="button" class="btn btn-light" id="apModo">Modo: ' + (s.modo === "noite" ? "Noite" : "Dia") + "</button></div>" +
      '<div class="fieldset-title" style="margin-top:0">Temas pré-definidos</div>' +
      '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin-bottom:8px" id="temaCards">' + cards + "</div>" +
      '<input type="hidden" name="tema" id="temaInput" value="' + U.esc(s.tema) + '">' +
      '<div class="fieldset-title">Cores personalizadas (substituem o tema)</div>' +
      '<label class="flex" style="font-size:13px;font-weight:600;margin-bottom:10px">' +
        '<input type="checkbox" name="usarCores" id="apUsarCores" ' + (s.corPrincipal ? "checked" : "") + "> Usar cores personalizadas</label>" +
      '<div class="form-grid">' +
        cor("corPrincipal", "Cor principal", s.corPrincipal) +
        cor("corSecundaria", "Cor secundária", s.corSecundaria) +
        cor("corBotao", "Cor dos botões", s.corBotao) +
      "</div>" +
      '<div class="form-actions"><button type="button" class="btn btn-light" id="apPrever">Pré-visualizar</button>' +
        '<button type="submit" class="btn btn-primary">Guardar aparência</button></div></form>';
  };
  // ---- Emolumentos e Valores (cadastro completo) ----
  V.cfgEmolumentos = function () {
    return '<div class="card"><div class="card-head"><h3>Emolumentos e Valores</h3>' +
        '<button class="btn btn-primary" id="emNovo">Novo emolumento</button></div>' +
        '<p class="help">Cadastre os valores cobrados pelo Grupo Midas Angola. Ao emitir um recibo ou matrícula, ' +
        "ao selecionar o tipo de pagamento o valor é preenchido automaticamente. Apenas emolumentos ativos aparecem nos formulários.</p>" +
        '<div class="toolbar">' +
          '<div class="search-box"><input id="emSearch" placeholder="Pesquisar por nome, categoria ou curso..."></div>' +
          '<div class="field"><label>Categoria</label><select id="emFiltroCat"><option value="">Todas</option>' +
            U.optionList(D.categoriasEmolumento()) + "</select></div>" +
          '<div class="field"><label>Estado</label><select id="emFiltroEstado"><option value="">Todos</option>' +
            U.optionList(["ativo", "inativo"]) + "</select></div>" +
        '</div><div id="emTable"></div></div>';
  };
  V.renderEmolumentos = function () {
    var q = (document.getElementById("emSearch").value || "").toLowerCase();
    var fc = document.getElementById("emFiltroCat").value;
    var fe = document.getElementById("emFiltroEstado").value;
    var list = D.emolumentos().filter(function (e) {
      if (fc && e.categoria !== fc) return false;
      if (fe && e.estado !== fe) return false;
      if (q && (e.nome + " " + e.categoria + " " + (e.curso || "") + " " + (e.unidade || "")).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    var host = document.getElementById("emTable");
    if (!list.length) { host.innerHTML = C.empty("", "Nenhum emolumento encontrado."); return; }
    var rows = list.map(function (e) {
      return "<tr><td><strong>" + U.esc(e.nome) + "</strong></td>" +
        '<td><span class="badge gold">' + U.esc(e.categoria) + "</span></td>" +
        "<td class='text-right num'>" + (e.valor ? U.moeda(e.valor) : "—") + "</td>" +
        "<td>" + U.esc(e.curso || "—") + "</td>" +
        "<td>" + U.esc(e.unidade || "—") + "</td>" +
        "<td>" + C.estadoBadge(e.estado) + "</td>" +
        '<td><div class="row-actions">' +
          '<button class="btn btn-light btn-sm" data-em-edit="' + e.id + '">Editar</button>' +
          '<button class="btn btn-light btn-sm" data-em-toggle="' + e.id + '">' + (e.estado === "ativo" ? "Desativar" : "Ativar") + "</button>" +
          '<button class="btn btn-danger btn-sm" data-em-del="' + e.id + '">Eliminar</button>' +
        "</div></td></tr>";
    }).join("");
    host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      "<th>Emolumento</th><th>Categoria</th><th class='text-right'>Valor</th><th>Curso</th><th>Unidade</th><th>Estado</th><th>Ações</th>" +
      "</tr></thead><tbody>" + rows + "</tbody></table></div>" +
      '<p class="help mt">' + list.length + " emolumento(s).</p>";
  };
  V.editarEmolumento = function (id) {
    var db = D.db();
    var e = id ? D.emolumentoById(id) : {};
    var cursoOpts = '<option value="">Todos / Não aplicável</option>' +
      D.cursosOrdenados().map(function (c) { return '<option value="' + U.esc(c.nome) + '"' + (e.curso === c.nome ? " selected" : "") + ">" + U.esc(c.nome) + "</option>"; }).join("");
    C.modal({
      title: id ? "Editar Emolumento" : "Novo Emolumento",
      body: '<form id="formEmol"><div class="form-grid">' +
        '<div class="field"><label>Nome do emolumento <span class="req">*</span></label><input name="nome" required value="' + U.esc(e.nome || "") + '"></div>' +
        '<div class="field"><label>Categoria</label><select name="categoria">' + U.optionList(D.categoriasEmolumento(), e.categoria || "Outros") + "</select></div>" +
        '<div class="field"><label>Valor padrão (Kz)</label><input type="number" name="valor" min="0" step="0.01" value="' + (Number(e.valor) || 0) + '"></div>' +
        '<div class="field"><label>Estado</label><select name="estado">' + U.optionList(["ativo", "inativo"], e.estado || "ativo") + "</select></div>" +
        '<div class="field"><label>Curso associado (opcional)</label><select name="curso">' + cursoOpts + "</select></div>" +
        '<div class="field"><label>Tipo de curso (opcional)</label><select name="tipoCurso"><option value="">—</option>' + U.optionList(db.tiposCurso, e.tipoCurso) + "</select></div>" +
        '<div class="field"><label>Unidade / Polo (opcional)</label><select name="unidade"><option value="">—</option>' + U.optionList(db.unidades, e.unidade) + "</select></div>" +
        '<div class="field"></div>' +
        '<div class="field full"><label>Observações</label><textarea name="observacoes">' + U.esc(e.observacoes || "") + "</textarea></div>" +
        "</div>" + (id ? '<input type="hidden" name="id" value="' + id + '">' : "") + "</form>",
      footer:
        '<button class="btn btn-light" onclick="App.closeModal()">Cancelar</button>' +
        '<button class="btn btn-primary" id="emSave">Guardar</button>',
      onOpen: function () {
        document.getElementById("emSave").onclick = function () {
          var fd = new FormData(document.getElementById("formEmol"));
          var res = D.saveEmolumento({
            id: fd.get("id") || undefined, nome: fd.get("nome"), categoria: fd.get("categoria"),
            valor: U.parseMoeda(fd.get("valor")), curso: fd.get("curso"), tipoCurso: fd.get("tipoCurso"),
            unidade: fd.get("unidade"), estado: fd.get("estado"), observacoes: fd.get("observacoes")
          });
          if (res.error) { C.toast(res.error, "err"); return; }
          C.closeModal(); C.toast("Emolumento guardado.", "ok"); V.renderEmolumentos();
        };
      }
    });
  };

  V.cfgListas = function () {
    var db = D.db();
    var listas = [
      ["periodos", "Períodos"], ["regimes", "Regimes de aulas"],
      ["tiposCurso", "Tipos de curso"], ["unidades", "Unidades / Polos"],
      ["formasPagamento", "Formas de pagamento"], ["funcionarios", "Funcionários"]
    ];
    return '<div class="grid two-col" style="grid-template-columns:1fr 1fr">' +
      listas.map(function (l) {
        var key = l[0], nome = l[1], arr = db[key] || [];
        return '<div class="card"><div class="card-head"><h3>' + nome + "</h3></div>" +
          '<ul style="list-style:none;padding:0;margin:0" id="lista_' + key + '">' +
          arr.map(function (item, i) {
            return '<li class="flex spread" style="padding:7px 0;border-bottom:1px solid #eee">' +
              "<span>" + U.esc(item) + "</span>" +
              '<button class="btn btn-danger btn-sm" data-lista-del="' + key + '" data-idx="' + i + '">Remover</button></li>';
          }).join("") + "</ul>" +
          '<div class="flex mt"><input class="field" style="flex:1" id="add_' + key + '" placeholder="Adicionar...">' +
          '<button class="btn btn-light" data-lista-add="' + key + '">Adicionar</button></div></div>';
      }).join("") + "</div>";
  };
  V.cfgConta = function () {
    var a = D.auth();
    return '<form id="formConta" class="card"><div class="card-head"><h3>A minha conta</h3></div>' +
      '<p class="help">A autenticação é gerida pelo Supabase. Aqui pode atualizar o nome a mostrar ' +
      "e a sua palavra-passe. O e-mail/utilizador e o perfil são definidos pelo administrador.</p>" +
      '<div class="form-grid">' +
        '<div class="field"><label>E-mail / utilizador</label><input value="' + U.esc(a.user || "—") + '" disabled></div>' +
        '<div class="field"><label>Perfil</label><input value="' + U.esc(a.perfil || "—") + '" disabled></div>' +
        '<div class="field"><label>Nome a mostrar</label><input name="nome" value="' + U.esc(a.nome || "") + '"></div>' +
        '<div class="field"></div>' +
        '<div class="fieldset-title">Alterar palavra-passe</div>' +
        '<div class="field"><label>Nova palavra-passe</label><input type="password" name="novaPass" autocomplete="new-password" placeholder="(deixe vazio para manter)"></div>' +
        '<div class="field"><label>Confirmar nova palavra-passe</label><input type="password" name="novaPass2" autocomplete="new-password"></div>' +
      "</div>" +
      '<div class="form-actions">' +
        '<button type="button" class="btn btn-light" id="contaSair">Terminar sessão</button>' +
        '<button type="submit" class="btn btn-primary">Guardar conta</button>' +
      "</div></form>";
  };

  // ---- Utilizadores (apenas administrador) ----
  V.PERFIS = ["admin", "directora", "secretaria", "financeiro", "coordenador"];
  V.cfgUtilizadores = function () {
    return '<div class="card mb"><div class="card-head"><h3>Criar utilizador</h3></div>' +
      '<p class="help">Crie acessos para a equipa. Pode usar um <strong>nome de utilizador</strong> ' +
      "(ex.: <em>maria</em>) ou um <strong>email</strong>. A senha é definida por si e pode ser " +
      "redefinida aqui a qualquer momento.</p>" +
      '<form id="formNovoUser"><div class="form-grid">' +
        '<div class="field"><label>Nome a mostrar <span class="req">*</span></label><input name="nome" required></div>' +
        '<div class="field"><label>Nome de utilizador ou email <span class="req">*</span></label>' +
          '<input name="login" required placeholder="ex.: maria  ou  maria@exemplo.com"></div>' +
        '<div class="field"><label>Senha <span class="req">*</span></label>' +
          '<input name="password" type="text" required minlength="6" placeholder="mín. 6 caracteres"></div>' +
        '<div class="field"><label>Perfil</label><select name="perfil">' +
          U.optionList(V.PERFIS, "secretaria") + "</select></div>" +
      "</div>" +
      '<div class="form-actions"><button type="submit" class="btn btn-primary">Criar utilizador</button></div></form></div>' +
      '<div class="card"><div class="card-head"><h3>Utilizadores</h3>' +
        '<button class="btn btn-light" id="userReload">Atualizar</button></div>' +
        '<div id="usersTable">' + C.empty("", "A carregar…") + "</div></div>";
  };
  V.renderUtilizadores = function (users) {
    var host = document.getElementById("usersTable");
    if (!host) return;
    if (!users || !users.length) { host.innerHTML = C.empty("", "Sem utilizadores."); return; }
    var rows = users.map(function (u) {
      var sel = '<select class="userRole" data-id="' + u.id + '">' + U.optionList(V.PERFIS, u.perfil) + "</select>";
      return "<tr>" +
        "<td><strong>" + U.esc(u.nome || "—") + "</strong><br><small>" + U.esc(u.utilizador || "") + "</small></td>" +
        "<td>" + sel + "</td>" +
        "<td>" + (u.ativo ? '<span class="badge">Ativo</span>' : '<span class="badge gold">Inativo</span>') + "</td>" +
        '<td><div class="row-actions">' +
          '<button class="btn btn-light btn-sm" data-user-pass="' + u.id + '">Redefinir senha</button>' +
          '<button class="btn btn-light btn-sm" data-user-toggle="' + u.id + '" data-ativo="' + (u.ativo ? "1" : "0") + '">' +
            (u.ativo ? "Desativar" : "Ativar") + "</button>" +
          '<button class="btn btn-danger btn-sm" data-user-del="' + u.id + '">Eliminar</button>' +
        "</div></td></tr>";
    }).join("");
    host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      "<th>Utilizador</th><th>Perfil</th><th>Estado</th><th>Ações</th>" +
      "</tr></thead><tbody>" + rows + "</tbody></table></div>" +
      '<p class="help mt">' + users.length + " utilizador(es).</p>";
  };

  V.cfgImportar = function () {
    return '<div class="card"><div class="card-head"><h3>Importação em massa</h3></div>' +
      '<p class="help">Cole dados CSV (ou carregue um ficheiro <code>.csv</code>). A 1ª linha são os cabeçalhos.<br>' +
      "<strong>Estudantes:</strong> <code>nome;contacto;curso;bi;whatsapp;periodo;unidade;dataMatricula;estado</code><br>" +
      "<strong>Pagamentos:</strong> <code>estudante;valor;categoria;forma;data</code> (estudante = nome ou nº de matrícula)</p>" +
      '<div class="form-grid">' +
        '<div class="field"><label>Tipo de dados</label><select id="impTipo">' + U.optionList(["Estudantes", "Pagamentos"]) + "</select></div>" +
        '<div class="field"><label>Ficheiro CSV</label><input type="file" accept=".csv,text/csv" id="impFile"></div>' +
      "</div>" +
      '<div class="field full"><label>Ou colar CSV aqui</label><textarea id="impText" rows="6" placeholder="nome;contacto;curso&#10;Maria Silva;923000000;Curso Médio de Enfermagem"></textarea></div>' +
      '<div class="form-actions">' +
        '<button class="btn btn-light" id="impPrever">Pré-visualizar</button>' +
        '<button class="btn btn-primary" id="impImportar" disabled>Importar</button>' +
      '</div><div id="impPreview"></div></div>';
  };

  V.cfgAuditoria = function () {
    var tabelas = ["estudantes", "pagamentos", "cursos", "emolumentos", "fechos", "estagios"];
    return '<div class="card"><div class="card-head"><h3>Auditoria</h3>' +
      '<button class="btn btn-light" id="audReload">Atualizar</button></div>' +
      '<p class="help">Registo de quem criou, editou ou eliminou dados, e quando.</p>' +
      '<div class="toolbar">' +
        '<div class="field"><label>Tabela</label><select id="audTabela"><option value="">Todas</option>' + U.optionList(tabelas) + "</select></div>" +
        '<div class="field"><label>Ação</label><select id="audAccao"><option value="">Todas</option>' + U.optionList(["INSERT", "UPDATE", "DELETE"]) + "</select></div>" +
      '</div><div id="audTable">' + C.empty("", "A carregar…") + "</div></div>";
  };
  V.renderAuditoria = function (rows) {
    var host = document.getElementById("audTable");
    if (!host) return;
    if (!rows || !rows.length) { host.innerHTML = C.empty("", "Sem registos de auditoria."); return; }
    var accaoPT = { INSERT: "Criou", UPDATE: "Editou", DELETE: "Eliminou" };
    var trs = rows.map(function (r) {
      return "<tr><td>" + U.dataHoraPT(r.quando) + "</td><td>" + U.esc(r.utilizador_nome || "—") + "</td>" +
        "<td>" + U.esc(accaoPT[r.accao] || r.accao) + "</td><td>" + U.esc(r.tabela) + "</td>" +
        "<td><small>" + U.esc(r.registo_id || "") + "</small></td></tr>";
    }).join("");
    host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr><th>Data/Hora</th><th>Utilizador</th><th>Ação</th><th>Módulo</th><th>Registo</th></tr></thead><tbody>' +
      trs + "</tbody></table></div><p class='help mt'>" + rows.length + " registo(s) (máx. 300).</p>";
  };

  V.cfgDados = function () {
    var db = D.db();
    return '<div class="card"><div class="card-head"><h3>Cópia de segurança e reposição</h3></div>' +
      "<p class='help'>Os dados são guardados no navegador deste computador. Exporte regularmente para não perder informação.</p>" +
      '<div class="grid stats mb" style="grid-template-columns:repeat(3,1fr)">' +
        V._stat("Estudantes", db.estudantes.length, "") +
        V._stat("Pagamentos", db.pagamentos.length, "") +
        V._stat("Cursos", db.cursos.length, "") +
      "</div>" +
      '<div class="flex">' +
        '<button class="btn btn-primary" id="bkExport">Exportar backup (JSON)</button>' +
        '<button class="btn btn-light" id="bkImportBtn">Importar backup</button>' +
        '<input type="file" id="bkImportFile" accept="application/json" style="display:none">' +
        '<button class="btn btn-light" id="bkCatalogo">Repor catálogo de cursos oficial</button>' +
        '<button class="btn btn-danger" id="bkReset">Repor dados de fábrica</button>' +
      "</div>" +
      "<p class='help mt'>“Repor catálogo de cursos” substitui apenas a lista de cursos pelo catálogo oficial, mantendo estudantes e pagamentos.</p>" +
      "</div>" +
      '<div class="card mt"><div class="card-head"><h3>Reciclagem (recuperação de eliminados)</h3>' +
        '<button class="btn btn-light" id="lixoEsvaziar">Esvaziar reciclagem</button></div>' +
        '<p class="help">Estudantes e pagamentos eliminados ficam aqui e podem ser restaurados.</p>' +
        '<div id="lixoArea"></div></div>';
  };
  V.renderLixo = function () {
    var host = document.getElementById("lixoArea");
    if (!host) return;
    var list = D.lixo();
    if (!list.length) { host.innerHTML = C.empty("", "A reciclagem está vazia."); return; }
    var rows = list.map(function (it) {
      var r = it.registo || {};
      var desc = it.tipo === "estudante" ? (r.nome + " · " + r.matricula) : (r.recibo + " · " + r.estudanteNome + " · " + U.moeda(r.valorPago));
      return "<tr><td>" + (it.tipo === "estudante" ? "Estudante" : "Pagamento") + "</td>" +
        "<td>" + U.esc(desc) + "</td><td>" + U.dataHoraPT(it.eliminadoEm) + "</td>" +
        '<td><button class="btn btn-primary btn-sm" data-lixo-restore="' + it.id + '">Restaurar</button></td></tr>';
    }).join("");
    host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr><th>Tipo</th><th>Registo</th><th>Eliminado em</th><th></th></tr></thead><tbody>' +
      rows + "</tbody></table></div>";
  };

  /* =======================================================================
     9. MIDAS 2026 — Estágios e Aptidão para a Defesa
     ======================================================================= */
  V.midas = function () {
    return C.pageHead("MIDAS 2026", "Gestão de finalistas — estágios e aptidão para a defesa") +
      '<div class="tabs" id="midasTabs">' +
        '<div class="tab active" data-tab="estagios">Estágios</div>' +
        '<div class="tab" data-tab="aptidao">Aptidão para Defesa</div>' +
      '</div><div id="midasContent"></div>';
  };
  V.ESTAGIO_TIPOS = ["Preliminar", "Curricular"];
  V.ESTAGIO_ESTADOS = ["Por iniciar", "A decorrer", "Concluído", "Reprovado"];
  V.estagiosTab = function () {
    return '<div class="card"><div class="card-head"><h3>Estágios</h3>' +
      '<div class="flex" style="gap:8px">' +
        '<button class="btn btn-light" id="estagioCsv">Exportar CSV</button>' +
        '<button class="btn btn-light" id="estagioPdf">Imprimir mapa</button>' +
        '<button class="btn btn-primary" id="estagioNovo">Novo estágio</button></div></div>' +
      '<div class="toolbar">' +
        '<div class="search-box"><input id="estagioSearch" placeholder="Pesquisar por estudante, matrícula, local, supervisor..."></div>' +
        '<div class="field"><label>Curso</label><select id="estagioFiltroCurso"><option value="">Todos</option>' + U.optionList(D.cursos().map(function (c) { return c.nome; })) + "</select></div>" +
        '<div class="field"><label>Tipo</label><select id="estagioFiltroTipo"><option value="">Todos</option>' + U.optionList(V.ESTAGIO_TIPOS) + "</select></div>" +
        '<div class="field"><label>Estado</label><select id="estagioFiltroEstado"><option value="">Todos</option>' + U.optionList(V.ESTAGIO_ESTADOS) + "</select></div>" +
      '</div><div id="estagioTable"></div></div>';
  };
  // Lista de estágios filtrada (partilhada por render/exportação).
  V._estagiosFiltrados = function () {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value : ""; };
    var q = (g("estagioSearch") || "").toLowerCase();
    var fcur = g("estagioFiltroCurso"), ft = g("estagioFiltroTipo"), fe = g("estagioFiltroEstado");
    return D.estagios().filter(function (e) {
      if (fcur && e.curso !== fcur) return false;
      if (ft && e.tipo !== ft) return false;
      if (fe && e.estado !== fe) return false;
      if (q && (e.estudanteNome + " " + (e.matricula || "") + " " + (e.local || "") + " " + (e.supervisor || "") + " " + (e.curso || "")).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { return (a.dataInicio || "") < (b.dataInicio || "") ? 1 : -1; });
  };
  V._duracaoEstagio = function (e) {
    if (e.dataInicio && e.dataFim) {
      var d1 = new Date(e.dataInicio.slice(0, 10) + "T00:00:00");
      var d2 = new Date(e.dataFim.slice(0, 10) + "T00:00:00");
      if (!isNaN(d1) && !isNaN(d2) && d2 >= d1) {
        var dias = Math.round((d2 - d1) / 86400000) + 1;
        if (dias < 31) return dias + (dias > 1 ? " dias" : " dia");
        var meses = Math.round(dias / 30);
        return meses + (meses > 1 ? " meses" : " mês");
      }
    }
    return e.cargaHoraria ? U.esc(String(e.cargaHoraria)) : "—";
  };
  V._estagioEstadoBadge = function (estado) {
    var cls = (estado || "").toLowerCase().indexOf("conclu") >= 0 ? "ok"
      : (estado === "Reprovado" ? "danger" : (estado === "A decorrer" ? "info" : "off"));
    return '<span class="badge ' + cls + '">' + U.esc(estado || "—") + "</span>";
  };
  V.renderEstagios = function () {
    var todos = D.estagios();
    var list = V._estagiosFiltrados();
    var host = document.getElementById("estagioTable");
    var cont = function (f) { return todos.filter(f).length; };
    var statsHtml = '<div class="grid stats mb">' +
      V._stat("Total", todos.length, { icon: "book" }) +
      V._stat("Em curso", cont(function (e) { return e.estado === "A decorrer"; }), { icon: "trend", accent: "info" }) +
      V._stat("Concluídos", cont(function (e) { return (e.estado || "").toLowerCase().indexOf("conclu") >= 0; }), { icon: "userCheck", accent: "green" }) +
      V._stat("Curriculares", cont(function (e) { return e.tipo === "Curricular"; }), { icon: "cap" }) +
      V._stat("Preliminares", cont(function (e) { return e.tipo === "Preliminar"; }), { icon: "layers" }) + "</div>";
    if (!list.length) { host.innerHTML = statsHtml + C.empty("", "Nenhum estágio encontrado."); return; }
    var rows = list.map(function (e) {
      var semFim = !e.dataFim && (e.estado === "A decorrer" || e.estado === "Por iniciar");
      return "<tr><td><strong>" + U.esc(e.estudanteNome) + "</strong><br><small>" + U.esc(e.matricula || "") + " · " + U.esc(e.curso || "") + "</small></td>" +
        '<td><span class="badge gold">' + U.esc(e.tipo) + "</span></td>" +
        "<td>" + U.esc(e.local || "—") + "<br><small>" + U.esc(e.supervisor || "") + "</small></td>" +
        "<td>" + U.dataPT(e.dataInicio) + "<br><small>até " + U.dataPT(e.dataFim) +
          (semFim ? ' <span class="badge warn">⚠ sem término</span>' : "") + "</small></td>" +
        "<td>" + V._duracaoEstagio(e) + "</td>" +
        "<td>" + V._estagioEstadoBadge(e.estado) + "</td>" +
        '<td><div class="row-actions"><button class="btn btn-light btn-sm" data-estagio-edit="' + e.id + '">Editar</button>' +
        '<button class="btn btn-danger btn-sm" data-estagio-del="' + e.id + '">Eliminar</button></div></td></tr>';
    }).join("");
    host.innerHTML = statsHtml + '<div class="table-wrap"><table class="data"><thead><tr>' +
      "<th>Estudante</th><th>Tipo</th><th>Local / Supervisor</th><th>Período</th><th>Duração</th><th>Estado</th><th>Ações</th>" +
      "</tr></thead><tbody>" + rows + "</tbody></table></div><p class='help mt'>" + list.length + " estágio(s).</p>";
  };
  V._mapaEstagiosHTML = function (list) {
    var s = D.db().settings;
    var linhas = list.length ? list.map(function (e) {
      return "<tr><td>" + U.esc(e.estudanteNome) + "</td><td>" + U.esc(e.matricula || "") + "</td><td>" + U.esc(e.curso || "") +
        "</td><td>" + U.esc(e.tipo || "") + "</td><td>" + U.esc(e.local || "") + "</td><td>" + U.esc(e.supervisor || "") +
        "</td><td>" + U.dataPT(e.dataInicio) + " a " + U.dataPT(e.dataFim) + "</td><td>" + U.esc(V._duracaoEstagio(e)) +
        "</td><td>" + U.esc(e.estado || "") + "</td></tr>";
    }).join("") : "<tr><td colspan='9' style='text-align:center;color:#888'>Sem estágios.</td></tr>";
    return '<div class="print-sheet" id="mapaEstagiosDoc">' +
      '<div class="ps-head"><div><h2>Mapa de Estágios</h2><div>' + U.dataPT(U.hoje()) + " · " + list.length + " registo(s)</div></div>" +
        '<div class="org"><img src="' + U.logoURL(true) + '" alt="" style="height:42px"><br><strong>' + U.esc(s.instituicao) + "</strong></div></div>" +
      "<table><thead><tr><th>Estudante</th><th>Matrícula</th><th>Curso</th><th>Tipo</th><th>Local</th><th>Supervisor</th><th>Período</th><th>Duração</th><th>Estado</th></tr></thead><tbody>" +
      linhas + "</tbody></table>" + C._docFoot() + "</div>";
  };
  V.editarEstagio = function (id) {
    var e = id ? D.estagioById(id) : {};
    var estList = D.estudantes().slice().sort(function (a, b) { return a.nome < b.nome ? -1 : 1; })
      .map(function (x) { return '<option value="' + U.esc(x.nome + " · " + x.matricula) + '"></option>'; }).join("");
    var f = function (n, l, t, v) {
      return '<div class="field"><label>' + l + "</label><input type='" + (t || "text") + "' name='" + n + "' id='esg_" + n + "' value='" + (v == null ? "" : U.esc(v)) + "'></div>";
    };
    C.modal({
      title: id ? "Editar Estágio" : "Novo Estágio",
      body: '<form id="formEstagio">' +
        '<p class="help" style="margin-top:0">Escreva o nome do estudante — se já existir, os dados são preenchidos. ' +
        "Pode também escrever manualmente se ainda não estiver cadastrado.</p>" +
        '<div class="form-grid">' +
        '<div class="field full"><label>Nome do estudante <span class="req">*</span></label>' +
          '<input id="esgNome" list="esgList" autocomplete="off" placeholder="Escreva o nome..." value="' + (e.estudanteNome ? U.esc(e.estudanteNome) : "") + '">' +
          '<datalist id="esgList">' + estList + "</datalist>" +
          '<input type="hidden" name="estudanteId" id="esgId" value="' + (e.estudanteId || "") + '"></div>' +
        f("matricula", "Nº de matrícula", "text", e.matricula) +
        f("contacto", "Contacto", "tel", e.contacto) +
        '<div class="field"><label>Curso</label><input name="curso" id="esg_curso" list="esgCursos" value="' + U.esc(e.curso || "") + '">' +
          '<datalist id="esgCursos">' + D.cursos().map(function (c) { return '<option value="' + U.esc(c.nome) + '"></option>'; }).join("") + "</datalist></div>" +
        '<div class="field"><label>Tipo de estágio</label><select name="tipo">' + U.optionList(V.ESTAGIO_TIPOS, e.tipo || "Curricular") + "</select></div>" +
        '<div class="field"><label>Estado</label><select name="estado">' + U.optionList(V.ESTAGIO_ESTADOS, e.estado || "Por iniciar") + "</select></div>" +
        f("local", "Local de estágio", "text", e.local) +
        f("supervisor", "Supervisor", "text", e.supervisor) +
        f("dataInicio", "Data de início", "date", e.dataInicio) +
        f("dataFim", "Data de término", "date", e.dataFim) +
        f("cargaHoraria", "Carga horária", "text", e.cargaHoraria) +
        '<div class="field full"><label>Observações</label><textarea name="observacoes">' + U.esc(e.observacoes || "") + "</textarea></div>" +
        "</div>" + (id ? "<input type='hidden' name='id' value='" + id + "'>" : "") + "</form>",
      footer:
        '<button class="btn btn-light" onclick="App.closeModal()">Cancelar</button>' +
        '<button class="btn btn-primary" id="esgSave">Guardar</button>',
      onOpen: function () {
        var nome = document.getElementById("esgNome"), hid = document.getElementById("esgId");
        var setIf = function (idf, v) { var el = document.getElementById(idf); if (el && (!el.value || el.value === "")) el.value = v == null ? "" : v; };
        nome.addEventListener("input", function () {
          var s = V.resolverEstudante(this.value);
          hid.value = s ? s.id : "";
          if (s) { // preenche (sem apagar o que já estiver)
            setIf("esg_matricula", s.matricula); setIf("esg_contacto", s.contacto);
            var cu = document.getElementById("esg_curso"); if (cu && !cu.value) cu.value = s.curso || "";
          }
        });
        document.getElementById("esgSave").onclick = function () {
          var fd = new FormData(document.getElementById("formEstagio"));
          var nm = (nome.value || "").split(" · ")[0].trim();
          if (nm.length < 2) { C.toast("Indique o nome do estudante.", "err"); return; }
          var est = D.estudanteById(hid.value) || V.resolverEstudante(nome.value);
          D.saveEstagio({
            id: fd.get("id") || undefined,
            estudanteId: est ? est.id : "",
            estudanteNome: est ? est.nome : nm,
            matricula: fd.get("matricula") || (est ? est.matricula : ""),
            contacto: fd.get("contacto") || (est ? est.contacto : ""),
            curso: fd.get("curso") || (est ? est.curso : ""),
            tipo: fd.get("tipo"), estado: fd.get("estado"), local: fd.get("local"), supervisor: fd.get("supervisor"),
            dataInicio: fd.get("dataInicio"), dataFim: fd.get("dataFim"), cargaHoraria: fd.get("cargaHoraria"),
            observacoes: fd.get("observacoes")
          });
          C.closeModal(); C.toast("Estágio guardado.", "ok"); V.renderEstagios();
        };
      }
    });
  };
  V.aptidaoTab = function () {
    var ativos = D.criteriosAptidaoAtivos().map(function (c) { return c.nome; }).join(", ");
    var podeConfig = !window.MidasUsers || ["admin", "directora"].indexOf(D.auth().perfil) >= 0;
    return '<div class="card"><div class="card-head"><h3>Aptidão para a Defesa</h3>' +
      (podeConfig ? '<button class="btn btn-light" id="aptConfig">Configurar critérios</button>' : "") + "</div>" +
      '<p class="help"><strong>Critérios exigidos:</strong> ' + U.esc(ativos || "—") + ".</p>" +
      '<div class="toolbar"><div class="search-box"><input id="aptSearch" placeholder="Pesquisar estudante..."></div>' +
        '<div class="field"><label>Curso</label><select id="aptCurso"><option value="">Todos</option>' + U.optionList(D.cursos().map(function (c) { return c.nome; })) + "</select></div>" +
        '<div class="field"><label>Situação</label><select id="aptEstado"><option value="">Todos</option>' + U.optionList(["Apto", "Não apto"]) + "</select></div>" +
      '</div><div id="aptStats" class="grid stats mb"></div><div id="aptTable"></div></div>';
  };
  V.configurarAptidao = function () {
    var ativos = D.criteriosAptidaoAtivos().map(function (c) { return c.id; });
    var linhas = D._CRITERIOS_APTIDAO.map(function (c) {
      var on = ativos.indexOf(c.id) >= 0;
      return '<label class="check-row"><input type="checkbox" class="aptCrit" value="' + c.id + '"' +
        (on ? " checked" : "") + "> " + U.esc(c.nome) + "</label>";
    }).join("");
    C.modal({
      title: "Critérios de Aptidão à Defesa",
      body: '<p class="help" style="margin-top:0">Marque as condições exigidas para um estudante poder defender. ' +
        "Aplica-se imediatamente a todos os estudantes.</p>" + '<div class="check-list">' + linhas + "</div>",
      footer: '<button class="btn btn-light" onclick="App.closeModal()">Cancelar</button>' +
        '<button class="btn btn-primary" id="aptCritSave">Guardar critérios</button>',
      onOpen: function () {
        document.getElementById("aptCritSave").onclick = function () {
          var ids = [].slice.call(document.querySelectorAll(".aptCrit:checked")).map(function (el) { return el.value; });
          D.db().settings.criteriosAptidao = ids;
          D.save();
          C.closeModal(); C.toast("Critérios atualizados.", "ok");
          if (App.current === "midas") App.refresh();
        };
      }
    });
  };
  V._estagioCurricular = function (estId) {
    return D.estagiosDeEstudante(estId).filter(function (e) { return e.tipo === "Curricular"; })
      .sort(function (a, b) { return (a.dataInicio || "") < (b.dataInicio || "") ? 1 : -1; })[0];
  };
  V.renderAptidao = function () {
    var q = (document.getElementById("aptSearch").value || "").toLowerCase();
    var fc = document.getElementById("aptCurso").value;
    var fe = document.getElementById("aptEstado").value;
    var avals = D.estudantes().filter(function (e) {
      if (fc && e.curso !== fc) return false;
      if (q && (e.nome + " " + e.matricula).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).map(function (e) { return { e: e, r: D.aptidaoDefesa(e), saldo: D.saldoDevedor(e), eg: V._estagioCurricular(e.id) }; });
    if (fe) avals = avals.filter(function (a) { return fe === "Apto" ? a.r.apto : !a.r.apto; });
    var aptos = avals.filter(function (a) { return a.r.apto; }).length;
    var pct = avals.length ? Math.round((aptos / avals.length) * 100) : 0;
    var stats = document.getElementById("aptStats");
    if (stats) stats.innerHTML =
      V._stat("Total avaliados", avals.length, { icon: "users" }) +
      V._stat("Aptos", aptos, { icon: "userCheck", accent: "green" }) +
      V._stat("Não aptos", avals.length - aptos, { icon: "alert", accent: "danger" }) +
      V._stat("Taxa de aptidão", pct + "%", { icon: "trend", accent: "gold" });
    var host = document.getElementById("aptTable");
    if (!avals.length) { host.innerHTML = C.empty("", "Sem estudantes para mostrar."); return; }
    var rows = avals.sort(function (a, b) { return a.r.apto === b.r.apto ? 0 : (a.r.apto ? 1 : -1); }).map(function (a) {
      var fin = a.saldo <= 0 ? '<span class="badge ok">Regularizado</span>' : '<span class="badge danger">Dívida ' + U.moeda(a.saldo) + "</span>";
      var eg = a.eg ? V._estagioEstadoBadge(a.eg.estado) : '<span class="badge off">Sem estágio</span>';
      return "<tr><td><strong>" + U.esc(a.e.nome) + "</strong><br><small>" + U.esc(a.e.matricula) + "</small></td>" +
        "<td>" + U.esc(a.e.curso || "—") + "</td>" +
        "<td>" + fin + "</td>" +
        "<td>" + eg + "</td>" +
        "<td>" + (a.r.apto ? '<span class="badge ok">Apto</span>' : '<span class="badge danger">Não apto</span>') + "</td>" +
        "<td><small>" + (a.r.apto ? "—" : U.esc(a.r.motivos.join("; "))) + "</small></td>" +
        '<td><button class="btn btn-light btn-sm" data-apt-view="' + a.e.id + '">Ver</button></td></tr>';
    }).join("");
    host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      "<th>Estudante</th><th>Curso</th><th>Financeiro</th><th>Estágio curricular</th><th>Situação</th><th>Em falta</th><th></th>" +
      "</tr></thead><tbody>" + rows + "</tbody></table></div><p class='help mt'>" + avals.length + " estudante(s).</p>";
  };
  V.aptidaoDetalhe = function (estId) {
    var est = D.estudanteById(estId);
    if (!est) return;
    var r = D.aptidaoDefesa(est);
    var saldo = D.saldoDevedor(est);
    var eg = V._estagioCurricular(est.id);
    var pags = D.pagamentosDeEstudante(est.id).sort(U.by("data"));
    var pagRows = pags.length ? pags.map(function (p) {
      return "<tr><td>" + U.dataPT(p.data) + "</td><td>" + U.esc(p.recibo || "") + "</td><td>" + U.esc(p.emolumento || "") +
        "</td><td class='text-right num'>" + U.moeda(p.valorPago) + "</td></tr>";
    }).join("") : "<tr><td colspan='4' style='text-align:center;color:#888'>Sem pagamentos.</td></tr>";
    var critList = r.criterios.map(function (c) {
      return '<li class="' + (c.ok ? "crit-ok" : "crit-no") + '">' + (c.ok ? "✔ " : "✘ ") + U.esc(c.nome) + "</li>";
    }).join("");
    C.modal({
      title: "Aptidão — " + est.nome,
      body:
        '<div class="dl mb">' +
          '<div class="dl-item"><div class="k">Curso</div><div class="v">' + U.esc(est.curso || "—") + "</div></div>" +
          '<div class="dl-item"><div class="k">Situação</div><div class="v">' + (r.apto ? '<span class="badge ok">Apto</span>' : '<span class="badge danger">Não apto</span>') + "</div></div>" +
          '<div class="dl-item"><div class="k">Financeiro</div><div class="v">' + (saldo <= 0 ? "Regularizado" : "Em dívida: " + U.moeda(saldo)) + "</div></div>" +
          '<div class="dl-item"><div class="k">Estágio curricular</div><div class="v">' + (eg ? U.esc(eg.estado) + (eg.local ? " · " + U.esc(eg.local) : "") : "Não registado") + "</div></div>" +
        "</div>" +
        (r.apto ? '<p class="crit-ok" style="font-weight:600">✔ Cumpre todos os critérios exigidos.</p>'
                : '<p class="crit-no" style="font-weight:600">✘ Não apto. Em falta: ' + U.esc(r.motivos.join("; ")) + ".</p>") +
        '<h4>Critérios</h4><ul class="crit-list">' + critList + "</ul>" +
        "<h4>Pagamentos encontrados</h4>" +
        '<div class="table-wrap"><table class="data"><thead><tr><th>Data</th><th>Recibo</th><th>Emolumento</th><th class="text-right">Valor</th></tr></thead><tbody>' +
        pagRows + "</tbody></table></div>",
      footer: '<button class="btn btn-light" onclick="App.closeModal()">Fechar</button>'
    });
  };

  /* =======================================================================
     TURMAS (visão calculada: curso + período + ano letivo)
     ======================================================================= */
  V.TURMA_PERIODOS = ["Manhã", "Tarde", "Fim de Semana"];
  // ---- Componente reutilizável: pesquisa inteligente de estudante ----
  V.buscaInteligenteHTML = function (id, placeholder, value, opts) {
    opts = opts || {};
    return '<div class="busca-int">' +
      '<input id="' + id + '" class="busca-int-input" autocomplete="off" placeholder="' +
        U.esc(placeholder || "Escreva o nome do estudante…") + '" value="' + U.esc(value || "") + '">' +
      (opts.hiddenId ? "" : '<input type="hidden" id="' + id + '_id">') +
      '<div class="bi-chip" id="' + id + '_chip" hidden></div>' +
      '<div class="busca-int-pop" id="' + id + '_pop" hidden></div></div>';
  };
  V.wireBuscaInteligente = function (id, onPick, hiddenId) {
    var inp = document.getElementById(id), pop = document.getElementById(id + "_pop");
    var hid = document.getElementById(hiddenId || (id + "_id"));
    var chip = document.getElementById(id + "_chip");
    if (!inp || !pop) return;
    // Mostra "✓ Ligado a …" quando há um estudante existente associado (hid.value).
    var setChip = function (e) {
      if (!chip) return;
      if (e) {
        var info = [e.matricula, e.curso].filter(Boolean).map(U.esc).join(" · ");
        chip.innerHTML = '<span>✓ Ligado a <strong>' + U.esc(e.nome) + "</strong>" +
          (info ? " · " + info : "") + "</span>" +
          '<button type="button" class="bi-chip-x" aria-label="Desligar">×</button>';
        chip.hidden = false;
      } else { chip.innerHTML = ""; chip.hidden = true; }
    };
    var render = function () {
      var res = D.pesquisarEstudantes(inp.value, 8);
      if (!inp.value.trim() || !res.length) { pop.hidden = true; pop.innerHTML = ""; return; }
      pop.innerHTML = res.map(function (e) {
        return '<div class="bi-opt" data-id="' + e.id + '"><strong>' + U.esc(e.nome) + "</strong>" +
          "<small>" + U.esc(e.curso || "—") + " · " + U.esc(e.periodo || "—") + " · " + U.esc(e.matricula || "") + "</small></div>";
      }).join("");
      pop.hidden = false;
    };
    // Editar o nome quebra o vínculo (evita pagar/abrir o estudante errado).
    inp.addEventListener("input", function () { if (hid) hid.value = ""; setChip(null); render(); });
    inp.addEventListener("focus", render);
    pop.addEventListener("click", function (ev) {
      var o = ev.target.closest(".bi-opt"); if (!o) return;
      var e = D.estudanteById(o.getAttribute("data-id"));
      if (e) { inp.value = e.nome; if (hid) hid.value = e.id; pop.hidden = true; setChip(e); if (onPick) onPick(e); }
    });
    if (chip) chip.addEventListener("click", function (ev) {
      if (!ev.target.closest(".bi-chip-x")) return;
      if (hid) hid.value = ""; inp.value = ""; setChip(null); inp.focus();
    });
    document.addEventListener("click", function (ev) { if (inp.parentNode && !inp.parentNode.contains(ev.target)) pop.hidden = true; });
    // Estado inicial: se já vier um estudante ligado (ex.: pagamento aberto a partir da ficha).
    if (hid && hid.value) setChip(D.estudanteById(hid.value));
  };

  V.turmas = function (params) {
    if (params && params.turma) return V._turmaDetalhe(params.turma);
    return C.pageHead("Turmas", "Turmas geradas automaticamente por curso, período e ano letivo.") +
      '<div class="card mb"><div class="card-head"><h3>Pesquisa rápida de estudante</h3></div>' +
        V.buscaInteligenteHTML("tuBusca", "Escreva o nome — sugere por curso, período e matrícula…") +
        '<p class="help" style="margin-top:8px">Selecione um estudante para abrir a ficha.</p></div>' +
      '<div class="card mb"><div class="toolbar">' +
        '<div class="search-box"><input id="tuSearch" placeholder="Pesquisar estudante (nome, matrícula, contacto)…"></div>' +
        '<div class="field"><label>Curso</label><select id="tuCurso"><option value="">Todos</option>' + U.optionList(D.cursos().map(function (c) { return c.nome; })) + "</select></div>" +
        '<div class="field"><label>Período</label><select id="tuPeriodo"><option value="">Todos</option>' + U.optionList(V.TURMA_PERIODOS) + "</select></div>" +
      "</div></div><div id=\"tuLista\"></div>";
  };
  V.renderTurmasLista = function () {
    var fc = (document.getElementById("tuCurso") || {}).value || "";
    var fp = (document.getElementById("tuPeriodo") || {}).value || "";
    var q = (document.getElementById("tuSearch") || {}).value || "";
    var nq = q ? D._normNome(q) : "";
    var list = D.turmas().filter(function (t) {
      if (fc && t.curso !== fc) return false;
      if (fp && t.periodo !== fp) return false;
      if (nq) return t.estudantes.some(function (e) {
        return D._normNome((e.nome || "") + " " + (e.matricula || "") + " " + (e.contacto || "")).indexOf(nq) >= 0;
      });
      return true;
    });
    var host = document.getElementById("tuLista");
    if (!host) return;
    var nAlunos = list.reduce(function (s, t) { return s + t.total; }, 0);
    var stats = '<div class="grid stats mb">' +
      V._stat("Turmas", list.length, { icon: "layers" }) +
      V._stat("Estudantes", nAlunos, { icon: "users" }) + "</div>";
    if (!list.length) { host.innerHTML = stats + C.empty("", "Nenhuma turma encontrada."); return; }
    var cards = list.map(function (t) {
      return '<div class="card turma-card" data-turma="' + U.esc(t.id) + '">' +
        '<div class="card-head"><h3>' + U.esc(t.curso) + "</h3></div>" +
        '<p class="help" style="margin:0 0 10px">' + U.esc(t.periodo) + " · " + U.esc(t.anoLectivo) + "</p>" +
        '<div class="turma-nums">' +
          '<span><strong>' + t.total + "</strong> estudantes</span>" +
          '<span class="crit-ok"><strong>' + t.regularizados + "</strong> regularizados</span>" +
          '<span class="crit-no"><strong>' + t.comDivida + "</strong> com dívida</span>" +
        "</div></div>";
    }).join("");
    host.innerHTML = stats + '<div class="grid three-col">' + cards + "</div>";
  };
  V._turmaDetalhe = function (turmaId) {
    var t = D.turmaById(turmaId);
    if (!t) return C.pageHead("Turma", "") + C.empty("", "Turma não encontrada.") +
      '<button class="btn btn-light" data-go="turmas">‹ Voltar às turmas</button>';
    V._turmaAtual = turmaId;
    return C.pageHead(t.curso + " — " + t.periodo + " — " + t.anoLectivo, t.total + " estudante(s)",
      '<button class="btn btn-light" data-go="turmas">‹ Turmas</button>' +
      '<button class="btn btn-light" id="tuCsv">Exportar CSV</button>' +
      '<button class="btn btn-light" id="tuPdf">Imprimir lista</button>' +
      '<button class="btn btn-light" id="tuConferir">Conferir lista colada</button>') +
      '<div class="card mb"><div class="grid stats">' +
        V._stat("Estudantes", t.total, { icon: "users" }) +
        V._stat("Regularizados", t.regularizados, { icon: "userCheck", accent: "green" }) +
        V._stat("Com dívida", t.comDivida, { icon: "alert", accent: "danger" }) + "</div></div>" +
      '<div class="card"><div class="toolbar">' +
        '<div class="search-box"><input id="tuEstSearch" placeholder="Filtrar por nome / matrícula…"></div>' +
        '<div class="field"><label>Estado</label><select id="tuEstEstado"><option value="">Todos</option>' + U.optionList(["ativo", "pendente", "concluído", "desistente"]) + "</select></div>" +
        '<div class="field"><label>Situação</label><select id="tuEstFin"><option value="">Todas</option>' + U.optionList(["Regularizados", "Com dívida"]) + "</select></div>" +
      '</div><div id="tuEstTable"></div></div>';
  };
  V._turmaEstudantesFiltrados = function () {
    var t = D.turmaById(V._turmaAtual);
    if (!t) return [];
    var q = D._normNome((document.getElementById("tuEstSearch") || {}).value || "");
    var fe = (document.getElementById("tuEstEstado") || {}).value || "";
    var ff = (document.getElementById("tuEstFin") || {}).value || "";
    return t.estudantes.filter(function (e) {
      if (fe && e.estado !== fe) return false;
      if (ff) { var dv = D.saldoDevedor(e) > 0; if (ff === "Com dívida" && !dv) return false; if (ff === "Regularizados" && dv) return false; }
      if (q && D._normNome((e.nome || "") + " " + (e.matricula || "") + " " + (e.contacto || "")).indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { return (a.nome || "") < (b.nome || "") ? -1 : 1; });
  };
  V.renderTurmaEstudantes = function () {
    var host = document.getElementById("tuEstTable");
    if (!host) return;
    var list = V._turmaEstudantesFiltrados();
    if (!list.length) { host.innerHTML = C.empty("", "Sem estudantes para mostrar."); return; }
    var rows = list.map(function (e, i) {
      var pago = D.totalPagoEstudante(e.id), saldo = D.saldoDevedor(e), up = D.ultimoPagamentoDe(e.id);
      return "<tr><td>" + (i + 1) + "</td>" +
        "<td><strong>" + U.esc(e.nome) + "</strong></td>" +
        "<td>" + U.esc(e.matricula || "—") + "</td><td>" + U.esc(e.contacto || "—") + "</td>" +
        "<td>" + U.esc(e.periodo || "—") + "</td><td>" + C.estadoBadge(e.estado) + "</td>" +
        "<td class='text-right num'>" + U.moeda(pago) + "</td>" +
        "<td class='text-right num'>" + (saldo > 0 ? '<span class="crit-no">' + U.moeda(saldo) + "</span>" : "—") + "</td>" +
        "<td>" + (up ? U.dataPT(up.data) : "—") + "</td>" +
        '<td><div class="row-actions">' +
          '<button class="btn btn-light btn-sm" data-est-view="' + e.id + '">Ver</button>' +
          '<button class="btn btn-light btn-sm" data-est-pay="' + e.id + '">Pagamento</button>' +
          '<button class="btn btn-light btn-sm" data-est-extrato="' + e.id + '">Extrato</button>' +
        "</div></td></tr>";
    }).join("");
    host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      "<th>Nº</th><th>Nome</th><th>Matrícula</th><th>Contacto</th><th>Período</th><th>Estado</th>" +
      '<th class="text-right">Total pago</th><th class="text-right">Em dívida</th><th>Último pag.</th><th>Ações</th>' +
      "</tr></thead><tbody>" + rows + "</tbody></table></div><p class='help mt'>" + list.length + " estudante(s).</p>";
  };
  // §10 — conferir lista de nomes colada (não cria estudantes; só confere)
  V.conferirListaTurma = function () {
    C.modal({
      title: "Conferir lista de nomes",
      body: '<p class="help" style="margin-top:0">Cole uma lista de nomes (um por linha). O sistema compara com os estudantes ' +
        "cadastrados — <strong>não cria</strong> nem duplica ninguém.</p>" +
        '<textarea id="confLista" rows="8" placeholder="Ana Maria\nJoão Pedro\n..."></textarea>' +
        '<div class="form-actions"><button class="btn btn-primary" id="confBtn">Conferir</button></div>' +
        '<div id="confRes"></div>',
      footer: '<button class="btn btn-light" onclick="App.closeModal()">Fechar</button>',
      onOpen: function () {
        document.getElementById("confBtn").onclick = function () {
          var linhas = (document.getElementById("confLista").value || "").split("\n")
            .map(function (s) { return s.trim(); }).filter(Boolean);
          var rows = linhas.map(function (nome) {
            var m = D.pesquisarEstudantes(nome, 1)[0];
            return "<tr><td>" + U.esc(nome) + "</td><td>" + (m
              ? '<span class="badge ok">Encontrado</span> ' + U.esc(m.nome) + " · " + U.esc(m.matricula || "")
              : '<span class="badge danger">Não encontrado</span>') + "</td></tr>";
          }).join("");
          document.getElementById("confRes").innerHTML = linhas.length
            ? '<div class="table-wrap"><table class="data"><thead><tr><th>Nome colado</th><th>Resultado</th></tr></thead><tbody>' + rows + "</tbody></table></div>"
            : C.empty("", "Cole pelo menos um nome.");
        };
      }
    });
  };

  window.V = V;
})(window);
