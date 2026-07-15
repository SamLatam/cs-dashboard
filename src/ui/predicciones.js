// src/ui/predicciones.js
// Extracted verbatim from api/index.html (1).html — "PREDICCIONES" section
// (source comment: "── PREDICCIONES ──────────────────────────────────────────────────────────────").
//
// NOTE: `calcChurnRisk`, `calcTicketImpact`, `calcUpsell` are defined immediately above
// `renderPredicciones` in the source (lines ~5951-5987) but belong to domain/predictions.js per
// task assignment — imported here, not redefined. The local `fmtGMV` helper inside this function
// is distinct from lib/format.js's `fmtG` and is kept as a local const, matching the source.

import { getClients } from '../services/clients-repo.js';
import { calcChurnRisk, calcTicketImpact, calcUpsell } from '../domain/predictions.js';
import { calcHS } from '../domain/health-score.js';

export function renderPredicciones() {
  const clients = getClients();
  const todayDate = new Date();
  const churnRisks = [], ticketImpacts = [], upsells = [], inactivos = [], gmvRisk = [];

  clients.forEach(c => {
    const w = c.weekly || {};
    // Churn risk
    const cr = calcChurnRisk(c);
    if (cr.pct >= 25) churnRisks.push({ c, cr });
    // Ticket impact
    const ti = calcTicketImpact(c);
    if (ti) ticketImpacts.push({ c, ti });
    // Upsell
    const us = calcUpsell(c);
    if (us) upsells.push({ c, us });
    // Inactividad
    if (w.lastContact) {
      const days = Math.floor((todayDate - new Date(w.lastContact)) / 86400000);
      if (days >= 45) inactivos.push({ c, days });
    } else {
      inactivos.push({ c, days: 999 });
    }
    // GMV riesgo: tiene GMV y NPS negativo o tickets
    if (w.gmv && w.gmv > 0 && (w.nps < 0 || (w.tickets||0) > 0 || (w.bugs||0) > 0)) {
      const risk = [];
      if (w.nps !== null && w.nps !== undefined && w.nps < 0) risk.push('NPS ' + w.nps);
      if ((w.tickets||0) > 0) risk.push((w.tickets) + ' ticket(s)');
      if ((w.bugs||0) > 0) risk.push((w.bugs) + ' bug(s)');
      gmvRisk.push({ c, w, risk });
    }
  });

  churnRisks.sort((a,b) => b.cr.pct - a.cr.pct);
  inactivos.sort((a,b) => b.days - a.days);
  gmvRisk.sort((a,b) => (b.w.gmv||0) - (a.w.gmv||0));
  ticketImpacts.sort((a,b) => (b.ti.hsNow - b.ti.hs7d) - (a.ti.hsNow - a.ti.hs7d));

  // Update badge
  const totalAlerts = churnRisks.filter(x=>x.cr.pct>=50).length + ticketImpacts.length;
  const badge = document.getElementById('nb-predicciones');
  if (badge) { badge.textContent = totalAlerts; badge.style.display = totalAlerts > 0 ? 'flex' : 'none'; }

  const fmtGMV = v => {
    if (!v) return '—';
    if (v >= 1e11) return '$' + (v/1e11).toFixed(1) + 'B';
    if (v >= 1e8) return '$' + (v/1e8).toFixed(1) + 'M';
    return '$' + (v/1e6).toFixed(0) + 'K';
  };

  let html = '';

  // ── HEADER ──
  html += '<div style="margin-bottom:20px;">';
  html += '<h2 style="font-size:18px;font-weight:800;color:var(--text);margin:0 0 4px;">🔮 Predicciones & Sugerencias</h2>';
  html += '<p style="font-size:13px;color:var(--text2);margin:0;">Análisis automático basado en health score, NPS, tickets, GMV y cadencia de contacto.</p>';
  html += '</div>';

  // ── DOS COLUMNAS: FINANCIERO | TÉCNICO ──
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;">';

  // ══════════════════ COLUMNA FINANCIERO ══════════════════
  html += '<div>';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid rgba(99,179,237,.3);">';
  html += '<span style="font-size:20px;">💰</span><span style="font-size:15px;font-weight:800;color:#63b3ed;letter-spacing:-.3px;">PREDICCIONES FINANCIERAS</span></div>';

  // --- Revenue en Riesgo (GMV × NPS/tickets) ---
  html += '<div class="card" style="margin-bottom:16px;">';
  html += '<div class="card-title">💸 Revenue en Riesgo <span>GMV activo con señales negativas</span></div>';
  if (gmvRisk.length === 0) {
    html += '<p style="color:var(--text2);font-size:13px;padding:8px 0;">Sin GMV en riesgo esta semana. ✅</p>';
  } else {
    const totalGMV = gmvRisk.reduce((s,x) => s + (x.w.gmv||0), 0);
    html += '<div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:8px;padding:10px 14px;margin-bottom:12px;">';
    html += '<div style="font-size:20px;font-weight:800;color:var(--red);">' + fmtGMV(totalGMV) + '</div>';
    html += '<div style="font-size:11px;color:var(--text2);">GMV mensual expuesto a riesgo</div></div>';
    gmvRisk.forEach(({c, w, risk}) => {
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">';
      html += '<div><div style="font-weight:600;font-size:13px;">' + c.name + '</div>';
      html += '<div style="font-size:11px;color:var(--red);margin-top:2px;">' + risk.join(' · ') + '</div></div>';
      html += '<div style="font-size:13px;font-weight:700;color:var(--text);">' + fmtGMV(w.gmv) + '</div></div>';
    });
  }
  html += '</div>';

  // --- Churn Risk ---
  html += '<div class="card" style="margin-bottom:16px;">';
  html += '<div class="card-title">🔴 Riesgo de Churn <span>Probabilidad de cancelación</span></div>';
  if (churnRisks.length === 0) {
    html += '<p style="color:var(--text2);font-size:13px;padding:8px 0;">Sin señales de churn esta semana. ✅</p>';
  } else {
    html += '<table style="margin-top:4px;"><thead><tr><th>Cliente</th><th style="text-align:center">Prob.</th><th>Factores</th><th>Acción</th></tr></thead><tbody>';
    churnRisks.forEach(({c, cr}) => {
      const w = c.weekly || {};
      const color = cr.pct >= 65 ? 'var(--red)' : cr.pct >= 40 ? 'var(--orange)' : 'var(--yellow)';
      const label = cr.pct >= 65 ? '🔴 ALTO' : cr.pct >= 40 ? '🟠 MEDIO' : '🟡 BAJO';
      let accion = '';
      if (cr.pct >= 65) accion = '📞 EBR urgente';
      else if ((w.tickets||0) >= 2) accion = '🎫 Cerrar tickets';
      else if (w.nps !== null && w.nps < 0) accion = '💬 Recovery NPS';
      else accion = '📧 Check-in';
      html += '<tr><td style="font-weight:600;font-size:12px;">' + c.name + '</td>';
      html += '<td style="text-align:center;"><span style="color:' + color + ';font-weight:800;font-size:13px;">' + cr.pct + '%</span></td>';
      html += '<td style="font-size:11px;color:var(--text2);">' + cr.factors.slice(0,2).join(' · ') + '</td>';
      html += '<td style="font-size:11px;">' + accion + '</td></tr>';
    });
    html += '</tbody></table>';
  }
  html += '</div>';

  // --- Upsell ---
  html += '<div class="card">';
  html += '<div class="card-title">🚀 Oportunidades de Upsell <span>Use Points &gt;80% del plan</span></div>';
  if (upsells.length === 0) {
    html += '<p style="color:var(--text2);font-size:13px;padding:8px 0;">Sin candidatos a upsell esta semana.</p>';
  } else {
    upsells.forEach(({c, us}) => {
      html += '<div style="padding:10px 0;border-bottom:1px solid var(--border);">';
      html += '<div style="display:flex;justify-content:space-between;"><span style="font-weight:600;">' + c.name + '</span>';
      html += '<span style="font-size:12px;color:var(--accent2);font-weight:700;">' + us.pct + '% usado</span></div>';
      html += '<div style="height:5px;background:var(--surface2);border-radius:3px;margin:6px 0;"><div style="width:' + Math.min(us.pct,100) + '%;height:100%;background:var(--accent2);border-radius:3px;"></div></div>';
      html += '<div style="font-size:11px;color:var(--text2);">' + us.qtUp + ' / ' + us.upPlan + ' UP · 💡 Proponer upgrade de plan</div></div>';
    });
  }
  html += '</div>';

  html += '</div>'; // fin columna financiero

  // ══════════════════ COLUMNA TÉCNICO ══════════════════
  html += '<div>';
  html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid rgba(167,243,208,.3);">';
  html += '<span style="font-size:20px;">⚙️</span><span style="font-size:15px;font-weight:800;color:#68d391;letter-spacing:-.3px;">PREDICCIONES TÉCNICAS</span></div>';

  // --- Impacto de Tickets ---
  html += '<div class="card" style="margin-bottom:16px;">';
  html += '<div class="card-title">🎫 Impacto si Ticket Sigue Abierto <span>Proyección Health Score en 7 días</span></div>';
  if (ticketImpacts.length === 0) {
    html += '<p style="color:var(--text2);font-size:13px;padding:8px 0;">Sin tickets abiertos. ✅</p>';
  } else {
    ticketImpacts.forEach(({c, ti}) => {
      const drop = ti.hsNow - ti.hs7d;
      const color = drop >= 15 ? 'var(--red)' : drop >= 8 ? 'var(--orange)' : 'var(--yellow)';
      const hsColor = ti.hs7d >= 70 ? 'var(--green)' : ti.hs7d >= 50 ? 'var(--yellow)' : 'var(--red)';
      html += '<div style="padding:10px 0;border-bottom:1px solid var(--border);">';
      html += '<div style="font-weight:600;font-size:13px;margin-bottom:3px;">' + c.name + '</div>';
      html += '<div style="font-size:11px;color:var(--text2);margin-bottom:6px;">' + (ti.detail ? ti.detail.substring(0,70)+(ti.detail.length>70?'…':'') : ti.tickets+' ticket(s)') + '</div>';
      html += '<div style="display:flex;gap:12px;align-items:center;font-size:12px;">';
      html += '<span>Ahora: <strong style="color:var(--accent);">' + ti.hsNow + '</strong></span>';
      html += '<span style="color:var(--text2);">→</span>';
      html += '<span>7 días: <strong style="color:' + hsColor + ';">' + ti.hs7d + '</strong></span>';
      html += '<span style="color:' + color + ';font-weight:700;">(−' + drop + ' pts)</span></div>';
      html += '</div>';
    });
  }
  html += '</div>';

  // --- Clientes sin contacto reciente ---
  html += '<div class="card" style="margin-bottom:16px;">';
  html += '<div class="card-title">⏰ Cadencia en Riesgo <span>+45 días sin contacto registrado</span></div>';
  const inac45 = inactivos.filter(x => x.days >= 45);
  if (inac45.length === 0) {
    html += '<p style="color:var(--text2);font-size:13px;padding:8px 0;">Cadencia al día en toda la cartera. ✅</p>';
  } else {
    html += '<div style="display:flex;flex-direction:column;gap:6px;">';
    inac45.slice(0, 8).forEach(({c, days}) => {
      const w = c.weekly || {};
      const color = days === 999 || days > 90 ? 'var(--red)' : days > 60 ? 'var(--orange)' : 'var(--yellow)';
      const daysLabel = days === 999 ? 'Sin registro' : days + ' días';
      const hs = calcHS(c);
      const hsScore = hs.score != null ? hs.score : '—';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--surface2);border-radius:6px;padding:8px 12px;border-left:3px solid ' + color + ';">';
      html += '<div><div style="font-weight:600;font-size:12px;">' + c.name + '</div>';
      html += '<div style="font-size:11px;color:var(--text2);">' + (w.pais||c.pais||'—') + ' · HS: ' + hsScore + '</div></div>';
      html += '<div style="font-size:12px;color:' + color + ';font-weight:700;">' + daysLabel + '</div></div>';
    });
    html += '</div>';
    if (inac45.length > 8) html += '<p style="font-size:11px;color:var(--text2);margin-top:8px;">+' + (inac45.length-8) + ' más sin contacto reciente</p>';
  }
  html += '</div>';

  // --- Salud operacional (bugs activos) ---
  const conBugs = clients.filter(c => (c.weekly?.bugs||0) > 0);
  html += '<div class="card">';
  html += '<div class="card-title">🐛 Bugs Activos <span>Tickets clasificados como incidente técnico</span></div>';
  if (conBugs.length === 0) {
    html += '<p style="color:var(--text2);font-size:13px;padding:8px 0;">Sin bugs activos en cartera. ✅</p>';
  } else {
    conBugs.forEach(c => {
      const w = c.weekly || {};
      html += '<div style="padding:8px 0;border-bottom:1px solid var(--border);">';
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;">';
      html += '<div><div style="font-weight:600;font-size:13px;">' + c.name + '</div>';
      html += '<div style="font-size:11px;color:var(--text2);margin-top:2px;">' + (w.ticketDetalle ? w.ticketDetalle.substring(0,60)+'…' : w.bugs+' bug(s)') + '</div></div>';
      html += '<span style="background:rgba(239,68,68,.15);color:var(--red);border-radius:4px;padding:2px 7px;font-size:11px;font-weight:700;white-space:nowrap;">' + w.bugs + ' bug</span></div>';
      if (w.causaRaiz) html += '<div style="font-size:11px;color:var(--text2);margin-top:4px;font-style:italic;">🔍 ' + w.causaRaiz.substring(0,80) + '</div>';
      html += '</div>';
    });
  }
  html += '</div>';

  html += '</div>'; // fin columna técnico
  html += '</div>'; // fin grid 2 col

  document.getElementById('predGrid').innerHTML = html;
}
