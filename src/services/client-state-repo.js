// ── PER-CLIENT LOCALSTORAGE STATE (mood, patterns, marketplaces, ficha note,
//    MRR/renewal setters) ──────────────────────────────────────────────────────
// Mechanically extracted from index.html (verbatim behavior). Small,
// independent per-client getter/setter pairs, each keyed by `<prefix>-<clientId>`
// in localStorage — grouped into this one file per this agent's assigned scope.
//
// Included here:
//   - MOODS / getMood / saveMood / moodBadge        (index.html:2346-2360)
//   - getPatterns / savePatterns                     (index.html:2363-2370)
//   - saveMkt / editMktInline / saveMktInline         (index.html:3423-3451ish)
//   - saveFichaNote                                  (index.html:3419-3422)
//   - saveMRRField / saveRenewalField / updateRenewalBadge (index.html:4396-4415,
//     the "setter half" of the MRR/renewal fields — getMRR/getRenewal/
//     getRenewalAction, the "getter half", already live in
//     src/domain/renewal-revenue.js per that file's own header comment)
//
// Explicitly NOT included (per this agent's brief / already owned elsewhere):
//   - getLifecycle/saveLifecycle/buildPlaybook/LC_STAGES — already fully
//     implemented in src/domain/lifecycle.js (confirmed by reading it).
//   - SEED_MARKETPLACES/mergeSeedMarketplaces — already fully implemented
//     inside src/services/clients-repo.js (confirmed by reading it — it's
//     used only internally by that file's own load(), not exported, so no
//     cross-file dependency was needed).
//
// NOT FOUND IN SOURCE: the task brief for this file also mentioned "RF/OB/AP/
// ESC/Rein" fields, "compromisos cliente/DB1" and "integration status" as
// belonging here. This agent grepped the ENTIRE 7489-line index.html
// (case-insensitive, multiple patterns: literal tokens, id="..."/key
// patterns, human-readable labels like "Riesgo Financiero"/"Escalamiento"/
// "Reincidencia"/"Acuerdos Pendientes") and found no matching identifiers,
// localStorage keys, or DOM element ids anywhere in the ground-truth file.
// The closest real candidates are: the 4 lifecycle-adjacent per-client
// concepts already covered above (mood/patterns/marketplaces/MRR-renewal), or
// the generic `getSD/saveSD` ('cs-strat-'+id) key-value store used inside
// renderPortfolioA() (index.html:7020-7029) for fields like `expansionArr`/
// `execSponsor`/`nextPlay` — but that function is a closure-local helper
// entirely inside renderPortfolioA(), which is explicitly out of this agent's
// scope (owned by the concurrent agent writing ui/portfolio-a.js), so it was
// NOT duplicated here. Flagging this explicitly rather than inventing fields
// that don't exist in the source, per the "never invent" extraction rule.
//
// ASSUMPTIONS about other modules' exports (unverified at write time — flagged
// for the integration pass):
//   - clients-repo.js exports: getClients (confirmed by reading it).
//   - domain/renewal-revenue.js exports: getRenewal (confirmed by reading it).
//   - lib/format.js exports: daysUntil (confirmed by reading it).
//   - ui/overview.js exports: renderTable too (confirmed by reading its export
//     list — this is the main portfolio table's real home, not a guess).
import { getClients } from './clients-repo.js';
import { getRenewal } from '../domain/renewal-revenue.js';
import { daysUntil } from '../lib/format.js';
import { renderTable } from '../ui/overview.js';

// ── MOOD ───────────────────────────────────────────────────────────────────────
export const MOODS = {
  positivo:   { emoji:'😊', label:'Positivo',   cls:'mood-positivo' },
  neutro:     { emoji:'😐', label:'Neutro',     cls:'mood-neutro' },
  preocupado: { emoji:'😟', label:'Preocupado', cls:'mood-preocupado' },
  critico:    { emoji:'🚨', label:'Crítico',    cls:'mood-critico' }
};

export function getMood(id) { return localStorage.getItem('cs-mood-' + id) || ''; }

export function saveMood(id, val) {
  localStorage.setItem('cs-mood-' + id, val);
  // refresh mood-opt buttons inside ficha if open
  document.querySelectorAll(`.mood-opt[data-mood-id="${id}"]`).forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.moodVal === val);
  });
  renderTable();
}

export function moodBadge(id) {
  const m = getMood(id);
  if (!m || !MOODS[m]) return '';
  return `<span class="mood-pill ${MOODS[m].cls}" onclick="event.stopPropagation();openFicha('${id}')" title="${MOODS[m].label}">${MOODS[m].emoji}</span>`;
}

// ── TICKET PATTERNS (manual notes — distinct from the auto ticket-history
//    sparkline in src/domain/ticket-patterns.js) ──────────────────────────────
export function getPatterns(id) { return localStorage.getItem('cs-patterns-' + id) || ''; }

export function savePatterns(id) {
  const el = document.getElementById('patterns-' + id);
  if (!el) return;
  localStorage.setItem('cs-patterns-' + id, el.value);
  const t = document.getElementById('saved-patterns-' + id);
  if (t) { t.style.opacity = 1; setTimeout(() => t.style.opacity = 0, 2000); }
}

// ── MARKETPLACES (per-client free-text field, ficha + table inline edit) ────
export function saveMkt(id) {
  const val = document.getElementById('mktInput-' + id)?.value || '';
  localStorage.setItem('cs-mkt-' + id, val);
  const t = document.getElementById('saved-mkt-' + id);
  if (t) { t.style.opacity = 1; setTimeout(() => t.style.opacity = 0, 2000); }
}

export function editMktInline(id) {
  const disp = document.getElementById('mkt-display-' + id);
  const inp  = document.getElementById('mkt-input-' + id);
  if (!disp || !inp) return;
  disp.style.display = 'none';
  inp.style.display  = 'block';
  inp.focus();
  inp.select();
}

export function saveMktInline(id) {
  const inp  = document.getElementById('mkt-input-' + id);
  const disp = document.getElementById('mkt-display-' + id);
  if (!inp || !disp) return;
  const val = inp.value.trim();
  localStorage.setItem('cs-mkt-' + id, val);
  // También sync en ficha si está abierta
  const fichaInp = document.getElementById('mktInput-' + id);
  if (fichaInp) fichaInp.value = val;
  // Re-render chips
  const chips = val.split(',').map(m=>m.trim()).filter(Boolean)
    .map(m=>`<span style="background:rgba(79,142,247,.12);color:var(--accent);font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600">${m}</span>`).join('');
  disp.innerHTML = chips || '<span style="color:var(--text3);font-size:11px">+ agregar</span>';
}

// ── FICHA NOTE (per-client free-text note, distinct from the 4 global "Notas"
//    page textareas owned by src/services/notes-repo.js) ─────────────────────
export function saveFichaNote(id) {
  localStorage.setItem('cs-note-' + id, document.getElementById('fichaNote').value);
  const t = document.getElementById('saved-ficha'); t.style.opacity = 1; setTimeout(() => t.style.opacity = 0, 2000);
}

// ── MRR / RENEWAL — setter half (getter half: getMRR/getRenewal/
//    getRenewalAction live in src/domain/renewal-revenue.js) ─────────────────
export function saveMRRField(id) {
  const v = document.getElementById('mrr-input-' + id)?.value;
  if (v === null || v === undefined) return;
  if (!v || parseFloat(v) === 0) localStorage.removeItem('cs-mrr-' + id);
  else localStorage.setItem('cs-mrr-' + id, parseFloat(v));
  const t = document.getElementById('saved-mrr-' + id);
  if (t) { t.style.opacity = 1; setTimeout(() => t.style.opacity = 0, 2000); }
}

export function saveRenewalField(id) {
  const v = document.getElementById('renewal-input-' + id)?.value;
  if (v) localStorage.setItem('cs-renewal-' + id, v);
  else localStorage.removeItem('cs-renewal-' + id);
  const t = document.getElementById('saved-renewal-' + id);
  if (t) { t.style.opacity = 1; setTimeout(() => t.style.opacity = 0, 2000); }
  // update badge
  updateRenewalBadge();
}

export function updateRenewalBadge() {
  const urgent = getClients().filter(c => { const r = getRenewal(c.id); return r && daysUntil(r) <= 30 && daysUntil(r) >= 0; }).length;
  const badge = document.getElementById('nb-renovaciones');
  if (badge) { badge.textContent = urgent; badge.style.display = urgent > 0 ? 'flex' : 'none'; }
}

// exposed for inline HTML handlers (confirmed via grep of the whole source for
// onclick/onblur/onkeydown/onchange="..." referencing these names — e.g.
// onclick="saveMood('${id}','${k}')" in the ficha mood-selector,
// onblur="saveMkt('${id}')" / onkeydown="...saveMkt('${id}')..." on the ficha
// marketplaces input, onclick="editMktInline('${id}')" / onclick/onblur/
// onkeydown="saveMktInline('${id}')" on the inline table chips,
// onclick="savePatterns('${id}')" in the ficha ticket-patterns box,
// onclick="saveFichaNote('${id}')" on the ficha notes button, and
// onblur/onkeydown="saveMRRField('${id}')" / onblur/onchange=
// "saveRenewalField('${id}')" on the ficha MRR/renewal inputs).
window.saveMood = saveMood;
window.savePatterns = savePatterns;
window.saveMkt = saveMkt;
window.editMktInline = editMktInline;
window.saveMktInline = saveMktInline;
window.saveFichaNote = saveFichaNote;
window.saveMRRField = saveMRRField;
window.saveRenewalField = saveRenewalField;
