import { calcHS } from '../domain/health-score.js';
import { daysSince } from '../lib/format.js';

// ── AUTOMATIZACIÓN D/E ────────────────────────────────────────────────────────
export function _churnProb(x){
  var score=0;var w=x.c.weekly||{};
  if(w.nps!==null&&w.nps!==undefined){if(w.nps<=-50)score+=40;else if(w.nps<0)score+=25;else if(w.nps<30)score+=10;}
  if(x.hs<20)score+=30;else if(x.hs<30)score+=20;else if(x.hs<50)score+=10;
  if((w.tickets||0)>=5)score+=20;else if((w.tickets||0)>=3)score+=10;
  if((w.bugs||0)>=2)score+=15;else if((w.bugs||0)>=1)score+=5;
  if(!w.lastContact||daysSince(w.lastContact)>90)score+=20;else if(daysSince(w.lastContact)>60)score+=10;
  if(w.qtUp===0&&w.upPlan)score+=10;
  return Math.min(score,95);
}
export function _priorityScore(x){return Math.round((100-x.hs)*0.6+_churnProb(x)*0.4);}

// ── PREDICCIONES ──────────────────────────────────────────────────────────────
export function calcChurnRisk(c) {
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

export function calcTicketImpact(c) {
  const w = c.weekly || {};
  const tickets = w.tickets || 0;
  if (tickets === 0) return null;
  const hsObj = calcHS(c);
  const hsNow = hsObj.score != null ? hsObj.score : 50;
  const days7 = Math.max(0, hsNow - Math.min(25 * tickets * 0.5, 20));
  return { hsNow, hs7d: Math.round(days7), tickets, detail: w.ticketDetalle || null };
}

export function calcUpsell(c) {
  const w = c.weekly || {};
  const upPlan = w.upPlan, qtUp = w.qtUp;
  if (!upPlan || qtUp === null || qtUp === undefined) return null;
  const pct = Math.round((qtUp / upPlan) * 100);
  if (pct >= 80) return { pct, upPlan, qtUp, tipo: 'upgrade', msg: 'Usa el ' + pct + '% de su plan — candidato a upgrade.' };
  return null;
}
