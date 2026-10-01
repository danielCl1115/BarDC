/**
 * Pesos colombianos se escriben con punto de miles (24.000) y sin decimales.
 * `Number("24.000")` los interpreta como 24 (punto decimal), por eso un campo
 * de dinero nunca puede usar coerción numérica directa sobre lo que escribió
 * el usuario: hay que quitar los puntos de miles primero.
 */
export function parsearPesos(valor: unknown): number {
  const texto = String(valor ?? "").trim();
  if (!texto) return 0;
  const limpio = texto.replace(/\./g, "").replace(",", ".");
  const n = Number(limpio);
  return Number.isFinite(n) ? n : NaN;
}
