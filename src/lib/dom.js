export function showToast(msg, type) {
  const colors = {green:'var(--green)',orange:'var(--orange)',red:'var(--red)',accent:'var(--accent)'};
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:24px;right:24px;background:${colors[type]||colors.accent};color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;animation:sUp .2s ease`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

export function showSaved(eid) { const t=document.getElementById(eid); if(t){t.style.opacity=1;setTimeout(()=>t.style.opacity=0,2000);} }

// ── SEGMENTO / PORTE / TENDENCIA / TIPO / PRESENCIA HELPERS ─────────────────
export function porteBadge(porte){if(!porte)return'';const cls=porte==='Enterprise'?'porte-enterprise':porte==='Mid Market'?'porte-mid':'porte-smb';return`<span class="seg-badge ${cls}">${porte}</span>`;}
export function segBadge(seg){if(!seg)return'';return`<span class="seg-badge">${seg}</span>`;}
export function tipoChamadoBadge(tipo){if(!tipo)return'';const map={'Bug':['tipo-bug','🐛 Bug'],'Reclamación':['tipo-rec','😤 Reclamación'],'Duda':['tipo-duda','❓ Duda'],'Financiero':['tipo-fin','💰 Financiero']};const[cls,label]=map[tipo]||['seg-badge',tipo];return`<span class="seg-badge ${cls}" style="margin-left:3px">${label}</span>`;}
export function presenciaReunBadge(pres){if(!pres)return'';const map={'Compareceu':['pres-ok','✅ Asistió'],'Parcial':['pres-par','🔶 Parcial'],'Faltou':['pres-no','❌ Faltó']};const[cls,label]=map[pres]||['seg-badge',pres];return`<span class="seg-badge ${cls}" style="margin-left:3px">${label}</span>`;}
// NOTE: reads localStorage directly (cs-v3-history) rather than going through history-repo.js's
// LS_HISTORY export — pure/storage-mixing wrinkle preserved verbatim from the source.
export function calcTendencia(clientId){try{const hist=JSON.parse(localStorage.getItem('cs-v3-history')||'[]');if(hist.length<2)return null;const recent=hist[hist.length-1].scores[clientId];const prev=hist[hist.length-2].scores[clientId];if(recent==null||prev==null)return null;const diff=recent-prev;if(diff>3)return'up';if(diff<-3)return'down';return'flat';}catch(e){return null;}}
export function tendenciaLabel(clientId){const t=calcTendencia(clientId);if(!t)return'';if(t==='up')return'<span class="tendencia-up">↑ Creciendo</span>';if(t==='down')return'<span class="tendencia-down">↓ Bajando</span>';return'<span class="tendencia-flat">→ Estable</span>';}
export function segPorteRow(c,w){const parts=[segBadge(c.segmento),porteBadge(c.porte),tipoChamadoBadge(w&&w.tipoChamado),presenciaReunBadge(w&&w.presenciaReuniones)].filter(Boolean);if(!parts.length)return'';return`<div style="display:flex;gap:4px;margin-top:3px;flex-wrap:wrap">${parts.join('')}</div>`;}

// exposed for inline HTML handlers (e.g. ui/automatizacion.js's dynamically-built
// `onclick="showToast('...')"` buttons)
window.showToast = showToast;
