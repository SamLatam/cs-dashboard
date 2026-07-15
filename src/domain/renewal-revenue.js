// ── MRR SEED (USD/mes — promedio últimos 3 meses relbase, conversión ~920 CLP/USD, Jun 2026) ──
export const SEED_MRR = {
  // Cartera SAMI — extraído de relbase.cl Mar-May 2026, convertido a USD ÷920
  'forus-sa':15925,       // Forus SA — $14.651.422 CLP/mes
  'gino':7497,            // Gino — $6.897.558 CLP/mes
  'maisa':3329,           // MAISA — $3.062.753 CLP/mes
  'forus-colombia':2748,  // Forus Colombia — $2.528.306 CLP/mes
  'pillin':2231,          // BEITGROUP S.A. (PILLIN) — $2.052.198 CLP/mes
  'loi-chile':2218,       // LOI CHILE — $2.040.285 CLP/mes
  'lounge':1889,          // LOUNGE S/A — $1.738.276 CLP/mes
  'fashions-park':1892,   // FASHIONS PARK — $1.741.069 CLP/mes (2 meses)
  'emma-sleep':1436,      // EMMA SLEEP CL — $1.321.334 CLP/mes
  'pointbreak':1477,      // POINTBREAK — $1.358.911 CLP/mes
  'dtodoymas':1284,       // DTODOYMAS — $1.181.148 CLP/mes
  'updown-juegos':1123,   // UPDOWN JUEGOS — $1.033.231 CLP/mes
  'lacoste':1043,         // LACOSTE — $959.956 CLP/mes
  'forus-peru':764,       // FORUS PERU — $702.603 CLP/mes
  'kayser':622,           // KAYSER — $572.168 CLP/mes
  'tramontina-mx':494,    // TRAMONTINA MX — $454.654 CLP/mes
  'divino':392,           // DIVINO S.A — $360.377 CLP/mes
  'tramontina-cl':280,    // TRAMONTINA CL — $257.660 CLP/mes
  // Cartera German/otros — valores anteriores
  'tpv-cl':994, 'imahe-cl':1070, 'gildemeister-cl':729, 'mouvair-cl':749,
  'flex-cl':705, 'petrizzio':662, 'klik-muebles':637, 'porto-menaje':611,
  'mali-cl':560, 'cienco-cl':511, 'talong-trade-cl':511, 'drimkip-cl':511,
  'nipon-andino':458, 'trail-cl':449, 'inkuba':431, 'importclick-cl':407,
  'fullcompra':407, 'hitway-music':382, 'bookcomputer':382, 'seducete-cl':382,
  'sporting-brands-cl':381, 'plaza-musica-cl':378, 'mibuy-cl':357, 'cubo24':355,
  'audiomusica':329, 'todoclick-spa':302, 'garmin-cl':215, 'rann-store':27,
  'mundo-joven':27,
  // Cartera D&E — extraído de relbase.cl Jun 2026 (CLP neto ÷ 920)
  'estoy-kuku':102,   // $93.976 CLP
  'mymarca':94,       // $86.826 CLP
  'frazadas-andes':72, // $66.518 CLP
  'color-sublime':72, // $66.364 CLP
  'mercado-jardin':67, // $61.805 CLP
  'jaguar-music':65,  // $59.584 CLP
  'dinon-cl':56,      // $51.937 CLP
  'tyk-hogar-cl':55,  // $50.912 CLP
  'emproquim':54,     // $49.861 CLP
  'corporacion-jireh':51, // $47.320 CLP
  'igpro-cl':50,      // $46.354 CLP
  'crece-seguro':50,  // $46.354 CLP
  'next-sa-cl':50,    // $46.153 CLP
  'altagama':46,      // $42.075 CLP
  'laser-cl':46,      // $42.198 CLP
  'unique-cl':46,     // $42.491 CLP
  'japan-market':41,  // $37.983 CLP
  'riquelme-cl':41,   // $37.983 CLP (nota: tiene NC pendientes)
  'calvac-cl':41,     // $37.856 CLP
  'vandine':41,       // $37.795 CLP
  'enigmatica':42,    // $39.012 CLP
  'dtparts-cl':42,    // $38.628 CLP
  'peluqueria-online':42, // $38.628 CLP
  'ferdel':42,        // $38.628 CLP
  'techbox':42,       // $38.802 CLP
  'tech-market-cl':40, // $37.180 CLP
  'oh-mi-hogar':38,   // $34.883 CLP
  'guven':35,         // $32.362 CLP
  'distrithunder':37, // $33.606 CLP
  'kairos-medical':31, // $28.517 CLP
  'makita-cl':29,     // $27.040 CLP
  'ascarcon-cl':29,   // $27.040 CLP
  'sobrelamesa':59,   // $54.080 CLP
  'davis-graphics':59, // $54.080 CLP
  'skinautica':59,    // $54.080 CLP
  'pacific-resources':59, // $54.080 CLP
  'lamparas-bosco':59, // $54.080 CLP
  'imporchile':24,    // $21.794 CLP
  'babyboo-cl':21,    // $19.379 CLP
  'toyblock':21,      // $19.314 CLP
  'from-meiggs':20,   // $17.958 CLP neto (facturas - NC)
  'polyphonik-cl':22, // $20.067 CLP
  'colque-audio':15   // $13.366 CLP
};

// ── MRR & RENEWAL (contrato) ───────────────────────────────────────────────────
// NOTE (known deviation, same caveat as domain/ticket-patterns.js): getMRR reads
// localStorage directly (cs-mrr-<id>) with a SEED_MRR fallback — not strictly pure,
// explicitly permitted per this file's task mapping.
export function getMRR(id){const v=localStorage.getItem('cs-mrr-'+id);return v?parseFloat(v):(SEED_MRR&&SEED_MRR[id]?SEED_MRR[id]:null);}
export function getRenewal(id){return localStorage.getItem('cs-renewal-'+id)||null;}

export function getRenewalAction(days, hsCl){
  if(days===null)return'Agregar fecha de renovación';
  if(days<0)return'⚠ Renovación vencida — gestionar urgente';
  if(days<=30&&hsCl==='red')return'🔴 Llamada urgente + plan de retención';
  if(days<=30)return'📞 Llamada de renovación + deck de valor';
  if(days<=60)return'📊 Preparar deck de valor entregado';
  if(days<=90)return'📋 Diagnóstico 360° + QBR';
  return'✅ En seguimiento regular';
}
