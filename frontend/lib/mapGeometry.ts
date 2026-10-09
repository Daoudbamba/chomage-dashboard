export type Position = [number, number];
type Ring = Position[];

export type DeptFeature = {
  type: "Feature";
  properties: { code: string; nom: string; codeRegion: string | null };
  geometry: { type: "Polygon"; coordinates: Ring[] } | { type: "MultiPolygon"; coordinates: Ring[][] };
};

export type DeptCollection = { type: "FeatureCollection"; features: DeptFeature[] };

export type Projection = { width: number; height: number; project: (p: Position) => [number, number] };

function positions(feature: DeptFeature): Position[] {
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  return polygons.flat(2) as unknown as Position[];
}

/** Equirectangular projection, longitudes compressed by cos(latitude moyenne) to limit the distortion. */
export function buildProjection(features: DeptFeature[], width = 600, padding = 8): Projection {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const feature of features) {
    for (const [lon, lat] of positions(feature)) {
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
  }
  if (!Number.isFinite(minLon)) return { width, height: width, project: () => [0, 0] };

  const xFactor = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const spanX = (maxLon - minLon) * xFactor;
  const spanY = maxLat - minLat;
  const scale = (width - 2 * padding) / spanX;
  const height = Math.round(spanY * scale + 2 * padding);

  return {
    width,
    height,
    project: ([lon, lat]) => [
      Math.round(((lon - minLon) * xFactor * scale + padding) * 10) / 10,
      Math.round(((maxLat - lat) * scale + padding) * 10) / 10,
    ],
  };
}

export function featurePath(feature: DeptFeature, project: Projection["project"]): string {
  const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  return polygons
    .flatMap((polygon) =>
      polygon.map((ring) => {
        const points = ring.map((p) => project(p).join(","));
        return `M${points.join("L")}Z`;
      })
    )
    .join("");
}

/** Sequential palette, light sand to deep coral. */
export const MAP_COLORS = ["#F6E7D8", "#F2C9A8", "#EEA27C", "#E27A55", "#BF4526"];

export function colorBin(value: number, min: number, max: number, bins = MAP_COLORS.length): number {
  if (max <= min) return 0;
  const ratio = (value - min) / (max - min);
  return Math.min(bins - 1, Math.max(0, Math.floor(ratio * bins)));
}
