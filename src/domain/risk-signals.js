// ── RISK ALERTS ────────────────────────────────────────────────────────────────
import { calcHS } from '../domain/health-score.js';
import { daysSince } from '../lib/format.js';

export function getRiskSignals(c) {
  const w = c.weekly || {}, h = calcHS(c), signals = [];
  if (w.nps != null && w.nps < 0)                                  signals.push({type:'nps',    label:'NPS negativo', icon:'📉', color:'var(--red)'});
  if (h.cl === 'red')                                               signals.push({type:'health', label:'Salud crítica', icon:'🔴', color:'var(--red)'});
  else if (h.cl === 'orange')                                       signals.push({type:'health', label:'Salud en riesgo', icon:'🟠', color:'var(--orange)'});
  if (w.bugs > 0)                                                   signals.push({type:'bugs',   label:`${w.bugs} bug${w.bugs>1?'s':''}`, icon:'🐛', color:'var(--orange)'});
  if (w.tickets >= 5)                                               signals.push({type:'tickets',label:`${w.tickets} tickets`, icon:'🎫', color:'var(--orange)'});
  if (!w.lastContact || daysSince(w.lastContact) > 30)              signals.push({type:'contact',label:'Sin contacto +30d', icon:'📵', color:'var(--yellow)'});
  return signals;
}
