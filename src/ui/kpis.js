// ── KPIs ───────────────────────────────────────────────────────────────────────
// Extracted verbatim from index.html (source lines 2995-3024).
//
// ASSUMED CROSS-FILE IMPORTS (sibling files did not exist yet at extraction time):
//   - activeClients   from './overview.js'                (this agent's own file —
//                       activeClients() is defined there per source line 3241,
//                       since its only other consumers, renderOverview and
//                       renderOverviewRisk, live in overview.js too)
//   - calcHS          from '../domain/health-score.js'
//   - getActions      from '../services/actions-repo.js'
//   - fmtG            from '../lib/format.js'
import { activeClients } from './overview.js';
import { calcHS } from '../domain/health-score.js';
import { getActions } from '../services/actions-repo.js';
import { fmtG } from '../lib/format.js';
import { PORTFOLIO_GAP } from '../domain/tiers.js';

// Source lines 2995-3024
function renderKPIs() {
  const actions = getActions();
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
  const critActs = actions.filter(a=>a.status!=='resuelto').length;
  const alertCnt = _ac.filter(c=>{ const h=calcHS(c); return h.cl==='red'||h.cl==='orange'||(c.weekly?.tickets>0)||(c.weekly?.nps!=null&&c.weekly.nps<=0); }).length;
  document.getElementById('nb-acciones').textContent = critActs;
  document.getElementById('nb-alertas').textContent  = alertCnt;
  // PORTFOLIO_GAP is a static ES import (always defined by the time renderKPIs()
  // runs), so this restores the source's real quickWins count instead of the
  // always-0 result the earlier `window.PORTFOLIO_GAP` guess produced.
  const quickWins = PORTFOLIO_GAP.filter(x=>x.gap===1).length;
  const nbPA = document.getElementById('nb-portfolio-a');
  if (nbPA) nbPA.textContent = quickWins;
}

// No window-attach needed: renderKPIs() is never referenced from an inline
// onclick/onchange/... string — verified via full-file grep. It's only called
// directly by nav()/renderOverview()/renderTable()/etc.
export { renderKPIs };
