// src/main.js
// Composition root / boot sequence for the CS Command Center Vite app.
//
// Ported verbatim (behaviorally) from the ground-truth monolith's INIT block:
//   - setUpdateLabel()      — source line ~2444
//   - startApp()            — source line ~5097
//   - _boot() + DOMContentLoaded wiring — source line ~5148-5160
//   - notes textarea blur wiring        — source line ~5161
//
// This file is intentionally imported BACK by several service modules
// (services/clients-repo.js, services/import-export.js want `setUpdateLabel`;
// services/auth.js wants `startApp`) — those are legitimate circular imports because in every
// case the function is only ever CALLED from inside another function body or event callback,
// never at module-evaluation time. ES module bindings are live and hoisted function
// declarations are available before any module's top-level body runs, so this resolves cleanly
// under Vite/ESM. See services/auth.js's own note for the same pattern.

import { initSupabaseClient } from './lib/supabase-client.js';
import { initAuth, showProfilePicker } from './services/auth.js';
import { getActiveUser, applyReadOnlyMode } from './services/profiles-repo.js';
import { getClients, load, resetLoadGuard } from './services/clients-repo.js';
import { saveNote } from './services/notes-repo.js';
import { updateUserBadge } from './ui/auth-screen.js';
import { renderKPIs } from './ui/kpis.js';
import { renderOverview } from './ui/overview.js';
import {
  GH_TOKEN_KEY, GH_SYNC_KEY, updateCloudIndicator, loadFromCloud, subscribeToRealtime
} from './services/gist-sync.js';
import { autoFetchAll } from './services/zendesk-legacy.js';

// ── UPDATE LABEL (sidebar footer + page subtitle) ─────────────────────────────
export function setUpdateLabel(dt) {
  const footer = document.getElementById('sidebarFooter');
  if (footer) footer.textContent = 'Última act.: ' + (dt || '—');
  const sub = document.getElementById('pageSubtitle');
  if (sub) sub.textContent = getClients().length + ' clientes · datos al ' + (dt || '—');
}

// ── INIT ───────────────────────────────────────────────────────────────────────
let _appStarted = false;

export function startApp() {
  if (_appStarted) return;
  _appStarted = true;
  load();
  const _initActiveUser = getActiveUser();
  if (!_initActiveUser) {
    showProfilePicker();
  } else {
    updateUserBadge();
    applyReadOnlyMode();
  }
  renderKPIs();
  renderOverview();
  // GitHub Gist sync — actualizar indicador y cargar datos de la nube si hay token
  setTimeout(() => {
    updateCloudIndicator(localStorage.getItem(GH_TOKEN_KEY) ? 'ok' : 'off', localStorage.getItem(GH_SYNC_KEY));
    if (localStorage.getItem(GH_TOKEN_KEY)) {
      loadFromCloud().then(loaded => {
        if (loaded) {
          resetLoadGuard(); // permitir re-load con datos del Gist
          load(); renderKPIs(); renderOverview();
        }
      });
    }
  }, 1500);
  // Real-time sync: Supabase broadcast + polling cada 90s como fallback
  setTimeout(() => subscribeToRealtime(), 2000);
  setInterval(async () => {
    if (!localStorage.getItem(GH_TOKEN_KEY)) return;
    const prevSync = localStorage.getItem(GH_SYNC_KEY);
    const loaded = await loadFromCloud();
    const newSync = localStorage.getItem(GH_SYNC_KEY);
    if (loaded && newSync !== prevSync) {
      console.log('[Poll] Datos nuevos detectados — actualizando dashboard');
      resetLoadGuard(); load(); renderKPIs(); renderOverview();
    }
  }, 90000); // cada 90 segundos
  // Auto-fetch Zendesk en segundo plano
  setTimeout(() => autoFetchAll(true), 2000);
  setInterval(() => autoFetchAll(true), 30 * 60 * 1000);
  // Banner si no hay datos (abierto desde SharePoint preview)
  setTimeout(() => {
    const clients = getClients();
    if (!clients || clients.length === 0) {
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#e74c3c;color:#fff;text-align:center;padding:14px 20px;font-size:14px;font-weight:600;z-index:9998;';
      banner.innerHTML = '⚠️ Este archivo necesita ser <strong>descargado</strong> para funcionar correctamente. Hacé clic en ⬇ Baixar arriba → abrilo desde tu computadora.';
      document.body.prepend(banner);
    }
  }, 500);
}

// Inicializar una sola vez — evitar doble init si DOM ya está listo
let _initDone = false;
function _boot() {
  if (_initDone) return;
  _initDone = true;
  initSupabaseClient();
  initAuth(); // async — llama startApp() cuando la sesión esté lista
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _boot);
} else {
  _boot();
}

['prioridades', 'compromisos', 'riesgos', 'upsell'].forEach(k => {
  const el = document.getElementById('note-' + k);
  if (el) el.addEventListener('blur', () => saveNote(k));
});
