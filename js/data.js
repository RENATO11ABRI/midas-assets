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
  var DEFAULT_TIPOS = ["Intensivo", "Imersão", "Capacitação"];
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
    return [
      // total = inscrição + matrícula + (mensalidade × nº de meses). Valores indicativos — editáveis no painel.
      c("Técnica de Enfermagem & Cuidados Diretos", "Intensivo", "6 meses", "Manhã", "Dias úteis", 5000, 15000, 25000, 170000),
      c("Diagnóstico, Laboratório & Imagiologia", "Intensivo", "6 meses", "Tarde", "Dias úteis", 5000, 15000, 25000, 170000),
      c("Farmácia", "Intensivo", "6 meses", "Manhã", "Dias úteis", 5000, 15000, 22000, 152000),
      c("Análises Clínicas", "Intensivo", "5 meses", "Tarde", "Dias úteis", 5000, 15000, 22000, 130000),
      c("Flebotomia", "Capacitação", "1 mês", "Fim de Semana", "Sábado", 3000, 7000, 0, 35000),
      c("Recepcionista Hospitalar", "Capacitação", "2 meses", "Noite", "Dias úteis", 3000, 8000, 12000, 35000),
      c("Primeiros Socorros", "Capacitação", "3 semanas", "Fim de Semana", "Sábado e Domingo", 2500, 7000, 0, 30000),
      c("Ecografia Obstétrica, Ginecológica & Doppler", "Imersão", "2 meses", "Noite", "Dias úteis", 8000, 25000, 0, 120000),
      c("Fisioterapia e Reabilitação", "Intensivo", "6 meses", "Manhã", "Dias úteis", 5000, 15000, 25000, 170000),
      c("Nutrição e Dietética", "Intensivo", "5 meses", "Tarde", "Dias úteis", 5000, 15000, 22000, 130000),
      c("Saúde Ambiental", "Intensivo", "5 meses", "Manhã", "Dias úteis", 5000, 15000, 20000, 120000),
      c("Imersão em Urgência e Emergência", "Imersão", "1 mês", "Fim de Semana", "Sábado e Domingo", 6000, 18000, 0, 70000),
      c("Imersão em UTI", "Imersão", "1 mês", "Fim de Semana", "Sábado e Domingo", 6000, 18000, 0, 75000),
      c("Capacitação em Administração de Medicamentos Injetáveis", "Capacitação", "3 semanas", "Noite", "Dias úteis", 3000, 9000, 0, 38000)
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
        anoLetivo: "2026"
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
          // forward-compat: ensure new keys exist
          var def = defaultDB();
          for (var k in def) { if (!(k in _db)) _db[k] = def[k]; }
          for (var s in def.settings) { if (!(s in _db.settings)) _db.settings[s] = def.settings[s]; }
          // migração não destrutiva: garante a forma de pagamento Multicaixa Express
          if (_db.formasPagamento && _db.formasPagamento.indexOf("Multicaixa Express") < 0) {
            _db.formasPagamento.push("Multicaixa Express");
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
      var prio = function (nome) {
        var n = (nome || "").toLowerCase();
        if (n.indexOf("enfermagem") >= 0) return 0;
        if (n.indexOf("farm") >= 0) return 1;
        if (n.indexOf("anális") >= 0 || n.indexOf("analis") >= 0) return 2;
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
