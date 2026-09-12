"use client";

import { useFormStatus } from "react-dom";

/**
 * Interruptor on/off que envía el <form> que lo contiene al hacer clic.
 * Reemplaza los links de texto "Activar"/"Desactivar" por algo que se lee
 * de un vistazo (verde = activo) y nunca depende solo del color: siempre
 * va con la etiqueta al lado.
 */
export function ToggleSwitch({
  checked,
  label,
}: {
  checked: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      title={label}
      aria-pressed={checked}
      disabled={pending}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-good" : "bg-ink/20"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
