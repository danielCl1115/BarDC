import { notFound } from "next/navigation";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, Empty, PageHeader } from "@/components/ui";
import { fmtFecha } from "@/lib/format";
import { ProductGrid } from "./product-grid";
import { Ticket } from "./ticket";
import { Receipt } from "./receipt";
import type { Cuenta, CuentaItem, Producto } from "@/lib/types";

export default async function CuentaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePerfil();
  const supabase = await createClient();

  const { data: cuentaData } = await supabase
    .from("cuentas")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const cuenta = cuentaData as Cuenta | null;
  if (!cuenta) notFound();

  const abierta = cuenta.estado === "abierta";

  const [{ data: itemsData }, { data: productosData }] = await Promise.all([
    supabase
      .from("cuenta_items")
      .select("*")
      .eq("cuenta_id", id)
      .order("created_at"),
    abierta
      ? supabase
          .from("productos")
          .select("id, nombre, precio, stock")
          .eq("activo", true)
          .order("nombre")
      : Promise.resolve({ data: [] as Pick<Producto, "id" | "nombre" | "precio" | "stock">[] }),
  ]);

  const items = (itemsData ?? []) as CuentaItem[];
  const productos = (productosData ?? []) as Pick<
    Producto,
    "id" | "nombre" | "precio" | "stock"
  >[];

  return (
    <>
      <PageHeader
        title={cuenta.nombre_cliente}
        description={
          abierta
            ? `Abierta ${fmtFecha(cuenta.abierta_en)}`
            : `Cerrada ${fmtFecha(cuenta.cerrada_en)}`
        }
      >
        <Button href="/cuentas" variant="secondary" icon="arrowLeft">
          Volver
        </Button>
      </PageHeader>

      {abierta ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="order-2 min-w-0 flex-1 lg:order-1">
            <Card title="Toca un producto para agregarlo">
              {productos.length === 0 ? (
                <Empty>No hay productos activos. Créalos en Productos.</Empty>
              ) : (
                <ProductGrid cuentaId={id} productos={productos} />
              )}
            </Card>
          </div>
          <div className="order-1 lg:order-2 lg:w-[360px] lg:shrink-0">
            <Ticket
              cuentaId={id}
              nombreCliente={cuenta.nombre_cliente}
              items={items}
              total={cuenta.total}
            />
          </div>
        </div>
      ) : (
        <Receipt cuenta={cuenta} items={items} />
      )}
    </>
  );
}
