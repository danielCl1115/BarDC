import { TZ } from "./tz";

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// Estos formatean instantes reales (timestamptz) -> se anclan a la zona
// horaria del negocio, si no cada visitante los vería en la suya.
const fecha = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: TZ,
});
const soloFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: TZ });

// Estos formatean fechas "de calendario" (YYYY-MM[-DD], sin hora) -> se leen
// tal cual, ancladas en UTC para que no se corran de día según el reloj del
// servidor o del navegador.
const diaCorto = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", timeZone: "UTC" });
const mesAnio = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" });

/** Formatea un número como moneda. Cambia currency/locale en este archivo. */
export function fmtMoney(n: number | null | undefined): string {
  return money.format(Number(n ?? 0));
}

export function fmtFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  return fecha.format(new Date(iso));
}

export function fmtSoloFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  return soloFecha.format(new Date(iso));
}

/** Para una clave "YYYY-MM-DD" (no un timestamp): ej. "9 sept." */
export function fmtDiaYMD(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return diaCorto.format(new Date(Date.UTC(y, m - 1, d)));
}

/** Para una clave "YYYY-MM": ej. "septiembre 2026" */
export function fmtMesAnio(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return mesAnio.format(new Date(Date.UTC(y, m - 1, 1)));
}

/** Quita decimales innecesarios: 3.000 -> "3", 2.500 -> "2.5" */
export function fmtCantidad(n: number | null | undefined): string {
  return String(Number(n ?? 0));
}
