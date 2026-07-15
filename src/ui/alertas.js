import { getVisibleClientIds } from '../services/profiles-repo.js';
import { getClients, PORT } from '../services/clients-repo.js';
import { getActions } from '../services/actions-repo.js';
import { getTicketPattern } from '../domain/ticket-patterns.js';
import { getPatterns } from '../services/client-state-repo.js';
import { calcHS } from '../domain/health-score.js';
import { fmtD, daysSince } from '../lib/format.js';

// ── ALERT DETAIL PANEL ─────────────────────────────────────────────────────────
let _currentAlertData = null;

export function openAlertDetail(alertObj) {
  _currentAlertData = alertObj;
  const panel = document.getElementById('adpPanel');
  const overlay = document.getElementById('adpOverlay');
  const content = document.getElementById('adpContent');

  // Find the full client record
  const client = getClients().find(c => c.id === alertObj.clientId);
  const w = client?.weekly || {};
  const hsObj = client ? calcHS(client) : null;
  const hs = hsObj?.score ?? null;
  const hsCl = hsObj?.cl ?? null;
  const hsColor = hsCl === 'green' ? 'var(--green)' : hsCl === 'yellow' ? 'var(--yellow)' : hsCl === 'orange' ? 'var(--orange)' : hsCl === 'red' ? 'var(--red)' : 'var(--text-muted)';
  const hsLabel = hsCl === 'green' ? '🟢 Saludable' : hsCl === 'yellow' ? '🟡 Observación' : hsCl === 'orange' ? '🟠 En riesgo' : hsCl === 'red' ? '🔴 Crítico' : '⬜ Sin datos';

  // Client actions
  const clientActions = getActions().filter(a => a.clientId === alertObj.clientId && a.status !== 'completado');
  const blockers = clientActions.filter(a => a.bottleneck);
  const critActions = clientActions.filter(a => a.priority === 'critica' && !a.bottleneck);
  const otherActions = clientActions.filter(a => !a.bottleneck && a.priority !== 'critica').slice(0, 3);

  const sevColor = alertObj.sev === 'critica' ? 'adp-sev-red' : alertObj.sev === 'alta' ? 'adp-sev-orange' : 'adp-sev-blue';
  const sevLabel = alertObj.sev === 'critica' ? '🔴 CRÍTICO' : alertObj.sev === 'alta' ? '🟠 ALTO RIESGO' : '🔵 SEGUIMIENTO';
  const daysSinceContact = w.lastContact ? daysSince(w.lastContact) : null;
  const contactColor = !daysSinceContact ? 'var(--text3)' : daysSinceContact > 60 ? 'var(--red)' : daysSinceContact > 30 ? 'var(--orange)' : 'var(--green)';

  const npsColor = w.nps == null ? 'var(--text3)' : w.nps >= 50 ? 'var(--green)' : w.nps >= 0 ? 'var(--yellow)' : 'var(--red)';

  const renderActionCards = (list, cls) => list.map(a => {
    const overdue = a.dueDate && new Date(a.dueDate) < new Date();
    return `<div class="adp-action-card ${cls}">
      <div style="font-size:18px;line-height:1">${a.bottleneck ? '🚧' : a.priority === 'critica' ? '🔴' : '🟠'}</div>
      <div style="flex:1">
        <div class="act-text">${a.title}</div>
        ${a.causa ? `<div style="font-size:11px;color:var(--text3);margin-top:3px">↳ ${a.causa.substring(0,80)}…</div>` : ''}
      </div>
      ${a.dueDate ? `<div class="act-due" style="color:${overdue?'var(--red)':'var(--text3)'}">📅 ${fmtD(a.dueDate)}${overdue?' ⚠️':''}</div>` : ''}
    </div>`;
  }).join('');

  content.innerHTML = `
    <div class="adp-header">
      <div class="adp-severity-strip ${sevColor}"></div>
      <div class="adp-client-name">${alertObj.client}</div>
      <div class="adp-alert-title">${alertObj.title}</div>
      <div class="adp-badges">
        <span class="sev-tag sev-${alertObj.sev}">${sevLabel}</span>
        ${alertObj.isBottleneck ? '<span class="alert-bottleneck-badge">🚧 BLOQUEANTE</span>' : ''}
        ${client?.pais ? `<span style="font-size:11px;color:var(--text3);padding:2px 8px;background:var(--surface2);border-radius:10px">${client.pais}</span>` : ''}
      </div>
    </div>

    <div class="adp-body">

      ${alertObj.body ? `<div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:16px;font-size:13px;color:var(--text);line-height:1.6">${alertObj.body.replace(/\n/g,'<br>')}</div>` : ''}

      ${alertObj.causa ? `<div class="adp-causa-box">
        <div class="label">⚠️ Causa Raíz</div>
        <div class="text">${alertObj.causa}</div>
      </div>` : ''}

      <!-- HEALTH SNAPSHOT -->
      <div class="adp-section">
        <div class="adp-section-title">📊 Salud del Cliente</div>
        <div class="adp-metric-row">
          <div class="adp-metric">
            <div class="val" style="color:${hsColor}">${hs != null ? hs : '—'}</div>
            <div class="lbl">Health Score</div>
            <div style="font-size:10px;color:var(--text3);margin-top:2px">${hs != null ? hsLabel : 'Sin datos'}</div>
          </div>
          <div class="adp-metric">
            <div class="val" style="color:${npsColor}">${w.nps != null ? w.nps : '—'}</div>
            <div class="lbl">NPS</div>
            <div style="font-size:10px;color:var(--text3);margin-top:2px">${w.nps == null ? 'Sin dato' : w.nps >= 50 ? 'Promotor' : w.nps >= 0 ? 'Pasivo' : w.nps >= -50 ? 'Detractor' : 'Detractor crítico'}</div>
          </div>
          <div class="adp-metric">
            <div class="val" style="color:${(w.tickets||0) > 0 ? 'var(--red)' : 'var(--green)'}">${w.tickets ?? '—'}</div>
            <div class="lbl">Tickets</div>
            <div style="font-size:10px;color:var(--text3);margin-top:2px">${(w.bugs||0)>0 ? `${w.bugs} bug${w.bugs>1?'s':''}` : 'Sin bugs'}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;font-weight:700;margin-bottom:4px">Último Contacto</div>
            <div style="font-size:13px;font-weight:700;color:${contactColor}">${w.lastContact ? fmtD(w.lastContact) : 'No registrado'}</div>
            ${daysSinceContact != null ? `<div style="font-size:11px;color:${contactColor}">${daysSinceContact}d atrás</div>` : ''}
          </div>
          <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
            <div style="font-size:10px;color:var(--text3);text-transform:uppercase;font-weight:700;margin-bottom:4px">Use Points</div>
            <div style="font-size:13px;font-weight:700;color:var(--text)">${w.qtUp != null && w.upPlan != null ? `${w.qtUp}/${w.upPlan} UP` : client?.centry ? 'Centry' : '—'}</div>
            ${w.qtUp != null && w.upPlan ? `<div style="font-size:11px;color:var(--text3)">${Math.round(w.qtUp/w.upPlan*100)}% consumido</div>` : ''}
          </div>
        </div>
      </div>

      <!-- ACCIONES CRÍTICAS -->
      ${(blockers.length + critActions.length) > 0 ? `<div class="adp-section">
        <div class="adp-section-title">🚨 Acciones Urgentes (${blockers.length + critActions.length})</div>
        ${renderActionCards(blockers, 'bloq')}
        ${renderActionCards(critActions, 'crit')}
      </div>` : ''}

      <!-- OTRAS ACCIONES -->
      ${otherActions.length > 0 ? `<div class="adp-section">
        <div class="adp-section-title">📋 Otras Acciones Abiertas</div>
        ${renderActionCards(otherActions, '')}
        ${clientActions.length > blockers.length + critActions.length + 3 ? `<div style="font-size:11px;color:var(--text3);text-align:center;padding:6px">${clientActions.length - blockers.length - critActions.length - 3} más en la ficha del cliente</div>` : ''}
      </div>` : ''}

      <!-- TICKET DETALLE -->
      ${w.ticketDetalle ? `<div class="adp-section">
        <div class="adp-section-title">🎫 Ticket Activo</div>
        <div style="background:rgba(231,76,60,.05);border:1px solid rgba(231,76,60,.2);border-radius:8px;padding:12px;font-size:12.5px;color:var(--text);line-height:1.5">${w.ticketDetalle}</div>
      </div>` : ''}

      <!-- ACCIONES RÁPIDAS -->
      <div class="adp-section">
        <div class="adp-section-title">⚡ Acción Rápida</div>
        <div class="adp-quick-actions">
          <button class="adp-btn adp-btn-primary" onclick="closeAlertDetailPanel();openFicha('${alertObj.clientId}')">📋 Ver Ficha Completa</button>
          <button class="adp-btn adp-btn-red" onclick="openNewActionForClient('${alertObj.clientId}')">🚨 Crear Acción Urgente</button>
          <button class="adp-btn" style="background:rgba(34,197,94,.15);color:var(--green);border:1px solid rgba(34,197,94,.3);" onclick="registrarContacto('${alertObj.clientId}');closeAlertDetailPanel()">📞 Registrar Contacto Hoy</button>
          <button class="adp-btn adp-btn-ghost" onclick="closeAlertDetailPanel();nav('acciones',document.getElementById('nav-acciones'))">⚡ Ver Todas las Acciones</button>
          <button class="adp-btn adp-btn-ghost" onclick="closeAlertDetailPanel()">✕ Cerrar</button>
        </div>
      </div>

    </div>`;

  panel.style.display = 'flex';
  panel.classList.remove('closing');
  overlay.classList.add('open');
  panel.scrollTop = 0;
}

export function closeAlertDetail(e) {
  if (e.target === document.getElementById('adpOverlay')) closeAlertDetailPanel();
}

export function closeAlertDetailPanel() {
  const panel = document.getElementById('adpPanel');
  const overlay = document.getElementById('adpOverlay');
  panel.classList.add('closing');
  overlay.classList.remove('open');
  setTimeout(() => { panel.style.display = 'none'; panel.classList.remove('closing'); }, 200);
}

// ── ALERTS ─────────────────────────────────────────────────────────────────────
export function renderAlerts() {
  const allAlerts = [];
  const visIds = getVisibleClientIds();
  const today = new Date(); today.setHours(0,0,0,0);
  const clients = getClients();
  const actions = getActions();

  // ── 0. ALERTAS DE TICKETS RECURRENTES (basado en histórico) ──────────────────
  clients.filter(c => visIds.includes(c.id)).forEach(c => {
    const pat = getTicketPattern(c.id);
    if (pat?.isRecurring) {
      allAlerts.push({type:'ac-orange', client:c.name, clientId:c.id,
        title:`🔁 Tickets Recurrentes — Problema Sistémico`,
        body:`Tickets activos en ${pat.wksWithTix} de las últimas ${pat.weeks} semanas (promedio ${pat.avg}/semana). Puede indicar un problema técnico no resuelto, dependencia de soporte o falla de adopción.`,
        causa: getPatterns(c.id) || 'Ver sección Patrones de Tickets en la ficha', fecha:null, sev:'alta',
        extra:`Promedio ${pat.avg} tix/sem · Tendencia ${pat.trend==='up'?'↑ creciente':pat.trend==='down'?'↓ decreciente':'→ estable'}`
      });
    }
  });

  // ── 1. ALERTAS DESDE DATOS DEL CLIENTE (tickets, NPS, contacto) ──────────────
  clients.filter(c => visIds.includes(c.id)).forEach(c => {
    const w = c.weekly || {};
    const clientActions = actions.filter(a => a.clientId === c.id);
    const critActions = clientActions.filter(a => a.priority==='critica' && a.status!=='completado');
    const bottlenecks = clientActions.filter(a => a.bottleneck && a.status!=='completado');
    const overdueActions = clientActions.filter(a => a.dueDate && new Date(a.dueDate)<today && a.status!=='completado');

    // Ticket crítico
    if (w.tickets>0 && w.prioridad==='critica') {
      allAlerts.push({type:'ac-red', client:c.name, clientId:c.id,
        title:`🚨 Ticket Crítico Abierto`, body:w.ticketDetalle||'Ticket crítico sin resolver',
        causa:w.causaRaiz, fecha:w.tckFecha, sev:'critica',
        extra: critActions.length ? `${critActions.length} acc. crítica${critActions.length>1?'s':''} asociada${critActions.length>1?'s':''}` : null
      });
    } else if (w.tickets>0 && w.prioridad==='alta') {
      allAlerts.push({type:'ac-orange', client:c.name, clientId:c.id,
        title:`⚠️ Ticket Alta Prioridad`, body:w.ticketDetalle||'Ticket alta prioridad abierto',
        causa:w.causaRaiz, fecha:w.tckFecha, sev:'alta', extra:null
      });
    } else if (w.tickets>0) {
      allAlerts.push({type:'ac-blue', client:c.name, clientId:c.id,
        title:`📋 Ticket Abierto`, body:w.ticketDetalle||'Ticket pendiente de resolución',
        causa:w.causaRaiz, fecha:w.tckFecha, sev:'media', extra:null
      });
    }

    // Bug activo
    if (w.bugs>0) allAlerts.push({type:'ac-red', client:c.name, clientId:c.id,
      title:`🐛 Bug Activo en Producción`, body:w.ticketDetalle||'Bug activo afectando operación del cliente',
      causa:w.causaRaiz, fecha:w.tckFecha, sev:'critica', extra:'Escalar a soporte técnico'
    });

    // NPS negativo
    if (w.nps!=null && w.nps<=-50) allAlerts.push({type:'ac-red', client:c.name, clientId:c.id,
      title:`💔 NPS ${w.nps} — Detractor Absoluto`, body:`NPS crítico: ${w.nps}. Requiere plan de rescate urgente. Riesgo alto de churn.`,
      causa:null, fecha:w.lastContact, sev:'critica', extra:'Plan de rescate urgente'
    });
    else if (w.nps!=null && w.nps<0) allAlerts.push({type:'ac-orange', client:c.name, clientId:c.id,
      title:`😟 NPS Negativo: ${w.nps}`, body:`NPS por debajo de cero. Riesgo de churn si no se actúa.`,
      causa:null, fecha:w.lastContact, sev:'alta', extra:null
    });

    // Sin contacto
    if (w.lastContact && daysSince(w.lastContact)>60) allAlerts.push({type:'ac-orange', client:c.name, clientId:c.id,
      title:`📵 Sin Contacto Hace ${daysSince(w.lastContact)} Días`, body:`Último contacto: ${fmtD(w.lastContact)}. Riesgo de desvinculación y churn silencioso.`,
      causa:null, fecha:w.lastContact, sev:'alta', extra:'Programar cadencia urgente'
    });
    else if (!w.lastContact && !c.centry) allAlerts.push({type:'ac-blue', client:c.name, clientId:c.id,
      title:`⏱ Sin Registro de Contacto`, body:`No hay fecha de último contacto registrada. Verificar historial en HubSpot.`,
      causa:null, fecha:null, sev:'media', extra:null
    });
  });

  // ── 2. ALERTAS DESDE ACCIONES — Bottlenecks y críticas ──────────────────────
  const seenBottleneck = new Set();
  actions.filter(a => visIds.includes(a.clientId) && a.status!=='completado')
    .filter(a => a.bottleneck || a.priority==='critica')
    .forEach(a => {
      const key = a.clientId + '|bottleneck';
      if (seenBottleneck.has(key)) return;
      seenBottleneck.add(key);
      const port = PORT.find(p => p.id === a.clientId);
      const clientName = port?.name || a.clientId;
      const clientBottlenecks = actions.filter(x => x.clientId===a.clientId && x.bottleneck && x.status!=='completado');
      const clientCrits = actions.filter(x => x.clientId===a.clientId && x.priority==='critica' && x.status!=='completado');
      const isOverdue = a.dueDate && new Date(a.dueDate) < today;
      allAlerts.push({type: a.bottleneck ? 'ac-red' : 'ac-orange',
        client: clientName, clientId: a.clientId,
        title: a.bottleneck ? `🚧 Acción Bloqueante` : `🔴 Acción Crítica Pendiente`,
        body: a.title + (a.desc ? '\n' + a.desc.substring(0,120)+'…' : ''),
        causa: a.causa || null,
        fecha: a.dueDate || null,
        sev: a.bottleneck ? 'critica' : 'critica',
        extra: (clientBottlenecks.length>1 ? `${clientBottlenecks.length} bloqueantes` : '') +
               (clientCrits.length>0 ? ` · ${clientCrits.length} críticas` : '') +
               (isOverdue ? ' · ⏰ VENCIDA' : ''),
        isBottleneck: a.bottleneck
      });
    });

  // ── 3. ACCIONES VENCIDAS (no bloqueantes) ───────────────────────────────────
  const seenOverdue = new Set();
  actions.filter(a => visIds.includes(a.clientId) && a.dueDate && new Date(a.dueDate)<today && a.status!=='completado' && !a.bottleneck && a.priority!=='critica')
    .forEach(a => {
      const key = a.clientId + '|overdue';
      if (seenOverdue.has(key)) return;
      seenOverdue.add(key);
      const port = PORT.find(p => p.id === a.clientId);
      const overdueCount = actions.filter(x => x.clientId===a.clientId && x.dueDate && new Date(x.dueDate)<today && x.status!=='completado').length;
      allAlerts.push({type:'ac-orange', client: port?.name||a.clientId, clientId:a.clientId,
        title:`⏰ ${overdueCount} Acción${overdueCount>1?'es':''} Vencida${overdueCount>1?'s':''}`,
        body: `"${a.title.substring(0,80)}"${overdueCount>1?' + '+(overdueCount-1)+' más':''}`,
        causa: null, fecha: a.dueDate, sev:'alta', extra:`Vencida hace ${Math.ceil((today-new Date(a.dueDate))/(1000*60*60*24))}d`
      });
    });

  // ── 4. DEDUPLICAR POR CLIENTE+TIPO Y ORDENAR ─────────────────────────────────
  const sevOrder = {critica:0, alta:1, media:2};
  allAlerts.sort((a,b) => (sevOrder[a.sev]??3)-(sevOrder[b.sev]??3) || a.client.localeCompare(b.client));

  // ── 5. RENDER ─────────────────────────────────────────────────────────────────
  const crit = allAlerts.filter(a=>a.sev==='critica');
  const alta = allAlerts.filter(a=>a.sev==='alta');
  const media = allAlerts.filter(a=>a.sev==='media');

  // Summary bar
  const sb = document.getElementById('alertSummaryBar');
  if (sb) sb.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:rgba(231,76,60,.12);border:1px solid rgba(231,76,60,.3);border-radius:10px;flex:1;min-width:140px;">
      <span style="font-size:22px">🚨</span>
      <div><div style="font-size:22px;font-weight:800;color:var(--red);line-height:1">${crit.length}</div>
      <div style="font-size:11px;color:var(--text2);font-weight:600">CRÍTICAS</div></div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:rgba(230,126,34,.1);border:1px solid rgba(230,126,34,.25);border-radius:10px;flex:1;min-width:140px;">
      <span style="font-size:22px">⚠️</span>
      <div><div style="font-size:22px;font-weight:800;color:var(--orange);line-height:1">${alta.length}</div>
      <div style="font-size:11px;color:var(--text2);font-weight:600">ALTO RIESGO</div></div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:rgba(79,142,247,.08);border:1px solid rgba(79,142,247,.2);border-radius:10px;flex:1;min-width:140px;">
      <span style="font-size:22px">📋</span>
      <div><div style="font-size:22px;font-weight:800;color:var(--accent);line-height:1">${media.length}</div>
      <div style="font-size:11px;color:var(--text2);font-weight:600">SEGUIMIENTO</div></div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;background:var(--surface);border:1px solid var(--border);border-radius:10px;flex:1;min-width:140px;">
      <span style="font-size:22px">📊</span>
      <div><div style="font-size:22px;font-weight:800;color:var(--text);line-height:1">${allAlerts.length}</div>
      <div style="font-size:11px;color:var(--text2);font-weight:600">TOTAL ALERTAS</div></div>
    </div>`;

  // Store alerts for panel access
  window._alertsMap = window._alertsMap || {};

  const cardHTML = a => {
    const aKey = a.clientId + '_' + a.sev + '_' + allAlerts.indexOf(a);
    window._alertsMap[aKey] = a;
    const dueDays = a.fecha ? Math.ceil((today - new Date(a.fecha))/(1000*60*60*24)) : null;
    const isOverdue = dueDays > 0;
    return `<div class="alert-card ${a.type}" onclick="openAlertDetail(window._alertsMap['${aKey}'])">
      <div class="alert-header">
        <span class="alert-client-tag">${a.client}</span>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          ${a.isBottleneck ? '<span class="alert-bottleneck-badge">🚧 BLOQUEANTE</span>' : ''}
          <span class="sev-tag sev-${a.sev}">${a.sev}</span>
        </div>
      </div>
      <div class="alert-title">${a.title}</div>
      <div class="alert-body">${a.body.replace(/\n/g,'<br>').substring(0,120)}${a.body.length>120?'…':''}</div>
      ${a.causa ? `<div class="alert-causa"><strong>Causa raíz:</strong> ${a.causa.substring(0,140)}${a.causa.length>140?'…':''}</div>` : ''}
      <div class="alert-footer">
        <div class="alert-meta">
          ${a.fecha ? `<span>${isOverdue?'⏰ Venció':'📅'} ${fmtD(a.fecha)}${isOverdue?' (+'+dueDays+'d)':''}</span>` : ''}
          ${a.extra ? `<span class="alert-actions-count">${a.extra}</span>` : ''}
        </div>
        <span class="alert-action-link">Ver detalle →</span>
      </div>
    </div>`;
  };

  const sections = [];
  if (crit.length)  sections.push(`<div class="alert-section-header ash-critica">🚨 Crítico — ${crit.length} alerta${crit.length>1?'s':''} requieren acción inmediata</div>` + crit.map(cardHTML).join(''));
  if (alta.length)  sections.push(`<div class="alert-section-header ash-alta">⚠️ Alto Riesgo — ${alta.length} alerta${alta.length>1?'s':''}</div>` + alta.map(cardHTML).join(''));
  if (media.length) sections.push(`<div class="alert-section-header ash-media">📋 Seguimiento — ${media.length} pendiente${media.length>1?'s':''}</div>` + media.map(cardHTML).join(''));

  document.getElementById('alertGrid').innerHTML = allAlerts.length
    ? sections.join('')
    : '<div class="empty" style="grid-column:1/-1">✅ Sin alertas activas. Cartera en buena salud.</div>';
}

// exposed for inline HTML handlers
window.openAlertDetail = openAlertDetail;
window.closeAlertDetail = closeAlertDetail;
window.closeAlertDetailPanel = closeAlertDetailPanel;
