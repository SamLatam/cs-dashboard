// src/ui/guia.js
// Extracted verbatim from api/index.html (1).html — "GUIA OPERACIONAL" section
// (source comment: "── GUIA OPERACIONAL ──────────────────────────────────────────────────────────").
//
// This function is fully self-contained static/reference content — it does not read `clients`,
// `actions`, or any domain/service module. No imports required.

export function renderGuia() {
  const sec = (emoji, titulo, subtitulo, color, body) => `
    <div class="card" style="border-left:4px solid ${color};margin-bottom:20px;">
      <div class="card-title" style="font-size:15px;">${emoji} ${titulo} <span>${subtitulo}</span></div>
      ${body}
    </div>`;

  const pill = (txt, bg) => `<span style="background:${bg}22;color:${bg};border-radius:12px;padding:2px 9px;font-size:11px;font-weight:700;margin-right:4px;">${txt}</span>`;

  const tbl = (heads, rows) => `
    <div style="overflow-x:auto;margin-top:8px;">
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:var(--surface2);">${heads.map(h=>`<th style="padding:8px 10px;font-size:11px;color:var(--text3);text-align:left;white-space:nowrap;">${h}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;

  const tr = cells => `<tr style="border-bottom:1px solid var(--border);">${cells.map(c=>`<td style="padding:10px 10px;font-size:12px;">${c}</td>`).join('')}</tr>`;

  const checklist = items => `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;margin-top:8px;">${
    items.map(([done, txt]) => `<div style="display:flex;align-items:flex-start;gap:8px;background:var(--surface2);border-radius:8px;padding:8px 12px;">
      <span style="font-size:16px;margin-top:1px;">${done?'✅':'⬜'}</span>
      <span style="font-size:12px;color:var(--text1);line-height:1.4;">${txt}</span>
    </div>`).join('')
  }</div>`;

  const badge = (txt, color) => `<span style="display:inline-block;background:${color};color:#fff;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:700;margin-right:6px;">${txt}</span>`;

  let html = '';

  // ── BLOQUE 0: Índice / mapa rápido ─────────────────────────────────────────
  html += `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
    ${['🗺️ Ciclo de Vida del Seller','📅 Ritmo Operativo Semanal','🚨 Protocolos de Intervención','🎯 Playbook por Señal','📊 Métricas que Importan','💬 Guía de Comunicación','🔄 Proceso de Renovación','⬆️ Expansión y Upsell'].map((l,i)=>
      `<button onclick="document.getElementById('guia-sec-${i}').scrollIntoView({behavior:'smooth'})" style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:12px;color:var(--text1);cursor:pointer;">${l}</button>`
    ).join('')}
  </div>`;

  // ── BLOQUE 1: Ciclo de vida del seller ─────────────────────────────────────
  html += `<div id="guia-sec-0">` + sec('🗺️','Ciclo de Vida del Seller en AnyMarket','5 fases — objetivos, riesgos y acciones CS por etapa','#4f8ef7', tbl(
    ['Fase','Duración típica','Objetivo CS','Señal de éxito','Riesgo principal','Acción clave'],
    [
      tr(['🟣 ' + badge('1. Onboarding','#9b59b6'),'0–60 días','Lograr primera venta real en marketplace','Primer pedido procesado por AnyMarket','Abandono por complejidad técnica inicial','Check semanal de progreso + sesión de configuración en semana 2']),
      tr(['🔵 ' + badge('2. Adopción','#4f8ef7'),'60–180 días','Activar todos los marketplaces del plan y usar Use Points','UP% ≥ 50%, +3 canales activos','Baja activación — cliente usa solo 1 canal de los contratados','Workshop de expansión de canales + revisar Use Points en cada check-in']),
      tr(['🟢 ' + badge('3. Crecimiento','#27ae60'),'180 días – 1 año','Aumentar GMV y pedidos mes a mes','GMV creciendo +10% m/m en 3 meses consecutivos','Estancamiento por no usar features de optimización (Repricing, Match ML)','Proponer AnyTools o Repricing en QBR']),
      tr(['🟡 ' + badge('4. Madurez','#f39c12'),'1–3 años','Retener, renovar y expandir a nuevos mercados o módulos','NPS ≥ 50, renovación automática sin negociación de precio','Pérdida de champion, complacencia','EBR trimestral + mapeo de nuevos stakeholders']),
      tr(['🔴 ' + badge('5. Riesgo','#e74c3c'),'Cualquier etapa','Recuperar el cliente antes del punto de no retorno','Cliente responde y tiene una reunión de rescate agendada','Churn confirmado','Escalación inmediata + propuesta de valor personalizada en 48h'])
    ]
  )) + `</div>`;

  // ── BLOQUE 2: Ritmo operativo semanal ──────────────────────────────────────
  html += `<div id="guia-sec-1">` + sec('📅','Ritmo Operativo Semanal','Qué hacer cada día para tener la cartera bajo control','#00d4aa',
    `<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:10px;">
      ${[
        ['Lunes','#4f8ef7','Revisar dashboard y alertas activas','Identificar tickets nuevos en Zendesk','Planificar contactos de la semana (clientes en riesgo primero)','Enviar pendientes de semana anterior'],
        ['Martes','#9b59b6','Reuniones de seguimiento clientes críticos','Diagnóstico Zendesk tickets abiertos >3 días','Actualizar HubSpot con actividades','Documentar compromisos asumidos'],
        ['Miércoles','#27ae60','Check de adopción: Use Points y GMV','Responder correos pendientes','Preparar agenda de reuniones jueves-viernes','Detectar clientes sin contacto >30 días'],
        ['Jueves','#f39c12','Reuniones de valor (QBR, EBR, revisiones)','Revisar tickets pendientes de resolución','Enviar follow-ups post reunión en <24h','Actualizar notas en el dashboard'],
        ['Viernes','#e74c3c','Cerrar semana: exportar JSON y actualizar dashboard','Registrar contactos en lastContact','Anotar riesgos y oportunidades detectadas','Preparar prioridades para el lunes']
      ].map(([dia, color, ...items]) => `
        <div style="background:var(--surface2);border-radius:10px;padding:12px;border-top:3px solid ${color};">
          <div style="font-weight:700;font-size:13px;color:${color};margin-bottom:8px;">${dia}</div>
          ${items.map(it=>`<div style="font-size:11px;color:var(--text2);margin-bottom:5px;line-height:1.4;">▸ ${it}</div>`).join('')}
        </div>`).join('')}
    </div>`
  ) + `</div>`;

  // ── BLOQUE 3: Protocolos de intervención ───────────────────────────────────
  html += `<div id="guia-sec-2">` + sec('🚨','Protocolos de Intervención','Cuándo activar cada protocolo y quién hace qué','#e74c3c', tbl(
    ['Trigger','Protocolo','Tiempo máximo','Responsable','Escalación a'],
    [
      tr([pill('NPS < 0','#e74c3c') + 'NPS negativo recibido','Llamada de rescate en <48h + email de reconocimiento + plan de acción escrito','48 horas','CSM','CS Manager si en 7 días no hay respuesta']),
      tr([pill('Ticket > 7 días','#f39c12') + 'Ticket abierto sin resolución','Escalación a soporte N2 + comunicar ETA al cliente + check diario','24h desde detección','CSM + Soporte','Gerencia de Producto si es bug sin fecha']),
      tr([pill('Sin contacto 60d','#f39c12') + '60 días sin contacto registrado','Secuencia de reactivación: email + LinkedIn + llamada telefónica','48h para iniciar','CSM','CS Manager si no hay respuesta en 15 días']),
      tr([pill('GMV = 0','#e74c3c') + 'GMV en cero por >15 días','Diagnóstico de operación en AnyMarket + llamada urgente','24h','CSM','Soporte técnico si hay problema de integración']),
      tr([pill('UP% < 20%','#9b59b6') + 'Uso de Use Points menor al 20% del plan','Reunión de adopción: revisar qué features no está usando y por qué','1 semana','CSM','—']),
      tr([pill('Cancelación','#e74c3c') + 'Cliente menciona cancelación o solicita información','Protocolo de retención: no escalar precio primero — entender el dolor real','Mismo día','CSM + CS Manager','Comercial para negociación si hay tema de precio'])
    ]
  )) + `</div>`;

  // ── BLOQUE 4: Playbook por señal ───────────────────────────────────────────
  html += `<div id="guia-sec-3">` + sec('🎯','Playbook por Señal','Qué decir y hacer según lo que está pasando con el cliente','#9b59b6',
    ['🔴 NPS negativo (< 0)', '🟡 Baja adopción (UP% < 50%)', '📦 SKUs sin publicar o con errores', '👤 Cambio de contacto o champion', '📉 GMV estancado o cayendo'].map((titulo, idx) => {
      const contenidos = [
        [`<b>Paso 1 — Reconocer:</b> "Recibimos tu comentario y queremos entender qué pasó."`,
         `<b>Paso 2 — Escuchar:</b> Agendar llamada en <48h. No defender el producto todavía.`,
         `<b>Paso 3 — Diagnóstico:</b> ¿Fue un ticket sin resolver? ¿Falta de adopción? ¿Problema puntual?`,
         `<b>Paso 4 — Plan:</b> Enviar email con compromisos concretos y fechas.`,
         `<b>Paso 5 — Seguimiento:</b> Verificar en 15 días si la percepción cambió.`,
         `<b>No hacer:</b> Enviar encuesta de satisfacción de nuevo antes de resolver el problema.`],
        [`<b>Paso 1 — Diagnóstico:</b> Revisar en AnyMarket qué Use Points tiene contratados y cuáles usó.`,
         `<b>Paso 2 — Identificar el bloqueo:</b> ¿No sabe cómo? ¿Falta de tiempo? ¿No ve el valor?`,
         `<b>Paso 3 — Workshop personalizado:</b> Sesión 30 min mostrando el feature no usado con caso real del sector.`,
         `<b>Paso 4 — KPI de adopción:</b> Acordar un objetivo de UP% para el próximo mes.`,
         `<b>Paso 5 — Seguimiento:</b> Check semanal hasta alcanzar UP% > 50%.`,
         `<b>No hacer:</b> Dejar pasar la renovación sin resolver la baja adopción — es el argumento de cancelación #1.`],
        [`<b>Paso 1 — Triage:</b> Abrir AnyMarket > Catálogo > Publicaciones. Ver errores activos.`,
         `<b>Paso 2 — Categorizar:</b> ¿Error de datos (precio, imagen, descripción)? ¿Error de API del marketplace? ¿Bug AnyMarket?`,
         `<b>Paso 3 — Si es error de datos:</b> Guiar al cliente con checklist de corrección (no hacer por él si puede).`,
         `<b>Paso 4 — Si es bug:</b> Abrir ticket Zendesk con screenshots + IDs de SKU afectados.`,
         `<b>Paso 5 — Comunicar:</b> Siempre avisar al cliente qué encontramos y el próximo paso.`,
         `<b>No hacer:</b> Cerrar el tema sin confirmar que los SKUs están publicados correctamente.`],
        [`<b>Paso 1 — Detectar:</b> Si el contacto no responde emails en >10 días, es señal de cambio.`,
         `<b>Paso 2 — Mapear:</b> Buscar nuevo contacto en LinkedIn + preguntar al contacto anterior si fue promovido o desvinculado.`,
         `<b>Paso 3 — Reunión de traspaso:</b> Solicitar al nuevo contacto una reunión de "conocernos" + overview del estado de la cuenta.`,
         `<b>Paso 4 — Actualizar HubSpot:</b> Cambiar contacto principal, agregar nuevo stakeholder.`,
         `<b>Paso 5 — Reactivar relación:</b> Enviar deck de valor con logros de la cuenta en los últimos 6 meses.`,
         `<b>No hacer:</b> Seguir enviando emails al contacto anterior esperando respuesta.`],
        [`<b>Paso 1 — Diagnóstico de datos:</b> Revisar GMV en Power BI — ¿cayó en todos los canales o solo uno?`,
         `<b>Paso 2 — Revisar operación:</b> ¿Hay stock en cero? ¿Publicaciones caídas? ¿Integración con errores?`,
         `<b>Paso 3 — Contexto externo:</b> ¿Es una caída del mercado (temporada baja)? ¿El marketplace hizo cambios?`,
         `<b>Paso 4 — Plan de acción conjunto:</b> Con el cliente, definir 3 acciones concretas para recuperar GMV.`,
         `<b>Paso 5 — Seguimiento quincenal</b> hasta recuperar tendencia positiva.`,
         `<b>No hacer:</b> Ignorar la caída asumiendo que es estacional sin validarlo con el cliente.`]
      ];
      return `<div style="margin-bottom:12px;">
        <div style="font-weight:700;font-size:13px;margin-bottom:6px;">${titulo}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:6px;">
          ${contenidos[idx].map(paso=>`<div style="background:var(--surface2);border-radius:8px;padding:8px 12px;font-size:11.5px;color:var(--text1);line-height:1.5;">${paso}</div>`).join('')}
        </div>
      </div>`;
    }).join('')
  ) + `</div>`;

  // ── BLOQUE 5: Métricas que importan ────────────────────────────────────────
  html += `<div id="guia-sec-4">` + sec('📊','Métricas que Importan','Lo que debes monitorear cada semana por cliente y por cartera','#00d4aa', tbl(
    ['Métrica','Frecuencia','Objetivo','Alerta si…','Fuente'],
    [
      tr(['GMV por cliente','Semanal','Crecimiento +5% m/m sostenido','Caída >20% vs semana anterior o mes en cero','Power BI GMV']),
      tr(['Use Points %','Semanal','≥ 80% del plan contratado','UP% < 50% por 2 semanas consecutivas','AnyMarket']),
      tr(['NPS','Mensual / post-evento','≥ 50 en todos los clientes','Cualquier NPS negativo','Tracksale']),
      tr(['Tickets abiertos','Diaria','0 tickets por cliente','≥ 3 tickets activos o 1 ticket > 7 días sin resolución','Zendesk']),
      tr(['Días sin contacto','Semanal','≤ 30 días en toda la cartera','Cualquier cliente con > 60 días sin contacto','HubSpot / Dashboard']),
      tr(['Health Score','Semanal','≥ 70 (verde) en >80% de la cartera','Cualquier cliente nuevo en rojo','Dashboard']),
      tr(['Renovaciones próximas','Mensual','0 sorpresas — todas preparadas 90 días antes','Contrato vence en < 30 días sin reunión agendada','HubSpot']),
      tr(['Errores de integración','Semanal','0 errores críticos activos','Error de transmisión > 24h sin resolución','AnyMarket'])
    ]
  )) + `</div>`;

  // ── BLOQUE 6: Guía de comunicación ─────────────────────────────────────────
  html += `<div id="guia-sec-5">` + sec('💬','Guía de Comunicación','Cadencia y canal correcto según el tipo de cliente','#f39c12',
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:8px;">
      <div style="background:var(--surface2);border-radius:10px;padding:14px;">
        <div style="font-weight:700;font-size:13px;margin-bottom:10px;">📬 Cadencia mínima por segmento</div>
        ${tbl(['Segmento','Email','Reunión','QBR'],[
          tr(['🔴 Cliente crítico (HS < 30)','2x semana','Semanal','Mensual']),
          tr(['🟠 En riesgo (HS 30–49)','Semanal','Quincenal','Trimestral']),
          tr(['🟡 Observación (HS 50–69)','Quincenal','Mensual','Trimestral']),
          tr(['🟢 Sano (HS ≥ 70)','Mensual','Trimestral','Semestral'])
        ])}
      </div>
      <div style="background:var(--surface2);border-radius:10px;padding:14px;">
        <div style="font-weight:700;font-size:13px;margin-bottom:10px;">✍️ Estructura de email de seguimiento</div>
        <div style="font-size:12px;color:var(--text1);line-height:1.7;">
          <b>Asunto:</b> [CLIENTE] — Resumen de la semana + próximos pasos<br>
          <b>Línea 1:</b> "Hola [Nombre], te escribo para confirmar los compromisos de nuestra última reunión:"<br>
          <b>Cuerpo:</b> ✅ Qué se hizo · ⏳ Qué está pendiente · 📅 Próxima acción + fecha<br>
          <b>Cierre:</b> "¿Tienes disponibilidad el [fecha] para revisar el avance?"<br>
          <br>
          <b>No:</b> Emails sin call-to-action, sin fecha, sin resumen de compromisos.
        </div>
      </div>
    </div>`
  ) + `</div>`;

  // ── BLOQUE 7: Proceso de renovación ────────────────────────────────────────
  html += `<div id="guia-sec-6">` + sec('🔄','Proceso de Renovación','Las 4 fases para cerrar una renovación sin fricciones','#4f8ef7',
    `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px;">
      ${[
        ['🔍','90 días antes','Diagnóstico','Revisar health score, NPS, tickets, GMV, adopción. Identificar riesgos antes de ir a la reunión.','var(--accent)'],
        ['🏆','60 días antes','Deck de valor','Preparar presentación con: GMV generado, pedidos procesados, integraciones activas, incidentes resueltos, ROI estimado.','var(--green)'],
        ['🤝','30 días antes','Reunión de renovación','Presentar el valor entregado. Escuchar al cliente. Identificar nuevas necesidades para incluir en el próximo contrato.','var(--accent2)'],
        ['✅','0–15 días','Cierre','Enviar propuesta formal. Responder objeciones con datos. No ceder en precio sin escalar a CS Manager primero.','var(--yellow)']
      ].map(([emoji, cuando, fase, detalle, color]) => `
        <div style="background:var(--surface2);border-radius:10px;padding:14px;border-top:3px solid ${color};">
          <div style="font-size:22px;margin-bottom:6px;">${emoji}</div>
          <div style="font-size:10px;color:var(--text3);margin-bottom:4px;">${cuando}</div>
          <div style="font-weight:700;font-size:13px;margin-bottom:8px;">${fase}</div>
          <div style="font-size:11.5px;color:var(--text2);line-height:1.5;">${detalle}</div>
        </div>`).join('')}
    </div>`
  ) + `</div>`;

  // ── BLOQUE 8: Expansión y Upsell ───────────────────────────────────────────
  html += `<div id="guia-sec-7">` + sec('⬆️','Expansión y Upsell','Cuándo y cómo abrir la conversación de crecimiento','#9b59b6', tbl(
    ['Señal en el cliente','Oportunidad','Producto/módulo','Cómo abrir la conversación','Momento ideal'],
    [
      tr(['UP% ≥ 80% del plan','Upgrade de plan Use Points','Plan superior','En el check-in mensual: "Estás usando casi todo tu plan. ¿Lo revisamos para que no te quedes sin créditos en temporada alta?"','Check-in mensual']),
      tr(['Solo 1–2 marketplaces activos','Activación de nuevos canales','Integración ML, Falabella, Ripley, etc.','En QBR: "Vi que solo tienes activos [X] canales. ¿Has pensado expandir a [canal]? El ticket promedio allí para tu categoría es [dato]."','QBR trimestral']),
      tr(['GMV creciendo +20% m/m','Propuesta de Repricing','AnyTools Repricing','En reunión de revisión: "Tus ventas están creciendo fuerte. Para que no pierdas posición en el marketplace, ¿conoces nuestro módulo de Repricing automático?"','Después de 3 meses creciendo']),
      tr(['Errores de catálogo frecuentes','Match ML para catalogación inteligente','AnyTools Match ML','En ticket de soporte: "Este tipo de error de catalogación lo podemos resolver de forma permanente con Match ML. ¿Te lo muestro en 15 minutos?"','Durante resolución de ticket']),
      tr(['Cliente en un solo país','Expansión internacional','Nueva cuenta en otro país','En EBR anual: "Con la infraestructura que ya tienes, ¿tiene sentido evaluar [Colombia/Chile/México]? Te mando un caso similar para que lo veas."','Revisión anual'])
    ]
  )) + `</div>`;

  document.getElementById('guiaContent').innerHTML = html;
}
