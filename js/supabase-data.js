/* ==========================================================================
   supabase-data.js — Backend online (Supabase) com cache em memória
   Grupo Midas Angola · Turmas Midas 2026

   Estratégia: "hydrate + write-through".
   - Ao iniciar sessão, carrega tudo do Supabase para a cache (_db).
   - A API síncrona da app (MidasData.*) continua a ler da cache.
   - Cada gravação/eliminação atualiza a cache E é espelhada no Supabase.

   Se não houver configuração (js/config.js vazio), este módulo não faz nada e
   a app continua a funcionar localmente (localStorage).
   ========================================================================== */
(function (window) {
  "use strict";

  var cfg = window.MIDAS_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return; // modo local

  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase JS não carregou — a app fica em modo local.");
    return;
  }

  var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  window.sb = sb;

  var D = window.MidasData;
  var U = window.U;
  var _user = null;                 // utilizador Supabase autenticado
  var _perfil = { nome: "", perfil: "secretaria", ativo: true };

  function toast(msg, tipo) { try { window.C && window.C.toast(msg, tipo || "ok"); } catch (e) {} }
  function fail(msg, err) { if (err) console.error(msg, err); toast(msg, "err"); }

  /* ---- Helpers de leitura/escrita ------------------------------------ */
  function fetchAll(table) {
    return sb.from(table).select("dados").order("criado_em", { ascending: true })
      .then(function (res) {
        if (res.error) { fail("Falha ao carregar " + table + ".", res.error); return []; }
        return (res.data || []).map(function (r) { return r.dados; });
      });
  }

  function upsertRow(table, obj) {
    sb.from(table).upsert({ id: obj.id, dados: obj, atualizado_em: new Date().toISOString() })
      .then(function (res) { if (res.error) fail("Não foi possível guardar online. Verifique a ligação.", res.error); });
  }

  function deleteRow(table, id) {
    sb.from(table).delete().eq("id", id)
      .then(function (res) { if (res.error) fail("Não foi possível eliminar online.", res.error); });
  }

  function bulkUpsert(table, arr) {
    if (!arr || !arr.length) return Promise.resolve();
    var rows = arr.map(function (o) { return { id: o.id, dados: o }; });
    return sb.from(table).upsert(rows).then(function (res) {
      if (res.error) fail("Falha ao semear " + table + ".", res.error);
    });
  }

  function podeEscreverConfig() {
    return _perfil.perfil === "admin" || _perfil.perfil === "directora";
  }

  function pushConfig() {
    // Só admin/directora podem gravar configurações (RLS). Para outros perfis,
    // os contadores de matrícula/recibo são reconstruídos a partir dos dados
    // existentes em cada arranque (ver reconcileSeqs).
    if (!podeEscreverConfig()) return Promise.resolve();
    var db = D.db();
    var dados = {
      settings: db.settings,
      periodos: db.periodos, regimes: db.regimes, tiposCurso: db.tiposCurso,
      unidades: db.unidades, formasPagamento: db.formasPagamento,
      funcionarios: db.funcionarios, lixo: db.lixo
    };
    return sb.from("configuracoes")
      .upsert({ id: 1, dados: dados, atualizado_em: new Date().toISOString() })
      .then(function (res) { if (res.error) console.error("configuracoes", res.error); });
  }

  /* ---- Hidratação da cache a partir do Supabase ---------------------- */
  function hydrate() {
    var db = D.db();
    return sb.from("configuracoes").select("dados").eq("id", 1).maybeSingle()
      .then(function (res) {
        if (res.data && res.data.dados) {
          var d = res.data.dados;
          if (d.settings) db.settings = Object.assign(db.settings, d.settings);
          ["periodos", "regimes", "tiposCurso", "unidades", "formasPagamento", "funcionarios", "lixo"]
            .forEach(function (k) { if (Array.isArray(d[k])) db[k] = d[k]; });
          return null;
        }
        return pushConfig(); // primeiro arranque: grava as predefinições
      })
      .then(function () { return Promise.all([
        fetchAll("cursos"), fetchAll("emolumentos"),
        fetchAll("estudantes"), fetchAll("pagamentos")
      ]); })
      .then(function (r) {
        db.cursos = r[0]; db.emolumentos = r[1];
        db.estudantes = r[2]; db.pagamentos = r[3];
        var seeds = [];
        if (!db.cursos.length && D._seedCursos) { db.cursos = D._seedCursos(); seeds.push(bulkUpsert("cursos", db.cursos)); }
        if (!db.emolumentos.length && D._seedEmolumentos) { db.emolumentos = D._seedEmolumentos(); seeds.push(bulkUpsert("emolumentos", db.emolumentos)); }
        reconcileSeqs(db);
        return Promise.all(seeds);
      });
  }

  // Evita números repetidos entre dispositivos: avança os contadores para além
  // do maior número já existente em estudantes/pagamentos.
  function reconcileSeqs(db) {
    var maxMat = maxSeq((db.estudantes || []).map(function (e) { return e.matricula; }));
    var maxRec = maxSeq((db.pagamentos || []).map(function (p) { return p.recibo; }));
    if (maxMat + 1 > (db.settings.seqMatricula || 0)) db.settings.seqMatricula = maxMat + 1;
    if (maxRec + 1 > (db.settings.seqRecibo || 0)) db.settings.seqRecibo = maxRec + 1;
  }
  function maxSeq(arr) {
    var m = 0;
    (arr || []).forEach(function (s) {
      if (!s) return;
      var mt = String(s).match(/(\d+)\s*$/);
      if (mt) { var n = parseInt(mt[1], 10); if (n > m) m = n; }
    });
    return m;
  }

  /* ---- Override das mutações (write-through) -------------------------- */
  var base = {};
  ["save", "saveEstudante", "deleteEstudante", "savePagamento", "deletePagamento",
   "saveCurso", "deleteCurso", "saveEmolumento", "deleteEmolumento", "toggleEmolumento",
   "restaurarLixo", "reporCatalogo"].forEach(function (m) { base[m] = D[m].bind(D); });

  // settings + listas + sequências (nextMatricula/nextRecibo chamam this.save())
  D.save = function () { base.save(); pushConfig(); };

  D.saveEstudante = function (est) { var r = base.saveEstudante(est); upsertRow("estudantes", r); return r; };
  D.deleteEstudante = function (id) { base.deleteEstudante(id); deleteRow("estudantes", id); pushConfig(); };

  D.savePagamento = function (pag) { var r = base.savePagamento(pag); upsertRow("pagamentos", r); return r; };
  D.deletePagamento = function (id) { base.deletePagamento(id); deleteRow("pagamentos", id); pushConfig(); };

  D.saveCurso = function (c) { var r = base.saveCurso(c); upsertRow("cursos", r); return r; };
  D.deleteCurso = function (id) { base.deleteCurso(id); deleteRow("cursos", id); };

  D.saveEmolumento = function (e) { var r = base.saveEmolumento(e); if (r && r.emolumento) upsertRow("emolumentos", r.emolumento); return r; };
  D.deleteEmolumento = function (id) { base.deleteEmolumento(id); deleteRow("emolumentos", id); };
  D.toggleEmolumento = function (id) { var r = base.toggleEmolumento(id); if (r) upsertRow("emolumentos", r); return r; };

  D.restaurarLixo = function (id) {
    var db = D.db();
    var item = (db.lixo || []).filter(function (x) { return x.id === id; })[0];
    var ok = base.restaurarLixo(id);
    if (ok && item) {
      if (item.tipo === "estudante") upsertRow("estudantes", item.registo);
      else if (item.tipo === "pagamento") upsertRow("pagamentos", item.registo);
    }
    return ok;
  };

  // Repor catálogo: substitui todos os cursos no Supabase
  D.reporCatalogo = function () {
    var cs = base.reporCatalogo();
    sb.from("cursos").delete().neq("id", "").then(function (res) {
      if (res.error) { fail("Falha ao repor o catálogo online.", res.error); return; }
      bulkUpsert("cursos", cs);
    });
    return cs;
  };

  /* ---- Autenticação (Supabase Auth) ---------------------------------- */
  D.auth = function () {
    return {
      enabled: true,
      user: _user ? _user.email : "",
      nome: _perfil.nome || (_user ? _user.email : ""),
      perfil: _perfil.perfil,
      precisaTrocar: false
    };
  };

  // Alterar nome/palavra-passe da conta autenticada
  D.definirCredenciais = function (user, nome, novaPass) {
    if (novaPass) {
      sb.auth.updateUser({ password: novaPass })
        .then(function (res) { if (res.error) fail("Não foi possível alterar a palavra-passe.", res.error); });
    }
    if (nome != null && nome !== _perfil.nome) {
      _perfil.nome = nome;
      if (_user) sb.from("perfis").update({ nome: nome }).eq("id", _user.id)
        .then(function (res) { if (res.error) console.error("perfis", res.error); });
    }
    return D.auth();
  };

  function loadPerfil() {
    return sb.from("perfis").select("nome,perfil,ativo").eq("id", _user.id).maybeSingle()
      .then(function (res) {
        if (res.data) {
          _perfil.nome = res.data.nome || _user.email;
          _perfil.perfil = res.data.perfil || "secretaria";
          _perfil.ativo = res.data.ativo !== false;
        } else {
          _perfil.nome = _user.email;
        }
      });
  }

  function afterAuth(session, onReady) {
    _user = session.user;
    var screen = document.getElementById("loginScreen");
    var app = document.getElementById("app");
    return loadPerfil()
      .then(function () {
        if (!_perfil.ativo) {
          throw new Error("Conta desativada. Contacte o administrador.");
        }
        return hydrate();
      })
      .then(function () {
        screen.hidden = true; screen.innerHTML = "";
        app.hidden = false;
        onReady();
      })
      .catch(function (err) {
        fail(err.message || "Falha ao carregar os dados.", err);
        sb.auth.signOut();
        showSupaLogin(onReady, err.message);
      });
  }

  function showSupaLogin(onReady, erro) {
    var s = D.db().settings;
    var screen = document.getElementById("loginScreen");
    var app = document.getElementById("app");
    app.hidden = true; screen.hidden = false;
    screen.innerHTML =
      '<div class="login-card">' +
        '<img src="' + U.logoURL(false) + '" alt="Grupo Midas Angola" class="login-logo" />' +
        "<h1>" + U.esc(s.instituicao) + "</h1>" +
        '<div class="login-sys">' + U.esc(s.sistema) + "</div>" +
        '<span class="slogan">' + U.esc(s.slogan) + "</span>" +
        '<form id="loginForm" class="login-form">' +
          '<div class="field"><label>E-mail</label>' +
            '<input id="loginUser" type="email" autocomplete="username" required autofocus></div>' +
          '<div class="field"><label>Palavra-passe</label>' +
            '<input id="loginPass" type="password" autocomplete="current-password" required></div>' +
          '<div class="login-err" id="loginErr"' + (erro ? "" : " hidden") + ">" +
            U.esc(erro || "E-mail ou palavra-passe incorretos.") + "</div>" +
          '<button type="submit" class="btn btn-gold login-btn">Entrar</button>' +
        "</form>" +
      "</div>" +
      '<div class="login-foot">© 2026 ' + U.esc(s.instituicao) + " · " + U.esc(s.slogan) + "</div>";

    document.getElementById("loginForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var email = document.getElementById("loginUser").value.trim();
      var pass = document.getElementById("loginPass").value;
      var btn = ev.target.querySelector("button[type=submit]");
      var err = document.getElementById("loginErr");
      btn.disabled = true; btn.textContent = "A entrar…";
      sb.auth.signInWithPassword({ email: email, password: pass }).then(function (res) {
        if (res.error || !res.data.session) {
          err.hidden = false; err.textContent = "E-mail ou palavra-passe incorretos.";
          btn.disabled = false; btn.textContent = "Entrar";
          document.getElementById("loginPass").value = "";
          document.getElementById("loginPass").focus();
          return;
        }
        afterAuth(res.data.session, onReady);
      });
    });
  }

  /* ---- Substitui o portão de autenticação da app -------------------- */
  window.Auth.isLoggedIn = function () { return !!_user; };
  window.Auth.logout = function () { try { sb.auth.signOut(); } catch (e) {} };
  window.Auth.showLogin = function (onReady) { showSupaLogin(onReady); };
  window.Auth.gate = function (onReady) {
    sb.auth.getSession().then(function (res) {
      var session = res.data && res.data.session;
      if (session) afterAuth(session, onReady);
      else showSupaLogin(onReady);
    });
  };

})(window);
