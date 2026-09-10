const fs=require('fs');
const D=require('docx');
const path=require('path');
const {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType,Table,TableRow,TableCell,ImageRun,
 WidthType,ShadingType,BorderStyle,PageBreak,PageOrientation,Header,Footer,PageNumber,
 TableOfContents,LevelFormat,VerticalAlign,convertInchesToTwip}=D;

const d=JSON.parse(fs.readFileSync('dados.json','utf8'));
const M=d.meta;
const hf=x=>(Math.round(x*10)/10).toString().replace('.',',')+' h';
const hn=x=>Math.round(x*10)/10;
const nf=v=>String(v).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const W_P=9026, W_L=14678;
const C={navy:'0F3A63',navy2:'1B4E7F',green:'0B7A20',rule:'B7C4CF',head:'0F3A63',
 zebra:'F2F6F9',aula:'FFF2A8',sem:'FFD08A',fer:'DCDCDC',gest:'D8EAC8',est:'CFE2F3',sab:'DED3F0',defe:'F7C9C9',box:'EEF3F7'};
const F='Calibri', FS='Cambria';

const noB={top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},
 left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}};
const thin=(c)=>({style:BorderStyle.SINGLE,size:4,color:c||C.rule});
const allThin=(c)=>({top:thin(c),bottom:thin(c),left:thin(c),right:thin(c)});

function P(text,o={}){return new Paragraph({
 alignment:o.al, spacing:{before:o.sb??0,after:o.sa??100,line:o.line??260},
 indent:o.ind, border:o.border, pageBreakBefore:o.pb||false,
 children:[new TextRun({text:text||'',bold:o.b,italics:o.i,size:o.sz??20,
  font:o.f||F,color:o.c||'1A1A1A',allCaps:o.caps,characterSpacing:o.cs})]});}

function H(text,lvl,o={}){return new Paragraph({
 heading:lvl, pageBreakBefore:o.pb||false, spacing:{before:o.sb??240,after:o.sa??120},
 children:[new TextRun({text,font:FS,bold:true,size:o.sz,color:o.c||C.navy})]});}

function bullets(items,o={}){return items.map(t=>new Paragraph({
 numbering:{reference:o.ref||'pontos',level:0},
 spacing:{after:60,line:250},
 children:[new TextRun({text:t,size:o.sz??19,font:F,color:'1A1A1A'})]}));}

function cell(children,o={}){return new TableCell({
 width:{size:o.w,type:WidthType.DXA},
 columnSpan:o.cs, rowSpan:o.rs, verticalAlign:o.va||VerticalAlign.TOP,
 shading:o.fill?{type:ShadingType.CLEAR,fill:o.fill,color:'auto'}:undefined,
 borders:o.borders||allThin(),
 margins:{top:o.mt??50,bottom:o.mb??50,left:70,right:70},
 children:Array.isArray(children)?children:[children]});}

function tbl(widths,rows,o={}){return new Table({
 columnWidths:widths, width:{size:widths.reduce((a,b)=>a+b,0),type:WidthType.DXA},
 layout:'fixed', rows, ...(o.extra||{})});}

function headRow(labels,widths,fill){return new TableRow({tableHeader:true,children:
 labels.map((l,i)=>cell(P(l,{b:true,sz:16,c:'FFFFFF',caps:true,cs:8,sa:0}),
  {w:widths[i],fill:fill||C.head}))});}

function dataRow(cells,widths,i,o={}){return new TableRow({children:
 cells.map((t,j)=>cell(Array.isArray(t)?t:P(String(t),{sz:o.sz??17,sa:0,al:o.al&&o.al[j],b:o.b&&o.b[j]}),
  {w:widths[j],fill:(i%2===1)?C.zebra:undefined}))});}

/* ============================ CAPA ============================ */
const LOGO=(()=>{
 const cand=[process.env.MIDAS_LOGO,
   path.resolve(__dirname,'..','..','..','..','assets','logo-midas26.png'),
   path.resolve(__dirname,'assets','logo-midas26.png'),
   path.resolve(__dirname,'logo-midas26.png')].filter(Boolean);
 return cand.find(x=>fs.existsSync(x));
})();
const temLogo=Boolean(LOGO);
const capa=[
 ...(temLogo?[new Paragraph({spacing:{before:520,after:120},alignment:AlignmentType.CENTER,children:[
   new ImageRun({type:'png',data:fs.readFileSync(LOGO),
     transformation:{width:150,height:150},
     altText:{name:'MIDAS 26',description:'Logótipo MIDAS 26 — Do Zero ao Emprego',title:'MIDAS 26'}})]})]:[]),
 new Paragraph({spacing:{before:temLogo?0:900,after:0},alignment:AlignmentType.CENTER,children:[
  new TextRun({text:M.grupo.toUpperCase(),font:F,size:20,bold:true,color:C.green,characterSpacing:60})]}),
 new Paragraph({spacing:{before:60,after:600},alignment:AlignmentType.CENTER,children:[
  new TextRun({text:M.inst.toUpperCase(),font:F,size:18,color:C.navy2,characterSpacing:50})]}),
 new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:0,after:0},
  border:{top:thin(C.navy),bottom:thin(C.navy)},children:[
  new TextRun({text:'',size:8})]}),
 new Paragraph({spacing:{before:360,after:120},alignment:AlignmentType.CENTER,children:[
  new TextRun({text:'PROGRAMA DE FORMAÇÃO',font:FS,size:34,bold:true,color:C.navy})]}),
 new Paragraph({spacing:{after:400},alignment:AlignmentType.CENTER,children:[
  new TextRun({text:'TÉCNICO-PROFISSIONAL EM ENFERMAGEM',font:FS,size:34,bold:true,color:C.navy})]}),
 new Paragraph({spacing:{after:80},alignment:AlignmentType.CENTER,children:[
  new TextRun({text:`Curso de ${M.curso}  ·  ${M.modulo}`,font:FS,size:26,color:C.green,bold:true})]}),
 new Paragraph({spacing:{after:700},alignment:AlignmentType.CENTER,children:[
  new TextRun({text:`Turma ${M.turma}  ·  Unidade do ${M.unidade}  ·  Ano lectivo ${M.ano}`,
   font:F,size:22,color:'3A4E60'})]}),
];
{
 const w=[2200,2600,2100,2126];
 const facts=[['Duração','8 meses','Dias lectivos',String(M.dias_uteis)],
  ['Período',`${M.ini} a ${M.fim}`,'Carga horária',`${M.horas_total} horas`],
  ['Dias de formação','Terça e quinta-feira','Horário','08h00 – 12h15']];
 capa.push(tbl(w,facts.map((r,i)=>new TableRow({children:r.map((t,j)=>cell(
   P(t,{sz:18,b:j%2===0,c:j%2===0?C.navy:'1A1A1A',caps:j%2===0,cs:j%2===0?20:0,sa:0}),
   {w:w[j],fill:C.box,borders:allThin('FFFFFF'),mt:80,mb:80}))}))));
}
capa.push(new Paragraph({spacing:{before:900,after:0},alignment:AlignmentType.CENTER,children:[
  new TextRun({text:`Elaborado por ${M.autor}`,font:F,size:19,color:'3A4E60'})]}));
capa.push(new Paragraph({spacing:{before:40},alignment:AlignmentType.CENTER,children:[
  new TextRun({text:`Versão ${M.versao}`,font:F,size:17,color:'6B7C8A'})]}));
capa.push(new Paragraph({children:[new PageBreak()]}));

/* ============================ ÍNDICE ============================ */
const indice=[H('Índice',HeadingLevel.HEADING_1,{sb:0}),
 new TableOfContents('Sumário',{hyperlink:true,headingStyleRange:'1-2'}),
 new Paragraph({children:[new PageBreak()]})];

/* ====================== 1 · IDENTIFICAÇÃO ====================== */
const body=[];
function sec(n,t,o={}){body.push(H(`${n}. ${t}`,HeadingLevel.HEADING_1,{pb:o.pb!==false,sb:0}));}
function sub(t){body.push(H(t,HeadingLevel.HEADING_2,{sz:22}));}
function par(t,o){body.push(P(t,{sz:20,sa:120,...o}));}
function nota(t){body.push(new Paragraph({spacing:{before:80,after:160},
 border:{left:{style:BorderStyle.SINGLE,size:12,color:C.green,space:8}},
 indent:{left:120},children:[new TextRun({text:t,size:18,font:F,italics:true,color:'3A4E60'})]}));}

sec(1,'Identificação da formação',{pb:false});
{const w=[2600,6426];
 const rows=[['Designação do curso',`${M.curso} — ${M.modulo}`],
  ['Entidade formadora',`${M.grupo} · ${M.inst}`],['Turma',M.turma],['Unidade',M.unidade],
  ['Ano lectivo',M.ano],['Duração','8 meses'],['Período do ciclo',`${M.ini} a ${M.fim}`],
  ['Regime','Terça-feira e quinta-feira, todas as semanas — regime específico deste ciclo, distinto do regime geral de semanas alternadas [a confirmar pela Direcção]'],
  ['Horário','08h00 – 12h15 (4 horas efectivas de formação + 15 minutos de intervalo)'],
  ['Dias lectivos',`${M.dias_uteis} (${M.dias_disc} de disciplinas + 8 de seminário)`],
  ['Carga horária',`${M.horas_total} horas — ${M.horas_disc} h de disciplinas e ${M.horas_sem} h de seminários`],
  ['Estrutura curricular','4 disciplinas técnicas simultâneas do 1.º ao 8.º mês + 8 seminários complementares'],
  ['Pré-requisito','Conclusão de Técnicas de Enfermagem, Farmacologia, Anatomia e Doenças Correntes'],
  ['Interrupção lectiva',`${M.rec[0]} a ${M.rec[1]}`],
  ['Estágio preliminar',`Apresentação a ${M.est_apres}, Hospital do Capalanga (Viana); estágio de ${M.est_ini} a ${M.est_fim}`],
  ['Defesa de fim de curso',M.defesa],['Autor',M.autor],['Versão',M.versao]];
 body.push(tbl(w,rows.map((r,i)=>new TableRow({children:[
  cell(P(r[0],{sz:17,b:true,c:C.navy,sa:0}),{w:w[0],fill:i%2===1?C.zebra:undefined}),
  cell(P(r[1],{sz:18,sa:0}),{w:w[1],fill:i%2===1?C.zebra:undefined})]}))));}

/* ====================== 2 · EQUIPA DOCENTE ====================== */
sec(2,'Equipa docente');
par('As quatro disciplinas técnicas deste ciclo são asseguradas por dois Técnicos de Enfermagem. Cada docente é responsável por duas disciplinas e lecciona-as no mesmo dia da semana, o que evita deslocações para blocos isolados de sessenta minutos.');
{const w=[1100,3900,2500,1526];
 const rows=d.ordem.map(k=>[k,d.disc[k].nome,d.disc[k].prof,d.disc[k].dia]);
 rows.push(['GEN','Gestão de Enfermagem','Prof. Santos Salote','Sábado']);
 rows.push(['PT','Projecto Tecnológico','Prof. Santos Salote','Sábado']);
 rows.push(['SEM','Seminários complementares','Formador(a) convidado(a) [a designar]','Alternado']);
 rows.push(['—','Supervisão de estágio (pela escola)','Edilson de Almeida','Conforme escala']);
 body.push(tbl(w,[headRow(['Sigla','Disciplina','Docente','Dia'],w),
  ...rows.map((r,i)=>dataRow(r,w,i,{b:[true,false,false,false]}))]));}
nota('Os seminários complementares são assegurados por formadores convidados das respectivas áreas, a designar pela Coordenação Pedagógica. Os dois Técnicos de Enfermagem não asseguram os seminários.');

/* ====================== 3 · INTRODUÇÃO ====================== */
sec(3,'Introdução');
par(`O presente documento estabelece o programa do ${M.modulo} do curso de ${M.curso} do ${M.inst}, para a turma ${M.turma} da Unidade do ${M.unidade}, no ano lectivo ${M.ano}, com a duração de oito meses.`);
par('Os formandos concluíram já as disciplinas de Técnicas de Enfermagem, Farmacologia, Anatomia e Doenças Correntes. Nenhuma delas é retomada como disciplina autónoma. Podem ser mobilizadas como pré-requisito, até ao limite de dez por cento da carga de cada disciplina, e sempre ligadas a um conteúdo novo — por exemplo, a revisão da técnica de administração endovenosa imediatamente antes da unidade de fluidoterapia no adulto.');
par('A estrutura assenta em quatro disciplinas técnicas leccionadas em simultâneo ao longo dos oito meses. Esta simultaneidade é deliberada: o aprofundamento faz-se por espiral e não por sequência fechada, de modo que uma competência introduzida no primeiro mês seja retomada, complexificada e reavaliada em contextos sucessivos até ao oitavo. Nenhuma disciplina termina antes do fim do ciclo.');
par(`A distribuição da carga horária privilegia a componente prática, que representa ${Math.round((d.ordem.reduce((a,k)=>a+d.disc[k].pratica,0)+M.sem_pratica)/M.horas_total*100)} por cento do total do ciclo. A selecção de conteúdos obedece à prioridade epidemiológica nacional: malária, incluindo a malária grave na criança e na grávida; doenças diarreicas e desidratação; infecções respiratórias agudas; malnutrição aguda; drepanocitose; VIH e prevenção da transmissão vertical; sífilis; tuberculose; hipertensão arterial e diabetes; pré-eclâmpsia e eclâmpsia; hemorragia pós-parto; sépsis materna e neonatal; traumatismos por acidentes de viação; queimaduras; intoxicações e mordeduras.`);
sub('Eixos transversais');
par('Quatro eixos atravessam as quatro disciplinas e são critérios de avaliação em todas as grelhas de observação, com estatuto eliminatório nos itens de segurança:');
body.push(...bullets(['Biossegurança e prevenção e controlo de infecção.','Segurança do doente.',
 'Ética e deontologia profissional.','Comunicação, humanização, registos de enfermagem e referência e contra-referência.']));
sub('Âmbito de competência do Técnico de Enfermagem');
par('O programa não apresenta como competência autónoma qualquer acto fora do perfil do Técnico de Enfermagem. A prescrição, a intubação endotraqueal, a desfibrilhação manual e a condução autónoma do parto não integram os objectivos deste ciclo. O Suporte Básico de Vida com desfibrilhador automático externo integra-o plenamente; o Suporte Avançado de Vida é abordado apenas na perspectiva da colaboração com a equipa diferenciada. Todos os procedimentos executados apenas em simulação ou sob supervisão estão assinalados como tal no cronograma e nos programas das disciplinas.');
nota('Referenciais técnicos: Organização Mundial da Saúde, abordagem integrada das doenças da infância, calendário vacinal nacional e normas do Ministério da Saúde. As designações são citadas na sua forma corrente, sem números de diplomas. Os calendários, esquemas terapêuticos e algoritmos devem ser confirmados e actualizados junto das normas em vigor antes do início da formação [a confirmar].');

/* ====================== 4 · OBJECTIVOS E PERFIL ====================== */
sec(4,'Objectivos do ciclo e perfil de saída');
sub('Objectivo geral');
par('Habilitar o formando a exercer as funções de Técnico de Enfermagem com autonomia técnica no âmbito da sua competência, prestando cuidados seguros, sistematizados e humanizados ao adulto, à mulher no ciclo gravídico-puerperal, ao recém-nascido e à criança, em contexto de internamento, de urgência e de cuidados de saúde primários, e delimitando com clareza os limites da sua intervenção.');
sub('Objectivos específicos do ciclo');
body.push(...bullets([
 'Consolidar e aprofundar as competências técnicas do ciclo anterior, aplicando-as a contextos clínicos completos.',
 'Instalar um método único e reprodutível de avaliação do doente, aplicável ao adulto, à grávida e à criança.',
 'Desenvolver a capacidade de reconhecimento precoce da deterioração clínica e de decisão sob restrição de tempo.',
 'Executar com segurança os procedimentos invasivos do âmbito do Técnico de Enfermagem.',
 'Transformar a biossegurança e a prevenção de infecção em comportamento sistemático.',
 'Desenvolver a comunicação profissional com o doente, a família e a equipa.',
 'Assegurar a qualidade, a legibilidade e a utilidade dos registos de enfermagem.',
 'Delimitar o limite da própria competência e referir em tempo útil.',
 'Complementar a formação técnica com língua portuguesa, psicologia, saúde mental e saúde colectiva.']));
sub('Perfil de saída');
par('No fim do ciclo, o formando:');
body.push(...bullets([
 'Presta cuidados de enfermagem ao adulto internado em serviço médico e cirúrgico, organizando o turno por prioridades.',
 'Reconhece a deterioração clínica e actua nos primeiros minutos de uma emergência.',
 'Acompanha a mulher na gravidez, colabora na assistência ao parto normal e presta os cuidados imediatos ao recém-nascido.',
 'Avalia, classifica e cuida da criança, decidindo entre tratar e referir.',
 'Aplica sistematicamente as medidas de biossegurança e de segurança do doente.',
 'Comunica com o doente, a família e a equipa e documenta a sua intervenção com rigor.',
 'Reconhece os limites da sua competência e refere em tempo útil.']));

/* ====================== 5 · METODOLOGIA ====================== */
sec(5,'Metodologia');
par('Todas as sessões combinam as modalidades abaixo. A regra de ouro do ciclo é que nenhum procedimento é dado por adquirido sem execução individual observada: a demonstração pelo formador nunca substitui a execução por cada formando contra uma lista de verificação com critérios explícitos.');
{const w=[2400,6626];
 const rows=[['Exposição dialogada','Abertura de cada tema com enquadramento breve, ancorado num caso clínico apresentado no início da sessão.'],
 ['Demonstração','Execução do procedimento pelo formador, primeiro em velocidade normal e depois decomposta em passos, com explicitação dos critérios de correcção.'],
 ['Técnicas práticas','Execução individual por todos os formandos, em manequim, modelo ou simulador, contra a lista de verificação do Anexo A.'],
 ['Simulação','Cenários com atribuição de funções, gestão de tempo e reunião de balanço estruturada no final.'],
 ['Estudo de casos','Casos clínicos reais anonimizados, trabalhados em grupo, com plano de cuidados escrito.'],
 ['Resolução de situações clínicas','Exercícios de decisão sob restrição de tempo e de recursos, com justificação obrigatória da conduta.'],
 ['Avaliação prática','Estações cronometradas com critérios eliminatórios de biossegurança.'],
 ['Revisão e consolidação','Blocos complementares dedicados à síntese, ao exercício de registo e à correcção comentada.']];
 body.push(tbl(w,[headRow(['Modalidade','Aplicação no ciclo'],w),
  ...rows.map((r,i)=>dataRow(r,w,i,{b:[true,false]}))]));}

/* ====================== 6 · PLANO CURRICULAR ====================== */
sec(6,'Plano curricular');
par('O ciclo é composto por quatro disciplinas técnicas e por oito seminários complementares. As quatro disciplinas estão presentes em todos os oito meses e nenhuma termina antes do fim do ciclo.');
{const w=[900,3300,1900,1000,1000,926];
 const rows=d.ordem.map(k=>{const x=d.disc[k];
  return [k,x.nome,x.prof,`${x.total} h`,hf(x.teorica),hf(x.pratica)];});
 rows.push(['SEM','Seminários complementares (8 × 4 h)','Convidados','32 h',hf(M.sem_teorica),hf(M.sem_pratica)]);
 ['GEN','PT'].forEach(k=>{const g=d.sabados.disc[k];
  rows.push([k,g.nome+' (sábados)','Santos Salote',hf(g.total),hf(g.teorica),hf(g.pratica)]);});
 const tt=M.horas_geral, ttT=hn(d.ordem.reduce((a,k)=>a+d.disc[k].teorica,0)+M.sem_teorica+d.sabados.disc.GEN.teorica+d.sabados.disc.PT.teorica);
 body.push(tbl(w,[headRow(['Sigla','Disciplina','Docente','Total','Teórica','Prática'],w),
  ...rows.map((r,i)=>dataRow(r,w,i,{b:[true,false,false,true,false,false],
    al:[null,null,null,AlignmentType.RIGHT,AlignmentType.RIGHT,AlignmentType.RIGHT]})),
  new TableRow({children:[cell(P('Total do ciclo',{b:true,sz:17,sa:0}),{w:w[0],cs:3,fill:C.box}),
   cell(P(`${tt} h`,{b:true,sz:17,sa:0,al:AlignmentType.RIGHT}),{w:w[3],fill:C.box}),
   cell(P(hf(ttT),{b:true,sz:17,sa:0,al:AlignmentType.RIGHT}),{w:w[4],fill:C.box}),
   cell(P(hf(tt-ttT),{b:true,sz:17,sa:0,al:AlignmentType.RIGHT}),{w:w[5],fill:C.box})]})]));}

sub('Mapa de unidades temáticas por mês');
par('Progressão do ciclo: meses 1 e 2, fundamentos, avaliação inicial do doente e procedimentos de base; meses 3 e 4, procedimentos e situações frequentes, com avaliação prática intercalar no fim do mês 4; meses 5 e 6, situações complexas e críticas; mês 7, integração em casos clínicos que cruzam disciplinas; mês 8, revisão, consolidação e avaliação final, sem conteúdo novo nas duas últimas semanas.');
{const w=[860,2042,2042,2042,2040];
 const rows=[];
 for(let m=1;m<=8;m++){
  const per=d.meses[m-1];
  rows.push(new TableRow({children:[cell(P(`Mês ${m}`,{b:true,sz:16,c:'FFFFFF',sa:0}),{w:w[0],fill:C.navy2}),
   cell(P(`${per.ini} – ${per.fim}`,{b:true,sz:16,c:'FFFFFF',sa:0}),{w:w[1],cs:4,fill:C.navy2})]}));
  const c=d.ordem.map(k=>{const u=d.disc[k].unidades.find(u=>u.mes===m);
   return [P(k,{b:true,sz:15,c:C.green,sa:20,caps:true,cs:20}),
           P(`U${u.num} — ${u.tit}`,{sz:15,sa:20}),
           P(`${u.horas} h`,{sz:14,i:true,c:'6B7C8A',sa:0})];});
  rows.push(new TableRow({children:[cell(P('',{sz:12,sa:0}),{w:w[0]}),
   ...c.map((x,j)=>cell(x,{w:w[j+1]}))]}));}
 body.push(tbl(w,rows));}

/* ====================== 7 · HORÁRIO E REGRA DOS TEMPOS ====================== */
sec(7,'Horário e regra dos tempos');
{const w=[2200,4700,2126];
 const rows=[['08h00 – 09h30','1.º tempo lectivo','90 min'],['09h30 – 09h45','Intervalo','15 min'],
  ['09h45 – 11h15','2.º tempo lectivo','90 min'],['11h15 – 12h15','Bloco complementar','60 min']];
 body.push(tbl(w,[headRow(['Horário','Designação','Duração'],w),
  ...rows.map((r,i)=>dataRow(r,w,i,{b:[true,false,false],al:[null,null,AlignmentType.RIGHT]})),
  new TableRow({children:[cell(P('08h00 – 12h15',{b:true,sz:17,c:'FFFFFF',sa:0}),{w:w[0],fill:C.navy}),
   cell(P('Formação efectiva',{b:true,sz:17,c:'FFFFFF',sa:0}),{w:w[1],fill:C.navy}),
   cell(P('240 min',{b:true,sz:17,c:'FFFFFF',sa:0,al:AlignmentType.RIGHT}),{w:w[2],fill:C.navy})]})]));}
sub('A regra dos noventa minutos');
par('Só o 1.º e o 2.º tempos são tempos lectivos, com noventa minutos cada. O período das 11h15 às 12h15 designa-se sempre bloco complementar e tem sessenta minutos. Em nenhum ponto deste programa o bloco complementar é designado como tempo lectivo, nem se atribui a qualquer tempo lectivo duração superior a noventa minutos.');
par('Os duzentos e quarenta minutos efectivos do dia não são divisíveis em dois blocos iguais de noventa minutos por disciplina. Atribuir rigorosamente dois tempos de cento e vinte minutos, um a cada disciplina, implicaria que o tempo lectivo passasse a ser de cento e vinte minutos e não de noventa. Mantendo-se a regra dos noventa minutos, a única distribuição consistente com a entrada às 08h00, a saída às 12h15 e o intervalo de quinze minutos é 180 mais 60: uma disciplina ocupa o 1.º e o 2.º tempos lectivos, e a outra ocupa o bloco complementar.');
sub('Ciclo de rotação');
par('Cada dia pertence a um só docente e às suas duas disciplinas. A terça-feira é o dia do Prof. Manuel Jorge Weber, com Enfermagem Médico-Cirúrgica e Urgência, Emergência e Primeiros Socorros. A quinta-feira é o dia do Prof. Eduardo David, com Saúde Materna, Obstétrica e Neonatal e Enfermagem Pediátrica e Saúde da Criança.');
{const w=[1500,3763,3763];
 const rows=[
  ['Semana A · Terça','EMC — 1.º e 2.º tempo (180 min)','UEPS — bloco complementar (60 min)'],
  ['Semana B · Terça','UEPS — 1.º e 2.º tempo (180 min)','EMC — bloco complementar (60 min)'],
  ['Semana A · Quinta','SMON — 1.º e 2.º tempo (180 min)','EPSC — bloco complementar (60 min)'],
  ['Semana B · Quinta','EPSC — 1.º e 2.º tempo (180 min)','SMON — bloco complementar (60 min)']];
 body.push(tbl(w,[headRow(['Semana','1.º e 2.º tempo lectivo','Bloco complementar'],w),
  ...rows.map((r,i)=>dataRow(r,w,i,{b:[true,false,false]}))]));}
par('Nas terças-feiras a rotação obedece a um ciclo de cinco semanas com a sequência A · A · B · A · B, com compensação nas duas últimas semanas do ciclo. Em cada ciclo de cinco semanas, Enfermagem Médico-Cirúrgica ocupa três vezes o bloco de cento e oitenta minutos e duas vezes o de sessenta; Urgência e Emergência faz o percurso inverso. Daqui resulta a repartição de 54,6 por cento para EMC e 45,4 por cento para UEPS, a mais próxima da proporção pretendida que os blocos de 180 e 60 minutos permitem atingir.');
par('Nas quintas-feiras a repartição é igual e a rotação obedece à alternância semanal simples A · B, de que resulta 50,9 por cento para SMON e 49,1 por cento para EPSC.');
par('Nos dias de seminário, o seminário ocupa o período das 08h00 às 12h15, incluindo o intervalo, e não há aulas das disciplinas.');
nota('Consequência a explicitar: com um docente por dia, o total de horas do Prof. Manuel Jorge Weber é igual ao do Prof. Eduardo David — 108 horas cada. A diferenciação de carga faz-se exclusivamente dentro de cada par de disciplinas. Atribuir mais horas totais ao conjunto EMC + UEPS exigiria a regra alternativa de ceder ao Prof. Weber uma quinta-feira por mês, o que lhe daria mais 32 horas e retiraria as mesmas 32 horas ao Prof. Eduardo David [decisão pendente da Direcção].');

/* ====================== 8 · CARGA HORÁRIA ====================== */
const nFer=d.feriados.filter(f=>f.efeito==='Dia de aula suprimido').length;
const nInt=4, nBrutos=M.dias_uteis+nFer+nInt;
const nTer=d.sessoes.filter(s=>s.disc==='EMC').length, nQui=d.sessoes.filter(s=>s.disc==='SMON').length;
sec(8,'Distribuição da carga horária');
sub('Tabela de verificação');
par('A contagem parte de todas as terças e quintas-feiras entre a primeira e a última aula, retira os feriados nacionais que nelas recaem, a interrupção lectiva e os oito dias de seminário, e multiplica os dias restantes por duzentos e quarenta minutos.');
{const w=[5600,1713,1713];
 const rows=[['Terças e quintas-feiras entre '+M.ini+' e '+M.fim,String(nBrutos),''],
  ['Menos: feriados nacionais em dia de aula','− '+nFer,''],
  ['Menos: interrupção lectiva de '+M.rec[0]+' a '+M.rec[1],'− '+nInt,''],
  ['Dias lectivos úteis',String(M.dias_uteis),M.dias_uteis*4+' h'],
  ['Menos: dias de seminário','− 8','− 32 h'],
  ['Dias de disciplinas',String(M.dias_disc),M.horas_disc+' h'],
  ['   dos quais terças-feiras (Prof. Manuel Jorge Weber)',String(nTer),nTer*4+' h'],
  ['   dos quais quintas-feiras (Prof. Eduardo David)',String(nQui),nQui*4+' h']];
 body.push(tbl(w,[headRow(['Linha de cálculo','Dias','Horas'],w),
  ...rows.map((r,i)=>dataRow(r,w,i,{al:[null,AlignmentType.CENTER,AlignmentType.RIGHT]})),
  new TableRow({children:[cell(P('Total geral do ciclo — disciplinas + seminários',{b:true,sz:17,c:'FFFFFF',sa:0}),{w:w[0],fill:C.navy}),
   cell(P(String(M.dias_uteis),{b:true,sz:17,c:'FFFFFF',sa:0,al:AlignmentType.CENTER}),{w:w[1],fill:C.navy}),
   cell(P(M.horas_total+' h',{b:true,sz:17,c:'FFFFFF',sa:0,al:AlignmentType.RIGHT}),{w:w[2],fill:C.navy})]})]));}
par(`Verificação: ${M.dias_disc} dias × 240 minutos = ${M.dias_disc*240} minutos = ${M.horas_disc} horas de disciplinas. Somadas as 32 horas dos oito seminários, o total do ciclo é de ${M.horas_total} horas.`);

sub('Horas por disciplina, com componente teórica e prática');
{const w=[900,3000,1100,1100,1100,1826];
 const rows=d.ordem.map(k=>{const x=d.disc[k];
  return [k,x.nome,`${x.total} h`,hf(x.teorica),hf(x.pratica),`${String(x.pct_pratica).replace('.',',')} %`];});
 const MIN={EMC:50,UEPS:60,SMON:50,EPSC:50};
 body.push(tbl(w,[headRow(['Sigla','Disciplina','Total','Teórica','Prática','% prática'],w),
  ...rows.map((r,i)=>dataRow(r,w,i,{b:[true,false,true,false,false,true],
   al:[null,null,AlignmentType.RIGHT,AlignmentType.RIGHT,AlignmentType.RIGHT,AlignmentType.RIGHT]}))]));
 par('Convenção de cálculo, aplicada de forma idêntica neste documento e na folha de verificação do ficheiro Excel: contam para a componente teórica os blocos teóricos, os teórico-práticos — exposição e demonstração da técnica — e os de avaliação escrita; contam para a componente prática os blocos de treino prático supervisionado e os de avaliação prática. É uma convenção conservadora: imputa à componente teórica a totalidade do bloco de demonstração, ainda que este tenha execução observada.',{sz:18,i:true});
 par('Componente prática mínima exigida: EMC 50 %, UEPS 60 %, SMON 50 %, EPSC 50 %. Todas as disciplinas cumprem o mínimo. A componente prática integra demonstração, prática laboratorial, simulação e avaliação prática.',{sz:18,i:true});}

sub('Repartição dentro de cada par de disciplinas');
par('A repartição foi definida pela extensão dos conteúdos e pela exigência de componente prática, e não por divisão aritmética do total disponível. Enfermagem Médico-Cirúrgica recebe a maior carga do par da terça-feira por cobrir todos os aparelhos e sistemas, o perioperatório e o doente crónico. Urgência e Emergência tem conteúdo teórico mais circunscrito mas exige repetição deliberada até à automatização, e por isso apresenta a maior proporção de treino prático. No par da quinta-feira, Saúde Materna e Enfermagem Pediátrica repartem a carga em partes praticamente iguais, por acumularem ambas três domínios clínicos distintos que não admitem compressão.');

sub('Presença das quatro disciplinas em cada um dos oito meses');
{const w=[860,1500,1000,1000,1000,1000,900,1766];
 const rows=[];
 for(let m=1;m<=8;m++){
  const per=d.meses[m-1];
  const h={};d.ordem.forEach(k=>{h[k]=d.sessoes.filter(s=>s.disc===k&&s.mes===m)
    .reduce((a,s)=>a+s.dur/60,0);});
  const sm=d.sessoes.filter(s=>s.disc==='SEM'&&s.mes===m).length*4;
  rows.push([`Mês ${m}`,`${per.ini}–${per.fim}`,...d.ordem.map(k=>h[k]),sm,
    d.ordem.reduce((a,k)=>a+h[k],0)+sm]);}
 const tot=d.ordem.map(k=>d.disc[k].total);
 body.push(tbl(w,[headRow(['Mês','Período','EMC','UEPS','SMON','EPSC','SEM','Total'],w),
  ...rows.map((r,i)=>dataRow(r,w,i,{b:[true,false,false,false,false,false,false,true],
   al:[null,null,...Array(6).fill(AlignmentType.CENTER)]})),
  new TableRow({children:[cell(P('Totais',{b:true,sz:16,c:'FFFFFF',sa:0}),{w:w[0],cs:2,fill:C.navy}),
   ...tot.map((t,j)=>cell(P(String(t),{b:true,sz:16,c:'FFFFFF',sa:0,al:AlignmentType.CENTER}),{w:w[j+2],fill:C.navy})),
   cell(P('32',{b:true,sz:16,c:'FFFFFF',sa:0,al:AlignmentType.CENTER}),{w:w[6],fill:C.navy}),
   cell(P(String(M.horas_total),{b:true,sz:16,c:'FFFFFF',sa:0,al:AlignmentType.CENTER}),{w:w[7],fill:C.navy})]})]));}
nota('A variação mensal de horas resulta do número de terças e quintas de cada mês, da interrupção lectiva e dos feriados nacionais que recaem em dia de aula. As quatro disciplinas estão presentes do 1.º ao 8.º mês.');

/* ====================== 9–12 · PROGRAMAS ====================== */
d.ordem.forEach((k,idx)=>{
 const x=d.disc[k];
 sec(9+idx,`Programa — ${x.nome} (${k})`);
 {const w=[2255,2255,2258,2258];
  body.push(tbl(w,[new TableRow({children:[
   [x.total+' h','Carga total'],[hf(x.teorica),'Componente teórica'],
   [hf(x.pratica),'Componente prática'],[String(x.pct_pratica).replace('.',',')+' %','Proporção prática']]
   .map((c,j)=>cell([P(c[0],{b:true,sz:26,c:'FFFFFF',al:AlignmentType.CENTER,sa:20,f:FS}),
     P(c[1],{sz:14,c:'C9DDEE',al:AlignmentType.CENTER,sa:0,caps:true,cs:20})],
     {w:w[j],fill:C.navy,mt:100,mb:100}))})]));}
 par(`Docente: ${x.prof} · Dia: ${x.dia} · ${d.sessoes.filter(s=>s.disc===k).length} sessões distribuídas do 1.º ao 8.º mês.`,{i:true,sz:18});
 sub('Fundamentação'); par(x.fund);
 sub('Pré-requisitos mobilizados'); par(x.pre);
 sub('Objectivo geral'); par(x.objg);
 sub('Objectivos específicos'); par('No fim da disciplina, o formando é capaz de:');
 body.push(...bullets(x.obje));
 sub('Competências');
 par('Cognitivas',{b:true,sz:18,sa:40}); body.push(...bullets(x.comp_cog));
 par('Procedimentais',{b:true,sz:18,sa:40}); body.push(...bullets(x.comp_proc));
 par('Atitudinais',{b:true,sz:18,sa:40}); body.push(...bullets(x.comp_atit));
 sub('Competências de saída verificáveis'); body.push(...bullets(x.saida));
 sub('Unidades temáticas, conteúdos e carga horária');
 {const w=[700,760,5800,1766];
  body.push(tbl(w,[headRow(['Un.','Mês','Unidade temática e conteúdos','Carga'],w),
   ...x.unidades.map((u,i)=>new TableRow({children:[
    cell(P(u.num,{b:true,sz:16,al:AlignmentType.CENTER,sa:0}),{w:w[0],fill:i%2?C.zebra:undefined}),
    cell(P(String(u.mes),{sz:16,al:AlignmentType.CENTER,sa:0}),{w:w[1],fill:i%2?C.zebra:undefined}),
    cell([P(u.tit,{b:true,sz:17,sa:30}),P(u.cont,{sz:16,c:'3A4E60',sa:0})],
     {w:w[2],fill:i%2?C.zebra:undefined}),
    cell(P(u.horas+' h',{sz:16,al:AlignmentType.RIGHT,sa:0}),{w:w[3],fill:i%2?C.zebra:undefined})]})),
   new TableRow({children:[cell(P('Carga horária total da disciplina',{b:true,sz:16,c:'FFFFFF',sa:0}),{w:w[0],cs:3,fill:C.navy}),
    cell(P(x.total+' h',{b:true,sz:16,c:'FFFFFF',sa:0,al:AlignmentType.RIGHT}),{w:w[3],fill:C.navy})]})]));}
 sub('Técnicas e procedimentos');
 par('Cada procedimento é avaliado contra a lista de verificação indicada, reproduzida no Anexo A.');
 {const w=[1400,7626];
  body.push(tbl(w,[headRow(['Código','Procedimento'],w),
   ...x.listas.map((l,i)=>dataRow([l.cod,l.tit],w,i,{b:[true,false]}))]));}
 sub('Metodologia'); par(x.metod);
 sub('Materiais e recursos didácticos');
 par('Disponível nos laboratórios',{b:true,sz:18,sa:40}); par(x.mat_disp);
 par('A adquirir [a confirmar]',{b:true,sz:18,sa:40}); par(x.mat_adq);
 sub('Sistema de avaliação da disciplina');
 par('Aplica-se a ponderação geral do capítulo 14: assiduidade 5 %, participação 5 %, trabalhos e estudos de caso 15 %, testes escritos 20 %, demonstrações e avaliações práticas 30 %, avaliação final teórico-prática 25 %. A disciplina realiza dois testes escritos — no mês 3 e no mês 6 —, uma avaliação prática intercalar no mês 4 e a avaliação final no mês 8. A componente prática é eliminatória: sem média igual ou superior a 10 valores na componente prática não há aprovação na disciplina.');
 sub('Avaliação prática'); par(x.avalp);
 sub('Resultados esperados'); par(x.result);
});

/* ====================== 13 · SEMINÁRIOS ====================== */
const SEMPROG={
 'Língua Portuguesa I':['08h00–09h30  Ortografia, construção frásica e clareza aplicadas ao contexto de saúde','09h30–09h45  Intervalo','09h45–11h15  Terminologia técnica de enfermagem e abreviaturas aceites','11h15–12h15  Oficina: correcção de textos clínicos anonimizados e ficha-síntese'],
 'Psicologia I':['08h00–09h30  Escuta activa, empatia e presença profissional','09h30–09h45  Intervalo','09h45–11h15  Comunicação com o doente e a família; barreiras culturais e linguísticas','11h15–12h15  Oficina: dramatização de situações de acolhimento e ficha-síntese'],
 'Saúde Colectiva I':['08h00–09h30  Determinantes sociais da saúde','09h30–09h45  Intervalo','09h45–11h15  Noções de epidemiologia e promoção da saúde','11h15–12h15  Oficina: planeamento de uma acção de promoção da saúde e ficha-síntese'],
 'Saúde Mental I':['08h00–09h30  Saúde mental, sofrimento psíquico e desmistificação do estigma','09h30–09h45  Intervalo','09h45–11h15  Sinais de alerta de ansiedade, depressão e psicose','11h15–12h15  Oficina: primeiros socorros psicológicos e ficha-síntese'],
 'Língua Portuguesa II':['08h00–09h30  Estrutura do registo de enfermagem e do relatório de ocorrência','09h30–09h45  Intervalo','09h45–11h15  Passagem de turno escrita: método e concisão','11h15–12h15  Oficina: redacção e correcção de registos avaliados e ficha-síntese'],
 'Psicologia II':['08h00–09h30  Stress ocupacional, fadiga por compaixão e burnout','09h30–09h45  Intervalo','09h45–11h15  Acompanhamento do doente e da família em processo de luto','11h15–12h15  Oficina: comunicação de más notícias e plano de autocuidado'],
 'Saúde Colectiva II':['08h00–09h30  Vigilância epidemiológica e doenças de notificação obrigatória','09h30–09h45  Intervalo','09h45–11h15  Água, saneamento e prevenção da doença diarreica e da cólera','11h15–12h15  Oficina: concepção de uma sessão comunitária e ficha-síntese'],
 'Saúde Mental II':['08h00–09h30  Abordagem inicial da pessoa em crise e contenção verbal','09h30–09h45  Intervalo','09h45–11h15  Álcool e outras substâncias; intoxicação e síndrome de privação','11h15–12h15  Oficina: estudo de casos e decisão de encaminhamento'],
};
const SEMOBJ={
 'Língua Portuguesa I':'Redigir com clareza e correcção em contexto de saúde e exprimir-se oralmente com rigor perante a equipa.',
 'Psicologia I':'Estabelecer uma relação de ajuda com o doente e a família e adequar a comunicação ao estado emocional do interlocutor.',
 'Saúde Colectiva I':'Relacionar os determinantes sociais com o estado de saúde da população e interpretar indicadores epidemiológicos básicos.',
 'Saúde Mental I':'Identificar sinais de alerta em saúde mental e aplicar os primeiros socorros psicológicos.',
 'Língua Portuguesa II':'Elaborar registos de enfermagem, relatórios e passagens de turno escritas completos e legíveis.',
 'Psicologia II':'Reconhecer sinais de esgotamento profissional, acompanhar processos de luto e comunicar más notícias.',
 'Saúde Colectiva II':'Executar a notificação de doenças e planear uma acção de educação para a saúde na comunidade.',
 'Saúde Mental II':'Abordar em segurança a pessoa em crise e encaminhar situações relacionadas com álcool e outras substâncias.',
};
sec(13,'Plano dos seminários complementares');
par('Os seminários cobrem áreas indispensáveis ao exercício profissional que não constituem disciplinas regulares deste ciclo. Realiza-se um seminário por mês, ocupando integralmente o período das 08h00 às 12h15, incluindo o intervalo. Cada área é tratada em dois seminários, o primeiro de fundamentos e o segundo de aplicação. Quatro seminários realizam-se à terça-feira e quatro à quinta-feira, de modo que cada docente ceda exactamente quatro dias.');
{const w=[700,1500,1900,3300,1626];
 body.push(tbl(w,[headRow(['N.º','Data','Dia','Seminário e foco','Duração'],w),
  ...d.seminarios.map((s,i)=>new TableRow({children:[
   cell(P(String(s.n),{b:true,sz:16,al:AlignmentType.CENTER,sa:0}),{w:w[0],fill:i%2?C.zebra:undefined}),
   cell(P(s.data,{sz:16,sa:0}),{w:w[1],fill:i%2?C.zebra:undefined}),
   cell(P(s.dia,{sz:16,sa:0}),{w:w[2],fill:i%2?C.zebra:undefined}),
   cell([P(s.area,{b:true,sz:16,sa:20}),P(s.tema,{sz:15,c:'3A4E60',sa:0})],{w:w[3],fill:i%2?C.zebra:undefined}),
   cell(P('4 h',{sz:16,al:AlignmentType.RIGHT,sa:0}),{w:w[4],fill:i%2?C.zebra:undefined})]})),
  new TableRow({children:[cell(P('Total dos seminários complementares',{b:true,sz:16,c:'FFFFFF',sa:0}),{w:w[0],cs:4,fill:C.navy}),
   cell(P('32 h',{b:true,sz:16,c:'FFFFFF',sa:0,al:AlignmentType.RIGHT}),{w:w[4],fill:C.navy})]})]));}
sub('Programa de cada seminário');
d.seminarios.forEach(s=>{
 body.push(H(`Seminário ${s.n} — ${s.area}`,HeadingLevel.HEADING_3,{sz:20,sb:200,sa:60}));
 par(`${s.data} · ${s.dia} · 4 horas · Formador(a) convidado(a) [a designar]`,{i:true,sz:17,sa:60});
 par(`Tema: ${s.tema}`,{sz:18,sa:60});
 par(`Objectivo: ${SEMOBJ[s.area]}`,{sz:18,sa:60});
 par('Programa:',{b:true,sz:17,sa:40});
 body.push(...bullets(SEMPROG[s.area],{sz:17}));
 par('Metodologia: exposição dialogada, discussão em grupo e oficina prática. Evidência de participação: ficha-síntese individual entregue no fim da sessão.',{sz:17,i:true,sa:160});
});
nota('Os seminários são de frequência obrigatória e registada. A participação conta para a componente de participação da avaliação contínua, mas os seminários não constituem disciplina autónoma e não entram na média das quatro disciplinas técnicas [proposta a confirmar pela Direcção].');

/* ====================== 14 · AVALIAÇÃO ====================== */

/* ============ 14 · GESTÃO DE ENFERMAGEM E PROJECTO TECNOLÓGICO ============ */
const SAB=d.sabados;
sec(14,'Gestão de Enfermagem e Projecto Tecnológico');
par(`Além das quatro disciplinas técnicas e dos seminários, o ciclo integra duas disciplinas leccionadas ao sábado: Gestão de Enfermagem e Projecto Tecnológico. Ambas são asseguradas pelo ${SAB.prof}, que é simultaneamente o tutor dos trabalhos de fim de curso.`);
par(`Decorrem em ${SAB.n} sábados, de ${SAB.ini} a ${SAB.fim}, das 08h00 às 16h00, num total de ${hf(SAB.horas)}. Esta carga é autónoma: não integra as ${M.horas_total} horas das disciplinas técnicas e dos seminários, e as duas disciplinas têm avaliação e pauta próprias.`);
sub('Horário do sábado');
{const w=[2200,2600,2500,1726];
 const rows=SAB.horario.map(h=>[h.hor, h.tp, h.disc==='—'?'Intervalo':(h.disc==='GEN'?'Gestão de Enfermagem':'Projecto Tecnológico'), `${h.dur} min`]);
 body.push(tbl(w,[headRow(['Horário','Bloco','Disciplina','Duração'],w),
  ...rows.map((r,i)=>dataRow(r,w,i,{b:[true,false,false,false],al:[null,null,null,AlignmentType.RIGHT]})),
  new TableRow({children:[cell(P('08h00 – 16h00',{b:true,sz:17,c:'FFFFFF',sa:0}),{w:w[0],fill:C.navy}),
   cell(P('Formação efectiva (descontado o intervalo de 30 minutos)',{b:true,sz:17,c:'FFFFFF',sa:0}),{w:w[1],cs:2,fill:C.navy}),
   cell(P('450 min',{b:true,sz:17,c:'FFFFFF',sa:0,al:AlignmentType.RIGHT}),{w:w[3],fill:C.navy})]})]));}
par('Gestão de Enfermagem ocupa a manhã, em dois tempos de 120 minutos, e Projecto Tecnológico ocupa a tarde, num bloco contínuo de 210 minutos. A partir de Janeiro de 2027, o bloco de projecto acolhe também as pré-defesas.');
sub('Carga horária');
{const w=[900,3400,1400,1400,1926];
 const rows=['GEN','PT'].map(k=>{const g=SAB.disc[k];
  return [k,g.nome,hf(g.total),hf(g.teorica),hf(g.pratica)+` (${String(g.pct_pratica).replace('.',',')} %)`];});
 body.push(tbl(w,[headRow(['Sigla','Disciplina','Total','Teórica','Prática'],w),
  ...rows.map((r,i)=>dataRow(r,w,i,{b:[true,false,true,false,false],
   al:[null,null,AlignmentType.RIGHT,AlignmentType.RIGHT,AlignmentType.RIGHT]})),
  new TableRow({children:[cell(P('Total da componente de sábado',{b:true,sz:16,c:'FFFFFF',sa:0}),{w:w[0],cs:2,fill:C.navy}),
   cell(P(hf(SAB.horas),{b:true,sz:16,c:'FFFFFF',sa:0,al:AlignmentType.RIGHT}),{w:w[2],fill:C.navy}),
   cell(P('',{sz:16,sa:0}),{w:w[3],fill:C.navy}),cell(P('',{sz:16,sa:0}),{w:w[4],fill:C.navy})]})]));}
['GEN','PT'].forEach(k=>{const g=SAB.disc[k];
 sub(`Unidades temáticas — ${g.nome}`);
 const w=[700,5900,2426];
 body.push(tbl(w,[headRow(['Un.','Unidade temática e conteúdos','Carga'],w),
  ...g.unidades.map((u,i)=>new TableRow({children:[
   cell(P(u.num,{b:true,sz:16,al:AlignmentType.CENTER,sa:0}),{w:w[0],fill:i%2?C.zebra:undefined}),
   cell([P(u.tit,{b:true,sz:17,sa:30}),P(u.cont,{sz:16,c:'3A4E60',sa:0})],{w:w[1],fill:i%2?C.zebra:undefined}),
   cell(P(hf(u.horas),{sz:16,al:AlignmentType.RIGHT,sa:0}),{w:w[2],fill:i%2?C.zebra:undefined})]})),
  new TableRow({children:[cell(P('Total',{b:true,sz:16,c:'FFFFFF',sa:0}),{w:w[0],cs:2,fill:C.navy}),
   cell(P(hf(g.total),{b:true,sz:16,c:'FFFFFF',sa:0,al:AlignmentType.RIGHT}),{w:w[2],fill:C.navy})]})]));});
sub('Sessões');
{const w=[1100,900,700,4400,1926];
 const rows=[headRow(['Data','Disc.','Un.','Tema da sessão','Dur.'],w)];
 SAB.sessoes.forEach((x,i)=>{rows.push(new TableRow({children:[
  cell(P(x.dstr.slice(0,5),{sz:14,sa:0,b:x.disc==='GEN'}),{w:w[0],fill:x.predefesa?C.mark2||C.box:(i%2?C.zebra:undefined)}),
  cell(P(x.disc,{b:true,sz:14,sa:0,c:C.green}),{w:w[1],fill:i%2?C.zebra:undefined}),
  cell(P(x.unidade,{sz:13,al:AlignmentType.CENTER,sa:0}),{w:w[2],fill:i%2?C.zebra:undefined}),
  cell(P(x.tema,{sz:14,sa:0}),{w:w[3],fill:i%2?C.zebra:undefined}),
  cell(P(`${x.dur}′`,{sz:13,al:AlignmentType.RIGHT,sa:0}),{w:w[4],fill:i%2?C.zebra:undefined})]}));});
 body.push(tbl(w,rows));}
nota(`Avaliação: as duas disciplinas têm avaliação e pauta próprias, independentes das quatro disciplinas técnicas. O Dia do Trabalhador, a ${SAB.dia_trabalhador}, é ocupado por uma actividade organizada por professores e formandos, e conta como sessão. A tutoria do Projecto Tecnológico é paga em acto único de 18.000 Kz e os manuais de apoio custam 10.000 Kz, conforme o capítulo 21.`);

/* ==================== 15 · ESTÁGIOS ==================== */
sec(15,'Estágio preliminar e estágio curricular');
par('O ciclo integra dois estágios distintos. O estágio preliminar decorre em paralelo com as aulas, nos dias em que não há formação em sala. O estágio curricular é o estágio principal do curso.');
{const w=[2000,3500,3526];
 const L=[['Designação','estagios',0],['Local','local'],['Apresentação','apresentacao'],
  ['Início','ini'],['Termo','fim'],['Duração','duracao'],['Dias','dias'],
  ['Horas por dia','horas_dia'],['Carga horária','carga'],['Supervisão pela escola','supervisor'],
  ['Tutoria no serviço','tutor'],['Peso na avaliação','peso']];
 const rows=[headRow(['','Estágio preliminar','Estágio curricular'],w)];
 L.forEach((l,i)=>{ if(l[1]==='estagios') return;
  const a=d.estagios[0][l[1]], b=d.estagios[1][l[1]];
  rows.push(new TableRow({children:[
   cell(P(l[0],{b:true,sz:16,sa:0}),{w:w[0],fill:i%2?C.zebra:undefined}),
   cell(P(a===null?'—':String(a),{sz:16,sa:0}),{w:w[1],fill:i%2?C.zebra:undefined}),
   cell(P(b===null?'—':String(b),{sz:16,sa:0}),{w:w[2],fill:i%2?C.zebra:undefined})]}));});
 rows.push(new TableRow({children:[
  cell(P('Custo',{b:true,sz:16,c:'FFFFFF',sa:0}),{w:w[0],fill:C.navy}),
  cell(P(`${nf(d.estagios[0].preco)} Kz`,{b:true,sz:16,c:'FFFFFF',sa:0}),{w:w[1],fill:C.navy}),
  cell(P(`${nf(d.estagios[1].preco)} Kz`,{b:true,sz:16,c:'FFFFFF',sa:0}),{w:w[2],fill:C.navy})]}));
 body.push(tbl(w,rows));}
sub('Documentos a entregar no fim de cada estágio');
body.push(...bullets(d.estagio_docs));
nota(`${d.estagios[0].inclui} ${d.estagios[0].seguro} A carga horária efectiva de ambos os estágios depende da escala de serviço de cada unidade hospitalar e será fixada em anexo próprio logo que as escalas sejam recebidas [a confirmar].`);

/* ==================== 16 · PRÉ-DEFESAS E DEFESA ==================== */
sec(16,'Pré-defesas e defesa de fim de curso');
par(`O trabalho de fim de curso é elaborado em grupo. ${d.defesa.grupo}. ${d.defesa.formato}`);
sub('Calendário');
{const w=[3600,2200,3226];
 const rows=[];
 d.defesa.predefesas.forEach((x,i)=>rows.push([`${i+1}.ª pré-defesa`,x,'Sábado, no bloco de projecto']));
 rows.push(['Entrega do trabalho escrito',d.defesa.entrega,'Um mês antes da defesa']);
 rows.push(['Defesa de fim de curso',d.defesa.data,'Perante júri da escola-mãe']);
 rows.push(['Recurso da defesa',d.defesa.recurso,'Quinze dias após a defesa']);
 body.push(tbl(w,[headRow(['Momento','Data','Observações'],w),
  ...rows.map((r,i)=>dataRow(r,w,i,{b:[true,true,false]}))]));}
sub('Júri e documentação');
body.push(...bullets([d.defesa.juri,
 'O trabalho escrito é entregue um mês antes da data da defesa.',
 'Não é admitido à defesa o formando com mensalidades em atraso.',
 'As taxas de mesa de júri, sala de defesa e faixa de finalista constam do capítulo 21.',
 'O recurso da defesa realiza-se quinze dias após a defesa e está sujeito a taxa própria.']));

sec(17,'Sistema de avaliação');
par('A avaliação é contínua e de natureza maioritariamente prática. Aplica-se a escala de 0 a 20 valores, com aprovação a partir de 10 valores.');
{const w=[3400,4400,1226];
 const rows=[['Assiduidade','Presença registada por sessão.','5 %'],
  ['Participação','Envolvimento nas demonstrações e nas sessões práticas e nos seminários.','5 %'],
  ['Trabalhos e estudos de caso','Um estudo de caso escrito por disciplina, com plano de cuidados e registos de enfermagem.','15 %'],
  ['Testes escritos (2)','Teste 1 no mês 3 e teste 2 no mês 6, aplicados no bloco complementar.','20 %'],
  ['Demonstrações e avaliações práticas','Avaliação contínua por lista de verificação ao longo de todas as unidades, mais a avaliação prática intercalar do mês 4.','30 %'],
  ['Avaliação final teórico-prática','Estações práticas e componente escrita, no mês 8.','25 %']];
 body.push(tbl(w,[headRow(['Componente','Descrição','Peso'],w),
  ...rows.map((r,i)=>dataRow(r,w,i,{b:[true,false,true],al:[null,null,AlignmentType.RIGHT]})),
  new TableRow({children:[cell(P('Classificação final da disciplina',{b:true,sz:17,c:'FFFFFF',sa:0}),{w:w[0],cs:2,fill:C.navy}),
   cell(P('100 %',{b:true,sz:17,c:'FFFFFF',sa:0,al:AlignmentType.RIGHT}),{w:w[2],fill:C.navy})]})]));}
sub('Regras de aprovação');
body.push(...bullets([
 'Escala de classificação de 0 a 20 valores; aprovação com classificação final igual ou superior a 10 valores.',
 'A componente prática é eliminatória: sem média igual ou superior a 10 valores na componente prática não há aprovação na disciplina, qualquer que seja a média das restantes componentes.',
 'A falha em qualquer critério eliminatório de biossegurança ou de segurança do doente numa estação prática anula a estação, independentemente da execução técnica.',
 M.assiduidade,
 'Frequência obrigatória e registada dos oito seminários e das sessões de sábado.',
 'Gestão de Enfermagem e Projecto Tecnológico têm avaliação e pauta próprias, independentes das quatro disciplinas técnicas.',
 'A componente de estágio é classificada autonomamente: o estágio preliminar vale 60 % e o estágio curricular 40 % dessa classificação.',
 'Não é admitido à defesa de fim de curso o formando com mensalidades em atraso.',
 'Cada avaliação prática dispõe de grelha de observação ou lista de verificação, reproduzidas nos Anexos A e B.',
 'Situação académica final expressa nas categorias em uso nas pautas: APROVADO, EM RECURSO ou PROVA PENDENTE [a confirmar se aplicável a este módulo].',
 'Recurso: data e condições a definir pela Direcção [a confirmar].']));
sub('Calendário das avaliações');
{const w=[2400,2200,4426];
 const rows=[['Teste escrito 1','Mês 3','Unidades I a III de cada disciplina, no bloco complementar de 60 minutos'],
  ['Avaliação prática intercalar','Mês 4','Estações com lista de verificação, no fim do mês 4'],
  ['Teste escrito 2','Mês 6','Unidades IV a VI de cada disciplina, no bloco complementar de 60 minutos'],
  ['Avaliação final teórico-prática','Mês 8','Duas últimas semanas do ciclo, sem conteúdo novo'],
  ['Pré-defesas','Janeiro a Maio de 2027','Cinco pré-defesas aos sábados, no bloco de projecto'],
  ['Entrega do trabalho de fim de curso',d.defesa.entrega,'Um mês antes da defesa'],
  ['Defesa de fim de curso',d.defesa.data,'Perante júri da escola-mãe'],
  ['Recurso por disciplina','Após a publicação das pautas','Entre uma semana após as provas e 15 dias após a publicação'],
  ['Recurso da defesa',d.defesa.recurso,'Quinze dias após a defesa']];
 body.push(tbl(w,[headRow(['Momento','Período','Âmbito'],w),
  ...rows.map((r,i)=>dataRow(r,w,i,{b:[true,true,false]}))]));}

/* ====================== 15 · CALENDÁRIO (paisagem) ====================== */
const cal=[];
const FILL={aula:C.aula,sem:C.sem,fer:C.fer,rec:C.fer,gest:C.gest,est:C.est,sab:C.sab,def:C.defe,normal:null};
const DIAS=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
cal.push(H('18. Calendário lectivo',HeadingLevel.HEADING_1,{sb:0}));
function legenda(){
 const it=[['Dia de aula',C.aula],['Seminário',C.sem],['Sábado GEN/PT',C.sab],
  ['Estágio',C.est],['Feriado / interrupção',C.fer],['Defesa',C.defe]];
 const w=Array(it.length*2).fill(0).map((_,i)=>i%2===0?380:2066);
 return tbl(w,[new TableRow({children:it.flatMap((x,i)=>[
  cell(P('',{sz:12,sa:0}),{w:380,fill:x[1],borders:allThin('9AA7B2')}),
  cell(P(x[0],{sz:13,sa:0}),{w:2066,borders:noB})])})]);}
d.calendario.forEach((mm,mi)=>{
 cal.push(new Paragraph({spacing:{before:mi===0?120:0,after:100},pageBreakBefore:mi>0,
  children:[new TextRun({text:`${mm.nome} de ${mm.ano}`,font:FS,size:30,bold:true,color:C.navy}),
   new TextRun({text:`      ${mm.ndias} dias lectivos  ·  ${mm.horas} horas`,font:F,size:18,color:'6B7C8A'})]}));
 cal.push(legenda());
 cal.push(P('',{sz:8,sa:60}));
 const w=Array(7).fill(2096);
 const rows=[new TableRow({tableHeader:true,children:DIAS.map(x=>cell(
  P(x,{b:true,sz:15,c:'FFFFFF',al:AlignmentType.CENTER,caps:true,cs:20,sa:0}),{w:2096,fill:C.navy}))})];
 for(let i=0;i<mm.cells.length;i+=7){
  const wk=mm.cells.slice(i,i+7); while(wk.length<7) wk.push(null);
  rows.push(new TableRow({height:{value:1000,rule:'atLeast'},children:wk.map(c=>{
   if(!c) return cell(P('',{sz:12,sa:0}),{w:2096,fill:'FAFBFC'});
   const kids=[P(String(c.d),{b:true,sz:18,sa:20,c:c.tipo==='normal'?'6B7C8A':'1A1A1A'})];
   if(c.txt) kids.push(P(c.txt,{sz:13,sa:0,b:c.tipo==='aula'||c.tipo==='sem'}));
   if(c.av) kids.push(P(c.av,{sz:13,b:true,c:'AA3322',sa:0}));
   return cell(kids,{w:2096,fill:FILL[c.tipo]||undefined,mt:60,mb:60});})}));}
 cal.push(tbl(w,rows));
 const res=Object.keys(mm.resumo).sort().map(k=>`${k} ${mm.resumo[k]} h`).join('  ·  ');
 cal.push(P(`Resumo do mês: ${mm.ndias} dias lectivos${mm.nsem?`, ${mm.nsem} de seminário`:''}${mm.nsab?`, ${mm.nsab} sábados`:''}  ·  ${res}${mm.nsem?`  ·  SEM ${mm.nsem*4} h`:''}${mm.nsab?`  ·  GEN/PT ${hf(mm.nsab*7.5)}`:''}  ·  total ${hf(mm.horas)}`,
  {sz:15,i:true,c:'3A4E60',sb:100,sa:0}));
});
cal.push(new Paragraph({children:[new PageBreak()]}));
cal.push(H('Feriados e interrupções lectivas',HeadingLevel.HEADING_2,{sz:22,sb:0}));
cal.push(P(`Interrupção lectiva de Natal e Ano Novo: de ${M.rec[0]} a ${M.rec[1]}.`,{sz:19}));
{const w=[2000,2600,5400,4678];
 cal.push(tbl(w,[headRow(['Data','Dia','Feriado','Efeito no calendário'],w),
  ...d.feriados.map((f,i)=>dataRow([f.data,f.dia,f.nome,f.efeito],w,i,{b:[true,false,false,false]}))]));}
cal.push(P('As datas de feriado devem ser confirmadas junto do calendário oficial publicado para o ano civil correspondente, incluindo eventuais pontes e tolerâncias de ponto. Qualquer alteração implica a reposição do dia lectivo suprimido, a agendar pela Coordenação Pedagógica [a confirmar].',{sz:17,i:true,sb:120}));
cal.push(H('Estágio preliminar e eixo de sábados',HeadingLevel.HEADING_2,{sz:22}));
cal.push(P(`Estágio preliminar no Hospital do Capalanga, em Viana. Apresentação dos formandos ao local de estágio a ${M.est_apres}. O estágio decorre de ${M.est_ini} a ${M.est_fim}, ocupando os dias em que não há aulas — segundas, quartas e sextas-feiras —, semana após semana. Na janela indicada existem 25 dias úteis disponíveis, já descontados os feriados de 02/11/2026 e 11/11/2026.`,{sz:19}));
cal.push(P('O pedido refere três meses de estágio, mas a janela de 05/10/2026 a 05/12/2026 corresponde a dois meses e um dia. Mantém-se a janela indicada. A três meses, o estágio terminaria a 05/01/2027, dentro da interrupção lectiva [a confirmar pela Direcção]. Falta ainda definir o número de dias por semana, o turno, a carga horária diária, a supervisão e o peso na avaliação [a confirmar].',{sz:17,i:true}));
cal.push(P(`Gestão e Projecto Tecnológico decorre ao primeiro sábado de cada mês, das 08h00 às 16h00, a partir de Dezembro: ${M.gestao.join(' · ')}. A sessão de 01/05/2027 coincide com o Dia do Trabalhador e carece de transferência. O termo do eixo, o docente e a inclusão da carga no total do ciclo estão por definir [a confirmar].`,{sz:19}));

/* ====================== 16 · CRONOGRAMA (retrato) ====================== */
const fim2=[];
fim2.push(H('19. Cronograma detalhado',HeadingLevel.HEADING_1,{sb:0}));
fim2.push(P('Resumo por sessão. A versão completa, bloco a bloco, com horário e professor, consta do ficheiro Excel que acompanha este programa. Nas terças-feiras lecciona o Prof. Manuel Jorge Weber; nas quintas-feiras, o Prof. Eduardo David. Tipo: T teórica · TP teórico-prática · P prática · Avaliação.',{sz:18,i:true}));
{const w=[560,1080,900,1180,720,3860,726];
 const rows=[headRow(['N.º','Data','Dia','Tempo','Disc.','Unidade e tema','Dur.'],w)];
 let m=0;
 d.sessoes.forEach((s,i)=>{
  if(s.mes!==m){m=s.mes;const per=d.meses[m-1];
   rows.push(new TableRow({children:[cell(P(`MÊS ${m}  ·  ${per.ini} – ${per.fim}`,
    {b:true,sz:16,c:'FFFFFF',sa:0,caps:true,cs:20}),{w:w[0],cs:7,fill:C.navy2})]}));}
  rows.push(new TableRow({children:[
   cell(P(String(i+1),{sz:14,al:AlignmentType.CENTER,sa:0}),{w:w[0],fill:i%2?C.zebra:undefined}),
   cell(P(s.dstr.slice(0,5),{sz:14,sa:0}),{w:w[1],fill:i%2?C.zebra:undefined}),
   cell(P(s.dia.slice(0,5),{sz:14,sa:0}),{w:w[2],fill:i%2?C.zebra:undefined}),
   cell(P(s.dur===180?'1.º+2.º':(s.dur===60?'Compl.':'Seminário'),{sz:13,sa:0}),{w:w[3],fill:i%2?C.zebra:undefined}),
   cell(P(s.disc,{b:true,sz:14,sa:0,c:C.green}),{w:w[4],fill:i%2?C.zebra:undefined}),
   cell([P(`U${s.unidade} — ${s.unidade_tit}`,{sz:12,c:'6B7C8A',sa:10}),P(s.tema,{sz:14,sa:0})],
     {w:w[5],fill:i%2?C.zebra:undefined}),
   cell(P(`${s.dur}′`,{sz:13,al:AlignmentType.RIGHT,sa:0}),{w:w[6],fill:i%2?C.zebra:undefined})]}));});
 fim2.push(tbl(w,rows));}

/* ====================== 17 · TABELA-RESUMO ====================== */
fim2.push(H('20. Tabela-resumo final',HeadingLevel.HEADING_1,{pb:true,sb:0}));
{const w=[760,2800,1500,760,760,760,760,926];
 const rows=d.ordem.map(k=>{const x=d.disc[k];
  return [k,x.nome,x.prof.replace('Prof. ',''),String(d.sessoes.filter(s=>s.disc===k).length),
   String(x.l),String(x.s),String(hn(x.teorica)).replace('.',','),String(hn(x.pratica)).replace('.',',')];});
 rows.push(['SEM','Seminários complementares','Convidados','8','—','—',String(hn(M.sem_teorica)),String(hn(M.sem_pratica))]);
 ['GEN','PT'].forEach(k=>{const g=d.sabados.disc[k];
  rows.push([k,g.nome+' (sábados)','Santos Salote','24','—','—',String(hn(g.teorica)).replace('.',','),String(hn(g.pratica)).replace('.',',')]);});
 body.length;
 fim2.push(tbl(w,[headRow(['Sigla','Disciplina','Docente','Sess.','180′','60′','T','P'],w),
  ...rows.map((r,i)=>dataRow(r,w,i,{sz:15,b:[true,false,false,false,false,false,false,false],
   al:[null,null,null,...Array(5).fill(AlignmentType.CENTER)]}))]));}
fim2.push(P('',{sz:10,sa:120}));
{const w=[5600,3426];
 const rows=[['Duração do ciclo',`8 meses (${M.ini} – ${M.fim})`],
  ['Dias lectivos totais',String(M.dias_uteis)],
  ['Dias de disciplinas técnicas',String(M.dias_disc)],['Dias de seminário','8'],
  ['Carga horária das disciplinas técnicas',M.horas_disc+' h'],
  ['Carga horária dos seminários',M.horas_sem+' h'],
  ['Componente teórica',hf(d.ordem.reduce((a,k)=>a+d.disc[k].teorica,0)+M.sem_teorica)],
  ['Componente prática',hf(d.ordem.reduce((a,k)=>a+d.disc[k].pratica,0)+M.sem_pratica)],
  ['Horas semanais em semana completa','8 h (2 dias × 4 h)'],
  ['Horas por docente (terça e quinta)','108 h cada'],
  ['Componente de sábado (GEN + PT)',`${d.sabados.n} sábados · ${hf(d.sabados.horas)} · Prof. Santos Salote`],
  ['Efectivo da turma',`${M.formandos} formandos`],
  ['Frequência mínima',M.frequencia_min],
  ['Custo total do módulo por formando',`${nf(d.financeiro.total_modulo)} Kz`],
  ['Estágio preliminar',`${d.estagios[0].ini} a ${d.estagios[0].fim} — 10 h por dia, carga a fixar pela escala`],
  ['Estágio curricular',`${d.estagios[1].ini} a ${d.estagios[1].fim} — carga a fixar pela escala`],
  ['Defesa de fim de curso',M.defesa]];
 fim2.push(tbl(w,[...rows.map((r,i)=>dataRow(r,w,i,{b:[true,false],al:[null,AlignmentType.RIGHT]})),
  new TableRow({children:[cell(P('Carga horária total do ciclo',{b:true,sz:18,c:'FFFFFF',sa:0}),{w:w[0],fill:C.navy}),
   cell(P(M.horas_geral+' horas',{b:true,sz:18,c:'FFFFFF',sa:0,al:AlignmentType.RIGHT}),{w:w[1],fill:C.navy})]})]));}
fim2.push(H('Nota sobre referências normativas',HeadingLevel.HEADING_2,{sz:22}));
fim2.push(P('Este programa não cita legislação, decretos, diplomas ou números de referência normativa, por não dispor de fonte verificada para o efeito. As designações de programas nacionais de saúde referidas nos conteúdos são utilizadas como designações técnicas correntes; os respectivos calendários, esquemas terapêuticos e algoritmos devem ser confirmados e actualizados junto das normas em vigor emitidas pela autoridade sanitária competente antes do início da formação. O reconhecimento oficial, a equivalência académica e a certificação profissional decorrentes deste ciclo dependem de acreditação a confirmar junto das entidades competentes e não são objecto do presente documento.',{sz:18}));

/* ====================== ANEXO A ====================== */

/* ==================== 21 · CONDIÇÕES FINANCEIRAS ==================== */
const FIN=d.financeiro;
const kz=v=>v===null?'a definir':`${nf(v)} Kz`;
fim2.push(H('21. Condições financeiras',HeadingLevel.HEADING_1,{pb:true,sb:0}));
fim2.push(P(`Valores aplicáveis à turma ${M.turma} no III.º Módulo do curso de ${M.curso}, ano lectivo ${M.ano}. Todos os montantes estão expressos em kwanzas.`,{sz:19}));
fim2.push(H('Encargos do módulo',HeadingLevel.HEADING_2,{sz:22}));
{const w=[3600,1500,2100,1826];
 fim2.push(tbl(w,[headRow(['Encargo','Valor','Regime','Prazo'],w),
  ...FIN.modulo.map((x,i)=>dataRow([x.item,kz(x.valor),x.nota,x.quando],w,i,
   {sz:16,b:[true,true,false,false],al:[null,AlignmentType.RIGHT,null,null]})),
  new TableRow({children:[
   cell(P('Total do módulo por formando',{b:true,sz:17,c:'FFFFFF',sa:0}),{w:w[0],fill:C.navy}),
   cell(P(kz(FIN.total_modulo),{b:true,sz:17,c:'FFFFFF',sa:0,al:AlignmentType.RIGHT}),{w:w[1],fill:C.navy}),
   cell(P(`inclui ${FIN.mensalidades} mensalidades de ${kz(FIN.mensalidade)}`,{sz:15,c:'C9DDEE',sa:0}),{w:w[2],cs:2,fill:C.navy})]})]));}
fim2.push(P('O total acima não inclui multas, recursos nem o certificado de conclusão.',{sz:17,i:true}));
fim2.push(P(FIN.nota_conf,{sz:17,i:true}));
fim2.push(H('Encargos eventuais',HeadingLevel.HEADING_2,{sz:22}));
{const w=[3600,1500,2100,1826];
 fim2.push(tbl(w,[headRow(['Encargo','Valor','Regime','Quando se aplica'],w),
  ...FIN.eventual.map((x,i)=>dataRow([x.item,kz(x.valor),x.nota,x.quando],w,i,
   {sz:16,b:[true,true,false,false],al:[null,AlignmentType.RIGHT,null,null]}))]));}
fim2.push(H('Valores por definir',HeadingLevel.HEADING_2,{sz:22}));
{const w=[4600,1600,2826];
 fim2.push(tbl(w,[headRow(['Encargo','Valor','Observações'],w),
  ...FIN.futuro.map((x,i)=>dataRow([x.item,kz(x.valor),x.quando],w,i,
   {sz:16,b:[true,true,false],al:[null,AlignmentType.RIGHT,null]}))]));}
fim2.push(H('Regras de pagamento',HeadingLevel.HEADING_2,{sz:22}));
fim2.push(...bullets(FIN.regras));
fim2.push(H('Licença de aprendizagem',HeadingLevel.HEADING_2,{sz:22}));
fim2.push(P('A licença de aprendizagem é o documento que habilita o formando a frequentar o estágio preliminar e o estágio curricular. É requerida no início do estágio preliminar, mediante a declaração para obtenção de licença, cujo custo consta do quadro dos encargos do módulo. A licença em si não tem custo próprio junto da escola.',{sz:19}));
fim2.push(H('Termo de frequência',HeadingLevel.HEADING_2,{sz:22}));
fim2.push(P('O termo de frequência é o histórico académico do formando. É passado no fim de 2026, até 30 de Novembro, mediante o pagamento indicado no quadro dos encargos do módulo.',{sz:19}));

fim2.push(H('Anexo A — Listas de verificação dos procedimentos',HeadingLevel.HEADING_1,{pb:true,sb:0}));
fim2.push(P('Cada lista é aplicada na avaliação prática contínua e nas estações da avaliação final. Assinala-se «Executa» quando o item é cumprido integralmente. Os itens marcados com asterisco são eliminatórios: a sua falha anula a estação. A estação é considerada cumprida com pelo menos seis dos oito itens executados e nenhum item eliminatório em falta.',{sz:18,i:true}));
d.ordem.forEach(k=>{
 fim2.push(H(d.disc[k].nome,HeadingLevel.HEADING_2,{sz:21}));
 d.disc[k].listas.forEach(l=>{
  fim2.push(H(`${l.cod} — ${l.tit}`,HeadingLevel.HEADING_3,{sz:19,sb:180,sa:60}));
  const w=[560,6466,1000,1000];
  fim2.push(tbl(w,[headRow(['N.º','Item observável','Executa','Não executa'],w),
   ...l.itens.map((it,i)=>new TableRow({children:[
    cell(P(String(i+1),{sz:15,al:AlignmentType.CENTER,sa:0}),{w:w[0],fill:i%2?C.zebra:undefined}),
    cell(P(it+(i<2?' *':''),{sz:16,sa:0}),{w:w[1],fill:i%2?C.zebra:undefined}),
    cell(P('',{sz:16,sa:0}),{w:w[2],fill:i%2?C.zebra:undefined}),
    cell(P('',{sz:16,sa:0}),{w:w[3],fill:i%2?C.zebra:undefined})]}))]));
  fim2.push(P('Formando: ______________________________   Data: ____ / ____ / ______   Avaliador: ______________________________',{sz:15,c:'6B7C8A',sb:60,sa:140}));});
});

/* ====================== ANEXO B ====================== */
fim2.push(H('Anexo B — Grelha de avaliação prática',HeadingLevel.HEADING_1,{pb:true,sb:0}));
fim2.push(P('Grelha global da avaliação prática final. Aplica-se uma grelha por formando e por disciplina. A classificação de cada estação resulta da lista de verificação correspondente do Anexo A.',{sz:18,i:true}));
{const w=[3400,1200,1200,1200,2026];
 const rows=[['Estação 1','','','',''],['Estação 2','','','',''],['Estação 3','','','',''],
  ['Estação 4','','','',''],['Estação 5 (quando aplicável)','','','','']];
 fim2.push(tbl(w,[headRow(['Estação','Itens cumpridos','Elimin. em falta','Classificação','Observações'],w),
  ...rows.map((r,i)=>new TableRow({height:{value:460,rule:'atLeast'},children:r.map((t,j)=>cell(
   P(t,{sz:16,b:j===0,sa:0}),{w:w[j],fill:i%2?C.zebra:undefined}))})),
  new TableRow({children:[cell(P('Classificação final da componente prática (0 a 20 valores)',{b:true,sz:16,c:'FFFFFF',sa:0}),{w:w[0],cs:3,fill:C.navy}),
   cell(P('',{sz:16,sa:0}),{w:w[3],fill:C.box}),cell(P('',{sz:16,sa:0}),{w:w[4],fill:C.box})]})]));}
fim2.push(P('',{sz:12,sa:200}));
fim2.push(P('Critério de aprovação da componente prática: classificação igual ou superior a 10 valores. A falha em qualquer item eliminatório de biossegurança ou de segurança do doente anula a estação, independentemente da execução técnica.',{sz:17,i:true}));
fim2.push(P('Formando: ______________________________   Disciplina: ______________   Data: ____ / ____ / ______',{sz:16,c:'6B7C8A',sb:200}));
fim2.push(P('Avaliador: ______________________________   Assinatura: ______________________________',{sz:16,c:'6B7C8A'}));

/* ====================== APROVAÇÃO ====================== */
fim2.push(H('Página de aprovação',HeadingLevel.HEADING_1,{pb:true,sb:0}));
fim2.push(P(`Programa de Formação Técnico-Profissional em Enfermagem — ${M.curso}, ${M.modulo}, turma ${M.turma}, Unidade do ${M.unidade}, ano lectivo ${M.ano}.`,{sz:20,sa:200}));
fim2.push(P(`Carga horária total: ${M.horas_total} horas, distribuídas por ${M.dias_uteis} dias lectivos entre ${M.ini} e ${M.fim}.`,{sz:20,sa:400}));
fim2.push(P('Elaborado por:',{b:true,sz:19,sa:300}));
fim2.push(P('______________________________________________',{sz:19,sa:40}));
fim2.push(P(`${M.autor}`,{sz:19,sa:40}));
fim2.push(P('Data: ____ / ____ / ______',{sz:17,c:'6B7C8A',sa:400}));
fim2.push(P('Verificado pela equipa docente:',{b:true,sz:19,sa:300}));
{const w=[4400,4626];
 fim2.push(tbl(w,[new TableRow({children:[
  cell([P('______________________________',{sz:18,sa:40}),P('Prof. Manuel Jorge Weber',{b:true,sz:18,sa:20}),
        P('Técnico de Enfermagem · EMC e UEPS',{sz:15,c:'6B7C8A',sa:0})],{w:w[0],borders:noB}),
  cell([P('______________________________',{sz:18,sa:40}),P('Prof. Eduardo David',{b:true,sz:18,sa:20}),
        P('Técnico de Enfermagem · SMON e EPSC',{sz:15,c:'6B7C8A',sa:0})],{w:w[1],borders:noB})]})]));}
fim2.push(P('',{sz:12,sa:400}));
fim2.push(P('Aprovado pela Direcção:',{b:true,sz:19,sa:300}));
fim2.push(P('______________________________________________',{sz:19,sa:40}));
fim2.push(P(`Direcção · ${M.inst} · ${M.grupo}`,{sz:18,sa:40}));
fim2.push(P('Data: ____ / ____ / ______',{sz:17,c:'6B7C8A'}));

/* ====================== DOCUMENTO ====================== */
const RODAPE=`${M.curso} · ${M.modulo} · ${M.ano} · versão ${M.versao}`;
function foot(){return new Footer({children:[new Paragraph({
 alignment:AlignmentType.CENTER,spacing:{before:80},
 border:{top:{style:BorderStyle.SINGLE,size:4,color:C.rule,space:6}},
 children:[new TextRun({text:RODAPE+'      ',size:15,font:F,color:'6B7C8A'}),
  new TextRun({children:['Página ',PageNumber.CURRENT,' de ',PageNumber.TOTAL_PAGES],
   size:15,font:F,color:'6B7C8A'})]})]});}
const A4P={size:{width:11906,height:16838},margin:{top:1300,bottom:1200,left:1440,right:1440}};
const A4L={size:{width:11906,height:16838,orientation:PageOrientation.LANDSCAPE},
 margin:{top:1000,bottom:900,left:1080,right:1080}};

const doc=new Document({
 creator:M.autor, title:`Programa de ${M.curso} — ${M.modulo}`, description:RODAPE,
 features:{updateFields:true},
 styles:{default:{document:{run:{font:F,size:20,color:'1A1A1A'}}},
  paragraphStyles:[
   {id:'Heading1',name:'Heading 1',basedOn:'Normal',next:'Normal',quickFormat:true,
    run:{font:FS,size:30,bold:true,color:C.navy},
    paragraph:{spacing:{before:280,after:160},border:{bottom:{style:BorderStyle.SINGLE,size:8,color:C.navy,space:6}}}},
   {id:'Heading2',name:'Heading 2',basedOn:'Normal',next:'Normal',quickFormat:true,
    run:{font:FS,size:23,bold:true,color:C.navy2},paragraph:{spacing:{before:260,after:110}}},
   {id:'Heading3',name:'Heading 3',basedOn:'Normal',next:'Normal',quickFormat:true,
    run:{font:FS,size:20,bold:true,color:C.green},paragraph:{spacing:{before:200,after:80}}}]},
 numbering:{config:[{reference:'pontos',levels:[{level:0,format:LevelFormat.BULLET,text:'▪',
   alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:360,hanging:200}},
   run:{color:C.green,size:18}}}]}]},
 sections:[
  {properties:{page:A4P,titlePage:false},footers:{default:foot()},children:[...capa,...indice,...body]},
  {properties:{page:A4L},footers:{default:foot()},children:cal},
  {properties:{page:A4P},footers:{default:foot()},children:fim2}]});

const DEST=path.resolve(__dirname,
 fs.existsSync(path.resolve(__dirname,'..','..','..','..','assets','logo-midas26.png'))?'..':'.',
 'Programa-Enfermagem-Geral-III-Modulo-NOV-A.docx');
Packer.toBuffer(doc).then(b=>{fs.writeFileSync(DEST,b);
 console.log('DOCX escrito:',DEST,'-',b.length,'bytes');});
