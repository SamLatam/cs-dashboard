// ── ACCIONES (Gestión de Acciones) ──────────────────────────────────────────────
// Extracted verbatim from index.html. Full range spans several non-contiguous
// regions of the original monolith; each function's source line range is noted
// individually below (all verified by reading the ground-truth file directly,
// not by trusting the task brief's approximate estimates):
//   accionView (module state)          3841
//   setAccView                          3842-3849
//   renderTimeline                      3850-3914
//   toggleBottleneck                    3915
//   filterActions                       3916-3930
//   renderAcciones                       3931-4016
//   openAddAction                        4017-4027
//   openEditAction                       4028-4039
//   closeAddAction                        4059
//   closeAddActionModal                  4060
//   toggleThisWeek                        4280-4286
//   toggleOverdue                         4288-4294
// filterBottleneckOnly/filterThisWeek/filterOverdue (module state) were originally
// declared far earlier in the monolith (index.html:2470-2472, `let
// filterBottleneckOnly = false; let filterThisWeek = false; let filterOverdue =
// false;`) — hoisted here since they belong exclusively to this page's filter logic
// and have no other consumers (confirmed via whole-file grep).
//
// NOTE ON SCOPE BOUNDARY: saveAction, deleteCurrentAction, quickSaveAction,
// quickSaveNote, toggleActionNotes (index.html:4040-4058, 4062-4088) are NOT
// duplicated here even though they sit between renderAcciones/openEditAction and
// toggleThisWeek/toggleOverdue in the original file — they were already extracted
// verbatim (byte-for-byte, including their window-attach block) into
// src/services/actions-repo.js by a concurrent agent. They are referenced here only
// as onclick="..." string literals inside generated HTML (openAddActionModal /
// renderAcciones templates), which resolve against the global `window` at click
// time and require no import.
//
// Also NOT duplicated here (they sit in the same 4060-4318 source region but belong
// to other already-extracted files, confirmed by grep/read): openImport/
// closeImport/processImport/clearAllData (src/services/import-export.js),
// loadNotes/saveNote (src/services/notes-repo.js), registrarContacto
// (src/services/clients-repo.js), exportarJSON (src/services/import-export.js),
// generarResumen/copiarResumen/copiarPromptClaude (belong to a "resumen" UI concern,
// not part of this agent's assigned scope), uid/norm/today/daysSince/daysUntil/fmtG/
// fmtD (src/lib/format.js), porteBadge/segBadge/tipoChamadoBadge/
// presenciaReunBadge/calcTendencia/tendenciaLabel/segPorteRow (src/lib/dom.js),
// LC_STAGES et al. (src/domain/lifecycle.js — starts immediately after this file's
// scope at index.html:4318).
//
// ASSUMED CROSS-FILE IMPORTS (sibling files did not exist yet at extraction time —
// verify these during integration):
//   - getActions, setActions       from '../services/actions-repo.js' (confirmed exports)
//   - PORT                         from '../services/clients-repo.js' (confirmed export)
//   - getVisibleClientIds          from '../services/profiles-repo.js' -- GUESSED, same
//     basis as src/services/clients-repo.js / src/services/actions-repo.js, both of
//     which already import getVisibleClientIds from './profiles-repo.js'.
//   - fmtD, today                  from '../lib/format.js' (confirmed exports)
import { getActions, setActions } from '../services/actions-repo.js';
import { PORT } from '../services/clients-repo.js';
import { getVisibleClientIds } from '../services/profiles-repo.js';
import { fmtD, today } from '../lib/format.js';

// ── ACCIONES ───────────────────────────────────────────────────────────────────
let accionView = 'kanban';
let filterBottleneckOnly = false;
let filterThisWeek = false;
let filterOverdue = false;

function setAccView(v) {
  accionView = v;
  document.getElementById('view-kanban').classList.toggle('active', v==='kanban');
  document.getElementById('view-timeline').classList.toggle('active', v==='timeline');
  document.getElementById('accion-kanban-view').style.display  = v==='kanban'  ? '' : 'none';
  document.getElementById('accion-timeline-view').style.display = v==='timeline' ? '' : 'none';
  renderAcciones();
}
function renderTimeline(list) {
  const now = Date.now();
  const groups = [
    {key:'overdue', label:'🔴 Vencidas',    color:'var(--red)',    items:[]},
    {key:'today',   label:'🔥 Hoy',          color:'var(--orange)', items:[]},
    {key:'week',    label:'📅 Esta semana',  color:'var(--yellow)', items:[]},
    {key:'next',    label:'🗓 Próxima semana',color:'var(--accent)', items:[]},
    {key:'later',   label:'⏳ Más adelante', color:'var(--text3)',  items:[]},
    {key:'nodate',  label:'📌 Sin fecha',    color:'var(--text3)',  items:[]},
  ];
  list.filter(a=>a.status!=='resuelto').forEach(a=>{
    if(!a.dueDate){groups[5].items.push(a);return;}
    const d = Math.round((new Date(a.dueDate+'T12:00:00')-now)/86400000);
    if(d<0)groups[0].items.push(a);
    else if(d===0)groups[1].items.push(a);
    else if(d<=7)groups[2].items.push(a);
    else if(d<=14)groups[3].items.push(a);
    else groups[4].items.push(a);
  });
  const prioO={critica:0,alta:1,media:2,baja:3};
  const tipoIcon={soporte:'🎫',cs:'🤝',pm:'📋'};
  let html='';
  groups.forEach(g=>{
    if(!g.items.length)return;
    g.items.sort((a,b)=>(prioO[a.priority]??3)-(prioO[b.priority]??3));
    html+=`<div style="margin-bottom:24px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div style="width:4px;height:20px;background:${g.color};border-radius:2px"></div>
        <span style="font-size:13px;font-weight:700;color:var(--text)">${g.label}</span>
        <span style="font-size:11px;font-weight:700;background:var(--surface2);color:var(--text2);padding:2px 8px;border-radius:10px">${g.items.length}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
      ${g.items.map(a=>{
        const cl=PORT.find(p=>p.id===a.clientId);
        const cn=cl?cl.name:'—';
        const dStr=a.dueDate?fmtD(a.dueDate):'';
        const d=a.dueDate?Math.round((new Date(a.dueDate+'T12:00:00')-now)/86400000):null;
        const dCol=d!=null?(d<0?'var(--red)':d<=3?'var(--yellow)':'var(--text3)'):'var(--text3)';
        const statusDot={bloqueado:'var(--red)','en-progreso':'var(--accent)','por-hacer':'var(--text3)',resuelto:'var(--green)'}[a.status]||'var(--text3)';
        return `<div style="background:var(--surface);border:1px solid var(--border);border-left:3px solid ${g.color};border-radius:8px;padding:12px 16px;display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:start;cursor:pointer" onclick="openEditAction('${a.id}')">
          <div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding-top:2px">
            <span style="font-size:15px">${tipoIcon[a.tipo||'soporte']}</span>
            <div style="width:8px;height:8px;border-radius:50%;background:${statusDot}"></div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--accent);font-weight:600;margin-bottom:3px">${cn}</div>
            <div style="font-size:13px;font-weight:600;line-height:1.4;margin-bottom:6px">${a.title}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
              <span class="prio-tag p-${a.priority}">${a.priority}</span>
              ${a.bottleneck?'<span class="bottle-tag">🚧 Cuello de botella</span>':''}
              <span style="font-size:11px;color:var(--text2)">${a.status.replace('-',' ')}</span>
            </div>
            ${a.causa?`<div style="font-size:11px;color:var(--text3);margin-top:6px;line-height:1.4">⚠ ${a.causa.length>90?a.causa.slice(0,88)+'…':a.causa}</div>`:''}
          </div>
          <div style="text-align:right;white-space:nowrap">
            ${dStr?`<div style="font-size:12px;font-weight:600;color:${dCol}">📅 ${dStr}</div>`:''}
            ${d!=null?`<div style="font-size:10px;color:${dCol};margin-top:2px">${d<0?Math.abs(d)+'d vencida':d===0?'Hoy':d+'d restantes'}</div>`:''}
          </div>
        </div>`;
      }).join('')}
      </div>
    </div>`;
  });
  document.getElementById('timeline-content').innerHTML = html || '<div class="empty">Sin acciones para los filtros seleccionados.</div>';
}
function toggleBottleneck(el){filterBottleneckOnly=!filterBottleneckOnly;el.classList.toggle('active',filterBottleneckOnly);renderAcciones();}
function filterActions(extraPredicate) {
  const cf=document.getElementById('filterCliente')?.value||'';
  const pf=document.getElementById('filterPrioridad')?.value||'';
  const visIds = getVisibleClientIds();
  return getActions().filter(a=>{
    if(!visIds.includes(a.clientId))return false;
    if(cf&&a.clientId!==cf)return false;
    if(pf&&a.priority!==pf)return false;
    if(filterBottleneckOnly&&!a.bottleneck)return false;
    if(filterThisWeek){ const d=a.dueDate?Math.round((new Date(a.dueDate)-Date.now())/86400000):null; if(d===null||d<0||d>7)return false; }
    if(filterOverdue){ if(!a.dueDate||new Date(a.dueDate)>=new Date(today()))return false; }
    if(extraPredicate&&!extraPredicate(a))return false;
    return true;
  });
}
function renderAcciones() {
  const visIds = getVisibleClientIds();
  // Hard isolation: strip any action that doesn't belong to this user's visible clients
  setActions(getActions().filter(a => visIds.includes(a.clientId)));
  const visActions = getActions().filter(a => visIds.includes(a.clientId));
  document.getElementById('ak-total').textContent=visActions.filter(a=>a.status!=='resuelto').length;
  document.getElementById('ak-block').textContent=visActions.filter(a=>a.status==='bloqueado').length;
  document.getElementById('ak-prog').textContent =visActions.filter(a=>a.status==='en-progreso').length;
  document.getElementById('ak-done').textContent =visActions.filter(a=>a.status==='resuelto').length;
  if(accionView==='timeline'){ renderTimeline(filterActions()); return; }
  const cols=[{key:'por-hacer',label:'Por Hacer',emoji:'📌',cls:'k-ph'},{key:'en-progreso',label:'En Progreso',emoji:'⚡',cls:'k-ep'},{key:'bloqueado',label:'Bloqueado',emoji:'🚧',cls:'k-bl'},{key:'resuelto',label:'Resuelto',emoji:'✅',cls:'k-rs'}];
  const prioO={critica:0,alta:1,media:2,baja:3};
  ['soporte','cs','pm'].forEach(tipo=>{
    const list=filterActions(a=>(a.tipo||'soporte')===tipo);
    const activas=list.filter(a=>a.status!=='resuelto').length;
    const cntEl=document.getElementById('tcnt-'+tipo);
    if(cntEl)cntEl.textContent=activas+' activa'+(activas!==1?'s':'');
    const board=document.getElementById('kanban-'+tipo);
    if(!board)return;
    board.innerHTML=cols.map(col=>{
      const items=list.filter(a=>a.status===col.key).sort((a,b)=>(prioO[a.priority]??3)-(prioO[b.priority]??3));
      const cards=items.map(a=>{
        const cl=PORT.find(p=>p.id===a.clientId);
        const cn=cl?cl.name.split(' ').slice(0,3).join(' '):a.clientId;
        const dueHtml=a.dueDate?(()=>{const d=Math.round((new Date(a.dueDate)-Date.now())/86400000);return`<span class="${d<0?'due-over':d<=3?'due-warn':'due-ok'}">📅 ${fmtD(a.dueDate)}${d<0?' (vencida)':d===0?' (hoy)':''}</span>`;})():'';
        let subtasksHtml = '';
        if (a.subtasks && a.subtasks.length) {
          const stTotal = a.subtasks.length;
          const stBlq   = a.subtasks.filter(s=>s.status==='Bloqueado').length;
          const stCurso = a.subtasks.filter(s=>s.status==='En curso').length;
          const stPend  = a.subtasks.filter(s=>s.status==='Pendiente'||s.status==='Dependiente').length;
          subtasksHtml = `<div style="margin-top:8px;border-top:1px solid var(--border);padding-top:8px;">
            <div style="font-size:10px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Sub-tareas (${stTotal})</div>
            <div style="display:flex;gap:6px;margin-bottom:6px;">
              ${stBlq?`<span style="background:#e74c3c22;color:#e74c3c;border-radius:10px;padding:1px 8px;font-size:10px;font-weight:700;">🚧 ${stBlq} bloqueada${stBlq>1?'s':''}</span>`:''}
              ${stCurso?`<span style="background:#f39c1222;color:#f39c12;border-radius:10px;padding:1px 8px;font-size:10px;font-weight:700;">⚡ ${stCurso} en curso</span>`:''}
              ${stPend?`<span style="background:#4a557822;color:var(--text2);border-radius:10px;padding:1px 8px;font-size:10px;font-weight:700;">📌 ${stPend} pendiente${stPend>1?'s':''}</span>`:''}
            </div>
            <table style="width:100%;border-collapse:collapse;">
              ${a.subtasks.map(s=>{
                const sc = s.status==='Bloqueado'?'#e74c3c':s.status==='En curso'?'#f39c12':s.status==='Dependiente'?'#9b59b6':'var(--text3)';
                return `<tr style="border-bottom:1px solid var(--border);">
                  <td style="padding:4px 6px;font-size:11px;">${s.accion}</td>
                  <td style="padding:4px 6px;font-size:10px;color:var(--text2);white-space:nowrap;">${s.responsable}</td>
                  <td style="padding:4px 6px;font-size:10px;color:${sc};font-weight:700;white-space:nowrap;">${s.status}</td>
                  <td style="padding:4px 6px;font-size:10px;white-space:nowrap;">${s.pmi}</td>
                </tr>`;
              }).join('')}
            </table>
          </div>`;
        }
        return `<div class="acard${a.bottleneck?' bottleneck':''}${a.subtasks?' has-subtasks':''}" data-aid="${a.id}">
          <div class="acard-client" onclick="openEditAction('${a.id}')">🏢 ${cn.length>26?cn.slice(0,24)+'…':cn}</div>
          <div class="acard-title" onclick="openEditAction('${a.id}')">${a.title}</div>
          ${a.bottleneck?'<span class="bottle-tag">🚧 Cuello de botella</span>':''}
          <div class="acard-meta" onclick="openEditAction('${a.id}')"><span class="prio-tag p-${a.priority}">${a.priority}</span>${dueHtml}</div>
          ${a.causa?`<div class="acard-causa" onclick="openEditAction('${a.id}')">⚠ ${a.causa.length>80?a.causa.slice(0,78)+'…':a.causa}</div>`:''}
          ${subtasksHtml}
          <div class="acard-status-bar" onclick="event.stopPropagation()">
            <button class="acs-btn acs-ph${a.status==='por-hacer'?' acs-on':''}" onclick="quickSaveAction('${a.id}','status','por-hacer')">📋 Pendiente</button>
            <button class="acs-btn acs-ep${a.status==='en-progreso'?' acs-on':''}" onclick="quickSaveAction('${a.id}','status','en-progreso')">⚡ En Progreso</button>
            <button class="acs-btn acs-bl${a.status==='bloqueado'?' acs-on':''}" onclick="quickSaveAction('${a.id}','status','bloqueado')">🚧 Estancada</button>
            <button class="acs-btn acs-rs${a.status==='resuelto'?' acs-on':''}" onclick="quickSaveAction('${a.id}','status','resuelto')">✅ Resuelta</button>
          </div>
          <div class="acard-quick-row" onclick="event.stopPropagation()">
            <button class="acs-btn acs-bottle${a.bottleneck?' acs-on':''}" onclick="quickSaveAction('${a.id}','bottleneck',${!a.bottleneck})">${a.bottleneck?'🚧 Bloqueante':'⚪ Sin bloqueo'}</button>
            <button class="acs-btn" id="notebtn-${a.id}" onclick="toggleActionNotes('${a.id}')">${a.notes?'📝 Ver nota':'📝 + Nota'}</button>
            <button class="acs-btn" onclick="openEditAction('${a.id}')" style="margin-left:auto">✏️ Detalle</button>
          </div>
          <div class="acard-notes-panel${a.notes?' open':''}" id="anp-${a.id}" onclick="event.stopPropagation()">
            <textarea id="anotes-${a.id}" placeholder="Avance, obstáculos, próximos pasos...">${a.notes||''}</textarea>
            <div class="acard-save-row">
              <button onclick="quickSaveNote('${a.id}')" style="flex:1;background:var(--accent);color:#fff;border:none;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer">💾 Guardar</button>
              <button onclick="toggleActionNotes('${a.id}')" style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:5px 10px;font-size:11px;cursor:pointer">✕</button>
            </div>
          </div>
        </div>`;
      }).join('');
      return `<div class="kcol ${col.cls}">
        <div class="kcol-header"><span class="kcol-title">${col.emoji} ${col.label}</span><span class="kcol-cnt">${items.length}</span></div>
        ${cards||'<div style="color:var(--text3);font-size:12px;text-align:center;padding:16px 0">Sin acciones</div>'}
        <button class="add-col-btn" onclick="event.stopPropagation();openAddAction(null,'${col.key}','${tipo}')">+ Agregar</button>
      </div>`;
    }).join('');
  });
}
function openAddAction(cId,defStatus,defTipo){
  document.getElementById('addActionTitle').textContent='Nueva Acción';
  document.getElementById('editActionId').value='';
  document.getElementById('fa-tipo').value=defTipo||'soporte';
  document.getElementById('fa-client').innerHTML=PORT.filter(p=>getVisibleClientIds().includes(p.id)).map(p=>`<option value="${p.id}"${p.id===cId?' selected':''}>${p.name}</option>`).join('');
  document.getElementById('fa-title').value='';document.getElementById('fa-desc').value='';document.getElementById('fa-causa').value='';
  document.getElementById('fa-status').value=defStatus||'por-hacer';document.getElementById('fa-priority').value='media';
  document.getElementById('fa-due').value='';document.getElementById('fa-bottleneck').checked=false;document.getElementById('fa-notes').value='';
  document.getElementById('deleteActionBtn').style.display='none';
  document.getElementById('addActionOverlay').classList.add('open');
}
function openEditAction(id){
  const a=getActions().find(x=>x.id===id);if(!a)return;
  document.getElementById('addActionTitle').textContent='Editar Acción';
  document.getElementById('editActionId').value=id;
  document.getElementById('fa-tipo').value=a.tipo||'soporte';
  document.getElementById('fa-client').innerHTML=PORT.filter(p=>getVisibleClientIds().includes(p.id)).map(p=>`<option value="${p.id}"${p.id===a.clientId?' selected':''}>${p.name}</option>`).join('');
  document.getElementById('fa-title').value=a.title||'';document.getElementById('fa-desc').value=a.desc||'';document.getElementById('fa-causa').value=a.causa||'';
  document.getElementById('fa-status').value=a.status||'por-hacer';document.getElementById('fa-priority').value=a.priority||'media';
  document.getElementById('fa-due').value=a.dueDate||'';document.getElementById('fa-bottleneck').checked=!!a.bottleneck;document.getElementById('fa-notes').value=a.notes||'';
  document.getElementById('deleteActionBtn').style.display='flex';
  document.getElementById('addActionOverlay').classList.add('open');
}
function closeAddAction(e){if(e.target===document.getElementById('addActionOverlay'))closeAddActionModal();}
function closeAddActionModal(){document.getElementById('addActionOverlay').classList.remove('open');}

function toggleThisWeek(el) {
  filterThisWeek = !filterThisWeek;
  if (filterThisWeek) filterOverdue = false;
  el.classList.toggle('active', filterThisWeek);
  document.getElementById('filterOverdue')?.classList.toggle('active', false);
  renderAcciones();
}

function toggleOverdue(el) {
  filterOverdue = !filterOverdue;
  if (filterOverdue) filterThisWeek = false;
  el.classList.toggle('active', filterOverdue);
  document.getElementById('filterThisWeek')?.classList.toggle('active', false);
  renderAcciones();
}

// exposed for inline HTML handlers (confirmed via full-file grep of index.html for
// on(click|change|blur|keydown|input|focus)="..." referencing each of these names):
//   renderAcciones      — onchange="renderAcciones()" (static #filterCliente/#filterPrioridad
//                         selects, index.html:809/812)
//   setAccView          — onclick="setAccView('kanban'|'timeline')" (static view-tab divs,
//                         index.html:826-827)
//   toggleBottleneck    — onclick="toggleBottleneck(this)" (static #filterBottleneck chip,
//                         index.html:819)
//   toggleThisWeek      — onclick="toggleThisWeek(this)" (static #filterThisWeek chip,
//                         index.html:820)
//   toggleOverdue       — onclick="toggleOverdue(this)" (static #filterOverdue chip,
//                         index.html:821)
//   openAddAction       — onclick="openAddAction(null)" (static "+ Nueva Acción" buttons,
//                         index.html:671/822) and "+ Agregar" per-column buttons built by
//                         this file's own renderAcciones template
//   openEditAction      — onclick="openEditAction('<id>')" (this file's own renderTimeline/
//                         renderAcciones templates, and src/ui/ficha.js's ficha-accion rows)
//   closeAddAction      — onclick="closeAddAction(event)" (static #addActionOverlay,
//                         index.html:7306)
//   closeAddActionModal — onclick="closeAddActionModal()" (static modal-close/cancel
//                         buttons, index.html:7308/7371; also called as a direct JS
//                         function call from src/services/actions-repo.js's
//                         saveAction()/deleteCurrentAction() — that cross-file import is
//                         a known placeholder ('../ui/render.js') left for the
//                         integration pass to repoint at this file)
// renderTimeline and filterActions are internal helpers only ever called from within
// this file (renderAcciones) — no inline onclick/onchange references them anywhere in
// index.html (verified via the same grep), so they are not window-attached.
window.renderAcciones = renderAcciones;
window.setAccView = setAccView;
window.toggleBottleneck = toggleBottleneck;
window.toggleThisWeek = toggleThisWeek;
window.toggleOverdue = toggleOverdue;
window.openAddAction = openAddAction;
window.openEditAction = openEditAction;
window.closeAddAction = closeAddAction;
window.closeAddActionModal = closeAddActionModal;

export {
  renderAcciones, setAccView, renderTimeline, toggleBottleneck, filterActions,
  openAddAction, openEditAction, closeAddAction, closeAddActionModal,
  toggleThisWeek, toggleOverdue
};
