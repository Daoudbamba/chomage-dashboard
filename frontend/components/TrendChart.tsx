"use client";

import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import type { PointSerie } from "../lib/api";
import { useElementWidth } from "../lib/useElementWidth";

type MergedPoint = { label: string; region: number | null; national: number | null };

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

  return (
    <div ref={ref} style={{ width: "100%", height: 340 }}>
      {width > 0 && (
      <LineChart width={width} height={340} data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#56616F", fontSize: 11 }}
          interval={Math.ceil(data.length / 10)}
          axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          tickLine={false}
        />
        <YAxis tick={{ fill: "#56616F", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
        <Tooltip
          contentStyle={{ background: "#11161D", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }}
          labelStyle={{ color: "#EDF1F7" }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#8D98AC" }} />
        <Line
          type="monotone"
          dataKey="region"
          name={regionLabel}
          stroke="#2DD4A7"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="national"
          name="France métropolitaine"
          stroke="#7C6CFF"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
        />
      </LineChart>
      )}
    </div>
  );
}
