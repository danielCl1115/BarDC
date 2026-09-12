import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Empty, PageHeader, StatTile } from "@/components/ui";
import { fmtMoney, fmtFecha } from "@/lib/format";
import { hoyYMD, primerDiaMes, inicioDiaUTC } from "@/lib/tz";
import { CompraForm } from "./compra-form";
import type { Compra, Producto } from "@/lib/types";

export default async function ComprasPage() {
  await requireAdmin();
  const supabase = await createClient();
  const desdeMes = inicioDiaUTC(primerDiaMes(hoyYMD())).toISOString();

  const [{ data: productosData }, { data: comprasData }, { data: mesData }] =
    await Promise.all([
      supabase
        .from("productos")
        .select("id, nombre, costo")
        .eq("activo", true)
        .order("nombre"),
      supabase
        .from("compras")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("compras").select("total").gte("created_at", desdeMes),
    ]);

  const productos = (productosData ?? []) as Pick<
    Producto,
    "id" | "nombre" | "costo"
  >[];
  const compras = (comprasData ?? []) as Compra[];
  const comprasMes = (mesData ?? []) as Pick<Compra, "total">[];
  const totalMes = comprasMes.reduce((s, c) => s + Number(c.total), 0);

  return (
    <>
      <PageHeader
        title="Compras"
        description="Registrar entradas de inventario. Suma stock y actualiza el costo."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile label="Compras este mes" value={comprasMes.length} icon="truck" />
        <StatTile label="Invertido este mes" value={fmtMoney(totalMes)} />
      </div>

      <Card title="Nueva compra">
        {productos.length === 0 ? (
          <Empty>Primero crea productos en la pantalla de Productos.</Empty>
        ) : (
          <CompraForm productos={productos} />
        )}
      </Card>

      <Card title="Últimas compras">
        {compras.length === 0 ? (
          <Empty>Todavía no has registrado compras.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-44" />
                <col className="w-48" />
                <col />
                <col className="w-32" />
              </colgroup>
              <thead>
                <tr className="text-left text-ink-3">
                  <th className="pb-2 pr-4 font-medium">Fecha</th>
                  <th className="pb-2 pr-4 font-medium">Proveedor</th>
                  <th className="pb-2 pr-4 font-medium">Nota</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => (
                  <tr key={c.id} className="border-t border-ink/6">
                    <td className="truncate py-3 pr-4">{fmtFecha(c.created_at)}</td>
                    <td className="truncate py-3 pr-4">{c.proveedor ?? "—"}</td>
                    <td className="truncate py-3 pr-4">{c.nota ?? "—"}</td>
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
