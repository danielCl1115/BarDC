import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types";

/** Devuelve el perfil del usuario logueado, o null si no hay sesión. */
export async function getPerfil(): Promise<Perfil | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Perfil | null) ?? null;
}

/** Exige sesión. Si no hay, manda a /login. */
export async function requirePerfil(): Promise<Perfil> {
  const perfil = await getPerfil();
  if (!perfil) redirect("/login");
  if (!perfil.activo) redirect("/login?inactivo=1");
  return perfil;
}

/** Exige rol admin. Si no lo es, manda al dashboard. */
export async function requireAdmin(): Promise<Perfil> {
  const perfil = await requirePerfil();
  if (perfil.rol !== "admin") redirect("/dashboard");
  return perfil;
}
