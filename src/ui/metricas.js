// ── MÉTRICAS ─────────────────────────────────────────────────────────────────────
// Extracted verbatim from index.html (source lines 3806-3838).
// Verified by brace-matching: renderMetrics opens at 3806 `function renderMetrics() {`
// and its matching closing `}` is line 3838, immediately followed by the
// `// ── ACCIONES ──` comment header at 3840 (owned by src/ui/acciones.js) — confirmed
// complete, no truncation.
//
// ASSUMED CROSS-FILE IMPORTS (sibling files did not exist yet at extraction time —
// verify these during integration):
//   - getClients                   from '../services/clients-repo.js' (confirmed export)
//   - calcHS, hpLabel              from '../domain/health-score.js'   (confirmed exports)
//   - fmtG, daysSince              from '../lib/format.js'            (confirmed exports)
import { getClients } from '../services/clients-repo.js';
import { calcHS, hpLabel } from '../domain/health-score.js';
import { fmtG, daysSince } from '../lib/format.js';

function renderMetrics() {
  const clients = getClients();
  const dist={Sano:0,Observación:0,'En riesgo':0,Crítico:0};
  const dColors={Sano:'#2ecc71',Observación:'#f39c12','En riesgo':'#e67e22',Crítico:'#e74c3c'};
  clients.forEach(c=>{const h=calcHS(c);if(h.cl)dist[hpLabel(h.cl)]=(dist[hpLabel(h.cl)]||0)+1;});
  const total=Object.values(dist).reduce((a,b)=>a+b,0);
  const r=50,circ=2*Math.PI*r;let off=0;
  let segs='<circle cx="64" cy="64" r="50" fill="none" stroke="var(--surface2)" stroke-width="20"/>';
  Object.keys(dist).filter(k=>dist[k]>0).forEach(k=>{const pct=dist[k]/total;const d=pct*circ;segs+=`<circle cx="64" cy="64" r="${r}" fill="none" stroke="${dColors[k]}" stroke-width="20" stroke-dasharray="${d} ${circ-d}" stroke-dashoffset="${-off}"/>`;off+=d;});
  const byGMV=[...clients].filter(c=>c.weekly?.gmv>0).sort((a,b)=>(b.weekly?.gmv||0)-(a.weekly?.gmv||0)).slice(0,8);
  const maxG=byGMV[0]?.weekly?.gmv||1;
  const withUP=clients.filter(c=>!c.centry&&c.weekly?.upPlan&&c.weekly?.qtUp!=null);
  const cbk={OK:0,'14-30d':0,'30-60d':0,'60d+':0,'Sin dato':0};
  clients.forEach(c=>{if(!c.weekly?.lastContact){cbk['Sin dato']++;return;}const d=daysSince(c.weekly.lastContact);if(d<14)cbk.OK++;else if(d<30)cbk['14-30d']++;else if(d<60)cbk['30-60d']++;else cbk['60d+']++;});
  const ctot=clients.length;
  document.getElementById('metricsGrid').innerHTML=`
    <div class="card"><div class="card-title">Distribución Health Score</div>
      <div class="donut-wrap"><svg class="donut" width="120" height="120" viewBox="0 0 128 128">${segs}</svg>
      <div>${Object.keys(dist).map(k=>`<div class="legend-item"><div class="legend-dot" style="background:${dColors[k]}"></div><span>${k}: <strong>${dist[k]}</strong></span></div>`).join('')}</div></div>
    </div>
    <div class="card"><div class="card-title">Top GMV (CLP)</div>
      ${byGMV.map(c=>`<div class="bar-wrap"><span class="bar-label" title="${c.name}">${c.name.split(' ').slice(0,2).join(' ')}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(c.weekly.gmv/maxG*100)}%;background:linear-gradient(90deg,var(--accent),var(--accent2))"></div></div>
      <span class="bar-val">${fmtG(c.weekly.gmv)}</span></div>`).join('')}
    </div>
    <div class="card"><div class="card-title">Último Contacto</div>
      ${Object.entries(cbk).map(([k,v])=>`<div class="bar-wrap"><span class="bar-label">${k==='OK'?'< 14 días':k}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${ctot?Math.round(v/ctot*100):0}%;background:${k==='OK'?'var(--green)':k==='14-30d'?'var(--yellow)':k==='30-60d'?'var(--orange)':'var(--red)'}"></div></div>
      <span class="bar-val">${v}</span></div>`).join('')}
    </div>
    <div class="card"><div class="card-title">Adopción Use Points</div>
      ${withUP.length?withUP.map(c=>{const pct=Math.min(100,Math.round(c.weekly.qtUp/c.weekly.upPlan*100));const col=pct>=70?'var(--green)':pct>=40?'var(--yellow)':'var(--red)';return`<div class="bar-wrap"><span class="bar-label" title="${c.name}">${c.name.split(' ')[0]}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${col}"></div></div><span class="bar-val" style="color:${col}">${pct}%</span></div>`;}).join(''):'<div class="no-data" style="padding:16px">Sin datos de Use Points</div>'}
    </div>`;
}

// No window-attach needed: renderMetrics is only ever invoked as an ES-module import
// from src/ui/nav.js — verified via full-file grep of index.html for
// on(click|change|blur|keydown|input|focus)="..." referencing "renderMetrics"; zero
// matches found (only the module-level `if(page==='metricas') renderMetrics();` call
// inside nav()). Matches the convention already used by src/ui/catalogo.js.
export { renderMetrics };
