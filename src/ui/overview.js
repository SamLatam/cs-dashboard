// ── OVERVIEW / PORTFOLIO TABLE ───────────────────────────────────────────────────
// Extracted verbatim from index.html. Ranges (all verified by reading full bodies
// and brace-matching):
//   - renderRiskBanner        source lines 2437-2459
//   - activeClients           source line  3241
//   - renderOverview          source lines 3027-3101
//   - renderOverviewRisk      source lines 3102-3124
//   - buildDonut              source lines 3125-3132  (private helper, single
//                               consumer = renderOverview, included here even
//                               though not explicitly named in scope — it is not
//                               used anywhere else in the whole source file)
//   - renderTable             source lines 3135-3236
//   - sortBy                  source line  3237
//   - setFilter                source line  3238
//   - cancelClient            source lines 3242-3255  (not explicitly named in
//                               scope, but sandwiched directly between setFilter
//                               and renderFicha, and is the implementation behind
//                               renderTable's "cancelados" filter chip / cancel
//                               button — included per the task's instruction to
//                               grab renderTable's "cancelados" filter logic)
//   - reactivarClient         source lines 3256-3267 (same rationale as cancelClient)
//   - renderLifecyclePipeline source lines 4352-4382
//   - filterByLifecycle       source lines 4383-4391 (only trigger point is the
//                               onclick inside renderLifecyclePipeline's own
//                               markup — included alongside it)
//
// Local module state (sortKey/sortDir/activeFilter): in source these are plain
// globals declared in the "STATE" section (source lines 2468-2469). Their only
// consumers across the ENTIRE source file are sortBy/setFilter/renderTable, all
// three of which live in this file, so they are declared as file-local state here
// rather than round-tripped through a shared repo.
//
// ASSUMED CROSS-FILE IMPORTS (sibling files did not exist yet at extraction time
// — verify all of these during integration):
//   - renderKPIs                                          from './kpis.js'
//   - nav                                                 from './nav.js'
//   - getClients, setClients, PORT, saveData              from '../services/clients-repo.js'
//   - getActions                                          from '../services/actions-repo.js'
//   - getActiveUser, getCsmFilter, setCsmFilter, loadUsers from '../services/users.js'
//   - calcHS, hpClass, hpEmoji, hpLabel                    from '../domain/health-score.js'
//   - getRiskSignals                                      from '../domain/risk-signals.js'
//     (getRiskSignals is also consumed by director.js — a file NOT owned by this
//     agent — so it cannot live in this file; treated as shared domain logic)
//   - moodBadge                                            from '../domain/mood.js'
//   - getTicketPattern                                     from '../domain/ticket-patterns.js'
//   - segPorteRow, tipoChamadoBadge, presenciaReunBadge     from '../domain/segments.js'
//     (tipoChamadoBadge/presenciaReunBadge, source lines 4308-4309, are consumed
//     identically by ficha.js's renderFicha — treated as shared domain badges)
//   - getLifecycle, LC_STAGES                              from '../domain/lifecycle.js'
//   - getMRR                                               from '../domain/renewal.js'
//   - renderRevenueAtRisk, renderRenewalMini, renderCadenceCoverage
//                                                           from './renovaciones.js'
//   - norm, fmtG, fmtD, daysSince, showToast               from '../lib/format.js' / '../lib/toast.js'
import { renderKPIs } from './kpis.js';
import { nav } from './nav.js';
import { getClients, setClients, PORT, saveData, activeClients, cancelClient, reactivarClient } from '../services/clients-repo.js';
import { getActions } from '../services/actions-repo.js';
import { getActiveUser, getCsmFilter, setCsmFilter, loadUsers } from '../services/profiles-repo.js';
import { calcHS, hpClass, hpEmoji, hpLabel } from '../domain/health-score.js';
import { getRiskSignals } from '../domain/risk-signals.js';
import { moodBadge } from '../services/client-state-repo.js';
import { getTicketPattern } from '../domain/ticket-patterns.js';
import { segPorteRow, tipoChamadoBadge, presenciaReunBadge, showToast } from '../lib/dom.js';
import { getLifecycle, LC_STAGES } from '../domain/lifecycle.js';
import { getMRR } from '../domain/renewal-revenue.js';
import { renderRevenueAtRisk, renderRenewalMini, renderCadenceCoverage } from './renovaciones.js';
import { norm, fmtG, fmtD, daysSince } from '../lib/format.js';

const LS_HISTORY = 'cs-v3-history';

// Source lines 2468-2469 (file-local: exclusive consumers are in this file)
let sortKey = 'hs', sortDir = -1;
let activeFilter = 'todos';

// Source lines 2426-2435 in original is getRiskSignals itself (external per above);
// renderRiskBanner below only *consumes* it.

// Source lines 2437-2459
function renderRiskBanner() {
  const clients = getClients();
  const container = document.getElementById('risk-banner-container');
  if (!container) return;
  const atRisk = clients.filter(c => getRiskSignals(c).some(s => s.type==='health'||s.type==='nps'));
  if (!atRisk.length) { container.innerHTML = ''; return; }
  container.innerHTML = `
    <div class="risk-banner">
      <div class="risk-banner-header">
        <span class="risk-banner-title">⚠️ ${atRisk.length} cliente${atRisk.length>1?'s':''} requiere${atRisk.length>1?'n':''} atención inmediata</span>
        <button onclick="document.getElementById('risk-banner-container').innerHTML=''" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px">✕</button>
      </div>
      <div class="risk-chips">
        ${atRisk.map(c => {
          const sigs = getRiskSignals(c);
          const worst = sigs[0];
          return `<div class="risk-chip" onclick="openFicha('${c.id}')">
            ${worst.icon} <span>${c.name}</span>
            <span class="rc-badge">${sigs.length}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

// activeClients/cancelClient/reactivarClient: canonical implementations live in
// clients-repo.js (the module that owns the `clients` array directly) — imported
// above. Removed the duplicate copies that were independently extracted here too
// (both were functionally equivalent, but two copies risk drifting apart).

// Source lines 3027-3101
function renderOverview() {
  renderKPIs();
  const _ac = activeClients();

  // ── Insights panel (mi cartera) ──
  const _ip = document.getElementById('insights-panel');
  if (_ip) {
    const _ins = [];
    const _reds   = _ac.filter(c => calcHS(c).cl === 'red');
    const _orgs   = _ac.filter(c => calcHS(c).cl === 'orange');
    const _negNPS = _ac.filter(c => c.weekly?.nps != null && c.weekly.nps < 0);
    const _promos = _ac.filter(c => c.weekly?.nps != null && c.weekly.nps >= 9);
    const _hiTix  = _ac.filter(c => (c.weekly?.tickets||0) >= 2);
    const _topG   = [..._ac].filter(c=>c.weekly?.gmv>0).sort((a,b)=>b.weekly.gmv-a.weekly.gmv)[0];
    const _today2 = new Date(); _today2.setHours(0,0,0,0);
    const _noContact = _ac.filter(c => {
      if (!c.weekly?.lastContact) return true;
      const d=new Date(c.weekly.lastContact); d.setHours(0,0,0,0);
      return (_today2-d)/86400000 > 30;
    });

    if (_reds.length)      _ins.push({icon:'🔴',type:'risk',text:`${_reds.length} cliente${_reds.length>1?'s':''} con Health ROJO — acción urgente: ${_reds.slice(0,2).map(c=>c.name).join(', ')}${_reds.length>2?' +'+(_reds.length-2)+' más':''}`});
    if (_orgs.length)      _ins.push({icon:'🟠',type:'risk',text:`${_orgs.length} cliente${_orgs.length>1?'s':''} en observación: ${_orgs.slice(0,2).map(c=>c.name).join(', ')}`});
    if (_negNPS.length)    _ins.push({icon:'😟',type:'risk',text:`NPS negativo: ${_negNPS.map(c=>`${c.name} (${c.weekly.nps})`).join(' · ')} — priorizar rescate`});
    if (_hiTix.length)     _ins.push({icon:'🎫',type:'risk',text:`Tickets acumulados: ${_hiTix.map(c=>`${c.name} (${c.weekly.tickets})`).join(' · ')}`});
    if (_noContact.length) _ins.push({icon:'📵',type:'risk',text:`Sin contacto hace +30 días: ${_noContact.slice(0,3).map(c=>c.name).join(', ')}${_noContact.length>3?' +'+(_noContact.length-3)+' más':''}`});
    if (_promos.length)    _ins.push({icon:'🌟',type:'good',text:`Promotores NPS (9-10): ${_promos.map(c=>c.name).join(', ')} — capitalizar para expansión`});
    if (_topG)             _ins.push({icon:'📈',type:'good',text:`Mayor GMV de tu cartera: ${_topG.name} con ${fmtG(_topG.weekly.gmv)} este mes`});

    _ip.innerHTML = _ins.length ? `
      <div style="background:rgba(99,102,241,.06);border:1px solid rgba(99,102,241,.22);border-radius:12px;overflow:hidden">
        <div style="background:rgba(99,102,241,.11);padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(99,102,241,.15)">
          <span style="font-size:15px">💡</span>
          <span style="font-size:12px;font-weight:800;color:#a78bfa;letter-spacing:.3px">Insights de mi Cartera</span>
          <span style="margin-left:auto;font-size:10px;color:var(--text3)">${_ins.length} insight${_ins.length>1?'s':''} · auto-generado</span>
        </div>
        <div style="padding:10px 16px;display:flex;flex-direction:column;gap:6px">
          ${_ins.map(i=>`<div style="display:flex;align-items:flex-start;gap:9px;background:${i.type==='risk'?'rgba(231,76,60,.07)':'rgba(46,204,113,.07)'};border:1px solid ${i.type==='risk'?'rgba(231,76,60,.16)':'rgba(46,204,113,.16)'};border-radius:7px;padding:8px 12px">
            <span style="font-size:13px;flex-shrink:0">${i.icon}</span>
            <span style="font-size:11.5px;color:var(--text);line-height:1.5">${i.text}</span>
          </div>`).join('')}
        </div>
      </div>` : '';
  }

  // Health donut
  const dist = {Sano:0,Observación:0,'En riesgo':0,Crítico:0};
  const dColors = {Sano:'#2ecc71',Observación:'#f39c12','En riesgo':'#e67e22',Crítico:'#e74c3c'};
  _ac.forEach(c=>{const h=calcHS(c);if(h.cl)dist[hpLabel(h.cl)]=(dist[hpLabel(h.cl)]||0)+1;});
  buildDonut('donutSVG','donutLegend',dist,dColors);
  // NPS donut
  const nDist = {Promotores:0,Pasivos:0,Detractores:0};
  const nColors = {Promotores:'#2ecc71',Pasivos:'#f39c12',Detractores:'#e74c3c'};
  _ac.forEach(c=>{ const n=c.weekly?.nps; if(n==null)return; if(n>0)nDist.Promotores++; else if(n===0)nDist.Pasivos++; else nDist.Detractores++; });
  buildDonut('npsDonutSVG','npsDonutLegend',nDist,nColors);
  // GMV chart
  const byGMV=[..._ac].filter(c=>c.weekly?.gmv>0).sort((a,b)=>(b.weekly?.gmv||0)-(a.weekly?.gmv||0)).slice(0,10);
  const maxG=byGMV[0]?.weekly?.gmv||1;
  document.getElementById('gmvChart').innerHTML=byGMV.map(c=>`
    <div class="bar-wrap"><span class="bar-label" title="${c.name}">${c.name.split(' ').slice(0,2).join(' ')}</span>
    <div class="bar-track"><div class="bar-fill" style="width:${Math.round(c.weekly.gmv/maxG*100)}%;background:linear-gradient(90deg,var(--accent),var(--accent2))"></div></div>
    <span class="bar-val">${fmtG(c.weekly.gmv)}</span></div>`).join('') || '<div class="no-data" style="padding:16px">Sin datos GMV</div>';
  // Tickets chart
  const withTck=[..._ac].filter(c=>c.weekly?.tickets>0).sort((a,b)=>(b.weekly?.tickets||0)-(a.weekly?.tickets||0)).slice(0,10);
  document.getElementById('ticketsChart').innerHTML=withTck.length?withTck.map(c=>`
    <div class="bar-wrap"><span class="bar-label" title="${c.name}">${c.name.split(' ').slice(0,2).join(' ')}</span>
    <div class="bar-track"><div class="bar-fill" style="width:100%;background:${c.weekly.prioridad==='critica'?'var(--red)':c.weekly.prioridad==='alta'?'var(--orange)':'var(--yellow)'}"></div></div>
    <span class="bar-val">${c.weekly.tickets}</span></div>`).join(''):'<div class="no-data" style="padding:16px">✅ Sin tickets abiertos</div>';
  // New panels
  renderLifecyclePipeline();
  renderRevenueAtRisk();
  renderRenewalMini();
  renderCadenceCoverage();
  renderOverviewRisk();
}

// Source lines 3102-3124
function renderOverviewRisk() {
  const el = document.getElementById('overview-risk-container');
  if (!el) return;
  const atRisk = activeClients().filter(c => {
    const hs = calcHS(c);
    return hs.cl === 'red' || hs.cl === 'orange' || (c.weekly?.nps != null && c.weekly.nps < 0) || (c.weekly?.tickets >= 2);
  }).sort((a,b) => (calcHS(a).score||50) - (calcHS(b).score||50));
  if (!atRisk.length) { el.innerHTML=''; return; }
  const items = atRisk.slice(0,6).map(c => {
    const hs = calcHS(c); const w = c.weekly||{};
    const reasons = [];
    if (hs.cl==='red') reasons.push('🔴 Salud crítica');
    else if (hs.cl==='orange') reasons.push('🟠 Salud baja');
    if (w.nps!=null && w.nps<0) reasons.push(`NPS ${w.nps}`);
    if (w.tickets>=2) reasons.push(`${w.tickets} tickets`);
    return `<div style="background:var(--surface2);border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:10px;border-left:3px solid ${hs.cl==='red'?'var(--red)':'var(--orange)'}">
      <span style="font-weight:600;font-size:13px;flex:1">${c.name}</span>
      <span style="font-size:11px;color:var(--text3)">${reasons.join(' · ')}</span>
      ${hs.score!=null?`<span class="hp ${hpClass(hs.cl)}">${hpEmoji(hs.cl)} ${hs.score}</span>`:''}
    </div>`;
  }).join('');
  el.innerHTML=`<div style="margin-bottom:16px"><div style="font-weight:700;font-size:13px;color:var(--text2);margin-bottom:8px;display:flex;align-items:center;gap:6px">⚠️ Clientes en riesgo <span style="font-size:11px;color:var(--text3);font-weight:400">(${atRisk.length} total)</span></div><div style="display:flex;flex-direction:column;gap:6px">${items}</div></div>`;
}

// Source lines 3125-3132
function buildDonut(svgId, legendId, dist, colors) {
  const total=Object.values(dist).reduce((a,b)=>a+b,0);
  const r=50, circ=2*Math.PI*r; let off=0;
  let segs='<circle cx="64" cy="64" r="50" fill="none" stroke="var(--surface2)" stroke-width="20"/>';
  Object.keys(dist).filter(k=>dist[k]>0).forEach(k=>{const pct=dist[k]/total;const dash=pct*circ;segs+=`<circle cx="64" cy="64" r="${r}" fill="none" stroke="${colors[k]}" stroke-width="20" stroke-dasharray="${dash} ${circ-dash}" stroke-dashoffset="${-off}"/>`;off+=dash;});
  document.getElementById(svgId).innerHTML=segs;
  document.getElementById(legendId).innerHTML=Object.keys(dist).map(k=>`<div class="legend-item"><div class="legend-dot" style="background:${colors[k]}"></div><span>${k}: <strong>${dist[k]}</strong></span></div>`).join('');
}

// Source lines 3135-3236
function renderTable() {
  renderKPIs();
  const clients = getClients();
  const actions = getActions();
  const q=(document.getElementById('searchBox')?.value||'').toLowerCase();
  // Director CSM filter
  const _portfolioUser = getActiveUser();
  const _isDirector = _portfolioUser && _portfolioUser.role === 'director';
  // Populate CSM filter bar for directors
  const _csmFilterBar = document.getElementById('csm-filter-bar');
  if (_csmFilterBar) {
    if (_isDirector) {
      _csmFilterBar.style.display = 'flex';
      _csmFilterBar.style.alignItems = 'center';
      _csmFilterBar.style.gap = '8px';
      const _currentCsmFilter = getCsmFilter() || 'all';
      _csmFilterBar.innerHTML = '<span style="color:#8892b0;font-size:12px;">CSM:</span>' +
        '<select onchange="setCsmFilter(this.value)" style="background:#252840;border:1px solid #2e3250;color:#e8eaf6;padding:5px 10px;border-radius:6px;font-size:12px;">' +
        '<option value="all"' + (_currentCsmFilter === 'all' ? ' selected' : '') + '>Todos los CSMs</option>' +
        loadUsers().filter(u => u.role === 'csm').map(u =>
          '<option value="' + u.id + '"' + (_currentCsmFilter === u.id ? ' selected' : '') + '>' + u.name.split(' ')[0] + '</option>'
        ).join('') +
        '</select>';
    } else {
      _csmFilterBar.style.display = 'none';
    }
  }
  let _filteredClients = [...clients];
  if (_isDirector) {
    const _csmFilter = getCsmFilter();
    if (_csmFilter && _csmFilter !== 'all') {
      const _allUsers = loadUsers();
      const _csmUser = _allUsers.find(u => u.id === _csmFilter);
      if (_csmUser && _csmUser.clientIds.length > 0) {
        _filteredClients = _filteredClients.filter(c => {
          const port = PORT.find(p => norm(p.name) === norm(c.name));
          return port && _csmUser.clientIds.includes(port.id);
        });
      }
    }
  }
  let list=_filteredClients.filter(c=>{
    if(q&&!c.name.toLowerCase().includes(q))return false;
    const isCancelado=!!(c.weekly&&c.weekly.cancelado);
    if(activeFilter==='cancelados')return isCancelado;
    if(isCancelado)return false; // clientes cancelados no aparecen en las demás vistas
    if(activeFilter==='todos')return true;
    if(activeFilter==='centry')return c.centry;
    if(activeFilter==='risk'){const h=calcHS(c);return h.cl==='red'||h.cl==='orange';}
    return c.country===activeFilter;
  });
  const prioOrd2={critica:0,alta:1,media:2,baja:3};
  list.sort((a,b)=>{
    const ha=calcHS(a),hb=calcHS(b);
    if(sortKey==='hs')return sortDir*((hb.score??-1)-(ha.score??-1));
    if(sortKey==='name')return sortDir*a.name.localeCompare(b.name);
    if(sortKey==='country')return sortDir*a.country.localeCompare(b.country);
    if(sortKey==='gmv')return sortDir*((a.weekly?.gmv??-1)-(b.weekly?.gmv??-1));
    if(sortKey==='tickets')return sortDir*((a.weekly?.tickets??-1)-(b.weekly?.tickets??-1));
    if(sortKey==='nps')return sortDir*((a.weekly?.nps??-999)-(b.weekly?.nps??-999));
    if(sortKey==='up'){const ua=a.weekly?.upPlan?(a.weekly.qtUp/a.weekly.upPlan):-1;const ub=b.weekly?.upPlan?(b.weekly.qtUp/b.weekly.upPlan):-1;return sortDir*(ua-ub);}
    if(sortKey==='contact'){const da=a.weekly?.lastContact?new Date(a.weekly.lastContact):new Date(0);const db=b.weekly?.lastContact?new Date(b.weekly.lastContact):new Date(0);return sortDir*(db-da);}
    return 0;
  });
  const flags={Chile:'🇨🇱',Colombia:'🇨🇴',Uruguay:'🇺🇾',Mexico:'🇲🇽',Peru:'🇵🇪'};
  const tbody=document.getElementById('tbody');
  document.getElementById('emptyMsg').style.display=list.length?'none':'block';
  if(!list.length){tbody.innerHTML='';return;}
  renderRiskBanner();
  tbody.innerHTML=list.map(c=>{
    const h=calcHS(c),w=c.weekly||{},fl=flags[c.country]||'🌎';
    const trend=(()=>{try{const hist=JSON.parse(localStorage.getItem(LS_HISTORY)||'[]');if(hist.length<2)return'';const prev=hist[hist.length-2].scores[c.id];if(prev==null||h.score==null)return'';const d=h.score-prev;if(d===0)return`<span style="color:var(--text3);font-size:10px;margin-left:3px">→</span>`;return d>0?`<span style="color:var(--green);font-size:10px;margin-left:3px">↑${d}</span>`:`<span style="color:var(--red);font-size:10px;margin-left:3px">↓${Math.abs(d)}</span>`;}catch(e){return'';}})();
    const hCell=h.score!=null?`<span class="hp ${hpClass(h.cl)}">${hpEmoji(h.cl)} ${h.score}</span>${trend}`:'<span class="no-data">—</span>';
    const gmvCell=w.gmv!=null?fmtG(w.gmv):'<span class="no-data">—</span>';
    const tckTip=w.ticketDetalle?` title="${w.ticketDetalle.slice(0,120).replace(/"/g,"'")}"`:'';
    const tCell=w.tickets==null?'<span class="no-data">—</span>':w.tickets===0?'<span class="badge b-green">0</span>':w.tickets===1?`<span class="badge b-yellow"${tckTip}>${w.tickets}</span>`:`<span class="badge b-red"${tckTip}>${w.tickets}</span>`;
    const bugBadge=w.bugs?'<span class="badge b-red" style="margin-left:3px">🐛</span>':'';
    const tipoBadge=tipoChamadoBadge(w.tipoChamado);
    const presBadge=presenciaReunBadge(w.presenciaReuniones);
    const npsCell=w.nps==null?'<span class="no-data">—</span>':`<span class="${w.nps>=50?'nps-pos':w.nps>=0?'nps-mid':'nps-neg'}">${w.nps>0?'+':''}${w.nps}</span>`;
    const upCell=c.centry?'<span class="tag-centry">CENTRY</span>':w.upPlan&&w.qtUp!=null?`<span class="badge ${Math.min(100,Math.round(w.qtUp/w.upPlan*100))>=70?'b-green':Math.min(100,Math.round(w.qtUp/w.upPlan*100))>=40?'b-yellow':'b-red'}">${Math.min(100,Math.round(w.qtUp/w.upPlan*100))}%</span>`:'<span class="no-data">—</span>';
    const contCell=!w.lastContact?'<span class="no-data">—</span>':(`<span class="${daysSince(w.lastContact)<14?'contact-ok':daysSince(w.lastContact)<30?'contact-warn':daysSince(w.lastContact)<60?'contact-bad':'contact-crit'}">${fmtD(w.lastContact)}</span>`);
    const actCnt=actions.filter(a=>a.clientId===c.id&&a.status!=='resuelto').length;
    const actBl=actions.filter(a=>a.clientId===c.id&&a.status==='bloqueado').length;
    const contactBtn=`<button class="btn btn-ghost" onclick="event.stopPropagation();registrarContacto('${c.id}')" style="font-size:10px;padding:3px 8px;margin-left:4px" title="Registrar contacto hoy">📞</button>`;
    const cancelBtn=w.cancelado
      ? `<button class="btn btn-ghost" onclick="event.stopPropagation();reactivarClient('${c.id}')" style="font-size:10px;padding:3px 8px;margin-left:4px;color:var(--green)" title="Reactivar cliente">↩️</button>`
      : `<button class="btn btn-ghost" onclick="event.stopPropagation();cancelClient('${c.id}')" style="font-size:10px;padding:3px 8px;margin-left:4px;color:var(--red)" title="Cancelar cliente">❌</button>`;
    const actCell=(actBl>0?`<span class="badge b-red">${actBl} 🚧</span>${contactBtn}`:actCnt>0?`<span class="badge b-yellow">${actCnt}</span>${contactBtn}`:contactBtn)+cancelBtn;
    // Risk signals for this row
    const sigs = getRiskSignals(c);
    const riskIcons = sigs.length ? `<div style="display:flex;gap:3px;margin-top:3px">${sigs.map(s=>`<span title="${s.label}" style="font-size:11px">${s.icon}</span>`).join('')}</div>` : '';
    // Mood badge + ticket recurrence badge
    const mood = moodBadge(c.id);
    const tixPat = getTicketPattern(c.id);
    const recBadge = tixPat?.isRecurring ? `<span title="Tickets recurrentes en ${tixPat.wksWithTix} de ${tixPat.weeks} semanas" style="font-size:9px;background:rgba(231,76,60,.12);color:#e74c3c;padding:1px 5px;border-radius:3px;margin-left:4px;font-weight:700">🔁</span>` : '';
    const canceladoBadge = w.cancelado ? ` <span class="badge b-red" title="Cancelado ${w.fechaCancelacion?fmtD(w.fechaCancelacion):''}${w.motivoCancelacion?' — '+w.motivoCancelacion:''}">❌ CANCELADO</span>` : '';
    return `<tr onclick="openFicha('${c.id}')" style="${w.cancelado?'opacity:.55':sigs.some(s=>s.type==='health'&&calcHS(c).cl==='red')?'background:rgba(231,76,60,.04)':''}">
      <td>${hCell}</td><td><div class="client-name">${c.name}${c.centry?' <span class="tag-centry">CENTRY</span>':''}${canceladoBadge} ${mood}${recBadge}</div><div class="client-sub">${fl} ${c.country}</div>${segPorteRow(c,w)}${riskIcons}</td>
      <td>${fl} ${c.country}</td><td>${gmvCell}</td><td>${tCell}${bugBadge}${tipoBadge}</td><td>${npsCell}</td><td>${upCell}</td><td>${contCell}${presBadge}</td><td>${actCell}</td></tr>`;
  }).join('');
  const _cancCount=document.getElementById('chip-cancelados-count');
  if(_cancCount)_cancCount.textContent=clients.filter(c=>c.weekly&&c.weekly.cancelado).length||'';
}

// Source line 3237
function sortBy(k){if(sortKey===k)sortDir*=-1;else{sortKey=k;sortDir=k==='name'?1:-1;}document.querySelectorAll('th').forEach(t=>{t.classList.remove('sorted');const i=t.textContent.replace(/[↑↓↕]/g,'').trim();t.textContent=i+' ↕';});const th=document.getElementById('th-'+k);if(th){th.classList.add('sorted');th.textContent=th.textContent.replace('↕',sortDir===1?'↑':'↓');}renderTable();}
// Source line 3238
function setFilter(f,el){activeFilter=f;document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));el.classList.add('active');renderTable();}

// Source lines 4352-4382
function renderLifecyclePipeline(){
  const clients = getClients();
  const el=document.getElementById('lifecyclePipelinePanel');if(!el)return;
  const counts={};
  clients.forEach(c=>{const lc=getLifecycle(c.id)||'unknown';counts[lc]=(counts[lc]||0)+1;});
  const withStage=clients.filter(c=>getLifecycle(c.id));
  const pct=Math.round(withStage.length/clients.length*100);

  const cards=Object.entries(LC_STAGES).map(([key,s])=>{
    const n=counts[key]||0;
    const mrrSum=clients.filter(c=>getLifecycle(c.id)===key&&getMRR(c.id)).reduce((acc,c)=>acc+getMRR(c.id),0);
    const mrrStr=mrrSum>0?`<div class="lp-mrr" style="color:${s.color}">CLP ${mrrSum>=1000?(mrrSum/1000).toFixed(0)+'K':mrrSum}</div>`:'';
    return `<div class="lc-pipe-card" onclick="filterByLifecycle('${key}')" title="Ver clientes en ${s.label}">
      <div class="lp-bar" style="background:${s.color}"></div>
      <div class="lp-emoji">${s.emoji}</div>
      <div class="lp-count" style="color:${n>0?s.color:'var(--text3)'}">${n}</div>
      <div class="lp-label">${s.label}</div>
      ${mrrStr}
    </div>`;
  }).join('');

  const noStage=counts['unknown']||0;
  el.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div class="card-title" style="margin-bottom:0">🗺️ Customer Lifecycle Pipeline <span>Mehta · Steinman · Murphy</span></div>
      <div style="font-size:12px;color:var(--text3)">${pct}% de cartera con etapa definida · ${noStage>0?`<span style="color:var(--orange)">${noStage} sin clasificar</span>`:'<span style="color:var(--green)">✅ Todos clasificados</span>'}</div>
    </div>
    <div class="lc-pipeline">${cards}</div>
    ${noStage>0?`<div style="font-size:11px;color:var(--text3);padding:6px 0">
      💡 Definí la etapa de cada cliente en su <a href="#" onclick="nav('ficha',document.getElementById('nav-ficha'));return false" style="color:var(--accent)">Ficha</a> para activar el Playbook automático. Recordá: <em>"The stage determines the play." — Lincoln Murphy</em>
    </div>`:''}`;
}

// Source lines 4383-4391
function filterByLifecycle(lc){
  // Navega a Portfolio y filtra por etapa
  nav('portfolio', document.getElementById('nav-portfolio'));
  setTimeout(()=>{
    const rows=document.querySelectorAll('#clientTable tr[data-id]');
    rows.forEach(r=>{const id=r.dataset.id;r.style.display=getLifecycle(id)===lc?'':'none';});
    showToast(`Filtrando: ${LC_STAGES[lc]?.emoji} ${LC_STAGES[lc]?.label} (${document.querySelectorAll('#clientTable tr[data-id]:not([style*="none"])').length} clientes)`, 'blue');
  },200);
}

// Window-attach: verified via a full-file grep of every on(click|change|blur|
// keydown|input|focus)="..." attribute in the ENTIRE source file (not just this
// file's own range) for references to functions defined in this file:
//   - setFilter(...)          → chips (source ~759-767)
//   - sortBy(...)             → table headers (source ~773-780)
//   - cancelClient('${c.id}') → portfolio table row action (source ~3220)
//   - reactivarClient('${c.id}') → portfolio table row action (source ~3219)
//   - filterByLifecycle('${key}') → lifecycle pipeline cards (source ~4363)
// renderRiskBanner/renderOverview/renderOverviewRisk/renderTable/
// renderLifecyclePipeline/buildDonut/activeClients are never referenced from
// inline onclick strings anywhere in the source file — only called as direct
// JS invocations — so they do not need window-attachment.
window.setFilter = setFilter;
window.sortBy = sortBy;
window.cancelClient = cancelClient;
window.reactivarClient = reactivarClient;
window.filterByLifecycle = filterByLifecycle;
// renderTable IS referenced from an inline oninput="renderTable()" on the
// portfolio page's #searchBox — missing this window-attach silently broke
// the search-as-you-type filter.
window.renderTable = renderTable;

export {
  activeClients,
  renderRiskBanner,
  renderOverview,
  renderOverviewRisk,
  renderTable,
  sortBy,
  setFilter,
  cancelClient,
  reactivarClient,
  renderLifecyclePipeline,
  filterByLifecycle,
};
