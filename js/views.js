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

    var hoje = U.hoje();
    var matsHoje = estudantes.filter(function (e) { return U.ymd(e.dataMatricula) === hoje; }).length;
    var pagsHoje = db.pagamentos.filter(function (p) { return U.ymd(p.data) === hoje; });
    var recHoje = U.sum(pagsHoje, function (p) { return p.valorPago; });

    var recentes = estudantes.slice().sort(U.by("dataMatricula")).slice(0, 6);
    var ultPag = db.pagamentos.slice().sort(U.by("data")).slice(0, 6);

    var html =
      '<div class="hero">' +
        "<h1>" + U.esc(s.sistema) + '</h1><span class="slogan">' + U.esc(s.slogan) + "</span>" +
        "<p>Plataforma de gestão de matrículas, cursos, pagamentos e recibos do " + U.esc(s.instituicao) +
        ". Rápida, simples e profissional — pensada para a secretaria.</p>" +
        '<div class="hero-actions">' +
          '<button class="btn btn-gold" data-go="matricula">Nova Matrícula</button>' +
          '<button class="btn btn-ghost" data-go="recibos">Emitir Recibo</button>' +
          '<button class="btn btn-ghost" data-go="cursos">Ver Cursos</button>' +
          '<button class="btn btn-ghost" data-go="relatorios">Relatórios</button>' +
        "</div>" +
      "</div>" +

      '<div class="grid stats">' +
        V._stat("Estudantes matriculados", estudantes.length, "") +
        V._stat("Total recebido", U.moeda(totalRec), "") +
        V._stat("Cursos ativos", cursosAtivos, "") +
        V._stat("Turmas abertas", turmasAbertas, "") +
      "</div>" +

      '<div class="grid stats mt">' +
        V._stat("Matrículas de hoje", matsHoje, "") +
        V._stat("Pagamentos de hoje", pagsHoje.length, "") +
        V._stat("Recebido hoje", U.moeda(recHoje), "") +
        V._stat("Cursos registados", db.cursos.length, "") +
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
  V._stat = function (label, value) {
    return '<div class="stat-card"><div class="label">' + U.esc(label) + "</div>" +
      '<div class="value num">' + (typeof value === "number" ? value : U.esc(value)) + "</div></div>";
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

    return C.pageHead(editing ? "Editar Matrícula" : "Nova Matrícula",
      editing ? e.matricula + " · " + e.nome : "Preencha os dados do estudante — número de matrícula: " + nextMat,
      '<button class="btn btn-light" data-go="estudantes">Voltar</button>') +
      '<form id="formMatricula" class="card"><div class="form-grid">' +
        '<div class="fieldset-title">Dados pessoais</div>' +
        V._f("nome", "Nome completo", "text", e.nome, true) +
        V._f("bi", "Número do BI", "text", e.bi) +
        V._f("dataNascimento", "Data de nascimento", "date", e.dataNascimento) +
        V._f("contacto", "Contacto telefónico", "tel", e.contacto, true) +
        V._f("whatsapp", "WhatsApp", "tel", e.whatsapp) +
        V._f("morada", "Morada", "text", e.morada) +

        '<div class="fieldset-title">Dados do curso</div>' +
        '<div class="field"><label>Curso escolhido <span class="req">*</span></label>' +
          '<select name="curso" id="selCurso" required>' + cursoOpts + "</select>" +
          '<span class="help">Ao escolher o curso, os campos abaixo preenchem automaticamente.</span></div>' +
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
        V._f("valorPago", "Valor pago agora (Kz)", "number", e.valorPago) +
        V._fselect("formaPagamento", "Forma de pagamento", db.formasPagamento, e.formaPagamento) +
        '<div class="field"><label>Emolumento deste pagamento</label>' +
          '<select name="emolumento">' + U.optionList(db.emolumentos, e.emolumento || "Matrícula") + "</select></div>" +
        V._fselect("funcionario", "Funcionário que recebeu", db.funcionarios, e.funcionario) +
        '<div class="field full"><label>Observações</label><textarea name="observacoes">' + U.esc(e.observacoes || "") + "</textarea></div>" +
      "</div>" +
      (editing ? '<input type="hidden" name="id" value="' + e.id + '">' : "") +
      '<input type="hidden" name="matricula" value="' + U.esc(nextMat) + '">' +
      '<div class="form-actions">' +
        '<label class="flex" style="margin-right:auto;font-size:13px;font-weight:600">' +
          '<input type="checkbox" id="gerarRecibo" ' + (editing ? "" : "checked") + '> Gerar recibo do valor pago</label>' +
        '<button type="button" class="btn btn-light" data-go="estudantes">Cancelar</button>' +
        '<button type="submit" class="btn btn-primary">' + (editing ? "Guardar alterações" : "Salvar matrícula") + "</button>" +
      "</div></form>";
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
  V.renderEstudantesTable = function () {
    var q = (document.getElementById("estSearch").value || "").toLowerCase();
    var fc = document.getElementById("estFiltroCurso").value;
    var fe = document.getElementById("estFiltroEstado").value;
    var list = D.estudantes().filter(function (e) {
      if (fc && e.curso !== fc) return false;
      if (fe && e.estado !== fe) return false;
      if (q) {
        var hay = (e.nome + " " + e.contacto + " " + e.matricula + " " + e.curso + " " + (e.bi || "")).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    }).sort(U.by("dataMatricula"));

    var host = document.getElementById("estTable");
    if (!list.length) { host.innerHTML = C.empty("", "Nenhum estudante encontrado."); return; }

    var rows = list.map(function (e) {
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
      "</tr></thead><tbody>" + rows + "</tbody></table></div>" +
      '<p class="help mt">' + list.length + " estudante(s) listado(s).</p>";
  };

  V.fichaEstudante = function (id) {
    var e = D.estudanteById(id);
    if (!e) return;
    var pags = D.pagamentosDeEstudante(id).sort(U.by("data"));
    var pago = U.sum(pags, function (p) { return p.valorPago; });
    var curso = D.cursoByNome(e.curso);
    var totalCurso = curso ? curso.valorTotal : 0;
    var saldo = totalCurso ? Math.max(0, totalCurso - pago) : 0;

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
          V._stat("Valor do curso", totalCurso ? U.moeda(totalCurso) : "—", "") +
          V._stat("Saldo em falta", totalCurso ? U.moeda(saldo) : "—", "") +
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
        '<button class="btn btn-light" id="fichaMat">Ficha de Matrícula</button>' +
        '<button class="btn btn-primary" id="fichaPrint">Imprimir histórico</button>',
      onOpen: function () {
        document.getElementById("fichaEdit").onclick = function () { C.closeModal(); App.navigate("matricula", { id: id }); };
        document.getElementById("fichaPay").onclick = function () { C.closeModal(); V.novoPagamento(id); };
        document.getElementById("fichaMat").onclick = function () { C.closeModal(); C.viewFichaMatricula(e); };
        document.getElementById("fichaPrint").onclick = function () { U.printElement("fichaDoc", "Ficha " + e.nome); };
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
        f("valorMensalidade", "Valor da mensalidade (Kz)", "number", c.valorMensalidade) +
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
    return C.pageHead("Pagamentos", "Gestão e controlo de todos os pagamentos",
      '<button class="btn btn-primary" id="novoPag">Registar Pagamento</button>' +
      '<button class="btn btn-light" id="expPagCsv">Exportar CSV</button>' +
      '<button class="btn btn-light" id="expPagPdf">Relatório PDF</button>') +
      '<div class="grid stats mb" id="pagStats"></div>' +
      '<div class="card">' +
        '<div class="toolbar">' +
          '<div class="search-box"><input id="pagSearch" placeholder="Pesquisar por estudante, recibo, curso..."></div>' +
          '<div class="field"><label>Curso</label><select id="pagFiltroCurso"><option value="">Todos</option>' +
            U.optionList(D.cursos().map(function (c) { return c.nome; })) + "</select></div>" +
          '<div class="field"><label>Emolumento</label><select id="pagFiltroEmol"><option value="">Todos</option>' +
            U.optionList(D.db().emolumentos) + "</select></div>" +
          '<div class="field"><label>De</label><input type="date" id="pagDe"></div>' +
          '<div class="field"><label>Até</label><input type="date" id="pagAte"></div>' +
        '</div><div id="pagTable"></div></div>';
  };
  V._filtrarPagamentos = function () {
    var q = (document.getElementById("pagSearch").value || "").toLowerCase();
    var fc = document.getElementById("pagFiltroCurso").value;
    var fem = document.getElementById("pagFiltroEmol").value;
    var de = document.getElementById("pagDe").value;
    var ate = document.getElementById("pagAte").value;
    return D.pagamentos().filter(function (p) {
      if (fc && p.curso !== fc) return false;
      if (fem && p.emolumento !== fem) return false;
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

  // Modal: registar novo pagamento (opcional estudante pré-selecionado)
  V.novoPagamento = function (estId) {
    var db = D.db();
    var estOpts = '<option value="">— Selecione o estudante —</option>' +
      D.estudantes().slice().sort(function (a, b) { return a.nome < b.nome ? -1 : 1; }).map(function (e) {
        return '<option value="' + e.id + '"' + (e.id === estId ? " selected" : "") + ">" +
          U.esc(e.nome + " · " + e.matricula) + "</option>";
      }).join("");
    C.modal({
      title: "Registar Pagamento",
      body: '<form id="formPag"><div class="form-grid">' +
        '<div class="field full"><label>Estudante <span class="req">*</span></label>' +
          "<select name='estudanteId' id='payEst' required>" + estOpts + "</select></div>" +
        '<div class="field"><label>Tipo de pagamento <span class="req">*</span></label><select name="emolumento" required>' +
          U.optionList(db.emolumentos, "Propina") + "</select></div>" +
        '<div class="field"><label>Valor pago (Kz) <span class="req">*</span></label>' +
          "<input type='number' name='valorPago' min='0.01' step='0.01' required></div>" +
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
        document.getElementById("savePag").onclick = function () {
          var fd = new FormData(document.getElementById("formPag"));
          var est = D.estudanteById(fd.get("estudanteId"));
          var valor = U.parseMoeda(fd.get("valorPago"));
          if (!est) { C.toast("Selecione o estudante.", "err"); return; }
          if (!(valor > 0)) { C.toast("O valor pago deve ser maior que zero.", "err"); return; }
          var pag = V._criarPagamento(est, {
            emolumento: fd.get("emolumento"), valorPago: valor,
            formaPagamento: fd.get("formaPagamento"), funcionario: fd.get("funcionario"),
            data: fd.get("data") ? fd.get("data") + "T" + new Date().toTimeString().slice(0, 8) : U.agoraISO(),
            referencia: fd.get("referencia"), observacoes: fd.get("observacoes")
          });
          C.closeModal();
          C.toast("Pagamento registado — recibo " + pag.recibo, "ok");
          C.viewReceipt(pag);
          App.refresh();
        };
      }
    });
  };
  // Cria registo de pagamento a partir de um estudante + dados
  V._criarPagamento = function (est, extra) {
    var pag = {
      recibo: D.nextRecibo(),
      estudanteId: est.id, estudanteNome: est.nome, matricula: est.matricula,
      contacto: est.contacto, curso: est.curso, periodo: est.periodo,
      unidade: est.unidade, tipoCurso: est.tipoCurso, duracao: est.duracao, regime: est.regime,
      data: extra.data || U.agoraISO(),
      emolumento: extra.emolumento || "Outros",
      valorPago: extra.valorPago || 0,
      formaPagamento: extra.formaPagamento || "",
      funcionario: extra.funcionario || "",
      referencia: extra.referencia || "",
      observacoes: extra.observacoes || ""
    };
    return D.savePagamento(pag);
  };

  /* =======================================================================
     6. RECIBOS
     ======================================================================= */
  V.recibos = function () {
    var db = D.db();
    var estOpts = '<option value="">— Selecionar estudante (opcional) —</option>' +
      D.estudantes().slice().sort(function (a, b) { return a.nome < b.nome ? -1 : 1; }).map(function (e) {
        return '<option value="' + e.id + '">' + U.esc(e.nome + " · " + e.matricula) + "</option>";
      }).join("");
    var cursoOpts = '<option value="">—</option>' +
      D.cursosOrdenados().map(function (c) { return '<option value="' + U.esc(c.nome) + '">' + U.esc(c.nome) + "</option>"; }).join("");

    return C.pageHead("Recibos", "Gerador e pesquisa de recibos de pagamento") +
      // ---- 1. Formulário ----
      '<div class="card mb"><div class="card-head"><h3>Recibo de Pagamento</h3>' +
        '<span class="help">Nº do recibo (automático): <strong id="recNum">' + U.esc(D.peekRecibo()) + "</strong></span></div>" +
        '<form id="formRecibo"><div class="form-grid">' +
          '<div class="field full"><label>Estudante (preenche os dados automaticamente)</label>' +
            '<select name="estudanteId" id="recEst">' + estOpts + "</select></div>" +
          '<div class="fieldset-title">Dados do estudante</div>' +
          V._f("nome", "Nome completo do estudante", "text", "", true) +
          V._f("contacto", "Contacto", "tel") +
          V._f("matricula", "Nº de matrícula", "text") +
          '<div class="field"><label>Curso</label><select name="curso">' + cursoOpts + "</select></div>" +
          V._fselect("periodo", "Período", db.periodos) +
          V._fselect("unidade", "Unidade / Polo", db.unidades) +
          '<div class="fieldset-title">Dados do pagamento</div>' +
          '<div class="field"><label>Tipo de pagamento <span class="req">*</span></label>' +
            '<select name="emolumento" required>' + U.optionList(db.emolumentos, "Propina") + "</select></div>" +
          '<div class="field"><label>Mês de referência</label><input type="month" name="mesReferencia"></div>' +
          V._f("valorPago", "Valor pago (Kz)", "number", "", true) +
          V._fselect("formaPagamento", "Forma de pagamento", db.formasPagamento) +
          V._fselect("funcionario", "Funcionário que recebeu", db.funcionarios) +
          V._f("data", "Data do pagamento", "date", U.hoje(), true) +
          '<div class="field full"><label>Observações</label><textarea name="observacoes"></textarea></div>' +
        "</div>" +
        '<div class="form-actions">' +
          '<button type="button" class="btn btn-light" id="recLimpar">Limpar formulário</button>' +
          '<button type="button" class="btn btn-primary" id="recGerar">Gerar recibo</button>' +
        "</div></form></div>" +
      // ---- 2. Pré-visualização (A4, 2 vias) ----
      '<div class="card mb" id="recPreviewCard" hidden><div class="card-head"><h3>Pré-visualização — Folha A4, 2 vias</h3>' +
        '<div class="flex"><button class="btn btn-gold" id="recImprimir">Imprimir recibo</button>' +
        '<button class="btn btn-primary" id="recPdf">Guardar em PDF</button></div></div>' +
        '<div id="recPreview"></div></div>' +
      // ---- 3. Pesquisa ----
      '<div class="card"><div class="card-head"><h3>Pesquisar recibos</h3></div>' +
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
          '<option value="pagamentos">Pagamentos (diário/período)</option>' +
          '<option value="receitasMes">Receitas mensais</option>' +
          '<option value="porCurso">Por curso</option>' +
          '<option value="porFuncionario">Por funcionário</option>' +
          '<option value="porPeriodo">Estudantes por período</option>' +
          '<option value="porUnidade">Estudantes por unidade</option>' +
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
        '<div class="tab" data-tab="listas">Listas (períodos, unidades, etc.)</div>' +
        '<div class="tab" data-tab="conta">Conta e segurança</div>' +
        '<div class="tab" data-tab="dados">Dados (backup)</div>' +
      '</div><div id="cfgContent"></div>';
  };
  V.cfgInst = function () {
    var s = D.db().settings;
    var f = function (n, l, v, t) {
      return '<div class="field"><label>' + l + "</label><input type='" + (t || "text") + "' name='" + n + "' value='" + U.esc(v || "") + "'></div>";
    };
    return '<form id="formInst" class="card"><div class="form-grid">' +
      '<div class="fieldset-title">Dados institucionais</div>' +
      f("instituicao", "Nome da instituição", s.instituicao) +
      f("sistema", "Nome do sistema", s.sistema) +
      f("slogan", "Slogan", s.slogan) +
      f("anoLetivo", "Ano letivo", s.anoLetivo) +
      f("nif", "NIF", s.nif) +
      f("telefone", "Telefone", s.telefone) +
      f("email", "Email", s.email, "email") +
      f("endereco", "Endereço", s.endereco) +
      '<div class="fieldset-title">Assinaturas dos documentos</div>' +
      f("secretaria", "Nome da Secretaria", s.secretaria) +
      f("diretora", "Nome da Directora Administrativa", s.diretora) +
      '<div class="fieldset-title">Numeração</div>' +
      f("seqMatricula", "Próximo nº de matrícula", s.seqMatricula, "number") +
      f("seqRecibo", "Próximo nº de recibo", s.seqRecibo, "number") +
      "</div><div class='form-actions'><button type='submit' class='btn btn-primary'>Guardar</button></div></form>";
  };
  V.cfgListas = function () {
    var db = D.db();
    var listas = [
      ["periodos", "Períodos"], ["regimes", "Regimes de aulas"],
      ["tiposCurso", "Tipos de curso"], ["unidades", "Unidades / Polos"],
      ["emolumentos", "Emolumentos"], ["formasPagamento", "Formas de pagamento"],
      ["funcionarios", "Funcionários"]
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
    return '<form id="formConta" class="card"><div class="card-head"><h3>Conta da secretaria</h3></div>' +
      '<p class="help">O acesso ao sistema é protegido por utilizador e palavra-passe. ' +
      "Trata-se de uma proteção do lado do cliente (no navegador): impede o acesso casual, " +
      "mas não substitui um servidor seguro. Mantenha a palavra-passe reservada.</p>" +
      '<div class="form-grid">' +
        '<div class="field"><label>Exigir login ao abrir</label><select name="enabled">' +
          U.optionList(["Sim", "Não"], a.enabled ? "Sim" : "Não") + "</select></div>" +
        '<div class="field"><label>Nome a mostrar</label><input name="nome" value="' + U.esc(a.nome || "") + '"></div>' +
        '<div class="field"><label>Utilizador</label><input name="user" value="' + U.esc(a.user) + '" required></div>' +
        '<div class="field"></div>' +
        '<div class="fieldset-title">Alterar palavra-passe</div>' +
        '<div class="field"><label>Nova palavra-passe</label><input type="password" name="novaPass" autocomplete="new-password" placeholder="(deixe vazio para manter)"></div>' +
        '<div class="field"><label>Confirmar nova palavra-passe</label><input type="password" name="novaPass2" autocomplete="new-password"></div>' +
      "</div>" +
      '<div class="form-actions"><button type="submit" class="btn btn-primary">Guardar conta</button></div></form>';
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
      "</div>";
  };

  window.V = V;
})(window);
