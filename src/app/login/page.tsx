"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass } from "@/components/ui";
import { LogoBadge } from "@/components/logo";
import type { ActionState } from "@/lib/action";

export default function LoginPage() {
  const [state, formAction] = useActionState<ActionState, FormData>(login, null);

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center">
          <LogoBadge size={128} />
        </div>
        <p className="mt-3 text-center text-sm text-ink-2">
          Inicia sesión para continuar
        </p>

        <form
          action={formAction}
          className="mt-6 space-y-4 rounded-lg border border-ink/8 bg-surface p-6 shadow-sm"
        >
          <Field label="Correo">
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputClass}
            />
          </Field>

          <Field label="Contraseña">
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
            />
          </Field>

          {state?.error ? (
            <p className="rounded-md bg-crit/10 px-3 py-2 text-sm text-crit">
              {state.error}
            </p>
          ) : null}

          <SubmitButton pendingText="Entrando..." className="w-full">
            Entrar
          </SubmitButton>
        </form>

        <p className="mt-4 text-center text-xs text-ink-3">
          ¿Sin usuario? El administrador los crea desde la pantalla de Usuarios.
        </p>
      </div>
    </main>
  );
}
