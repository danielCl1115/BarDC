"use client";

import { useActionState, useEffect, useRef } from "react";
import { resetearPassword } from "./actions";
import { Field, Modal, buttonVariants } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";
import { SubmitButton } from "@/components/submit-button";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/toast";
import type { ActionState } from "@/lib/action";

export function ResetearPassword({ id, nombre }: { id: string; nombre: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<ActionState, FormData>(
    resetearPassword,
    null,
  );
  const { mostrarToast } = useToast();

  useEffect(() => {
    if (state?.ok) {
      dialogRef.current?.close();
      formRef.current?.reset();
      mostrarToast("Contraseña actualizada");
    }
  }, [state, mostrarToast]);

  const cerrar = () => dialogRef.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        title="Cambiar contraseña"
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 hover:bg-plane hover:text-ink"
      >
        <Icon name="key" size={15} />
      </button>

      <Modal dialogRef={dialogRef} title={`Contraseña de ${nombre}`} onClose={cerrar}>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={id} />

          <Field label="Nueva contraseña" hint="mínimo 6 caracteres">
            <PasswordInput name="password" autoComplete="new-password" required />
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
            <SubmitButton pendingText="Guardando...">Guardar</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
