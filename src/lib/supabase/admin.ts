import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const isAdminClientConfigured =
  SUPABASE_URL.length > 0 && SERVICE_ROLE_KEY.length > 0;

/**
 * Cliente con permisos totales (service_role). SOLO servidor.
 * Se usa para crear usuarios desde la pantalla de Usuarios.
 * Nunca lo importes en un componente "use client".
 */
export function createAdminClient() {
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
