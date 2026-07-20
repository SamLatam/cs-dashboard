// ── FICHA DE CLIENTE (per-client detail view) ───────────────────────────────────
// Extracted verbatim from index.html (source lines 3271-3460):
//   renderFicha        3271-3418
//   saveFichaNote       3419-3422
//   saveMkt             3423-3428
//   editMktInline       3429-3437
//   saveMktInline       3438-3453
//   closeMktInline      3454-3460
// Verified by brace-matching: renderFicha opens at 3271 `function renderFicha() {`
// and its matching closing `}` is line 3418, immediately followed by
// `function saveFichaNote(id) {` at 3419 — confirmed complete, not truncated.
//
// editMktInline/saveMktInline/closeMktInline are the inline-edit handlers for the
// "Marketplaces Activos" cell in the Catálogo table (src/ui/catalogo.js renders the
// `mkt-display-*`/`mkt-input-*` DOM nodes and calls these by name in onclick/onblur/
// onkeydown strings — confirmed by catalogo.js's own header comment: "editMktInline/
// saveMktInline/closeMktInline are this agent's own, defined in ficha.js"). They are
// grouped here with saveMkt (the ficha-page marketplaces input) because all four
// read/write the same `cs-mkt-<id>` localStorage key and were contiguous in source.
//
// ASSUMED CROSS-FILE IMPORTS (sibling files did not exist yet at extraction time —
// verify these during integration):
//   - getClients                                  from '../services/clients-repo.js' (confirmed export)
//   - getActions                                  from '../services/actions-repo.js' (confirmed export)
//   - calcHS, hpEmoji, hpLabel                     from '../domain/health-score.js'   (confirmed exports)
//   - LC_STAGES, getLifecycle, buildPlaybook       from '../domain/lifecycle.js'      (confirmed exports)
//   - getMRR, getRenewal                           from '../domain/renewal-revenue.js'(confirmed exports)
//   - ticketSparkline                              from '../domain/ticket-patterns.js'(confirmed export)
//   - segBadge, porteBadge, tipoChamadoBadge,
//     presenciaReunBadge, tendenciaLabel           from '../lib/dom.js'               (confirmed exports)
//   - fmtG, fmtD, daysSince, daysUntil             from '../lib/format.js'            (confirmed exports)
//   - getMood, MOODS, getPatterns                  from '../services/client-state-repo.js' -- GUESSED.
//     This sibling file did not exist at extraction time. Source definitions (index.html):
//     `const MOODS = {...}` line 2346, `function getMood(id)` line 2347,
//     `function saveMood(id,val)` line 2348, `function getPatterns(id)` line 2363,
//     `function savePatterns(id)` line 2364. Per this task's brief, client-state-repo.js
//     is expected to own getMood/saveMood-style accessors, so MOODS/getPatterns are
//     assumed to live alongside them. saveMood/savePatterns are NOT imported here — they
//     are only ever referenced inside onclick="..." strings (resolved at click time via
//     whichever module window-attaches them), never called as bare JS identifiers in this
//     file.
import { getClients } from '../services/clients-repo.js';
import { getActions } from '../services/actions-repo.js';
import { calcHS, hpEmoji, hpLabel } from '../domain/health-score.js';
import { LC_STAGES, getLifecycle, buildPlaybook } from '../domain/lifecycle.js';
import { getMRR } from '../domain/renewal-revenue.js';
import { ticketSparkline } from '../domain/ticket-patterns.js';
import { segBadge, porteBadge, tipoChamadoBadge, presenciaReunBadge, tendenciaLabel } from '../lib/dom.js';
import { fmtG, fmtD, daysSince } from '../lib/format.js';
import { getMood, MOODS, getPatterns } from '../services/client-state-repo.js';
import { getEngagementProfile, ANYTOOLS_FEATURES, engagementBadgeColor } from '../domain/engagement.js';

function renderFicha() {
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
      <h4>Health Score — ${h.score}/100 ${hpEmoji(h.cl)} ${hpLabel(h.cl)}</h4>
      ${Object.entries(h.comps).map(([k,v])=>`
        <div class="hs-comp-row">
          <span class="hs-comp-label">${v.label} (${Math.round(v.weight*100)}%)</span>
          <div class="hs-comp-track"><div class="hs-comp-fill" style="width:${v.score}%;background:${v.score>=80?'var(--green)':v.score>=60?'var(--yellow)':v.score>=40?'var(--orange)':'var(--red)'}"></div></div>
          <span class="hs-comp-val">${Math.round(v.score)}</span>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:8px;padding-left:140px">→ ${v.raw}</div>`).join('')}
    </div>`;
  }

  // ── ENGAGEMENT SCORE (frecuencia · intensidad · features · casos de uso) ──
  const eng = getEngagementProfile(c, savedMkt);
  const engFeats = new Set((w.features) || []);
  const engSection = `<div class="ficha-box" style="grid-column:1/-1">
    <h4>🔥 Engagement — <span style="color:${engagementBadgeColor(eng.segment)}">${eng.label}</span>
      ${eng.confidence ? `<span style="font-size:10px;color:var(--text3);font-weight:400;margin-left:8px">confianza: ${eng.confidence === 'high' ? 'alta' : eng.confidence === 'medium' ? 'media' : 'baja'}</span>` : ''}
    </h4>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:12px">
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;font-weight:700;margin-bottom:4px">Frecuencia</div>
        <div style="font-size:14px;font-weight:700">${eng.frequency.label}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${eng.frequency.detail}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;font-weight:700;margin-bottom:4px">Intensidad (Use Points)</div>
        <div style="font-size:14px;font-weight:700">${eng.intensity.label}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${eng.intensity.detail}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;font-weight:700;margin-bottom:4px">Features (suite AnyTools)</div>
        <div style="font-size:14px;font-weight:700">${eng.features.label}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${eng.features.detail}</div>
      </div>
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px 12px">
        <div style="font-size:10px;color:var(--text3);text-transform:uppercase;font-weight:700;margin-bottom:4px">Casos de Uso (marketplaces)</div>
        <div style="font-size:14px;font-weight:700">${eng.useCase.label}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">${eng.useCase.detail}</div>
      </div>
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:11px;color:var(--text3);font-weight:700;text-transform:uppercase;margin-bottom:6px">Adopción suite AnyTools</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${ANYTOOLS_FEATURES.map(f => `<button class="btn ${engFeats.has(f.key) ? '' : 'btn-ghost'}" onclick="toggleFeature('${id}','${f.key}')"
          style="font-size:11px;padding:5px 12px;${engFeats.has(f.key) ? 'background:rgba(34,197,94,.15);color:var(--green);border:1px solid rgba(34,197,94,.3)' : ''}"
          title="${f.desc}">${engFeats.has(f.key) ? '✓ ' : '+ '}${f.label}</button>`).join('')}
      </div>
    </div>
    ${eng.reasons.length ? `<div style="font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:${eng.recommendations.length ? '10px' : '0'}">
      ${eng.reasons.map(r => `→ ${r}`).join('<br>')}
    </div>` : ''}
    ${eng.recommendations.length ? `<div style="background:rgba(79,142,247,.06);border:1px solid rgba(79,142,247,.2);border-radius:8px;padding:10px 12px">
      <div style="font-size:10px;color:var(--text3);text-transform:uppercase;font-weight:700;margin-bottom:6px">💡 Cómo generar más engagement</div>
      <div style="font-size:12px;color:var(--text);line-height:1.7">${eng.recommendations.map(r => `→ ${r}`).join('<br>')}</div>
    </div>` : ''}
  </div>`;

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
          <label>Marketplaces Activos</label>
          <div class="val" style="display:flex;align-items:center;gap:6px">
            <input type="text" id="mktInput-${id}" value="${savedMkt}"
              style="background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:4px 10px;border-radius:6px;font-size:12px;width:220px;outline:none"
              placeholder="ML, Falabella, Ripley..."
              onblur="saveMkt('${id}')"
              onkeydown="if(event.key==='Enter'){saveMkt('${id}');this.blur()}">
            <span id="saved-mkt-${id}" class="saved-tag" style="opacity:0">✓ guardado</span>
          </div>
        </div>
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
      </div>
      <div class="ficha-box">
        <h4>🎫 Ticket Actual</h4>
        ${w.tickets>0?`
          <div style="margin-bottom:10px"><span class="prio-tag p-${w.prioridad||'media'}">${w.prioridad||'media'}</span></div>
          <div style="font-size:13px;font-weight:600;line-height:1.5;margin-bottom:8px">${w.ticketDetalle||'Ver Zendesk'}</div>
          <div style="font-size:12px;color:var(--text2);line-height:1.5"><strong>Causa raíz:</strong> ${w.causaRaiz||'—'}</div>
          ${w.tckFecha?`<div style="font-size:11px;color:var(--text3);margin-top:8px">📅 Abierto: ${fmtD(w.tckFecha)}</div>`:''}
        `:'<div style="color:var(--green);font-size:13px">✅ Sin tickets abiertos</div>'}
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
      ${engSection}
      ${actSection}
      <div class="ficha-box" style="grid-column:1/-1">
        <h4>📝 Notas de Acción</h4>
        <textarea class="ficha-note" id="fichaNote" placeholder="Próximos pasos, compromisos, observaciones específicas...">${savedNote}</textarea>
        <div style="display:flex;align-items:center;margin-top:8px">
          <button class="btn btn-ghost" onclick="saveFichaNote('${id}')" style="font-size:12px">Guardar Nota</button>
          <span class="saved-tag" id="saved-ficha">✓ Guardado</span>
        </div>
      </div>
    </div>`;
}
function saveFichaNote(id) {
  localStorage.setItem('cs-note-' + id, document.getElementById('fichaNote').value);
  const t = document.getElementById('saved-ficha'); t.style.opacity=1; setTimeout(()=>t.style.opacity=0,2000);
}
function saveMkt(id) {
  const val = document.getElementById('mktInput-' + id)?.value || '';
  localStorage.setItem('cs-mkt-' + id, val);
  const t = document.getElementById('saved-mkt-' + id);
  if (t) { t.style.opacity=1; setTimeout(()=>t.style.opacity=0,2000); }
}
function editMktInline(id) {
  const disp = document.getElementById('mkt-display-' + id);
  const inp  = document.getElementById('mkt-input-' + id);
  if (!disp || !inp) return;
  disp.style.display = 'none';
  inp.style.display  = 'block';
  inp.focus();
  inp.select();
}
function saveMktInline(id) {
  const inp  = document.getElementById('mkt-input-' + id);
  const disp = document.getElementById('mkt-display-' + id);
  if (!inp || !disp) return;
  const val = inp.value.trim();
  localStorage.setItem('cs-mkt-' + id, val);
  // También sync en ficha si está abierta
  const fichaInp = document.getElementById('mktInput-' + id);
  if (fichaInp) fichaInp.value = val;
  // Re-render chips
  const chips = val.split(',').map(m=>m.trim()).filter(Boolean)
    .map(m=>`<span style="background:rgba(79,142,247,.12);color:var(--accent);font-size:10px;padding:2px 6px;border-radius:4px;font-weight:600">${m}</span>`).join('');
  disp.innerHTML = chips || '<span style="color:var(--text3);font-size:11px">+ agregar</span>';
  inp.style.display  = 'none';
  disp.style.display = 'flex';
}
function closeMktInline(id) {
  const inp  = document.getElementById('mkt-input-' + id);
  const disp = document.getElementById('mkt-display-' + id);
  if (!inp || !disp) return;
  inp.style.display  = 'none';
  disp.style.display = 'flex';
}

// exposed for inline HTML handlers (confirmed via full-file grep of index.html for
// on(click|change|blur|keydown)="..." referencing each of these names):
//   renderFicha      — onchange="renderFicha()" (static #fichaSelect) + inline row
//                       onclick built by src/ui/catalogo.js's table rows
//   saveFichaNote    — onclick="saveFichaNote('<id>')" (this file's own template)
//   saveMkt          — onblur/onkeydown="saveMkt('<id>')" (this file's own template)
//   editMktInline    — onclick="editMktInline('<id>')" (src/ui/catalogo.js's mktCell)
//   saveMktInline    — onblur/onkeydown="saveMktInline('<id>')" (catalogo.js's mktCell)
//   closeMktInline   — onkeydown Escape="closeMktInline('<id>')" (catalogo.js's mktCell)
window.renderFicha = renderFicha;
window.saveFichaNote = saveFichaNote;
window.saveMkt = saveMkt;
window.editMktInline = editMktInline;
window.saveMktInline = saveMktInline;
window.closeMktInline = closeMktInline;

export { renderFicha, saveFichaNote, saveMkt, editMktInline, saveMktInline, closeMktInline };
