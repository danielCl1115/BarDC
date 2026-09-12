/**
 * Color decorativo por producto (no codifica datos, solo ayuda a
 * reconocer productos de un vistazo en la grilla, como en una caja física).
 * Determinístico: el mismo producto siempre sale del mismo color.
 */
const PALETTE = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", active: "bg-blue-600" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", active: "bg-orange-600" },
  { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800", active: "bg-teal-600" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", active: "bg-amber-600" },
  { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-800", active: "bg-pink-600" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", active: "bg-emerald-600" },
  { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-800", active: "bg-violet-600" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-800", active: "bg-rose-600" },
] as const;

export function tileColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
