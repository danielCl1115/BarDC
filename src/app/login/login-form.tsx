"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { login } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass } from "@/components/ui";
import { PasswordInput } from "@/components/password-input";
import type { ActionState } from "@/lib/action";

const BAR_FAVORITO_KEY = "bar_favorito_id";

export function LoginForm({ bares }: { bares: { id: string; nombre: string }[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(login, null);
  const [recordar, setRecordar] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Solo si el usuario lo pidió antes (marcó la casilla) precargamos su bar.
  useEffect(() => {
    if (bares.length <= 1) return;
    try {
      const favorito = localStorage.getItem(BAR_FAVORITO_KEY);
      if (favorito && selectRef.current && bares.some((b) => b.id === favorito)) {
        selectRef.current.value = favorito;
        setRecordar(true);
      }
    } catch {
      // localStorage puede fallar (modo privado, etc.); no es grave, solo no recuerda.
    }
  }, [bares]);

  const actualizarFavorito = () => {
    try {
      if (recordar && selectRef.current?.value) {
        localStorage.setItem(BAR_FAVORITO_KEY, selectRef.current.value);
      }
    } catch {
      // ver comentario arriba
    }
  };

  const cambiarRecordar = (checked: boolean) => {
    setRecordar(checked);
    try {
      if (checked && selectRef.current?.value) {
        localStorage.setItem(BAR_FAVORITO_KEY, selectRef.current.value);
      } else {
        localStorage.removeItem(BAR_FAVORITO_KEY);
      }
    } catch {
      // ver comentario arriba
    }
  };

  return (
    <form action={formAction} className="space-y-4">
      {bares.length > 0 ? (
        <Field label="Bar">
          <select
            ref={selectRef}
            name="bar_id"
            required
            defaultValue={bares.length === 1 ? bares[0].id : ""}
            onChange={actualizarFavorito}
            className={inputClass}
          >
            {bares.length > 1 ? (
              <option value="" disabled>
                Selecciona tu bar
              </option>
            ) : null}
            {bares.map((bar) => (
              <option key={bar.id} value={bar.id}>
                {bar.nombre}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {bares.length > 1 ? (
        <label className="flex items-center gap-2 text-xs text-ink-3">
          <input
            type="checkbox"
            checked={recordar}
            onChange={(e) => cambiarRecordar(e.target.checked)}
            style={{ accentColor: "#22d3ee" }}
            className="h-4 w-4 rounded"
          />
          Recordar este bar en este dispositivo
        </label>
      ) : null}

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
        <PasswordInput name="password" autoComplete="current-password" required />
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
  );
}
