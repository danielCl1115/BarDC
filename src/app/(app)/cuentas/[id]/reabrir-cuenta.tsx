"use client";

import { useActionState, useEffect, useRef } from "react";
import { reabrirCuenta } from "../actions";
import { Modal, buttonVariants } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/toast";
import type { ActionState } from "@/lib/action";

/** Corrige un cobro mal hecho: reabre la cuenta para editarla y cerrarla de nuevo. */
export function ReabrirCuenta({
  cuentaId,
  nombreCliente,
}: {
  cuentaId: string;
  nombreCliente: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState<ActionState, FormData>(reabrirCuenta, null);
  const { mostrarToast } = useToast();

  useEffect(() => {
    if (state?.ok) {
      dialogRef.current?.close();
      mostrarToast("Cuenta reabierta");
    }
  }, [state, mostrarToast]);

  const cerrar = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${buttonVariants.secondary}`}
      >
        <Icon name="undo" size={16} />
        Reabrir cuenta
      </button>

      <Modal dialogRef={dialogRef} title="Reabrir cuenta" onClose={cerrar}>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="cuenta_id" value={cuentaId} />

          <p className="text-sm text-ink-2">
            Esto vuelve a abrir <strong className="text-ink">«{nombreCliente}»</strong> para
            corregirla: se devuelve al inventario lo que se había descontado y el pago
            queda sin registrar hasta que la cierres de nuevo.
          </p>

          {state?.error ? <p className="text-sm text-crit">{state.error}</p> : null}

          <div className="flex justify-end gap-2 border-t border-ink/8 pt-4">
            <button
              type="button"
              onClick={cerrar}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${buttonVariants.secondary}`}
            >
              Cancelar
            </button>
            <SubmitButton pendingText="Reabriendo..." icon="undo">
              Sí, reabrir
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
