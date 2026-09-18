import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { requireModulo } from "@/lib/modulos";
import { Card, Empty, PageHeader, StatTile, Badge, Field, inputClass, buttonVariants } from "@/components/ui";
import { Icon } from "@/components/icons";
import { PagoPorDiaChart } from "@/components/charts";
import { fmtMoney, fmtDiaYMD } from "@/lib/format";
import { metodoLabel, metodoTone } from "@/lib/metodo-pago";
import { hoyYMD, diasEntre } from "@/lib/tz";
import {
  PERIODOS,
  MAX_DIAS_EXPORTAR,
  type Periodo,
  type Bucket,
  calcularRango,
  bucketAuto,
  cargarCuentasCerradas,
  agregarReporte,
} from "@/lib/reportes";
import type { MetodoPago } from "@/lib/types";

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

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string; agrupar?: string }>;
}) {
  await requireAdmin();
  await requireModulo("reportes");
  const sp = await searchParams;

  const periodo: Periodo = PERIODOS.some((p) => p.valor === sp.periodo)
    ? (sp.periodo as Periodo)
    : "30d";
  const hoy = hoyYMD();
  const { desde, hasta } = calcularRango(periodo, hoy, sp.desde, sp.hasta);
  const bucket: Bucket =
    sp.agrupar === "dia" || sp.agrupar === "mes" || sp.agrupar === "anio"
      ? sp.agrupar
      : bucketAuto(desde, hasta);

  const cuentas = await cargarCuentasCerradas(desde, hasta);
  const { porMetodo, filas, totalPeriodo } = agregarReporte(cuentas, bucket);

  const dias = diasEntre(desde, hasta);
  const puedeExportar = dias <= MAX_DIAS_EXPORTAR;
  const rangoTexto = desde === hasta ? fmtDiaYMD(desde) : `${fmtDiaYMD(desde)} – ${fmtDiaYMD(hasta)}`;
  const nombreBucket = bucket === "dia" ? "Día" : bucket === "mes" ? "Mes" : "Año";

  return (
    <>
      <PageHeader title="Reportes" description={`Ventas del periodo: ${rangoTexto}`} />

      <Card title="Filtros">
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <Link key={p.valor} href={`/reportes${qs({ periodo: p.valor })}`} className={pill(periodo === p.valor)}>
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/8 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-ink-3">Agrupar por:</span>
            {(["dia", "mes", "anio"] as Bucket[]).map((b) => (
              <Link
                key={b}
                href={`/reportes${qs({ periodo, desde: periodo === "personalizado" ? desde : undefined, hasta: periodo === "personalizado" ? hasta : undefined, agrupar: b })}`}
                className={pill(bucket === b)}
              >
                {b === "dia" ? "Día" : b === "mes" ? "Mes" : "Año"}
              </Link>
            ))}
          </div>

          {puedeExportar ? (
            <a
              href={`/reportes/exportar${qs({ periodo, desde, hasta, agrupar: bucket })}`}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total del periodo" value={fmtMoney(totalPeriodo)} />
        <StatTile label="Efectivo" value={fmtMoney(porMetodo.efectivo.total)} />
        <StatTile label="Transferencia" value={fmtMoney(porMetodo.transferencia.total)} />
        <StatTile label="Mixto" value={fmtMoney(porMetodo.mixto.total)} />
      </div>

      <Card title="Ventas por método de pago" description={`Agrupado por ${nombreBucket.toLowerCase()}`}>
        {filas.length === 0 ? (
          <Empty>No hay cuentas cerradas en este periodo.</Empty>
        ) : (
          <PagoPorDiaChart data={filas} />
        )}
      </Card>

      <Card
        title="Cuentas por método de pago"
        description="Cada cuenta cuenta una sola vez, en su método real"
      >
        {cuentas.length === 0 ? (
          <Empty>No hay cuentas cerradas en este periodo.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {(["efectivo", "transferencia", "mixto"] as MetodoPago[]).map((m) => (
              <div key={m} className="rounded-lg border border-ink/8 bg-plane p-4">
                <Badge tone={metodoTone(m)}>{metodoLabel(m)}</Badge>
                <div className="mt-2 text-xl font-bold text-ink">{fmtMoney(porMetodo[m].total)}</div>
                <div className="text-xs text-ink-3">
                  {porMetodo[m].cuentas} cuenta{porMetodo[m].cuentas === 1 ? "" : "s"}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={`Detalle por ${nombreBucket.toLowerCase()}`}>
        {filas.length === 0 ? (
          <Empty>No hay cuentas cerradas en este periodo.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col />
                <col className="w-24" />
                <col className="w-32" />
                <col className="w-32" />
                <col className="w-28" />
                <col className="w-32" />
              </colgroup>
              <thead>
                <tr className="text-left text-ink-3">
                  <th className="pb-2 pr-4 font-medium">{nombreBucket}</th>
                  <th className="pb-2 pr-4 text-right font-medium">Cuentas</th>
                  <th className="pb-2 pr-4 text-right font-medium">Efectivo</th>
                  <th className="pb-2 pr-4 text-right font-medium">Transferencia</th>
                  <th className="pb-2 pr-4 text-right font-medium">Mixto</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {[...filas].reverse().map((f) => (
                  <tr key={f.clave} className="border-t border-ink/6">
                    <td className="py-3 pr-4">{f.etiqueta}</td>
                    <td className="py-3 pr-4 text-right">{f.cuentas}</td>
                    <td className="py-3 pr-4 text-right">{fmtMoney(f.efectivo)}</td>
                    <td className="py-3 pr-4 text-right">{fmtMoney(f.transferencia)}</td>
                    <td className="py-3 pr-4 text-right">{fmtMoney(f.mixto)}</td>
                    <td className="py-3 text-right font-medium text-ink">
                      {fmtMoney(f.efectivo + f.transferencia + f.mixto)}
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
