import { showSaved } from '../lib/dom.js';
import { buildPlaybook } from '../domain/lifecycle.js';
import { renderTable } from '../ui/overview.js';
import { renderFicha } from '../ui/ficha.js';
// RECONCILED: updateRenewalBadge lives in the newly-created ui/renovaciones.js (created during
// integration — see that file's header note), not main.js.
import { updateRenewalBadge } from '../ui/renovaciones.js';

// ── MOOD ───────────────────────────────────────────────────────────────────────
export const MOODS = { positivo:{emoji:'😊',label:'Positivo',cls:'mood-positivo'}, neutro:{emoji:'😐',label:'Neutro',cls:'mood-neutro'}, preocupado:{emoji:'😟',label:'Preocupado',cls:'mood-preocupado'}, critico:{emoji:'🚨',label:'Crítico',cls:'mood-critico'} };
export function getMood(id) { return localStorage.getItem('cs-mood-' + id) || ''; }
export function saveMood(id, val) {
  localStorage.setItem('cs-mood-' + id, val);
  // refresh mood-opt buttons inside ficha if open
  document.querySelectorAll(`.mood-opt[data-mood-id="${id}"]`).forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.moodVal === val);
  });
  renderTable();
}
export function moodBadge(id) {
  const m = getMood(id);
  if (!m || !MOODS[m]) return '';
  return `<span class="mood-pill ${MOODS[m].cls}" onclick="event.stopPropagation();openFicha('${id}')" title="${MOODS[m].label}">${MOODS[m].emoji}</span>`;
}

// ── TICKET PATTERNS ────────────────────────────────────────────────────────────
export function getPatterns(id) { return localStorage.getItem('cs-patterns-' + id) || ''; }
export function savePatterns(id) {
  const el = document.getElementById('patterns-' + id);
  if (!el) return;
  localStorage.setItem('cs-patterns-' + id, el.value);
  const t = document.getElementById('saved-patterns-' + id);
  if (t) { t.style.opacity = 1; setTimeout(() => t.style.opacity = 0, 2000); }
}

// ── CAMPOS OPERATIVOS AVANZADOS ──────────────────────────────────────────────
export function getRF(id)   { return localStorage.getItem('cs-rf-'+id)||''; }
export function getOB(id)   { return localStorage.getItem('cs-ob-'+id)||''; }
export function getAP(id)   { return localStorage.getItem('cs-ap-'+id)||''; }
export function getESC(id)  { return localStorage.getItem('cs-esc-'+id)||''; }
export function getRein(id) { return localStorage.getItem('cs-rein-'+id)||''; }
export function getCompCli(id) { return localStorage.getItem('cs-comp-cli-'+id)||''; }
export function getCompDB1(id) { return localStorage.getItem('cs-comp-db1-'+id)||''; }
export function getIntSt(id)  { try{return JSON.parse(localStorage.getItem('cs-int-'+id)||'{}');}catch(e){return {};} }

export function saveRF(id)   { localStorage.setItem('cs-rf-'+id, document.getElementById('rf-sel-'+id)?.value||''); showSaved('saved-rf-'+id); }
export function saveOB(id)   { localStorage.setItem('cs-ob-'+id, document.getElementById('ob-sel-'+id)?.value||''); showSaved('saved-ob-'+id); }
export function saveAP(id)   { localStorage.setItem('cs-ap-'+id, document.getElementById('ap-sel-'+id)?.value||''); showSaved('saved-ap-'+id); }
export function saveESCField(id) { localStorage.setItem('cs-esc-'+id, document.getElementById('esc-inp-'+id)?.value||''); showSaved('saved-esc-'+id); }
export function saveReinField(id){ localStorage.setItem('cs-rein-'+id, document.getElementById('rein-inp-'+id)?.value||''); showSaved('saved-rein-'+id); }
export function saveCompromisos(id) {
  localStorage.setItem('cs-comp-cli-'+id, document.getElementById('comp-cli-'+id)?.value||'');
  localStorage.setItem('cs-comp-db1-'+id, document.getElementById('comp-db1-'+id)?.value||'');
  showSaved('saved-comp-'+id);
}
export function cycleIntSt(id, mkp) {
  const s=getIntSt(id); const cur=s[mkp]||'';
  s[mkp] = cur===''?'ok':cur==='ok'?'warning':cur==='warning'?'critical':'';
  if(!s[mkp]) delete s[mkp];
  localStorage.setItem('cs-int-'+id, JSON.stringify(s));
  renderFicha();
}
export function intStChip(id, mkp) {
  const s=getIntSt(id); const st=s[mkp]||'';
  const col=st==='ok'?'var(--green)':st==='warning'?'var(--yellow)':st==='critical'?'var(--red)':'var(--text3)';
  const ic=st==='ok'?'🟢':st==='warning'?'⚠️':st==='critical'?'🔴':'⬜';
  return `<span onclick="cycleIntSt('${id}','${mkp.replace(/'/g,"\\'")}')" title="Clic para cambiar estado: ok → alerta → crítico" style="cursor:pointer;font-size:11px;padding:2px 7px;border-radius:4px;background:${col}1a;border:1px solid ${col}44;color:${col};white-space:nowrap;user-select:none">${ic} ${mkp}</span>`;
}
export function rfBadge(v) { return v==='critico'?'<span style="color:var(--red);font-weight:700;font-size:12px">🔴 Crítico</span>':v==='seguimiento'?'<span style="color:var(--yellow);font-weight:700;font-size:12px">🟡 Seguimiento</span>':v==='ok'?'<span style="color:var(--green);font-size:12px">🟢 Sin riesgo</span>':'—'; }

// ── CUSTOMER LIFECYCLE STAGE (per-client state) ───────────────────────────────
export function getLifecycle(id){ return localStorage.getItem('cs-lc-'+id) || null; }
export function saveLifecycle(id){
  const v=document.getElementById('lc-select-'+id)?.value;
  if(v) localStorage.setItem('cs-lc-'+id,v);
  else localStorage.removeItem('cs-lc-'+id);
  const t=document.getElementById('saved-lc-'+id);if(t){t.style.opacity=1;setTimeout(()=>t.style.opacity=0,2000);}
  // Re-render playbook inline
  const pb=document.getElementById('lc-playbook-'+id);
  if(pb) pb.outerHTML=buildPlaybook(id);
}

// ── MRR & RENEWAL (contrato) — per-client field saves ─────────────────────────
export function saveMRRField(id){
  const v=document.getElementById('mrr-input-'+id)?.value;
  if(v===null||v===undefined)return;
  if(!v||parseFloat(v)===0)localStorage.removeItem('cs-mrr-'+id);
  else localStorage.setItem('cs-mrr-'+id,parseFloat(v));
  const t=document.getElementById('saved-mrr-'+id);if(t){t.style.opacity=1;setTimeout(()=>t.style.opacity=0,2000);}
}
export function saveRenewalField(id){
  const v=document.getElementById('renewal-input-'+id)?.value;
  if(v)localStorage.setItem('cs-renewal-'+id,v);
  else localStorage.removeItem('cs-renewal-'+id);
  const t=document.getElementById('saved-renewal-'+id);if(t){t.style.opacity=1;setTimeout(()=>t.style.opacity=0,2000);}
  // update badge
  updateRenewalBadge();
}

// ── FICHA / MARKETPLACES (per-client field saves) ─────────────────────────────
export function saveFichaNote(id) {
  localStorage.setItem('cs-note-' + id, document.getElementById('fichaNote').value);
  const t = document.getElementById('saved-ficha'); t.style.opacity=1; setTimeout(()=>t.style.opacity=0,2000);
}
export function saveMkt(id) {
  const val = document.getElementById('mktInput-' + id)?.value || '';
  localStorage.setItem('cs-mkt-' + id, val);
  const t = document.getElementById('saved-mkt-' + id);
  if (t) { t.style.opacity=1; setTimeout(()=>t.style.opacity=0,2000); }
}
export function editMktInline(id) {
  const disp = document.getElementById('mkt-display-' + id);
  const inp  = document.getElementById('mkt-input-' + id);
  if (!disp || !inp) return;
  disp.style.display = 'none';
  inp.style.display  = 'block';
  inp.focus();
  inp.select();
}
export function saveMktInline(id) {
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
export function closeMktInline(id) {
  const inp  = document.getElementById('mkt-input-' + id);
  const disp = document.getElementById('mkt-display-' + id);
  if (!inp || !disp) return;
  inp.style.display  = 'none';
  disp.style.display = 'flex';
}

// exposed for inline HTML handlers
window.saveMood = saveMood;
window.savePatterns = savePatterns;
window.saveCompromisos = saveCompromisos;
window.cycleIntSt = cycleIntSt;
window.saveRF = saveRF;
window.saveOB = saveOB;
window.saveAP = saveAP;
window.saveESCField = saveESCField;
window.saveReinField = saveReinField;
window.saveMkt = saveMkt;
window.editMktInline = editMktInline;
window.saveMktInline = saveMktInline;
window.closeMktInline = closeMktInline;
window.saveLifecycle = saveLifecycle;
window.saveMRRField = saveMRRField;
window.saveRenewalField = saveRenewalField;
window.saveFichaNote = saveFichaNote;
