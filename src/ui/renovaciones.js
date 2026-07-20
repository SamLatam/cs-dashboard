// Extracted verbatim from index.html (lines ~4411-4630)
//
// NOTA 2026-07-20: se removieron updateRenewalBadge/renderRenewalMini/
// renderRenovaciones (getRenewal/getRenewalAction) — los contratos de AnyMarket
// se renuevan mensualmente, no hay ciclo de renovación anual que trackear
// (feedback directo de Sami). Quedan renderRevenueAtRisk (MRR × Health, sin
// depender de fecha de renovación) y renderCadenceCoverage (cadencia de
// contacto, concepto separado).
import { getMRR } from '../domain/renewal-revenue.js';
import { getClients } from '../services/clients-repo.js';
import { calcHS, hpClass, hpEmoji } from '../domain/health-score.js';
import { daysSince } from '../lib/format.js';

// ── REVENUE AT RISK PANEL ──────────────────────────────────────────────────────
function renderRevenueAtRisk(){
  const el=document.getElementById('revenueAtRiskPanel');if(!el)return;
  const clients=getClients();
  const mrrClients=clients.map(c=>({c,mrr:getMRR(c.id),h:calcHS(c)})).filter(x=>x.mrr>0);
  if(mrrClients.length===0){
    el.innerHTML=`<div class="card-title">💰 Revenue at Risk <span><a href="#" onclick="nav('ficha',document.getElementById('nav-ficha'));return false" style="color:var(--accent);text-decoration:none;font-size:11px">+ Agregar MRR en Ficha Cliente</a></span></div>
    <div style="color:var(--text3);font-size:12px;padding:16px 0;text-align:center">No hay datos de MRR. Agregá el MRR mensual en la Ficha de cada cliente para ver el revenue en riesgo.</div>`;
    return;
  }
  const bands=[
    {cl:'green', label:'Saludables',  color:'var(--green)',  bg:'var(--green-bg)'},
    {cl:'yellow',label:'Observación', color:'var(--yellow)', bg:'var(--yellow-bg)'},
    {cl:'orange',label:'En riesgo',   color:'var(--orange)', bg:'var(--orange-bg)'},
    {cl:'red',   label:'Críticos',    color:'var(--red)',    bg:'var(--red-bg)'},
  ];
  const mrrTotal=mrrClients.reduce((s,x)=>s+x.mrr,0);
  const mrrRisk=mrrClients.filter(x=>x.h.cl==='orange'||x.h.cl==='yellow'||x.h.cl==='red').reduce((s,x)=>s+x.mrr,0);
  const mrrCrit=mrrClients.filter(x=>x.h.cl==='red').reduce((s,x)=>s+x.mrr,0);
  const pctRisk=mrrTotal?Math.round(mrrRisk/mrrTotal*100):0;

  const bandRows=bands.map(b=>{
    const bClients=mrrClients.filter(x=>x.h.cl===b.cl);
    const bMRR=bClients.reduce((s,x)=>s+x.mrr,0);
    if(bMRR===0)return'';
    return `<div class="rar-band">
      <div class="rar-dot" style="background:${b.color}"></div>
      <span class="rar-label">${b.label}</span>
      <div style="flex:2;margin:0 8px">
        <div style="height:5px;background:var(--surface2);border-radius:3px;overflow:hidden">
          <div style="width:${Math.round(bMRR/mrrTotal*100)}%;height:100%;background:${b.color};border-radius:3px"></div>
        </div>
      </div>
      <span class="rar-val" style="color:${b.color}">$${bMRR.toLocaleString()}</span>
      <span class="rar-cnt">${bClients.length} ctas</span>
    </div>`;
  }).join('');

  el.innerHTML=`<div class="card-title">💰 Revenue at Risk <span>${mrrClients.length} clientes con MRR</span></div>
  <div style="display:flex;gap:16px;margin-bottom:14px">
    <div><div style="font-size:22px;font-weight:800">$${mrrTotal.toLocaleString()}</div><div style="font-size:11px;color:var(--text2)">MRR Total con datos</div></div>
    <div><div style="font-size:22px;font-weight:800;color:${mrrRisk>0?'var(--orange)':'var(--green)'}">$${mrrRisk.toLocaleString()}</div><div style="font-size:11px;color:var(--text2)">MRR en riesgo (${pctRisk}%)</div></div>
    ${mrrCrit>0?`<div><div style="font-size:22px;font-weight:800;color:var(--red)">$${mrrCrit.toLocaleString()}</div><div style="font-size:11px;color:var(--text2)">MRR crítico</div></div>`:''}
  </div>
  ${bandRows}
  <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);font-size:11px;color:var(--text3)">
    💡 Actualizá el MRR en la Ficha de cada cliente.
  </div>`;
}

// ── CADENCE COVERAGE PANEL ─────────────────────────────────────────────────────
function renderCadenceCoverage(){
  const el=document.getElementById('cadenceCoveragePanel');if(!el)return;
  const clients=getClients();
  const flags={Chile:'🇨🇱',Colombia:'🇨🇴',Uruguay:'🇺🇾',Mexico:'🇲🇽',Peru:'🇵🇪','—':'🌎'};
  const countries=[...new Set(clients.map(c=>c.country))].sort();

  const total=clients.length;
  const contactados30=clients.filter(c=>c.weekly?.lastContact&&daysSince(c.weekly.lastContact)<=30).length;
  const sinContacto=clients.filter(c=>!c.weekly?.lastContact||daysSince(c.weekly.lastContact)>60);
  const pct=Math.round(contactados30/total*100);
  const pctColor=pct>=80?'var(--green)':pct>=60?'var(--yellow)':pct>=40?'var(--orange)':'var(--red)';

  const countryCards=countries.map(co=>{
    const group=clients.filter(c=>c.country===co);
    const cont=group.filter(c=>c.weekly?.lastContact&&daysSince(c.weekly.lastContact)<=30).length;
    const p=Math.round(cont/group.length*100);
    const col=p>=80?'var(--green)':p>=60?'var(--yellow)':p>=40?'var(--orange)':'var(--red)';
    return `<div class="cad-card">
      <div class="cad-flag">${flags[co]||'🌎'}</div>
      <div class="cad-pct" style="color:${col}">${p}%</div>
      <div class="cad-label">${co}</div>
      <div class="cad-sub">${cont}/${group.length} contactados</div>
      <div class="cad-bar"><div class="cad-fill" style="width:${p}%;background:${col}"></div></div>
    </div>`;
  }).join('');

  const sinCont=sinContacto.slice(0,6).map(c=>{
    const d=c.weekly?.lastContact?daysSince(c.weekly.lastContact):null;
    return `<span style="background:var(--surface2);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:11px;color:${d&&d>90?'var(--red)':'var(--orange)'}">${flags[c.country]||'🌎'} ${c.name.split(' ')[0]}${d?' ('+d+'d)':' (sin dato)'}</span>`;
  }).join('');

  el.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
    <div class="card-title" style="margin-bottom:0">🗺️ Cobertura de Cadencia — últimos 30 días</div>
    <div style="display:flex;align-items:center;gap:12px">
      <div style="text-align:center">
        <div style="font-size:28px;font-weight:800;color:${pctColor}">${pct}%</div>
        <div style="font-size:11px;color:var(--text2)">${contactados30}/${total} clientes</div>
      </div>
      <div style="width:70px;height:70px;position:relative">
        <svg viewBox="0 0 36 36" style="transform:rotate(-90deg);width:70px;height:70px">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--surface2)" stroke-width="3.8"/>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="${pctColor}" stroke-width="3.8"
            stroke-dasharray="${pct} ${100-pct}" stroke-linecap="round"/>
        </svg>
      </div>
    </div>
  </div>
  <div class="cad-grid" style="margin-bottom:14px">${countryCards}</div>
  ${sinContacto.length>0?`<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
    <div style="font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Sin contacto reciente (>60 días)</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">${sinCont}${sinContacto.length>6?`<span style="font-size:11px;color:var(--text3)">+${sinContacto.length-6} más</span>`:''}</div>
  </div>`:'<div style="color:var(--green);font-size:12px;margin-top:8px">✅ Todos los clientes tienen contacto reciente</div>'}`;
}

export { renderRevenueAtRisk, renderCadenceCoverage };
