export const LS_NOTES = 'cs-v3-notes';

// ── NOTES ──────────────────────────────────────────────────────────────────────
export function loadNotes(){const s=JSON.parse(localStorage.getItem(LS_NOTES)||'{}');['prioridades','compromisos','riesgos','upsell'].forEach(k=>{const el=document.getElementById('note-'+k);if(el&&s[k])el.value=s[k];});}
export function saveNote(k){const s=JSON.parse(localStorage.getItem(LS_NOTES)||'{}');s[k]=document.getElementById('note-'+k).value;localStorage.setItem(LS_NOTES,JSON.stringify(s));const t=document.getElementById('saved-'+k);t.style.opacity=1;setTimeout(()=>t.style.opacity=0,2000);}

// ── DIRECTOR VIEW — weekly notes per CSM ──────────────────────────────────────
export const DIR_NOTES_KEY = 'cs-dir-weekly-notes';

// ── Migrate old global notes → per-user key for Sami ──
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

export function saveDirNote(userId, field) {
  const key = `cs-dir-notes-${userId}`;
  const notes = JSON.parse(localStorage.getItem(key) || '{}');
  const el = document.getElementById(`dir-note-${userId}-${field}`);
  if (el) notes[field] = el.value;
  notes._week = _dirCurrentWeek;
  notes._savedAt = new Date().toISOString();
  localStorage.setItem(key, JSON.stringify(notes));
  const tag = document.getElementById(`dir-saved-${userId}-${field}`);
  if (tag) { tag.style.opacity = 1; setTimeout(() => { tag.style.opacity = 0; }, 1500); }
}

let _dirCurrentWeek = '';
// NOTE(integration addition, beyond literal spec): `_dirCurrentWeek` is read by saveDirNote()
// above and was written directly (`_dirCurrentWeek = ...`) by renderDirector() in the
// monolith (out of this agent's scope — a ui/director.js owns rendering). ESM does not allow
// an importer to reassign an imported `let` binding, so a setter is exported here for
// whichever module ends up owning renderDirector().
export function setDirCurrentWeek(w) { _dirCurrentWeek = w; }
export function getDirCurrentWeek() { return _dirCurrentWeek; }

// exposed for inline HTML handlers (ui/director.js's dynamically-built
// `onblur="saveDirNote('sami','done')"` textareas)
window.saveDirNote = saveDirNote;
