// src/ui/capacitacion.js
// Extracted verbatim from api/index.html (1).html — "CAPACITACIÓN & VALOR" section
// (source comment: "── CAPACITACIÓN & VALOR ──────────────────────────────────────────────────────").
//
// NOTE (verbatim preservation, not a fix): `clientList` reads `c.nombre` while the rest of the
// codebase's client objects use `c.name` — this looks like a pre-existing bug in the source, but
// per the mechanical-refactor mandate it is copied exactly as-is.

import { getClients } from '../services/clients-repo.js';

export function renderCapacitacion() {
  const clients = getClients();
  const w = clients.map(c => c.weekly || {});

  // Detectar patrones desde datos reales
  const conTickets     = clients.filter(c => (c.weekly||{}).tickets > 0);
  const conBugs        = clients.filter(c => (c.weekly||{}).bugs > 0);
  const sinUsePoints   = clients.filter(c => { const wp = c.weekly||{}; return wp.upPlan && (!wp.qtUp || wp.qtUp === 0); });
  const bajoUsePoints  = clients.filter(c => { const wp = c.weekly||{}; return wp.upPlan && wp.qtUp > 0 && (wp.qtUp/wp.upPlan) < 0.5; });
  const sinGMV         = clients.filter(c => (c.weekly||{}).gmv === 0);
  const npsNeg         = clients.filter(c => { const n = (c.weekly||{}).nps; return n !== null && n !== undefined && n < 0; });
  const sinContacto    = clients.filter(c => { const lc = (c.weekly||{}).lastContact; if (!lc) return true; return Math.floor((Date.now()-new Date(lc))/86400000) > 60; });
  const centry         = clients.filter(c => (c.weekly||{}).centry);

  // Dolor 1: tickets recurrentes → stock ML (Emma + Forus tienen mismo bug)
  const stockML = clients.filter(c => { const wr = c.weekly||{}; return (wr.tickets||0)>0 && (wr.causaRaiz||'').toLowerCase().includes('mercado libre'); });

  const card = (emoji, titulo, subtitulo, color, contenido) => `
    <div class="card" style="border-left:4px solid ${color};margin-bottom:16px;">
      <div class="card-title" style="font-size:15px;">${emoji} ${titulo} <span>${subtitulo}</span></div>
      ${contenido}
    </div>`;

  const pill = (txt, color) => `<span style="background:${color}22;color:${color};border-radius:12px;padding:2px 10px;font-size:11px;font-weight:700;margin-right:4px;">${txt}</span>`;
  const clientList = arr => arr.length ? arr.map(c=>c.nombre).join(', ') : '—';

  const row = (icono, tipo, accion, beneficio, valor, equipo, clientes, urgencia) => `
    <tr style="border-bottom:1px solid var(--border);">
      <td style="padding:12px 10px;font-size:18px;text-align:center;">${icono}</td>
      <td style="padding:12px 10px;">${pill(tipo, urgencia==='alta'?'#e74c3c':urgencia==='media'?'#f39c12':'#2ecc71')}</td>
      <td style="padding:12px 10px;font-weight:600;font-size:13px;">${accion}</td>
      <td style="padding:12px 10px;font-size:12px;color:var(--text2);">${beneficio}</td>
      <td style="padding:12px 10px;font-size:12px;color:var(--accent2);">${valor}</td>
      <td style="padding:12px 10px;font-size:12px;">${equipo}</td>
      <td style="padding:12px 10px;font-size:11px;color:var(--text3);">${clientes}</td>
    </tr>`;

  const tabla = (filas) => `
    <div style="overflow-x:auto;">
    <table style="width:100%;">
      <thead><tr style="background:var(--surface2);">
        <th style="padding:8px 10px;font-size:10px;color:var(--text3);">Tipo</th>
        <th style="padding:8px 10px;font-size:10px;color:var(--text3);"></th>
        <th style="padding:8px 10px;font-size:10px;color:var(--text3);">Acción</th>
        <th style="padding:8px 10px;font-size:10px;color:var(--text3);">Beneficio</th>
        <th style="padding:8px 10px;font-size:10px;color:var(--text3);">Entrega de Valor</th>
        <th style="padding:8px 10px;font-size:10px;color:var(--text3);">Equipo</th>
        <th style="padding:8px 10px;font-size:10px;color:var(--text3);">Clientes afectados</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table></div>`;

  let html = '';

  // ── BLOQUE 1: DOLORES DETECTADOS ──────────────────────────────────────────
  html += card('🩺','Dolores Detectados en la Cartera','Patrones recurrentes que requieren acción coordinada','#e74c3c', tabla(
    (stockML.length >= 2 ? row('🔄','Bug compartido','Agrupar tickets de stock ML en un solo caso','Resuelve el mismo bug para múltiples clientes en paralelo','Reduce tiempo de resolución 50% — menos impacto en GMV de los clientes','Soporte + Producto',clientList(stockML),'alta') : '') +
    (conBugs.length > 0 ? row('🐛','Micro-video','Video 3 min: "Cómo reportar un bug con toda la información"','El cliente reporta mejor → soporte resuelve más rápido','Menos tickets mal documentados, ciclos de soporte más cortos','CS + Soporte',clientList(conBugs),'media') : '') +
    (sinUsePoints.length > 0 ? row('💤','Workshop cliente','Taller: "Cómo activar y usar Use Points"','Clientes que no usan lo que pagaron empiezan a ver valor','Reduce riesgo de churn por percepción de bajo valor. Aumenta adopción.','CS',clientList(sinUsePoints),'alta') : '') +
    (bajoUsePoints.length > 0 ? row('📉','Check-in proactivo','Reunión de adopción: revisar uso de Use Points con el cliente','Identifica por qué no usan el plan contratado','Abre conversación de valor antes de la renovación','CS',clientList(bajoUsePoints),'media') : '') +
    (npsNeg.length > 0 ? row('😟','Workshop interno','Taller CS: "Gestión de NPS negativo y recuperación de cliente"','El equipo CS sabe cómo actuar ante NPS crítico','Convierte un detractor en promotor con el proceso correcto','CS Team','Coboe Botiga, Forus SA','alta') : '') +
    (sinGMV.length > 0 ? row('📦','Diagnóstico de operación','Revisar integración activa y pedidos en los últimos 30 días','Detectar si el cliente está operando o si hay un problema técnico','Prevenir churn silencioso por operación caída','CS + Soporte',clientList(sinGMV),'alta') : '')
  ));

  // ── BLOQUE 2: BASE DE CONOCIMIENTO ────────────────────────────────────────
  html += card('📚','Potenciación de Base de Conocimiento','Artículos que evitan tickets repetidos y empoderan al cliente','#4f8ef7', tabla(
    row('📄','KB Article','Guía: "Sincronización de stock AnyMarket → Mercado Libre"','Clientes resuelven dudas antes de abrir ticket','Reduce hasta 30% los tickets de stock en ML. El cliente se autogestiona.','CS + Soporte','Emma Sleep, Forus SA, Lounge','alta') +
    row('📄','KB Article','Guía: "Publicación de SKUs con imágenes en Falabella"','Evita rechazos de publicación por falta de imágenes','Menos tickets de publicación. Cliente publica más rápido.','CS + Soporte','Forus Colombia','media') +
    row('📄','KB Article','Guía: "Configuración de integración Shopify + RUT en Chile"','Shopify captura RUT correctamente desde el primer intento','Elimina un ticket recurrente específico de clientes chilenos con Shopify','Soporte','Fashions Park','media') +
    row('📄','KB Article','Guía: "Qué es Use Points y cómo maximizar el plan contratado"','El cliente entiende su plan y lo usa','Aumenta percepción de valor. Reduce preguntas básicas al CSM.','CS',clientList(sinUsePoints.concat(bajoUsePoints).slice(0,3)),'media') +
    row('📄','KB Article','Checklist: "Antes de escalar un ticket a soporte"','El cliente pre-diagnostica antes de abrir un ticket','Tickets mejor documentados → resolución más rápida','CS + Soporte','Todos','baja')
  ));

  // ── BLOQUE 3: MICRO-VIDEOS ────────────────────────────────────────────────
  html += card('🎬','Micro-Videos de Capacitación','Videos cortos (2-5 min) para empoderar al cliente y reducir fricción','#9b59b6', tabla(
    row('▶️','Micro-video','Video 2 min: "Cómo revisar el estado de sincronización de stock"','El cliente identifica si hay un problema antes de llamar','Autogestión del cliente → menos urgencias innecesarias al CS','CS',clientList(stockML),'alta') +
    row('▶️','Micro-video','Video 3 min: "Cómo usar Use Points paso a paso"','Adopción inmediata de la funcionalidad','El cliente ve valor en lo que pagó. Sube el NPS.','CS',clientList(sinUsePoints),'alta') +
    row('▶️','Micro-video','Video 5 min: "Qué hacer cuando un SKU no se publica en el marketplace"','El cliente diagnostica y corrige errores de publicación solo','Menos tickets de publicación. Operación más ágil para el cliente.','CS + Soporte','Forus Colombia, Gino','media') +
    row('▶️','Micro-video','Video 3 min: "Cómo leer el panel de pedidos en AnyMarket"','El cliente interpreta correctamente sus datos operativos','Menos consultas básicas. Conversaciones con el CS se vuelven estratégicas.','CS','Todos','baja') +
    row('▶️','Micro-video','Video 4 min: "Proceso de migración Centry — qué esperar"','Clientes en migración saben qué va a pasar y cuándo','Reduce ansiedad y tickets de seguimiento durante la migración','CS + PM',clientList(centry),'media')
  ));

  // ── BLOQUE 4: WORKSHOPS ───────────────────────────────────────────────────
  html += card('🏫','Workshops Continuos','Sesiones formativas periódicas con clientes y equipo interno','#00d4aa', tabla(
    row('👥','Workshop cliente','Workshop mensual: "Novedades AnyMarket + casos de uso"','El cliente conoce features nuevas y las adopta','Aumenta uso de la plataforma → más difícil de churnar. Upsell natural.','CS','Todos — rotar por grupo de país','alta') +
    row('👥','Workshop cliente','Workshop trimestral: "Revisión de KPIs y objetivos — EBR"','El cliente ve el valor entregado con datos concretos','Justifica la renovación. Genera confianza en la relación.','CS','Clientes con +6 meses','alta') +
    row('👥','Workshop interno','Workshop mensual CS: "Análisis de patrones de tickets"','El equipo CS identifica problemas sistémicos antes de que exploten','Intervención proactiva. Menos escalaciones. Mejor experiencia cliente.','CS Team','Interno','alta') +
    row('👥','Workshop cliente','Workshop onboarding: "Primeros 30 días con AnyMarket"','Clientes nuevos adoptan la plataforma más rápido','Reduce tiempo hasta primer valor (TTV). Baja tasa de churn en primeros 90 días.','CS','Whirlpool, Lacoste (nuevos)','alta') +
    row('👥','Workshop interno','Workshop CS: "Cómo manejar stakeholders y cambios de contacto"','El equipo CS tiene un protocolo cuando cambia el contacto en el cliente','No se pierde la relación por rotación. Aplica a Tramontina y Colombiana.','CS Team','Interno — Tramontina, Colombiana','media')
  ));

  // ── RESUMEN IMPACTO ───────────────────────────────────────────────────────
  html += `<div class="card" style="border-left:4px solid var(--accent2);background:linear-gradient(135deg,var(--surface),var(--surface2));">
    <div class="card-title">📊 Impacto Estimado si se Ejecuta el Plan</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;text-align:center;">
      <div><div style="font-size:28px;font-weight:700;color:var(--green);">-40%</div><div style="font-size:12px;color:var(--text2);">Tickets repetidos (KB + micro-videos)</div></div>
      <div><div style="font-size:28px;font-weight:700;color:var(--accent);">+25%</div><div style="font-size:12px;color:var(--text2);">Adopción Use Points (workshops)</div></div>
      <div><div style="font-size:28px;font-weight:700;color:var(--accent2);">+30 pts</div><div style="font-size:12px;color:var(--text2);">NPS promedio (rescate + EBR)</div></div>
      <div><div style="font-size:28px;font-weight:700;color:var(--yellow);">3 clientes</div><div style="font-size:12px;color:var(--text2);">Recuperados de riesgo churn</div></div>
    </div>
  </div>`;

  document.getElementById('capacitacionGrid').innerHTML = html;
}
