// ── ENGAGEMENT SCORE (Frecuencia · Intensidad · Features · Casos de Uso) ────────
// Basado en el marco de 4 tipos de engagement (frecuencia, intensidad, features,
// casos de uso) aplicado al core de AnyMarket (integración multicanal de
// catálogo/stock/pedidos entre ERP y marketplaces).
//
// REGLA DEL PROYECTO: nunca inventar datos. Cada dimensión usa exclusivamente
// datos ya presentes en el dashboard:
//   - Frecuencia  → cadencia de contacto CS (c.weekly.lastContact). NO medimos
//     frecuencia de acceso al producto (AnyMarket no expone esa telemetría a
//     este dashboard) — se documenta explícitamente como límite conocido.
//   - Intensidad  → % de Use Points consumidos (c.weekly.qtUp/upPlan), fuente:
//     Power BI Use Points. Null para clientes Centry (aún no tienen UP).
//   - Features    → adopción de la suite AnyTools (Predize, Koncili, WinnerBox,
//     Marca Seleta), campo manual c.weekly.features (array de keys) que carga
//     la CSM — no existe ninguna fuente automatizada para esto.
//   - Casos de uso→ diversidad de marketplaces activos (campo existente
//     'cs-mkt-<id>' en localStorage, ya editable desde la Ficha/Catálogo).
//
// Si faltan 3 o 4 dimensiones, se retorna segment:'sin-datos' en vez de forzar
// una clasificación — "Información insuficiente para generar una evaluación
// confiable" (regla del proyecto).
import { daysSince } from '../lib/format.js';

const ANYTOOLS_FEATURES = [
  { key: 'predize',     label: 'Predize',     desc: 'SAC con IA' },
  { key: 'koncili',     label: 'Koncili',     desc: 'Conciliación financiera' },
  { key: 'winnerbox',   label: 'WinnerBox',   desc: 'Repricing dinámico' },
  { key: 'marcaseleta', label: 'Marca Seleta',desc: 'Full commerce' },
];

function getMarketplaceCount(mktString) {
  if (!mktString || !mktString.trim()) return null;
  return mktString.split(',').map(s => s.trim()).filter(Boolean).length;
}

// ── FRECUENCIA — proxy: cadencia de contacto CS ─────────────────────────────────
function getFrequencySignal(c) {
  const w = c.weekly || {};
  if (!w.lastContact) return { level: null, label: 'Sin dato', detail: 'Sin fecha de último contacto registrada. Ver HubSpot/Outlook.' };
  const d = daysSince(w.lastContact);
  if (d <= 14) return { level: 'alta',  label: 'Alta',  detail: `Último contacto hace ${d}d — cadencia semanal/quincenal.` };
  if (d <= 30) return { level: 'media', label: 'Media', detail: `Último contacto hace ${d}d — cadencia mensual.` };
  return { level: 'baja', label: 'Baja', detail: `Último contacto hace ${d}d — cadencia trimestral o mayor.` };
}

// ── INTENSIDAD — % de Use Points consumidos ─────────────────────────────────────
function getIntensitySignal(c) {
  const w = c.weekly || {};
  if (c.centry) return { level: null, label: 'N/A (Centry)', detail: 'Cliente aún en Centry — sin Use Points en AnyMarket.' };
  if (w.upPlan == null || w.qtUp == null) return { level: null, label: 'Sin dato', detail: 'Consultar Power BI Use Points.' };
  const pct = w.upPlan > 0 ? Math.round(w.qtUp / w.upPlan * 100) : null;
  if (pct == null) return { level: null, label: 'Sin dato', detail: 'Plan de Use Points inválido.' };
  const level = pct >= 50 ? 'alta' : pct >= 20 ? 'media' : 'baja';
  return { level, label: `${pct}%`, detail: `${w.qtUp}/${w.upPlan} Use Points consumidos (${pct}%).`, pct };
}

// ── FEATURES — adopción de la suite AnyTools ────────────────────────────────────
// IMPORTANTE: distinguimos "nunca evaluado" (c.weekly.features es undefined —
// nadie marcó nada todavía) de "evaluado y sin adopción" (array vacío explícito,
// guardado por toggleFeature/client-state-repo.js). Lo primero es null/sin dato
// — no hay fuente automatizada para esto, solo lo sabe la CSM — lo segundo es un
// dato real (count:0) que sí alimenta alertas y clasificación.
function getFeaturesSignal(c) {
  const feats = c.weekly && c.weekly.features;
  if (!Array.isArray(feats)) return { level: null, label: 'Sin evaluar', detail: 'Adopción de la suite AnyTools sin registrar todavía. Marcar en la Ficha del cliente.', count: null };
  const count = feats.length;
  const level = count >= 2 ? 'alta' : count === 1 ? 'media' : 'baja';
  const detail = count > 0
    ? `Usa: ${feats.map(k => ANYTOOLS_FEATURES.find(f => f.key === k)?.label || k).join(', ')}.`
    : 'No usa ningún producto de la suite AnyTools además del core (confirmado).';
  return { level, label: `${count}/${ANYTOOLS_FEATURES.length}`, detail, count };
}

// ── CASOS DE USO — diversidad de marketplaces activos (proxy) ───────────────────
function getUseCaseSignal(mktString) {
  const count = getMarketplaceCount(mktString);
  if (count == null) return { level: null, label: 'Sin dato', detail: 'Registrar marketplaces activos en la Ficha del cliente.' };
  const level = count >= 4 ? 'alta' : count >= 2 ? 'media' : 'baja';
  return { level, label: `${count} canal${count === 1 ? '' : 'es'}`, detail: `Marketplaces activos: ${mktString}.`, count };
}

function scoreLevel(l) { return l === 'alta' ? 2 : l === 'media' ? 1 : l === 'baja' ? 0 : null; }

function buildRecommendations({ frequency, intensity, features, useCase, segment }) {
  const recs = [];
  if (frequency.level === 'baja') recs.push('Programar un check-in activo — no hay evidencia de contacto reciente (riesgo de deuda operativa silenciosa: catálogo/stock desactualizándose sin que se note).');
  if (intensity.level === 'baja') recs.push('Revisar consumo de Use Points con el cliente — está pagando un plan que no está exprimiendo. Agendar diagnóstico de adopción.');
  if (features.level === 'baja') recs.push('Presentar la suite AnyTools (Predize, Koncili, WinnerBox) — es la palanca más fuerte de expansión y de "costo de salida".');
  if (useCase.level === 'baja') recs.push('Proponer activar un marketplace adicional — cada canal nuevo es un caso de uso más atado a AnyMarket.');
  if (segment === 'power') recs.push('Usar como caso de éxito / referencia en QBR de cuentas similares. Candidato natural a upsell de features premium.');
  return recs;
}

// ── PERFIL DE ENGAGEMENT COMPLETO ────────────────────────────────────────────────
function getEngagementProfile(c, mktString) {
  const frequency = getFrequencySignal(c);
  const intensity = getIntensitySignal(c);
  const features  = getFeaturesSignal(c);
  const useCase   = getUseCaseSignal(mktString);

  const dims = [frequency, intensity, features, useCase];
  const known = dims.filter(d => d.level != null);

  if (known.length < 2) {
    return {
      segment: 'sin-datos', label: '⬜ Sin datos suficientes', confidence: 'low',
      reasons: ['Información insuficiente para generar una evaluación confiable — faltan al menos 2 de las 4 dimensiones (frecuencia, intensidad, features, casos de uso).'],
      recommendations: [], frequency, intensity, features, useCase
    };
  }

  const avg = known.reduce((s, d) => s + scoreLevel(d.level), 0) / known.length;
  let segment, label;
  if (avg >= 1.5)      { segment = 'power'; label = '🔥 Power User'; }
  else if (avg >= 0.75) { segment = 'core';  label = '⭐ Core User'; }
  else                  { segment = 'casual'; label = '💤 Casual User'; }

  const reasons = [];
  if (frequency.level != null) reasons.push(`Frecuencia (${frequency.label}): ${frequency.detail}`);
  if (intensity.level != null) reasons.push(`Intensidad (${intensity.label}): ${intensity.detail}`);
  if (features.level  != null) reasons.push(`Features (${features.label}): ${features.detail}`);
  if (useCase.level    != null) reasons.push(`Casos de uso (${useCase.label}): ${useCase.detail}`);

  const recommendations = buildRecommendations({ frequency, intensity, features, useCase, segment });

  return {
    segment, label, confidence: known.length === 4 ? 'high' : 'medium',
    reasons, recommendations, frequency, intensity, features, useCase
  };
}

function engagementBadgeColor(segment) {
  return segment === 'power' ? 'var(--green)' : segment === 'core' ? 'var(--accent)' : segment === 'casual' ? 'var(--orange)' : 'var(--text3)';
}

export {
  ANYTOOLS_FEATURES, getEngagementProfile, engagementBadgeColor,
  getFrequencySignal, getIntensitySignal, getFeaturesSignal, getUseCaseSignal
};
