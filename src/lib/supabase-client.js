// ── SUPABASE INTEGRATION ──────────────────────────────────────────────────────
const SB_URL = 'https://bgdwibspgdqsapidcaiu.supabase.co';
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
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

export function getSbClient() { return sbClient; }
