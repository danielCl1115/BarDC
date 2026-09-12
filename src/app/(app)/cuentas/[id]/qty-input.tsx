"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { actualizarCantidad } from "../actions";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/toast";
import type { ActionState } from "@/lib/action";

/**
 * Cantidad editable de un renglón del ticket. Escribe el número que
 * necesites (ej: 30) y confirma con el botón ✓ o presionando Enter.
 * Si algo falla (ej: falta correr una migración de base de datos),
 * el error se ve aquí mismo en vez de "no pasar nada".
 */
export function QtyInput({
  cuentaId,
  itemId,
  cantidad,
}: {
  cuentaId: string;
  itemId: string;
  cantidad: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<ActionState, FormData>(
    actualizarCantidad,
    null,
  );
  const { mostrarToast } = useToast();

  useEffect(() => {
    if (state?.ok) mostrarToast("Cantidad actualizada");
  }, [state, mostrarToast]);

  return (
    <div>
      <form ref={formRef} action={formAction} className="flex items-center gap-1">
        <input type="hidden" name="item_id" value={itemId} />
        <input type="hidden" name="cuenta_id" value={cuentaId} />
        <input
          name="cantidad"
          type="number"
          min="0"
          step="1"
          defaultValue={cantidad}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          className="w-12 rounded-md border border-ink/15 bg-surface py-0.5 text-center text-xs tabular-nums text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
        <ConfirmButton />
      </form>
      {state?.error ? (
        <p className="mt-1 max-w-[10rem] text-[11px] leading-tight text-crit">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      title="Confirmar cantidad"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-500 text-white transition-opacity hover:bg-brand-600 disabled:opacity-50"
    >
      <Icon name="check" size={12} />
    </button>
  );
}
