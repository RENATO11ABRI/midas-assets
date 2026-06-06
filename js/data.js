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
  var DEFAULT_EMOLUMENTOS = [
    "Propina", "Matrícula", "Inscrição", "Estágio Preliminar", "Estágio Curricular",
    "Declaração", "Túnica", "Certificado de Participação", "Certificado de Fim do Curso",
    "Mesa do Júri", "Sala da Defesa", "Emolumentos da Defesa", "Aula prática",
    "Orientação", "Exame prático", "Cartão de estudante", "Fascículo", "Outros"
  ];
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
        sistema: "Turmas Midas 2026",
        slogan: "Do Zero ao Emprego",
        moeda: "Kz",
        nif: "",
        endereco: "Luanda, Angola",
        telefone: "",
        email: "",
        secretaria: "",
        diretora: "",
        seqMatricula: 1,
        seqRecibo: 1,
        anoLetivo: "2026",
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
      emolumentos: DEFAULT_EMOLUMENTOS.slice(),
      formasPagamento: DEFAULT_FORMAS.slice(),
      funcionarios: DEFAULT_FUNCIONARIOS.slice(),
      cursos: [],
      estudantes: [],
      pagamentos: []
    };
  }

  // ---- Core store ----------------------------------------------------------
  var _db = null;

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
      try {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
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
        }
      } catch (e) { console.warn("Falha ao ler dados, a reiniciar.", e); }
      _db = defaultDB();
      _db.cursos = seedCursos();
      this.save();
      return _db;
    },

    save: function () {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(_db));
    },

    db: function () { return this.load(); },

    reset: function () {
      _db = defaultDB();
      _db.cursos = seedCursos();
      this.save();
      return _db;
    },

    export: function () { return JSON.stringify(this.load(), null, 2); },

    import: function (json) {
      var data = JSON.parse(json);
      _db = data; this.save(); return _db;
    },

    // ---- Sequence helpers --------------------------------------------------
    nextMatricula: function () {
      var db = this.load();
      var n = db.settings.seqMatricula++;
      this.save();
      return "MAT-" + db.settings.anoLetivo + "-" + String(n).padStart(4, "0");
    },
    peekMatricula: function () {
      var db = this.load();
      return "MAT-" + db.settings.anoLetivo + "-" + String(db.settings.seqMatricula).padStart(4, "0");
    },
    nextRecibo: function () {
      var db = this.load();
      var n = db.settings.seqRecibo++;
      this.save();
      return "REC-" + db.settings.anoLetivo + "-" + String(n).padStart(5, "0");
    },
    peekRecibo: function () {
      var db = this.load();
      return "REC-" + db.settings.anoLetivo + "-" + String(db.settings.seqRecibo).padStart(5, "0");
    },

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
      db.estudantes = db.estudantes.filter(function (e) { return e.id !== id; });
      this.save();
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
      db.pagamentos = db.pagamentos.filter(function (p) { return p.id !== id; });
      this.save();
    },

    // ---- Aggregations ------------------------------------------------------
    totalRecebido: function () {
      return this.load().pagamentos.reduce(function (s, p) { return s + (Number(p.valorPago) || 0); }, 0);
    },
    totalPagoEstudante: function (estId) {
      return this.pagamentosDeEstudante(estId).reduce(function (s, p) { return s + (Number(p.valorPago) || 0); }, 0);
    }
  };

  // Boot
  MidasData.load();
  window.MidasData = MidasData;
})(window);
