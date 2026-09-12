import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/icons";

/** Encabezado de página con título y acciones opcionales a la derecha. */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink/8 pb-5">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-ink-2">{description}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex flex-wrap gap-2">{children}</div>
      ) : null}
    </div>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-ink/8 bg-surface p-6 shadow-[0_1px_2px_rgba(11,11,11,0.04)] ${className}`}
    >
      {title ? (
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-ink-3">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Clases de los 3 estilos de botón, compartidas entre <Button> (link) y <SubmitButton>. */
export const buttonVariants: Record<"primary" | "secondary" | "danger", string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600",
  secondary: "border border-ink/15 bg-surface text-ink-2 hover:bg-plane",
  danger: "bg-crit text-white hover:bg-[#b83232]",
};

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60";

/** Botón de navegación (no envía formulario). Mismo look que SubmitButton. */
export function Button({
  href,
  children,
  variant = "primary",
  icon,
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  icon?: IconName;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`${buttonBase} ${buttonVariants[variant]} ${className}`}
    >
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </Link>
  );
}

const STAT_TONES: Record<string, string> = {
  brand: "bg-brand-50 text-brand-600",
  good: "bg-good/10 text-good",
  warn: "bg-warn/15 text-[#8a5a06]",
};

const STAT_DEFAULT_ICON: Record<string, IconName> = {
  brand: "trend",
  good: "check",
  warn: "alert",
};

/** Tarjeta KPI: etiqueta + valor grande + icono. */
export function StatTile({
  label,
  value,
  hint,
  tone = "brand",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "brand" | "good" | "warn";
  icon?: IconName;
}) {
  return (
    <div className="rounded-xl border border-ink/8 bg-surface p-5 shadow-[0_1px_2px_rgba(11,11,11,0.04)]">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-2">{label}</span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${STAT_TONES[tone]}`}
        >
          <Icon name={icon ?? STAT_DEFAULT_ICON[tone]} size={16} />
        </span>
      </div>
      <div className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-ink">
        {value}
      </div>
      {hint ? <div className="mt-2 text-xs text-ink-3">{hint}</div> : null}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium text-ink-2">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ink-3">{hint}</span> : null}
    </label>
  );
}

/**
 * Modal centrado sobre <dialog> nativo: sin librerías, con backdrop y foco
 * atrapado gratis. `open` lo controla el padre con un ref a <dialog>.
 */
export function Modal({
  dialogRef,
  title,
  onClose,
  children,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      onClose={onClose}
      className="m-auto w-full max-w-md rounded-xl border border-ink/10 bg-surface p-0 text-ink shadow-2xl backdrop:bg-ink/40 [&::backdrop]:backdrop-blur-[1px]"
    >
      <div className="flex items-center justify-between border-b border-ink/8 px-5 py-4">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          title="Cerrar"
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 hover:bg-plane hover:text-ink"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}

export const inputClass =
  "w-full rounded-md border border-ink/15 bg-surface px-3 py-2 text-sm text-ink outline-none transition-shadow focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-ink/15 bg-plane px-4 py-8 text-center text-sm text-ink-3">
      {children}
    </p>
  );
}

const BADGE_TONES: Record<string, string> = {
  neutral: "bg-ink/6 text-ink-2",
  good: "bg-good/10 text-[#0a7d0a]",
  warn: "bg-warn/20 text-[#8a5a06]",
  crit: "bg-crit/10 text-crit",
  brand: "bg-brand-50 text-brand-600",
};

const BADGE_DOT: Record<string, string> = {
  neutral: "bg-ink-3",
  good: "bg-good",
  warn: "bg-warn",
  crit: "bg-crit",
  brand: "bg-brand-500",
};

/** Etiqueta de estado. Nunca depende solo del color: siempre lleva texto. */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "crit" | "brand";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_TONES[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${BADGE_DOT[tone]}`} />
      {children}
    </span>
  );
}
