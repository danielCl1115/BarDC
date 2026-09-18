"use client";

import { useActionState } from "react";
import { abrirCuenta } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass } from "@/components/ui";
import type { ActionState } from "@/lib/action";

export function NuevaCuenta() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    abrirCuenta,
    null,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="w-full max-w-xs">
        <Field label="Nombre del cliente">
          <input
            name="nombre_cliente"
            placeholder="ej: Mesa 3"
            required
            className={inputClass}
          />
        </Field>
      </div>
      <SubmitButton pendingText="Abriendo..." icon="plus">
        Abrir cuenta
      </SubmitButton>
      {state?.error ? (
        <p className="w-full text-sm text-crit">{state.error}</p>
      ) : null}
    </form>
  );
}
