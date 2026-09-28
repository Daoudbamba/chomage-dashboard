export default function KpiCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="border border-white/10 p-6 flex flex-col gap-2 transition-all duration-300 hover:border-accent/40 hover:-translate-y-0.5">
      <span className="text-[11px] uppercase tracking-widest text-dim">{label}</span>
      <span className={`text-3xl font-semibold ${accent ? "text-accent" : "text-paper"}`}>{value}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  );
}
