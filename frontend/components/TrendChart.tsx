"use client";

import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import type { PointSerie } from "../lib/api";
import { frPct } from "../lib/regionInsights";
import { useElementWidth } from "../lib/useElementWidth";

type MergedPoint = { label: string; region: number | null; national: number | null };

const EVENTS = [
  { label: "T1 2008", text: "Crise financière", short: "2008" },
  { label: "T1 2020", text: "Covid-19", short: "Covid" },
];

function merge(regionSerie: PointSerie[], nationalSerie: PointSerie[]): MergedPoint[] {
  const key = (p: PointSerie) => `${p.annee}-${p.trimestre}`;
  const nationalMap = new Map(nationalSerie.map((p) => [key(p), p.taux]));
  return regionSerie.map((p) => ({
    label: `T${p.trimestre} ${p.annee}`,
    region: p.taux,
    national: nationalMap.get(key(p)) ?? null,
  }));
}

export default function TrendChart({
  regionSerie,
  nationalSerie,
  regionLabel,
}: {
  regionSerie: PointSerie[];
  nationalSerie: PointSerie[];
  regionLabel: string;
}) {
  const data = merge(regionSerie, nationalSerie);
  const [ref, width] = useElementWidth<HTMLDivElement>();

  const targetTicks = Math.max(3, Math.floor(width / 110));
  const tickInterval = Math.max(0, Math.ceil(data.length / targetTicks) - 1);
  const visibleEvents = EVENTS.filter((e) => data.some((d) => d.label === e.label));

  return (
    <div ref={ref} style={{ width: "100%", height: 360 }}>
      {width > 0 && (
        <LineChart width={width} height={360} data={data} margin={{ top: 22, right: 16, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="rgba(22,32,43,0.1)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#4B5663", fontSize: 12 }}
            interval={tickInterval}
            axisLine={{ stroke: "rgba(22,32,43,0.25)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#4B5663", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            unit="%"
            domain={[(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ background: "#FFFFFF", border: "1px solid rgba(22,32,43,0.15)", fontSize: 12 }}
            labelStyle={{ color: "#16202B", fontWeight: 600 }}
            formatter={(value: number) => frPct(value)}
          />
          <Legend wrapperStyle={{ fontSize: 13, color: "#4B5663" }} />
          {visibleEvents.map((event) => (
            <ReferenceLine
              key={event.label}
              x={event.label}
              stroke="rgba(22,32,43,0.35)"
              strokeDasharray="2 4"
              label={{ value: width < 520 ? event.short : event.text, position: "top", fontSize: 11, fill: "#4B5663" }}
            />
          ))}
          <Line
            type="monotone"
            dataKey="national"
            name="France métropolitaine"
            stroke="#425BB6"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            animationDuration={900}
          />
          <Line
            type="monotone"
            dataKey="region"
            name={regionLabel}
            stroke="#16202B"
            strokeWidth={2.8}
            dot={false}
            animationDuration={900}
          />
        </LineChart>
      )}
    </div>
  );
}
