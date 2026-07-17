// Extracted from index.html — processImport(): lines ~4094-4127.
// exportarJSON(): lines ~4152-4170.
//
// This is the single most behavior-sensitive function in the app (it's how the
// weekly data update actually lands). Every field-mapping rule and null-handling
// rule from the source is preserved exactly. Unlike a pure mechanical extract,
// this file was explicitly asked to route storage access through sibling repo
// modules (clients-repo.js / actions-repo.js / history-repo.js) instead of
// touching localStorage/globals directly, since those files did not exist yet
// at the time of writing. Every such call site has an `// INTEGRATION TODO:`
// comment describing exactly what was assumed, for the final integration pass
// to verify/fix.
//
// INTEGRATION TODO: assumed getClients()/setClients(clients, updatedAt) live in
// '../services/clients-repo.js'. In the original source, the global `clients`
// array was mutated in place and persisted via `saveData(dt)` (index.html:2715),
// which did: localStorage.setItem(LS_DATA, JSON.stringify({clients, updatedAt:
// dt, seedVersion: SEED_VERSION})) + pushToSupabase(LS_DATA, val) +
// scheduleGistSave(). setClients() is assumed to reproduce all of that.
import {
  getClients, setClients, setUpdateLabel, saveData, PORT, fromSeed,
  LS_DATA
} from '../services/clients-repo.js';
import { getActions, setActions, seedActions, LS_ACTIONS } from '../services/actions-repo.js';
import { appendHistorySnapshot } from '../services/history-repo.js';
import { calcHS } from '../domain/health-score.js';
import { getMRR, getRenewal } from '../domain/renewal-revenue.js';
import { norm, today, daysSince, daysUntil, fmtG } from '../lib/format.js';
import { renderKPIs } from '../ui/kpis.js';
import { renderOverview } from '../ui/overview.js';

// ── IMPORT MODAL (index.html:4091-4093) ─────────────────────────────────────────
function openImport(){
  document.getElementById('importTA').value='';
  document.getElementById('importResult').className='import-result';
  document.getElementById('importOverlay').classList.add('open');
}
function closeImport(e){ if(e.target===document.getElementById('importOverlay')) closeImportModal(); }
function closeImportModal(){ document.getElementById('importOverlay').classList.remove('open'); }

// ── IMPORT ─────────────────────────────────────────────────────────────────────
function processImport(){
  const raw=document.getElementById('importTA').value.trim();
  const res=document.getElementById('importResult');
  if(!raw){res.className='import-result err';res.textContent='Pegá el JSON antes de importar.';return;}
  try{
    const parsed=JSON.parse(raw);
    // Formato nuevo: { clientes: [...], acciones: [...] }
    // Formato viejo: [ ... ] (solo array de clientes)
    const arr = Array.isArray(parsed) ? parsed : (parsed.clientes || []);
    const importedActions = !Array.isArray(parsed) && Array.isArray(parsed.acciones) ? parsed.acciones : null;
    if(!Array.isArray(arr))throw new Error('Formato JSON inválido');

    // INTEGRATION TODO: assumed getClients() returns the same live array of
    // client objects the original global `clients` referred to (each with
    // .id/.name/.weekly/.centry), so mutating entries in place and then calling
    // setClients() persists them — matching the original's direct mutation of
    // the global `clients` array.
    const clients = getClients();
    let upd=0;arr.forEach(e=>{const c=clients.find(x=>norm(x.name)===norm(e.nombre||''));if(c){const delta=Object.fromEntries(Object.entries(e).filter(([,v])=>v!==null&&v!==undefined));c.weekly={...(c.weekly||{}),...delta};upd++;}});
    // Restaurar acciones si vienen en el JSON
    let accionesMsg = '';
    if(importedActions && importedActions.length > 0){
      // INTEGRATION TODO: assumed setActions(arr) fully replaces the actions
      // list (equivalent to the original `actions = importedActions;
      // saveActions();`), including saveActions()'s role-based persistence.
      setActions(importedActions);
      accionesMsg = ` · ${importedActions.length} acciones restauradas`;
    }
    const now=new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'});
    setClients(clients);
    saveData(now);
    // Guardar snapshot histórico
    try {
      const snap = { date: today(), scores: {}, tix: {} };
      clients.forEach(c => { const h = calcHS(c); if (h.score != null) snap.scores[c.id] = h.score; if ((c.weekly?.tickets ?? null) !== null) snap.tix[c.id] = c.weekly.tickets; });
      // INTEGRATION TODO: assumed appendHistorySnapshot(snap) pushes `snap`
      // into the LS_HISTORY array and caps it at the last 12 entries, exactly
      // like the original inline try/catch block (index.html:4116-4123).
      appendHistorySnapshot(snap);
    } catch(e) {}
    setUpdateLabel(now);renderKPIs();renderOverview();
    res.className='import-result ok';res.textContent=`✅ Importado: ${upd} clientes actualizados al ${now}${accionesMsg}.`;
  }catch(e){res.className='import-result err';res.textContent='❌ Error: '+e.message;}
}

function exportarJSON() {
  // INTEGRATION TODO: assumed getClients()/getActions() return the current
  // in-memory state equivalent to the original global `clients`/`actions`.
  const clients = getClients();
  const actions = getActions();
  const data = clients.map(c => {
    const w = c.weekly || {};
    return {
      nombre: c.name, tickets: w.tickets ?? null, bugs: w.bugs ?? null,
      ticketsPendientes: w.ticketsPendientes ?? null,
      ticketDetalle: w.ticketDetalle ?? null, causaRaiz: w.causaRaiz ?? null,
      prioridad: w.prioridad ?? null, tckFecha: w.tckFecha ?? null,
      gmv: w.gmv ?? null, upPlan: w.upPlan ?? null, qtUp: w.qtUp ?? null,
      nps: w.nps ?? null, lastContact: w.lastContact ?? null, centry: c.centry
    };
  });
  const exportObj = { clientes: data, acciones: actions };
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cs_data_' + today() + '.json';
  a.click();
}

// ── RESET (index.html:4128) ─────────────────────────────────────────────────────
function clearAllData(){
  if(!confirm('¿Resetear todos los datos?'))return;
  localStorage.removeItem(LS_DATA);
  localStorage.removeItem(LS_ACTIONS);
  setClients(fromSeed());
  setActions(seedActions());
  renderKPIs();renderOverview();closeImportModal();
}

// ── RESUMEN SEMANAL (index.html:4172-4278) ─────────────────────────────────────
function generarResumen() {
  const clients = getClients();
  const actions = getActions();
  const scores = clients.map(c => ({c, h: calcHS(c)}));
  const criticos = scores.filter(x => x.h.cl === 'red').map(x => x.c.name);
  const enRiesgo = scores.filter(x => x.h.cl === 'orange').map(x => x.c.name);
  const sanos = scores.filter(x => x.h.cl === 'green').length;
  const avgNPS = (() => { const v = clients.map(c => c.weekly?.nps).filter(n => n != null); return v.length ? Math.round(v.reduce((a,b) => a+b, 0)/v.length) : null; })();
  const topGMV = [...clients].filter(c => c.weekly?.gmv > 0).sort((a,b) => (b.weekly.gmv||0)-(a.weekly.gmv||0)).slice(0, 3);
  const actVencidas = actions.filter(a => a.status !== 'resuelto' && a.dueDate && new Date(a.dueDate) < new Date()).length;
  const actCriticas = actions.filter(a => a.status !== 'resuelto' && a.priority === 'critica').length;
  const totalTickets = clients.reduce((s,c) => s + (c.weekly?.tickets || 0), 0);

  // Revenue at Risk
  const mrrData = clients.map(c=>({c, mrr:getMRR(c.id), h:calcHS(c)})).filter(x=>x.mrr>0);
  const mrrTotal     = mrrData.reduce((s,x)=>s+x.mrr,0);
  const mrrAtRisk    = mrrData.filter(x=>x.h.cl==='orange'||x.h.cl==='yellow').reduce((s,x)=>s+x.mrr,0);
  const mrrCritico   = mrrData.filter(x=>x.h.cl==='red').reduce((s,x)=>s+x.mrr,0);
  // Renewal alerts
  const renewals30 = clients.filter(c=>{const r=getRenewal(c.id);return r&&daysUntil(r)<=30&&daysUntil(r)>=0;});
  const renewals60 = clients.filter(c=>{const r=getRenewal(c.id);return r&&daysUntil(r)>30&&daysUntil(r)<=60;});
  // Cadence
  const contactadosMes = clients.filter(c=>c.weekly?.lastContact&&daysSince(c.weekly.lastContact)<=30).length;
  const pctCadencia = Math.round(contactadosMes/clients.length*100);

  const fecha = new Date().toLocaleDateString('es-CL', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
  let txt = `📊 RESUMEN SEMANAL CS — ${fecha.toUpperCase()}\n`;
  txt += '═'.repeat(60) + '\n\n';
  txt += `📁 CARTERA: ${clients.length} clientes · ${[...new Set(clients.map(c=>c.country))].length} países\n\n`;
  txt += `🟢 Saludables: ${sanos} clientes\n`;
  if (enRiesgo.length) txt += `🟠 En riesgo (${enRiesgo.length}): ${enRiesgo.slice(0,5).join(', ')}${enRiesgo.length>5?' y más':''}\n`;
  if (criticos.length) txt += `🔴 CRÍTICOS (${criticos.length}): ${criticos.join(', ')}\n`;
  txt += '\n';
  if (avgNPS !== null) txt += `⭐ NPS Promedio cartera: ${avgNPS > 0 ? '+' : ''}${avgNPS}\n`;
  txt += `🎫 Tickets abiertos totales: ${totalTickets}\n`;
  if (actVencidas) txt += `⚠ Acciones VENCIDAS: ${actVencidas}\n`;
  if (actCriticas) txt += `🚨 Acciones críticas activas: ${actCriticas}\n`;
  txt += `\n📊 COBERTURA DE CADENCIA: ${pctCadencia}% de cartera contactada en últimos 30 días (${contactadosMes}/${clients.length})\n`;
  txt += '\n';
  if (mrrData.length > 0) {
    txt += `💰 REVENUE AT RISK:\n`;
    txt += `   MRR total cartera (con datos): USD ${mrrTotal.toLocaleString()}/mes\n`;
    if (mrrAtRisk)  txt += `   🟡 MRR en observación/riesgo: USD ${mrrAtRisk.toLocaleString()}/mes\n`;
    if (mrrCritico) txt += `   🔴 MRR crítico (acción urgente): $${mrrCritico.toLocaleString()} USD/mes\n`;
    txt += '\n';
  }
  if (renewals30.length) txt += `🔴 RENOVACIONES URGENTES (<30 días): ${renewals30.map(c=>c.name).join(', ')}\n`;
  if (renewals60.length) txt += `🟡 RENOVACIONES PRÓXIMAS (30-60 días): ${renewals60.map(c=>c.name).join(', ')}\n`;
  if (topGMV.length) {
    txt += `\n💎 TOP GMV:\n`;
    topGMV.forEach((c, i) => { txt += `   ${i+1}. ${c.name}: ${fmtG(c.weekly.gmv)}\n`; });
  }
  txt += '\n📌 Prioridades de acción:\n';
  criticos.forEach(n => { txt += `   → URGENTE: contactar ${n} (Health crítico)\n`; });
  if (renewals30.length) renewals30.forEach(c => { txt += `   → RENOVACIÓN en <30 días: ${c.name}\n`; });
  actions.filter(a => a.status !== 'resuelto' && a.dueDate && new Date(a.dueDate) < new Date()).slice(0, 3).forEach(a => {
    const cl = PORT.find(p => p.id === a.clientId);
    txt += `   → VENCIDA: "${a.title}" — ${cl?.name || a.clientId}\n`;
  });

  document.getElementById('resumenText').textContent = txt;
  document.getElementById('resumenBox').style.display = 'block';
  document.getElementById('resumenBox').scrollIntoView({behavior:'smooth'});
}

function copiarResumen() {
  const t = document.getElementById('resumenText').textContent;
  navigator.clipboard.writeText(t).then(() => {
    const b = document.querySelector('[onclick="copiarResumen()"]');
    const orig = b.textContent; b.textContent = '✅ Copiado';
    setTimeout(() => { b.textContent = orig; }, 2000);
  });
}

function copiarPromptClaude() {
  const clientList = PORT.map(p => `- ${p.name} (${p.country}${p.centry ? ', CENTRY' : ''})`).join('\n');
  const prompt = `Necesito que generes el JSON semanal para mi dashboard de Customer Success en AnyMarket LATAM.

Estos son mis clientes:
${clientList}

Para cada cliente necesito que me des un objeto JSON con esta estructura exacta:
{
  "nombre": "NOMBRE EXACTO del cliente",
  "tickets": N,           // número entero de tickets abiertos en Zendesk
  "bugs": N,              // número de bugs activos
  "ticketsPendientes": N, // tickets pendientes
  "ticketDetalle": "descripción del ticket o null",
  "causaRaiz": "causa raíz del problema o null",
  "prioridad": "critica|alta|media|baja o null",
  "tckFecha": "YYYY-MM-DD o null",
  "gmv": número en moneda local o null,
  "upPlan": número del plan o null,
  "qtUp": use points usados o null,
  "nps": número NPS (-100 a 100) o null,
  "lastContact": "YYYY-MM-DD o null",
  "centry": true|false
}

IMPORTANTE: Si no tenés el dato real de algún campo, poné null. NUNCA inventar valores.
Los clientes CENTRY (FORUS SA, FORUS COLOMBIA, FORUS PERU, GINO, LOUNGE, MAISA) no tienen upPlan ni qtUp aún — operan en Centry, en proceso de migración a AnyMarket.

Devolveme un array JSON listo para pegar en el dashboard.`;

  navigator.clipboard.writeText(prompt).then(() => {
    const btns = document.querySelectorAll('[onclick="copiarPromptClaude()"]');
    btns.forEach(b => { const orig = b.textContent; b.textContent = '✅ ¡Prompt copiado!'; setTimeout(() => { b.textContent = orig; }, 2500); });
  });
}

// exposed for inline HTML handlers (confirmed via grep of new_index.html/monolith
// for onclick="processImport|exportarJSON|openImport|closeImport|closeImportModal|
// clearAllData|generarResumen|copiarResumen|copiarPromptClaude").
window.processImport = processImport;
window.exportarJSON = exportarJSON;
window.openImport = openImport;
window.closeImport = closeImport;
window.closeImportModal = closeImportModal;
window.clearAllData = clearAllData;
window.generarResumen = generarResumen;
window.copiarResumen = copiarResumen;
window.copiarPromptClaude = copiarPromptClaude;

export {
  processImport, exportarJSON, openImport, closeImport, closeImportModal,
  clearAllData, generarResumen, copiarResumen, copiarPromptClaude
};
