import { getSbClient } from '../lib/supabase-client.js';
import { getActiveUser } from './profiles-repo.js';
import { getActionsKey } from './actions-repo.js';
import { LS_DATA, load, resetLoadGuard } from './clients-repo.js';
import { LS_NOTES } from './notes-repo.js';
import { LS_HISTORY } from './history-repo.js';
import { renderKPIs } from '../ui/kpis.js';
import { renderOverview } from '../ui/overview.js';
import { renderAcciones } from '../ui/acciones.js';

// ── GITHUB GIST SYNC ─────────────────────────────────────────────────────────
export const GH_TOKEN_KEY  = 'cs-gh-token';
export const GH_GIST_KEY   = 'cs-gh-gist-id';
export const GH_SYNC_KEY   = 'cs-gh-last-sync';

let _gistSaveTimer  = null;

// ── AUTO-CONFIG SYNC DE EQUIPO ───────────────────────────────────────────────
// Config de equipo (scope: solo gist, sin acceso a repos)
// NOTE: intentionally preserved verbatim — this is legacy/broken security theater
// (a token trivially reversible via XOR with a hardcoded key), out of scope for this refactor.
(function autoConfigTeamSync() {
  if (localStorage.getItem('cs-gh-token') && localStorage.getItem('cs-gh-gist-id')) return;
  const _k = 'cs-latam-2026';
  const _e = [4,27,93,51,50,68,34,91,66,98,123,115,115,57,64,67,46,5,59,41,94,123,116,84,67,70,84,68,93,89,52,71,35,0,29,98,85,115,116,2];
  let t = ''; for (let i = 0; i < _e.length; i++) t += String.fromCharCode(_e[i] ^ _k.charCodeAt(i % _k.length));
  const G = '53e9fe55c5ab776cf63b4f0e5ad412af';
  localStorage.setItem('cs-gh-token', t);
  localStorage.setItem('cs-gh-gist-id', G);
})();

// ── GIST SYNC v2 — Compartido multi-usuario ───────────────────────────────────
// Un solo Gist compartido por todo el equipo.
// Cada CSM escribe su propio archivo: cs-{userId}.json
// Superadmin/Director leen TODOS los archivos y fusionan datos.
// Token y Gist ID son iguales para todos — admin los distribuye.

export function buildUserSnapshot() {
  const user = getActiveUser();
  if (!user) return {};
  const snap = { _userId: user.id, _savedAt: new Date().toISOString() };

  // Datos de clientes — solo los propios
  try {
    const allData = JSON.parse(localStorage.getItem(LS_DATA) || '{}');
    if (allData.clients) {
      const myClients = allData.clients.filter(c => user.clientIds.includes(c.id));
      snap[LS_DATA] = JSON.stringify({ lastUpdate: allData.lastUpdate, clients: myClients, seedVersion: allData.seedVersion });
    }
  } catch(e) {}

  // Acciones propias
  const actKey = getActionsKey(user.id);
  const acts = localStorage.getItem(actKey);
  if (acts) snap[actKey] = acts;

  // Notas (clave con userId para no pisar las de otros)
  const notes = localStorage.getItem(LS_NOTES);
  if (notes) snap['cs-v3-notes-' + user.id] = notes;

  // Historial de health score
  const hist = localStorage.getItem(LS_HISTORY);
  if (hist) snap[LS_HISTORY] = hist;

  // Mood por cliente propio
  user.clientIds.forEach(id => {
    const mood = localStorage.getItem('cs-mood-' + id);
    if (mood) snap['cs-mood-' + id] = mood;
  });

  return snap;
}

export function scheduleGistSave() {
  if (!localStorage.getItem(GH_TOKEN_KEY)) return;
  clearTimeout(_gistSaveTimer);
  _gistSaveTimer = setTimeout(doGistSave, 3000);
  updateCloudIndicator('pending');
}

export async function doGistSave() {
  const token  = localStorage.getItem(GH_TOKEN_KEY);
  const gistId = localStorage.getItem(GH_GIST_KEY);
  const user   = getActiveUser();
  if (!token || !user) return;

  const filename = `cs-${user.id}.json`;
  const content  = JSON.stringify(buildUserSnapshot(), null, 2);

  try {
    let res, data;
    if (gistId) {
      res = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: { [filename]: { content } } })
      });
    } else {
      res = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: 'CS Dashboard AnyMarket LATAM — sync compartido equipo',
          public: false,
          files: { [filename]: { content } }
        })
      });
    }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
    if (!gistId) localStorage.setItem(GH_GIST_KEY, data.id);
    const now = new Date().toISOString();
    localStorage.setItem(GH_SYNC_KEY, now);
    updateCloudIndicator('ok', now);
    // Notificar a todos los usuarios conectados vía Supabase broadcast
    if (getSbClient()) {
      try {
        getSbClient().channel('cs-latam-sync-v2').send({
          type: 'broadcast', event: 'data-updated',
          payload: { userId: user.id, savedAt: now }
        });
      } catch(e) {}
    }
  } catch(e) {
    console.warn('[GistSync] save failed:', e.message);
    updateCloudIndicator('error');
  }
}

// ── SUPABASE REAL-TIME SYNC ───────────────────────────────────────────────────
export function subscribeToRealtime() {
  if (!getSbClient()) return;
  try {
    getSbClient().channel('cs-latam-sync-v2')
      .on('broadcast', { event: 'data-updated' }, async (payload) => {
        const user = getActiveUser();
        if (!user) return;
        if (payload.payload?.userId === user.id) return; // ignorar propios
        console.log('[Realtime] Update from', payload.payload?.userId, '— recargando...');
        const loaded = await loadFromCloud();
        if (loaded) { resetLoadGuard(); load(); renderKPIs(); renderOverview(); }
      })
      .subscribe();
    console.log('[Realtime] Subscrito a cs-latam-sync-v2');
  } catch(e) { console.warn('[Realtime] subscribe error:', e); }
}

export async function loadFromCloud() {
  const token  = localStorage.getItem(GH_TOKEN_KEY);
  const gistId = localStorage.getItem(GH_GIST_KEY);
  if (!token || !gistId) return false;

  const user    = getActiveUser();
  const isAdmin = user && ['superadmin','director'].includes(user.role);

  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${token}` }
    });
    if (!res.ok) return false;
    const gistData = await res.json();
    const files    = gistData.files || {};

    let mergedClients  = [];
    let appliedOwn     = false;
    let gistSeedVersion = null;

    for (const [fname, fileObj] of Object.entries(files)) {
      if (!fname.startsWith('cs-') || !fname.endsWith('.json')) continue;
      try {
        const snap       = JSON.parse(fileObj.content);
        const fileUserId = snap._userId;
        const isOwnFile  = user && fname === `cs-${user.id}.json`;

        // CSM solo procesa su propio archivo; admin procesa todos
        if (!isAdmin && !isOwnFile) continue;

        // Fusionar datos de clientes
        if (snap[LS_DATA]) {
          try {
            const parsed = JSON.parse(snap[LS_DATA]);
            if (parsed.clients) mergedClients.push(...parsed.clients);
            if (parsed.seedVersion && isOwnFile) gistSeedVersion = parsed.seedVersion;
          } catch(e) {}
        }

        // Acciones del usuario de este archivo
        if (fileUserId) {
          const actKey = `cs-v3-actions-${fileUserId}`;
          if (snap[actKey]) localStorage.setItem(actKey, snap[actKey]);
        }

        // Notas (solo aplicar las propias)
        const notesKey = `cs-v3-notes-${fileUserId}`;
        if (snap[notesKey] && isOwnFile) localStorage.setItem(LS_NOTES, snap[notesKey]);

        // Historial
        if (snap[LS_HISTORY] && isOwnFile) localStorage.setItem(LS_HISTORY, snap[LS_HISTORY]);

        // Mood
        Object.entries(snap).forEach(([k, v]) => {
          if (k.startsWith('cs-mood-')) localStorage.setItem(k, v);
        });

        if (isOwnFile) appliedOwn = true;

      } catch(e) { console.warn('[GistSync] error parsing', fname, e); }
    }

    // Fusionar datos de clientes en localStorage
    if (mergedClients.length > 0) {
      try {
        const existingRaw = localStorage.getItem(LS_DATA);
        const existing    = existingRaw ? JSON.parse(existingRaw) : {};
        const localList   = existing.clients || [];
        // Índice de clientes remotos (tienen prioridad)
        const remoteMap   = new Map(mergedClients.map(c => [c.id, c]));
        // Clientes que solo están en local (sin datos remotos)
        const localOnly   = localList.filter(c => !remoteMap.has(c.id));
        const merged      = [...mergedClients, ...localOnly];
        localStorage.setItem(LS_DATA, JSON.stringify({ lastUpdate: existing.lastUpdate, clients: merged, seedVersion: gistSeedVersion || existing.seedVersion }));
      } catch(e) {}
    }

    const ts = gistData.updated_at;
    localStorage.setItem(GH_SYNC_KEY, ts);
    updateCloudIndicator('ok', ts);
    return appliedOwn || isAdmin;

  } catch(e) {
    console.warn('[GistSync] load failed:', e.message);
    return false;
  }
}

export function updateCloudIndicator(state, ts) {
  const btn = document.getElementById('cloud-sync-btn');
  if (!btn) return;
  const icons = { ok: '☁️', pending: '⏳', error: '⚠️', off: '🔌' };
  const token = localStorage.getItem(GH_TOKEN_KEY);
  if (!token) { btn.textContent = icons.off + ' Sync'; btn.title = 'Configurar sincronización'; return; }
  if (state === 'ok') {
    const when = ts ? new Date(ts).toLocaleTimeString('es', {hour:'2-digit', minute:'2-digit'}) : '';
    btn.textContent = icons.ok + ' Sync';
    btn.title = 'Sincronizado' + (when ? ' a las ' + when : '');
    btn.style.color = 'var(--green)';
  } else if (state === 'pending') {
    btn.textContent = icons.pending + ' Guardando…';
    btn.title = 'Guardando en la nube…';
    btn.style.color = 'var(--yellow)';
  } else {
    btn.textContent = icons.error + ' Sync';
    btn.title = 'Error de sincronización — click para configurar';
    btn.style.color = 'var(--red)';
  }
}

export function getTeamCode() {
  const token  = localStorage.getItem(GH_TOKEN_KEY) || '';
  const gistId = localStorage.getItem(GH_GIST_KEY)  || '';
  if (!token || !gistId) return '';
  return btoa(JSON.stringify({ t: token, g: gistId }));
}

export function applyTeamCode(code) {
  try {
    const parsed = JSON.parse(atob(code.trim()));
    if (parsed.t) localStorage.setItem(GH_TOKEN_KEY, parsed.t);
    if (parsed.g) localStorage.setItem(GH_GIST_KEY,  parsed.g);
    return true;
  } catch(e) { return false; }
}

// KNOWN DEAD REFERENCES (preserved, not fixed — pre-existing bug): openCloudSetup/
// closeCloudSetup/getTeamCode/applyTeamCode/copyTeamCode reference DOM ids
// (cloud-setup-overlay, team-code-display, team-code-section, copy-team-code-btn) that do
// NOT exist anywhere in the static HTML. Clicking these would throw at runtime.
export function openCloudSetup() {
  const overlay = document.getElementById('cloud-setup-overlay');
  if (!overlay) return;
  document.getElementById('cloud-token-input').value = localStorage.getItem(GH_TOKEN_KEY) || '';
  document.getElementById('cloud-gist-input').value  = localStorage.getItem(GH_GIST_KEY)  || '';
  // Mostrar código de equipo si ya está configurado
  const teamCode = getTeamCode();
  const tcEl = document.getElementById('team-code-display');
  if (tcEl) tcEl.value = teamCode;
  const tcSection = document.getElementById('team-code-section');
  if (tcSection) tcSection.style.display = teamCode ? 'block' : 'none';
  overlay.style.display = 'flex';
}

export function closeCloudSetup() {
  const overlay = document.getElementById('cloud-setup-overlay');
  if (overlay) overlay.style.display = 'none';
}

export async function saveCloudConfig() {
  const token  = (document.getElementById('cloud-token-input').value || '').trim();
  const gistId = (document.getElementById('cloud-gist-input').value  || '').trim();
  // También aceptar código de equipo pegado en el campo token
  if (token && token.length > 40 && !token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
    if (applyTeamCode(token)) { closeCloudSetup(); await doGistSave(); return; }
  }
  if (!token) { alert('El token de GitHub es requerido.'); return; }
  localStorage.setItem(GH_TOKEN_KEY, token);
  if (gistId) localStorage.setItem(GH_GIST_KEY, gistId);
  else localStorage.removeItem(GH_GIST_KEY);
  closeCloudSetup();
  await doGistSave();
}

export function copyTeamCode() {
  const code = getTeamCode();
  if (!code) { alert('Primero guarda la configuración.'); return; }
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById('copy-team-code-btn');
    if (btn) { btn.textContent = '✅ Copiado'; setTimeout(() => btn.textContent = '📋 Copiar código de equipo', 2000); }
  });
}

export async function syncNow() {
  const token = localStorage.getItem(GH_TOKEN_KEY);
  if (!token) { openCloudSetup(); return; }
  updateCloudIndicator('pending');
  const loaded = await loadFromCloud();
  if (loaded) {
    try {
      resetLoadGuard(); // permitir re-load con datos del Gist
      load(); renderKPIs(); renderOverview();
      if (typeof renderAcciones === 'function') renderAcciones();
    } catch(e) {}
  }
  await doGistSave();
}
// ── END GITHUB GIST SYNC v2 ───────────────────────────────────────────────────

// exposed for inline HTML handlers
window.syncNow = syncNow;
