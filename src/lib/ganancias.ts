import { createClient } from "@/lib/supabase/server";
import { fmtDiaYMD, fmtMesAnio } from "@/lib/format";
import { calcularRango } from "@/lib/periodos";
import { diasEntre, primerDiaMes, sumarDias } from "@/lib/tz";

export type GBucket = "dia" | "semana" | "mes" | "anio";

export type GPeriodo =
  | "hoy"
  | "ayer"
  | "semana"
  | "semana_pasada"
  | "30d"
  | "mes"
  | "mes_pasado"
  | "anio"
  | "personalizado";

export const G_PERIODOS: { valor: GPeriodo; etiqueta: string }[] = [
  { valor: "hoy", etiqueta: "Hoy" },
  { valor: "ayer", etiqueta: "Ayer" },
  { valor: "semana", etiqueta: "Esta semana" },
  { valor: "semana_pasada", etiqueta: "Semana pasada" },
  { valor: "30d", etiqueta: "Últimos 30 días" },
  { valor: "mes", etiqueta: "Este mes" },
  { valor: "mes_pasado", etiqueta: "Mes pasado" },
  { valor: "anio", etiqueta: "Este año" },
  { valor: "personalizado", etiqueta: "Personalizado" },
];

export const G_BUCKETS: { valor: GBucket; etiqueta: string }[] = [
  { valor: "dia", etiqueta: "Día" },
  { valor: "semana", etiqueta: "Semana" },
  { valor: "mes", etiqueta: "Mes" },
  { valor: "anio", etiqueta: "Año" },
];

export function esGPeriodo(v: string | undefined): v is GPeriodo {
  return G_PERIODOS.some((p) => p.valor === v);
}

export function esGBucket(v: string | undefined): v is GBucket {
  return G_BUCKETS.some((b) => b.valor === v);
}

/** Lunes de la semana de esa fecha (YYYY-MM-DD). */
export function lunesDe(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = domingo
  return sumarDias(ymd, -((dow + 6) % 7));
}

function ultimoDiaMesAnterior(ymd: string): string {
  return sumarDias(primerDiaMes(ymd), -1);
}

export function calcularRangoG(
  periodo: GPeriodo,
  hoy: string,
  desdeParam?: string,
  hastaParam?: string,
): { desde: string; hasta: string } {
  switch (periodo) {
    case "ayer": {
      const ayer = sumarDias(hoy, -1);
      return { desde: ayer, hasta: ayer };
    }
    case "semana":
      return { desde: lunesDe(hoy), hasta: hoy };
    case "semana_pasada": {
      const lunes = sumarDias(lunesDe(hoy), -7);
      return { desde: lunes, hasta: sumarDias(lunes, 6) };
    }
    case "mes_pasado": {
      const hasta = ultimoDiaMesAnterior(hoy);
      return { desde: primerDiaMes(hasta), hasta };
    }
    case "personalizado":
      return calcularRango("personalizado", hoy, desdeParam, hastaParam);
    default:
      return calcularRango(periodo, hoy);
  }
}

/** Mismo largo que el periodo elegido, justo antes. Para comparar ("vs anterior"). */
export function rangoAnterior(desde: string, hasta: string): { desde: string; hasta: string } {
  const dias = diasEntre(desde, hasta);
  return { desde: sumarDias(desde, -dias), hasta: sumarDias(desde, -1) };
}

/** Agrupación sugerida según el largo del rango. */
export function bucketAutoG(desde: string, hasta: string): GBucket {
  const dias = diasEntre(desde, hasta);
  if (dias <= 31) return "dia";
  if (dias <= 120) return "semana";
  if (dias <= 731) return "mes";
  return "anio";
}

/** true si es una fecha real YYYY-MM-DD (no "2026-13-45"). */
export function fechaValida(ymd: string | undefined): ymd is string {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return y >= 2000 && dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const MAX_PUNTOS = 400;

function puntosEstimados(dias: number, bucket: GBucket): number {
  if (bucket === "dia") return dias;
  if (bucket === "semana") return Math.ceil(dias / 7) + 1;
  if (bucket === "mes") return Math.ceil(dias / 28) + 1;
  return Math.ceil(dias / 365) + 1;
}

/** Sube la agrupación (día -> semana -> mes -> año) si el rango daría demasiados puntos. */
export function bucketSeguro(desde: string, hasta: string, bucket: GBucket): GBucket {
  const dias = diasEntre(desde, hasta);
  const orden: GBucket[] = ["dia", "semana", "mes", "anio"];
  let i = orden.indexOf(bucket);
  while (i < orden.length - 1 && puntosEstimados(dias, orden[i]) > MAX_PUNTOS) i += 1;
  return orden[i];
}

// ----------------------------------------------------------------------------
// Datos
// ----------------------------------------------------------------------------

export type FilaPeriodoDB = { clave: string; n_cuentas: number; ventas: number; costo: number };
export type FilaProductoDB = {
  producto_id: string;
  nombre: string;
  cantidad: number;
  ventas: number;
  costo: number;
};

export type Totales = { cuentas: number; ventas: number; costo: number; ganancia: number; margen: number };

export type PuntoSerie = {
  clave: string;
  etiqueta: string; // corta, para el eje
  rango: string; // larga, para el tooltip y la tabla
  cuentas: number;
  ventas: number;
  costo: number;
  ganancia: number;
  margen: number | null; // % ; null si no hubo ventas
};

const num = (v: unknown) => Number(v ?? 0);

export function margenPct(ventas: number, ganancia: number): number {
  return ventas > 0 ? (ganancia / ventas) * 100 : 0;
}

export function sumarTotales(filas: { n_cuentas: number; ventas: number; costo: number }[]): Totales {
  let cuentas = 0;
  let ventas = 0;
  let costo = 0;
  for (const f of filas) {
    cuentas += num(f.n_cuentas);
    ventas += num(f.ventas);
    costo += num(f.costo);
  }
  const ganancia = ventas - costo;
  return { cuentas, ventas, costo, ganancia, margen: margenPct(ventas, ganancia) };
}

/** Variación porcentual vs el periodo anterior; null si no hay base para comparar. */
export function variacionPct(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual === 0 ? 0 : null;
  return ((actual - anterior) / Math.abs(anterior)) * 100;
}

export async function cargarPorPeriodo(desde: string, hasta: string, bucket: GBucket): Promise<FilaPeriodoDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ganancias_por_periodo", {
    p_desde: desde,
    p_hasta: hasta,
    p_bucket: bucket,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as FilaPeriodoDB[]).map((f) => ({
    clave: f.clave,
    n_cuentas: num(f.n_cuentas),
    ventas: num(f.ventas),
    costo: num(f.costo),
  }));
}

export async function cargarPorProducto(desde: string, hasta: string): Promise<FilaProductoDB[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ganancias_por_producto", { p_desde: desde, p_hasta: hasta });
  if (error) throw new Error(error.message);
  return ((data ?? []) as FilaProductoDB[]).map((f) => ({
    producto_id: f.producto_id,
    nombre: f.nombre,
    cantidad: num(f.cantidad),
    ventas: num(f.ventas),
    costo: num(f.costo),
  }));
}

export type ResumenStock = { productos: number; valorCosto: number; valorVenta: number; gananciaEsperada: number };

export async function cargarStock(): Promise<ResumenStock> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("ganancias_stock");
  if (error) throw new Error(error.message);
  const f = ((data ?? []) as { productos: number; valor_costo: number; valor_venta: number }[])[0];
  const valorCosto = num(f?.valor_costo);
  const valorVenta = num(f?.valor_venta);
  return { productos: num(f?.productos), valorCosto, valorVenta, gananciaEsperada: valorVenta - valorCosto };
}

// ----------------------------------------------------------------------------
// Serie continua (rellena con ceros los periodos sin ventas, para que la
// gráfica no "salte" fechas)
// ----------------------------------------------------------------------------

function etiquetas(clave: string, bucket: GBucket, conAnio: boolean): { etiqueta: string; rango: string } {
  const anio = (ymd: string) => (conAnio ? ` ${ymd.slice(0, 4)}` : "");
  if (bucket === "dia") {
    return { etiqueta: fmtDiaYMD(clave), rango: `${fmtDiaYMD(clave)}${anio(clave)}` };
  }
  if (bucket === "semana") {
    const fin = sumarDias(clave, 6);
    return { etiqueta: fmtDiaYMD(clave), rango: `${fmtDiaYMD(clave)} – ${fmtDiaYMD(fin)}${anio(fin)}` };
  }
  if (bucket === "mes") {
    const e = fmtMesAnio(clave);
    return { etiqueta: e, rango: e };
  }
  return { etiqueta: clave, rango: clave };
}

function clavesDelRango(desde: string, hasta: string, bucket: GBucket): string[] {
  const claves: string[] = [];
  if (bucket === "dia") {
    for (let d = desde; d <= hasta; d = sumarDias(d, 1)) claves.push(d);
  } else if (bucket === "semana") {
    for (let d = lunesDe(desde); d <= hasta; d = sumarDias(d, 7)) claves.push(d);
  } else if (bucket === "mes") {
    let [y, m] = desde.split("-").map(Number);
    const [yf, mf] = hasta.split("-").map(Number);
    while (y < yf || (y === yf && m <= mf)) {
      claves.push(`${y}-${String(m).padStart(2, "0")}`);
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
  } else {
    for (let y = Number(desde.slice(0, 4)); y <= Number(hasta.slice(0, 4)); y++) claves.push(String(y));
  }
  return claves;
}

export function armarSerie(
  filas: FilaPeriodoDB[],
  desde: string,
  hasta: string,
  bucket: GBucket,
  conAnio = false,
): PuntoSerie[] {
  const porClave = new Map(filas.map((f) => [f.clave, f]));
  return clavesDelRango(desde, hasta, bucket).map((clave) => {
    const f = porClave.get(clave);
    const ventas = f?.ventas ?? 0;
    const costo = f?.costo ?? 0;
    const ganancia = ventas - costo;
    return {
      clave,
      ...etiquetas(clave, bucket, conAnio),
      cuentas: f?.n_cuentas ?? 0,
      ventas,
      costo,
      ganancia,
      margen: ventas > 0 ? margenPct(ventas, ganancia) : null,
    };
  });
}
