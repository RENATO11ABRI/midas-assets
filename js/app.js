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
  // Aparência (sistema de design premium): paleta/tema/sidebar/densidade via
  // atributos em <html>, persistidos em localStorage (+ settings p/ sincronizar).
  var APARENCIA_DEF = { palette: "slate", theme: "light", sidebar: "executive", density: "comfortable" };
  function lerAparencia() {
    var s = (D.db && D.db().settings) || {};
    return {
      palette: localStorage.getItem("midas_palette") || s.paleta || APARENCIA_DEF.palette,
      theme: localStorage.getItem("midas_theme") || (s.modo === "noite" ? "dark" : APARENCIA_DEF.theme),
      sidebar: localStorage.getItem("midas_sidebar") || APARENCIA_DEF.sidebar,
      density: localStorage.getItem("midas_density") || APARENCIA_DEF.density
    };
  }
  function marcarAparencia(a) {
    var mark = function (sel, attr, val) {
      var els = document.querySelectorAll(sel);
      for (var i = 0; i < els.length; i++) els[i].classList.toggle("active", els[i].getAttribute(attr) === val);
    };
    mark(".pal-opt", "data-pal", a.palette);
    mark("#themeSeg [data-theme-set]", "data-theme-set", a.theme);
    mark("#sideSeg [data-side-set]", "data-side-set", a.sidebar);
    mark("#densSeg [data-dens-set]", "data-dens-set", a.density);
  }
  function applyAparencia() {
    var a = lerAparencia();
    var r = document.documentElement;
    r.setAttribute("data-palette", a.palette);
    r.setAttribute("data-theme", a.theme);
    r.setAttribute("data-sidebar", a.sidebar);
    r.setAttribute("data-density", a.density);
    document.body.classList.toggle("dark", a.theme === "dark"); // compat. styles.css antigo
    var url = U.logoURL(false);
    var imgs = document.querySelectorAll("#app .logo");
    for (var i = 0; i < imgs.length; i++) imgs[i].src = url;
    marcarAparencia(a);
  }
  // Define uma preferência de aparência e persiste (localStorage + settings).
  function setAparencia(chave, valor) {
    var mapL = { palette: "midas_palette", theme: "midas_theme", sidebar: "midas_sidebar", density: "midas_density" };
    try { localStorage.setItem(mapL[chave], valor); } catch (e) {}
    var s = D.db().settings;
    if (chave === "palette") s.paleta = valor;
    if (chave === "theme") s.modo = (valor === "dark" ? "noite" : "dia");
    D.save();
    applyAparencia();
  }
  window.applyAparencia = applyAparencia;

  var ROUTES = {
    dashboard: { title: "Dashboard", render: V.dashboard },
    matricula: { title: "Nova Matrícula", render: V.matricula },
    estudantes: { title: "Estudantes", render: V.estudantes, after: afterEstudantes },
    cursos: { title: "Cursos", render: V.cursos, after: afterCursos },
    pagamentos: { title: "Pagamentos", render: V.pagamentos, after: afterPagamentos },
    fecho: { title: "Fecho de Caixa", render: V.fecho, after: afterFecho },
    recibos: { title: "Recibos", render: V.recibos, after: afterRecibos },
    midas: { title: "MIDAS 2026", render: V.midas, after: afterMidas },
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
      view.innerHTML = '<div class="page view-enter">' + ROUTES[route].render(this.params) + "</div>";
      view.scrollTop = 0; window.scrollTo(0, 0);
      var cb = document.getElementById("crumbHere"); if (cb) cb.textContent = ROUTES[route].title || "";
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
    var reset = function () { V._estState.pagina = 1; V.renderEstudantesTable(); };
    reset();
    document.getElementById("estSearch").addEventListener("input", U.debounce(reset, 200));
    document.getElementById("estFiltroCurso").addEventListener("change", reset);
    document.getElementById("estFiltroEstado").addEventListener("change", reset);
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

  function afterFecho() {
    var hoje = U.hoje();
    var calc = function () {
      var data = document.getElementById("fcData").value || hoje;
      var func = document.getElementById("fcFunc").value || "";
      V.renderFechoResumo(data, func);
    };
    document.getElementById("fcData").value = hoje;
    document.getElementById("fcData").addEventListener("change", calc);
    document.getElementById("fcFunc").addEventListener("change", calc);
    calc();
    V.renderFechosGuardados();

    document.getElementById("fcGuardar").onclick = function () {
      var perfil = D.auth().perfil;
      if (window.MidasUsers && perfil !== "admin" && perfil !== "directora") {
        C.toast("Apenas o Administrador/Diretora pode fechar o caixa.", "err"); return;
      }
      var data = document.getElementById("fcData").value || hoje;
      var func = document.getElementById("fcFunc").value || "";
      var resumo = V._resumoCaixa(data, func);
      if (!resumo.recibos.length) { C.toast("Não há recibos para esta data/funcionário.", "err"); return; }
      var a = D.auth();
      var fecho = {
        data: data, funcionario: func || "Todos",
        totais: resumo.totais, porEmol: resumo.porEmol, porFunc: resumo.porFunc,
        totalGeral: resumo.totalGeral, numRecibos: resumo.recibos.length,
        recibos: resumo.recibos.map(function (p) { return { recibo: p.recibo, estudante: p.estudanteNome, valor: p.valorPago, forma: p.formaPagamento, funcionario: p.funcionario }; }),
        observacoes: document.getElementById("fcObs").value || "",
        estado: "fechado", fechadoPor: a.nome || a.user, fechadoEm: U.agoraISO()
      };
      D.saveFecho(fecho);
      C.toast("Fecho de caixa guardado.", "ok");
      V.renderFechosGuardados();
    };
    document.getElementById("fcImprimir").onclick = function () {
      var data = document.getElementById("fcData").value || hoje;
      var func = document.getElementById("fcFunc").value || "";
      var resumo = V._resumoCaixa(data, func);
      var html = C.fechoHTML({
        data: data, funcionario: func || "Todos", totais: resumo.totais,
        porEmol: resumo.porEmol, porFunc: resumo.porFunc,
        totalGeral: resumo.totalGeral, numRecibos: resumo.recibos.length,
        recibos: resumo.recibos.map(function (p) { return { recibo: p.recibo, estudante: p.estudanteNome, valor: p.valorPago, forma: p.formaPagamento, funcionario: p.funcionario }; }),
        observacoes: document.getElementById("fcObs").value || ""
      });
      C.imprimirHTML(html, "fechoDoc", "Fecho de Caixa " + data);
    };
  }

  function afterRecibos() {
    V.renderRecibos();
    // Emitir recibo = mesmo fluxo do Registar Pagamento (modal único)
    document.getElementById("recNovo").onclick = function () { V.novoPagamento(null); };
    // Pesquisa / reimpressão
    ["recSearch", "recDe", "recAte"].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener(el.type === "date" ? "change" : "input", U.debounce(V.renderRecibos, 150));
    });
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

  function afterMidas() {
    var tabs = document.getElementById("midasTabs");
    var content = document.getElementById("midasContent");
    function show(tab) {
      var t = tabs.querySelectorAll(".tab");
      for (var i = 0; i < t.length; i++) t[i].classList.toggle("active", t[i].getAttribute("data-tab") === tab);
      if (tab === "aptidao") { content.innerHTML = V.aptidaoTab(); wireAptidao(); }
      else { content.innerHTML = V.estagiosTab(); wireEstagios(); }
    }
    tabs.addEventListener("click", function (e) { var tab = e.target.getAttribute("data-tab"); if (tab) show(tab); });
    show("estagios");
  }
  function wireEstagios() {
    V.renderEstagios();
    document.getElementById("estagioNovo").onclick = function () { V.editarEstagio(null); };
    ["estagioSearch", "estagioFiltroCurso", "estagioFiltroTipo", "estagioFiltroEstado"].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener(el.tagName === "INPUT" ? "input" : "change", U.debounce(V.renderEstagios, 150));
    });
    document.getElementById("estagioCsv").onclick = function () {
      var rows = V._estagiosFiltrados().map(function (e) {
        return [e.estudanteNome, e.matricula || "", e.curso || "", e.tipo || "", e.estado || "",
          e.local || "", e.supervisor || "", U.ymd(e.dataInicio), U.ymd(e.dataFim), V._duracaoEstagio(e), e.cargaHoraria || ""];
      });
      U.exportCSV("estagios.csv",
        ["Estudante", "Matrícula", "Curso", "Tipo", "Estado", "Local", "Supervisor", "Início", "Término", "Duração", "Carga horária"], rows);
    };
    document.getElementById("estagioPdf").onclick = function () {
      C.imprimirHTML(V._mapaEstagiosHTML(V._estagiosFiltrados()), "mapaEstagiosDoc", "Mapa de Estágios");
    };
  }

  function wireAptidao() {
    V.renderAptidao();
    var cfg = document.getElementById("aptConfig");
    if (cfg) cfg.onclick = function () { V.configurarAptidao(); };
    ["aptSearch", "aptCurso", "aptEstado"].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener(el.tagName === "INPUT" ? "input" : "change", U.debounce(V.renderAptidao, 150));
    });
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
      else if (tab === "utilizadores") { content.innerHTML = V.cfgUtilizadores(); wireUtilizadores(); }
      else if (tab === "auditoria") { content.innerHTML = V.cfgAuditoria(); wireAuditoria(); }
      else if (tab === "importar") { content.innerHTML = V.cfgImportar(); wireImportar(); }
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
    var sair = document.getElementById("contaSair");
    if (sair) sair.onclick = function () {
      C.confirm("Terminar a sessão?", function () {
        Promise.resolve(window.Auth.logout()).then(function () { location.reload(); });
      }, { yes: "Terminar sessão" });
    };
    document.getElementById("formConta").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var fd = new FormData(ev.target);
      var nome = (fd.get("nome") || "").trim();
      var p1 = fd.get("novaPass"), p2 = fd.get("novaPass2");
      if (p1 || p2) {
        if (p1 !== p2) { C.toast("As palavras-passe não coincidem.", "err"); return; }
        if (p1.length < 6) { C.toast("A palavra-passe deve ter pelo menos 6 caracteres.", "err"); return; }
      }
      D.definirCredenciais(null, nome, p1 || null);
      D.save();
      var chip = document.getElementById("userChip");
      var a = D.auth();
      if (chip) chip.textContent = "" + (a.nome || a.user);
      C.toast("Conta atualizada." + (p1 ? " Palavra-passe alterada." : ""), "ok");
    });
  }
  function wireUtilizadores() {
    if (!window.MidasUsers) return;
    var MU = window.MidasUsers;
    function load() {
      var host = document.getElementById("usersTable");
      if (host) host.innerHTML = '<p class="help">A carregar…</p>';
      MU.list().then(function (r) { V.renderUtilizadores((r && r.users) || []); })
        .catch(function (e) {
          C.toast(e.message, "err");
          var h = document.getElementById("usersTable");
          if (h) h.innerHTML = C.empty("", "Erro ao carregar: " + U.esc(e.message));
        });
    }
    load();
    document.getElementById("userReload").onclick = load;

    document.getElementById("formNovoUser").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var fd = new FormData(ev.target);
      var btn = ev.target.querySelector("button[type=submit]");
      btn.disabled = true; btn.textContent = "A criar…";
      MU.create((fd.get("nome") || "").trim(), (fd.get("login") || "").trim(), fd.get("password"), fd.get("perfil"))
        .then(function () { C.toast("Utilizador criado.", "ok"); ev.target.reset(); load(); })
        .catch(function (e) { C.toast(e.message, "err"); })
        .then(function () { btn.disabled = false; btn.textContent = "Criar utilizador"; });
    });

    var host = document.getElementById("usersTable");
    host.addEventListener("change", function (e) {
      if (e.target.classList && e.target.classList.contains("userRole")) {
        var id = e.target.getAttribute("data-id");
        MU.setRole(id, e.target.value)
          .then(function () { C.toast("Perfil atualizado.", "ok"); })
          .catch(function (err) { C.toast(err.message, "err"); load(); });
      }
    });
    host.addEventListener("click", function (e) {
      var t = e.target;
      var idPass = t.getAttribute && t.getAttribute("data-user-pass");
      if (idPass) {
        var np = window.prompt("Nova senha para este utilizador (mín. 6 caracteres):");
        if (np === null) return;
        if (np.length < 6) { C.toast("Senha demasiado curta.", "err"); return; }
        MU.setPassword(idPass, np).then(function () { C.toast("Senha redefinida.", "ok"); })
          .catch(function (err) { C.toast(err.message, "err"); });
        return;
      }
      var idTog = t.getAttribute && t.getAttribute("data-user-toggle");
      if (idTog) {
        var ativo = t.getAttribute("data-ativo") === "1";
        MU.setActive(idTog, !ativo).then(function () { C.toast("Acesso atualizado.", "ok"); load(); })
          .catch(function (err) { C.toast(err.message, "err"); });
        return;
      }
      var idDel = t.getAttribute && t.getAttribute("data-user-del");
      if (idDel) {
        C.confirm("Eliminar este utilizador? Esta ação não pode ser anulada.", function () {
          MU.remove(idDel).then(function () { C.toast("Utilizador eliminado.", "ok"); load(); })
            .catch(function (err) { C.toast(err.message, "err"); });
        }, { danger: true, yes: "Eliminar" });
      }
    });
  }

  function wireImportar() {
    var registos = [];   // registos validados, prontos a importar
    var fileEl = document.getElementById("impFile");
    if (fileEl) fileEl.onchange = function (e) {
      var f = e.target.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { document.getElementById("impText").value = rd.result; };
      rd.readAsText(f);
    };

    function chave(s) { return String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

    document.getElementById("impPrever").onclick = function () {
      var tipo = document.getElementById("impTipo").value;
      var linhas = U.parseCSV(document.getElementById("impText").value);
      var host = document.getElementById("impPreview");
      registos = [];
      if (linhas.length < 2) { host.innerHTML = C.empty("", "Cole dados com cabeçalho + pelo menos 1 linha."); document.getElementById("impImportar").disabled = true; return; }
      var headers = linhas[0].map(chave);
      var idx = function (nome) { return headers.indexOf(nome); };
      var get = function (linha, nome) { var i = idx(nome); return i >= 0 ? String(linha[i] || "").trim() : ""; };
      var avisos = [];
      for (var li = 1; li < linhas.length; li++) {
        var l = linhas[li];
        if (tipo === "Estudantes") {
          var nome = get(l, "nome");
          if (!nome) { avisos.push("Linha " + (li + 1) + ": sem nome (ignorada)."); continue; }
          var dup = D.estudantesSemelhantes(nome, get(l, "contacto"), get(l, "bi")).length > 0;
          registos.push({
            _tipo: "estudante", _dup: dup,
            nome: nome, contacto: get(l, "contacto"), curso: get(l, "curso"), bi: get(l, "bi"),
            whatsapp: get(l, "whatsapp"), periodo: get(l, "periodo"), unidade: get(l, "unidade"),
            tipoCurso: get(l, "tipocurso"), regime: get(l, "regime"),
            dataMatricula: get(l, "datamatricula") || U.hoje(), estado: get(l, "estado") || "ativo"
          });
        } else {
          var ref = get(l, "estudante") || get(l, "nome") || get(l, "matricula");
          var valor = U.parseMoeda(get(l, "valor") || get(l, "valorpago"));
          var est = V.resolverEstudante(ref);
          if (!est) { avisos.push("Linha " + (li + 1) + ": estudante \"" + ref + "\" não encontrado (ignorada)."); continue; }
          if (!(valor > 0)) { avisos.push("Linha " + (li + 1) + ": valor inválido (ignorada)."); continue; }
          registos.push({
            _tipo: "pagamento", est: est, valor: valor,
            categoria: get(l, "categoria") || get(l, "emolumento") || "Outros",
            emolumento: get(l, "emolumento") || get(l, "categoria") || "Outros",
            forma: get(l, "forma") || get(l, "formapagamento"),
            data: get(l, "data") || U.hoje()
          });
        }
      }
      var rows = registos.slice(0, 50).map(function (r) {
        if (r._tipo === "estudante") return "<tr><td>" + U.esc(r.nome) + (r._dup ? ' <span class="badge warn">possível duplicado</span>' : "") + "</td><td>" + U.esc(r.contacto) + "</td><td>" + U.esc(r.curso) + "</td></tr>";
        return "<tr><td>" + U.esc(r.est.nome) + "</td><td>" + U.esc(r.categoria) + "</td><td class='text-right num'>" + U.moeda(r.valor) + "</td></tr>";
      }).join("");
      var head = tipo === "Estudantes" ? "<th>Nome</th><th>Contacto</th><th>Curso</th>" : "<th>Estudante</th><th>Categoria</th><th class='text-right'>Valor</th>";
      host.innerHTML =
        (avisos.length ? '<div class="login-err" style="position:static">' + avisos.slice(0, 10).map(U.esc).join("<br>") + (avisos.length > 10 ? "<br>…" : "") + "</div>" : "") +
        "<p class='help mt'>" + registos.length + " registo(s) prontos a importar" + (registos.length > 50 ? " (a mostrar 50)" : "") + ".</p>" +
        (registos.length ? '<div class="table-wrap"><table class="data"><thead><tr>' + head + "</tr></thead><tbody>" + rows + "</tbody></table></div>" : "");
      document.getElementById("impImportar").disabled = !registos.length;
    };

    document.getElementById("impImportar").onclick = function () {
      if (!registos.length) return;
      if (V.caixaBloqueadoModal()) return;   // exige fecho do caixa do dia anterior
      var btn = document.getElementById("impImportar");
      btn.disabled = true; btn.textContent = "A importar…";
      // importação sequencial (aloca matrícula/recibo de forma atómica por registo)
      var i = 0, okN = 0;
      function passo() {
        if (i >= registos.length) {
          C.toast("Importação concluída: " + okN + " registo(s).", "ok");
          btn.textContent = "Importar"; App.refresh();
          return;
        }
        var r = registos[i++];
        var prox = function () { okN++; passo(); };
        var falha = function () { passo(); };
        if (r._tipo === "estudante") {
          D.alocarMatricula().then(function (num) {
            D.saveEstudante({ matricula: num, nome: r.nome, contacto: r.contacto, curso: r.curso, bi: r.bi, whatsapp: r.whatsapp, periodo: r.periodo, unidade: r.unidade, tipoCurso: r.tipoCurso, regime: r.regime, dataMatricula: r.dataMatricula, estado: r.estado });
            prox();
          }).catch(falha);
        } else {
          var emo = D.emolumentosAtivos().filter(function (x) { return x.nome === r.emolumento || x.categoria === r.categoria; })[0];
          V._criarPagamento(r.est, { emolumentoId: emo ? emo.id : "", emolumento: r.emolumento, categoria: r.categoria, valorPago: r.valor, formaPagamento: r.forma, data: r.data }).then(prox).catch(falha);
        }
      }
      passo();
    };
  }

  function wireAuditoria() {
    if (!window.MidasAudit) return;
    function load() {
      var host = document.getElementById("audTable");
      if (host) host.innerHTML = '<p class="help">A carregar…</p>';
      window.MidasAudit.list({
        tabela: document.getElementById("audTabela").value,
        accao: document.getElementById("audAccao").value
      }).then(function (rows) { V.renderAuditoria(rows); })
        .catch(function (e) { var h = document.getElementById("audTable"); if (h) h.innerHTML = C.empty("", "Erro: " + U.esc(e.message)); });
    }
    load();
    document.getElementById("audReload").onclick = load;
    document.getElementById("audTabela").addEventListener("change", load);
    document.getElementById("audAccao").addEventListener("change", load);
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
        C.confirm("Importar este backup? Os dados atuais (incluindo no servidor) serão SUBSTITUÍDOS pelos do ficheiro.", function () {
          try { D.import(reader.result); C.toast("Backup importado.", "ok"); App.refresh(); }
          catch (err) { C.toast("Ficheiro inválido.", "err"); }
        }, { danger: true, yes: "Importar e substituir" });
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
    if (form.dataset.wired) return;   // evita ligar 2x (provocava matrícula duplicada)
    form.dataset.wired = "1";

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
      if (!editing && V.caixaBloqueadoModal()) return;   // exige fecho do caixa do dia anterior
      var btn = document.getElementById("matGerar");
      var restoreBtn = function () {
        if (btn) { btn.disabled = false; btn.textContent = editing ? "Guardar alterações" : "Gerar matrícula"; }
      };
      // Antes de criar uma nova matrícula, avisa se houver estudante parecido.
      if (!editing) {
        var semelhantes = D.estudantesSemelhantes(nome, contacto, fd.get("bi"));
        if (semelhantes.length) {
          V.confirmaDuplicado(semelhantes,
            function (esc) { App.navigate("matricula", { id: esc.id }); }, // editar o existente
            prosseguir);                                                    // criar novo
          return;
        }
      }
      prosseguir();

      function prosseguir() {
      if (btn) { btn.disabled = true; btn.textContent = editing ? "A guardar…" : "A gerar…"; }
      // Nº de matrícula: edição mantém; nova matrícula aloca de forma atómica.
      var numeroP = editing ? Promise.resolve(fd.get("matricula")) : D.alocarMatricula();
      numeroP.then(function (numeroMat) {
        var est = {
          id: fd.get("id") || undefined,
          matricula: numeroMat,
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
        var finish = function () {
          App._lastFicha = est;
          document.getElementById("matPreview").innerHTML = C.fichaMatriculaHTML(est);
          document.getElementById("matPreviewCard").hidden = false;
          document.getElementById("matNum").textContent = D.peekMatricula();
          C.toast(msg, "ok");
          V.renderMatriculaSearch();
          document.getElementById("matPreviewCard").scrollIntoView({ behavior: "smooth", block: "start" });
          restoreBtn();
        };
        if (!editing && gerar && valorPago > 0) {
          var emo = D.emolumentoById(fd.get("emolumentoId"));
          V._criarPagamento(est, {
            emolumentoId: emo ? emo.id : "", emolumento: emo ? emo.nome : "Matrícula",
            categoria: emo ? emo.categoria : "Matrícula",
            valorPago: valorPago, formaPagamento: fd.get("formaPagamento"),
            funcionario: fd.get("funcionario"), data: U.agoraISO(), observacoes: fd.get("observacoes")
          }).then(function (pag) { msg += " Recibo " + pag.recibo + " gerado."; finish(); });
        } else { finish(); }
      }).catch(function (e) {
        C.toast("Erro ao gerar matrícula: " + (e && e.message ? e.message : e), "err");
        restoreBtn();
      });
      }
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
    C.imprimirHTML(C.reportSheet(r.titulo, r.sub, r.headers, r.rows, r.totals), "reportDoc", r.titulo);
  }
  function stripHtmlRow(row) {
    return row.map(function (c) {
      return String(c == null ? "" : c).replace(/<[^>]*>/g, "")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'").replace(/&amp;/g, "&");
    });
  }
  function slug(s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

  /* ---- Global delegated click handler ----------------------------------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-go],[data-est-view],[data-est-ficha],[data-est-edit],[data-est-pay],[data-est-del]," +
      "[data-curso-edit],[data-curso-del],[data-pag-view],[data-pag-del],[data-lista-add],[data-lista-del]," +
      "[data-em-edit],[data-em-toggle],[data-em-del],[data-lixo-restore]," +
      "[data-fecho-print],[data-fecho-del],[data-estagio-edit],[data-estagio-del]," +
      "[data-apt-view],[data-est-pag]");
    if (!t) return;

    var go = t.getAttribute("data-go");
    if (go) { App.navigate(go); return; }

    var id;
    if ((id = t.getAttribute("data-est-pag"))) {
      if (id === "ant" && V._estState.pagina > 1) V._estState.pagina--;
      else if (id === "seg") V._estState.pagina++;
      V.renderEstudantesTable();
      return;
    }
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
    if ((id = t.getAttribute("data-fecho-print"))) {
      var fc = D.fechoById(id);
      if (fc) C.imprimirHTML(C.fechoHTML(fc), "fechoDoc", "Fecho de Caixa " + fc.data);
      return;
    }
    if ((id = t.getAttribute("data-fecho-del"))) {
      if (window.MidasUsers && D.auth().perfil !== "admin") { C.toast("Apenas o administrador pode eliminar um fecho.", "err"); return; }
      C.confirm("Eliminar este fecho de caixa?", function () {
        D.deleteFecho(id); C.toast("Fecho eliminado.", "ok"); V.renderFechosGuardados();
      }, { danger: true, yes: "Eliminar" });
      return;
    }
    if ((id = t.getAttribute("data-apt-view"))) { V.aptidaoDetalhe(id); return; }
    if ((id = t.getAttribute("data-estagio-edit"))) { V.editarEstagio(id); return; }
    if ((id = t.getAttribute("data-estagio-del"))) {
      C.confirm("Eliminar este estágio?", function () {
        D.deleteEstagio(id); C.toast("Estágio eliminado.", "ok"); V.renderEstagios();
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

  function setupAppearance() {
    var btn = document.getElementById("appeBtn");
    var pop = document.getElementById("appePop");
    if (btn && pop) {
      btn.onclick = function (e) { e.stopPropagation(); pop.hidden = !pop.hidden; };
      document.addEventListener("click", function (e) {
        if (pop.hidden) return;
        if (!pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) pop.hidden = true;
      });
      pop.addEventListener("click", function (e) {
        var el = e.target.closest && e.target.closest("[data-pal],[data-theme-set],[data-side-set],[data-dens-set]");
        if (!el) return;
        if (el.hasAttribute("data-pal")) setAparencia("palette", el.getAttribute("data-pal"));
        else if (el.hasAttribute("data-theme-set")) setAparencia("theme", el.getAttribute("data-theme-set"));
        else if (el.hasAttribute("data-side-set")) setAparencia("sidebar", el.getAttribute("data-side-set"));
        else if (el.hasAttribute("data-dens-set")) setAparencia("density", el.getAttribute("data-dens-set"));
      });
    }
    marcarAparencia(lerAparencia());
  }

  function setupSyncPill() {
    var pill = document.getElementById("syncPill");
    if (!pill || !window.MidasSync) return; // só em modo Supabase
    function render() {
      var online = window.MidasSync.online();
      var n = window.MidasSync.pendentes();
      pill.hidden = false;
      if (!online) { pill.className = "sync-pill off"; pill.textContent = "● Offline" + (n ? " · " + n + " por enviar" : ""); }
      else if (n) { pill.className = "sync-pill pend"; pill.textContent = "↻ A sincronizar " + n + "…"; }
      else { pill.className = "sync-pill ok"; pill.textContent = "● Online"; }
    }
    window.MidasSync.aoMudar(render);
    window.addEventListener("online", render);
    window.addEventListener("offline", render);
    pill.onclick = function () { window.MidasSync.sincronizar().then(render); };
    render();
  }

  function startApp() {
    applyAparencia();
    // user chip + logout
    var a = D.auth();
    var chip = document.getElementById("userChip");
    if (chip) {
      var nm = a.nome || a.user || "Utilizador";
      var ini = nm.trim().split(/\s+/).map(function (w) { return w[0] || ""; }).slice(0, 2).join("").toUpperCase();
      chip.innerHTML = '<span class="av">' + U.esc(ini || "U") + "</span>" +
        '<div class="uc-t"><strong>' + U.esc(nm) + "</strong><small>" + U.esc(a.perfil || "Conta") + "</small></div>";
    }
    var modo = document.getElementById("modoToggle");
    if (modo) modo.onclick = function () {
      setAparencia("theme", document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    };
    setupAppearance();
    var logout = document.getElementById("logoutBtn");
    if (logout) logout.onclick = function () {
      C.confirm("Terminar a sessão?", function () {
        Promise.resolve(window.Auth.logout()).then(function () { location.reload(); });
      }, { yes: "Terminar sessão" });
    };

    document.getElementById("menuToggle").addEventListener("click", openNav);
    document.getElementById("overlay").addEventListener("click", closeNav);
    setupSyncPill();

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
