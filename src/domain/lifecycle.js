// ── CUSTOMER LIFECYCLE STAGE ──────────────────────────────────────────────────
// Framework: Mehta / Steinman / Murphy — "Customer Success" (Wiley, 2016)
// El libro define que cada etapa del ciclo de vida del cliente requiere acciones específicas.
// Sin saber la etapa, el CSM vuela a ciegas.
import { getLifecycle } from '../services/client-state-repo.js';

export const LC_STAGES = {
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

export function buildPlaybook(id){
  const lc=getLifecycle(id);if(!lc||!LC_STAGES[lc])return`<div id="lc-playbook-${id}"></div>`;
  const s=LC_STAGES[lc];
  const items=s.playbook.map(p=>`<div class="pb-item"><span style="color:${s.color}">→</span> ${p}</div>`).join('');
  return `<div class="lc-playbook" id="lc-playbook-${id}"><div class="pb-title">Playbook para ${s.label}</div>${items}</div>`;
}
