/* ==========================================================================
   app.js — Router, eventos e ligação de tudo
   Grupo Midas Angola · Turmas Midas 2026
   ========================================================================== */
(function (window) {
  "use strict";
  var U = window.U, C = window.C, D = window.MidasData, V = window.V;

  var ROUTES = {
    dashboard: { title: "Dashboard", render: V.dashboard },
    matricula: { title: "Nova Matrícula", render: V.matricula },
    estudantes: { title: "Estudantes", render: V.estudantes, after: afterEstudantes },
    cursos: { title: "Cursos", render: V.cursos, after: afterCursos },
    pagamentos: { title: "Pagamentos", render: V.pagamentos, after: afterPagamentos },
    recibos: { title: "Recibos", render: V.recibos, after: afterRecibos },
    relatorios: { title: "Relatórios", render: V.relatorios, after: afterRelatorios },
    config: { title: "Configurações", render: V.config, after: afterConfig }
  };

  var App = {
    current: "dashboard",
    params: {},

    navigate: function (route, params) {
      this.params = params || {};
      if (location.hash !== "#" + route) {
        location.hash = "#" + route; // triggers hashchange -> render
        // if params provided, render directly (hash same scenario handled below)
        if (params) this.render(route);
      } else {
        this.render(route);
      }
    },

    refresh: function () { this.render(this.current); },

    render: function (route) {
      route = route || "dashboard";
      if (!ROUTES[route]) route = "dashboard";
      this.current = route;
      var view = document.getElementById("view");
      view.innerHTML = ROUTES[route].render(this.params);
      view.scrollTop = 0; window.scrollTo(0, 0);
      // active nav
      var links = document.querySelectorAll(".nav-link");
      for (var i = 0; i < links.length; i++) {
        links[i].classList.toggle("active", links[i].getAttribute("data-route") === route);
      }
      if (ROUTES[route].after) ROUTES[route].after();
      closeNav();
      // reset params after render so they don't leak
      if (route !== "matricula") this.params = {};
    },

    closeModal: function () { C.closeModal(); }
  };

  /* ---- After-render wiring per route ------------------------------------ */
  function afterEstudantes() {
    V.renderEstudantesTable();
    var rerender = U.debounce(V.renderEstudantesTable, 150);
    document.getElementById("estSearch").addEventListener("input", rerender);
    document.getElementById("estFiltroCurso").addEventListener("change", V.renderEstudantesTable);
    document.getElementById("estFiltroEstado").addEventListener("change", V.renderEstudantesTable);
    document.getElementById("expEstCsv").onclick = exportEstudantesCSV;
    document.getElementById("expEstPdf").onclick = function () {
      var r = V.buildReport("matriculas", "", "");
      openReportPrint(r);
    };
  }

  function afterCursos() {
    V.renderCursosTable();
    document.getElementById("novoCurso").onclick = function () { V.editarCurso(null); };
    document.getElementById("cursoSearch").addEventListener("input", U.debounce(V.renderCursosTable, 150));
    document.getElementById("cursoFiltroTipo").addEventListener("change", V.renderCursosTable);
    document.getElementById("cursoFiltroEstado").addEventListener("change", V.renderCursosTable);
    document.getElementById("expCursoCsv").onclick = exportCursosCSV;
  }

  function afterPagamentos() {
    V.renderPagamentos();
    document.getElementById("novoPag").onclick = function () { V.novoPagamento(null); };
    ["pagSearch", "pagFiltroCurso", "pagFiltroEmol", "pagDe", "pagAte"].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener(el.tagName === "INPUT" && el.type !== "date" ? "input" : "change",
        U.debounce(V.renderPagamentos, 150));
    });
    document.getElementById("expPagCsv").onclick = exportPagamentosCSV;
    document.getElementById("expPagPdf").onclick = function () {
      var r = V.buildReport("pagamentos", document.getElementById("pagDe").value, document.getElementById("pagAte").value);
      openReportPrint(r);
    };
  }

  function afterRecibos() {
    V.renderRecibos();
    // search listeners
    ["recSearch", "recDe", "recAte"].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener(el.type === "date" ? "change" : "input", U.debounce(V.renderRecibos, 150));
    });

    var form = document.getElementById("formRecibo");
    var setVal = function (n, v) { if (form.elements[n]) form.elements[n].value = v == null ? "" : v; };

    // auto-fill from selected student
    document.getElementById("recEst").addEventListener("change", function () {
      var est = D.estudanteById(this.value);
      if (!est) return;
      setVal("nome", est.nome); setVal("contacto", est.contacto); setVal("matricula", est.matricula);
      setVal("curso", est.curso); setVal("periodo", est.periodo); setVal("unidade", est.unidade);
    });

    document.getElementById("recLimpar").onclick = function () {
      form.reset();
      setVal("data", U.hoje());
      var pc = document.getElementById("recPreviewCard"); pc.hidden = true;
      document.getElementById("recPreview").innerHTML = "";
    };

    document.getElementById("recGerar").onclick = function () {
      var g = function (n) { return form.elements[n] ? form.elements[n].value : ""; };
      var nome = (g("nome") || "").trim();
      var valor = U.parseMoeda(g("valorPago"));
      if (!nome) { C.toast("Indique o nome do estudante.", "err"); return; }
      if (!(valor > 0)) { C.toast("O valor pago deve ser maior que zero.", "err"); return; }
      var dataVal = g("data");
      var pag = {
        recibo: D.nextRecibo(),
        estudanteId: g("estudanteId") || "",
        estudanteNome: nome, matricula: g("matricula"), contacto: g("contacto"),
        curso: g("curso"), periodo: g("periodo"), unidade: g("unidade"),
        tipoCurso: "", duracao: "", regime: "",
        emolumento: g("emolumento") || "Outro", mesReferencia: g("mesReferencia"),
        valorPago: valor, formaPagamento: g("formaPagamento"),
        funcionario: g("funcionario"), referencia: "", observacoes: g("observacoes"),
        data: dataVal ? dataVal + "T" + new Date().toTimeString().slice(0, 8) : U.agoraISO()
      };
      D.savePagamento(pag);
      App._lastRecibo = pag;
      document.getElementById("recPreview").innerHTML = C.receiptHTML(pag);
      document.getElementById("recPreviewCard").hidden = false;
      document.getElementById("recNum").textContent = D.peekRecibo();
      C.toast("Recibo " + pag.recibo + " gerado.", "ok");
      V.renderRecibos();
      document.getElementById("recPreviewCard").scrollIntoView({ behavior: "smooth", block: "start" });
    };

    var printRec = function () {
      if (!App._lastRecibo) { C.toast("Gere um recibo primeiro.", "err"); return; }
      U.printElement("receiptDoc", "Recibo " + App._lastRecibo.recibo);
    };
    document.getElementById("recImprimir").onclick = printRec;
    document.getElementById("recPdf").onclick = function () {
      C.toast("Na janela de impressão escolha “Guardar como PDF”.", "ok"); printRec();
    };
  }

  function afterRelatorios() {
    document.getElementById("relGerar").onclick = gerarRelatorio;
    document.getElementById("relPrint").onclick = function () {
      if (!document.getElementById("reportDoc")) { C.toast("Gere um relatório primeiro.", "err"); return; }
      U.printElement("reportDoc", document.getElementById("relTitulo").textContent);
    };
    document.getElementById("relCsv").onclick = function () {
      if (!App._lastReport) { C.toast("Gere um relatório primeiro.", "err"); return; }
      var r = App._lastReport;
      U.exportCSV(slug(r.titulo) + ".csv", r.headers, r.rows.map(stripHtmlRow));
    };
  }
  function gerarRelatorio() {
    var tipo = document.getElementById("relTipo").value;
    var de = document.getElementById("relDe").value, ate = document.getElementById("relAte").value;
    var r = V.buildReport(tipo, de, ate);
    App._lastReport = r;
    document.getElementById("relTitulo").textContent = r.titulo;
    document.getElementById("relOut").innerHTML = C.reportSheet(r.titulo, r.sub, r.headers, r.rows, r.totals);
  }

  function afterConfig() {
    var tabs = document.getElementById("cfgTabs");
    var content = document.getElementById("cfgContent");
    function show(tab) {
      var t = tabs.querySelectorAll(".tab");
      for (var i = 0; i < t.length; i++) t[i].classList.toggle("active", t[i].getAttribute("data-tab") === tab);
      if (tab === "inst") { content.innerHTML = V.cfgInst(); wireInst(); }
      else if (tab === "listas") { content.innerHTML = V.cfgListas(); }
      else if (tab === "conta") { content.innerHTML = V.cfgConta(); wireConta(); }
      else { content.innerHTML = V.cfgDados(); wireDados(); }
    }
    tabs.addEventListener("click", function (e) {
      var tab = e.target.getAttribute("data-tab");
      if (tab) show(tab);
    });
    show("inst");
  }
  function wireInst() {
    document.getElementById("formInst").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var fd = new FormData(ev.target);
      var s = D.db().settings;
      ["instituicao", "sistema", "slogan", "anoLetivo", "nif", "telefone", "email", "endereco", "secretaria", "diretora"].forEach(function (k) {
        s[k] = fd.get(k);
      });
      s.seqMatricula = parseInt(fd.get("seqMatricula"), 10) || s.seqMatricula;
      s.seqRecibo = parseInt(fd.get("seqRecibo"), 10) || s.seqRecibo;
      D.save();
      C.toast("Configurações guardadas.", "ok");
    });
  }
  function wireConta() {
    document.getElementById("formConta").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var fd = new FormData(ev.target);
      var user = (fd.get("user") || "").trim();
      var nome = (fd.get("nome") || "").trim();
      var p1 = fd.get("novaPass"), p2 = fd.get("novaPass2");
      if (!user) { C.toast("Indique o utilizador.", "err"); return; }
      if (p1 || p2) {
        if (p1 !== p2) { C.toast("As palavras-passe não coincidem.", "err"); return; }
        if (p1.length < 4) { C.toast("A palavra-passe deve ter pelo menos 4 caracteres.", "err"); return; }
      }
      var a = D.auth();
      a.enabled = fd.get("enabled") !== "Não";
      D.definirCredenciais(user, nome, p1 || null);
      D.save();
      var chip = document.getElementById("userChip");
      if (chip) chip.textContent = "" + (a.nome || a.user);
      C.toast("Conta atualizada." + (p1 ? " Palavra-passe alterada." : ""), "ok");
    });
  }
  function wireDados() {
    document.getElementById("bkExport").onclick = function () {
      U.downloadText("backup-midas-" + U.hoje() + ".json", D.export());
      C.toast("Backup exportado.", "ok");
    };
    document.getElementById("bkImportBtn").onclick = function () { document.getElementById("bkImportFile").click(); };
    document.getElementById("bkImportFile").onchange = function (e) {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try { D.import(reader.result); C.toast("Backup importado.", "ok"); App.refresh(); }
        catch (err) { C.toast("Ficheiro inválido.", "err"); }
      };
      reader.readAsText(file);
    };
    document.getElementById("bkCatalogo").onclick = function () {
      C.confirm("Repor o catálogo de cursos oficial? Os estudantes e pagamentos são mantidos.", function () {
        D.reporCatalogo(); C.toast("Catálogo de cursos atualizado.", "ok"); App.refresh();
      }, { yes: "Repor catálogo" });
    };
    document.getElementById("bkReset").onclick = function () {
      C.confirm("Repor dados de fábrica? Todos os estudantes, pagamentos e cursos serão apagados.", function () {
        D.reset(); C.toast("Dados repostos.", "ok"); App.navigate("dashboard");
      }, { danger: true, yes: "Repor tudo" });
    };
  }

  /* ---- Matrícula form submit -------------------------------------------- */
  function wireMatriculaForm() {
    var form = document.getElementById("formMatricula");
    if (!form) return;
    // auto-fill on course select
    var selCurso = document.getElementById("selCurso");
    selCurso.addEventListener("change", function () {
      var c = D.cursoByNome(selCurso.value);
      if (!c) return;
      setIfEmpty("tipoCurso", c.tipo);
      setIfEmpty("duracao", c.duracao);
      setVal("periodo", c.periodo);
      setVal("regime", c.regime);
      setVal("unidade", c.unidade);
      setIfEmpty("valorInscricao", c.valorInscricao);
      setIfEmpty("valorMatricula", c.valorMatricula);
    });
    function setVal(name, v) { var el = form.elements[name]; if (el && !el.value) el.value = v == null ? "" : v; }
    function setIfEmpty(name, v) { var el = form.elements[name]; if (el && (!el.value || el.value === "0")) el.value = v == null ? "" : v; }

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var fd = new FormData(form);
      var nome = (fd.get("nome") || "").trim();
      var contacto = (fd.get("contacto") || "").trim();
      var curso = (fd.get("curso") || "").trim();
      if (!nome || !contacto || !curso) {
        C.toast("Nome, contacto e curso são obrigatórios.", "err"); return;
      }
      var editing = !!fd.get("id");
      var est = {
        id: fd.get("id") || undefined,
        matricula: editing ? fd.get("matricula") : D.nextMatricula(),
        nome: nome, bi: fd.get("bi"), dataNascimento: fd.get("dataNascimento"),
        contacto: contacto, whatsapp: fd.get("whatsapp"), morada: fd.get("morada"),
        curso: curso, unidade: fd.get("unidade"), periodo: fd.get("periodo"),
        tipoCurso: fd.get("tipoCurso"), duracao: fd.get("duracao"), regime: fd.get("regime"),
        dataMatricula: fd.get("dataMatricula") || U.hoje(),
        valorInscricao: U.parseMoeda(fd.get("valorInscricao")),
        valorMatricula: U.parseMoeda(fd.get("valorMatricula")),
        valorPago: U.parseMoeda(fd.get("valorPago")),
        formaPagamento: fd.get("formaPagamento"),
        funcionario: fd.get("funcionario"),
        estado: fd.get("estado") || "ativo",
        observacoes: fd.get("observacoes")
      };
      D.saveEstudante(est);

      var valorPago = U.parseMoeda(fd.get("valorPago"));
      var gerar = document.getElementById("gerarRecibo") && document.getElementById("gerarRecibo").checked;
      if (!editing && gerar && valorPago > 0) {
        var pag = V._criarPagamento(est, {
          emolumento: fd.get("emolumento") || "Matrícula",
          valorPago: valorPago,
          formaPagamento: fd.get("formaPagamento"),
          funcionario: fd.get("funcionario"),
          data: U.agoraISO(),
          observacoes: fd.get("observacoes")
        });
        C.toast("Matrícula " + est.matricula + " salva. Recibo " + pag.recibo + " gerado.", "ok");
        App.navigate("estudantes");
        C.viewFichaMatricula(est);
        return;
      }
      C.toast(editing ? "Alterações guardadas." : "Matrícula " + est.matricula + " salva.", "ok");
      App.navigate("estudantes");
      if (!editing) C.viewFichaMatricula(est);
    });
  }

  /* ---- Exports ---------------------------------------------------------- */
  function exportEstudantesCSV() {
    var headers = ["Matrícula", "Nome", "BI", "Contacto", "WhatsApp", "Curso", "Unidade", "Período", "Tipo", "Duração", "Regime", "Data matrícula", "Total pago", "Estado"];
    var rows = D.estudantes().sort(U.by("dataMatricula")).map(function (e) {
      return [e.matricula, e.nome, e.bi, e.contacto, e.whatsapp, e.curso, e.unidade, e.periodo, e.tipoCurso, e.duracao, e.regime, U.dataPT(e.dataMatricula), U.num(D.totalPagoEstudante(e.id)), e.estado];
    });
    U.exportCSV("estudantes-midas.csv", headers, rows);
    C.toast("CSV de estudantes exportado.", "ok");
  }
  function exportCursosCSV() {
    var headers = ["Nome", "Tipo", "Duração", "Período", "Regime", "Inscrição", "Matrícula", "Mensalidade", "Total", "Unidade", "Estado"];
    var rows = D.cursos().map(function (c) {
      return [c.nome, c.tipo, c.duracao, c.periodo, c.regime, U.num(c.valorInscricao), U.num(c.valorMatricula), U.num(c.valorMensalidade), U.num(c.valorTotal), c.unidade, c.estado];
    });
    U.exportCSV("cursos-midas.csv", headers, rows);
    C.toast("CSV de cursos exportado.", "ok");
  }
  function exportPagamentosCSV() {
    var headers = ["Data", "Recibo", "Estudante", "Matrícula", "Curso", "Emolumento", "Forma", "Funcionário", "Valor"];
    var rows = D.pagamentos().sort(U.by("data")).map(function (p) {
      return [U.dataPT(p.data), p.recibo, p.estudanteNome, p.matricula, p.curso, p.emolumento, p.formaPagamento, p.funcionario, U.num(p.valorPago)];
    });
    U.exportCSV("pagamentos-midas.csv", headers, rows);
    C.toast("CSV de pagamentos exportado.", "ok");
  }

  function openReportPrint(r) {
    // render in a hidden host then print
    var host = document.createElement("div");
    host.style.position = "fixed"; host.style.left = "-9999px"; host.style.top = "0";
    host.innerHTML = C.reportSheet(r.titulo, r.sub, r.headers, r.rows, r.totals);
    document.body.appendChild(host);
    U.printElement("reportDoc", r.titulo);
    setTimeout(function () { host.remove(); }, 1500);
  }
  function stripHtmlRow(row) {
    return row.map(function (c) { return String(c == null ? "" : c).replace(/<[^>]*>/g, ""); });
  }
  function slug(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

  /* ---- Global delegated click handler ----------------------------------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-go],[data-est-view],[data-est-ficha],[data-est-edit],[data-est-pay],[data-est-del]," +
      "[data-curso-edit],[data-curso-del],[data-pag-view],[data-pag-del],[data-lista-add],[data-lista-del]");
    if (!t) return;

    var go = t.getAttribute("data-go");
    if (go) { App.navigate(go); return; }

    var id;
    if ((id = t.getAttribute("data-est-view"))) { V.fichaEstudante(id); return; }
    if ((id = t.getAttribute("data-est-ficha"))) { var ef = D.estudanteById(id); if (ef) C.viewFichaMatricula(ef); return; }
    if ((id = t.getAttribute("data-est-edit"))) { App.navigate("matricula", { id: id }); return; }
    if ((id = t.getAttribute("data-est-pay"))) { V.novoPagamento(id); return; }
    if ((id = t.getAttribute("data-est-del"))) {
      var est = D.estudanteById(id);
      C.confirm("Eliminar o estudante " + (est ? est.nome : "") + "? Os pagamentos associados serão mantidos.", function () {
        D.deleteEstudante(id); C.toast("Estudante eliminado.", "ok"); V.renderEstudantesTable();
      }, { danger: true, yes: "Eliminar" });
      return;
    }
    if ((id = t.getAttribute("data-curso-edit"))) { V.editarCurso(id); return; }
    if ((id = t.getAttribute("data-curso-del"))) {
      var crs = D.cursoById(id);
      C.confirm("Eliminar o curso " + (crs ? crs.nome : "") + "?", function () {
        D.deleteCurso(id); C.toast("Curso eliminado.", "ok"); V.renderCursosTable();
      }, { danger: true, yes: "Eliminar" });
      return;
    }
    if ((id = t.getAttribute("data-pag-view"))) { var p = D.pagamentoById(id); if (p) C.viewReceipt(p); return; }
    if ((id = t.getAttribute("data-pag-del"))) {
      C.confirm("Eliminar este pagamento/recibo? Esta ação não pode ser desfeita.", function () {
        D.deletePagamento(id); C.toast("Pagamento eliminado.", "ok");
        if (App.current === "pagamentos") V.renderPagamentos();
        else if (App.current === "recibos") V.renderRecibos();
        else App.refresh();
      }, { danger: true, yes: "Eliminar" });
      return;
    }
    // listas (config)
    var addKey = t.getAttribute("data-lista-add");
    if (addKey) {
      var input = document.getElementById("add_" + addKey);
      var val = (input.value || "").trim();
      if (!val) { C.toast("Escreva um valor.", "err"); return; }
      var db = D.db(); db[addKey] = db[addKey] || []; db[addKey].push(val); D.save();
      C.toast("Adicionado.", "ok"); reloadCfgListas();
      return;
    }
    var delKey = t.getAttribute("data-lista-del");
    if (delKey) {
      var idx = parseInt(t.getAttribute("data-idx"), 10);
      var db2 = D.db(); db2[delKey].splice(idx, 1); D.save();
      C.toast("Removido.", "ok"); reloadCfgListas();
      return;
    }
  });
  function reloadCfgListas() {
    var content = document.getElementById("cfgContent");
    if (content) content.innerHTML = V.cfgListas();
  }

  /* ---- Mobile nav ------------------------------------------------------- */
  function openNav() { document.getElementById("sidebar").classList.add("open"); document.body.classList.add("nav-open"); }
  function closeNav() { document.getElementById("sidebar").classList.remove("open"); document.body.classList.remove("nav-open"); }

  /* ---- Boot ------------------------------------------------------------- */
  function boot() {
    // Gate behind login first; only start the app once authenticated.
    window.Auth.gate(startApp);
  }

  function startApp() {
    // user chip + logout
    var a = D.auth();
    var chip = document.getElementById("userChip");
    if (chip) chip.textContent = "" + (a.nome || a.user);
    var logout = document.getElementById("logoutBtn");
    if (logout) logout.onclick = function () {
      C.confirm("Terminar a sessão?", function () {
        window.Auth.logout();
        location.reload();
      }, { yes: "Terminar sessão" });
    };

    document.getElementById("menuToggle").addEventListener("click", openNav);
    document.getElementById("overlay").addEventListener("click", closeNav);

    window.addEventListener("hashchange", function () {
      App.render((location.hash || "#dashboard").slice(1));
      if (App.current === "matricula") wireMatriculaForm();
    });

    // initial route
    var initial = (location.hash || "#dashboard").slice(1);
    App.render(initial);
    if (App.current === "matricula") wireMatriculaForm();

    // wire matricula form whenever rendered via navigate (hook into render)
    var origRender = App.render.bind(App);
    App.render = function (route) {
      origRender(route);
      if (App.current === "matricula") wireMatriculaForm();
    };
  }

  window.App = App;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
