import { Icon } from "@/components/icons";
import { Empty } from "@/components/ui";
import { fmtMoney } from "@/lib/format";
import { quitarItem } from "../actions";
import { CerrarCuenta } from "./forms";
import { QtyInput } from "./qty-input";
import type { CuentaItem } from "@/lib/types";

/** Panel de cuenta: lo que lleva, el total, y el cobro. Fijo en pantalla en escritorio. */
export function Ticket({
  cuentaId,
  nombreCliente,
  items,
  total,
}: {
  cuentaId: string;
  nombreCliente: string;
  items: CuentaItem[];
  total: number;
}) {
  return (
    <div className="rounded-xl border border-ink/8 bg-surface shadow-[0_1px_2px_rgba(11,11,11,0.04)] lg:sticky lg:top-4">
      <div className="border-b border-ink/8 p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-3">
          Cuenta de
        </div>
        <div className="truncate text-lg font-semibold text-ink">
          {nombreCliente}
        </div>
        <div className="mt-3 text-3xl font-bold tracking-tight text-ink">
          {fmtMoney(total)}
        </div>
      </div>

      <div className="max-h-72 overflow-y-auto p-3">
        {items.length === 0 ? (
          <Empty>Toca un producto para agregarlo.</Empty>
        ) : (
          <ul className="space-y-1">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-plane"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {it.nombre_producto}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-3">
                    <QtyInput cuentaId={cuentaId} itemId={it.id} cantidad={it.cantidad} />
                    <span>× {fmtMoney(it.precio_unitario)}</span>
                  </div>
                </div>
                <div className="shrink-0 text-sm font-semibold text-ink">
                  {fmtMoney(it.subtotal)}
                </div>
                <form action={quitarItem}>
                  <input type="hidden" name="item_id" value={it.id} />
                  <input type="hidden" name="cuenta_id" value={cuentaId} />
                  <button
                    type="submit"
                    title="Quitar"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-3 hover:bg-crit/10 hover:text-crit"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-ink/8 p-5">
        {total > 0 ? (
          <CerrarCuenta cuentaId={cuentaId} total={total} />
        ) : (
          <p className="text-center text-sm text-ink-3">
            Agrega al menos un producto para poder cobrar.
          </p>
        )}
      </div>
    </div>
  );
}
