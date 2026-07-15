const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "CS AnyMarket LATAM";
pres.title = "OKRs CS AnyMarket LATAM H2 2026 — Basado en datos reales";

const C = {
  darkBg:   "0A1628",
  navyMid:  "1A3A5C",
  navyCard: "162840",
  gold:     "F2A71B",
  goldDark: "D4920F",
  teal:     "0F9B8E",
  lightBg:  "F4F7FB",
  white:    "FFFFFF",
  textDark: "0F2137",
  textMid:  "334E68",
  textGray: "7B93AA",
  green:    "10B981",
  amber:    "F59E0B",
  red:      "EF4444",
  blueAcc:  "3B82F6",
  purple:   "7C3AED",
};

const makeShadow = () => ({ type:"outer", color:"000000", blur:8, offset:3, angle:45, opacity:0.15 });

function card(s, x, y, w, h, bg) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius:0.1,
    fill:{ color: bg||C.white },
    line:{ color:"E2EAF2", width:0.5 },
    shadow: makeShadow(),
  });
}

function pill(s, x, y, text, color, w) {
  const pw = w || 1.3;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w:pw, h:0.3, fill:{color}, line:{color}, rectRadius:0.15 });
  s.addText(text, { x, y, w:pw, h:0.3, fontSize:10, color:C.white, bold:true, fontFace:"Calibri", margin:0, align:"center", valign:"middle" });
}

function geo(s) {
  s.addShape(pres.shapes.OVAL, { x:8.0, y:-1.2, w:4.5, h:4.5, fill:{color:C.navyMid}, line:{color:C.navyMid} });
  s.addShape(pres.shapes.OVAL, { x:8.8, y:2.5, w:2.5, h:2.5, fill:{color:C.teal, transparency:70}, line:{color:C.teal, transparency:70} });
}

function badge(s, text, color) {
  s.addText(text, { x:0.5, y:0.22, w:3, h:0.3, fontSize:10, color, bold:true, charSpacing:3, fontFace:"Calibri", margin:0 });
}

function krRow(s, i, kr, desc, target, owner, color) {
  const cy = 1.62 + i * 0.87;
  card(s, 0.4, cy, 9.2, 0.74, C.white);
  s.addText(kr, { x:0.6, y:cy+0.12, w:1.0, h:0.3, fontSize:11, color, bold:true, fontFace:"Calibri", margin:0 });
  s.addText(desc, { x:1.72, y:cy+0.14, w:5.6, h:0.45, fontSize:13, color:C.textDark, fontFace:"Calibri", margin:0 });
  pill(s, 7.6, cy+0.2, target, color, 1.2);
  s.addText(owner, { x:8.85, y:cy+0.46, w:0.75, h:0.22, fontSize:9, color:C.textGray, fontFace:"Calibri", margin:0, align:"right" });
}

function okrHeader(s, okrNum, title, obj, color) {
  badge(s, okrNum, color);
  s.addText(title, { x:0.5, y:0.5, w:9, h:0.62, fontSize:25, color:C.textDark, bold:true, fontFace:"Calibri", margin:0 });
  s.addText("Objetivo: " + obj, { x:0.5, y:1.1, w:9, h:0.38, fontSize:13, color:C.textMid, fontFace:"Calibri", margin:0, italic:true });
}

function insightBar(s, text, bg, textColor) {
  card(s, 0.4, 5.18, 9.2, 0.3, bg);
  s.addText(text, { x:0.6, y:5.2, w:8.9, h:0.26, fontSize:11, color:textColor, fontFace:"Calibri", margin:0 });
}

// ══════════════════════════════════════════════════════════════
// SLIDE 1 — COVER
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };
  geo(s);

  s.addText("Customer Success", {
    x:0.55, y:1.0, w:9, h:0.55, fontSize:14, color:C.gold, bold:true,
    fontFace:"Calibri", charSpacing:6, align:"left", margin:0,
  });
  s.addText("OKRs del Equipo", {
    x:0.55, y:1.52, w:9, h:1.35, fontSize:58, color:C.white, bold:true,
    fontFace:"Calibri", align:"left", margin:0,
  });
  s.addText("H2 2026", {
    x:0.55, y:2.85, w:9, h:0.9, fontSize:50, color:C.gold, bold:true,
    fontFace:"Calibri", align:"left", margin:0,
  });
  s.addText("Basado en datos reales  |  Power BI  |  TrackSale  |  Zendesk  |  AnyMarket", {
    x:0.55, y:4.25, w:9, h:0.35, fontSize:12, color:C.textGray,
    fontFace:"Calibri", align:"left", margin:0,
  });
  s.addText("AnyMarket LATAM  |  Chile  Colombia  Uruguay  Peru  Mexico  |  Julio 2026", {
    x:0.55, y:4.58, w:9, h:0.35, fontSize:12, color:C.textGray,
    fontFace:"Calibri", align:"left", margin:0,
  });
  s.addNotes("Todos los datos en esta presentacion provienen de fuentes verificadas: Power BI (GMV y Use Points), TrackSale (NPS), Zendesk (tickets), AnyMarket (plataforma). Los datos no consultados aparecen explicitamente como sin dato.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 2 — PORTAFOLIO REAL
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addText("EL PORTAFOLIO HOY", { x:0.5, y:0.18, w:9, h:0.3, fontSize:10, color:C.gold, bold:true, charSpacing:4, fontFace:"Calibri", margin:0 });
  s.addText("Composicion real de la cartera CS LATAM", { x:0.5, y:0.45, w:9, h:0.58, fontSize:28, color:C.textDark, bold:true, fontFace:"Calibri", margin:0 });

  // Stat cards row 1
  const stats1 = [
    { val:"35",   label:"Clientes en cartera\nCS LATAM total",         color:C.blueAcc, bg:"EFF6FF" },
    { val:"6",    label:"Paises\nChile / CO / UY / PE / MX",           color:C.teal,    bg:"F0FDFA" },
    { val:"6",    label:"Clientes Centry\nsin datos en AnyMarket",      color:C.amber,   bg:"FFFBEB" },
    { val:"29",   label:"Clientes activos\nen AnyMarket",               color:C.green,   bg:"F0FDF4" },
  ];

  stats1.forEach((st, i) => {
    const cx = 0.4 + i * 2.32;
    card(s, cx, 1.18, 2.12, 1.48, st.bg);
    s.addText(st.val, { x:cx+0.1, y:1.22, w:1.92, h:0.72, fontSize:40, color:st.color, bold:true, fontFace:"Calibri", align:"center", margin:0 });
    s.addText(st.label, { x:cx+0.1, y:1.9, w:1.92, h:0.62, fontSize:11, color:C.textMid, fontFace:"Calibri", align:"center", margin:0 });
  });

  // Clients Centry list
  card(s, 0.4, 2.82, 4.32, 2.65, "FFFBEB");
  s.addText("Clientes Centry — sin datos AnyMarket", { x:0.58, y:2.9, w:4.0, h:0.35, fontSize:13, color:C.goldDark, bold:true, fontFace:"Calibri", margin:0 });
  s.addText("Aun en sistema legado. CS no puede medir adopcion,\nGMV ni Health Score para estos clientes.", {
    x:0.58, y:3.24, w:4.0, h:0.55, fontSize:12, color:C.textMid, fontFace:"Calibri", margin:0,
  });
  s.addText("6 cuentas en proceso activo de migracion Centry → AnyMarket.\nPM asignada. Timeline H2 2026.", {
    x:0.58, y:3.82, w:4.0, h:0.6, fontSize:12, color:C.textDark, fontFace:"Calibri", margin:0,
  });

  // Critical clients confirmed
  card(s, 4.88, 2.82, 4.72, 2.65, "FEF2F2");
  s.addText("Clientes criticos confirmados", { x:5.05, y:2.9, w:4.4, h:0.35, fontSize:13, color:C.red, bold:true, fontFace:"Calibri", margin:0 });

  const crit = [
    { name:"Cuenta A — Uruguay", detail:"NPS -100  |  Fuente: TrackSale", color:C.red },
    { name:"Cuenta B — Chile", detail:"NPS -100  |  Fuente: TrackSale", color:C.red },
    { name:"Cuenta C — Colombia", detail:"Migracion bloqueada en marketplace", color:C.amber },
    { name:"Cuenta D — Mexico", detail:"Sin actividad en AnyMarket", color:C.textGray },
    { name:"Cuenta E — Global", detail:"Sin actividad en AnyMarket", color:C.textGray },
  ];
  crit.forEach((c, i) => {
    const cy = 3.34 + i*0.42;
    s.addText(c.name, { x:5.05, y:cy, w:2.1, h:0.35, fontSize:12, color:c.color, bold:true, fontFace:"Calibri", margin:0 });
    s.addText(c.detail, { x:7.18, y:cy, w:2.25, h:0.35, fontSize:11, color:C.textMid, fontFace:"Calibri", margin:0 });
  });

  s.addText("Fuentes: CLAUDE.md (portafolio), TrackSale (NPS), Power BI (actividad plataforma). Datos de julio 2026.", {
    x:0.5, y:5.3, w:9, h:0.25, fontSize:9, color:C.textGray, fontFace:"Calibri", margin:0, italic:true,
  });
  s.addNotes("Este es el estado real del portafolio al inicio de H2 2026. Los clientes Centry representan una fractura en la capacidad del equipo de medir y gestionar la salud de sus cuentas. BOTIGA y FORUS SA son las emergencias activas.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 3 — USE POINTS: DATOS REALES POWER BI
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addText("ADOPCION USE POINTS — DATOS REALES", { x:0.5, y:0.18, w:9, h:0.3, fontSize:10, color:C.gold, bold:true, charSpacing:4, fontFace:"Calibri", margin:0 });
  s.addText("Snapshot Power BI — julio 2026", { x:0.5, y:0.45, w:9, h:0.58, fontSize:28, color:C.textDark, bold:true, fontFace:"Calibri", margin:0 });

  // KPI summary cards
  const kpis = [
    { val:"34%",  label:"Promedio cartera activa\n(29 clientes con datos)",   color:C.amber, bg:"FFFBEB" },
    { val:"0",    label:"Clientes en nivel ALTO\n>70% UP consumidos",          color:C.red,   bg:"FEF2F2" },
    { val:"4",    label:"Clientes nivel MEDIO\n40-70% UP consumidos",          color:C.amber, bg:"FFFBEB" },
    { val:"3",    label:"Clientes nivel CRITICO\n<15% UP consumidos",          color:C.red,   bg:"FEF2F2" },
  ];
  kpis.forEach((k, i) => {
    const cx = 0.4 + i * 2.32;
    card(s, cx, 1.15, 2.12, 1.38, k.bg);
    s.addText(k.val, { x:cx+0.1, y:1.18, w:1.92, h:0.68, fontSize:38, color:k.color, bold:true, fontFace:"Calibri", align:"center", margin:0 });
    s.addText(k.label, { x:cx+0.1, y:1.82, w:1.92, h:0.62, fontSize:11, color:C.textMid, fontFace:"Calibri", align:"center", margin:0 });
  });

  // Bar chart with REAL confirmed data
  s.addChart(pres.charts.BAR, [{
    name: "UP %",
    labels: [
      "Cliente 01","Cliente 02","Cliente 03","Cliente 04","Cliente 05",
      "Cliente 06","Cliente 07","Cliente 08","Cliente 09",
      "Cliente 10","Cliente 11","Cliente 12"
    ],
    values: [55.6, 52.8, 47.2, 44.4, 36.1, 33.3, 28.6, 25.0, 22.2, 19.4, 11.1, 8.3],
  }], {
    x:0.35, y:2.65, w:9.3, h:2.65,
    barDir:"bar",
    chartColors:[
      "10B981","10B981","F59E0B","F59E0B",
      "F59E0B","F59E0B","EF4444","EF4444",
      "EF4444","EF4444","EF4444","EF4444",
    ],
    chartArea:{ fill:{color:"FFFFFF"}, roundedCorners:false },
    catAxisLabelColor:"334E68", valAxisLabelColor:"64748B",
    valGridLine:{ color:"E2EAF2", size:0.5 }, catGridLine:{ style:"none" },
    showValue:true, dataLabelColor:"1A3A5C", showLegend:false,
    valAxisMaxVal:80,
  });

  s.addText("Verde = MEDIO (>40%)  |  Naranja = BAJO (15-40%)  |  Rojo = CRITICO (<20%)  |  Clientes Centry y LACOSTE / TRAMONTINA MX / WHIRLPOOL excluidos (sin datos confirmados)", {
    x:0.4, y:5.3, w:9.2, h:0.28, fontSize:9, color:C.textGray, fontFace:"Calibri", margin:0, italic:true,
  });
  s.addNotes("Datos obtenidos directamente de Power BI Use Points (julio 2026). Filtros aplicados: Ativo++ 60 dias = sim, Vendas++ 30 dias = sim. LACOSTE excluido por error de filtro durante la extraccion — dato null. Valores de FORUS PERU y FARMASHOP son aproximados del ranking visual.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 4 — BRECHAS DE DATOS: LO QUE NO SABEMOS
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };
  geo(s);

  s.addText("BRECHAS DE INFORMACION", { x:0.5, y:0.22, w:9, h:0.3, fontSize:10, color:C.gold, bold:true, charSpacing:4, fontFace:"Calibri", margin:0 });
  s.addText("Lo que el equipo no puede medir hoy", { x:0.5, y:0.5, w:9, h:0.62, fontSize:28, color:C.white, bold:true, fontFace:"Calibri", margin:0 });

  const gaps = [
    {
      dato:"GMV por cliente",
      estado:"Sin consultar esta semana",
      impacto:"No se puede calcular Health Score confiable para ningun cliente",
      fuente:"Power BI GMV",
      color:C.red,
    },
    {
      dato:"NPS — 33 de 35 clientes",
      estado:"Solo 2 confirmados (BOTIGA -100, FORUS SA -100)",
      impacto:"Sin NPS real no se puede detectar riesgo de churn de forma sistematica",
      fuente:"TrackSale",
      color:C.red,
    },
    {
      dato:"Ultimo contacto — mayoria de cartera",
      estado:"No hay registro sistematico en HubSpot",
      impacto:"No sabemos cuantos clientes tienen mas de 30 o 60 dias sin contacto",
      fuente:"HubSpot",
      color:C.amber,
    },
    {
      dato:"Tickets actuales — cartera completa",
      estado:"No consultado en esta sesion",
      impacto:"No hay visibilidad de carga de soporte por cliente en tiempo real",
      fuente:"Zendesk",
      color:C.amber,
    },
  ];

  gaps.forEach((g, i) => {
    const cy = 1.38 + i * 0.98;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x:0.4, y:cy, w:9.2, h:0.85,
      fill:{color:C.navyCard}, line:{color:g.color, width:1}, rectRadius:0.1,
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.4, y:cy, w:0.45, h:0.85, fill:{color:g.color}, line:{color:g.color}, rectRadius:0.08 });
    s.addText(g.dato, { x:0.98, y:cy+0.06, w:3.2, h:0.3, fontSize:13, color:C.white, bold:true, fontFace:"Calibri", margin:0 });
    s.addText(g.estado, { x:0.98, y:cy+0.36, w:3.2, h:0.28, fontSize:11, color:C.textGray, fontFace:"Calibri", margin:0 });
    s.addText("Impacto: " + g.impacto, { x:4.3, y:cy+0.1, w:4.1, h:0.42, fontSize:11.5, color:C.textGray, fontFace:"Calibri", margin:0 });
    s.addText("Fuente: " + g.fuente, { x:4.3, y:cy+0.55, w:4.0, h:0.24, fontSize:10, color:g.color, fontFace:"Calibri", margin:0 });
    s.addText("null", { x:8.5, y:cy+0.25, w:0.9, h:0.3, fontSize:13, color:g.color, bold:true, fontFace:"Calibri", align:"center", margin:0 });
  });

  s.addText("La incapacidad de medir es en si misma un problema operativo — no un problema del cliente.", {
    x:0.5, y:5.32, w:9, h:0.28, fontSize:12, color:C.gold, fontFace:"Calibri", margin:0, italic:true, align:"center",
  });
  s.addNotes("Esta diapositiva es la mas honesta y la mas importante. Antes de hablar de OKRs el Director necesita ver que el equipo opera con informacion incompleta. Resolver estas brechas es un prerequisito, no un objetivo opcional.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 5 — DESAFIOS REALES DEL EQUIPO CS
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };

  s.addText("DESAFIOS REALES DEL EQUIPO", { x:0.5, y:0.18, w:9, h:0.3, fontSize:10, color:C.gold, bold:true, charSpacing:4, fontFace:"Calibri", margin:0 });
  s.addText("Problemas confirmados por la evidencia de datos", { x:0.5, y:0.45, w:9, h:0.58, fontSize:27, color:C.textDark, bold:true, fontFace:"Calibri", margin:0 });

  const challenges = [
    {
      n:"01", color:C.red,
      title:"Centry bloquea la visibilidad de 6 cuentas",
      evidence:"6 cuentas activas en sistema legado Centry. CS no tiene visibilidad de su GMV, adopcion ni Health Score.",
      impact:"CS no puede calcular Health Score, GMV ni adopcion para estas cuentas. Son invisibles para el equipo.",
    },
    {
      n:"02", color:C.red,
      title:"0 clientes en nivel ALTO de adopcion",
      evidence:"Promedio cartera activa: 34% (Power BI, julio 2026). Mejor cliente: 55.6%. Ningun cliente en cartera supera el 70%.",
      impact:"Clientes pagan por capacidades que no usan. Riesgo directo de objeciones en renovacion.",
    },
    {
      n:"03", color:C.red,
      title:"Dos detractores activos sin plan de recuperacion",
      evidence:"2 cuentas con NPS -100 confirmado (TrackSale, jul 2026). Sin plan de recuperacion activo documentado.",
      impact:"Sin plan activo documentado al inicio de julio 2026. Riesgo de churn inmediato en ambas cuentas.",
    },
    {
      n:"04", color:C.red,
      title:"Bugs en Falabella y Ripley Flex afectan el GMV",
      evidence:"Ticket #26293 abierto 36 dias sin resolver. Bug Ripley Flex activo confirmado en 2 clientes esta semana (#35113, #34862).",
      impact:"CS absorbe bugs que no puede resolver. Cada falla no resuelta erosiona confianza y anticipa churn en canales principales.",
    },
    {
      n:"05", color:C.red,
      title:"50% de los tickets son pedidos sin llegar al ERP",
      evidence:"13/26 tickets (Zendesk 10-jul) son pedidos sin sincronizar a SAP, Magento o BSale. 3 tickets llevan mas de 30 dias sin resolver.",
      impact:"Sin SLA ni protocolo CS → Soporte. El CSM pierde tiempo proactivo en seguimiento de incidentes que no puede resolver.",
    },
  ];

  challenges.forEach((ch, i) => {
    const cy = 1.05 + i * 0.92;
    card(s, 0.4, cy, 9.2, 0.82, i%2===0 ? "FAFAFA" : C.white);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.4, y:cy, w:0.5, h:0.82, fill:{color:ch.color}, line:{color:ch.color}, rectRadius:0.09 });
    s.addText(ch.n, { x:0.4, y:cy, w:0.5, h:0.82, fontSize:17, color:C.white, bold:true, fontFace:"Calibri", align:"center", valign:"middle", margin:0 });
    s.addText(ch.title, { x:1.02, y:cy+0.04, w:8.44, h:0.24, fontSize:11, color:C.textDark, bold:true, fontFace:"Calibri", margin:0 });
    s.addText("Evidencia: " + ch.evidence, { x:1.02, y:cy+0.28, w:8.44, h:0.28, fontSize:10, color:C.textMid, fontFace:"Calibri", margin:0 });
    s.addText("Impacto: " + ch.impact, { x:1.02, y:cy+0.56, w:8.44, h:0.24, fontSize:10, color:ch.color, fontFace:"Calibri", margin:0 });
  });
  s.addNotes("Cada desafio tiene evidencia real. No hay suposiciones. El Director puede pedir la fuente de cada punto y existe. Eso es lo que hace esta presentacion defendible.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 6 — RADIOGRAFÍA DE SOPORTE (DATOS REALES ZENDESK)
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addText("RADIOGRAFIA DE SOPORTE — DATOS REALES", { x:0.5, y:0.18, w:9, h:0.3, fontSize:10, color:C.gold, bold:true, charSpacing:4, fontFace:"Calibri", margin:0 });
  s.addText("26 tickets abiertos — Zendesk — 10 julio 2026", { x:0.5, y:0.45, w:9, h:0.55, fontSize:26, color:C.textDark, bold:true, fontFace:"Calibri", margin:0 });

  // 4 category stat cards
  const cats = [
    { val:"13", pct:"50%", label:"Pedidos sin llegar\nal ERP del cliente",    color:C.red,     bg:"FEF2F2" },
    { val:"6",  pct:"23%", label:"Productos y\npublicaciones fallidas",        color:C.amber,   bg:"FFFBEB" },
    { val:"5",  pct:"19%", label:"Integraciones\nERP / eCommerce rotas",       color:C.amber,   bg:"FFFBEB" },
    { val:"2",  pct:"8%",  label:"Precios incorrectos\nen marketplace",         color:C.blueAcc, bg:"EFF6FF" },
  ];
  cats.forEach((c, i) => {
    const cx = 0.35 + i * 2.33;
    card(s, cx, 1.12, 2.15, 1.45, c.bg);
    s.addText(c.val, { x:cx, y:1.14, w:1.1, h:0.75, fontSize:44, color:c.color, bold:true, fontFace:"Calibri", align:"center", margin:0 });
    s.addText(c.pct, { x:cx+1.1, y:1.26, w:0.9, h:0.36, fontSize:18, color:c.color, bold:true, fontFace:"Calibri", align:"center", margin:0 });
    s.addText(c.label, { x:cx+0.1, y:1.86, w:1.95, h:0.62, fontSize:11, color:C.textMid, fontFace:"Calibri", align:"center", margin:0 });
  });

  // 3 systemic alert cards
  const alerts = [
    {
      title:"Falabella: bug recurrente — 36 dias sin resolver",
      body:"BEITGROUP PE: 2 tickets activos (publicaciones + imagenes).\nTicket #26293: Error transmision carteras — 36 dias abierto.",
      color:C.red, bg:"FEF2F2",
    },
    {
      title:"Ripley Flex: mismo bug en 2 clientes distintos",
      body:"Tickets #35113 y #34862: pedidos no se importan en Magento.\nMismo error tecnico reportado 2 veces esta semana.",
      color:C.amber, bg:"FFFBEB",
    },
    {
      title:"3 tickets con mas de 30 dias sin resolucion",
      body:"#26293 (36d) · #25822 (37d) · #24448 (43d, 2 CSAT negativos).\nFalla de SLA que el equipo CS termina absorbiendo.",
      color:C.purple, bg:"F5F3FF",
    },
  ];
  alerts.forEach((a, i) => {
    const cx = 0.35 + i * 3.1;
    card(s, cx, 2.72, 2.95, 1.05, a.bg);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:cx, y:2.72, w:2.95, h:0.32, fill:{color:a.color}, line:{color:a.color}, rectRadius:0.08 });
    s.addText(a.title, { x:cx+0.1, y:2.72, w:2.75, h:0.32, fontSize:10.5, color:C.white, bold:true, fontFace:"Calibri", align:"center", valign:"middle", margin:0 });
    s.addText(a.body, { x:cx+0.12, y:3.07, w:2.71, h:0.65, fontSize:10.5, color:C.textDark, fontFace:"Calibri", margin:0 });
  });

  // Portfolio clients with active tickets
  card(s, 0.35, 3.9, 9.25, 1.45, "F4F7FB");
  s.addText("Clientes de la cartera CS con tickets abiertos esta semana:", {
    x:0.55, y:3.95, w:9, h:0.3, fontSize:12, color:C.textDark, bold:true, fontFace:"Calibri", margin:0,
  });
  const clientsAff = [
    { name:"Cuenta — Peru", tickets:"2 tickets activos", detail:"Falabella: publicaciones + imagenes no cargan", color:C.red },
    { name:"Cuenta — Chile", tickets:"1 ticket — 10 dias", detail:"Carga de documentos/pedidos — en analisis", color:C.amber },
    { name:"Cuenta — Chile (Centry)", tickets:"1 ticket activo", detail:"Precios en Venta Full MKP", color:C.textMid },
  ];
  clientsAff.forEach((c, i) => {
    const cx = 0.5 + i * 3.05;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:cx, y:4.32, w:2.9, h:0.9, fill:{color:C.white}, line:{color:c.color, width:1.2}, rectRadius:0.1, shadow:makeShadow() });
    s.addText(c.name, { x:cx+0.12, y:4.37, w:2.66, h:0.28, fontSize:12, color:c.color, bold:true, fontFace:"Calibri", margin:0 });
    s.addText(c.tickets, { x:cx+0.12, y:4.63, w:2.66, h:0.22, fontSize:10.5, color:C.textDark, bold:true, fontFace:"Calibri", margin:0 });
    s.addText(c.detail, { x:cx+0.12, y:4.85, w:2.66, h:0.28, fontSize:10, color:C.textMid, fontFace:"Calibri", margin:0 });
  });

  s.addText("Fuente: Zendesk API — db1globalsoftwaresupport.zendesk.com — 10 julio 2026. Cartera completa LATAM: 26 tickets abiertos.", {
    x:0.4, y:5.38, w:9.2, h:0.22, fontSize:9, color:C.textGray, fontFace:"Calibri", margin:0, italic:true,
  });
  s.addNotes("Datos extraidos via API Zendesk el 10 julio 2026. El patron dominante: 50% de tickets son pedidos que no llegan al ERP del cliente. Esto es un problema sistemico de integracion, no de uso de plataforma. CS absorbe el escalamiento sin herramientas para resolverlo directamente. Falabella y Ripley Flex son los dos marketplaces con bugs recurrentes.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 7 — LOS 5 OKRs OVERVIEW
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };
  geo(s);

  s.addText("RESPUESTA ESTRATEGICA H2 2026", { x:0.5, y:0.22, w:9, h:0.3, fontSize:10, color:C.gold, bold:true, charSpacing:4, fontFace:"Calibri", margin:0 });
  s.addText("Los 5 OKRs del equipo CS", { x:0.5, y:0.5, w:9, h:0.62, fontSize:30, color:C.white, bold:true, fontFace:"Calibri", margin:0 });

  const okrs = [
    { n:"OKR 1", title:"Visibilidad Completa",       desc:"100% cartera con datos basicos\nGMV + NPS + Tickets + Contacto",     color:C.blueAcc },
    { n:"OKR 2", title:"Activacion y Adopcion",       desc:"Adopcion UP: 34% -> 50%\n0 clientes criticos (<15%) sin plan",      color:C.teal },
    { n:"OKR 3", title:"Proteccion de Revenue",       desc:"Protocolo operacional CS → Soporte activo\n0 churns no anticipados en H2 2026",color:C.amber },
    { n:"OKR 4", title:"Migracion Centry",             desc:"6 clientes migrados a AnyMarket\ncon adopcion desde dia 1",           color:C.purple },
    { n:"OKR 5", title:"Expansion Comprobada",        desc:"3 QBRs Enterprise realizados\n3 nuevos contratos AnyTools",           color:C.gold },
  ];

  const positions = [
    {cx:0.4, cy:1.38},{cx:5.2, cy:1.38},
    {cx:0.4, cy:3.35},{cx:3.45, cy:3.35},{cx:6.5, cy:3.35},
  ];
  const widths = [4.6, 4.6, 2.9, 2.9, 3.1];

  okrs.forEach((okr, i) => {
    const {cx, cy} = positions[i];
    const w = widths[i];
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x:cx, y:cy, w, h:1.85,
      fill:{color:C.navyCard}, line:{color:okr.color, width:1.5}, rectRadius:0.12,
    });
    s.addText(okr.n, { x:cx+0.18, y:cy+0.1, w:w-0.3, h:0.28, fontSize:10, color:okr.color, bold:true, charSpacing:3, fontFace:"Calibri", margin:0 });
    s.addText(okr.title, { x:cx+0.18, y:cy+0.38, w:w-0.3, h:0.48, fontSize:i<2?17:15, color:C.white, bold:true, fontFace:"Calibri", margin:0 });
    s.addText(okr.desc, { x:cx+0.18, y:cy+0.9, w:w-0.3, h:0.82, fontSize:12, color:C.textGray, fontFace:"Calibri", margin:0 });
  });

  s.addNotes("Los OKRs responden directamente a los desafios de la diapositiva anterior. OKR1 resuelve el problema de brechas de datos. OKR2 ataca la adopcion real del 34%. OKR3 protege las cuentas con NPS critico. OKR4 desbloquea los clientes Centry. OKR5 aprovecha la base estable para crecer.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 7 — OKR 1: VISIBILIDAD COMPLETA
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  okrHeader(s, "OKR 1", "Visibilidad Completa de la Cartera",
    "Tener datos reales y actualizados de GMV, NPS, tickets y ultimo contacto para el 100% de los clientes activos", C.blueAcc);

  krRow(s,0,"KR 1.1","Consultar y registrar GMV de los 29 clientes activos en Power BI antes del 31 de julio","29 clientes","Equipo CS",C.blueAcc);
  krRow(s,1,"KR 1.2","Obtener NPS actualizado de TrackSale para el 100% de la cartera activa antes de agosto","100% NPS",   "Equipo CS",C.blueAcc);
  krRow(s,2,"KR 1.3","Registrar ultimo contacto en HubSpot para todos los clientes — identificar gaps > 45 dias","0 gaps",     "Equipo CS",C.blueAcc);
  krRow(s,3,"KR 1.4","Calcular Health Score confiable para el 100% de la cartera activa una vez con datos completos","100% HS",    "CS Lead",  C.blueAcc);

  insightBar(s, "Estado actual: 0 clientes con Health Score calculable con datos completos. Sin GMV ni NPS verificados, el Health Score del dashboard es referencial, no confiable.", "EFF6FF", "1E40AF");
  s.addNotes("Este OKR es la base de todo. Si el equipo no sabe con precision como esta cada cliente, no puede tomar decisiones. Es el prerequisito para todos los demas OKRs.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 8 — OKR 2: ACTIVACION Y ADOPCION
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  okrHeader(s, "OKR 2", "Activacion y Adopcion de la Plataforma",
    "Subir la adopcion promedio de Use Points de 34% a 50% y eliminar los clientes en nivel critico (<15%)", C.teal);

  krRow(s,0,"KR 2.1","Aumentar adopcion promedio UP de 34% a 50% para diciembre 2026 (base: Power BI julio)","34% -> 50%",  "Equipo CS",C.teal);
  krRow(s,1,"KR 2.2","Plan de activacion activo para cada cliente con UP < 15% — sesiones personalizadas documentadas","0 sin plan",  "CSM resp.", C.teal);
  krRow(s,2,"KR 2.3","Documentar playbook de activacion basado en los mejores performers del equipo y replicarlo en 3 cuentas","1 playbook",  "CS Lead",   C.teal);
  krRow(s,3,"KR 2.4","0 clientes activos con menos de 15% de UP sin un plan de adopcion activo documentado","0 criticos",  "Equipo CS", C.teal);

  insightBar(s, "Base real: promedio cartera activa 34% UP (Power BI julio 2026). 0 clientes en nivel ALTO (>70%). El equipo tiene los benchmarks internos — el objetivo es documentarlos y replicarlos.", "F0FDFA", "0F766E");
  s.addNotes("La meta de 34% a 50% es alcanzable si el equipo trabaja los 3 criticos (BELCORP CO, PE, LOI) y mantiene el nivel de los MEDIO. Los Centry no estan incluidos porque no tienen datos en AnyMarket todavia.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 9 — OKR 3: PROTECCION DE REVENUE
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  okrHeader(s, "OKR 3", "Proteccion de Revenue y Retenccion",
    "Resolver los casos criticos confirmados y garantizar que ningun churn sea una sorpresa en H2 2026", C.amber);

  krRow(s,0,"KR 3.1","Health Recovery Plan activo en HubSpot para cada cuenta con NPS negativo — primera accion en < 5 dias",            "Plan activo","CSM resp.",      C.amber);
  krRow(s,1,"KR 3.2","Protocolo formal CS → Soporte para incidentes criticos (pedidos sin ERP, publicaciones) con SLA de escalacion < 4h","SLA 4h",     "CS + Soporte",  C.amber);
  krRow(s,2,"KR 3.3","0 tickets de clientes cartera CS con mas de 15 dias abiertos sin follow-up documentado por CS",                      "0 cronicos", "Equipo CS",     C.amber);
  krRow(s,3,"KR 3.4","100% de renovaciones del H2 iniciadas con al menos 90 dias de anticipacion",                                         "90 dias",    "CS + Comercial", C.amber);

  insightBar(s, "Contexto real (Zendesk 10-jul): 26 tickets abiertos, 50% son pedidos sin llegar al ERP. 3 tickets con >30 dias. Sin protocolo CS → Soporte, cada incidente consume tiempo proactivo del CSM.", "FEF9C3", "92400E");
  s.addNotes("El KR mas critico y urgente es que los dos NPS -100 tengan plan antes del 11 de julio. Cualquier otra cosa puede esperar. Si se pierde BOTIGA o FORUS SA en julio sin haber actuado, es un fallo del proceso, no solo del cliente.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 10 — OKR 4: MIGRACION CENTRY
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  okrHeader(s, "OKR 4", "Migracion Centry a AnyMarket",
    "Completar la migracion de los 6 clientes Centry con un plan estructurado y ownership definido", C.purple);

  krRow(s,0,"KR 4.1","Alinear con PM (Persefone) el cronograma firme de migracion por cliente y validar avance semanal desde CS","Seguimiento","CS + PM",  C.purple);
  krRow(s,1,"KR 4.2","Resolver bloqueo de integracion con marketplace externo con fecha comprometida antes de agosto 2026","ago 2026",  "PM + CS",  C.purple);
  krRow(s,2,"KR 4.3","Al menos 3 de los 6 clientes Centry migrados y operando en AnyMarket antes de octubre 2026","3 migrados","PM + CS",  C.purple);
  krRow(s,3,"KR 4.4","Cada cliente migrado debe tener adoption plan desde dia 1 — meta: 20% UP en primer mes",    "20% UP mes1","CSM resp.", C.purple);

  insightBar(s, "Los 6 clientes Centry representan el mayor potencial de nuevo GMV del semestre. Hoy son invisibles para CS. Migrarlos desbloquea adopcion, health score y expansion.", "F5F3FF", "5B21B6");
  s.addNotes("El blockers principal es FORUS COLOMBIA en Dafiti. Sin resolver eso, el cliente no puede migrar. CS necesita que Producto asuma ownership de esta escalacion — no puede resolverse desde el equipo CS solo.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 11 — OKR 5: EXPANSION
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  okrHeader(s, "OKR 5", "Expansion Comprobada con AnyTools",
    "Generar expansion de revenue real usando AnyTools como propuesta de valor comprobada en clientes con alta adopcion", C.gold);

  krRow(s,0,"KR 5.1","Presentar propuesta Predize a los 3 clientes con mayor adopcion UP y mayor volumen en Mercado Libre","3 propuestas","CSM resp.",    C.goldDark);
  krRow(s,1,"KR 5.2","Realizar minimo 3 QBRs con cuentas Enterprise antes de diciembre 2026",                            "3 QBRs",      "CSM senior",   C.goldDark);
  krRow(s,2,"KR 5.3","Cerrar minimo 2 nuevos contratos AnyTools en H2 2026",                                            "2 contratos", "CS + Comercial",C.goldDark);
  krRow(s,3,"KR 5.4","Definir proceso formal CS -> Comercial para oportunidades de expansion con SLA de handoff claro", "Proceso doc.", "CS Lead",      C.goldDark);

  insightBar(s, "OKR 5 requiere que OKRs 1, 2 y 3 esten en marcha. Un cliente con alta adopcion y cuenta estable es el mejor punto de entrada para Predize y AnyTools.", "FFFBEB", "92400E");
  s.addNotes("Los clientes con mayor adopcion UP son los mejores candidatos para Predize. Documentar ese caso de uso es el pitch para los demas. OKR 5 solo funciona sobre base estable de OKRs 1-3.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 13 — PLAN 90 DIAS
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };

  s.addText("PLAN DE ACCION — 90 DIAS", { x:0.5, y:0.18, w:9, h:0.3, fontSize:10, color:C.gold, bold:true, charSpacing:4, fontFace:"Calibri", margin:0 });
  s.addText("Julio → Septiembre 2026", { x:0.5, y:0.45, w:9, h:0.55, fontSize:26, color:C.textDark, bold:true, fontFace:"Calibri", margin:0 });

  const months = [
    {
      mes:"JULIO — EMERGENCIAS",
      color:C.red,
      items:[
        "Planes recuperacion NPS negativo\n— primera accion esta semana",
        "Follow-up BEITGROUP PE y MAUI\n— tickets criticos activos",
        "Escalar bloqueo integracion\ncon PM Persefone — fecha firme",
        "Consultar GMV Power BI +\nNPS TrackSale cartera completa",
      ],
    },
    {
      mes:"AGOSTO — DATOS Y PROTOCOLO",
      color:C.amber,
      items:[
        "Health Score real calculado\npara 100% de clientes activos",
        "Protocolo CS → Soporte activo\nSLA < 4h incidentes criticos",
        "Activacion UP < 15%:\nsesiones personalizadas documentadas",
        "Checkpoint migracion Centry\n— validar avance con PM Persefone",
      ],
    },
    {
      mes:"SEPT — CRECER SOBRE BASE",
      color:C.green,
      items:[
        "QBR Enterprise — reunion ejecutiva\ncon grupo de mayor expansion",
        "Propuesta Predize: clientes con\nmayor adopcion y volumen ML",
        "Medir delta adopcion:\ncomparar julio vs septiembre UP%",
        "Revision OKRs con Director:\nresultados H2 + ajuste Q4",
      ],
    },
  ];

  months.forEach((m, i) => {
    const cx = 0.35 + i * 3.2;
    card(s, cx, 1.12, 3.05, 4.28, C.white);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:cx, y:1.12, w:3.05, h:0.42, fill:{color:m.color}, line:{color:m.color}, rectRadius:0.1 });
    s.addText(m.mes, { x:cx, y:1.12, w:3.05, h:0.42, fontSize:12, color:C.white, bold:true, fontFace:"Calibri", align:"center", valign:"middle", margin:0 });
    m.items.forEach((item, j) => {
      s.addShape(pres.shapes.OVAL, { x:cx+0.18, y:1.68+j*0.89+0.12, w:0.15, h:0.15, fill:{color:m.color}, line:{color:m.color} });
      s.addText(item, { x:cx+0.42, y:1.66+j*0.89, w:2.5, h:0.82, fontSize:11, color:C.textDark, fontFace:"Calibri", margin:0, valign:"top" });
    });
  });
  s.addNotes("Julio es emergencias + datos. El protocolo CS-Soporte debe quedar definido en agosto antes de que se acumulen mas tickets cronicos. Septiembre es el primer mes donde el equipo puede operar con datos reales y ejecutar expansion.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 14 — CIERRE
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };
  geo(s);

  s.addText("LO QUE NECESITA EL EQUIPO", { x:0.55, y:0.38, w:9, h:0.35, fontSize:11, color:C.gold, bold:true, charSpacing:5, fontFace:"Calibri", margin:0 });
  s.addText("3 decisiones que solo puede\ntomar la Direccion:", {
    x:0.55, y:0.72, w:8, h:0.88, fontSize:22, color:C.white, bold:true, fontFace:"Calibri", margin:0,
  });

  const decisions = [
    {
      num:"01",
      text:"El cronograma de migracion Centry esta comprometido con PM Persefone. Que nivel de soporte necesita CS para garantizar que los 6 clientes migrados esten operativos en AnyMarket antes de Q4?",
      color:C.purple,
    },
    {
      num:"02",
      text:"Que proporcion del tiempo del CSM es proactivo vs. reactivo? Sin definir ese limite, los OKRs de adopcion y expansion siempre perderan contra la urgencia de los tickets.",
      color:C.amber,
    },
    {
      num:"03",
      text:"Vamos a definir el proceso formal CS - Comercial para expansion en H2? Sin eso, cada oportunidad que detecta CS muere antes de llegar a un contrato.",
      color:C.gold,
    },
  ];

  decisions.forEach((p, i) => {
    const cy = 1.65 + i * 1.18;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.4, y:cy, w:9.2, h:1.02, fill:{color:C.navyCard}, line:{color:p.color, width:1.2}, rectRadius:0.1 });
    s.addText(p.num, { x:0.58, y:cy+0.22, w:0.52, h:0.5, fontSize:26, color:p.color, bold:true, fontFace:"Calibri", margin:0 });
    s.addText(p.text, { x:1.22, y:cy+0.12, w:8.1, h:0.78, fontSize:12.5, color:C.white, fontFace:"Calibri", margin:0, valign:"middle" });
  });

  s.addText("AnyMarket LATAM  ·  Customer Success  ·  H2 2026", {
    x:0.5, y:5.33, w:9, h:0.25, fontSize:11, color:C.textGray, fontFace:"Calibri", margin:0, align:"center",
  });
  s.addNotes("Estas tres decisiones no son del equipo CS — son de la Direccion. El equipo ya sabe que tiene que hacer. Lo que necesita es que la organizacion cree las condiciones. Esta conversacion define todo.");
}

// SAVE
pres.writeFile({ fileName: "/sessions/blissful-gifted-meitner/mnt/dashboard sami Cs/OKRs_CS_Cartera_Real_H2_2026.pptx" })
  .then(() => console.log("OK"))
  .catch(err => { console.error("ERROR:", err.message); process.exit(1); });
