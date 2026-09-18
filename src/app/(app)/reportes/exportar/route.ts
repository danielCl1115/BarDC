import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/auth";
import { requireModulo } from "@/lib/modulos";
import { fmtFecha } from "@/lib/format";
import { metodoLabel } from "@/lib/metodo-pago";
import { hoyYMD, diasEntre, sumarDias } from "@/lib/tz";
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
  await requireModulo("reportes");

  const sp = new URL(request.url).searchParams;
  const periodo: Periodo = PERIODOS.some((p) => p.valor === sp.get("periodo"))
    ? (sp.get("periodo") as Periodo)
    : "30d";
  const hoy = hoyYMD();
  let { desde, hasta } = calcularRango(periodo, hoy, sp.get("desde") ?? undefined, sp.get("hasta") ?? undefined);

  // Tope de seguridad del lado del servidor: nunca exportar más de MAX_DIAS_EXPORTAR
  // días, sin importar lo que traiga la URL, para no generar archivos gigantes.
  if (diasEntre(desde, hasta) > MAX_DIAS_EXPORTAR) {
    desde = sumarDias(hasta, -(MAX_DIAS_EXPORTAR - 1));
  }

  const bucketParam = sp.get("agrupar");
  const bucket: Bucket =
    bucketParam === "dia" || bucketParam === "mes" || bucketParam === "anio"
      ? bucketParam
      : bucketAuto(desde, hasta);

  const cuentas = await cargarCuentasCerradas(desde, hasta);
  const { filas } = agregarReporte(cuentas, bucket);
  const nombreBucket = bucket === "dia" ? "Día" : bucket === "mes" ? "Mes" : "Año";

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Inventario y Cuentas";
  workbook.created = new Date();

  // ---- Hoja 1: resumen agrupado (igual a la tabla "Detalle por..." de Reportes) ----
  const resumen = workbook.addWorksheet("Resumen");
  resumen.columns = [
    { header: nombreBucket, key: "etiqueta", width: 20 },
    { header: "Cuentas", key: "cuentas", width: 12 },
    { header: "Efectivo", key: "efectivo", width: 16, style: { numFmt: MONEY_FMT } },
    { header: "Transferencia", key: "transferencia", width: 16, style: { numFmt: MONEY_FMT } },
    { header: "Mixto", key: "mixto", width: 16, style: { numFmt: MONEY_FMT } },
    { header: "Total", key: "total", width: 18, style: { numFmt: MONEY_FMT } },
  ];
  estilizarEncabezado(resumen.getRow(1));

  for (const f of [...filas].reverse()) {
    resumen.addRow({
      etiqueta: f.etiqueta,
      cuentas: f.cuentas,
      efectivo: f.efectivo,
      transferencia: f.transferencia,
      mixto: f.mixto,
      total: f.efectivo + f.transferencia + f.mixto,
    });
  }
  const filaTotal = resumen.addRow({
    etiqueta: "Total",
    cuentas: filas.reduce((s, f) => s + f.cuentas, 0),
    efectivo: filas.reduce((s, f) => s + f.efectivo, 0),
    transferencia: filas.reduce((s, f) => s + f.transferencia, 0),
    mixto: filas.reduce((s, f) => s + f.mixto, 0),
    total: filas.reduce((s, f) => s + f.efectivo + f.transferencia + f.mixto, 0),
  });
  filaTotal.font = { bold: true };

  // ---- Hoja 2: cada cuenta cerrada, una por fila ----
  const detalle = workbook.addWorksheet("Cuentas");
  detalle.columns = [
    { header: "Fecha", key: "fecha", width: 22 },
    { header: "Cliente", key: "cliente", width: 26 },
    { header: "Método", key: "metodo", width: 16 },
    { header: "Total", key: "total", width: 16, style: { numFmt: MONEY_FMT } },
  ];
  estilizarEncabezado(detalle.getRow(1));

  for (const c of [...cuentas].reverse()) {
    detalle.addRow({
      fecha: fmtFecha(c.cerrada_en),
      cliente: c.nombre_cliente,
      metodo: metodoLabel(c.metodo_pago),
      total: Number(c.total),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const nombreArchivo = desde === hasta ? `reporte-${desde}.xlsx` : `reporte-${desde}-a-${hasta}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
