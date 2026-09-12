import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Empty, PageHeader, StatTile, Field, inputClass, buttonVariants } from "@/components/ui";
import { Icon } from "@/components/icons";
import { fmtMoney, fmtFecha, fmtDiaYMD, fmtCantidad } from "@/lib/format";
import { hoyYMD, diasEntre, sumarDias, inicioDiaUTC } from "@/lib/tz";
import { PERIODOS, MAX_DIAS_EXPORTAR, type Periodo, calcularRango } from "@/lib/periodos";
import { CompraForm } from "./compra-form";
import type { Compra, Producto } from "@/lib/types";

function qs(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

const pill = (activo: boolean) =>
  `rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
    activo
      ? "border-brand-500 bg-brand-500 text-white"
      : "border-ink/15 bg-surface text-ink-2 hover:bg-plane"
  }`;

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createClient();

  const periodo: Periodo = PERIODOS.some((p) => p.valor === sp.periodo)
    ? (sp.periodo as Periodo)
    : "mes";
  const hoy = hoyYMD();
  const { desde, hasta } = calcularRango(periodo, hoy, sp.desde, sp.hasta);
  const dias = diasEntre(desde, hasta);
  const puedeExportar = dias <= MAX_DIAS_EXPORTAR;
  const rangoTexto = desde === hasta ? fmtDiaYMD(desde) : `${fmtDiaYMD(desde)} – ${fmtDiaYMD(hasta)}`;

  const [{ data: productosData }, { data: comprasData }] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, costo")
      .eq("activo", true)
      .order("nombre"),
    supabase
      .from("compras")
      .select("*")
      .gte("created_at", inicioDiaUTC(desde).toISOString())
      .lt("created_at", inicioDiaUTC(sumarDias(hasta, 1)).toISOString())
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);

  const productos = (productosData ?? []) as Pick<
    Producto,
    "id" | "nombre" | "costo"
  >[];
  const compras = (comprasData ?? []) as Compra[];
  const totalPeriodo = compras.reduce((s, c) => s + Number(c.total), 0);

  // Para que ninguna fila se vea vacía cuando proveedor y nota quedan en blanco:
  // siempre mostramos qué productos trajo esa compra.
  const idsCompras = compras.map((c) => c.id);
  const [{ data: itemsData }, { data: todosProductosData }] = await Promise.all([
    idsCompras.length > 0
      ? supabase
          .from("compra_items")
          .select("compra_id, producto_id, cantidad")
          .in("compra_id", idsCompras)
      : Promise.resolve({ data: [] as { compra_id: string; producto_id: string; cantidad: number }[] }),
    supabase.from("productos").select("id, nombre"),
  ]);
  const nombrePorProducto = new Map(
    (todosProductosData ?? []).map((p) => [p.id as string, p.nombre as string]),
  );
  const productosPorCompra = new Map<string, string[]>();
  for (const it of itemsData ?? []) {
    const nombre = nombrePorProducto.get(it.producto_id) ?? "Producto eliminado";
    const arr = productosPorCompra.get(it.compra_id) ?? [];
    arr.push(`${nombre} ×${fmtCantidad(it.cantidad)}`);
    productosPorCompra.set(it.compra_id, arr);
  }

  return (
    <>
      <PageHeader
        title="Compras"
        description="Registrar entradas de inventario. Suma stock y actualiza el costo."
      />

      <Card title="Nueva compra">
        {productos.length === 0 ? (
          <Empty>Primero crea productos en la pantalla de Productos.</Empty>
        ) : (
          <CompraForm productos={productos} />
        )}
      </Card>

      <Card title="Filtros">
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <Link key={p.valor} href={`/compras${qs({ periodo: p.valor })}`} className={pill(periodo === p.valor)}>
              {p.etiqueta}
            </Link>
          ))}
        </div>

        {periodo === "personalizado" ? (
          <form method="get" className="mt-4 flex flex-wrap items-end gap-3 border-t border-ink/8 pt-4">
            <input type="hidden" name="periodo" value="personalizado" />
            <Field label="Desde">
              <input type="date" name="desde" defaultValue={desde} className={inputClass} />
            </Field>
            <Field label="Hasta">
              <input type="date" name="hasta" defaultValue={hasta} className={inputClass} />
            </Field>
            <button
              type="submit"
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium ${buttonVariants.primary}`}
            >
              Aplicar
            </button>
          </form>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-end border-t border-ink/8 pt-4">
          {puedeExportar ? (
            <a
              href={`/compras/exportar${qs({ periodo, desde, hasta })}`}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${buttonVariants.secondary}`}
            >
              <Icon name="download" size={16} />
              Exportar a Excel
            </a>
          ) : (
            <span className="text-xs text-ink-3">
              Para exportar, elige un periodo de máximo {MAX_DIAS_EXPORTAR} días.
            </span>
          )}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Compras del periodo" value={compras.length} icon="truck" />
        <StatTile label="Invertido en el periodo" value={fmtMoney(totalPeriodo)} />
      </div>

      <Card title="Compras" description={`Periodo: ${rangoTexto}`}>
        {compras.length === 0 ? (
          <Empty>No hay compras registradas en este periodo.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-44" />
                <col className="w-40" />
                <col />
                <col className="w-32" />
              </colgroup>
              <thead>
                <tr className="text-left text-ink-3">
                  <th className="pb-2 pr-4 font-medium">Fecha</th>
                  <th className="pb-2 pr-4 font-medium">Proveedor</th>
                  <th className="pb-2 pr-4 font-medium">Productos</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => (
                  <tr key={c.id} className="border-t border-ink/6 align-top">
                    <td className="truncate py-3 pr-4">{fmtFecha(c.created_at)}</td>
                    <td className="truncate py-3 pr-4">{c.proveedor ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <div className="truncate text-ink-2">
                        {(productosPorCompra.get(c.id) ?? []).join(", ") || "—"}
                      </div>
                      {c.nota ? (
                        <div className="mt-0.5 truncate text-xs text-ink-3">{c.nota}</div>
                      ) : null}
                    </td>
                    <td className="py-3 text-right font-medium text-ink">
                      {fmtMoney(c.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
