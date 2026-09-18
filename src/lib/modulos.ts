import { cache } from "react";
import { redirect } from "next/navigation";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TODOS_LOS_MODULOS, type ModuloId } from "@/lib/modulos-catalogo";

export { MODULOS_OPCIONALES, TODOS_LOS_MODULOS } from "@/lib/modulos-catalogo";
export type { ModuloId } from "@/lib/modulos-catalogo";

/**
 * Perfil + datos del bar actual, cacheados por petición: el layout y cada
 * página gateada comparten esta misma consulta en vez de repetirla.
 */
export const getBarActual = cache(async () => {
  const perfil = await requirePerfil();
  const supabase = await createClient();
  const { data: bar } = await supabase
    .from("bares")
    .select("nombre, activo, modulos")
    .eq("id", perfil.bar_id)
    .single();

  if (bar && !bar.activo) {
    await supabase.auth.signOut();
    redirect("/login?bar_inactivo=1");
  }

  const modulos = (bar?.modulos as ModuloId[] | null) ?? TODOS_LOS_MODULOS;
  return { perfil, barNombre: bar?.nombre ?? "Stockeo", modulos };
});

/** Exige que el bar tenga contratado este módulo. Si no, lo manda a Inicio. */
export async function requireModulo(modulo: ModuloId) {
  const { perfil, modulos } = await getBarActual();
  if (!modulos.includes(modulo)) {
    redirect("/dashboard");
  }
  return perfil;
}
