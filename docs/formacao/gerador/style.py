# -*- coding: utf-8 -*-
CSS = r"""
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap">
<style>
:root{
  --bg:#F4F7F9; --surface:#FFFFFF; --surface-2:#EDF2F6; --surface-3:#F8FAFC;
  --ink:#12202B; --ink-2:#39505F; --muted:#61798B;
  --rule:#D3DEE7; --rule-soft:#E6EDF2;
  --brand:#0F3A63; --brand-2:#2A6099; --brand-ink:#0F3A63;
  --bar:#0D3355; --bar-ink:#F2F7FB; --bar-sub:#9DC0DE;
  --accent:#0B7A20; --accent-2:#12A02B; --accent-soft:#E3F3E6;
  --mark:#FFE79E; --mark-2:#FFF3CE; --mark-line:#D9A80F; --mark-ink:#4A3600;
  --sem-fill:#E1F2E4; --sem-line:#12A02B; --sem-ink:#0A5C18;
  --hol:#F5E4E2; --hol-ink:#8C3B31;
  --pract:#0E8F27; --theor:#B9E3C0; --theor-line:rgba(14,143,39,.45);
  --shadow:0 1px 2px rgba(16,42,64,.05), 0 6px 20px -12px rgba(16,42,64,.22);
  --serif:"Source Serif 4",Georgia,"Times New Roman",serif;
  --sans:"IBM Plex Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
  --bg:#0B131A; --surface:#141F2A; --surface-2:#1B2833; --surface-3:#101A23;
  --ink:#E7EEF4; --ink-2:#BDCCD8; --muted:#8AA0B2;
  --rule:#27353F; --rule-soft:#1D2A34;
  --brand:#7FB2E6; --brand-2:#5A9BD8; --brand-ink:#8FBEEE;
  --bar:#0A2237; --bar-ink:#E9F2FA; --bar-sub:#7FA9CE;
  --accent:#4FC463; --accent-2:#46C45C; --accent-soft:#12301A;
  --mark:#4E3D06; --mark-2:#3A2E06; --mark-line:#C79A10; --mark-ink:#FFE49B;
  --sem-fill:#123322; --sem-line:#2E9C46; --sem-ink:#8FE0A2;
  --hol:#3A211E; --hol-ink:#E9A79C;
  --pract:#46C45C; --theor:#1F5C2C; --theor-line:rgba(70,196,92,.5);
  --shadow:0 1px 2px rgba(0,0,0,.4), 0 8px 24px -14px rgba(0,0,0,.7);
}}
:root[data-theme="dark"]{
  --bg:#0B131A; --surface:#141F2A; --surface-2:#1B2833; --surface-3:#101A23;
  --ink:#E7EEF4; --ink-2:#BDCCD8; --muted:#8AA0B2;
  --rule:#27353F; --rule-soft:#1D2A34;
  --brand:#7FB2E6; --brand-2:#5A9BD8; --brand-ink:#8FBEEE;
  --bar:#0A2237; --bar-ink:#E9F2FA; --bar-sub:#7FA9CE;
  --accent:#4FC463; --accent-2:#46C45C; --accent-soft:#12301A;
  --mark:#4E3D06; --mark-2:#3A2E06; --mark-line:#C79A10; --mark-ink:#FFE49B;
  --sem-fill:#123322; --sem-line:#2E9C46; --sem-ink:#8FE0A2;
  --hol:#3A211E; --hol-ink:#E9A79C;
  --pract:#46C45C; --theor:#1F5C2C; --theor-line:rgba(70,196,92,.5);
  --shadow:0 1px 2px rgba(0,0,0,.4), 0 8px 24px -14px rgba(0,0,0,.7);
}

*{box-sizing:border-box}
body{background:var(--bg); color:var(--ink); font-family:var(--sans);
     font-size:15px; line-height:1.6; -webkit-font-smoothing:antialiased;}
.wrap{max-width:1120px; margin:0 auto; padding-inline:20px; padding-block:0 64px;}
.prose{max-width:70ch}
h1,h2,h3,h4{font-family:var(--serif); text-wrap:balance; margin:0; color:var(--ink); font-weight:600;}
p{margin:0 0 .85em}
a{color:var(--brand-ink)}
:focus-visible{outline:2px solid var(--accent-2); outline-offset:2px; border-radius:2px}
.mono{font-family:var(--mono); font-variant-numeric:tabular-nums}
.num{font-variant-numeric:tabular-nums}

/* ---------- CAPA ---------- */
.capa{background:var(--bar); color:var(--bar-ink); border-radius:3px; overflow:hidden;
      margin:24px 0 40px; box-shadow:var(--shadow); position:relative;}
.capa::after{content:""; position:absolute; inset:auto 0 0 0; height:5px;
      background:linear-gradient(90deg,var(--accent-2) 0 38%, var(--bar-sub) 38% 100%)}
.capa-in{display:grid; grid-template-columns:210px 1fr; gap:36px; align-items:center;
      padding:44px 40px 48px;}
.capa-logo{background:#fff; border-radius:3px; padding:14px; display:grid; place-items:center}
.capa-logo img{display:block; width:100%; height:auto}
.capa-eyebrow{font-family:var(--mono); font-size:11.5px; letter-spacing:.16em;
      text-transform:uppercase; color:var(--bar-sub); margin:0 0 16px}
.capa h1{font-size:clamp(28px,4vw,44px); line-height:1.12; color:#fff; letter-spacing:-.015em}
.capa .sub{font-family:var(--serif); font-size:clamp(17px,2vw,21px); color:#CFE2F2;
      margin:14px 0 0; font-style:italic}
.capa-facts{display:flex; flex-wrap:wrap; gap:10px; margin-top:26px}
.capa-facts span{font-family:var(--mono); font-size:11.5px; letter-spacing:.06em;
      border:1px solid rgba(255,255,255,.28); border-radius:2px; padding:5px 10px; color:#DCEAF6}
.capa-facts span b{color:#fff; font-weight:600}

/* ---------- FICHA ---------- */
.ficha{background:var(--surface); border:1px solid var(--rule); border-radius:3px;
      padding:0; margin:0 0 44px; box-shadow:var(--shadow); overflow:hidden}
.ficha h2{font-size:15px; letter-spacing:.04em; text-transform:uppercase; font-family:var(--sans);
      font-weight:600; padding:14px 22px; border-bottom:1px solid var(--rule);
      background:var(--surface-2); color:var(--ink-2)}
.ficha dl{display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:0; margin:0}
.ficha .row{padding:15px 22px; border-bottom:1px solid var(--rule-soft); border-right:1px solid var(--rule-soft)}
.ficha dt{font-family:var(--mono); font-size:10.5px; letter-spacing:.13em; text-transform:uppercase;
      color:var(--muted); margin:0 0 5px}
.ficha dd{margin:0; font-size:14.5px; color:var(--ink); font-weight:500; line-height:1.45}

/* ---------- SECÇÕES ---------- */
section.sec{margin:0 0 52px; scroll-margin-top:16px}
.sec-h{display:flex; align-items:baseline; gap:14px; border-bottom:2px solid var(--brand);
      padding-bottom:9px; margin:0 0 22px}
.sec-n{font-family:var(--mono); font-size:12px; font-weight:600; color:var(--accent);
      letter-spacing:.1em; padding-top:4px}
.sec-h h2{font-size:clamp(21px,2.6vw,27px); letter-spacing:-.01em; flex:1}
.sec-h .tag{font-family:var(--mono); font-size:11px; color:var(--muted); letter-spacing:.06em}
h3.sub-h{font-size:18.5px; margin:30px 0 12px; color:var(--brand-ink)}
h4.sub-h4{font-family:var(--sans); font-size:12px; letter-spacing:.12em; text-transform:uppercase;
      color:var(--muted); font-weight:600; margin:24px 0 9px}

ul.li, ol.li{margin:0 0 14px; padding-left:20px; max-width:74ch}
ul.li li, ol.li li{margin-bottom:6px}
ul.tick{list-style:none; padding-left:0; max-width:74ch}
ul.tick li{position:relative; padding-left:24px; margin-bottom:7px}
ul.tick li::before{content:""; position:absolute; left:2px; top:.62em; width:9px; height:9px;
      border:2px solid var(--accent-2); border-radius:1px}

/* ---------- ÍNDICE ---------- */
.toc{background:var(--surface); border:1px solid var(--rule); border-radius:3px;
     padding:22px 26px 24px; margin:0 0 48px}
.toc h2{font-size:12px; font-family:var(--sans); letter-spacing:.13em; text-transform:uppercase;
     color:var(--muted); font-weight:600; margin:0 0 14px}
.toc ol{list-style:none; margin:0; padding:0; columns:2; column-gap:38px}
.toc li{margin:0 0 7px; break-inside:avoid; display:flex; gap:10px; align-items:baseline}
.toc li .tn{font-family:var(--mono); font-size:11px; color:var(--accent); min-width:20px}
.toc a{text-decoration:none; color:var(--ink-2); border-bottom:1px solid transparent}
.toc a:hover{border-bottom-color:var(--accent-2); color:var(--ink)}

/* ---------- TABELAS ---------- */
.tw{overflow-x:auto; border:1px solid var(--rule); border-radius:3px; background:var(--surface);
    margin:0 0 18px; -webkit-overflow-scrolling:touch}
table{border-collapse:collapse; width:100%; font-size:13.5px}
thead th{background:var(--bar); color:var(--bar-ink); text-align:left; font-weight:600;
    font-size:11px; letter-spacing:.09em; text-transform:uppercase; padding:10px 12px;
    border-right:1px solid rgba(255,255,255,.12); white-space:nowrap; vertical-align:bottom}
thead th:last-child{border-right:0}
tbody td{padding:9px 12px; border-bottom:1px solid var(--rule-soft);
    border-right:1px solid var(--rule-soft); vertical-align:top; color:var(--ink-2)}
tbody td:last-child{border-right:0}
tbody tr:last-child td{border-bottom:0}
tbody tr:nth-child(even) td{background:var(--surface-3)}
tbody td strong{color:var(--ink); font-weight:600}
tfoot td{padding:10px 12px; background:var(--surface-2); font-weight:600; color:var(--ink);
    border-top:2px solid var(--brand); border-right:1px solid var(--rule-soft)}
tfoot td:last-child{border-right:0}
td.n, th.n{text-align:right; font-family:var(--mono); font-variant-numeric:tabular-nums; white-space:nowrap}
td.c{text-align:center}
caption{caption-side:top; text-align:left; font-family:var(--mono); font-size:10.5px;
    letter-spacing:.1em; text-transform:uppercase; color:var(--muted); padding:0 0 8px}
.tnote{font-size:12.5px; color:var(--muted); margin:0 0 22px; max-width:78ch}

/* ---------- SIGLAS ---------- */
.sig{display:inline-block; font-family:var(--mono); font-size:10.5px; font-weight:600;
     letter-spacing:.05em; padding:1px 5px; border-radius:2px; border:1px solid; white-space:nowrap}
.sig-EMC{color:#0E5A9E; border-color:#0E5A9E; background:rgba(14,90,158,.09)}
.sig-UEPS{color:#B4402C; border-color:#B4402C; background:rgba(180,64,44,.09)}
.sig-SMON{color:#8A3E96; border-color:#8A3E96; background:rgba(138,62,150,.09)}
.sig-EPSC{color:#0B7A20; border-color:#0B7A20; background:rgba(11,122,32,.09)}
.sig-SEM{color:var(--mark-ink); border-color:var(--mark-line); background:var(--mark-2)}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
  .sig-EMC{color:#7CB8EC; border-color:#3E7FBE; background:rgba(62,127,190,.16)}
  .sig-UEPS{color:#F09A85; border-color:#C4644E; background:rgba(196,100,78,.16)}
  .sig-SMON{color:#D89FE2; border-color:#A362B0; background:rgba(163,98,176,.16)}
  .sig-EPSC{color:#6ED184; border-color:#38A04F; background:rgba(56,160,79,.16)}
}}
:root[data-theme="dark"] .sig-EMC{color:#7CB8EC; border-color:#3E7FBE; background:rgba(62,127,190,.16)}
:root[data-theme="dark"] .sig-UEPS{color:#F09A85; border-color:#C4644E; background:rgba(196,100,78,.16)}
:root[data-theme="dark"] .sig-SMON{color:#D89FE2; border-color:#A362B0; background:rgba(163,98,176,.16)}
:root[data-theme="dark"] .sig-EPSC{color:#6ED184; border-color:#38A04F; background:rgba(56,160,79,.16)}

.nat{display:inline-block; font-family:var(--mono); font-size:10px; letter-spacing:.05em;
     padding:1px 5px; border-radius:2px; background:var(--surface-2); color:var(--muted);
     border:1px solid var(--rule); white-space:nowrap}
.nat-P{color:var(--accent); border-color:var(--accent-2); background:var(--accent-soft)}
.nat-AV{color:var(--mark-ink); border-color:var(--mark-line); background:var(--mark-2)}

/* ---------- HORÁRIO-BASE ---------- */
.horario{display:grid; gap:2px; background:var(--rule); border:1px solid var(--rule);
     border-radius:3px; overflow:hidden; margin:0 0 20px}
.hb{display:grid; grid-template-columns:132px 1fr 92px; gap:0; background:var(--surface); align-items:center}
.hb>*{padding:13px 16px}
.hb .t{font-family:var(--mono); font-size:12.5px; color:var(--ink); font-weight:500; white-space:nowrap}
.hb .d{color:var(--ink-2); font-size:14px}
.hb .d b{color:var(--ink); font-weight:600}
.hb .m{font-family:var(--mono); font-size:12px; color:var(--muted); text-align:right; white-space:nowrap}
.hb.int{background:var(--surface-2)}
.hb.int .d{color:var(--muted); font-style:italic}
.hb.tot{background:var(--bar)}
.hb.tot .t,.hb.tot .d,.hb.tot .m{color:var(--bar-ink)}
.hb.tot .d b{color:#fff}

/* ---------- SEMANA A/B ---------- */
.ab{display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:0 0 20px}
.abc{border:1px solid var(--rule); border-radius:3px; background:var(--surface); overflow:hidden}
.abc h4{font-family:var(--mono); font-size:11px; letter-spacing:.12em; text-transform:uppercase;
     padding:10px 16px; margin:0; background:var(--surface-2); color:var(--ink-2);
     border-bottom:1px solid var(--rule); font-weight:600}
.abc .r{display:flex; justify-content:space-between; gap:12px; padding:11px 16px;
     border-bottom:1px solid var(--rule-soft); font-size:13.5px; align-items:center}
.abc .r:last-child{border-bottom:0}
.abc .r .h{font-family:var(--mono); font-size:12px; color:var(--muted); white-space:nowrap}

/* ---------- GRÁFICO DE CARGA ---------- */
.chart{border:1px solid var(--rule); border-radius:3px; background:var(--surface); padding:22px 24px 18px; margin:0 0 14px}
.chart-t{font-family:var(--sans); font-size:14px; font-weight:600; color:var(--ink); margin:0 0 3px}
.chart-s{font-size:12.5px; color:var(--muted); margin:0 0 18px}
.chart-leg{display:flex; gap:18px; margin:0 0 16px; flex-wrap:wrap}
.chart-leg i{width:11px; height:11px; border-radius:2px; display:inline-block; margin-right:7px; vertical-align:-1px}
.chart-leg span{font-size:12px; color:var(--ink-2); font-family:var(--mono); letter-spacing:.03em}
.crow{display:grid; grid-template-columns:190px 1fr 62px; gap:14px; align-items:center; margin-bottom:11px}
.crow .cl{font-size:13px; color:var(--ink); font-weight:500; line-height:1.3}
.crow .cl small{display:block; font-family:var(--mono); font-size:10px; color:var(--muted); letter-spacing:.08em}
.cbar{display:flex; height:24px; gap:2px; align-items:stretch}
.cbar i{display:block; border-radius:1px; position:relative; font-style:normal;
    font-family:var(--mono); font-size:10.5px; line-height:24px; text-align:center; overflow:hidden}
.cbar i:last-child{border-top-right-radius:4px; border-bottom-right-radius:4px}
.cbar .th{background:var(--theor); box-shadow:inset 0 0 0 1px var(--theor-line); color:var(--mark-ink)}
.cbar .pr{background:var(--pract); color:#fff}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
  .cbar .th{color:#CFEED6} .cbar .pr{color:#04240B}}}
:root[data-theme="dark"] .cbar .th{color:#CFEED6}
:root[data-theme="dark"] .cbar .pr{color:#04240B}
.crow .cv{font-family:var(--mono); font-size:13px; color:var(--ink); text-align:right; font-weight:600}

/* ---------- CALENDÁRIO ---------- */
.cal-legend{display:flex; flex-wrap:wrap; gap:9px 16px; padding:16px 20px; background:var(--surface);
    border:1px solid var(--rule); border-radius:3px; margin:0 0 24px; align-items:center}
.cal-legend .lg{display:flex; align-items:center; gap:8px; font-size:12.5px; color:var(--ink-2)}
.cal-legend .sw{width:16px; height:16px; border-radius:2px; border:1px solid var(--rule); flex:none}
.sw-aula{background:var(--mark); border-color:var(--mark-line)}
.sw-sem{background:var(--sem-fill); border-color:var(--sem-line); border-width:2px}
.sw-hol{background:var(--hol); border-color:var(--hol-ink)}

.meses{display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:20px;
    align-items:start; margin:0 0 20px}
.mes{border:1px solid var(--rule); border-radius:3px; background:var(--surface); overflow:hidden;
    break-inside:avoid; page-break-inside:avoid}
.mes-h{display:flex; align-items:baseline; gap:10px; padding:12px 16px; background:var(--bar);
    color:var(--bar-ink)}
.mes-h .mn{font-family:var(--mono); font-size:10px; letter-spacing:.14em; text-transform:uppercase;
    color:var(--bar-sub)}
.mes-h h3{font-family:var(--serif); font-size:17px; color:#fff; flex:1; font-weight:600}
.mes-h .mm{font-family:var(--mono); font-size:10.5px; color:var(--bar-sub); white-space:nowrap}
.cal{display:grid; grid-template-columns:repeat(7,1fr); gap:1px; background:var(--rule-soft); padding:1px}
.wd{background:var(--surface-2); text-align:center; font-family:var(--mono); font-size:9.5px;
    letter-spacing:.1em; text-transform:uppercase; color:var(--muted); padding:6px 0; font-weight:500}
.cd{background:var(--surface); min-height:58px; padding:4px 4px 5px; position:relative}
.cd.off{background:var(--surface-3)}
.cd.we{background:var(--surface-3)}
.cd .dn{font-family:var(--mono); font-size:11px; color:var(--muted); display:block;
    line-height:1.1; margin-bottom:3px; font-variant-numeric:tabular-nums}
.cd.aula{background:var(--mark); box-shadow:inset 0 0 0 1px var(--mark-line)}
.cd.aula .dn{color:var(--mark-ink); font-weight:600}
.cd.semi{background:var(--mark); box-shadow:inset 0 0 0 2px var(--sem-line)}
.cd.semi .dn{color:var(--mark-ink); font-weight:600}
.cd.hol{background:var(--hol)}
.cd.hol .dn{color:var(--hol-ink); font-weight:600}
.cd .ch{display:block; font-family:var(--mono); font-size:9px; line-height:1.35;
    letter-spacing:.02em; color:var(--mark-ink); white-space:nowrap; overflow:hidden;
    text-overflow:ellipsis}
.cd .ch b{font-weight:600}
.cd .ch.lo b{font-weight:700}
.cd .hn{display:block; font-size:8.5px; line-height:1.25; color:var(--hol-ink);
    white-space:normal; overflow:hidden; font-family:var(--sans)}
.cd .semt{display:block; font-size:8.5px; line-height:1.25; color:var(--sem-ink);
    font-weight:600; white-space:normal; font-family:var(--sans)}
.mes-f{padding:9px 16px; border-top:1px solid var(--rule); background:var(--surface-3);
    font-size:11.5px; color:var(--muted); display:flex; justify-content:space-between; gap:10px}
.mes-f .mono{color:var(--ink-2)}

/* ---------- CRONOGRAMA ---------- */
.cron-mes{margin:0 0 26px; break-inside:auto}
.cron-mes>h3{font-family:var(--serif); font-size:18px; color:var(--brand-ink);
    border-bottom:1px solid var(--rule); padding-bottom:7px; margin:0 0 12px;
    display:flex; justify-content:space-between; align-items:baseline; gap:12px}
.cron-mes>h3 span{font-family:var(--mono); font-size:11px; color:var(--muted); font-weight:400}
table.cron{font-size:12.5px}
table.cron td{padding:7px 9px}
table.cron tr.d0 td{border-top:2px solid var(--rule)}
table.cron tr.int td{background:var(--surface-2); color:var(--muted); font-style:italic; font-size:11.5px; padding:4px 9px}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){ table.cron tr.int td{background:var(--surface-3)} }}
:root[data-theme="dark"] table.cron tr.int td{background:var(--surface-3)}
table.cron tr.semi td{background:var(--mark-2)}
table.cron td.dt{font-family:var(--mono); font-size:11.5px; white-space:nowrap; color:var(--ink); font-weight:500}
table.cron td.pf{font-size:11.5px; white-space:nowrap; color:var(--muted)}
table.cron td.tp{font-family:var(--mono); font-size:11px; white-space:nowrap; color:var(--muted)}
table.cron td.tema{color:var(--ink-2); min-width:290px}
table.cron td.tema em{color:var(--muted); font-style:normal; font-size:11.5px}

/* ---------- PROGRAMA DE DISCIPLINA ---------- */
.prog{border:1px solid var(--rule); border-radius:3px; background:var(--surface);
    overflow:hidden; margin:0 0 34px; box-shadow:var(--shadow); break-inside:avoid-page}
.prog-h{padding:20px 24px; background:var(--bar); color:var(--bar-ink);
    display:flex; align-items:flex-start; gap:16px; flex-wrap:wrap}
.prog-h .pi{flex:1; min-width:240px}
.prog-h .code{font-family:var(--mono); font-size:11px; letter-spacing:.16em; color:var(--bar-sub);
    display:block; margin-bottom:6px}
.prog-h h3{font-family:var(--serif); font-size:21px; color:#fff; line-height:1.2}
.prog-h .pp{font-size:13px; color:#CFE2F2; margin:8px 0 0}
.prog-kpi{display:flex; gap:0; border:1px solid rgba(255,255,255,.22); border-radius:2px; overflow:hidden}
.prog-kpi div{padding:8px 15px; border-right:1px solid rgba(255,255,255,.18); text-align:center}
.prog-kpi div:last-child{border-right:0}
.prog-kpi b{display:block; font-family:var(--mono); font-size:17px; color:#fff; line-height:1.15}
.prog-kpi small{font-family:var(--mono); font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:var(--bar-sub)}
.prog-b{padding:22px 24px 24px}
.prog-b .grid2{display:grid; grid-template-columns:1fr 1fr; gap:0 34px}
.prog-b p{max-width:74ch}

/* ---------- SEMINÁRIO ---------- */
.sems{display:grid; grid-template-columns:repeat(auto-fit,minmax(330px,1fr)); gap:16px}
.sem{border:1px solid var(--rule); border-left:3px solid var(--sem-line); border-radius:3px;
    background:var(--surface); padding:17px 19px; break-inside:avoid}
.sem .sh{display:flex; align-items:baseline; gap:9px; margin:0 0 8px; flex-wrap:wrap}
.sem .sn{font-family:var(--mono); font-size:10.5px; letter-spacing:.1em; color:var(--accent); font-weight:600}
.sem .sa{font-family:var(--mono); font-size:10px; letter-spacing:.09em; text-transform:uppercase;
    color:var(--muted); border:1px solid var(--rule); border-radius:2px; padding:1px 6px}
.sem .sd{margin-left:auto; font-family:var(--mono); font-size:10.5px; color:var(--muted)}
.sem h4{font-family:var(--serif); font-size:15.5px; color:var(--ink); margin:0 0 9px; line-height:1.3}
.sem ul{margin:0; padding-left:17px; font-size:12.5px; color:var(--ink-2)}
.sem ul li{margin-bottom:4px}

/* ---------- AVALIAÇÃO ---------- */
.aval-bar{display:flex; height:34px; border-radius:3px; overflow:hidden; gap:2px; margin:0 0 12px}
.aval-bar i{font-style:normal; display:grid; place-items:center; font-family:var(--mono);
    font-size:11px; color:#fff; background:var(--brand-2); min-width:0; overflow:hidden}
.aval-bar i:nth-child(2){background:#2F6FA8} .aval-bar i:nth-child(3){background:#3E80B8}
.aval-bar i:nth-child(4){background:var(--pract)} .aval-bar i:nth-child(5){background:#17A836}
.aval-bar i:nth-child(6){background:#3FBA57} .aval-bar i:nth-child(7){background:#6ACB7C; color:#04240B}
.callout{border:1px solid var(--rule); border-left:3px solid var(--accent-2); background:var(--surface);
    border-radius:3px; padding:16px 20px; margin:0 0 20px}
.callout h4{font-family:var(--sans); font-size:11.5px; letter-spacing:.11em; text-transform:uppercase;
    color:var(--accent); font-weight:600; margin:0 0 7px}
.callout p:last-child{margin-bottom:0}
.callout.warn{border-left-color:var(--mark-line)}
.callout.warn h4{color:var(--mark-line)}

/* ---------- ASSINATURAS ---------- */
.assin{display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:28px; margin-top:44px}
.assin div{border-top:1px solid var(--ink-2); padding-top:9px; font-size:12.5px; color:var(--ink-2)}
.assin div b{display:block; color:var(--ink); font-size:13.5px; font-weight:600}
.assin div small{font-family:var(--mono); font-size:10px; letter-spacing:.09em;
    text-transform:uppercase; color:var(--muted); display:block; margin-top:3px}
footer.doc{margin-top:48px; padding-top:18px; border-top:1px solid var(--rule);
    font-size:11.5px; color:var(--muted); display:flex; justify-content:space-between;
    gap:16px; flex-wrap:wrap; font-family:var(--mono); letter-spacing:.04em}

/* ---------- RESPONSIVO ---------- */
@media (max-width:820px){
  .capa-in{grid-template-columns:1fr; gap:24px; padding:30px 24px 34px}
  .capa-logo{max-width:170px}
  .prog-b .grid2{grid-template-columns:1fr; gap:0}
  .ab{grid-template-columns:1fr}
  .toc ol{columns:1}
  .crow{grid-template-columns:1fr; gap:5px}
  .crow .cv{text-align:left}
  .hb{grid-template-columns:1fr; gap:0}
  .hb>*{padding:9px 14px}
  .hb .t{padding-bottom:0} .hb .m{text-align:left; padding-top:0}
}
@media (max-width:480px){ .wrap{padding-inline:14px} .meses{grid-template-columns:1fr} }
@media (prefers-reduced-motion:reduce){*{animation:none!important; transition:none!important}}

/* ---------- IMPRESSÃO ---------- */
@media print{
  @page{ size:A4; margin:13mm 12mm; }
  html,body{background:#fff!important; color:#111!important; font-size:9pt}
  .wrap{max-width:none; padding:0}
  .capa,.prog,.ficha,.mes,.sem,.callout,.chart,.tw,.toc,.abc,.horario{box-shadow:none!important}
  .capa{break-after:page; margin:0}
  .toc{break-after:page}
  section.sec{break-before:page; margin-bottom:22px}
  section.sec:first-of-type{break-before:auto}
  .sec-h{break-after:avoid}
  h3.sub-h,h4.sub-h4{break-after:avoid}
  .mes,.sem,.prog,.callout,.chart,.crow{break-inside:avoid}
  .meses{grid-template-columns:1fr 1fr; gap:8px}
  table{font-size:7.4pt}
  table.cron{font-size:6.9pt}
  table.cron td{padding:2.6px 4px}
  table.cron td.tema{min-width:0}
  thead{display:table-header-group}
  tr{break-inside:avoid}
  .tw{overflow:visible; border-radius:0}
  .cd{min-height:0; padding:2px 3px 3px}
  .cd .ch{font-size:6.4pt}
  .cd .dn{font-size:7.4pt}
  .cd .semt,.cd .hn{font-size:5.9pt}
  a{color:#111; text-decoration:none}
  .noprint{display:none!important}
}
</style>"""
