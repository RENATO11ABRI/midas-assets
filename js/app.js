/* ==========================================================================
   app.js — Router, eventos e ligação de tudo
   Grupo Midas Angola · Turmas Midas 2026
   ========================================================================== */
(function (window) {
  "use strict";
  var U = window.U, C = window.C, D = window.MidasData, V = window.V;

  /* ---- Aparência (temas, cores, modo dia/noite) ------------------------- */
  var TEMAS = {
    "Verde Midas":              { brandTop: "#072720", brandBottom: "#082e37", primary: "#0f4d3a", primaryHover: "#146449", heroMid: "#0b3f4c", heroEnd: "#12647a", accent: "#c9a24b", accentHover: "#a07f2f" },
    "Azul Executivo":           { brandTop: "#0a2a43", brandBottom: "#0c1f33", primary: "#155e8c", primaryHover: "#1c75ad", heroMid: "#0f4a73", heroEnd: "#2a83b8", accent: "#cf9b3f", accentHover: "#a87d2c" },
    "Verde Escuro Institucional": { brandTop: "#04231a", brandBottom: "#062b22", primary: "#0c5a3f", primaryHover: "#11744f", heroMid: "#063a2c", heroEnd: "#0c7a57", accent: "#c9a24b", accentHover: "#9c7a2c" },
    "Preto Premium":            { brandTop: "#0c0d0f", brandBottom: "#16181c", primary: "#23262c", primaryHover: "#33373f", heroMid: "#1a1c20", heroEnd: "#2a2e35", accent: "#caa44c", accentHover: "#a8853a" }
  };
  function applyAparencia() {
    var s = D.db().settings;
    var t = TEMAS[s.tema] || TEMAS["Verde Midas"];
    var brand = s.corPrincipal || t.brandTop;
    var sec = s.corSecundaria || t.heroEnd;
    var btn = s.corBotao || t.primary;
    var root = document.documentElement.style;
    root.setProperty("--green-900", brand);
    root.setProperty("--green-800", t.brandBottom);
    root.setProperty("--teal-900", t.brandBottom);
    root.setProperty("--teal-800", t.heroMid);
    root.setProperty("--teal-600", sec);
    root.setProperty("--green-700", btn);
    root.setProperty("--green-600", t.primaryHover);
    root.setProperty("--gold-500", t.accent);
    root.setProperty("--gold-600", t.accentHover);
    document.body.classList.toggle("dark", s.modo === "noite");
    // logótipos dinâmicos
    var url = U.logoURL(false);
    var imgs = document.querySelectorAll("#app .logo");
    for (var i = 0; i < imgs.length; i++) imgs[i].src = url;
  }
  window.applyAparencia = applyAparencia;

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
    ["pagSearch", "pagFiltroCurso", "pagFiltroEmol", "pagFiltroUnidade", "pagDe", "pagAte"].forEach(function (id) {
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

    // auto-fill value when selecting the emolumento
    var recEmol = document.getElementById("recEmol");
    if (recEmol) recEmol.addEventListener("change", function () {
      var v = D.emolumentoValor(this.value);
      if (v > 0) setVal("valorPago", v);
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
      var emo = D.emolumentoById(g("emolumentoId"));
      var pag = {
        recibo: D.nextRecibo(),
        estudanteId: g("estudanteId") || "",
        estudanteNome: nome, matricula: g("matricula"), contacto: g("contacto"),
        curso: g("curso"), periodo: g("periodo"), unidade: g("unidade"),
        tipoCurso: "", duracao: "", regime: "",
        emolumentoId: emo ? emo.id : "", emolumento: emo ? emo.nome : "Outros",
        categoria: emo ? emo.categoria : "Outros", mesReferencia: g("mesReferencia"),
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
      else if (tab === "aparencia") { content.innerHTML = V.cfgAparencia(); wireAparencia(); }
      else if (tab === "emolumentos") { content.innerHTML = V.cfgEmolumentos(); wireEmolumentos(); }
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
    var pendingLogo = null;
    var fileEl = document.getElementById("logoFile");
    if (fileEl) fileEl.onchange = function (e) {
      var file = e.target.files[0]; if (!file) return;
      if (file.size > 600000) { C.toast("Imagem muito grande (máx. ~600 KB).", "err"); return; }
      var reader = new FileReader();
      reader.onload = function () { pendingLogo = reader.result; document.getElementById("logoPrev").src = reader.result; };
      reader.readAsDataURL(file);
    };
    document.getElementById("logoRemover").onclick = function () {
      pendingLogo = ""; document.getElementById("logoPrev").src = U.assetURL("assets/logo.svg");
      C.toast("Logótipo será removido ao guardar.", "ok");
    };
    document.getElementById("formInst").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var fd = new FormData(ev.target);
      var s = D.db().settings;
      ["instituicao", "sistema", "slogan", "anoLetivo", "anoLectivo", "nif", "telefone", "whatsapp",
        "email", "website", "endereco", "secretaria", "diretora", "directorGeral", "moeda",
        "prefixoMatricula", "prefixoRecibo"].forEach(function (k) { s[k] = fd.get(k); });
      s.casasDecimais = parseInt(fd.get("casasDecimais"), 10);
      s.digitosMatricula = parseInt(fd.get("digitosMatricula"), 10) || 4;
      s.digitosRecibo = parseInt(fd.get("digitosRecibo"), 10) || 4;
      s.seqMatricula = parseInt(fd.get("seqMatricula"), 10) || s.seqMatricula;
      s.seqRecibo = parseInt(fd.get("seqRecibo"), 10) || s.seqRecibo;
      if (pendingLogo !== null) s.logoPrincipal = pendingLogo;
      D.save();
      applyAparencia();
      C.toast("Configurações guardadas.", "ok");
    });
  }
  function wireAparencia() {
    var form = document.getElementById("formAparencia");
    var s = D.db().settings;
    document.getElementById("temaCards").addEventListener("click", function (e) {
      var card = e.target.closest("[data-tema]"); if (!card) return;
      var t = card.getAttribute("data-tema");
      document.getElementById("temaInput").value = t;
      var cards = this.querySelectorAll(".tema-card");
      for (var i = 0; i < cards.length; i++) cards[i].classList.toggle("sel", cards[i] === card);
    });
    document.getElementById("apModo").onclick = function () {
      s.modo = s.modo === "noite" ? "dia" : "noite"; D.save(); applyAparencia();
      this.textContent = "Modo: " + (s.modo === "noite" ? "Noite" : "Dia");
    };
    var aplicar = function () {
      var fd = new FormData(form);
      s.tema = fd.get("tema") || s.tema;
      if (fd.get("usarCores")) {
        s.corPrincipal = fd.get("corPrincipal") || "";
        s.corSecundaria = fd.get("corSecundaria") || "";
        s.corBotao = fd.get("corBotao") || "";
      } else {
        s.corPrincipal = ""; s.corSecundaria = ""; s.corBotao = "";
      }
      D.save(); applyAparencia();
    };
    document.getElementById("apPrever").onclick = aplicar;
    form.addEventListener("submit", function (ev) { ev.preventDefault(); aplicar(); C.toast("Aparência guardada.", "ok"); });
  }
  function wireEmolumentos() {
    V.renderEmolumentos();
    document.getElementById("emNovo").onclick = function () { V.editarEmolumento(null); };
    ["emSearch", "emFiltroCat", "emFiltroEstado"].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener(el.tagName === "INPUT" ? "input" : "change", U.debounce(V.renderEmolumentos, 120));
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
    V.renderLixo();
    document.getElementById("lixoEsvaziar").onclick = function () {
      C.confirm("Esvaziar a reciclagem? Os registos eliminados não poderão ser recuperados.", function () {
        D.esvaziarLixo(); C.toast("Reciclagem esvaziada.", "ok"); V.renderLixo();
      }, { danger: true, yes: "Esvaziar" });
    };
  }

  /* ---- Matrícula form ---------------------------------------------------- */
  function wireMatriculaForm() {
    var form = document.getElementById("formMatricula");
    if (!form) return;

    function setVal(name, v) { var el = form.elements[name]; if (el && !el.value) el.value = v == null ? "" : v; }
    function setIfEmpty(name, v) { var el = form.elements[name]; if (el && (!el.value || el.value === "0")) el.value = v == null ? "" : v; }

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

    // auto-fill value when selecting the emolumento (if configured)
    var matEmol = document.getElementById("matEmol");
    if (matEmol) matEmol.addEventListener("change", function () {
      var v = D.emolumentoValor(this.value);
      if (v > 0 && form.elements["valorPago"]) form.elements["valorPago"].value = v;
    });

    function gerarMatricula() {
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
        encarregado: fd.get("encarregado"), encarregadoContacto: fd.get("encarregadoContacto"),
        curso: curso, unidade: fd.get("unidade"), periodo: fd.get("periodo"),
        tipoCurso: fd.get("tipoCurso"), duracao: fd.get("duracao"), regime: fd.get("regime"),
        dataMatricula: fd.get("dataMatricula") || U.hoje(),
        valorInscricao: U.parseMoeda(fd.get("valorInscricao")),
        valorMatricula: U.parseMoeda(fd.get("valorMatricula")),
        valorPago: U.parseMoeda(fd.get("valorPago")),
        formaPagamento: fd.get("formaPagamento"),
        emolumentoId: fd.get("emolumentoId"),
        funcionario: fd.get("funcionario"),
        estado: fd.get("estado") || "ativo",
        observacoes: fd.get("observacoes")
      };
      D.saveEstudante(est);

      var valorPago = est.valorPago;
      var gerar = document.getElementById("gerarRecibo") && document.getElementById("gerarRecibo").checked;
      var msg = editing ? "Alterações guardadas." : "Matrícula " + est.matricula + " gerada.";
      if (!editing && gerar && valorPago > 0) {
        var emo = D.emolumentoById(fd.get("emolumentoId"));
        var pag = V._criarPagamento(est, {
          emolumentoId: emo ? emo.id : "", emolumento: emo ? emo.nome : "Matrícula",
          categoria: emo ? emo.categoria : "Matrícula",
          valorPago: valorPago, formaPagamento: fd.get("formaPagamento"),
          funcionario: fd.get("funcionario"), data: U.agoraISO(), observacoes: fd.get("observacoes")
        });
        msg += " Recibo " + pag.recibo + " gerado.";
      }
      App._lastFicha = est;
      document.getElementById("matPreview").innerHTML = C.fichaMatriculaHTML(est);
      document.getElementById("matPreviewCard").hidden = false;
      document.getElementById("matNum").textContent = D.peekMatricula();
      C.toast(msg, "ok");
      V.renderMatriculaSearch();
      document.getElementById("matPreviewCard").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    form.addEventListener("submit", function (ev) { ev.preventDefault(); gerarMatricula(); });

    document.getElementById("matLimpar").onclick = function () {
      var idEl = form.elements["id"];
      if (idEl) { App.navigate("matricula"); return; } // sai do modo edição
      form.reset();
      if (form.elements["dataMatricula"]) form.elements["dataMatricula"].value = U.hoje();
      var pc = document.getElementById("matPreviewCard"); pc.hidden = true;
      document.getElementById("matPreview").innerHTML = "";
    };

    var printFicha = function () {
      if (!App._lastFicha) { C.toast("Gere a matrícula primeiro.", "err"); return; }
      U.printElement("fichaMatDoc", "Ficha de Matrícula " + App._lastFicha.matricula);
    };
    document.getElementById("matImprimir").onclick = printFicha;
    document.getElementById("matPdf").onclick = function () {
      C.toast("Na janela de impressão escolha “Guardar como PDF”.", "ok"); printFicha();
    };

    // pesquisa de matrículas
    V.renderMatriculaSearch();
    document.getElementById("matSearch").addEventListener("input", U.debounce(V.renderMatriculaSearch, 150));
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
      "[data-curso-edit],[data-curso-del],[data-pag-view],[data-pag-del],[data-lista-add],[data-lista-del]," +
      "[data-em-edit],[data-em-toggle],[data-em-del],[data-lixo-restore]");
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
      C.confirm("Eliminar este pagamento/recibo? Poderá recuperá-lo na Reciclagem (Configurações → Dados).", function () {
        D.deletePagamento(id); C.toast("Pagamento movido para a reciclagem.", "ok");
        if (App.current === "pagamentos") V.renderPagamentos();
        else if (App.current === "recibos") V.renderRecibos();
        else App.refresh();
      }, { danger: true, yes: "Eliminar" });
      return;
    }
    // emolumentos (config)
    if ((id = t.getAttribute("data-em-edit"))) { V.editarEmolumento(id); return; }
    if ((id = t.getAttribute("data-em-toggle"))) { D.toggleEmolumento(id); V.renderEmolumentos(); return; }
    if ((id = t.getAttribute("data-em-del"))) {
      var emo = D.emolumentoById(id);
      C.confirm("Eliminar o emolumento " + (emo ? emo.nome : "") + "?", function () {
        D.deleteEmolumento(id); C.toast("Emolumento eliminado.", "ok"); V.renderEmolumentos();
      }, { danger: true, yes: "Eliminar" });
      return;
    }
    if ((id = t.getAttribute("data-lixo-restore"))) {
      D.restaurarLixo(id); C.toast("Registo restaurado.", "ok");
      V.renderLixo();
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
    applyAparencia();
    // Gate behind login first; only start the app once authenticated.
    window.Auth.gate(startApp);
  }

  function startApp() {
    applyAparencia();
    // user chip + logout
    var a = D.auth();
    var chip = document.getElementById("userChip");
    if (chip) chip.textContent = "" + (a.nome || a.user);
    var modo = document.getElementById("modoToggle");
    if (modo) modo.onclick = function () {
      var s = D.db().settings; s.modo = s.modo === "noite" ? "dia" : "noite"; D.save(); applyAparencia();
    };
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
