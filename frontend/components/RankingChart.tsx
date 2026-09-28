"use client";

import { Bar, BarChart, Cell, Tooltip, XAxis, YAxis } from "recharts";
import { useElementWidth } from "../lib/useElementWidth";

export default function RankingChart({
  data,
}: {
  data: { libelle: string; taux: number }[];
}) {
  const sorted = [...data].sort((a, b) => b.taux - a.taux).slice(0, 15);
  const [ref, width] = useElementWidth<HTMLDivElement>();

  return (
    <div ref={ref} style={{ width: "100%", height: 480 }}>
      {width > 0 && (
        <BarChart
          width={width}
          height={480}
          data={sorted}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <XAxis type="number" tick={{ fill: "#56616F", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
          <YAxis
            type="category"
            dataKey="libelle"
            tick={{ fill: "#8D98AC", fontSize: 11 }}
            width={150}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ background: "#11161D", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12 }}
            labelStyle={{ color: "#EDF1F7" }}
            formatter={(value: number) => [`${value}%`, "Taux"]}
          />
          <Bar dataKey="taux" radius={[0, 3, 3, 0]}>
            {sorted.map((entry, index) => (
              <Cell key={entry.libelle} fill={index < 3 ? "#7C6CFF" : "#2DD4A7"} fillOpacity={index < 3 ? 0.9 : 0.6} />
            ))}
          </Bar>
        </BarChart>
      )}
    </div>
  );
}
