"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { registrarCompra } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { Field, inputClass, buttonVariants } from "@/components/ui";
import { Icon } from "@/components/icons";
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

      <div className="space-y-2 rounded-lg border border-ink/8 bg-plane p-3">
        {renglones.map((r, i) => (
          <div
            key={i}
            className="flex flex-wrap items-end gap-2 rounded-lg border border-ink/8 bg-surface p-3"
          >
            <Field label="Producto" className="min-w-52 flex-1">
              <select
                value={r.producto_id}
                onChange={(e) => {
                  const prod = productos.find((p) => p.id === e.target.value);
                  set(i, {
                    producto_id: e.target.value,
                    costo_unitario: prod ? prod.costo : r.costo_unitario,
                  });
                }}
                className={inputClass}
              >
                <option value="">Elegir...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cantidad" className="w-24">
              <input
                type="number"
                min="0"
                step="0.001"
                value={r.cantidad}
                onChange={(e) => set(i, { cantidad: Number(e.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Costo unitario" className="w-28">
              <input
                type="number"
                min="0"
                step="0.01"
                value={r.costo_unitario}
                onChange={(e) =>
                  set(i, { costo_unitario: Number(e.target.value) })
                }
                className={inputClass}
              />
            </Field>
            <div className="flex items-center gap-2 pb-2">
              <span className="min-w-24 text-right text-sm font-medium text-ink">
                {fmtMoney(r.cantidad * r.costo_unitario)}
              </span>
              <button
                type="button"
                onClick={() =>
                  setRenglones((prev) => prev.filter((_, idx) => idx !== i))
                }
                disabled={renglones.length === 1}
                title="Quitar renglón"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-3 hover:bg-crit/10 hover:text-crit disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-3"
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRenglones((prev) => [...prev, { ...RENGLON_VACIO }])}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${buttonVariants.secondary}`}
        >
          <Icon name="plus" size={15} />
          Agregar renglón
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/8 pt-4">
        <span className="text-sm font-semibold uppercase tracking-wide text-ink-2">
          Total: <span className="text-lg text-ink">{fmtMoney(total)}</span>
        </span>
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
