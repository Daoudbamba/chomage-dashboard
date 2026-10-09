type Tone = "teal" | "indigo" | "coral" | "amber";

const toneBorder: Record<Tone, string> = {
  teal: "border-teal",
  indigo: "border-indigo",
  coral: "border-coral",
  amber: "border-amber",
};

export default function KpiCard({
  label,
  value,
  sub,
  tone = "teal",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
}) {
  return (
    <div className={`border-t-2 pt-4 ${toneBorder[tone]}`}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink/70">{label}</p>
      <p className="font-display text-4xl sm:text-5xl leading-none text-ink mt-2">{value}</p>
      {sub && <p className="text-sm text-ink/75 mt-2">{sub}</p>}
    </div>
  );
}
