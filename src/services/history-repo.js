import { today } from '../lib/format.js';

export const LS_HISTORY = 'cs-v3-history';

// Extracted from processImport()'s history-snapshot-building portion — the rest of
// processImport() (parsing the pasted JSON, applying deltas to clients, restoring acciones)
// is owned by whichever agent writes import-export.js; this is JUST the snapshot write.
// Produces the exact {date, scores:{}, tix:{}} shape consumed by getTicketHistory()/
// calcTendencia() elsewhere in the app (see src/lib/dom.js calcTendencia) — do not change it.
export function appendHistorySnapshot(clients, calcHS) {
  try {
    const hist = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]');
    const snap = { date: today(), scores: {}, tix: {} };
    clients.forEach(c => { const h = calcHS(c); if (h.score != null) snap.scores[c.id] = h.score; if ((c.weekly?.tickets ?? null) !== null) snap.tix[c.id] = c.weekly.tickets; });
    hist.push(snap);
    if (hist.length > 12) hist.splice(0, hist.length - 12);
    localStorage.setItem(LS_HISTORY, JSON.stringify(hist));
  } catch(e) {}
}
