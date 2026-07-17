// Extracted verbatim from index.html (lines ~6226-6264)
// ── PREDICCIONES ──────────────────────────────────────────────────────────────
//
// NOTE: There is a SEPARATE, DIFFERENT churn scorer (_churnProb/_priorityScore,
// index.html:5423-5433) used by the "Auto D/E" automation page. That one is NOT
// included here — it belongs to src/ui/automatizacion.js (another agent's
// file). calcChurnRisk/calcTicketImpact/calcUpsell below are genuinely distinct
// functions from _churnProb/_priorityScore, not duplicates.
import { calcHS } from './health-score.js';

function calcChurnRisk(c) {
  const w = c.weekly || {};
  let score = 0, factors = [];
  const hsObj = calcHS(c);
  const hs = hsObj.score;
  if (hs != null && hs < 30) { score += 40; factors.push('Health Score crítico (' + hs + ')'); }
  else if (hs != null && hs < 50) { score += 20; factors.push('Health Score bajo (' + hs + ')'); }
  if ((w.tickets||0) >= 3) { score += 20; factors.push((w.tickets) + ' tickets abiertos'); }
  if ((w.bugs||0) > 0) { score += 15; factors.push((w.bugs) + ' bug(s) activo(s)'); }
  if (w.nps !== null && w.nps !== undefined && w.nps < 0) { score += 15; factors.push('NPS negativo (' + w.nps + ')'); }
  if (w.lastContact) {
    const days = Math.floor((Date.now() - new Date(w.lastContact).getTime()) / 86400000);
    if (days > 90) { score += 20; factors.push('Sin contacto ' + days + ' días'); }
    else if (days > 60) { score += 10; factors.push('Sin contacto ' + days + ' días'); }
  } else { score += 10; factors.push('Fecha de contacto desconocida'); }
  if ((w.gmv||0) === 0 && w.gmv !== null && w.gmv !== undefined) { score += 10; factors.push('GMV en cero'); }
  return { pct: Math.min(score, 95), factors };
}

function calcTicketImpact(c) {
  const w = c.weekly || {};
  const tickets = w.tickets || 0;
  if (tickets === 0) return null;
  const hsObj = calcHS(c);
  const hsNow = hsObj.score != null ? hsObj.score : 50;
  const days7 = Math.max(0, hsNow - Math.min(25 * tickets * 0.5, 20));
  return { hsNow, hs7d: Math.round(days7), tickets, detail: w.ticketDetalle || null };
}

function calcUpsell(c) {
  const w = c.weekly || {};
  const upPlan = w.upPlan, qtUp = w.qtUp;
  if (!upPlan || qtUp === null || qtUp === undefined) return null;
  const pct = Math.round((qtUp / upPlan) * 100);
  if (pct >= 80) return { pct, upPlan, qtUp, tipo: 'upgrade', msg: 'Usa el ' + pct + '% de su plan — candidato a upgrade.' };
  return null;
}

export { calcChurnRisk, calcTicketImpact, calcUpsell };
