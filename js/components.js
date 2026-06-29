/* ==========================================================================
   components.js — UI partilhada (toast, modal, cabeçalhos, recibo, relatórios)
   ========================================================================== */
(function (window) {
  "use strict";
  var U = window.U;
  var D = window.MidasData;

  var C = {};

  // ---- Toast ---------------------------------------------------------------
  C.toast = function (msg, type) {
    var host = document.getElementById("toastHost");
    var t = document.createElement("div");
    t.className = "toast " + (type || "");
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .3s"; t.style.opacity = "0";
      setTimeout(function () { t.remove(); }, 300);
    }, 3200);
  };

  // ---- Modal ---------------------------------------------------------------
  C.modal = function (opts) {
    var host = document.getElementById("modalHost");
    host.innerHTML =
      '<div class="modal-backdrop"></div>' +
      '<div class="modal" role="dialog" aria-modal="true">' +
        '<div class="modal-head"><h3>' + U.esc(opts.title || "") + "</h3>" +
          '<button class="modal-close" aria-label="Fechar">&times;</button></div>' +
        '<div class="modal-body" id="modalBody">' + (opts.body || "") + "</div>" +
        (opts.footer ? '<div class="modal-foot">' + opts.footer + "</div>" : "") +
      "</div>";
    host.classList.add("open");
    host.removeAttribute("data-dirty");
    var close = function () { C.closeModal(); };
    // Marca o modal como "com alterações" assim que o utilizador escreve/altera
    // algo. Setar .value por código (nos onOpen) não dispara estes eventos, por
    // isso não há falsos positivos.
    var body = document.getElementById("modalBody");
    var marcar = function () { host.setAttribute("data-dirty", "1"); };
    if (body) { body.addEventListener("input", marcar); body.addEventListener("change", marcar); }
    host.querySelector(".modal-close").onclick = close;
    // Clicar fora (backdrop) já não apaga um formulário meio-preenchido sem aviso.
    host.querySelector(".modal-backdrop").onclick = function () {
      if (host.getAttribute("data-dirty") === "1" &&
          !window.confirm("Tem alterações por guardar neste formulário. Fechar mesmo assim?")) return;
      close();
    };
    if (typeof opts.onOpen === "function") opts.onOpen(document.getElementById("modalBody"));
    return host;
  };
  C.closeModal = function () {
    var host = document.getElementById("modalHost");
    host.classList.remove("open");
    host.innerHTML = "";
  };

  C.confirm = function (message, onYes, opts) {
    opts = opts || {};
    var rt = opts.requireText; // ex.: "APAGAR" — exige digitar para confirmar
    C.modal({
      title: opts.title || "Confirmar",
      body: '<p style="margin:0">' + U.esc(message) + "</p>" +
        (rt ? '<label class="help" style="display:block;margin-top:10px">Para confirmar, escreva <strong>' + U.esc(rt) + '</strong>:</label>' +
              '<input id="cfText" autocomplete="off" style="width:100%;padding:9px 11px;border:1px solid var(--line);border-radius:8px;margin-top:4px">' : ""),
      footer:
        '<button class="btn btn-light" id="cfNo">Cancelar</button>' +
        '<button class="btn ' + (opts.danger ? "btn-danger" : "btn-primary") + '" id="cfYes"' + (rt ? " disabled" : "") + ">" +
        U.esc(opts.yes || "Confirmar") + "</button>",
      onOpen: function () {
        document.getElementById("cfNo").onclick = C.closeModal;
        var yes = document.getElementById("cfYes");
        if (rt) {
          var inp = document.getElementById("cfText");
          inp.addEventListener("input", function () { yes.disabled = inp.value.trim().toUpperCase() !== rt.toUpperCase(); });
          inp.focus();
        }
        yes.onclick = function () { if (yes.disabled) return; C.closeModal(); onYes(); };
      }
    });
  };

  // ---- Page header ---------------------------------------------------------
  C.pageHead = function (title, sub, actionsHtml) {
    return '<div class="page-head"><div><h1>' + U.esc(title) + "</h1>" +
      (sub ? '<p class="sub">' + U.esc(sub) + "</p>" : "") + "</div>" +
      (actionsHtml ? '<div class="page-actions">' + actionsHtml + "</div>" : "") + "</div>";
  };

  C.empty = function (icon, msg) {
    return '<div class="empty"><div class="big">' + (icon || "") + "</div><p>" + U.esc(msg) + "</p></div>";
  };

  C.estadoBadge = function (estado) {
    var map = {
      ativo: "ok", concluído: "info", concluido: "info",
      pendente: "warn", desistente: "danger", inativo: "off"
    };
    return '<span class="badge ' + (map[estado] || "off") + '">' + U.esc(estado || "—") + "</span>";
  };

  // ---- Gráfico de barras (sem dependências; respeita tema/cores) ----------
  // items = [{ label, value }]; opts = { moeda:true, vazio:"..." }
  C.chartBars = function (items, opts) {
    opts = opts || {};
    items = (items || []).filter(Boolean);
    if (!items.length) return C.empty("", opts.vazio || "Sem dados para apresentar.");
    var max = 0;
    items.forEach(function (i) { var v = Number(i.value) || 0; if (v > max) max = v; });
    if (max <= 0) max = 1;
    var rows = items.map(function (i) {
      var v = Number(i.value) || 0;
      var pct = Math.max(2, Math.round((v / max) * 100));
      return '<div class="chart-row">' +
        '<div class="chart-label" title="' + U.esc(i.label) + '">' + U.esc(i.label) + "</div>" +
        '<div class="chart-track"><div class="chart-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="chart-val">' + (opts.moeda ? U.moeda(v) : v) + "</div></div>";
    }).join("");
    return '<div class="chart-bars">' + rows + "</div>";
  };

  // ---- Receipt HTML --------------------------------------------------------
  // ---- Document helpers ----------------------------------------------------
  C._docHead = function (titulo, num, data) {
    var s = D.db().settings;
    return '<div class="doc-head">' +
      '<div class="d-org"><img src="' + U.logoURL(true) + '" alt="" class="logo" />' +
        "<div><strong>" + U.esc((s.instituicao || "").toUpperCase()) + "</strong><small>" +
        U.esc(s.sistema) + " — " + U.esc(s.slogan) + "</small></div></div>" +
      '<div class="d-title"><h2>' + U.esc(titulo) + "</h2>" +
        '<div class="d-num">Nº ' + U.esc(num) + "</div>" +
        '<div class="d-date">' + U.dataPT(data) + "</div></div></div>";
  };
  C._docItem = function (k, v, full) {
    if (v == null || v === "") v = "—";
    return '<div class="di' + (full ? " full" : "") + '"><span class="k">' + U.esc(k) +
      '</span><span class="v">' + U.esc(v) + "</span></div>";
  };
  C._docSection = function (titulo) {
    return '<div class="doc-sec">' + U.esc(titulo) + "</div>";
  };
  C._docSign = function () {
    var s = D.db().settings;
    return '<div class="doc-sign">' +
      '<div class="s-line"><div class="s-rule">' + U.esc(s.secretaria || "____________________") +
        '</div><div class="s-role">A Secretaria</div></div>' +
      '<div class="s-line"><div class="s-rule">' + U.esc(s.diretora || "____________________") +
        '</div><div class="s-role">A Directora Administrativa</div></div></div>';
  };
  C._docFoot = function () {
    var s = D.db().settings;
    return '<div class="doc-foot">' + U.esc(s.instituicao) +
      (s.nif ? " · NIF: " + U.esc(s.nif) : "") +
      (s.telefone ? " · Tel: " + U.esc(s.telefone) : "") +
      " · " + U.esc(s.endereco) + "</div>";
  };

  // ---- Imprimir um documento a partir de HTML (host temporário) -----------
  // Centraliza o padrão: criar host escondido -> imprimir por id -> remover.
  C.imprimirHTML = function (html, id, titulo) {
    var host = document.createElement("div");
    host.style.position = "fixed"; host.style.left = "-9999px"; host.style.top = "0";
    host.innerHTML = html;
    document.body.appendChild(host);
    U.printElement(id, titulo);
    setTimeout(function () { host.remove(); }, 2000);
  };

  // Gera PDF (download direto) de um documento que ainda não está no ecrã:
  // monta-o fora do ecrã, gera o PDF e limpa. Espelha o C.imprimirHTML.
  C.baixarPDFHTML = function (html, id, nome, opts) {
    var host = document.createElement("div");
    host.style.position = "fixed"; host.style.left = "-9999px"; host.style.top = "0";
    host.innerHTML = html;
    document.body.appendChild(host);
    return U.baixarPDF(id, nome, opts).then(function (r) { host.remove(); return r; });
  };

  // ---- QR de verificação (gerado pela Edge Function "qr") -----------------
  // Aparece nos documentos quando o backend Supabase está configurado.
  C._qrBlock = function (tipo, id) {
    if (!id || !window.MIDAS_CONFIG || !window.MIDAS_CONFIG.supabaseUrl) return "";
    var base = location.origin + location.pathname.replace(/[^/]*$/, "");
    var verify = base + "verificar.html?t=" + encodeURIComponent(tipo) + "&id=" + encodeURIComponent(id);
    var src = window.MIDAS_CONFIG.supabaseUrl + "/functions/v1/qr?data=" + encodeURIComponent(verify);
    return '<div class="qr-block"><img src="' + src + '" alt="QR de verificação" width="96" height="96" />' +
      "<small>Verifique a autenticidade<br>deste documento</small></div>";
  };

  // ---- Receipt (2 vias, A4) -----------------------------------------------
  // pag = pagamento record
  // Tabela de emolumentos quando o recibo tem vários itens.
  C._itensRecibo = function (pag) {
    if (!pag.itens || pag.itens.length < 2) return "";
    var linhas = pag.itens.map(function (it) {
      return "<tr><td>" + U.esc(it.emolumento) + "</td><td style='text-align:right'>" + U.moeda(it.valorPago) + "</td></tr>";
    }).join("");
    return '<table class="doc-itens" style="width:100%;border-collapse:collapse;margin:6px 0">' +
      "<thead><tr><th style='text-align:left'>Emolumento</th><th style='text-align:right'>Valor</th></tr></thead>" +
      "<tbody>" + linhas + "</tbody></table>";
  };
  C._receiptVia = function (pag, label) {
    var s = D.db().settings;
    var obs = pag.observacoes || pag.referencia;
    return '<div class="via">' +
      '<span class="via-label">Via: ' + U.esc(label) + "</span>" +
      C._docHead("Recibo de Pagamento", pag.recibo, pag.data) +
      '<div class="doc-grid">' +
        C._docItem("Via", label) +
        C._docItem("Recebido por", pag.funcionario) +
        C._docItem("Estudante", pag.estudanteNome, true) +
        C._docItem("Contacto", pag.contacto) +
        C._docItem("Nº de matrícula", pag.matricula) +
        C._docItem("Curso", pag.curso) +
        C._docItem("Período", pag.periodo) +
        C._docItem("Unidade / Polo", pag.unidade) +
        C._docItem("Tipo de pagamento", pag.emolumento) +
        C._docItem("Mês de referência", U.mesRef(pag.mesReferencia)) +
        C._docItem("Forma de pagamento", pag.formaPagamento) +
        C._docItem("Observações", obs, true) +
      "</div>" +
      C._itensRecibo(pag) +
      '<div class="doc-amount"><span class="k">' + (pag.itens && pag.itens.length > 1 ? "Total pago" : "Valor pago") +
        '</span><span class="v num">' + U.moeda(pag.valorPago) + "</span></div>" +
      C._qrBlock("recibo", pag.recibo) +
      C._docSign() +
      '<div class="doc-foot">Documento emitido pelo sistema interno do ' + U.esc(s.instituicao) + ".</div>" +
      "</div>";
  };
  C.receiptHTML = function (pag) {
    return '<div class="doc-a4" id="receiptDoc">' +
      C._receiptVia(pag, "Via do Estudante") +
      '<div class="cut-line">cortar aqui</div>' +
      C._receiptVia(pag, "Via da Secretaria") +
    "</div>";
  };

  // ---- Ficha de Matrícula (2 vias, A4) ------------------------------------
  // est = estudante; pag (opcional) = pagamento associado para o valor pago
  C._fichaVia = function (est, valorPago, label) {
    var s = D.db().settings;
    return '<div class="via">' +
      '<span class="via-label">Via: ' + U.esc(label) + "</span>" +
      C._docHead("Ficha de Matrícula", est.matricula, est.dataMatricula) +
      '<div class="doc-grid">' +
        C._docSection("Dados da matrícula") +
        C._docItem("Nº de matrícula", est.matricula) +
        C._docItem("Data da matrícula", U.dataPT(est.dataMatricula)) +
        C._docItem("Via", label) +
        C._docItem("Estado", est.estado) +
        C._docSection("Dados do estudante") +
        C._docItem("Nome completo", est.nome, true) +
        C._docItem("Data de nascimento", U.dataPT(est.dataNascimento)) +
        C._docItem("Nº do BI", est.bi) +
        C._docItem("Contacto", est.contacto) +
        C._docItem("WhatsApp", est.whatsapp) +
        C._docItem("Morada", est.morada, true) +
        C._docSection("Dados do encarregado") +
        C._docItem("Encarregado de educação", est.encarregado) +
        C._docItem("Contacto do encarregado", est.encarregadoContacto) +
        C._docSection("Dados do curso") +
        C._docItem("Curso", est.curso, true) +
        C._docItem("Tipo de curso", est.tipoCurso) +
        C._docItem("Duração", est.duracao) +
        C._docItem("Período", est.periodo) +
        C._docItem("Regime de aulas", est.regime) +
        C._docItem("Unidade / Polo", est.unidade, true) +
        C._docSection("Dados financeiros") +
        C._docItem("Valor da inscrição", U.moeda(est.valorInscricao || 0)) +
        C._docItem("Valor da matrícula", U.moeda(est.valorMatricula || 0)) +
        C._docItem("Valor pago", U.moeda(valorPago)) +
        C._docItem("Forma de pagamento", est.formaPagamento) +
      "</div>" +
      C._qrBlock("matricula", est.matricula) +
      C._docSign() +
      '<div class="doc-foot">Documento emitido pelo sistema interno do ' + U.esc(s.instituicao) + ".</div>" +
      "</div>";
  };
  C.fichaMatriculaHTML = function (est) {
    // Só conta dinheiro que tem recibo (totalPagoEstudante). NÃO usar
    // est.valorPago como fallback: imprimia "valor pago" sem recibo no caixa.
    var valor = D.totalPagoEstudante(est.id);
    return '<div class="doc-a4" id="fichaMatDoc">' +
      C._fichaVia(est, valor, "Via do Estudante") +
      '<div class="cut-line">cortar aqui</div>' +
      C._fichaVia(est, valor, "Via da Secretaria") +
    "</div>";
  };

  // ---- Report sheet --------------------------------------------------------
  C.reportSheet = function (titulo, subtitulo, headers, rows, totals) {
    var s = D.db().settings;
    var thead = "<tr>" + headers.map(function (h) { return "<th>" + U.esc(h) + "</th>"; }).join("") + "</tr>";
    var tbody = rows.map(function (r) {
      return "<tr>" + r.map(function (c) { return "<td>" + (c == null ? "" : c) + "</td>"; }).join("") + "</tr>";
    }).join("");
    var tfoot = "";
    if (totals && totals.length) {
      tfoot = '<tr class="totals-row">' + totals.map(function (c) { return "<td>" + (c == null ? "" : c) + "</td>"; }).join("") + "</tr>";
    }
    return '<div class="print-sheet" id="reportDoc">' +
      '<div class="ps-head"><div><h2>' + U.esc(titulo) + "</h2>" +
        (subtitulo ? "<div>" + U.esc(subtitulo) + "</div>" : "") + "</div>" +
        '<div class="org"><strong>' + U.esc(s.instituicao) + "</strong><br><small>" + U.esc(s.slogan) +
        "</small><br><small>Emitido: " + U.dataHoraPT(U.agoraISO()) + "</small></div></div>" +
      "<table><thead>" + thead + "</thead><tbody>" + (tbody || "") + "</tbody>" +
        (tfoot ? "<tfoot>" + tfoot + "</tfoot>" : "") + "</table>" +
      (rows.length === 0 ? '<p style="text-align:center;color:#888;margin-top:18px">Sem registos para os filtros aplicados.</p>' : "") +
      '<div class="ps-foot"><span>' + U.esc(s.sistema) + " — Ano letivo " + U.esc(s.anoLetivo) +
        "</span><span>Total de registos: " + rows.length + "</span></div></div>";
  };

  // ---- Extrato de conta do estudante (A4) ---------------------------------
  C.extratoHTML = function (est) {
    var s = D.db().settings;
    var pags = D.pagamentosDeEstudante(est.id).slice().sort(function (a, b) { return (a.data || "") < (b.data || "") ? -1 : 1; });
    var pago = D.totalPagoEstudante(est.id);
    var curso = D.cursoByNome(est.curso);
    var totalCurso = curso ? (Number(curso.valorTotal) || 0) : 0;
    var saldo = totalCurso ? Math.max(0, totalCurso - pago) : 0;
    var situacao = !totalCurso ? "—" : (saldo > 0 ? "Em dívida" : "Regularizado");
    var linhas = pags.length ? pags.map(function (p) {
      return "<tr><td>" + U.dataPT(p.data) + "</td><td>" + U.esc(p.recibo) + "</td><td>" + U.esc(p.emolumento) +
        "</td><td>" + U.esc(p.formaPagamento || "") + "</td><td style='text-align:right'>" + U.moeda(p.valorPago) + "</td></tr>";
    }).join("") : "<tr><td colspan='5' style='text-align:center;color:#888'>Sem pagamentos.</td></tr>";
    return '<div class="print-sheet" id="extratoDoc">' +
      '<div class="ps-head"><div><h2>Extrato de Conta</h2><div>' + U.esc(est.nome) + " · " + U.esc(est.matricula) + "</div></div>" +
        '<div class="org"><img src="' + U.logoURL(true) + '" alt="" style="height:42px"><br><strong>' + U.esc(s.instituicao) +
        "</strong><br><small>Emitido: " + U.dataHoraPT(U.agoraISO()) + "</small></div></div>" +
      '<div class="doc-grid" style="margin-bottom:12px">' +
        C._docItem("Curso", est.curso) + C._docItem("Período", est.periodo) +
        C._docItem("Contacto", est.contacto) + C._docItem("Estado", est.estado) +
      "</div>" +
      "<table><thead><tr><th>Data</th><th>Recibo</th><th>Categoria</th><th>Forma</th><th style='text-align:right'>Valor</th></tr></thead><tbody>" +
        linhas + "</tbody></table>" +
      '<div class="doc-amount"><span class="k">Total pago</span><span class="v num">' + U.moeda(pago) + "</span></div>" +
      (totalCurso ? '<div class="doc-amount"><span class="k">Saldo em dívida</span><span class="v num">' + U.moeda(saldo) + "</span></div>" : "") +
      '<p style="margin:6px 0"><strong>Situação financeira:</strong> ' + U.esc(situacao) + "</p>" +
      C._docSign() + C._docFoot() + "</div>";
  };
  C.verExtrato = function (est) {
    C.modal({
      title: "Extrato — " + est.nome,
      body: C.extratoHTML(est),
      footer:
        '<button class="btn btn-light" onclick="App.closeModal()">Fechar</button>' +
        '<button class="btn btn-gold" id="exPrint">Imprimir</button>' +
        '<button class="btn btn-primary" id="exPdf">Guardar PDF</button>',
      onOpen: function () {
        var go = function () { U.printElement("extratoDoc", "Extrato " + est.nome); };
        document.getElementById("exPrint").onclick = go;
        document.getElementById("exPdf").onclick = function () { C.toast("Na janela de impressão escolha “Guardar como PDF”.", "ok"); go(); };
      }
    });
  };

  // ---- Mapa de propinas / carnê (A4) --------------------------------------
  C.mapaPropinasHTML = function (est) {
    var s = D.db().settings;
    var m = D.mapaPropinas(est);
    var badge = function (e) {
      var map = { "Pago": "ok", "Parcial": "warn", "Atrasado": "danger", "Em Falta": "off" };
      return '<span class="badge ' + (map[e] || "off") + '">' + U.esc(e) + "</span>";
    };
    var linhas = m.itens.length ? m.itens.map(function (it) {
      return "<tr><td>" + U.esc(it.descricao) + "</td><td>" + (it.vencimento ? U.dataPT(it.vencimento) : "—") + "</td>" +
        "<td style='text-align:right'>" + U.moeda(it.valorPrevisto) + "</td>" +
        "<td style='text-align:right'>" + U.moeda(it.valorPago) + "</td>" +
        "<td style='text-align:right'>" + U.moeda(it.saldo) + "</td><td>" + badge(it.estado) + "</td></tr>";
    }).join("") : "<tr><td colspan='6' style='text-align:center;color:#888'>Sem plano (curso sem valores definidos).</td></tr>";
    return '<div class="print-sheet" id="carneDoc">' +
      '<div class="ps-head"><div><h2>Mapa de Propinas</h2><div>' + U.esc(est.nome) + " · " + U.esc(est.matricula) + "</div></div>" +
        '<div class="org"><img src="' + U.logoURL(true) + '" alt="" style="height:42px"><br><strong>' + U.esc(s.instituicao) + "</strong></div></div>" +
      '<div class="doc-grid" style="margin-bottom:10px">' + C._docItem("Curso", est.curso) + C._docItem("Período", est.periodo) + "</div>" +
      "<table><thead><tr><th>Descrição</th><th>Vencimento</th><th style='text-align:right'>Previsto</th><th style='text-align:right'>Pago</th><th style='text-align:right'>Em dívida</th><th>Estado</th></tr></thead><tbody>" +
        linhas + "</tbody></table>" +
      '<div class="doc-amount"><span class="k">Total previsto</span><span class="v num">' + U.moeda(m.totalPrevisto) + "</span></div>" +
      '<div class="doc-amount"><span class="k">Total pago</span><span class="v num">' + U.moeda(m.totalPago) + "</span></div>" +
      '<div class="doc-amount"><span class="k">Total em dívida</span><span class="v num">' + U.moeda(m.totalDivida) + "</span></div>" +
      C._docFoot() + "</div>";
  };
  C.verMapaPropinas = function (est) {
    C.modal({
      title: "Mapa de Propinas — " + est.nome,
      body: C.mapaPropinasHTML(est),
      footer: '<button class="btn btn-light" onclick="App.closeModal()">Fechar</button>' +
        '<button class="btn btn-gold" id="cnPrint">Imprimir</button>',
      onOpen: function () { document.getElementById("cnPrint").onclick = function () { U.printElement("carneDoc", "Mapa de Propinas " + est.nome); }; }
    });
  };

  // ---- Fecho de caixa (A4) ------------------------------------------------
  // ---- Lista de turma (A4) ------------------------------------------------
  C.turmaHTML = function (t, estudantes) {
    var s = D.db().settings;
    var linhas = (estudantes && estudantes.length) ? estudantes.map(function (e, i) {
      var saldo = D.saldoDevedor(e);
      return "<tr><td>" + (i + 1) + "</td><td>" + U.esc(e.nome) + "</td><td>" + U.esc(e.matricula || "") +
        "</td><td>" + U.esc(e.contacto || "") + "</td><td>" + U.esc(e.estado || "") +
        "</td><td style='text-align:right'>" + U.moeda(D.totalPagoEstudante(e.id)) +
        "</td><td style='text-align:right'>" + (saldo > 0 ? U.moeda(saldo) : "—") + "</td></tr>";
    }).join("") : "<tr><td colspan='7' style='text-align:center;color:#888'>Sem estudantes.</td></tr>";
    var n = (estudantes || []).length;
    var comDiv = (estudantes || []).filter(function (e) { return D.saldoDevedor(e) > 0; }).length;
    return '<div class="print-sheet" id="turmaDoc">' +
      '<div class="ps-head"><div><h2>Lista de Turma</h2><div>' + U.esc(t.curso) + " · " + U.esc(t.periodo) + " · " + U.esc(t.anoLectivo) + "</div></div>" +
        '<div class="org"><img src="' + U.logoURL(true) + '" alt="" style="height:42px"><br><strong>' + U.esc(s.instituicao) + "</strong><br><small>" + U.esc(s.sistema) + "</small></div></div>" +
      "<table><thead><tr><th>Nº</th><th>Nome</th><th>Matrícula</th><th>Contacto</th><th>Estado</th><th style='text-align:right'>Pago</th><th style='text-align:right'>Em dívida</th></tr></thead><tbody>" +
        linhas + "</tbody></table>" +
      '<div class="doc-amount"><span class="k">Total de estudantes</span><span class="v num">' + n + "</span></div>" +
      '<div class="doc-amount"><span class="k">Regularizados</span><span class="v num">' + (n - comDiv) + "</span></div>" +
      '<div class="doc-amount"><span class="k">Com dívida</span><span class="v num">' + comDiv + "</span></div>" +
      C._docSign() + C._docFoot() + "</div>";
  };

  C.fechoHTML = function (fc) {
    var s = D.db().settings;
    var t = fc.totais || {};
    var linhaTot = function (k) { return "<tr><td>" + U.esc(k) + "</td><td style='text-align:right'>" + U.moeda(t[k] || 0) + "</td></tr>"; };
    var linhas = (fc.recibos || []).map(function (r) {
      return "<tr><td>" + U.esc(r.recibo) + "</td><td>" + U.esc(r.estudante) + "</td><td>" + U.esc(r.funcionario || "") +
        "</td><td>" + U.esc(r.forma || "") + "</td><td style='text-align:right'>" + U.moeda(r.valor) + "</td></tr>";
    }).join("");
    var tabObj = function (titulo, obj) {
      var ks = Object.keys(obj || {}).filter(function (k) { return (obj[k] || 0) !== 0; }).sort();
      if (!ks.length) return "";
      return "<h4>" + titulo + "</h4><table><tbody>" + ks.map(function (k) {
        return "<tr><td>" + U.esc(k) + "</td><td style='text-align:right'>" + U.moeda(obj[k]) + "</td></tr>";
      }).join("") + "</tbody></table>";
    };
    return '<div class="print-sheet" id="fechoDoc">' +
      '<div class="ps-head"><div><h2>Fecho de Caixa</h2><div>' + U.dataPT(fc.data) + " · " + U.esc(fc.funcionario || "Todos") + "</div></div>" +
        '<div class="org"><img src="' + U.logoURL(true) + '" alt="" style="height:42px"><br><strong>' + U.esc(s.instituicao) + "</strong></div></div>" +
      "<h4>Totais por forma de pagamento</h4>" +
      "<table><tbody>" +
        ["Dinheiro", "TPA", "Transferência", "Multicaixa Express", "Outras"].map(linhaTot).join("") +
        "<tr><th>Total geral</th><th style='text-align:right'>" + U.moeda(fc.totalGeral || 0) + "</th></tr>" +
        "<tr><td>Nº de recibos</td><td style='text-align:right'>" + (fc.numRecibos || 0) + "</td></tr>" +
      "</tbody></table>" +
      tabObj("Totais por emolumento", fc.porEmol) +
      tabObj("Totais por funcionário", fc.porFunc) +
      "<h4>Recibos do dia</h4>" +
      "<table><thead><tr><th>Recibo</th><th>Estudante</th><th>Funcionário</th><th>Forma</th><th style='text-align:right'>Valor</th></tr></thead><tbody>" +
        (linhas || "<tr><td colspan='5' style='text-align:center;color:#888'>Sem recibos.</td></tr>") + "</tbody></table>" +
      (fc.observacoes ? "<p><strong>Observações:</strong> " + U.esc(fc.observacoes) + "</p>" : "") +
      C._docSign() + C._docFoot() + "</div>";
  };

  // View receipt in modal with print/pdf actions
  C.viewReceipt = function (pag) {
    C.modal({
      title: "Recibo " + pag.recibo,
      body: C.receiptHTML(pag),
      footer:
        '<button class="btn btn-light" id="rcClose">Fechar</button>' +
        '<button class="btn btn-gold" id="rcPrint">Imprimir</button>' +
        '<button class="btn btn-primary" id="rcPdf">Guardar PDF</button>',
      onOpen: function () {
        document.getElementById("rcClose").onclick = C.closeModal;
        document.getElementById("rcPrint").onclick = function () { U.printElement("receiptDoc", "Recibo " + pag.recibo); };
        document.getElementById("rcPdf").onclick = function () {
          var b = this; b.disabled = true; var txt = b.textContent; b.textContent = "A gerar…";
          C.toast("A gerar o PDF do recibo…", "ok");
          U.baixarPDF("receiptDoc", "Recibo " + pag.recibo).then(function () { b.disabled = false; b.textContent = txt; });
        };
      }
    });
  };

  // View ficha de matrícula (2 vias) in modal with print/pdf actions
  C.viewFichaMatricula = function (est) {
    C.modal({
      title: "Ficha de Matrícula " + est.matricula,
      body: C.fichaMatriculaHTML(est),
      footer:
        '<button class="btn btn-light" id="fmClose">Fechar</button>' +
        '<button class="btn btn-gold" id="fmPrint">Imprimir</button>' +
        '<button class="btn btn-primary" id="fmPdf">Guardar PDF</button>',
      onOpen: function () {
        document.getElementById("fmClose").onclick = C.closeModal;
        var go = function () { U.printElement("fichaMatDoc", "Ficha de Matrícula " + est.matricula); };
        document.getElementById("fmPrint").onclick = go;
        document.getElementById("fmPdf").onclick = function () {
          var b = this; b.disabled = true; var txt = b.textContent; b.textContent = "A gerar…";
          C.toast("A gerar o PDF da ficha…", "ok");
          U.baixarPDF("fichaMatDoc", "Ficha de Matricula " + est.matricula).then(function () { b.disabled = false; b.textContent = txt; });
        };
      }
    });
  };

  window.C = C;
})(window);
