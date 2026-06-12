/* Testes da camada de dados (sem navegador).
   Corre com: node --test  */
"use strict";
const test = require("node:test");
const assert = require("node:assert");

// ---- Stubs do ambiente de navegador ----
global.window = global.window || {};
global.window.localStorage = (function () {
  var s = {};
  return {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(s, k) ? s[k] : null; },
    setItem: function (k, v) { s[k] = String(v); },
    removeItem: function (k) { delete s[k]; },
    clear: function () { s = {}; }
  };
})();

require("../js/data.js");
require("../js/utils.js");
const D = global.window.MidasData;
const U = global.window.U;

test("uid gera identificadores únicos com prefixo", function () {
  const a = D.uid("est"), b = D.uid("est");
  assert.match(a, /^est_/);
  assert.notStrictEqual(a, b);
});

test("_fmtNum formata com prefixo, ano letivo e dígitos", function () {
  const s = D.db().settings;
  s.anoLetivo = "2026";
  assert.strictEqual(D._fmtNum("MIDAS", 7, 6), "MIDAS-2026-000007");
  assert.strictEqual(D._fmtNum("REC", 42, 4), "REC-2026-0042");
});

test("nextMatricula incrementa a sequência", function () {
  const s = D.db().settings;
  s.seqMatricula = 10;
  const a = D.nextMatricula();
  const b = D.nextMatricula();
  assert.notStrictEqual(a, b);
  assert.strictEqual(s.seqMatricula, 12);
});

test("totalPagoEstudante soma só os pagamentos do estudante", function () {
  const db = D.db();
  db.estudantes = [{ id: "e1", nome: "A" }, { id: "e2", nome: "B" }];
  db.pagamentos = [
    { id: "p1", estudanteId: "e1", valorPago: 30000 },
    { id: "p2", estudanteId: "e1", valorPago: 20000 },
    { id: "p3", estudanteId: "e2", valorPago: 5000 }
  ];
  assert.strictEqual(D.totalPagoEstudante("e1"), 50000);
  assert.strictEqual(D.totalPagoEstudante("e2"), 5000);
});

test("saldoDevedor = total do curso menos o pago (0 se sem total)", function () {
  const db = D.db();
  db.cursos = [{ id: "c1", nome: "Curso X", valorTotal: 100000 }, { id: "c2", nome: "Sem Total", valorTotal: 0 }];
  db.estudantes = [{ id: "e1", nome: "A", curso: "Curso X" }, { id: "e2", nome: "B", curso: "Sem Total" }];
  db.pagamentos = [{ id: "p1", estudanteId: "e1", valorPago: 30000 }];
  assert.strictEqual(D.saldoDevedor(db.estudantes[0]), 70000);
  assert.strictEqual(D.saldoDevedor(db.estudantes[1]), 0); // curso sem valor total
});

test("estudantesSemelhantes deteta duplicados (acentos, maiúsculas, contido)", function () {
  const db = D.db();
  db.estudantes = [
    { id: "1", nome: "João Silva", matricula: "M1", contacto: "923000000", bi: "123BI" },
    { id: "2", nome: "Ana Sousa", matricula: "M2", contacto: "924111111" }
  ];
  assert.strictEqual(D.estudantesSemelhantes("joao silva").length, 1);   // acentos/maiúsculas
  assert.strictEqual(D.estudantesSemelhantes("Silva").length, 1);        // nome contido
  assert.strictEqual(D.estudantesSemelhantes("João Pedro Silva").length, 1); // >=2 tokens comuns
  assert.strictEqual(D.estudantesSemelhantes("Carlos Mendes").length, 0); // diferente
  assert.strictEqual(D.estudantesSemelhantes("Outro", "923000000").length, 1); // mesmo contacto
  assert.strictEqual(D.estudantesSemelhantes("Outro", "", "123bi").length, 1);  // mesmo BI
});

test("mapaPropinas gera itens (inscrição + mensalidades) e estados", function () {
  const db = D.db();
  db.cursos = [{ id: "c1", nome: "Curso Z", valorInscricao: 10000, valorMatricula: 0, valorMensalidade: 12500, valorTotal: 235000, duracao: "18 meses", valorEstagio: 0, valorDefesa: 0, valorCertificado: 0 }];
  db.estudantes = [{ id: "e1", nome: "X", curso: "Curso Z", dataMatricula: "2026-01-10" }];
  db.pagamentos = [
    { id: "p1", estudanteId: "e1", categoria: "Inscrição", emolumento: "Inscrição", valorPago: 10000 },
    { id: "p2", estudanteId: "e1", categoria: "Propina", emolumento: "Propina", valorPago: 25000 }
  ];
  const m = D.mapaPropinas(db.estudantes[0]);
  assert.strictEqual(m.itens.length, 19); // 1 inscrição + 18 mensalidades
  assert.strictEqual(m.itens[0].estado, "Pago"); // inscrição
  const pagas = m.itens.filter(function (i) { return i.categoria === "Propina" && i.estado === "Pago"; }).length;
  assert.strictEqual(pagas, 2); // 25000 / 12500
});

test("mapaPropinas não conta em dobro recibos com vários emolumentos (itens)", function () {
  const db = D.db();
  db.cursos = [{ id: "c1", nome: "Curso M", valorInscricao: 10000, valorMatricula: 0, valorMensalidade: 12500, valorTotal: 235000, duracao: "18 meses", valorEstagio: 0, valorDefesa: 0, valorCertificado: 0 }];
  db.estudantes = [{ id: "e1", nome: "X", curso: "Curso M", dataMatricula: "2026-01-10" }];
  db.pagamentos = [{
    id: "p1", estudanteId: "e1", valorPago: 22500, categoria: "Inscrição", emolumento: "Inscrição + Propina",
    itens: [
      { categoria: "Inscrição", emolumento: "Inscrição", valorPago: 10000 },
      { categoria: "Propina", emolumento: "Propina", valorPago: 12500 }
    ]
  }];
  const m = D.mapaPropinas(db.estudantes[0]);
  assert.strictEqual(m.totalPago, 22500); // antes contava 32.500 (10.000 + 22.500)
  const insc = m.itens.filter(function (i) { return i.categoria === "Inscrição"; })[0];
  assert.strictEqual(insc.valorPago, 10000);
  const propPagas = m.itens.filter(function (i) { return i.categoria === "Propina" && i.estado === "Pago"; }).length;
  assert.strictEqual(propPagas, 1); // 12.500 = 1 mensalidade, não 2
});

test("mapaPropinas: vencimento não transborda o mês (31/01 -> 28/02)", function () {
  const db = D.db();
  db.cursos = [{ id: "c1", nome: "Curso V", valorInscricao: 0, valorMatricula: 0, valorMensalidade: 1000, valorTotal: 18000, duracao: "18 meses", valorEstagio: 0, valorDefesa: 0, valorCertificado: 0 }];
  db.estudantes = [{ id: "e1", nome: "Z", curso: "Curso V", dataMatricula: "2026-01-31" }];
  db.pagamentos = [];
  const m = D.mapaPropinas(db.estudantes[0]);
  const m2 = m.itens.filter(function (i) { return i.descricao === "Mensalidade 2"; })[0];
  assert.strictEqual(m2.vencimento, "2026-02-28"); // não "2026-03-03"
});

test("queryEstudantes ignora acentos na busca (joao encontra João)", async function () {
  const db = D.db();
  db.cursos = [];
  db.estudantes = [{ id: "e1", nome: "João Manuel", matricula: "M1", estado: "ativo", dataMatricula: "2026-01-01" }];
  db.pagamentos = [];
  const r = await D.queryEstudantes({ busca: "joao", porPagina: 10 });
  assert.strictEqual(r.total, 1);
});

test("U.hoje/agoraISO usam data LOCAL sem 'Z'", function () {
  const h = U.hoje();
  assert.match(h, /^\d{4}-\d{2}-\d{2}$/);
  const a = U.agoraISO();
  assert.ok(a.indexOf("Z") < 0);         // hora local, sem sufixo UTC
  assert.strictEqual(a.slice(0, 10), h); // começa na data de hoje
});

test("aptidaoDefesa fica Não apto com dívida", function () {
  const db = D.db();
  db.cursos = [{ id: "c1", nome: "C", valorTotal: 100000 }];
  db.estudantes = [{ id: "e1", nome: "Y", curso: "C" }];
  db.pagamentos = [];
  db.estagios = [];
  const r = D.aptidaoDefesa(db.estudantes[0]);
  assert.strictEqual(r.apto, false);
  assert.ok(r.motivos.indexOf("Propinas regularizadas") >= 0);
});

test("_csvCell neutraliza injeção de fórmulas (CSV injection)", function () {
  assert.strictEqual(U._csvCell("=1+1"), "'=1+1");
  assert.strictEqual(U._csvCell("+chamada"), "'+chamada");
  assert.strictEqual(U._csvCell("@x"), "'@x");
  assert.strictEqual(U._csvCell("João"), "João"); // texto normal intacto
});

test("parseCSV remove BOM e deteta delimitador", function () {
  const rows = U.parseCSV("﻿nome;contacto\nMaria;923");
  assert.strictEqual(rows[0][0], "nome"); // sem BOM colado ao 1º cabeçalho
  assert.strictEqual(rows[1][1], "923");
});

test("_mesesDuracao aceita singular/plural e acento", function () {
  assert.strictEqual(D._mesesDuracao("18 meses"), 18);
  assert.strictEqual(D._mesesDuracao("1 mês"), 1);
  assert.strictEqual(D._mesesDuracao("4 semanas"), 0);
});

test("parseMoeda interpreta pt, inglês e simples sem corromper", function () {
  assert.strictEqual(U.parseMoeda("1.000,50"), 1000.5); // pt
  assert.strictEqual(U.parseMoeda("1,000.50"), 1000.5); // inglês
  assert.strictEqual(U.parseMoeda("1500.50"), 1500.5);  // só ponto decimal
  assert.strictEqual(U.parseMoeda("1500,5"), 1500.5);   // só vírgula decimal
  assert.strictEqual(U.parseMoeda("1.000"), 1000);      // ponto = milhares
  assert.strictEqual(U.parseMoeda("1.000.000"), 1000000);
  assert.strictEqual(U.parseMoeda("Kz 2 500"), 2500);
  assert.strictEqual(U.parseMoeda(""), 0);
  assert.strictEqual(U.parseMoeda(null), 0);
});

test("numInput lê campos type=number com ponto decimal (sem milhares)", function () {
  assert.strictEqual(U.numInput("1500.5"), 1500.5);  // antes parseMoeda dava 15005
  assert.strictEqual(U.numInput("12500"), 12500);
  assert.strictEqual(U.numInput(""), 0);
  assert.strictEqual(U.numInput("abc"), 0);
});

test("migrarReferenciasCurso migra estudantes/pagamentos e preserva a dívida", function () {
  const db = D.db();
  db.cursos = [{ id: "c1", nome: "Flebotomia Avançada", valorTotal: 35000 }]; // já renomeado
  db.estudantes = [{ id: "e1", nome: "Ana", curso: "Flebotomia" }];
  db.pagamentos = [{ id: "p1", estudanteId: "e1", curso: "Flebotomia", valorPago: 10000 }];
  const n = D.migrarReferenciasCurso("Flebotomia", "Flebotomia Avançada");
  assert.strictEqual(n, 2); // 1 estudante + 1 pagamento
  assert.strictEqual(db.estudantes[0].curso, "Flebotomia Avançada");
  assert.strictEqual(db.pagamentos[0].curso, "Flebotomia Avançada");
  assert.strictEqual(D.saldoDevedor(db.estudantes[0]), 25000); // dívida sobrevive
});

test("diaFechadoPara: dia com fecho 'Todos' fica fechado (dia local)", function () {
  const db = D.db();
  db.fechos = [{ id: "f1", data: "2026-06-10", funcionario: "Todos" }];
  assert.strictEqual(D.diaFechadoPara("2026-06-10T15:00:00"), true);
  assert.strictEqual(D.diaFechadoPara("2026-06-11T09:00:00"), false);
});

test("esc escapa HTML", function () {
  assert.strictEqual(U.esc('<a>&"\''), "&lt;a&gt;&amp;&quot;&#39;");
});

test("moeda usa sempre Kwanza (Kz), ignorando qualquer símbolo configurado", function () {
  const db = D.db();
  db.settings.moeda = '"><img src=x onerror=alert(1)>'; // símbolo malicioso é ignorado
  db.settings.casasDecimais = 2;
  const s = U.moeda(1500);
  assert.ok(/ Kz$/.test(s), "termina em Kz: " + s);              // sempre Kz
  assert.ok(s.indexOf("<img") < 0 && s.indexOf("onerror") < 0);  // sem injeção
  assert.ok(/^0,00 Kz$|^0\.00 Kz$/.test(U.moeda(0)), U.moeda(0)); // 2 casas decimais
});

test("queryEstudantes filtra, ordena e pagina (versão local)", async function () {
  const db = D.db();
  db.cursos = [];
  db.estudantes = [];
  for (let i = 1; i <= 120; i++) {
    db.estudantes.push({
      id: "e" + i, nome: "Estudante " + i, matricula: "M" + i,
      curso: i % 2 ? "A" : "B", estado: "ativo",
      dataMatricula: "2026-01-" + String((i % 28) + 1).padStart(2, "0")
    });
  }
  db.pagamentos = [];
  const p1 = await D.queryEstudantes({ porPagina: 50, pagina: 1 });
  assert.strictEqual(p1.total, 120);
  assert.strictEqual(p1.rows.length, 50);
  assert.strictEqual(p1.nPaginas, 3);
  const p3 = await D.queryEstudantes({ porPagina: 50, pagina: 3 });
  assert.strictEqual(p3.rows.length, 20);          // última página: 120 - 100
  const fa = await D.queryEstudantes({ curso: "A", porPagina: 1000 });
  assert.strictEqual(fa.total, 60);
  const bus = await D.queryEstudantes({ busca: "M7", porPagina: 1000 });
  assert.ok(bus.total >= 1);
});

test("caixaBloqueado deteta dia anterior com movimentos por fechar", function () {
  const db = D.db();
  db.fechos = [];
  const hoje = new Date().toISOString().slice(0, 10);
  const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  db.pagamentos = [{ id: "p1", valorPago: 1000, data: ontem + "T10:00:00" }];
  assert.strictEqual(D.caixaBloqueado(), ontem);           // ontem por fechar -> bloqueado
  db.fechos = [{ id: "f1", data: ontem, funcionario: "Todos" }];
  assert.strictEqual(D.caixaBloqueado(), null);            // ontem fechado -> ok
  // movimentos só de hoje nunca bloqueiam
  db.fechos = []; db.pagamentos = [{ id: "p2", valorPago: 500, data: hoje + "T09:00:00" }];
  assert.strictEqual(D.caixaBloqueado(), null);
});

test("aptidaoDefesa respeita os critérios configurados", function () {
  const db = D.db();
  db.cursos = [{ id: "c1", nome: "C", valorTotal: 0 }]; // sem total -> saldo 0
  db.estudantes = [{ id: "e1", nome: "Z", curso: "C" }];
  db.pagamentos = []; db.estagios = [];
  db.settings.criteriosAptidao = ["propinas"];          // só propinas
  let r = D.aptidaoDefesa(db.estudantes[0]);
  assert.strictEqual(r.criterios.length, 1);
  assert.strictEqual(r.apto, true);                     // saldo 0 -> apto
  db.settings.criteriosAptidao = ["exame"];             // exige exame (não pago)
  r = D.aptidaoDefesa(db.estudantes[0]);
  assert.strictEqual(r.apto, false);
  delete db.settings.criteriosAptidao;                  // sem config -> todos
  r = D.aptidaoDefesa(db.estudantes[0]);
  assert.ok(r.criterios.length >= 10);
});

test("aptidão: critérios reconhecem variações (júri/jurado, sala da defesa)", function () {
  const db = D.db();
  db.cursos = [{ id: "c1", nome: "C", valorTotal: 0 }];
  db.estudantes = [{ id: "e1", nome: "W", curso: "C" }];
  db.estagios = [];
  db.pagamentos = [
    { id: "p1", estudanteId: "e1", emolumento: "Mesa de Jurados", categoria: "Mesa de Jurados", valorPago: 19999 },
    { id: "p2", estudanteId: "e1", emolumento: "Sala de Defesa", categoria: "Sala de Defesa", valorPago: 10998 }
  ];
  db.settings.criteriosAptidao = ["juri"];
  assert.strictEqual(D.aptidaoDefesa(db.estudantes[0]).apto, true);   // "Mesa de Jurados" conta para júri
  db.settings.criteriosAptidao = ["sala"];
  assert.strictEqual(D.aptidaoDefesa(db.estudantes[0]).apto, true);   // "Sala de Defesa" conta para sala
  db.settings.criteriosAptidao = ["exame"];
  assert.strictEqual(D.aptidaoDefesa(db.estudantes[0]).apto, false);  // exame não pago
});

test("turmas agrupa por curso+período+ano e conta dívidas", function () {
  const db = D.db();
  db.cursos = [{ id: "c1", nome: "Enfermagem", valorTotal: 100000 }];
  db.estudantes = [
    { id: "e1", nome: "Ana", curso: "Enfermagem", periodo: "Manhã", dataMatricula: "2026-02-01" },
    { id: "e2", nome: "Bruno", curso: "Enfermagem", periodo: "Manhã", dataMatricula: "2026-03-01" },
    { id: "e3", nome: "Carlos", curso: "Enfermagem", periodo: "Tarde", dataMatricula: "2026-01-01" }
  ];
  db.pagamentos = [{ id: "p1", estudanteId: "e1", valorPago: 100000 }]; // Ana regularizada
  const ts = D.turmas();
  assert.strictEqual(ts.length, 2);                       // Manhã-2026 e Tarde-2026
  const manha = ts.filter(function (t) { return t.periodo === "Manhã"; })[0];
  assert.strictEqual(manha.total, 2);
  assert.strictEqual(manha.regularizados, 1);
  assert.strictEqual(manha.comDivida, 1);
});

test("pesquisarEstudantes encontra por 1º nome e matrícula", function () {
  const db = D.db();
  db.estudantes = [{ id: "e1", nome: "João Manuel", matricula: "M1", curso: "Enf" }, { id: "e2", nome: "Maria", matricula: "M2" }];
  db.pagamentos = [];
  assert.strictEqual(D.pesquisarEstudantes("joão").length, 1);
  assert.strictEqual(D.pesquisarEstudantes("M2").length, 1);
  assert.strictEqual(D.pesquisarEstudantes("xyz").length, 0);
});

test("resolverEstudante: único resolve; homónimos devolvem null (não adivinha)", function () {
  const db = D.db();
  db.estudantes = [
    { id: "e1", nome: "Ana Maria", matricula: "M1" },
    { id: "e2", nome: "João Silva", matricula: "M2" },
    { id: "e3", nome: "João Silva", matricula: "M3" }
  ];
  db.pagamentos = [];
  assert.strictEqual(D.resolverEstudante("Ana Maria").id, "e1");        // único exato
  assert.strictEqual(D.resolverEstudante("ana maria").id, "e1");        // acentos/maiúsculas
  assert.strictEqual(D.resolverEstudante("João Silva"), null);          // homónimos → null
  assert.strictEqual(D.resolverEstudante("João Silva · M2").id, "e2");  // desambiguado por matrícula
  assert.strictEqual(D.resolverEstudante("inexistente"), null);
});

test("_totalPagoIndex soma por estudante e saldoDevedor usa o índice", function () {
  const db = D.db();
  db.cursos = [{ id: "c1", nome: "Curso X", valorTotal: 100000 }];
  db.estudantes = [{ id: "e1", nome: "Ana", curso: "Curso X" }, { id: "e2", nome: "Bia", curso: "Curso X" }];
  db.pagamentos = [
    { id: "p1", estudanteId: "e1", valorPago: 30000 },
    { id: "p2", estudanteId: "e1", valorPago: 20000 },
    { id: "p3", estudanteId: "e2", valorPago: 100000 },
    { id: "p4", estudanteId: null, valorPago: 999 } // sem estudante: ignorado
  ];
  const idx = D._totalPagoIndex();
  assert.strictEqual(idx.e1, 50000);
  assert.strictEqual(idx.e2, 100000);
  // saldoDevedor com índice == saldoDevedor sem índice (mesmo resultado)
  assert.strictEqual(D.saldoDevedor(db.estudantes[0], idx), D.saldoDevedor(db.estudantes[0]));
  assert.strictEqual(D.saldoDevedor(db.estudantes[0], idx), 50000);
  assert.strictEqual(D.saldoDevedor(db.estudantes[1], idx), 0);
});
