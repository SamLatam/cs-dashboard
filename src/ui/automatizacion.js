// src/ui/automatizacion.js
// Extracted verbatim from api/index.html (1).html — "AUTOMATIZACIÓN D/E" section
// (source comment: "── AUTOMATIZACIÓN D/E ────────────────────────────────────────────────────────")
//
// ASSUMPTION (not in the explicit import list given): `LS_HISTORY` ('cs-v3-history', source
// line 2210) is declared alongside LS_DATA/LS_ACTIONS/LS_NOTES in the source's STATE block, which
// conceptually belongs to clients-repo.js's storage-key constants. Imported from there; flagged
// for integration check in case it's relocated to a different repo module (e.g. health-score.js).
//
// `_churnProb`/`_priorityScore` and `getCadenceStage`/`getCadenceInfo` are defined immediately
// adjacent to this section in the source, but per task assignment they belong to
// predictions.js/cadence.js respectively — imported here, not redefined.

import { getClients, saveData } from '../services/clients-repo.js';
import { getVisibleClientIds } from '../services/profiles-repo.js';
import { calcHS } from '../domain/health-score.js';
import { _churnProb, _priorityScore } from '../domain/predictions.js';
import { getCadenceStage, getCadenceInfo } from '../domain/cadence.js';
import { segBadge, porteBadge, tipoChamadoBadge, presenciaReunBadge, tendenciaLabel, showToast } from '../lib/dom.js';
import { daysSince } from '../lib/format.js';
// RECONCILED: LS_HISTORY actually lives in services/history-repo.js (not clients-repo.js —
// clients-repo.js only owns LS_DATA/LS_DELETED_SEEDS).
import { LS_HISTORY } from '../services/history-repo.js';

export function getHSSparkline(clientId){
  try{
    var hist=JSON.parse(localStorage.getItem(LS_HISTORY)||'[]');
    var pts=hist.filter(function(h){return h.scores&&h.scores[clientId]!==undefined;}).slice(-8).map(function(h){return h.scores[clientId];});
    if(pts.length<2)return '';
    var mx=Math.max.apply(null,pts);var mn=Math.min.apply(null,pts);
    var trend=pts[pts.length-1]-pts[pts.length-2];
    var col=trend>0?'#2ecc71':trend<0?'#e74c3c':'#f39c12';
    var range=Math.max(mx-mn+10,20);
    var svgPts=pts.map(function(v,i){var sx=Math.round((i/(pts.length-1))*58);var sy=Math.round(18-((v-(mn-5))/range)*16);return sx+','+sy;}).join(' ');
    return '<svg viewBox="0 0 60 20" style="width:60px;height:20px;display:inline-block;vertical-align:middle;margin-left:8px"><polyline points="'+svgPts+'" fill="none" stroke="'+col+'" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  }catch(e){return '';}
}
export function _getCCORec(c,w,tier,cp,causes,tips){
  var pain=tips[0]||'cadencia';
  if(w.nps!==null&&w.nps!==undefined&&w.nps<=-50)return '1. Llamada de retención en las próximas 48h con el sponsor ejecutivo — no delegues este contacto.<br>2. Identificar la causa raíz del NPS antes de la llamada, documentar todo.<br>3. Presentar plan de acción con compromisos y fechas concretas.<br>4. Registrar riesgo crítico en HubSpot y notificar a tu Director hoy.';
  if(pain==='soporte')return '1. Revisar todos los tickets abiertos hoy y cerrar los que puedas.<br>2. Escalar bugs a Producto con impacto documentado y cliente identificado.<br>3. Comunicar al cliente un plan de resolución proactivo con fechas.<br>4. Convertir esta crisis de soporte en una demo de excelencia CS.';
  if(pain==='adopcion')return '1. Sesión de enablement personalizada con las funciones no utilizadas aplicadas a su industria.<br>2. Proponer un objetivo de adopción medible para el próximo mes.<br>3. Conectar mayor adopción con mayor GMV — mostrar el ROI con datos reales.<br>4. Agendar check-in de seguimiento en 2 semanas para medir avance.';
  if(pain==='migracion')return '1. Alinear con el PM de migración hoy — revisar estado y próximo hito.<br>2. Comunicar al cliente un timeline claro con compromisos firmados.<br>3. Identificar si hay bloqueos técnicos o de decisión que puedas resolver.<br>4. Documentar en HubSpot el riesgo de migración como prioridad alta.';
  if(pain==='gmv')return '1. Analizar en AnyMarket marketplaces desconectados o con errores.<br>2. Revisar catálogo, stock y publicaciones activas — identificar el bloqueo real.<br>3. Proponer Predize si no tienen repricing activo.<br>4. Establecer un objetivo de GMV conjunto con el cliente para el próximo mes.';
  if(cp>=70)return '1. Cuenta CRÍTICA — riesgo de churn estimado en ~'+Math.round(cp)+'%.<br>2. Llamada ejecutiva esta semana con sponsor y champion — prepara un Business Review rápido.<br>3. Documenta el valor entregado vs el valor esperado por el cliente.<br>4. Prepara un plan de recuperación con compromisos concretos y medibles.';
  return '1. Retomar contacto proactivo esta semana — no esperes que el cliente llegue primero.<br>2. Preparar 2–3 insights específicos sobre su operación para la llamada.<br>3. Agendar cadencia regular (quincenal o mensual) y confirmarla.<br>4. Actualizar HubSpot con el estado actual y próximos pasos asignados.';
}
export function _todayActions(scored){
  var acts=[];
  scored.slice(0,5).forEach(function(x){
    var c=x.c;var w=c.weekly||{};var cp=_churnProb(x);
    if(w.nps!==null&&w.nps!==undefined&&w.nps<=-50)acts.push({icon:'🚨',text:'Llamada de retención urgente con <strong>'+c.name+'</strong> — NPS '+w.nps,urgencia:'crítica',color:'#e74c3c'});
    else if((w.tickets||0)>=3)acts.push({icon:'⚠️',text:'Revisar y gestionar tickets críticos de <strong>'+c.name+'</strong> ('+w.tickets+' abiertos)',urgencia:'alta',color:'#e67e22'});
    else if(!w.lastContact||daysSince(w.lastContact)>60)acts.push({icon:'📞',text:'Retomar contacto con <strong>'+c.name+'</strong> — '+(!w.lastContact?'sin contacto registrado':(daysSince(w.lastContact)+' días sin contacto')),urgencia:'alta',color:'#e67e22'});
    else if(c.centry)acts.push({icon:'🔄',text:'Seguimiento migración Centry de <strong>'+c.name+'</strong> — coordinar con PM',urgencia:'media',color:'#f39c12'});
    else acts.push({icon:'📊',text:'Health check <strong>'+c.name+'</strong> — HS '+x.hs+' (~'+Math.round(cp)+'% riesgo churn)',urgencia:'media',color:'#f39c12'});
  });
  return acts.slice(0,3);
}
export function renderAutomatizacion(){
  var el=document.getElementById('automatizacionGrid');
  if(!el)return;
  var ids=getVisibleClientIds();
  var myC=getClients().filter(function(c){return ids.indexOf(c.id)>-1;});
  function _forceRisk(c){
    var w=c.weekly||{};
    if(w.nps!==null&&w.nps!==undefined&&w.nps<=-50)return'E';
    if(w.nps!==null&&w.nps!==undefined&&w.nps<0)return'D';
    if((w.tickets||0)>=5)return'E';
    if((w.tickets||0)>=3)return'D';
    if((w.bugs||0)>=2)return'E';
    return null;
  }
  var scored=myC.map(function(c){
    var hs=calcHS(c);var forced=_forceRisk(c);
    var inDE=hs.score!==null&&hs.score<50;var inForced=!!forced;
    if(!inDE&&!inForced)return null;
    if(forced==='E'){var s=hs.score!==null?Math.min(hs.score,29):15;return{c:c,hs:s,cl:'red',comps:hs.comps,partial:true,forcedRisk:true};}
    if(forced==='D'&&!inDE)return{c:c,hs:40,cl:'orange',comps:hs.comps,partial:true,forcedRisk:true};
    return{c:c,hs:hs.score,cl:hs.cl,comps:hs.comps,partial:hs.partial};
  }).filter(Boolean).sort(function(a,b){return _priorityScore(b)-_priorityScore(a);});
  var tierE=scored.filter(function(x){return x.hs<30||x.cl==='red';});
  var tierD=scored.filter(function(x){return x.hs>=30&&x.cl!=='red';});
  var triggers=getAutoTriggers(myC);
  var badge=document.getElementById('nb-automatizacion');
  if(badge){badge.textContent=scored.length;badge.style.display=scored.length>0?'inline-flex':'none';}
  var todayActs=_todayActions(scored);
  var churnAvg=scored.length>0?Math.round(scored.reduce(function(s,x){return s+_churnProb(x);},0)/scored.length):0;
  var h='<div style="padding:20px">';
  // PRIORITY ACTION QUEUE
  h+='<div style="background:linear-gradient(135deg,rgba(231,76,60,0.12),rgba(155,89,182,0.08));border:1px solid rgba(231,76,60,0.25);border-radius:14px;padding:18px 20px;margin-bottom:20px">';
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><span style="font-size:20px">🎯</span><div><div style="font-weight:800;font-size:14px;color:var(--text);letter-spacing:-.2px">TUS ACCIONES CRÍTICAS HOY</div><div style="font-size:11px;color:var(--text2);margin-top:2px">Ordenadas por impacto en retención y revenue</div></div></div>';
  if(todayActs.length===0)h+='<div style="color:#2ecc71;font-size:13px;font-weight:600">✅ Sin acciones críticas pendientes — cartera bajo control.</div>';
  else todayActs.forEach(function(a){h+='<div style="display:flex;align-items:flex-start;gap:12px;padding:10px 14px;background:rgba(0,0,0,.2);border-radius:10px;margin-bottom:8px;border-left:3px solid '+a.color+'"><span style="font-size:17px;flex-shrink:0;margin-top:1px">'+a.icon+'</span><div style="flex:1;font-size:13px;color:var(--text);line-height:1.5">'+a.text+'</div><span style="font-size:10px;font-weight:700;background:'+a.color+'22;color:'+a.color+';padding:3px 8px;border-radius:6px;white-space:nowrap;align-self:center">'+a.urgencia.toUpperCase()+'</span></div>';});
  h+='</div>';
  // KPIs
  h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(155px,1fr));gap:12px;margin-bottom:20px">';
  h+='<div style="background:var(--surface);border-radius:10px;padding:15px;border-left:4px solid #e74c3c"><div style="font-size:26px;font-weight:800;color:#e74c3c">'+tierE.length+'</div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text2);margin-top:4px">Tier E — Críticos</div><div style="font-size:10px;color:var(--text3);margin-top:3px">Intervención inmediata</div></div>';
  h+='<div style="background:var(--surface);border-radius:10px;padding:15px;border-left:4px solid #e67e22"><div style="font-size:26px;font-weight:800;color:#e67e22">'+tierD.length+'</div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text2);margin-top:4px">Tier D — En riesgo</div><div style="font-size:10px;color:var(--text3);margin-top:3px">Cadencia activa requerida</div></div>';
  h+='<div style="background:var(--surface);border-radius:10px;padding:15px;border-left:4px solid #9b59b6"><div style="font-size:26px;font-weight:800;color:#9b59b6">'+churnAvg+'%</div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text2);margin-top:4px">Prob. Churn Media</div><div style="font-size:10px;color:var(--text3);margin-top:3px">Estimado IA por señales</div></div>';
  h+='<div style="background:var(--surface);border-radius:10px;padding:15px;border-left:4px solid var(--accent)"><div style="font-size:26px;font-weight:800;color:var(--accent)">'+triggers.critical+'</div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text2);margin-top:4px">Alertas Activas</div><div style="font-size:10px;color:var(--text3);margin-top:3px">Gatillos automáticos</div></div>';
  h+='</div>';
  // SAFETY NET
  h+='<div style="background:var(--surface);border-radius:12px;padding:16px;margin-bottom:22px;border:1px solid var(--border)">';
  h+='<div style="font-weight:700;font-size:13px;margin-bottom:12px;color:var(--text)">🛡️ Red de Seguridad Automática</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(185px,1fr));gap:8px">';
  var tDefs=[{key:'criticalHS',label:'Health Score < 20',color:'#e74c3c'},{key:'negNPS',label:'NPS detractor (< -50)',color:'#e74c3c'},{key:'manyTickets',label:'5+ tickets abiertos',color:'#e67e22'},{key:'zeroGMV',label:'GMV = 0 (sin operación)',color:'#e67e22'},{key:'noContact60',label:'60+ días sin contacto',color:'#9b59b6'}];
  tDefs.forEach(function(td){var cnt=triggers[td.key]||0;h+='<div style="background:var(--bg);border-radius:8px;padding:10px 12px;border-left:3px solid '+(cnt>0?td.color:'#2ecc71')+'"><div style="display:flex;align-items:center;justify-content:space-between"><div style="font-size:11px;font-weight:600;color:'+(cnt>0?td.color:'#2ecc71')+'">'+td.label+'</div><div style="font-size:15px;font-weight:800;color:'+(cnt>0?td.color:'#2ecc71')+'">'+(cnt>0?cnt:'✓')+'</div></div></div>';});
  h+='</div></div>';
  // CLIENTS
  if(tierE.length>0){h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><span style="font-size:15px;font-weight:800;color:#e74c3c">🔴 Tier E — Intervención Inmediata</span><span style="background:rgba(231,76,60,.15);color:#e74c3c;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">'+tierE.length+'</span></div>';tierE.forEach(function(x,i){h+=renderAutoCard(x,'E',i+1);});}
  if(tierD.length>0){h+='<div style="display:flex;align-items:center;gap:10px;margin:'+(tierE.length>0?'24px':'0')+' 0 14px"><span style="font-size:15px;font-weight:800;color:#e67e22">🟠 Tier D — Cadencia Activa</span><span style="background:rgba(230,126,34,.15);color:#e67e22;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700">'+tierD.length+'</span></div>';tierD.forEach(function(x,i){h+=renderAutoCard(x,'D',i+1);});}
  if(scored.length===0)h+='<div style="text-align:center;padding:60px 20px"><div style="font-size:52px;margin-bottom:16px">🎉</div><div style="font-size:20px;font-weight:700;color:var(--text)">¡Cartera saludable!</div><div style="font-size:13px;color:var(--text2);margin-top:8px">Todos los clientes están en Tier A, B o C.</div></div>';
  h+='</div>';
  el.innerHTML=h;
}
export function getAutoTriggers(myC){
  var t={critical:0,criticalHS:0,negNPS:0,manyTickets:0,zeroGMV:0,noContact60:0};
  myC.forEach(function(c){var w=c.weekly||{};var hs=calcHS(c);
    if(hs.score!==null&&hs.score<20){t.criticalHS++;t.critical++;}
    if(w.nps!==null&&w.nps!==undefined&&w.nps<-50){t.negNPS++;t.critical++;}
    if((w.tickets||0)>=5)t.manyTickets++;
    if(w.gmv===0)t.zeroGMV++;
    var noC=!w.lastContact||daysSince(w.lastContact)>=60;if(noC)t.noContact60++;
  });
  return t;
}
export function renderAutoCard(x,tier,rank){
  var c=x.c;var w=c.weekly||{};var cId=c.id.replace(/[^a-z0-9]/gi,'_');
  var bc=tier==='E'?'#e74c3c':'#e67e22';
  var cp=_churnProb(x);var cpColor=cp>=70?'#e74c3c':cp>=45?'#e67e22':'#f39c12';
  var causes=[];var tips=[];
  if(w.nps!==null&&w.nps!==undefined&&w.nps<0){causes.push('NPS: '+w.nps+' (detractor)');tips.push('satisfaccion');}
  if((w.tickets||0)>0){causes.push((w.tickets||0)+' ticket(s) abierto(s)'+(w.bugs>0?' — '+w.bugs+' bug(s)':''));tips.push('soporte');}
  if(w.ticketDetalle){causes.push('🏷️ '+w.ticketDetalle);}
  if(w.causaRaiz){causes.push('🔍 Causa raíz: '+w.causaRaiz);}
  if(w.upPlan&&w.qtUp!==null&&!c.centry){var up=Math.round((w.qtUp/w.upPlan)*100);if(up<50){causes.push('Adopción UP: '+up+'% ('+w.qtUp+'/'+w.upPlan+')');tips.push('adopcion');}}
  if(w.gmv===0){causes.push('GMV = 0 — sin actividad de ventas');tips.push('gmv');}
  if(c.centry){causes.push('⏳ Migración Centry pendiente');tips.push('migracion');}
  if(w.lastContact){var dc=daysSince(w.lastContact);if(dc>30){causes.push(dc+' días sin contacto');if(tips.indexOf('cadencia')<0)tips.push('cadencia');}}
  else if(!w.lastContact&&!c.centry){causes.push('Sin fecha de contacto registrada');if(tips.indexOf('cadencia')<0)tips.push('cadencia');}
  if(causes.length===0)causes.push('Health Score bajo — datos parciales');
  if(tips.length===0)tips.push('cadencia');
  var stage=getCadenceStage(w);var si=getCadenceInfo(stage);
  var msgs=generateAutoMessages(c,w,tier,tips,causes,x.hs,cp);
  var spark=getHSSparkline(c.id);
  var ccoRec=_getCCORec(c,w,tier,cp,causes,tips);
  var h='<div style="background:var(--surface);border-radius:14px;margin-bottom:18px;border:1px solid rgba('+(tier==='E'?'231,76,60':'230,126,34')+',0.25);overflow:hidden">';
  // Header
  h+='<div style="background:rgba('+(tier==='E'?'231,76,60':'230,126,34')+',0.07);padding:14px 18px;border-bottom:1px solid rgba('+(tier==='E'?'231,76,60':'230,126,34')+',0.15);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">';
  h+='<div style="display:flex;align-items:center;gap:10px">';
  h+='<div style="background:'+bc+';color:#fff;font-weight:800;font-size:10px;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">#'+rank+'</div>';
  h+='<div style="background:'+bc+'22;color:'+bc+';font-weight:700;font-size:10px;padding:2px 7px;border-radius:5px;border:1px solid '+bc+'44">Tier '+tier+'</div>';
  h+='<div><div style="font-weight:700;font-size:14px;color:var(--text)">'+c.name+'</div>';
  if(c.segmento||c.porte){h+='<div style="display:flex;gap:4px;margin-top:3px">'+segBadge(c.segmento)+porteBadge(c.porte)+'</div>';}
  h+='</div>';
  if(c.country)h+='<div style="font-size:11px;color:var(--text2)">'+c.country+'</div>';
  if(spark)h+=spark;
  h+='</div>';
  h+='<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">';
  h+='<div style="background:'+cpColor+'1a;color:'+cpColor+';border-radius:7px;padding:4px 9px;font-size:11px;font-weight:700">⚠️ Churn ~'+Math.round(cp)+'%</div>';
  h+='<div style="background:var(--bg);border-radius:7px;padding:4px 9px;font-size:11px;font-weight:700;color:'+bc+'">HS '+x.hs+'</div>';
  h+='<div style="background:var(--bg);border-radius:7px;padding:4px 9px;font-size:11px;color:'+si.color+'">'+si.emoji+' '+si.label+'</div>';
  if(x.forcedRisk)h+='<div style="background:rgba(231,76,60,.1);color:#e74c3c;border-radius:5px;padding:3px 7px;font-size:10px;font-weight:600">🚨 Señal directa</div>';
  if(x.partial)h+='<div style="background:rgba(243,156,18,.1);color:#f39c12;border-radius:5px;padding:3px 7px;font-size:10px;font-weight:600">⚠️ Datos parciales</div>';
  h+='</div></div>';
  // Body
  h+='<div style="padding:16px 18px">';
  h+='<div style="margin-bottom:14px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--text2);margin-bottom:8px">🔍 Señales de riesgo</div><div style="display:flex;flex-wrap:wrap;gap:6px">';
  causes.forEach(function(cause){var isNPS=cause.indexOf('NPS')>-1;var isBug=cause.indexOf('ticket')>-1||cause.indexOf('bug')>-1;var tag=isNPS?'#e74c3c':isBug?'#e67e22':'#f39c12';h+='<span style="background:'+tag+'1a;color:'+tag+';font-size:11px;padding:4px 10px;border-radius:6px;font-weight:500">'+cause+'</span>';});
  var extraBadges=tipoChamadoBadge(w.tipoChamado)+presenciaReunBadge(w.presenciaReuniones);
  if(extraBadges)h+=extraBadges;
  var tnd=tendenciaLabel(c.id);if(tnd)h+='<span style="font-size:11px;padding:4px 8px">'+tnd+'</span>';
  h+='</div></div>';
  h+='<div style="background:rgba(79,142,247,.07);border-radius:10px;padding:12px 14px;margin-bottom:14px;border-left:3px solid var(--accent)"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--accent);margin-bottom:6px">🎯 Qué haría un CCO esta semana</div><div style="font-size:12px;color:var(--text);line-height:1.7">'+ccoRec+'</div></div>';
  h+='<div style="border-top:1px solid var(--border);padding-top:14px"><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--text2);margin-bottom:10px">💬 Scripts listos para enviar</div>';
  h+='<div style="display:flex;gap:7px;margin-bottom:10px;flex-wrap:wrap">';
  h+='<button onclick="showAutoMsg(\''+cId+'\',0)" id="abtn_'+cId+'_0" style="padding:5px 12px;border:none;border-radius:7px;background:var(--accent);color:#fff;cursor:pointer;font-size:12px;font-weight:600">📱 WhatsApp</button>';
  h+='<button onclick="showAutoMsg(\''+cId+'\',1)" id="abtn_'+cId+'_1" style="padding:5px 12px;border:1px solid var(--border);border-radius:7px;background:transparent;color:var(--text);cursor:pointer;font-size:12px">📧 Email</button>';
  h+='<button onclick="showAutoMsg(\''+cId+'\',2)" id="abtn_'+cId+'_2" style="padding:5px 12px;border:1px solid var(--border);border-radius:7px;background:transparent;color:var(--text);cursor:pointer;font-size:12px">📋 HubSpot</button>';
  h+='<button onclick="showAutoMsg(\''+cId+'\',3)" id="abtn_'+cId+'_3" style="padding:5px 12px;border:1px solid var(--border);border-radius:7px;background:transparent;color:var(--text);cursor:pointer;font-size:12px">📚 Recursos</button>';
  h+='</div>';
  h+='<div id="amsg_'+cId+'_0" style="display:block"><div style="background:var(--bg);border-radius:8px;padding:12px;font-size:12px;line-height:1.65;color:var(--text);white-space:pre-wrap">'+msgs.wa+'</div><button onclick="copyAutoMsg(\'amsg_'+cId+'_0\')" style="margin-top:6px;padding:4px 12px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--accent);cursor:pointer;font-size:11px">📋 Copiar</button></div>';
  h+='<div id="amsg_'+cId+'_1" style="display:none"><div style="font-size:11px;color:var(--text2);margin-bottom:4px;font-weight:600">Asunto: '+msgs.subj+'</div><div style="background:var(--bg);border-radius:8px;padding:12px;font-size:12px;line-height:1.65;color:var(--text);white-space:pre-wrap">'+msgs.email+'</div><button onclick="copyAutoMsg(\'amsg_'+cId+'_1\')" style="margin-top:6px;padding:4px 12px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--accent);cursor:pointer;font-size:11px">📋 Copiar email</button></div>';
  h+='<div id="amsg_'+cId+'_2" style="display:none"><div style="background:var(--bg);border-radius:8px;padding:12px;font-size:12px;line-height:1.65;color:var(--text);white-space:pre-wrap">'+msgs.hubspot+'</div><button onclick="copyAutoMsg(\'amsg_'+cId+'_2\')" style="margin-top:6px;padding:4px 12px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--accent);cursor:pointer;font-size:11px">📋 Copiar nota HubSpot</button></div>';
  h+='<div id="amsg_'+cId+'_3" style="display:none"><div style="background:var(--bg);border-radius:8px;padding:12px;font-size:12px;line-height:1.65;color:var(--text)">'+msgs.rec+'</div></div>';
  h+='</div>';
  h+='<div style="display:flex;gap:8px;margin-top:14px;padding-top:12px;border-top:1px solid var(--border);flex-wrap:wrap">';
  h+='<button onclick="logAutoContact(\''+c.id+'\')" style="padding:7px 14px;background:#27ae60;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700">✓ Marcar contactado</button>';
  if(stage>=3||tier==='E')h+='<button onclick="showToast(\'🔔 Escalado: '+c.name.replace(/'/g,'')+'\')" style="padding:7px 14px;background:#9b59b6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600">🔔 Escalar</button>';
  h+='<button onclick="selectedClientId=\''+c.id+'\';nav(\'ficha\',document.getElementById(\'nav-ficha\'))" style="padding:7px 14px;background:transparent;color:var(--accent);border:1px solid var(--accent);border-radius:8px;cursor:pointer;font-size:12px">Ver ficha →</button>';
  h+='</div></div></div>';
  return h;
}
export function generateAutoMessages(c,w,tier,tips,causes,hsScore,cp){
  var nm=c.name.split(' ')[0];var pain=tips[0]||'cadencia';
  var today=new Date().toISOString().split('T')[0];
  var cpR=cp!=null?Math.round(cp):null;
  var waMap={
    adopcion:'Hola '+nm+', buen día! 👋\n\nRevisando tu cuenta en AnyMarket vi que hay funcionalidades que aún no estás aprovechando y que pueden impactar directamente tus ventas.\n\n¿Tienes 15 minutos esta semana para que te muestre cómo otros clientes las están usando? 📈',
    soporte:'Hola '+nm+', soy Sami de AnyMarket 👋\n\nQuiero asegurarme de que todo esté funcionando correctamente y que no tengas ningún bloqueo operativo.\n\n¿Me cuentas cómo está la operación? Estoy aquí para ayudarte ✓',
    satisfaccion:'Hola '+nm+' 👋\n\nQuiero hacer un check-in rápido. Tu experiencia con AnyMarket es nuestra prioridad, y quiero escucharte directamente.\n\n¿Tienes 15 minutos esta semana para una llamada? 🎯',
    gmv:'Hola '+nm+', soy Sami de AnyMarket 👋\n\nEstoy revisando la operación y veo una oportunidad para activar más canales de venta.\n\n¿Agendamos una llamada esta semana para verlo juntos? 📈',
    migracion:'Hola '+nm+' 👋\n\nQuería darte un update sobre el proceso de migración a AnyMarket. El equipo está listo para avanzar.\n\n¿Podemos revisar el estado juntos esta semana? 📅',
    cadencia:'Hola '+nm+', soy Sami de AnyMarket 👋\n\nHacía tiempo que no nos comunicamos y quiero hacer un check-in rápido — también tengo novedades de la plataforma que te pueden interesar.\n\n¿Tienes 15 minutos esta semana? 📅'
  };
  var subjMap={
    adopcion:'[AnyMarket] Oportunidad de crecimiento para '+c.name,
    soporte:'[AnyMarket] Seguimiento de tu cuenta — aquí para ayudarte',
    satisfaccion:'[AnyMarket] Quiero escucharte — check-in de satisfacción',
    gmv:'[AnyMarket] Activemos más ventas para '+c.name,
    migracion:'[AnyMarket] Update de tu migración — próximos pasos',
    cadencia:'[AnyMarket] Novedades y check-in para tu operación'
  };
  var emailMap={
    adopcion:'Hola '+nm+',\n\nEspero que estés muy bien.\n\nRevisando tu cuenta detecto funcionalidades de AnyMarket que aún no estás aprovechando y que tienen impacto directo en GMV.\n\n¿Te parece si agendamos 20 minutos esta semana? Te muestro cómo clientes similares están generando resultados con ellas.\n\nSamiramis Monterola | Customer Success Manager — AnyMarket LATAM',
    soporte:'Hola '+nm+',\n\nEspero que estés muy bien.\n\nEstoy revisando tu cuenta y quiero confirmar que los temas técnicos recientes estén completamente resueltos.\n\nSi hay algo que sigue activo, escríbeme directamente — mi objetivo es que tu operación funcione sin fricción.\n\nSamiramis Monterola | Customer Success Manager — AnyMarket LATAM',
    satisfaccion:'Hola '+nm+',\n\nEspero que estés muy bien.\n\nQuiero hacer un check-in personalizado — tu satisfacción con AnyMarket es nuestra prioridad.\n\n¿Podemos conectar 20 minutos esta semana?\n\nSamiramis Monterola | Customer Success Manager — AnyMarket LATAM',
    gmv:'Hola '+nm+',\n\nEspero que estés muy bien.\n\nReviso la operación de '+c.name+' y veo oportunidades para activar canales de venta adicionales que pueden impactar tu revenue directamente.\n\n¿Agendamos 20 minutos esta semana?\n\nSamiramis Monterola | Customer Success Manager — AnyMarket LATAM',
    migracion:'Hola '+nm+',\n\nEspero que estés muy bien.\n\nQuiero dar seguimiento al proceso de migración hacia AnyMarket. El equipo está disponible y listo para avanzar.\n\n¿Revisamos el estado y próximos pasos en una llamada breve esta semana?\n\nSamiramis Monterola | Customer Success Manager — AnyMarket LATAM',
    cadencia:'Hola '+nm+',\n\nEspero que estés muy bien.\n\nHacía tiempo que no nos comunicamos y quiero asegurarme de que todo esté funcionando correctamente.\n\n¿Tienes 15–20 minutos esta semana para una llamada rápida?\n\nSamiramis Monterola | Customer Success Manager — AnyMarket LATAM'
  };
  var cleanCauses=(causes||[]).map(function(ca){return '- '+ca.replace(/<[^>]+>/g,'').replace(/[\ud800-\udfff]./g,'').trim();}).join('\n');
  var hsNote='## Resumen Ejecutivo\n'+c.name+' | Tier '+tier+' | HS: '+(hsScore||'N/A')+(cpR!=null?' | Prob. Churn: ~'+cpR+'%':'')+'\n\n## Señales Detectadas\n'+cleanCauses+'\n\n## Riesgo de Churn\n'+(tier==='E'?'ALTO':'MEDIO')+' — seguimiento activo requerido\n\n## Acciones Inmediatas\n1. Contactar champion/sponsor esta semana\n2. Escalar tickets críticos si aplica\n3. Preparar plan de acción con compromisos y fechas\n\n## Estado\nActivo — Tier '+tier+' | Fecha: '+today;
  var recMap={
    adopcion:'✅ Help Center AnyMarket\n✅ Sesión de capacitación Use Points personalizada\n✅ Checklist de adopción por etapa\n✅ Benchmark de uso vs clientes similares en su sector',
    soporte:'✅ Revisar y cerrar tickets abiertos en Zendesk\n✅ Escalar bugs a Producto con impacto documentado\n✅ Ofrecer sesión técnica de acompañamiento\n✅ Documentar causa raíz para Producto',
    satisfaccion:'✅ Preparar agenda de Business Review personalizada\n✅ Consultar NPS en Tracksale y analizar comentarios\n✅ Identificar un quick win antes de la llamada\n✅ Mapear nuevos stakeholders y validar champion',
    gmv:'✅ Revisar marketplaces desconectados en AnyMarket\n✅ Analizar publicaciones con errores y stock bajo\n✅ Proponer Predize si no tienen repricing activo\n✅ Definir objetivo de GMV conjunto para el mes',
    migracion:'✅ Alinear con PM de migración — revisar estado y hitos\n✅ Comunicar timeline claro al cliente con compromisos\n✅ Preparar checklist de go-live con criterios de éxito\n✅ Documentar en HubSpot riesgo y próximos pasos',
    cadencia:'✅ Revisar historial de actividades en HubSpot\n✅ Preparar 3 temas de valor para la llamada\n✅ Registrar contacto después de la interacción\n✅ Revisar oportunidades de expansión antes de la llamada'
  };
  return{wa:waMap[pain]||waMap.cadencia,subj:subjMap[pain]||subjMap.cadencia,email:emailMap[pain]||emailMap.cadencia,hubspot:hsNote,rec:recMap[pain]||recMap.cadencia};
}
export function showAutoMsg(cId,idx){[0,1,2,3].forEach(function(i){var p=document.getElementById('amsg_'+cId+'_'+i);var b=document.getElementById('abtn_'+cId+'_'+i);if(p)p.style.display=i===idx?'block':'none';if(b){b.style.background=i===idx?'var(--accent)':'transparent';b.style.color=i===idx?'#fff':'var(--text)';b.style.border=i===idx?'none':'1px solid var(--border)';}});}
export function copyAutoMsg(panelId){var el=document.getElementById(panelId);if(!el)return;var txt=el.querySelector('div').textContent||'';navigator.clipboard.writeText(txt).then(function(){showToast('📋 Copiado al portapapeles','green');}).catch(function(){showToast('Selecciona el texto manualmente','orange');});}
export function logAutoContact(clientId){var today=new Date().toISOString().split('T')[0];var c=getClients().find(function(x){return x.id===clientId;});if(c){c.weekly=c.weekly||{};c.weekly.lastContact=today;saveData();showToast('✓ Contacto registrado — '+c.name,'green');renderAutomatizacion();}}

// exposed for inline HTML handlers
window.showAutoMsg = showAutoMsg;
window.copyAutoMsg = copyAutoMsg;
window.logAutoContact = logAutoContact;
