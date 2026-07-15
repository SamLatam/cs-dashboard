import { getClients } from '../services/clients-repo.js';
import { fmtG } from '../lib/format.js';
// lastZdFetch is a live ES-module binding (export let) — reads stay in sync with
// services/zendesk-legacy.js's autoFetchAll() updates automatically.
import { lastZdFetch } from '../services/zendesk-legacy.js';

// ── CATÁLOGO & GMV ─────────────────────────────────────────────────────────────
export function renderCatalogo() {
  const clients = getClients();
  const sorted = [...clients].filter(c => c.weekly?.gmv != null).sort((a,b) => (b.weekly.gmv||0)-(a.weekly.gmv||0));
  const noData = clients.filter(c => c.weekly?.gmv == null);
  const totalGMV = sorted.reduce((s,c) => s + (c.weekly.gmv||0), 0);
  const flags = {Chile:'🇨🇱',Colombia:'🇨🇴',Uruguay:'🇺🇾',Mexico:'🇲🇽',Peru:'🇵🇪'};

  // KPI strip
  const conGMV = sorted.filter(c => c.weekly.gmv > 0).length;
  const sinGMV = sorted.filter(c => c.weekly.gmv === 0).length + noData.length;
  const topClient = sorted[0];

  const kpis = `<div class="kpi-strip" style="margin-bottom:20px">
    <div class="kpi-card"><div class="kpi-val">${fmtG(totalGMV)}</div><div class="kpi-lbl">GMV Total Cartera</div></div>
    <div class="kpi-card"><div class="kpi-val" style="color:var(--green)">${conGMV}</div><div class="kpi-lbl">Clientes con GMV activo</div></div>
    <div class="kpi-card"><div class="kpi-val" style="color:var(--red)">${sinGMV}</div><div class="kpi-lbl">Sin GMV / Sin datos</div></div>
    <div class="kpi-card"><div class="kpi-val" style="font-size:13px">${topClient ? topClient.name.split(' ')[0] : '—'}</div><div class="kpi-lbl">Mayor GMV</div></div>
  </div>`;

  // Tabla principal GMV
  const maxGMV = sorted[0]?.weekly.gmv || 1;
  const rows = sorted.map(c => {
    const w = c.weekly || {};
    const pct = Math.round((w.gmv / maxGMV) * 100);
    const fl = flags[c.country] || '🌎';
    const upBar = w.upPlan ? `<span style="font-size:11px;color:var(--text2)">${w.qtUp||0}/${w.upPlan} UP</span>` : '<span style="color:var(--text3);font-size:11px">—</span>';
    const gmvBar = `<div style="display:flex;align-items:center;gap:8px">
      <div style="flex:1;background:var(--surface2);border-radius:4px;height:6px;min-width:80px">
        <div style="width:${pct}%;background:var(--accent);height:6px;border-radius:4px"></div>
      </div>
      <span style="font-size:12px;font-weight:600;color:var(--text);min-width:80px;text-align:right">${fmtG(w.gmv)}</span>
    </div>`;
    const cenBadge = c.centry ? '<span style="font-size:10px;background:var(--accent2);color:#fff;padding:1px 5px;border-radius:4px;margin-left:4px">Centry</span>' : '';
    const mktVal = localStorage.getItem('cs-mkt-' + c.id) || '';
    const chips = mktVal.split(',').map(m=>m.trim()).filter(Boolean).map(m=>`<span style="background:rgba(79,142,247,.12);color:var(--accent);font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600">${m}</span>`).join('');
    const mktCell = `<div id="mkt-display-${c.id}" onclick="event.stopPropagation();editMktInline('${c.id}')" title="Clic para editar" style="cursor:text;min-height:22px;display:flex;flex-wrap:wrap;gap:4px;align-items:center">
      ${chips || '<span style="color:var(--text3);font-size:11px">+ agregar</span>'}
    </div>
    <input id="mkt-input-${c.id}" type="text" value="${mktVal}"
      style="display:none;background:var(--surface2);border:1px solid var(--accent);color:var(--text);padding:3px 8px;border-radius:6px;font-size:12px;width:100%;outline:none"
      placeholder="ML, Falabella, Ripley..."
      onblur="saveMktInline('${c.id}')"
      onkeydown="if(event.key==='Enter'){saveMktInline('${c.id}');}if(event.key==='Escape'){closeMktInline('${c.id}');}">`;
    return `<tr onclick="nav('ficha',document.getElementById('nav-ficha'));document.getElementById('fichaSelect').value='${c.id}';renderFicha()" style="cursor:pointer">
      <td><span style="margin-right:4px">${fl}</span>${c.name}${cenBadge}</td>
      <td>${gmvBar}</td>
      <td style="min-width:160px">${mktCell}</td>
      <td style="text-align:center">${upBar}</td>
      <td style="text-align:center">${w.tickets != null ? (w.tickets === 0 ? '<span class="badge b-green">0</span>' : `<span class="badge b-${w.tickets>2?'red':'yellow'}">${w.tickets}</span>`) : '<span class="no-data">—</span>'}</td>
    </tr>`;
  }).join('');

  // Clientes sin datos
  const sinDatos = noData.length ? `<div style="margin-top:24px">
    <h3 style="font-size:13px;color:var(--text2);margin-bottom:10px">Sin datos de GMV (${noData.length})</h3>
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      ${noData.map(c => `<span style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:12px;color:var(--text2)">${flags[c.country]||'🌎'} ${c.name}</span>`).join('')}
    </div>
  </div>` : '';

  // Sección Use Points adopción
  const conUP = clients.filter(c => c.weekly?.upPlan);
  const upRows = conUP.map(c => {
    const w = c.weekly;
    const pct = w.upPlan ? Math.round((w.qtUp||0) / w.upPlan * 100) : 0;
    const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : pct > 0 ? 'var(--orange)' : 'var(--red)';
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="width:160px;font-size:12px;font-weight:500">${c.name}</div>
      <div style="flex:1;background:var(--surface2);border-radius:4px;height:8px">
        <div style="width:${Math.min(pct,100)}%;background:${color};height:8px;border-radius:4px;transition:width .4s"></div>
      </div>
      <div style="width:80px;text-align:right;font-size:12px;color:${color};font-weight:600">${w.qtUp||0}/${w.upPlan} (${pct}%)</div>
    </div>`;
  }).join('');

  document.getElementById('catalogoContent').innerHTML = `
    ${kpis}
    <div style="display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start">
      <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <h3 style="margin:0;font-size:14px">GMV por cliente</h3>
          <span style="font-size:11px;color:var(--text2)">Ordenado por volumen · Clic para ver ficha</span>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:var(--surface2)">
            <th style="padding:10px 16px;text-align:left;font-size:11px;color:var(--text2);font-weight:600">CLIENTE</th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;color:var(--text2);font-weight:600">GMV</th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;color:var(--text2);font-weight:600">MARKETPLACES</th>
            <th style="padding:10px 16px;text-align:center;font-size:11px;color:var(--text2);font-weight:600">USE POINTS</th>
            <th style="padding:10px 16px;text-align:center;font-size:11px;color:var(--text2);font-weight:600">TICKETS</th>
          </tr></thead>
          <tbody style="font-size:12px">${rows || '<tr><td colspan="5" style="padding:24px;text-align:center;color:var(--text3)">Sin datos de GMV — importá el JSON semanal</td></tr>'}</tbody>
        </table>
        ${sinDatos}
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <h3 style="font-size:13px;margin:0 0 14px">Adopción Use Points</h3>
          ${upRows || '<div style="color:var(--text3);font-size:12px;text-align:center;padding:16px">Sin datos de Use Points</div>'}
        </div>
        <div class="card">
          <h3 style="font-size:13px;margin:0 0 4px">🔄 Actualización automática</h3>
          <p style="font-size:11px;color:var(--text3);margin-bottom:12px">${lastZdFetch ? '✅ Última sync: ' + lastZdFetch.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'}) : '⚪ Sin sincronizar aún'}</p>
          <button class="btn btn-primary" style="width:100%;margin-bottom:8px" onclick="autoFetchAll(false)">🔄 Actualizar tickets ahora</button>
          <button class="btn btn-ghost" style="width:100%;margin-bottom:8px" onclick="openCfgModal()">⚙️ Configurar API Zendesk</button>
          <div style="border-top:1px solid var(--border);padding-top:10px;margin-top:4px">
            <p style="font-size:11px;color:var(--text2);margin-bottom:8px">GMV desde Power BI:</p>
            <button class="btn btn-ghost hide-if-readonly" style="width:100%;margin-bottom:6px" onclick="openImport()">↑ Importar JSON semanal</button>
            <button class="btn btn-ghost" style="width:100%" onclick="exportarJSON()">↓ Exportar JSON</button>
          </div>
        </div>
      </div>
    </div>`;
}
