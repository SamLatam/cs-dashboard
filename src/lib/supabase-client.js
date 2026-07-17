// ── SUPABASE INTEGRATION ──────────────────────────────────────────────────────
// Mechanically extracted from index.html (verbatim behavior).
//
// DEVIATION FROM SOURCE (explicitly requested by task): the anon key was a
// hardcoded literal in index.html (`const SB_KEY = 'eyJ...'`). It is now read
// from `import.meta.env.VITE_SUPABASE_ANON_KEY` (Vite env var), backed by
// `.env` (real value, gitignored) and `.env.example` (placeholder) at the
// project root. SB_URL is not a secret and stays a literal, as in source.

export const SB_URL = 'https://bgdwibspgdqsapidcaiu.supabase.co';
export const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let sbClient = null;

export function initSupabaseClient() {
  try {
    // flowType implicit = magic link llega con hash #access_token (más confiable para SPAs)
    sbClient = window.supabase.createClient(SB_URL, SB_KEY, {
      auth: { flowType: 'implicit', detectSessionInUrl: true }
    });
  } catch(e) {
    console.warn('Supabase SDK no disponible — modo offline:', e);
  }
}

export function getSbClient() {
  return sbClient;
}
