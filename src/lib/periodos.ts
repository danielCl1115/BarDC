import { sumarDias, primerDiaMes, primerDiaAnio } from "@/lib/tz";

/** Rango de fechas reutilizable en cualquier pantalla con filtro de periodo. */
export type Periodo = "hoy" | "7d" | "30d" | "mes" | "anio" | "personalizado";

export const PERIODOS: { valor: Periodo; etiqueta: string }[] = [
  { valor: "hoy", etiqueta: "Hoy" },
  { valor: "7d", etiqueta: "Últimos 7 días" },
  { valor: "30d", etiqueta: "Últimos 30 días" },
  { valor: "mes", etiqueta: "Este mes" },
  { valor: "anio", etiqueta: "Este año" },
  { valor: "personalizado", etiqueta: "Personalizado" },
];

export const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Máximo de días que se puede exportar de una vez, para no generar archivos gigantes. */
export const MAX_DIAS_EXPORTAR = 31;

export function calcularRango(periodo: Periodo, hoy: string, desdeParam?: string, hastaParam?: string) {
  switch (periodo) {
    case "hoy":
      return { desde: hoy, hasta: hoy };
    case "7d":
      return { desde: sumarDias(hoy, -6), hasta: hoy };
    case "mes":
      return { desde: primerDiaMes(hoy), hasta: hoy };
    case "anio":
      return { desde: primerDiaAnio(hoy), hasta: hoy };
    case "personalizado": {
      let desde = desdeParam && FECHA_RE.test(desdeParam) ? desdeParam : sumarDias(hoy, -29);
      let hasta = hastaParam && FECHA_RE.test(hastaParam) ? hastaParam : hoy;
      if (desde > hasta) [desde, hasta] = [hasta, desde]; // por si acaso el usuario las invierte
      return { desde, hasta };
    }
    case "30d":
    default:
      return { desde: sumarDias(hoy, -29), hasta: hoy };
  }
}
