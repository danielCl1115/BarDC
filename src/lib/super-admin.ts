import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL ?? "").trim().toLowerCase();

export const isSuperAdminConfigured = SUPER_ADMIN_EMAIL.length > 0;

/** ¿Este correo es el del dueño de la plataforma? */
export function esSuperAdmin(email: string | null | undefined): boolean {
  if (!isSuperAdminConfigured || !email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

/** Exige que el usuario logueado sea el super-usuario. Si no, lo manda a /login. */
export async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!esSuperAdmin(user?.email)) {
    redirect("/login");
  }
  return user;
}
