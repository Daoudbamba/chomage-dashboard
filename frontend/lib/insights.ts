import type { Summary } from "./api";

export type TrendInfo = {
  diff: number;
  up: boolean;
};

export function computeTrend(summary: Summary | null): TrendInfo | null {
  if (!summary || summary.taux_national == null || summary.taux_national_precedent == null) {
    return null;
  }

  const diff = summary.taux_national - summary.taux_national_precedent;
  return { diff: Math.round(diff * 10) / 10, up: diff > 0 };
}

export function formatRate(value: number | null | undefined): string {
  return value == null ? "—" : `${value}%`;
}

export function buildHighlights(summary: Summary | null): string[] {
  if (!summary) {
    return [
      "Données en cours de chargement.",
      "Analyse régionale disponible dès réception des séries.",
      "Historique complet depuis 1982.",
    ];
  }

  const trend = computeTrend(summary);
  const minRate = summary.departement_min?.taux;
  const maxRate = summary.departement_max?.taux;
  const spread = minRate != null && maxRate != null ? Math.round((maxRate - minRate) * 10) / 10 : null;

  return [
    trend
      ? `Le taux national est à ${summary.taux_national}% (${trend.up ? "hausse" : "baisse"} de ${Math.abs(trend.diff)} pt).`
      : "Le taux national est disponible, sans comparaison précédente.",
    spread != null
      ? `L'écart territorial atteint ${spread} pts entre ${summary.departement_min?.libelle} et ${summary.departement_max?.libelle}.`
      : "L'écart territorial entre départements est en cours de calcul.",
    summary.depuis
      ? `La série couvre ${new Date().getFullYear() - summary.depuis.annee} ans de données trimestrielles.`
      : "La profondeur historique est en cours de chargement.",
  ];
}