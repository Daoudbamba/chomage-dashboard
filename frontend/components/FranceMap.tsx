"use client";

import { useEffect, useMemo, useState } from "react";
import { MAP_COLORS, buildProjection, colorBin, featurePath, type DeptCollection } from "../lib/mapGeometry";
import { frPct } from "../lib/regionInsights";

type DeptValue = { code: string; libelle: string; taux: number };

export default function FranceMap({
  valeurs,
  selectedRegionCode,
  selectedRegionLabel,
  onSelectRegion,
}: {
  valeurs: DeptValue[];
  selectedRegionCode: string | null;
  selectedRegionLabel: string;
  onSelectRegion: (regionCode: string) => void;
}) {
  const [collection, setCollection] = useState<DeptCollection | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/departements.json")
      .then((res) => res.json())
      .then(setCollection)
      .catch(() => setCollection(null));
  }, []);

  const rates = useMemo(() => new Map(valeurs.map((v) => [v.code, v])), [valeurs]);
  const { min, max } = useMemo(() => {
    const taux = valeurs.filter((v) => !v.code.startsWith("97")).map((v) => v.taux);
    return { min: Math.min(...taux), max: Math.max(...taux) };
  }, [valeurs]);

  const shapes = useMemo(() => {
    if (!collection) return null;
    const projection = buildProjection(collection.features);
    return {
      width: projection.width,
      height: projection.height,
      items: collection.features.map((feature) => ({
        code: feature.properties.code,
        nom: feature.properties.nom,
        codeRegion: feature.properties.codeRegion,
        d: featurePath(feature, projection.project),
      })),
    };
  }, [collection]);

  if (!shapes || !Number.isFinite(min)) {
    return <div className="aspect-square w-full bg-ink/5 animate-pulse" aria-hidden />;
  }

  const hoveredShape = shapes.items.find((s) => s.code === hovered);
  const hoveredValue = hovered ? rates.get(hovered) : undefined;
  const inSelectedRegion = (codeRegion: string | null) => codeRegion != null && codeRegion === selectedRegionCode;

  // The selected region is drawn last so its outline is not covered by its neighbours.
  const ordered = [...shapes.items].sort(
    (a, b) => Number(inSelectedRegion(a.codeRegion)) - Number(inSelectedRegion(b.codeRegion))
  );

  const step = (max - min) / MAP_COLORS.length;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr,1fr] items-center">
      <svg
        viewBox={`0 0 ${shapes.width} ${shapes.height}`}
        className="w-full max-w-[560px] mx-auto h-auto"
        role="img"
        aria-label="Carte du taux de chômage par département en France métropolitaine"
        onMouseLeave={() => setHovered(null)}
      >
        {ordered.map((shape) => {
          const value = rates.get(shape.code);
          const selected = inSelectedRegion(shape.codeRegion);
          return (
            <path
              key={shape.code}
              d={shape.d}
              fill={value ? MAP_COLORS[colorBin(value.taux, min, max)] : "#E5E1D8"}
              stroke={selected ? "#16202B" : "#FFFFFF"}
              strokeWidth={selected ? 1.6 : 0.7}
              strokeLinejoin="round"
              opacity={selectedRegionCode && !selected ? 0.78 : 1}
              className="cursor-pointer transition-opacity hover:opacity-100"
              onMouseEnter={() => setHovered(shape.code)}
              onClick={() => {
                setHovered(shape.code);
                if (shape.codeRegion) onSelectRegion(shape.codeRegion);
              }}
            />
          );
        })}
      </svg>

      <div>
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink/70 mb-2">
          {hoveredShape ? "Département" : "Région sélectionnée"}
        </p>
        <p className="font-display text-4xl leading-tight text-ink min-h-[2.5rem]">
          {hoveredShape ? hoveredShape.nom : selectedRegionLabel}
        </p>
        <p className="font-display text-6xl leading-none text-ink mt-3">
          {hoveredValue ? frPct(hoveredValue.taux) : " "}
        </p>
        <p className="text-sm text-ink/75 mt-3 min-h-[2.5rem]">
          {hoveredShape
            ? "Survolez ou touchez un autre département, cliquez pour afficher l'évolution de sa région."
            : "Survolez un département pour lire son taux, cliquez pour changer de région."}
        </p>

        <div className="mt-6" aria-hidden>
          <div className="flex h-3 w-full max-w-xs">
            {MAP_COLORS.map((color) => (
              <span key={color} className="flex-1" style={{ background: color }} />
            ))}
          </div>
          <div className="flex justify-between max-w-xs text-xs text-ink/70 mt-1.5">
            <span>{frPct(min)}</span>
            <span>{frPct(min + step * 2.5)}</span>
            <span>{frPct(max)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
