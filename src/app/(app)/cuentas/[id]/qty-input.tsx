"use client";

import { useActionState, useEffect, useRef } from "react";
import { actualizarCantidad } from "../actions";
import { useToast } from "@/components/toast";
import type { ActionState } from "@/lib/action";

/**
 * Cantidad editable de un renglón del ticket. Escribe el número que
 * necesites (ej: 30) y se guarda solo al salir del campo (blur) o al
 * presionar Enter — sin un botón de confirmar aparte, para no obligar
 * a un clic extra. Si algo falla (ej: falta correr una migración de
 * base de datos), el error se ve aquí mismo en vez de "no pasar nada".
 */
export function QtyInput({
  cuentaId,
  itemId,
  cantidad,
}: {
  cuentaId: string;
  itemId: string;
  cantidad: number;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const ultimaEnviada = useRef(cantidad);
  const [state, formAction] = useActionState<ActionState, FormData>(
    actualizarCantidad,
    null,
  );
  const { mostrarToast } = useToast();

  useEffect(() => {
    if (state?.ok) mostrarToast("Cantidad actualizada");
  }, [state, mostrarToast]);

  function enviarSiCambio(valor: string) {
    const n = Number(valor);
    if (!Number.isFinite(n) || n === ultimaEnviada.current) return;
    ultimaEnviada.current = n;
    formRef.current?.requestSubmit();
  }

  return (
    <div>
      <form ref={formRef} action={formAction} className="flex items-center gap-1">
        <input type="hidden" name="item_id" value={itemId} />
        <input type="hidden" name="cuenta_id" value={cuentaId} />
        <input
          name="cantidad"
          type="number"
          min="0"
          step="1"
          defaultValue={cantidad}
          onBlur={(e) => enviarSiCambio(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              enviarSiCambio(e.currentTarget.value);
            }
          }}
          className="w-12 rounded-md border border-ink/15 bg-surface py-0.5 text-center text-xs tabular-nums text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
      </form>
      {state?.error ? (
        <p className="mt-1 max-w-[10rem] text-[11px] leading-tight text-crit">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
