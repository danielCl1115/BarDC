import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/auth";
import { requireModulo } from "@/lib/modulos";
import { createClient } from "@/lib/supabase/server";
import { fmtFecha, fmtCantidad } from "@/lib/format";
import { hoyYMD, diasEntre, sumarDias, inicioDiaUTC } from "@/lib/tz";
import { PERIODOS, MAX_DIAS_EXPORTAR, type Periodo, calcularRango } from "@/lib/periodos";
import type { Compra, CompraItem } from "@/lib/types";

const MONEY_FMT = '"$"#,##0';
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2A78D6" } };
const HEADER_FONT: Partial<ExcelJS.Font> = { color: { argb: "FFFFFFFF" }, bold: true };

function estilizarEncabezado(fila: ExcelJS.Row) {
  fila.eachCell((celda) => {
    celda.fill = HEADER_FILL;
    celda.font = HEADER_FONT;
  });
}

export async function GET(request: Request) {
  await requireAdmin();
  await requireModulo("compras");

  const sp = new URL(request.url).searchParams;
  const periodo: Periodo = PERIODOS.some((p) => p.valor === sp.get("periodo"))
    ? (sp.get("periodo") as Periodo)
    : "mes";
  const hoy = hoyYMD();
  let { desde, hasta } = calcularRango(periodo, hoy, sp.get("desde") ?? undefined, sp.get("hasta") ?? undefined);

  if (diasEntre(desde, hasta) > MAX_DIAS_EXPORTAR) {
    desde = sumarDias(hasta, -(MAX_DIAS_EXPORTAR - 1));
  }

  const supabase = await createClient();
  const { data: comprasData } = await supabase
    .from("compras")
    .select("*")
    .gte("created_at", inicioDiaUTC(desde).toISOString())
    .lt("created_at", inicioDiaUTC(sumarDias(hasta, 1)).toISOString())
    .order("created_at", { ascending: false })
    .limit(2000);
  const compras = (comprasData ?? []) as Compra[];

  const idsCompras = compras.map((c) => c.id);
  const [{ data: itemsData }, { data: productosData }] = await Promise.all([
    idsCompras.length > 0
      ? supabase
          .from("compra_items")
          .select("compra_id, producto_id, cantidad, costo_unitario, subtotal")
          .in("compra_id", idsCompras)
      : Promise.resolve({ data: [] as CompraItem[] }),
    supabase.from("productos").select("id, nombre"),
  ]);
  const items = (itemsData ?? []) as CompraItem[];
  const nombreProducto = new Map((productosData ?? []).map((p) => [p.id as string, p.nombre as string]));
  const compraPorId = new Map(compras.map((c) => [c.id, c]));

  const productosPorCompra = new Map<string, string[]>();
  for (const it of items) {
    const nombre = nombreProducto.get(it.producto_id) ?? "Producto eliminado";
    const arr = productosPorCompra.get(it.compra_id) ?? [];
    arr.push(`${nombre} ×${fmtCantidad(it.cantidad)}`);
    productosPorCompra.set(it.compra_id, arr);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Inventario y Cuentas";
  workbook.created = new Date();

  // ---- Hoja 1: una fila por compra ----
  const hojaCompras = workbook.addWorksheet("Compras");
  hojaCompras.columns = [
    { header: "Fecha", key: "fecha", width: 22 },
    { header: "Proveedor", key: "proveedor", width: 24 },
    { header: "Productos", key: "productos", width: 40 },
    { header: "Nota", key: "nota", width: 22 },
    { header: "Total", key: "total", width: 16, style: { numFmt: MONEY_FMT } },
  ];
  estilizarEncabezado(hojaCompras.getRow(1));
  for (const c of compras) {
    hojaCompras.addRow({
      fecha: fmtFecha(c.created_at),
      proveedor: c.proveedor ?? "—",
      productos: (productosPorCompra.get(c.id) ?? []).join(", ") || "—",
      nota: c.nota ?? "—",
      total: Number(c.total),
    });
  }
  const filaTotal = hojaCompras.addRow({
    fecha: "",
    proveedor: "",
    productos: "",
    nota: "Total",
    total: compras.reduce((s, c) => s + Number(c.total), 0),
  });
  filaTotal.font = { bold: true };

  // ---- Hoja 2: el detalle, un renglón de compra por fila ----
  const hojaDetalle = workbook.addWorksheet("Detalle");
  hojaDetalle.columns = [
    { header: "Fecha", key: "fecha", width: 22 },
    { header: "Proveedor", key: "proveedor", width: 24 },
    { header: "Producto", key: "producto", width: 26 },
    { header: "Cantidad", key: "cantidad", width: 12 },
    { header: "Costo unitario", key: "costo", width: 16, style: { numFmt: MONEY_FMT } },
    { header: "Subtotal", key: "subtotal", width: 16, style: { numFmt: MONEY_FMT } },
  ];
  estilizarEncabezado(hojaDetalle.getRow(1));
  for (const it of items) {
    const compra = compraPorId.get(it.compra_id);
    hojaDetalle.addRow({
      fecha: compra ? fmtFecha(compra.created_at) : "",
      proveedor: compra?.proveedor ?? "—",
      producto: nombreProducto.get(it.producto_id) ?? "—",
      cantidad: Number(it.cantidad),
      costo: Number(it.costo_unitario),
      subtotal: Number(it.subtotal),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const nombreArchivo = desde === hasta ? `compras-${desde}.xlsx` : `compras-${desde}-a-${hasta}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
