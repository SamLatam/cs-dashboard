// ── AUTO-FETCH API ─────────────────────────────────────────────────────────────
// RECONCILED: autoFetchAll() calls saveData()/renderKPIs()/renderOverview()/renderCatalogo() —
// resolved to real imports from their owning modules (confirmed by reading each file directly).
import { getClients, saveData } from '../services/clients-repo.js';
import { showToast } from '../lib/dom.js';
import { renderKPIs } from '../ui/kpis.js';
import { renderOverview } from '../ui/overview.js';
import { renderCatalogo } from '../ui/catalogo.js';

export const LS_CONFIG = 'cs-v3-config';
export function getCfg() { try { return JSON.parse(localStorage.getItem(LS_CONFIG)||'{}'); } catch(e) { return {}; } }
export function saveCfg(c) { localStorage.setItem(LS_CONFIG, JSON.stringify(c)); }

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

// KNOWN-BROKEN LEGACY CODE (preserved as-is, not fixed): fetches directly from
// db1globalsoftwaresupport.zendesk.com from the browser — this call is doomed by CORS
// in production and was never functional as shipped. Out of scope for this refactor.
async function fetchZendeskTickets(cfg) {
  const clients = getClients();
  const auth = btoa(cfg.zdEmail + '/token:' + cfg.zdToken);
  const headers = { 'Authorization': 'Basic ' + auth };
  // Traer tickets abiertos
  const r = await fetch('https://db1globalsoftwaresupport.zendesk.com/api/v2/search.json?query=status:open+type:ticket&per_page=100&sort_by=updated_at&sort_order=desc', { headers });
  if (!r.ok) throw new Error('Zendesk ' + r.status + ' — verificá email/token');
  const data = await r.json();
  const tickets = data.results || [];

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

// KNOWN DEAD REFERENCE (preserve, don't fix): references document.getElementById('cfgModal')
// which does NOT exist anywhere in the static HTML — clicking "⚙️ Configurar API Zendesk"
// would throw. Pre-existing bug, out of scope for this refactor.
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

// exposed for inline HTML handlers
window.openCfgModal = openCfgModal;
window.closeCfgModal = closeCfgModal;
window.saveCfgModal = saveCfgModal;
window.autoFetchAll = autoFetchAll;
