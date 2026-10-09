import { describe, expect, it } from "vitest";
import { buildProjection, colorBin, featurePath, type DeptFeature } from "./mapGeometry";

const square: DeptFeature = {
  type: "Feature",
  properties: { code: "01", nom: "Test", codeRegion: "84" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [0, 40],
        [10, 40],
        [10, 50],
        [0, 50],
        [0, 40],
      ],
    ],
  },
};

describe("buildProjection", () => {
  it("fits the features in the requested width, north at the top", () => {
    const { width, height, project } = buildProjection([square], 600, 8);
    const [xMin, yBottom] = project([0, 40]);
    const [xMax, yTop] = project([10, 50]);
    expect(width).toBe(600);
    expect(xMin).toBe(8);
    expect(xMax).toBe(592);
    expect(yTop).toBe(8);
    expect(yBottom).toBeGreaterThan(yTop);
    expect(height).toBeCloseTo(yBottom + 8, 0);
  });

  it("does not crash on an empty collection", () => {
    expect(buildProjection([]).project([2, 46])).toEqual([0, 0]);
  });
});

describe("featurePath", () => {
  it("closes every ring and joins the parts of a multipolygon", () => {
    const multi: DeptFeature = {
      ...square,
      geometry: { type: "MultiPolygon", coordinates: [square.geometry.coordinates as never, square.geometry.coordinates as never] },
    };
    const path = featurePath(multi, ([x, y]) => [x, y]);
    expect(path.match(/M/g)).toHaveLength(2);
    expect(path.match(/Z/g)).toHaveLength(2);
  });
});

describe("colorBin", () => {
  it("maps the extremes to the first and last colour", () => {
    expect(colorBin(4, 4, 14)).toBe(0);
    expect(colorBin(14, 4, 14)).toBe(4);
    expect(colorBin(9, 4, 14)).toBe(2);
  });

  it("falls back to the first bin when the range is empty", () => {
    expect(colorBin(5, 5, 5)).toBe(0);
  });
});
