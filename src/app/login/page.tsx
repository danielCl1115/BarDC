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
    <main
      className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-12"
      style={{ background: "radial-gradient(circle at 50% 0%, #24503a 0%, #0f2118 68%)" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #f4ecd8 0px, #f4ecd8 1px, transparent 1px, transparent 3px)",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="flex justify-center">
          <LogoBadge size={132} />
        </div>
        <p className="mt-4 text-center text-[11px] font-medium uppercase tracking-[0.3em] text-[#e7ddc4]/70">
          Inicia sesión para continuar
        </p>

        <form
          action={formAction}
          className="mt-7 space-y-4 rounded-2xl border border-[#a97b2f]/25 bg-[#f8f2e2] p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)]"
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

          <SubmitButton
            pendingText="Entrando..."
            className="w-full !bg-[#1c3829] !text-[#f4ecd8] hover:!bg-[#16301f]"
          >
            Entrar
          </SubmitButton>
        </form>

        <p className="mt-5 text-center text-xs text-[#e7ddc4]/50">
          ¿Sin usuario? El administrador los crea desde la pantalla de Usuarios.
        </p>
      </div>
    </main>
  );
}
