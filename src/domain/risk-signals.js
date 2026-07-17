// Extracted verbatim from index.html (lines ~2425-2436)
// ── RISK ALERTS ────────────────────────────────────────────────────────────────
//
// INTEGRATION TODO: `daysSince` assumed to live in a shared lib module (see
// index.html:4300 for the original definition) — adjust the import path once
// src/lib/* lands.
import { calcHS } from './health-score.js';
import { daysSince } from '../lib/format.js';

function getRiskSignals(c) {
  const w = c.weekly || {}, h = calcHS(c), signals = [];
  if (w.nps != null && w.nps < 0)                                  signals.push({type:'nps',    label:'NPS negativo', icon:'📉', color:'var(--red)'});
  if (h.cl === 'red')                                               signals.push({type:'health', label:'Salud crítica', icon:'🔴', color:'var(--red)'});
  else if (h.cl === 'orange')                                       signals.push({type:'health', label:'Salud en riesgo', icon:'🟠', color:'var(--orange)'});
  if (w.bugs > 0)                                                   signals.push({type:'bugs',   label:`${w.bugs} bug${w.bugs>1?'s':''}`, icon:'🐛', color:'var(--orange)'});
  if (w.tickets >= 5)                                               signals.push({type:'tickets',label:`${w.tickets} tickets`, icon:'🎫', color:'var(--orange)'});
  if (!w.lastContact || daysSince(w.lastContact) > 30)              signals.push({type:'contact',label:'Sin contacto +30d', icon:'📵', color:'var(--yellow)'});
  return signals;
}

export { getRiskSignals };
