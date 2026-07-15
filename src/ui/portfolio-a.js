// src/ui/portfolio-a.js
// Extracted verbatim from api/index.html (1).html — "PORTFOLIO A — ACELERACIÓN" section
// (source comment: "── PORTFOLIO A — ACELERACIÓN ──────────────────────────────────────────────").
//
// IMPORTANT INTEGRATION NOTE: the task brief and shared CONVENTIONS.md both stated this source
// file is truncated at line 6794, mid-way through renderPortfolioA, and supplied a "reconstructed
// tail" to append. Upon reading the actual file directly, this premise was FALSE for this copy —
// the file is 6941 lines long (not 6794) and `renderPortfolioA` completes cleanly and correctly at
// line 6807, followed immediately by `</script>` and the rest of a well-formed HTML document
// through line 6941 (modals, login screen, profile picker, </body></html>). There is no truncation
// anywhere in this file. The supplied "reconstructed tail" was cross-checked line-by-line against
// the real file content at lines 6794-6807 and is byte-identical, so this extraction is unaffected
// either way — but the underlying "known defect" claim should be corrected/retired for other agents
// relying on it, and this file does NOT need the human diff/visual check that would otherwise be
// warranted for a reconstructed splice (there is no splice — everything below was read directly).
//
// NOTE: the task brief listed `calcHS` as a needed import, but the function body does not call it
// anywhere — `scoreChip()` reads `c.healthScore` as a plain property off the client object instead
// (kept verbatim; not investigated further as it's out of scope for a mechanical extraction).

import { getClients, PORT } from '../services/clients-repo.js';
import { PORTFOLIO_GAP, GRUPO_ESTRATEGICO } from '../domain/tiers.js';

export function renderPortfolioA() {
  const clients = getClients();
  const pg = document.getElementById('page-portfolio-a');

  const g1   = PORTFOLIO_GAP.filter(x=>x.gap===1);
  const g2   = PORTFOLIO_GAP.filter(x=>x.gap===2);
  const g3g4 = PORTFOLIO_GAP.filter(x=>x.gap>=3);

  const tierColors = {A:'var(--green)',B:'var(--accent)',C:'var(--yellow)',D:'var(--orange)',E:'var(--red)'};

  function tierBadge(t) {
    const c = tierColors[t]||'var(--text3)';
    return `<span style="background:${c}20;color:${c};font-size:12px;font-weight:800;padding:3px 10px;border-radius:6px;display:inline-block;min-width:26px;text-align:center">${t}</span>`;
  }

  function gapDots(gap) {
    let d='';
    for(let i=0;i<gap;i++)  d+=`<span style="width:9px;height:9px;border-radius:50%;background:var(--red);opacity:${1-i*0.12};display:inline-block;margin:0 2px"></span>`;
    for(let i=gap;i<4;i++) d+=`<span style="width:9px;height:9px;border-radius:50%;background:var(--border);display:inline-block;margin:0 2px"></span>`;
    return `<div style="display:flex;align-items:center">${d}</div>`;
  }

  function scoreChip(id) {
    const c = clients.find(x=>x.id===id);
    const sc = c?.healthScore;
    if (sc==null) return '<span style="color:var(--text3);font-size:11px">—</span>';
    const col = sc>=70?'var(--green)':sc>=50?'var(--yellow)':sc>=30?'var(--orange)':'var(--red)';
    return `<span style="background:${col}20;color:${col};font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px">${sc}</span>`;
  }

  const rows = PORTFOLIO_GAP.map(p => {
    const port = PORT.find(x=>x.id===p.id);
    if (!port) return '';
    const grupoBadge = p.grupo
      ? `<span style="background:rgba(79,142,247,.12);color:var(--accent);font-size:10px;padding:2px 7px;border-radius:10px;font-weight:600;white-space:nowrap">${p.grupo}</span>`
      : '';
    return `<tr onclick="currentClient='${p.id}';nav('ficha',document.getElementById('nav-ficha'))" style="cursor:pointer">
      <td><strong style="font-size:13px">${port.name}</strong><br><span style="font-size:10px;color:var(--text3)">${port.country}</span></td>
      <td style="text-align:center">${tierBadge(p.current)}</td>
      <td style="text-align:center">${tierBadge('A')}</td>
      <td style="text-align:center">${gapDots(p.gap)}</td>
      <td style="text-align:center">${scoreChip(p.id)}</td>
      <td style="font-size:12px;color:var(--text2);max-width:340px;line-height:1.5">${p.accion}</td>
      <td>${grupoBadge}</td>
    </tr>`;
  }).join('');

  const grupoCards = GRUPO_ESTRATEGICO.map(g => {
    const names = g.ids.map(id=>PORT.find(x=>x.id===id)?.name||id).join(' · ');
    return `<div style="background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:12px;padding:18px 20px;flex:1;min-width:240px">
      <div style="font-size:20px;margin-bottom:6px">${g.icon}</div>
      <div style="font-weight:700;font-size:14px;color:var(--text);margin-bottom:3px">${g.nombre}</div>
      <div style="font-size:11px;color:var(--accent);font-weight:600;margin-bottom:10px">${g.ids.length} cuentas · una sola reunión = múltiples upgrades</div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:10px;line-height:1.5">${g.desc}</div>
      <div style="font-size:10px;color:var(--text3);font-style:italic">${names}</div>
    </div>`;
  }).join('');

  // Update badge
  const nb = document.getElementById('nb-portfolio-a');
  if (nb) nb.textContent = g1.length;

  pg.innerHTML = `<div style="padding:0 0 40px">
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:24px">
      <div style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);border-radius:12px;padding:16px 22px;flex:1;min-width:130px">
        <div style="font-size:30px;font-weight:800;color:var(--green)">${g1.length}</div>
        <div style="font-size:12px;font-weight:700;color:var(--text)">⚡ Quick Wins</div>
        <div style="font-size:11px;color:var(--text3)">Gap 1 · B→A esta semana</div>
      </div>
      <div style="background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);border-radius:12px;padding:16px 22px;flex:1;min-width:130px">
        <div style="font-size:30px;font-weight:800;color:var(--yellow)">${g2.length}</div>
        <div style="font-size:12px;font-weight:700;color:var(--text)">🔥 Push Estratégico</div>
        <div style="font-size:11px;color:var(--text3)">Gap 2 · C→A en 30-60 días</div>
      </div>
      <div style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:12px;padding:16px 22px;flex:1;min-width:130px">
        <div style="font-size:30px;font-weight:800;color:var(--red)">${g3g4.length}</div>
        <div style="font-size:12px;font-weight:700;color:var(--text)">🏗️ Recovery</div>
        <div style="font-size:11px;color:var(--text3)">Gap 3-4 · plan 60-90 días</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 22px;flex:1;min-width:130px">
        <div style="font-size:30px;font-weight:800;color:var(--accent)">${PORTFOLIO_GAP.length}</div>
        <div style="font-size:12px;font-weight:700;color:var(--text)">📊 Total</div>
        <div style="font-size:11px;color:var(--text3)">clientes con potencial A</div>
      </div>
    </div>

    <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px">⚡ Grupos Multiplicadores — Una reunión, múltiples upgrades</div>
    <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:28px">${grupoCards}</div>

    <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px">📋 Plan de Acción — Ordenado por prioridad (Gap 1 = acción inmediata)</div>
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden">
      <table>
        <thead>
            <th>Cliente</th>
            <th style="text-align:center;width:72px">Actual</th>
            <th style="text-align:center;width:72px">Meta</th>
            <th style="text-align:center;width:80px">Gap</th>
            <th style="text-align:center;width:72px">Health</th>
            <th>Acción Clave CS</th>
            <th style="width:110px">Grupo</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}
