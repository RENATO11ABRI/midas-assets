/* ==========================================================================
   data.js — Camada de dados (localStorage)
   Grupo Midas Angola · Turmas Midas 2026
   ========================================================================== */
(function (window) {
  "use strict";

  var STORAGE_KEY = "midas2026_db_v2";

  // ---- Defaults / seed -----------------------------------------------------
  var DEFAULT_PERIODOS = ["Manhã", "Tarde", "Noite", "Fim de Semana"];
  var DEFAULT_REGIMES = ["Dias úteis", "Sábado", "Domingo", "Sábado e Domingo"];
  var DEFAULT_TIPOS = ["Médio", "Intensivo", "Imersão", "Premium", "Capacitação"];
  var CATALOG_VERSION = 2;
  var DEFAULT_UNIDADES = ["Polo Sede — Luanda", "Polo Viana", "Polo Cacuaco"];
  // Categorias de emolumentos
  var CATEGORIAS_EMOLUMENTO = [
    "Matrícula", "Inscrição", "Propina", "Estágio Preliminar", "Estágio Curricular",
    "Declaração", "Túnica", "Certificado de Participação", "Certificado de Fim do Curso",
    "Mesa do Júri", "Sala da Defesa", "Emolumentos da Defesa", "Aula Prática",
    "Orientação", "Exame Prático", "Termo de Frequência", "Diploma de Mérito",
    "Cartão de Estudante", "Fascículo", "Outros"
  ];
  // Valores predefinidos (Kz) dos emolumentos da defesa/finalistas (editáveis em Configurações)
  var VALORES_EMOLUMENTO = {
    "Certificado de Fim do Curso": 59998,
    "Termo de Frequência": 49997,
    "Mesa do Júri": 19999,
    "Sala da Defesa": 10998,
    "Diploma de Mérito": 0,
    "Estágio Curricular": 60000,
    "Declaração": 10000,
    "Exame Prático": 16000,
    "Emolumentos da Defesa": 150000
  };
  // Catálogo inicial de emolumentos (um por categoria; valores predefinidos acima)
  function seedEmolumentos() {
    return CATEGORIAS_EMOLUMENTO.map(function (cat) {
      return {
        id: MidasData.uid("emo"), nome: cat, categoria: cat, valor: VALORES_EMOLUMENTO[cat] || 0,
        curso: "", tipoCurso: "", unidade: "", estado: "ativo", observacoes: ""
      };
    });
  }
  var DEFAULT_FORMAS = ["Dinheiro", "TPA", "Transferência", "Multicaixa Express"];
  var DEFAULT_FUNCIONARIOS = ["Secretaria Geral"];

  // Cursos iniciais (valores indicativos em Kz — editáveis no painel)
  function seedCursos() {
    var sede = DEFAULT_UNIDADES[0];
    function c(nome, tipo, dur, periodo, regime, insc, matr, mens, total) {
      return {
        id: MidasData.uid("crs"),
        nome: nome, tipo: tipo, duracao: dur, periodo: periodo, regime: regime,
        valorInscricao: insc, valorMatricula: matr, valorMensalidade: mens,
        valorEstagio: 0, valorDefesa: 0, valorCertificado: 0,
        valorTotal: total, unidade: sede, estado: "ativo"
      };
    }
    var sem = "4 semanas ou 8 sábados";
    return [
      // ===== Cursos Médios (18 meses) — inscrição 10.000 + 12.500/mês =====
      // total = inscrição + (mensalidade × 18)
      c("Curso Médio de Enfermagem", "Médio", "18 meses", "", "", 10000, 0, 12500, 235000),
      c("Curso Médio de Farmácia", "Médio", "18 meses", "", "", 10000, 0, 12500, 235000),
      c("Curso Médio de Análises Clínicas", "Médio", "18 meses", "", "", 10000, 0, 12500, 235000),

      // ===== Intensivos / Imersão — inscrição presencial 17.500 (online 10.000) =====
      c("Técnico de Fisioterapia", "Intensivo", "18 meses", "", "", 17500, 0, 0, 0),
      c("Flebotomia Avançado", "Intensivo", sem, "Fim de Semana", "Sábado", 17500, 0, 0, 35000),
      c("Tratamento de Feridas", "Intensivo", sem, "Fim de Semana", "Sábado", 17500, 0, 0, 35000),
      c("Primeiros Socorros", "Intensivo", sem, "Fim de Semana", "Sábado", 17500, 0, 0, 35000),
      c("Urgência e Emergência", "Intensivo", sem, "Fim de Semana", "Sábado", 17500, 0, 0, 35000),
      c("Recepcionista Hospitalar", "Intensivo", sem, "Fim de Semana", "Sábado", 17500, 0, 0, 35000),
      c("Enfermagem do Trabalho", "Intensivo", sem, "Fim de Semana", "Sábado", 17500, 0, 0, 35000),
      c("Imagiologia (Ultrassonografia)", "Imersão", "6 meses", "", "", 17500, 0, 50000, 317500),
      c("Logística", "Intensivo", sem, "Fim de Semana", "Sábado", 10000, 0, 0, 25000),

      // ===== Técnicos Premium — Saúde & Enfermagem (inscrição 30.000) =====
      c("Bloco 1: Técnica de Enfermagem & Cuidados Diretos", "Premium", "4 meses", "", "", 30000, 0, 0, 0),
      c("Bloco 2: Diagnóstico, Laboratório & Imagiologia", "Premium", "6 meses", "", "", 30000, 0, 0, 0),
      c("Bloco 3: Saúde da Mulher, Criança & Ciclo de Vida", "Premium", "6 meses", "", "", 30000, 0, 0, 0),
      c("Bloco 4: Reabilitação & Funcionalidade", "Premium", "6 meses", "", "", 30000, 0, 0, 0),
      c("Bloco 5: Gestão, Administração & Poder em Saúde", "Premium", "6 meses", "", "", 30000, 0, 0, 0),
      c("Bloco 6: Marketing, Tecnologia & Futuro da Saúde", "Premium", "6 meses", "", "", 30000, 0, 0, 0),
      c("Bloco 7: Ecografia Obstétrica, Ginecológica & Doppler", "Premium", "6 meses", "", "", 30000, 0, 0, 0),
      c("Bloco 8: Fisioterapia Neurológica & Reabilitação Funcional", "Premium", "6 meses", "", "", 30000, 0, 0, 0),

      // ===== Premium — Estética & Beleza (inscrição 30.000) =====
      c("Bloco B1: Estética Facial & Dermocosmética", "Premium", "4 meses", "", "", 30000, 0, 0, 0),
      c("Bloco B2: Estética Corporal & Modelagem", "Premium", "4 meses", "", "", 30000, 0, 0, 0),
      c("Bloco B3: Massagem Terapêutica, Relaxante & Bem-Estar", "Premium", "4 meses", "", "", 30000, 0, 0, 0),
      c("Bloco B4: Estética Avançada & Procedimentos Não Invasivos", "Premium", "6 meses", "", "", 30000, 0, 0, 0),
      c("Bloco B5: Depilação Profissional & Design Corporal", "Premium", "4 meses", "", "", 30000, 0, 0, 0),
      c("Bloco B6: Maquiagem Profissional & Imagem Pessoal", "Premium", "4 meses", "", "", 30000, 0, 0, 0),
      c("Bloco B7: Estética Capilar & Terapias do Couro Cabeludo", "Premium", "4 meses", "", "", 30000, 0, 0, 0),
      c("Bloco B8: Unhas de Gel, Acrílico & Nail Art", "Premium", "4 meses", "", "", 30000, 0, 0, 0),

      // ===== Premium — Medicina Natural (inscrição 30.000) =====
      c("Bloco MN1: Emagrecimento Saudável & Controlo de Peso", "Premium", "4 meses", "", "", 30000, 0, 0, 0),
      c("Bloco MN2: Desintoxicação Natural & Limpeza do Organismo", "Premium", "4 meses", "", "", 30000, 0, 0, 0),
      c("Bloco MN3: Fitoterapia & Plantas Medicinais", "Premium", "4 meses", "", "", 30000, 0, 0, 0)
    ];
  }

  function defaultDB() {
    return {
      settings: {
        instituicao: "Grupo Midas Angola",
        sistema: "MIDAS2026",
        slogan: "Do Zero ao Emprego",
        moeda: "Kz",
        nif: "",
        endereco: "Luanda, Angola",
        telefone: "",
        whatsapp: "",
        email: "",
        website: "",
        secretaria: "",
        diretora: "",
        directorGeral: "",
        logoPrincipal: "",
        logoImpressao: "",
        tema: "Verde Midas",
        modo: "dia",
        corPrincipal: "",
        corSecundaria: "",
        corBotao: "",
        casasDecimais: 2,
        anoLetivo: "2026",
        anoLectivo: "2025/2026",
        prefixoMatricula: "MIDAS",
        digitosMatricula: 6,
        prefixoRecibo: "REC",
        digitosRecibo: 6,
        seqMatricula: 1,
        seqRecibo: 1,
        catalogoVersao: CATALOG_VERSION
      },
      auth: {
        enabled: true,
        user: "secretaria",
        nome: "Secretaria",
        // Palavra-passe inicial: midas2026 (deve ser alterada em Configurações → Conta)
        passHash: MidasData.hash("midas2026"),
        precisaTrocar: true
      },
      periodos: DEFAULT_PERIODOS.slice(),
      regimes: DEFAULT_REGIMES.slice(),
      tiposCurso: DEFAULT_TIPOS.slice(),
      unidades: DEFAULT_UNIDADES.slice(),
      emolumentos: [],
      formasPagamento: DEFAULT_FORMAS.slice(),
      funcionarios: DEFAULT_FUNCIONARIOS.slice(),
      cursos: [],
      estudantes: [],
      pagamentos: [],
      fechos: [],
      estagios: [],
      leads: [],
      lixo: []
    };
  }

  // ---- Core store ----------------------------------------------------------
  // Data LOCAL (Angola, UTC+1) em YYYY-MM-DD — evita o recuo de 1 dia do
  // toISOString() (UTC) em datas à meia-noite.
  function ymdLocal(d) {
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function nowLocalISO() {
    var d = new Date();
    return ymdLocal(d) + "T" + d.toTimeString().slice(0, 8);
  }
  // Dia LOCAL (YYYY-MM-DD) de uma data/timestamp. Converte timestamps antigos em
  // UTC ('…Z') para o dia local de Angola — evita que um pagamento perto da
  // meia-noite caia no dia errado e bloqueie o fecho de caixa.
  function diaLocal(s) {
    s = String(s || "");
    if (s.length <= 10) return s.slice(0, 10); // já é YYYY-MM-DD
    var d = new Date(s);
    return isNaN(d) ? s.slice(0, 10) : ymdLocal(d);
  }
  // Soma n meses a uma data sem "transbordar": 31/01 + 1 mês = 28/02 (não 03/03).
  function addMeses(base, n) {
    var d = new Date(base.getFullYear(), base.getMonth() + n, 1);
    var diaMax = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(base.getDate(), diaMax));
    return d;
  }

  var _db = null;
  // Modo protegido: ativado quando a leitura do localStorage falha tendo dados
  // presentes (ex.: JSON truncado por quota). Bloqueia save() para NÃO destruir
  // dados possivelmente recuperáveis. Só sai com um reload depois de resolvido.
  var _protegido = false;

  var MidasData = {
    uid: function (prefix) {
      return (prefix || "id") + "_" + Date.now().toString(36) +
        Math.random().toString(36).slice(2, 7);
    },

    // Hash simples (ofuscação) para a palavra-passe. Nota: login do lado do
    // cliente — protege contra acesso casual, não substitui autenticação real.
    hash: function (str) {
      var h = 5381;
      str = String(str);
      for (var i = 0; i < str.length; i++) {
        h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
      }
      return "h" + h.toString(36);
    },

    // ---- Auth --------------------------------------------------------------
    auth: function () { return this.load().auth; },
    verificarLogin: function (user, pass) {
      var a = this.load().auth;
      return user === a.user && this.hash(pass) === a.passHash;
    },
    definirCredenciais: function (user, nome, novaPass) {
      var a = this.load().auth;
      if (user) a.user = user;
      if (nome != null) a.nome = nome;
      if (novaPass) { a.passHash = this.hash(novaPass); a.precisaTrocar = false; }
      this.save();
      return a;
    },

    load: function () {
      if (_db) return _db;
      var raw = null;
      try { raw = window.localStorage.getItem(STORAGE_KEY); } catch (e) { raw = null; }
      if (raw) {
        try {
          _db = JSON.parse(raw);
          // versão do catálogo ANTES do forward-compat (que preencheria a chave)
          var prevCatalogo = (_db.settings && _db.settings.catalogoVersao) || 0;
          // forward-compat: ensure new keys exist
          var def = defaultDB();
          for (var k in def) { if (!(k in _db)) _db[k] = def[k]; }
          for (var s in def.settings) { if (!(s in _db.settings)) _db.settings[s] = def.settings[s]; }
          // migração não destrutiva: garante a forma de pagamento Multicaixa Express
          if (_db.formasPagamento && _db.formasPagamento.indexOf("Multicaixa Express") < 0) {
            _db.formasPagamento.push("Multicaixa Express");
          }
          // migração: emolumentos passam a objetos completos (categoria, valor, estado…)
          if (!_db.emolumentos || !_db.emolumentos.length) {
            _db.emolumentos = seedEmolumentos();
          } else {
            _db.emolumentos = _db.emolumentos.map(function (e) {
              if (typeof e === "string") {
                return { id: MidasData.uid("emo"), nome: e, categoria: e, valor: 0, curso: "", tipoCurso: "", unidade: "", estado: "ativo", observacoes: "" };
              }
              return {
                id: e.id || MidasData.uid("emo"),
                nome: e.nome || e.categoria || "Emolumento",
                categoria: e.categoria || e.nome || "Outros",
                valor: Number(e.valor) || 0,
                curso: e.curso || "", tipoCurso: e.tipoCurso || "", unidade: e.unidade || "",
                estado: e.estado || "ativo", observacoes: e.observacoes || ""
              };
            });
          }
          if (!_db.lixo) _db.lixo = [];
          // atualiza o catálogo oficial de cursos (preserva estudantes e pagamentos)
          if (prevCatalogo < CATALOG_VERSION) {
            _db.cursos = seedCursos();
            _db.settings.catalogoVersao = CATALOG_VERSION;
            // garante que os tipos de curso novos existem na lista
            DEFAULT_TIPOS.forEach(function (t) {
              if (_db.tiposCurso && _db.tiposCurso.indexOf(t) < 0) _db.tiposCurso.push(t);
            });
            this.save();
          }
          return _db;
        } catch (e) {
          // Dados EXISTEM mas não puderam ser lidos (ex.: JSON truncado por
          // quota). NÃO sobrescrever — podem ser recuperáveis. Trabalha em
          // memória SEM persistir (modo protegido) e avisa de forma destacada.
          console.error("Dados guardados ilegíveis — proteção contra perda ativada.", e);
          _db = defaultDB();
          _db.cursos = seedCursos();
          _db.emolumentos = seedEmolumentos();
          _protegido = true;
          if (window.C && C.toast) {
            C.toast("Não foi possível ler os dados guardados. Eles NÃO foram apagados. Faça uma cópia de segurança e contacte o suporte antes de continuar.", "err");
          }
          return _db;
        }
      }
      // Sem dados guardados (primeira utilização real): semear e gravar.
      _db = defaultDB();
      _db.cursos = seedCursos();
      _db.emolumentos = seedEmolumentos();
      this.save();
      return _db;
    },

    save: function () {
      if (_protegido) {
        // Cache em estado suspeito após leitura falhada: não gravar por cima
        // do localStorage para não destruir dados possivelmente recuperáveis.
        if (window.console) console.warn("Gravação local bloqueada (modo protegido).");
        return;
      }
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(_db));
      } catch (e) {
        // Ex.: QuotaExceededError. Os dados continuam em memória e (em modo
        // Supabase) são gravados no servidor; só a cache local falhou.
        if (window.console) console.error("Falha ao gravar cache local:", e);
        if (window.C && C.toast) C.toast("Aviso: a cache local está cheia. Os dados foram guardados no servidor, mas faça uma cópia de segurança.", "err");
      }
    },

    db: function () { return this.load(); },

    // Verdadeiro quando a cache local entrou em modo protegido (leitura falhada):
    // a camada Supabase usa isto para NÃO espelhar a cache (sementes) por cima
    // dos dados bons do servidor.
    estaProtegido: function () { return _protegido; },

    reset: function () {
      _db = defaultDB();
      _db.cursos = seedCursos();
      _db.emolumentos = seedEmolumentos();
      this.save();
      return _db;
    },

    export: function () { return JSON.stringify(this.load(), null, 2); },

    import: function (json) {
      var data = JSON.parse(json);
      _db = data; this.save(); return _db;
    },

    // ---- Sequence helpers (prefixo/dígitos configuráveis) ------------------
    _fmtNum: function (prefixo, n, digitos) {
      var s = this.load().settings;
      return (prefixo || "MIDAS") + "-" + s.anoLetivo + "-" + String(n).padStart(digitos || 4, "0");
    },
    nextMatricula: function () {
      var db = this.load();
      var n = db.settings.seqMatricula++;
      this.save();
      return this._fmtNum(db.settings.prefixoMatricula, n, db.settings.digitosMatricula);
    },
    peekMatricula: function () {
      var db = this.load();
      return this._fmtNum(db.settings.prefixoMatricula, db.settings.seqMatricula, db.settings.digitosMatricula);
    },
    nextRecibo: function () {
      var db = this.load();
      var n = db.settings.seqRecibo++;
      this.save();
      return this._fmtNum(db.settings.prefixoRecibo, n, db.settings.digitosRecibo);
    },
    peekRecibo: function () {
      var db = this.load();
      return this._fmtNum(db.settings.prefixoRecibo, db.settings.seqRecibo, db.settings.digitosRecibo);
    },

    // Alocação de número (assíncrona). No backend Supabase é substituída por um
    // contador atómico (RPC) que evita números repetidos entre dispositivos.
    alocarMatricula: function () { return Promise.resolve(this.nextMatricula()); },
    alocarRecibo: function () { return Promise.resolve(this.nextRecibo()); },

    // ---- Emolumentos (cadastro com valor, categoria, curso/unidade…) -------
    categoriasEmolumento: function () { return CATEGORIAS_EMOLUMENTO.slice(); },
    emolumentos: function () { return this.load().emolumentos; },
    emolumentosAtivos: function () {
      return this.load().emolumentos.filter(function (e) { return e.estado === "ativo"; });
    },
    emolumentoById: function (id) {
      return this.load().emolumentos.filter(function (e) { return e.id === id; })[0];
    },
    emolumentoValor: function (id) {
      var e = this.emolumentoById(id);
      return e ? (Number(e.valor) || 0) : 0;
    },
    // Primeiro emolumento ativo de uma categoria (para pré-seleção)
    emolumentoPadrao: function (categoria) {
      var e = this.emolumentosAtivos().filter(function (x) { return x.categoria === categoria; })[0];
      return e ? e.id : (this.emolumentosAtivos()[0] ? this.emolumentosAtivos()[0].id : "");
    },
    saveEmolumento: function (emo) {
      var db = this.load();
      var nome = (emo.nome || "").trim();
      if (!nome) return { error: "Indique o nome do emolumento." };
      // impede duplicação: mesmo nome + curso + unidade
      var dup = db.emolumentos.filter(function (e) {
        return e.id !== emo.id &&
          e.nome.toLowerCase() === nome.toLowerCase() &&
          (e.curso || "") === (emo.curso || "") &&
          (e.unidade || "") === (emo.unidade || "");
      })[0];
      if (dup) return { error: "Já existe este emolumento para o mesmo curso e unidade." };
      var rec = {
        id: emo.id || this.uid("emo"),
        nome: nome, categoria: emo.categoria || "Outros", valor: Number(emo.valor) || 0,
        curso: emo.curso || "", tipoCurso: emo.tipoCurso || "", unidade: emo.unidade || "",
        estado: emo.estado || "ativo", observacoes: emo.observacoes || ""
      };
      if (emo.id) {
        for (var i = 0; i < db.emolumentos.length; i++) {
          if (db.emolumentos[i].id === emo.id) { db.emolumentos[i] = rec; this.save(); return { emolumento: rec }; }
        }
      }
      db.emolumentos.push(rec); this.save(); return { emolumento: rec };
    },
    toggleEmolumento: function (id) {
      var e = this.emolumentoById(id);
      if (e) { e.estado = e.estado === "ativo" ? "inativo" : "ativo"; this.save(); }
      return e;
    },
    deleteEmolumento: function (id) {
      var db = this.load();
      db.emolumentos = db.emolumentos.filter(function (e) { return e.id !== id; });
      this.save();
    },

    // ---- Reciclagem (recuperação de eliminados) ----------------------------
    lixo: function () { return this.load().lixo || []; },
    _paraLixo: function (tipo, registo) {
      var db = this.load();
      if (!db.lixo) db.lixo = [];
      var item = { id: this.uid("lix"), tipo: tipo, registo: registo, eliminadoEm: this.now() };
      db.lixo.unshift(item);
      if (db.lixo.length > 200) db.lixo = db.lixo.slice(0, 200);
      return item;
    },
    restaurarLixo: function (lixoId) {
      var db = this.load();
      var item = (db.lixo || []).filter(function (x) { return x.id === lixoId; })[0];
      if (!item) return false;
      if (item.tipo === "estudante") db.estudantes.push(item.registo);
      else if (item.tipo === "pagamento") db.pagamentos.push(item.registo);
      db.lixo = db.lixo.filter(function (x) { return x.id !== lixoId; });
      this.save();
      return true;
    },
    esvaziarLixo: function () { var db = this.load(); db.lixo = []; this.save(); },
    now: function () { return nowLocalISO(); },

    // ---- Cursos ------------------------------------------------------------
    cursos: function () { return this.load().cursos; },
    // Cursos ordenados com prioridade institucional: Enfermagem, Farmácia,
    // Análises Clínicas no topo; depois os restantes por ordem alfabética.
    cursosOrdenados: function () {
      var exact = {
        "curso médio de enfermagem": 0,
        "curso médio de farmácia": 1,
        "curso médio de análises clínicas": 2
      };
      var prio = function (nome) {
        var n = (nome || "").toLowerCase();
        if (exact[n] !== undefined) return exact[n];
        if (n.indexOf("enfermagem") >= 0) return 3;
        if (n.indexOf("farm") >= 0) return 4;
        if (n.indexOf("anális") >= 0 || n.indexOf("analis") >= 0) return 5;
        return 9;
      };
      return this.cursos().slice().sort(function (a, b) {
        var pa = prio(a.nome), pb = prio(b.nome);
        if (pa !== pb) return pa - pb;
        return a.nome < b.nome ? -1 : 1;
      });
    },
    cursoById: function (id) { return this.load().cursos.filter(function (c) { return c.id === id; })[0]; },
    cursoByNome: function (nome) { return this.load().cursos.filter(function (c) { return c.nome === nome; })[0]; },
    // true quando o estudante referencia um curso que já não existe (eliminado/renomeado)
    cursoEmFalta: function (est) { return !!(est && est.curso && !this.cursoByNome(est.curso)); },
    saveCurso: function (curso) {
      var db = this.load();
      if (curso.id) {
        for (var i = 0; i < db.cursos.length; i++) {
          if (db.cursos[i].id === curso.id) { db.cursos[i] = curso; this.save(); return curso; }
        }
      }
      curso.id = this.uid("crs");
      db.cursos.push(curso); this.save(); return curso;
    },
    // Conta quantos estudantes/pagamentos referenciam um curso por nome (para
    // avisar antes de renomear).
    contarReferenciasCurso: function (nome) {
      var db = this.load();
      var e = db.estudantes.filter(function (x) { return x.curso === nome; }).length;
      var p = db.pagamentos.filter(function (x) { return x.curso === nome; }).length;
      return { estudantes: e, pagamentos: p };
    },
    // Migra as referências de curso por NOME (estudantes/pagamentos) de 'antigo'
    // para 'novo' — senão a dívida desses estudantes "desaparecia" porque
    // cursoByNome deixava de encontrar o curso. Usa os save* para espelhar.
    migrarReferenciasCurso: function (antigo, novo) {
      var self = this, db = this.load();
      if (!antigo || !novo || antigo === novo) return 0;
      var n = 0;
      db.estudantes.slice().forEach(function (e) {
        if (e.curso === antigo) { e.curso = novo; self.saveEstudante(e); n++; }
      });
      db.pagamentos.slice().forEach(function (p) {
        if (p.curso === antigo) { p.curso = novo; self.savePagamento(p); n++; }
      });
      return n;
    },
    deleteCurso: function (id) {
      var db = this.load();
      db.cursos = db.cursos.filter(function (c) { return c.id !== id; });
      this.save();
    },
    // Repõe o catálogo oficial de cursos (preserva estudantes e pagamentos)
    reporCatalogo: function () {
      var db = this.load();
      db.cursos = seedCursos();
      db.settings.catalogoVersao = CATALOG_VERSION;
      this.save();
      return db.cursos;
    },

    // ---- Estudantes --------------------------------------------------------
    estudantes: function () { return this.load().estudantes; },
    estudanteById: function (id) { return this.load().estudantes.filter(function (e) { return e.id === id; })[0]; },

    // Consulta paginada de estudantes (versão local — também serve de fallback
    // offline da versão Supabase). Devolve sempre uma Promise para uma API única
    // entre modo local e modo servidor.
    // opts: { busca, curso, estado, ordenar:'recente'|'nome', pagina, porPagina }
    queryEstudantes: function (opts) {
      opts = opts || {};
      var self = this;
      // Normaliza igual à pesquisa inteligente (ignora acentos): "joao" encontra "João".
      var q = this._normNome(opts.busca || "");
      var fc = opts.curso || "", fe = opts.estado || "";
      var lista = this.estudantes().filter(function (e) {
        if (fc && e.curso !== fc) return false;
        if (fe && e.estado !== fe) return false;
        if (q) {
          var hay = self._normNome((e.nome || "") + " " + (e.contacto || "") + " " + (e.matricula || "") + " " + (e.curso || "") + " " + (e.bi || ""));
          if (hay.indexOf(q) < 0) return false;
        }
        return true;
      });
      if (opts.ordenar === "nome") lista.sort(function (a, b) { return (a.nome || "") < (b.nome || "") ? -1 : 1; });
      else lista.sort(function (a, b) { return (a.dataMatricula || "") < (b.dataMatricula || "") ? 1 : -1; }); // recente primeiro
      var total = lista.length;
      var pp = Math.max(1, opts.porPagina || 50);
      var nPaginas = Math.max(1, Math.ceil(total / pp));
      var pag = Math.min(nPaginas, Math.max(1, opts.pagina || 1));
      var ini = (pag - 1) * pp;
      return Promise.resolve({ rows: lista.slice(ini, ini + pp), total: total, pagina: pag, porPagina: pp, nPaginas: nPaginas, servidor: false });
    },
    saveEstudante: function (est) {
      var db = this.load();
      if (est.id) {
        for (var i = 0; i < db.estudantes.length; i++) {
          if (db.estudantes[i].id === est.id) { db.estudantes[i] = est; this.save(); return est; }
        }
      }
      est.id = this.uid("est");
      db.estudantes.push(est); this.save(); return est;
    },
    deleteEstudante: function (id) {
      var db = this.load();
      var rec = this.estudanteById(id);
      var lx = rec ? this._paraLixo("estudante", rec) : null;
      db.estudantes = db.estudantes.filter(function (e) { return e.id !== id; });
      this.save();
      return lx; // item de lixo criado (para a camada Supabase espelhar na tabela)
    },

    // ---- Pagamentos / Recibos ---------------------------------------------
    pagamentos: function () { return this.load().pagamentos; },
    pagamentoById: function (id) { return this.load().pagamentos.filter(function (p) { return p.id === id; })[0]; },
    pagamentosDeEstudante: function (estId) {
      return this.load().pagamentos.filter(function (p) { return p.estudanteId === estId; });
    },
    savePagamento: function (pag) {
      var db = this.load();
      if (pag.id) {
        for (var i = 0; i < db.pagamentos.length; i++) {
          if (db.pagamentos[i].id === pag.id) { db.pagamentos[i] = pag; this.save(); return pag; }
        }
      }
      pag.id = this.uid("pag");
      db.pagamentos.push(pag); this.save(); return pag;
    },
    deletePagamento: function (id) {
      var db = this.load();
      var rec = this.pagamentoById(id);
      var lx = rec ? this._paraLixo("pagamento", rec) : null;
      db.pagamentos = db.pagamentos.filter(function (p) { return p.id !== id; });
      this.save();
      return lx;
    },

    // ---- Fecho de caixa ----------------------------------------------------
    fechos: function () { return this.load().fechos || []; },
    fechoById: function (id) { return (this.load().fechos || []).filter(function (f) { return f.id === id; })[0]; },
    // Pagamentos de um dia (YYYY-MM-DD), opcionalmente de um funcionário
    pagamentosDoDia: function (ymd, funcionario) {
      return this.load().pagamentos.filter(function (p) {
        if (diaLocal(p.data) !== ymd) return false;
        if (funcionario && p.funcionario !== funcionario) return false;
        return true;
      });
    },
    saveFecho: function (fecho) {
      var db = this.load();
      if (!db.fechos) db.fechos = [];
      if (fecho.id) {
        for (var i = 0; i < db.fechos.length; i++) {
          if (db.fechos[i].id === fecho.id) { db.fechos[i] = fecho; this.save(); return fecho; }
        }
      }
      fecho.id = this.uid("fec");
      db.fechos.push(fecho); this.save(); return fecho;
    },
    deleteFecho: function (id) {
      var db = this.load();
      db.fechos = (db.fechos || []).filter(function (f) { return f.id !== id; });
      this.save();
    },
    // Um dia (YYYY-MM-DD) considera-se fechado se houver um fecho "Todos" (ou
    // sem funcionário) gravado para essa data.
    caixaDiaFechado: function (ymd) {
      return (this.load().fechos || []).some(function (f) {
        return diaLocal(f.data) === ymd && (!f.funcionario || f.funcionario === "Todos");
      });
    },
    // O dia (local) de uma data/timestamp já tem fecho "Todos"?
    diaFechadoPara: function (data) { return this.caixaDiaFechado(diaLocal(data)); },
    // Devolve o dia MAIS ANTIGO (anterior a hoje) que teve movimentos mas ainda
    // não foi fechado — ou null se estiver tudo em ordem. Usado para bloquear
    // novos movimentos enquanto o caixa do(s) dia(s) anterior(es) não fechar.
    caixaBloqueado: function () {
      var hoje = ymdLocal(new Date());
      var dias = {};
      this.load().pagamentos.forEach(function (p) {
        var d = diaLocal(p.data);
        if (d && d < hoje) dias[d] = true;
      });
      var self = this;
      var abertos = Object.keys(dias).filter(function (d) { return !self.caixaDiaFechado(d); }).sort();
      return abertos.length ? abertos[0] : null;
    },

    // ---- Estágios ----------------------------------------------------------
    estagios: function () { return this.load().estagios || []; },
    estagioById: function (id) { return (this.load().estagios || []).filter(function (e) { return e.id === id; })[0]; },
    estagiosDeEstudante: function (estId) { return (this.load().estagios || []).filter(function (e) { return e.estudanteId === estId; }); },
    saveEstagio: function (est) {
      var db = this.load();
      if (!db.estagios) db.estagios = [];
      if (est.id) {
        for (var i = 0; i < db.estagios.length; i++) {
          if (db.estagios[i].id === est.id) { db.estagios[i] = est; this.save(); return est; }
        }
      }
      est.id = this.uid("est_g");
      db.estagios.push(est); this.save(); return est;
    },
    deleteEstagio: function (id) {
      var db = this.load();
      db.estagios = (db.estagios || []).filter(function (e) { return e.id !== id; });
      this.save();
    },

    // ---- Aptidão para a defesa --------------------------------------------
    // Catálogo de critérios possíveis para a Aptidão à Defesa (configuráveis).
    // tipo: "propinas" (saldo<=0), "estagio" (curricular concluído) ou "emol"
    // (existe pagamento cuja categoria/emolumento contém "frag", já normalizado).
    // frags: lista de fragmentos (já normalizados, sem acentos/minúsculas) que,
    // se encontrados no nome/categoria de um pagamento, satisfazem o critério.
    _CRITERIOS_APTIDAO: [
      { id: "propinas", nome: "Propinas regularizadas", tipo: "propinas" },
      { id: "estagio_concl", nome: "Estágio curricular concluído", tipo: "estagio" },
      { id: "estagio_pago", nome: "Estágio pago", tipo: "emol", frags: ["estagio"] },
      { id: "exame", nome: "Exame prático pago", tipo: "emol", frags: ["exame"] },
      { id: "tunica", nome: "Túnica paga", tipo: "emol", frags: ["tunica"] },
      { id: "defesa", nome: "Emolumentos da defesa pagos", tipo: "emol", frags: ["emolumentos da defesa"] },
      { id: "juri", nome: "Mesa do júri paga", tipo: "emol", frags: ["juri", "jurado"] },
      { id: "sala", nome: "Sala da defesa paga", tipo: "emol", frags: ["sala da defesa", "sala de defesa"] },
      { id: "orientacao", nome: "Orientação paga", tipo: "emol", frags: ["orientacao"] },
      { id: "declaracao", nome: "Declaração paga", tipo: "emol", frags: ["declara"] },
      { id: "termo", nome: "Termo de frequência pago", tipo: "emol", frags: ["termo"] },
      { id: "cert_fim", nome: "Certificado de fim do curso pago", tipo: "emol", frags: ["certificado de fim"] },
      { id: "cert_part", nome: "Certificado de participação pago", tipo: "emol", frags: ["participa"] }
    ],
    // Critérios ativos (settings.criteriosAptidao = lista de ids). Sem definição
    // => todos ativos (predefinição).
    criteriosAptidaoAtivos: function () {
      var ids = this.load().settings.criteriosAptidao;
      var cat = this._CRITERIOS_APTIDAO;
      if (!Array.isArray(ids)) return cat.slice();
      return cat.filter(function (c) { return ids.indexOf(c.id) >= 0; });
    },
    aptidaoDefesa: function (est) {
      var self = this;
      if (!est) return { apto: false, criterios: [], motivos: ["Estudante inválido"] };
      var pags = this.pagamentosDeEstudante(est.id);
      // Procura, em qualquer pagamento (incl. itens de recibos multi-emolumento),
      // algum dos fragmentos do critério. Ignora acentos e maiúsculas.
      var temAlgum = function (frags) {
        return pags.some(function (p) {
          var textos = [self._normNome((p.categoria || "") + " " + (p.emolumento || ""))];
          if (p.itens && p.itens.length) p.itens.forEach(function (it) {
            textos.push(self._normNome((it.categoria || "") + " " + (it.emolumento || "")));
          });
          return frags.some(function (f) { return textos.some(function (t) { return t.indexOf(f) >= 0; }); });
        });
      };
      // C8: total pago numa categoria (rateia recibos multi-emolumento).
      var pagoCategoria = function (frags) {
        var tot = 0;
        pags.forEach(function (p) {
          if (p.itens && p.itens.length) {
            p.itens.forEach(function (it) {
              if (frags.some(function (f) { return self._normNome((it.categoria || "") + " " + (it.emolumento || "")).indexOf(f) >= 0; })) tot += Number(it.valorPago) || 0;
            });
          } else if (frags.some(function (f) { return self._normNome((p.categoria || "") + " " + (p.emolumento || "")).indexOf(f) >= 0; })) {
            tot += Number(p.valorPago) || 0;
          }
        });
        return tot;
      };
      // Valor configurado esperado para a categoria (maior emolumento que casa).
      var emols = this.load().emolumentos || [];
      var valorEsperado = function (frags) {
        var max = 0;
        emols.forEach(function (em) {
          var t = self._normNome((em.categoria || "") + " " + (em.nome || ""));
          if (frags.some(function (f) { return t.indexOf(f) >= 0; })) max = Math.max(max, Number(em.valor) || 0);
        });
        return max;
      };
      var estagioConcluido = this.estagiosDeEstudante(est.id).some(function (e) {
        return self._normNome(e.tipo).indexOf("curricular") >= 0 && self._normNome(e.estado).indexOf("conclu") >= 0;
      });
      var crit = this.criteriosAptidaoAtivos().map(function (c) {
        var ok;
        if (c.tipo === "propinas") ok = self.saldoDevedor(est) <= 0;
        else if (c.tipo === "estagio") ok = estagioConcluido;
        else {
          var fr = c.frags || [c.frag];
          var esp = valorEsperado(fr);
          // Se há valor configurado, exige o montante pago >= esperado; senão,
          // basta existir um pagamento dessa categoria (retrocompatível).
          ok = esp > 0 ? (pagoCategoria(fr) >= esp - 0.005) : temAlgum(fr);
        }
        return { id: c.id, nome: c.nome, ok: ok };
      });
      var motivos = crit.filter(function (c) { return !c.ok; }).map(function (c) { return c.nome; });
      return { apto: motivos.length === 0, criterios: crit, motivos: motivos };
    },

    // ---- Mapa de propinas / carnê -----------------------------------------
    _mesesDuracao: function (duracao) {
      var m = String(duracao || "").match(/(\d+)\s*m[eê]s/i); // "12 meses", "1 mês"
      return m ? parseInt(m[1], 10) : 0;
    },
    mapaPropinas: function (est) {
      var self = this;
      var itens = [];
      var pago0 = est ? this.totalPagoEstudante(est.id) : 0;
      var curso = est && est.curso ? this.cursoByNome(est.curso) : null;
      if (!est || !curso) return { itens: itens, totalPrevisto: 0, totalPago: pago0, totalDivida: 0 };
      var pags = this.pagamentosDeEstudante(est.id);
      // Soma por categoria. Recibos com VÁRIOS emolumentos guardam o total em
      // p.valorPago e a lista discriminada em p.itens — usa os itens para não
      // creditar o total inteiro a cada categoria (evita dupla contagem).
      var somaCat = function (frag) {
        var total = 0;
        pags.forEach(function (p) {
          if (p.itens && p.itens.length) {
            p.itens.forEach(function (it) {
              if (self._normNome((it.categoria || "") + " " + (it.emolumento || "")).indexOf(frag) >= 0) {
                total += Number(it.valorPago) || 0;
              }
            });
          } else if (self._normNome((p.categoria || "") + " " + (p.emolumento || "")).indexOf(frag) >= 0) {
            total += Number(p.valorPago) || 0;
          }
        });
        return total;
      };
      var hojeYMD = ymdLocal(new Date());
      var push = function (categoria, descricao, previsto, venc) {
        if (!(Number(previsto) > 0)) return;
        itens.push({ categoria: categoria, descricao: descricao, valorPrevisto: Number(previsto) || 0, vencimento: venc || "" });
      };
      push("Inscrição", "Inscrição", curso.valorInscricao);
      push("Matrícula", "Matrícula", curso.valorMatricula);
      var nMeses = this._mesesDuracao(curso.duracao);
      var inicio = est.dataMatricula ? new Date(String(est.dataMatricula).slice(0, 10) + "T00:00:00") : null;
      for (var i = 0; i < nMeses; i++) {
        var venc = "";
        if (inicio && !isNaN(inicio)) { venc = ymdLocal(addMeses(inicio, i)); }
        push("Propina", "Mensalidade " + (i + 1), curso.valorMensalidade, venc);
      }
      push("Estágio", "Estágio", curso.valorEstagio);
      push("Defesa", "Defesa", curso.valorDefesa);
      push("Certificado", "Certificado", curso.valorCertificado);

      var restante = {
        "Inscrição": somaCat("inscri"), "Matrícula": somaCat("matricula"), "Propina": somaCat("propina"),
        "Estágio": somaCat("estagio"), "Defesa": somaCat("defesa"), "Certificado": somaCat("certificado")
      };
      itens.forEach(function (it) {
        var disp = restante[it.categoria] || 0;
        var p = Math.min(disp, it.valorPrevisto);
        it.valorPago = p; restante[it.categoria] = disp - p;
        it.saldo = Math.max(0, it.valorPrevisto - p);
        if (p >= it.valorPrevisto) it.estado = "Pago";
        else if (p > 0) it.estado = "Parcial";
        else if (it.vencimento && it.vencimento < hojeYMD) it.estado = "Atrasado";
        else it.estado = "Em Falta";
      });
      return {
        itens: itens,
        totalPrevisto: itens.reduce(function (s, it) { return s + it.valorPrevisto; }, 0),
        totalPago: itens.reduce(function (s, it) { return s + it.valorPago; }, 0),
        totalDivida: itens.reduce(function (s, it) { return s + it.saldo; }, 0)
      };
    },
    // Separa a dívida de propinas em VENCIDA (já passou o vencimento) e A VENCER,
    // a partir do mapa de propinas — para a vista de cobrança ser acionável.
    resumoCobranca: function (est) {
      var m = this.mapaPropinas(est);
      var hoje = ymdLocal(new Date());
      var venc = 0, fut = 0;
      m.itens.forEach(function (it) {
        var s = Number(it.saldo) || 0;
        if (s <= 0) return;
        if (it.vencimento && it.vencimento < hoje) venc += s; else fut += s;
      });
      // Bolsa/desconto abate primeiro ao vencido e depois ao a-vencer.
      var desc = Number(est && est.desconto) || 0;
      var aV = Math.min(desc, venc); venc -= aV; desc -= aV;
      var aF = Math.min(desc, fut); fut -= aF;
      return { vencido: venc, futuro: fut, total: Math.max(0, m.totalDivida - (Number(est && est.desconto) || 0)), desconto: Number(est && est.desconto) || 0 };
    },

    // ---- Leads (pré-matrícula / funil) ------------------------------------
    leads: function () { return this.load().leads || []; },
    leadById: function (id) { return (this.load().leads || []).filter(function (l) { return l.id === id; })[0]; },
    saveLead: function (lead) {
      var db = this.load();
      if (!db.leads) db.leads = [];
      if (lead.id) {
        for (var i = 0; i < db.leads.length; i++) {
          if (db.leads[i].id === lead.id) { db.leads[i] = lead; this.save(); return lead; }
        }
      }
      lead.id = this.uid("lead");
      db.leads.push(lead); this.save(); return lead;
    },
    deleteLead: function (id) {
      var db = this.load();
      db.leads = (db.leads || []).filter(function (l) { return l.id !== id; });
      this.save();
    },

    // ---- Aggregations ------------------------------------------------------
    // Saldo em dívida de um estudante (valor do curso - total pago)
    // saldoDevedor(est[, idxPago]): se idxPago (mapa estudanteId→totalPago,
    // ver _totalPagoIndex) for fornecido, evita varrer todos os pagamentos por
    // estudante — usado nos cálculos em lote (Turmas).
    saldoDevedor: function (est, idxPago) {
      var curso = est && est.curso ? this.cursoByNome(est.curso) : null;
      var total = curso ? (Number(curso.valorTotal) || 0) : 0;
      if (!total) return 0;
      var pago = idxPago ? (idxPago[est.id] || 0) : this.totalPagoEstudante(est.id);
      var desconto = Number(est && est.desconto) || 0; // bolsa/desconto por estudante
      return Math.max(0, total - desconto - pago);
    },
    // Índice estudanteId → total pago, num único varrimento dos pagamentos.
    // Transforma cálculos O(estudantes × pagamentos) em O(estudantes + pagamentos).
    _totalPagoIndex: function () {
      var idx = {};
      this.load().pagamentos.forEach(function (p) {
        if (!p.estudanteId) return;
        idx[p.estudanteId] = (idx[p.estudanteId] || 0) + (Number(p.valorPago) || 0);
      });
      return idx;
    },
    totalRecebido: function () {
      return this.load().pagamentos.reduce(function (s, p) { return s + (Number(p.valorPago) || 0); }, 0);
    },
    totalPagoEstudante: function (estId) {
      return this.pagamentosDeEstudante(estId).reduce(function (s, p) { return s + (Number(p.valorPago) || 0); }, 0);
    },
    // Último pagamento de um estudante (ou null).
    ultimoPagamentoDe: function (estId) {
      var ps = this.pagamentosDeEstudante(estId);
      if (!ps.length) return null;
      return ps.slice().sort(function (a, b) { return (a.data || "") < (b.data || "") ? 1 : -1; })[0];
    },
    // Ano letivo de um estudante: ano da matrícula (fallback: settings.anoLetivo).
    _anoLectivoDe: function (est) {
      var d = (est && est.dataMatricula ? String(est.dataMatricula) : "").slice(0, 4);
      return d || (this.load().settings.anoLetivo || "");
    },

    // ---- Turmas (visão CALCULADA: curso + período + ano letivo) -------------
    // Não é uma entidade nova; agrupa os estudantes existentes.
    turmas: function () {
      var self = this;
      var grupos = {};
      this.estudantes().forEach(function (e) {
        if (!e.curso) return;
        var per = e.periodo || "—";
        var ano = self._anoLectivoDe(e);
        var key = e.curso + "|" + per + "|" + ano;
        if (!grupos[key]) grupos[key] = { id: key, curso: e.curso, periodo: per, anoLectivo: ano, estudantes: [] };
        grupos[key].estudantes.push(e);
      });
      var idxPago = self._totalPagoIndex();
      var arr = Object.keys(grupos).map(function (k) {
        var g = grupos[k];
        g.total = g.estudantes.length;
        g.comDivida = g.estudantes.filter(function (e) { return self.saldoDevedor(e, idxPago) > 0; }).length;
        g.regularizados = g.total - g.comDivida;
        g.nome = g.curso + " — " + g.periodo + " — " + g.anoLectivo;
        return g;
      });
      arr.sort(function (a, b) { return a.nome < b.nome ? -1 : 1; });
      return arr;
    },
    turmaById: function (id) { return this.turmas().filter(function (t) { return t.id === id; })[0]; },

    // Pesquisa inteligente de estudantes (nome/1º nome/matrícula/contacto/BI).
    pesquisarEstudantes: function (q, limite) {
      var self = this;
      q = this._normNome(q);
      if (!q) return [];
      return this.estudantes().filter(function (e) {
        var hay = self._normNome((e.nome || "") + " " + (e.matricula || "") + " " + (e.contacto || "") + " " + (e.bi || ""));
        return hay.indexOf(q) >= 0;
      }).sort(function (a, b) { return (a.nome || "") < (b.nome || "") ? -1 : 1; }).slice(0, limite || 8);
    },

    // Resolve um texto (nome, "nome · matrícula" ou parcial) para UM estudante.
    // Devolve null quando não há correspondência OU quando é AMBÍGUO (vários com
    // o mesmo nome) — nesse caso o chamador deve pedir desambiguação, para nunca
    // associar um pagamento ao homónimo errado.
    resolverEstudante: function (valor) {
      var norm = this._normNome;
      var v = norm(valor);
      if (!v) return null;
      var ests = this.estudantes();
      var exato = ests.filter(function (x) {
        return norm(x.nome + " · " + x.matricula) === v || norm(x.nome) === v;
      });
      if (exato.length === 1) return exato[0];
      if (exato.length > 1) return null; // ambíguo: não adivinhar o homónimo
      var porMat = ests.filter(function (x) { return x.matricula && v.indexOf(norm(x.matricula)) >= 0; });
      if (porMat.length === 1) return porMat[0];
      var parc = ests.filter(function (x) {
        return norm(x.nome + " · " + x.matricula).indexOf(v) >= 0 || norm(x.nome).indexOf(v) >= 0;
      });
      if (parc.length === 1) return parc[0];
      return null;
    },

    // Possíveis duplicados: estudantes com nome semelhante (ignora maiúsculas/
    // acentos), nome contido, >=2 tokens em comum, ou mesmo contacto/BI.
    _normNome: function (s) {
      return String(s == null ? "" : s).trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
    },
    estudantesSemelhantes: function (nome, contacto, bi) {
      var norm = this._normNome;
      var n = norm(nome);
      if (!n) return [];
      var ct = norm(contacto), b = norm(bi);
      var tokens = n.split(" ").filter(Boolean);
      return this.estudantes().filter(function (e) {
        var en = norm(e.nome);
        if (!en) return false;
        if (en === n) return true;
        if (en.indexOf(n) >= 0 || n.indexOf(en) >= 0) return true;
        if (ct && norm(e.contacto) && norm(e.contacto) === ct) return true;
        if (b && norm(e.bi) && norm(e.bi) === b) return true;
        var et = en.split(" ").filter(Boolean);
        var comuns = tokens.filter(function (t) { return t.length > 1 && et.indexOf(t) >= 0; }).length;
        return comuns >= 2;
      });
    }
  };

  // Expostos para a camada Supabase poder semear uma base vazia
  MidasData._seedCursos = seedCursos;
  MidasData._seedEmolumentos = seedEmolumentos;

  // Boot
  MidasData.load();
  window.MidasData = MidasData;
})(window);
