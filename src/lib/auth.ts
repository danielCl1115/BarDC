import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ModuloId } from "@/lib/modulos-catalogo";
import type { Perfil } from "@/lib/types";

export type DatosBar = { nombre: string; activo: boolean; modulos: ModuloId[] | null };

/**
 * Sesión de la petición: quién es el usuario, su perfil y los datos de su
 * negocio, en UNA sola consulta a la base.
 *
 * - La sesión se verifica en el servidor con la llave pública del proyecto
 *   (`getClaims`), sin viajar a Supabase Auth. Es el patrón que recomienda
 *   Supabase y ahorra un viaje por cada petición. El estado del usuario
 *   (`profiles.activo`) y el del negocio (`bares.activo`) siguen
 *   consultándose en cada petición.
 * - `cache()` la comparte entre el layout, la página y la acción del servidor
 *   dentro de la misma petición, en vez de repetirla.
 */
const cargarSesion = cache(async (): Promise<{ perfil: Perfil; bar: DatosBar | null } | null> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*, bares(nombre, activo, modulos)")
    .eq("id", userId)
    .single();
  if (!data) return null;

  const { bares, ...perfil } = data as Perfil & { bares: DatosBar | DatosBar[] | null };
  const bar = Array.isArray(bares) ? (bares[0] ?? null) : bares;
  return { perfil: perfil as Perfil, bar };
});

/** Devuelve el perfil del usuario logueado, o null si no hay sesión. */
export async function getPerfil(): Promise<Perfil | null> {
  return (await cargarSesion())?.perfil ?? null;
}

/** Exige sesión (con su negocio). Si no hay, manda a /login. */
export async function requireSesion(): Promise<{ perfil: Perfil; bar: DatosBar | null }> {
  const sesion = await cargarSesion();
  if (!sesion) redirect("/login");
  if (!sesion.perfil.activo) redirect("/salir?m=inactivo");
  return sesion;
}

/** Exige sesión. Si no hay, manda a /login. */
export async function requirePerfil(): Promise<Perfil> {
  return (await requireSesion()).perfil;
}

/** Exige rol admin. Si no lo es, manda al dashboard. */
export async function requireAdmin(): Promise<Perfil> {
  const perfil = await requirePerfil();
  if (perfil.rol !== "admin") redirect("/dashboard");
  return perfil;
}
