// Extracted verbatim from index.html.
// LC_STAGES constant: lines ~4318-4333 (kept here even though the requested
// range was 4334-4393, because buildPlaybook() cannot function without it and
// it's pure lookup data — other files, e.g. renderLifecyclePipeline() in the UI
// layer, also reference LC_STAGES and are expected to import it from here).
// getLifecycle/saveLifecycle/buildPlaybook/filterByLifecycle: lines ~4334-4393.
//
// NOTE (impure / DOM-mixing, preserved as-is per extraction rules):
// - `getLifecycle` reads directly from localStorage (key 'cs-lc-'+id).
// - `saveLifecycle` reads a DOM <select> value, writes localStorage directly,
//   touches DOM (opacity toast + playbook re-render via outerHTML).
// - `filterByLifecycle` is UI orchestration (calls nav(), queries
//   `#clientTable tr[data-id]`, calls showToast()) more than a domain function.
// The source mixes these concerns; a stricter split would move
// getLifecycle/saveLifecycle to src/services/client-state-repo.js and
// filterByLifecycle to a UI file. Kept together here to match the requested
// scope and avoid guessing at a boundary that wasn't asked for.
//
// INTEGRATION TODO: `nav` and `showToast` are UI-layer globals defined
// elsewhere in index.html (nav ~2774, showToast is a toast-rendering helper
// used throughout). Assumed to be imported from a UI module — adjust the
// import path once src/ui/* lands (another agent owns src/ui/*).
import { nav } from '../ui/nav.js';
import { showToast } from '../lib/dom.js';
// INTEGRATION TODO: getMRR is defined in this same domain scope
// (src/domain/renewal-revenue.js) — used by renderLifecyclePipeline in the
// original source (index.html:4361), which is NOT part of this file's scope
// (it's a render function, belongs to a UI file). Left out of this file;
// noting here only because LC_STAGES/getLifecycle are consumed by it.

const LC_STAGES = {
  onboarding: { label:'Onboarding',  emoji:'🚀', color:'#5dade2', cls:'lc-onboarding',
    playbook:['Validar que la implementación esté completa y funcional','Asegurar que el equipo del cliente sabe usar la plataforma','Agendar check-in de 30 días para confirmar Value Realization','Documentar el Desired Outcome acordado con el cliente'] },
  adoption:   { label:'Adopción',    emoji:'📈', color:'#58d68d', cls:'lc-adoption',
    playbook:['Revisar Use Points y profundidad de uso semanal','Identificar funcionalidades sin usar y hacer enablement','Compartir benchmarks y buenas prácticas del sector','Check-in mensual de salud operativa'] },
  value:      { label:'Value Real.', emoji:'💡', color:'#82e0aa', cls:'lc-value',
    playbook:['Documentar y cuantificar el ROI obtenido','Preparar Business Review con métricas de impacto','Identificar nuevas necesidades de negocio del cliente','Convertir al cliente en referencia o caso de éxito'] },
  expansion:  { label:'Expansión',   emoji:'🔥', color:'#a569bd', cls:'lc-expansion',
    playbook:['Proponer nuevos marketplaces con oportunidad de GMV','Presentar AnyTools (Repricing, Match ML, Kits)','Involucrar a comercial para negociar expansión de contrato','Cuantificar impacto económico del upsell'] },
  renewal:    { label:'Renovación',  emoji:'🔄', color:'#f4d03f', cls:'lc-renewal',
    playbook:['Preparar deck de valor entregado (GMV, pedidos, adopción)','Identificar y neutralizar objeciones antes de la reunión','Confirmar satisfacción de stakeholders y Champion','Negociar con datos — no con descuentos'] },
  advocacy:   { label:'Advocacy',    emoji:'⭐', color:'#1abc9c', cls:'lc-advocacy',
    playbook:['Solicitar NPS y testimonial formal','Proponer co-marketing o caso de éxito público','Conectar al cliente con otros clientes del sector','Involucrar al Champion como referencia en ventas'] },
  atrisk:     { label:'En Riesgo',   emoji:'⚠️', color:'#e74c3c', cls:'lc-atrisk',
    playbook:['Llamada ejecutiva en menos de 48hs — no email','Diagnóstico de causa raíz del riesgo (técnico/relacional/financiero)','Involucrar al Manager/Director de CS para escalamiento','Crear Success Plan de rescate con milestones medibles'] }
};

function getLifecycle(id){ return localStorage.getItem('cs-lc-'+id) || null; }
function saveLifecycle(id){
  const v=document.getElementById('lc-select-'+id)?.value;
  if(v) localStorage.setItem('cs-lc-'+id,v);
  else localStorage.removeItem('cs-lc-'+id);
  const t=document.getElementById('saved-lc-'+id);if(t){t.style.opacity=1;setTimeout(()=>t.style.opacity=0,2000);}
  // Re-render playbook inline
  const pb=document.getElementById('lc-playbook-'+id);
  if(pb) pb.outerHTML=buildPlaybook(id);
}
function buildPlaybook(id){
  const lc=getLifecycle(id);if(!lc||!LC_STAGES[lc])return`<div id="lc-playbook-${id}"></div>`;
  const s=LC_STAGES[lc];
  const items=s.playbook.map(p=>`<div class="pb-item"><span style="color:${s.color}">→</span> ${p}</div>`).join('');
  return `<div class="lc-playbook" id="lc-playbook-${id}"><div class="pb-title">Playbook para ${s.label}</div>${items}</div>`;
}
function filterByLifecycle(lc){
  // Navega a Portfolio y filtra por etapa
  nav('portfolio', document.getElementById('nav-portfolio'));
  setTimeout(()=>{
    const rows=document.querySelectorAll('#clientTable tr[data-id]');
    rows.forEach(r=>{const id=r.dataset.id;r.style.display=getLifecycle(id)===lc?'':'none';});
    showToast(`Filtrando: ${LC_STAGES[lc]?.emoji} ${LC_STAGES[lc]?.label} (${document.querySelectorAll('#clientTable tr[data-id]:not([style*="none"])').length} clientes)`, 'blue');
  },200);
}

// exposed for inline HTML handlers: saveLifecycle is invoked via
// onchange="saveLifecycle('<id>')" in src/ui/ficha.js's Lifecycle Stage select.
window.saveLifecycle = saveLifecycle;

export { LC_STAGES, getLifecycle, saveLifecycle, buildPlaybook, filterByLifecycle };
