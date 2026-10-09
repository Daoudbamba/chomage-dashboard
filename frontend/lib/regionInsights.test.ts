import { describe, expect, it } from "vitest";
import type { PointSerie } from "./api";
import { fr, frPct, frSigned, rankDepartements, regionInsights, splitDepartements } from "./regionInsights";

const region: PointSerie[] = [
  { annee: 2025, trimestre: 2, taux: 7.1 },
  { annee: 2025, trimestre: 3, taux: 7.3 },
  { annee: 2026, trimestre: 1, taux: 7.6 },
  { annee: 2026, trimestre: 2, taux: 7.9 },
];

const national: PointSerie[] = [
  { annee: 2025, trimestre: 2, taux: 7.7 },
  { annee: 2026, trimestre: 2, taux: 8.1 },
];

describe("formatters", () => {
  it("uses the french decimal comma", () => {
    expect(fr(8.1)).toBe("8,1");
    expect(frPct(8.1)).toBe("8,1 %");
  });

  it("signs positive and negative deltas", () => {
    expect(frSigned(0.2)).toBe("+0,2");
    expect(frSigned(-0.4)).toBe("−0,4");
    expect(frSigned(null)).toBe("—");
  });
});

describe("regionInsights", () => {
  it("computes gap, one-year change and historical peak", () => {
    const result = regionInsights(region, national);

    expect(result.latest).toEqual({ annee: 2026, trimestre: 2, taux: 7.9 });
    expect(result.national).toBe(8.1);
    expect(result.gap).toBe(-0.2);
    expect(result.yearChange).toBe(0.8);
    expect(result.peak?.taux).toBe(7.9);
  });

  it("returns nulls on an empty series", () => {
    expect(regionInsights([], national)).toEqual({
      latest: null,
      national: null,
      gap: null,
      yearChange: null,
      peak: null,
    });
  });

  it("leaves the year change empty when the comparison quarter is missing", () => {
    expect(regionInsights(region.slice(2), national).yearChange).toBeNull();
  });
});

describe("departments", () => {
  const valeurs = [
    { code: "973", libelle: "GUYANE", taux: 20.4 },
    { code: "66", libelle: "PYRENEES-ORIENTALES", taux: 12.8 },
    { code: "15", libelle: "CANTAL", taux: 4.8 },
    { code: "93", libelle: "SEINE-SAINT-DENIS", taux: 11.4 },
  ];

  it("separates overseas departments from the mainland", () => {
    const { metropole, outreMer } = splitDepartements(valeurs);

    expect(outreMer.map((d) => d.libelle)).toEqual(["GUYANE"]);
    expect(metropole[0].libelle).toBe("PYRENEES-ORIENTALES");
  });

  it("ranks highest or lowest first", () => {
    expect(rankDepartements(valeurs, "high", 2).map((d) => d.libelle)).toEqual(["GUYANE", "PYRENEES-ORIENTALES"]);
    expect(rankDepartements(valeurs, "low", 1).map((d) => d.libelle)).toEqual(["CANTAL"]);
  });
});
