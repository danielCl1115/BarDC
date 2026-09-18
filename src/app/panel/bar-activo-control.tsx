"use client";

import { useActionState, useEffect, useRef } from "react";
import { desactivarBarConfirmado, togglearBarActivo } from "./actions";
import { Modal, buttonVariants } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { useToast } from "@/components/toast";
import type { ActionState } from "@/lib/action";

/** Reactivar es instantáneo (dirección segura); desactivar pasa por confirmación. */
export function BarActivoControl({
  barId,
  nombre,
  activo,
}: {
  barId: string;
  nombre: string;
  activo: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState<ActionState, FormData>(
    desactivarBarConfirmado,
    null,
  );
  const { mostrarToast } = useToast();

  useEffect(() => {
    if (state?.ok) {
      dialogRef.current?.close();
      mostrarToast(`${nombre} desactivado`);
    }
  }, [state, mostrarToast, nombre]);

  if (!activo) {
    return (
      <form action={togglearBarActivo}>
        <input type="hidden" name="id" value={barId} />
        <button
          type="submit"
          className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-2 hover:bg-plane"
        >
          Activar
        </button>
      </form>
    );
  }

  const cerrar = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-2 hover:bg-crit/10 hover:text-crit"
      >
        Desactivar
      </button>

      <Modal dialogRef={dialogRef} title="Desactivar bar" onClose={cerrar}>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={barId} />

          <p className="text-sm text-ink-2">
            ¿Seguro que quieres desactivar <strong className="text-ink">«{nombre}»</strong>? Su
            personal no va a poder volver a entrar hasta que lo actives de nuevo.
          </p>

          {state?.error ? <p className="text-sm text-crit">{state.error}</p> : null}

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={cerrar}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${buttonVariants.secondary}`}
            >
              Cancelar
            </button>
            <SubmitButton pendingText="Desactivando..." variant="danger">
              Sí, desactivar
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
