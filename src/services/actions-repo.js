// ── ACTIONS DATA ────────────────────────────────────────────────────────────────
// Mechanically extracted from index.html (verbatim behavior). This module owns the
// `actions` array (previously a bare module-level global in the monolith).
//
// ASSUMPTIONS about other modules' exports (unverified — flagged for integration pass):
//   - clients-repo.js exports: PORT, LS_DELETED_SEEDS
//   - profiles-repo.js exports: getActiveUser, getVisibleClientIds
//   - lib/format.js exports: uid, today
//   - renderAcciones is a DOM-render function not assigned to any file in this agent's
//     scope. Guessed import path '../ui/render.js' as a placeholder.

import { uid, today } from '../lib/format.js';
import { PORT, LS_DELETED_SEEDS } from './clients-repo.js';
import { getActiveUser, getVisibleClientIds, canEdit } from './profiles-repo.js';
import { scheduleGistSave, pushToSupabase } from './gist-sync.js';
// closeAddActionModal is a DOM-modal toggle (index.html ~4060, one line:
// `document.getElementById('addActionOverlay').classList.remove('open')`) not assigned to
// this agent's scope — guessed import path, reconcile once the real ui/*.js file exists.
import { renderAcciones, closeAddActionModal } from '../ui/acciones.js';

// ── STATE ──────────────────────────────────────────────────────────────────────
export const LS_ACTIONS = 'cs-v3-actions';
let actions = [];

// Accessors (module-owned mutable state)
export function getActions() { return actions; }
export function setActions(newArr) { actions = newArr; }

export function getActionsKey(userId) {
  return userId ? `cs-v3-actions-${userId}` : (typeof LS_ACTIONS !== 'undefined' ? LS_ACTIONS : 'cs-v3-actions');
}

export const SEED_ACTIONS = [
  {tipo:'soporte',clientId:'belcorp-col',  title:'Resolver error homologación ZIP Code ML — #26583',         desc:'2,124 pedidos pendientes (~USD 28K). Cambio en estructura de direcciones ML.',causa:'Cambio estructura ML rompe homologación ZIP Code en BDI/SAP — bloquea facturación',                status:'resuelto',   priority:'critica',bottleneck:false,dueDate:'2026-06-16',notes:'✅ Cerrado 21-jun. Impacto USD 28K resuelto.'},
  {tipo:'soporte',clientId:'forus-sa',     title:'Resolver discrepancia de stock en Mercado Libre — #28371',  desc:'Sincronización inventario AnyMarket → ML fallando para múltiples SKUs.',          causa:'Discrepancia stock AnyMarket vs ML — sincronización fallando',                                     status:'resuelto',   priority:'alta',   bottleneck:false,dueDate:'2026-06-19',notes:'✅ Cerrado 17-jun.'},
  {tipo:'soporte',clientId:'lounge',       title:'Resolver descarga etiquetas API/Centry — #27642',           desc:'Centry no descarga etiquetas de despacho — bloquea fulfillment.',                causa:'Integración Centry no descarga etiquetas',                                                        status:'resuelto',   priority:'alta',   bottleneck:false,dueDate:'2026-06-17',notes:'✅ Cerrado 20-jun.'},
  {tipo:'soporte',clientId:'forus-colombia',title:'Publicar SKUs con imágenes en Falabella — #24299',         desc:'SKUs sin imágenes no se publican en Falabella Colombia.',                        causa:'SKUs sin imágenes en AnyMarket no se publican en Falabella',                                      status:'resuelto',   priority:'media',  bottleneck:false,dueDate:'2026-06-20',notes:'✅ Cerrado 15-jun.'},
  {tipo:'soporte',clientId:'fashions-park',title:'Resolver captura RUT en órdenes Shopify — #19843',          desc:'Shopify no captura RUT del cliente. Afecta facturación y despacho.',             causa:'Integración Shopify no captura RUT del cliente',                                                  status:'en-progreso',priority:'media',  bottleneck:false,dueDate:'2026-06-27',notes:'Hold — esperando respuesta del cliente. Actualizado 24-jun.'},
  {tipo:'soporte',clientId:'fashions-park',title:'Fashions Park — Seguimiento cambios integración MercadoLibre — #30657', desc:'Ticket abierto por aviso de cambios importantes en integración ML. Confirmar impacto operativo y qué acciones debe tomar el cliente.', causa:'Cambios en integración MercadoLibre — impacto en operación aún no confirmado', status:'por-hacer',priority:'alta',bottleneck:false,dueDate:'2026-06-26',notes:'Abierto 19-jun. Revisar con cliente si hay algo bloqueante antes de fin de semana.'},
  {tipo:'soporte',clientId:'emma-sleep',   title:'Resolver sincronización de stock ML — #27148',               desc:'Stock en AnyMarket no se refleja en Mercado Libre.',                            causa:'Sincronización inventario hacia ML fallando',                                                     status:'resuelto',   priority:'media',  bottleneck:false,dueDate:'2026-06-18',notes:'✅ Cerrado 18-jun.'},
  {tipo:'soporte',clientId:'gino',         title:'Resolver publicación SKU L743 — #27681',                    desc:'Error en SKU L743 — mapeo o publicación rechazada.',                            causa:'Atributo mal mapeado o publicación rechazada para SKU L743',                                      status:'resuelto',   priority:'media',  bottleneck:false,dueDate:'2026-06-17',notes:'✅ Cerrado 18-jun.'},
  {tipo:'soporte',clientId:'pointbreak',   title:'Gestionar información de doble despacho — #28016',          desc:'Cliente no puede configurar doble despacho.',                                   causa:'Información doble despacho no disponible — posible feature gap',                                  status:'por-hacer',  priority:'media',  bottleneck:false,dueDate:'2026-06-20',notes:''},
  {tipo:'soporte',clientId:'transbel',     title:'Gestionar pendientes FTP BELCORP Mexico post 16-jun',        desc:'Reinyección de archivos al FTP desde AnyMarket.',                               causa:'Falta llegada de archivos al FTP — reinyección pendiente',                                        status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-20',notes:''},
  {tipo:'cs',clientId:'forus-sa',          title:'Plan de recuperación NPS -100 — FORUS SA',                  desc:'Contactar cliente, entender causa NPS -100. Armar plan de rescate.',             causa:'NPS en -100 sin plan de acción — riesgo de churn elevado',                                       status:'resuelto',   priority:'critica',bottleneck:false,dueDate:'2026-06-16',notes:'✅ NPS resuelto. Cerrado 01-Jul-2026.'},
  {tipo:'cs',clientId:'coboe-botiga',      title:'Partnerships — Seguimiento caso N° 4630608 ML — Reputación Farmashop/Botiga', desc:'Gestionar junto a Partnerships el seguimiento del caso N° 4630608 en Mercado Libre. Buscar alternativas de recuperación reputacional de Farmashop/Botiga Uruguay tras incidente confirmado con origen en AnyMarket.', causa:'Incidente con origen en AnyMarket confirmado — daño reputacional en ML impacta operación de Farmashop y Botiga Uruguay', status:'en-progreso', priority:'critica',bottleneck:true, dueDate:'2026-06-27',notes:'Gestionar con Partnerships. Caso ML: N° 4630608. Impacta reputación y ventas de ambas marcas en Uruguay.'},
  {tipo:'cs',clientId:'loi-chile',         title:'Reactivar contacto — sin interacción desde nov-2025',       desc:'Último contacto hace +7 meses. Agendar llamada.',                               causa:'Sin contacto prolongado — riesgo de churn silencioso',                                            status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-25',notes:''},
  {tipo:'cs',clientId:'malaga',            title:'Reactivar contacto — sin interacción desde marzo',          desc:'Sin contacto desde 31-mar. Agendar check-in.',                                  causa:'Sin contacto prolongado — riesgo de desconexión',                                                 status:'por-hacer',  priority:'media',  bottleneck:false,dueDate:'2026-06-25',notes:''},
  {tipo:'cs',clientId:'pointbreak',        title:'Reactivar contacto + evaluar actividad — POINTBREAK',       desc:'Sin contacto desde abr + 0 GMV. Evaluar si cliente activo.',                    causa:'Sin contacto + 0 GMV — posible cliente inactivo',                                                 status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-25',notes:''},
  // ── MIGRACIONES CENTRY ──
  {tipo:'pm',clientId:'maisa',          title:'Migración CENTRY — MAISA',          desc:'Definir fechas, alcance técnico y planificación de Go Live con cliente y equipo técnico.',      causa:'Migración sin cronograma ni alcance formalizado',                                status:'por-hacer',  priority:'alta',  bottleneck:false,dueDate:'2026-07-15',notes:''},
  {tipo:'pm',clientId:'forus-colombia', title:'Migración CENTRY — FORUS Colombia', desc:'Definir fechas, alcance técnico y Go Live. Verificar bloqueo Dafiti resuelto.',               causa:'Migración bloqueada previamente por Dafiti — retomar con fechas concretas',      status:'por-hacer',  priority:'alta',  bottleneck:true, dueDate:'2026-07-15',notes:''},
  {tipo:'pm',clientId:'forus-sa',       title:'Migración CENTRY — FORUS SA',       desc:'Definir fechas, alcance técnico con integraciones y marketplaces, y planificar Go Live.',      causa:'Migración en curso sin cronograma formalizado',                                  status:'en-progreso',priority:'alta',  bottleneck:false,dueDate:'2026-07-15',notes:''},
  {tipo:'pm',clientId:'gino',           title:'Migración CENTRY — GINO',           desc:'Definir fechas, alcance técnico (incluye SKUs con errores activos) y planificar Go Live.',     causa:'Migración en curso con SKUs con problemas de publicación activos',               status:'en-progreso',priority:'alta',  bottleneck:false,dueDate:'2026-07-15',notes:''},
  // ── BELCORP COLOMBIA — CASO ZIP CODE ──
  {tipo:'soporte',clientId:'belcorp-col',title:'Plan de acción ZIP Code ML — #26583 (USD 28K)',desc:'Resolución del error de homologación ZIP Code Mercado Libre que bloquea 2,124 pedidos y facturación electrónica BDI/SAP.',causa:'Cambio estructura ML rompe homologación ZIP Code — bloquea facturación y contabilidad',status:'en-progreso',priority:'critica',bottleneck:true,dueDate:'2026-06-20',notes:'Impacto USD 28K. Múltiples equipos involucrados.',
    subtasks:[
      {accion:'Solicitar listado oficial de ciudades a Mercado Libre', responsable:'Camila',          status:'Pendiente',   impacto:'Crítico', pmi:'🔴 Alto Riesgo'},
      {accion:'Compartir listado con AnyMarket',                       responsable:'Camila',          status:'Pendiente',   impacto:'Alto',    pmi:'🔴 Alto Riesgo'},
      {accion:'Comparar ciudades Mercado Libre vs Belcorp',            responsable:'Sami + Genaro',   status:'Pendiente',   impacto:'Alto',    pmi:'🟡 Medio'},
      {accion:'Definir homologación / mapping',                        responsable:'Genaro',          status:'Pendiente',   impacto:'Crítico', pmi:'🟡 Medio'},
      {accion:'Ejecutar prueba de 5 pedidos',                          responsable:'Jeison',          status:'En curso',    impacto:'Medio',   pmi:'🟢 Alto éxito'},
      {accion:'Excluir pedidos procesados manualmente',                responsable:'Jackson',         status:'En curso',    impacto:'Bajo',    pmi:'🟢 Alto éxito'},
      {accion:'Ejecutar interfaz productiva',                          responsable:'Miguel Medrano',  status:'Bloqueado',   impacto:'Crítico', pmi:'🔴 Alto Riesgo'},
      {accion:'Configurar IP fija FTP',                                responsable:'Cliente + Velcor',status:'Pendiente',   impacto:'Alto',    pmi:'🟡 Medio'},
      {accion:'Reinyección masiva junio',                              responsable:'Operaciones',     status:'Dependiente', impacto:'Crítico', pmi:'🟡 Medio'},
      {accion:'Reunión seguimiento',                                   responsable:'Camila',          status:'Pendiente',   impacto:'Medio',   pmi:'🟢 Alto éxito'},
    ]},
  // ── BELCORP COLOMBIA ──
  {tipo:'cs',clientId:'belcorp-col',title:'Alta de proveedor — Solicitar documentación a Legal Services y DP',                 desc:'Solicitar documentación a Legal Services y DP para creación de proveedor.',     causa:'Creación de proveedor bloqueada esperando documentación interna',                                 status:'por-hacer',  priority:'alta',   bottleneck:true, dueDate:'2026-06-20',notes:'Responsable: Samiramis / Legal'},
  {tipo:'cs',clientId:'belcorp-col',title:'Alta de proveedor — Carta bancaria firmada',                                        desc:'Obtener y entregar carta bancaria firmada para alta de proveedor.',             causa:'Creación de proveedor bloqueada esperando documentación interna',                                 status:'por-hacer',  priority:'alta',   bottleneck:true, dueDate:'2026-06-20',notes:'Responsable: Legal / Finanzas'},
  {tipo:'cs',clientId:'belcorp-col',title:'Alta de proveedor — Documento constitución empresa',                                desc:'Entregar documento de constitución de empresa para alta de proveedor.',          causa:'Creación de proveedor bloqueada esperando documentación interna',                                 status:'por-hacer',  priority:'alta',   bottleneck:true, dueDate:'2026-06-20',notes:'Responsable: Legal'},
  {tipo:'cs',clientId:'belcorp-col',title:'Alta de proveedor — Hoja con personas involucradas en proyecto',                    desc:'Preparar hoja con todas las personas involucradas en el proyecto.',             causa:'Creación de proveedor bloqueada esperando documentación interna',                                 status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-20',notes:'Responsable: PMO / CS'},
  {tipo:'cs',clientId:'belcorp-col',title:'Gestión Proyecto — Definir Project Manager asignado',                               desc:'Definir y confirmar PM responsable del proyecto Belcorp.',                     causa:'Proyecto sin PM definido — riesgo de descoordinación',                                           status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-20',notes:'Responsable: Gestión Interna'},
  {tipo:'cs',clientId:'belcorp-col',title:'Facturación — Revisar y gestionar 2 facturas pendientes',                           desc:'Revisar estado y gestionar cobro de 2 facturas pendientes con Camila.',         causa:'Facturas sin cobrar — impacto financiero pendiente',                                             status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-20',notes:'Responsable: Camila'},
  {tipo:'cs', clientId:'belcorp-col',title:'Koncili — Revisar propuesta comercial según última mejora levantada',              desc:'Revisar propuesta Koncili con María según última mejora solicitada.',           causa:'En negociación — propuesta comercial pendiente de revisión',                                     status:'en-progreso',priority:'alta',   bottleneck:false,dueDate:'2026-06-25',notes:'Responsable: María / Comercial'},
  {tipo:'cs', clientId:'belcorp-col',title:'API Belcorp — Presentarse y entender necesidad real de API',                       desc:'Reunión para presentarse y levantar necesidad real de la API de Belcorp.',      causa:'Necesidad de API no clarificada — requiere discovery',                                           status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-20',notes:'Responsable: Samiramis'},
  {tipo:'cs',clientId:'belcorp-col',title:'Contrato — Validar documentos faltantes para firma',                                desc:'Validar con Álvaro qué documentos faltan para cerrar la firma del contrato.',   causa:'Firma contractual pendiente — documentación incompleta',                                         status:'en-progreso',priority:'alta',   bottleneck:true, dueDate:'2026-06-25',notes:'Responsable: Álvaro'},
  {tipo:'cs',clientId:'belcorp-col',title:'✍️ Belcorp — Solicitar firma de contrato (PENDIENTE DIRECCIÓN)',                      desc:'Gestionar la firma del contrato con Belcorp. Validar con Álvaro qué documentos faltan y coordinar firma formal antes de fin de julio.',causa:'Contrato sin firma — bloquea formalización de la relación comercial y cobro de facturas pendientes.',status:'por-hacer',priority:'critica',bottleneck:true,dueDate:'2026-07-08',notes:'Responsable: Sami + Dirección. Impacta 2 facturas pendientes. Escalar si no hay respuesta en 48h.'},
  // ── COLCOMERCIO ──
  {tipo:'soporte',clientId:'colombiana',title:'Colcomercio — Seguimiento bug facturación DISML — #30423',desc:'Bug de facturación activo en integración DISML. Coordinar con soporte para resolución urgente.',causa:'Error de facturación en integración DISML — clasificado como bug — cliente sin historial previo de tickets',status:'resuelto',priority:'alta',bottleneck:false,dueDate:'2026-06-27',notes:'✅ Cerrado 23-jun. Primer ticket de este cliente — monitorear que no reaparezca.'},
  {tipo:'cs', clientId:'colombiana',title:'Renovación — Envío nueva propuesta comercial',                                      desc:'Preparar y enviar nueva propuesta comercial para renovación.',                 causa:'Contrato próximo a vencer — renovación en proceso',                                              status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-30',notes:'Responsable: María'},
  {tipo:'cs', clientId:'colombiana',title:'Contrato — Incorporar tabla SLA al contrato',                                       desc:'Incorporar tabla de SLA al contrato de renovación.',                           causa:'SLA explicado varias veces sin formalización contractual — riesgo de reclamos',                  status:'por-hacer',  priority:'media',  bottleneck:false,dueDate:'2026-06-30',notes:'Responsable: Comercial / Legal'},
  {tipo:'cs', clientId:'colombiana',title:'Operación — Coordinar mesa de trabajo por problemas de pedidos',                    desc:'Organizar mesa de trabajo recurrente para resolver problemas de pedidos.',      causa:'Alta rotación interna del cliente impacta continuidad operativa',                                status:'en-progreso',priority:'alta',   bottleneck:false,dueDate:'2026-06-20',notes:'Responsable: CS'},
  // ── EMMA SLEEP ──
  {tipo:'cs', clientId:'emma-sleep',title:'🔴 Ticket #198 — Confirmar formalización como mejora o desarrollo',               desc:'Verificar si el Ticket #198 (Separación y Verificación) fue formalizado como mejora o desarrollo en Producto.',  causa:'Riesgo crítico: pérdida de ventas y baja adopción si no se resuelve la separación y verificación',             status:'en-progreso',priority:'critica', bottleneck:true, dueDate:'2026-06-24',notes:'Responsable: Samiramis. Riesgo: Crítico'},
  {tipo:'cs', clientId:'emma-sleep',title:'🔴 Ticket #198 — Obtener estatus, responsable y ETA',                            desc:'Conseguir el estado actual, responsable asignado y fecha estimada de entrega del Ticket #198.',                causa:'Sin visibilidad del ETA el cliente no puede planificar su operación',                                            status:'en-progreso',priority:'critica', bottleneck:true, dueDate:'2026-06-24',notes:'Responsable: Samiramis + Producto'},
  {tipo:'pm', clientId:'emma-sleep',title:'🟡 Fulfillment — Validar viabilidad de inventario multicanal (Walmart, Falabella, Ripley)', desc:'Validar con Producto si es viable gestionar inventario Fulfillment para Walmart, Falabella y Ripley desde AnyMarket.', causa:'Procesos manuales y falta de visibilidad en inventario fulfillment multicanal',                              status:'en-progreso',priority:'alta',   bottleneck:false,dueDate:'2026-06-30',notes:'Responsable: CS + Producto'},
  {tipo:'cs', clientId:'emma-sleep',title:'🟡 Walmart Full — Obtener respuesta sobre Venta Directa / Full',                 desc:'Gestionar internamente y con Walmart la respuesta sobre el modelo Venta Directa / Walmart Full.',               causa:'Dependencia externa — sin acceso a información operativa de Walmart Full',                                      status:'en-progreso',priority:'alta',   bottleneck:true, dueDate:'2026-06-30',notes:'Responsable: Samiramis. Cuello de botella: requiere respuesta de Walmart'},
  {tipo:'pm', clientId:'emma-sleep',title:'🟢 Imágenes — Levantar evaluación de Producto para gestión multicanal',          desc:'Iniciar evaluación de Producto para soporte de imágenes multicanal y evitar rechazo de publicaciones.',         causa:'Riesgo de rechazo de publicaciones por gestión manual de imágenes en múltiples canales',                       status:'en-progreso',priority:'media',  bottleneck:false,dueDate:'2026-07-07',notes:'Responsable: CS + Producto'},
  {tipo:'cs', clientId:'emma-sleep',title:'Seguimiento — Mantener reuniones semanales con Emma Sleep',                      desc:'Coordinar y mantener cadencia de reuniones semanales para dar seguimiento a todos los riesgos abiertos.',       causa:'Riesgo escalamiento alto — múltiples iniciativas simultáneas requieren seguimiento continuo',                   status:'en-progreso',priority:'alta',   bottleneck:false,dueDate:'2026-06-24',notes:'Responsable: Samiramis. Frecuencia: semanal'},
  {tipo:'cs', clientId:'emma-sleep',title:'Mejoras — Reunión con Camila Valbuena',                                             desc:'Agendar y realizar reunión con Camila Valbuena para revisar mejoras.',          causa:'Mejoras acumuladas sin priorización clara',                                                     status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-20',notes:'Responsable: Samiramis'},
  {tipo:'cs', clientId:'emma-sleep',title:'Mejoras — Levantar panel de seguimiento de mejoras',                                desc:'Crear panel de seguimiento para todas las mejoras levantadas.',                 causa:'Falta visibilidad centralizada de estado de mejoras',                                           status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-25',notes:'Responsable: Samiramis'},
  {tipo:'cs', clientId:'emma-sleep',title:'Producto — Identificar necesidad de negocio detrás de cada mejora',                 desc:'Analizar y documentar la necesidad de negocio que justifica cada mejora.',      causa:'Mejoras sin análisis de impacto ni justificación de negocio',                                   status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-25',notes:'Responsable: CS'},
  {tipo:'cs', clientId:'emma-sleep',title:'Producto — Revisar viabilidad y ETA con Mauro',                                     desc:'Validar viabilidad técnica y ETA de cada mejora con Mauro (Producto).',        causa:'Viabilidad técnica pendiente de validación con equipo de producto',                              status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-30',notes:'Responsable: CS + Producto'},
  // ── WHIRLPOOL ──
  {tipo:'cs', clientId:'whirlpool',  title:'Relación — Presentación formal como nueva CSM',                                    desc:'Realizar presentación formal como nueva CSM asignada a Whirlpool.',            causa:'Nueva asignación CSM — cliente sin introducción formal',                                        status:'por-hacer',  priority:'media',  bottleneck:false,dueDate:'2026-06-25',notes:'Responsable: Samiramis'},
  {tipo:'cs', clientId:'whirlpool',  title:'Diagnóstico — Entender operación actual de Whirlpool',                             desc:'Levantar estado actual de la operación, integraciones y marketplaces activos.', causa:'Nueva asignación — operación actual desconocida',                                               status:'por-hacer',  priority:'media',  bottleneck:false,dueDate:'2026-06-30',notes:'Responsable: Samiramis'},
  {tipo:'cs', clientId:'whirlpool',  title:'Roadmap — Identificar proyectos futuros',                                          desc:'Mapear proyectos futuros y oportunidades de crecimiento con Whirlpool.',        causa:'Nueva asignación — roadmap del cliente no mapeado',                                             status:'por-hacer',  priority:'media',  bottleneck:false,dueDate:'2026-07-10',notes:'Responsable: Samiramis'},
  // ── LACOSTE (CANCELADO 2026-07-20 — decisión comercial, marca adquirida por Grupo AXO) ──
  {tipo:'cs', clientId:'lacoste',    title:'Relación — Presentación formal como nueva CSM',                                    desc:'Realizar presentación formal como nueva CSM asignada a Lacoste Chile.',         causa:'Nueva asignación CSM — cliente sin introducción formal',                                        status:'resuelto',  priority:'media',  bottleneck:false,dueDate:'2026-06-25',notes:'Responsable: Samiramis. Cerrado por cancelación de cuenta (Grupo AXO adquirió el derecho comercial de la marca) — 2026-07-20.'},
  {tipo:'cs', clientId:'lacoste',    title:'Diagnóstico — Levantar objetivos actuales de Lacoste',                             desc:'Entender objetivos comerciales actuales y estado de la operación.',             causa:'Nueva asignación — objetivos del cliente no levantados',                                        status:'resuelto',  priority:'media',  bottleneck:false,dueDate:'2026-06-30',notes:'Responsable: Samiramis. Cerrado por cancelación de cuenta (Grupo AXO adquirió el derecho comercial de la marca) — 2026-07-20.'},
  {tipo:'cs', clientId:'lacoste',    title:'Roadmap — Definir próximos pasos con Lacoste',                                     desc:'Definir hoja de ruta y próximas acciones conjuntas.',                          causa:'Nueva asignación — plan de acción no definido',                                                 status:'resuelto',  priority:'media',  bottleneck:false,dueDate:'2026-07-10',notes:'Responsable: Samiramis. Cerrado por cancelación de cuenta (Grupo AXO adquirió el derecho comercial de la marca) — 2026-07-20.'},
  // ── TRAMONTINA ──
  {tipo:'cs', clientId:'tramontina-cl',title:'Stakeholders — Contactar nuevo gerente comercial Chile',                          desc:'Contactar nuevo gerente comercial de Chile y agendar reunión de alineación.',   causa:'Cambio de stakeholders — riesgo de pérdida de continuidad comercial',                            status:'por-hacer',  priority:'alta',   bottleneck:true, dueDate:'2026-06-20',notes:'Responsable: Samiramis'},
  {tipo:'cs', clientId:'tramontina-cl',title:'Operación — Entender estado actual del proyecto Chile',                          desc:'Levantar estado completo del proyecto Tramontina en Chile.',                   causa:'Cambio de stakeholders impacta visibilidad del proyecto',                                        status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-20',notes:'Responsable: Samiramis'},
  {tipo:'cs', clientId:'tramontina-cl',title:'Chile — Validar necesidad Marca Selecta',                                        desc:'Validar con el equipo Chile si la necesidad de Marca Selecta aplica.',          causa:'Necesidad de Marca Selecta no validada — puede impactar alcance del proyecto',                   status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-25',notes:'Responsable: Samiramis'},
  {tipo:'cs', clientId:'tramontina-mx',title:'México — Alinear con Mauricio sobre estado y próximos pasos',                    desc:'Reunión de alineación con Mauricio para México.',                              causa:'Desalineación entre equipos de los distintos países',                                           status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-25',notes:'Responsable: Samiramis'},
  {tipo:'cs', clientId:'tramontina-mx',title:'Liverpool — Revisar avance y dependencias del proyecto',                         desc:'Revisar con João el avance del proyecto Liverpool y sus dependencias.',          causa:'Proyecto Liverpool con avance incierto y dependencias no resueltas',                             status:'por-hacer',  priority:'alta',   bottleneck:true, dueDate:'2026-06-25',notes:'Responsable: João'},
  {tipo:'cs', clientId:'tramontina-cl',title:'Integración — Levantar y analizar flujo Vitex → AnyMarket → Marketplaces',         desc:'Levantar y analizar el flujo actual Vitex → AnyMarket → Marketplaces para identificar oportunidades de automatización y centralización operativa. Validar alternativas para resolver las limitaciones de DBnet y el mapeo de Falabella, con foco en reducir procesos manuales, mejorar la adopción de la plataforma y habilitar futuras expansiones a Ripley y Paris.',causa:'Limitaciones de DBnet y mapeo Falabella generan procesos manuales — bloquean expansión a Ripley y Paris y frenan adopción de plataforma', status:'por-hacer',  priority:'alta',   bottleneck:true, dueDate:'2026-06-30',notes:'Responsable: Samiramis. Involucrar Producto para evaluar alternativas técnicas a DBnet.'},
  {tipo:'cs', clientId:'tramontina-mx',title:'Tramontina Perú — Presentación formal y diagnóstico de operación',               desc:'Contactar equipo Tramontina Perú, presentarse como CSM y levantar estado de la operación.',causa:'Nueva asignación — operación Perú sin diagnóstico actualizado',               status:'por-hacer',  priority:'alta',   bottleneck:false,dueDate:'2026-06-30',notes:'Responsable: Samiramis'},
  // ── GERMAN — TICKETS URGENTES ──
  {tipo:'soporte',clientId:'comercial-agustin',title:'Resolver vinculación MercadoLibre — 3 tickets activos (#32221, #32211, #31640)',desc:'3 tickets abiertos sobre el mismo problema de vinculación ML. Revisar con soporte si hay un bug activo o una configuración incorrecta.',causa:'Falla recurrente en vinculación MercadoLibre — 3 tickets del mismo issue sin causa raíz identificada',status:'por-hacer',priority:'alta',bottleneck:false,dueDate:'2026-06-30',notes:'Responsable: German'},
  {tipo:'soporte',clientId:'neumaticos-maule',title:'Escalar resolución Bsale — #18014 urgente (53 días sin resolver)',desc:'Ticket urgente sobre configuración Bsale sin resolver en 53 días. Verificar estado, escalar si sigue abierto.',causa:'Ticket urgente sin gestión activa durante 53+ días — posible problema de Bsale no configurado',status:'por-hacer',priority:'critica',bottleneck:false,dueDate:'2026-06-27',notes:'Responsable: German — escalar a soporte y verificar con cliente'},
  {tipo:'soporte',clientId:'seducete-cl',title:'Resolver pedidos no traspasados — #20662 urgente (44 días)',desc:'Pedidos no se traspasan al sistema — issue crítico sin resolución en 44+ días. Contactar cliente y escalar.',causa:'Pedidos sin traspaso bloqueando operación — ticket urgente no gestionado en 44 días',status:'por-hacer',priority:'critica',bottleneck:false,dueDate:'2026-06-27',notes:'Responsable: German'},
  {tipo:'cs',clientId:'yeppo-cl',title:'Gestionar cliente insatisfecho — #17220 sentimiento muy negativo (58 días)',desc:'Ticket con mensaje "otra vez problemas" — cliente muy negativo. Contacto urgente para evitar escalamiento o churn.',causa:'Problema recurrente + sentimiento muy negativo expresado — 58 días sin cierre ni seguimiento CS',status:'por-hacer',priority:'critica',bottleneck:false,dueDate:'2026-06-27',notes:'Responsable: German — llamar proactivamente antes del fin de semana'},
  // ── GERMAN — ALERTAS FACTURACIÓN VENCIDA ──
  {tipo:'finanzas',clientId:'mouvair-cl',title:'🔴 Factura VENCIDA 57 días — MOUVAIR (CLP $711.174 / ~USD 749)',desc:'Factura de abril 2026 vencida hace 57 días sin pago. Verificar con finanzas y contactar al cliente.',causa:'Factura impaga durante 57 días — riesgo de corte de servicio',status:'por-hacer',priority:'critica',bottleneck:false,dueDate:'2026-06-27',notes:'Responsable: German + Finanzas DB1. Fuente: relbase.cl/recaudacion'},
  {tipo:'finanzas',clientId:'trail-cl',title:'🔴 Factura VENCIDA 57 días — TRAIL (CLP $426.705 / ~USD 449)',desc:'Factura de abril 2026 vencida hace 57 días. Verificar con finanzas y contactar al cliente.',causa:'Factura impaga 57 días — posible riesgo de baja o corte',status:'por-hacer',priority:'critica',bottleneck:false,dueDate:'2026-06-27',notes:'Responsable: German + Finanzas DB1. Fuente: relbase.cl/recaudacion'},
  {tipo:'finanzas',clientId:'tpv-cl',title:'🟠 Factura VENCIDA 26 días — TPV (CLP $768.761 / ~USD 809)',desc:'Factura mayo vencida hace 26 días. Mayor cliente de German por MRR. Prioridad alta.',causa:'Factura impaga 26 días en cliente de alto valor — MRR ~USD 994',status:'por-hacer',priority:'alta',bottleneck:false,dueDate:'2026-06-30',notes:'Responsable: German + Finanzas DB1. Fuente: relbase.cl/recaudacion'},
  {tipo:'finanzas',clientId:'mali-cl',title:'🟠 Factura VENCIDA 26 días — MALI (CLP $529.383 / ~USD 557)',desc:'Factura mayo vencida hace 26 días.',causa:'Factura impaga 26 días — seguimiento pendiente',status:'por-hacer',priority:'alta',bottleneck:false,dueDate:'2026-06-30',notes:'Responsable: German + Finanzas DB1. Fuente: relbase.cl/recaudacion'},
  {tipo:'finanzas',clientId:'platanitos-cl',title:'🟠 Factura VENCIDA 26 días — PLATANITOS (CLP $409.493 / ~USD 431)',desc:'Factura mayo vencida hace 26 días.',causa:'Factura impaga 26 días',status:'por-hacer',priority:'alta',bottleneck:false,dueDate:'2026-06-30',notes:'Responsable: German + Finanzas DB1. Fuente: relbase.cl/recaudacion'},
  {tipo:'finanzas',clientId:'importclick-cl',title:'🟠 Factura VENCIDA 26 días — IMPORTCLICK (CLP $385.005 / ~USD 405)',desc:'Factura mayo vencida hace 26 días.',causa:'Factura impaga 26 días',status:'por-hacer',priority:'media',bottleneck:false,dueDate:'2026-06-30',notes:'Responsable: German + Finanzas DB1. Fuente: relbase.cl/recaudacion'},
  // ── ACCIONES ESTRATÉGICAS JULIO 2026 ──
  {tipo:'cs',clientId:'belcorp-col',title:'📋 BELCORP — Firma hoja de personas involucradas para registro como proveedor',desc:'Belcorp exige una hoja con las personas involucradas en el proyecto para poder registrar a AnyMarket/DB1 como proveedor oficial en su sistema de proveedores. QUIÉN DEBE FIRMAR: representante autorizado de DB1/AnyMarket (Dirección). QUIÉN LO GESTIONA: Sami (CS). POR QUÉ ES URGENTE: sin esta firma, Belcorp no puede completar el alta de proveedor, lo que bloquea la formalización de la relación comercial y puede impactar la renovación y expansión de todas las cuentas Belcorp (Chile, Colombia, Perú, México).',causa:'Proceso de homologación de proveedores de Belcorp requiere documentación interna firmada por DB1. Sin esto, el registro queda bloqueado del lado del cliente.',status:'por-hacer',priority:'alta',bottleneck:true,dueDate:'2026-07-04',notes:'Aplica a todas las cuentas Belcorp: Chile, Colombia, Perú, México. Responsable: Sami → Dirección DB1 (obtener firma) → enviar a contacto Belcorp. Documentación ya preparada, solo falta firma.'},
  {tipo:'cs',clientId:'belcorp-col',title:'🔧 Belcorp — CS+Soporte: Cambio IP pública a IP fija (todas las cuentas)',desc:'Coordinar con Soporte la gestión del cambio de IP pública a IP fija para todos los clientes Belcorp. Entregar valor conjunto CS+Soporte como acción proactiva.',causa:'IP pública dinámica puede generar intermitencias en integraciones. Cambio a IP fija = estabilidad operativa + percepción de valor alto.',status:'por-hacer',priority:'alta',bottleneck:false,dueDate:'2026-07-08',notes:'Responsable: Sami (CS) + Soporte. Aplica a Belcorp Chile, Colombia, Perú, México. Comunicar como mejora proactiva.'},
  {tipo:'cs',clientId:null,title:'🏛️ Gobernanza — Protocolo de escalamiento clientes críticos',desc:'Definir y documentar el protocolo de escalamiento: cuándo un cliente es crítico, quién lo escala, a quién, y en qué tiempo. No puede pasar que haya un cliente grave sin escalamiento visible.',causa:'Riesgo operativo: clientes graves pueden no ser escalados a tiempo si no hay un proceso formal con responsables y SLAs.',status:'por-hacer',priority:'alta',bottleneck:false,dueDate:'2026-07-10',notes:'Propuesta: NPS < -50 o Health Score < 30 → escalar automáticamente a CS Manager en 24h. Revisar con Dirección.'},
  {tipo:'pm',clientId:'updown-juegos',title:'🏭 UPDOWN JUEGOS — PBI 1673726: FULL-FLEX sin ETA → Escalado a Fabio (PO)',desc:'Card 1673726 CONVIVÊNCIA FULL-FLEX — Sami ya escaló a Fabio (PO). Estado: Planning, sin ETA definida. El bug impide actualizar stock Flex cuando stock Full = 0 → quiebres de stock recurrentes. Afecta la operación de UPDOWN JUEGOS desde hace varios meses. Cliente muy insatisfecho (NPS bajo) y percibe que Fábrica no prioriza su caso. ACCIÓN PENDIENTE: obtener de Fabio la fecha comprometida de entrega para poder comunicar al cliente.',causa:'El cliente lleva meses con quiebres de stock esporádicos por esta validación incorrecta. Sin fecha comprometida no puedo gestionar expectativas ni retener al cliente.',status:'en-progreso',priority:'critica',bottleneck:true,dueDate:'2026-07-08',notes:'URL: https://db1global.visualstudio.com/ANYMARKET/_workitems/edit/1673726/ — Escalado 01-Jul-2026 → @Fabio (PO). URGENTE: Conseguir fecha de entrega esta semana. Impacto cliente: riesgo de churn activo. Historial: problema reportado hace meses, sin resolución.'},
  {tipo:'pm',clientId:'updown-juegos',title:'🐛 UPDOWN JUEGOS — Card 2015782: WooCommerce I/O error PUT → Mauro notificado 01-Jul',desc:'Bug 2015782 [WOOCOMMERCE] Erro I/O error on PUT request ao Atualizar Anúncio. Fecha de entrega comprometida: 18/06/2026 — YA VENCIDA (13 días). Sami escribió a Mauro por mensaje interno el 01-Jul-2026. ACCIÓN PENDIENTE: Mauro debe confirmar nueva fecha de entrega y asignar developer. Afecta operación de UPDOWN JUEGOS: quiebres de stock esporádicos por timeout WooCommerce → ventas perdidas. Junto con PBI 1673726, ambos bugs vienen afectando la operación del cliente desde hace tiempo.',causa:'WooCommerce tarda en responder y AnyMarket no reintenta el update, dejando stock desincronizado. Dos bugs activos simultáneamente generan riesgo de churn alto.',status:'en-progreso',priority:'critica',bottleneck:true,dueDate:'2026-07-05',notes:'URL: https://db1global.visualstudio.com/ANYMARKET/_workitems/edit/2015782/ — Fecha comprometida VENCIDA 18-jun. Notificado a Mauro vía interno 01-Jul-2026. Esperar respuesta con nueva fecha. Si no responde antes del 03-Jul → escalar a Dirección.'},
  {tipo:'cs',clientId:null,title:'📈 Evolución CS — Presentar métricas de mejora a Dirección (01-Jul)',desc:'Mostrar la evolución de la cartera: NPS recuperados (BOTIGA + FORUS), tickets cerrados, migraciones en progreso, dashboard implementado. Evidenciar el valor del trabajo CS.',causa:'La Dirección necesita ver la evolución e impacto del CS. Visibilidad del trabajo es estratégica para el posicionamiento de Sami.',status:'por-hacer',priority:'alta',bottleneck:false,dueDate:'2026-07-01',notes:'Presentar hoy en reunión 13h: NPS +100pts recuperados, 0 churns, CS Command Center lanzado, migraciones activas.'},
];

export function seedActions() { return SEED_ACTIONS.map(a => ({...a, id: uid(), createdAt:'2026-06-12'})); }

export function getDeletedSeedTitles() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_DELETED_SEEDS) || '[]')); }
  catch(e) { return new Set(); }
}
export function markSeedAsDeleted(title) {
  const deleted = getDeletedSeedTitles();
  deleted.add(title);
  localStorage.setItem(LS_DELETED_SEEDS, JSON.stringify([...deleted]));
}

// NOTE: REMOVED_SEED_TITLES lives in clients-repo.js in source order (defined right after
// SEED, before SEED_MARKETPLACES) but is only ever read here, by mergeSeedActions(). Kept
// in clients-repo.js per this agent's file assignment (it's co-located there with the other
// PORT/SEED-adjacent seed constants) and imported here.
import { REMOVED_SEED_TITLES } from './clients-repo.js';

export function mergeSeedActions() {
  const _u = getActiveUser();
  // viewer/director aggregate from CSMs — no merge needed here
  if (_u && ['director','viewer'].includes(_u.role)) return;
  const visIds = getVisibleClientIds();
  // HARD isolation FIRST: strip any actions not belonging to this user's clients
  actions = actions.filter(a => visIds.includes(a.clientId));
  // Remove obsolete seed titles
  actions = actions.filter(a => !REMOVED_SEED_TITLES.has(a.title));
  // Skip seeds deliberately deleted by the user
  const deletedSeeds = getDeletedSeedTitles();
  // Only ADD seeds for this user's clients, not yet present, not deleted
  const existingTitles = new Set(actions.map(a => a.title));
  const toAdd = SEED_ACTIONS
    .filter(a => visIds.includes(a.clientId) && !existingTitles.has(a.title) && !deletedSeeds.has(a.title))
    .map(a => ({...a, id: uid(), createdAt:'2026-06-12'}));
  if (toAdd.length > 0) { actions = [...actions, ...toAdd]; }
  saveActions();
}

export function saveActions() {
  const _activeUserForSave = getActiveUser();
  // NOTE: canEdit() (profiles-repo.js) — imported lazily-shaped here as a direct import
  // to avoid a require-cycle at module-eval time; see header assumptions.
  if (!_activeUserForSave || !canEdit()) return; // viewer: read-only
  if (['superadmin','director'].includes(_activeUserForSave.role)) {
    // Superadmin: SOLO guarda en su propio key — no sobreescribe datos de otros CSMs
    // (evita borrar acciones de German/D&E/María cuando Sami guarda)
    const _actionsKeySelf = getActionsKey(_activeUserForSave.id);
    const _valSelf = JSON.stringify(actions.filter(a => _activeUserForSave.clientIds.includes(a.clientId)));
    localStorage.setItem(_actionsKeySelf, _valSelf);
    pushToSupabase(_actionsKeySelf, _valSelf);
    scheduleGistSave();
    return;
  }
  // CSM: guarda solo sus propias acciones
  const _actionsKeySave = getActionsKey(_activeUserForSave.id);
  const val = JSON.stringify(actions.filter(a => _activeUserForSave.clientIds.includes(a.clientId)));
  localStorage.setItem(_actionsKeySave, val);
  pushToSupabase(_actionsKeySave, val);
  scheduleGistSave();
}

// ── ACTION FORM SAVE / DELETE / QUICK-EDIT ───────────────────────────────────
// (index.html ~4040-4088) — DOM-coupled (reads `fa-*` / `anotes-*` form fields directly),
// mechanically kept as-is per task instructions rather than split into a separate ui form.
export function saveAction(){
  const title=document.getElementById('fa-title').value.trim();if(!title){alert('El título es obligatorio.');return;}
  const id=document.getElementById('editActionId').value;
  const obj={id:id||uid(),tipo:document.getElementById('fa-tipo').value,clientId:document.getElementById('fa-client').value,title,desc:document.getElementById('fa-desc').value.trim(),causa:document.getElementById('fa-causa').value.trim(),status:document.getElementById('fa-status').value,priority:document.getElementById('fa-priority').value,dueDate:document.getElementById('fa-due').value||null,bottleneck:document.getElementById('fa-bottleneck').checked,notes:document.getElementById('fa-notes').value.trim(),createdAt:id?(actions.find(x=>x.id===id)?.createdAt||today()):today(),updatedAt:today()};
  if(id){const i=actions.findIndex(x=>x.id===id);if(i>=0)actions[i]=obj;else actions.push(obj);}else actions.push(obj);
  saveActions();renderAcciones();closeAddActionModal();
}
export function deleteCurrentAction(){
  const id=document.getElementById('editActionId').value;
  if(!id)return;
  if(!confirm('¿Eliminar esta acción?'))return;
  const action = actions.find(a=>a.id===id);
  // Si el título existe en SEED_ACTIONS, marcarlo como eliminado para que no vuelva a aparecer
  if(action && SEED_ACTIONS.some(s=>s.title===action.title)){
    markSeedAsDeleted(action.title);
  }
  actions=actions.filter(a=>a.id!==id);
  saveActions();renderAcciones();closeAddActionModal();
}
export function quickSaveAction(id, field, value) {
  const idx = actions.findIndex(a => a.id === id);
  if (idx < 0) return;
  actions[idx] = {...actions[idx], [field]: value, updatedAt: today()};
  saveActions();
  scheduleGistSave();
  renderAcciones();
}
export function quickSaveNote(id) {
  const ta = document.getElementById('anotes-' + id);
  if (!ta) return;
  const idx = actions.findIndex(a => a.id === id);
  if (idx < 0) return;
  actions[idx] = {...actions[idx], notes: ta.value.trim(), updatedAt: today()};
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
  if (btn) { const a = actions.find(x => x.id === id); btn.textContent = isOpen ? (a?.notes ? '📝 Ver nota' : '📝 + Nota') : '📝 Cerrar'; }
}

// exposed for inline HTML handlers
// NOTE: saveAction/deleteCurrentAction/quickSaveAction/quickSaveNote/toggleActionNotes are
// invoked via onclick in index.html (confirmed by grep of the whole file for onclick=" +
// these names, e.g. onclick="quickSaveAction(...)" in the acciones table rows and
// onclick="saveAction()" / onclick="deleteCurrentAction()" in the add/edit-action modal).
window.saveAction = saveAction;
window.deleteCurrentAction = deleteCurrentAction;
window.quickSaveAction = quickSaveAction;
window.quickSaveNote = quickSaveNote;
window.toggleActionNotes = toggleActionNotes;
