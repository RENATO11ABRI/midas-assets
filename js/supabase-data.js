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
    // Backend configurado mas a biblioteca não carregou (ex.: sem internet).
    // NÃO cair silenciosamente no login local — mostrar erro claro.
    console.error("Supabase JS não carregou — verifique a ligação à internet.");
    window.Auth.gate = function () {
      var screen = document.getElementById("loginScreen");
      var app = document.getElementById("app");
      if (app) app.hidden = true;
      if (screen) {
        screen.hidden = false; screen.classList.add("open");
        screen.innerHTML = '<div class="login-card"><h1>Sem ligação ao servidor</h1>' +
          '<p class="login-hint">Não foi possível carregar a biblioteca do Supabase. ' +
          'Verifique a ligação à internet e recarregue a página.</p>' +
          '<button class="btn btn-primary login-btn" onclick="location.reload()">Recarregar</button></div>';
      }
    };
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
  var DOMINIO_INTERNO = "midas.local";   // contas internas (login por nome de utilizador)

  // login pode ser email real OU nome de utilizador (sem "@")
  function loginParaEmail(login) {
    login = (login || "").trim().toLowerCase();
    return login.indexOf("@") >= 0 ? login : login + "@" + DOMINIO_INTERNO;
  }

  // Recuperação de senha (admin, por email): ao voltar do link de recuperação
  sb.auth.onAuthStateChange(function (event) {
    if (event !== "PASSWORD_RECOVERY") return;
    var np = window.prompt("Recuperação de senha — escreva a NOVA palavra-passe (mín. 6 caracteres):");
    if (np === null) return;
    if (np.length < 6) { window.alert("Senha demasiado curta."); return; }
    sb.auth.updateUser({ password: np }).then(function (res) {
      if (res.error) { window.alert("Não foi possível alterar: " + res.error.message); return; }
      window.alert("Senha alterada. Inicie sessão com a nova senha.");
      sb.auth.signOut().then(function () { location.reload(); });
    });
  });

  function toast(msg, tipo) { try { window.C && window.C.toast(msg, tipo || "ok"); } catch (e) {} }
  function fail(msg, err) {
    var detail = err && (err.message || err.error_description || err.hint || err.details);
    if (err) console.error(msg, err);
    toast(detail ? (msg + " (" + detail + ")") : msg, "err");
  }

  // Que perfis podem ESCREVER em cada tabela (espelha as políticas RLS)
  function podeEscrever(table) {
    var p = _perfil.perfil;
    if (table === "cursos") return ["admin", "directora", "coordenador"].indexOf(p) >= 0;
    if (table === "emolumentos" || table === "configuracoes") return ["admin", "directora"].indexOf(p) >= 0;
    if (table === "estudantes") return ["admin", "directora", "secretaria"].indexOf(p) >= 0;
    if (table === "pagamentos") return ["admin", "directora", "secretaria", "financeiro"].indexOf(p) >= 0;
    return false;
  }

  /* ---- Helpers de leitura/escrita ------------------------------------ */
  // Lê TODAS as linhas em páginas de 1000 (o PostgREST limita cada pedido a
  // 1000 linhas; sem paginação, tabelas grandes ficavam silenciosamente cortadas).
  function fetchAll(table) {
    var PAG = 1000;
    var acc = [];
    function pagina(de) {
      return sb.from(table).select("dados").order("criado_em", { ascending: true }).range(de, de + PAG - 1)
        .then(function (res) {
          if (res.error) { var e = new Error(res.error.message || "Falha ao carregar " + table); e.supa = res.error; throw e; }
          var lote = res.data || [];
          acc = acc.concat(lote);
          if (lote.length === PAG) return pagina(de + PAG); // pode haver mais
          return acc.map(function (r) { return r.dados; });
        });
    }
    return pagina(0);
  }
  // Renovação de sessão partilhada (evita 7 refresh em paralelo).
  var _refreshPromise = null;
  function refrescarSessao() {
    if (!_refreshPromise) {
      _refreshPromise = sb.auth.refreshSession().then(function (res) {
        _refreshPromise = null; return !!(res && !res.error);
      }, function () { _refreshPromise = null; return false; });
    }
    return _refreshPromise;
  }
  // Leitura tolerante a token expirado: tenta renovar a sessão UMA vez e repete.
  // Se a renovação falhar, propaga o erro (NUNCA devolve vazio — para não
  // esvaziar a cache/ecrã e parecer que os dados foram apagados).
  function fetchAllSeguro(table) {
    return fetchAll(table).catch(function (e) {
      if (!ehErroAuth(e.supa || e)) throw e;
      return refrescarSessao().then(function (ok) { if (!ok) throw e; return fetchAll(table); });
    });
  }

  /* ---- Fila de sincronização offline (outbox) ----------------------- */
  var OUTBOX_KEY = "midas_outbox_v1";
  function outboxLer() { try { return JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]"); } catch (e) { return []; } }
  function outboxGravar(q) { try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(q)); } catch (e) {} notificarSync(); }
  function enfileirar(op) { var q = outboxLer(); q.push(op); outboxGravar(q); }
  function notificarSync() { var s = window.MidasSync; if (s && typeof s._onChange === "function") s._onChange(); }

  // Deteta erros de autenticação/sessão expirada (JWT) vindos do PostgREST.
  function ehErroAuth(err) {
    if (!err) return false;
    var m = ((err.message || "") + " " + (err.hint || "") + " " + (err.code || "")).toLowerCase();
    return m.indexOf("jwt") >= 0 || m.indexOf("expired") >= 0 || m.indexOf("token") >= 0 ||
           err.code === "PGRST301" || err.status === 401;
  }
  // Renova a sessão e, em caso de sucesso, re-sincroniza a fila (evita perder
  // gravações feitas enquanto o token estava expirado).
  var _aRenovar = false;
  function renovarSessao() {
    if (_aRenovar) return;
    _aRenovar = true;
    toast("A sua sessão expirou — a renovar…", "ok");
    sb.auth.refreshSession().then(function (res) {
      _aRenovar = false;
      if (res && !res.error) { toast("Sessão renovada. A sincronizar…", "ok"); flushOutbox().then(notificarSync); }
      else { fail("A sessão expirou. Inicie sessão novamente para sincronizar."); }
    }).catch(function () { _aRenovar = false; fail("A sessão expirou. Inicie sessão novamente para sincronizar."); });
  }

  // Em modo protegido (cache local corrompida -> sementes), NÃO espelhar para o
  // servidor: evita sobrescrever os dados bons remotos. O servidor é a fonte de
  // verdade até a cache ser recuperada (reload depois de resolvido).
  function modoProtegido() { return !!(D.estaProtegido && D.estaProtegido()); }

  function upsertRow(table, obj) {
    if (modoProtegido()) return;
    var op = { kind: "upsert", table: table, obj: obj };
    if (!navigator.onLine) { enfileirar(op); return; }
    var row = { id: obj.id, dados: obj, atualizado_em: new Date().toISOString() };
    sb.from(table).upsert(row)
      .then(function (res) {
        if (!res.error) return;
        // QUALQUER erro (auth OU servidor) → enfileira, para o registo NUNCA se
        // perder. A fila volta a tentar e, se o servidor rejeitar de forma
        // definitiva, fica em "falhas" para revisão (nunca desaparece em silêncio).
        enfileirar(op);
        if (ehErroAuth(res.error)) renovarSessao();
        else fail("Não foi possível guardar online — guardado para nova tentativa.", res.error);
      })
      .catch(function () { enfileirar(op); }); // falha de rede -> fila
  }

  function deleteRow(table, id) {
    if (modoProtegido()) return;
    var op = { kind: "delete", table: table, id: id };
    if (!navigator.onLine) { enfileirar(op); return; }
    sb.from(table).delete().eq("id", id)
      .then(function (res) {
        if (!res.error) return;
        enfileirar(op);
        if (ehErroAuth(res.error)) renovarSessao();
        else fail("Não foi possível eliminar online — guardado para nova tentativa.", res.error);
      })
      .catch(function () { enfileirar(op); });
  }

  var FALHAS_KEY = "midas_outbox_falhas_v1";
  function falhasLer() { try { return JSON.parse(localStorage.getItem(FALHAS_KEY) || "[]"); } catch (e) { return []; } }
  function falhasGravar(f) { try { localStorage.setItem(FALHAS_KEY, JSON.stringify(f)); } catch (e) {} notificarSync(); }
  function registarFalha(op, motivo) {
    var f = falhasLer();
    f.push({ kind: op.kind, table: op.table, obj: op.obj, id: op.id, erro: motivo, quando: new Date().toISOString() });
    falhasGravar(f);
  }
  var _aFazerFlush = false;
  function flushOutbox() {
    if (!navigator.onLine) return Promise.resolve(false);
    if (_aFazerFlush) return Promise.resolve(false); // mutex: evita flushes concorrentes
    var q = outboxLer();
    if (!q.length) { notificarSync(); return Promise.resolve(true); }
    _aFazerFlush = true;
    var i = 0, houveFalha = false;
    function fim(val) { _aFazerFlush = false; notificarSync(); return val; }
    // Preserva as operações enfileiradas DURANTE o flush: o outbox mantém q nos
    // primeiros q.length lugares e as novas são acrescentadas no fim (enfileirar
    // só faz push). Reescreve = resto das antigas + todas as novas.
    function guardarResto(restoAntigas) {
      var atual = outboxLer();
      outboxGravar(restoAntigas.concat(atual.slice(q.length)));
    }
    function passo() {
      if (i >= q.length) {
        guardarResto([]); // remove só as processadas; mantém as enfileiradas entretanto
        if (houveFalha) fail("Algumas alterações offline foram rejeitadas pelo servidor (ver consola). Não foram perdidas — ficaram guardadas para revisão.");
        return Promise.resolve(fim(true));
      }
      var op = q[i++];
      var p = op.kind === "delete"
        ? sb.from(op.table).delete().eq("id", op.id)
        : sb.from(op.table).upsert({ id: op.obj.id, dados: op.obj, atualizado_em: new Date().toISOString() });
      return p.then(function (res) {
        if (res && res.error) {
          if (ehErroAuth(res.error)) {
            // Sessão expirada a meio: para, mantém o resto da fila + as novas, e renova.
            guardarResto(q.slice(i - 1));
            renovarSessao();
            return fim(false);
          }
          // Erro de servidor (RLS, violação de unicidade…): NÃO se perde — guarda-se
          // em "falhas" para revisão manual e prossegue, evitando bloquear a fila.
          houveFalha = true; registarFalha(op, res.error.message || "erro de servidor");
        }
        return passo();
      }).catch(function () {
        // Falha de rede: mantém esta e as seguintes + as novas, para nova tentativa.
        guardarResto(q.slice(i - 1));
        return fim(false);
      });
    }
    // Rede de segurança: qualquer exceção inesperada liberta sempre o mutex,
    // senão o outbox ficaria trancado até um reload.
    return Promise.resolve().then(passo).catch(function (e) {
      _aFazerFlush = false; notificarSync();
      if (window.console) console.error("flushOutbox: erro inesperado", e);
      return false;
    });
  }

  function bulkUpsert(table, arr) {
    if (!arr || !arr.length) return Promise.resolve();
    var rows = arr.map(function (o) { return { id: o.id, dados: o }; });
    return sb.from(table).upsert(rows).then(function (res) {
      if (res.error) fail("Falha ao semear " + table + ".", res.error);
    });
  }

  // Verdadeiro quando a tabela própria `lixo` existe (depois de correr lixo.sql).
  // Mantém compatibilidade: enquanto não existir, a reciclagem viaja na config.
  var _lixoTabela = false;

  function podeEscreverConfig() {
    return _perfil.perfil === "admin" || _perfil.perfil === "directora";
  }

  function pushConfig() {
    // Só admin/directora podem gravar configurações (RLS). Para outros perfis,
    // os contadores de matrícula/recibo são reconstruídos a partir dos dados
    // existentes em cada arranque (ver reconcileSeqs).
    if (modoProtegido() || !podeEscreverConfig()) return Promise.resolve();
    var db = D.db();
    var dados = {
      settings: db.settings,
      periodos: db.periodos, regimes: db.regimes, tiposCurso: db.tiposCurso,
      unidades: db.unidades, formasPagamento: db.formasPagamento,
      funcionarios: db.funcionarios
    };
    // Enquanto a tabela própria `lixo` não existir, a reciclagem continua a viajar
    // dentro da config (compatibilidade). Quando existir, sai daqui (tabela própria).
    if (!_lixoTabela) dados.lixo = db.lixo;
    return sb.from("configuracoes")
      .upsert({ id: 1, dados: dados, atualizado_em: new Date().toISOString() })
      .then(function (res) { if (res.error) console.error("configuracoes", res.error); });
  }

  /* ---- Hidratação da cache a partir do Supabase ---------------------- */
  function lerConfig() {
    return sb.from("configuracoes").select("dados").eq("id", 1).maybeSingle().then(function (res) {
      if (res.error) {
        var e = new Error(res.error.message); e.supa = res.error;
        if (ehErroAuth(res.error)) return refrescarSessao().then(function (ok) { if (!ok) throw e; return lerConfig(); });
        throw e;
      }
      return res;
    });
  }
  function hydrate() {
    var db = D.db();
    return lerConfig()
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
        fetchAllSeguro("cursos"), fetchAllSeguro("emolumentos"),
        fetchAllSeguro("estudantes"), fetchAllSeguro("pagamentos"), fetchAllSeguro("fechos"), fetchAllSeguro("estagios"), fetchAllSeguro("leads")
      ]); })
      .then(function (r) {
        db.cursos = r[0]; db.emolumentos = r[1];
        db.estudantes = r[2]; db.pagamentos = r[3]; db.fechos = r[4] || []; db.estagios = r[5] || []; db.leads = r[6] || [];
        var seeds = [];
        // Só semeia se o perfil tiver permissão de escrita (evita erros de RLS
        // para quem não é admin/directora). Os dados ficam na cache de qualquer forma.
        if (!db.cursos.length && D._seedCursos) {
          db.cursos = D._seedCursos();
          if (podeEscrever("cursos")) seeds.push(bulkUpsert("cursos", db.cursos));
        }
        if (!db.emolumentos.length && D._seedEmolumentos) {
          db.emolumentos = D._seedEmolumentos();
          if (podeEscrever("emolumentos")) seeds.push(bulkUpsert("emolumentos", db.emolumentos));
        }
        reconcileSeqs(db);
        return Promise.all(seeds);
      })
      .then(function () {
        // Tabela própria da reciclagem (se já existir): passa a ser a fonte de
        // verdade do lixo. Se a tabela ainda não foi criada (lixo.sql não corrido),
        // o erro é ignorado e mantém-se o lixo vindo da configuração.
        return sb.from("lixo").select("dados").order("criado_em", { ascending: false }).limit(1000)
          .then(function (res) {
            if (!res.error) { _lixoTabela = true; db.lixo = (res.data || []).map(function (x) { return x.dados; }); }
          })
          .catch(function () {});
      })
      .then(function (r) {
        // O hydrate substituiu a cache pelos dados do servidor. Reaplica os
        // registos ainda pendentes na fila (criados/editados offline) para que
        // NÃO desapareçam do ecrã até um reload; e envia-os ao servidor.
        var pendentes = outboxLer();
        aplicarOpsNaCache(pendentes);
        flushOutbox().then(notificarSync);
        return r;
      });
  }
  // Aplica operações da fila (upsert/delete) à cache em memória, por id.
  function aplicarOpsNaCache(ops) {
    if (!ops || !ops.length) return;
    var db = D.db();
    ops.forEach(function (op) {
      var arr = db[op.table];
      if (!Array.isArray(arr)) return;
      if (op.kind === "delete") {
        for (var i = 0; i < arr.length; i++) { if (arr[i] && arr[i].id === op.id) { arr.splice(i, 1); break; } }
      } else if (op.obj) {
        var achou = false;
        for (var j = 0; j < arr.length; j++) { if (arr[j] && arr[j].id === op.obj.id) { arr[j] = op.obj; achou = true; break; } }
        if (!achou) arr.push(op.obj);
      }
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
   "restaurarLixo", "esvaziarLixo", "reporCatalogo", "reset", "import",
   "saveFecho", "deleteFecho", "saveEstagio", "deleteEstagio",
   "saveLead", "deleteLead", "queryEstudantes"].forEach(function (m) { base[m] = D[m].bind(D); });

  /* ---- Escala: consultas paginadas no servidor (opt-in) -------------- */
  // Ativa-se com MIDAS_CONFIG.escala = true E ligação online. Quando inativa,
  // ou em falha, recorre à versão local (base.queryEstudantes) — offline continua a funcionar.
  D.escalaAtiva = function () { return !!cfg.escala && navigator.onLine; };
  D.queryEstudantes = function (opts) {
    opts = opts || {};
    if (!D.escalaAtiva()) return base.queryEstudantes(opts);
    var pp = Math.max(1, opts.porPagina || 50);
    var pag = Math.max(1, opts.pagina || 1);
    return sb.rpc("midas_estudantes_pagina", {
      p_busca: opts.busca || "", p_curso: opts.curso || "", p_estado: opts.estado || "",
      p_ordenar: opts.ordenar || "recente", p_limite: pp, p_offset: (pag - 1) * pp
    }).then(function (res) {
      if (res.error || !res.data) { return base.queryEstudantes(opts); } // fallback
      var total = (res.data[0] && res.data[0].total) ? Number(res.data[0].total) : res.data.length;
      var nPaginas = Math.max(1, Math.ceil(total / pp));
      return { rows: res.data.map(function (r) { return r.dados; }), total: total, pagina: pag, porPagina: pp, nPaginas: nPaginas, servidor: true };
    }).catch(function () { return base.queryEstudantes(opts); });
  };

  // Evita reenviar a configuração completa a cada gravação de entidade: as
  // entidades têm a sua própria linha, por isso o save() interno é silenciado.
  var _suppressConfig = false;
  function quiet(fn, args) {
    _suppressConfig = true;
    try { return fn.apply(D, args); } finally { _suppressConfig = false; }
  }

  // settings + listas + sequências (nextMatricula/nextRecibo chamam this.save())
  D.save = function () { base.save(); if (!_suppressConfig) pushConfig(); };

  D.saveEstudante = function (est) { var r = quiet(base.saveEstudante, [est]); upsertRow("estudantes", r); return r; };
  D.deleteEstudante = function (id) {
    var lx = quiet(base.deleteEstudante, [id]); deleteRow("estudantes", id);
    if (_lixoTabela) { if (lx) upsertRow("lixo", lx); } else pushConfig();
  };

  D.savePagamento = function (pag) { var r = quiet(base.savePagamento, [pag]); upsertRow("pagamentos", r); return r; };
  D.deletePagamento = function (id) {
    var lx = quiet(base.deletePagamento, [id]); deleteRow("pagamentos", id);
    if (_lixoTabela) { if (lx) upsertRow("lixo", lx); } else pushConfig();
  };

  D.saveFecho = function (f) { var r = quiet(base.saveFecho, [f]); upsertRow("fechos", r); return r; };
  D.deleteFecho = function (id) { quiet(base.deleteFecho, [id]); deleteRow("fechos", id); };

  D.saveEstagio = function (e) { var r = quiet(base.saveEstagio, [e]); upsertRow("estagios", r); return r; };
  D.deleteEstagio = function (id) { quiet(base.deleteEstagio, [id]); deleteRow("estagios", id); };

  D.saveLead = function (l) { var r = quiet(base.saveLead, [l]); upsertRow("leads", r); return r; };
  D.deleteLead = function (id) { quiet(base.deleteLead, [id]); deleteRow("leads", id); };

  D.saveCurso = function (c) { var r = quiet(base.saveCurso, [c]); upsertRow("cursos", r); return r; };
  D.deleteCurso = function (id) { quiet(base.deleteCurso, [id]); deleteRow("cursos", id); };

  D.saveEmolumento = function (e) { var r = quiet(base.saveEmolumento, [e]); if (r && r.emolumento) upsertRow("emolumentos", r.emolumento); return r; };
  D.deleteEmolumento = function (id) { quiet(base.deleteEmolumento, [id]); deleteRow("emolumentos", id); };
  D.toggleEmolumento = function (id) { var r = quiet(base.toggleEmolumento, [id]); if (r) upsertRow("emolumentos", r); return r; };

  D.restaurarLixo = function (id) {
    var db = D.db();
    var item = (db.lixo || []).filter(function (x) { return x.id === id; })[0];
    var ok = quiet(base.restaurarLixo, [id]);
    if (ok && item) {
      if (item.tipo === "estudante") upsertRow("estudantes", item.registo);
      else if (item.tipo === "pagamento") upsertRow("pagamentos", item.registo);
    }
    if (ok) { if (_lixoTabela) deleteRow("lixo", id); else pushConfig(); }
    return ok;
  };
  D.esvaziarLixo = function () {
    var ids = (D.db().lixo || []).map(function (x) { return x.id; });
    quiet(base.esvaziarLixo, []);
    if (_lixoTabela) ids.forEach(function (lid) { deleteRow("lixo", lid); });
    else pushConfig();
  };

  // Repor catálogo: substitui todos os cursos no Supabase (mantém estudantes/pagamentos).
  // base.reporCatalogo() grava localmente e faz pushConfig (catalogoVersao).
  D.reporCatalogo = function () {
    var cs = base.reporCatalogo();
    // SÓ UPSERT — adiciona/atualiza os cursos oficiais sem apagar os existentes
    // (apagar todos órfanava as dívidas dos estudantes nesses cursos).
    bulkUpsert("cursos", cs);
    return cs;
  };

  // Reset de fábrica / importação: ressincronizam TODAS as entidades no Supabase
  // (base.reset/base.import já gravam a configuração via save()->pushConfig).
  function ressincronizarEntidades(db) {
    if (!podeEscreverConfig()) { toast("Sem permissão para sincronizar os dados online.", "err"); return; }
    // SÓ UPSERT — NUNCA apaga. Importar/restaurar passa a MESCLAR (adiciona/atualiza)
    // e nunca pode perder dados do servidor. (O delete-all + reinsert era a raiz da
    // perda total: bastava a cache estar vazia/parcial.) Para remover registos,
    // use a eliminação normal (com reciclagem).
    Promise.all([
      bulkUpsert("cursos", db.cursos || []),
      bulkUpsert("emolumentos", db.emolumentos || []),
      bulkUpsert("estudantes", db.estudantes || []),
      bulkUpsert("pagamentos", db.pagamentos || [])
    ]).then(function () { toast("Dados sincronizados (mesclados) com o servidor.", "ok"); })
      .catch(function (e) { fail("Falha ao sincronizar online.", e); });
  }

  // "Repor dados de fábrica" é LOCAL (limpa só a cache deste dispositivo). NÃO
  // apaga o servidor — senão um reset acidental destruía a base de todos. Ao
  // recarregar, o hydrate traz os dados de volta do servidor.
  D.reset = function () { return base.reset(); };
  D.import = function (json) { var db = base.import(json); ressincronizarEntidades(db); return db; };

  // Numeração atómica via RPC (evita números repetidos entre dispositivos).
  base.nextMatricula = D.nextMatricula.bind(D);
  base.nextRecibo = D.nextRecibo.bind(D);
  function alocarAtomico(tipo, prefixo, digitos, fallbackSync) {
    return sb.rpc("proximo_contador", { p_tipo: tipo }).then(function (res) {
      if (res.error || res.data == null) {
        console.error("proximo_contador", res.error);
        return fallbackSync(); // recorre ao contador local se a RPC falhar
      }
      var n = Number(res.data);
      var db = D.db();
      // mantém o "peek" local coerente com o servidor
      if (tipo === "matricula" && n >= (db.settings.seqMatricula || 0)) db.settings.seqMatricula = n + 1;
      if (tipo === "recibo" && n >= (db.settings.seqRecibo || 0)) db.settings.seqRecibo = n + 1;
      return D._fmtNum(prefixo, n, digitos);
    });
  }
  D.alocarMatricula = function () {
    var s = D.db().settings;
    return alocarAtomico("matricula", s.prefixoMatricula, s.digitosMatricula, base.nextMatricula);
  };
  D.alocarRecibo = function () {
    var s = D.db().settings;
    return alocarAtomico("recibo", s.prefixoRecibo, s.digitosRecibo, base.nextRecibo);
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
        _perfil.id = _user.id; // necessário p/ as guardas (rehidratarQuentes, etc.)
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
        screen.hidden = true; screen.classList.remove("open"); screen.innerHTML = "";
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
    app.hidden = true; screen.hidden = false; screen.classList.add("open");
    screen.innerHTML =
      '<div class="login-card">' +
        '<div class="login-brand">' +
          '<img src="' + U.logoURL(false) + '" alt="Grupo Midas Angola" class="logo" />' +
          "<h1>" + U.esc(s.instituicao) + "</h1>" +
          '<div class="sys">' + U.esc(s.sistema) + "</div>" +
          '<div class="slogan">' + U.esc(s.slogan) + "</div>" +
        "</div>" +
        '<form id="loginForm" class="login-form">' +
          '<div class="field"><label>E-mail ou nome de utilizador</label>' +
            '<input id="loginUser" type="text" autocomplete="username" required autofocus></div>' +
          '<div class="field"><label>Palavra-passe</label>' +
            '<input id="loginPass" type="password" autocomplete="current-password" required></div>' +
          '<div class="login-err" id="loginErr"' + (erro ? "" : " hidden") + ">" +
            U.esc(erro || "Dados de acesso incorretos.") + "</div>" +
          '<button type="submit" class="btn btn-primary login-btn">Entrar</button>' +
          '<button type="button" class="btn-link login-forgot" id="loginForgot">Esqueci a senha</button>' +
        "</form>" +
        '<div class="login-foot">© 2026 ' + U.esc(s.instituicao) + " · " + U.esc(s.slogan) + "</div>" +
      "</div>";

    document.getElementById("loginForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var email = loginParaEmail(document.getElementById("loginUser").value);
      var pass = document.getElementById("loginPass").value;
      var btn = ev.target.querySelector("button[type=submit]");
      var err = document.getElementById("loginErr");
      btn.disabled = true; btn.textContent = "A entrar…";
      sb.auth.signInWithPassword({ email: email, password: pass }).then(function (res) {
        if (res.error || !res.data.session) {
          err.hidden = false; err.textContent = "Dados de acesso incorretos.";
          btn.disabled = false; btn.textContent = "Entrar";
          document.getElementById("loginPass").value = "";
          document.getElementById("loginPass").focus();
          return;
        }
        afterAuth(res.data.session, onReady);
      });
    });

    document.getElementById("loginForgot").onclick = function () {
      var id = (document.getElementById("loginUser").value || "").trim();
      if (!id || id.indexOf("@") < 0 || id.toLowerCase().indexOf("@" + DOMINIO_INTERNO) >= 0) {
        window.alert("A recuperação automática por email só funciona para a conta de administrador (email real). " +
          "As restantes contas são recuperadas pelo administrador em Configurações → Utilizadores.");
        return;
      }
      sb.auth.resetPasswordForEmail(id, { redirectTo: location.origin }).then(function (res) {
        if (res.error) window.alert("Erro: " + res.error.message);
        else window.alert("Enviámos um link de recuperação para " + id + ". Verifique o email (e a pasta de spam).");
      });
    };
  }

  /* ---- Substitui o portão de autenticação da app -------------------- */
  window.Auth.isLoggedIn = function () { return !!_user; };
  window.Auth.logout = function () { return sb.auth.signOut({ scope: "local" }); };
  window.Auth.showLogin = function (onReady) { showSupaLogin(onReady); };
  window.Auth.gate = function (onReady) {
    sb.auth.getSession().then(function (res) {
      var session = res.data && res.data.session;
      if (session) afterAuth(session, onReady);
      else showSupaLogin(onReady);
    });
  };

  /* ---- Gestão de utilizadores (via Edge Function, só admin) ---------- */
  function chamarAdmin(body) {
    return sb.functions.invoke("admin-users", { body: body }).then(function (res) {
      if (res.error) {
        var ctx = res.error.context;
        if (ctx && typeof ctx.json === "function") {
          return ctx.json().then(function (j) { throw new Error((j && j.error) || res.error.message); });
        }
        throw new Error(res.error.message || "Falha ao contactar o servidor.");
      }
      if (res.data && res.data.error) throw new Error(res.data.error);
      return res.data;
    });
  }
  window.MidasUsers = {
    isAdmin: function () { return _perfil.perfil === "admin"; },
    list: function () { return chamarAdmin({ action: "list" }); },
    create: function (nome, login, password, perfil) {
      return chamarAdmin({ action: "create", nome: nome, login: login, password: password, perfil: perfil });
    },
    setRole: function (userId, perfil) { return chamarAdmin({ action: "setRole", userId: userId, perfil: perfil }); },
    setActive: function (userId, ativo) { return chamarAdmin({ action: "setActive", userId: userId, ativo: ativo }); },
    setPassword: function (userId, password) { return chamarAdmin({ action: "setPassword", userId: userId, password: password }); },
    remove: function (userId) { return chamarAdmin({ action: "remove", userId: userId }); }
  };

  /* ---- Auditoria (leitura; só admin/directora pela RLS) -------------- */
  window.MidasAudit = {
    podeVer: function () { return ["admin", "directora"].indexOf(_perfil.perfil) >= 0; },
    list: function (filtros) {
      filtros = filtros || {};
      var q = sb.from("auditoria")
        .select("tabela,registo_id,accao,utilizador_nome,quando")
        .order("quando", { ascending: false }).limit(300);
      if (filtros.tabela) q = q.eq("tabela", filtros.tabela);
      if (filtros.accao) q = q.eq("accao", filtros.accao);
      return q.then(function (res) { if (res.error) throw new Error(res.error.message); return res.data || []; });
    }
  };

  /* ---- Re-hidratação leve das tabelas "quentes" ---------------------
     Sem realtime, a app só via os dados do servidor no login. Isto refaz o
     fetch de estudantes/pagamentos/fechos (as tabelas que mudam entre
     dispositivos), reconcilia contadores e reaplica a fila offline. Evita
     cobrança dupla e fechos de caixa incompletos. */
  var _aRehidratar = false;
  var _avisoAnomalia = false; // aviso da guarda anti-anomalia mostrado (1x por episódio)
  function rehidratarQuentes(recarregar) {
    if (!navigator.onLine || _aRehidratar || modoProtegido()) return Promise.resolve(false);
    if (!_perfil || !_perfil.id) return Promise.resolve(false); // só com sessão
    _aRehidratar = true;
    var db = D.db();
    // fetchAllSeguro: se falhar (token expirado e sem renovação), LANÇA — assim
    // os db.* NÃO são substituídos por vazio (a cache/ecrã ficam intactos).
    return Promise.all([fetchAllSeguro("estudantes"), fetchAllSeguro("pagamentos"), fetchAllSeguro("fechos")])
      .then(function (r) {
        // Guarda anti-anomalia: NUNCA substituir uma cache não-vazia por VAZIO
        // (resposta de 0 linhas por RLS/sessão em vez de erro esvaziaria o ecrã).
        var suspeito = ((db.estudantes && db.estudantes.length) && (!r[0] || !r[0].length)) ||
                       ((db.pagamentos && db.pagamentos.length) && (!r[1] || !r[1].length));
        if (suspeito) {
          // Avisa UMA vez por sessão (a sondagem corre a cada 90s — sem isto,
          // o mesmo aviso repetia-se indefinidamente).
          if (!_avisoAnomalia) { _avisoAnomalia = true; toast("Atualização ignorada: o servidor devolveu 0 registos (possível sessão/permissão). Os dados no ecrã foram mantidos.", "err"); }
          return false;
        }
        _avisoAnomalia = false; // recuperou: volta a poder avisar no futuro
        db.estudantes = r[0]; db.pagamentos = r[1]; db.fechos = r[2] || [];
        reconcileSeqs(db);
        aplicarOpsNaCache(outboxLer()); // preserva os registos offline pendentes
        notificarSync();
        // Re-renderiza a vista atual SÓ se não houver um modal/formulário aberto
        // (não interromper a secretária a meio de um registo).
        if (recarregar && window.App && App.refresh) {
          var mh = document.getElementById("modalHost");
          var appEl = document.getElementById("app");
          if ((!mh || !mh.classList.contains("open")) && appEl && !appEl.hidden) {
            try { App.refresh(); } catch (e) {}
          }
        }
        return true;
      })
      .catch(function (e) {
        // Falha de leitura (ex.: sessão expirada sem renovação possível): NÃO
        // toca na cache. Avisa o utilizador para reentrar, sem fingir 'sem dados'.
        if (ehErroAuth(e && (e.supa || e))) toast("A sua sessão expirou. Termine sessão e entre de novo para sincronizar (os dados estão guardados).", "err");
        return false;
      })
      .then(function (v) { _aRehidratar = false; return v; });
  }

  /* ---- Estado de sincronização / offline ---------------------------- */
  window.MidasSync = {
    online: function () { return navigator.onLine; },
    pendentes: function () { return outboxLer().length; },
    sincronizar: function () { return flushOutbox().then(function (ok) { notificarSync(); return ok; }); },
    // Atualiza as tabelas quentes a partir do servidor (devolve Promise).
    rehidratar: function (recarregar) { return rehidratarQuentes(recarregar); },
    // Falhas: operações que o servidor rejeitou (não se perdem; ficam para revisão).
    nFalhas: function () { return falhasLer().length; },
    falhas: function () { return falhasLer(); },
    reprocessarFalhas: function () {
      var f = falhasLer();
      if (!f.length) return Promise.resolve(true);
      var q = outboxLer();
      f.forEach(function (op) {
        q.push(op.kind === "delete"
          ? { kind: "delete", table: op.table, id: op.id }
          : { kind: "upsert", table: op.table, obj: op.obj });
      });
      outboxGravar(q);
      falhasGravar([]); // saem das falhas; voltam para a fila e tenta-se de novo
      return flushOutbox().then(function (ok) { notificarSync(); return ok; });
    },
    descartarFalhas: function () { falhasGravar([]); return true; },
    _onChange: null,
    aoMudar: function (cb) { this._onChange = cb; }
  };
  window.addEventListener("online", function () { flushOutbox().then(function () { rehidratarQuentes(true); }); });
  window.addEventListener("offline", notificarSync);
  // Ao voltar ao separador / focar a janela: sincroniza e traz dados frescos.
  window.addEventListener("focus", function () { flushOutbox().then(function () { rehidratarQuentes(true); }); });
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") { flushOutbox().then(function () { rehidratarQuentes(true); }); }
  });
  // Sondagem periódica (silenciosa) enquanto a app está visível.
  setInterval(function () {
    if (document.visibilityState === "visible") rehidratarQuentes(false);
  }, 90000);

})(window);
