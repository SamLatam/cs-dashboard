const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "CS AnyMarket LATAM";
pres.title = "OKRs CS AnyMarket LATAM H2 2026";

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

function okrHeader(s, okrNum, icon, title, obj, color) {
  badge(s, okrNum, color);
  s.addText(icon + " " + title, { x:0.5, y:0.5, w:9, h:0.62, fontSize:25, color:C.textDark, bold:true, fontFace:"Calibri", margin:0 });
  s.addText("Objetivo: " + obj, { x:0.5, y:1.1, w:9, h:0.38, fontSize:13, color:C.textMid, fontFace:"Calibri", margin:0, italic:true });
}

function krRow(s, i, kr, desc, target, owner, color) {
  const cy = 1.62 + i * 0.87;
  card(s, 0.4, cy, 9.2, 0.74, C.white);
  s.addText(kr, { x:0.6, y:cy+0.12, w:1.0, h:0.3, fontSize:11, color, bold:true, fontFace:"Calibri", margin:0 });
  s.addText(desc, { x:1.72, y:cy+0.14, w:5.6, h:0.45, fontSize:13, color:C.textDark, fontFace:"Calibri", margin:0 });
  pill(s, 7.6, cy+0.2, target, color, 1.2);
  s.addText(owner, { x:8.85, y:cy+0.46, w:0.75, h:0.22, fontSize:9, color:C.textGray, fontFace:"Calibri", margin:0, align:"right" });
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
  s.addText("AnyMarket LATAM  |  Chile  Colombia  Uruguay  Peru  Mexico  |  Julio 2026", {
    x:0.55, y:4.58, w:9, h:0.38, fontSize:12, color:C.textGray,
    fontFace:"Calibri", align:"left", margin:0,
  });
  s.addNotes("OKRs del equipo completo de CS AnyMarket LATAM. Cubre diagnóstico sistémico, 5 OKRs de operación, condiciones necesarias y plan de 90 días para convertir CS de soporte premium a motor de crecimiento.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 2 — LOS 5 PROBLEMAS SISTÉMICOS
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.white };

  s.addText("DIAGNÓSTICO DEL EQUIPO", { x:0.5, y:0.18, w:9, h:0.3, fontSize:10, color:C.gold, bold:true, charSpacing:4, fontFace:"Calibri", margin:0 });
  s.addText("Los 5 problemas sistémicos de CS LATAM", { x:0.5, y:0.45, w:9, h:0.6, fontSize:28, color:C.textDark, bold:true, fontFace:"Calibri", margin:0 });

  const problems = [
    { num:"01", title:"CS opera como soporte premium",       desc:"60-70% del tiempo en tareas reactivas. El trabajo proactivo (EBRs, expansión, adopción) siempre queda para despues.", color:C.red },
    { num:"02", title:"No hay playbooks estandarizados",     desc:"Lo que funciono con KAYSER (55.6% UP) no esta documentado ni replicado. El conocimiento vive en la cabeza de cada CSM.", color:C.amber },
    { num:"03", title:"Migracion Centry sin dueno claro",    desc:"6 clientes en sistema legado. CS recibe el impacto (NPS bajo, tickets, frustración) sin poder resolver la causa raiz.", color:C.red },
    { num:"04", title:"Sin segmentacion de cartera",         desc:"Todos los clientes consumen el mismo tiempo del CSM sin importar su ARR o potencial. Los cuentas grandes no reciben atencion proporcional.", color:C.amber },
    { num:"05", title:"CS no es dueno del ciclo de valor",   desc:"Onboarding, expansion y renovacion estan fragmentados entre areas. CS queda en el medio sin north star claro.", color:C.amber },
  ];

  problems.forEach((p, i) => {
    const cy = 1.18 + i * 0.83;
    card(s, 0.4, cy, 9.2, 0.72, i % 2 === 0 ? "FAFAFA" : C.white);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.4, y:cy, w:0.52, h:0.72, fill:{color:p.color}, line:{color:p.color}, rectRadius:0.1 });
    s.addText(p.num, { x:0.4, y:cy, w:0.52, h:0.72, fontSize:18, color:C.white, bold:true, fontFace:"Calibri", align:"center", valign:"middle", margin:0 });
    s.addText(p.title, { x:1.02, y:cy+0.08, w:3.8, h:0.32, fontSize:13, color:C.textDark, bold:true, fontFace:"Calibri", margin:0 });
    s.addText(p.desc, { x:1.02, y:cy+0.38, w:8.48, h:0.28, fontSize:11, color:C.textMid, fontFace:"Calibri", margin:0 });
  });

  s.addNotes("Estos no son problemas de clientes individuales — son problemas de sistema. Un CSM no puede resolver un sistema roto siendo más heroico. Necesita procesos, herramientas y acuerdos organizacionales.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 3 — EL ROL DE CS: DE SOPORTE A MOTOR
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };
  geo(s);

  s.addText("EL ROL DEL EQUIPO CS", { x:0.5, y:0.22, w:9, h:0.3, fontSize:10, color:C.gold, bold:true, charSpacing:4, fontFace:"Calibri", margin:0 });
  s.addText("De soporte premium a motor de crecimiento", { x:0.5, y:0.5, w:9, h:0.65, fontSize:28, color:C.white, bold:true, fontFace:"Calibri", margin:0 });

  // LEFT: what we are now
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.4, y:1.3, w:4.3, h:4.0, fill:{color:C.navyCard}, line:{color:C.red, width:1.2}, rectRadius:0.12 });
  s.addText("HOY", { x:0.4, y:1.3, w:4.3, h:0.42, fontSize:14, color:C.red, bold:true, fontFace:"Calibri", align:"center", valign:"middle", margin:0 });
  const hoy = [
    "Recolectar datos en 5 herramientas",
    "Seguimiento de tickets ajenos",
    "Coordinacion de migraciones sin ser PM",
    "Responder urgentes todo el dia",
    "Renovaciones de ultimo minuto",
    "Sin playbook: cada caso desde cero",
  ];
  hoy.forEach((item, i) => {
    s.addText([
      { text:"- ", options:{ color:C.red, bold:true } },
      { text:item, options:{ color:C.textGray } },
    ], { x:0.6, y:1.82+i*0.45, w:4.0, h:0.38, fontSize:13, fontFace:"Calibri", margin:0 });
  });

  // ARROW
  s.addShape(pres.shapes.LINE, { x:4.85, y:3.3, w:0.7, h:0, line:{color:C.gold, width:2} });
  s.addText("->", { x:4.78, y:3.1, w:0.85, h:0.4, fontSize:24, color:C.gold, bold:true, fontFace:"Calibri", align:"center", margin:0 });

  // RIGHT: where we should be
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:5.3, y:1.3, w:4.3, h:4.0, fill:{color:C.navyCard}, line:{color:C.teal, width:1.2}, rectRadius:0.12 });
  s.addText("H2 2026", { x:5.3, y:1.3, w:4.3, h:0.42, fontSize:14, color:C.teal, bold:true, fontFace:"Calibri", align:"center", valign:"middle", margin:0 });
  const futuro = [
    "Dashboard en tiempo real — 1 sola fuente",
    "Playbooks para cada situacion critica",
    "Cadencia proactiva con todos los clientes",
    "EBRs y QBRs como proceso sistematico",
    "Renovaciones con 90 dias de anticipacion",
    "Expansion como resultado de la adopcion",
  ];
  futuro.forEach((item, i) => {
    s.addText([
      { text:"+ ", options:{ color:C.teal, bold:true } },
      { text:item, options:{ color:C.white } },
    ], { x:5.5, y:1.82+i*0.45, w:4.0, h:0.38, fontSize:13, fontFace:"Calibri", margin:0 });
  });

  s.addNotes("La transicion de reactivo a proactivo no ocurre sola. Necesita procesos documentados, acuerdos con otras areas y tiempo protegido. Sin esas condiciones, el equipo seguira en modo 'apaga incendios' indefinidamente.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 4 — LO QUE NECESITAMOS
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };

  s.addText("CONDICIONES NECESARIAS", { x:0.5, y:0.18, w:9, h:0.3, fontSize:10, color:C.gold, bold:true, charSpacing:4, fontFace:"Calibri", margin:0 });
  s.addText("Lo que el equipo necesita para ejecutar", { x:0.5, y:0.45, w:9, h:0.6, fontSize:28, color:C.textDark, bold:true, fontFace:"Calibri", margin:0 });

  const needs = [
    {
      cat:"Procesos",  color:C.teal,
      items:["Playbook onboarding — first value < 30 dias","Playbook NPS negativo — plan en < 72h","Playbook activacion UP < 40%","Proceso CS→Comercial para oportunidades expansion"],
    },
    {
      cat:"Organizacion", color:C.gold,
      items:["Segmentacion cartera: high/mid/tech-touch","SLA interno: tiempo de respuesta de Producto y Soporte","PM owner para migracion Centry con fecha entrega","Tiempo protegido para trabajo proactivo (min 40%)"],
    },
    {
      cat:"Herramientas",  color:C.blueAcc,
      items:["Dashboard salud en tiempo real (ya existe)","Visibilidad GMV sin entrar a Power BI manualmente","Registro unico de touchpoints en HubSpot","Alertas automaticas: NPS negativo, sin contacto > 30 dias"],
    },
  ];

  needs.forEach((n, i) => {
    const cx = 0.35 + i * 3.2;
    card(s, cx, 1.18, 3.05, 4.2, C.white);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:cx, y:1.18, w:3.05, h:0.4, fill:{color:n.color}, line:{color:n.color}, rectRadius:0.1 });
    s.addText(n.cat, { x:cx, y:1.18, w:3.05, h:0.4, fontSize:14, color:C.white, bold:true, fontFace:"Calibri", align:"center", valign:"middle", margin:0 });
    n.items.forEach((item, j) => {
      s.addShape(pres.shapes.OVAL, { x:cx+0.18, y:1.72+j*0.86+0.1, w:0.16, h:0.16, fill:{color:n.color}, line:{color:n.color} });
      s.addText(item, { x:cx+0.42, y:1.72+j*0.86, w:2.5, h:0.78, fontSize:11.5, color:C.textDark, fontFace:"Calibri", margin:0, valign:"middle" });
    });
  });

  s.addNotes("Estos tres pilares son la base operacional. Sin ellos, los OKRs son solo aspiraciones. La conversacion con el Director debe girar en torno a cuales de estas condiciones se pueden crear en H2 2026.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 5 — OVERVIEW 5 OKRs
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };
  geo(s);

  s.addText("MARCO ESTRATEGICO H2 2026", { x:0.5, y:0.22, w:9, h:0.3, fontSize:10, color:C.gold, bold:true, charSpacing:4, fontFace:"Calibri", margin:0 });
  s.addText("Los 5 OKRs del equipo CS", { x:0.5, y:0.5, w:9, h:0.65, fontSize:30, color:C.white, bold:true, fontFace:"Calibri", margin:0 });

  const okrs = [
    { n:"OKR 1", title:"Cobertura de Cadencia",     desc:"0 clientes invisibles — 100% con contacto\nmensual documentado en HubSpot",    color:C.teal },
    { n:"OKR 2", title:"Onboarding Efectivo",         desc:"Primer valor en < 30 dias\n0 clientes nuevos sin adoption plan",              color:C.green },
    { n:"OKR 3", title:"Proteccion de Revenue",       desc:"0% churn no anticipado\n100% renovaciones con 90 dias de anticipacion",      color:C.amber },
    { n:"OKR 4", title:"Conocimiento como Activo",    desc:"3 playbooks documentados\n2 sesiones best practices del equipo",              color:C.blueAcc },
    { n:"OKR 5", title:"Expansion Sistematica",       desc:"CS identifica UP en 30% cartera activa\n3 QBRs Enterprise realizados en H2",  color:C.gold },
  ];

  // 2 top, 3 bottom
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
    s.addText(okr.title, { x:cx+0.18, y:cy+0.38, w:w-0.3, h:0.48, fontSize:i < 2 ? 17 : 15, color:C.white, bold:true, fontFace:"Calibri", margin:0 });
    s.addText(okr.desc, { x:cx+0.18, y:cy+0.9, w:w-0.3, h:0.82, fontSize:12, color:C.textGray, fontFace:"Calibri", margin:0 });
  });

  s.addNotes("Los 5 OKRs son secuenciales en prioridad: sin cobertura (OKR1) no hay onboarding efectivo (OKR2). Sin proteccion de revenue (OKR3) el equipo siempre esta apagando incendios. El conocimiento (OKR4) es el multiplicador. La expansion (OKR5) es el resultado.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 6 — OKR 1: COBERTURA DE CADENCIA
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  okrHeader(s, "OKR 1", "📋", "Cobertura de Cadencia",
    "Que ningun cliente de la cartera LATAM quede invisible — 100% con contacto mensual documentado", C.teal);

  krRow(s,0,"KR 1.1","100% de la cartera activa con al menos 1 touchpoint documentado en HubSpot por mes","100% cobertura","Equipo CS",C.teal);
  krRow(s,1,"KR 1.2","0 clientes con mas de 45 dias sin contacto registrado en ninguna fuente","0 ghosts","Equipo CS",C.teal);
  krRow(s,2,"KR 1.3","100% de clientes con health score < 50 o NPS < 0 con plan de accion activo documentado","100% planes","Leads CS",C.teal);
  krRow(s,3,"KR 1.4","Definir modelo de cadencia por segmento: high-touch (semanal), mid-touch (mensual), tech-touch (trimestral)","1 modelo","CS Ops",C.teal);

  insightBar(s, "Referencia: hoy el equipo no tiene visibilidad de cuantos clientes tienen mas de 30 dias sin contacto. Ese dato debe existir antes de agosto.", "F0FDFA", "0F766E");
  s.addNotes("Este OKR es la base de todo. Si no sabemos como esta cada cliente al menos una vez por mes, no podemos detectar riesgos ni oportunidades. La cadencia no es lujo — es el minimo para hacer CS real.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 7 — OKR 2: ONBOARDING EFECTIVO
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  okrHeader(s, "OKR 2", "🚀", "Onboarding Efectivo",
    "Que los clientes nuevos lleguen a su primer valor real antes de completar 30 dias en la plataforma", C.green);

  krRow(s,0,"KR 2.1","Tiempo promedio de onboarding a primer UP consumido < 30 dias para todos los clientes nuevos H2","< 30 dias","CS + Producto",C.green);
  krRow(s,1,"KR 2.2","100% de clientes nuevos con adoption plan documentado en los primeros 60 dias de contrato","100% planes","Equipo CS",C.green);
  krRow(s,2,"KR 2.3","0 clientes con mas de 90 dias activos sin haber consumido ningun Use Point","0 zombies","Equipo CS",C.green);
  krRow(s,3,"KR 2.4","Documentar playbook de onboarding estandar replicable en todos los paises antes de agosto","1 playbook","CS Lead",C.green);

  insightBar(s, "Problema actual: BELCORP CO lleva meses con 8.3% de UP. No es un problema del cliente — es un onboarding sin seguimiento sistematico.", "F0FDF4", "166534");
  s.addNotes("El primer valor (first value moment) es el predictor mas fuerte de renovacion. Un cliente que consume UP en los primeros 30 dias tiene 3x mas probabilidad de renovar que uno que no lo hace. Este OKR protege directamente el ARR futuro.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 8 — OKR 3: PROTECCION DE REVENUE
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  okrHeader(s, "OKR 3", "🔒", "Proteccion de Revenue",
    "Que el churn sea predecible y gestionado, no una sorpresa — y que las renovaciones no sean de ultimo minuto", C.amber);

  krRow(s,0,"KR 3.1","100% de renovaciones del H2 2026 iniciadas con minimo 90 dias de anticipacion","90 dias antes","CS + Comercial",C.amber);
  krRow(s,1,"KR 3.2","0 churns no anticipados — si un cliente se va, CS lo documento como riesgo con anticipacion","0 sorpresas","Equipo CS",C.amber);
  krRow(s,2,"KR 3.3","100% de NPS negativos o detractores con plan de recuperacion iniciado en < 72 horas","< 72h",  "CSM responsable",C.amber);
  krRow(s,3,"KR 3.4","Mejorar NPS promedio de cartera LATAM de nivel actual hacia +10 puntos para diciembre","NPS +10","Equipo CS",C.amber);

  insightBar(s, "Estado critico hoy: COBOE BOTIGA (NPS -100), FORUS SA (NPS -100), FORUS COLOMBIA (migracion bloqueada). Tres cuentas sin plan activo documentado.", "FEF9C3", "92400E");
  s.addNotes("El KR mas importante es el 3.2: 0 churns no anticipados. Esto no significa 0 churns — significa que si perdemos un cliente, fue una decision gestionada, no una sorpresa. Eso demuestra madurez del proceso CS.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 9 — OKR 4: CONOCIMIENTO COMO ACTIVO
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  okrHeader(s, "OKR 4", "📚", "Conocimiento como Activo",
    "Que lo que sabe un CSM lo sepa el equipo — convertir experiencias individuales en capital colectivo", C.blueAcc);

  krRow(s,0,"KR 4.1","Documentar 3 playbooks criticos (onboarding, NPS negativo, activacion UP) antes de agosto 2026","3 playbooks","CS Lead",C.blueAcc);
  krRow(s,1,"KR 4.2","Realizar 2 sesiones internas de best practices donde el CSM con mejor adopcion comparte su metodo","2 sesiones","CS Lead",C.blueAcc);
  krRow(s,2,"KR 4.3","100% de cuentas perdidas o en riesgo critico con retrospectiva documentada en HubSpot","100% retros","Equipo CS",C.blueAcc);
  krRow(s,3,"KR 4.4","Crear un repositorio unico de casos de uso exitosos de AnyTools para usar en demos y onboarding","1 repo","CS + Producto",C.blueAcc);

  insightBar(s, "KAYSER (55.6% UP) es el benchmark interno mas valioso del equipo. Lo que hizo ese CSM para llegar ahi deberia ser el playbook estandar para toda la cartera.", "EFF6FF", "1E40AF");
  s.addNotes("Este OKR es el multiplicador. Sin el, cada CSM opera en silos y el equipo nunca escala su capacidad. Con el, la experiencia de los mejores eleva el piso de toda la operacion. Es el OKR mas facil de ejecutar y el menos urgente — por eso siempre queda para despues.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 10 — OKR 5: EXPANSION SISTEMATICA
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };
  okrHeader(s, "OKR 5", "📈", "Expansion Sistematica",
    "Que la expansion de revenue sea resultado del exito del cliente — no un esfuerzo de venta adicional aislado", C.gold);

  krRow(s,0,"KR 5.1","CS identifica y documenta oportunidades de AnyTools en al menos el 30% de la cartera activa H2","30% cartera",  "Equipo CS",C.goldDark);
  krRow(s,1,"KR 5.2","Proceso CS→Comercial definido y operando: handoff de oportunidades en < 5 dias habiles","< 5 dias habil","CS + Comercial",C.goldDark);
  krRow(s,2,"KR 5.3","Realizar minimo 3 QBRs con cuentas Enterprise (donde se presente propuesta de valor y expansion)","3 QBRs",      "CSM senior",C.goldDark);
  krRow(s,3,"KR 5.4","Aumentar adoption rate de Use Points promedio de cartera activa de 34% → 50% para diciembre","UP 34→50%",    "Equipo CS",C.goldDark);

  insightBar(s, "Oportunidades AnyTools identificadas: Predize para cartera con alto volumen ML (KAYSER, TRAMONTINA, LACOSTE). Koncili para cuentas con operacion financiera compleja (BELCORP group).", "FFFBEB", "92400E");
  s.addNotes("La expansion sostenible no viene de presion comercial — viene de clientes que confian en el CSM y ven valor real en el producto. Por eso este OKR es el ultimo en la lista: solo funciona si los 4 anteriores estan en marcha.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 11 — PLAN 90 DIAS EQUIPO
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.lightBg };

  s.addText("PLAN DE ACCION DEL EQUIPO", { x:0.5, y:0.18, w:9, h:0.3, fontSize:10, color:C.gold, bold:true, charSpacing:4, fontFace:"Calibri", margin:0 });
  s.addText("Roadmap de ejecucion — Jul → Sep 2026", { x:0.5, y:0.45, w:9, h:0.55, fontSize:26, color:C.textDark, bold:true, fontFace:"Calibri", margin:0 });

  const months = [
    {
      mes:"JULIO — ESTABILIZAR",
      color:C.red,
      items:[
        "Resolver criticos: BOTIGA, FORUS SA\n(NPS -100) + plan recuperacion escrito",
        "Mapear 100% cartera: quien tiene\nmenos de 45 dias de contacto",
        "Escalar Centry con PM:\nfecha limite y owner claro",
        "Definir segmentacion high/mid/tech\ntouch por ARR y potencial",
      ],
    },
    {
      mes:"AGOSTO — DOCUMENTAR",
      color:C.amber,
      items:[
        "Publicar Playbook Onboarding v1\ny Playbook NPS Negativo v1",
        "Sesion best practices: KAYSER\ncomo benchmark de adopcion UP",
        "Check-in migracion Centry:\nvalidar avance con PM",
        "Revisar 100% renovaciones H2:\niniciar las que esten a < 90 dias",
      ],
    },
    {
      mes:"SEPTIEMBRE — CRECER",
      color:C.green,
      items:[
        "Primer QBR Enterprise:\nForus Group (SA+CO+PE)",
        "Lanzar proceso formal\nCS→Comercial para expansión",
        "Medir delta UP: comparar\nadopcion julio vs. septiembre",
        "Revision OKRs con Director:\najustar plan Q4 2026",
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

  s.addNotes("Julio = apagar incendios y mapear. Agosto = documentar el conocimiento que ya existe. Septiembre = comenzar a crecer sobre una base estable. No se puede quemar etapas.");
}

// ══════════════════════════════════════════════════════════════
// SLIDE 12 — CIERRE: 3 PREGUNTAS PARA EL DIRECTOR
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };
  geo(s);

  s.addText("LA CONVERSACION CON DIRECCION", { x:0.55, y:0.38, w:9, h:0.35, fontSize:11, color:C.gold, bold:true, charSpacing:5, fontFace:"Calibri", margin:0 });
  s.addText("3 preguntas que el equipo\nnecesita responder esta semana:", {
    x:0.55, y:0.72, w:8, h:0.92, fontSize:22, color:C.white, bold:true, fontFace:"Calibri", margin:0,
  });

  const pregs = [
    {
      num:"01",
      text:"Que parte del trabajo del equipo debe ser reactivo y cual proactivo? Con el volumen actual de cartera, no podemos hacer los dos sin procesos que liberen tiempo.",
      color:C.teal,
    },
    {
      num:"02",
      text:"Quien es el PM dueno de la migracion Centry con fecha de entrega? Sin esto, CS seguira absorbiendo el impacto de una decision que no le pertenece.",
      color:C.amber,
    },
    {
      num:"03",
      text:"Vamos a documentar los playbooks del equipo como prioridad de agosto? Si no hay decision explicita, nunca va a pasar porque siempre hay algo mas urgente.",
      color:C.gold,
    },
  ];

  pregs.forEach((p, i) => {
    const cy = 1.72 + i * 1.14;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.4, y:cy, w:9.2, h:0.98, fill:{color:C.navyCard}, line:{color:p.color, width:1.2}, rectRadius:0.1 });
    s.addText(p.num, { x:0.58, y:cy+0.2, w:0.52, h:0.5, fontSize:26, color:p.color, bold:true, fontFace:"Calibri", margin:0 });
    s.addText(p.text, { x:1.22, y:cy+0.1, w:8.1, h:0.78, fontSize:12.5, color:C.white, fontFace:"Calibri", margin:0, valign:"middle" });
  });

  s.addText("AnyMarket LATAM  ·  Customer Success  ·  H2 2026", {
    x:0.5, y:5.33, w:9, h:0.25, fontSize:11, color:C.textGray, fontFace:"Calibri", margin:0, align:"center",
  });

  s.addNotes("El equipo ya sabe que hay que hacer. Lo que necesita es que la organizacion cree las condiciones para poder hacerlo. Estas 3 preguntas son la diferencia entre OKRs como documento y OKRs como sistema de trabajo real.");
}

// ══════════════════════════════════════════════════════════════
// SAVE
// ══════════════════════════════════════════════════════════════
pres.writeFile({ fileName: "/sessions/blissful-gifted-meitner/mnt/dashboard sami Cs/OKRs_CS_Equipo_LATAM_H2_2026.pptx" })
  .then(() => console.log("OK"))
  .catch(err => { console.error("ERROR:", err.message); process.exit(1); });
