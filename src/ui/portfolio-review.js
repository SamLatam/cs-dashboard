// src/ui/portfolio-review.js
// Extracted verbatim from api/index.html (1).html — "REVISIÓN DE PORTAFOLIO — 3 ROUNDS" section
// (source comment: "── REVISIÓN DE PORTAFOLIO — 3 ROUNDS ────────────────────────────────────────").
//
// NOTE: this function defines its own local `quickHS`/`hsColor` helpers and does not actually
// reference calcHS/getMRR/PORT from the domain modules (double-checked against the source body) —
// only `getClients()` (for the bare `clients` global) and `calcTendencia` (lib/dom.js) are needed.

import { getClients } from '../services/clients-repo.js';
import { calcTendencia } from '../lib/dom.js';

export function renderPortfolioReview() {
  var el = document.getElementById('reviewGrid');
  if (!el) return;
  var clients = getClients();
  var today = new Date();

  // Helper: días desde fecha
  function diasDesde(d) {
    if (!d) return 9999;
    return Math.floor((today - new Date(d)) / 86400000);
  }

  // Helper: Health Score rápido
  function quickHS(c) {
    var w = c.weekly || {};
    var scores = [];
    if (w.gmv !== null && w.gmv !== undefined) scores.push(w.gmv > 0 ? 100 : 0);
    var t = (w.tickets || 0);
    scores.push(t === 0 ? 100 : t <= 2 ? 60 : t <= 4 ? 30 : 0);
    if (!c.centry) {
      if (w.upPlan && w.qtUp !== null && w.qtUp !== undefined) {
        var pct = w.qtUp / w.upPlan;
        scores.push(pct >= 0.8 ? 100 : pct >= 0.5 ? 60 : w.qtUp > 0 ? 30 : 0);
      }
    }
    if (w.nps !== null && w.nps !== undefined) {
      scores.push(w.nps >= 50 ? 100 : w.nps >= 0 ? 60 : w.nps >= -50 ? 30 : 0);
    }
    var dias = diasDesde(w.lastContact);
    scores.push(dias <= 30 ? 100 : dias <= 60 ? 60 : dias <= 90 ? 30 : 0);
    if (!scores.length) return null;
    return Math.round(scores.reduce(function(a,b){return a+b;},0) / scores.length);
  }

  function hsColor(s) {
    if (s === null) return '#888';
    return s >= 70 ? '#2ecc71' : s >= 50 ? '#f1c40f' : s >= 30 ? '#e67e22' : '#e74c3c';
  }

  function clientLink(c) {
    return '<a href="#" onclick="openFicha(\''+c.id+'\');return false" style="color:var(--accent);font-weight:700">'+c.name+'</a>';
  }

  var h = '';

  // ── INTRO HEADER ──
  h += '<div style="background:linear-gradient(135deg,rgba(79,142,247,.12),rgba(155,89,182,.08));border:1px solid rgba(79,142,247,.25);border-radius:14px;padding:20px 24px;margin-bottom:24px">';
  h += '<div style="font-size:18px;font-weight:800;color:var(--text);margin-bottom:6px">🔄 Revisión de Portafolio — Metodología 3 Rounds</div>';
  h += '<div style="font-size:13px;color:var(--text2);line-height:1.6">Framework para desafiar supuestos de tu cartera. <strong style="color:var(--accent)">Round 1</strong> establece el ranking real. <strong style="color:#9b59b6">Round 2</strong> detecta señales que contradicen la intuición. <strong style="color:#e67e22">Round 3</strong> activa el plan de acción.</div>';
  h += '</div>';

  // ════════════════════════════════════════════
  // ROUND 1 — RANKING MULTIDIMENSIONAL
  // ════════════════════════════════════════════
  h += '<div style="background:var(--card);border-radius:14px;padding:20px 24px;margin-bottom:20px;border:1px solid rgba(79,142,247,.3)">';
  h += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">';
  h += '<span style="background:#4f8ef7;color:#fff;font-weight:800;font-size:11px;padding:3px 10px;border-radius:20px">ROUND 1</span>';
  h += '<span style="font-size:16px;font-weight:700;color:var(--text)">¿Cuál es tu criterio real de priorización?</span>';
  h += '</div>';
  h += '<div style="font-size:12px;color:var(--text3);margin-bottom:16px">Si tuvieras que apostar dinero propio en esta lista, ¿cambiarías algo?</div>';

  // Generar rankings con 3 criterios
  var byHS = clients.slice().sort(function(a,b){ var sa=quickHS(a)??-1; var sb=quickHS(b)??-1; return sb-sa; });
  var byContact = clients.slice().sort(function(a,b){ return diasDesde(a.weekly&&a.weekly.lastContact) - diasDesde(b.weekly&&b.weekly.lastContact); });
  var byRisk = clients.slice().sort(function(a,b){ var sa=quickHS(a)??99; var sb=quickHS(b)??99; return sa-sb; });

  h += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">';

  // Ranking por Health Score
  h += '<div><div style="font-size:11px;font-weight:700;color:#4f8ef7;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Por Health Score</div>';
  h += '<div style="display:flex;flex-direction:column;gap:6px">';
  byHS.slice(0,8).forEach(function(c,i){
    var hs = quickHS(c);
    h += '<div style="display:flex;align-items:center;gap:8px;font-size:12px">';
    h += '<span style="color:var(--text3);width:16px;font-weight:700">'+(i+1)+'</span>';
    h += '<span style="width:28px;height:6px;border-radius:3px;background:'+hsColor(hs)+';flex-shrink:0"></span>';
    h += '<span style="color:var(--text);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+c.name+'</span>';
    h += '<span style="color:'+hsColor(hs)+';font-weight:700;font-size:11px">'+(hs!==null?hs+'%':'?')+'</span>';
    h += '</div>';
  });
  h += '</div></div>';

  // Ranking por contacto más reciente
  h += '<div><div style="font-size:11px;font-weight:700;color:#2ecc71;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Más Contactados</div>';
  h += '<div style="display:flex;flex-direction:column;gap:6px">';
  byContact.slice(0,8).forEach(function(c,i){
    var d = diasDesde(c.weekly&&c.weekly.lastContact);
    var col = d <= 14 ? '#2ecc71' : d <= 30 ? '#f1c40f' : d <= 60 ? '#e67e22' : '#e74c3c';
    h += '<div style="display:flex;align-items:center;gap:8px;font-size:12px">';
    h += '<span style="color:var(--text3);width:16px;font-weight:700">'+(i+1)+'</span>';
    h += '<span style="color:var(--text);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+c.name+'</span>';
    h += '<span style="color:'+col+';font-weight:700;font-size:11px">'+(d===9999?'sin fecha':d+'d')+'</span>';
    h += '</div>';
  });
  h += '</div></div>';

  // Ranking por riesgo (mayor riesgo arriba)
  h += '<div><div style="font-size:11px;font-weight:700;color:#e74c3c;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Mayor Riesgo</div>';
  h += '<div style="display:flex;flex-direction:column;gap:6px">';
  byRisk.slice(0,8).forEach(function(c,i){
    var hs = quickHS(c);
    h += '<div style="display:flex;align-items:center;gap:8px;font-size:12px">';
    h += '<span style="color:var(--text3);width:16px;font-weight:700">'+(i+1)+'</span>';
    h += '<span style="color:var(--text);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+c.name+'</span>';
    h += '<span style="color:'+hsColor(hs)+';font-weight:700;font-size:11px">'+(hs!==null?hs+'%':'?')+'</span>';
    h += '</div>';
  });
  h += '</div></div>';

  h += '</div>';
  h += '<div style="margin-top:14px;padding:10px 14px;background:rgba(79,142,247,.08);border-radius:8px;font-size:12px;color:var(--text3)">💬 <strong>Pregunta Round 1:</strong> ¿Hay algún cliente que aparece en posición alta en Health Score pero tú intuitivamente sentís que hay algo que no cierra? Si la respuesta es sí, ese cliente es el de Round 2.</div>';
  h += '</div>';

  // ════════════════════════════════════════════
  // ROUND 2 — CHALLENGERS (señales que contradicen la intuición)
  // ════════════════════════════════════════════
  h += '<div style="background:var(--card);border-radius:14px;padding:20px 24px;margin-bottom:20px;border:1px solid rgba(155,89,182,.3)">';
  h += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">';
  h += '<span style="background:#9b59b6;color:#fff;font-weight:800;font-size:11px;padding:3px 10px;border-radius:20px">ROUND 2</span>';
  h += '<span style="font-size:16px;font-weight:700;color:var(--text)">Señales que contradicen la intuición</span>';
  h += '</div>';
  h += '<div style="font-size:12px;color:var(--text3);margin-bottom:16px">¿Hay un cliente que "parece bien" pero los datos cuentan otra historia, o que "parece mal" pero los datos lo contradicen?</div>';

  var challengers = [];

  clients.forEach(function(c) {
    var w = c.weekly || {};
    var dias = diasDesde(w.lastContact);
    var hs = quickHS(c);
    var nps = w.nps;
    var tickets = w.tickets || 0;
    var bugs = w.bugs || 0;

    // Patrón A: NPS positivo + sin contacto prolongado → "parece bien pero estamos perdiendo la relación"
    if (nps !== null && nps >= 50 && dias > 45) {
      challengers.push({c:c, tipo:'A', titulo:'NPS verde pero sin contacto '+dias+'d', descripcion:c.name+' tiene NPS '+nps+' pero el último contacto fue hace '+dias+' días. El NPS refleja el pasado, no el futuro.', accion:'Agenda una reunión esta semana para mantener la relación antes de que se enfríe.', color:'#f1c40f', icon:'⚠️'});
    }
    // Patrón B: Sin tickets + sin contacto → "invisible" (puede ser churn silencioso)
    if (tickets === 0 && dias > 60 && nps === null) {
      challengers.push({c:c, tipo:'B', titulo:'Invisible — 0 tickets y sin contacto '+dias+'d', descripcion:c.name+' no abre tickets y no hay contacto en '+dias+' días. Silencio total puede significar abandono pasivo de la plataforma.', accion:'Revisar en AnyMarket si sigue operando activamente. Si no hay pedidos recientes, contactar urgente.', color:'#e74c3c', icon:'🔇'});
    }
    // Patrón C: NPS negativo + 0 tickets → dolor silencioso
    if (nps !== null && nps < 0 && tickets === 0) {
      challengers.push({c:c, tipo:'C', titulo:'NPS negativo sin tickets abiertos — dolor silencioso', descripcion:c.name+' tiene NPS '+nps+' pero no abre tickets. Los clientes insatisfechos que no escalan suelen estar buscando alternativas.', accion:'Llamar directamente. Preguntar qué está faltando. No esperar que escalen.', color:'#e74c3c', icon:'😶'});
    }
    // Patrón D: ausencia en reuniones
    if (w.presenciaReuniones === 'Faltou') {
      challengers.push({c:c, tipo:'D', titulo:'Faltó a la última reunión', descripcion:c.name+' no asistió a la última reunión agendada. ¿Es operativo (problema interno) o es desinterés ejecutivo?', accion:'Indagar el motivo antes de reagendar. Si es el sponsor quien faltó, escalar el análisis de riesgo.', color:'#e67e22', icon:'🚫'});
    }
    // Patrón E: Centry bloqueado + sin contacto >30d
    if (c.centry && dias > 30) {
      challengers.push({c:c, tipo:'E', titulo:'Migración pendiente + '+dias+'d sin contacto', descripcion:c.name+' está en proceso de migración a AnyMarket desde Centry y el último contacto fue hace '+dias+' días. Las migraciones silenciosas se vuelven crisis.', accion:'Contactar esta semana. Confirmar si hay bloqueos técnicos o de decisión en el cliente.', color:'#9b59b6', icon:'🔄'});
    }
    // Patrón F: HS alto pero bugs abiertos
    if (hs !== null && hs >= 60 && bugs > 0) {
      challengers.push({c:c, tipo:'F', titulo:'HS verde pero con bugs abiertos ('+bugs+')', descripcion:c.name+' tiene Health Score '+hs+'% pero hay '+bugs+' bug(s) sin resolver. Un bug en producción puede destruir el HS en días.', accion:'Verificar el estado de los bugs en Zendesk. Escalar si llevan más de 7 días sin resolución.', color:'#e74c3c', icon:'🐛'});
    }
  });

  if (challengers.length === 0) {
    h += '<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px">✅ No se detectaron señales contradictorias esta semana. Importá datos actualizados para un análisis más preciso.</div>';
  } else {
    h += '<div style="display:flex;flex-direction:column;gap:12px">';
    challengers.forEach(function(ch) {
      h += '<div style="border-left:3px solid '+ch.color+';padding:12px 16px;background:rgba(255,255,255,.03);border-radius:0 10px 10px 0">';
      h += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">';
      h += '<span style="font-size:16px">'+ch.icon+'</span>';
      h += '<span style="font-weight:700;font-size:13px;color:var(--text)">'+ch.titulo+'</span>';
      h += '<span style="background:rgba(255,255,255,.08);color:var(--text2);font-size:10px;padding:2px 8px;border-radius:10px;margin-left:auto">'+ch.c.name+'</span>';
      h += '</div>';
      h += '<div style="font-size:12px;color:var(--text2);margin-bottom:6px">'+ch.descripcion+'</div>';
      h += '<div style="font-size:12px;color:'+ch.color+'"><strong>→ Acción:</strong> '+ch.accion+'</div>';
      h += '<div style="margin-top:8px"><button onclick="openFicha(\''+ch.c.id+'\')" style="padding:4px 12px;background:transparent;color:var(--accent);border:1px solid var(--accent);border-radius:6px;cursor:pointer;font-size:11px">Ver ficha →</button></div>';
      h += '</div>';
    });
    h += '</div>';
  }

  h += '<div style="margin-top:14px;padding:10px 14px;background:rgba(155,89,182,.08);border-radius:8px;font-size:12px;color:var(--text3)">💬 <strong>Pregunta Round 2:</strong> ¿Estás dando más peso al volumen de tickets o a la tendencia de uso? ¿Un cliente que no abre tickets y no aparece en reuniones es estabilidad o señal de alarma?</div>';
  h += '</div>';

  // ════════════════════════════════════════════
  // ROUND 3 — RETROSPECTIVA Y PLAN DE ACCIÓN
  // ════════════════════════════════════════════
  h += '<div style="background:var(--card);border-radius:14px;padding:20px 24px;margin-bottom:20px;border:1px solid rgba(230,126,34,.3)">';
  h += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">';
  h += '<span style="background:#e67e22;color:#fff;font-weight:800;font-size:11px;padding:3px 10px;border-radius:20px">ROUND 3</span>';
  h += '<span style="font-size:16px;font-weight:700;color:var(--text)">Retrospectiva + Primera Acción Mañana</span>';
  h += '</div>';
  h += '<div style="font-size:12px;color:var(--text3);margin-bottom:16px">¿Qué señal tenías que decidiste ignorar? Si este fuera un cliente activo hoy, ¿cuál sería tu primera acción mañana?</div>';

  // Top 5 sin contacto reciente (los más urgentes de retomar)
  var sinContacto = clients.slice()
    .filter(function(c){ return diasDesde(c.weekly&&c.weekly.lastContact) > 30; })
    .sort(function(a,b){ return diasDesde(b.weekly&&b.weekly.lastContact) - diasDesde(a.weekly&&a.weekly.lastContact); })
    .slice(0,6);

  h += '<div style="margin-bottom:16px"><div style="font-size:12px;font-weight:700;color:#e67e22;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">📵 Sin contacto +30 días — primera acción mañana</div>';
  if (sinContacto.length === 0) {
    h += '<div style="color:var(--text3);font-size:12px">✅ Todos los clientes tienen contacto reciente.</div>';
  } else {
    h += '<div style="display:flex;flex-direction:column;gap:8px">';
    sinContacto.forEach(function(c) {
      var dias = diasDesde(c.weekly&&c.weekly.lastContact);
      var w = c.weekly || {};
      var urgColor = dias > 90 ? '#e74c3c' : dias > 60 ? '#e67e22' : '#f1c40f';
      // Recomendar acción según contexto
      var accion;
      if (c.centry) accion = 'Revisar estado de migración Centry → AnyMarket. ¿Hay bloqueo?';
      else if (w.nps !== null && w.nps < 0) accion = 'Llamar hoy. NPS negativo sin seguimiento = riesgo churn activo.';
      else if (w.tickets > 0) accion = 'Revisar ticket abierto y enviar actualización proactiva.';
      else accion = 'Enviar check-in de valor: "¿Cómo está tu operación en '+( c.country||'')+'?"';
      h += '<div style="display:flex;gap:12px;align-items:flex-start;padding:10px;background:rgba(255,255,255,.02);border-radius:8px;border:1px solid rgba(255,255,255,.06)">';
      h += '<div style="text-align:center;min-width:44px"><div style="font-size:18px;font-weight:800;color:'+urgColor+'">'+dias+'</div><div style="font-size:9px;color:var(--text3)">días</div></div>';
      h += '<div style="flex:1"><div style="font-weight:700;font-size:13px;color:var(--text);margin-bottom:3px">'+c.name+'</div>';
      h += '<div style="font-size:12px;color:#e67e22">→ '+accion+'</div></div>';
      h += '<button onclick="openFicha(\''+c.id+'\')" style="padding:4px 12px;background:transparent;color:var(--accent);border:1px solid var(--accent);border-radius:6px;cursor:pointer;font-size:11px;flex-shrink:0">Ficha →</button>';
      h += '</div>';
    });
    h += '</div>';
  }
  h += '</div>';

  // Clientes con tendencia bajando
  var enDecline = clients.filter(function(c){return calcTendencia(c.id)==='down';});
  if (enDecline.length > 0) {
    h += '<div style="margin-bottom:16px"><div style="font-size:12px;font-weight:700;color:#e74c3c;margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">📉 Tendencia bajando — señal que no podés ignorar</div>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
    enDecline.forEach(function(c) {
      h += '<div onclick="openFicha(\''+c.id+'\')" style="cursor:pointer;padding:8px 14px;background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.3);border-radius:8px;font-size:12px;color:var(--text)">↓ '+c.name+'</div>';
    });
    h += '</div></div>';
  }

  h += '<div style="padding:10px 14px;background:rgba(230,126,34,.08);border-radius:8px;font-size:12px;color:var(--text3)">💬 <strong>Pregunta Round 3:</strong> ¿Qué señal tenías desde el Round 2 y decidiste no actuar? ¿Qué necesitarías saber en el Round 1 para anticipar esto antes?</div>';
  h += '</div>';

  // ── RESUMEN EJECUTIVO DEL PORTAFOLIO ──
  var totalClientes = clients.length;
  var sinContactoCount = clients.filter(function(c){ return diasDesde(c.weekly&&c.weekly.lastContact) > 30; }).length;
  var npsNegCount = clients.filter(function(c){ return (c.weekly||{}).nps !== null && (c.weekly||{}).nps < 0; }).length;
  var challengerCount = challengers.length;

  h += '<div style="background:var(--card);border-radius:14px;padding:20px 24px;border:1px solid rgba(255,255,255,.08)">';
  h += '<div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:14px">📊 Resumen Ejecutivo del Portafolio — '+new Date().toLocaleDateString('es-CL')+'</div>';
  h += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:14px">';
  h += '<div style="text-align:center"><div style="font-size:28px;font-weight:800;color:var(--accent)">'+totalClientes+'</div><div style="font-size:11px;color:var(--text3)">Cuentas totales</div></div>';
  h += '<div style="text-align:center"><div style="font-size:28px;font-weight:800;color:#e74c3c">'+sinContactoCount+'</div><div style="font-size:11px;color:var(--text3)">Sin contacto +30d</div></div>';
  h += '<div style="text-align:center"><div style="font-size:28px;font-weight:800;color:#e67e22">'+challengerCount+'</div><div style="font-size:11px;color:var(--text3)">Señales challenger</div></div>';
  h += '<div style="text-align:center"><div style="font-size:28px;font-weight:800;color:'+(npsNegCount>0?'#e74c3c':'#2ecc71')+'">'+npsNegCount+'</div><div style="font-size:11px;color:var(--text3)">NPS negativo</div></div>';
  h += '</div>';
  h += '<div style="font-size:11px;color:var(--text3);border-top:1px solid var(--border);padding-top:10px">Datos basados en el último JSON importado. Actualizá semanalmente para mantener la precisión del análisis.</div>';
  h += '</div>';

  el.innerHTML = h;
}
