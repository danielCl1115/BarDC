"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonVariants } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";

/** Botón de envío que se deshabilita y muestra "..." mientras corre la acción. */
export function SubmitButton({
  children,
  pendingText = "Guardando...",
  variant = "primary",
  icon,
  className = "",
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger";
  icon?: IconName;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${buttonVariants[variant]} ${className}`}
    >
      {!pending && icon ? <Icon name={icon} size={16} /> : null}
      {pending ? pendingText : children}
    </button>
  );
}
