// Extracted verbatim from index.html (lines ~4750-5293)
//
// saveDirNote is defined immediately before renderDirector in the source and
// is only ever invoked from inline onblur="" handlers inside renderDirector's
// own template (the 4 "Informe Semanal — Sami" textareas), so it is kept
// alongside renderDirector here and window-attached below.
import { loadUsers, getActiveUser } from '../services/profiles-repo.js';
import { PORT, fromSeed } from '../services/clients-repo.js';
import { DIR_NOTES_KEY } from '../services/notes-repo.js';
import { calcHS, hpClass, hpEmoji } from '../domain/health-score.js';
import { getRiskSignals } from '../domain/risk-signals.js';
import { getMRR } from '../domain/renewal-revenue.js';
import { norm } from '../lib/format.js';

function saveDirNote(userId, field) {
  const key = `cs-dir-notes-${userId}`;
  const notes = JSON.parse(localStorage.getItem(key) || '{}');
  const el = document.getElementById(`dir-note-${userId}-${field}`);
  if (el) notes[field] = el.value;
  notes._week = _dirCurrentWeek;
  notes._savedAt = new Date().toISOString();
  localStorage.setItem(key, JSON.stringify(notes));
  const tag = document.getElementById(`dir-saved-${userId}-${field}`);
  if (tag) { tag.style.opacity = 1; setTimeout(() => { tag.style.opacity = 0; }, 1500); }
}

let _dirCurrentWeek = '';

function renderDirector() {
  const el = document.getElementById('page-director');
  if (!el) return;

  const allUsers = loadUsers().filter(u => ['csm','superadmin'].includes(u.role));
  const flags = {Chile:'🇨🇱',Colombia:'🇨🇴',Uruguay:'🇺🇾',Mexico:'🇲🇽',Peru:'🇵🇪'};

  // Week label
  const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);
  const fmtDate = d => d.toLocaleDateString('es', {day:'2-digit',month:'short'});
  const weekLabel = `${fmtDate(startOfWeek)} – ${fmtDate(endOfWeek)}, ${now.getFullYear()}`;
  _dirCurrentWeek = weekLabel;

  // Load saved notes per user
  const activeUser = getActiveUser();
  const samiNotes  = JSON.parse(localStorage.getItem('cs-dir-notes-sami') || '{}');
  // backward compat: also read old global key if sami notes empty
  const _legacyNotes = JSON.parse(localStorage.getItem(DIR_NOTES_KEY) || '{}');
  const samiNotesEff = (samiNotes.done||samiNotes.plan||samiNotes.valor||samiNotes.solicitudes) ? samiNotes : _legacyNotes;

  // Build allClients from all CSM data
  const _rawData = JSON.parse(localStorage.getItem('cs-v3-data') || '{}');
  const savedData = Array.isArray(_rawData) ? _rawData : (_rawData.clients || []);
  const allClients = fromSeed().map(c => {
    const ls = savedData.find(s => s.id === c.id);
    if (ls) Object.assign(c, ls, { weekly: {...(c.weekly||{}), ...(ls.weekly||{})} });
    return c;
  });

  // ── KPIs globales ──
  const totalAll = allClients.length;
  const allHS = allClients.map(c => calcHS(c));
  const greens  = allHS.filter(h=>h.cl==='green').length;
  const yellows = allHS.filter(h=>h.cl==='yellow').length;
  const oranges = allHS.filter(h=>h.cl==='orange').length;
  const reds    = allHS.filter(h=>h.cl==='red').length;
  const scores  = allHS.map(h=>h.score).filter(s=>s!=null);
  const avgHSAll = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : null;

  const totalMRR = allClients.reduce((s,c) => s + (getMRR(c.id)||0), 0);
  const atRiskClients = allClients.filter((_,i)=>allHS[i].cl==='red'||allHS[i].cl==='orange');
  const mrrAtRisk = atRiskClients.reduce((s,c) => s + (getMRR(c.id)||0), 0);

  const today = new Date(); today.setHours(0,0,0,0);
  const cadClients = allClients.filter(c => {
    if (!c.weekly?.lastContact) return false;
    const d = new Date(c.weekly.lastContact); d.setHours(0,0,0,0);
    return Math.round((today-d)/86400000) <= 30;
  });
  const cadPct = totalAll ? Math.round(cadClients.length/totalAll*100) : 0;
  const totalTickets = allClients.reduce((s,c) => s+(c.weekly?.tickets||0), 0);
  const totalGMV = allClients.reduce((s,c) => s+(c.weekly?.gmv||0), 0);

  const hsColor = avgHSAll==null?'var(--text3)':avgHSAll>=70?'var(--green)':avgHSAll>=50?'var(--yellow)':avgHSAll>=30?'var(--orange)':'var(--red)';
  const cadColor = cadPct>=80?'var(--green)':cadPct>=60?'var(--yellow)':'var(--red)';
  const semColor = (reds+oranges)===0?'#1a3a2a':(reds+oranges)<=3?'#2a2a18':'#3a1a1a';
  const semTxt   = (reds+oranges)===0?'var(--green)':(reds+oranges)<=3?'var(--yellow)':'var(--red)';
  const semMsg   = (reds+oranges)===0?'🟢 Portfolio saludable — sin clientes críticos'
                 : reds>0?`🔴 ${reds} cliente${reds>1?'s':''} crítico${reds>1?'s':''} — acción urgente requerida`
                 : `🟡 ${oranges} cliente${oranges>1?'s':''} en riesgo — monitoreo activo`;

  const fmtMRR = v => v>=1000?`$${(v/1000).toFixed(1)}K`:`$${v}`;
  const fmtGMV = v => {
    if (!v) return '—';
    const m = v/100;
    return m>=1e9?`${(m/1e9).toFixed(1)}B`:m>=1e6?`${(m/1e6).toFixed(1)}M`:`${(m/1e3).toFixed(0)}K`;
  };

  // ── Per-CSM cards ──
  const csmCards = allUsers.map(u => {
    const csmClients = allClients.filter(c => {
      const port = PORT.find(p => norm(p.name) === norm(c.name));
      return port && u.clientIds.includes(port.id);
    });
    const sc = csmClients.map(c => calcHS(c).score).filter(s=>s!=null);
    const avg = sc.length ? Math.round(sc.reduce((a,b)=>a+b,0)/sc.length) : null;
    const risk = csmClients.filter(c => { const h=calcHS(c); return h.cl==='red'||h.cl==='orange'; });
    const top3 = risk.slice(0,3);
    const csmMRR = csmClients.reduce((s,c)=>s+(getMRR(c.id)||0),0);
    const csmTix = csmClients.reduce((s,c)=>s+(c.weekly?.tickets||0),0);
    const hc = avg==null?'var(--text3)':avg>=70?'var(--green)':avg>=50?'var(--yellow)':avg>=30?'var(--orange)':'var(--red)';
    return `
      <div class="dir-csm-card" style="border-top:3px solid ${u.color}">
        <div class="dir-csm-name">
          <div class="dir-csm-avatar" style="background:${u.color}22;border:2px solid ${u.color};color:${u.color}">${u.initials}</div>
          <div>
            <div style="font-size:13px;font-weight:700">${u.name.split(' ')[0]}</div>
            <div style="font-size:11px;color:var(--text3)">${csmClients.length} clientes · MRR ${fmtMRR(csmMRR)} USD</div>
          </div>
        </div>
        <div class="dir-kpi-row">
          <div class="dir-kpi"><div class="dir-kpi-val" style="color:${hc}">${avg??'—'}</div><div class="dir-kpi-lbl">Health</div></div>
          <div class="dir-kpi"><div class="dir-kpi-val" style="color:${risk.length>3?'var(--red)':risk.length>0?'var(--orange)':'var(--green)'}">${risk.length}</div><div class="dir-kpi-lbl">En riesgo</div></div>
          <div class="dir-kpi"><div class="dir-kpi-val" style="color:${csmTix>5?'var(--red)':csmTix>2?'var(--yellow)':'var(--text)'}">${csmTix}</div><div class="dir-kpi-lbl">Tickets</div></div>
        </div>
        ${top3.length?`
        <div class="dir-risk-row">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px">⚠️ Críticos</div>
          ${top3.map(c=>{const h=calcHS(c);return `<div class="dir-risk-item" onclick="openFicha('${c.id}')">
            <span class="hp ${hpClass(h.cl)}" style="font-size:10px;padding:1px 6px">${hpEmoji(h.cl)} ${h.score??'—'}</span>
            <span>${c.name}</span>
          </div>`;}).join('')}
          ${risk.length>3?`<div style="font-size:11px;color:var(--text3);margin-top:4px">+${risk.length-3} más</div>`:''}
        </div>`:`<div style="margin-top:12px;font-size:12px;color:var(--green)">✅ Sin críticos</div>`}
      </div>`;
  }).join('');

  // ── Global risk table ──
  const globalRisk = allClients.filter(c => {
    const h = calcHS(c); const w = c.weekly||{};
    return h.cl==='red'||h.cl==='orange'||(w.nps!=null&&w.nps<0);
  }).sort((a,b)=>(calcHS(a).score??999)-(calcHS(b).score??999));

  const riskRows = globalRisk.slice(0,25).map(c => {
    const h=calcHS(c), w=c.weekly||{};
    const owner = allUsers.find(u=>{ const port=PORT.find(p=>norm(p.name)===norm(c.name)); return port&&u.clientIds.includes(port.id); });
    const mrr = getMRR(c.id);
    const sigs = getRiskSignals(c);
    return `<tr style="cursor:pointer" onclick="openFicha('${c.id}')">
      <td><span class="hp ${hpClass(h.cl)}">${hpEmoji(h.cl)} ${h.score??'—'}</span></td>
      <td><div style="font-weight:600;font-size:12px">${c.name}</div><div style="font-size:10px;color:var(--text2)">${flags[c.country]||'🌎'} ${c.country||''}</div></td>
      <td>${owner?`<span style="background:${owner.color}22;color:${owner.color};border-radius:6px;padding:2px 8px;font-size:11px;font-weight:600">${owner.name.split(' ')[0]}</span>`:'—'}</td>
      <td>${w.nps!=null?`<span class="${w.nps>=50?'nps-pos':w.nps>=0?'nps-mid':'nps-neg'}">${w.nps>0?'+':''}${w.nps}</span>`:'<span class="no-data">—</span>'}</td>
      <td>${w.tickets??'<span class="no-data">—</span>'}</td>
      <td>${mrr?`<span style="font-size:11px;font-weight:700;color:var(--orange)">$${mrr}</span>`:'<span class="no-data">—</span>'}</td>
      <td style="font-size:11px">${sigs.map(s=>`<span title="${s.label}">${s.icon}</span>`).join(' ')}</td>
    </tr>`;
  }).join('');

  // ── Centry migrations ──
  const centryClients = [
    {id:'forus-sa',      name:'FORUS SA',       country:'CL', status:'en-migracion', bloqueado:false, nota:'Go Live planificado Jul 2026'},
    {id:'forus-colombia',name:'FORUS COLOMBIA',  country:'CO', status:'bloqueada',    bloqueado:true,  nota:'Bloqueada por Dafiti — pendiente resolución'},
    {id:'forus-peru',    name:'FORUS PERU',      country:'PE', status:'en-migracion', bloqueado:false, nota:'Proceso activo — PM asignado'},
    {id:'gino',          name:'GINO',            country:'CL', status:'en-migracion', bloqueado:false, nota:'Migración en curso'},
    {id:'lounge',        name:'LOUNGE S/A',      country:'CL', status:'en-migracion', bloqueado:false, nota:'Migración en curso'},
    {id:'maisa',         name:'MAISA',           country:'CL', status:'en-migracion', bloqueado:false, nota:'Migración en curso — PM asignado'},
  ];
  const centryRows = centryClients.map(cc => {
    const stBg  = cc.status==='bloqueada'?'rgba(231,76,60,.15)':cc.status==='completada'?'rgba(46,204,113,.15)':'rgba(243,156,18,.12)';
    const stCol = cc.status==='bloqueada'?'var(--red)':cc.status==='completada'?'var(--green)':'var(--yellow)';
    const stLbl = cc.status==='bloqueada'?'🚫 Bloqueada':cc.status==='completada'?'✅ Completada':'⏳ En migración';
    const mrr = getMRR(cc.id);
    return `<div class="dir-centry-row">
      <span style="min-width:28px">${flags[cc.country]||'🌎'}</span>
      <span style="flex:1;font-weight:600;font-size:12px">${cc.name}</span>
      <span class="dir-centry-status" style="background:${stBg};color:${stCol}">${stLbl}</span>
      <span style="flex:2;font-size:11px;color:var(--text2)">${cc.nota}</span>
      ${mrr?`<span style="font-size:11px;color:var(--text3)">MRR $${mrr}</span>`:''}
    </div>`;
  }).join('');

  // ── Insights de Sami (cartera propia) ──
  const samiUser2  = allUsers.find(u => u.id === 'sami' || u.name.toLowerCase().includes('sami'));
  const samiClients= samiUser2 ? allClients.filter(c => {
    const port = PORT.find(p => norm(p.name) === norm(c.name));
    return port && samiUser2.clientIds.includes(port.id);
  }) : [];
  const samiInsights = [];
  const _sReds   = samiClients.filter(c => calcHS(c).cl === 'red');
  const _sOrgs   = samiClients.filter(c => calcHS(c).cl === 'orange');
  const _sNegNPS = samiClients.filter(c => c.weekly?.nps != null && c.weekly.nps < 0);
  const _sPromos = samiClients.filter(c => c.weekly?.nps != null && c.weekly.nps >= 9);
  const _sHiTix  = samiClients.filter(c => (c.weekly?.tickets||0) >= 2);
  const _sTopG   = [...samiClients].filter(c=>c.weekly?.gmv>0).sort((a,b)=>b.weekly.gmv-a.weekly.gmv)[0];
  const _sBlocked= centryClients.filter(c=>c.bloqueado);
  const _today3  = new Date(); _today3.setHours(0,0,0,0);
  const _sNoCtc  = samiClients.filter(c => {
    if (!c.weekly?.lastContact) return true;
    const d=new Date(c.weekly.lastContact); d.setHours(0,0,0,0);
    return (_today3-d)/86400000 > 30;
  });
  const samiMRRAtRisk = samiClients.filter(c=>{const h=calcHS(c);return h.cl==='red'||h.cl==='orange';}).reduce((s,c)=>s+(getMRR(c.id)||0),0);

  if (_sReds.length)    samiInsights.push({icon:'🔴',type:'risk',text:`${_sReds.length} cliente${_sReds.length>1?'s':''} con Health ROJO: ${_sReds.slice(0,2).map(c=>c.name).join(', ')}${_sReds.length>2?` +${_sReds.length-2} más`:''} — acción urgente`});
  if (_sOrgs.length)    samiInsights.push({icon:'🟠',type:'risk',text:`${_sOrgs.length} en observación: ${_sOrgs.slice(0,2).map(c=>c.name).join(', ')}`});
  if (_sNegNPS.length)  samiInsights.push({icon:'😟',type:'risk',text:`NPS negativo: ${_sNegNPS.map(c=>`${c.name} (${c.weekly.nps})`).join(' · ')} — riesgo de churn activo`});
  if (samiMRRAtRisk>0)  samiInsights.push({icon:'💸',type:'risk',text:`Revenue at Risk en cartera Sami: ${fmtMRR(samiMRRAtRisk)} USD`});
  if (_sHiTix.length)   samiInsights.push({icon:'🎫',type:'risk',text:`Tickets acumulados: ${_sHiTix.map(c=>`${c.name} (${c.weekly.tickets})`).join(' · ')}`});
  if (_sBlocked.length) samiInsights.push({icon:'🚫',type:'risk',text:`Migración bloqueada: ${_sBlocked.map(c=>c.name+' — '+c.nota).join('; ')}`});
  samiInsights.push({icon:'🎉',type:'good',text:'NPS COBOE S/A - BOTIGA recuperado — de -100 a 10 · promotora activa · riesgo de churn eliminado'});
  samiInsights.push({icon:'🎉',type:'good',text:'NPS LOI CHILE recuperado — a 10 · promotora activa · cuenta estabilizada'});
  if (_sPromos.length)  samiInsights.push({icon:'🌟',type:'good',text:`Promotores NPS (9-10): ${_sPromos.map(c=>c.name).join(', ')} — oportunidad de expansión`});
  if (_sTopG)           samiInsights.push({icon:'📈',type:'good',text:`Mayor GMV de la cartera: ${_sTopG.name} con ${fmtGMV(_sTopG.weekly.gmv)} este mes`});

  const samiInsightsHTML = samiInsights.length ? `
    <div style="margin-top:16px;background:rgba(99,102,241,.06);border:1px solid rgba(99,102,241,.22);border-radius:12px;overflow:hidden">
      <div style="background:rgba(99,102,241,.11);padding:10px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(99,102,241,.14)">
        <span style="font-size:14px">💡</span>
        <span style="font-size:12px;font-weight:800;color:#a78bfa">Insights de mi Cartera — Semana ${weekLabel}</span>
        <span style="margin-left:auto;font-size:10px;color:var(--text3)">${samiInsights.length} insight${samiInsights.length>1?'s':''} · auto-generado</span>
      </div>
      <div style="padding:12px 16px;display:flex;flex-direction:column;gap:6px">
        ${samiInsights.map(ins=>`
          <div style="display:flex;align-items:flex-start;gap:9px;background:${ins.type==='risk'?'rgba(231,76,60,.07)':'rgba(46,204,113,.07)'};border:1px solid ${ins.type==='risk'?'rgba(231,76,60,.16)':'rgba(46,204,113,.16)'};border-radius:8px;padding:8px 12px">
            <span style="font-size:13px;flex-shrink:0">${ins.icon}</span>
            <span style="font-size:11.5px;color:var(--text);line-height:1.5">${ins.text}</span>
          </div>`).join('')}
      </div>
    </div>` : '';

  // ── Print handler ──
  const printBtn = `<button onclick="window.print()" style="background:var(--surface);border:1px solid var(--border);color:var(--text2);padding:8px 16px;border-radius:8px;cursor:pointer;font-size:12px;display:flex;align-items:center;gap:6px">🖨️ Imprimir</button>`;

  el.innerHTML = `
    <!-- HEADER SEMANA -->
    <div class="dir-week-header">
      <div>
        <div class="dir-week-title">👑 Dashboard CS — AnyMarket LATAM</div>
        <div class="dir-week-sub">Semana: ${weekLabel} · ${allUsers.length} CSMs activos · ${totalAll} clientes · <span style="color:#a78bfa;font-weight:600">Informe Sami incluido ↓</span></div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        ${printBtn}
      </div>
    </div>

    <!-- SEMÁFORO -->
    <div class="dir-semaforo" style="background:${semColor}">
      <div style="font-size:24px">📊</div>
      <div>
        <div style="font-size:14px;font-weight:800;color:${semTxt}">${semMsg}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:2px">Portfolio global: ${greens} sanos · ${yellows} observación · ${oranges} riesgo · ${reds} críticos</div>
        <span data-dir-total="${totalAll}" data-dir-green="${greens}" data-dir-yellow="${yellows}" data-dir-orange="${oranges}" data-dir-red="${reds}" style="display:none"></span>
      </div>
    </div>

    <!-- ══ PRO: INTELLIGENCE STRIP ══ -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px">

      <!-- Health Distribution Donut (SVG) -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px;display:flex;align-items:center;gap:18px">
        <div style="position:relative;flex-shrink:0">
          <svg id="dir-donut" width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border)" stroke-width="10"/>
            <circle id="dir-donut-green"  cx="40" cy="40" r="32" fill="none" stroke="var(--green)"  stroke-width="10" stroke-dasharray="0 201" stroke-linecap="round" transform="rotate(-90 40 40)"/>
            <circle id="dir-donut-yellow" cx="40" cy="40" r="32" fill="none" stroke="var(--yellow)" stroke-width="10" stroke-dasharray="0 201" stroke-linecap="round" transform="rotate(-90 40 40)"/>
            <circle id="dir-donut-orange" cx="40" cy="40" r="32" fill="none" stroke="var(--orange)" stroke-width="10" stroke-dasharray="0 201" stroke-linecap="round" transform="rotate(-90 40 40)"/>
            <circle id="dir-donut-red"    cx="40" cy="40" r="32" fill="none" stroke="var(--red)"    stroke-width="10" stroke-dasharray="0 201" stroke-linecap="round" transform="rotate(-90 40 40)"/>
            <text x="40" y="44" text-anchor="middle" font-size="14" font-weight="800" fill="var(--text)" id="dir-donut-label">—</text>
          </svg>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Health Portfolio</div>
          <div style="font-size:11px;line-height:2;color:var(--text2)" id="dir-donut-legend">
            <span style="color:var(--green)">🟢</span> — sanos<br>
            <span style="color:var(--yellow)">🟡</span> — observación<br>
            <span style="color:var(--orange)">🟠</span> — riesgo<br>
            <span style="color:var(--red)">🔴</span> — críticos
          </div>
        </div>
      </div>

      <!-- GMV Top Clients Bar Chart -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px">
        <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">Top GMV — Mes Actual</div>
        <div id="dir-gmv-bars" style="display:flex;flex-direction:column;gap:6px">
          <div style="font-size:11px;color:var(--text3)">Sin datos GMV disponibles</div>
        </div>
      </div>

      <!-- Contact Coverage Ring -->
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:18px">
        <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">Cobertura Cadencia</div>
        <div id="dir-cov-ring-wrap" style="display:flex;align-items:center;gap:14px">
          <svg width="72" height="72" viewBox="0 0 72 72" style="flex-shrink:0">
            <circle cx="36" cy="36" r="28" fill="none" stroke="var(--border)" stroke-width="9"/>
            <circle id="dir-cov-arc" cx="36" cy="36" r="28" fill="none" stroke="var(--green)" stroke-width="9"
              stroke-dasharray="0 176" stroke-linecap="round" transform="rotate(-90 36 36)"/>
            <text x="36" y="40" text-anchor="middle" font-size="13" font-weight="800" fill="var(--text)" id="dir-cov-pct">—</text>
          </svg>
          <div style="flex:1">
            <div style="font-size:11px;color:var(--text2);line-height:1.8" id="dir-cov-detail">
              <div>≤30d: <strong id="dir-cov-30">—</strong></div>
              <div>31–60d: <strong id="dir-cov-60">—</strong></div>
              <div>&gt;90d/sin dato: <strong id="dir-cov-stale" style="color:var(--red)">—</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- KPIs GLOBALES -->
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:20px">
      <div class="kpi-card kpi-blue"><div class="kpi-label">Clientes</div><div class="kpi-value">${totalAll}</div><div class="kpi-sub">${allUsers.length} CSMs activos</div></div>
      <div class="kpi-card" style="background:var(--surface);border:1px solid var(--border)"><div class="kpi-label">Health Avg</div><div class="kpi-value" style="color:${hsColor}">${avgHSAll??'—'}</div><div class="kpi-sub">${greens} sanos (${totalAll?Math.round(greens/totalAll*100):0}%)</div></div>
      <div class="kpi-card" style="background:var(--surface);border:1px solid var(--border)"><div class="kpi-label">GMV Total</div><div class="kpi-value" style="font-size:18px">${fmtGMV(totalGMV)}</div><div class="kpi-sub">Mes actual</div></div>
      <div class="kpi-card" style="background:var(--surface);border:1px solid var(--border)"><div class="kpi-label">MRR Total</div><div class="kpi-value" style="font-size:18px">${fmtMRR(totalMRR)}</div><div class="kpi-sub">USD/mes</div></div>
      <div class="kpi-card" style="background:${mrrAtRisk>0?'rgba(231,76,60,.08)':'var(--surface)'};border:1px solid ${mrrAtRisk>0?'var(--red)':'var(--border)'}"><div class="kpi-label">Revenue at Risk</div><div class="kpi-value" style="color:${mrrAtRisk>0?'var(--red)':'var(--green)'}">${fmtMRR(mrrAtRisk)}</div><div class="kpi-sub">${atRiskClients.length} clientes críticos/riesgo</div></div>
      <div class="kpi-card" style="background:var(--surface);border:1px solid var(--border)"><div class="kpi-label">Cadencia</div><div class="kpi-value" style="color:${cadColor}">${cadPct}%</div><div class="kpi-sub">${cadClients.length}/${totalAll} contactados ≤30d</div></div>
    </div>

    <!-- ══════════════════════════════════════════════ -->
    <!-- MI INFORME SEMANAL — SAMIRAMIS MONTEROLA     -->
    <!-- ══════════════════════════════════════════════ -->
    <div style="margin:28px 0 0;background:linear-gradient(135deg,rgba(79,142,247,.08),rgba(99,102,241,.05));border:2px solid rgba(79,142,247,.35);border-radius:16px;overflow:hidden">
      <!-- Header bloque Sami -->
      <div style="background:rgba(79,142,247,.12);padding:14px 20px;display:flex;align-items:center;gap:14px;border-bottom:1px solid rgba(79,142,247,.2)">
        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#4f8ef7,#6366f1);display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;font-weight:800;flex-shrink:0">⭐</div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:800;color:#4f8ef7">Informe Semanal — Samiramis Monterola (Sami)</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">CSM Senior · AnyMarket LATAM · Semana: ${weekLabel}</div>
        </div>
        <div style="font-size:10px;background:rgba(79,142,247,.15);color:#4f8ef7;border:1px solid rgba(79,142,247,.3);border-radius:8px;padding:4px 10px;white-space:nowrap">✍️ editable · guardado automático</div>
      </div>
      <!-- Insights de Sami (auto-generados) -->
      ${samiInsightsHTML}
      <!-- Cuadrante de notas Sami -->
      <div style="padding:16px">
        <div class="dir-weekly-grid">
          <div class="dir-note-box" style="border-left:3px solid var(--green)">
            <div class="dir-note-label">✅ Acciones realizadas esta semana <span id="dir-saved-sami-done" style="font-size:10px;color:var(--green);opacity:0;transition:opacity .3s">Guardado</span></div>
            <textarea class="dir-note-area" id="dir-note-sami-done" placeholder="• Reunión de rescate con COBOE BOTIGA&#10;• Seguimiento migración FORUS SA&#10;..." onblur="saveDirNote('sami','done')">${samiNotesEff.done||''}</textarea>
          </div>
          <div class="dir-note-box" style="border-left:3px solid var(--accent)">
            <div class="dir-note-label">📅 Plan próxima semana <span id="dir-saved-sami-plan" style="font-size:10px;color:var(--green);opacity:0;transition:opacity .3s">Guardado</span></div>
            <textarea class="dir-note-area" id="dir-note-sami-plan" placeholder="• Llamada de seguimiento NPS BOTIGA&#10;• Definir fecha Go Live FORUS SA&#10;..." onblur="saveDirNote('sami','plan')">${samiNotesEff.plan||''}</textarea>
          </div>
          <div class="dir-note-box" style="border-left:3px solid var(--yellow)">
            <div class="dir-note-label">💡 Valor entregado / Oportunidades <span id="dir-saved-sami-valor" style="font-size:10px;color:var(--green);opacity:0;transition:opacity .3s">Guardado</span></div>
            <textarea class="dir-note-area" id="dir-note-sami-valor" placeholder="• CS Command Center en producción&#10;• 2 NPS críticos recuperados&#10;..." onblur="saveDirNote('sami','valor')">${samiNotesEff.valor||''}</textarea>
          </div>
          <div class="dir-note-box" style="border-left:3px solid var(--red)">
            <div class="dir-note-label">🚨 Solicitudes a Dirección / Escalamientos <span id="dir-saved-sami-solicitudes" style="font-size:10px;color:var(--green);opacity:0;transition:opacity .3s">Guardado</span></div>
            <textarea class="dir-note-area" id="dir-note-sami-solicitudes" placeholder="• 🔴 DECISIÓN HOY: Firma hoja personas involucradas&#10;• 🔴 ESCALAR: PBI 1673726 sin ETA&#10;..." onblur="saveDirNote('sami','solicitudes')">${samiNotesEff.solicitudes||''}</textarea>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════ -->
    <!-- MÓDULO EQUIPO CS — OTROS CSMs (separado)      -->
    <!-- ══════════════════════════════════════════════ -->
    <div style="margin-top:32px;margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <div style="font-size:13px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.6px">👥 Equipo CS — Performance por CSM</div>
        <div style="flex:1;height:1px;background:var(--border)"></div>
        <div style="font-size:11px;color:var(--text3)">Semana ${weekLabel}</div>
      </div>
      <div class="dir-csm-grid">${csmCards}</div>
    </div>

    <!-- CLIENTES EN RIESGO -->
    ${globalRisk.length ? `
    <div class="card" style="margin-bottom:20px">
      <div class="card-title">⚠️ Clientes en Riesgo — Vista Global (${globalRisk.length}) <span>health rojo/naranja o NPS negativo</span></div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr><th>Health</th><th>Cliente</th><th>CSM</th><th>NPS</th><th>Tickets</th><th>MRR USD</th><th>Señales</th></tr></thead>
          <tbody>${riskRows}</tbody>
        </table>
        ${globalRisk.length>25?`<div style="text-align:center;padding:12px;color:var(--text3);font-size:12px">Mostrando los 25 más críticos de ${globalRisk.length}</div>`:''}
      </div>
    </div>` : `<div class="card" style="padding:32px;text-align:center;color:var(--green);margin-bottom:20px">✅ Sin clientes críticos en el portfolio esta semana</div>`}

    <!-- MIGRACIONES CENTRY -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-title" style="margin-bottom:14px">🔄 Estado Migraciones Centry → AnyMarket (${centryClients.length} cuentas)</div>
      ${centryRows}
    </div>

    <!-- TICKETS TOTALES -->
    ${totalTickets>0?`
    <div class="card" style="margin-bottom:20px">
      <div class="card-title" style="margin-bottom:14px">🎫 Resumen Tickets — Portfolio Global</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
        ${allUsers.map(u=>{
          const cc=allClients.filter(c=>{const p=PORT.find(q=>norm(q.name)===norm(c.name));return p&&u.clientIds.includes(p.id);});
          const tix=cc.reduce((s,c)=>s+(c.weekly?.tickets||0),0);
          if(!tix) return '';
          const conTix=cc.filter(c=>(c.weekly?.tickets||0)>0);
          return `<div style="background:var(--surface2);border-radius:10px;padding:14px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
              <div style="width:24px;height:24px;border-radius:50%;background:${u.color}22;border:2px solid ${u.color};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:${u.color}">${u.initials}</div>
              <span style="font-size:12px;font-weight:600">${u.name.split(' ')[0]}</span>
              <span style="margin-left:auto;font-size:16px;font-weight:800;color:${tix>5?'var(--red)':tix>2?'var(--yellow)':'var(--text)'}">${tix}</span>
            </div>
            ${conTix.map(c=>`<div style="font-size:11px;color:var(--text2);margin-bottom:3px">· ${c.name} (${c.weekly?.tickets})</div>`).join('')}
          </div>`;
        }).join('')}
      </div>
    </div>`:''}
  `;

  // ─── Post-render: charts ───────────────────────────────────────────────────
  setTimeout(function() {
    // Health donut
    try {
      const tot2 = totalAll || 1;
      const circ2 = 2*Math.PI*32;
      let off = 0;
      function setArc2(id, count) {
        const el = document.getElementById(id); if(!el) return;
        const dash = circ2 * count / tot2;
        const rot = (-90) + 360 * off / circ2;
        el.setAttribute('stroke-dasharray', dash + ' ' + (circ2 - dash));
        el.setAttribute('transform', 'rotate(' + rot + ' 40 40)');
        off += dash;
      }
      setArc2('dir-donut-green', greens);
      setArc2('dir-donut-yellow', yellows);
      setArc2('dir-donut-orange', oranges);
      setArc2('dir-donut-red', reds);
      const lbl = document.getElementById('dir-donut-label');
      if(lbl) lbl.textContent = totalAll > 0 ? Math.round(greens/totalAll*100)+'%' : '—';
      const leg = document.getElementById('dir-donut-legend');
      if(leg) leg.innerHTML = '<span style="color:var(--green)">🟢</span> '+greens+' sanos<br><span style="color:var(--yellow)">🟡</span> '+yellows+' obs.<br><span style="color:var(--orange)">🟠</span> '+oranges+' riesgo<br><span style="color:var(--red)">🔴</span> '+reds+' críticos';
    } catch(e) {}

    // GMV bars
    const gmvBars = document.getElementById('dir-gmv-bars');
    if (gmvBars) {
      const top5 = allClients.filter(c=>c.weekly?.gmv>0).sort((a,b)=>b.weekly.gmv-a.weekly.gmv).slice(0,5);
      if (top5.length) {
        const maxG = top5[0].weekly.gmv;
        gmvBars.innerHTML = top5.map(c=>{
          const pct = Math.round(c.weekly.gmv/maxG*100);
          const col = pct>=80?'var(--green)':pct>=50?'var(--yellow)':'var(--accent)';
          return `<div>
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text2);margin-bottom:2px">
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px">${c.name.split(' ')[0]}</span>
              <span style="color:var(--text)">${fmtGMV(c.weekly.gmv)}</span>
            </div>
            <div style="height:5px;border-radius:3px;background:var(--border);overflow:hidden">
              <div style="height:100%;width:${pct}%;background:${col};border-radius:3px;transition:width .4s ease"></div>
            </div>
          </div>`;
        }).join('');
      }
    }

    // Cadencia ring
    const today2 = new Date(); today2.setHours(0,0,0,0);
    const c30 = allClients.filter(c=>{if(!c.weekly?.lastContact)return false;const d=new Date(c.weekly.lastContact);d.setHours(0,0,0,0);return(today2-d)/86400000<=30;}).length;
    const c60 = allClients.filter(c=>{if(!c.weekly?.lastContact)return false;const d=new Date(c.weekly.lastContact);d.setHours(0,0,0,0);const dd=(today2-d)/86400000;return dd>30&&dd<=60;}).length;
    const stale = allClients.filter(c=>{if(!c.weekly?.lastContact)return true;const d=new Date(c.weekly.lastContact);d.setHours(0,0,0,0);return(today2-d)/86400000>90;}).length;
    const pct30 = totalAll?Math.round(c30/totalAll*100):0;
    const arcEl = document.getElementById('dir-cov-arc');
    const pctEl = document.getElementById('dir-cov-pct');
    if(arcEl){
      const circ2=2*Math.PI*28;
      arcEl.setAttribute('stroke-dasharray',circ2*pct30/100+' '+(circ2*(1-pct30/100)));
      arcEl.setAttribute('stroke',pct30>=80?'var(--green)':pct30>=60?'var(--yellow)':'var(--red)');
    }
    if(pctEl) pctEl.textContent=pct30+'%';
    const el30=document.getElementById('dir-cov-30'); if(el30) el30.textContent=c30+'/'+totalAll;
    const el60=document.getElementById('dir-cov-60'); if(el60) el60.textContent=c60;
    const elst=document.getElementById('dir-cov-stale'); if(elst) elst.textContent=stale;
  }, 150);
}

function renderEquipo() {
  const users = loadUsers();
  const activeUser = getActiveUser();
  const canAdmin = activeUser && ['superadmin','director'].includes(activeUser.role);
  const mainEl = document.getElementById('page-equipo');
  if (!mainEl) return;

  mainEl.innerHTML = `
    <div style="padding:24px;">
      <h2 style="color:#e8eaf6;margin-bottom:20px;">👥 Gestión de Equipo</h2>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px;">
        ${users.map(u => `
          <div style="background:#1a1d2e;border:1px solid #2e3250;border-radius:12px;padding:20px;min-width:220px;flex:1;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
              <div style="width:40px;height:40px;border-radius:50%;background:${u.color}22;border:2px solid ${u.color};display:flex;align-items:center;justify-content:center;font-weight:700;color:${u.color};">${u.initials}</div>
              <div>
                <div style="font-weight:600;color:#e8eaf6;">${u.name}</div>
                <div style="font-size:11px;color:#8892b0;">${u.team} · ${u.role==='superadmin'?'⭐ Super Admin':u.role==='director'?'👑 Director':u.role==='viewer'?'👁 Viewer':'👤 CSM'}</div>
              </div>
            </div>
            <div style="font-size:12px;color:#8892b0;">${u.role==='director'||u.role==='viewer'?'Acceso completo — todos los clientes':u.clientIds.length+' clientes asignados'}</div>
            ${canAdmin ? `
              <button onclick="editUser('${u.id}')" style="margin-top:12px;background:#252840;border:1px solid #2e3250;color:#8892b0;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;">✏️ Editar</button>
              ${u.id !== 'sami' && u.id !== 'director' ? `<button onclick="deleteUser('${u.id}')" style="margin-top:12px;margin-left:8px;background:rgba(231,76,60,.1);border:1px solid #e74c3c33;color:#e74c3c;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;">🗑️</button>` : ''}
            ` : ''}
          </div>
        `).join('')}
        ${canAdmin ? `
          <div onclick="addUser()" style="background:#1a1d2e;border:2px dashed #2e3250;border-radius:12px;padding:20px;min-width:200px;flex:1;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#4a5578;font-size:13px;transition:all .2s;" onmouseover="this.style.borderColor='#4f8ef7';this.style.color='#4f8ef7'" onmouseout="this.style.borderColor='#2e3250';this.style.color='#4a5578'">
            + Agregar CSM
          </div>
        ` : ''}
      </div>

      ${canAdmin ? `
        <div id="user-form-panel" style="display:none;background:#1a1d2e;border:1px solid #2e3250;border-radius:12px;padding:24px;margin-top:8px;">
          <h3 style="color:#e8eaf6;margin-bottom:16px;" id="user-form-title">Nuevo CSM</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
            <div>
              <label style="font-size:11px;color:#8892b0;display:block;margin-bottom:4px;">Nombre completo</label>
              <input id="uf-name" placeholder="Nombre Apellido" style="width:100%;background:#252840;border:1px solid #2e3250;color:#e8eaf6;padding:8px 10px;border-radius:6px;font-size:13px;box-sizing:border-box;">
            </div>
            <div>
              <label style="font-size:11px;color:#8892b0;display:block;margin-bottom:4px;">Equipo</label>
              <input id="uf-team" placeholder="LATAM CS" style="width:100%;background:#252840;border:1px solid #2e3250;color:#e8eaf6;padding:8px 10px;border-radius:6px;font-size:13px;box-sizing:border-box;">
            </div>
            <div>
              <label style="font-size:11px;color:#8892b0;display:block;margin-bottom:4px;">Rol</label>
              <select id="uf-role" style="width:100%;background:#252840;border:1px solid #2e3250;color:#e8eaf6;padding:8px 10px;border-radius:6px;font-size:13px;">
                <option value="csm">CSM</option>
                <option value="director">Director</option>
              </select>
            </div>
            <div>
              <label style="font-size:11px;color:#8892b0;display:block;margin-bottom:4px;">Color avatar</label>
              <input id="uf-color" type="color" value="#4f8ef7" style="width:100%;height:36px;background:#252840;border:1px solid #2e3250;border-radius:6px;cursor:pointer;">
            </div>
          </div>
          <div>
            <label style="font-size:11px;color:#8892b0;display:block;margin-bottom:8px;">Clientes asignados</label>
            <div id="uf-clients" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;max-height:300px;overflow-y:auto;padding:12px;background:#0f1117;border-radius:8px;">
              ${PORT.map(p => `
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px;border-radius:4px;">
                  <input type="checkbox" class="uf-client-cb" value="${p.id}" style="accent-color:#4f8ef7;">
                  <span style="font-size:12px;color:#8892b0;">${p.name}</span>
                </label>
              `).join('')}
            </div>
          </div>
          <div style="display:flex;gap:8px;margin-top:16px;">
            <button onclick="saveUserForm()" style="background:#4f8ef7;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-weight:600;">Guardar</button>
            <button onclick="closeUserForm()" style="background:#252840;color:#8892b0;border:1px solid #2e3250;padding:10px 20px;border-radius:8px;cursor:pointer;">Cancelar</button>
          </div>
        </div>
      ` : `<p style="color:#4a5578;font-size:13px;margin-top:24px;">Solo los directores pueden administrar el equipo.</p>`}
    </div>
  `;
}

// Inline handlers inside renderDirector's own template call saveDirNote(...)
// directly (onblur=""), so it must be reachable from global scope.
if (typeof window !== 'undefined') {
  window.saveDirNote = saveDirNote;
}

export { renderDirector, renderEquipo, saveDirNote };
