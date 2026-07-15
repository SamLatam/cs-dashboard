import { activeClients } from '../services/clients-repo.js';
import { getActions } from '../services/actions-repo.js';
import { calcHS } from '../domain/health-score.js';
import { fmtG } from '../lib/format.js';
// RECONCILED: PORTFOLIO_GAP is actually exported from domain/tiers.js — ui/portfolio-a.js only
// imports it locally (for its own rendering) and does not re-export it.
import { PORTFOLIO_GAP } from '../domain/tiers.js';

// ── KPIs ───────────────────────────────────────────────────────────────────────
export function renderKPIs() {
  const _ac = activeClients();
  const scores = _ac.map(c=>calcHS(c)).filter(h=>h.score!=null);
  const byClass = (cl) => scores.filter(h=>h.cl===cl).length;
  const avgNPS = (() => { const v=_ac.map(c=>c.weekly?.nps).filter(n=>n!=null); return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length):null; })();
  const tickets = _ac.reduce((s,c)=>s+(c.weekly?.tickets||0),0);
  const bugs    = _ac.reduce((s,c)=>s+(c.weekly?.bugs||0),0);
  const gmv     = _ac.reduce((s,c)=>s+(c.weekly?.gmv||0),0);
  const countries = [...new Set(_ac.map(c=>c.country))].length;

  document.getElementById('kpi-total').textContent   = _ac.length;
  document.getElementById('kpi-paises').textContent  = countries + ' países';
  document.getElementById('kpi-green').textContent   = byClass('green');
  document.getElementById('kpi-green-s').textContent = Math.round(byClass('green')/_ac.length*100)+'% de cartera';
  document.getElementById('kpi-yellow').textContent  = byClass('yellow') + byClass('orange');
  document.getElementById('kpi-red').textContent     = byClass('red');
  document.getElementById('kpi-nps').textContent     = avgNPS!=null?avgNPS:'—';
  document.getElementById('kpi-nps-s').textContent   = avgNPS!=null?(avgNPS>=50?'Promotores dominan':avgNPS>=0?'Neutro':'Detractores'):'sin datos';
  document.getElementById('kpi-gmv').textContent     = fmtG(gmv);
  document.getElementById('kpi-tickets').textContent = tickets;
  document.getElementById('kpi-bugs-s').textContent  = bugs+' bug'+(bugs!==1?'s':'')+' activo'+(bugs!==1?'s':'');
  // sidebar badges
  const critActs = getActions().filter(a=>a.status!=='resuelto').length;
  const alertCnt = _ac.filter(c=>{ const h=calcHS(c); return h.cl==='red'||h.cl==='orange'||(c.weekly?.tickets>0)||(c.weekly?.nps!=null&&c.weekly.nps<=0); }).length;
  document.getElementById('nb-acciones').textContent = critActs;
  document.getElementById('nb-alertas').textContent  = alertCnt;
  const quickWins = (typeof PORTFOLIO_GAP !== 'undefined') ? PORTFOLIO_GAP.filter(x=>x.gap===1).length : 0;
  const nbPA = document.getElementById('nb-portfolio-a');
  if (nbPA) nbPA.textContent = quickWins;
}
