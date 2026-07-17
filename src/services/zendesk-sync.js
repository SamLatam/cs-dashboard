// ── ZENDESK AUTO-SYNC (+ legacy dead "AUTO-FETCH API" config modal) ───────────
// Mechanically extracted from index.html (verbatim behavior), index.html:1391-1623
// ("── ZENDESK AUTO-SYNC ──" block) plus the older, superseded
// "── AUTO-FETCH API ──" block (index.html:2799-2877) which the task
// explicitly asked to preserve (openCfgModal/closeCfgModal reference a
// #cfgModal element that does not exist anywhere in the DOM — confirmed by
// grepping the whole file for 'cfgModal': only the 2 JS references inside
// these dead functions, zero HTML markup matches).
//
// This is a REAL, working feature (calls a same-origin /api/zendesk proxy with
// an x-zd-auth header — confirmed below in testZendeskConnection/syncZendesk),
// not to be confused with the older dead getCfg/saveCfg/autoFetchAll/
// fetchZendeskTickets/openCfgModal/closeCfgModal chain included at the bottom
// of this file for completeness (openCfgModal calls getCfg(), saveCfgModal
// calls saveCfg()+autoFetchAll() — all needed together for the dead code to be
// self-contained, even though the task only explicitly named
// openCfgModal/closeCfgModal).
//
// PRESERVED BUG (do not fix, per extraction rules): autoFetchAll() IS wired to
// a live button (onclick="autoFetchAll(false)", index.html:2982) and IS called
// on a 30-min interval from startApp() (index.html:5394-5395) — so despite
// looking like dead code, autoFetchAll()/fetchZendeskTickets() actually run in
// production today, in parallel with (and independently of) the real
// ZD_EMAIL_KEY/ZD_TOKEN_KEY sync below. It uses a separate, older credential
// store (LS_CONFIG / getCfg()/saveCfg()), which openCfgModal's dead #cfgModal
// UI was supposed to let a user configure but can't (the modal doesn't exist),
// so in practice cfg.zdEmail/cfg.zdToken are permanently empty and
// autoFetchAll() silently no-ops every 30 minutes forever. Kept exactly as-is.
//
// ASSUMPTIONS about other modules' exports (unverified at write time — flagged
// for the integration pass):
//   - lib/dom.js exports: showToast (confirmed by reading it — this file's
//     showToast, index.html:2856, is the SAME function body as lib/dom.js's,
//     not a duplicate definition; verified by diffing the two — so it is
//     imported here rather than redefined).
//   - clients-repo.js exports: PORT, getClients, setClients, saveData
//     (confirmed by reading it).
//   - ui/kpis.js exports: renderKPIs (confirmed — already built).
//   - ui/overview.js exports: renderOverviewRisk (confirmed — already built,
//     exported from that file).
//   - ui/catalogo.js exports: renderCatalogo (confirmed — already built).
//   - ui/overview.js exports: renderTable too (confirmed by reading its export
//     list — index.html:3135's renderTable ended up implemented inside
//     ui/overview.js, not a separate portfolio-a.js file as this agent
//     initially guessed elsewhere; corrected here to the real path).
import { showToast } from '../lib/dom.js';
import { PORT, getClients, setClients, saveData } from './clients-repo.js';
import { renderKPIs } from '../ui/kpis.js';
import { renderOverview, renderOverviewRisk, renderTable } from '../ui/overview.js';
import { renderCatalogo } from '../ui/catalogo.js';

export const ZD_EMAIL_KEY = 'zd-email';
export const ZD_TOKEN_KEY = 'zd-token';
export const ZD_LAST_SYNC_KEY = 'zd-last-sync';
export const ZD_BASE = 'https://db1globalsoftwaresupport.zendesk.com';

export function openZdSetup() {
  const overlay = document.getElementById('zd-setup-overlay');
  if (!overlay) return;
  document.getElementById('zd-email-input').value = localStorage.getItem(ZD_EMAIL_KEY) || '';
  document.getElementById('zd-token-input').value = localStorage.getItem(ZD_TOKEN_KEY) || '';
  const savedMode = localStorage.getItem('cs-zd-mode') || 'token';
  zdSetMode(savedMode);
  const last = localStorage.getItem(ZD_LAST_SYNC_KEY);
  const lastEl = document.getElementById('zd-last-sync-label');
  if (lastEl) lastEl.textContent = last ? 'Última sync: ' + last : 'Nunca sincronizado';
  overlay.style.display = 'flex';
}

export function closeZdSetup() {
  const overlay = document.getElementById('zd-setup-overlay');
  if (overlay) overlay.style.display = 'none';
}

export async function saveZdCredsAndSync() {
  const email = document.getElementById('zd-email-input').value.trim();
  const token = document.getElementById('zd-token-input').value.trim();
  if (!email || !token) { alert('Ingresá tu email y ' + (_zdMode==='token'?'API Token':'contraseña')); return; }
  localStorage.setItem(ZD_EMAIL_KEY, email);
  localStorage.setItem(ZD_TOKEN_KEY, token);
  localStorage.setItem('cs-zd-mode', _zdMode);
  closeZdSetup();
  await syncZendesk(true);
}

export function zdNorm(s) {
  return (s || '').toUpperCase()
    .replace(/\s+(S\.?A\.?C?\.?|LTDA\.?|SPA\.?|S\/A|DE\s+C\.V\.?|S\.A\.S\.?|INC\.?|CORP\.?)\b/g, '')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchZdOrg(zdOrgName) {
  const zn = zdNorm(zdOrgName);
  if (!zn) return [];
  const candidates = [];
  for (const c of PORT) {
    const cn = zdNorm(c.name);
    if (cn === zn || cn.includes(zn) || zn.includes(cn)) {
      candidates.push(c.id);
    }
  }
  return candidates;
}

// Zendesk auth mode: 'token' (API Token, default) or 'pwd' (native password)
export let _zdMode = 'token';

export function zdSetMode(mode) {
  _zdMode = mode;
  const tokBtn = document.getElementById('zd-mode-token');
  const pwdBtn = document.getElementById('zd-mode-pwd');
  const lbl    = document.getElementById('zd-pwd-label');
  const inp    = document.getElementById('zd-token-input');
  if (mode === 'token') {
    if(tokBtn){ tokBtn.style.borderColor='var(--accent)'; tokBtn.style.background='rgba(99,102,241,.12)'; tokBtn.style.color='var(--accent)'; }
    if(pwdBtn){ pwdBtn.style.borderColor='var(--border)'; pwdBtn.style.background='var(--surface2)'; pwdBtn.style.color='var(--text3)'; }
    if(lbl)   lbl.innerHTML = 'API Token <span style="font-weight:400;color:var(--text3)">— generado por un admin de Zendesk</span>';
    if(inp)   inp.placeholder = 'Pegá el API Token aquí';
  } else {
    if(pwdBtn){ pwdBtn.style.borderColor='var(--accent)'; pwdBtn.style.background='rgba(99,102,241,.12)'; pwdBtn.style.color='var(--accent)'; }
    if(tokBtn){ tokBtn.style.borderColor='var(--border)'; tokBtn.style.background='var(--surface2)'; tokBtn.style.color='var(--text3)'; }
    if(lbl)   lbl.innerHTML = 'Contraseña <span style="font-weight:400;color:var(--text3)">— contraseña nativa de Zendesk (no SSO)</span>';
    if(inp)   inp.placeholder = 'Tu contraseña de Zendesk';
  }
}

export function buildZdAuth(email, secret) {
  if (_zdMode === 'token') {
    return btoa(email + '/token:' + secret);
  }
  return btoa(email + ':' + secret);
}

export async function testZendeskConnection() {
  const email  = document.getElementById('zd-email-input').value.trim();
  const secret = document.getElementById('zd-token-input').value.trim();
  const res_el = document.getElementById('zd-test-result');
  if (!res_el) return;

  function showResult(type, msg) {
    res_el.style.display = 'block';
    const colors = {
      loading: ['rgba(99,102,241,.1)','rgba(99,102,241,.25)','var(--text2)'],
      ok:      ['rgba(46,204,113,.12)','rgba(46,204,113,.3)','var(--green)'],
      warn:    ['rgba(243,156,18,.1)','rgba(243,156,18,.3)','var(--yellow)'],
      err:     ['rgba(231,76,60,.12)','rgba(231,76,60,.3)','var(--red)'],
    };
    const [bg,bd,col] = colors[type] || colors.err;
    res_el.style.background = bg;
    res_el.style.border = '1px solid ' + bd;
    res_el.style.color = col;
    res_el.textContent = msg;
  }

  if (!email || !secret) { showResult('err', '⚠️ Ingresá email y ' + (_zdMode==='token'?'API Token':'contraseña') + ' primero'); return; }
  showResult('loading', '⏳ Probando conexión…');
  try {
    const auth = buildZdAuth(email, secret);
    const r = await fetch('/api/zendesk?path=/api/v2/users/me.json', { headers: { 'x-zd-auth': auth } });
    if (r.ok) {
      const data = await r.json();
      showResult('ok', '✅ Conexión exitosa — ' + (data.user?.name || email) + ' · Listo para sincronizar');
    } else if (r.status === 401) {
      showResult('err', '❌ Credenciales incorrectas (401). ' + (_zdMode==='token' ? 'Verificá que el API Token sea correcto.' : 'Verificá tu contraseña nativa de Zendesk.'));
    } else if (r.status === 403) {
      showResult('warn', '⚠️ Autenticado pero sin permiso API (403). Tu rol Agente Light puede necesitar permisos adicionales — consultá a IT.');
    } else if (r.status === 404) {
      showResult('err', '❌ Error 404 — ' + (_zdMode==='token' ? 'API Token inválido o cuenta no encontrada. Verificá que el token esté activo en Admin Center.' : 'Cuenta no encontrada. Tu cuenta DB1 usa SSO — usá el modo API Token.'));
    } else {
      showResult('err', '❌ Error HTTP ' + r.status + ' — intentá de nuevo');
    }
  } catch(e) {
    showResult('err', '❌ ' + e.message);
  }
}

export async function syncZendesk(showFeedback) {
  const email = localStorage.getItem(ZD_EMAIL_KEY);
  const token = localStorage.getItem(ZD_TOKEN_KEY);
  if (!email || !token) return;

  const btn = document.getElementById('zd-sync-btn');
  if (btn) { btn.textContent = '🔄 Sincronizando...'; btn.disabled = true; }

  try {
    const auth = buildZdAuth(email, token);
    const proxy = '/api/zendesk';
    const proxyHeaders = { 'x-zd-auth': auth };

    // 1. Fetch open tickets via proxy (evita CORS)
    let allTickets = [];
    let nextPage = null;
    for (let page = 0; page < 2; page++) {
      const url = nextPage
        ? proxy + '?next_page=' + encodeURIComponent(nextPage)
        : proxy + '?q=status%3Aopen%20type%3Aticket&per_page=100';
      const res = await fetch(url, { headers: proxyHeaders });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Credenciales incorrectas (401). Verificá tu email y contraseña en el ícono 🎫.');
        if (res.status === 403) throw new Error('Sin permiso (403). Tu rol Agente Light puede no tener acceso API. Consultá a IT.');
        if (res.status === 404) throw new Error('Error 404 — Credenciales no reconocidas. Si tu cuenta usa SSO/Azure AD, la contraseña de Zendesk puede diferir. Contactá a IT para generar un API Token.');
        throw new Error('Zendesk HTTP ' + res.status);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error + (data.description ? ': ' + data.description : ''));
      allTickets = allTickets.concat(data.results || []);
      nextPage = data.next_page || null;
      if (!nextPage) break;
    }

    // 2. Fetch organizations via proxy
    const orgRes = await fetch(proxy + '?path=/api/v2/organizations.json&per_page=100', { headers: proxyHeaders });
    const orgData = await orgRes.json();
    const orgMap = {};
    (orgData.organizations || []).forEach(function(o) { orgMap[o.id] = o.name; });

    // 3. Group tickets by org
    const ticketsByOrg = {};
    allTickets.forEach(function(t) {
      const oid = t.organization_id;
      if (!ticketsByOrg[oid]) ticketsByOrg[oid] = [];
      ticketsByOrg[oid].push(t);
    });

    // 4. Update clients
    // INTEGRATION TODO: original reassigns the module-level global directly
    // (`clients = clients.map(...)`); routed through getClients()/setClients()
    // here since `clients` is now private state owned by clients-repo.js
    // (confirmed by reading it) — same mechanical deviation already applied by
    // src/services/import-export.js for the same reason (see that file's own
    // header comment).
    let updatedCount = 0;
    setClients(getClients().map(function(c) {
      const matchedOrgIds = Object.keys(ticketsByOrg).filter(function(oid) {
        const orgName = orgMap[oid] || '';
        return matchZdOrg(orgName).includes(c.id);
      });
      if (!matchedOrgIds.length) return c;

      const clientTickets = matchedOrgIds.reduce(function(acc, oid) {
        return acc.concat(ticketsByOrg[oid] || []);
      }, []);

      const open = clientTickets.length;
      const bugs = clientTickets.filter(function(t) {
        return (t.tags || []).some(function(tag) { return ['bug','incident','incidente','error'].includes(tag); }) ||
          t.type === 'problem' ||
          /\b(bug|error|falla|caída|crash)\b/i.test(t.subject || '');
      }).length;
      const pending = clientTickets.filter(function(t) { return t.status === 'pending'; }).length;

      const sorted = clientTickets.slice().sort(function(a,b) {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      const topDetail = sorted.slice(0, 2).map(function(t) {
        return '#' + t.id + ' - ' + (t.subject || '').slice(0, 55);
      }).join(' | ');

      updatedCount++;
      return Object.assign({}, c, {
        weekly: Object.assign({}, c.weekly, {
          tickets: open,
          bugs: bugs,
          ticketsPendientes: pending,
          ticketDetalle: topDetail || null
        })
      });
    }));

    const now = new Date().toLocaleString('es-CL', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'});
    localStorage.setItem(ZD_LAST_SYNC_KEY, now);
    // PRESERVED BUG (do not fix, per extraction rules): the source calls a bare
    // `save();` here (index.html:1608) but no function named `save` is defined
    // ANYWHERE in the 7489-line source file — grepped the whole file for
    // `function save(`/`save =`/`window.save`, zero matches. This has always
    // been a ReferenceError at runtime, silently caught by the catch(e) block
    // below, which means the renderKPIs()/renderTable()/renderOverviewRisk()
    // calls that follow it in the source NEVER actually execute — every real
    // sync ends up in the `❌ ZD Error` / `Error Zendesk: save is not defined`
    // path instead of the success path, even though the ticket counts were
    // correctly computed into `clients` above. Left exactly as broken: the
    // literal `save();` call below is intentionally NOT wired to
    // saveData()/any other function.
    save();
    renderKPIs();
    try { renderTable(); } catch(e) {}
    try { renderOverviewRisk(); } catch(e) {}

    if (btn) { btn.textContent = '✅ ZD ' + now.slice(0,5); btn.disabled = false; }
    if (showFeedback) {
      alert('✅ Zendesk sincronizado\n' + allTickets.length + ' tickets encontrados\n' + updatedCount + ' clientes actualizados\nÚltima sync: ' + now);
    }
  } catch(e) {
    if (btn) { btn.textContent = '❌ ZD Error'; btn.disabled = false; }
    if (showFeedback) alert('Error Zendesk: ' + e.message);
    console.error('Zendesk sync error:', e);
  }
}
// ── END ZENDESK AUTO-SYNC ─────────────────────────────────────────────────────

// exposed for inline HTML handlers (confirmed via grep of the whole source for
// onclick="openZdSetup|closeZdSetup|saveZdCredsAndSync|testZendeskConnection|
// zdSetMode" on the Zendesk 🎫 setup modal/topbar button).
window.openZdSetup = openZdSetup;
window.closeZdSetup = closeZdSetup;
window.saveZdCredsAndSync = saveZdCredsAndSync;
window.testZendeskConnection = testZendeskConnection;
window.zdSetMode = zdSetMode;

// ── AUTO-FETCH API (legacy, superseded — see file header note) ───────────────
// index.html:2799-2877. LS_CONFIG/getCfg/saveCfg/autoFetchAll/fetchZendeskTickets
// are reachable in production (autoFetchAll is wired to a live button + a
// 30-min setInterval in startApp() — see file header), but openCfgModal/
// closeCfgModal/saveCfgModal are truly dead: they reference '#cfgModal', a DOM
// element that does not exist anywhere in index.html. Preserved verbatim.
export const LS_CONFIG = 'cs-v3-config';
export function getCfg() { try { return JSON.parse(localStorage.getItem(LS_CONFIG)||'{}'); } catch(e) { return {}; } }
export function saveCfg(c) { localStorage.setItem(LS_CONFIG, JSON.stringify(c)); }

// Exported as a live binding — src/ui/catalogo.js reads the current value to
// show "última sync" (reassigned below in autoFetchAll()).
export let lastZdFetch = null;

export async function autoFetchAll(silent) {
  const cfg = getCfg();
  const hasZD = cfg.zdEmail && cfg.zdToken;
  if (!hasZD) { if (!silent) showToast('Configurá las credenciales primero', 'orange'); return; }
  if (!silent) showToast('Actualizando desde Zendesk…', 'accent');
  try {
    await fetchZendeskTickets(cfg);
    lastZdFetch = new Date();
    saveData(new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'}));
    renderKPIs(); renderOverview();
    if (document.getElementById('page-catalogo').classList.contains('active')) renderCatalogo();
    if (!silent) showToast('✅ Zendesk actualizado', 'green');
  } catch(e) {
    if (!silent) showToast('❌ Error: ' + e.message, 'red');
  }
}

export async function fetchZendeskTickets(cfg) {
  const auth = btoa(cfg.zdEmail + '/token:' + cfg.zdToken);
  const headers = { 'Authorization': 'Basic ' + auth };
  // Traer tickets abiertos
  const r = await fetch('https://db1globalsoftwaresupport.zendesk.com/api/v2/search.json?query=status:open+type:ticket&per_page=100&sort_by=updated_at&sort_order=desc', { headers });
  if (!r.ok) throw new Error('Zendesk ' + r.status + ' — verificá email/token');
  const data = await r.json();
  const tickets = data.results || [];

  // INTEGRATION TODO: original mutates the module-level global `clients` array
  // (and its element objects) directly and in place — same mechanical
  // deviation as syncZendesk() above, routed through getClients() (mutating
  // objects found in the live array in place does not require setClients()
  // since the array reference itself is not replaced here, only its elements'
  // properties — unlike syncZendesk()'s `clients.map(...)` reassignment above).
  const clients = getClients();

  // Reset contadores
  clients.forEach(c => { if (!c.weekly) c.weekly = {}; c.weekly.tickets = 0; c.weekly.bugs = 0; c.weekly.ticketsPendientes = 0; c.weekly.ticketDetalle = null; });

  tickets.forEach(t => {
    const subj = (t.subject||'').toLowerCase();
    const org  = (t.organization_id ? String(t.organization_id) : '');
    // Buscar cliente por nombre en el asunto del ticket
    clients.forEach(c => {
      const nm = c.name.toLowerCase().replace(/[^a-z0-9 ]/g,'');
      const keywords = nm.split(' ').filter(w=>w.length>3);
      if (keywords.some(k => subj.includes(k))) {
        if (!c.weekly) c.weekly = {};
        c.weekly.tickets = (c.weekly.tickets||0) + 1;
        if ((t.type||'').toLowerCase()==='bug'||(t.tags||[]).includes('bug')) c.weekly.bugs = (c.weekly.bugs||0)+1;
        if (t.status==='pending'||t.status==='open') c.weekly.ticketsPendientes = (c.weekly.ticketsPendientes||0)+1;
        if (!c.weekly.ticketDetalle) {
          const dias = Math.round((Date.now()-new Date(t.created_at))/86400000);
          c.weekly.ticketDetalle = `#${t.id} — ${t.subject} (${dias}d abierto)`;
        }
      }
    });
  });
}

// index.html:2865-2876 — dead: '#cfgModal' does not exist anywhere in the DOM.
export function openCfgModal() {
  const cfg = getCfg();
  document.getElementById('cfgEmail').value = cfg.zdEmail || '';
  document.getElementById('cfgToken').value = cfg.zdToken || '';
  document.getElementById('cfgModal').classList.add('open');
}
export function closeCfgModal() { document.getElementById('cfgModal').classList.remove('open'); }
export function saveCfgModal() {
  const cfg = { zdEmail: document.getElementById('cfgEmail').value.trim(), zdToken: document.getElementById('cfgToken').value.trim() };
  saveCfg(cfg);
  closeCfgModal();
  autoFetchAll(false);
}

// exposed for inline HTML handlers (confirmed via grep: onclick="autoFetchAll(false)"
// and onclick="openCfgModal()" both appear on real, rendered buttons —
// index.html:2982-2983 — even though invoking openCfgModal() throws at runtime
// since '#cfgModal' doesn't exist; closeCfgModal/saveCfgModal are not
// reachable from any onclick="" in the DOM, since the modal that would contain
// them is itself never rendered, but are window-attached anyway for parity).
window.autoFetchAll = autoFetchAll;
window.openCfgModal = openCfgModal;
window.closeCfgModal = closeCfgModal;
window.saveCfgModal = saveCfgModal;
