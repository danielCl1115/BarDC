import { createClient } from "@/lib/supabase/server";
import { fmtDiaYMD, fmtMesAnio } from "@/lib/format";
import { sumarDias, diasEntre, inicioDiaUTC, ymdEnZona } from "@/lib/tz";
import type { Cuenta, MetodoPago } from "@/lib/types";

export type { Periodo } from "@/lib/periodos";
export { PERIODOS, FECHA_RE, MAX_DIAS_EXPORTAR, calcularRango } from "@/lib/periodos";

export type Bucket = "dia" | "mes" | "anio";

export function bucketAuto(desde: string, hasta: string): Bucket {
  const dias = diasEntre(desde, hasta);
  if (dias <= 62) return "dia";
  if (dias <= 731) return "mes";
  return "anio";
}

export function claveBucket(fechaISO: string, bucket: Bucket): string {
  const ymd = ymdEnZona(fechaISO);
  return bucket === "dia" ? ymd : bucket === "mes" ? ymd.slice(0, 7) : ymd.slice(0, 4);
}

export function etiquetaBucket(clave: string, bucket: Bucket): string {
  if (bucket === "dia") return fmtDiaYMD(clave);
  if (bucket === "mes") return fmtMesAnio(clave);
  return clave;
}

export type CuentaReporte = Pick<Cuenta, "nombre_cliente" | "metodo_pago" | "total" | "cerrada_en">;

export type FilaBucket = {
  clave: string;
  etiqueta: string;
  cuentas: number;
  efectivo: number;
  transferencia: number;
  mixto: number;
};

export async function cargarCuentasCerradas(desde: string, hasta: string): Promise<CuentaReporte[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cuentas")
    .select("nombre_cliente, metodo_pago, total, cerrada_en")
    .eq("estado", "cerrada")
    .gte("cerrada_en", inicioDiaUTC(desde).toISOString())
    .lt("cerrada_en", inicioDiaUTC(sumarDias(hasta, 1)).toISOString())
    .order("cerrada_en", { ascending: true })
    .limit(5000);
  return (data ?? []) as CuentaReporte[];
}

export function agregarReporte(cuentas: CuentaReporte[], bucket: Bucket) {
  const porMetodo: Record<MetodoPago, { cuentas: number; total: number }> = {
    efectivo: { cuentas: 0, total: 0 },
    transferencia: { cuentas: 0, total: 0 },
    mixto: { cuentas: 0, total: 0 },
  };
  const porBucket = new Map<string, FilaBucket>();

  for (const c of cuentas) {
    if (!c.metodo_pago || !c.cerrada_en) continue;
    porMetodo[c.metodo_pago].cuentas += 1;
    porMetodo[c.metodo_pago].total += Number(c.total);

    const clave = claveBucket(c.cerrada_en, bucket);
    const fila =
      porBucket.get(clave) ??
      { clave, etiqueta: etiquetaBucket(clave, bucket), cuentas: 0, efectivo: 0, transferencia: 0, mixto: 0 };
    fila.cuentas += 1;
    fila[c.metodo_pago] += Number(c.total);
    porBucket.set(clave, fila);
  }

  const filas = [...porBucket.values()].sort((a, b) => a.clave.localeCompare(b.clave));
  const totalPeriodo = porMetodo.efectivo.total + porMetodo.transferencia.total + porMetodo.mixto.total;
  return { porMetodo, filas, totalPeriodo };
}
