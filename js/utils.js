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

    // Imprime um elemento (id) em A4 limpo, numa janela própria.
    // A janela é aberta SÍNCRONAMENTE dentro do gesto do clique (senão o
    // pop-up blocker bloqueia) e só imprime depois de o conteúdo carregar
    // (CSS + imagens), com teto de segurança para nunca bloquear.
    printElement: function (elId, titulo) {
      var el = document.getElementById(elId);
      if (!el) return;
      var win = window.open("", "_blank", "width=900,height=700");
      if (!win) { alert("Para imprimir, permita pop-ups para este site e tente novamente."); return; }

      var html = U._docHTML(el, titulo);
      win.document.open(); win.document.write(html); win.document.close();

      var feito = false;
      var imprimir = function () {
        if (feito) return; feito = true;
        try { win.focus(); win.print(); } catch (e) {}
      };
      // Imprime quando a janela acabar de carregar; se já estiver pronta, dá
      // uma folga curta; teto de 4s para o caso de o load não disparar.
      win.onload = function () { setTimeout(imprimir, 200); };
      if (win.document.readyState === "complete") setTimeout(imprimir, 350);
      setTimeout(imprimir, 4000);
    },

    // Carrega um script externo só quando é preciso (lazy), com cache de
    // promessa para não recarregar. Usado para o gerador de PDF.
    _carregarScript: function (src) {
      U._scripts = U._scripts || {};
      if (U._scripts[src]) return U._scripts[src];
      U._scripts[src] = new Promise(function (res, rej) {
        var s = document.createElement("script");
        s.src = src;
        s.onload = function () { res(); };
        s.onerror = function () { U._scripts[src] = null; rej(new Error("Falha ao carregar " + src)); };
        document.head.appendChild(s);
      });
      return U._scripts[src];
    },

    // Nome de ficheiro seguro (sem / \ : * ? " < > | e espaços a mais).
    _nomeFicheiro: function (s) {
      return String(s || "documento").replace(/[\/\\:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
    },

    // Gera um PDF (A4) a partir de um elemento e faz download direto — sem
    // diálogo de impressão. Ideal para telemóvel. Usa html2canvas + jsPDF
    // (carregados sob procura). O documento sai igual ao da impressão: o
    // overlay do redesign (data-print="skip") é desativado durante a captura.
    baixarPDF: function (elId, filename, opts) {
      var el = document.getElementById(elId);
      if (!el) return Promise.resolve(false);
      opts = opts || {};
      var margem = typeof opts.margem === "number" ? opts.margem : 12; // mm
      var H2C = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
      var JPDF = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
      // Desativa o overlay do redesign durante a captura (mesmo look da impressão).
      var overlays = document.querySelectorAll('link[rel="stylesheet"][data-print="skip"]');
      var setOverlay = function (off) { for (var i = 0; i < overlays.length; i++) overlays[i].disabled = off; };
      return Promise.all([U._carregarScript(H2C), U._carregarScript(JPDF)]).then(function () {
        var html2canvas = window.html2canvas;
        var jsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
        if (!html2canvas || !jsPDF) throw new Error("Bibliotecas de PDF indisponíveis");
        setOverlay(true);
        return html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false })
          .then(function (canvas) {
            setOverlay(false);
            var pdf = new jsPDF("p", "mm", "a4");
            var pw = pdf.internal.pageSize.getWidth();
            var ph = pdf.internal.pageSize.getHeight();
            var imgW = pw - margem * 2;
            var imgH = canvas.height * imgW / canvas.width;
            // PNG: texto e tabelas nítidos (melhor que JPEG para documentos).
            var img = canvas.toDataURL("image/png");
            if (imgH <= ph - margem * 2) {
              // Cabe numa página: centra verticalmente um pouco no topo.
              pdf.addImage(img, "PNG", margem, margem, imgW, imgH);
            } else {
              // Documento mais alto que uma página: pagina deslocando a imagem.
              var pageH = ph - margem * 2, pos = 0;
              while (pos < imgH) {
                pdf.addImage(img, "PNG", margem, margem - pos, imgW, imgH);
                pos += pageH;
                if (pos < imgH) pdf.addPage();
              }
            }
            pdf.save(U._nomeFicheiro(filename) + ".pdf");
            return true;
          });
      }).catch(function (e) {
        setOverlay(false);
        alert("Não foi possível gerar o PDF (verifique a ligação à internet). Pode usar “Imprimir” e escolher “Guardar como PDF”.");
        return false;
      });
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
