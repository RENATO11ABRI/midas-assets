/* ==========================================================================
   Protótipo Midas 2026 — dados de exemplo + ecrãs + router (vanilla)
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------- ICONES -- */
  var I = {
    dash:'<rect x="3" y="3" width="7" height="9" rx="1.4"/><rect x="14" y="3" width="7" height="5" rx="1.4"/><rect x="14" y="12" width="7" height="9" rx="1.4"/><rect x="3" y="16" width="7" height="5" rx="1.4"/>',
    add:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6" stroke-linecap="round"/>',
    receipt:'<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z"/><path d="M9 8h6M9 12h6" stroke-linecap="round"/>',
    students:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    courses:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    pay:'<rect x="2" y="5" width="20" height="14" rx="2.4"/><path d="M2 10h20" stroke-linecap="round"/>',
    cash:'<rect x="3" y="4" width="18" height="16" rx="2.2"/><path d="M7 4v4h10V4M8 12h2M8 16h2M14 12h2M14 16h2" stroke-linecap="round"/>',
    star:'<path d="M12 2.5l2.6 6.3 6.8.5-5.2 4.4 1.7 6.6L12 17.3 6.1 20.8l1.7-6.6-5.2-4.4 6.8-.5z" stroke-linejoin="round"/>',
    report:'<path d="M3 3v18h18"/><path d="M7 15l4-5 3 3 5-7" stroke-linecap="round" stroke-linejoin="round"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.2A1.7 1.7 0 0 0 6 19.6l-.1.1A2 2 0 1 1 3 16.9l.1-.1A1.7 1.7 0 0 0 1.9 14H1.8a2 2 0 0 1 0-4H2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1A2 2 0 1 1 6 4.2l.1.1A1.7 1.7 0 0 0 8 4.6h.1A1.7 1.7 0 0 0 9.2 3V2.8a2 2 0 0 1 4 0V3a1.7 1.7 0 0 0 2.9 1.2l.1-.1A2 2 0 1 1 19 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1H21a2 2 0 0 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1z"/>',
    up:'<path d="M7 14l5-5 5 5" stroke-linecap="round" stroke-linejoin="round"/>',
    down:'<path d="M7 10l5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3" stroke-linecap="round"/>',
    bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0" stroke-linecap="round"/>',
    moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" stroke-linejoin="round"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke-linecap="round"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round"/>',
    plus:'<path d="M12 5v14M5 12h14" stroke-linecap="round"/>',
    print:'<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>',
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke-linecap="round" stroke-linejoin="round"/>',
    filter:'<path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z" stroke-linejoin="round"/>',
    check:'<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>',
    chevR:'<path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  function svg(p, cls) { return '<svg viewBox="0 0 24 24"'+(cls?' class="'+cls+'"':'')+'>'+p+'</svg>'; }

  /* ------------------------------------------------------------- DADOS -- */
  var KZ = function (n) { return new Intl.NumberFormat("pt-PT").format(Math.round(n)) + " Kz"; };
  var initials = function (name) { var p = name.trim().split(/\s+/); return ((p[0]||"")[0]||"") + ((p[p.length-1]||"")[0]||""); };
  var avColors = ["#0f6243","#2563a3","#9a7426","#1a7d6a","#6b4ea0","#a8553a","#3b7a4c","#2f6e8c"];
  function avColor(name){ var h=0; for(var i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))>>>0; return avColors[h%avColors.length]; }

  var CURSOS = [
    "Farmácia","Análises Clínicas","Enfermagem","Fisioterapia","Nutrição e Dietética",
    "Radiologia","Saúde Pública","Gestão Hospitalar","Estomatologia","Óptica Ocular"
  ];
  var UNIDADES = ["Polo Luanda","Polo Viana","Polo Cacuaco"];
  var EMOL = ["Matrícula","Propina Mensal","Inscrição","Exame","Certificado"];

  var NOMES = ["Ana Cristina Domingos","João Baptista Mendes","Maria Eduarda Lopes","Pedro Manuel Costa",
    "Inês Fortunato Cabanga","Carlos Alberto Neto","Esperança Mussole","Domingos Kalala","Beatriz Tavares",
    "Nuno Sebastião","Luísa Kiluanje","Rafael Quissanga","Helena Bunga","Mateus Cardoso","Sandra Mukala",
    "Gerson Capolo","Teresa Wamba","Aurélio Ndala","Cláudia Sampaio","Hélder Mbala"];

  function makeData() {
    var rng = 0; function r(){ rng=(rng*9301+49297)%233280; return rng/233280; }
    var students = NOMES.map(function (nome, i) {
      var curso = CURSOS[i % CURSOS.length];
      var estados = ["ativo","ativo","ativo","pendente","ativo","concluído","ativo","ativo","pendente","ativo"];
      var estado = estados[i % estados.length];
      var matTotal = [85000,92000,78000,110000,95000][i%5];
      var pago = estado === "pendente" ? Math.round(matTotal*0.4) : (estado==="ativo" ? Math.round(matTotal*(0.6+r()*0.4)) : matTotal);
      var mn = (i+1).toString().padStart(4,"0");
      var dia = (i % 26) + 1;
      return { id:i+1, nome:nome, matricula:"MAT-2026-"+mn, curso:curso,
        unidade:UNIDADES[i%UNIDADES.length], estado:estado, total:matTotal, pago:pago,
        saldo: matTotal - pago, contacto:"+244 9"+(20+i)+" "+(100+i)+" "+(200+i),
        data:"2026-0"+((i%6)+1)+"-"+(dia<10?"0":"")+dia };
    });
    var pagamentos = [];
    for (var k=0;k<14;k++) {
      var st = students[k % students.length];
      pagamentos.push({ recibo:"REC-2026-"+(50-k).toString().padStart(5,"0"), nome:st.nome,
        emolumento:EMOL[k%EMOL.length], valor:[15000,22000,30000,12000,25000,18000][k%6],
        forma:["Multicaixa","Numerário","Transferência"][k%3], data:"2026-06-"+(20-k<10?"0":"")+(20-k>0?20-k:1) });
    }
    return { students: students, pagamentos: pagamentos };
  }
  var DB = makeData();

  /* ---------------------------------------------------- COMPONENTES UI -- */
  function badge(estado) {
    var m = { "ativo":["ok","Ativo"], "pendente":["warn","Pendente"], "concluído":["info","Concluído"],
      "concluido":["info","Concluído"], "desistente":["off","Desistente"] };
    var x = m[estado] || ["off", estado];
    return '<span class="badge '+x[0]+'">'+x[1]+'</span>';
  }
  function who(nome, sub) {
    return '<div class="who"><div class="av" style="background:'+avColor(nome)+'">'+initials(nome).toUpperCase()+'</div>'+
      '<div><div class="cell-strong">'+nome+'</div>'+(sub?'<div class="cell-sub">'+sub+'</div>':'')+'</div></div>';
  }
  function kpi(label, val, icon, delta, dir, note) {
    var d = delta ? '<span class="delta '+(dir||'up')+'">'+svg(dir==='down'?I.down:I.up)+delta+'</span>' : '';
    return '<div class="kpi"><div class="k-top"><span class="k-label">'+label+'</span>'+
      '<span class="k-ico">'+svg(icon)+'</span></div>'+
      '<div class="k-val num">'+val+'</div>'+
      '<div class="k-foot">'+d+(note?'<span>'+note+'</span>':'')+'</div></div>';
  }
  function chartBars(rows, opts) {
    opts = opts || {}; var max = Math.max.apply(null, rows.map(function(r){return r.value;})) || 1;
    return '<div class="chart">'+rows.map(function (r) {
      var pct = Math.max(3, Math.round(r.value/max*100));
      return '<div class="chart-row"><span class="chart-label">'+r.label+'</span>'+
        '<span class="chart-track"><span class="chart-fill" style="width:'+pct+'%"></span></span>'+
        '<span class="chart-val num">'+(opts.money?KZ(r.value):r.value)+'</span></div>';
    }).join("")+'</div>';
  }
  function pageHead(title, sub, actions) {
    return '<div class="page-head"><div><h1>'+title+'</h1>'+(sub?'<div class="sub">'+sub+'</div>':'')+'</div>'+
      (actions?'<div class="page-actions">'+actions+'</div>':'')+'</div>';
  }

  /* --------------------------------------------------------- ECRÃS -- */
  var S = {};

  S.dashboard = function () {
    var totalRec = DB.students.reduce(function(a,s){return a+s.pago;},0);
    var ativos = DB.students.filter(function(s){return s.estado==="ativo";}).length;
    var comDivida = DB.students.filter(function(s){return s.saldo>0;}).length;

    var colData = [
      {m:"Jan",v:58},{m:"Fev",v:72},{m:"Mar",v:66},{m:"Abr",v:88},{m:"Mai",v:79},{m:"Jun",v:95}
    ];
    var cmax = Math.max.apply(null, colData.map(function(c){return c.v;}));
    var cols = colData.map(function (c, i) {
      var h = Math.round(c.v/cmax*100);
      return '<div class="col"><div class="bar'+(i===colData.length-1?'':'')+'" style="height:'+h+'%"></div><span class="cl">'+c.m+'</span></div>';
    }).join("");

    var cursoRows = CURSOS.slice(0,6).map(function (c, i) {
      return { label:c, value:[820000,640000,560000,430000,390000,300000][i] };
    });

    var recentes = DB.students.slice(0,6);
    var recTable = '<div class="table-wrap"><table class="data"><thead><tr><th>Estudante</th><th>Curso</th><th>Estado</th></tr></thead><tbody>'+
      recentes.map(function (s) {
        return '<tr><td>'+who(s.nome, s.matricula)+'</td><td>'+s.curso+'</td><td>'+badge(s.estado)+'</td></tr>';
      }).join("")+'</tbody></table></div>';

    var pagTable = '<div class="table-wrap"><table class="data"><thead><tr><th>Recibo</th><th>Emolumento</th><th class="text-right">Valor</th></tr></thead><tbody>'+
      DB.pagamentos.slice(0,6).map(function (p) {
        return '<tr><td><div class="cell-strong">'+p.recibo+'</div><div class="cell-sub">'+p.nome.split(" ").slice(0,2).join(" ")+'</div></td>'+
          '<td>'+p.emolumento+'</td><td class="text-right num cell-strong">'+KZ(p.valor)+'</td></tr>';
      }).join("")+'</tbody></table></div>';

    return pageHead("Painel executivo", "Visão geral da atividade académica e financeira — Junho de 2026",
        '<button class="btn">'+svg(I.download)+'Exportar</button><button class="btn btn-primary" data-go="matricula">'+svg(I.plus)+'Nova matrícula</button>') +
      '<div class="grid kpis">'+
        kpi("Estudantes matriculados", DB.students.length, I.students, "12%", "up", "vs. mês anterior")+
        kpi("Total recebido", KZ(totalRec), I.cash, "8.4%", "up", "este ano letivo")+
        kpi("Estudantes ativos", ativos, I.check, "5", "up", "novos esta semana")+
        kpi("Com saldo devedor", comDivida, I.receipt, "3", "down", "regularizados")+
      '</div>'+
      '<div class="grid two-col mt-lg">'+
        '<div class="card"><div class="card-head"><div><h3>Receita mensal</h3><div class="ch-sub">Valores recebidos por mês (Kz)</div></div>'+
          '<span class="badge ok no-dot">+8,4%</span></div>'+
          '<div class="card-body"><div class="cols">'+cols+'</div></div></div>'+
        '<div class="card"><div class="card-head"><div><h3>Receita por curso</h3><div class="ch-sub">Top 6 · ano letivo</div></div></div>'+
          '<div class="card-body">'+chartBars(cursoRows, {money:true})+'</div></div>'+
      '</div>'+
      '<div class="grid two-col mt-lg">'+
        '<div class="card"><div class="card-head"><h3>Matrículas recentes</h3>'+
          '<button class="btn btn-sm" data-go="estudantes">Ver todos'+svg(I.chevR)+'</button></div>'+
          '<div class="card-body flush">'+recTable+'</div></div>'+
        '<div class="card"><div class="card-head"><h3>Últimos pagamentos</h3>'+
          '<button class="btn btn-sm" data-go="pagamentos">Ver todos'+svg(I.chevR)+'</button></div>'+
          '<div class="card-body flush">'+pagTable+'</div></div>'+
      '</div>';
  };

  S.estudantes = function () {
    var rows = DB.students.map(function (s) {
      return '<tr>'+
        '<td>'+who(s.nome, s.matricula)+'</td>'+
        '<td>'+s.curso+'</td>'+
        '<td>'+s.unidade+'</td>'+
        '<td>'+badge(s.estado)+'</td>'+
        '<td class="text-right num">'+KZ(s.pago)+'</td>'+
        '<td class="text-right num">'+(s.saldo>0?'<span style="color:var(--danger);font-weight:600">'+KZ(s.saldo)+'</span>':'<span class="muted">—</span>')+'</td>'+
        '<td><div class="row-actions"><button class="btn btn-sm" data-go="recibos">Ficha</button></div></td>'+
        '</tr>';
    }).join("");
    return pageHead("Estudantes", DB.students.length+" estudantes registados · "+UNIDADES.length+" polos",
        '<button class="btn">'+svg(I.download)+'Exportar CSV</button><button class="btn btn-primary" data-go="matricula">'+svg(I.plus)+'Nova matrícula</button>')+
      '<div class="toolbar">'+
        '<div class="search">'+svg(I.search,'si')+'<input placeholder="Pesquisar por nome, matrícula, contacto ou curso..."></div>'+
        '<select class="select"><option>Todos os cursos</option>'+CURSOS.map(function(c){return '<option>'+c+'</option>';}).join("")+'</select>'+
        '<div class="seg"><button class="on">Todos</button><button>Ativos</button><button>Pendentes</button></div>'+
      '</div>'+
      '<div class="card"><div class="card-body flush"><div class="table-wrap"><table class="data">'+
        '<thead><tr><th>Estudante</th><th>Curso</th><th>Polo</th><th>Estado</th><th class="text-right">Pago</th><th class="text-right">Saldo</th><th></th></tr></thead>'+
        '<tbody>'+rows+'</tbody></table></div></div></div>';
  };

  S.matricula = function () {
    function field(label, ph, req, type) {
      return '<div class="field"><label>'+label+(req?' <span class="req">*</span>':'')+'</label>'+
        '<input type="'+(type||'text')+'" placeholder="'+(ph||'')+'"></div>';
    }
    function sel(label, opts) {
      return '<div class="field"><label>'+label+'</label><select class="">'+opts.map(function(o){return '<option>'+o+'</option>';}).join("")+'</select></div>';
    }
    return pageHead("Nova matrícula", "Cadastro da ficha de matrícula · Nº automático",
        '<button class="btn" data-go="estudantes">Cancelar</button>')+
      '<div class="grid" style="grid-template-columns:1.6fr .9fr;align-items:start;gap:18px">'+
        '<div class="card"><div class="card-head"><h3>Ficha de matrícula</h3>'+
          '<span class="badge gold no-dot">MAT-2026-0021</span></div>'+
          '<div class="card-body"><form><div class="form-grid">'+
            '<div class="form-section">Dados do estudante</div>'+
            field("Nome completo","Nome do estudante",true)+
            field("Data de nascimento","","", "date")+
            field("Número do BI","000000000LA000")+
            field("Contacto principal","+244 …",true,"tel")+
            field("WhatsApp","+244 …","","tel")+
            sel("Polo / Unidade", UNIDADES)+
            '<div class="form-section">Dados do curso</div>'+
            sel("Curso", ["— Selecione —"].concat(CURSOS))+
            sel("Período", ["Manhã","Tarde","Noite"])+
            sel("Regime", ["Presencial","Híbrido","Pós-laboral"])+
            field("Duração","Ex.: 18 meses")+
            '<div class="form-section">Matrícula e pagamento</div>'+
            field("Valor da matrícula (Kz)","85 000","","number")+
            field("Valor pago (Kz)","85 000","","number")+
            sel("Forma de pagamento", ["Multicaixa","Numerário","Transferência"])+
            sel("Funcionário", ["Secretaria","Coordenação","Tesouraria"])+
            '<div class="field full"><label>Observações</label><textarea placeholder="Notas internas (opcional)"></textarea></div>'+
          '</div>'+
          '<div class="form-actions">'+
            '<label class="check" style="margin-right:auto"><input type="checkbox" checked> Gerar recibo do valor pago</label>'+
            '<button type="button" class="btn">Limpar</button>'+
            '<button type="button" class="btn btn-primary" data-go="recibos">'+svg(I.check)+'Gerar matrícula</button>'+
          '</div></form></div></div>'+
        '<div class="card" style="position:sticky;top:78px"><div class="card-head"><h3>Resumo</h3></div>'+
          '<div class="card-body"><div class="dl" style="grid-template-columns:1fr;gap:14px">'+
            '<div><div class="k">Nº de matrícula</div><div class="v">MAT-2026-0021</div></div>'+
            '<div><div class="k">Ano letivo</div><div class="v">2026</div></div>'+
            '<div><div class="k">Estado inicial</div><div class="v">'+badge("ativo")+'</div></div>'+
          '</div>'+
          '<div class="doc-amount" style="margin-top:18px"><span class="k">Total a pagar</span><span class="v num">85 000 Kz</span></div>'+
          '<p class="muted" style="font-size:12px;margin-top:14px;line-height:1.5">Ao gerar a matrícula, o estudante é adicionado automaticamente às listas de Estudantes, Pagamentos e Recibos.</p>'+
          '</div></div>'+
      '</div>';
  };

  S.recibos = function () {
    return pageHead("Recibo", "Documento institucional · pronto para impressão A4",
        '<button class="btn">'+svg(I.print)+'Imprimir</button><button class="btn btn-primary">'+svg(I.download)+'Guardar PDF</button>')+
      '<div class="doc">'+
        '<div class="doc-head"><div class="doc-org"><img src="assets/logo.svg" class="logo" alt="">'+
          '<div><strong>Grupo Midas Angola</strong><small>Do Zero ao Emprego</small></div></div>'+
          '<div class="doc-title"><div class="dt-kind">Recibo de pagamento</div><div class="dt-num num">REC-2026-00050</div><div class="dt-date">20 de Junho de 2026</div></div></div>'+
        '<div class="doc-rows">'+
          '<div class="doc-row"><span class="k">Estudante</span><span class="v">Ana Cristina Domingos</span></div>'+
          '<div class="doc-row"><span class="k">Nº de matrícula</span><span class="v num">MAT-2026-0001</span></div>'+
          '<div class="doc-row"><span class="k">Curso</span><span class="v">Farmácia · Polo Luanda</span></div>'+
          '<div class="doc-row"><span class="k">Emolumento</span><span class="v">Matrícula</span></div>'+
          '<div class="doc-row"><span class="k">Forma de pagamento</span><span class="v">Multicaixa</span></div>'+
          '<div class="doc-row"><span class="k">Recebido por</span><span class="v">Tesouraria</span></div>'+
        '</div>'+
        '<div class="doc-amount"><span class="k">Valor pago</span><span class="v num">85 000 Kz</span></div>'+
        '<div class="doc-sign"><div class="s"><div class="rule">O Estudante</div><div class="role">Assinatura</div></div>'+
          '<div class="s"><div class="rule">A Tesouraria</div><div class="role">Assinatura e carimbo</div></div></div>'+
        '<div class="doc-foot">Grupo Midas Angola · Turmas Midas 2026 · Documento gerado eletronicamente · REC-2026-00050</div>'+
      '</div>';
  };

  S.midas = function () {
    var finalistas = DB.students.slice(0,8).map(function (s, i) {
      var apto = i % 3 !== 2;
      var prog = [100,85,100,72,100,90,60,100][i];
      return '<tr><td>'+who(s.nome, s.matricula)+'</td><td>'+s.curso+'</td>'+
        '<td><div style="display:flex;align-items:center;gap:10px"><span class="chart-track" style="width:110px"><span class="chart-fill" style="width:'+prog+'%"></span></span><span class="num" style="font-size:12px;font-weight:600">'+prog+'%</span></div></td>'+
        '<td>'+(apto?'<span class="badge ok">Apto para defesa</span>':'<span class="badge warn">Em estágio</span>')+'</td></tr>';
    }).join("");
    return pageHead("MIDAS 2026 — Finalistas", "Acompanhamento de estágios e aptidão para defesa", "")+
      '<div class="grid three-col">'+
        kpi("Finalistas", 42, I.star, null, null, "ano letivo 2026")+
        kpi("Em estágio", 16, I.courses, null, null, "ativos agora")+
        kpi("Aptos para defesa", 26, I.check, "9", "up", "este mês")+
      '</div>'+
      '<div class="tabs mt-lg"><div class="tab active">Estágios &amp; aptidão</div><div class="tab">Defesas agendadas</div><div class="tab">Concluídos</div></div>'+
      '<div class="card"><div class="card-body flush"><div class="table-wrap"><table class="data">'+
        '<thead><tr><th>Finalista</th><th>Curso</th><th>Progresso de estágio</th><th>Estado</th></tr></thead>'+
        '<tbody>'+finalistas+'</tbody></table></div></div></div>';
  };

  var PALETAS = [
    ["slate","Slate + Turquesa","Petróleo + turquesa",["#0f172a","#14b8a6","#e2e8f0"]],
    ["supabase","Supabase","Cinza neutro + esmeralda",["#171717","#3ecf8e","#ececec"]],
    ["midas","Midas Verde","Verde executivo + dourado",["#0c2c20","#0f6243","#bd9442"]]
  ];
  function palOpt(p) {
    return '<label class="pal-opt" data-pal="'+p[0]+'">'+
      '<span class="pal-sw">'+p[3].map(function(c){return '<i style="background:'+c+'"></i>';}).join("")+'</span>'+
      '<span class="pal-meta"><span class="pal-name">'+p[1]+'</span><span class="pal-desc">'+p[2]+'</span></span>'+
      '<span class="pal-check">'+svg(I.check)+'</span></label>';
  }
  function seg(setAttr, opts) {
    return '<div class="appe-seg set-seg">'+opts.map(function(o){return '<button data-'+setAttr+'="'+o[0]+'">'+o[1]+'</button>';}).join("")+'</div>';
  }

  S.config = function () {
    function field(label, val, hint) {
      return '<div class="field"><label>'+label+'</label><input value="'+(val||'')+'">'+(hint?'<span class="hint">'+hint+'</span>':'')+'</div>';
    }
    return pageHead("Configurações", "Personalize a aparência e os dados institucionais do sistema", "")+
      '<div class="card mt"><div class="card-head"><div><h3>Aparência</h3><div class="ch-sub">Aplica-se a todo o sistema e fica guardada neste dispositivo</div></div></div>'+
        '<div class="card-body">'+
          '<div class="set-row"><div class="srl"><strong>Paleta de cores</strong><small>Define a identidade visual do sistema.</small></div>'+
            '<div class="cfg-pal">'+PALETAS.map(palOpt).join("")+'</div></div>'+
          '<div class="set-row"><div class="srl"><strong>Tema</strong><small>Claro para o dia, escuro para ambientes com pouca luz.</small></div>'+
            seg("theme-set",[["light","Dia"],["dark","Noite"]])+'</div>'+
          '<div class="set-row"><div class="srl"><strong>Barra lateral</strong><small>Escura (executiva) ou clara (minimalista).</small></div>'+
            seg("side-set",[["executive","Escura"],["light","Clara"]])+'</div>'+
          '<div class="set-row"><div class="srl"><strong>Densidade</strong><small>Compacta mostra mais informação por ecrã.</small></div>'+
            seg("dens-set",[["comfortable","Confortável"],["compact","Compacta"]])+'</div>'+
        '</div></div>'+
      '<div class="grid two-col mt-lg">'+
        '<div class="card"><div class="card-head"><h3>Identidade institucional</h3></div>'+
          '<div class="card-body"><div class="form-grid">'+
            '<div class="field full"><label>Nome da instituição</label><input value="Grupo Midas Angola"></div>'+
            field("Slogan","Do Zero ao Emprego")+
            field("NIF","5000 000 000")+
            '<div class="field full"><label>Endereço</label><input value="Luanda · Angola"></div>'+
          '</div><div class="form-actions"><button class="btn btn-primary">'+svg(I.check)+'Guardar</button></div></div></div>'+
        '<div class="card"><div class="card-head"><h3>Numeração de documentos</h3></div>'+
          '<div class="card-body"><div class="form-grid">'+
            field("Prefixo de recibo","REC-2026-")+
            field("Próximo nº de recibo","00051")+
            field("Prefixo de matrícula","MAT-2026-")+
            field("Próximo nº de matrícula","0021")+
          '</div><p class="muted" style="font-size:12px;margin-top:14px">A numeração é sequencial e automática. Cada recibo emitido incrementa o contador.</p></div></div>'+
      '</div>';
  };

  S.cursos = function () {
    var tipos = ["Técnico","Profissional","Especialização","Técnico","Profissional"];
    var dur = ["18 meses","24 meses","12 meses","36 meses"];
    var rows = CURSOS.map(function (c, i) {
      var ativo = i !== 6 && i !== 9;
      var insc = [15000,18000,20000][i%3], mat = [85000,92000,78000,110000][i%4], prop = [22000,25000,30000][i%3];
      return '<tr>'+
        '<td><div class="cell-strong">'+c+'</div><div class="cell-sub">'+tipos[i%tipos.length]+' · '+dur[i%dur.length]+'</div></td>'+
        '<td>'+["Manhã","Tarde","Noite"][i%3]+'</td>'+
        '<td>'+["Presencial","Híbrido","Pós-laboral"][i%3]+'</td>'+
        '<td class="text-right num">'+KZ(insc)+'</td>'+
        '<td class="text-right num">'+KZ(mat)+'</td>'+
        '<td class="text-right num">'+KZ(prop)+'</td>'+
        '<td>'+(ativo?'<span class="badge ok">Ativo</span>':'<span class="badge off">Inativo</span>')+'</td>'+
        '<td><div class="row-actions"><button class="btn btn-sm">Editar</button></div></td></tr>';
    }).join("");
    return pageHead("Cursos", CURSOS.length+" cursos · valores de inscrição, matrícula e propina",
        '<button class="btn">'+svg(I.download)+'Exportar</button><button class="btn btn-primary">'+svg(I.plus)+'Novo curso</button>')+
      '<div class="grid kpis">'+
        kpi("Cursos no catálogo", CURSOS.length, I.courses, null, null, "")+
        kpi("Cursos ativos", CURSOS.length-2, I.check, null, null, "abertos a matrícula")+
        kpi("Propina média", KZ(25666), I.cash, null, null, "por mês")+
        kpi("Períodos", 3, I.report, null, null, "Manhã · Tarde · Noite")+
      '</div>'+
      '<div class="toolbar mt-lg"><div class="search">'+svg(I.search,'si')+'<input placeholder="Pesquisar curso..."></div>'+
        '<select class="select"><option>Todos os tipos</option><option>Técnico</option><option>Profissional</option><option>Especialização</option></select>'+
        '<div class="seg"><button class="on">Todos</button><button>Ativos</button><button>Inativos</button></div></div>'+
      '<div class="card"><div class="card-body flush"><div class="table-wrap"><table class="data">'+
        '<thead><tr><th>Curso</th><th>Período</th><th>Regime</th><th class="text-right">Inscrição</th><th class="text-right">Matrícula</th><th class="text-right">Propina</th><th>Estado</th><th></th></tr></thead>'+
        '<tbody>'+rows+'</tbody></table></div></div></div>';
  };

  S.pagamentos = function () {
    var total = DB.pagamentos.reduce(function(a,p){return a+p.valor;},0);
    var hoje = DB.pagamentos.slice(0,4).reduce(function(a,p){return a+p.valor;},0);
    var rows = DB.pagamentos.map(function (p) {
      return '<tr><td><div class="cell-strong num">'+p.recibo+'</div></td>'+
        '<td>'+p.nome+'</td><td>'+p.emolumento+'</td>'+
        '<td><span class="badge info no-dot">'+p.forma+'</span></td>'+
        '<td class="num">'+p.data.split("-").reverse().join("/")+'</td>'+
        '<td class="text-right num cell-strong">'+KZ(p.valor)+'</td>'+
        '<td><div class="row-actions"><button class="btn btn-sm" data-go="recibos">Recibo</button></div></td></tr>';
    }).join("");
    return pageHead("Pagamentos", DB.pagamentos.length+" registos · receção e emissão de recibos",
        '<button class="btn">'+svg(I.download)+'Exportar CSV</button><button class="btn btn-primary">'+svg(I.plus)+'Registar pagamento</button>')+
      '<div class="grid kpis">'+
        kpi("Recebido hoje", KZ(hoje), I.cash, "6", "up", "pagamentos")+
        kpi("Recebido no mês", KZ(total), I.cash, "8.4%", "up", "Junho 2026")+
        kpi("Pagamentos registados", DB.pagamentos.length, I.receipt, null, null, "este mês")+
        kpi("Ticket médio", KZ(Math.round(total/DB.pagamentos.length)), I.pay, null, null, "por recibo")+
      '</div>'+
      '<div class="toolbar mt-lg"><div class="search">'+svg(I.search,'si')+'<input placeholder="Pesquisar por recibo, estudante ou curso..."></div>'+
        '<select class="select"><option>Todos os emolumentos</option>'+EMOL.map(function(e){return '<option>'+e+'</option>';}).join("")+'</select>'+
        '<select class="select"><option>Todas as formas</option><option>Multicaixa</option><option>Numerário</option><option>Transferência</option></select></div>'+
      '<div class="card"><div class="card-body flush"><div class="table-wrap"><table class="data">'+
        '<thead><tr><th>Recibo</th><th>Estudante</th><th>Emolumento</th><th>Forma</th><th>Data</th><th class="text-right">Valor</th><th></th></tr></thead>'+
        '<tbody>'+rows+'</tbody>'+
        '<tfoot><tr><td colspan="5" class="cell-strong">Total ('+DB.pagamentos.length+' registos)</td><td class="text-right num cell-strong">'+KZ(total)+'</td><td></td></tr></tfoot>'+
        '</table></div></div></div>';
  };

  S.relatorios = function () {
    var porMes = [{label:"Janeiro",value:580000},{label:"Fevereiro",value:720000},{label:"Março",value:660000},
      {label:"Abril",value:880000},{label:"Maio",value:790000},{label:"Junho",value:950000}];
    var porCurso = CURSOS.slice(0,6).map(function (c,i){ return {label:c, value:[820000,640000,560000,430000,390000,300000][i]}; });
    var totalAno = porMes.reduce(function(a,m){return a+m.value;},0);
    return pageHead("Relatórios", "Ferramenta executiva · receitas, matrículas e desempenho",
        '<button class="btn">'+svg(I.print)+'Imprimir</button><button class="btn btn-primary">'+svg(I.download)+'Exportar relatório</button>')+
      '<div class="card mb"><div class="card-body"><div class="toolbar" style="margin:0">'+
        '<select class="select"><option>Receitas por mês</option><option>Matrículas por curso</option><option>Pagamentos por funcionário</option><option>Dívidas em aberto</option></select>'+
        '<select class="select"><option>Ano letivo 2026</option><option>Último trimestre</option><option>Junho 2026</option></select>'+
        '<select class="select"><option>Todos os polos</option>'+UNIDADES.map(function(u){return '<option>'+u+'</option>';}).join("")+'</select>'+
        '<button class="btn btn-primary">'+svg(I.filter)+'Aplicar</button></div></div></div>'+
      '<div class="grid kpis">'+
        kpi("Receita do período", KZ(totalAno), I.cash, "8.4%", "up", "vs. período anterior")+
        kpi("Matrículas", 128, I.students, "12%", "up", "no período")+
        kpi("Recibos emitidos", 312, I.receipt, null, null, "no período")+
        kpi("Média mensal", KZ(Math.round(totalAno/6)), I.report, null, null, "receita")+
      '</div>'+
      '<div class="grid two-col mt-lg">'+
        '<div class="card"><div class="card-head"><div><h3>Receita por mês</h3><div class="ch-sub">Ano letivo 2026 (Kz)</div></div></div><div class="card-body">'+chartBars(porMes,{money:true})+'</div></div>'+
        '<div class="card"><div class="card-head"><div><h3>Receita por curso</h3><div class="ch-sub">Top 6</div></div></div><div class="card-body">'+chartBars(porCurso,{money:true})+'</div></div>'+
      '</div>'+
      '<div class="card mt-lg"><div class="card-head"><h3>Detalhe mensal</h3></div><div class="card-body flush"><div class="table-wrap"><table class="data">'+
        '<thead><tr><th>Mês</th><th class="text-right">Matrículas</th><th class="text-right">Recibos</th><th class="text-right">Receita</th></tr></thead><tbody>'+
        porMes.map(function (m,i){ return '<tr><td class="cell-strong">'+m.label+'</td><td class="text-right num">'+[18,24,19,28,21,18][i]+'</td><td class="text-right num">'+[42,55,48,62,51,54][i]+'</td><td class="text-right num cell-strong">'+KZ(m.value)+'</td></tr>'; }).join("")+
        '</tbody><tfoot><tr><td class="cell-strong">Total</td><td class="text-right num cell-strong">128</td><td class="text-right num cell-strong">312</td><td class="text-right num cell-strong">'+KZ(totalAno)+'</td></tr></tfoot></table></div></div></div>';
  };

  S.fecho = function () {
    var formas = { "Numerário":0, "Multicaixa":0, "Transferência":0 };
    DB.pagamentos.slice(0,8).forEach(function (p) { formas[p.forma] = (formas[p.forma]||0) + p.valor; });
    var total = Object.keys(formas).reduce(function(a,k){return a+formas[k];},0);
    var formaRows = Object.keys(formas).map(function (k) {
      return '<div class="set-row" style="grid-template-columns:1fr auto;padding:13px 0"><div class="srl"><strong>'+k+'</strong></div>'+
        '<div class="num cell-strong" style="font-size:15px">'+KZ(formas[k])+'</div></div>';
    }).join("");
    var trans = DB.pagamentos.slice(0,8).map(function (p) {
      return '<tr><td class="num">'+p.recibo+'</td><td>'+p.nome+'</td><td><span class="badge info no-dot">'+p.forma+'</span></td><td class="text-right num cell-strong">'+KZ(p.valor)+'</td></tr>';
    }).join("");
    return pageHead("Fecho de Caixa", "Resumo do dia · 20 de Junho de 2026",
        '<button class="btn">'+svg(I.print)+'Imprimir folha</button><button class="btn btn-primary">'+svg(I.check)+'Fechar caixa do dia</button>')+
      '<div class="grid" style="grid-template-columns:1fr 1.4fr;align-items:start;gap:18px">'+
        '<div class="card"><div class="card-head"><h3>Resumo por forma de pagamento</h3></div><div class="card-body">'+formaRows+
          '<div class="doc-amount" style="margin-top:16px"><span class="k">Total do dia</span><span class="v num">'+KZ(total)+'</span></div>'+
          '<div class="dl" style="grid-template-columns:1fr 1fr;margin-top:18px">'+
            '<div><div class="k">Transações</div><div class="v num">8</div></div>'+
            '<div><div class="k">Operador</div><div class="v">Tesouraria</div></div>'+
          '</div></div></div>'+
        '<div class="card"><div class="card-head"><h3>Transações do dia</h3><span class="badge ok no-dot">'+KZ(total)+'</span></div><div class="card-body flush"><div class="table-wrap"><table class="data">'+
          '<thead><tr><th>Recibo</th><th>Estudante</th><th>Forma</th><th class="text-right">Valor</th></tr></thead><tbody>'+trans+'</tbody>'+
          '<tfoot><tr><td colspan="3" class="cell-strong">Total</td><td class="text-right num cell-strong">'+KZ(total)+'</td></tr></tfoot></table></div></div></div>'+
      '</div>';
  };

  S.generic = function (title, sub) {
    return pageHead(title, sub, '<button class="btn btn-primary">'+svg(I.plus)+'Adicionar</button>')+
      '<div class="card"><div class="empty"><div class="e-ico">'+svg(I.dash)+'</div>'+
      '<h3 style="font-size:15px;margin-bottom:6px">'+title+'</h3>'+
      '<p class="muted" style="max-width:380px;margin:0 auto">Esta secção segue o mesmo sistema visual — tabelas, filtros e cartões. Pronta para ligar aos dados reais no Claude Code.</p></div></div>';
  };

  /* ------------------------------------------------------------- NAV -- */
  var NAV = [
    ["dashboard","Dashboard",I.dash],
    ["matricula","Nova Matrícula",I.add],
    ["recibos","Recibos",I.receipt],
    ["estudantes","Estudantes",I.students],
    ["cursos","Cursos",I.courses],
    ["pagamentos","Pagamentos",I.pay],
    ["fecho","Fecho de Caixa",I.cash],
    ["midas","MIDAS 2026",I.star,"2026"],
    ["relatorios","Relatórios",I.report],
    ["config","Configurações",I.gear]
  ];
  var TITLES = {
    dashboard:["Dashboard"], matricula:["Nova Matrícula"], recibos:["Recibos"], estudantes:["Estudantes"],
    cursos:["Cursos"], pagamentos:["Pagamentos"], fecho:["Fecho de Caixa"], midas:["MIDAS 2026"],
    relatorios:["Relatórios"], config:["Configurações"]
  };

  function renderNav(active) {
    return NAV.map(function (n) {
      var tag = n[3] ? '<span class="tag">'+n[3]+'</span>' : '';
      return '<a class="nav-link'+(n[0]===active?' active':'')+'" data-route="'+n[0]+'">'+
        '<span class="ico">'+svg(n[2])+'</span>'+n[1]+tag+'</a>';
    }).join("");
  }

  function route(name) {
    name = name || "dashboard";
    var view = document.getElementById("view");
    var fn = S[name];
    var html;
    if (fn) html = fn();
    else html = S.generic(TITLES[name] ? TITLES[name][0] : name, "");
    view.innerHTML = '<div class="page view-enter">'+html+'</div>';
    // nav active
    document.querySelectorAll(".nav-link").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === name);
    });
    // crumb
    document.getElementById("crumbHere").textContent = (TITLES[name] && TITLES[name][0]) || name;
    if (window.__syncAppearance) window.__syncAppearance();
    document.body.classList.remove("nav-open");
    document.querySelector(".sidebar").classList.remove("open");
    window.scrollTo(0, 0);
    try { localStorage.setItem("midas_route", name); } catch (e) {}
  }

  /* ------------------------------------------------------------ BOOT -- */
  function boot() {
    document.getElementById("nav").innerHTML = renderNav("dashboard");

    // delegated nav + go buttons
    document.addEventListener("click", function (e) {
      var nav = e.target.closest("[data-route]");
      if (nav) { route(nav.getAttribute("data-route")); return; }
      var go = e.target.closest("[data-go]");
      if (go) { route(go.getAttribute("data-go")); return; }
    });

    // mobile menu
    document.getElementById("menuToggle").addEventListener("click", function () {
      document.querySelector(".sidebar").classList.toggle("open");
      document.body.classList.toggle("nav-open");
    });
    document.getElementById("overlay").addEventListener("click", function () {
      document.querySelector(".sidebar").classList.remove("open");
      document.body.classList.remove("nav-open");
    });

    // theme toggle
    var themeBtn = document.getElementById("themeBtn");
    function applyTheme(t) {
      document.documentElement.setAttribute("data-theme", t);
      themeBtn.innerHTML = '<svg viewBox="0 0 24 24">'+(t==="dark"?I.sun:I.moon)+'</svg>';
      try { localStorage.setItem("midas_theme", t); } catch (e) {}
    }
    themeBtn.addEventListener("click", function () {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
    var savedTheme = "light";
    try { savedTheme = localStorage.getItem("midas_theme") || "light"; } catch (e) {}
    applyTheme(savedTheme);

    // ----- Aparência (paleta / sidebar / densidade) -----
    var root = document.documentElement;
    function getLS(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
    function setLS(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    function syncAppearance() {
      var pal = root.getAttribute("data-palette"), th = root.getAttribute("data-theme"),
          sd = root.getAttribute("data-sidebar"), dn = root.getAttribute("data-density");
      document.querySelectorAll("[data-pal]").forEach(function (o) { o.classList.toggle("sel", o.getAttribute("data-pal") === pal); });
      document.querySelectorAll("[data-theme-set]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-theme-set") === th); });
      document.querySelectorAll("[data-side-set]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-side-set") === sd); });
      document.querySelectorAll("[data-dens-set]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-dens-set") === dn); });
    }
    window.__syncAppearance = syncAppearance;

    // restaurar preferências
    root.setAttribute("data-palette", getLS("midas_palette", "slate"));
    root.setAttribute("data-sidebar", getLS("midas_sidebar", "executive"));
    root.setAttribute("data-density", getLS("midas_density", "comfortable"));

    var appeBtn = document.getElementById("appeBtn");
    var appePop = document.getElementById("appePop");
    appeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      appePop.classList.toggle("open");
      if (appePop.classList.contains("open")) syncAppearance();
    });
    document.addEventListener("click", function (e) {
      if (!appePop.contains(e.target) && e.target !== appeBtn) appePop.classList.remove("open");
    });

    // controlos de aparência delegados (funcionam no popover E em Configurações)
    document.addEventListener("click", function (e) {
      var p = e.target.closest("[data-pal]");
      if (p) { root.setAttribute("data-palette", p.getAttribute("data-pal")); setLS("midas_palette", p.getAttribute("data-pal")); syncAppearance(); return; }
      var t = e.target.closest("[data-theme-set]");
      if (t) { applyTheme(t.getAttribute("data-theme-set")); syncAppearance(); return; }
      var s = e.target.closest("[data-side-set]");
      if (s) { root.setAttribute("data-sidebar", s.getAttribute("data-side-set")); setLS("midas_sidebar", s.getAttribute("data-side-set")); syncAppearance(); return; }
      var d = e.target.closest("[data-dens-set]");
      if (d) { root.setAttribute("data-density", d.getAttribute("data-dens-set")); setLS("midas_density", d.getAttribute("data-dens-set")); syncAppearance(); return; }
    });

    // ----- Login (pré-visualização) -----
    var loginScreen = document.getElementById("loginScreen");
    document.getElementById("logoutBtn").addEventListener("click", function () {
      loginScreen.classList.add("open");
    });
    document.getElementById("loginForm").addEventListener("submit", function (e) {
      e.preventDefault();
      loginScreen.classList.remove("open");
      route("dashboard");
    });

    var start = "dashboard";
    try { start = localStorage.getItem("midas_route") || "dashboard"; } catch (e) {}
    route(start);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.MidasProto = { route: route };
})();
