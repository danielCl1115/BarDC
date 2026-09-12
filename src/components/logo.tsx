/** Marca "La Esquina": rana + jarra de cerveza dentro de un aro. Sin texto — para la barra lateral y el favicon (a tamaños chicos el texto curvo no se lee). */
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill="#1f5c37" />
      <circle cx="50" cy="50" r="41" fill="#f7f0dc" stroke="#16321f" strokeWidth="1" />
      <FrogAndMug />
    </svg>
  );
}

/** Insignia completa con el texto curvo "LA ESQUINA" / "BAR DE BARRIO" — para el login. */
export function LogoBadge({ size = 140, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <path id="arcoArriba" d="M 12,50 A 38,38 0 0 1 88,50" />
        <path id="arcoAbajo" d="M 12,50 A 38,38 0 0 0 88,50" />
      </defs>

      <circle cx="50" cy="50" r="48" fill="#1f5c37" />
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="#f7f0dc"
        strokeOpacity="0.35"
        strokeWidth="2"
        strokeDasharray="1.2 5.6"
        transform="rotate(4 50 50)"
      />
      <circle cx="50" cy="50" r="39" fill="#f7f0dc" stroke="#16321f" strokeWidth="1" />

      <text fill="#16321f" fontSize="8.5" fontWeight="700" letterSpacing="1.5">
        <textPath href="#arcoArriba" startOffset="50%" textAnchor="middle">
          LA ESQUINA
        </textPath>
      </text>
      <text fill="#16321f" fontSize="7" fontWeight="700" letterSpacing="1.5">
        <textPath href="#arcoAbajo" startOffset="50%" textAnchor="middle">
          BAR DE BARRIO
        </textPath>
      </text>

      <g transform="translate(0 -3)">
        <FrogAndMug />
      </g>
      <path d="M20 50l2.6 2.6L20 55.2l-2.6-2.6Z" fill="#e8ac2e" />
      <path d="M80 50l2.6 2.6-2.6 2.6-2.6-2.6Z" fill="#e8ac2e" />
    </svg>
  );
}

function FrogAndMug() {
  return (
    <g>
      {/* jarra */}
      <g transform="translate(58 40)">
        <path d="M0 8 Q9 -2 18 8 Z" fill="#f7f0dc" stroke="#16321f" strokeWidth="1.4" strokeLinejoin="round" />
        <rect x="0" y="7" width="18" height="21" rx="1.5" fill="#e8ac2e" stroke="#16321f" strokeWidth="1.4" />
        <path d="M18 12h4a3.6 3.6 0 0 1 0 11h-4" fill="none" stroke="#16321f" strokeWidth="1.4" />
        <circle cx="21.5" cy="4" r="1.2" fill="#f7f0dc" stroke="#16321f" strokeWidth="1" />
        <circle cx="24.5" cy="1.5" r="0.8" fill="#f7f0dc" stroke="#16321f" strokeWidth="1" />
      </g>
      {/* rana */}
      <g transform="translate(24 34)">
        <ellipse cx="10" cy="22" rx="11" ry="9.5" fill="#4caf6e" stroke="#16321f" strokeWidth="1.2" />
        <ellipse cx="10" cy="25" rx="6" ry="5" fill="#f7f0dc" />
        <circle cx="4.5" cy="8" r="6" fill="#4caf6e" stroke="#16321f" strokeWidth="1.2" />
        <circle cx="16" cy="8" r="6" fill="#4caf6e" stroke="#16321f" strokeWidth="1.2" />
        <circle cx="4.5" cy="8" r="2.8" fill="#16321f" />
        <circle cx="16" cy="8" r="2.8" fill="#16321f" />
        <circle cx="3.5" cy="6.8" r="0.9" fill="#f7f0dc" />
        <circle cx="15" cy="6.8" r="0.9" fill="#f7f0dc" />
        <ellipse cx="10" cy="15.5" rx="5" ry="2.4" fill="#8a3131" />
      </g>
    </g>
  );
}
