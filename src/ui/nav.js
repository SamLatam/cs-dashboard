// ── NAVIGATION ─────────────────────────────────────────────────────────────────
// Extracted verbatim from index.html (source lines 2773-2797 for PAGE_TITLES/nav,
// line 3270 for openFicha). Behavior preserved exactly — no rewrite.
//
// ASSUMED CROSS-FILE IMPORTS (sibling files did not exist yet at extraction time —
// verify these during integration):
//   - renderOverview, renderTable   from './overview.js'   (this agent's own file)
//   - renderFicha                   from './ficha.js'      (this agent's own file)
//   - renderAcciones                from './acciones.js'   (this agent's own file)
//   - renderAlerts                  from './alertas.js'    (this agent's own file)
//   - renderCatalogo                from './catalogo.js'   (this agent's own file)
//   - renderMetrics                 from './metricas.js'   (this agent's own file)
//   - renderPredicciones            from './predicciones.js'
//   - renderCapacitacion            from './capacitacion.js'
//   - renderAutomatizacion          from './automatizacion.js'
//   - renderPortfolioA              from './portfolio-a.js'
//   - renderFaq                     from './faq.js'
//   - renderGuia                    from './guia.js'
//   - renderRenovaciones            from './renovaciones.js'
//   - renderDirector                from './director.js'
//   - renderPortfolioReview         from './portfolio-review.js' (maps to PAGE_TITLES key 'review')
//   - renderEquipo                  from './equipo.js'  -- NOTE: 'equipo.js' was NOT listed among
//     the other agents' assigned files in the task brief. Flagging this explicitly: someone needs
//     to own renderEquipo (Gestión de Equipo page) or this import will fail at integration.
import { renderOverview, renderTable } from './overview.js';
import { renderFicha } from './ficha.js';
import { renderAcciones } from './acciones.js';
import { renderAlerts } from './alertas.js';
import { renderCatalogo } from './catalogo.js';
import { renderMetrics } from './metricas.js';
import { renderPredicciones } from './predicciones.js';
import { renderCapacitacion } from './capacitacion.js';
import { renderAutomatizacion } from './automatizacion.js';
import { renderPortfolioA } from './portfolio-a.js';
import { renderFaq } from './faq.js';
import { renderGuia } from './guia.js';
import { renderEquipo, renderDirector } from './director.js';
import { renderPortfolioReview } from './portfolio-review.js';

// Source line 2773
const PAGE_TITLES = {overview:'Vista General de Cartera',portfolio:'Mis Clientes',ficha:'Ficha Cliente',acciones:'Gestión de Acciones',alertas:'Alertas & Riesgos',predicciones:'🔮 Predicciones & Sugerencias',capacitacion:'🎓 Capacitación & Entrega de Valor',automatizacion:'🤖 Automatización D/E — Clientes en Riesgo',catalogo:'Catálogo & GMV',metricas:'Métricas','portfolio-a':'🎯 Aceleración Portfolio A',faq:'💡 FAQ — CS & AnyMarket & AnyTools',notas:'Notas',guia:'Guía Operacional CS',equipo:'👥 Gestión de Equipo',director:'👑 Vista Director — Portfolio Global',review:'🔄 Revisión de Portafolio — 3 Rounds'};

// Source lines 2774-2797
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
  if (page==='equipo')         renderEquipo();
  if (page==='director')       renderDirector();
  if (page==='review')         renderPortfolioReview();
}

// Source line 3270
function openFicha(id) { nav('ficha', document.getElementById('nav-ficha')); document.getElementById('fichaSelect').value = id; renderFicha(); }

// Window-attach: both nav() and openFicha() are invoked from inline onclick="..."
// attributes throughout the whole source file (nav bar items, table rows, cards,
// alert panels, director/renovaciones/equipo pages, etc.) — verified via a
// full-file grep of on(click|change|blur|keydown|input|focus)="..." attributes.
window.nav = nav;
window.openFicha = openFicha;

export { PAGE_TITLES, nav, openFicha };
