import { getActions, setActions, saveActions } from '../services/actions-repo.js';
// ASSUMPTION: SEED_ACTIONS (the seed action list) and markSeedAsDeleted() live in
// actions-repo.js alongside getActions/setActions/saveActions — confirmed plausible since the
// source defines them a few lines apart (markSeedAsDeleted, mergeSeedActions, saveActions all
// within the same "ACTIONS load/save" block). Not explicitly named in this agent's import map.
import { SEED_ACTIONS, markSeedAsDeleted } from '../services/actions-repo.js';
import { getVisibleClientIds } from '../services/profiles-repo.js';
import { PORT } from '../services/clients-repo.js';
import { uid, today, fmtD } from '../lib/format.js';
// ASSUMPTION: scheduleGistSave (debounced cloud/Gist sync) was not in this agent's import map
// at all. Source defines it near other Gist-sync helpers (doGistSave, updateCloudIndicator,
// GH_TOKEN_KEY) with no obvious owner among the given files — guessing a dedicated
// services/gist-sync.js. Flagged prominently for reconciliation.
import { scheduleGistSave } from '../services/gist-sync.js';
// closeAlertDetailPanel is called directly (not just referenced in an inline onclick string)
// from openNewActionForClient()'s JS body below, so it must be a real import, not just a
// window-global reference.
import { closeAlertDetailPanel } from './alertas.js';

// ── ACCIONES ───────────────────────────────────────────────────────────────────
export let accionView = 'kanban';
// State: acciones-page filters (module-local; originally declared alongside overview.js's
// sortKey/activeFilter in the source's single global scope — split per file assignment)
export let filterBottleneckOnly = false;
export let filterThisWeek = false;
export let filterOverdue = false;

export function setAccView(v) {
  accionView = v;
  document.getElementById('view-kanban').classList.toggle('active', v==='kanban');
  document.getElementById('view-timeline').classList.toggle('active', v==='timeline');
  document.getElementById('accion-kanban-view').style.display  = v==='kanban'  ? '' : 'none';
  document.getElementById('accion-timeline-view').style.display = v==='timeline' ? '' : 'none';
  renderAcciones();
}
export function renderTimeline(list) {
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
export function toggleBottleneck(el){filterBottleneckOnly=!filterBottleneckOnly;el.classList.toggle('active',filterBottleneckOnly);renderAcciones();}
export function filterActions(extraPredicate) {
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

export function toggleThisWeek(el) {
  filterThisWeek = !filterThisWeek;
  if (filterThisWeek) filterOverdue = false;
  el.classList.toggle('active', filterThisWeek);
  document.getElementById('filterOverdue')?.classList.toggle('active', false);
  renderAcciones();
}

export function toggleOverdue(el) {
  filterOverdue = !filterOverdue;
  if (filterOverdue) filterThisWeek = false;
  el.classList.toggle('active', filterOverdue);
  document.getElementById('filterThisWeek')?.classList.toggle('active', false);
  renderAcciones();
}

export function renderAcciones() {
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
export function openAddAction(cId,defStatus,defTipo){
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
export function openEditAction(id){
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
export function saveAction(){
  const title=document.getElementById('fa-title').value.trim();if(!title){alert('El título es obligatorio.');return;}
  const id=document.getElementById('editActionId').value;
  const acts=getActions();
  const obj={id:id||uid(),tipo:document.getElementById('fa-tipo').value,clientId:document.getElementById('fa-client').value,title,desc:document.getElementById('fa-desc').value.trim(),causa:document.getElementById('fa-causa').value.trim(),status:document.getElementById('fa-status').value,priority:document.getElementById('fa-priority').value,dueDate:document.getElementById('fa-due').value||null,bottleneck:document.getElementById('fa-bottleneck').checked,notes:document.getElementById('fa-notes').value.trim(),createdAt:id?(acts.find(x=>x.id===id)?.createdAt||today()):today(),updatedAt:today()};
  if(id){const i=acts.findIndex(x=>x.id===id);if(i>=0)acts[i]=obj;else acts.push(obj);}else acts.push(obj);
  saveActions();renderAcciones();closeAddActionModal();
}
export function deleteCurrentAction(){
  const id=document.getElementById('editActionId').value;
  if(!id)return;
  if(!confirm('¿Eliminar esta acción?'))return;
  const action = getActions().find(a=>a.id===id);
  // Si el título existe en SEED_ACTIONS, marcarlo como eliminado para que no vuelva a aparecer
  if(action && SEED_ACTIONS.some(s=>s.title===action.title)){
    markSeedAsDeleted(action.title);
  }
  setActions(getActions().filter(a=>a.id!==id));
  saveActions();renderAcciones();closeAddActionModal();
}
export function closeAddAction(e){if(e.target===document.getElementById('addActionOverlay'))closeAddActionModal();}
export function closeAddActionModal(){document.getElementById('addActionOverlay').classList.remove('open');}

export function quickSaveAction(id, field, value) {
  const acts = getActions();
  const idx = acts.findIndex(a => a.id === id);
  if (idx < 0) return;
  acts[idx] = {...acts[idx], [field]: value, updatedAt: today()};
  saveActions();
  scheduleGistSave();
  renderAcciones();
}
export function quickSaveNote(id) {
  const ta = document.getElementById('anotes-' + id);
  if (!ta) return;
  const acts = getActions();
  const idx = acts.findIndex(a => a.id === id);
  if (idx < 0) return;
  acts[idx] = {...acts[idx], notes: ta.value.trim(), updatedAt: today()};
  saveActions();
  scheduleGistSave();
  const btn = document.querySelector(`#anp-${id} button`);
  if (btn) { const orig = btn.textContent; btn.textContent = '✅ Guardado'; setTimeout(() => { btn.textContent = orig; }, 1500); }
}
export function toggleActionNotes(id) {
  const panel = document.getElementById('anp-' + id);
  const btn   = document.getElementById('notebtn-' + id);
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  panel.classList.toggle('open', !isOpen);
  if (btn) { const a = getActions().find(x => x.id === id); btn.textContent = isOpen ? (a?.notes ? '📝 Ver nota' : '📝 + Nota') : '📝 Cerrar'; }
}

export function openNewActionForClient(clientId) {
  closeAlertDetailPanel();
  openAddAction(clientId);
}

// exposed for inline HTML handlers
window.setAccView = setAccView;
window.renderAcciones = renderAcciones;
window.toggleBottleneck = toggleBottleneck;
window.toggleThisWeek = toggleThisWeek;
window.toggleOverdue = toggleOverdue;
window.openAddAction = openAddAction;
window.openEditAction = openEditAction;
window.saveAction = saveAction;
window.deleteCurrentAction = deleteCurrentAction;
window.closeAddAction = closeAddAction;
window.closeAddActionModal = closeAddActionModal;
window.quickSaveAction = quickSaveAction;
window.quickSaveNote = quickSaveNote;
window.toggleActionNotes = toggleActionNotes;
window.openNewActionForClient = openNewActionForClient;
