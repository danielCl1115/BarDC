"use client";

import { useActionState, useEffect, useRef } from "react";
import { ajustarInventario } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass, Modal, buttonVariants } from "@/components/ui";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/toast";
import type { ActionState } from "@/lib/action";

export function AjusteForm({
  productoId,
  nombre,
  stockActual,
}: {
  productoId: string;
  nombre: string;
  stockActual: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState<ActionState, FormData>(
    ajustarInventario,
    null,
  );

  const { mostrarToast } = useToast();

  useEffect(() => {
    if (state?.ok) {
      dialogRef.current?.close();
      mostrarToast("Stock ajustado exitosamente");
    }
  }, [state, mostrarToast]);

  const cerrar = () => dialogRef.current?.close();

  return (
    <>
      <button
        onClick={() => dialogRef.current?.showModal()}
        title="Ajustar stock"
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 hover:bg-plane hover:text-ink"
      >
        <Icon name="pencil" size={15} />
      </button>

      <Modal dialogRef={dialogRef} title={`Ajustar «${nombre}»`} onClose={cerrar}>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="producto_id" value={productoId} />

          <Field label="Conteo real" hint={`Sistema: ${stockActual}`}>
            <input
              name="nuevo_stock"
              type="number"
              min="0"
              step="0.001"
              defaultValue={stockActual}
              className={inputClass}
            />
          </Field>

          <Field label="Nota">
            <input name="nota" className={inputClass} placeholder="ej: conteo de cierre" />
          </Field>

          {state?.error ? <p className="text-sm text-crit">{state.error}</p> : null}

          <div className="flex justify-end gap-2 border-t border-ink/8 pt-4">
            <button
              type="button"
              onClick={cerrar}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${buttonVariants.secondary}`}
            >
              Cancelar
            </button>
            <SubmitButton pendingText="Guardando...">Guardar ajuste</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
