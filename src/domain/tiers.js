// ── PORTFOLIO A — ACELERACIÓN ──────────────────────────────────────────────

export const PORTFOLIO_GAP = [
  // Gap 1 (B→A) — Quick Wins
  {id:'fashions-park',  current:'B', gap:1, accion:'Activar AnyTools + Repricing. Proponer Mercado Shops como canal adicional.'},
  {id:'emma-sleep',     current:'B', gap:1, accion:'QBR ejecutivo. Proponer Repricing automático CL (Falabella, Paris, Ripley).', grupo:'Emma Sleep'},
  {id:'malaga',         current:'B', gap:1, accion:'Revisar adopción Use Points. Activar funcionalidades premium pendientes.'},
  {id:'divino',         current:'B', gap:1, accion:'Diagnóstico operativo completo. Mapear oportunidades de expansión de canales.'},
  {id:'colombiana',     current:'B', gap:1, accion:'Diagnóstico operativo. Identificar palanca principal de crecimiento.'},
  {id:'lounge',         current:'B', gap:1, accion:'Acelerar migración Centry → AnyMarket. Cada milestone completado = avance de tier.'},
  {id:'dtodoymas',      current:'B', gap:1, accion:'Diagnóstico operativo. Expansión de canales activos.'},
  {id:'pointbreak',     current:'B', gap:1, accion:'Diagnóstico operativo. Expansión de canales activos.'},
  // Gap 2 (C→A) — Push Estratégico
  {id:'belcorp-col',    current:'C', gap:2, accion:'BELCORP Corporate Review: una reunión mueve Chile + Colombia + México simultáneamente.', grupo:'Belcorp LATAM'},
  {id:'belcorp-chile',  current:'C', gap:2, accion:'BELCORP Corporate Review: coordinar expansión LATAM con ejecutivo regional.', grupo:'Belcorp LATAM'},
  {id:'transbel',       current:'C', gap:2, accion:'BELCORP Corporate Review: alinear roadmap de canales a nivel LATAM.', grupo:'Belcorp LATAM'},
  {id:'kayser',         current:'C', gap:2, accion:'Activar Repricing en CL (Falabella, Paris, Ripley). Revisión de adopción Use Points.'},
  {id:'forus-peru',     current:'C', gap:2, accion:'Acelerar migración Centry + primeros marketplaces en AnyMarket. Milestone = tier up.'},
  {id:'emma-sleep-co',  current:'C', gap:2, accion:'Replicar modelo Chile en CO: agregar Falabella + Ripley + Walmart.', grupo:'Emma Sleep'},
  {id:'tramontina-mx',  current:'C', gap:2, accion:'Executive Review. Activar features premium. Usar como benchmark para CL.', grupo:'Tramontina'},
  // Gap 3 (D→A) — Trabajo profundo
  {id:'tramontina-cl',  current:'D', gap:3, accion:'Expansion Talk urgente: agregar Falabella, Ripley, ML, Hites. Presentar TRAMONTINA MX como caso de éxito.', grupo:'Tramontina'},
  // Gap 4 (E→A) — Recovery total
  {id:'lacoste',        current:'E', gap:4, accion:'CRÍTICO: Diagnóstico urgente + reunión ejecutiva + Recovery Plan conjunto con Producto y Soporte.'},
];

export const GRUPO_ESTRATEGICO = [
  {
    nombre:'Belcorp LATAM', icon:'💄',
    ids:['belcorp-col','belcorp-chile','transbel'],
    desc:'Una sola reunión corporativa puede mover 3 cuentas al mismo tiempo. Propone un "BELCORP LATAM Partnership Review" con el ejecutivo regional.'
  },
  {
    nombre:'Emma Sleep', icon:'🛏️',
    ids:['emma-sleep','emma-sleep-co'],
    desc:'Replicar el modelo de CL en CO. Lo que funciona en Chile (6 canales, Repricing) se puede implementar en Colombia en 30 días.'
  },
  {
    nombre:'Tramontina', icon:'🍳',
    ids:['tramontina-cl','tramontina-mx'],
    desc:'MX tiene 5 canales activos (D→C); CL solo 2 (D). Presenta MX como caso de éxito para acelerar la expansión en Chile.'
  },
];
