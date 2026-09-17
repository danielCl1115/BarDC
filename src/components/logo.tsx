/**
 * Marca de Stockeo: capas apiladas (el "stock") dentro de un chip redondeado,
 * en degradado cian -> violeta. Sin filtros/blur: debe verse igual en el
 * favicon estático, el ícono de iOS (renderizado con Satori) y en pantalla.
 */
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="stockeoGrad" x1="0" y1="0" x2="100" y2="100">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      <rect x="8" y="8" width="84" height="84" rx="20" fill="#0a0f1c" />
      <rect
        x="8"
        y="8"
        width="84"
        height="84"
        rx="20"
        fill="none"
        stroke="url(#stockeoGrad)"
        strokeWidth="2.5"
      />

      <rect x="37" y="30" width="26" height="9" rx="4.5" fill="url(#stockeoGrad)" />
      <rect x="29" y="45" width="42" height="9" rx="4.5" fill="url(#stockeoGrad)" opacity="0.82" />
      <rect x="21" y="60" width="58" height="9" rx="4.5" fill="url(#stockeoGrad)" opacity="0.62" />
    </svg>
  );
}
