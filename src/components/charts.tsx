"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtMoney, fmtSoloFecha } from "@/lib/format";

// Paleta validada (dataviz skill): secuencial = 1 hue cian; 2ª serie = violeta;
// estado reservado a alertas, nunca reusado como serie.
const BRAND = "#0891b2";
const ACCENT2 = "#9333ea";
const ACCENT3 = "#0d9488"; // 3ª serie categórica (paleta validada, slot "aqua")
const CRIT = "#be123c";
const WARN = "#b45309";
const MUTED = "#c9d0de";
const GRID = "#e4e8f1";
const INK2 = "#4b5568";
const INK3 = "#848da0";

const tooltipBox = {
  background: "#ffffff",
  border: "1px solid #e4e8f1",
  borderRadius: 8,
  fontSize: 12,
  color: "#0b1220",
  boxShadow: "0 4px 12px rgba(11,17,32,0.08)",
};

const axisTick = { fill: INK3, fontSize: 11 };

/**
 * Tendencia de ventas: una sola serie -> sin leyenda, un hue.
 * Columnas (no línea): con pocos días de historia una línea/área se ve vacía;
 * una columna se lee completa incluso con un solo día de datos.
 */
export function VentasTrendChart({
  data,
}: {
  data: { dia: string; total: number }[];
}) {
  // Con pocas barras cabe la etiqueta en la punta (spec: "columns -> value on the cap").
  // Con muchas, el eje + el tooltip ya cargan el detalle: etiquetar todas sería ruido.
  const conEtiqueta = data.length <= 7;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: conEtiqueta ? 20 : 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="dia"
          tickFormatter={(d) => fmtSoloFecha(d)}
          tick={axisTick}
          axisLine={{ stroke: MUTED }}
          tickLine={false}
        />
        <YAxis
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => fmtCompact(v)}
        />
        <Tooltip
          contentStyle={tooltipBox}
          cursor={{ fill: "#0b1220", fillOpacity: 0.04 }}
          labelFormatter={(d) => fmtSoloFecha(String(d))}
          formatter={(v) => [fmtMoney(Number(v)), "Ventas"]}
        />
        <Bar
          dataKey="total"
          name="Ventas"
          fill={BRAND}
          radius={[4, 4, 0, 0]}
          maxBarSize={44}
          isAnimationActive={false}
        >
          {conEtiqueta ? (
            <LabelList
              dataKey="total"
              position="top"
              formatter={(v) => fmtCompact(Number(v))}
              style={{ fill: INK2, fontSize: 11, fontWeight: 600 }}
            />
          ) : null}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Ventas por método de pago, agrupadas por día, mes o año (según el filtro
 * activo): 3 series -> parte-de-un-todo, orden fijo (azul/naranja/aqua) +
 * leyenda. Cada cuenta cerrada cuenta una sola vez, en su método real
 * (efectivo · transferencia · mixto): no hay doble conteo entre las barras.
 * `etiqueta` ya viene formateada por el llamador (día/mes/año son formatos
 * distintos), así el componente no necesita saber qué granularidad es.
 */
export function PagoPorDiaChart({
  data,
}: {
  data: { etiqueta: string; efectivo: number; transferencia: number; mixto: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="etiqueta"
          tick={axisTick}
          axisLine={{ stroke: MUTED }}
          tickLine={false}
        />
        <YAxis
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => fmtCompact(v)}
        />
        <Tooltip
          contentStyle={tooltipBox}
          cursor={{ fill: "#0b1220", fillOpacity: 0.04 }}
          formatter={(v) => fmtMoney(Number(v))}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: INK2, paddingTop: 8 }}
        />
        <Bar
          dataKey="efectivo"
          name="Efectivo"
          stackId="pago"
          fill={BRAND}
          radius={[0, 0, 0, 0]}
          maxBarSize={28}
          isAnimationActive={false}
        />
        <Bar
          dataKey="transferencia"
          name="Transferencia"
          stackId="pago"
          fill={ACCENT2}
          radius={[0, 0, 0, 0]}
          maxBarSize={28}
          isAnimationActive={false}
        />
        <Bar
          dataKey="mixto"
          name="Mixto"
          stackId="pago"
          fill={ACCENT3}
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Stock actual vs mínimo por producto: la serie "Stock" es el punto de la
 * historia (color por estado), "Mínimo" es solo contexto (gris) -> énfasis.
 */
export function StockChart({
  data,
}: {
  data: { nombre: string; stock: number; stock_minimo: number }[];
}) {
  const alto = Math.max(220, data.length * 34);
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
        barGap={4}
      >
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="nombre"
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip contentStyle={tooltipBox} cursor={{ fill: "#0b1220", fillOpacity: 0.03 }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: INK2 }}
        />
        <Bar
          dataKey="stock_minimo"
          name="Mínimo"
          fill={MUTED}
          radius={[0, 3, 3, 0]}
          maxBarSize={14}
          isAnimationActive={false}
        />
        <Bar
          dataKey="stock"
          name="Stock"
          fill={BRAND}
          radius={[0, 3, 3, 0]}
          maxBarSize={14}
          isAnimationActive={false}
        >
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.stock <= 0 ? CRIT : d.stock <= d.stock_minimo ? WARN : BRAND}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Ranking de productos más vendidos (cantidad), entre todos los bares.
 * Un solo hue: no hay estado que resaltar aquí, solo orden.
 */
export function TopProductosChart({
  data,
}: {
  data: { nombre: string; cantidad: number }[];
}) {
  const alto = Math.max(220, data.length * 34);
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
      >
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="nombre"
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip
          contentStyle={tooltipBox}
          cursor={{ fill: "#0b1220", fillOpacity: 0.03 }}
          formatter={(v) => [fmtCompact(Number(v)), "Cantidad"]}
        />
        <Bar
          dataKey="cantidad"
          name="Cantidad vendida"
          fill={BRAND}
          radius={[0, 3, 3, 0]}
          maxBarSize={16}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Ganancias
// ---------------------------------------------------------------------------
const GANANCIA = ACCENT3; // teal: "lo que queda"
const COSTO = "#a9b4c8"; // gris azulado: contexto, no protagonista

type PuntoGanancia = {
  etiqueta: string;
  rango: string;
  ventas: number;
  costo: number;
  ganancia: number;
  margen: number | null;
};

const pct = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 });

function TooltipGanancia({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: PuntoGanancia }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const fila = (nombre: string, valor: string, color?: string, fuerte?: boolean) => (
    <div className="flex items-center justify-between gap-6">
      <span className="flex items-center gap-1.5 text-ink-2">
        {color ? (
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
        ) : null}
        {nombre}
      </span>
      <span className={fuerte ? "font-semibold text-ink" : "text-ink"}>{valor}</span>
    </div>
  );
  return (
    <div style={tooltipBox} className="min-w-[200px] p-3">
      <div className="mb-2 font-semibold text-ink">{p.rango}</div>
      <div className="space-y-1">
        {fila("Ventas", fmtMoney(p.ventas))}
        {fila("Costo", fmtMoney(p.costo), COSTO)}
        {fila(p.ganancia < 0 ? "Pérdida" : "Ganancia", fmtMoney(p.ganancia), p.ganancia < 0 ? CRIT : GANANCIA, true)}
        {p.margen !== null ? fila("Margen", `${pct.format(p.margen)}%`) : null}
      </div>
    </div>
  );
}

/**
 * Cada barra es lo vendido, partido en dos: lo que costó (gris) y lo que
 * quedó de ganancia (teal). Si algún periodo vendió por debajo del costo, la
 * parte que sobra del costo se pinta en rojo como pérdida.
 */
export function GananciaTendenciaChart({ data }: { data: PuntoGanancia[] }) {
  const filas = data.map((d) => ({
    ...d,
    costoVisible: Math.min(d.costo, d.ventas),
    gananciaPos: Math.max(d.ventas - d.costo, 0),
    perdida: Math.max(d.costo - d.ventas, 0),
  }));
  const hayPerdida = filas.some((f) => f.perdida > 0);
  const conEtiqueta = filas.length <= 8;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={filas} margin={{ top: conEtiqueta ? 22 : 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="etiqueta"
          tick={axisTick}
          axisLine={{ stroke: MUTED }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={14}
        />
        <YAxis
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => fmtPesosCorto(v)}
        />
        <Tooltip content={<TooltipGanancia />} cursor={{ fill: "#0b1220", fillOpacity: 0.04 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: INK2, paddingTop: 8 }} />
        <Bar
          dataKey="costoVisible"
          name="Costo"
          stackId="v"
          fill={COSTO}
          maxBarSize={44}
          isAnimationActive={false}
        />
        <Bar
          dataKey="gananciaPos"
          name="Ganancia"
          stackId="v"
          fill={GANANCIA}
          radius={hayPerdida ? [0, 0, 0, 0] : [4, 4, 0, 0]}
          maxBarSize={44}
          isAnimationActive={false}
        >
          {conEtiqueta ? (
            <LabelList
              dataKey="gananciaPos"
              position="top"
              formatter={(v) => (Number(v) > 0 ? fmtPesosCorto(Number(v)) : "")}
              style={{ fill: INK2, fontSize: 11, fontWeight: 600 }}
            />
          ) : null}
        </Bar>
        {hayPerdida ? (
          <Bar
            dataKey="perdida"
            name="Pérdida"
            stackId="v"
            fill={CRIT}
            radius={[4, 4, 0, 0]}
            maxBarSize={44}
            isAnimationActive={false}
          />
        ) : null}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Margen (% de lo vendido que queda de ganancia) a lo largo del tiempo, con su promedio. */
export function MargenChart({
  data,
  promedio,
}: {
  data: PuntoGanancia[];
  promedio: number;
}) {
  const conPuntos = data.length <= 31;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="etiqueta"
          tick={axisTick}
          axisLine={{ stroke: MUTED }}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={14}
        />
        <YAxis
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => `${v}%`}
          domain={[(min: number) => Math.min(0, Math.floor(min)), (max: number) => Math.ceil(max / 5) * 5 + 5]}
        />
        <Tooltip content={<TooltipGanancia />} cursor={{ stroke: MUTED }} />
        <ReferenceLine
          y={promedio}
          stroke={INK3}
          strokeDasharray="4 4"
          label={{ value: `Promedio ${pct.format(promedio)}%`, position: "insideTopRight", fill: INK3, fontSize: 11 }}
        />
        <Line
          type="monotone"
          dataKey="margen"
          name="Margen"
          stroke={GANANCIA}
          strokeWidth={2.5}
          dot={conPuntos ? { r: 3, fill: GANANCIA, strokeWidth: 0 } : false}
          activeDot={{ r: 5 }}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Los productos que más ganancia dejaron (en pesos). */
export function GananciaProductosChart({
  data,
}: {
  data: { nombre: string; ganancia: number; ventas: number; margen: number }[];
}) {
  const alto = Math.max(220, data.length * 36);
  const corto = (s: string) => (s.length > 20 ? `${s.slice(0, 19)}…` : s);
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => fmtPesosCorto(v)} />
        <YAxis
          type="category"
          dataKey="nombre"
          tick={axisTick}
          axisLine={false}
          tickLine={false}
          width={130}
          tickFormatter={corto}
        />
        <Tooltip
          contentStyle={tooltipBox}
          cursor={{ fill: "#0b1220", fillOpacity: 0.03 }}
          formatter={(v) => [fmtMoney(Number(v)), "Ganancia"]}
        />
        <Bar dataKey="ganancia" name="Ganancia" radius={[0, 3, 3, 0]} maxBarSize={18} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.ganancia < 0 ? CRIT : GANANCIA} />
          ))}
          <LabelList
            dataKey="ganancia"
            position="right"
            formatter={(v) => fmtPesosCorto(Number(v))}
            style={{ fill: INK2, fontSize: 11, fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

/** Pesos en versión corta con coma decimal (1,2M · 12,5K · 350K · 800), sin perder precisión en cifras chicas. */
function fmtPesosCorto(n: number): string {
  const a = Math.abs(n);
  const signo = n < 0 ? "-" : "";
  if (a >= 1_000_000) return `${signo}${pct.format(Math.round((a / 1_000_000) * 10) / 10)}M`;
  if (a >= 100_000) return `${signo}${Math.round(a / 1000)}K`;
  if (a >= 1_000) return `${signo}${pct.format(Math.round((a / 1000) * 10) / 10)}K`;
  return `${signo}${Math.round(a)}`;
}
