"use client";

import { useActionState, useEffect, useRef } from "react";
import { crearUsuario } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass } from "@/components/ui";
import { useToast } from "@/components/toast";
import type { ActionState } from "@/lib/action";

export function NuevoUsuario() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    crearUsuario,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const { mostrarToast } = useToast();

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      mostrarToast("Usuario creado exitosamente");
    }
  }, [state, mostrarToast]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Field label="Nombre">
        <input name="nombre" required className={inputClass} />
      </Field>
      <Field label="Correo">
        <input name="email" type="email" required className={inputClass} />
      </Field>
      <Field label="Contraseña" hint="mínimo 6 caracteres">
        <input name="password" type="text" required className={inputClass} />
      </Field>
      <Field label="Rol">
        <select name="rol" defaultValue="operador" className={inputClass}>
          <option value="operador">Operador</option>
          <option value="admin">Administrador</option>
        </select>
      </Field>

      {state?.error ? (
        <p className="text-sm text-crit sm:col-span-2 lg:col-span-4">
          {state.error}
        </p>
      ) : null}
      <div className="mt-1 sm:col-span-2 lg:col-span-4">
        <SubmitButton pendingText="Creando..." icon="plus">
          Crear usuario
        </SubmitButton>
      </div>
    </form>
  );
}
