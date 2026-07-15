import { getClients } from '../services/clients-repo.js';
import { getActions } from '../services/actions-repo.js';
import { calcHS, hpEmoji, hpLabel, hpAction, hpActionColor } from '../domain/health-score.js';
import { segBadge, porteBadge, tipoChamadoBadge, presenciaReunBadge, tendenciaLabel } from '../lib/dom.js';
import { fmtG, fmtD, daysSince, daysUntil } from '../lib/format.js';
// ASSUMPTION: MOODS (the mood-options object) is exported from client-state-repo.js alongside
// getMood/saveMood/moodBadge, since it's the data the mood selector in this page iterates over.
// Not explicitly named in this agent's import map — flagged for reconciliation.
import {
  getMood, MOODS, getPatterns, getRF, getOB, getAP, getESC, getRein,
  getCompCli, getCompDB1, intStChip, getLifecycle
} from '../services/client-state-repo.js';
import { LC_STAGES, buildPlaybook } from '../domain/lifecycle.js';
import { getMRR, getRenewal } from '../domain/renewal-revenue.js';
import { ticketSparkline } from '../domain/ticket-patterns.js';

// ── FICHA CLIENTE ──────────────────────────────────────────────────────────────
export function renderFicha() {
  const id = document.getElementById('fichaSelect').value;
  const cnt = document.getElementById('fichaContent');
  if (!id) { cnt.innerHTML = '<div class="empty">Seleccioná un cliente para ver su ficha completa.</div>'; return; }
  const c = getClients().find(x => x.id === id); if (!c) return;
  const w = c.weekly || {}, h = calcHS(c);
  const flags={Chile:'🇨🇱',Colombia:'🇨🇴',Uruguay:'🇺🇾',Mexico:'🇲🇽',Peru:'🇵🇪'};
  const noteKey = 'cs-note-' + id;
  const savedNote = localStorage.getItem(noteKey) || '';
  const savedMkt = localStorage.getItem('cs-mkt-' + id) || '';
  const clientActions = getActions().filter(a => a.clientId === id && a.status !== 'resuelto');

  let hsSection = '';
  if (h.score != null) {
    hsSection = `<div class="ficha-box" style="grid-column:1/-1">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px;flex-wrap:wrap">
        <h4 style="margin:0">Health Score — ${h.score}/100 ${hpEmoji(h.cl)} ${hpLabel(h.cl)}</h4>
        <div style="font-size:12px;font-weight:600;padding:6px 14px;border-radius:8px;background:${hpActionColor(h.cl)}18;border:1px solid ${hpActionColor(h.cl)}44;color:${hpActionColor(h.cl)};line-height:1.4;max-width:460px">${hpAction(h.cl)}</div>
      </div>
      ${Object.entries(h.comps).map(([k,v])=>`
        <div class="hs-comp-row">
          <span class="hs-comp-label">${v.label} (${Math.round(v.weight*100)}%)</span>
          <div class="hs-comp-track"><div class="hs-comp-fill" style="width:${v.score}%;background:${v.score>=80?'var(--green)':v.score>=60?'var(--yellow)':v.score>=40?'var(--orange)':'var(--red)'}"></div></div>
          <span class="hs-comp-val">${Math.round(v.score)}</span>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:8px;padding-left:140px">→ ${v.raw}</div>`).join('')}
    </div>`;
  }

  const actSection = clientActions.length ? `
    <div class="ficha-box" style="grid-column:1/-1">
      <h4>Acciones Activas (${clientActions.length})</h4>
      <div class="ficha-actions-list">
        ${clientActions.map(a => {
          const col = a.status==='bloqueado'?'var(--red)':a.status==='en-progreso'?'var(--accent)':'var(--text3)';
          return `<div class="ficha-accion">
            <div class="fa-dot" style="background:${col}"></div>
            <div><div style="font-size:12px;font-weight:600">${a.title}</div><div style="font-size:11px;color:var(--text2);margin-top:2px">${a.status} · ${a.priority}${a.dueDate?' · 📅 '+fmtD(a.dueDate):''}</div>${a.causa?`<div style="font-size:11px;color:var(--text3);margin-top:3px">⚠ ${a.causa}</div>`:''}</div>
            <button class="btn btn-ghost" onclick="openEditAction('${a.id}')" style="margin-left:auto;font-size:11px;padding:4px 10px">Editar</button>
          </div>`;}).join('')}
    </div>
    </div>` : '';

  cnt.innerHTML = `
    <div class="ficha-grid">
      ${(c.segmento||c.porte||w.tipoChamado||w.presenciaReuniones)?`<div class="ficha-box" style="grid-column:1/-1;padding:12px 16px;background:rgba(79,142,247,.04);border-color:rgba(79,142,247,.2)">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px">Perfil:</span>
          ${segBadge(c.segmento)}${porteBadge(c.porte)}
          ${w.tipoChamado?'<span style="color:var(--text3);font-size:12px">·</span>'+tipoChamadoBadge(w.tipoChamado):''}
          ${w.presenciaReuniones?'<span style="color:var(--text3);font-size:12px">·</span>'+presenciaReunBadge(w.presenciaReuniones):''}
          <span style="color:var(--text3);font-size:12px">·</span>
          <span style="font-size:11px;font-weight:700;color:var(--text3)">Tendencia US:</span>${tendenciaLabel(id)}
        </div>
      </div>`:''}
      <div class="ficha-box">
        <h4>📊 Datos Operativos</h4>
        <div class="ficha-row"><label>GMV del Mes</label><div class="val">${w.gmv!=null?fmtG(w.gmv):'—'}</div></div>
        <div class="ficha-row"><label>NPS (Tracksale)</label><div class="val" style="color:${w.nps==null?'var(--text2)':w.nps>=50?'var(--green)':w.nps>=0?'var(--yellow)':'var(--red)'}">${w.nps!=null?(w.nps>0?'+':'')+w.nps:'—'}</div></div>
        <div class="ficha-row"><label>Use Points</label><div class="val">${c.centry?'Sin UP (CENTRY)':w.upPlan&&w.qtUp!=null?w.qtUp+'/'+w.upPlan+' ('+Math.min(100,Math.round(w.qtUp/w.upPlan*100))+'%)':'—'}</div></div>
        <div class="ficha-row"><label>Tickets Abiertos</label><div class="val">${w.tickets!=null?w.tickets:' —'}</div></div>
        <div class="ficha-row"><label>Bugs Activos</label><div class="val">${w.bugs||0}</div></div>
        <div class="ficha-row"><label>Último Contacto</label><div class="val" style="display:flex;align-items:center;gap:8px">${w.lastContact?fmtD(w.lastContact)+' ('+daysSince(w.lastContact)+'d)':'—'}<button class="btn btn-ghost" onclick="registrarContacto('${id}',true)" style="font-size:10px;padding:2px 8px">📞 Hoy</button></div></div>
        <div class="ficha-row"><label>País</label><div class="val">${flags[c.country]||'🌎'} ${c.country}</div></div>
        <div class="ficha-row"><label>Migración CENTRY</label><div class="val">${c.centry?'✅ Sí':'No'}</div></div>
        <div class="ficha-row" style="align-items:center">
          <label>Estado de Ánimo</label>
          <div class="val mood-selector">
            ${Object.entries(MOODS).map(([k,v])=>`<button class="mood-opt${getMood(id)===k?' selected':''}" data-mood-id="${id}" data-mood-val="${k}" onclick="saveMood('${id}','${k}')">${v.emoji} ${v.label}</button>`).join('')}
            ${getMood(id)?`<button class="mood-opt" onclick="saveMood('${id}','')" style="color:var(--text3)">✕</button>`:''}
          </div>
        </div>
        <div class="ficha-row" style="align-items:center">
          <label>Lifecycle Stage</label>
          <div class="val" style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:8px">
              <select id="lc-select-${id}" class="lc-select" onchange="saveLifecycle('${id}')">
                <option value="">— Sin clasificar —</option>
                ${Object.entries(LC_STAGES).map(([k,s])=>`<option value="${k}" ${getLifecycle(id)===k?'selected':''}>${s.emoji} ${s.label}</option>`).join('')}
              </select>
              <span id="saved-lc-${id}" class="saved-tag" style="opacity:0">✓</span>
            </div>
            ${buildPlaybook(id)}
          </div>
        </div>
        <div class="ficha-row" style="align-items:center">
          <label>MRR (USD/mes)</label>
          <div class="val mrr-input-wrap">
            <span class="mrr-prefix">USD</span>
            <input type="number" id="mrr-input-${id}" value="${getMRR(id)||''}"
              style="background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:4px 10px;border-radius:6px;font-size:12px;width:140px;outline:none"
              placeholder="ej. 1500000"
              onblur="saveMRRField('${id}')"
              onkeydown="if(event.key==='Enter'){saveMRRField('${id}');this.blur()}">
            <span id="saved-mrr-${id}" class="saved-tag" style="opacity:0">✓</span>
          </div>
        </div>
        <div class="ficha-row" style="align-items:center">
          <label>Fecha de Renovación</label>
          <div class="val" style="display:flex;align-items:center;gap:8px">
            <input type="date" id="renewal-input-${id}" value="${getRenewal(id)||''}"
              style="background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:4px 10px;border-radius:6px;font-size:12px;outline:none"
              onblur="saveRenewalField('${id}')"
              onchange="saveRenewalField('${id}')">
            ${getRenewal(id)?`<span style="font-size:11px;color:${daysUntil(getRenewal(id))<30?'var(--red)':daysUntil(getRenewal(id))<60?'var(--orange)':'var(--green)'}">⏳ ${daysUntil(getRenewal(id))}d</span>`:''}
            <span id="saved-renewal-${id}" class="saved-tag" style="opacity:0">✓</span>
          </div>
        </div>
        <div style="height:1px;background:var(--border);margin:10px 0;opacity:.5"></div>
        <div class="ficha-row" style="align-items:center">
          <label>💸 Riesgo Financiero</label>
          <div class="val" style="display:flex;align-items:center;gap:8px">
            <select id="rf-sel-${id}" onchange="saveRF('${id}')" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:4px 10px;border-radius:6px;font-size:12px;outline:none">
              <option value="" ${!getRF(id)?'selected':''}>— No evaluado —</option>
              <option value="ok"         ${getRF(id)==='ok'?'selected':''}>🟢 Sin riesgo</option>
              <option value="seguimiento"${getRF(id)==='seguimiento'?'selected':''}>🟡 En seguimiento</option>
              <option value="critico"    ${getRF(id)==='critico'?'selected':''}>🔴 Crítico</option>
            </select>
            <span id="saved-rf-${id}" class="saved-tag" style="opacity:0">✓</span>
          </div>
        </div>
        <div class="ficha-row" style="align-items:center">
          <label>🚀 Onboarding</label>
          <div class="val" style="display:flex;align-items:center;gap:8px">
            <select id="ob-sel-${id}" onchange="saveOB('${id}')" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:4px 10px;border-radius:6px;font-size:12px;outline:none">
              <option value=""          ${!getOB(id)?'selected':''}>— No aplica —</option>
              <option value="proceso"   ${getOB(id)==='proceso'?'selected':''}>🔄 En proceso</option>
              <option value="completado"${getOB(id)==='completado'?'selected':''}>✅ Completado</option>
              <option value="bloqueado" ${getOB(id)==='bloqueado'?'selected':''}>🚧 Bloqueado</option>
            </select>
            <span id="saved-ob-${id}" class="saved-tag" style="opacity:0">✓</span>
          </div>
        </div>
        <div class="ficha-row" style="align-items:center">
          <label>⚡ Adopción Avanzada</label>
          <div class="val" style="display:flex;align-items:center;gap:8px">
            <select id="ap-sel-${id}" onchange="saveAP('${id}')" style="background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:4px 10px;border-radius:6px;font-size:12px;outline:none">
              <option value=""           ${!getAP(id)?'selected':''}>— Sin evaluar —</option>
              <option value="basica"     ${getAP(id)==='basica'?'selected':''}>📦 Básica — solo core</option>
              <option value="intermedia" ${getAP(id)==='intermedia'?'selected':''}>📈 Intermedia — usa módulos</option>
              <option value="avanzada"   ${getAP(id)==='avanzada'?'selected':''}>🏆 Avanzada — AnyTools, IA</option>
            </select>
            <span id="saved-ap-${id}" class="saved-tag" style="opacity:0">✓</span>
          </div>
        </div>
        <div class="ficha-row" style="align-items:center">
          <label>🔗 Integraciones Activas</label>
          <div class="val" style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;flex-wrap:wrap;gap:5px">
              ${(localStorage.getItem('cs-mkt-'+id)||'').split(',').map(m=>m.trim()).filter(Boolean).map(m=>intStChip(id,m)).join('')||'<span style="color:var(--text3);font-size:12px">Sin integraciones registradas</span>'}
            </div>
            <div style="font-size:10px;color:var(--text3)">Clic en cada integración para cambiar estado: ⬜ sin dato → 🟢 ok → ⚠️ alerta → 🔴 crítico</div>
            <input type="text" id="mktInput-${id}" value="${savedMkt}"
              style="background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:4px 10px;border-radius:6px;font-size:12px;width:260px;outline:none"
              placeholder="ML, Falabella, Ripley..."
              onblur="saveMkt('${id}')"
              onkeydown="if(event.key==='Enter'){saveMkt('${id}');this.blur()}">
            <span id="saved-mkt-${id}" class="saved-tag" style="opacity:0">✓ guardado</span>
          </div>
        </div>
      </div>
      <div class="ficha-box">
        <h4>🎫 Ticket Actual</h4>
        ${w.tickets>0?`
          <div style="margin-bottom:10px"><span class="prio-tag p-${w.prioridad||'media'}">${w.prioridad||'media'}</span></div>
          <div style="font-size:13px;font-weight:600;line-height:1.5;margin-bottom:8px">${w.ticketDetalle||'Ver Zendesk'}</div>
          <div style="font-size:12px;color:var(--text2);line-height:1.5"><strong>Causa raíz:</strong> ${w.causaRaiz||'—'}</div>
          ${w.tckFecha?`<div style="font-size:11px;color:var(--text3);margin-top:8px">📅 Abierto: ${fmtD(w.tckFecha)}</div>`:''}
        `:'<div style="color:var(--green);font-size:13px">✅ Sin tickets abiertos</div>'}
        <div style="height:1px;background:var(--border);margin:14px 0;opacity:.5"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <div style="font-size:11px;color:var(--text3);margin-bottom:4px;font-weight:600">Escalamientos a Producto</div>
            <div style="display:flex;align-items:center;gap:6px">
              <input type="number" min="0" id="esc-inp-${id}" value="${getESC(id)}"
                style="background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:6px;font-size:13px;width:70px;outline:none;text-align:center"
                placeholder="0"
                onblur="saveESCField('${id}')"
                onkeydown="if(event.key==='Enter'){saveESCField('${id}');this.blur()}">
              <span id="saved-esc-${id}" class="saved-tag" style="opacity:0">✓</span>
            </div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text3);margin-bottom:4px;font-weight:600">Reincidencias (mismo problema)</div>
            <div style="display:flex;align-items:center;gap:6px">
              <input type="number" min="0" id="rein-inp-${id}" value="${getRein(id)}"
                style="background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:4px 8px;border-radius:6px;font-size:13px;width:70px;outline:none;text-align:center;${parseInt(getRein(id)||0)>=2?'border-color:var(--orange)':''}"
                placeholder="0"
                onblur="saveReinField('${id}')"
                onkeydown="if(event.key==='Enter'){saveReinField('${id}');this.blur()}">
              <span id="saved-rein-${id}" class="saved-tag" style="opacity:0">✓</span>
              ${parseInt(getRein(id)||0)>=2?`<span style="font-size:10px;color:var(--orange);font-weight:700">🔁 Patrón</span>`:''}
            </div>
          </div>
        </div>
      </div>
      <div class="ficha-box">
        <h4>🔁 Patrones de Tickets</h4>
        ${ticketSparkline(id)}
        <div style="font-size:11px;color:var(--text3);margin-bottom:6px;margin-top:8px">📝 Notas de patrones manuales</div>
        <textarea class="ficha-note" id="patterns-${id}" placeholder="Ej: Falla en sincronización de stock en ML cada lunes / Imágenes no actualizan en Walmart / RUT cliente no captura desde Shopify...">${getPatterns(id)}</textarea>
        <div style="display:flex;align-items:center;margin-top:8px">
          <button class="btn btn-ghost" onclick="savePatterns('${id}')" style="font-size:12px">💾 Guardar Patrones</button>
          <span class="saved-tag" id="saved-patterns-${id}" style="opacity:0">✓ Guardado</span>
        </div>
      </div>
      ${hsSection}
      ${actSection}
      <div class="ficha-box" style="grid-column:1/-1">
        <h4>🤝 Compromisos & Notas</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">📋 Compromiso del Cliente</div>
            <textarea class="ficha-note" id="comp-cli-${id}" style="min-height:72px" placeholder="Ej: Enviar acceso ERP antes del viernes / Confirmar go-live con equipo TI el 20 jul...">${getCompCli(id)}</textarea>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">🏢 Compromiso DB1</div>
            <textarea class="ficha-note" id="comp-db1-${id}" style="min-height:72px" placeholder="Ej: Enviar propuesta de expansión antes del jueves / Resolver bug #35652 en máx 48h...">${getCompDB1(id)}</textarea>
          </div>
        </div>
        <div style="display:flex;align-items:center;margin-bottom:14px">
          <button class="btn btn-ghost" onclick="saveCompromisos('${id}')" style="font-size:12px">💾 Guardar Compromisos</button>
          <span class="saved-tag" id="saved-comp-${id}" style="opacity:0">✓ Guardado</span>
        </div>
        <div style="height:1px;background:var(--border);margin-bottom:12px;opacity:.5"></div>
        <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">📝 Notas de Acción & Observaciones</div>
        <textarea class="ficha-note" id="fichaNote" placeholder="Próximos pasos, observaciones estratégicas, contexto de la cuenta...">${savedNote}</textarea>
        <div style="display:flex;align-items:center;margin-top:8px">
          <button class="btn btn-ghost" onclick="saveFichaNote('${id}')" style="font-size:12px">Guardar Nota</button>
          <span class="saved-tag" id="saved-ficha">✓ Guardado</span>
        </div>
      </div>
    </div>`;
}

// exposed for inline HTML handlers
// (renderFicha is invoked directly from static HTML: <select id="fichaSelect" onchange="renderFicha()">
// and from other pages' row templates, e.g. ui/catalogo.js's onclick="...;renderFicha()")
window.renderFicha = renderFicha;
