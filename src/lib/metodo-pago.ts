import type { MetodoPago } from "@/lib/types";

/** Un color de estado distinto por forma de pago, para reconocerlas de un vistazo. */
export function metodoTone(m: MetodoPago | null): "good" | "brand" | "warn" | "neutral" {
  if (m === "efectivo") return "good";
  if (m === "transferencia") return "brand";
  if (m === "mixto") return "warn";
  return "neutral";
}

export function metodoLabel(m: MetodoPago | null): string {
  if (!m) return "—";
  return m.charAt(0).toUpperCase() + m.slice(1);
}
