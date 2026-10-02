import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/auth";
import { getBarActual, requireModulo } from "@/lib/modulos";
import { fmtDiaYMD, fmtFecha } from "@/lib/format";
import { metodoLabel } from "@/lib/metodo-pago";
import { TZ, hoyYMD, ymdEnZona } from "@/lib/tz";
import {
  MAX_CUENTAS_DETALLE,
  armarSerie,
  cargarDetalle,
  cargarPorPeriodo,
  cargarPorProducto,
  cargarStock,
  margenPct,
  rangoAnterior,
  resolverFiltros,
  sumarTotales,
  variacionPct,
} from "@/lib/ganancias";
import type { MetodoPago } from "@/lib/types";

const MONEY_FMT = '"$"#,##0';
const PCT_FMT = "0.0%";
const QTY_FMT = "#,##0.###";
const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0E7490" } };
const HEADER_FONT: Partial<ExcelJS.Font> = { color: { argb: "FFFFFFFF" }, bold: true };
const hora = new Intl.DateTimeFormat("es-CO", { timeStyle: "short", timeZone: TZ });

/** Fecha de calendario real de Excel (sin hora), en la zona del negocio. */
function fechaExcel(iso: string | null): Date | null {
  if (!iso) return null;
  const [y, m, d] = ymdEnZona(iso).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

const GANANCIA_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FF0F766E" } };

function estilizarEncabezado(fila: ExcelJS.Row) {
  fila.eachCell((celda) => {
    celda.fill = HEADER_FILL;
    celda.font = HEADER_FONT;
    celda.alignment = { vertical: "middle" };
  });
  fila.height = 22;
}

/** Deja la primera fila fija y con filtros, como una tabla para archivar. */
function comoTabla(hoja: ExcelJS.Worksheet, columnas: number) {
  hoja.views = [{ state: "frozen", ySplit: 1 }];
  hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columnas } };
}

export async function GET(request: Request) {
  await requireAdmin();
  await requireModulo("ganancias");
  const { barNombre } = await getBarActual();

  const sp = Object.fromEntries(new URL(request.url).searchParams) as Record<string, string>;
  const hoy = hoyYMD();
  const { desde, hasta, bucket } = resolverFiltros(sp, hoy);
  const previo = rangoAnterior(desde, hasta);

  const [filas, filasPrevio, productos, stock, detalle] = await Promise.all([
    cargarPorPeriodo(desde, hasta, bucket),
    cargarPorPeriodo(previo.desde, previo.hasta, "anio"),
    cargarPorProducto(desde, hasta),
    cargarStock(),
    cargarDetalle(desde, hasta),
  ]);

  const tot = sumarTotales(filas);
  const ant = sumarTotales(filasPrevio);
  const conAnio = (ymd: string) => `${fmtDiaYMD(ymd)} ${ymd.slice(0, 4)}`;
  const rango = desde === hasta ? conAnio(desde) : `${conAnio(desde)} – ${conAnio(hasta)}`;
  const rangoPrevio = previo.desde === previo.hasta ? conAnio(previo.desde) : `${conAnio(previo.desde)} – ${conAnio(previo.hasta)}`;
  const nombreBucket = bucket === "dia" ? "Día" : bucket === "semana" ? "Semana" : bucket === "mes" ? "Mes" : "Año";
  const serie = armarSerie(filas, desde, hasta, bucket, true);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Stockeo";
  workbook.created = new Date();

  // ---- Hoja 1: Resumen (con comparación contra el periodo anterior) ----
  const resumen = workbook.addWorksheet("Resumen");
  resumen.columns = [
    { key: "a", width: 30 },
    { key: "b", width: 20 },
    { key: "c", width: 20 },
    { key: "d", width: 16 },
  ];
  resumen.addRow(["Ganancias", barNombre]).font = { bold: true, size: 14 };
  resumen.addRow(["Periodo", rango]);
  resumen.addRow(["Comparado con", rangoPrevio]);
  resumen.addRow(["Generado", fmtFecha(new Date().toISOString())]);
  resumen.addRow([]);

  const encabezado = resumen.addRow(["Concepto", "Este periodo", "Periodo anterior", "Variación"]);
  estilizarEncabezado(encabezado);

  const filaResumen = (concepto: string, actual: number, anterior: number, fmt: string, conVariacion = true) => {
    const v = variacionPct(actual, anterior);
    const fila = resumen.addRow([concepto, actual, anterior, !conVariacion ? null : v !== null ? v / 100 : "—"]);
    fila.getCell(2).numFmt = fmt;
    fila.getCell(3).numFmt = fmt;
    fila.getCell(4).numFmt = PCT_FMT;
    return fila;
  };
  filaResumen("Ventas", tot.ventas, ant.ventas, MONEY_FMT);
  filaResumen("Costo de lo vendido", tot.costo, ant.costo, MONEY_FMT);
  filaResumen("Ganancia", tot.ganancia, ant.ganancia, MONEY_FMT).font = GANANCIA_FONT;
  filaResumen("Margen de ganancia", tot.margen / 100, ant.margen / 100, PCT_FMT, false);
  filaResumen("Cuentas cobradas", tot.cuentas, ant.cuentas, "0");
  resumen.addRow([]);

  const stockTitulo = resumen.addRow(["Inventario actual (hoy)"]);
  stockTitulo.font = { bold: true };
  resumen.addRow(["Productos con existencias", stock.productos]);
  const fCosto = resumen.addRow(["Invertido en el stock (a costo)", stock.valorCosto]);
  fCosto.getCell(2).numFmt = MONEY_FMT;
  const fVenta = resumen.addRow(["Valor del stock a precio de venta", stock.valorVenta]);
  fVenta.getCell(2).numFmt = MONEY_FMT;
  const fGan = resumen.addRow(["Ganancia esperada si se vende todo", stock.gananciaEsperada]);
  fGan.getCell(2).numFmt = MONEY_FMT;
  fGan.font = GANANCIA_FONT;
  resumen.addRow([]);
  resumen.addRow([
    "Ganancia = ventas − costo. El costo de cada producto queda guardado al cobrar la cuenta (último costo de compra).",
  ]).font = { italic: true, color: { argb: "FF6B7280" } };

  // ---- Hoja 2: por día / semana / mes / año ----
  const hojaPeriodo = workbook.addWorksheet(`Por ${nombreBucket.toLowerCase()}`);
  hojaPeriodo.columns = [
    { header: nombreBucket, key: "periodo", width: 26 },
    { header: "Cuentas", key: "cuentas", width: 11 },
    { header: "Ventas", key: "ventas", width: 16, style: { numFmt: MONEY_FMT } },
    { header: "Costo", key: "costo", width: 16, style: { numFmt: MONEY_FMT } },
    { header: "Ganancia", key: "ganancia", width: 16, style: { numFmt: MONEY_FMT } },
    { header: "Margen", key: "margen", width: 11, style: { numFmt: PCT_FMT } },
  ];
  estilizarEncabezado(hojaPeriodo.getRow(1));
  for (const p of [...serie].reverse()) {
    if (p.cuentas === 0) continue; // solo periodos con ventas
    hojaPeriodo.addRow({
      periodo: p.rango,
      cuentas: p.cuentas,
      ventas: p.ventas,
      costo: p.costo,
      ganancia: p.ganancia,
      margen: p.margen === null ? null : p.margen / 100,
    });
  }
  const filaTotal = hojaPeriodo.addRow({
    periodo: "Total",
    cuentas: tot.cuentas,
    ventas: tot.ventas,
    costo: tot.costo,
    ganancia: tot.ganancia,
    margen: tot.ventas > 0 ? tot.margen / 100 : null,
  });
  filaTotal.font = { bold: true };
  comoTabla(hojaPeriodo, 6);

  // ---- Hoja 3: por producto ----
  const hojaProd = workbook.addWorksheet("Por producto");
  hojaProd.columns = [
    { header: "Producto", key: "producto", width: 32 },
    { header: "Vendidos", key: "cantidad", width: 12, style: { numFmt: QTY_FMT } },
    { header: "Ventas", key: "ventas", width: 16, style: { numFmt: MONEY_FMT } },
    { header: "Costo", key: "costo", width: 16, style: { numFmt: MONEY_FMT } },
    { header: "Ganancia", key: "ganancia", width: 16, style: { numFmt: MONEY_FMT } },
    { header: "Margen", key: "margen", width: 11, style: { numFmt: PCT_FMT } },
  ];
  estilizarEncabezado(hojaProd.getRow(1));
  for (const p of productos) {
    const ganancia = p.ventas - p.costo;
    hojaProd.addRow({
      producto: p.nombre,
      cantidad: p.cantidad,
      ventas: p.ventas,
      costo: p.costo,
      ganancia,
      margen: p.costo === 0 ? null : margenPct(p.ventas, ganancia) / 100, // sin costo: no hay margen real
    });
  }
  comoTabla(hojaProd, 6);

  // ---- Hoja 4: cada venta, renglón por renglón (para archivar) ----
  const hojaVentas = workbook.addWorksheet("Ventas detalle");
  hojaVentas.columns = [
    { header: "Fecha", key: "fecha", width: 13, style: { numFmt: "dd/mm/yyyy" } },
    { header: "Hora", key: "hora", width: 11 },
    { header: "Cliente", key: "cliente", width: 24 },
    { header: "Pago", key: "pago", width: 15 },
    { header: "Producto", key: "producto", width: 30 },
    { header: "Cantidad", key: "cantidad", width: 11, style: { numFmt: QTY_FMT } },
    { header: "Precio unit.", key: "precio", width: 14, style: { numFmt: MONEY_FMT } },
    { header: "Costo unit.", key: "costoU", width: 14, style: { numFmt: MONEY_FMT } },
    { header: "Venta", key: "venta", width: 15, style: { numFmt: MONEY_FMT } },
    { header: "Costo", key: "costo", width: 15, style: { numFmt: MONEY_FMT } },
    { header: "Ganancia", key: "ganancia", width: 15, style: { numFmt: MONEY_FMT } },
  ];
  estilizarEncabezado(hojaVentas.getRow(1));
  for (const r of detalle.renglones) {
    const venta = r.cantidad * r.precio;
    const costo = r.cantidad * r.costo;
    hojaVentas.addRow({
      fecha: fechaExcel(r.fecha),
      hora: r.fecha ? hora.format(new Date(r.fecha)) : "",
      cliente: r.cliente,
      pago: r.metodo ? metodoLabel(r.metodo as MetodoPago) : "",
      producto: r.producto,
      cantidad: r.cantidad,
      precio: r.precio,
      costoU: r.costo,
      venta,
      costo,
      ganancia: venta - costo,
    });
  }
  comoTabla(hojaVentas, 11);
  if (detalle.truncado) {
    hojaVentas.addRow([]);
    hojaVentas.addRow([
      `Se muestran las primeras ${MAX_CUENTAS_DETALLE.toLocaleString("es-CO")} cuentas del periodo. Elige un rango más corto para ver todas.`,
    ]).font = { italic: true, color: { argb: "FFB45309" } };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const nombreArchivo = desde === hasta ? `ganancias-${desde}.xlsx` : `ganancias-${desde}-a-${hasta}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      "Cache-Control": "no-store",
    },
  });
}
