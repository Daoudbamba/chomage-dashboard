import { describe, expect, it } from "vitest";
import type { Summary } from "./api";
import { buildHighlights, computeTrend, formatRate } from "./insights";

const summaryFixture: Summary = {
  periode: { annee: 2026, trimestre: 2 },
  taux_national: 8.1,
  taux_national_precedent: 7.9,
  departement_min: { libelle: "CANTAL", taux: 4.8 },
  departement_max: { libelle: "GUYANE", taux: 20.4 },
  depuis: { annee: 1982, trimestre: 1 },
};

describe("computeTrend", () => {
  it("returns rounded trend direction from summary data", () => {
    expect(computeTrend(summaryFixture)).toEqual({ diff: 0.2, up: true });
  });

  it("returns null when one value is missing", () => {
    expect(computeTrend({ ...summaryFixture, taux_national_precedent: null })).toBeNull();
  });
});

describe("formatRate", () => {
  it("formats a numeric rate", () => {
    expect(formatRate(8.1)).toBe("8.1%");
  });

  it("returns a dash when rate is missing", () => {
    expect(formatRate(null)).toBe("—");
  });
});

describe("buildHighlights", () => {
  it("builds three narrative highlights", () => {
    const highlights = buildHighlights(summaryFixture);

    expect(highlights).toHaveLength(3);
    expect(highlights[0]).toContain("8.1%");
    expect(highlights[1]).toContain("15.6");
    expect(highlights[2]).toContain("ans");
  });
});
