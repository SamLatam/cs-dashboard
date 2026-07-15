// ── NAVIGATION ─────────────────────────────────────────────────────────────────
import { renderOverview, renderTable } from './overview.js';
import { renderFicha } from './ficha.js';
import { renderAcciones } from './acciones.js';
import { renderAlerts } from './alertas.js';
// ASSUMPTION: renderPredicciones lives in ui/predicciones.js per task mapping — not yet
// verified against another agent's actual file (predicciones.js not present at extraction time).
import { renderPredicciones } from './predicciones.js';
import { renderCapacitacion } from './capacitacion.js';
import { renderAutomatizacion } from './automatizacion.js';
import { renderCatalogo } from './catalogo.js';
import { renderMetrics } from './metricas.js';
import { renderPortfolioA } from './portfolio-a.js';
import { renderFaq } from './faq.js';
import { renderGuia } from './guia.js';
// ASSUMPTION: renovaciones.js does not exist yet in the tree (per task note, another agent
// may create it) — importing renderRenovaciones from it as the logical home for that page.
import { renderRenovaciones } from './renovaciones.js';
import { renderEquipo, renderDirector } from './director.js';
import { renderPortfolioReview } from './portfolio-review.js';

const PAGE_TITLES = {overview:'Vista General de Cartera',portfolio:'Mis Clientes',ficha:'Ficha Cliente',acciones:'Gestión de Acciones',alertas:'Alertas & Riesgos',predicciones:'🔮 Predicciones & Sugerencias',capacitacion:'🎓 Capacitación & Entrega de Valor',automatizacion:'🤖 Automatización D/E — Clientes en Riesgo',catalogo:'Catálogo & GMV',metricas:'Métricas','portfolio-a':'🎯 Aceleración Portfolio A',faq:'💡 FAQ — CS & AnyMarket & AnyTools',notas:'Notas',guia:'Guía Operacional CS',renovaciones:'💰 Renovaciones & Revenue at Risk',equipo:'👥 Gestión de Equipo',director:'👑 Vista Director — Portfolio Global',review:'🔄 Revisión de Portafolio — 3 Rounds'};
function nav(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  el.classList.add('active');
  document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || page;
  if (page==='overview')       renderOverview();
  if (page==='portfolio')      renderTable();
  if (page==='ficha')          renderFicha();
  if (page==='acciones')       renderAcciones();
  if (page==='alertas')        renderAlerts();
  if (page==='predicciones')   renderPredicciones();
  if (page==='capacitacion')   renderCapacitacion();
  if (page==='automatizacion') renderAutomatizacion();
  if (page==='catalogo')       renderCatalogo();
  if (page==='metricas')       renderMetrics();
  if (page==='portfolio-a')    renderPortfolioA();
  if (page==='faq')            renderFaq();
  if (page==='guia')           renderGuia();
  if (page==='renovaciones')   renderRenovaciones();
  if (page==='equipo')         renderEquipo();
  if (page==='director')       renderDirector();
  if (page==='review')         renderPortfolioReview();
}

// ── FICHA CLIENTE (routing helper) ────────────────────────────────────────────
function openFicha(id) { nav('ficha', document.getElementById('nav-ficha')); document.getElementById('fichaSelect').value = id; renderFicha(); }

export { nav, openFicha };

// exposed for inline HTML handlers
window.nav = nav;
window.openFicha = openFicha;
