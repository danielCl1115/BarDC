"use client";

import { createContext, useContext, useMemo, useOptimistic, type ReactNode } from "react";
import type { CuentaItem } from "@/lib/types";

/** Renglones que todavía no existen en el servidor (se acaban de tocar en la cuadrícula). */
export const PREFIJO_TEMP = "tmp-";

type ProductoTocado = { id: string; nombre: string; precio: number };

type Accion =
  | { tipo: "cantidad"; itemId: string; cantidad: number }
  | { tipo: "quitar"; itemId: string }
  | { tipo: "agregar"; producto: ProductoTocado; cantidad: number };

const subtotalDe = (cantidad: number, precio: number) => cantidad * precio;

/** Lo que va a pasar en el servidor, calculado aquí para mostrarlo al instante. */
function reducir(items: CuentaItem[], a: Accion): CuentaItem[] {
  switch (a.tipo) {
    case "cantidad":
      // Cantidad 0 borra el renglón (igual que en la base de datos)
      if (a.cantidad <= 0) return items.filter((i) => i.id !== a.itemId);
      return items.map((i) =>
        i.id === a.itemId
          ? { ...i, cantidad: a.cantidad, subtotal: subtotalDe(a.cantidad, i.precio_unitario) }
          : i,
      );
    case "quitar":
      return items.filter((i) => i.id !== a.itemId);
    case "agregar": {
      // Si el producto ya está en la cuenta, se suma a su cantidad
      const existente = items.find((i) => i.producto_id === a.producto.id);
      if (existente) {
        const cantidad = existente.cantidad + a.cantidad;
        return items.map((i) =>
          i === existente ? { ...i, cantidad, subtotal: subtotalDe(cantidad, i.precio_unitario) } : i,
        );
      }
      return [
        ...items,
        {
          id: `${PREFIJO_TEMP}${a.producto.id}`,
          cuenta_id: "",
          producto_id: a.producto.id,
          nombre_producto: a.producto.nombre,
          cantidad: a.cantidad,
          precio_unitario: a.producto.precio,
          subtotal: subtotalDe(a.cantidad, a.producto.precio),
          created_at: "",
        },
      ];
    }
  }
}

type CuentaCtx = {
  items: CuentaItem[];
  total: number;
  /** Cambian lo que se ve YA; hay que llamarlas dentro de la acción del formulario. */
  cambiarCantidad: (itemId: string, cantidad: number) => void;
  quitar: (itemId: string) => void;
  agregar: (producto: ProductoTocado) => void;
};

const Ctx = createContext<CuentaCtx | null>(null);

/**
 * Estado de la cuenta abierta compartido entre la cuadrícula de productos y el
 * ticket. Muestra el efecto de cada toque (agregar, cambiar cantidad, quitar)
 * en el mismo instante, sin esperar al servidor: cuando el servidor responde,
 * los datos reales reemplazan a los mostrados; si algo falla, la pantalla
 * vuelve sola a lo que de verdad hay guardado.
 */
export function CuentaProvider({ items, children }: { items: CuentaItem[]; children: ReactNode }) {
  const [vista, aplicar] = useOptimistic(items, reducir);

  const valor = useMemo<CuentaCtx>(
    () => ({
      items: vista,
      total: vista.reduce((s, i) => s + Number(i.subtotal), 0),
      cambiarCantidad: (itemId, cantidad) => aplicar({ tipo: "cantidad", itemId, cantidad }),
      quitar: (itemId) => aplicar({ tipo: "quitar", itemId }),
      agregar: (producto) => aplicar({ tipo: "agregar", producto, cantidad: 1 }),
    }),
    [vista, aplicar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCuenta() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCuenta debe usarse dentro de <CuentaProvider>");
  return ctx;
}
