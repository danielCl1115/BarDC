import { Badge } from "@/components/ui";
import { fmtFecha, fmtMoney } from "@/lib/format";
import { PrintButton } from "./print-button";
import type { Cuenta, CuentaItem } from "@/lib/types";

function Notch() {
  return (
    <div className="relative -mx-6 my-4">
      <div className="border-t border-dashed border-ink/20" />
      <span className="absolute left-0 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/10 bg-plane" />
      <span className="absolute right-0 top-1/2 h-5 w-5 translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/10 bg-plane" />
    </div>
  );
}

/** Recibo de una cuenta ya cobrada: se ve como un ticket de caja, no como una tabla. */
export function Receipt({
  cuenta,
  items,
}: {
  cuenta: Cuenta;
  items: CuentaItem[];
}) {
  return (
    <div className="mx-auto w-full max-w-sm print:max-w-full">
      <PrintButton />

      <div className="rounded-xl border border-ink/8 bg-surface px-6 pb-6 pt-7 shadow-[0_1px_2px_rgba(11,11,11,0.04)] print:rounded-none print:border-0 print:shadow-none">
        <div className="text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-3">
            Recibo
          </div>
          <div className="mt-1 text-xl font-bold text-ink">
            {cuenta.nombre_cliente}
          </div>
          <div className="mt-0.5 text-xs text-ink-3">
            {fmtFecha(cuenta.cerrada_en)}
          </div>
        </div>

        <Notch />

        <div className="space-y-2 font-mono text-[13px]">
          {items.map((it) => (
            <div key={it.id} className="flex justify-between gap-3">
              <span className="min-w-0 flex-1 truncate text-ink-2">
                {it.nombre_producto}{" "}
                <span className="text-ink-3">×{it.cantidad}</span>
              </span>
              <span className="shrink-0 tabular-nums text-ink">
                {fmtMoney(it.subtotal)}
              </span>
            </div>
          ))}
        </div>

        <Notch />

        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold uppercase tracking-wide text-ink-2">
            Total
          </span>
          <span className="font-mono text-2xl font-bold tabular-nums text-ink">
            {fmtMoney(cuenta.total)}
          </span>
        </div>

        <div className="mt-3 space-y-1 border-t border-ink/8 pt-3 font-mono text-[13px] text-ink-2">
          {cuenta.pago_efectivo > 0 ? (
            <div className="flex justify-between">
              <span>Efectivo</span>
              <span className="tabular-nums">{fmtMoney(cuenta.pago_efectivo)}</span>
            </div>
          ) : null}
          {cuenta.pago_transferencia > 0 ? (
            <div className="flex justify-between">
              <span>Transferencia</span>
              <span className="tabular-nums">
                {fmtMoney(cuenta.pago_transferencia)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex justify-center">
          <Badge tone="good">Pagado</Badge>
        </div>
      </div>
    </div>
  );
}
