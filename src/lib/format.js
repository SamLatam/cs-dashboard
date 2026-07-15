// ── HELPERS ────────────────────────────────────────────────────────────────────
export function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
export function norm(s){return(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');}
export function today(){return new Date().toISOString().slice(0,10);}
export function daysSince(d){return Math.round((Date.now()-new Date(d+'T12:00:00'))/86400000);}
export function daysUntil(d){if(!d)return null;return Math.round((new Date(d+'T12:00:00')-Date.now())/86400000);}
export function fmtG(n){if(n==null)return'—';if(n>=1e9)return'$'+(n/1e9).toFixed(1)+'B';if(n>=1e6)return'$'+(n/1e6).toFixed(0)+'M';if(n>=1e3)return'$'+(n/1e3).toFixed(0)+'K';return'$'+n;}
export function fmtD(d){if(!d)return'—';try{return new Date(d+'T12:00:00').toLocaleDateString('es-CL',{day:'2-digit',month:'short'});}catch(e){return d;}}
