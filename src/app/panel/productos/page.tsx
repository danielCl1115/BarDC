import Link from "next/link";
import { requireSuperAdmin } from "@/lib/super-admin";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";
import { Card, PageHeader, Empty, Field, inputClass, buttonVariants } from "@/components/ui";
import { TopProductosChart } from "@/components/charts";
import { fmtMoney, fmtCantidad, fmtDiaYMD } from "@/lib/format";
import { hoyYMD, inicioDiaUTC, sumarDias } from "@/lib/tz";
import { PERIODOS, type Periodo, calcularRango } from "@/lib/periodos";

type ProductoAgregado = {
  nombre: string;
  cantidad: number;
  ingresos: number;
  precioMin: number;
  precioMax: number;
  costoMin: number;
  costoMax: number;
  bares: Set<string>;
};

function fmtRango(min: number, max: number): string {
  if (min === Infinity) return "—";
  if (min === max) return fmtMoney(min);
  return `${fmtMoney(min)} – ${fmtMoney(max)}`;
}

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

export default async function PanelProductosPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string }>;
}) {
  await requireSuperAdmin();

  if (!isAdminClientConfigured) {
    return (
      <>
        <PageHeader title="Qué se vende" description="Entre todos los bares" />
        <Empty>Falta SUPABASE_SERVICE_ROLE_KEY.</Empty>
      </>
    );
  }

  const sp = await searchParams;
  const periodo: Periodo = PERIODOS.some((p) => p.valor === sp.periodo)
    ? (sp.periodo as Periodo)
    : "30d";
  const hoy = hoyYMD();
  const { desde, hasta } = calcularRango(periodo, hoy, sp.desde, sp.hasta);
  const rangoTexto = desde === hasta ? fmtDiaYMD(desde) : `${fmtDiaYMD(desde)} – ${fmtDiaYMD(hasta)}`;

  const admin = createAdminClient();

  const { data: baresData } = await admin.from("bares").select("id, nombre");
  const nombrePorBar = new Map((baresData ?? []).map((b) => [b.id, b.nombre]));

  const { data: cuentasData } = await admin
    .from("cuentas")
    .select("id, bar_id")
    .eq("estado", "cerrada")
    .gte("cerrada_en", inicioDiaUTC(desde).toISOString())
    .lt("cerrada_en", inicioDiaUTC(sumarDias(hasta, 1)).toISOString());

  const idsCerradas = (cuentasData ?? []).map((c) => c.id);
  const productosAgregados = new Map<string, ProductoAgregado>();

  if (idsCerradas.length > 0) {
    const { data: itemsData } = await admin
      .from("cuenta_items")
      .select("nombre_producto, cantidad, subtotal, bar_id")
      .in("cuenta_id", idsCerradas);

    for (const it of itemsData ?? []) {
      const key = it.nombre_producto.trim().toLowerCase();
      const p = productosAgregados.get(key) ?? {
        nombre: it.nombre_producto,
        cantidad: 0,
        ingresos: 0,
        precioMin: Infinity,
        precioMax: 0,
        costoMin: Infinity,
        costoMax: 0,
        bares: new Set<string>(),
      };
      p.cantidad += Number(it.cantidad ?? 0);
      p.ingresos += Number(it.subtotal ?? 0);
      p.bares.add(it.bar_id);
      productosAgregados.set(key, p);
    }
  }

  const { data: productosData } = await admin.from("productos").select("nombre, costo, precio");
  for (const prod of productosData ?? []) {
    const key = prod.nombre.trim().toLowerCase();
    const p = productosAgregados.get(key);
    if (!p) continue;
    const costo = Number(prod.costo ?? 0);
    const precio = Number(prod.precio ?? 0);
    p.costoMin = Math.min(p.costoMin, costo);
    p.costoMax = Math.max(p.costoMax, costo);
    p.precioMin = Math.min(p.precioMin, precio);
    p.precioMax = Math.max(p.precioMax, precio);
  }

  const topProductos = Array.from(productosAgregados.values()).sort(
    (a, b) => b.cantidad - a.cantidad,
  );
  const paraGrafico = topProductos.slice(0, 10).map((p) => ({ nombre: p.nombre, cantidad: p.cantidad }));

  return (
    <>
      <PageHeader
        title="Qué se vende"
        description="Entre todos los bares · te dice qué te conviene ofrecer más barato como distribuidor"
      />

      <Card title="Periodo">
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <Link
              key={p.valor}
              href={`/panel/productos${qs({ periodo: p.valor })}`}
              className={pill(periodo === p.valor)}
            >
              {p.etiqueta}
            </Link>
          ))}
        </div>

        {periodo === "personalizado" ? (
          <form
            method="get"
            className="mt-4 flex flex-wrap items-end gap-3 border-t border-ink/8 pt-4"
          >
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
        ) : (
          <p className="mt-3 text-xs text-ink-3">{rangoTexto}</p>
        )}
      </Card>

      <Card title="Top 10 por cantidad vendida">
        {paraGrafico.length === 0 ? (
          <Empty>Todavía no hay ventas en este periodo.</Empty>
        ) : (
          <TopProductosChart data={paraGrafico} />
        )}
      </Card>

      <Card title="Productos más vendidos">
        {topProductos.length === 0 ? (
          <Empty>Todavía no hay ventas registradas en este periodo.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-3">
                  <th className="pb-2 pr-3" rowSpan={2}>Producto</th>
                  <th className="pb-2 pr-3" rowSpan={2}>Cantidad vendida</th>
                  <th className="pb-2 pr-3" rowSpan={2}>Ingresos generados</th>
                  <th className="border-l border-line px-3 pb-1 pt-0 text-center" colSpan={2}>
                    Por bar
                  </th>
                  <th className="pb-2" rowSpan={2}>En qué bares</th>
                </tr>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-3">
                  <th className="border-l border-line px-3 pb-2">A cuánto lo vende</th>
                  <th className="px-3 pb-2">A cuánto lo consigue</th>
                </tr>
              </thead>
              <tbody>
                {topProductos.map((p) => (
                  <tr key={p.nombre} className="border-b border-line last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-ink">{p.nombre}</td>
                    <td className="py-2.5 pr-3 text-ink-2">{fmtCantidad(p.cantidad)}</td>
                    <td className="py-2.5 pr-3 text-ink-2">{fmtMoney(p.ingresos)}</td>
                    <td className="border-l border-line px-3 py-2.5 text-ink-2">
                      {fmtRango(p.precioMin, p.precioMax)}
                    </td>
                    <td className="px-3 py-2.5 text-ink-2">{fmtRango(p.costoMin, p.costoMax)}</td>
                    <td className="py-2.5 text-ink-2">
                      {Array.from(p.bares)
                        .map((id) => nombrePorBar.get(id) ?? "—")
                        .join(", ")}
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
