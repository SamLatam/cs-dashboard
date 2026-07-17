// ── APP ENTRY POINT / BOOT SEQUENCE ──────────────────────────────────────────
// Ported verbatim from the monolith's startApp() / _boot() (index.html:5356-5420).
// This is the module every other file's boot-time wiring ultimately depends
// on: it is the first (and only) script tag loaded by index.html
// (`<script type="module" src="/src/main.js"></script>`).
//
// Import-time note: this file and src/services/auth.js import each other
// (auth.js needs startApp() to kick off the app once a session/profile is
// resolved; this file needs initAuth()/showProfilePicker() to boot). This
// mirrors the source, where both lived in the same global script scope and
// referenced each other directly. It is safe here because neither module
// calls the other's export at module-evaluation time — only from inside
// function bodies invoked later (via _boot()/onAuthStateChange), by which
// point both modules have finished evaluating and their exports are bound.

import { initSupabaseClient } from './lib/supabase-client.js';
import { initAuth, showProfilePicker } from './services/auth.js';
import { load, resetLoadGuard, getClients } from './services/clients-repo.js';
import { getActiveUser, updateUserBadge, applyReadOnlyMode } from './services/profiles-repo.js';
import { renderKPIs } from './ui/kpis.js';
import { renderOverview } from './ui/overview.js';
import {
  updateCloudIndicator, GH_TOKEN_KEY, GH_SYNC_KEY, loadFromCloud, subscribeToRealtime
} from './services/gist-sync.js';
import { autoFetchAll } from './services/zendesk-sync.js';

let _appStarted = false;

// Source lines 5356-5405
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

// ── BOOT (source lines 5407-5419) ─────────────────────────────────────────────
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
