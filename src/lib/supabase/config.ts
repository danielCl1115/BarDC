/**
 * Lee la configuración de Supabase desde las variables de entorno.
 * `isConfigured` es false cuando faltan valores: la app entonces muestra
 * una pantalla de ayuda en vez de romperse.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
