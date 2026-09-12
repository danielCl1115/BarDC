"use client";

import { useFormStatus } from "react-dom";
import { agregarItemTile } from "../actions";
import { fmtMoney } from "@/lib/format";
import { tileColor } from "@/lib/tile-colors";
import { Icon } from "@/components/icons";

type ProductoOpcion = { id: string; nombre: string; precio: number; stock: number };

/** Cuadrícula de productos: tocar un producto lo agrega a la cuenta (cantidad 1). */
export function ProductGrid({
  cuentaId,
  productos,
}: {
  cuentaId: string;
  productos: ProductoOpcion[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {productos.map((p) => (
        <ProductTile key={p.id} cuentaId={cuentaId} producto={p} />
      ))}
    </div>
  );
}

function ProductTile({
  cuentaId,
  producto,
}: {
  cuentaId: string;
  producto: ProductoOpcion;
}) {
  const color = tileColor(producto.id);
  const sinStock = producto.stock <= 0;

  return (
    <form action={agregarItemTile}>
      <input type="hidden" name="cuenta_id" value={cuentaId} />
      <input type="hidden" name="producto_id" value={producto.id} />
      <input type="hidden" name="cantidad" value="1" />
      <TileButton color={color} nombre={producto.nombre} precio={producto.precio} sinStock={sinStock} />
    </form>
  );
}

function TileButton({
  color,
  nombre,
  precio,
  sinStock,
}: {
  color: ReturnType<typeof tileColor>;
  nombre: string;
  precio: number;
  sinStock: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={sinStock}
      className={`flex min-h-24 w-full flex-col justify-between gap-2 rounded-xl border-2 p-3 text-left transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${color.bg} ${color.border} ${
        pending ? "scale-[0.97] opacity-70" : "hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-snug text-ink">
          {nombre}
        </span>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${color.active}`}
        >
          <Icon name="plus" size={14} />
        </span>
      </div>
      {sinStock ? (
        <span className="text-xs font-medium text-crit">Sin stock</span>
      ) : (
        <span className={`text-base font-bold ${color.text}`}>
          {fmtMoney(precio)}
        </span>
      )}
    </button>
  );
}
