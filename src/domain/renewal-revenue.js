// Extracted verbatim from index.html — PURE calc/lookup pieces only.
// getMRR: line ~4394. getRenewal: line ~4395. getRenewalAction: line ~4631.
//
// Explicitly OUT of scope (belong to other files per task instructions):
// saveMRRField (~4396), saveRenewalField (~4403), updateRenewalBadge (~4411),
// renderRevenueAtRisk (~4418), renderRenewalMini (~4467),
// renderCadenceCoverage (~4501), renderRenovaciones (~4555) — these are
// render/write functions for other UI/service files, not included here.
//
// NOTE (impure by design, preserved as-is per extraction rules):
// - `getMRR` reads directly from localStorage (key 'cs-mrr-'+id) and falls back
//   to the SEED_MRR constant.
// - `getRenewal` reads directly from localStorage (key 'cs-renewal-'+id).
//
// INTEGRATION TODO: `SEED_MRR` is a large seed-data constant originally defined
// at index.html:2162 (MRR estimates per client, in USD/month). It is NOT
// duplicated here — assumed to be exported from src/services/clients-repo.js
// (or a dedicated seed-data module) alongside the rest of the client seed data.
// Adjust the import path once that file exists.
import { SEED_MRR } from '../services/clients-repo.js';

function getMRR(id){const v=localStorage.getItem('cs-mrr-'+id);return v?parseFloat(v):(SEED_MRR&&SEED_MRR[id]?SEED_MRR[id]:null);}

// NOTA 2026-07-20: getRenewal/getRenewalAction removidos — los contratos de
// AnyMarket se renuevan mensualmente, no hay un ciclo de renovación anual que
// trackear (feedback directo de Sami). Ver [[feedback]] en memoria del proyecto.

export { getMRR };
