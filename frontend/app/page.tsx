"use client";

import { useEffect, useMemo, useState } from "react";
import { api, Entite, Latest, PointSerie, Summary, periodeLabel } from "../lib/api";
import FranceMap from "../components/FranceMap";
import KpiCard from "../components/KpiCard";
import TrendChart from "../components/TrendChart";
import RankingChart from "../components/RankingChart";
import { computeTrend } from "../lib/insights";
import {
  OUTRE_MER_REGION,
  frPct,
  frSigned,
  rankDepartements,
  regionInsights,
  splitDepartements,
} from "../lib/regionInsights";

const NATIONAL_LIBELLE = "FRANCE METROPOLITAINE";
const NATIONAL_CODE = "00";

type RankMode = "high" | "low";

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [regions, setRegions] = useState<Entite[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [regionSerie, setRegionSerie] = useState<PointSerie[]>([]);
  const [nationalSerie, setNationalSerie] = useState<PointSerie[]>([]);
  const [deptLatest, setDeptLatest] = useState<Latest | null>(null);
  const [rankMode, setRankMode] = useState<RankMode>("high");
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

  const trend = useMemo(() => computeTrend(summary), [summary]);
  const insights = useMemo(() => regionInsights(regionSerie, nationalSerie), [regionSerie, nationalSerie]);
  const { metropole, outreMer } = useMemo(() => splitDepartements(deptLatest?.valeurs ?? []), [deptLatest]);
  const ranking = useMemo(() => rankDepartements(metropole, rankMode, 15), [metropole, rankMode]);

  const selectRegionByCode = (regionCode: string) => {
    const region = regions.find((r) => r.code === regionCode);
    if (region) setSelectedRegion(region.libelle);
  };

  const selectOutreMer = (deptCode: string) => {
    const region = regions.find((r) => r.code === OUTRE_MER_REGION[deptCode]);
    if (!region) return;
    setSelectedRegion(region.libelle);
    document.getElementById("evolution")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-coralDeep font-semibold mb-2">Impossible de charger les données</p>
          <p className="text-ink/70 text-sm">{error}</p>
          <p className="text-ink/70 text-xs mt-4">Vérifie que le backend tourne sur NEXT_PUBLIC_API_URL.</p>
        </div>
      </main>
    );
  }

  const lowestMetropole = [...metropole].sort((a, b) => a.taux - b.taux)[0];
  const highestMetropole = metropole[0];
  const highestOutreMer = outreMer[0];

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 sm:py-16">
      <header className="mb-12 grid gap-8 lg:grid-cols-[1.4fr,1fr] items-end reveal" style={{ animationDelay: "40ms" }}>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink/70 mb-4">
            Données INSEE · depuis {summary?.depuis?.annee ?? "1982"}
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.02] text-ink mb-5">
            Le chômage en France, trimestre après trimestre
          </h1>
          <p className="text-base text-ink/75 max-w-xl leading-relaxed">
            Taux de chômage localisé par région et département, séries CVS trimestrielles de l&apos;INSEE.
          </p>
        </div>

        <div className="lg:text-right">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink/70 mb-2">
            France métropolitaine · {periodeLabel(summary?.periode)}
          </p>
          <p className="font-display text-7xl sm:text-8xl leading-none text-ink">{frPct(summary?.taux_national)}</p>
          {trend && (
            <p className={`mt-3 text-sm font-semibold ${trend.up ? "text-coralDeep" : "text-tealDeep"}`}>
              {trend.up ? "▲" : "▼"} {frSigned(trend.diff)} pt vs trimestre précédent
            </p>
          )}
        </div>
      </header>

      {loading ? (
        <p className="text-ink/70">Chargement des indicateurs...</p>
      ) : (
        <>
          <section className="mb-14 reveal" style={{ animationDelay: "120ms" }}>
            <div className="mb-6">
              <h2 className="font-display text-4xl text-ink">Carte des départements</h2>
              <p className="text-sm text-ink/75 mt-1">
                Taux de chômage de la métropole, {periodeLabel(deptLatest?.periode)}. Un clic sélectionne la région du
                département et met à jour l&apos;évolution ci-dessous.
              </p>
            </div>
            <FranceMap
              valeurs={deptLatest?.valeurs ?? []}
              selectedRegionCode={regions.find((r) => r.libelle === selectedRegion)?.code ?? null}
              selectedRegionLabel={selectedRegion}
              onSelectRegion={selectRegionByCode}
            />
          </section>

          <section id="evolution" className="mb-14 reveal scroll-mt-6" style={{ animationDelay: "160ms" }}>
            <div className="flex items-end justify-between flex-wrap gap-4 mb-5">
              <div>
                <h2 className="font-display text-4xl text-ink">Évolution régionale</h2>
                <p className="text-sm text-ink/75 mt-1">
                  Taux de chômage trimestriel de la région, comparé à la France métropolitaine.
                </p>
              </div>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                aria-label="Choisir une région"
                className="bg-white border border-ink/25 text-ink text-sm px-4 py-2 focus:outline-none focus:border-indigo"
              >
                {regions.map((r) => (
                  <option key={r.code + r.libelle} value={r.libelle}>
                    {r.libelle}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 mb-6">
              <KpiCard
                label="Écart avec la métropole"
                value={`${frSigned(insights.gap)} pt`}
                sub={`${frPct(insights.latest?.taux)} dans la région, ${frPct(insights.national)} en France`}
                tone={insights.gap != null && insights.gap < 0 ? "teal" : "coral"}
              />
              <KpiCard
                label="Variation sur 1 an"
                value={`${frSigned(insights.yearChange)} pt`}
                sub={insights.latest ? `Depuis T${insights.latest.trimestre} ${insights.latest.annee - 1}` : undefined}
                tone={insights.yearChange != null && insights.yearChange <= 0 ? "teal" : "coral"}
              />
              <KpiCard
                label="Pic historique"
                value={frPct(insights.peak?.taux)}
                sub={insights.peak ? `T${insights.peak.trimestre} ${insights.peak.annee}` : undefined}
                tone="indigo"
              />
            </div>

            <div className="bg-white border border-ink/10 p-4 sm:p-6">
              <TrendChart regionSerie={regionSerie} nationalSerie={nationalSerie} regionLabel={selectedRegion} />
            </div>
          </section>

          <section className="mb-14 reveal" style={{ animationDelay: "240ms" }}>
            <h2 className="font-display text-4xl text-ink mb-6">Les extrêmes du trimestre</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <KpiCard
                label="Le plus bas"
                value={frPct(lowestMetropole?.taux)}
                sub={lowestMetropole?.libelle}
                tone="teal"
              />
              <KpiCard
                label="Le plus haut en métropole"
                value={frPct(highestMetropole?.taux)}
                sub={highestMetropole?.libelle}
                tone="coral"
              />
              <KpiCard
                label="Le plus haut outre-mer"
                value={frPct(highestOutreMer?.taux)}
                sub={highestOutreMer?.libelle}
                tone="coral"
              />
            </div>
          </section>

          <section className="reveal" style={{ animationDelay: "320ms" }}>
            <div className="flex items-end justify-between flex-wrap gap-4 mb-5">
              <div>
                <h2 className="font-display text-4xl text-ink">Classement des départements</h2>
                <p className="text-sm text-ink/75 mt-1">
                  Métropole, {periodeLabel(deptLatest?.periode)}. Outre-mer présenté à part, ses niveaux sont d&apos;un autre ordre.
                </p>
              </div>
              <div className="inline-flex border border-ink/25 text-sm" role="group" aria-label="Sens du classement">
                {(["high", "low"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setRankMode(mode)}
                    aria-pressed={rankMode === mode}
                    className={`px-4 py-2 transition-colors ${
                      rankMode === mode ? "bg-ink text-white" : "bg-white text-ink/75 hover:text-ink"
                    }`}
                  >
                    {mode === "high" ? "Les plus touchés" : "Les moins touchés"}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-ink/10 p-4 sm:p-6">
              <RankingChart data={ranking} tone={rankMode} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.14em] text-ink/70 mr-2">Outre-mer</span>
              {outreMer.map((dept) => (
                <button
                  key={dept.code}
                  onClick={() => selectOutreMer(dept.code)}
                  title="Voir l'évolution de cette région"
                  className="inline-flex items-center gap-2 border border-ink/20 bg-white px-3 py-1.5 text-xs text-ink hover:border-ink/50 transition-colors"
                >
                  <span className="h-2 w-2 rounded-full bg-coral" />
                  {dept.libelle} <strong>{frPct(dept.taux)}</strong>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      <footer className="mt-20 pt-8 border-t border-ink/15 text-xs text-ink/70">
        <p>Source : Insee, estimations de taux de chômage localisés. Pipeline ETL + API par Daouda Bamba.</p>
        <p className="mt-1">
          Contours des départements : IGN Admin Express, Licence Ouverte Etalab, via gregoiredavid/france-geojson.
          Rattachement aux régions : geo.api.gouv.fr.
        </p>
      </footer>
    </main>
  );
}
