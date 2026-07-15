const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Sami - CS AnyMarket LATAM";
pres.title = "OKRs & KPIs AnyTools H2 2026";

// ── PALETTE ──────────────────────────────────────────────────────────────────
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
};

const makeShadow = () => ({ type: "outer", color: "000000", blur: 8, offset: 3, angle: 45, opacity: 0.18 });

function addCard(s, x, y, w, h, bgColor) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: bgColor || C.white },
    line: { color: "E2EAF2", width: 0.5 },
    rectRadius: 0.1,
    shadow: makeShadow(),
  });
}

function addSectionBadge(s, text, color) {
  s.addText(text, { x: 0.5, y: 0.22, w: 1.5, h: 0.3, fontSize: 10, color: color, bold: true, charSpacing: 3, fontFace: "Calibri", margin: 0 });
}

function addPill(s, x, y, text, color) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 1.15, h: 0.3, fill: { color }, line: { color }, rectRadius: 0.15 });
  s.addText(text, { x, y, w: 1.15, h: 0.3, fontSize: 10, color: C.white, bold: true, fontFace: "Calibri", margin: 0, align: "center", valign: "middle" });
}

function slide_addGeo(s) {
  s.addShape(pres.shapes.OVAL, { x: 8.0, y: -1.2, w: 4.5, h: 4.5, fill: { color: C.navyMid }, line: { color: C.navyMid } });
  s.addShape(pres.shapes.OVAL, { x: 8.8, y: 2.5, w: 2.5, h: 2.5, fill: { color: C.teal, transparency: 70 }, line: { color: C.teal, transparency: 70 } });
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — COVER
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };
  slide_addGeo(s);

  s.addText("AnyTools", {
    x: 0.55, y: 1.1, w: 9, h: 0.7, fontSize: 14, color: C.gold, bold: true,
    fontFace: "Calibri", charSpacing: 8, align: "left", margin: 0,
  });
  s.addText("OKRs & KPIs", {
    x: 0.55, y: 1.75, w: 9, h: 1.4, fontSize: 60, color: C.white, bold: true,
    fontFace: "Calibri", align: "left", margin: 0,
  });
  s.addText("H2 2026", {
    x: 0.55, y: 3.1, w: 9, h: 0.9, fontSize: 52, color: C.gold, bold: true,
    fontFace: "Calibri", align: "left", margin: 0,
  });
  s.addText("AnyMarket LATAM  |  Customer Success  |  Julio 2026", {
    x: 0.55, y: 4.6, w: 9, h: 0.4, fontSize: 13, color: C.textGray,
    fontFace: "Calibri", align: "left", margin: 0,
  });

  s.addNotes("Presentación para equipo CS y Dirección. Cubre diagnóstico actual de adopción AnyTools, los 4 OKRs del H2 2026 y el plan de acción por herramienta.");
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — DIAGNÓSTICO
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };

  s.addText("DIAGNÓSTICO", { x: 0.5, y: 0.2, w: 9, h: 0.3, fontSize: 10, color: C.gold, bold: true, charSpacing: 4, fontFace: "Calibri", margin: 0 });
  s.addText("¿Dónde estamos hoy?", { x: 0.5, y: 0.48, w: 9, h: 0.65, fontSize: 30, color: C.textDark, bold: true, fontFace: "Calibri", margin: 0 });

  const stats = [
    { val: "34%",  label: "Adopción Use Points\nPromedio cartera activa", color: C.amber,    bg: "FFFBEB" },
    { val: "0",    label: "Clientes en nivel ALTO\n(>70% UP consumidos)",  color: C.red,      bg: "FEF2F2" },
    { val: "5",    label: "Clientes nivel MEDIO\n(40–70% UP)",             color: C.amber,    bg: "FFFBEB" },
    { val: "8",    label: "Clientes nivel BAJO\n(<40% UP)",                color: C.red,      bg: "FEF2F2" },
    { val: "1",    label: "Cliente sin ningún UP\nconsumido (NO USA)",      color: C.red,      bg: "FEF2F2" },
    { val: "6",    label: "Clientes Centry\nsin datos AnyMarket",           color: C.textGray, bg: "F1F5F9" },
  ];

  stats.forEach((st, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = 0.45 + col * 3.1;
    const cy = 1.35 + row * 1.85;
    addCard(s, cx, cy, 2.85, 1.6, st.bg);
    s.addText(st.val, { x: cx + 0.15, y: cy + 0.1, w: 2.55, h: 0.8, fontSize: 42, color: st.color, bold: true, fontFace: "Calibri", margin: 0, align: "center" });
    s.addText(st.label, { x: cx + 0.1, y: cy + 0.88, w: 2.65, h: 0.65, fontSize: 11, color: C.textMid, fontFace: "Calibri", margin: 0, align: "center" });
  });

  s.addText("Fuente: Power BI Use Points (julio 2026). Portafolio activo: 32 clientes (6 Centry excluidos por estar en migración).", {
    x: 0.5, y: 5.3, w: 9, h: 0.25, fontSize: 9, color: C.textGray, fontFace: "Calibri", margin: 0, italic: true,
  });

  s.addNotes("Ningún cliente está en nivel ALTO. El 34% promedio indica que los clientes pagan por capacidades que no usan — riesgo directo de renovación.");
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — ADOPCIÓN POR CLIENTE (chart)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addText("SNAPSHOT DEL PORTAFOLIO", { x: 0.5, y: 0.18, w: 9, h: 0.3, fontSize: 10, color: C.gold, bold: true, charSpacing: 4, fontFace: "Calibri", margin: 0 });
  s.addText("Adopción Use Points por cliente (julio 2026)", { x: 0.5, y: 0.45, w: 9, h: 0.55, fontSize: 28, color: C.textDark, bold: true, fontFace: "Calibri", margin: 0 });

  const chartData = [
    {
      name: "UP %",
      labels: [
        "KAYSER","EMMA SLEEP CL","FORUS PERU","FARMASHOP","BOTIGA",
        "EMMA SLEEP CO","LACOSTE","BELCORP CL","TRAMONTINA","FASHIONS PARK",
        "LOI","BELCORP PE","BELCORP CO","Promedio"
      ],
      values: [55.6, 52.8, 47.2, 44.4, 36.1, 33.3, 31.9, 28.6, 25.0, 22.2, 19.4, 11.1, 8.3, 33.94],
    }
  ];

  s.addChart(pres.charts.BAR, chartData, {
    x: 0.35, y: 1.1, w: 9.3, h: 4.1,
    barDir: "bar",
    chartColors: [
      "10B981","10B981","F59E0B","F59E0B","F59E0B",
      "F59E0B","EF4444","EF4444","EF4444","EF4444",
      "EF4444","EF4444","EF4444","3B82F6"
    ],
    chartArea: { fill: { color: "FFFFFF" }, roundedCorners: false },
    catAxisLabelColor: "334E68",
    valAxisLabelColor: "64748B",
    valGridLine: { color: "E2EAF2", size: 0.5 },
    catGridLine: { style: "none" },
    showValue: true,
    dataLabelColor: "1A3A5C",
    showLegend: false,
    valAxisMaxVal: 80,
  });

  s.addText("Verde = MEDIO (>40%)    |    Naranja = BAJO (<40%)    |    Rojo = CRITICO (<20%)    |    Azul = Promedio cartera (34%)", {
    x: 0.5, y: 5.3, w: 9, h: 0.28, fontSize: 10, color: C.textMid, fontFace: "Calibri", margin: 0,
  });

  s.addNotes("Meta H2: mover el máximo de clientes sobre el 70% (nivel ALTO). KAYSER y EMMA SLEEP CL son los benchmarks internos. BELCORP CO (8.3%) es prioridad crítica de activación.");
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — LOS 4 OKRs (overview)
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };
  slide_addGeo(s);

  s.addText("MARCO ESTRATÉGICO H2 2026", { x: 0.5, y: 0.22, w: 9, h: 0.3, fontSize: 10, color: C.gold, bold: true, charSpacing: 4, fontFace: "Calibri", margin: 0 });
  s.addText("Los 4 OKRs de AnyTools", { x: 0.5, y: 0.5, w: 9, h: 0.65, fontSize: 30, color: C.white, bold: true, fontFace: "Calibri", margin: 0 });

  const okrs = [
    { num: "OKR 1", icon: "🚀", title: "Activación & Adopción",    desc: "Cartera activa al 55% UP promedio\n8 clientes en nivel ALTO para dic", color: C.teal },
    { num: "OKR 2", icon: "💰", title: "Revenue Expansion",        desc: "+15% MRR vía AnyTools\n5 nuevas contrataciones H2",           color: C.gold },
    { num: "OKR 3", icon: "🔒", title: "Retención & Health Score", desc: "0% churn · NPS 67 → 75\nHealth Score 82% → 88%",               color: C.green },
    { num: "OKR 4", icon: "⚡", title: "Migración Centry",          desc: "6 clientes Centry migrados\n20% UP consumidos en mes 1",        color: C.blueAcc },
  ];

  okrs.forEach((okr, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = 0.4 + col * 4.8;
    const cy = 1.38 + row * 2.08;

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: cx, y: cy, w: 4.55, h: 1.9,
      fill: { color: C.navyCard },
      line: { color: okr.color, width: 1.5 },
      rectRadius: 0.12,
    });

    s.addText(okr.num, { x: cx + 0.2, y: cy + 0.12, w: 1.4, h: 0.3, fontSize: 10, color: okr.color, bold: true, charSpacing: 3, fontFace: "Calibri", margin: 0 });
    s.addText(okr.icon + " " + okr.title, { x: cx + 0.2, y: cy + 0.42, w: 4.15, h: 0.52, fontSize: 18, color: C.white, bold: true, fontFace: "Calibri", margin: 0 });
    s.addText(okr.desc, { x: cx + 0.2, y: cy + 0.98, w: 4.15, h: 0.78, fontSize: 13, color: C.textGray, fontFace: "Calibri", margin: 0 });
  });

  s.addNotes("Los 4 OKRs son complementarios: sin adopción (OKR1) no hay expansión (OKR2). Sin salud (OKR3) el trabajo de expansión se destruye por churn. La migración Centry (OKR4) es la mayor oportunidad de GMV nuevo del semestre.");
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 5 — OKR 1
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };

  addSectionBadge(s, "OKR 1", C.teal);
  s.addText("🚀 Activación & Adopción de AnyTools", { x: 0.5, y: 0.5, w: 9, h: 0.65, fontSize: 25, color: C.textDark, bold: true, fontFace: "Calibri", margin: 0 });
  s.addText("Objetivo: Posicionar AnyTools como parte indispensable de la operación de cada cliente LATAM", {
    x: 0.5, y: 1.12, w: 9, h: 0.38, fontSize: 13, color: C.textMid, fontFace: "Calibri", margin: 0, italic: true,
  });

  const krs = [
    { kr: "KR 1.1", desc: "Aumentar adopción promedio de Use Points de 34% → 55% para diciembre 2026",           target: "55%" },
    { kr: "KR 1.2", desc: "Llevar mínimo 8 clientes activos a nivel ALTO (>70% UP consumidos)",                  target: "8 clientes" },
    { kr: "KR 1.3", desc: "Eliminar nivel NO USA — 100% de clientes activos con al menos 1 UP consumido",         target: "0 NO USA" },
    { kr: "KR 1.4", desc: "Realizar workshop de adopción AnyTools con los 5 clientes nivel MEDIO antes de sept", target: "5 talleres" },
  ];

  krs.forEach((kr, i) => {
    const cy = 1.62 + i * 0.88;
    addCard(s, 0.4, cy, 9.2, 0.75, C.white);
    s.addText(kr.kr, { x: 0.6, y: cy + 0.12, w: 1.0, h: 0.3, fontSize: 11, color: C.teal, bold: true, fontFace: "Calibri", margin: 0 });
    s.addText(kr.desc, { x: 1.72, y: cy + 0.15, w: 5.75, h: 0.45, fontSize: 13, color: C.textDark, fontFace: "Calibri", margin: 0 });
    addPill(s, 7.7, cy + 0.2, kr.target, C.teal);
  });

  addCard(s, 0.4, 5.18, 9.2, 0.3, "F0FDFA");
  s.addText("💡 Benchmarks internos a replicar: KAYSER (55.6%) y EMMA SLEEP CL (52.8%) — invitarlos a compartir su uso con el resto del portafolio", {
    x: 0.6, y: 5.2, w: 8.9, h: 0.26, fontSize: 11, color: "0F766E", fontFace: "Calibri", margin: 0,
  });

  s.addNotes("KR 1.1 requiere trabajar especialmente con BELCORP CO (8.3%), LOI (19.4%) y BELCORP PE (11.1%). El salto de 34% a 55% es ambicioso pero alcanzable con activaciones enfocadas en los detractores.");
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 6 — OKR 2
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };

  addSectionBadge(s, "OKR 2", C.gold);
  s.addText("💰 Revenue Expansion vía AnyTools", { x: 0.5, y: 0.5, w: 9, h: 0.65, fontSize: 25, color: C.textDark, bold: true, fontFace: "Calibri", margin: 0 });
  s.addText("Objetivo: Convertir AnyTools en motor de expansión de MRR en la cartera LATAM durante H2 2026", {
    x: 0.5, y: 1.12, w: 9, h: 0.38, fontSize: 13, color: C.textMid, fontFace: "Calibri", margin: 0, italic: true,
  });

  const krs = [
    { kr: "KR 2.1", desc: "Cerrar 5 nuevas contrataciones de herramientas AnyTools en cartera activa",               target: "5 deals" },
    { kr: "KR 2.2", desc: "Generar +15% de MRR vía upsell/cross-sell AnyTools vs cierre H1 2026",                    target: "+15% MRR" },
    { kr: "KR 2.3", desc: "Presentar propuesta comercial de Predize a todos los clientes tier A y B del portafolio",  target: "100% tier A/B" },
    { kr: "KR 2.4", desc: "Convertir 3 demos de Predize o Koncili en contratos efectivos antes de octubre",           target: "3 contratos" },
  ];

  krs.forEach((kr, i) => {
    const cy = 1.62 + i * 0.88;
    addCard(s, 0.4, cy, 9.2, 0.75, C.white);
    s.addText(kr.kr, { x: 0.6, y: cy + 0.12, w: 1.0, h: 0.3, fontSize: 11, color: C.goldDark, bold: true, fontFace: "Calibri", margin: 0 });
    s.addText(kr.desc, { x: 1.72, y: cy + 0.15, w: 5.75, h: 0.45, fontSize: 13, color: C.textDark, fontFace: "Calibri", margin: 0 });
    addPill(s, 7.7, cy + 0.2, kr.target, C.goldDark);
  });

  addCard(s, 0.4, 5.18, 9.2, 0.3, "FFFBEB");
  s.addText("💡 Mayor oportunidad Predize: KAYSER, TRAMONTINA CL y LACOSTE — alto volumen SKUs en marketplaces competitivos (ML, Paris, Falabella)", {
    x: 0.6, y: 5.2, w: 8.9, h: 0.26, fontSize: 11, color: "92400E", fontFace: "Calibri", margin: 0,
  });

  s.addNotes("Predize tiene el mayor ROI demostrable para el cliente (incremento Buy Box % y GMV). Priorizar demos con clientes de alta operación en Mercado Libre.");
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 7 — OKR 3
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };

  addSectionBadge(s, "OKR 3", C.green);
  s.addText("🔒 Retención & Health Score del Portafolio", { x: 0.5, y: 0.5, w: 9, h: 0.65, fontSize: 25, color: C.textDark, bold: true, fontFace: "Calibri", margin: 0 });
  s.addText("Objetivo: Proteger el 100% del revenue y mejorar la salud promedio de la cartera antes de diciembre 2026", {
    x: 0.5, y: 1.12, w: 9, h: 0.38, fontSize: 13, color: C.textMid, fontFace: "Calibri", margin: 0, italic: true,
  });

  const krs = [
    { kr: "KR 3.1", desc: "Mantener churn en 0% durante todo H2 2026 — cero cancelaciones",                    target: "0% churn" },
    { kr: "KR 3.2", desc: "Mejorar NPS promedio de cartera de 67 → 75 para diciembre 2026",                    target: "NPS 75" },
    { kr: "KR 3.3", desc: "Resolver NPS crítico COBOE BOTIGA y FORUS SA (NPS -100) antes de agosto 2026",      target: "NPS ≥ 0" },
    { kr: "KR 3.4", desc: "Llevar Health Score promedio de portafolio de 82% → 88% para diciembre 2026",       target: "HS 88%" },
  ];

  krs.forEach((kr, i) => {
    const cy = 1.62 + i * 0.88;
    addCard(s, 0.4, cy, 9.2, 0.75, C.white);
    s.addText(kr.kr, { x: 0.6, y: cy + 0.12, w: 1.0, h: 0.3, fontSize: 11, color: C.green, bold: true, fontFace: "Calibri", margin: 0 });
    s.addText(kr.desc, { x: 1.72, y: cy + 0.15, w: 5.75, h: 0.45, fontSize: 13, color: C.textDark, fontFace: "Calibri", margin: 0 });
    addPill(s, 7.7, cy + 0.2, kr.target, C.green);
  });

  addCard(s, 0.4, 5.18, 9.2, 0.3, "FEF2F2");
  s.addText("🚨 Críticos activos: FORUS COLOMBIA (migración bloqueada Dafiti) · COBOE BOTIGA (NPS -100) · FORUS SA (NPS -100) — prioridad semana 1", {
    x: 0.6, y: 5.2, w: 8.9, h: 0.26, fontSize: 11, color: "991B1B", fontFace: "Calibri", margin: 0,
  });

  s.addNotes("KR 3.3 es la prioridad más urgente: BOTIGA y FORUS SA están en riesgo de churn activo. Sin resolverlos, el NPS promedio no puede mejorar y la narrativa de expansión pierde credibilidad.");
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 8 — OKR 4
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };

  addSectionBadge(s, "OKR 4", C.blueAcc);
  s.addText("⚡ Migración Centry → AnyMarket", { x: 0.5, y: 0.5, w: 9, h: 0.65, fontSize: 25, color: C.textDark, bold: true, fontFace: "Calibri", margin: 0 });
  s.addText("Objetivo: Completar migración de los 6 clientes Centry con adopción funcional desde el primer mes post-migración", {
    x: 0.5, y: 1.12, w: 9, h: 0.38, fontSize: 13, color: C.textMid, fontFace: "Calibri", margin: 0, italic: true,
  });

  const krs = [
    { kr: "KR 4.1", desc: "100% de los 6 clientes Centry con migración técnica completada antes de octubre 2026",       target: "oct 2026" },
    { kr: "KR 4.2", desc: "Lograr ≥20% de Use Points consumidos en primer mes AnyMarket para cada cliente Centry",       target: "20% UP mes 1" },
    { kr: "KR 4.3", desc: "Completar debloqueo de FORUS COLOMBIA en Dafiti antes de agosto 2026",                        target: "ago 2026" },
    { kr: "KR 4.4", desc: "Realizar primer Executive Business Review con Forus Group (SA+CO+PE) antes de septiembre",    target: "sept 2026" },
  ];

  krs.forEach((kr, i) => {
    const cy = 1.62 + i * 0.88;
    addCard(s, 0.4, cy, 9.2, 0.75, C.white);
    s.addText(kr.kr, { x: 0.6, y: cy + 0.12, w: 1.0, h: 0.3, fontSize: 11, color: C.blueAcc, bold: true, fontFace: "Calibri", margin: 0 });
    s.addText(kr.desc, { x: 1.72, y: cy + 0.15, w: 5.75, h: 0.45, fontSize: 13, color: C.textDark, fontFace: "Calibri", margin: 0 });
    addPill(s, 7.7, cy + 0.2, kr.target, C.blueAcc);
  });

  addCard(s, 0.4, 5.18, 9.2, 0.3, "EFF6FF");
  s.addText("📦 Clientes Centry: FORUS SA · FORUS CO · FORUS PE · GINO · LOUNGE S/A · MAISA — mayor oportunidad de GMV nuevo del semestre", {
    x: 0.6, y: 5.2, w: 8.9, h: 0.26, fontSize: 11, color: "1E40AF", fontFace: "Calibri", margin: 0,
  });

  s.addNotes("Los 6 clientes Centry representan la mayor oportunidad de GMV nuevo. FORUS GROUP (SA+CO+PE) es un cliente Enterprise actualmente invisible en los KPIs de AnyMarket. El debloqueo Dafiti para FORUS CO es el blocker principal.");
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 9 — KPIs POR HERRAMIENTA
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addText("KPIs POR HERRAMIENTA", { x: 0.5, y: 0.18, w: 9, h: 0.3, fontSize: 10, color: C.gold, bold: true, charSpacing: 4, fontFace: "Calibri", margin: 0 });
  s.addText("AnyTools — Métricas de éxito H2 2026", { x: 0.5, y: 0.45, w: 9, h: 0.55, fontSize: 26, color: C.textDark, bold: true, fontFace: "Calibri", margin: 0 });

  const tools = [
    {
      name: "Predize", subtitle: "Repricing inteligente",
      icon: "⚡",
      color: "7C3AED", bgColor: "F5F3FF",
      kpis: ["Adopt. rate → 30% cartera activa", "Demos realizadas → 5 en H2", "Contratos nuevos → 3", "Buy Box mejora → +8pp por cliente"],
    },
    {
      name: "Marca Seleta", subtitle: "Protección de marca",
      icon: "🏷",
      color: "DB2777", bgColor: "FDF2F8",
      kpis: ["Adopt. rate → 20% cartera activa", "Clientes Enterprise → 100% presentados", "Activaciones nuevas → 2", "NPS post-activación → ≥70"],
    },
    {
      name: "Koncili", subtitle: "Conciliación financiera",
      icon: "🔢",
      color: "0891B2", bgColor: "ECFEFF",
      kpis: ["Adopt. rate → 25% cartera activa", "Onboarding < 30 días", "Contratos nuevos → 2", "Errores financieros detectados → KPI base"],
    },
    {
      name: "WinnerBox", subtitle: "Inteligencia competitiva",
      icon: "👁",
      color: "059669", bgColor: "ECFDF5",
      kpis: ["Clientes con acceso → 4 nuevos", "Demos realizadas → 6 en H2", "Penetración tier A → 100%", "Reports de insights → mensual"],
    },
  ];

  tools.forEach((tool, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = 0.35 + col * 4.8;
    const cy = 1.12 + row * 2.15;

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: cx, y: cy, w: 4.6, h: 2.0,
      fill: { color: tool.bgColor },
      line: { color: tool.color, width: 1 },
      rectRadius: 0.12,
      shadow: makeShadow(),
    });

    s.addText(tool.icon + " " + tool.name, { x: cx + 0.2, y: cy + 0.12, w: 4.2, h: 0.38, fontSize: 16, color: tool.color, bold: true, fontFace: "Calibri", margin: 0 });
    s.addText(tool.subtitle, { x: cx + 0.2, y: cy + 0.48, w: 4.2, h: 0.28, fontSize: 11, color: C.textGray, fontFace: "Calibri", margin: 0, italic: true });

    tool.kpis.forEach((kpi, j) => {
      s.addText([
        { text: "→ ", options: { bold: true, color: tool.color } },
        { text: kpi, options: { color: C.textDark } },
      ], {
        x: cx + 0.2, y: cy + 0.8 + j * 0.3, w: 4.25, h: 0.28, fontSize: 12, fontFace: "Calibri", margin: 0,
      });
    });
  });

  s.addNotes("Los KPIs por herramienta se revisan mensualmente. Predize y Koncili tienen el mayor potencial de nuevas contrataciones porque resuelven problemas operativos concretos y medibles para el cliente.");
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 10 — PLAN 90 DÍAS
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };

  s.addText("PLAN DE ACCIÓN", { x: 0.5, y: 0.18, w: 9, h: 0.3, fontSize: 10, color: C.gold, bold: true, charSpacing: 4, fontFace: "Calibri", margin: 0 });
  s.addText("Roadmap de ejecución — Jul → Sep 2026", { x: 0.5, y: 0.45, w: 9, h: 0.55, fontSize: 26, color: C.textDark, bold: true, fontFace: "Calibri", margin: 0 });

  const months = [
    {
      mes: "JULIO 2026",
      color: C.teal,
      items: [
        "Contactar BOTIGA + FORUS SA (NPS -100)\nplan de recuperación escrito",
        "Mapear clientes UP < 20%\nplan de activación personalizado",
        "Escalar debloqueo Dafiti FORUS CO\ncon Product Manager",
        "Quick wins: revisar UP con\nKAYSER, EMMA SLEEP, FORUS PE",
      ],
    },
    {
      mes: "AGOSTO 2026",
      color: C.gold,
      items: [
        "Workshops adopción con\n5 clientes nivel MEDIO",
        "Propuesta Predize a\nKAYSER, TRAMONTINA, LACOSTE",
        "Check-in migración Centry\nvalidar avance técnico",
        "Executive review a\ntodos los clientes tier A y B",
      ],
    },
    {
      mes: "SEPTIEMBRE 2026",
      color: C.blueAcc,
      items: [
        "QBR Forus Group (SA+CO+PE)\nprimera reunión ejecutiva conjunta",
        "Cerrar min. 2 demos convertidas\nen contratos AnyTools",
        "Medir delta adopción vs julio\najustar plan Q4",
        "Revisión OKRs con\nDirección CS",
      ],
    },
  ];

  months.forEach((m, i) => {
    const cx = 0.35 + i * 3.2;
    addCard(s, cx, 1.1, 3.05, 4.3, C.white);

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: cx, y: 1.1, w: 3.05, h: 0.4,
      fill: { color: m.color }, line: { color: m.color }, rectRadius: 0.1,
    });
    s.addText(m.mes, { x: cx, y: 1.1, w: 3.05, h: 0.4, fontSize: 13, color: C.white, bold: true, fontFace: "Calibri", align: "center", valign: "middle", margin: 0 });

    m.items.forEach((item, j) => {
      const itemY = 1.62 + j * 0.9;
      s.addShape(pres.shapes.OVAL, { x: cx + 0.15, y: itemY + 0.08, w: 0.22, h: 0.22, fill: { color: m.color }, line: { color: m.color } });
      s.addText(item, {
        x: cx + 0.45, y: itemY, w: 2.48, h: 0.82,
        fontSize: 11, color: C.textDark, fontFace: "Calibri", margin: 0, valign: "top",
      });
    });
  });

  s.addNotes("Julio debe apagar los incendios críticos antes de acelerar expansión. Sin resolver BOTIGA y FORUS SA no es posible un discurso de expansión creíble.");
}

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 11 — CIERRE
// ════════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };
  slide_addGeo(s);

  s.addText("PRÓXIMAS ACCIONES", { x: 0.55, y: 0.42, w: 9, h: 0.35, fontSize: 11, color: C.gold, bold: true, charSpacing: 5, fontFace: "Calibri", margin: 0 });
  s.addText("3 prioridades para la semana 1 de julio:", {
    x: 0.55, y: 0.78, w: 7, h: 0.62, fontSize: 22, color: C.white, bold: true, fontFace: "Calibri", margin: 0,
  });

  const prioridades = [
    { num: "01", text: "Llamar HOY a COBOE BOTIGA y FORUS SA. Entender la raíz del NPS -100 y generar un plan de recuperación escrito antes del viernes.", color: C.red },
    { num: "02", text: "Escalar con el PM el debloqueo de FORUS COLOMBIA en Dafiti. Establecer fecha límite y stakeholders responsables.", color: C.amber },
    { num: "03", text: "Agendar sesiones de adopción con BELCORP CO (8.3% UP). Es la cuenta con mayor brecha y mayor potencial de mejora rápida.", color: C.teal },
  ];

  prioridades.forEach((p, i) => {
    const cy = 1.48 + i * 1.22;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.4, y: cy, w: 9.2, h: 0.98,
      fill: { color: C.navyCard }, line: { color: p.color, width: 1.2 }, rectRadius: 0.1,
    });
    s.addText(p.num, { x: 0.58, y: cy + 0.22, w: 0.55, h: 0.5, fontSize: 26, color: p.color, bold: true, fontFace: "Calibri", margin: 0 });
    s.addText(p.text, { x: 1.25, y: cy + 0.12, w: 8.1, h: 0.75, fontSize: 13, color: C.white, fontFace: "Calibri", margin: 0, valign: "middle" });
  });

  s.addText("AnyMarket LATAM  ·  Customer Success  ·  Sami  ·  H2 2026", {
    x: 0.5, y: 5.32, w: 9, h: 0.25, fontSize: 11, color: C.textGray, fontFace: "Calibri", margin: 0, align: "center",
  });

  s.addNotes("Mensaje clave para Dirección: la oportunidad de expansión existe, pero el prerrequisito es resolver los focos de NPS negativo. Sin esto, la narrativa de crecimiento pierde credibilidad.");
}

// ════════════════════════════════════════════════════════════════════════════
// SAVE
// ════════════════════════════════════════════════════════════════════════════
pres.writeFile({ fileName: "/sessions/blissful-gifted-meitner/mnt/dashboard sami Cs/OKRs_AnyTools_H2_2026.pptx" })
  .then(() => console.log("OK"))
  .catch(err => { console.error("ERROR:", err.message); process.exit(1); });
