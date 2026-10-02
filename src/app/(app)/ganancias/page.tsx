import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { requireModulo } from "@/lib/modulos";
import {
  Badge,
  Card,
  Empty,
  Field,
  PageHeader,
  StatTile,
  buttonVariants,
  inputClass,
} from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";
import { GananciaProductosChart, GananciaTendenciaChart, MargenChart } from "@/components/charts";
import { fmtDiaYMD, fmtMoney } from "@/lib/format";
import { hoyYMD } from "@/lib/tz";
import {
  G_BUCKETS,
  G_PERIODOS,
  armarSerie,
  cargarPorPeriodo,
  cargarPorProducto,
  cargarStock,
  margenPct,
  rangoAnterior,
  resolverFiltros,
  sumarTotales,
  variacionPct,
  type GBucket,
} from "@/lib/ganancias";

const pct = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });
const num = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 3 });

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

/** "3 de sept – 2 de oct"; si el rango toca otro año distinto al actual, agrega el año. */
function rangoTexto(desde: string, hasta: string, hoy: string): string {
  const anio = hoy.slice(0, 4);
  const conAnio = desde.slice(0, 4) !== anio || hasta.slice(0, 4) !== anio;
  const f = (ymd: string) => (conAnio ? `${fmtDiaYMD(ymd)} ${ymd.slice(0, 4)}` : fmtDiaYMD(ymd));
  return desde === hasta ? f(desde) : `${f(desde)} – ${f(hasta)}`;
}

function tonoMargen(m: number): "crit" | "warn" | "neutral" | "good" {
  if (m < 0) return "crit";
  if (m < 15) return "warn";
  if (m < 30) return "neutral";
  return "good";
}

const NOMBRE_BUCKET: Record<GBucket, { uno: string; mejor: string }> = {
  dia: { uno: "día", mejor: "Mejor día" },
  semana: { uno: "semana", mejor: "Mejor semana" },
  mes: { uno: "mes", mejor: "Mejor mes" },
  anio: { uno: "año", mejor: "Mejor año" },
};

/** Anillo del margen: solo SVG, sin JavaScript en el cliente. */
function AnilloMargen({ valor }: { valor: number }) {
  const r = 50;
  const c = 2 * Math.PI * r;
  const llenado = (Math.min(Math.max(valor, 0), 100) / 100) * c;
  return (
    <div className="relative h-36 w-36 shrink-0 max-sm:mx-auto">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="11" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="white"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${llenado} ${c - llenado}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-semibold leading-none tracking-tight">{pct.format(valor)}%</span>
        <span className="mt-1 text-[11px] uppercase tracking-wider text-white/75">margen</span>
      </div>
    </div>
  );
}

function Delta({ actual, anterior, invertir = false }: { actual: number; anterior: number; invertir?: boolean }) {
  const v = variacionPct(actual, anterior);
  if (v === null || (anterior === 0 && actual === 0)) return <span className="text-white/60">sin comparación</span>;
  if (Math.abs(v) < 0.05) return <span className="text-white/75">igual que antes</span>;
  const sube = v > 0;
  const bueno = invertir ? !sube : sube;
  return (
    <span className={bueno ? "text-emerald-200" : "text-rose-200"}>
      {sube ? "▲" : "▼"} {pct.format(Math.abs(v))}%
    </span>
  );
}

function Hallazgo({
  icono,
  etiqueta,
  titulo,
  detalle,
  tono,
}: {
  icono: IconName;
  etiqueta: string;
  titulo: string;
  detalle: string;
  tono: "good" | "brand" | "warn";
}) {
  const color = {
    good: "bg-good/10 text-good",
    brand: "bg-brand-50 text-brand-600",
    warn: "bg-warn/15 text-warn",
  }[tono];
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon name={icono} size={18} />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-3">{etiqueta}</div>
        <div className="mt-0.5 truncate font-semibold text-ink" title={titulo}>
          {titulo}
        </div>
        <div className="text-xs text-ink-2">{detalle}</div>
      </div>
    </div>
  );
}

export default async function GananciasPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string; agrupar?: string }>;
}) {
  await requireAdmin();
  await requireModulo("ganancias");
  const sp = await searchParams;

  const hoy = hoyYMD();
  const { periodo, desde, hasta, bucket } = resolverFiltros(sp, hoy);
  const previo = rangoAnterior(desde, hasta);

  let datos;
  try {
    const [filas, filasPrevio, productos, stock] = await Promise.all([
      cargarPorPeriodo(desde, hasta, bucket),
      cargarPorPeriodo(previo.desde, previo.hasta, "anio"),
      cargarPorProducto(desde, hasta),
      cargarStock(),
    ]);
    datos = { filas, filasPrevio, productos, stock };
  } catch (e) {
    return (
      <>
        <PageHeader title="Ganancias" />
        <Empty>
          No se pudieron cargar las ganancias ({e instanceof Error ? e.message : "error desconocido"}). Si
          acabas de actualizar la plataforma, avisa al soporte para terminar de activar este módulo.
        </Empty>
      </>
    );
  }

  const { filas, filasPrevio, productos, stock } = datos;
  const tot = sumarTotales(filas);
  const ant = sumarTotales(filasPrevio);
  const serie = armarSerie(filas, desde, hasta, bucket, desde.slice(0, 4) !== hoy.slice(0, 4) || hasta.slice(0, 4) !== hoy.slice(0, 4));
  const hayVentas = tot.ventas > 0;

  const mejor = [...serie].filter((p) => p.ventas > 0).sort((a, b) => b.ganancia - a.ganancia)[0];
  const gananciaPorCuenta = tot.cuentas > 0 ? tot.ganancia / tot.cuentas : 0;
  const ticket = tot.cuentas > 0 ? tot.ventas / tot.cuentas : 0;

  const filasProducto = productos.map((p) => {
    const ganancia = p.ventas - p.costo;
    return { ...p, ganancia, margen: margenPct(p.ventas, ganancia) };
  });
  const sinCosto = filasProducto.filter((p) => p.costo === 0 && p.ventas > 0);
  const top = filasProducto.slice(0, 10);
  const estrella = filasProducto.find((p) => p.ventas > 0 && p.ganancia > 0);
  const conCosto = filasProducto.filter((p) => p.ventas > 0 && p.costo > 0);
  const mayorMargen = [...conCosto].sort((a, b) => b.margen - a.margen)[0];
  const menorMargen = [...conCosto].sort((a, b) => a.margen - b.margen)[0];

  const partCosto = hayVentas ? Math.min(Math.max((tot.costo / tot.ventas) * 100, 0), 100) : 0;
  const partGanancia = hayVentas ? Math.max(100 - partCosto, 0) : 0;

  const etiquetaPeriodo = rangoTexto(desde, hasta, hoy);
  const nb = NOMBRE_BUCKET[bucket];

  return (
    <>
      <PageHeader
        title="Ganancias"
        description={`Lo que realmente ganó el negocio · ${etiquetaPeriodo}`}
      />

      <Card title="Filtros">
        <div className="flex flex-wrap gap-2">
          {G_PERIODOS.map((p) => (
            <Link key={p.valor} href={`/ganancias${qs({ periodo: p.valor })}`} className={pill(periodo === p.valor)}>
              {p.etiqueta}
            </Link>
          ))}
        </div>

        {periodo === "personalizado" ? (
          <form method="get" className="mt-4 flex flex-wrap items-end gap-3 border-t border-ink/8 pt-4">
            <input type="hidden" name="periodo" value="personalizado" />
            <Field label="Desde">
              <input type="date" name="desde" defaultValue={desde} max={hoy} className={inputClass} />
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
            {G_BUCKETS.map((b) => (
              <Link
                key={b.valor}
                href={`/ganancias${qs({
                  periodo,
                  desde: periodo === "personalizado" ? desde : undefined,
                  hasta: periodo === "personalizado" ? hasta : undefined,
                  agrupar: b.valor,
                })}`}
                className={pill(bucket === b.valor)}
              >
                {b.etiqueta}
              </Link>
            ))}
          </div>

          <a
            href={`/ganancias/exportar${qs({ periodo, desde, hasta, agrupar: bucket })}`}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${buttonVariants.secondary}`}
          >
            <Icon name="download" size={16} />
            Exportar a Excel
          </a>
        </div>
      </Card>

      {sinCosto.length > 0 ? (
        <div className="rounded-xl border border-warn/30 bg-warn/10 p-4 text-sm text-ink">
          <p className="font-semibold text-warn">
            {sinCosto.length === 1 ? "1 producto vendido no tiene costo" : `${sinCosto.length} productos vendidos no tienen costo`}
          </p>
          <p className="mt-1 text-ink-2">
            Sin costo, su ganancia aparece igual a la venta y el total se ve más alto de lo real:{" "}
            <span className="font-medium text-ink">
              {sinCosto
                .slice(0, 5)
                .map((p) => p.nombre)
                .join(", ")}
              {sinCosto.length > 5 ? ` y ${sinCosto.length - 5} más` : ""}
            </span>
            . {sinCosto.length === 1 ? "Ponle" : "Ponles"} el costo en{" "}
            <Link href="/productos" className="font-medium text-brand-700 underline">
              Productos
            </Link>{" "}
            o registra una compra.
          </p>
        </div>
      ) : null}

      <section
        className={`relative overflow-hidden rounded-2xl p-6 text-white sm:p-8 ${
          tot.ganancia < 0
            ? "bg-gradient-to-br from-[#be123c] via-[#9f1239] to-[#881337] shadow-[0_14px_40px_-18px_rgba(190,18,60,0.7)]"
            : "bg-gradient-to-br from-[#0e7490] via-[#0f766e] to-[#115e59] shadow-[0_14px_40px_-18px_rgba(13,148,136,0.75)]"
        }`}
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/80">
              {tot.ganancia < 0 ? "Pérdida del periodo" : "Ganancia del periodo"} · {etiquetaPeriodo}
            </p>
            <p className="mt-3 text-[44px] font-semibold leading-none tracking-tight sm:text-[60px]">
              {fmtMoney(tot.ganancia)}
            </p>
            <p className="mt-4 inline-flex flex-wrap items-center gap-x-2 rounded-full bg-white/15 px-3 py-1 text-sm backdrop-blur-sm">
              {ant.ventas === 0 ? (
                <span className="text-white/80">Sin ventas en el periodo anterior</span>
              ) : (
                <>
                  <Delta actual={tot.ganancia} anterior={ant.ganancia} />
                  <span className="text-white/70">vs periodo anterior</span>
                </>
              )}
              <span className="text-white/60">({rangoTexto(previo.desde, previo.hasta, hoy)})</span>
            </p>
          </div>
          <AnilloMargen valor={tot.margen} />
        </div>

        <div className="relative mt-7">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/15">
            <div className="bg-white/35" style={{ width: `${partCosto}%` }} title={`Costo ${fmtMoney(tot.costo)}`} />
            <div className="bg-white" style={{ width: `${partGanancia}%` }} title={`Ganancia ${fmtMoney(tot.ganancia)}`} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-white/75">
            <span>Costo {pct.format(partCosto)}%</span>
            <span>Ganancia {pct.format(partGanancia)}%</span>
          </div>
        </div>

        <dl className="relative mt-6 grid grid-cols-3 gap-3 border-t border-white/20 pt-5 sm:gap-6">
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/70">Ventas</dt>
            <dd className="mt-1 text-lg font-semibold sm:text-2xl">{fmtMoney(tot.ventas)}</dd>
            <dd className="mt-0.5 text-xs">
              <Delta actual={tot.ventas} anterior={ant.ventas} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/70">Costo</dt>
            <dd className="mt-1 text-lg font-semibold sm:text-2xl">{fmtMoney(tot.costo)}</dd>
            <dd className="mt-0.5 text-xs">
              <Delta actual={tot.costo} anterior={ant.costo} invertir />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/70">Cuentas cobradas</dt>
            <dd className="mt-1 text-lg font-semibold sm:text-2xl">{tot.cuentas}</dd>
            <dd className="mt-0.5 text-xs">
              <Delta actual={tot.cuentas} anterior={ant.cuentas} />
            </dd>
          </div>
        </dl>
      </section>

      {estrella ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Hallazgo
            icono="check"
            tono="good"
            etiqueta="Producto estrella"
            titulo={estrella.nombre}
            detalle={`Dejó ${fmtMoney(estrella.ganancia)} · ${num.format(estrella.cantidad)} vendidos`}
          />
          {mayorMargen ? (
            <Hallazgo
              icono="trend"
              tono="brand"
              etiqueta="Mayor margen"
              titulo={mayorMargen.nombre}
              detalle={`${pct.format(mayorMargen.margen)}% de lo que vendes queda como ganancia`}
            />
          ) : null}
          {menorMargen && menorMargen.producto_id !== mayorMargen?.producto_id ? (
            <Hallazgo
              icono="alert"
              tono={menorMargen.margen < 15 ? "warn" : "brand"}
              etiqueta="Revisa su precio"
              titulo={menorMargen.nombre}
              detalle={`Solo deja ${pct.format(menorMargen.margen)}% de margen`}
            />
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Venta promedio"
          value={fmtMoney(ticket)}
          hint={tot.cuentas > 0 ? `En ${tot.cuentas} cuenta${tot.cuentas === 1 ? "" : "s"}` : "Sin ventas en el periodo"}
          icon="receipt"
        />
        <StatTile
          label="Ganancia por cuenta"
          value={fmtMoney(gananciaPorCuenta)}
          hint="Lo que deja, en promedio, cada cuenta"
          icon="trend"
        />
        <StatTile
          label={nb.mejor}
          value={mejor ? fmtMoney(mejor.ganancia) : "—"}
          hint={mejor ? mejor.rango : "Aún no hay ventas"}
          tone="good"
          icon="check"
        />
        <StatTile
          label="Ganancia esperada del stock"
          value={fmtMoney(stock.gananciaEsperada)}
          hint={`Si vendes todo lo que tienes (${fmtMoney(stock.valorCosto)} invertidos en ${stock.productos} producto${stock.productos === 1 ? "" : "s"})`}
          icon="layers"
        />
      </div>

      {!hayVentas ? (
        <Card>
          <Empty>No hay ventas cobradas en este periodo. Prueba con otro rango de fechas.</Empty>
        </Card>
      ) : (
        <>
          <Card
            title={`Ventas, costo y ganancia por ${nb.uno}`}
            description="Cada barra es lo vendido: la parte gris es lo que costó y la verde lo que quedó"
          >
            <GananciaTendenciaChart data={serie} />
          </Card>

          {serie.length > 1 ? (
            <Card
              title="Margen en el tiempo"
              description="Qué porcentaje de lo vendido se queda como ganancia. Si baja, algo está costando más o se está vendiendo más barato"
            >
              <MargenChart data={serie} promedio={tot.margen} />
            </Card>
          ) : null}

          <Card
            title="Ganancia por producto"
            description="Lo que cada producto aportó en el periodo, de más a menos"
          >
            {top.length > 0 ? <GananciaProductosChart data={top} /> : null}

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-ink-3">
                    <th className="pb-2 pr-4 font-medium">Producto</th>
                    <th className="pb-2 pr-4 text-right font-medium">Vendidos</th>
                    <th className="pb-2 pr-4 text-right font-medium">Ventas</th>
                    <th className="pb-2 pr-4 text-right font-medium">Costo</th>
                    <th className="pb-2 pr-4 text-right font-medium">Ganancia</th>
                    <th className="pb-2 text-right font-medium">Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {filasProducto.slice(0, 50).map((p) => (
                    <tr key={p.producto_id} className="border-t border-ink/6">
                      <td className="py-3 pr-4 font-medium text-ink">{p.nombre}</td>
                      <td className="py-3 pr-4 text-right">{num.format(p.cantidad)}</td>
                      <td className="py-3 pr-4 text-right">{fmtMoney(p.ventas)}</td>
                      <td className="py-3 pr-4 text-right">{fmtMoney(p.costo)}</td>
                      <td className="py-3 pr-4 text-right font-medium text-ink">{fmtMoney(p.ganancia)}</td>
                      <td className="py-3 text-right">
                        {p.costo === 0 ? (
                          <Badge tone="warn">Sin costo</Badge>
                        ) : (
                          <Badge tone={tonoMargen(p.margen)}>{pct.format(p.margen)}%</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filasProducto.length > 50 ? (
                <p className="mt-3 text-xs text-ink-3">
                  Mostrando los 50 que más ganancia dejaron de {filasProducto.length}.
                </p>
              ) : null}
            </div>
          </Card>

          <Card
            title={`Detalle por ${nb.uno}`}
            description={
              serie.some((p) => p.cuentas === 0)
                ? `Solo se muestran los periodos con ventas (${serie.filter((p) => p.cuentas > 0).length} de ${serie.length})`
                : undefined
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-ink-3">
                    <th className="pb-2 pr-4 font-medium">{nb.uno.charAt(0).toUpperCase() + nb.uno.slice(1)}</th>
                    <th className="pb-2 pr-4 text-right font-medium">Cuentas</th>
                    <th className="pb-2 pr-4 text-right font-medium">Ventas</th>
                    <th className="pb-2 pr-4 text-right font-medium">Costo</th>
                    <th className="pb-2 pr-4 text-right font-medium">Ganancia</th>
                    <th className="pb-2 text-right font-medium">Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {[...serie]
                    .filter((p) => p.cuentas > 0)
                    .reverse()
                    .map((p) => (
                      <tr key={p.clave} className="border-t border-ink/6">
                        <td className="py-3 pr-4">{p.rango}</td>
                        <td className="py-3 pr-4 text-right">{p.cuentas}</td>
                        <td className="py-3 pr-4 text-right">{fmtMoney(p.ventas)}</td>
                        <td className="py-3 pr-4 text-right">{fmtMoney(p.costo)}</td>
                        <td className="py-3 pr-4 text-right font-medium text-ink">{fmtMoney(p.ganancia)}</td>
                        <td className="py-3 text-right">
                          {p.margen === null ? (
                            <span className="text-ink-3">—</span>
                          ) : (
                            <Badge tone={tonoMargen(p.margen)}>{pct.format(p.margen)}%</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-ink/15 font-semibold text-ink">
                    <td className="pt-3 pr-4">Total</td>
                    <td className="pt-3 pr-4 text-right">{tot.cuentas}</td>
                    <td className="pt-3 pr-4 text-right">{fmtMoney(tot.ventas)}</td>
                    <td className="pt-3 pr-4 text-right">{fmtMoney(tot.costo)}</td>
                    <td className="pt-3 pr-4 text-right">{fmtMoney(tot.ganancia)}</td>
                    <td className="pt-3 text-right">{pct.format(tot.margen)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}

      <p className="text-xs leading-relaxed text-ink-3">
        <span className="font-medium text-ink-2">Cómo se calcula:</span> ganancia = lo vendido − lo que costó.
        El costo de cada producto es el de tu última compra registrada, y queda guardado al cobrar cada cuenta,
        así que cambiar un costo después no altera las ventas pasadas. Las cuentas cobradas antes de activar
        este módulo usan el costo que tenía el producto en ese momento de la activación. Los días se cuentan
        con hora de Colombia y la semana empieza el lunes.
      </p>
    </>
  );
}
