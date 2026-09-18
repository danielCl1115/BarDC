/**
 * Medidor de stock con forma de vaso: se "llena" según qué tan lejos está el
 * stock de su mínimo. Firma visual propia del rubro (bares), no un genérico
 * ícono de inventario. 3× el mínimo = vaso lleno.
 */
export function StockGlass({
  stock,
  minimo,
  size = 22,
}: {
  stock: number;
  minimo: number;
  size?: number;
}) {
  const tope = Math.max(minimo * 3, minimo + 1, 1);
  const ratio = Math.max(0, Math.min(1, stock / tope));

  const glassTop = 4;
  const glassBottom = 30;
  const altura = glassBottom - glassTop;
  const liquidoY = glassBottom - ratio * altura;

  const color = stock <= 0 ? "#be123c" : stock <= minimo ? "#b45309" : "#0891b2";
  const id = `glass-${stock}-${minimo}-${size}`;
  const clipId = `${id}-clip`;

  return (
    <svg width={size} height={(size * 34) / 24} viewBox="0 0 24 34" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path d="M4 4 L20 4 L17 29.5 Q17 31 15.3 31 L8.7 31 Q7 31 7 29.5 Z" />
        </clipPath>
      </defs>

      {ratio > 0 ? (
        <g clipPath={`url(#${clipId})`}>
          <rect x="4" y={liquidoY} width="16" height={glassBottom - liquidoY + 2} fill={color} opacity="0.85" />
          {ratio < 1 ? <rect x="4" y={liquidoY} width="16" height="1.6" fill={color} opacity="0.4" /> : null}
        </g>
      ) : null}

      <path
        d="M4 4 L20 4 L17 29.5 Q17 31 15.3 31 L8.7 31 Q7 31 7 29.5 Z"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <line x1="3" y1="4" x2="21" y2="4" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
