/**
 * Fechas con reconocimiento de zona horaria, sin librerías externas.
 * Cambia TZ si tu negocio está en otro país (la usan Reportes e Inicio).
 */
export const TZ = "America/Bogota";

const fmtYMD = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }); // "YYYY-MM-DD"

/** Hoy, como fecha local del negocio (no UTC). */
export function hoyYMD(): string {
  return fmtYMD.format(new Date());
}

/** La fecha (YYYY-MM-DD, hora local) de un instante UTC cualquiera. */
export function ymdEnZona(fechaISO: string): string {
  return fmtYMD.format(new Date(fechaISO));
}

function offsetMinutos(aproxUTC: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const { type, value } of dtf.formatToParts(aproxUTC)) p[type] = value;
  const hora = p.hour === "24" ? 0 : Number(p.hour);
  const comoSiFueraUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    hora,
    Number(p.minute),
    Number(p.second),
  );
  return (comoSiFueraUTC - aproxUTC.getTime()) / 60000;
}

/** El instante UTC exacto de la medianoche local (TZ) de esa fecha. */
export function inicioDiaUTC(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const aprox = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  return new Date(aprox.getTime() - offsetMinutos(aprox) * 60000);
}

export function sumarDias(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function primerDiaMes(ymd: string): string {
  const [y, m] = ymd.split("-");
  return `${y}-${m}-01`;
}

export function primerDiaAnio(ymd: string): string {
  return `${ymd.slice(0, 4)}-01-01`;
}

export function diasEntre(desde: string, hasta: string): number {
  const diff = inicioDiaUTC(hasta).getTime() - inicioDiaUTC(desde).getTime();
  return Math.round(diff / 86_400_000) + 1;
}
