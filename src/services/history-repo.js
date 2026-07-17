// ── HEALTH SCORE / TICKET HISTORY SNAPSHOTS ───────────────────────────────────
// Mechanically extracted from index.html.
//
// LS_HISTORY constant: originally defined at index.html:2473 as
// `const LS_HISTORY = 'cs-v3-history';` (bare module-level global in the
// monolith, alongside `let clients = [], actions = [];`).
//
// appendHistorySnapshot(snap): replaces the inline try/catch block at
// index.html:4116-4123 (inside processImport(), src/services/import-export.js
// in the modularized version), which read LS_HISTORY, pushed a snapshot,
// capped the array at the last 12 entries, and wrote it back to localStorage.
// src/services/import-export.js (already built by another agent) imports
// `appendHistorySnapshot` from this file by that exact name — confirmed by
// reading import-export.js — so this export name/signature is not a guess.
//
// KNOWN CROSS-FILE NAMING MISMATCH (found while reading already-built sibling
// files, flagged for the integration pass rather than fixed here):
// src/domain/ticket-patterns.js guesses `import { LS_HISTORY } from
// '../lib/constants.js';` — there is no lib/constants.js; LS_HISTORY's real
// home is this file (src/services/history-repo.js). Same for
// src/lib/dom.js's calcTendencia(), which deliberately hardcodes the literal
// string 'cs-v3-history' instead of importing the constant (see that file's
// own header comment) — that one is an intentional design choice by that
// file's author, not a bug, so it's not flagged for change, only noted here
// for completeness.

export const LS_HISTORY = 'cs-v3-history';

export function appendHistorySnapshot(snap) {
  try {
    const hist = JSON.parse(localStorage.getItem(LS_HISTORY) || '[]');
    hist.push(snap);
    if (hist.length > 12) hist.splice(0, hist.length - 12);
    localStorage.setItem(LS_HISTORY, JSON.stringify(hist));
  } catch(e) {}
}
