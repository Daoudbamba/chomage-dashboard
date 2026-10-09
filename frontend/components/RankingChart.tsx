"use client";

import { Bar, BarChart, Cell, LabelList, Tooltip, XAxis, YAxis } from "recharts";
import { frPct } from "../lib/regionInsights";
import { useElementWidth } from "../lib/useElementWidth";

const TONES = {
  high: "#F27554",
  low: "#2D8F8A",
};

export default function RankingChart({
  data,
  tone = "high",
}: {
  data: { libelle: string; taux: number }[];
  tone?: "high" | "low";
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const narrow = width > 0 && width < 520;
  const rowHeight = 30;
  const height = data.length * rowHeight + 40;

  return (
    <div ref={ref} style={{ width: "100%", height }}>
      {width > 0 && (
        <BarChart
          width={width}
          height={height}
          data={data}
          layout="vertical"
          margin={{ top: 4, right: narrow ? 44 : 56, left: 4, bottom: 4 }}
        >
          <XAxis
            type="number"
            domain={[0, (max: number) => Math.ceil((max + 0.5) / 4) * 4]}
            tick={{ fill: "#4B5663", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="libelle"
            tick={{ fill: "#16202B", fontSize: narrow ? 11 : 12 }}
            width={narrow ? 118 : 168}
            tickFormatter={(name: string) => (narrow && name.length > 15 ? `${name.slice(0, 14)}…` : name)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(22,32,43,0.05)" }}
            contentStyle={{ background: "#FFFFFF", border: "1px solid rgba(22,32,43,0.15)", fontSize: 12 }}
            labelStyle={{ color: "#16202B" }}
            formatter={(value: number) => [frPct(value), "Taux"]}
          />
          <Bar dataKey="taux" radius={[0, 3, 3, 0]} barSize={18} animationDuration={700}>
            {data.map((entry, index) => (
              <Cell key={entry.libelle} fill={TONES[tone]} fillOpacity={index < 3 ? 1 : 0.55} />
            ))}
            <LabelList
              dataKey="taux"
              position="right"
              formatter={(value: number) => frPct(value)}
              style={{ fill: "#16202B", fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      )}
    </div>
  );
}
