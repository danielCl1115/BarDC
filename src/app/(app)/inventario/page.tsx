import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Empty, PageHeader, Badge, StatTile } from "@/components/ui";
import { StockChart } from "@/components/charts";
import { fmtMoney } from "@/lib/format";
import { AjusteForm } from "./ajuste-form";
import type { InventarioFila } from "@/lib/types";

export default async function InventarioPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase.from("v_inventario").select("*");
  const filas = (data ?? []) as InventarioFila[];
  const activos = filas.filter((f) => f.activo);

  const valorTotal = filas.reduce((s, f) => s + Number(f.valor_costo), 0);
  const enAlerta = activos.filter((f) => f.alerta);

  return (
    <>
      <PageHeader
        title="Inventario"
        description="Stock en tiempo real y ajuste por conteo físico"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Productos" value={filas.length} />
        <StatTile label="Valor del inventario (costo)" value={fmtMoney(valorTotal)} />
        <StatTile
          label="En alerta de stock"
          value={enAlerta.length}
          tone={enAlerta.length > 0 ? "warn" : "good"}
        />
      </div>

      <Card title="Stock por producto" description="Barra clara = mínimo definido">
        {activos.length === 0 ? (
          <Empty>No hay productos activos.</Empty>
        ) : (
          <StockChart data={activos} />
        )}
      </Card>

      <Card title="Existencias">
        {filas.length === 0 ? (
          <Empty>No hay productos.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <colgroup>
                <col />
                <col className="w-20" />
                <col className="w-20" />
                <col className="w-28" />
                <col className="w-28" />
                <col className="w-40" />
              </colgroup>
              <thead>
                <tr className="text-left text-ink-3">
                  <th className="pb-2 pr-4 font-medium">Producto</th>
                  <th className="pb-2 pr-4 text-right font-medium">Stock</th>
                  <th className="pb-2 pr-4 text-right font-medium">Mínimo</th>
                  <th className="pb-2 pr-4 text-right font-medium">Valor (costo)</th>
                  <th className="pb-2 pr-4 font-medium">Estado</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => (
                  <tr key={f.id} className="border-t border-ink/6">
                    <td className="truncate py-3 pr-4 font-medium text-ink">
                      {f.nombre}
                      {!f.activo ? (
                        <span className="ml-2 text-xs font-normal text-ink-3">
                          (inactivo)
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-right">{f.stock}</td>
                    <td className="py-3 pr-4 text-right">{f.stock_minimo}</td>
                    <td className="py-3 pr-4 text-right">{fmtMoney(f.valor_costo)}</td>
                    <td className="py-3 pr-4">
                      {f.alerta ? (
                        <Badge tone="warn">Stock bajo</Badge>
                      ) : (
                        <Badge tone="good">OK</Badge>
                      )}
                    </td>
                    <td className="py-3">
                      <AjusteForm productoId={f.id} nombre={f.nombre} stockActual={f.stock} />
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
