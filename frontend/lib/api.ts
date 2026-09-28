const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8010";

export type Entite = { code: string; libelle: string };
export type PointSerie = { annee: number; trimestre: number; taux: number };
export type Summary = {
  periode: { annee: number; trimestre: number };
  taux_national: number | null;
  taux_national_precedent: number | null;
  departement_min: { libelle: string; taux: number } | null;
  departement_max: { libelle: string; taux: number } | null;
  depuis: { annee: number; trimestre: number } | null;
};
export type Latest = {
  periode: { annee: number; trimestre: number } | null;
  valeurs: { code: string; libelle: string; taux: number }[];
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

export const api = {
  summary: () => getJson<Summary>("/api/summary"),
  entites: (niveau: "region" | "departement") => getJson<Entite[]>(`/api/entites?niveau=${niveau}`),
  serie: (niveau: "region" | "departement", code: string, libelle?: string) =>
    getJson<PointSerie[]>(
      `/api/serie?niveau=${niveau}&code=${encodeURIComponent(code)}${libelle ? `&libelle=${encodeURIComponent(libelle)}` : ""}`
    ),
  latest: (niveau: "region" | "departement") => getJson<Latest>(`/api/latest?niveau=${niveau}`),
};

export function periodeLabel(p: { annee: number; trimestre: number } | null | undefined) {
  return p ? `T${p.trimestre} ${p.annee}` : "—";
}
