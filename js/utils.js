/* ==========================================================================
   utils.js — Helpers de formatação, datas, impressão e exportação
   ========================================================================== */
(function (window) {
  "use strict";

  var U = {
    _settings: function () {
      try { return (window.MidasData && window.MidasData.db) ? window.MidasData.db().settings : {}; }
      catch (e) { return {}; }
    },
    moeda: function (v) {
      var st = U._settings();
      var d = st.casasDecimais == null ? 2 : Number(st.casasDecimais);
      var sym = st.moeda || "Kz";
      var n = Number(v) || 0;
      var s = n.toLocaleString("pt-PT", { minimumFractionDigits: d, maximumFractionDigits: d });
      return s + " " + sym;
    },
    // URL do logótipo (impressão usa o logótipo de impressão se definido)
    logoURL: function (paraImpressao) {
      var st = U._settings();
      if (paraImpressao && st.logoImpressao) return st.logoImpressao;
      if (st.logoPrincipal) return st.logoPrincipal;
      if (paraImpressao && st.logoPrincipal) return st.logoPrincipal;
      return U.assetURL("assets/logo.svg");
    },
    num: function (v) {
      var n = Number(v) || 0;
      return n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    parseMoeda: function (v) {
      if (v === null || v === undefined || v === "") return 0;
      var s = String(v).replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
      var n = parseFloat(s);
      return isNaN(n) ? 0 : n;
    },
    hoje: function () {
      var d = new Date();
      return d.toISOString().slice(0, 10);
    },
    agoraISO: function () { return new Date().toISOString(); },
    dataPT: function (iso) {
      if (!iso) return "—";
      var d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
      if (isNaN(d)) return iso;
      return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
    },
    dataHoraPT: function (iso) {
      if (!iso) return "—";
      var d = new Date(iso);
      if (isNaN(d)) return iso;
      return d.toLocaleDateString("pt-PT") + " " + d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    },
    mesAno: function (iso) {
      var d = new Date(iso);
      if (isNaN(d)) return "";
      return d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
    },
    ymd: function (iso) { return (iso || "").slice(0, 10); },
    ym: function (iso) { return (iso || "").slice(0, 7); },
    mesRef: function (v) {
      if (/^\d{4}-\d{2}$/.test(v || "")) {
        var m = U.mesAno(v + "-01");
        return m.charAt(0).toUpperCase() + m.slice(1);
      }
      return v || "";
    },

    // Absolute URL for an asset (so it resolves inside the print window too)
    assetURL: function (path) {
      try { return new URL(path, window.location.href).href; }
      catch (e) { return path; }
    },

    esc: function (s) {
      if (s === null || s === undefined) return "";
      return String(s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    },

    // Monta o HTML completo (A4) do documento a imprimir.
    // Só os stylesheets dos documentos entram; o overlay do redesign
    // (data-print="skip") fica de fora, senão redefine .doc-head/.doc-amount/
    // .doc-sign e distorce o recibo.
    _docHTML: function (el, titulo) {
      var styles = "";
      var links = document.querySelectorAll('link[rel="stylesheet"]');
      for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute("data-print") === "skip") continue;
        styles += '<link rel="stylesheet" href="' + links[i].href + '">';
      }
      return "<!DOCTYPE html><html lang='pt'><head><meta charset='utf-8'><title>" +
        U.esc(titulo || "Impressão") + "</title>" + styles +
        "<style>@page{size:A4;margin:14mm}html,body{background:#fff;margin:0;padding:10px;}</style>" +
        "</head><body>" + el.outerHTML + "</body></html>";
    },

    // Imprime um elemento (id) em A4 limpo. Usa um iframe oculto em vez de
    // window.open: não é bloqueado por pop-up blockers, funciona em telemóvel e
    // espera o load (CSS + imagens) antes de imprimir. Fallback para janela nova.
    printElement: function (elId, titulo) {
      var el = document.getElementById(elId);
      if (!el) return;
      var html = U._docHTML(el, titulo);

      var frame = document.createElement("iframe");
      frame.setAttribute("aria-hidden", "true");
      frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
      var feito = false;
      var imprimir = function () {
        if (feito) return; feito = true;
        var ok = false;
        try {
          var w = frame.contentWindow;
          w.focus(); w.print(); ok = true;
        } catch (e) { ok = false; }
        setTimeout(function () { if (frame.parentNode) frame.remove(); }, 1500);
        if (!ok) U._printPopup(html); // browsers antigos / iframe falhou
      };
      // Espera o conteúdo carregar (CSS + imagens) e dá uma folga de 200ms;
      // teto de segurança de 4s para nunca bloquear.
      frame.onload = function () { setTimeout(imprimir, 200); };
      setTimeout(imprimir, 4000);

      // srcdoc dispara um único load (com CSS+imagens), sem a corrida do
      // about:blank do document.write. Fallback p/ document.write se faltar.
      if ("srcdoc" in frame) {
        frame.srcdoc = html;
        document.body.appendChild(frame);
      } else {
        document.body.appendChild(frame);
        try {
          var doc = frame.contentWindow.document;
          doc.open(); doc.write(html); doc.close();
        } catch (e) {
          if (frame.parentNode) frame.remove();
          U._printPopup(html);
        }
      }
    },

    // Fallback: janela nova. Se o pop-up for bloqueado, avisa o utilizador.
    _printPopup: function (html) {
      var win = window.open("", "_blank", "width=900,height=700");
      if (!win) { alert("Permita pop-ups para este site para poder imprimir."); return; }
      win.document.open(); win.document.write(html); win.document.close();
      win.focus();
      setTimeout(function () { try { win.focus(); win.print(); } catch (e) {} }, 600);
    },

    // CSV export (Excel friendly, ; separator)
    exportCSV: function (filename, headers, rows) {
      var sep = ";";
      var lines = [];
      lines.push(headers.map(U._csvCell).join(sep));
      rows.forEach(function (r) { lines.push(r.map(U._csvCell).join(sep)); });
      var csv = "﻿" + lines.join("\r\n"); // BOM for UTF-8
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      U._download(blob, filename);
    },
    _csvCell: function (v) {
      if (v === null || v === undefined) v = "";
      v = String(v);
      // Anti-injeção de fórmulas (CSV injection): neutraliza células que comecem
      // por = + - @ (tab/CR) — o Excel executá-las-ia como fórmula.
      if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
      if (/[";\n]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
      return v;
    },
    _download: function (blob, filename) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    },
    downloadText: function (filename, text, mime) {
      var blob = new Blob([text], { type: (mime || "application/json") + ";charset=utf-8" });
      U._download(blob, filename);
    },

    // Link "click-to-chat" do WhatsApp (Angola: 9 dígitos → prefixo 244)
    whatsappURL: function (numero, mensagem) {
      var n = String(numero || "").replace(/\D/g, "");
      if (!n) return "";
      if (n.length === 9) n = "244" + n;
      return "https://wa.me/" + n + (mensagem ? "?text=" + encodeURIComponent(mensagem) : "");
    },

    // Parser CSV simples (deteta ; ou , ; suporta aspas). Devolve array de arrays.
    parseCSV: function (text) {
      text = String(text || "").replace(/^﻿/, ""); // remove BOM (CSV UTF-8 do Excel)
      var firstLine = text.split("\n")[0] || "";
      var delim = firstLine.indexOf(";") >= 0 ? ";" : ",";
      var rows = [], row = [], cur = "", inQ = false;
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (inQ) {
          if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
          else cur += ch;
        } else if (ch === '"') { inQ = true; }
        else if (ch === delim) { row.push(cur); cur = ""; }
        else if (ch === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
        else if (ch !== "\r") { cur += ch; }
      }
      if (cur.length || row.length) { row.push(cur); rows.push(row); }
      return rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ""; }); });
    },

    // small helpers
    by: function (key) { return function (a, b) { return a[key] < b[key] ? 1 : -1; }; },
    sum: function (arr, fn) { return arr.reduce(function (s, x) { return s + (Number(fn(x)) || 0); }, 0); },
    debounce: function (fn, ms) {
      var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 200); };
    },
    optionList: function (arr, sel) {
      return arr.map(function (v) {
        return '<option value="' + U.esc(v) + '"' + (v === sel ? " selected" : "") + ">" + U.esc(v) + "</option>";
      }).join("");
    }
  };

  window.U = U;
})(window);
