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

test("parseMoeda interpreta formato pt e símbolos", function () {
  assert.strictEqual(U.parseMoeda("1.000,50"), 1000.5);
  assert.strictEqual(U.parseMoeda("Kz 2 500"), 2500);
  assert.strictEqual(U.parseMoeda(""), 0);
  assert.strictEqual(U.parseMoeda(null), 0);
});

test("esc escapa HTML", function () {
  assert.strictEqual(U.esc('<a>&"\''), "&lt;a&gt;&amp;&quot;&#39;");
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
