"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { registrarCompra } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass } from "@/components/ui";
import { useToast } from "@/components/toast";
import { fmtMoney } from "@/lib/format";
import type { ActionState } from "@/lib/action";

type ProductoOpcion = { id: string; nombre: string; costo: number };
type Renglon = { producto_id: string; cantidad: number; costo_unitario: number };

const RENGLON_VACIO: Renglon = { producto_id: "", cantidad: 1, costo_unitario: 0 };

export function CompraForm({ productos }: { productos: ProductoOpcion[] }) {
  const [renglones, setRenglones] = useState<Renglon[]>([{ ...RENGLON_VACIO }]);
  const [state, formAction] = useActionState<ActionState, FormData>(
    registrarCompra,
    null,
  );

  const { mostrarToast } = useToast();

  useEffect(() => {
    if (state?.ok) {
      setRenglones([{ ...RENGLON_VACIO }]);
      mostrarToast("Compra registrada exitosamente");
    }
  }, [state, mostrarToast]);

  const total = useMemo(
    () =>
      renglones.reduce(
        (s, r) => s + Number(r.cantidad || 0) * Number(r.costo_unitario || 0),
        0,
      ),
    [renglones],
  );

  function set(i: number, patch: Partial<Renglon>) {
    setRenglones((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
  }

  const itemsValidos = renglones.filter(
    (r) => r.producto_id && r.cantidad > 0 && r.costo_unitario >= 0,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="items" value={JSON.stringify(itemsValidos)} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Proveedor">
          <input name="proveedor" className={inputClass} placeholder="opcional" />
        </Field>
        <Field label="Nota">
          <input name="nota" className={inputClass} placeholder="opcional" />
        </Field>
      </div>

      <div className="space-y-2">
        {renglones.map((r, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <label className="text-xs">
              <span className="block text-ink-2">Producto</span>
              <select
                value={r.producto_id}
                onChange={(e) => {
                  const prod = productos.find((p) => p.id === e.target.value);
                  set(i, {
                    producto_id: e.target.value,
                    costo_unitario: prod ? prod.costo : r.costo_unitario,
                  });
                }}
                className={`${inputClass} min-w-52`}
              >
                <option value="">Elegir...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <span className="block text-ink-2">Cantidad</span>
              <input
                type="number"
                min="0"
                step="0.001"
                value={r.cantidad}
                onChange={(e) => set(i, { cantidad: Number(e.target.value) })}
                className={`${inputClass} w-24`}
              />
            </label>
            <label className="text-xs">
              <span className="block text-ink-2">Costo unitario</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={r.costo_unitario}
                onChange={(e) =>
                  set(i, { costo_unitario: Number(e.target.value) })
                }
                className={`${inputClass} w-28`}
              />
            </label>
            <span className="pb-2 text-sm text-ink-2">
              {fmtMoney(r.cantidad * r.costo_unitario)}
            </span>
            {renglones.length > 1 ? (
              <button
                type="button"
                onClick={() =>
                  setRenglones((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="pb-2 text-xs text-crit hover:underline"
              >
                Quitar
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRenglones((prev) => [...prev, { ...RENGLON_VACIO }])}
          className="text-sm text-ink-2 hover:underline"
        >
          + Agregar renglón
        </button>
      </div>

      <div className="flex items-center gap-3 border-t border-ink/8 pt-3">
        <span className="text-sm font-medium">Total: {fmtMoney(total)}</span>
        <SubmitButton pendingText="Registrando..." icon="plus">
          Registrar compra
        </SubmitButton>
      </div>

      {state?.error ? (
        <p className="text-sm text-crit">{state.error}</p>
      ) : null}
    </form>
  );
}
