import { cache } from "react";
import { redirect } from "next/navigation";
import { requireSesion } from "@/lib/auth";
import { TODOS_LOS_MODULOS, type ModuloId } from "@/lib/modulos-catalogo";

export { MODULOS_OPCIONALES, TODOS_LOS_MODULOS } from "@/lib/modulos-catalogo";
export type { ModuloId } from "@/lib/modulos-catalogo";

/**
 * Perfil + datos del bar actual, cacheados por petición: el layout y cada
 * página gateada comparten esta misma consulta en vez de repetirla.
 */
export const getBarActual = cache(async () => {
  const { perfil, bar } = await requireSesion();

  // /salir cierra la sesión de verdad (aquí no se pueden borrar cookies)
  if (bar && !bar.activo) redirect("/salir?m=bar_inactivo");

  const modulos = bar?.modulos ?? TODOS_LOS_MODULOS;
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
