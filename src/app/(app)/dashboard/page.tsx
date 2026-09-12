import Link from "next/link";
import { requirePerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button, Card, Empty, PageHeader, StatTile, Badge } from "@/components/ui";
import { VentasTrendChart, StockChart } from "@/components/charts";
import { fmtMoney } from "@/lib/format";
import { hoyYMD } from "@/lib/tz";
import type { Cuenta, InventarioFila, ReporteDia } from "@/lib/types";

export default async function DashboardPage() {
  const perfil = await requirePerfil();
  const supabase = await createClient();

  const { data: abiertasData } = await supabase
    .from("cuentas")
    .select("*")
    .eq("estado", "abierta")
    .order("abierta_en", { ascending: true });
  const abiertas = (abiertasData ?? []) as Cuenta[];

  if (perfil.rol === "operador") {
    return (
      <>
        <PageHeader title={`Hola, ${perfil.nombre}`} description="Cuentas abiertas">
          <Button href="/cuentas" icon="plus">
            Nueva cuenta
          </Button>
        </PageHeader>

        {abiertas.length === 0 ? (
          <Empty>No hay cuentas abiertas.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {abiertas.map((c) => (
              <Link
                key={c.id}
                href={`/cuentas/${c.id}`}
                className="rounded-xl border-2 border-brand-100 bg-brand-50 p-4 transition-colors hover:border-brand-300 hover:bg-brand-100/70"
              >
                <div className="truncate text-base font-semibold text-ink">
                  {c.nombre_cliente}
                </div>
                <div className="mt-3 text-xl font-bold text-brand-700">
                  {fmtMoney(c.total)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </>
    );
  }

  // ---- Vista de administrador ----
  const [{ data: reporteData }, { data: inventarioData }] = await Promise.all([
    supabase.from("v_reporte_diario").select("*").limit(14),
    supabase.from("v_inventario").select("*").eq("activo", true),
  ]);
  const reporte = (reporteData ?? []) as ReporteDia[];
  const inventario = (inventarioData ?? []) as InventarioFila[];

  const hoy = hoyYMD();
  const ventasHoy = reporte.find((r) => r.dia === hoy);
  const enAlerta = inventario.filter((f) => f.alerta);

  // El gráfico de tendencia se lee de izquierda (más viejo) a derecha (hoy)
  const tendencia = [...reporte].reverse();
  // El gráfico de stock muestra primero lo más crítico
  const stockOrdenado = [...inventario]
    .sort((a, b) => a.stock - a.stock_minimo - (b.stock - b.stock_minimo))
    .slice(0, 8);

  return (
    <>
      <PageHeader title="Inicio" description="Resumen del negocio">
        <Button href="/reportes" variant="secondary" icon="chart">
          Ver reportes
        </Button>
        <Button href="/cuentas" icon="plus">
          Nueva cuenta
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Ventas de hoy"
          value={fmtMoney(ventasHoy?.total ?? 0)}
          tone="brand"
        />
        <StatTile
          label="Cuentas abiertas"
          value={abiertas.length}
          tone="brand"
          icon="receipt"
        />
        <StatTile
          label="Productos con stock bajo"
          value={enAlerta.length}
          tone={enAlerta.length > 0 ? "warn" : "good"}
        />
      </div>

      <Card title="Ventas" description="Últimos 14 días (cuentas cerradas)">
        {tendencia.length === 0 ? (
          <Empty>Aún no hay ventas registradas.</Empty>
        ) : (
          <VentasTrendChart data={tendencia} />
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          title="Stock en alerta"
          description="Los 8 productos más cerca (o por debajo) de su mínimo"
        >
          {stockOrdenado.length === 0 ? (
            <Empty>No hay productos activos todavía.</Empty>
          ) : (
            <StockChart data={stockOrdenado} />
          )}
        </Card>

        <Card title="Cuentas abiertas ahora">
          {abiertas.length === 0 ? (
            <Empty>No hay cuentas abiertas.</Empty>
          ) : (
            <ul className="space-y-1">
              {abiertas.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/cuentas/${c.id}`}
                    className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-plane"
                  >
                    <span className="text-ink">{c.nombre_cliente}</span>
                    <span className="font-medium text-ink-2">
                      {fmtMoney(c.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {enAlerta.length > 0 ? (
            <div className="mt-4 border-t border-ink/8 pt-3">
              <div className="mb-2 text-xs font-medium text-ink-3">
                Bajo mínimo
              </div>
              <div className="flex flex-wrap gap-1.5">
                {enAlerta.slice(0, 6).map((p) => (
                  <Badge key={p.id} tone="warn">
                    {p.nombre}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </>
  );
}
