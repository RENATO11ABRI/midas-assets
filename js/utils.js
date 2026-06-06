/* ==========================================================================
   utils.js — Helpers de formatação, datas, impressão e exportação
   ========================================================================== */
(function (window) {
  "use strict";

  var U = {
    moeda: function (v) {
      var n = Number(v) || 0;
      var s = n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return s + " Kz";
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

    esc: function (s) {
      if (s === null || s === undefined) return "";
      return String(s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    },

    // Print a specific element by id in a clean window (professional A4)
    printElement: function (elId, titulo) {
      var el = document.getElementById(elId);
      if (!el) return;
      var win = window.open("", "_blank", "width=900,height=700");
      var styles = "";
      var links = document.querySelectorAll('link[rel="stylesheet"]');
      for (var i = 0; i < links.length; i++) {
        styles += '<link rel="stylesheet" href="' + links[i].href + '">';
      }
      win.document.write(
        "<!DOCTYPE html><html lang='pt'><head><meta charset='utf-8'><title>" +
        U.esc(titulo || "Impressão") + "</title>" + styles +
        "<style>@page{size:A4;margin:14mm}body{background:#fff;margin:0;padding:10px;}</style>" +
        "</head><body>" + el.outerHTML + "</body></html>"
      );
      win.document.close();
      win.focus();
      // Give styles a moment to load
      setTimeout(function () { win.print(); }, 350);
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
