"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
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

function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1000)}K`;
  return String(n);
}
