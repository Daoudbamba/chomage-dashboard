"use client";

import { useEffect, useMemo, useState } from "react";
import { api, Entite, Latest, PointSerie, Summary, periodeLabel } from "../lib/api";
import KpiCard from "../components/KpiCard";
import TrendChart from "../components/TrendChart";
import RankingChart from "../components/RankingChart";

const NATIONAL_LIBELLE = "FRANCE METROPOLITAINE";
const NATIONAL_CODE = "00";

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [regions, setRegions] = useState<Entite[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [regionSerie, setRegionSerie] = useState<PointSerie[]>([]);
  const [nationalSerie, setNationalSerie] = useState<PointSerie[]>([]);
  const [deptLatest, setDeptLatest] = useState<Latest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.summary(), api.entites("region"), api.latest("departement")])
      .then(([s, r, d]) => {
        setSummary(s);
        const realRegions = r.filter((x) => x.libelle !== NATIONAL_LIBELLE && x.code !== NATIONAL_CODE);
        setRegions(realRegions);
        setSelectedRegion(realRegions.find((x) => x.libelle === "ILE-DE-FRANCE")?.libelle || realRegions[0]?.libelle || "");
        setDeptLatest(d);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedRegion) return;
    const region = regions.find((r) => r.libelle === selectedRegion);
    if (!region) return;

    api.serie("region", region.code, region.libelle).then(setRegionSerie).catch((e) => setError(String(e)));
    api
      .serie("region", NATIONAL_CODE, NATIONAL_LIBELLE)
      .then(setNationalSerie)
      .catch((e) => setError(String(e)));
  }, [selectedRegion, regions]);

  const trend = useMemo(() => {
    if (!summary?.taux_national || !summary?.taux_national_precedent) return null;
    const diff = summary.taux_national - summary.taux_national_precedent;
    return { diff: Math.round(diff * 10) / 10, up: diff > 0 };
  }, [summary]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-accent font-semibold mb-2">Impossible de charger les données</p>
          <p className="text-dim text-sm">{error}</p>
          <p className="text-dim text-xs mt-4">Vérifie que le backend tourne sur NEXT_PUBLIC_API_URL.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <header className="mb-14">
        <p className="text-accent text-xs uppercase tracking-widest mb-3">Données INSEE — depuis {summary?.depuis?.annee ?? "1982"}</p>
        <h1 className="text-4xl sm:text-5xl font-semibold text-paper mb-4">
          Observatoire du chômage en France
        </h1>
        <p className="text-muted max-w-2xl leading-relaxed text-sm">
          Taux de chômage localisé par région et département, données CVS trimestrielles de l&apos;INSEE.
          Dernière période disponible : <span className="text-paper">{periodeLabel(summary?.periode)}</span>.
        </p>
      </header>

      {loading ? (
        <p className="text-dim">Chargement...</p>
      ) : (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            <KpiCard
              label="Taux national"
              value={summary?.taux_national ? `${summary.taux_national}%` : "—"}
              sub={trend ? `${trend.up ? "+" : ""}${trend.diff} pt vs trim. précédent` : undefined}
              accent
            />
            <KpiCard
              label="Département le plus bas"
              value={summary?.departement_min ? `${summary.departement_min.taux}%` : "—"}
              sub={summary?.departement_min?.libelle}
            />
            <KpiCard
              label="Département le plus haut"
              value={summary?.departement_max ? `${summary.departement_max.taux}%` : "—"}
              sub={summary?.departement_max?.libelle}
            />
            <KpiCard
              label="Série historique"
              value={`${new Date().getFullYear() - (summary?.depuis?.annee ?? 1982)} ans`}
              sub={`Depuis T${summary?.depuis?.trimestre} ${summary?.depuis?.annee}`}
            />
          </section>

          <section className="mb-16">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <h2 className="text-xl font-semibold text-paper">Évolution par région</h2>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-surface border border-white/10 text-paper text-sm px-4 py-2 focus:outline-none focus:border-accent"
              >
                {regions.map((r) => (
                  <option key={r.code + r.libelle} value={r.libelle}>
                    {r.libelle}
                  </option>
                ))}
              </select>
            </div>
            <div className="border border-white/10 p-6">
              <TrendChart regionSerie={regionSerie} nationalSerie={nationalSerie} regionLabel={selectedRegion} />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-paper mb-6">
              Classement des départements — {periodeLabel(deptLatest?.periode)}
            </h2>
            <div className="border border-white/10 p-6">
              {deptLatest && <RankingChart data={deptLatest.valeurs} />}
            </div>
            <p className="text-dim text-xs mt-3">Top 15 départements par taux de chômage, période la plus récente disponible.</p>
          </section>
        </>
      )}

      <footer className="mt-24 pt-8 border-t border-white/10 text-xs text-dim">
        Source : Insee, estimations de taux de chômage localisés. Pipeline ETL + API par Daouda Bamba.
      </footer>
    </main>
  );
}
