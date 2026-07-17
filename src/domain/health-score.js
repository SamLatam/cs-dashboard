// Extracted verbatim from index.html (lines ~2749-2770)
// ── HEALTH ─────────────────────────────────────────────────────────────────────
//
// INTEGRATION TODO: `fmtG` and `daysSince` are pure formatting/date-math helpers
// originally defined at index.html:4302 (fmtG) and index.html:4300 (daysSince).
// Assumed to live in a shared lib module — adjust the import path below once the
// lib/* files land (another agent is writing src/lib/*).
import { fmtG, daysSince } from '../lib/format.js';

function calcHS(c) {
  const w = c.weekly || {}; const comps = {};
  if (w.gmv != null) { const g = w.gmv; comps.gmv = {label:'GMV',weight:.25,score:g>500e6?100:g>200e6?80:g>50e6?60:g>0?35:0,raw:fmtG(g)}; }
  if (w.tickets != null) { const t = w.tickets||0; comps.tickets = {label:'Tickets Zendesk',weight:.25,score:t===0?100:t===1?70:t===2?40:10,raw:t+' abiertos'}; }
  if (w.upPlan != null && w.qtUp != null && !c.centry) { const up=Math.min(100,Math.round(w.qtUp/w.upPlan*100)); comps.up={label:'Use Points',weight:.20,score:up,raw:w.qtUp+'/'+w.upPlan+' ('+up+'%)'}; }
  if (w.nps != null) { comps.nps={label:'NPS',weight:.15,score:Math.round((w.nps+100)/2),raw:(w.nps>0?'+':'')+w.nps}; }
  if (w.lastContact) { const d=daysSince(w.lastContact); comps.contact={label:'Último Contacto',weight:.15,score:d<7?100:d<14?80:d<30?60:d<60?40:d<90?20:0,raw:d+'d'}; }
  const keys = Object.keys(comps); if (keys.length < 1) return {score:null,comps,cl:null,partial:true};
  const tw = keys.reduce((s,k)=>s+comps[k].weight,0);
  const score = Math.round(keys.reduce((s,k)=>s+comps[k].score*(comps[k].weight/tw),0));
  // Penalizar score parcial: si faltan 3+ componentes, se aplica un cap descendente
  const missing = 5 - keys.length - (c.centry?1:0); // Centry no tiene UP
  const penalty = missing >= 3 ? 15 : missing >= 2 ? 5 : 0;
  const finalScore = Math.max(0, score - penalty);
  const cl = finalScore>=70?'green':finalScore>=50?'yellow':finalScore>=30?'orange':'red';
  const partial = keys.length < 3;
  return {score:finalScore,comps,cl,partial};
}
function hpClass(cl) { return cl==='green'?'hp-green':cl==='yellow'?'hp-yellow':cl==='orange'?'hp-orange':'hp-red'; }
function hpEmoji(cl) { return cl==='green'?'🟢':cl==='yellow'?'🟡':cl==='orange'?'🟠':'🔴'; }
function hpLabel(cl) { return cl==='green'?'Sano':cl==='yellow'?'Observación':cl==='orange'?'En riesgo':'Crítico'; }

export { calcHS, hpClass, hpEmoji, hpLabel };
