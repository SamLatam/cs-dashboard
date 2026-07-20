// Extracted verbatim from index.html (lines ~6472-6932, "FAQ CS & ANYMARKET
// & ANYTOOLS")
//
// FAQ_DATA and `faqOpen` are module-level state that sit physically between
// renderPredicciones (index.html:6468) and renderFaq (index.html:6880) in the
// source — they are consumed only by renderFaq/toggleFaq/filterFaq below (and,
// cross-file, by renderCapacitacion's embedded FAQ viewer in
// ../ui/capacitacion.js), so they live here and are exported for that
// cross-file use.

const FAQ_DATA = [
  {
    cat: '🏪 AnyMarket — Plataforma y funcionamiento',
    items: [
      {
        q: '¿Qué es AnyMarket y qué problema resuelve?',
        a: `<strong>AnyMarket es un hub de integración multicanal</strong> que conecta el catálogo, stock y pedidos de un vendedor con múltiples marketplaces (Mercado Libre, Falabella, Ripley, Paris, Walmart, Amazon, etc.) desde un único panel.<br><br>
        El problema que resuelve: sin AnyMarket, un vendedor que opera en 5 marketplaces necesita gestionar 5 sistemas distintos — catálogo, precios, stock y pedidos por separado en cada uno. AnyMarket centraliza todo, elimina errores de stock cruzado y automatiza la sincronización en tiempo real.`
      },
      {
        q: '¿Cómo funciona la sincronización de stock en AnyMarket?',
        a: `AnyMarket sincroniza el stock en <strong>tiempo real o por polling</strong> según la configuración del marketplace. Cuando un pedido entra en cualquier canal, el stock se descuenta automáticamente en todos los demás para evitar sobreventa.<br><br>
        <strong>Puntos críticos a monitorear:</strong><br>
        • <strong>Transmisiones fallidas</strong> → el SKU deja de actualizarse en el marketplace<br>
        • <strong>Stock en 0</strong> → la publicación se pausa automáticamente<br>
        • <strong>Delay de sincronización</strong> → puede ocurrir en períodos de alta demanda (Cyber, Black Friday)<br><br>
        Si un cliente reporta sobreventas, el primer lugar para revisar son las <em>Transmisiones</em> y el log de errores de stock.`
      },
      {
        q: '¿Qué son las Transmisiones y cómo se interpretan los errores?',
        a: `Las <strong>Transmisiones</strong> son los registros de sincronización de cada SKU hacia cada marketplace. Cada transmisión puede estar en estado:<br><br>
        • ✅ <strong>Sincronizado</strong> → todo ok<br>
        • ⚠️ <strong>Con advertencia</strong> → se publicó pero hay campos incompletos<br>
        • ❌ <strong>Error</strong> → no se pudo publicar, requiere acción<br><br>
        <strong>Errores más comunes:</strong><br>
        • <code>SKU sin imagen</code> → el marketplace rechaza publicaciones sin foto<br>
        • <code>Categoría inválida</code> → el mapeo de categoría no coincide con la taxonomía del marketplace<br>
        • <code>Precio fuera de rango</code> → el precio mínimo/máximo no cumple las reglas del canal<br>
        • <code>Atributo requerido faltante</code> → falta un campo obligatorio (talla, color, EAN, etc.)`
      },
      {
        q: '¿Cómo funciona el mapeo de categorías entre AnyMarket y los marketplaces?',
        a: `El mapeo de categorías es el proceso donde se define a qué categoría del marketplace corresponde cada categoría del catálogo del vendedor.<br><br>
        <strong>¿Por qué falla?</strong> Los marketplaces actualizan su taxonomía frecuentemente. Si Falabella cambia "Calzado Hombre" a "Zapatos y Botines > Hombre", el mapeo queda roto y los SKUs dejan de publicarse.<br><br>
        <strong>Acción CS:</strong> Cuando un cliente reporta que sus productos "desaparecieron" de un marketplace, revisar primero el mapeo de categorías en AnyMarket antes de escalar a soporte.`
      },
      {
        q: '¿Qué diferencia hay entre un SKU, un producto y una publicación en AnyMarket?',
        a: `<strong>Producto</strong> → La ficha madre con información general (nombre, descripción, categoría, atributos).<br><br>
        <strong>SKU</strong> → La variante específica del producto con stock y precio propio (ej. talle M, color azul). Un producto puede tener múltiples SKUs.<br><br>
        <strong>Publicación</strong> → La combinación de un SKU + un marketplace. Un SKU puede tener múltiples publicaciones activas (una en ML, una en Falabella, etc.).<br><br>
        <strong>Importancia CS:</strong> Cuando el cliente dice "tengo 500 productos", puede tener 3.000 SKUs y 15.000 publicaciones activas. El volumen real de la operación se mide en SKUs activos y transmisiones exitosas.`
      },
      {
        q: '¿Cómo se gestionan los pedidos en AnyMarket?',
        a: `Los pedidos de todos los marketplaces aparecen unificados en el módulo de <strong>Pedidos</strong> de AnyMarket. El flujo estándar es:<br><br>
        1. Cliente compra en marketplace → pedido ingresa en AnyMarket<br>
        2. AnyMarket descuenta stock y notifica al ERP/WMS del cliente<br>
        3. El cliente despacha y carga el código de tracking en AnyMarket<br>
        4. AnyMarket actualiza el estado del pedido en el marketplace<br><br>
        <strong>Integraciones más comunes:</strong> SAP, VTEX, Netsuite, WooCommerce, Shopify, Magento, DBnet.<br>
        <strong>Riesgo:</strong> Si la integración con el ERP falla, los pedidos quedan en estado "pendiente" y la reputación del vendedor cae.`
      }
    ]
  },
  {
    cat: '⚙️ AnyTools — Suite Completa de Herramientas',
    items: [
      {
        q: '¿Qué es AnyTools como suite y cuál es su propuesta de valor?',
        a: `<strong>AnyTools</strong> es el ecosistema de soluciones premium de DB1 Group diseñado para que los vendedores de marketplaces operen con mayor inteligencia, automatización y rentabilidad. No es un solo producto — es una <strong>suite integrada</strong> de herramientas especializadas que trabajan sobre la misma base de datos de AnyMarket.<br><br>
        <strong>La propuesta de valor central:</strong> AnyMarket te conecta con los marketplaces. AnyTools te hace ganar en ellos.<br><br>
        <strong>Productos del ecosistema AnyTools:</strong><br>
        🛒 <strong>AnyMarket</strong> → Hub de integración multicanal — conecta catálogo, stock y pedidos con múltiples marketplaces<br>
        🤖 <strong>Predize</strong> → SAC de marketplaces con IA — centraliza atención al cliente y automatiza respuestas 24/7<br>
        💰 <strong>Koncili</strong> → Conciliación financiera automática de repasses de marketplaces con esfuerzo cero<br>
        🏆 <strong>WinnerBox</strong> → Precificación dinámica automática y monitoreo de competidores (Buy Box ML y Amazon)<br>
        🏷️ <strong>Marca Seleta</strong> → Protección y gestión de marca en marketplaces<br>
        📊 <strong>AnyTools Insights</strong> → Inteligencia de datos y analytics para decisiones estratégicas<br>
        🔄 <strong>Any2Any</strong> → Integración entre plataformas y ERPs<br><br>
        <strong>¿Por qué importa para CS?</strong> Cada herramienta de AnyTools activada es:<br>
        ✅ Mayor adopción de plataforma (sube Use Points)<br>
        ✅ Mayor stickiness (más difícil de migrar a competencia)<br>
        ✅ Mayor valor entregado = menor riesgo de churn<br>
        ✅ Mayor revenue para AnyMarket (oportunidad de expansión)`
      },
      {
        q: '¿Qué es Predize y cuándo recomendarlo?',
        a: `<strong>Predize by AnyTools</strong> es la plataforma especialista en <strong>SAC (Servicio de Atención al Cliente) para vendedores de marketplaces</strong>. Centraliza en un solo panel la gestión de preguntas, mensajes y tickets de múltiples cuentas y canales, potenciada con Inteligencia Artificial. Presente en Chile, Argentina, México, Colombia, Uruguay y Brasil.<br><br>
        <strong>¿Qué canales centraliza?</strong><br>
        🛒 Mercado Libre · Amazon · Coppel<br>
        💬 WhatsApp · Email · Zendesk<br><br>
        <strong>Funcionalidades clave:</strong><br>
        📥 <strong>Centralización</strong> → Todas las preguntas y mensajes de 3+ marketplaces en una sola pantalla<br>
        🎫 <strong>Gestión de tickets</strong> → Filtros, priorización, paneles por canal y equipo, SLA<br>
        📊 <strong>Dashboard e informes</strong> → KPIs de atención, tasa de respuesta, tiempo de resolución<br>
        🔌 <strong>API</strong> → Integración con herramientas internas del cliente<br><br>
        <strong>Agentes de I.A. "Mia" (automatización 24/7):</strong><br>
        🤖 <strong>Agente de preventa</strong> → Responde preguntas de compradores antes de la venta<br>
        💬 <strong>Agente de chat</strong> → Atención automatizada en tiempo real<br>
        📦 <strong>Agente de posventa</strong> → 100% autónomo, gestiona reclamos y seguimiento de pedidos<br>
        ⚠️ <strong>Agente de riesgo de cancelación</strong> → Detecta y actúa ante riesgo de cancelación<br>
        🎯 <strong>Agente de asignación</strong> → Distribuye tickets automáticamente al agente correcto<br><br>
        <strong>Resultados comprobados:</strong><br>
        ⚡ <strong>40% menos esfuerzo</strong> con automatización por I.A.<br>
        📈 <strong>3x más eficiencia</strong> para el equipo de SAC<br>
        ✅ <strong>75% más respuestas</strong> enviadas dentro de los plazos del marketplace<br>
        💰 <strong>+US$25M en ventas</strong> generadas por el chat con I.A.<br>
        🏪 <strong>+4.000 tiendas</strong> integradas · +30M mensajes gestionados<br><br>
        <strong>¿Cuándo recomendarlo?</strong><br>
        ✅ Clientes con alto volumen de preguntas en ML o Amazon<br>
        ✅ Clientes con reputación amarilla/naranja por demoras en respuestas<br>
        ✅ Clientes con equipo de SAC gestionando múltiples cuentas manualmente<br>
        ✅ Clientes que operan en 3+ marketplaces simultáneamente<br>
        ✅ Clientes que quieren atención automatizada fuera de horario comercial<br><br>
        <strong>Trigger de conversación:</strong><br>
        "¿Cómo está gestionando tu equipo las preguntas de compradores en los marketplaces? ¿Lo hacen marketplace por marketplace o tienen alguna herramienta?" → si la respuesta es manual o marketplace por marketplace, Predize es la solución.<br><br>
        🔗 <a href="https://predize.cl" target="_blank" style="color:var(--accent)">predize.cl</a>`
      },
      {
        q: '¿Qué es Koncili y por qué es crítico para operaciones financieras?',
        a: `<strong>Koncili by AnyTools</strong> es el servicio especializado en <strong>conciliación financiera de marketplaces con esfuerzo cero</strong>. Resuelve uno de los mayores dolores invisibles del vendedor online: <em>¿los marketplaces me están pagando exactamente lo que me corresponde?</em><br><br>
        <strong>El problema que resuelve:</strong> Cada marketplace genera liquidaciones complejas con comisiones, flete, descuentos de campaña, devoluciones, estornos y penalizaciones. Sin Koncili, el equipo financiero del cliente hace todo esto en Excel — proceso que toma días, es propenso a errores y deja pérdidas sin detectar.<br><br>
        <strong>Cómo funciona el Koncili Service:</strong><br>
        1. Importan los datos de ventas de los marketplaces del cliente<br>
        2. Un equipo de especialistas monitorea, analiza y trata las conciliaciones<br>
        3. Identifican divergencias e inconsistencias en los pagos recibidos<br>
        4. Generan reportes financieros detallados con insights accionables<br>
        5. Baja automática de títulos en los ERPs integrados (SAP, Sankhya, TOTVS, Bling, Omie, etc.)<br><br>
        <strong>Reportes incluidos:</strong><br>
        📊 Resumen mensual de resultados · Resumen financiero por canal<br>
        💸 Gastos por marketplace · Análisis de campañas y promociones<br>
        🔄 Devoluciones y estornos detallados · Bloqueos y desbloqueos<br>
        📋 Anexo para DRE (estado de resultados)<br><br>
        <strong>Marketplaces integrados:</strong> Mercado Libre, Amazon, Magalu, Shopee, Americanas, Casas Bahia, Netshoes, Carrefour, Leroy Merlin y más de 20 canales.<br><br>
        <strong>Diferencial clave:</strong> No es solo software — es un <strong>servicio gestionado</strong>. El equipo de Koncili se encarga de todo. El cliente no necesita configurar nada ni entrenarse.<br><br>
        <strong>⭐ Dato relevante para tu cartera:</strong> <strong>DIVINO</strong> ya es cliente de Koncili — puede ser una referencia directa al conversar con otros clientes de tu cartera.<br><br>
        <strong>¿Cuándo recomendarlo?</strong><br>
        ✅ Clientes con equipo financiero que cierra conciliaciones manualmente en Excel<br>
        ✅ Clientes que operan en 3+ marketplaces simultáneamente<br>
        ✅ Clientes con alto volumen de devoluciones o campañas promocionales<br>
        ✅ Clientes con ERP (SAP, TOTVS, Bling) que necesitan baja automática de títulos<br>
        ✅ Clientes que sospechan que los marketplaces no les están pagando correctamente<br><br>
        <strong>Trigger de conversación:</strong><br>
        "¿Cómo hace tu equipo financiero para verificar que los pagos de los marketplaces son correctos?" → si la respuesta es "Excel" o "manualmente", Koncili es la solución perfecta.<br><br>
        🔗 <a href="https://www.koncili.com" target="_blank" style="color:var(--accent)">koncili.com</a>`
      },
      {
        q: '¿Qué es WinnerBox y cómo ayuda a ganar la Buy Box?',
        a: `<strong>WinnerBox by AnyTools</strong> es la herramienta de <strong>precificación dinámica automática y monitoreo de competidores</strong> para marketplaces y tienda propia. Resuelve el desafío central de todo seller: vender más, con mejor margen, sin ajustar precios manualmente.<br><br>
        <strong>¿Qué es la Buy Box?</strong> En Amazon y el Catálogo de Mercado Libre, cuando múltiples vendedores ofrecen el mismo producto, solo uno gana el botón de "Comprar" principal. Quien la tiene se lleva el 80-90% de las ventas. WinnerBox está especializado en ganar y mantener esa posición.<br><br>
        <strong>Agentes inteligentes de WinnerBox:</strong><br>
        👁️ <strong>Monitorar mercado</strong> → Informa precios de competidores y revendedores en tiempo real<br>
        ⚡ <strong>Reacción inmediata</strong> → Detecta cambios y aplica la regla ideal con la mejor margen al instante<br>
        🏆 <strong>Ganar Buy Box</strong> → Define el mejor precio posible dentro del rango elegido por el cliente<br>
        🎯 <strong>Perder para ganar</strong> → Estrategia avanzada: deja que el competidor venda primero, luego vuelve con más margen<br>
        🚫 <strong>Ignorar débiles</strong> → Foca solo en competidores relevantes, ignora los de baja reputación<br>
        💰 <strong>Margen máximo</strong> → Prioriza la rentabilidad, no solo el volumen<br><br>
        <strong>Resultados comprobados:</strong><br>
        📈 <strong>+32% más ventas</strong><br>
        💸 <strong>91% menos costos y esfuerzo</strong> operativo<br>
        💰 <strong>+9% más margen</strong><br>
        ✅ <strong>ROI comprobado desde la 1ª venta</strong><br><br>
        <strong>Integraciones:</strong> Mercado Libre, Amazon, Magalu, Shopee, AnyMarket<br><br>
        <strong>¿Cuándo recomendarlo?</strong><br>
        ✅ Clientes que ajustan precios manualmente y pierden tiempo operativo<br>
        ✅ Clientes con caída de ventas sin explicación clara (probablemente perdiendo Buy Box)<br>
        ✅ Clientes con productos catalogados en ML o Amazon (mismo SKU que competidores)<br>
        ✅ Clientes con marca propia que quieren monitorear precios de sus revendedores<br>
        ✅ Clientes que buscan rentabilidad real, no solo volumen de ventas<br><br>
        <strong>Trigger de conversación:</strong><br>
        "¿Cómo gestionan hoy los precios en Mercado Libre y Amazon? ¿Lo hacen de forma manual?" → si el cliente ajusta precios manualmente o no monitorea competidores, WinnerBox es el argumento perfecto.<br><br>
        🔗 <a href="https://winnerbox.com.br" target="_blank" style="color:var(--accent)">winnerbox.com.br</a>`
      },
      {
        q: '¿Qué es el Match ML y por qué es estratégico?',
        a: `El <strong>Match ML</strong> (también llamado Vinculación) conecta el catálogo del cliente con <strong>listings ya existentes en Mercado Libre</strong> que tienen historial de ventas, reputación y posicionamiento ganado.<br><br>
        <strong>Por qué importa:</strong> En ML, un producto nuevo empieza desde cero en el ranking. Un listing con 500 ventas y 4.8★ tarda años en construirse. El Match permite "subirse" a ese listing y heredar su posición.<br><br>
        <strong>Resultado típico:</strong> Clientes que activan Match ML reportan +30-60% en visibilidad sin cambiar precio ni inversión publicitaria.<br><br>
        <strong>Riesgo a comunicar:</strong> El match debe hacerse con productos idénticos. Un mal match (producto similar pero diferente) puede generar reclamos y dañar la reputación del listing.`
      },
      {
        q: '¿Cómo funcionan los Kits en AnyMarket?',
        a: `Los <strong>Kits</strong> permiten crear bundles o combos de varios SKUs que se venden como una unidad en los marketplaces.<br><br>
        <strong>Ejemplo:</strong> Un cliente de electrodomésticos puede crear un Kit "Cocina completa" = heladera + horno + lavavajillas, con un precio de kit con descuento.<br><br>
        <strong>Funcionamiento:</strong> Cuando se vende el Kit, AnyMarket descuenta el stock de cada componente por separado. El cliente no necesita crear un SKU físico nuevo.<br><br>
        <strong>¿Cuándo recomendarlo?</strong><br>
        ✅ Clientes que quieren aumentar el ticket promedio<br>
        ✅ Clientes con productos complementarios (moda: outfit completo, hogar: set de cama)<br>
        ✅ Temporadas altas (Navidad, Día de la Madre) para armar combos especiales`
      },
      {
        q: '¿Qué son los Use Points (UP) y cómo se calculan?',
        a: `Los <strong>Use Points</strong> son la métrica de adopción de plataforma en AnyMarket. Cada funcionalidad activa suma puntos:<br><br>
        • Publicaciones activas en marketplaces<br>
        • Uso de módulos AnyTools (Repricing, Match, Kits)<br>
        • Integraciones activas con ERP/WMS<br>
        • Volumen de pedidos procesados<br><br>
        <strong>Estructura:</strong> Cada cliente tiene un <code>upPlan</code> (puntos contratados) y un <code>qtUp</code> (puntos consumidos). La relación <code>qtUp / upPlan</code> es el % de adopción.<br><br>
        <strong>Semáforo CS:</strong><br>
        🟢 +80% → adopción excelente, candidato a upsell<br>
        🟡 50-79% → adopción media, hay espacio para crecer<br>
        🟠 1-49% → adopción baja, riesgo de churn por falta de valor percibido<br>
        🔴 0% → cliente sin adopción, alerta máxima`
      },
      {
        q: '¿Cómo funciona el Repricing y cuándo recomendarlo?',
        a: `El <strong>Repricing</strong> ajusta el precio de las publicaciones automáticamente según reglas definidas por el cliente. Tipos de reglas:<br><br>
        • <strong>Precio mínimo / máximo</strong> → nunca vender por debajo ni por encima de un rango<br>
        • <strong>Margen mínimo</strong> → el precio siempre cubre el costo + margen definido<br>
        • <strong>Seguir al ganador</strong> → igualar o superar el precio más bajo del marketplace<br><br>
        <strong>¿Cuándo recomendarlo?</strong><br>
        ✅ Clientes con catálogos grandes (+500 SKUs) donde el ajuste manual es inviable<br>
        ✅ Clientes en marketplaces competitivos (ML, Falabella) donde el precio es determinante<br>
        ✅ Clientes con márgenes estrechos que necesitan protección automática<br>
        ✅ Clientes que pierden la Buy Box frecuentemente por precios desactualizados`
      },
      {
        q: '¿Cómo vender AnyTools sin que suene a upsell forzado?',
        a: `La clave es conectar cada herramienta con un dolor específico que el cliente ya está viviendo. Nunca presentar AnyTools como un producto — presentarlo como la solución a un problema concreto.<br><br>
        <strong>Framework de conversación:</strong><br>
        1. <strong>Identificar el dolor</strong> → "¿Cómo estás manejando hoy el ajuste de precios?"<br>
        2. <strong>Cuantificar el impacto</strong> → "¿Cuánto tiempo le dedica tu equipo a eso por semana?"<br>
        3. <strong>Conectar con la solución</strong> → "Tenemos una herramienta que lo hace automáticamente"<br>
        4. <strong>Mostrar resultado concreto</strong> → "Un cliente similar recuperó 3% de GMV en el primer mes"<br><br>
        <strong>Conversaciones trigger por herramienta:</strong><br>
        • Cliente menciona "gestionamos preguntas de ML/Amazon manualmente" → <strong>Predize</strong><br>
        • Cliente menciona "el cierre financiero nos toma días" → <strong>Koncili</strong><br>
        • Cliente menciona "perdemos ventas pero no sabemos por qué" → <strong>WinnerBox</strong><br>
        • Cliente quiere entrar a ML sin empezar desde cero → <strong>Match ML</strong><br>
        • Cliente quiere subir ticket promedio → <strong>Kits</strong>`
      }
    ]
  },
    {
    cat: '🤝 Customer Success — Gestión de cartera',
    items: [
      {
        q: '¿Cuál es la diferencia entre Soporte y Customer Success?',
        a: `<strong>Soporte</strong> resuelve problemas puntuales que el cliente ya tiene. Es reactivo: el cliente abre un ticket, soporte responde.<br><br>
        <strong>Customer Success</strong> previene los problemas antes de que ocurran y asegura que el cliente logre sus objetivos de negocio usando la plataforma. Es proactivo.<br><br>
        <strong>En AnyMarket, el CS se enfoca en:</strong><br>
        • Que el cliente venda más a través de los marketplaces (GMV creciente)<br>
        • Que adopte las funcionalidades que más impacto tienen en su operación<br>
        • Que renueve y expanda su contrato<br>
        • Que recomiende AnyMarket a otras empresas (NPS promotor)<br><br>
        La regla: <em>si el cliente solo te llama cuando hay un bug, algo está mal en la relación CS.</em>`
      },
      {
        q: '¿Cómo identificar un cliente en riesgo de churn antes de que lo comunique?',
        a: `Las <strong>señales de churn temprano</strong> más comunes en AnyMarket:<br><br>
        🔴 <strong>GMV cayendo 3 meses consecutivos</strong> sin explicación de mercado<br>
        🔴 <strong>NPS negativo o detractor</strong> sin plan de recuperación activo<br>
        🔴 <strong>+5 tickets abiertos simultáneos</strong> → frustración acumulada<br>
        🔴 <strong>Sin contacto hace +45 días</strong> → desconexión de la relación<br>
        🔴 <strong>Use Points en 0 o muy bajos</strong> → no están usando la plataforma<br>
        🔴 <strong>Cambio de stakeholder</strong> → el nuevo contacto no tiene contexto ni relación<br>
        🔴 <strong>Solicitud de descuento inesperada</strong> → puede ser preámbulo a una negociación de salida<br>
        🔴 <strong>Bug crítico sin resolver +7 días</strong> → daño operativo acumulado<br><br>
        La acción: no esperar a que lleguen las señales. Revisar estas métricas semanalmente en el dashboard.`
      },
      {
        q: '¿Cómo preparar una reunión ejecutiva (QBR) efectiva con un cliente?',
        a: `Un buen <strong>QBR (Quarterly Business Review)</strong> tiene esta estructura:<br><br>
        <strong>1. Antes (preparación):</strong><br>
        • GMV del trimestre vs período anterior y vs objetivo<br>
        • Top 3 logros del período (qué funcionó)<br>
        • Top 3 desafíos (qué no funcionó y por qué)<br>
        • Estado de tickets críticos y resolución<br>
        • Adopción de plataforma (Use Points)<br><br>
        <strong>2. Durante (agenda recomendada):</strong><br>
        • [5 min] Contexto: objetivos del cliente para el trimestre<br>
        • [10 min] Resultados: GMV, pedidos, marketplaces activos<br>
        • [10 min] Desafíos: bugs, blockers, fricción operativa<br>
        • [10 min] Roadmap: qué viene en AnyMarket, qué oportunidades hay<br>
        • [10 min] Próximos pasos: compromisos con fechas<br><br>
        <strong>3. Después:</strong><br>
        • Acta con compromisos enviada dentro de las 24 horas<br>
        • Acciones creadas en el dashboard con fecha límite`
      },
      {
        q: '¿Cómo manejar un cliente con NPS negativo?',
        a: `El NPS negativo es una oportunidad de recuperación, no una sentencia de churn. El protocolo:<br><br>
        <strong>Semana 1 — Contener:</strong><br>
        • Llamar (no email) dentro de las 48 horas de recibir el NPS<br>
        • Escuchar sin interrumpir. Preguntar: "¿Qué tendría que pasar para que tu experiencia mejore?"<br>
        • No prometer lo que no puedes cumplir<br>
        • Identificar si hay un bug, un problema de relación o una expectativa no cumplida<br><br>
        <strong>Semana 2-4 — Actuar:</strong><br>
        • Crear acciones concretas con fecha y responsable<br>
        • Comunicar avance cada semana aunque sea pequeño<br>
        • Involucrar al equipo de Soporte y Producto si hay bug crítico<br><br>
        <strong>Mes 2 — Verificar:</strong><br>
        • Reenvisar NPS luego de 30-45 días<br>
        • Si mejoró: documentar como caso de recuperación exitosa<br>
        • Si no mejoró: escalar internamente con plan de retención`
      },
      {
        q: '¿Cómo detectar y ejecutar una oportunidad de expansión (upsell)?',
        a: `Las <strong>señales de expansión</strong> más claras en AnyMarket:<br><br>
        📈 <strong>GMV creciendo +20% MoM</strong> → el cliente está en momentum, es el mejor momento para proponer<br>
        💡 <strong>Use Points cercano al 100%</strong> → está usando todo lo contratado, necesita más<br>
        🛒 <strong>Pocos marketplaces activos vs disponibles</strong> → Falabella disponible pero no conectado<br>
        🔧 <strong>Problemas manuales repetidos</strong> → candidato a AnyTools (Repricing, Kits)<br>
        📦 <strong>Catálogo grande con baja adopción</strong> → Match ML puede impactar el 80% del catálogo<br><br>
        <strong>Cómo proponer:</strong> No vender el producto, vender el resultado.<br>
        ❌ "Te recomiendo activar Repricing"<br>
        ✅ "Con el volumen de SKUs que tenés, si activamos Repricing automático evitamos perder la Buy Box en Falabella — el impacto estimado es X% de incremento en conversión"`
      },
      {
        q: '¿Cómo gestionar el cambio de stakeholder en un cliente?',
        a: `El cambio de contacto es uno de los mayores riesgos de churn en SaaS. El nuevo interlocutor no tiene contexto, no tiene relación y puede cuestionar el valor de la plataforma desde cero.<br><br>
        <strong>Protocolo inmediato (primeras 72 horas):</strong><br>
        1. Contactar al nuevo stakeholder para presentarse<br>
        2. Enviar un resumen ejecutivo del estado de la cuenta (GMV, adopción, logros recientes)<br>
        3. Agendar una reunión de "onboarding ejecutivo" dentro de los próximos 10 días<br><br>
        <strong>En la reunión de onboarding:</strong><br>
        • No asumir que conoce la plataforma — volver a mostrar el valor desde cero<br>
        • Preguntar: "¿Cuáles son tus objetivos para este año en marketplaces?"<br>
        • Presentar el roadmap de AnyMarket relevante para su industria<br><br>
        <strong>Riesgo adicional:</strong> Si el anterior contacto era tu champion y el nuevo no, perder el internal sponsor es una alerta de churn. Mapear quién más en la empresa conoce y defiende AnyMarket.`
      }
    ]
  },
  {
    cat: '🏷️ Marketplaces LATAM — Contexto y particularidades',
    items: [
      {
        q: '¿Cuáles son los marketplaces principales por país en LATAM?',
        a: `<strong>Chile:</strong> Mercado Libre, Falabella, Paris, Ripley, Walmart Chile, Hites<br>
        <strong>Colombia:</strong> Mercado Libre, Falabella Colombia, Linio<br>
        <strong>México:</strong> Mercado Libre, Amazon MX, Walmart MX, Coppel, Liverpool<br>
        <strong>Perú:</strong> Mercado Libre, Falabella Perú, Ripley Perú<br>
        <strong>Uruguay:</strong> Mercado Libre (dominante)<br><br>
        <strong>Mercado Libre</strong> es el marketplace más importante en casi todos los países — prioridad #1 para cualquier cliente. Su reputación (thermómetro de ML) impacta directamente las ventas y la visibilidad.`
      },
      {
        q: '¿Qué es la reputación en Mercado Libre y cómo impacta la operación?',
        a: `La <strong>reputación en ML</strong> es un indicador que ML calcula en base a:<br>
        • % de pedidos con reclamos<br>
        • % de entregas a tiempo<br>
        • % de cancelaciones por parte del vendedor<br><br>
        <strong>Niveles:</strong> Verde (excelente) → Amarillo (buena) → Naranja (regular) → Rojo (mala)<br><br>
        <strong>Impacto en ventas:</strong><br>
        🟢 Verde → máxima visibilidad, elegible para ML Premium<br>
        🟡 Amarillo → visibilidad reducida, no elegible para algunas categorías<br>
        🟠 Naranja → penalización fuerte en el ranking, ventas pueden caer -40%<br>
        🔴 Rojo → cuenta suspendida o con restricciones<br><br>
        <strong>Caso real en cartera:</strong> COBOE (BOTIGA/FARMASHOP) tuvo un incidente de reputación con origen en AnyMarket. Es el tipo de caso que requiere gestión urgente con Partnerships y ML directamente.`
      },
      {
        q: '¿Qué es GFG (Dafiti) y qué particularidades tiene?',
        a: `<strong>GFG (Global Fashion Group)</strong> es el operador de <strong>Dafiti</strong> en LATAM (Chile, Colombia, Brasil, Argentina). Es el marketplace de moda más grande de la región.<br><br>
        <strong>Particularidades:</strong><br>
        • Solo acepta categorías de moda, calzado y accesorios<br>
        • Requiere imágenes de alta calidad sobre fondo blanco<br>
        • Su integración con AnyMarket puede tener limitaciones de mapeo de tallas<br>
        • El proceso de homologación de catálogo es más estricto que otros marketplaces<br><br>
        <strong>Clientes en cartera que usan Dafiti:</strong> LACOSTE - CL`
      },
      {
        q: '¿Qué diferencia hay entre VTEX y DBnet como ERP/plataforma base?',
        a: `<strong>VTEX</strong> es una plataforma de e-commerce enterprise muy usada en Brasil y expandiéndose en LATAM. Tiene integración nativa con varios marketplaces pero usa AnyMarket para centralizar y agregar canales que VTEX no cubre directamente.<br><br>
        <strong>DBnet</strong> es un ERP más tradicional usado en Chile y la región. La integración DBnet → AnyMarket puede tener limitaciones en el mapeo de ciertos campos (como el caso de TRAMONTINA CL con Falabella).<br><br>
        <strong>Implicación CS:</strong> Cuando un cliente tiene problemas de integración ERP → AnyMarket, es fundamental entender cuál es su sistema de origen antes de escalar a Soporte. La causa raíz suele estar en el mapeo de campos entre el ERP y AnyMarket.`
      }
    ]
  },
  {
    cat: '💬 Conversaciones difíciles — Objeciones y situaciones críticas',
    items: [
      {
        q: 'El cliente pide un descuento. ¿Cómo manejarlo?',
        a: `El pedido de descuento es rara vez sobre el precio — casi siempre es sobre <strong>valor percibido no cumplido</strong>. Antes de negociar precio, entender por qué:<br><br>
        <strong>Preguntas a hacer:</strong><br>
        • "¿Qué te llevó a pedir el descuento en este momento?"<br>
        • "¿Hay algo en la plataforma que no te está dando el retorno que esperabas?"<br><br>
        <strong>Si el problema es valor → resolver el problema primero:</strong><br>
        Activar una funcionalidad que no están usando, resolver un bug crítico, hacer un QBR con resultados concretos.<br><br>
        <strong>Si la negociación es inevitable:</strong><br>
        • Nunca dar descuento sin algo a cambio (compromiso de renovación larga, referencia, caso de éxito)<br>
        • Involucrar a Comercial — no es una decisión unilateral de CS<br>
        • Documentar el riesgo en HubSpot`
      },
      {
        q: 'El cliente amenaza con irse. ¿Cuál es el protocolo de retención?',
        a: `<strong>Primeras 24 horas — No reaccionar, escuchar:</strong><br>
        Llamar (no email). El objetivo de la primera conversación es entender, no retener. "Entiendo que estás evaluando otras opciones. ¿Me podés contar qué está pasando?"<br><br>
        <strong>Identificar el tipo de churn:</strong><br>
        • <strong>Churn por problema técnico</strong> → hay un bug, una integración rota, algo sin resolver. Solución: ejecutar y demostrar.<br>
        • <strong>Churn por precio</strong> → involucrar a Comercial con un plan de retención<br>
        • <strong>Churn por competidor</strong> → entender qué ofrece el otro y si AnyMarket puede igualarlo o superarlo<br>
        • <strong>Churn estratégico</strong> → el cliente cambió de modelo de negocio. Difícil de retener.<br><br>
        <strong>Involucrar a la jefatura si:</strong><br>
        → El cliente es Enterprise o representa +$5K MRR<br>
        → El cliente tiene más de 2 años en la plataforma<br>
        → El churn afecta a otros clientes de la misma industria`
      },
      {
        q: '¿Cómo comunicar un bug o incidente que afecta la operación del cliente?',
        a: `La comunicación de crisis tiene que ser <strong>rápida, honesta y con plan de acción</strong>. Nunca dejar al cliente sin respuesta esperando que el bug se resuelva solo.<br><br>
        <strong>Estructura del email/llamada de crisis:</strong><br>
        1. <strong>Reconocimiento</strong>: "Confirmamos que hay un problema en [X] que está afectando [Y]"<br>
        2. <strong>Impacto</strong>: "Esto está generando [número de pedidos afectados / monto en riesgo]"<br>
        3. <strong>Causa</strong>: "El origen es [causa raíz si se conoce]"<br>
        4. <strong>Acción</strong>: "El equipo de Soporte está trabajando en resolverlo. ETA estimado: [tiempo]"<br>
        5. <strong>Actualización</strong>: "Te voy a escribir con una actualización en [X horas]"<br><br>
        <strong>Lo que nunca hacer:</strong><br>
        ❌ Desaparecer mientras el bug sigue abierto<br>
        ❌ Prometer tiempos de resolución que no puedes controlar<br>
        ❌ Culpar al marketplace o al ERP del cliente en la comunicación externa`
      }
    ]
  }
];

let faqOpen = new Set();

function renderFaq() {
  const pg = document.getElementById('page-faq');
  if (!pg) return;

  const cats = FAQ_DATA.map((cat, ci) => {
    const items = cat.items.map((item, ii) => {
      const key = `${ci}-${ii}`;
      const isOpen = faqOpen.has(key);
      return `<div class="faq-item${isOpen?' open':''}" id="faq-${key}">
        <div class="faq-q" onclick="toggleFaq('${key}')">
          <span>${item.q}</span>
          <span class="faq-arrow">▼</span>
        </div>
        <div class="faq-a">${item.a}</div>
      </div>`;
    }).join('');
    return `<div class="faq-cat">
      <div class="faq-cat-title"><span>${cat.cat}</span></div>
      ${items}
    </div>`;
  }).join('');

  pg.innerHTML = `<div style="max-width:820px">
    <input class="faq-search" id="faqSearch" placeholder="🔍 Buscar en FAQ… (Repricing, churn, stock, NPS, Kits…)" oninput="filterFaq(this.value)">
    <div id="faqContent">${cats}</div>
  </div>`;
}

function toggleFaq(key) {
  const el = document.getElementById('faq-' + key);
  if (!el) return;
  if (faqOpen.has(key)) { faqOpen.delete(key); el.classList.remove('open'); }
  else { faqOpen.add(key); el.classList.add('open'); }
}

function filterFaq(q) {
  const term = q.toLowerCase().trim();
  const cont = document.getElementById('faqContent');
  if (!term) { renderFaq(); document.getElementById('faqSearch').value = q; return; }
  let html = '';
  FAQ_DATA.forEach((cat, ci) => {
    const matched = cat.items.filter(item =>
      item.q.toLowerCase().includes(term) || item.a.toLowerCase().includes(term)
    );
    if (!matched.length) return;
    const items = matched.map((item, ii) => `<div class="faq-item open">
      <div class="faq-q"><span>${item.q}</span><span class="faq-arrow">▼</span></div>
      <div class="faq-a">${item.a}</div>
    </div>`).join('');
    html += `<div class="faq-cat"><div class="faq-cat-title">${cat.cat}</div>${items}</div>`;
  });
  cont.innerHTML = html || '<div style="color:var(--text3);padding:32px 0;text-align:center">Sin resultados para "' + q + '"</div>';
}

// renderFaq's template calls toggleFaq('...') via onclick="", and both
// renderGuia/renderCapacitacion embed <input oninput="filterFaq(this.value)">
// — both must be reachable from global scope.
if (typeof window !== 'undefined') {
  window.toggleFaq = toggleFaq;
  window.filterFaq = filterFaq;
}

export { FAQ_DATA, renderFaq, toggleFaq, filterFaq };
