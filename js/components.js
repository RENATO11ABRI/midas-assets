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
    return '<div class="empty"><div class="big">' + (icon || "📭") + "</div><p>" + U.esc(msg) + "</p></div>";
  };

  C.estadoBadge = function (estado) {
    var map = {
      ativo: "ok", concluído: "info", concluido: "info",
      pendente: "warn", desistente: "danger", inativo: "off"
    };
    return '<span class="badge ' + (map[estado] || "off") + '">' + U.esc(estado || "—") + "</span>";
  };

  // ---- Receipt HTML --------------------------------------------------------
  // pag = pagamento record
  C.receiptHTML = function (pag) {
    var s = D.db().settings;
    return '' +
    '<div class="receipt" id="receiptDoc">' +
      '<div class="receipt-head">' +
        '<div class="r-brand"><span class="brand-mark">M</span><div>' +
          '<strong>' + U.esc(s.instituicao) + "</strong>" +
          '<small>' + U.esc(s.slogan) + "</small></div></div>" +
        '<div class="r-title"><h2>RECIBO DE PAGAMENTO</h2>' +
          '<div><strong>Nº ' + U.esc(pag.recibo) + "</strong></div>" +
          "<div>" + U.dataPT(pag.data) + "</div></div>" +
      "</div>" +
      '<div class="receipt-body">' +
        '<div class="r-meta">' +
          '<div class="box"><div class="k">Estudante</div><div class="v">' + U.esc(pag.estudanteNome) + "</div></div>" +
          '<div class="box"><div class="k">Contacto</div><div class="v">' + U.esc(pag.contacto || "—") + "</div></div>" +
          '<div class="box"><div class="k">Matrícula</div><div class="v">' + U.esc(pag.matricula || "—") + "</div></div>" +
        "</div>" +
        "<table><thead><tr><th>Descrição</th><th>Detalhe</th></tr></thead><tbody>" +
          C._rRow("Curso", pag.curso) +
          C._rRow("Tipo de curso", pag.tipoCurso) +
          C._rRow("Período", pag.periodo) +
          C._rRow("Duração", pag.duracao) +
          C._rRow("Regime de aulas", pag.regime) +
          C._rRow("Emolumento pago", pag.emolumento) +
          C._rRow("Forma de pagamento", pag.formaPagamento) +
        "</tbody></table>" +
        '<div class="r-total"><div class="amount">Valor pago: ' + U.moeda(pag.valorPago) + "</div></div>" +
        (pag.observacoes ? '<p style="margin-top:14px"><strong>Observações:</strong> ' + U.esc(pag.observacoes) + "</p>" : "") +
        '<div class="r-sign">' +
          '<div class="line"><div class="rule">' + U.esc(pag.funcionario || "Funcionário") + "</div>Recebido por</div>" +
          '<div class="line"><div class="rule">&nbsp;</div>Assinatura / Carimbo</div>' +
        "</div>" +
      "</div>" +
      '<div class="receipt-foot">' + U.esc(s.instituicao) +
        (s.nif ? " · NIF: " + U.esc(s.nif) : "") +
        (s.telefone ? " · Tel: " + U.esc(s.telefone) : "") +
        " · " + U.esc(s.endereco) + "</div>" +
    "</div>";
  };
  C._rRow = function (k, v) {
    if (!v) return "";
    return "<tr><td><strong>" + U.esc(k) + "</strong></td><td>" + U.esc(v) + "</td></tr>";
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
        '<button class="btn btn-gold" id="rcPrint">🖨️ Imprimir</button>' +
        '<button class="btn btn-primary" id="rcPdf">📄 Guardar PDF</button>',
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

  window.C = C;
})(window);
