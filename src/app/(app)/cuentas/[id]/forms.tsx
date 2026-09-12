"use client";

import { useActionState, useState } from "react";
import { cerrarCuenta } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass } from "@/components/ui";
import { fmtMoney } from "@/lib/format";
import type { ActionState } from "@/lib/action";
import type { MetodoPago } from "@/lib/types";

export function CerrarCuenta({
  cuentaId,
  total,
}: {
  cuentaId: string;
  total: number;
}) {
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [efectivo, setEfectivo] = useState<number>(0);
  const [state, formAction] = useActionState<ActionState, FormData>(
    cerrarCuenta,
    null,
  );

  const transferencia = Math.max(0, total - efectivo);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="cuenta_id" value={cuentaId} />

      <div className="flex flex-wrap gap-2">
        {(["efectivo", "transferencia", "mixto"] as MetodoPago[]).map((m) => (
          <label
            key={m}
            className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-colors ${
              metodo === m
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-ink/15 bg-surface text-ink-2 hover:bg-plane"
            }`}
          >
            <input
              type="radio"
              name="metodo"
              value={m}
              checked={metodo === m}
              onChange={() => setMetodo(m)}
              className="sr-only"
            />
            {m}
          </label>
        ))}
      </div>

      {metodo === "mixto" ? (
        <div className="flex flex-wrap gap-3">
          <Field label="Efectivo" hint={`Transferencia: ${fmtMoney(transferencia)}`}>
            <input
              name="efectivo"
              type="number"
              min="0"
              step="0.01"
              value={efectivo || ""}
              onChange={(e) => setEfectivo(Number(e.target.value))}
              className={`${inputClass} w-32`}
            />
          </Field>
          <input type="hidden" name="transferencia" value={transferencia} />
        </div>
      ) : (
        <>
          <input type="hidden" name="efectivo" value={0} />
          <input type="hidden" name="transferencia" value={0} />
        </>
      )}

      <SubmitButton
        pendingText="Cerrando..."
        variant="danger"
        icon="check"
        className="w-full"
      >
        Cobrar {fmtMoney(total)}
      </SubmitButton>

      {state?.error ? (
        <p className="text-sm text-crit">{state.error}</p>
      ) : null}
    </form>
  );
}
