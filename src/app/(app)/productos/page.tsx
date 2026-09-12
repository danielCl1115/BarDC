import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Empty, PageHeader, Badge } from "@/components/ui";
import { ToggleSwitch } from "@/components/toggle-switch";
import { fmtMoney } from "@/lib/format";
import { NuevoProducto, EditarProducto, EliminarProducto } from "./forms";
import { toggleActivo } from "./actions";
import type { Producto } from "@/lib/types";

export default async function ProductosPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("productos")
    .select("*")
    .order("nombre");
  const productos = (data ?? []) as Producto[];

  return (
    <>
      <PageHeader
        title="Productos"
        description="Catálogo con costo, precio y stock mínimo"
      />

      <Card title="Nuevo producto">
        <NuevoProducto />
      </Card>

      <Card
        title="Catálogo"
        action={
          <Badge tone={productos.length > 0 ? "brand" : "neutral"}>
            {productos.length}
          </Badge>
        }
      >
        {productos.length === 0 ? (
          <Empty>Todavía no hay productos.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <colgroup>
                <col />
                <col className="w-24" />
                <col className="w-24" />
                <col className="w-16" />
                <col className="w-16" />
                <col className="w-28" />
                <col className="w-20" />
              </colgroup>
              <thead>
                <tr className="text-left text-ink-3">
                  <th className="pb-2 pr-4 font-medium">Nombre</th>
                  <th className="pb-2 pr-4 text-right font-medium">Costo</th>
                  <th className="pb-2 pr-4 text-right font-medium">Precio</th>
                  <th className="pb-2 pr-4 text-right font-medium">Stock</th>
                  <th className="pb-2 pr-4 text-right font-medium">Mínimo</th>
                  <th className="pb-2 pr-4 font-medium">Activo</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id} className="border-t border-ink/6 align-top">
                    <td className="truncate py-3 pr-4 font-medium text-ink">
                      {p.nombre}
                    </td>
                    <td className="py-3 pr-4 text-right">{fmtMoney(p.costo)}</td>
                    <td className="py-3 pr-4 text-right">{fmtMoney(p.precio)}</td>
                    <td className="py-3 pr-4 text-right">{p.stock}</td>
                    <td className="py-3 pr-4 text-right">{p.stock_minimo}</td>
                    <td className="py-3 pr-4">
                      <form action={toggleActivo} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="activo" value={String(p.activo)} />
                        <ToggleSwitch
                          checked={p.activo}
                          label={p.activo ? "Desactivar" : "Activar"}
                        />
                        <span className={p.activo ? "text-ink-2" : "text-ink-3"}>
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </form>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-0.5">
                        <EditarProducto producto={p} />
                        <EliminarProducto producto={p} />
                      </div>
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
