// Extracted verbatim from index.html (lines ~4411-4630)
//
import { getMRR, getRenewal, getRenewalAction } from '../domain/renewal-revenue.js';
import { getClients } from '../services/clients-repo.js';
import { calcHS, hpClass, hpEmoji } from '../domain/health-score.js';
import { daysUntil, daysSince, fmtD } from '../lib/format.js';

function updateRenewalBadge(){
  const clients=getClients();
  const urgent=clients.filter(c=>{const r=getRenewal(c.id);return r&&daysUntil(r)<=30&&daysUntil(r)>=0;}).length;
  const badge=document.getElementById('nb-renovaciones');
  if(badge){badge.textContent=urgent;badge.style.display=urgent>0?'flex':'none';}
}

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
    💡 Actualizá el MRR en la Ficha de cada cliente · <a href="#" onclick="nav('renovaciones',document.getElementById('nav-renovaciones'));return false" style="color:var(--accent)">Ver análisis completo →</a>
  </div>`;
}

// ── RENEWAL MINI PANEL (en overview) ──────────────────────────────────────────
function renderRenewalMini(){
  const el=document.getElementById('renewalMiniPanel');if(!el)return;
  const clients=getClients();
  const withRenewal=clients.map(c=>({c,days:daysUntil(getRenewal(c.id)),mrr:getMRR(c.id),date:getRenewal(c.id)})).filter(x=>x.days!==null&&x.days>=0).sort((a,b)=>a.days-b.days);
  const vencidas=clients.map(c=>({c,days:daysUntil(getRenewal(c.id))})).filter(x=>x.days!==null&&x.days<0);

  // Update badge
  const urgent30=withRenewal.filter(x=>x.days<=30).length;
  const badge=document.getElementById('nb-renovaciones');
  if(badge){badge.textContent=urgent30+vencidas.length;badge.style.display=(urgent30+vencidas.length)>0?'flex':'none';}

  if(withRenewal.length===0&&vencidas.length===0){
    el.innerHTML=`<div class="card-title">📅 Renewal Timeline <span><a href="#" onclick="nav('renovaciones',document.getElementById('nav-renovaciones'));return false" style="color:var(--accent)">ver todo →</a></span></div>
    <div style="color:var(--text3);font-size:12px;padding:16px 0;text-align:center">No hay fechas de renovación. Agregalas en la Ficha de cada cliente.</div>`;
    return;
  }

  const classFor=d=>d<=30?'rc-urgent':d<=60?'rc-soon':d<=90?'rc-planned':'rc-ok';
  const colorFor=d=>d<=30?'var(--red)':d<=60?'var(--orange)':d<=90?'var(--yellow)':'var(--green)';
  const cards=[...vencidas.slice(0,1).map(x=>`<div class="renew-card" style="background:rgba(231,76,60,.15);border-left:3px solid var(--red);cursor:pointer" onclick="openFicha('${x.c.id}')">
    <div class="rc-days" style="color:var(--red);font-size:14px">VENCIDA</div>
    <div><div class="rc-name">${x.c.name.split(' ').slice(0,3).join(' ')}</div><div class="rc-date">${fmtD(getRenewal(x.c.id))}</div></div>
    ${getMRR(x.c.id)?`<div class="rc-mrr" style="color:var(--red)">USD ${getMRR(x.c.id).toLocaleString()}</div>`:''}
  </div>`),...withRenewal.slice(0,4).map(x=>`<div class="renew-card ${classFor(x.days)}" onclick="openFicha('${x.c.id}')">
    <div class="rc-days" style="color:${colorFor(x.days)}">${x.days}d</div>
    <div style="flex:1"><div class="rc-name">${x.c.name.split(' ').slice(0,3).join(' ')}</div><div class="rc-date">${fmtD(x.date)}</div></div>
    ${x.mrr?`<div class="rc-mrr" style="color:${colorFor(x.days)}">USD ${x.mrr.toLocaleString()}</div>`:''}
  </div>`)].join('');

  el.innerHTML=`<div class="card-title">📅 Renewal Timeline <span><a href="#" onclick="nav('renovaciones',document.getElementById('nav-renovaciones'));return false" style="color:var(--accent)">ver todo →</a></span></div>
  <div class="renew-grid">${cards}</div>
  <div style="margin-top:10px;font-size:11px;color:var(--text3)">${withRenewal.length} renovaciones próximas · ${vencidas.length} vencidas sin actualizar</div>`;
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

// ── PÁGINA RENOVACIONES COMPLETA ───────────────────────────────────────────────
function renderRenovaciones(){
  const el=document.getElementById('renovacionesContent');if(!el)return;
  const clients=getClients();
  const flags={Chile:'🇨🇱',Colombia:'🇨🇴',Uruguay:'🇺🇾',Mexico:'🇲🇽',Peru:'🇵🇪','—':'🌎'};

  // Revenue at Risk table
  const mrrData=clients.map(c=>({c,mrr:getMRR(c.id),renewal:getRenewal(c.id),h:calcHS(c)})).sort((a,b)=>{
    const ao=a.h.cl==='red'?0:a.h.cl==='orange'?1:a.h.cl==='yellow'?2:3;
    const bo=b.h.cl==='red'?0:b.h.cl==='orange'?1:b.h.cl==='yellow'?2:3;
    return ao-bo;
  });
  const mrrTotal=mrrData.filter(x=>x.mrr).reduce((s,x)=>s+x.mrr,0);
  const mrrRisk=mrrData.filter(x=>x.mrr&&(x.h.cl==='red'||x.h.cl==='orange'||x.h.cl==='yellow')).reduce((s,x)=>s+x.mrr,0);

  const kpis=`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
    <div class="kpi-card kpi-blue"><div class="kpi-label">MRR Total (con datos)</div><div class="kpi-value" style="font-size:18px">$${mrrTotal>0?mrrTotal.toLocaleString():'—'}</div><div class="kpi-sub">${mrrData.filter(x=>x.mrr).length} clientes</div></div>
    <div class="kpi-card kpi-red"><div class="kpi-label">MRR en Riesgo</div><div class="kpi-value" style="font-size:18px;color:var(--red)">$${mrrRisk>0?mrrRisk.toLocaleString():'—'}</div><div class="kpi-sub">${mrrTotal>0?Math.round(mrrRisk/mrrTotal*100):'—'}% del portafolio</div></div>
    <div class="kpi-card kpi-yellow"><div class="kpi-label">Renuevan en 30d</div><div class="kpi-value" style="color:var(--red)">${clients.filter(c=>{const r=getRenewal(c.id);return r&&daysUntil(r)>=0&&daysUntil(r)<=30;}).length}</div><div class="kpi-sub">acción urgente</div></div>
    <div class="kpi-card kpi-orange"><div class="kpi-label">Renuevan en 60d</div><div class="kpi-value" style="color:var(--orange)">${clients.filter(c=>{const r=getRenewal(c.id);return r&&daysUntil(r)>30&&daysUntil(r)<=60;}).length}</div><div class="kpi-sub">preparar deck de valor</div></div>
  </div>`;

  // Timeline buckets
  const buckets=[
    {label:'🔴 Vencidas / urgentes', days:[null,0],    color:'var(--red)',    filter:x=>{const d=daysUntil(x.renewal);return x.renewal&&(d<0||d<=30);}},
    {label:'🟠 30–60 días',          days:[31,60],     color:'var(--orange)', filter:x=>{const d=daysUntil(x.renewal);return d!==null&&d>30&&d<=60;}},
    {label:'🟡 60–90 días',          days:[61,90],     color:'var(--yellow)', filter:x=>{const d=daysUntil(x.renewal);return d!==null&&d>60&&d<=90;}},
    {label:'🟢 Más de 90 días',      days:[91,null],   color:'var(--green)',  filter:x=>{const d=daysUntil(x.renewal);return d!==null&&d>90;}},
    {label:'⚪ Sin fecha de renovación', days:null,    color:'var(--text3)',  filter:x=>!x.renewal},
  ];
  const timeline=buckets.map(b=>{
    const items=mrrData.filter(b.filter);
    if(!items.length)return'';
    const rows=items.map(x=>{
      const d=daysUntil(x.renewal);
      const hs=calcHS(x.c);
      const daysStr=d===null?'—':d<0?`${Math.abs(d)}d vencida`:d===0?'Hoy':''+d+'d';
      const mrrStr=x.mrr?`$${x.mrr.toLocaleString()}`:'–';
      const hsBadge=hs.score!=null?`<span class="hp ${hpClass(hs.cl)}" style="font-size:10px;padding:2px 8px">${hpEmoji(hs.cl)} ${hs.score}</span>`:'<span class="no-data">—</span>';
      return `<tr style="cursor:pointer" onclick="openFicha('${x.c.id}')">
        <td style="padding:10px 12px;font-size:12px;font-weight:600">${flags[x.c.country]||'🌎'} ${x.c.name}</td>
        <td style="padding:10px 12px;font-size:12px">${x.renewal?fmtD(x.renewal):'—'}</td>
        <td style="padding:10px 12px;font-size:13px;font-weight:700;color:${b.color}">${daysStr}</td>
        <td style="padding:10px 12px;font-size:12px">${hsBadge}</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:700">${mrrStr}</td>
        <td style="padding:10px 12px;font-size:11px;color:var(--text2)">${getRenewalAction(d,hs.cl)}</td>
      </tr>`;
    }).join('');
    return `<div style="margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:10px 14px;background:var(--surface);border:1px solid var(--border);border-left:4px solid ${b.color};border-radius:8px">
        <span style="font-size:13px;font-weight:700">${b.label}</span>
        <span style="font-size:11px;font-weight:700;background:var(--surface2);color:var(--text2);padding:2px 8px;border-radius:10px">${items.length} clientes</span>
        ${items.filter(x=>x.mrr).length?`<span style="font-size:11px;color:${b.color};font-weight:700;margin-left:auto">$${items.filter(x=>x.mrr).reduce((s,x)=>s+x.mrr,0).toLocaleString()} MRR</span>`:''}
      </div>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:var(--surface2)">
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:var(--text3)">CLIENTE</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:var(--text3)">RENOVACIÓN</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:var(--text3)">DÍAS</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:var(--text3)">HEALTH</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:var(--text3)">MRR</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:var(--text3)">ACCIÓN RECOMENDADA</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
  }).join('');

  el.innerHTML=`
    <div style="margin-bottom:14px;padding:10px 14px;background:var(--surface2);border-radius:8px;font-size:12px;color:var(--text2)">
      💡 <strong>Tip:</strong> Agregá el MRR y la fecha de renovación de cada cliente directamente en su <a href="#" onclick="nav('ficha',document.getElementById('nav-ficha'));return false" style="color:var(--accent)">Ficha Cliente</a>. Los datos se guardan en el browser y persisten entre sesiones.
    </div>
    ${kpis}
    <div class="card" style="margin-bottom:20px">
      <div class="card-title">📅 Timeline de Renovaciones <span>ordenado por urgencia</span></div>
      ${timeline||'<div class="empty">Sin fechas de renovación configuradas. Editá cada cliente para agregar su fecha.</div>'}
    </div>`;
}

export { updateRenewalBadge, renderRevenueAtRisk, renderRenewalMini, renderCadenceCoverage, renderRenovaciones };
