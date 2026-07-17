// Extracted verbatim from index.html (lines ~2371-2423)
//
// NOTE (impure by design, preserved as-is per extraction rules):
// `getTicketHistory` reads directly from localStorage (via LS_HISTORY) rather
// than going through a repo abstraction. In the source this is how ticket
// history snapshots (written by processImport, see src/services/import-export.js)
// are read back for the sparkline/pattern UI. A stricter split might route this
// through history-repo.js instead — flagging rather than silently "purifying" it.
//
// INTEGRATION TODO: LS_HISTORY was originally defined at index.html:2473 as
// `const LS_HISTORY = 'cs-v3-history';`. Assumed to now live in a shared
// lib/constants module — adjust the import path once src/lib/* lands (another
// agent owns src/lib/*, and src/services/history-repo.js likely also needs this
// same key).
import { LS_HISTORY } from '../services/history-repo.js';

// Ticket history from saved snapshots
function getTicketHistory(clientId) {
  try {
    const hist = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]');
    return hist.filter(h => h.tix && h.tix[clientId] !== undefined)
               .map(h => ({ date: h.date, tix: h.tix[clientId] }));
  } catch(e) { return []; }
}
// Returns {avg, wksWithTix, total, isRecurring, trend} or null if no data
function getTicketPattern(clientId) {
  const hist = getTicketHistory(clientId);
  if (hist.length < 2) return null;
  const recent = hist.slice(-8);
  const wksWithTix = recent.filter(h => h.tix > 0).length;
  const total = recent.reduce((s,h) => s + h.tix, 0);
  const avg = Math.round((total / recent.length) * 10) / 10;
  const isRecurring = wksWithTix >= 3;
  const last = recent[recent.length-1].tix;
  const prev = recent[recent.length-2].tix;
  const trend = last > prev ? 'up' : last < prev ? 'down' : 'flat';
  return { avg, wksWithTix, total, isRecurring, trend, weeks: recent.length };
}
// Mini sparkline bars (HTML) for ticket trend
function ticketSparkline(clientId) {
  const hist = getTicketHistory(clientId);
  if (hist.length < 2) return '<span style="font-size:11px;color:var(--text3)">Sin histórico aún — se acumula con cada importación</span>';
  const recent = hist.slice(-8);
  const maxTix = Math.max(...recent.map(h => h.tix), 1);
  const bars = recent.map(h => {
    const pct = Math.round((h.tix / maxTix) * 100);
    const col = h.tix === 0 ? '#27ae60' : h.tix >= 5 ? '#e74c3c' : h.tix >= 3 ? '#e67e22' : '#f39c12';
    return `<div title="${h.date}: ${h.tix} ticket${h.tix!==1?'s':''}" style="display:flex;flex-direction:column;align-items:center;gap:3px;cursor:default">
      <div style="width:18px;background:${col};height:${Math.max(pct*0.36,2)}px;border-radius:2px 2px 0 0;opacity:0.85;transition:opacity .15s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.85"></div>
      <div style="font-size:8px;color:var(--text3);writing-mode:vertical-rl;transform:rotate(180deg);line-height:1">${h.date.slice(5)}</div>
    </div>`;
  }).join('');
  const pat = getTicketPattern(clientId);
  const badge = pat?.isRecurring
    ? `<span style="background:rgba(231,76,60,.12);color:#e74c3c;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;margin-left:8px">🔁 RECURRENTE</span>`
    : pat ? `<span style="background:rgba(39,174,96,.1);color:#27ae60;font-size:10px;padding:2px 7px;border-radius:4px;margin-left:8px">Sin patrón crítico</span>` : '';
  const trendArrow = !pat ? '' : pat.trend==='up'?'<span style="color:#e74c3c">↑</span>':pat.trend==='down'?'<span style="color:#27ae60">↓</span>':'<span style="color:var(--text3)">→</span>';
  return `<div style="margin-bottom:10px">
    <div style="display:flex;align-items:center;margin-bottom:6px;gap:4px">
      <span style="font-size:11px;font-weight:600;color:var(--text2)">Tendencia</span>
      ${trendArrow}
      ${badge}
      ${pat?`<span style="font-size:10px;color:var(--text3);margin-left:auto">${pat.wksWithTix}/${pat.weeks} sem. con tickets</span>`:''}
    </div>
    <div style="display:flex;align-items:flex-end;gap:4px;padding:8px;background:var(--bg1);border-radius:8px;height:60px">
      ${bars}
    </div>
  </div>`;
}

export { getTicketHistory, getTicketPattern, ticketSparkline };
