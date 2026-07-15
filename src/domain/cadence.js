import { daysSince } from '../lib/format.js';

export function getCadenceStage(w){if(!w.lastContact)return 3;var d=daysSince(w.lastContact);if(d<=7)return 0;if(d<=14)return 1;if(d<=30)return 2;if(d<=60)return 3;return 4;}
export function getCadenceInfo(s){var st=[{emoji:'🟢',label:'Monitoreo',color:'#27ae60'},{emoji:'💡',label:'Value Touch',color:'#f39c12'},{emoji:'📊',label:'Re-engagement',color:'#e67e22'},{emoji:'🔴',label:'Activación Push',color:'#e74c3c'},{emoji:'🔔',label:'Escalar',color:'#9b59b6'}];return st[Math.min(s,4)];}
