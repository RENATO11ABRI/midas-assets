/* ==========================================================================
   crm-views.js — CRM WhatsApp (leads manuais, funil, mensagens)
   Grupo Midas Angola · MIDAS2026

   Estende window.V com as páginas do módulo CRM. Sem integração externa:
   os leads são colados, lidos e organizados; o contacto faz-se abrindo o
   WhatsApp (wa.me) com a mensagem já pronta — nunca há envio automático.
   ========================================================================== */
(function (window) {
  "use strict";
  var U = window.U, C = window.C, D = window.MidasData, V = window.V;
  if (!V) return; // views.js tem de carregar primeiro

  // Estado da página (aba ativa) — persiste durante a navegação.
  V._crmState = { tab: "leads" };

  // Mapa estado-do-funil → classe de badge existente (sóbrio, sem cores novas).
  var BADGE = {
    "Novo Lead": "info", "Contactado": "off", "Interessado": "warn",
    "Visita Agendada": "warn", "Visitou a Instituição": "info",
    "Negociação": "warn", "Pré-Matrícula": "ok", "Matriculado": "ok", "Perdido": "danger"
  };
  V._leadBadge = function (estado) {
    return '<span class="badge ' + (BADGE[estado] || "off") + '">' + U.esc(estado || "Novo Lead") + "</span>";
  };
  function autorAtual() { var a = D.auth(); return a.nome || a.user || ""; }

  /* =======================================================================
     PÁGINA PRINCIPAL (com abas)
     ======================================================================= */
  V.crm = function () {
    var tab = V._crmState.tab || "leads";
    var tabs = [
      ["leads", "Leads"], ["funil", "Funil"], ["mensagens", "Mensagens"], ["dashboard", "Dashboard"]
    ];
    var nav = '<div class="crm-tabs">' + tabs.map(function (t) {
      return '<button class="crm-tab' + (t[0] === tab ? " on" : "") + '" data-crm-tab="' + t[0] + '">' + t[1] + "</button>";
    }).join("") + "</div>";

    var corpo =
      tab === "dashboard" ? V._crmDashboard() :
      tab === "funil" ? V._crmFunil() :
      tab === "mensagens" ? V._crmMensagensTab() :
      V._crmLeadsTab();

    return C.pageHead("CRM WhatsApp", "Gestão manual de leads · do primeiro contacto à matrícula") +
      nav + '<div id="crmBody">' + corpo + "</div>";
  };

  /* =======================================================================
     ABA: LEADS (caixa de importação + filtros + tabela)
     ======================================================================= */
  V._crmLeadsTab = function () {
    var db = D.db();
    var origemOpts = '<option value="">— Origem (opcional) —</option>' + U.optionList(D.origensLead());
    var respOpts = '<option value="">— Responsável (opcional) —</option>' + U.optionList(db.funcionarios || []);

    var importBox =
      '<div class="card mb"><div class="card-head"><h3>Colar leads aqui</h3>' +
        '<span class="help">Cole números, nome + número, texto do WhatsApp (com emojis) ou da pré-inscrição. O sistema lê nome, telefone, curso e período automaticamente.</span></div>' +
      '<textarea id="crmPaste" class="crm-paste" placeholder="Exemplos aceites:&#10;923456789&#10;João Manuel — 926000111&#10;&#10;👤 Nome: Maria Pedro&#10;📱 Contacto: +244 931222333&#10;🎯 Curso: Enfermagem&#10;⏰ Período: Manhã"></textarea>' +
      '<div class="toolbar crm-import-bar">' +
        '<select id="crmImpOrigem" class="crm-sel">' + origemOpts + "</select>" +
        '<select id="crmImpResp" class="crm-sel">' + respOpts + "</select>" +
        '<button class="btn btn-light" id="crmImpPreview">Pré-visualizar</button>' +
        '<button class="btn btn-primary" id="crmImpBtn">Importar leads</button>' +
      "</div>" +
      '<div id="crmImpResultado"></div></div>';

    var filtros =
      '<div class="card"><div class="card-head"><h3>Lista de leads</h3><span class="help" id="crmCount"></span></div>' +
      '<div class="toolbar crm-filtros">' +
        '<div class="search-box"><input id="crmBusca" placeholder="Pesquisar por nome ou telefone…"></div>' +
        '<select id="crmFEstado"><option value="">Todos os estados</option>' + U.optionList(D.estadosLead()) + "</select>" +
        '<select id="crmFCurso"><option value="">Todos os cursos</option>' + U.optionList(D.cursos().map(function (c) { return c.nome; })) + "</select>" +
        '<select id="crmFPeriodo"><option value="">Todos os períodos</option>' + U.optionList(db.periodos || []) + "</select>" +
        '<select id="crmFResp"><option value="">Todos os responsáveis</option>' + U.optionList(db.funcionarios || []) + "</select>" +
        '<select id="crmFOrigem"><option value="">Todas as origens</option>' + U.optionList(D.origensLead()) + "</select>" +
        '<button class="btn btn-light btn-sm" id="crmExpCsv">Exportar CSV</button>' +
      "</div>" +
      '<div id="crmLeadsTable"></div></div>';

    return importBox + filtros;
  };

  // Filtra os leads segundo os controlos atuais (lê do DOM).
  V._crmLeadsFiltrados = function () {
    function val(id) { var el = document.getElementById(id); return el ? (el.value || "") : ""; }
    var q = val("crmBusca").trim().toLowerCase();
    var fEstado = val("crmFEstado"), fCurso = val("crmFCurso"), fPeriodo = val("crmFPeriodo"),
        fResp = val("crmFResp"), fOrigem = val("crmFOrigem");
    return D.leads().filter(function (l) {
      if (fEstado && (l.estado || "Novo Lead") !== fEstado) return false;
      if (fCurso && l.curso !== fCurso) return false;
      if (fPeriodo && l.periodo !== fPeriodo) return false;
      if (fResp && l.responsavel !== fResp) return false;
      if (fOrigem && (l.origem || "") !== fOrigem) return false;
      if (q) {
        var hay = ((l.nome || "") + " " + (l.telefone || "")).toLowerCase();
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    }).sort(function (a, b) { return (a.atualizadoEm || a.criadoEm || "") < (b.atualizadoEm || b.criadoEm || "") ? 1 : -1; });
  };

  V.renderCrmLeads = function () {
    var host = document.getElementById("crmLeadsTable");
    if (!host) return;
    var list = V._crmLeadsFiltrados();
    var cnt = document.getElementById("crmCount");
    if (cnt) cnt.textContent = list.length + (list.length === 1 ? " lead" : " leads");
    if (!list.length) {
      host.innerHTML = C.empty("", D.leads().length ? "Nenhum lead corresponde aos filtros." : "Ainda não há leads. Cole contactos na caixa acima.");
      return;
    }
    var rows = list.map(function (l) {
      var resp = l.responsavel ? U.esc(l.responsavel) : '<span class="muted">—</span>';
      var ult = l.ultimoContacto ? U.dataPT(l.ultimoContacto) : '<span class="muted">Sem contacto</span>';
      return "<tr>" +
        "<td><strong>" + U.esc(l.nome || "Sem nome") + "</strong></td>" +
        "<td>" + U.esc(l.telefone || "—") + "</td>" +
        "<td>" + U.esc(l.curso || "—") + "</td>" +
        "<td>" + U.esc(l.periodo || "—") + "</td>" +
        "<td>" + V._leadBadge(l.estado) + "</td>" +
        "<td>" + resp + "</td>" +
        "<td>" + U.esc(l.origem || "—") + "</td>" +
        "<td>" + ult + "</td>" +
        '<td><div class="row-actions">' +
          '<button class="btn btn-gold btn-sm" data-lead-wa="' + l.id + '">WhatsApp</button>' +
          '<button class="btn btn-light btn-sm" data-lead-ficha="' + l.id + '">Ficha</button>' +
        "</div></td></tr>";
    }).join("");
    host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      "<th>Nome</th><th>WhatsApp</th><th>Curso</th><th>Período</th><th>Estado</th>" +
      "<th>Responsável</th><th>Origem</th><th>Último contacto</th><th>Ações</th>" +
      "</tr></thead><tbody>" + rows + "</tbody></table></div>";
  };

  // Pré-visualização do que será lido do texto colado.
  V.crmPreviewImport = function () {
    var ta = document.getElementById("crmPaste");
    var host = document.getElementById("crmImpResultado");
    if (!ta || !host) return;
    var parsed = D.parsearLeads(ta.value);
    if (!parsed.length) { host.innerHTML = C.empty("", "Nada reconhecido. Verifique se há números de telefone no texto."); return; }
    var rows = parsed.map(function (p) {
      var existe = D.leadByTelefone(p.telefone);
      return "<tr><td>" + U.esc(p.nome || "Sem nome") + "</td><td>" + U.esc(p.telefone) + "</td>" +
        "<td>" + U.esc(p.curso || "—") + "</td><td>" + U.esc(p.periodo || "—") + "</td>" +
        "<td>" + (existe ? '<span class="badge warn">Já existe — será atualizado</span>' : '<span class="badge ok">Novo</span>') + "</td></tr>";
    }).join("");
    host.innerHTML = '<div class="crm-preview"><p class="help">' + parsed.length + " contacto(s) reconhecido(s):</p>" +
      '<div class="table-wrap"><table class="data"><thead><tr><th>Nome</th><th>Telefone</th><th>Curso</th><th>Período</th><th>Situação</th></tr></thead><tbody>' +
      rows + "</tbody></table></div></div>";
  };

  V.crmImportar = function () {
    var ta = document.getElementById("crmPaste");
    if (!ta || !ta.value.trim()) { C.toast("Cole pelo menos um contacto na caixa.", "err"); return; }
    var origem = (document.getElementById("crmImpOrigem") || {}).value || "";
    var resp = (document.getElementById("crmImpResp") || {}).value || "";
    var res = D.importarLeads(ta.value, { origem: origem, responsavel: resp, autor: autorAtual() });
    if (!res.total) { C.toast("Nenhum número válido encontrado. Verifique o texto.", "err"); return; }
    var msg = res.criados + " novo(s)";
    if (res.atualizados) msg += " · " + res.atualizados + " atualizado(s)";
    if (res.ignorados) msg += " · " + res.ignorados + " ignorado(s)";
    C.toast("Importação concluída: " + msg + ".", "ok");
    ta.value = "";
    document.getElementById("crmImpResultado").innerHTML = "";
    V.renderCrmLeads();
  };

  V.exportarLeadsCSV = function () {
    var headers = ["Nome", "WhatsApp", "Curso", "Período", "Estado", "Responsável", "Origem", "Último contacto", "Observações"];
    var rows = V._crmLeadsFiltrados().map(function (l) {
      return [l.nome, l.telefone, l.curso, l.periodo, l.estado, l.responsavel, l.origem, U.dataPT(l.ultimoContacto), l.observacoes];
    });
    U.exportCSV("leads-midas.csv", headers, rows);
    C.toast("CSV de leads exportado.", "ok");
  };

  /* =======================================================================
     ABA: FUNIL (contagem por estágio, na ordem comercial)
     ======================================================================= */
  V._crmFunil = function () {
    var st = D.crmStats();
    var cards = D.estadosLead().map(function (e) {
      var n = st.porEstado[e] || 0;
      return '<button class="crm-funil-col" data-crm-funil="' + U.esc(e) + '">' +
        '<span class="cf-num">' + n + "</span>" +
        '<span class="cf-lbl">' + U.esc(e) + "</span></button>";
    }).join("");
    return '<div class="card"><div class="card-head"><h3>Funil comercial</h3>' +
      '<span class="help">Clique num estágio para filtrar a lista de leads.</span></div>' +
      '<div class="crm-funil">' + cards + "</div></div>";
  };

  /* =======================================================================
     ABA: DASHBOARD do CRM
     ======================================================================= */
  V._crmDashboard = function () {
    var st = D.crmStats();
    var g = function (e) { return st.porEstado[e] || 0; };
    var chartFunil = D.estadosLead().map(function (e) { return { label: e, value: g(e) }; });
    var chartOrigem = Object.keys(st.porOrigem).map(function (k) { return { label: k, value: st.porOrigem[k] }; })
      .sort(function (a, b) { return b.value - a.value; });

    return '<div class="grid stats">' +
        V._stat("Total de leads", st.total, { icon: "users" }) +
        V._stat("Novos", g("Novo Lead"), { icon: "userCheck", accent: "info" }) +
        V._stat("Contactados", g("Contactado"), { icon: "trend" }) +
        V._stat("Interessados", g("Interessado"), { icon: "trend", accent: "gold" }) +
      "</div>" +
      '<div class="grid stats mt">' +
        V._stat("Pré-matriculados", g("Pré-Matrícula"), { icon: "receipt", accent: "gold" }) +
        V._stat("Matriculados", st.matriculados, { icon: "cap", accent: "green" }) +
        V._stat("Perdidos", st.perdidos, { icon: "alert", accent: "danger" }) +
        V._stat("Conversão", st.conversao + "%", { icon: "trend", accent: "green", sub: st.matriculadosMes + " matrícula(s) este mês" }) +
      "</div>" +
      '<div class="grid stats mt">' +
        V._stat("Curso mais procurado", st.cursoTop, { icon: "book" }) +
      "</div>" +
      '<div class="grid two-col mt">' +
        '<div class="card"><div class="card-head"><h3>Leads por estágio</h3></div>' + C.chartBars(chartFunil) + "</div>" +
        '<div class="card"><div class="card-head"><h3>Leads por origem</h3></div>' + C.chartBars(chartOrigem, { vazio: "Sem origens registadas." }) + "</div>" +
      "</div>";
  };

  /* =======================================================================
     ABA: MENSAGENS (biblioteca de modelos)
     ======================================================================= */
  V._crmMensagensTab = function () {
    return '<div class="card mb"><div class="card-head"><h3>Biblioteca de mensagens</h3>' +
        '<button class="btn btn-primary btn-sm" data-msg-new>Nova mensagem</button></div>' +
        '<p class="help">Use variáveis <code>{nome}</code> <code>{curso}</code> <code>{periodo}</code> <code>{telefone}</code> — serão preenchidas ao enviar.</p>' +
        '<div id="crmMsgList"></div></div>';
  };
  V.renderCrmMensagens = function () {
    var host = document.getElementById("crmMsgList");
    if (!host) return;
    var todas = D.mensagens();
    if (!todas.length) { host.innerHTML = C.empty("", "Ainda não há mensagens. Crie a primeira."); return; }
    var cats = D.categoriasMensagem();
    var outras = todas.filter(function (m) { return cats.indexOf(m.categoria) < 0; });
    var blocos = cats.concat(outras.length ? ["Outras"] : []).map(function (cat) {
      var lista = cat === "Outras" ? outras : todas.filter(function (m) { return m.categoria === cat; });
      if (!lista.length) return "";
      var items = lista.map(function (m) {
        return '<div class="crm-msg-item' + (m.ativo === false ? " off" : "") + '">' +
          '<div class="cm-top"><strong>' + U.esc(m.titulo) + "</strong>" +
            (m.ativo === false ? ' <span class="badge off">inativa</span>' : "") + "</div>" +
          '<div class="cm-body">' + U.esc(m.corpo) + "</div>" +
          '<div class="cm-acts">' +
            '<button class="btn btn-light btn-sm" data-msg-edit="' + m.id + '">Editar</button>' +
            '<button class="btn btn-light btn-sm" data-msg-del="' + m.id + '">Eliminar</button>' +
          "</div></div>";
      }).join("");
      return '<div class="crm-msg-cat"><h4>' + U.esc(cat) + "</h4>" + items + "</div>";
    }).join("");
    host.innerHTML = blocos;
  };

  V.editarMensagem = function (id) {
    var m = id ? D.mensagemById(id) : null;
    var e = m || {};
    var catOpts = U.optionList(D.categoriasMensagem(), e.categoria || "Primeiro contacto");
    C.modal({
      title: m ? "Editar mensagem" : "Nova mensagem",
      body:
        '<form id="msgForm"><div class="form-grid">' +
          '<div class="field full"><label>Título <span class="req">*</span></label>' +
            '<input name="titulo" value="' + U.esc(e.titulo || "") + '" required></div>' +
          '<div class="field"><label>Categoria</label><select name="categoria">' + catOpts + "</select></div>" +
          '<div class="field"><label>Estado</label><select name="ativo">' +
            '<option value="1"' + (e.ativo === false ? "" : " selected") + ">Ativa</option>" +
            '<option value="0"' + (e.ativo === false ? " selected" : "") + ">Inativa</option></select></div>" +
          '<div class="field full"><label>Mensagem <span class="req">*</span></label>' +
            '<textarea name="corpo" rows="5" required placeholder="Olá {nome}, sobre o curso de {curso}…">' + U.esc(e.corpo || "") + "</textarea>" +
            '<span class="help">Variáveis: {nome} {curso} {periodo} {telefone}</span></div>' +
        "</div>" + (m ? '<input type="hidden" name="id" value="' + m.id + '">' : "") + "</form>",
      footer:
        '<button class="btn btn-light" onclick="App.closeModal()">Cancelar</button>' +
        '<button class="btn btn-primary" id="msgSave">Guardar</button>',
      onOpen: function () {
        document.getElementById("msgSave").onclick = function () {
          var f = document.getElementById("msgForm");
          var fd = new FormData(f);
          var rec = {
            id: fd.get("id") || undefined,
            titulo: (fd.get("titulo") || "").trim(),
            categoria: fd.get("categoria") || "Outros",
            corpo: (fd.get("corpo") || "").trim(),
            ativo: fd.get("ativo") !== "0"
          };
          var r = D.saveMensagem(rec);
          if (r && r.error) { C.toast(r.error, "err"); return; }
          C.closeModal();
          C.toast("Mensagem guardada.", "ok");
          V.renderCrmMensagens();
        };
      }
    });
  };

  /* =======================================================================
     FICHA DO LEAD (modal)
     ======================================================================= */
  V.fichaLead = function (id) {
    var l = D.leadById(id);
    if (!l) { C.toast("Lead não encontrado.", "err"); return; }
    var db = D.db();
    var estadoOpts = U.optionList(D.estadosLead(), l.estado || "Novo Lead");
    var respOpts = '<option value="">—</option>' + U.optionList(db.funcionarios || [], l.responsavel || "");
    var cursoOpts = '<option value="">—</option>' + U.optionList(D.cursos().map(function (c) { return c.nome; }), l.curso || "");
    var periodoOpts = '<option value="">—</option>' + U.optionList(db.periodos || [], l.periodo || "");
    var origemOpts = '<option value="">—</option>' + U.optionList(D.origensLead(), l.origem || "");

    var hist = (l.historico || []).map(function (h) {
      var trans = (h.estadoAnterior || h.estadoNovo)
        ? '<span class="muted">' + U.esc(h.estadoAnterior || "—") + " → " + U.esc(h.estadoNovo || "—") + "</span>" : "";
      return '<div class="crm-hist-item"><div class="hi-top"><strong>' + U.esc(h.tipo || "Nota") + "</strong>" +
        '<span class="muted">' + U.dataHoraPT(h.data) + (h.funcionario ? " · " + U.esc(h.funcionario) : "") + "</span></div>" +
        (h.mensagem ? '<div class="hi-msg">' + U.esc(h.mensagem) + "</div>" : "") +
        (h.observacao ? '<div class="hi-obs">' + U.esc(h.observacao) + "</div>" : "") +
        (trans ? '<div class="hi-trans">' + trans + "</div>" : "") + "</div>";
    }).join("") || C.empty("", "Sem contactos registados ainda.");

    C.modal({
      title: l.nome || "Sem nome",
      body:
        '<form id="leadForm"><div class="form-grid">' +
          '<div class="field"><label>Nome</label><input name="nome" value="' + U.esc(l.nome || "") + '"></div>' +
          '<div class="field"><label>WhatsApp</label><input name="telefone" value="' + U.esc(l.telefone || "") + '"></div>' +
          '<div class="field"><label>Curso de interesse</label><select name="curso">' + cursoOpts + "</select></div>" +
          '<div class="field"><label>Período</label><select name="periodo">' + periodoOpts + "</select></div>" +
          '<div class="field"><label>Estado</label><select name="estado">' + estadoOpts + "</select></div>" +
          '<div class="field"><label>Responsável</label><select name="responsavel">' + respOpts + "</select></div>" +
          '<div class="field"><label>Origem</label><select name="origem">' + origemOpts + "</select></div>" +
          '<div class="field"><label>Unidade</label><input name="unidade" value="' + U.esc(l.unidade || "") + '"></div>' +
          '<div class="field full"><label>Observações</label><textarea name="observacoes" rows="2">' + U.esc(l.observacoes || "") + "</textarea></div>" +
        '</div><input type="hidden" name="id" value="' + l.id + '"></form>' +
        '<div class="crm-hist"><h4>Histórico de contactos</h4>' + hist + "</div>",
      footer:
        '<button class="btn btn-gold" id="leadWa">Enviar WhatsApp</button>' +
        '<button class="btn btn-light" id="leadConvert">Converter em Matrícula</button>' +
        '<button class="btn btn-light" id="leadDel">Eliminar</button>' +
        '<button class="btn btn-primary" id="leadSave">Guardar</button>',
      onOpen: function () {
        document.getElementById("leadSave").onclick = function () {
          var fd = new FormData(document.getElementById("leadForm"));
          var lead = D.leadById(id);
          var estadoAntigo = lead.estado;
          var novoTel = D.normalizarTelefone(fd.get("telefone"));
          if (fd.get("telefone") && !novoTel) { C.toast("Telefone inválido. Use um número de 9 dígitos.", "err"); return; }
          // evita colidir com outro lead ao mudar o telefone
          if (novoTel && novoTel !== lead.telefone) {
            var outro = D.leadByTelefone(novoTel);
            if (outro && outro.id !== lead.id) { C.toast("Já existe outro lead com esse número.", "err"); return; }
            lead.telefone = novoTel;
          }
          lead.nome = (fd.get("nome") || "").trim() || "Sem nome";
          lead.curso = fd.get("curso") || "";
          lead.periodo = fd.get("periodo") || "";
          lead.responsavel = fd.get("responsavel") || "";
          lead.origem = fd.get("origem") || "";
          lead.unidade = fd.get("unidade") || "";
          lead.observacoes = (fd.get("observacoes") || "").trim();
          lead.atualizadoEm = new Date().toISOString();
          var novoEstado = fd.get("estado") || "Novo Lead";
          if (novoEstado !== estadoAntigo) {
            D.mudarEstadoLead(lead.id, novoEstado, { funcionario: autorAtual() });
          } else {
            D.saveLead(lead);
          }
          C.closeModal();
          C.toast("Lead atualizado.", "ok");
          if (window.App && App.current === "crm") { V.renderCrmLeads(); }
        };
        document.getElementById("leadWa").onclick = function () { V.enviarWhatsappLead(id); };
        document.getElementById("leadConvert").onclick = function () { V.converterLead(id); };
        document.getElementById("leadDel").onclick = function () {
          C.confirm("Eliminar o lead " + (l.nome || "") + "? O histórico será perdido.", function () {
            D.deleteLead(id); C.closeModal(); C.toast("Lead eliminado.", "ok");
            if (window.App && App.current === "crm") V.renderCrmLeads();
          }, { danger: true, yes: "Eliminar" });
        };
      }
    });
  };

  /* =======================================================================
     ENVIAR WHATSAPP (escolher mensagem → pré-visualizar → abrir wa.me)
     ======================================================================= */
  V.enviarWhatsappLead = function (id) {
    var l = D.leadById(id);
    if (!l) { C.toast("Lead não encontrado.", "err"); return; }
    if (!D.telefoneWhats(l.telefone)) { C.toast("Este lead não tem um número de WhatsApp válido.", "err"); return; }
    var msgs = D.mensagensPorCategoria("");
    var msgOpts = '<option value="">— Escolher mensagem —</option>' + msgs.map(function (m) {
      return '<option value="' + m.id + '">' + U.esc(m.categoria + " · " + m.titulo) + "</option>";
    }).join("");

    C.modal({
      title: "WhatsApp — " + (l.nome || "Sem nome"),
      body:
        '<div class="form-grid">' +
          '<div class="field full"><label>Modelo de mensagem</label><select id="waMsg">' + msgOpts + "</select></div>" +
          '<div class="field full"><label>Mensagem (editável)</label><textarea id="waTexto" rows="5" placeholder="Escreva ou escolha um modelo acima…"></textarea></div>' +
        "</div>" +
        '<div id="waAviso"></div>' +
        '<p class="help">Ao abrir, o WhatsApp surge com a mensagem pronta. O envio é feito por si — o sistema não envia automaticamente.</p>' +
        '<div class="crm-wa-marca" id="waMarca" hidden><h4>Depois de abrir o WhatsApp, registe o resultado:</h4>' +
          '<div class="crm-wa-btns">' +
            '<button class="btn btn-light btn-sm" data-wa-marca="enviada">Mensagem enviada</button>' +
            '<button class="btn btn-light btn-sm" data-wa-marca="naoresp">Não respondeu</button>' +
            '<button class="btn btn-light btn-sm" data-wa-marca="respondeu">Respondeu</button>' +
            '<button class="btn btn-light btn-sm" data-wa-marca="interessado">Interessado</button>' +
            '<button class="btn btn-light btn-sm" data-wa-marca="perdido">Perdido</button>' +
          "</div></div>",
      footer:
        '<button class="btn btn-light" onclick="App.closeModal()">Fechar</button>' +
        '<button class="btn btn-gold" id="waAbrir">Abrir WhatsApp</button>',
      onOpen: function () {
        var sel = document.getElementById("waMsg");
        var ta = document.getElementById("waTexto");
        var aviso = document.getElementById("waAviso");
        function atualizarAviso() {
          var faltam = D.variaveisEmFalta(sel.value ? D.mensagemById(sel.value).corpo : ta.value, l);
          aviso.innerHTML = faltam.length
            ? '<div class="crm-wa-aviso">Atenção: faltam dados no lead para ' + faltam.join(", ") + ". Edite a mensagem antes de enviar.</div>"
            : "";
        }
        sel.onchange = function () {
          var m = D.mensagemById(sel.value);
          if (m) { ta.value = D.aplicarVariaveis(m.corpo, l); }
          atualizarAviso();
        };
        ta.oninput = atualizarAviso;
        document.getElementById("waAbrir").onclick = function () {
          var texto = (ta.value || "").trim();
          if (!texto) { C.toast("Escolha ou escreva uma mensagem.", "err"); return; }
          var url = "https://wa.me/" + D.telefoneWhats(l.telefone) + "?text=" + encodeURIComponent(texto);
          window.open(url, "_blank");
          // guarda a mensagem usada para o registo posterior
          V._waUltima = { id: id, texto: texto };
          document.getElementById("waMarca").hidden = false;
        };
      }
    });
  };

  // Regista no histórico o resultado do contacto por WhatsApp.
  V._crmMarcar = function (acao) {
    var ctx = V._waUltima || {};
    var id = ctx.id;
    if (!id) return;
    var lead = D.leadById(id);
    if (!lead) return;
    var nome = autorAtual();
    if (acao === "enviada") {
      D.registarInteracao(id, { tipo: "WhatsApp", mensagem: ctx.texto, observacao: "Mensagem enviada", funcionario: nome });
      if ((lead.estado || "Novo Lead") === "Novo Lead") D.mudarEstadoLead(id, "Contactado", { funcionario: nome, mensagem: ctx.texto });
      C.toast("Contacto registado.", "ok");
    } else if (acao === "naoresp") {
      D.registarInteracao(id, { tipo: "WhatsApp", observacao: "Sem resposta", funcionario: nome });
      C.toast("Registado: sem resposta.", "ok");
    } else if (acao === "respondeu") {
      D.registarInteracao(id, { tipo: "WhatsApp", observacao: "Respondeu", funcionario: nome });
      C.toast("Registado: respondeu.", "ok");
    } else if (acao === "interessado") {
      D.mudarEstadoLead(id, "Interessado", { funcionario: nome, observacao: "Demonstrou interesse" });
      C.toast("Lead marcado como Interessado.", "ok");
    } else if (acao === "perdido") {
      D.mudarEstadoLead(id, "Perdido", { funcionario: nome, observacao: "Marcado como perdido após contacto" });
      C.toast("Lead marcado como Perdido.", "ok");
    }
    C.closeModal();
    if (window.App && App.current === "crm") V.renderCrmLeads();
  };

  /* =======================================================================
     CONVERTER EM MATRÍCULA (pré-preenche o formulário; não cria sozinho)
     ======================================================================= */
  V.converterLead = function (id) {
    var l = D.leadById(id);
    if (!l) { C.toast("Lead não encontrado.", "err"); return; }
    C.closeModal();
    // marca o contexto para que app.js ligue o lead à matrícula quando for gerada
    if (window.App) App._convertLeadId = id;
    var prefill = {
      nome: (l.nome && l.nome !== "Sem nome") ? l.nome : "",
      contacto: l.telefone || "", whatsapp: l.telefone || "",
      curso: l.curso || "", periodo: l.periodo || "", unidade: l.unidade || "",
      regime: l.modalidade || ""
    };
    App.navigate("matricula", { prefill: prefill, leadId: id });
    C.toast("Confira os dados e gere a matrícula para concluir a conversão.", "ok");
  };

  window.V = V;
})(window);
