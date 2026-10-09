import type { Latest, PointSerie } from "./api";

export type DeptValue = Latest["valeurs"][number];

export type RegionInsights = {
  latest: PointSerie | null;
  national: number | null;
  gap: number | null;
  yearChange: number | null;
  peak: PointSerie | null;
};

// Codes des départements d'outre-mer (971-976) -> code région INSEE correspondant.
export const OUTRE_MER_REGION: Record<string, string> = {
  "971": "01",
  "972": "02",
  "973": "03",
  "974": "04",
};

const decimal = (digits: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function fr(value: number | null | undefined, digits = 1): string {
  return value == null ? "—" : decimal(digits).format(value);
}

export function frPct(value: number | null | undefined, digits = 1): string {
  return value == null ? "—" : `${fr(value, digits)} %`;
}

export function frSigned(value: number | null | undefined, digits = 1): string {
  if (value == null) return "—";
  const abs = fr(Math.abs(value), digits);
  if (value > 0) return `+${abs}`;
  if (value < 0) return `−${abs}`;
  return abs;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const periodIndex = (p: PointSerie) => p.annee * 4 + p.trimestre;
const periodKey = (p: PointSerie) => `${p.annee}-${p.trimestre}`;

export function regionInsights(region: PointSerie[], national: PointSerie[]): RegionInsights {
  if (region.length === 0) {
    return { latest: null, national: null, gap: null, yearChange: null, peak: null };
  }

  const latest = region.reduce((best, p) => (periodIndex(p) > periodIndex(best) ? p : best));
  const nationalByPeriod = new Map(national.map((p) => [periodKey(p), p.taux]));
  const nationalLatest = nationalByPeriod.get(periodKey(latest)) ?? null;
  const previousYear = region.find((p) => p.annee === latest.annee - 1 && p.trimestre === latest.trimestre);
  const peak = region.reduce((best, p) => (p.taux > best.taux ? p : best));

  return {
    latest,
    national: nationalLatest,
    gap: nationalLatest == null ? null : round1(latest.taux - nationalLatest),
    yearChange: previousYear ? round1(latest.taux - previousYear.taux) : null,
    peak,
  };
}

export function isOutreMer(code: string): boolean {
  return code.startsWith("97");
}

export function splitDepartements(valeurs: DeptValue[]): { metropole: DeptValue[]; outreMer: DeptValue[] } {
  const sorted = [...valeurs].sort((a, b) => b.taux - a.taux);
  return {
    metropole: sorted.filter((d) => !isOutreMer(d.code)),
    outreMer: sorted.filter((d) => isOutreMer(d.code)),
  };
}

export function rankDepartements(valeurs: DeptValue[], mode: "high" | "low", count = 15): DeptValue[] {
  const sorted = [...valeurs].sort((a, b) => (mode === "high" ? b.taux - a.taux : a.taux - b.taux));
  return sorted.slice(0, count);
}
