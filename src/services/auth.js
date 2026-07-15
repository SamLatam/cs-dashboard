import { getSbClient } from '../lib/supabase-client.js';
import { setActiveUser, loadUsers, applyReadOnlyMode } from './profiles-repo.js';
import { updateUserBadge } from '../ui/auth-screen.js';
import { setClients, resetLoadGuard, load } from './clients-repo.js';
import { setActions } from './actions-repo.js';
import { renderKPIs } from '../ui/kpis.js';
import { renderOverview } from '../ui/overview.js';
// NOTE: circular import — startApp() is only invoked from inside async callbacks / event
// handlers below (never at module evaluation time), so this is safe with Vite/ESM.
// TODO(integration): startApp was not assigned an explicit file+path in this agent's task,
// and no sibling module exports it yet (confirmed via a repo-wide search) — assuming it
// will live in main.js as the app's boot/composition root. Reconcile once confirmed.
import { startApp } from '../main.js';

let sbUser   = null;
let _appStarted = false;

async function _handleSession(session) {
  const loginScreen = document.getElementById('sb-login-screen');
  if (!session || !session.user) return false;
  if (!session.user.email.endsWith('@db1.com.br')) {
    await getSbClient().auth.signOut();
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
  const loginScreen = document.getElementById('sb-login-screen');
  if (!getSbClient()) { startApp(); return; }

  // Escuchar TODOS los eventos de autenticación relevantes
  getSbClient().auth.onAuthStateChange(async (event, session) => {
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

  const { data: { session } } = await getSbClient().auth.getSession();
  if (session && session.user) {
    await _handleSession(session);
  } else {
    // Sin sesión activa — mostrar profile picker directamente
    const localUser = localStorage.getItem('cs-v3-active-user');
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
  const email = (document.getElementById('sb-email-input').value || '').trim();
  const btn   = document.getElementById('sb-login-btn');
  if (!email) { showSbMsg('Ingresá tu email.', 'var(--orange)'); return; }
  if (!email.endsWith('@db1.com.br')) {
    showSbMsg('❌ Solo se permiten correos @db1.com.br', 'var(--red)'); return;
  }
  btn.disabled = true; btn.textContent = 'Enviando...'; showSbMsg('', '');
  try {
    const { error } = await getSbClient().auth.signInWithOtp({
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

export async function pullFromSupabase() {
  if (!getSbClient() || !sbUser) return;
  try {
    const { data } = await getSbClient().from('cs_storage')
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

export async function pushToSupabase(key, rawValue) {
  if (!getSbClient() || !sbUser) return;
  try {
    let parsed;
    try { parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue; }
    catch(e) { parsed = rawValue; }
    await getSbClient().from('cs_storage').upsert({
      user_id: sbUser.id,
      store_key: key,
      store_value: parsed,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,store_key' });
  } catch(e) { /* silent — datos siguen en localStorage */ }
}

export async function sbLogout() {
  if (getSbClient()) await getSbClient().auth.signOut();
  sbUser = null; _appStarted = false;
  localStorage.removeItem('cs-v3-active-user');
  const loginScreen = document.getElementById('sb-login-screen');
  loginScreen.style.display = 'flex';
  showSbMsg('Sesión cerrada. ¡Hasta pronto!', 'var(--green)');
}

// ── PROFILE PICKER & USER MANAGEMENT ──────────────────────────────────────
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
  resetLoadGuard();
  setClients([]);
  setActions([]);
  load();
  renderKPIs();
  renderOverview();
  updateUserBadge();
  applyReadOnlyMode();
}

// NOTE: `logoutUser` was not explicitly assigned to any file in this agent's task list.
// Placed here (not profiles-repo.js) because it is part of the login/logout session flow
// alongside showProfilePicker/selectProfile, which the task explicitly assigned to auth.js.
// Flag for reconciliation if another agent already placed it elsewhere.
export function logoutUser() {
  localStorage.removeItem('cs-v3-active-user');
  resetLoadGuard();
  setClients([]);
  setActions([]);
  showProfilePicker();
}

// exposed for inline HTML handlers
window.sendMagicLink = sendMagicLink;
window.sbLogout = sbLogout;
window.logoutUser = logoutUser;
window.selectProfile = selectProfile;
