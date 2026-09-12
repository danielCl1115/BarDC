"use client";

import { buttonVariants } from "@/components/ui";
import { Icon } from "@/components/icons";

/** Aparte del Receipt (que es Server Component) para no tener que hidratar
 *  el resto del recibo solo por este botón — evita mismatches de fecha
 *  entre el formato de servidor y el del navegador. */
export function PrintButton() {
  return (
    <div className="mb-3 flex justify-end print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${buttonVariants.secondary}`}
      >
        <Icon name="print" size={16} />
        Imprimir
      </button>
    </div>
  );
}
