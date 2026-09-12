import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Empty, PageHeader, Badge } from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";
import { fmtFecha, fmtMoney, fmtCantidad } from "@/lib/format";
import { metodoLabel, metodoTone } from "@/lib/metodo-pago";
import type { HistorialEntrada, MetodoPago } from "@/lib/types";

const ACCION_META: Record<string, { etiqueta: string; icon: IconName; tono: keyof typeof ICONO_TONO }> = {
  abrir_cuenta: { etiqueta: "Abrió cuenta", icon: "receipt", tono: "brand" },
  agregar_item: { etiqueta: "Agregó producto", icon: "plus", tono: "good" },
  quitar_item: { etiqueta: "Quitó producto", icon: "trash", tono: "crit" },
  actualizar_cantidad: { etiqueta: "Actualizó cantidad", icon: "pencil", tono: "brand" },
  cerrar_cuenta: { etiqueta: "Cerró cuenta", icon: "check", tono: "good" },
  reabrir_cuenta: { etiqueta: "Reabrió cuenta", icon: "undo", tono: "warn" },
  registrar_compra: { etiqueta: "Registró compra", icon: "truck", tono: "brand" },
  ajustar_inventario: { etiqueta: "Ajustó inventario", icon: "layers", tono: "warn" },
};

const ICONO_TONO = {
  brand: "bg-brand-50 text-brand-600",
  good: "bg-good/10 text-good",
  warn: "bg-warn/15 text-[#8a5a06]",
  crit: "bg-crit/10 text-crit",
  neutral: "bg-ink/6 text-ink-2",
};

export default async function HistorialPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data }, { data: productosData }] = await Promise.all([
    supabase
      .from("historial")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("productos").select("id, nombre"),
  ]);
  const filas = (data ?? []) as HistorialEntrada[];
  const productos = new Map((productosData ?? []).map((p) => [p.id as string, p.nombre as string]));

  return (
    <>
      <PageHeader
        title="Historial"
        description="Quién hizo cada acción (últimas 200)"
      />

      <Card>
        {filas.length === 0 ? (
          <Empty>Sin actividad todavía.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-40" />
                <col className="w-32" />
                <col className="w-48" />
                <col />
              </colgroup>
              <thead>
                <tr className="text-left text-ink-3">
                  <th className="pb-2 pr-4 font-medium">Fecha</th>
                  <th className="pb-2 pr-4 font-medium">Usuario</th>
                  <th className="pb-2 pr-4 font-medium">Acción</th>
                  <th className="pb-2 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f) => {
                  const meta = ACCION_META[f.accion];
                  return (
                    <tr key={f.id} className="border-t border-ink/6 align-top">
                      <td className="whitespace-nowrap py-3 pr-4 text-ink-2">
                        {fmtFecha(f.created_at)}
                      </td>
                      <td className="truncate py-3 pr-4 text-ink">{f.actor_nombre ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${ICONO_TONO[meta?.tono ?? "neutral"]}`}
                          >
                            <Icon name={meta?.icon ?? "clock"} size={14} />
                          </span>
                          <span className="truncate text-ink">{meta?.etiqueta ?? f.accion}</span>
                        </div>
                      </td>
                      <td className="py-3 text-ink-2">
                        <Detalle fila={f} productos={productos} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function Detalle({
  fila,
  productos,
}: {
  fila: HistorialEntrada;
  productos: Map<string, string>;
}) {
  const d = (fila.detalle ?? {}) as Record<string, unknown>;
  const texto = (v: unknown) => (v == null ? "—" : String(v));
  const num = (v: unknown) => Number(v ?? 0);

  switch (fila.accion) {
    case "abrir_cuenta":
      return (
        <span>
          Cliente <span className="font-medium text-ink">{texto(d.cliente)}</span>
        </span>
      );

    case "agregar_item":
      return (
        <span>
          <span className="font-semibold text-good">+{fmtCantidad(num(d.cantidad))}</span>{" "}
          <span className="text-ink">{texto(d.producto)}</span>
        </span>
      );

    case "quitar_item":
      return <span className="text-ink">{texto(d.producto)}</span>;

    case "actualizar_cantidad":
      return (
        <span>
          <span className="text-ink">{texto(d.producto)}</span>{" "}
          <span className="text-ink-3">→</span>{" "}
          <span className="font-semibold text-ink">{fmtCantidad(num(d.cantidad))}</span>
        </span>
      );

    case "cerrar_cuenta": {
      const metodo = (d.metodo as MetodoPago | undefined) ?? null;
      return (
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={metodoTone(metodo)}>{metodoLabel(metodo)}</Badge>
          <span className="font-semibold text-ink">{fmtMoney(num(d.total))}</span>
          {metodo === "mixto" ? (
            <span className="text-xs text-ink-3">
              (efectivo {fmtMoney(num(d.efectivo))} + transferencia {fmtMoney(num(d.transferencia))})
            </span>
          ) : null}
        </div>
      );
    }

    case "reabrir_cuenta":
      return (
        <span>
          <span className="text-ink">{texto(d.cliente)}</span> · anuló el cobro de{" "}
          <span className="font-semibold text-ink">{fmtMoney(num(d.total))}</span>
        </span>
      );

    case "registrar_compra": {
      const renglones = num(d.renglones);
      return (
        <span>
          <span className="text-ink">{renglones}</span> producto{renglones === 1 ? "" : "s"} ·{" "}
          <span className="font-semibold text-ink">{fmtMoney(num(d.total))}</span>
        </span>
      );
    }

    case "ajustar_inventario": {
      const antes = num(d.antes);
      const despues = num(d.despues);
      const diferencia = d.diferencia != null ? num(d.diferencia) : despues - antes;
      const nombre = fila.entidad_id ? productos.get(fila.entidad_id) : undefined;
      const nota = d.nota ? String(d.nota).trim() : "";
      return (
        <div>
          <span>
            {nombre ? <span className="font-medium text-ink">{nombre}</span> : null}{" "}
            <span className="text-ink-3">
              {fmtCantidad(antes)} → {fmtCantidad(despues)}
            </span>{" "}
            <span
              className={`font-semibold ${
                diferencia > 0 ? "text-good" : diferencia < 0 ? "text-crit" : "text-ink-3"
              }`}
            >
              ({diferencia > 0 ? "+" : ""}
              {fmtCantidad(diferencia)})
            </span>
          </span>
          {nota ? <div className="mt-0.5 text-xs italic text-ink-3">"{nota}"</div> : null}
        </div>
      );
    }

    default:
      return fila.detalle ? (
        <span className="text-ink-3">{JSON.stringify(fila.detalle)}</span>
      ) : (
        <span className="text-ink-3">—</span>
      );
  }
}
