"use client";

import { useActionState, useEffect, useRef } from "react";
import { actualizarCantidad } from "../actions";
import { useToast } from "@/components/toast";
import { useCuenta } from "./cuenta-provider";
import type { ActionState } from "@/lib/action";

/**
 * Cantidad editable de un renglón del ticket. Escribe el número que
 * necesites (ej: 30) y se guarda solo al salir del campo (blur) o al
 * presionar Enter — sin un botón de confirmar aparte, para no obligar
 * a un clic extra. El total y el subtotal cambian en el acto; si el servidor
 * no acepta el cambio, vuelven al valor guardado y el error se ve aquí mismo.
 */
export function QtyInput({
  cuentaId,
  itemId,
  cantidad,
  deshabilitado = false,
}: {
  cuentaId: string;
  itemId: string;
  cantidad: number;
  /** El renglón recién tocado todavía no existe en el servidor. */
  deshabilitado?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ultimaEnviada = useRef(cantidad);
  const cantidadReal = useRef(cantidad);
  const { cambiarCantidad } = useCuenta();
  const [state, formAction] = useActionState<ActionState, FormData>(
    actualizarCantidad,
    null,
  );
  const { mostrarToast } = useToast();

  useEffect(() => {
    cantidadReal.current = cantidad;
  }, [cantidad]);

  useEffect(() => {
    if (state?.ok) mostrarToast("Cantidad actualizada");
    if (state?.error && inputRef.current) {
      // El servidor no aceptó el cambio: el campo vuelve a lo que de verdad hay guardado
      inputRef.current.value = String(cantidadReal.current);
      ultimaEnviada.current = cantidadReal.current;
    }
  }, [state, mostrarToast]);

  function guardar(formData: FormData) {
    const n = Number(formData.get("cantidad"));
    if (Number.isFinite(n) && n >= 0) cambiarCantidad(itemId, n); // se ve al instante
    formAction(formData);
  }

  function enviarSiCambio(valor: string) {
    const n = Number(valor);
    if (!Number.isFinite(n) || n === ultimaEnviada.current) return;
    ultimaEnviada.current = n;
    formRef.current?.requestSubmit();
  }

  return (
    <div>
      <form ref={formRef} action={guardar} className="flex items-center gap-1">
        <input type="hidden" name="item_id" value={itemId} />
        <input type="hidden" name="cuenta_id" value={cuentaId} />
        <input
          ref={inputRef}
          name="cantidad"
          type="number"
          min="0"
          step="any"
          defaultValue={cantidad}
          disabled={deshabilitado}
          onBlur={(e) => enviarSiCambio(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              enviarSiCambio(e.currentTarget.value);
            }
          }}
          className="w-12 rounded-md border border-ink/15 bg-surface py-0.5 text-center text-xs tabular-nums text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
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
