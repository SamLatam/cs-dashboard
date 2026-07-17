// ── FREE-TEXT NOTES (Página "Notas" + Director weekly notes migration shim) ───
// Mechanically extracted from index.html (verbatim behavior).
//
// LS_NOTES/loadNotes/saveNote: lines ~4130-4132 ("── NOTES ──" block) — the 4
// free-text note areas on the "Notas" page (prioridades/compromisos/riesgos/
// upsell textareas, index.html:912-931).
// src/services/clients-repo.js (already built) imports `loadNotes` from this
// file by that exact name — confirmed by reading clients-repo.js.
// src/services/gist-sync.js (this agent's own other file) also needs LS_NOTES
// (buildUserSnapshot()/loadFromCloud() read/write it directly by key) — so
// LS_NOTES is exported here too, not just the two functions.
//
// The blur-listener wiring at index.html:5420 —
// `['prioridades','compromisos','riesgos','upsell'].forEach(k=>{...
// .addEventListener('blur',()=>saveNote(k));});` — runs as a bare top-level
// statement in the source (part of the bottom "INIT" section, right after the
// DOMContentLoaded/_boot() wiring). It is kept here as a top-level statement
// too (executes at module-evaluation time), since it's tightly coupled to
// saveNote()/the note textareas and no main.js/app.js entry point exists yet
// to host it (see auth.js's header note on the same gap). INTEGRATION TODO:
// once a real app entry point exists, confirm this still runs after the DOM
// nodes it queries (#note-prioridades etc.) exist — in the source it worked
// because the <script> tag is inline at the bottom of <body>, after the
// textareas; a bundled ES module may need this deferred to DOMContentLoaded.
//
// DIR_NOTES_KEY + the "migrate old global notes → per-user key for Sami" IIFE:
// lines ~4728-4748. This is a one-time localStorage migration shim for the
// Director weekly-notes feature. ui/director.js (already built by another
// agent) owns saveDirNote()/renderDirector() and reads 'cs-dir-notes-sami' +
// DIR_NOTES_KEY directly (confirmed by reading it), but does NOT contain this
// migration IIFE or the DIR_NOTES_KEY constant itself (confirmed — grepped
// ui/director.js for both, no matches) — so this shim is homed here per this
// agent's assigned scope ("director notes/migration shim if present").
// INTEGRATION TODO: ui/director.js currently references DIR_NOTES_KEY as a
// bare global with no import statement at all (it has no import lines yet —
// see its own header comment: "the integration pass wires up the real
// imports once the sibling lib/services/domain modules land"). The
// integration pass should add `import { DIR_NOTES_KEY } from
// '../services/notes-repo.js';` there.

export const LS_NOTES = 'cs-v3-notes';

export function loadNotes() {
  const s = JSON.parse(localStorage.getItem(LS_NOTES) || '{}');
  ['prioridades','compromisos','riesgos','upsell'].forEach(k => {
    const el = document.getElementById('note-' + k);
    if (el && s[k]) el.value = s[k];
  });
}

export function saveNote(k) {
  const s = JSON.parse(localStorage.getItem(LS_NOTES) || '{}');
  s[k] = document.getElementById('note-' + k).value;
  localStorage.setItem(LS_NOTES, JSON.stringify(s));
  const t = document.getElementById('saved-' + k);
  t.style.opacity = 1; setTimeout(() => t.style.opacity = 0, 2000);
}

// exposed for inline HTML handlers — NOTE: in the source, saveNote is wired via
// addEventListener (below), not an inline onclick/onblur="" attribute, so no
// window-attachment is strictly required for it to function. Attached anyway
// for parity with the rest of this codebase's convention of exposing every
// user-triggerable action on `window`, and in case any other still-unwritten
// page ends up calling it inline.
window.saveNote = saveNote;

['prioridades','compromisos','riesgos','upsell'].forEach(k => {
  const el = document.getElementById('note-' + k);
  if (el) el.addEventListener('blur', () => saveNote(k));
});

// ── DIRECTOR WEEKLY NOTES — migration shim ───────────────────────────────────
// (index.html:4728-4748)
export const DIR_NOTES_KEY = 'cs-dir-weekly-notes';

// Migrate old global notes → per-user key for Sami
(function migrateDirNotes() {
  try {
    const old = localStorage.getItem(DIR_NOTES_KEY);
    if (old && !localStorage.getItem('cs-dir-notes-sami')) {
      localStorage.setItem('cs-dir-notes-sami', old);
    }
    // Fix: correct wrong text about firma (was CS Command Center, is actually Belcorp supplier)
    const samiKey = 'cs-dir-notes-sami';
    const saved = JSON.parse(localStorage.getItem(samiKey) || '{}');
    if (saved.solicitudes && saved.solicitudes.includes('CS Command Center como proveedor oficial DB1')) {
      saved.solicitudes = saved.solicitudes.replace(
        /DECISIÓN HOY: Firma hoja de personas involucradas[^\n]*/,
        'DECISIÓN HOY: BELCORP — Firma hoja personas involucradas → Rodolfo firma y devuelve a Sami para enviar a Belcorp (alta de proveedor, impacta CL/CO/PE/MX)'
      );
      localStorage.setItem(samiKey, JSON.stringify(saved));
    }
  } catch(e) {}
})();
