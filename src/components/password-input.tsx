"use client";

import { useState } from "react";
import { inputClass } from "@/components/ui";
import { Icon } from "@/components/icons";

/** Input de contraseña oculta por defecto, con el ojito para mostrarla/ocultarla. */
export function PasswordInput({
  name,
  autoComplete,
  required,
  defaultValue,
}: {
  name: string;
  autoComplete?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        required={required}
        defaultValue={defaultValue}
        className={`${inputClass} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-ink-3 hover:text-ink"
      >
        <Icon name={visible ? "eyeOff" : "eye"} size={17} />
      </button>
    </div>
  );
}
