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
    var close = function () { C.closeModal(); };
    host.querySelector(".modal-close").onclick = close;
    host.querySelector(".modal-backdrop").onclick = close;
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
    C.modal({
      title: opts.title || "Confirmar",
      body: '<p style="margin:0">' + U.esc(message) + "</p>",
      footer:
        '<button class="btn btn-light" id="cfNo">Cancelar</button>' +
        '<button class="btn ' + (opts.danger ? "btn-danger" : "btn-primary") + '" id="cfYes">' +
        U.esc(opts.yes || "Confirmar") + "</button>",
      onOpen: function () {
        document.getElementById("cfNo").onclick = C.closeModal;
        document.getElementById("cfYes").onclick = function () { C.closeModal(); onYes(); };
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

  // ---- Receipt (2 vias, A4) -----------------------------------------------
  // pag = pagamento record
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
      '<div class="doc-amount"><span class="k">Valor pago</span><span class="v num">' + U.moeda(pag.valorPago) + "</span></div>" +
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
      C._docSign() +
      '<div class="doc-foot">Documento emitido pelo sistema interno do ' + U.esc(s.instituicao) + ".</div>" +
      "</div>";
  };
  C.fichaMatriculaHTML = function (est) {
    var valor = D.totalPagoEstudante(est.id) || est.valorPago || 0;
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
          C.toast("Na janela de impressão escolha “Guardar como PDF”.", "ok");
          U.printElement("receiptDoc", "Recibo " + pag.recibo);
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
          C.toast("Na janela de impressão escolha “Guardar como PDF”.", "ok"); go();
        };
      }
    });
  };

  window.C = C;
})(window);
