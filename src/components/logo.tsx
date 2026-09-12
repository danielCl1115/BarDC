const INK = "#1c3829";
const CREAM = "#f4ecd8";
const GOLD = "#a97b2f";

/** Marca "La Esquina": jarra de cerveza dentro de un sello circular. Sin texto — para la barra lateral y el favicon. */
export function LogoMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="48" fill={INK} />
      <circle cx="50" cy="50" r="48" fill="none" stroke={GOLD} strokeWidth="1" />
      <circle cx="50" cy="50" r="40" fill={CREAM} stroke={INK} strokeWidth="1.5" />
      <MugEmblem />
    </svg>
  );
}

/** Insignia completa con el texto curvo "LA ESQUINA" / "BAR DE BARRIO" — para el login. */
export function LogoBadge({ size = 140, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <path id="arcoArriba" d="M 14,50 A 36,36 0 0 1 86,50" />
        <path id="arcoAbajo" d="M 14,50 A 36,36 0 0 0 86,50" />
      </defs>

      <circle cx="50" cy="50" r="48" fill={INK} />
      <circle cx="50" cy="50" r="48" fill="none" stroke={GOLD} strokeWidth="1" />
      <circle cx="50" cy="50" r="45" fill={CREAM} stroke={INK} strokeWidth="1.2" />
      <circle cx="50" cy="50" r="43.3" fill="none" stroke={GOLD} strokeWidth="0.6" />

      <text fill={INK} fontSize="7" fontWeight="700" letterSpacing="1.6">
        <textPath href="#arcoArriba" startOffset="50%" textAnchor="middle">
          LA ESQUINA
        </textPath>
      </text>
      <text fill={INK} fontSize="5.6" fontWeight="700" letterSpacing="1.4">
        <textPath href="#arcoAbajo" startOffset="50%" textAnchor="middle">
          BAR DE BARRIO
        </textPath>
      </text>

      <MugEmblem />
      <path d="M13 50l2.4 2.4L13 54.8l-2.4-2.4Z" fill={GOLD} />
      <path d="M87 50l2.4 2.4-2.4 2.4-2.4-2.4Z" fill={GOLD} />
    </svg>
  );
}

/** Jarra de cerveza, silueta de dos tonos: sencilla y sobria, sin personajes. */
function MugEmblem() {
  return (
    <g transform="translate(50 55)">
      <path
        d="M-15,-19 L15,-19 L12.5,17 a3,3 0 0 1 -3,2.6 L-9.5,19.6 a3,3 0 0 1 -3,-2.6 Z"
        fill={INK}
      />
      <path d="M-13.6,-19 L13.6,-19 L12.7,-9.5 L-12.7,-9.5 Z" fill={CREAM} />
      <path
        d="M15,-11 h5.5 a6.2,6.2 0 0 1 0,16 h-4.6"
        fill="none"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );
}
