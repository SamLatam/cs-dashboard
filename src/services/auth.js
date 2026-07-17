// ── SUPABASE AUTH / SESSION / PROFILE PICKER ──────────────────────────────────
// Mechanically extracted from index.html (verbatim behavior).
//
// Two source regions are grouped into this single file per this agent's assigned
// scope, even though they are ~3700 lines apart in the monolith:
//   1) index.html:934-1072  — "SUPABASE INTEGRATION" block: sbUser/session state,
//      _handleSession, initAuth, showSbMsg, sendMagicLink, pullFromSupabase, sbLogout.
//   2) index.html:4643-4712 — "PROFILE PICKER & USER MANAGEMENT" block (the
//      profile-picker half only — showProfilePicker/selectProfile/updateUserBadge/
//      logoutUser; the user CRUD half — addUser/editUser/deleteUser/saveUserForm —
//      belongs to src/services/profiles-repo.js per this agent's file split).
//
// NOTE: SB_URL/SB_KEY/initSupabaseClient/getSbClient already live in
// src/lib/supabase-client.js (built by another agent before this file was
// written) — confirmed by reading that file. This module does NOT redefine the
// client construction, only the *session* (sbUser) and auth/profile-picker glue.
//
// ASSUMPTIONS about other modules' exports (unverified at write time — flagged
// for the integration pass):
//   - ./clients-repo.js exports: load, getClients, setClients (confirmed by
//     reading clients-repo.js) — does NOT export a way to reset the private
//     `_appLoaded` guard (see INTEGRATION TODO below, at the two call sites that
//     need it).
//   - ./actions-repo.js exports: setActions (confirmed by reading actions-repo.js).
//   - ./profiles-repo.js exports: loadUsers, getActiveUser, setActiveUser,
//     LS_ACTIVE_USER, updateUserBadge, applyReadOnlyMode (this agent's own other
//     file, written alongside this one — names chosen to match what clients-repo.js/
//     actions-repo.js already expect from profiles-repo.js: getActiveUser,
//     getVisibleClientIds, loadUsers, canEdit).
//   - ../ui/kpis.js exports: renderKPIs (confirmed — already built).
//   - ../ui/overview.js exports: renderOverview (confirmed — already built).
//   - '../app.js' exports: startApp (index.html:5356). startApp() is the
//     top-level app bootstrap (load() + first render + Gist/Zendesk polling wiring
//     + the DOMContentLoaded _boot() sequence at index.html:5408-5419). No
//     src/*.js file has claimed this yet (no main.js/app.js exists in src/ as of
//     this writing) — this is a guessed import path, must be reconciled once a
//     real entry-point module lands in the integration pass.
import { getSbClient } from '../lib/supabase-client.js';
import { load, setClients, resetLoadGuard } from './clients-repo.js';
import { setActions } from './actions-repo.js';
import { loadUsers, getActiveUser, setActiveUser, LS_ACTIVE_USER, updateUserBadge, applyReadOnlyMode } from './profiles-repo.js';
import { renderKPIs } from '../ui/kpis.js';
import { renderOverview } from '../ui/overview.js';
import { startApp } from '../main.js';

// ── SESSION STATE ──────────────────────────────────────────────────────────────
let sbUser = null;
let _appStarted = false;

export function getSbUser() { return sbUser; }

async function _handleSession(session) {
  const sbClient = getSbClient();
  const loginScreen = document.getElementById('sb-login-screen');
  if (!session || !session.user) return false;
  if (!session.user.email.endsWith('@db1.com.br')) {
    await sbClient.auth.signOut();
    sbUser = null;
    loginScreen.style.display = 'flex';
    showSbMsg('❌ Solo usuarios @db1.com.br pueden acceder.', 'var(--red)');
    return false;
  }
  sbUser = session.user;
  loginScreen.style.display = 'none';
  // Arrancar inmediatamente con datos locales — no bloquear por Supabase
  startApp();
  // Sync Supabase en background (no await — no bloquea el arranque)
  pullFromSupabase().catch(e => console.warn('Supabase sync background error:', e));
  return true;
}

export async function initAuth() {
  const sbClient = getSbClient();
  const loginScreen = document.getElementById('sb-login-screen');
  if (!sbClient) { startApp(); return; }

  // Escuchar TODOS los eventos de autenticación relevantes
  sbClient.auth.onAuthStateChange(async (event, session) => {
    if (_appStarted) return; // ya inició, ignorar
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      await _handleSession(session);
    } else if (event === 'SIGNED_OUT') {
      sbUser = null; _appStarted = false;
      loginScreen.style.display = 'flex';
    }
  });

  // Dar tiempo al SDK para procesar el hash/code del magic link antes de getSession
  await new Promise(r => setTimeout(r, 300));

  const { data: { session } } = await sbClient.auth.getSession();
  if (session && session.user) {
    await _handleSession(session);
  } else {
    // Sin sesión activa — mostrar profile picker directamente
    const localUser = localStorage.getItem(LS_ACTIVE_USER);
    if (localUser) {
      loginScreen.style.display = 'none';
      startApp();
    } else {
      // Mostrar profile picker como landing (no login wall)
      loginScreen.style.display = 'none';
      startApp(); // carga datos primero
    }
  }
}

function showSbMsg(text, color) {
  const el = document.getElementById('sb-login-msg');
  if (el) { el.textContent = text; el.style.color = color || 'var(--text2)'; }
}

export async function sendMagicLink() {
  const sbClient = getSbClient();
  const email = (document.getElementById('sb-email-input').value || '').trim();
  const btn   = document.getElementById('sb-login-btn');
  if (!email) { showSbMsg('Ingresá tu email.', 'var(--orange)'); return; }
  if (!email.endsWith('@db1.com.br')) {
    showSbMsg('❌ Solo se permiten correos @db1.com.br', 'var(--red)'); return;
  }
  btn.disabled = true; btn.textContent = 'Enviando...'; showSbMsg('', '');
  try {
    const { error } = await sbClient.auth.signInWithOtp({
      email, options: { emailRedirectTo: 'https://cs-dashboard-phi-three.vercel.app' }
    });
    if (error) throw error;
    showSbMsg('✉️ ¡Listo! Revisá tu bandeja de entrada y hacé clic en el link que te enviamos a ' + email + '.', 'var(--green)');
    btn.textContent = 'Reenviar link';
  } catch(e) {
    showSbMsg('❌ ' + (e.message || 'Error al enviar. Intenta nuevamente.'), 'var(--red)');
    btn.textContent = '✨ Ingresar con link mágico';
  }
  btn.disabled = false;
}

async function pullFromSupabase() {
  const sbClient = getSbClient();
  if (!sbClient || !sbUser) return;
  try {
    const { data } = await sbClient.from('cs_storage')
      .select('store_key, store_value')
      .eq('user_id', sbUser.id);
    if (data && data.length > 0) {
      data.forEach(row => {
        const val = typeof row.store_value === 'string'
          ? row.store_value : JSON.stringify(row.store_value);
        localStorage.setItem(row.store_key, val);
      });
    }
  } catch(e) { console.warn('Error leyendo Supabase:', e); }
}

export async function sbLogout() {
  const sbClient = getSbClient();
  if (sbClient) await sbClient.auth.signOut();
  sbUser = null; _appStarted = false;
  localStorage.removeItem(LS_ACTIVE_USER);
  const loginScreen = document.getElementById('sb-login-screen');
  loginScreen.style.display = 'flex';
  showSbMsg('Sesión cerrada. ¡Hasta pronto!', 'var(--green)');
}

// ── PROFILE PICKER ─────────────────────────────────────────────────────────────
// (index.html:4643-4712, "PROFILE PICKER & USER MANAGEMENT" — profile-picker half)
export function showProfilePicker() {
  const users = loadUsers();
  const cards = document.getElementById('profile-cards');
  if (!cards) return;
  cards.innerHTML = users.map(u => `
    <div onclick="selectProfile('${u.id}')" style="
      background:#252840; border:2px solid #2e3250; border-radius:12px;
      padding:20px 24px; cursor:pointer; min-width:140px; transition:all .2s;
      display:flex; flex-direction:column; align-items:center; gap:8px;
    " onmouseover="this.style.borderColor='${u.color}'" onmouseout="this.style.borderColor='#2e3250'">
      <div style="width:52px;height:52px;border-radius:50%;background:${u.color}22;border:2px solid ${u.color};display:flex;align-items:center;justify-content:center;font-size:${u.icon?'26px':'16px'};font-weight:${u.icon?'400':'700'};color:${u.color};">
        ${u.icon || u.initials}
      </div>
      <div style="color:#e8eaf6;font-weight:600;font-size:14px;">${u.name.split(' ')[0]}</div>
      <div style="color:#8892b0;font-size:11px;">${u.team}</div>
      <div style="color:#4a5578;font-size:10px;text-transform:uppercase;letter-spacing:.5px;">${u.role==='superadmin'?'⭐ Super Admin':u.role==='director'?'👑 Director':u.role==='viewer'?'👁 Viewer':'👤 CSM'}</div>
    </div>
  `).join('');
  const picker = document.getElementById('profile-picker');
  if (picker) { picker.style.display = 'flex'; }
}

export function selectProfile(userId) {
  setActiveUser(userId);
  const picker = document.getElementById('profile-picker');
  if (picker) picker.style.display = 'none';
  setClients([]);
  setActions([]);
  resetLoadGuard(); // allow load() to actually re-read data for the new profile
  load();
  renderKPIs();
  renderOverview();
  updateUserBadge();
  applyReadOnlyMode();
}

// exposed for inline HTML handlers (confirmed via grep of the whole source for
// onclick="sendMagicLink|sbLogout|logoutUser|selectProfile" — showProfilePicker
// and updateUserBadge/applyReadOnlyMode are only ever called as direct JS
// invocations, never from inline onclick strings, so they do not need
// window-attachment).
window.sendMagicLink = sendMagicLink;
window.sbLogout = sbLogout;
window.selectProfile = selectProfile;

export function logoutUser() {
  localStorage.removeItem(LS_ACTIVE_USER);
  setClients([]);
  setActions([]);
  resetLoadGuard();
  showProfilePicker();
}
window.logoutUser = logoutUser;
